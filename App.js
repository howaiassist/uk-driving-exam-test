import 'react-native-gesture-handler';
import React from 'react';
import { Text, View } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>UK Driving Exam Test</Text>
    </View>
  );
}