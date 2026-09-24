# AyurSutra (Panchakarma Management Platform) — Project Context & Architecture

> **Document Purpose**: This comprehensive context document serves as the single source of truth for AI agents and developers working on the **AyurSutra** codebase. It outlines the platform context, role workflows, UI architecture, tech stack, backend/Supabase integration status, and roadmap for remaining implementation.

---

## 1. Website & Domain Context

### 1.1 Overview & Problem Statement
* **Project Name**: AyurSutra (Smart India Hackathon - SIH Project)
* **Domain**: Traditional AYUSH Healthcare / Ayurvedic Medicine / Panchakarma Therapy Management
* **Core Problem**:
  Panchakarma is an ancient, intensive 5-fold detoxification and rejuvenation therapeutic system in Ayurveda (consisting of *Vamana*, *Virechana*, *Basti*, *Nasya*, and *Raktamokshana*). Traditional Panchakarma administration suffers from:
  1. Lack of standardized patient session scheduling and monitoring.
  2. Disconnect between initial consultation, therapy administration, and post-therapy observation (tracking vital signs, pain, energy, side effects).
  3. Friction in clinic front-desk operations (manual booking, practitioner-patient-room allocation).
  4. Inadequate digital patient engagement and personalized guidance before and after therapies.

### 1.2 Solution & Value Proposition
AyurSutra is an end-to-end digital ecosystem that:
* Connects **Patients**, **Practitioners (Doctors & Therapists)**, and **Clinic Receptionists / Admins**.
* Features **AI-Assisted Panchakarma Guidance** (Gemini AI API):
  * Dynamic symptom & wellness goal-based therapy recommendations.
  * 24/7 interactive Ayurvedic wellness chatbot.
  * Intelligent scheduling recommendations based on Ayurvedic dosha biorhythms (Vata/Pitta/Kapha optimal treatment windows).
  * Clinical session note summarization for practitioners.
* Provides **Interactive Health & Progress Analytics**:
  * Real-time pain level vs. energy score trajectories.
  * Therapy completion percentages and wellness goal progress tracking.
* Enables flexible **Clinic Visit** and **Home Service** booking workflows with clinic geolocation discovery.

---

## 2. User Roles & Detailed Feature Matrix

The platform is designed around 3 primary actors, plus a planned System Admin:

### 2.1 Patient Role
| Feature Category | Capabilities & Workflow |
| :--- | :--- |
| **Authentication & Profile** | • Sign up with name, email, phone, password, and OTP verification.<br>• Secure login and session persistence.<br>• Profile details and therapy preferences. |
| **AI Assessment & Discovery** | • Interactive symptom & health goal checker on landing page & dashboard.<br>• AI-generated therapy suggestions with detailed therapy descriptions.<br>• Floating 24/7 AI Ayurvedic Chatbot (`AIChatbot`). |
| **Session Booking** | • Two-mode booking: **Clinic Visit** or **Home Service**.<br>• Real-time clinic discovery with geolocation, distance calculation, and ratings.<br>• Panchakarma therapy selector (*Vamana*, *Virechana*, *Basti*, *Nasya*, *Raktamokshana*).<br>• Date and time slot selection with instant confirmation alert. |
| **Progress & Health Tracking** | • Interactive Recharts data visualization: Pain Score vs Energy Level over weekly intervals.<br>• Therapy completion progress bars (e.g., 7/10 sessions completed).<br>• Wellness goal tracker with dynamic percentage indicators (Pain reduction, Energy boost, Sleep improvement). |
| **Session Management** | • Upcoming appointments feed with therapy name, practitioner name, date, time, and service badge.<br>• Direct reschedule request button and one-click practitioner phone call button.<br>• Past session history with 5-star rating display and completion badge. |
| **Post-Therapy Feedback** | • Session feedback submission: 1–10 slider for pain level, text inputs for side effects and improvements, and star ratings. |

---

