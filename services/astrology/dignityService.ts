// services/astrology/dignityService.ts
// Planet dignity, dispositor chains, mutual receptions, and chart shape detection.

import { NatalChart, PlanetPlacement } from './types';

// ── Essential Dignity Tables ──────────────────────────────────────────

/** Modern ruler mapping (sign name → planet name) */
const MODERN_RULERS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Pluto',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Uranus', Pisces: 'Neptune',
};

/** Traditional ruler mapping */
const TRADITIONAL_RULERS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

/** Exaltation (sign name → planet name) */
const EXALTATIONS: Record<string, string> = {
  Aries: 'Sun', Taurus: 'Moon', Cancer: 'Jupiter', Virgo: 'Mercury',
  Libra: 'Saturn', Scorpio: 'Uranus', Capricorn: 'Mars', Pisces: 'Venus',
};

/** Detriment — planet is in sign opposite its domicile */
const DETRIMENTS: Record<string, string[]> = {
  Aries: ['Venus'], Taurus: ['Mars', 'Pluto'], Gemini: ['Jupiter'],
  Cancer: ['Saturn'], Leo: ['Saturn', 'Uranus'], Virgo: ['Neptune', 'Jupiter'],
  Libra: ['Mars'], Scorpio: ['Venus'], Sagittarius: ['Mercury'],
  Capricorn: ['Moon'], Aquarius: ['Sun'], Pisces: ['Mercury'],
};

/** Fall — planet is in sign opposite its exaltation */
const FALLS: Record<string, string> = {
  Libra: 'Sun', Scorpio: 'Moon', Capricorn: 'Jupiter', Pisces: 'Mercury',
  Aries: 'Saturn', Taurus: 'Uranus', Cancer: 'Mars', Virgo: 'Venus',
};

// ── Dignity per-planet ───────────────────────────────────────────────

export type DignityLevel = 'domicile' | 'exaltation' | 'detriment' | 'fall' | 'peregrine';

export interface PlanetDignity {
  planet: string;
  sign: string;
  dignity: DignityLevel;
  label: string;           // e.g. "Venus in Taurus (Domicile)"
  description: string;     // 1–2 sentence interpretation
  score: number;           // +5 domicile, +4 exaltation, −3 detriment, −4 fall, 0 peregrine
}

function getDignityLevel(planetName: string, signName: string): DignityLevel {
  // Domicile
  if (MODERN_RULERS[signName] === planetName || TRADITIONAL_RULERS[signName] === planetName) return 'domicile';
  // Exaltation
  if (EXALTATIONS[signName] === planetName) return 'exaltation';
  // Fall
  if (FALLS[signName] === planetName) return 'fall';
  // Detriment
  if (DETRIMENTS[signName]?.includes(planetName)) return 'detriment';
  return 'peregrine';
}

const DIGNITY_SCORES: Record<DignityLevel, number> = {
  domicile: 5, exaltation: 4, detriment: -3, fall: -4, peregrine: 0,
};

const DIGNITY_DESCRIPTIONS: Record<DignityLevel, (planet: string, sign: string) => string> = {
  domicile: (p, s) =>
    `${p} is at home in ${s}. It expresses its core nature freely — this is one of the most comfortable and powerful placements in your chart.`,
  exaltation: (p, s) =>
    `${p} is exalted in ${s}. Its energy is elevated and especially potent here — like a guest of honor whose strengths are highlighted.`,
  detriment: (p, s) =>
    `${p} is in detriment in ${s}. It must work harder to express itself, which can create tension — but that friction often fuels creative adaptation.`,
  fall: (p, s) =>
    `${p} is in fall in ${s}. Its natural expression feels muted or challenged here. Growth comes from learning to work with the sign's energy rather than against it.`,
  peregrine: (p, s) =>
    `${p} in ${s} is peregrine — neither strengthened nor weakened by dignity. Its expression depends more on aspects, house, and the overall chart context.`,
};

