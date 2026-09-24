/**
 * NOIZYSTREAM — WebRTC Signaling Service
 * Port 7779 on GOD.local (M2 Ultra)
 *
 * Protocol: WebSocket
 * Role: relay offer/answer/ICE between peers within a session.
 *       Does NOT touch audio — pure control-plane.
 *
 * Message format: SignalingMessage (see types/index.ts)
 *
 * Flow:
 *   1. Peer connects WS, sends { type: 'join', sessionId, fromPeerId }
 *   2. Server registers peer → announces 'peer-joined' to room
 *   3. Peer A sends { type: 'offer', toPeerId: B, payload: RTCSessionDescription }
 *   4. Server relays to B
 *   5. B sends 'answer' back to A via server relay
 *   6. Both sides exchange 'ice-candidate' messages
 *   7. On disconnect: server sends 'peer-left' to room
 */

import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { SignalingMessage } from '../types';

// ── Peer registry ─────────────────────────────────────────────────────────────

interface PeerEntry {
  peerId: string;
  sessionId: string;
  ws: WebSocket;
  joinedAt: number;
}

// sessionId → Map<peerId, PeerEntry>
const rooms = new Map<string, Map<string, PeerEntry>>();

function getRoom(sessionId: string): Map<string, PeerEntry> {
  if (!rooms.has(sessionId)) rooms.set(sessionId, new Map());
  return rooms.get(sessionId)!;
}

function broadcast(sessionId: string, msg: SignalingMessage, excludePeerId?: string) {
  const room = rooms.get(sessionId);
  if (!room) return;
  const payload = JSON.stringify(msg);
  for (const [peerId, entry] of room) {
    if (peerId === excludePeerId) continue;
    if (entry.ws.readyState === WebSocket.OPEN) {
      entry.ws.send(payload);
    }
  }
}

function send(entry: PeerEntry, msg: SignalingMessage) {
  if (entry.ws.readyState === WebSocket.OPEN) {
    entry.ws.send(JSON.stringify(msg));
  }
}

// ── Server ────────────────────────────────────────────────────────────────────

const httpServer = http.createServer((_req, res) => {
  if (_req.url === '/health') {
    const peers = [...rooms.values()].reduce((n, r) => n + r.size, 0);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'NOIZYSTREAM Signaling',
      status: 'ok',
      rooms: rooms.size,
      peers,
      ts: Date.now(),
    }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  let self: PeerEntry | null = null;

  ws.on('message', (raw) => {
    let msg: SignalingMessage;
    try {
      msg = JSON.parse(raw.toString()) as SignalingMessage;
    } catch {
      ws.send(JSON.stringify({ type: 'error', sessionId: '', fromPeerId: 'server', payload: 'Bad JSON' }));
      return;
    }

    const { type, sessionId, fromPeerId, toPeerId, payload } = msg;

    // ── JOIN ──────────────────────────────────────────────────
    if (type === 'join') {
      if (!sessionId || !fromPeerId) {
        ws.send(JSON.stringify({ type: 'error', sessionId, fromPeerId: 'server', payload: 'sessionId and fromPeerId required' }));
        return;
      }

      const room = getRoom(sessionId);
      if (room.has(fromPeerId)) {
        ws.send(JSON.stringify({ type: 'error', sessionId, fromPeerId: 'server', payload: 'peerId already taken' }));
        return;
      }

      self = { peerId: fromPeerId, sessionId, ws, joinedAt: Date.now() };
      room.set(fromPeerId, self);

      // Tell newcomer who is already in the room
      const existing = [...room.keys()].filter(id => id !== fromPeerId);
      ws.send(JSON.stringify({
        type: 'peer-joined',
        sessionId,
        fromPeerId: 'server',
        payload: { peers: existing, you: fromPeerId },
      } satisfies SignalingMessage));

      // Tell everyone else the new peer arrived
      broadcast(sessionId, {
        type: 'peer-joined',
        sessionId,
        fromPeerId: 'server',
        payload: { peerId: fromPeerId },
      }, fromPeerId);

      console.log(`[signaling] ${fromPeerId} joined session ${sessionId} (${room.size} peers)`);
      return;
    }

    if (!self) {
      ws.send(JSON.stringify({ type: 'error', sessionId: '', fromPeerId: 'server', payload: 'Must join first' }));
      return;
    }

    // ── OFFER / ANSWER / ICE ──────────────────────────────────
    if (type === 'offer' || type === 'answer' || type === 'ice-candidate') {
      if (!toPeerId) {
        broadcast(sessionId, msg, fromPeerId);
        return;
      }
      const target = getRoom(sessionId).get(toPeerId);
      if (!target) {
        send(self, { type: 'error', sessionId, fromPeerId: 'server', payload: `Peer ${toPeerId} not found` });
        return;
      }
      send(target, msg);
      return;
    }

    // Unknown type — echo error
    send(self, { type: 'error', sessionId, fromPeerId: 'server', payload: `Unknown type: ${type}` });
  });

  ws.on('close', () => {
    if (!self) return;
    const { peerId, sessionId } = self;
    const room = rooms.get(sessionId);
    if (room) {
      room.delete(peerId);
      if (room.size === 0) rooms.delete(sessionId);
    }
    broadcast(sessionId, {
      type: 'peer-left',
      sessionId,
      fromPeerId: 'server',
      payload: { peerId },
    });
    console.log(`[signaling] ${peerId} left session ${sessionId}`);
  });

  ws.on('error', (err) => {
    console.error('[signaling] ws error:', err.message);
  });
});

const PORT = Number(process.env.NOIZYSTREAM_SIGNAL_PORT ?? 7779);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[NOIZYSTREAM] Signaling service → ws://0.0.0.0:${PORT}`);
});

export { httpServer as signalingServer };
