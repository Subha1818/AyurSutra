# AyurSutra Supabase Setup & Runbook

This guide details how to configure and run the Supabase backend for the **AyurSutra** Panchakarma platform.

---

## 1. Prerequisites

- A [Supabase](https://supabase.com) account.
- The project URL and Anonymous API Key from **Project Settings $\rightarrow$ API**.
- Node.js $\ge$ 18 installed locally.

---

## 2. Environment Variables Configuration

Create a `.env` file in the root directory (or use `.env.example` as a template):

```env
# Supabase Configuration (Notice: Do NOT include /rest/v1/ at the end of the URL)
VITE_SUPABASE_URL=https://huvqucvuszztzqgywozu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API Key
VITE_GEMINI_API_KEY=AIzaSy...
```

> **Important**: The Supabase client in `@supabase/supabase-js` expects the project origin (e.g. `https://<project-ref>.supabase.co`). Do not append `/rest/v1/` to `VITE_SUPABASE_URL`.

---

## 3. Applying Database Migrations

You can apply the database schema via the **Supabase Dashboard**:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (**AyurSutra**).
3. In the left navigation, click on **SQL Editor**.
4. Click **New Query**.
5. Copy the contents of [`supabase/migrations/0001_init.sql`](file:///supabase/migrations/0001_init.sql) and paste them into the SQL editor.
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).

### What this migration sets up:
- **Custom ENUMs**: `user_role` (`patient`, `practitioner`, `receptionist`, `admin`), `session_type_enum`, `session_status_enum`, `notification_type_enum`.
- **Tables**:
  - `profiles`: Extends `auth.users` with user roles, specializations, clinic codes, and registration timestamps.
  - `clinics`: Center names, addresses, coordinates, and unique clinic codes.
  - `therapies`: Panchakarma therapeutic procedures and target doshas.
  - `sessions`: Scheduled patient therapy appointments with practitioner assignments and room numbers.
  - `session_records`: Pre/post vitals, treatment checklist state, and clinical AI summaries.
  - `patient_feedback`: Post-session pain scoring, side effects, and ratings.
  - `notifications`: Alerts, therapy preparation updates, and reminders.
- **Triggers**: `handle_new_user()` automatically creates an associated `public.profiles` entry upon user signup.
- **Row Level Security (RLS)**: Strict data isolation policies ensuring patients and practitioners access only authorized sessions and documents.
- **Storage**: Configures the `practitioner-documents` storage bucket with folder-level isolation.

---

## 4. Seeding Initial Data

To load the 5 traditional Panchakarma therapies and sample Ayurvedic centers:

1. In the Supabase **SQL Editor**, click **New Query**.
2. Copy the contents of [`supabase/seed.sql`](file:///supabase/seed.sql).
3. Paste and click **Run**.

---

## 5. Supabase Auth Configuration

Ensure your Supabase project authentication settings match:

1. In Supabase Dashboard, go to **Authentication $\rightarrow$ Providers $\rightarrow$ Email**:
   - **Enable Email Provider**: ON
   - **Confirm email**: OFF (Allows users to sign in immediately upon registration without waiting for confirmation emails).
2. User Signups:
   - **Allow new users to sign up**: ON

---

## 6. How Authentication Works in AyurSutra

- **Sign Up**:
  - Captures `email`, `password`, `name`, `phone`, `role`, and role-specific details (`specialization` for practitioners, `clinicCode` for receptionists).
  - Practitioner certificates are uploaded to the `practitioner-documents` Supabase Storage bucket.
  - User is created in `auth.users` with metadata, and a corresponding profile row is inserted into `public.profiles`.
- **Sign In**:
  - `signInWithPassword` validates credentials against Supabase Auth.
  - The client queries `profiles.role` directly to authenticate the real user role and safely navigate them to `/patient-dashboard`, `/practitioner-dashboard`, or `/receptionist-dashboard`.
