// ─────────────────────────────────────────────────────────────
// MySky — Swiss Ephemeris Engine
//
// Gold-standard astronomical calculations using the Swiss Ephemeris
// (Astrodienst), via react-native-swisseph native bindings.
//
// Provides:
//   • Planetary longitudes, latitudes, distances, speeds (sweCalcUt)
//   • House cusps + angles for all major house systems (sweHouses)
//   • Julian Day conversions with full UTC timezone handling
//   • Lunar nodes (True Node via SE_TRUE_NODE)
//   • Chiron
//
// This module is designed to plug into the existing calculator.ts
// architecture, producing the same data shapes (PlanetPosition,
// PlanetPlacement, cusp arrays, etc.) so the rest of the app
// is unaffected by the engine swap.
// ─────────────────────────────────────────────────────────────

import { logger } from '../../utils/logger';
import { HouseSystem, PlanetPosition, Ayanamsa, MoonUncertainty } from './types';
import { normalize360, degreeInSign, signFromLongitude, degMinFromAbs, signNameFromLongitude } from './sharedHelpers';

// ── Swiss Ephemeris constants (inline so we don't import at module level) ────

/** Swiss Ephemeris planet body IDs */
export const SE = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9,
  MEAN_NODE: 10,
  TRUE_NODE: 11,
  CHIRON: 15,
  CERES: 17,
  PALLAS: 18,
  JUNO: 19,
  VESTA: 20,

  // Calculation flags
  SEFLG_SWIEPH: 2,     // Use Swiss Ephemeris
  SEFLG_SPEED: 256,    // Include speed data
  SEFLG_SIDEREAL: 64,  // Sidereal zodiac mode

  // Calendar
  SE_GREG_CAL: 1,

  // ascmc indices
  ASC: 0,   // Ascendant
  MC: 1,    // Midheaven (MC)
  ARMC: 2,  // ARMC (sidereal time)
  VERTEX: 3,
} as const;

/**
 * Map our HouseSystem type to Swiss Ephemeris house system character codes.
 * See: https://www.astro.com/swisseph/swephprg.htm#_Toc112948979
 */
const HOUSE_SYSTEM_MAP: Record<HouseSystem, string> = {
  'placidus': 'P',
  'whole-sign': 'W',
  'equal-house': 'E',
  'koch': 'K',
  'campanus': 'C',
  'regiomontanus': 'R',
  'topocentric': 'T',
};

/** Planet bodies to calculate, in display order */
const PLANET_BODIES = [
  { id: SE.SUN, label: 'Sun' },
  { id: SE.MOON, label: 'Moon' },
  { id: SE.MERCURY, label: 'Mercury' },
  { id: SE.VENUS, label: 'Venus' },
  { id: SE.MARS, label: 'Mars' },
  { id: SE.JUPITER, label: 'Jupiter' },
  { id: SE.SATURN, label: 'Saturn' },
  { id: SE.URANUS, label: 'Uranus' },
  { id: SE.NEPTUNE, label: 'Neptune' },
  { id: SE.PLUTO, label: 'Pluto' },
  { id: SE.CHIRON, label: 'Chiron' },
] as const;

/** Asteroid bodies (calculated when showAsteroid setting is enabled) */
const ASTEROID_BODIES = [
  { id: SE.CERES, label: 'Ceres' },
  { id: SE.PALLAS, label: 'Pallas' },
  { id: SE.JUNO, label: 'Juno' },
  { id: SE.VESTA, label: 'Vesta' },
] as const;

/** Nodes to calculate */
const NODE_BODIES = [
  { id: SE.TRUE_NODE, label: 'North Node' },
] as const;

// ── Types ───────────────────────────────────────────────────

export interface SwissEphPlanetResult {
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
  latitudeSpeed: number;
  distanceSpeed: number;
}

export interface SwissEphHouseResult {
  cusps: number[];       // 12 house cusp longitudes (0–360)
  ascendant: number;     // Ascendant longitude
  mc: number;            // Midheaven longitude
  armc: number;          // ARMC (sidereal time in degrees)
  vertex: number;        // Vertex longitude
}