### 2.2 Practitioner Role (Doctors / Ayurvedic Vaidyas / Therapists)
| Feature Category | Capabilities & Workflow |
| :--- | :--- |
| **Authentication & Verification** | • Registration with professional specialization (*Panchakarma Specialist*, *Ayurvedic Physician*, *Massage Therapist*, *Herbal Medicine Expert*, *Yoga Therapist*, *Nutrition Counselor*).<br>• ID Document / Certification upload for verified badge credentialing.<br>• Role-gated redirect to `/practitioner-dashboard`. |
| **Active Session Console** | • Live session management modal/card for in-progress therapies.<br>• **Live Stopwatch/Timer**: Real-time elapsed therapy tracking with start, pause, resume, and stop controls.<br>• **Clinical Checklist**: Interactive checklist for Blood Pressure Check, Temperature Check, Pulse Rate Check, Patient Preparation, Therapy Administration, and Post-therapy Care.<br>• Real-time session observation and clinical notes textarea.<br>• "Complete Session" action triggering patient notification and feedback loop. |
| **Daily Schedule Management** | • Chronological today's appointments feed with statuses: `scheduled`, `in-progress`, `completed`.<br>• One-click session activation and direct in-app patient communication trigger. |
| **Patient Caseload & History** | • Patient directory displaying current therapy package, total sessions completed, and overall progress score.<br>• Direct links to patient history and add notes. |
| **Clinical Notes & AI Summarizer** | • Detailed clinical notes input.<br>• **Gemini AI Notes Summarizer**: One-click extraction of concise clinical insights from verbose practitioner logs.<br>• Historical notes archive with patient name, therapy type, timestamp, and quick excerpt view. |
| **Practitioner Profile & Analytics** | • Profile info showing qualifications (e.g., BAMS, MD Panchakarma), experience, verified status, and supported languages.<br>• Performance KPIs: Total Patients treated, Sessions Completed, Average Rating (e.g., 4.9/5), and Therapy Success Rate (e.g., 94%).<br>• Operational settings: Email notifications toggle, SMS reminders toggle, and AI Auto-Schedule opt-in. |

---

### 2.3 Receptionist / Clinic Admin Role
| Feature Category | Capabilities & Workflow |
| :--- | :--- |
| **Authentication** | • Registration gated by official `clinicCode` verification.<br>• Login redirecting directly to `/receptionist-dashboard`. |
| **Patient Registration** | • Walk-in patient intake form: Name, Email, Phone, Age, Gender, and Therapy Package assignment (7-day, 14-day, 21-day, Single Session, or Consultation). |
| **Manual & AI Scheduling** | • Multi-select appointment scheduling: Patient selection, Assigned Practitioner, Treatment Date, and Time slot.<br>• **SmartScheduler AI**: Algorithmic slot recommendation providing optimal Ayurvedic therapy timing (e.g., morning Kapha hours vs afternoon Pitta hours) with match confidence scores.<br>• Real-time list of today's scheduled appointments with room assignment and color-coded status badges (`confirmed`, `pending`, `cancelled`). |
| **Interactive Calendar** | • Embedded monthly calendar view for clinic schedule overview and day-by-day load inspection. |
| **Request Queue Handling** | • Centralized queue for patient reschedule and cancellation requests.<br>• Fast-action triage: One-click "Approve", "Reject", or "Contact Patient via Phone". |
| **Clinic Operations & Metrics** | • Aggregate operational metrics showing total registered clinic patients and booked appointment volumes. |

---

## 3. Technology Stack & Dependencies

### 3.1 Frontend Architecture
* **Framework**: React 19.1.1 (Vite 5.4 build toolchain with `@vitejs/plugin-react-swc`)
* **Language**: TypeScript 5.5.3 (strict mode configured)
* **Styling**: Tailwind CSS 3.4.11 + `tailwindcss-animate`, `@tailwindcss/typography`, `@tailwindcss/aspect-ratio`
* **UI Component Primitives**: Shadcn/UI (Radix UI suite):
  * Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, Popover, Progress, Radio Group, Select, Slider, Switch, Tabs, Toast, Tooltip, Calendar.
