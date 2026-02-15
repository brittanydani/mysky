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
   * Generate complete healing insights for premium users.
   * Uses Moon sign for attachment/safety/reparenting, Sun sign for fears,
   * and adds sign-specific nuance on top of element-level foundations.
   */
  static generateHealingInsights(chart: NatalChart): HealingInsights {
    const moonSign = chart.moonSign?.name || 'Cancer';
    const sunSign = chart.sunSign?.name || 'Aries';
    const moonElement = this.getElement(moonSign);
    const sunElement = this.getElement(sunSign);
    
    // Use date to vary daily/weekly content
    const today = new Date();
    const dayIndex = today.getDate() % HEALING_JOURNAL_PROMPTS.length;
    const weekIndex = Math.floor(today.getDate() / 7) % WEEKLY_REFLECTIONS.length;
    
    // Start from element-level then enrich with sign-specific detail
    const attachment = this.enrichAttachment(ATTACHMENT_INSIGHTS[moonElement] || ATTACHMENT_INSIGHTS.water, moonSign);
    const fears = this.enrichFears(FEAR_PATTERNS[sunElement] || FEAR_PATTERNS.water, sunSign);
    const safety = this.enrichSafety(SAFETY_PATTERNS[moonElement] || SAFETY_PATTERNS.water, moonSign);
    const reparenting = this.enrichReparenting(REPARENTING_GUIDES[moonElement] || REPARENTING_GUIDES.water, moonSign);
    
    return {
      attachment,
      fears,
      safety,
      reparenting,
      dailyJournalPrompt: HEALING_JOURNAL_PROMPTS[dayIndex],
      weeklyReflection: WEEKLY_REFLECTIONS[weekIndex],
    };
  }
  
  /**
   * Enrich attachment insight with sign-specific nuance.
   */
  private static enrichAttachment(base: AttachmentInsight, moonSign: string): AttachmentInsight {
    const signNuance = SIGN_ATTACHMENT_NUANCE[moonSign];
    if (!signNuance) return base;
    return {
      ...base,
      headline: signNuance.headline || base.headline,
      description: `${base.description}\n\n${signNuance.addendum}`,
      affirmation: signNuance.affirmation || base.affirmation,
    };
  }
  
  /**
   * Enrich fear pattern with sign-specific nuance.
   */
  private static enrichFears(base: FearPattern, sunSign: string): FearPattern {
    const signNuance = SIGN_FEAR_NUANCE[sunSign];
    if (!signNuance) return base;
    return {
      ...base,
      coreFear: signNuance.coreFear || base.coreFear,
      journalPrompt: signNuance.journalPrompt || base.journalPrompt,
    };
  }

  /**
   * Enrich safety pattern with sign-specific nuance.
   */
  private static enrichSafety(base: SafetyPattern, moonSign: string): SafetyPattern {
    const signNuance = SIGN_SAFETY_NUANCE[moonSign];
    if (!signNuance) return base;
    return {
      ...base,
      whatFeelsSafe: signNuance.whatFeelsSafe || base.whatFeelsSafe,
      selfSoothingTools: signNuance.selfSoothingTools || base.selfSoothingTools,
    };
  }

  /**
   * Enrich reparenting guide with sign-specific nuance.
   */
  private static enrichReparenting(base: ReparentingGuide, moonSign: string): ReparentingGuide {
    const signNuance = SIGN_REPARENTING_NUANCE[moonSign];
    if (!signNuance) return base;
    return {
      ...base,
      innerChildNeeds: signNuance.innerChildNeeds || base.innerChildNeeds,
      dailyPractice: signNuance.dailyPractice || base.dailyPractice,
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
   * Get the current week's reflection focus
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

// ─────────────────────────────────────────────────────────────────────────────
// Sign-specific nuances (12 signs × 4 categories)
// These layer onto the element-level foundations for richer, more personal output
// ─────────────────────────────────────────────────────────────────────────────

const SIGN_ATTACHMENT_NUANCE: Record<string, { headline?: string; addendum: string; affirmation?: string }> = {
  Aries: {
    headline: 'You learned to stay alert instead of relaxed',
    addendum: 'With Moon in Aries, your attachment pattern carries an urgency — a need to be first, to be chosen immediately. Waiting for reassurance feels like rejection. You learned early that hesitation meant being left behind.',
    affirmation: 'I don\'t have to rush toward love. I am chosen even when I am still.',
  },
  Taurus: {
    headline: 'You learned to need less than you actually need',
    addendum: 'With Moon in Taurus, your attachment style anchors in the physical — you need touch, consistency, routine proof that love is real. When comfort is disrupted, it feels like the ground itself is shifting.',
    affirmation: 'I deserve comfort without earning it. My need for stability is wisdom, not weakness.',
  },
  Gemini: {
    headline: 'You learned to live in your head to escape your heart',
    addendum: 'With Moon in Gemini, your attachment uses words as bridges — and sometimes as shields. You may talk about feelings without actually feeling them, or need constant communication to feel secure.',
    affirmation: 'Silence does not mean abandonment. I can be still and still be connected.',
  },
  Cancer: {
    headline: 'You learned to feel everything to anticipate everything',
    addendum: 'With Moon in Cancer, your attachment runs deep as blood. Home, family, and belonging are not preferences — they are survival needs. Rejection doesn\'t just hurt, it threatens your foundation.',
    affirmation: 'I can create the home I needed inside myself. I am my own safe harbor.',
  },
  Leo: {
    headline: 'You learned to perform for love instead of simply receiving it',
    addendum: 'With Moon in Leo, your attachment pattern centers around visibility. You need to be seen, acknowledged, and appreciated to feel safe. Indifference wounds you more than criticism.',
    affirmation: 'I am lovable in my ordinary moments, not just my performances.',
  },
  Virgo: {
    headline: 'You learned that being useful was the only way to be loved',
    addendum: 'With Moon in Virgo, your attachment pattern manifests as service — you prove love by fixing, helping, perfecting. Rest feels selfish. Being imperfect feels dangerous.',
    affirmation: 'I am worthy of love even when I have nothing to offer. My presence alone is enough.',
  },
  Libra: {
    headline: 'You learned to disappear inside other people\'s needs',
    addendum: 'With Moon in Libra, your attachment pattern revolves around harmony. Conflict feels like abandonment. You may abandon yourself to keep the peace — becoming what others need at the expense of what you need.',
    affirmation: 'I can disagree and still be loved. My needs are not a burden.',
  },
  Scorpio: {
    headline: 'You learned that trust is a risk you can\'t afford',
    addendum: 'With Moon in Scorpio, your attachment runs beneath the surface — intense, all-or-nothing, and terrified of betrayal. You test people before letting them close, because being vulnerable without certainty feels like free-falling.',
    affirmation: 'I can open without guarantees. Not everyone will use my vulnerability against me.',
  },
  Sagittarius: {
    headline: 'You learned that closeness means captivity',
    addendum: 'With Moon in Sagittarius, your attachment pattern equates freedom with safety. Getting too close feels like losing yourself. You may use humor, travel, or philosophy to maintain emotional distance.',
    affirmation: 'Intimacy doesn\'t have to be a cage. I can be free and connected.',
  },
  Capricorn: {
    headline: 'You learned to carry everything alone',
    addendum: 'With Moon in Capricorn, your attachment pattern masks need as strength. You were the responsible one. Asking for help feels like admitting defeat. Emotional vulnerability feels unprofessional, even in love.',
    affirmation: 'Needing support is human, not weak. I can let someone else carry something for once.',
  },
  Aquarius: {
    headline: 'You learned that being different meant being alone',
    addendum: 'With Moon in Aquarius, your attachment pattern keeps one foot out the door — not from disinterest, but from self-protection. If you never fully merge, you can\'t fully lose. Your intellect shields your heart.',
    affirmation: 'I can belong without losing my identity. My uniqueness is lovable, not isolating.',
  },
  Pisces: {
    headline: 'You learned to absorb others\' pain to earn your place',
    addendum: 'With Moon in Pisces, your attachment pattern dissolves boundaries. You feel others so deeply that you lose track of where they end and you begin. Love can feel like drowning in someone else\'s ocean.',
    affirmation: 'I can love deeply without losing myself. My empathy needs boundaries to survive.',
  },
};

const SIGN_FEAR_NUANCE: Record<string, { coreFear?: string; journalPrompt?: string }> = {
  Aries: { coreFear: 'Being irrelevant. Losing your edge. Being forgotten.', journalPrompt: 'What would you do if you couldn\'t compete? What would remain?' },
  Taurus: { coreFear: 'Losing what you\'ve built. Having the ground shift beneath you.', journalPrompt: 'What would remain if everything external was stripped away?' },
  Gemini: { coreFear: 'Being pinned down. Running out of ideas. Being boring.', journalPrompt: 'What would happen if you stopped being interesting? Who would stay?' },
  Cancer: { coreFear: 'Being abandoned. Having no one who truly knows you.', journalPrompt: 'What would you do if you knew you\'d always be held? What would you stop bracing for?' },
  Leo: { coreFear: 'Being ordinary. Being unseen. Not mattering.', journalPrompt: 'What would you do if no one were watching? What would still feel worth doing?' },
  Virgo: { coreFear: 'Being flawed beyond repair. Making a mistake that can\'t be fixed.', journalPrompt: 'What if the flaw you\'re trying to fix is actually the most human thing about you?' },
  Libra: { coreFear: 'Being alone. Being judged. Creating conflict.', journalPrompt: 'What truth are you withholding to keep the peace? What is it costing you?' },
  Scorpio: { coreFear: 'Being betrayed. Being powerless. Having your trust weaponized.', journalPrompt: 'What would change if you trusted that not everyone is hiding something?' },
  Sagittarius: { coreFear: 'Being trapped. Losing meaning. Having nothing to believe in.', journalPrompt: 'What would you believe in if every ideology failed you? What remains?' },
  Capricorn: { coreFear: 'Failure. Wasted effort. Never being enough despite how hard you try.', journalPrompt: 'What if "enough" isn\'t a destination? What if you\'re already there?' },
  Aquarius: { coreFear: 'Conformity. Being erased. Losing your sense of self in the collective.', journalPrompt: 'What would happen if you belonged somewhere without losing your edge?' },
  Pisces: { coreFear: 'Losing connection. Being shut out from the emotional world. Spiritual emptiness.', journalPrompt: 'What would you do if you could feel everything without drowning in it?' },
};

const SIGN_SAFETY_NUANCE: Record<string, { whatFeelsSafe?: string; selfSoothingTools?: string[] }> = {
  Aries: { whatFeelsSafe: 'Autonomy, movement, direct communication, and environments where you can act immediately without permission.', selfSoothingTools: ['Intense physical exercise', 'Punching a pillow or vigorous stretching', 'Making a quick decision you\'ve been putting off', 'Solo adventure — walk with no destination'] },
  Taurus: { whatFeelsSafe: 'Familiar environments, physical comfort, reliable people, and unhurried routines.', selfSoothingTools: ['Warm bath with essential oils', 'Comfort food prepared with care', 'Soft textures — weighted blankets, cashmere', 'Slow walk in a garden or park'] },
  Gemini: { whatFeelsSafe: 'Conversation, having information, variety, and the freedom to change your mind.', selfSoothingTools: ['Voice-note journaling — talk it through', 'Reading something completely unrelated to your stress', 'Texting a friend who gets it', 'Making a list to externalize the mental noise'] },
  Cancer: { whatFeelsSafe: 'Home, family, emotional attunement, and knowing you have a soft place to land.', selfSoothingTools: ['Cooking something nostalgic', 'Holding something comforting (blanket, mug, pet)', 'Looking at old photos that remind you of love', 'A good, unashamed cry'] },
  Leo: { whatFeelsSafe: 'Being appreciated, creative outlets, joyful environments, and being genuinely seen.', selfSoothingTools: ['Creating something — anything — that expresses how you feel', 'Dressing up just for yourself', 'Playing your favorite music loudly', 'Calling someone who truly celebrates you'] },
  Virgo: { whatFeelsSafe: 'Order, usefulness, clear expectations, and knowing exactly what\'s expected.', selfSoothingTools: ['Cleaning or organizing one small space', 'Making a detailed plan for tomorrow', 'Herbal tea with a specific health benefit', 'Journaling a precise account of what happened and why'] },
  Libra: { whatFeelsSafe: 'Harmony, beauty, partnership, and environments without conflict.', selfSoothingTools: ['Rearranging something to make it more beautiful', 'Listening to music that matches your exact mood', 'One gentle conversation with someone who cares', 'Art — looking at it or making it'] },
  Scorpio: { whatFeelsSafe: 'Control, truth, emotional honesty, and knowing that nothing is being hidden from you.', selfSoothingTools: ['Journaling the raw, uncensored truth', 'A long shower — let water carry the intensity', 'Research the thing you\'re feeling (name it to tame it)', 'Solitude with no obligation to perform okay-ness'] },
  Sagittarius: { whatFeelsSafe: 'Freedom, meaning, humor, and the sense that there\'s always more to explore.', selfSoothingTools: ['Planning a future trip or experience', 'Reading philosophy or listening to a thought-provoking podcast', 'Going somewhere you\'ve never been, even a new café', 'Laughing — even at yourself — to discharge tension'] },
  Capricorn: { whatFeelsSafe: 'Structure, competence, respect, and knowing that your efforts aren\'t wasted.', selfSoothingTools: ['Completing one small, tangible task', 'Writing down your accomplishments from this week', 'A disciplined physical practice (running, weights)', 'Giving yourself explicit permission to rest without guilt'] },
  Aquarius: { whatFeelsSafe: 'Independence, intellectual stimulation, authenticity, and non-judgmental community.', selfSoothingTools: ['Working on a passion project with no deadline', 'Connecting with a like-minded community online', 'Reframing your experience through a wider perspective', 'Doing something deliberately unconventional'] },
  Pisces: { whatFeelsSafe: 'Emotional attunement, creative flow, spiritual connection, and permission to feel without explanation.', selfSoothingTools: ['Listening to music that makes you feel understood', 'A long bath with candles and no time limit', 'Creative expression — painting, writing, movement', 'Meditation or prayer — connecting to something larger'] },
};

const SIGN_REPARENTING_NUANCE: Record<string, { innerChildNeeds?: string; dailyPractice?: string }> = {
  Aries: { innerChildNeeds: 'To be told "your courage matters" and "you don\'t have to fight for your place here."', dailyPractice: 'Each morning: "I don\'t have to prove myself today." Each evening: name one brave thing you did.' },
  Taurus: { innerChildNeeds: 'To be told "I\'m not going anywhere" and "you can have what you want without apologizing."', dailyPractice: 'Each morning: "I deserve comfort today." Each evening: notice one thing your body enjoyed.' },
  Gemini: { innerChildNeeds: 'To be told "your thoughts matter" and "you don\'t have to be interesting to be loved."', dailyPractice: 'Each morning: "My mind is a gift, not a burden." Each evening: write one thought without editing it.' },
  Cancer: { innerChildNeeds: 'To be told "I\'ll always come back" and "your feelings make sense."', dailyPractice: 'Each morning: "I am safe today. I am held." Each evening: honor one feeling without trying to fix it.' },
  Leo: { innerChildNeeds: 'To be told "you\'re special even when you\'re ordinary" and "I see you even now."', dailyPractice: 'Each morning: "I don\'t need applause today." Each evening: celebrate one quiet win no one else saw.' },
  Virgo: { innerChildNeeds: 'To be told "you are enough as you are" and "mistakes don\'t erase your worth."', dailyPractice: 'Each morning: "I don\'t have to be perfect today." Each evening: name one imperfection and accept it with kindness.' },
  Libra: { innerChildNeeds: 'To be told "your needs matter too" and "conflict doesn\'t mean loss."', dailyPractice: 'Each morning: "I will honor what I need today." Each evening: note one time you chose yourself.' },
  Scorpio: { innerChildNeeds: 'To be told "your depth is safe here" and "I won\'t use your vulnerability against you."', dailyPractice: 'Each morning: "I can trust today." Each evening: name one moment you let your guard down.' },
  Sagittarius: { innerChildNeeds: 'To be told "you can explore and still have a home" and "your questions are welcome."', dailyPractice: 'Each morning: "I don\'t have to know everything today." Each evening: notice one thing that brought you meaning.' },
  Capricorn: { innerChildNeeds: 'To be told "you can rest now" and "you\'ve done enough."', dailyPractice: 'Each morning: "I don\'t have to earn my worth today." Each evening: acknowledge one moment you allowed yourself softness.' },
  Aquarius: { innerChildNeeds: 'To be told "you belong here, exactly as you are" and "your differences are not defects."', dailyPractice: 'Each morning: "I am part of something, not separate from it." Each evening: note one connection that felt genuine.' },
  Pisces: { innerChildNeeds: 'To be told "your feelings are real" and "you don\'t have to absorb everyone else\'s pain."', dailyPractice: 'Each morning: "I will feel my own feelings today." Each evening: notice which emotions were yours and which you absorbed.' },
};
