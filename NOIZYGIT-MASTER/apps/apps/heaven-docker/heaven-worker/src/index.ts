/**
 * HEAVEN — NOIZY Empire API Gateway
 * Constitutional Infrastructure for Human Creativity
 *
 * Routes: noizy.ai/*
 * Gabriel watches every transaction.
 * HVS: 75/25. Perpetual. Locked at protocol level.
 *
 * Author: Robert Stephen Plowman / MC96ECO
 */

interface Env {
  DB_MEMORY:     D1Database;   // agent-memory — constitutional ledger
  DB_REPAIRS:    D1Database;   // noizylab-repairs
  DB_AQUARIUM:   D1Database;   // aquarium-archive
  KV_SIGNUPS:    KVNamespace;
  KV_ROYALTIES:  KVNamespace;
  KV_GUILD:      KVNamespace;
  KV_SESSIONS:   KVNamespace;
  KV_SUBMISSIONS:KVNamespace;
  KV_MEMCELL:    KVNamespace;
  ANTHROPIC_API_KEY?: string;
  NOIZY_SECRET:  string;
  NOIZY_KEY:     string;
}

// ── Validation ───────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

// ── CORS ─────────────────────────────────────────────────────────────────────
function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = origin === 'https://noizy.ai'
    || origin.startsWith('http://localhost')
    || origin.startsWith('http://127.0.0.1');
  return {
    'Access-Control-Allow-Origin':  allowed ? origin : 'https://noizy.ai',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Noizy-Key',
    'Access-Control-Max-Age':       '86400',
  };
}

function cors(request: Request): Response {
  return new Response(null, { headers: corsHeaders(request) });
}

function json(request: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  });
}

