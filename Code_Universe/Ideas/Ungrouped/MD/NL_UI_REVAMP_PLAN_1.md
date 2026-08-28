**NOIZYLAB UI/UX Revamp Plan**

**Goals**
- **Clarity:** Reduce cognitive load with clear hierarchy and copy.
- **Speed:** Target <100ms input latency, LCP <2.5s, CLS ~0.
- **Consistency:** Component-driven design system with tokens and variants.
- **Accessibility:** AA contrast minimum; keyboard + screen reader support.
- **Brand:** Bold, modern, technical elegance; motion used sparingly.

**User Segments**
- **Builders:** Need fast navigation, powerful search, clear status.
- **Operators:** Need dashboards, alerts, logs, health checks.
- **Leaders:** Need summaries, metrics, outcomes, next actions.

**Information Architecture**
- **Global nav:** Home, Docs, Dashboard, Pipelines, Assets, Settings.
- **Secondary:** Search, Notifications, Profile/Workspace switcher.
- **Footer:** Status, version, links, legal.

**Design System (Tokens)**
- **Color:** Neutral base, primary accent, success/warn/error; AA contrast.
- **Type:** Inter/JetBrains Mono; size scale 12–20px body, 24–40px headings.
- **Spacing:** 4/8 baseline grid; container widths 640/960/1200.
- **Elevation:** Shadow scale for focus; subtle borders for separation.
- **States:** Hover, focus-visible, pressed, loading, disabled.

**Components**
- **Core:** Button, Input, Select, Toggle, Tooltip, Modal, Toast.
- **Data:** Table, List, Card, Tabs, Pagination, Empty states.
- **Navigation:** Sidebar, Topbar, Breadcrumbs, Command Palette.
- **Feedback:** Progress, Skeleton, Status badges.

**Artwork Direction**
- **Illustrations:** Minimal geometric forms, line art; avoid noise.
- **Icons:** 2px stroke, rounded joins, consistent grid.
- **Images:** High-contrast, technical texture; avoid stock clichés.
- **Motion:** 150–250ms; ease-in-out; reduce motion preference respected.

**Pages to Revamp**
- **Home:** Value proposition, quick actions, recent activity.
- **Docs:** Left nav, content TOC, code blocks, search.
- **Dashboard:** Health, throughput, MTU status, deploy state, alerts.
- **Pipelines:** Graph view, stages detail, logs with filters.
- **Assets:** Artwork manager, icon sets, upload flow.

**Wireframe Checklist**
- Define primary call-to-action per page.
- Establish topbar + sidebar layouts.
- Add empty/loading/error states.
- Map mobile, tablet, desktop breakpoints.

**Implementation Plan**
- **Phase 1:** Audit + tokens + base components.
- **Phase 2:** Navigation + layout + Home/Docs.
- **Phase 3:** Dashboard + Pipelines + Assets.
- **Phase 4:** Artwork import + motion polish + accessibility sweeps.

**Performance Targets**
- LCP < 2.5s, FID < 100ms, TBT < 200ms.
- Preload critical fonts; lazy-load non-critical assets.
- Optimize images (AVIF/WebP), responsive sizes.

**Asset Needs**
- Logo variants (dark/light), icon set (SVG), illustration pack.
- Screenshots or diagrams for docs and dashboard.

**Next Steps**
- Confirm branding constraints and preferred palette.
- Choose implementation stack (Next.js/React or current framework).
- Start with token file and base components in repo.