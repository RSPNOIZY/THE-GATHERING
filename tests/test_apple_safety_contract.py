#!/usr/bin/env python3
"""
Apple safety contract verification for the NOIZY / MC96 v2.5 upgrade.

These checks are intentionally plain Python so the master verifier can run on a
fresh machine without pytest.
"""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read_text(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_inference_policy_declares_apple_surface_boundaries():
    policy = json.loads(read_text("config/inference-policy.json"))
    assert policy["inference_policy_version"] == "2.5.0"

    apple_lane = policy["routing_rules"]["tier_3_apple_system_surfaces"]
    assert apple_lane["authority"] == "READ_ONLY_OR_PENDING_APPROVAL"
    assert "silent_navigation_injection" in apple_lane["blocked_tasks"]
    assert "vehicle_remote_control" in policy["routing_rules"]["tier_0_on_device_foundation_models"]["blocked_tasks"]
    assert "NEVER_USE_APP_INTENTS_AS_HIDDEN_ADMIN_EXECUTION" in policy["never_clauses"]

    contract = policy["apple_surface_contract"]
    assert contract["carplay_handoff"] == "USER_VISIBLE_TAP_REQUIRED"
    assert "raw_route_polyline" in contract["live_activity_redacted_fields"]
    assert "session_tokens" in contract["live_activity_redacted_fields"]


def test_apple_intents_are_read_only_or_pending_approval_surfaces():
    for path in [
        "NOIZY-iOS-Native/LucyIntents.swift",
        "LUCY/apple/AppIntents/LucyAppIntents.swift",
    ]:
        source = read_text(path)
        assert "PrepareNavigationHandoffIntent" in source
        assert "visible tap" in source or "user-tap" in source
        assert "All 4 sovereign layers passing 100%" not in source
        assert "All 4 Sovereign Layers 100% Certified" not in source
        assert "Governance Review Complete" not in source
        assert "D1 Harmony Ledger synchronized" not in source
        assert "Sovereign Lock Active" not in source
        assert "mutation executed from Siri" in source or "mutation was executed from Siri" in source


def test_gabriel_routes_mcp_fails_closed_and_redacts_route_geometry():
    source = read_text("LUCY/src/telemetry/gabriel-routes-mcp.ts")
    assert 'NOIZY_INTERNAL_KEY = process.env.NOIZY_INTERNAL_KEY' in source
    assert 'CONSENT_TOKEN_HMAC_SECRET = process.env.CONSENT_TOKEN_HMAC_SECRET' in source
    assert '|| "nz_internal_prod_token"' not in source
    assert "MC96_PROD_SOVEREIGN_TOKEN" not in source
    assert "ALLOW_LOCAL_CONSENT_STUB" in source
    assert "REQUIRE_REMOTE_RECEIPT" in source
    assert '"gabriel_compute_traffic_route"' in source
    assert "polyline: mockPolyline" not in source
    assert "polyline: encodedPolyline" not in source
    assert "polyline_hash" in source


def test_harmony_worker_exposes_real_fail_closed_rest_boundaries():
    source = read_text("infrastructure/mcp-worker/src/index.ts")
    assert "const url = new URL(request.url)" in source
    assert "DB_HARMONY?: D1Database" in source
    assert "MC96_SECRET?: string" in source
    assert "Fail-closed: MC96_SECRET binding missing" in source
    assert "DB_HARMONY binding missing in production" in source
    assert "/api/v1/consent/verify" in source
    assert "/api/v1/ledger/commit" in source


def test_node_runner_uses_signed_user_visible_handoff():
    source = read_text("LUCY/src/telemetry/node_runner.py")
    assert "PUSHCUT_HANDOFF_SECRET" in source
    assert "SIGNED_60S" in source
    assert "expires_at" in source
    assert "ttl_seconds" in source
    assert '"gabriel_compute_traffic_route"' in source
    assert "Tap to review navigation handoff" in source


if __name__ == "__main__":
    test_inference_policy_declares_apple_surface_boundaries()
    print("Apple policy boundaries passed.")
    test_apple_intents_are_read_only_or_pending_approval_surfaces()
    print("Apple App Intents safety copy passed.")
    test_gabriel_routes_mcp_fails_closed_and_redacts_route_geometry()
    print("GABRIEL routes MCP fail-closed checks passed.")
    test_harmony_worker_exposes_real_fail_closed_rest_boundaries()
    print("Harmony Worker REST boundary checks passed.")
    test_node_runner_uses_signed_user_visible_handoff()
    print("Node runner signed handoff checks passed.")
    print("\nAPPLE SAFETY CONTRACT PASSED")
