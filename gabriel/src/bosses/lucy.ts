// GABRIEL · Boss — LUCY
//
// Real implementation of the LUCY boss. Reads/writes the SAME JSON files that
// lucy-mcp reads/writes (~/NOIZYLAB/lucy-state/*.json), so a GABRIEL /intent
// call and a LUCY MCP tool call operate on one substrate. This is the
// "shared memcells" doctrine (ALEX × GABRIEL × LUCY) rendered in code.
//
// Verbs:
//   dazeflow.today     → today's session (creates if missing)
//   dazeflow.log       → append an entry  { entry: string, type?: string }
//   dazeflow.close     → close today's session  { summary: string }
//   dazeflow.history   → last N sessions  { limit?: number }
//   task.list          → list tasks  { status?: "open"|"done"|"dropped"|"all" }
//   task.add           → create task  { task, priority?, context? }
//   task.done          → mark done  { id }
//   task.drop          → mark dropped  { id }
//   status             → summary counts
//   ping | health      → generic ack

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Boss, Intent, BossResult, BossContext } from "./types.js";

const STATE_DIR = join(homedir(), "NOIZYLAB", "lucy-state");
const DAZEFLOW_FILE = join(STATE_DIR, "dazeflow.json");
const TASKS_FILE = join(STATE_DIR, "tasks.json");

interface DazeEntry {
  timestamp: string;
  type: string;
  entry: string;
}
interface DazeSession {
  date: string;
  openedAt: string;
  closed: boolean;
  closedAt?: string;
  summary?: string | null;
  entries: DazeEntry[];
}
interface DazeStore {
  sessions: DazeSession[];
}

interface Task {
  id: string;
  task: string;
  priority: string;
  context: string | null;
  status: "open" | "done" | "dropped";
  createdAt: string;
  closedAt?: string;
}
interface TaskStore {
  tasks: Task[];
}

// ── Substrate helpers ─────────────────────────────────────────
function ensureState(): void {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  if (!existsSync(DAZEFLOW_FILE)) writeFileSync(DAZEFLOW_FILE, JSON.stringify({ sessions: [] }, null, 2));
  if (!existsSync(TASKS_FILE)) writeFileSync(TASKS_FILE, JSON.stringify({ tasks: [] }, null, 2));
}

function readStore<T>(file: string): T {
  ensureState();
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function writeStore<T>(file: string, data: T): void {
  ensureState();
  writeFileSync(file, JSON.stringify(data, null, 2));
}

const todayKey = (): string => new Date().toISOString().slice(0, 10);
const now = (): string => new Date().toISOString();

function getOrCreateToday(store: DazeStore): DazeSession {
  const today = todayKey();
  let session = store.sessions.find((s) => s.date === today);
  if (!session) {
    session = { date: today, openedAt: now(), closed: false, summary: null, entries: [] };
    store.sessions.unshift(session);
  }
  return session;
}

// ── Result helpers ────────────────────────────────────────────
function ok(
  intent: Intent,
  ack_message: string,
  data?: Record<string, unknown>,
  ledger_id?: string,
): BossResult {
  return {
    ok: true,
    correlation_id: intent.correlation_id,
    boss: "lucy",
    verb: intent.verb,
    ack_message,
    data,
    ledger_id,
  };
}

function fail(intent: Intent, error: string, ledger_id?: string): BossResult {
  return {
    ok: false,
    correlation_id: intent.correlation_id,
    boss: "lucy",
    verb: intent.verb,
    error,
    ledger_id,
  };
}

function str(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

// ── Verb handlers ─────────────────────────────────────────────
async function dazeflowToday(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const store = readStore<DazeStore>(DAZEFLOW_FILE);
  const before = store.sessions.length;
  const session = getOrCreateToday(store);
  const created = store.sessions.length > before;
  if (created) writeStore(DAZEFLOW_FILE, store);
  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: created ? "dazeflow.opened" : "dazeflow.read",
    subject: `dazeflow:${session.date}`,
    correlation_id: intent.correlation_id,
  });
  return ok(
    intent,
    `DAZEFLOW ${session.date}: ${session.entries.length} entries, ${session.closed ? "closed" : "open"}.`,
    { session, created },
    ledger_id,
  );
}

async function dazeflowLog(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const args = intent.args ?? {};
  const entry = str(args.entry);
  if (!entry) return fail(intent, "entry required");
  const type = str(args.type, "note");

  const store = readStore<DazeStore>(DAZEFLOW_FILE);
  const session = getOrCreateToday(store);
  if (session.closed) return fail(intent, `session ${session.date} already closed`);

  const record: DazeEntry = { timestamp: now(), type, entry };
  session.entries.push(record);
  writeStore(DAZEFLOW_FILE, store);

  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: `dazeflow.log.${type}`,
    subject: `dazeflow:${session.date}`,
    correlation_id: intent.correlation_id,
    payload: { entry, type },
  });
  return ok(
    intent,
    `Logged [${type.toUpperCase()}] → ${session.date} (entry #${session.entries.length}).`,
    { session_date: session.date, entry: record, entry_count: session.entries.length },
    ledger_id,
  );
}

