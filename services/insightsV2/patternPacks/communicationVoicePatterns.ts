import type { ArchivePattern, SignalKey } from '../types';

const communicationVoicePattern = (
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
  category: 'communicationVoice',
  description,
  requiredSignals,
  supportingSignals,
  shameLabel,
  clarityReframe,
  lookbackDays: 90,
  minEvidenceCount: 3,
  minScore: 0.58,
  cooldownDays: 10,
  tags,
});

export const COMMUNICATION_VOICE_PATTERNS: ArchivePattern[] = [
  communicationVoicePattern(
    'communication_voice_001_exact_words',
    'The Need for Exact Words',
    ['need_for_exact_words'],
    ['deep_processing', 'truth_telling', 'repair_need', 'throat_tightness'],
    'overexplaining',
    'language trying to make the inner truth safe enough to share',
    'The user may need precise language before a feeling, repair, or boundary can feel safe to express.',
    ['language', 'precision', 'expression'],
  ),
  communicationVoicePattern(
    'communication_voice_002_voice_emerging',
    'The Emerging Voice',
    ['voice_emerging'],
    ['truth_telling', 'less_explaining', 'inner_authority', 'boundary_rebuilding'],
    'being too direct',
    'voice becoming clearer as self-trust gets stronger',
    'The archive may show a shift toward clearer expression with less apology or over-qualification.',
    ['voice', 'truth', 'self-trust'],
  ),
  communicationVoicePattern(
    'communication_voice_003_repair_conversation',
    'The Repair Conversation Pattern',
    ['repair_need'],
    ['tone_sensitivity', 'truth_over_harmony', 'overexplaining', 'rupture_sensitivity'],
    'making things awkward',
    'connection trying to become more honest instead of more fragile',
    'Repair needs may surface when the relationship wants more truth, clarity, or care after a rupture.',
    ['repair', 'conversation', 'truth'],
  ),
];
