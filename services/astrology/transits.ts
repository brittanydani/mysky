// File: services/astrology/transits.ts
import { NatalChart, HouseSystem, SimpleAspect, AspectTypeName } from './types';

// circular-natal-horoscope-js
const { Origin, Horoscope } = require('circular-natal-horoscope-js');

const ASPECTS: Array<{ type: AspectTypeName; angle: number; orb: number }> = [
  { type: 'conjunction', angle: 0, orb: 3 }, // tighter transit orbs
  { type: 'sextile', angle: 60, orb: 3 },
  { type: 'square', angle: 90, orb: 3 },
  { type: 'trine', angle: 120, orb: 3 },
  { type: 'opposition', angle: 180, orb: 3 },
];

function normalize360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

function extractAbsDegree(obj: any): number | null {
  const direct =
    obj?.ChartPosition?.Ecliptic?.DecimalDegrees ??
    obj?.chartPosition?.ecliptic?.decimalDegrees ??
    obj?.Ecliptic?.DecimalDegrees ??
    obj?.ecliptic?.decimalDegrees ??
    obj?.absoluteDegrees ??
    obj?.longitude ??
    obj?.elon;

  if (typeof direct === 'number' && Number.isFinite(direct)) return normalize360(direct);
  return null;
}

export interface TransitInfo {
  longitudes: Record<string, number>;
  retrogrades: string[]; // planet names currently retrograde
}

/**
 * Detect retrograde by comparing a planet's longitude today vs. 2 days later.
 * If longitude decreases (accounting for 360° wrap), the planet is retrograde.
 */
function detectRetrogrades(
  todayLongitudes: Record<string, number>,
  latitude: number,
  longitude: number,
  houseSystem: HouseSystem,
  date: Date
): string[] {
  const retrogrades: string[] = [];
  // Only check planets that can be retrograde (not Sun/Moon)
  const candidates = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

  // Get positions 2 days later
  const futureDate = new Date(date);
  futureDate.setDate(futureDate.getDate() + 2);
  const futureOrigin = new Origin({
    year: futureDate.getFullYear(),
    month: futureDate.getMonth(), // Origin expects 0-based month (0=Jan, 11=Dec); getMonth() already returns 0–11
    date: futureDate.getDate(),
    hour: futureDate.getHours(),
    minute: futureDate.getMinutes(),
    latitude,
    longitude,
  });
  const futureHoroscope = new Horoscope({
    origin: futureOrigin,
    houseSystem,
    zodiac: 'tropical',
    aspectPoints: ['bodies'],
    aspectWithPoints: ['bodies'],
    aspectTypes: [],
    customOrbs: {},
    language: 'en',
  });
  const futureBodies = (futureHoroscope as any).CelestialBodies || {};

  for (const planet of candidates) {
    const todayDeg = todayLongitudes[planet];
    const futureDeg = extractAbsDegree(futureBodies[planet.toLowerCase()]);
    if (todayDeg == null || futureDeg == null) continue;

    // Calculate forward motion (accounting for 360° wrap)
    let motion = futureDeg - todayDeg;
    if (motion > 180) motion -= 360;
    if (motion < -180) motion += 360;

    if (motion < 0) retrogrades.push(planet);
  }

  return retrogrades;
}

export function getTransitingLongitudes(
  date: Date,
  latitude: number,
  longitude: number,
  houseSystem: HouseSystem = 'placidus'
): Record<string, number> {
  return getTransitInfo(date, latitude, longitude, houseSystem).longitudes;
}

