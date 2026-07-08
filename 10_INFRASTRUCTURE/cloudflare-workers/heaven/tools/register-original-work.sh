#!/usr/bin/env bash
# =====================================================================
# register-original-work.sh
# HEAVEN v0.5.0 — one-command registration of a composer's original file
# =====================================================================
#
# From Logic Pro export to the NOIZY ledger in a single command. No
# JSON wrangling, no copy-paste, no reason to not register.
#
# Usage:
#   HEAVEN_SHARED_SECRET=... ./register-original-work.sh <file> [options]
#
# Required:
#   --actor      Actor id (e.g. RSP_001)         [default: RSP_001]
#   --scope      Consent scope (e.g. studio)     [default: studio]
#   --action     Consent action                  [default: synth]
#
# Optional:
#   --host       HEAVEN host                     [default: https://noizy.ai]
#   --filename   R2 filename override            [default: basename of file]
#   --label      Human-readable label stored in metadata
#   --dry-run    Request + verify only — do NOT upload bytes
#
# Environment:
#   HEAVEN_SHARED_SECRET   (required) — the x-heaven-auth value
#
# Exit codes:
#   0  registered and verified in the catalogue
#   1  argument / config error
#   2  consent denied (covenant refused this registration)
#   3  upload failed
#   4  catalogue did not confirm
#
# This tool will NOT register anything that HEAVEN refuses. If consent
# is denied — for any reason, including Never-Clauses, expired records,
# or unknown actor — the script exits with code 2 and prints the
# Voice-of-Refusal reason. No silent failure, no workaround.
# =====================================================================

set -euo pipefail

# ---------- defaults ----------
ACTOR="RSP_001"
SCOPE="studio"
ACTION="synth"
HOST="https://noizy.ai"
FILENAME=""
LABEL=""
DRY_RUN=0
FILE=""

# ---------- argument parsing ----------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --actor)    ACTOR="$2";    shift 2 ;;
    --scope)    SCOPE="$2";    shift 2 ;;
    --action)   ACTION="$2";   shift 2 ;;
    --host)     HOST="$2";     shift 2 ;;
    --filename) FILENAME="$2"; shift 2 ;;
    --label)    LABEL="$2";    shift 2 ;;
    --dry-run)  DRY_RUN=1;     shift 1 ;;
    -h|--help)
      sed -n '2,30p' "$0"
      exit 0
      ;;
    -*)
      echo "unknown flag: $1" >&2
      exit 1
      ;;
    *)
      if [[ -z "$FILE" ]]; then FILE="$1"; shift 1
      else echo "unexpected positional arg: $1" >&2; exit 1
      fi
      ;;
  esac
done

# ---------- preflight ----------
if [[ -z "$FILE" ]];                    then echo "usage: $0 <file> [options]" >&2; exit 1; fi
if [[ ! -f "$FILE" ]];                  then echo "file not found: $FILE" >&2; exit 1; fi
if [[ -z "${HEAVEN_SHARED_SECRET:-}" ]]; then echo "HEAVEN_SHARED_SECRET env var required" >&2; exit 1; fi
for bin in curl jq file; do
  command -v "$bin" >/dev/null || { echo "missing dependency: $bin" >&2; exit 1; }
done

[[ -z "$FILENAME" ]] && FILENAME="$(basename "$FILE")"

