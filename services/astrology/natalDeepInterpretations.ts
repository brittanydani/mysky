// services/astrology/natalDeepInterpretations.ts
// Per-planet, per-house, and per-angle synthesized interpretations.
// Provides the "deep dive" layer for the comprehensive natal chart page.

import { NatalChart, PlanetPlacement, Aspect, ZodiacSign } from './types';
import { HOUSE_MEANINGS } from './constants';
import { getPlanetDignity, PlanetDignity } from './dignityService';

// ── Planet Core Meanings ────────────────────────────────────────────

const PLANET_MEANINGS: Record<string, { domain: string; keywords: string }> = {
  Sun:     { domain: 'core identity, ego, vitality, and life purpose', keywords: 'identity, will, self-expression' },
  Moon:    { domain: 'emotions, instincts, inner needs, and unconscious patterns', keywords: 'feelings, comfort, nurturing' },
  Mercury: { domain: 'communication, thinking, learning, and perception', keywords: 'mind, speech, curiosity' },
  Venus:   { domain: 'love, beauty, values, pleasure, and attraction', keywords: 'love, aesthetics, harmony' },
  Mars:    { domain: 'drive, action, desire, courage, and assertiveness', keywords: 'action, passion, will' },
  Jupiter: { domain: 'expansion, growth, optimism, faith, and wisdom', keywords: 'growth, luck, philosophy' },
  Saturn:  { domain: 'structure, discipline, limits, responsibility, and mastery', keywords: 'duty, maturity, discipline' },
  Uranus:  { domain: 'innovation, freedom, disruption, and individuality', keywords: 'change, rebellion, awakening' },
  Neptune: { domain: 'imagination, spirituality, dissolution, and transcendence', keywords: 'dreams, intuition, compassion' },
  Pluto:   { domain: 'transformation, power, depth, and regeneration', keywords: 'intensity, rebirth, hidden truth' },
};

// ── Sign Expression Flavor ──────────────────────────────────────────

const SIGN_EXPRESSION: Record<string, string> = {
  Aries:       'with initiating force, directness, and competitive energy',
  Taurus:      'with steadiness, sensuality, and a grounded persistence',
  Gemini:      'with curiosity, versatility, and quick mental agility',
  Cancer:      'with emotional depth, protectiveness, and intuitive sensitivity',
  Leo:         'with warmth, creative confidence, and a need for self-expression',
  Virgo:       'with precision, analytical care, and devotion to craft',
  Libra:       'with diplomacy, aesthetic awareness, and relational focus',
  Scorpio:     'with intensity, emotional depth, and transformative power',
  Sagittarius: 'with philosophical reach, enthusiasm, and expansive vision',
  Capricorn:   'with strategic discipline, ambition, and structural thinking',
  Aquarius:    'with unconventional thinking, humanitarian drive, and independence',
  Pisces:      'with empathic sensitivity, imagination, and spiritual openness',
};

// ── House Life Area ─────────────────────────────────────────────────

const HOUSE_AREAS: Record<number, string> = {
  1:  'self-image and how you meet the world',
  2:  'personal resources, values, and self-worth',
  3:  'communication, learning, and your immediate environment',
  4:  'home, family, emotional roots, and inner security',
  5:  'creativity, romance, joy, and self-expression',
  6:  'daily routines, health, work habits, and service',
  7:  'partnerships, relationships, and one-on-one dynamics',
  8:  'transformation, intimacy, shared resources, and depth',
  9:  'higher learning, travel, philosophy, and beliefs',
  10: 'career, public role, reputation, and life direction',
  11: 'community, friendships, ideals, and collective vision',
  12: 'spirituality, the unconscious, solitude, and release',
};

// ── Synthesized planet interpretation ───────────────────────────────

export interface PlanetDeepDive {
  planet: string;
  sign: string;
  house: number;
  isRetrograde: boolean;
  dignity: PlanetDignity;
  synthesis: string;          // 3–5 sentence integrated meaning
  aspects: string[];          // short lines for each major aspect involving this planet
}

