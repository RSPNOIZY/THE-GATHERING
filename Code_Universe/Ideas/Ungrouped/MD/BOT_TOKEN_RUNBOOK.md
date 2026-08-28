# cf01-discord · Bot Token Provisioning Runbook

Six Discord bots, one Cloudflare Worker, six wrangler secrets. Target: Path A from [`GABRIEL/DISCORD_FLEET.md`](../../../GABRIEL/DISCORD_FLEET.md) — one deployed Worker holding 6 tokens keyed by `brand`.

**Time estimate:** ~5 min per bot × 6 = ~30 min of focused clicking, then ~2 min of `wrangler secret put` × 6.

**Prereq:** `wrangler login` completed against the NOIZYFISH Cloudflare account (`5f36aa9795348ea681d0b21910dfc82a`).

---

## One-time clicking (Discord Developer Portal — you must do this)

For each of the 6 brands below, perform all 5 sub-steps. Then come back with the 6 bot tokens and the 6 application IDs.

### The 6 brands + their env var names

| Brand application name | Env var / secret name | Target Discord server |
|---|---|---|
| **NOIZY.AI** | `DISCORD_TOKEN_NOIZY_AI` | NOIZY.AI Community |
| **NOIZYLAB** | `DISCORD_TOKEN_NOIZYLAB` | NOIZYLAB Workshop |
| **DREAMCHAMBER** | `DISCORD_TOKEN_DREAMCHAMBER` | DreamChamber |
| **NOIZYVOX** | `DISCORD_TOKEN_NOIZYVOX` | NOIZYVOX |
| **FISHMUSICINC** | `DISCORD_TOKEN_FISHMUSICINC` | Fish Music Inc. |
| **NOIZYKIDZ** | `DISCORD_TOKEN_NOIZYKIDZ` | NOIZYKIDZ |

### Per-bot steps

1. <https://discord.com/developers/applications> → **New Application** → paste the brand name from the table above.
2. **General Information** → copy **Application ID** (18-digit number) into a scratch file. You'll need it for invite URLs.
3. Left sidebar **Bot**:
   - Click **Reset Token** → copy the new bot token immediately (shown once). Start with `MT...` or `OT...`.
   - **Privileged Gateway Intents** → enable **Message Content Intent** (required for slash commands that read content) and **Server Members Intent** (required for DMs and member events).
   - **Public Bot** → OFF (NOIZY bots are not for random servers).
4. **OAuth2 → URL Generator**:
   - Scopes: check `bot` + `applications.commands`.
   - Bot Permissions: `Send Messages`, `Read Message History`, `Embed Links`, `Use Slash Commands`, `Read Messages/View Channels`. (Add `Manage Messages` only if the bot needs to pin/delete.)
   - Copy the generated URL.
5. Open the URL in a browser logged into your Discord account → select the brand's Discord server → authorize. The bot appears in the server's member list.

Repeat for all 6 brands.

---

## Register the 6 secrets against cf01-discord

```bash
cd /Users/m2ultra/NOIZYANTHROPIC/cloudflare/workers/cf01-discord

# You'll be prompted for the token value on each one — paste from the
# scratch file, press Enter. Wrangler does NOT echo the value.
npx wrangler secret put DISCORD_TOKEN_NOIZY_AI
npx wrangler secret put DISCORD_TOKEN_NOIZYLAB
npx wrangler secret put DISCORD_TOKEN_DREAMCHAMBER
npx wrangler secret put DISCORD_TOKEN_NOIZYVOX
npx wrangler secret put DISCORD_TOKEN_FISHMUSICINC
npx wrangler secret put DISCORD_TOKEN_NOIZYKIDZ
```

**Verify secrets are registered (does NOT expose values):**

```bash
npx wrangler secret list
```

Expect all 6 names in the output.

---

## Verify each token is live (Discord's side)

Discord's `GET /gateway/bot` returns shard-allocation info only when the token is valid. Copy this script, paste your 6 tokens, run it:

```bash
cat <<'EOF' > /tmp/verify-discord-tokens.sh
#!/usr/bin/env bash
set -euo pipefail
declare -A TOKENS=(
  [NOIZY_AI]="PASTE_TOKEN_HERE"
  [NOIZYLAB]="PASTE_TOKEN_HERE"
  [DREAMCHAMBER]="PASTE_TOKEN_HERE"
  [NOIZYVOX]="PASTE_TOKEN_HERE"
  [FISHMUSICINC]="PASTE_TOKEN_HERE"
  [NOIZYKIDZ]="PASTE_TOKEN_HERE"
)
for brand in "${!TOKENS[@]}"; do
  token="${TOKENS[$brand]}"
  status=$(curl -s -o /tmp/bot_$brand.json -w "%{http_code}" \
    -H "Authorization: Bot $token" \
    https://discord.com/api/v10/users/@me)
  if [[ "$status" == "200" ]]; then
    name=$(python3 -c "import json; print(json.load(open('/tmp/bot_$brand.json')).get('username','?'))")
    echo "✓ $brand → $name"
  else
    echo "✗ $brand → HTTP $status (token invalid or revoked)"
  fi
  rm -f /tmp/bot_$brand.json
done
EOF
chmod +x /tmp/verify-discord-tokens.sh
# Paste the 6 tokens, then:
bash /tmp/verify-discord-tokens.sh
# Then wipe the script — it contains secrets:
shred -u /tmp/verify-discord-tokens.sh 2>/dev/null || rm -f /tmp/verify-discord-tokens.sh
```

Expected output: `✓ NOIZY_AI → NoizyAI` (or whatever you named each bot) for all 6.

---

## Post-provisioning — wire routing in the Worker

After the 6 secrets are set, the Worker code needs a small extension to pick the right token based on an incoming `brand` parameter. See [`GABRIEL/DISCORD_FLEET.md`](../../../GABRIEL/DISCORD_FLEET.md) **Path A** for the target shape, and the follow-up compartment:

```typescript
// cloudflare/workers/cf01-discord/src/index.js — token selector (to add)
function tokenFor(brand, env) {
  const key = `DISCORD_TOKEN_${brand.toUpperCase().replace(/\./g, "_").replace(/\s/g, "_")}`;
  const token = env[key];
  if (!token) throw new Error(`no token for brand=${brand} (expected ${key})`);
  return token;
}
```

Then each `/send` request on the Worker carries `{ brand: "noizyvox", channel_id, content }`, and the Worker uses `tokenFor(brand, env)` for Discord's `Authorization: Bot ...` header.

**Ship order:** tokens first (this doc), then the routing code, then `wrangler deploy`, then a live test hitting the Worker's `/send` with each brand.

---

## Kid-safe rule — NOIZYKIDZ

Per `DISCORD_FLEET.md`:
- NEVER post consent-revocation language to `NOIZYKIDZ` channels.
- Only positive-framed `GORUNFREE Trust Clause` receipts.
- Enforce in code BEFORE sending, in the Worker. Do not rely on boss-side filtering alone.

---

## When this is fully green

- [ ] All 6 applications created in Developer Portal.
- [ ] All 6 tokens minted, invited to their servers, bot visible in member list.
- [ ] All 6 secrets set via `wrangler secret put`, `wrangler secret list` shows all 6.
- [ ] Verify script returns ✓ for all 6.
- [ ] cf01-discord Worker code extended with `tokenFor()` selector (next compartment).
- [ ] `wrangler deploy` succeeds.
- [ ] One test `/send` per brand lands in the correct server's `#test` or `#ops-status` channel.

Only after all 7 boxes check → mark Phase 2 "CF01 extended for multi-token routing" complete in `DISCORD_FLEET.md` → no ✅ before that.
