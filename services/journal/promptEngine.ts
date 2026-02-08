/**
 * Prompt Engine — The brain that selects the right prompt for today
 *
 * PROMPT = CONTEXT + ACTIVATION + INNER QUESTION + GENTLE ACTION
 *
 * Priority order (prevents repetition):
 *   1. Exact transit orbs (<1°)
 *   2. Moon phase
 *   3. Stellium house
 *   4. Chiron house (if transit aspects Chiron)
 *   5. Node direction (weekly rotation)
 *   6. Fallback themes
 *
 * Each prompt pulled from at least 2 systems:
 *   Direction (Nodes) + Activation (Transit/Moon) + Location (House/Chakra)
 */

import { NatalChart, SimpleAspect, AspectTypeName } from '../astrology/types';
import { DailyInsightEngine } from '../astrology/dailyInsightEngine';
import { detectChartPatterns, Stellium } from '../astrology/chartPatterns';
import {
  PROMPT_LIBRARY,
  GENTLE_CLOSES,
  CONTEXT_LINES,
  JournalPromptEntry,
  Activation,
  TransitTrigger,
  MoonPhaseTag,
  ChakraTag,
} from './promptLibrary';
import { getChironPlacement } from './chiron';
import { getNodeAxis } from './nodes';
import { getMoonPhaseKey } from '../../utils/moonPhase';
import { getChakraForHouse, getChakraForPlanet, generateChakraInsightCard, ChakraInsightCard } from './chakraSystem';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface GeneratedPrompt {
  context: string;         // "Something is shifting beneath the surface."
  question: string;        // The prompt itself
  close: string;           // "Write without editing."
  activation: Activation;
  chakra?: ChakraInsightCard;
  tags: string[];          // internal tags for logging/personalization
  source: PromptSource;    // which system triggered this
  promptId: string;        // for logging which prompts were shown/used
}

export type PromptSource =
  | 'tight_transit'
  | 'moon_phase'
  | 'stellium'
  | 'chiron'
  | 'node'
  | 'fallback';

