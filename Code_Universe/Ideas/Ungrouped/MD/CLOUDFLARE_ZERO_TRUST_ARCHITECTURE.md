# NOIZY Cloudflare Zero Trust Architecture

> **Author:** RSP_001 (delivered 2026-04-09)
> **Captured by Gabriel:** 2026-04-09T16:32 · T-8 to April 17
> **Status:** Canonical · locked in
> **Companions:** `RECEIPT_SPINE.md` (the inner truth) · `CREATOR_OS_MASTER.md` (5-layer architecture)
> **Position:** Layer 2 (NOIZY Runtime) — outer trust shell around Layer 3 (Identity + Agentic) and Layer 4 (Sovereignty + Time)

## 1. Design law

Cloudflare is the **outer trust shell**. It protects access to NOIZY services but **must not become** the canonical source of consent, receipts, or lineage. The Receipt Spine remains local-first and authoritative; Cloudflare Tunnel and Zero Trust protect *who can reach* the services that expose, inspect, or export that truth.

> **NOIZY law:**
> Recognition precedes automation.
> Visibility precedes power.
> Revocation precedes regret.
> Receipts precede trust.
>
> Cloudflare enforces the membrane around those laws; it does not replace them.

## 2. Three rings

### Inner ring — sovereign local truth
- Receipt Spine
- HVS AUv3
- Consent state machine
- Aquarium timeline / revoke simulator
- local SQLite + JSON receipt files
- local Logic / GOD / MICKY-P workflows

### Middle ring — NOIZY service plane
- Heaven worker
- receipt export service
- union/audit bundle service
- dashboard runtime
- GORUNFREE command broker
- n8n automations
- D1 / KV / R2-backed service APIs

### Outer ring — Cloudflare Zero Trust perimeter
- Cloudflare Tunnel (outbound-only via cloudflared)
- Access applications
- service tokens
- mTLS for high-risk surfaces
- DNS / hostname routing
- private network routing where needed
- audit + access logs

## 3. Core hostnames

| Hostname | Role | Behind |
|---|---|---|
| `heaven.noizy.ai` | Main protected control plane / Heaven worker UI or API edge | Tunnel + Access |
| `api.noizy.ai` | Protected app/API entry point | Tunnel + Access |
| `audit.noizy.ai` | Receipt-bundle inspection + union-grade verification | Tunnel + Access + mTLS |
| `vault.noizy.ai` | Protected archive / export surface | Tunnel + Access + mTLS |
| `ops.noizy.ai` | Operator dashboard | Tunnel + Access |
| `n8n.noizy.ai` | Automation plane — never public-open | Tunnel + Access (operator-only) |

## 4. Policy classes

### Human operator policy
Access identity policies for Rob and trusted operators. Default protection layer for dashboards and admin UIs.

### Service-to-service policy
Access service tokens for n8n, internal automation, machine clients. Per-service tokens with explicit naming, expiration, refresh, and revocation.

### High-assurance admin policy
mTLS on top of Access for the most sensitive surfaces: admin APIs, vault export, receipt-bundle verification.

## 5. Required services behind the perimeter (day one)

- Heaven local port on GOD (`localhost:9696`)
- receipt export service
- union verification bundle download
- internal dashboard / ops cockpit
- n8n admin
- private APIs that mutate state or invoke remote actions
- future GABRIEL Swarm endpoints
- any D1-backed administrative UI

## 6. Deployment pattern

### GOD node
Run `cloudflared` on GOD and publish:
- `heaven.noizy.ai → http://localhost:9696`
- `api.noizy.ai → local API service`
- `audit.noizy.ai → local verifier/export service`

### MICKY-P and other nodes
**Do not expose them directly first.** Reach them through:
- private network routing
- GOD-mediated service calls
- future WARP / private connectivity

## 7. Origin trust order

Protected origins must verify Access JWTs or service-token-backed requests at the **origin** — Heaven and related NOIZY services do **not** trust mere network reachability:

1. Access JWT or valid service token
2. Optional mTLS for sensitive routes
3. Local authorization against NOIZY role policy
4. **Receipt Spine precondition** for any mutation

## 8. Receipt Spine integration rule

