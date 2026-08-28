# NOIZY COMMAND CARDS

*Print. Laminate. Pin next to the mic. Muscle memory, not discovery.*

---

## VOICE COMMANDS (Siri / Gabriel)

| Say This | What Happens |
|----------|-------------|
| **"Hey Gabriel, check system"** | Dispatch status ping to all agents, return health |
| **"Hey Gabriel, record Georgia May"** | Preflight check, open Logic, arm track, start recording |
| **"Hey Gabriel, stop and save"** | Stop recording, save take, log to events.jsonl |
| **"Hey Gabriel, export session"** | Package session files, emit manifest, log to events |
| **"Hey Gabriel, emergency stop"** | Graceful halt all agents, save state, stop recording |
| **"Hey Gabriel, scan drives"** | Run scan-drives.sh, emit manifest to ~/Recovered/ |
| **"Hey Gabriel, system health"** | Return Logic + agents + disk + Heaven status |
| **"Hey Gabriel, deploy heaven"** | Run smoke tests, then wrangler deploy |

---

## LUCY (iPad) TOUCH COMMANDS

| Tap This | What Happens |
|----------|-------------|
| **PING GABRIEL** | Dispatch status/ping, show response in last-command |
| **REFRESH** | Re-poll all agent health + Heaven + system |
| **EMERGENCY STOP** | Confirm dialog, then halt all agents gracefully |
| **Agent card** | Tap to see detailed health for that agent |
| **Master LED (green)** | All agents healthy |
| **Master LED (red)** | One or more agents down — tap to see which |

---

## TERMINAL (GOD.local)

### Recovery (always run in order)

```bash
make scan               # First command, every machine
make scan-dry           # Preview without hashing
make extract SOURCE=/Volumes/MICKY-P
make quarantine SOURCE=/Volumes/MICKY-P
make verify SOURCE=/Volumes/MICKY-P
make health
make preflight
make operate            # Unlocked only after all gates pass
```

### Mesh

```bash
# Start agents + gateway (no Docker)
PORT=7001 AGENT_NAME=gabriel AGENT_ROLE=orchestrator node infra/docker/agents/gabriel/server.js &
PORT=7002 AGENT_NAME=lucy AGENT_ROLE=session-tracker node infra/docker/agents/gabriel/server.js &
PORT=7003 AGENT_NAME=shirley AGENT_ROLE=code-manager node infra/docker/agents/gabriel/server.js &
PORT=7004 AGENT_NAME=keith AGENT_ROLE=engineer node infra/docker/agents/gabriel/server.js &
PORT=7005 AGENT_NAME=dream AGENT_ROLE=creative-engine node infra/docker/agents/gabriel/server.js &

# Start gateway
AGENT_GABRIEL_URL=http://127.0.0.1:7001 \
AGENT_LUCY_URL=http://127.0.0.1:7002 \
AGENT_SHIRLEY_URL=http://127.0.0.1:7003 \
AGENT_KEITH_URL=http://127.0.0.1:7004 \
AGENT_DREAM_URL=http://127.0.0.1:7005 \
PORT=9696 node infra/docker/central-gateway/server.js &

# Verify
curl http://127.0.0.1:9696/health | jq .
```

### Heaven

```bash
npx wrangler deploy                          # Deploy to edge
curl https://heaven.rsp-5f3.workers.dev/health  # Verify
```

### Dispatch (from anywhere)

```bash
curl -X POST https://heaven.rsp-5f3.workers.dev/api/dispatch \
  -H "content-type: application/json" \
  -d '{"actor":"RSP_001","device":"terminal","intent":"status","target":"gabriel"}'
```

### Tunnel (bridges Heaven to GOD)

```bash
cloudflared tunnel create noizy-mesh
cloudflared tunnel route dns noizy-mesh mesh.noizy.ai
cloudflared tunnel run --url http://127.0.0.1:9696 noizy-mesh
```

---

## DISPATCH PAYLOAD SHAPE

```json
{
  "actor": "RSP_001",
  "device": "iphone_gabriel | ipad_lucy | terminal | siri",
  "intent": "status | ping | record | stop | export | scan | deploy",
  "target": "gabriel | lucy | shirley | keith | dream",
  "context": { "mode": "ping", "session": "georgia-may-001" }
}
```

---

## PORTS (GOD.local)

| Port | Service |
|------|---------|
| 7001 | agent-gabriel (orchestrator) |
| 7002 | agent-lucy (session tracker) |
| 7003 | agent-shirley (code manager) |
| 7004 | agent-keith (engineer) |
| 7005 | agent-dream (creative engine) |
| 7777 | DreamChamber |
| 8080 | Voice Bridge |
| 9696 | Central Gateway + Lucy Dashboard |

---

## MANTRA

> **Scan first. Copy second. Verify third. Operate fourth. Automate power last.**
