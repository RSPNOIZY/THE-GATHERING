// GABRIEL · Boss — CB01 (DNS / Cloudflare / domain ops)
//
// Wires to ops/cloudflare-deploy.sh via execFile (shell-free spawn). Replaces
// the cb01 stub with a real handler for the CF-deploy verbs.
//
// Verbs:
//   cloudflare.status    → fleet health probe (--status)
//   cloudflare.deploy    → deploy one worker  { worker: "name" }
//   cloudflare.all       → deploy every worker (--all)
//   cloudflare.broken    → deploy only non-200 responders (--broken)
//   ping | health        → generic ack

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Boss, Intent, BossResult, BossContext } from "./types.js";

const execFileAsync = promisify(execFile);
const CF_SCRIPT = "/Users/m2ultra/NOIZYANTHROPIC/ops/cloudflare-deploy.sh";
const DNS_APPLY = "/Users/m2ultra/NOIZYANTHROPIC/ops/dns-remediation-apply.sh";
const DNS_VERIFY = "/Users/m2ultra/NOIZYANTHROPIC/ops/dns-remediation-verify.sh";

async function runArbitrary(
  cmd: string,
  args: string[],
  timeoutMs = 120_000,
): Promise<{ stdout: string; stderr: string; exit: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      maxBuffer: 4 * 1024 * 1024,
      timeout: timeoutMs,
    });
    return { stdout, stderr, exit: 0 };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? e.message, exit: e.code ?? 1 };
  }
}

function ok(
  intent: Intent,
  ack: string,
  data?: Record<string, unknown>,
  ledger_id?: string,
): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "cb01",
    verb: intent.verb,
    ack_message: ack,
    data,
    ledger_id,
  };
}
function fail(intent: Intent, error: string, ledger_id?: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "cb01",
    verb: intent.verb,
    error,
    ledger_id,
  };
}

async function runScript(
  args: string[],
): Promise<{ stdout: string; stderr: string; exit: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(CF_SCRIPT, args, {
      maxBuffer: 4 * 1024 * 1024,
      timeout: 120_000,
    });
    return { stdout, stderr, exit: 0 };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? e.message, exit: e.code ?? 1 };
  }
}

function parseStatus(stdout: string): Array<{ worker: string; host: string; http: number }> {
  return stdout
    .trim()
    .split("\n")
    .slice(1) // header
    .map((line) => {
      const [worker, host, code] = line.trim().split(/\s+/);
      return { worker, host, http: parseInt(code, 10) || 0 };
    });
}

async function cloudflareStatus(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const { stdout, exit } = await runScript(["--status"]);
  if (exit !== 0) return fail(intent, `cloudflare-deploy --status exited ${exit}`);
  const workers = parseStatus(stdout);
  const broken = workers.filter((w) => w.http !== 200).map((w) => w.worker);
  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: "cloudflare.status.read",
    correlation_id: intent.correlation_id,
    payload: { broken_count: broken.length },
  });
  return ok(
    intent,
    `Fleet: ${workers.length} workers, ${broken.length} broken.`,
    { workers, broken },
    ledger_id,
  );
}

async function cloudflareDeployOne(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const worker = typeof intent.args?.worker === "string" ? intent.args.worker.trim() : "";
  if (!worker) return fail(intent, "args.worker required");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(worker)) return fail(intent, `invalid worker name: '${worker}'`);
  const { stdout, stderr, exit } = await runScript([worker]);
  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: exit === 0 ? "cloudflare.deploy.ok" : "cloudflare.deploy.fail",
    subject: `worker:${worker}`,
    correlation_id: intent.correlation_id,
    payload: { exit },
  });
  if (exit !== 0) {
    return {
      ok: false,
      correlation_id: intent.correlation_id,
      boss: "cb01",
      verb: intent.verb,
      error: `deploy ${worker} exited ${exit}`,
      data: { stderr_tail: stderr.split("\n").slice(-15).join("\n") },
      ledger_id,
    };
  }
  return ok(
    intent,
    `Deployed ${worker}.`,
    { stdout_tail: stdout.split("\n").slice(-20).join("\n") },
    ledger_id,
  );
}

async function cloudflareMode(
  intent: Intent,
  ctx: BossContext,
  mode: "all" | "broken",
): Promise<BossResult> {
  const { stdout, stderr, exit } = await runScript([`--${mode}`]);
  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: `cloudflare.${mode}`,
    correlation_id: intent.correlation_id,
    payload: { exit },
  });
  if (exit !== 0) return fail(intent, `cloudflare-deploy --${mode} exited ${exit}`, ledger_id);
  return ok(
    intent,
    `Fleet --${mode} sweep complete.`,
    {
      stdout_tail: stdout.split("\n").slice(-30).join("\n"),
      stderr_tail: stderr.split("\n").slice(-10).join("\n"),
    },
    ledger_id,
  );
}

// ── DNS REMEDIATION verbs (orchestra-grade wrap of ops/dns-remediation-*.sh) ─
//
// Verbs:
//   dns.snapshot   → run dns-remediation-verify.sh (read-only public-DNS check)
//   dns.remediate  → run dns-remediation-apply.sh with optional args
//                    args: { dry_run?: bool, domain?: string, policy?: 'none'|'quarantine' }
//   dns.rollback   → run dns-remediation-apply.sh --rollback

