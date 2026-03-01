/**
 * Synastry Engine
 *
 * Calculates cross-chart aspects between two people.
 * These are the planetary connections that can create chemistry,
 * understanding, tension, and growth in relationships.
 *
 * No compatibility scores. Just insight into HOW you connect.
 */

import { NatalChart, PlanetPlacement, AspectType } from './types';
import { ASPECT_TYPES } from './constants';

export interface SynastryAspect {
  person1Planet: PlanetPlacement;
  person2Planet: PlanetPlacement;
  aspectType: AspectType;
  orb: number;

  // Human-readable interpretation
  title: string;
  description: string;

  // For UI categorization
  category: 'connection' | 'growth' | 'chemistry' | 'challenge';
  strength: 'strong' | 'moderate' | 'subtle';
}

export interface SynastryReport {
  aspects: SynastryAspect[];

  // Grouped by theme
  connectionAspects: SynastryAspect[];
  chemistryAspects: SynastryAspect[];
  growthAspects: SynastryAspect[];
  challengeAspects: SynastryAspect[];

  // Summary insights
  primaryConnection: string;
  primaryChallenge: string;
  overallDynamic: string;
}

// Planet keywords for interpretation
const PLANET_THEMES: Record<string, { self: string; other: string }> = {
  Sun: {
    self: 'your core identity and life force',
    other: 'their sense of self and purpose',
  },
  Moon: {
    self: 'your emotional needs and inner world',
    other: 'their feelings and emotional nature',
  },
  Mercury: {
    self: 'how you think and communicate',
    other: 'how they process and express ideas',
  },
  Venus: {
    self: 'how you love and what you value',
    other: 'how they express affection and beauty',
  },
  Mars: {
    self: 'your drive, passion, and assertiveness',
    other: 'their energy, desire, and action style',
  },
  Jupiter: {
    self: 'your growth, optimism, and beliefs',
    other: 'their expansiveness and philosophy',
  },
  Saturn: {
    self: 'your discipline, boundaries, and fears',
    other: 'their structure, limits, and authority',
  },
  Uranus: {
    self: 'your need for freedom, originality, and change',
    other: 'their unpredictability and unconventional nature',
  },
  Neptune: {
    self: 'your imagination, spirituality, and idealism',
    other: 'their dreams, illusions, and creative vision',
  },
  Pluto: {
    self: 'your power, transformation, and deepest desires',
    other: 'their intensity, control, and transformative influence',
  },
};

// Interpretations for key synastry aspects
// IMPORTANT: Pair keys must match the canonical ordering defined by PLANET_ORDER below.
const SYNASTRY_INTERPRETATIONS: Record<
  string,
  Record<
    string,
    {
      title: string;
      description: string;
      category: SynastryAspect['category'];
    }
  >
