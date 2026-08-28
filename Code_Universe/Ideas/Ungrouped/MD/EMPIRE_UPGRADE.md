# NOIZY EMPIRE — MASTER UPGRADE ROADMAP

**Author:** co-architect pass for Robert Stephen Plowman · **Date:** 2026-06-01
**Rig:** Apple M2 Ultra · 192 GB · Ollama (5 models) · custom MCP swarm (Gabriel, Lucy, Shirley, voice-bridge, orchestrator)

This sequences every upgrade so each step de-risks the next. Do them in order.

---

## SEQUENCE (do not reorder — each protects the next)

### 0 · Checkpoint first  ·  `safe-checkpoint.sh`
1,891 uncommitted files is the biggest *silent* risk: one bad `git add -A` leaks
your Heaven/Cloudflare secrets into history forever. Run the secret-scanning
checkpoint **before** any other change.
```bash
bash safe-checkpoint.sh
```

### 1 · Restore Heaven  ·  `HEAVEN_RECOVERY.md`
The worker is alive (v18.1.0); your swarm is locked out because
`CLOUDFLARE_API_TOKEN` is unset and the shared auth secret isn't reaching the
MCP clients. Fix both → Gabriel/Lucy/voice-bridge regain the kernel. This is the
keystone: most automation below assumes Heaven is reachable.

### 2 · Local-first AI tiering  ·  `noizy_router.py`
Put your 192 GB to work. Route bulk/short/private tasks to local Ollama; reserve
Claude for hard reasoning; **pin sensitive catalog/identity tasks to local,
permanently.** Cuts cost and keeps sovereignty by design.
```bash
python3 noizy_router.py "tag these 40 stems by mood"          # → LOCAL_FAST
python3 noizy_router.py "royalty split for the new master"    # → LOCAL, pinned
python3 noizy_router.py "architect the licensing system"      # → ESCALATE (Claude)
```
Edit `MODELS` at the top to match `ollama list`.

### 3 · Automation spine  ·  `start-n8n.sh` + `n8n-domain-sentinel.workflow.json`
n8n is your "agentic factory" but it's down. Bring it up, import the Sentinel
(probes Heaven every 15 min, alerts on failure). This becomes the home for every
recurring loop: intake → triage → action.
```bash
bash start-n8n.sh        # → http://localhost:5678, then import the workflow
```

### 4 · Make Claude agentic  ·  `AGENT_OPS.md` (+ scheduled briefing)
Drop `AGENT_OPS.md` at your repo root as `CLAUDE.md` so **every** Claude session
boots with full empire awareness, the tool map, delegation rules, and standing
playbooks — no re-briefing. A daily autonomous health briefing is scheduled
separately so Claude works without being asked.

### 5 · Harden domains & email  ·  records below (CONFIRM INTENT FIRST)
Anti-spoofing protects your artist identity — a core design goal, not hygiene.

---

## DOMAIN & EMAIL HARDENING  ⚠️ confirm intent before applying

Your own preference: *never assume intent.* These touch production mail, so they
are written as **ready-to-apply records**, not executed. Confirm each domain's
true mail setup first, then apply in your DNS provider.

| Domain | Issue found | Action |
|---|---|---|
| `noizy.ai` | MX is Cloudflare, config expected Microsoft 365 | Decide the real mail host; align config OR MX. Don't touch MX until confirmed. |
| `noizyfish.com` | NS on NSOne (not Cloudflare), **no MX, no DMARC** | Move NS to Cloudflare *or* update config; add SPF+DMARC. Music-catalog brand = high spoof value. |
| `noizyvox.com` | DMARC present, no MX | If send-only/parked, add SPF + null-MX to harden. |
| `noizylab.ca` | healthy (ImprovMX) | Add DMARC if not enforcing. |

**Additive, safe-to-add records** (anti-spoofing; do NOT change MX with these):

```
# DMARC — start in monitor mode (p=none), then tighten to quarantine/reject
_dmarc.noizyfish.com.   TXT   "v=DMARC1; p=none; rua=mailto:dmarc@noizy.ai; fo=1"

# SPF — for a domain that should send NO mail (lock it down):
noizyfish.com.          TXT   "v=spf1 -all"

# Null-MX — explicitly declare a domain receives no mail (anti-abuse):
noizyfish.com.          MX    0 .
```
> Apply SPF/DMARC first in monitor mode, watch `rua` reports for ~1–2 weeks,
> then move `p=none` → `p=quarantine` → `p=reject`. Never jump straight to reject.

---

## SECOND-ORDER EFFECTS & RISKS (read before executing)

- **Heaven token rotation** — when you reset the Cloudflare/Heaven secret, every
  client that hardcoded the old one breaks at once. Update all MCP clients in the
  same sitting, then run `full-status` to confirm 401→200 across the board.
- **n8n is a new attack surface** — it stores credentials. Keep it bound to
  `localhost` (the start script does), never expose 5678 publicly without auth.
- **Local routing ≠ free quality** — `LOCAL_DEEP` is strong but not Claude. The
  router escalates hard tasks on purpose; resist the urge to force everything local.
- **The 1,891 files** — after the checkpoint, triage them. A green tree that's
  one giant "misc" commit is still debt. Schedule a follow-up cleanup pass.
- **DNS changes propagate slowly and break mail loudly** — that's why this doc
  prepares records instead of firing them. One confirmation from you and they apply.

---

## SCORECARD (today → target)

| System | Today | After this roadmap |
|---|---|---|
| Git working tree | 1,891 uncommitted | clean, checkpointed |
| Heaven kernel | locked out (401) | authenticated (200) |
| AI cost/privacy | all cloud | local-first, sovereignty-pinned |
| Automation | n8n down | Sentinel live, loops running |
| Claude agency | re-briefed each session | boots with full context + autonomous briefing |
| Email spoofing | noizyfish wide open | SPF/DMARC enforced |