async function dazeflowClose(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const summary = str(intent.args?.summary);
  if (!summary) return fail(intent, "summary required");
  const store = readStore<DazeStore>(DAZEFLOW_FILE);
  const today = todayKey();
  const session = store.sessions.find((s) => s.date === today);
  if (!session) return fail(intent, "no session open today");
  if (session.closed) return fail(intent, `session ${today} already closed`);

  session.closed = true;
  session.closedAt = now();
  session.summary = summary;
  writeStore(DAZEFLOW_FILE, store);

  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: "dazeflow.closed",
    subject: `dazeflow:${today}`,
    correlation_id: intent.correlation_id,
    payload: { summary, entry_count: session.entries.length },
  });
  return ok(
    intent,
    `DAZEFLOW ${today} closed — ${session.entries.length} entries. Summary: ${summary}`,
    { session },
    ledger_id,
  );
}

function dazeflowHistory(intent: Intent): BossResult {
  const limit = Number(intent.args?.limit ?? 7) || 7;
  const store = readStore<DazeStore>(DAZEFLOW_FILE);
  const slice = store.sessions.slice(0, limit).map((s) => ({
    date: s.date,
    closed: s.closed,
    entries: s.entries.length,
    summary: s.summary,
  }));
  return ok(intent, `${slice.length} of ${store.sessions.length} sessions.`, { sessions: slice });
}

function taskList(intent: Intent): BossResult {
  const filter = str(intent.args?.status, "open");
  const store = readStore<TaskStore>(TASKS_FILE);
  const tasks = store.tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "open") return t.status === "open";
    return t.status === filter;
  });
  const open = store.tasks.filter((t) => t.status === "open");
  const p0p1 = open.filter((t) => t.priority === "P0" || t.priority === "P1").length;
  return ok(
    intent,
    `${tasks.length} ${filter} task(s). Open: ${open.length} (P0/P1: ${p0p1}).`,
    { tasks, counts: { total: store.tasks.length, open: open.length, p0p1 } },
  );
}

async function taskAdd(intent: Intent, ctx: BossContext): Promise<BossResult> {
  const task = str(intent.args?.task);
  if (!task) return fail(intent, "task required");
  const priority = str(intent.args?.priority, "P2");
  const context = str(intent.args?.context) || null;

  const store = readStore<TaskStore>(TASKS_FILE);
  const id = `T${Date.now().toString(36).toUpperCase()}`;
  const record: Task = { id, task, priority, context, status: "open", createdAt: now() };
  store.tasks.unshift(record);
  writeStore(TASKS_FILE, store);

  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: "task.added",
    subject: `task:${id}`,
    correlation_id: intent.correlation_id,
    payload: { task, priority, context },
  });
  return ok(intent, `Task ${id} [${priority}] added: ${task}`, { task: record }, ledger_id);
}

async function taskMark(
  intent: Intent,
  ctx: BossContext,
  status: "done" | "dropped",
): Promise<BossResult> {
  const id = str(intent.args?.id);
  if (!id) return fail(intent, "id required");
  const store = readStore<TaskStore>(TASKS_FILE);
  const task = store.tasks.find((t) => t.id === id);
  if (!task) return fail(intent, `task ${id} not found`);
  if (task.status !== "open") return fail(intent, `task ${id} is already ${task.status}`);

  task.status = status;
  task.closedAt = now();
  writeStore(TASKS_FILE, store);

  const ledger_id = await ctx.appendLedger({
    actor_id: intent.from,
    event_kind: `task.${status}`,
    subject: `task:${id}`,
    correlation_id: intent.correlation_id,
  });
  return ok(intent, `Task ${id} marked ${status}.`, { task }, ledger_id);
}

function statusHandler(intent: Intent): BossResult {
  const daze = readStore<DazeStore>(DAZEFLOW_FILE);
  const tasks = readStore<TaskStore>(TASKS_FILE);
  const today = daze.sessions.find((s) => s.date === todayKey());
  const open = tasks.tasks.filter((t) => t.status === "open");
  return ok(intent, "LUCY substrate status.", {
    dazeflow: {
      total_sessions: daze.sessions.length,
      today_open: !!today && !today.closed,
      today_entries: today?.entries.length ?? 0,
    },
    tasks: {
      total: tasks.tasks.length,
      open: open.length,
      done: tasks.tasks.filter((t) => t.status === "done").length,
      dropped: tasks.tasks.filter((t) => t.status === "dropped").length,
    },
    substrate_dir: STATE_DIR,
  });
}

// ── Boss export ───────────────────────────────────────────────
export const lucy: Boss = {
  name: "lucy",
  description:
    "DAZEFLOW keeper, task log, session index. Reads/writes ~/NOIZYLAB/lucy-state/ (same substrate as lucy-mcp).",

  async handle(intent, ctx) {
    try {
      switch (intent.verb) {
        case "ping":
        case "health":
          return ok(intent, "lucy online.");
        case "dazeflow.today":
          return await dazeflowToday(intent, ctx);
        case "dazeflow.log":
          return await dazeflowLog(intent, ctx);
        case "dazeflow.close":
          return await dazeflowClose(intent, ctx);
        case "dazeflow.history":
          return dazeflowHistory(intent);
        case "task.list":
          return taskList(intent);
        case "task.add":
          return await taskAdd(intent, ctx);
        case "task.done":
          return await taskMark(intent, ctx, "done");
        case "task.drop":
          return await taskMark(intent, ctx, "dropped");
        case "status":
          return statusHandler(intent);
        default:
          return fail(
            intent,
            `unknown verb: ${intent.verb}. Known: dazeflow.{today|log|close|history}, task.{list|add|done|drop}, status, ping.`,
          );
      }
    } catch (err) {
      return fail(intent, `lucy boss error: ${(err as Error).message}`);
    }
  },
};
