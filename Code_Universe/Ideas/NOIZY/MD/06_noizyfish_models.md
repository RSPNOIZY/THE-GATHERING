# Stage 06 — NOIZYFISH Content Models

## Goal

Lock the NOIZYFISH content model as a future-ready archive system.

## Interfaces to create/verify

```typescript
interface ArchiveItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  year: number;
  category: ArchiveCategory;
  depth?: number;
  duration?: number;
  synopsis: string;
  description?: string;
  location?: Location;
  tags: string[];
  collaborators: Collaborator[];
  credits: Credit[];
  rightsStatus: RightsStatus;
  provenanceStatus: ProvenanceStatus;
  featuredMedia: MediaAsset;
  relatedWorks?: string[];
}
```

## Mock data requirements

- 6-8 strong archive works
- Variety of categories (bioacoustic, ambient, weather, field-recording)
- Variety of depths (sunlight, twilight, midnight, abyssal)
- Realistic metadata (locations, durations, years)

## Deliverables

- `packages/types/src/index.ts` — verified/expanded types
- `apps/noizyfish/lib/data.ts` — mock archive data
- D1 schema sketch (optional)
- Add-new-entry documentation notes

## Exit criteria

- Fields are clean and unambiguous
- Mock data supports all page patterns
- Future D1 mapping is plausible
- Type drift is minimized

## Checkpoint

After completion:

1. List type changes
2. Confirm mock data quality
3. State any model compromises
4. Confirm readiness for Stage 07
