import { readFileSync, writeFileSync, readdirSync, statSync, copyFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { createHash } from "node:crypto";
import {
  SessionSchema,
  LineageSchema,
  type Session,
  type Lineage,
  sessionSummary,
  makeLineageEvent,
  checkLockReady,
  promoteStatus,
} from "../schema/index.js";

const SESSIONS_ROOT =
  process.env.DREAMCHAMBER_SESSIONS_ROOT ||
  join(process.env.HOME || "/tmp", "DreamChamber", "_SESSIONS");

const ARCHIVE_ROOT =
  process.env.DREAMCHAMBER_ARCHIVE_ROOT ||
  join(
    process.env.HOME || "/tmp",
    "Library/CloudStorage/GoogleDrive-rsplowman@icloud.com/My Drive/NOIZY.AI/DreamChamber/ARCHIVE"
  );

const AUDITOR = process.env.DREAMCHAMBER_AUDITOR || "RSP001";

// ─── Helpers ───

function findSessionFiles(root: string): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".json") && !entry.name.includes(".lineage.")) {
        results.push(full);
      }
    }
  }

  walk(root);
  return results;
}

function loadSession(path: string): Session | null {
  try {
    const raw = JSON.parse(readFileSync(path, "utf-8"));
    const result = SessionSchema.safeParse(raw);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function loadLineage(sessionPath: string): Lineage | null {
  const lineagePath = sessionPath.replace(/\.json$/, ".lineage.json");
  try {
    const raw = JSON.parse(readFileSync(lineagePath, "utf-8"));
    const result = LineageSchema.safeParse(raw);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function sha256(path: string): string {
  const content = readFileSync(path);
  return createHash("sha256").update(content).digest("hex");
}

// ─── Commands ───

function scan() {
  console.log(`Scanning ${SESSIONS_ROOT}...\n`);
  const files = findSessionFiles(SESSIONS_ROOT);

  let unlocked = 0;
  for (const f of files) {
    const session = loadSession(f);
    if (!session) continue;
    if (session.meta.status === "locked" || session.meta.status === "archived") continue;

    unlocked++;
    console.log(`  ${sessionSummary(session)}`);
    console.log(`    path: ${f}`);
  }

  console.log(`\n${unlocked} unlocked session(s) found out of ${files.length} total.`);
}

function bless(sessionId: string) {
  const files = findSessionFiles(SESSIONS_ROOT);
  const target = files.find((f) => basename(f, ".json") === sessionId);
  if (!target) {
    console.error(`Session ${sessionId} not found.`);
    process.exit(1);
  }

  const session = loadSession(target);
  if (!session) {
    console.error(`Failed to parse session ${sessionId}.`);
    process.exit(1);
  }

  if (!promoteStatus(session.meta.status, "blessed")) {
    console.error(`Cannot promote ${session.meta.status} to blessed.`);
    process.exit(1);
  }

  session.meta.status = "blessed";
  session.meta.updated_at = new Date().toISOString();
  writeFileSync(target, JSON.stringify(session, null, 2), "utf-8");

  // Update lineage
  const lineagePath = target.replace(/\.json$/, ".lineage.json");
  const lineage = loadLineage(target) || { session_id: sessionId, chain: [] };
  lineage.chain.push(makeLineageEvent("blessed", AUDITOR, `Blessed by ${AUDITOR}`));
  writeFileSync(lineagePath, JSON.stringify(lineage, null, 2), "utf-8");

  console.log(`Blessed: ${sessionId}`);
}

function lock(sessionId: string) {
  const files = findSessionFiles(SESSIONS_ROOT);
  const target = files.find((f) => basename(f, ".json") === sessionId);
  if (!target) {
    console.error(`Session ${sessionId} not found.`);
    process.exit(1);
  }

  const session = loadSession(target);
  if (!session) {
    console.error(`Failed to parse session ${sessionId}.`);
    process.exit(1);
  }

  const lineage = loadLineage(target) || { session_id: sessionId, chain: [] };
  const issues = checkLockReady(session, lineage);
  if (issues.length > 0) {
    console.error("Cannot lock. Issues:");
    issues.forEach((i) => console.error(`  - ${i}`));
    process.exit(1);
  }

  const hashBefore = sha256(target);
  session.meta.status = "locked";
  session.meta.updated_at = new Date().toISOString();
  writeFileSync(target, JSON.stringify(session, null, 2), "utf-8");
  const hashAfter = sha256(target);

  lineage.chain.push({
    ...makeLineageEvent("locked", AUDITOR, `Locked by ${AUDITOR}`),
    sha256_before: hashBefore,
    sha256_after: hashAfter,
  });
  const lineagePath = target.replace(/\.json$/, ".lineage.json");
  writeFileSync(lineagePath, JSON.stringify(lineage, null, 2), "utf-8");

  console.log(`Locked: ${sessionId}`);
  console.log(`  SHA-256: ${hashAfter}`);
  console.log(`  Auditor: ${AUDITOR}`);
  console.log(`  Timestamp: ${session.meta.updated_at}`);
}

function archive(sessionId: string) {
  const files = findSessionFiles(SESSIONS_ROOT);
  const target = files.find((f) => basename(f, ".json") === sessionId);
  if (!target) {
    console.error(`Session ${sessionId} not found.`);
    process.exit(1);
  }

  const session = loadSession(target);
  if (!session) {
    console.error(`Failed to parse session ${sessionId}.`);
    process.exit(1);
  }

  if (session.meta.status !== "locked") {
    console.error(`Session must be locked before archiving (current: ${session.meta.status}).`);
    process.exit(1);
  }

  const relPath = target.replace(SESSIONS_ROOT + "/", "");
  const archivePath = join(ARCHIVE_ROOT, relPath);
  const archiveDir = join(archivePath, "..");
  mkdirSync(archiveDir, { recursive: true });

  copyFileSync(target, archivePath);

  // Copy lineage too
  const lineageSrc = target.replace(/\.json$/, ".lineage.json");
  const lineageDst = archivePath.replace(/\.json$/, ".lineage.json");
  try {
    copyFileSync(lineageSrc, lineageDst);
  } catch {
    // lineage file may not exist
  }

  // Update status
  session.meta.status = "archived";
  session.meta.updated_at = new Date().toISOString();
  writeFileSync(target, JSON.stringify(session, null, 2), "utf-8");

  console.log(`Archived: ${sessionId}`);
  console.log(`  Source: ${target}`);
  console.log(`  Archive: ${archivePath}`);
}

// ─── CLI Entry ───

const args = process.argv.slice(2);
const command = args[0];
const sessionId = args[1];

switch (command) {
  case "--scan":
    scan();
    break;
  case "--bless":
    if (!sessionId) { console.error("Usage: lock-session --bless <session_id>"); process.exit(1); }
    bless(sessionId);
    break;
  case "--lock":
    if (!sessionId) { console.error("Usage: lock-session --lock <session_id>"); process.exit(1); }
    lock(sessionId);
    break;
  case "--archive":
    if (!sessionId) { console.error("Usage: lock-session --archive <session_id>"); process.exit(1); }
    archive(sessionId);
    break;
  default:
    console.log(`DreamChamber Lock Session — Weekly Audit CLI

Usage:
  lock-session --scan                  Show all unlocked sessions
  lock-session --bless <session_id>    Promote to blessed
  lock-session --lock <session_id>     Lock immutably (requires blessed + confidence >= 0.8)
  lock-session --archive <session_id>  Copy locked session to Google Drive canonical path

Environment:
  DREAMCHAMBER_SESSIONS_ROOT   Session storage root (default: ~/DreamChamber/_SESSIONS)
  DREAMCHAMBER_ARCHIVE_ROOT    Google Drive archive path
  DREAMCHAMBER_AUDITOR         Your auditor ID (default: RSP001)`);
}
