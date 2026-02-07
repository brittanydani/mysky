/**
 * Healing & Inner Work - Premium Feature
 * 
 * This is the most differentiated part of Deeper Sky.
 * Trauma-informed astrology interpretations that feel like therapy.
 * 
 * Features:
 * - Attachment style themes from chart
 * - Fear patterns and their origins
 * - Safety patterns and what helps
 * - Journaling prompts tied to chart
 * - Reparenting guidance
 * 
 * Example tone:
 * "You learned to stay alert instead of relaxed. 
 *  That made you strong — but tired."
 */

import { NatalChart } from '../astrology/types';

export interface AttachmentInsight {
  style: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
  headline: string;
  description: string;
  origins: string;
  inRelationships: string;
  healingPath: string;
  affirmation: string;
}

export interface FearPattern {
  coreFear: string;
  howItShows: string;
  whatItProtects: string;
  gentleReframe: string;
  journalPrompt: string;
}

export interface SafetyPattern {
  whatFeelsSafe: string;
  whatFeelsUnsafe: string;
  nervousSystemTendency: string;
  selfSoothingTools: string[];
  boundaryNeeds: string;
}

export interface ReparentingGuide {
  innerChildNeeds: string;
  whatWasMissing: string;
  howToProvideItNow: string;
  dailyPractice: string;
  affirmation: string;
}

export interface HealingInsights {
  attachment: AttachmentInsight;
  fears: FearPattern;
  safety: SafetyPattern;
  reparenting: ReparentingGuide;
  dailyJournalPrompt: string;
  weeklyReflection: string;
}

// Attachment insights based on Moon sign element
const ATTACHMENT_INSIGHTS: Record<string, AttachmentInsight> = {
  fire: {
    style: 'anxious',
    headline: 'You learned to stay alert instead of relaxed',
    description: 'Your nervous system learned that safety requires vigilance. You watch for signs of rejection or abandonment, often anticipating problems before they arrive. This made you strong — but tired.',
    origins: 'Fire Moon children often experienced inconsistent emotional availability. Sometimes you were celebrated; other times, ignored. You learned that love required performance, that you had to EARN attention.',
    inRelationships: 'You may seek reassurance frequently, interpret silence as rejection, or struggle with jealousy. When triggered, you might pursue harder rather than pull back — afraid that if you stop trying, you\'ll be forgotten.',
    healingPath: 'Learning that you don\'t have to earn love. Practicing self-soothing instead of seeking external validation. Understanding that your partner\'s mood isn\'t always about you.',
    affirmation: 'I am worthy of love without performance. I can be still and still be loved.',
  },
  earth: {
    style: 'avoidant',
    headline: 'You learned to need less than you actually need',
    description: 'Your nervous system learned that depending on others leads to disappointment. You became self-sufficient not out of strength, but survival. Independence became your shield.',
    origins: 'Earth Moon children often experienced emotional unavailability or had to grow up too fast. You learned that your needs were "too much" or that no one was coming to help. So you stopped asking.',
    inRelationships: 'You may pull away when things get too close, prioritize independence over intimacy, or feel smothered by normal relationship needs. Vulnerability feels like danger.',
    healingPath: 'Learning that interdependence is not weakness. Practicing receiving, not just giving. Understanding that letting someone in won\'t destroy your autonomy.',
    affirmation: 'I can need people AND be strong. Receiving is not weakness.',
  },
  air: {
    style: 'avoidant',
    headline: 'You learned to live in your head to escape your heart',
    description: 'Your nervous system learned that emotions are overwhelming and thinking is safe. Intellectualizing became your way of processing without feeling the full weight.',
    origins: 'Air Moon children often experienced emotional chaos or dismissal. Feelings were either too intense around you or completely ignored. You learned to "think" your way through instead of feel.',
    inRelationships: 'You may struggle with emotional intimacy, preferring mental connection. When feelings arise, you might analyze them rather than feel them. Deep emotional expression may feel foreign or unsafe.',
    healingPath: 'Learning to stay in your body when emotions arise. Practicing feeling without immediately analyzing. Understanding that thoughts and feelings are both valid — but different.',
    affirmation: 'I can feel without understanding. My emotions don\'t need to make sense to be valid.',
  },
  water: {
    style: 'anxious',
    headline: 'You learned to feel everything to anticipate everything',
    description: 'Your nervous system learned to scan constantly for emotional danger. You became hyper-attuned to others\' feelings as a survival mechanism — if you could sense the mood, you could protect yourself.',
    origins: 'Water Moon children often grew up in emotionally unpredictable environments. You learned to read energy before entering a room, to sense tension before it exploded. Hypervigilance became safety.',
    inRelationships: 'You may absorb your partner\'s emotions, struggle to distinguish your feelings from theirs, or lose yourself in relationships. Conflict may feel catastrophic.',
    healingPath: 'Learning to create emotional boundaries. Practicing "returning" emotions that aren\'t yours. Understanding that you can care without absorbing.',
    affirmation: 'I can feel others without becoming them. My sensitivity is a gift I can regulate.',
  },
};

