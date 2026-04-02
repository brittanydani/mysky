/**
 * Astrology Settings Service
 * 
 * Manages user preferences for chart calculations:
 * - House system selection (7 options)
 * - Zodiac system (Tropical / Sidereal with ayanamsa selection)
 * - Orb presets (tight, normal, wide)
 * - Asteroid display (Chiron, Juno, Pallas, Vesta, Ceres)
 * 
 * Persists to SecureStore for privacy compliance.
 */

import * as SecureStore from 'expo-secure-store';
import { HouseSystem, ZodiacSystem, Ayanamsa } from './types';
import { logger } from '../../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type OrbPreset = 'tight' | 'normal' | 'wide';

export type ChartOrientation = 'standard-natal' | 'midheaven-top' | 'aries-rising';

export { ZodiacSystem, Ayanamsa } from './types';

export interface OrbConfiguration {
  conjunction: number;
  opposition: number;
  square: number;
  trine: number;
  sextile: number;
  // Minor aspects
  quincunx?: number;
  semisextile?: number;
  semisquare?: number;
  sesquiquadrate?: number;
  // Creative aspects
  quintile?: number;
  biquintile?: number;
}

export interface AstrologySettings {
  // House system: placidus (default), whole-sign, equal-house, koch, etc.
  houseSystem: HouseSystem;
  
  // Zodiac system: tropical (Western) or sidereal (Vedic/Jyotish)
  zodiacSystem: ZodiacSystem;
  
  // Ayanamsa correction for sidereal mode (ignored in tropical)
  ayanamsa: Ayanamsa;
  
  // Orb preset: affects how wide aspects are considered
  orbPreset: OrbPreset;
  
  // Custom orbs (only used if orbPreset is 'custom' - future feature)
  customOrbs?: OrbConfiguration;
  
  // Display preferences
  showMinorAspects: boolean;
  showAsteroid: boolean; // Ceres, Pallas, Juno, Vesta (+ Pholus in advanced)

  // Lilith calculation method: 'mean' = Black Moon Lilith (Mean Apogee),
  // 'true' = Black Moon Lilith (Osculating/True Apogee).
  // Both appear as a single "Lilith" placement; only the calculation differs.
  lilitMethod: 'mean' | 'true';

  // Chart wheel visual orientation (display only — does not affect calculations)
  chartOrientation: ChartOrientation;

