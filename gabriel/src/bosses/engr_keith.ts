// GABRIEL · Boss — ENGR_KEITH (Heaven custody · credentials vault · architecture)
//
// Per family-covenant.md: "HEAVEN is his. The schema is his handwriting."
// Owns:
//   - Heaven HTTP probe (heaven_health, endpoint_map)
//   - Architecture snapshot (architecture)
//   - **Credentials vault** (credentials.{get,put,list,audit,validate,rotate})
//     macOS Keychain backed; the empire-native replacement for Doppler/Vault.
//
// Verbs:
//   heaven_health         → GET /health on heaven
//   endpoint_map          → GET /api/v1/mcp-manifest
//   architecture          → return 4-tier layer snapshot
//   status                → identity + heaven_url + 9-clause doctrine
//   credentials.list      → list keychain entries under "noizy:" namespace
//   credentials.get       → fetch one credential value (auth-gated)
//   credentials.put       → store/update a credential in keychain
//   credentials.delete    → remove a credential from keychain
//   credentials.audit     → run ops/credentials-audit.py
//   credentials.validate  → re-validate one provider's token
//   credentials.rotate    → guide rotation flow (returns provider-specific URL)
//   ping | health         → generic ack

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Boss, Intent, BossResult, BossContext } from "./types.js";

const execFileAsync = promisify(execFile);
const HEAVEN_URL = process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";
const NOIZY_API_KEY = process.env.NOIZY_API_KEY ?? "";
const KEYCHAIN_ACCOUNT = process.env.KEYCHAIN_ACCOUNT || "rsp@noizy.ai";
const KEYCHAIN_PREFIX = "noizy:";
const SECURITY = "/usr/bin/security";
const AUDIT_SCRIPT = "/Users/m2ultra/NOIZYLAB/ops/credentials-audit.py";

const ARCHITECTURE = {
  tier_1: "Edge surfaces — iPad LUCY, iPhone, DreamChamber, Discord/Slack bots (cf01-cf10)",
  tier_2: "Cloudflare Workers — noizy-mcp, heaven, mc96-follower, cf-series bots",
  tier_3: "Local daemons — GABRIEL (:9777 intent dispatch), lucy-logic-bridge (:9788)",
  tier_4: "MCP servers — stdio tools for Claude/Windsurf/IDE consumers",
  data_plane:
    "D1 (consent kernel) + KV (session/rate cache) + ~/NOIZYLAB/lucy-state/*.json (LUCY substrate) + macOS Keychain (vault)",
  ledger: "heaven.rsp-5f3.workers.dev/api/v1/ledger — append-only, X-NOIZY-Key auth",
  consent_enforcement: "9 Never Clauses + Covenant pre-synth check + 1-hour revocation SLA",
};

// ── ROTATION URLS (per-provider) ──────────────────────────────
const ROTATION_URLS: Record<string, string> = {
  anthropic: "https://console.anthropic.com/settings/keys",
  openai: "https://platform.openai.com/api-keys",
  cloudflare: "https://dash.cloudflare.com/profile/api-tokens",
  github: "https://github.com/settings/tokens",
  stripe: "https://dashboard.stripe.com/apikeys",
  postman: "https://postman.co/settings/me/api-keys",
  discord: "https://discord.com/developers/applications",
  slack: "https://api.slack.com/apps",
  huggingface: "https://huggingface.co/settings/tokens",
  "google-ai": "https://aistudio.google.com/apikey",
  "noizy-heaven": "https://heaven.rsp-5f3.workers.dev/admin (rotate via wrangler secret put)",
};

// ── helpers ──────────────────────────────────────────────────
function ok(intent: Intent, ack: string, data?: Record<string, unknown>): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "engr_keith",
    verb: intent.verb,
    ack_message: ack,
    data,
  };
}

function fail(intent: Intent, error: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "engr_keith",
    verb: intent.verb,
    error,
  };
}