function getSignName(sign: ZodiacSign | string): string {
  return typeof sign === 'string' ? sign : sign.name;
}

export function generatePlanetDeepDive(
  placement: PlanetPlacement,
  chartAspects: Aspect[],
): PlanetDeepDive {
  const pName = placement.planet.name;
  const sName = getSignName(placement.sign);
  const house = placement.house;
  const retro = placement.isRetrograde;

  const meaning = PLANET_MEANINGS[pName];
  const signFlavor = SIGN_EXPRESSION[sName] ?? `through ${sName} energy`;
  const houseArea = HOUSE_AREAS[house] ?? '';
  const dignity = getPlanetDignity(pName, sName);

  // Build synthesis
  const parts: string[] = [];
  parts.push(`Your ${pName} in ${sName} gives this part of you a distinctly personal tone: it tends to move ${signFlavor}. This is where ${meaning?.domain ?? 'a core life area'} stops being abstract and starts sounding like your actual style.`);

  if (house && houseArea) {
    parts.push(`Because it lives in your ${house}${getOrdinal(house)} house, you feel it most vividly around ${houseArea}. This is usually where the placement becomes visible in real life rather than staying internal.`);
  }

  if (dignity.dignity !== 'peregrine') {
    const dignityNote = dignity.dignity === 'domicile' || dignity.dignity === 'exaltation'
      ? `${pName} is in ${dignity.dignity} here, so this part of you tends to trust itself. When you lean into it, the expression usually feels natural rather than forced.`
      : `${pName} is in ${dignity.dignity} here, which can make this energy feel more effortful or complicated at first. Over time, that friction often becomes the source of your depth.`;
    parts.push(dignityNote);
  }

  if (retro) {
    parts.push(`Because ${pName} is retrograde, you may experience these themes inwardly before you show them outwardly. This placement often asks for reflection first and expression second.`);
  }

  // Aspects involving this planet
  const relatedAspects = chartAspects.filter(
    a => a.planet1.name === pName || a.planet2.name === pName
  );
  const aspectLines: string[] = relatedAspects.slice(0, 5).map(a => {
    const other = a.planet1.name === pName ? a.planet2.name : a.planet1.name;
    const nature = a.type.nature === 'Harmonious' ? 'flows with' : a.type.nature === 'Challenging' ? 'creates tension with' : 'merges with';
    return `${pName} ${a.type.name.toLowerCase()} ${other} (${a.orb.toFixed(1)}°) — ${nature} ${other}'s themes.`;
  });

  if (relatedAspects.length > 0) {
    const count = relatedAspects.length;
    parts.push(`${pName} forms ${count} aspect${count > 1 ? 's' : ''} in your chart, so this part of you is woven into multiple emotional and relational threads at once. It is not operating in isolation.`);
  }

  parts.push(`The deeper invitation here is not to perform this placement perfectly, but to notice what it is trying to teach you about your own way of being.`);

  return {
    planet: pName,
    sign: sName,
    house,
    isRetrograde: retro,
    dignity,
    synthesis: parts.join(' '),
    aspects: aspectLines,
  };
}

function getOrdinal(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

// ── House interpretation with ruler logic ───────────────────────────

export interface HouseDeepDive {
  house: number;
  theme: string;
  cuspSign: string;
  ruler: string;              // planet ruling the cusp sign
  rulerSign: string;          // sign the ruler is in
  rulerHouse: number;         // house the ruler is in
  occupants: string[];        // planets in this house
  synthesis: string;          // integrated interpretation
}

/** Modern ruler lookup */
const SIGN_RULERS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Pluto',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Uranus', Pisces: 'Neptune',
};

