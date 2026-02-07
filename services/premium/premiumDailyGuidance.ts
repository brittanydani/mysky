// File: services/premium/premiumDailyGuidance.ts
// Enhanced personalized daily guidance for Deeper Sky premium users
// Premium gets 3-6 lines per category instead of 1-2, plus transit explanations

import { NatalChart, SimpleAspect, AstrologySign } from '../astrology/types';
import { getTransitingLongitudes, computeTransitAspectsToNatal } from '../astrology/transits';
import { DailyGuidanceGenerator } from '../astrology/dailyGuidance';
import { toLocalDateString } from '../../utils/dateUtils';

// ============================================================================
// TYPES
// ============================================================================

export type GuidanceCategory = 'love' | 'energy' | 'work' | 'emotional';

export interface CategoryGuidance {
  category: GuidanceCategory;
  title: string;
  icon: string;
  guidance: string;           // 3-6 lines for premium
  keyInsight: string;         // One-liner highlight
  actionSuggestion: string;   // What to do with this energy
  transitContext?: string;    // Why this is happening (premium bonus)
}

export interface PremiumDailyGuidance {
  date: string;
  overallTheme: string;
  moonPhaseContext: string;
  categories: CategoryGuidance[];
  transitExplanation: string;  // "Here's what's happening in the sky..."
  personalizedAffirmation: string;
  eveningReflection: string;   // For end-of-day check-in
}

// ============================================================================
// ELEMENT-BASED CATEGORY GUIDANCE
// ============================================================================

interface ElementGuidance {
  love: string[];
  energy: string[];
  work: string[];
  emotional: string[];
}

const FIRE_SIGN_GUIDANCE: ElementGuidance = {
  love: [
    "Your warmth is magnetic today. Relationships thrive when you show up authentically—not performing, just being your full self.",
    "There's an invitation to be more direct about what you need from others. The right people will meet your honesty with appreciation.",
    "Notice if you're chasing validation versus genuine connection. Your fire doesn't need anyone else's spark to be bright.",
    "Small acts of devotion may feel more meaningful than grand gestures. Sometimes showing up quietly speaks louder than any words.",
  ],
  energy: [
    "Your energy wants to move today—both physically and creatively. Honor that impulse rather than forcing yourself to sit still.",
    "You may feel a surge of motivation. Channel it toward something that genuinely matters to you, not just what feels urgent.",
    "There's power in your enthusiasm, but pace yourself. Sustainable effort outlasts burnout every time.",
    "If restlessness arises, it's often a sign something inside you is ready to grow. Listen to what it's asking for.",
  ],
  work: [
    "Your natural leadership energy is heightened. Trust your instincts about projects and direction, but stay open to collaboration.",
    "This is a good day to start something new rather than perfect something old. Your momentum favors action over analysis.",
    "Creative risks feel more accessible now. That idea you've been sitting on? Consider taking the first small step.",
    "Watch for impatience with slower-moving colleagues or processes. Not everyone operates at your pace, and that's okay.",
  ],
  emotional: [
    "Emotions may run hot today—passion, frustration, excitement. All of it is information, not a problem to solve.",
    "Your intensity is a gift, not a liability. The trick is directing it rather than suppressing it.",
    "If anger surfaces, ask what boundary it's protecting. Healthy anger is a messenger, not a monster.",
    "You may need physical movement to process emotions today. Your body knows how to release what your mind can't figure out.",
  ],
};

