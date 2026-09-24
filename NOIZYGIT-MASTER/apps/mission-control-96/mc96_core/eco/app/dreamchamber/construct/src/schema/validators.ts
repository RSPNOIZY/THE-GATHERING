import { SessionSchema, type Session } from "./session.js";
import { LineageSchema, type Lineage } from "./lineage.js";
import { AuditEntrySchema, type AuditEntry } from "./audit.js";

export type ValidationResult =
  | { ok: true; data: unknown }
  | { ok: false; errors: string[] };

export function validateSession(data: unknown): ValidationResult {
  const result = SessionSchema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    ),
  };
}

export function validateLineage(data: unknown): ValidationResult {
  const result = LineageSchema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    ),
  };
}

export function validateAuditEntry(data: unknown): ValidationResult {
  const result = AuditEntrySchema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`
    ),
  };
}

export function checkConsentValid(session: Session): string[] {
  const issues: string[] = [];
  for (const subject of session.subjects) {
    if (!subject.consent.granted) {
      issues.push(`Subject ${subject.id} (${subject.name}): consent not granted`);
    }
    if (subject.consent.revoked_at) {
      issues.push(`Subject ${subject.id} (${subject.name}): consent revoked at ${subject.consent.revoked_at}`);
    }
    if (subject.role === "minor" && !subject.guardian_id) {
      issues.push(`Subject ${subject.id} (${subject.name}): minor without guardian_id`);
    }
  }
  return issues;
}

export function checkLockReady(session: Session, lineage: Lineage): string[] {
  const issues: string[] = [];

  if (session.meta.status !== "blessed") {
    issues.push(`Session must be blessed before locking (current: ${session.meta.status})`);
  }

  if (session.meta.confidence < 0.8) {
    issues.push(`Confidence ${session.meta.confidence} below lock threshold (0.8)`);
  }

  const hasBlessed = lineage.chain.some((e) => e.event === "blessed");
  if (!hasBlessed) {
    issues.push("No blessed event in lineage chain");
  }

  issues.push(...checkConsentValid(session));

  return issues;
}
