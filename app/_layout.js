import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { Slot } from 'expo-router';
import { SupabaseProvider } from './SupabaseProvider';

export default function RootLayout() {
  return (
    <SupabaseProvider>
      <View style={{ flex: 1 }}>
        <Slot />
        <StatusBar style="auto" />
      </View>
    </SupabaseProvider>
  );
}