> = {
  // Sun aspects
  'Sun-Sun': {
    Conjunction: {
      title: 'Core Identity Merge',
      description:
        'You share similar life purposes. You often recognize each other at a fundamental level, though you may also trigger each other’s ego.',
      category: 'connection',
    },
    Trine: {
      title: 'Natural Understanding',
      description:
        'Your core selves flow together easily. There’s an effortless recognition and support of who each of you is.',
      category: 'connection',
    },
    Square: {
      title: 'Growth Through Friction',
      description:
        'Your core needs may clash, creating tension—but also motivation to grow. This isn’t incompatibility; it’s a growth edge.',
      category: 'challenge',
    },
    Opposition: {
      title: 'Mirror Reflection',
      description:
        'You can see yourself in them—sometimes uncomfortably. Opposition often brings both attraction and projection.',
      category: 'growth',
    },
  },

  // Sun-Moon (emotional-identity connection)
  'Sun-Moon': {
    Conjunction: {
      title: 'Deep Emotional Recognition',
      description:
        'One person’s core self naturally meets the other’s emotional needs. There can be an instinctive sense of belonging together.',
      category: 'connection',
    },
    Trine: {
      title: 'Emotional Harmony',
      description:
        'Identity and emotions flow easily between you. You’re more likely to feel seen and emotionally supported.',
      category: 'connection',
    },
    Square: {
      title: 'Emotional Adjustment Needed',
      description:
        'What one needs emotionally may not align with what the other naturally gives. Understanding often requires effort and translation.',
      category: 'challenge',
    },
    Opposition: {
      title: 'Complementary Needs',
      description:
        'You complement each other in some ways—but may also feel like you’re operating from different playbooks. Awareness helps integration.',
      category: 'growth',
    },
  },

  // Venus aspects (love and attraction)
  'Venus-Venus': {
    Conjunction: {
      title: 'Shared Love Language',
      description:
        'You tend to value similar things and express love in similar ways. Affection can feel natural and reciprocal.',
      category: 'chemistry',
    },
    Trine: {
      title: 'Easy Affection',
      description:
        'Love flows between you with less friction. You appreciate each other’s way of caring.',
      category: 'chemistry',
    },
    Square: {
      title: 'Different Love Styles',
      description:
        'How you give and receive love differs. Neither is wrong—but translation is required.',
      category: 'challenge',
    },
  },

  'Venus-Mars': {
    Conjunction: {
      title: 'Magnetic Attraction',
      description:
        'A commonly felt attraction signature. One person’s desire meets the other’s receptivity in a way that feels immediate.',
      category: 'chemistry',
    },
    Trine: {
      title: 'Natural Chemistry',
      description:
        'Desire and affection harmonize easily. Physical and romantic connection can feel effortless.',
      category: 'chemistry',
    },
    Square: {
      title: 'Passionate Tension',
      description:
        'Strong attraction with an edge. The chemistry is real, and it may include friction that needs skillful handling.',
      category: 'chemistry',
    },
    Opposition: {
      title: 'Push–Pull Dynamic',
      description:
        'Intense attraction that can feel like a dance. One pursues while the other receives, and balance becomes the work.',
      category: 'chemistry',
    },
  },

  // Moon aspects (emotional connection)
  'Moon-Moon': {
    Conjunction: {
      title: 'Emotional Resonance',
      description:
        'You can feel things in similar ways. Emotional needs are often understood with fewer words.',
      category: 'connection',
    },
    Trine: {
      title: 'Emotional Flow',
      description:
        'Your feelings resonate. Creating emotional safety together can come naturally.',
      category: 'connection',
    },
    Square: {
      title: 'Emotional Friction',
      description:
        'What soothes one may irritate the other. Learning each other’s emotional language can take patience.',
      category: 'challenge',
    },
  },

  'Moon-Venus': {
    Conjunction: {
      title: 'Tender Connection',
      description:
        'Affection meets emotional needs in a sweet, immediate way. One often nurtures the other’s heart.',
      category: 'connection',
    },
    Trine: {
      title: 'Sweet Compatibility',
      description:
        'Love and comfort blend beautifully. Being together can feel grounding and safe.',
      category: 'connection',
    },
  },

  // Mercury aspects (communication)
  'Mercury-Mercury': {
    Conjunction: {
      title: 'Shared Mental Language',
      description:
        'You can think alike and communicate smoothly. Conversations tend to flow.',
      category: 'connection',
    },
    Trine: {
      title: 'Easy Communication',
      description:
        'Understanding each other’s perspective comes more easily. You speak similar mental languages.',
      category: 'connection',
    },
    Square: {
      title: 'Communication Gaps',
      description:
        'You process information differently. Misunderstandings are possible without care and curiosity.',
      category: 'challenge',
    },
  },

  // Saturn aspects (commitment and challenge)
  'Sun-Saturn': {
    Conjunction: {
      title: 'Serious Bond',
      description:
        'Saturn can bring responsibility and long-term focus to the Sun person. This can feel stabilizing—or heavy if unspoken expectations build.',
      category: 'growth',
    },
    Square: {
      title: 'Authority Tension',
      description:
        'One may feel limited or judged by the other. Growth comes through boundaries, clarity, and mutual respect.',
      category: 'challenge',
    },
  },

  'Moon-Saturn': {
    Conjunction: {
      title: 'Emotional Responsibility',
      description:
        'A deep bond with a serious tone. Saturn may stabilize Moon’s emotions—or Moon may experience Saturn as distant without warmth.',
      category: 'growth',
    },
    Square: {
      title: 'Emotional Inhibition',
      description:
        'Moon may feel emotionally blocked by Saturn at times. Working through this can build lasting trust when approached gently.',
      category: 'challenge',
    },
  },

  'Venus-Saturn': {
    Conjunction: {
      title: 'Committed Affection',
      description:
        'Love with staying power. Saturn brings seriousness and structure to Venus’s affection.',
      category: 'growth',
    },
    Trine: {
      title: 'Stable Affection',
      description:
        'Love that builds over time. Commitment can feel natural rather than forced.',
      category: 'connection',
    },
    Square: {
      title: 'Love Tests',
      description:
        'Affection may feel delayed, tested, or conditional at times. Working through this can build resilient love.',
      category: 'challenge',
    },
  },

  // Mars aspects (energy and conflict)
  'Mars-Mars': {
    Conjunction: {
      title: 'Shared Drive',
      description:
        'You approach action similarly. This can be powerfully collaborative—or competitive if not consciously channeled.',
      category: 'chemistry',
    },
    Square: {
      title: 'Friction Points',
      description:
        'Your action styles clash. This creates tension but also energy. Learning to channel it prevents unnecessary conflict.',
      category: 'challenge',
    },
    Opposition: {
      title: 'Opposing Forces',
      description:
        'You may push against each other’s methods. Understanding differences helps avoid power struggles.',
      category: 'challenge',
    },
  },

  // Outer planet synastry aspects (Uranus, Neptune, Pluto)
  'Sun-Uranus': {
    Conjunction: {
      title: 'Electric Awakening',
      description:
        'Uranus can electrify the Sun person’s identity. Exciting but unpredictable—this bond often resists routine.',
      category: 'chemistry',
    },
    Square: {
      title: 'Disruptive Freedom',
      description:
        'One person’s need for freedom can clash with the other’s sense of self. Growth often requires space and flexibility.',
      category: 'challenge',
    },
    Opposition: {
      title: 'Freedom vs Identity',
      description:
        'Attraction to what’s different in each other, but maintaining closeness can require conscious effort and autonomy.',
      category: 'growth',
    },
  },

  'Sun-Neptune': {
    Conjunction: {
      title: 'Idealistic Bond',
      description:
        'A dreamy, idealistic connection. Beautiful, but benefits from grounding—be wary of seeing only what you wish to see.',
      category: 'connection',
    },
    Square: {
      title: 'Fog vs Clarity',
      description:
        'Idealization and confusion can cloud the connection. Honesty and clear communication are essential.',
      category: 'challenge',
    },
  },

  'Sun-Pluto': {
    Conjunction: {
      title: 'Transformative Intensity',
      description:
        'A magnetic bond. Pluto can deeply impact the Sun person’s sense of self—potentially transformative when handled consciously.',
      category: 'chemistry',
    },
    Square: {
      title: 'Control vs Autonomy',
      description:
        'Intensity can tilt into control dynamics. Growth comes from releasing the need to dominate and building trust.',
      category: 'challenge',
    },
    Opposition: {
      title: 'Magnetic Polarity',
      description:
        'Powerful attraction with themes of control and surrender. Transformative when navigated with awareness.',
      category: 'growth',
    },
  },

  'Moon-Pluto': {
    Conjunction: {
      title: 'Emotional Depth',
      description:
        'Emotions can run very deep. This bond can transform emotional patterns—intense, healing, and sometimes overwhelming.',
      category: 'chemistry',
    },
    Square: {
      title: 'Emotional Power Dynamics',
      description:
        'Feelings can become controlling or reactive. Awareness can bring profound emotional growth.',
      category: 'challenge',
    },
  },

  'Venus-Pluto': {
    Conjunction: {
      title: 'Depth of Attraction',
      description:
        'A high-intensity bond. Love can feel transformative and consuming—best held with trust, boundaries, and honesty.',
      category: 'chemistry',
    },
    Square: {
      title: 'Attachment Intensity',
      description:
        'Jealousy and power dynamics can arise. Transforming possessiveness into trust becomes the work.',
      category: 'challenge',
    },
    Trine: {
      title: 'Deep Love',
      description:
        'A profound romantic and emotional connection that can transform both people’s experience of love.',
      category: 'chemistry',
    },
  },

  'Venus-Uranus': {
    Conjunction: {
      title: 'Unconventional Romance',
      description:
        'Love can feel electric and unconventional. Thrilling, but may struggle with consistency without agreements.',
      category: 'chemistry',
    },
    Square: {
      title: 'Instability vs Commitment',
      description:
        'Intense but changeable romantic energy. Freedom needs must be balanced with reliability.',
      category: 'challenge',
    },
  },

  'Venus-Neptune': {
    Conjunction: {
      title: 'Romantic Idealism',
      description:
        'A tender, idealistic attraction. Beautiful when grounded; confusing when reality is avoided.',
      category: 'chemistry',
    },
    Square: {
      title: 'Idealization Pattern',
      description:
        'Rose-colored projection can meet disappointment. Seeing each other clearly is the path forward.',
      category: 'challenge',
    },
  },

  'Mars-Pluto': {
    Conjunction: {
      title: 'High-Intensity Drive',
      description:
        'Powerful energy between you. Passion and intensity are strong—best approached with consent, boundaries, and self-awareness.',
      category: 'chemistry',
    },
    Square: {
      title: 'Volatile Friction',
      description:
        'Power struggles and intense conflict can surface. This energy can be destructive or deeply transformative depending on how it’s handled.',
      category: 'challenge',
    },
  },
};

