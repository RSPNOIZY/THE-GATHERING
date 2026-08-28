# NOIZY.AI — Enterprise Git Alignment Report

**Date:** March 23, 2026
**Executed by:** MC96ECO AI OS
**Linear Issue:** [NOI-17](https://linear.app/noizylab/issue/NOI-17/rename-github-org-noizylab-io-noizy-ai-align-all-remotes)

---

## The Problem

The MC96ECO enterprise identity was fractured across three naming conventions:

| System | Old Reference | What It Should Be |
|--------|--------------|-------------------|
| GitHub Org | `NOIZYLAB-io` | `noizy-ai` |
| Linear Issues | `NOIZYANTHROPIC` | `noizy-ai` |
| D1 Memcells | `NOIZYLAB-io` | `noizy-ai` |
| Conductor Routes | `noizylab-io` | `noizy-ai` |
| Knowledge Graph | `NOIZYLAB-io/GABRIEL` | `noizy-ai/GABRIEL` |
| Integration Manifest | `https://noizy.ai/memcells` | Already correct |

Three names for one thing. That's two too many.

---

## What Was Done (Automated — March 23, 2026)

**12 D1 database records updated** across agent-memory:

| Record | Table | Old Value | New Value |
|--------|-------|-----------|-----------|
| GIT_NOIZYLAB_IO | memcells | `NOIZYLAB-io` org | `noizy-ai` enterprise |
| MIRACLE_PROMPT_V1_FULL | memcells | `github.com/NOIZYLAB-io` | `github.com/noizy-ai` |
| MC96ECOUNIVERSE_MIRACLE_PROMPT_V1 | memcells | `github.com/NOIZYLAB-io` | `github.com/noizy-ai` |
| INFRA | memcells | `github.com/NOIZYLAB-io` | `github.com/noizy-ai` |
| TOOLS | memcells | `NOIZYLAB-io×8` | `github.com/noizy-ai` |
| ULTRA\|TOOLS | memcells | `NOIZYLAB-io×8` | `github.com/noizy-ai` |
| GABRIEL_GITHUB | memcells | `NOIZYLAB-io/GABRIEL` | `noizy-ai/GABRIEL` |
| GIT_HEAVEN | memcells | generic | `github.com/noizy-ai/HEAVEN` |
| GIT_HEAVEN_BINDINGS | memcells | no enterprise ref | Enterprise: `https://noizy.ai` |
| GIT_ABSORB_STATUS | memcells | `NOIZYLAB-io` | `noizy-ai`, alignment logged |
| GitHub route | conductor_routes | `noizylab-io` | `noizy-ai` |
| GABRIEL knowledge | knowledge | `NOIZYLAB-io/GABRIEL` | `noizy-ai/GABRIEL` |

**All mutation counts incremented. All timestamps updated.**

---

## What Rob Must Do (Manual — 5 Steps)

### Step 1: Rename the GitHub Organization

1. Go to: https://github.com/organizations/NOIZYLAB-io/settings
2. Scroll to "Rename organization"
3. Change to: `noizy-ai`
4. Confirm

GitHub will auto-redirect `NOIZYLAB-io` URLs for a grace period. But don't rely on it — update all remotes.

### Step 2: Update Git Remotes on GOD (10.90.90.10)

```bash
# Run this script on GOD to update all 8 repos at once:
for repo in HEAVEN NOIZYLAB GABRIEL NOIZYVOX CONDUCTOR FISHYBOOKS CODEMASTER NOIZYKIDZ; do
    if [ -d "$HOME/repos/$repo" ]; then
        cd "$HOME/repos/$repo"
        git remote set-url origin "https://github.com/noizy-ai/$repo.git"
        echo "✓ $repo → github.com/noizy-ai/$repo"
    else
        echo "✗ $repo not found at ~/repos/$repo"
    fi
done
```

Repeat on GABRIEL machine (10.90.90.20) if repos are cloned there.

### Step 3: Update wrangler.toml

In the HEAVEN repo, ensure `wrangler.toml` has no hardcoded org references. The deployment uses Cloudflare account ID, not GitHub org — so this may already be clean. Verify:

```bash
grep -r "NOIZYLAB-io" ~/repos/HEAVEN/wrangler.toml
```

If hits: replace `NOIZYLAB-io` → `noizy-ai`.

### Step 4: Reconnect Linear ↔ GitHub Integration

1. Go to: https://linear.app/noizylab/settings/integrations
2. Find GitHub integration
3. Disconnect current `NOIZYLAB-io` connection
4. Reconnect to `noizy-ai` org
5. Verify branch names generate correctly

### Step 5: Verify

Run this on GOD:

```bash
echo "=== Git Remote Verification ==="
for repo in HEAVEN NOIZYLAB GABRIEL NOIZYVOX CONDUCTOR FISHYBOOKS CODEMASTER NOIZYKIDZ; do
    if [ -d "$HOME/repos/$repo" ]; then
        cd "$HOME/repos/$repo"
        REMOTE=$(git remote get-url origin 2>/dev/null)
        if echo "$REMOTE" | grep -q "noizy-ai"; then
            echo "✓ $repo: $REMOTE"
        else
            echo "✗ $repo: $REMOTE (NOT ALIGNED)"
        fi
    fi
done
```

---

## Enterprise Identity — Canonical References

After alignment, every system in the MC96ECO universe uses these references:

| What | Canonical Value |
|------|----------------|
| Enterprise Domain | `https://noizy.ai` |
| GitHub Organization | `github.com/noizy-ai` |
| Master Worker Repo | `github.com/noizy-ai/HEAVEN` |
| Learning Brain Repo | `github.com/noizy-ai/GABRIEL` |
| Platform Tools Repo | `github.com/noizy-ai/NOIZYLAB` |
| Consent Platform Repo | `github.com/noizy-ai/NOIZYVOX` |
| Cloudflare Account | `2446d788cc4280f5ea22a9948410c355` |
| Primary Admin | `rsplowman@icloud.com` |
| Directive | ONE TRUTH. ONE SOURCE. ZERO FRICTION. |

---

## Repo Inventory (8 repos under noizy-ai)

| Repo | Purpose | Key Files |
|------|---------|-----------|
| **HEAVEN** | Master Worker — 454 lines, routes all subdomains | `worker.js`, `wrangler.toml` |
| **NOIZYLAB** | macOS platform — SystemGuardian, audio-processing, mail manager | `/scripts`, `/PROJECTS` |
| **GABRIEL** | Learning Brain Worker — 6 D1 tables, MIT license | `schema.sql`, `worker.js` |
| **NOIZYVOX** | Consent Platform — artist portal, voice guardian | TBD |
| **CONDUCTOR** | Multi-AI orchestration — task templates, deploy pipeline | `worker.js` |
| **FISHYBOOKS** | Publishing / content platform | TBD |
| **CODEMASTER** | Code education platform | TBD |
| **NOIZYKIDZ** | Music education — SHIRL + POPS podcast | TBD |

---

*Enterprise alignment executed by MC96ECO AI OS on March 23, 2026. 12 database records updated. 1 Linear issue created. 5 manual steps documented for Rob.*

*ONE TRUTH. ONE SOURCE. ZERO FRICTION.*
