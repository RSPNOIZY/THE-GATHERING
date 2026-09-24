/**
 * NOIZYSTREAM Route Templates
 * Dante route presets for common studio configurations.
 * Each template defines source → destination mappings with latency + quality targets.
 *
 * RSP_001 | NOIZY Empire | 2026
 */

// ── Route Template Registry ───────────────────────────────────────────────────

export const ROUTE_TEMPLATES = {

  // ── Default: Record + Monitor ──────────────────────────────────────────────
  default: {
    name: 'Default Studio',
    description: 'Source → Record bus + Monitor output',
    lane: 'studio',
    latency_target_ms: 1,
    sample_rate: 48000,
    bit_depth: 24,
    routes: [
      { src: 'primary_source', dst: 'record_bus',   label: 'Source → Record',  gain: 0 },
      { src: 'primary_source', dst: 'monitor_out',  label: 'Source → Monitor', gain: 0 },
      { src: 'talkback_mic',   dst: 'artist_cue',   label: 'Talkback → Cue',   gain: -6 },
    ],
  },

  // ── Tracking: Multi-source record session ─────────────────────────────────
  tracking: {
    name: 'Tracking Session',
    description: 'Multiple sources → individual record buses + cue mix',
    lane: 'studio',
    latency_target_ms: 1,
    sample_rate: 96000,
    bit_depth: 32,
    routes: [
      { src: 'source_1',     dst: 'record_bus_1',  label: 'Src1 → Rec1',    gain: 0 },
      { src: 'source_2',     dst: 'record_bus_2',  label: 'Src2 → Rec2',    gain: 0 },
      { src: 'source_1',     dst: 'cue_mix_a',     label: 'Src1 → CueA',    gain: -3 },
      { src: 'source_2',     dst: 'cue_mix_a',     label: 'Src2 → CueA',    gain: -3 },
      { src: 'playback_bus', dst: 'monitor_out',   label: 'Play → Monitor',  gain: 0 },
      { src: 'talkback_mic', dst: 'cue_mix_a',     label: 'TB → CueA',       gain: -10 },
    ],
  },

  // ── Remote approval: Studio → WebRTC edge ─────────────────────────────────
  remote_approval: {
    name: 'Remote Approval',
    description: 'Studio bus → bridge → WebRTC for remote client listen + approval',
    lane: 'bridge',
    latency_target_ms: 50,
    sample_rate: 48000,
    bit_depth: 24,
    routes: [
      { src: 'primary_source', dst: 'record_bus',    label: 'Source → Record',    gain: 0 },
      { src: 'primary_source', dst: 'monitor_out',   label: 'Source → Monitor',   gain: 0 },
      { src: 'primary_source', dst: 'webrtc_bridge', label: 'Source → WebRTC',    gain: -6, codec: 'opus', bitrate: 128000 },
      { src: 'talkback_mic',   dst: 'artist_cue',    label: 'Talkback → Artist',  gain: -6 },
    ],
  },

  // ── Voice pipeline: AirPlay/mic → whisper → GABRIEL ───────────────────────
  voice_pipeline: {
    name: 'Voice Pipeline',
    description: 'Mic/AirPlay source → transcription → GABRIEL',
    lane: 'studio',
    latency_target_ms: 5,
    sample_rate: 16000,
    bit_depth: 16,
    routes: [
      { src: 'mic_in',         dst: 'whisper_tap',   label: 'Mic → Whisper',      gain: 0 },
      { src: 'airplay_in',     dst: 'whisper_tap',   label: 'AirPlay → Whisper',  gain: 0 },
      { src: 'whisper_out',    dst: 'gabriel_api',   label: 'Transcript → GABRIEL', gain: 0 },
    ],
  },

  // ── Mixing: Full mix session ───────────────────────────────────────────────
  mixing: {
    name: 'Mix Session',
    description: 'DAW stems → mix bus → monitor + print',
    lane: 'studio',
    latency_target_ms: 1,
    sample_rate: 96000,
    bit_depth: 32,
    routes: [
      { src: 'daw_stereo_out', dst: 'monitor_out',   label: 'DAW → Monitor',  gain: 0 },
      { src: 'daw_stereo_out', dst: 'mix_print_bus', label: 'DAW → Print',    gain: 0 },
      { src: 'ref_player',     dst: 'monitor_out',   label: 'Ref → Monitor',  gain: -3 },
    ],
  },

  // ── Mastering: Clean mastering chain ──────────────────────────────────────
  mastering: {
    name: 'Mastering Session',
    description: 'Mix bus → mastering chain → print bus',
    lane: 'studio',
    latency_target_ms: 1,
    sample_rate: 192000,
    bit_depth: 32,
    routes: [
      { src: 'mix_in',        dst: 'master_chain', label: 'Mix → Chain',       gain: 0 },
      { src: 'master_chain',  dst: 'print_bus',    label: 'Chain → Print',     gain: 0 },
      { src: 'master_chain',  dst: 'monitor_out',  label: 'Chain → Monitor',   gain: 0 },
    ],
  },
};

export function getTemplate(name) {
  return ROUTE_TEMPLATES[name] || ROUTE_TEMPLATES.default;
}

export function listTemplates() {
  return Object.entries(ROUTE_TEMPLATES).map(([key, t]) => ({
    key,
    name: t.name,
    description: t.description,
    lane: t.lane,
    latency_ms: t.latency_target_ms,
    routes: t.routes.length,
  }));
}

export function buildRouteManifest(session, templateKey) {
  const template = getTemplate(templateKey);
  return {
    session_id: session.id,
    session_name: session.name,
    template: templateKey,
    template_name: template.name,
    lane: template.lane,
    latency_target_ms: template.latency_target_ms,
    sample_rate: template.sample_rate,
    bit_depth: template.bit_depth,
    routes: template.routes.map((r, i) => ({
      id: `route_${i}`,
      ...r,
      status: 'pending',
    })),
    generated_at: new Date().toISOString(),
  };
}
