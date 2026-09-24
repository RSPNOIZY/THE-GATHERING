# Wireframes: Trust Dashboard & Operator Approval UX

## Overview

Two separate surfaces for two audiences:

| Surface | Audience | Role |
|---------|----------|------|
| Creator Trust Dashboard | Creators | Confidence, calm |
| Operator Approval UX | Staff | Intent, accountability |

Creators see **outcomes**.
Operators see **levers**.
Neither sees the other's controls.

---

# PART 1: Creator Trust Dashboard — MVP Wireframes

The dashboard answers one question calmly:

> "Is the system operating safely, and does anything here affect my work?"

It is **read-only**, **non-alarming**, and **fact-based**.

---

## WIREFRAME 1 — Trust Overview (Landing)

```
┌─────────────────────────────────────────────────┐
│ NOIZY System Trust                              │
│ Status: ✅ Operating Normally                   │
│ Last updated: 2 minutes ago                     │
└─────────────────────────────────────────────────┘

┌─────────────────────┬───────────────────────────┐
│ Consent Enforcement │ ✅ Active                  │
│ Provenance Tracking │ ✅ Active                  │
│ GORUNFREE Mode      │ ✅ Stable                  │
│ Recent Pauses       │ None                      │
└─────────────────────┴───────────────────────────┘

[ View Details ]   [ How We Handle Failures ]
```

### Design Notes

- **No graphs** here. Just states.
- Green is default, yellow means pause, red is rare and deliberate.
- Time-based freshness reduces anxiety.

---

## WIREFRAME 2 — Recent Changes (What Changed, Not Why Panic)

```
┌─────────────────────────────────────────────────┐
│ Recent System Changes (30 days)                 │
└─────────────────────────────────────────────────┘

• Apr 6 — One archive excluded due to updated consent
  Impact: No action required

• Apr 1 — New gap category detected for blues vocals
  Impact: Improved search suggestions

• Mar 28 — Provenance explanation expanded
  Impact: More detailed "Why this worked" views
```

### Design Notes

- Past tense only.
- Always include **impact** line.
- No internal identifiers.

---

## WIREFRAME 3 — Provenance History (Per Output / Per Query)

```
┌─────────────────────────────────────────────────┐
│ Provenance History                              │
│ Output: "grit9 140bpm Am drop"                  │
└─────────────────────────────────────────────────┘

Apr 6 — Consent constraints updated
Effect: One source excluded

Mar 30 — New licensed archive included
Effect: Match accuracy improved

Mar 22 — Provenance model updated
Effect: Clearer explanations available
```

### Design Notes

- This reinforces **trust over time**
- No raw sources or datasets exposed

---

## WIREFRAME 4 — What This Means For You (Always Visible)

```
┌─────────────────────────────────────────────────┐
│ What this means for you                         │
└─────────────────────────────────────────────────┘

When NOIZY pauses or changes behavior, it's
to protect long-term creative trust.

You don't need to take action unless we say so.
```

This copy matters. It anchors perception.

---

# PART 2: Operator Approval UX — Manual Action Surface

This is **not** for creators.
This is for **operators with responsibility**.

The rule here is **ceremony without friction**.

---

## WIREFRAME A — Operator Control Panel

```
┌─────────────────────────────────────────────────┐
│ EDGE CORE — Operator Actions                    │
│ Logged in as: rsp@noizy.ai                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Pending Conditions                              │
└─────────────────────────────────────────────────┘

• Promotion paused: Stability window reset
  → Awaiting metrics recovery

• KV→D1 promotion backlog: 3 items
  → Auto-promoting when eligible
```

No buttons unless something requires intent.

---

## WIREFRAME B — Manual Override / Approval (Rare Path)

Example: **Approve a freeze lift** or **authorize migration**

