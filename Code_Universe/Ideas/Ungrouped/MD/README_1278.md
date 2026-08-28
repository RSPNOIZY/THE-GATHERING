# noizy-audio-rag

Audio RAG scaffold for NOIZY workflows:

- ingest stems and metadata into Papyrus (SQLite)
- fingerprint audio references
- build/query embeddings and FAISS index
- mirror searchable metadata to Firestore
- connect orchestration through n8n and MC96 receipt stubs

## Local stack

- VSCodium
- Continue
- Ollama
- MC96
- Local MCP Mesh
- Supersonic NOIZYBEAST IDE

## IDE layer

- VSCodium
- Continue
- Terminal
- GitKraken
- Local MCP Dashboard

## Quick start

1. Copy `.env.example` to `.env` and fill values.
2. Initialize Papyrus schema:
   - `sqlite3 papyrus/papyrus.db < papyrus/schema.sql`
3. Run ingest/embedding scripts as needed.
4. Run voice-first operator presets:
   - `npm run autonomy:center -- 1`

## Accessible autonomy

- See `docs/ACCESSIBLE_AUTONOMY_SETUP.md` for low-typing and Talon-friendly operation.
- See `docs/FOSS_GOLAND_JBANG_STACK.md` for GoLand + JBang FOSS operator setup.
- VSCodium task presets are available in `.vscode/tasks.json`.

## Layout

- `config/audio_rag.yaml`: pipeline settings
- `config/agent_modes.yaml`: autonomous runtime modes and guardrails
- `config/mcp_adapter_contracts.yaml`: MCP adapter I/O contracts and policy
- `config/local_apps_mesh.yaml`: local app integration mesh profile
- `papyrus/`: schema + local SQLite database
- `ingest/`: ingest + fingerprint + metadata writers
- `embeddings/`: embedding/index/query scripts
- `firestore/`: metadata mirroring notes/scripts
- `n8n/`: automation workflow export
- `mc96/`: receipt integration stubs

## Sync flow

Downloads  
↓  
INBOX  
↓  
QUARANTINE  
↓  
VALIDATED  
↓  
CANONICAL

## Governance execution chain

MC96  
governs  
↓  
NOIZYBEAST IDE  
↓  
Agents  
↓  
Storage  
↓  
Search  
↓  
Action

## Operating doctrine

- Raw Assets Stay Local
- Metadata Syncs
- Vectors Mirror
- Receipts Rule
- MC96 Governs

## Long-horizon mandate

- 40 years retention horizon
- 34 TB scale target
- artist sovereignty
- voice sovereignty
- local-first
- AI-native
- future-proof

## Chief Architect remit

- schema
- standards
- strategy
- design

## Research Director remit

- deep search
- knowledge
- documentation

## Operations focus

- deployment
- migration
- D1
- R2
- Cloudflare

## Archivist remit

- preserve catalogs
- maintain receipt history
- enforce lineage continuity
- catalog
- metadata
- classification

## Papyrus core

Papyrus  
│  
├── SQLite  
├── FAISS  
├── Receipt Ledger  
├── Asset Registry  
├── Metadata Registry  
├── Consent Registry  
└── Lineage Registry
