/**
 * lib/supabase.ts
 *
 * Single shared Supabase client for the MySky Expo app.
 *
 * Supabase auth sessions are persisted through AsyncStorage, which is normal
 * app behavior for keeping a user signed in. Supabase remains the source of
 * truth for authenticated app data; local storage is not used as authoritative
 * app data storage.
 *
 * Reads project URL + anon key from EXPO_PUBLIC_ env vars.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase session storage adapter ─────────────────────────────────────────
// Persist only the Supabase auth session locally. User app data belongs in
// Supabase tables and may use local storage only for cache/queue behavior.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const UNCONFIGURED_SUPABASE_URL = 'https://unconfigured.supabase.invalid';
const UNCONFIGURED_SUPABASE_ANON_KEY = 'sb_publishable_unconfigured';

const SUPABASE_FETCH_TIMEOUT_MS = 10_000;

const fetchWithTimeout: typeof fetch = (url, options = {}) => {
  const controller = new AbortController();
  const externalSignal = options.signal;
  let didTimeout = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const abortFromParent = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener?.('abort', abortFromParent, { once: true });
    }
  }

  const timeout = new Promise<Response>((_, reject) => {
    timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
      reject(new Error(`Fetch timeout after ${SUPABASE_FETCH_TIMEOUT_MS}ms`));
    }, SUPABASE_FETCH_TIMEOUT_MS);
  });

  const request = fetch(url, { ...options, signal: controller.signal }).catch((error) => {
    if (didTimeout) {
      throw new Error(`Fetch timeout after ${SUPABASE_FETCH_TIMEOUT_MS}ms`);
    }
    throw error;
  });

  return Promise.race([request, timeout])
    .finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
      externalSignal?.removeEventListener?.('abort', abortFromParent);
    }) as ReturnType<typeof fetch>;
};

export const supabase = createClient(
  supabaseUrl || UNCONFIGURED_SUPABASE_URL,
  supabaseAnonKey || UNCONFIGURED_SUPABASE_ANON_KEY,
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
