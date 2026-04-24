/**
 * lib/supabase.ts
 *
 * Single shared Supabase client for the MySky Expo app.
 *
 * Persists the Supabase auth session via plain AsyncStorage.
 * The session payload can exceed Expo SecureStore's recommended size limit,
 * so AsyncStorage is used directly. The session token is already protected
 * by TLS in transit and Supabase Auth server-side — no additional
 * client-side encryption layer is needed.
 *
 * Reads project URL + anon key from EXPO_PUBLIC_ env vars.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

// ─── Supabase session storage adapter ─────────────────────────────────────────
// Uses plain AsyncStorage. On first read, migrates any legacy value that was
// stored in expo-secure-store by the old encrypted adapter.

type SecureStoreModule = typeof import('expo-secure-store');

let secureStoreModule: SecureStoreModule | null = null;

function getSecureStore(): SecureStoreModule {
  if (!secureStoreModule) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    secureStoreModule = require('expo-secure-store') as SecureStoreModule;
  }
  return secureStoreModule;
}

/** Returns true if the value looks like a legacy encrypted blob (ENC2: or ENC: prefix). */
function isLegacyEncryptedBlob(value: string): boolean {
  return value.startsWith('ENC2:') || value.startsWith('ENC:');
}

const SupabaseSessionStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      // Check plain AsyncStorage first (current location)
      const raw = await AsyncStorage.getItem(key);
      if (raw !== null) {
        // Guard: if the stored value is a legacy encrypted blob, it cannot be
        // used as a session. Clear it so Supabase falls back to a fresh sign-in
        // instead of crashing with "Cannot create property 'user' on string".
        if (isLegacyEncryptedBlob(raw)) {
          logger.warn(`[supabase] Found legacy encrypted blob in AsyncStorage for key "${key}"; clearing`);
          await AsyncStorage.removeItem(key).catch(() => {});
          return null;
        }
        return raw;
      }

      // One-time migration: move legacy SecureStore session to AsyncStorage.
      // Discard if it is also an encrypted blob (can't be used as a session).
      const legacyValue = await getSecureStore().getItemAsync(key).catch(() => null);
      if (legacyValue !== null) {
        if (isLegacyEncryptedBlob(legacyValue)) {
          logger.warn(`[supabase] Found legacy encrypted blob in SecureStore for key "${key}"; discarding`);
          await getSecureStore().deleteItemAsync(key).catch(() => {});
          return null;
        }
        await AsyncStorage.setItem(key, legacyValue);
        await getSecureStore().deleteItemAsync(key).catch(() => {});
        return legacyValue;
      }

      return null;
    } catch {
      logger.warn(`[supabase] Session read failed for key "${key}"`);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      logger.warn(`[supabase] Session write failed for key "${key}"`);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await Promise.allSettled([
        AsyncStorage.removeItem(key),
        getSecureStore().deleteItemAsync(key),
      ]);
    } catch {
      logger.warn(`[supabase] Session delete failed for key "${key}"`);
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
    storage: SupabaseSessionStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // not needed in React Native
  },
});
