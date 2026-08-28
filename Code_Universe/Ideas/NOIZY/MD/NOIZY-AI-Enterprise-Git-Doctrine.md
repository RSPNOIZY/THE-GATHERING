# NOIZY.AI — Enterprise Git Doctrine v2.0

**Date:** March 23, 2026
**Author:** Robert Stephen Plowman
**Supersedes:** NOIZY-AI-Enterprise-Git-Alignment.md (v1.0 — org rename phase)
**Status:** ACTIVE — Canonical enterprise migration doctrine

---

## One-Line Doctrine

**noizy.ai is the authority. git.noizy.ai is the source of truth. Push enterprise-first, migrate in phases, retire GitHub safely.**

---

## Enterprise Host Model

### noizy.ai — Public/Control Root

The brand authority domain. Use for:

- Homepage and public-facing content
- Status and health endpoints
- Bootstrap documentation
- Public app entry points
- Brand authority and DNS root

### git.noizy.ai — Canonical Git Host

The only canonical Git remote. Use for:

- All repo push/pull operations
- SSH and HTTPS clone URLs
- Enterprise source of truth
- Repo permissions and branch protections
- The single answer to "where is the code?"

---

## Phased Migration

### Phase 1 — Authority (COMPLETE)

Lock the naming first.

- noizy.ai = root authority
- git.noizy.ai = Git authority
- Old GitHub org (noizy-ai) remains read/write only during migration
- D1 database records already updated (12 records, March 23, 2026)

### Phase 2 — Stand Up Git Host

Create git.noizy.ai and verify:

- Web access works (HTTPS)
- SSH access works (key-based auth)
- One test repo clones and pushes cleanly
- Org/team/permissions exist and are enforced
- Branch protections exist on main
- Secrets scanning is active

### Phase 3 — Mirror Repos

For each repo in the inventory:

- Keep old GitHub remote as `github`
- Add new enterprise remote as `enterprise`
- Push all branches and tags to enterprise
- Verify default branch is `main`
- Verify branch protections are applied
- Verify CI/CD pipelines connect to new remote

### Phase 4 — Safe Push Defaults

Set every local repo so:

- Default push target = `enterprise` (git.noizy.ai)
- Backup pull source = `github` (during migration only)
- No destructive rewrites allowed
- No force pushes to main, ever

### Phase 5 — Freeze Old World

After full validation:

- Old GitHub becomes backup/archive (read-only)
- Enterprise becomes sole canonical source
- All documentation updated to reference git.noizy.ai
- All automation (CI/CD, Linear, Cloudflare) pointed at enterprise
- All new clones use git.noizy.ai exclusively

---

## Safe Push Defaults

This is the rule:

**Push to enterprise by default. Pull from enterprise after cutover. Use GitHub only as migration backup until retired.**

During migration:

| Remote | Role |
|--------|------|
| `enterprise` | Primary push target |
| `github` | Backup pull/reference |

After migration:

| Remote | Role |
|--------|------|
| `origin` (or `enterprise`) | Sole canonical remote |
| `github` | Read-only archive, or removed |

---

## Remote Naming Convention

During migration, use explicit names — not `origin`:

| Name | Points to |
|------|-----------|
| `enterprise` | git.noizy.ai |
| `github` | Old GitHub repo |

This is clearer than pretending `origin` means the same thing everywhere.

---

## Correct Remote URLs

SSH preferred (recommended):

```
git@git.noizy.ai:NOIZYFISH/<repo>.git
```

HTTPS fallback:

```
https://git.noizy.ai/NOIZYFISH/<repo>.git
```

---

## Per-Repo Setup Commands

Run inside each repo to configure:

```bash
# Rename old origin to 'github'
git remote rename origin github 2>/dev/null || true

# Add enterprise remote (or update if exists)
git remote add enterprise git@git.noizy.ai:NOIZYFISH/$(basename "$PWD").git 2>/dev/null \
  || git remote set-url enterprise git@git.noizy.ai:NOIZYFISH/$(basename "$PWD").git

# Set enterprise as default push target
git config remote.pushDefault enterprise

# Verify
git remote -v
```

First mirror push:

```bash
git push enterprise --all
git push enterprise --tags
```

---

## Safe Global Defaults

```bash
git config --global push.default current
git config --global fetch.prune true
git config --global init.defaultBranch main
```

Per repo (applied by cutover script):

```bash
git config remote.pushDefault enterprise
```

---

## Branch Protection Doctrine

On git.noizy.ai, enforce:

- Default branch = `main`
- Force push to main = **OFF**
- Delete protected branch = **OFF**
- PR review required for critical repos
- Signed commits where possible
- Secrets scanning active
- Tags preserved on migration

---

## Repo Inventory (8 repos under NOIZYFISH)

| Repo | Purpose | Migration Status |
|------|---------|-----------------|
| **HEAVEN** | Master Worker — 454 lines, routes all subdomains | Pending |
| **NOIZYLAB** | macOS platform — SystemGuardian, audio, mail | Pending |
| **GABRIEL** | Learning Brain Worker — 6 D1 tables | Pending |
| **NOIZYVOX** | Consent Platform — artist portal, voice guardian | Pending |
| **CONDUCTOR** | Multi-AI orchestration — task templates | Pending |
| **FISHYBOOKS** | Publishing / content platform | Pending |
| **CODEMASTER** | Code education platform | Pending |
| **NOIZYKIDZ** | Music education — SHIRL + POPS podcast | Pending |

---

## Cutover Gates

Before declaring migration complete, every gate must pass:

1. git.noizy.ai is live and reachable (SSH + HTTPS)
2. One test repo clones and pushes successfully
3. Org + all 8 repos created on enterprise
4. All branches + tags mirrored
5. `remote.pushDefault=enterprise` set in every local repo
6. Branch protections verified on main for all repos
7. CI/CD pipelines reconnected to enterprise
8. Linear integration pointed at enterprise
9. Old GitHub frozen to backup/archive
10. This doctrine document updated with completion timestamps

---

## Enterprise Identity — Canonical References

| What | Canonical Value |
|------|----------------|
| Enterprise Domain | `https://noizy.ai` |
| Canonical Git Host | `git.noizy.ai` |
| Git Organization | `NOIZYFISH` |
| Master Worker Repo | `git.noizy.ai:NOIZYFISH/HEAVEN` |
| Learning Brain Repo | `git.noizy.ai:NOIZYFISH/GABRIEL` |
| Platform Tools Repo | `git.noizy.ai:NOIZYFISH/NOIZYLAB` |
| Consent Platform Repo | `git.noizy.ai:NOIZYFISH/NOIZYVOX` |
| Cloudflare Account | `2446d788cc4280f5ea22a9948410c355` |
| Primary Admin | `rsplowman@icloud.com` |

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| v1.0 | 2026-03-23 | Initial: org rename from NOIZYLAB-io to noizy-ai, 12 D1 records updated |
| v2.0 | 2026-03-23 | Full enterprise doctrine: phased migration to git.noizy.ai, push defaults, branch protection, cutover script |

---

*noizy.ai is the authority. git.noizy.ai is the source of truth. Push enterprise-first, migrate in phases, retire GitHub safely.*
