# ZAPIER ↔ MC96ECO / NOIZY EMPIRE INTEGRATION GUIDE

**Author:** RSP_001 (rsp@noizy.ai)  
**Date:** 2026-04-13  
**Status:** ACTIVE — Webhook endpoints confirmed live on GOD (10.90.90.10)

---

## Architecture Overview

```
ZAPIER CLOUD ──(HTTPS)──▶ Cloudflare Tunnel ──▶ GOD :5678 (n8n) ──▶ NOIZY EMPIRE
                                              ──▶ GOD :7777 (DreamChamber)
                         
NOIZY EMPIRE ──(outbound webhooks)──▶ ZAPIER WEBHOOK ──▶ EXTERNAL SERVICES
```

---

## 🔴 LIVE n8n WEBHOOK ENDPOINTS

n8n is running at `http://localhost:5678` (GOD local) or via Cloudflare Tunnel.

| Workflow | Webhook Path | Method | Purpose |
|----------|-------------|--------|---------|
| NCP Consent Audit | `/webhook/ncp-consent-audit` | POST | Receive consent events |
| GitHub → Linear Sync | `/webhook/github-linear` | POST | GitHub PR events → Linear |

Test locally:
```bash
curl -X POST http://localhost:5678/webhook/ncp-consent-audit \
  -H "Content-Type: application/json" \
  -d '{"event":"consent.granted","artistId":"RSP_001","scope":"master_recording","timestamp":"2026-04-13T00:00:00Z"}'
```

---

## 🟡 ZAPIER ZAPS TO BUILD

### ZAP 1: New Linear Issue → n8n Health Alert
**Trigger:** Linear — New Issue Created (project: NOIZY)  
**Action:** Webhook POST → `http://GOD:5678/webhook/ncp-consent-audit`  
**Filter:** Only when priority = Urgent

### ZAP 2: GitHub PR Merged → Linear Done
**Trigger:** GitHub — Pull Request Merged (repo: RSPNOIZY/*)  
**Action:** Webhook POST → `http://GOD:5678/webhook/github-linear`  
**Payload:**
```json
{
  "action": "closed",
  "pull_request": {
    "merged": true,
    "title": "{{title}}",
    "body": "{{body}}",
    "number": "{{number}}"
  },
  "repository": {
    "full_name": "{{repo}}"
  }
}
```

### ZAP 3: Google Drive New File → MC96ECO Backup Trigger
**Trigger:** Google Drive — New File in Folder (NOIZYLAB_WORKSPACES)  
**Filter:** File name contains `.swift` or `.md`  
**Action:** Webhook POST → `http://GOD:5678/webhook/mc96-backup`  
**Payload:**
```json
{
  "source": "google_drive",
  "filename": "{{filename}}",
  "folder": "NOIZYLAB_WORKSPACES",
  "timestamp": "{{timestamp}}",
  "trigger": "new_file"
}
```

### ZAP 4: Email (rsp@noizy.ai) → DreamChamber Idea Capture
**Trigger:** Gmail — New Email matching "IDEA:"  
**Action:** Webhook POST → `http://GOD:7777/api/capture`  
**Payload:**
```json
{
  "type": "email_capture",
  "subject": "{{subject}}",
  "body": "{{body}}",
  "from": "{{from}}",
  "tags": ["idea", "email-capture"]
}
```

### ZAP 5: Airtable New Record → NCP Consent Workflow
**Trigger:** Airtable — New Record in "Artist Consents" table  
**Action:** Webhook POST → `http://GOD:5678/webhook/ncp-consent-audit`  
**Payload:**
```json
{
  "event": "consent.new_record",
  "artistId": "{{Artist ID}}",
  "scope": "{{Consent Scope}}",
  "effectiveDate": "{{Effective Date}}",
  "royaltyRate": 75,
  "source": "airtable"
}
```

---

## 🔐 AUTHENTICATION SETUP

### For Zapier → n8n:
1. Use **Webhook by Zapier** (no auth for now — n8n webhooks are public endpoints)
2. Add secret header in n8n webhook validation code:
   ```js
   // In n8n Code node — add to all webhook workflows
   const SECRET = "noizy-zapier-bridge-2026";
   const incomingSecret = $input.first().headers["x-zapier-secret"];
   if (incomingSecret !== SECRET) {
     throw new Error("Unauthorized webhook call");
   }
   ```
3. In Zapier, add custom header: `X-Zapier-Secret: noizy-zapier-bridge-2026`

### For n8n → Zapier (outbound):
1. Create Zapier Catch Hook: `https://hooks.zapier.com/hooks/catch/XXXXX/YYYYY/`
2. Store in n8n environment: `ZAPIER_HOOK_URL=https://hooks.zapier.com/hooks/catch/...`
3. Use n8n HTTP Request node to POST to Zapier when events occur

---

## 🌐 CLOUDFLARE TUNNEL EXPOSURE

To expose n8n webhooks to Zapier via Cloudflare:

```bash
# In cloudflare tunnel config (ops/cloudflare/cloudflared-config.template.yml)
ingress:
  - hostname: n8n.noizy.ai
    service: http://localhost:5678
  - hostname: dreamchamber.noizy.ai  
    service: http://localhost:7777
```

Then Zapier can POST to:
- `https://n8n.noizy.ai/webhook/ncp-consent-audit`
- `https://n8n.noizy.ai/webhook/github-linear`

---

## 📋 ZAPIER CREDENTIALS NEEDED

| Service | Type | Where to Get |
|---------|------|-------------|
| GitHub | OAuth2 | github.com/settings/tokens |
| Linear | API Key | linear.app/settings/api |
| Google Drive | OAuth2 | Via Zapier auth flow |
| Airtable | API Key | airtable.com/account |
| Gmail | OAuth2 | Via Zapier auth flow |

---

## ✅ SETUP CHECKLIST

- [ ] Create Zapier account / connect to rsp@noizy.ai
- [ ] Configure Cloudflare Tunnel for n8n.noizy.ai
- [ ] Build ZAP 2 (GitHub PR → Linear) — highest value, no external infra
- [ ] Build ZAP 1 (Linear Urgent → NOIZY alert)
- [ ] Add X-Zapier-Secret header validation to n8n workflows  
- [ ] Build ZAP 4 (Email IDEA: → DreamChamber)
- [ ] Store Zapier hook URLs in n8n environment variables

---

## 🧪 TEST COMMANDS

```bash
# Test NCP Consent webhook
curl -X POST http://localhost:5678/webhook-test/ncp-consent-audit \
  -H "Content-Type: application/json" \
  -H "X-Zapier-Secret: noizy-zapier-bridge-2026" \
  -d '{"event":"consent.test","artistId":"RSP_001","scope":"full_catalog"}'

# Test GitHub → Linear webhook
curl -X POST http://localhost:5678/webhook-test/github-linear \
  -H "Content-Type: application/json" \
  -d '{"action":"closed","pull_request":{"merged":true,"title":"fix: royalty calculation","number":42},"repository":{"full_name":"RSPNOIZY/CLAUDE-TODAY"}}'

# Verify DreamChamber capture endpoint
curl -X POST http://localhost:7777/api/capture \
  -H "Content-Type: application/json" \
  -d '{"type":"test","content":"Zapier integration test","tags":["test","zapier"]}'
```
