import { EncryptionManager, EncryptedPayload } from '../encryptionManager';

describe('EncryptionManager', () => {
  describe('signSensitiveData', () => {
    it('returns an EncryptedPayload with version, digest, data, and createdAt', async () => {
      const payload = await EncryptionManager.signSensitiveData({ name: 'Test', age: 30 });

      expect(payload.version).toBe(1);
      expect(typeof payload.digest).toBe('string');
      expect(payload.digest.length).toBeGreaterThan(0);
      expect(typeof payload.data).toBe('string');
      expect(typeof payload.createdAt).toBe('string');
    });

    it('stores data as serialized JSON', async () => {
      const original = { foo: 'bar', count: 42 };
      const payload = await EncryptionManager.signSensitiveData(original);

      const parsed = JSON.parse(payload.data);
      expect(parsed).toEqual(original);
    });

    it('produces different digests for different data', async () => {
      const p1 = await EncryptionManager.signSensitiveData({ a: 1 });
      const p2 = await EncryptionManager.signSensitiveData({ a: 2 });
      expect(p1.digest).not.toBe(p2.digest);
    });

    it('produces consistent digest for same data', async () => {
      const data = { message: 'hello' };
      const p1 = await EncryptionManager.signSensitiveData(data);
      const p2 = await EncryptionManager.signSensitiveData(data);
      expect(p1.digest).toBe(p2.digest);
    });
  });

  describe('verifySensitiveData', () => {
    it('returns parsed data for a valid payload', async () => {
      const original = { name: 'Test', value: 123 };
      const payload = await EncryptionManager.signSensitiveData(original);
      const result = await EncryptionManager.verifySensitiveData<typeof original>(payload);

      expect(result).toEqual(original);
    });

    it('throws for tampered data', async () => {
      const payload = await EncryptionManager.signSensitiveData({ safe: true });
      const tampered: EncryptedPayload = { ...payload, data: '{"safe":false}' };

      await expect(EncryptionManager.verifySensitiveData(tampered)).rejects.toThrow('integrity');
    });

    it('throws for invalid digest', async () => {
      const payload = await EncryptionManager.signSensitiveData({ ok: true });
      const tampered: EncryptedPayload = { ...payload, digest: 'bad_digest' };

      await expect(EncryptionManager.verifySensitiveData(tampered)).rejects.toThrow();
    });
  });

  describe('tryParseSensitiveData', () => {
    it('returns parsed data without verification', () => {
      const payload: EncryptedPayload = {
        version: 1,
        digest: 'anything',
        data: '{"name":"Test"}',
        createdAt: new Date().toISOString(),
      };

      const result = EncryptionManager.tryParseSensitiveData<{ name: string }>(payload);
      expect(result).toEqual({ name: 'Test' });
    });

    it('returns null for invalid JSON', () => {
      const payload: EncryptedPayload = {
        version: 1,
        digest: '',
        data: 'not-json',
        createdAt: new Date().toISOString(),
      };

      expect(EncryptionManager.tryParseSensitiveData(payload)).toBeNull();
    });

    it('returns null for null/undefined payload', () => {
      expect(EncryptionManager.tryParseSensitiveData(null as any)).toBeNull();
      expect(EncryptionManager.tryParseSensitiveData(undefined as any)).toBeNull();
    });
  });

  describe('validateEncryptionIntegrity', () => {
    it('returns true for valid payload', async () => {
      const payload = await EncryptionManager.signSensitiveData({ test: 1 });
      const valid = await EncryptionManager.validateEncryptionIntegrity(payload);
      expect(valid).toBe(true);
    });

    it('returns false for tampered payload', async () => {
      const payload = await EncryptionManager.signSensitiveData({ test: 1 });
      const tampered = { ...payload, data: '{"test":999}' };
      const valid = await EncryptionManager.validateEncryptionIntegrity(tampered);
      expect(valid).toBe(false);
    });

    it('returns false for missing data or digest', async () => {
      expect(await EncryptionManager.validateEncryptionIntegrity({} as any)).toBe(false);
      expect(await EncryptionManager.validateEncryptionIntegrity(null as any)).toBe(false);
    });
  });

  describe('reSignPayload', () => {
    it('creates a new payload with updated digest', async () => {
      const original = await EncryptionManager.signSensitiveData({ key: 'value' });
      const reSigned = await EncryptionManager.reSignPayload(original);

      expect(reSigned.data).toBe(original.data);
      expect(reSigned.digest).toBe(original.digest); // same key, same data → same digest
    });
  });

  describe('round-trip sign + verify', () => {
    it('handles arrays', async () => {
      const data = [1, 2, 3, 'four'];
      const payload = await EncryptionManager.signSensitiveData(data);
      const result = await EncryptionManager.verifySensitiveData<typeof data>(payload);
      expect(result).toEqual(data);
    });

    it('handles nested objects', async () => {
      const data = { user: { name: 'Test', prefs: { dark: true } } };
      const payload = await EncryptionManager.signSensitiveData(data);
      const result = await EncryptionManager.verifySensitiveData<typeof data>(payload);
      expect(result).toEqual(data);
    });

    it('handles strings', async () => {
      const data = 'hello world';
      const payload = await EncryptionManager.signSensitiveData(data);
      const result = await EncryptionManager.verifySensitiveData<string>(payload);
      expect(result).toBe(data);
    });
  });
});
