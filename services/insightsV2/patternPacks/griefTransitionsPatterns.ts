import type { ArchivePattern, SignalKey } from '../types';

const griefTransitionsPattern = (
  key: string,
  title: string,
  requiredSignals: SignalKey[],
  supportingSignals: SignalKey[],
  shameLabel: string,
  clarityReframe: string,
  description: string,
  tags: string[] = [],
): ArchivePattern => ({
  key,
  title,
  category: 'griefTransitions',
  description,
  requiredSignals,
  supportingSignals,
  shameLabel,
  clarityReframe,
  lookbackDays: 180,
  minEvidenceCount: 3,
  minScore: 0.58,
  cooldownDays: 14,
  tags,
});

export const GRIEF_TRANSITIONS_PATTERNS: ArchivePattern[] = [
  griefTransitionsPattern(
    'grief_transitions_001_gratitude_and_grief',
    'Gratitude and Grief Together',
    ['gratitude_and_grief'],
    ['sadness', 'longing', 'relief', 'old_story_loosening'],
    'being ungrateful',
    'more than one truth living in the same chapter',
    'Gratitude and grief may appear together when something is meaningful and still changing.',
    ['grief', 'gratitude', 'two-truths'],
  ),
  griefTransitionsPattern(
    'grief_transitions_002_chapter_shift',
    'The Chapter Shift',
    ['chapter_shift'],
    ['old_story_loosening', 'identity_rewriting', 'future_self_orientation', 'longing'],
    'being unstable',
    'an old version loosening before the new one feels familiar',
    'The archive may show a liminal period where one life shape is ending before the next is fully known.',
    ['transition', 'chapter', 'identity'],
  ),
  griefTransitionsPattern(
    'grief_transitions_003_loss_as_information',
    'The Loss Signal',
    ['dream_loss'],
    ['fear_of_loss', 'sadness', 'longing', 'dream_unfinished_processing'],
    'dwelling on loss',
    'the psyche continuing to process what mattered',
    'Loss themes may return through dreams, longing, or fear when something important is still being integrated.',
    ['loss', 'dreams', 'integration'],
  ),
];
