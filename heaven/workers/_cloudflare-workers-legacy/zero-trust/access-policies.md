# NOIZY EMPIRE — Zero Trust Access Policies
## Cloudflare Access Application Configuration

---

## Identity Provider

**Primary:** Google OAuth (rspplowman@gmail.com)
**Secondary:** Apple ID (rsplowman@icloud.com)  
**Backup:** One-time PIN via email

---

## Master Policy: RSP_001 Only

All applications share this base policy:

```
Policy Name: RSP_001 Creator Access
Decision: ALLOW
Include:
  - Email: rspplowman@gmail.com
  - Email: rsplowman@icloud.com
  - Email: rsp@noizy.ai
Require:
  - Valid identity session
```

---

## Applications (12 Zero Trust Apps)

### Tier 1: Creative Production (Always On)

| # | App Name | Domain | Service | Priority |
|---|----------|--------|---------|----------|
| 1 | **DreamChamber** | dreamchamber.noizy.ai | localhost:7777 | P0 — Creative cockpit |
| 2 | **Voice Bridge** | voice.noizy.ai | localhost:8080 | P0 — Voice command relay |
| 3 | **Open WebUI (Ollama)** | ollama.noizy.ai | localhost:3080 | P0 — AI model interface |

### Tier 2: AI Infrastructure

| # | App Name | Domain | Service | Priority |
|---|----------|--------|---------|----------|
| 4 | **n8n Workflows** | n8n.noizy.ai | localhost:5678 | P1 — Automation engine |
| 5 | **Grafana** | grafana.noizy.ai | localhost:3000 | P1 — Monitoring |
| 6 | **Neo4j** | graph.noizy.ai | localhost:7474 | P1 — Knowledge graph |
| 7 | **Qdrant** | vectors.noizy.ai | localhost:6333 | P1 — Vector search |
| 8 | **RabbitMQ** | mq.noizy.ai | localhost:15672 | P2 — Message queue |

### Tier 3: Development

| # | App Name | Domain | Service | Priority |
|---|----------|--------|---------|----------|
| 9 | **HEAVEN Dev** | heaven-dev.noizy.ai | localhost:8787 | P1 — Local API dev |
| 10 | **Kubernetes** | k8s.noizy.ai | localhost:54335 | P2 — Container orchestration |
| 11 | **SSH Terminal** | ssh.noizy.ai | localhost:22 | P1 — Browser SSH |

### Tier 4: External (Already Live)

| # | App Name | Domain | Service | Priority |
|---|----------|--------|---------|----------|
| 12 | **HEAVEN Production** | heaven.rsp-5f3.workers.dev | Cloudflare Edge | P0 — LIVE |
| 13 | **noizy.ai Landing** | noizy-landing.rsp-5f3.workers.dev | Cloudflare Edge | P0 — LIVE |

---

## Session Configuration

```
Session Duration: 24 hours (creative sessions can be long)
WARP Required: No (browser access must work from any device)
Device Posture: Not required (accessibility devices vary)
Bypass for Webhooks: voice.noizy.ai/webhook/* (Power Automate relay)
```

---

## WARP Client Configuration

For persistent access from iPhone, iPad, or secondary Mac:

```
Organization: noizy
Auth Domain: noizy.cloudflareaccess.com
Split Tunnel: Include only GOD.local network (10.0.0.0/8)
DNS: Cloudflare Gateway (malware + phishing blocking)
```

---

## Accessibility-Specific Notes

- DreamChamber must be accessible via Voice Control commands
- All web UIs must work with VoiceOver screen reader
- Session timeouts set to 24 hours to avoid re-auth during creative flow
- No device posture requirements — accessibility hardware varies
- Webhook bypass on voice.noizy.ai for Siri/phone command relay
- Large touch targets recommended for all dashboards
