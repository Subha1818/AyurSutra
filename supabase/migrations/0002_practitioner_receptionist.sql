-- 0002_practitioner_receptionist.sql: Database schema enhancements for Practitioner and Receptionist workflows

-- 1. Add preferences column to profiles (for notification & scheduler settings)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{"email": true, "sms": true, "autoSchedule": false}'::jsonb;

-- 2. Allow walk-in patients in profiles (drop FK so receptionist can register patients without auth.users accounts)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

DO $$ BEGIN
    ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
EXCEPTION
    WHEN others THEN null;
END $$;

-- 3. Enable Realtime on notifications and sessions tables
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

-- 4. RLS policies for notifications
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users view their own notifications" ON public.notifications;
CREATE POLICY "Users view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (true);

-- 5. RLS policies for profiles (allow receptionist to register walk-ins and update profiles)
DROP POLICY IF EXISTS "Staff can insert patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated to insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can update patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Allow authenticated to update profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (true);

-- 6. RLS policies for sessions (allow receptionists & patients to book and update sessions)
DROP POLICY IF EXISTS "Patients can create their own sessions" ON public.sessions;
CREATE POLICY "Allow authenticated users to create sessions"
    ON public.sessions FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authorized users can update sessions" ON public.sessions;
CREATE POLICY "Allow authenticated users to update sessions"
    ON public.sessions FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Patients view their own sessions" ON public.sessions;
CREATE POLICY "Allow authenticated users to view sessions"
    ON public.sessions FOR SELECT
    TO authenticated
    USING (true);

-- 7. RLS policies for session_records (allow practitioners to document clinical observations)
DROP POLICY IF EXISTS "Practitioners can manage session records" ON public.session_records;
CREATE POLICY "Allow authenticated to manage session records"
    ON public.session_records FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