# ---------- detect content type (best-effort) ----------
MIME="$(file --mime-type -b "$FILE" || echo 'application/octet-stream')"
case "$MIME" in
  audio/*|application/octet-stream) : ;;
  *) echo "refusing to register non-audio file: $MIME" >&2; exit 1 ;;
esac

SIZE=$(wc -c < "$FILE" | tr -d ' ')
CAP=$((50 * 1024 * 1024))
if (( SIZE > CAP )); then
  echo "file is $SIZE bytes; HEAVEN caps writes at $CAP bytes" >&2
  exit 1
fi

echo "════════════════════════════════════════════════════════════"
echo "  HEAVEN — register-original-work"
echo "  file:      $FILE"
echo "  size:      $SIZE bytes"
echo "  mime:      $MIME"
echo "  actor:     $ACTOR"
echo "  scope:     $SCOPE"
echo "  action:    $ACTION"
echo "  host:      $HOST"
echo "  filename:  $FILENAME"
[[ -n "$LABEL" ]] && echo "  label:     $LABEL"
[[ $DRY_RUN -eq 1 ]] && echo "  dry-run:   YES (no R2 write will occur)"
echo "════════════════════════════════════════════════════════════"

# ---------- step 1: consent + signed verdict + artifact slot ----------
echo "→ step 1/3: requesting consent verdict + signed token..."
RESP=$(curl -fsS -X POST "$HOST/api/synth/request" \
  -H "x-heaven-auth: $HEAVEN_SHARED_SECRET" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
        --arg a "$ACTOR" --arg ac "$ACTION" --arg s "$SCOPE" \
        --arg f "$FILENAME" --arg l "${LABEL:-register-original-work}" \
        '{actor_id:$a, action:$ac, scope:$s, requester_id:$l, filename:$f}')") \
  || { echo "HEAVEN did not respond on /api/synth/request" >&2; exit 3; }

ALLOWED=$(echo "$RESP" | jq -r '.verdict.allowed // false')
if [[ "$ALLOWED" != "true" ]]; then
  CLAUSE=$(echo "$RESP" | jq -r '.verdict.clause // "unknown"')
  REASON=$(echo "$RESP" | jq -r '.verdict.reason // "unknown"')
  echo "────────────────────────────────────────────────────────────"
  echo "  CONSENT DENIED — HEAVEN refused to register this file."
  echo "  clause: $CLAUSE"
  echo "  reason: $REASON"
  echo "────────────────────────────────────────────────────────────"
  echo "  This is the covenant working. Not a bug."
  echo "  If you believe this should be allowed, add a consent_record"
  echo "  to consent_db covering (actor=$ACTOR, action=$ACTION, scope=$SCOPE)."
  exit 2
fi

TOKEN=$(echo "$RESP"   | jq -r '.authorization.token')
KEY=$(echo "$RESP"     | jq -r '.artifact_slot.key')
VERDICT=$(echo "$RESP" | jq -r '.verdict.verdict_id')
KID=$(echo "$RESP"     | jq -r '.authorization.kid')
EXP=$(echo "$RESP"     | jq -r '.authorization.exp')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "HEAVEN allowed the verdict but did not issue a signed token." >&2
  echo "Likely VERDICT_KEYS not configured. Run: npm run keys:rotate" >&2
  exit 3
fi

echo "  verdict_id: $VERDICT"
echo "  key:        $KEY"
echo "  kid:        $KID"
echo "  token ttl:  $((EXP - $(date +%s)))s"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "→ dry-run: skipping step 2/3 (upload) and step 3/3 (verify)"
  echo "   If you had uploaded, the file would have landed at:"
  echo "   r2://voice-artifacts/$KEY"
  exit 0
fi

# ---------- step 2: stream the file to HEAVEN → R2 ----------
echo "→ step 2/3: uploading $SIZE bytes to R2 through HEAVEN..."
WRITE_RESP=$(curl -fsS -X PUT "$HOST/api/r2/write?key=$KEY" \
  -H "x-heaven-auth: $HEAVEN_SHARED_SECRET" \
  -H "x-heaven-verdict: $TOKEN" \
  -H "Content-Type: $MIME" \
  -H "Content-Length: $SIZE" \
  --data-binary "@$FILE") \
  || { echo "R2 write failed — HEAVEN returned non-2xx" >&2; exit 3; }

WRITE_OK=$(echo "$WRITE_RESP"     | jq -r '.ok // false')
WRITE_ETAG=$(echo "$WRITE_RESP"   | jq -r '.etag // "none"')
CAT_OK=$(echo "$WRITE_RESP"       | jq -r '.catalogue.inserted // false')

if [[ "$WRITE_OK" != "true" ]]; then
  REASON=$(echo "$WRITE_RESP" | jq -r '.reason // "unknown"')
  echo "  upload refused: $REASON" >&2
  echo "$WRITE_RESP" | jq '.' >&2
  exit 3
fi
echo "  etag:       $WRITE_ETAG"
echo "  catalogued: $CAT_OK"

# ---------- step 3: verify the catalogue row ----------
echo "→ step 3/3: verifying the catalogue row..."
MANIFEST=$(curl -fsS -G "$HOST/api/r2/manifest" \
  -H "x-heaven-auth: $HEAVEN_SHARED_SECRET" \
  --data-urlencode "actor_id=$ACTOR" \
  --data-urlencode "verdict_id=$VERDICT")

ROW=$(echo "$MANIFEST" | jq ".artifacts[] | select(.artifact_id == \"$KEY\")")
if [[ -z "$ROW" ]]; then
  echo "catalogue does NOT yet confirm this write." >&2
  echo "$MANIFEST" | jq '.' >&2
  exit 4
fi

echo "════════════════════════════════════════════════════════════"
echo "  REGISTERED"
echo "  This file is now an entry in the NOIZY ledger."
echo "  bucket:     voice-artifacts"
echo "  key:        $KEY"
echo "  verdict:    $VERDICT"
echo "  etag:       $WRITE_ETAG"
echo "  kid:        $KID"
echo "  catalogue:"
echo "$ROW" | jq '.'
echo "════════════════════════════════════════════════════════════"
