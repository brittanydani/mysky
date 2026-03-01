/**
 * Premium Relationship Charts
 * 
 * Free users: 1 relationship with limited insight
 * Premium: Unlimited charts with full emotional breakdown
 * 
 * This isn't about compatibility scores — it's about UNDERSTANDING.
 * How do you two connect? Where do you clash? What does each person need?
 */

import { NatalChart } from '../astrology/types';
import { RelationshipChart } from '../storage/models';
import { RelationshipGuidanceGenerator, HumanRelationshipGuidance } from '../astrology/relationshipGuidance';
import { SynastryEngine, SynastryReport, SynastryAspect } from '../astrology/synastryEngine';

export interface RelationshipComparison {
  person1Name: string;
  person2Name: string;
  relationshipType: string;
  
  // How you connect
  connectionStrengths: ConnectionStrength[];
  
  // Where you might clash
  growthAreas: GrowthArea[];
  
  // What each person needs
  person1Needs: string[];
  person2Needs: string[];
  
  // Communication insights
  communicationDynamics: CommunicationInsight;
  
  // Emotional dynamics
  emotionalDynamics: EmotionalDynamicInsight;
  
  // Growth potential
  growthPotential: string;
  
  // Gentle reminder
  reminder: string;
}

export interface ConnectionStrength {
  title: string;
  description: string;
  icon: string;
}

export interface GrowthArea {
  title: string;
  description: string;
  healingQuestion: string;
}

export interface CommunicationInsight {
  person1Style: string;
  person2Style: string;
  dynamicDescription: string;
  tipForPerson1: string;
  tipForPerson2: string;
}

export interface EmotionalDynamicInsight {
  person1EmotionalNeeds: string;
  person2EmotionalNeeds: string;
  howYouNurtureEachOther: string;
  potentialTension: string;
  healingPath: string;
}

// Connection strength templates
const CONNECTION_STRENGTHS: Record<string, ConnectionStrength[]> = {
  'fire-fire': [
    { title: 'Shared Passion', description: 'You both approach life with enthusiasm and drive. Together, you can accomplish anything you set your minds to.', icon: 'flame' },
    { title: 'Mutual Inspiration', description: 'You ignite each other\'s creativity and ambition. Neither of you lets the other play small.', icon: 'sparkles' },
  ],
  'fire-earth': [
    { title: 'Vision Meets Action', description: 'Fire dreams it; Earth builds it. Together you turn inspiration into reality.', icon: 'construct' },
    { title: 'Grounding Energy', description: 'Earth helps Fire sustain their flame. Fire helps Earth take risks.', icon: 'leaf' },
  ],
  'fire-air': [
    { title: 'Ideas in Motion', description: 'Air fuels Fire\'s passion with ideas and perspective. Fire gives Air\'s thoughts direction.', icon: 'bulb' },
    { title: 'Dynamic Energy', description: 'You keep each other mentally and emotionally stimulated. Boredom isn\'t in your vocabulary.', icon: 'flash' },
  ],
  'fire-water': [
    { title: 'Passion Meets Depth', description: 'Fire brings warmth; Water brings depth. Together you have intensity AND meaning.', icon: 'heart' },
    { title: 'Emotional Alchemy', description: 'Water teaches Fire to feel; Fire teaches Water to act. Powerful transformation potential.', icon: 'water' },
  ],
  'earth-earth': [
    { title: 'Solid Foundation', description: 'You both value stability and follow-through. When you commit, it\'s for real.', icon: 'home' },
    { title: 'Shared Values', description: 'You understand each other\'s need for security, routine, and tangible progress.', icon: 'checkmark-circle' },
  ],
  'earth-air': [
    { title: 'Practical Wisdom', description: 'Air brings new perspectives; Earth grounds them in reality. A thinking-doing balance.', icon: 'analytics' },
    { title: 'Complementary Gifts', description: 'What one lacks, the other provides. Together you\'re more complete.', icon: 'git-merge' },
  ],
  'earth-water': [
    { title: 'Nurturing Security', description: 'Earth provides the stability Water craves. Water brings emotional richness Earth needs.', icon: 'shield-checkmark' },
    { title: 'Deep Commitment', description: 'Both of you value loyalty and depth. This connection can last.', icon: 'infinite' },
  ],
  'air-air': [
    { title: 'Mental Symphony', description: 'Your conversations could go on forever. You truly GET each other\'s minds.', icon: 'chatbubbles' },
    { title: 'Shared Curiosity', description: 'You explore ideas together, never running out of things to discuss.', icon: 'telescope' },
  ],
  'air-water': [
    { title: 'Heart-Mind Bridge', description: 'Air helps Water articulate feelings. Water helps Air access emotion.', icon: 'git-branch' },
    { title: 'Different Languages', description: 'Learning to translate between logic and intuition makes you both more whole.', icon: 'language' },
  ],
  'water-water': [
    { title: 'Emotional Telepathy', description: 'You understand each other without words. The unspoken is spoken here.', icon: 'eye' },
    { title: 'Deep Intimacy', description: 'You can go to emotional depths together that others might find overwhelming.', icon: 'heart-circle' },
  ],
};

