/**
 * Theme Normalization
 *
 * Collapses lexical variants into shared concepts before pattern analysis.
 * This prevents signal fragmentation (e.g. "tired", "exhausted", and "drained"
 * all map to the same concept so their co-occurrence counts accumulate).
 *
 * Three normalization tables:
 *   PERSON_ALIASES   — name / relationship variants → canonical person token
 *   KEYWORD_GROUPS   — emotional / thematic word clusters → canonical concept
 *   TAG_NORMALIZER   — tag key variants → canonical tag key
 *
 * Pure functions — no I/O, no side effects.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Person alias normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map common relationship words and name variants to canonical tokens.
 * Extend this list as user-specific names become recognizable
 * (the caller can inject extra aliases at runtime).
 */
const PERSON_ALIAS_MAP: Record<string, string> = {
  // Maternal
  mom: 'mother',
  mama: 'mother',
  momma: 'mother',
  mommy: 'mother',
  'my mom': 'mother',
  'my mother': 'mother',
  'my mama': 'mother',

  // Paternal
  dad: 'father',
  papa: 'father',
  daddy: 'father',
  'my dad': 'father',
  'my father': 'father',

  // Romantic
  boyfriend: 'partner',
  girlfriend: 'partner',
  husband: 'partner',
  wife: 'partner',
  'my partner': 'partner',
  'my boyfriend': 'partner',
  'my girlfriend': 'partner',
  'my husband': 'partner',
  'my wife': 'partner',
  babe: 'partner',
  bae: 'partner',

  // Siblings
  brother: 'sibling',
  sister: 'sibling',
  bro: 'sibling',
  sis: 'sibling',

  // Workplace
  boss: 'boss',
  manager: 'boss',
  supervisor: 'boss',
  'my boss': 'boss',
  coworker: 'colleague',
  'co-worker': 'colleague',
  colleague: 'colleague',
  'my coworker': 'colleague',
  teammate: 'colleague',
};

/**
 * Normalize a person/entity token. Returns the canonical form or the input unchanged.
 * Caller should lowercase + trim before passing.
 */
export function normalizePerson(raw: string): string {
  const key = raw.toLowerCase().trim();
  return PERSON_ALIAS_MAP[key] ?? key;
}

/**
 * Normalize an array of person tokens (deduplicates after normalization).
 */
