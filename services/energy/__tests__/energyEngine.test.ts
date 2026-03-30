import { EnergyEngine } from '../energyEngine';
import { makeTestChart } from '../../astrology/__tests__/fixtures';

describe('energyEngine', () => {
  describe('EnergyEngine.generateSnapshot()', () => {
    it('returns a snapshot for a chart with a fixed date', () => {
      const chart = makeTestChart();
      const snapshot = EnergyEngine.generateSnapshot(chart, new Date('2025-06-15'));
      expect(snapshot).toBeDefined();
      expect(typeof snapshot.tone).toBe('string');
      expect(typeof snapshot.intensity).toBe('string');
      expect(typeof snapshot.primaryDriver).toBe('string');
      expect(typeof snapshot.quickMeaning).toBe('string');
      expect(Array.isArray(snapshot.chakras)).toBe(true);
      expect(snapshot.chakras.length).toBe(7);
      expect(Array.isArray(snapshot.domains)).toBe(true);
      expect(snapshot.domains.length).toBe(5);
      expect(snapshot.guidance).toBeDefined();
      expect(snapshot.moonPhase).toBeDefined();
    });

    it('produces deterministic result for same date', () => {
      const chart = makeTestChart();
      const d = new Date('2025-03-01');
      const a = EnergyEngine.generateSnapshot(chart, d);
      const b = EnergyEngine.generateSnapshot(chart, d);
      expect(a.tone).toBe(b.tone);
      expect(a.intensity).toBe(b.intensity);
    });

    it('incorporates behavior context when provided', () => {
      const chart = makeTestChart();
      const behavior = { recentMoodScore: 3, recentEnergyLevel: 'low' as const, recentStressLevel: 'high' as const };
      const snapshot = EnergyEngine.generateSnapshot(chart, new Date('2025-06-15'), behavior);
      expect(snapshot).toBeDefined();
      expect(snapshot.primaryDriver).toContain('lower energy');
    });
  });
});
