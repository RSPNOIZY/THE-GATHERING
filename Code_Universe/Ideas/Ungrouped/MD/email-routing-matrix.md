# Cloudflare Email Routing Matrix

Order is fixed: `noizy.ai` -> `noizylab.ca` -> secondary domains.

## Global guardrails

- Destination addresses must be **verified** before route assignment.
- Do not route aliases to `rsp@noizy.ai` unless it is a real, verified mailbox.
- Enable catch-all first, then add only required aliases.

---

## 1) noizy.ai

### Destinations

- [ ] `rspnoizy@gmail.com` (verify first)
- [ ] `rsp@noizy.ai` (verify only if real mailbox exists)

### Catch-all

- [ ] `*@noizy.ai` -> `rspnoizy@gmail.com`

### Primary aliases

- [ ] `admin@noizy.ai` -> verified destination
- [ ] `support@noizy.ai` -> verified destination
- [ ] `gabriel@noizy.ai` -> verified destination
- [ ] `vox@noizy.ai` -> verified destination
- [ ] `team@noizy.ai` -> verified destination

---

## 2) noizylab.ca (migrate from ImprovMX)

### Before cutover

- [ ] Verify destination addresses in Cloudflare
- [ ] Build equivalent routing rules in Cloudflare (disabled/ready state if needed)
- [ ] Validate each alias target destination is verified

### Cutover

- [ ] Enable catch-all in Cloudflare
- [ ] Enable required custom aliases
- [ ] Decommission ImprovMX routing
- [ ] Recreate Daily Council aliases

### Rollback readiness

- [ ] Keep previous records documented for immediate rollback window

---

## 3) Secondary domains

Domains:

- `fishmusicinc.com`
- `noizyfish.com`
- `noizyvox.com`
- `noizykidz.com`

Per domain:

- [ ] Verify at least one destination
- [ ] Enable catch-all
- [ ] Add only currently needed aliases

---

## Post-routing next (mail auth planning)

For each active sending domain, queue SPF/DKIM/DMARC planning and validation as the next phase.
