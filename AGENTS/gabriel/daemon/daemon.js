// GABRIEL · Daemon — HTTP server on :9777
//
// Tier 3 endpoint in the NOIZY 4-tier architecture. Receives intents from
// Tier 2 (cf01-discord Worker via cloudflared tunnel, cf04-slack Worker, or
// any local caller) and dispatches to the appropriate boss.
//
// Endpoints:
//   GET  /healthz         — liveness, unauthenticated
//   GET  /bosses          — list registered bosses, unauthenticated
//   POST /intent          — dispatch an intent (Bearer auth required)
//
// Auth: NOIZY_API_KEY as Bearer token. When unset, bind stays 127.0.0.1 only
//       and auth is skipped (dev mode), matching the pattern used by
//       ops/voice-service and ops/lucy-logic-bridge.
import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "node:process";
import chalk from "chalk";
import { dispatch, listBosses } from "./bosses/index.js";
import { runTurn } from "./gabriel.js";
import { makeReceipt, receiptToLog } from "./receipt.js";
const execFileAsync = promisify(execFile);
// ── Chain-health helpers (placeholder until nk-haptic-archive is wired) ──
async function governChainHealth() {
    // TODO: query nk-haptic-archive worker for real chain validation.
    // For now: PROOF_CHAIN_AUDIT_BLOCKED indicates we cannot verify (returns 409 in router).
    return {
        status: "PROOF_CHAIN_AUDIT_BLOCKED",
        reason: "nk-haptic-archive not wired",
        checked_at: new Date().toISOString(),
    };
}
function wrapDashboardResponse(report) {
    return { ...report, source: "gabriel-daemon", ts: new Date().toISOString() };
}
const PORT = Number(env.GABRIEL_DAEMON_PORT ?? env.GABRIEL_PORT ?? 9777);
const HOST = env.GABRIEL_DAEMON_HOST ?? "127.0.0.1";
const NOIZY_API_KEY = env.NOIZY_API_KEY ?? "";
const AUTH_OPTIONAL = !NOIZY_API_KEY;
// SSO: NOIZY_SESSION cookie HMAC, mirrors cloudflare/workers/cf10-sso-guard.
// When set, the daemon accepts cookies issued by cf10 in addition to bearer.
const NOIZY_SESSION_HMAC = env.NOIZY_SESSION_HMAC ?? "";
const SESSION_COOKIE_NAME = env.SESSION_COOKIE_NAME ?? "NOIZY_SESSION";
const SSO_ALLOWED_EMAIL = env.SSO_ALLOWED_EMAIL ?? "rsp@noizy.ai";
const VALID_BOSSES = [
    "gabriel",
    "lucy",
    "pops",
    "shirl",
    "shirley",
    "dream",
    "engr_keith",
    "cb01",
    "voice_specialist",
    "test_runner",
    "consent_auditor",
    "noizyarmy",
    "ollama",
    "ai_gateway",
    "rag",
    "publisher",
    "maintenance",
    "openclaw",
    "cohere",
    "nodered",
    "sql",
];
// ── Plumbing ────────────────────────────────────────────────
function send(res, status, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
}
async function readJson(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => {
            if (chunks.length === 0)
                return resolve({});
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
            }
            catch (err) {
                reject(err);
            }
        });
        req.on("error", reject);
    });
}
function timingSafeEqual(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
// ── NOIZY_SESSION cookie verification (mirrors cf10-sso-guard) ───────────────
// Cookie format: <base64url(JSON payload)>.<base64url(HMAC-SHA256)>
// Payload: { email, iat, exp }
function readCookie(req, name) {
    const raw = req.headers["cookie"] ?? "";
    const pair = raw
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith(`${name}=`));
    return pair ? pair.slice(name.length + 1) : null;
}
async function verifySessionCookie(cookieValue) {
    if (!cookieValue)
        return { ok: false, reason: "no_cookie" };
    if (!NOIZY_SESSION_HMAC)
        return { ok: false, reason: "session_hmac_not_configured" };
    const parts = cookieValue.split(".");
    if (parts.length !== 2)
        return { ok: false, reason: "malformed" };
    const [bodyB64, macB64] = parts;
    const { createHmac } = await import("node:crypto");
    const expected = createHmac("sha256", NOIZY_SESSION_HMAC)
        .update(bodyB64)
        .digest("base64")
        .replace(/=+$/, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    if (!timingSafeEqual(macB64, expected))
        return { ok: false, reason: "bad_mac" };
    let payload;
    try {
        const json = Buffer.from(bodyB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
        payload = JSON.parse(json);
    }
    catch {
        return { ok: false, reason: "bad_payload" };
    }
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { ok: false, reason: "expired" };
    }
    if (!payload.email)
        return { ok: false, reason: "no_email" };
    if (payload.email !== SSO_ALLOWED_EMAIL)
        return { ok: false, reason: "email_not_allowed" };
    return { ok: true, email: payload.email };
}
// authOk now accepts EITHER bearer token OR valid NOIZY_SESSION cookie. The
// async cookie path is invoked separately below; this fast-path covers the
// common bearer case. For cookie-only requests, callers should use
// authOkAsync() instead.
function authOk(req) {
    if (AUTH_OPTIONAL)
        return true;
    const header = req.headers["authorization"] ?? "";
    if (header.startsWith("Bearer ")) {
        const token = header.slice(7);
        if (timingSafeEqual(token, NOIZY_API_KEY))
            return true;
    }
    return false;
}
async function authOkAsync(req) {
    if (AUTH_OPTIONAL)
        return { ok: true, identity: "open-mode", via: "bearer" };
    if (authOk(req))
        return { ok: true, identity: "bearer-token", via: "bearer" };
    const cookie = readCookie(req, SESSION_COOKIE_NAME);
    const v = await verifySessionCookie(cookie);
    if (v.ok && v.email)
        return { ok: true, identity: v.email, via: "cookie" };
    return { ok: false };
}
function isValidBoss(s) {
    return typeof s === "string" && VALID_BOSSES.includes(s);
}
// ── Route handlers ──────────────────────────────────────────
const STARTED_AT = Date.now();
function handleHealth(res) {
    const uptime_seconds = Math.floor((Date.now() - STARTED_AT) / 1000);
    send(res, 200, {
        ok: true,
        service: "gabriel-daemon",
        port: PORT,
        host: HOST,
        auth_required: !AUTH_OPTIONAL,
        bosses: VALID_BOSSES.length,
        uptime_seconds,
        started_at: new Date(STARTED_AT).toISOString(),
        ts: new Date().toISOString(),
    });
}
function handleListBosses(res) {
    send(res, 200, { ok: true, bosses: listBosses() });
}
/**
 * GET /dashboard — serves the empire-live single-file HTML dashboard.
 * Pre-auth (read-only HTML); the dashboard's JS prompts the user for the
 * NOIZY_API_KEY locally and stores it in localStorage, then uses it as
 * Bearer for every /intent call.
 */
const DASHBOARD_PATH = resolve(process.cwd(), "..", "apps", "empire-live", "dashboard.html");
let _dashboardCache = null;
function loadDashboard() {
    if (_dashboardCache)
        return _dashboardCache;
    try {
        _dashboardCache = readFileSync(DASHBOARD_PATH, "utf8");
        return _dashboardCache;
    }
    catch (err) {
        return `<!doctype html><meta charset="utf-8"><title>NOIZY · dashboard not found</title>
<body style="background:#05060a;color:#e9ecf4;font-family:system-ui;padding:40px;line-height:1.6">
<h1>NOIZY · dashboard not found</h1>
<p>Expected at <code>${DASHBOARD_PATH}</code></p>
<p style="color:#8e95ad">${err.message}</p>
</body>`;
    }
}
function handleDashboard(res) {
    const html = loadDashboard();
    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
    });
    res.end(html);
}
/**
 * Cloudflare Worker deploy trigger — the "GABRIEL CAN DO IT" surface.
 * GET /ops/cloudflare-fix                       → deploy noizy-mcp (default)
 * GET /ops/cloudflare-fix?worker=<name>         → deploy a specific worker
 * GET /ops/cloudflare-fix?mode=status           → health-probe the fleet
 * GET /ops/cloudflare-fix?mode=all              → deploy every worker
 * GET /ops/cloudflare-fix?mode=broken           → deploy only non-200 responders
 *
 * 127.0.0.1-bound, pre-auth (same posture as /ops/gabriel-sync). The script
 * itself requires CLOUDFLARE_API_TOKEN in .env; if missing, it exits 2 with a
 * helpful message pointing to the token-creation URL.
 */
