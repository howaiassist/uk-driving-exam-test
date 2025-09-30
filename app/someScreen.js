import React from 'react';
import { View, Text } from 'react-native';
import { useSupabase } from './SupabaseProvider';

export default function SomeScreen() {
  const supabase = useSupabase();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Some Screen</Text>
    </View>
  );
}