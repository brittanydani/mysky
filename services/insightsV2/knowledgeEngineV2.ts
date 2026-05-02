import type {
  BuildTodayInsightsArgs,
  BuildTodayInsightsResult,
  GeneratedInsight,
} from './types';
import { ARCHIVE_PATTERNS } from './patternPacks';
import { scoreArchivePattern } from './engine/scorePatterns';
import { selectFreshInsight } from './engine/selectInsight';
import { selectPrimaryPersona } from './engine/selectPrimaryPersona';
import { normalizeInsightInputsV2 } from './normalizers';
import { generateId } from '../storage/models';

function dedupeSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(part => part.trim()) ?? [];
  if (sentences.length <= 1) return text;

  const seen = new Set<string>();
  const deduped = sentences.filter((sentence) => {
    const key = sentence.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.join(' ');
}

function dedupeInsights(insights: GeneratedInsight[]): GeneratedInsight[] {
  const seen = new Set<string>();

  return insights
    .map(insight => ({
      ...insight,
      body: dedupeSentences(insight.body),
      reframe: dedupeSentences(insight.reframe),
    }))
    .filter((insight) => {
      const key = [
        insight.slot,
        insight.patternKey,
        insight.angleKey ?? '',
        insight.title.toLowerCase(),
        insight.body.toLowerCase(),
      ].join('|');

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function trimTerminalPunctuation(text: string): string {
  return text.trim().replace(/[.!?]+$/, '');
}

/**
 * Knowledge Engine V2 Main Entry Point
 */
export async function buildTodayInsights({
  date,
  rawInputs,
  history = [],
  previousPatternScores = [],
}: BuildTodayInsightsArgs): Promise<BuildTodayInsightsResult> {
  const createdAtDate = new Date(date);
  const createdAt = Number.isFinite(createdAtDate.getTime())
    ? createdAtDate.toISOString()
    : new Date().toISOString();

  // 1. Normalize
  const signals = normalizeInsightInputsV2(rawInputs, date);

  // 2. Score Archive Patterns
  const patternScores = ARCHIVE_PATTERNS.map(pattern => {
    const prev = previousPatternScores.find(p => p.patternKey === pattern.key);
    return scoreArchivePattern(pattern, signals, date, prev);
  });
  const primaryPersona = selectPrimaryPersona({
    archivePatterns: patternScores,
    recentSignals: signals,
  });

  // 3. Extract Today's Signals
  const todayDateStr = date.slice(0, 10);
  const todaySignals = signals.filter(s => s.date === todayDateStr);

  // 4. Select Primary Insight
  const candidate = selectFreshInsight(
    {
      date,
      todaySignals,
      recentSignals: signals, // Simplified for now
      archivePatterns: patternScores,
      history,
    },
    'whatMySkyNoticed',
    'today',
  );

  const insights: GeneratedInsight[] = [];
  if (candidate) {
    const { pattern, angle, patternScore } = candidate;

    // Build movement language intro
    let bodyIntro = '';
    if (patternScore.movement === 'intensifying') {
      bodyIntro = 'This pattern appears louder than it has been recently. ';
    } else if (patternScore.movement === 'softening') {
      bodyIntro = 'This pattern is still present, but it seems to be softening. ';
    } else if (patternScore.movement === 'returning') {
      bodyIntro = 'This pattern appears to be returning. ';
    }

    const body = `${bodyIntro}${angle.observation} ${angle.pattern}`;
    
    // Shame-to-Clarity reframe construction
    const reframe = `This does not read as ${trimTerminalPunctuation(pattern.shameLabel)}. It reads as ${trimTerminalPunctuation(pattern.clarityReframe)}.`;

    insights.push({
      id: generateId(),
      slot: 'whatMySkyNoticed' as const,
      surface: 'today' as const,
      title: angle.title,
      body,
      reframe, 
      reflectionPrompt: angle.question,
      patternKey: pattern.key,
      angleKey: angle.key,
      confidence: patternScore.confidence,
      movement: patternScore.movement,
      evidence: patternScore.evidence,
      createdAt,
    });
  }

  // Handle slot: todaySignal (The most prominent daily signal)
  const strongestTodaySignal = [...todaySignals].sort((a, b) => b.strength - a.strength)[0];
  if (strongestTodaySignal) {
      // Find a pattern related to this signal for context
      const relatedPattern = ARCHIVE_PATTERNS.find(p => 
          p.requiredSignals.includes(strongestTodaySignal.key) || 
          p.supportingSignals.includes(strongestTodaySignal.key)
      );

      insights.push({
          id: generateId(),
          slot: 'todaySignal' as const,
          surface: 'today' as const,
          title: `Today’s ${strongestTodaySignal.key.replace(/_/g, ' ')}`,
          body: `Your archive is noticing a ${strongestTodaySignal.key.replace(/_/g, ' ')} focus today.`,
          reframe: relatedPattern ? `This connects to your ${relatedPattern.title} pattern.` : '',
          patternKey: relatedPattern?.key || 'unknown',
          confidence: 'moderate',
          movement: 'new',
          evidence: strongestTodaySignal.evidence ? [strongestTodaySignal.evidence] : [],
          createdAt
      });
  }

  return {
    signals,
    patternScores,
    insights: dedupeInsights(insights),
    primaryPersona,
  };
}