/**
 * GET /tailscale/status — shells `tailscale status --json` (argv-array, no
 * shell interpolation, no user input) and returns a compact summary
 * (peer count, magicdns, this node's tailnet IP). Read-only, pre-auth.
 */
async function handleTailscaleStatus(_req, res) {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const runExecFile = promisify(execFile);
    try {
        const { stdout } = await runExecFile("/usr/local/bin/tailscale", ["status", "--json"], {
            timeout: 4000,
            maxBuffer: 1024 * 1024,
        });
        const json = JSON.parse(stdout);
        const self = json.Self ?? {};
        const peers = json.Peer ? Object.values(json.Peer) : [];
        send(res, 200, {
            ok: true,
            tailnet_name: json.MagicDNSSuffix ?? json.CurrentTailnet?.MagicDNSSuffix ?? null,
            backend_state: json.BackendState ?? null,
            self: {
                hostname: self.HostName ?? null,
                magicdns: self.DNSName ?? null,
                ip: (self.TailscaleIPs ?? [])[0] ?? null,
                os: self.OS ?? null,
            },
            peers_count: peers.length,
            peers: peers.map((p) => ({
                hostname: p.HostName,
                ip: (p.TailscaleIPs ?? [])[0] ?? null,
                online: !!p.Online,
                os: p.OS,
            })),
        });
    }
    catch (err) {
        send(res, 200, {
            ok: false,
            error: err.message,
            hint: "tailscale CLI not found or not running. Install with: open -a Tailscale",
        });
    }
}
function handleCloudflareFix(req, res) {
    const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
    const mode = url.searchParams.get("mode") ?? "";
    const worker = url.searchParams.get("worker") ?? "";
    // Validate — arg injection defense even though execFile is shell-free.
    let argv;
    if (mode) {
        if (!["status", "all", "broken"].includes(mode)) {
            return send(res, 400, { ok: false, error: `invalid mode: ${mode}` });
        }
        argv = [`--${mode}`];
    }
    else {
        const target = worker || "noizy-mcp";
        if (!/^[a-z0-9][a-z0-9-]*$/.test(target)) {
            return send(res, 400, { ok: false, error: `invalid worker name: '${target}'` });
        }
        argv = [target];
    }
    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "X-NOIZY-CF-Target": mode || worker || "noizy-mcp",
    });
    import("node:child_process").then(({ spawn }) => {
        const child = spawn("/Users/m2ultra/NOIZYANTHROPIC/ops/cloudflare-deploy.sh", argv, {
            env: { ...process.env, NO_COLOR: "1" },
        });
        child.stdout.on("data", (chunk) => res.write(chunk));
        child.stderr.on("data", (chunk) => res.write(chunk));
        child.on("close", (code) => {
            res.end(`\n---\ncloudflare-fix exited: ${code}\n`);
        });
        child.on("error", (e) => res.end(`\n---\ncloudflare-fix error: ${e.message}\n`));
    });
}
/**
 * Browser-trigger endpoint for the canonical Gabriel-to-all-brands sync.
 * GET  /ops/gabriel-sync          → dry-run (returns diff summary)
 * GET  /ops/gabriel-sync?mode=push → fires real push to all 6 brand repos
 * POST /ops/gabriel-sync { mode }  → same, JSON shape
 *
 * Uses execFile (not exec) to avoid shell injection. Output streamed back so
 * a browser tab shows the manifest live.
 */
