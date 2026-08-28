-- ============================================================================
-- 003_swarm_agents.sql — NOIZYARMY Swarm Infrastructure & Gating Matrix
-- Version: 1.0.0
-- Invariants: Swarm agent registries, DAG mission coordination, inter-agent messages,
--             token budgets, and Never Clause capability policy gating
-- ============================================================================

-- Enum for Swarm Archetypes
DO $$ BEGIN
    CREATE TYPE swarm_archetype AS ENUM ('commander', 'architect', 'debugger', 'tester', 'sentinel', 'auditor', 'documenter', 'refactorer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mission_status AS ENUM ('pending', 'planning', 'executing', 'validating', 'completed', 'failed', 'blocked_by_gating');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('queued', 'running', 'verifying', 'done', 'failed', 'gated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Swarm Agent Registry
CREATE TABLE IF NOT EXISTS public.swarm_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    moniker TEXT NOT NULL UNIQUE,
    archetype swarm_archetype NOT NULL,
    model_family TEXT NOT NULL DEFAULT 'gemma3',
    fallback_model TEXT NOT NULL DEFAULT 'mistral',
    clearance clearance_tier NOT NULL DEFAULT 'T1_SANDBOX',
    max_token_budget_per_run INT NOT NULL DEFAULT 64000,
    system_prompt_template TEXT NOT NULL,
    capabilities TEXT[] NOT NULL DEFAULT '{"read_code", "suggest_fix", "run_eval"}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Swarm Missions (High-Level DAG Objectives)
CREATE TABLE IF NOT EXISTS public.swarm_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    initiator_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    objective TEXT NOT NULL,
    status mission_status NOT NULL DEFAULT 'pending',
    dag_graph JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
    total_tokens_consumed BIGINT NOT NULL DEFAULT 0,
    total_cost_usd DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_summary TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Swarm Sub-Tasks (Atomic Agent Work Items)
CREATE TABLE IF NOT EXISTS public.swarm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES public.swarm_missions(id) ON DELETE CASCADE,
    assigned_agent_id UUID REFERENCES public.swarm_agents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    task_description TEXT NOT NULL,
    status task_status NOT NULL DEFAULT 'queued',
    priority INT NOT NULL DEFAULT 1,
    dependencies UUID[] DEFAULT '{}',
    input_artifacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    output_artifacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    output_result TEXT,
    tokens_used INT NOT NULL DEFAULT 0,
    execution_time_ms BIGINT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Inter-Agent Communication & Consensus Messages
CREATE TABLE IF NOT EXISTS public.agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES public.swarm_missions(id) ON DELETE CASCADE,
    sender_agent_id UUID REFERENCES public.swarm_agents(id) ON DELETE SET NULL,
    recipient_agent_id UUID REFERENCES public.swarm_agents(id) ON DELETE SET NULL,
    channel TEXT NOT NULL DEFAULT 'swarm_internal',
    message_type TEXT NOT NULL DEFAULT 'task_handoff', -- 'task_handoff', 'code_review', 'consensus_vote', 'gating_alert'
    content TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Agent Gating & Policy Evaluation Audit Log
CREATE TABLE IF NOT EXISTS public.gating_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.swarm_tasks(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.swarm_agents(id) ON DELETE SET NULL,
    action_attempted TEXT NOT NULL,
    required_clearance clearance_tier NOT NULL,
    agent_clearance clearance_tier NOT NULL,
    is_allowed BOOLEAN NOT NULL,
    policy_code TEXT NOT NULL, -- 'NEVER_CLAUSE_75_25', 'NO_UNVERIFIED_WRITE', 'CONSENT_REQUIRED', 'ROOT_GATED'
    reason TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_swarm_missions_status ON public.swarm_missions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swarm_tasks_mission ON public.swarm_tasks(mission_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_messages_mission ON public.agent_messages(mission_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_gating_audit_allowed ON public.gating_audit_log(is_allowed, evaluated_at DESC);

-- Enable RLS
ALTER TABLE public.swarm_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swarm_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swarm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gating_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Swarm agents viewable by authenticated users" ON public.swarm_agents FOR SELECT USING (true);
CREATE POLICY "Swarm missions viewable by authenticated users" ON public.swarm_missions FOR SELECT USING (true);
CREATE POLICY "Swarm tasks viewable by authenticated users" ON public.swarm_tasks FOR SELECT USING (true);
CREATE POLICY "Agent messages viewable by authenticated users" ON public.agent_messages FOR SELECT USING (true);
CREATE POLICY "Gating logs viewable by auditors" ON public.gating_audit_log FOR SELECT USING (true);
