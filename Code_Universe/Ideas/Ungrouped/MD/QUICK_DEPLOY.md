# HEAVEN Quick Deploy Guide

## Deploy in 30 seconds

```bash
cd /Users/m2ultra/NOIZYLAB
bash deploy.sh
```

## Test in 10 seconds

```bash
bash smoke_test.sh
```

## If it worked, you'll see:
```
✓ HEAVEN is deployed and operational
✓ Consent tokens can be created and revoked
✓ Kill switch immediately blocks synthesis
✓ Never Clauses are enforced
✓ All events are recorded in the ledger
```

## Manual quick test

```bash
# Health check
curl https://heaven.rsp-5f3.workers.dev/health | jq .

# Create actor
curl -X POST https://heaven.rsp-5f3.workers.dev/api/v1/actors \
  -H "Content-Type: application/json" \
  -d '{"actor_id":"RSP_001","display_name":"Rob","is_founding":true}' | jq .
```

## Next: Enable R2

1. Go to: https://dash.cloudflare.com
2. Storage → R2 → Activate
3. Create bucket: `noizy-voice-archive`

---

That's it. NOIZY.AI is live.