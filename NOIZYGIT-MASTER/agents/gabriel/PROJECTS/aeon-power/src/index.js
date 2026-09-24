/**
 * ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                                                        ║
 * ║     🔋 A E O N   P O W E R   M A N A G E M E N T   v 1 . 0 🔋                                                          ║
 * ║                                                                                                                        ║
 * ║     REAL PHYSICS-BASED ENERGY SYSTEM FOR WEARABLE AI                                                                  ║
 * ║                                                                                                                        ║
 * ║     Architecture:                                                                                                      ║
 * ║       🌞 Solar Panel (50cm² flexible CIGS)                                                                            ║
 * ║       🔋 Primary Battery (2000mAh LiPo)                                                                               ║
 * ║       ⚡ Supercapacitor (burst handling)                                                                              ║
 * ║       📊 MPPT + Power Management IC                                                                                   ║
 * ║                                                                                                                        ║
 * ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// POWER SYSTEM CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

const POWER_CONFIG = {
  // Solar Panel Specs
  panel: {
    area_cm2: 50.0,           // Headband: 3cm × 25cm × 70% coverage
    efficiency: 0.15,         // Flexible CIGS panel
    conversion_eff: 0.85,     // MPPT + wiring losses
  },
  
  // Battery Specs
  battery: {
    capacity_mah: 2000,       // LiPo main battery
    voltage_nom: 3.7,         // Nominal voltage
    min_soc_pct: 10,          // Emergency shutdown threshold
    critical_soc_pct: 20,     // Load shedding threshold
    low_soc_pct: 35,          // Warning threshold
  },
  
  // Irradiance Levels (mW/cm²)
  irradiance: {
    full_sun: 100,
    partial_sun: 50,
    cloudy: 30,
    shade: 10,
    indoor_bright: 0.5,
    indoor_dim: 0.1,
  },
  
  // Load Profiles (mAh/hr)
  loads: {
    standby: 20,              // BLE beacon only
    audio: 50,                // Bone conduction audio
    active: 100,              // Audio + sensors + BLE
    ai_light: 150,            // Light AI inference
    ai_full: 180,             // Full GOD-KERNEL
    ai_burst: 300,            // Edge AI burst processing
  },
  
  // Power Modes
  modes: {
    PERFORMANCE: { name: 'Performance', load: 180, ai: true, sensors: true, audio: true },
    BALANCED: { name: 'Balanced', load: 100, ai: true, sensors: true, audio: true },
    SAVER: { name: 'Power Saver', load: 50, ai: false, sensors: true, audio: true },
    CRITICAL: { name: 'Critical', load: 20, ai: false, sensors: false, audio: false },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// POWER STATE CLASS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

class AeonPowerState {
  constructor(initialSoc = 60) {
    this.battery = {
      soc_mah: (POWER_CONFIG.battery.capacity_mah * initialSoc) / 100,
      capacity_mah: POWER_CONFIG.battery.capacity_mah,
      voltage: POWER_CONFIG.battery.voltage_nom,
      temperature_c: 25,
      cycles: 0,
      health_pct: 100,
    };
    
    this.solar = {
      irradiance_mw_cm2: 0,
      harvest_mw: 0,
      harvest_mah_hr: 0,
      panel_temp_c: 25,
    };
    
    this.load = {
      current_mah_hr: POWER_CONFIG.loads.active,
      mode: 'BALANCED',
      ai_active: true,
      audio_active: true,
      sensors_active: true,
    };
    
    this.stats = {
      runtime_remaining_hr: 0,
      time_to_full_hr: 0,
      net_power_mah_hr: 0,
      energy_balance: 'NEUTRAL',
    };
    
    this.alerts = [];
  }
  
  get soc_pct() {
    return (this.battery.soc_mah / this.battery.capacity_mah) * 100;
  }
  
  get status() {
    const soc = this.soc_pct;
    if (soc >= 80) return 'EXCELLENT';
    if (soc >= 50) return 'GOOD';
    if (soc >= 35) return 'OK';
    if (soc >= 20) return 'LOW';
    if (soc >= 10) return 'CRITICAL';
    return 'EMERGENCY';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// POWER CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

function calculateSolarHarvest(irradiance_mw_cm2, panel_temp_c = 25) {
  const { area_cm2, efficiency, conversion_eff } = POWER_CONFIG.panel;
  
  // Temperature derating (panels lose ~0.4%/°C above 25°C)
  const temp_factor = 1 - Math.max(0, (panel_temp_c - 25) * 0.004);
  
  // Total harvest
  const harvest_mw = irradiance_mw_cm2 * area_cm2 * efficiency * conversion_eff * temp_factor;
  const harvest_mah_hr = harvest_mw / POWER_CONFIG.battery.voltage_nom;
  
  return { harvest_mw, harvest_mah_hr };
}

function calculateRuntime(state) {
  const net = state.solar.harvest_mah_hr - state.load.current_mah_hr;
  
  if (net >= 0) {
    // Solar sustaining or charging
    const time_to_full = (state.battery.capacity_mah - state.battery.soc_mah) / net;
    return {
      runtime_hr: Infinity,
      time_to_full_hr: net > 0 ? time_to_full : Infinity,
      net_power_mah_hr: net,
      balance: net > 0 ? 'CHARGING' : 'SUSTAINING',
    };
  } else {
    // Draining
    const runtime = state.battery.soc_mah / Math.abs(net);
    return {
      runtime_hr: runtime,
      time_to_full_hr: Infinity,
      net_power_mah_hr: net,
      balance: 'DRAINING',
    };
  }
}

function getRecommendedMode(state) {
  const soc = state.soc_pct;
  const balance = state.stats.energy_balance;
  
  if (soc < POWER_CONFIG.battery.min_soc_pct) {
    return 'CRITICAL';
  }
  if (soc < POWER_CONFIG.battery.critical_soc_pct) {
    return 'SAVER';
  }
  if (soc < POWER_CONFIG.battery.low_soc_pct && balance === 'DRAINING') {
    return 'BALANCED';
  }
  if (balance === 'CHARGING' || balance === 'SUSTAINING') {
    return 'PERFORMANCE';
  }
  return 'BALANCED';
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// POWER MANAGEMENT API
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

function updatePowerState(state, irradiance_mw_cm2, mode = null, duration_hr = 1) {
  // Update solar
  const solar = calculateSolarHarvest(irradiance_mw_cm2, state.solar.panel_temp_c);
  state.solar.irradiance_mw_cm2 = irradiance_mw_cm2;
  state.solar.harvest_mw = solar.harvest_mw;
  state.solar.harvest_mah_hr = solar.harvest_mah_hr;
  
  // Update mode if specified
  if (mode && POWER_CONFIG.modes[mode]) {
    const m = POWER_CONFIG.modes[mode];
    state.load.mode = mode;
    state.load.current_mah_hr = m.load;
    state.load.ai_active = m.ai;
    state.load.sensors_active = m.sensors;
    state.load.audio_active = m.audio;
  }
  
  // Calculate net power
  const net_mah = (state.solar.harvest_mah_hr - state.load.current_mah_hr) * duration_hr;
  
  // Update battery SOC
  state.battery.soc_mah = Math.max(0, Math.min(
    state.battery.capacity_mah,
    state.battery.soc_mah + net_mah
  ));
  
  // Update stats
  const runtime = calculateRuntime(state);
  state.stats.runtime_remaining_hr = runtime.runtime_hr;
  state.stats.time_to_full_hr = runtime.time_to_full_hr;
  state.stats.net_power_mah_hr = runtime.net_power_mah_hr;
  state.stats.energy_balance = runtime.balance;
  
  // Generate alerts
  state.alerts = [];
  const soc = state.soc_pct;
  
  if (soc < POWER_CONFIG.battery.min_soc_pct) {
    state.alerts.push({ level: 'EMERGENCY', message: 'Battery critical! Shutdown imminent.' });
  } else if (soc < POWER_CONFIG.battery.critical_soc_pct) {
    state.alerts.push({ level: 'CRITICAL', message: 'Battery low. Switching to power saver.' });
  } else if (soc < POWER_CONFIG.battery.low_soc_pct) {
    state.alerts.push({ level: 'WARNING', message: 'Battery below 35%. Consider charging.' });
  }
  
  if (runtime.runtime_hr < 1 && runtime.balance === 'DRAINING') {
    state.alerts.push({ level: 'WARNING', message: `Less than 1 hour remaining (${runtime.runtime_hr.toFixed(1)}h)` });
  }
  
  return state;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SIMULATION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

function simulateDay(scenario = 'mixed', initial_soc = 60) {
  const state = new AeonPowerState(initial_soc);
  const log = [];
  
  const scenarios = {
    outdoor: () => 50 + Math.random() * 50,         // 50-100 mW/cm²
    indoor: () => 0.1 + Math.random() * 0.4,        // 0.1-0.5 mW/cm²
    mixed: (h) => h < 4 ? 0.1 + Math.random() * 0.4 : 30 + Math.random() * 60,
    commute: (h) => {
      if (h < 1 || (h >= 5 && h < 6)) return 20 + Math.random() * 30;  // Transit
      if (h >= 1 && h < 5) return 0.2 + Math.random() * 0.3;           // Office
      return 40 + Math.random() * 40;                                   // Evening outdoor
    },
  };
  
  const getIrradiance = scenarios[scenario] || scenarios.mixed;
  
  for (let h = 0; h < 16; h++) {  // 16-hour day
    const irr = typeof getIrradiance === 'function' 
      ? (getIrradiance.length > 0 ? getIrradiance(h) : getIrradiance())
      : getIrradiance;
    
    // Auto-adjust mode based on power state
    const recommended = getRecommendedMode(state);
    updatePowerState(state, irr, recommended, 1);
    
    log.push({
      hour: h,
      irradiance: Math.round(irr * 100) / 100,
      harvest_mah: Math.round(state.solar.harvest_mah_hr * 10) / 10,
      load_mah: state.load.current_mah_hr,
      net_mah: Math.round(state.stats.net_power_mah_hr * 10) / 10,
      soc_pct: Math.round(state.soc_pct * 10) / 10,
      mode: state.load.mode,
      balance: state.stats.energy_balance,
      runtime_hr: state.stats.runtime_remaining_hr === Infinity 
        ? '∞' 
        : Math.round(state.stats.runtime_remaining_hr * 10) / 10,
    });
  }
  
  return log;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CLOUDFLARE WORKER INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };
    
    // GET /power - Current power state
    if (path === '/power' || path === '/') {
      const soc = parseInt(url.searchParams.get('soc') || '60');
      const irr = parseFloat(url.searchParams.get('irr') || '50');
      const mode = url.searchParams.get('mode') || 'BALANCED';
      
      const state = new AeonPowerState(soc);
      updatePowerState(state, irr, mode);
      
      return new Response(JSON.stringify({
        status: 'POWER_SYSTEM_ONLINE',
        battery: {
          soc_pct: Math.round(state.soc_pct * 10) / 10,
          status: state.status,
          voltage: state.battery.voltage,
          health_pct: state.battery.health_pct,
        },
        solar: {
          irradiance_mw_cm2: state.solar.irradiance_mw_cm2,
          harvest_mw: Math.round(state.solar.harvest_mw * 10) / 10,
          harvest_mah_hr: Math.round(state.solar.harvest_mah_hr * 10) / 10,
        },
        load: {
          mode: state.load.mode,
          current_mah_hr: state.load.current_mah_hr,
          ai_active: state.load.ai_active,
          audio_active: state.load.audio_active,
        },
        stats: {
          runtime_remaining_hr: state.stats.runtime_remaining_hr === Infinity 
            ? 'INFINITE' 
            : Math.round(state.stats.runtime_remaining_hr * 10) / 10,
          energy_balance: state.stats.energy_balance,
          net_power_mah_hr: Math.round(state.stats.net_power_mah_hr * 10) / 10,
        },
        alerts: state.alerts,
        recommended_mode: getRecommendedMode(state),
      }, null, 2), { headers });
    }
    
    // GET /simulate - Run day simulation
    if (path === '/simulate') {
      const scenario = url.searchParams.get('scenario') || 'mixed';
      const soc = parseInt(url.searchParams.get('soc') || '60');
      
      const log = simulateDay(scenario, soc);
      
      return new Response(JSON.stringify({
        scenario,
        initial_soc: soc,
        hours: log.length,
        final_soc: log[log.length - 1].soc_pct,
        log,
        summary: {
          total_harvest: log.reduce((a, h) => a + h.harvest_mah, 0).toFixed(0) + ' mAh',
          total_consumed: log.reduce((a, h) => a + h.load_mah, 0) + ' mAh',
          net: log.reduce((a, h) => a + h.net_mah, 0).toFixed(0) + ' mAh',
          survived: log[log.length - 1].soc_pct > 0,
        },
      }, null, 2), { headers });
    }
    
    // GET /config - Power system configuration
    if (path === '/config') {
      return new Response(JSON.stringify(POWER_CONFIG, null, 2), { headers });
    }
    
    // GET /calculate - Quick calculation
    if (path === '/calculate') {
      const irr = parseFloat(url.searchParams.get('irr') || '50');
      const load = parseInt(url.searchParams.get('load') || '100');
      const soc = parseInt(url.searchParams.get('soc') || '60');
      
      const harvest = calculateSolarHarvest(irr);
      const net = harvest.harvest_mah_hr - load;
      const battery_mah = (POWER_CONFIG.battery.capacity_mah * soc) / 100;
      
      let runtime, balance;
      if (net >= 0) {
        runtime = 'INFINITE';
        balance = net > 0 ? 'CHARGING' : 'SUSTAINING';
      } else {
        runtime = (battery_mah / Math.abs(net)).toFixed(1) + ' hours';
        balance = 'DRAINING';
      }
      
      return new Response(JSON.stringify({
        input: { irradiance: irr, load, soc },
        harvest: {
          mw: Math.round(harvest.harvest_mw * 10) / 10,
          mah_hr: Math.round(harvest.harvest_mah_hr * 10) / 10,
        },
        net_mah_hr: Math.round(net * 10) / 10,
        runtime,
        balance,
        message: balance === 'CHARGING' 
          ? `☀️ Solar exceeds load by ${net.toFixed(0)} mAh/hr - charging!`
          : balance === 'SUSTAINING'
            ? `⚡ Solar exactly matches load - infinite runtime!`
            : `🔋 Draining at ${Math.abs(net).toFixed(0)} mAh/hr - ${runtime} remaining`,
      }, null, 2), { headers });
    }
    
    return new Response(JSON.stringify({
      error: 'Not found',
      endpoints: ['/power', '/simulate', '/config', '/calculate'],
    }), { status: 404, headers });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// EXPORTS FOR GOD-KERNEL INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

export {
  POWER_CONFIG,
  AeonPowerState,
  calculateSolarHarvest,
  calculateRuntime,
  updatePowerState,
  getRecommendedMode,
  simulateDay,
};
