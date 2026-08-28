# M2 Ultra — Zero Latency Optimization Guide

**Machine:** GOD.local (Apple M2 Ultra)
**Mission:** 100% optimized sovereign infrastructure for NOIZY.AI
**Date:** April 13, 2026

---

## 1. MEMORY OPTIMIZATION

The M2 Ultra has unified memory shared between CPU, GPU, and Neural Engine. Every byte matters.

### Kill Memory Hogs
```bash
# Find top memory consumers
ps aux --sort=-%mem | head -20

# Kill any zombie Docker containers eating memory
docker system prune -f
docker volume prune -f

# Remove unused Docker images
docker image prune -a -f
```

### Docker Memory Limits
In your `docker-compose.yml`, every service should have memory limits:
```yaml
services:
  dreamchamber:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M
```

### Recommended allocation for 13 services:
- DreamChamber: 4GB (11 AI providers, streaming)
- Gabriel: 2GB (orchestrator, heaviest agent)
- HEAVEN dev server: 512MB
- MC96: 1GB
- Each other agent: 256MB–512MB
- Cloudflare Tunnel: 128MB
- System reserve: 8GB minimum

---

## 2. DOCKER ZERO LATENCY

### Use host networking where possible
```yaml
services:
  dreamchamber:
    network_mode: host  # Eliminates Docker network overhead
```

### ARM64-native images only
```bash
# Verify no emulated images
docker images --format "{{.Repository}}:{{.Tag}} {{.Architecture}}" | grep -v arm64
# If any show amd64 — rebuild or find ARM64 alternatives
```

### Docker Desktop settings (macOS)
1. Open Docker Desktop → Settings → Resources
2. CPUs: 8 (half of M2 Ultra cores — leave rest for host)
3. Memory: 16GB (if you have 64GB+), 8GB if 32GB
4. Swap: 2GB max
5. Disk image size: 64GB
6. Enable "Use Virtualization Framework" (native Apple)
7. Enable "Use Rosetta for x86_64/amd64 emulation on Apple Silicon" (fallback only)

### Container health checks
```bash
# Add to every service
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:PORT/health"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 10s
```

---

## 3. NETWORK ZERO LATENCY

### Cloudflare Zero Trust Tunnel Optimization
```bash
# Check tunnel status
cloudflared tunnel list
cloudflared tunnel info YOUR_TUNNEL_ID

# Verify all 13 services are tunneled
cloudflared tunnel route list
```

### DNS optimization
```bash
# Use Cloudflare DNS (1.1.1.1) for fastest resolution
# macOS: System Settings → Network → DNS
networksetup -setdnsservers Wi-Fi 1.1.1.1 1.0.0.1
```

### Local service discovery
Add to `/etc/hosts` for zero-DNS-lookup local access:
```
127.0.0.1  dreamchamber.local
127.0.0.1  gabriel.local
127.0.0.1  mc96.local
127.0.0.1  heaven.local
```

---

## 4. DISK I/O OPTIMIZATION

### SSD TRIM verification
```bash
# Verify TRIM is enabled (should be on M2 Ultra)
system_profiler SPNVMeDataType | grep TRIM
```

### Spotlight exclusions
Exclude development directories from Spotlight indexing:
```bash
# Add to Spotlight privacy list
sudo mdutil -i off /path/to/docker/volumes
sudo mdutil -i off ~/Projects/THE-GATHERING/node_modules
```

### Time Machine exclusions
Exclude from Time Machine:
- Docker volumes
- node_modules directories
- .git/objects (git manages its own history)

---

## 5. PROCESS PRIORITY

### Give critical services higher priority
```bash
# Run DreamChamber at higher priority
sudo renice -n -10 $(pgrep -f dreamchamber)

# Run HEAVEN dev server at higher priority
sudo renice -n -5 $(pgrep -f wrangler)
```

### Disable unnecessary macOS services
```bash
# Disable AirDrop (uses Bluetooth/WiFi bandwidth)
defaults write com.apple.NetworkBrowser DisableAirDrop -bool YES

# Reduce transparency effects (saves GPU cycles for AI inference)
defaults write com.apple.universalaccess reduceTransparency -bool true
```

---

## 6. AI INFERENCE OPTIMIZATION

### Ollama (for local models)
```bash
# Set Ollama to use all available cores
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_MAX_LOADED_MODELS=3

# Verify GPU acceleration
ollama run gemma3 --verbose 2>&1 | grep "gpu"
```

### DreamChamber — 11 providers
Ensure API keys are in environment, not fetched per-request:
```bash
# In .env or docker-compose
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
# etc for all 11 providers
```

Connection pooling — keep HTTP/2 connections alive to each provider:
```javascript
// In DreamChamber config
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 10,
  keepAliveMsecs: 30000,
});
```

---

## 7. MONITORING — Zero Blind Spots

### Simple health check script
Save as `~/Scripts/healthcheck.sh`:
```bash
#!/bin/bash
SERVICES=(
  "DreamChamber:7777"
  "Gabriel:7001"
  "MC96:9696"
  "Heaven-Dev:8787"
)

for svc in "${SERVICES[@]}"; do
  NAME="${svc%%:*}"
  PORT="${svc##*:}"
  if curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1; then
    echo "✓ $NAME (:$PORT) — healthy"
  else
    echo "✗ $NAME (:$PORT) — DOWN"
  fi
done
```

### Cron job for continuous monitoring
```bash
# Check every 5 minutes
crontab -e
*/5 * * * * ~/Scripts/healthcheck.sh >> ~/Logs/health.log 2>&1
```

---

## 8. VERIFICATION CHECKLIST

Run these commands to verify GOD.local is 100%:

```bash
# 1. System info
sysctl -n hw.ncpu                    # Should be 24 (M2 Ultra)
sysctl -n hw.memsize | awk '{print $1/1073741824 "GB"}'  # 64GB+

# 2. Docker healthy
docker ps --format "{{.Names}}: {{.Status}}"

# 3. All tunnels active
cloudflared tunnel list

# 4. Disk space
df -h / | awk 'NR==2{print "Available: "$4}'

# 5. No swap pressure
sysctl vm.swapusage

# 6. Network latency to Cloudflare
ping -c 3 1.1.1.1

# 7. HEAVEN tests pass
cd ~/CLAUDE\ TODAY/heaven && npx vitest run
```

---

*"Zero latency is not a metric. It's a design constraint."*
— NOIZY.AI Infrastructure Doctrine
