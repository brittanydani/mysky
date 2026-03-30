import { makeTestChart, makePlacement } from './fixtures';
import { getTransitingLongitudes, getTransitInfo, computeTransitAspectsToNatal } from '../transits';

describe('transits', () => {
  const lat = 40.7128;
  const lon = -74.006;
  const date = new Date('2025-06-15T12:00:00Z');

  describe('getTransitingLongitudes', () => {
    it('returns longitudes for all major planets', () => {
      const result = getTransitingLongitudes(date, lat, lon);
      expect(result).toBeDefined();
      expect(typeof result.Sun).toBe('number');
      expect(typeof result.Moon).toBe('number');
      expect(typeof result.Mercury).toBe('number');
      expect(typeof result.Venus).toBe('number');
      expect(typeof result.Mars).toBe('number');
      expect(typeof result.Jupiter).toBe('number');
      expect(typeof result.Saturn).toBe('number');
    });

    it('returns values in 0–360 range', () => {
      const result = getTransitingLongitudes(date, lat, lon);
      for (const [, deg] of Object.entries(result)) {
        expect(deg).toBeGreaterThanOrEqual(0);
        expect(deg).toBeLessThan(360);
      }
    });

    it('produces different longitudes for different dates', () => {
      const a = getTransitingLongitudes(new Date('2025-01-01T12:00:00Z'), lat, lon);
      const b = getTransitingLongitudes(new Date('2025-07-01T12:00:00Z'), lat, lon);
      expect(a.Sun).not.toBeCloseTo(b.Sun, 0);
    });
  });

  describe('getTransitInfo', () => {
    it('returns longitudes and retrogrades array', () => {
      const info = getTransitInfo(date, lat, lon);
      expect(info.longitudes).toBeDefined();
      expect(Array.isArray(info.retrogrades)).toBe(true);
    });

    it('retrogrades only contains valid planet names', () => {
      const info = getTransitInfo(date, lat, lon);
      const candidates = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
      for (const r of info.retrogrades) {
        expect(candidates).toContain(r);
      }
    });

    it('defaults to whole-sign house system', () => {
      // Should not throw when houseSystem is not provided
      const info = getTransitInfo(date, lat, lon);
      expect(info.longitudes).toBeDefined();
    });
  });

  describe('computeTransitAspectsToNatal', () => {
    it('returns aspects between transit Moon and natal points', () => {
      const chart = makeTestChart();
      // Use real transit longitudes for the test date
      const transits = getTransitingLongitudes(date, lat, lon);
      const aspects = computeTransitAspectsToNatal(chart, transits);

      expect(Array.isArray(aspects)).toBe(true);
      for (const asp of aspects) {
        expect(asp.pointA).toBe('Moon');
        expect(['conjunction', 'sextile', 'square', 'trine', 'opposition']).toContain(asp.type);
        expect(typeof asp.orb).toBe('number');
      }
    });

    it('returns empty array when no transit Moon available', () => {
      const chart = makeTestChart();
      const aspects = computeTransitAspectsToNatal(chart, { Sun: 10 });
      expect(aspects).toEqual([]);
    });

    it('sorts results by tightest orb first', () => {
      const chart = makeTestChart();
      const transits = getTransitingLongitudes(date, lat, lon);
      const aspects = computeTransitAspectsToNatal(chart, transits);

      for (let i = 1; i < aspects.length; i++) {
        expect(aspects[i].orb).toBeGreaterThanOrEqual(aspects[i - 1].orb);
      }
    });

    it('creates aspects when transit Moon is conjunct natal Sun (within 3°)', () => {
      const chart = makeTestChart();
      // Place transit Moon near natal Sun (355°)
      const aspects = computeTransitAspectsToNatal(chart, { Moon: 354 });
      const conjunction = aspects.find(a => a.type === 'conjunction' && a.pointB === 'Sun');
      expect(conjunction).toBeDefined();
      expect(conjunction!.orb).toBeLessThanOrEqual(3);
    });

    it('creates opposition when transit Moon is ~180° from natal Sun', () => {
      const chart = makeTestChart();
      // Natal Sun is at 355° — opposition at 175°
      const aspects = computeTransitAspectsToNatal(chart, { Moon: 175 });
      const opposition = aspects.find(a => a.type === 'opposition' && a.pointB === 'Sun');
      expect(opposition).toBeDefined();
    });
  });
});
