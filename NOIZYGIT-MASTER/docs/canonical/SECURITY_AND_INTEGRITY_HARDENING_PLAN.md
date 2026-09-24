# 🛡️ SOVEREIGN SECURITY & INTEGRITY HARDENING PLAN
## RSP Sovereign Empire · Fish Music Inc. · NOIZY Ecosystem
**Author:** Robert Stephen Plowman (`RSP_001`) · **Status:** CANONICAL MASTER DOCTRINE  
**HQ:** 771 Eastbourne Ave. Ottawa, ON. Canada K1K 0H8 (+1 613-324-3474)  
**Historical Entity:** Fish Music Inc. (Conceived 1996 · Reg 2003 · 26 Soho St. Toronto)  

---

## 🎯 Executive Summary & Mission
The **Noizy Sovereign Security & Integrity Hardening Plan** establishes uncompromised defensive perimeter and cryptographic integrity across all physical devices, cloud providers, domain registries, AI agents, and sovereign data vaults.

> *"GORUNFREE. DEFY THE DREED. BUILD THE NOIZYEMPIRE."*

---

## 📊 Domain & Infrastructure Risk Scorecard

| Surface | Initial Status | Target Status | Key Vulnerability / Action |
|:---|:---|:---|:---|
| **GitHub Monorepo & Orgs** | 🔴 CRITICAL | 🛡️ HARDENED | Enforce 2FA, GPG commit signing, Branch Protection, Secret Scanning |
| **Cloudflare DNS & Edge** | 🔴 CRITICAL | 🛡️ HARDENED | Cloudflare MFA, Fix NS for `noizykidz.com` & `noizylab.com`, Zero-Trust Access |
| **DMARC / DKIM / SPF (5 Domains)** | 🔴 CRITICAL | 🛡️ HARDENED | Fix 9 DMARC syntax/policy errors, align SPF records across all 5 sovereign brands |
| **Google Cloud & Workspace** | 🟡 HIGH | 🛡️ HARDENED | Purge 39 third-party apps down to ~10 vetted; review AI Ultra tier (~$1,872/yr) |
| **Apple Developer ID** | 🟡 HIGH | 🛡️ HARDENED | Complete identity & notarization certificates for macOS/iOS audio plugins |
| **Cloudflare HEAVEN Worker** | 🟡 HIGH | 🛡️ HARDENED | Static analysis, input sanitization, rate limiting, and mTLS verification |
| **Sovereign Secrets Vault** | 🟢 STRATEGIC | 🛡️ HARDENED | Proton Pass + Encrypted Local SQLite, Master Passphrase hardware key |
| **Network Infrastructure (GOD/GABRIEL)** | 🟢 STRATEGIC | 🛡️ HARDENED | Headscale DERP Region 996, Tailscale strict ACLs, n8n webhook auth |
| **Cloudflare D1 (447+ MemCells)** | 🟢 STRATEGIC | 🛡️ HARDENED | Automated daily cold snapshot to `/Volumes/12TB/D1_MEMCELLS_BACKUP/` |

---

## 🔴 Phase 1 — Critical (Target: Immediate / by April 7)

### 1.1 GitHub 2FA + SSH & GPG Keys
- [ ] Enforce Hardware Security Key (FIDO2 / WebAuthn) or Authenticator App for GitHub account.
- [ ] Generate modern Ed25519 SSH keys for M2 Ultra & MacBooks:
  ```bash
  ssh-keygen -t ed25519 -C "rspnoizy@gmail.com" -f ~/.ssh/id_ed25519_noizy
  ```
- [ ] Generate and configure GPG Key for verified commit signing:
  ```bash
  git config --global user.signingkey <GPG_KEY_ID>
  git config --global commit.gpgsign true
  ```

### 1.2 Cloudflare MFA & Account Lockdown
- [ ] Enable mandatory MFA (TOTP / YubiKey) on Cloudflare dashboard.
- [ ] Restrict API Tokens with granular scopes (DNS Edit only, D1 Worker Edit only).

### 1.3 Fix Domain Nameservers & Routing
- [ ] Correct authoritative nameservers for:
  - `noizykidz.com` ➔ Point to Cloudflare Assigned NS
  - `noizylab.com` / `noizylab.ca` ➔ Point to Cloudflare Assigned NS
