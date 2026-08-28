# NOIZY.AI — FULL THIRD-PARTY COMPLIANCE AUDIT

**Prepared for:** Robert Stephen Plowman (RSP_001)
**Date:** 2026-04-13
**Auditor:** Claude Opus via Cowork — autonomous compliance scan
**Scope:** All third-party services, software licenses, npm dependencies, privacy law adherence, data handling, and infrastructure compliance

---

## EXECUTIVE SUMMARY

This audit examined every third-party dependency, service, license, and data flow in the NOIZY.AI infrastructure. The system spans Cloudflare Workers/D1/KV/Pages/R2, a Next.js landing page, 19 Ollama models, 11 Docker containers, 11 MCP servers, Universal Audio hardware/software, and the GitHub repository.

**Overall Risk Rating: MEDIUM-HIGH** — No critical secrets exposed, but significant privacy law gaps exist in HEAVEN's data handling, one production-prohibited model is present, and several Docker images carry restrictive licenses.

### Findings at a Glance

| Severity | Count | Summary |
|----------|-------|---------|
| CRITICAL | 2 | HEAVEN stores PII without PIPEDA/GDPR-compliant consent or deletion mechanisms; codestral model is non-production licensed |
| HIGH | 5 | No privacy policy, no data deletion endpoint, no LICENSE file, Next.js CVEs, CASL consent gap |
| MEDIUM | 6 | Docker license restrictions, npm devDep vulnerabilities, D1 jurisdiction not set, no DPO designated, no data retention policy, ledger append-only conflicts with erasure rights |
| LOW | 3 | Grafana AGPL disclosure, Open WebUI branding rules, Docker memory underallocated |

---

## SECTION 1: SECRETS & CREDENTIAL SCAN

### 1.1 Git History Scan
**Status: CLEAN**

Scanned the NOIZY.AI branch of RSPNOIZY/CLAUDE-TODAY for hardcoded secrets, API keys, tokens, and credentials. No secrets found in tracked files.

### 1.2 Environment Files
**Status: CLEAN**

- `landing/.env.local` — contains only `NEXT_PUBLIC_HEAVEN_URL=https://heaven.rsp-5f3.workers.dev` (public, not secret)
- No `.env` files with API keys, database credentials, or tokens committed to source

### 1.3 Wrangler Configuration
**Status: CLEAN**

