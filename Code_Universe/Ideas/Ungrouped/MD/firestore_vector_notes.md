# Firestore vector mirror notes

Rules:

- Metadata only.
- No raw stems.
- No full WAVs.
- No sensitive masters.
- No delete operations.

Canonical payload:

```json
{
  "asset_id": "",
  "sha256": "",
  "tags": [],
  "embedding": [],
  "quality_score": 0,
  "owner": ""
}
```

Collections:

Firestore
│
├── metadata
├── asset cards
├── vectors
├── approvals
├── sync state
├── quality reports
├── duplicate groups
├── agents
└── work orders
