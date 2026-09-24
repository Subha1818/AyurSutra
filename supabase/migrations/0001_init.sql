-- 0001_init.sql: AyurSutra Panchakarma Platform Initial Database Schema

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('patient', 'practitioner', 'receptionist', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_type_enum AS ENUM ('clinic', 'home');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status_enum AS ENUM ('scheduled', 'in-progress', 'completed', 'cancelled', 'rescheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type_enum AS ENUM ('reminder', 'update', 'alert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'patient',
    specialization TEXT,
    clinic_code TEXT,
    id_document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Clinics Table
CREATE TABLE IF NOT EXISTS public.clinics (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    rating NUMERIC(2, 1) NOT NULL DEFAULT 4.8,
    clinic_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Therapies Table
CREATE TABLE IF NOT EXISTS public.therapies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    dosha_target TEXT NOT NULL,
    duration_days INTEGER NOT NULL DEFAULT 7,
    icon TEXT NOT NULL DEFAULT 'Sparkles'
);

-- 5. Sessions / Appointments Table
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    practitioner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE SET NULL,
    therapy_id INTEGER NOT NULL REFERENCES public.therapies(id) ON DELETE RESTRICT,
    session_type session_type_enum NOT NULL DEFAULT 'clinic',
    status session_status_enum NOT NULL DEFAULT 'scheduled',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    room TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Session Records / Clinical Notes
CREATE TABLE IF NOT EXISTS public.session_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
    checklist_completed JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    ai_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Patient Feedback Table
CREATE TABLE IF NOT EXISTS public.patient_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pain_level INTEGER CHECK (pain_level >= 1 AND pain_level <= 10),
    side_effects TEXT,
    improvements TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type notification_type_enum NOT NULL DEFAULT 'reminder',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON public.sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_practitioner_id ON public.sessions(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_clinic_id ON public.sessions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_date ON public.sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_session_records_session_id ON public.session_records(session_id);

-- 9. Automatic Profile Creation Trigger on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_role_val user_role := 'patient';
    raw_role text;
BEGIN
    raw_role := new.raw_user_meta_data->>'role';
    IF raw_role IN ('patient', 'practitioner', 'receptionist', 'admin') THEN
        user_role_val := raw_role::user_role;
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        name,
        phone,
        role,
        specialization,
        clinic_code,
        id_document_url
    ) VALUES (
        new.id,
        COALESCE(new.email, ''),
        COALESCE(new.raw_user_meta_data->>'name', 'AyurSutra User'),
        new.raw_user_meta_data->>'phone',
        user_role_val,
        new.raw_user_meta_data->>'specialization',
        new.raw_user_meta_data->>'clinic_code',
        new.raw_user_meta_data->>'id_document_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        role = EXCLUDED.role,
        specialization = COALESCE(EXCLUDED.specialization, profiles.specialization),
        clinic_code = COALESCE(EXCLUDED.clinic_code, profiles.clinic_code),
        id_document_url = COALESCE(EXCLUDED.id_document_url, profiles.id_document_url);

    RETURN new;
END;
$$;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 11. Row Level Security Policies

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Clinics Policies (Anyone can read, authenticated can view)
DROP POLICY IF EXISTS "Clinics are viewable by everyone" ON public.clinics;
CREATE POLICY "Clinics are viewable by everyone"
    ON public.clinics FOR SELECT
    TO anon, authenticated
    USING (true);

-- Therapies Policies (Anyone can read)
DROP POLICY IF EXISTS "Therapies are viewable by everyone" ON public.therapies;
CREATE POLICY "Therapies are viewable by everyone"
    ON public.therapies FOR SELECT
    TO anon, authenticated
    USING (true);

-- Sessions Policies
DROP POLICY IF EXISTS "Patients view their own sessions" ON public.sessions;
CREATE POLICY "Patients view their own sessions"
    ON public.sessions FOR SELECT
    TO authenticated
    USING (
        auth.uid() = patient_id OR
        auth.uid() = practitioner_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('receptionist', 'admin')
        )
    );

DROP POLICY IF EXISTS "Patients can create their own sessions" ON public.sessions;
CREATE POLICY "Patients can create their own sessions"
    ON public.sessions FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = patient_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('receptionist', 'admin')
        )
    );

DROP POLICY IF EXISTS "Authorized users can update sessions" ON public.sessions;
CREATE POLICY "Authorized users can update sessions"
    ON public.sessions FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = patient_id OR
        auth.uid() = practitioner_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('receptionist', 'admin')
        )
    );

-- Session Records Policies
DROP POLICY IF EXISTS "Practitioners and patients view session records" ON public.session_records;
CREATE POLICY "Practitioners and patients view session records"
    ON public.session_records FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = session_records.session_id
            AND (sessions.patient_id = auth.uid() OR sessions.practitioner_id = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('receptionist', 'admin')
        )
    );

DROP POLICY IF EXISTS "Practitioners can insert and update session records" ON public.session_records;
CREATE POLICY "Practitioners can insert and update session records"
    ON public.session_records FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = session_records.session_id
            AND sessions.practitioner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('practitioner', 'admin')
        )
    );

-- Patient Feedback Policies
DROP POLICY IF EXISTS "Patients manage their own feedback" ON public.patient_feedback;
CREATE POLICY "Patients manage their own feedback"
    ON public.patient_feedback FOR ALL
    TO authenticated
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Practitioners view feedback for their sessions" ON public.patient_feedback;
CREATE POLICY "Practitioners view feedback for their sessions"
    ON public.patient_feedback FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions
            WHERE sessions.id = patient_feedback.session_id
            AND sessions.practitioner_id = auth.uid()
        )
    );

-- Notifications Policies
DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
CREATE POLICY "Users can read their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- 12. Storage Bucket Setup (Practitioner Documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('practitioner-documents', 'practitioner-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Practitioners can upload own documents" ON storage.objects;
CREATE POLICY "Practitioners can upload own documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'practitioner-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Practitioners can read own documents" ON storage.objects;
CREATE POLICY "Practitioners can read own documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'practitioner-documents' AND
        (
            (storage.foldername(name))[1] = auth.uid()::text OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'receptionist')
            )
        )
    );
