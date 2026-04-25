import type { DeepInsightBundle } from '../deepInsights';
import { buildPatternFeedInsights } from '../patternFeed';

describe('patternFeed', () => {
  test('maps deep insights into feed cards with cumulative metadata', () => {
    const bundle: DeepInsightBundle = {
      insights: [
        {
          id: 'identity-core',
          level: 'identity',
          category: 'how-your-mind-works',
          scope: 'truth',
          job: 'integrate',
          title: 'How Your Mind Works',
          body: 'You appear to process life deeply before you speak about it.',
          reflectionPrompt: 'Where do you feel most misunderstood lately?',
          confidence: 'strong',
          accent: 'lavender',
        },
      ],
      personalTruths: [],
      season: null,
      memory: {
        fadingPatterns: [],
        emergingPatterns: [],
        previousStruggles: [],
        persistentTruths: [],
      },
      whatToRemember: [],
      premiumReport: {
        headline: 'Test',
        subheadline: 'Test',
        paidValueSummary: [],
        lockedPreview: 'Test',
      },
      operatingManual: {
        headline: 'Test',
        corePattern: 'Test',
        earlyWarningSigns: [],
        stabilizers: [],
        restorePlan: [],
        doMoreOf: [],
        doLessOf: [],
      },
      forecast: [],
      nextBestActions: [],
      maturity: 'developing',
      totalDays: 12,
      generatedAt: '2026-04-22T00:00:00.000Z',
    };

    const cards = buildPatternFeedInsights(bundle);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: 'deep-identity-core',
      title: 'How Your Mind Works',
      body: 'You appear to process life deeply before you speak about it.',
      accentColor: 'lavender',
      isConfirmed: true,
    });

    expect(cards[0].heroMetrics?.map((metric) => metric.value)).toEqual([
      'How Your Mind Works',
      '12 days',
      'Strong signal',
      'Long-term truth',
      'Integrating',
    ]);

    expect(cards[0].takeaway).toMatchObject({
      label: expect.any(String),
      body: expect.stringContaining('misunderstood'),
    });

    expect(cards[0].source).toBeDefined();
  });

  test('extracts deep insight specific properties correctly', () => {
    const bundle: DeepInsightBundle = {
      insights: [
        {
          id: 'action-test',
          level: 'need',
          category: 'what-restores-you',
          scope: 'monthly',
          job: 'guide',
          title: 'Action Title',
          body: 'Action Body',
          evidence: ['Evidence A'],
          whyItMatters: 'It matters.',
          nextStep: 'Do this.',
          premiumType: 'recovery-plan',
          valueRank: 99,
          confidence: 'strong',
          accent: 'emerald',
        },
      ],
      personalTruths: [],
      season: null,
      memory: {
        fadingPatterns: [],
        emergingPatterns: [],
        previousStruggles: [],
        persistentTruths: [],
      },
      whatToRemember: [],
      premiumReport: {
        headline: 'Test',
        subheadline: 'Test',
        paidValueSummary: [],
        lockedPreview: 'Test',
      },
      operatingManual: {
        headline: 'Test',
        corePattern: 'Test',
        earlyWarningSigns: [],
        stabilizers: [],
        restorePlan: [],
        doMoreOf: [],
        doLessOf: [],
      },
      forecast: [],
      nextBestActions: [],
      maturity: 'developing',
      totalDays: 12,
      generatedAt: '2026-04-22T00:00:00.000Z',
    };

    const cards = buildPatternFeedInsights(bundle);
    expect(cards).toHaveLength(1);
    expect(cards[0].takeaway?.body).toEqual('Do this.');
    expect(cards[0].takeaway?.label).toEqual('Next best step');
    expect(cards[0].body).toContain('Why it matters: It matters.');
    expect(cards[0].body).toContain('Why MySky thinks this: Evidence A');
  });
});
