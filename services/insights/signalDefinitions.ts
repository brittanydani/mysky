import { SignalKey } from './types/knowledgeEngine';

export const SIGNALS: Record<string, { key: SignalKey; label: string }> = {
  // Rest & Energy
  REST_RESISTANCE: { key: 'rest_resistance', label: 'Rest Resistance' },
  LOW_ENERGY: { key: 'low_energy', label: 'Low Energy' },
  OVEREXTENSION: { key: 'overextension', label: 'Overextension' },
  HIGH_RESPONSIBILITY: { key: 'high_responsibility', label: 'High Responsibility' },
  SLEEP_DEBT: { key: 'sleep_debt', label: 'Sleep Debt' },
  GUILT_AROUND_STOPPING: { key: 'guilt_around_stopping', label: 'Guilt Around Stopping' },

  // Support & Relationships
  SUPPORT_SCARCITY: { key: 'support_scarcity', label: 'Support Scarcity' },
  SUPPORT_NEED: { key: 'support_need', label: 'Support Need' },
  SELF_BLAME: { key: 'self_blame', label: 'Self Blame' },
  LONELINESS: { key: 'loneliness', label: 'Loneliness' },
  GRATITUDE: { key: 'gratitude', label: 'Gratitude' },
  ENVY: { key: 'envy', label: 'Envy' },
  SMALL_CIRCLE: { key: 'small_circle', label: 'Small Circle' },
  FEAR_OF_BURDENING: { key: 'fear_of_burdening', label: 'Fear of Burdening' },
  MUTUALITY_NEED: { key: 'mutuality_need', label: 'Mutuality Need' },
  OVEREXPLAINING: { key: 'overexplaining', label: 'Over-explaining' },
  REASSURANCE_NEED: { key: 'reassurance_need', label: 'Reassurance Need' },

  // Processing & Cognitive
  DEEP_PROCESSING: { key: 'deep_processing', label: 'Deep Processing' },
  MEANING_MAKING: { key: 'meaning_making', label: 'Meaning Making' },
  NEED_FOR_EXACT_WORDS: { key: 'need_for_exact_words', label: 'Need for Exact Words' },
  PATTERN_RECOGNITION: { key: 'pattern_recognition', label: 'Pattern Recognition' },

  // Body & Somatic
  BODY_KNOWS_FIRST: { key: 'body_knows_first', label: 'Body Knows First' },
  CHEST_TIGHTNESS: { key: 'chest_tightness', label: 'Chest Tightness' },
  JAW_TENSION: { key: 'jaw_tension', label: 'Jaw Tension' },
  SHOULDER_TENSION: { key: 'shoulder_tension', label: 'Shoulder Tension' },
  STOMACH_UNEASE: { key: 'stomach_unease', label: 'Stomach Unease' },
  CALM_BRACING: { key: 'calm_bracing', label: 'Calm Bracing' },

  // Emotions & Growth
  LOW_CAPACITY: { key: 'low_capacity', label: 'Low Capacity' },
  BOUNDARY_GROWTH: { key: 'boundary_growth', label: 'Boundary Growth' },
  SELF_TRUST_GROWTH: { key: 'self_trust_growth', label: 'Self-Trust Growth' },
  TRANSFORMATION: { key: 'transformation', label: 'Transformation' },
  INJUSTICE_SENSITIVITY: { key: 'injustice_sensitivity', label: 'Injustice Sensitivity' },

  // Glimmers & Repair
  GLIMMER_QUIET_SAFETY: { key: 'glimmer_quiet_safety', label: 'Glimmer: Quiet Safety' },
  QUIET_AS_REPAIR: { key: 'quiet_as_repair', label: 'Quiet as Repair' },
  BEAUTY_REGULATION: { key: 'beauty_regulation', label: 'Beauty Regulation' },

  // Dreams
  DREAM_UNFINISHED_PROCESSING: { key: 'dream_unfinished_processing', label: 'Dream: Unfinished Processing' },
};
