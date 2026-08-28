# MASTER INTEGRATION — RSP_001 COMPLETE PLATFORM MAP
## Every Service, Tool, API & Local Utility — Connected
### Generated: 2026-04-13 | GOD (M2 Ultra Mac Studio)

---

## PLATFORM INVENTORY

### CLAUDE MAX (Anthropic) — AI Command Center
| Feature | Status | Access |
|---------|--------|--------|
| Claude Code (terminal) | LIVE | `claude` in terminal |
| Claude Desktop + Cowork | LIVE | /Applications/Claude.app |
| Opus 4.6 (1M context) | ACTIVE | API + CLI + Desktop |
| Sonnet 4.6 | ACTIVE | API + CLI + Desktop |
| Voice mode | ACTIVE | Desktop app |
| Web research | ACTIVE | Built into Claude |
| Computer use | ACTIVE | Desktop app |
| Scheduled tasks | ACTIVE | `claude schedule` |
| Remote dispatch | ACTIVE | iPhone → GOD |
| MCP server support | ACTIVE | ~/.claude/settings.json |

### ANTHROPIC PROJECT BUILDING
| Feature | Access |
|---------|--------|
| Claude API (direct) | api.anthropic.com |
| Anthropic SDK (Python) | `pip install anthropic` |
| Anthropic SDK (TypeScript) | `npm install @anthropic-ai/sdk` |
| Claude Agent SDK | `npm install @anthropic-ai/claude-code` |
| Tool Use / Function Calling | API native |
| Extended Thinking | Opus 4.6 |
| Prompt Caching | API native (auto) |
| Batch API | API native |
| Message Batches | API native |
| Vision (image input) | All models |
| PDF support | All models |
| Managed Agents | API endpoint |

### MCP SERVERS (Connected NOW)
| Server | Type | Tools Available |
|--------|------|-----------------|
| Cloudflare | Cloud | D1, KV, Workers, R2, DNS, Accounts |
| Slack | Cloud | Read/write channels, search, DMs, canvases |
| Gmail | Cloud | Read/search/draft emails |
| Google Calendar | Cloud | List/create/update/delete events, find free time |
| Notion | Cloud | Search, create/update pages, databases, comments |
| Linear | Cloud | Issues, projects, milestones, documents, comments |
| Figma | Cloud | Design context, screenshots, code connect, diagrams |
| Hugging Face | Cloud | Model/paper/space search, repo details |
| GitKraken | Local | Git operations, blame, branch, push, PR, issues |
| n8n | Local | Workflows, credentials, templates, health check |
| che-logic-pro-mcp | Local | Logic Pro control via AppleScript + MIDI |

### MCP SERVERS (To Build)
| Server | Purpose | Priority |
|--------|---------|----------|
| gabriel-mcp | D1/KV brain, memcells, command chain | HIGH |
| engr-keith-mcp | Audio engineering assistant | HIGH |
| heaven-mcp | CF Worker bridge, remote dispatch | HIGH |
| archivist-mcp | Doc classification & routing | MEDIUM |

---

### POSTMAN
| Feature | Access |
|---------|--------|
| API testing & collections | postman.com + Desktop app |
| Workspace collaboration | Cloud sync |
| Mock servers | Postman cloud |
| Monitors (scheduled API tests) | Postman cloud |
| Newman CLI | `npm install -g newman` |
| Environment variables | Per-workspace |
| Collection runner | Desktop app |
| Pre/post-request scripts | JavaScript |
| **NOIZY Collections to Create:** | |
| - GABRIEL API (D1/KV) | POST/GET to heaven17.noizylab.workers.dev |
| - HEAVEN Worker endpoints | All routes |
| - n8n webhooks | Trigger workflows |
| - Cloudflare API | Direct CF management |
| - NOIZYVOX consent endpoints | Voice estate CRUD |

