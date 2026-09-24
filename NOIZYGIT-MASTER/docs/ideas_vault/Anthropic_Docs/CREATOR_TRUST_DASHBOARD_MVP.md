# Creator Trust Dashboard MVP

## Purpose

Provide creators with **calm, factual visibility** into NOIZY's trust system without exposing internals or causing alarm.

The dashboard answers:

- *Is the system healthy?*
- *Is my work affected?*
- *Why did something change?*

---

## MVP Sections

### Section 1: System Status

| Status | Display |
|--------|---------|
| Normal | ✅ Operating normally |
| Pause | ⚠️ Preventive pause |
| Disruption | 🔴 Temporary disruption |

**Plain language only.** No technical jargon.

---

### Section 2: Trust Signals (Read-Only)

| Signal | Status |
|--------|--------|
| Consent enforcement | ✅ Active |
| Provenance tracking | ✅ Active |
| GORUNFREE phase | Stable |
| Recent freezes | None / Shown |

---

### Section 3: Provenance Changes (Last 30 Days)

List of notable changes:

- Constraint changes
- Explanation updates
- Archive inclusions/exclusions

**Example:**

> April 6 — One source excluded due to updated consent terms.

---

### Section 4: Creative Gaps (Optional MVP Toggle)

Show:

- Emerging gaps detected
- Whether gaps are being filled or explored

**No pressure to act.** Information only.

---

### Section 5: What This Means for You

Short explainer panel:

> "When something pauses or changes, it's because the system protects long-term trust."

---

## Explicit MVP Exclusions

| Excluded | Reason |
|----------|--------|
| Live metrics | Too volatile, causes anxiety |
| Internal incident IDs | Not meaningful to creators |
| Vendor-specific references | Implementation detail |
| Error jargon | Confusing |

---

## Design Tone

- Boring
- Reassuring
- Factual
- Non-defensive

Trust grows when nothing feels hidden or dramatic.

---

## Data Sources

| Section | Source |
|---------|--------|
| System Status | KV `FEATURE_FLAGS` |
| Trust Signals | KV + D1 counts |
| Provenance Changes | D1 `audit_events` |
| Creative Gaps | D1 `gaps` (filtered) |

---

## API Endpoint

```
GET /trust/status
```

Public endpoint (no auth required).

Returns:

```json
{
  "status": "normal",
  "signals": {
    "consent_enforcement": "active",
    "provenance_tracking": "active",
    "gorunfree_phase": "stable",
    "recent_freezes": 0
  },
  "recent_changes": [
    {
      "date": "2026-04-06",
      "summary": "One source excluded due to updated consent",
      "impact": "No action required"
    }
  ],
  "updated_at": "2026-04-07T11:30:00Z"
}
```

---

## HTML Template (MVP)

```html
<div class="trust-dashboard">
  <header>
    <h1>NOIZY System Trust</h1>
    <div class="status status-normal">✅ Operating Normally</div>
    <div class="updated">Last updated: 2 minutes ago</div>
  </header>

  <section class="signals">
    <h2>Trust Signals</h2>
    <ul>
      <li>Consent Enforcement: <span class="active">✅ Active</span></li>
      <li>Provenance Tracking: <span class="active">✅ Active</span></li>
      <li>GORUNFREE Mode: <span class="stable">Stable</span></li>
      <li>Recent Pauses: <span class="none">None</span></li>
    </ul>
  </section>

  <section class="changes">
    <h2>Recent Changes (30 days)</h2>
    <ul class="change-list">
      <!-- Populated dynamically -->
    </ul>
  </section>

  <section class="explainer">
    <h2>What this means for you</h2>
    <p>When NOIZY pauses or changes behavior, it's to protect long-term creative trust. You don't need to take action unless we say so.</p>
  </section>

  <footer>
    <a href="/trust/how-we-write-truth">How We Handle Failures</a>
  </footer>
</div>
```

---

## Refresh Behavior

- Auto-refresh every 60 seconds
- Manual refresh button available
- No real-time streaming (reduces anxiety)

---

## Access

- **Public**: Anyone can view
- **No login required**
- **Read-only**: No actions from this dashboard

---

## Final Principle

> **Creators should feel informed, not overwhelmed.
> The dashboard succeeds when it's boring.**
