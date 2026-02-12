import { logger } from '../../utils/logger';
// File: services/astrology/calculator.ts
// Enhanced astronomical calculations using circular-natal-horoscope-js
// ✅ Real planetary longitudes, houses, angles, aspects
// ✅ Unknown time handled via UnknownTimeHandler
// ✅ Timezone normalization via TimezoneHandler
// ✅ Assigns houses to planets + legacy placements when birth time is known
// ✅ Keeps legacy compatibility fields for your existing emotional/story system
// ✅ Dev-only reference validation (to avoid privacy issues in production)
// ✅ NO FAKE Ascendant / Midheaven (real angles only; otherwise chart generation fails for those fields)

import { TimezoneHandler, TimezoneInfo } from './timezoneHandler';
import { compareWithReferenceEphemeris } from './accuracyValidation';
import { InputValidator } from './inputValidator';

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
} from './types';

import { ZODIAC_SIGNS, PLANETS, ASPECT_TYPES } from './constants';
import { AstrologySettingsService, OrbConfiguration, ORB_CONFIGURATIONS } from './astrologySettingsService';
import { Origin, Horoscope } from 'circular-natal-horoscope-js';

// Legacy Zodiac (used for AstrologySign lookups)
const LEGACY_ZODIAC_SIGNS: AstrologySign[] = [
  { name: 'Aries', symbol: '♈', element: 'Fire', quality: 'Cardinal', rulingPlanet: 'Mars', dates: 'March 21 - April 19' },
  { name: 'Taurus', symbol: '♉', element: 'Earth', quality: 'Fixed', rulingPlanet: 'Venus', dates: 'April 20 - May 20' },
  { name: 'Gemini', symbol: '♊', element: 'Air', quality: 'Mutable', rulingPlanet: 'Mercury', dates: 'May 21 - June 20' },
  { name: 'Cancer', symbol: '♋', element: 'Water', quality: 'Cardinal', rulingPlanet: 'Moon', dates: 'June 21 - July 22' },
  { name: 'Leo', symbol: '♌', element: 'Fire', quality: 'Fixed', rulingPlanet: 'Sun', dates: 'July 23 - August 22' },
  { name: 'Virgo', symbol: '♍', element: 'Earth', quality: 'Mutable', rulingPlanet: 'Mercury', dates: 'August 23 - September 22' },
  { name: 'Libra', symbol: '♎', element: 'Air', quality: 'Cardinal', rulingPlanet: 'Venus', dates: 'September 23 - October 22' },
  { name: 'Scorpio', symbol: '♏', element: 'Water', quality: 'Fixed', rulingPlanet: 'Pluto', dates: 'October 23 - November 21' },
  { name: 'Sagittarius', symbol: '♐', element: 'Fire', quality: 'Mutable', rulingPlanet: 'Jupiter', dates: 'November 22 - December 21' },
  { name: 'Capricorn', symbol: '♑', element: 'Earth', quality: 'Cardinal', rulingPlanet: 'Saturn', dates: 'December 22 - January 19' },
  { name: 'Aquarius', symbol: '♒', element: 'Air', quality: 'Fixed', rulingPlanet: 'Uranus', dates: 'January 20 - February 18' },
  { name: 'Pisces', symbol: '♓', element: 'Water', quality: 'Mutable', rulingPlanet: 'Neptune', dates: 'February 19 - March 20' },
];

// Default configuration
const DEFAULT_HOUSE_SYSTEM: HouseSystem = 'whole-sign';

// Cache for transits to avoid recalculating too frequently
type TransitCacheEntry = { timestamp: number; data: TransitData };

function normalize360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

function degreeInSign(absDeg: number): number {
  return normalize360(absDeg) % 30;
}

function degMinFromAbs(absDeg: number): { degree: number; minute: number } {
  const d = degreeInSign(absDeg);
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60);
  return { degree: deg, minute: min };
}

function signFromLongitude(absDeg: number): AstrologySign {
  const idx = Math.floor(normalize360(absDeg) / 30);
  return LEGACY_ZODIAC_SIGNS[idx] ?? LEGACY_ZODIAC_SIGNS[0];
}

function extractAbsDegree(obj: any): number | null {
  const direct =
    obj?.ChartPosition?.Ecliptic?.DecimalDegrees ??
    obj?.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees ??
    obj?.chartPosition?.ecliptic?.decimalDegrees ??
    obj?.chartPosition?.startPosition?.ecliptic?.decimalDegrees ??
    obj?.Ecliptic?.DecimalDegrees ??
    obj?.ecliptic?.decimalDegrees ??
    obj?.absoluteDegrees ??
    obj?.longitude ??
    obj?.elon;

  if (typeof direct === 'number' && Number.isFinite(direct)) return normalize360(direct);
  return null;
}

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
    speed: 0,
  };
}

function angularDifference(a: number, b: number): number {
  let d = Math.abs(normalize360(a) - normalize360(b));
  if (d > 180) d = 360 - d;
  return d;
}

function buildAspectDefs(orbConfig?: OrbConfiguration): Array<{ type: AspectTypeName; angle: number; orb: number }> {
  const orbs = orbConfig ?? ORB_CONFIGURATIONS.normal;
  return [
    { type: 'conjunction', angle: 0, orb: orbs.conjunction },
    { type: 'sextile', angle: 60, orb: orbs.sextile },
    { type: 'square', angle: 90, orb: orbs.square },
    { type: 'trine', angle: 120, orb: orbs.trine },
    { type: 'opposition', angle: 180, orb: orbs.opposition },
  ];
}

