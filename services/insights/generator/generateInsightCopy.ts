import {
  ArchivePattern,
  DailyInsightAngle,
  DailyInsightContext,
  GeneratedInsight,
} from '../types/knowledgeEngine';
import { generateId } from '../../storage/models';

/**
 * Generates the final personalized copy for an insight.
 */
export function generateInsightCopy(
  pattern: ArchivePattern,
  angle: DailyInsightAngle,
  context: DailyInsightContext,
): GeneratedInsight {
  const date = new Date().toISOString();

  // Combine frames
  const observation = angle.observationOverride || pattern.copyFrame.observation;
  const patternBody = angle.patternOverride || pattern.copyFrame.pattern;

  // Build movement/cross-source indicator
  let movementLabel = 'repeating';
  if (context.movement.includes('cross_source_match')) {
    movementLabel = 'cross_source_match';
  } else if (context.movement.includes('new_signal')) {
    movementLabel = 'new';
  }

  return {
    id: generateId(),
    slot: 'today_primary',
    title: angle.title,
    observation,
    pattern: patternBody,
    reframe: {
      shame: angle.shameFrame || pattern.copyFrame.reframe.shame,
      clarity: angle.clarityFrame || pattern.copyFrame.reframe.clarity,
    },
    prompt: angle.prompt,
    patternKey: pattern.key,
    confidence: 'moderate', // Placeholder
    movement: movementLabel as any,
    evidence: context.todaySignals.map((s) => s.evidence).filter((e): e is any => !!e),
    createdAt: date,
  };
}
