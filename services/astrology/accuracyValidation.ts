import ephemeris from 'ephemeris';
import { BirthData, PlanetPosition } from './types';
import { TimezoneHandler } from './timezoneHandler';
import { ZODIAC_SIGNS } from './constants';

const PLANET_KEY_MAP: Record<string, string> = {
  sun: 'sun',
  moon: 'moon',
  mercury: 'mercury',
  venus: 'venus',
  mars: 'mars',
  jupiter: 'jupiter',
  saturn: 'saturn',
  uranus: 'uranus',
  neptune: 'neptune',
  pluto: 'pluto',
};

const ACCURACY_THRESHOLDS: Record<string, number> = {
  sun: 0.01,
  moon: 0.1,
  mercury: 0.01,
  venus: 0.01,
  mars: 0.01,
  jupiter: 0.001,
  saturn: 0.001,
  uranus: 0.001,
  neptune: 0.001,
  pluto: 0.001,
};

const DEFAULT_THRESHOLD = 0.01;
const EPHEMERIS_CACHE_LIMIT = 200;
const ephemerisCache = new Map<string, any>();
let lastError: string | null = null;

const angularDifference = (a: number, b: number): number => {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

const toAbsoluteDegrees = (planet: PlanetPosition): number => {
  const signIndex = ZODIAC_SIGNS.findIndex((sign) => sign.name === planet.sign);
  if (signIndex < 0) return planet.degree;
  return signIndex * 30 + planet.degree;
};

const getReferenceLongitude = (observed: any, planetKey: string): number | null => {
  const entry = observed?.[planetKey];
  const value = entry?.apparentLongitudeDd;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

export const compareWithReferenceEphemeris = (birthData: BirthData, planets: PlanetPosition[]) => {
  const time = birthData.time ?? '12:00';
  const dateTimeString = `${birthData.date}T${time}:00`;
  const timezoneInfo = TimezoneHandler.resolveHistoricalTimezone(
    dateTimeString,
    birthData.latitude,
    birthData.longitude,
    birthData.timezone
  );

  const utcDate = timezoneInfo.utcDateTime.toJSDate();
  const cacheKey = utcDate.toISOString().slice(0, 16);
  let observed = ephemerisCache.get(cacheKey);
  if (!observed) {
    try {
      const reference = ephemeris.getAllPlanets(utcDate);
      observed = reference?.observed;
      if (observed) {
        if (ephemerisCache.size >= EPHEMERIS_CACHE_LIMIT) {
          const firstKey = ephemerisCache.keys().next().value;
          if (firstKey) ephemerisCache.delete(firstKey);
        }
        ephemerisCache.set(cacheKey, observed);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'reference_unavailable';
      observed = null;
    }
  }

  if (!observed) {
    return {
      reference: 'ephemeris' as const,
      maxDifference: 0,
      isWithinStandards: false,
      comparisons: [],
      error: lastError || 'reference_unavailable',
    };
  }

  const comparisons = planets
    .map((planet) => {
      const key = PLANET_KEY_MAP[planet.planet.toLowerCase()];
      if (!key) return null;
      const referenceLongitude = getReferenceLongitude(observed, key);
      if (referenceLongitude === null) return null;

      const calculatedLongitude = toAbsoluteDegrees(planet);
      const difference = angularDifference(calculatedLongitude, referenceLongitude);
      const threshold = ACCURACY_THRESHOLDS[key] ?? DEFAULT_THRESHOLD;
      const withinThreshold = difference <= threshold;

      return {
        planet: planet.planet,
        difference,
        threshold,
        withinThreshold,
      };
    })
    .filter((comparison): comparison is NonNullable<typeof comparison> => Boolean(comparison));

  const maxDifference = comparisons.reduce((max, item) => Math.max(max, item.difference), 0);
  const isWithinStandards = comparisons.length > 0 && comparisons.every((item) => item.withinThreshold);

  return {
    reference: 'ephemeris' as const,
    maxDifference,
    isWithinStandards,
    comparisons,
  };
};