export class SynastryEngine {
  /**
   * Calculate all synastry aspects between two charts
   */
  static calculateSynastry(chart1: NatalChart, chart2: NatalChart): SynastryReport {
    const aspects: SynastryAspect[] = [];

    const person1Planets = this.extractPlanets(chart1);
    const person2Planets = this.extractPlanets(chart2);

    // Calculate cross-chart aspects
    for (const p1 of person1Planets) {
      for (const p2 of person2Planets) {
        const aspect = this.calculateAspect(
          p1,
          p2,
          chart1.name || 'You',
          chart2.name || 'They',
        );
        if (aspect) {
          aspects.push(aspect);
        }
      }
    }

    // Sort by strength and relevance
    aspects.sort((a, b) => {
      const strengthOrder = { strong: 0, moderate: 1, subtle: 2 } as const;
      return strengthOrder[a.strength] - strengthOrder[b.strength];
    });

    // Group by category
    const connectionAspects = aspects.filter((a) => a.category === 'connection');
    const chemistryAspects = aspects.filter((a) => a.category === 'chemistry');
    const growthAspects = aspects.filter((a) => a.category === 'growth');
    const challengeAspects = aspects.filter((a) => a.category === 'challenge');

    return {
      aspects,
      connectionAspects,
      chemistryAspects,
      growthAspects,
      challengeAspects,
      primaryConnection: this.summarizeConnection(connectionAspects, chemistryAspects),
      primaryChallenge: this.summarizeChallenge(challengeAspects, growthAspects),
      overallDynamic: this.summarizeOverall(aspects),
    };
  }

