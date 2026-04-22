// File: utils/IdentityVault.ts
import type * as SecureStoreType from 'expo-secure-store';
import { logger } from './logger';

/**
 * The user's core astrological identity — the most sensitive data in the app.
 * Encrypted at rest in the OS-level keychain on iOS.
 * Also mirrored to Supabase for signed-in users so the app can restore birth
 * data across devices without syncing chart render state.
 */
export interface CosmicIdentity {
  name: string;
  birthDate: string;          // YYYY-MM-DD
  birthTime?: string;         // HH:MM — absent when time is unknown
  hasUnknownTime: boolean;
  locationCity: string;
  locationLat: number;
  locationLng: number;
  timezone?: string;
}

const IDENTITY_KEY = 'mysky_secure_identity';

let secureStoreModule: typeof SecureStoreType | null = null;

function getSecureStore(): typeof SecureStoreType {
  if (!secureStoreModule) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    secureStoreModule = require('expo-secure-store') as typeof SecureStoreType;
  }

  return secureStoreModule;
}

function getStoreOptions(): SecureStoreType.SecureStoreOptions {
  const SecureStore = getSecureStore();

  return {
    // Only accessible when the device is unlocked; never migrates to another device.
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };
}

export class IdentityVault {
  /**
   * Encrypts and saves the user's birth data to the hardware keychain / keystore.
   * Returns true on success, false if the OS-level write failed.
   */
  static async sealIdentity(identity: CosmicIdentity, userId?: string): Promise<boolean> {
    const key = userId ? `${IDENTITY_KEY}_${userId}` : IDENTITY_KEY;
    try {
      await getSecureStore().setItemAsync(key, JSON.stringify(identity), getStoreOptions());
      return true;
    } catch (error) {
      logger.error('[IdentityVault] Failed to seal identity:', error);
      return false;
    }
  }

  /**
   * Decrypts and returns the user's birth data into volatile memory.
   * Returns null if nothing is stored or decryption fails.
   */
  static async openVault(userId?: string): Promise<CosmicIdentity | null> {
    const key = userId ? `${IDENTITY_KEY}_${userId}` : IDENTITY_KEY;
    try {
      const payload = await getSecureStore().getItemAsync(key, getStoreOptions());
      if (!payload) return null;
      return JSON.parse(payload) as CosmicIdentity;
    } catch (error) {
      logger.error('[IdentityVault] Failed to open vault:', error);
      return null;
    }
  }

  /**
   * Permanently destroys the sealed identity from the hardware vault.
   * Called during a Hard Reset — irreversible.
   */
  static async destroyIdentity(userId?: string): Promise<void> {
    const key = userId ? `${IDENTITY_KEY}_${userId}` : IDENTITY_KEY;
    try {
      await getSecureStore().deleteItemAsync(key, getStoreOptions());
    } catch (error) {
      logger.error('[IdentityVault] Failed to destroy identity:', error);
    }
  }
}