// Fear patterns based on Saturn placement themes
const FEAR_PATTERNS: Record<string, FearPattern> = {
  fire: {
    coreFear: 'Being ordinary. Being forgettable. Not mattering.',
    howItShows: 'Overworking to prove yourself, seeking constant validation, difficulty resting, competitive energy even in non-competitive situations.',
    whatItProtects: 'This fear protects you from the pain of being overlooked. If you\'re always striving, achieving, shining — no one can dismiss you.',
    gentleReframe: 'You matter even when you\'re resting. Your presence is enough without your performance. The people who truly love you see you when you\'re dim too.',
    journalPrompt: 'What would you do if you knew you would never be "special"? What would still feel worth doing?',
  },
  earth: {
    coreFear: 'Instability. Losing everything. Not having enough.',
    howItShows: 'Overplanning, hoarding, difficulty delegating, anxiety about money or resources even when secure, difficulty trusting others with important things.',
    whatItProtects: 'This fear protects you from the chaos of the unexpected. If you can control and prepare for everything, nothing can hurt you.',
    gentleReframe: 'True security comes from within, not from external circumstances. You have survived loss before. You are more resilient than your fear knows.',
    journalPrompt: 'What would you do if you knew you would always have "enough"? What would change?',
  },
  air: {
    coreFear: 'Being misunderstood. Being alone with your thoughts. Not being heard.',
    howItShows: 'Over-explaining, seeking intellectual validation, difficulty with silence, anxiety when conversations feel shallow or disconnected.',
    whatItProtects: 'This fear protects you from the isolation of being fundamentally different. If you can explain yourself perfectly, you\'ll finally be understood.',
    gentleReframe: 'Some people will understand you without explanation. Some never will, no matter how clearly you speak. Understanding yourself is the real goal.',
    journalPrompt: 'What would you do if you knew some people would never truly "get" you? What would still feel okay?',
  },
  water: {
    coreFear: 'Abandonment. Being too much. Losing connection.',
    howItShows: 'People-pleasing, difficulty with boundaries, anticipating rejection, over-adapting to others, difficulty leaving relationships even when unhealthy.',
    whatItProtects: 'This fear protects you from the unbearable pain of being left. If you can anticipate and prevent abandonment, you\'ll never feel that loss.',
    gentleReframe: 'Some people will leave no matter what you do. Others will stay no matter what you do. Your behavior doesn\'t control their choice — and that\'s freeing.',
    journalPrompt: 'What would you do differently if you knew people wouldn\'t leave when you were "too much"?',
  },
};

