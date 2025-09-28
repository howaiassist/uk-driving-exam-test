import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Fallback values for development
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

console.log('Supabase initialization on', Platform.OS, {
  hasUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  url: supabaseUrl.substring(0, 20) + '...'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    storage: Platform.OS === 'web' ? undefined : undefined,
    storageKey: 'sb-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': `expo-${Platform.OS}`,
    },
  },
});

// Database types
export interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  category?: string;
  difficulty?: string;
  question_image_url?: string;
  option_images?: string[];
  has_images?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  duration_seconds?: number;
  answers?: number[];
  question_ids?: number[];
  created_at?: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_type: 'weekly' | 'yearly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at?: string;
}

export interface SubscriptionInfo {
  subscription_type: 'weekly' | 'yearly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  days_remaining: number;
}