export function getPlanetDignity(planetName: string, signName: string): PlanetDignity {
  const dignity = getDignityLevel(planetName, signName);
  return {
    planet: planetName,
    sign: signName,
    dignity,
    label: `${planetName} in ${signName} (${dignity.charAt(0).toUpperCase() + dignity.slice(1)})`,
    description: DIGNITY_DESCRIPTIONS[dignity](planetName, signName),
    score: DIGNITY_SCORES[dignity],
  };
}

// ── Chart-wide dignity analysis ─────────────────────────────────────

export interface ChartDignityAnalysis {
  planetDignities: PlanetDignity[];
  strongestPlanets: PlanetDignity[];   // domicile + exaltation
  challengedPlanets: PlanetDignity[];  // detriment + fall
  totalDignityScore: number;
  summary: string;
}

export function analyzeChartDignity(chart: NatalChart): ChartDignityAnalysis {
  const corePlanets: PlanetPlacement[] = [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ].filter(Boolean);

  const dignities = corePlanets.map(p =>
    getPlanetDignity(p.planet.name, typeof p.sign === 'string' ? p.sign : p.sign.name)
  );

  const strong = dignities.filter(d => d.dignity === 'domicile' || d.dignity === 'exaltation');
  const challenged = dignities.filter(d => d.dignity === 'detriment' || d.dignity === 'fall');
  const totalScore = dignities.reduce((sum, d) => sum + d.score, 0);

  let summary: string;
  if (strong.length >= 3 && challenged.length <= 1) {
    summary = `Your chart has several planets in strong dignity — ${strong.map(d => d.planet).join(', ')} operate with natural ease. This suggests areas where your instincts and abilities are well-supported.`;
  } else if (challenged.length >= 3 && strong.length <= 1) {
    summary = `Several planets in your chart are in challenging dignity — ${challenged.map(d => d.planet).join(', ')} face friction in their signs. This often correlates with resilience and hard-won growth in those areas.`;
  } else if (strong.length > 0 && challenged.length > 0) {
    summary = `Your chart shows a mix of strength and challenge. ${strong.map(d => d.planet).join(', ')} ${strong.length === 1 ? 'operates' : 'operate'} with natural ease, while ${challenged.map(d => d.planet).join(', ')} ${challenged.length === 1 ? 'works' : 'work'} harder in ${challenged.length === 1 ? 'its' : 'their'} current sign${challenged.length === 1 ? '' : 's'}. This combination creates depth and nuance.`;
  } else {
    summary = 'Most of your planets are in neutral dignity — peregrine. Their expression depends heavily on aspects, house placement, and the overall chart context rather than sign-based strength alone.';
  }

  return { planetDignities: dignities, strongestPlanets: strong, challengedPlanets: challenged, totalDignityScore: totalScore, summary };
}

// ── Dispositor Chain & Final Dispositor ─────────────────────────────

export interface DispositorChain {
  chain: { planet: string; sign: string; dispositor: string }[];
  finalDispositor: string | null;       // planet that rules itself (or part of a mutual reception loop)
  mutualReceptions: [string, string][]; // pairs of planets in mutual reception
  description: string;
}

function getSignRuler(signName: string): string {
  return MODERN_RULERS[signName] ?? signName;
}

