# Lucy Mesh

Persistent, multi-device AI operating layer for Robert Stephen Plowman.

- **Charter:** [`00-LUCY-MESH-CHARTER.md`](./00-LUCY-MESH-CHARTER.md) — read first.
- **Deploy runbook:** [`DEPLOY.md`](./DEPLOY.md) — step-by-step Phase 1 → 4.
- **Backend:** Cloudflare Worker (`src/worker.ts`) + D1 (`d1schema.sql`).
- **Frontend:** React + Vite + Tailwind PWA in [`pwa/`](./pwa).

## Layout

```
lucy-mesh/
├── 00-LUCY-MESH-CHARTER.md     # mission, non-negotiables, agents, phases
├── DEPLOY.md                    # runbook — follow top to bottom
├── d1schema.sql                 # sessions, messages, device_status, events
├── wrangler.toml                # Worker + D1 binding (UUID needs fill-in)
├── src/worker.ts                # API: /api/mesh /api/chat /api/ping /api/history
├── pwa/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example            # copy to .env.local, fill per surface
│   ├── public/
│   │   ├── manifest.json
│   │   └── sw.js
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       └── lucy.jsx            # 3-panel dashboard
└── .gitignore
```

## Status checklist

- [ ] Workers Paid plan active
- [ ] API token rotated with Workers Scripts + D1 edit
- [ ] D1 `database_id` filled into `wrangler.toml`
- [ ] `d1schema.sql` executed remotely
- [ ] `ANTHROPIC_API_KEY` secret set
- [ ] `LUCY_SHARED_SECRET` secret set (and saved for PWA)
- [ ] Worker deployed, `/api/health` returns `{ok:true}`
- [ ] `/api/chat` smoke test round-trips
- [ ] PWA built with `.env.local`
- [ ] PWA deployed to Cloudflare Pages
- [ ] `lucy.noizy.ai` custom domain active
- [ ] Installed on iPad home screen
- [ ] Installed on iPhone home screen as Gabriel
- [ ] M2 Ultra heartbeat daemon running as Shell
