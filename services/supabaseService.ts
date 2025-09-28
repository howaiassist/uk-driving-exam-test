import { supabase, Question, UserProfile, QuizResult, UserSubscription, SubscriptionInfo } from '@/lib/supabase';
import { Platform } from 'react-native';

// Enhanced error handling for mobile platforms
const handleSupabaseError = (error: any, context: string) => {
  console.error(`${context} error on ${Platform.OS}:`, error);
  
  // For mobile platforms, log but don't throw certain types of errors
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // Still throw authentication and critical errors
    if (error?.message?.includes('Invalid login credentials') || 
        error?.message?.includes('User already registered') ||
        error?.code === 'user_already_exists' ||
        error?.code === 'invalid_credentials') {
      throw error;
    }
    
    // Log other errors but don't throw to prevent crashes
    console.log(`Non-critical error suppressed on mobile for ${context}:`, error?.message || error);
    return null;
  }
  
  // Always throw on web platform
  throw error;
};

export class SupabaseService {
  private static instance: SupabaseService;

  private constructor() {}

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Authentication methods
  async signUp(email: string, password: string, fullName: string, subscriptionType: 'weekly' | 'yearly' = 'weekly') {
    // Check if this is the demo user being created
    if (email === 'test@example.com') {
      // For demo user, try to sign in first in case it already exists
      try {
        console.log('Demo user login attempt on', Platform.OS);
        return await this.signIn(email, password);
      } catch (error) {
        // If sign in fails, continue with sign up
        console.log('Demo user does not exist, creating...', Platform.OS);
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      throw error;
    }

    // Create user profile
    if (data.user) {
      console.log('Creating user profile on', Platform.OS);
      await this.createUserProfile(data.user.id, fullName, email);
      
      // Verify user profile exists before creating subscription
      const profileExists = await this.verifyUserProfileExists(data.user.id);
      if (!profileExists) {
        throw new Error('Failed to verify user profile creation');
      }
      
      // Create subscription based on selected plan
      console.log('Creating subscription:', subscriptionType, 'for user:', data.user.id);
      await this.createUserSubscription(data.user.id, subscriptionType);
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Special handling for demo user - create if doesn't exist
    if (error && error.message.includes('Invalid login credentials') && 
        email === 'test@example.com' && password === 'password') {
      console.log('Demo user does not exist, creating on', Platform.OS);
      try {
        return await this.createDemoUser();
      } catch (createError) {
        console.error('Demo user creation failed on', Platform.OS, ':', createError);
        throw error; // Throw original sign-in error
      }
    }

    if (error) throw error;
    
    // For non-demo users, ensure subscription exists
    if (data.user && data.user.email !== 'test@example.com') {
      let subscription = await this.getUserSubscription(data.user.id);
      
      // If no subscription exists, create a default weekly subscription
      if (!subscription) {
        console.log('No subscription found for user, creating default weekly subscription');
        
        // Verify user profile exists before creating subscription
        const profileExists = await this.verifyUserProfileExists(data.user.id);
        if (!profileExists) {
          throw new Error('User profile not found, cannot create subscription');
        }
        
        await this.createUserSubscription(data.user.id, 'weekly');
        subscription = await this.getUserSubscription(data.user.id);
      }
      
      // Check if subscription type is valid (only weekly or yearly allowed)
      if (subscription && subscription.subscription_type !== 'weekly' && subscription.subscription_type !== 'yearly') {
        throw new Error('invalid_access_plan');
      }
    }
    
    return data;
  }

  // Create demo user for testing
  private async createDemoUser(subscriptionType: 'weekly' | 'yearly' = 'weekly') {
    console.log('Creating demo user on', Platform.OS);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'password',
      });

      if (error) {
        console.error('Demo user signup error on', Platform.OS, ':', error);
        throw error;
      }

      // Create user profile for demo user
      if (data.user) {
        console.log('Creating demo user profile on', Platform.OS);
        await this.createUserProfile(data.user.id, 'Demo User', 'test@example.com');
        
        // Verify user profile exists before creating subscription
        const profileExists = await this.verifyUserProfileExists(data.user.id);
        if (!profileExists) {
          throw new Error('Failed to verify demo user profile creation');
        }
        
        // Create special never-expiring subscription for demo user
        await this.createDemoUserSubscription(data.user.id);
      }

      // Now sign in the newly created demo user
      console.log('Signing in newly created demo user on', Platform.OS);
      const signInResult = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password',
      });

      if (signInResult.error) {
        console.error('Demo user sign in after creation failed on', Platform.OS, ':', signInResult.error);
        throw signInResult.error;
      }

      return signInResult;
    } catch (error) {
      console.error('Complete demo user creation process failed on', Platform.OS, ':', error);
      throw error;
    }
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // User profile methods
  async createUserProfile(userId: string, fullName: string, email: string) {
    console.log('Creating user profile for', userId, 'on', Platform.OS);
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        full_name: fullName,
        email: email,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Helper method to verify user profile exists with retry mechanism
  async verifyUserProfileExists(userId: string, maxRetries: number = 5): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const profile = await this.getUserProfile(userId);
        if (profile) {
          console.log(`User profile verified on attempt ${attempt}`);
          return true;
        }
      } catch (error) {
        console.log(`Profile verification attempt ${attempt} failed:`, error);
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 100; // 100ms, 200ms, 400ms, 800ms
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    console.log('User profile updated successfully:', data);
    return data;
  }

  // Questions methods
  async getRandomQuestions(count: number = 20): Promise<Question[]> {
    try {
      console.log(`Fetching ${count} random questions from Supabase...`);
      
      // Use PostgreSQL's RANDOM() function for true randomization
      const { data, error } = await supabase
        .rpc('get_random_questions', { question_count: count });

      if (error) {
        console.error('Error fetching random questions:', error);
        // Fallback to regular query with client-side randomization
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('questions')
          .select('*');
        
        if (fallbackError) throw fallbackError;
        
        // Shuffle array and take requested count
        const shuffled = (fallbackData || []).sort(() => Math.random() - 0.5);
        const randomQuestions = shuffled.slice(0, count);
        console.log(`Fallback: Loaded ${randomQuestions.length} random questions`);
        return randomQuestions;
      }

      console.log(`Successfully loaded ${(data || []).length} random questions from RPC`);
      return data || [];
    } catch (error) {
      console.error('Failed to get random questions:', error);
      return handleSupabaseError(error, 'Get Random Questions') || [];
    }
  }

  async getQuestionById(id: number): Promise<Question | null> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      return handleSupabaseError(error, 'Get Question By ID');
    }
    return data;
  }

  async getAllQuestions(): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('id');

    if (error) {
      const result = handleSupabaseError(error, 'Get All Questions');
      return result || [];
    }
    return data || [];
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category', category)
      .order('id');

    if (error) {
      const result = handleSupabaseError(error, 'Get Questions By Category');
      return result || [];
    }
    return data || [];
  }

  // Quiz results methods
  async saveQuizResult(result: Omit<QuizResult, 'id' | 'created_at'>) {
    // Skip saving for demo users
    if (result.user_id && await this.isDemoUser(result.user_id)) {
      console.log('Demo user - quiz result not saved to database');
      return null;
    }
    
    const { data, error } = await supabase
      .from('quiz_results')
      .insert(result)
      .select()
      .single();

    if (error) {
      return handleSupabaseError(error, 'Save Quiz Result');
    }
    return data;
  }

  // Helper method to check if user is demo user
  private async isDemoUser(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.email === 'test@example.com';
    } catch (error) {
      return false;
    }
  }

  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      const result = handleSupabaseError(error, 'Get User Quiz Results');
      return result || [];
    }
    return data || [];
  }

  async getUserStats(userId: string) {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('score, total_questions, passed')
      .eq('user_id', userId);

    if (error) {
      handleSupabaseError(error, 'Get User Stats');
      return {
        totalTests: 0,
        passedTests: 0,
        averageScore: 0,
        passRate: 0,
      };
    }

    const results = data || [];
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalQuestions = results.reduce((sum, r) => sum + r.total_questions, 0);
    
    return {
      totalTests,
      passedTests,
      averageScore: totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0,
      passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
    };
  }

  // Subscription methods
  async createUserSubscription(userId: string, subscriptionType: 'weekly' | 'yearly') {
    console.log(`Creating ${subscriptionType} subscription for user ${userId}`);
    const endDate = new Date();
    if (subscriptionType === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
      console.log(`7-day subscription expires on: ${endDate.toISOString()}`);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
      console.log(`12-month subscription expires on: ${endDate.toISOString()}`);
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        subscription_type: subscriptionType,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    console.log('Subscription created successfully:', data);
    return data;
  }

  async createDemoUserSubscription(userId: string) {
    console.log(`Creating never-expiring demo subscription for user ${userId}`);
    // Set end date to 100 years in the future for demo account
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 100);
    console.log(`Demo subscription expires on: ${endDate.toISOString()}`);

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        subscription_type: 'weekly', // Use weekly type but with extended date
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    console.log('Demo subscription created successfully:', data);
    return data;
  }

  async getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
    const { data, error } = await supabase
      .rpc('get_user_subscription', { user_uuid: userId })
    if (error) {
      handleSupabaseError(error, 'Get User Subscription');
      return null;
    }
    return data && data.length > 0 ? data[0] : null;
  }

  async isSubscriptionActive(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('is_subscription_active', { user_uuid: userId })
      .single();
    if (error) {
      handleSupabaseError(error, 'Check Subscription Active');
      return false;
    }
    return data || false;
  }

  async updateSubscriptionType(userId: string, subscriptionType: 'weekly' | 'yearly') {
    // Deactivate current subscription
    await supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Create new subscription
    return this.createUserSubscription(userId, subscriptionType);
  }
}