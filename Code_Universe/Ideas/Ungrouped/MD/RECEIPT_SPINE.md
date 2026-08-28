# Receipt Spine — Architecture Specification

> **Author:** RSP_001 (locked in 2026-04-09)
> **Captured by Gabriel:** 2026-04-09T16:25 · T-8 to April 17
> **Companion docs:** `CREATOR_OS_MASTER.md` · `HVS_LIVE_CONTOUR_AUv3_SPEC.md`
> **Scope:** Layer 4 (Sovereignty + Time) infrastructure that the entire Creator OS sits on top of.

The Receipt Spine is the **append-only, content-addressed, hash-chained event log** that preserves every meaningful action across the empire — voice captures, consent grants, royalty events, simulation runs, vault commits — in a way that is tamper-evident, replay-safe, and reconstructible from either of two parallel stores.

It is the **memory of NOIZY that survives Rob.**

---

## The 5 immovable rules

A receipt is **valid** only if all five hold:

1. **Schema-valid** — passes JSON Schema Draft 2020-12 validation
2. **Persisted to SQLite** — written to the WAL-backed `receipts` table in the App Group container
3. **Persisted to JSON sidecar** — written to `<container>/receipts/YYYY-MM-DD/<type>/<id>.json`
4. **Hash-chained** — `proof_hash = SHA256(prev_proof_hash || canonical_json(envelope || payload))`
5. **App Group container** — lives in the shared container (extension + host app + helper tools see the same spine)

If any of the five fail, the receipt is **rejected** before it enters the store. The writer is atomic — either all five land or none do.

---

## Storage layout

```
<App Group container>/
├── receipts.sqlite              ← WAL-backed SQLite, primary index
├── receipts.sqlite-wal          ← write-ahead log (auto-managed)
├── receipts.sqlite-shm          ← shared memory (auto-managed)
└── receipts/
    └── 2026-04-09/              ← deterministic date-based folders
        ├── voice_capture/
        │   ├── rcpt_01HX...json
        │   └── rcpt_01HX...json
        ├── consent_check/
        │   └── rcpt_01HX...json
        ├── synthesis/
        ├── vault_commit/
        ├── revocation/
        ├── royalty_event/
        ├── session_start/
        ├── session_end/
        ├── manifest_close/
        ├── lineage_link/
        ├── kill_switch/
        ├── simulation/          ← QUARANTINED — never linked from real ancestry
        └── boot/
```

The folder layout is **deterministic** so a human can navigate the filesystem and find any receipt without consulting SQLite. SQLite is the index; the filesystem is the canonical store.

---

## CloudEvents-style envelope

Every receipt has a CloudEvents-like outer wrapper and a domain-specific `data` payload:

```json
{
  "specversion": "1.0",
  "id": "rcpt_01HX2EWQ8K3J6Z7N9M4T5R6P0S",
  "source": "noizy://gabriel/auv3-hvs-live-contour",
  "type": "ai.noizy.receipt.voice_capture",
  "time": "2026-04-09T16:25:00.000Z",
  "datacontenttype": "application/json",
  "subject": "RSP_001",
  "noizy_proof": {
    "version": "0.1",
    "previous_hash": "0000000000000000000000000000000000000000000000000000000000000000",
    "proof_hash": "a3f5b9...",
    "canonicalization": "rfc8785"
  },
  "noizy_simulation": false,
  "data": {
    "session_id": "ses_2026-04-09T16-20",
    "actor_id": "RSP_001",
    "buffer_count": 147,
    "duration_ms": 30625,
    "average_authenticity": 0.962
  }
}
```

The CloudEvents fields (`specversion`, `id`, `source`, `type`, `time`, `subject`, `datacontenttype`) describe the event in a routing-friendly way. The `noizy_proof` block carries the hash chain. The `data` block is the domain-specific payload.

---

## Hash chain doctrine

```
proof_hash = SHA256(
  previous_receipt.proof_hash
  ||
  canonical_json(envelope_without_proof_hash + data)
)
```

- **Genesis receipt** (`previous_hash`) = `"0" * 64`
- **Canonical JSON** = RFC 8785 (sorted keys, no whitespace, no escaped slashes, UTF-8)
- **First receipt's `proof_hash`** = `SHA256("0"*64 || canonical(envelope+data))`
- **Each subsequent receipt** chains from the previous one

Tamper-evidence: changing any past receipt's payload invalidates every downstream hash. Replay-safety: a receipt with a `previous_hash` that doesn't match the current chain tip is rejected.

---

## Receipt type enum (fixed)

| Type | Source | Meaning |
|---|---|---|
| `boot` | any | A NOIZY component started up |
| `session_start` | AUv3 / Logic | A new recording or processing session began |
| `voice_capture` | HVS Live Contour | A vocal take was analyzed |
| `consent_check` | Consent Inspector / HUD | The Consent Gateway was queried |
| `synthesis` | Synthesis Oracle | A voice synthesis was produced |
| `vault_commit` | Wisdom Capsule / Aquarium | Content was committed to the 100-year archive |
| `revocation` | Heaven Kill Switch | A consent token was revoked |
| `royalty_event` | Heaven royalty engine | A royalty calculation/payout was logged |
| `lineage_link` | any | A new ancestry link was created (capsule → session → take) |
| `kill_switch` | RSP_001 only | Master Kill Switch was fired |
| `manifest_close` | session writer | A session manifest was finalized |
| `simulation` | sandbox | A simulated/dry-run event — **quarantined from real ancestry** |

The enum is **fixed** for v0.1. Adding a new type requires a code change + spec update + migration script.

---

## Simulation quarantine rule

```
A real receipt's `previous_hash` MUST NOT reference a receipt where `noizy_simulation == true`.
A simulation receipt MAY reference a real receipt as parent (one-way link only).
```

Enforced in `ReceiptWriter.append()` at write time. Violation = receipt rejected, never enters either store.

---

## The first milestone

> **Store 10 chained receipts in the App Group shared container, validate each against JSON Schema 2020-12, persist them to WAL-backed SQLite plus JSON sidecars, then prove lineage reconstruction from SQLite alone and from files alone.**

When that test passes, the Receipt Spine is real and every other Layer 4 feature (Aquarium Eternal Vault, Wisdom Capsule, Lineage Auto-Archive, Revoke Cascade Simulator) builds on top of it.

---

## File register

The 7 Swift files Rob asked for, all in `auv3-shared-noizy-receipts/Sources/NOIZYReceipts/`:

| File | Responsibility |
|---|---|
| `Receipt.swift` | The CloudEvents envelope + NOIZY proof block + Codable conformance |
| `ReceiptType.swift` | The fixed receipt type enum + reverse-DNS strings |
| `ReceiptHasher.swift` | RFC 8785 canonical JSON + SHA-256 hash chain |
| `ReceiptSchemaValidator.swift` | JSON Schema Draft 2020-12 validation (subset for v0.1) |
| `ReceiptStore.swift` | WAL-backed SQLite via `libsqlite3` C API |
| `ReceiptWriter.swift` | Dual-write atomic append (SQLite + JSON sidecar) with the 5-rule guard |
| `ReceiptLineageQuery.swift` | Walk ancestry, replay chain, verify integrity from either store |