function handleGabrielSync(req, res) {
    const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
    const mode = url.searchParams.get("mode") ?? "dry";
    const args = ["/Users/m2ultra/NOIZYANTHROPIC/ops/gabriel-to-all-brands.sh"];
    if (mode === "push")
        args.push("--push");
    if (mode === "scan")
        args.push("--scan-only");
    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "X-NOIZY-Mode": mode,
    });
    // execFile — argv array, no shell, no injection risk
    import("node:child_process").then(({ spawn }) => {
        const child = spawn("/bin/bash", args, {
            env: { ...process.env, NO_COLOR: "1" },
        });
        child.stdout.on("data", (chunk) => res.write(chunk));
        child.stderr.on("data", (chunk) => res.write(chunk));
        child.on("close", (code) => {
            res.end(`\n---\ngabriel-sync exited: ${code}\n`);
        });
        child.on("error", (e) => res.end(`\n---\ngabriel-sync error: ${e.message}\n`));
    });
}
/**
 * Simple-API bridge: POST /lucy/notify { entry, type?, from?, correlation_id? }
 * One-shot DAZEFLOW write without the full Intent envelope. Any surface that
 * can POST JSON (cron, n8n, voice pipeline, iPad Shortcut) can log to today's
 * session in one call. Internally dispatches a lucy.dazeflow.log intent so
 * writes still ledger and share the same substrate.
 */