export interface SwissEphChartData {
  planets: PlanetPosition[];
  speeds: Map<string, number>;         // planet name → degrees/day
  cusps: number[] | undefined;         // 12 cusp longitudes (undefined if unknown time)
  ascendant: number | undefined;
  mc: number | undefined;
  julianDay: number;
}

// ── Lazy module loading ─────────────────────────────────────

let _swe: any = null;
let _sweAvailable: boolean | null = null;

/**
 * Check whether the Swisseph TurboModule is registered in the native binary
 * *before* calling require(), which would trigger getEnforcing() and crash
 * with a fatal Invariant Violation that JS try/catch cannot intercept.
 */
function isNativeModuleRegistered(): boolean {
  try {
    // react-native exposes TurboModuleRegistry; use the non-enforcing .get()
    // which returns null instead of throwing a native fatal error.
    const { TurboModuleRegistry } = require('react-native');
    if (TurboModuleRegistry?.get) {
      return TurboModuleRegistry.get('Swisseph') != null;
    }
    // Fallback for older bridge-based RN: check NativeModules
    const { NativeModules } = require('react-native');
    return NativeModules?.Swisseph != null;
  } catch {
    return false;
  }
}

/**
 * Attempt to load react-native-swisseph. Returns null if not available
 * (e.g. running in Node.js tests, web, or Expo Go).
 */
