# NOIZYLAB EDGE - Zero Trust Gateway

```
Browser → Cloudflare Edge (Worker) → Access → Tunnel → GABRIEL
                                     (auth)   (private)  (local)
```

**Zero exposed ports. All traffic authenticated at edge.**

## Architecture

| Layer | Component | Purpose |
|-------|-----------|---------|
| Edge | Worker | Logic, routing |
| Edge | Access | Identity gate |
| Edge | Tunnel | Private connection |
| Local | cloudflared | Tunnel agent on GABRIEL |
| Local | gabriel-agent.py | Command executor |

## Quick Start

### 1. Deploy Worker

```bash
./GORUNFREE.sh
```

### 2. Create Tunnel (Cloudflare Dashboard)

1. Go to https://one.dash.cloudflare.com
2. Networks → Tunnels → Create tunnel
3. Name: `gabriel-tunnel`
4. Save the token

### 3. Setup GABRIEL (Windows)

Copy these to GABRIEL and run:

```powershell
# Run as Administrator
.\gabriel-setup.ps1
```

Then:

```powershell
# Login
cloudflared tunnel login

# Install token from dashboard
cloudflared service install <TOKEN>
net start cloudflared
```

### 4. Run Local Agent

```batch
run-agent.bat
```

Or Python directly:
```powershell
pip install psutil
python gabriel-agent.py
```

### 5. Configure Access

1. Access → Applications → Add
2. Name: `GABRIEL`
3. Domain: `gabriel.fishmusicinc.com`
4. Policy: Allow `rsplowman@icloud.com`

### 6. Set Worker Secret

```bash
wrangler secret put GABRIEL_URL
# Enter: https://gabriel.fishmusicinc.com
```

## Endpoints

| Path | Method | Description |
|------|--------|-------------|
| `/` | GET | Dashboard |
| `/health` | GET | Worker status |
| `/gabriel/status` | GET | GABRIEL tunnel status |
| `/gabriel/exec` | POST | Execute command |
| `/ai` | POST | AI query |
| `/speak` | POST | AI + TTS |
| `/tts` | POST | TTS (HMAC) |

## Execute Command

```bash
curl -X POST https://noizylab-edge.fishmusicinc.workers.dev/gabriel/exec \
  -H "Content-Type: application/json" \
  -d '{"cmd": "systeminfo"}'
```

## Allowed Commands

The agent only allows these commands (security):
- `systeminfo`
- `dir`
- `hostname`
- `ipconfig`
- `whoami`
- `date`
- `time`
- `tasklist`
- `wmic`
- `netstat`

Edit `gabriel-agent.py` to add more.

## Files

| File | Purpose |
|------|---------|
| `src/index.js` | Worker (228 lines) |
| `gabriel-setup.ps1` | Windows installer |
| `gabriel-agent.py` | Local command server |
| `run-agent.bat` | Start agent |
| `config.yml` | Tunnel config template |
| `ARCHITECTURE.md` | Full architecture |
| `SETUP.md` | Detailed setup |

---
MIT - Rob Plowman / NOIZYLAB
