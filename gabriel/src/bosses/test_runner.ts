// GABRIEL · Boss — TEST_RUNNER (smoke tests · verification gate)
//
// Wraps scripts/smoke-test.sh via execFile. Used as the verification gate
// before any deploy. Per agents.md doctrine: domain "Testing / verification".
//
// Verbs:
//   smoke         → run scripts/smoke-test.sh (timeout 90s)
//   smoke_underscore → run scripts/smoke_test.sh (legacy filename)
//   status        → identity + script paths
//   ping | health → generic ack

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Boss, Intent, BossResult, BossContext } from "./types.js";

const execFileAsync = promisify(execFile);
const SMOKE_DASH = "/Users/m2ultra/NOIZYANTHROPIC/scripts/smoke-test.sh";
const SMOKE_UNDER = "/Users/m2ultra/NOIZYANTHROPIC/scripts/smoke_test.sh";

function ok(
  intent: Intent,
  ack: string,
  data?: Record<string, unknown>,
  ledger_id?: string,
): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "test_runner",
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
    boss: "test_runner",
    verb: intent.verb,
    error,
    ledger_id,
  };
}

async function runScript(path: string): Promise<{ stdout: string; stderr: string; exit: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(path, [], {
      maxBuffer: 4 * 1024 * 1024,
      timeout: 90_000,
    });
    return { stdout, stderr, exit: 0 };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? "", stderr: e.stderr ?? e.message, exit: e.code ?? 1 };
  }
}

function parsePassFail(stdout: string): { passed: number; failed: number; total: number } {
  // Generic parser — looks for "X/Y passed" or pass/fail markers.
  const sumMatch = stdout.match(/(\d+)\s*\/\s*(\d+)\s+(?:passed|tests passing)/i);
  if (sumMatch) {
    const passed = parseInt(sumMatch[1], 10);
    const total = parseInt(sumMatch[2], 10);
    return { passed, failed: total - passed, total };
  }
  const passed = (stdout.match(/✓|PASS|✅/g) ?? []).length;
  const failed = (stdout.match(/✗|FAIL|❌/g) ?? []).length;
  return { passed, failed, total: passed + failed };
}

async function runSmoke(intent: Intent, ctx: BossContext, scriptPath: string): Promise<BossResult> {
  const { stdout, stderr, exit } = await runScript(scriptPath);
  const { passed, failed, total } = parsePassFail(stdout);
  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: exit === 0 ? "test_runner.smoke.ok" : "test_runner.smoke.fail",
    correlation_id: intent.correlation_id,
    payload: { exit, passed, failed, total, script: scriptPath },
  });
  if (exit !== 0) {
    return {
      ok: false,
      correlation_id: intent.correlation_id,
      boss: "test_runner",
      verb: intent.verb,
      error: `smoke test exited ${exit} (${passed}/${total} passed)`,
      data: {
        passed,
        failed,
        total,
        stderr_tail: stderr.split("\n").slice(-15).join("\n"),
      },
      ledger_id,
    };
  }
  return ok(
    intent,
    `Smoke ${passed}/${total} passed.`,
    {
      passed,
      failed,
      total,
      stdout_tail: stdout.split("\n").slice(-30).join("\n"),
    },
    ledger_id,
  );
}

export const test_runner: Boss = {
  name: "test_runner",
  description:
    "Verification gate. Wraps scripts/smoke-test.sh — runs the canonical smoke tests, parses pass/fail counts.",

  async handle(intent, ctx) {
    try {
      switch (intent.verb) {
        case "ping":
        case "health":
          return ok(intent, "test_runner online.");
        case "smoke":
          return await runSmoke(intent, ctx, SMOKE_DASH);
        case "smoke_underscore":
          return await runSmoke(intent, ctx, SMOKE_UNDER);
        case "status":
          return ok(intent, "TEST_RUNNER — verification gate.", {
            scripts: { dash: SMOKE_DASH, underscore: SMOKE_UNDER },
            doctrine: "nothing ships unverified",
          });
        default:
          return fail(
            intent,
            `unknown verb: ${intent.verb}. Known: smoke, smoke_underscore, status, ping.`,
          );
      }
    } catch (err) {
      return fail(intent, `test_runner boss error: ${(err as Error).message}`);
    }
  },
};
