import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, LogOut, BookOpen, Trophy, Settings, CircleHelp as HelpCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { SupabaseService } from '@/services/supabaseService';

export default function ProfileScreen() {
  const { name, email, logout, subscription, isSubscriptionActive, isDemoUser, userId, isAuthenticated, statsRefreshTrigger } = useUser();
  const [stats, setStats] = useState({
    totalTests: 0,
    passedTests: 0,
    averageScore: 0,
    passRate: 0
  });
  const [loading, setLoading] = useState(true);

  const supabaseService = SupabaseService.getInstance();

  // Load user statistics
  useEffect(() => {
    if (userId && isAuthenticated) {
      console.log('Loading user stats due to trigger change:', statsRefreshTrigger);
      loadUserStats();
    }
  }, [userId, isAuthenticated, statsRefreshTrigger]);

  // Refresh stats periodically and when trigger changes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (userId && isAuthenticated) {
        loadUserStats();
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [userId, isAuthenticated]);

  const loadUserStats = async () => {
    if (!userId || !isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const userStats = await supabaseService.getUserStats(userId);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
      setStats({
        totalTests: 0,
        passedTests: 0,
        averageScore: 0,
        passRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Get gradient colors based on subscription type
  const getGradientColors = () => {
    if (isDemoUser) {
      return ['#1D4ED8', '#3B82F6']; // Blue for demo
    } else if (subscription && subscription.subscription_type === 'weekly') {
      return ['#7C3AED', '#A855F7']; // Purple for 7-day
    } else if (subscription && subscription.subscription_type === 'yearly') {
      return ['#059669', '#10B981']; // Green for 12-month
    }
    return ['#1D4ED8', '#3B82F6']; // Default blue
  };

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    // Suppress error alerts on mobile devices
    if ((Platform.OS === 'ios' || Platform.OS === 'android') && title.toLowerCase().includes('error')) {
      console.log('Error alert suppressed on mobile:', title, message);
      return;
    }
    
    try {
      const { Alert } = require('react-native');
      Alert.alert(title, message, buttons);
    } catch (error) {
      console.log('Alert error:', error);
    }
  };

  const handleLogout = () => {
    try {
      const { Alert } = require('react-native');
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            onPress: async () => {
              try {
                await logout();
                router.replace('/login');
              } catch (error) {
                console.error('Logout error:', error);
                router.replace('/login'); // Force logout even if there's an error
              }
            }
          },
        ]
      );
    } catch (error) {
      console.log('Alert error, proceeding with logout:', error);
      // If Alert fails, just logout directly
      logout().then(() => {
        router.replace('/login');
      }).catch((error) => {
        console.error('Direct logout error:', error);
        router.replace('/login');
      });
    }
  };

  const handleMenuPress = (action: string) => {
    if (action === 'Help & Support') {
      showAlert(
        'Help & Support', 
        'For technical support and assistance, please contact us at:\n\nsupport@examquizfamily.com\n\nWe typically respond within 24 hours.',
        [{ text: 'OK' }]
      );
    } else {
      showAlert('Feature Coming Soon', `${action} feature will be available in a future update.`);
    }
  };

  const handleSettingsPress = () => {
    try {
      if (router && router.push) {
        router.push('/settings');
      }
    } catch (error) {
      console.log('Navigation error:', error);
      showAlert('Navigation Failed', 'Unable to open settings. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getSubscriptionStatusColor = () => {
    if (!subscription) return '#6B7280';
    return isSubscriptionActive ? '#059669' : '#DC2626';
  };

  const getSubscriptionStatusText = () => {
    if (!subscription) return 'No subscription';
    if (!isSubscriptionActive) return 'Expired';
    return `${subscription.days_remaining} days remaining`;
  };

  const safeHandlePress = (handler: () => void) => {
    try {
      handler();
    } catch (error) {
      console.log('Handler error:', error);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.header}
      >
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <User size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>{name || 'User'}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
        
        {subscription && (
          <View style={styles.subscriptionBadge}>
            <Text style={styles.subscriptionType}>
              {subscription.subscription_type === 'weekly' ? '1 Week Access' : '12 Months Access'}
            </Text>
            <Text style={[styles.subscriptionStatus, { color: getSubscriptionStatusColor() }]}>
              {getSubscriptionStatusText()}
            </Text>
          </View>
        )}
        {isDemoUser && (
          <View style={styles.subscriptionBadge}>
            <Text style={styles.subscriptionType}>Demo Account</Text>
            <Text style={[styles.subscriptionStatus, { color: '#FFFFFF' }]}>
              Limited Access
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          {isDemoUser ? (
            <View style={styles.demoStatsContainer}>
              <View style={styles.statCard}>
                <Trophy size={24} color="#059669" />
                <Text style={styles.statNumber}>{loading ? '...' : stats.passedTests > 0 ? 'PASSED' : 'NOT TAKEN'}</Text>
                <Text style={styles.statLabel}>Test Status</Text>
              </View>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <BookOpen size={24} color="#1D4ED8" />
                <Text style={styles.statNumber}>{loading ? '...' : stats.totalTests}</Text>
                <Text style={styles.statLabel}>Tests Taken</Text>
              </View>
              <View style={styles.statCard}>
                <Trophy size={24} color="#059669" />
                <Text style={styles.statNumber}>{loading ? '...' : stats.passedTests}</Text>
                <Text style={styles.statLabel}>Tests Passed</Text>
              </View>
            </View>
          )}
          
          {subscription && (
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionInfoTitle}>Subscription Details</Text>
              <Text style={styles.subscriptionInfoText}>
                Plan: {subscription.subscription_type === 'weekly' ? '1 Week Access' : '12 Months Access'}
              </Text>
              <Text style={styles.subscriptionInfoText}>
                Started: {formatDate(subscription.start_date)}
              </Text>
              <Text style={styles.subscriptionInfoText}>
                Expires: {formatDate(subscription.end_date)}
              </Text>
              <Text style={[styles.subscriptionInfoText, { color: getSubscriptionStatusColor() }]}>
                Status: {getSubscriptionStatusText()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {!isDemoUser && (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => safeHandlePress(handleSettingsPress)}
              activeOpacity={0.7}
            >
              <Settings size={20} color="#6B7280" />
              <Text style={styles.menuText}>App Settings</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => safeHandlePress(() => handleMenuPress('Help & Support'))}
            activeOpacity={0.7}
          >
            <HelpCircle size={20} color="#6B7280" />
            <Text style={styles.menuText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => safeHandlePress(handleLogout)}
            activeOpacity={0.7}
          >
            <LogOut size={20} color="#DC2626" />
            <Text style={[styles.menuText, { color: '#DC2626' }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.infoText}>
            UK Driving License Exam Preparation helps you prepare for your official theory test 
            with realistic questions and detailed explanations.
          </Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 20 : 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statsContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  demoStatsContainer: {
    alignItems: 'center',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 0.48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  menuContainer: {
    marginBottom: 32,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  infoContainer: {
    marginBottom: 32,
  },
  infoText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 12,
  },
  version: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  subscriptionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  subscriptionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subscriptionStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  subscriptionInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  subscriptionInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});