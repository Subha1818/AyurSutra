// API Integration Layer for Panchakarma Platform
// Supabase Auth and Database Integration
import { supabase } from '@/lib/supabase';

// Authentication API Configuration
export const authConfig = {
  baseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://huvqucvuszztzqgywozu.supabase.co',
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

// OTP Service Configuration (Email OTP / auto-verify mode active)
export const otpConfig = {
  apiKey: 'email-otp-direct',
  endpoint: 'supabase-auth-email',
};

// Location/Maps API Configuration
export const locationConfig = {
  apiKey: 'your-google-maps-key', // /* INSERT YOUR LOCATION API KEY HERE */
  endpoint: 'https://maps.googleapis.com/maps/api',
};

// AI Services Configuration
export const aiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCcx6c0d0x7V5YLlwDuyQ2lDExNMFWOIm4', // Gemini API key
  endpoint: 'https://generativelanguage.googleapis.com/v1beta', // Gemini API base
  model: 'gemini-2.5-flask', // Example Gemini text model
};

// Type definitions
export interface Therapy {
  id: number;
  name: string;
  description: string;
  dosha_target?: string;
  duration_days?: number;
  icon: string;
}

export interface Clinic {
  id: number;
  name: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  clinic_code?: string;
  distance?: string;
}

export interface Testimonial {
  id: number;
  name: string;
  text: string;
  rating: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: string;
}

export interface UserData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  otp: string;
  specialization: string;
  clinicCode: string;
  idDocument: File | null;
  role: string;
}

export interface BookingData {
  patientId?: string;
  clinicId?: number;
  therapyId?: number;
  therapy?: string;
  type: 'clinic' | 'home';
  date: string;
  time: string;
  room?: string;
}

export interface FeedbackData {
  painLevel: number;
  sideEffects: string;
  improvements: string;
  rating: number;
}

// Mock API responses for development
export const mockResponses = {
  therapies: [
    { id: 1, name: 'Vamana', description: 'Therapeutic vomiting for Kapha disorders', icon: '🌿' },
    { id: 2, name: 'Virechana', description: 'Purgation therapy for Pitta disorders', icon: '🍃' },
    { id: 3, name: 'Basti', description: 'Medicated enema for Vata disorders', icon: '💧' },
    { id: 4, name: 'Nasya', description: 'Nasal administration of medicines', icon: '🌸' },
    { id: 5, name: 'Raktamokshana', description: 'Bloodletting therapy', icon: '🩸' },
  ] as Therapy[],
  clinics: [
    { id: 1, name: 'Ayur Wellness Center', location: 'Sector 2', rating: 4.8, distance: '2.3 km' },
    { id: 2, name: 'Panchakarma Healing', location: 'Newtown', rating: 4.6, distance: '3.1 km' },
    { id: 3, name: 'Holistic Health Hub', location: 'CityCenter', rating: 4.9, distance: '4.2 km' },
  ] as Clinic[],
  testimonials: [
    { id: 1, name: ' Johnson', text: 'Panchakarma therapy transformed my health completely!', rating: 5 },
    { id: 2, name: 'Michael Chen', text: 'Professional care and amazing results.', rating: 5 },
    { id: 3, name: 'Priya Sharma', text: 'Best decision for my wellness journey.', rating: 5 },
  ] as Testimonial[],
};

