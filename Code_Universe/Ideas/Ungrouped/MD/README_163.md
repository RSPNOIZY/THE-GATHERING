# NOIZYVOX

**Sovereign voice identity platform**

Your voice. Your terms.

---

## Overview

NOIZYVOX is a consent-native voice identity platform for human performers. Control who uses your voice, how they use it, and revoke permission at any time.

## Features

- **Explicit Consent**: Every use requires granular, explicit permission
- **Instant Revocation**: Kill Switch immediately halts all synthetic use
- **Transparent Usage**: See exactly where and how your voice is used
- **Fair Compensation**: 75/25 split—you take 75% of every transaction

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page with value proposition |
| `/casting` | Professional voice discovery |
| `/trust` | Trust pillars and architecture |
| `/consent` | Rights management dashboard |
| `/onboarding` | 8-step enrollment flow |
| `/dashboard` | Enrolled user dashboard |
| `/about` | Mission and NOIZY ecosystem |

## Development

```bash
# From monorepo root
pnpm dev --filter=@noizy/noizyvox

# From this directory
pnpm dev
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Types**: @noizy/types
- **UI**: @noizy/ui

## Backend

NOIZYVOX connects to the Heaven API for:
- `/consent` — Consent token management
- `/actors` — Voice profile registry
- `/synthesis` — Consent-verified synthesis requests
- `/revoke` — Kill Switch execution

See NOIZYLAB for Heaven Worker code.

## Design Language

- **Primary**: Amber/Orange warm palette
- **Typography**: Light weights, professional tone
- **Metaphor**: "Your voice is your signature. We keep it yours."
- **Tone**: Empowering, professional, protective, warm

## Consent Architecture

### Never Clauses
Immutable prohibitions that can never be overridden:
- No voice used without explicit consent
- No consent assumed or implied
- No data sold to third parties
- No posthumous use without estate permission

### Voice DNA
Encrypted spectral fingerprint used for:
- Authenticity verification
- Unauthorized synthesis detection
- Descendant model tracking

### Consent Kernel
Every synthesis request checked against live consent:
1. Validate requestor identity
2. Check consent token scope
3. Verify territory restrictions
4. Confirm commercial category
5. Log to immutable ledger

### Kill Switch
Instant revocation capability:
- Single-click consent withdrawal
- Immediate synthesis halt
- Retroactive logging (not enforcement)

## Onboarding Flow

1. **Identity** — Basic profile information
2. **Goals** — What you want from NOIZYVOX
3. **Recording** — Voice recording consent
4. **Model** — Model training permissions
5. **Usage** — Commercial category selection
6. **Attribution** — Credit preferences
7. **Territory** — Geographic restrictions
8. **Review** — Final consent summary

---

**"Consent is not a checkbox. It is the foundation."**
