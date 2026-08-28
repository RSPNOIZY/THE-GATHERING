/**
 * NOIZY WORLD MODEL & LOCATION INTELLIGENCE
 * 
 * Part of Lucy v4.0 Personal Operating System
 * Powers NOIZY MAP, Zone Scoring, and Spatial-Temporal Predictive Staging
 * 
 * Target Pilot: Ottawa / YOW Region (Centretown, ByWard Market, YOW Airport, Lansdowne, Kanata)
 */

import { z } from 'zod';

// ─── 1. ZONE & VENUE NODE SCHEMAS ─────────────────────────

export const OttawaZoneTagSchema = z.enum([
  'DOWNTOWN_CENTRETOWN',
  'BYWARD_MARKET',
  'YOW_AIRPORT',
  'GLEBE_LANSDOWNE',
  'WESTBORO_WELLINGTON',
  'KANATA_NORTH_TECH',
  'ORLEANS_EAST',
  'BARRHAVEN_SOUTH',
  'GATINEAU_SECTOR',
]);

export type OttawaZoneTag = z.infer<typeof OttawaZoneTagSchema>;

export const ZoneNodeSchema = z.object({
  zone_id: z.string(),
  name: z.string(),
  tag: OttawaZoneTagSchema,
  geohashes: z.array(z.string()),
  center_coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  bounding_box: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }),
  historical_stats: z.object({
    avg_hourly_revenue_cad: z.number(),
    avg_surge_multiplier: z.number(),
    top_languages: z.array(z.object({
      language: z.string(),
      percentage: z.number(),
    })),
    peak_hours_utc: z.array(z.number()),
  }),
});

export type ZoneNode = z.infer<typeof ZoneNodeSchema>;

export const VenueNodeSchema = z.object({
  venue_id: z.string(),
  name: z.string(),
  zone_tag: OttawaZoneTagSchema,
  venue_type: z.enum(['AIRPORT', 'CONCERT_HALL', 'SPORTS_ARENA', 'HOTEL', 'NIGHTLIFE', 'GOVERNMENT', 'CONVENTION']),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  typical_surge_lead_time_min: z.number().describe('Minutes before event end that surge begins'),
  primary_language_mix: z.array(z.string()),
  creative_vibe_tag: z.string().optional(),
});

export type VenueNode = z.infer<typeof VenueNodeSchema>;

// ─── 2. ZONE SCORING ENGINE MATHEMATICAL MODEL ────────────
/**
 * ZONE SCORE FORMULA (0 - 100):
 * 
 * Score(z, t) = w_r * RevenueVelocity(z, t)
 *             + w_s * SurgeMultiplier(z, t)
 *             + w_e * EventImpactScore(z, t)
 *             + w_l * LanguageDensityBonus(z, t)
 *             - w_f * FrictionPenalty(z, t)
 * 
 * Where:
 *  - RevenueVelocity (0-100): Normalized CAD/hour earned historically at day-of-week & hour.
 *  - SurgeMultiplier (0-100): Current or forecasted platform surge (e.g. 1.0 = 0, 2.5 = 100).
 *  - EventImpactScore (0-100): Weighted sum of nearby flights landing or concerts letting out within +/- 45 mins.
 *  - LanguageDensityBonus (0-100): Multi-language translation demand coefficient (Gabriel translation tier).
 *  - FrictionPenalty (0-100): Weather severity (snow/rain traffic delay) + platform saturation.
 * 
 * Weights (Sum to 1.0):
 *  w_r = 0.35 (Revenue baseline)
 *  w_s = 0.25 (Surge capture)
 *  w_e = 0.20 (Predictive event wave)
 *  w_l = 0.15 (Linguistic/translation premium)
 *  w_f = 0.05 (Friction factor)
 */

export interface ZoneScoringInput {
  zone_tag: OttawaZoneTag;
  day_of_week: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  hour_of_day: number; // 0 - 23
  current_surge: number; // e.g. 1.8
  flight_arrivals_next_hour: number; // For YOW
  event_attendance_letting_out: number; // For Lansdowne / NAC / CTC
  weather_condition: 'CLEAR' | 'RAIN' | 'SNOW' | 'BLIZZARD' | 'ICE';
  active_translation_mode: boolean;
}

export interface ZoneScoringResult {
  zone_tag: OttawaZoneTag;
  zone_score: number; // 0 - 100
  confidence_interval: {
    lower_bound: number;
    upper_bound: number;
    confidence_level: number; // 0.90 standard
  };
  language_profile: {
    primary: string;
    secondary: string[];
    translation_value_multiplier: number;
  };
  staging_recommendation: 'STAGE_IMMEDIATELY' | 'TRANSIT_TOWARDS' | 'MONITOR_SURGE' | 'AVOID_CONGESTION';
  recommended_wait_point: string;
  projected_hourly_cad: number;
  reasoning: string;
}

