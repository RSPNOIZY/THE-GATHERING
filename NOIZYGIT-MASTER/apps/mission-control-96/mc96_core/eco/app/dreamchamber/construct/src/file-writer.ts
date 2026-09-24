import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import {
  SessionSchema,
  type Session,
  buildSessionPath,
  makeLineageEvent,
  validateSession,
} from "./schema/index.js";

// Never write to GOD. Always route to external storage.
const SESSIONS_ROOT =
  process.env.DREAMCHAMBER_SESSIONS_ROOT ||
  join(process.env.HOME || "/tmp", "DreamChamber", "_SESSIONS");

export interface WriteResult {
  ok: boolean;
  path: string;
  sha256: string;
  errors?: string[];
}

export function writeSession(data: unknown): WriteResult {
  const validation = validateSession(data);
  if (!validation.ok) {
    return {
      ok: false,
      path: "",
      sha256: "",
      errors: (validation as { ok: false; errors: string[] }).errors,
    };
  }

  const session = validation.data as Session;
  const relPath = buildSessionPath(
    session.meta.brand,
    session.meta.created_at,
    session.meta.session_id
  );
  const fullPath = join(SESSIONS_ROOT, relPath);

  const json = JSON.stringify(session, null, 2);
  const sha256 = createHash("sha256").update(json).digest("hex");

  const dir = dirname(fullPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(fullPath, json, "utf-8");

  // Write companion lineage file
  const lineagePath = fullPath.replace(/\.json$/, ".lineage.json");
  const lineage = {
    session_id: session.meta.session_id,
    chain: [
      makeLineageEvent("created", "file-writer", `sha256:${sha256}`),
    ],
  };
  writeFileSync(lineagePath, JSON.stringify(lineage, null, 2), "utf-8");

  return { ok: true, path: fullPath, sha256 };
}

// CLI entry: pipe cleaned transcript JSON in
if (process.argv[1]?.endsWith("file-writer.ts") || process.argv[1]?.endsWith("file-writer.js")) {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: file-writer <session.json>");
    process.exit(1);
  }

  const { readFileSync } = await import("node:fs");
  const raw = JSON.parse(readFileSync(input, "utf-8"));
  const result = writeSession(raw);

  if (result.ok) {
    console.log(`Written: ${result.path}`);
    console.log(`SHA-256: ${result.sha256}`);
  } else {
    console.error("Validation failed:");
    result.errors?.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
}
