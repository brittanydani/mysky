const mockGetCachedSettings = jest.fn<any, []>(() => null);
const mockGetCachedOrbConfig = jest.fn<any, []>(() => undefined);
const mockIsRemoteSwissEphemerisConfigured = jest.fn<boolean, []>(() => false);
const mockCalculateChartRemoteSwiss = jest.fn();

// Mock the Swiss Ephemeris engine — not available in Node tests
jest.mock('../swissEphemerisEngine', () => ({
  isSwissEphemerisAvailable: jest.fn(() => false),
  calculateChart: jest.fn(),
  calcMoonUncertainty: jest.fn(),
  setSiderealMode: jest.fn(),
  setTropicalMode: jest.fn(),
}));

jest.mock('../remoteSwissEphemerisEngine', () => ({
  isRemoteSwissEphemerisConfigured: mockIsRemoteSwissEphemerisConfigured,
  calculateChartRemoteSwiss: mockCalculateChartRemoteSwiss,
}));

// Mock settings service
jest.mock('../astrologySettingsService', () => ({
  AstrologySettingsService: {
    getCachedSettings: mockGetCachedSettings,
    getCachedOrbConfig: mockGetCachedOrbConfig,
  },
  ORB_CONFIGURATIONS: {
    normal: {
      conjunction: 8, opposition: 8, square: 6, trine: 6, sextile: 4,
      quincunx: 3, semisextile: 2, semisquare: 2, sesquiquadrate: 2,
      quintile: 2, biquintile: 2,
    },
    tight: {
      conjunction: 6, opposition: 6, square: 5, trine: 5, sextile: 3,
      quincunx: 2, semisextile: 1, semisquare: 1, sesquiquadrate: 1,
      quintile: 1, biquintile: 1,
    },
    wide: {
      conjunction: 10, opposition: 10, square: 8, trine: 8, sextile: 6,
      quincunx: 4, semisextile: 3, semisquare: 3, sesquiquadrate: 3,
      quintile: 2, biquintile: 2,
    },
  },
}));

import { EnhancedAstrologyCalculator } from '../calculator';
import { angularDifference } from '../sharedHelpers';
import { zodiacLongitudeToWheelAngleDegrees } from '../chartWheelMath';
import {
  calculateChart as sweCalculateChart,
  isSwissEphemerisAvailable,
} from '../swissEphemerisEngine';
import { calculateChartRemoteSwiss } from '../remoteSwissEphemerisEngine';
import type { BirthData, HouseSystem } from '../types';

const ORBS = {
  tight: {
    conjunction: 6, opposition: 6, square: 5, trine: 5, sextile: 3,
    quincunx: 2, semisextile: 1, semisquare: 1, sesquiquadrate: 1,
    quintile: 1, biquintile: 1,
  },
  normal: {
    conjunction: 8, opposition: 8, square: 6, trine: 6, sextile: 4,
    quincunx: 3, semisextile: 2, semisquare: 2, sesquiquadrate: 2,
    quintile: 2, biquintile: 2,
  },
  wide: {
    conjunction: 10, opposition: 10, square: 8, trine: 8, sextile: 6,
    quincunx: 4, semisextile: 3, semisquare: 3, sesquiquadrate: 3,
    quintile: 2, biquintile: 2,
  },
};

function getAngle(chart: ReturnType<typeof EnhancedAstrologyCalculator.generateNatalChart>, name: string): number {
  const angle = chart.angles?.find(a => a.name === name)?.absoluteDegree;
  if (typeof angle !== 'number') throw new Error(`Missing ${name}`);
  return angle;
}

function expectOpposite(a: number, b: number): void {
  expect(angularDifference(a, b)).toBeCloseTo(180, 1);
}