```
┌─────────────────────────────────────────────────┐
│ Manual Approval Required                        │
│ Action: Lift Promotion Freeze                   │
└─────────────────────────────────────────────────┘

Reason for freeze:
• Latency threshold exceeded (resolved)
• Stability window reset at 12:41 PM

Current signals:
✅ Metrics stable for 21 minutes
✅ Error budget healthy
✅ Consent integrity intact

[ Explanation (required) ]
[ ______________________ ]

[ Approve ]   [ Cancel ]
```

### Required Behavior

- Text explanation **mandatory**
- Approval logged to `audit_events`
- Action generates a visible event in ops + internal logs

---

## WIREFRAME C — Migration Authorization (DRM Token UI)

```
┌─────────────────────────────────────────────────┐
│ Authorize Zone Migration                        │
│ Domain: noizy.ai                                │
└─────────────────────────────────────────────────┘

Preconditions:
✅ FEATURE_FLAGS ready
✅ Worker deployed
✅ Route verified
✅ DNS exported
✅ Certificate plan ready
✅ DNSSEC plan acknowledged

This action issues a one-time token.
It expires in 15 minutes.

[ Issue Migration Token ]
```

After click:

```
Token: ********-****-****-****
Expires: 1:23 PM

[ Copy Token ]
```

No token reuse. No silent retries.

---

# OPERATOR UX RULES (NON-NEGOTIABLE)

| Rule | Description |
|------|-------------|
| ❌ No one-click irreversible actions | Every destructive action requires confirmation |
| ❌ No background approvals | All approvals must be explicit user actions |
| ✅ Every approval requires context | Explanation field is mandatory |
| ✅ Every approval writes an audit record | No silent operations |
| ✅ Tokens expire by default | Time-bounded authorization |

---

# COMPONENT SPECS (for implementation)

## Status Badge Component

```jsx
<StatusBadge status="normal" />
// Renders: ✅ Operating Normally

// Status values: "normal", "pause", "disruption"
// Colors: green, amber, red
```

## Signal List Component

```jsx
<SignalList signals={[
  { name: "Consent Enforcement", status: "active" },
  { name: "Provenance Tracking", status: "active" },
  { name: "GORUNFREE Mode", status: "stable" },
  { name: "Recent Pauses", status: "none" }
]} />
```

## Change List Component

```jsx
<ChangeList changes={[
  {
    date: "2026-04-06",
    summary: "One archive excluded due to updated consent",
    impact: "No action required"
  }
]} />
```

## Approval Form Component

```jsx
<ApprovalForm
  action="Lift Promotion Freeze"
  onApprove={handleApprove}
  onCancel={handleCancel}
  requireExplanation={true}
  signals={currentSignals}
/>
```

## Token Issue Component

```jsx
<TokenIssue
  domain="noizy.ai"
  preconditions={preconditionStatus}
  expiresInMinutes={15}
  onIssue={handleIssueToken}
/>
```

---

# AUDIT EVENT SCHEMAS

## Approval Event

```json
{
  "event_id": "apr-2026040711234567",
  "event_type": "OPERATOR_APPROVAL",
  "actor": "rsp@noizy.ai",
  "action": "lift_promotion_freeze",
  "explanation": "Latency resolved, metrics stable for 21 minutes",
  "signals_at_approval": {
    "metrics_stable": true,
    "error_budget_healthy": true,
    "consent_integrity": true
  },
  "created_at": "2026-04-07T11:23:45Z"
}
```

## Token Issue Event

```json
{
  "event_id": "tok-2026040711234567",
  "event_type": "MIGRATION_TOKEN_ISSUED",
  "actor": "rsp@noizy.ai",
  "domain": "noizy.ai",
  "token_hash": "sha256:abcd1234...",
  "expires_at": "2026-04-07T11:38:45Z",
  "preconditions_met": ["FEATURE_FLAGS", "WORKER", "ROUTE", "DNS", "CERT", "DNSSEC"],
  "created_at": "2026-04-07T11:23:45Z"
}
```

---

# FINAL DESIGN PRINCIPLE (HARD RULE)

> **If a creator asks "can I trust this?" the dashboard answers it.
> If an operator asks "can I do this?" the UI slows them down just enough.**

That's the balance.
