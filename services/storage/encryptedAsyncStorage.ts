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

export const EncryptedAsyncStorage = {
  /**
   * Read and decrypt a value. Handles both encrypted and legacy plaintext
   * values gracefully (plaintext is returned as-is for backward compat).
   */
  async getItem(key: string): Promise<string | null> {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;

    if (FieldEncryptionService.isEncrypted(raw)) {
      try {
        return await FieldEncryptionService.decryptField(raw);
      } catch {
        logger.error(`[EncryptedAsyncStorage] Decryption failed for key "${key}"`);
        return null;
      }
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
    } catch (e) {
      logger.error(`[EncryptedAsyncStorage] Delete failed for key "${key}"`, e);
      throw e;
    }
  },
};
