import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';

// Robust alert helper that works across platforms and respects mobile error suppression
const showAlert = async (title: string, message: string, buttons?: Array<{text: string, onPress?: () => void}>) => {
  // Suppress error alerts on mobile devices
  if ((Platform.OS === 'ios' || Platform.OS === 'android') && title.toLowerCase().includes('error')) {
    console.log('Error alert suppressed on mobile:', title, message);
    return;
  }
  
  try {
    const { Alert } = await import('react-native');
    Alert.alert(title, message, buttons);
  } catch (error) {
    console.error('Alert not available:', error);
    // Fallback for web or other platforms where Alert might not work
    if (typeof window !== 'undefined' && Platform.OS === 'web') {
      const result = window.confirm(`${title}\n\n${message}`);
      if (buttons && buttons.length > 0 && buttons[0].onPress && result) {
        buttons[0].onPress();
      }
    }
  }
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState<'weekly' | 'yearly' | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isDemoLogin, setIsDemoLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, signup } = useUser();

  const switchToNormalLogin = () => {
    setEmail('');
    setPassword('');
    setIsDemoLogin(false);
    setIsLogin(true);
  };

  const handleAuth = async () => {
    if (!subscriptionType && email !== 'test@example.com') {
      showAlert('Selection Required', 'Please select an access plan first');
      return;
    }
    
    if (!email || !password) {
      showAlert('Input Required', 'Please enter email and password');
      return;
    }

    if (!isLogin && !fullName) {
      showAlert('Input Required', 'Please enter your full name');
      return;
    }

    // Validate password requirements for signup
    if (!isLogin) {
      if (password.length < 8) {
        showAlert('Password Requirements', 'Password must be at least 8 characters long with at least one special character (!@#$%^&*)');
        return;
      }

      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
      if (!specialCharRegex.test(password)) {
        showAlert('Password Requirements', 'Password must contain at least one special character (!@#$%^&*)');
        return;
      }
    }
    setLoading(true);
    try {
      console.log('Auth attempt on', Platform.OS);
      
      if (isLogin) {
        await login(email, password, email === 'test@example.com' ? 'weekly' : subscriptionType);
      } else {
        await signup(email, password, fullName, email === 'test@example.com' ? 'weekly' : subscriptionType);
      }
      
      // Small delay to ensure subscription data is loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Authentication successful, navigating to tabs');
      router.push('/(tabs)');
    } catch (error) {
      console.log('Authentication error caught:', error);
      let errorMessage = 'Authentication failed. Please try again.';
      
      // Parse Supabase error response
      let errorCode = null;
      let errorMsg = null;
      
      if (error && typeof error === 'object') {
        // Check for direct error properties
        errorCode = error.code;
        errorMsg = error.message;
        
        // If no direct properties, try to parse from error string
        if (!errorCode && error.message && typeof error.message === 'string') {
          try {
            // Look for JSON in error message
            const jsonMatch = error.message.match(/\{.*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              errorCode = parsed.code;
              errorMsg = parsed.message;
            }
          } catch (parseError) {
            // If parsing fails, use the original message
            errorMsg = error.message;
          }
        }
      }
      
      if (errorCode === 'user_already_exists' || 
          errorMsg?.includes('User already registered') || 
          errorMsg?.includes('user_already_exists')) {
        showAlert('Registration Error', 'This email is already registered. Please login instead.');
        setIsLogin(true);
        return;
      } else if (errorCode === 'invalid_credentials' || 
                 errorMsg?.includes('Invalid login credentials') || 
                 errorMsg?.includes('invalid_credentials')) {
        if (isLogin) {
          // Only show login error on web platform
          if (Platform.OS === 'web') {
            showAlert('Login Error', 'Invalid email or password');
          } else {
            console.log('Login error suppressed on mobile:', errorMsg);
          }
        }
      } else if (errorMsg === 'incorrect_plan_access') {
        if (Platform.OS === 'web') {
          showAlert('Wrong Access Plan', `This account has a different access plan. Please select the correct plan and try again.`);
        } else {
          console.log('Plan access error suppressed on mobile');
        }
        return;
      } else if (errorMsg === 'no_subscription') {
        if (Platform.OS === 'web') {
          showAlert('Access Denied', 'No valid subscription found for this account');
        } else {
          console.log('Subscription error suppressed on mobile');
        }
        return;
      } else if (errorMsg === 'invalid_access_plan') {
        if (Platform.OS === 'web') {
          showAlert('Invalid Access Plan', 'This account does not have a valid access plan. Only 7-Day and 12-Month plans are supported.');
        } else {
          console.log('Invalid access plan error suppressed on mobile');
        }
        return;
      } else if (errorMsg === 'subscription_expired') {
        if (Platform.OS === 'web') {
          showAlert('Subscription Expired', 'Your subscription has expired. Please renew to continue.');
        } else {
          console.log('Subscription expired error suppressed on mobile');
        }
        return;
      } else {
        // Only show generic errors on web
        if (Platform.OS === 'web') {
          if (errorMsg) {
            errorMessage = errorMsg;
          }
          showAlert('Authentication Failed', errorMessage);
        } else {
          console.log('Generic auth error suppressed on mobile:', errorMsg || error);
        }
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('test@example.com');
    setPassword('password');
    setIsLogin(true);
    setIsDemoLogin(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={subscriptionType === 'weekly' ? ['#7C3AED', '#A855F7'] : 
                subscriptionType === 'yearly' ? ['#059669', '#10B981'] : 
                ['#1D4ED8', '#3B82F6']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>UK Driving Exam Preparation</Text>
              {email !== 'test@example.com' && !isDemoLogin && (
                <>
                  <Text style={styles.sectionTitle}>1. Choose Access Plan</Text>
                  
                  <View style={styles.planContainer}>
                    <TouchableOpacity
                      style={[
                        styles.planOption,
                        subscriptionType === 'weekly' && styles.selectedPlan,
                        isDemoLogin && styles.blurredPlan
                      ]}
                      onPress={() => setSubscriptionType('weekly')}
                      disabled={isDemoLogin}
                    >
                      <View style={styles.planHeader}>
                        <View style={[
                          styles.radioButton,
                          subscriptionType === 'weekly' && styles.radioButtonSelected
                        ]}>
                          {subscriptionType === 'weekly' && <View style={styles.radioButtonInner} />}
                        </View>
                        <Text style={[
                          styles.planName,
                          subscriptionType === 'weekly' && styles.selectedPlanText
                        ]}>
                          7-Day Access
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.planOption,
                        subscriptionType === 'yearly' && styles.selectedPlan,
                        isDemoLogin && styles.blurredPlan
                      ]}
                      onPress={() => setSubscriptionType('yearly')}
                      disabled={isDemoLogin}
                    >
                      <View style={styles.planHeader}>
                        <View style={[
                          styles.radioButton,
                          subscriptionType === 'yearly' && styles.radioButtonSelected
                        ]}>
                          {subscriptionType === 'yearly' && <View style={styles.radioButtonInner} />}
                        </View>
                        <Text style={[
                          styles.planName,
                          subscriptionType === 'yearly' && styles.selectedPlanText
                        ]}>
                          12-Month Access
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              
              {isDemoLogin && (
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={switchToNormalLogin}
                >
                  <Text style={styles.switchButtonText}>Switch to Normal Login</Text>
                </TouchableOpacity>
              )}
              
              <Text style={styles.sectionTitle}>
                {email !== 'test@example.com' && !isDemoLogin ? '2. Account Details' : 'Account Details'}
              </Text>
              
              {/* Payment Integration Notice for 12-Month Plan */}
              {!isDemoLogin && subscriptionType === 'yearly' && (
                <View style={styles.paymentNotice}>
                  <Text style={styles.paymentNoticeTitle}>💳 Payment Required</Text>
                  <Text style={styles.paymentNoticeText}>
                    12-Month access requires payment via {Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'}
                  </Text>
                  <Text style={styles.paymentNoticeSubtext}>
                    Payment will be processed after account creation
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.form}>
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    textContentType="name"
                  />
                </View>
              )}

              <View style={styles.authToggle}>
                <TouchableOpacity
                  style={[styles.toggleButton, isLogin && styles.activeToggle]}
                  onPress={() => setIsLogin(true)}
                >
                  <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>
                    Login
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                  onPress={() => setIsLogin(false)}
                >
                  <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    textContentType={isLogin ? "password" : "newPassword"}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#6B7280" />
                    ) : (
                      <Eye size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleAuth}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
                </Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>3. Demo Account</Text>
              <View style={styles.demoCredentials}>
                <Text style={styles.demoTitle}>Try Demo (Limited Access):</Text>
                <Text style={styles.demoText}>Email: test@example.com</Text>
                <Text style={styles.demoText}>Password: password</Text>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={fillDemoCredentials}
                >
                  <Text style={styles.demoButtonText}>Use Demo</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.appName}>UK Driving Exam Preparation</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
    marginBottom: 12,
  },
  planContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planOption: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    flex: 0.48,
    backgroundColor: '#F9FAFB',
  },
  selectedPlan: {
    borderColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#1D4ED8',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1D4ED8',
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedPlanText: {
    color: '#1D4ED8',
  },
  authToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#1D4ED8',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeToggleText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  eyeButton: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  submitButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  demoCredentials: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  demoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  demoButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 6,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  paymentNoticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  paymentNoticeText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 2,
  },
  paymentNoticeSubtext: {
    fontSize: 11,
    color: '#A16207',
    fontStyle: 'italic',
  },
  switchButton: {
    backgroundColor: '#6B7280',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  blurredPlan: {
    opacity: 0.3,
  },
});