// expo-secure-store is auto-mocked via moduleNameMapper — in-memory map.

jest.mock('../../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import {
  AstrologySettingsService,
  ORB_CONFIGURATIONS,
  HOUSE_SYSTEM_OPTIONS,
  ORB_PRESET_OPTIONS,
} from '../astrologySettingsService';

// Reset the singleton's in-memory cache and the entire mock SecureStore between tests.
// Deleting only the settings key is insufficient when other test suites write to the
// same mock store (module-level Map) and Jest runs suites in the same worker process.
async function resetService() {
  AstrologySettingsService.clearCache();
  const SecureStore = require('expo-secure-store');
  // Clear all keys in the mock store to prevent cross-suite pollution.
  if (typeof SecureStore.__clearAll === 'function') {
    SecureStore.__clearAll();
  } else {
    await SecureStore.deleteItemAsync('astrology_settings');
  }
}

describe('AstrologySettingsService', () => {
  beforeEach(async () => {
    await resetService();
    jest.clearAllMocks();
  });

  // ── getSettings / defaults ───────────────────────────────────────────────
  describe('getSettings()', () => {
    it('returns default settings when nothing is stored', async () => {
      const settings = await AstrologySettingsService.getSettings();
      expect(settings.houseSystem).toBe('whole-sign');
      expect(settings.zodiacSystem).toBe('tropical');
      expect(settings.ayanamsa).toBe('lahiri');
      expect(settings.orbPreset).toBe('normal');
      expect(settings.showMinorAspects).toBe(false);
      expect(settings.showAsteroid).toBe(true);
      expect(settings.lilitMethod).toBe('mean');
    });

    it('returns cached result on second call without hitting SecureStore again', async () => {
      const SecureStore = require('expo-secure-store');
      const getSpy = jest.spyOn(SecureStore, 'getItemAsync');
      await AstrologySettingsService.getSettings();
      await AstrologySettingsService.getSettings();
      // Should only read from SecureStore once
      expect(getSpy).toHaveBeenCalledTimes(1);
    });

    it('merges stored partial settings with defaults (handles new fields)', async () => {
      const SecureStore = require('expo-secure-store');
      // Simulate old stored settings without lilitMethod
      await SecureStore.setItemAsync('astrology_settings', JSON.stringify({
        houseSystem: 'placidus',
        zodiacSystem: 'tropical',
        orbPreset: 'tight',
      }));
      const settings = await AstrologySettingsService.getSettings();
      expect(settings.houseSystem).toBe('placidus');
      expect(settings.orbPreset).toBe('tight');
      // New field should be filled from defaults
      expect(settings.lilitMethod).toBe('mean');
    });

    it('returns defaults when SecureStore throws', async () => {
      const SecureStore = require('expo-secure-store');
      jest.spyOn(SecureStore, 'getItemAsync').mockRejectedValueOnce(new Error('Keychain locked'));
      const settings = await AstrologySettingsService.getSettings();
      expect(settings.houseSystem).toBe('whole-sign');
    });
  });

  // ── saveSettings ────────────────────────────────────────────────────────
  describe('saveSettings()', () => {
    it('persists a partial settings update', async () => {
      await AstrologySettingsService.saveSettings({ houseSystem: 'placidus' });
      AstrologySettingsService.clearCache();
      const settings = await AstrologySettingsService.getSettings();
      expect(settings.houseSystem).toBe('placidus');
    });

    it('updates updatedAt on every save', async () => {
      const s1 = await AstrologySettingsService.saveSettings({ orbPreset: 'tight' });
      await new Promise(r => setTimeout(r, 5));
      const s2 = await AstrologySettingsService.saveSettings({ orbPreset: 'wide' });
      expect(s2.updatedAt >= s1.updatedAt).toBe(true);
    });

    it('throws and propagates when SecureStore throws', async () => {
      const SecureStore = require('expo-secure-store');
      jest.spyOn(SecureStore, 'setItemAsync').mockRejectedValueOnce(new Error('Full'));
      await expect(AstrologySettingsService.saveSettings({ orbPreset: 'tight' })).rejects.toThrow('Full');
    });
  });

  // ── individual setters / getters ─────────────────────────────────────────
  describe('setHouseSystem() / getHouseSystem()', () => {
    it('round-trips house system', async () => {
      await AstrologySettingsService.setHouseSystem('koch');
      AstrologySettingsService.clearCache();
      expect(await AstrologySettingsService.getHouseSystem()).toBe('koch');
    });
  });

  describe('setZodiacSystem() / getZodiacSystem()', () => {
    it('round-trips zodiac system', async () => {
      await AstrologySettingsService.setZodiacSystem('sidereal');
      AstrologySettingsService.clearCache();
      expect(await AstrologySettingsService.getZodiacSystem()).toBe('sidereal');
    });
  });

  describe('setAyanamsa() / getAyanamsa()', () => {
    it('round-trips ayanamsa', async () => {
      await AstrologySettingsService.setAyanamsa('raman');
      AstrologySettingsService.clearCache();
      expect(await AstrologySettingsService.getAyanamsa()).toBe('raman');
    });
  });

  describe('setOrbPreset() / getOrbPreset()', () => {
    it('round-trips orb preset', async () => {
      await AstrologySettingsService.setOrbPreset('wide');
      AstrologySettingsService.clearCache();
      expect(await AstrologySettingsService.getOrbPreset()).toBe('wide');
    });
  });

  // ── getOrbConfiguration ──────────────────────────────────────────────────
  describe('getOrbConfiguration()', () => {
    it('returns tight config when preset is tight', async () => {
      await AstrologySettingsService.setOrbPreset('tight');
      const orbs = await AstrologySettingsService.getOrbConfiguration();
      expect(orbs).toEqual(ORB_CONFIGURATIONS.tight);
      expect(orbs.conjunction).toBe(6);
    });

    it('returns wide config when preset is wide', async () => {
      await AstrologySettingsService.setOrbPreset('wide');
      const orbs = await AstrologySettingsService.getOrbConfiguration();
      expect(orbs.conjunction).toBe(10);
    });

    it('returns normal config by default', async () => {
      const orbs = await AstrologySettingsService.getOrbConfiguration();
      expect(orbs).toEqual(ORB_CONFIGURATIONS.normal);
    });
  });

  // ── getOrb ───────────────────────────────────────────────────────────────
  describe('getOrb()', () => {
    it('returns the conjunction orb for normal preset', async () => {
      const orb = await AstrologySettingsService.getOrb('conjunction');
      expect(orb).toBe(ORB_CONFIGURATIONS.normal.conjunction);
    });

    it('returns a fallback for unknown aspect types', async () => {
      const orb = await AstrologySettingsService.getOrb('nonExistent' as any);
      expect(typeof orb).toBe('number');
    });
  });

  // ── resetToDefaults ──────────────────────────────────────────────────────
  describe('resetToDefaults()', () => {
    it('restores default settings after custom values were saved', async () => {
      await AstrologySettingsService.setHouseSystem('campanus');
      const reset = await AstrologySettingsService.resetToDefaults();
      expect(reset.houseSystem).toBe('whole-sign');
    });
  });

  // ── getCachedOrbConfig / getCachedSettings ───────────────────────────────
  describe('getCachedOrbConfig()', () => {
    it('returns normal config before settings are loaded', () => {
      AstrologySettingsService.clearCache();
      const orbs = AstrologySettingsService.getCachedOrbConfig();
      expect(orbs).toEqual(ORB_CONFIGURATIONS.normal);
    });

    it('returns the cached preset after loading', async () => {
      await AstrologySettingsService.setOrbPreset('tight');
      const orbs = AstrologySettingsService.getCachedOrbConfig();
      expect(orbs).toEqual(ORB_CONFIGURATIONS.tight);
    });
  });

  describe('getCachedSettings()', () => {
    it('returns null before any load', () => {
      AstrologySettingsService.clearCache();
      expect(AstrologySettingsService.getCachedSettings()).toBeNull();
    });

    it('returns settings after getSettings() is called', async () => {
      await AstrologySettingsService.getSettings();
      expect(AstrologySettingsService.getCachedSettings()).not.toBeNull();
    });
  });

  // ── label helpers ────────────────────────────────────────────────────────
  describe('getHouseSystemLabel()', () => {
    it('returns the label for a known house system', () => {
      HOUSE_SYSTEM_OPTIONS.forEach(({ value, label }) => {
        expect(AstrologySettingsService.getHouseSystemLabel(value)).toBe(label);
      });
    });

    it('falls back to the raw value for unknown house systems', () => {
      expect(AstrologySettingsService.getHouseSystemLabel('unknown' as any)).toBe('unknown');
    });
  });

  describe('getOrbPresetLabel()', () => {
    it('returns the label for a known preset', () => {
      ORB_PRESET_OPTIONS.forEach(({ value, label }) => {
        expect(AstrologySettingsService.getOrbPresetLabel(value)).toBe(label);
      });
    });

    it('falls back to the raw value for unknown presets', () => {
      expect(AstrologySettingsService.getOrbPresetLabel('extreme' as any)).toBe('extreme');
    });
  });
});
