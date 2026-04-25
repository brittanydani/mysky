import { GeneratedInsight } from '../types/knowledgeEngine';

const BANNED_PHRASES = [
  'diagnosis',
  'disorder',
  'symptom',
  'trauma response',
  'pathology',
  'medical advice',
  'navigating a lot',
  'complex emotions',
  'holding space',
  'journey',
  'self-care',
  'be gentle with yourself',
  'balance',
  'growth mindset',
];

/**
 * Filters and polishes an insight to ensure it meets MySky safety and tone standards.
 */
export function filterAndPolishInsight(insight: GeneratedInsight): GeneratedInsight | null {
  const text = `${insight.title} ${insight.observation} ${insight.pattern} ${insight.reframe.shame} ${insight.reframe.clarity} ${insight.prompt}`.toLowerCase();

  // Reject if any banned phrases exist
  for (const banned of BANNED_PHRASES) {
    if (text.includes(banned)) return null;
  }

  // Basic cleanup: ensure no double spaces, ensure proper punctuation
  const polish = (s: string) => s.replace(/\s+/g, ' ').trim();

  return {
    ...insight,
    title: polish(insight.title),
    observation: polish(insight.observation),
    pattern: polish(insight.pattern),
    reframe: {
      shame: polish(insight.reframe.shame),
      clarity: polish(insight.reframe.clarity),
    },
    prompt: polish(insight.prompt),
  };
}
