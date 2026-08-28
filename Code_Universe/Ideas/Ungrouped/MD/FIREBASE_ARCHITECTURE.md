# Firebase Architecture & Integration Guide

> **Principle:** Firebase/Firestore is a coordination layer and real-time mirror — **MC96 remains the source of truth. Receipts remain law.**

## Overview

This document describes how DBPredictor and related NOIZYWORLD systems integrate with Firebase/Firestore as an optional accelerator layer. Firebase provides:

- **Real-time coordination** for multi-client scenarios (UI dashboards, notifications)
- **Metadata caching** to reduce latency on repeated reads
- **Offline-first fallback** when central MC96 is temporarily unavailable
- **Client-side authorization** enforcement via Firestore Security Rules

**Critical:** Firestore is **never** the source of truth for business data. Authority flows from MC96 → Postgres → Replication → Firestore. Writes from clients are limited to self-service workflows (e.g., approval requests).

---

## Collection Schema (PLOWMAN STANDARD)

### `/receipts/{receiptId}`

**Purpose:** Immutable financial/operational records sourced from MC96.

**Access:**
- **Read:** Authenticated operators only
- **Write:** Server/IAM only (never client-written)

**Typical fields:**
```json
{
  "receiptId": "string",
  "batchId": "string",
  "operatorUid": "string",
  "status": "enum[complete, failed, pending]",
  "amount": "number",
  "lineItems": ["array"],
  "createdAt": "timestamp",
  "syncedAt": "timestamp (server-set)"
}
```

**Lifecycle:**
1. **MC96** creates receipt record
2. **Server cron** replicates receipt to Firestore `/receipts/{receiptId}`
3. **Clients** read receipts for display/audit; never modify

---

### `/assets/{assetFingerprint}`

**Purpose:** References to files stored in Cloud Storage (documents, photos, etc.).

**Access:**
- **Read:** Authenticated operators only
- **Write:** Server/IAM only (never client-written)

**Typical fields:**
```json
{
  "assetFingerprint": "string (sha256)",
  "fileName": "string",
  "mimeType": "string",
  "storagePath": "string (gs://...)",
  "receiptId": "string (foreign key)",
  "sizeBytes": "number",
  "uploadedAt": "timestamp",
  "operator": "string (uid)"
}
```

**Lifecycle:**
1. **Client** uploads file to Cloud Storage via signed URL
2. **Server trigger** validates file, computes fingerprint, writes asset record to Firestore
3. **Clients** read asset metadata; never write directly

---

### `/lineage/{eventId}`

**Purpose:** Append-only event log for audit trails and state history.

**Access:**
- **Read:** Authenticated operators only
- **Write:** Server/IAM only (immutable)

**Typical fields:**
```json
{
  "eventId": "string (uuid)",
  "receiptId": "string (foreign key)",
  "operatorUid": "string",
  "eventType": "enum[created, updated, approved, rejected, reconciled]",
  "delta": "object (state change)",
  "reason": "string",
  "createdAt": "timestamp"
}
```

**Lifecycle:**
1. **Server** writes event whenever receipt/approval status changes
2. **Clients** read lineage for audit trail; never write

---

### `/approvals/{approvalId}`

**Purpose:** Client-initiated approval requests (e.g., expense approval).

**Access:**
- **Read:** Operator (for self) + Server (for processing)
- **Create:** Client only (for self, with validation)
- **Update/Delete:** Server/IAM only

**Typical fields:**
```json
{
  "approvalId": "string (uuid)",
  "receiptId": "string (foreign key)",
  "operatorUid": "string (requestor)",
  "createdBy": "string (uid, must equal operatorUid)",
  "status": "enum[draft, pending, approved, rejected]",
  "requestedAt": "timestamp",
  "reason": "string",
  "createdAt": "timestamp (server-set)"
}
```

**Client create rule:**
```
allow create: if request.auth != null
  && request.resource.data.operatorUid == request.auth.uid
  && request.resource.data.createdBy == request.auth.uid
  && request.resource.data.status in ['pending', 'draft']
  && request.resource.data.approvalId == approvalId
  && request.resource.data.receiptId is string
  && request.resource.data.reason is string
  && request.resource.data.reason.size() <= 1000
  && request.resource.data.keys().hasOnly([
       'approvalId', 'receiptId', 'operatorUid', 'createdBy', 'status', 'reason', 'createdAt'
     ])
```

**Lifecycle:**
1. **Client** creates approval request for own UID
2. **Server** validates, may move status to `pending` or `approved`
3. **Client** polls for status change
4. **Server** never deletes; only state transitions

---

## MCP (Model Context Protocol) Configuration

Firebase MCP server provides Copilot AI with Firestore/Storage access for analysis and automation:

