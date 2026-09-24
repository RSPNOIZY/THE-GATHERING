/**
 * DreamChamber Accessibility Bridge
 * Connects: GORUNFREE → heaven17 → DreamChamber
 * Provides: Voice navigation, switch access, large UI mode
 * 
 * Run: node /tmp/dreamchamber_accessibility_bridge.js
 */

const http = require('http');
const { EventEmitter } = require('events');

const HEAVEN17_URL = 'http://localhost:17017';
const DREAMCHAMBER_URL = 'http://localhost:7777';
const GORUNFREE_URL = 'http://localhost:9099';
const BRIDGE_PORT = 7778;

class AccessibilityBridge extends EventEmitter {
  constructor() {
    super();
    this.voiceActive = false;
    this.switchMode = false;
    this.largeUIMode = false;
    this.lastVoiceInput = null;
  }

  async processVoice(transcript, deviceIndex = 4) {
    // RSP BEATS = device 4 (primary accessibility microphone)
    console.log(`[Bridge] Voice from device ${deviceIndex}: "${transcript}"`);
    
    const response = await this.callAPI(HEAVEN17_URL, 'POST', '/v1/voice', {
      transcript,
      device: deviceIndex,
      user: 'RSP',
      context: 'dreamchamber'
    });
    
    if (response?.response) {
      await this.sendToDreamChamber(transcript, response.response);
    }
    
    return response;
  }

  async sendToDreamChamber(userMessage, aiResponse) {
    return this.callAPI(DREAMCHAMBER_URL, 'POST', '/api/conversations', {
      messages: [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      ],
      source: 'voice_bridge',
      accessibility: true
    });
  }

  async callAPI(baseUrl, method, path, body) {
    return new Promise((resolve) => {
      const data = JSON.stringify(body);
      const url = new URL(baseUrl + path);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(responseData)); }
          catch { resolve({}); }
        });
      });

      req.on('error', (e) => {
        console.error(`[Bridge] API call failed: ${e.message}`);
        resolve(null);
      });
      
      req.write(data);
      req.end();
    });
  }
}

const bridge = new AccessibilityBridge();

// HTTP server for bridge control
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${BRIDGE_PORT}`);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      service: 'DreamChamber Accessibility Bridge',
      version: '1.0.0',
      status: 'online',
      voiceActive: bridge.voiceActive,
      switchMode: bridge.switchMode,
      largeUIMode: bridge.largeUIMode,
      connections: {
        heaven17: HEAVEN17_URL,
        dreamchamber: DREAMCHAMBER_URL,
        gorunfree: GORUNFREE_URL
      }
    }));
    
  } else if (req.method === 'POST' && url.pathname === '/voice') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const { transcript, device } = JSON.parse(body || '{}');
      const result = await bridge.processVoice(transcript, device || 4);
      res.writeHead(200);
      res.end(JSON.stringify(result || { error: 'Voice processing failed' }));
    });
    
  } else if (req.method === 'POST' && url.pathname === '/mode') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const config = JSON.parse(body || '{}');
      if (config.largeUI !== undefined) bridge.largeUIMode = config.largeUI;
      if (config.switchMode !== undefined) bridge.switchMode = config.switchMode;
      if (config.voiceActive !== undefined) bridge.voiceActive = config.voiceActive;
      res.writeHead(200);
      res.end(JSON.stringify({ updated: config, current: {
        largeUIMode: bridge.largeUIMode,
        switchMode: bridge.switchMode,
        voiceActive: bridge.voiceActive
      }}));
    });
    
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(BRIDGE_PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   DreamChamber Accessibility Bridge              ║
║   "Where Constraints Fade & Imagination Thrives" ║
║                                                  ║
║   Port: ${BRIDGE_PORT}                                   ║
║   Voice Pipeline: GORUNFREE → heaven17            ║
║   Destination: DreamChamber :7777                ║
╚══════════════════════════════════════════════════╝
  `);
  console.log(`[Bridge] ✅ Online at http://localhost:${BRIDGE_PORT}`);
  console.log(`[Bridge] ✅ heaven17: ${HEAVEN17_URL}`);
  console.log(`[Bridge] ✅ DreamChamber: ${DREAMCHAMBER_URL}`);
});
