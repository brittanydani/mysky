import { BODY_SIGNAL_PATTERNS } from '../patternPacks/bodySignalPatterns';
import { BOUNDARY_SELF_TRUST_PATTERNS } from '../patternPacks/boundarySelfTrustPatterns';
import { COGNITIVE_STYLE_PATTERNS } from '../patternPacks/cognitiveStylePatterns';
import { CREATIVITY_EXPRESSION_PATTERNS } from '../patternPacks/creativityExpressionPatterns';
import { DREAMS_SYMBOLS_PATTERNS } from '../patternPacks/dreamsSymbolsPatterns';
import { EMOTIONAL_WEATHER_PATTERNS } from '../patternPacks/emotionalWeatherPatterns';
import { FAMILY_HOME_PATTERNS } from '../patternPacks/familyHomePatterns';
import { GLIMMERS_REGULATION_PATTERNS } from '../patternPacks/glimmersRegulationPatterns';
import { IDENTITY_GROWTH_PATTERNS } from '../patternPacks/identityGrowthPatterns';
import { NATAL_CHART_REFLECTION_PATTERNS } from '../patternPacks/natalChartReflectionPatterns';
import { RELATIONSHIP_PATTERNS } from '../patternPacks/relationshipPatterns';
import { REST_CAPACITY_PATTERNS } from '../patternPacks/restCapacityPatterns';
import { SCARCITY_ABUNDANCE_PATTERNS } from '../patternPacks/scarcityAbundancePatterns';
import { SUPPORT_BELONGING_PATTERNS } from '../patternPacks/supportBelongingPatterns';
import { VALUES_INTEGRITY_PATTERNS } from '../patternPacks/valuesIntegrityPatterns';

const CHUNK_ONE_PATTERNS = [
  ...REST_CAPACITY_PATTERNS,
  ...EMOTIONAL_WEATHER_PATTERNS,
  ...BODY_SIGNAL_PATTERNS,
  ...SUPPORT_BELONGING_PATTERNS,
  ...RELATIONSHIP_PATTERNS,
];

const CHUNK_TWO_PATTERNS = [
  ...BOUNDARY_SELF_TRUST_PATTERNS,
  ...COGNITIVE_STYLE_PATTERNS,
  ...VALUES_INTEGRITY_PATTERNS,
  ...CREATIVITY_EXPRESSION_PATTERNS,
  ...IDENTITY_GROWTH_PATTERNS,
];

const CHUNK_THREE_PATTERNS = [
  ...DREAMS_SYMBOLS_PATTERNS,
  ...GLIMMERS_REGULATION_PATTERNS,
  ...FAMILY_HOME_PATTERNS,
  ...SCARCITY_ABUNDANCE_PATTERNS,
  ...NATAL_CHART_REFLECTION_PATTERNS,
];

const ALL_ARCHIVE_PATTERNS = [
  ...CHUNK_ONE_PATTERNS,
  ...CHUNK_TWO_PATTERNS,
  ...CHUNK_THREE_PATTERNS,
];

const expectCompletePatternCopy = (patterns: typeof CHUNK_ONE_PATTERNS) => {
  const keys = patterns.map((pattern) => pattern.key);

  expect(new Set(keys).size).toBe(keys.length);
  patterns.forEach((pattern) => {
    expect(pattern.title).toBeTruthy();
    expect(pattern.description).toBeTruthy();
    expect(pattern.requiredSignals.length).toBeGreaterThan(0);
    expect(pattern.supportingSignals.length).toBeGreaterThan(0);
    expect(pattern.shameLabel).toBeTruthy();
    expect(pattern.clarityReframe).toBeTruthy();
    expect(pattern.minEvidenceCount).toBeGreaterThan(0);
    expect(pattern.minScore).toBeGreaterThan(0);
  });
};

