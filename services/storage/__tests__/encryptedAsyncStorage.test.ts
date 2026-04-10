const asyncStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => asyncStore.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => { asyncStore.set(key, value); }),
  removeItem: jest.fn(async (key: string) => { asyncStore.delete(key); }),
}));

const mockEncryptField = jest.fn(async (v: string) => `enc:${v}`);
const mockDecryptField = jest.fn(async (v: string) => v.replace(/^enc:/, ''));
const mockIsEncrypted = jest.fn((v: string) => v.startsWith('enc:'));
type TryDecryptFieldResult =
  | { ok: true; value: string }
  | { ok: false; error: 'key_missing' | 'auth_failed' | 'invalid_format' };

const mockTryDecryptField = jest.fn<Promise<TryDecryptFieldResult>, [string]>(
  async (v: string) => ({ ok: true as const, value: v.replace(/^enc:/, '') })
);

jest.mock('../fieldEncryption', () => ({
  FieldEncryptionService: {
    encryptField: mockEncryptField,
    decryptField: mockDecryptField,
    isEncrypted: mockIsEncrypted,
    tryDecryptField: mockTryDecryptField,
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { EncryptedAsyncStorage } from '../encryptedAsyncStorage';

describe('EncryptedAsyncStorage', () => {
  beforeEach(() => {
    asyncStore.clear();
    jest.clearAllMocks();
    // Re-bind mock implementations after clearAllMocks
    mockEncryptField.mockImplementation(async (v: string) => `enc:${v}`);
    mockDecryptField.mockImplementation(async (v: string) => v.replace(/^enc:/, ''));
    mockIsEncrypted.mockImplementation((v: string) => v.startsWith('enc:'));
    mockTryDecryptField.mockImplementation(async (v: string) => ({ ok: true as const, value: v.replace(/^enc:/, '') }));
  });

  describe('setItem()', () => {
    it('encrypts the value before storing', async () => {
      await EncryptedAsyncStorage.setItem('@key', 'plaintext');
      const stored = asyncStore.get('@key');
      expect(stored).toBe('enc:plaintext');
      expect(mockEncryptField).toHaveBeenCalledWith('plaintext');
    });

    it('throws when encryptField throws', async () => {
      mockEncryptField.mockRejectedValueOnce(new Error('KEK unavailable'));
      await expect(EncryptedAsyncStorage.setItem('@key', 'data')).rejects.toThrow('KEK unavailable');
    });

    it('overwrites a previously stored value', async () => {
      await EncryptedAsyncStorage.setItem('@key', 'first');
      await EncryptedAsyncStorage.setItem('@key', 'second');
      const stored = asyncStore.get('@key');
      expect(stored).toBe('enc:second');
    });
  });

  describe('getItem()', () => {
    it('returns null when key is absent', async () => {
      const result = await EncryptedAsyncStorage.getItem('@missing');
      expect(result).toBeNull();
    });

    it('decrypts an encrypted value', async () => {
      asyncStore.set('@key', 'enc:hello');
      const result = await EncryptedAsyncStorage.getItem('@key');
      expect(result).toBe('hello');
      expect(mockTryDecryptField).toHaveBeenCalledWith('enc:hello');
    });

    it('returns plaintext as-is for legacy (unencrypted) values', async () => {
      asyncStore.set('@key', 'legacy-plain');
      // mockIsEncrypted returns false for values without enc: prefix
      const result = await EncryptedAsyncStorage.getItem('@key');
      expect(result).toBe('legacy-plain');
      expect(mockDecryptField).not.toHaveBeenCalled();
    });

    it('returns null when decryption fails', async () => {
      asyncStore.set('@key', 'enc:baddata');
      mockTryDecryptField.mockResolvedValueOnce({ ok: false as const, error: 'auth_failed' as const });
      const result = await EncryptedAsyncStorage.getItem('@key');
      expect(result).toBeNull();
    });

    it('returns null when the encryption key is unavailable', async () => {
      asyncStore.set('@key', 'enc:baddata');
      mockTryDecryptField.mockResolvedValueOnce({ ok: false as const, error: 'key_missing' as const });
      const result = await EncryptedAsyncStorage.getItem('@key');
      expect(result).toBeNull();
    });

    it('round-trips a value written with setItem', async () => {
      await EncryptedAsyncStorage.setItem('@roundtrip', 'my secret');
      const result = await EncryptedAsyncStorage.getItem('@roundtrip');
      expect(result).toBe('my secret');
    });
  });

  describe('removeItem()', () => {
    it('deletes an existing key', async () => {
      asyncStore.set('@key', 'enc:value');
      await EncryptedAsyncStorage.removeItem('@key');
      expect(asyncStore.has('@key')).toBe(false);
    });

    it('does not throw when the key does not exist', async () => {
      await expect(EncryptedAsyncStorage.removeItem('@ghost')).resolves.not.toThrow();
    });

    it('throws when the underlying removeItem throws', async () => {
      const AS = require('@react-native-async-storage/async-storage');
      AS.removeItem.mockRejectedValueOnce(new Error('Storage error'));
      await expect(EncryptedAsyncStorage.removeItem('@key')).rejects.toThrow('Storage error');
    });
  });
});