  /**
   * Extract relevant planets from a chart
   */
  private static extractPlanets(chart: NatalChart): PlanetPlacement[] {
    const planets: PlanetPlacement[] = [];

    if (chart.sun) planets.push(chart.sun);
    if (chart.moon) planets.push(chart.moon);
    if (chart.mercury) planets.push(chart.mercury);
    if (chart.venus) planets.push(chart.venus);
    if (chart.mars) planets.push(chart.mars);
    if (chart.jupiter) planets.push(chart.jupiter);
    if (chart.saturn) planets.push(chart.saturn);
    if (chart.uranus) planets.push(chart.uranus);
    if (chart.neptune) planets.push(chart.neptune);
    if (chart.pluto) planets.push(chart.pluto);

    return planets;
  }

  /**
   * Planet ordering for canonical pair keys (must match interpretation table keys)
   */
  private static readonly PLANET_ORDER: Record<string, number> = {
    Sun: 0,
    Moon: 1,
    Mercury: 2,
    Venus: 3,
    Mars: 4,
    Jupiter: 5,
    Saturn: 6,
    Uranus: 7,
    Neptune: 8,
    Pluto: 9,
  };

  /**
   * Classes to tighten orbs (adds precision and reduces false positives)
   */
  private static getPlanetClass(name: string): 'luminary' | 'personal' | 'social' | 'outer' {
    if (name === 'Sun' || name === 'Moon') return 'luminary';
    if (name === 'Mercury' || name === 'Venus' || name === 'Mars') return 'personal';
    if (name === 'Jupiter' || name === 'Saturn') return 'social';
    return 'outer';
  }

