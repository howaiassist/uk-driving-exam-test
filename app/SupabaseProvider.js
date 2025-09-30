import React, { createContext, useContext } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { createClient } from '@supabase/supabase-js';

const SupabaseContext = createContext(null);

export const SupabaseProvider = ({ children }) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => useContext(SupabaseContext);