// Growth area templates
const GROWTH_AREAS: Record<string, GrowthArea[]> = {
  'fire-fire': [
    { title: 'Power Struggles', description: 'Two fires can compete for the spotlight. Learning to take turns leading is key.', healingQuestion: 'Where might you be competing instead of collaborating?' },
    { title: 'Burnout Risk', description: 'Together you might push too hard without rest. Remember to tend the flames, not just stoke them.', healingQuestion: 'How do you rest together? What would that look like?' },
  ],
  'fire-earth': [
    { title: 'Pace Differences', description: 'Fire wants to move NOW; Earth needs time. Neither pace is wrong — just different.', healingQuestion: 'How can you honor both the need for action and the need for process?' },
    { title: 'Risk vs. Security', description: 'Fire thrives on spontaneity; Earth needs planning. Finding middle ground is growth.', healingQuestion: 'What\'s one area where you could compromise on pace?' },
  ],
  'fire-air': [
    { title: 'Grounding Gap', description: 'You might get lost in ideas and energy without ever building something tangible.', healingQuestion: 'What would help you ground your shared dreams in reality?' },
    { title: 'Emotional Avoidance', description: 'Both signs can avoid heavy emotions. Make space for what\'s uncomfortable.', healingQuestion: 'What feelings have you both been avoiding discussing?' },
  ],
  'fire-water': [
    { title: 'Intensity Overload', description: 'Fire burns; Water drowns. Together, the intensity can be overwhelming for both.', healingQuestion: 'How do you give each other space to regulate separately?' },
    { title: 'Different Expression', description: 'Fire expresses outward; Water expresses inward. Misreading each other is easy.', healingQuestion: 'What do you need the other person to understand about how you process?' },
  ],
  'earth-earth': [
    { title: 'Stuck Patterns', description: 'Two earth signs can become TOO stable — resistant to change even when needed.', healingQuestion: 'Where has comfort become stagnation?' },
    { title: 'Emotional Suppression', description: 'You might both avoid emotions in favor of practicality. Make room for feelings.', healingQuestion: 'When was the last time you talked about feelings instead of logistics?' },
  ],
  'earth-air': [
    { title: 'Speaking Different Languages', description: 'Air lives in ideas; Earth lives in reality. Translation is needed.', healingQuestion: 'What does the other person need you to understand about how they see the world?' },
    { title: 'Frustration Potential', description: 'Earth may see Air as "not practical"; Air may see Earth as "not imaginative."', healingQuestion: 'How can you appreciate what the other offers instead of what they lack?' },
  ],
  'earth-water': [
    { title: 'Emotional vs. Practical', description: 'Water needs feelings processed; Earth wants to fix things. Both are valid.', healingQuestion: 'Do you need to be heard or helped? Have you asked clearly?' },
    { title: 'Boundary Blending', description: 'You can become so merged that individual identity gets lost.', healingQuestion: 'What\'s something you do separately that matters to you?' },
  ],
  'air-air': [
    { title: 'All Talk, No Action', description: 'You might discuss everything without actually doing anything about it.', healingQuestion: 'What conversation needs to become a decision?' },
    { title: 'Emotional Avoidance', description: 'Air signs can intellectualize emotions away. Make space to actually feel.', healingQuestion: 'What emotion have you been analyzing instead of feeling?' },
  ],
  'air-water': [
    { title: 'Logic vs. Intuition', description: 'Air wants to understand; Water wants to feel. Neither is more valid.', healingQuestion: 'How can you honor both ways of knowing?' },
    { title: 'Overwhelm Differences', description: 'What overwhelms Water might seem small to Air. Validate each other\'s experience.', healingQuestion: 'What does the other person need when they\'re overwhelmed?' },
  ],
  'water-water': [
    { title: 'Emotional Flooding', description: 'Together you can amplify emotions to the point of overwhelm.', healingQuestion: 'How do you help each other regulate instead of escalate?' },
    { title: 'Boundary Blur', description: 'You might lose track of whose feelings are whose. Individuation matters.', healingQuestion: 'What feelings are you carrying that aren\'t yours?' },
  ],
};