export function getTransitInfo(
  date: Date,
  latitude: number,
  longitude: number,
  houseSystem: HouseSystem = 'placidus'
): TransitInfo {
  // Note: for geocentric longitudes, location doesn't materially change planet positions,
  // but we pass latitude/longitude to keep the library happy and support future features.
  const origin = new Origin({
    year: date.getFullYear(),
    month: date.getMonth(), // Origin expects 0-based month (0=Jan, 11=Dec); getMonth() already returns 0–11
    date: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    latitude,
    longitude,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem,
    zodiac: 'tropical',
    aspectPoints: ['bodies'],
    aspectWithPoints: ['bodies'],
    aspectTypes: [],
    customOrbs: {},
    language: 'en',
  });

  const bodies = (horoscope as any).CelestialBodies || {};
  const map: Record<string, number> = {};

  const keys: Array<[string, string]> = [
    ['Sun', 'sun'],
    ['Moon', 'moon'],
    ['Mercury', 'mercury'],
    ['Venus', 'venus'],
    ['Mars', 'mars'],
    ['Jupiter', 'jupiter'],
    ['Saturn', 'saturn'],
    ['Uranus', 'uranus'],
    ['Neptune', 'neptune'],
    ['Pluto', 'pluto'],
  ];

  for (const [label, key] of keys) {
    const abs = extractAbsDegree(bodies[key]);
    if (abs != null) map[label] = abs;
  }

  const retrogrades = detectRetrogrades(map, latitude, longitude, houseSystem, date);

  return { longitudes: map, retrogrades };
}

export function computeTransitAspectsToNatal(
  natal: NatalChart,
  transits: Record<string, number>
): SimpleAspect[] {
  // Natal points we care about for daily weather:
  // Moon + Sun + Saturn + Venus + (ASC if known)
  const natalPoints: Array<{ name: string; absDeg: number }> = [];

  // Prefer enhanced planets if available (they should have absoluteDegree if you add it),
  // else fall back to legacy placements (longitude exists).
  const getNatalAbs = (planetName: string): number | null => {
    // Enhanced planets
    const p = natal.planets?.find((x: any) => x.planet === planetName);
    if (p) {
      // If you added absoluteDegree to PlanetPosition, use it
      if (typeof (p as any).absoluteDegree === 'number') return normalize360((p as any).absoluteDegree);

      // Fallback reconstruction (less ideal)
      if (typeof (p as any).sign === 'string' && typeof (p as any).degree === 'number') {
        return toAbsFromSignDegree((p as any).sign, (p as any).degree);
      }
    }

    // Legacy placements (best fallback because longitude is true absolute degree)
    const lp = natal.placements?.find((pl) => pl.planet.name === planetName);
    if (lp && typeof lp.longitude === 'number') return normalize360(lp.longitude);

    return null;
  };

  const signIndex: Record<string, number> = {
    Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5,
    Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11,
  };

  function toAbsFromSignDegree(sign: string, degree: number): number {
    const idx = signIndex[sign] ?? 0;
    return normalize360(idx * 30 + degree);
  }

  const moonAbs = getNatalAbs('Moon');
  if (moonAbs != null) natalPoints.push({ name: 'Moon', absDeg: moonAbs });

  const sunAbs = getNatalAbs('Sun');
  if (sunAbs != null) natalPoints.push({ name: 'Sun', absDeg: sunAbs });

  const saturnAbs = getNatalAbs('Saturn');
  if (saturnAbs != null) natalPoints.push({ name: 'Saturn', absDeg: saturnAbs });

  const venusAbs = getNatalAbs('Venus');
  if (venusAbs != null) natalPoints.push({ name: 'Venus', absDeg: venusAbs });

  const asc = natal.angles?.find((a) => a.name === 'Ascendant');
  if (asc && typeof asc.absoluteDegree === 'number') natalPoints.push({ name: 'Ascendant', absDeg: normalize360(asc.absoluteDegree) });

  // For daily emotional weather, we use Transit Moon as the main trigger.
  const transitMoon = transits['Moon'];
  if (typeof transitMoon !== 'number') return [];

  const out: SimpleAspect[] = [];

  for (const np of natalPoints) {
    let diff = Math.abs(transitMoon - np.absDeg);
    if (diff > 180) diff = 360 - diff;

    for (const asp of ASPECTS) {
      const orb = Math.abs(diff - asp.angle);
      if (orb <= asp.orb) {
        out.push({
          type: asp.type,
          pointA: 'Moon',        // transiting planet name (keep simple)
          pointB: np.name,       // natal point name
          orb: Number(orb.toFixed(2)),
          exactAngle: asp.angle,
        });
        break;
      }
    }
  }

  // Sort tightest first
  out.sort((a, b) => a.orb - b.orb);
  return out;
}
