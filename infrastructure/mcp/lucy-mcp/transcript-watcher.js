#!/usr/bin/env node
/**
 * TRANSCRIPT WATCHER — Lucy's Ears
 *
 * Watches the Audio Hijack transcript folder for new/changed files.
 * When a transcript appears or updates:
 *   1. Reads the content
 *   2. Tags with timestamp, source file, conversation type
 *   3. Writes to Lucy's intake queue
 *   4. Optionally auto-classifies intent and routes
 *
 * Usage:
 *   node transcript-watcher.js [transcript-folder-path]
 *
 * Default folder: ~/NOIZYLAB/transcripts/
 * Audio Hijack should be configured to save transcripts here.
 *
 * Environment:
 *   TRANSCRIPT_DIR  — Override transcript folder path
 *   WATCH_INTERVAL  — Polling interval in ms (default: 5000)
 *   AUTO_CLASSIFY   — Auto-classify incoming transcripts (default: true)
 */

import { watch, readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import { homedir } from "os";
import { randomBytes } from "crypto";

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const TRANSCRIPT_DIR =
  process.env.TRANSCRIPT_DIR ||
  join(homedir(), "NOIZYLAB", "transcripts");

const LUCY_STATE_DIR = join(homedir(), "NOIZYLAB", "lucy-state");
const INTAKE_FILE = join(LUCY_STATE_DIR, "intake.json");
const ARCHIVE_DIR = join(LUCY_STATE_DIR, "archive");

const WATCH_INTERVAL = parseInt(process.env.WATCH_INTERVAL || "5000", 10);
const AUTO_CLASSIFY = process.env.AUTO_CLASSIFY !== "false";

// Track what we've already processed
const processedFiles = new Map(); // filename -> { mtime, size, lastProcessedAt }

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function now() {
  return new Date().toISOString();
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

function ensureDirs() {
  for (const dir of [TRANSCRIPT_DIR, LUCY_STATE_DIR, ARCHIVE_DIR]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(INTAKE_FILE)) {
    writeFileSync(
      INTAKE_FILE,
      JSON.stringify(
        {
          queue: [],
          stats: { total_received: 0, total_archived: 0, total_synthesized: 0 },
        },
        null,
        2,
      ),
    );
  }
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2));
}

// Simple intent classification (mirrors Lucy MCP)
const INTENT_KEYWORDS = {
  build: ["build", "create", "make", "implement", "add", "write"],
  deploy: ["deploy", "ship", "push", "release", "publish"],
  consent: ["consent", "never clause", "kill switch", "revoke"],
  audio: ["voice", "audio", "tts", "speech", "sound"],
  code: ["code", "function", "bug", "error", "fix", "refactor"],
  test: ["test", "smoke", "verify", "check"],
  strategy: ["strategy", "roadmap", "vision", "plan", "future"],
  organize: ["task", "todo", "dazeflow", "session"],
};

function classifyIntent(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    scores[intent] = keywords.filter((kw) => lower.includes(kw)).length;
  }
  const sorted = Object.entries(scores)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : "general";
}

// ═══════════════════════════════════════════════════════════════
// PROCESS A TRANSCRIPT FILE
// ═══════════════════════════════════════════════════════════════

