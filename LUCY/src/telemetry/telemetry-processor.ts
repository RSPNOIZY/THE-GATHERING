/**
 * LUCY Realtime Telemetry Processor & Multimodal Anomaly Detector
 */

import type { RawTelemetryFrame } from './vehicular-telemetry.ts';

export interface ProcessedTelemetryEvent {
  frame: RawTelemetryFrame;
  zone_code: string;
  zone_multiplier: number;
  anomalies: string[];
  is_creative_spark: boolean;
  driver_vigilance_score: number;
}

export class TelemetryProcessor {
  private frameBuffer: RawTelemetryFrame[] = [];
  private readonly maxBufferSize: number;

  constructor(bufferSize = 50) {
    this.maxBufferSize = bufferSize;
  }

  public processFrame(frame: RawTelemetryFrame): ProcessedTelemetryEvent {
    this.frameBuffer.push(frame);
    if (this.frameBuffer.length > this.maxBufferSize) {
      this.frameBuffer.shift();
    }

    const anomalies: string[] = [];

    // 1. High Longitudinal Deceleration (Sudden Braking > 0.45g)
    if (frame.accel_x_g !== undefined && frame.accel_x_g < -0.45) {
      anomalies.push(`SUDDEN_BRAKING_EVENT: ${frame.accel_x_g.toFixed(2)}g`);
    }

    // 2. High Lateral G-Force (Aggressive Cornering > 0.40g)
    if (frame.accel_y_g !== undefined && Math.abs(frame.accel_y_g) > 0.40) {
      anomalies.push(`HIGH_G_LATERAL_CORNERING: ${frame.accel_y_g.toFixed(2)}g`);
    }

    // 3. Engine Overheating Alert
    if (frame.coolant_temp_c !== undefined && frame.coolant_temp_c > 105) {
      anomalies.push(`ENGINE_OVERHEAT_WARNING: ${frame.coolant_temp_c}°C`);
    }

    // 4. Ottawa / YOW Zone Evaluation
    const { zone_code, zone_multiplier } = this.evaluateZone(frame.latitude, frame.longitude);

    // 5. Creative Spark Trigger (e.g. ambient acoustic capture or tagspace flag)
    const is_creative_spark = !!frame.audio_fingerprint || !!frame.dashcam_frame_hash;

    // 6. Driver Vigilance Estimation (Smoothed calculation)
    const driver_vigilance_score = anomalies.length === 0 ? 0.98 : 0.85;

    return {
      frame,
      zone_code,
      zone_multiplier,
      anomalies,
      is_creative_spark,
      driver_vigilance_score,
    };
  }

  private evaluateZone(lat: number, lon: number): { zone_code: string; zone_multiplier: number } {
    // YOW Ottawa Airport Zone
    if (lat >= 45.31 && lat <= 45.34 && lon >= -75.69 && lon <= -75.65) {
      return { zone_code: 'YOW_OTTAWA_AIRPORT', zone_multiplier: 1.65 };
    }
    // ByWard Market / Rideau Corridor
    if (lat >= 45.42 && lat <= 45.44 && lon >= -75.70 && lon <= -75.68) {
      return { zone_code: 'BYWARD_MARKET_DOWNTOWN', zone_multiplier: 1.40 };
    }
    // Kanata Tech Park
    if (lat >= 45.33 && lat <= 45.36 && lon >= -75.92 && lon <= -75.88) {
      return { zone_code: 'KANATA_TECH_NORTH', zone_multiplier: 1.25 };
    }
    // Standard City Baseline
    return { zone_code: 'OTTAWA_METRO_BASELINE', zone_multiplier: 1.0 };
  }
}
