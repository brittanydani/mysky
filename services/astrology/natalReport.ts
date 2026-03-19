// services/astrology/natalReport.ts
// Comprehensive natal chart report assembly.
// Produces a single structured report that incorporates every available layer.

import { NatalChart, PlanetPlacement } from './types';
import { detectChartPatterns, ChartPatterns } from './chartPatterns';
import { detectExtendedPatterns, ExtendedPatterns } from './aspectPatterns';
import {
  analyzeChartDignity,
  analyzeDispositorChain,
  detectChartShape,
  detectSingletons,
  detectInterceptions,
  ChartDignityAnalysis,
  DispositorChain,
  ChartShapeResult,
  Singleton,
  Interception,
} from './dignityService';
import {
  generateCoreIdentitySummary,
  generateRelationshipProfile,
  generateCareerProfile,
  generateEmotionalProfile,
  generateShadowGrowth,
  CoreIdentitySummary,
  RelationshipProfile,
  CareerProfile,
  EmotionalProfile,
  ShadowGrowthProfile,
} from './natalSynthesis';
import {
  generateAdvancedLayers,
  SectAnalysis,
  DecanInfo,
  CriticalDegreeInfo,
  FixedStarConjunction,
  SabianSymbolInfo,
  ArabicLot,
  Midpoint,
} from './advancedLayers';

// ── Report Types ────────────────────────────────────────────────────

export interface PlanetaryPlacementDetail {
  planet: string;
  symbol: string;
  sign: string;
  signSymbol: string;
  degree: number;
  minute: number;
  formattedPosition: string;      // e.g. "22°48' Leo"
  house: number;
  isRetrograde: boolean;
  decan?: DecanInfo;
  sabianSymbol?: SabianSymbolInfo;
  criticalDegree?: CriticalDegreeInfo;
  fixedStars: FixedStarConjunction[];
  dignityLabel?: string;
  dignityScore?: number;
}

export interface AngleDetail {
  name: string;
  sign: string;
  degree: number;
  minute: number;
  formattedPosition: string;
  fixedStars: FixedStarConjunction[];
}

export interface HouseDetail {
  house: number;
  cuspSign: string;
  cuspDegree: number;
  planets: string[];
  theme: string;
}

export interface AspectDetail {
  planet1: string;
  planet2: string;
  aspectType: string;
  symbol: string;
  orb: number;
  nature: string;
  isApplying: boolean;
  strength: number;
}

export interface ElementModalityBreakdown {
  fire: number;
  earth: number;
  air: number;
  water: number;
  cardinal: number;
  fixed: number;
  mutable: number;
  masculine: number;
  feminine: number;
  dominantElement: string;
  dominantModality: string;
  dominantPolarity: string;
  missingElement?: string;
  missingModality?: string;
}

export interface RetrogradeSummary {
  planets: string[];
  count: number;
  description: string;
}

export interface ComprehensiveNatalReport {
  // ── Birth data
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  houseSystem: string;
  zodiacSystem: string;
  hasExactTime: boolean;

  // ── Big 3
  coreIdentity: CoreIdentitySummary;

  // ── Every planet in detail
  planetaryPlacements: PlanetaryPlacementDetail[];

  // ── Angles
  angles: AngleDetail[];

  // ── Houses
  houses: HouseDetail[];

  // ── Aspects
  majorAspects: AspectDetail[];
  minorAspects: AspectDetail[];
  aspectCount: number;

  // ── Element/Modality/Polarity
  breakdown: ElementModalityBreakdown;

  // ── Chart patterns
  chartPatterns: ChartPatterns;
  extendedPatterns: ExtendedPatterns;
  chartShape: ChartShapeResult;

  // ── Dignity & dispositors
  dignity: ChartDignityAnalysis;
  dispositorChain: DispositorChain;
  singletons: Singleton[];
  interceptions: Interception[];

  // ── Retrogrades
  retrogrades: RetrogradeSummary;

  // ── Advanced layers
  sect: SectAnalysis | null;
  decans: DecanInfo[];
  criticalDegrees: CriticalDegreeInfo[];
  fixedStars: FixedStarConjunction[];
  sabianSymbols: SabianSymbolInfo[];
  arabicLots: ArabicLot[];
  midpoints: { keyMidpoints: Midpoint[]; activatedMidpoints: Midpoint[] };

  // ── Interpretive profiles
  relationships: RelationshipProfile;
  career: CareerProfile;
  emotional: EmotionalProfile;
  shadowGrowth: ShadowGrowthProfile;
}

// ── Helpers ─────────────────────────────────────────────────────────

function signStr(sign: PlanetPlacement['sign']): string {
  return typeof sign === 'string' ? sign : sign.name;
}

function signSymbolStr(sign: PlanetPlacement['sign']): string {
  return typeof sign === 'object' && sign !== null ? sign.symbol : '';
}

function formatPosition(degree: number, minute: number, sign: string): string {
  return `${degree}°${String(minute).padStart(2, '0')}' ${sign}`;
}

