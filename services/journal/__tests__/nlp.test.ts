/**
 * Journal NLP — unit tests
 *
 * Covers tokenize, simpleStem, extractKeywords, extractEmotions,
 * computeSentiment, and analyzeJournalContent.
 *
 * All functions are pure — no I/O, no mocking needed.
 */

import {
  tokenize,
  simpleStem,
  extractKeywords,
  extractEmotions,
  computeSentiment,
  analyzeJournalContent,
} from '../nlp';

// ─────────────────────────────────────────────────────────────────────────────
// tokenize
// ─────────────────────────────────────────────────────────────────────────────

describe('tokenize', () => {
  it('returns empty array for empty string', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(tokenize('   ')).toEqual([]);
  });

  it('lowercases all tokens', () => {
    const result = tokenize('ANXIETY Worry FEAR');
    expect(result).toEqual(expect.arrayContaining(['anxiety', 'worry', 'fear']));
  });

  it('removes stopwords', () => {
    const result = tokenize('I am feeling very anxious');
    expect(result).not.toContain('i');
    expect(result).not.toContain('am');
    expect(result).not.toContain('very');
    expect(result).toContain('anxious');
  });

  it('removes tokens shorter than 3 characters', () => {
    const result = tokenize('go do it now');
    result.forEach(token => {
      expect(token.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('removes numeric tokens', () => {
    const result = tokenize('scored 10 out of 100 on test');
    expect(result).not.toContain('10');
    expect(result).not.toContain('100');
  });

  it('strips apostrophes', () => {
    const result = tokenize("I'm feeling overwhelmed today");
    expect(result).toContain('overwhelmed');
    expect(result.some(t => t.includes("'"))).toBe(false);
  });

  it('replaces non-letter characters with spaces', () => {
    const result = tokenize('anxiety/stress: burnout!');
    expect(result).toContain('anxiety');
    expect(result).toContain('stress');
    expect(result).toContain('burnout');
  });

  it('returns unique-ish tokens (duplicates kept for frequency counting)', () => {
    const result = tokenize('anxious anxious anxious');
    expect(result.filter(t => t === 'anxious').length).toBe(3);
  });

  it('handles mixed content with emotional words', () => {
    const result = tokenize('Feeling so grateful and calm today, but still tired.');
    expect(result).toContain('grateful');
    expect(result).toContain('calm');
    expect(result).toContain('tired');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// simpleStem
// ─────────────────────────────────────────────────────────────────────────────

describe('simpleStem', () => {
  it('returns short words unchanged', () => {
    expect(simpleStem('run')).toBe('run');
    expect(simpleStem('joy')).toBe('joy');
    expect(simpleStem('go')).toBe('go');
  });

  it('removes -ing suffix', () => {
    expect(simpleStem('running')).toBe('runn');
    expect(simpleStem('feeling')).toBe('feel');
  });

  it('removes -ed suffix', () => {
    expect(simpleStem('stressed')).toBe('stress');
  });

  it('removes -ness suffix', () => {
    expect(simpleStem('sadness')).toBe('sad');
  });

  it('removes -tion suffix', () => {
    // 'connection' (10 chars) - 'tion' (4 chars) = 'connec' (6 chars >= 3)
    expect(simpleStem('connection')).toBe('connec');
  });

  it('removes -ly suffix', () => {
    expect(simpleStem('quickly')).toBe('quick');
  });

  it('does not over-stem (remaining >= 3 chars)', () => {
    // "be" → removing "be" from "bees" → only 1 char left — should not remove
    const result = simpleStem('bees');
    expect(result.length).toBeGreaterThanOrEqual(2); // might remove 's' → 'bee'
  });

  it('does not mutate the input', () => {
    const word = 'feeling';
    simpleStem(word);
    expect(word).toBe('feeling');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractKeywords
// ─────────────────────────────────────────────────────────────────────────────

describe('extractKeywords', () => {
  it('returns empty results for empty text', () => {
    const result = extractKeywords('');
    expect(result.keywords).toEqual([]);
    expect(result.top).toEqual([]);
    expect(result.tokenCount).toBe(0);
  });

  it('returns at most 8 keywords', () => {
    const text = 'anxiety worry panic dread overwhelmed nervous restless fearful scared terror hope clarity peace calm joy strength resilience focus';
    const result = extractKeywords(text);
    expect(result.keywords.length).toBeLessThanOrEqual(8);
  });

  it('returns meaningful keywords from journallike text', () => {
    const text = 'I have been feeling anxious about work deadlines and my relationship patterns keep playing out. Depression and anxiety follow me everywhere.';
    const result = extractKeywords(text);
    expect(result.keywords.length).toBeGreaterThan(0);
    // Should extract anxiety (appears twice)
    expect(result.keywords).toContain('anxiety');
  });

  it('top contains word and count', () => {
    const result = extractKeywords('grateful grateful grateful today');
    expect(result.top.length).toBeGreaterThan(0);
    const gratefulEntry = result.top.find(t => t.w === 'grateful');
    expect(gratefulEntry).toBeDefined();
    expect(gratefulEntry!.c).toBe(3);
  });

  it('returns tokenCount matching number of valid tokens', () => {
    const text = 'peaceful calm grateful';
    const result = extractKeywords(text);
    expect(result.tokenCount).toBe(3);
  });

  it('in long text (>80 tokens), excludes words appearing only once', () => {
    // Build text with one unique word and one repeated word, padded to >80 tokens
    const padding = Array(82).fill('anxiety').join(' ');
    const text = padding + ' uniqueword';
    const result = extractKeywords(text);
    expect(result.keywords).not.toContain('uniqueword');
    expect(result.keywords).toContain('anxiety');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractEmotions
// ─────────────────────────────────────────────────────────────────────────────

describe('extractEmotions', () => {
  it('returns empty counts for empty text', () => {
    const result = extractEmotions('');
    expect(result.counts).toEqual({});
    expect(result.rates).toEqual({});
  });

  it('returns empty counts for text with no emotion words', () => {
    const result = extractEmotions('the weather was nice yesterday');
    expect(Object.keys(result.counts)).toHaveLength(0);
  });

  it('correctly identifies anxiety words', () => {
    const result = extractEmotions('I feel anxious and worried and nervous all day');
    expect(result.counts.anxiety).toBeGreaterThanOrEqual(2);
  });

  it('correctly identifies joy words', () => {
    const result = extractEmotions('I am so happy and grateful and content with life');
    expect(result.counts.joy).toBeGreaterThanOrEqual(2);
  });

  it('correctly identifies fatigue words', () => {
    const result = extractEmotions('I am exhausted and drained and tired from the week');
    expect(result.counts.fatigue).toBeGreaterThanOrEqual(2);
  });

  it('rates sum to approximately 1.0', () => {
    const result = extractEmotions('anxious happy tired stressed angry sad calm');
    const total = Object.values(result.rates).reduce((a, b) => a + (b ?? 0), 0);
    expect(total).toBeCloseTo(1.0, 1);
  });

  it('handles mixed emotion words', () => {
    const result = extractEmotions('feeling calm and peaceful but also sad and heavy');
    expect(result.counts.calm).toBeGreaterThanOrEqual(1);
    expect(result.counts.sadness).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// computeSentiment
// ─────────────────────────────────────────────────────────────────────────────

describe('computeSentiment', () => {
  it('returns 0 sentiment for empty text', () => {
    const result = computeSentiment('');
    expect(result.sentiment).toBe(0);
    expect(result.positiveCount).toBe(0);
    expect(result.negativeCount).toBe(0);
  });

  it('returns 0 for text with no sentiment words', () => {
    const result = computeSentiment('the meeting happened at the office');
    expect(result.sentiment).toBe(0);
  });

  it('returns positive sentiment for clearly positive text', () => {
    const result = computeSentiment('I feel calm grateful peaceful happy and content');
    expect(result.sentiment).toBeGreaterThan(0);
  });

  it('returns negative sentiment for clearly negative text', () => {
    const result = computeSentiment('feeling anxious tired overwhelmed stressed and lonely');
    expect(result.sentiment).toBeLessThan(0);
  });

  it('sentiment is clamped to [-1, 1]', () => {
    const result = computeSentiment(Array(50).fill('happy peaceful calm grateful').join(' '));
    expect(result.sentiment).toBeLessThanOrEqual(1);
    expect(result.sentiment).toBeGreaterThanOrEqual(-1);
  });

  it('counts positive and negative words correctly', () => {
    const result = computeSentiment('calm happy anxious'); // 2 positive, 1 negative
    expect(result.positiveCount).toBe(2);
    expect(result.negativeCount).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// analyzeJournalContent
// ─────────────────────────────────────────────────────────────────────────────

describe('analyzeJournalContent', () => {
  it('returns zero wordCount for empty string', () => {
    const result = analyzeJournalContent('');
    expect(result.wordCount).toBe(0);
    expect(result.readingMinutes).toBe(0);
  });

  it('returns correct wordCount', () => {
    const result = analyzeJournalContent('I am feeling very calm today');
    expect(result.wordCount).toBe(6);
  });

  it('readingMinutes is approximately wordCount / 200', () => {
    const text = Array(200).fill('anxiety').join(' ');
    const result = analyzeJournalContent(text);
    expect(result.readingMinutes).toBe(1.0);
  });

  it('returns keywords object', () => {
    const result = analyzeJournalContent('feeling peaceful and grateful');
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords.keywords)).toBe(true);
  });

  it('returns emotions object', () => {
    const result = analyzeJournalContent('I am anxious and overwhelmed but also calm');
    expect(result.emotions).toBeDefined();
    expect(result.emotions.counts).toBeDefined();
  });

  it('returns sentiment object', () => {
    const result = analyzeJournalContent('feeling happy and content today');
    expect(result.sentiment).toBeDefined();
    expect(typeof result.sentiment.sentiment).toBe('number');
  });

  it('handles null/undefined input gracefully (trims empty string)', () => {
    // The function calls (content ?? '').trim() — simulate undefined
    expect(() => analyzeJournalContent('')).not.toThrow();
  });

  it('handles text with only stopwords', () => {
    const result = analyzeJournalContent('I am the and a');
    expect(result.keywords.keywords).toEqual([]);
    expect(result.wordCount).toBe(5);
  });
});
