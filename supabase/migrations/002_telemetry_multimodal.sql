-- ============================================================================
-- 002_telemetry_multimodal.sql — LUCY Vehicular Telemetry & Multimodal Streams
-- Version: 1.0.0
-- Invariants: High-throughput ingestion, spatial indexing, CAN/OBD-II decoding,
--             multimodal frame anchors, and Ottawa/YOW zone scoring
-- ============================================================================

-- 1. Vehicle Fleet Registry
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    vin TEXT NOT NULL UNIQUE,
    make TEXT NOT NULL DEFAULT 'Honda',
    model TEXT NOT NULL DEFAULT 'CR-V Touring Hybrid',
    year INT NOT NULL DEFAULT 2024,
    trim TEXT NOT NULL DEFAULT 'Plowman Standard Edition',
    can_bus_protocol TEXT NOT NULL DEFAULT 'ISO 15765-4 CAN',
    hardware_gateway_id UUID REFERENCES public.device_registry(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Telemetry Shift & Trip Sessions
CREATE TABLE IF NOT EXISTS public.telemetry_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    driver_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    session_type TEXT NOT NULL DEFAULT 'rideshare_shift',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    start_odometer_km DOUBLE PRECISION,
    end_odometer_km DOUBLE PRECISION,
    total_distance_km DOUBLE PRECISION DEFAULT 0.0,
    gross_revenue_cad DOUBLE PRECISION DEFAULT 0.0,
    total_records_ingested BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'archived'
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Telemetry Records (High-Frequency Multimodal Time-Series)
CREATE TABLE IF NOT EXISTS public.telemetry_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.telemetry_sessions(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Geospatial coordinates
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude_m DOUBLE PRECISION,
    heading_deg DOUBLE PRECISION,
    gps_speed_kmh DOUBLE PRECISION,
    gps_accuracy_m DOUBLE PRECISION,

    -- OBD-II / CAN-Bus PIDs
    obd_speed_kmh DOUBLE PRECISION,
    engine_rpm INT,
    coolant_temp_c INT,
    throttle_pos_pct DOUBLE PRECISION,
    fuel_level_pct DOUBLE PRECISION,
    ev_battery_soc_pct DOUBLE PRECISION,
    power_draw_kw DOUBLE PRECISION,
    gear_position TEXT,

    -- 6-Axis IMU (Inertial Measurement Unit)
    accel_x_g DOUBLE PRECISION,
    accel_y_g DOUBLE PRECISION,
    accel_z_g DOUBLE PRECISION,
    gyro_pitch_dps DOUBLE PRECISION,
    gyro_roll_dps DOUBLE PRECISION,
    gyro_yaw_dps DOUBLE PRECISION,

    -- Multimodal & Environmental Signals
    ambient_noise_db DOUBLE PRECISION,
    cabin_temp_c DOUBLE PRECISION,
    driver_vigilance_score DOUBLE PRECISION, -- 0.0 - 1.0
    active_zone_tag TEXT, -- 'YOW_AIRPORT', 'BYWARD_MARKET', 'KANATA_TECH', etc.
    zone_multiplier DOUBLE PRECISION DEFAULT 1.0,

    -- Multimodal Frame Reference Hashes
    dashcam_frame_hash TEXT,
    audio_acoustic_fingerprint TEXT,
    raw_payload JSONB DEFAULT '{}'::jsonb
);

-- 4. Multimodal High-Value Events (Sparks, Anomalies & Incidents)
CREATE TABLE IF NOT EXISTS public.multimodal_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.telemetry_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'CREATIVE_SPARK', 'SUDDEN_BRAKING', 'HIGH_G_SHOCK', 'ZONE_TRANSITION', 'ANOMALY'
    severity TEXT NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARN', 'CRITICAL'
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    title TEXT NOT NULL,
    description TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    c2pa_manifest_id UUID,
    is_vaulted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Ottawa / YOW Zone Matrix Definitions
CREATE TABLE IF NOT EXISTS public.zone_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Ottawa',
    category TEXT NOT NULL DEFAULT 'high_density',
    base_earning_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    boundary_polygon JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for Ultra-Fast Time-Series & Geospatial Queries
CREATE INDEX IF NOT EXISTS idx_telemetry_records_session ON public.telemetry_records(session_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_records_vehicle_time ON public.telemetry_records(vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_records_coords ON public.telemetry_records(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_telemetry_records_zone ON public.telemetry_records(active_zone_tag);
CREATE INDEX IF NOT EXISTS idx_multimodal_events_type ON public.multimodal_events(event_type, triggered_at DESC);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multimodal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicles viewable by authenticated users" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Telemetry sessions viewable by authenticated users" ON public.telemetry_sessions FOR SELECT USING (true);
CREATE POLICY "Telemetry records readable by authenticated users" ON public.telemetry_records FOR SELECT USING (true);
CREATE POLICY "Multimodal events viewable by authenticated users" ON public.multimodal_events FOR SELECT USING (true);
CREATE POLICY "Zone definitions public select" ON public.zone_definitions FOR SELECT USING (true);
