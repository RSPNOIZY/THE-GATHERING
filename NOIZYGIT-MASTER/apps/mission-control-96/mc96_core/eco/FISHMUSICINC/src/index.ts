/**
 * fish.noizy.ai — FishMusicInc Catalogue & Streaming API
 * Cloudflare Worker for audio catalogue, royalty tracking, and session management
 */

export interface Env {
  FISH_DB: D1Database;
  KV_ROYALTIES: KVNamespace;
  KV_SESSIONS: KVNamespace;
  NOIZYSTREAM_URL: string;        // http://GOD.local:7778
  CONSENT_GATEWAY_URL: string;    // consent-gateway worker
}

interface CatalogueEntry {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration_ms: number;
  fingerprint_hash: string;
  c2pa_stamp: string | null;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

interface RoyaltyRecord {
  track_id: string;
  artist_id: string;
  amount_cents: number;
  source: string;
  timestamp: string;
}

// ── Router ──────────────────────────────────────────────────────────
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function err(message: string, status = 400): Response {
  return json({ ok: false, error: message }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      // ── Health ──
      if (path === "/health") {
        return json({
          service: "fish.noizy.ai",
          status: "ok",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          capabilities: ["catalogue", "royalties", "sessions", "fingerprint"],
        });
      }

      // ── Catalogue CRUD ──
      if (path === "/catalogue" && method === "GET") {
        return await listCatalogue(env, url);
      }
      if (path === "/catalogue" && method === "POST") {
        return await addTrack(env, request);
      }
      if (path.startsWith("/catalogue/") && method === "GET") {
        const id = path.split("/")[2];
        return await getTrack(env, id);
      }
      if (path.startsWith("/catalogue/") && method === "PUT") {
        const id = path.split("/")[2];
        return await updateTrack(env, id, request);
      }
      if (path.match(/^\/catalogue\/[^/]+\/archive$/) && method === "POST") {
        const id = path.split("/")[2];
        return await archiveTrack(env, id);
      }

      // ── Royalties (append-only) ──
      if (path === "/royalties" && method === "POST") {
        return await recordRoyalty(env, request);
      }
      if (path.startsWith("/royalties/") && method === "GET") {
        const artistId = path.split("/")[2];
        return await getRoyalties(env, artistId);
      }

      // ── Sessions (proxy to NOIZYSTREAM) ──
      if (path === "/sessions" && method === "GET") {
        return await proxySessions(env);
      }
      if (path === "/sessions" && method === "POST") {
        return await createSession(env, request);
      }

      // ── Search ──
      if (path === "/search" && method === "GET") {
        return await searchCatalogue(env, url);
      }

      // ── Stats ──
      if (path === "/stats") {
        return await catalogueStats(env);
      }

      return err("Not Found", 404);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Internal Server Error";
      return err(message, 500);
    }
  },
};

// ── Catalogue Handlers ──────────────────────────────────────────────

