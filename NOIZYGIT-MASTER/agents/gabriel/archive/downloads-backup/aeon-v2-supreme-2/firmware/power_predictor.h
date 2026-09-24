/**
 * ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                                                        ║
 * ║     🧠 A E O N   P O W E R   P R E D I C T O R   -   M L   M O D U L E 🧠                                             ║
 * ║                                                                                                                        ║
 * ║     TinyML-based power prediction for optimal energy management                                                       ║
 * ║     Uses TensorFlow Lite Micro for on-device inference                                                                ║
 * ║                                                                                                                        ║
 * ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

#ifndef AEON_POWER_PREDICTOR_H
#define AEON_POWER_PREDICTOR_H

#include <Arduino.h>

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// FEATURE VECTOR
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

#define FEATURE_WINDOW_SIZE    24    // Hours of history
#define NUM_FEATURES           8     // Features per timestep

struct PowerFeatures {
  float hour_of_day;        // 0-23 normalized to 0-1
  float day_of_week;        // 0-6 normalized to 0-1
  float solar_power;        // mW normalized
  float piezo_power;        // mW normalized
  float thermal_power;      // mW normalized
  float load_power;         // mW normalized
  float soc;                // 0-100 normalized to 0-1
  float activity_level;     // 0-100 normalized to 0-1 (from accelerometer)
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PREDICTION OUTPUTS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

struct PowerPrediction {
  float harvest_next_hour_mw;     // Expected harvest
  float load_next_hour_mw;        // Expected load
  float soc_in_1_hour;            // Predicted SOC
  float soc_in_4_hours;           // Predicted SOC
  float time_to_empty_hr;         // If draining
  float time_to_full_hr;          // If charging
  float optimal_ai_level;         // 0-4 (EMERGENCY to FULL)
  float confidence;               // 0-1
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SIMPLE PREDICTOR (No TFLite - rule-based baseline)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

class PowerPredictor {
private:
  // Circular buffer for history
  PowerFeatures history[FEATURE_WINDOW_SIZE];
  int history_idx = 0;
  int history_count = 0;
  
  // Running averages
  float avg_solar_by_hour[24] = {0};
  float avg_load_by_hour[24] = {0};
  int sample_count_by_hour[24] = {0};
  
  // Battery model
  float battery_capacity_mah = 2000.0;
  float battery_voltage = 3.7;
  
public:
  void init() {
    memset(history, 0, sizeof(history));
    memset(avg_solar_by_hour, 0, sizeof(avg_solar_by_hour));
    memset(avg_load_by_hour, 0, sizeof(avg_load_by_hour));
    memset(sample_count_by_hour, 0, sizeof(sample_count_by_hour));
  }
  
  void update(PowerFeatures& features) {
    // Add to history
    history[history_idx] = features;
    history_idx = (history_idx + 1) % FEATURE_WINDOW_SIZE;
    if (history_count < FEATURE_WINDOW_SIZE) history_count++;
    
    // Update hourly averages
    int hour = (int)(features.hour_of_day * 24) % 24;
    float alpha = 0.1;  // EMA smoothing
    if (sample_count_by_hour[hour] == 0) {
      avg_solar_by_hour[hour] = features.solar_power;
      avg_load_by_hour[hour] = features.load_power;
    } else {
      avg_solar_by_hour[hour] = alpha * features.solar_power + (1 - alpha) * avg_solar_by_hour[hour];
      avg_load_by_hour[hour] = alpha * features.load_power + (1 - alpha) * avg_load_by_hour[hour];
    }
    sample_count_by_hour[hour]++;
  }
  
  PowerPrediction predict(int current_hour, float current_soc) {
    PowerPrediction pred;
    
    // Predict next hour based on historical averages
    int next_hour = (current_hour + 1) % 24;
    pred.harvest_next_hour_mw = avg_solar_by_hour[next_hour] + 30;  // +30 for piezo+thermal
    pred.load_next_hour_mw = avg_load_by_hour[next_hour];
    
    // Calculate net power
    float net_mw = pred.harvest_next_hour_mw - pred.load_next_hour_mw;
    float net_ma = net_mw / battery_voltage;
    
    // Predict SOC changes
    float soc_change_per_hour = (net_ma / battery_capacity_mah) * 100;
    pred.soc_in_1_hour = constrain(current_soc + soc_change_per_hour, 0, 100);
    pred.soc_in_4_hours = constrain(current_soc + soc_change_per_hour * 4, 0, 100);
    
    // Time estimates
    if (net_mw < 0) {
      float drain_ma = -net_ma;
      float remaining_mah = (current_soc / 100.0) * battery_capacity_mah;
      pred.time_to_empty_hr = remaining_mah / drain_ma;
      pred.time_to_full_hr = 999;
    } else if (net_mw > 0) {
      float charge_ma = net_ma;
      float needed_mah = ((100 - current_soc) / 100.0) * battery_capacity_mah;
      pred.time_to_full_hr = needed_mah / charge_ma;
      pred.time_to_empty_hr = 999;
    } else {
      pred.time_to_empty_hr = 999;
      pred.time_to_full_hr = 999;
    }
    
    // Recommend AI level based on predicted SOC and runtime
    if (pred.soc_in_1_hour >= 80 || pred.time_to_empty_hr > 8) {
      pred.optimal_ai_level = 4;  // FULL
    } else if (pred.soc_in_1_hour >= 50 || pred.time_to_empty_hr > 4) {
      pred.optimal_ai_level = 3;  // NORMAL
    } else if (pred.soc_in_1_hour >= 30 || pred.time_to_empty_hr > 2) {
      pred.optimal_ai_level = 2;  // REDUCED
    } else if (pred.soc_in_1_hour >= 15 || pred.time_to_empty_hr > 1) {
      pred.optimal_ai_level = 1;  // MINIMAL
    } else {
      pred.optimal_ai_level = 0;  // EMERGENCY
    }
    
    // Confidence based on data availability
    pred.confidence = min(1.0f, (float)history_count / FEATURE_WINDOW_SIZE);
    
    return pred;
  }
  
  // Get optimal charging windows (when solar is highest)
  void getOptimalChargingHours(int* hours, int max_count) {
    // Sort hours by average solar power
    float sorted[24];
    int indices[24];
    for (int i = 0; i < 24; i++) {
      sorted[i] = avg_solar_by_hour[i];
      indices[i] = i;
    }
    
    // Simple bubble sort
    for (int i = 0; i < 24 - 1; i++) {
      for (int j = 0; j < 24 - i - 1; j++) {
        if (sorted[j] < sorted[j + 1]) {
          float temp = sorted[j];
          sorted[j] = sorted[j + 1];
          sorted[j + 1] = temp;
          int ti = indices[j];
          indices[j] = indices[j + 1];
          indices[j + 1] = ti;
        }
      }
    }
    
    for (int i = 0; i < max_count && i < 24; i++) {
      hours[i] = indices[i];
    }
  }
  
  // Get high-load periods (when to avoid AI bursts)
  void getHighLoadHours(int* hours, int max_count) {
    float sorted[24];
    int indices[24];
    for (int i = 0; i < 24; i++) {
      sorted[i] = avg_load_by_hour[i];
      indices[i] = i;
    }
    
    for (int i = 0; i < 24 - 1; i++) {
      for (int j = 0; j < 24 - i - 1; j++) {
        if (sorted[j] < sorted[j + 1]) {
          float temp = sorted[j];
          sorted[j] = sorted[j + 1];
          sorted[j + 1] = temp;
          int ti = indices[j];
          indices[j] = indices[j + 1];
          indices[j + 1] = ti;
        }
      }
    }
    
    for (int i = 0; i < max_count && i < 24; i++) {
      hours[i] = indices[i];
    }
  }
};

#endif // AEON_POWER_PREDICTOR_H
