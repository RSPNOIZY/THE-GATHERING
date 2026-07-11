# MC96 Universe Harvest — 2026-07-11

Max-depth sweep of every device connected to the M2 Ultra (GOD node), consolidating
workflows, YAML configs, automation flows, and empire documentation into THE-GATHERING.

## Contents

| Folder | What | Source |
|---|---|---|
| `github-workflows/` | All NOIZY-owned GitHub Actions workflow YAMLs (vendor repos excluded) | `~/NOIZYANTHROPIC/**` |
| `configs/` | Docker Compose, tunnel configs, MCP registries, project manifests | `~/NOIZYANTHROPIC/**` |
| `n8n-flows/` | n8n + Power Automate flow JSONs | `~/NOIZYANTHROPIC/workflows/` |
| `docs/` | Empire master docs (EMPIRE_MAP, MASTER_REGISTRY, NEXT_25_MOVES, TASKS, bibles) | `~/NOIZYANTHROPIC/` root |
| `volumes/` | Curated YAMLs harvested from all mounted volumes (<1 MB each, no media) | `/Volumes/*` |
| `inventories/` | Full file-path inventories from every scan pass | scan output |

## Naming convention
Path separators are flattened to `__` so origin is recoverable:
`repos__noizy-heaven__.github__workflows__deploy.yml` ← `repos/noizy-heaven/.github/workflows/deploy.yml`

## Excluded (bloat kept off system drive)
`node_modules`, `.git`, venvs, `__pycache__`, photo libraries, Time Machine backups,
`.Trashes`, `Library`, `dist`/`build`/`.next`/`target`, caches, vendor sample repos
(kubernetes-engine-samples, vscode-kubernetes-tools, mcpd, firebase-js-sdk).

## Scanned devices
120GB_UT · 12TB · 2TB_SGW · 3TB-GRF · 4TB BLK · 4TB Lacie · Hollywood Orchestra Mac ·
MAG 4TB · MICHAEL · NOIZY_POOL_A · NOIZY_POOL_B · Projects · GOD node home dirs
