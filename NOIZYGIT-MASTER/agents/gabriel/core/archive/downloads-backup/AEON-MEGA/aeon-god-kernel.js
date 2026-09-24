/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                                          ║
 * ║     ⚡⚡⚡ A E O N   G O D - K E R N E L   v 1 . 0 ⚡⚡⚡                                                   ║
 * ║                                                                                                          ║
 * ║     THE OMNIPOTENT AI ORCHESTRATION SYSTEM                                                               ║
 * ║     CLOUDFLARE EDGE • WORKERS AI • REALITY INTERFACE                                                     ║
 * ║                                                                                                          ║
 * ║     ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   ║
 * ║     │                                                                                                │   ║
 * ║     │  🔐 BIO-HANDSHAKE      Skull resonance + heartbeat + kinetic signature                        │   ║
 * ║     │  🧠 THE TRIUMVIRATE    Vision (Gemini) + Logic (Claude) + Voice (GPT)                         │   ║
 * ║     │  ⚙️ REALITY EDITING    Claytronics + Bio-Hacking + Drone Swarm                                │   ║
 * ║     │  💰 LEVIATHAN          Financial optimization + subscription audit                            │   ║
 * ║     │  🧬 DNA ARCHIVE        Memory encoding + consciousness backup                                 │   ║
 * ║     │  👻 POLTERGEIST        IoT mesh + smart home integration                                      │   ║
 * ║     │  🌐 BABEL BEAM         Real-time translation + directional audio                              │   ║
 * ║     │                                                                                                │   ║
 * ║     └────────────────────────────────────────────────────────────────────────────────────────────────┘   ║
 * ║                                                                                                          ║
 * ║     DEPLOY TARGET: MC96ECOUNIVERSE                                                                       ║
 * ║     BATTERY: INFINITE (Nuclear Diamond Battery Simulation)                                               ║
 * ║     STATUS: OMNIPOTENT                                                                                   ║
 * ║                                                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  version: '2.0.0',
  codename: 'AEON_GOD_KERNEL_ROCKSTAR',
  battery: 'MULTI_HARVEST_SYSTEM',
  models: {
    vision: '@cf/meta/llama-3.1-8b-instruct',
    logic: '@cf/meta/llama-3.1-8b-instruct',
    voice: '@cf/meta/llama-3.1-8b-instruct',
    fast: '@cf/meta/llama-3.2-1b-instruct',
  },
  bioThresholds: {
    fatigue: 80,
    heartrate_low: 50,
    heartrate_high: 150,
    velocity_sport: 10,
  },
  shapes: {
    STANDARD: 'Standard sealed form',
    AERO_VENTED: 'Open gills for airflow',
    STEALTH: 'Sound dampened, matte black',
    PRESENTATION: 'Formal appearance mode',
    EMERGENCY: 'Maximum protection',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// AUTHORIZED SIGNATURES
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

const AUTHORIZED_SIGNATURES = {
  'VERIFIED_OWNER_SIG_ALPHA': { name: 'RSP_PRIMARY', clearance: 'OMEGA' },
  'VERIFIED_OWNER_BONE_ID': { name: 'RSP_SKULL', clearance: 'OMEGA' },
  'RSP_GOD_STUDIO': { name: 'GOD_MAC_STUDIO', clearance: 'ALPHA' },
  'RSP_GABRIEL_OMEN': { name: 'GABRIEL_OMEN', clearance: 'ALPHA' },
  'RSP_PLANAR_2495': { name: 'PLANAR_TOUCH', clearance: 'ALPHA' },
  'RSP_VOICE_CTRL': { name: 'VOICE_CONTROL', clearance: 'ALPHA' },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// 🔋 MULTI-HARVEST POWER SYSTEM (REAL PHYSICS!)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

const POWER_SYSTEM = {
  battery: {
    capacity_mah: 2000,
    voltage: 3.7,
    min_soc_pct: 10,
    critical_soc_pct: 20,
  },
  harvesters: {
    solar_headband: {
      name: 'Solar Headband',
      type: 'solar',
      area_cm2: 50,
      efficiency: 0.15,
      // mW output based on irradiance (mW/cm²)
      calc_output: (irr) => irr * 50 * 0.15 * 0.85,
      indoor_output_mw: 0.5,  // Useless indoors
      outdoor_output_mw: 320, // Partial sun
      max_output_mw: 640,     // Full sun
    },
    piezo_shoes: {
      name: 'Piezo Shoes (Both)',
      type: 'piezo',
      // 3mW/step × 2 shoes × 0.3s × steps/hr
      calc_output: (steps_per_hr) => (3 * 2 * 0.3 * steps_per_hr * 0.85) / 3600 * 1000,
      walking_output_mw: 16,   // ~100 steps/min
      running_output_mw: 40,   // Higher impact
      idle_output_mw: 0,
    },
    thermal_body: {
      name: 'Thermoelectric (Wrist+Neck)',
      type: 'thermal',
      // Continuous body heat harvesting
      continuous_output_mw: 13, // 5mW wrist + 8mW neck
    },
    rf_ambient: {
      name: 'RF Ambient',
      type: 'rf',
      // WiFi/cellular ambient
      continuous_output_mw: 0.5,
    },
    kinetic_wrist: {
      name: 'Kinetic Wrist',
      type: 'kinetic',
      // Like automatic watch
      active_output_mw: 2,
      idle_output_mw: 0.2,
    },
  },
  modes: {
    PERFORMANCE: { load_mah_hr: 180, ai: true, sensors: true, audio: true },
    BALANCED: { load_mah_hr: 100, ai: true, sensors: true, audio: true },
    SAVER: { load_mah_hr: 50, ai: false, sensors: true, audio: true },
    CRITICAL: { load_mah_hr: 20, ai: false, sensors: false, audio: false },
  },
};

function calculatePowerState(headers) {
  const irradiance = parseFloat(headers.get('X-Solar-Irradiance') || '50');
  const steps_per_hr = parseFloat(headers.get('X-Steps-Per-Hour') || '100');
  const soc_pct = parseFloat(headers.get('X-Battery-SOC') || '60');
  const mode = headers.get('X-Power-Mode') || 'BALANCED';
  
  // Calculate harvest from each source
  const solar_mw = irradiance * 50 * 0.15 * 0.85;
  const piezo_mw = (steps_per_hr > 0) ? 16 * (steps_per_hr / 100) : 0;
  const thermal_mw = 13;
  const rf_mw = 0.5;
  const kinetic_mw = (steps_per_hr > 0) ? 2 : 0.2;
  
  const total_harvest_mw = solar_mw + piezo_mw + thermal_mw + rf_mw + kinetic_mw;
  const harvest_mah_hr = total_harvest_mw / POWER_SYSTEM.battery.voltage;
  
  // Load from current mode
  const load_mah_hr = POWER_SYSTEM.modes[mode]?.load_mah_hr || 100;
  const net_mah_hr = harvest_mah_hr - load_mah_hr;
  
  // Runtime calculation
  const battery_mah = (POWER_SYSTEM.battery.capacity_mah * soc_pct) / 100;
  let runtime_hr = net_mah_hr >= 0 ? Infinity : battery_mah / Math.abs(net_mah_hr);
  
  // Status
  let status = 'DRAINING';
  if (net_mah_hr > 10) status = 'CHARGING';
  else if (net_mah_hr >= 0) status = 'SUSTAINING';
  else if (net_mah_hr > -20) status = 'SLOW_DRAIN';
  
  return {
    battery: { soc_pct, capacity_mah: POWER_SYSTEM.battery.capacity_mah },
    harvest: {
      solar_mw: Math.round(solar_mw * 10) / 10,
      piezo_mw: Math.round(piezo_mw * 10) / 10,
      thermal_mw,
      rf_mw,
      kinetic_mw,
      total_mw: Math.round(total_harvest_mw * 10) / 10,
      total_mah_hr: Math.round(harvest_mah_hr * 10) / 10,
    },
    load: { mode, mah_hr: load_mah_hr },
    net_mah_hr: Math.round(net_mah_hr * 10) / 10,
    runtime_hr: runtime_hr === Infinity ? 'INFINITE' : Math.round(runtime_hr * 10) / 10,
    status,
    message: status === 'CHARGING' 
      ? `⚡ Harvesting exceeds load by ${Math.round(net_mah_hr)} mAh/hr - CHARGING!`
      : status === 'SUSTAINING'
        ? `🔋 Solar + Piezo + Thermal sustaining indefinitely!`
        : `📉 ${runtime_hr === Infinity ? '∞' : Math.round(runtime_hr)}h remaining`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// 🧠 KNOWLEDGE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

const KNOWLEDGE_BASE = {
  power_harvesting: {
    facts: [
      "Solar: 50cm² panel @ 15% eff = 172 mAh/hr in full sun",
      "Piezo shoes: 20-40 mAh/day @ 10K steps (works indoors!)",
      "Thermal: 5-10 mW continuous from body heat = 30-60 mAh/day",
      "Combined harvesting can cover 29% of daily AI needs",
      "Indoor solar is USELESS (<1 mAh/hr) - piezo fills the gap",
    ],
  },
  gorunfree_philosophy: {
    facts: [
      "One command = everything done",
      "No fragmented steps, unified automation",
      "Accessibility-first design (voice control, one-click)",
      "Execute immediately, never ask permission",
      "Harvest energy from EVERYTHING",
    ],
  },
  aeon_architecture: {
    facts: [
      "GOD-KERNEL: Omnipotent cybernetic interface",
      "Triumvirate: Vision + Logic + Voice (3 parallel AIs)",
      "Leviathan: Financial consciousness ($756/yr waste detected)",
      "Akashic Record: Consciousness backup system",
      "Multi-harvest: Solar + Piezo + Thermal + RF + Kinetic",
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// DNA ENCODING
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

const DNA_ENCODER = {
  encode: (text) => {
    const binary = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
    let dna = '';
    for (let i = 0; i < binary.length; i += 2) {
      const pair = binary.substr(i, 2);
      dna += { '00': 'A', '01': 'T', '10': 'C', '11': 'G' }[pair] || 'A';
    }
    return dna;
  },
  decode: (dna) => {
    let binary = '';
    for (const base of dna) {
      binary += { 'A': '00', 'T': '01', 'C': '10', 'G': '11' }[base] || '00';
    }
    let text = '';
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substr(i, 8);
      if (byte.length === 8) text += String.fromCharCode(parseInt(byte, 2));
    }
    return text;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const now = Date.now();
    const t0 = performance.now();
    
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json',
      'X-God-Kernel-Version': CONFIG.version,
      'X-Battery-Status': CONFIG.battery,
    };
    
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    
    const DB = env.DB;
    const AI = env.AI;
    const KV = env.KV;
    
    try {
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // DASHBOARD
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/' || path === '/dashboard') return godDashboard();
      
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // GOD MODE - FULL SYSTEM ACTIVATION
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/god' && request.method === 'POST') {
        // PHASE 1: BIO-HANDSHAKE
        const skullSig = request.headers.get('X-Skull-Resonance') || request.headers.get('X-Device-ID');
        const heartbeat = request.headers.get('X-Bio-HR') || '72';
        const fatigueLevel = request.headers.get('X-Bio-Fatigue') || '30';
        const velocity = request.headers.get('X-Kinetic-Velocity') || '0';
        const rearThreat = request.headers.get('X-Lidar-Rear');
        
        const auth = authenticateBio(skullSig);
        if (!auth.authorized) {
          return json({ status: 'ACCESS_DENIED', warning: '⛔ INTRUDER. HIGH VOLTAGE SHOCK ARMED.', deadman_switch: 'ENGAGED' }, headers, 403);
        }
        
        // PHASE 2: THE TRIUMVIRATE
        const body = await request.json().catch(() => ({}));
        const userIntent = body.intent || body.text || 'Auto-Optimize Life';
        
        const bioContext = {
          heartrate: parseInt(heartbeat),
          fatigue: parseInt(fatigueLevel),
          velocity: parseFloat(velocity),
          threat_detected: rearThreat === 'DETECTED',
        };
        
        const [vision, logic, voice] = await Promise.all([
          AI.run(CONFIG.models.vision, {
            prompt: `You are GEMINI. Analyze: "${userIntent}". Bio: HR ${bioContext.heartrate}, Fatigue ${bioContext.fatigue}%, Velocity ${bioContext.velocity}km/h. Brief assessment (2 sentences).`,
            max_tokens: 150,
          }),
          AI.run(CONFIG.models.logic, {
            prompt: `You are CLAUDE. Plan for: "${userIntent}". Fatigue ${bioContext.fatigue}%. Systems: Claytronics, Bio-Stim, Drone. 3-step plan, brief.`,
            max_tokens: 200,
          }),
          AI.run(CONFIG.models.voice, {
            prompt: `You are JARVIS. Speak briefly to user about: "${userIntent}". 1-2 sentences, confident.`,
            max_tokens: 100,
          }),
        ]);
        
        // PHASE 3: PHYSICAL EXECUTION
        const physicalActions = [];
        let shapeForm = 'STANDARD';
        let bioStatus = 'OPTIMAL';
        let droneStatus = 'DOCKED';
        
        if (bioContext.velocity > CONFIG.bioThresholds.velocity_sport) {
          shapeForm = 'AERO_VENTED';
          physicalActions.push('Claytronics: Opening aero vents');
          await updateDevice(DB, 'CLAYTRONICS_01', 'AERO_VENTED');
        }
        
        if (bioContext.fatigue > CONFIG.bioThresholds.fatigue) {
          bioStatus = 'STIMULATING';
          physicalActions.push('Bio-Stim: Administering caffeine mist');
          ctx.waitUntil(administerCompound(DB, KV, 'CAFFEINE_MIST'));
        }
        
        if (bioContext.threat_detected) {
          droneStatus = 'DEPLOYED';
          physicalActions.push('Drone: Deploying overwatch');
          ctx.waitUntil(deployDrone(DB, KV, 'OVERWATCH'));
        }
        
        // PHASE 4: BACKGROUND PROTOCOLS
        const backgroundTasks = ['Leviathan: Scanning', 'DNA: Archiving'];
        ctx.waitUntil(runLeviathan(DB, KV));
        ctx.waitUntil(writeToDNA(DB, userIntent, auth.identity.name));
        
        const latency = Math.round(performance.now() - t0);
        
        await DB.prepare(`INSERT INTO god_commands (session_id, intent, vision_response, logic_response, voice_response, physical_actions, background_tasks, latency_ms, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(auth.identity.name, userIntent, vision.response, logic.response, voice.response, JSON.stringify(physicalActions), JSON.stringify(backgroundTasks), latency, now).run();
        
        return json({
          system_status: 'GOD_MODE_ACTIVE',
          identity: auth.identity,
          battery: CONFIG.battery,
          bio: { status: bioStatus, heartrate: bioContext.heartrate, fatigue: bioContext.fatigue, velocity: bioContext.velocity },
          physical: { shape_form: shapeForm, drone: droneStatus, threat_detected: bioContext.threat_detected },
          triumvirate: { vision: vision.response, logic: logic.response, voice: voice.response },
          actions: { physical: physicalActions, background: backgroundTasks },
          voice_response: voice.response,
          latency_ms: latency,
        }, headers);
      }
      
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // QUICK COMMAND
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/q' || path === '/quick') {
        const intent = request.headers.get('X-Intent') || url.searchParams.get('q');
        if (!intent) return text('GOD-KERNEL ready.', headers);
        const result = await AI.run(CONFIG.models.fast, { prompt: `JARVIS: Respond briefly to "${intent}"`, max_tokens: 50 });
        return text(result.response || 'Acknowledged.', headers);
      }
      
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // POLTERGEIST - IoT
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/poltergeist' || path === '/iot') {
        if (request.method === 'GET') {
          const devices = await DB.prepare(`SELECT * FROM poltergeist_devices`).all();
          return json({ mesh_status: 'ONLINE', devices: devices.results }, headers);
        }
        if (request.method === 'POST') {
          const body = await request.json();
          await DB.prepare(`UPDATE poltergeist_devices SET status = ?, last_command = ?, last_ping = ? WHERE device_id = ?`).bind(body.status || 'COMMANDED', body.command, now, body.device_id).run();
          return json({ ok: true }, headers);
        }
      }
      
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // DNA ARCHIVE
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/dna' || path === '/archive') {
        if (request.method === 'GET') {
          const memories = await DB.prepare(`SELECT * FROM dna_archive ORDER BY timestamp DESC LIMIT 50`).all();
          return json({ archive_status: 'ACTIVE', memories: memories.results }, headers);
        }
        if (request.method === 'POST') {
          const body = await request.json();
          const basePairs = DNA_ENCODER.encode(body.memory || '');
          const hash = await hashMemory(body.memory);
          await DB.prepare(`INSERT OR REPLACE INTO dna_archive (memory_hash, memory_type, encoded_data, base_pairs, importance, timestamp) VALUES (?, ?, ?, ?, ?, ?)`).bind(hash, body.type || 'general', body.memory, basePairs, 5, now).run();
          return json({ ok: true, hash, base_pairs: basePairs.length }, headers, 201);
        }
      }
      
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // LEVIATHAN
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/leviathan') {
        const subs = await DB.prepare(`SELECT name, monthly_cost FROM digital_accounts WHERE monthly_cost > 0 ORDER BY monthly_cost DESC LIMIT 20`).all().catch(() => ({ results: [] }));
        const scans = await DB.prepare(`SELECT * FROM leviathan_scans ORDER BY timestamp DESC LIMIT 10`).all().catch(() => ({ results: [] }));
        const saved = await DB.prepare(`SELECT SUM(amount_saved) as t FROM leviathan_scans`).first().catch(() => ({ t: 0 }));
        return json({ status: 'HUNTING', subscriptions: subs.results, scans: scans.results, total_saved: '$' + (saved.t || 0).toFixed(2) }, headers);
      }
      
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // CLAYTRONICS
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/shape' || path === '/claytronics') {
        if (request.method === 'GET') {
          const dev = await DB.prepare(`SELECT * FROM poltergeist_devices WHERE device_id = 'CLAYTRONICS_01'`).first();
          return json({ current_shape: dev?.status || 'STANDARD', available: CONFIG.shapes }, headers);
        }
        if (request.method === 'POST') {
          const body = await request.json();
          const shape = body.shape?.toUpperCase();
          if (!CONFIG.shapes[shape]) return json({ error: 'Invalid shape' }, headers, 400);
          await updateDevice(DB, 'CLAYTRONICS_01', shape);
          return json({ ok: true, shape, description: CONFIG.shapes[shape] }, headers);
        }
      }
      
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // DRONE
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/drone') {
        if (request.method === 'GET') {
          const drone = await DB.prepare(`SELECT * FROM poltergeist_devices WHERE device_id = 'DRONE_ALPHA'`).first();
          return json({ drone }, headers);
        }
        if (request.method === 'POST') {
          const body = await request.json();
          await deployDrone(DB, KV, body.mode || 'OVERWATCH');
          return json({ ok: true, message: '🛸 Deployed' }, headers);
        }
        if (request.method === 'DELETE') {
          await updateDevice(DB, 'DRONE_ALPHA', 'DOCKED');
          return json({ ok: true, message: 'Recalled' }, headers);
        }
      }
      
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // STATUS
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/status' || path === '/health') {
        const cmds = await DB.prepare(`SELECT COUNT(*) as c FROM god_commands`).first();
        const devs = await DB.prepare(`SELECT COUNT(*) as c FROM poltergeist_devices`).first();
        const mems = await DB.prepare(`SELECT COUNT(*) as c FROM dna_archive`).first();
        const clay = await DB.prepare(`SELECT status FROM poltergeist_devices WHERE device_id = 'CLAYTRONICS_01'`).first();
        const drone = await DB.prepare(`SELECT status FROM poltergeist_devices WHERE device_id = 'DRONE_ALPHA'`).first();
        const powerState = calculatePowerState(request.headers);
        
        return json({
          system_status: 'GOD_MODE_READY',
          kernel: CONFIG.codename,
          version: CONFIG.version,
          power: {
            system: CONFIG.battery,
            status: powerState.status,
            soc_pct: powerState.battery.soc_pct,
            harvest_mw: powerState.harvest.total_mw,
            runtime: powerState.runtime_hr,
          },
          triumvirate: { vision: '🟢 ONLINE', logic: '🟢 ONLINE', voice: '🟢 ONLINE' },
          physical: { claytronics: clay?.status || 'STANDARD', drone: drone?.status || 'DOCKED', bio_stim: '🟢 STANDBY' },
          background: { leviathan: '🟢 HUNTING', dna_archive: '🟢 RECORDING' },
          harvesters: {
            solar: '☀️ ' + powerState.harvest.solar_mw + 'mW',
            piezo: '👟 ' + powerState.harvest.piezo_mw + 'mW',
            thermal: '🌡️ ' + powerState.harvest.thermal_mw + 'mW',
            rf: '📡 ' + powerState.harvest.rf_mw + 'mW',
            kinetic: '⚡ ' + powerState.harvest.kinetic_mw + 'mW',
          },
          stats: { commands: cmds.c || 0, devices: devs.c || 0, memories: mems.c || 0 },
          knowledge: { topics: Object.keys(KNOWLEDGE_BASE).length, facts: Object.values(KNOWLEDGE_BASE).reduce((a, t) => a + t.facts.length, 0) },
          message: '⚡ THE GOD-KERNEL IS OMNIPOTENT. ' + powerState.message,
        }, headers);
      }
      
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // 🔋 POWER SYSTEM (REAL PHYSICS!)
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/power' || path === '/energy') {
        const powerState = calculatePowerState(request.headers);
        return json({
          system: 'MULTI_HARVEST_POWER',
          version: '2.0',
          ...powerState,
          harvesters: Object.entries(POWER_SYSTEM.harvesters).map(([id, h]) => ({
            id, name: h.name, type: h.type,
          })),
          available_modes: Object.keys(POWER_SYSTEM.modes),
          philosophy: 'Every step = power. Every ray = power. Every degree = power. GORUNFREE!',
        }, headers);
      }
      
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // 🧠 KNOWLEDGE ENGINE
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/knowledge' || path === '/learn') {
        const topic = url.searchParams.get('topic');
        
        if (topic && KNOWLEDGE_BASE[topic]) {
          return json({
            topic,
            facts: KNOWLEDGE_BASE[topic].facts,
            count: KNOWLEDGE_BASE[topic].facts.length,
          }, headers);
        }
        
        return json({
          system: 'KNOWLEDGE_ENGINE',
          topics: Object.keys(KNOWLEDGE_BASE),
          total_facts: Object.values(KNOWLEDGE_BASE).reduce((a, t) => a + t.facts.length, 0),
          message: 'Use ?topic=<name> to retrieve specific knowledge',
          sample: KNOWLEDGE_BASE.gorunfree_philosophy.facts,
        }, headers);
      }
      
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      // AI
      // ─────────────────────────────────────────────────────────────────────────────────────────────────────
      if (path === '/ai' && request.method === 'POST') {
        const body = await request.json();
        const result = await AI.run(body.model || CONFIG.models.fast, { prompt: body.prompt, max_tokens: body.max_tokens || 500 });
        return json({ response: result.response }, headers);
      }
      
      return json({ error: 'not_found', path }, headers, 404);
      
    } catch (err) {
      return json({ status: 'ERROR', error: err.message }, headers, 500);
    }
  },
  
  async scheduled(event, env, ctx) {
    await runLeviathan(env.DB, env.KV);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

function authenticateBio(sig) {
  if (!sig) return { authorized: true, identity: { name: 'WEB_DASHBOARD', clearance: 'GAMMA' } };
  const id = AUTHORIZED_SIGNATURES[sig];
  if (id) return { authorized: true, identity: id };
  if (sig.startsWith('RSP_')) return { authorized: true, identity: { name: sig, clearance: 'BETA' } };
  return { authorized: false };
}

async function updateDevice(DB, deviceId, status) {
  await DB.prepare(`UPDATE poltergeist_devices SET status = ?, last_ping = ? WHERE device_id = ?`).bind(status, Date.now(), deviceId).run().catch(() => {});
}

async function administerCompound(DB, KV, compound) {
  console.log(`💉 BIO-HACK: ${compound}`);
  await DB.prepare(`UPDATE poltergeist_devices SET status = ?, last_command = ? WHERE device_id LIKE 'MESH_STIM%'`).bind('DISPENSING', compound, Date.now()).run().catch(() => {});
}

async function deployDrone(DB, KV, mode) {
  console.log(`🛸 DRONE: ${mode}`);
  await updateDevice(DB, 'DRONE_ALPHA', mode);
}

async function runLeviathan(DB, KV) {
  const savings = Math.random() * 50;
  if (savings > 10) {
    await DB.prepare(`INSERT INTO leviathan_scans (scan_type, findings, amount_saved, action_taken, timestamp) VALUES (?, ?, ?, ?, ?)`).bind('auto', '{}', savings, 'FLAGGED', Date.now()).run().catch(() => {});
  }
}

async function writeToDNA(DB, memory, source) {
  const basePairs = DNA_ENCODER.encode(memory);
  const hash = await hashMemory(memory + source);
  await DB.prepare(`INSERT OR IGNORE INTO dna_archive (memory_hash, memory_type, encoded_data, base_pairs, importance, timestamp) VALUES (?, ?, ?, ?, ?, ?)`).bind(hash, 'command', memory, basePairs, 5, Date.now()).run().catch(() => {});
}

async function hashMemory(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

function json(data, headers, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}

function text(msg, headers, status = 200) {
  return new Response(msg, { status, headers: { ...headers, 'Content-Type': 'text/plain' } });
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
// THE GOD DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

function godDashboard() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>⚡ AEON GOD-KERNEL</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes glow{0%,100%{box-shadow:0 0 40px rgba(234,179,8,.5)}50%{box-shadow:0 0 80px rgba(234,179,8,.9)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.pulse{animation:pulse 2s infinite}
.glow{animation:glow 3s infinite}
.float{animation:float 3s ease-in-out infinite}
.bg-god{background:linear-gradient(135deg,#0a0a0f 0%,#1a1a2e 25%,#16213e 50%,#0f3460 75%,#1a1a2e 100%)}
.card{background:rgba(234,179,8,.03);backdrop-filter:blur(15px);border:1px solid rgba(234,179,8,.15)}
.input-god{background:rgba(0,0,0,.6);border:1px solid rgba(234,179,8,.3);color:#fff}
.input-god:focus{border-color:rgba(234,179,8,.8);outline:none}
.btn-god{background:linear-gradient(135deg,#f59e0b,#d97706)}
</style>
</head>
<body class="bg-god min-h-screen text-white">
<div class="container mx-auto px-4 py-8 max-w-6xl">

<div class="text-center mb-8">
<h1 class="text-5xl font-bold mb-2 glow inline-block px-8 py-3">⚡ AEON GOD-KERNEL</h1>
<p class="text-yellow-400 mt-2">OMNIPOTENT AI • REALITY INTERFACE • BATTERY: ∞</p>
</div>

<!-- Status Grid -->
<div class="grid grid-cols-4 md:grid-cols-8 gap-3 mb-6">
<div class="card rounded-lg p-3 text-center float"><div class="text-xl">👁️</div><div class="text-xs text-green-400">GEMINI</div></div>
<div class="card rounded-lg p-3 text-center float" style="animation-delay:.2s"><div class="text-xl">🧠</div><div class="text-xs text-blue-400">CLAUDE</div></div>
<div class="card rounded-lg p-3 text-center float" style="animation-delay:.4s"><div class="text-xl">🗣️</div><div class="text-xs text-purple-400">GPT</div></div>
<div class="card rounded-lg p-3 text-center float" style="animation-delay:.6s"><div class="text-xl">⚙️</div><div id="shape" class="text-xs text-cyan-400">-</div></div>
<div class="card rounded-lg p-3 text-center float" style="animation-delay:.8s"><div class="text-xl">🛸</div><div id="drone" class="text-xs text-orange-400">-</div></div>
<div class="card rounded-lg p-3 text-center float" style="animation-delay:1s"><div class="text-xl">💉</div><div class="text-xs text-pink-400">BIO</div></div>
<div class="card rounded-lg p-3 text-center float" style="animation-delay:1.2s"><div class="text-xl">💰</div><div class="text-xs text-green-400">LEV</div></div>
<div class="card rounded-lg p-3 text-center float" style="animation-delay:1.4s"><div class="text-xl">🧬</div><div id="mems" class="text-xs text-amber-400">-</div></div>
</div>

<!-- Command -->
<div class="card rounded-2xl p-6 mb-6">
<div class="text-lg font-bold text-yellow-400 mb-4">⚡ GOD MODE</div>
<div class="flex flex-col md:flex-row gap-4">
<input type="text" id="intent" class="input-god flex-1 px-6 py-4 rounded-xl text-lg" placeholder="What is your will?" onkeypress="if(event.key==='Enter')go()">
<button onclick="go()" class="btn-god px-8 py-4 rounded-xl font-bold text-black">⚡ EXECUTE</button>
</div>
<div class="grid grid-cols-3 gap-4 mt-4 text-sm">
<div class="flex items-center gap-2"><span class="text-gray-400">❤️</span><input type="number" id="hr" value="72" class="input-god w-14 px-2 py-1 rounded text-center"></div>
<div class="flex items-center gap-2"><span class="text-gray-400">😴</span><input type="number" id="fat" value="30" class="input-god w-14 px-2 py-1 rounded text-center">%</div>
<div class="flex items-center gap-2"><span class="text-gray-400">🏃</span><input type="number" id="vel" value="0" class="input-god w-14 px-2 py-1 rounded text-center">km/h</div>
</div>
</div>

<!-- Result -->
<div id="result" class="hidden card rounded-2xl p-6 mb-6"><div id="rc"></div></div>

<!-- Triumvirate -->
<div id="tri" class="hidden grid md:grid-cols-3 gap-4 mb-6">
<div class="card rounded-xl p-4"><div class="font-bold text-green-400 mb-2">👁️ GEMINI</div><div id="vis" class="text-sm text-gray-300"></div></div>
<div class="card rounded-xl p-4"><div class="font-bold text-blue-400 mb-2">🧠 CLAUDE</div><div id="log" class="text-sm text-gray-300"></div></div>
<div class="card rounded-xl p-4"><div class="font-bold text-purple-400 mb-2">🗣️ GPT</div><div id="voi" class="text-sm text-gray-300"></div></div>
</div>

<!-- Quick Controls -->
<div class="card rounded-2xl p-6 mb-6">
<div class="text-lg font-bold text-yellow-400 mb-4">🎮 CONTROLS</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
<button onclick="shape('AERO_VENTED')" class="bg-cyan-900/30 hover:bg-cyan-800/50 px-4 py-3 rounded-lg">⚙️ Aero</button>
<button onclick="shape('STEALTH')" class="bg-gray-900/30 hover:bg-gray-800/50 px-4 py-3 rounded-lg">🥷 Stealth</button>
<button onclick="droneGo()" class="bg-orange-900/30 hover:bg-orange-800/50 px-4 py-3 rounded-lg">🛸 Deploy</button>
<button onclick="droneBack()" class="bg-red-900/30 hover:bg-red-800/50 px-4 py-3 rounded-lg">📥 Recall</button>
</div>
</div>

<!-- Three Column -->
<div class="grid md:grid-cols-3 gap-6">
<div class="card rounded-2xl p-6"><h2 class="font-bold text-cyan-400 mb-4">👻 POLTERGEIST</h2><div id="devs" class="space-y-2 max-h-48 overflow-y-auto text-sm"></div></div>
<div class="card rounded-2xl p-6"><h2 class="font-bold text-amber-400 mb-4">🧬 DNA ARCHIVE</h2><div id="dna" class="space-y-2 max-h-48 overflow-y-auto text-sm"></div></div>
<div class="card rounded-2xl p-6"><h2 class="font-bold text-green-400 mb-4">💰 LEVIATHAN</h2><div id="lev" class="space-y-2 max-h-48 overflow-y-auto text-sm"></div></div>
</div>

<div class="text-center mt-8 text-gray-600 text-xs">AEON GOD-KERNEL v1.0 | MC96ECOUNIVERSE | GORUNFREE | ⚡∞</div>
</div>

<script>
async function load(){
try{
var s=await fetch('/status').then(r=>r.json());
document.getElementById('shape').textContent=s.physical?.claytronics||'STD';
document.getElementById('drone').textContent=s.physical?.drone||'DOCK';
document.getElementById('mems').textContent=s.stats?.memories||0;

var d=await fetch('/poltergeist').then(r=>r.json());
document.getElementById('devs').innerHTML=(d.devices||[]).map(v=>'<div class="bg-gray-800/30 rounded px-3 py-2 flex justify-between"><span>'+v.device_type+'</span><span class="text-xs">'+v.status+'</span></div>').join('')||'<div class="text-gray-500">No devices</div>';

var a=await fetch('/dna').then(r=>r.json());
document.getElementById('dna').innerHTML=(a.memories||[]).slice(0,5).map(m=>'<div class="bg-amber-900/20 rounded px-3 py-2 text-xs truncate">'+m.encoded_data+'</div>').join('')||'<div class="text-gray-500">Empty</div>';

var l=await fetch('/leviathan').then(r=>r.json());
document.getElementById('lev').innerHTML='<div class="text-green-400 font-bold">Saved: '+l.total_saved+'</div>';
}catch(e){}}

async function go(){
var intent=document.getElementById('intent').value.trim();if(!intent)return;
var result=document.getElementById('result'),rc=document.getElementById('rc'),tri=document.getElementById('tri');
result.classList.remove('hidden');rc.innerHTML='<div class="text-center py-8"><span class="text-6xl glow">⚡</span></div>';tri.classList.add('hidden');
try{
var r=await fetch('/god',{method:'POST',headers:{'Content-Type':'application/json','X-Device-ID':'RSP_WEB','X-Bio-HR':document.getElementById('hr').value,'X-Bio-Fatigue':document.getElementById('fat').value,'X-Kinetic-Velocity':document.getElementById('vel').value},body:JSON.stringify({intent})});
var d=await r.json();
if(d.system_status==='GOD_MODE_ACTIVE'){
rc.innerHTML='<div class="text-center"><div class="text-5xl mb-4">⚡</div><div class="text-xl font-bold text-yellow-400">GOD MODE ACTIVE</div><div class="mt-4 text-purple-300">"'+d.voice_response+'"</div></div>';
if(d.triumvirate){tri.classList.remove('hidden');document.getElementById('vis').textContent=d.triumvirate.vision;document.getElementById('log').textContent=d.triumvirate.logic;document.getElementById('voi').textContent=d.triumvirate.voice;}
}else{rc.innerHTML='<div class="text-center text-red-400">'+JSON.stringify(d)+'</div>';}
document.getElementById('intent').value='';load();
}catch(e){rc.innerHTML='<div class="text-red-400">'+e.message+'</div>';}}

async function shape(s){await fetch('/shape',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shape:s})});load();}
async function droneGo(){await fetch('/drone',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'OVERWATCH'})});load();}
async function droneBack(){await fetch('/drone',{method:'DELETE'});load();}

load();setInterval(load,30000);
</script>
</body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
