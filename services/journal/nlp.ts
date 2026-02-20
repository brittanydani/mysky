/**
 * Journal NLP Service
 *
 * On-device text analysis for journal entries:
 *  1. Keyword extraction (TF-weighted, top 8)
 *  2. Emotion bucket scoring (7 categories)
 *  3. Sentiment scoring (-1 to +1)
 *
 * All processing happens in-memory on plaintext before encryption.
 * Results are stored encrypted at rest — no raw text leaves the device.
 *
 * Pure functions — no I/O, no side effects.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface KeywordResult {
  /** Top keywords (max 8) */
  keywords: string[];
  /** Top keywords with counts */
  top: { w: string; c: number }[];
  /** Total token count after filtering */
  tokenCount: number;
}

export type EmotionCategory =
  | 'anxiety'
  | 'sadness'
  | 'anger'
  | 'calm'
  | 'joy'
  | 'fatigue'
  | 'stress';

export interface EmotionResult {
  /** Raw counts per category */
  counts: Partial<Record<EmotionCategory, number>>;
  /** Normalized rates (sum = 1.0) */
  rates: Partial<Record<EmotionCategory, number>>;
}

export interface SentimentResult {
  /** -1 (very negative) to +1 (very positive) */
  sentiment: number;
  /** Raw positive word count */
  positiveCount: number;
  /** Raw negative word count */
  negativeCount: number;
}

