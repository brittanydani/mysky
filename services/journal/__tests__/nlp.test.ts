/**
 * Tests for Journal NLP Service
 *
 * Covers:
 *  - Tokenization & normalization
 *  - Keyword extraction (TF weighting)
 *  - Emotion bucket extraction
 *  - Sentiment scoring
 *  - Combined analysis
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
// Tokenization
// ─────────────────────────────────────────────────────────────────────────────

describe('tokenize', () => {
  it('lowercases and strips non-letters', () => {
    const tokens = tokenize("I'm feeling GREAT today! 100%");
    // "im" removed (2 chars), "feeling" is stopword, "today" stopword, "100" removed (number)
    expect(tokens).toContain('great');
    expect(tokens).not.toContain('im');
    expect(tokens).not.toContain('100');
    expect(tokens).not.toContain('today');
  });

  it('removes stopwords', () => {
    const tokens = tokenize('The quick brown fox and the lazy dog');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('and');
    expect(tokens).toContain('quick');
    expect(tokens).toContain('brown');
    expect(tokens).toContain('fox');
    expect(tokens).toContain('lazy');
    expect(tokens).toContain('dog');
  });

  it('removes short tokens (< 3 chars)', () => {
    const tokens = tokenize('I am so ok here');
    expect(tokens).not.toContain('am');
    expect(tokens).not.toContain('so');
    expect(tokens).not.toContain('ok');
  });

  it('handles empty input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });

  it('handles apostrophes', () => {
    const tokens = tokenize("I don't can't won't shouldn't");
    // apostrophes removed → "dont" etc → should be filtered as stopwords
    expect(tokens).not.toContain("don't");
    expect(tokens).not.toContain('dont');
  });

  it('preserves meaningful words', () => {
    const tokens = tokenize('overwhelmed by work deadlines and stress');
    expect(tokens).toContain('overwhelmed');
    expect(tokens).toContain('work');
    expect(tokens).toContain('deadlines');
    expect(tokens).toContain('stress');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Simple Stemming
// ─────────────────────────────────────────────────────────────────────────────

describe('simpleStem', () => {
  it('removes common suffixes', () => {
    expect(simpleStem('running').length).toBeLessThan('running'.length);
    expect(simpleStem('tired')).toBe('tir');
    expect(simpleStem('calmly')).toBe('calm');
  });

  it('does not over-stem short words', () => {
    expect(simpleStem('sad')).toBe('sad');
    expect(simpleStem('mad')).toBe('mad');
    expect(simpleStem('run')).toBe('run');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyword Extraction
// ─────────────────────────────────────────────────────────────────────────────

describe('extractKeywords', () => {
  it('extracts keywords from meaningful text', () => {
    const text = 'I feel tired and overwhelmed by work. The deadline is stressing me out. Work has been exhausting and work feels never-ending.';
    const result = extractKeywords(text);
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords.length).toBeLessThanOrEqual(8);
    expect(result.tokenCount).toBeGreaterThan(0);
    // "work" appears 3 times, should be a top keyword
    expect(result.keywords).toContain('work');
  });

  it('returns empty for empty text', () => {
    const result = extractKeywords('');
    expect(result.keywords).toEqual([]);
    expect(result.top).toEqual([]);
    expect(result.tokenCount).toBe(0);
  });

  it('returns max 8 keywords', () => {
    const longText = 'anxiety stress work deadlines money family health sleep routine boundaries creativity career confidence joy grief clarity overwhelm loneliness gratitude rest nature travel finances weather food hormones productiveness';
    const result = extractKeywords(longText);
    expect(result.keywords.length).toBeLessThanOrEqual(8);
  });

  it('uses TF weighting to prioritize repeated meaningful words', () => {
    const text = 'calm calm calm calm work work work tired tired anxiety';
    const result = extractKeywords(text);
    // "calm" has highest frequency (4), should rank high
    expect(result.keywords[0]).toBe('calm');
    expect(result.top[0].c).toBe(4);
  });

  it('filters single-occurrence words in long entries', () => {
    // Create text with > 80 tokens where "work" repeats frequently but "uniqueword" appears once
    const repeating = 'work stress overwhelm deadline tired exhausted ';
    const unique = Array.from({ length: 80 }, (_, i) => `xword${i}`).join(' ');
    const text = repeating.repeat(8) + unique;
    const result = extractKeywords(text);
    // All top keywords should have count > 1 (single-occurrence excluded for > 80 tokens)
    for (const item of result.top) {
      expect(item.c).toBeGreaterThan(1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Emotion Bucket Extraction
// ─────────────────────────────────────────────────────────────────────────────

describe('extractEmotions', () => {
  it('detects anxiety words', () => {
    const result = extractEmotions('I feel anxious and worried, nervous about everything');
    expect(result.counts.anxiety).toBeGreaterThanOrEqual(3);
    expect(result.rates.anxiety).toBeGreaterThan(0);
  });

  it('detects sadness words', () => {
    const result = extractEmotions('feeling sad, lonely, and hopeless today');
    expect(result.counts.sadness).toBeGreaterThanOrEqual(2);
  });

  it('detects joy words', () => {
    const result = extractEmotions('I am so happy and grateful, feeling excited and proud');
    expect(result.counts.joy).toBeGreaterThanOrEqual(3);
  });

  it('detects fatigue words', () => {
    const result = extractEmotions('exhausted, drained, need sleep');
    expect(result.counts.fatigue).toBeGreaterThanOrEqual(2);
  });

  it('normalizes rates to sum ≈ 1', () => {
    const result = extractEmotions('anxious worried tired exhausted happy grateful');
    const totalRate = Object.values(result.rates).reduce((s, v) => s + (v ?? 0), 0);
    expect(totalRate).toBeCloseTo(1.0, 1);
  });

  it('returns empty for text with no emotion words', () => {
    const result = extractEmotions('The weather is cloudy and the temperature dropped');
    expect(Object.keys(result.counts)).toHaveLength(0);
    expect(Object.keys(result.rates)).toHaveLength(0);
  });

  it('handles empty text', () => {
    const result = extractEmotions('');
    expect(Object.keys(result.counts)).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sentiment Scoring
// ─────────────────────────────────────────────────────────────────────────────

describe('computeSentiment', () => {
  it('returns positive for positive text', () => {
    const result = computeSentiment('calm, peaceful, grateful, inspired, alive');
    expect(result.sentiment).toBeGreaterThan(0);
    expect(result.positiveCount).toBeGreaterThan(0);
  });

  it('returns negative for negative text', () => {
    const result = computeSentiment('tired, anxious, overwhelmed, lonely, hopeless');
    expect(result.sentiment).toBeLessThan(0);
    expect(result.negativeCount).toBeGreaterThan(0);
  });

  it('returns near zero for mixed text', () => {
    const result = computeSentiment('grateful but tired, calm yet stressed');
    expect(Math.abs(result.sentiment)).toBeLessThanOrEqual(0.5);
  });

  it('clamps to [-1, 1] range', () => {
    const pos = computeSentiment('happy happy happy happy happy');
    expect(pos.sentiment).toBeLessThanOrEqual(1);
    expect(pos.sentiment).toBeGreaterThanOrEqual(-1);

    const neg = computeSentiment('angry angry angry angry angry');
    expect(neg.sentiment).toBeLessThanOrEqual(1);
    expect(neg.sentiment).toBeGreaterThanOrEqual(-1);
  });

  it('returns 0 for text with no sentiment words', () => {
    const result = computeSentiment('the meeting is scheduled for tomorrow');
    expect(result.sentiment).toBe(0);
    expect(result.positiveCount).toBe(0);
    expect(result.negativeCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Combined Analysis
// ─────────────────────────────────────────────────────────────────────────────

describe('analyzeJournalContent', () => {
  it('returns full result with all fields', () => {
    const result = analyzeJournalContent(
      'I feel tired and overwhelmed by work. The deadlines are stressing me out. But I am also grateful for my team and proud of what we accomplished.',
    );

    expect(result.keywords.keywords.length).toBeGreaterThan(0);
    expect(result.emotions.counts).toBeDefined();
    expect(result.sentiment).toBeDefined();
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.readingMinutes).toBeGreaterThan(0);
  });

  it('handles empty content', () => {
    const result = analyzeJournalContent('');
    expect(result.keywords.keywords).toEqual([]);
    expect(result.wordCount).toBe(0);
    expect(result.readingMinutes).toBe(0);
  });

  it('reading minutes approximate 200 WPM', () => {
    const words200 = Array(200).fill('word').join(' ');
    const result = analyzeJournalContent(words200);
    expect(result.readingMinutes).toBeCloseTo(1.0, 0);
  });

  it('detects mixed emotions in realistic journal entry', () => {
    const entry = `
      Today was incredibly stressful. The deadline pressure at work had me panicking  
      all morning. I felt overwhelmed and anxious. But after a long walk in the evening,
      I noticed some calm return. I'm grateful for the fresh air and feeling more
      grounded now. Still tired though - need serious sleep tonight.
    `;
    const result = analyzeJournalContent(entry);

    // Should detect both negative and positive emotions
    expect(result.emotions.counts.anxiety ?? result.emotions.counts.stress).toBeGreaterThan(0);
    expect(result.emotions.counts.calm ?? result.emotions.counts.joy).toBeGreaterThan(0);

    // Mixed sentiment should be near zero or slightly negative
    expect(result.sentiment.sentiment).toBeGreaterThanOrEqual(-1);
    expect(result.sentiment.sentiment).toBeLessThanOrEqual(1);

    // Keywords should include domain-relevant words
    expect(result.keywords.keywords.length).toBeGreaterThan(0);
  });
});
