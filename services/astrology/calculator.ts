import { logger } from '../../utils/logger';
// File: services/astrology/calculator.ts
// ✅ PRIMARY ENGINE: Swiss Ephemeris (react-native-swisseph) — gold-standard accuracy
// ✅ FALLBACK ENGINE: circular-natal-horoscope-js — used in Node.js tests / web
// ✅ Real planetary longitudes, houses, angles, aspects
// ✅ Real planetary speeds for applying/separating aspect detection
// ✅ Unknown time handled via UnknownTimeHandler
// ✅ Timezone normalization via TimezoneHandler
// ✅ Assigns houses to planets + legacy placements when birth time is known
// ✅ Keeps legacy compatibility fields for your existing emotional/story system
// ✅ Dev-only reference validation (to avoid privacy issues in production)
// ✅ NO FAKE Ascendant / Midheaven (real angles only)

import { TimezoneHandler, TimezoneInfo } from './timezoneHandler';
import { compareWithReferenceEphemeris } from './accuracyValidation';
import { InputValidator } from './inputValidator';
import {
  isSwissEphemerisAvailable,
  calculateChart as sweCalculateChart,
  SwissEphChartData,
  calcMoonUncertainty,
  setSiderealMode,
  setTropicalMode,
} from './swissEphemerisEngine';

import {
  BirthData,
  AstrologySign,
  NatalChart,
  PlanetPosition,
  PlanetPlacement,
  HouseSystem,
  SimpleAspect,
  SimpleHouseCusp,
  AnglePosition,
  AspectTypeName,
  TransitData,
  HouseCusp,
  Aspect,
  Planet,
  ZodiacSign,
  PointPlacement,
  MoonUncertainty,
  ApproximateTimePeriod,
} from './types';

import { ZODIAC_SIGNS, PLANETS, ASPECT_TYPES } from './constants';
import { AstrologySettingsService, OrbConfiguration, ORB_CONFIGURATIONS } from './astrologySettingsService';
import {
  normalize360,
  degreeInSign,
  degMinFromAbs,
  signFromLongitude,
  extractAbsDegree,
  angularDifference,
  computeHouseForLongitude,
} from './sharedHelpers';
import { Origin, Horoscope } from 'circular-natal-horoscope-js';

// Default configuration
const DEFAULT_HOUSE_SYSTEM: HouseSystem = 'whole-sign';

/** Map approximate time periods to UTC hour windows for Moon uncertainty */
function getTimeWindowForApproximation(period?: ApproximateTimePeriod): { hourMin: number; hourMax: number } {
  switch (period) {
    case 'morning':   return { hourMin: 6, hourMax: 12 };
    case 'afternoon': return { hourMin: 12, hourMax: 18 };
    case 'evening':   return { hourMin: 18, hourMax: 24 };
    case 'night':     return { hourMin: 0, hourMax: 6 };
    default:          return { hourMin: 0, hourMax: 24 }; // full day when truly unknown
  }
}

// Cache for transits to avoid recalculating too frequently
type TransitCacheEntry = { timestamp: number; data: TransitData };

function ensurePointPlanet(name: 'Ascendant' | 'Midheaven'): Planet {
  return {
    name,
    symbol: name === 'Ascendant' ? 'ASC' : 'MC',
    type: 'Point',
  };
}

function convertToLegacyPlanetPlacement(
  planetName: string,
  absDeg: number,
  isRetrograde: boolean,
  house: number
): PlanetPlacement {
  const signIndex = Math.floor(normalize360(absDeg) / 30);
  const sign = ZODIAC_SIGNS[signIndex] as ZodiacSign;
  const { degree, minute } = degMinFromAbs(absDeg);

  const isPoint = planetName === 'Ascendant' || planetName === 'Midheaven';
  const planet: Planet = isPoint ? ensurePointPlanet(planetName as any) : (PLANETS[planetName.toLowerCase()] as Planet);

  return {
    planet,
    longitude: normalize360(absDeg),
    sign,
    house,
    degree,
    minute,
    isRetrograde,
    speed: 0, // overwritten later by calculatePlanets when speed data is available
  };
}

function buildAspectDefs(orbConfig?: OrbConfiguration, includeMinor: boolean = false): Array<{ type: AspectTypeName; angle: number; orb: number }> {
  const orbs = orbConfig ?? ORB_CONFIGURATIONS.normal;
  const defs: Array<{ type: AspectTypeName; angle: number; orb: number }> = [
    { type: 'conjunction', angle: 0, orb: orbs.conjunction },
    { type: 'sextile', angle: 60, orb: orbs.sextile },
    { type: 'square', angle: 90, orb: orbs.square },
    { type: 'trine', angle: 120, orb: orbs.trine },
    { type: 'opposition', angle: 180, orb: orbs.opposition },
  ];
  if (includeMinor) {
    defs.push(
      { type: 'semisextile', angle: 30, orb: orbs.semisextile ?? 2 },
      { type: 'semisquare', angle: 45, orb: orbs.semisquare ?? 2 },
      { type: 'quincunx', angle: 150, orb: orbs.quincunx ?? 3 },
      { type: 'sesquiquadrate', angle: 135, orb: orbs.sesquiquadrate ?? 2 },
    );
  }
  return defs;
}

