/**
 * Shared test fixtures for astrology service tests.
 */
import type { NatalChart, PlanetPlacement, ZodiacSign, Planet, Aspect, AspectType, HouseCusp, AstrologySign, BirthData } from '../types';

// ── Helper builders ─────────────────────────────────────────

function makeSign(name: string, element: 'Fire' | 'Earth' | 'Air' | 'Water', modality: 'Cardinal' | 'Fixed' | 'Mutable', number: number): ZodiacSign {
  const symbols: Record<string, string> = { Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓' };
  return { name, symbol: symbols[name] ?? '?', element, modality, ruler: { name: 'Sun', symbol: '☉', type: 'Luminary' }, number };
}

function makePlanet(name: string, type: Planet['type'] = 'Personal'): Planet {
  const symbols: Record<string, string> = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', Ascendant: 'ASC', Midheaven: 'MC', Chiron: '⚷', 'North Node': '☊' };
  return { name, symbol: symbols[name] ?? '?', type };
}

export function makePlacement(
  planetName: string,
  longitude: number,
  signName: string,
  element: 'Fire' | 'Earth' | 'Air' | 'Water',
  modality: 'Cardinal' | 'Fixed' | 'Mutable',
  signNumber: number,
  house: number,
  isRetrograde = false,
  type: Planet['type'] = 'Personal',
): PlanetPlacement {
  const deg = longitude % 30;
  return {
    planet: makePlanet(planetName, type),
    longitude,
    sign: makeSign(signName, element, modality, signNumber),
    house,
    degree: Math.floor(deg),
    minute: Math.floor((deg - Math.floor(deg)) * 60),
    isRetrograde,
    speed: isRetrograde ? -0.5 : 1.0,
  };
}

function makeAstrologySign(name: string, element: 'Fire' | 'Earth' | 'Air' | 'Water', quality: 'Cardinal' | 'Fixed' | 'Mutable'): AstrologySign {
  return { name, symbol: '?', element, quality, rulingPlanet: 'Sun', dates: '' };
}

export function makeAspect(
  planet1Name: string,
  planet2Name: string,
  typeName: string,
  degrees: number,
  orb: number,
  nature: 'Harmonious' | 'Challenging' | 'Neutral' = 'Harmonious',
): Aspect {
  const symbols: Record<string, string> = { Conjunction: '☌', Opposition: '☍', Trine: '△', Square: '□', Sextile: '⚹' };
  return {
    planet1: makePlanet(planet1Name, 'Luminary'),
    planet2: makePlanet(planet2Name),
    type: { name: typeName, symbol: symbols[typeName] ?? '?', degrees, orb: 8, nature },
    orb,
    isApplying: false,
    strength: 1 - orb / 10,
  };
}

export function makeHouseCusps(): HouseCusp[] {
  const signs: [string, 'Fire' | 'Earth' | 'Air' | 'Water', 'Cardinal' | 'Fixed' | 'Mutable', number][] = [
    ['Cancer', 'Water', 'Cardinal', 4], ['Leo', 'Fire', 'Fixed', 5], ['Virgo', 'Earth', 'Mutable', 6],
    ['Libra', 'Air', 'Cardinal', 7], ['Scorpio', 'Water', 'Fixed', 8], ['Sagittarius', 'Fire', 'Mutable', 9],
    ['Capricorn', 'Earth', 'Cardinal', 10], ['Aquarius', 'Air', 'Fixed', 11], ['Pisces', 'Water', 'Mutable', 12],
    ['Aries', 'Fire', 'Cardinal', 1], ['Taurus', 'Earth', 'Fixed', 2], ['Gemini', 'Air', 'Mutable', 3],
  ];
  return signs.map(([name, element, modality, number], i) => ({
    house: i + 1,
    longitude: (90 + i * 30) % 360,
    sign: makeSign(name, element, modality, number),
  }));
}

/** Standard test chart with diverse placements */
export function makeTestChart(overrides: Partial<NatalChart> = {}): NatalChart {
  const sun = makePlacement('Sun', 355, 'Pisces', 'Water', 'Mutable', 12, 9, false, 'Luminary');
  const moon = makePlacement('Moon', 158, 'Virgo', 'Earth', 'Mutable', 6, 3, false, 'Luminary');
  const mercury = makePlacement('Mercury', 340, 'Pisces', 'Water', 'Mutable', 12, 9);
  const venus = makePlacement('Venus', 10, 'Aries', 'Fire', 'Cardinal', 1, 10);
  const mars = makePlacement('Mars', 200, 'Libra', 'Air', 'Cardinal', 7, 4);
  const jupiter = makePlacement('Jupiter', 100, 'Cancer', 'Water', 'Cardinal', 4, 1, false, 'Social');
  const saturn = makePlacement('Saturn', 290, 'Capricorn', 'Earth', 'Cardinal', 10, 7, true, 'Social');
  const uranus = makePlacement('Uranus', 280, 'Capricorn', 'Earth', 'Cardinal', 10, 7, false, 'Transpersonal');
  const neptune = makePlacement('Neptune', 285, 'Capricorn', 'Earth', 'Cardinal', 10, 7, false, 'Transpersonal');
  const pluto = makePlacement('Pluto', 225, 'Scorpio', 'Water', 'Fixed', 8, 5, false, 'Transpersonal');

  const ascendant = makePlacement('Ascendant', 90, 'Cancer', 'Water', 'Cardinal', 4, 1, false, 'Point');
  const midheaven = makePlacement('Midheaven', 0, 'Aries', 'Fire', 'Cardinal', 1, 10, false, 'Point');

  const aspects: Aspect[] = [
    makeAspect('Sun', 'Mercury', 'Conjunction', 0, 5),
    makeAspect('Sun', 'Moon', 'Opposition', 180, 7, 'Challenging'),
    makeAspect('Saturn', 'Uranus', 'Conjunction', 0, 5),
    makeAspect('Saturn', 'Neptune', 'Conjunction', 0, 5),
    makeAspect('Venus', 'Mars', 'Opposition', 180, 5, 'Challenging'),
    makeAspect('Jupiter', 'Pluto', 'Trine', 120, 5),
    makeAspect('Moon', 'Pluto', 'Sextile', 60, 3),
  ];

  return {
    id: 'test-chart-1',
    name: 'Test Person',
    birthData: {
      date: '1990-03-15',
      time: '14:30',
      hasUnknownTime: false,
      place: 'New York, NY',
      latitude: 40.7128,
      longitude: -74.006,
    },
    sunSign: makeAstrologySign('Pisces', 'Water', 'Mutable'),
    moonSign: makeAstrologySign('Virgo', 'Earth', 'Mutable'),
    risingSign: makeAstrologySign('Cancer', 'Water', 'Cardinal'),
    placements: [sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto],
    houseCusps: makeHouseCusps(),
    aspects,
    sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto,
    ascendant,
    midheaven,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}
