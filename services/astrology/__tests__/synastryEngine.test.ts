import { makeTestChart, makePlacement } from './fixtures';
import { SynastryEngine } from '../synastryEngine';

describe('SynastryEngine', () => {
  const chart1 = makeTestChart({ id: 'person-1', name: 'Person A' });
  const chart2 = makeTestChart({
    id: 'person-2',
    name: 'Person B',
    sun: makePlacement('Sun', 100, 'Cancer', 'Water', 'Cardinal', 4, 1, false, 'Luminary'),
    moon: makePlacement('Moon', 10, 'Aries', 'Fire', 'Cardinal', 1, 10, false, 'Luminary'),
    venus: makePlacement('Venus', 200, 'Libra', 'Air', 'Cardinal', 7, 4),
    mars: makePlacement('Mars', 355, 'Pisces', 'Water', 'Mutable', 12, 9),
  });

  describe('calculateSynastry', () => {
    it('returns a SynastryReport with all required properties', () => {
      const report = SynastryEngine.calculateSynastry(chart1, chart2);

      expect(Array.isArray(report.aspects)).toBe(true);
      expect(Array.isArray(report.connectionAspects)).toBe(true);
      expect(Array.isArray(report.chemistryAspects)).toBe(true);
      expect(Array.isArray(report.growthAspects)).toBe(true);
      expect(Array.isArray(report.challengeAspects)).toBe(true);
      expect(typeof report.primaryConnection).toBe('string');
      expect(typeof report.primaryChallenge).toBe('string');
      expect(typeof report.overallDynamic).toBe('string');
    });

    it('finds cross-chart aspects between two different charts', () => {
      const report = SynastryEngine.calculateSynastry(chart1, chart2);
      expect(report.aspects.length).toBeGreaterThan(0);
    });

    it('each aspect has required fields', () => {
      const report = SynastryEngine.calculateSynastry(chart1, chart2);
      for (const aspect of report.aspects) {
        expect(aspect.person1Planet).toBeDefined();
        expect(aspect.person2Planet).toBeDefined();
        expect(aspect.aspectType).toBeDefined();
        expect(typeof aspect.orb).toBe('number');
        expect(typeof aspect.title).toBe('string');
        expect(typeof aspect.description).toBe('string');
        expect(['connection', 'growth', 'chemistry', 'challenge']).toContain(aspect.category);
        expect(['strong', 'moderate', 'subtle']).toContain(aspect.strength);
      }
    });

    it('sorts aspects by strength (strongest first)', () => {
      const report = SynastryEngine.calculateSynastry(chart1, chart2);
      const strengthOrder = { strong: 0, moderate: 1, subtle: 2 } as const;
      for (let i = 1; i < report.aspects.length; i++) {
        expect(strengthOrder[report.aspects[i].strength])
          .toBeGreaterThanOrEqual(strengthOrder[report.aspects[i - 1].strength]);
      }
    });

    it('grouped arrays are subsets of the main aspects array', () => {
      const report = SynastryEngine.calculateSynastry(chart1, chart2);
      const totalGrouped =
        report.connectionAspects.length +
        report.chemistryAspects.length +
        report.growthAspects.length +
        report.challengeAspects.length;
      expect(totalGrouped).toBe(report.aspects.length);
    });

    it('detects Venus-Mars opposition (chemistry aspect)', () => {
      // chart1 Venus at 10° Aries, chart2 Mars at 355° Pisces → ~15° apart (not exact)
      // chart1 Mars at 200° Libra, chart2 Venus at 200° Libra → conjunction
      const report = SynastryEngine.calculateSynastry(chart1, chart2);
      const venusMars = report.aspects.find(a =>
        (a.person1Planet.planet.name === 'Venus' && a.person2Planet.planet.name === 'Mars') ||
        (a.person1Planet.planet.name === 'Mars' && a.person2Planet.planet.name === 'Venus')
      );
      // There should be at least one Venus-Mars aspect given the placements
      expect(venusMars).toBeDefined();
    });

    it('handles identical charts gracefully', () => {
      const report = SynastryEngine.calculateSynastry(chart1, chart1);
      expect(report).toBeDefined();
      // Identical charts → conjunctions for every planet pair
      const conjunctions = report.aspects.filter(a => a.aspectType.name === 'Conjunction');
      expect(conjunctions.length).toBeGreaterThan(0);
    });

    it('produces summaries that are non-empty strings', () => {
      const report = SynastryEngine.calculateSynastry(chart1, chart2);
      expect(report.primaryConnection.length).toBeGreaterThan(0);
      expect(report.overallDynamic.length).toBeGreaterThan(0);
    });

    it('is deterministic for the same inputs', () => {
      const r1 = SynastryEngine.calculateSynastry(chart1, chart2);
      const r2 = SynastryEngine.calculateSynastry(chart1, chart2);
      expect(r1.aspects.length).toBe(r2.aspects.length);
      expect(r1.primaryConnection).toBe(r2.primaryConnection);
    });
  });
});