// Authentication Services
export const authService = {
  async login(credentials: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw error;
      }

      // Query database profile to get authentic user role
      let userRole = credentials.role;
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile?.role) {
          userRole = profile.role;
        }
      }

      return {
        success: true,
        token: data.session?.access_token || '',
        user: { id: data.user?.id || 'unknown', role: userRole }
      };
    } catch (error: any) {
      console.error('Supabase login error:', error);
      throw error;
    }
  },

  async register(userData: Partial<UserData>) {
    try {
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      let idDocumentUrl: string | undefined = undefined;

      // Practitioner ID certificate upload (if present)
      if (userData.idDocument) {
        try {
          const file = userData.idDocument;
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const filePath = `uploads/${fileName}`;

          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('practitioner-documents')
            .upload(filePath, file);

          if (!uploadErr && uploadData) {
            idDocumentUrl = filePath;
          }
        } catch (uploadError) {
          console.warn('Document upload warning:', uploadError);
        }
      }

      // Check if user is already authenticated via email OTP
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && currentUser.email?.toLowerCase() === userData.email.toLowerCase()) {
        const { error: updateErr } = await supabase.auth.updateUser({
          password: userData.password,
          data: {
            name: userData.name || '',
            phone: userData.phone || '',
            role: userData.role || 'patient',
            specialization: userData.specialization || '',
            clinic_code: userData.clinicCode || '',
            id_document_url: idDocumentUrl || '',
          },
        });

        if (updateErr) throw updateErr;

        // Sync profile table
        const { error: syncErr } = await supabase.from('profiles').upsert({
          id: currentUser.id,
          email: userData.email,
          name: userData.name || '',
          phone: userData.phone || null,
          role: (userData.role as any) || 'patient',
          specialization: userData.specialization || null,
          clinic_code: userData.clinicCode || null,
          id_document_url: idDocumentUrl || null,
        });
        if (syncErr) {
          console.warn('Profile direct sync note:', syncErr);
        }

        return { success: true, message: 'Registration and email verification successful' };
      }

      // Supabase user signup with metadata for handle_new_user trigger
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name || '',
            phone: userData.phone || '',
            role: userData.role || 'patient',
            specialization: userData.specialization || '',
            clinic_code: userData.clinicCode || '',
            id_document_url: idDocumentUrl || '',
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          throw new Error('This email is already registered. Please login or reset your password.');
        }
        throw error;
      }

      // Fallback: If trigger didn't run or table was populated directly
      if (data.user) {
        const { error: profileErr } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: userData.email,
          name: userData.name || '',
          phone: userData.phone || null,
          role: (userData.role as any) || 'patient',
          specialization: userData.specialization || null,
          clinic_code: userData.clinicCode || null,
          id_document_url: idDocumentUrl || null,
        });
        if (profileErr) {
          console.warn('Profile direct sync note:', profileErr);
        }
      }

      return { success: true, message: 'Registration successful' };
    } catch (error: any) {
      console.error('Supabase registration error:', error);
      throw error;
    }
  },

  async sendOTP(email: string) {
    try {
      if (!email) {
        throw new Error('Email is required to send OTP');
      }

      console.log('Sending email OTP to:', email);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      return { success: true, message: `OTP sent successfully to ${email}` };
    } catch (error: any) {
      console.error('Supabase sendOTP error:', error);
      throw error;
    }
  },

  async verifyOTP(email: string, otp: string) {
    try {
      if (!email || !otp) {
        throw new Error('Email and OTP are required');
      }

      console.log('Verifying email OTP for:', email);
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      });

      if (error) {
        throw error;
      }

      return { success: true, message: 'Email OTP verified successfully', data };
    } catch (error: any) {
      console.error('Supabase verifyOTP error:', error);
      throw error;
    }
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getCurrentSession() {
    return await supabase.auth.getSession();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    return { user, profile };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Clinic & Therapy Catalog Services
export const clinicService = {
  async getClinics(userLat?: number, userLng?: number): Promise<Clinic[]> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('name');

      if (error || !data || data.length === 0) {
        console.warn('Clinics fetch note, using mock:', error);
        return mockResponses.clinics;
      }

      const list: Clinic[] = data.map((clinic: any) => {
        let distanceStr = '2.5 km';
        if (userLat !== undefined && userLng !== undefined && clinic.latitude && clinic.longitude) {
          const d = calculateDistanceKm(userLat, userLng, Number(clinic.latitude), Number(clinic.longitude));
          distanceStr = `${d.toFixed(1)} km`;
        }
        return {
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
          location: clinic.address || 'Central Clinic',
          rating: Number(clinic.rating) || 4.8,
          latitude: clinic.latitude,
          longitude: clinic.longitude,
          clinic_code: clinic.clinic_code,
          distance: distanceStr,
        };
      });

      if (userLat !== undefined && userLng !== undefined) {
        list.sort((a, b) => {
          const distA = parseFloat(a.distance || '0');
          const distB = parseFloat(b.distance || '0');
          return distA - distB;
        });
      }

      return list;
    } catch (err) {
      console.error('getClinics error:', err);
      return mockResponses.clinics;
    }
  },

  async getTherapies(): Promise<Therapy[]> {
    try {
      const { data, error } = await supabase
        .from('therapies')
        .select('*')
        .order('id');

      if (error || !data || data.length === 0) {
        console.warn('Therapies fetch note, using mock:', error);
        return mockResponses.therapies;
      }

      return data.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        dosha_target: t.dosha_target,
        duration_days: t.duration_days,
        icon: t.icon || '🌿',
      }));
    } catch (err) {
      console.error('getTherapies error:', err);
      return mockResponses.therapies;
    }
  }
};

