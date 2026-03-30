import { EmotionalOperatingSystemGenerator } from '../emotionalOperatingSystem';
import { makeTestChart } from './fixtures';

describe('emotionalOperatingSystem', () => {
  const chart = makeTestChart();

  describe('generateEmotionalOS()', () => {
    it('returns all subsystems', () => {
      const os = EmotionalOperatingSystemGenerator.generateEmotionalOS(chart);
      expect(os).toHaveProperty('emotionalLanguage');
      expect(os).toHaveProperty('protectionStyle');
      expect(os).toHaveProperty('drainingSituations');
      expect(os).toHaveProperty('feelingChosenTriggers');
      expect(os).toHaveProperty('loveWound');
      expect(os).toHaveProperty('repairStyle');
      expect(os).toHaveProperty('innerChildTheme');
    });

    describe('emotionalLanguage', () => {
      it('has required fields', () => {
        const { emotionalLanguage } = EmotionalOperatingSystemGenerator.generateEmotionalOS(chart);
        expect(typeof emotionalLanguage.primaryMode).toBe('string');
        expect(typeof emotionalLanguage.expression).toBe('string');
        expect(typeof emotionalLanguage.needsToFeel).toBe('string');
        expect(Array.isArray(emotionalLanguage.overwhelmSigns)).toBe(true);
      });
    });

    describe('protectionStyle', () => {
      it('has defense and safety needs', () => {
        const { protectionStyle } = EmotionalOperatingSystemGenerator.generateEmotionalOS(chart);
        expect(typeof protectionStyle.primaryDefense).toBe('string');
        expect(Array.isArray(protectionStyle.triggers)).toBe(true);
        expect(Array.isArray(protectionStyle.safetyNeeds)).toBe(true);
      });
    });

    describe('loveWound', () => {
      it('has healing path', () => {
        const { loveWound } = EmotionalOperatingSystemGenerator.generateEmotionalOS(chart);
        expect(typeof loveWound.coreWound).toBe('string');
        expect(typeof loveWound.healingPath).toBe('string');
        expect(Array.isArray(loveWound.greenFlags)).toBe(true);
      });
    });

    describe('repairStyle', () => {
      it('has conflict response and repair needs', () => {
        const { repairStyle } = EmotionalOperatingSystemGenerator.generateEmotionalOS(chart);
        expect(typeof repairStyle.conflictResponse).toBe('string');
        expect(Array.isArray(repairStyle.repairNeeds)).toBe(true);
        expect(typeof repairStyle.reconnectionPath).toBe('string');
      });
    });

    describe('innerChildTheme', () => {
      it('has core need and play style', () => {
        const { innerChildTheme } = EmotionalOperatingSystemGenerator.generateEmotionalOS(chart);
        expect(typeof innerChildTheme.coreNeed).toBe('string');
        expect(typeof innerChildTheme.playStyle).toBe('string');
      });
    });

    it('draining situations is non-empty array', () => {
      const os = EmotionalOperatingSystemGenerator.generateEmotionalOS(chart);
      expect(os.drainingSituations.length).toBeGreaterThan(0);
    });

    it('feeling chosen triggers is non-empty array', () => {
      const os = EmotionalOperatingSystemGenerator.generateEmotionalOS(chart);
      expect(os.feelingChosenTriggers.length).toBeGreaterThan(0);
    });
  });
});
