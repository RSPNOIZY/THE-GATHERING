# MC96ECO Service Restart Runbook

> GABRIEL Self-Healing Loop Knowledge Base
> Machine: M2 Ultra Mac Studio (GOD.local)
> Last updated: 2026-04-03

---

## Quick Reference

| Service | Port | Manager | Restart Command |
|---------|------|---------|-----------------|
| GABRIEL | 7777 | pm2 | `pm2 restart gabriel` |
| Voice Bridge | 8080 | pm2 | `pm2 restart voice-bridge` |
| NOIZYVOX | 8421 | pm2 | `pm2 restart noizyvox` |
| NOIZYSTREAM | 4040 | pm2 | `pm2 restart noizystream` |
| AirPlay | 3001 | pm2 | `pm2 restart airplay` |
| Health Monitor | 9090 | pm2 | `pm2 restart health-monitor` |
| Command Center | 8888 | pm2 | `pm2 restart command-center` |
| THE CODEX | 5500 | pm2 | `pm2 restart the-codex` |
| n8n | 5678 | pm2/Docker | `pm2 restart n8n` or `docker-compose restart n8n` |
| Ollama | 11434 | brew | `brew services restart ollama` |
| GABRIEL (launchd) | 7777 | launchd | `launchctl kickstart -k gui/$(id -u)/com.noizy.gabriel` |

---

## pm2 Services

pm2 manages most MC96ECO services. The ecosystem config is at `~/NOIZYLAB/ecosystem.config.cjs`.

### Restart a single service

```bash
pm2 restart <name>
```

Examples:
```bash
pm2 restart gabriel
pm2 restart voice-bridge
pm2 restart noizyvox
pm2 restart noizystream
pm2 restart airplay
pm2 restart health-monitor
pm2 restart command-center
pm2 restart the-codex
pm2 restart n8n
```

### Restart all pm2 services

```bash
pm2 restart all
```

### Stop a service

```bash
pm2 stop <name>
```

### Start a stopped service

```bash
pm2 start <name>
```

### Full ecosystem reload (from config)

```bash
cd ~/NOIZYLAB && pm2 start ecosystem.config.cjs
```

This reads the ecosystem config and starts/restarts all defined services.

### View logs

```bash
pm2 logs <name>          # Live tail
pm2 logs <name> --lines 50  # Last 50 lines
pm2 logs                 # All services
```

### View status

```bash
pm2 status               # Table of all services
pm2 describe <name>      # Detailed info for one service
```

### Flush logs (if disk full)

```bash
pm2 flush                # Clear all log files
pm2 flush <name>         # Clear logs for one service
```

---

## launchd Services

GABRIEL has a launchd plist for auto-start on boot. This is the backup manager — pm2 is primary.

**Plist location:** `~/Library/LaunchAgents/com.noizy.gabriel.plist`

### Restart via launchd

```bash
launchctl kickstart -k gui/$(id -u)/com.noizy.gabriel
```

The `-k` flag kills the existing process before restarting.

### Stop via launchd

```bash
launchctl bootout gui/$(id -u)/com.noizy.gabriel
```

### Start via launchd

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.noizy.gabriel.plist
```

### Check launchd status

```bash
launchctl print gui/$(id -u)/com.noizy.gabriel
```

### Note on pm2 vs launchd

- **pm2 is the primary process manager.** Use it for day-to-day restarts.
- **launchd is the boot-level fallback.** It ensures GABRIEL starts on machine boot even if pm2 isn't running.
- If both are active, you may get port conflicts. Check with `lsof -i :7777` before starting.

---

## Docker Services

Some services (notably n8n and DreamChamber components) may run in Docker.

### Restart Docker Compose services

```bash
cd ~/NOIZYLAB/dreamchamber && docker-compose restart
```

### Restart a specific Docker service

```bash
cd ~/NOIZYLAB/dreamchamber && docker-compose restart <service-name>
```

### View Docker logs

```bash
cd ~/NOIZYLAB/dreamchamber && docker-compose logs -f <service-name>
```

### Full rebuild (if config changed)

```bash
cd ~/NOIZYLAB/dreamchamber && docker-compose down && docker-compose up -d
```

---

## Ollama

Ollama is managed by Homebrew services, not pm2.

### Restart

```bash
brew services restart ollama
```

### Stop

```bash
brew services stop ollama
```

### Start

```bash
brew services start ollama
```

### Verify

```bash
curl http://localhost:11434/api/tags
```

Should return JSON with all loaded models.

### Pull a new model

```bash
ollama pull <model-name>
```

### If Ollama is unresponsive

1. Stop: `brew services stop ollama`
2. Kill any orphan: `pkill -f ollama`
3. Wait 3 seconds
4. Start: `brew services start ollama`
5. Verify: `curl http://localhost:11434/api/tags`

---

## Emergency: Restart Everything

If the entire stack needs a cold restart:

```bash
# 1. Stop everything
pm2 stop all
brew services stop ollama

# 2. Kill any orphan processes
pkill -f "node.*gabriel"
pkill -f "node.*voice-bridge"
pkill -f "uvicorn"
pkill -f ollama

# 3. Wait for ports to clear
sleep 5

# 4. Start Ollama first (other services depend on it)
brew services start ollama

# 5. Wait for Ollama to be ready
sleep 10

# 6. Start all pm2 services
cd ~/NOIZYLAB && pm2 start ecosystem.config.cjs

# 7. Verify
pm2 status
curl http://localhost:7777/health
curl http://localhost:11434/api/tags
```

**Start order matters:**
1. Ollama (no dependencies)
2. GABRIEL (depends on Ollama)
3. Voice Bridge (depends on GABRIEL)
4. Everything else (depends on GABRIEL)

---

## Health Verification After Restart

After restarting any service, verify it's healthy:

```bash
# Quick check all services
curl -s http://localhost:7777/health   # GABRIEL
curl -s http://localhost:8080/health   # Voice Bridge
curl -s http://localhost:8421/health   # NOIZYVOX
curl -s http://localhost:4040/health   # NOIZYSTREAM
curl -s http://localhost:3001/health   # AirPlay
curl -s http://localhost:9090/         # Health Monitor (dashboard)
curl -s http://localhost:8888/         # Command Center
curl -s http://localhost:5678/healthz  # n8n
curl -s http://localhost:11434/api/tags # Ollama
curl -s http://localhost:5500/health   # THE CODEX
```

Or just open the Health Monitor dashboard at `http://localhost:9090` — it checks all services every 15 seconds.
