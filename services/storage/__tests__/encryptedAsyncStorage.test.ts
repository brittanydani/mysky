/**
 * encryptedAsyncStorage.test.ts
 *
 * Tests for the EncryptedAsyncStorage compatibility shim.
 *
 * The shim no longer encrypts on write — it delegates directly to
 * AccountScopedAsyncStorage (plain AsyncStorage). On read, it
 * transparently decrypts any legacy ENC2: blobs left over from the
 * old client-side encryption layer.
 */

import { EncryptedAsyncStorage } from '../encryptedAsyncStorage';

// ─── Mock AccountScopedAsyncStorage ──────────────────────────────────────────

const asyncStore = new Map<string, string>();

jest.mock('../accountScopedStorage', () => ({
  AccountScopedAsyncStorage: {
    getItem: jest.fn(async (key: string) => asyncStore.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { asyncStore.set(key, value); }),
    removeItem: jest.fn(async (key: string) => { asyncStore.delete(key); }),
  },
}));

// ─── Mock FieldEncryptionService ─────────────────────────────────────────────

const mockIsEncrypted = jest.fn((value: string) => value.startsWith('enc:'));
const mockTryDecryptField = jest.fn(async (value: string) => ({
  ok: true as const,
  value: value.replace(/^enc:/, ''),
}));

jest.mock('../fieldEncryption', () => ({
  FieldEncryptionService: {
    isEncrypted: (v: string) => mockIsEncrypted(v),
    tryDecryptField: (v: string) => mockTryDecryptField(v),
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { AccountScopedAsyncStorage } from '../accountScopedStorage';

const AS = AccountScopedAsyncStorage as jest.Mocked<typeof AccountScopedAsyncStorage>;

beforeEach(() => {
  asyncStore.clear();
  jest.clearAllMocks();
  // Re-wire mocks after clearAllMocks
  AS.getItem.mockImplementation(async (key) => asyncStore.get(key) ?? null);
  AS.setItem.mockImplementation(async (key, value) => { asyncStore.set(key, value); });
  AS.removeItem.mockImplementation(async (key) => { asyncStore.delete(key); });
  mockIsEncrypted.mockImplementation((v) => v.startsWith('enc:'));
  mockTryDecryptField.mockImplementation(async (v) => ({ ok: true as const, value: v.replace(/^enc:/, '') }));
});

// ─── setItem ─────────────────────────────────────────────────────────────────

describe('EncryptedAsyncStorage.setItem', () => {
  it('stores the value as plain text (no encryption)', async () => {
    await EncryptedAsyncStorage.setItem('@key', 'plaintext');
    expect(asyncStore.get('@key')).toBe('plaintext');
  });

  it('overwrites a previously stored value', async () => {
    await EncryptedAsyncStorage.setItem('@key', 'first');
    await EncryptedAsyncStorage.setItem('@key', 'second');
    expect(asyncStore.get('@key')).toBe('second');
  });

  it('propagates storage errors', async () => {
    AS.setItem.mockRejectedValueOnce(new Error('Storage error'));
    await expect(EncryptedAsyncStorage.setItem('@key', 'data')).rejects.toThrow('Storage error');
  });
});

// ─── getItem ─────────────────────────────────────────────────────────────────

describe('EncryptedAsyncStorage.getItem', () => {
  it('returns null when key is absent', async () => {
    const result = await EncryptedAsyncStorage.getItem('@missing');
    expect(result).toBeNull();
  });

  it('returns plain text values directly', async () => {
    asyncStore.set('@key', 'legacy-plain');
    const result = await EncryptedAsyncStorage.getItem('@key');
    expect(result).toBe('legacy-plain');
  });

  it('transparently decrypts legacy ENC2: blobs on read', async () => {
    asyncStore.set('@key', 'enc:hello');
    const result = await EncryptedAsyncStorage.getItem('@key');
    expect(result).toBe('hello');
  });

  it('writes back plain text after decrypting a legacy blob', async () => {
    asyncStore.set('@key', 'enc:hello');
    await EncryptedAsyncStorage.getItem('@key');
    expect(asyncStore.get('@key')).toBe('hello');
  });

  it('returns null when legacy decryption fails (auth_failed)', async () => {
    asyncStore.set('@key', 'enc:secret');
    mockTryDecryptField.mockResolvedValueOnce({ ok: false, error: 'auth_failed' } as any);
    const result = await EncryptedAsyncStorage.getItem('@key');
    expect(result).toBeNull();
  });

  it('returns null when legacy decryption fails (key_missing)', async () => {
    asyncStore.set('@key', 'enc:secret');
    mockTryDecryptField.mockResolvedValueOnce({ ok: false, error: 'key_missing' } as any);
    const result = await EncryptedAsyncStorage.getItem('@key');
    expect(result).toBeNull();
  });

  it('round-trips a value written with setItem', async () => {
    await EncryptedAsyncStorage.setItem('@roundtrip', 'my value');
    const result = await EncryptedAsyncStorage.getItem('@roundtrip');
    expect(result).toBe('my value');
  });

  it('reads a plain JSON value correctly', async () => {
    const payload = JSON.stringify({ a: 1 });
    asyncStore.set('@mysky:core_values', payload);
    const result = await EncryptedAsyncStorage.getItem('@mysky:core_values');
    expect(result).toBe(payload);
  });
});

// ─── removeItem ──────────────────────────────────────────────────────────────

describe('EncryptedAsyncStorage.removeItem', () => {
  it('removes the key', async () => {
    asyncStore.set('@key', 'enc:value');
    await EncryptedAsyncStorage.removeItem('@key');
    expect(asyncStore.has('@key')).toBe(false);
  });

  it('does not throw when the key does not exist', async () => {
    await expect(EncryptedAsyncStorage.removeItem('@ghost')).resolves.not.toThrow();
  });

  it('propagates storage errors', async () => {
    AS.removeItem.mockRejectedValueOnce(new Error('Storage error'));
    await expect(EncryptedAsyncStorage.removeItem('@key')).rejects.toThrow('Storage error');
  });
});
