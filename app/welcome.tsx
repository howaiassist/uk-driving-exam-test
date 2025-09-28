import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate to login after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1D4ED8', '#3B82F6', '#60A5FA']}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* UK Flag */}
          <View style={styles.flagContainer}>
            <View style={styles.flag}>
              {/* Blue background */}
              <View style={styles.flagBlue} />
              
              {/* White diagonal crosses */}
              <View style={styles.whiteStAndrew1} />
              <View style={styles.whiteStAndrew2} />
              
              {/* Red diagonal crosses */}
              <View style={styles.redStPatrick1} />
              <View style={styles.redStPatrick2} />
              
              {/* White cross (St. George) */}
              <View style={styles.whiteStGeorgeVertical} />
              <View style={styles.whiteStGeorgeHorizontal} />
              
              {/* Red cross (St. George) */}
              <View style={styles.redStGeorgeVertical} />
              <View style={styles.redStGeorgeHorizontal} />
            </View>
          </View>

          <Text style={styles.title}>UK Driving Theory Test</Text>
          <Text style={styles.subtitle}>Official Practice Preparation</Text>
          
          <View style={styles.loadingContainer}>
            <View style={styles.loadingDots}>
              <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
              <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
              <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
            </View>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </Animated.View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  flagContainer: {
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  flag: {
    width: 120,
    height: 80,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  flagBlue: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#012169',
  },
  // White diagonal crosses (St. Andrew)
  whiteStAndrew1: {
    position: 'absolute',
    width: '141%',
    height: 16,
    backgroundColor: '#FFFFFF',
    top: 32,
    left: -25,
    transform: [{ rotate: '26.57deg' }],
  },
  whiteStAndrew2: {
    position: 'absolute',
    width: '141%',
    height: 16,
    backgroundColor: '#FFFFFF',
    top: 32,
    left: -25,
    transform: [{ rotate: '-26.57deg' }],
  },
  // Red diagonal crosses (St. Patrick)
  redStPatrick1: {
    position: 'absolute',
    width: '141%',
    height: 8,
    backgroundColor: '#C8102E',
    top: 36,
    left: -25,
    transform: [{ rotate: '26.57deg' }],
  },
  redStPatrick2: {
    position: 'absolute',
    width: '141%',
    height: 8,
    backgroundColor: '#C8102E',
    top: 36,
    left: -25,
    transform: [{ rotate: '-26.57deg' }],
  },
  // White cross (St. George)
  whiteStGeorgeVertical: {
    position: 'absolute',
    width: 20,
    height: '100%',
    backgroundColor: '#FFFFFF',
    left: 50,
  },
  whiteStGeorgeHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 20,
    backgroundColor: '#FFFFFF',
    top: 30,
  },
  // Red cross (St. George)
  redStGeorgeVertical: {
    position: 'absolute',
    width: 12,
    height: '100%',
    backgroundColor: '#C8102E',
    left: 54,
  },
  redStGeorgeHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 12,
    backgroundColor: '#C8102E',
    top: 34,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#E5E7EB',
    textAlign: 'center',
    marginBottom: 60,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '500',
  },
});