* **Icons**: `lucide-react` (v0.462.0)
* **Typography**: Google Fonts — *Cormorant Garamond* (editorial Ayurvedic branding) & Inter/system-sans.
* **Charts & Data Viz**: `recharts` (v2.15.4) for clinical trajectory line graphs.
* **State & Data Fetching**:
  * `@tanstack/react-query` (v5.56.2)
  * `zustand` (v4.5.0)
  * `react-hook-form` (v7.53.0) + `@hookform/resolvers` + `zod` (v3.23.8)
* **Notifications**: `sonner` (v1.5.0) + custom Toast providers.
* **Routing**: `react-router-dom` (v6.26.2)

### 3.2 AI & Machine Learning Integrations
* **LLM Engine**: Google Gemini API (`gemini-2.5-flask` / `v1beta` endpoint).
* **AI Capabilities Implemented**:
  1. `AIChatbot`: Interactive health assistant for therapy guidance and platform FAQs.
  2. `TherapySuggestions`: Semantic matching of user symptoms and wellness goals to appropriate Panchakarma therapies.
  3. `SmartScheduler`: Dosha-optimized schedule recommendation engine with confidence weighting.
  4. `NotesSummarizer`: Clinical note compression and actionable treatment summary generation.

---

## 4. Current Authentication & Backend (Supabase) Status

### 4.1 What Is Currently Configured
1. **Dependency Installed**:
   * `@supabase/supabase-js` (version `^2.50.3`) is present in `package.json`.
2. **Service Abstraction Layer (`src/lib/api.ts`)**:
   * The codebase uses a cleanly abstracted service pattern separating the UI components from data APIs:
     * `authService`: Handles `login`, `register`, `sendOTP`, `verifyOTP`.
     * `bookingService`: Handles `bookSession`, `getAvailableSlots`, `rescheduleSession`.
     * `progressService`: Handles `getProgressData`, `submitFeedback`.
     * `notificationService`: Handles `sendNotification`, `getNotifications`.
     * `locationService`: Handles `getCurrentLocation`, `getNearbyClinicss`.
     * `aiService`: Directly integrates with Google Generative AI (Gemini).
3. **Current State (Mocked Layer)**:
   * `authService`, `bookingService`, `progressService`, and `notificationService` are currently operating via **mock asynchronous handlers** with `console.log` traces.
   * `Auth.tsx` currently validates credentials locally and navigates via `useNavigate()` according to the selected role:
     * `'patient'` $\rightarrow$ `/patient-dashboard`
     * `'practitioner'` $\rightarrow$ `/practitioner-dashboard`
     * `'receptionist'` $\rightarrow$ `/receptionist-dashboard`
   * There are explicit placeholder comments (e.g. `/* IMPLEMENT YOUR LOGIN API CALL HERE */`) designed for direct Supabase client injection.

### 4.2 Supabase Integration Plan & Target Schema

To replace the mock layer with live Supabase authentication and database storage, the following setup is needed:

#### A. Environment Configuration (`.env`)
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_GEMINI_API_KEY=<your-gemini-key>
```

#### B. Supabase Client Initialization (`src/lib/supabase.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### C. Database Table Schemas (PostgreSQL / Supabase)
1. **`profiles`** (extends `auth.users`):
   * `id` (UUID, PK, references `auth.users.id`)
   * `email` (TEXT)
   * `name` (TEXT)
   * `phone` (TEXT)
   * `role` (ENUM: `'patient'`, `'practitioner'`, `'receptionist'`, `'admin'`)
   * `specialization` (TEXT, nullable - for practitioners)
   * `clinic_code` (TEXT, nullable - for receptionists)
   * `id_document_url` (TEXT, nullable - Supabase Storage bucket link)
   * `created_at` (TIMESTAMP WITH TIME ZONE)

