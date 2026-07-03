// GABRIEL · Boss — SHIRL (wellbeing watchdog · NOIZYVOX voice)
//
// Per family-covenant.md: "Burnout watchdog. Wellbeing first. The founder is
// still alive in 2056 to see if the cathedral passed its test." Computes
// session duration from daemon uptime (process.uptime), flags long sessions,
// returns break reminders.

import type { Boss, Intent, BossResult } from "./types.js";

const BREAK_REMINDERS = [
  "Stand up. Drink water. Look out a window.",
  "The code will still be here in 10 minutes. Your body won't be 25 again.",
  "If you can't remember when you last ate — go eat.",
  "Three deep breaths. Shoulders down. Hands unclenched.",
  "If frustrated: walk away and come back. The answer will be obvious.",
  "Text someone you love. Reply later.",
  "396 Hz break: close eyes, hum for 30 seconds.",
];

function ok(intent: Intent, ack: string, data?: Record<string, unknown>): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "shirl",
    verb: intent.verb,
    ack_message: ack,
    data,
  };
}

function fail(intent: Intent, error: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "shirl",
    verb: intent.verb,
    error,
  };
}

function sessionMinutes(): number {
  return Math.floor(process.uptime() / 60);
}

function isLateNight(): boolean {
  const h = new Date().getHours();
  return h >= 23 || h < 6;
}

function sessionStatus(mins: number): {
  status: string;
  level: "fresh" | "solid" | "warn" | "stop";
} {
  if (mins < 60) return { status: "Fresh — good pace", level: "fresh" };
  if (mins < 120) return { status: "Solid session — consider a stretch", level: "solid" };
  if (mins < 240) return { status: "Long session — take a real break", level: "warn" };
  return { status: "Extended session — Pops says stop.", level: "stop" };
}

export const shirl: Boss = {
  name: "shirl",
  description:
    "Wellbeing watchdog. Burnout detection + break enforcement. FLOW: rhythm of work that doesn't break the worker.",

  async handle(intent) {
    switch (intent.verb) {
      case "ping":
      case "health":
        return ok(intent, "shirl online, watching.");
      case "check": {
        const mins = sessionMinutes();
        const { status, level } = sessionStatus(mins);
        const late = isLateNight();
        const mood = typeof intent.args?.mood === "string" ? intent.args.mood : "focused";
        const signals: string[] = [];
        if (mins > 180) signals.push("Session over 3 hours");
        if (late) signals.push("Working late");
        if (["frustrated", "stuck", "tired"].includes(mood)) signals.push(`Mood: ${mood}`);
        const risk = signals.length === 0 ? "LOW" : signals.length <= 2 ? "MODERATE" : "HIGH";
        return ok(intent, `SHIRL check · ${status} · risk=${risk}`, {
          session_minutes: mins,
          session_hours: Number((mins / 60).toFixed(1)),
          level,
          late_night: late,
          mood,
          signals,
          risk,
        });
      }
      case "break": {
        const msg = BREAK_REMINDERS[Math.floor(Math.random() * BREAK_REMINDERS.length)];
        return ok(intent, `SHIRL break reminder: ${msg}`, { message: msg });
      }
      case "status": {
        const mins = sessionMinutes();
        const { status } = sessionStatus(mins);
        return ok(intent, "SHIRL is watching Rob's pace.", {
          doctrine: "founder still alive in 2056 to see cathedral pass its test",
          session_minutes: mins,
          session_status: status,
        });
      }
      default:
        return fail(intent, `unknown verb: ${intent.verb}. Known: check, break, status, ping.`);
    }
  },
};
