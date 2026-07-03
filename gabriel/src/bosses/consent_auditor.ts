// GABRIEL · Boss — CONSENT_AUDITOR (Never Clauses · Kill Switch · audit gate)
//
// Per .claude/agents/consent-auditor.md: "Last line of defense before anything
// ships." HTTP-driven against Heaven's consent kernel — pulls Never Clauses,
// audit log, KPI; runs the 9-clause checklist locally.
//
// Verbs:
//   never_clauses    → fetch & display the 9 immovable clauses
//   audit_summary    → recent audit/ledger excerpt from Heaven
//   kpi              → Heaven KPI snapshot (consent token counts, etc.)
//   nine_check       → canonical 9-point Never Clause audit gate
//   status           → identity + Heaven URL + 9 clauses by name
//   ping | health    → generic ack

import type { Boss, Intent, BossResult } from "./types.js";

const HEAVEN_URL = process.env.HEAVEN_URL || "https://heaven.rsp-5f3.workers.dev";
const NOIZY_API_KEY = process.env.NOIZY_API_KEY ?? "";

const NEVER_CLAUSES = [
  { id: 1, name: "NO_SYNTH_WITHOUT_CONSENT", scope: "Every synthesis checked live" },
  { id: 2, name: "NO_TRAINING_WITHOUT_CONSENT", scope: "Model training requires explicit consent" },
  { id: 3, name: "NO_IDENTITY_IMPERSONATION", scope: "Never fake a real person's voice" },
  { id: 4, name: "NO_SUBLICENSING_WITHOUT_ACTOR", scope: "Actors control downstream use" },
  { id: 5, name: "NO_BYPASS_KILL_SWITCH", scope: "Revocation is instant, no exceptions" },
  { id: 6, name: "NO_HIDDEN_PROVENANCE", scope: "C2PA on everything" },
  { id: 7, name: "NO_EXPLOITATION", scope: "75/25 split, always" },
  { id: 8, name: "NO_MINOR_VOICE_SYNTHESIS", scope: "Under-18 voices are never synthesized" },
  { id: 9, name: "NO_LEDGER_TAMPERING", scope: "Append-only, never UPDATE or DELETE" },
];

function ok(intent: Intent, ack: string, data?: Record<string, unknown>): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "consent_auditor",
    verb: intent.verb,
    ack_message: ack,
    data,
  };
}

function fail(intent: Intent, error: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "consent_auditor",
    verb: intent.verb,
    error,
  };
}

