// expo-secure-store is auto-mocked via moduleNameMapper in jest.config.js.
// The mock is an in-memory Map, so we can test full round-trips.

jest.mock('../logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { IdentityVault, CosmicIdentity } from '../IdentityVault';

const sample: CosmicIdentity = {
  name: 'Astrid',
  birthDate: '1990-06-15',
  birthTime: '14:30',
  hasUnknownTime: false,
  locationCity: 'Portland',
  locationLat: 45.5051,
  locationLng: -122.675,
  timezone: 'America/Los_Angeles',
};

describe('IdentityVault', () => {
  beforeEach(async () => {
    // Clear the in-memory secure store before each test
    await IdentityVault.destroyIdentity();
  });

  describe('sealIdentity()', () => {
    it('returns true when the identity is sealed successfully', async () => {
      const result = await IdentityVault.sealIdentity(sample);
      expect(result).toBe(true);
    });

    it('persists the identity so openVault can retrieve it', async () => {
      await IdentityVault.sealIdentity(sample);
      const retrieved = await IdentityVault.openVault();
      expect(retrieved).toEqual(sample);
    });

    it('overwrites a previously sealed identity', async () => {
      await IdentityVault.sealIdentity(sample);
      const updated: CosmicIdentity = { ...sample, name: 'Nova', birthDate: '1995-03-22' };
      await IdentityVault.sealIdentity(updated);
      const result = await IdentityVault.openVault();
      expect(result?.name).toBe('Nova');
    });

    it('returns false when SecureStore throws', async () => {
      const SecureStore = require('expo-secure-store');
      const original = SecureStore.setItemAsync;
      SecureStore.setItemAsync = jest.fn().mockRejectedValue(new Error('Keychain locked'));
      const result = await IdentityVault.sealIdentity(sample);
      expect(result).toBe(false);
      SecureStore.setItemAsync = original;
    });
  });

  describe('openVault()', () => {
    it('returns null when nothing has been sealed', async () => {
      const result = await IdentityVault.openVault();
      expect(result).toBeNull();
    });

    it('deserializes all fields correctly', async () => {
      await IdentityVault.sealIdentity(sample);
      const identity = await IdentityVault.openVault();
      expect(identity?.birthDate).toBe('1990-06-15');
      expect(identity?.locationLat).toBeCloseTo(45.5051);
      expect(identity?.hasUnknownTime).toBe(false);
    });

    it('handles missing optional fields (birthTime, timezone)', async () => {
      const minimal: CosmicIdentity = {
        name: 'Anon',
        birthDate: '2000-01-01',
        hasUnknownTime: true,
        locationCity: 'Unknown',
        locationLat: 0,
        locationLng: 0,
      };
      await IdentityVault.sealIdentity(minimal);
      const result = await IdentityVault.openVault();
      expect(result?.birthTime).toBeUndefined();
      expect(result?.timezone).toBeUndefined();
    });

    it('returns null when SecureStore throws', async () => {
      const SecureStore = require('expo-secure-store');
      const original = SecureStore.getItemAsync;
      SecureStore.getItemAsync = jest.fn().mockRejectedValue(new Error('Hardware error'));
      const result = await IdentityVault.openVault();
      expect(result).toBeNull();
      SecureStore.getItemAsync = original;
    });
  });

  describe('destroyIdentity()', () => {
    it('removes the sealed identity so openVault returns null', async () => {
      await IdentityVault.sealIdentity(sample);
      await IdentityVault.destroyIdentity();
      const result = await IdentityVault.openVault();
      expect(result).toBeNull();
    });

    it('does not throw when there is nothing to destroy', async () => {
      await expect(IdentityVault.destroyIdentity()).resolves.not.toThrow();
    });
  });
});
