/**
 * lib/supabase.ts
 *
 * Single shared Supabase client for the MySky Expo app.
 *
 * Uses expo-secure-store for session persistence so auth tokens are stored
 * in the iOS Keychain / Android Keystore instead of plaintext AsyncStorage.
 * Reads project URL + anon key from EXPO_PUBLIC_ env vars.
 */

import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// ─── Secure session storage adapter ───────────────────────────────────────────
// Implements the Supabase `SupportedStorage` interface backed by SecureStore
// so that session / refresh tokens are hardware-encrypted at rest.

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // SecureStore can fail (e.g. simulator keychain reset). Fall back to
      // returning null so auth degrades to logged-out rather than crashing.
      logger.warn(`[supabase] SecureStore read failed for key "${key}"`);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      logger.warn(`[supabase] SecureStore write failed for key "${key}"`);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      logger.warn(`[supabase] SecureStore delete failed for key "${key}"`);
    }
  },
};

// ─── Client setup ─────────────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL is missing. ' +
      'Ensure it is set in .env (local) or as an EAS secret (production builds).',
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    '[supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
      'Ensure it is set in .env (local) or as an EAS secret (production builds).',
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
