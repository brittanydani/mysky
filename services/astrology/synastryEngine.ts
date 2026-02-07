/**
 * Synastry Engine
 * 
 * Calculates cross-chart aspects between two people.
 * These are the planetary connections that create chemistry,
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
    other: 'their sense of self and purpose' 
  },
  Moon: { 
    self: 'your emotional needs and inner world', 
    other: 'their feelings and emotional nature' 
  },
  Mercury: { 
    self: 'how you think and communicate', 
    other: 'how they process and express ideas' 
  },
  Venus: { 
    self: 'how you love and what you value', 
    other: 'how they express affection and beauty' 
  },
  Mars: { 
    self: 'your drive, passion, and assertiveness', 
    other: 'their energy, desire, and action style' 
  },
  Jupiter: { 
    self: 'your growth, optimism, and beliefs', 
    other: 'their expansiveness and philosophy' 
  },
  Saturn: { 
    self: 'your discipline, boundaries, and fears', 
    other: 'their structure, limits, and authority' 
  },
};

// Interpretations for key synastry aspects
const SYNASTRY_INTERPRETATIONS: Record<string, Record<string, {
  title: string;
  description: string;
  category: SynastryAspect['category'];
}>> = {
  // Sun aspects
  'Sun-Sun': {
    Conjunction: {
      title: 'Core Identity Merge',
      description: 'You share similar life purposes. You "get" each other at a fundamental level, though you may also trigger each other\'s ego.',
      category: 'connection',
    },
    Trine: {
      title: 'Natural Understanding',
      description: 'Your core selves flow together easily. There\'s an effortless recognition and support of who each of you is.',
      category: 'connection',
    },
    Square: {
      title: 'Growth Through Friction',
      description: 'Your core needs may clash, creating tension—but also motivation to grow. This isn\'t incompatibility; it\'s challenge.',
      category: 'challenge',
    },
    Opposition: {
      title: 'Mirror Reflection',
      description: 'You see yourself in them—sometimes uncomfortably. Opposition creates both attraction and projection.',
      category: 'growth',
    },
  },
  
  // Sun-Moon (emotional-identity connection)
  'Sun-Moon': {
    Conjunction: {
      title: 'Deep Emotional Recognition',
      description: 'One person\'s core self naturally nurtures the other\'s emotional needs. There\'s an instinctive sense of belonging together.',
      category: 'connection',
    },
    Trine: {
      title: 'Emotional Harmony',
      description: 'Identity and emotions flow easily between you. You feel seen and emotionally supported.',
      category: 'connection',
    },
    Square: {
      title: 'Emotional Adjustment Needed',
      description: 'What one needs emotionally may not align with what the other naturally gives. Understanding requires effort.',
      category: 'challenge',
    },
    Opposition: {
      title: 'Complementary Needs',
      description: 'You complete each other in some ways—but may also feel like you\'re operating from different playbooks.',
      category: 'growth',
    },
  },
  
  // Venus aspects (love and attraction)
  'Venus-Venus': {
    Conjunction: {
      title: 'Shared Love Language',
      description: 'You value the same things and express love similarly. Affection feels natural and reciprocal.',
      category: 'chemistry',
    },
    Trine: {
      title: 'Easy Affection',
      description: 'Love flows between you without effort. You appreciate each other\'s way of caring.',
      category: 'chemistry',
    },
    Square: {
      title: 'Different Love Styles',
      description: 'How you give and receive love differs. Neither is wrong—but translation is required.',
      category: 'challenge',
    },
  },
  
  'Venus-Mars': {
    Conjunction: {
      title: 'Magnetic Attraction',
      description: 'Classic chemistry indicator. One person\'s desire meets the other\'s receptivity perfectly.',
      category: 'chemistry',
    },
    Trine: {
      title: 'Natural Chemistry',
      description: 'Desire and affection harmonize easily. Physical and romantic connection feels effortless.',
      category: 'chemistry',
    },
    Square: {
      title: 'Passionate Tension',
      description: 'Strong attraction with an edge. The chemistry is undeniable but may include friction.',
      category: 'chemistry',
    },
    Opposition: {
      title: 'Push-Pull Dynamic',
      description: 'Intense attraction that can feel like a dance. One pursues while the other receives.',
      category: 'chemistry',
    },
  },
  
  // Moon aspects (emotional connection)
  'Moon-Moon': {
    Conjunction: {
      title: 'Emotional Twins',
      description: 'You feel things the same way. Emotional needs are understood without explanation.',
      category: 'connection',
    },
    Trine: {
      title: 'Emotional Flow',
      description: 'Your feelings resonate. Creating emotional safety together comes naturally.',
      category: 'connection',
    },
    Square: {
      title: 'Emotional Friction',
      description: 'What soothes one may irritate the other. Learning each other\'s emotional language takes patience.',
      category: 'challenge',
    },
  },
  
  'Moon-Venus': {
    Conjunction: {
      title: 'Tender Connection',
      description: 'Affection meets emotional needs perfectly. One naturally nurtures the other\'s heart.',
      category: 'connection',
    },
    Trine: {
      title: 'Sweet Compatibility',
      description: 'Love and comfort blend beautifully. Being together feels like home.',
      category: 'connection',
    },
  },
  
  // Mercury aspects (communication)
  'Mercury-Mercury': {
    Conjunction: {
      title: 'Mind Meld',
      description: 'You think alike and communicate effortlessly. Conversations flow naturally.',
      category: 'connection',
    },
    Trine: {
      title: 'Easy Communication',
      description: 'Understanding each other\'s perspective comes easily. You speak similar mental languages.',
      category: 'connection',
    },
    Square: {
      title: 'Communication Gaps',
      description: 'You process information differently. Misunderstandings are possible without care.',
      category: 'challenge',
    },
  },
  
  // Saturn aspects (commitment and challenge)
  'Sun-Saturn': {
    Conjunction: {
      title: 'Serious Bond',
      description: 'Saturn person may feel responsible for Sun person, or critical. This can stabilize or restrict.',
      category: 'growth',
    },
    Square: {
      title: 'Authority Tension',
      description: 'One may feel limited or judged by the other. Growth comes through working with this friction.',
      category: 'challenge',
    },
  },
  
  'Moon-Saturn': {
    Conjunction: {
      title: 'Emotional Responsibility',
      description: 'Deep bond with a serious tone. Saturn may stabilize Moon\'s emotions—or feel cold to them.',
      category: 'growth',
    },
    Square: {
      title: 'Emotional Restriction',
      description: 'Moon person may feel emotionally blocked by Saturn. Working through this builds lasting trust.',
      category: 'challenge',
    },
  },
  
  'Venus-Saturn': {
    Conjunction: {
      title: 'Committed Love',
      description: 'Love with staying power. Saturn brings seriousness to Venus\'s affection.',
      category: 'growth',
    },
    Trine: {
      title: 'Stable Affection',
      description: 'Love that builds over time. Commitment feels natural, not forced.',
      category: 'connection',
    },
    Square: {
      title: 'Love Tests',
      description: 'Affection may feel blocked or tested. Working through this builds resilient love.',
      category: 'challenge',
    },
  },
  
  // Mars aspects (energy and conflict)
  'Mars-Mars': {
    Conjunction: {
      title: 'Shared Drive',
      description: 'You approach action the same way. Can be powerfully collaborative—or competitive.',
      category: 'chemistry',
    },
    Square: {
      title: 'Friction Points',
      description: 'Your action styles clash. This creates tension but also energy. Learn to channel it.',
      category: 'challenge',
    },
    Opposition: {
      title: 'Opposing Forces',
      description: 'You may push against each other\'s methods. Understanding this prevents power struggles.',
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
        const aspect = this.calculateAspect(p1, p2, chart1.name || 'You', chart2.name || 'They');
        if (aspect) {
          aspects.push(aspect);
        }
      }
    }
    
    // Sort by strength and relevance
    aspects.sort((a, b) => {
      const strengthOrder = { strong: 0, moderate: 1, subtle: 2 };
      return strengthOrder[a.strength] - strengthOrder[b.strength];
    });
    
    // Group by category
    const connectionAspects = aspects.filter(a => a.category === 'connection');
    const chemistryAspects = aspects.filter(a => a.category === 'chemistry');
    const growthAspects = aspects.filter(a => a.category === 'growth');
    const challengeAspects = aspects.filter(a => a.category === 'challenge');
    
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
    
    return planets;
  }
  
  /**
   * Calculate aspect between two planets from different charts
   */
  private static calculateAspect(
    planet1: PlanetPlacement, 
    planet2: PlanetPlacement,
    person1Name: string,
    person2Name: string
  ): SynastryAspect | null {
    // Use longitude (0-360) for aspect calculation
    const degree1 = planet1.longitude;
    const degree2 = planet2.longitude;
    
    if (degree1 === undefined || degree2 === undefined) return null;
    
    // Calculate angular difference
    let diff = Math.abs(degree1 - degree2);
    if (diff > 180) diff = 360 - diff;
    
    // Check against aspect orbs
    const aspectCheck = this.findAspect(diff);
    if (!aspectCheck) return null;
    
    const { aspectType, orb } = aspectCheck;
    
    // Get planet names for lookup
    const p1Name = planet1.planet.name;
    const p2Name = planet2.planet.name;
    
    // Get interpretation
    const pairKey = this.getPairKey(p1Name, p2Name);
    const interpretation = SYNASTRY_INTERPRETATIONS[pairKey]?.[aspectType.name];
    
    // Generate default if no specific interpretation
    const title = interpretation?.title || `${p1Name}-${p2Name} ${aspectType.name}`;
    const description = interpretation?.description || 
      this.generateDefaultDescription(planet1, planet2, aspectType);
    const category = interpretation?.category || this.inferCategory(aspectType);
    
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
   * Find aspect type from degree difference
   */
  private static findAspect(diff: number): { aspectType: AspectType; orb: number } | null {
    const aspects = [
      { name: 'Conjunction', targetDegree: 0, maxOrb: 8 },
      { name: 'Opposition', targetDegree: 180, maxOrb: 8 },
      { name: 'Trine', targetDegree: 120, maxOrb: 8 },
      { name: 'Square', targetDegree: 90, maxOrb: 7 },
      { name: 'Sextile', targetDegree: 60, maxOrb: 5 },
    ];
    
    for (const aspect of aspects) {
      const orb = Math.abs(diff - aspect.targetDegree);
      if (orb <= aspect.maxOrb) {
        const aspectType = ASPECT_TYPES.find(at => at.name === aspect.name);
        if (aspectType) {
          return { aspectType, orb };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get standardized pair key for lookup
   */
  private static getPairKey(planet1: string, planet2: string): string {
    // Order alphabetically for consistent lookup
    const ordered = [planet1, planet2].sort();
    return `${ordered[0]}-${ordered[1]}`;
  }
  
  /**
   * Generate default description when no specific interpretation exists
   */
  private static generateDefaultDescription(
    planet1: PlanetPlacement,
    planet2: PlanetPlacement,
    aspectType: AspectType
  ): string {
    const theme1 = PLANET_THEMES[planet1.planet.name]?.self || 'your energy';
    const theme2 = PLANET_THEMES[planet2.planet.name]?.other || 'their energy';
    
    const verb = aspectType.nature === 'Harmonious' 
      ? 'flows naturally with' 
      : aspectType.nature === 'Challenging'
        ? 'creates tension with'
        : 'connects with';
    
    return `Your ${theme1} ${verb} ${theme2}. This creates ${
      aspectType.nature === 'Harmonious' ? 'ease' : 'growth opportunity'
    } in how you relate.`;
  }
  
  /**
   * Infer category from aspect nature
   */
  private static inferCategory(aspectType: AspectType): SynastryAspect['category'] {
    if (aspectType.nature === 'Harmonious') return 'connection';
    if (aspectType.nature === 'Challenging') return 'challenge';
    return 'growth';
  }
  
  /**
   * Summarize the primary connection
   */
  private static summarizeConnection(
    connections: SynastryAspect[],
    chemistry: SynastryAspect[]
  ): string {
    const all = [...connections, ...chemistry];
    if (all.length === 0) {
      return 'Your connection operates through subtle, less obvious channels. This doesn\'t mean less depth—just different pathways.';
    }
    
    const strongest = all[0];
    const hasEmotional = all.some(a => 
      a.person1Planet.planet.name === 'Moon' || a.person2Planet.planet.name === 'Moon'
    );
    const hasMental = all.some(a => 
      a.person1Planet.planet.name === 'Mercury' || a.person2Planet.planet.name === 'Mercury'
    );
    const hasRomantic = all.some(a => 
      a.person1Planet.planet.name === 'Venus' || a.person2Planet.planet.name === 'Venus'
    );
    
    let summary = `Your strongest bond is through ${strongest.title.toLowerCase()}. `;
    
    if (hasEmotional && hasRomantic) {
      summary += 'You connect both emotionally and romantically.';
    } else if (hasEmotional) {
      summary += 'Emotional understanding is your foundation.';
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
  private static summarizeChallenge(
    challenges: SynastryAspect[],
    growth: SynastryAspect[]
  ): string {
    const all = [...challenges, ...growth];
    if (all.length === 0) {
      return 'No major friction points stand out. Your challenges may be more situational than planetary.';
    }
    
    const strongest = all[0];
    return `Your growth edge involves ${strongest.title.toLowerCase()}. ${
      strongest.description.split('.')[0]
    }. Working with this consciously strengthens your bond.`;
  }
  
  /**
   * Summarize overall dynamic
   */
  private static summarizeOverall(aspects: SynastryAspect[]): string {
    const harmonious = aspects.filter(a => a.category === 'connection' || a.category === 'chemistry').length;
    const challenging = aspects.filter(a => a.category === 'challenge').length;
    const growth = aspects.filter(a => a.category === 'growth').length;
    
    if (harmonious > challenging + growth) {
      return 'Your charts show natural ease together. The connection flows well, though every relationship benefits from conscious attention.';
    } else if (challenging > harmonious) {
      return 'Your charts show significant growth potential. This isn\'t "incompatibility"—it\'s invitation to evolve together through understanding.';
    } else {
      return 'Your charts show balance of harmony and growth. This creates both comfort and evolution—the hallmarks of meaningful connection.';
    }
  }
}