export interface JournalNLPResult {
  keywords: KeywordResult;
  emotions: EmotionResult;
  sentiment: SentimentResult;
  wordCount: number;
  readingMinutes: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stopwords (comprehensive)
// ─────────────────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  // Pronouns & determiners
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she',
  'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those',
  // Verbs (auxiliary / common)
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'shall',
  'should', 'can', 'could', 'may', 'might', 'must',
  // Articles / Prepositions / Conjunctions
  'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
  'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 'now', 'also',
  // Common fillers
  'just', 'really', 'like', 'got', 'get', 'gets', 'getting', 'went',
  'going', 'much', 'even', 'still', 'way', 'thing', 'things', 'today',
  'day', 'days', 'feel', 'feeling', 'felt', 'lot', 'lots', 'bit',
  'make', 'made', 'making', 'know', 'knowing', 'known', 'think',
  'thinking', 'thought', 'want', 'wanted', 'wanting', 'need', 'needed',
  'needing', 'one', 'two', 'three', 'time', 'times', 'dont', 'didnt',
  'doesnt', 'wont', 'wasnt', 'isnt', 'cant', 'couldnt', 'wouldnt',
  'shouldnt', 'hasnt', 'havent', 'hadnt', 'ago', 'back', 'keep',
  'kept', 'put', 'take', 'took', 'taking', 'come', 'came', 'coming',
  'say', 'said', 'saying', 'well', 'right', 'left',
  // Contractions (after apostrophe removal)
  'll', 've', 're', 'don', 'didn', 'doesn', 'won', 'wasn', 'isn',
  'couldn', 'wouldn', 'shouldn', 'hasn', 'haven', 'hadn', 'ain',
  'let', 'lets', 'thats', 'ive', 'im', 'its', 'hes', 'shes', 'theyre',
  'were', 'weve', 'youre', 'youve', 'theyll', 'ill', 'wed', 'youd',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Emotion Dictionary
// ─────────────────────────────────────────────────────────────────────────────

const EMOTION_DICT: Record<string, EmotionCategory> = {};

const EMOTION_WORDS: Record<EmotionCategory, string[]> = {
  anxiety: [
    'anxious', 'worried', 'nervous', 'panic', 'panicking', 'panicked', 'dread',
    'dreading', 'overwhelmed', 'overthinking', 'restless', 'uneasy', 'apprehensive',
    'fearful', 'afraid', 'scared', 'terrified', 'tense', 'frantic', 'spiraling',
  ],
  sadness: [
    'sad', 'heavy', 'lonely', 'hopeless', 'down', 'grief', 'grieving',
    'heartbroken', 'melancholy', 'dejected', 'despairing', 'gloomy', 'somber',
    'miserable', 'empty', 'numb', 'lost', 'crying', 'tears', 'mourning',
  ],
  anger: [
    'angry', 'mad', 'furious', 'annoyed', 'irritated', 'resentful', 'enraged',
    'frustrated', 'bitter', 'hostile', 'livid', 'outraged', 'fuming', 'rage',
    'seething', 'aggravated',
  ],
  calm: [
    'calm', 'grounded', 'peaceful', 'safe', 'steady', 'present', 'centered',
    'serene', 'tranquil', 'relaxed', 'settled', 'composed', 'balanced',
    'still', 'quiet', 'soothed', 'ease',
  ],
  joy: [
    'happy', 'excited', 'grateful', 'proud', 'playful', 'loved', 'joyful',
    'delighted', 'thrilled', 'elated', 'cheerful', 'blissful', 'content',
    'satisfied', 'inspired', 'hopeful', 'optimistic', 'alive', 'bright',
    'wonderful', 'amazing', 'beautiful', 'thankful', 'blessed',
  ],
  fatigue: [
    'tired', 'exhausted', 'drained', 'burnout', 'burnt', 'sleep', 'sleepy',
    'fatigued', 'weary', 'depleted', 'lethargic', 'sluggish', 'wiped',
    'worn', 'spent',
  ],
  stress: [
    'stressed', 'pressure', 'pressured', 'rushed', 'hurried', 'overloaded',
    'overworked', 'swamped', 'stretched', 'strained', 'burdened', 'deadline',
    'crunch', 'chaotic', 'hectic',
  ],
};

// Build flat dictionary for O(1) lookup
for (const [category, words] of Object.entries(EMOTION_WORDS)) {
  for (const word of words) {
    EMOTION_DICT[word] = category as EmotionCategory;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sentiment Lexicon
// ─────────────────────────────────────────────────────────────────────────────

const POSITIVE_WORDS = new Set([
  'calm', 'proud', 'hopeful', 'grateful', 'safe', 'steady', 'loved', 'excited',
  'happy', 'peaceful', 'grounded', 'content', 'satisfied', 'inspired', 'alive',
  'joyful', 'bright', 'centered', 'serene', 'balanced', 'motivated', 'confident',
  'connected', 'creative', 'strong', 'brave', 'healing', 'relief', 'clarity',
  'optimistic', 'thankful', 'blessed', 'wonderful', 'amazing', 'thrilled',
  'delighted', 'playful', 'energized', 'focused', 'tender', 'beautiful',
]);

const NEGATIVE_WORDS = new Set([
  'tired', 'anxious', 'overwhelmed', 'stressed', 'lonely', 'hopeless', 'angry',
  'sad', 'frustrated', 'drained', 'exhausted', 'worried', 'nervous', 'heavy',
  'stuck', 'scattered', 'disconnected', 'blocked', 'numb', 'raw', 'weak',
  'afraid', 'unsafe', 'hurt', 'grief', 'burnout', 'burnt', 'confused',
  'irritated', 'resentful', 'bitter', 'miserable', 'empty', 'lost',
  'panicked', 'terrified', 'furious', 'hostile', 'despairing', 'gloomy',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Text Normalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize text into filtered tokens:
 * - lowercase
 * - remove apostrophes
 * - replace non-letter chars with spaces
 * - collapse whitespace
 * - split into tokens
 * - remove stopwords, short tokens (<3 chars), numeric tokens
 */
export function tokenize(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/'/g, '')        // remove apostrophes
    .replace(/[^a-z]/g, ' ') // non-letter → space
    .replace(/\s+/g, ' ')    // collapse spaces
    .trim();

  if (normalized.length === 0) return [];

  return normalized
    .split(' ')
    .filter(token =>
      token.length >= 3 &&
      !STOPWORDS.has(token) &&
      !/^\d+$/.test(token)
    );
}

/**
 * Minimal stemming: remove common suffixes when remaining length >= 3.
 */
export function simpleStem(word: string): string {
  if (word.length <= 4) return word;

  // Order matters: check longer suffixes first
  const suffixes = ['ness', 'ment', 'tion', 'sion', 'ing', 'ful', 'ous', 'ive', 'able', 'ible', 'ally', 'ily', 'ely', 'edly', 'led', 'ied', 'ies', 'ing', 'ed', 'ly', 'er', 'es', 's'];

  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      return word.slice(0, word.length - suffix.length);
    }
  }

  return word;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Keyword Extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract top keywords from text using TF weighting.
 *
 * score(word) = freq(word) * log(1 + totalTokens / (1 + freq(word)))
 *
 * Returns top 8 keywords max.
 * If entry has > 80 tokens, exclude words appearing only once.
 */
export function extractKeywords(text: string): KeywordResult {
  const tokens = tokenize(text);
  const totalTokens = tokens.length;

  if (totalTokens === 0) {
    return { keywords: [], top: [], tokenCount: 0 };
  }

  // Count frequencies
  const freq: Record<string, number> = {};
  for (const token of tokens) {
    freq[token] = (freq[token] ?? 0) + 1;
  }

  // TF weighting
  const scored = Object.entries(freq).map(([word, count]) => ({
    word,
    count,
    score: count * Math.log(1 + totalTokens / (1 + count)),
  }));

  // Filter: exclude once-occurring words in long entries
  const filtered = totalTokens > 80
    ? scored.filter(s => s.count > 1)
    : scored;

  // Sort by score descending, take top 8
  filtered.sort((a, b) => b.score - a.score);
  const top = filtered.slice(0, 8);

  return {
    keywords: top.map(t => t.word),
    top: top.map(t => ({ w: t.word, c: t.count })),
    tokenCount: totalTokens,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Emotion Bucket Extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score text against emotion dictionary.
 * Returns raw counts and normalized rates.
 */
export function extractEmotions(text: string): EmotionResult {
  const tokens = tokenize(text);

  const counts: Partial<Record<EmotionCategory, number>> = {};
  let totalMatched = 0;

  for (const token of tokens) {
    const category = EMOTION_DICT[token];
    if (category) {
      counts[category] = (counts[category] ?? 0) + 1;
      totalMatched++;
    }
  }

  if (totalMatched === 0) {
    return { counts: {}, rates: {} };
  }

  // Normalize to rates
  const rates: Partial<Record<EmotionCategory, number>> = {};
  for (const [cat, count] of Object.entries(counts)) {
    rates[cat as EmotionCategory] = parseFloat((count / totalMatched).toFixed(3));
  }

  return { counts, rates };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Sentiment Scoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute sentiment from -1 (negative) to +1 (positive).
 *
 * sentimentRaw = positiveCount - negativeCount
 * sentiment = clamp(sentimentRaw / max(1, totalMatchedSentimentWords), -1, 1)
 */
export function computeSentiment(text: string): SentimentResult {
  const tokens = tokenize(text);

  let positiveCount = 0;
  let negativeCount = 0;

  for (const token of tokens) {
    if (POSITIVE_WORDS.has(token)) positiveCount++;
    if (NEGATIVE_WORDS.has(token)) negativeCount++;
  }

  const totalMatched = positiveCount + negativeCount;
  const raw = positiveCount - negativeCount;
  const sentiment = totalMatched === 0
    ? 0
    : parseFloat(Math.max(-1, Math.min(1, raw / totalMatched)).toFixed(3));

  return { sentiment, positiveCount, negativeCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run all NLP analysis on a journal entry's plaintext content.
 * Call this before encryption, then store results encrypted.
 */
export function analyzeJournalContent(content: string): JournalNLPResult {
  const text = (content ?? '').trim();
  const rawWords = text.length > 0 ? text.split(/\s+/).length : 0;
  const readingMinutes = parseFloat((rawWords / 200).toFixed(1)); // ~200 WPM

  return {
    keywords: extractKeywords(text),
    emotions: extractEmotions(text),
    sentiment: computeSentiment(text),
    wordCount: rawWords,
    readingMinutes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports for insights engine
// ─────────────────────────────────────────────────────────────────────────────

export { EMOTION_DICT, EMOTION_WORDS, POSITIVE_WORDS, NEGATIVE_WORDS };