export function normalizePeople(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of raw) {
    const n = normalizePerson(p);
    if (!seen.has(n)) { seen.add(n); result.push(n); }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyword / theme normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emotional / thematic word cluster → canonical concept.
 * Built from commonly extracted NLP keywords so related words accumulate
 * under a single concept rather than diluting each other.
 */
const KEYWORD_GROUPS: { canonical: string; variants: string[] }[] = [
  {
    canonical: 'exhaustion',
    variants: ['tired', 'exhausted', 'drained', 'fatigued', 'burnt', 'burnout', 'wiped', 'spent'],
  },
  {
    canonical: 'anxiety',
    variants: ['anxious', 'panicked', 'panic', 'worried', 'nervous', 'on edge', 'restless', 'uneasy', 'tense'],
  },
  {
    canonical: 'overwhelm',
    variants: ['overwhelmed', 'overwhelm', 'too much', 'flooded', 'swamped', 'overstimulated', 'scattered'],
  },
  {
    canonical: 'work',
    variants: ['working', 'office', 'job', 'career', 'workplace', 'deadlines', 'deadline', 'meetings', 'meeting'],
  },
  {
    canonical: 'boundaries',
    variants: ['boundary', 'limits', 'limit', 'setting limits', 'overextended', 'overextending', 'said no', 'saying no'],
  },
  {
    canonical: 'loneliness',
    variants: ['lonely', 'alone', 'isolated', 'disconnected', 'longing', 'solitude'],
  },
  {
    canonical: 'grief',
    variants: ['grieving', 'loss', 'mourning', 'heartbreak', 'heartbroken', 'lost someone'],
  },
  {
    canonical: 'joy',
    variants: ['joyful', 'happy', 'elated', 'thrilled', 'delighted', 'blissful', 'excited', 'excited', 'wonderful'],
  },
  {
    canonical: 'pressure',
    variants: ['pressured', 'pressed', 'stressed', 'stress', 'strain', 'burden', 'burdened', 'demanding', 'demands'],
  },
  {
    canonical: 'clarity',
    variants: ['clear', 'focused', 'grounded', 'certain', 'decisive', 'sure', 'aligned'],
  },
  {
    canonical: 'confusion',
    variants: ['confused', 'uncertain', 'unsure', 'unclear', 'lost', 'indecisive', 'foggy'],
  },
  {
    canonical: 'connection',
    variants: ['connected', 'close', 'intimacy', 'bonded', 'togetherness', 'belonging'],
  },
  {
    canonical: 'rest',
    variants: ['resting', 'relaxed', 'relaxing', 'recovered', 'recovery', 'downtime', 'recharge', 'recharging'],
  },
  {
    canonical: 'movement',
    variants: ['exercise', 'workout', 'walked', 'walking', 'run', 'running', 'yoga', 'gym', 'active', 'activity'],
  },
  {
    canonical: 'creativity',
    variants: ['creative', 'creating', 'art', 'artistic', 'music', 'writing', 'making', 'built', 'made something'],
  },
  {
    canonical: 'anger',
    variants: ['angry', 'furious', 'frustrated', 'frustration', 'irritated', 'irritable', 'resentful', 'resentment'],
  },
  {
    canonical: 'sadness',
    variants: ['sad', 'depressed', 'depression', 'down', 'low', 'melancholy', 'hopeless', 'empty', 'heaviness', 'heavy'],
  },
  {
    canonical: 'hope',
    variants: ['hopeful', 'optimistic', 'optimism', 'looking forward', 'excited about', 'motivated', 'positive'],
  },
  {
    canonical: 'shame',
    variants: ['shameful', 'embarrassed', 'embarrassment', 'guilt', 'guilty', 'humiliated', 'humiliation'],
  },
  {
    canonical: 'fear',
    variants: ['afraid', 'scared', 'terrified', 'terror', 'dread', 'dreading', 'fearful'],
  },
];

// Build a lookup map: variant → canonical
const KEYWORD_LOOKUP = new Map<string, string>();
for (const group of KEYWORD_GROUPS) {
  for (const v of group.variants) {
    KEYWORD_LOOKUP.set(v.toLowerCase().trim(), group.canonical);
  }
  // canonical also maps to itself
  KEYWORD_LOOKUP.set(group.canonical.toLowerCase().trim(), group.canonical);
}

/**
 * Normalize a single keyword. Returns canonical concept or original input.
 */
export function normalizeKeyword(raw: string): string {
  const key = raw.toLowerCase().trim();
  return KEYWORD_LOOKUP.get(key) ?? key;
}

/**
 * Normalize an array of keywords (deduplicates after normalization).
 */
export function normalizeKeywords(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const kw of raw) {
    const n = normalizeKeyword(kw);
    if (!seen.has(n)) { seen.add(n); result.push(n); }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dream keyword normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dream symbol / theme clusters → canonical concepts.
 * These map raw dream keywords extracted from dreamText / dreamMetadata to
 * shared symbols that aggregate across multiple entries.
 */
const DREAM_KEYWORD_GROUPS: { canonical: string; variants: string[] }[] = [
  { canonical: 'water', variants: ['ocean', 'sea', 'river', 'lake', 'flood', 'rain', 'waves', 'drowning', 'swimming', 'underwater'] },
  { canonical: 'house', variants: ['home', 'room', 'apartment', 'building', 'mansion', 'childhood home', 'old house'] },
  { canonical: 'running', variants: ['chased', 'chase', 'fleeing', 'escape', 'escaping', 'running away', 'ran'] },
  { canonical: 'falling', variants: ['fell', 'drop', 'dropping', 'tumbling', 'plummeting'] },
  { canonical: 'flying', variants: ['float', 'floating', 'levitating', 'soaring', 'hovering'] },
  { canonical: 'death', variants: ['dying', 'dead', 'funeral', 'loss', 'passed away', 'killed'] },
  { canonical: 'animals', variants: ['snake', 'dog', 'cat', 'bird', 'bear', 'wolf', 'creature', 'monster', 'animal'] },
  { canonical: 'darkness', variants: ['dark', 'night', 'shadow', 'shadows', 'void', 'black', 'pitch black'] },
  { canonical: 'people', variants: ['stranger', 'strangers', 'crowd', 'group', 'faces', 'someone', 'someone else'] },
  { canonical: 'light', variants: ['bright', 'glowing', 'shining', 'sun', 'sunlight', 'luminous', 'glow'] },
  { canonical: 'school', variants: ['class', 'classroom', 'teacher', 'test', 'exam', 'homework', 'college', 'university'] },
  { canonical: 'travel', variants: ['car', 'driving', 'road', 'journey', 'trip', 'airplane', 'flying', 'train', 'lost traveling'] },
  { canonical: 'violence', variants: ['fight', 'fighting', 'attacked', 'attack', 'hurt', 'hurt someone', 'weapon'] },
];

const DREAM_KEYWORD_LOOKUP = new Map<string, string>();
for (const group of DREAM_KEYWORD_GROUPS) {
  for (const v of group.variants) {
    DREAM_KEYWORD_LOOKUP.set(v.toLowerCase().trim(), group.canonical);
  }
  DREAM_KEYWORD_LOOKUP.set(group.canonical.toLowerCase().trim(), group.canonical);
}

export function normalizeDreamKeyword(raw: string): string {
  const key = raw.toLowerCase().trim();
  return DREAM_KEYWORD_LOOKUP.get(key) ?? key;
}

export function normalizeDreamKeywords(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const kw of raw) {
    const n = normalizeDreamKeyword(kw);
    if (!seen.has(n)) { seen.add(n); result.push(n); }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tag key → canonical tag key.
 * Handles legacy tag keys, abbreviations, or display-name variants
 * that might have been stored by older code paths.
 */
const TAG_ALIAS_MAP: Record<string, string> = {
  // Legacy / alternate keys
  exercise: 'movement',
  working_out: 'movement',
  workout: 'movement',
  screen: 'screens',
  finance: 'finances',
  money: 'finances',
  relationship: 'relationships',
  social_media: 'screens',
  conflict_with: 'conflict',
  time_alone: 'alone_time',
};

export function normalizeTag(raw: string): string {
  const key = raw.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
  return TAG_ALIAS_MAP[key] ?? key;
}

export function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of raw) {
    const n = normalizeTag(t);
    if (n.length > 0 && !seen.has(n)) { seen.add(n); result.push(n); }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dream text extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract and normalize keywords from a dream text string.
 * Uses simple tokenization + the dream keyword lookup.
 * Caller provides the decrypted dream text.
 */
export function extractDreamKeywords(dreamText: string): string[] {
  if (!dreamText || dreamText.length === 0) return [];
  const tokens = dreamText.toLowerCase().replace(/[^a-z\s'-]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of tokens) {
    const n = normalizeDreamKeyword(t);
    if (!seen.has(n)) { seen.add(n); result.push(n); }
  }
  return result;
}
