#!/usr/bin/env bash
# =============================================================================
#  test-stem-job.sh
#  NOIZYBEAST · End-to-End Queue Receipt Test
#  Run from Lucy's Blink Shell → dispatches a mock stem-separation job to
#  https://dispatch.noizyfish.com/job and verifies D1 receipt logging.
#
#  Usage:
#    chmod +x test-stem-job.sh
#    ./test-stem-job.sh [--env staging|prod] [--node m2ultra|michael] [--verbose]
#
#  Deps: curl, jq  (both ship with Blink/macOS; jq auto-installs via pkg if missing)
# =============================================================================

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
DISPATCHER_URL="https://dispatch.noizyfish.com/job"
RECEIPT_POLL_URL="https://dispatch.noizyfish.com/receipt"
TARGET_NODE="m2ultra"
ENV="prod"
VERBOSE=false
MAX_POLL=12          # × 5 s = 60 s timeout
POLL_INTERVAL=5

# ── Colour helpers ─────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()     { echo -e "${CYAN}[INFO]${RESET}  $*"; }
ok()      { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
err()     { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
verbose() { $VERBOSE && echo -e "${BOLD}[DBG]${RESET}   $*" || true; }

# ── Arg parsing ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)      ENV="$2";         shift 2 ;;
    --node)     TARGET_NODE="$2"; shift 2 ;;
    --verbose)  VERBOSE=true;     shift   ;;
    --url)      DISPATCHER_URL="$2"; RECEIPT_POLL_URL="${2/\/job/\/receipt}"; shift 2 ;;
    *)          err "Unknown flag: $1"; exit 1 ;;
  esac
done

[[ "$ENV" == "staging" ]] && DISPATCHER_URL="https://dispatch-staging.noizyfish.com/job"

# ── Auth token (pulled from env or interactive prompt) ────────────────────────
if [[ -z "${NOIZY_DISPATCH_TOKEN:-}" ]]; then
  echo -n "🔑 Paste your NOIZY_DISPATCH_TOKEN (or set env var): "
  read -rs NOIZY_DISPATCH_TOKEN
  echo
fi

# ── jq availability check ─────────────────────────────────────────────────────
if ! command -v jq &>/dev/null; then
  warn "jq not found — attempting install via pkg (Blink)"
  pkg install jq 2>/dev/null || { err "Install jq manually: pkg install jq"; exit 1; }
fi

# ── Build mock payload ────────────────────────────────────────────────────────
JOB_ID="TEST-$(date +%s)-$(openssl rand -hex 4 | tr '[:lower:]' '[:upper:]')"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

MOCK_FILE_CONTENT="mock-stem-payload-${JOB_ID}"
CONTENT_HASH="$(echo -n "${MOCK_FILE_CONTENT}" | openssl dgst -sha256 | awk '{print $2}')"
PERCEPTUAL_HASH="PHASH-$(openssl rand -hex 8 | tr '[:lower:]' '[:upper:]')"

PAYLOAD=$(jq -n \
  --arg job_id        "$JOB_ID" \
  --arg ts            "$TIMESTAMP" \
  --arg node          "$TARGET_NODE" \
  --arg env           "$ENV" \
  --arg content_hash  "$CONTENT_HASH" \
  --arg perc_hash     "$PERCEPTUAL_HASH" \
  '{
    job_id:        $job_id,
    job_type:      "stem_separation",
    created_at:    $ts,
    target_node:   $node,
    environment:   $env,
    priority:      "normal",

    stem_config: {
      source_format:  "wav",
      sample_rate:    48000,
      bit_depth:      32,
      stems:          ["vocals","drums","bass","other"],
      model:          "htdemucs_ft",
      output_format:  "flac"
    },

    tip_metadata: {
      tip_id:         "TIP-LUCY-TEST-001",
      content_hash:   $content_hash,
      perceptual_hash: $perc_hash,
      origin_code:    "OH",
      signing_algo:   "ML-DSA-65"
    },

    llt_config: {
      creator_split:       75,
      infrastructure_split: 25,
      currency:            "LLT",
      ledger:              "THE-GATHERING"
    },

    test_mode: true,
    source: "lucy-blink-shell"
  }'
)