const EARTH_SIGN_GUIDANCE: ElementGuidance = {
  love: [
    "Relationships feel steadier when you can relax into trust. Today invites you to show someone the parts of you that need care.",
    "Practical expressions of love—cooking a meal, helping with a task—may feel more natural than verbal affection. That's its own language.",
    "Notice if you're building walls to feel safe. True security in love comes from gradual vulnerability, not total self-protection.",
    "Your presence is a form of love. Simply being reliable and consistent matters more than you might realize.",
  ],
  energy: [
    "Your energy favors slow, steady progress today. Don't mistake sustainable effort for lack of passion—you're building something real.",
    "Your body may be asking for rest or nourishment. Pushing through isn't always strength; sometimes stopping is braver.",
    "Ground yourself through your senses—good food, comfortable textures, natural beauty. Your energy replenishes through physical pleasure.",
    "If you feel sluggish, it might be your body's wisdom protecting you from overcommitment. Listen to it.",
  ],
  work: [
    "Today favors concrete tasks over abstract brainstorming. Make the list, do the thing, check the box. Progress compounds.",
    "Your practical wisdom is an asset. Others may have flashier ideas, but you know how to actually make things work.",
    "Financial or material matters may need attention. Your attention to detail serves you well in building security.",
    "Resist the urge to over-prepare. Sometimes good enough and done beats perfect and stuck.",
  ],
  emotional: [
    "Your emotions may feel slower to surface, but they run deep. Give yourself time to know what you actually feel.",
    "Physical comfort significantly affects your emotional state. If you're feeling off, check the basics first.",
    "You might process emotions through doing—organizing, creating, fixing things. This is valid emotional work.",
    "Stability isn't emotional avoidance. You're allowed to feel steady, and that's not the same as feeling numb.",
  ],
};

const AIR_SIGN_GUIDANCE: ElementGuidance = {
  love: [
    "Connection through conversation feels especially nourishing today. Share ideas, not just logistics, with people you love.",
    "Your natural curiosity about others is a form of care. Asking genuine questions builds intimacy in unexpected ways.",
    "If you're processing relationship dynamics in your head, consider sharing some of those thoughts. Understanding grows through dialogue.",
    "Intellectual compatibility matters to you, and that's valid. You deserve someone who engages your mind as much as your heart.",
  ],
  energy: [
    "Mental stimulation is fuel for you today. Read something interesting, learn something new, have a real conversation.",
    "If you feel scattered, it might be too many inputs rather than too little. Consider what you can filter out.",
    "Your energy thrives on variety. Switching tasks or environments throughout the day may help more than forcing focus.",
    "Social connection—even brief exchanges—can be energizing rather than draining for you right now.",
  ],
  work: [
    "Your ability to see multiple perspectives is valuable today. Use it to solve problems others are too close to see clearly.",
    "Communication tasks flow easily. Writing, presenting, or facilitating conversations are good uses of your energy.",
    "Collaboration over solo work may be more productive. Your ideas get better when you think out loud with others.",
    "Watch for analysis paralysis. At some point, you have to stop gathering information and make a choice.",
  ],
  emotional: [
    "You may need to talk through your feelings to understand them. Processing out loud isn't weakness—it's how your system works.",
    "If emotions feel confusing, try writing them down. Naming what you feel can make it more manageable.",
    "Your tendency to intellectualize feelings is protective, but sometimes you need to just feel without explaining.",
    "Connection is part of your emotional hygiene. Isolation may look like self-care but can actually deplete you.",
  ],
};

const WATER_SIGN_GUIDANCE: ElementGuidance = {
  love: [
    "Your capacity for deep emotional connection is a gift, but it also requires boundaries. You can love someone without absorbing their pain.",
    "Intuition may guide you in relationships today. Trust what you sense, even if you can't explain it logically.",
    "Vulnerability creates intimacy, but only when met with care. Choose wisely who receives your tender parts.",
    "You may feel others' emotions as if they were your own. Remember: you can witness without carrying.",
  ],
  energy: [
    "Your energy is deeply connected to your emotional state. If you feel drained, check what feelings you might be holding.",
    "Creative or spiritual activities can be surprisingly energizing. Follow what calls to your soul, not just your schedule.",
    "You may need more solitude than usual to recharge. Protecting your alone time is an act of self-respect.",
    "Water and nature can help reset your energy. Even a shower or looking at the sky can shift something subtle.",
  ],
  work: [
    "Your emotional intelligence is a professional asset. Reading rooms, sensing dynamics, understanding unspoken needs—these matter.",
    "Creative work may flow more easily than analytical tasks. Follow the current of your attention rather than forcing focus.",
    "If work feels overwhelming, break it into smaller emotional bites. What's one thing you can do that won't deplete you?",
    "Your intuition about people and situations is worth trusting, even in professional contexts.",
  ],
  emotional: [
    "Your feelings are data, not drama. The intensity you experience carries wisdom about what matters to you.",
    "If emotions feel overwhelming, remember: you don't have to understand them to honor them. Feeling is enough.",
    "Tears, when they come, are release. You're not falling apart—you're letting something through that needed to move.",
    "Your emotional depth allows you to understand others in ways most people can't. This sensitivity is a form of strength.",
  ],
};

