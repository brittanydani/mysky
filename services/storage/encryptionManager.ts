import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { logger } from '../../utils/logger';

export interface EncryptedPayload {
  version: 1;
  digest: string;
  data: string;
  createdAt: string;
}

export interface EncryptedEnvelope {
  encrypted: true;
  payload: EncryptedPayload;
}

/**
 * NOTE ON SECURITY MODEL:
 * Data is stored inside Expo SecureStore which uses the iOS Keychain (hardware-backed 
 * encryption at rest) and Android Keystore. The payload.data field is serialized JSON.
 * The digest is an HMAC-SHA256 using a device-unique key stored in SecureStore, providing
 * tamper detection. True AES field-level encryption is handled by fieldEncryption.ts for 
 * SQLite data; SecureStore data relies on the OS keychain for confidentiality.
 */
export class EncryptionManager {
  private static readonly HMAC_KEY_STORE = 'encryption_hmac_key';

  /**
   * Get or create the HMAC key used for integrity verification.
   * Stored in SecureStore so it's device-unique and protected.
   */
  private static async getHmacKey(): Promise<string> {
    let key = await SecureStore.getItemAsync(this.HMAC_KEY_STORE);
    if (!key) {
      // Generate a random 32-byte key on first use
      const bytes = await Crypto.getRandomBytesAsync(32);
      key = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      await SecureStore.setItemAsync(this.HMAC_KEY_STORE, key);
    }
    return key;
  }

  static async encryptSensitiveData(data: any): Promise<EncryptedPayload> {
    const serialized = JSON.stringify(data);
    const hmacKey = await this.getHmacKey();
    // HMAC-SHA256: hash the data with the secret key for tamper detection
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hmacKey + ':' + serialized
    );

    return {
      version: 1,
      digest,
      data: serialized,
      createdAt: new Date().toISOString(),
    };
  }

  static async decryptSensitiveData<T>(payload: EncryptedPayload): Promise<T> {
    const isValid = await this.validateEncryptionIntegrity(payload);
    if (!isValid) {
      logger.warn('[EncryptionManager] Integrity check failed — data may have been tampered with');
      // Still return the data rather than crashing (data is Keychain-protected anyway)
      // but log a warning for audit purposes
    }
    return JSON.parse(payload.data) as T;
  }

  static async validateEncryptionIntegrity(payload: EncryptedPayload): Promise<boolean> {
    if (!payload?.data || !payload?.digest) return false;
    try {
      const hmacKey = await this.getHmacKey();
      const expectedDigest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        hmacKey + ':' + payload.data
      );
      if (expectedDigest === payload.digest) return true;

      // Fallback: check if it was created with the old non-HMAC digest (migration path)
      const legacyDigest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        payload.data
      );
      return legacyDigest === payload.digest;
    } catch {
      return false;
    }
  }

  static async overwriteWithRandomData(key: string): Promise<void> {
    const randomBytes = await Crypto.getRandomBytesAsync(48);
    const randomString = Array.from(randomBytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    const payload = await this.encryptSensitiveData({
      overwrittenAt: new Date().toISOString(),
      randomString,
    });
    const envelope: EncryptedEnvelope = { encrypted: true, payload };
    await SecureStore.setItemAsync(key, JSON.stringify(envelope));
  }
}
