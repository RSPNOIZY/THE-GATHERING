# NOIZYANTHROPIC — INFRASTRUCTURE REGISTRY
### Account: Fishmusicinc | Cloudflare Account ID: 2446d788cc4280f5ea22a9948410c355
### Generated: 2026-03-19

---

## CLOUDFLARE — THE EDGE

### Worker (1)
| Name | Created | Status |
|------|---------|--------|
| `deploy` | 2025-12-02 | Production |

### KV Namespaces (20+) — THIS IS YOUR NERVOUS SYSTEM

#### GABRIEL (Voice Engine)
| Namespace | ID | Purpose |
|-----------|----|---------|
| `GABRIEL_VOICE` | 28f2fdce465243759e7f5df6468c8228 | Voice data storage |
| `GABRIEL_KV` | 68710a32a1814ce7994a5be532f871cc | Gabriel key-value store |

#### NOIZYVOX (Voice Platform)
| Namespace | ID | Purpose |
|-----------|----|---------|
| `noizyvox-signups` | 392c1bf429114148999824a9f9e15169 | User signup data |
| `noizyvox-royalties` | 4cf36e4bd1fd44fe802096925413f694 | Royalty tracking |
| `CRAWLER_KV` | 355f0d9bb3bf46abb1ac49881e6829df | Crawler/provenance data |

#### NOIZYLAB (Core Platform)
| Namespace | ID | Purpose |
|-----------|----|---------|
| `noizylab-customers` | 1fb0ba03140b4f069df133444bc3f740 | Customer records |
| `noizylab-edge-config` | 58c254f29cc34ea3b8c0d7f932793f65 | Edge configuration |
| `noizylab-submissions` | 6e888a017ebe4ba78ed7497c4929439b | Form submissions |

#### MC96 MISSION CONTROL
| Namespace | ID | Purpose |
|-----------|----|---------|
| `mc96-hotrod-cache` | 4d592d48655c47c28f2ca08ecf9bd78a | Mission Control cache |
| `command-queue` | 41d546e3361a40e4a54913aa1ccd060e | Command processing queue |
| `conductor-locks` | 6cd359f60beb4201bb766e3c658fe074 | Orchestration locks |

#### AI INFRASTRUCTURE
| Namespace | ID | Purpose |
|-----------|----|---------|
| `agent-state` | 150a3c324a204ff0b9a7959b1804c1d0 | AI agent state management |
| `model-performance` | 341737a98a5448329c101c4b076f96f3 | Model metrics tracking |
| `session-cache` | 36120a47f04d409a89817d071f56b51d | Session management |
| `emergency-alerts` | 5fb15b70a3224864bdfbf9b3606c084b | Alert system |

#### OTHER SYSTEMS
| Namespace | ID | Purpose |
|-----------|----|---------|
| `discord-queue` | 1f41fb3cf78a4dd5b0f452b2f7e84e7c | Discord integration |
| `antigravity-cache` | 5fba76305ef7474b8ef4b0d6339bc24e | Antigravity cache |
| `tencc-locks` | 00283ea0a53d43ec93e31e2478fe1ddf | 10CC pipeline locks |
| `godaddy-escape-state` | 1e53c3a43ad9471d937997df9f22a8b1 | Domain migration |
| `gorunfree-execution-state` | 5cffc7c3e0b64c1d998942ef7da1ab3f | GoRunFree execution |

### D1 Databases (11) — THIS IS YOUR BRAIN

| Database | UUID | Size | Purpose |
|----------|------|------|---------|
| `agent-memory` | 7b813205-fd12-4a23-84a6-ce83bc49ec70 | **2.4 MB** | AI agent long-term memory (LARGEST) |
| `gabriel_db` | f75939d5-5747-4a9c-8ac2-7710201fda09 | 352 KB | Gabriel Voice Engine database |
| `rsp-master-budget` | 74e6b824-5c10-4b02-8060-3c20217a8ba9 | **840 KB** | Master budget & financials |
| `noizylab-repairs` | 2bd4aa06-f9b2-4761-b235-e92e8a21fe45 | 459 KB | System repairs & maintenance |
| `mc96-command-central` | ef4eda10-7dda-4c31-839d-5d79d76da43f | 250 KB | MC96 Mission Control |
| `aquarium-archive` | e6f98279-656b-4f7a-979d-9197821193f5 | 233 KB | The Aquarium archive |
| `email-command-center` | 313df650-60db-4392-b048-f5972c57903d | 262 KB | Email system |
| `tencc-pipeline` | d1a5c748-6e27-43a6-b5f1-394e748da0dc | 250 KB | 10CC pipeline |
| `ai-router-brain` | df931d37-b367-4f81-ae32-149e05166cb6 | 106 KB | AI routing intelligence |
| `godaddy-escape-tracker` | dfe9343e-c84c-49fd-8a02-052f37a7155b | 94 KB | Domain migration tracker |
| `subscription-killer` | 145b3abb-8647-4514-b39e-79f3a9f03c6a | 66 KB | Subscription management |

### R2 Storage
- **Not yet enabled** — Ready to activate for voice file storage

---

## GITHUB

### Enterprise: noizyempire
### Org: NOIZYLAB-io / Noizyfish

| Repo | Language | Description |
|------|----------|-------------|
| NOIZYLAB-io/NOIZYLAB | Go | Core platform |
| NOIZYLAB-io/NOIZY.ai | JavaScript | AI platform layer |
| MC96-Mission-Control | Python | Zero Latency AI Mission Control |
| cloudflare-docs | MDX | Forked |
| brew | Ruby | Forked |
| NOIZYLAB | Shell | Forked |

---

## FIGMA
- **Team**: Fish Music - Music & Sounds By R.S Plowman's team
- **Handle**: NoizyFish
- **Plan**: Starter (View seat)

---

## LINEAR
- **Workspace**: NOIZYLAB
- **Team**: NOIZYLAB (key: NOI)
- **Project**: NOIZYLAB_LINEAR (Backlog)
- **Issues**: NOI-1 through NOI-4 (onboarding, all Todo)

---

## SLACK
- **Workspace**: noizyfishcom.slack.com
- **Channels**: #proj-noizyfish, #all-noizyfishcom, #the-aqaurium
- **Active DM**: RSP ↔ Claude Bot

---

## NOTION
- **Workspace**: noizyfishcom
- **Key Page**: MC02212026_DR.B

---

## CANVA
- No NOIZY designs yet — ready for brand assets

---

## TOTAL INFRASTRUCTURE FOOTPRINT
- 1 Cloudflare Worker
- 20+ KV Namespaces (edge state)
- 11 D1 Databases (5+ MB total)
- 6 GitHub Repositories
- 1 Figma Team
- 1 Linear Workspace
- 1 Slack Workspace (3+ channels)
- 1 Notion Workspace
- 1 Canva Account