function processTranscript(filePath) {
  try {
    const content = readFileSync(filePath, "utf8").trim();
    if (!content || content.length < 10) return; // Skip empty/tiny files

    const fileName = basename(filePath);
    const stat = statSync(filePath);

    // Check if we've already processed this version
    const prev = processedFiles.get(fileName);
    if (prev && prev.mtime === stat.mtimeMs && prev.size === stat.size) {
      return; // Already processed this exact version
    }

    console.log(`[${now()}] Processing transcript: ${fileName}`);

    // Parse transcript content
    // Audio Hijack transcripts can be plain text or structured
    const lines = content.split("\n").filter((l) => l.trim());

    // Extract speakers if formatted as "Speaker: text"
    const messages = [];
    for (const line of lines) {
      const speakerMatch = line.match(/^([A-Za-z0-9_\s]+):\s*(.+)/);
      if (speakerMatch) {
        messages.push({
          speaker: speakerMatch[1].trim().toLowerCase(),
          content: speakerMatch[2].trim(),
        });
      } else {
        messages.push({
          speaker: "unknown",
          content: line.trim(),
        });
      }
    }

    // Auto-classify
    const intent = AUTO_CLASSIFY ? classifyIntent(content) : "general";

    // Create intake record
    const intakeId = makeId("TR");
    const intakeRecord = {
      id: intakeId,
      content: content,
      source: "transcript",
      metadata: {
        file_name: fileName,
        file_path: filePath,
        file_modified: stat.mtime.toISOString(),
        file_size: stat.size,
        message_count: messages.length,
        speakers: [...new Set(messages.map((m) => m.speaker))],
        auto_intent: intent,
        is_incremental: prev ? true : false,
      },
      received_at: now(),
      classified: AUTO_CLASSIFY,
      archived: false,
    };

    // Write to Lucy's intake queue
    const intakeData = readJson(INTAKE_FILE);
    intakeData.queue.push(intakeRecord);
    intakeData.stats.total_received++;
    writeJson(INTAKE_FILE, intakeData);

    // Also archive immediately
    const archiveRecord = {
      id: intakeId,
      type: "transcript",
      content: content,
      agent: "transcript-watcher",
      rules_fired: [],
      skills_active: [],
      tags: ["transcript", "audio-hijack", intent],
      metadata: intakeRecord.metadata,
      messages: messages,
      timestamp: now(),
      date: todayKey(),
    };

    writeFileSync(
      join(ARCHIVE_DIR, `${intakeId}.json`),
      JSON.stringify(archiveRecord, null, 2),
    );
    intakeData.stats.total_archived++;
    writeJson(INTAKE_FILE, intakeData);

    // Update tracking
    processedFiles.set(fileName, {
      mtime: stat.mtimeMs,
      size: stat.size,
      lastProcessedAt: now(),
    });

    console.log(
      `[${now()}] ✓ Archived [${intakeId}] · ${messages.length} messages · ${[...new Set(messages.map((m) => m.speaker))].join(", ")} · intent=${intent}`,
    );
  } catch (err) {
    console.error(`[${now()}] Error processing ${filePath}: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// SCAN FOLDER
// ═══════════════════════════════════════════════════════════════

function scanFolder() {
  try {
    const files = readdirSync(TRANSCRIPT_DIR).filter(
      (f) =>
        f.endsWith(".txt") ||
        f.endsWith(".srt") ||
        f.endsWith(".vtt") ||
        f.endsWith(".json") ||
        f.endsWith(".md"),
    );

    for (const file of files) {
      processTranscript(join(TRANSCRIPT_DIR, file));
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      // Folder doesn't exist yet — create it
      mkdirSync(TRANSCRIPT_DIR, { recursive: true });
      console.log(`[${now()}] Created transcript folder: ${TRANSCRIPT_DIR}`);
    } else {
      console.error(`[${now()}] Scan error: ${err.message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN — START WATCHING
// ═══════════════════════════════════════════════════════════════

ensureDirs();

console.log(`
═══════════════════════════════════════════════════════════════
  LUCY TRANSCRIPT WATCHER — v1.0.0
  NOIZY Empire · Audio Hijack Integration
═══════════════════════════════════════════════════════════════

  Watching: ${TRANSCRIPT_DIR}
  Polling interval: ${WATCH_INTERVAL}ms
  Auto-classify: ${AUTO_CLASSIFY}
  Lucy state: ${LUCY_STATE_DIR}
  Archive: ${ARCHIVE_DIR}

  Waiting for transcripts...
`);

// Initial scan
scanFolder();

// Poll for changes (more reliable than fs.watch across platforms)
setInterval(scanFolder, WATCH_INTERVAL);

// Also try native fs.watch for immediate response
try {
  watch(TRANSCRIPT_DIR, (eventType, filename) => {
    if (
      filename &&
      (filename.endsWith(".txt") ||
        filename.endsWith(".srt") ||
        filename.endsWith(".vtt") ||
        filename.endsWith(".json") ||
        filename.endsWith(".md"))
    ) {
      // Small delay to let the file finish writing
      setTimeout(() => {
        processTranscript(join(TRANSCRIPT_DIR, filename));
      }, 500);
    }
  });
  console.log(`[${now()}] Native file watcher active.`);
} catch {
  console.log(`[${now()}] Native file watcher unavailable — using polling only.`);
}