export function generateHouseDeepDives(chart: NatalChart): HouseDeepDive[] {
  if (!chart.houseCusps || chart.houseCusps.length < 12) return [];

  const corePlanets: PlanetPlacement[] = [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ].filter(Boolean);

  // Build planet-by-house map
  const planetsByHouse = new Map<number, string[]>();
  for (const p of corePlanets) {
    if (!p.house) continue;
    if (!planetsByHouse.has(p.house)) planetsByHouse.set(p.house, []);
    planetsByHouse.get(p.house)!.push(p.planet.name);
  }

  // Build planet name → placement lookup
  const planetLookup = new Map<string, PlanetPlacement>();
  for (const p of corePlanets) planetLookup.set(p.planet.name, p);

  return chart.houseCusps.map(cusp => {
    const h = cusp.house;
    const cuspSign = getSignName(cusp.sign);
    const houseInfo = HOUSE_MEANINGS[h as keyof typeof HOUSE_MEANINGS];
    const theme = houseInfo?.theme ?? '';
    const ruler = SIGN_RULERS[cuspSign] ?? '';
    const rulerPlacement = planetLookup.get(ruler);
    const rulerSign = rulerPlacement ? getSignName(rulerPlacement.sign) : '';
    const rulerHouse = rulerPlacement?.house ?? 0;
    const occupants = planetsByHouse.get(h) ?? [];

    // Build synthesis
    const parts: string[] = [];
    parts.push(`Your ${h}${getOrdinal(h)} house governs ${HOUSE_AREAS[h] ?? theme}.`);
    parts.push(`With ${cuspSign} on the cusp, you approach this area ${SIGN_EXPRESSION[cuspSign] ?? `through ${cuspSign} energy`}.`);

    if (ruler && rulerSign && rulerHouse) {
      parts.push(`The ruler of this house is ${ruler}, placed in ${rulerSign} in your ${rulerHouse}${getOrdinal(rulerHouse)} house — connecting this life area to themes of ${HOUSE_AREAS[rulerHouse] ?? 'that house'}.`);
    }

    if (occupants.length > 0) {
      parts.push(`${occupants.join(' and ')} ${occupants.length === 1 ? 'sits' : 'sit'} in this house, bringing additional energy and focus to this area of life.`);
    } else {
      parts.push('No planets occupy this house, so its expression is shaped primarily by the cusp sign and its ruler.');
    }

    return { house: h, theme, cuspSign, ruler, rulerSign, rulerHouse, occupants, synthesis: parts.join(' ') };
  });
}

// ── Angle interpretations ───────────────────────────────────────────

export interface AngleInterpretation {
  name: string;
  sign: string;
  degree: number;
  interpretation: string;
}

const ANGLE_MEANINGS: Record<string, (sign: string) => string> = {
  Ascendant: (s) =>
    `Your Ascendant in ${s} shapes the atmosphere people meet first. You often come across ${SIGN_EXPRESSION[s] ?? `through ${s} energy`}, but this is more than a surface impression, it is the stance your system takes when it first meets life.`,
  Descendant: (s) =>
    `Your Descendant in ${s} reveals the qualities you look for when closeness becomes real. You are often drawn toward people who carry ${s} traits — ${SIGN_EXPRESSION[s] ?? `${s} energy`} — because they mirror something your own growth is asking you to meet in relationship.`,
  Midheaven: (s) =>
    `Your Midheaven in ${s} points to the kind of public life that feels meaningful to build. You tend to want your work, direction, or reputation to carry ${SIGN_EXPRESSION[s] ?? `through ${s} energy`}, not just for appearance, but because that is what feels true to your path.`,
  IC: (s) =>
    `Your IC in ${s} describes the emotional ground you return to underneath everything else. Home, memory, and your private self carry ${s} themes — ${SIGN_EXPRESSION[s] ?? `${s} energy`} — which often tells you what safety and belonging really need to feel like for you.`,
};

