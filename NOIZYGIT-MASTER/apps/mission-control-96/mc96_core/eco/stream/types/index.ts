/**
 * NOIZYSTREAM — Core Type Definitions
 * Single source of truth for sessions, routes, roles, proofs, and endpoints.
 */

// ── Permissions ───────────────────────────────────────────────────────────────

export type Permission =
  | 'session:create'
  | 'session:join'
  | 'session:end'
  | 'stream:publish'
  | 'stream:subscribe'
  | 'stream:monitor'
  | 'route:modify'
  | 'session:record'
  | 'session:admin';

// ── Roles ─────────────────────────────────────────────────────────────────────

export type RoleId =
  | 'host'        // Creates session, owns route template, arms recording
  | 'artist'      // Publishes source audio, receives cue/talkback
  | 'contributor' // Publishes return audio, hears mix-minus, cannot modify routing
  | 'listener'    // Listen-only by default; talkback grantable
  | 'producer'    // Monitors multiple buses, toggles talkback, can request route changes
  | 'admin';      // Infrastructure visibility; no automatic content rights

export interface Role {
  id: RoleId;
  label: string;
  permissions: Permission[];
  canPublish: boolean;
  canModifyRoutes: boolean;
  canMonitor: boolean;
  maxInstances: number | null; // null = unlimited
}

export const ROLE_DEFINITIONS: Record<RoleId, Role> = {
  host: {
    id: 'host',
    label: 'Host / Engineer',
    permissions: [
      'session:create', 'session:join', 'session:end', 'session:record', 'session:admin',
      'stream:publish', 'stream:subscribe', 'stream:monitor',
      'route:modify',
    ],
    canPublish: true,
    canModifyRoutes: true,
    canMonitor: true,
    maxInstances: 1,
  },
  artist: {
    id: 'artist',
    label: 'Artist / Primary Creator',
    permissions: ['session:join', 'stream:publish', 'stream:subscribe'],
    canPublish: true,
    canModifyRoutes: false,
    canMonitor: false,
    maxInstances: null,
  },
  contributor: {
    id: 'contributor',
    label: 'Remote Contributor',
    permissions: ['session:join', 'stream:publish', 'stream:subscribe'],
    canPublish: true,
    canModifyRoutes: false,
    canMonitor: false,
    maxInstances: null,
  },
  listener: {
    id: 'listener',
    label: 'Client / Listener',
    permissions: ['session:join', 'stream:subscribe'],
    canPublish: false,
    canModifyRoutes: false,
    canMonitor: false,
    maxInstances: null,
  },
  producer: {
    id: 'producer',
    label: 'Producer / Director',
    permissions: ['session:join', 'stream:subscribe', 'stream:monitor'],
    canPublish: false,
    canModifyRoutes: false, // can REQUEST, not execute
    canMonitor: true,
    maxInstances: null,
  },
  admin: {
    id: 'admin',
    label: 'Admin / Ops',
    permissions: ['session:admin', 'stream:monitor'],
    canPublish: false,
    canModifyRoutes: true,
    canMonitor: true,
    maxInstances: 2,
  },
};

// ── Transport Lanes ───────────────────────────────────────────────────────────

export type TransportLane = 'dante' | 'webrtc' | 'aes67';

export type SampleRate = 44100 | 48000 | 88200 | 96000;
export type BitDepth = 16 | 24 | 32;

// ── Stream Endpoints ──────────────────────────────────────────────────────────

export type EndpointDirection = 'source' | 'sink' | 'bidirectional';

export interface StreamEndpoint {
  id: string;
  label: string;
  lane: TransportLane;
  direction: EndpointDirection;
  sampleRate: SampleRate;
  bitDepth: BitDepth;
  channels: number;            // 1=mono, 2=stereo, 8=8ch, etc.
  latencyMs: number | null;    // null = not yet measured

  // Lane-specific metadata
  dante?: {
    deviceName: string;        // Dante device name as shown in Dante Controller
    channelLabel: string;      // e.g. "Mic 1"
    clockDomain?: string;
  };
  webrtc?: {
    peerId: string;
    trackId?: string;
    codec?: 'opus' | 'pcm';    // Opus for lossy, PCM for lossless WAN
    bitrate?: number;          // kbps
  };
  aes67?: {
    multicastAddress: string;  // e.g. "239.69.0.1"
    port: number;
    payloadType?: number;
  };

  active: boolean;
  ownedByUserId?: string;      // participant who registered this endpoint
}

