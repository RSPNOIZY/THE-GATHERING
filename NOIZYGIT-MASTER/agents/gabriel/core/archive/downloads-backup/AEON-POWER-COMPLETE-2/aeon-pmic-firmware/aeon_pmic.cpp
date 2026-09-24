/**
 * ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                                            ║
 * ║     ⚡ A E O N   P O W E R   M A N A G E M E N T   I C   F I R M W A R E ⚡                                ║
 * ║                                                                                                            ║
 * ║     Target: ATtiny85 / ESP32-C3 / RP2040                                                                  ║
 * ║     Features:                                                                                              ║
 * ║       • Multi-source harvesting (Solar + Piezo + Thermal)                                                 ║
 * ║       • MPPT for solar optimization                                                                       ║
 * ║       • Smart load shedding                                                                               ║
 * ║       • BLE status reporting                                                                              ║
 * ║       • Deep sleep < 1µA                                                                                  ║
 * ║                                                                                                            ║
 * ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

#include <Arduino.h>

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PIN DEFINITIONS (adjust for your MCU)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

#define PIN_SOLAR_V       A0    // Solar panel voltage divider
#define PIN_BATT_V        A1    // Battery voltage divider
#define PIN_LOAD_I        A2    // Load current sense (INA219 or shunt)
#define PIN_PIEZO_V       A3    // Piezo harvester voltage
#define PIN_THERM_V       A4    // Thermoelectric harvester voltage

#define PIN_CHARGER_EN    2     // Enable solar charger IC (BQ25570, LTC3105, etc)
#define PIN_BOOST_EN      3     // Enable boost converter (5V out for USB-C)
#define PIN_LOAD_EN       4     // Main load switch (high-side MOSFET)
#define PIN_PIEZO_EN      5     // Piezo rectifier enable
#define PIN_LED_STATUS    6     // Status LED (or NeoPixel data)
#define PIN_JACK_SENSE    7     // Headphone jack detection
#define PIN_BUTTON        8     // Wake/mode button

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

// Battery thresholds (LiPo 3.7V nominal)
const float BATT_CRITICAL = 3.30;   // Emergency shutdown
const float BATT_LOW      = 3.55;   // Enter power saving
const float BATT_OK       = 3.70;   // Normal operation
const float BATT_HIGH     = 4.10;   // Near full
const float BATT_FULL     = 4.20;   // Charging complete

// Solar thresholds
const float SOLAR_MIN_V   = 4.5;    // Minimum for charging (panel Voc ~6V)
const float SOLAR_MPPT_V  = 5.2;    // Target MPPT voltage (80% of Voc)

// Harvester thresholds
const float PIEZO_MIN_V   = 2.0;    // Minimum piezo voltage to harvest
const float THERM_MIN_V   = 0.5;    // Minimum TEG voltage

// Load profiles (mA)
const float LOAD_STANDBY  = 0.1;    // MCU sleep + BLE beacon
const float LOAD_IDLE     = 5.0;    // MCU awake, no audio
const float LOAD_AUDIO    = 50.0;   // Bone conduction active
const float LOAD_AI       = 150.0;  // AI processing burst

// Timing
const unsigned long LOOP_MS       = 200;
const unsigned long MPPT_MS       = 1000;   // MPPT update interval
const unsigned long STATUS_MS     = 5000;   // BLE status broadcast
const unsigned long SLEEP_WAKE_MS = 60000;  // Wake from sleep to check sun

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

enum Mode { 
  HARVEST,    // Actively charging from sun/piezo/thermal
  BUFFER,     // No harvest available, conserving
  BOOST,      // Powering load from battery
  CRITICAL,   // Low battery, shedding non-essential loads
  SLEEP       // Deep sleep, waiting for sun or button
};

const char* MODE_NAMES[] = {"HARVEST", "BUFFER", "BOOST", "CRITICAL", "SLEEP"};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

struct PowerState {
  Mode mode = BUFFER;
  Mode prev_mode = BUFFER;
  
  // Voltages (filtered)
  float batt_v = 3.85;
  float solar_v = 0.0;
  float piezo_v = 0.0;
  float therm_v = 0.0;
  
  // Current sensing
  float load_ma = 0.0;
  float charge_ma = 0.0;
  
  // Derived
  float batt_soc_pct = 50.0;
  float harvest_mw = 0.0;
  float load_mw = 0.0;
  float net_mw = 0.0;
  
  // Flags
  bool sun_present = false;
  bool piezo_active = false;
  bool therm_active = false;
  bool load_connected = false;
  bool charging = false;
  bool boost_active = false;
  
  // MPPT
  float mppt_duty = 0.5;
  float mppt_power_prev = 0.0;
  int mppt_direction = 1;
  
  // Stats
  unsigned long harvest_mah_today = 0;
  unsigned long runtime_sec = 0;
  unsigned long last_sun_ms = 0;
  
  // Timestamps
  unsigned long last_mppt_ms = 0;
  unsigned long last_status_ms = 0;
  
} state;

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SENSOR READING (with filtering)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

// Exponential moving average filter
float ema(float current, float newVal, float alpha = 0.2) {
  return alpha * newVal + (1.0 - alpha) * current;
}

// Read voltage from divider (adjust R1/R2 for your circuit)
float readVoltage(int pin, float r1 = 100.0, float r2 = 100.0) {
  int raw = analogRead(pin);
  float v_adc = (raw / 1023.0) * 3.3;  // Assuming 3.3V ADC reference
  return v_adc * (r1 + r2) / r2;       // Voltage divider formula
}

void readSensors() {
  // Read and filter all voltages
  state.batt_v  = ema(state.batt_v,  readVoltage(PIN_BATT_V, 100, 100));
  state.solar_v = ema(state.solar_v, readVoltage(PIN_SOLAR_V, 100, 47));  // Higher divider for 6V panel
  state.piezo_v = ema(state.piezo_v, readVoltage(PIN_PIEZO_V, 100, 100));
  state.therm_v = ema(state.therm_v, readVoltage(PIN_THERM_V, 100, 100));
  
  // Detect harvest sources
  state.sun_present = (state.solar_v > SOLAR_MIN_V);
  state.piezo_active = (state.piezo_v > PIEZO_MIN_V);
  state.therm_active = (state.therm_v > THERM_MIN_V);
  
  // Detect load
  state.load_connected = (digitalRead(PIN_JACK_SENSE) == LOW);  // Assuming active-low
  
  // Calculate SOC (simple linear approximation)
  state.batt_soc_pct = constrain(
    map(state.batt_v * 100, BATT_CRITICAL * 100, BATT_FULL * 100, 0, 100),
    0, 100
  );
  
  // Track sun exposure
  if (state.sun_present) {
    state.last_sun_ms = millis();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// HARDWARE CONTROL
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

void enableCharger(bool en) {
  digitalWrite(PIN_CHARGER_EN, en ? HIGH : LOW);
  state.charging = en;
}

void enableBoost(bool en) {
  digitalWrite(PIN_BOOST_EN, en ? HIGH : LOW);
  state.boost_active = en;
}

void enableLoad(bool en) {
  digitalWrite(PIN_LOAD_EN, en ? HIGH : LOW);
}

void enablePiezo(bool en) {
  digitalWrite(PIN_PIEZO_EN, en ? HIGH : LOW);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// MPPT (Maximum Power Point Tracking)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

void updateMPPT() {
  if (!state.sun_present) return;
  if (millis() - state.last_mppt_ms < MPPT_MS) return;
  state.last_mppt_ms = millis();
  
  // Perturb and Observe algorithm
  // Estimate power from panel (simplified)
  float panel_power = state.solar_v * state.charge_ma;
  
  // Compare to previous
  if (panel_power > state.mppt_power_prev) {
    // Power increased, keep going same direction
  } else {
    // Power decreased, reverse direction
    state.mppt_direction *= -1;
  }
  
  // Perturb duty cycle
  state.mppt_duty += state.mppt_direction * 0.02;
  state.mppt_duty = constrain(state.mppt_duty, 0.3, 0.9);
  
  // Apply to charger IC (if using PWM-controlled MPPT)
  // analogWrite(PIN_MPPT_PWM, state.mppt_duty * 255);
  
  state.mppt_power_prev = panel_power;
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// DEEP SLEEP
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

void deepSleep() {
  // Disable all outputs
  enableCharger(false);
  enableBoost(false);
  enableLoad(false);
  enablePiezo(false);
  
  // Set LED to indicate sleep
  digitalWrite(PIN_LED_STATUS, LOW);
  
  // Configure wake sources
  // - External interrupt on button (rising edge)
  // - External interrupt on solar voltage (comparator threshold)
  // - Timer wake every SLEEP_WAKE_MS to check conditions
  
  #if defined(ESP32)
    esp_sleep_enable_ext0_wakeup((gpio_num_t)PIN_BUTTON, HIGH);
    esp_sleep_enable_timer_wakeup(SLEEP_WAKE_MS * 1000);  // µs
    esp_deep_sleep_start();
  #elif defined(__AVR_ATtiny85__)
    // ATtiny85 sleep code
    set_sleep_mode(SLEEP_MODE_PWR_DOWN);
    sleep_enable();
    sleep_cpu();
    sleep_disable();
  #else
    // Generic delay fallback
    delay(SLEEP_WAKE_MS);
  #endif
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// STATUS LED
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

void updateStatusLED() {
  static unsigned long last_blink = 0;
  static bool led_state = false;
  
  unsigned long blink_interval;
  
  switch (state.mode) {
    case HARVEST:
      // Solid green while harvesting
      digitalWrite(PIN_LED_STATUS, HIGH);
      return;
      
    case BUFFER:
      // Slow blink (2s)
      blink_interval = 2000;
      break;
      
    case BOOST:
      // Medium blink (500ms) while powering load
      blink_interval = 500;
      break;
      
    case CRITICAL:
      // Fast blink (200ms) warning
      blink_interval = 200;
      break;
      
    case SLEEP:
      // Off
      digitalWrite(PIN_LED_STATUS, LOW);
      return;
  }
  
  if (millis() - last_blink > blink_interval) {
    led_state = !led_state;
    digitalWrite(PIN_LED_STATUS, led_state);
    last_blink = millis();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// BLE STATUS (optional, for ESP32)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

void broadcastStatus() {
  if (millis() - state.last_status_ms < STATUS_MS) return;
  state.last_status_ms = millis();
  
  // Build status packet
  // Format: MODE|SOC|BATT_V|SOLAR|PIEZO|LOAD
  char status[64];
  snprintf(status, sizeof(status), 
    "%s|%d|%.2f|%d|%d|%d",
    MODE_NAMES[state.mode],
    (int)state.batt_soc_pct,
    state.batt_v,
    state.sun_present ? 1 : 0,
    state.piezo_active ? 1 : 0,
    state.load_connected ? 1 : 0
  );
  
  // Send via BLE characteristic update
  // BLE.updateCharacteristic(POWER_STATUS_UUID, status);
  
  // Debug output
  Serial.println(status);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

void updateStateMachine() {
  state.prev_mode = state.mode;
  
  switch (state.mode) {
    
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    case HARVEST:
      // Solar/piezo/thermal -> charge battery
      enableCharger(state.sun_present);
      enablePiezo(state.piezo_active);
      enableBoost(false);  // Don't power load while maximizing harvest
      enableLoad(false);
      
      updateMPPT();
      
      // Transitions
      if (state.batt_v >= BATT_FULL) {
        // Battery full - can power loads
        state.mode = BUFFER;
      }
      if (!state.sun_present && !state.piezo_active && !state.therm_active) {
        // No harvest sources
        state.mode = BUFFER;
      }
      if (state.load_connected && state.batt_v > BATT_LOW) {
        // Load connected and battery OK - power it (with passthrough charging)
        state.mode = BOOST;
      }
      break;
      
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    case BUFFER:
      // No active harvest, conserve power, wait
      enableCharger(false);
      enablePiezo(false);
      enableBoost(false);
      enableLoad(false);
      
      // Transitions
      if (state.sun_present || state.piezo_active || state.therm_active) {
        state.mode = HARVEST;
      }
      if (state.load_connected && state.batt_v > BATT_LOW) {
        state.mode = BOOST;
      }
      if (state.batt_v <= BATT_LOW) {
        state.mode = CRITICAL;
      }
      // Go to sleep if no activity for extended period
      if (!state.load_connected && 
          !state.sun_present && 
          (millis() - state.last_sun_ms > 300000)) {  // 5 minutes no sun
        state.mode = SLEEP;
      }
      break;
      
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    case BOOST:
      // Battery -> load (headphones, AI, etc)
      enableCharger(state.sun_present);  // Passthrough charging if sun available
      enablePiezo(state.piezo_active);   // Keep harvesting piezo
      enableBoost(true);
      enableLoad(true);
      
      if (state.sun_present) updateMPPT();
      
      // Transitions
      if (!state.load_connected) {
        // Load disconnected
        state.mode = state.sun_present ? HARVEST : BUFFER;
      }
      if (state.batt_v <= BATT_LOW) {
        state.mode = CRITICAL;
      }
      break;
      
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    case CRITICAL:
      // Battery low - shed non-essential loads
      enableCharger(state.sun_present);  // Still try to charge
      enablePiezo(state.piezo_active);
      enableBoost(false);                // Disable high-power output
      enableLoad(false);                 // Disable main load
      
      // Transitions
      if (state.batt_v >= BATT_OK) {
        state.mode = state.sun_present ? HARVEST : BUFFER;
      }
      if (state.batt_v <= BATT_CRITICAL) {
        state.mode = SLEEP;  // Emergency shutdown
      }
      break;
      
    // ─────────────────────────────────────────────────────────────────────────────────────────────────────────
    case SLEEP:
      // Deep sleep, waiting for wake event
      deepSleep();  // This blocks until wake
      
      // After wake, check conditions
      readSensors();
      if (state.sun_present) {
        state.mode = HARVEST;
      } else if (state.batt_v > BATT_LOW) {
        state.mode = BUFFER;
      }
      // Else stay in SLEEP
      break;
  }
  
  // Log state transitions
  if (state.mode != state.prev_mode) {
    Serial.print("MODE: ");
    Serial.print(MODE_NAMES[state.prev_mode]);
    Serial.print(" -> ");
    Serial.println(MODE_NAMES[state.mode]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  Serial.println("⚡ AEON PMIC v1.0 ⚡");
  
  // Configure pins
  pinMode(PIN_CHARGER_EN, OUTPUT);
  pinMode(PIN_BOOST_EN, OUTPUT);
  pinMode(PIN_LOAD_EN, OUTPUT);
  pinMode(PIN_PIEZO_EN, OUTPUT);
  pinMode(PIN_LED_STATUS, OUTPUT);
  pinMode(PIN_JACK_SENSE, INPUT_PULLUP);
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  
  // Initialize outputs off
  enableCharger(false);
  enableBoost(false);
  enableLoad(false);
  enablePiezo(false);
  
  // Initial sensor read
  for (int i = 0; i < 10; i++) {
    readSensors();
    delay(10);
  }
  
  // Determine initial state
  if (state.sun_present) {
    state.mode = HARVEST;
  } else if (state.batt_v > BATT_OK) {
    state.mode = BUFFER;
  } else if (state.batt_v > BATT_CRITICAL) {
    state.mode = CRITICAL;
  } else {
    state.mode = SLEEP;
  }
  
  Serial.print("Initial mode: ");
  Serial.println(MODE_NAMES[state.mode]);
  Serial.print("Battery: ");
  Serial.print(state.batt_v);
  Serial.print("V (");
  Serial.print(state.batt_soc_pct);
  Serial.println("%)");
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

void loop() {
  readSensors();
  updateStateMachine();
  updateStatusLED();
  broadcastStatus();
  
  delay(LOOP_MS);
}
