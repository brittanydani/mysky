/**
 * Chiron System — Sensitivity → Awareness → Integration
 *
 * Chiron answers: "Where does experience hit deeper —
 * and what grows from tending it?"
 *
 * NOT: what's broken, what must be healed, what defines you forever.
 * YES: where perception is heightened, where meaning develops through experience.
 *
 * No "wounded healer" clichés. No destiny language.
 * Just recognition and integration.
 */

import { NatalChart, PlanetPosition } from '../astrology/types';
import { ChakraTag } from './promptLibrary';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ChironPlacement {
  house: number;
  sign: string;
  degree: number;
  retrograde: boolean;
}

export interface ChironInsight {
  house: number;
  title: string;           // "Selfhood · Visibility"
  theme: string;           // short theme line
  description: string;     // 2-3 sentence description (no diagnosis)
  integrationTheme: string; // "authenticity without self-scrutiny"
  chakra: ChakraTag;
  journalPrompts: string[];
  bodyAwareness: string;   // somatic cue
}

// ═══════════════════════════════════════════════════════════════════════════
// CHIRON → HOUSE CONTENT
// ═══════════════════════════════════════════════════════════════════════════

const CHIRON_BY_HOUSE: Record<number, ChironInsight> = {
  1: {
    house: 1,
    title: 'Selfhood · Visibility',
    theme: 'Sensitivity around identity and being seen.',
    description: 'You may feel acutely aware of how you come across, sometimes questioning whether you\'re "enough" as you are. This isn\'t weakness — it\'s a heightened antenna for authenticity.',
    integrationTheme: 'Authenticity without self-scrutiny.',
    chakra: 'solar_plexus',
    journalPrompts: [
      'What part of myself feels most tender today?',
      'When do I feel most myself — without trying?',
      'Where does visibility feel safe, and where does it feel exposed?',
    ],
    bodyAwareness: 'Notice your posture. Where do you hold yourself differently when being watched?',
  },
  2: {
    house: 2,
    title: 'Worth · Safety',
    theme: 'Sensitivity around value, stability, or self-reliance.',
    description: 'You may notice heightened reactions around money, security, or self-worth. The question of "enough" runs deeper here than material resources.',
    integrationTheme: 'Worth as inherent, not earned.',
    chakra: 'root',
    journalPrompts: [
      'What makes me feel secure right now?',
      'Where do I measure my value too harshly?',
      'What would change if I believed my worth was already settled?',
    ],
    bodyAwareness: 'Notice your jaw, your shoulders. Where does scarcity live in your body?',
  },
  3: {
    house: 3,
    title: 'Voice · Thought',
    theme: 'Sensitivity around expression and being understood.',
    description: 'You may think deeply before speaking, or replay conversations internally. Your words carry more weight than you realize — which is both gift and pressure.',
    integrationTheme: 'Expression without self-censorship.',
    chakra: 'throat',
    journalPrompts: [
      'What do I wish I\'d said?',
      'What feels safe to express here?',
      'What thought keeps circling because it hasn\'t been spoken?',
    ],
    bodyAwareness: 'Notice your throat and breath. What happens when you swallow words?',
  },
  4: {
    house: 4,
    title: 'Emotional Roots',
    theme: 'Sensitivity tied to emotional safety and belonging.',
    description: 'You may feel deeply connected to memory, family patterns, or emotional environments. Home — physical and emotional — matters more to you than most.',
    integrationTheme: 'Creating safety now.',
    chakra: 'heart',
    journalPrompts: [
      'What feels familiar here?',
      'What does comfort look like today?',
      'What emotional pattern did you learn early that still runs?',
    ],
    bodyAwareness: 'Place a hand on your chest. What does "home" feel like in your body?',
  },
  5: {
    house: 5,
    title: 'Joy · Expression',
    theme: 'Sensitivity around creativity, love, or being enjoyed.',
    description: 'You may hesitate to fully express joy without reassurance. There\'s a part of you that checks if it\'s okay to be happy — and that awareness itself is a form of depth.',
    integrationTheme: 'Allowing pleasure without permission.',
    chakra: 'sacral',
    journalPrompts: [
      'What wants expression right now?',
      'What would feel playful if nothing were at stake?',
      'Where do I hold back from joy, and what am I protecting?',
    ],
    bodyAwareness: 'Notice your belly and hips. Where does play live — or where has it gone quiet?',
  },
  6: {
    house: 6,
    title: 'Health · Function',
    theme: 'Sensitivity around routine, health, or usefulness.',
    description: 'You may notice heightened awareness of your body or productivity. The desire to be useful can become a way of proving your worth — but it can also become compassionate self-care.',
    integrationTheme: 'Compassion over optimization.',
    chakra: 'solar_plexus',
    journalPrompts: [
      'What does my body need today?',
      'Where am I trying to fix instead of listen?',
      'What would "enough" effort look like today?',
    ],
    bodyAwareness: 'Scan your body slowly. Where are you holding effort that could be released?',
  },
  7: {
    house: 7,
    title: 'Relationship · Reflection',
    theme: 'Sensitivity within connection.',
    description: 'Relationships may surface deep self-awareness — sometimes unexpectedly. You learn about yourself through others, which makes connection both a mirror and a classroom.',
    integrationTheme: 'Closeness without self-erasure.',
    chakra: 'heart',
    journalPrompts: [
      'What feels tender in connection today?',
      'Where do I hold back to stay safe?',
      'What am I learning about myself through someone else?',
    ],
    bodyAwareness: 'Notice your chest and arms. Where does the desire for closeness live?',
  },
  8: {
    house: 8,
    title: 'Depth · Trust',
    theme: 'Sensitivity around intimacy, power, or vulnerability.',
    description: 'You may feel deeply affected by emotional exchanges. Trust is something you build slowly and carefully — and that caution contains its own wisdom.',
    integrationTheme: 'Openness without danger.',
    chakra: 'sacral',
    journalPrompts: [
      'What feels intense right now?',
      'Where does trust feel delicate?',
      'What am I afraid to lose if I open more?',
    ],
    bodyAwareness: 'Notice your gut and lower belly. What does safety feel like at this depth?',
  },
  9: {
    house: 9,
    title: 'Meaning · Belief',
    theme: 'Sensitivity around truth, worldview, or direction.',
    description: 'You may question beliefs more deeply than others. The search for meaning isn\'t casual for you — it\'s how you orient in the world.',
    integrationTheme: 'Evolving understanding.',
    chakra: 'third_eye',
    journalPrompts: [
      'What belief is shifting?',
      'What no longer fits my view of the world?',
      'What question am I living inside right now?',
    ],
    bodyAwareness: 'Notice the space between your brows. What feels clear, and what feels hazy?',
  },
  10: {
    house: 10,
    title: 'Purpose · Visibility',
    theme: 'Sensitivity around achievement, recognition, or authority.',
    description: 'You may feel pressure to be competent or successful in ways that carry extra weight. The relationship between effort and recognition is complicated here.',
    integrationTheme: 'Worth beyond accomplishment.',
    chakra: 'solar_plexus',
    journalPrompts: [
      'What am I proving — and to whom?',
      'What would success feel like without pressure?',
      'Where does ambition end and compulsion begin?',
    ],
    bodyAwareness: 'Notice your upper back and shoulders. Where does responsibility sit?',
  },
  11: {
    house: 11,
    title: 'Belonging · Vision',
    theme: 'Sensitivity around community and belonging.',
    description: 'You may feel different — or deeply attuned to group dynamics. The desire to belong and the need to be authentic don\'t always align, and you notice that tension more than most.',
    integrationTheme: 'Belonging without conformity.',
    chakra: 'heart',
    journalPrompts: [
      'Where do I feel seen?',
      'What part of me feels ahead of its time?',
      'What would belonging look like without shrinking?',
    ],
    bodyAwareness: 'Notice how your body feels in a group versus alone. What shifts?',
  },
  12: {
    house: 12,
    title: 'Inner World · Integration',
    theme: 'Sensitivity that operates quietly.',
    description: 'You may process experiences internally before understanding them consciously. There\'s a depth of perception here that works below the surface — it isn\'t avoidance, it\'s processing.',
    integrationTheme: 'Presence without disappearance.',
    chakra: 'crown',
    journalPrompts: [
      'What am I sensing beneath words?',
      'What feels unspoken but real?',
      'What needs space to surface on its own timeline?',
    ],
    bodyAwareness: 'Close your eyes. What do you notice when external input quiets?',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CHIRON → NODE FUSION (Premium weekly content)
// ═══════════════════════════════════════════════════════════════════════════

export interface ChironNodeInsight {
  context: string;
  prompt: string;
  close: string;
}

export function getChironNodeFusion(chironHouse: number): ChironNodeInsight {
  return {
    context: 'Growth asks you to move forward without abandoning sensitivity.',
    prompt: 'What would growth look like if it felt safe?',
    close: 'You don\'t need to resolve this.',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract Chiron placement from a natal chart.
 * Chiron is typically in chart.planets as "Chiron".
 * Falls back to a house-based estimate if not found.
 */
export function getChironPlacement(chart: NatalChart): ChironPlacement | null {
  // Try enhanced planets array first
  if (chart.planets) {
    const chiron = chart.planets.find(
      (p: PlanetPosition) => p.planet.toLowerCase() === 'chiron'
    );
    if (chiron) {
      return {
        house: chiron.house ?? 0,
        sign: chiron.sign,
        degree: chiron.degree,
        retrograde: chiron.retrograde,
      };
    }
  }

  // Try legacy placements
  if (chart.placements) {
    const chiron = chart.placements.find(
      p => p.planet?.name?.toLowerCase() === 'chiron'
    );
    if (chiron) {
      return {
        house: chiron.house,
        sign: chiron.sign?.name ?? '',
        degree: chiron.degree,
        retrograde: chiron.isRetrograde,
      };
    }
  }

  return null;
}

/**
 * Get the full Chiron insight for a given house.
 */
export function getChironInsight(house: number): ChironInsight {
  const h = Math.max(1, Math.min(12, house));
  return CHIRON_BY_HOUSE[h];
}

/**
 * Get Chiron insight directly from a natal chart.
 */
export function getChironInsightFromChart(chart: NatalChart): ChironInsight | null {
  const placement = getChironPlacement(chart);
  if (!placement || placement.house === 0) return null;
  return getChironInsight(placement.house);
}

/**
 * Get the chakra associated with a Chiron house placement.
 */
export function getChironChakra(house: number): ChakraTag {
  return CHIRON_BY_HOUSE[Math.max(1, Math.min(12, house))]?.chakra ?? 'heart';
}