2. **`clinics`**:
   * `id` (BIGSERIAL, PK)
   * `name` (TEXT)
   * `address` (TEXT)
   * `latitude` (DOUBLE PRECISION)
   * `longitude` (DOUBLE PRECISION)
   * `rating` (NUMERIC)
   * `clinic_code` (TEXT, UNIQUE)

3. **`therapies`**:
   * `id` (SERIAL, PK)
   * `name` (TEXT - *Vamana*, *Virechana*, etc.)
   * `description` (TEXT)
   * `dosha_target` (TEXT - Kapha, Pitta, Vata)
   * `duration_days` (INTEGER)
   * `icon` (TEXT)

4. **`sessions` / `appointments`**:
   * `id` (UUID, PK)
   * `patient_id` (UUID, FK $\rightarrow$ `profiles.id`)
   * `practitioner_id` (UUID, FK $\rightarrow$ `profiles.id`, nullable)
   * `clinic_id` (BIGINT, FK $\rightarrow$ `clinics.id`, nullable)
   * `therapy_id` (INTEGER, FK $\rightarrow$ `therapies.id`)
   * `session_type` (ENUM: `'clinic'`, `'home'`)
   * `status` (ENUM: `'scheduled'`, `'in-progress'`, `'completed'`, `'cancelled'`, `'rescheduled'`)
   * `scheduled_date` (DATE)
   * `scheduled_time` (TIME)
   * `room` (TEXT, nullable)
   * `duration_seconds` (INTEGER, default 0)
   * `created_at` (TIMESTAMPTZ)

5. **`session_records` / `clinical_notes`**:
   * `id` (UUID, PK)
   * `session_id` (UUID, FK $\rightarrow$ `sessions.id`)
   * `vitals` (JSONB: `{ bp, temp, pulse }`)
   * `checklist_completed` (JSONB)
   * `notes` (TEXT)
   * `ai_summary` (TEXT)
   * `created_at` (TIMESTAMPTZ)

6. **`patient_feedback`**:
   * `id` (UUID, PK)
   * `session_id` (UUID, FK $\rightarrow$ `sessions.id`)
   * `patient_id` (UUID, FK $\rightarrow$ `profiles.id`)
   * `pain_level` (INTEGER 1-10)
   * `side_effects` (TEXT)
   * `improvements` (TEXT)
   * `rating` (INTEGER 1-5)
   * `submitted_at` (TIMESTAMPTZ)

7. **`notifications`**:
   * `id` (BIGSERIAL, PK)
   * `user_id` (UUID, FK $\rightarrow$ `profiles.id`)
   * `message` (TEXT)
   * `type` (ENUM: `'reminder'`, `'update'`, `'alert'`)
   * `is_read` (BOOLEAN, default false)
   * `created_at` (TIMESTAMPTZ)

---

## 5. Directory & File Inventory

