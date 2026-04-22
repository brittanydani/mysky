/**
 * Encrypted AsyncStorage Adapter
 *
 * Drop-in replacement for AsyncStorage that transparently encrypts values
 * at rest using the existing AES-256-GCM field encryption (DEK stored in
 * the hardware keychain via SecureStore).
 *
 * Use this instead of AsyncStorage for any key that holds personal or
 * sensitive data (health metrics, psychological profiles, journal notes,
 * user-identifying information, etc.).
 *
 * Non-sensitive keys (feature flags, UI preferences) can stay on plain
 * AsyncStorage — no need to encrypt everything.
 *
 * Migration: On first read of an existing key, if the stored value is
 * plaintext (not encrypted), it is returned as-is and transparently
 * re-encrypted on the next write. No one-shot migration step required.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FieldEncryptionService } from './fieldEncryption';
import { logger } from '../../utils/logger';
import { supabase } from '../../lib/supabase';
import { ENCRYPTED_ASYNC_USER_DATA_KEYS } from './userDataKeys';

const reportedUnreadableKeys = new Set<string>();
const ACCOUNT_SCOPED_ENCRYPTED_KEYS = new Set<string>(ENCRYPTED_ASYNC_USER_DATA_KEYS);

function buildScopedKey(key: string, userId: string): string {
  return `${key}::user::${userId}`;
}

async function getScopedKey(key: string): Promise<string> {
  if (!ACCOUNT_SCOPED_ENCRYPTED_KEYS.has(key)) return key;

  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) return key;

  return buildScopedKey(key, userId);
}

async function getRawStoredValue(key: string): Promise<string | null> {
  const scopedKey = await getScopedKey(key);
  if (scopedKey === key) {
    return AsyncStorage.getItem(key);
  }

  const scopedValue = await AsyncStorage.getItem(scopedKey);
  if (scopedValue !== null) return scopedValue;

  const legacyValue = await AsyncStorage.getItem(key);
  if (legacyValue === null) return null;

  await AsyncStorage.setItem(scopedKey, legacyValue);
  await AsyncStorage.removeItem(key);
  return legacyValue;
}

function logUnreadableKeyOnce(key: string, reason: 'key_missing' | 'auth_failed' | 'invalid_format'): void {
  const marker = `${key}:${reason}`;
  if (reportedUnreadableKeys.has(marker)) {
    return;
  }

  reportedUnreadableKeys.add(marker);
  logger.warn(
    reason === 'key_missing'
      ? `[EncryptedAsyncStorage] Encryption key unavailable for key "${key}"; treating value as missing`
      : reason === 'invalid_format'
        ? `[EncryptedAsyncStorage] Encrypted value for key "${key}" is malformed; treating value as missing`
        : `[EncryptedAsyncStorage] Decryption failed for key "${key}"; treating value as missing`
  );
}

export const EncryptedAsyncStorage = {
  /**
   * Read and decrypt a value. Handles both encrypted and legacy plaintext
   * values gracefully (plaintext is returned as-is for backward compat).
   */
  async getItem(key: string): Promise<string | null> {
    const raw = await getRawStoredValue(key);
    if (raw === null) return null;

    if (FieldEncryptionService.isEncrypted(raw)) {
      const result = await FieldEncryptionService.tryDecryptField(raw);
      if (result.ok) {
        return result.value;
      }

      logUnreadableKeyOnce(key, result.error);
      return null;
    }

    // Legacy plaintext — return as-is. The next setItem will encrypt it.
    return raw;
  },

  /**
   * Encrypt and store a value. The plaintext is never written to AsyncStorage.
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const scopedKey = await getScopedKey(key);
      const encrypted = await FieldEncryptionService.encryptField(value);
      await AsyncStorage.setItem(scopedKey, encrypted);
      if (scopedKey !== key) {
        await AsyncStorage.removeItem(key);
      }
      reportedUnreadableKeys.delete(`${key}:key_missing`);
      reportedUnreadableKeys.delete(`${key}:auth_failed`);
      reportedUnreadableKeys.delete(`${key}:invalid_format`);
    } catch (e) {
      logger.error(`[EncryptedAsyncStorage] Write failed for key "${key}"`, e);
      throw e;
    }
  },

  /**
   * Remove a key (unchanged — deletion doesn't need encryption).
   */
  async removeItem(key: string): Promise<void> {
    try {
      const scopedKey = await getScopedKey(key);
      await AsyncStorage.removeItem(scopedKey);
      if (scopedKey !== key) {
        await AsyncStorage.removeItem(key);
      }
      reportedUnreadableKeys.delete(`${key}:key_missing`);
      reportedUnreadableKeys.delete(`${key}:auth_failed`);
      reportedUnreadableKeys.delete(`${key}:invalid_format`);
    } catch (e) {
      logger.error(`[EncryptedAsyncStorage] Delete failed for key "${key}"`, e);
      throw e;
    }
  },
};
