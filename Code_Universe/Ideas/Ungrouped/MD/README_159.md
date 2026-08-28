# NOIZY-MONO

**The NOIZY Empire Monorepo**

Shared primitives, separate souls. Two portals, one architecture.

---

## Portals

| Portal | Purpose | Stack |
|--------|---------|-------|
| **NOIZYFISH** | Museum-grade ocean audio archive | Next.js 14 + Cloudflare Workers |
| **NOIZYVOX** | Sovereign voice identity platform | Next.js 14 + Cloudflare Workers |

## Architecture

```
NOIZY-MONO/
├── apps/
│   ├── noizyfish/          # Ocean archive portal
│   └── noizyvox/           # Voice identity portal
├── packages/
│   ├── types/              # Shared TypeScript definitions
│   ├── ui/                 # Shared UI primitives
│   └── content/            # Shared content models & copy
├── infrastructure/
│   ├── noizyfish/          # Cloudflare Worker + D1 + R2
│   ├── circuits/           # ZK circuits (circom)
│   └── n8n/                # Workflow definitions
├── turbo.json              # Turborepo configuration
└── pnpm-workspace.yaml     # pnpm workspace definition
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Run both apps in development
pnpm dev

# Run specific app
pnpm dev --filter=@noizy/noizyfish
pnpm dev --filter=@noizy/noizyvox

# Build all
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Packages

### @noizy/types

Shared TypeScript definitions for:
- `ArchiveItem` — Audio archive entries
- `VoiceProfile` — Voice identity profiles
- `ConsentState` — Granular consent management
- `OnboardingState` — Enrollment flow state

### @noizy/ui

Shared UI components:
- `SectionWrapper` — Consistent section layout
- `PageHeader` — Page title + breadcrumbs
- `PremiumCard` — Elevated card component
- `MetadataList` — Key-value display
- `StatusChip` — Status indicators
- `CTARow` — Call-to-action buttons
- `QuoteBlock` — Styled quotations
- `EmptyState` — Empty state placeholders
- `FilterBar` — Filter controls

### @noizy/content

Content models and copy contracts:
- `APPROVED_COPY` — Vocabulary guidelines
- `FORBIDDEN_COPY` — Terms to avoid
- Brand tokens per portal
- Structured content models

## Infrastructure

### NOIZYFISH Worker

Cloudflare Worker for audio archive API:
- **D1 Database**: Append-only audit events + asset metadata
- **R2 Storage**: Audio file storage
- **KV**: Session cache + rate limiting

```bash
# Deploy worker
cd infrastructure/noizyfish
npx wrangler deploy

# Initialize database
npx wrangler d1 execute noizyfish_audit --remote --file schema.sql
```

### ZK Circuits

Zero-knowledge proofs for provenance verification:
- `REAL_HUMAN_ORIGIN` — Verify human origin without revealing identity

```bash
# Compile circuit (requires circom)
cd infrastructure/circuits
circom real_human_origin.circom --r1cs --wasm --sym
```

### n8n Workflows

Audio ingestion pipeline:
1. Webhook trigger
2. Cyanite audio analysis
3. ZK proof generation
4. Receipt signing
5. R2 upload + D1 audit

## Development

### Prerequisites

- Node.js 20+
- pnpm 8+
- Cloudflare account (for Workers deployment)
- Wrangler CLI (`npm i -g wrangler`)

### Environment Variables

Create `.env.local` in each app:

```bash
# apps/noizyfish/.env.local
NEXT_PUBLIC_API_URL=https://noizyfish.com

# apps/noizyvox/.env.local
NEXT_PUBLIC_API_URL=https://noizyvox.com
```

Worker secrets (via `wrangler secret put`):
- `NOIZY_API_KEY`
- `CYANITE_API_KEY`
- `ZK_VERIFIER_URL`

## Design Principles

1. **Provenance First**: Every asset carries its full lineage
2. **Consent Native**: No assumptions, explicit permissions only
3. **Append Only**: Audit logs never modified or deleted
4. **Cryptographic Truth**: ZK proofs for verification without exposure
5. **Museum Grade**: Quality and preservation over quantity

## License

Proprietary. NOIZY Empire internal use only.

---

**"Consent as executable code. Provenance as default."**