```
panchakarma/
├── index.html                   # HTML entry point with Google Fonts (Cormorant Garamond) & meta tags
├── package.json                 # Project dependencies, scripts (vite dev, build, lint)
├── vite.config.ts               # Vite configuration with React SWC and path alias '@/' -> './src/'
├── tailwind.config.ts           # Tailwind CSS configuration with custom theme colors & animations
├── PROJECT_CONTEXT.md           # [THIS FILE] Complete project context & status documentation
│
└── src/
    ├── app.tsx                  # Root router with BrowserRouter, Route definitions, Toaster, TooltipProvider
    ├── app.css                  # Global styles
    ├── index.css                # Tailwind base, components, and utilities
    ├── main.tsx                 # React DOM mount point
    │
    ├── components/
    │   ├── AIComponents.tsx     # AIChatbot, TherapySuggestions, SmartScheduler, NotesSummarizer
    │   └── ui/                  # Complete Shadcn/Radix UI component library (button, card, dialog, etc.)
    │
    ├── hooks/
    │   ├── use-mobile.tsx       # Viewport breakpoint detection hook
    │   └── use-toast.ts         # Toast notification management hook
    │
    ├── lib/
    │   ├── api.ts               # API configuration, mock services, Gemini REST service integration
    │   └── utils.ts             # Tailwind class merging utility (cn helper)
    │
    └── pages/
        ├── Index.tsx            # High-conversion Landing Page (Hero slideshow, Pill navbar, Therapy info, Geolocation Clinic Finder)
        ├── Auth.tsx             # Universal split-panel Login/Register page with multi-role selector & OTP verification
        ├── PatientDashboard.tsx # 5-tab Patient console (Overview, Book Session, Progress Chart, Sessions, Feedback)
        ├── PractitionerDashboard.tsx # 4-tab Doctor console (Live Session Timer & Checklist, Patients, AI Note Summarizer, Profile)
        ├── ReceptionistDashboard.tsx # 5-tab Front-desk console (Registration, Scheduling + SmartScheduler, Calendar, Requests, Stats)
        └── NotFound.tsx         # 404 fallback page
```

---

## 6. Page-by-Page Feature & UI Breakdown

### 6.1 Landing Page (`src/pages/Index.tsx`)
* **Floating Glassmorphic Navbar**: Dynamic scroll behavior (transitions from translucent white to emerald green on scroll) with smooth section anchoring and mobile responsive drawer.
* **Sticky Parallax Hero Section**:
  * 3-image cycling carousel with dynamic scroll blur ($0\text{px} \rightarrow 12\text{px}$) and opacity attenuation.
  * Direct CTAs: "Book Therapy", "Patient Login", "Register Clinic".
* **Animated Statistics Strip**: IntersectionObserver-triggered count-up animation for:
  * 10,000+ Patients Treated
  * 4.9/5 Average Rating
  * 5,000+ Sessions Completed
  * 25+ Years of Ayurvedic Wisdom
* **Five Panchakarma Explanations**: Detailed cards explaining *Vamana*, *Virechana*, *Basti*, *Nasya*, and *Raktamokshana*.
* **Interactive AI Therapy Discovery Tool**: Checkbox lists for symptoms (Chronic Pain, Digestive Issues, Stress, Sleep Problems, etc.) and health goals (Detoxification, Pain Relief, Mental Clarity, etc.) triggering AI recommendation cards.
* **Geolocation-Based Clinic Finder**: Browser `navigator.geolocation` integration to display nearby centers with distance, rating, and address.
* **Patient Testimonial Carousel**: Auto-rotating verified patient reviews.

### 6.2 Authentication Page (`src/pages/Auth.tsx`)
* **Split Layout**:
  * Left: Editorial Ayurvedic branding banner with Cormorant Garamond typography and key trust badges.
  * Right: Form container with Login/Register tab toggle.
* **Role Switcher**: Segmented selector for **Patient**, **Practitioner**, and **Receptionist**.
* **Role-Specific Form Fields**:
  * *All*: Name, Email, Phone, Password, Confirm Password.
  * *Patient/Practitioner*: Phone OTP verification flow.
  * *Practitioner*: Specialization dropdown + ID / Medical Registration Certificate upload.
  * *Receptionist*: Clinic Code verification field.
* **Navigation Handlers**: Validates input and routes to `/patient-dashboard`, `/practitioner-dashboard`, or `/receptionist-dashboard`.

### 6.3 Patient Dashboard (`src/pages/PatientDashboard.tsx`)
* **Tab 1 - Overview**:
  * Next session reminder card.
  * Progress Score (85%) & Wellness Score badges.
  * Notification list.
  * AI Therapy Suggestion cards linked to booking tab.
* **Tab 2 - Book Session**:
  * Step 1: Session mode toggle (**Clinic Visit** vs **Home Service**).
  * Therapy selector (5 Panchakarma types).
  * Clinic list with distance and ratings.
  * Step 2: Time slot selection (09:00, 10:30, 14:00, 15:30) and booking confirmation.