export function analyzeDispositorChain(chart: NatalChart): DispositorChain {
  const corePlanets: PlanetPlacement[] = [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ].filter(Boolean);

  const planetToSign = new Map<string, string>();
  for (const p of corePlanets) {
    const signName = typeof p.sign === 'string' ? p.sign : p.sign.name;
    planetToSign.set(p.planet.name, signName);
  }

  // Build chain entries
  const chain = corePlanets.map(p => {
    const signName = typeof p.sign === 'string' ? p.sign : p.sign.name;
    return { planet: p.planet.name, sign: signName, dispositor: getSignRuler(signName) };
  });

  // Find mutual receptions: A rules B's sign and B rules A's sign
  const mutualReceptions: [string, string][] = [];
  const planetNames = Array.from(planetToSign.keys());
  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const a = planetNames[i];
      const b = planetNames[j];
      const signA = planetToSign.get(a)!;
      const signB = planetToSign.get(b)!;
      if (getSignRuler(signA) === b && getSignRuler(signB) === a) {
        mutualReceptions.push([a, b]);
      }
    }
  }

  // Find final dispositor: follow chain until loop or self-rule
  let finalDispositor: string | null = null;
  const visited = new Set<string>();
  let current = corePlanets[0]?.planet.name;
  if (current) {
    while (current && !visited.has(current)) {
      visited.add(current);
      const sign = planetToSign.get(current);
      if (!sign) break;
      const ruler = getSignRuler(sign);
      if (ruler === current) {
        finalDispositor = current;
        break;
      }
      if (!planetToSign.has(ruler)) break;
      current = ruler;
    }
  }

  // If we didn't find a self-ruling planet, check if we hit a mutual reception loop
  if (!finalDispositor && visited.size > 0) {
    for (const [a, b] of mutualReceptions) {
      if (visited.has(a) && visited.has(b)) {
        finalDispositor = a; // Use one of the mutual reception pair
        break;
      }
    }
  }

  // Build description
  let description: string;
  if (finalDispositor) {
    const fdSign = planetToSign.get(finalDispositor) ?? '';
    description = `${finalDispositor} is the final dispositor of your chart — it rules its own sign (${fdSign}) and many other planets ultimately answer to it. This makes ${finalDispositor} themes central to how your chart operates as a whole.`;
  } else if (mutualReceptions.length > 0) {
    const [a, b] = mutualReceptions[0];
    description = `Your chart has no single final dispositor, but ${a} and ${b} form a mutual reception — each rules the other's sign. This creates a cooperative loop where these two planetary energies support and exchange with each other.`;
  } else {
    description = 'Your chart has no single final dispositor. Multiple chains of rulership distribute authority across several planets, suggesting a more distributed inner structure with no single dominant theme.';
  }

  return { chain, finalDispositor, mutualReceptions, description };
}

// ── Chart Shape Detection ───────────────────────────────────────────

export type ChartShape =
  | 'Bundle'       // All planets within ~120°
  | 'Bowl'         // All planets within ~180°
  | 'Bucket'       // Bowl with one planet (handle) on the other side
  | 'Locomotive'   // All planets within ~240° (one-third empty)
  | 'Seesaw'       // Two groups separated by empty space
  | 'Splash'       // Planets widely distributed (7+ signs)
  | 'Splay'        // Irregular distribution with clusters
  | 'Unknown';

export interface ChartShapeResult {
  shape: ChartShape;
  description: string;
  handlePlanet?: string;  // For Bucket shape
}

