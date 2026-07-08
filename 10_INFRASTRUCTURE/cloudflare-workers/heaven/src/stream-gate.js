/**
 * HEAVEN — Stream Gate
 * ====================================================================
 * Issues Cloudflare Stream live-input sessions bound to a consent
 * verdict. Built to the same pattern as artifact-gate.js, but for
 * real-time performance instead of recorded audio.
 *
 * Latency tiers and the scope convention:
 *
 *   mode='webrtc'  → sub-second; scope must end in "/live"
 *   mode='srt'     → <1 s glass-to-glass; scope must end in "/live"
 *   mode='llhls'   → 2-4 s; scope must end in "/near-live"
 *   mode='hls'     → 5-10 s; scope may be any
 *
 * This module is INTENTIONALLY dormant until Cloudflare accounts are
 * consolidated and STREAM_ENABLED="true" is set in wrangler.toml.
 * Until then, every call returns a clear "stream_not_configured"
 * refusal so downstream callers don't accidentally synthesize fake
 * stream URLs.
 *
 * Once activated:
 *   - env.STREAM_ACCOUNT_ID  (public-ish, in wrangler.toml)
 *   - env.STREAM_API_TOKEN   (secret, via wrangler secret put)
 *   - env.STREAM_ENABLED     = "true"
 * createLiveInput() calls the Cloudflare API and returns the uid,
 * RTMPS URL + stream key, WebRTC signaling URL, and stream playback
 * URL.
 *
 * Author: Robert Stephen Plowman / MC96ECO / HEAVEN v0.4.0
 * ====================================================================
 */

function streamEnabled(env) {
  return String(env.STREAM_ENABLED ?? 'false').toLowerCase() === 'true'
      && !!env.STREAM_ACCOUNT_ID
      && !!env.STREAM_API_TOKEN;
}

export function streamReadiness(env) {
  return {
    enabled:           streamEnabled(env),
    has_account_id:    !!env.STREAM_ACCOUNT_ID,
    has_api_token:     !!env.STREAM_API_TOKEN,
    flag_value:        env.STREAM_ENABLED ?? null,
  };
}

const VALID_MODES = Object.freeze(['webrtc', 'srt', 'llhls', 'hls']);

function modeMatchesScope(mode, scope) {
  const s = scope || '';
  if (mode === 'webrtc' || mode === 'srt')  return s.endsWith('/live');
  if (mode === 'llhls')                     return s.endsWith('/near-live');
  if (mode === 'hls')                       return true;
  return false;
}

/**
 * issueStreamSession — the main entry.
 *
 * @param {object} args
 * @param {object} args.env
 * @param {object} args.verdict      - allowed verdict from checkConsent()
 * @param {string} args.actorId
 * @param {string} args.scope
 * @param {string} args.mode         - one of VALID_MODES
 * @param {string} [args.label]      - freeform human label for the session
 * @returns {Promise<object>}
 */
export async function issueStreamSession({ env, verdict, actorId, scope, mode = 'hls', label }) {
  if (!verdict || !verdict.allowed) {
    return { ok: false, reason: 'no_allowed_verdict' };
  }
  if (!VALID_MODES.includes(mode)) {
    return { ok: false, reason: `invalid_mode:${mode}`, valid: VALID_MODES };
  }
  if (!modeMatchesScope(mode, scope)) {
    return {
      ok: false,
      reason: `scope_not_valid_for_mode`,
      note: `mode=${mode} requires scope pattern: webrtc/srt → '.../live', llhls → '.../near-live', hls → any`,
    };
  }

  // DORMANT PATH: Stream API not configured. Return a structurally
  // honest refusal so callers can plan and fail loud instead of quiet.
  if (!streamEnabled(env)) {
    return {
      ok: false,
      reason: 'stream_not_configured',
      readiness: streamReadiness(env),
      note: 'Architecture ready. Activation requires Cloudflare account consolidation → set STREAM_ENABLED="true", STREAM_ACCOUNT_ID, STREAM_API_TOKEN.',
    };
  }

  // ACTIVE PATH: call Cloudflare Stream API to create a live input.
  // Per docs: POST /accounts/{acct}/stream/live_inputs
  try {
    const body = {
      meta: {
        name: label || `heaven-${actorId}-${verdict.verdict_id}`,
        heaven_verdict_id: verdict.verdict_id,
        heaven_actor_id: actorId,
        heaven_scope: scope,
        heaven_mode: mode,
      },
      recording: { mode: 'automatic' },
    };
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.STREAM_ACCOUNT_ID}/stream/live_inputs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STREAM_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    if (!resp.ok) {
      const text = await resp.text();
      return {
        ok: false,
        reason: `stream_api_error_${resp.status}`,
        detail: text.slice(0, 500),
      };
    }
    const data = await resp.json();
    const result = data?.result || {};
    // Shape the payload — strip anything we shouldn't echo (tokens).
    return {
      ok: true,
      session: {
        uid: result.uid,
        mode,
        rtmps: result.rtmps ? { url: result.rtmps.url, streamKey: result.rtmps.streamKey } : null,
        srt:   result.srt   ? { url: result.srt.url,   streamId: result.srt.streamId, passphrase: result.srt.passphrase } : null,
        webRTC: result.webRTC ? { url: result.webRTC.url } : null,
        webRTCPlayback: result.webRTCPlayback ? { url: result.webRTCPlayback.url } : null,
        meta: result.meta || null,
      },
    };
  } catch (err) {
    return { ok: false, reason: 'stream_api_exception', detail: String(err?.message || err) };
  }
}
