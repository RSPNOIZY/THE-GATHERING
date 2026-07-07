#!/usr/bin/env bash
set -euo pipefail

echo "📜 NOIZY Deployment Audit Export"
echo "================================="

OUTDIR="${1:-.}"

# Export deployments
echo "Fetching deployment history..."
npx wrangler deployments list --json > "${OUTDIR}/deployments.json" 2>/dev/null || {
  echo "⚠️ Could not fetch deployments"
  exit 1
}

# Format for audit
jq '[.[] | {
  id: .id,
  created: .created_on,
  author: .author_email,
  message: .annotations["workers/message"] // "no message",
  source: .source
}]' "${OUTDIR}/deployments.json" > "${OUTDIR}/audit-log.json"

COUNT=$(jq length "${OUTDIR}/audit-log.json")
echo "✅ Exported $COUNT deployments to ${OUTDIR}/audit-log.json"