// Location Services
export const locationService = {
  async getNearbyClinics(lat: number, lng: number): Promise<Clinic[]> {
    return clinicService.getClinics(lat, lng);
  },

  async getNearbyClinicss(lat: number, lng: number): Promise<Clinic[]> {
    return clinicService.getClinics(lat, lng);
  },

  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => reject(error)
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  },
};

// AI Services using Gemini
export const aiService = {
  async getChatbotResponse(message: string) {
    console.log('Gemini Chatbot query:', message);

    try {
      const res = await fetch(`${aiConfig.endpoint}/models/${aiConfig.model}:generateMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          prompt: message,
          maxOutputTokens: 200,
        }),
      });

      const data = await res.json();
      return { response: data.output?.[0]?.content?.[0]?.text || "I'm here to help with Panchakarma." };
    } catch (err) {
      console.error('Gemini API error:', err);
      return { response: "Sorry, I couldn't process your request right now." };
    }
  },

  async getTherapySuggestions(symptoms: string[], goals: string[]): Promise<Therapy[]> {
    console.log('Gemini therapy suggestions for:', { symptoms, goals });

    try {
      const prompt = `Suggest Panchakarma therapies based on symptoms: ${symptoms.join(', ')} and goals: ${goals.join(', ')}`;
      const res = await fetch(`${aiConfig.endpoint}/models/${aiConfig.model}:generateMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          maxOutputTokens: 200,
        }),
      });

      const data = await res.json();
      const suggestionsText = data.output?.[0]?.content?.[0]?.text || '';

      const therapies = await clinicService.getTherapies();
      const suggestions = therapies.filter(therapy =>
        suggestionsText.toLowerCase().includes(therapy.name.toLowerCase())
      );

      return suggestions.length > 0 ? suggestions : [therapies[0]];
    } catch (err) {
      console.error('Gemini therapy suggestions error:', err);
      return mockResponses.therapies;
    }
  },

  async summarizeNotes(notes: string): Promise<string> {
    console.log('Gemini summarizing notes:', notes);

    try {
      const prompt = `Summarize the following Panchakarma therapy notes concisely:\n${notes}`;
      const res = await fetch(`${aiConfig.endpoint}/models/${aiConfig.model}:generateMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({ prompt, maxOutputTokens: 150 }),
      });

      const data = await res.json();
      return data.output?.[0]?.content?.[0]?.text || 'Summary not available.';
    } catch (err) {
      console.error('Gemini summarization error:', err);
      return 'Summary not available.';
    }
  },
};

// Available slot definition
const ALL_POSSIBLE_SLOTS = ['09:00', '10:30', '14:00', '15:30', '17:00'];

// Booking Services
export const bookingService = {
  async getAvailableSlots(clinicId?: number | null, date?: string): Promise<string[]> {
    try {
      if (!date) return ALL_POSSIBLE_SLOTS;

      let query = supabase
        .from('sessions')
        .select('scheduled_time')
        .eq('scheduled_date', date)
        .neq('status', 'cancelled');

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Could not fetch booked slots:', error);
        return ALL_POSSIBLE_SLOTS;
      }

      const bookedSlots = new Set(
        (data || []).map((s: any) => (s.scheduled_time ? s.scheduled_time.slice(0, 5) : ''))
      );

      return ALL_POSSIBLE_SLOTS.filter(slot => !bookedSlots.has(slot));
    } catch (err) {
      console.error('getAvailableSlots error:', err);
      return ALL_POSSIBLE_SLOTS;
    }
  },

  async bookSession(bookingData: BookingData) {
    try {
      let patientId = bookingData.patientId;
      if (!patientId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be signed in to book a session.');
        patientId = user.id;
      }

      let therapyId = bookingData.therapyId;
      if (!therapyId && bookingData.therapy) {
        const { data: therapyRow } = await supabase
          .from('therapies')
          .select('id')
          .ilike('name', bookingData.therapy.trim())
          .maybeSingle();
        if (therapyRow) therapyId = therapyRow.id;
      }
      if (!therapyId) therapyId = 1;

      const timeFormatted = bookingData.time.length === 5 ? `${bookingData.time}:00` : bookingData.time;

      const insertPayload: any = {
        patient_id: patientId,
        therapy_id: therapyId,
        session_type: bookingData.type || 'clinic',
        status: 'scheduled',
        scheduled_date: bookingData.date,
        scheduled_time: timeFormatted,
      };

      if (bookingData.clinicId) {
        insertPayload.clinic_id = bookingData.clinicId;
      }

      const { data, error } = await supabase
        .from('sessions')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      try {
        await supabase.from('notifications').insert({
          user_id: patientId,
          message: `Booking confirmed: ${bookingData.therapy || 'Panchakarma'} session on ${bookingData.date} at ${bookingData.time}.`,
          type: 'reminder',
        });
      } catch (notifErr) {
        console.warn('Notification insert notice:', notifErr);
      }

      return { success: true, bookingId: data?.id || 'BK' + Date.now(), data };
    } catch (error: any) {
      console.error('Supabase bookSession error:', error);
      throw error;
    }
  },

  async rescheduleSession(sessionId: string, newDate: string, newTime: string) {
    try {
      const timeFormatted = newTime.length === 5 ? `${newTime}:00` : newTime;
      const { data, error } = await supabase
        .from('sessions')
        .update({
          scheduled_date: newDate,
          scheduled_time: timeFormatted,
          status: 'rescheduled',
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      if (data?.patient_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: data.patient_id,
            message: `Session rescheduled to ${newDate} at ${newTime.slice(0, 5)}.`,
            type: 'update',
          });
        } catch (notifErr) {
          console.warn('Reschedule notification notice:', notifErr);
        }
      }

      return { success: true, message: 'Session rescheduled successfully', data };
    } catch (error: any) {
      console.error('rescheduleSession error:', error);
      throw error;
    }
  },
};

// Notification Services
export const notificationService = {
  async getNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.warn('Could not load notifications from Supabase:', error);
        return [];
      }

      return (data || []).map((n: any) => ({
        id: n.id,
        message: n.message,
        type: n.type || 'reminder',
        read: n.is_read,
        created_at: n.created_at,
      }));
    } catch (err) {
      console.error('getNotifications error:', err);
      return [];
    }
  },

  async markRead(notificationId: number | string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('markRead error:', err);
      return { success: false };
    }
  },

  async sendNotification(userId: string, message: string, type: 'reminder' | 'update' | 'alert') {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({ user_id: userId, message, type });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('sendNotification error:', err);
      return { success: false };
    }
  },
};

// Session & Appointment Services
export const sessionService = {
  async getNextSession(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          session_type,
          status,
          room,
          clinic_id,
          therapy_id,
          practitioner_id,
          therapies (id, name, icon, description),
          clinics (id, name, address)
        `)
        .eq('patient_id', userId)
        .in('status', ['scheduled', 'rescheduled'])
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      let practitionerName = 'Assigned Practitioner';
      let practitionerPhone: string | null = null;
      if (data.practitioner_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('name, phone')
          .eq('id', data.practitioner_id)
          .maybeSingle();
        if (prof?.name) practitionerName = prof.name;
        if (prof?.phone) practitionerPhone = prof.phone;
      }

      return {
        id: data.id,
        date: data.scheduled_date,
        time: data.scheduled_time ? data.scheduled_time.slice(0, 5) : '10:00',
        therapy: (data.therapies as any)?.name || 'Panchakarma Therapy',
        therapy_icon: (data.therapies as any)?.icon || '🌿',
        type: data.session_type,
        clinic: (data.clinics as any)?.name || (data.session_type === 'home' ? 'Home Service' : 'Ayur Center'),
        clinic_address: (data.clinics as any)?.address || '',
        practitioner: practitionerName,
        practitioner_phone: practitionerPhone,
      };
    } catch (err) {
      console.error('getNextSession error:', err);
      return null;
    }
  },

  async getScores(userId: string) {
    try {
      const [sessionsRes, feedbackRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('id, status')
          .eq('patient_id', userId),
        supabase
          .from('patient_feedback')
          .select('pain_level')
          .eq('patient_id', userId)
          .order('submitted_at', { ascending: false })
          .limit(5)
      ]);

      const allSessions = sessionsRes.data || [];
      const nonCancelled = allSessions.filter(s => s.status !== 'cancelled');
      const completed = allSessions.filter(s => s.status === 'completed');

      const progressScore = nonCancelled.length > 0
        ? Math.round((completed.length / nonCancelled.length) * 100)
        : (completed.length > 0 ? 100 : 0);

      const feedbacks = feedbackRes.data || [];
      let wellnessLabel = 'Good';
      if (feedbacks.length > 0) {
        const avgPain = feedbacks.reduce((acc, f) => acc + (f.pain_level || 5), 0) / feedbacks.length;
        const avgScore = 10 - avgPain;
        if (avgScore >= 8) wellnessLabel = 'Excellent';
        else if (avgScore >= 6) wellnessLabel = 'Good';
        else if (avgScore >= 4) wellnessLabel = 'Fair';
        else wellnessLabel = 'Needs Care';
      }

      return {
        progressScore,
        wellnessLabel,
        completedCount: completed.length,
        totalCount: nonCancelled.length
      };
    } catch (err) {
      console.error('getScores error:', err);
      return { progressScore: 0, wellnessLabel: 'Good', completedCount: 0, totalCount: 0 };
    }
  },

  async getUpcomingSessions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          session_type,
          status,
          room,
          clinic_id,
          therapy_id,
          practitioner_id,
          therapies (id, name, icon),
          clinics (id, name, address)
        `)
        .eq('patient_id', userId)
        .in('status', ['scheduled', 'in-progress', 'rescheduled'])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error || !data) return [];

      const practitionerIds = Array.from(new Set(data.map(s => s.practitioner_id).filter(Boolean)));
      let practitionersMap: Record<string, { name: string; phone: string | null }> = {};
      if (practitionerIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, name, phone')
          .in('id', practitionerIds);
        (profs || []).forEach(p => {
          practitionersMap[p.id] = { name: p.name, phone: p.phone };
        });
      }

      return data.map(s => ({
        id: s.id,
        date: s.scheduled_date,
        time: s.scheduled_time ? s.scheduled_time.slice(0, 5) : '10:00',
        therapy: (s.therapies as any)?.name || 'Panchakarma Therapy',
        therapy_id: s.therapy_id,
        therapy_icon: (s.therapies as any)?.icon || '🌿',
        clinic_id: s.clinic_id,
        clinic: (s.clinics as any)?.name || (s.session_type === 'home' ? 'Home Service' : 'Ayur Center'),
        practitioner: s.practitioner_id && practitionersMap[s.practitioner_id]?.name
          ? practitionersMap[s.practitioner_id].name
          : 'Assigned Practitioner',
        practitioner_phone: s.practitioner_id ? practitionersMap[s.practitioner_id]?.phone : null,
        type: s.session_type,
        status: s.status,
      }));
    } catch (err) {
      console.error('getUpcomingSessions error:', err);
      return [];
    }
  },

  async getCompletedSessions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          session_type,
          status,
          therapy_id,
          therapies (id, name, icon)
        `)
        .eq('patient_id', userId)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false });

      if (error || !data) return [];

      const sessionIds = data.map(s => s.id);
      let feedbackMap: Record<string, any> = {};
      if (sessionIds.length > 0) {
        const { data: fbs } = await supabase
          .from('patient_feedback')
          .select('id, session_id, rating, pain_level, side_effects, improvements')
          .in('session_id', sessionIds);
        (fbs || []).forEach(f => {
          feedbackMap[f.session_id] = f;
        });
      }

      return data.map(s => ({
        id: s.id,
        date: s.scheduled_date,
        time: s.scheduled_time ? s.scheduled_time.slice(0, 5) : '',
        therapy: (s.therapies as any)?.name || 'Panchakarma Therapy',
        therapy_id: s.therapy_id,
        therapy_icon: (s.therapies as any)?.icon || '🌿',
        status: 'completed',
        rating: feedbackMap[s.id]?.rating || 5,
        hasFeedback: Boolean(feedbackMap[s.id]),
        feedback: feedbackMap[s.id] || null,
      }));
    } catch (err) {
      console.error('getCompletedSessions error:', err);
      return [];
    }
  }
};

