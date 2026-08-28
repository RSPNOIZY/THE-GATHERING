# NOIZY Consent Policy — Public

**Effective**: April 17, 2026
**Version**: 1.0
**Contact**: rsp@noizy.ai
**Operator**: NOIZY Labs (Robert Stephen Plowman, RSP_001), Canada/Quebec

Publish this as `noizy.ai/consent` or include in the footer of every NOIZY property.

---

## Our Commitment

> **Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic.**

NOIZY does not generate, train on, or distribute any synthesis of a human voice
or likeness without a valid, active consent token issued through the NOIZY
Consent Kernel. This is not policy — it is enforced in code.

## What "Consent" Means Here

A NOIZY consent token is:

1. **Explicit** — granted by the named actor, not inferred from terms of service.
2. **Scoped** — use category, territory, time window, and royalty split are all
   encoded in the token and checked before every synthesis request.
3. **Time-limited** — tokens have an expiry. No expiry = no token.
4. **Revocable** — the actor can revoke any token at any time via the Kill
   Switch. Revocation is effective immediately and flagged in the Ledger.
5. **Auditable** — every issuance, use, and revocation is written to the NOIZY
   Ledger, an append-only record.

## The Nine Never Clauses

Regardless of what a token permits, synthesis is hard-blocked for:

1. Political campaigns, endorsements, or electioneering.
2. Adult / sexual content.
3. Promotion or incitement of weapons or violence.
4. Fraud or impersonation.
5. Hate speech.
6. Unauthorized transfer of voice or likeness data.
7. Surveillance or biometric identification.
8. Synthesis without a valid consent token. (System integrity.)
9. Transfer of voice DNA outside the NOIZY kernel. (System integrity.)

These are immovable. They are not overrideable — not by NOIZY Labs, not by
any licensee, not by any court that has not first compelled us through lawful
process (in which case the Ledger will record the compulsion).

## Your Rights as an Actor

If you are an actor registered with NOIZY, you have the right to:

- **See every token** issued against your descendants.
- **See every use** of those tokens (via your Ledger view).
- **Revoke any token** at any time — propagates in under 1 second.
- **Request deletion** of your descendant data, subject to the Never Clauses
  and the 100-year preservation policy for archival descendants.
- **Receive royalties** automatically as tokens are exercised (75% actor /
  25% platform by default; see your Rate Table for specifics).

## Your Rights If You Believe Your Voice Was Synthesized Without Consent

1. Send a report to `rsp@noizy.ai` with the URL(s) of the synthesis.
2. We verify against the Ledger within 48 hours.
3. If no token exists, we issue enforcement (DMCA, notice-and-notice, or
   cease-and-desist) within 7 days and log the action to the Ledger.
4. If a token exists but you dispute it, we freeze it pending investigation.

## Provenance (C2PA)

Every synthesis produced by NOIZY carries a C2PA Content Credentials manifest
signed with our production key. You can verify any such manifest at
`https://verify.c2pa.org/` using our public cert chain, available at
`noizy.ai/c2pa-cert`.

## Estate

Voice assets registered under estate policy are preserved for 100 years under
the OAIS reference model with PREMIS metadata. Estate descendants continue
to require valid tokens after the actor's death — ownership of the consent
kernel transfers to the actor's designated heir.

## Changes to This Policy

Any change is logged to the Ledger as `CONSENT_POLICY_CHANGE` and
countersigned with the NOIZY production key. The Ledger is canonical; this
page is a human-readable rendering.

## Contact

- Questions: rsp@noizy.ai
- Legal notices: rsp@noizy.ai (please include "LEGAL" in the subject line)
- Incident reports: rsp@noizy.ai (please include "INCIDENT" in the subject line)

Robert Stephen Plowman (RSP_001) · NOIZY Labs · Canada
