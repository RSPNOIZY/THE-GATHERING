#!/usr/bin/env bash
# ============================================================
# MICKEY-P BRIDGE — Legacy Audio/Data Gateway
# Runs ON Mickey-P (Old MacBook Pro)
# Creates encrypted tunnel: Mickey-P → Cloudflare → GOD
#
# Architecture:
#   Loopback (virtual audio) → ffmpeg (capture) → 
#   local bridge server (:9090) → cloudflared tunnel →
#   Cloudflare Edge → GOD:9090 (audio ingress)
#
# Prerequisites on Mickey-P:
#   brew install cloudflared ffmpeg node
#   Loopback by Rogue Amoeba (already installed)
# ============================================================

set -euo pipefail

BRIDGE_PORT=9090
TUNNEL_NAME="mickey-p"
LOOPBACK_DEVICE="Loopback Audio"  # Name of the Loopback virtual device

echo "🔌 MICKEY-P BRIDGE — Starting"
echo "=============================="

# ── Step 1: Verify Loopback is running ────────────────────────
echo "1/4 — Checking Loopback..."

# List available audio devices (macOS)
DEVICES=$(system_profiler SPAudioDataType 2>/dev/null | grep "Name:" || echo "")
if echo "$DEVICES" | grep -qi "loopback"; then
  echo "  ✅ Loopback Audio detected"
else
  echo "  ⚠️  Loopback not detected — open Loopback.app first"
  echo "     Configure a virtual device named: $LOOPBACK_DEVICE"
  echo "     Route: System Audio → Loopback → Bridge"
fi

# ── Step 2: Start the audio bridge server ─────────────────────
echo "2/4 — Starting bridge server on :${BRIDGE_PORT}..."

# Create the Node.js bridge inline
cat > /tmp/mickey-bridge.js << 'BRIDGEOF'
const http = require('http');
const { spawn } = require('child_process');

const PORT = parseInt(process.env.BRIDGE_PORT || '9090');
const LOOPBACK_DEVICE = process.env.LOOPBACK_DEVICE || 'Loopback Audio';

// Active audio streams
const streams = new Map();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Bridge', 'Mickey-P/1.0');
  res.setHeader('X-Encrypted', 'cloudflare-tunnel');
  
  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      service: 'mickey-p-bridge',
      status: 'healthy',
      loopback: LOOPBACK_DEVICE,
      activeStreams: streams.size,
      uptime: process.uptime(),
    }));
  }
  
  // Stream audio from Loopback → client (GOD)
  // Priority: low-latency FLAC for lossless transmission
  if (url.pathname === '/stream/audio') {
    const format = url.searchParams.get('format') || 'flac';
    const sampleRate = url.searchParams.get('sr') || '48000';
    const channels = url.searchParams.get('ch') || '2';
    
    console.log(`[STREAM] Audio request: ${format} ${sampleRate}Hz ${channels}ch`);
    
    // ffmpeg captures from Loopback virtual device and streams
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'avfoundation',
      '-i', `:${LOOPBACK_DEVICE}`,  // Loopback as input
      '-ac', channels,
      '-ar', sampleRate,
      '-f', format === 'flac' ? 'flac' : format === 'opus' ? 'opus' : 'wav',
      '-compression_level', '0',  // Fastest encoding = lowest latency
      '-'  // Output to stdout
    ], { stdio: ['pipe', 'pipe', 'pipe'] });
    
    const streamId = Date.now().toString(36);
    streams.set(streamId, ffmpeg);
    
    const contentType = format === 'flac' ? 'audio/flac' 
                      : format === 'opus' ? 'audio/ogg' 
                      : 'audio/wav';
    
    res.writeHead(200, {
      'Content-Type': contentType,
      'Transfer-Encoding': 'chunked',
      'X-Stream-ID': streamId,
      'X-Latency-Priority': 'critical',
      'Cache-Control': 'no-store',
    });
    
    ffmpeg.stdout.pipe(res);
    
    ffmpeg.stderr.on('data', (data) => {
      const line = data.toString().trim();
      if (line && !line.startsWith('frame=')) {
        console.log(`[ffmpeg] ${line}`);
      }
    });
    
    req.on('close', () => {
      console.log(`[STREAM] Client disconnected: ${streamId}`);
      ffmpeg.kill('SIGTERM');
      streams.delete(streamId);
    });
    
    return;
  }
  
  // List available audio devices
  if (url.pathname === '/devices') {
    const listProc = spawn('ffmpeg', [
      '-f', 'avfoundation', '-list_devices', 'true', '-i', ''
    ], { stdio: ['pipe', 'pipe', 'pipe'] });
    
    let output = '';
    listProc.stderr.on('data', (d) => output += d.toString());
    listProc.on('close', () => {
      const devices = output.split('\n')
        .filter(l => l.includes('[AVFoundation'))
        .map(l => l.replace(/.*\] /, '').trim());
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ devices }));
    });
    return;
  }
  
  // Stop a specific stream
  if (url.pathname === '/stream/stop' && req.method === 'POST') {
    const streamId = url.searchParams.get('id');
    if (streamId && streams.has(streamId)) {
      streams.get(streamId).kill('SIGTERM');
      streams.delete(streamId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ stopped: streamId }));
    }
    res.writeHead(404);
    return res.end();
  }
  
  // Root
  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      name: 'Mickey-P Bridge',
      purpose: 'Legacy audio gateway for DreamChamber',
      routes: {
        '/health':        'Bridge health check',
        '/devices':       'List available audio devices',
        '/stream/audio':  'Stream from Loopback (params: format, sr, ch)',
        '/stream/stop':   'Stop a stream (param: id)',
      },
      encryption: 'All traffic encrypted end-to-end via Cloudflare Tunnel',
    }));
  }
  
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`🔌 Mickey-P Bridge listening on :${PORT}`);
  console.log(`   Loopback device: ${LOOPBACK_DEVICE}`);
  console.log(`   Formats: FLAC (lossless), Opus (low-latency), WAV (raw)`);
  console.log(`   Encryption: via cloudflared tunnel`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  for (const [id, proc] of streams) { proc.kill(); }
  server.close();
});
BRIDGEOF

