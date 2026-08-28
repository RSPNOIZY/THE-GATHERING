-- ==============================================================================
-- 001_core.sql: Schema Core, Sovereignty Types, and Invariant Checks
-- Invariants: The Plowman Standard (75/25 Const), Kill Switch Holder = 'RSP_001'
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM ('draft', 'active', 'suspended', 'expired', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_action_verb AS ENUM ('GENERATE', 'ASK_ARTIST', 'BLOCK', 'INHERIT', 'DEFER', 'ESCALATE', 'SETTLE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.sovereign_entities (
    entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_tag TEXT NOT NULL UNIQUE, -- e.g. 'RSP_001'
    legal_name TEXT NOT NULL,
    covenant_split NUMERIC(5,2) NOT NULL DEFAULT 75.00 CHECK (covenant_split = 75.00), -- The Plowman Standard hardcoded
    kill_switch_holder TEXT NOT NULL DEFAULT 'RSP_001' CHECK (kill_switch_holder = 'RSP_001'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Row Level Security (RLS) Fail-Closed
ALTER TABLE public.sovereign_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sovereign_entities_admin_policy ON public.sovereign_entities;
CREATE POLICY sovereign_entities_admin_policy ON public.sovereign_entities
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'role' = 'service_role' OR auth.jwt() ->> 'actor_tag' = 'RSP_001');

-- Seed Sovereign Entity RSP_001 if missing
INSERT INTO public.sovereign_entities (actor_tag, legal_name, covenant_split, kill_switch_holder)
VALUES ('RSP_001', 'Robert Stephen Plowman — The DreamChamber', 75.00, 'RSP_001')
ON CONFLICT (actor_tag) DO NOTHING;
