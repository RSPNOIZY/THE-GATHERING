# NOIZYSTREAM — Architecture Specification v1.0

**MC96ECOUNIVERSE · NOIZY EMPIRE · GORUNFREE**
Creator-controlled audio fabric. Dante for local truth. WebRTC for global reach. NOIZY control plane for rights, roles, proof, and orchestration.

---

## Folder Tree

```
noizystream/
├── control/                    # Cloudflare Worker — control/auth/proof plane
│   ├── src/
│   │   ├── index.ts            # Hono router, entry point
│   │   ├── routes/
│   │   │   ├── sessions.ts     # POST/GET/DELETE /sessions
│   │   │   ├── roles.ts        # POST/PATCH /sessions/:id/roles
│   │   │   ├── streams.ts      # POST/GET /sessions/:id/streams
│   │   │   ├── routes.ts       # POST/PATCH /sessions/:id/routes
│   │   │   ├── proof.ts        # GET /proof/:session_id (append-only audit)
│   │   │   └── health.ts       # GET /health
│   │   ├── auth/
│   │   │   ├── jwt.ts          # Token issue + validation
│   │   │   └── permissions.ts  # Permission constants + role map
│   │   ├── db/
│   │   │   ├── schema.sql      # D1 schema (sessions, roles, streams, proof_log)
│   │   │   └── queries.ts      # Typed D1 query wrappers
│   │   └── types.ts            # Shared TypeScript types
│   ├── wrangler.toml
│   └── package.json
│
├── signal/                     # Cloudflare Worker or local Node — WebRTC signaling
│   ├── src/
│   │   ├── index.ts            # WS upgrade + offer/answer relay
│   │   ├── peers.ts            # Peer registry (KV-backed)
│   │   └── rooms.ts            # Room ↔ session binding
│   ├── wrangler.toml           # Uses Durable Objects for WS state
│   └── package.json
│
├── daemon/                     # Local Node process on M2 Ultra — Dante orchestration
│   ├── src/
│   │   ├── index.ts            # HTTP + WS server on :7778
│   │   ├── dante/
│   │   │   ├── controller.ts   # Dante Controller CLI/API bridge
│   │   │   ├── routes.ts       # Route preset loader + applier
│   │   │   └── monitor.ts      # Clock stability, latency watch
│   │   ├── bridge/
│   │   │   ├── webrtc.ts       # Bridge Dante bus → WebRTC egress
│   │   │   └── aes67.ts        # AES67 interop shim (optional)
│   │   ├── control-client.ts   # Calls noizystream-control Worker
│   │   └── types.ts
│   ├── presets/                # JSON route presets (studio, cue, print, archive)
│   │   ├── studio-default.json
│   │   ├── cue-mix.json
│   │   └── print-stem.json
│   └── package.json
│
├── schema/                     # Shared types + validation (imported by all services)
│   ├── session.ts
│   ├── role.ts
│   ├── stream.ts
│   ├── route.ts
│   └── proof.ts
│
└── README.md
```

---

## Service Names

| Service | Runtime | URL / Port | Purpose |
|---------|---------|------------|---------|
| `noizystream-control` | Cloudflare Worker | `control.noizystream.io` | Session lifecycle, auth, proof |
| `noizystream-signal` | CF Worker / Durable Objects | `signal.noizystream.io` | WebRTC offer/answer relay |
| `noizystream-daemon` | Node.js on M2 Ultra | `localhost:7778` | Dante route orchestration, bridge |

---

## API Surface — Control Plane

Base URL: `https://control.noizystream.io/v1`
Auth: `Authorization: Bearer <JWT>` on all routes except `/health`.

### Sessions

```
POST   /sessions                  Create session
GET    /sessions/:id              Get session state
PATCH  /sessions/:id              Update session (title, status)
DELETE /sessions/:id              Terminate session (appends proof record)
GET    /sessions/:id/manifest     Full manifest (session + roles + streams + routes)
```

**POST /sessions**
```json
{
  "title": "RSP001 Session — Beat Review",
  "host_hvs_id": "rsp001",
  "route_preset": "studio-default",
  "record": true,
  "max_contributors": 4
}
```

**Response 201**
```json
{
  "session_id": "ses_01JTXK...",
  "created_at": "2026-03-30T14:00:00Z",
  "status": "active",
  "join_token": "eyJ...",
  "manifest_url": "/v1/sessions/ses_01JTXK.../manifest"
}
```

---

### Roles

```
POST   /sessions/:id/roles        Assign role to participant
PATCH  /sessions/:id/roles/:uid   Update role or permissions
DELETE /sessions/:id/roles/:uid   Remove participant (appends proof record)
GET    /sessions/:id/roles        List all participants and roles
```

**POST /sessions/:id/roles**
```json
{
  "hvs_id": "cb01",
  "role": "artist",
  "granted_by": "rsp001",
  "permissions": ["stream:publish", "stream:subscribe", "stream:monitor"]
}
```

---

### Streams

