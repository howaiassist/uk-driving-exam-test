import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, Text } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { createClient } from '@supabase/supabase-js';
import { Slot } from 'expo-router';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Slot />
      <StatusBar style="auto" />
    </View>
  );
}