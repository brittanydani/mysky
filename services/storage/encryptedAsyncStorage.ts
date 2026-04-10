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

const reportedUnreadableKeys = new Set<string>();

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
    const raw = await AsyncStorage.getItem(key);
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
      const encrypted = await FieldEncryptionService.encryptField(value);
      await AsyncStorage.setItem(key, encrypted);
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
      await AsyncStorage.removeItem(key);
      reportedUnreadableKeys.delete(`${key}:key_missing`);
      reportedUnreadableKeys.delete(`${key}:auth_failed`);
      reportedUnreadableKeys.delete(`${key}:invalid_format`);
    } catch (e) {
      logger.error(`[EncryptedAsyncStorage] Delete failed for key "${key}"`, e);
      throw e;
    }
  },
};