const ELEMENT_GUIDANCE: Record<string, ElementGuidance> = {
  Fire: FIRE_SIGN_GUIDANCE,
  Earth: EARTH_SIGN_GUIDANCE,
  Air: AIR_SIGN_GUIDANCE,
  Water: WATER_SIGN_GUIDANCE,
};

// ============================================================================
// TRANSIT CONTEXT CONTENT
// ============================================================================

const TRANSIT_CONTEXTS: Record<string, Record<string, string>> = {
  Moon: {
    conjunction: "The Moon is aligning with your natal Moon today, creating a monthly emotional reset. You may feel your needs and patterns more clearly.",
    square: "The Moon is creating tension with your natal Moon, which can bring conflicting needs to the surface. This friction is information.",
    opposition: "The Moon opposes your natal Moon, potentially highlighting the gap between what you need and what you're getting.",
    trine: "The Moon harmonizes with your natal Moon, creating emotional flow. This is supportive energy for self-care and processing.",
    sextile: "The Moon gently supports your natal Moon. Opportunities for emotional nourishment may arise naturally.",
  },
  Sun: {
    conjunction: "The Moon connects with your Sun, illuminating your core identity. You may feel more visible or self-aware today.",
    square: "Tension between the Moon and your Sun can create an inner tug-of-war between feelings and identity. Both are valid.",
    opposition: "The Moon opposes your Sun, which can highlight imbalances between inner needs and outer expression.",
    trine: "The Moon supports your Sun, making authentic expression feel easier. You can be yourself without effort.",
    sextile: "A gentle flow between Moon and Sun energy supports alignment between feelings and identity.",
  },
  Venus: {
    conjunction: "The Moon touches your Venus, softening the day with themes of comfort, beauty, and relationship harmony.",
    square: "Tension with your Venus might highlight desires versus reality in love, money, or pleasure.",
    opposition: "The Moon opposite Venus can bring relationship dynamics into focus. What you want versus what you have.",
    trine: "Harmonious flow to your Venus makes this a lovely day for connection, creativity, and self-indulgence.",
    sextile: "Gentle support to your Venus invites small pleasures and relationship sweetness.",
  },
  Mars: {
    conjunction: "The Moon activates your Mars, potentially intensifying drive, passion, or frustration. Channel the energy consciously.",
    square: "Friction with your Mars may bring impatience or conflict. The heat wants somewhere to go.",
    opposition: "Moon-Mars opposition can externalize inner tension. Notice where you might be projecting frustration.",
    trine: "Energy flows well between emotion and action. A good day to do something with your feelings.",
    sextile: "Gentle activation supports taking action on emotional matters without being reactive.",
  },
  Saturn: {
    conjunction: "The Moon meets your Saturn, bringing themes of responsibility, structure, and emotional maturity to the foreground.",
    square: "Saturn pressure can feel heavy or critical today. Be careful not to turn that sternness on yourself.",
    opposition: "Moon-Saturn opposition highlights the tension between emotional needs and responsibilities.",
    trine: "Saturn supports emotional discipline. Structure can feel comforting rather than constraining today.",
    sextile: "Gentle Saturnian energy helps you create healthy boundaries without harshness.",
  },
};

// ============================================================================
// AFFIRMATIONS BY ELEMENT
// ============================================================================

const ELEMENT_AFFIRMATIONS: Record<string, string[]> = {
  Fire: [
    "I trust my instincts and honor my spark.",
    "My passion is a gift, not a burden.",
    "I am allowed to take up space and shine.",
    "My courage creates possibilities.",
    "I don't need permission to be myself.",
  ],
  Earth: [
    "I am building something real, one step at a time.",
    "My steadiness is a form of strength.",
    "I deserve comfort and security.",
    "My body's wisdom guides me well.",
    "Slow progress is still progress.",
  ],
  Air: [
    "My thoughts are valuable and worth sharing.",
    "Connection nourishes me in ways I sometimes forget.",
    "I can hold multiple truths without resolving them today.",
    "My mind is a gift, not a prison.",
    "Curiosity is one of my superpowers.",
  ],
  Water: [
    "My feelings are messengers, not mistakes.",
    "I can feel deeply without drowning.",
    "My sensitivity allows me to understand what others miss.",
    "I am allowed to need what I need.",
    "My intuition is trustworthy.",
  ],
};