describe('EnhancedAstrologyCalculator', () => {
  const validBirthData: BirthData = {
    date: '1990-03-15',
    time: '14:30',
    hasUnknownTime: false,
    place: 'New York, NY',
    latitude: 40.7128,
    longitude: -74.006,
  };

  const brittanyBirthData: BirthData = {
    date: '1992-08-01',
    time: '06:09',
    hasUnknownTime: false,
    place: 'Detroit, Michigan',
    latitude: 42.3314,
    longitude: -83.0458,
    houseSystem: 'whole-sign',
    zodiacSystem: 'tropical',
    orbPreset: 'normal',
  };

  beforeEach(() => {
    EnhancedAstrologyCalculator.clearNatalChartCache();
    mockGetCachedSettings.mockReturnValue(null);
    mockGetCachedOrbConfig.mockReturnValue(undefined);
    mockIsRemoteSwissEphemerisConfigured.mockReturnValue(false);
    mockCalculateChartRemoteSwiss.mockReset();
    (isSwissEphemerisAvailable as jest.Mock).mockReturnValue(false);
    (sweCalculateChart as jest.Mock).mockReset();
  });

  describe('generateNatalChart', () => {
    it('returns a NatalChart from valid birth data (fallback engine)', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);

      expect(chart).toBeDefined();
      expect(chart.sunSign).toBeDefined();
      expect(chart.moonSign).toBeDefined();
      expect(chart.placements).toBeDefined();
      expect(chart.placements.length).toBeGreaterThan(0);
      expect(chart.aspects).toBeDefined();
      expect(chart.houseCusps).toBeDefined();
    });

    it('includes correct sun sign for a Pisces birthdate', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      expect(chart.sunSign.name).toBe('Pisces');
    });

    it('returns at least 10 planet placements', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      expect(chart.placements.length).toBeGreaterThanOrEqual(10);
    });

    it('computes aspects between placements', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      expect(chart.aspects.length).toBeGreaterThan(0);
      for (const aspect of chart.aspects) {
        expect(aspect.planet1).toBeDefined();
        expect(aspect.planet2).toBeDefined();
        expect(aspect.type).toBeDefined();
      }
    });

    it('includes angles when birth time is known', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      expect(chart.risingSign).toBeDefined();
      expect(chart.houseCusps.length).toBe(12);
    });

    it('handles unknown birth time gracefully', () => {
      const unknownTime: BirthData = {
        ...validBirthData,
        time: undefined,
        hasUnknownTime: true,
      };
      const chart = EnhancedAstrologyCalculator.generateNatalChart(unknownTime);
      expect(chart).toBeDefined();
      expect(chart.sunSign).toBeDefined();
      expect(chart.placements.length).toBeGreaterThan(0);
    });

    it('throws on invalid birth data', () => {
      const invalid: BirthData = {
        date: '',
        hasUnknownTime: false,
        place: '',
        latitude: 40.7128,
        longitude: -74.006,
      };
      expect(() => EnhancedAstrologyCalculator.generateNatalChart(invalid)).toThrow();
    });

    it('assigns houses to planet placements when time is known', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      for (const p of chart.placements) {
        expect(typeof p.house).toBe('number');
        expect(p.house).toBeGreaterThanOrEqual(1);
        expect(p.house).toBeLessThanOrEqual(12);
      }
    });

    it('produces deterministic results for same input', () => {
      const chart1 = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      const chart2 = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      expect(chart1.sunSign.name).toBe(chart2.sunSign.name);
      expect(chart1.moonSign.name).toBe(chart2.moonSign.name);
      expect(chart1.placements.length).toBe(chart2.placements.length);
    });

    it('supports whole-sign house system by default', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(validBirthData);
      // Whole-sign: each house cusp aligns with a sign boundary
      expect(chart.houseCusps).toBeDefined();
    });

    it('respects explicit houseSystem override', () => {
      const withPlacidus: BirthData = { ...validBirthData, houseSystem: 'placidus' };
      const chart = EnhancedAstrologyCalculator.generateNatalChart(withPlacidus);
      expect(chart).toBeDefined();
      expect(chart.houseCusps.length).toBe(12);
    });

    it('keeps Whole Sign houses on sign boundaries and MC independent', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart(brittanyBirthData);
      const houseSigns = chart.houseCusps.map(c => c.sign.name);

      expect(houseSigns).toEqual([
        'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn',
        'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer',
      ]);
      expect(chart.houseCusps[0].longitude).toBeCloseTo(120, 1);
      expect(chart.houseCusps[9].sign.name).toBe('Taurus');
      expect(chart.midheaven?.sign.name).toBe('Aries');
      expect(angularDifference(chart.houseCusps[9].longitude, chart.midheaven?.longitude ?? 0)).toBeGreaterThan(5);
    });

    it('keeps Equal House cusps from ASC while MC remains independent', () => {
      const chart = EnhancedAstrologyCalculator.generateNatalChart({
        ...brittanyBirthData,
        houseSystem: 'equal-house',
      });

      const asc = getAngle(chart, 'Ascendant');
      const mc = getAngle(chart, 'Midheaven');

      expect(angularDifference(chart.houseCusps[0].longitude, asc)).toBeLessThan(0.2);
      expect(angularDifference(chart.houseCusps[9].longitude, mc)).toBeGreaterThan(5);
    });

    it.each<HouseSystem>(['placidus', 'koch', 'campanus', 'regiomontanus', 'topocentric'])(
      'keeps quadrant angle relationships for %s',
      (houseSystem) => {
        const chart = EnhancedAstrologyCalculator.generateNatalChart({
          ...brittanyBirthData,
          houseSystem,
        });

        const asc = getAngle(chart, 'Ascendant');
        const dc = getAngle(chart, 'Descendant');
        const mc = getAngle(chart, 'Midheaven');
        const ic = getAngle(chart, 'IC');

        expect(angularDifference(chart.houseCusps[0].longitude, asc)).toBeLessThan(0.2);
        expect(angularDifference(chart.houseCusps[6].longitude, dc)).toBeLessThan(0.2);
        expect(angularDifference(chart.houseCusps[9].longitude, mc)).toBeLessThan(0.2);
        expect(angularDifference(chart.houseCusps[3].longitude, ic)).toBeLessThan(0.2);
        expectOpposite(asc, dc);
        expectOpposite(mc, ic);
      }
    );

    it('changes zodiac longitudes in sidereal mode without flipping standard orientation', () => {
      const tropical = EnhancedAstrologyCalculator.generateNatalChart(brittanyBirthData);
      EnhancedAstrologyCalculator.clearNatalChartCache();
      const sidereal = EnhancedAstrologyCalculator.generateNatalChart({
        ...brittanyBirthData,
        zodiacSystem: 'sidereal',
      });

      expect(angularDifference(tropical.sun.longitude, sidereal.sun.longitude)).toBeGreaterThan(20);

      const tropicalMcAngle = zodiacLongitudeToWheelAngleDegrees(getAngle(tropical, 'Midheaven'), {
        orientation: 'standard-natal',
        ascendantLongitude: getAngle(tropical, 'Ascendant'),
        midheavenLongitude: getAngle(tropical, 'Midheaven'),
      });
      const siderealMcAngle = zodiacLongitudeToWheelAngleDegrees(getAngle(sidereal, 'Midheaven'), {
        orientation: 'standard-natal',
        ascendantLongitude: getAngle(sidereal, 'Ascendant'),
        midheavenLongitude: getAngle(sidereal, 'Midheaven'),
      });

      expect(tropicalMcAngle).toBeGreaterThan(0);
      expect(tropicalMcAngle).toBeLessThan(180);
      expect(siderealMcAngle).toBeGreaterThan(0);
      expect(siderealMcAngle).toBeLessThan(180);
    });

    it('applies aspect precision as tight <= normal <= wide displayed aspects', () => {
      mockGetCachedSettings.mockReturnValue({ showMinorAspects: false });

      mockGetCachedOrbConfig.mockReturnValue(ORBS.tight);
      const tight = EnhancedAstrologyCalculator.generateNatalChart(brittanyBirthData).aspects.length;

      EnhancedAstrologyCalculator.clearNatalChartCache();
      mockGetCachedOrbConfig.mockReturnValue(ORBS.normal);
      const normal = EnhancedAstrologyCalculator.generateNatalChart(brittanyBirthData).aspects.length;

      EnhancedAstrologyCalculator.clearNatalChartCache();
      mockGetCachedOrbConfig.mockReturnValue(ORBS.wide);
      const wide = EnhancedAstrologyCalculator.generateNatalChart(brittanyBirthData).aspects.length;

      expect(tight).toBeLessThanOrEqual(normal);
      expect(normal).toBeLessThanOrEqual(wide);
      expect(tight).toBeLessThan(wide);
    });

    it('adds minor aspects without changing core placements', () => {
      mockGetCachedSettings.mockReturnValue({ showMinorAspects: false });
      mockGetCachedOrbConfig.mockReturnValue(ORBS.normal);
      const majorOnly = EnhancedAstrologyCalculator.generateNatalChart(brittanyBirthData);
      const sunLongitude = majorOnly.sun.longitude;

      EnhancedAstrologyCalculator.clearNatalChartCache();
      mockGetCachedSettings.mockReturnValue({ showMinorAspects: true });
      const withMinor = EnhancedAstrologyCalculator.generateNatalChart(brittanyBirthData);

      const majorTypes = new Set(['Conjunction', 'Opposition', 'Square', 'Trine', 'Sextile']);
      expect(withMinor.aspects.length).toBeGreaterThanOrEqual(majorOnly.aspects.length);
      expect(withMinor.aspects.some(a => !majorTypes.has(a.type.name))).toBe(true);
      expect(withMinor.sun.longitude).toBeCloseTo(sunLongitude, 6);
    });

    it('uses Swiss asteroid toggle without changing core placements', () => {
      (isSwissEphemerisAvailable as jest.Mock).mockReturnValue(true);
      (sweCalculateChart as jest.Mock).mockImplementation(
        (_year, _month, _day, _hour, _minute, _second, _lat, _lon, _houseSystem, _includeHouses, includeAsteroids) =>
          makeSwissChartFixture(Boolean(includeAsteroids), 'mean')
      );

      mockGetCachedSettings.mockReturnValue({ showAsteroid: false, showMinorAspects: false, lilithMethod: 'mean' });
      const withoutAsteroids = EnhancedAstrologyCalculator.generateNatalChart(brittanyBirthData);

      EnhancedAstrologyCalculator.clearNatalChartCache();
      mockGetCachedSettings.mockReturnValue({ showAsteroid: true, showMinorAspects: false, lilithMethod: 'mean' });
      const withAsteroids = EnhancedAstrologyCalculator.generateNatalChart(brittanyBirthData);

      const withoutNames = new Set((withoutAsteroids.planets ?? []).map(p => p.planet));
      const withNames = new Set((withAsteroids.planets ?? []).map(p => p.planet));

      expect(withoutNames.has('Ceres')).toBe(false);
      expect(withNames.has('Ceres')).toBe(true);
      expect(withNames.has('Pallas')).toBe(true);
      expect(withNames.has('Juno')).toBe(true);
      expect(withNames.has('Vesta')).toBe(true);
      expect(withAsteroids.sun.longitude).toBeCloseTo(withoutAsteroids.sun.longitude, 6);
      expect(withAsteroids.ascendant?.longitude).toBeCloseTo(withoutAsteroids.ascendant?.longitude ?? 0, 6);
    });

    it('uses separate mean and true Lilith values without affecting other bodies', () => {
      (isSwissEphemerisAvailable as jest.Mock).mockReturnValue(true);
      (sweCalculateChart as jest.Mock).mockImplementation(
        (_year, _month, _day, _hour, _minute, _second, _lat, _lon, _houseSystem, _includeHouses, includeAsteroids, _sidereal, lilithMethod) =>
          makeSwissChartFixture(Boolean(includeAsteroids), lilithMethod)
      );

      mockGetCachedSettings.mockReturnValue({ showAsteroid: false, showMinorAspects: false, lilithMethod: 'mean' });
      const mean = EnhancedAstrologyCalculator.generateNatalChart(brittanyBirthData);

      EnhancedAstrologyCalculator.clearNatalChartCache();
      mockGetCachedSettings.mockReturnValue({ showAsteroid: false, showMinorAspects: false, lilithMethod: 'true' });
      const trueLilith = EnhancedAstrologyCalculator.generateNatalChart(brittanyBirthData);

      const meanLilith = mean.planets?.find(p => p.planet === 'Lilith')?.absoluteDegree;
      const trueLilithLon = trueLilith.planets?.find(p => p.planet === 'Lilith')?.absoluteDegree;

      expect(meanLilith).toBe(100);
      expect(trueLilithLon).toBe(123);
      expect(trueLilith.sun.longitude).toBeCloseTo(mean.sun.longitude, 6);
      expect(trueLilith.moon.longitude).toBeCloseTo(mean.moon.longitude, 6);
      expect(trueLilith.houseCusps.map(c => c.longitude)).toEqual(mean.houseCusps.map(c => c.longitude));
    });

    it('uses remote Swiss Ephemeris before degraded JS fallback in async chart generation', async () => {
      mockIsRemoteSwissEphemerisConfigured.mockReturnValue(true);
      mockCalculateChartRemoteSwiss.mockImplementation(async (request) =>
        makeSwissChartFixture(Boolean(request.includeAsteroids), request.lilithMethod)
      );

      const chart = await EnhancedAstrologyCalculator.generateNatalChartAsync(brittanyBirthData);

      expect(calculateChartRemoteSwiss).toHaveBeenCalledWith(expect.objectContaining({
        houseSystem: 'whole-sign',
        includeHouses: true,
        includeAsteroids: false,
        zodiacSystem: 'tropical',
        sidereal: false,
        ayanamsa: 'lahiri',
        lilithMethod: 'mean',
      }));
      expect(chart.calculationEngine).toBe('remote-swiss-ephemeris');
      expect(chart.calculationSettings?.calculationEngine).toBe('remote-swiss-ephemeris');
      expect(chart.isDegraded).toBe(false);
      expect(chart.fallbackReason).toBeUndefined();
      expect(chart.calculationAccuracy?.validationStatus).toBe('verified');
      expect(chart.ascendant?.longitude).toBeCloseTo(125, 6);
    });

    it('marks async JS fallback as degraded when remote Swiss fails', async () => {
      mockIsRemoteSwissEphemerisConfigured.mockReturnValue(true);
      mockCalculateChartRemoteSwiss.mockRejectedValue(new Error('remote unavailable'));

      const chart = await EnhancedAstrologyCalculator.generateNatalChartAsync(validBirthData);

      expect(calculateChartRemoteSwiss).toHaveBeenCalled();
      expect(chart.calculationEngine).toBe('circular-natal-horoscope-js');
      expect(chart.calculationSettings?.calculationEngine).toBe('circular-natal-horoscope-js');
      expect(chart.isDegraded).toBe(true);
      expect(chart.fallbackReason).toContain('remote Swiss Ephemeris failed');
    });
  });
});