describe('archive pattern catalog chunk 1', () => {
  it('contains 20 patterns in each chunk 1 category', () => {
    expect(REST_CAPACITY_PATTERNS).toHaveLength(20);
    expect(EMOTIONAL_WEATHER_PATTERNS).toHaveLength(20);
    expect(BODY_SIGNAL_PATTERNS).toHaveLength(20);
    expect(SUPPORT_BELONGING_PATTERNS).toHaveLength(20);
    expect(RELATIONSHIP_PATTERNS).toHaveLength(20);
    expect(CHUNK_ONE_PATTERNS).toHaveLength(100);
  });

  it('uses unique stable keys with complete pattern copy fields', () => {
    expectCompletePatternCopy(CHUNK_ONE_PATTERNS);
  });

  it('preserves representative user-facing titles from the supplied list', () => {
    expect(REST_CAPACITY_PATTERNS[0].title).toBe('Your Relationship with Rest');
    expect(EMOTIONAL_WEATHER_PATTERNS[0].title).toBe('The Low-Light Day');
    expect(BODY_SIGNAL_PATTERNS[0].title).toBe('The Body Knows First');
    expect(SUPPORT_BELONGING_PATTERNS[0].title).toBe('Your Relationship with Being Caught');
    expect(RELATIONSHIP_PATTERNS[19].title).toBe('The Connection Aftercare Pattern');
  });
});

describe('archive pattern catalog chunk 2', () => {
  it('contains 20 patterns in each chunk 2 category', () => {
    expect(BOUNDARY_SELF_TRUST_PATTERNS).toHaveLength(20);
    expect(COGNITIVE_STYLE_PATTERNS).toHaveLength(20);
    expect(VALUES_INTEGRITY_PATTERNS).toHaveLength(20);
    expect(CREATIVITY_EXPRESSION_PATTERNS).toHaveLength(20);
    expect(IDENTITY_GROWTH_PATTERNS).toHaveLength(20);
    expect(CHUNK_TWO_PATTERNS).toHaveLength(100);
  });

  it('uses unique stable keys with complete pattern copy fields', () => {
    expectCompletePatternCopy(CHUNK_TWO_PATTERNS);
  });

  it('preserves representative user-facing titles from the supplied list', () => {
    expect(BOUNDARY_SELF_TRUST_PATTERNS[0].title).toBe('Where You Draw the Line');
    expect(COGNITIVE_STYLE_PATTERNS[0].title).toBe('How You Process Pain');
    expect(VALUES_INTEGRITY_PATTERNS[0].title).toBe('The Value Beneath Your Anger');
    expect(CREATIVITY_EXPRESSION_PATTERNS[0].title).toBe('Creative Alchemy');
    expect(IDENTITY_GROWTH_PATTERNS[19].title).toBe('The Wholeness Pattern');
  });
});

describe('archive pattern catalog chunk 3', () => {
  it('contains 20 patterns in each chunk 3 category', () => {
    expect(DREAMS_SYMBOLS_PATTERNS).toHaveLength(20);
    expect(GLIMMERS_REGULATION_PATTERNS).toHaveLength(20);
    expect(FAMILY_HOME_PATTERNS).toHaveLength(20);
    expect(SCARCITY_ABUNDANCE_PATTERNS).toHaveLength(20);
    expect(NATAL_CHART_REFLECTION_PATTERNS).toHaveLength(20);
    expect(CHUNK_THREE_PATTERNS).toHaveLength(100);
  });

  it('uses unique stable keys with complete pattern copy fields', () => {
    expectCompletePatternCopy(CHUNK_THREE_PATTERNS);
  });

  it('preserves representative user-facing titles from the supplied list', () => {
    expect(DREAMS_SYMBOLS_PATTERNS[0].title).toBe('When Dreams Continue the Conversation');
    expect(GLIMMERS_REGULATION_PATTERNS[0].title).toBe('What Actually Softens You');
    expect(FAMILY_HOME_PATTERNS[0].title).toBe('The Family Pattern Awareness');
    expect(SCARCITY_ABUNDANCE_PATTERNS[0].title).toBe('The Scarcity Scanner');
    expect(NATAL_CHART_REFLECTION_PATTERNS[19].title).toBe('The Sky Map Integration');
  });
});

describe('archive pattern catalog full set', () => {
  it('contains all 300 supplied archive patterns with unique keys', () => {
    const keys = ALL_ARCHIVE_PATTERNS.map((pattern) => pattern.key);

    expect(ALL_ARCHIVE_PATTERNS).toHaveLength(300);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