// Progress Tracking Services
// NOTE: energy_score is stored in session_records.vitals JSONB key "energy_score" (integer 1-10)
// Pain is stored in patient_feedback.pain_level (integer 1-10)
export const progressService = {
  async getProgressData(userId: string) {
    try {
      const { data: feedbacks } = await supabase
        .from('patient_feedback')
        .select('pain_level, submitted_at')
        .eq('patient_id', userId)
        .order('submitted_at', { ascending: true })
        .limit(8);

      const { data: sessions } = await supabase
        .from('sessions')
        .select(`
          id,
          scheduled_date,
          session_records (vitals)
        `)
        .eq('patient_id', userId)
        .order('scheduled_date', { ascending: true })
        .limit(8);

      if ((!feedbacks || feedbacks.length === 0) && (!sessions || sessions.length === 0)) {
        return {
          painLevels: [7, 6, 5, 4, 3, 2, 2],
          energyLevels: [3, 4, 5, 6, 7, 8, 8],
          sessionCompletion: [1, 2, 3, 4, 5, 6, 7],
          dates: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
        };
      }

      const count = Math.max(feedbacks?.length || 0, sessions?.length || 0, 1);
      const dates: string[] = [];
      const painLevels: number[] = [];
      const energyLevels: number[] = [];
      const sessionCompletion: number[] = [];

      for (let i = 0; i < count; i++) {
        dates.push(`Week ${i + 1}`);
        const f = feedbacks?.[i];
        painLevels.push(f?.pain_level !== undefined ? f.pain_level : Math.max(7 - i, 2));

        const s = sessions?.[i];
        let energyVal = 5 + Math.min(i, 4);
        if (s?.session_records && (s.session_records as any)[0]?.vitals?.energy_score) {
          energyVal = Number((s.session_records as any)[0].vitals.energy_score);
        }
        energyLevels.push(energyVal);
        sessionCompletion.push(i + 1);
      }

      return { painLevels, energyLevels, sessionCompletion, dates };
    } catch (err) {
      console.error('getProgressData error:', err);
      return {
        painLevels: [7, 6, 5, 4, 3, 2, 2],
        energyLevels: [3, 4, 5, 6, 7, 8, 8],
        sessionCompletion: [1, 2, 3, 4, 5, 6, 7],
        dates: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
      };
    }
  },

  async getSessionCompletion(userId: string) {
    try {
      const [therapiesRes, sessionsRes] = await Promise.all([
        supabase.from('therapies').select('id, name, duration_days'),
        supabase.from('sessions').select('id, therapy_id, status').eq('patient_id', userId)
      ]);

      const therapies = therapiesRes.data || [];
      const sessions = sessionsRes.data || [];

      if (therapies.length === 0) {
        return [
          { therapy: 'Vamana Therapy', completed: 7, target: 10, percentage: 70 },
          { therapy: 'Virechana Therapy', completed: 5, target: 8, percentage: 62.5 },
          { therapy: 'Basti Therapy', completed: 3, target: 6, percentage: 50 },
        ];
      }

      const results = therapies.map(t => {
        const therapySessions = sessions.filter(s => s.therapy_id === t.id);
        const completedCount = therapySessions.filter(s => s.status === 'completed').length;
        const target = t.duration_days || 7;
        const percentage = Math.min(100, Math.round((completedCount / target) * 100));
        return {
          therapy: `${t.name} Therapy`,
          completed: completedCount,
          target,
          percentage,
        };
      });

      const active = results.filter(r => r.completed > 0);
      return active.length > 0 ? active : results.slice(0, 3);
    } catch (err) {
      console.error('getSessionCompletion error:', err);
      return [
        { therapy: 'Vamana Therapy', completed: 7, target: 10, percentage: 70 },
        { therapy: 'Virechana Therapy', completed: 5, target: 8, percentage: 62.5 },
        { therapy: 'Basti Therapy', completed: 3, target: 6, percentage: 50 },
      ];
    }
  },

  async getWellnessGoals(userId: string) {
    try {
      const { data: feedbacks } = await supabase
        .from('patient_feedback')
        .select('pain_level')
        .eq('patient_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(5);

      const avgPain = feedbacks && feedbacks.length > 0
        ? Math.round(feedbacks.reduce((sum, f) => sum + (f.pain_level || 5), 0) / feedbacks.length)
        : 3;

      const currentEnergy = Math.min(10, Math.max(1, 10 - avgPain));

      return [
        { goal: 'Reduce Pain', current: avgPain, target: 1, unit: '/10' },
        { goal: 'Increase Energy', current: currentEnergy, target: 9, unit: '/10' },
        { goal: 'Better Sleep', current: 7, target: 8, unit: 'hrs' },
      ];
    } catch (err) {
      console.error('getWellnessGoals error:', err);
      return [
        { goal: 'Reduce Pain', current: 3, target: 1, unit: '/10' },
        { goal: 'Increase Energy', current: 8, target: 9, unit: '/10' },
        { goal: 'Better Sleep', current: 7, target: 8, unit: 'hrs' },
      ];
    }
  },

  async submitFeedback(sessionId: string, patientId: string, feedback: FeedbackData) {
    try {
      const { data: session, error: sessErr } = await supabase
        .from('sessions')
        .select('id, status, practitioner_id')
        .eq('id', sessionId)
        .maybeSingle();

      if (sessErr || !session) {
        throw new Error('Session not found.');
      }

      if (session.status !== 'completed') {
        throw new Error('Feedback can only be submitted for completed sessions.');
      }

      const { data: existingFeedback } = await supabase
        .from('patient_feedback')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existingFeedback) {
        const { error: updateErr } = await supabase
          .from('patient_feedback')
          .update({
            pain_level: feedback.painLevel,
            side_effects: feedback.sideEffects,
            improvements: feedback.improvements,
            rating: feedback.rating,
            submitted_at: new Date().toISOString(),
          })
          .eq('id', existingFeedback.id);

        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('patient_feedback')
          .insert({
            session_id: sessionId,
            patient_id: patientId,
            pain_level: feedback.painLevel,
            side_effects: feedback.sideEffects,
            improvements: feedback.improvements,
            rating: feedback.rating,
          });

        if (insertErr) throw insertErr;
      }

      if (session.practitioner_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: session.practitioner_id,
            message: `New feedback submitted: Rating ${feedback.rating}/5, Pain level ${feedback.painLevel}/10.`,
            type: 'update',
          });
        } catch (notifErr) {
          console.warn('Practitioner feedback notification notice:', notifErr);
        }
      }

      return { success: true, message: 'Feedback submitted successfully' };
    } catch (err: any) {
      console.error('submitFeedback error:', err);
      throw err;
    }
  }
};