async function fetchJson(path: string, timeoutMs = 6000): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (NOIZY_API_KEY) headers["X-NOIZY-Key"] = NOIZY_API_KEY;
  const res = await fetch(`${HEAVEN_URL}${path}`, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Heaven ${path} → ${res.status}`);
  return res.json();
}

// ── Keychain operations (shell-free spawn) ────────────────────
function keychainServiceName(provider: string, kind: string): string {
  // Standard convention: noizy:<provider>:<kind>
  // e.g. noizy:anthropic:api-key, noizy:cloudflare:api-token
  if (!/^[a-z0-9-]+$/.test(provider) || !/^[a-z0-9-]+$/.test(kind)) {
    throw new Error("provider and kind must be lowercase alphanumeric (with -)");
  }
  return `${KEYCHAIN_PREFIX}${provider}:${kind}`;
}

async function keychainGet(service: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      SECURITY,
      ["find-generic-password", "-a", KEYCHAIN_ACCOUNT, "-s", service, "-w"],
      { timeout: 5000 },
    );
    return stdout.trim();
  } catch {
    return null;
  }
}

async function keychainPut(service: string, value: string): Promise<void> {
  // -U updates if exists, creates otherwise
  await execFileAsync(
    SECURITY,
    [
      "add-generic-password",
      "-a",
      KEYCHAIN_ACCOUNT,
      "-s",
      service,
      "-w",
      value,
      "-U",
      "-A", // allow any app (read by daemon without Touch ID prompt)
    ],
    { timeout: 5000 },
  );
}

async function keychainDelete(service: string): Promise<boolean> {
  try {
    await execFileAsync(
      SECURITY,
      ["delete-generic-password", "-a", KEYCHAIN_ACCOUNT, "-s", service],
      { timeout: 5000 },
    );
    return true;
  } catch {
    return false;
  }
}

async function keychainList(): Promise<string[]> {
  // No native "list by service prefix" — dump-keychain is gigantic and
  // requires unlock. Instead, we maintain a registry index in the keychain
  // itself under "noizy:_registry:index". Each put adds to this.
  const idx = await keychainGet(`${KEYCHAIN_PREFIX}_registry:index`);
  if (!idx) return [];

  // Detect and decode hex-encoded output (security CLI does this for larger blobs or newline-heavy strings)
  let decoded = idx;
  if (/^[0-9a-fA-F]+$/.test(idx) && idx.length % 2 === 0) {
    try {
      decoded = Buffer.from(idx, "hex").toString("utf8");
    } catch {
      // fallback to original if decoding fails
    }
  }

  return decoded
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function keychainRegistryAdd(service: string): Promise<void> {
  const current = (await keychainList()) || [];
  if (!current.includes(service)) {
    current.push(service);
    await keychainPut(`${KEYCHAIN_PREFIX}_registry:index`, current.join("\n"));
  }
}

async function keychainRegistryRemove(service: string): Promise<void> {
  const current = await keychainList();
  const filtered = current.filter((s) => s !== service);
  await keychainPut(`${KEYCHAIN_PREFIX}_registry:index`, filtered.join("\n"));
}

// ── Verb handlers ─────────────────────────────────────────────

async function credentialsList(_intent: Intent): Promise<BossResult> {
  const services = await keychainList();
  const filtered = services.filter((s) => s !== "_registry:index");
  return ok(_intent, `${filtered.length} credentials in vault.`, {
    services: filtered,
    keychain_account: KEYCHAIN_ACCOUNT,
  });
}

async function credentialsGet(intent: Intent): Promise<BossResult> {
  const provider = String(intent.args?.provider ?? "");
  const kind = String(intent.args?.kind ?? "api-key");
  if (!provider) return fail(intent, "args.provider required");
  let service: string;
  try {
    service = keychainServiceName(provider, kind);
  } catch (err) {
    return fail(intent, (err as Error).message);
  }
  const value = await keychainGet(service);
  if (value === null) {
    return fail(
      intent,
      `not in vault: ${service}. Add via credentials.put or run ops/credentials-migrate-to-keychain.sh.`,
    );
  }
  return ok(intent, `Retrieved ${service}.`, {
    service,
    value, // CAUTION: this is the actual secret. /intent caller must be authed.
    length: value.length,
  });
}

async function credentialsPut(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const provider = String(intent.args?.provider ?? "");
  const kind = String(intent.args?.kind ?? "api-key");
  const value = String(intent.args?.value ?? "");
  if (!provider || !value) return fail(intent, "args.provider and args.value required");
  let service: string;
  try {
    service = keychainServiceName(provider, kind);
  } catch (err) {
    return fail(intent, (err as Error).message);
  }
  try {
    await keychainPut(service, value);
    await keychainRegistryAdd(service);
    await ctx.appendLedger({
      actor_id: intent.from,
      event_kind: "credentials.put",
      subject: service,
      correlation_id: intent.correlation_id,
      payload: { provider, kind, length: value.length },
    });
    return ok(intent, `Stored ${service} in keychain.`, { service });
  } catch (err) {
    return fail(intent, `keychain put failed: ${(err as Error).message}`);
  }
}

async function credentialsDelete(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const provider = String(intent.args?.provider ?? "");
  const kind = String(intent.args?.kind ?? "api-key");
  if (!provider) return fail(intent, "args.provider required");
  const service = keychainServiceName(provider, kind);
  const removed = await keychainDelete(service);
  if (!removed) return fail(intent, `${service} not in vault`);
  await keychainRegistryRemove(service);
  await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: "credentials.deleted",
    subject: service,
    correlation_id: intent.correlation_id,
  });
  return ok(intent, `Removed ${service} from keychain.`, { service });
}

async function credentialsAudit(intent: Intent): Promise<BossResult> {
  try {
    const { stdout } = await execFileAsync(
      "/opt/homebrew/bin/python3",
      [AUDIT_SCRIPT, "--validate", "--no-secrets", "--json-only"],
      { timeout: 120_000, maxBuffer: 4 * 1024 * 1024 },
    );
    // Read the latest inventory JSON
    const { readdirSync, readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const dir = "/Users/m2ultra/NOIZYLAB/ops/credentials-audit";
    const files = readdirSync(dir)
      .filter((f) => f.startsWith("inventory-") && f.endsWith(".json"))
      .sort()
      .reverse();
    const latest = files[0] ? JSON.parse(readFileSync(path.join(dir, files[0]), "utf8")) : null;
    return ok(intent, "Credentials audit complete.", {
      summary: latest?.summary,
      stdout_tail: stdout.split("\n").slice(-15).join("\n"),
    });
  } catch (err) {
    return fail(intent, `audit failed: ${(err as Error).message}`);
  }
}

async function credentialsValidate(intent: Intent): Promise<BossResult> {
  const provider = String(intent.args?.provider ?? "");
  const kind = String(intent.args?.kind ?? "api-key");
  if (!provider) return fail(intent, "args.provider required");
  const service = keychainServiceName(provider, kind);
  const value = await keychainGet(service);
  if (!value) return fail(intent, `${service} not in vault`);
  // Reuse the audit script's validators by spawning a one-shot Python call
  try {
    const { stdout } = await execFileAsync(
      "/opt/homebrew/bin/python3",
      [
        "-c",
        `
import sys
import importlib.util
spec = importlib.util.spec_from_file_location("audit", "/Users/m2ultra/NOIZYLAB/ops/credentials-audit.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
print(m.validate(${JSON.stringify(provider)}, ${JSON.stringify(value)}))
`.trim(),
      ],
      { timeout: 15_000 },
    );
    const status = stdout.trim();
    return ok(intent, `${provider}:${kind} → ${status}`, { service, status });
  } catch {
    // Fallback: don't fail if the helper import doesn't work; just report unverified
    return ok(intent, `${provider}:${kind} → unverified (validator unavailable)`, {
      service,
      status: "unverified",
    });
  }
}

function credentialsRotate(intent: Intent): BossResult {
  const provider = String(intent.args?.provider ?? "");
  if (!provider) return fail(intent, "args.provider required");
  const url = ROTATION_URLS[provider];
  if (!url) {
    return fail(
      intent,
      `no rotation URL known for '${provider}'. Add to ROTATION_URLS in engr_keith.ts.`,
    );
  }
  return ok(
    intent,
    `Rotate ${provider} at ${url}. After issuing the new token, run credentials.put with the new value to update the vault. Old token will be replaced (use -U flag in keychain).`,
    {
      provider,
      rotation_url: url,
      next_step: "credentials.put { provider, kind, value }",
    },
  );
}

export const engr_keith: Boss = {
  name: "engr_keith",
  description:
    "Engineering review · schema · infra custody · credentials vault. Heaven HTTP + macOS Keychain (empire vault).",

  async handle(intent, ctx) {
    switch (intent.verb) {
      case "ping":
      case "health":
        return ok(intent, "engr_keith online.");
      case "heaven_health": {
        try {
          const body = await fetchJson("/health");
          return ok(intent, `Heaven up at ${HEAVEN_URL}`, { health: body });
        } catch (err) {
          return fail(intent, `Heaven health probe failed: ${(err as Error).message}`);
        }
      }
      case "endpoint_map": {
        try {
          const manifest = await fetchJson("/api/v1/mcp-manifest", 8000);
          return ok(intent, "Heaven endpoint map retrieved.", { manifest });
        } catch (err) {
          return ok(intent, "Heaven offline — returning cached endpoint map.", {
            cached: true,
            known_endpoints: [
              "GET /health",
              "GET /gabriel (empire status)",
              "GET /api/v1/actors",
              "POST /api/v1/consent-tokens",
              "GET /api/v1/never-clauses",
              "POST /api/v1/ledger",
              "GET /api/v1/stats",
            ],
            error: (err as Error).message,
          });
        }
      }
      case "architecture":
        return ok(intent, "4-tier architecture snapshot.", { architecture: ARCHITECTURE });
      case "status":
        return ok(intent, "ENGR_KEITH — Heaven custodian + credentials vault.", {
          heaven_url: HEAVEN_URL,
          keychain_account: KEYCHAIN_ACCOUNT,
          doctrine:
            "consent-as-code · ledger append-only · fail-closed defaults · keychain-backed secrets",
        });
      case "credentials.list":
        return await credentialsList(intent);
      case "credentials.get":
        return await credentialsGet(intent);
      case "credentials.put":
        return await credentialsPut(intent, ctx);
      case "credentials.delete":
        return await credentialsDelete(intent, ctx);
      case "credentials.audit":
        return await credentialsAudit(intent);
      case "credentials.validate":
        return await credentialsValidate(intent);
      case "credentials.rotate":
        return credentialsRotate(intent);
      default:
        return fail(
          intent,
          `unknown verb: ${intent.verb}. Known: heaven_health, endpoint_map, architecture, status, credentials.{list|get|put|delete|audit|validate|rotate}, ping.`,
        );
    }
  },
};
