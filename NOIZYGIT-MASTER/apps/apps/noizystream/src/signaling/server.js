/**
 * NOIZYSTREAM WebRTC Signaling Server (v2 ready)
 * WebSocket-based signaling for peer connection negotiation.
 * Handles: offer/answer/ICE, role-based media permissions, session routing.
 *
 * In v1: used for dashboard WebSocket push + future WebRTC signaling.
 * In v2: full SDP offer/answer, trickle ICE, OPUS/AES67 codec negotiation.
 *
 * RSP_001 | NOIZY Empire | 2026
 */

import { WebSocketServer } from 'ws';
import { verifyToken } from '../auth/permissions.js';
import { getSession, joinSession, leaveSession } from '../sessions/manager.js';
import { logProofEvent } from '../proof/logger.js';

const peers = new Map(); // session_id → Set<{ws, participant_id, role}>

export function attachSignaling(server) {
  const wss = new WebSocketServer({ server, path: '/signal' });

  wss.on('connection', (ws, req) => {
    let participantId = null;
    let sessionId = null;

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      switch (msg.type) {

        // ── Auth + join ────────────────────────────────────────────────────
        case 'join': {
          const claims = verifyToken(msg.token);
          if (!claims) {
            ws.send(JSON.stringify({ type: 'error', code: 401, message: 'Unauthorized' }));
            return ws.close();
          }
          participantId = claims.sub;
          sessionId = msg.session_id || claims.session_id;

          const session = getSession(sessionId);
          if (!session) {
            ws.send(JSON.stringify({ type: 'error', code: 404, message: 'Session not found' }));
            return ws.close();
          }

          const participant = joinSession(sessionId, {
            participant_id: participantId,
            role: claims.role || 'LISTENER',
            display_name: msg.display_name || participantId,
          });

          // Register peer
          if (!peers.has(sessionId)) peers.set(sessionId, new Set());
          peers.get(sessionId).add({ ws, participant_id: participantId, role: participant.role });

          ws.send(JSON.stringify({
            type: 'joined',
            session_id: sessionId,
            participant_id: participantId,
            role: participant.role,
            permissions: participant.permissions,
            peers: getPeerList(sessionId, participantId),
          }));

          // Notify others
          broadcast(sessionId, {
            type: 'peer_joined',
            participant_id: participantId,
            role: participant.role,
            display_name: msg.display_name || participantId,
          }, participantId);

          logProofEvent('signaling.join', participantId, { session_id: sessionId, role: participant.role });
          break;
        }

        // ── WebRTC offer (v2) ──────────────────────────────────────────────
        case 'offer': {
          if (!canPublish(sessionId, participantId)) {
            ws.send(JSON.stringify({ type: 'error', code: 403, message: 'stream:publish required' }));
            return;
          }
          // Forward offer to target peer
          sendToPeer(sessionId, msg.target, {
            type: 'offer',
            from: participantId,
            sdp: msg.sdp,
          });
          break;
        }

        // ── WebRTC answer (v2) ─────────────────────────────────────────────
        case 'answer': {
          sendToPeer(sessionId, msg.target, {
            type: 'answer',
            from: participantId,
            sdp: msg.sdp,
          });
          break;
        }

        // ── ICE candidate trickle (v2) ─────────────────────────────────────
        case 'ice': {
          sendToPeer(sessionId, msg.target, {
            type: 'ice',
            from: participantId,
            candidate: msg.candidate,
          });
          break;
        }

        // ── Chat / talkback ────────────────────────────────────────────────
        case 'message': {
          broadcast(sessionId, {
            type: 'message',
            from: participantId,
            text: msg.text,
            ts: new Date().toISOString(),
          });
          break;
        }

        // ── Route request (producer can request, host approves) ───────────
        case 'route_request': {
          broadcast(sessionId, {
            type: 'route_request',
            from: participantId,
            route: msg.route,
            ts: new Date().toISOString(),
          }, participantId);
          logProofEvent('signaling.route_request', participantId, { session_id: sessionId, route: msg.route });
          break;
        }

        // ── Heartbeat ─────────────────────────────────────────────────────
        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong', ts: new Date().toISOString() }));
          break;
        }
      }
    });

    ws.on('close', () => {
      if (sessionId && participantId) {
        const sessionPeers = peers.get(sessionId);
        if (sessionPeers) {
          sessionPeers.forEach(p => { if (p.participant_id === participantId) sessionPeers.delete(p); });
        }
        leaveSession(sessionId, participantId);
        broadcast(sessionId, { type: 'peer_left', participant_id: participantId });
        logProofEvent('signaling.leave', participantId, { session_id: sessionId });
      }
    });
  });

  return wss;
}

function broadcast(session_id, msg, exclude_id = null) {
  const sessionPeers = peers.get(session_id);
  if (!sessionPeers) return;
  const data = JSON.stringify(msg);
  sessionPeers.forEach(({ ws, participant_id }) => {
    if (participant_id !== exclude_id && ws.readyState === 1) {
      ws.send(data);
    }
  });
}

function sendToPeer(session_id, target_id, msg) {
  const sessionPeers = peers.get(session_id);
  if (!sessionPeers) return;
  const data = JSON.stringify(msg);
  sessionPeers.forEach(({ ws, participant_id }) => {
    if (participant_id === target_id && ws.readyState === 1) ws.send(data);
  });
}

function getPeerList(session_id, exclude_id) {
  const sessionPeers = peers.get(session_id);
  if (!sessionPeers) return [];
  return Array.from(sessionPeers)
    .filter(p => p.participant_id !== exclude_id)
    .map(p => ({ participant_id: p.participant_id, role: p.role }));
}

function canPublish(session_id, participant_id) {
  const session = getSession(session_id);
  if (!session) return false;
  const p = session.participants.find(p => p.id === participant_id);
  return p?.permissions?.includes('stream:publish') || false;
}

export function getSignalingStats() {
  const stats = {};
  peers.forEach((set, session_id) => { stats[session_id] = set.size; });
  return stats;
}
