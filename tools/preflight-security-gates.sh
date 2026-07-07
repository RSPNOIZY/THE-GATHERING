#!/usr/bin/env bash
set -euo pipefail

echo "NOIZY SECURITY GATE: static posture checks"

# Consent-gateway should reference authorization checks (minimum signal)
if ! grep -R "authorization" -n cloudflare/workers/consent-gateway/src/index.ts >/dev/null 2>&1; then
  echo "BLOCKED: consent-gateway appears to lack auth header handling"
  exit 1
fi

# Router should not strip the first segment blindly (known bug area)
if grep -R "slice(1)" -n cloudflare/workers/cb01-router/src/index.ts >/dev/null 2>&1; then
  echo "BLOCKED: router may still be stripping first segment (known correctness bug)"
  exit 1
fi

echo "PASS: security posture gates satisfied (static)"
