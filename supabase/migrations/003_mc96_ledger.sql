-- ==============================================================================
-- 003_mc96_ledger.sql: Rule Zero Command & Execution Ledger
-- Invariants: ONE COMMAND → ONE ACTION → ONE RECEIPT
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mc96_command_ledger (
    command_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL UNIQUE,
    actor_tag TEXT NOT NULL,
    target_engine TEXT NOT NULL, -- e.g., 'GABRIEL', 'LUCY', 'HONDA_TELEMETRY'
    action_verb audit_action_verb NOT NULL,
    raw_payload JSONB NOT NULL,
    execution_status TEXT NOT NULL CHECK (execution_status IN ('PENDING', 'SUCCESS', 'FAIL_CLOSED', 'REJECTED')),
    receipt_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_mc96_idempotency ON public.mc96_command_ledger (idempotency_key);
ALTER TABLE public.mc96_command_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mc96_read_policy ON public.mc96_command_ledger;
CREATE POLICY mc96_read_policy ON public.mc96_command_ledger FOR SELECT TO authenticated USING (true);
