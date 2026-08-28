# 05_PERIMETER.md
# DreamChamber Imperial Charter — The Perimeter

The perimeter protects GOD without exposing GOD.

---

## Architecture

**Cloudflare Tunnel** — outbound-only connector from GOD to Cloudflare edge.
No public IP required. No inbound ports opened.
GOD initiates the tunnel. The internet does not reach GOD directly.

**Cloudflare Access** — human and service authentication policy enforcement.
Controls who and what may reach protected applications behind the tunnel.

---

## Core principle

> Cloudflare authenticates access; the Receipt Spine authorizes truth.

These are distinct layers. Authentication is the membrane.
Authorization of creative action lives in the Receipt Spine only.
Never conflate them.

---

## Ingress authority

GOD is the single ingress authority.
MICKY-P is never the perimeter.
No satellite node is ever exposed publicly.

---

## Current configuration

- Cloudflare account: 2446d788cc4280f5ea22a9948410c355
- Canonical hostname: noizy.ai
- DNS: A records → 172.67.177.214 + 104.21.91.188
- NS: alex.ns.cloudflare.com + melinda.ns.cloudflare.com
- MX: active
- HEAVEN Worker: built (1,427 lines TypeScript) — deployment is P0 blocker

---

## What is exposed

Only what is explicitly configured. Default posture: deny.
Service exposure is opt-in, never opt-out.

---

## Legal holds on perimeter-adjacent topics

Three items under legal hold (Casey Chisick, Cassels Brock & Blackwell, Toronto):
1. Community token mechanics
2. DAO governance
3. Cross-border royalty flows

These are not to be architected into the perimeter layer without legal clearance.
