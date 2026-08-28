# Firebase Hardening & FOSS Architecture — Implementation Plan

> **Doctrine:** Firebase/Firestore can be a mirror or coordination layer — **MC96 remains authority, receipts remain truth**.

---

## Task 1: Harden Firebase MCP Configuration

**Objective:** Restrict Firebase MCP to essential services only (`firestore,storage`). Keep `auth` out unless actively needed.

**Why:** Firebase Auth admin tools are powerful and should be managed server-side only. Exposing only Firestore/Storage limits the attack surface while maintaining metadata + asset reference capabilities.

### Deliverables

- ✅ Create `.mcp/firebase.json` with hardened MCP config
- ✅ Document in `FIREBASE_ARCHITECTURE.md`

**Status:** Completed (implemented in `.mcp/firebase.json`)

---

## Task 2: Firestore "PLOWMAN STANDARD" Security Rules

**Objective:** Implement industry-standard Firestore Security Rules (default-closed, role-based access).

**Doctrine:** Firebase/Firestore is a coordination layer, never the source of truth. MC96/Postgres is authority.

### Proposed Collection Structure

```
/firestore
 /receipts/{receiptId}           # Read by authenticated operator only. Never client-written.
 /assets/{assetFingerprint}      # Read by authenticated operator. Writes only via server/IAM.
 /lineage/{eventId}              # Event history. Operator-readable, server-written.
 /approvals/{approvalId}         # Approval requests. Client may create for self only.
```

### Rules Features

- **Default-closed:** All documents are `allow read, write: if false` by default.
- **Authenticated-only read:** `/receipts`, `/assets`, `/lineage` readable by authenticated operators.
- **Server-only writes:** Core data written only by server/IAM, never client.
- **Client self-service:** `/approvals` allows operators to create requests for their own UID.

### Deliverables

- ✅ Create `firestore.rules` with PLOWMAN STANDARD starter rules
- ✅ Document collection schema and access patterns
- ✅ Add to `FIREBASE_ARCHITECTURE.md`

**Status:** Completed (implemented in `firestore.rules`)

---

## Task 3: FOSS Upgrade Path & Architecture

**Objective:** Document preferred FOSS alternatives (Supabase, Appwrite, PocketBase) and establish a sovereign long-term architecture.

### Recommended NOIZYWORLD Layout

```
MC96 / Postgres = source of truth
Supabase = FOSS public/private app backend
PocketBase = local/offline field node
Firebase = optional compatibility mirror only
Firestore = never sole authority
```

### FOSS Comparison

| Role | Best FOSS | Why |
|------|-----------|-----|
| Firebase-style backend | **Supabase** | Open-source Firebase alternative with Postgres, Auth, Data APIs, Edge Functions, Realtime, Storage, Vector support |
| All-in-one app backend | **Appwrite** | Open-source platform with Auth, Databases, Storage, Functions, Messaging, Realtime, web hosting |
| Local/offline backend | **PocketBase** | Open-source backend in one file with realtime database, authentication, file storage, admin dashboard |

### Deliverables

- ✅ Create `FOSS_ALTERNATIVES.md` with detailed comparison and migration paths
- ✅ Document `NOIZYWORLD` preferred architecture
- ✅ Create `FIREBASE_ARCHITECTURE.md` with integration guidelines
- ✅ Add decision rules to `ARCHITECTURE.md`

**Status:** Completed (documented in `docs/FOSS_ALTERNATIVES.md` and `docs/ARCHITECTURE.md`)

---

## Implementation Timeline

1. **Phase A:** Create `.mcp/firebase.json` (hardened MCP config)
2. **Phase B:** Create `firestore.rules` (PLOWMAN STANDARD security rules)
3. **Phase C:** Create `FIREBASE_ARCHITECTURE.md` (Firebase integration guide)
4. **Phase D:** Create `FOSS_ALTERNATIVES.md` (FOSS comparison and migration paths)
5. **Phase E:** Update main `ARCHITECTURE.md` with decision rules

---

## Files to Create

- `/.mcp/firebase.json` — Hardened MCP configuration
- `/firestore.rules` — PLOWMAN STANDARD security rules
- `/docs/FIREBASE_ARCHITECTURE.md` — Firebase integration and deployment guide
- `/docs/FOSS_ALTERNATIVES.md` — FOSS comparison and migration paths
- Update `/docs/ARCHITECTURE.md` or create it with decision rules

---

## Key Principles

1. **MC96 is authority:** Receipts, user data, permissions live in MC96/Postgres first.
2. **Firebase is a mirror:** Firestore/Storage replicate metadata for faster client access.
3. **FOSS is sovereignty:** Use Supabase for long-term, self-hosted resilience.
4. **PocketBase for field:** Offline-first field nodes sync back to central authority.
5. **Minimum privilege:** MCP exposes only what's needed; Auth stays server-side.

---

_Last updated: 2026-07-08T23:45_
