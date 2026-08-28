# Studio Chain Cutover — NOIZYNET + ENGR_KEITH

Declared live chain:

- Signal daemon: `:9699`
- ENGR_KEITH: `:7006`
- AU Net data path: `97100`
- iPad browser dashboard: `http://10.90.90.10:9699`

## Execution order

### 1. On Micky-P

- Make deploy script executable:
  - `chmod +x ~/Desktop/noizynet_deploy.sh`
- Run:
  - `./noizynet_deploy.sh`

### 2. Verify from GOD

- `ssh rsp@10.90.90.10 'noizynet health'`
- Expect:
  - `SIGNAL_CHAIN_LIVE`

### 3. iPad live monitor

Open Safari on iPad:

- `http://10.90.90.10:9699`

Expected dashboard shape:

```json
{
  "chain": "SIGNAL_CHAIN_LIVE",
  "micky_p": "REACHABLE",
  "au_net": "CONNECTED:97100",
  "keith": "HEALTHY:7006",
  "logic": "RUNNING: NOIZY Claude Session 1",
  "ipad_remote": "CONNECTED"
}
```

### 4. Master build integration

Patch `~/noizy_master_build.sh` using:

- `ops/noizynet/noizy_master_build.patch.md`

### 5. Heaven / empire dispatch

After studio chain is confirmed:

- deploy HEAVEN worker
- route `noizy.ai/keith/*` through Cloudflare tunnel bridge
- keep Cloudflare as the bridge from external clients to GOD

## One-time manual Logic wiring

- Micky-P AU Net Send -> `NOIZYNET:97100`
- GOD AU Net Receive <- `NOIZYNET:97100`
- iPad Logic Remote auto-connects

## Final one-command flow

```bash
./noizy_master_build.sh all
ssh rsp@10.90.90.10 'npx wrangler deploy'
noizynet health
noizy record
```
