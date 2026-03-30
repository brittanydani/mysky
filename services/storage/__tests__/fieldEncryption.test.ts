/**
 * fieldEncryption — unit tests
 *
 * Covers:
 *  - isDecryptionFailure (pure helper)
 *  - FieldEncryptionService.isEncrypted
 *  - encrypt → decrypt round-trip (AES-256-GCM)
 *  - double-encrypt guard
 *  - plaintext passthrough
 *  - tryDecryptField discriminated union
 *  - encryptFields / decryptFields on objects
 *
 * expo-secure-store is stubbed via __mocks__/expo-secure-store.js.
 * expo-crypto is stubbed via __mocks__/expo-crypto.js (uses Node webcrypto).
 * @noble/ciphers/aes.js is pure JS — works in Node without mocking.
 */

import {
  isDecryptionFailure,
  DECRYPTION_FAILED_PLACEHOLDER,
  FieldEncryptionService as fieldEncryption,
} from '../fieldEncryption';

// ─────────────────────────────────────────────────────────────────────────────
// Reset state between tests (dekCache & SecureStore)
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  // Clear the SecureStore mock so each test starts with a fresh key state
  const SecureStore = require('expo-secure-store');
  SecureStore.deleteItemAsync('field_encryption_dek');
  // Reset the internal DEK cache by re-initializing
  // (cast to any to access private dekCache)
  (fieldEncryption as any).dekCache = null;
});

// ─────────────────────────────────────────────────────────────────────────────
// isDecryptionFailure
// ─────────────────────────────────────────────────────────────────────────────

