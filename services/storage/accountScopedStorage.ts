import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../../lib/supabase';

const ACCOUNT_SCOPED_PLAIN_KEYS = new Set<string>([
  'mysky_custom_journal_tags',
]);

function buildScopedKey(key: string, userId: string): string {
  return `${key}::user::${userId}`;
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

async function getScopedKey(key: string): Promise<string> {
  if (!ACCOUNT_SCOPED_PLAIN_KEYS.has(key)) return key;

  const userId = await getCurrentUserId();
  if (!userId) return key;

  return buildScopedKey(key, userId);
}

async function migrateLegacyValueIfNeeded(key: string, scopedKey: string): Promise<string | null> {
  const scopedValue = await AsyncStorage.getItem(scopedKey);
  if (scopedValue !== null) return scopedValue;

  const legacyValue = await AsyncStorage.getItem(key);
  if (legacyValue === null) return null;

  await AsyncStorage.setItem(scopedKey, legacyValue);
  await AsyncStorage.removeItem(key);
  return legacyValue;
}

export const AccountScopedAsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    const scopedKey = await getScopedKey(key);
    if (scopedKey === key) return AsyncStorage.getItem(key);
    return migrateLegacyValueIfNeeded(key, scopedKey);
  },

  async setItem(key: string, value: string): Promise<void> {
    const scopedKey = await getScopedKey(key);
    await AsyncStorage.setItem(scopedKey, value);
    if (scopedKey !== key) {
      await AsyncStorage.removeItem(key);
    }
  },

  async removeItem(key: string): Promise<void> {
    const scopedKey = await getScopedKey(key);
    await AsyncStorage.removeItem(scopedKey);
    if (scopedKey !== key) {
      await AsyncStorage.removeItem(key);
    }
  },
};