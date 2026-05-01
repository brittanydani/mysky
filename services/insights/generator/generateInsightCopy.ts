import {
  ArchivePattern,
  DailyInsightAngle,
  DailyInsightContext,
  EvidenceAnchor,
  GeneratedInsight,
  PatternMovement,
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
  const contextDate = new Date(context.date);
  const date = Number.isFinite(contextDate.getTime()) ? contextDate.toISOString() : new Date().toISOString();

  // Combine frames
  const observation = angle.observationOverride || pattern.copyFrame.observation;
  const patternBody = angle.patternOverride || pattern.copyFrame.pattern;

  // Build movement/cross-source indicator
  let movementLabel: PatternMovement = 'repeating';
  if (context.movement.includes('cross_source_match')) {
    movementLabel = 'new';
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
    movement: movementLabel,
    evidence: context.todaySignals.map((s) => s.evidence).filter((e): e is EvidenceAnchor => !!e),
    createdAt: date,
  };
}