export class PremiumRelationshipService {
  /**
   * Check if user can add more relationship charts
   */
  static canAddChart(currentChartCount: number, isPremium: boolean): boolean {
    if (isPremium) return true;
    return currentChartCount < 1; // Free users get 1
  }
  
  /**
   * Get the number of charts allowed
   */
  static getChartsAllowed(isPremium: boolean): number | 'unlimited' {
    return isPremium ? 'unlimited' : 1;
  }
  
  /**
   * Generate full relationship comparison (premium only)
   * When a SynastryReport is provided, real cross-chart aspects are woven
   * into the element-level base to give much richer, personalised output.
   */
  static generateComparison(
    userChart: NatalChart,
    otherChart: NatalChart,
    relationshipType: string,
    isPremium: boolean,
    synastryReport?: SynastryReport
  ): RelationshipComparison | null {
    if (!isPremium) {
      return null; // Return null for free users, they get limited insight only
    }
    
    const userElement = this.getElement(userChart.sunSign?.name || 'Aries');
    const otherElement = this.getElement(otherChart.sunSign?.name || 'Aries');
    
    const elementPair = this.getElementPair(userElement, otherElement);
    
    // Start with element-level templates as a base
    const baseStrengths = CONNECTION_STRENGTHS[elementPair] || CONNECTION_STRENGTHS['water-water'];
    const baseGrowthAreas = GROWTH_AREAS[elementPair] || GROWTH_AREAS['water-water'];
    
    // Enrich with real synastry aspects when available
    const connectionStrengths = synastryReport
      ? this.enrichConnectionsFromSynastry(baseStrengths, synastryReport)
      : baseStrengths;

    const growthAreas = synastryReport
      ? this.enrichGrowthFromSynastry(baseGrowthAreas, synastryReport)
      : baseGrowthAreas;
    
    const emotionalDynamics = synastryReport
      ? this.enrichEmotionalDynamicsFromSynastry(
          this.getEmotionalDynamics(userChart, otherChart),
          synastryReport
        )
      : this.getEmotionalDynamics(userChart, otherChart);

    const communicationDynamics = synastryReport
      ? this.enrichCommunicationFromSynastry(
          this.getCommunicationDynamics(userChart, otherChart),
          synastryReport
        )
      : this.getCommunicationDynamics(userChart, otherChart);

    const growthPotential = synastryReport?.overallDynamic
      ? `${synastryReport.overallDynamic} ${this.getGrowthPotential(elementPair)}`
      : this.getGrowthPotential(elementPair);

    return {
      person1Name: userChart.name || 'You',
      person2Name: otherChart.name || 'Them',
      relationshipType,
      connectionStrengths,
      growthAreas,
      person1Needs: this.getPersonNeeds(userChart),
      person2Needs: this.getPersonNeeds(otherChart),
      communicationDynamics,
      emotionalDynamics,
      growthPotential,
      reminder: this.getRelationshipReminder(),
    };
  }

