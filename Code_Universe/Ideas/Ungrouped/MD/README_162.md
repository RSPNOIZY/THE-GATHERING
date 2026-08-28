# NOIZYFISH

**Museum-grade ocean audio archive**

Ocean archives. Provenance preserved.

---

## Overview

NOIZYFISH is a provenance-verified audio archive for ocean and environmental recordings. Every sample carries its full lineage—origin-traced, heritage preserved.

## Features

- **Verified Origins**: Every recording traced to GPS coordinates, equipment, and conditions
- **Chain of Custody**: Cryptographic verification from capture to catalog
- **Archival Quality**: Uncompressed, high-resolution audio preservation
- **Consent-Aware**: Protected species and sensitive locations handled appropriately

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page with featured works |
| `/archive` | Filterable archive browser |
| `/archive/[slug]` | Individual archive item detail |
| `/lineage` | Provenance philosophy |
| `/about` | Mission and founder |
| `/contact` | Contact and contribution guidelines |

## Development

```bash
# From monorepo root
pnpm dev --filter=@noizy/noizyfish

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

NOIZYFISH connects to a Cloudflare Worker for:
- `/search` — Provenance-verified audio discovery
- `/ingest` — Audio upload with ZK proof generation
- `/preview/:id` — Signed preview URLs

See `infrastructure/noizyfish/` for Worker code.

## Design Language

- **Primary**: Cyan/Teal oceanic palette
- **Typography**: Light weights, generous spacing
- **Metaphor**: "The ocean remembers everything. We help it speak."
- **Tone**: Reverent, archival, scientific, poetic

## Archive Categories

- Marine Mammals
- Ocean Ambience
- Ice & Weather
- Reef Systems
- Deep Ocean
- Coastal

## Ocean Zones

- Epipelagic (0-200m)
- Mesopelagic (200-1000m)
- Bathypelagic (1000-4000m)
- Abyssopelagic (4000m+)

---

**"The archive is not a warehouse. It is a living memory."**