export function detectChartShape(chart: NatalChart): ChartShapeResult {
  const placements: PlanetPlacement[] = [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ].filter(Boolean);

  if (placements.length < 5) return { shape: 'Unknown', description: 'Not enough planets to determine chart shape.' };

  const longitudes = placements.map(p => p.longitude).sort((a, b) => a - b);
  const names = placements.map(p => p.planet.name);

  // Map longitude → planet name
  const longToName = new Map<number, string>();
  for (const p of placements) longToName.set(p.longitude, p.planet.name);

  // Find the largest empty arc
  const gaps: number[] = [];
  for (let i = 0; i < longitudes.length; i++) {
    const next = longitudes[(i + 1) % longitudes.length];
    const curr = longitudes[i];
    const gap = ((next - curr + 360) % 360);
    gaps.push(gap);
  }
  const maxGap = Math.max(...gaps);
  const occupiedArc = 360 - maxGap;

  // Count occupied signs
  const occupiedSigns = new Set(placements.map(p => typeof p.sign === 'string' ? p.sign : p.sign.name));

  // Bundle: all within ~120°
  if (occupiedArc <= 125) {
    return {
      shape: 'Bundle',
      description: 'All of your planets are concentrated in roughly one-third of the chart. This creates intense focus — your energy and attention converge in specific life areas, giving you depth but potentially limiting breadth of experience.',
    };
  }

  // Bowl: all within ~180°
  if (occupiedArc <= 190) {
    return {
      shape: 'Bowl',
      description: 'Your planets are gathered in one half of the chart, leaving the other half empty. This creates a strong sense of self-containment and purpose, but the empty hemisphere often represents areas of life you are drawn to explore or develop.',
    };
  }

  // Bucket: Bowl-like but with one planet separated as a "handle"
  // Check if removing one planet makes the rest fit in 180°
  for (let i = 0; i < longitudes.length; i++) {
    const without = [...longitudes.slice(0, i), ...longitudes.slice(i + 1)];
    const withoutGaps: number[] = [];
    for (let j = 0; j < without.length; j++) {
      const next = without[(j + 1) % without.length];
      const curr = without[j];
      withoutGaps.push(((next - curr + 360) % 360));
    }
    const withoutMaxGap = Math.max(...withoutGaps);
    const withoutOccupied = 360 - withoutMaxGap;
    if (withoutOccupied <= 190) {
      // The removed planet is the handle
      const handleName = longToName.get(longitudes[i]) ?? names[i];
      return {
        shape: 'Bucket',
        description: `Your chart forms a Bucket pattern with ${handleName} as the handle — most planets are gathered on one side, and ${handleName} on the other acts as a focal point for directing all that concentrated energy outward.`,
        handlePlanet: handleName,
      };
    }
  }

  // Locomotive: occupied arc ~240° (120° gap)
  if (maxGap >= 60 && maxGap <= 130 && occupiedArc >= 230) {
    return {
      shape: 'Locomotive',
      description: 'Your planets span about two-thirds of the chart, leaving one-third empty. This Locomotive pattern suggests strong drive and momentum — you move through life with purpose, and the leading planet of the occupied arc often shows how you initiate action.',
    };
  }

  // Seesaw: two distinct groups with gaps ≥ 60° between them
  let largeGaps = 0;
  for (const gap of gaps) {
    if (gap >= 55) largeGaps++;
  }
  if (largeGaps >= 2) {
    return {
      shape: 'Seesaw',
      description: 'Your planets form two distinct groups on opposite sides of the chart. This Seesaw pattern reflects a life of balancing two major themes or orientations — you may feel pulled between contrasting needs, and integration is your growth edge.',
    };
  }

  // Splash: broadly distributed (7+ signs)
  if (occupiedSigns.size >= 7) {
    return {
      shape: 'Splash',
      description: 'Your planets are widely scattered across the chart, touching many signs and houses. This Splash pattern suggests versatility, broad interests, and a capacity to engage with many areas of life — though focus may need deliberate cultivation.',
    };
  }

  // Splay: irregular clusters
  return {
    shape: 'Splay',
    description: 'Your planets form an irregular, clustered distribution. This Splay pattern suggests strong individuality — you resist being categorized and tend to operate in your own unique way, with several distinct focal points of energy.',
  };
}

// ── Singleton Detection ─────────────────────────────────────────────

export interface Singleton {
  planet: string;
  type: 'element' | 'modality' | 'hemisphere';
  detail: string;
  description: string;
}