  // ── Synastry enrichment helpers ──────────────────────────────

  /**
   * Augment element-level connection strengths with real cross-chart aspects
   * categorised as "connection" or "chemistry" by the synastry engine.
   */
  private static enrichConnectionsFromSynastry(
    base: ConnectionStrength[],
    report: SynastryReport
  ): ConnectionStrength[] {
    const synastryStrengths: ConnectionStrength[] = [
      ...report.connectionAspects.slice(0, 2).map((a) => ({
        title: a.title,
        description: a.description,
        icon: 'heart',
      })),
      ...report.chemistryAspects.slice(0, 1).map((a) => ({
        title: a.title,
        description: a.description,
        icon: 'flash',
      })),
    ];

    // Deduplicate: prefer synastry-derived items, then fill with base
    return synastryStrengths.length > 0
      ? [...synastryStrengths, ...base].slice(0, 4)
      : base;
  }

  /**
   * Augment element-level growth areas with real challenge / growth aspects.
   */
  private static enrichGrowthFromSynastry(
    base: GrowthArea[],
    report: SynastryReport
  ): GrowthArea[] {
    const synastryGrowth: GrowthArea[] = [
      ...report.challengeAspects.slice(0, 2).map((a) => ({
        title: a.title,
        description: a.description,
        healingQuestion: `How can you both work with the ${a.person1Planet.planet.name}–${a.person2Planet.planet.name} tension compassionately?`,
      })),
      ...report.growthAspects.slice(0, 1).map((a) => ({
        title: a.title,
        description: a.description,
        healingQuestion: `What does the ${a.person1Planet.planet.name}–${a.person2Planet.planet.name} connection teach you about each other?`,
      })),
    ];

    return synastryGrowth.length > 0
      ? [...synastryGrowth, ...base].slice(0, 4)
      : base;
  }

  /**
   * Layer synastry-derived emotional detail on top of the element-level base.
   */
  private static enrichEmotionalDynamicsFromSynastry(
    base: EmotionalDynamicInsight,
    report: SynastryReport
  ): EmotionalDynamicInsight {
    // Find Moon-related synastry aspects for emotional insight
    const moonAspects = report.aspects.filter(
      (a) =>
        a.person1Planet.planet.name === 'Moon' ||
        a.person2Planet.planet.name === 'Moon'
    );

    if (moonAspects.length === 0) return base;

    const primary = moonAspects[0];
    return {
      ...base,
      howYouNurtureEachOther: `${primary.description} ${base.howYouNurtureEachOther}`,
      healingPath: report.primaryChallenge
        ? `${report.primaryChallenge} ${base.healingPath}`
        : base.healingPath,
    };
  }

  /**
   * Layer synastry-derived communication detail (Mercury aspects) on top of element base.
   */
  private static enrichCommunicationFromSynastry(
    base: CommunicationInsight,
    report: SynastryReport
  ): CommunicationInsight {
    const mercuryAspects = report.aspects.filter(
      (a) =>
        a.person1Planet.planet.name === 'Mercury' ||
        a.person2Planet.planet.name === 'Mercury'
    );

    if (mercuryAspects.length === 0) return base;

    const primary = mercuryAspects[0];
    return {
      ...base,
      dynamicDescription: `${primary.description} ${base.dynamicDescription}`,
    };
  }
  
