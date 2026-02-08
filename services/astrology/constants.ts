// Astrological constants and reference data

import { ZodiacSign, Planet, AspectType } from './types';

// Define planets first, then use them in signs
const PLANET_DEFINITIONS: Record<string, Planet> = {
  sun: { name: 'Sun', symbol: '☉', type: 'Luminary' },
  moon: { name: 'Moon', symbol: '☽', type: 'Luminary' },
  mercury: { name: 'Mercury', symbol: '☿', type: 'Personal' },
  venus: { name: 'Venus', symbol: '♀', type: 'Personal' },
  mars: { name: 'Mars', symbol: '♂', type: 'Personal' },
  jupiter: { name: 'Jupiter', symbol: '♃', type: 'Social' },
  saturn: { name: 'Saturn', symbol: '♄', type: 'Social' },
  uranus: { name: 'Uranus', symbol: '♅', type: 'Transpersonal' },
  neptune: { name: 'Neptune', symbol: '♆', type: 'Transpersonal' },
  pluto: { name: 'Pluto', symbol: '♇', type: 'Transpersonal' },
  ascendant: { name: 'Ascendant', symbol: 'AC', type: 'Point' },
  midheaven: { name: 'Midheaven', symbol: 'MC', type: 'Point' },
  chiron: { name: 'Chiron', symbol: '⚷', type: 'Point' },
  'north node': { name: 'North Node', symbol: '☊', type: 'Point' },
  'south node': { name: 'South Node', symbol: '☋', type: 'Point' }
};

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    name: 'Aries',
    symbol: '♈',
    element: 'Fire',
    modality: 'Cardinal',
    ruler: PLANET_DEFINITIONS.mars,
    number: 1
  },
  {
    name: 'Taurus',
    symbol: '♉',
    element: 'Earth',
    modality: 'Fixed',
    ruler: PLANET_DEFINITIONS.venus,
    number: 2
  },
  {
    name: 'Gemini',
    symbol: '♊',
    element: 'Air',
    modality: 'Mutable',
    ruler: PLANET_DEFINITIONS.mercury,
    number: 3
  },
  {
    name: 'Cancer',
    symbol: '♋',
    element: 'Water',
    modality: 'Cardinal',
    ruler: PLANET_DEFINITIONS.moon,
    number: 4
  },
  {
    name: 'Leo',
    symbol: '♌',
    element: 'Fire',
    modality: 'Fixed',
    ruler: PLANET_DEFINITIONS.sun,
    number: 5
  },
  {
    name: 'Virgo',
    symbol: '♍',
    element: 'Earth',
    modality: 'Mutable',
    ruler: PLANET_DEFINITIONS.mercury,
    number: 6
  },
  {
    name: 'Libra',
    symbol: '♎',
    element: 'Air',
    modality: 'Cardinal',
    ruler: PLANET_DEFINITIONS.venus,
    number: 7
  },
  {
    name: 'Scorpio',
    symbol: '♏',
    element: 'Water',
    modality: 'Fixed',
    ruler: PLANET_DEFINITIONS.mars, // Traditional ruler, modern is Pluto
    number: 8
  },
  {
    name: 'Sagittarius',
    symbol: '♐',
    element: 'Fire',
    modality: 'Mutable',
    ruler: PLANET_DEFINITIONS.jupiter,
    number: 9
  },
  {
    name: 'Capricorn',
    symbol: '♑',
    element: 'Earth',
    modality: 'Cardinal',
    ruler: PLANET_DEFINITIONS.saturn,
    number: 10
  },
  {
    name: 'Aquarius',
    symbol: '♒',
    element: 'Air',
    modality: 'Fixed',
    ruler: PLANET_DEFINITIONS.saturn, // Traditional ruler, modern is Uranus
    number: 11
  },
  {
    name: 'Pisces',
    symbol: '♓',
    element: 'Water',
    modality: 'Mutable',
    ruler: PLANET_DEFINITIONS.jupiter, // Traditional ruler, modern is Neptune
    number: 12
  }
];

export const PLANETS: Record<string, Planet> = PLANET_DEFINITIONS;

