# DMCA / Enforcement Template — NOIZY Empire

**From**: Robert Stephen Plowman (RSP_001), NOIZY Labs
**Contact**: rsp@noizy.ai
**Jurisdiction**: Canada (Quebec)

> **⚠️ Legal review required before sending.** This is a drafting aid, not legal advice.
> For US DMCA (17 U.S.C. § 512) and Canada CCMA notices, have a Canadian IP lawyer
> review the first 3 notices before automating.

---

## DMCA Takedown Notice (US hosts — 17 U.S.C. § 512(c)(3))

```
To: DMCA Agent, [Platform / Host]
[DMCA Agent contact, pulled from https://www.copyright.gov/dmca-directory/]

Date: [ISO-8601 date]
Reference: NOIZY-DMCA-[YYYYMMDD-NNN]

DMCA TAKEDOWN NOTICE UNDER 17 U.S.C. § 512(c)(3)

1. IDENTIFICATION OF COPYRIGHTED WORK

The work is: [title, artist, original release date, ISRC/ISWC if applicable].
Copyright is held by: Robert Stephen Plowman (RSP_001), NOIZY Labs, Canada.
C2PA manifest reference: [ledger tx hash or manifest URL].

2. IDENTIFICATION OF INFRINGING MATERIAL

The infringing material is located at:
  [full URL 1]
  [full URL 2]
  [...]

The material is an unauthorized synthesis of the above copyrighted work,
generated without a valid NOIZY consent token. This was verified against the
NOIZY Ledger (append-only, tamper-proof) on [date]. No token was found for
actor_id=RSP_001 matching the use category represented by this material.

3. GOOD FAITH STATEMENT

I have a good faith belief that use of the material in the manner complained
of is not authorized by the copyright owner, its agent, or the law.

4. ACCURACY STATEMENT

Under penalty of perjury, I state that the information in this notification
is accurate, and I am authorized to act on behalf of the owner of the
exclusive right that is allegedly infringed.

5. SIGNATURE

Robert Stephen Plowman
NOIZY Labs
rsp@noizy.ai
[physical signature or digital signature block]

6. CONTACT

  Name:    Robert Stephen Plowman
  Email:   rsp@noizy.ai
  Country: Canada
  Org:     NOIZY Labs

---
Attachments:
  - Copy of original work registration
  - C2PA manifest (signed, rsp@noizy.ai cert chain)
  - Ledger excerpt showing absence of authorizing token
```

---

## Canada — Notice and Notice Regime (Copyright Modernization Act, CCMA)

Canada does not impose takedown on ISPs, but notice-and-notice requires
forwarding. Use this for CA-hosted material:

```
To: [ISP / Host]  Re: Notice under s. 41.25 Copyright Act (Canada)

A notice of claimed infringement is provided under s. 41.25 of the
Copyright Act (Canada) regarding material at:

  [URL(s)]

Claimed owner:       Robert Stephen Plowman (RSP_001)
Work:                [title, identifiers]
Evidence:            C2PA manifest [hash], Ledger [tx hash]
Claimed date:        [infringement discovered]
Contact:             rsp@noizy.ai

Please forward this notice to the subscriber responsible for the identified
content as required by law.
```

---

## Cease-and-Desist (synthesis platforms without takedown mechanism)

```
To: [Platform legal@]  Date: [ISO-8601]
Re: Unauthorized synthesis of copyrighted voice — demand to cease

Your platform generated and distributed synthesized audio of
[artist/RSP_001]'s voice at [URL(s)] on [date]. This synthesis was performed
without a valid consent token issued by the NOIZY consent kernel. The
absence is verifiable against the NOIZY Ledger (public append-only
provenance record, reference [tx hash]).

Demand:
  1. Immediate removal of the material at the URL(s) above.
  2. Confirmation that your training data does not contain voice samples
     sourced from Robert Stephen Plowman (RSP_001) or his recorded works.
  3. Response within 7 calendar days.

Failure to comply will result in escalation to:
  - DMCA / notice-and-notice proceedings in applicable jurisdictions.
  - Public disclosure via the NOIZY Ledger and accompanying press.
  - Legal action under the Copyright Act (Canada) and any applicable
    state law in your operating jurisdiction.

This notice is served in good faith under the NOIZY Empire enforcement
protocol.

Robert Stephen Plowman
rsp@noizy.ai | NOIZY Labs, Canada
```

---

## Internal workflow (when a violation is detected)

1. **Verify** — confirm no token exists in NOIZY Ledger for the observed synthesis.
2. **Snapshot** — capture URL(s), audio hash, timestamp to `noizy_enforcement` table.
3. **Assign reference** — `NOIZY-DMCA-YYYYMMDD-NNN`, increment counter.
4. **Choose template** — DMCA (US), notice (CA), or C&D (non-safe-harbor).
5. **Legal review** — first 3 notices per jurisdiction reviewed by counsel.
6. **Send** — from `rsp@noizy.ai` with read receipt where possible.
7. **Log to Ledger** — event_type=`ENFORCEMENT_NOTICE_SENT`, reference=NOIZY-DMCA-...
8. **Follow up** — 7 days for C&D, 14 days for DMCA escalation.
