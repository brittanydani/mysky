/**
 * dreamKeywordGuardrails.test.ts — Guardrail tests for dream imagery extraction
 *
 * These tests ensure the imagery extraction layer:
 *   1. Only returns symbols whose keywords LITERALLY appear in dream text
 *   2. Never infers symbolic associations (e.g., death → funeral)
 *   3. Correctly rejects ambiguous keyword matches (e.g., "wake" ≠ funeral wake)
 *   4. Applies confidence thresholding to filter low-confidence matches
 *
 * These tests directly prevent the hallucination bug where "fear of dying"
 * was incorrectly mapped to "funeral" imagery.
 */

import { matchDreamKeywords, type KeywordMatch } from '../dreamKeywords';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract just the canonical labels (first keyword) from matches */
function extractLabels(matches: KeywordMatch[]): string[] {
  return matches.map(m => m.entry.keywords[0]);
}

/** Extract just the entry IDs from matches */
function extractIds(matches: KeywordMatch[]): string[] {
  return matches.map(m => m.entry.id);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Mortality ≠ Funeral guardrail (the original bug)
// ═══════════════════════════════════════════════════════════════════════════════

describe('mortality → funeral hallucination prevention', () => {
  it('should NOT match "funeral" when dream mentions fear of dying but no funeral', () => {
    const dreamText =
      'I was arguing with someone in a house. Then I was at school and the police showed up. ' +
      'I started running and someone had a weapon. I was in a parking lot and then a backyard. ' +
      'I had this overwhelming fear of dying.';

    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    // funeral_dream should NOT appear — "funeral" is not in the text
    expect(ids).not.toContain('funeral_dream');

    // But these SHOULD match (they are literally present)
    expect(ids).toContain('arguing');
  });

  it('should NOT match "funeral" when dream mentions death but not funeral', () => {
    const dreamText = 'I dreamed about death and dying but nothing about ceremonies or burials.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).not.toContain('funeral_dream');
    // death_self should match (dying is literally present)
    expect(ids).toContain('death_self');
  });

  it('should match "funeral" ONLY when the word funeral literally appears', () => {
    const dreamText = 'I was at a funeral for someone I didn\'t recognize.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).toContain('funeral_dream');
  });

  it('should match "funeral" when casket/coffin are literally mentioned', () => {
    const dreamText = 'There was a casket in the middle of the room and people were crying.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).toContain('funeral_dream');
  });

  it('should NOT infer funeral from grief, loss, or mourning-adjacent themes', () => {
    const dreamText =
      'I felt overwhelming sadness and watched someone leave forever. ' +
      'It felt like a death of something inside me. I was crying and couldn\'t stop.';

    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).not.toContain('funeral_dream');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Ambiguous keyword disqualifiers
// ═══════════════════════════════════════════════════════════════════════════════

describe('ambiguous keyword disqualification', () => {
  it('should NOT match funeral_dream for "wake up" contexts', () => {
    const dreamText = 'I woke up in a cold sweat after the dream.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).not.toContain('funeral_dream');
  });

  it('should NOT match funeral_dream for "when I woke" contexts', () => {
    const dreamText = 'When I woke the feeling lingered. The house was dark and I was scared.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).not.toContain('funeral_dream');
  });

  it('should NOT match funeral_dream for "couldn\'t wake up"', () => {
    const dreamText = 'I couldn\'t wake up no matter how hard I tried, it was terrifying.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).not.toContain('funeral_dream');
  });

  it('should disqualify "late" when used as time-related (e.g., "I was late")', () => {
    const dreamText = 'I was late for the exam and everyone was staring at me.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    // "late" should not match the deceased-person entry via disqualifier
    const lateMatch = matches.find(m => m.matchedKeyword === 'late');
    expect(lateMatch).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Strict literal extraction (no symbolic expansion)
// ═══════════════════════════════════════════════════════════════════════════════

describe('strict literal extraction', () => {
  it('should only extract literally present imagery from a complex dream', () => {
    const dreamText =
      'I was arguing with someone in a house. Then I was at school and the police showed up. ' +
      'I started running and someone had a weapon. I ended up in a parking lot.';

    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    // These should match — literally present in text
    expect(ids).toContain('arguing');

    // These should NOT match — not literally present
    expect(ids).not.toContain('funeral_dream');
    expect(ids).not.toContain('cemetery');
    expect(ids).not.toContain('church_temple');
  });

  it('should match weapon-related entries only for literal weapon words', () => {
    const dreamText = 'Someone had a gun pointed at me and I ran.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).toContain('gun');
  });

  it('should NOT generate symbolic expansions from fear-related content', () => {
    const dreamText =
      'I was terrified and felt like I was going to die. Everything was dark and chaotic.';

    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    // Should not infer funeral, cemetery, grave, etc. from fear/death emotions
    expect(ids).not.toContain('funeral_dream');
    expect(ids).not.toContain('cemetery');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Confidence thresholding
// ═══════════════════════════════════════════════════════════════════════════════

describe('confidence thresholding', () => {
  it('should include confidence scores in matches', () => {
    const dreamText = 'I was in a house and there was a snake on the floor.';
    const matches = matchDreamKeywords(dreamText);

    for (const match of matches) {
      expect(match.confidence).toBeDefined();
      expect(match.confidence).toBeGreaterThanOrEqual(0);
      expect(match.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('should give higher confidence to multi-word keyword matches', () => {
    const dreamText = 'I discovered a room I didn\'t know about in the house.';
    const matches = matchDreamKeywords(dreamText);

    // Multi-word phrases like "discovered a room" should have high confidence
    // if matched; single words should have lower but still passing confidence
    const multiWordMatch = matches.find(m => m.matchedKeyword.split(/\s+/).length >= 2);
    const singleWordMatch = matches.find(m => m.matchedKeyword.split(/\s+/).length === 1);

    if (multiWordMatch && singleWordMatch) {
      expect(multiWordMatch.confidence).toBeGreaterThanOrEqual(singleWordMatch.confidence);
    }
  });

  it('should filter out matches below confidence threshold', () => {
    const dreamText = 'I woke up scared and the room was dark.';
    const matches = matchDreamKeywords(dreamText);

    // All returned matches should be above threshold
    for (const match of matches) {
      expect(match.confidence).toBeGreaterThanOrEqual(0.5);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — Positive cases (things that SHOULD match)
// ═══════════════════════════════════════════════════════════════════════════════

describe('positive keyword matches', () => {
  it('should match funeral when "funeral" is literally in the text', () => {
    const dreamText = 'I was at a funeral and everyone was dressed in black.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).toContain('funeral_dream');
  });

  it('should match multiple explicit symbols correctly', () => {
    const dreamText =
      'I was swimming in the ocean when a snake appeared. ' +
      'Then I was flying over a forest.';

    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).toContain('ocean');
    expect(ids).toContain('snake');
    expect(ids).toContain('flying');
    expect(ids).toContain('forest');
  });

  it('should match house-related keywords when literally present', () => {
    const dreamText = 'I was in a house with many rooms and a long hallway.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).toContain('house');
  });

  it('should match arguing when literally present', () => {
    const dreamText = 'I was arguing with my sister about nothing.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).toContain('arguing');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — Edge cases
// ═══════════════════════════════════════════════════════════════════════════════

describe('edge cases', () => {
  it('should return empty for empty input', () => {
    expect(matchDreamKeywords('')).toEqual([]);
    expect(matchDreamKeywords('  ')).toEqual([]);
    expect(matchDreamKeywords('ab')).toEqual([]);
  });

  it('should handle very short dream text without crashing', () => {
    const matches = matchDreamKeywords('house');
    expect(matches.length).toBeGreaterThanOrEqual(0);
  });

  it('should deduplicate by entry id (first match wins)', () => {
    const dreamText = 'snake snake snake serpent snake';
    const matches = matchDreamKeywords(dreamText);
    const snakeMatches = matches.filter(m => m.entry.id === 'snake');

    // Should only appear once despite multiple keyword hits
    expect(snakeMatches.length).toBe(1);
  });

  it('should not match partial words', () => {
    // "wake" inside "awake" should not match independently
    const dreamText = 'I was fully awake but felt paralyzed.';
    const matches = matchDreamKeywords(dreamText);
    const ids = extractIds(matches);

    expect(ids).not.toContain('funeral_dream');
  });
});