function getCorePlanets(chart: NatalChart): PlanetPlacement[] {
  return [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ].filter(Boolean);
}

const HOUSE_THEMES: Record<number, string> = {
  1: 'Self, identity, body, vitality, first impressions',
  2: 'Values, resources, self-worth, material security',
  3: 'Communication, learning, siblings, local environment',
  4: 'Home, family, roots, emotional foundation',
  5: 'Creativity, romance, pleasure, children, self-expression',
  6: 'Work, health, routine, service, daily habits',
  7: 'Partnerships, marriage, one-to-one dynamics, open enemies',
  8: 'Intimacy, shared resources, transformation, death/rebirth themes',
  9: 'Beliefs, higher learning, travel, philosophy, meaning',
  10: 'Career, status, reputation, public image, calling',
  11: 'Community, friendship, future goals, social ideals',
  12: 'Subconscious, solitude, hidden life, spirituality, transcendence',
};

// ── Report Generation ───────────────────────────────────────────────

export function generateComprehensiveNatalReport(chart: NatalChart): ComprehensiveNatalReport {
  // --- Run all analyses ---
  const coreIdentity = generateCoreIdentitySummary(chart);
  const chartPats = detectChartPatterns(chart);
  const extended = detectExtendedPatterns(chart);
  const dignity = analyzeChartDignity(chart);
  const dispositor = analyzeDispositorChain(chart);
  const shape = detectChartShape(chart);
  const singletons = detectSingletons(chart);
  const interceptions = detectInterceptions(chart);
  const relationships = generateRelationshipProfile(chart);
  const career = generateCareerProfile(chart);
  const emotional = generateEmotionalProfile(chart);
  const shadowGrowth = generateShadowGrowth(chart);
  const advanced = generateAdvancedLayers(chart);

  const hasExactTime = !chart.birthData.hasUnknownTime && !!chart.birthData.time;

  // --- Build planet detail rows ---
  const corePlanets = getCorePlanets(chart);
  const decanMap = new Map(advanced.decans.map(d => [d.planet, d]));
  const sabianMap = new Map(advanced.sabianSymbols.map(s => [s.planet, s]));
  const critMap = new Map(advanced.criticalDegrees.map(c => [c.planet, c]));
  const starMap = new Map<string, FixedStarConjunction[]>();
  for (const fs of advanced.fixedStars) {
    if (!starMap.has(fs.planet)) starMap.set(fs.planet, []);
    starMap.get(fs.planet)!.push(fs);
  }
  const dignityMap = new Map(dignity.planetDignities.map(d => [d.planet, d]));

  const planetaryPlacements: PlanetaryPlacementDetail[] = corePlanets.map(p => {
    const name = p.planet.name;
    const sign = signStr(p.sign);
    const dig = dignityMap.get(name);
    return {
      planet: name,
      symbol: p.planet.symbol,
      sign,
      signSymbol: signSymbolStr(p.sign),
      degree: p.degree,
      minute: p.minute,
      formattedPosition: formatPosition(p.degree, p.minute, sign),
      house: p.house,
      isRetrograde: p.isRetrograde,
      decan: decanMap.get(name),
      sabianSymbol: sabianMap.get(name),
      criticalDegree: critMap.get(name),
      fixedStars: starMap.get(name) ?? [],
      dignityLabel: dig?.label,
      dignityScore: dig?.score,
    };
  });

  // --- Angles ---
  const angles: AngleDetail[] = [];
  if (chart.angles) {
    for (const angle of chart.angles) {
      const sign = typeof angle.sign === 'string' ? angle.sign : (angle.sign as any)?.name ?? '';
      const degInSign = angle.degree;
      const min = Math.round((angle.absoluteDegree % 30 - Math.floor(angle.absoluteDegree % 30)) * 60);
      angles.push({
        name: angle.name,
        sign,
        degree: degInSign,
        minute: min,
        formattedPosition: formatPosition(degInSign, min, sign),
        fixedStars: starMap.get(angle.name) ?? [],
      });
    }
  }

  // --- Houses ---
  const houses: HouseDetail[] = [];
  if (chart.houseCusps && chart.houseCusps.length >= 12) {
    for (const cusp of chart.houseCusps) {
      const sign = typeof cusp.sign === 'string' ? cusp.sign : cusp.sign.name;
      const planetsInHouse = corePlanets
        .filter(p => p.house === cusp.house)
        .map(p => p.planet.name);
      houses.push({
        house: cusp.house,
        cuspSign: sign,
        cuspDegree: Math.floor(cusp.longitude % 30),
        planets: planetsInHouse,
        theme: HOUSE_THEMES[cusp.house] ?? '',
      });
    }
  }

  // --- Aspects ---
  const majorTypes = new Set(['Conjunction', 'Opposition', 'Square', 'Trine', 'Sextile',
    'conjunction', 'opposition', 'square', 'trine', 'sextile']);
  const allAspects: AspectDetail[] = (chart.aspects ?? []).map(a => ({
    planet1: a.planet1.name,
    planet2: a.planet2.name,
    aspectType: a.type.name,
    symbol: a.type.symbol,
    orb: a.orb,
    nature: a.type.nature,
    isApplying: a.isApplying,
    strength: a.strength,
  }));
  const majorAspects = allAspects.filter(a => majorTypes.has(a.aspectType));
  const minorAspects = allAspects.filter(a => !majorTypes.has(a.aspectType));

  // --- Element/Modality/Polarity ---
  const breakdown = buildBreakdown(corePlanets, chartPats);

  // --- Retrogrades ---
  const retrogradePlanets = corePlanets
    .filter(p => p.isRetrograde && p.planet.name !== 'Sun' && p.planet.name !== 'Moon')
    .map(p => p.planet.name);
  const retrogrades: RetrogradeSummary = {
    planets: retrogradePlanets,
    count: retrogradePlanets.length,
    description: retrogradePlanets.length === 0
      ? 'No retrograde planets — energy flows outwardly without internalized reworking.'
      : retrogradePlanets.length <= 2
        ? `${retrogradePlanets.join(' and ')} ${retrogradePlanets.length === 1 ? 'is' : 'are'} retrograde — ${retrogradePlanets.length === 1 ? 'this planet internalizes' : 'these planets internalize'} their expression, running through their themes in a more reflective, inward way.`
        : `${retrogradePlanets.join(', ')} are retrograde — with ${retrogradePlanets.length} planets turning inward, you process a significant portion of your experience internally before expressing it outwardly. This can feel like depth, introversion, or a need to rework past patterns.`,
  };

  return {
    // Birth data
    name: chart.name ?? '',
    birthDate: chart.birthData.date,
    birthTime: chart.birthData.time ?? 'Unknown',
    birthPlace: chart.birthData.place,
    houseSystem: chart.houseSystem ?? chart.birthData.houseSystem ?? 'whole-sign',
    zodiacSystem: chart.birthData.zodiacSystem ?? 'tropical',
    hasExactTime: hasExactTime,

    // Core identity
    coreIdentity,

    // Placements
    planetaryPlacements,
    angles,
    houses,

    // Aspects
    majorAspects,
    minorAspects,
    aspectCount: allAspects.length,

    // Breakdown
    breakdown,

    // Chart patterns
    chartPatterns: chartPats,
    extendedPatterns: extended,
    chartShape: shape,

    // Dignity
    dignity,
    dispositorChain: dispositor,
    singletons,
    interceptions,

    // Retrogrades
    retrogrades,

    // Advanced layers
    sect: advanced.sect,
    decans: advanced.decans,
    criticalDegrees: advanced.criticalDegrees,
    fixedStars: advanced.fixedStars,
    sabianSymbols: advanced.sabianSymbols,
    arabicLots: advanced.arabicLots,
    midpoints: advanced.midpoints,

    // Interpretive profiles
    relationships,
    career,
    emotional,
    shadowGrowth,
  };
}

