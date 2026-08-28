from __future__ import annotations

import re
from typing import Any


def parse_google_duration(value: Any) -> int:
    """Convert Google duration values such as '124s' or '124.5s' to seconds."""
    if isinstance(value, (int, float)):
        return round(float(value))

    if isinstance(value, str):
        match = re.fullmatch(r"\s*([0-9]+(?:\.[0-9]+)?)s\s*", value)
        if match:
            return round(float(match.group(1)))

    raise ValueError(f"Unsupported duration value: {value!r}")


def normalize_route_result(raw: dict[str, Any]) -> dict[str, Any]:
    route = raw.get("routes", [{}])[0]

    duration = route.get("duration", raw.get("duration"))
    static_duration = route.get(
        "staticDuration",
        raw.get("static_duration")
    )

    return {
        "provider": "google_routes",
        "eta_seconds": parse_google_duration(duration),
        "static_eta_seconds": (
            parse_google_duration(static_duration)
            if static_duration is not None
            else None
        ),
        "distance_meters": route.get(
            "distanceMeters",
            raw.get("distance_meters")
        ),
        "encoded_polyline": (
            route.get("polyline", {})
            .get("encodedPolyline")
        ),
        "fallback_used": bool(raw.get("fallbackInfo")),
    }


def get_traffic_aware_route(
    *,
    pickup_lat: float,
    pickup_lng: float,
    dropoff_lat: float,
    dropoff_lng: float,
    mcp_call,
    consent_check,
    ledger_write,
) -> dict[str, Any]:
    consent = consent_check(
        purpose="traffic_eta",
        data_categories=["pickup_location", "dropoff_location"],
        policy_code="NC-01"
    )

    if not consent.get("allowed"):
        raise PermissionError("Location consent was not granted")

    request = {
        "origin": {
            "latitude": pickup_lat,
            "longitude": pickup_lng,
        },
        "destination": {
            "latitude": dropoff_lat,
            "longitude": dropoff_lng,
        },
        "travel_mode": "DRIVE",
        "routing_preference": "TRAFFIC_AWARE",
        "departure_time": "now",
    }

    raw_result = mcp_call(
        server="google-routes",
        tool="routes_compute",
        arguments=request,
    )

    route = normalize_route_result(raw_result)

    ledger_receipt = ledger_write(
        operation="traffic_eta_lookup",
        provider="google_routes",
        policy_code="NC-01",
        allowed=True,
        input_fingerprint={
            "origin": [round(pickup_lat, 5), round(pickup_lng, 5)],
            "destination": [round(dropoff_lat, 5), round(dropoff_lng, 5)],
        },
        result_summary={
            "eta_seconds": route["eta_seconds"],
            "distance_meters": route["distance_meters"],
            "fallback_used": route["fallback_used"],
        },
    )

    route["ledger_receipt"] = ledger_receipt
    return route


def should_warn_about_delay(
    eta_seconds: int,
    baseline_seconds: int,
    threshold_seconds: int = 600,
) -> bool:
    return (eta_seconds - baseline_seconds) >= threshold_seconds