* **Tab 3 - Progress**:
  * Dual-line chart (Pain level vs Energy score) rendered with `Recharts`.
  * Multi-therapy session completion progress bars (Vamana 70%, Virechana 62.5%, Basti 50%).
  * Wellness goal cards with current vs target metrics.
* **Tab 4 - My Sessions**:
  * Upcoming appointments with reschedule button and practitioner call button.
  * Historical sessions with star ratings and status badges.
* **Tab 5 - Feedback**:
  * Interactive pain slider (1–10).
  * Qualitative side-effects and improvement textareas.
  * Rating selector with submission handler.

### 6.4 Practitioner Dashboard (`src/pages/PractitionerDashboard.tsx`)
* **Tab 1 - My Sessions**:
  * **Active Session Suite**: Real-time timer with Play/Pause controls.
  * **Interactive Pre/Post Care Checklist**: 6 checkable items (BP, Temp, Pulse, Preparation, Therapy, Post-care).
  * **Clinical Observation Notes Area**: Live notes input with save and complete actions.
  * **Today's Session Feed**: Chronological cards with status chips (`scheduled`, `in-progress`, `completed`).
* **Tab 2 - Patients**:
  * Patient directory cards displaying active therapy, session count, and visual progress percentage bar.
  * Actions for "View History" and "Add Notes".
* **Tab 3 - Notes**:
  * Full session note editor.
  * Integrated `NotesSummarizer` component powered by Gemini AI.
  * Historical note feed with search and edit options.
* **Tab 4 - Profile**:
  * Practitioner credentials, BAMS/MD specialization, languages, and verification badge.
  * Performance analytics grid (Patients: 247, Sessions: 1,456, Rating: 4.9, Success: 94%).
  * Notification and AI Auto-Schedule preferences.

### 6.5 Receptionist Dashboard (`src/pages/ReceptionistDashboard.tsx`)
* **Tab 1 - Register Patient**:
  * Intake form for walk-in patients (Name, Email, Phone, Age, Gender, Therapy Package).
* **Tab 2 - Scheduling**:
  * Manual appointment scheduler: Select Patient, Practitioner, Date, and Slot.
  * `SmartScheduler` component displaying AI-recommended optimal appointment timings.
  * Real-time list of today's booked appointments with status and assigned room.
* **Tab 3 - Calendar**:
  * Interactive monthly calendar date picker.
* **Tab 4 - Requests**:
  * Queue of patient reschedule and cancellation requests with direct "Approve", "Reject", and "Contact" buttons.
* **Tab 5 - Settings / Analytics**:
  * Key clinic volume indicators (Total Registered Patients, Confirmed Appointments).

---

## 7. Roadmap & Priority Tasks for Subsequent Development

1. **Connect Live Supabase Instance**:
   * Create Supabase project and apply the SQL schemas detailed in Section 4.2.
   * Add `.env` containing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   * Replace `authService` in `src/lib/api.ts` with `supabase.auth.signUp`, `signInWithPassword`, and session persistence via Supabase Auth.
   * Add Row Level Security (RLS) policies ensuring patients can only view their own records, practitioners can access their assigned patients, and receptionists can manage their clinic's records.
2. **Supabase Storage for Practitioner Credentials**:
   * Create a private or protected storage bucket `practitioner-documents` for practitioner license uploads during onboarding.
3. **Database-Driven Booking & Slots**:
   * Replace static slot arrays in `bookingService` with dynamic availability queries from the `sessions` table.
4. **Real-time Notifications**:
   * Implement Supabase Realtime listeners on the `notifications` and `sessions` tables to notify practitioners when a session is booked, and patients when an appointment is rescheduled.
5. **Secure AI Service**:
   * Transition Gemini API calls to a Supabase Edge Function or secure backend proxy to prevent exposing API keys on the client bundle.