describe('isDecryptionFailure', () => {
  it('returns true for the placeholder sentinel', () => {
    expect(isDecryptionFailure(DECRYPTION_FAILED_PLACEHOLDER)).toBe(true);
  });

  it('returns false for normal plaintext', () => {
    expect(isDecryptionFailure('hello world')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isDecryptionFailure('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isDecryptionFailure(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isDecryptionFailure(undefined)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isEncrypted
// ─────────────────────────────────────────────────────────────────────────────

describe('fieldEncryption.isEncrypted', () => {
  it('returns false for plaintext', () => {
    expect(fieldEncryption.isEncrypted('hello')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(fieldEncryption.isEncrypted('')).toBe(false);
  });

  it('returns true for AES-GCM prefix (ENC2:)', () => {
    expect(fieldEncryption.isEncrypted('ENC2:somebase64:morebase64')).toBe(true);
  });

  it('returns true for legacy prefix (ENC:)', () => {
    expect(fieldEncryption.isEncrypted('ENC:somebase64:more:tag')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// encryptField
// ─────────────────────────────────────────────────────────────────────────────

describe('fieldEncryption.encryptField', () => {
  it('encrypts plaintext and returns ENC2: prefix', async () => {
    const result = await fieldEncryption.encryptField('my secret entry');
    expect(result.startsWith('ENC2:')).toBe(true);
  });

  it('returns empty string unchanged', async () => {
    const result = await fieldEncryption.encryptField('');
    expect(result).toBe('');
  });

  it('does not double-encrypt already-encrypted data (ENC2:)', async () => {
    const first = await fieldEncryption.encryptField('hello');
    const second = await fieldEncryption.encryptField(first);
    expect(second).toBe(first);
  });

  it('produces different ciphertexts for the same plaintext (random IV)', async () => {
    const a = await fieldEncryption.encryptField('determinism test');
    const b = await fieldEncryption.encryptField('determinism test');
    // Same plaintext → different encrypted blobs (nonce-based)
    expect(a).not.toBe(b);
  });

  it('encrypts Unicode text correctly', async () => {
    const result = await fieldEncryption.encryptField('日本語テスト 🌙');
    expect(result.startsWith('ENC2:')).toBe(true);
  });

  it('encrypts long text correctly', async () => {
    const long = 'a'.repeat(5000);
    const result = await fieldEncryption.encryptField(long);
    expect(result.startsWith('ENC2:')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// decryptField
// ─────────────────────────────────────────────────────────────────────────────

describe('fieldEncryption.decryptField', () => {
  it('decrypts an encrypted field back to plaintext', async () => {
    const plaintext = 'my secret journal entry';
    const encrypted = await fieldEncryption.encryptField(plaintext);
    const decrypted = await fieldEncryption.decryptField(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('returns empty string unchanged', async () => {
    expect(await fieldEncryption.decryptField('')).toBe('');
  });

  it('returns plaintext as-is (no prefix)', async () => {
    expect(await fieldEncryption.decryptField('plain text')).toBe('plain text');
  });

  it('decrypts Unicode text correctly', async () => {
    const original = '🌙 日本語テスト — gratitude & presence';
    const encrypted = await fieldEncryption.encryptField(original);
    const decrypted = await fieldEncryption.decryptField(encrypted);
    expect(decrypted).toBe(original);
  });

  it('decrypts long text correctly', async () => {
    const long = 'b'.repeat(3000);
    const encrypted = await fieldEncryption.encryptField(long);
    const decrypted = await fieldEncryption.decryptField(encrypted);
    expect(decrypted).toBe(long);
  });

  it('returns DECRYPTION_FAILED_PLACEHOLDER for tampered ciphertext', async () => {
    const encrypted = await fieldEncryption.encryptField('real content');
    // Corrupt the ciphertext portion (last chars)
    const tampered = encrypted.slice(0, -4) + 'XXXX';
    const result = await fieldEncryption.decryptField(tampered);
    expect(result).toBe(DECRYPTION_FAILED_PLACEHOLDER);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// tryDecryptField
// ─────────────────────────────────────────────────────────────────────────────

describe('fieldEncryption.tryDecryptField', () => {
  it('returns ok=true for plaintext', async () => {
    const result = await fieldEncryption.tryDecryptField('plain text');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('plain text');
  });

  it('returns ok=true for empty string', async () => {
    const result = await fieldEncryption.tryDecryptField('');
    expect(result.ok).toBe(true);
  });

  it('returns ok=true and correct value after encrypt/decrypt round-trip', async () => {
    const original = 'sensitive content';
    const encrypted = await fieldEncryption.encryptField(original);
    const result = await fieldEncryption.tryDecryptField(encrypted);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(original);
  });

  it('returns ok=false with auth_failed for tampered ciphertext', async () => {
    const encrypted = await fieldEncryption.encryptField('hello');
    const tampered = encrypted.slice(0, -4) + 'ZZZZ';
    const result = await fieldEncryption.tryDecryptField(tampered);
    expect(result.ok).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// encryptFields / decryptFields
// ─────────────────────────────────────────────────────────────────────────────

describe('fieldEncryption.encryptFields / decryptFields', () => {
  it('encrypts only the specified fields', async () => {
    const obj = { content: 'secret', title: 'public', count: 42 };
    const encrypted = await fieldEncryption.encryptFields(obj, ['content']);
    expect(encrypted.content.startsWith('ENC2:')).toBe(true);
    expect(encrypted.title).toBe('public');
    expect(encrypted.count).toBe(42);
  });

  it('decrypts back to original object', async () => {
    const obj = { content: 'my dream', notes: 'feeling good' };
    const encrypted = await fieldEncryption.encryptFields(obj, ['content', 'notes']);
    const decrypted = await fieldEncryption.decryptFields(encrypted, ['content', 'notes']);
    expect(decrypted.content).toBe('my dream');
    expect(decrypted.notes).toBe('feeling good');
  });

  it('preserves non-string fields unchanged', async () => {
    const obj = { text: 'hello', score: 8, tags: ['calm', 'joy'] };
    const encrypted = await fieldEncryption.encryptFields(obj, ['text']);
    expect(encrypted.score).toBe(8);
    expect(encrypted.tags).toEqual(['calm', 'joy']);
  });
});