  /**
   * Base aspect targets + caps (we then clamp by planet classes)
   */
  private static readonly ASPECT_TARGETS = [
    { name: 'Conjunction', targetDegree: 0, baseMaxOrb: 8 },
    { name: 'Opposition', targetDegree: 180, baseMaxOrb: 8 },
    { name: 'Trine', targetDegree: 120, baseMaxOrb: 8 },
    { name: 'Square', targetDegree: 90, baseMaxOrb: 7 },
    { name: 'Sextile', targetDegree: 60, baseMaxOrb: 5 },
  ] as const;

  /**
   * Max orb caps by planet class pairing (synastry-friendly and more credible)
   */
  private static maxOrbForPair(
    p1Name: string,
    p2Name: string,
    aspectName: (typeof SynastryEngine.ASPECT_TARGETS)[number]['name'],
    baseMaxOrb: number,
  ): number {
    const c1 = this.getPlanetClass(p1Name);
    const c2 = this.getPlanetClass(p2Name);

    // Start with a conservative cap derived from the "tightest" participant
    const classCap =
      c1 === 'outer' || c2 === 'outer'
        ? 4
        : c1 === 'social' || c2 === 'social'
          ? 5
          : c1 === 'personal' || c2 === 'personal'
            ? 6
            : 8; // luminary-luminary

    // Sextiles are typically felt tighter in synastry
    const sextileCap = aspectName === 'Sextile' ? Math.min(classCap, 4) : classCap;

    // Clamp final max orb between 2 and the base orb (so you never exceed your original settings)
    return Math.max(2, Math.min(baseMaxOrb, sextileCap));
  }

  /**
   * Normalize aspect name so table lookups are stable even if constants vary
   */
  private static normalizeAspectName(name: string): string {
    const trimmed = (name || '').trim();
    // Handle common variations
    const lower = trimmed.toLowerCase();
    if (lower === 'conj' || lower === 'conjunction') return 'Conjunction';
    if (lower === 'opp' || lower === 'opposition') return 'Opposition';
    if (lower === 'tri' || lower === 'trine') return 'Trine';
    if (lower === 'sqr' || lower === 'square') return 'Square';
    if (lower === 'sex' || lower === 'sextile') return 'Sextile';
    // Fall back to title-case-ish if it already matches
    return trimmed;
  }

