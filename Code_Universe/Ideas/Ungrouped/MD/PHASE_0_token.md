# PHASE 0 · CLOUDFLARE API TOKEN

**Goal:** create ONE API token that can reach BOTH empire accounts, install it into the empire's environment, and prove it works.
**Gate for:** every phase after this. No token = no alignment.
**Time:** 8 minutes in the Cloudflare dashboard + 2 minutes on GOD.local.
**Reversible:** yes — rotate or delete the token at any time.

---

## ✈️ Flight plan

```
1. Create token   (Cloudflare dashboard · 5 min)
2. Install token  (.env on GOD.local · 2 min)
3. Verify token   (tools/verify_token.sh · 30 sec)
4. Record proof   (append Phase 0 completion to INVENTORY.md)
```

---

## 1 · Create the token

**URL:** https://dash.cloudflare.com/profile/api-tokens
Sign in as rsp@noizy.ai (NOT Fishmusicinc — tokens belong to the user, not the account; scope is applied per account).

**Click:** `Create Token` → `Create Custom Token` (bottom of the page, not the presets).

### Token name

```
NOIZY Empire Alignment · RSP_001 · 2026-04
```

Name it for yourself. Rotate after Phase 5.

### Permissions — exactly these, no more, no less

| Scope       | Permission                   | Access | Why                                       |
| ----------- | ---------------------------- | ------ | ----------------------------------------- |
| **Account** | Account Settings             | Read   | list accounts, verify target              |
| **Account** | Workers Scripts              | Edit   | deploy/update/delete Workers              |
| **Account** | Workers KV Storage           | Edit   | migrate KV namespaces + keys              |
| **Account** | D1                           | Edit   | export/import D1 databases                |
| **Account** | Workers R2 Storage           | Edit   | enable + migrate R2 (future)              |
| **Account** | Workers Builds Configuration | Edit   | pipelines (optional — include for future) |
| **Zone**    | Zone                         | Read   | enumerate zones on each account           |
| **Zone**    | DNS                          | Edit   | flip DNS records during Phase 4 rebinding |

> **Do NOT add:** `Account Memberships`, `User Details`, `Billing`, `Stream`, `Access:Apps`. These widen the blast radius without serving the alignment. If a later phase needs them, issue a scoped token for that phase.

### Account resources — BOTH accounts

Under "Account Resources":

```
Include · Specific account · Fishmusicinc          (2446d788cc4280f5ea22a9948410c355)
Include · Specific account · rsp@noizy.ai          (5f36aa9795348ea681d0b21910dfc82a)
```

This is the critical step. One token, both accounts. If the token is accidentally scoped to "All accounts," rotate immediately — too broad.

### Zone resources

```
Include · Specific zone · noizy.ai
```

(Add other zones if the account holds them: `noizyfish.com`, `noizykidz.com`, `noizylab.ca`, `noizyvox.com`, `theaquarium.com`, `thewisdomproject.com`. During Phase 4 rebinding, DNS may need editing on several zones.)

### Client IP address filtering

Leave empty. Binding to GOD.local's IP is tempting but the IP changes; lock it down post-migration instead.

### TTL

```
Start:  now
End:    2026-05-31  (6-week window for the whole alignment)
```

Finite TTL forces rotation discipline. Extend if Phase 5 isn't complete by end of May.

### Create

Click `Continue to summary` → review the permissions table matches the list above → click `Create Token`.

**COPY THE TOKEN IMMEDIATELY.** It is shown once. It starts with the standard CF token prefix and is ~40 characters.

---

## 2 · Install the token

On GOD.local:

```bash
# Append to the empire .env (NOT committed to git per .gitignore)
echo "CLOUDFLARE_API_TOKEN=<paste-token-here>" >> /Users/m2ultra/NOIZYANTHROPIC/.env

# Also export in current shell so this session can use it
export CLOUDFLARE_API_TOKEN=<paste-token-here>

# (Optional) Install as a wrangler secret for the GABRIEL Worker too, so
# Worker-side code can call the CF API for self-administration:
cd /Users/m2ultra/NOIZYANTHROPIC/cloudflare/workers/gabriel
npx wrangler secret put CLOUDFLARE_API_TOKEN
# (paste when prompted)
```

**Never commit the token.** Confirm `.env` is in `.gitignore`:

```bash
grep -E '^\.env$' /Users/m2ultra/NOIZYANTHROPIC/.gitignore
# should print: .env
```

---

## 3 · Verify the token

```bash
bash /Users/m2ultra/NOIZYANTHROPIC/DIRECTORY/CLOUDFLARE_ALIGNMENT/tools/verify_token.sh
```

**Expected output** (any deviation is a blocker for Phase 1):

```
→ Verifying token...
"active"
"<token-id-uuid>"

→ Accessing Fishmusicinc (2446d788cc4280f5ea22a9948410c355)...
true
"Fishmusicinc"

→ Accessing rsp@noizy.ai (5f36aa9795348ea681d0b21910dfc82a)...
true
"<account-name>"     ← first time this session will see the target account's canonical name

→ D1 count · Fishmusicinc: 6
→ D1 count · rsp@noizy.ai: <N>     ← previously unknown; this is the first hard number we'll have

✓ Verification complete.
```

### If it fails

| Symptom                                 | Meaning                                                       | Fix                                                |
| --------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| `"status":"expired"` or `"invalid"`     | token not created correctly                                   | recreate from step 1; confirm TTL is in the future |
| `"Unauthorized"` on Fishmusicinc        | token missing that account in "Account Resources"             | edit token in dashboard; add account               |
| `"Unauthorized"` on rsp@noizy.ai        | same — account missing from scope                             | edit token                                         |
| `"Insufficient permissions"` on D1 list | D1 scope set to `Read` but code needs `Edit` for later phases | edit token permissions                             |
| `curl: (28) Connection timed out`       | GOD.local can't reach api.cloudflare.com                      | firewall / VPN issue, not a token problem          |

---

## 4 · Record proof

Once verification is clean, add a completion line to INVENTORY.md:

```bash
cat >> /Users/m2ultra/NOIZYANTHROPIC/DIRECTORY/CLOUDFLARE_ALIGNMENT/INVENTORY.md <<'EOF'

---

## ✅ Phase 0 complete · $(date +%Y-%m-%d)

- Token created: <token-id-prefix>
- Both accounts verified reachable
- Target D1 count: <N>
- Next: PHASE_1_target_enum.md
EOF
```

---

## What I can do the moment Phase 0 is green

The moment `verify_token.sh` succeeds, tell me and I'll ship **PHASE_1_target_enum.md** in the next compartment — a full read-only enumeration of the rsp@noizy.ai account mirroring the Fishmusicinc section in INVENTORY.md. After Phase 1 we'll have the drift table, and Phase 2 (data migration) becomes mechanical.

---

## 🔒 Things I will NOT do in Phase 0

- Create the token for you (requires browser OAuth to dashboard)
- Paste the token into any committed file
- Widen the token scope beyond the permissions list above
- Change the `rsp@noizy.ai` account name to "NOIZY.AI" (cosmetic — do this at Phase 5)

---

_Drafted 2026-04-18 by Claude Code on GOD.local. Execute with Rob's hands on the Cloudflare dashboard; rest runs on GOD._