function getSwe(): any {
  if (_sweAvailable === false) return null;
  if (_swe) return _swe;

  try {
    // Guard: verify the native TurboModule is registered before require(),
    // because require() calls TurboModuleRegistry.getEnforcing() which
    // triggers RCTFatal — a native crash that JS cannot catch.
    if (!isNativeModuleRegistered()) {
      _sweAvailable = false;
      logger.warn('[SwissEphemeris] Native TurboModule not registered (expected in Expo Go), will use fallback engine');
      return null;
    }

    // Dynamic require so the module doesn't crash Node.js test runner
    // or web builds where native modules aren't available
    const mod = require('react-native-swisseph');

    // Validate the module actually loaded (Metro may return undefined/null
    // if the native TurboModule registration fails internally).
    if (!mod || typeof mod.sweCalcUt !== 'function') {
      _sweAvailable = false;
      logger.warn('[SwissEphemeris] Native module returned but is not functional, will use fallback engine');
      return null;
    }

    _swe = mod;
    _sweAvailable = true;
    logger.info('[SwissEphemeris] Native module loaded successfully');
    return _swe;
  } catch (e: any) {
    _sweAvailable = false;
    const msg = e?.message ?? String(e);
    if (msg.includes('Invariant Violation') || msg.includes('could not be found')) {
      logger.warn('[SwissEphemeris] Native TurboModule not registered (expected in Expo Go), will use fallback engine');
    } else {
      logger.warn('[SwissEphemeris] Native module not available, will use fallback engine:', msg);
    }
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────

/**
 * Check if Swiss Ephemeris native module is available at runtime.
 */
export function isSwissEphemerisAvailable(): boolean {
  return !!getSwe();
}

/**
 * Convert a UTC date/time to Julian Day (UT).
 */
export function dateToJulianDay(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number = 0
): number {
  const swe = getSwe();
  if (!swe) {
    throw new Error('Swiss Ephemeris not available');
  }

  // sweUtcToJd returns { tjdEt, tjdUt } — we use tjdUt for house calculations
  const result = swe.sweUtcToJd(year, month, day, hour, minute, second, SE.SE_GREG_CAL);
  return result.tjdUt;
}

/**
 * Calculate a single planet's position using Swiss Ephemeris.
 */
export function calcPlanet(julianDay: number, planetId: number): SwissEphPlanetResult {
  const swe = getSwe();
  if (!swe) {
    throw new Error('Swiss Ephemeris not available');
  }

  const iflag = SE.SEFLG_SWIEPH | SE.SEFLG_SPEED;
  const result = swe.sweCalcUt(julianDay, planetId, iflag);

  return {
    longitude: normalize360(result.longitude),
    latitude: result.latitude,
    distance: result.distance,
    longitudeSpeed: result.longitudeSpeed,
    latitudeSpeed: result.latitudeSpeed,
    distanceSpeed: result.distanceSpeed,
  };
}

/**
 * Calculate house cusps and angles using Swiss Ephemeris.
 */
export function calcHouses(
  julianDay: number,
  latitude: number,
  longitude: number,
  houseSystem: HouseSystem
): SwissEphHouseResult {
  const swe = getSwe();
  if (!swe) {
    throw new Error('Swiss Ephemeris not available');
  }

  const hsysChar = HOUSE_SYSTEM_MAP[houseSystem] || 'P'; // default Placidus
  const result = swe.sweHouses(julianDay, 0, latitude, longitude, hsysChar);

  // result.cusp is 1-indexed (cusp[0] is unused) in the C library;
  // react-native-swisseph may return it 0-indexed — normalize
  let cusps: number[];
  if (result.cusp.length === 13) {
    // C-style 1-indexed: indices 1–12 are the cusps
    cusps = result.cusp.slice(1, 13).map((c: number) => normalize360(c));
  } else if (result.cusp.length === 12) {
    cusps = result.cusp.map((c: number) => normalize360(c));
  } else {
    throw new Error(`Unexpected cusp array length: ${result.cusp.length}`);
  }

  // ascmc array: [ASC, MC, ARMC, VERTEX, ...]
  const ascmc = result.ascmc || [];

  return {
    cusps,
    ascendant: normalize360(ascmc[SE.ASC] ?? cusps[0]),
    mc: normalize360(ascmc[SE.MC] ?? cusps[9]),
    armc: ascmc[SE.ARMC] ?? 0,
    vertex: ascmc[SE.VERTEX] ?? 0,
  };
}

/**
 * Calculate all planetary positions for a given Julian Day.
 * Returns PlanetPosition[] plus a speed map for aspect applying/separating logic.
 * @param includeAsteroids  When true, adds Ceres, Pallas, Juno, Vesta
 */
export function calcAllPlanets(julianDay: number, includeAsteroids: boolean = false): {
  planets: PlanetPosition[];
  speeds: Map<string, number>;
} {
  const planets: PlanetPosition[] = [];
  const speeds = new Map<string, number>();

  // Main celestial bodies
  for (const body of PLANET_BODIES) {
    const result = calcPlanet(julianDay, body.id);
    const sign = signFromLongitude(result.longitude);
    const degIn = degreeInSign(result.longitude);
    const isRetrograde = result.longitudeSpeed < 0;

    planets.push({
      planet: body.label,
      sign: sign.name,
      degree: Number(degIn.toFixed(2)),
      absoluteDegree: Number(result.longitude.toFixed(6)),
      isRetrograde,
      retrograde: isRetrograde,
      speed: result.longitudeSpeed,
    });

    speeds.set(body.label, result.longitudeSpeed);
  }

  // Lunar nodes
  for (const node of NODE_BODIES) {
    const result = calcPlanet(julianDay, node.id);
    const sign = signFromLongitude(result.longitude);
    const degIn = degreeInSign(result.longitude);

    planets.push({
      planet: node.label,
      sign: sign.name,
      degree: Number(degIn.toFixed(2)),
      absoluteDegree: Number(result.longitude.toFixed(6)),
      isRetrograde: true,  // True node is always retrograde in mean motion
      retrograde: true,
      speed: result.longitudeSpeed,
    });

    speeds.set(node.label, result.longitudeSpeed);

    // Compute South Node (180° opposite True Node)
    const southLon = normalize360(result.longitude + 180);
    const southSign = signFromLongitude(southLon);
    const southDegIn = degreeInSign(southLon);

    planets.push({
      planet: 'South Node',
      sign: southSign.name,
      degree: Number(southDegIn.toFixed(2)),
      absoluteDegree: Number(southLon.toFixed(6)),
      isRetrograde: true,
      retrograde: true,
      speed: result.longitudeSpeed,
    });

    speeds.set('South Node', result.longitudeSpeed);
  }

  // Additional asteroids (Ceres, Pallas, Juno, Vesta)
  if (includeAsteroids) {
    const asteroids = calcAsteroids(julianDay);
    planets.push(...asteroids.planets);
    for (const [name, speed] of asteroids.speeds) {
      speeds.set(name, speed);
    }
  }

  return { planets, speeds };
}

/**
 * Full chart calculation using Swiss Ephemeris.
 * This is the primary entry point used by calculator.ts.
 *
 * @param year     UTC year
 * @param month    UTC month (1-based, January = 1)
 * @param day      UTC day
 * @param hour     UTC hour
 * @param minute   UTC minute
 * @param second   UTC second
 * @param latitude Geographic latitude (-90 to 90)
 * @param longitude Geographic longitude (-180 to 180)
 * @param houseSystem House system to use
 * @param includeHouses Whether to calculate houses (false for unknown time)
 * @param includeAsteroids Whether to include Ceres, Pallas, Juno, Vesta
 */
export function calculateChart(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  latitude: number,
  longitude: number,
  houseSystem: HouseSystem,
  includeHouses: boolean = true,
  includeAsteroids: boolean = false,
): SwissEphChartData {
  const julianDay = dateToJulianDay(year, month, day, hour, minute, second);
  const { planets, speeds } = calcAllPlanets(julianDay, includeAsteroids);

  let cusps: number[] | undefined;
  let ascendant: number | undefined;
  let mc: number | undefined;

  if (includeHouses) {
    const houses = calcHouses(julianDay, latitude, longitude, houseSystem);
    cusps = houses.cusps;
    ascendant = houses.ascendant;
    mc = houses.mc;
  }

  return {
    planets,
    speeds,
    cusps,
    ascendant,
    mc,
    julianDay,
  };
}

/**
 * Ayanamsa codes for Swiss Ephemeris sidereal mode.
 * See: https://www.astro.com/swisseph/swephprg.htm#_Toc112949014
 */
const AYANAMSA_MAP: Record<Ayanamsa, number> = {
  'lahiri': 1,          // Lahiri (Chitrapaksha) — most common in Indian astrology
  'raman': 3,           // B.V. Raman
  'krishnamurti': 5,    // KP (Krishnamurti Paddhati)
  'fagan-bradley': 0,   // Fagan-Bradley — common in Western sidereal
};

/**
 * Configure Swiss Ephemeris for sidereal zodiac with specified ayanamsa.
 * Must be called before any calculation if sidereal mode is desired.
 */
export function setSiderealMode(ayanamsa: Ayanamsa): void {
  const swe = getSwe();
  if (!swe) {
    logger.warn('[SwissEphemeris] Cannot set sidereal mode — native module not available');
    return;
  }
  const ayaCode = AYANAMSA_MAP[ayanamsa] ?? AYANAMSA_MAP['lahiri'];
  if (typeof swe.sweSetSidMode === 'function') {
    swe.sweSetSidMode(ayaCode, 0, 0);
    logger.info(`[SwissEphemeris] Sidereal mode set: ayanamsa=${ayanamsa} (code=${ayaCode})`);
  } else {
    logger.warn('[SwissEphemeris] sweSetSidMode not available in this build');
  }
}

/**
 * Reset Swiss Ephemeris back to tropical (default) mode.
 */
export function setTropicalMode(): void {
  const swe = getSwe();
  if (!swe) return;
  // Calling sweSetSidMode with -1 or simply not using SEFLG_SIDEREAL resets.
  // The safest approach is to just not add SEFLG_SIDEREAL in subsequent calcs.
  // No explicit reset function exists; the flag controls per-call behavior.
  logger.info('[SwissEphemeris] Tropical mode (default) active');
}

/**
 * Calculate a single planet's position in sidereal zodiac.
 */
export function calcPlanetSidereal(julianDay: number, planetId: number, ayanamsa: Ayanamsa): SwissEphPlanetResult {
  const swe = getSwe();
  if (!swe) {
    throw new Error('Swiss Ephemeris not available');
  }

  setSiderealMode(ayanamsa);
  const iflag = SE.SEFLG_SWIEPH | SE.SEFLG_SPEED | SE.SEFLG_SIDEREAL;
  const result = swe.sweCalcUt(julianDay, planetId, iflag);

  return {
    longitude: normalize360(result.longitude),
    latitude: result.latitude,
    distance: result.distance,
    longitudeSpeed: result.longitudeSpeed,
    latitudeSpeed: result.latitudeSpeed,
    distanceSpeed: result.distanceSpeed,
  };
}

/**
 * Calculate asteroid positions for a given Julian Day.
 * Returns positions for Ceres, Pallas, Juno, and Vesta.
 */
export function calcAsteroids(julianDay: number): {
  planets: PlanetPosition[];
  speeds: Map<string, number>;
} {
  const planets: PlanetPosition[] = [];
  const speeds = new Map<string, number>();

  for (const body of ASTEROID_BODIES) {
    try {
      const result = calcPlanet(julianDay, body.id);
      const sign = signFromLongitude(result.longitude);
      const degIn = degreeInSign(result.longitude);
      const isRetrograde = result.longitudeSpeed < 0;

      planets.push({
        planet: body.label,
        sign: sign.name,
        degree: Number(degIn.toFixed(2)),
        absoluteDegree: Number(result.longitude.toFixed(6)),
        isRetrograde,
        retrograde: isRetrograde,
        speed: result.longitudeSpeed,
      });

      speeds.set(body.label, result.longitudeSpeed);
    } catch (e) {
      logger.warn(`[SwissEphemeris] Failed to calculate ${body.label}:`, e);
    }
  }

  return { planets, speeds };
}

/**
 * Calculate Moon position uncertainty range for unknown/approximate birth times.
 * The Moon moves ~12\u201313\u00b0/day, so without an exact time the position can vary significantly.
 *
 * @param year   UTC year
 * @param month  UTC month (1-based)
 * @param day    UTC day
 * @param hourMin  Start of the time window (UTC hour, default 0)
 * @param hourMax  End of the time window (UTC hour, default 24)
 */
export function calcMoonUncertainty(
  year: number,
  month: number,
  day: number,
  hourMin: number = 0,
  hourMax: number = 24,
): MoonUncertainty {
  const swe = getSwe();
  if (!swe) {
    throw new Error('Swiss Ephemeris not available for Moon uncertainty calculation');
  }

  // Calculate Moon position at the start and end of the time window
  const jdStart = dateToJulianDay(year, month, day, hourMin, 0, 0);
  const jdEnd = dateToJulianDay(year, month, day, Math.min(hourMax, 23), hourMax >= 24 ? 59 : 0, 0);

  const moonStart = calcPlanet(jdStart, SE.MOON);
  const moonEnd = calcPlanet(jdEnd, SE.MOON);

  const minLon = normalize360(moonStart.longitude);
  const maxLon = normalize360(moonEnd.longitude);

  // Calculate max error (half the range since noon is used as midpoint)
  const range = maxLon >= minLon
    ? maxLon - minLon
    : (360 - minLon) + maxLon; // handle wrap-around
  const maxErrorDegrees = Number((range / 2).toFixed(2));

  // Determine all possible signs
  const possibleSigns: string[] = [];
  const steps = Math.max(4, Math.ceil(range / 5)); // check every ~5\u00b0
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const testLon = normalize360(minLon + fraction * range);
    const signName = signNameFromLongitude(testLon);
    if (!possibleSigns.includes(signName)) {
      possibleSigns.push(signName);
    }
  }

  return {
    minLongitude: Number(minLon.toFixed(6)),
    maxLongitude: Number(maxLon.toFixed(6)),
    maxErrorDegrees,
    possibleSigns,
    signChangesPossible: possibleSigns.length > 1,
  };
}

/**
 * Calculate transit positions for a given date (geocentric, no houses).
 */
export function calculateTransitPositions(date: Date): PlanetPosition[] {
  const julianDay = dateToJulianDay(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,   // sweUtcToJd expects 1-based month
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );

  const { planets } = calcAllPlanets(julianDay);
  // Filter out nodes for transit display (keep main bodies only)
  return planets.filter(p => !p.planet.includes('Node'));
}