- `heaven/wrangler.toml` — contains `account_id = "5f36aa9795348ea681d0b21910dfc82a"` (Cloudflare account ID, not a secret — it's an identifier, not an authentication credential)
- D1 database IDs and KV namespace IDs are present — these are identifiers, not access tokens
- No API tokens or secret keys in configuration files

### 1.4 MCP Server Configs
**Status: CLEAN**

- `claude_desktop_config.json` — contains `CLOUDFLARE_ACCOUNT_ID` (identifier, not secret)
- `mcp-config-godlocal.json` — contains only URLs, ports, and environment identifiers
- No API keys or authentication tokens in any MCP config

---

## SECTION 2: NPM DEPENDENCY AUDIT

### 2.1 Landing Page (Next.js 14)

**Production Dependencies — License Scan: ALL CLEAR**
All production dependencies use MIT or Apache-2.0 licenses. No copyleft, no restrictive terms.

**Vulnerability Scan:**

| Package | Severity | CVE | Impact |
|---------|----------|-----|--------|
| Next.js 14.x | HIGH | Multiple (5 CVEs) | Server-side request forgery, cache poisoning, path traversal |

**Remediation:** Upgrade to Next.js 15+ or 16. The landing page is a static export, which mitigates server-side vulnerabilities, but the dependency tree still carries the CVE flags and will fail enterprise security scans.

### 2.2 HEAVEN Worker (Hono + Cloudflare)

**Production Dependencies — License Scan: ALL CLEAR**
Hono and all runtime dependencies are MIT-licensed.

**Vulnerability Scan (devDependencies only):**

| Package | Severity | Issue |
|---------|----------|-------|
| devalue (via miniflare) | MODERATE | Prototype pollution |
| esbuild | MODERATE | Server-side request forgery |
| undici | MODERATE | Multiple fetch-related issues |

**Impact:** These are build-time/test-time only. They do not ship to production. Risk is limited to developer machines during `npm run dev` or `npm test`. Still should be updated periodically.

---

## SECTION 3: SOFTWARE LICENSE COMPLIANCE

### 3.1 Repository License
**Status: MISSING — HIGH RISK**

No `LICENSE` file exists at the repository root. Without an explicit license:
- The code is legally "all rights reserved" by default
- No one (including collaborators) has explicit permission to use, modify, or distribute
- This creates legal ambiguity if NOIZY.AI onboards contributors or partners

**Remediation:** Add a LICENSE file. Recommended: a custom proprietary license that reflects the NOIZY.AI values (consent-native, artist-first), or a standard license (BSL 1.1, AGPL, or proprietary) depending on commercial strategy.

### 3.2 Ollama Models (19 models on GOD.local)

| Model | License | Production Use | Risk |
|-------|---------|---------------|------|
| gemma3:latest | Gemma Terms of Use | ✅ Allowed | LOW — Google's terms permit commercial use |
| llama3.2, llama3.3 | Llama 3 Community License | ✅ Allowed (<700M MAU) | LOW — Meta allows commercial use under threshold |
| qwen2.5-coder | Apache 2.0 | ✅ Allowed | NONE |
| deepseek-r1 | MIT | ✅ Allowed | NONE |
| phi4 | MIT | ✅ Allowed | NONE |
| mistral | Apache 2.0 | ✅ Allowed | NONE |
| **codestral** | **Mistral Non-Production License** | **❌ PROHIBITED** | **CRITICAL** |
| nomic-embed-text | Apache 2.0 | ✅ Allowed | NONE |
| noizy-*, gordon-* (fine-tunes) | Inherits base model license | ✅ If base is gemma3 | LOW — verify base |

**CRITICAL FINDING:** `codestral` uses the Mistral Non-Production License (MNPL). This license explicitly prohibits:
- Any production use
- Any commercial deployment
- Use in any revenue-generating application

If codestral is used in any NOIZY.AI pipeline that touches production voice synthesis, consent checking, or any commercial workflow, this is a license violation.

**Remediation:** Either remove codestral from the Ollama installation, or ensure it is strictly isolated to personal experimentation only. Document this restriction. Consider replacing with `qwen2.5-coder` (Apache 2.0) for coding tasks.

### 3.3 Docker Images (11 containers on GOD.local)

| Image | License | Production Risk |
|-------|---------|----------------|
| **n8n** | Sustainable Use License | **HIGH** — Cannot offer as a commercial service to third parties. Internal use is fine. If NOIZY.AI workflows are customer-facing, this is a violation. |
| **SurrealDB** | BSL 1.1 | **MEDIUM** — Cannot offer as a competing database service. Using it as a backend datastore for NOIZY.AI is permitted. |
| **Grafana** | AGPL-3.0 | **MEDIUM** — If Grafana dashboards are exposed to users (even internal), source code of modifications must be disclosed. If running stock Grafana internally only, risk is low. |
| **Open WebUI** | MIT + Branding Restrictions | **LOW** — Must comply with branding guidelines (cannot claim the UI is your own creation without attribution). |
| Ollama | MIT | NONE |
| Qdrant | Apache 2.0 | NONE |
| Redis | BSD-3-Clause | NONE |
| Nginx | BSD-2-Clause | NONE |
| PostgreSQL | PostgreSQL License (permissive) | NONE |

**Remediation for n8n:** If NOIZY.AI uses n8n as part of a service offered to artists/licensees, review the Sustainable Use License terms carefully. Internal automation (your own workflows) is fine. Offering n8n-powered automation as a feature to paying customers may require an n8n Enterprise license.

### 3.4 Universal Audio / Apollo Software
**Status: REQUIRES VERIFICATION**

UA Connect 1.9.2 is installed and running. Universal Audio's software license is a standard end-user license for registered hardware owners. As long as:
- The Apollo hardware is registered to Robert Stephen Plowman
- UA plugins are properly licensed (not cracked/pirated)
- The software is used on the machine the hardware is connected to

...the licensing is compliant. This is a hardware-bound license model. No additional action needed unless the Apollo is shared across multiple studios or operators.

---

## SECTION 4: PRIVACY LAW COMPLIANCE

This is the most significant area of risk. HEAVEN processes personal information (email addresses, names) through its signup endpoint and stores it across two Cloudflare services.

### 4.1 PII Data Map — Where Personal Data Lives

| Data Element | Storage Location | Retention | Deletion Mechanism |
|-------------|-----------------|-----------|-------------------|
| Email address | KV_GABRIEL (`signup:{id}`) | **Indefinite** (no TTL set) | **NONE** |
| Name | KV_GABRIEL (`signup:{id}`) | **Indefinite** | **NONE** |
| Email address | noizy_ledger in D1 (payload_json) | **Permanent** (append-only by design) | **NONE — by constitutional design** |
| Name | noizy_ledger in D1 (payload_json) | **Permanent** | **NONE** |
| Preference/role | KV_GABRIEL + D1 ledger | **Indefinite/Permanent** | **NONE** |
| Source (landing_page) | KV_GABRIEL + D1 ledger | **Indefinite/Permanent** | **NONE** |
| Actor display_name | D1 HVS (hvs_actors) | Permanent | None exposed |
| Actor country | D1 HVS (hvs_actors) | Permanent | None exposed |

### 4.2 PIPEDA Compliance (Canada — Primary Jurisdiction)

PIPEDA's 10 Fair Information Principles apply because NOIZY.AI is a Canadian commercial enterprise collecting personal information.

| Principle | Status | Gap |
|-----------|--------|-----|
| **1. Accountability** | ⚠️ PARTIAL | No designated privacy officer. No documented privacy management program. |
| **2. Identifying Purposes** | ❌ FAIL | Signup form collects email and name but does NOT state why. No purpose statement at point of collection. |
| **3. Consent** | ❌ FAIL | No consent checkbox. No privacy policy link. No explanation of what the data will be used for. Collecting email without meaningful consent violates PIPEDA. |
| **4. Limiting Collection** | ✅ PASS | Only email, name, and role preference are collected. This is reasonable for a waitlist. |
| **5. Limiting Use, Disclosure, Retention** | ❌ FAIL | No retention policy. No data minimization timeline. KV entries persist indefinitely. Ledger entries are permanent by design. |
| **6. Accuracy** | ⚠️ PARTIAL | No mechanism for users to update their information. |
| **7. Safeguards** | ✅ PASS | Data is stored on Cloudflare's infrastructure with encryption at rest and in transit. Cloudflare maintains SOC 2, ISO 27001. |
| **8. Openness** | ❌ FAIL | No privacy policy published. No transparency about data practices. |
| **9. Individual Access** | ❌ FAIL | No endpoint for users to request their data. No process documented. |
| **10. Challenging Compliance** | ❌ FAIL | No complaint mechanism. No privacy contact. |

**PIPEDA Verdict: NON-COMPLIANT** — 6 of 10 principles fail or partially fail.

### 4.3 CASL Compliance (Canada's Anti-Spam Legislation)

CASL applies the moment NOIZY.AI sends any commercial electronic message (email) to signup addresses.

| Requirement | Status | Gap |
|-------------|--------|-----|
| Express consent before sending | ❌ FAIL | Signup form has no consent checkbox for receiving emails |
| Identify sender | N/A | No emails sent yet |
| Unsubscribe mechanism | N/A | No emails sent yet |
| Record of consent | ❌ FAIL | No consent timestamp or mechanism stored |

**CASL Verdict:** Currently safe because no emails have been sent. The moment NOIZY.AI sends a single marketing email to these signups without adding CASL-compliant express consent, fines can reach **$10M per violation** for organizations.

**Remediation:** Before any email is sent, the signup form MUST include:
1. A checkbox: "I consent to receive emails from NOIZY.AI about [specific purpose]"
2. A link to the privacy policy
3. The consent timestamp must be stored alongside the signup record

### 4.4 GDPR Compliance (EU — If Serving EU Users)

If any EU resident signs up via the landing page, GDPR applies regardless of where NOIZY.AI is based.

| Right | Status | Gap |
|-------|--------|-----|
| **Right to be informed** (Art. 13) | ❌ FAIL | No privacy notice at point of collection |
| **Right of access** (Art. 15) | ❌ FAIL | No `/v1/data-request` endpoint. No process. |
| **Right to rectification** (Art. 16) | ❌ FAIL | No update mechanism |
| **Right to erasure** (Art. 17) | ❌ FAIL | No deletion endpoint. **Constitutional conflict:** The noizy_ledger is append-only by design. Email addresses logged there cannot be erased without violating the ledger's integrity constraint. |
| **Right to restrict processing** (Art. 18) | ❌ FAIL | No mechanism |
| **Right to data portability** (Art. 20) | ❌ FAIL | No export endpoint |
| **Right to object** (Art. 21) | ❌ FAIL | No opt-out mechanism |
| **Lawful basis** | ❌ FAIL | No legal basis established. Likely basis would be "consent" (Art. 6(1)(a)) but no consent is obtained. |

**GDPR Verdict: NON-COMPLIANT** — All data subject rights are unimplemented.

**The Ledger Paradox:** HEAVEN's append-only ledger (Constraint #5) stores email addresses in `payload_json` for signup events. This creates a direct conflict with GDPR Art. 17 (right to erasure) and PIPEDA Principle 5 (limiting retention). The ledger is constitutionally immutable — a core design principle — but privacy law says personal data must be deletable on request.

**Resolution Options:**
1. **Pseudonymize at write time:** Hash the email before writing to the ledger. Store the mapping in KV_GABRIEL only (which CAN be deleted). The ledger entry becomes `"email": "sha256:a1b2c3..."` — still auditable, but not PII.
2. **Separate PII from ledger events:** Store PII in a deletable store (KV_GABRIEL), reference it by signup ID in the ledger. When erasure is requested, delete the KV entry; the ledger entry becomes orphaned but contains no PII.
3. **Implement tombstone records:** On erasure request, append a `signup.erased` event that marks the original as invalidated. The data remains but is flagged as "erased" — weaker compliance but maintains append-only integrity.

**Recommended approach: Option 2** — it preserves the append-only ledger architecture while enabling full erasure compliance.

### 4.5 CCPA/CPRA Compliance (California — If Serving CA Users)

| Requirement | Status | Gap |
|-------------|--------|-----|
| Notice at collection | ❌ FAIL | No notice on landing page signup form |
| Right to know | ❌ FAIL | No access endpoint |
| Right to delete | ❌ FAIL | No deletion endpoint |
| Right to opt-out of sale | ⚠️ N/A | NOIZY.AI does not sell data (this is a design value) |
| Non-discrimination | ✅ PASS | No differential treatment based on privacy choices |

**CCPA Verdict:** Applies if NOIZY.AI meets revenue/data thresholds (>$25M revenue or >100K consumers' data). Even below thresholds, implementing these rights is best practice and required for GDPR/PIPEDA anyway.

---

## SECTION 5: CLOUDFLARE SERVICE COMPLIANCE

### 5.1 Terms of Service
**Status: COMPLIANT** (with caveats)

NOIZY.AI's use of Workers, D1, KV, Pages, and R2 falls within Cloudflare's Self-Serve Subscription Agreement and Service-Specific Terms. Key considerations:

- **Workers:** Used as an API gateway — standard and permitted use
- **D1:** Used for structured data storage — permitted
- **KV:** Used for signup data and idempotency caching — permitted
- **Pages:** Used for static site hosting — standard use
- **Content restrictions:** No prohibited content (no malware, no illegal content, no copyrighted material being served)

### 5.2 Data Residency
**Status: NOT CONFIGURED — MEDIUM RISK**

D1 databases (`agent-memory` and `gabriel_db`) were created WITHOUT jurisdiction flags. This means:
- Data may be stored and replicated across any Cloudflare datacenter globally
- If an EU user signs up, their PII may be stored outside the EU — a potential GDPR violation
- Cloudflare's D1 now supports `--jurisdiction eu` and `--jurisdiction fedramp` flags, but these can only be set at database creation time, not retroactively

**Remediation:** For GDPR compliance, consider creating a new D1 database with `--jurisdiction eu` for EU user data, or implement data localization at the application layer.

### 5.3 Cloudflare as Data Processor
**Status: ADEQUATE**

Cloudflare acts as a data processor under GDPR. They maintain:
- EU Cloud Code of Conduct compliance
- Standard Contractual Clauses for international transfers
- SOC 2 Type II, ISO 27001, PCI DSS certifications

Cloudflare's Data Processing Addendum (DPA) is automatically included in their Self-Serve agreement. No additional action needed from NOIZY.AI's side for the processor relationship, but NOIZY.AI must fulfill its obligations as the data **controller**.

---

## SECTION 6: MCP SERVER DATA HANDLING

### 6.1 Data Flow Audit

| MCP Server | Data It Handles | PII Risk | External Calls |
|------------|----------------|----------|----------------|
| noizy-gemma3 | Shell commands, file reads on GOD.local | LOW | Ollama (localhost), Cloudflare API |
| GitKraken | Git operations, code diffs | NONE | GitHub API |
| gabriel-mcp | Agent orchestration, consent routing | MEDIUM | HEAVEN API (PII in transit) |
| lucy-mcp | Voice synthesis requests | MEDIUM | HEAVEN API, voice models |
| heaven-mcp | Direct HEAVEN API access | HIGH | All PII endpoints |
| engr-keith-mcp | Engineering tasks | LOW | HEAVEN API |
| dream-mcp | DreamChamber audio processing | LOW | Local audio pipeline |
| cb01-mcp | Unknown (needs investigation) | UNKNOWN | HEAVEN API |
| shirley-mcp | Unknown (no HEAVEN dependency) | LOW | Local only |
| family-mcp | Unknown (no HEAVEN dependency) | LOW | Local only |
| dreamchamber-audio-mcp | Audio processing pipeline | NONE | Local audio hardware |

**Key Risk:** gabriel-mcp, lucy-mcp, heaven-mcp, and engr-keith-mcp all communicate with HEAVEN and may pass PII (actor IDs, email addresses, consent tokens) through their requests. Since these run locally on GOD.local, the risk is contained to the local machine, but any future cloud deployment of these agents would require encrypted channels and access controls.

### 6.2 MCP Config URL Staleness
**Status: FIXED (this session)**

4 MCP servers previously referenced `heaven.noizylab.workers.dev` (stale URL). Updated to `heaven.rsp-5f3.workers.dev` during this session. The stale URL may have pointed to a different or non-existent deployment, which means agent requests would have failed silently or hit the wrong backend.

---

## SECTION 7: REMEDIATION ROADMAP

### IMMEDIATE (Do This Week)

| # | Action | Severity | Effort |
|---|--------|----------|--------|
| 1 | **Add privacy policy to landing page** — Include: what data is collected, why, how long it's kept, how to request deletion, contact info for privacy inquiries | CRITICAL | 4 hrs |
| 2 | **Add consent checkbox to signup form** — "I agree to the Privacy Policy and consent to NOIZY.AI contacting me about [purpose]" with timestamp stored in KV | CRITICAL | 2 hrs |
| 3 | **Build `/v1/data-request` endpoint** — Accept email, return all data associated with that address (from KV_GABRIEL and ledger). Satisfies GDPR Art. 15, PIPEDA Principle 9, CCPA right to know. | CRITICAL | 4 hrs |
| 4 | **Build `/v1/data-delete` endpoint** — Accept email, delete KV_GABRIEL signup entry, pseudonymize email in ledger entries. Satisfies GDPR Art. 17. | CRITICAL | 6 hrs |
| 5 | **Remove or quarantine codestral** — `ollama rm codestral` or document it as non-production only | CRITICAL | 5 min |
| 6 | **Add LICENSE file to repo root** | HIGH | 1 hr |
| 7 | **Upgrade Next.js to 15+ or 16** — Fixes 5 CVEs | HIGH | 2 hrs |

### SHORT-TERM (This Month)

| # | Action | Severity | Effort |
|---|--------|----------|--------|
| 8 | **Pseudonymize PII in ledger** — Modify `/v1/signup` to hash email before writing to noizy_ledger. Store cleartext only in KV_GABRIEL (deletable). | HIGH | 4 hrs |
| 9 | **Set KV TTL on signup entries** — Add `expirationTtl` (e.g., 2 years) to KV_GABRIEL signup puts | MEDIUM | 30 min |
| 10 | **Designate a privacy contact** — Add to privacy policy and landing page footer | MEDIUM | 30 min |
| 11 | **Document data retention policy** — How long each data type is kept and why | MEDIUM | 2 hrs |
| 12 | **Store CASL consent timestamp** — Modify signup to record explicit consent datetime | HIGH | 1 hr |
| 13 | **Update npm devDependencies** — `npm audit fix` for devalue, esbuild, undici in HEAVEN | MEDIUM | 1 hr |

### MEDIUM-TERM (This Quarter)

| # | Action | Severity | Effort |
|---|--------|----------|--------|
| 14 | **Review n8n license** — If n8n powers any customer-facing workflow, obtain Enterprise license or replace | MEDIUM | Research |
| 15 | **Grafana source disclosure** — If modified, publish modifications per AGPL-3.0 | MEDIUM | Depends |
| 16 | **Create EU-jurisdiction D1 database** — For EU user data if/when serving EU market | MEDIUM | 2 hrs |
| 17 | **Implement rate limiting on signup** — Prevent abuse/enumeration of the waitlist endpoint | MEDIUM | 2 hrs |
| 18 | **Cookie/tracking audit on landing page** — Ensure no third-party trackers (Google Analytics, etc.) run without consent | MEDIUM | 1 hr |

---

## SECTION 8: ARCHITECTURAL RECOMMENDATION

The most significant finding is the tension between HEAVEN's append-only ledger (a core architectural principle) and privacy law's right to erasure. This is not a bug — it's a genuine design conflict that reflects a real tension in the industry.

**Recommended Architecture Change:**

```
CURRENT (problematic):
  signup → KV_GABRIEL (email in cleartext, no TTL)
         → noizy_ledger (email in cleartext, permanent, immutable)

PROPOSED (compliant):
  signup → KV_GABRIEL (email in cleartext, 2-year TTL, deletable on request)
         → noizy_ledger (email as SHA-256 hash, permanent, immutable)
         → KV_GABRIEL consent record (consent timestamp, purpose, CASL-compliant)
```

The ledger stays append-only and immutable — but it never contains raw PII. The cleartext PII lives only in KV, which is fully deletable. When a user requests erasure, delete the KV entry; the ledger entry becomes a hash that can't be reversed. Audit trail preserved. Privacy rights honored. Constitutional law intact.

---

## SECTION 9: COMPLIANCE CHECKLIST

| Item | Status | Priority |
|------|--------|----------|
| No secrets in git | ✅ PASS | — |
| No secrets in config files | ✅ PASS | — |
| All npm production licenses permissive | ✅ PASS | — |
| Cloudflare ToS compliant | ✅ PASS | — |
| Cloudflare DPA adequate | ✅ PASS | — |
| Privacy policy published | ❌ FAIL | CRITICAL |
| Consent checkbox on signup | ❌ FAIL | CRITICAL |
| Data access endpoint | ❌ FAIL | CRITICAL |
| Data deletion endpoint | ❌ FAIL | CRITICAL |
| codestral model quarantined | ❌ FAIL | CRITICAL |
| LICENSE file in repo | ❌ FAIL | HIGH |
| Next.js CVEs patched | ❌ FAIL | HIGH |
| CASL consent mechanism | ❌ FAIL | HIGH |
| PII pseudonymized in ledger | ❌ FAIL | HIGH |
| KV retention policy (TTL) | ❌ FAIL | MEDIUM |
| Privacy officer designated | ❌ FAIL | MEDIUM |
| Data retention policy documented | ❌ FAIL | MEDIUM |
| D1 jurisdiction configured | ❌ FAIL | MEDIUM |
| n8n license reviewed | ⚠️ REVIEW | MEDIUM |
| Grafana AGPL obligations met | ⚠️ REVIEW | MEDIUM |
| UA/Apollo license valid | ✅ PASS (assumed) | LOW |
| Docker images license-clear | ⚠️ PARTIAL | MEDIUM |
| MCP data flows documented | ✅ DONE (this report) | — |
| Stale HEAVEN URLs fixed | ✅ DONE (this session) | — |

---

## APPENDIX A: HEAVEN PII FLOW DIAGRAM

```
User visits noizy-ai-landing.pages.dev
  ↓
Fills signup form (email, name, role)
  ↓ POST /v1/signup
  ↓
HEAVEN Worker receives request
  ├── Writes to KV_GABRIEL: signup:{UUID} = {email, name, preference, timestamp, source}
  │   └── ⚠️ No TTL. No consent recorded. No privacy notice shown.
  │
  ├── Writes to D1 noizy_ledger: {event_type: "signup.created", payload_json: {email, name, preference}}
  │   └── ⚠️ Email in cleartext. Append-only. Cannot be deleted.
  │
  └── Returns: {signup_id, status: "registered"}
      └── ⚠️ No confirmation email. No consent receipt.
```

## APPENDIX B: APPLICABLE REGULATIONS

| Regulation | Jurisdiction | Applies Because |
|-----------|-------------|-----------------|
| **PIPEDA** | Canada (federal) | NOIZY.AI is a Canadian commercial enterprise collecting personal information |
| **CASL** | Canada (federal) | The moment any commercial email is sent to collected addresses |
| **GDPR** | European Union | If any EU resident signs up (extraterritorial reach) |
| **CCPA/CPRA** | California, USA | If any CA resident signs up and thresholds are met |
| **POPIA** | South Africa | If any SA resident signs up (extraterritorial) |
| **LGPD** | Brazil | If any Brazilian resident signs up (extraterritorial) |

Note: GDPR, CCPA, POPIA, and LGPD all have extraterritorial reach. A Canadian company collecting data from residents of these jurisdictions must comply with their laws regardless of where the company is based.

---

*Generated by NOIZY.AI Compliance Audit — Robert Stephen Plowman / NOIZYFISH*
*Every voice is sovereign. Every use requires consent. Every artist gets 75%.*
*Report hash: SHA-256 of this document should be stored for audit trail purposes.*
