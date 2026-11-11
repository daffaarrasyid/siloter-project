-- ==============================================================================
-- SILOTER - Sistem Informasi dan Deteksi Loitering Angkutan Umum Terpadu
-- Supabase PostgreSQL Schema DDL & Seed Data
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Helper function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. Table: camera_configs
-- Stores CCTV stream information, frame resolutions, normalized ROI polygons,
-- and stationary duration threshold in seconds.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.camera_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_code TEXT UNIQUE NOT NULL CHECK (camera_code IN ('empang', 'surken', 'balaikota')),
    camera_name TEXT NOT NULL,
    stream_url TEXT,
    resolution_width INTEGER NOT NULL DEFAULT 1920,
    resolution_height INTEGER NOT NULL DEFAULT 1080,
    roi_polygon JSONB NOT NULL DEFAULT '[]'::jsonb,
    threshold_seconds INTEGER NOT NULL DEFAULT 60 CHECK (threshold_seconds >= 10 AND threshold_seconds <= 600),
    is_configured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for camera_configs updated_at
DROP TRIGGER IF EXISTS trg_camera_configs_updated_at ON public.camera_configs;
CREATE TRIGGER trg_camera_configs_updated_at
BEFORE UPDATE ON public.camera_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. Table: users_profile (extends auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('operator', 'admin')),
    preferred_camera TEXT DEFAULT 'empang',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for users_profile updated_at
DROP TRIGGER IF EXISTS trg_users_profile_updated_at ON public.users_profile;
CREATE TRIGGER trg_users_profile_updated_at
BEFORE UPDATE ON public.users_profile
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 5. Table: violation_events
-- Records loitering incidents, auto-capture evidence storage paths,
-- inference benchmarks, and human-in-the-loop validation decisions.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.violation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES public.camera_configs(id) ON DELETE CASCADE,
    vehicle_track_id TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
    model_used TEXT NOT NULL,
    inference_ms DOUBLE PRECISION,
    evidence_path TEXT,
    validation_status TEXT NOT NULL DEFAULT 'Pending' CHECK (validation_status IN ('Pending', 'Valid', 'Invalid')),
    validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for violation_events updated_at
DROP TRIGGER IF EXISTS trg_violation_events_updated_at ON public.violation_events;
CREATE TRIGGER trg_violation_events_updated_at
BEFORE UPDATE ON public.violation_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 6. Indexes for Performance Optimization
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_violation_events_camera_id ON public.violation_events(camera_id);
CREATE INDEX IF NOT EXISTS idx_violation_events_detected_at ON public.violation_events(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_violation_events_status ON public.violation_events(validation_status);
CREATE INDEX IF NOT EXISTS idx_violation_events_track_id ON public.violation_events(vehicle_track_id);
CREATE INDEX IF NOT EXISTS idx_camera_configs_code ON public.camera_configs(camera_code);

-- ==============================================================================
-- 7. Supabase Storage Bucket Initialization
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policy: Allow public read access to evidence screenshots
DROP POLICY IF EXISTS "Public Access for Evidence Images" ON storage.objects;
CREATE POLICY "Public Access for Evidence Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidence');

-- Storage Policy: Allow authenticated/service-role upload to evidence bucket
DROP POLICY IF EXISTS "Allow Upload to Evidence Bucket" ON storage.objects;
CREATE POLICY "Allow Upload to Evidence Bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'evidence');

-- ==============================================================================
-- 8. Row Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE public.camera_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

-- camera_configs policies: Public read, authenticated/admin update
DROP POLICY IF EXISTS "Allow read access to camera_configs for all" ON public.camera_configs;
CREATE POLICY "Allow read access to camera_configs for all"
ON public.camera_configs FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow service role full access to camera_configs" ON public.camera_configs;
CREATE POLICY "Allow service role full access to camera_configs"
ON public.camera_configs FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');

-- violation_events policies: Public read, operator/admin update
DROP POLICY IF EXISTS "Allow read access to violation_events for all" ON public.violation_events;
CREATE POLICY "Allow read access to violation_events for all"
ON public.violation_events FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow insert to violation_events for backend service" ON public.violation_events;
CREATE POLICY "Allow insert to violation_events for backend service"
ON public.violation_events FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update validation_status to authenticated users" ON public.violation_events;
CREATE POLICY "Allow update validation_status to authenticated users"
ON public.violation_events FOR UPDATE
USING (auth.role() = 'authenticated' OR auth.jwt() ->> 'role' = 'service_role');

-- users_profile policies
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.users_profile;
CREATE POLICY "Allow users to read their own profile"
ON public.users_profile FOR SELECT
USING (auth.uid() = id);

-- ==============================================================================
-- 9. Seed Data for 3 Primary BTM CCTV Cameras
-- ==============================================================================
INSERT INTO public.camera_configs (
    camera_code,
    camera_name,
    stream_url,
    resolution_width,
    resolution_height,
    roi_polygon,
    threshold_seconds,
    is_configured
)
VALUES
    (
        'empang',
        'Jl. Djuanda - Empang',
        'https://bsw.kotabogor.go.id/live/empang.m3u8',
        1920,
        1080,
        '[[0.15, 0.45], [0.75, 0.45], [0.85, 0.95], [0.05, 0.95]]'::jsonb,
        60,
        true
    ),
    (
        'surken',
        'Jl. Djuanda - Suryakencana',
        'https://bsw.kotabogor.go.id/live/surken.m3u8',
        1920,
        1080,
        '[[0.20, 0.40], [0.80, 0.40], [0.90, 0.95], [0.10, 0.95]]'::jsonb,
        60,
        true
    ),
    (
        'balaikota',
        'Jl. Djuanda - Balaikota',
        'https://bsw.kotabogor.go.id/live/balaikota.m3u8',
        704,
        576,
        '[[0.25, 0.35], [0.75, 0.35], [0.85, 0.90], [0.15, 0.90]]'::jsonb,
        60,
        true
    )
ON CONFLICT (camera_code) DO UPDATE SET
    camera_name = EXCLUDED.camera_name,
    stream_url = EXCLUDED.stream_url,
    resolution_width = EXCLUDED.resolution_width,
    resolution_height = EXCLUDED.resolution_height,
    threshold_seconds = EXCLUDED.threshold_seconds;