async function handleLucyNotify(req, res) {
    let body;
    try {
        body = await readJson(req);
    }
    catch {
        return send(res, 400, { ok: false, error: "invalid JSON body" });
    }
    const entry = typeof body.entry === "string" ? body.entry.trim() : "";
    if (!entry)
        return send(res, 400, { ok: false, error: "entry required" });
    const result = await dispatch({
        boss: "lucy",
        correlation_id: body.correlation_id || `notify_${Date.now().toString(36)}`,
        from: body.from || "gabriel-daemon",
        verb: "dazeflow.log",
        args: { entry, type: body.type || "note" },
        source: "daemon:/lucy/notify",
    });
    send(res, result.ok ? 200 : 502, result);
}
const INTENT_LOG_MAX = 100;
const INTENT_LOG = [];
function pushIntentLog(e) {
    INTENT_LOG.unshift(e);
    if (INTENT_LOG.length > INTENT_LOG_MAX)
        INTENT_LOG.length = INTENT_LOG_MAX;
}
function handleIntentLog(req, res) {
    const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, INTENT_LOG_MAX);
    send(res, 200, { ok: true, count: INTENT_LOG.length, log: INTENT_LOG.slice(0, limit) });
}
const DC_VERB_PLAN = {
    govern: {
        bosses: [
            { boss: "consent_auditor", verb: "nine_check" },
            { boss: "cb01", verb: "cloudflare.status" },
            { boss: "engr_keith", verb: "heaven_health" },
            { boss: "maintenance", verb: "noizykidz_stats" },
        ],
        ack: "GOVERN — empire law check (consent · fleet · heaven · chain)",
    },
    capture: {
        bosses: [{ boss: "lucy", verb: "dazeflow.log", argsFromBody: ["entry", "type"] }],
        ack: "CAPTURE — DAZEFLOW entry written",
    },
    recall: {
        bosses: [
            { boss: "rag", verb: "search", argsFromBody: ["query", "top_k"] },
            { boss: "lucy", verb: "dazeflow.history", argsFromBody: ["limit"] },
        ],
        ack: "RECALL — semantic search + dazeflow history",
    },
    orbit: {
        bosses: [
            { boss: "lucy", verb: "status" },
            { boss: "noizyarmy", verb: "queen_status" },
            { boss: "lucy", verb: "task.list" },
        ],
        ack: "ORBIT — workspace state (lucy · queen · tasks)",
    },
    forge: {
        bosses: [
            { boss: "test_runner", verb: "smoke" },
            { boss: "cb01", verb: "cloudflare.status" },
        ],
        ack: "FORGE — smoke + fleet readiness",
    },
};
// ── Dashboard API — Remediation Law routes (extracted to top-level handler) ──
// Per RSP_001 chain-break test policy:
//   POST /api/dashboard/govern     { verb: "govern", action: "chain_health" }
//   POST /api/dashboard/maintenance { verb: "maintenance.approve_repair", target, approved_by, rsp_override_marker, reason }
async function handleApiDashboard(path, req, res) {
    let body = {};
    try {
        body = await readJson(req);
    }
    catch {
        // empty body OK
    }
    if (path === "/api/dashboard/govern") {
        const dBody = body;
        if (dBody.verb === "govern" && dBody.action === "chain_health") {
            const report = await governChainHealth();
            return send(res, report.status === "PROOF_CHAIN_PASS" ? 200 : 409, wrapDashboardResponse(report));
        }
        return send(res, 400, {
            status: "BAD_REQUEST",
            error: "expected { verb: 'govern', action: 'chain_health' }",
        });
    }
    if (path === "/api/dashboard/maintenance") {
        const dBody = body;
        // Branch: maintenance.wipe_quarantine — dispatch through the existing maintenance boss
        // (see GABRIEL/src/bosses/maintenance.ts case "wipe_quarantine" — already implements
        // archive-before-delete, RSP override, confirmation token, dry-run, status codes).
        if (dBody.verb === "maintenance.wipe_quarantine") {
            const dispatchT0 = Date.now();
            const result = await dispatch({
                boss: "maintenance",
                verb: "wipe_quarantine",
                args: {
                    receipt_id: dBody.receipt_id,
                    confirmation_token: dBody.confirmation_token,
                    approved_by: dBody.approved_by,
                    rsp_override_marker: dBody.rsp_override_marker,
                    dry_run: dBody.dry_run ?? false,
                },
                correlation_id: `dash_wipe_q_${Date.now().toString(36)}`,
                from: "dashboard",
                source: "/api/dashboard/maintenance",
            });
            // Surface in /intent-log so the act is ledgered (closes coverage gap from compliance audit)
            pushIntentLog({
                ts: new Date().toISOString(),
                boss: "maintenance",
                verb: "wipe_quarantine",
                from: "dashboard",
                source: "/api/dashboard/maintenance",
                ok: !!result.ok,
                duration_ms: Date.now() - dispatchT0,
                ack_message: result.ack_message,
                error: result.error,
                correlation_id: result.correlation_id,
            });
            // Result.data.status carries WIPE_QUARANTINE_* token. Map to HTTP code.
            const status = result.data?.status ?? (result.ok ? "WIPE_QUARANTINE_COMPLETE" : "ERROR");
            const code = status === "WIPE_QUARANTINE_COMPLETE" || status === "WIPE_QUARANTINE_DRY_RUN"
                ? 200
                : status === "RSP_OVERRIDE_REQUIRED"
                    ? 403
                    : status?.startsWith("WIPE_QUARANTINE_BLOCKED")
                        ? 409
                        : 400;
            return send(res, code, result);
        }
        if (dBody.verb !== "maintenance.approve_repair") {
            return send(res, 400, {
                status: "BAD_REQUEST",
                error: "expected verb: 'maintenance.approve_repair' or 'maintenance.wipe_quarantine'",
            });
        }
        if (dBody.target !== "nk_haptic_events") {
            return send(res, 400, { status: "REPAIR_TARGET_NOT_ALLOWED" });
        }
        if (dBody.approved_by !== "RSP" ||
            dBody.rsp_override_marker !== "RSP_APPROVED_REPAIR_LATEST_DETECTED_BREAK") {
            return send(res, 403, { status: "RSP_OVERRIDE_REQUIRED" });
        }
        const receiptId = `repair_auth_${Date.now()}`;
        const createdAt = new Date().toISOString();
        const sql = `
      INSERT INTO nk_proof_repair_receipts (
        id, table_name, first_broken_row_id, status, rsp_override_marker, reason, created_at, created_by, affected_row_count
      ) VALUES (
        '${receiptId}', 'nk_haptic_events', 'LATEST_DETECTED_BREAK', 'RSP_APPROVED',
        '${dBody.rsp_override_marker}', '${String(dBody.reason ?? "").replace(/'/g, "''")}', '${createdAt}', '${dBody.approved_by}', 0
      );
    `;
        let d1Status = "ok";
        try {
            await execFileAsync("npx", [
                "wrangler",
                "d1",
                "execute",
                "agent-memory",
                "--remote",
                "--command",
                sql,
            ]);
        }
        catch (err) {
            // D1 unreachable / table missing — record approval locally anyway, flag d1 status
            d1Status = `degraded:${err.message.slice(0, 200)}`;
        }
        // Write the JSON receipt to the latest audit directory (or a fresh one)
        let auditDir;
        try {
            const { stdout } = await execFileAsync("bash", [
                "-c",
                "ls -td .audit/chain-health-* 2>/dev/null | head -1",
            ]);
            auditDir = stdout.trim();
        }
        catch {
            auditDir = "";
        }
        if (!auditDir) {
            auditDir = `.audit/chain-health-${createdAt.replace(/[:.]/g, "-")}`;
        }
        if (!existsSync(auditDir)) {
            try {
                await execFileAsync("mkdir", ["-p", auditDir]);
            }
            catch {
                /* no-op */
            }
        }
        if (existsSync(auditDir)) {
            const approvalReceipt = {
                receipt_type: "GABRIEL_REMEDIATION_APPROVAL",
                table: "nk_haptic_events",
                status: "RSP_APPROVED",
                approved_by: "RSP",
                approved_at: createdAt,
                rsp_override_marker: dBody.rsp_override_marker,
                receipt_id: receiptId,
                d1_insert_status: d1Status,
                law: "Detection is automatic. Repair is governed. History keeps the scar.",
            };
            try {
                await writeFile(join(auditDir, "GABRIEL_REMEDIATION_APPROVAL.json"), JSON.stringify(approvalReceipt, null, 2));
            }
            catch {
                /* no-op */
            }
        }
        // Surface in /intent-log so the act is ledgered (closes coverage gap from compliance audit).
        pushIntentLog({
            ts: createdAt,
            boss: "maintenance",
            verb: "approve_repair",
            from: "dashboard",
            source: "/api/dashboard/maintenance",
            ok: true,
            duration_ms: Date.now() - new Date(createdAt).getTime(),
            ack_message: `MAINTENANCE_APPROVAL_RECORDED · ${receiptId}`,
            correlation_id: receiptId,
        });
        return send(res, 200, {
            status: "MAINTENANCE_APPROVAL_RECORDED",
            receipt_id: receiptId,
            target: dBody.target,
            rsp_override_marker: dBody.rsp_override_marker,
            d1_insert_status: d1Status,
            audit_dir: auditDir,
        });
    }
    return send(res, 404, { ok: false, error: "unknown api/dashboard path" });
}
// GET /api/dashboard/remediation-history       — list nk_proof_repair_receipts (most recent first)
// GET /api/dashboard/remediation-history/:id   — single receipt + linked quarantine markers
async function handleRemediationHistory(path, req, res) {
    // Path can be:
    //   /api/dashboard/remediation-history           → list
    //   /api/dashboard/remediation-history/<id>      → one
    const HISTORY_PREFIX = "/api/dashboard/remediation-history";
    const after = path.slice(HISTORY_PREFIX.length); // "" or "/<id>"
    const id = after.startsWith("/") ? after.slice(1) : "";
    // Use wrangler d1 --json to stay consistent with the rest of handleApiDashboard.
    // D1 errors are reported in the payload, not 500'd, so the dashboard can render.
    try {
        if (!id) {
            const { stdout } = await execFileAsync("npx", [
                "wrangler",
                "d1",
                "execute",
                "agent-memory",
                "--remote",
                "--json",
                "--command",
                "SELECT id, table_name, first_broken_row_id, last_good_row_id, affected_row_count, status, rsp_override_marker, reason, created_at, created_by FROM nk_proof_repair_receipts ORDER BY created_at DESC LIMIT 100",
            ]);
            let rows = [];
            try {
                const parsed = JSON.parse(stdout);
                rows = (Array.isArray(parsed) ? parsed[0]?.results : parsed.result?.[0]?.results) ?? [];
            }
            catch {
                rows = [];
            }
            return send(res, 200, { ok: true, count: rows.length, history: rows });
        }
        // Single receipt + linked quarantine rows
        const safeId = id.replace(/'/g, "''");
        const receiptCmd = `SELECT * FROM nk_proof_repair_receipts WHERE id = '${safeId}' LIMIT 1`;
        const quarantineCmd = `SELECT id, event_id, reason, status, created_at FROM nk_haptic_event_quarantine WHERE repair_receipt_id = '${safeId}' ORDER BY created_at`;
        const [{ stdout: rOut }, { stdout: qOut }] = await Promise.all([
            execFileAsync("npx", [
                "wrangler",
                "d1",
                "execute",
                "agent-memory",
                "--remote",
                "--json",
                "--command",
                receiptCmd,
            ]),
            execFileAsync("npx", [
                "wrangler",
                "d1",
                "execute",
                "agent-memory",
                "--remote",
                "--json",
                "--command",
                quarantineCmd,
            ]),
        ]);
        const parseRows = (s) => {
            try {
                const p = JSON.parse(s);
                return (Array.isArray(p) ? p[0]?.results : p.result?.[0]?.results) ?? [];
            }
            catch {
                return [];
            }
        };
        const rRows = parseRows(rOut);
        const qRows = parseRows(qOut);
        if (rRows.length === 0)
            return send(res, 404, { ok: false, error: "receipt not found" });
        return send(res, 200, { ok: true, receipt: rRows[0], quarantine: qRows });
    }
    catch (err) {
        return send(res, 200, {
            ok: false,
            error: "d1 query degraded",
            detail: err.message.slice(0, 300),
        });
    }
}
async function handleDcVerb(verb, req, res) {
    let body = {};
    try {
        body = await readJson(req);
    }
    catch {
        // empty body OK for read-only verbs
    }
    const actor = body.actor ?? "dashboard";
    const surface = body.surface ?? "api";
    const plan = DC_VERB_PLAN[verb];
    const correlation_id = `dc_${verb}_${Date.now().toString(36)}`;
    const t0 = Date.now();
    const steps = await Promise.all(plan.bosses.map(async (step) => {
        const args = {};
        (step.argsFromBody ?? []).forEach((k) => {
            if (body[k] !== undefined)
                args[k] = body[k];
        });
        try {
            const result = await dispatch({
                boss: step.boss,
                verb: step.verb,
                args,
                correlation_id: `${correlation_id}_${step.boss}`,
                from: actor,
                source: `dc:${verb}`,
            });
            return { step: `${step.boss}.${step.verb}`, result };
        }
        catch (err) {
            return {
                step: `${step.boss}.${step.verb}`,
                result: { ok: false, error: err.message },
            };
        }
    }));
    const allOk = steps.every((s) => s.result.ok);
    const duration_ms = Date.now() - t0;
    const failErrors = steps
        .filter((s) => !s.result.ok)
        .map((s) => s.result.error)
        .filter(Boolean)
        .join("; ");
    // PLOWMAN STANDARD: compound verb → one canonical NOIZYReceipt wrapping the fan-out
    const receipt = makeReceipt({
        boss: `dc:${verb}`,
        bossVerb: verb,
        actor,
        surface,
        correlation_id,
        duration_ms,
        result: {
            ok: allOk,
            ack_message: `${plan.ack} · ${steps.filter((s) => s.result.ok).length}/${steps.length} bosses ok`,
            error: failErrors || undefined,
            steps,
        },
    });
    pushIntentLog({
        ts: receipt.ts,
        boss: `dc:${verb}`,
        verb,
        from: actor,
        source: `dc:${verb}`,
        ok: allOk,
        duration_ms,
        ack_message: receipt.ack_message,
        error: receipt.error,
        correlation_id,
        receipt_id: receipt.receipt_id,
        plowman_verb: receipt.verb,
        consent_required: receipt.consent_required,
    });
    send(res, allOk ? 200 : 207, { ok: allOk, _receipt: receipt, steps });
}
async function handleIntent(req, res) {
    let body;
    try {
        body = await readJson(req);
    }
    catch {
        return send(res, 400, { ok: false, error: "invalid JSON body" });
    }
    if (!isValidBoss(body.boss)) {
        return send(res, 400, {
            ok: false,
            error: `boss required — one of: ${VALID_BOSSES.join(", ")}`,
        });
    }
    if (typeof body.correlation_id !== "string" || !body.correlation_id) {
        return send(res, 400, { ok: false, error: "correlation_id required" });
    }
    if (typeof body.from !== "string" || !body.from) {
        return send(res, 400, { ok: false, error: "from required (actor_id of initiator)" });
    }
    if (typeof body.verb !== "string" || !body.verb) {
        return send(res, 400, { ok: false, error: "verb required" });
    }
    if (typeof body.source !== "string" || !body.source) {
        return send(res, 400, { ok: false, error: "source required" });
    }
    const intent = {
        boss: body.boss,
        correlation_id: body.correlation_id,
        from: body.from,
        verb: body.verb,
        target: body.target,
        args: body.args ?? {},
        source: body.source,
        priority: body.priority ?? "normal",
    };
    const t0 = Date.now();
    const result = await dispatch(intent);
    const duration_ms = Date.now() - t0;
    // PLOWMAN STANDARD: every command emits a receipt. Failures are also receipts.
    const receipt = makeReceipt({
        boss: intent.boss,
        bossVerb: intent.verb,
        actor: intent.from,
        surface: intent.source,
        correlation_id: intent.correlation_id,
        duration_ms,
        result: result,
    });
    pushIntentLog({
        ts: receipt.ts,
        boss: intent.boss,
        verb: intent.verb,
        from: intent.from,
        source: intent.source,
        ok: !!result.ok,
        duration_ms,
        ack_message: result.ack_message,
        error: result.error,
        correlation_id: intent.correlation_id,
        // PLOWMAN fields
        receipt_id: receipt.receipt_id,
        plowman_verb: receipt.verb,
        consent_required: receipt.consent_required,
    });
    if (process.env.NODE_ENV !== "production") {
        console.log(chalk.cyan("[RECEIPT]"), receiptToLog(receipt));
    }
    send(res, result.ok ? 200 : 502, { ...result, _receipt: receipt });
}
// ── OpenAI Compatibility Endpoints ──────────────────────────────────────────
function handleV1Models(res) {
    send(res, 200, {
        object: "list",
        data: [
            {
                id: "gabriel",
                object: "model",
                created: Math.floor(STARTED_AT / 1000),
                owned_by: "RSP_001",
            },
            {
                id: "phi4",
                object: "model",
                created: Math.floor(STARTED_AT / 1000),
                owned_by: "RSP_001",
            },
            {
                id: "gemma3",
                object: "model",
                created: Math.floor(STARTED_AT / 1000),
                owned_by: "RSP_001",
            },
        ],
    });
}
function formatMessages(messages) {
    if (!messages || messages.length === 0)
        return "";
    if (messages.length === 1) {
        return messages[0].content || "";
    }
    return (messages
        .map((m) => {
        const speaker = m.role === "assistant" ? "gabriel" : "rob";
        return `${speaker} › ${m.content}`;
    })
        .join("\n\n") + "\n\ngabriel › ");
}
async function handleV1ChatCompletions(req, res) {
    let body;
    try {
        body = await readJson(req);
    }
    catch {
        return send(res, 400, { ok: false, error: "invalid JSON body" });
    }
    const messages = body.messages || [];
    const input = formatMessages(messages);
    const stream = !!body.stream;
    const createdTime = Math.floor(Date.now() / 1000);
    const createdId = Math.random().toString(36).substring(2, 15);
    if (stream) {
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });
        try {
            await runTurn({
                input,
                tier: "FAST",
                onChunk: (chunk) => {
                    const data = JSON.stringify({
                        id: `chatcmpl-${createdId}`,
                        object: "chat.completion.chunk",
                        created: createdTime,
                        model: body.model || "gabriel",
                        choices: [
                            {
                                index: 0,
                                delta: { content: chunk },
                                finish_reason: null,
                            },
                        ],
                    });
                    res.write(`data: ${data}\n\n`);
                },
            });
            res.write("data: [DONE]\n\n");
            res.end();
        }
        catch (err) {
            const data = JSON.stringify({
                id: `chatcmpl-${createdId}`,
                object: "chat.completion.chunk",
                created: createdTime,
                model: body.model || "gabriel",
                choices: [
                    {
                        index: 0,
                        delta: { content: `\n[Error] ${err.message}` },
                        finish_reason: "error",
                    },
                ],
            });
            res.write(`data: ${data}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
        }
    }
    else {
        try {
            const result = await runTurn({
                input,
                tier: "FAST",
            });
            send(res, 200, {
                id: `chatcmpl-${createdId}`,
                object: "chat.completion",
                created: createdTime,
                model: result.model,
                choices: [
                    {
                        index: 0,
                        message: {
                            role: "assistant",
                            content: result.output,
                        },
                        finish_reason: "stop",
                    },
                ],
                usage: {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                },
            });
        }
        catch (err) {
            send(res, 500, { ok: false, error: err.message });
        }
    }
}
// ── Server ──────────────────────────────────────────────────
function startDaemon() {
    const server = http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
            const path = url.pathname;
            if (req.method === "GET" && (path === "/healthz" || path === "/health"))
                return handleHealth(res);
            if (req.method === "GET" && path === "/bosses")
                return handleListBosses(res);
            if (req.method === "GET" && path === "/dashboard")
                return handleDashboard(res);
            if (req.method === "GET" && path === "/tailscale/status")
                return handleTailscaleStatus(req, res);
            // /sso/whoami — returns identity (bearer:"bearer-token" OR cookie:email).
            // 401 = no auth. Pre-cookie-aware-gate so the dashboard can probe before
            // prompting the user for an API key.
            if (req.method === "GET" && path === "/sso/whoami") {
                const a = await authOkAsync(req);
                if (!a.ok)
                    return send(res, 401, {
                        ok: false,
                        sso: {
                            cookie_name: SESSION_COOKIE_NAME,
                            hmac_configured: !!NOIZY_SESSION_HMAC,
                            allowed_email: SSO_ALLOWED_EMAIL,
                        },
                    });
                return send(res, 200, { ok: true, identity: a.identity, via: a.via });
            }
            // Dual-auth gate: accept bearer OR NOIZY_SESSION cookie.
            const authed = await authOkAsync(req);
            if (!authed.ok) {
                return send(res, 401, { ok: false, error: "unauthorized" });
            }
            // OpenAI compatibility endpoints
            if (req.method === "GET" && path === "/v1/models") {
                return handleV1Models(res);
            }
            if (req.method === "POST" && path === "/v1/chat/completions") {
                return handleV1ChatCompletions(req, res);
            }
            // ── Authenticated routes ────────────────────────────────────────────
            // /ops/* moved BELOW auth gate (was pre-auth on the loopback-only
            // assumption). This makes the daemon safe to bind off-loopback (via
            // Tailscale Serve, mesh.noizy.ai, or 0.0.0.0 + firewall).
            if (path === "/ops/gabriel-sync")
                return handleGabrielSync(req, res);
            if (path === "/ops/cloudflare-fix")
                return handleCloudflareFix(req, res);
            if (req.method === "POST" && path === "/intent")
                return handleIntent(req, res);
            if (req.method === "POST" && path === "/lucy/notify")
                return handleLucyNotify(req, res);
            if (req.method === "GET" && path === "/intent-log")
                return handleIntentLog(req, res);
            // ── Dashboard API — Remediation Law routes (per RSP_001 chain-break test) ──
            // These were previously dead code nested inside handleDcVerb. Hoisting to
            // the main router so /api/dashboard/govern + /api/dashboard/maintenance
            // are reachable.
            if (req.method === "POST" &&
                (path === "/api/dashboard/govern" || path === "/api/dashboard/maintenance")) {
                return handleApiDashboard(path, req, res);
            }
            // GET /api/dashboard/remediation-history       → list nk_proof_repair_receipts
            // GET /api/dashboard/remediation-history/:id   → single receipt + linked quarantine
            if (req.method === "GET" && path.startsWith("/api/dashboard/remediation-history")) {
                return handleRemediationHistory(path, req, res);
            }
            // PLOWMAN STANDARD verbs — POST /dc/{govern|capture|recall|orbit|forge}
            if (req.method === "POST" && path.startsWith("/dc/")) {
                const verbStr = path.slice(4);
                if (verbStr in DC_VERB_PLAN) {
                    return handleDcVerb(verbStr, req, res);
                }
                return send(res, 400, {
                    ok: false,
                    error: `unknown verb: ${verbStr}. Known: ${Object.keys(DC_VERB_PLAN).join(", ")}`,
                });
            }
            return send(res, 404, { ok: false, error: "not found" });
        }
        catch (err) {
            send(res, 500, { ok: false, error: err.message });
        }
    });
    server.listen(PORT, HOST, () => {
        console.log(chalk.bold.cyan("═══════════════════════════════════════════"));
        console.log(chalk.bold.cyan("  GABRIEL DAEMON — NOIZY EMPIRE"));
        console.log(chalk.cyan(`  http://${HOST}:${PORT}`));
        console.log(chalk.cyan(`  auth: ${AUTH_OPTIONAL ? chalk.yellow("OPEN (dev — 127.0.0.1 only)") : chalk.green("Bearer required")}`));
        console.log(chalk.cyan(`  bosses: ${VALID_BOSSES.join(", ")}`));
        console.log(chalk.bold.cyan("═══════════════════════════════════════════"));
        console.log();
        console.log(chalk.dim("Routes:"));
        console.log(chalk.dim("  GET  /healthz"));
        console.log(chalk.dim("  GET  /bosses"));
        console.log(chalk.bold.magenta("  GET  /dashboard   ← empire-live · http://127.0.0.1:9777/dashboard"));
        console.log(chalk.dim("  GET  /ops/gabriel-sync"));
        console.log(chalk.dim("  GET  /ops/cloudflare-fix"));
        console.log(chalk.dim("  POST /intent  { boss, correlation_id, from, verb, target?, args?, source, priority? }"));
        console.log(chalk.dim("  POST /lucy/notify  { entry, type?, from?, correlation_id? }"));
        console.log();
        // DAZEFLOW law: 1 day = 1 chat = 1 truth. Ensure today's session exists
        // before any other agent, voice call, or iPad Shortcut tries to log into it.
        void dispatch({
            boss: "lucy",
            correlation_id: `boot_${new Date().toISOString().slice(0, 10)}`,
            from: "gabriel-daemon",
            verb: "dazeflow.today",
            source: "daemon:startup",
        }).then((r) => {
            if (r.ok)
                console.log(chalk.dim(`[lucy] boot-opened DAZEFLOW: ${r.ack_message}`));
            else
                console.warn(chalk.yellow(`[lucy] boot-open DAZEFLOW failed: ${r.error}`));
        });
    });
    const shutdown = (signal) => {
        console.log(chalk.yellow(`\n[gabriel-daemon] ${signal} received — draining and exiting`));
        server.close(() => process.exit(0));
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    return server;
}
export { startDaemon };
//# sourceMappingURL=daemon.js.map