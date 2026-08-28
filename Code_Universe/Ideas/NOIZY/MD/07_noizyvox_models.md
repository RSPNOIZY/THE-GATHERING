# Stage 07 — NOIZYVOX Data Models

## Goal

Lock the NOIZYVOX data model as a consent-native platform foundation.

## Interfaces to create/verify

```typescript
interface VoiceProfile {
  id: string;
  displayName: string;
  bio: string;
  styles: VoiceStyle[];
  languages: Language[];
  readiness: ReadinessStatus;
  sampleUrl?: string;
  enrolledAt?: string;
}

interface ConsentState {
  recordingConsent: { granted: boolean; grantedAt?: string };
  modelTrainingConsent: { granted: boolean; grantedAt?: string };
  commercialUsage: CommercialUsage;
  revocationStatus: "active" | "revoked" | "pending";
  attributionRequired: boolean;
  approvalRequired: boolean;
  territoryRestrictions: TerritoryRestrictions;
  durationScope: DurationScope;
}

interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  // Step-specific data...
}
```

## Mock data requirements

- 5-6 voice profiles
- Multiple consent configurations
- Multiple readiness states
- Dashboard activity events

## Deliverables

- `packages/types/src/index.ts` — verified/expanded types
- `apps/noizyvox/lib/data.ts` — mock voice/consent data
- D1 schema sketch (optional)
- Normalization notes

## Exit criteria

- Voice is identity, not commodity
- Recording consent separate from model permission
- Training permission separate from usage permission
- Dashboard, casting, and consent can all consume these models

## Checkpoint

After completion:

1. List type changes
2. Confirm mock data quality
3. State any model compromises
4. Confirm readiness for Stage 08
