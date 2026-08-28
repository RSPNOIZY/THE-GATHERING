# Lucy Stack — Notion Workspace Setup

## Databases to Create

### 1. 🖥️ Devices
| Property | Type | Notes |
|---|---|---|
| Name | Title | e.g. "iPhone 15 Pro Max" |
| IP Address | Text | 10.0.0.x |
| Role | Select | Server / Client / Speaker |
| Status | Select | Online / Offline / Unknown |
| Last Seen | Date | Auto via n8n |
| Notes | Text | Config notes |

### 2. 🎵 Audio Sessions
| Property | Type | Notes |
|---|---|---|
| Session Name | Title | |
| Source | Select | LANDR / Spotify / DAW |
| Speakers | Relation | → Devices |
| Started | Date | |
| Duration | Number | minutes |
| Notes | Text | |

### 3. 📚 Research (Liner)
| Property | Type | Notes |
|---|---|---|
| Highlight | Title | From Liner |
| Source URL | URL | Original page |
| Tags | Multi-select | |
| Saved | Date | |
| Project | Relation | → Projects |

### 4. 🔧 Projects
| Property | Type | Notes |
|---|---|---|
| Name | Title | e.g. "Gabriel" |
| Status | Select | Active / Paused / Done |
| Stack | Multi-select | Cloudflare / n8n / Claude |
| Owner | Person | |
| Due | Date | |

### 5. 📋 API Log
| Property | Type | Notes |
|---|---|---|
| Endpoint | Title | |
| Method | Select | GET/POST/PUT/DELETE |
| Status | Select | 200 / 4xx / 5xx |
| Response Time | Number | ms |
| Timestamp | Date | |

## Page Structure
```
Lucy Workspace/
├── 📊 Dashboard
├── 🖥️ Devices DB
├── 🎵 Audio Sessions DB
├── 📚 Research DB (Liner)
├── 🔧 Projects DB
│   └── Gabriel
├── 📋 API Log DB
├── 🔒 Network Docs
│   ├── WireGuard Config
│   ├── SSH Setup
│   └── Airfoil Setup
└── ⚡ Automation Docs
    ├── n8n Workflows
    ├── Zapier Zaps
    └── Postman Collections
```
