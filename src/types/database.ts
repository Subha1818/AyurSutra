export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'patient' | 'practitioner' | 'receptionist' | 'admin';
export type SessionType = 'clinic' | 'home';
export type SessionStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'rescheduled';
export type NotificationType = 'reminder' | 'update' | 'alert';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          role: UserRole;
          specialization: string | null;
          clinic_code: string | null;
          id_document_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          phone?: string | null;
          role?: UserRole;
          specialization?: string | null;
          clinic_code?: string | null;
          id_document_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          role?: UserRole;
          specialization?: string | null;
          clinic_code?: string | null;
          id_document_url?: string | null;
          created_at?: string;
        };
      };
      clinics: {
        Row: {
          id: number;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          rating: number;
          clinic_code: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          rating?: number;
          clinic_code: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          rating?: number;
          clinic_code?: string;
          created_at?: string;
        };
      };
      therapies: {
        Row: {
          id: number;
          name: string;
          description: string;
          dosha_target: string;
          duration_days: number;
          icon: string;
        };
        Insert: {
          id?: number;
          name: string;
          description: string;
          dosha_target: string;
          duration_days: number;
          icon: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string;
          dosha_target?: string;
          duration_days?: number;
          icon?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          patient_id: string;
          practitioner_id: string | null;
          clinic_id: number | null;
          therapy_id: number;
          session_type: SessionType;
          status: SessionStatus;
          scheduled_date: string;
          scheduled_time: string;
          room: string | null;
          duration_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          practitioner_id?: string | null;
          clinic_id?: number | null;
          therapy_id: number;
          session_type?: SessionType;
          status?: SessionStatus;
          scheduled_date: string;
          scheduled_time: string;
          room?: string | null;
          duration_seconds?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          practitioner_id?: string | null;
          clinic_id?: number | null;
          therapy_id?: number;
          session_type?: SessionType;
          status?: SessionStatus;
          scheduled_date?: string;
          scheduled_time?: string;
          room?: string | null;
          duration_seconds?: number;
          created_at?: string;
        };
      };
      session_records: {
        Row: {
          id: string;
          session_id: string;
          vitals: Json;
          checklist_completed: Json;
          notes: string | null;
          ai_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          vitals?: Json;
          checklist_completed?: Json;
          notes?: string | null;
          ai_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          vitals?: Json;
          checklist_completed?: Json;
          notes?: string | null;
          ai_summary?: string | null;
          created_at?: string;
        };
      };
      patient_feedback: {
        Row: {
          id: string;
          session_id: string;
          patient_id: string;
          pain_level: number;
          side_effects: string | null;
          improvements: string | null;
          rating: number;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          patient_id: string;
          pain_level: number;
          side_effects?: string | null;
          improvements?: string | null;
          rating: number;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          patient_id?: string;
          pain_level?: number;
          side_effects?: string | null;
          improvements?: string | null;
          rating?: number;
          submitted_at?: string;
        };
      };
      notifications: {
        Row: {
          id: number;
          user_id: string;
          message: string;
          type: NotificationType;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          message: string;
          type?: NotificationType;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          message?: string;
          type?: NotificationType;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      session_type_enum: SessionType;
      session_status_enum: SessionStatus;
      notification_type_enum: NotificationType;
    };
  };
}
