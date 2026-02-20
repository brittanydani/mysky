/**
 * Field-Level Encryption Service
 *
 * Encrypts sensitive text fields (journal content, birth data) at rest
 * using AES-256-GCM via @noble/ciphers (pure JS — no native WebCrypto needed),
 * with a Data Encryption Key (DEK) stored in Keychain via SecureStore.
 *
 * Architecture:
 * - DEK is generated once and stored in SecureStore (Keychain/Keystore)
 * - Each field encrypted with AES-256-GCM using a random 96-bit IV
 * - Format: ENC2:base64(iv):base64(ciphertext+authTag)
 * - @noble/ciphers output is byte-compatible with WebCrypto AES-GCM —
 *   existing encrypted rows are decryptable without migration
 *
 * This protects data even if the SQLite DB is extracted from the device.
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes';

import { logger } from '../../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEK_KEY = 'field_encryption_dek';
const DEK_SIZE = 32; // 256 bits for AES-256
const IV_SIZE = 12;  // 96 bits for GCM
const ENCRYPTED_PREFIX = 'ENC:';

// Prefix to distinguish new AES-GCM encrypted data from legacy XOR data
const AES_PREFIX = 'ENC2:';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

// Legacy format (XOR-based) for backward compatibility during migration
interface LegacyEncryptedData {
  iv: string;
  ciphertext: string;
  tag: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate cryptographically secure random bytes via expo-crypto (native).
 */
function generateRandomBytes(size: number): Uint8Array {
  return Crypto.getRandomBytes(size);
}

// ─────────────────────────────────────────────────────────────────────────────
// AES-256-GCM Encryption / Decryption via @noble/ciphers (pure JS, no WebCrypto needed)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns ciphertext with appended 128-bit auth tag (@noble/ciphers default).
 */
function aesGcmEncrypt(plaintext: string, rawKey: Uint8Array, iv: Uint8Array): Uint8Array {
  const cipher = gcm(rawKey, iv);
  const plaintextBytes = new TextEncoder().encode(plaintext);
  return cipher.encrypt(plaintextBytes);
}

/**
 * Decrypt ciphertext (with appended auth tag) using AES-256-GCM.
 */