Every remote action that could:
- mutate consent state
- trigger a vault commit
- export a union bundle
- reroute a royalty path
- invoke GORUNFREE on real assets

…must satisfy this chain:

1. Local receipt already exists or is **atomically created first**
2. Origin verifies Access / service-token / mTLS identity
3. App policy checks authorization
4. Action executes
5. Resulting action **emits a new receipt**

> Cloudflare authenticates and transports; the Receipt Spine proves the event happened in the NOIZY system of record.

## 9. Initial service token inventory

| Token name | Scope |
|---|---|
| `n8n-heaven-prod` | n8n → Heaven worker calls |
| `gabriel-swarm-runtime` | GABRIEL Swarm Panel → protected APIs |
| `union-bundle-exporter` | Vault export service |
| `ops-dashboard-backend` | Ops dashboard backend |
| `receipt-sync-worker` | Cross-node receipt mirroring |

Each token: unique per service or workflow · descriptive name · explicit expiration · scheduled rotation · immediate revocation on retirement or compromise.

## 10. mTLS scope

Apply mTLS to:
- `audit.noizy.ai`
- `vault.noizy.ai`
- admin-only routes under `api.noizy.ai`
- any endpoint that can export or mutate sensitive creator-state artifacts

**Caveat:** Cloudflare Workers presenting client certs to proxied Cloudflare zones returns a 520 error — keep that in mind when stacking Workers-origin calls and client-cert presentation.

## 11. SSL/TLS posture

Use **Full (strict)** where possible. Do not leave sensitive NOIZY services on weak origin-mode assumptions once the first iteration is working.

## 12. Logging + audit correlation

Cloudflare gives perimeter visibility; NOIZY correlates those logs to local receipts.

| Field | Source |
|---|---|
| Access subject / service token identity | Cloudflare |
| Hostname | Cloudflare |
| Request timestamp | Cloudflare |
| **NOIZY receipt ID** | Receipt Spine |
| **NOIZY object/session ID** | Receipt Spine |
| Outcome | App layer |

> Cloudflare log = who reached the membrane.
> Receipt Spine = what actually happened inside.

## 13. Phased build order

### Phase 1 — first tunnel
- Install + authenticate `cloudflared` on GOD
- Create named tunnel
- Publish `heaven.noizy.ai → localhost:9696`
- Create Access app for `heaven.noizy.ai`
- Allow Rob/operator identity
- Add service-token policy for n8n
- Require app-layer verification of Access JWT / service auth

### Phase 2 — high-assurance surfaces
- Protect `audit.noizy.ai` and `vault.noizy.ai`
- Add mTLS for high-assurance routes
- Create scoped service tokens for each automation
- Link Cloudflare access events to receipt IDs in NOIZY logs

### Phase 3 — deeper integration
- Add private-network connectivity for deeper node access
- Add GABRIEL Swarm protected APIs
- Add union-bundle verifier surface
- Harden with additional route segmentation and device trust

## 14. Non-negotiable rules

1. **No admin service is directly exposed to the public Internet.**
2. **No machine client uses shared passwords.**
3. **No high-risk endpoint ships without Access.**
4. **No critical export/mutate path bypasses the Receipt Spine.**
5. **No simulation action can cross into real execution without explicit app-layer checks.**
6. **No Cloudflare auth success is treated as provenance; it is only perimeter trust.**

## 15. Canonical statement

> NOIZY uses Cloudflare Tunnel and Zero Trust as the secure outer membrane around Heaven, APIs, dashboards, audit surfaces, and automation endpoints. Cloudflare provides outbound-only origin connectivity, identity-aware access control, service authentication, and optional mTLS. The canonical source of consent, lineage, and action truth remains the local Receipt Spine. Remote access is permitted only through Zero Trust; real state changes are permitted only when app authorization and receipt rules also pass.

## 16. Immediate build checklist

- [ ] Install and authenticate `cloudflared` on GOD
- [ ] Create named tunnel
- [ ] Add hostname route for `heaven.noizy.ai`
- [ ] Protect with Access
- [ ] Create service token for n8n
- [ ] Enforce origin JWT/service-token validation
- [ ] Add receipt-id correlation to app logs
- [ ] Document route, policy, token, and rollback steps
