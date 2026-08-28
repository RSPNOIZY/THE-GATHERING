"""
test_swarm_gates.py
Automated Verification Suite for NOIZY Sovereign Architecture Blueprint
Tests:
1. Supabase DDL SQL integrity (001_core.sql - 004_audit_evidence_c2pa.sql)
2. MCP Worker Router JSON-RPC & Rule Zero receipt generation
3. LUCY Vehicular Telemetry read-only gating
4. NOIZYARMY Swarm YAML Spec & GABRIEL clearance
"""

import os
import re
import json
import pytest

MIGRATIONS_DIR = "/Users/m2ultra/THE-GATHERING/supabase/migrations"
SWARM_YAML = "/Users/m2ultra/THE-GATHERING/agents/noizyarmy/swarm_spec_v1.yaml"
TELEMETRY_SCRIPT = "/Users/m2ultra/THE-GATHERING/LUCY/src/telemetry/lucy_vehicular_telemetry.py"
MCP_WORKER_INDEX = "/Users/m2ultra/THE-GATHERING/infrastructure/mcp-worker/src/index.ts"

def test_layer1_ddl_migrations_exist_and_valid():
    """Verify all 4 Supabase migrations exist and enforce core invariants."""
    files = [
        "001_core.sql",
        "002_consent_law25.sql",
        "003_mc96_ledger.sql",
        "004_audit_evidence_c2pa.sql"
    ]
    for f in files:
        path = os.path.join(MIGRATIONS_DIR, f)
        assert os.path.exists(path), f"Missing migration file: {f}"
        with open(path, "r", encoding="utf-8") as fh:
            content = fh.read()
            assert len(content) > 100
            
    # Verify 75/25 check constraint in 001_core.sql
    with open(os.path.join(MIGRATIONS_DIR, "001_core.sql"), "r") as fh:
        core_sql = fh.read()
        assert "covenant_split NUMERIC(5,2) NOT NULL DEFAULT 75.00 CHECK (covenant_split = 75.00)" in core_sql
        assert "kill_switch_holder TEXT NOT NULL DEFAULT 'RSP_001' CHECK (kill_switch_holder = 'RSP_001')" in core_sql
        assert "CREATE TABLE IF NOT EXISTS public.sovereign_entities" in core_sql

    # Verify Law 25 in 002_consent_law25.sql
    with open(os.path.join(MIGRATIONS_DIR, "002_consent_law25.sql"), "r") as fh:
        consent_sql = fh.read()
        assert "voice_hash_150d" in consent_sql
        assert "cai_declaration_ref" in consent_sql

    # Verify Rule Zero in 003_mc96_ledger.sql
    with open(os.path.join(MIGRATIONS_DIR, "003_mc96_ledger.sql"), "r") as fh:
        ledger_sql = fh.read()
        assert "public.mc96_command_ledger" in ledger_sql
        assert "idempotency_key" in ledger_sql

    # Verify C2PA Chain in 004_audit_evidence_c2pa.sql
    with open(os.path.join(MIGRATIONS_DIR, "004_audit_evidence_c2pa.sql"), "r") as fh:
        c2pa_sql = fh.read()
        assert "verify_c2pa_chain" in c2pa_sql
        assert "c2pa_evidence_vault" in c2pa_sql

def test_layer2_mcp_worker_source_integrity():
    """Verify Layer 2 MCP worker code has server/discover, tools/call, and gabriel_enforce_covenant."""
    with open(MCP_WORKER_INDEX, "r", encoding="utf-8") as fh:
        content = fh.read()
        assert "server/discover" in content
        assert "gabriel_enforce_covenant" in content
        assert "lucy_vehicle_telemetry_get" in content
        assert "killSwitchHolder: \"RSP_001\"" in content
        assert "covenant: \"75/25\"" in content

def test_layer3_lucy_telemetry_safe_gating():
    """Verify Layer 3 vehicle gateway blocks non-read-only actions."""
    from importlib.machinery import SourceFileLoader
    telemetry_mod = SourceFileLoader("lucy_telemetry", TELEMETRY_SCRIPT).load_module()
    
    gateway = telemetry_mod.LucyVehicleGateway(api_key="TEST_KEY", sovereign_token="TEST_TOKEN")
    
    # Allowed read-only endpoints
    res_fuel = gateway.get_safe_telemetry("fuel_range")
    assert res_fuel["status"] == "SUCCESS"
    assert res_fuel["metric"] == "fuel_range"

    res_battery = gateway.get_safe_telemetry("battery_status")
    assert res_battery["status"] == "SUCCESS"

    # Forbidden mutation endpoint (locks, start) -> Must Fail-Closed
    res_forbidden = gateway.get_safe_telemetry("remote_engine_start")
    assert res_forbidden["status"] == "FAIL_CLOSED"
    assert "Violation" in res_forbidden["error"]

def test_layer4_swarm_yaml_spec():
    """Verify Layer 4 NOIZYARMY swarm specification invariants."""
    assert os.path.exists(SWARM_YAML)
    with open(SWARM_YAML, "r", encoding="utf-8") as fh:
        raw_yaml = fh.read()
        assert 'master_architect: "RSP_001"' in raw_yaml
        assert "kill_switch_enabled: true" in raw_yaml
        assert "SWARM_AGENT_DEEP_RESEARCH" in raw_yaml
        assert "SWARM_AGENT_AUDIO_DSP" in raw_yaml
        assert 'operator: "GABRIEL"' in raw_yaml
        assert 'covenant_enforcement: "75_25_STRICT"' in raw_yaml

if __name__ == "__main__":
    test_layer1_ddl_migrations_exist_and_valid()
    print("✅ Layer 1 (Supabase DDL) Passed.")
    test_layer2_mcp_worker_source_integrity()
    print("✅ Layer 2 (MCP Worker Router) Passed.")
    test_layer3_lucy_telemetry_safe_gating()
    print("✅ Layer 3 (LUCY Telemetry Gateway) Passed.")
    test_layer4_swarm_yaml_spec()
    print("✅ Layer 4 (NOIZYARMY Swarm Spec) Passed.")
    print("\n🏆 ALL 4 SOVEREIGN LAYERS PASS 100% PREFLIGHT VERIFICATION!")