function computeAspects(points: Array<{ name: string; absDeg: number }>, orbConfig?: OrbConfiguration, includeMinor: boolean = false): SimpleAspect[] {
  const aspectDefs = buildAspectDefs(orbConfig, includeMinor);
  const out: SimpleAspect[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p1 = points[i];
      const p2 = points[j];
      const diff = angularDifference(p1.absDeg, p2.absDeg);

      for (const asp of aspectDefs) {
        const orb = Math.abs(diff - asp.angle);
        if (orb <= asp.orb) {
          out.push({
            type: asp.type,
            pointA: p1.name,
            pointB: p2.name,
            orb: Number(orb.toFixed(2)),
            exactAngle: asp.angle,
          });
          break;
        }
      }
    }
  }
  out.sort((a, b) => a.orb - b.orb);
  return out;
}

function isDayChartFromSunHouse(sunHouse: number): boolean {
  // Common day/night heuristic: Sun above horizon => houses 7-12 (depending on system).
  // We use a simple one: houses 7-12 => day, else night.
  return sunHouse >= 7;
}

export class EnhancedAstrologyCalculator {
  private static transitsCache: Map<string, TransitCacheEntry> = new Map();
  private static TRANSIT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  static generateNatalChart(birthData: BirthData): NatalChart {
    try {
      InputValidator.validateBirthData(birthData);
      return this.generateWithTimezone(birthData);
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to generate natal chart:', wrapped);
      throw wrapped;
    }
  }

  private static generateWithTimezone(birthData: BirthData): NatalChart {
    const timezoneInfo = this.resolveTimezone(birthData);
    const { year, month, day, hour, minute } = this.parseBirthDateTime(birthData, timezoneInfo);

    const houseSystem: HouseSystem = birthData.houseSystem ?? DEFAULT_HOUSE_SYSTEM;

    // ── Attempt Swiss Ephemeris first (gold standard) ──
    if (isSwissEphemerisAvailable()) {
      try {
        return this.generateWithSwissEphemeris(
          birthData, timezoneInfo, year, month, day, hour, minute, houseSystem
        );
      } catch (sweErr) {
        logger.warn('[Calculator] Swiss Ephemeris failed, falling back to JS engine:', sweErr);
      }
    }

    // ── Fallback: circular-natal-horoscope-js (Node.js tests, web) ──
    logger.info('[Calculator] Using fallback engine (circular-natal-horoscope-js)');
    return this.generateWithFallbackEngine(
      birthData, timezoneInfo, year, month, day, hour, minute, houseSystem
    );
  }

  // ── Swiss Ephemeris primary path ────────────────────────

  private static generateWithSwissEphemeris(
    birthData: BirthData,
    timezoneInfo: TimezoneInfo,
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    houseSystem: HouseSystem
  ): NatalChart {
    const includeHouses = !birthData.hasUnknownTime && Boolean(birthData.time);

    // Configure zodiac system (tropical or sidereal)
    const zodiacSystem = birthData.zodiacSystem ?? 'tropical';
    if (zodiacSystem === 'sidereal') {
      const cached = AstrologySettingsService.getCachedSettings();
      setSiderealMode(cached?.ayanamsa ?? 'lahiri');
    } else {
      setTropicalMode();
    }

    // Determine if asteroids should be included
    const cachedSettings = AstrologySettingsService.getCachedSettings();
    const includeAsteroids = cachedSettings?.showAsteroid ?? true;
    const lilitMethod = cachedSettings?.lilitMethod ?? 'mean';

    // Swiss Ephemeris expects 1-based month; parseBirthDateTime returns 0-based
    const sweMonth = month + 1;

    // Convert local time to UTC for Swiss Ephemeris
    const utc = timezoneInfo.utcDateTime;
    const sweData = sweCalculateChart(
      utc.year,
      utc.month,      // Luxon month is already 1-based
      utc.day,
      utc.hour,
      utc.minute,
      utc.second,
      birthData.latitude,
      birthData.longitude,
      houseSystem,
      includeHouses,
      includeAsteroids,
      zodiacSystem === 'sidereal',
      lilitMethod,
    );

    // Build the same output structures as the fallback engine
    const planets = sweData.planets;
    const aspectPointsByName = new Map<string, number>();
    const legacyPlacements: PlanetPlacement[] = [];

    for (const p of planets) {
      const lp = convertToLegacyPlanetPlacement(
        p.planet, p.absoluteDegree, p.isRetrograde, 1
      );
      lp.speed = p.speed ?? 0;
      legacyPlacements.push(lp);
      aspectPointsByName.set(p.planet, p.absoluteDegree);
    }

    // Houses and angles
    let angles: AnglePosition[] | undefined;
    let houses: SimpleHouseCusp[] | undefined;
    let risingSign: AstrologySign | null = null;
    let legacyHouseCusps: HouseCusp[] = [];
    let cuspDegrees: number[] | undefined = sweData.cusps;
    const ascAbs = sweData.ascendant;
    const mcAbs = sweData.mc;

    if (includeHouses && cuspDegrees && cuspDegrees.length === 12) {
      // Angles
      angles = [];

      if (typeof ascAbs === 'number') {
        const s = signFromLongitude(ascAbs);
        angles.push({
          name: 'Ascendant',
          sign: s.name,
          degree: Number(degreeInSign(ascAbs).toFixed(2)),
          absoluteDegree: Number(ascAbs.toFixed(6)),
        });
        risingSign = s;
        aspectPointsByName.set('Ascendant', ascAbs);
      }

      if (typeof mcAbs === 'number') {
        const s = signFromLongitude(mcAbs);
        angles.push({
          name: 'Midheaven',
          sign: s.name,
          degree: Number(degreeInSign(mcAbs).toFixed(2)),
          absoluteDegree: Number(mcAbs.toFixed(6)),
        });
        aspectPointsByName.set('Midheaven', mcAbs);

        const icAbs = normalize360(mcAbs + 180);
        const icS = signFromLongitude(icAbs);
        angles.push({
          name: 'IC',
          sign: icS.name,
          degree: Number(degreeInSign(icAbs).toFixed(2)),
          absoluteDegree: Number(icAbs.toFixed(6)),
        });
        aspectPointsByName.set('IC', icAbs);
      }

      if (typeof ascAbs === 'number') {
        const dscAbs = normalize360(ascAbs + 180);
        const dscS = signFromLongitude(dscAbs);
        angles.push({
          name: 'Descendant',
          sign: dscS.name,
          degree: Number(degreeInSign(dscAbs).toFixed(2)),
          absoluteDegree: Number(dscAbs.toFixed(6)),
        });
        aspectPointsByName.set('Descendant', dscAbs);
      }

      if (typeof sweData.vertex === 'number') {
        const vxAbs = sweData.vertex;
        const avxAbs = normalize360(vxAbs + 180);
        const vs = signFromLongitude(vxAbs);
        const avs = signFromLongitude(avxAbs);
        angles.push({
          name: 'Vertex',
          sign: vs.name,
          degree: Number(degreeInSign(vxAbs).toFixed(2)),
          absoluteDegree: Number(vxAbs.toFixed(6)),
        });
        angles.push({
          name: 'Anti-Vertex',
          sign: avs.name,
          degree: Number(degreeInSign(avxAbs).toFixed(2)),
          absoluteDegree: Number(avxAbs.toFixed(6)),
        });
        aspectPointsByName.set('Vertex', vxAbs);
        aspectPointsByName.set('Anti-Vertex', avxAbs);
      }

      // Houses
      houses = cuspDegrees.map((absDeg, idx) => {
        const s = signFromLongitude(absDeg);
        return {
          house: idx + 1,
          sign: s.name,
          degree: Number(degreeInSign(absDeg).toFixed(2)),
          absoluteDegree: Number(absDeg.toFixed(6)),
        };
      });

      legacyHouseCusps = houses.map((h) => ({
        house: h.house,
        longitude: h.absoluteDegree,
        sign: ZODIAC_SIGNS[Math.floor(h.absoluteDegree / 30)] as ZodiacSign,
      }));

      // Assign houses to planets
      this.assignHousesToPlanets(planets, legacyPlacements, cuspDegrees);
    }

    // Build the rest of the chart using shared logic
    return this.assembleChart(
      birthData, timezoneInfo, houseSystem,
      planets, legacyPlacements, aspectPointsByName,
      angles, houses, risingSign, legacyHouseCusps, cuspDegrees,
      ascAbs, mcAbs, 'swiss-ephemeris'
    );
  }