export function computeZoneScore(input: ZoneScoringInput): ZoneScoringResult {
  const {
    zone_tag,
    day_of_week,
    hour_of_day,
    current_surge,
    flight_arrivals_next_hour,
    event_attendance_letting_out,
    weather_condition,
    active_translation_mode,
  } = input;

  // 1. Revenue Velocity Calculation
  let base_hourly = 32.0; // Ottawa baseline CAD/hr
  const is_weekend = day_of_week === 'Fri' || day_of_week === 'Sat';
  
  if (zone_tag === 'BYWARD_MARKET' && is_weekend && (hour_of_day >= 22 || hour_of_day <= 3)) {
    base_hourly = 68.0;
  } else if (zone_tag === 'YOW_AIRPORT' && (hour_of_day >= 15 && hour_of_day <= 23)) {
    base_hourly = 58.0;
  } else if (zone_tag === 'DOWNTOWN_CENTRETOWN' && (hour_of_day >= 7 && hour_of_day <= 10)) {
    base_hourly = 48.0;
  } else if (zone_tag === 'GLEBE_LANSDOWNE' && event_attendance_letting_out > 2000) {
    base_hourly = 72.0;
  }

  const revenue_velocity_norm = Math.min(100, Math.max(0, (base_hourly / 80.0) * 100));

  // 2. Surge Multiplier Normalization (1.0 -> 0, 2.0+ -> 100)
  const surge_norm = Math.min(100, Math.max(0, ((current_surge - 1.0) / 1.0) * 100));

  // 3. Event Impact Score
  let event_impact = 0;
  if (zone_tag === 'YOW_AIRPORT') {
    event_impact = Math.min(100, flight_arrivals_next_hour * 18);
  } else {
    event_impact = Math.min(100, (event_attendance_letting_out / 4000) * 100);
  }

  // 4. Language Density & Translation Premium
  let lang_score = 40;
  let primary_lang = 'en';
  let secondary_langs = ['fr'];
  let trans_multiplier = 1.0;

  if (zone_tag === 'DOWNTOWN_CENTRETOWN' || zone_tag === 'BYWARD_MARKET') {
    lang_score = 90; // High French/International diplomatic & government mix
    primary_lang = 'en';
    secondary_langs = ['fr', 'es', 'ar'];
    trans_multiplier = 1.25;
  } else if (zone_tag === 'YOW_AIRPORT') {
    lang_score = 95; // High multi-national arrival volume
    primary_lang = 'en';
    secondary_langs = ['fr', 'zh', 'de', 'es'];
    trans_multiplier = 1.30;
  }

  // 5. Friction Penalty
  let friction = 10;
  if (weather_condition === 'SNOW' || weather_condition === 'RAIN') {
    friction = 25;
  } else if (weather_condition === 'BLIZZARD' || weather_condition === 'ICE') {
    friction = 60;
  }

  // 6. Weighted Sum
  const raw_score = (
    0.35 * revenue_velocity_norm +
    0.25 * surge_norm +
    0.20 * event_impact +
    0.15 * lang_score -
    0.05 * friction
  );

  const final_score = Math.round(Math.min(100, Math.max(0, raw_score)));

  // 7. Staging Recommendation Heuristic
  let recommendation: ZoneScoringResult['staging_recommendation'] = 'MONITOR_SURGE';
  let wait_point = 'Elgin & Laurier staging pocket';

  if (zone_tag === 'YOW_AIRPORT') {
    wait_point = 'YOW Cell Phone Lot / Airport Pkwy North staging';
  } else if (zone_tag === 'BYWARD_MARKET') {
    wait_point = 'York St & Dalhousie staging lane';
  } else if (zone_tag === 'GLEBE_LANSDOWNE') {
    wait_point = 'Queen Elizabeth Driveway & Bank St';
  }

  if (final_score >= 80) {
    recommendation = 'STAGE_IMMEDIATELY';
  } else if (final_score >= 60) {
    recommendation = 'TRANSIT_TOWARDS';
  } else if (friction >= 50) {
    recommendation = 'AVOID_CONGESTION';
  }

  const projected_cad = Math.round(base_hourly * (current_surge > 1 ? (current_surge * 0.8) : 1.0));

  return {
    zone_tag,
    zone_score: final_score,
    confidence_interval: {
      lower_bound: Math.max(0, final_score - 7),
      upper_bound: Math.min(100, final_score + 6),
      confidence_level: 0.90,
    },
    language_profile: {
      primary: primary_lang,
      secondary: secondary_langs,
      translation_value_multiplier: trans_multiplier,
    },
    staging_recommendation: recommendation,
    recommended_wait_point: wait_point,
    projected_hourly_cad: projected_cad,
    reasoning: `Zone ${zone_tag} scored ${final_score}/100. Key driver: base revenue CAD $${base_hourly}/hr with ${current_surge}x surge factor and ${event_impact}% event influx density.`,
  };
}