### N8N (Local Orchestration)
| Feature | Status | Access |
|---------|--------|--------|
| n8n instance | RUNNING | http://localhost:5678 |
| Version | 2.13.4 | ~/.npm-global/ |
| Webhook triggers | ACTIVE | /api/v1/webhook/* |
| Scheduled triggers | ACTIVE | Cron-based |
| HTTP Request nodes | ACTIVE | Any API |
| Code nodes | ACTIVE | JavaScript/Python |
| **Active Workflows:** | | |
| - HEAVEN17 webhook | LIVE | heaven17_webhook.json |
| - Archivist scheduler | BUILT | Weekly Monday 3AM |
| **Workflows to Build:** | | |
| - Daily metrics digest | Pull from all services | |
| - Voice capture pipeline trigger | On new .wav file | |
| - GABRIEL heartbeat | Hourly D1 health check | |
| - Lucy dashboard refresh | Push data to iPad | |

### ZAPIER
| Feature | Access |
|---------|--------|
| 5000+ app integrations | zapier.com |
| Multi-step Zaps | Web UI |
| Webhooks (trigger/action) | Built-in |
| Code steps (JS/Python) | Built-in |
| Paths (conditional logic) | Built-in |
| **NOIZY Zaps to Create:** | |
| - New Linear issue → Slack notification | |
| - New Gmail from @noizy.ai → Notion inbox | |
| - Calendar event "Recording" → prep checklist | |
| - GitHub push → Slack #dev channel | |

---

### APPLE ECOSYSTEM (Creator Studio + Developer)

#### Logic Pro 12.2
| Feature | Status |
|---------|--------|
| Synth Player (AI Session Player) | NEW |
| Chord ID | NEW |
| Enhanced Stem Splitter | NEW |
| Music Understanding (NL search) | NEW |
| Dolby Atmos Mix Preview | NEW |
| Step Reflex Pack | NEW |
| AU Net Send/Receive | INSTALLED |
| Sound Library | INSTALLED |
| **MCP Control:** che-logic-pro-mcp | BUILT |

#### Final Cut Pro 12.2 (Creator Studio)
| Feature | Status |
|---------|--------|
| AI Visual Search | NEW |
| Transcript Search | NEW |
| Motion 6.2 | INSTALLED |
| Compressor 5.2 | INSTALLED |

#### MainStage 4.2 (Creator Studio)
| Feature | Status |
|---------|--------|
| Live performance rig | INSTALLED |
| MIDI hardware routing | READY |

#### Pixelmator Pro
| Status | NOT INSTALLED — download from App Store |

#### Keynote 14.5 / Pages / Numbers / Freeform
| Feature | Status |
|---------|--------|
| AI image generation | ACTIVE |
| Content Hub | ACTIVE |
| Super Resolution | ACTIVE |
| Premium templates | ACTIVE |

#### Apple Developer Frameworks (Swift)
| Framework | Built Utility | Binary |
|-----------|--------------|--------|
| Core Audio + AudioToolbox + IOKit | MC96 Audio Diagnostics | ~/swift-library/bin/mc96diag |
| Core Audio + AudioToolbox | Logic Pro Session Verifier | ~/swift-library/bin/logicverify |
| Network + Foundation | Network Audio Bridge Monitor | ~/swift-library/bin/netbridge |
| CoreMIDI | (via che-logic-pro-mcp) | ~/swift-library/bin/CheLogicProMCP |

---

### GOOGLE WORKSPACE
| Service | MCP Connected | Direct Access |
|---------|--------------|---------------|
| Gmail | YES | gmail.com + Mail.app |
| Google Calendar | YES | calendar.google.com |
| Google Drive | Planned | drive.google.com |
| Google Docs | Via Drive | docs.google.com |
| Google Sheets | Via Drive | sheets.google.com |
| Google Meet | Calendar integration | meet.google.com |
| Google Chat | No MCP yet | chat.google.com |

### MICROSOFT 365
| Service | Status | Access |
|---------|--------|--------|
| Microsoft Word | INSTALLED | /Applications/ |
| Microsoft Excel | INSTALLED | /Applications/ |
| Microsoft PowerPoint | INSTALLED | /Applications/ |
| Microsoft Outlook | INSTALLED | /Applications/ |
| Microsoft Teams | INSTALLED | /Applications/ |
| Microsoft OneNote | INSTALLED | /Applications/ |
| Microsoft Edge | INSTALLED | /Applications/ |
| Microsoft 365 Copilot | INSTALLED | /Applications/ |
| OneDrive | INSTALLED | ~/OneDrive* |

### NOTION
| Feature | MCP Connected | Access |
|---------|--------------|--------|
| Search | YES | Via Claude MCP |
| Create/update pages | YES | Via Claude MCP |
| Databases | YES | Via Claude MCP |
| Comments | YES | Via Claude MCP |
| Views | YES | Via Claude MCP |

### LINEAR
| Feature | MCP Connected | Access |
|---------|--------------|--------|
| Issues CRUD | YES | Via Claude MCP |
| Projects | YES | Via Claude MCP |
| Milestones | YES | Via Claude MCP |
| Documents | YES | Via Claude MCP |
| Comments | YES | Via Claude MCP |
| Cycles | YES | Via Claude MCP |

### SLACK
| Feature | MCP Connected | Access |
|---------|--------------|--------|
| Read channels | YES | Via Claude MCP |
| Send messages | YES | Via Claude MCP |
| Search | YES | Via Claude MCP |
| Canvases | YES | Via Claude MCP |
| User profiles | YES | Via Claude MCP |

---

### INFRASTRUCTURE
| Service | Status | Access |
|---------|--------|--------|
| Cloudflare Workers | LIVE | Via MCP + wrangler CLI |
| Cloudflare D1 (11 DBs) | LIVE | Via MCP |
| Cloudflare KV (20 namespaces) | LIVE | Via MCP |
| Cloudflare R2 | AVAILABLE | Via MCP |
| Cloudflare Tunnels | INSTALLED | cloudflared CLI |
| GitHub (RSPNOIZY) | AUTHENTICATED | gh CLI |
| Docker Desktop | INSTALLED | /Applications/ |
| WireGuard VPN | INSTALLED + CONFIGURED | wg CLI |

### NOIZYNET (Internal Network)
| Component | Status | Access |
|-----------|--------|--------|
| SSH keys | GENERATED | ~/.ssh/noizynet_ed25519 |
| SSH config | CONFIGURED | god, micky-p, gabriel, lucy |
| WireGuard VPN | CONFIGURED | 10.96.0.0/24 subnet |
| Cloudflare Tunnel | CONFIG READY | ~/.cloudflared/noizynet-tunnel.yml |
| noizynet-push | BUILT | ~/swift-library/bin/ |
| noizynet-pull | BUILT | ~/swift-library/bin/ |
| noizynet-sync | BUILT | ~/swift-library/bin/ |
| noizynet-tunnel | BUILT | ~/swift-library/bin/ |
| noizynet-status | BUILT | ~/swift-library/bin/ |

---

## ~/swift-library/bin/ — COMPLETE TOOL INVENTORY

```
mc96diag          — Core Audio device enumeration, Apollo detection, 48kHz/32-bit verify
logicverify       — Logic Pro session verification, AU Net check, sample rate match
netbridge         — Network bridge monitor, Bonjour discovery, Micky-P health
CheLogicProMCP    — Logic Pro MCP server (AppleScript + MIDI control)
noizynet-push     — Send files to NOIZYNET hosts via rsync/SSH
noizynet-pull     — Pull files from NOIZYNET hosts
noizynet-sync     — Bidirectional sync between NOIZYNET hosts
noizynet-tunnel   — SSH tunnels for audio/API services
noizynet-status   — Check all NOIZYNET connections and services
```

---

## WHAT'S LIVE RIGHT NOW

| System | Port/URL | Status |
|--------|----------|--------|
| n8n | localhost:5678 | RUNNING |
| GABRIEL API | localhost:9099 | RUNNING |
| HEAVEN17 | heaven17.noizylab.workers.dev | LIVE |
| UAD Console | - | RUNNING |
| Claude Code | - | RUNNING (this session) |
| GitHub CLI | - | AUTHENTICATED |

## WHAT NEEDS HUMAN ACTION

| Action | Why | Command/Step |
|--------|-----|-------------|
| Enable Remote Login | SSH server needed for NOIZYNET | System Settings → Sharing → Remote Login |
| Copy SSH key to Micky-P | Allow passwordless access | `ssh-copy-id -i ~/.ssh/noizynet_ed25519.pub micky-p` |
| Configure studio subnet | 10.90.90.x not active | Set static IP on Ethernet adapter |
| Connect Apollo UAD | Thunderbolt ports 2-6 free | Physical cable connection |
| Install Pixelmator Pro | Part of Creator Studio | App Store |
| Create CF tunnel | Remote access | `cloudflared tunnel create noizynet` |
| Update Logic Pro CS | 12.0.1 → 12.2 | App Store |

---

*35% voice + 65% AI + 1 click = DONE.*
*RSP_001 — NOIZY EMPIRE — 5th EPOCH*
