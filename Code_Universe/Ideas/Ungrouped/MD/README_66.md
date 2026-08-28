# NOIZY Vault — OSS, Docker, GOD

**Compartment 3 of N shipped 2026-04-19.**
Loopback-only Vault OSS 1.15.6 on GOD.local, integrated Raft storage, Shamir 3-of-2 unseal.

## Boot sequence (run once, in order)

```bash
cd ~/NOIZYANTHROPIC/infra/hashicorp/vault
chmod +x scripts/*.sh

# 1. Start the container
docker compose up -d

# 2. Wait ~5 seconds, then initialize ONCE
./scripts/init.sh
# → Prints 3 unseal keys + 1 root token to your terminal.
# → DISTRIBUTE IMMEDIATELY (see below) before closing the terminal.
# → init.sh refuses to re-run if Vault is already initialized.

# 3. Unseal (run every time Vault restarts)
./scripts/unseal.sh
# → Prompts interactively for 2 of 3 shares. Keys never echo.

# 4. Verify
./scripts/status.sh
# → Should show sealed=false, initialized=true
```

## Shamir distribution plan — DO THIS WITHIN 10 MINUTES OF `init.sh`

| Share | Custody location           | Format                                     | Rationale                                  |
| ----- | -------------------------- | ------------------------------------------ | ------------------------------------------ |
| 1     | **iPad**                   | Apple Notes — encrypted note               | Primary device, biometric + passcode gated |
| 2     | **iPhone**                 | 1Password or Apple Notes — encrypted note  | Second device, different custody chain     |
| 3     | **Paper in physical safe** | Handwritten, labeled `NOIZY-VAULT-SHARE-3` | Offline backup — survives device loss      |

**Root token** (separate from shares): 1Password vault. **Revoke after first auth method is configured** (Cloudflare Access OIDC, see below). Root tokens are for bootstrap only.

### Why 3-of-2?

- **Lose any 1 device** → remaining 2 unseal Vault. Continuity preserved.
- **Attacker compromises 1 device** → they cannot unseal. Need 2.
- **Attacker compromises 2 devices simultaneously** → this is your worst-case; detect via anomaly monitoring on Cloudflare Access.
- **Don't pick 5-of-3 unless you have 5 truly independent custody locations.** Otherwise it's security theater.

## What's NOT done yet (future compartments)

| Compartment | What ships                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| **#4**      | Cloudflare Tunnel + Access fronting Vault on `vault.noizy.ai` (loopback stays, reach is via CF)                |
| **#5**      | OIDC auth method wired to Cloudflare Access — root token revoked                                               |
| **#6**      | First secrets engine: KV-v2 at `noizy/` mount, migrate `NOIZY_API_KEY` + `ANTHROPIC_API_KEY` from `.env` files |
| **#7**      | `tfe` + `vault` Terraform providers wire TFC to pull secrets from Vault (goodbye `wrangler secret put`)        |
| **#8**      | Dynamic DB creds for Supabase + D1 — ephemeral tokens for agents                                               |
| **#9**      | Vault audit device → noizy-ledger (every secret access logged immutably)                                       |

## Safety contracts

- **Never commit unseal keys or root tokens.** `.gitignore` guards standard patterns but _you_ are the last line of defense.
- **Never expose `:8200` beyond loopback** — all remote reach goes through Cloudflare Tunnel + Access.
- **Never delete the `noizy-vault-data` Docker volume** without first taking a `vault operator raft snapshot save`.
- **Never run `init.sh` twice** — it refuses, but don't tempt it.
- **Key rotation** is a Vault _rekey_ operation (`vault operator rekey`), not a re-init. Different procedure, non-destructive.

## Recovery scenarios

| Failure                  | Recovery                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Container crashes        | `docker compose up -d` → `./scripts/unseal.sh` → back up                                                                                 |
| Lose iPad (share 1)      | Unseal with iPhone + paper. Optionally `vault operator rekey` to generate new 3/2 split.                                                 |
| Lose iPhone (share 2)    | Same — iPad + paper unseals.                                                                                                             |
| Safe destroyed (share 3) | Unseal with iPad + iPhone. Urgently rekey.                                                                                               |
| Lose 2 of 3              | **Permanent seal.** Restore from raft snapshot if you have one; otherwise rebuild + re-enroll all secrets. This is why snapshots matter. |
| GOD HDD dies             | Restore Docker volume from Time Machine / snapshot. Same unseal shares work.                                                             |

## Cost

| Line item            | Cost                                |
| -------------------- | ----------------------------------- |
| Vault OSS license    | $0                                  |
| Docker on GOD        | $0 (already running)                |
| Storage (Raft data)  | ~1 GB free on GOD                   |
| Operational overhead | You (10 min/month max, mostly zero) |
| **Total**            | **$0/month**                        |

Compare: HCP Vault Dedicated production tier ≈ $900/month for features you don't need at current scale.