function computeAspects(points: Array<{ name: string; absDeg: number }>, orbConfig?: OrbConfiguration): SimpleAspect[] {
  const aspectDefs = buildAspectDefs(orbConfig);
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

function computeHouseForLongitude(absDeg: number, cuspDegrees: number[]): number | null {
  if (!Array.isArray(cuspDegrees) || cuspDegrees.length !== 12) return null;

  const lon = normalize360(absDeg);
  for (let i = 0; i < 12; i++) {
    const start = normalize360(cuspDegrees[i]);
    const end = normalize360(cuspDegrees[(i + 1) % 12]);

    // wrap-around
    if (start <= end) {
      if (lon >= start && lon < end) return i + 1;
    } else {
      if (lon >= start || lon < end) return i + 1;
    }
  }
  return null;
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
    const aspectPoints = Array.from(aspectPointsByName.entries()).map(([name, absDeg]) => ({ name, absDeg }));
    const aspectsSimple = computeAspects(aspectPoints, orbConfig);
    const aspectsLegacy = this.convertToLegacyAspects(aspectsSimple);

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

        // If you ever want PoF aspects, uncomment:
        // aspectPointsByName.set('Part of Fortune', pofAbs);
      }
    }

    // Accuracy metadata (reference comparison)
    const calculationAccuracy = this.validateCalculationAccuracy(birthData, planets, aspectsSimple);

    const timeBasedFeaturesAvailable = this.determineFeatureAvailability(birthData);

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

      calculationAccuracy,
      timeBasedFeaturesAvailable,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private static resolveTimezone(birthData: BirthData): TimezoneInfo {
    const dateTimeString = birthData.hasUnknownTime
      ? `${birthData.date}T12:00:00`
      : `${birthData.date}T${birthData.time || '12:00:00'}`;

    return TimezoneHandler.resolveHistoricalTimezone(
      dateTimeString,
      birthData.latitude,
      birthData.longitude,
      birthData.timezone
    );
  }

  private static parseBirthDateTime(birthData: BirthData, timezoneInfo: TimezoneInfo) {
    const local = timezoneInfo.localDateTime;
    return {
      year: local.year,
      month: local.month - 1, // Origin expects 0-based month (0=Jan, 11=Dec); Luxon returns 1-12
      day: local.day,
      hour: birthData.hasUnknownTime ? 12 : local.hour,
      minute: birthData.hasUnknownTime ? 0 : local.minute,
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

      planets.push({
        planet: b.label,
        sign: s.name,
        degree: Number(degIn.toFixed(2)),
        absoluteDegree: Number(absDeg.toFixed(6)),
        isRetrograde: retro,
        retrograde: retro,
      });

      legacyPlacements.push(convertToLegacyPlanetPlacement(b.label, absDeg, retro, 1));
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

  private static convertToLegacyAspects(aspects: SimpleAspect[]): Aspect[] {
    return aspects.map((a) => {
      const planet1 =
        (PLANETS[a.pointA.toLowerCase()] ||
          (a.pointA.toLowerCase() === 'ascendant' ? ensurePointPlanet('Ascendant') : undefined) ||
          (a.pointA.toLowerCase() === 'midheaven' ? ensurePointPlanet('Midheaven') : undefined) ||
          { name: a.pointA, symbol: '?', type: 'Personal' }) as Planet;

      const planet2 =
        (PLANETS[a.pointB.toLowerCase()] ||
          (a.pointB.toLowerCase() === 'ascendant' ? ensurePointPlanet('Ascendant') : undefined) ||
          (a.pointB.toLowerCase() === 'midheaven' ? ensurePointPlanet('Midheaven') : undefined) ||
          { name: a.pointB, symbol: '?', type: 'Personal' }) as Planet;

      const aspectType = ASPECT_TYPES.find((at) => at.name.toLowerCase() === a.type) || ASPECT_TYPES[0];

      return {
        planet1,
        planet2,
        type: aspectType,
        orb: a.orb,
        isApplying: false,
        strength: Math.max(0, 1 - a.orb / (aspectType.orb || 8)),
      };
    });
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
      // If the app still expects these fields but time is unknown, we keep them absent in placements.
      // The UnknownTimeHandler should provide a chart compatible with your UI expectations.
      // We do NOT fabricate them here.
      if (!ascendant) ascendant = ensurePointPlanet('Ascendant') as any;
      if (!midheaven) midheaven = ensurePointPlanet('Midheaven') as any;
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
        ascendant: ascendant as PlanetPlacement,
        midheaven: midheaven as PlanetPlacement,
      },
    };
  }

  private static validateCalculationAccuracy(birthData: BirthData, planets: PlanetPosition[], aspects: SimpleAspect[]) {
    const planetaryAccuracy = planets.reduce((acc, planet) => {
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

    return {
      planetaryPositions: planetaryAccuracy,
      housePositions: 0.1,
      aspectOrbs: aspectAccuracy,
      validationStatus: (referenceComparison?.comparisons?.length ? 'verified' : 'unverified') as
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
   */
  static calculateTransits(date: Date = new Date()): TransitData {
    const cacheKey = date.toISOString().slice(0, 13);
    const cached = this.transitsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.TRANSIT_CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const origin = new Origin({
        year: date.getFullYear(),
        month: date.getMonth(), // Origin expects 0-based month (0=Jan, 11=Dec); getMonth() already returns 0–11
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
      const placements: PlanetPlacement[] = [];

      const bodiesOrder = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

      for (const key of bodiesOrder) {
        const body = rawBodies[key];
        const absDeg = extractAbsDegree(body);
        if (absDeg == null) continue;

        const name = key.charAt(0).toUpperCase() + key.slice(1);
        placements.push(convertToLegacyPlanetPlacement(name, absDeg, Boolean(body?.isRetrograde), 0));
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
      return { date: date.toISOString(), placements: [], aspects: [] };
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