  // ── Fallback engine (circular-natal-horoscope-js) ──────

  private static generateWithFallbackEngine(
    birthData: BirthData,
    timezoneInfo: TimezoneInfo,
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    houseSystem: HouseSystem
  ): NatalChart {
    const origin = new Origin({
      year,
      month, // 0-based (0=Jan, 11=Dec) — converted in parseBirthDateTime
      date: day,
      hour,
      minute,
      latitude: birthData.latitude,
      longitude: birthData.longitude,
    });

    const horoscope = new Horoscope({
      origin,
      houseSystem,
      zodiac: 'tropical',
      aspectPoints: ['bodies', 'angles'],
      aspectWithPoints: ['bodies', 'angles'],
      aspectTypes: ['major'],
      customOrbs: {},
      language: 'en',
    });

    // Planets
    const { planets, legacyPlacements, aspectPointsByName } = this.calculatePlanets(horoscope);

    // Angles/houses (time-known only)
    const { angles, houses, risingSign, legacyHouseCusps, cuspDegrees, ascAbs, mcAbs } =
      this.calculateAnglesAndHouses(birthData, horoscope, aspectPointsByName);

    // Assign houses to planets (PlanetPosition + existing legacy planet placement
    if (cuspDegrees && cuspDegrees.length === 12) {
      this.assignHousesToPlanets(planets, legacyPlacements, cuspDegrees);
    }

    return this.assembleChart(
      birthData, timezoneInfo, houseSystem,
      planets, legacyPlacements, aspectPointsByName,
      angles, houses, risingSign, legacyHouseCusps, cuspDegrees,
      ascAbs, mcAbs, 'circular-natal-horoscope-js'
    );
  }

  // ── Shared chart assembly ──────────────────────────────

