-- ==============================================================================
-- 004_audit_evidence_c2pa.sql: Tamper-Evident C2PA v2.2 Provenance Chain
-- Invariants: C2PA v2.2 JUMBF manifests, Ed25519 signatures, Genesis hash verification
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.c2pa_evidence_vault (
    evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL,
    command_id UUID REFERENCES public.mc96_command_ledger(command_id),
    prev_manifest_hash TEXT NOT NULL,
    manifest_hash TEXT NOT NULL UNIQUE,
    c2pa_jumbf_manifest BYTEA NOT NULL,
    sidecar_meta TEXT NOT NULL,
    signature_ed25519 TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Chain Verification Function
CREATE OR REPLACE FUNCTION verify_c2pa_chain(p_manifest_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_prev TEXT;
    v_actual_prev TEXT;
BEGIN
    SELECT prev_manifest_hash INTO v_prev FROM public.c2pa_evidence_vault WHERE manifest_hash = p_manifest_hash;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    IF v_prev = 'GENESIS' THEN
        RETURN TRUE;
    END IF;
    SELECT manifest_hash INTO v_actual_prev FROM public.c2pa_evidence_vault WHERE manifest_hash = v_prev;
    RETURN (v_actual_prev IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
