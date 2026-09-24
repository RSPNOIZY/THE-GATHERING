import { z } from "zod";

export const AuditEntrySchema = z.object({
  session_id: z.string().min(1),
  auditor: z.string().min(1),
  action: z.enum(["scan", "bless", "lock", "archive", "flag", "reject"]),
  timestamp: z.string().datetime(),
  reason: z.string().optional(),
  confidence_at_audit: z.number().min(0).max(1).optional(),
  signal_quality_at_audit: z.string().optional(),
});

export const AuditLogSchema = z.object({
  week_of: z.string(),
  entries: z.array(AuditEntrySchema),
  summary: z.object({
    scanned: z.number().nonnegative(),
    blessed: z.number().nonnegative(),
    locked: z.number().nonnegative(),
    archived: z.number().nonnegative(),
    flagged: z.number().nonnegative(),
  }),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
