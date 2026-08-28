"""
test_google_routes_service.py
Unit tests for google_routes_service.py.
Verifies: parse_google_duration, normalize_route_result, get_traffic_aware_route, Law 25 consent.
"""

import sys
import os
import uuid
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from LUCY.src.telemetry.google_routes_service import (
    parse_google_duration,
    normalize_route_result,
    get_traffic_aware_route,
)


def test_parse_google_duration():
    assert parse_google_duration(124) == 124
    assert parse_google_duration(124.4) == 124
    assert parse_google_duration(124.6) == 125
    assert parse_google_duration("124s") == 124
    assert parse_google_duration("123.5s") == 124
    assert parse_google_duration("124.6s") == 125
    assert parse_google_duration("  300s  ") == 300

    with pytest.raises(ValueError):
        parse_google_duration("invalid_duration")

    with pytest.raises(ValueError):
        parse_google_duration(None)


def test_normalize_route_result():
    # Test nested routes array format
    raw_payload = {
        "routes": [
            {
                "duration": "124s",
                "staticDuration": "98s",
                "distanceMeters": 6420,
                "polyline": {
                    "encodedPolyline": "abcd1234polyline"
                }
            }
        ],
        "fallbackInfo": False
    }

    res = normalize_route_result(raw_payload)
    assert res["provider"] == "google_routes"
    assert res["eta_seconds"] == 124
    assert res["static_eta_seconds"] == 98
    assert res["distance_meters"] == 6420
    assert res["encoded_polyline"] == "abcd1234polyline"
    assert res["fallback_used"] is False


def test_get_traffic_aware_route_success():
    # Mock callbacks
    def mock_consent_check(purpose, data_categories, policy_code):
        assert purpose == "traffic_eta"
        assert policy_code == "NC-01"
        return {"allowed": True, "consent_id": "CONSENT_OK"}

    def mock_mcp_call(server, tool, arguments):
        assert server == "google-routes"
        assert tool == "routes_compute"
        assert arguments["origin"]["latitude"] == 45.4215
        assert arguments["destination"]["latitude"] == 45.3225
        return {
            "routes": [
                {
                    "duration": "124s",
                    "staticDuration": "98s",
                    "distanceMeters": 6420,
                    "polyline": {"encodedPolyline": "xyz987"}
                }
            ]
        }

    def mock_ledger_write(operation, provider, policy_code, allowed, input_fingerprint, result_summary):
        assert operation == "traffic_eta_lookup"
        assert provider == "google_routes"
        assert policy_code == "NC-01"
        assert allowed is True
        assert result_summary["eta_seconds"] == 124
        return f"REC_LEDGER_{uuid.uuid4().hex[:8].upper()}"

    route = get_traffic_aware_route(
        pickup_lat=45.4215,
        pickup_lng=-75.6972,
        dropoff_lat=45.3225,
        dropoff_lng=-75.6692,
        mcp_call=mock_mcp_call,
        consent_check=mock_consent_check,
        ledger_write=mock_ledger_write,
    )

    assert route["provider"] == "google_routes"
    assert route["eta_seconds"] == 124
    assert route["static_eta_seconds"] == 98
    assert route["distance_meters"] == 6420
    assert route["encoded_polyline"] == "xyz987"
    assert route["ledger_receipt"].startswith("REC_LEDGER_")


def test_get_traffic_aware_route_consent_denied():
    def mock_consent_denied(purpose, data_categories, policy_code):
        return {"allowed": False, "reason": "Consent revoked by user"}

    def mock_dummy(*args, **kwargs):
        pass

    with pytest.raises(PermissionError, match="Location consent was not granted"):
        get_traffic_aware_route(
            pickup_lat=45.4215,
            pickup_lng=-75.6972,
            dropoff_lat=45.3225,
            dropoff_lng=-75.6692,
            mcp_call=mock_dummy,
            consent_check=mock_consent_denied,
            ledger_write=mock_dummy,
        )


def test_should_warn_about_delay():
    from LUCY.src.telemetry.google_routes_service import should_warn_about_delay

    # 1. Delay >= 600s threshold -> True
    assert should_warn_about_delay(eta_seconds=1000, baseline_seconds=300, threshold_seconds=600) is True
    assert should_warn_about_delay(eta_seconds=900, baseline_seconds=300, threshold_seconds=600) is True
    assert should_warn_about_delay(eta_seconds=900, baseline_seconds=300) is True  # default threshold 600

    # 2. Delay < 600s threshold -> False
    assert should_warn_about_delay(eta_seconds=899, baseline_seconds=300, threshold_seconds=600) is False
    assert should_warn_about_delay(eta_seconds=500, baseline_seconds=300, threshold_seconds=600) is False

    # 3. Faster than baseline (negative delta) -> False
    assert should_warn_about_delay(eta_seconds=200, baseline_seconds=300, threshold_seconds=600) is False

    # 4. Custom threshold
    assert should_warn_about_delay(eta_seconds=360, baseline_seconds=300, threshold_seconds=60) is True
    assert should_warn_about_delay(eta_seconds=359, baseline_seconds=300, threshold_seconds=60) is False


if __name__ == "__main__":
    print("Running Google Routes Service tests...")
    test_parse_google_duration()
    print("✅ test_parse_google_duration passed.")
    test_normalize_route_result()
    print("✅ test_normalize_route_result passed.")
    test_get_traffic_aware_route_success()
    print("✅ test_get_traffic_aware_route_success passed.")
    test_get_traffic_aware_route_consent_denied()
    print("✅ test_get_traffic_aware_route_consent_denied passed.")
    test_should_warn_about_delay()
    print("✅ test_should_warn_about_delay passed.")
    print("\n🏆 ALL GOOGLE ROUTES SERVICE TESTS PASSED 100%!")

