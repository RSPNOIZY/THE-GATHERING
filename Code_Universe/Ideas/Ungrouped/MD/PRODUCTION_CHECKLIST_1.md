# NOIZY EMPIRE — Production Checklist

**Target Date:** April 17, 2026
**Status:** IN PROGRESS

---

## 1. Domain & DNS

### Registrar Transfer (GoDaddy → Cloudflare)

- [ ] **CF login changed** to rsplowman@icloud.com
- [ ] **CF 2FA enabled** (Authenticator app)
- [ ] noizy.ai EPP code obtained
- [ ] noizyfish.com EPP code obtained
- [ ] fishmusicinc.com EPP code obtained
- [ ] noizyfish.ca status confirmed (alive/expired)
- [ ] noizy.ai transfer initiated at Cloudflare
- [ ] noizyfish.com transfer initiated
- [ ] fishmusicinc.com transfer initiated
- [ ] noizyfish.ca transfer initiated (if alive)
- [ ] GoDaddy transfer approval emails approved
- [ ] All transfers completed in CF Dashboard

### DNS Records

- [ ] noizy.ai NS on Cloudflare
- [ ] noizyfish.com NS on Cloudflare
- [ ] fishmusicinc.com NS on Cloudflare
- [ ] noizyfish.ca NS on Cloudflare (if alive)
- [ ] DMARC on noizy.ai
- [ ] DMARC on noizyfish.com
- [ ] DMARC on fishmusicinc.com
- [ ] DMARC on noizyfish.ca
- [ ] SPF on all domains
- [ ] DKIM on noizy.ai (Google Workspace)

---

## 2. Email

### Cloudflare Email Routing

- [ ] rsp@noizyfish.com → rsplowman@icloud.com
- [ ] rsp@fishmusicinc.com → rsplowman@icloud.com
- [ ] rsp@noizyfish.ca → rsplowman@icloud.com
- [ ] Catch-all on noizyfish.com
- [ ] Catch-all on fishmusicinc.com
- [ ] Catch-all on noizyfish.ca

### Google Workspace (noizy.ai)

- [ ] Google Workspace Business Starter purchased
- [ ] noizy.ai domain verified in Google Admin
- [ ] rsp@noizy.ai mailbox active
- [ ] Google MX records on noizy.ai (aspmx.l.google.com + alternates)
- [ ] DKIM generated and added to Cloudflare DNS
- [ ] SPF includes \_spf.google.com
- [ ] Gmail send/receive tested

### Email Verification Tests

- [ ] Send to rsp@noizy.ai → arrives in Google Workspace inbox
- [ ] Send to rsp@noizyfish.com → arrives in rsplowman@icloud.com
- [ ] Send to rsp@fishmusicinc.com → arrives in rsplowman@icloud.com
- [ ] Send to random@noizyfish.com (catch-all) → arrives
- [ ] Reply FROM rsp@noizy.ai works
- [ ] DMARC check passes (use mail-tester.com)

---

## 3. Cloudflare Infrastructure

### Workers

- [ ] Heaven deployed at heaven.rsp-5f3.workers.dev
- [ ] Heaven /health returns {"success": true}
- [ ] noizy-landing deployed
- [ ] noizy.ai custom domain route active
- [ ] noizy.ai returns HTTP 200 (landing page)

### D1 Databases

- [ ] gabriel_db accessible (a31d68e2-f2d4-4203-a803-8039fdff31cb)
- [ ] 19+ tables present
- [ ] RSP_001 actor seeded
- [ ] 9 Never Clauses seeded

### KV Namespaces

- [ ] GABRIEL_KV bound (f205b56a9914413da0ec454a9dc4c2bd)
- [ ] GABRIEL_VOICE bound (16532a32b2e8455486cc966403f3442e)

### Security

- [ ] NOIZY_API_KEY set as secret (`npx wrangler secret put NOIZY_API_KEY`)
- [ ] All protected routes require X-NOIZY-Key header
- [ ] Rate limiting active (60 req/min/IP)
- [ ] No .env files in git

---

## 4. Google Cloud

### Project

- [ ] GCP project created (noizy-empire-01)
- [ ] Billing account linked
- [ ] Cloud AI Companion API enabled
- [ ] Workspace APIs enabled (Admin, Gmail, Drive, Calendar, Docs, Sheets)

### IAM

- [ ] Owner role on project
- [ ] Service account for CI/CD (if needed)

---

## 5. Local Infrastructure (GOD.local)

### Services

- [ ] GABRIEL daemon running on port 9777
- [ ] DreamChamber on port 7777
- [ ] n8n on port 5678
- [ ] Voice pipeline functional

### Docker Admin Toolkit

- [ ] docker-compose.admin.yml builds successfully
- [ ] Admin container has wrangler, gcloud, terraform, dig, whois
- [ ] n8n container starts and is accessible
- [ ] Newman can run Postman collections

### Terraform

- [ ] `terraform init` succeeds
- [ ] `terraform plan` shows expected resources
- [ ] noizy.tfvars created (not committed)

---

## 6. Smoke Tests

- [ ] `bash smoke_test.sh` — 22/22 passing
- [ ] Heaven health check passes
- [ ] Landing page loads
- [ ] Email routing verified
- [ ] DNS resolves correctly for all domains
- [ ] DMARC/SPF/DKIM validation passes

---

## 7. GoDaddy Closeout

- [ ] All domain transfers complete
- [ ] M365/email hosting cancelled
- [ ] Auto-renew disabled on all products
- [ ] Privacy protection cancelled
- [ ] Invoices downloaded
- [ ] Account closed
- [ ] **TOTAL FREEDOM**

---

## 8. Code & Git

- [ ] All changes committed
- [ ] infra/ directory organized (runbook, terraform, docker)
- [ ] ops/ scripts ready (execute, dns, deploy)
- [ ] No secrets in git history
- [ ] .gitignore covers tfstate, .env, tfvars

---

## Sign-Off

| Role              | Name                             | Date | Signature |
| ----------------- | -------------------------------- | ---- | --------- |
| Founding Actor    | Robert Stephen Plowman (RSP_001) |      |           |
| Lead Orchestrator | GABRIEL                          |      |           |

---

_"Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic."_
