# Actor-Facing Approval UI Flow

## Goal
Give actors a clear, fast control loop to approve, reject, and audit AVA readiness before public or collaborative usage.

## Primary User
- Actor (owner of one or more AVAs).

## Core Screens

### 1. Approval Inbox
- Shows candidate AVAs needing a decision.
- Card fields:
  - `display_name`
  - `persona_id`
  - `status`
  - languages
  - last review event
  - risk badges (policy, consent, collaboration)
- API:
  - `GET /actor/{owner_id}/approval/queue?status=candidate`

### 2. AVA Detail + Evidence
- Panels:
  - Voice preview (safe sample)
  - Traits + language profile
  - Policy summary (never clauses)
  - Collaboration readiness
  - Consent key status
- Action bar:
  - `Approve`
  - `Reject`
  - `Request Changes`

### 3. Decision Modal
- Required fields:
  - Decision (`approve` or `reject`)
  - Reason text
- Confirmation copy:
  - Approval: "This AVA can now interact under policy constraints."
  - Rejection: "This AVA remains blocked until revised and re-reviewed."
- API:
  - `POST /actor/{owner_id}/approval/{persona_id}`

### 4. Decision Receipt
- Shows immutable decision record:
  - timestamp
  - actor id
  - persona id
  - decision
  - reason
- CTA:
  - "Open AVA Dashboard"
  - "Review Next Candidate"

## State Model
- `candidate`: awaiting owner decision.
- `approved`: available for interaction and collaboration checks.
- `rejected`: blocked from interaction; requires updates then re-review.

## Suggested UX Rules
- Keep one-click return to inbox after decision.
- Always show policy and consent state above action buttons.
- On reject, suggest exact fields to fix (voice quality, consent mismatch, restricted-topic risk).
- On approve, show the next required governance checkpoint.

## Event Instrumentation
- `approval_inbox_viewed`
- `approval_detail_viewed`
- `approval_decision_submitted`
- `approval_decision_confirmed`
- `approval_decision_failed`

## Hand-off to Backend
- Queue reads from persona store filtered by `owner_id` + `status`.
- Decision endpoint writes review event and updates status.
- All decisions are mirrored to immutable audit events.