async function listCatalogue(env: Env, url: URL): Promise<Response> {
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const status = url.searchParams.get("status") || "active";

  const result = await env.FISH_DB.prepare(
    "SELECT * FROM catalogue WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).bind(status, limit, offset).all<CatalogueEntry>();

  return json({ ok: true, tracks: result.results, meta: { limit, offset, count: result.results.length } });
}

async function getTrack(env: Env, id: string): Promise<Response> {
  const track = await env.FISH_DB.prepare(
    "SELECT * FROM catalogue WHERE id = ?"
  ).bind(id).first<CatalogueEntry>();

  if (!track) return err("Track not found", 404);
  return json({ ok: true, track });
}

async function addTrack(env: Env, request: Request): Promise<Response> {
  const body = await request.json<Partial<CatalogueEntry>>();
  if (!body.title || !body.artist) return err("title and artist are required");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.FISH_DB.prepare(
    `INSERT INTO catalogue (id, title, artist, album, duration_ms, fingerprint_hash, c2pa_stamp, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
  ).bind(
    id, body.title, body.artist, body.album || "", body.duration_ms || 0,
    body.fingerprint_hash || "", body.c2pa_stamp || null, now, now
  ).run();

  return json({ ok: true, id, created_at: now }, 201);
}

async function updateTrack(env: Env, id: string, request: Request): Promise<Response> {
  const body = await request.json<Partial<CatalogueEntry>>();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (["title", "artist", "album", "duration_ms", "fingerprint_hash", "c2pa_stamp"].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return err("No valid fields to update");

  fields.push("updated_at = ?");
  values.push(now, id);

  await env.FISH_DB.prepare(
    `UPDATE catalogue SET ${fields.join(", ")} WHERE id = ?`
  ).bind(...values).run();

  return json({ ok: true, id, updated_at: now });
}

async function archiveTrack(env: Env, id: string): Promise<Response> {
  // Never delete — only archive
  const now = new Date().toISOString();
  await env.FISH_DB.prepare(
    "UPDATE catalogue SET status = 'archived', updated_at = ? WHERE id = ?"
  ).bind(now, id).run();

  return json({ ok: true, id, status: "archived", archived_at: now });
}

// ── Royalty Handlers (append-only) ──────────────────────────────────

async function recordRoyalty(env: Env, request: Request): Promise<Response> {
  const body = await request.json<RoyaltyRecord>();
  if (!body.track_id || !body.artist_id || !body.amount_cents) {
    return err("track_id, artist_id, and amount_cents are required");
  }

  const record: RoyaltyRecord = {
    track_id: body.track_id,
    artist_id: body.artist_id,
    amount_cents: body.amount_cents,
    source: body.source || "manual",
    timestamp: new Date().toISOString(),
  };

  // Append-only: key = artist:timestamp for natural ordering
  const key = `${record.artist_id}:${record.timestamp}`;
  await env.KV_ROYALTIES.put(key, JSON.stringify(record));

  return json({ ok: true, recorded: record }, 201);
}

async function getRoyalties(env: Env, artistId: string): Promise<Response> {
  const list = await env.KV_ROYALTIES.list({ prefix: `${artistId}:`, limit: 100 });
  const records: RoyaltyRecord[] = [];

  for (const key of list.keys) {
    const val = await env.KV_ROYALTIES.get(key.name);
    if (val) records.push(JSON.parse(val));
  }

  const totalCents = records.reduce((sum, r) => sum + r.amount_cents, 0);
  return json({ ok: true, artist_id: artistId, records, total_cents: totalCents, count: records.length });
}

// ── Session Proxy (NOIZYSTREAM) ─────────────────────────────────────

async function proxySessions(env: Env): Promise<Response> {
  const res = await fetch(`${env.NOIZYSTREAM_URL}/sessions`);
  const data = await res.json();
  return json({ ok: true, source: "noizystream", ...data as object });
}

async function createSession(env: Env, request: Request): Promise<Response> {
  const body = await request.text();
  const res = await fetch(`${env.NOIZYSTREAM_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  return json(data, res.status);
}

// ── Search ──────────────────────────────────────────────────────────

async function searchCatalogue(env: Env, url: URL): Promise<Response> {
  const q = url.searchParams.get("q");
  if (!q) return err("q parameter required");

  const result = await env.FISH_DB.prepare(
    `SELECT * FROM catalogue WHERE status = 'active' AND (title LIKE ? OR artist LIKE ? OR album LIKE ?) LIMIT 50`
  ).bind(`%${q}%`, `%${q}%`, `%${q}%`).all<CatalogueEntry>();

  return json({ ok: true, query: q, results: result.results, count: result.results.length });
}

// ── Stats ───────────────────────────────────────────────────────────

async function catalogueStats(env: Env): Promise<Response> {
  const total = await env.FISH_DB.prepare("SELECT COUNT(*) as count FROM catalogue").first<{ count: number }>();
  const active = await env.FISH_DB.prepare("SELECT COUNT(*) as count FROM catalogue WHERE status = 'active'").first<{ count: number }>();
  const artists = await env.FISH_DB.prepare("SELECT COUNT(DISTINCT artist) as count FROM catalogue WHERE status = 'active'").first<{ count: number }>();

  return json({
    ok: true,
    stats: {
      total_tracks: total?.count || 0,
      active_tracks: active?.count || 0,
      unique_artists: artists?.count || 0,
    },
  });
}
