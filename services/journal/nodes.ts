/**
 * North & South Node System — Direction Logic
 *
 * South Node = Familiar patterns, comfort zone, default mode under stress.
 *   → Not wrong. Just efficient. But they don't lead you forward anymore.
 *
 * North Node = Growth direction. Awkward but alive.
 *   → Not because it's easy, but because it's meaningful.
 *
 * NEVER uses: "past life karma", "destiny you must follow"
 * ALWAYS uses: familiar vs growth-oriented, comfort vs expansion
 */

import { NatalChart, PlanetPosition } from '../astrology/types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface NodePlacement {
  house: number;       // 1-12
  sign: string;
  degree: number;
}

export interface NodeAxis {
  northNode: NodePlacement;
  southNode: NodePlacement;
}

export interface NodeHouseContent {
  house: number;
  title: string;
  theme: string;       // one-line theme
  description: string; // 2-3 sentences
  journalPrompts: string[];
}

export interface NodeInsight {
  southNode: NodeHouseContent;
  northNode: NodeHouseContent;
  fusionLine: string;  // bridges both
  weeklyReflection: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SOUTH NODE BY HOUSE — "Where you default"
// ═══════════════════════════════════════════════════════════════════════════

const SOUTH_NODE_BY_HOUSE: Record<number, NodeHouseContent> = {
  1: {
    house: 1,
    title: 'Self-Reliance',
    theme: 'Defaulting to independence under pressure.',
    description: 'You naturally lead with self-sufficiency. Under stress, the instinct is to handle everything alone — not because you want to, but because it feels safest.',
    journalPrompts: [
      'When did I last ask for help — and how did it feel?',
      'Where does independence protect me, and where does it isolate me?',
    ],
  },
  2: {
    house: 2,
    title: 'Material Security',
    theme: 'Anchoring identity in stability and resources.',
    description: 'Comfort lives in tangible security — what you own, what you can control. Under stress, the impulse is to build walls, accumulate, and resist change.',
    journalPrompts: [
      'What am I holding onto for safety that doesn\'t actually make me feel safe?',
      'Where does comfort become complacency?',
    ],
  },
  3: {
    house: 3,
    title: 'Information Gathering',
    theme: 'Defaulting to analysis over feeling.',
    description: 'Your comfort zone is knowledge — gathering, categorizing, explaining. Under stress, thinking replaces feeling. The answer always seems to be "know more."',
    journalPrompts: [
      'What am I analyzing that actually needs to be felt?',
      'When does information become a way to avoid uncertainty?',
    ],
  },
  4: {
    house: 4,
    title: 'Emotional Retreat',
    theme: 'Withdrawing into the inner world when challenged.',
    description: 'Under pressure, the instinct is to go home — physically or emotionally. Privacy and emotional safety come naturally, but they can become hiding.',
    journalPrompts: [
      'What am I retreating from — and is that retreat protecting me or limiting me?',
      'Where does emotional safety become avoidance of growth?',
    ],
  },
  5: {
    house: 5,
    title: 'Self-Expression',
    theme: 'Defaulting to performance or personal drama.',
    description: 'You naturally center experiences around personal expression. Under stress, the story becomes about you — not because you\'re selfish, but because that\'s where you feel most real.',
    journalPrompts: [
      'Where am I making it about me when it\'s actually about something bigger?',
      'What would it look like to express without needing to be seen?',
    ],
  },
  6: {
    house: 6,
    title: 'Service & Control',
    theme: 'Defaulting to fixing, organizing, or self-improvement.',
    description: 'Under stress, you organize. The impulse is to make things better — body, routine, systems. Helpfulness can become a way to avoid sitting with what is.',
    journalPrompts: [
      'Where am I fixing when I should be feeling?',
      'What would "good enough" look like without the next improvement?',
    ],
  },
  7: {
    house: 7,
    title: 'Relational Identity',
    theme: 'Defining yourself through others.',
    description: 'You naturally orient through relationship. Under stress, the instinct is to check in with someone else before yourself. Harmony can become self-abandonment.',
    journalPrompts: [
      'What would I choose if no one else\'s opinion mattered?',
      'Where am I keeping peace at my own expense?',
    ],
  },
  8: {
    house: 8,
    title: 'Emotional Intensity',
    theme: 'Defaulting to depth, control, or crisis mode.',
    description: 'Intensity feels normal to you. Under stress, emotional merging or power dynamics replace simpler exchanges. The instinct is to go deep — even when the moment is surface-level.',
    journalPrompts: [
      'Where am I creating intensity that the situation doesn\'t require?',
      'What would lightness feel like right now?',
    ],
  },
  9: {
    house: 9,
    title: 'Belief Systems',
    theme: 'Defaulting to big-picture thinking over presence.',
    description: 'You naturally see the grand narrative. Under stress, philosophy replaces presence — seeking meaning becomes a way to avoid the messiness of now.',
    journalPrompts: [
      'What am I philosophizing about that actually needs to be lived?',
      'Where does meaning-making become avoidance of the immediate?',
    ],
  },
  10: {
    house: 10,
    title: 'Achievement & Control',
    theme: 'Defaulting to ambition and external validation.',
    description: 'Under stress, you work harder. Achievement feels like the answer, and external recognition substitutes for inner peace. The hustle is a safe place — even when it exhausts you.',
    journalPrompts: [
      'What am I achieving to avoid feeling?',
      'What would rest look like without guilt or fear?',
    ],
  },
  11: {
    house: 11,
    title: 'Detachment',
    theme: 'Defaulting to idealism or emotional distance.',
    description: 'You naturally think in systems and ideas. Under stress, the impulse is to observe from a safe distance — being "above it" instead of in it.',
    journalPrompts: [
      'Where am I watching from the outside instead of participating?',
      'What would it look like to be personally affected — and let that be okay?',
    ],
  },
  12: {
    house: 12,
    title: 'Dissolution',
    theme: 'Defaulting to escapism or spiritual bypassing.',
    description: 'Under stress, the instinct is to dissolve — to sleep, to zone out, to seek transcendence instead of dealing with reality. Surrender is natural, but so is avoidance.',
    journalPrompts: [
      'What am I escaping from right now?',
      'Where does letting go become giving up?',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// NORTH NODE BY HOUSE — "Where life expands"
// ═══════════════════════════════════════════════════════════════════════════

const NORTH_NODE_BY_HOUSE: Record<number, NodeHouseContent> = {
  1: {
    house: 1,
    title: 'Self-Definition',
    theme: 'Growth through choosing yourself.',
    description: 'Life is inviting you to trust your own instincts, take initiative, and stop waiting for permission or partnership to move forward.',
    journalPrompts: [
      'What would I do differently if I fully trusted my own instincts?',
      'Where am I waiting for someone else to go first?',
    ],
  },
  2: {
    house: 2,
    title: 'Self-Worth',
    theme: 'Growth through valuing yourself independently.',
    description: 'Life is asking you to build your own sense of stability — not through others\' resources, but through knowing what you bring and what you need.',
    journalPrompts: [
      'What do I value that doesn\'t depend on anyone else?',
      'Where can I trust my own capacity more?',
    ],
  },
  3: {
    house: 3,
    title: 'Curiosity & Communication',
    theme: 'Growth through direct, simple expression.',
    description: 'Life is asking you to be curious without needing to be right. To listen more, preach less, and trust that small conversations hold wisdom too.',
    journalPrompts: [
      'What am I curious about that has no grand purpose?',
      'What would it feel like to speak without preparing?',
    ],
  },
  4: {
    house: 4,
    title: 'Emotional Foundation',
    theme: 'Growth through vulnerability and inner security.',
    description: 'Life is inviting you inward — to build emotional safety, to let yourself be held, and to stop performing strength.',
    journalPrompts: [
      'What would emotional honesty look like today?',
      'Where can I let myself be softer without losing myself?',
    ],
  },
  5: {
    house: 5,
    title: 'Joy & Creative Risk',
    theme: 'Growth through play, self-expression, and delight.',
    description: 'Life is asking you to take creative risks, let yourself be seen, and stop detaching into ideas. Joy isn\'t frivolous — it\'s the work.',
    journalPrompts: [
      'What would I do today purely for joy?',
      'Where am I overthinking something that just wants to be felt?',
    ],
  },
  6: {
    house: 6,
    title: 'Daily Practice',
    theme: 'Growth through grounded, useful routines.',
    description: 'Life is asking you to show up for the small things. Not the grand spiritual vision — but the daily, physical, real-world work of being well.',
    journalPrompts: [
      'What one small thing could I do today that actually helps?',
      'Where am I avoiding the practical in favor of the abstract?',
    ],
  },
  7: {
    house: 7,
    title: 'Partnership & Mutuality',
    theme: 'Growth through real connection and compromise.',
    description: 'Life is asking you to let others in — genuinely. Not leading, not performing, but being in relationship as an equal.',
    journalPrompts: [
      'What would true partnership look like right now?',
      'Where am I leading when I could be listening?',
    ],
  },
  8: {
    house: 8,
    title: 'Emotional Depth',
    theme: 'Growth through surrender and shared vulnerability.',
    description: 'Life is asking you to let go of control over resources, outcomes, and comfort. Depth isn\'t danger — it\'s where real transformation lives.',
    journalPrompts: [
      'What would I gain from letting someone truly see me?',
      'Where am I gripping that could soften?',
    ],
  },
  9: {
    house: 9,
    title: 'Expanded Perspective',
    theme: 'Growth through meaning, adventure, and bigger thinking.',
    description: 'Life is asking you to zoom out — to trust bigger patterns, explore unfamiliar ideas, and let your worldview expand.',
    journalPrompts: [
      'What perspective am I avoiding that might actually help?',
      'What would expand if I stopped managing the details?',
    ],
  },
  10: {
    house: 10,
    title: 'Purpose & Responsibility',
    theme: 'Growth through visible contribution.',
    description: 'Life is asking you to step into a public role — not for validation, but because your contribution matters. Authority and vulnerability can coexist.',
    journalPrompts: [
      'What am I ready to be responsible for?',
      'Where does purposeful action feel like coming home?',
    ],
  },
  11: {
    house: 11,
    title: 'Community & Vision',
    theme: 'Growth through belonging to something larger.',
    description: 'Life is asking you to participate in collective life — not as the star, but as a member. Your ideas matter more when they serve others.',
    journalPrompts: [
      'What cause or community stirs something in me?',
      'Where could I contribute without needing recognition?',
    ],
  },
  12: {
    house: 12,
    title: 'Surrender & Trust',
    theme: 'Growth through releasing control and trusting process.',
    description: 'Life is asking you to let go — of perfection, of fixing, of managing every detail. The work here is trust: that things are unfolding even without your intervention.',
    journalPrompts: [
      'What would it feel like to stop managing this?',
      'Where is surrender being confused with failure?',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// FUSION LINES (bridges South → North)
// ═══════════════════════════════════════════════════════════════════════════

function getFusionLine(southHouse: number, northHouse: number): string {
  const fusions: Record<string, string> = {
    '1-7': 'You tend to lead alone. Growth comes through learning to be with others — as equals.',
    '2-8': 'You tend to anchor in what\'s tangible. Growth comes through trusting what you can\'t control.',
    '3-9': 'You tend to gather information. Growth comes through trusting bigger meaning.',
    '4-10': 'You tend to retreat inward. Growth comes through purposeful contribution outward.',
    '5-11': 'You tend to center your own story. Growth comes through serving a larger vision.',
    '6-12': 'You tend to optimize and fix. Growth comes through surrendering to process.',
    '7-1': 'You tend to define yourself through others. Growth comes through trusting your own instincts.',
    '8-2': 'You tend to merge and control. Growth comes through building your own resources.',
    '9-3': 'You tend to seek grand meaning. Growth comes through simple, present communication.',
    '10-4': 'You tend to perform and achieve. Growth comes through emotional honesty.',
    '11-5': 'You tend to detach into ideas. Growth comes through personal creative expression.',
    '12-6': 'You tend to dissolve and escape. Growth comes through daily, grounded practice.',
  };
  const key = `${southHouse}-${northHouse}`;
  return fusions[key] ?? `You tend to retreat into ${SOUTH_NODE_BY_HOUSE[southHouse]?.title?.toLowerCase() ?? 'familiar ground'} when uncertain. Growth comes through engaging ${NORTH_NODE_BY_HOUSE[northHouse]?.title?.toLowerCase() ?? 'new territory'}, even imperfectly.`;
}

function getWeeklyReflection(southHouse: number, northHouse: number): string {
  const south = SOUTH_NODE_BY_HOUSE[southHouse];
  const north = NORTH_NODE_BY_HOUSE[northHouse];
  if (!south || !north) return 'What is your comfort zone protecting you from — and what is it costing you?';
  return `This week, notice when you default to ${south.title.toLowerCase()}. Then ask: what would ${north.title.toLowerCase()} look like, even in a small way?`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract North Node placement from natal chart.
 * The South Node is always opposite (house + 6, sign opposite).
 */
export function getNodeAxis(chart: NatalChart): NodeAxis | null {
  let northNode: NodePlacement | null = null;

  // Try enhanced planets
  if (chart.planets) {
    const nn = chart.planets.find(
      (p: PlanetPosition) =>
        p.planet.toLowerCase() === 'north node' ||
        p.planet.toLowerCase() === 'northnode' ||
        p.planet.toLowerCase() === 'true node'
    );
    if (nn) {
      northNode = {
        house: nn.house ?? 0,
        sign: nn.sign,
        degree: nn.degree,
      };
    }
  }

  // Try legacy placements
  if (!northNode && chart.placements) {
    const nn = chart.placements.find(
      p =>
        p.planet?.name?.toLowerCase() === 'north node' ||
        p.planet?.name?.toLowerCase() === 'true node'
    );
    if (nn) {
      northNode = {
        house: nn.house,
        sign: nn.sign?.name ?? '',
        degree: nn.degree,
      };
    }
  }

  if (!northNode || northNode.house === 0) return null;

  // South Node is the opposite house
  const southHouse = northNode.house <= 6
    ? northNode.house + 6
    : northNode.house - 6;

  const OPPOSITE_SIGN: Record<string, string> = {
    Aries: 'Libra', Taurus: 'Scorpio', Gemini: 'Sagittarius',
    Cancer: 'Capricorn', Leo: 'Aquarius', Virgo: 'Pisces',
    Libra: 'Aries', Scorpio: 'Taurus', Sagittarius: 'Gemini',
    Capricorn: 'Cancer', Aquarius: 'Leo', Pisces: 'Virgo',
  };

  const southNode: NodePlacement = {
    house: southHouse,
    sign: OPPOSITE_SIGN[northNode.sign] ?? '',
    degree: northNode.degree,
  };

  return { northNode, southNode };
}

/**
 * Get complete node insight (South + North + fusion + weekly).
 */
export function getNodeInsight(chart: NatalChart): NodeInsight | null {
  const axis = getNodeAxis(chart);
  if (!axis) return null;

  const south = SOUTH_NODE_BY_HOUSE[axis.southNode.house];
  const north = NORTH_NODE_BY_HOUSE[axis.northNode.house];
  if (!south || !north) return null;

  return {
    southNode: south,
    northNode: north,
    fusionLine: getFusionLine(axis.southNode.house, axis.northNode.house),
    weeklyReflection: getWeeklyReflection(axis.southNode.house, axis.northNode.house),
  };
}

/**
 * Get South Node content for a given house.
 */
export function getSouthNodeContent(house: number): NodeHouseContent {
  return SOUTH_NODE_BY_HOUSE[Math.max(1, Math.min(12, house))];
}

/**
 * Get North Node content for a given house.
 */
export function getNorthNodeContent(house: number): NodeHouseContent {
  return NORTH_NODE_BY_HOUSE[Math.max(1, Math.min(12, house))];
}