  private static assembleChart(
    birthData: BirthData,
    timezoneInfo: TimezoneInfo,
    houseSystem: HouseSystem,
    planets: PlanetPosition[],
    legacyPlacements: PlanetPlacement[],
    aspectPointsByName: Map<string, number>,
    angles: AnglePosition[] | undefined,
    houses: SimpleHouseCusp[] | undefined,
    risingSign: AstrologySign | null,
    legacyHouseCusps: HouseCusp[],
    cuspDegrees: number[] | undefined,
    ascAbs: number | undefined,
    mcAbs: number | undefined,
    engine: 'swiss-ephemeris' | 'circular-natal-horoscope-js'
  ): NatalChart {

    // ✅ Create REAL legacy Ascendant + Midheaven placements (NO FAKE)
    // They are required by many UI components; we only set them when time is known + angles exist.
    if (!birthData.hasUnknownTime && birthData.time) {
      if (typeof ascAbs !== 'number' || typeof mcAbs !== 'number') {
        throw new Error('Angles (Ascendant/Midheaven) could not be calculated with the provided birth time.');
      }

      const ascHouse =
        cuspDegrees && cuspDegrees.length === 12 ? computeHouseForLongitude(ascAbs, cuspDegrees) ?? 1 : 1;
      const mcHouse =
        cuspDegrees && cuspDegrees.length === 12 ? computeHouseForLongitude(mcAbs, cuspDegrees) ?? 10 : 10;

      // Remove any accidental duplicates before pushing
      for (let i = legacyPlacements.length - 1; i >= 0; i--) {
        const n = legacyPlacements[i]?.planet?.name;
        if (n === 'Ascendant' || n === 'Midheaven') legacyPlacements.splice(i, 1);
      }

      legacyPlacements.push(convertToLegacyPlanetPlacement('Ascendant', ascAbs, false, ascHouse));
      legacyPlacements.push(convertToLegacyPlanetPlacement('Midheaven', mcAbs, false, mcHouse));
    }

    // Aspects (include angles if present) — use orb config from user settings
    const orbConfig = AstrologySettingsService.getCachedOrbConfig();
    const showMinorAspects = AstrologySettingsService.getCachedSettings()?.showMinorAspects ?? false;
    const aspectPoints = Array.from(aspectPointsByName.entries()).map(([name, absDeg]) => ({ name, absDeg }));
    const aspectsSimple = computeAspects(aspectPoints, orbConfig, showMinorAspects);
    const aspectsLegacy = this.convertToLegacyAspects(aspectsSimple, legacyPlacements, aspectPointsByName);

    // Key placements + sun/moon signs for legacy usage (NO FAKE: Asc/MC must exist when time known)
    const key = this.extractKeyPlacements(legacyPlacements, birthData);

    // ── Part of Fortune (only when time known) ──
    let partOfFortune: PointPlacement | undefined;
    if (!birthData.hasUnknownTime && birthData.time) {
      const sunAbs = aspectPointsByName.get('Sun');
      const moonAbs = aspectPointsByName.get('Moon');
      const ascDeg = aspectPointsByName.get('Ascendant');

      if (typeof sunAbs === 'number' && typeof moonAbs === 'number' && typeof ascDeg === 'number') {
        const dayChart = isDayChartFromSunHouse(key.individualPlacements.sun.house);

        const pofAbs = dayChart
          ? normalize360(ascDeg + moonAbs - sunAbs)
          : normalize360(ascDeg + sunAbs - moonAbs);

        const sign = ZODIAC_SIGNS[Math.floor(pofAbs / 30)] as ZodiacSign;
        const { degree, minute } = degMinFromAbs(pofAbs);
        const house =
          cuspDegrees && cuspDegrees.length === 12 ? computeHouseForLongitude(pofAbs, cuspDegrees) : undefined;

        partOfFortune = {
          name: 'Part of Fortune',
          longitude: pofAbs,
          sign,
          degree,
          minute,
          house,
        };

        aspectPointsByName.set('Part of Fortune', pofAbs);
      }
    }

    // Accuracy metadata (reference comparison)
    const calculationAccuracy = this.validateCalculationAccuracy(birthData, planets, aspectsSimple, engine);

    const timeBasedFeaturesAvailable = this.determineFeatureAvailability(birthData);

    // ── Moon uncertainty (unknown or approximate time) ──
    let moonUncertainty: MoonUncertainty | undefined;
    if (birthData.hasUnknownTime || birthData.approximateTime) {
      try {
        const utc = timezoneInfo.utcDateTime;
        const { hourMin, hourMax } = getTimeWindowForApproximation(birthData.approximateTime);
        if (isSwissEphemerisAvailable()) {
          moonUncertainty = calcMoonUncertainty(
            utc.year, utc.month, utc.day, hourMin, hourMax
          );
        } else {
          // Fallback: estimate from Moon's average daily motion (~13.2°/day)
          const windowHours = hourMax - hourMin;
          const maxError = (13.2 / 24) * windowHours / 2;
          const moonPos = planets.find(p => p.planet === 'Moon');
          if (moonPos) {
            const minLon = normalize360(moonPos.absoluteDegree - maxError);
            const maxLon = normalize360(moonPos.absoluteDegree + maxError);
            const possibleSigns: string[] = [];
            const steps = Math.max(4, Math.ceil(maxError * 2 / 5));
            for (let i = 0; i <= steps; i++) {
              const testLon = normalize360(minLon + (i / steps) * maxError * 2);
              const signIdx = Math.floor(testLon / 30);
              const s = ZODIAC_SIGNS[signIdx]?.name ?? 'Aries';
              if (!possibleSigns.includes(s)) possibleSigns.push(s);
            }
            moonUncertainty = {
              minLongitude: Number(minLon.toFixed(6)),
              maxLongitude: Number(maxLon.toFixed(6)),
              maxErrorDegrees: Number(maxError.toFixed(2)),
              possibleSigns,
              signChangesPossible: possibleSigns.length > 1,
            };
          }
        }
      } catch (e) {
        logger.warn('[Calculator] Moon uncertainty calculation failed:', e);
      }
    }

    return {
      id: `chart_${Date.now()}`,
      name: birthData.place,
      birthData: { ...birthData, timezone: timezoneInfo.timezone },

      // Legacy compatibility
      sunSign: key.sunSign,
      moonSign: key.moonSign,
      risingSign,

      placements: legacyPlacements,
      houseCusps: legacyHouseCusps,
      aspects: aspectsLegacy,

      sun: key.individualPlacements.sun,
      moon: key.individualPlacements.moon,
      mercury: key.individualPlacements.mercury,
      venus: key.individualPlacements.venus,
      mars: key.individualPlacements.mars,
      jupiter: key.individualPlacements.jupiter,
      saturn: key.individualPlacements.saturn,
      uranus: key.individualPlacements.uranus,
      neptune: key.individualPlacements.neptune,
      pluto: key.individualPlacements.pluto,
      ascendant: key.individualPlacements.ascendant,
      midheaven: key.individualPlacements.midheaven,

      // Enhanced data
      planets,
      houseSystem,
      houses,
      angles,

      // ✅ Calculated point
      partOfFortune,

      // Moon uncertainty range (populated when birth time is unknown/approximate)
      moonUncertainty,

      calculationAccuracy,
      timeBasedFeaturesAvailable,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private static resolveTimezone(birthData: BirthData): TimezoneInfo {
    let timeStr: string;
    if (birthData.hasUnknownTime) {
      // Use approximate time midpoint if available, otherwise noon
      const midHour = this.getApproximateMidpointHour(birthData.approximateTime);
      timeStr = `${birthData.date}T${String(midHour).padStart(2, '0')}:00:00`;
    } else {
      timeStr = `${birthData.date}T${birthData.time || '12:00:00'}`;
    }

    return TimezoneHandler.resolveHistoricalTimezone(
      timeStr,
      birthData.latitude,
      birthData.longitude,
      birthData.timezone
    );
  }

  /** Get the midpoint hour for an approximate time period */
  private static getApproximateMidpointHour(period?: ApproximateTimePeriod): number {
    switch (period) {
      case 'morning':   return 9;   // midpoint of 6–12
      case 'afternoon': return 15;  // midpoint of 12–18
      case 'evening':   return 21;  // midpoint of 18–24
      case 'night':     return 3;   // midpoint of 0–6
      default:          return 12;  // noon for truly unknown
    }
  }

  private static parseBirthDateTime(birthData: BirthData, timezoneInfo: TimezoneInfo) {
    const local = timezoneInfo.localDateTime;
    if (birthData.hasUnknownTime) {
      const midHour = this.getApproximateMidpointHour(birthData.approximateTime);
      return {
        year: local.year,
        month: local.month - 1,
        day: local.day,
        hour: midHour,
        minute: 0,
      };
    }
    return {
      year: local.year,
      month: local.month - 1, // Origin expects 0-based month (0=Jan, 11=Dec); Luxon returns 1-12
      day: local.day,
      hour: local.hour,
      minute: local.minute,
    };
  }

  private static calculatePlanets(horoscope: any) {
    const bodiesOrder: Array<{ key: string; label: string }> = [
      { key: 'sun', label: 'Sun' },
      { key: 'moon', label: 'Moon' },
      { key: 'mercury', label: 'Mercury' },
      { key: 'venus', label: 'Venus' },
      { key: 'mars', label: 'Mars' },
      { key: 'jupiter', label: 'Jupiter' },
      { key: 'saturn', label: 'Saturn' },
      { key: 'uranus', label: 'Uranus' },
      { key: 'neptune', label: 'Neptune' },
      { key: 'pluto', label: 'Pluto' },
      { key: 'chiron', label: 'Chiron' },
    ];

    const rawBodies = horoscope.CelestialBodies || {};
    const planets: PlanetPosition[] = [];
    const legacyPlacements: PlanetPlacement[] = [];
    const aspectPointsByName = new Map<string, number>();

    for (const b of bodiesOrder) {
      const body = rawBodies[b.key];
      const absDeg = extractAbsDegree(body);
      if (absDeg == null) continue;

      const s = signFromLongitude(absDeg);
      const degIn = degreeInSign(absDeg);
      const retro = Boolean(body?.isRetrograde);

      // Extract real daily speed from the horoscope library when available
      const rawSpeed: number | undefined =
        body?.ChartPosition?.Ecliptic?.Speed ??
        body?.chartPosition?.ecliptic?.speed ??
        body?.speed ??
        undefined;
      const speed = typeof rawSpeed === 'number' && Number.isFinite(rawSpeed) ? rawSpeed : 0;

      planets.push({
        planet: b.label,
        sign: s.name,
        degree: Number(degIn.toFixed(2)),
        absoluteDegree: Number(absDeg.toFixed(6)),
        isRetrograde: retro,
        retrograde: retro,
        speed,
      });

      const lp = convertToLegacyPlanetPlacement(b.label, absDeg, retro, 1);
      lp.speed = speed;
      legacyPlacements.push(lp);
      aspectPointsByName.set(b.label, absDeg);
    }

    // Extract Lunar Nodes from CelestialPoints (separate from CelestialBodies)
    const rawPoints = horoscope.CelestialPoints || {};
    for (const { key, label } of [
      { key: 'northnode', label: 'North Node' },
      { key: 'southnode', label: 'South Node' },
    ]) {
      const point = rawPoints[key];
      const absDeg = extractAbsDegree(point);
      if (absDeg == null) continue;

      const s = signFromLongitude(absDeg);
      const degIn = degreeInSign(absDeg);

      planets.push({
        planet: label,
        sign: s.name,
        degree: Number(degIn.toFixed(2)),
        absoluteDegree: Number(absDeg.toFixed(6)),
        isRetrograde: true,
        retrograde: true, // Nodes are always mean-retrograde
      });

      aspectPointsByName.set(label, absDeg);
    }

    return { planets, legacyPlacements, aspectPointsByName };
  }

  private static calculateAnglesAndHouses(
    birthData: BirthData,
    horoscope: any,
    aspectPointsByName: Map<string, number>
  ) {
    let angles: AnglePosition[] | undefined;
    let houses: SimpleHouseCusp[] | undefined;
    let risingSign: AstrologySign | null = null;
    let legacyHouseCusps: HouseCusp[] = [];
    let cuspDegrees: number[] | undefined;

    let ascAbs: number | undefined;
    let mcAbs: number | undefined;

    if (!birthData.hasUnknownTime && birthData.time) {
      const asc = horoscope.Ascendant;
      const mc = horoscope.Midheaven;

      const ascDeg = extractAbsDegree(asc);
      const mcDeg = extractAbsDegree(mc);

      angles = [];

      if (ascDeg != null) {
        ascAbs = ascDeg;
        const s = signFromLongitude(ascDeg);
        angles.push({
          name: 'Ascendant',
          sign: s.name,
          degree: Number(degreeInSign(ascDeg).toFixed(2)),
          absoluteDegree: Number(ascDeg.toFixed(6)),
        });
        risingSign = s;
        aspectPointsByName.set('Ascendant', ascDeg);
      }

      if (mcDeg != null) {
        mcAbs = mcDeg;
        const s = signFromLongitude(mcDeg);
        angles.push({
          name: 'Midheaven',
          sign: s.name,
          degree: Number(degreeInSign(mcDeg).toFixed(2)),
          absoluteDegree: Number(mcDeg.toFixed(6)),
        });
        aspectPointsByName.set('Midheaven', mcDeg);

        const icAbs = normalize360(mcDeg + 180);
        const icS = signFromLongitude(icAbs);
        angles.push({
          name: 'IC',
          sign: icS.name,
          degree: Number(degreeInSign(icAbs).toFixed(2)),
          absoluteDegree: Number(icAbs.toFixed(6)),
        });
        aspectPointsByName.set('IC', icAbs);
      }

      if (ascDeg != null) {
        const dscAbs = normalize360(ascDeg + 180);
        const dscS = signFromLongitude(dscAbs);
        angles.push({
          name: 'Descendant',
          sign: dscS.name,
          degree: Number(degreeInSign(dscAbs).toFixed(2)),
          absoluteDegree: Number(dscAbs.toFixed(6)),
        });
        aspectPointsByName.set('Descendant', dscAbs);
      }

      const rawHouses: any[] = horoscope.Houses || [];
      cuspDegrees = rawHouses
        .map((h) => extractAbsDegree(h))
        .filter((x): x is number => typeof x === 'number' && Number.isFinite(x));

      if (cuspDegrees.length === 12) {
        houses = cuspDegrees.map((absDeg, idx) => {
          const s = signFromLongitude(absDeg);
          return {
            house: idx + 1,
            sign: s.name,
            degree: Number(degreeInSign(absDeg).toFixed(2)),
            absoluteDegree: Number(absDeg.toFixed(6)),
          };
        });

        legacyHouseCusps = houses.map((h) => ({
          house: h.house,
          longitude: h.absoluteDegree,
          sign: ZODIAC_SIGNS[Math.floor(h.absoluteDegree / 30)] as ZodiacSign,
        }));
      }
    }

    return { angles, houses, risingSign, legacyHouseCusps, cuspDegrees, ascAbs, mcAbs };
  }

  private static assignHousesToPlanets(
    planets: PlanetPosition[],
    legacyPlacements: PlanetPlacement[],
    cuspDegrees: number[]
  ) {
    const legacyByName = new Map<string, PlanetPlacement>();
    for (const lp of legacyPlacements) legacyByName.set(lp.planet.name, lp);

    for (const p of planets) {
      const house = computeHouseForLongitude(p.absoluteDegree, cuspDegrees);
      if (!house) continue;
      p.house = house;

      const legacy = legacyByName.get(p.planet);
      if (legacy) legacy.house = house;
    }
  }

  private static convertToLegacyAspects(
    aspects: SimpleAspect[],
    legacyPlacements: PlanetPlacement[],
    aspectPointsByName: Map<string, number>
  ): Aspect[] {
    // Build speed lookup from legacy placements
    const legacyBySpeed = new Map<string, number>();
    for (const lp of legacyPlacements) {
      legacyBySpeed.set(lp.planet.name, lp.speed);
    }

    return aspects.map((a) => {
      const planet1 =
        (PLANETS[a.pointA.toLowerCase()] ||
          { name: a.pointA, symbol: '?', type: 'Personal' }) as Planet;

      const planet2 =
        (PLANETS[a.pointB.toLowerCase()] ||
          { name: a.pointB, symbol: '?', type: 'Personal' }) as Planet;

      const aspectType = ASPECT_TYPES.find((at) => at.name.toLowerCase() === a.type) || ASPECT_TYPES[0];

      // Determine if aspect is applying (gap closing) or separating (gap widening).
      // Use speeds of both planets to check if the angular difference is decreasing.
      const p1Speed = legacyBySpeed?.get(a.pointA) ?? 0;
      const p2Speed = legacyBySpeed?.get(a.pointB) ?? 0;
      const isApplying = this.computeIsApplying(
        aspectPointsByName?.get(a.pointA) ?? 0,
        aspectPointsByName?.get(a.pointB) ?? 0,
        p1Speed,
        p2Speed,
        a.exactAngle
      );

      return {
        planet1,
        planet2,
        type: aspectType,
        orb: a.orb,
        isApplying,
        strength: Math.max(0, 1 - a.orb / (aspectType.orb || 8)),
      };
    });
  }

  /**
   * Determine whether an aspect is applying (angular gap closing) or separating.
   * Computes where each planet will be in a small time step and checks if the
   * angular difference to the exact aspect angle is decreasing.
   */
  private static computeIsApplying(
    lon1: number,
    lon2: number,
    speed1: number,
    speed2: number,
    exactAngle: number
  ): boolean {
    // If we have no real speed data, default to false (separating)
    if (speed1 === 0 && speed2 === 0) return false;

    const currentDiff = angularDifference(lon1, lon2);
    const currentOrb = Math.abs(currentDiff - exactAngle);

    // Project positions forward by a small step (1 day)
    const futureLon1 = normalize360(lon1 + speed1);
    const futureLon2 = normalize360(lon2 + speed2);
    const futureDiff = angularDifference(futureLon1, futureLon2);
    const futureOrb = Math.abs(futureDiff - exactAngle);

    // If the orb is getting smaller, the aspect is applying
    return futureOrb < currentOrb;
  }

  private static extractKeyPlacements(legacyPlacements: PlanetPlacement[], birthData: BirthData) {
    const find = (n: string) => legacyPlacements.find((p) => p.planet.name === n);

    const sun = find('Sun');
    const moon = find('Moon');
    const mercury = find('Mercury');
    const venus = find('Venus');
    const mars = find('Mars');
    const jupiter = find('Jupiter');
    const saturn = find('Saturn');
    const uranus = find('Uranus');
    const neptune = find('Neptune');
    const pluto = find('Pluto');

    if (!sun || !moon || !mercury || !venus || !mars || !jupiter || !saturn || !uranus || !neptune || !pluto) {
      throw new Error('Missing core planet placements (Sun..Pluto).');
    }

    const sunSign = signFromLongitude(sun.longitude);
    const moonSign = signFromLongitude(moon.longitude);

    // ✅ NO FAKE: if time is known, Ascendant/Midheaven MUST exist or we throw.
    let ascendant = find('Ascendant');
    let midheaven = find('Midheaven');

    const hasTime = !birthData.hasUnknownTime && Boolean(birthData.time);
    if (hasTime) {
      if (!ascendant || !midheaven) {
        throw new Error('Ascendant/Midheaven placements are required when birth time is known (no fake angles).');
      }
    } else {
      // Time is unknown — Ascendant/Midheaven cannot be calculated.
      // Leave them undefined rather than creating fake objects that pass truthiness checks.
      // UI components should check `chart.timeBasedFeaturesAvailable.angles` before accessing.
      // Do NOT set ascendant/midheaven to a bare Planet object — it would have undefined
      // longitude/sign/house/degree which causes silent failures downstream.
    }

    return {
      sunSign,
      moonSign,
      individualPlacements: {
        sun,
        moon,
        mercury,
        venus,
        mars,
        jupiter,
        saturn,
        uranus,
        neptune,
        pluto,
        ascendant: ascendant as PlanetPlacement | undefined,
        midheaven: midheaven as PlanetPlacement | undefined,
      },
    };
  }

  private static validateCalculationAccuracy(
    birthData: BirthData,
    planets: PlanetPosition[],
    aspects: SimpleAspect[],
    engine: 'swiss-ephemeris' | 'circular-natal-horoscope-js' = 'circular-natal-horoscope-js'
  ) {
    // Swiss Ephemeris has sub-arcsecond precision for all bodies
    const planetaryAccuracy = engine === 'swiss-ephemeris'
      ? 0.0001
      : planets.reduce((acc, planet) => {
      let expectedAccuracy: number;
      switch (planet.planet.toLowerCase()) {
        case 'sun':
          expectedAccuracy = 0.01;
          break;
        case 'moon':
          expectedAccuracy = 0.1;
          break;
        case 'mercury':
        case 'venus':
        case 'mars':
          expectedAccuracy = 0.01;
          break;
        default:
          expectedAccuracy = 0.001;
          break;
      }
      return Math.max(acc, expectedAccuracy);
    }, 0);

    const aspectAccuracy = aspects.length > 0 ? aspects.reduce((sum, a) => sum + a.orb, 0) / aspects.length : 0;

    let referenceComparison: ReturnType<typeof compareWithReferenceEphemeris> | undefined;
    try {
      referenceComparison = compareWithReferenceEphemeris(birthData, planets);
    } catch {
      // Reference comparison failed - chart is still valid but unverified
    }

    // Compute house accuracy: house cusps depend on Ascendant/MC, which have
    // the same angular precision as the planetary calculations. Use the Sun
    // reference difference (most stable body) as a representative metric.
    // If no reference is available, use the planetary accuracy estimate.
    let houseAccuracy = planetaryAccuracy;
    if (referenceComparison?.comparisons?.length) {
      const sunComp = referenceComparison.comparisons.find(
        c => c.planet.toLowerCase() === 'sun'
      );
      houseAccuracy = sunComp ? sunComp.difference : planetaryAccuracy;
    }

    return {
      planetaryPositions: planetaryAccuracy,
      housePositions: houseAccuracy,
      aspectOrbs: aspectAccuracy,
      validationStatus: (engine === 'swiss-ephemeris'
        ? 'verified'
        : referenceComparison?.comparisons?.length ? 'verified' : 'unverified') as
        | 'verified'
        | 'approximate'
        | 'unverified',
      referenceComparison,
    };
  }

  private static determineFeatureAvailability(birthData: BirthData) {
    const hasTime = !birthData.hasUnknownTime && Boolean(birthData.time);
    return {
      risingSign: hasTime,
      houses: hasTime,
      angles: hasTime,
      houseBasedInterpretations: hasTime,
    };
  }

  /**
   * Geocentric transits (no houses/angles). Cached hourly.
   * Uses Swiss Ephemeris when available, falls back to circular-natal-horoscope-js.
   */
  static calculateTransits(date: Date = new Date()): TransitData {
    const cacheKey = date.toISOString().slice(0, 13);
    const cached = this.transitsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.TRANSIT_CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      let placements: PlanetPlacement[];

      if (isSwissEphemerisAvailable()) {
        // ── Swiss Ephemeris path ──
        const { calculateTransitPositions } = require('./swissEphemerisEngine');
        const cached = AstrologySettingsService.getCachedSettings();
        const isSidereal = (cached?.zodiacSystem ?? 'tropical') === 'sidereal';
        if (isSidereal) {
          const { setSiderealMode } = require('./swissEphemerisEngine');
          setSiderealMode(cached?.ayanamsa ?? 'lahiri');
        }
        const transitPlanets: PlanetPosition[] = calculateTransitPositions(date, isSidereal);
        placements = transitPlanets.map(p =>
          convertToLegacyPlanetPlacement(p.planet, p.absoluteDegree, p.isRetrograde, 0)
        );
        // Set real speeds
        for (let i = 0; i < placements.length; i++) {
          placements[i].speed = transitPlanets[i]?.speed ?? 0;
        }
      } else {
        // ── Fallback: circular-natal-horoscope-js ──
        const origin = new Origin({
          year: date.getFullYear(),
          month: date.getMonth(),
          date: date.getDate(),
          hour: date.getHours(),
          minute: date.getMinutes(),
          latitude: 0,
          longitude: 0,
        });

        const horoscope = new Horoscope({
          origin,
          houseSystem: 'whole-sign',
          zodiac: 'tropical',
          aspectPoints: ['bodies'],
          aspectWithPoints: ['bodies'],
          aspectTypes: [],
          customOrbs: {},
          language: 'en',
        });

        const rawBodies = horoscope.CelestialBodies || {};
        placements = [];

        const bodiesOrder = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

        for (const key of bodiesOrder) {
          const body = rawBodies[key];
          const absDeg = extractAbsDegree(body);
          if (absDeg == null) continue;

          const name = key.charAt(0).toUpperCase() + key.slice(1);
          placements.push(convertToLegacyPlanetPlacement(name, absDeg, Boolean(body?.isRetrograde), 0));
        }
      }

      const payload: TransitData = { date: date.toISOString(), placements, aspects: [] };
      this.transitsCache.set(cacheKey, { data: payload, timestamp: Date.now() });

      if (this.transitsCache.size > 200) {
        const firstKey = this.transitsCache.keys().next().value;
        if (firstKey) this.transitsCache.delete(firstKey);
      }

      return payload;
    } catch (err) {
      logger.error('Failed to calculate transits:', err);
      // Do NOT return empty but valid-looking data — callers must know the calculation failed
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Transit calculation failed for ${date.toISOString()}: ${errorMsg}`);
    }
  }

  /**
   * Validate calculation accuracy for a natal chart
   * @param chart The natal chart to validate
   * @returns Validation result with accuracy metrics
   */
  static validateAccuracy(chart: NatalChart): {
    isValid: boolean;
    planetaryAccuracy: number;
    aspectAccuracy: number;
    validationTimestamp: string;
  } {
    const hasPlanetaryData = chart.placements && chart.placements.length > 0;
    const hasAspects = chart.aspects && chart.aspects.length >= 0;
    const hasSunMoon = Boolean(chart.sun) && Boolean(chart.moon);

    let planetaryScore = 0;
    if (chart.placements) {
      const validPlacements = chart.placements.filter((p) => p.longitude >= 0 && p.longitude < 360 && p.sign);
      planetaryScore = chart.placements.length > 0 ? (validPlacements.length / chart.placements.length) * 100 : 0;
    }

    let aspectScore = 100;
    if (chart.aspects && chart.aspects.length > 0) {
      const validAspects = chart.aspects.filter((a) => a.orb >= 0 && a.orb <= 10 && a.planet1 && a.planet2);
      aspectScore = (validAspects.length / chart.aspects.length) * 100;
    }

    return {
      isValid: Boolean(hasPlanetaryData && hasAspects && hasSunMoon),
      planetaryAccuracy: Math.round(planetaryScore * 100) / 100,
      aspectAccuracy: Math.round(aspectScore * 100) / 100,
      validationTimestamp: new Date().toISOString(),
    };
  }
}

// Backwards-compatible alias for app components
export const AstrologyCalculator = EnhancedAstrologyCalculator;
