/**
 * ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                                                        ║
 * ║     ⚡ G O D - K E R N E L   P O W E R   I N T E G R A T I O N   M O D U L E ⚡                                        ║
 * ║                                                                                                                        ║
 * ║     Receives BLE power status from AEON PMIC and adjusts AI processing accordingly                                    ║
 * ║                                                                                                                        ║
 * ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// POWER STATE RECEIVER (from BLE → Phone → Cloud)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const POWER_MODES = {
  HARVEST: { ai_allowed: true, model: 'full', burst_ok: true },
  BUFFER: { ai_allowed: true, model: 'full', burst_ok: true },
  BOOST: { ai_allowed: true, model: 'full', burst_ok: true },
  BURST: { ai_allowed: true, model: 'full', burst_ok: true },
  CRITICAL: { ai_allowed: true, model: 'fast', burst_ok: false },
  SLEEP: { ai_allowed: false, model: null, burst_ok: false },
  OTA: { ai_allowed: false, model: null, burst_ok: false },
};

const AI_THROTTLE_LEVELS = {
  // SOC-based throttling
  FULL: { soc_min: 80, model: '@cf/meta/llama-3.1-8b-instruct', max_tokens: 2000 },
  NORMAL: { soc_min: 50, model: '@cf/meta/llama-3.1-8b-instruct', max_tokens: 1000 },
  REDUCED: { soc_min: 30, model: '@cf/meta/llama-3.2-3b-instruct', max_tokens: 500 },
  MINIMAL: { soc_min: 15, model: '@cf/meta/llama-3.2-1b-instruct', max_tokens: 200 },
  EMERGENCY: { soc_min: 0, model: null, max_tokens: 0 },  // Voice-only responses
};

// Parse incoming power state from PMIC
function parsePowerState(json) {
  try {
    const data = JSON.parse(json);
    return {
      mode: data.m || 'BUFFER',
      soc: data.soc || 50,
      voltage: data.v || 3.7,
      harvest_mw: data.h || 0,
      load_mw: data.l || 0,
      net_mw: data.n || 0,
      supercap_v: data.sc || 0,
      runtime_hr: data.rt || 0,
      alerts: data.a || 0,
      timestamp: Date.now(),
    };
  } catch (e) {
    return null;
  }
}

// Determine AI throttle level based on power state
function getAIThrottleLevel(powerState) {
  if (!powerState) return AI_THROTTLE_LEVELS.NORMAL;
  
  const modeConfig = POWER_MODES[powerState.mode];
  if (!modeConfig?.ai_allowed) {
    return AI_THROTTLE_LEVELS.EMERGENCY;
  }
  
  // SOC-based selection
  for (const [name, level] of Object.entries(AI_THROTTLE_LEVELS)) {
    if (powerState.soc >= level.soc_min) {
      return { ...level, name };
    }
  }
  
  return AI_THROTTLE_LEVELS.EMERGENCY;
}

// Check if burst mode is available
function canBurst(powerState) {
  if (!powerState) return false;
  const modeConfig = POWER_MODES[powerState.mode];
  return modeConfig?.burst_ok && powerState.supercap_v >= 4.5;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// POWER-AWARE TRIUMVIRATE
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

async function powerAwareTriumvirate(env, intent, powerState) {
  const throttle = getAIThrottleLevel(powerState);
  
  // Emergency mode - no AI, just voice response
  if (!throttle.model) {
    return {
      system_status: 'EMERGENCY_MODE',
      response: `Power critical at ${powerState?.soc || 0}%. AI disabled to conserve battery. Please charge.`,
      power_mode: powerState?.mode || 'UNKNOWN',
      ai_level: 'EMERGENCY',
    };
  }
  
  // Check if we should request burst mode
  const needsBurst = intent.length > 200 || intent.includes('analyze') || intent.includes('complex');
  if (needsBurst && canBurst(powerState)) {
    // Signal PMIC to enable burst mode
    await signalBurst(env, true);
  }
  
  // Determine parallelism based on power
  const parallel = powerState?.soc >= 50;
  
  const systemPrompt = `You are AEON GOD-KERNEL. Power: ${powerState?.soc || 50}% SOC, ${throttle.name} mode. Be ${throttle.max_tokens < 500 ? 'extremely concise' : 'helpful'}.`;
  
  let results;
  
  if (parallel && throttle.name !== 'MINIMAL') {
    // Full Triumvirate (parallel)
    const [vision, logic, voice] = await Promise.all([
      runAI(env, throttle.model, `VISION: Analyze context for: ${intent}`, throttle.max_tokens),
      runAI(env, throttle.model, `LOGIC: Plan safe execution for: ${intent}`, throttle.max_tokens),
      runAI(env, throttle.model, `VOICE: Respond naturally to: ${intent}`, throttle.max_tokens),
    ]);
    results = { vision, logic, voice, mode: 'TRIUMVIRATE' };
  } else {
    // Single AI (power saving)
    const response = await runAI(env, throttle.model, intent, throttle.max_tokens);
    results = { voice: response, mode: 'SINGLE' };
  }
  
  // End burst if active
  if (needsBurst && canBurst(powerState)) {
    await signalBurst(env, false);
  }
  
  return {
    system_status: 'OPERATIONAL',
    triumvirate: results,
    power: {
      mode: powerState?.mode,
      soc: powerState?.soc,
      ai_level: throttle.name,
      model: throttle.model,
      runtime_hr: powerState?.runtime_hr,
    },
    latency_ms: Date.now() - (powerState?.timestamp || Date.now()),
  };
}

async function runAI(env, model, prompt, maxTokens) {
  try {
    const response = await env.AI.run(model, {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    });
    return response.response;
  } catch (e) {
    return `[AI Error: ${e.message}]`;
  }
}

async function signalBurst(env, enable) {
  // Store burst signal for phone app to relay to PMIC
  await env.KV.put('pmic_burst', enable ? 'ON' : 'OFF', { expirationTtl: 60 });
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// POWER DASHBOARD HTML
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

function powerDashboardHTML(powerState) {
  const soc = powerState?.soc || 50;
  const mode = powerState?.mode || 'BUFFER';
  const harvest = powerState?.harvest_mw || 0;
  const runtime = powerState?.runtime_hr || 0;
  
  const socColor = soc > 50 ? '#00ff00' : soc > 20 ? '#ffff00' : '#ff0000';
  const modeColors = {
    HARVEST: '#00ff00',
    BUFFER: '#0088ff',
    BOOST: '#00ffff',
    BURST: '#ff8800',
    CRITICAL: '#ff0000',
    SLEEP: '#444444',
  };
  
  return `<!DOCTYPE html>
<html>
<head>
  <title>⚡ AEON POWER</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      color: #fff;
      font-family: 'SF Pro', -apple-system, sans-serif;
      min-height: 100vh;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 1px solid #333;
    }
    .header h1 {
      font-size: 2em;
      background: linear-gradient(90deg, #ffd700, #ff8c00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .battery-ring {
      width: 200px;
      height: 200px;
      margin: 30px auto;
      position: relative;
    }
    .battery-ring svg {
      transform: rotate(-90deg);
    }
    .battery-ring circle {
      fill: none;
      stroke-width: 15;
    }
    .battery-ring .bg { stroke: #333; }
    .battery-ring .fg {
      stroke: ${socColor};
      stroke-dasharray: ${soc * 5.65} 565;
      stroke-linecap: round;
      transition: stroke-dasharray 0.5s;
    }
    .battery-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }
    .battery-text .soc {
      font-size: 3em;
      font-weight: bold;
      color: ${socColor};
    }
    .battery-text .mode {
      font-size: 1em;
      color: ${modeColors[mode] || '#888'};
      text-transform: uppercase;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      max-width: 400px;
      margin: 20px auto;
    }
    .stat {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 15px;
      text-align: center;
    }
    .stat .value {
      font-size: 1.8em;
      font-weight: bold;
      color: #ffd700;
    }
    .stat .label {
      font-size: 0.8em;
      color: #888;
      margin-top: 5px;
    }
    .harvesters {
      max-width: 400px;
      margin: 20px auto;
    }
    .harvester {
      display: flex;
      align-items: center;
      padding: 10px;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
      margin: 8px 0;
    }
    .harvester .icon { font-size: 1.5em; margin-right: 10px; }
    .harvester .name { flex: 1; }
    .harvester .power { color: #00ff00; font-weight: bold; }
    .harvester.inactive { opacity: 0.4; }
    .alerts {
      max-width: 400px;
      margin: 20px auto;
      padding: 15px;
      background: rgba(255,0,0,0.1);
      border: 1px solid #ff0000;
      border-radius: 8px;
      display: ${(powerState?.alerts || 0) ? 'block' : 'none'};
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ AEON POWER SYSTEM</h1>
    <p style="color:#888; margin-top:5px;">Real-time energy management</p>
  </div>
  
  <div class="battery-ring">
    <svg width="200" height="200">
      <circle class="bg" cx="100" cy="100" r="90"/>
      <circle class="fg" cx="100" cy="100" r="90"/>
    </svg>
    <div class="battery-text">
      <div class="soc">${soc}%</div>
      <div class="mode">${mode}</div>
    </div>
  </div>
  
  <div class="stats">
    <div class="stat">
      <div class="value">${harvest.toFixed(0)}</div>
      <div class="label">Harvest (mW)</div>
    </div>
    <div class="stat">
      <div class="value">${runtime > 99 ? '∞' : runtime.toFixed(1)}</div>
      <div class="label">Runtime (hr)</div>
    </div>
    <div class="stat">
      <div class="value">${(powerState?.voltage || 3.7).toFixed(2)}</div>
      <div class="label">Voltage (V)</div>
    </div>
    <div class="stat">
      <div class="value">${(powerState?.supercap_v || 0).toFixed(1)}</div>
      <div class="label">Supercap (V)</div>
    </div>
  </div>
  
  <div class="harvesters">
    <div class="harvester ${harvest > 50 ? '' : 'inactive'}">
      <span class="icon">🌞</span>
      <span class="name">Solar</span>
      <span class="power">${harvest > 50 ? harvest.toFixed(0) + ' mW' : 'OFF'}</span>
    </div>
    <div class="harvester ${powerState?.net_mw > 0 ? '' : 'inactive'}">
      <span class="icon">👟</span>
      <span class="name">Piezo</span>
      <span class="power">${powerState?.net_mw > 0 ? '~20 mW' : 'IDLE'}</span>
    </div>
    <div class="harvester">
      <span class="icon">🌡️</span>
      <span class="name">Thermal</span>
      <span class="power">~10 mW</span>
    </div>
  </div>
  
  <div class="alerts">
    ⚠️ Battery low! Connect charger.
  </div>
  
  <script>
    // Auto-refresh every 5 seconds
    setTimeout(() => location.reload(), 5000);
  </script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export {
  parsePowerState,
  getAIThrottleLevel,
  canBurst,
  powerAwareTriumvirate,
  powerDashboardHTML,
  POWER_MODES,
  AI_THROTTLE_LEVELS,
};