  /**
   * Get limited insight for free users
   */
  static getLimitedInsight(userChart: NatalChart, otherChart: NatalChart): {
    summary: string;
    teaser: string;
  } {
    const userElement = this.getElement(userChart.sunSign?.name || 'Aries');
    const otherElement = this.getElement(otherChart.sunSign?.name || 'Aries');
    
    return {
      summary: `You (${userElement} energy) and ${otherChart.name || 'they'} (${otherElement} energy) have a unique dynamic worth understanding deeply.`,
      teaser: 'Unlock Deeper Sky to explore your full connection: how you communicate, what you each need, where you grow together, and how to navigate challenges with compassion.',
    };
  }
  
  private static getPersonNeeds(chart: NatalChart): string[] {
    const moonElement = this.getElement(chart.moonSign?.name || 'Cancer');
    
    const needsMap: Record<string, string[]> = {
      fire: [
        'Freedom and space to be themselves',
        'Recognition and appreciation',
        'Adventure and spontaneity',
        'Direct, honest communication',
      ],
      earth: [
        'Stability and consistency',
        'Physical affection and presence',
        'Follow-through on commitments',
        'Practical demonstrations of love',
      ],
      air: [
        'Intellectual stimulation',
        'Communication and verbal affirmation',
        'Space to think and process',
        'Understanding their perspective',
      ],
      water: [
        'Emotional safety and attunement',
        'Deep, meaningful connection',
        'Patience with their feelings',
        'Non-judgmental presence',
      ],
    };
    
    return needsMap[moonElement] || needsMap.water;
  }
  
  private static getCommunicationDynamics(
    chart1: NatalChart,
    chart2: NatalChart
  ): CommunicationInsight {
    const element1 = this.getElement(chart1.sunSign?.name || 'Aries');
    const element2 = this.getElement(chart2.sunSign?.name || 'Aries');
    
    const styles: Record<string, string> = {
      fire: 'direct, passionate, and action-oriented',
      earth: 'practical, measured, and grounded',
      air: 'verbal, intellectual, and idea-focused',
      water: 'intuitive, emotional, and non-verbal',
    };
    
    return {
      person1Style: `Communicates in a way that's ${styles[element1]}`,
      person2Style: `Communicates in a way that's ${styles[element2]}`,
      dynamicDescription: `When ${element1} energy meets ${element2} energy in conversation, there's potential for both richness and misunderstanding. The key is curiosity over assumption.`,
      tipForPerson1: this.getTip(element1, element2),
      tipForPerson2: this.getTip(element2, element1),
    };
  }
  
  private static getTip(myElement: string, theirElement: string): string {
    if (myElement === 'fire' && theirElement === 'water') {
      return 'Slow down and create safety before sharing your passion. They need to feel before they can hear.';
    }
    if (myElement === 'earth' && theirElement === 'air') {
      return 'Try to engage with their ideas before asking "but how?" Let them dream before you ground.';
    }
    if (myElement === 'air' && theirElement === 'earth') {
      return 'Ground your ideas in specifics. They need concrete examples, not just concepts.';
    }
    if (myElement === 'water' && theirElement === 'fire') {
      return 'Express your feelings clearly. They may miss subtle cues and need directness.';
    }
    return 'Lead with curiosity about how they see the world. Different isn\'t wrong — it\'s information.';
  }
  
  private static getEmotionalDynamics(
    chart1: NatalChart,
    chart2: NatalChart
  ): EmotionalDynamicInsight {
    const moon1 = this.getElement(chart1.moonSign?.name || 'Cancer');
    const moon2 = this.getElement(chart2.moonSign?.name || 'Cancer');
    
    return {
      person1EmotionalNeeds: this.getMoonNeed(moon1),
      person2EmotionalNeeds: this.getMoonNeed(moon2),
      howYouNurtureEachOther: this.getNurturingDynamic(moon1, moon2),
      potentialTension: this.getTensionArea(moon1, moon2),
      healingPath: 'Understanding that you each feel and express emotions differently is the first step. Neither way is "right" — they\'re just different languages.',
    };
  }
  
