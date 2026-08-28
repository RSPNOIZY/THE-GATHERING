# NOIZY Monorepo Route Map

**Route structure before page volume.**

---

## NOIZYFISH Routes

```
apps/noizyfish/app/
├── layout.tsx              # Root layout (nav, footer, caustics)
├── page.tsx                # / — Landing, hero, featured works
├── archive/
│   ├── layout.tsx          # Archive shell (filter sidebar on desktop)
│   ├── page.tsx            # /archive — Filterable grid
│   └── [slug]/
│       └── page.tsx        # /archive/{slug} — Detail page
├── lineage/
│   └── page.tsx            # /lineage — Provenance philosophy
├── about/
│   └── page.tsx            # /about — Mission, founder
└── contact/
    └── page.tsx            # /contact — Contact, contributions
```

### NOIZYFISH Route Ownership

| Route | Layout | Dynamic | Purpose |
|-------|--------|---------|---------|
| `/` | Root | Static | Landing with featured works |
| `/archive` | Archive | Static → D1 | Filterable catalog |
| `/archive/[slug]` | Archive | Static → D1 | Individual work detail |
| `/lineage` | Root | Static | Provenance philosophy |
| `/about` | Root | Static | Mission statement |
| `/contact` | Root | Static | Contact info |

### Future NOIZYFISH Routes (Phase 2+)

```
├── preview/
│   └── [id]/
│       └── route.ts        # /preview/{id} — Signed R2 URL (API route)
├── api/
│   ├── search/
│   │   └── route.ts        # /api/search — Search endpoint
│   └── ingest/
│       └── route.ts        # /api/ingest — Upload endpoint
```

---

## NOIZYVOX Routes

```
apps/noizyvox/app/
├── layout.tsx              # Root layout (nav, footer)
├── page.tsx                # / — Landing, value prop
├── casting/
│   ├── layout.tsx          # Casting shell (filters)
│   └── page.tsx            # /casting — Voice discovery
├── trust/
│   └── page.tsx            # /trust — Trust pillars
├── consent/
│   └── page.tsx            # /consent — Rights management
├── onboarding/
│   └── page.tsx            # /onboarding — 8-step wizard
├── dashboard/
│   └── page.tsx            # /dashboard — Creator command center
└── about/
    └── page.tsx            # /about — Mission, ecosystem
```

### NOIZYVOX Route Ownership

| Route | Layout | Dynamic | Purpose |
|-------|--------|---------|---------|
| `/` | Root | Static | Landing with identity pitch |
| `/casting` | Casting | Static → D1 | Voice discovery |
| `/trust` | Root | Static | Trust architecture |
| `/consent` | Root | Static → D1 | Rights dashboard |
| `/onboarding` | Root | Static → KV | Enrollment wizard |
| `/dashboard` | Root | Static → D1 | Creator command center |
| `/about` | Root | Static | Mission statement |

### Future NOIZYVOX Routes (Phase 2+)

```
├── profile/
│   └── [id]/
│       └── page.tsx        # /profile/{id} — Public voice profile
├── api/
│   ├── consent/
│   │   ├── grant/
│   │   │   └── route.ts    # POST /api/consent/grant
│   │   └── revoke/
│   │       └── route.ts    # POST /api/consent/revoke
│   ├── license/
│   │   └── route.ts        # License request/verify
│   └── activity/
│       └── route.ts        # Activity feed
```

---

## Shared vs App-Local Layouts

### Shared (packages/ui)

- `SectionWrapper` — Consistent max-width container
- `PageHeader` — Title + breadcrumb pattern
- `PremiumCard` — Elevated card surface
- `MetadataList` — Key-value display
- `StatusChip` — Status indicators
- `CTARow` — Action button groups
- `QuoteBlock` — Styled quotations
- `EmptyState` — Empty state placeholder
- `FilterBar` — Filter controls

### App-Local (NOIZYFISH)

- `Navigation` — Ocean-themed nav
- `Footer` — Archive-specific links
- `ArchiveCard` — Work card variants
- `ProvenanceChain` — Custody visualization

### App-Local (NOIZYVOX)

- `Navigation` — Voice-themed nav
- `Footer` — Platform-specific links
- `CastingCard` — Voice profile cards
- `ConsentPanel` — Consent toggle groups
- `OnboardingStep` — Wizard step container
- `ActivityTimeline` — Event timeline

---

## Layout Inheritance

```
NOIZYFISH
├── RootLayout (nav, footer, caustics overlay)
│   ├── HomePage
│   ├── LineagePage
│   ├── AboutPage
│   ├── ContactPage
│   └── ArchiveLayout (filter sidebar)
│       ├── ArchivePage
│       └── ArchiveDetailPage

NOIZYVOX
├── RootLayout (nav, footer)
│   ├── HomePage
│   ├── TrustPage
│   ├── ConsentPage
│   ├── OnboardingPage
│   ├── DashboardPage
│   ├── AboutPage
│   └── CastingLayout (filter sidebar)
│       └── CastingPage
```

---

## Static vs Dynamic

### MVP (Static)

Everything renders at build time from `lib/data.ts`:
- Archive works
- Voice profiles
- Consent defaults
- Activity samples

### Phase 1 (D1)

Moves to server-side data fetching:
- `getArchiveWorks()` → D1 query
- `getVoiceProfiles()` → D1 query
- `getConsentState(id)` → D1 query

### Phase 2 (R2 + Workers)

API routes for protected resources:
- `/preview/{id}` → Signed R2 URL
- `/api/search` → Worker endpoint
- `/api/consent/*` → Consent kernel

---

## Route Naming Conventions

1. **Plurals for lists**: `/archive`, `/casting`
2. **Singular for concepts**: `/lineage`, `/trust`, `/consent`
3. **Slug for detail**: `/archive/[slug]` not `/archive/[id]`
4. **API prefix**: `/api/*` for backend routes
5. **No unnecessary nesting**: `/about` not `/pages/about`

---

## Checkpoint Schedule

| Checkpoint | After |
|------------|-------|
| **CP1** | Monorepo scaffold complete |
| **CP2** | Shared contracts defined |
| **CP3** | NOIZYFISH MVP complete |
| **CP4** | NOIZYVOX MVP complete |
| **CP5** | Final QA complete |

---

**"Route structure before page volume."**
