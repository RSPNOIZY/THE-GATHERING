# cloudflared — NOIZY Dreamchamber Tunnel

Local config that bridges M2 Ultra services to `noizy.ai` subdomains via Cloudflare Tunnel.

## Hostnames mapped

| Public | Local | Purpose |
|---|---|---|
| `voice.noizy.ai` | `localhost:4096` | OpenCode MCP Server |
| `gabriel.noizy.ai` | `localhost:17017` | Heaven / GABRIEL voice pipeline |

Anything else → `404`.

## First-time bringup on the M2 Ultra

```bash
brew install cloudflared           # if not already installed
cloudflared tunnel login           # opens browser; auth against Cloudflare account
cloudflared tunnel create noizy-dreamchamber
# note the tunnel UUID and path to credentials JSON

mkdir -p ~/.cloudflared
cp /path/to/CLAUDE\ TODAY/cloudflared/config.yml ~/.cloudflared/config.yml
# adjust credentials-file path if different

cloudflared tunnel route dns noizy-dreamchamber voice.noizy.ai
cloudflared tunnel route dns noizy-dreamchamber gabriel.noizy.ai
```

## Run as a system service (survives reboot)

```bash
sudo cloudflared service install
sudo launchctl kickstart -k system/com.cloudflare.cloudflared
```

## Verify

```bash
cloudflared tunnel info noizy-dreamchamber        # should show "HEALTHY"
curl -I https://voice.noizy.ai                    # 401 from edge Worker = auth is on
curl -I https://gabriel.noizy.ai                  # same
```

## Stress-test notes (co-architect)

- **Local services must be listening** on `localhost:4096` and `localhost:17017` *before* the tunnel starts, or the tunnel returns 502. Recommend launchd plists that guarantee start-order: local services → tunnel.
- **Port 17017 is new** in the Canon — first mention. Confirm this is the Heaven pipeline's canonical port; if it's really on a different port, update here and in `voice-bridge-remote/wrangler.toml` references.
- **Credentials file** (`noizy-dreamchamber.json`) is a long-lived secret — back it up into the founder password vault per Day-0 Runbook Step 0.4.
- **Tunnel is the only path** from the internet to these services. If `cloudflared` dies, the edge Worker returns 502 from `TUNNEL_ORIGIN`. Monitor tunnel health; alert on red.