export const ASPECT_TYPES: AspectType[] = [
  {
    name: 'Conjunction',
    symbol: '☌',
    degrees: 0,
    orb: 8,
    nature: 'Neutral'
  },
  {
    name: 'Opposition',
    symbol: '☍',
    degrees: 180,
    orb: 8,
    nature: 'Challenging'
  },
  {
    name: 'Square',
    symbol: '□',
    degrees: 90,
    orb: 6,
    nature: 'Challenging'
  },
  {
    name: 'Trine',
    symbol: '△',
    degrees: 120,
    orb: 6,
    nature: 'Harmonious'
  },
  {
    name: 'Sextile',
    symbol: '⚹',
    degrees: 60,
    orb: 4,
    nature: 'Harmonious'
  },
  {
    name: 'Quincunx',
    symbol: '⚻',
    degrees: 150,
    orb: 3,
    nature: 'Challenging'
  },
  {
    name: 'Semisquare',
    symbol: '∠',
    degrees: 45,
    orb: 2,
    nature: 'Challenging'
  },
  {
    name: 'Sesquiquadrate',
    symbol: '⚼',
    degrees: 135,
    orb: 2,
    nature: 'Challenging'
  }
];

// House meanings for interpretation
export const HOUSE_MEANINGS = {
  1: {
    name: 'First House',
    keywords: ['identity', 'appearance', 'first impressions', 'self-expression'],
    theme: 'How you present yourself to the world'
  },
  2: {
    name: 'Second House',
    keywords: ['values', 'resources', 'self-worth', 'material security'],
    theme: 'What you value and how you build security'
  },
  3: {
    name: 'Third House',
    keywords: ['communication', 'learning', 'siblings', 'local environment'],
    theme: 'How you communicate and process information'
  },
  4: {
    name: 'Fourth House',
    keywords: ['home', 'family', 'roots', 'emotional foundation'],
    theme: 'Your emotional foundation and sense of belonging'
  },
  5: {
    name: 'Fifth House',
    keywords: ['creativity', 'self-expression', 'romance', 'children'],
    theme: 'How you express your unique creative essence'
  },
  6: {
    name: 'Sixth House',
    keywords: ['daily routine', 'health', 'service', 'work habits'],
    theme: 'How you maintain your daily life and wellbeing'
  },
  7: {
    name: 'Seventh House',
    keywords: ['partnerships', 'relationships', 'cooperation', 'balance'],
    theme: 'How you relate to others and seek balance'
  },
  8: {
    name: 'Eighth House',
    keywords: ['transformation', 'shared resources', 'intimacy', 'psychology'],
    theme: 'How you navigate deep change and intimacy'
  },
  9: {
    name: 'Ninth House',
    keywords: ['philosophy', 'higher learning', 'travel', 'meaning'],
    theme: 'How you seek meaning and expand your worldview'
  },
  10: {
    name: 'Tenth House',
    keywords: ['career', 'reputation', 'authority', 'public image'],
    theme: 'How you express your authority and public role'
  },
  11: {
    name: 'Eleventh House',
    keywords: ['friendships', 'groups', 'hopes', 'social causes'],
    theme: 'How you connect with communities and pursue ideals'
  },
  12: {
    name: 'Twelfth House',
    keywords: ['spirituality', 'subconscious', 'sacrifice', 'transcendence'],
    theme: 'How you connect with the transcendent and release'
  }
};

// Element and modality combinations for interpretation
export const ELEMENT_MEANINGS = {
  Fire: {
    keywords: ['energy', 'enthusiasm', 'initiative', 'inspiration'],
    emotional_pattern: 'You may feel energized by action and new experiences'
  },
  Earth: {
    keywords: ['stability', 'practicality', 'material focus', 'persistence'],
    emotional_pattern: 'You may find comfort in tangible, practical approaches'
  },
  Air: {
    keywords: ['communication', 'ideas', 'social connection', 'mental activity'],
    emotional_pattern: 'You may process experiences through thinking and sharing'
  },
  Water: {
    keywords: ['emotion', 'intuition', 'empathy', 'depth'],
    emotional_pattern: 'You may experience life through deep feeling and intuition'
  }
};

export const MODALITY_MEANINGS = {
  Cardinal: {
    keywords: ['initiation', 'leadership', 'new beginnings', 'action'],
    emotional_pattern: 'You may feel called to start things and take charge'
  },
  Fixed: {
    keywords: ['stability', 'persistence', 'determination', 'focus'],
    emotional_pattern: 'You may prefer consistency and sustained effort'
  },
  Mutable: {
    keywords: ['adaptability', 'flexibility', 'change', 'versatility'],
    emotional_pattern: 'You may thrive with variety and changing circumstances'
  }
};