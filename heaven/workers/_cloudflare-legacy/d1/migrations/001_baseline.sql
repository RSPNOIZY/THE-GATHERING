-- NOIZY D1 Migration 001: Baseline
-- This documents the existing schema in gabriel_db
-- Run with: npx wrangler d1 execute gabriel_db --remote --file cloudflare/d1/migrations/001_baseline.sql

-- Core consent tables (already exist)
-- hvs_actors, hvs_never_clauses, hvs_voice_dna, hvs_descendants
-- hvs_consent_tokens, hvs_synth_requests, hvs_licenses, hvs_licensees
-- hvs_rate_table, hvs_union_tiers, hvs_estates, hvs_premis_events
-- noizy_ledger

-- This migration is a no-op marker — schema already deployed via seed.sql
SELECT 'Migration 001: Baseline schema documented' AS status;
