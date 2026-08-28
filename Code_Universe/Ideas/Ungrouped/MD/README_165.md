# RSP-NOIZY

The consolidated master repo for Robert Stephen Plowman's AI operating layer.

**Read first:** [`00-MASTER-CHARTER.md`](./00-MASTER-CHARTER.md)

## Layout

```
RSP-NOIZY/
├── 00-MASTER-CHARTER.md        # mission, agents, subsystems, non-negotiables
├── README.md                    # this file
│
├── agents/                      # one directory per agent role
│   ├── gabriel/                 # iPhone voice-first capture
│   ├── lucy/                    # persistent memory (Cloudflare Worker + D1)
│   ├── cheryl/                  # TBD
│   ├── pops/                    # guardian / compliance / ethics
│   ├── engr/                    # engineering — infra, deploy, build
│   ├── keith/                   # codegen coordinator
│   ├── cbo-1/                   # TBD (Chief Brand/Business Officer?)
│   ├── heaven/                  # future-back vision & long-arc steering
│   ├── claude-ipad/             # Claude on iPad command deck
│   ├── claude-iphone/           # Claude in pocket, paired with Gabriel
│   └── claude-god/              # Claude on M2 Ultra — heavy reasoning
│
├── prompts/                     # system + user prompt library
├── decision-matrices/           # routing / escalation tables
├── decision-trees/              # branching logic for handoffs
├── deployments/                 # runbooks, cloud configs
├── react-components/            # shared UI
├── build-artifacts/             # compiled / packaged outputs
├── mcp-servers/                 # custom MCP implementations
├── session-state/               # session handoff specs
├── intelligence-matrices/       # dashboards, plots, synthesis
├── memory-sealed/               # tamper-evident memory + audit
├── voice-state-logic/           # Gabriel's voice state machines
├── engr-keys/                   # secret manifest (not secrets themselves)
├── audio-pipeline/              # capture → transcription → routing
└── docs/                        # architecture notes, ADRs, everything else
```

## First milestones

- [x] Scaffold created
- [x] Master charter v1.0 written
- [x] Lucy Mesh backend + PWA staged in `agents/lucy/`
- [ ] Cloudflare Phase 1 deployed (see `agents/lucy/DEPLOY.md`)
- [ ] Cloudflare Phase 2 (iPad PWA) live
- [ ] iPhone Gabriel node live
- [ ] M2 Ultra Shell heartbeat live
- [ ] Each agent's role defined in its own README

## Working agreement

- Nothing merges into this repo that contradicts the charter.
- Every consequential change is dated in an amendment log, not overwritten.
- Secrets never commit. Use `engr-keys/MANIFEST.md` to track what exists,
  not the values themselves.
- Pops (guardian) can pause any workflow. Honor that.
