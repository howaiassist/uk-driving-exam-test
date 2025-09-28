import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { SupabaseService } from '@/services/supabaseService';
import { PaymentService } from '@/services/paymentService';
import { UserProfile, SubscriptionInfo } from '@/lib/supabase';

// Enhanced error handling for mobile platforms
const handleError = (error: any, context: string) => {
  console.error(`${context} error on ${Platform.OS}:`, error);
  
  // Suppress error propagation on mobile devices for better UX
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    console.log(`Error suppressed on mobile for ${context}`);
    return;
  }
  
  // Only throw errors on web platform
  throw error;
};

interface UserContextType {
  name: string;
  email: string;
  userId: string | null;
  isAuthenticated: boolean;
  subscription: SubscriptionInfo | null;
  isSubscriptionActive: boolean;
  isDemoUser: boolean;
  statsRefreshTrigger: number;
  updateName: (newName: string) => void;
  login: (email: string, password: string, expectedPlanType?: 'weekly' | 'yearly') => Promise<void>;
  login: (email: string, password: string, expectedPlanType?: 'weekly' | 'yearly') => Promise<void>;
  signup: (email: string, password: string, fullName: string, subscriptionType?: 'weekly' | 'yearly') => Promise<void>;
  logout: () => Promise<void>;
  loadUserProfile: () => Promise<void>;
  updateSubscriptionType: (subscriptionType: 'weekly' | 'yearly') => Promise<void>;
  refreshStats: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);

  const supabaseService = SupabaseService.getInstance();
  const paymentService = PaymentService.getInstance();

  const login = useCallback(async (email: string, password: string, expectedPlanType?: 'weekly' | 'yearly') => {
    try {
      console.log('Attempting login...', Platform.OS);
      const { user } = await supabaseService.signIn(email, password);
      if (user) {
        setUserId(user.id);
        setEmail(user.email || '');
        setIsDemoUser(user.email === 'test@example.com');
        setIsAuthenticated(true);
        
        // Load user profile and subscription data
        await loadUserProfile();
        await loadSubscription();
        
        // For demo users, ensure subscription is active
        if (user.email === 'test@example.com') {
          setIsSubscriptionActive(true);
        } else if (expectedPlanType) {
          // Check if the user's subscription matches the expected plan type
          const subscriptionInfo = await supabaseService.getUserSubscription(user.id);
          if (subscriptionInfo && subscriptionInfo.subscription_type !== expectedPlanType) {
            throw new Error('incorrect_plan_access');
          }
        }
        
        console.log('Login successful on', Platform.OS);
      }
    } catch (error) {
      // Reset authentication state on login failure
      setIsAuthenticated(false);
      setUserId(null);
      setEmail('');
      setName('');
      setIsDemoUser(false);
      setSubscription(null);
      setIsSubscriptionActive(false);
      
      console.error('Login error on', Platform.OS, ':', error);
      
      // Always throw login errors so they can be handled properly in the UI
      throw error;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName: string, subscriptionType: 'weekly' | 'yearly' = 'weekly') => {
    try {
      console.log('Attempting signup...', Platform.OS);
      
      // Process payment for yearly subscriptions
      if (subscriptionType === 'yearly') {
        console.log('Processing payment for yearly subscription...');
        const paymentResult = await paymentService.processPayment('yearly');
        
        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Payment failed');
        }
        
        console.log('Payment successful:', paymentResult.transactionId);
      }
      
      const { user } = await supabaseService.signUp(email, password, fullName, subscriptionType);
      if (user) {
        setUserId(user.id);
        setEmail(user.email || '');
        setName(fullName);
        setIsDemoUser(user.email === 'test@example.com');
        setIsAuthenticated(true);
        
        // Load subscription after user creation (subscription is created in signUp)
        await loadSubscription();
        
        // For demo users, ensure subscription is active
        if (user.email === 'test@example.com') {
          setIsSubscriptionActive(true);
        }
        
        console.log('Signup successful on', Platform.OS);
      }
    } catch (error) {
      console.error('Signup error on', Platform.OS, ':', error);
      
      // Always throw signup errors so they can be handled properly in the UI
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabaseService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always reset state even if logout fails
      setUserId(null);
      setEmail('');
      setName('');
      setIsDemoUser(false);
      setIsAuthenticated(false);
      setSubscription(null);
      setIsSubscriptionActive(false);
    }
  }, []);

  const loadUserProfile = useCallback(async () => {
    const currentUserId = userId || (await supabaseService.getCurrentUser())?.id;
    if (!currentUserId) return;
    
    try {
      const profile = await supabaseService.getUserProfile(currentUserId);
      if (profile) {
        setName(profile.full_name || '');
        setEmail(profile.email || '');
        setUserId(currentUserId);
        setIsAuthenticated(true);
      }
    } catch (error) {
      handleError(error, 'Load User Profile');
    }
  }
  )

  const loadSubscription = useCallback(async () => {
    const currentUserId = userId || (await supabaseService.getCurrentUser())?.id;
    if (!currentUserId) return;
    
    try {
      console.log('Loading subscription for user:', currentUserId);
      const subscriptionInfo = await supabaseService.getUserSubscription(currentUserId);
      const isActive = await supabaseService.isSubscriptionActive(currentUserId);
      
      console.log('Loaded subscription info:', subscriptionInfo);
      console.log('Subscription type from DB:', subscriptionInfo?.subscription_type);
      console.log('Is subscription active:', isActive);
      
      setSubscription(subscriptionInfo);
      setIsSubscriptionActive(isActive);
      
      // For demo users or test email, always set subscription as active
      if (isDemoUser || email === 'test@example.com') {
        setIsSubscriptionActive(true);
      }
    } catch (error) {
      handleError(error, 'Load Subscription');
      // For demo users or test email, set as active even if there's an error
      if (isDemoUser || email === 'test@example.com') {
        setIsSubscriptionActive(true);
      }
    }
  }, [userId, isDemoUser, email]);
  
  const updateName = useCallback(async (newName: string) => {
    if (!userId) return;
    
    try {
      await supabaseService.updateUserProfile(userId, { full_name: newName });
      setName(newName);
      // Force reload of user profile to ensure consistency
      await loadUserProfile();
    } catch (error) {
      handleError(error, 'Update Name');
      
      // Only throw on web platform
      if (Platform.OS === 'web') {
        throw error;
      }
    }
  }, [userId]);

  const updateSubscriptionType = useCallback(async (subscriptionType: 'weekly' | 'yearly') => {
    const currentUserId = userId || (await supabaseService.getCurrentUser())?.id;
    if (!currentUserId) return;
    
    try {
      await supabaseService.updateSubscriptionType(currentUserId, subscriptionType);
      await loadSubscription();
    } catch (error) {
      handleError(error, 'Update Subscription');
      
      // Only throw on web platform
      if (Platform.OS === 'web') {
        throw error;
      }
    }
  }, [userId, loadSubscription]);

  const refreshStats = useCallback(() => {
    console.log('Stats refresh triggered');
    setStatsRefreshTrigger(prev => prev + 1);
  }, []);

  // Initialize user session on app start
  React.useEffect(() => {
    const initializeSession = async () => {
      try {
        const user = await supabaseService.getCurrentUser();
        if (user) {
          setUserId(user.id);
          setEmail(user.email || '');
          setIsDemoUser(user.email === 'test@example.com');
          setIsAuthenticated(true);
          
          await loadUserProfile();
          await loadSubscription();
        }
      } catch (error) {
       handleError(error, 'Initialize Session');
      }
    };

    initializeSession();
  }, []);

  return (
    <UserContext.Provider value={{ 
      name, 
      email, 
      userId, 
      isAuthenticated, 
      subscription,
      isSubscriptionActive,
      isDemoUser,
      statsRefreshTrigger,
      updateName, 
      login, 
      signup, 
      logout, 
      loadUserProfile,
      updateSubscriptionType,
      refreshStats
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}