  private static getMoonNeed(element: string): string {
    const needs: Record<string, string> = {
      fire: 'Needs space to express freely and be seen',
      earth: 'Needs consistency and tangible reassurance',
      air: 'Needs to talk things through and understand',
      water: 'Needs emotional safety and deep attunement',
    };
    return needs[element] || needs.water;
  }
  
  private static getNurturingDynamic(elem1: string, elem2: string): string {
    if (elem1 === elem2) {
      return 'You naturally understand each other\'s emotional language. This creates ease but watch for shared blind spots.';
    }
    return 'You nurture each other in different ways — which means you might miss each other\'s cues sometimes, but also offer what the other lacks.';
  }
  
  private static getTensionArea(elem1: string, elem2: string): string {
    if (elem1 === 'fire' && elem2 === 'water') {
      return 'Fire may feel Water is "too sensitive"; Water may feel Fire is "too intense." Both need validation.';
    }
    if (elem1 === 'earth' && elem2 === 'air') {
      return 'Earth may want to "fix" while Air wants to "discuss." Finding the balance is key.';
    }
    return 'Your different emotional styles can either complement or frustrate — intention matters.';
  }
  
  private static getGrowthPotential(elementPair: string): string {
    const potentials: Record<string, string> = {
      'fire-fire': 'Together you can accomplish remarkable things — if you learn to collaborate instead of compete. Your mutual passion is rocket fuel.',
      'fire-earth': 'You have the vision AND the follow-through between you. Fire dreams; Earth builds. A powerful creative partnership.',
      'fire-air': 'Ideas meet action. You inspire and stimulate each other constantly. Just remember to ground sometimes.',
      'fire-water': 'Passion meets depth. You can go places emotionally that neither could reach alone. Handle with care.',
      'earth-earth': 'You can build something lasting together. Your shared commitment to stability is your superpower.',
      'earth-air': 'Different but complementary. You balance each other in ways that make you both more whole.',
      'earth-water': 'Nurturing meets stability. A deeply caring connection that can last through anything.',
      'air-air': 'A meeting of minds. Your conversations are endless and your understanding of each other runs deep.',
      'air-water': 'Logic meets intuition. You teach each other different ways of knowing and being.',
      'water-water': 'Emotional depth upon depth. You can reach places together that feel almost telepathic.',
    };
    return potentials[elementPair] || 'Every relationship is an opportunity for growth and understanding.';
  }
  
  private static getRelationshipReminder(): string {
    const reminders = [
      'Your chart doesn\'t predict whether you\'ll "work" — it helps you understand how to work together.',
      'Understanding differences doesn\'t mean accepting everything. It means knowing what you\'re working with.',
      'The goal isn\'t compatibility — it\'s compassionate understanding.',
      'Every relationship is a mirror. What triggers you teaches you about yourself.',
      'Growth in relationship means growing yourself, not changing the other person.',
    ];
    const index = new Date().getDate() % reminders.length;
    return reminders[index];
  }
  
  private static getElement(sign: string): string {
    const fireSign = ['Aries', 'Leo', 'Sagittarius'].includes(sign);
    const earthSign = ['Taurus', 'Virgo', 'Capricorn'].includes(sign);
    const airSign = ['Gemini', 'Libra', 'Aquarius'].includes(sign);
    
    if (fireSign) return 'fire';
    if (earthSign) return 'earth';
    if (airSign) return 'air';
    return 'water';
  }
  
  private static getElementPair(elem1: string, elem2: string): string {
    // Normalize the pair (order alphabetically for consistent lookup)
    const sorted = [elem1, elem2].sort();
    return `${sorted[0]}-${sorted[1]}`;
  }
}