// ============================================================================
// MAIN GENERATOR CLASS
// ============================================================================

export class PremiumDailyGuidanceGenerator {
  /**
   * Generate enhanced premium daily guidance with all categories
   */
  static generatePremiumGuidance(
    natalChart: NatalChart,
    date: Date = new Date(),
    isPremium: boolean = true
  ): PremiumDailyGuidance {
    if (!isPremium) {
      return this.generateFreeGuidance(natalChart, date);
    }

    const houseSystem = natalChart.houseSystem ?? 'placidus';
    const transits = getTransitingLongitudes(
      date,
      natalChart.birthData.latitude,
      natalChart.birthData.longitude,
      houseSystem
    );

    const transitAspects: SimpleAspect[] = computeTransitAspectsToNatal(natalChart, transits);
    const sortedAspects = [...transitAspects].sort((a, b) => a.orb - b.orb);
    const strongestAspect = sortedAspects[0];

    // Determine element from Moon or Sun sign
    const primaryElement = natalChart.moonSign?.element || natalChart.sunSign?.element || 'Water';

    const categories = this.generateAllCategories(primaryElement, strongestAspect);
    const transitExplanation = this.generateTransitExplanation(strongestAspect, natalChart);
    const affirmation = this.selectAffirmation(primaryElement, date);
    const overallTheme = this.generateOverallTheme(primaryElement, strongestAspect);
    const moonPhaseContext = this.getMoonPhaseContext(date);
    const eveningReflection = this.generateEveningReflection(primaryElement);

    return {
      date: toLocalDateString(date),
      overallTheme,
      moonPhaseContext,
      categories,
      transitExplanation,
      personalizedAffirmation: affirmation,
      eveningReflection,
    };
  }

  /**
   * Generate limited free version (just one category, shorter text)
   */
  private static generateFreeGuidance(natalChart: NatalChart, date: Date): PremiumDailyGuidance {
    const primaryElement = natalChart.moonSign?.element || natalChart.sunSign?.element || 'Water';
    const elementGuidance = ELEMENT_GUIDANCE[primaryElement] || WATER_SIGN_GUIDANCE;

    // Free users get just emotional category with one line
    const emotionalGuidance: CategoryGuidance = {
      category: 'emotional',
      title: 'Emotional Weather',
      icon: '🌊',
      guidance: elementGuidance.emotional[0],
      keyInsight: 'Deeper Sky unlocks personalized guidance across all areas of life.',
      actionSuggestion: 'Upgrade to see your full daily guidance.',
    };

    return {
      date: toLocalDateString(date),
      overallTheme: `Today invites ${primaryElement.toLowerCase()} energy into your emotional world.`,
      moonPhaseContext: 'Upgrade to Deeper Sky to see how the moon phase affects you.',
      categories: [emotionalGuidance],
      transitExplanation: 'Upgrade to Deeper Sky to understand what\'s happening in the sky and why it matters for you.',
      personalizedAffirmation: 'Your feelings are valid.',
      eveningReflection: 'Upgrade to receive personalized evening reflections.',
    };
  }

