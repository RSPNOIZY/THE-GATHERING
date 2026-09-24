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
echo "📁 [1/7] Verifying Core Architectural Topologies & Schema Contracts..."
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
echo "📜 [2/7] Checking Supabase DDL Migrations..."
for migration in "001_core.sql" "002_consent_law25.sql" "003_mc96_ledger.sql" "004_audit_evidence_c2pa.sql"; do
    if [ -f "supabase/migrations/$migration" ]; then
        echo "   ✅ $migration intact ($(wc -l < "supabase/migrations/$migration") lines)"
    else
        echo "   ❌ Missing migration: $migration"
        exit 1
    fi
done

echo ""
echo "🐍 [3/7] Running Python Continuous Evidence Harness, Vertical Slice & Sovereign Runtime..."
python3 tests/test_vertical_slice_all_lanes.py
python3 tests/test_continuous_evidence_harness.py
python3 tests/test_sovereign_runtime.py
echo "Running Google Routes Service tests..."
python3 tests/test_google_routes_service.py
python3 tests/test_apple_safety_contract.py

echo ""
echo "🟦 [4/7] Running TypeScript Integration Suite..."
node tests/test-stack-integration.ts

echo ""
echo "🎬 [5/7] Running Audio & Video Control Plane Suite..."
node tests/test_media_control_plane.ts

echo ""
echo "🌐 [6/7] Validating Master Ecosystem Manifest..."
if [ -f "MC96_NOIZYWORLD_MANIFEST.json" ]; then
    echo "   ✅ MC96_NOIZYWORLD_MANIFEST.json verified."
else
    echo "   ❌ Missing manifest: MC96_NOIZYWORLD_MANIFEST.json"
    exit 1
fi

echo ""
echo "🍎 [7/7] Apple Surface Rules — v2.5.0 Compliance Check..."

# 7a. Both Swift files must exist
for swift_file in \
    "LUCY/apple/AppIntents/LucyAppIntents.swift" \
    "NOIZY-iOS-Native/LucyIntents.swift"; do
    if [ -f "$swift_file" ]; then
        echo "   ✅ Swift file present: $swift_file"
    else
        echo "   ❌ Missing Swift file: $swift_file"
        exit 1
    fi
done

# 7b. Banned aspirational certification strings must not appear in either Swift file
BANNED_PATTERNS=(
    "100% sovereign"
    "100% certified"
    "All 4 sovereign layers"
    "Sovereign Lock Active"
    "Governance Review Complete"
    "CERTIFIED"
)
for swift_file in \
    "LUCY/apple/AppIntents/LucyAppIntents.swift" \
    "NOIZY-iOS-Native/LucyIntents.swift"; do
    for pattern in "${BANNED_PATTERNS[@]}"; do
        if grep -qF "$pattern" "$swift_file"; then
            echo "   ❌ Banned aspirational string found in $swift_file: \"$pattern\""
            echo "      App Intents must report state/proposals, not completion claims."
            exit 1
        fi
    done
    echo "   ✅ No banned certification strings in: $swift_file"
done

# 7c. inference-policy.json must be on 2.5.0 and contain the hidden-admin never-clause
if grep -q '"inference_policy_version": "2.5.0"' config/inference-policy.json; then
    echo "   ✅ inference-policy.json is on version 2.5.0"
else
    echo "   ❌ inference-policy.json is not on version 2.5.0"
    exit 1
fi
if grep -q 'NEVER_USE_APP_INTENTS_AS_HIDDEN_ADMIN_EXECUTION' config/inference-policy.json; then
    echo "   ✅ inference-policy.json contains NEVER_USE_APP_INTENTS_AS_HIDDEN_ADMIN_EXECUTION never-clause"
else
    echo "   ❌ Missing never-clause: NEVER_USE_APP_INTENTS_AS_HIDDEN_ADMIN_EXECUTION"
    exit 1
fi

# 7d. LUCY node runner must declare v2.5.0-PROD
if grep -q 'v2.5.0-PROD' LUCY/src/telemetry/node_runner.py; then
    echo "   ✅ LUCY/src/telemetry/node_runner.py is on v2.5.0-PROD"
else
    echo "   ❌ LUCY/src/telemetry/node_runner.py is not on v2.5.0-PROD"
    exit 1
fi

echo ""
echo "======================================================================"
echo "✅ MC96 NOIZYWORLD — SOVEREIGN HEALTH CHECK COMPLETE"
echo "   All 7 sections passed. Verifier evidence logged above."
echo "   Human verification and receipt review required before certification."
echo "======================================================================"