export function detectSingletons(chart: NatalChart): Singleton[] {
  const placements: PlanetPlacement[] = [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ].filter(Boolean);

  const singletons: Singleton[] = [];

  // Element singletons
  const elementCounts: Record<string, string[]> = { Fire: [], Earth: [], Air: [], Water: [] };
  for (const p of placements) {
    const el = typeof p.sign === 'string' ? '' : p.sign.element;
    if (el && elementCounts[el]) elementCounts[el].push(p.planet.name);
  }
  for (const [element, planets] of Object.entries(elementCounts)) {
    if (planets.length === 1) {
      singletons.push({
        planet: planets[0],
        type: 'element',
        detail: `Only ${element} planet`,
        description: `${planets[0]} is your only planet in ${element}. This makes it a singleton — it carries the full weight of ${element} energy in your chart, giving it outsized importance in how you experience ${element.toLowerCase()} themes.`,
      });
    }
  }

  // Modality singletons
  const modalityCounts: Record<string, string[]> = { Cardinal: [], Fixed: [], Mutable: [] };
  for (const p of placements) {
    const mod = typeof p.sign === 'string' ? '' : p.sign.modality;
    if (mod && modalityCounts[mod]) modalityCounts[mod].push(p.planet.name);
  }
  for (const [modality, planets] of Object.entries(modalityCounts)) {
    if (planets.length === 1) {
      singletons.push({
        planet: planets[0],
        type: 'modality',
        detail: `Only ${modality} planet`,
        description: `${planets[0]} is your only planet in a ${modality} sign. It becomes the sole carrier of ${modality.toLowerCase()} energy — you may feel its themes more acutely than others.`,
      });
    }
  }

  return singletons;
}

// ── Interception Detection ──────────────────────────────────────────

export interface Interception {
  interceptedSigns: [string, string];  // always an axis pair
  houses: [number, number];
  description: string;
}

export function detectInterceptions(chart: NatalChart): Interception[] {
  // Interceptions only occur in quadrant house systems (Placidus, Koch, etc.)
  // In Whole Sign and Equal House, every sign rules exactly one house
  if (!chart.houseCusps || chart.houseCusps.length < 12) return [];
  if (chart.houseSystem === 'whole-sign' || chart.houseSystem === 'equal-house') return [];

  const cuspSigns = chart.houseCusps.map(c =>
    typeof c.sign === 'string' ? c.sign : c.sign.name
  );

  // Find signs not appearing on any cusp
  const allSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ];
  const cuspSignSet = new Set(cuspSigns);
  const interceptedSigns = allSigns.filter(s => !cuspSignSet.has(s));

  // Interceptions come in pairs (opposite signs)
  const interceptions: Interception[] = [];
  const used = new Set<string>();
  for (const sign of interceptedSigns) {
    if (used.has(sign)) continue;
    const signIdx = allSigns.indexOf(sign);
    const oppIdx = (signIdx + 6) % 12;
    const oppSign = allSigns[oppIdx];
    used.add(sign);
    used.add(oppSign);

    // Find which houses contain these intercepted signs
    // The intercepted sign falls between two cusp signs in a house
    let house1 = 0;
    let house2 = 0;
    for (let i = 0; i < 12; i++) {
      const nextI = (i + 1) % 12;
      const cuspSign = cuspSigns[i];
      const nextCuspSign = cuspSigns[nextI];
      // Count signs between cusp sign and next cusp sign
      const cuspIdx = allSigns.indexOf(cuspSign);
      const nextCuspIdx = allSigns.indexOf(nextCuspSign);
      const span = ((nextCuspIdx - cuspIdx + 12) % 12);
      if (span > 1) {
        // This house spans more than one sign — check if our intercepted sign is in the span
        for (let s = 1; s < span; s++) {
          const midSign = allSigns[(cuspIdx + s) % 12];
          if (midSign === sign) house1 = i + 1;
          if (midSign === oppSign) house2 = i + 1;
        }
      }
    }

    interceptions.push({
      interceptedSigns: [sign, oppSign],
      houses: [house1, house2],
      description: `${sign} and ${oppSign} are intercepted — they don't appear on any house cusp. These signs' themes may feel harder to access directly or take longer to develop. The houses containing them (${house1} and ${house2}) hold hidden layers of experience that unfold over time.`,
    });
  }

  return interceptions;
}
