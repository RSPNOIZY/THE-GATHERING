# NOIZY.AI — Workspace Alias Namespace

All aliases route → `rsp@noizy.ai` (single inbox, zero extra cost).

**Where to add:** Admin console → Directory → Users → `rsp@noizy.ai` → **Add alternate email** (bottom of user page).

---

## TIER 1 — RFC / Standards compliance (MANDATORY)

These are expected by internet standards. Missing them is unprofessional and can flag you as spammy.

| Alias                    | Purpose                                                 |
|--------------------------|---------------------------------------------------------|
| `postmaster@noizy.ai`    | RFC 5321 — mail server admin contact (required)         |
| `abuse@noizy.ai`         | RFC 2142 — abuse reports (required for deliverability)  |
| `dmarc@noizy.ai`         | DMARC aggregate + forensic reports                      |
| `tls-reports@noizy.ai`   | TLS-RPT reports (if you add MTA-STS later)              |
| `hostmaster@noizy.ai`    | RFC 2142 — DNS admin contact                            |
| `webmaster@noizy.ai`     | RFC 2142 — web admin contact                            |

---

## TIER 2 — Legal / Business surface (MISSION-CRITICAL)

These are the addresses that appear in your legal documents, C2PA signatures, and enforcement templates (per `contact.md`).

| Alias                  | Purpose                                                     |
|------------------------|-------------------------------------------------------------|
| `legal@noizy.ai`       | DMCA, cease-and-desist, enforcement                         |
| `licensing@noizy.ai`   | Artist licensing, union tier inquiries                      |
| `press@noizy.ai`       | Media inquiries, interview requests                         |
| `consent@noizy.ai`     | Consent token requests, revocations (Kill Switch inquiries) |
| `estate@noizy.ai`      | Estate / legacy account inquiries (100-year OAIS)           |
| `security@noizy.ai`    | Vulnerability disclosure, security issues                   |
| `privacy@noizy.ai`     | GDPR / privacy requests                                     |
| `dpo@noizy.ai`         | Data Protection Officer (GDPR Article 37)                   |

---

## TIER 3 — Empire / Product surfaces

| Alias                  | Purpose                                        |
|------------------------|------------------------------------------------|
| `hello@noizy.ai`       | General inbound, friendly first touch          |
| `support@noizy.ai`     | User / artist support requests                 |
| `contact@noizy.ai`     | Generic fallback                               |
| `empire@noizy.ai`      | Brand / signature / fun                        |
| `heaven@noizy.ai`      | Heaven API notifications, alerts               |
| `ledger@noizy.ai`      | NOIZY Ledger notifications, audit mail         |
| `noreply@noizy.ai`     | Outbound transactional mail from HEAVEN        |
| `alerts@noizy.ai`      | System alerts, monitoring, oncall              |

---

## TIER 4 — Identity / Persona surfaces

| Alias               | Purpose                                              |
|---------------------|------------------------------------------------------|
| `rob@noizy.ai`      | Personal, friendly, non-business                     |
| `rsp001@noizy.ai`   | Sigil identity (RSP_001 — canonical actor ID)        |
| `gabriel@noizy.ai`  | Gabriel agent persona (optional)                     |
| `lucy@noizy.ai`     | Lucy agent persona (optional)                        |
| `shirl@noizy.ai`    | SHIRL agent persona (optional)                       |

⚠️ Persona aliases (Tier 4 agents) are optional — only add if you want agent mail to reach you directly. Otherwise agents should use their own Workspace seats when you scale past 1 user.

---

## Total count: **~25 aliases, all free, all → `rsp@noizy.ai` inbox**

---

## Recommended Gmail filters (set up AFTER aliases exist)

Create labels and auto-sort:

| Filter — "To" contains            | Apply label        | Star? |
|------------------------------------|--------------------|-------|
| `legal@noizy.ai, licensing@noizy.ai, consent@noizy.ai, estate@noizy.ai` | **🜂 LEGAL**    | ⭐ |
| `abuse@noizy.ai, security@noizy.ai, dmarc@noizy.ai` | **🛡️ SECURITY** | ⭐ |
| `press@noizy.ai`                   | **📰 PRESS**       | ⭐ |
| `heaven@noizy.ai, alerts@noizy.ai, ledger@noizy.ai` | **⚙️ SYSTEM**   |    |
| `hello@noizy.ai, contact@noizy.ai, support@noizy.ai` | **💬 INBOUND**  |    |

That turns the single inbox into a triage dashboard without ever managing multiple mailboxes.