- [ ] Verify DNSSEC is enabled for all sovereign domains:
  `NOIZYFISH.COM` · `NOIZYVOX.COM` · `NOIZYKIDS.COM` · `NOIZYLAB.CA` · `myFAMILY.ai` · `OXYGEN.io` · `AQ.IO` · `AQuarium.io` · `THE-GATHERING.io` · `THE-DREAMCHAMBER.io`

### 1.4 Resolve 9 DMARC Errors Across Domains
- [ ] Standardize canonical DMARC policy (`v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@noizyfish.com; fo=1;`):
  - `noizyfish.com`: `v=DMARC1; p=quarantine; rua=mailto:admin@noizyfish.com; pct=100; sp=quarantine`
  - `noizyvox.com`: `v=DMARC1; p=quarantine; rua=mailto:admin@noizyfish.com; pct=100`
  - `noizykids.com`: `v=DMARC1; p=quarantine; rua=mailto:admin@noizyfish.com; pct=100`
  - `noizylab.ca`: `v=DMARC1; p=quarantine; rua=mailto:admin@noizyfish.com; pct=100`
  - `myfamily.ai`: `v=DMARC1; p=quarantine; rua=mailto:admin@noizyfish.com; pct=100`

---

## 🟡 Phase 2 — High Priority (Target: by April 20)

### 2.1 Google Workspace Third-Party App Purge
- [ ] Audit all 39 third-party OAuth connected apps.
- [ ] Revoke access for inactive, deprecated, or high-risk integrations.
- [ ] Maintain only essential verified integrations (~10 vetted connectors).

### 2.2 Google AI Ultra Subscription Cost Optimization
- [ ] Evaluate utilization of Gemini Advanced / AI Ultra vs. local LM Studio (35 GGUF/MLX models running on M2 Ultra with 192GB Unified Memory).
- [ ] Realize ~$1,872/year in cash savings by leaning into Sovereign Local Compute.

### 2.3 Apple Developer Verification
- [ ] Complete Apple Developer Program enrollment for code-signing AU/VST3 plugins, Desktop Commander companion, and NOIZYVOX standalone apps.

### 2.4 GitHub Secret Scanning & Branch Protection
- [ ] Enable automated Secret Scanning & Push Protection across all 7 repositories.
- [ ] Set `main` / `master` branch protection: require pull request review and status checks before merge.

### 2.5 HEAVEN Cloudflare Worker Security Review
- [ ] Perform static vulnerability scanning on `heaven-worker.js`.
- [ ] Implement strict Bearer Token auth on `/v1/ideate`, `/v1/ingest`, and `/v1/voice-protect`.

---

## 🟢 Phase 3 — Strategic & Ongoing Operations

### 3.1 Sovereign Secrets Vault (Proton Pass / Bitwarden)
- [ ] Store all API keys, corporate banking data, Mastercards, and root tokens in Proton Pass Vault.
- [ ] Keep encrypted offline mirror on local storage at `packages/noizyvault-security/proton_pass_vault_manifest.json`.

### 3.2 Network Lockdown (GOD, GABRIEL, n8n, AQUARIUM)
- [ ] Enforce Tailscale / Headscale Mesh (`100.96.0.0/16`) for all backend node communication.
- [ ] Restrict n8n webhooks to authenticated requests with HMAC signature verification.
- [ ] Encrypt AQUARIUM streaming channels with TLS 1.3 & DTLS-SRTP.

### 3.3 Cloudflare D1 Database Backup (447+ MemCells)
- [ ] Run daily automated dump of Cloudflare D1 tables into local SQLite backups:
  ```bash
  npx wrangler d1 export noizy-memcells --output=/Volumes/12TB/D1_MEMCELLS_BACKUP/memcells_$(date +%Y%m%d).sql
  ```

---

## 🚀 Execution & Verification Tooling
The automated hardening auditor is located at [`packages/noizyvault-security/security_hardening_audit.py`](file:///Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/packages/noizyvault-security/security_hardening_audit.py).
Run with:
```bash
python3 /Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/packages/noizyvault-security/security_hardening_audit.py
```
