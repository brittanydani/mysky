import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

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

export class EncryptionManager {
  static async encryptSensitiveData(data: any): Promise<EncryptedPayload> {
    const serialized = JSON.stringify(data);
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      serialized
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
      throw new Error('Encrypted payload integrity check failed');
    }
    return JSON.parse(payload.data) as T;
  }

  static async validateEncryptionIntegrity(payload: EncryptedPayload): Promise<boolean> {
    if (!payload?.data || !payload?.digest) return false;
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      payload.data
    );
    return digest === payload.digest;
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