  /**
   * Generate all four category guidances
   */
  private static generateAllCategories(
    primaryElement: string,
    strongestAspect?: SimpleAspect
  ): CategoryGuidance[] {
    const elementGuidance = ELEMENT_GUIDANCE[primaryElement] || WATER_SIGN_GUIDANCE;

    const categoryConfigs: Array<{ key: GuidanceCategory; title: string; icon: string }> = [
      { key: 'love', title: 'Love & Connection', icon: '💞' },
      { key: 'energy', title: 'Energy & Vitality', icon: '✨' },
      { key: 'work', title: 'Work & Purpose', icon: '🎯' },
      { key: 'emotional', title: 'Emotional Weather', icon: '🌊' },
    ];

    return categoryConfigs.map(config => {
      const lines = elementGuidance[config.key];
      // Select 3-4 lines randomly but consistently for the day
      const dayIndex = new Date().getDate() % lines.length;
      const selectedLines = [
        lines[dayIndex % lines.length],
        lines[(dayIndex + 1) % lines.length],
        lines[(dayIndex + 2) % lines.length],
      ].join('\n\n');

      return {
        category: config.key,
        title: config.title,
        icon: config.icon,
        guidance: selectedLines,
        keyInsight: this.getKeyInsight(config.key, primaryElement),
        actionSuggestion: this.getActionSuggestion(config.key, primaryElement),
        transitContext: strongestAspect 
          ? this.getTransitContext(config.key, strongestAspect)
          : undefined,
      };
    });
  }

  /**
   * Get key insight for a category
   */
  private static getKeyInsight(category: GuidanceCategory, element: string): string {
    const insights: Record<GuidanceCategory, Record<string, string>> = {
      love: {
        Fire: "Your warmth attracts; your honesty keeps.",
        Earth: "Consistency is your love language.",
        Air: "Mental connection deepens your bonds.",
        Water: "Your emotional depth is a gift to those who can receive it.",
      },
      energy: {
        Fire: "Movement is medicine for your spirit.",
        Earth: "Steady rhythms sustain your power.",
        Air: "Stimulation and rest need balance.",
        Water: "Your energy follows your emotional tides.",
      },
      work: {
        Fire: "Lead with inspiration, follow with action.",
        Earth: "You build things that last.",
        Air: "Ideas become real through your communication.",
        Water: "Your intuition is a professional asset.",
      },
      emotional: {
        Fire: "Feel it, don't fight it.",
        Earth: "Slow processing runs deep.",
        Air: "Name it to know it.",
        Water: "Sensitivity is strength, not weakness.",
      },
    };

    return insights[category][element] || insights[category]['Water'];
  }

  /**
   * Get action suggestion for a category
   */
  private static getActionSuggestion(category: GuidanceCategory, element: string): string {
    const actions: Record<GuidanceCategory, Record<string, string>> = {
      love: {
        Fire: "Tell someone what you appreciate about them today.",
        Earth: "Do one practical thing that shows you care.",
        Air: "Have a real conversation about something that matters.",
        Water: "Share a feeling you've been holding back.",
      },
      energy: {
        Fire: "Move your body in a way that feels exciting, not obligatory.",
        Earth: "Eat something nourishing and take one slow moment.",
        Air: "Learn one new thing or reach out to someone interesting.",
        Water: "Take 10 minutes for creative or spiritual replenishment.",
      },
      work: {
        Fire: "Start one thing you've been putting off.",
        Earth: "Complete one task that creates lasting value.",
        Air: "Share an idea or connect two people who should meet.",
        Water: "Trust your gut on one decision today.",
      },
      emotional: {
        Fire: "Express one feeling physically—dance, stretch, or move.",
        Earth: "Ground yourself through one sensory pleasure.",
        Air: "Write or speak your feelings for 5 minutes.",
        Water: "Allow one emotion without trying to fix it.",
      },
    };

    return actions[category][element] || actions[category]['Water'];
  }

  /**
   * Get transit context for a category
   */
  private static getTransitContext(category: GuidanceCategory, aspect: SimpleAspect): string {
    const planet = aspect.pointB;
    const aspectType = aspect.type;

    if (category === 'love' && (planet === 'Venus' || planet === 'Moon')) {
      return TRANSIT_CONTEXTS[planet]?.[aspectType] || '';
    }
    if (category === 'energy' && (planet === 'Mars' || planet === 'Sun')) {
      return TRANSIT_CONTEXTS[planet]?.[aspectType] || '';
    }
    if (category === 'work' && (planet === 'Saturn' || planet === 'Sun')) {
      return TRANSIT_CONTEXTS[planet]?.[aspectType] || '';
    }
    if (category === 'emotional' && (planet === 'Moon')) {
      return TRANSIT_CONTEXTS[planet]?.[aspectType] || '';
    }

    return '';
  }

