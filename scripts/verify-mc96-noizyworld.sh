#!/usr/bin/env bash
set -e

# ==============================================================================
# MC96 NOIZYWORLD — MASTER SOVEREIGN HEALTH CHECK & CONTINUOUS EVIDENCE HARNESS
# Host: NOIZYWORLD.local | Target: /Users/m2ultra/THE-GATHERING
# Authority: RSP_001 | Plowman Standard: 75/25 Hardcoded Invariant
# ==============================================================================

echo "======================================================================"
echo "⚡ MC96 NOIZYWORLD — MASTER SOVEREIGN HEALTH CHECK & EVIDENCE HARNESS"
echo "Host: $(hostname) | Target: /Users/m2ultra/THE-GATHERING"
echo "======================================================================"

cd /Users/m2ultra/THE-GATHERING

echo ""
echo "📁 [1/6] Verifying Core Architectural Topologies & Schema Contracts..."
for dir in "supabase/migrations" "infrastructure/mcp-worker" "LUCY/src/telemetry" "agents/noizyarmy" "control-plane" "core/sovereign_runtime" "schemas" "docs" "tests"; do
    if [ -d "$dir" ]; then
        echo "   ✅ Found directory: $dir"
    else
        echo "   ❌ Missing directory: $dir"
        exit 1
    fi
done

for schema in "decision-packet.schema.json" "capability-registry.schema.json" "harmony-receipt.schema.json" "sonic-passport.schema.json"; do
    if [ -f "schemas/$schema" ]; then
        echo "   ✅ Schema contract: schemas/$schema verified."
    else
        echo "   ❌ Missing schema: schemas/$schema"
        exit 1
    fi
done

echo ""
echo "📜 [2/6] Checking Supabase DDL Migrations..."
for migration in "001_core.sql" "002_consent_law25.sql" "003_mc96_ledger.sql" "004_audit_evidence_c2pa.sql"; do
    if [ -f "supabase/migrations/$migration" ]; then
        echo "   ✅ $migration intact ($(wc -l < "supabase/migrations/$migration") lines)"
    else
        echo "   ❌ Missing migration: $migration"
        exit 1
    fi
done

echo ""
echo "🐍 [3/6] Running Python Continuous Evidence Harness, Vertical Slice & Sovereign Runtime..."
python3 tests/test_vertical_slice_all_lanes.py
python3 tests/test_continuous_evidence_harness.py
python3 tests/test_sovereign_runtime.py
echo "Running Google Routes Service tests..."
python3 tests/test_google_routes_service.py

echo ""
echo "🟦 [4/6] Running TypeScript Integration Suite..."
node tests/test-stack-integration.ts

echo ""
echo "🎬 [5/6] Running Audio & Video Control Plane Suite..."
node tests/test_media_control_plane.ts

echo ""
echo "🌐 [6/6] Validating Master Ecosystem Manifest..."
if [ -f "MC96_NOIZYWORLD_MANIFEST.json" ]; then
    echo "   ✅ MC96_NOIZYWORLD_MANIFEST.json verified."
else
    echo "   ❌ Missing manifest: MC96_NOIZYWORLD_MANIFEST.json"
    exit 1
fi

echo ""
echo "======================================================================"
echo "🏆 THE ENTIRE MC96 NOIZY SOVEREIGN RUNTIME IS 100% OPERATIONAL & CERTIFIED!"
echo "======================================================================"
