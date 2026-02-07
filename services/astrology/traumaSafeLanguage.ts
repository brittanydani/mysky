/**
 * Trauma-Safe Language Guidelines for MySky
 * 
 * This file contains guidelines and reframes to ensure all app content
 * is supportive, non-judgmental, and trauma-informed.
 * 
 * CORE PRINCIPLES:
 * 1. No predictions of doom or misfortune
 * 2. No absolute statements about personality flaws
 * 3. Frame challenges as growth opportunities, not character defects
 * 4. Validate all emotional experiences
 * 5. Never shame attachment styles or needs
 * 6. Avoid words: "always," "never," "must," "should," "wrong," "fault," "failing"
 * 7. Use: "may," "sometimes," "tends to," "can," "might," "learning to"
 * 
 * WORDS TO AVOID → ALTERNATIVES:
 * "You are..." → "You may find..." / "You often..."
 * "Your problem is..." → "An area of growth for you..."
 * "You need to fix..." → "You're learning to..."
 * "This is bad" → "This can feel challenging"
 * "You struggle with..." → "You're navigating..."
 * "You fail to..." → "You're still learning to..."
 * "Toxic trait" → "Shadow pattern" / "Protection strategy"
 * "Weakness" → "Tender area" / "Growth edge"
 * "Negative" → "Challenging" / "Heavy"
 * "Incompatible" → "Different rhythms" / "Requires patience"
 * "Difficult person" → "Complex energy"
 * "Bad transit" → "Intense transit" / "Transformative period"
 */

export const TRAUMA_SAFE_REFRAMES: Record<string, string> = {
  // Challenge reframes
  'difficult': 'requiring patience',
  'hard': 'demanding',
  'impossible': 'challenging',
  'struggle': 'navigate',
  'problem': 'pattern',
  'issue': 'theme',
  'failing': 'learning',
  'weakness': 'growth edge',
  'flaw': 'tender area',
  'bad': 'challenging',
  'negative': 'heavy',
  'toxic': 'protective',
  
  // Relationship reframes
  'incompatible': 'different rhythms',
  'clash': 'friction',
  'conflict': 'tension',
  'fight': 'disconnect',
  'argument': 'rupture',
  'breakup': 'transition',
  'rejection': 'redirection',
  'abandoned': 'alone',
  
  // Self reframes  
  'fault': 'pattern',
  'blame': 'responsibility',
  'mistake': 'learning moment',
  'regret': 'wisdom gained',
  'shame': 'growing edge',
  'guilt': 'awareness',
  
  // Prediction reframes
  'will be bad': 'may feel intense',
  'destined to fail': 'facing a challenge',
  'doomed': 'in a difficult cycle',
  'cursed': 'in a heavy pattern',
};

// Supportive phrases to use
export const SUPPORTIVE_PHRASES = [
  'This is human.',
  'You\'re not alone in this.',
  'This pattern makes sense given your history.',
  'Your nervous system is trying to protect you.',
  'This isn\'t a flaw — it\'s a survival strategy.',
  'You developed this for a reason.',
  'Healing isn\'t linear.',
  'This won\'t last forever.',
  'You\'re allowed to take up space.',
  'Your feelings are valid.',
  'Rest is not laziness.',
  'Boundaries are self-love.',
  'You don\'t have to have it figured out.',
  'Progress looks different for everyone.',
  'You\'re doing better than you think.',
];

// Validating phrases for difficult emotions
export const EMOTIONAL_VALIDATIONS: Record<string, string[]> = {
  anger: [
    'Anger is often wisdom in disguise.',
    'Your anger is telling you something important.',
    'It\'s okay to feel this fire — just don\'t let it burn you.',
  ],
  sadness: [
    'Sadness is love with nowhere to go.',
    'It\'s okay to not be okay.',
    'Let yourself feel this. It won\'t last forever.',
  ],
  anxiety: [
    'Your nervous system is trying to keep you safe.',
    'This feeling will pass, even when it doesn\'t feel like it.',
    'You\'ve survived every anxious moment so far.',
  ],
  fear: [
    'Fear is just excitement without breath.',
    'Your fear is trying to protect you from something.',
    'What you\'re afraid of often holds what you need.',
  ],
  grief: [
    'Grief is the price we pay for love.',
    'There\'s no timeline for healing.',
    'You don\'t "get over" loss — you grow around it.',
  ],
  shame: [
    'Shame tells us we ARE wrong. Guilt tells us we DID wrong. One is a lie.',
    'You are not your worst moment.',
    'What if this shame isn\'t even yours?',
  ],
  loneliness: [
    'Loneliness is a signal, not a sentence.',
    'You can be surrounded by people and still feel alone.',
    'Connection starts with connecting to yourself first.',
  ],
  overwhelm: [
    'You don\'t have to do it all today.',
    'It\'s okay to put some things down.',
    'Your worth isn\'t measured by your productivity.',
  ],
};

// Non-judgmental transit descriptions
export const GENTLE_TRANSIT_LANGUAGE: Record<string, string> = {
  saturn: 'A period of restructuring and maturation',
  pluto: 'A time of deep transformation and release',
  mars: 'An energizing period that may require patience',
  neptune: 'A dreamy period that invites surrender',
  uranus: 'A liberating time of unexpected changes',
  eclipse: 'A powerful portal for release and new beginnings',
  retrograde: 'A time for reflection and review',
  void: 'A pause for integration before new action',
};

/**
 * Clean a message of potentially harmful language
 */
export function makeSafe(message: string): string {
  let safe = message;
  
  // Replace problematic words
  Object.entries(TRAUMA_SAFE_REFRAMES).forEach(([original, replacement]) => {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    safe = safe.replace(regex, replacement);
  });
  
  return safe;
}

/**
 * Get a supportive phrase for context
 */
export function getSupportivePhrase(): string {
  const index = new Date().getDate() % SUPPORTIVE_PHRASES.length;
  return SUPPORTIVE_PHRASES[index];
}

/**
 * Get validation for a specific emotion
 */
export function getEmotionalValidation(emotion: string): string {
  const normalizedEmotion = emotion.toLowerCase();
  const validations = EMOTIONAL_VALIDATIONS[normalizedEmotion] || EMOTIONAL_VALIDATIONS.overwhelm;
  const index = new Date().getDate() % validations.length;
  return validations[index];
}
