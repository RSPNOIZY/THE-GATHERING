# NOIZY — Eliminate the Manual
**Automation & Sovereignty Plan · 2026-06-01**
*Free for me → free (or closer to free) for every global artist.*

---

## 0. How I work for you now (your two rules, locked in)
These are saved to my memory and apply every session from here on:

1. **🔴 YOU (external)** — every step you must do outside Claude (install, paste a
   command on your Mac, make an account, set DNS, get a key, click a button) gets
   flagged with that red marker, separately, never buried.
2. **"What you need" checklist** — every new API or MCP I propose comes with: accounts,
   keys/secrets, permissions/scopes, cost (free vs paid), and rough setup time — up front.

---

## 1. The mission (the why)
- **FOSS-first.** Keep and support the open-source tools we build on. Paid only when
  there's no real FOSS path and the value is undeniable.
- **Artist-first.** Whatever I build free for you should lower cost for artists worldwide.
- **Monetize convenience, never access.** Paid = hosting/support/done-for-you. The core
  stays free and self-hostable. Sovereignty is never paywalled.

---

## 2. ⚠️ License catch on your automation spine (act on this)
- **n8n** = *Sustainable Use License* (fair-code). Free for **your own internal use** —
  fine for the empire today. But **offering it to artists or hosting/monetizing it needs
  a paid n8n license.** It is **not** strict FOSS.
- **Activepieces** = **MIT** — fully free to embed, host, give away, monetize. No strings.
- **Windmill** = AGPLv3 — FOSS, code-first, heavier.

**Plan:** keep n8n for your private empire now (it works). Build the **public "Artist
Edition" on Activepieces (MIT)** so you can give it away and monetize hosting cleanly.

---

## 3. The tedious tasks → automation map
| Tedious task (today, manual) | Automate with | FOSS? | 🔴 External setup you'd need | Status |
|---|---|---|---|---|
| Triage important email | Gmail→Lucy scheduled task | n8n fair-code / Claude FOSS | Gmail already connected | ✅ live |
| Capture/structure notes | Lucy intake + markitdown | ✅ markitdown MIT | run installer | ⏳ ready |
| Convert PDFs/Office/images to text | markitdown MCP | ✅ MIT | run installer | ⏳ ready |
| Watch web / catalog misuse | Scrapling MCP | ✅ BSD | run installer | ⏳ ready |
| Check domain/email health | noizy.sh + DNS watcher | ✅ scripts | none | ✅ live |
| Empire health each morning | scheduled briefing | ✅ | none | ✅ live |
| Transcribe audio/voice | whisper.cpp (local) | ✅ MIT | build/download model | 🔜 to build |
| Encode/convert media | FFmpeg + HandBrake | ✅ | install | 🔜 to build |
| Render/animate | Blender headless (CLI) | ✅ GPL | install | 🔜 to build |
| Post to socials/catalog | Activepieces flows | ✅ MIT | per-platform API keys | 🔜 to build |
| Back up + commit code | safe-checkpoint.sh | ✅ | run it | ⏳ ready |
| Deploy workers/sites | wrangler / CI | mixed | Cloudflare token | ⏳ blocked on token |
| Log consent/ledger | Heaven API + oracle MCPs | your code | Heaven token | ⏳ blocked on token |

Pattern: **most of the empire is already automatable with FOSS + what you've built.**
The blockers are a handful of external steps (below), not missing software.

---

## 4. 🔴 YOUR EXTERNAL TO-DO LIST (everything only you can do)
Knock these out and big swaths of automation switch on. In priority order:

1. **🔴 Restore the Heaven token.** Set `CLOUDFLARE_API_TOKEN` + the Heaven auth secret
   (see `HEAVEN_RECOVERY.md`). *Unlocks:* the whole swarm, consent logging, deploys.
2. **🔴 Run `safe-checkpoint.sh`.** Protects 1,891 uncommitted files before anything else.
3. **🔴 Move `N8N_API_KEY` out of `.mcp.json` into `.env`.** It's a plaintext secret
   heading into git. (I can do this edit for you — just say go.)
4. **🔴 Install Xcode + Homebrew.** *Unlocks:* Aseprite build, FFmpeg, ingestion installer.
5. **🔴 Run `setup-ingest-stack.sh`.** *Unlocks:* markitdown + Scrapling in Claude.
6. **🔴 noizyfish.com:** add the M365 DNS records at NS1 **and** create the
   `rsp@noizyfish.com` mailbox before MX cutover (see `NOIZYFISH_HARDENING.md`).
7. **🔴 (Phi-4 path) Register the Entra app + assign the RBAC role** (see `ios-phi4/`).

Each line is a one-time human step. After them, the recurring work is automated.

---

## 5. Phased roadmap

**Phase 0 — done this session:** dashboard, operator console, local-AI router, agent
manual (CLAUDE.md), 3 scheduled tasks, ingestion stack wired, FOSS media map, Phi-4 kit.

**Phase 1 — close the external gaps (you + me):** the 7 items in §4. Result: swarm alive,
ingestion on, secrets safe, mail hardened.

**Phase 2 — full local-first automation (me):** add whisper.cpp transcription, FFmpeg/
Blender headless render jobs, Scrapling monitors for catalog misuse, route everything
through `noizy_router.py` so private work never leaves the M2 Ultra.

**Phase 3 — the Artist Edition (free, FOSS) + monetization:** repackage the empire's
automation on **Activepieces (MIT)** + FOSS media tools as a free, self-hostable kit any
artist can run. Monetize *hosting + support + done-for-you templates* — never the core.

---

## 6. "What you need" — the reusable checklist (I fill this every new API/MCP)
```
Integration: <name>
  Purpose:        <what manual task it kills>
  FOSS?:          <license, or "paid — why justified">
  🔴 Accounts:     <what you must sign up for>
  🔴 Keys/secrets: <what to generate, where it's stored (.env, never in code)>
  🔴 Permissions:  <scopes / RBAC roles>
  Cost:           <free tier limits / paid tier>
  Setup time:     <rough>
  Runs:           <local / cloud — sovereignty note>
```

---

## 7. Monetization sketch (artist-first, when ready)
- **Always free:** the self-hosted core — FOSS media tools, Activepieces flows, the
  router, the templates. An artist with a laptop can run the whole thing.
- **Paid (optional convenience):** hosted/managed instance, priority support, premium
  done-for-you automation packs, onboarding. Selective paid tools only where FOSS can't
  reach, and clearly labeled.
- **Guardrail:** consent + identity stay sovereign and free. We sell time saved, not access.

---

### Sources
- n8n Sustainable Use License — https://docs.n8n.io/sustainable-use-license/
- Activepieces (MIT) vs n8n vs Windmill — https://www.booleanbeyond.com/en/insights/n8n-vs-activepieces-vs-windmill-open-source-automation
