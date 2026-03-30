/**
 * Jest mock for @noble/ciphers/aes.js
 *
 * @noble/ciphers ships as pure ESM which Jest (CommonJS test environment)
 * cannot run without a transform step. This shim implements the same gcm()
 * API using Node's built-in crypto so fieldEncryption tests exercise real
 * AES-256-GCM encryption — not a stub.
 *
 * API contract mirrored from @noble/ciphers:
 *   gcm(key, iv) → { encrypt(plaintext) → Uint8Array, decrypt(ciphertextWithTag) → Uint8Array }
 *
 * Ciphertext format: ciphertext bytes followed by 16-byte auth tag
 * (identical to @noble/ciphers' AES-GCM default).
 */

const nodeCrypto = require('crypto');

/**
 * AES-256-GCM compatible with @noble/ciphers' gcm() output format.
 *
 * encrypt() returns ciphertext + 16-byte auth tag (appended).
 * decrypt() expects ciphertext + 16-byte auth tag (appended).
 */
function gcm(key, iv) {
  return {
    encrypt(plaintext) {
      const cipher = nodeCrypto.createCipheriv('aes-256-gcm', Buffer.from(key), Buffer.from(iv));
      const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
      const tag = cipher.getAuthTag(); // 16 bytes
      const result = new Uint8Array(encrypted.length + tag.length);
      result.set(encrypted, 0);
      result.set(tag, encrypted.length);
      return result;
    },

    decrypt(ciphertextWithTag) {
      const buf = Buffer.from(ciphertextWithTag);
      const tag = buf.slice(buf.length - 16);
      const ciphertext = buf.slice(0, buf.length - 16);
      const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', Buffer.from(key), Buffer.from(iv));
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return new Uint8Array(decrypted);
    },
  };
}

module.exports = { gcm };
