# RSP Rideshare — GABRIEL + LUCY
# Ottawa, Ontario | rspdrives@gmail.com | 2026 Honda CRV Hybrid

## Architecture
```
LUCY (M2 Ultra) ──────────────────────────────┐
GABRIEL (M2 Ultra) ──── rsp_rideshare_db ─────┤
                         (Cloudflare D1)       │
THE-GATHERING ──────── Receipt Ledger ─────────┤
                                               ▼
                              Thin relay → Honda CRV CarPlay
                              ntfy.sh   → iPhone → CarPlay alerts
```

## Build Order (Rule Zero)
1. `the-gathering/` — Receipt scaffold + ledger (DONE ✅)
2. `db/`            — D1 schema + migrations (DONE ✅)
3. `pipelines/`     — N8N stubs + Python modules (DONE ✅)
4. `dashboard/`     — Financial web dashboard
5. CRV integration  — Thin relay via LUCY

## Stack
- **Database**: Cloudflare D1 (`rsp_rideshare_db`) + local SQLite mirror
- **Receipts**: THE-GATHERING JSON ledger (immutable, SHA-256 hashed)
- **Pipelines**: N8N workflows + Python 3.11+
- **Alerts**: ntfy.sh → iPhone CarPlay push notifications
- **Dashboard**: Vanilla HTML/CSS/JS (local, opens in browser)
- **Control Plane**: LUCY on M2 Ultra
- **CRV Bridge**: Thin relay — M2 Ultra → iPhone → CarPlay

## Credentials Required
- [ ] Cloudflare Account ID + D1 API Token
- [ ] N8N instance URL + API key
- [ ] Uber Developer API (driver data access)
- [ ] Lyft Developer API (driver data access)
- [ ] ntfy.sh topic name (set in `pipelines/carplay_alert_engine.py`)

## Quick Start
```bash
# Run financial tracker (seeds sample data)
python3 pipelines/financial_tracker.py

# Run Ottawa surge tracker (uses Copilot flight data)
python3 pipelines/copilot_ingest_ottawa.py

# Run CarPlay alert engine
python3 pipelines/carplay_alert_engine.py

# Open dashboard
open dashboard/index.html
```

## THE-GATHERING Receipt Structure
Every action generates an immutable JSON receipt in `the-gathering/receipts/`.
Receipts are SHA-256 hashed and chain-linked (prev_receipt_id).

## YOW Flight Data
Live flight data requires API credentials (Aviationstack, AeroAPI, or FlightAware).
Static schedule intelligence is seeded in `pipelines/copilot_ingest_ottawa.py`.

## Project: GABRIEL / LUCY
GABRIEL = build + analytics agent (M2 Ultra)
LUCY = CarPlay + Google Maps + Honda CRV integration (M2 Ultra → thin relay → CRV)
Both have co-equal read/write on `rsp_rideshare_db`.
