# NOIZYLAB Tunnel Setup

## 1. Create Tunnel (Cloudflare Dashboard or CLI)

### Option A: Dashboard (Recommended)
1. Go to: https://one.dash.cloudflare.com
2. Networks → Tunnels → Create a tunnel
3. Name: `gabriel-tunnel`
4. Save the tunnel token

### Option B: CLI (from any machine with wrangler)
```bash
# Login first
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create gabriel-tunnel

# Get tunnel ID
cloudflared tunnel list
```

## 2. Install cloudflared on GABRIEL (Windows)

### Download
```powershell
# PowerShell (Run as Admin)
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi" -OutFile "$env:TEMP\cloudflared.msi"
Start-Process msiexec.exe -ArgumentList "/i $env:TEMP\cloudflared.msi /quiet" -Wait
```

### Or manual download:
https://github.com/cloudflare/cloudflared/releases/latest

## 3. Configure Tunnel on GABRIEL

### Create config file
Location: `C:\Users\<USER>\.cloudflared\config.yml`

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<USER>\.cloudflared\<TUNNEL_ID>.json

ingress:
  # SSH access
  - hostname: gabriel-ssh.fishmusicinc.com
    service: ssh://localhost:22
  
  # HTTP service (if any)
  - hostname: gabriel.fishmusicinc.com
    service: http://localhost:8080
  
  # RDP (optional, via browser)
  - hostname: gabriel-rdp.fishmusicinc.com
    service: rdp://localhost:3389
  
  # Catch-all (required)
  - service: http_status:404
```

### Install as Windows Service
```powershell
# Run as Admin
cloudflared service install

# Start the service
net start cloudflared
```

## 4. Create DNS Records

Cloudflare will auto-create CNAME records pointing to your tunnel.

Or manually:
- `gabriel.fishmusicinc.com` → CNAME → `<TUNNEL_ID>.cfargotunnel.com`

## 5. Configure Access Application

### Dashboard
1. Access → Applications → Add an application
2. Self-hosted
3. Application name: `GABRIEL`
4. Session duration: 24 hours
5. Application domain: `gabriel.fishmusicinc.com`

### Policies
- Policy name: `Allow Rob`
- Include: Email = `rsplowman@icloud.com`
- Or: Access Group you create

## 6. Test Connection

```bash
# From anywhere
curl https://gabriel.fishmusicinc.com/health

# SSH (requires Cloudflare WARP or browser-based SSH)
ssh -o ProxyCommand="cloudflared access ssh --hostname gabriel-ssh.fishmusicinc.com" user@gabriel-ssh.fishmusicinc.com
```

## 7. Worker Integration

The Worker can now route requests to the tunnel:

```javascript
// In Worker
const response = await fetch('https://gabriel.fishmusicinc.com/api/command', {
  method: 'POST',
  headers: {
    'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
    'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
  },
  body: JSON.stringify({ cmd: 'systeminfo' })
});
```