```json
{
  "firebase": {
    "command": "npx",
    "args": [
      "-y",
      "firebase-tools@latest",
      "mcp",
      "--dir",
      "${FIREBASE_PROJECT_DIR}",
      "--only",
      "firestore,storage"
    ]
  }
}
```

**Hardening principles:**
- ✅ **Include:** `firestore,storage` (metadata + file references)
- ❌ **Exclude:** `auth` (admin user management stays server-side)
- ❌ **Exclude:** `database` (RTDB is deprecated; use Firestore)
- ❌ **Exclude:** `functions` (deployments are CI/CD responsibility)

**Credential flow:**
1. MCP uses `GOOGLE_APPLICATION_CREDENTIALS` (ADC)
2. Service account should use scoped permissions (avoid `roles/firebase.admin`)
3. Server-side only; never expose credentials to client

---

## Firestore Security Rules (PLOWMAN STANDARD)

All rules default to `allow read, write: if false` — open-by-exception.

### Key principles

1. **Default-closed:** Every collection/document starts `deny all`
2. **Authenticated operators:** Most rules require `request.auth != null`
3. **Server-written:** `/receipts`, `/assets`, `/lineage` are write-protected
4. **Client self-service:** `/approvals` allows self-initiated requests only
5. **Immutable core:** No updates/deletes on financial records; only state transitions via server

### Validation examples

**Approval creation (self-only):**
```
allow create: if request.auth != null
  && request.resource.data.operatorUid == request.auth.uid
  && request.resource.data.createdBy == request.auth.uid
  && request.resource.data.approvalId == approvalId
  && request.resource.data.receiptId is string
  && request.resource.data.reason is string
  && request.resource.data.reason.size() <= 1000
```

**Read access (auth-only):**
```
allow read: if request.auth != null
```

---

## Deployment & Verification

### Deploy Firestore Rules

```bash
# Install Firebase CLI (if not present)
npm install -g firebase-tools

# Authenticate
firebase login

# Test rules locally (recommended)
firebase emulators:start --only firestore

# Deploy to production
firebase deploy --only firestore:rules
```

### Verify collection structure

```bash
# List collections in Firestore (requires gcloud CLI)
gcloud firestore collections list --database='(default)'

# View a sample receipt
gcloud firestore documents get /receipts/SAMPLE_ID --database='(default)'
```

---

## Integration with MC96 (Receipts Authority)

### Replication workflow

```
MC96 (Postgres)
  ↓ [server-side cron/webhook]
Firestore receipts/{receiptId}
  ↓ [Realtime SDK]
Client app (read-only)
```

### Server-side sync (pseudocode)

```typescript
// On MC96 receipt write (server-only)
async function replicateReceiptToFirestore(receipt: Receipt) {
  const firestoreReceipt = {
    receiptId: receipt.id,
    batchId: receipt.batchId,
    operatorUid: receipt.operatorUid,
    status: receipt.status,
    amount: receipt.amount,
    lineItems: receipt.lineItems,
    createdAt: receipt.createdAt,
    syncedAt: new Date(),
  };

  await firestore
    .collection('receipts')
    .doc(receipt.id)
    .set(firestoreReceipt, { merge: false });
}
```

---

## Real-time coordination with PocketBase

For offline-first field nodes, use **PocketBase** as a local-authority cache:

```
PocketBase (local)
  ↔ [sync via API]
MC96 (central authority)
  ↔ [replication]
Firestore (client mirror)
```

**PocketBase roles:**
- Authority for field operations (receipts created offline)
- Syncs back to MC96 when online
- Clients in field can read PocketBase, fall back to Firestore when syncing

---

## Testing

### Unit test example (Security Rules)

```javascript
// Emulator setup
const db = initializeTestEnvironment({
  projectId: 'test-project',
});

// Test: authenticated operator can read receipts
await assertSucceeds(
  db.authenticatedContext({ uid: 'operator-1' })
    .firestore()
    .collection('receipts')
    .doc('receipt-1')
    .get()
);

// Test: client cannot create receipt
await assertFails(
  db.authenticatedContext({ uid: 'operator-1' })
    .firestore()
    .collection('receipts')
    .doc('new-receipt')
    .set({ /* ... */ })
);
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Client read fails with "Permission denied" | Wrong UID or no `request.auth` | Verify user is authenticated; check Firestore rules |
| Server write timeout | Firestore quota exceeded | Check billing, enable Firestore usage notifications |
| Realtime updates don't sync | Network/offline | Add exponential backoff retry in client SDK |
| MCP cannot access Firestore | ADC not set or invalid | Export `GOOGLE_APPLICATION_CREDENTIALS` to service account JSON |

---

## References

- [Firebase Security Rules documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore best practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase MCP Server](https://firebase.google.com/docs/ai-assistance/mcp-server)
- [Cloud Storage Security Rules](https://firebase.google.com/docs/storage/security)

---

_Last updated: 2026-07-08_
