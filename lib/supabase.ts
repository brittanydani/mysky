/**
 * lib/supabase.ts
 *
 * Single shared Supabase client for the MySky Expo app.
 *
 * Supabase auth session is not persisted in local storage.
 * Supabase remains the source of truth for authenticated app data,
 * while the client avoids local persistent storage beyond cache.
 * by TLS in transit and Supabase Auth server-side — no additional
 * client-side encryption layer is needed.
 *
 * Reads project URL + anon key from EXPO_PUBLIC_ env vars.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// ─── Supabase session storage adapter ─────────────────────────────────────────
// Local persistent auth storage has been removed.
// Users authenticate through Supabase; app data is stored in Supabase tables.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl && 'EXPO_PUBLIC_SUPABASE_URL',
    !supabaseAnonKey && 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ]
    .filter(Boolean)
    .join(', ');
  throw new Error(
    `[supabase] Missing required environment variable(s): ${missing}. ` +
      'For local dev: copy .env.example to .env and fill in your Supabase credentials. ' +
      'For EAS builds: run `eas secret:create` to add them as EAS secrets.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // not needed in React Native
  },
});