```
POST   /sessions/:id/streams      Register a stream (publish intent)
GET    /sessions/:id/streams      List active streams
PATCH  /sessions/:id/streams/:sid Update stream metadata or status
DELETE /sessions/:id/streams/:sid Remove stream (appends proof record)
```

**POST /sessions/:id/streams**
```json
{
  "hvs_id": "rsp001",
  "type": "audio",
  "label": "Vocal — RSP001",
  "transport": "dante",
  "dante_channel": "RSP001-Vocal-L",
  "sample_rate": 48000,
  "bit_depth": 24,
  "channels": 2
}
```

---

### Routes

```
POST   /sessions/:id/routes       Apply route (load preset or custom)
GET    /sessions/:id/routes       Get active routing state
PATCH  /sessions/:id/routes/:rid  Modify a route leg
DELETE /sessions/:id/routes/:rid  Remove a route leg
```

**POST /sessions/:id/routes**
```json
{
  "preset": "studio-default",
  "overrides": {
    "monitor_bus": "RSP001-Monitor",
    "record_bus": "RECORD-STEM-1"
  },
  "applied_by": "rsp001"
}
```

---

### Proof

```
GET    /proof/:session_id         Full proof log for session (read-only)
GET    /proof/:session_id/events  Filtered event stream
POST   /proof/verify              Verify proof bundle hash
```

Proof is **append-only** — no UPDATE or DELETE, ever.

---

### Health

```
GET    /health                    Liveness check (no auth required)
GET    /health/dante              Dante daemon heartbeat relay
GET    /health/signal             Signal service status
```

---

## Route Objects

### Session

```typescript
interface Session {
  session_id: string;           // ses_01JTXK... (ULID)
  title: string;
  status: "active" | "paused" | "ended";
  host_hvs_id: string;          // immutable after creation
  route_preset: string;
  record: boolean;
  max_contributors: number;
  created_at: string;           // ISO 8601
  ended_at: string | null;
}
```

### Role

```typescript
type RoleType =
  | "host"           // creates session, owns routing, can arm record
  | "artist"         // publishes source, receives cue/talkback, approves collaborators
  | "contributor"    // publishes return audio, receives mix-minus, no routing rights
  | "listener"       // subscribe-only, optional talkback if granted
  | "producer"       // monitors buses, toggles talkback, requests route changes
  | "admin";         // infrastructure, health, proof — no automatic creative access

interface SessionRole {
  role_id: string;              // rol_01JTXK...
  session_id: string;
  hvs_id: string;
  role: RoleType;
  permissions: Permission[];
  granted_by: string;           // hvs_id of granting participant
  granted_at: string;
  revoked_at: string | null;
}

type Permission =
  | "session:create"
  | "session:join"
  | "session:record"
  | "session:admin"
  | "stream:publish"
  | "stream:subscribe"
  | "stream:monitor"
  | "route:modify"
  | "route:view"
  | "proof:read";
```

### Stream

```typescript
type Transport = "dante" | "webrtc" | "aes67";
type StreamStatus = "pending" | "active" | "paused" | "ended";

interface Stream {
  stream_id: string;            // str_01JTXK...
  session_id: string;
  hvs_id: string;               // publisher
  label: string;
  type: "audio" | "midi" | "control";
  transport: Transport;

  // Dante streams
  dante_channel?: string;       // e.g. "RSP001-Vocal-L"
  sample_rate?: 44100 | 48000 | 96000;
  bit_depth?: 16 | 24 | 32;
  channels?: number;

  // WebRTC streams
  webrtc_peer_id?: string;
  sdp_offer?: string;

  status: StreamStatus;
  created_at: string;
  ended_at: string | null;
}
```

### Route

```typescript
interface RouteLeg {
  route_id: string;             // rte_01JTXK...
  session_id: string;
  source_stream_id: string;
  destination_bus: string;      // e.g. "RSP001-Monitor", "RECORD-STEM-1", "CUE-MIX"
  gain_db: number;              // default 0
  muted: boolean;
  applied_by: string;           // hvs_id
  applied_at: string;
  removed_at: string | null;
}

interface RoutePreset {
  preset_id: string;
  name: string;
  legs: Omit<RouteLeg, "route_id" | "session_id" | "applied_by" | "applied_at" | "removed_at">[];
}
```

---

## Proof / Audit Schema

The proof log is the **sovereign record** of everything that happened in a session. Append-only. No UPDATE or DELETE, ever — this is a NOIZY sacred invariant.

### D1 Table

