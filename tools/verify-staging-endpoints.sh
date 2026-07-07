#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${STAGING_CONSENT_BASE_URL:-}" ]]; then
  echo "BLOCKED: STAGING_CONSENT_BASE_URL missing (set as secret)"
  exit 1
fi

if [[ -z "${STAGING_ROUTER_BASE_URL:-}" ]]; then
  echo "BLOCKED: STAGING_ROUTER_BASE_URL missing (set as secret)"
  exit 1
fi

echo "Verifying staging /health endpoints..."
curl -fsS "${STAGING_CONSENT_BASE_URL}/health" >/dev/null
curl -fsS "${STAGING_ROUTER_BASE_URL}/health" >/dev/null
echo "PASS: staging health endpoints reachable"
