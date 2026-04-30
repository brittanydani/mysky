import { ReflectionAnswer } from '../dailyReflectionService';
import { SIGNALS } from '../signalDefinitions';
import { UserSignal } from '../types/knowledgeEngine';

type ReflectionCategory = ReflectionAnswer['category'];

const CATEGORY_SIGNALS: Record<ReflectionCategory, string[]> = {
  values: [SIGNALS.MEANING_MAKING.key, SIGNALS.SELF_TRUST_GROWTH.key],
  archetypes: [SIGNALS.PATTERN_RECOGNITION.key, SIGNALS.TRANSFORMATION.key],
  cognitive: [SIGNALS.DEEP_PROCESSING.key, SIGNALS.NEED_FOR_EXACT_WORDS.key],
  intelligence: [SIGNALS.PATTERN_RECOGNITION.key, SIGNALS.DEEP_PROCESSING.key],
};

const KEYWORD_SIGNALS: Array<{ key: string; terms: string[] }> = [
  { key: SIGNALS.SUPPORT_NEED.key, terms: ['support', 'help', 'held', 'care', 'lonely'] },
  { key: SIGNALS.SUPPORT_SCARCITY.key, terms: ['alone', 'unsupported', 'scarcity', 'no one'] },
  { key: SIGNALS.BOUNDARY_GROWTH.key, terms: ['boundary', 'boundaries', 'no ', 'limits', 'permission'] },
  { key: SIGNALS.GUILT_AROUND_STOPPING.key, terms: ['guilt', 'lazy', 'selfish', 'should'] },
  { key: SIGNALS.HIGH_RESPONSIBILITY.key, terms: ['responsibility', 'responsible', 'obligation', 'carry', 'carrying'] },
  { key: SIGNALS.MUTUALITY_NEED.key, terms: ['relationship', 'connection', 'repair', 'mutual', 'reciprocal'] },
  { key: SIGNALS.REASSURANCE_NEED.key, terms: ['reassurance', 'abandon', 'chosen', 'safe with'] },
  { key: SIGNALS.MEANING_MAKING.key, terms: ['meaning', 'truth', 'purpose', 'value', 'values'] },
  { key: SIGNALS.GRATITUDE.key, terms: ['grateful', 'gratitude', 'thankful'] },
  { key: SIGNALS.TRANSFORMATION.key, terms: ['change', 'growth', 'becoming', 'transform'] },
];

function answerStrength(answer: ReflectionAnswer): number {
  if (typeof answer.scaleValue === 'number') {
    return Math.max(0.35, Math.min(0.9, 0.35 + answer.scaleValue * 0.18));
  }
  return 0.55;
}

function addSignal(
  signals: UserSignal[],
  answer: ReflectionAnswer,
  key: string,
  strength: number,
  label?: string,
): void {
  if (signals.some((signal) => signal.key === key && signal.date === answer.date)) return;

  signals.push({
    key,
    source: 'reflectionBank',
    date: answer.date,
    strength,
    evidence: {
      source: 'reflectionBank',
      date: answer.date,
      label: label ?? answer.category,
      phrase: answer.questionText,
    },
  });
}

/**
 * Turns sealed daily-question answers into insight evidence.
 */
export function normalizeDailyReflections(answers: ReflectionAnswer[]): UserSignal[] {
  const signals: UserSignal[] = [];

  for (const answer of answers) {
    const strength = answerStrength(answer);
    const categorySignals = CATEGORY_SIGNALS[answer.category] ?? [];
    for (const key of categorySignals) {
      addSignal(signals, answer, key, strength * 0.85, answer.category);
    }

    const searchable = `${answer.questionText} ${answer.answer} ${answer.notes ?? ''}`.toLowerCase();
    for (const mapping of KEYWORD_SIGNALS) {
      const matched = mapping.terms.find((term) => searchable.includes(term));
      if (matched) {
        addSignal(signals, answer, mapping.key, strength, matched.trim());
      }
    }
  }

  return signals;
}
