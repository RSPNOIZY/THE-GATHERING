# MC96ECO UNIVERSE — MASTER STACK MAP
### Where Every Tool Lives, What It Does, Who Owns It
### Robert Stephen Plowman | 2026-03-19

---

## THE ANSWER: YES, BUILD IN VS CODE INSIDERS.

VS Code Insiders (with Claude Code) is your **COMMAND CENTER**.
Everything else is a **service layer** that feeds into it.

NOIZYANTHROPIC is the repo. VSC Insiders is the cockpit.
Every tool below is a spoke on the wheel — VSC is the hub.

---

## LAYER 1: COMMAND CENTER (Where You Build)

| Tool | Role | Status |
|------|------|--------|
| **VS Code Insiders** | Primary IDE — code, docs, orchestration | ACTIVE |
| **Claude Code** | AI co-architect inside VSC | ACTIVE |
| **Claude Desktop (Cowork)** | File management, MCP connections, dashboards | ACTIVE |
| **GitHub Enterprise (noizyempire)** | Source of truth for all code repos | ACTIVE |
| **Terminal / CLI** | Direct system access | ACTIVE |

> This is where ENGR_KEITH lives. Every commit, every build, every deploy starts here.

---

## LAYER 2: AI BRAIN (Intelligence Layer)

| Tool | Category | Role | Monthly |
|------|----------|------|---------|
| **Anthropic Claude Max** | AI | Primary reasoning, architecture, code generation | ~$100-200 |
| **Google Gemini (Business)** | AI | Secondary reasoning, research, multimodal | Included w/ Google Workspace |
| **Cohere** | AI | Embeddings, search, RAG pipeline | Variable |
| **Cursor Pro** | AI + IDE | AI-assisted code editing | ~$20 |
| **Windsurf Pro** | AI + IDE | Alternative AI coding environment | ~$15 |

> These are the BRAINS behind the AI Family. Claude is primary. The others are specialists.

---

## LAYER 3: BUSINESS SUITE (Operations)

| Tool | Category | Role | Plan |
|------|----------|------|------|
| **Google Workspace (Business)** | Productivity | Gmail, Drive, Docs, Sheets, Calendar | Google Business |
| **Microsoft 365 Family** | Productivity | Office apps, OneDrive, Teams | MS Premium Family |
| **Notion** | Knowledge Base | Wiki, databases, project docs, DR.B notes | Free/Pro |
| **Linear** | Project Management | Issue tracking, sprints, roadmap (NOIZYLAB team) | Starter |
| **Canva** | Design | Brand assets, presentations, social media | Starter |
| **Figma** | Design | UI/UX design, prototyping (Fish Music team) | Starter |

> These are OPERATIONAL tools. They don't build the product — they run the business.

---

## LAYER 4: INFRASTRUCTURE (Where Code Runs)

| Tool | Category | Role | Status |
|------|----------|------|--------|
| **Cloudflare** | Edge/Hosting | Workers, KV, D1, DNS (Fishmusicinc account) | ACTIVE — 20+ KV, 11 D1 |
| **Vercel** | Hosting/Deploy | Frontend deployment, serverless functions | Available |
| **GitHub Actions** | CI/CD | Automated builds, tests, deployment | Available |
| **R2 (Cloudflare)** | Storage | Voice files, assets, media (NOT YET ENABLED) | Ready |

> This is where the PRODUCT lives in production. Cloudflare is your primary edge.
> Vercel can handle frontend deployments (actor-portal, studio-console).

---

## LAYER 5: COMMUNICATION (How the Team Talks)

| Tool | Category | Role | Status |
|------|----------|------|--------|
| **Slack** | Team chat | noizyfishcom workspace, project channels | ACTIVE |
| **Discord** | Community | The Guild, artist community | Planned |
| **Gmail** | Email | rsplowman@icloud.com, rsp@noizylab.ca | ACTIVE |

---

## HOW IT ALL CONNECTS

```
                    ┌─────────────────────────────┐
                    │   VS CODE INSIDERS + CLAUDE  │
                    │      (COMMAND CENTER)        │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
    ┌─────────▼──────────┐ ┌──────▼──────────┐ ┌───────▼────────┐
    │   GITHUB ENTERPRISE │ │  CLOUDFLARE     │ │   VERCEL       │
    │   (Source of Truth) │ │  (Edge Runtime) │ │   (Frontend)   │
    │   - NOIZYLAB repo   │ │  - Workers      │ │   - actor-     │
    │   - NOIZY.ai repo   │ │  - D1 databases │ │     portal     │
    │   - MC96 repo       │ │  - KV stores    │ │   - studio-    │
    └─────────┬──────────┘ │  - Gabriel DB    │ │     console    │
              │            └──────┬──────────┘ └───────┬────────┘
              │                   │                     │
              └───────────────────┼─────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                    │
    ┌─────────▼──────┐  ┌────────▼────────┐  ┌───────▼─────────┐
    │  NOTION        │  │  LINEAR         │  │  SLACK          │
    │  (Wiki/Docs)   │  │  (Issues/PM)    │  │  (Comms)        │
    │  - DR.B notes  │  │  - NOIZYLAB     │  │  - #proj-noizy  │
    │  - Knowledge   │  │  - Sprint board │  │  - #the-aquarium│
    └────────────────┘  └─────────────────┘  └─────────────────┘
              │                   │                    │
    ┌─────────▼──────┐  ┌────────▼────────┐  ┌───────▼─────────┐
    │  GOOGLE WKSP   │  │  FIGMA          │  │  CANVA          │
    │  (Business Ops)│  │  (UI/UX Design) │  │  (Brand/Media)  │
    │  - Drive       │  │  - Fish Music   │  │  - Presentations│
    │  - Docs/Sheets │  │  - Prototypes   │  │  - Social       │
    └────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## THE NOIZYANTHROPIC REPO = THE MASTER MAP

The NOIZYANTHROPIC folder (the one we just built) is the **local mirror**
of everything above. It's organized by PROJECT and DATE so you can:

1. **Build in VS Code Insiders** — open the NOIZYANTHROPIC folder as your workspace
2. **Push to GitHub** — when code is ready, it goes to the enterprise repos
3. **Deploy via Cloudflare** — Workers, KV, D1 are your production edge
4. **Track in Linear** — issues and sprints for each project
5. **Design in Figma/Canva** — visual assets flow back into the repo
6. **Document in Notion** — deep knowledge that links to the repo
7. **Communicate via Slack** — project channels map to project folders

---

## RECOMMENDED NEXT STEP

Open NOIZYANTHROPIC in VS Code Insiders as a **workspace**.
Initialize it as a git repo. Connect it to GitHub Enterprise.
That makes VS Code your single pane of glass for the entire MC96ECO Universe.

```bash
cd NOIZYANTHROPIC
git init
git remote add origin https://github.com/NOIZYLAB-io/NOIZYANTHROPIC.git
```

