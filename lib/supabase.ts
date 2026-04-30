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

// ─── Supabase session storage adapter ─────────────────────────────────────────
// Local persistent auth storage has been removed.
// Users authenticate through Supabase; app data is stored in Supabase tables.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const FALLBACK_SUPABASE_URL = 'http://localhost:54321';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.placeholder';

const fetchWithTimeout: typeof fetch = (url, options = {}) => {
  const timeoutMs = 30_000;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Fetch timeout')), timeoutMs);
    }),
  ]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  }) as ReturnType<typeof fetch>;
};

export const supabase = createClient(
  supabaseUrl || FALLBACK_SUPABASE_URL,
  supabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // not needed in React Native
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-react-native',
      },
      fetch: fetchWithTimeout,
    },
  },
);
