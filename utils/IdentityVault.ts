// File: utils/IdentityVault.ts
import * as SecureStore from 'expo-secure-store';
import { logger } from './logger';

/**
 * The user's core astrological identity — the most sensitive data in the app.
 * Encrypted at rest in the OS-level keychain (iOS) or keystore (Android).
 * Never written to a remote server or unencrypted local storage.
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

const IDENTITY_KEY = '@mysky_secure_identity';

const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  // Only accessible when the device is unlocked; never migrates to another device.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export class IdentityVault {
  /**
   * Encrypts and saves the user's birth data to the hardware keychain / keystore.
   * Returns true on success, false if the OS-level write failed.
   */
  static async sealIdentity(identity: CosmicIdentity): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(IDENTITY_KEY, JSON.stringify(identity), STORE_OPTIONS);
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
  static async openVault(): Promise<CosmicIdentity | null> {
    try {
      const payload = await SecureStore.getItemAsync(IDENTITY_KEY, STORE_OPTIONS);
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
  static async destroyIdentity(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(IDENTITY_KEY, STORE_OPTIONS);
    } catch (error) {
      logger.error('[IdentityVault] Failed to destroy identity:', error);
    }
  }
}
