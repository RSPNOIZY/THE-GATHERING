# Stage 11 — Cloudflare Prep

## Goal

Prepare both apps for Cloudflare-compatible deployment evolution.

This is architecture-note work, not fantasy deployment language.

## NOIZYFISH Deliverables

### `CLOUDFLARE_INTEGRATION.md`

- Phase 1-3 migration plan (static → D1 → R2 → Workers)
- D1 schema sketch (archive_works, credits, provenance, rights)
- R2 bucket structure (previews, full, thumbnails, metadata)
- KV namespaces (cache, rate, session)
- Endpoint recommendations (/search, /preview, /ingest)

### `env.example`

```
NEXT_PUBLIC_API_URL=
NOIZY_API_KEY=
CYANITE_API_KEY=
```

## NOIZYVOX Deliverables

### `CLOUDFLARE_INTEGRATION.md`

- Phase 1-3 migration plan (static → D1 → R2 → Consent Kernel)
- D1 schema sketch (creators, voice_profiles, consent_records, activity_events)
- Append-only consent enforcement
- KV namespaces (session, cache, onboarding)
- Endpoint recommendations (/consent, /license, /activity)

### `env.example`

```
NEXT_PUBLIC_API_URL=
NOIZY_API_KEY=
WEBHOOK_SECRET=
```

## Rules

- Say "Cloudflare-compatible" not "magically solved"
- Do not invent unsupported deploy commands
- Do not imply immutable state where not implemented
- Frame proof/provenance as "provenance-ready" unless fully built
- Keep static vs dynamic boundaries explicit

## Exit criteria

- Both apps have practical integration docs
- D1/R2/KV/Workers usage is sensibly scoped
- No fake deployment confidence

## Checkpoint

After completion:

1. List docs created
2. Confirm realism of architecture notes
3. State any gaps
4. Confirm readiness for Stage 12