```sql
CREATE TABLE proof_log (
  proof_id     TEXT PRIMARY KEY,           -- prf_01JTXK... (ULID)
  session_id   TEXT NOT NULL,
  hvs_id       TEXT NOT NULL,              -- who triggered the event
  event_type   TEXT NOT NULL,              -- see EventType below
  entity_type  TEXT NOT NULL,              -- "session" | "role" | "stream" | "route"
  entity_id    TEXT NOT NULL,              -- ID of affected object
  payload      TEXT NOT NULL,              -- JSON blob (full state snapshot)
  prev_hash    TEXT NOT NULL,              -- SHA-256 of previous proof_id's hash
  hash         TEXT NOT NULL,              -- SHA-256(proof_id + payload + prev_hash)
  created_at   TEXT NOT NULL              -- ISO 8601, set by Worker
  -- NO updated_at. NO deleted_at. This table never mutates.
);

CREATE INDEX proof_log_session_idx ON proof_log(session_id, created_at);
CREATE INDEX proof_log_hvs_idx    ON proof_log(hvs_id, created_at);
```

### Event Types

```typescript
type ProofEventType =
  // Session lifecycle
  | "session.created"
  | "session.paused"
  | "session.resumed"
  | "session.ended"
  // Participant
  | "role.assigned"
  | "role.updated"
  | "role.revoked"
  // Stream
  | "stream.registered"
  | "stream.activated"
  | "stream.paused"
  | "stream.ended"
  // Routing
  | "route.applied"
  | "route.modified"
  | "route.removed"
  // Recording
  | "record.armed"
  | "record.started"
  | "record.stopped"
  | "record.stem_published";
```

### Proof Record

```typescript
interface ProofRecord {
  proof_id: string;             // prf_01JTXK... (ULID)
  session_id: string;
  hvs_id: string;
  event_type: ProofEventType;
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;  // full snapshot of entity at event time
  prev_hash: string;
  hash: string;
  created_at: string;
}
```

### Hash Chain

Each proof record hashes the previous record's hash — forming a tamper-evident chain. Verification walks the chain and recomputes every hash.

```typescript
// Worker-side hash computation
function computeHash(proofId: string, payload: string, prevHash: string): string {
  return crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${proofId}:${payload}:${prevHash}`)
  );
}
```

---

## D1 Schema — Full

```sql
-- Sessions
CREATE TABLE sessions (
  session_id       TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active',
  host_hvs_id      TEXT NOT NULL,
  route_preset     TEXT NOT NULL DEFAULT 'studio-default',
  record           INTEGER NOT NULL DEFAULT 0,
  max_contributors INTEGER NOT NULL DEFAULT 4,
  created_at       TEXT NOT NULL,
  ended_at         TEXT
);

-- Roles
CREATE TABLE session_roles (
  role_id      TEXT PRIMARY KEY,
  session_id   TEXT NOT NULL REFERENCES sessions(session_id),
  hvs_id       TEXT NOT NULL,
  role         TEXT NOT NULL,
  permissions  TEXT NOT NULL,   -- JSON array
  granted_by   TEXT NOT NULL,
  granted_at   TEXT NOT NULL,
  revoked_at   TEXT,
  UNIQUE(session_id, hvs_id)
);

-- Streams
CREATE TABLE streams (
  stream_id    TEXT PRIMARY KEY,
  session_id   TEXT NOT NULL REFERENCES sessions(session_id),
  hvs_id       TEXT NOT NULL,
  label        TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'audio',
  transport    TEXT NOT NULL,
  config       TEXT NOT NULL,   -- JSON (dante_channel, sample_rate, etc.)
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TEXT NOT NULL,
  ended_at     TEXT
);

-- Routes
CREATE TABLE route_legs (
  route_id            TEXT PRIMARY KEY,
  session_id          TEXT NOT NULL REFERENCES sessions(session_id),
  source_stream_id    TEXT NOT NULL REFERENCES streams(stream_id),
  destination_bus     TEXT NOT NULL,
  gain_db             REAL NOT NULL DEFAULT 0,
  muted               INTEGER NOT NULL DEFAULT 0,
  applied_by          TEXT NOT NULL,
  applied_at          TEXT NOT NULL,
  removed_at          TEXT
);

-- Proof log — append only, never UPDATE or DELETE
CREATE TABLE proof_log (
  proof_id     TEXT PRIMARY KEY,
  session_id   TEXT NOT NULL,
  hvs_id       TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  payload      TEXT NOT NULL,
  prev_hash    TEXT NOT NULL,
  hash         TEXT NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE INDEX proof_log_session_idx ON proof_log(session_id, created_at);
CREATE INDEX proof_log_hvs_idx    ON proof_log(hvs_id, created_at);
```

---

## Build Phases

### Phase 1 — Studio Spine
- `noizystream-daemon` on M2 Ultra with Dante route presets
- `noizystream-control` Worker (sessions, roles, proof log)
- Session creation, stream registration, route application
- Proof chain working, hash-verified

### Phase 2 — Remote Edge
- `noizystream-signal` with Durable Objects
- WebRTC listener join via browser
- Role-based auth (JWT → permissions → subscribe)
- Mix-minus and talkback buses in route presets

### Phase 3 — Full Product
- Remote contributor publish path
- Session templates (recurring configurations)
- Multi-room / multi-network orchestration
- Dante Domain Manager integration
- AES67 bridge if third-party gear demands it

---

*GORUNFREE — 1% of all session royalties to NOIZYKIDZ. Irremovable.*
