-- ==============================================================================
-- 002_consent_law25.sql: Law 25 / CAI Biometric Consent Ledger
-- Invariants: 150-dimensional non-reversible voice hash, CAI 60-day filing ref,
--             necessity and proportionality verification, fail-closed RLS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.biometric_consent_registry (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_tag TEXT NOT NULL REFERENCES public.sovereign_entities(actor_tag),
    voice_hash_150d TEXT NOT NULL UNIQUE, -- 150-dimensional non-reversible hash
    cai_declaration_ref TEXT NOT NULL,    -- CAI 60-day filing reference
    necessity_proportionality_cleared BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE public.biometric_consent_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consent_isolated_policy ON public.biometric_consent_registry;
CREATE POLICY consent_isolated_policy ON public.biometric_consent_registry
    FOR SELECT TO authenticated
    USING (revoked_at IS NULL AND necessity_proportionality_cleared = TRUE);
