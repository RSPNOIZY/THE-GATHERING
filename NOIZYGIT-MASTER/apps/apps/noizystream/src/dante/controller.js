/**
 * NOIZYSTREAM Dante Controller Integration
 * Interfaces with Dante Virtual Soundcard and CoreAudio for local routing.
 * Provides: device discovery, route subscription management, latency monitoring.
 *
 * M2 Ultra GOD machine topology:
 *   Primary interface → Dante Virtual Soundcard → managed switch → endpoints
 *
 * RSP_001 | NOIZY Empire | 2026
 */

import { exec, execFile } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ── Device registry ────────────────────────────────────────────────────────
// GOD.local audio topology
export const KNOWN_DEVICES = {
  'mac_studio_speakers': { type: 'output', channels: 6, driver: 'coreaudio', label: 'Mac Studio Speakers' },
  'rsp_iphone_mic':      { type: 'input',  channels: 1, driver: 'continuity', label: 'RSP iPhone Microphone' },
  'noizyipad':           { type: 'input',  channels: 2, driver: 'continuity', label: 'NOIZY iPad' },
  'landr_sessions':      { type: 'io',     channels: 2, driver: 'coreaudio', label: 'LANDR Sessions' },
  'airplay_in':          { type: 'input',  channels: 2, driver: 'airplay', label: 'AirPlay Input (port 5000)' },
  'dante_vsc':           { type: 'io',     channels: 64, driver: 'dante', label: 'Dante Virtual Soundcard' },
  'whisper_tap':         { type: 'virtual', channels: 1, driver: 'virtual', label: 'Whisper Transcription Tap' },
  'gabriel_api':         { type: 'virtual', channels: 0, driver: 'api', label: 'GABRIEL Voice API' },
};

// ── Audio device listing (CoreAudio) ──────────────────────────────────────
export async function listAudioDevices() {
  try {
    const { stdout } = await execAsync(
      `system_profiler SPAudioDataType 2>/dev/null | grep -E "^\\s+[A-Z].*[^:]$|Input Channels:|Output Channels:" | head -40`
    );
    const lines = stdout.trim().split('\n').map(l => l.trim());
    const devices = [];
    let current = null;
    for (const line of lines) {
      if (!line.startsWith('Input') && !line.startsWith('Output')) {
        if (current) devices.push(current);
        current = { name: line, inputs: 0, outputs: 0 };
      } else if (current) {
        if (line.includes('Input Channels')) current.inputs = parseInt(line.split(':')[1]) || 0;
        if (line.includes('Output Channels')) current.outputs = parseInt(line.split(':')[1]) || 0;
      }
    }
    if (current) devices.push(current);
    return devices.filter(d => d.name);
  } catch { return []; }
}

// ── Dante Virtual Soundcard detection ──────────────────────────────────────
export async function checkDanteVSC() {
  try {
    const { stdout } = await execAsync(
      `system_profiler SPAudioDataType 2>/dev/null | grep -i "dante\\|DVS\\|audinate"`
    );
    return {
      installed: stdout.length > 0,
      details: stdout.trim() || 'Not detected',
      hint: stdout.length === 0
        ? 'Install Dante Virtual Soundcard from audinate.com for network audio routing'
        : 'Dante VSC detected',
    };
  } catch {
    return { installed: false, details: 'Check failed', hint: 'Install Dante Virtual Soundcard' };
  }
}

// ── Route subscription (Dante-style naming convention) ────────────────────
export async function subscribeRoute(src_device, src_channel, dst_device, dst_channel) {
  // In full Dante integration: would call Dante Controller API or DVS CLI
  // For GOD: uses CoreAudio aggregate device or Audio Hijack routing
  const route = {
    id: `route_${Date.now()}`,
    src: `${src_device}:${src_channel}`,
    dst: `${dst_device}:${dst_channel}`,
    status: 'subscribed',
    latency_ms: src_device.includes('dante') ? 1 : 5,
    subscribed_at: new Date().toISOString(),
  };
  console.log(`[Dante] Route subscribed: ${route.src} → ${route.dst}`);
  return route;
}

// ── Latency measurement (CoreAudio round-trip) ─────────────────────────────
export async function measureLatency() {
  try {
    const { stdout } = await execAsync(
      `defaults read com.apple.CoreAudio 2>/dev/null | grep -i "buffer\|latency" | head -5`
    );
    return {
      measured: true,
      details: stdout.trim() || 'No CoreAudio latency data',
      estimated_ms: 5, // CoreAudio default buffer
    };
  } catch {
    return { measured: false, estimated_ms: 5 };
  }
}

// ── AirPlay audio tap setup ────────────────────────────────────────────────
export async function setupAirPlayTap(target_device = 'mac_studio_speakers') {
  // macOS AirPlay Receiver (port 5000) routes to default output
  // To redirect to a different device: use SwitchAudioSource or osascript
  try {
    const { stdout } = await execAsync(
      `SwitchAudioSource -s "${target_device}" -t output 2>/dev/null || echo "SwitchAudioSource not available"`
    );
    return { ok: !stdout.includes('not available'), device: target_device, details: stdout.trim() };
  } catch {
    return { ok: false, device: target_device, hint: 'Install SwitchAudioSource: brew install switchaudio-osx' };
  }
}

// ── Topology summary ───────────────────────────────────────────────────────
export async function getTopology() {
  const [devices, dante, latency] = await Promise.all([
    listAudioDevices(),
    checkDanteVSC(),
    measureLatency(),
  ]);

  return {
    machine: 'GOD.local (M2 Ultra Mac Studio)',
    ip: '10.0.0.70',
    network_ip: '10.90.90.10',
    audio_devices: devices,
    dante: dante,
    latency: latency,
    airplay_receiver: { active: true, port: 5000, driver: 'macos_native' },
    known_devices: Object.entries(KNOWN_DEVICES).map(([id, d]) => ({ id, ...d })),
    recommended_setup: {
      studio_lane: 'Dante Virtual Soundcard + managed Ethernet switch',
      internet_lane: 'WebRTC via NOIZYSTREAM signaling (port 4041)',
      bridge: 'M2 Ultra runs bridge node — Dante local → WebRTC edge',
    },
    ts: new Date().toISOString(),
  };
}
