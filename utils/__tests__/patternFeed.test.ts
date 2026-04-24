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
      maturity: 'developing',
      totalDays: 12,
      generatedAt: '2026-04-22T00:00:00.000Z',
    };

    const cards = buildPatternFeedInsights(bundle);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      id: 'deep-identity-core',
      title: 'How Your Mind Works',
      accentColor: 'lavender',
      isConfirmed: true,
    });
    expect(cards[0].heroMetrics?.map((metric) => metric.value)).toEqual([
      'How Your Mind Works',
      '12 days',
      'Strong signal',
    ]);
    expect(cards[0].takeaway?.body).toContain('misunderstood');
  });
});
