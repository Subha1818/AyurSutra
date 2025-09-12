// API Integration Layer for Panchakarma Platform
// All API endpoints and services with placeholder comments

// Authentication API Configuration
export const authConfig = {
  baseUrl: 'https://your-auth-api.com', // /* INSERT YOUR AUTH API ENDPOINT HERE */
  apiKey: 'your-api-key', // /* INSERT YOUR AUTH API KEY HERE */
};

// OTP Service Configuration
export const otpConfig = {
  apiKey: 'your-otp-api-key', // /* INSERT YOUR OTP API KEY HERE */
  endpoint: 'https://your-otp-service.com', // /* INSERT YOUR OTP SERVICE ENDPOINT HERE */
};

// Location/Maps API Configuration
export const locationConfig = {
  apiKey: 'your-google-maps-key', // /* INSERT YOUR LOCATION API KEY HERE */
  endpoint: 'https://maps.googleapis.com/maps/api',
};

// AI Services Configuration
export const aiConfig = {
  apiKey: 'AIzaSyCcx6c0d0x7V5YLlwDuyQ2lDExNMFWOIm4', // Gemini API key
  endpoint: 'https://api.gemini.google/v1', // Gemini API base
  model: 'gemini-2.5-flask', // Example Gemini text model
};

// Type definitions
interface Therapy {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface Clinic {
  id: number;
  name: string;
  location: string;
  rating: number;
  distance: string;
}

interface Testimonial {
  id: number;
  name: string;
  text: string;
  rating: number;
}

interface LoginCredentials {
  email: string;
  password: string;
  role: string;
}

interface UserData {
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

interface BookingData {
  clinicId?: number;
  therapy: string;
  type: 'clinic' | 'home';
  date: string;
  time: string;
}

interface FeedbackData {
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
    { id: 1, name: 'Ayur Wellness Center', location: 'Downtown', rating: 4.8, distance: '2.3 km' },
    { id: 2, name: 'Panchakarma Healing', location: 'Midtown', rating: 4.6, distance: '3.1 km' },
    { id: 3, name: 'Holistic Health Hub', location: 'Uptown', rating: 4.9, distance: '4.2 km' },
  ] as Clinic[],
  testimonials: [
    { id: 1, name: 'Sarah Johnson', text: 'Panchakarma therapy transformed my health completely!', rating: 5 },
    { id: 2, name: 'Michael Chen', text: 'Professional care and amazing results.', rating: 5 },
    { id: 3, name: 'Priya Sharma', text: 'Best decision for my wellness journey.', rating: 5 },
  ] as Testimonial[],
};

// Authentication Services
export const authService = {
  async login(credentials: LoginCredentials) {
    // /* IMPLEMENT YOUR LOGIN API CALL HERE */
    console.log('Login API call with:', credentials);
    return { success: true, token: 'mock-token', user: { id: 1, role: credentials.role } };
  },

  async register(userData: Partial<UserData>) {
    // /* IMPLEMENT YOUR REGISTRATION API CALL HERE */
    console.log('Registration API call with:', userData);
    return { success: true, message: 'Registration successful' };
  },

  async sendOTP(phone: string) {
    // /* IMPLEMENT YOUR OTP API CALL HERE */
    console.log('Sending OTP to:', phone);
    return { success: true, message: 'OTP sent successfully' };
  },

  async verifyOTP(phone: string, otp: string) {
    // /* IMPLEMENT YOUR OTP VERIFICATION HERE */
    console.log('Verifying OTP:', { phone, otp });
    return { success: true, message: 'OTP verified' };
  },
};

// Location Services
export const locationService = {
  async getNearbyClinicss(lat: number, lng: number): Promise<Clinic[]> {
    // /* IMPLEMENT YOUR LOCATION API CALL HERE */
    console.log('Fetching nearby clinics for:', { lat, lng });
    return mockResponses.clinics;
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

// AI Services
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

      // Map Gemini response to your Therapy type (basic parsing)
      const suggestions = mockResponses.therapies.filter(therapy =>
        suggestionsText.toLowerCase().includes(therapy.name.toLowerCase())
      );

      return suggestions.length > 0 ? suggestions : [mockResponses.therapies[0]];
    } catch (err) {
      console.error('Gemini therapy suggestions error:', err);
      return [mockResponses.therapies[0]];
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


// Booking Services
export const bookingService = {
  async bookSession(bookingData: BookingData) {
    // /* IMPLEMENT YOUR BOOKING API CALL HERE */
    console.log('Booking session:', bookingData);
    return { success: true, bookingId: 'BK' + Date.now() };
  },

  async getAvailableSlots(clinicId: number, date: string): Promise<string[]> {
    // /* IMPLEMENT YOUR AVAILABILITY API CALL HERE */
    console.log('Fetching available slots for:', { clinicId, date });
    return ['09:00', '10:30', '14:00', '15:30', '17:00'];
  },

  async rescheduleSession(sessionId: string, newDate: string, newTime: string) {
    // /* IMPLEMENT YOUR RESCHEDULE API CALL HERE */
    console.log('Rescheduling session:', { sessionId, newDate, newTime });
    return { success: true, message: 'Session rescheduled successfully' };
  },
};

// Notification Services
export const notificationService = {
  async sendNotification(userId: string, message: string, type: 'reminder' | 'update' | 'alert') {
    // /* IMPLEMENT YOUR NOTIFICATION API CALL HERE */
    console.log('Sending notification:', { userId, message, type });
    return { success: true };
  },

  async getNotifications(userId: string) {
    // /* IMPLEMENT YOUR GET NOTIFICATIONS API CALL HERE */
    console.log('Fetching notifications for user:', userId);
    return [
      { id: 1, message: 'Session reminder: Tomorrow at 10:00 AM', type: 'reminder', read: false },
      { id: 2, message: 'Your session feedback is pending', type: 'update', read: false },
    ];
  },
};

// Progress Tracking Services
export const progressService = {
  async getProgressData(userId: string) {
    // /* IMPLEMENT YOUR PROGRESS DATA API CALL HERE */
    console.log('Fetching progress data for user:', userId);
    return {
      painLevels: [7, 6, 5, 4, 3, 2, 2],
      energyLevels: [3, 4, 5, 6, 7, 8, 8],
      sessionCompletion: [1, 2, 3, 4, 5, 6, 7],
      dates: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
    };
  },

  async submitFeedback(sessionId: string, feedback: FeedbackData) {
    // /* IMPLEMENT YOUR FEEDBACK SUBMISSION API HERE */
    console.log('Submitting feedback:', { sessionId, feedback });
    return { success: true };
  },
};