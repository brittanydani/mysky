import { getPlanetDignity, analyzeChartDignity, analyzeDispositorChain, detectChartShape, detectSingletons, detectInterceptions } from '../dignityService';
import { makeTestChart, makePlacement, makeAspect } from './fixtures';

describe('dignityService', () => {
  const chart = makeTestChart();

  describe('getPlanetDignity()', () => {
    it('Sun in Leo is domicile', () => {
      const d = getPlanetDignity('Sun', 'Leo');
      expect(d.dignity).toBe('domicile');
      expect(d.planet).toBe('Sun');
      expect(d.sign).toBe('Leo');
    });

    it('Sun in Aries is exaltation', () => {
      expect(getPlanetDignity('Sun', 'Aries').dignity).toBe('exaltation');
    });

    it('Sun in Aquarius is detriment', () => {
      expect(getPlanetDignity('Sun', 'Aquarius').dignity).toBe('detriment');
    });

    it('Sun in Libra is fall', () => {
      expect(getPlanetDignity('Sun', 'Libra').dignity).toBe('fall');
    });

    it('Sun in Gemini is peregrine', () => {
      expect(getPlanetDignity('Sun', 'Gemini').dignity).toBe('peregrine');
    });

    it('Moon in Cancer is domicile', () => {
      expect(getPlanetDignity('Moon', 'Cancer').dignity).toBe('domicile');
    });

    it('Venus in Taurus is domicile', () => {
      expect(getPlanetDignity('Venus', 'Taurus').dignity).toBe('domicile');
    });

    it('Mars in Capricorn is exaltation', () => {
      expect(getPlanetDignity('Mars', 'Capricorn').dignity).toBe('exaltation');
    });

    it('returns label string', () => {
      const d = getPlanetDignity('Sun', 'Leo');
      expect(d.label).toBeTruthy();
      expect(typeof d.label).toBe('string');
    });

    it('returns numeric score', () => {
      const d = getPlanetDignity('Sun', 'Leo');
      expect(typeof d.score).toBe('number');
    });
  });

  describe('analyzeChartDignity()', () => {
    it('returns analysis with all fields', () => {
      const analysis = analyzeChartDignity(chart);
      expect(analysis.planetDignities).toBeDefined();
      expect(Array.isArray(analysis.planetDignities)).toBe(true);
      expect(analysis.planetDignities.length).toBeGreaterThan(0);
      expect(typeof analysis.totalDignityScore).toBe('number');
      expect(typeof analysis.summary).toBe('string');
      expect(Array.isArray(analysis.strongestPlanets)).toBe(true);
      expect(Array.isArray(analysis.challengedPlanets)).toBe(true);
    });

    it('includes dignity for each core planet', () => {
      const analysis = analyzeChartDignity(chart);
      const planets = analysis.planetDignities.map((d: any) => d.planet);
      expect(planets).toContain('Sun');
      expect(planets).toContain('Moon');
    });
  });

  describe('analyzeDispositorChain()', () => {
    it('returns chain with final dispositor', () => {
      const chain = analyzeDispositorChain(chart);
      expect(Array.isArray(chain.chain)).toBe(true);
      expect(typeof chain.description).toBe('string');
    });

    it('detects mutual receptions if present', () => {
      const chain = analyzeDispositorChain(chart);
      expect(Array.isArray(chain.mutualReceptions)).toBe(true);
    });
  });

  describe('detectChartShape()', () => {
    it('returns a valid shape', () => {
      const result = detectChartShape(chart);
      const validShapes = ['Bundle', 'Bowl', 'Bucket', 'Locomotive', 'Seesaw', 'Splash', 'Splay', 'Unknown'];
      expect(validShapes).toContain(result.shape);
      expect(typeof result.description).toBe('string');
    });
  });

  describe('detectSingletons()', () => {
    it('returns array', () => {
      const result = detectSingletons(chart);
      expect(Array.isArray(result)).toBe(true);
    });

    it('each singleton has required fields', () => {
      const result = detectSingletons(chart);
      for (const s of result) {
        expect(s.planet).toBeTruthy();
        expect(s.type).toBeTruthy();
        expect(typeof s.description).toBe('string');
      }
    });
  });

  describe('detectInterceptions()', () => {
    it('returns array', () => {
      const result = detectInterceptions(chart);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