function makeSwissChartFixture(includeAsteroids: boolean, lilithMethod: 'mean' | 'true' = 'mean') {
  const core = [
    ['Sun', 129],
    ['Moon', 166],
    ['Mercury', 131],
    ['Venus', 142],
    ['Mars', 63],
    ['Jupiter', 165],
    ['Saturn', 315],
    ['Uranus', 285],
    ['Neptune', 286],
    ['Pluto', 230],
    ['Chiron', 132],
    ['Lilith', lilithMethod === 'true' ? 123 : 100],
    ['North Node', 270],
    ['South Node', 90],
  ].map(([planet, absoluteDegree]) => ({
    planet: planet as string,
    sign: 'Aries',
    degree: Number(absoluteDegree) % 30,
    absoluteDegree: Number(absoluteDegree),
    isRetrograde: false,
    retrograde: false,
    speed: 1,
  }));

  const asteroids = includeAsteroids
    ? ['Ceres', 'Pallas', 'Juno', 'Vesta', 'Pholus'].map((planet, index) => ({
        planet,
        sign: 'Aries',
        degree: index + 1,
        absoluteDegree: 10 + index,
        isRetrograde: false,
        retrograde: false,
        speed: 1,
      }))
    : [];

  return {
    planets: [...core, ...asteroids],
    speeds: new Map(),
    cusps: [120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90],
    ascendant: 125,
    mc: 21,
    vertex: 180,
    julianDay: 0,
  };
}