// Safety patterns based on Moon element
const SAFETY_PATTERNS: Record<string, SafetyPattern> = {
  fire: {
    whatFeelsSafe: 'Movement, action, freedom to respond authentically, space to express yourself without judgment, environments that match your energy.',
    whatFeelsUnsafe: 'Feeling trapped, controlled, silenced, or forced to wait. Environments where you have to suppress your natural intensity.',
    nervousSystemTendency: 'Fight or flight. When stressed, you either attack or escape. You may not recognize you\'re overwhelmed until you\'ve already reacted.',
    selfSoothingTools: [
      'Physical movement (running, dancing, hitting pillows)',
      'Venting to someone who can handle your fire',
      'Short bursts of intense activity followed by rest',
      'Creative expression that lets energy OUT',
    ],
    boundaryNeeds: 'You need space to be intense without being shamed. But you also need people who can gently tell you when your fire is burning them — without making you wrong.',
  },
  earth: {
    whatFeelsSafe: 'Routine, predictability, physical comfort, tangible security, knowing what to expect, having control over your environment.',
    whatFeelsUnsafe: 'Chaos, sudden change, unpredictability, loss of control, environments where you can\'t plan or prepare.',
    nervousSystemTendency: 'Freeze or fawn. When stressed, you may shut down, go numb, or over-accommodate to keep the peace.',
    selfSoothingTools: [
      'Physical grounding (feet on floor, weighted blanket)',
      'Sensory comfort (warm bath, good food, soft textures)',
      'Making lists or plans to restore sense of control',
      'Time in nature, touching trees, gardening',
    ],
    boundaryNeeds: 'You need stability and reliability from the people in your life. But you also need to learn that some uncertainty is survivable — and even growthful.',
  },
  air: {
    whatFeelsSafe: 'Understanding, communication, having information, space to process mentally, environments where you can talk things through.',
    whatFeelsUnsafe: 'Emotional intensity without explanation, silence when you need to talk, situations that don\'t make logical sense.',
    nervousSystemTendency: 'Intellectualize or detach. When stressed, you go into your head, analyze, or disconnect from feelings entirely.',
    selfSoothingTools: [
      'Journaling to process thoughts',
      'Talking things through with a safe person',
      'Learning about what you\'re going through',
      'Creating mental frameworks to understand experiences',
    ],
    boundaryNeeds: 'You need people who can communicate clearly and won\'t leave you guessing. But you also need to learn that not everything can be understood — some things just need to be felt.',
  },
  water: {
    whatFeelsSafe: 'Emotional attunement, feeling "felt," permission to have feelings, environments where sensitivity is honored, deep connection.',
    whatFeelsUnsafe: 'Dismissal, emotional unavailability, having to suppress feelings, environments that feel "too much" energetically.',
    nervousSystemTendency: 'Overwhelm or merge. When stressed, you either flood with emotion or lose yourself in others\' feelings.',
    selfSoothingTools: [
      'Crying as release (not to be fixed)',
      'Water — baths, swimming, even washing dishes',
      'Creative expression that channels emotion',
      'Time alone to return to yourself',
    ],
    boundaryNeeds: 'You need emotional safety and people who can handle depth. But you also need to learn that others\' emotions aren\'t yours to carry — you can care without absorbing.',
  },
};

// Reparenting guides based on chart themes
const REPARENTING_GUIDES: Record<string, ReparentingGuide> = {
  fire: {
    innerChildNeeds: 'To be seen, celebrated, and allowed to shine without conditions.',
    whatWasMissing: 'Consistent, unconditional positive attention. Your light may have been encouraged sometimes but dimmed at others, creating confusion about when it was "safe" to shine.',
    howToProvideItNow: 'Celebrate your wins out loud — even to yourself. Don\'t wait for external validation to acknowledge your fire. Create rituals of self-recognition.',
    dailyPractice: 'Each morning, tell yourself: "I see you. You don\'t have to perform today to be worthy." Each evening, name one thing you did well.',
    affirmation: 'I am allowed to be proud of myself. My inner child is seen and celebrated — by me.',
  },
  earth: {
    innerChildNeeds: 'Stability, reliability, and the sense that someone would always be there.',
    whatWasMissing: 'Consistent emotional or physical presence. You may have had to grow up too fast, be too responsible, or learn that counting on others leads to disappointment.',
    howToProvideItNow: 'Create routines that feel like home. Follow through on promises to yourself. Build the stability externally that you didn\'t receive internally.',
    dailyPractice: 'Each morning, tell yourself: "I\'ve got you. You can count on me today." Each evening, acknowledge where you showed up for yourself.',
    affirmation: 'I am reliable for myself now. My inner child can finally rest.',
  },
  air: {
    innerChildNeeds: 'To be heard, understood, and taken seriously.',
    whatWasMissing: 'Someone who listened without dismissing your thoughts, who engaged with your ideas, who didn\'t make you feel "too much in your head."',
    howToProvideItNow: 'Journal your thoughts without judgment. Engage with your own ideas seriously. Find spaces where your mind is valued, not pathologized.',
    dailyPractice: 'Each morning, tell yourself: "Your thoughts are valid. I\'m listening." Each evening, write down one insight you had and treat it as valuable.',
    affirmation: 'I hear my own thoughts with respect. My inner child\'s mind is a gift.',
  },
  water: {
    innerChildNeeds: 'To be held emotionally, to feel safe expressing feelings, to not be "too much."',
    whatWasMissing: 'Consistent emotional attunement. Someone who could hold space for your feelings without being overwhelmed by them or making them wrong.',
    howToProvideItNow: 'Allow yourself to feel without fixing. Create safe spaces for emotional expression. Speak to yourself the way you wish someone had spoken to you.',
    dailyPractice: 'Each morning, tell yourself: "Whatever you feel today is okay. I can hold it." Each evening, acknowledge one emotion without trying to change it.',
    affirmation: 'My feelings are welcome here. My inner child\'s depths are not too much for me.',
  },
};