  /**
   * Get standardized pair key for lookup.
   * Uses the canonical order defined by PLANET_ORDER so keys match
   * the hand-written interpretation table (e.g. "Sun-Moon", "Venus-Mars").
   */
  private static getPairKey(planet1: string, planet2: string): string {
    const o1 = this.PLANET_ORDER[planet1] ?? 99;
    const o2 = this.PLANET_ORDER[planet2] ?? 99;
    if (o1 <= o2) return `${planet1}-${planet2}`;
    return `${planet2}-${planet1}`;
  }

  /**
   * Calculate aspect between two planets from different charts
   */
  private static calculateAspect(
    planet1: PlanetPlacement,
    planet2: PlanetPlacement,
    person1Name: string,
    person2Name: string,
  ): SynastryAspect | null {
    const degree1 = planet1.longitude;
    const degree2 = planet2.longitude;

    if (degree1 === undefined || degree2 === undefined) return null;

    // Calculate angular difference (0..180)
    let diff = Math.abs(degree1 - degree2);
    if (diff > 180) diff = 360 - diff;

    // Check against aspect orbs (tightened by planet class)
    const aspectCheck = this.findAspect(diff, planet1.planet.name, planet2.planet.name);
    if (!aspectCheck) return null;

    const { aspectType, orb } = aspectCheck;

    const p1Name = planet1.planet.name;
    const p2Name = planet2.planet.name;

    // Canonical key and aspect name normalization
    const pairKey = this.getPairKey(p1Name, p2Name);
    const aspectKey = this.normalizeAspectName(aspectType.name);

    const interpretation = SYNASTRY_INTERPRETATIONS[pairKey]?.[aspectKey];

    // Generate default if no specific interpretation
    const title = interpretation?.title || `${p1Name}-${p2Name} ${aspectKey}`;
    const description =
      interpretation?.description ||
      this.generateDefaultDescription(planet1, planet2, aspectType, person1Name, person2Name);

    const category =
      interpretation?.category ||
      this.inferCategory(aspectType, planet1.planet.name, planet2.planet.name);

    return {
      person1Planet: planet1,
      person2Planet: planet2,
      aspectType,
      orb,
      title,
      description,
      category,
      strength: orb <= 2 ? 'strong' : orb <= 5 ? 'moderate' : 'subtle',
    };
  }

  /**
   * Find aspect type from degree difference, using tightened synastry orbs
   */
  private static findAspect(
    diff: number,
    p1Name: string,
    p2Name: string,
  ): { aspectType: AspectType; orb: number } | null {
    for (const aspect of this.ASPECT_TARGETS) {
      const orb = Math.abs(diff - aspect.targetDegree);
      const maxOrb = this.maxOrbForPair(p1Name, p2Name, aspect.name, aspect.baseMaxOrb);

      if (orb <= maxOrb) {
        const aspectType = ASPECT_TYPES.find((at) => this.normalizeAspectName(at.name) === aspect.name);
        if (aspectType) {
          return { aspectType, orb };
        }
      }
    }

    return null;
  }

  /**
   * Generate default description when no specific interpretation exists
   */
  private static generateDefaultDescription(
    planet1: PlanetPlacement,
    planet2: PlanetPlacement,
    aspectType: AspectType,
    person1Name: string,
    person2Name: string,
  ): string {
    const p1 = planet1.planet.name;
    const p2 = planet2.planet.name;

    const theme1 = PLANET_THEMES[p1]?.self || 'your energy';
    const theme2 = PLANET_THEMES[p2]?.other || 'their energy';

    const nature = aspectType.nature;
    const verb =
      nature === 'Harmonious'
        ? 'flows naturally with'
        : nature === 'Challenging'
          ? 'meets friction with'
          : 'connects with';

    // Slightly more human / less deterministic framing (review-safe tone)
    return `${person1Name}'s ${theme1} ${verb} ${person2Name}'s ${theme2}. This can create ${
      nature === 'Harmonious' ? 'ease' : nature === 'Challenging' ? 'a growth edge' : 'a meaningful link'
    } in how you relate.`;
  }

