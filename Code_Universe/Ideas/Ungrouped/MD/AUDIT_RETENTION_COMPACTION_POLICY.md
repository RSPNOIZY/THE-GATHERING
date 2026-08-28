# AUDIT RETENTION & COMPACTION POLICY

## Purpose

Define **how long audit data is retained**, **what may be compacted**, and **what must never be destroyed**, while preserving legal, ethical, and cryptographic integrity.

Key constraint:

> Audit data may be *summarized* or *sealed*, but never erased in a way that breaks accountability.

---

## Audit Event Classes

| Class | Examples | Retention Policy |
|-------|----------|------------------|
| Irreversible Actions | migration token used, consent revocation, kill switch activation | **Permanent** |
| Governance Decisions | freeze, promotion approval, zone migration | **10 years** |
| Automated Promotions | KV→D1 promotions, canary promotions | **5 years** |
| Routine Operational Events | window resets, retries, signal updates | **90 days (compactable)** |
| Health Pings | startup checks, preflight assertions | **7 days (purgeable)** |

---

## Compaction Strategy

### Allowed

- Aggregate **routine operational events** into daily summaries
- Move historical events into a `audit_events_archive` table
- Hash sealed records for tamper evidence (see AUDIT_TAMPER_EVIDENCE_SPEC.md)

### Disallowed

- Deleting irreversible or consent-related events
- Editing historical rows
- Rewriting actor, action, or timestamp fields
- Removing any event that is part of the hash chain before its successor is also archived

---

## Example Compaction Job

```sql
-- Archive routine events older than 90 days
INSERT INTO audit_events_archive
SELECT
  operator_email as actor,
  action,
  COUNT(*) as count,
  DATE(created_at) as event_date,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event
FROM audit_events
WHERE action IN ('WINDOW_RESET', 'PREFLIGHT_CHECK', 'SIGNAL_UPDATE')
  AND created_at < DATETIME('now', '-90 days')
GROUP BY operator_email, action, DATE(created_at);

-- Remove compacted events (only after archival succeeds)
DELETE FROM audit_events
WHERE action IN ('WINDOW_RESET', 'PREFLIGHT_CHECK', 'SIGNAL_UPDATE')
  AND created_at < DATETIME('now', '-90 days');
```

---

## Health Ping Purge

```sql
-- Purge health pings older than 7 days (no archival needed)
DELETE FROM audit_events
WHERE action LIKE 'preflight:%'
  AND created_at < DATETIME('now', '-7 days');
```

---

## Enforcement

- Compaction jobs **must themselves emit an `AUDIT_COMPACTION` event** before execution
- Compaction logic runs only via controlled Workers (never manually via wrangler CLI)
- Compaction requires S3 (metrics stable) signal to be true
- Failed compaction triggers FREEZE-004 (Promotion Window Reset)

---

## Archive Table Schema

```sql
CREATE TABLE IF NOT EXISTS audit_events_archive (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER NOT NULL,
  event_date TEXT NOT NULL,
  first_event TEXT NOT NULL,
  last_event TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_archive_action ON audit_events_archive(action);
CREATE INDEX IF NOT EXISTS idx_archive_date ON audit_events_archive(event_date);
```

---

## Compliance Notes

- SOC2 Type II expects 1-year minimum retention for security events
- GDPR allows retention for legitimate business purposes (audit falls under this)
- This policy exceeds regulatory minimums for governance-critical events

---

## Review Schedule

This policy should be reviewed:
- Annually
- After any compliance audit
- After any incident involving audit data

---

*Rule: Audit data may be summarized or sealed, but never erased in a way that breaks accountability.*
