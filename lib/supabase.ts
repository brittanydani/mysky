/**
 * lib/supabase.ts
 *
 * Single shared Supabase client for the MySky Expo app.
 *
 * Uses expo-secure-store for session persistence so auth tokens are stored
 * in the iOS Keychain instead of plaintext AsyncStorage.
 * Reads project URL + anon key from EXPO_PUBLIC_ env vars.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

type SecureStoreModule = typeof import('expo-secure-store');

let secureStoreModule: SecureStoreModule | null = null;

function getSecureStore(): SecureStoreModule {
  if (!secureStoreModule) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    secureStoreModule = require('expo-secure-store') as SecureStoreModule;
  }
  return secureStoreModule;
}

// ─── Secure session storage adapter ───────────────────────────────────────────
// Implements the Supabase `SupportedStorage` interface backed by SecureStore
// so that session / refresh tokens are hardware-encrypted at rest.

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await getSecureStore().getItemAsync(key);
    } catch {
      // SecureStore can fail (e.g. simulator keychain reset). Fall back to
      // returning null so auth degrades to logged-out rather than crashing.
      logger.warn(`[supabase] SecureStore read failed for key "${key}"`);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await getSecureStore().setItemAsync(key, value);
    } catch {
      logger.warn(`[supabase] SecureStore write failed for key "${key}"`);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await getSecureStore().deleteItemAsync(key);
    } catch {
      logger.warn(`[supabase] SecureStore delete failed for key "${key}"`);
    }
  },
};

// ─── Client setup ─────────────────────────────────────────────────────────────

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
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // not needed in React Native
  },
});
