/**
 * lib/supabase.ts
 *
 * Single shared Supabase client for the MySky Expo app.
 *
 * Persists the Supabase auth session via encrypted AsyncStorage.
 * The session payload can exceed Expo SecureStore's recommended size limit,
 * so SecureStore is only used indirectly for the DEK that protects the
 * encrypted AsyncStorage value at rest.
 * Reads project URL + anon key from EXPO_PUBLIC_ env vars.
 */

import { createClient } from '@supabase/supabase-js';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
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

// ─── Supabase session storage adapter ─────────────────────────────────────────
// The serialized Supabase session can exceed Expo SecureStore's 2 KB guidance.
// Persist it in encrypted AsyncStorage, and migrate any legacy SecureStore
// value on first read so existing users keep their session.

const SupabaseSessionStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const encryptedValue = await EncryptedAsyncStorage.getItem(key);
      if (encryptedValue !== null) {
        return encryptedValue;
      }

      const legacyValue = await getSecureStore().getItemAsync(key);
      if (legacyValue !== null) {
        await EncryptedAsyncStorage.setItem(key, legacyValue);
        await getSecureStore().deleteItemAsync(key);
      }

      return legacyValue;
    } catch {
      logger.warn(`[supabase] Session read failed for key "${key}"`);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await EncryptedAsyncStorage.setItem(key, value);
    } catch {
      logger.warn(`[supabase] Session write failed for key "${key}"`);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await Promise.allSettled([
        EncryptedAsyncStorage.removeItem(key),
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