  // Last updated
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'astrology_settings';

export const HOUSE_SYSTEM_OPTIONS: { value: HouseSystem; label: string; description: string }[] = [
  { value: 'whole-sign', label: 'Whole Sign', description: 'Traditional/Hellenistic, rising sign = 1st house' },
  { value: 'placidus', label: 'Placidus', description: 'Most common in Western astrology' },
  { value: 'equal-house', label: 'Equal House', description: 'Each house is exactly 30°' },
  { value: 'koch', label: 'Koch', description: 'Time-based division, popular in Europe' },
  { value: 'campanus', label: 'Campanus', description: 'Space-based, good for extreme latitudes' },
  { value: 'regiomontanus', label: 'Regiomontanus', description: 'Medieval system, horary astrology' },
  { value: 'topocentric', label: 'Topocentric', description: 'Modern refinement of Placidus' },
];

export const ZODIAC_SYSTEM_OPTIONS: { value: ZodiacSystem; label: string; description: string }[] = [
  { value: 'tropical', label: 'Tropical', description: 'Western astrology standard, based on seasons' },
  { value: 'sidereal', label: 'Sidereal', description: 'Vedic/Jyotish, aligned with fixed stars' },
];

export const AYANAMSA_OPTIONS: { value: Ayanamsa; label: string; description: string }[] = [
  { value: 'lahiri', label: 'Lahiri (Chitrapaksha)', description: 'Most common in Indian/Vedic astrology' },
  { value: 'raman', label: 'B.V. Raman', description: 'Popular alternative in South Indian tradition' },
  { value: 'krishnamurti', label: 'Krishnamurti (KP)', description: 'Used in Krishnamurti Paddhati system' },
  { value: 'fagan-bradley', label: 'Fagan-Bradley', description: 'Common in Western sidereal astrology' },
];

export const CHART_ORIENTATION_OPTIONS: { value: ChartOrientation; label: string; description: string }[] = [
  { value: 'standard-natal', label: 'Standard Natal', description: 'Places the Ascendant on the left side of the wheel and the Midheaven near the top. This is the most common natal chart view and matches the way charts are typically displayed in mainstream astrology software.' },
  { value: 'midheaven-top', label: 'Midheaven on Top', description: 'Midheaven at 12 o\u2019clock \u2014 emphasizes the career and public-life axis. A recognizable alternative that highlights the four chart angles.' },
  { value: 'aries-rising', label: 'Aries First', description: '0\u00b0 Aries at 9 o\u2019clock \u2014 a teaching or reference layout. Typical when not anchoring to a personal Ascendant, such as solar or whole-sign schematic wheels.' },
];

export const ORB_PRESET_OPTIONS: { value: OrbPreset; label: string; description: string }[] = [
  { value: 'tight', label: 'Tight', description: 'Smaller orbs, only strongest aspects' },
  { value: 'normal', label: 'Normal', description: 'Standard orbs, balanced approach' },
  { value: 'wide', label: 'Wide', description: 'Larger orbs, more aspects detected' },
];

// Orb configurations per preset
export const ORB_CONFIGURATIONS: Record<OrbPreset, OrbConfiguration> = {
  tight: {
    conjunction: 6,
    opposition: 6,
    square: 5,
    trine: 5,
    sextile: 3,
    quincunx: 2,
    semisextile: 1,
    semisquare: 1,
    sesquiquadrate: 1,
    quintile: 1,
    biquintile: 1,
  },
  normal: {
    conjunction: 8,
    opposition: 8,
    square: 6,
    trine: 6,
    sextile: 4,
    quincunx: 3,
    semisextile: 2,
    semisquare: 2,
    sesquiquadrate: 2,
    quintile: 2,
    biquintile: 2,
  },
  wide: {
    conjunction: 10,
    opposition: 10,
    square: 8,
    trine: 8,
    sextile: 6,
    quincunx: 4,
    semisextile: 3,
    semisquare: 3,
    sesquiquadrate: 3,
    quintile: 2,
    biquintile: 2,
  },
};

const DEFAULT_SETTINGS: AstrologySettings = {
  houseSystem: 'placidus',
  zodiacSystem: 'tropical',
  ayanamsa: 'lahiri',
  orbPreset: 'normal',
  showMinorAspects: false,
  showAsteroid: true,
  lilitMethod: 'mean',
  chartOrientation: 'standard-natal',
  updatedAt: new Date().toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Service Class
// ─────────────────────────────────────────────────────────────────────────────

class AstrologySettingsServiceClass {
  private cachedSettings: AstrologySettings | null = null;

  /**
   * Get current astrology settings
   */
  async getSettings(): Promise<AstrologySettings> {
    // Return cached if available
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    try {
      const stored = await SecureStore.getItemAsync(SETTINGS_KEY);
      
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AstrologySettings>;
        // Merge with defaults to handle new fields
        this.cachedSettings = { ...DEFAULT_SETTINGS, ...parsed };
      } else {
        this.cachedSettings = { ...DEFAULT_SETTINGS };
      }
      
      return this.cachedSettings;
    } catch (error) {
      logger.error('[AstrologySettings] Failed to load settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save astrology settings
   */
  async saveSettings(settings: Partial<AstrologySettings>): Promise<AstrologySettings> {
    try {
      const current = await this.getSettings();
      const updated: AstrologySettings = {
        ...current,
        ...settings,
        updatedAt: new Date().toISOString(),
      };

      await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(updated));
      this.cachedSettings = updated;
      
      logger.info('[AstrologySettings] Settings saved:', {
        houseSystem: updated.houseSystem,
        orbPreset: updated.orbPreset,
      });

      return updated;
    } catch (error) {
      logger.error('[AstrologySettings] Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Get house system preference
   */
  async getHouseSystem(): Promise<HouseSystem> {
    const settings = await this.getSettings();
    return settings.houseSystem;
  }

  /**
   * Set house system preference
   */
  async setHouseSystem(houseSystem: HouseSystem): Promise<void> {
    await this.saveSettings({ houseSystem });
  }

  /**
   * Get zodiac system preference
   */
  async getZodiacSystem(): Promise<ZodiacSystem> {
    const settings = await this.getSettings();
    return settings.zodiacSystem;
  }

  /**
   * Set zodiac system preference
   */
  async setZodiacSystem(zodiacSystem: ZodiacSystem): Promise<void> {
    await this.saveSettings({ zodiacSystem });
  }

  /**
   * Get ayanamsa preference (relevant only in sidereal mode)
   */
  async getAyanamsa(): Promise<Ayanamsa> {
    const settings = await this.getSettings();
    return settings.ayanamsa;
  }

  /**
   * Set ayanamsa preference
   */
  async setAyanamsa(ayanamsa: Ayanamsa): Promise<void> {
    await this.saveSettings({ ayanamsa });
  }

  /**
   * Get orb preset
   */
  async getOrbPreset(): Promise<OrbPreset> {
    const settings = await this.getSettings();
    return settings.orbPreset;
  }

  /**
   * Set orb preset
   */
  async setOrbPreset(orbPreset: OrbPreset): Promise<void> {
    await this.saveSettings({ orbPreset });
  }

  /**
   * Get orb configuration based on current preset
   */
  async getOrbConfiguration(): Promise<OrbConfiguration> {
    const settings = await this.getSettings();
    
    if (settings.orbPreset === 'tight' || settings.orbPreset === 'normal' || settings.orbPreset === 'wide') {
      return ORB_CONFIGURATIONS[settings.orbPreset];
    }
    
    // Future: custom orbs
    return settings.customOrbs || ORB_CONFIGURATIONS.normal;
  }

  /**
   * Get specific orb value for an aspect type
   */
  async getOrb(aspectType: keyof OrbConfiguration): Promise<number> {
    const config = await this.getOrbConfiguration();
    return config[aspectType] ?? ORB_CONFIGURATIONS.normal[aspectType] ?? 6;
  }

  /**
   * Reset to default settings
   */
  async resetToDefaults(): Promise<AstrologySettings> {
    await SecureStore.deleteItemAsync(SETTINGS_KEY);
    this.cachedSettings = null;
    return this.getSettings();
  }

  /**
   * Clear cache (useful after app resume)
   */
  clearCache(): void {
    this.cachedSettings = null;
  }

  /**
   * Get orb configuration synchronously from cache.
   * Falls back to 'normal' if settings haven't been loaded yet.
   * This allows the synchronous calculator to respect user orb preferences.
   */
  getCachedOrbConfig(): OrbConfiguration {
    const preset = this.cachedSettings?.orbPreset ?? 'normal';
    return ORB_CONFIGURATIONS[preset] ?? ORB_CONFIGURATIONS.normal;
  }

  /**
   * Get full settings synchronously from cache.
   * Returns null if settings haven't been loaded yet.
   */
  getCachedSettings(): AstrologySettings | null {
    return this.cachedSettings;
  }

  /**
   * Get human-readable label for a house system
   */
  getHouseSystemLabel(houseSystem: HouseSystem): string {
    const option = HOUSE_SYSTEM_OPTIONS.find(o => o.value === houseSystem);
    return option?.label || houseSystem;
  }

  /**
   * Get human-readable label for orb preset
   */
  getOrbPresetLabel(orbPreset: OrbPreset): string {
    const option = ORB_PRESET_OPTIONS.find(o => o.value === orbPreset);
    return option?.label || orbPreset;
  }
}

// Export singleton
export const AstrologySettingsService = new AstrologySettingsServiceClass();