// ── Routes ────────────────────────────────────────────────────────────────────

export interface Route {
  id: string;
  sessionId: string;
  label: string;
  sourceEndpointId: string;
  sinkEndpointIds: string[];   // fan-out supported
  lane: TransportLane;
  gain: number;                // 0.0–1.0  (1.0 = unity)
  muted: boolean;
  latencyMs: number | null;
  createdAt: number;           // epoch ms
  updatedAt: number;
  createdBy: string;           // userId
}

// Reusable route preset — no session-specific IDs
export interface RouteTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  routes: Omit<Route, 'id' | 'sessionId' | 'createdAt' | 'updatedAt' | 'createdBy'>[];
  createdAt: number;
  createdBy: string;
}

// ── Participants ──────────────────────────────────────────────────────────────

export interface Participant {
  userId: string;
  displayName: string;
  roleId: RoleId;
  joinedAt: number;
  leftAt?: number;
  endpointIds: string[];
  talkbackGranted?: boolean;   // for listener role
  tokenClaims?: Record<string, unknown>;
}

// ── Proof / Audit ─────────────────────────────────────────────────────────────

export type ProofEventType =
  | 'session.created'
  | 'session.started'
  | 'session.ended'
  | 'participant.joined'
  | 'participant.left'
  | 'participant.role_changed'
  | 'route.created'
  | 'route.modified'
  | 'route.deleted'
  | 'endpoint.registered'
  | 'endpoint.deregistered'
  | 'record.armed'
  | 'record.stopped'
  | 'talkback.granted'
  | 'talkback.revoked'
  | 'system.healthcheck'
  | 'system.error';

export interface ProofRecord {
  id: string;
  sessionId: string;
  ts: number;                           // epoch ms
  actor: string;                        // userId or 'system'
  event: ProofEventType;
  detail: Record<string, unknown>;
  prevHash?: string;                    // hash of previous ProofRecord for chain integrity
}

// ── Session ───────────────────────────────────────────────────────────────────

export type SessionState = 'idle' | 'live' | 'recording' | 'ended';
export type SessionMode =
  | 'studio'    // Dante-only local backbone
  | 'internet'  // WebRTC remote edge
  | 'bridge';   // Dante core + WebRTC edge (hybrid)

export interface Session {
  id: string;
  name: string;
  state: SessionState;
  mode: SessionMode;
  hostUserId: string;
  participants: Participant[];
  endpoints: StreamEndpoint[];
  routes: Route[];
  templateId?: string;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  proofHash?: string;  // rolling SHA-256 of latest ProofRecord
}

// Session manifest — written to disk at session end (proof bundle)
export interface SessionManifest {
  version: '1';
  session: Session;
  proof: ProofRecord[];
  exportedAt: number;
  integrityHash: string;  // SHA-256 of JSON.stringify({ session, proof })
}

// ── API Contracts ─────────────────────────────────────────────────────────────

export interface CreateSessionRequest {
  name: string;
  mode: SessionMode;
  templateId?: string;
  hostUserId: string;
}

export interface JoinSessionRequest {
  sessionId: string;
  userId: string;
  displayName: string;
  roleId: RoleId;
  token?: string;
}

export interface RegisterEndpointRequest {
  sessionId: string;
  userId: string;
  endpoint: Omit<StreamEndpoint, 'id' | 'active' | 'ownedByUserId'>;
}

export interface CreateRouteRequest {
  sessionId: string;
  label: string;
  sourceEndpointId: string;
  sinkEndpointIds: string[];
  lane: TransportLane;
  gain?: number;
}

export interface ModifyRouteRequest {
  gain?: number;
  muted?: boolean;
  sinkEndpointIds?: string[];
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  ts: number;
}

// ── WebRTC Signaling Messages ─────────────────────────────────────────────────

export type SignalingMessageType =
  | 'join'
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'peer-joined'
  | 'peer-left'
  | 'error';

export interface SignalingMessage {
  type: SignalingMessageType;
  sessionId: string;
  fromPeerId: string;
  toPeerId?: string;         // undefined = broadcast
  payload?: unknown;
}

// ── Health ────────────────────────────────────────────────────────────────────

export interface HealthStatus {
  service: string;
  status: 'ok' | 'degraded' | 'down';
  uptime: number;             // seconds
  activeSessions: number;
  lanes: {
    dante: 'up' | 'down' | 'unknown';
    webrtc: 'up' | 'down' | 'unknown';
    aes67: 'up' | 'down' | 'unknown';
  };
  ts: number;
}