# ── Print payload ──────────────────────────────────────────────────────────────
echo
echo -e "${BOLD}════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  NOIZYBEAST · Stem Job Dispatch Test${RESET}"
echo -e "${BOLD}════════════════════════════════════════════════${RESET}"
log "Job ID    : ${JOB_ID}"
log "Target    : ${TARGET_NODE} (${ENV})"
log "Dispatcher: ${DISPATCHER_URL}"
log "Timestamp : ${TIMESTAMP}"
verbose "Full payload:\n$(echo "$PAYLOAD" | jq .)"
echo

# ── Fire the job ───────────────────────────────────────────────────────────────
log "Sending payload to dispatcher..."

HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${DISPATCHER_URL}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NOIZY_DISPATCH_TOKEN}" \
  -H "X-NOIZY-Source: lucy-blink-shell" \
  -H "X-NOIZY-Job-ID: ${JOB_ID}" \
  --max-time 30 \
  -d "${PAYLOAD}")

HTTP_BODY=$(echo "$HTTP_RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -n 1)

verbose "HTTP ${HTTP_CODE}: ${HTTP_BODY}"

if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "202" ]]; then
  ok "Dispatcher accepted job (HTTP ${HTTP_CODE})"
  QUEUE_MSG_ID=$(echo "$HTTP_BODY" | jq -r '.queue_message_id // "N/A"')
  log "Queue message ID: ${QUEUE_MSG_ID}"
else
  err "Dispatcher rejected request (HTTP ${HTTP_CODE})"
  err "Response: ${HTTP_BODY}"
  exit 2
fi

# ── Poll D1 for receipt ────────────────────────────────────────────────────────
echo
log "Polling D1 'Gospel of Receipts' for job ${JOB_ID}..."

POLL_COUNT=0
RECEIPT_FOUND=false

while [[ $POLL_COUNT -lt $MAX_POLL ]]; do
  POLL_COUNT=$(( POLL_COUNT + 1 ))
  echo -n "  ⏳ Poll ${POLL_COUNT}/${MAX_POLL} ... "

  RECEIPT_RESP=$(curl -s -w "\n%{http_code}" \
    "${RECEIPT_POLL_URL}/${JOB_ID}" \
    -H "Authorization: Bearer ${NOIZY_DISPATCH_TOKEN}" \
    --max-time 10 2>/dev/null)

  RECEIPT_BODY=$(echo "$RECEIPT_RESP" | head -n -1)
  RECEIPT_CODE=$(echo "$RECEIPT_RESP" | tail -n 1)

  if [[ "$RECEIPT_CODE" == "200" ]]; then
    STATUS=$(echo "$RECEIPT_BODY" | jq -r '.status // "unknown"')
    echo -e "${GREEN}found${RESET} (status: ${STATUS})"
    RECEIPT_FOUND=true
    break
  elif [[ "$RECEIPT_CODE" == "404" ]]; then
    echo -e "pending"
    sleep $POLL_INTERVAL
  else
    echo -e "${YELLOW}unexpected HTTP ${RECEIPT_CODE}${RESET}"
    sleep $POLL_INTERVAL
  fi
done

# ── Results ────────────────────────────────────────────────────────────────────
echo
echo -e "${BOLD}════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  TEST RESULTS${RESET}"
echo -e "${BOLD}════════════════════════════════════════════════${RESET}"

if $RECEIPT_FOUND; then
  ok "✅ End-to-end PASS"
  echo
  echo "$RECEIPT_BODY" | jq '{
    job_id:      .job_id,
    status:      .status,
    node:        .hardware_tag,
    queued_at:   .queued_at,
    received_at: .received_at,
    tip_ctid:    .tip_ctid,
    llt_payout:  .llt_payout_triggered
  }'
else
  warn "⚠️  Receipt not found within $((MAX_POLL * POLL_INTERVAL))s"
  warn "The job may still be in-flight. Check D1 manually:"
  warn "  wrangler d1 execute noizy-d1-db --command \"SELECT * FROM receipts WHERE job_id='${JOB_ID}';\""
  exit 3
fi

echo
log "Done. Job ID for audit trail: ${JOB_ID}"
echo -e "${CYAN}→ Cross-reference in THE-GATHERING / D1 / Slack audit block.${RESET}"