function aesGcmDecrypt(ciphertextWithTag: Uint8Array, rawKey: Uint8Array, iv: Uint8Array): string {
  const cipher = gcm(rawKey, iv);
  const plaintext = cipher.decrypt(ciphertextWithTag);
  return new TextDecoder().decode(plaintext);
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy XOR decryption (read-only, for migrating old encrypted data)
// ─────────────────────────────────────────────────────────────────────────────

async function legacyExpandKey(key: Uint8Array, iv: Uint8Array, length: number): Promise<Uint8Array> {
  const blocks: Uint8Array[] = [];
  let totalLength = 0;
  let counter = 0;
  
  const keyBase64 = uint8ArrayToBase64(key);
  const ivBase64 = uint8ArrayToBase64(iv);
  
  while (totalLength < length) {
    const input = `${keyBase64}:${ivBase64}:${counter}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      input
    );
    const hashBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      hashBytes[i] = parseInt(hash.substr(i * 2, 2), 16);
    }
    blocks.push(hashBytes);
    totalLength += 32;
    counter++;
  }
  
  const result = new Uint8Array(length);
  let offset = 0;
  for (const block of blocks) {
    for (let i = 0; i < block.length && offset < length; i++, offset++) {
      result[offset] = block[i];
    }
  }
  return result;
}

/**
 * Decrypt data encrypted with the old XOR scheme (for backward compat).
 * Only used during migration — new data is always AES-256-GCM.
 */
async function legacyXorDecrypt(ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array, expectedTag: Uint8Array): Promise<string> {
  // Verify tag
  const tagInput = new Uint8Array([...iv, ...ciphertext]);
  const tagHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    uint8ArrayToBase64(tagInput) + uint8ArrayToBase64(key)
  );
  const computedTag = base64ToUint8Array(btoa(tagHash.slice(0, 24)));
  
  let valid = true;
  if (computedTag.length !== expectedTag.length) {
    valid = false;
  } else {
    for (let i = 0; i < computedTag.length; i++) {
      if (computedTag[i] !== expectedTag[i]) valid = false;
    }
  }
  
  if (!valid) {
    throw new Error('Legacy authentication failed - data may be tampered');
  }
  
  const expandedKey = await legacyExpandKey(key, iv, ciphertext.length);
  const plaintext = new Uint8Array(ciphertext.length);
  for (let i = 0; i < ciphertext.length; i++) {
    plaintext[i] = ciphertext[i] ^ expandedKey[i];
  }
  return new TextDecoder().decode(plaintext);
}

// ─────────────────────────────────────────────────────────────────────────────
// Field Encryption Service
// ─────────────────────────────────────────────────────────────────────────────

class FieldEncryptionServiceClass {
  private dekCache: Uint8Array | null = null;

  /**
   * Initialize the Data Encryption Key
   * Creates a new DEK if one doesn't exist
   */
  async initialize(): Promise<void> {
    const existingDek = await SecureStore.getItemAsync(DEK_KEY);
    
    if (!existingDek) {
      // Generate new DEK
      const newDek = generateRandomBytes(DEK_SIZE);
      await SecureStore.setItemAsync(DEK_KEY, uint8ArrayToBase64(newDek));
      this.dekCache = newDek;
      logger.info('[FieldEncryption] Generated new DEK');
    } else {
      this.dekCache = base64ToUint8Array(existingDek);
      logger.info('[FieldEncryption] Loaded existing DEK');
    }
  }

  /**
   * Get the Data Encryption Key (lazily initialized)
   */
  private async getDek(): Promise<Uint8Array> {
    if (this.dekCache) {
      return this.dekCache;
    }

    const stored = await SecureStore.getItemAsync(DEK_KEY);
    
    if (!stored) {
      await this.initialize();
      return this.dekCache!;
    }
    
    this.dekCache = base64ToUint8Array(stored);
    return this.dekCache;
  }

  /**
   * Encrypt a text field for storage using AES-256-GCM.
   * Returns encrypted string in format: ENC2:iv:ciphertext (with embedded auth tag)
   */
  async encryptField(plaintext: string): Promise<string> {
    if (!plaintext || plaintext.length === 0) {
      return plaintext;
    }

    // Don't double-encrypt
    if (plaintext.startsWith(AES_PREFIX) || plaintext.startsWith(ENCRYPTED_PREFIX)) {
      return plaintext;
    }

    // Fail closed: if encryption fails, throw rather than writing plaintext to SQLite.
    // The caller (localDb) should catch and surface the error rather than silently
    // persisting unencrypted sensitive data.
    const dek = await this.getDek();
    const iv = generateRandomBytes(IV_SIZE);

    const ciphertextWithTag = aesGcmEncrypt(plaintext, dek, iv);

    return `${AES_PREFIX}${uint8ArrayToBase64(iv)}:${uint8ArrayToBase64(ciphertextWithTag)}`;
  }

  /**
   * Decrypt a text field from storage.
   * Handles:
   *   - AES-256-GCM (ENC2:iv:ciphertext) — current format
   *   - Legacy XOR (ENC:iv:ciphertext:tag) — backward compatibility
   *   - Plaintext — returned as-is
   */
  async decryptField(encrypted: string): Promise<string> {
    if (!encrypted || encrypted.length === 0) {
      return encrypted;
    }

    // New AES-GCM format
    if (encrypted.startsWith(AES_PREFIX)) {
      try {
        const dek = await this.getDek();
        const payload = encrypted.slice(AES_PREFIX.length);
        const parts = payload.split(':');
        
        if (parts.length !== 2) {
          throw new Error('Invalid AES encrypted format');
        }
        
        const iv = base64ToUint8Array(parts[0]);
        const ciphertextWithTag = base64ToUint8Array(parts[1]);

        return aesGcmDecrypt(ciphertextWithTag, dek, iv);
      } catch (error) {
        // Never return the raw encrypted blob — it would show gibberish in the UI.
        // Return a controlled, user-safe placeholder so the app remains usable.
        logger.error('[FieldEncryption] AES-GCM decryption failed (encryption key may be unavailable)');
        return '[Unable to access encrypted data on this device]';
      }
    }
    
    // Legacy XOR format (backward compatibility)
    if (encrypted.startsWith(ENCRYPTED_PREFIX)) {
      try {
        const dek = await this.getDek();
        const payload = encrypted.slice(ENCRYPTED_PREFIX.length);
        const parts = payload.split(':');
        
        if (parts.length !== 3) {
          throw new Error('Invalid legacy encrypted format');
        }
        
        const legacyData: LegacyEncryptedData = {
          iv: parts[0],
          ciphertext: parts[1],
          tag: parts[2],
        };
        
        const iv = base64ToUint8Array(legacyData.iv);
        const ciphertext = base64ToUint8Array(legacyData.ciphertext);
        const tag = base64ToUint8Array(legacyData.tag);
        
        return await legacyXorDecrypt(ciphertext, dek, iv, tag);
      } catch (error) {
        // Never return the raw encrypted blob — it would show gibberish in the UI.
        logger.error('[FieldEncryption] Legacy decryption failed (encryption key may be unavailable)');
        return '[Unable to access encrypted data on this device]';
      }
    }

    // Already plaintext
    return encrypted;
  }

  /**
   * Check if a string is encrypted (either format)
   */
  isEncrypted(value: string): boolean {
    return (value?.startsWith(AES_PREFIX) || value?.startsWith(ENCRYPTED_PREFIX)) ?? false;
  }

  /**
   * Encrypt multiple fields in an object
   * Specify which fields to encrypt by key
   */
  async encryptFields<T extends Record<string, any>>(
    obj: T,
    fieldNames: (keyof T)[]
  ): Promise<T> {
    const result = { ...obj };
    
    for (const fieldName of fieldNames) {
      const value = result[fieldName];
      if (typeof value === 'string') {
        (result as any)[fieldName] = await this.encryptField(value);
      }
    }
    
    return result;
  }

  /**
   * Decrypt multiple fields in an object
   */
  async decryptFields<T extends Record<string, any>>(
    obj: T,
    fieldNames: (keyof T)[]
  ): Promise<T> {
    const result = { ...obj };
    
    for (const fieldName of fieldNames) {
      const value = result[fieldName];
      if (typeof value === 'string') {
        (result as any)[fieldName] = await this.decryptField(value);
      }
    }
    
    return result;
  }

  /**
   * Re-encrypt all data with a new DEK
   * DANGER: Only call this during key rotation
   */
  async rotateKey(): Promise<{ oldDek: string; newDek: string }> {
    const oldDek = await SecureStore.getItemAsync(DEK_KEY);
    
    if (!oldDek) {
      throw new Error('No existing DEK to rotate');
    }
    
    // Generate new DEK
    const newDekBytes = generateRandomBytes(DEK_SIZE);
    const newDekBase64 = uint8ArrayToBase64(newDekBytes);
    
    // Store new DEK
    await SecureStore.setItemAsync(DEK_KEY, newDekBase64);
    this.dekCache = newDekBytes;
    
    logger.warn('[FieldEncryption] DEK rotated - data re-encryption required');
    
    return { 
      oldDek: oldDek, 
      newDek: newDekBase64 
    };
  }

  /**
   * Export DEK for backup purposes
   * Should be encrypted before storing outside Keychain
   */
  async exportDek(): Promise<string | null> {
    return SecureStore.getItemAsync(DEK_KEY);
  }

  /**
   * Import DEK for restore purposes
   */
  async importDek(dekBase64: string): Promise<void> {
    // Validate DEK format
    const dekBytes = base64ToUint8Array(dekBase64);
    if (dekBytes.length !== DEK_SIZE) {
      throw new Error(`Invalid DEK size: expected ${DEK_SIZE}, got ${dekBytes.length}`);
    }
    
    await SecureStore.setItemAsync(DEK_KEY, dekBase64);
    this.dekCache = dekBytes;
    logger.info('[FieldEncryption] DEK imported');
  }

  /**
   * Check whether the Data Encryption Key is available on this device.
   * Returns false if the DEK cannot be retrieved from SecureStore (e.g.
   * after an OS keychain reset, device migration, or app reinstall).
   */
  async isKeyAvailable(): Promise<boolean> {
    try {
      if (this.dekCache) return true;
      const stored = await SecureStore.getItemAsync(DEK_KEY);
      return stored !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear cached DEK (for app logout/reset)
   */
  clearCache(): void {
    this.dekCache = null;
  }
}

// Export singleton
export const FieldEncryptionService = new FieldEncryptionServiceClass();
