/**
 * encryptedAsyncStorage.test.ts
 *
 * Tests for the EncryptedAsyncStorage compatibility tombstone.
 *
 * The shim no longer encrypts or decrypts. It simply re-exports
 * AccountScopedAsyncStorage so old imports keep working during the
 * Supabase/network-first transition.
 */

const asyncStore = new Map<string, string>();

jest.mock('../accountScopedStorage', () => ({
  AccountScopedAsyncStorage: {
    getItem: jest.fn(async (key: string) => asyncStore.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      asyncStore.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      asyncStore.delete(key);
    }),
  },
}));

import { AccountScopedAsyncStorage } from '../accountScopedStorage';
import { EncryptedAsyncStorage } from '../encryptedAsyncStorage';

const AS = AccountScopedAsyncStorage as jest.Mocked<typeof AccountScopedAsyncStorage>;

beforeEach(() => {
  asyncStore.clear();
  jest.clearAllMocks();

  AS.getItem.mockImplementation(async (key) => asyncStore.get(key) ?? null);
  AS.setItem.mockImplementation(async (key, value) => {
    asyncStore.set(key, value);
  });
  AS.removeItem.mockImplementation(async (key) => {
    asyncStore.delete(key);
  });
});

describe('EncryptedAsyncStorage compatibility shim', () => {
  it('re-exports AccountScopedAsyncStorage', () => {
    expect(EncryptedAsyncStorage).toBe(AccountScopedAsyncStorage);
  });

  it('stores values as plain text', async () => {
    await EncryptedAsyncStorage.setItem('@key', 'plaintext');
    expect(asyncStore.get('@key')).toBe('plaintext');
  });

  it('returns values exactly as stored, including legacy-looking strings', async () => {
    asyncStore.set('@key', 'enc:hello');
    await expect(EncryptedAsyncStorage.getItem('@key')).resolves.toBe('enc:hello');
  });

  it('returns null when key is absent', async () => {
    await expect(EncryptedAsyncStorage.getItem('@missing')).resolves.toBeNull();
  });

  it('removes keys', async () => {
    asyncStore.set('@key', 'value');
    await EncryptedAsyncStorage.removeItem('@key');
    expect(asyncStore.has('@key')).toBe(false);
  });

  it('propagates storage errors', async () => {
    AS.setItem.mockRejectedValueOnce(new Error('Storage error'));
    await expect(EncryptedAsyncStorage.setItem('@key', 'data')).rejects.toThrow('Storage error');
  });
});
