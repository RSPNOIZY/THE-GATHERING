# 🎛️ LUCY STACK
## Full Setup — WireGuard VPN + SSH + Airfoil + LANDR + Postman + n8n + Zapier + Notion + Liner

---

## 📱 Devices
| Device | Role | VPN IP |
|---|---|---|
| Mac (Host) | VPN Server + Airfoil Host + n8n | 10.0.0.1 |
| iPhone 15 Pro Max | VPN Client + Airfoil Satellite | 10.0.0.2 |
| iPad Pro 12.9" 2nd Gen (Lucy) | VPN Client + Airfoil Satellite | 10.0.0.3 |

---

## 🚀 Quick Start

```bash
# 1. Run setup
cd lucy-stack
chmod +x scripts/setup.sh
./scripts/setup.sh

# 2. Start n8n
n8n start

# 3. Sync Liner → Notion
node liner/liner-to-notion.js
```

---

## 🏗️ Stack Architecture

```
┌─────────────────────────────────────────────┐
│                  MAC (10.0.0.1)             │
│  ┌──────────┐  ┌────────┐  ┌────────────┐  │
│  │WireGuard │  │Airfoil │  │    n8n     │  │
│  │  Server  │  │  Host  │  │  :5678     │  │
│  └────┬─────┘  └───┬────┘  └─────┬──────┘  │
└───────┼────────────┼─────────────┼──────────┘
        │            │             │
     VPN Tunnel   Audio        Webhooks
        │            │             │
   ┌────┴────────────┴─────────────┴────┐
   │         Encrypted Network          │
   ├────────────────┬───────────────────┤
   │ iPhone 10.0.0.2│  iPad  10.0.0.3  │
   │ Airfoil Sat.   │  Airfoil Sat.    │
   └────────────────┴───────────────────┘

        ↕ APIs                ↕ Sync
   ┌─────────┐           ┌──────────┐
   │  LANDR  │           │  Notion  │
   │Sessions │           │Workspace │
   └─────────┘           └──────────┘
        ↕                     ↑
   ┌─────────┐           ┌────┴─────┐
   │ Postman │           │  Liner   │
   │Collections          │Highlights│
   └─────────┘           └──────────┘
        ↕                     ↑
   ┌─────────┐           ┌────┴─────┐
   │  Zapier │───────────│   n8n    │
   │  Zaps   │           │Workflows │
   └─────────┘           └──────────┘
```

---

## 📁 File Structure
```
lucy-stack/
├── config/
│   └── .env.example        ← Copy to .env, fill in keys
├── vpn/
│   ├── wireguard-server.conf  ← Mac WireGuard server
│   ├── wireguard-iphone.conf  ← iPhone client config
│   └── wireguard-ipad.conf    ← iPad (Lucy) client config
├── ssh/
│   ├── ssh_config          ← SSH host aliases
│   └── keygen.sh           ← Generate SSH keys
├── postman/
│   └── lucy-collection.json ← Import into Postman
├── n8n-workflows/
│   └── lucy-master-workflow.json ← Import into n8n
├── zapier/
│   └── zapier-zaps.md      ← Zap blueprints
├── liner/
│   └── liner-to-notion.js  ← Sync script
├── notion/
│   └── lucy-workspace-setup.md ← DB blueprints
├── scripts/
│   └── setup.sh            ← Run this first!
└── docs/
    └── README.md           ← This file
```

---

## 🔑 API Keys Needed
- [ ] LANDR API Key
- [ ] Notion API Key + Database ID
- [ ] n8n API Key (after setup)
- [ ] Zapier Webhook URL
- [ ] Postman API Key
- [ ] Liner API Key

---

## 📲 iOS App Installs Needed
| App | iPhone | iPad | Store |
|---|---|---|---|
| WireGuard | ✅ | ✅ | App Store |
| Airfoil Satellite | ✅ | ✅ | App Store |
| Notion | ✅ | ✅ | App Store |
| Liner | ✅ | ✅ | App Store |
| Terminus (SSH) | ✅ | ✅ | App Store |
