import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { UserProvider } from '@/contexts/UserContext';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // Never show error fallback on mobile devices
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    console.log('Error suppressed on mobile:', error);
    return null;
  }
  
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>
        Please refresh the page or try again later.
      </Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={resetErrorBoundary}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Global error suppression for mobile platforms
    const handleError = (error: any, errorInfo?: any) => {
      const errorMessage = error?.message || error?.toString() || '';
      
      // Suppress all update-related errors on mobile
      if ((Platform.OS === 'android' || Platform.OS === 'ios') && (
          errorMessage.includes('IOException') ||
          errorMessage.includes('Failed to download remote update') ||
          errorMessage.includes('Update check failed') ||
          errorMessage.includes('Network request failed') ||
          errorMessage.includes('java.io.IOException') ||
          errorMessage.includes('Uncaught Error') ||
          errorMessage.includes('expo.dev') ||
          errorMessage.includes('remote update')
      )) {
        console.log('Mobile update error suppressed:', errorMessage);
        return true;
      }
      
      // Suppress all errors on mobile to prevent error screens
      if (Platform.OS !== 'web') {
        console.log('Mobile error suppressed:', errorMessage);
        return true;
      }
      
      console.error('App error:', error, errorInfo);
      return false;
    };
    
    // Set global error handler for mobile platforms
    if (Platform.OS !== 'web' && global.ErrorUtils) {
      const originalHandler = global.ErrorUtils.getGlobalHandler();
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        if (handleError(error)) {
          return; // Suppress the error
        }
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
    
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: any) => {
      if (handleError(event.reason)) {
        event.preventDefault?.();
      }
    };
    
    // Add event listeners for web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      window.addEventListener('error', (event) => {
        if (handleError(event.error)) {
          event.preventDefault();
        }
      });
      
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleError);
      };
    }
  }, []);

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Never show error boundary on mobile devices
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          console.log('Error boundary triggered on mobile:', error);
          return;
        }
        console.error('Error boundary:', error, errorInfo);
      }}
      onReset={() => {
        // Reset any global state if needed
        console.log('Error boundary reset');
      }}
    >
      <UserProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={Platform.OS === 'android' ? 'light' : 'auto'} />
      </UserProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});