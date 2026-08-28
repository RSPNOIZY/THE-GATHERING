# HEAVEN — "Make NOIZY.AI Real Today" Runbook

Production URL: `https://heaven.rsp-5f3.workers.dev`

## 0) Pre-flight checks

### Verify Ollama is running
```bash
ollama serve
```

### Verify wrangler is installed
```bash
which wrangler || echo "Install: npm install -g wrangler"
```

## 1) Deploy HEAVEN Worker

### Deploy command
```bash
cd /Users/m2ultra/NOIZYLAB
bash deploy.sh
```

### If deploy fails, debug with:
```bash
(bash deploy.sh 2>&1) | fix
```

## 2) Verify deployment — Health check

```bash
curl -sS https://heaven.rsp-5f3.workers.dev/health | jq .
```

Expected response:
```json
{
  "status": "LIVE",
  "version": "...",
  "environment": "...",
  "database": "gabriel_db",
  "actors": 0,
  "ledger_events": 0,
  "timestamp": "2026-03-21 17:07:00",
  "mission": "Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic."
}
```

## 3) Create founding actor RSP_001

```bash
curl -X POST https://heaven.rsp-5f3.workers.dev/api/v1/actors \
  -H "Content-Type: application/json" \
  -d '{
    "actor_id": "RSP_001",
    "display_name": "Robert Stephen Plowman",
    "legal_name": "Robert Stephen Plowman",
    "email": "rob@noizy.ai",
    "country": "CA",
    "is_founding": true,
    "union_member": false
  }' | jq .
```

## 4) Verify actor exists

```bash
curl -sS https://heaven.rsp-5f3.workers.dev/api/v1/actors/RSP_001 | jq .
```

## 5) Create consent token

```bash
curl -X POST https://heaven.rsp-5f3.workers.dev/api/v1/consent-tokens \
  -H "Content-Type: application/json" \
  -d '{
    "actor_id": "RSP_001",
    "use_categories": ["educational", "commercial", "creative"],
    "territories": ["GLOBAL"],
    "languages": ["en"],
    "expires_at": "2026-12-31T23:59:59Z"
  }' | jq . | tee consent_token.json
```

Save the `token_id` from response:
```bash
TOKEN_ID=$(cat consent_token.json | jq -r .consent_token.token_id)
echo "TOKEN_ID: $TOKEN_ID"
```

## 6) Test synth request (should pass)

```bash
curl -X POST https://heaven.rsp-5f3.workers.dev/api/v1/synth-requests \
  -H "Content-Type: application/json" \
  -d "{
    \"actor_id\": \"RSP_001\",
    \"descendant_id\": \"test_descendant_001\",
    \"consent_token_id\": \"$TOKEN_ID\",
    \"use_category\": \"educational\",
    \"script_hash\": \"test_hash_001\"
  }" | jq .
```

Expected: `"status": "approved"`

## 7) Test kill switch (revoke consent)

```bash
curl -X POST "https://heaven.rsp-5f3.workers.dev/api/v1/consent-tokens/$TOKEN_ID/revoke" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Testing kill switch functionality"
  }' | jq .
```

Expected response:
```json
{
  "status": "revoked",
  "message": "Your voice is at rest. No new synthesis is possible. All existing licenses are flagged for review.",
  "token_id": "...",
  "revoked_at": "..."
}
```

## 8) Verify kill switch worked (synth should fail)

```bash
curl -X POST https://heaven.rsp-5f3.workers.dev/api/v1/synth-requests \
  -H "Content-Type: application/json" \
  -d "{
    \"actor_id\": \"RSP_001\",
    \"descendant_id\": \"test_descendant_001\",
    \"consent_token_id\": \"$TOKEN_ID\",
    \"use_category\": \"educational\",
    \"script_hash\": \"test_hash_002\"
  }" | jq .
```

Expected: `403 Forbidden` with error message about no valid consent token

## 9) Test Never Clause enforcement

Create new token first:
```bash
curl -X POST https://heaven.rsp-5f3.workers.dev/api/v1/consent-tokens \
  -H "Content-Type: application/json" \
  -d '{
    "actor_id": "RSP_001",
    "use_categories": ["general"],
    "territories": ["GLOBAL"]
  }' | jq . | tee consent_token2.json

TOKEN_ID2=$(cat consent_token2.json | jq -r .consent_token.token_id)
```

Try political content (should be blocked):
```bash
curl -X POST https://heaven.rsp-5f3.workers.dev/api/v1/synth-requests \
  -H "Content-Type: application/json" \
  -d "{
    \"actor_id\": \"RSP_001\",
    \"descendant_id\": \"test_descendant_001\",
    \"consent_token_id\": \"$TOKEN_ID2\",
    \"use_category\": \"political propaganda\",
    \"script_hash\": \"test_hash_003\"
  }" | jq .
```

Expected: `403 Forbidden` with Never Clause block message

## 10) Check ledger (audit trail)

```bash
curl -sS "https://heaven.rsp-5f3.workers.dev/api/v1/ledger?actor_id=RSP_001&limit=10" | jq .
```

Should show all events:
- actor.created
- consent.issued
- synth.approved
- kill_switch.activated
- synth.blocked
- never_clause.blocked

## 11) Voice DNA (after recording)

When you have Voice DNA ready:
```bash
curl -X POST https://heaven.rsp-5f3.workers.dev/api/v1/actors/RSP_001/voice-dna \
  -H "Content-Type: application/json" \
  -d '{
    "dna_id": "RSP_001_DNA_001",
    "recording_hash": "sha256_of_your_recording",
    "duration_seconds": 180,
    "sample_rate": 48000,
    "metadata": {
      "recording_date": "2026-03-21",
      "environment": "Logic Pro X",
      "microphone": "SM7B"
    }
  }' | jq .
```

## Troubleshooting

### Database not found
```bash
wrangler d1 list
wrangler d1 execute gabriel_db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### Worker not deploying
```bash
wrangler whoami
wrangler deploy --compatibility-date 2024-03-21
```

### KV namespaces missing
```bash
wrangler kv:namespace list
```

---

## Quick smoke test (all in one)

Save as `smoke_test.sh` and run:
```bash
bash /Users/m2ultra/NOIZYLAB/smoke_test.sh
```