// ── Gabriel: immutable constitutional audit trail ────────────────────────────
async function gabriel(
  db: D1Database,
  event_type: string,
  actor_id: string | null,
  target_id: string | null,
  payload: unknown,
  sovereignty_check?: unknown
): Promise<string> {
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO gabriel_log (id, event_type, actor_id, target_id, payload, sovereignty_check, logged_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(
    id,
    event_type,
    actor_id ?? null,
    target_id ?? null,
    JSON.stringify(payload),
    sovereignty_check ? JSON.stringify(sovereignty_check) : null
  ).run();
  return id;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
function authenticated(request: Request, env: Env): boolean {
  const key = request.headers.get('X-Noizy-Key');
  return !!key && key === env.NOIZY_KEY;
}

// ── Router ───────────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url    = new URL(request.url);
    const method = request.method;
    const path   = url.pathname;

    if (method === 'OPTIONS') return cors(request);

    // ── Public routes ────────────────────────────────────────────────────────

    if (path === '/' || path === '/api/health') {
      return json(request, {
        status:    'alive',
        service:   'HEAVEN',
        version:   '1.0.0',
        timestamp: new Date().toISOString(),
        gabriel:   'watching',
        hvs:       '75/25 perpetual',
        portals:   ['NOIZYVOX', 'NOIZYFISH', 'NOIZYKIDZ', 'NOIZYLAB', 'WISDOM', 'myFAMILY'],
      });
    }

    // Email signup — public, no auth required
    if (path === '/api/signup' && method === 'POST') {
      const { email } = await request.json() as { email?: string };
      if (!email || !validEmail(email)) {
        return json(request, { error: 'Invalid email address' }, 400);
      }
      await env.KV_SIGNUPS.put(`signup:${email}`, JSON.stringify({
        email,
        signed_up_at: new Date().toISOString(),
        source: 'noizy.ai',
        country: request.headers.get('CF-IPCountry') ?? 'unknown',
      }));
      await gabriel(env.DB_MEMORY, 'SIGNUP', null, null, { email });
      return json(request, { ok: true });
    }

    // ── Protected routes ─────────────────────────────────────────────────────
    if (!authenticated(request, env)) {
      return json(request, { error: 'Unauthorized. Sovereignty requires credentials.' }, 401);
    }

    try {

      // ── myFamily.AI — Constitutional Foundation ──────────────────────────

      // Register a family member
      if (path === '/api/family/register' && method === 'POST') {
        const { email, display_name } = await request.json() as {
          email: string;
          display_name: string;
        };
        if (!email || !display_name) return json(request, { error: 'email and display_name required' }, 400);
        if (!validEmail(email)) return json(request, { error: 'Invalid email address' }, 400);

        const id = crypto.randomUUID();
        try {
          await env.DB_MEMORY.prepare(
            `INSERT INTO family_members (id, email, display_name, hvs_acknowledged)
             VALUES (?, ?, ?, 1)`
          ).bind(id, email, display_name).run();
        } catch (err) {
          if (err instanceof Error && err.message.includes('UNIQUE')) {
            return json(request, { error: 'Email already registered' }, 409);
          }
          throw err;
        }

        await gabriel(env.DB_MEMORY, 'FAMILY_MEMBER_REGISTERED', id, null, { email, display_name });
        return json(request, { ok: true, member_id: id });
      }

      // Store consent matrix — the constitutional declaration
      if (path === '/api/family/consent' && method === 'POST') {
        const body = await request.json() as {
          member_id:       string;
          use_cases:       string[];
          beneficiary_ids: string[];
          restrictions?:   Record<string, unknown>;
          expires_at?:     string;
        };

        if (!body.member_id || !body.use_cases?.length || !body.beneficiary_ids?.length) {
          return json(request, { error: 'member_id, use_cases, and beneficiary_ids required' }, 400);
        }

        const id         = crypto.randomUUID();
        const c2pa_stamp = `c2pa:noizy:consent:${id}:${Date.now()}`;

        await env.DB_MEMORY.prepare(
          `INSERT INTO consent_matrix
             (id, member_id, use_cases, restrictions, beneficiary_ids, c2pa_stamp, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          body.member_id,
          JSON.stringify(body.use_cases),
          JSON.stringify(body.restrictions ?? {}),
          JSON.stringify(body.beneficiary_ids),
          c2pa_stamp,
          body.expires_at ?? null
        ).run();

        await gabriel(env.DB_MEMORY, 'CONSENT_MATRIX_STORED', body.member_id, id, {
          use_cases:        body.use_cases,
          beneficiary_count: body.beneficiary_ids.length,
          c2pa_stamp,
          perpetual:        !body.expires_at,
        });

        return json(request, { ok: true, consent_id: id, c2pa_stamp });
      }

      // Register beneficiary access
      if (path === '/api/family/beneficiary' && method === 'POST') {
        const body = await request.json() as {
          member_id:             string;
          beneficiary_member_id: string;
          access_rules?:         Record<string, unknown>;
          granted_by:            string;
        };

        if (!body.member_id || !body.beneficiary_member_id || !body.granted_by) {
          return json(request, { error: 'member_id, beneficiary_member_id, and granted_by required' }, 400);
        }

        const id = crypto.randomUUID();
        await env.DB_MEMORY.prepare(
          `INSERT INTO beneficiaries (id, member_id, beneficiary_member_id, access_rules, granted_by)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          id,
          body.member_id,
          body.beneficiary_member_id,
          JSON.stringify(body.access_rules ?? {}),
          body.granted_by
        ).run();

        await gabriel(env.DB_MEMORY, 'BENEFICIARY_GRANTED', body.granted_by, id, {
          voice_owner:   body.member_id,
          beneficiary:   body.beneficiary_member_id,
        });

        return json(request, { ok: true, beneficiary_id: id });
      }

      // ── Voice — metadata only, audio stays on M2 Ultra ──────────────────

      if (path === '/api/voice/register' && method === 'POST') {
        const body = await request.json() as {
          member_id:        string;
          file_ref:         string; // local path on M2 Ultra
          sample_rate?:     number;
          bit_depth?:       number;
          duration_seconds?: number;
          emotional_tags?:  string[];
          model_version?:   string;
        };

        if (!body.member_id || !body.file_ref) {
          return json(request, { error: 'member_id and file_ref required' }, 400);
        }

        if (body.sample_rate !== undefined && (body.sample_rate < 8000 || body.sample_rate > 192000)) {
          return json(request, { error: 'sample_rate must be between 8000 and 192000' }, 400);
        }

        const id         = crypto.randomUUID();
        const c2pa_stamp = `c2pa:noizyvox:${id}:${Date.now()}`;

        await env.DB_MEMORY.prepare(
          `INSERT INTO voice_profiles
             (id, member_id, file_ref, sample_rate, bit_depth, duration_seconds, emotional_tags, c2pa_stamp, model_version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          body.member_id,
          body.file_ref,
          body.sample_rate     ?? 48000,
          body.bit_depth       ?? 32,
          body.duration_seconds ?? null,
          JSON.stringify(body.emotional_tags ?? []),
          c2pa_stamp,
          body.model_version   ?? 'xtts_v2'
        ).run();

        await gabriel(env.DB_MEMORY, 'VOICE_PROFILE_REGISTERED', body.member_id, id, {
          file_ref:      body.file_ref,
          c2pa_stamp,
          model:         body.model_version ?? 'xtts_v2',
          note:          'audio_local_only',
        });

        return json(request, { ok: true, voice_id: id, c2pa_stamp });
      }

      // ── Messages — pre-recorded comfort, grief, milestone ───────────────

      if (path === '/api/family/message' && method === 'POST') {
        const body = await request.json() as {
          from_member_id:      string;
          to_beneficiary_ids:  string[];
          message_type:        string;
          file_ref:            string;
          duration_seconds?:   number;
          trigger_conditions?: Record<string, unknown>;
        };

        if (!body.from_member_id || !body.to_beneficiary_ids?.length || !body.message_type || !body.file_ref) {
          return json(request, { error: 'from_member_id, to_beneficiary_ids, message_type, and file_ref required' }, 400);
        }

        const id = crypto.randomUUID();
        await env.DB_MEMORY.prepare(
          `INSERT INTO messages
             (id, from_member_id, to_beneficiary_ids, message_type, file_ref, duration_seconds, trigger_conditions)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          body.from_member_id,
          JSON.stringify(body.to_beneficiary_ids),
          body.message_type,
          body.file_ref,
          body.duration_seconds ?? null,
          JSON.stringify(body.trigger_conditions ?? {})
        ).run();

        await gabriel(env.DB_MEMORY, 'MESSAGE_REGISTERED', body.from_member_id, id, {
          message_type:      body.message_type,
          beneficiary_count: body.to_beneficiary_ids.length,
        });

        return json(request, { ok: true, message_id: id });
      }

      // ── Healing sessions — biometric-triggered therapeutic protocol ──────

      if (path === '/api/heal/session' && method === 'POST') {
        const body = await request.json() as {
          beneficiary_member_id: string;
          protocol_type:         string;
          voice_message_id?:     string;
          noizyfish_track_id?:   string;
          frequency_hz?:         number;
          duration_seconds?:     number;
          biometric_before?:     Record<string, unknown>;
          biometric_after?:      Record<string, unknown>;
          outcome?:              string;
          consent_verified?:     boolean;
        };

        if (!body.beneficiary_member_id || !body.protocol_type) {
          return json(request, { error: 'beneficiary_member_id and protocol_type required' }, 400);
        }

        if (body.frequency_hz !== undefined && (body.frequency_hz <= 0 || body.frequency_hz > 20000)) {
          return json(request, { error: 'frequency_hz must be between 1 and 20000' }, 400);
        }

        if (body.duration_seconds !== undefined && body.duration_seconds <= 0) {
          return json(request, { error: 'duration_seconds must be positive' }, 400);
        }

        const id = crypto.randomUUID();
        await env.DB_MEMORY.prepare(
          `INSERT INTO healing_sessions
             (id, beneficiary_member_id, protocol_type, voice_message_id, noizyfish_track_id,
              frequency_hz, duration_seconds, biometric_before, biometric_after, outcome, consent_verified)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id,
          body.beneficiary_member_id,
          body.protocol_type,
          body.voice_message_id   ?? null,
          body.noizyfish_track_id ?? null,
          body.frequency_hz       ?? null,
          body.duration_seconds   ?? null,
          JSON.stringify(body.biometric_before ?? {}),
          JSON.stringify(body.biometric_after  ?? {}),
          body.outcome            ?? 'pending',
          body.consent_verified   ? 1 : 0
        ).run();

        await gabriel(env.DB_MEMORY, 'HEALING_SESSION_LOGGED', body.beneficiary_member_id, id, {
          protocol_type:    body.protocol_type,
          frequency_hz:     body.frequency_hz,
          outcome:          body.outcome,
          consent_verified: body.consent_verified,
        });

        return json(request, { ok: true, session_id: id });
      }

      // ── Gabriel audit trail — read events for an actor ──────────────────

      if (path.startsWith('/api/gabriel/') && method === 'GET') {
        const actor_id = path.replace('/api/gabriel/', '');
        if (!actor_id) return json(request, { error: 'actor_id required' }, 400);

        const result = await env.DB_MEMORY.prepare(
          `SELECT id, event_type, target_id, payload, logged_at
           FROM gabriel_log
           WHERE actor_id = ?
           ORDER BY logged_at DESC
           LIMIT 100`
        ).bind(actor_id).all();

        return json(request, { ok: true, actor_id, events: result.results });
      }

      // ── Royalties — KV fast path ─────────────────────────────────────────

      if (path === '/api/royalties' && method === 'POST') {
        const body = await request.json() as {
          artist_id:    string;
          track_id:     string;
          amount_cents: number;
          source:       string;
        };

        if (!body.artist_id || !body.track_id || !body.source) {
          return json(request, { error: 'artist_id, track_id, and source required' }, 400);
        }

        if (typeof body.amount_cents !== 'number' || body.amount_cents <= 0) {
          return json(request, { error: 'amount_cents must be a positive number' }, 400);
        }

        const key = `royalty:${body.artist_id}:${Date.now()}`;
        await env.KV_ROYALTIES.put(key, JSON.stringify({
          ...body,
          hvs_split:  '75/25',
          recorded_at: new Date().toISOString(),
        }));

        await gabriel(env.DB_MEMORY, 'ROYALTY_LOGGED', body.artist_id, body.track_id, {
          amount_cents: body.amount_cents,
          source:       body.source,
        });

        return json(request, { ok: true, key });
      }

      return json(request, { error: 'Route not found' }, 404);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await gabriel(env.DB_MEMORY, 'ERROR', null, null, {
        path, method, error: message,
      }).catch((logErr) => {
        console.error('Gabriel logging failed:', logErr);
      });
      return json(request, { error: 'Internal error' }, 500);
    }
  },
};
