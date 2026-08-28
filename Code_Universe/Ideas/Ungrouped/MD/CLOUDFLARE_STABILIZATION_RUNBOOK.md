# Cloudflare Stabilization Runbook (Zero Trust + Domains + Email)

Status scope: **Cloudflare only**. Google steps are intentionally excluded until this runbook is fully green.

## 0) Hard blockers and current machine state

- `cloudflared` is installed (`2026.3.0`).
- Cloudflare origin certificate is **not** present at `~/.cloudflared/cert.pem`.
- Tunnel/API operations from this machine remain blocked until origin certificate is installed.

## 1) Execution order (locked)

1. Cloudflare account security
2. Zero Trust Access apps (Heaven, GABRIEL)
3. WARP + posture on GOD
4. Origin JWT validation
5. Email Routing on `noizy.ai`
6. `noizylab.ca` migration (off ImprovMX)
7. Secondary domains
8. mTLS on sensitive routes
9. Final communications matrix
10. Then (and only then) Google

## 2) Account security preflight

- Verify account email in Cloudflare account profile.
- Enable MFA for account owner/admins.
- Confirm least-privilege roles for operators.

## 3) Zero Trust perimeter (GOD)

### 3.1 Keep both hostnames behind Tunnel

- `heaven.noizy.ai`
- `gabriel.dreamchamber.noizy.ai`

Both should be proxied only through Cloudflare Tunnel.

### 3.2 Create Access self-hosted apps

Create two Access applications under Zero Trust → Access → Applications:

- `Heaven Codemaster` (self-hosted)
  - Domain: `heaven.noizy.ai`
- `GABRIEL Codemaster` (self-hosted)
  - Domain: `gabriel.dreamchamber.noizy.ai`

### 3.3 Session durations (intentional)

Set explicit session durations (no defaults):

- Admin/mutation surfaces: `8h`
- Standard read/control surfaces: `24h`

### 3.4 Policies (required include chain)

Include:

1. Identity: `rsp@noizy.ai` (or approved admin group)
2. WARP connected
3. Device posture healthy for GOD

Block:

- Non-WARP traffic
- Failed posture

### 3.5 WARP + posture checks

Install and enroll Cloudflare One Client (WARP) on GOD.
Create posture rules:

- WARP connected = true
- Device healthy = true
- Optional Application Check = required process running (for codemaster/local service)

## 4) Tunnel-side and origin-side JWT enforcement

### 4.1 Tunnel ingress requirements

In tunnel config, require Access JWT validation for sensitive hostnames (see `cloudflared-config.template.yml`).

### 4.2 Origin-side JWT validation

Origin must validate `Cf-Access-Jwt-Assertion` for each protected route before proxying to business logic.

Minimum checks:

- Signature valid against Cloudflare Access JWKS
- `aud` matches expected Access app audience
- `iss`, `exp`, `nbf` valid
- Email or identity claim authorized

## 5) Email Routing foundation (all domains)

For each domain in this exact path:

Cloudflare Dashboard → Email → Email Routing → Routes

Flow:

1. Add destination address
2. Verify destination (must be Verified before route use)
3. Enable catch-all rule
4. Add only required custom addresses

## 6) Domain-by-domain sequence

### 6.1 `noizy.ai` (first, sovereign)

Destination verification:

- Verify `rspnoizy@gmail.com` (required now)
- Verify `rsp@noizy.ai` **only if** it lands in a real mailbox already

Rules:

- Catch-all -> `rspnoizy@gmail.com`
- Create: `admin@`, `support@`, `gabriel@`, `vox@`, `team@`
- Point aliases only to verified destination addresses

Hard rule:

- Do **not** point aliases to `rsp@noizy.ai` until it is verified and real.

### 6.2 `noizylab.ca` (second, council ops)

- Keep ImprovMX active until all Cloudflare destinations and rules are verified.
- Cut over only after acceptance checks pass.
- Recreate Daily Council aliases after cutover.

### 6.3 Secondary domains (third)

- `fishmusicinc.com`
- `noizyfish.com`
- `noizyvox.com`
- `noizykidz.com`

For each:

1. Catch-all first
2. Add only currently required aliases

## 7) mTLS hardening (after Access is stable)

Apply mTLS only on highest-risk routes:

- Admin mutations
- Export endpoints
- Verification/attestation surfaces

Keep general app routes on identity + WARP + posture.

## 8) Definition of done (single source)

All must be true:

- Both Access apps live (`heaven`, `gabriel`)
- Origin JWT validation active and tested
- `rspnoizy@gmail.com` verified destination
- `noizy.ai` catch-all active
- Primary aliases created
- `noizylab.ca` migration completed
- Active sending domains have mail-auth record plan queued (SPF/DKIM/DMARC next)

## 9) Operator acceptance checklist

- [ ] Cloudflare account email verified
- [ ] MFA enabled
- [ ] Access app: Heaven live
- [ ] Access app: GABRIEL live
- [ ] Explicit session duration set on both
- [ ] WARP enrolled on GOD
- [ ] Posture checks enforced
- [ ] Tunnel requires Access JWT on protected hostnames
- [ ] Origin validates `Cf-Access-Jwt-Assertion`
- [ ] `rspnoizy@gmail.com` verified
- [ ] `noizy.ai` catch-all on
- [ ] `noizy.ai` aliases live
- [ ] `noizylab.ca` migrated off ImprovMX
- [ ] Secondary domain catch-alls configured
- [ ] mTLS on high-risk routes

## 10) Manual button presses required

1. Complete Cloudflare Tunnel login in browser and download origin cert.
2. Place cert at: `~/.cloudflared/cert.pem`.
3. In Zero Trust dashboard, create the two self-hosted Access apps.
4. Set session durations and policy includes/excludes.
5. Enroll WARP on GOD and assign posture policy.
6. In Email Routing for each domain, verify destinations and enable routes.

Once cert is installed, CLI-driven tunnel/app verification can proceed from this machine.