export function generateAngleInterpretations(chart: NatalChart): AngleInterpretation[] {
  const results: AngleInterpretation[] = [];

  if (chart.ascendant) {
    const s = getSignName(chart.ascendant.sign);
    results.push({ name: 'Ascendant', sign: s, degree: chart.ascendant.degree, interpretation: ANGLE_MEANINGS.Ascendant(s) });
  }

  // Descendant from angles array
  const desc = (chart.angles ?? []).find(a => a.name === 'Descendant');
  if (desc) {
    const s = typeof desc.sign === 'string' ? desc.sign : (desc.sign as any)?.name ?? '';
    results.push({ name: 'Descendant', sign: s, degree: desc.degree, interpretation: ANGLE_MEANINGS.Descendant(s) });
  }

  if (chart.midheaven) {
    const s = getSignName(chart.midheaven.sign);
    results.push({ name: 'Midheaven (MC)', sign: s, degree: chart.midheaven.degree, interpretation: ANGLE_MEANINGS.Midheaven(s) });
  }

  const icAngle = (chart.angles ?? []).find(a => a.name === 'IC');
  if (icAngle) {
    const s = typeof icAngle.sign === 'string' ? icAngle.sign : (icAngle.sign as any)?.name ?? '';
    results.push({ name: 'Imum Coeli (IC)', sign: s, degree: icAngle.degree, interpretation: ANGLE_MEANINGS.IC(s) });
  }

  return results;
}

// ── Most Important Aspects ──────────────────────────────────────────

export interface KeyAspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
  isApplying: boolean;
  nature: string;
  interpretation: string;
}

const LUMINARIES = new Set(['Sun', 'Moon']);
const PERSONAL = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars']);
const ANGLES = new Set(['Ascendant', 'Midheaven']);
const KEY_POINTS = new Set(['Chiron', 'North Node', 'South Node']);

function aspectImportanceScore(a: Aspect): number {
  let score = 10 - a.orb; // tighter orb = higher score
  if (LUMINARIES.has(a.planet1.name) || LUMINARIES.has(a.planet2.name)) score += 4;
  if (ANGLES.has(a.planet1.name) || ANGLES.has(a.planet2.name)) score += 3;
  if (PERSONAL.has(a.planet1.name) && PERSONAL.has(a.planet2.name)) score += 2;
  if (KEY_POINTS.has(a.planet1.name) || KEY_POINTS.has(a.planet2.name)) score += 1.5;
  if (a.type.name === 'Conjunction') score += 1;
  return score;
}

export function selectKeyAspects(chart: NatalChart, count: number = 10): KeyAspect[] {
  if (!chart.aspects || chart.aspects.length === 0) return [];

  const sorted = [...chart.aspects].sort((a, b) => aspectImportanceScore(b) - aspectImportanceScore(a));

  return sorted.slice(0, count).map(a => ({
    planet1: a.planet1.name,
    planet2: a.planet2.name,
    type: a.type.name,
    orb: a.orb,
    isApplying: a.isApplying,
    nature: a.type.nature,
    interpretation: buildAspectSynthesis(a),
  }));
}

function buildAspectSynthesis(a: Aspect): string {
  const p1 = a.planet1.name;
  const p2 = a.planet2.name;
  const m1 = PLANET_MEANINGS[p1];
  const m2 = PLANET_MEANINGS[p2];
  const typeName = a.type.name.toLowerCase();

  if (a.type.nature === 'Harmonious') {
    return `${p1} and ${p2} in ${typeName} — ${m1?.keywords ?? p1} flow naturally with ${m2?.keywords ?? p2}. This creates ease between ${m1?.domain ?? 'one life area'} and ${m2?.domain ?? 'another'}.`;
  } else if (a.type.nature === 'Challenging') {
    return `${p1} and ${p2} in ${typeName} — tension between ${m1?.keywords ?? p1} and ${m2?.keywords ?? p2}. This friction between ${m1?.domain ?? 'one area'} and ${m2?.domain ?? 'another'} drives growth through working with both sides.`;
  } else {
    return `${p1} and ${p2} in ${typeName} — these energies merge, amplifying both ${m1?.keywords ?? p1} and ${m2?.keywords ?? p2} together.`;
  }
}

