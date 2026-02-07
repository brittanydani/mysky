/**
 * Human-First Relationship Guidance
 * 
 * Philosophy: Relationships aren't about compatibility percentages.
 * They're about understanding yourself AND the other person with compassion.
 * No judgment. No predictions. Just insight and gentle awareness.
 */

import { NatalChart } from './types';

export interface RelationshipReflection {
  title: string;
  message: string;
  affirmation: string;
}

export interface HumanRelationshipGuidance {
  howYouLove: RelationshipReflection;
  whatYouNeed: RelationshipReflection;
  howYouGrow: RelationshipReflection;
  blindSpots: RelationshipReflection;
  gentleReminder: string;
  partnerReflectionPrompt: string;
}

// How You Love - Based on Venus sign energy (element-based)
const HOW_YOU_LOVE: Record<string, RelationshipReflection> = {
  fire: {
    title: 'You love with your whole being',
    message: 'You bring passion, spontaneity, and warmth to your connections. You love through action — showing up, initiating, being present. You need a partner who can match your energy without trying to dim your flame.',
    affirmation: 'My enthusiasm in love is a gift, not too much.',
  },
  earth: {
    title: 'You love through presence and dedication',
    message: 'You show love in consistent, tangible ways — remembering the little things, building something real together, being there when it matters. You need a partner who values loyalty and understands that slow love is deep love.',
    affirmation: 'My steady devotion is a form of profound love.',
  },
  air: {
    title: 'You love through connection and curiosity',
    message: 'You show love through conversation, shared ideas, and mental stimulation. You need space to be yourself within partnership and a connection that feels like friendship first. Intellectual chemistry is not a luxury for you — it\'s essential.',
    affirmation: 'Needing mental connection does not make me emotionally unavailable.',
  },
  water: {
    title: 'You love with depth and devotion',
    message: 'You love through emotional attunement — sensing what others need, creating safety, merging souls. You need a partner who can hold space for your feelings without pulling away. Superficial connections will never satisfy you.',
    affirmation: 'My emotional depth is my superpower in relationships.',
  },
};

// What You Need - Based on Moon sign energy
const WHAT_YOU_NEED: Record<string, RelationshipReflection> = {
  fire: {
    title: 'You need freedom within connection',
    message: 'You need a partner who celebrates your independence rather than feeling threatened by it. You thrive when you have space to pursue your own interests while knowing you have someone to come home to. Feeling trapped is the fastest way to lose you.',
    affirmation: 'Needing space doesn\'t mean I\'m not committed.',
  },
  earth: {
    title: 'You need consistency and reassurance',
    message: 'You need to know where you stand. Mixed signals and emotional unavailability don\'t feel exciting to you — they feel unsafe. You thrive with partners who show up reliably and make their feelings clear.',
    affirmation: 'Needing security is not the same as being clingy.',
  },
  air: {
    title: 'You need understanding and communication',
    message: 'You process emotions through conversation. Silence feels like abandonment. You need a partner willing to talk things through, explain their feelings, and never assume you should "just know."',
    affirmation: 'Needing to talk things out is how I heal.',
  },
  water: {
    title: 'You need emotional safety above all',
    message: 'You need to feel truly seen before you can open up. You\'re highly attuned to energy shifts and can tell when something is "off." You need a partner who creates safety through presence, not just words.',
    affirmation: 'My sensitivity is wisdom, not weakness.',
  },
};

// How You Grow in Relationships - Based on Saturn/North Node themes
const HOW_YOU_GROW: Record<string, RelationshipReflection> = {
  assertion: {
    title: 'Learning to speak your needs clearly',
    message: 'Your growth edge is learning that your needs matter as much as your partner\'s. You may have a pattern of adapting to others at your own expense. Healthy relationships require you to take up space too.',
    affirmation: 'Expressing my needs is an act of love, not selfishness.',
  },
  boundaries: {
    title: 'Learning to protect your energy',
    message: 'You give deeply, sometimes too deeply. Your growth edge is learning that saying no is a form of self-love, and that healthy boundaries actually create closer connections.',
    affirmation: 'I can love fully AND protect my peace.',
  },
  vulnerability: {
    title: 'Learning to let people in',
    message: 'Independence comes naturally to you. Your growth edge is learning that letting someone support you isn\'t weakness — it\'s intimacy. True partnership means allowing yourself to need someone.',
    affirmation: 'Letting someone see my vulnerability is brave.',
  },
  trust: {
    title: 'Learning to release control',
    message: 'You may have learned early that people can\'t be relied upon. Your growth edge is learning to trust again — not blindly, but with open eyes and an open heart. Not everyone will hurt you.',
    affirmation: 'I can be discerning AND openhearted.',
  },
};