# Start the bridge
BRIDGE_PORT=$BRIDGE_PORT LOOPBACK_DEVICE="$LOOPBACK_DEVICE" node /tmp/mickey-bridge.js &
BRIDGE_PID=$!
echo "  ✅ Bridge server started (PID: $BRIDGE_PID)"

# Wait for bridge to be ready
sleep 2

# ── Step 3: Create cloudflared tunnel ─────────────────────────
echo "3/4 — Creating encrypted tunnel..."

# Check if tunnel exists
if cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
  echo "  ✅ Tunnel '$TUNNEL_NAME' exists"
else
  cloudflared tunnel create "$TUNNEL_NAME"
  echo "  ✅ Tunnel '$TUNNEL_NAME' created"
fi

TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}')

# Write config
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config-mickey.yml << TUNNELEOF
tunnel: ${TUNNEL_ID}
credentials-file: ~/.cloudflared/${TUNNEL_ID}.json

ingress:
  # Audio bridge — priority traffic
  - hostname: mickey-p.noizy.ai
    service: http://localhost:${BRIDGE_PORT}
    originRequest:
      noTLSVerify: true
      connectTimeout: 5s
      # Priority: audio packets get fast-lane treatment
      httpHostHeader: mickey-p.noizy.ai

  # Catch-all
  - service: http_status:404
TUNNELEOF

echo "  ✅ Tunnel config written"

# Route DNS
cloudflared tunnel route dns "$TUNNEL_NAME" mickey-p.noizy.ai 2>/dev/null || \
  echo "  ⚠️  DNS routing may need manual setup (zone must be active)"

# ── Step 4: Start tunnel ──────────────────────────────────────
echo "4/4 — Starting encrypted tunnel..."
echo ""
echo "============================================"
echo "🔌 MICKEY-P BRIDGE — ONLINE"
echo "============================================"
echo ""
echo "  Local:    http://localhost:${BRIDGE_PORT}"
echo "  Tunnel:   https://mickey-p.noizy.ai"
echo "  Encrypt:  Cloudflare TLS end-to-end"
echo ""
echo "  From GOD:"
echo "    curl https://mickey-p.noizy.ai/health"
echo "    curl https://mickey-p.noizy.ai/devices"
echo "    curl https://mickey-p.noizy.ai/stream/audio?format=flac > capture.flac"
echo ""
echo "  From Heaven Worker:"
echo "    fetch('https://mickey-p.noizy.ai/stream/audio')"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

# Run tunnel in foreground (blocks)
cloudflared tunnel --config ~/.cloudflared/config-mickey.yml run "$TUNNEL_NAME"