// ── Sensitive Point Interpretations ─────────────────────────────────

export interface PointInterpretation {
  name: string;
  sign: string;
  house: number | undefined;
  interpretation: string;
}

const POINT_INTERPRETATIONS: Record<string, (sign: string, house: number | undefined) => string> = {
  'North Node': (s, h) =>
    `Your North Node in ${s}${h ? ` (${h}${getOrdinal(h)} house)` : ''} points to your growth direction — the qualities you are learning to develop in this lifetime. ${s} themes may feel unfamiliar but deeply rewarding when you lean into them.`,
  'South Node': (s, h) =>
    `Your South Node in ${s}${h ? ` (${h}${getOrdinal(h)} house)` : ''} reflects your comfort zone — patterns that come naturally but may hold you back if you rely on them too heavily. This is mastered territory that serves as a foundation, not a destination.`,
  'Chiron': (s, h) =>
    `Chiron in ${s}${h ? ` (${h}${getOrdinal(h)} house)` : ''} points to a deep wound that becomes your greatest source of wisdom. Through engaging with ${s} themes in the area of ${HOUSE_AREAS[h ?? 0] ?? 'life'}, you develop the capacity to help others with similar struggles.`,
  'Lilith': (s, h) =>
    `Lilith in ${s}${h ? ` (${h}${getOrdinal(h)} house)` : ''} reveals raw, untamed energy — the part of you that resists social expectations. In ${s}, this wildness expresses ${SIGN_EXPRESSION[s] ?? 'itself uniquely'}.`,
  'Part of Fortune': (s, h) =>
    `Your Part of Fortune in ${s}${h ? ` (${h}${getOrdinal(h)} house)` : ''} indicates where you find natural flow and a felt sense of alignment. The combination of your Sun, Moon, and Ascendant converges here, suggesting ease in ${HOUSE_AREAS[h ?? 0] ?? 'this area'}.`,
  'Vertex': (s, h) =>
    `Your Vertex in ${s}${h ? ` (${h}${getOrdinal(h)} house)` : ''} is sometimes called a "fated point" — it marks encounters and experiences that feel destined or transformative, often through others.`,
};

export function generatePointInterpretations(chart: NatalChart): PointInterpretation[] {
  const results: PointInterpretation[] = [];

  // From planets array (Chiron, Nodes, Lilith)
  if (Array.isArray(chart.planets)) {
    for (const p of chart.planets as any[]) {
      const name = String(p.planet ?? '');
      const sign = String(p.sign ?? '');
      const house = typeof p.house === 'number' ? p.house : undefined;
      const normalizedName = name === 'True Node' ? 'North Node' : name;
      const interpFn = POINT_INTERPRETATIONS[normalizedName];
      if (interpFn) {
        results.push({ name: normalizedName, sign, house, interpretation: interpFn(sign, house) });
      }
    }
  }

  // Part of Fortune
  if (chart.partOfFortune) {
    const pf = chart.partOfFortune;
    const sign = typeof pf.sign === 'string' ? pf.sign : pf.sign?.name ?? '';
    const interpFn = POINT_INTERPRETATIONS['Part of Fortune'];
    if (interpFn) {
      results.push({ name: 'Part of Fortune', sign, house: pf.house, interpretation: interpFn(sign, pf.house) });
    }
  }

  // Vertex from angles
  const vertex = (chart.angles ?? []).find(a => a.name === 'Vertex');
  if (vertex) {
    const sign = typeof vertex.sign === 'string' ? vertex.sign : (vertex.sign as any)?.name ?? '';
    const interpFn = POINT_INTERPRETATIONS['Vertex'];
    if (interpFn) {
      results.push({ name: 'Vertex', sign, house: undefined, interpretation: interpFn(sign, undefined) });
    }
  }

  return results;
}