  /**
   * Infer category from aspect nature + planet pairing (better synastry UX)
   */
  private static inferCategory(
    aspectType: AspectType,
    p1Name: string,
    p2Name: string,
  ): SynastryAspect['category'] {
    const aName = this.normalizeAspectName(aspectType.name);
    const nature = aspectType.nature;

    const involves = (p: string) => p1Name === p || p2Name === p;

    // Chemistry signatures
    const chemistryPair =
      (involves('Venus') && involves('Mars')) ||
      (involves('Venus') && involves('Pluto')) ||
      (involves('Mars') && involves('Pluto')) ||
      (involves('Sun') && involves('Pluto'));

    if (chemistryPair && nature !== 'Harmonious') return 'chemistry';
    if (chemistryPair && nature === 'Harmonious') return 'chemistry';

    // Communication signatures
    if (involves('Mercury') && (aName === 'Conjunction' || aName === 'Trine' || aName === 'Sextile')) {
      return 'connection';
    }

    // Emotional safety signatures
    if (involves('Moon') && nature === 'Harmonious') return 'connection';

    if (nature === 'Harmonious') return 'connection';
    if (nature === 'Challenging') return 'challenge';
    return 'growth';
  }

  /**
   * Summarize the primary connection
   */
  private static summarizeConnection(connections: SynastryAspect[], chemistry: SynastryAspect[]): string {
    const all = [...connections, ...chemistry];
    if (all.length === 0) {
      return "Your connection shows up through subtler channels. This doesn't mean less depth—just different pathways.";
    }

    const strongest = all[0];
    const hasEmotional = all.some(
      (a) => a.person1Planet.planet.name === 'Moon' || a.person2Planet.planet.name === 'Moon',
    );
    const hasMental = all.some(
      (a) => a.person1Planet.planet.name === 'Mercury' || a.person2Planet.planet.name === 'Mercury',
    );
    const hasRomantic = all.some(
      (a) => a.person1Planet.planet.name === 'Venus' || a.person2Planet.planet.name === 'Venus',
    );

    let summary = `Your strongest bond is through ${strongest.title.toLowerCase()}. `;

    if (hasEmotional && hasRomantic) {
      summary += 'You connect both emotionally and romantically.';
    } else if (hasEmotional) {
      summary += 'Emotional understanding is a foundation here.';
    } else if (hasMental) {
      summary += 'Mental connection runs deep between you.';
    } else {
      summary += 'Your bond has unique qualities worth exploring.';
    }

    return summary;
  }

  /**
   * Summarize the primary challenge
   */
  private static summarizeChallenge(challenges: SynastryAspect[], growth: SynastryAspect[]): string {
    const all = [...challenges, ...growth];
    if (all.length === 0) {
      return "No major friction points stand out. Your challenges may be more situational than planetary.";
    }

    const strongest = all[0];
    return `Your growth edge involves ${strongest.title.toLowerCase()}. ${
      strongest.description.split('.')[0]
    }. Working with this consciously can strengthen your bond.`;
  }

  /**
   * Summarize overall dynamic
   */
  private static summarizeOverall(aspects: SynastryAspect[]): string {
    const harmonious = aspects.filter((a) => a.category === 'connection' || a.category === 'chemistry')
      .length;
    const challenging = aspects.filter((a) => a.category === 'challenge').length;
    const growth = aspects.filter((a) => a.category === 'growth').length;

    if (harmonious > challenging + growth) {
      return 'Your charts suggest natural ease together. The connection flows well, though every relationship benefits from conscious attention.';
    } else if (challenging > harmonious) {
      return 'Your charts suggest significant growth potential. This isn’t “incompatibility”—it’s an invitation to evolve together through understanding.';
    } else {
      return 'Your charts suggest a balance of harmony and growth. This can create both comfort and evolution—the hallmarks of meaningful connection.';
    }
  }
}
