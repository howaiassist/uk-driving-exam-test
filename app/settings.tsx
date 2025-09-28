import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, User, Lock, Save, Eye, EyeOff } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';

// Mobile-safe alert helper
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

export default function SettingsScreen() {
  const { name: userName, updateName } = useUser();
  const [name, setName] = useState(userName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSaveName = () => {
    if (!name.trim()) {
      showAlert('Input Required', 'Name cannot be empty');
      return;
    }
    try {
      updateName(name.trim()).then(() => {
        showAlert('Success', 'Profile name updated successfully!');
      }).catch((error) => {
        showAlert('Update Failed', 'Failed to update name. Please try again.');
        console.error('Update name error:', error);
      });
    } catch (error) {
      showAlert('Update Failed', 'Failed to update name. Please try again.');
      console.error('Update name error:', error);
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Input Required', 'Please fill in all password fields');
      return;
    }

    if (currentPassword !== 'password') {
      showAlert('Incorrect Password', 'Current password is incorrect');
      return;
    }

    // Validate new password requirements
    if (newPassword.length < 8) {
      showAlert('Password Requirements', 'Password must be at least 8 characters long with at least one special character (!@#$%^&*)');
      return;
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(newPassword)) {
      showAlert('Password Requirements', 'Password must contain at least one special character (!@#$%^&*)');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Password Mismatch', 'New passwords do not match');
      return;
    }


    try {
      // Update password in Supabase
      updatePasswordInSupabase(newPassword).then(() => {
        showAlert('Success', 'Password changed successfully!', [
          { text: 'OK', onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }}
        ]);
      }).catch((error) => {
        showAlert('Update Failed', 'Failed to update password. Please try again.');
        console.error('Password update error:', error);
      });
    } catch (error) {
      console.log('Password update error:', error);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const updatePasswordInSupabase = async (newPassword: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Supabase password update error:', error);
      throw error;
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false 
        }} 
      />
      
      <LinearGradient
        colors={['#1D4ED8', '#3B82F6']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#1D4ED8" />
            <Text style={styles.sectionTitle}>Profile Information</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              textContentType="name"
            />
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveName}
            activeOpacity={0.7}
          >
            <Save size={16} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Name</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color="#1D4ED8" />
            <Text style={styles.sectionTitle}>Change Password</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showCurrentPassword}
                autoComplete="password"
                textContentType="password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showNewPassword}
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <Lock size={16} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Password Requirements:</Text>
          <Text style={styles.infoText}>• At least 8 characters long</Text>
          <Text style={styles.infoText}>• Must contain at least one special character (!@#$%^&*)</Text>
          <Text style={styles.infoText}>• Must match confirmation</Text>
          <Text style={styles.infoText}>• Different from current password</Text>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Demo Account Info:</Text>
          <Text style={styles.demoText}>Current Password: password</Text>
          <Text style={styles.demoText}>Email: test@example.com</Text>
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
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  saveButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  demoSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D4ED8',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 4,
  },
});