// Gentle Blind Spots - Based on shadow work
const BLIND_SPOTS: Record<string, RelationshipReflection> = {
  pleasing: {
    title: 'Watch for over-giving',
    message: 'In your desire to make relationships work, you may give more than you receive, say yes when you mean no, or suppress your truth to keep the peace. Notice when you\'re abandoning yourself for love.',
    affirmation: 'Authentic relationships allow me to be fully me.',
  },
  intensity: {
    title: 'Watch for all-or-nothing thinking',
    message: 'When you\'re in, you\'re ALL in. This passion is beautiful, but notice if you\'re creating drama to feel alive, or interpreting small issues as relationship-ending threats.',
    affirmation: 'I can feel deeply without spiraling.',
  },
  avoidance: {
    title: 'Watch for emotional distancing',
    message: 'When things get hard, you may intellectualize your feelings or create space to "figure things out." This can feel like abandonment to partners. Notice when you\'re pulling away from discomfort.',
    affirmation: 'I can stay present even when emotions feel messy.',
  },
  control: {
    title: 'Watch for the need to fix things',
    message: 'Your desire to solve problems is loving, but some things need to be felt, not fixed. Notice when you\'re steering conversations away from difficult emotions or trying to "help" when listening is what\'s needed.',
    affirmation: 'Sometimes the most loving response is presence.',
  },
};

// Gentle reminders for relationships
const GENTLE_REMINDERS = [
  'The right person won\'t make you feel like too much.',
  'Healthy love shouldn\'t require you to shrink.',
  'You can\'t pour from an empty cup — rest is not selfish.',
  'Conflict is not the opposite of love. Indifference is.',
  'You are allowed to outgrow relationships that no longer fit.',
  'How you speak to yourself becomes the voice you tolerate from others.',
  'Attachment is not the same as love. Notice the difference.',
  'You don\'t have to earn rest, attention, or affection.',
  'The love you crave is often the love you\'re not giving yourself.',
  'Boundaries are how you teach people to love you well.',
];

// Partner reflection prompts
const PARTNER_PROMPTS = [
  'What do you wish your partner truly understood about you?',
  'When do you feel most loved? Most unseen?',
  'What are you afraid to ask for in this relationship?',
  'What pattern do you keep recreating? Where did it start?',
  'If you could say one thing without fear of consequence, what would it be?',
  'What do you need more of right now? Less of?',
  'Where might you be projecting your past onto this person?',
  'What would it look like to love yourself the way you love others?',
];

export class RelationshipGuidanceGenerator {
  
  /**
   * Generate human-first relationship guidance based on natal chart
   */
  static generateGuidance(chart: NatalChart): HumanRelationshipGuidance {
    const sunSign = chart.sunSign?.name?.toLowerCase() || 'aries';
    const moonSign = chart.moonSign?.name?.toLowerCase() || 'cancer';
    
    // Determine elements
    const sunElement = this.getElement(sunSign);
    const moonElement = this.getElement(moonSign);
    
    // Determine growth theme based on first letter of sun sign (deterministic variation)
    const growthThemes = ['assertion', 'boundaries', 'vulnerability', 'trust'];
    const growthIndex = sunSign.charCodeAt(0) % growthThemes.length;
    const growthTheme = growthThemes[growthIndex];
    
    // Determine blind spot based on moon element
    const blindSpotMap: Record<string, string> = {
      fire: 'intensity',
      earth: 'control',
      air: 'avoidance',
      water: 'pleasing',
    };
    const blindSpot = blindSpotMap[moonElement];
    
    // Select daily reminder and prompt (date-seeded)
    const today = new Date();
    const daySeed = today.getDate() + today.getMonth();
    const reminderIndex = daySeed % GENTLE_REMINDERS.length;
    const promptIndex = (daySeed + 3) % PARTNER_PROMPTS.length;
    
    return {
      howYouLove: HOW_YOU_LOVE[sunElement],
      whatYouNeed: WHAT_YOU_NEED[moonElement],
      howYouGrow: HOW_YOU_GROW[growthTheme],
      blindSpots: BLIND_SPOTS[blindSpot],
      gentleReminder: GENTLE_REMINDERS[reminderIndex],
      partnerReflectionPrompt: PARTNER_PROMPTS[promptIndex],
    };
  }
  
  /**
   * Get the element for a zodiac sign
   */
  private static getElement(sign: string): string {
    const elements: Record<string, string[]> = {
      fire: ['aries', 'leo', 'sagittarius'],
      earth: ['taurus', 'virgo', 'capricorn'],
      air: ['gemini', 'libra', 'aquarius'],
      water: ['cancer', 'scorpio', 'pisces'],
    };
    
    for (const [element, signs] of Object.entries(elements)) {
      if (signs.includes(sign.toLowerCase())) {
        return element;
      }
    }
    
    return 'water'; // Default
  }
}