async function dnsSnapshot(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const { stdout, stderr, exit } = await runArbitrary(DNS_VERIFY, [], 60_000);
  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: exit === 0 ? "dns.snapshot.ok" : "dns.snapshot.fail",
    correlation_id: intent.correlation_id,
    payload: { exit },
  });
  if (exit !== 0) return fail(intent, `dns-verify exited ${exit}`, ledger_id);
  // Parse the summary line "OK: X/N  WARN: Y  BAD: Z"
  const summary = stdout.match(/OK:\s*(\d+)\/(\d+)\s+WARN:\s*(\d+)\s+BAD:\s*(\d+)/);
  const compact = summary
    ? { ok: +summary[1], total: +summary[2], warn: +summary[3], bad: +summary[4] }
    : null;
  return ok(
    intent,
    summary
      ? `DNS snapshot: ${summary[1]}/${summary[2]} OK · ${summary[3]} WARN · ${summary[4]} BAD`
      : "DNS snapshot complete.",
    {
      compact,
      stdout_tail: stdout.split("\n").slice(-40).join("\n"),
      stderr_tail: stderr.split("\n").slice(-10).join("\n"),
    },
    ledger_id,
  );
}

async function dnsRemediate(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const args: string[] = [];
  const a = intent.args ?? {};
  if (a.dry_run === true) args.push("--dry-run");
  if (typeof a.domain === "string" && /^[a-z0-9][a-z0-9-.]*$/.test(a.domain)) {
    args.push("--domain", a.domain);
  } else if (a.domain !== undefined) {
    return fail(intent, `invalid args.domain`);
  }
  if (a.policy === "none" || a.policy === "quarantine") args.push("--policy", a.policy);

  const { stdout, stderr, exit } = await runArbitrary(DNS_APPLY, args, 300_000);
  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: exit === 0 ? "dns.remediate.ok" : "dns.remediate.fail",
    correlation_id: intent.correlation_id,
    payload: {
      exit,
      args,
      dry_run: !!a.dry_run,
      domain: a.domain ?? null,
      policy: a.policy ?? null,
    },
  });
  if (exit !== 0) {
    // Specific surface for missing CF token (exit 2 from the script)
    if (exit === 2 && stderr.includes("CLOUDFLARE_API_TOKEN")) {
      return fail(
        intent,
        "CLOUDFLARE_API_TOKEN missing. Create at https://dash.cloudflare.com/profile/api-tokens with Zone:Edit on 5 NOIZY zones, paste into .env.",
        ledger_id,
      );
    }
    return {
      ok: false,
      correlation_id: intent.correlation_id,
      boss: "cb01",
      verb: intent.verb,
      error: `dns-remediation-apply exited ${exit}`,
      data: { stderr_tail: stderr.split("\n").slice(-15).join("\n") },
      ledger_id,
    };
  }
  return ok(
    intent,
    args.length
      ? `DNS remediation pass ok (${args.join(" ")}).`
      : "DNS remediation pass ok (all 5 domains).",
    {
      args,
      stdout_tail: stdout.split("\n").slice(-50).join("\n"),
    },
    ledger_id,
  );
}

async function dnsRollback(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const args = ["--rollback"];
  const a = intent.args ?? {};
  if (typeof a.domain === "string" && /^[a-z0-9][a-z0-9-.]*$/.test(a.domain)) {
    args.push("--domain", a.domain);
  }
  const { stdout, stderr, exit } = await runArbitrary(DNS_APPLY, args, 300_000);
  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: exit === 0 ? "dns.rollback.ok" : "dns.rollback.fail",
    correlation_id: intent.correlation_id,
    payload: { exit, domain: a.domain ?? null },
  });
  if (exit !== 0) return fail(intent, `dns-remediation rollback exited ${exit}`, ledger_id);
  return ok(
    intent,
    a.domain ? `DNS rollback ok for ${a.domain}.` : "DNS rollback ok (all domains).",
    {
      stdout_tail: stdout.split("\n").slice(-40).join("\n"),
      stderr_tail: stderr.split("\n").slice(-10).join("\n"),
    },
    ledger_id,
  );
}

export const cb01: Boss = {
  name: "cb01",
  description:
    "DNS / Cloudflare / domain ops. Wraps ops/cloudflare-deploy.sh + ops/dns-remediation-apply.sh + ops/dns-remediation-verify.sh for fleet + DNS state.",

  async handle(intent, ctx) {
    try {
      switch (intent.verb) {
        case "ping":
        case "health":
          return ok(intent, "cb01 online.");
        case "cloudflare.status":
          return await cloudflareStatus(intent, ctx);
        case "cloudflare.deploy":
          return await cloudflareDeployOne(intent, ctx);
        case "cloudflare.all":
          return await cloudflareMode(intent, ctx, "all");
        case "cloudflare.broken":
          return await cloudflareMode(intent, ctx, "broken");
        case "dns.snapshot":
          return await dnsSnapshot(intent, ctx);
        case "dns.remediate":
          return await dnsRemediate(intent, ctx);
        case "dns.rollback":
          return await dnsRollback(intent, ctx);
        default:
          return fail(
            intent,
            `unknown verb: ${intent.verb}. Known: cloudflare.{status|deploy|all|broken}, dns.{snapshot|remediate|rollback}, ping.`,
          );
      }
    } catch (err) {
      return fail(intent, `cb01 boss error: ${(err as Error).message}`);
    }
  },
};