// ── Build element/modality/polarity breakdown ───────────────────────

function buildBreakdown(corePlanets: PlanetPlacement[], chartPats: ChartPatterns): ElementModalityBreakdown {
  const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const modalities = { Cardinal: 0, Fixed: 0, Mutable: 0 };

  for (const p of corePlanets) {
    const sign = typeof p.sign === 'object' ? p.sign : null;
    if (!sign) continue;
    if (sign.element in elements) elements[sign.element as keyof typeof elements]++;
    if (sign.modality in modalities) modalities[sign.modality as keyof typeof modalities]++;
  }

  const masculine = elements.Fire + elements.Air;
  const feminine = elements.Earth + elements.Water;

  const maxEl = Math.max(elements.Fire, elements.Earth, elements.Air, elements.Water);
  const dominantElement = Object.entries(elements).find(([, v]) => v === maxEl)?.[0] ?? '';
  const maxMod = Math.max(modalities.Cardinal, modalities.Fixed, modalities.Mutable);
  const dominantModality = Object.entries(modalities).find(([, v]) => v === maxMod)?.[0] ?? '';
  const dominantPolarity = masculine > feminine ? 'Masculine / Active' : masculine < feminine ? 'Feminine / Receptive' : 'Balanced';

  const missingElement = Object.entries(elements).filter(([, v]) => v === 0).map(([k]) => k).join(', ') || undefined;
  const missingModality = Object.entries(modalities).filter(([, v]) => v === 0).map(([k]) => k).join(', ') || undefined;

  return {
    fire: elements.Fire,
    earth: elements.Earth,
    air: elements.Air,
    water: elements.Water,
    cardinal: modalities.Cardinal,
    fixed: modalities.Fixed,
    mutable: modalities.Mutable,
    masculine,
    feminine,
    dominantElement,
    dominantModality,
    dominantPolarity,
    missingElement,
    missingModality,
  };
}
