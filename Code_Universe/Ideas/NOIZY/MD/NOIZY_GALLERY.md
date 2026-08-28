# NOIZY GALLERY
### Rotating Independent Canadian Artist Feature — NOIZY.ai Homepage
**Created:** 2026-03-13 | **Status:** SPEC

---

## THE VISION

Every week, the NOIZY.ai homepage features one independent Canadian artist who is exploring visual creation in any form that aligns with NOIZY culture.

Not a corporate showcase. Not a curated brand moment.
A sovereign spotlight — one human, one week, their work, their name, their link.

---

## ALIGNMENT CRITERIA (NOIZY Culture Filter)

An artist belongs in the gallery if their work reflects:

| Value | What it looks like |
|---|---|
| **Sovereign authorship** | Work they made, not generated without their hand in it |
| **Adaptive creativity** | Uses technology to expand expression, not replace it |
| **Cultural lineage** | Roots in a tradition, a place, a body, a story |
| **Human signal** | You can feel the person behind it |
| **Canadian independence** | Not signed to a label, brand, or agency doing it for them |

**All mediums qualify:**
- Visual art, illustration, painting, sculpture
- Generative / algorithmic / code art
- Photography, film, animation
- Sound design, audio-visual installation
- Mixed media, physical + digital
- Body-based, performance-captured
- Anything Rob looks at and says "yes"

---

## TECHNICAL SPEC

### Data Model (per artist feature)

```typescript
interface GalleryFeature {
  id: string;                    // UUID
  weekOf: string;                // ISO date (Monday of feature week)
  artist: {
    name: string;                // Full name
    location: string;            // City, Province
    pronouns?: string;
    bio: string;                 // 2-3 sentences max
    instagram?: string;
    website?: string;
    portfolio?: string;
  };
  work: {
    title: string;
    medium: string;              // "oil on canvas", "generative code", etc.
    year: number;
    imageUrl: string;            // Cloudflare R2 hosted
    description: string;        // Artist's own words, 1-2 sentences
    thumbnailUrl: string;
  };
  vault?: {                      // Optional — if artist opts into NOIZYVOX
    consentLocked: boolean;
    fingerprint: string;         // SHA-256 of image
    usageRights: string;         // "display only" | "editorial" | "commercial"
  };
  noizyAlignment: string[];      // Tags: ["adaptive", "generative", "sound-visual", ...]
  submittedBy: string;           // "Rob" | "community" | "self-submitted"
  approved: boolean;
}
```

### Stack

```
Cloudflare Pages (noizy.ai frontend)
  └─► Cloudflare D1 (gallery SQLite database)
  └─► Cloudflare R2 (artist image storage)
  └─► Cloudflare Workers (weekly rotation cron)

NOIZY Platform API (port 8090)
  └─► /gallery/current → this week's feature
  └─► /gallery/archive → all past features
  └─► /gallery/submit → artist submission endpoint
```

### Rotation Logic (Cloudflare Worker Cron)

```javascript
// Runs every Monday 00:00 UTC
// Pulls next approved feature from queue
// Sets as current → archives previous
// Notifies Rob (Slack/email) when queue < 3
```

---

## UI DESIGN

### Homepage Hero (full-width)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   [ARTIST IMAGE — full bleed, dark overlay on hover]   │
│                                                         │
│   ◈ NOIZY GALLERY — WEEK OF MARCH 17                   │
│                                                         │
│   ARTIST NAME                                           │
│   City, Province                                        │
│   "Work Title" — Medium, Year                           │
│                                                         │
│   [VIEW FULL FEATURE →]  [INSTAGRAM]  [WEBSITE]        │
│                                                         │
│   ○ ○ ● ○ ○  (week dots — click to browse archive)    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Full Feature Page (`noizy.ai/gallery/[week]`)

```
- Full-size image (with Vault fingerprint if opted in)
- Artist bio (their words)
- Work description (their words)
- Medium / year / location
- Social links
- "This artist's work is protected by NOIZYVOX" badge (if opted in)
- Archive rail (previous 8 weeks)
```

---

## SUBMISSION FLOW

1. **Self-submit form** — `noizy.ai/gallery/submit`
   - Artist name, location, pronouns (optional)
   - Upload 1 image (max 20MB)
   - Bio (250 chars max)
   - Work title, medium, year
   - "Why does your work align with NOIZY culture?" (free text)
   - Optional: opt into NOIZYVOX Vault attribution

2. **Rob reviews** — approved queue in CODEMASTER dashboard
   - Say "gallery approve" in DreamChamber → opens queue
   - Say "gallery next" → Rob sees next submission

3. **Weekly rotation** — automatic via Cloudflare cron

---

## VAULT INTEGRATION (Optional for artists)

Artists who opt in get:
- SHA-256 fingerprint of their image
- NOIZYVOX display-only consent record
- "Protected by NOIZY" badge
- Future: LifeLUV micro-split if image is licensed downstream

This is the onramp. Visual artists find NOIZYVOX through the gallery.

---

## VOICE COMMANDS (DreamChamber)

```
"open gallery" → opens submission queue in DreamChamber panel
"gallery approve" → marks current submission as approved
"gallery next" → shows next submission
"gallery publish" → sets this week's feature live
```

---

## PHASE 1 (BUILD THIS FIRST)

1. Cloudflare D1 database with GalleryFeature schema
2. Cloudflare R2 bucket for images
3. Static homepage section (HTML/CSS) with first artist hardcoded
4. NOIZY Platform API endpoint: `GET /gallery/current`
5. Rob manually uploads first 4 weeks of features

**Ship date goal:** First Canadian artist featured within 2 weeks.

---

## PHASE 2

- Self-submit form live
- Cloudflare cron for automatic weekly rotation
- Archive page (all past features)
- DreamChamber voice commands for curation

---

## FIRST ARTIST IDEAS

Rob knows who belongs here. The first feature sets the tone for everything that follows.

Criteria for week one:
- Someone whose work stops you
- Canadian, independent, not famous enough yet
- Any medium — the medium IS the message that week
- Someone who would be genuinely surprised and grateful to be seen

---

*"Every week, one human. Their work. Their name. Sovereign."*

---

## GALLERY UPGRADES (2026-03-13)

### The Revenue Question — 75/25, Not 70/30

NOIZY's standard is 75% creator / 25% platform. The gallery must honor this. Visual artists who discover NOIZYVOX through the gallery should enter a system where the numbers match what they were promised. 70/30 is inconsistent with the Crown Jewels Protocol.

**Confirmed split: 75% artist / 25% NOIZY**

### Model A vs Model B

Two formats available:
- **Weekly Sovereign Spotlight** (default) — one artist, full homepage, their story
- **Themed Exhibition** (special edition) — 5–10 artists, curated theme (Northern Light, Dream Sound, Future Indigenous Voices, Urban Canada, AI + Human Collaboration)

Start with A. Add B as seasonal special editions once the archive has depth.

### Community Engagement (Phase 3)

- Like / share artwork (logged, feeds recommendation engine)
- DREAM-powered taste engine: "Based on what you've listened to and engaged with, you might love this artist"
- Top community picks → "Best of the Year" exhibition (physical + digital)

### Long-Term Expansion

- NOIZY Artist Residencies
- Physical gallery exhibitions (Toronto, Vancouver, Montréal to start)
- The gallery becomes the largest discovery platform for new Canadian artists — not by algorithm, but by taste and trust

### The Bigger Vision

The gallery is the proof that NOIZYVOX extends beyond voice. Every featured artist can opt into NOIZYVOX provenance protection. Art, music, literature, culinary, engineering, design — the full creative class. The gallery is the door.