export interface PromptSet {
  primary: GeneratedPrompt;
  alternatives: GeneratedPrompt[];
  dailySummary: string;    // "Based on today's transits and your natal chart"
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL: Active triggers detection
// ═══════════════════════════════════════════════════════════════════════════

interface ActiveTriggers {
  tightTransits: TransitTrigger[];     // orb < 1°
  transitActivations: Activation[];
  moonPhase: MoonPhaseTag;
  stelliumHouses: number[];
  chironHouse: number | null;
  northNodeHouse: number | null;
  southNodeHouse: number | null;
  dominantElement: string | null;
}

/**
 * Detect all active astrological triggers for today.
 */
function getActiveTriggers(chart: NatalChart, date: Date = new Date()): ActiveTriggers {
  const triggers: ActiveTriggers = {
    tightTransits: [],
    transitActivations: [],
    moonPhase: getMoonPhaseTag(date),
    stelliumHouses: [],
    chironHouse: null,
    northNodeHouse: null,
    southNodeHouse: null,
    dominantElement: null,
  };

  // 1. Detect tight transits via DailyInsightEngine
  try {
    const insight = DailyInsightEngine.generateDailyInsight(chart, date);
    if (insight.signals) {
      for (const signal of insight.signals) {
        const orb = parseFloat(signal.orb);
        if (isNaN(orb)) continue;

        // Map transiting planet to trigger tag
        const transitTag = mapPlanetToTransitTrigger(signal.description);
        if (transitTag && orb < 1.0) {
          triggers.tightTransits.push(transitTag);
        }
        if (transitTag) {
          // Map transit to activation type
          const activation = mapTransitToActivation(transitTag);
          if (activation && !triggers.transitActivations.includes(activation)) {
            triggers.transitActivations.push(activation);
          }
        }
      }
    }
  } catch {
    // Transit calculation failed — continue without transit data
  }

  // 2. Detect stellium houses
  try {
    const patterns = detectChartPatterns(chart);
    if (patterns.stelliums) {
      for (const s of patterns.stelliums) {
        // Extract house number from label (e.g., "1st House" or "Leo in House 5")
        const houseMatch = s.label.match(/(\d+)\w*\s*House|House\s*(\d+)/i);
        if (houseMatch) {
          const h = parseInt(houseMatch[1] || houseMatch[2], 10);
          if (h >= 1 && h <= 12) triggers.stelliumHouses.push(h);
        }
      }
    }

    // Dominant element
    if (patterns.elementBalance) {
      const counts = patterns.elementBalance.counts;
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (entries.length > 0 && entries[0][1] >= 4) {
        triggers.dominantElement = entries[0][0].toLowerCase();
      }
    }
  } catch {
    // Pattern analysis failed — continue
  }

  // 3. Chiron house
  try {
    const chiron = getChironPlacement(chart);
    if (chiron && chiron.house > 0) {
      triggers.chironHouse = chiron.house;
    }
  } catch {
    // Chiron extraction failed
  }

  // 4. Node houses
  try {
    const axis = getNodeAxis(chart);
    if (axis) {
      triggers.northNodeHouse = axis.northNode.house;
      triggers.southNodeHouse = axis.southNode.house;
    }
  } catch {
    // Node extraction failed
  }

  return triggers;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL: Prompt selection
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Score a prompt against the current active triggers.
 * Higher score = more relevant to today.
 */
function scorePrompt(prompt: JournalPromptEntry, triggers: ActiveTriggers, dayOfYear: number): number {
  let score = 0;

  // Transit match (highest priority)
  if (prompt.tags.transit && triggers.tightTransits.includes(prompt.tags.transit)) {
    score += 100; // tight transit match
  } else if (prompt.tags.transit && triggers.tightTransits.length > 0) {
    // Any transit tag when transits are active
    const transitActivation = mapTransitToActivation(prompt.tags.transit);
    if (transitActivation && triggers.transitActivations.includes(transitActivation)) {
      score += 50;
    }
  }

  // Moon phase match
  if (prompt.tags.moonPhases && prompt.tags.moonPhases.includes(triggers.moonPhase)) {
    score += 40;
  }

  // Stellium house match
  if (prompt.tags.stelliumHouse && triggers.stelliumHouses.includes(prompt.tags.stelliumHouse)) {
    score += 35;
  }

  // Chiron house match
  if (prompt.tags.chironHouse !== undefined && prompt.tags.chironHouse === triggers.chironHouse) {
    score += 30;
  }

  // Node direction match (weekly — rotate north/south by week number)
  if (prompt.tags.nodeDirection) {
    const weekNum = Math.floor(dayOfYear / 7);
    const preferNorth = weekNum % 2 === 0;
    if ((preferNorth && prompt.tags.nodeDirection === 'north') ||
        (!preferNorth && prompt.tags.nodeDirection === 'south')) {
      score += 20;
    } else {
      score += 10; // Still relevant, just not this week's focus
    }
  }

  // Element match
  if (prompt.tags.elements && triggers.dominantElement) {
    if (prompt.tags.elements.includes(triggers.dominantElement as any)) {
      score += 15;
    }
  }

  // Activation type match
  if (triggers.transitActivations.includes(prompt.tags.activation)) {
    score += 25;
  }

  // Fallback prompts get a base score so they always rank
  if (prompt.id.startsWith('fb-')) {
    score += 5;
  }

  return score;
}

/**
 * Select prompts using scoring + day-based rotation to prevent repetition.
 */
function selectPrompts(triggers: ActiveTriggers, date: Date): JournalPromptEntry[] {
  const dayOfYear = getDayOfYear(date);

  // Score all prompts
  const scored = PROMPT_LIBRARY.map(p => ({
    prompt: p,
    score: scorePrompt(p, triggers, dayOfYear),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top 20 candidates
  const top = scored.slice(0, 20);

  // Use day-of-year to rotate among top candidates (prevents same prompt daily)
  const results: JournalPromptEntry[] = [];
  const usedActivations = new Set<Activation>();

  for (let i = 0; i < top.length && results.length < 4; i++) {
    const idx = (i + dayOfYear) % top.length;
    const candidate = top[idx];
    if (!candidate) continue;

    // Don't repeat same activation type in a set
    if (results.length > 0 && usedActivations.has(candidate.prompt.tags.activation)) {
      continue;
    }

    results.push(candidate.prompt);
    usedActivations.add(candidate.prompt.tags.activation);
  }

  // Ensure at least one result
  if (results.length === 0) {
    const fallbacks = PROMPT_LIBRARY.filter(p => p.id.startsWith('fb-'));
    results.push(fallbacks[dayOfYear % fallbacks.length]);
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL: Helpers
// ═══════════════════════════════════════════════════════════════════════════

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getMoonPhaseTag(date: Date): MoonPhaseTag {
  return getMoonPhaseKey(date) as MoonPhaseTag;
}

function mapPlanetToTransitTrigger(signalDescription: string): TransitTrigger | null {
  const desc = signalDescription.toLowerCase();
  if (desc.includes('mars')) return 'mars_aspect';
  if (desc.includes('venus')) return 'venus_aspect';
  if (desc.includes('saturn')) return 'saturn_aspect';
  if (desc.includes('jupiter')) return 'jupiter_aspect';
  if (desc.includes('mercury')) return 'mercury_aspect';
  if (desc.includes('moon')) return 'moon_transit';
  if (desc.includes('sun')) return 'sun_aspect';
  if (desc.includes('uranus')) return 'uranus_aspect';
  if (desc.includes('neptune')) return 'neptune_aspect';
  if (desc.includes('pluto')) return 'pluto_aspect';
  if (desc.includes('chiron')) return 'chiron_transit';
  return null;
}

function mapTransitToActivation(transit: TransitTrigger): Activation | null {
  const map: Record<TransitTrigger, Activation> = {
    mars_aspect: 'boundary_testing',
    venus_aspect: 'relationship_mirroring',
    saturn_aspect: 'inner_review',
    jupiter_aspect: 'integration_phase',
    mercury_aspect: 'creative_release',
    moon_transit: 'emotional_processing',
    sun_aspect: 'identity_pressure',
    uranus_aspect: 'identity_pressure',
    neptune_aspect: 'emotional_processing',
    pluto_aspect: 'emotional_processing',
    chiron_transit: 'somatic_awareness',
  };
  return map[transit] ?? null;
}

function getSourceForPrompt(prompt: JournalPromptEntry, triggers: ActiveTriggers): PromptSource {
  if (prompt.tags.transit && triggers.tightTransits.includes(prompt.tags.transit)) return 'tight_transit';
  if (prompt.tags.stelliumHouse && triggers.stelliumHouses.includes(prompt.tags.stelliumHouse)) return 'stellium';
  if (prompt.tags.chironHouse !== undefined && prompt.tags.chironHouse === triggers.chironHouse) return 'chiron';
  if (prompt.tags.nodeDirection) return 'node';
  if (prompt.tags.moonPhases && prompt.tags.moonPhases.includes(triggers.moonPhase)) return 'moon_phase';
  return 'fallback';
}

function buildGeneratedPrompt(
  entry: JournalPromptEntry,
  triggers: ActiveTriggers,
  dayOfYear: number
): GeneratedPrompt {
  const source = getSourceForPrompt(entry, triggers);

  // Select a gentle close: use the prompt's own if available, otherwise rotate
  const close = entry.close ?? GENTLE_CLOSES[dayOfYear % GENTLE_CLOSES.length];

  // Build chakra insight card if the prompt has a chakra tag
  let chakra: ChakraInsightCard | undefined;
  if (entry.tags.chakra) {
    // Determine source type for chakra card
    const chakraSource = source === 'chiron' ? 'chiron'
      : source === 'stellium' ? 'stellium'
      : 'transit';
    const house = entry.tags.stelliumHouse ?? entry.tags.chironHouse ?? 1;
    chakra = generateChakraInsightCard(house, chakraSource);
  }

  // Build tags array for logging
  const tags: string[] = [entry.tags.activation, entry.tags.theme, entry.tags.intensity];
  if (entry.tags.transit) tags.push(entry.tags.transit);
  if (entry.tags.moonPhases) tags.push(...entry.tags.moonPhases);
  if (entry.tags.elements) tags.push(...entry.tags.elements);
  if (entry.tags.nodeDirection) tags.push(`node:${entry.tags.nodeDirection}`);
  if (entry.tags.chakra) tags.push(`chakra:${entry.tags.chakra}`);

  return {
    context: entry.context,
    question: entry.question,
    close,
    activation: entry.tags.activation,
    chakra,
    tags,
    source,
    promptId: entry.id,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate today's journal prompt set based on the user's natal chart.
 *
 * Returns a primary prompt + up to 3 alternatives, each assembled from:
 *   Context (why now) + Question (the prompt) + Close (gentle action)
 *   + optional chakra insight card
 *
 * Priority: tight transits > moon phase > stellium > chiron > nodes > fallback
 */
export function generateJournalPrompt(
  chart: NatalChart,
  date: Date = new Date()
): PromptSet {
  const triggers = getActiveTriggers(chart, date);
  const dayOfYear = getDayOfYear(date);
  const selected = selectPrompts(triggers, date);

  const prompts = selected.map(entry => buildGeneratedPrompt(entry, triggers, dayOfYear));

  // Build a human-friendly daily summary
  const summaryParts: string[] = [];
  if (triggers.tightTransits.length > 0) summaryParts.push('active transits');
  if (triggers.moonPhase) summaryParts.push(formatMoonPhase(triggers.moonPhase));
  if (triggers.stelliumHouses.length > 0) summaryParts.push('your chart emphasis');
  if (triggers.chironHouse) summaryParts.push('sensitivity awareness');

  const dailySummary = summaryParts.length > 0
    ? `Drawn from ${summaryParts.join(', ')}`
    : 'A quiet day for open reflection';

  return {
    primary: prompts[0],
    alternatives: prompts.slice(1),
    dailySummary,
  };
}

/**
 * Get a simple free-tier prompt (no chart data needed).
 * Uses moon phase + day rotation only.
 */
export function getFreePrompt(date: Date = new Date()): GeneratedPrompt {
  const dayOfYear = getDayOfYear(date);
  const moonPhase = getMoonPhaseTag(date);

  // Find moon-phase-matching prompts or use fallbacks
  const moonPrompts = PROMPT_LIBRARY.filter(
    p => p.tags.moonPhases?.includes(moonPhase)
  );
  const fallbacks = PROMPT_LIBRARY.filter(p => p.id.startsWith('fb-'));
  const pool = moonPrompts.length > 0 ? moonPrompts : fallbacks;
  const entry = pool[dayOfYear % pool.length];

  return {
    context: entry.context,
    question: entry.question,
    close: entry.close ?? GENTLE_CLOSES[dayOfYear % GENTLE_CLOSES.length],
    activation: entry.tags.activation,
    tags: [entry.tags.activation, entry.tags.theme, entry.tags.intensity],
    source: moonPrompts.length > 0 ? 'moon_phase' : 'fallback',
    promptId: entry.id,
  };
}

/**
 * Get the current moon phase as a user-friendly string.
 */
export function getCurrentMoonPhase(date: Date = new Date()): string {
  return formatMoonPhase(getMoonPhaseTag(date));
}

function formatMoonPhase(tag: MoonPhaseTag): string {
  const labels: Record<MoonPhaseTag, string> = {
    new: 'New Moon',
    waxing_crescent: 'Waxing Crescent',
    first_quarter: 'First Quarter',
    waxing_gibbous: 'Waxing Gibbous',
    full: 'Full Moon',
    waning_gibbous: 'Waning Gibbous',
    last_quarter: 'Last Quarter',
    waning_crescent: 'Waning Crescent',
  };
  return labels[tag] ?? 'Moon';
}
