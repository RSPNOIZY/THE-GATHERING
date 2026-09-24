# NOIZYLAB Zero Trust Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            INTERNET                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE EDGE                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Worker    │  │   Access    │  │   Tunnel    │  │     R2      │     │
│  │  (Logic)    │  │  (Identity) │  │  (Private)  │  │   (Cache)   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
│         │                │                │                              │
│         └────────────────┼────────────────┘                              │
│                          │                                               │
└──────────────────────────┼───────────────────────────────────────────────┘
                           │
                           │ Cloudflare Tunnel (encrypted, no open ports)
                           │
┌──────────────────────────┼───────────────────────────────────────────────┐
│  MC96 NETWORK            │                            10.90.90.0/24      │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  GABRIEL (HP Omen)                               10.90.90.20    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │    │
│  │  │ cloudflared │  │  Services   │  │    SSH      │              │    │
│  │  │  (tunnel)   │  │  (local)    │  │  (if any)   │              │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  GOD (Mac Studio M2 Ultra)                       10.90.90.10    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  DaFixer (MacBook Pro 13")                       10.90.90.40    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Flow

1. **Client** → Cloudflare Edge (Worker)
2. **Worker** → Check Access (identity)
3. **Access** → Validate token/session
4. **Worker** → Route to Tunnel
5. **Tunnel** → GABRIEL (private, encrypted)
6. **GABRIEL** → Execute, respond
7. **Response** → Back through tunnel → Worker → Client

## Zero Exposed Ports

- GABRIEL has NO open inbound ports
- Tunnel is outbound-only from GABRIEL
- All traffic authenticated at Cloudflare edge
- mTLS between cloudflared and Cloudflare

## Components

| Component | Purpose | Location |
|-----------|---------|----------|
| Worker | Edge logic, routing | Cloudflare |
| Access | Identity, auth | Cloudflare |
| Tunnel | Private connection | Cloudflare → GABRIEL |
| cloudflared | Tunnel agent | GABRIEL |
| R2 | Audio cache | Cloudflare |
| KV | Config, sessions | Cloudflare |
