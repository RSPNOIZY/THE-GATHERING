#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# bootstrap-gcp.sh — One-time GCP project setup for NOIZY
#
# Idempotent. Safe to re-run. Creates:
#   - Required APIs enabled
#   - Service account: noizy-bridge-sa
#   - Secret Manager secrets (values set separately)
#   - IAM bindings
#
# Usage:
#   cd apps/voice-bridge-http
#   bash scripts/bootstrap-gcp.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-gen-lang-client-0531202734}"
REGION="us-central1"
SA_NAME="noizy-bridge-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NOIZY GCP Bootstrap"
echo "  Project: ${PROJECT_ID}"
echo "  Region:  ${REGION}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Enable APIs ───────────────────────────────────────────────
echo ""
echo "▶ Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  --project="${PROJECT_ID}"

# ── Service Account ───────────────────────────────────────────
echo ""
echo "▶ Creating service account: ${SA_NAME}..."
gcloud iam service-accounts create "${SA_NAME}" \
  --display-name="NOIZY Voice Bridge — Cloud Run SA" \
  --project="${PROJECT_ID}" \
  2>/dev/null || echo "  ↳ already exists, skipping"

# Allow Cloud Run to invoke the service (IAM invoker)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.invoker" \
  --condition=none \
  --quiet

# Allow SA to read secrets
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=none \
  --quiet

echo "  ✓ IAM bindings set"

# ── Secret Manager ────────────────────────────────────────────
echo ""
echo "▶ Creating Secret Manager secrets (empty — fill in separately)..."

create_secret() {
  local name="$1"
  gcloud secrets describe "${name}" --project="${PROJECT_ID}" &>/dev/null \
    && echo "  ↳ ${name} already exists, skipping" \
    || {
      gcloud secrets create "${name}" \
        --replication-policy="automatic" \
        --project="${PROJECT_ID}"
      echo "  ✓ Created: ${name}"
      echo "  ⚠  Add value: echo -n 'YOUR_SECRET' | gcloud secrets versions add ${name} --data-file=- --project=${PROJECT_ID}"
    }
}

create_secret "noizy-bridge-token"
create_secret "anthropic-api-key"

# ── Summary ───────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Bootstrap complete."
echo ""
echo "  NEXT STEPS:"
echo "  1. Set secret values:"
echo "     echo -n 'your-bridge-token' | gcloud secrets versions add noizy-bridge-token --data-file=- --project=${PROJECT_ID}"
echo "     echo -n 'your-anthropic-key' | gcloud secrets versions add anthropic-api-key --data-file=- --project=${PROJECT_ID}"
echo ""
echo "  2. First deploy:"
echo "     gcloud run deploy noizy-voice-bridge \\"
echo "       --source apps/voice-bridge-http \\"
echo "       --region ${REGION} \\"
echo "       --project ${PROJECT_ID} \\"
echo "       --no-allow-unauthenticated \\"
echo "       --service-account ${SA_EMAIL}"
echo ""
echo "  3. Enable in opencode.json when needed (one boolean flip)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