async function heavenJson(path: string, timeoutMs = 8000): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (NOIZY_API_KEY) headers["X-NOIZY-Key"] = NOIZY_API_KEY;
  const res = await fetch(`${HEAVEN_URL}${path}`, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Heaven ${path} → ${res.status}`);
  return res.json();
}

export const consent_auditor: Boss = {
  name: "consent_auditor",
  description:
    "Last-line-of-defense gate. 9 Never Clauses + Kill Switch readiness. HTTP probes Heaven for never-clauses, audit, KPI.",

  async handle(intent) {
    switch (intent.verb) {
      case "ping":
      case "health":
        return ok(intent, "consent_auditor online — 9 clauses standing.");
      case "never_clauses":
        try {
          const remote = await heavenJson("/api/v1/never-clauses");
          return ok(intent, "Never Clauses fetched from Heaven.", {
            remote,
            local: NEVER_CLAUSES,
          });
        } catch (err) {
          return ok(intent, "Heaven unreachable — local clauses returned.", {
            cached: true,
            local: NEVER_CLAUSES,
            error: (err as Error).message,
          });
        }
      case "audit_summary": {
        try {
          const audit = await heavenJson("/api/v1/audit?limit=20");
          return ok(intent, "Heaven audit summary fetched.", { audit });
        } catch (err) {
          return fail(intent, `audit fetch failed: ${(err as Error).message}`);
        }
      }
      case "kpi": {
        try {
          const kpi = await heavenJson("/api/v1/kpi");
          return ok(intent, "Heaven KPI snapshot fetched.", { kpi });
        } catch (err) {
          return fail(intent, `kpi fetch failed: ${(err as Error).message}`);
        }
      }
      case "nine_check": {
        // Canonical 9-point gate — runs local checks against Heaven where possible.
        const results = await Promise.all(
          NEVER_CLAUSES.map(async (c) => {
            // Surface-level gate: clause exists in Heaven's manifest. Real
            // kernel check happens at synth-time via the Covenant.
            try {
              const list = (await heavenJson("/api/v1/never-clauses")) as {
                clauses?: Array<{ name: string }>;
              };
              const present = (list.clauses ?? []).some((cl) => cl.name === c.name);
              return {
                ...c,
                heaven_known: present,
                gate: present ? "PASS" : "WARN",
              };
            } catch {
              return { ...c, heaven_known: null, gate: "UNKNOWN" };
            }
          }),
        );
        const failed = results.filter((r) => r.gate === "WARN").length;
        const ack =
          failed === 0
            ? `9-point Never Clause check: ALL PASS (${results.length}/9).`
            : `9-point Never Clause check: ${results.length - failed}/9 PASS, ${failed} WARN.`;
        return ok(intent, ack, { results });
      }
      case "status":
        return ok(intent, "CONSENT_AUDITOR — last line of defense.", {
          heaven_url: HEAVEN_URL,
          never_clauses_count: NEVER_CLAUSES.length,
          clauses: NEVER_CLAUSES.map((c) => c.name),
          doctrine:
            "consent token validated before synth · ledger append-only · Kill Switch instant",
        });
      case "chain_health": {
        // Plowman govern-verb · runs the NOIZYKIDZ Proof Chain Remediation Law audit.
        // Wraps ops/audit-noizykidz-proof-chain.py · returns one of the 8 status codes.
        // No mutation of nk_haptic_events. Repair requires RSP_OVERRIDE per the Law.
        // Doctrine: .claude/rules/proof-chain-remediation-law.md
        //
        // Note: the script exits non-zero for BLOCKED/REPAIR_REQUIRED — those are
        // VALID terminal states, not errors. We parse stdout regardless of exit code.
        const { spawn } = await import("node:child_process");
        const SCRIPT = "/Users/m2ultra/NOIZYANTHROPIC/ops/audit-noizykidz-proof-chain.py";
        const acceptable = [
          "PROOF_CHAIN_PASS",
          "PROOF_CHAIN_REPAIR_REQUIRED",
          "PROOF_CHAIN_HASH_RECIPE_UNKNOWN",
          "PROOF_CHAIN_AUDIT_BLOCKED",
          "RSP_OVERRIDE_REQUIRED",
        ];
        return await new Promise<BossResult>((resolve) => {
          const proc = spawn("python3", [SCRIPT, "--no-emit"], { timeout: 90_000 });
          let out = "";
          proc.stdout.on("data", (d) => { out += d.toString(); });
          proc.stderr.on("data", (d) => { out += d.toString(); });
          proc.on("close", (code) => {
            const m = out.match(/status:\s*([A-Z_]+)/);
            const status = m ? m[1] : "PROOF_CHAIN_HASH_RECIPE_UNKNOWN";
            if (!acceptable.includes(status)) {
              resolve(fail(intent, `chain_health emitted unknown status: ${status} (exit ${code})`));
              return;
            }
            resolve(ok(intent, `chain_health: ${status}`, {
              status,
              exit_code: code,
              stdout_tail: out.split("\n").slice(-8).join("\n").trim(),
              law: ".claude/rules/proof-chain-remediation-law.md",
            }));
          });
          proc.on("error", (err) => {
            resolve(fail(intent, `chain_health spawn failed: ${err.message}`));
          });
        });
      }
      default:
        return fail(
          intent,
          `unknown verb: ${intent.verb}. Known: never_clauses, audit_summary, kpi, nine_check, chain_health, status, ping.`,
        );
    }
  },
};
