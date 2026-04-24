/**
 * EncryptedAsyncStorage — compatibility shim
 *
 * The client-side AES-256-GCM encryption layer has been removed.
 * Security is now provided by:
 *   - Supabase Auth (session management)
 *   - Row-Level Security (users can only access their own rows)
 *   - TLS/HTTPS (transport security)
 *   - Standard Supabase database/storage access controls
 *
 * This module is a drop-in shim that delegates all reads/writes to
 * AccountScopedAsyncStorage (plain AsyncStorage, user-scoped by uid).
 * All existing call sites continue to work without modification.
 */

import { AccountScopedAsyncStorage } from './accountScopedStorage';
import { logger } from '../../utils/logger';

export const EncryptedAsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return AccountScopedAsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AccountScopedAsyncStorage.setItem(key, value);
    } catch (e) {
      logger.error(`[EncryptedAsyncStorage] Write failed for key "${key}"`, e);
      throw e;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AccountScopedAsyncStorage.removeItem(key);
    } catch (e) {
      logger.error(`[EncryptedAsyncStorage] Delete failed for key "${key}"`, e);
      throw e;
    }
  },
};
