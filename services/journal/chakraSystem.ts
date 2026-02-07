/**
 * Chakra System — Somatic + Emotional Awareness Layer
 *
 * Maps astrology triggers (houses, planets, transits, stelliums)
 * to energy centers for body-aware journaling.
 *
 * Rule: NEVER say "balance your chakra."
 * Say: "This energy center is asking for attention."
 *
 * No rituals. No prescriptions. Just awareness.
 */

import { ChakraTag } from './promptLibrary';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ChakraInfo {
  id: ChakraTag;
  name: string;
  governs: string;         // "Safety, survival"
  bodyArea: string;        // "Base of spine, legs, feet"
  color: string;           // hex for UI
  icon: string;            // emoji
  description: string;     // user-facing one-liner
  promptHint: string;      // "Where do I feel this in my body?"
  microAction: string;     // "Place a hand here and breathe."
}

export interface ChakraInsightCard {
  chakra: ChakraInfo;
  context: string;         // "Attention is gathering around your [name]."
  journalPrompt: string;
  bodyAwareness: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAKRA DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const CHAKRAS: Record<ChakraTag, ChakraInfo> = {
  root: {
    id: 'root',
    name: 'Root',
    governs: 'Safety, survival, grounding',
    bodyArea: 'Base of spine, legs, feet',
    color: '#E05252',
    icon: '🔴',
    description: 'This center holds your sense of safety and stability.',
    promptHint: 'Where do I feel grounded — or ungrounded — right now?',
    microAction: 'Feel your feet on the ground. Press down gently.',
  },
  sacral: {
    id: 'sacral',
    name: 'Sacral',
    governs: 'Emotion, creativity, pleasure',
    bodyArea: 'Lower abdomen, hips',
    color: '#E08A52',
    icon: '🟠',
    description: 'This center holds your emotional flow and creative impulse.',
    promptHint: 'What emotion is moving through me right now?',
    microAction: 'Place a hand on your lower belly. Let it soften.',
  },
  solar_plexus: {
    id: 'solar_plexus',
    name: 'Solar Plexus',
    governs: 'Identity, confidence, personal power',
    bodyArea: 'Upper abdomen, diaphragm',
    color: '#E0C952',
    icon: '🟡',
    description: 'This center holds your sense of self and personal agency.',
    promptHint: 'Where does my sense of "I" feel strong or shaky?',
    microAction: 'Place a hand on your stomach. Breathe into the space.',
  },
  heart: {
    id: 'heart',
    name: 'Heart',
    governs: 'Connection, love, grief, compassion',
    bodyArea: 'Chest, upper back, arms',
    color: '#52B788',
    icon: '💚',
    description: 'This center holds your capacity for connection and feeling.',
    promptHint: 'What is my heart asking for right now?',
    microAction: 'Place a hand on your chest. Notice the rhythm.',
  },
  throat: {
    id: 'throat',
    name: 'Throat',
    governs: 'Expression, truth, communication',
    bodyArea: 'Throat, jaw, neck',
    color: '#52A8D8',
    icon: '🔵',
    description: 'This center holds your capacity for authentic expression.',
    promptHint: 'What am I not saying — and what happens when I hold it?',
    microAction: 'Hum softly for three breaths. Notice the vibration.',
  },
  third_eye: {
    id: 'third_eye',
    name: 'Third Eye',
    governs: 'Insight, intuition, perception',
    bodyArea: 'Forehead, between the brows',
    color: '#6E52C9',
    icon: '🟣',
    description: 'This center holds your capacity for deeper seeing.',
    promptHint: 'What do I sense beneath the surface?',
    microAction: 'Close your eyes. Notice what appears behind the darkness.',
  },
  crown: {
    id: 'crown',
    name: 'Crown',
    governs: 'Integration, surrender, wholeness',
    bodyArea: 'Top of the head',
    color: '#C9A962',
    icon: '👑',
    description: 'This center holds your connection to something larger.',
    promptHint: 'What feels beyond my understanding right now — and is that okay?',
    microAction: 'Let the top of your head soften. Exhale fully.',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ASTROLOGY → CHAKRA MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * House → Chakra mapping (which energy center activates when a house is emphasized)
 */
export const HOUSE_TO_CHAKRA: Record<number, ChakraTag> = {
  1: 'solar_plexus',   // identity, selfhood
  2: 'root',           // security, value
  3: 'throat',         // communication, voice
  4: 'heart',          // emotional roots, home
  5: 'sacral',         // creativity, joy
  6: 'solar_plexus',   // service, routine, body
  7: 'heart',          // relationships, partnership
  8: 'sacral',         // depth, intimacy, transformation
  9: 'third_eye',      // meaning, belief, vision
  10: 'solar_plexus',  // purpose, authority
  11: 'heart',         // community, belonging
  12: 'crown',         // surrender, inner world
};

/**
 * Planet → Chakra mapping (which energy center a planet naturally activates)
 */
export const PLANET_TO_CHAKRA: Record<string, ChakraTag> = {
  Sun: 'solar_plexus',
  Moon: 'sacral',
  Mercury: 'throat',
  Venus: 'heart',
  Mars: 'solar_plexus',
  Jupiter: 'third_eye',
  Saturn: 'root',
  Uranus: 'third_eye',
  Neptune: 'crown',
  Pluto: 'sacral',
  Chiron: 'heart',
};

/**
 * Chiron house → Chakra mapping (more specific than general house mapping)
 */
export const CHIRON_HOUSE_TO_CHAKRA: Record<number, ChakraTag> = {
  1: 'solar_plexus',
  2: 'root',
  3: 'throat',
  4: 'heart',
  5: 'sacral',
  6: 'solar_plexus',
  7: 'heart',
  8: 'sacral',
  9: 'third_eye',
  10: 'solar_plexus',
  11: 'heart',
  12: 'crown',
};

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the full chakra info for a given chakra tag.
 */
export function getChakraInfo(chakra: ChakraTag): ChakraInfo {
  return CHAKRAS[chakra];
}

/**
 * Get the chakra associated with a house number.
 */
export function getChakraForHouse(house: number): ChakraTag {
  return HOUSE_TO_CHAKRA[Math.max(1, Math.min(12, house))] ?? 'heart';
}

/**
 * Get the chakra associated with a transiting planet.
 */
export function getChakraForPlanet(planet: string): ChakraTag {
  return PLANET_TO_CHAKRA[planet] ?? 'heart';
}

/**
 * Generate a chakra insight card for a given house activation.
 * Used when a stellium, transit, or Chiron activates a house.
 */
export function generateChakraInsightCard(
  house: number,
  source: 'stellium' | 'transit' | 'chiron' = 'transit'
): ChakraInsightCard {
  const chakraTag = source === 'chiron'
    ? CHIRON_HOUSE_TO_CHAKRA[house] ?? 'heart'
    : HOUSE_TO_CHAKRA[house] ?? 'heart';

  const chakra = CHAKRAS[chakraTag];

  const contextBySource = {
    stellium: `Concentrated energy is gathering around your ${chakra.name} center.`,
    transit: `Attention is moving through your ${chakra.name} center.`,
    chiron: `Sensitivity is active around your ${chakra.name} center.`,
  };

  return {
    chakra,
    context: contextBySource[source],
    journalPrompt: chakra.promptHint,
    bodyAwareness: chakra.microAction,
  };
}

/**
 * Get all active chakras for a set of houses (e.g., stellium houses + Chiron house).
 * Returns unique chakras sorted by how many times they appear (most active first).
 */
export function getActiveChakras(houses: number[]): ChakraTag[] {
  const counts: Record<string, number> = {};
  for (const h of houses) {
    const c = HOUSE_TO_CHAKRA[h];
    if (c) counts[c] = (counts[c] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag as ChakraTag);
}