  /**
   * Generate overall theme for the day
   */
  private static generateOverallTheme(element: string, aspect?: SimpleAspect): string {
    const elementThemes: Record<string, string> = {
      Fire: "Today carries the spark of creative possibility and authentic expression.",
      Earth: "Today supports building, grounding, and attending to what's real and lasting.",
      Air: "Today invites connection, learning, and the power of clear communication.",
      Water: "Today deepens your access to intuition, feeling, and emotional wisdom.",
    };

    let theme = elementThemes[element] || elementThemes['Water'];

    if (aspect) {
      if (aspect.type === 'square' || aspect.type === 'opposition') {
        theme += " Some tension may surface, but friction creates growth.";
      } else if (aspect.type === 'trine' || aspect.type === 'sextile') {
        theme += " The energy flows supportively—a good day to make progress.";
      }
    }

    return theme;
  }

  /**
   * Generate transit explanation
   */
  private static generateTransitExplanation(aspect: SimpleAspect | undefined, chart: NatalChart): string {
    if (!aspect) {
      return "Today's sky is relatively quiet in relation to your natal chart. This can be a time to consolidate, rest, or follow your own rhythm without external cosmic pressure.";
    }

    const planet = aspect.pointB;
    const aspectType = aspect.type;
    const context = TRANSIT_CONTEXTS[planet]?.[aspectType];

    if (context) {
      return context;
    }

    // Generic fallback
    return `The Moon is making a ${aspectType} aspect to your natal ${planet} today. This highlights ${planet.toLowerCase()}-related themes in your emotional life. Pay attention to what feels emphasized.`;
  }

  /**
   * Select affirmation based on element and date
   */
  private static selectAffirmation(element: string, date: Date): string {
    const affirmations = ELEMENT_AFFIRMATIONS[element] || ELEMENT_AFFIRMATIONS['Water'];
    const dayIndex = date.getDate() % affirmations.length;
    return affirmations[dayIndex];
  }

  /**
   * Get moon phase context
   */
  private static getMoonPhaseContext(date: Date): string {
    // Simple moon phase calculation (approximate)
    const synodicMonth = 29.53059;
    const knownNewMoon = new Date('2024-01-11'); // Known new moon
    const daysSinceNew = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const phaseDay = ((daysSinceNew % synodicMonth) + synodicMonth) % synodicMonth;

    if (phaseDay < 1.85) {
      return "🌑 New Moon energy supports new beginnings, setting intentions, and planting seeds. What do you want to grow?";
    } else if (phaseDay < 7.38) {
      return "🌒 Waxing Crescent energy supports taking first steps, building momentum, and nurturing what you've begun.";
    } else if (phaseDay < 9.23) {
      return "🌓 First Quarter energy brings a checkpoint. Adjust your course if needed and recommit to your intentions.";
    } else if (phaseDay < 14.77) {
      return "🌔 Waxing Gibbous energy supports refinement and preparation. You're building toward fullness.";
    } else if (phaseDay < 16.61) {
      return "🌕 Full Moon energy illuminates what's ready to be seen, celebrated, or released. Emotions may run high.";
    } else if (phaseDay < 22.15) {
      return "🌖 Waning Gibbous energy supports gratitude, sharing wisdom, and integrating what you've learned.";
    } else if (phaseDay < 23.99) {
      return "🌗 Last Quarter energy invites release and letting go. What's ready to be composted?";
    } else {
      return "🌘 Waning Crescent energy supports rest, surrender, and preparing for the next cycle. Be gentle with yourself.";
    }
  }

  /**
   * Generate evening reflection prompt
   */
  private static generateEveningReflection(element: string): string {
    const reflections: Record<string, string> = {
      Fire: "As this day closes: Where did you feel most alive? What spark are you carrying into tomorrow?",
      Earth: "As this day closes: What did you build or nurture? What gave you a sense of stability?",
      Air: "As this day closes: What did you learn or connect? What thought wants to rest now?",
      Water: "As this day closes: What did you feel? What emotion is ready to be released into sleep?",
    };

    return reflections[element] || reflections['Water'];
  }
}
