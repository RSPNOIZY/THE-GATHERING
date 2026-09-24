# ☁️ CLOUD DRIVES & GOOGLE WORKSPACE MASTER REORGANIZATION PLAN
## Fish Music Inc. · NOIZY Ecosystem · Sovereign Cloud & Workspace Architecture

**Generated:** 2026-09-24 15:32:42
**Principal Sovereign:** Robert Stephen Plowman (`RSP_001`)
**Primary Sovereign Workspace Account:** `rspnoizy@gmail.com` (5TB Google Workspace)
**Master SQLite Registry:** [`CLOUDDRIVES_AND_GOOGLEWORKSPACE_REGISTRY.sqlite`](file:///Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/CLOUDDRIVES_AND_GOOGLEWORKSPACE_REGISTRY.sqlite)
**Unified Mapping Matrix CSV:** [`CLOUDDRIVES_UNIFIED_MAPPING_MATRIX.csv`](file:///Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/CLOUDDRIVES_UNIFIED_MAPPING_MATRIX.csv)

---

### 🌐 1. Cloud Accounts & Active Subscriptions Matrix

| Account ID | Provider | Account Email | Plan / Tier | Canonical Role & Purpose | Status |
|:---|:---|:---|:---|:---|:---|
| `GW_001_RSPNOIZY` | **Google Workspace Business Plus** | `rspnoizy@gmail.com` | 5TB Cloud Storage + Gemini Advanced | Primary Sovereign Cloud Hub · 5TB Audio Archive & Backup Mirror | `ACTIVE / PRIMARY` |
| `GD_002_RSPLOWMAN` | **Google Drive** | `rsplowman@icloud.com` | Legacy Cloud Storage | Acoustic Audio Archives, CODEMASTER Historical & Rescue Vault | `ACTIVE / CONSOLIDATING` |
| `GD_003_NOIZYLAB` | **Google Drive** | `rspnoizylab@gmail.com` | Developer Cloud Storage | NOIZYLAB R&D, Workspace Blueprints & Experimental Builds | `ACTIVE / CONSOLIDATING` |
| `GD_004_RSPPLOWMAN` | **Google Drive** | `rspplowman@gmail.com` | Personal Google Drive | Personal Documents & Historical Records | `ACTIVE / ARCHIVAL` |
| `ICLOUD_001` | **Apple iCloud+** | `rsplowman@icloud.com` | 2TB iCloud+ Family Plan | Bills & Receipts, Personal Docs, iOS Audio Sync (Logic Pro for iPad) | `ACTIVE / REAL-TIME` |
| `ONEDRIVE_001` | **Microsoft OneDrive** | `rsplowman@hotmail.com / rsplowman@live.com` | 1TB Microsoft 365 Personal | Windows 11 NOIZYWIN Microbeast Sync & Office Doc Archives | `ACTIVE` |
| `DROPBOX_001` | **Dropbox** | `rspnoizy@gmail.com` | Basic / Historical | Third-Party Audio Collaborations & Stem Ingest | `ACTIVE / INGEST` |
| `CLOUDFLARE_R2` | **Cloudflare R2 Object Storage** | `rspnoizy@gmail.com` | S3-Compatible Zero-Egress Storage | Global CDN Audio Distribution & Haptic Event Storage | `CRITICAL / ACTIVE` |
| `PROTON_DRIVE` | **Proton Drive** | `rspnoizy@gmail.com` | End-to-End Encrypted Sovereign Storage | Encrypted Sovereign Secrets, Master Passphrase Backup & Legal Vault | `CRITICAL / ACTIVE` |

---

### 📁 2. Unified 5-Bucket Sovereign File Taxonomy

| Canonical Bucket | Description & Scope | Primary Local Source | Target Cloud Destination |
|:---|:---|:---|:---|
| **`01_FINANCIAL_CRA_BILLS`** | Invoices, FISH-FUEL records, HST/GST filings, CRA corporate statements, bank proofs | `iCloud Drive (Bills & Receipts) / Google Drive (Finance)` | `Google Workspace (rspnoizy@gmail.com) + Proton Pass Vault` |
| **`02_AUDIO_MUSIC_STEMS`** | 24-bit 48kHz WAV audio stems, Logic Pro projects, acoustic masters, sound design banks | `/Volumes/12TB (_01.AUDIO, _WAVE) / Google Drive (5TB)` | `Google Workspace 5TB + Cloudflare R2 Audio Vault` |
| **`03_CODE_AND_IDENTITY`** | NOIZYGIT-MASTER monorepo, MCP servers, launchd daemons, AI agent frameworks | `/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER` | `GitHub Monorepo + Encrypted Offline Mirrors` |
| **`04_DOCUMENTS_AND_MANUALS`** | Audio hardware manuals, PDF books, research papers, medical rehabilitation logs | `iCloud Drive (Documents) / Google Drive (DOC MASTER)` | `DEVONthink Pro Global Database + Google Workspace` |
| **`05_AI_MEMORIES_AND_MODELS`** | 35 GGUF weights, Claude / ChatGPT / Gemini ideation archives, prompt engineering vaults | `Internal M2 Ultra (~/.cache/lm-studio) / D1 MemCells` | `Cloudflare D1 (447+ cells) + Local SQLite Vaults` |

---

### 🚀 3. Consolidation & Optimization Directives

1. **Google Workspace Consolidation (`rspnoizy@gmail.com`):** Maintain as the master 5TB cloud ingest repository. Relocate legacy accounts (`rsplowman@icloud.com`, `rspnoizylab@gmail.com`, `rspplowman@gmail.com`) into organized subfolders within the 5TB drive.
2. **iCloud Drive Real-Time Ingest:** Keep `Bills & Receipts` and active `Documents` synchronized between iPhone, iPad, and M2 Ultra, with weekly cold exports into `/Volumes/12TB/`.
3. **Cloudflare R2 for Global Zero-Egress Audio:** Direct all public and mobile audio streaming requests through Cloudflare R2 bucket (`s3://noizy-audio-vault`) to eliminate bandwidth costs.
4. **Proton Pass & Drive for Sovereign Zero-Knowledge Secrets:** Isolate corporate Mastercards, tax PINs, PGP keys, and recovery seeds in Proton Drive and Proton Pass.