// Daily journal prompts for healing work
const HEALING_JOURNAL_PROMPTS = [
  'What are you carrying today that isn\'t yours to carry?',
  'When did you first learn that your needs were "too much"?',
  'What would you tell your younger self about what they\'re going through?',
  'What boundary do you need to set that you\'ve been avoiding?',
  'What emotion are you afraid to feel? What would happen if you let yourself feel it?',
  'Who do you need to forgive — including yourself?',
  'What pattern are you tired of repeating? What does it protect you from?',
  'What would it feel like to be completely accepted as you are?',
  'What do you need to hear right now that no one is saying?',
  'What are you grieving that you haven\'t acknowledged?',
  'What would your life look like if fear wasn\'t making your decisions?',
  'What younger version of you needs attention today?',
  'What would you do differently if you truly believed you deserved good things?',
  'What relationship are you staying in out of fear rather than love?',
  'What do you know in your body that your mind is denying?',
];

// Weekly reflection themes
const WEEKLY_REFLECTIONS = [
  'This week, notice when you\'re protecting instead of connecting.',
  'This week, pay attention to what triggers your protective patterns.',
  'This week, practice one act of radical self-acceptance daily.',
  'This week, notice whose emotions you\'re carrying that aren\'t yours.',
  'This week, experiment with asking for what you need.',
  'This week, observe when you\'re in your head vs. your heart.',
  'This week, practice staying present when discomfort arises.',
];

export class HealingInsightsGenerator {
  /**
   * Generate complete healing insights for premium users
   */
  static generateHealingInsights(chart: NatalChart): HealingInsights {
    const moonElement = this.getElement(chart.moonSign?.name || 'Cancer');
    const sunElement = this.getElement(chart.sunSign?.name || 'Aries');
    
    // Use date to vary daily/weekly content
    const today = new Date();
    const dayIndex = today.getDate() % HEALING_JOURNAL_PROMPTS.length;
    const weekIndex = Math.floor(today.getDate() / 7) % WEEKLY_REFLECTIONS.length;
    
    return {
      attachment: ATTACHMENT_INSIGHTS[moonElement] || ATTACHMENT_INSIGHTS.water,
      fears: FEAR_PATTERNS[sunElement] || FEAR_PATTERNS.water,
      safety: SAFETY_PATTERNS[moonElement] || SAFETY_PATTERNS.water,
      reparenting: REPARENTING_GUIDES[moonElement] || REPARENTING_GUIDES.water,
      dailyJournalPrompt: HEALING_JOURNAL_PROMPTS[dayIndex],
      weeklyReflection: WEEKLY_REFLECTIONS[weekIndex],
    };
  }
  
  /**
   * Get a specific healing prompt for today
   */
  static getDailyHealingPrompt(): string {
    const today = new Date();
    const index = today.getDate() % HEALING_JOURNAL_PROMPTS.length;
    return HEALING_JOURNAL_PROMPTS[index];
  }
  
  /**
   * Get the current week\'s reflection focus
   */
  static getWeeklyFocus(): string {
    const today = new Date();
    const weekIndex = Math.floor(today.getDate() / 7) % WEEKLY_REFLECTIONS.length;
    return WEEKLY_REFLECTIONS[weekIndex];
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
}
