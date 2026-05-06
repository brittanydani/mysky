import type {
  EvidenceAnchor,
  InsightDataSource,
  InsightRawInputs,
  SignalKey,
  UserSignal,
} from '../types';
import { compareSignalsByPrimarySource } from '../sourcePriority';
import { getSignalRoles, getSignalSentiment } from '../signalTaxonomy';
import { toLocalDateString } from '../../../utils/dateUtils';

type KeywordSignal = {
  key: SignalKey;
  terms: string[];
  strength?: number;
  label?: string;
};

function asDateKey(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    const dateOnly = trimmed.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly) && trimmed.length <= 10) {
      return dateOnly;
    }
    const date = new Date(trimmed);
    return Number.isFinite(date.getTime())
      ? toLocalDateString(date)
      : /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)
        ? dateOnly
        : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? toLocalDateString(date) : null;
  }
  return null;
}

function referenceDateKey(value: string | undefined): string {
  if (!value?.trim()) return toLocalDateString();
  const trimmed = value.trim();
  const dateOnly = trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly) && trimmed.length <= 10) {
    return dateOnly;
  }

  const parsed = new Date(trimmed);
  return Number.isFinite(parsed.getTime())
    ? toLocalDateString(parsed)
    : /^\d{4}-\d{2}-\d{2}$/.test(dateOnly)
      ? dateOnly
      : toLocalDateString();
}

function asSearchText(values: unknown[]): string {
  return values
    .flatMap((value) => {
      if (Array.isArray(value)) return value;
      return [value];
    })
    .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
    .join(' ')
    .toLowerCase();
}

function parseJson<T>(raw: unknown): T | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function clampStrength(value: number): number {
  return Math.max(0.25, Math.min(1, value));
}

function strengthFromScale(value: unknown, fallback = 0.6): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return clampStrength(0.35 + value * 0.13);
}

function strengthFromIntensity(value: unknown, fallback = 0.65): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return clampStrength(value > 5 ? value / 10 : 0.35 + value * 0.13);
}

function addSignal(
  signals: UserSignal[],
  key: SignalKey,
  source: InsightDataSource,
  date: string,
  strength: number,
  evidence: Omit<EvidenceAnchor, 'source' | 'date'> = {},
): void {
  const nextEvidence: EvidenceAnchor = { source, date, ...evidence };
  const duplicate = signals.some((signal) =>
    signal.key === key &&
    signal.source === source &&
    signal.date === date &&
    signal.evidence?.label === nextEvidence.label &&
    signal.evidence?.phrase === nextEvidence.phrase &&
    signal.evidence?.signal === nextEvidence.signal
  );

  if (duplicate) return;
  signals.push({
    key,
    source,
    date,
    strength: clampStrength(strength),
    sentiment: getSignalSentiment(key),
    roles: getSignalRoles(key),
    evidence: nextEvidence,
  });
}

function addKeywordSignals(
  signals: UserSignal[],
  source: InsightDataSource,
  date: string,
  searchable: string,
  mappings: KeywordSignal[],
  fallbackStrength: number,
): boolean {
  let matchedAny = false;
  for (const mapping of mappings) {
    const matched = mapping.terms.find((term) => searchable.includes(term));
    if (!matched) continue;

    matchedAny = true;
    addSignal(
      signals,
      mapping.key,
      source,
      date,
      mapping.strength ?? fallbackStrength,
      { label: mapping.label ?? matched.trim() },
    );
  }
  return matchedAny;
}

/**
 * Normalizes Daily Check-Ins into V2 UserSignals.
 */
export function normalizeDailyCheckInV2(checkIns: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  for (const ci of checkIns) {
    const date = asDateKey(ci.date);
    if (!date) continue;

    const mood = typeof ci.mood === 'number' ? ci.mood : ci.moodScore;
    const moodIsFivePointScale = typeof ci.mood === 'number';
    const energy = typeof ci.energy === 'number'
      ? ci.energy
      : ci.energyLevel === 'low'
        ? 1
        : ci.energyLevel === 'high'
          ? 5
          : 3;
    const stress = typeof ci.stress === 'number'
      ? ci.stress
      : ci.stressLevel === 'high'
        ? 5
        : ci.stressLevel === 'low'
          ? 1
          : 3;

    if (energy <= 2) {
      addSignal(signals, 'low_energy', 'dailyCheckIn', date, 0.8, {
        label: 'Low energy',
        value: energy,
      });
    }

    if (typeof mood === 'number' && mood <= 2) {
      addSignal(signals, 'low_mood', 'dailyCheckIn', date, 0.8, {
        label: 'Low mood',
        value: mood,
      });
    }

    if (stress >= 4) {
      addSignal(signals, 'high_stress', 'dailyCheckIn', date, 0.9, {
        label: 'High stress',
        value: stress,
      });
    }

    if (energy >= 4) {
      addSignal(signals, 'high_energy', 'dailyCheckIn', date, 0.72, {
        label: 'High energy',
        value: energy,
      });
    }

    if (stress <= 2) {
      addSignal(signals, 'low_stress', 'dailyCheckIn', date, 0.72, {
        label: 'Low stress',
        value: stress,
      });
    }

    if (typeof mood === 'number' && (moodIsFivePointScale ? mood >= 4 : mood >= 7)) {
      addSignal(signals, 'mood_improvement', 'dailyCheckIn', date, 0.68, {
        label: 'Mood lift',
        value: mood,
      });
    }

    const tagMap: Record<string, SignalKey[]> = {
      rest: ['rest_resistance'],
      overwhelmed: ['overextension'],
      lonely: ['loneliness'],
      gratitude: ['relief'],
      boundaries: ['boundary_rebuilding'],
      work: ['responsibility_weight', 'mental_load'],
      school: ['responsibility_weight', 'values_conflict'],
      busy: ['time_scarcity', 'mental_load'],
      rushed: ['time_scarcity'],
      productive: ['preparedness', 'high_standards', 'productivity_before_pleasure'],
      focused: ['preparedness'],
      flexible: ['flexibility_need', 'freedom_before_ambition', 'contextual_standards'],
      ease: ['ease_over_achievement', 'low_pressure_motivation'],
      steady: ['steady_mood_baseline', 'low_emotional_variability'],
      stable: ['stable_core_self', 'continuity_grounding'],
      closure: ['clean_closure', 'direct_closure_need'],
      future: ['future_preoccupation', 'already_thinking_next'],
      present: ['current_moment_grounding', 'present_focus'],
      planning: ['preparedness', 'mental_load'],
      goals: ['future_self_orientation', 'wants_to_build'],
      chores: ['invisible_labor', 'mental_load'],
      routine: ['ritual_regulation'],
      writing: ['creative_processing', 'expression_need'],
      art: ['creative_processing', 'creative_aliveness'],
      music: ['creative_processing', 'creative_aliveness'],
      design: ['beauty_making', 'beauty_regulation'],
      voice: ['voice_emerging'],
      expressive: ['immediate_expression', 'open_communication_need'],
      direct: ['direct_communication_preference', 'clear_over_implied', 'plain_direct_speech'],
      action: ['action_forward_processing', 'what_now_focus'],
      blocked: ['creative_block'],
      identity: ['self_definition', 'identity_rewriting'],
      growth: ['growth_edge', 'transformation_season'],
      permission: ['permission_shift', 'self_trust_growth'],
      boundary: ['boundary_rebuilding', 'limits_tested'],
      no: ['says_no', 'boundary_guilt'],
      clear: ['firm_inner_knowing', 'quick_limit_clarity'],
      autonomy: ['autonomy_need', 'inner_authority'],
      decision: ['decision_uncertainty'],
      creative: ['creative_aliveness', 'wants_to_build'],
      calm: ['quiet_safety', 'low_stress'],
      unbraced: ['familiar_calm', 'unbraced_stillness'],
      peaceful: ['quiet_safety'],
      neutral: ['silence_neutral', 'low_relational_tracking'],
      rested: ['restorative_moment', 'body_lightness'],
      resting: ['easy_rest', 'restorative_pause'],
      energized: ['high_energy', 'mood_improvement'],
      hopeful: ['hope'],
      connected: ['connection_glimmer', 'relief'],
      supported: ['support_abundance_shift', 'receiving_openness'],
      help: ['support_need', 'asks_for_support'],
      'defined support': ['defined_support', 'selective_helping'],
      receiving: ['receiving_care_difficulty'],
      receive: ['open_receiving', 'receiving_openness'],
      compliment: ['compliment_lands', 'open_receiving'],
      burden: ['fear_of_being_too_much'],
      community: ['chosen_family', 'connection_glimmer'],
      belonging: ['belonging_ache', 'wants_to_be_seen'],
      family: ['family_pattern_awareness', 'family_individuation'],
      culture: ['family_loyalty_tension', 'values_conflict'],
      home: ['home_as_safety', 'rooting_need'],
      money: ['scarcity_scanning'],
      bills: ['scarcity_scanning'],
      finances: ['scarcity_scanning'],
      caregiving: ['caretaking_pressure', 'protective_care'],
      childcare: ['caretaking_pressure', 'protective_care'],
      faith: ['faith_meaning'],
      spiritual: ['spiritual_depth', 'meaning_making'],
      practical: ['concrete_over_symbolic', 'what_happened_what_helps', 'function_over_feeling'],
      justice: ['justice_sensitivity', 'fairness_need'],
      peace: ['peace_boundary', 'quiet_safety'],
      safe: ['quiet_safety', 'somatic_safety'],
      joy: ['joy_tolerance', 'mood_improvement', 'joy_recovery', 'joy_as_meaning'],
      playful: ['play_glimmer', 'joy_tolerance', 'natural_play'],
      sensory: ['sensory_sensitivity'],
      overstimulated: ['sensory_sensitivity', 'needs_pause'],
      noise: ['sensory_sensitivity'],
      loud: ['sensory_sensitivity'],
      lights: ['sensory_sensitivity'],
      bright: ['sensory_sensitivity'],
      crowded: ['sensory_sensitivity'],
      clutter: ['sensory_sensitivity'],
      screens: ['sensory_sensitivity'],
      interrupted: ['needs_pause', 'calm_bracing'],
      transition: ['needs_pause'],
      buffer: ['needs_pause', 'ritual_regulation'],
      switching: ['decision_uncertainty', 'mental_load'],
      'task switching': ['decision_uncertainty', 'mental_load'],
      'context switching': ['decision_uncertainty', 'mental_load'],
      masking: ['selective_vulnerability', 'becoming_visible'],
      unmasking: ['becoming_visible', 'wants_to_be_seen'],
    };

    for (const tag of ci.tags ?? []) {
      for (const key of tagMap[String(tag).toLowerCase()] ?? []) {
        addSignal(signals, key, 'dailyCheckIn', date, 0.7, { label: String(tag) });
      }
    }
  }

  return signals.sort(compareSignalsByPrimarySource);
}

/**
 * Normalizes Journals into V2 UserSignals.
 */
export function normalizeJournalV2(journals: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  const journalSignals: KeywordSignal[] = [
    { key: 'rest_guilt', terms: ['guilt', 'guilty for resting'] },
    { key: 'guilt', terms: ['guilt', 'guilty'] },
    { key: 'rest_resistance', terms: ['lazy', 'earn rest'] },
    { key: 'responsibility_weight', terms: ['must', 'responsibility', 'responsible', 'carry', 'deadline', 'work'] },
    { key: 'excellence_pressure', terms: ['should', 'perfect', 'do better', 'not good enough'] },
    { key: 'meaning_making', terms: ['meaning'] },
    { key: 'asks_why', terms: ['why'] },
    { key: 'support_need', terms: ['support'] },
    { key: 'asks_for_support', terms: ['asked for help', 'asked for support', 'reached out', 'asked someone', 'told them i need', 'told someone i need'] },
    { key: 'support_scarcity', terms: ['unsupported', 'under-supported', 'no support', 'not enough support'] },
    { key: 'minimizes_need', terms: ["it's fine", 'its fine', 'not a big deal', "don't want to bother", 'dont want to bother', 'i can handle it', 'should not need', "shouldn't need", 'minimized my need'] },
    { key: 'wants_to_be_caught', terms: ['wish someone noticed', 'wanted someone to notice', 'check in on me', 'checked in on me', 'catch me before', 'without asking'] },
    { key: 'receiving_care_difficulty', terms: ['hard to receive', 'hard receiving', 'awkward receiving', 'deflected help', 'deflect help', 'could not accept help', "couldn't accept help"] },
    { key: 'fear_of_being_too_much', terms: ['too much', 'a burden', 'burden', 'needy', 'overwhelming people', 'too needy'] },
    { key: 'loneliness', terms: ['alone'] },
    { key: 'hurt', terms: ['hurt', 'hurt me', 'hurt by', 'painful', 'wounded'] },
    { key: 'grief', terms: ['grief', 'grieving', 'loss', 'mourning'] },
    { key: 'anger', terms: ['angry'] },
    { key: 'belonging_ache', terms: ['do not belong', "don't belong", 'dont belong', 'not belong', 'not fit', 'not fitting', 'out of place', 'outsider', 'excluded', 'left out', 'not represented'] },
    { key: 'chosen_family', terms: ['chosen family', 'found family', 'my people', 'community care', 'mutual aid', 'safe community'] },
    { key: 'small_circle_pressure', terms: ['small circle', 'small support system', 'only person i can ask', 'no one else to ask'] },
    { key: 'family_pattern_awareness', terms: ['family pattern', 'my family', 'parent', 'parents', 'childhood', 'generational', 'inherited'] },
    { key: 'family_loyalty_tension', terms: ['family obligation', 'cultural expectation', 'cultural expectations', 'tradition', 'loyalty', 'disappoint my family'] },
    { key: 'breaks_old_pattern', terms: ['break the cycle', 'break cycle', 'not pass this on', 'do it differently', 'pattern breaker'] },
    { key: 'family_individuation', terms: ['stay closer to who i am around family', 'stay myself around family', 'do not shift as much around family', "don't shift as much around family"] },
    { key: 'old_roles_observed', terms: ['old roles still exist', 'old roles may still exist', 'recognize old roles', 'without stepping back into them'] },
    { key: 'not_family_emotional_manager', terms: ['not responsible for maintaining the emotional balance', 'family emotional balance', 'not mine to manage around family'] },
    { key: 'neutral_family_presence', terms: ['family feels more neutral', 'being with family feels more neutral', 'neutral than intense'] },
    { key: 'intentional_family_involvement', terms: ['choose how involved i want to be', 'distance and closeness can both be intentional', 'involved rather than reacting'] },
    { key: 'old_pattern_nonparticipation', terms: ['old pattern and decide not to participate', 'not participate in it the same way', 'old pattern without participating'] },
    { key: 'expectation_not_identity', terms: ['expectation does not automatically become identity', 'pressure to be a certain version', 'certain version of myself around family'] },
    { key: 'grounded_around_family_intensity', terms: ['stay grounded even if others are reacting strongly', 'their intensity does not pull me in', 'others reacting strongly'] },
    { key: 'low_family_lingering', terms: ['not carry family dynamics with me after', 'family dynamics with me after i leave', 'environment stays where it happened'] },
    { key: 'autonomy_in_family_connection', terms: ['connection without losing autonomy', 'remain myself in familiar spaces', 'familiar spaces'] },
    { key: 'family_self_with_old_roles', terms: ['more like myself around family than i used to', 'old roles trying to come back online', 'come back online'] },
    { key: 'family_responsibility_automatic', terms: ['not responsible for the whole family dynamic anymore', 'responsibility feel automatic', 'familiar patterns can still make responsibility'] },
    { key: 'current_self_old_role_pull', terms: ['grounded in who i am now', 'pulled into who i had to be before', 'who i had to be before'] },
    { key: 'family_activates_old_parts', terms: ['family may not fully define me', 'activate parts of me', 'other environments do not reach'] },
    { key: 'family_choice_effort', terms: ['able to choose more than i once could', 'choosing still takes effort', 'choose more than i once could'] },
    { key: 'old_expectations_body_pressure', terms: ['old expectations may not control me', 'pressure in my body', 'create pressure in my body'] },
    { key: 'old_guilt_after_new_response', terms: ['responding differently now', 'old guilt afterward', 'feeling the old guilt afterward'] },
    { key: 'separate_pattern_mixed', terms: ['separate from the family pattern', 'freeing and uncomfortable', 'freeing and uncomfortable at the same time'] },
    { key: 'autonomy_history_loaded', terms: ['more autonomy now', 'history still has a way', 'moments feel loaded'] },
    { key: 'connected_without_old_identity', terms: ['staying connected where it is healthy', 'without handing my identity back', 'old role'] },
    { key: 'family_dynamics_pull_in', terms: ['family dynamics pull me in', 'family dynamics pull you in', 'before i realize it is happening'] },
    { key: 'old_roles_feel_current', terms: ['old roles can still feel current', 'old roles still feel current', 'around certain people'] },
    { key: 'adult_body_old_position', terms: ['adult now but my body can respond', 'body can respond like i am back', 'back in an older position'] },
    { key: 'family_expectations_louder', terms: ['family expectations may feel louder', 'louder than my own preferences', 'own preferences in the moment'] },
    { key: 'family_residue_carried', terms: ['still carrying the emotional residue', 'emotional residue with me', 'leave family interactions still carrying'] },
    { key: 'old_pattern_wants_unclear', terms: ['hard to tell what i actually want', 'old pattern is active', 'what i actually want when the old pattern'] },
    { key: 'peacekeeping_responsibility', terms: ['responsible for keeping the peace', 'keeping the peace even when no one directly asked', 'no one directly asked'] },
    { key: 'autonomy_harder_in_family', terms: ['autonomy may be real', 'harder to access around familiar dynamics', 'autonomy is real but harder'] },
    { key: 'smaller_younger_less_separate', terms: ['smaller younger or less separate', 'less separate than i am', 'family moments make me feel smaller'] },
    { key: 'old_role_not_current_self', terms: ['old role can feel familiar', 'without being who i am now', 'who you are now'] },
    { key: 'home_as_safety', terms: ['safe at home', 'home felt safe', 'home feels safe', 'my room', 'my apartment', 'sanctuary'] },
    { key: 'rooting_need', terms: ['roots', 'rooted', 'stability', 'stable base', 'home base', 'housing', 'place to land'] },
    { key: 'caretaking_pressure', terms: ['caregiver', 'caregiving', 'childcare', 'eldercare', 'taking care of my', 'caring for my'] },
    { key: 'protective_care', terms: ['protect them', 'keep them safe', 'my kid', 'my child', 'my pet', 'elderly parent'] },
    { key: 'scarcity_scanning', terms: ['money', 'rent', 'bills', 'groceries', 'finances', 'financial', 'budget', 'income', 'job security', 'housing cost', 'medical bills'] },
    { key: 'fear_of_loss', terms: ['lose my job', 'lose housing', 'lose the apartment', 'lose stability', 'lose support', 'taken away'] },
    { key: 'energy_scarcity', terms: ['ration energy', 'rationing energy', 'limited energy', 'spoons', 'conserve energy'] },
    { key: 'values_conflict', terms: ['against my values', 'not aligned', 'misaligned', 'values conflict', 'institution', 'bureaucracy'] },
    { key: 'integrity_cost', terms: ['cost me to be honest', 'cost of honesty', 'choosing alignment', 'choose alignment'] },
    { key: 'contextual_standards', terms: ['adapt my standards depending on the situation', 'standards depending on the situation', 'what matters can shift based on context'] },
    { key: 'good_enough_acceptance', terms: ['good enough can feel acceptable', 'things are imperfect', 'not feel strong internal tension when things are imperfect'] },
    { key: 'practicality_over_alignment', terms: ['prioritize practicality over strict alignment', 'what works can matter more than what is ideal', 'practicality over alignment'] },
    { key: 'flexibility_over_consistency', terms: ['flexibility can feel more useful than consistency', 'not hold every situation to the same standard', 'same standard'] },
    { key: 'moves_without_full_resolution', terms: ['move forward even when something is not fully resolved', "move forward even when something isn't fully resolved", 'completion does not always require full clarity'] },
    { key: 'low_inconsistency_dwelling', terms: ['not dwell on small inconsistencies', 'small inconsistencies', 'details may not feel as important'] },
    { key: 'tradeoff_comfort', terms: ['comfortable making tradeoffs', 'making tradeoffs', 'not everything has to match perfectly'] },
    { key: 'low_misalignment_challenge', terms: ['not feel a strong need to challenge every misalignment', 'challenge every misalignment', 'left as they are'] },
    { key: 'outcomes_over_principles', terms: ['outcomes over principles', 'results can carry more weight than process', 'value outcomes over principles'] },
    { key: 'firm_when_matters', terms: ['matters enough to hold more firmly', 'hold more firmly'] },
    { key: 'values_with_tradeoffs', terms: ['doing what feels right while still understanding', 'real life sometimes requires tradeoffs', 'requires tradeoffs'] },
    { key: 'compromise_discernment', terms: ['not every compromise feels like betrayal', 'knowing the difference matters', 'compromise feels like betrayal'] },
    { key: 'flexible_details_firm_principle', terms: ['flexible on details', 'firm about the deeper principle', 'deeper principle underneath'] },
    { key: 'practicality_without_replacing_values', terms: ['practicality can matter', 'without replacing my values', 'without replacing your values'] },
    { key: 'small_bend_not_crossed', terms: ['willing to bend when the cost is small', 'something important in me feels crossed', 'feels crossed'] },
    { key: 'workable_option_cost', terms: ['workable option while still noticing what it costs', 'what it costs emotionally', 'choose the workable option'] },
    { key: 'integrity_lines_not_perfection', terms: ['integrity may be less about perfection', 'lines i cannot comfortably cross', 'cannot comfortably cross'] },
    { key: 'ambiguity_not_dishonesty', terms: ['tolerate ambiguity when needed', 'but not dishonesty', 'not dishonesty'] },
    { key: 'practical_choice_inner_check', terms: ['choices may look practical from the outside', 'internal check-in', 'requiring an internal check'] },
    { key: 'adaptable_not_negotiating_values', terms: ['staying adaptable without slowly negotiating away', 'negotiating away what matters most', 'without slowly negotiating away'] },
    { key: 'quick_values_conflict', terms: ['internal conflict quickly', 'does not match my values', 'does not match your values'] },
    { key: 'compromise_deep_cost', terms: ['compromise can feel costly', 'touches something that matters deeply', 'matters deeply'] },
    { key: 'good_enough_misaligned', terms: ['good enough if it feels dishonest', 'feels dishonest or misaligned', 'dishonest or misaligned'] },
    { key: 'practical_but_wrong_body_resist', terms: ['look practical but feel wrong', 'body may resist choices', 'practical but feel wrong'] },
    { key: 'conscience_settling', terms: ['actions to match my conscience', 'match your conscience', 'before i can feel settled'] },
    { key: 'small_misalignment_bothers', terms: ['small misalignments may bother', 'more than others expect', 'small misalignments'] },
    { key: 'harder_honest_path', terms: ['harder honest path', 'easier one that costs my integrity', 'costs your integrity'] },
    { key: 'principle_limits_flexibility', terms: ['principle underneath feels important', 'flexibility may be difficult', 'principle underneath'] },
    { key: 'truth_named_before_move_on', terms: ['until something feels named truthfully', 'named truthfully', 'not be able to move on'] },
    { key: 'integrity_without_perfection', terms: ['protecting my integrity without requiring', 'perfect standard', 'protecting your integrity'] },
    { key: 'justice_sensitivity', terms: ['discrimination', 'racism', 'sexism', 'homophobia', 'transphobia', 'ableism', 'classism', 'bias', 'institutional harm'] },
    { key: 'fairness_need', terms: ['unfair', 'unequal', 'double standard', 'bias'] },
    { key: 'faith_meaning', terms: ['faith', 'prayer', 'church', 'god'] },
    { key: 'spiritual_depth', terms: ['spiritual', 'sacred', 'soul', 'ancestors', 'ancestral'] },
    { key: 'purpose_signal', terms: ['calling', 'service', 'cause', 'community work'] },
    { key: 'legacy_signal', terms: ['legacy', 'future generations', 'next generation', 'ancestors'] },
    { key: 'time_scarcity', terms: ['rushing', 'rushed', 'not enough time', 'too little time', 'deadline', 'behind schedule'] },
    { key: 'mental_load', terms: ['mental load', 'too much to remember', 'tracking everything', 'juggling'] },
    { key: 'always_on', terms: ['always on', 'switched on', 'cannot turn off', 'on alert', 'on call'] },
    { key: 'preparedness', terms: ['prepare', 'prepared', 'planning', 'plan ahead', 'checklist'] },
    { key: 'overfunctioning', terms: ['doing everything', 'handle everything', 'overfunction', 'take over'] },
    { key: 'low_pressure_motivation', terms: ['not motivated by pressure', 'pressure makes my energy drop', 'pressure makes me shut down', 'low pressure'] },
    { key: 'flexibility_need', terms: ['need flexibility', 'needed flexibility', 'room to breathe', 'space to breathe', 'flexible structure'] },
    { key: 'ease_over_achievement', terms: ['ease matters more than progress', 'ease over achievement', 'life feels livable', 'livable life', 'care more about ease'] },
    { key: 'obligation_resistance', terms: ['turn into an obligation', 'became an obligation', 'feels like an obligation', 'not everything needs to be a project', 'become a project'] },
    { key: 'freedom_before_ambition', terms: ['need freedom before ambition', 'freedom before ambition', 'feel trapped and unmotivated', 'motivation needs freedom'] },
    { key: 'burst_pacing', terms: ['move in bursts', 'work in bursts', 'bursts of energy', 'bursts rather than steady', 'inspiration comes in bursts'] },
    { key: 'notices_need_without_job', terms: ['needs attention without automatically making it my job', 'without automatically making it my job', 'notice what needs attention'] },
    { key: 'help_pull_with_boundary', terms: ['feel the pull to help', 'stepping back is healthier', 'pull to help even when'] },
    { key: 'emotional_not_practical_responsibility', terms: ['responsible emotionally without wanting to become responsible practically', 'responsible emotionally', 'responsible practically'] },
    { key: 'care_without_action', terms: ['care deeply while still letting someone else handle', 'care does not always have to become action', 'letting someone else handle their part'] },
    { key: 'ownership_pause', terms: ['pause before deciding whether it actually belongs to me', 'pause before deciding whether it belongs', 'actually belongs to me'] },
    { key: 'guilt_for_not_stepping_in', terms: ['guilty for not stepping in', 'not stepping in', 'made the right choice'] },
    { key: 'need_not_assignment', terms: ['noticing a need is not the same as being assigned', 'need is not the same as being assigned', 'assigned to meet it'] },
    { key: 'limits_protect_care', terms: ['care more sustainable when it has limits', 'limit does not erase the care', 'limit protects the care'] },
    { key: 'tracks_without_fixing', terms: ['track what is happening but no longer move as quickly into fixing', 'track what is happening', 'no longer move as quickly into fixing'] },
    { key: 'concern_without_overresponsibility', terms: ['concern exist without turning it into over-responsibility', 'concern without over-responsibility', 'without turning it into over-responsibility'] },
    { key: 'careful_about_taken_on', terms: ['careful about what i take on', 'careful about what you take on', 'becoming more careful about what i take on'] },
    { key: 'chosen_support', terms: ['helping feels better when it is chosen', 'chosen not automatic', 'helping is chosen'] },
    { key: 'capacity_before_support', terms: ['pause before offering support', 'whether i actually have capacity', 'asking myself whether i have capacity'] },
    { key: 'care_not_availability', terms: ['care does not have to mean availability', 'care does not mean availability', 'care not availability'] },
    { key: 'show_up_when_yours', terms: ['when responsibility is truly mine', 'when responsibility is truly yours', 'show up fully'] },
    { key: 'old_overgive_pull', terms: ['old pull to overgive', 'overgive even while knowing it will cost', 'knowing it will cost me'] },
    { key: 'bounded_care_redefinition', terms: ['redefining care as something with boundaries', 'care as something with boundaries', 'not something endless'] },
    { key: 'support_without_guilt', terms: ['support is more meaningful when it does not come from guilt', 'support without guilt', 'does not come from guilt'] },
    { key: 'generous_without_self_abandoning', terms: ['generous but less willing to abandon myself', 'less willing to abandon myself', 'abandon yourself in the process'] },
    { key: 'sustainable_care', terms: ['sustainable care is still real care', 'sustainable care', 'real care'] },
    { key: 'big_hopes_structure_heavy', terms: ['big hopes but too much structure', 'too much structure can make them feel heavy', 'structure can make them feel heavy'] },
    { key: 'cares_resists_pressure', terms: ['care deeply about doing well while resisting pressure', 'resisting the pressure that comes with caring', 'pressure that comes with caring'] },
    { key: 'goal_as_test_shutdown', terms: ['goal starts feeling like a test', 'motivation disappears when a goal', 'feeling like a test'] },
    { key: 'experiment_room_motivation', terms: ['room to experiment', 'not when every step feels measured', 'move best when there is room'] },
    { key: 'progress_without_productivity_life', terms: ['progress without wanting my whole life organized around productivity', 'whole life organized around productivity', 'progress without productivity'] },
    { key: 'burst_ambition', terms: ['ambition may show up in bursts', 'ambition in bursts', 'when inspiration is there'] },
    { key: 'success_not_constant_output', terms: ['success that requires constant output', 'not toward constant output', 'requires constant output'] },
    { key: 'freedom_restores_care', terms: ['free enough to care about it again', 'feel free enough to care', 'care about it again'] },
    { key: 'loved_goal_becomes_have_to', terms: ['something i love becomes something i have to do', 'something you love becomes something you have to do', 'becomes something i have to do'] },
    { key: 'supportive_structure_not_cage', terms: ['structure to support my goals without turning them into a cage', 'without turning them into a cage', 'support goals without turning them into a cage'] },
    { key: 'responsibility_not_noticed_early', terms: ['not notice what needs attention right away', 'needs attention right away', 'quickly feel pulled into it'] },
    { key: 'responsibility_registers_intense', terms: ['responsibility may not feel constant', 'become intense once something registers', 'registers as important'] },
    { key: 'not_mine_to_should_handle', terms: ['this is not mine to i should handle this', 'this isn’t mine to i should handle this', 'i should handle this'] },
    { key: 'selective_obligation_activation', terms: ['not track everything', 'activate a strong sense of obligation', 'strong sense of obligation'] },
    { key: 'clear_need_sudden_urgency', terms: ['something becomes clear', 'sudden urgency to respond', 'urgency to respond'] },
    { key: 'step_in_after_involved', terms: ['step in fully once i feel involved', 'step in fully once you feel involved', 'distant before'] },
    { key: 'responsibility_waves', terms: ['responsibility may come in waves', 'come in waves rather than staying consistent', 'responsibility waves'] },
    { key: 'surprised_by_taken_on', terms: ['surprised by how much i take on', 'how much i take on once something matters', 'take on once something matters'] },
    { key: 'responsibility_arrives_unprepared', terms: ['not prepare for responsibility', 'feel it strongly once it arrives', 'responsibility arrives'] },
    { key: 'earlier_notice_less_all_or_nothing', terms: ['noticing earlier', 'engagement does not have to become all-or-nothing', 'all-or-nothing'] },
    { key: 'helps_before_capacity_check', terms: ['help before checking whether i actually have the capacity', 'before checking whether i actually have capacity', 'step in to help before checking'] },
    { key: 'automatic_giving_need', terms: ['giving can feel automatic', 'someone else needs something', 'automatic especially when someone else needs'] },
    { key: 'energy_cost_after_commit', terms: ['impact on my energy after i have already committed', 'after i have already committed', 'already committed'] },
    { key: 'yes_before_pause', terms: ['easier to say yes than to pause', 'say yes than to pause', 'pause and decide'] },
    { key: 'limits_noticed_after_crossed', terms: ['not notice limits until they have already been crossed', 'already been crossed', 'limits until they have already'] },
    { key: 'natural_help_overwhelming', terms: ['helping may feel natural even when it becomes overwhelming', 'helping feels natural even when', 'becomes overwhelming'] },
    { key: 'other_need_before_own', terms: ['prioritize someone else’s need before checking my own', "prioritize someone else's need before checking my own", 'before checking my own'] },
    { key: 'responsible_after_involved', terms: ['feel responsible once i am already involved', 'responsible once you are already involved', 'once i am already involved'] },
    { key: 'pulling_back_harder', terms: ['pulling back can feel harder than stepping in', 'harder than stepping in', 'pulling back'] },
    { key: 'pause_before_giving', terms: ['adding a pause before i give', 'pause before you give', 'not after'] },
    { key: 'clear_expectations_motivation', terms: ['motivated when expectations are clear', 'expectations are clear and the stakes are real', 'stakes are real'] },
    { key: 'pressure_sharpens_focus', terms: ['pressure can sharpen my focus', 'pressure can sharpen your focus', 'ease feel unproductive'] },
    { key: 'deadline_standard_best_work', terms: ['best work when there is a deadline', 'deadline standard or goal', 'goal to meet'] },
    { key: 'structure_directs_energy', terms: ['structure helps me feel safe', 'where to put my energy', 'where to put your energy'] },
    { key: 'freedom_without_direction_discomfort', terms: ['too much freedom and not enough direction', 'not enough direction', 'too much freedom'] },
    { key: 'achievement_momentum_slowing_loss', terms: ['achievement may give me momentum', 'slowing down feel like losing ground', 'losing ground'] },
    { key: 'self_trust_when_performing', terms: ['trust myself more when i am performing well', 'performing well', 'trust yourself more when you are performing'] },
    { key: 'drive_less_without_pressure', terms: ['without pressure', 'less connected to my drive', 'less connected to your drive'] },
    { key: 'demand_capable_obligation', terms: ['highly capable under demand', 'desire instead of obligation', 'under demand'] },
    { key: 'meaning_not_only_pressure', terms: ['motivation can come from meaning', 'not only pressure', 'meaning not only pressure'] },
    { key: 'same_capacity_expectation', terms: ['same capacity all day', 'function the same', 'same way at every point', 'same capacity'] },
    { key: 'pushes_low_capacity', terms: ['push through low capacity', 'pushed through low capacity', 'stopping feels inefficient', 'push through low-energy'] },
    { key: 'schedule_over_capacity', terms: ['schedule not capacity', 'calendar over capacity', 'tasks where they fit schedule', 'placed on the schedule'] },
    { key: 'overrides_tiredness', terms: ['override tiredness', 'tiredness as something to override', 'pushed past tiredness', 'ignore tiredness'] },
    { key: 'willpower_over_timing', terms: ['willpower solves timing', 'willpower over timing', 'expect willpower', 'right window'] },
    { key: 'ignores_energy_patterns', terms: ['ignore fluctuations', 'ignore energy patterns', 'not plan around energy', 'miss useful patterns'] },
    { key: 'decision_uncertainty', terms: ['decision', 'decide', 'choose', 'choice', 'stuck choosing', 'task switching', 'context switching', 'switching tasks', 'switch contexts', 'change gears', 'changing gears'] },
    { key: 'clarity_before_release', terms: ['need clarity', 'needed clarity', 'clarity before', 'understand before', 'understand it before', 'understand it first'] },
    { key: 'analysis_as_regulation', terms: ['analyze', 'analyzing', 'analysis helps', 'logic helps', 'make a system', 'made a system', 'make it make sense', 'map it out'] },
    { key: 'intellectualizes_feeling', terms: ['intellectualize', 'intellectualizing', 'thinking instead of feeling', 'in my head', 'think before i feel'] },
    { key: 'seeks_context', terms: ['need context', 'needed context', 'full context', 'full picture', 'backstory', 'missing context'] },
    { key: 'need_for_exact_words', terms: ['exact words', 'precise words', 'right words', 'accurate words'] },
    { key: 'pattern_recognition', terms: ['pattern', 'patterns', 'systems', 'map it', 'mapping'] },
    { key: 'deep_processing', terms: ['deep process', 'deep processing', 'need time to process', 'needed time to process', 'process slowly'] },
    { key: 'action_forward_processing', terms: ['process through action', 'action helps', 'do something about it', 'took action', 'kept moving'] },
    { key: 'move_on_orientation', terms: ['move on', 'moved on', 'moving on', 'not dwell', "don't dwell", 'dont dwell', 'leave it behind', 'left it behind'] },
    { key: 'what_now_focus', terms: ['what now', 'next step', 'next steps', 'what comes next'] },
    { key: 'quick_recovery', terms: ['bounced back', 'bounce back', 'got over it quickly', 'past it quickly', 'moved past it'] },
    { key: 'present_focus', terms: ['stay present', 'stayed present', 'staying present', 'focus on now', 'focused on now', 'in the moment'] },
    { key: 'lets_it_pass', terms: ['let it pass', 'let things pass', 'let it go', 'did not revisit', "didn't revisit", 'didnt revisit'] },
    { key: 'clean_closure', terms: ['clean closure', 'recognized it was done', 'ending is enough', 'let that be enough'] },
    { key: 'future_after_ending', terms: ['what comes next after it ended', 'attention shifted forward', 'shift toward what comes next', 'organizing around the future'] },
    { key: 'lets_endings_complete', terms: ['situation is over', 'allowed it to be over', 'let the ending complete', 'felt honored and moved on'] },
    { key: 'direct_closure_need', terms: ['named directly', 'closure helps me move', 'ending named directly', 'when it is named'] },
    { key: 'memory_without_attachment', terms: ['memory without attachment', 'matter without staying active', 'past remains meaningful', 'separate memory from attachment'] },
    { key: 'relief_after_ending', terms: ['relief once it ended', 'relief after ending', 'clarity easier than suspended', 'uncertain chapter ended'] },
    { key: 'closure_wanted_feelings_lag', terms: ['want closure so i can move on', 'feelings do not follow that timeline', 'closure so you can move on'] },
    { key: 'ready_then_resurfacing', terms: ['ready to leave something behind', 'resurfacing unexpectedly', 'leave something behind then'] },
    { key: 'resolution_processing_split', terms: ['part of me wants resolution', 'another part still has something to process', 'wants resolution'] },
    { key: 'done_but_unfinished_underneath', terms: ['think i am done only to realize', 'still something unfinished underneath', 'unfinished underneath'] },
    { key: 'forward_with_waves', terms: ['moving forward may be real', 'comes back in waves', 'forward with waves'] },
    { key: 'unwanted_revisiting', terms: ['not want to revisit something', 'bring it back anyway', 'moments bring it back'] },
    { key: 'closure_decision_grief_schedule', terms: ['closure may feel like a decision', 'grief moves on its own schedule', 'grief schedule'] },
    { key: 'settled_then_returns_frustration', terms: ['frustrated when something returns after i thought it was settled', 'after i thought it was settled', 'thought it was settled'] },
    { key: 'moving_on_still_affected', terms: ['moving on and still affected', 'moving on and you are still affected', 'still affected'] },
    { key: 'forward_and_returning_feelings', terms: ['forward movement and returning feelings', 'without forcing one to cancel the other', 'returning feelings'] },
    { key: 'future_preoccupation', terms: ['what is next more than now', 'future feels more real', 'future more important', 'think about what comes next'] },
    { key: 'change_over_present', terms: ['what needs to change instead of what is', 'focus on change instead of present', 'what needs to improve'] },
    { key: 'planning_over_presence', terms: ['planning ahead more comfortable', 'planning ahead feels safer', 'planning instead of sitting with'] },
    { key: 'restless_without_progress', terms: ['restless when nothing moves forward', 'nothing actively moving forward', 'restless without progress'] },
    { key: 'present_as_stepping_stone', terms: ['present feels like a stepping stone', 'not a place to stay', 'stepping stone rather than stay'] },
    { key: 'already_thinking_next', terms: ['already thinking about what comes next', 'thinking about next while experiencing', 'attention drifts to possibilities'] },
    { key: 'current_moment_grounding', terms: ['connected to the current moment', 'what is happening now', 'current moment than'] },
    { key: 'low_future_urgency', terms: ['long term direction may not feel urgent', 'direction does not feel urgent', 'unless something clearly needs to change'] },
    { key: 'lives_without_interpreting', terms: ['simply lived', 'not constantly interpreted', 'larger purpose'] },
    { key: 'current_reality_decisions', terms: ['current reality rather than', 'fits my current reality', 'based on what fits'] },
    { key: 'long_term_planning_overwhelm', terms: ['overwhelmed by too much planning ahead', 'too much planning ahead', 'farther out feels less real'] },
    { key: 'next_step_momentum', terms: ['momentum through the next step', 'next step not the whole path', 'immediately after this'] },
    { key: 'gradual_direction_trust', terms: ['reveal direction gradually', 'trust life to reveal direction', 'full map before moving'] },
    { key: 'low_life_defining_pressure', terms: ['life-defining moment', 'life defining moment', 'turn every choice into'] },
    { key: 'presence_over_optimization', terms: ['constantly evolve optimize or become', 'staying present feels more honest', 'chasing a future identity'] },
    { key: 'future_attention_when_needed', terms: ['future needs attention before it becomes urgent', 'before it becomes urgent'] },
    { key: 'present_grounded_future_questions', terms: ['grounded in my current life most of the time', 'current life most of the time', 'decisions suddenly open up bigger questions'] },
    { key: 'rare_future_thought_intense', terms: ['not think far ahead regularly', 'when i do it can feel intense', 'intense and important'] },
    { key: 'future_key_moment_pull', terms: ['future may not guide daily choices', 'pull my attention in key moments', 'key moments'] },
    { key: 'plan_free_until_urgent', terms: ['comfortable without a clear plan', 'direction feels urgent', 'without a clear plan until'] },
    { key: 'now_focus_with_possibility', terms: ['focus tends to stay close to what is real now', 'not disconnected from possibility', 'real now'] },
    { key: 'big_questions_in_waves', terms: ['big questions may come in waves', 'come in waves rather than staying constant', 'questions in waves'] },
    { key: 'present_trust_path_want', terms: ['trust the present most of the time', 'wanting a clearer path', 'clearer path'] },
    { key: 'direction_when_shift', terms: ['direction may matter most when something begins to shift', 'when something begins to shift', 'direction may matter most'] },
    { key: 'not_goal_defined_change_signal', terms: ['not define myself by long-term goals', 'something wants to change', 'long-term goals'] },
    { key: 'present_guides_future_listens', terms: ['letting the present guide me', 'future asks for attention', 'present guide you'] },
    { key: 'knows_rhythm_overrides', terms: ['understand my energy patterns and still expect myself to perform outside them', 'perform outside them', 'understand energy patterns'] },
    { key: 'awareness_hard_to_follow', terms: ['awareness is there but following it consistently can be harder', 'following it consistently can be harder', 'awareness is there'] },
    { key: 'easier_later_push_now', terms: ['something would be easier later but push through now', 'easier later but push through now', 'push through now anyway'] },
    { key: 'rhythm_known_expectations_ignore', terms: ['mind may recognize rhythm while expectations ignore it', 'expectations ignore it', 'recognize rhythm'] },
    { key: 'capacity_difference_same_practice', terms: ['feel the difference between high and low capacity', 'treat them the same in practice', 'high and low capacity'] },
    { key: 'timing_plan_overridden', terms: ['plan around timing then override the plan', 'override the plan when pressure shows up', 'plan around timing'] },
    { key: 'knows_delay_helps_choose_momentum', terms: ['know when rest or delay would help but choose momentum', 'rest or delay would help', 'choose momentum instead'] },
    { key: 'knows_works_not_done', terms: ['gap between what i know works and what i actually do', 'what i know works and what i actually do', 'what you know works'] },
    { key: 'rhythm_following_frustration', terms: ['frustrated not because i do not understand my rhythm', 'do not always follow it', 'understand my rhythm'] },
    { key: 'timing_guides_decisions', terms: ['trusting my timing enough to let it guide decisions', 'let it guide my decisions', 'not just inform them'] },
    { key: 'deep_reflection_limit', terms: ['understand something deeply', 'cannot keep circling it anymore', 'keep circling it'] },
    { key: 'meaning_relief_tension', terms: ['looks for meaning while another part wants relief', 'another part wants relief from thinking', 'meaning and relief'] },
    { key: 'intense_short_processing', terms: ['process intensely in a short window', 'intensely in a short window', 'need movement distraction or action'] },
    { key: 'moves_when_consuming', terms: ['staying in it starts to feel too consuming', 'move on because staying in it', 'too consuming'] },
    { key: 'waves_reflection_action', terms: ['clarity may come in waves', 'deep reflection first', 'strong need to shift attention'] },
    { key: 'revisit_after_done', terms: ['revisit something later even after deciding i was done', 'revisit something later', 'moving forward and still processing'] },
    { key: 'impatient_processing', terms: ['impatient with myself when understanding takes too long', 'understanding takes too long', 'impatient with myself'] },
    { key: 'action_for_processing', terms: ['action as a way to give my processing somewhere to go', 'give my processing somewhere to go', 'processing somewhere to go'] },
    { key: 'bounded_meaning', terms: ['need meaning but not endless meaning-making', 'not endless meaning-making', 'bounded meaning'] },
    { key: 'reflection_stuck_awareness', terms: ['reflection is helping', 'become another place to stay stuck', 'place to stay stuck'] },
    { key: 'moves_on_then_returns', terms: ['move on from something quickly', 'thinking about it again later', 'again later'] },
    { key: 'easy_let_go_then_back', terms: ['easy to let something go', 'quietly comes back', 'until it quietly comes back'] },
    { key: 'delayed_processing_when_calm', terms: ['not process in the moment', 'mind returns when things are calmer', 'things are calmer'] },
    { key: 'done_then_affected', terms: ['feel done with something', 'realize later it still affected me', 'still affected you'] },
    { key: 'forward_closure_lag', terms: ['moving forward may come naturally', 'full closure may take longer', 'closure may take longer'] },
    { key: 'revisits_after_left_behind', terms: ['revisit things after i have already left them behind', 'left them behind', 'already left them behind'] },
    { key: 'delayed_not_absent_processing', terms: ['processing may be delayed rather than absent', 'delayed rather than absent', 'delayed not absent'] },
    { key: 'fine_then_reflective', terms: ['feel fine initially then more reflective afterward', 'more reflective afterward', 'fine initially'] },
    { key: 'distance_reveals_importance', terms: ['not feel important until it has distance', 'until it has distance', 'has distance'] },
    { key: 'earlier_reflection_prevents_return', terms: ['allowing a little reflection earlier', 'so it does not have to return later', 'return later'] },
    { key: 'moment_based_action', terms: ['adjust my actions based on how i feel in the moment', 'based on how i feel in the moment', 'adjust your actions'] },
    { key: 'energy_guides_decisions', terms: ['energy may guide my decisions', 'more than a fixed plan', 'energy may guide your decisions'] },
    { key: 'moves_with_rhythm', terms: ['move with my natural rhythm', 'rather than pushing through it', 'natural rhythm'] },
    { key: 'capacity_changes_consistency_hard', terms: ['consistency may feel harder when my capacity changes', 'capacity changes day to day', 'consistency may feel harder'] },
    { key: 'trusts_unpredictable_timing', terms: ['trust my timing even when it looks unpredictable', 'looks unpredictable from the outside', 'trust your timing'] },
    { key: 'productive_slow_day_variation', terms: ['some days may be very productive', 'more reflective or slow', 'productive while others are more reflective'] },
    { key: 'resists_forced_pattern', terms: ['resist forcing myself into a pattern', 'does not match how i feel', 'forcing yourself into a pattern'] },
    { key: 'alignment_over_routine', terms: ['value alignment over routine', 'alignment over routine'] },
    { key: 'flexible_structure_need', terms: ['structure may help but only when it allows flexibility', 'allows flexibility', 'only when it allows flexibility'] },
    { key: 'consistency_supports_rhythm', terms: ['consistency to support my rhythm without overriding it', 'support your rhythm without overriding it', 'without overriding it'] },
    { key: 'steady_mood_baseline', terms: ['steady baseline', 'fairly even', 'emotionally steady', 'mood is steady', 'steady mood'] },
    { key: 'obvious_cause_emotions', terms: ['obvious cause', 'clear reason for the feeling', 'feelings have a clear cause', 'emotions make sense when'] },
    { key: 'baseline_recovery', terms: ['back to baseline', 'returned to baseline', 'usual baseline', 'settled back'] },
    { key: 'practical_mood_tracking', terms: ['sleep food timing', 'practical explanation', 'practical explanations', 'track sleep', 'track food'] },
    { key: 'low_emotional_variability', terms: ['not very up and down', 'not up and down', 'emotions do not swing', "emotions don't swing", 'fairly consistent emotions'] },
    { key: 'subtle_emotion_blindspot', terms: ['subtle emotional changes', 'do not notice subtle feelings', "don't notice subtle feelings", 'only notice when it gets loud'] },
    { key: 'steady_until_trigger', terms: ['fairly steady until something specific', 'until something specific cuts through', 'cuts through that steadiness'] },
    { key: 'sharp_emotional_shift', terms: ['emotions may not shift constantly', 'change can feel sharp', 'when they do the change can feel sharp'] },
    { key: 'baseline_interruption_surprise', terms: ['interrupt a baseline that usually feels stable', 'surprised by how strongly certain things affect', 'baseline usually feels stable'] },
    { key: 'delayed_buildup_awareness', terms: ['not notice emotional buildup until it suddenly becomes obvious', 'emotional buildup until', 'suddenly becomes obvious'] },
    { key: 'steady_not_unaffected', terms: ['steadiness is real but it does not mean i am unaffected', 'steadiness is real', 'does not mean you are unaffected'] },
    { key: 'trigger_faster_than_explanation', terms: ['triggers may move through me faster than my mind can explain', 'faster than my mind can explain', 'faster than your mind can explain'] },
    { key: 'ordinary_stress_recovers_specific_lingers', terms: ['recover well from ordinary stress but specific situations', 'specific situations can stay with me longer', 'ordinary stress'] },
    { key: 'unseen_deep_landing', terms: ['people see me as steady and miss', 'miss the moments when something lands deeply', 'lands deeply'] },
    { key: 'few_strong_triggers', terms: ['few strong triggers', 'knowing my few strong triggers', 'strong triggers clearly'] },
    { key: 'steadiness_interrupted', terms: ['steadiness gets interrupted', 'specific places where my steadiness gets interrupted', 'less about mood swings'] },
    { key: 'hidden_emotional_variability', terms: ['emotions may shift more than people realize', 'do not always show the full change outwardly', 'full change outwardly'] },
    { key: 'internal_feeling_external_function', terms: ['feel a lot internally while still functioning', 'still functioning in a steady way', 'feel a lot internally'] },
    { key: 'consistent_outside_quick_inside', terms: ['others experience me as consistent', 'inner state is moving quickly', 'consistent even when your inner state'] },
    { key: 'contained_until_understood', terms: ['emotional shifts contained until i understand them better', 'contained until i understand', 'understand them better'] },
    { key: 'steady_not_simple', terms: ['steadiness may be real', 'feelings are simple', 'does not mean my feelings are simple'] },
    { key: 'calm_outside_many_states', terms: ['several internal states', 'looking calm from the outside', 'calm from the outside'] },
    { key: 'quiet_emotional_change', terms: ['emotional change may happen quietly', 'change may happen quietly', 'quietly for you'] },
    { key: 'feeling_not_visible', terms: ['not want every feeling to become visible', 'just because it is present', 'feeling to become visible'] },
    { key: 'steady_not_unaffected_inner', terms: ['steady is not the same as unaffected', 'steady is not unaffected', 'not the same as unaffected'] },
    { key: 'trusted_people_inner_weather', terms: ['trusted people know when my inner weather is changing', 'inner weather is changing', 'trusted people know'] },
    { key: 'high_standards', terms: ['high standards', 'quality', 'excellence', 'do it right'] },
    { key: 'creative_standards', terms: ['creative standards', 'make it good', 'make it better'] },
    { key: 'vision_gap', terms: ['too many ideas', 'unfinished ideas', 'more ideas than', 'cannot finish', 'follow through'] },
    { key: 'wants_to_build', terms: ['build', 'building', 'make something', 'project', 'goal'] },
    { key: 'creative_processing', terms: ['writing', 'journaling', 'art', 'music', 'designing', 'making', 'drawing', 'composing', 'processing through', 'made something'] },
    { key: 'expression_need', terms: ['need to express', 'needed to express', 'need to say', 'needed to say', 'say it out loud', 'get it out', 'put it into words', 'make it visible'] },
    { key: 'voice_emerging', terms: ['found my voice', 'finding my voice', 'use my voice', 'using my voice', 'speak up', 'spoke up', 'said what i meant', 'my voice'] },
    { key: 'immediate_expression', terms: ['came out quickly', 'expressed immediately', 'said it immediately', 'right away i said', 'could not hold it in', "couldn't hold it in"] },
    { key: 'real_time_reaction', terms: ['reacted in real time', 'in the moment reaction', 'responded in the moment', 'said it in the moment'] },
    { key: 'talks_to_process', terms: ['talk it out', 'talked it out', 'talk through it', 'talked through it', 'talking helps me process', 'processed by talking', 'process by talking'] },
    { key: 'emotional_externalizing', terms: ['it came out', 'got it out', 'outside my body', 'externalize', 'externalized'] },
    { key: 'fresh_expression', terms: ['while it was fresh', 'say it while fresh', 'said it while fresh', 'fresh in my mind'] },
    { key: 'open_communication_need', terms: ['open communication', 'communicate openly', 'say things openly', 'talk openly'] },
    { key: 'plain_direct_speech', terms: ['say what i mean', 'said what i mean', 'speak plainly', 'directness feels cleaner'] },
    { key: 'clear_words_preference', terms: ['clear words', 'honest message', 'careful wording', 'trust clear words'] },
    { key: 'says_it_sooner', terms: ['say it sooner', 'said it sooner', 'speak sooner', 'holding it in feels worse'] },
    { key: 'low_conversation_replay', terms: ['do not replay conversations', "don't replay conversations", 'dont replay conversations', 'move forward after saying'] },
    { key: 'honesty_over_delivery', terms: ['honesty over perfect delivery', 'truth over perfect delivery', 'risk discomfort', 'honest over soft'] },
    { key: 'directness_with_repair', terms: ['repair can happen', 'lands imperfectly', 'directness lands best', 'care inside it'] },
    { key: 'affected_before_words', terms: ['affected me before i know how to say it', 'affected you before you know how to say it', 'before i know how to say it'] },
    { key: 'quiet_from_too_much', terms: ['go quiet because there is too much', 'not because there is nothing to say', 'because there is too much'] },
    { key: 'private_word_rehearsal', terms: ['rehearse my words privately', 'rehearse your words privately', 'before letting anyone hear'] },
    { key: 'expression_after_settling', terms: ['expression after the intensity has settled', 'settled enough to become language', 'become language'] },
    { key: 'silence_not_indifference', terms: ['silence is not the same as indifference', 'silence is not indifference', 'not the same as indifference'] },
    { key: 'space_then_conversation', terms: ['space first then conversation later', 'need space first', 'conversation later'] },
    { key: 'careful_after_holding', terms: ['comes out carefully because i have been holding it', 'holding it for a while', 'come out carefully'] },
    { key: 'immediate_response_pressure', terms: ['expect an immediate response', 'immediate response from something i am still sorting through', 'still sorting through'] },
    { key: 'honest_after_no_pressure', terms: ['express more honestly once i no longer feel pressured', 'no longer feel pressured to perform clarity', 'perform clarity'] },
    { key: 'voice_after_quiet', terms: ['voice strongest after quiet', 'quiet has helped me find it', 'helped me find it'] },
    { key: 'clear_speech_extra_detail', terms: ['speak clearly but add more detail', 'add more detail to make sure nothing is misunderstood', 'nothing is misunderstood'] },
    { key: 'direct_with_extra_explanation', terms: ['instinct is to be direct but care shows up as extra explanation', 'extra explanation', 'care shows up as extra'] },
    { key: 'continues_after_meaning', terms: ['say what i mean then continue explaining', 'continue explaining to make sure it lands', 'lands the right way'] },
    { key: 'words_trusted_reception_not', terms: ['trust my words but not always trust they will be received', 'received as intended', 'not always trust that they will be received'] },
    { key: 'responsible_for_understanding', terms: ['responsible for how it is understood', 'not just what is said', 'how it is understood'] },
    { key: 'clarifies_after_clear', terms: ['clarifying even after my point was already clear', 'point was already clear', 'after your point was already clear'] },
    { key: 'pressure_expands_accuracy', terms: ['communication may expand under pressure', 'because i want accuracy', 'want accuracy'] },
    { key: 'settled_after_full_explanation', terms: ['settled once i have fully explained', 'fully explained', 'was not strictly necessary'] },
    { key: 'important_conversation_layers', terms: ['important conversation the more layers i add', 'more layers you may add', 'more layers i may add'] },
    { key: 'first_expression_enough', terms: ['first clear expression is often enough', 'trusting my first clear expression', 'often enough'] },
    { key: 'expresses_then_understands_later', terms: ['express something right away', 'realize later i did not fully understand', 'did not fully understand it'] },
    { key: 'talking_process_unclear_first', terms: ['talking may help me process', 'first version is not fully clear', 'first version isn’t fully clear'] },
    { key: 'in_moment_then_refine', terms: ['say what i feel in the moment', 'refine it afterward', 'then refine it afterward'] },
    { key: 'expression_before_clarity', terms: ['expression may come before clarity', 'expression before clarity', 'before clarity'] },
    { key: 'speaking_relief_adjust_later', terms: ['feel better after speaking', 'later adjust what i meant', 'adjust what you meant'] },
    { key: 'revisits_spoken_after_time', terms: ['revisit what i said once i have had more time', 'more time to think', 'revisit what you said'] },
    { key: 'real_time_forming_feelings', terms: ['feelings come out in real time', 'still forming', 'while they are still forming'] },
    { key: 'not_holding_not_processed', terms: ['not hold things in', 'does not mean they are fully processed', 'fully processed'] },
    { key: 'conversation_clarifies_emotion', terms: ['clarify my own emotions through conversation', 'clarify your own emotions through conversation', 'through conversation'] },
    { key: 'express_with_refine_space', terms: ['express while also giving space to refine later', 'giving space to refine later', 'refine later'] },
    { key: 'simple_direct_no_extra_detail', terms: ['communication simple and direct without adding extra detail', 'simple and direct', 'without adding extra detail'] },
    { key: 'no_need_to_expand', terms: ['not feel the need to expand on it', 'need to expand', 'once i have said something'] },
    { key: 'assumes_message_clear', terms: ['assume my message is clear enough', 'clear enough without further explanation', 'message is clear enough'] },
    { key: 'revisit_only_if_asked', terms: ['not revisit what i said unless someone asks', 'unless someone asks for more', 'someone asks for more'] },
    { key: 'efficient_words_interpretation_room', terms: ['words may be efficient', 'leave room for interpretation', 'efficient words'] },
    { key: 'low_responsibility_for_reception', terms: ['not feel responsible for how my message is received', 'beyond what i said', 'how your message is received'] },
    { key: 'brevity_over_elaboration', terms: ['brevity over elaboration', 'prefer brevity', 'over elaboration'] },
    { key: 'others_need_more_context', terms: ['others may want more context', 'more context than i naturally provide', 'naturally provide'] },
    { key: 'clarify_only_when_wrong', terms: ['not feel the need to clarify unless something goes wrong', 'unless something goes wrong', 'need to clarify unless'] },
    { key: 'more_explanation_connection', terms: ['more explanation creates more connection', 'little more explanation', 'creates more connection'] },
    { key: 'productivity_before_pleasure', terms: ['getting things done before enjoying', 'before allowing myself to enjoy', 'pleasure after everything', 'fun after everything'] },
    { key: 'pleasure_secondary', terms: ['pleasure feels secondary', 'pleasure is secondary', 'minimize pleasure', 'minimizes pleasure'] },
    { key: 'enjoyment_minimized', terms: ['move past enjoyment quickly', 'moments of enjoyment quickly', 'little space pleasure gets'] },
    { key: 'relaxation_discomfort', terms: ['relaxing feels less natural', 'staying productive feels easier', 'hard to relax'] },
    { key: 'output_over_enjoyment', terms: ['value more with output', 'output than enjoyment', 'accomplishing something'] },
    { key: 'responsibilities_during_pleasure', terms: ['mind stays on responsibilities', 'responsibilities while enjoying', 'responsibilities during pleasure'] },
    { key: 'pleasure_without_productivity', terms: ['enjoyment without turning it productive', 'without turning it into something productive', 'feels good is enough', 'enjoyment without productivity'] },
    { key: 'natural_play', terms: ['play comes naturally', 'follow what feels fun', 'feels fun'] },
    { key: 'desire_as_information', terms: ['desire gets to be information', 'what i want before talking myself out', 'notice what i want'] },
    { key: 'chooses_beauty_comfort', terms: ['choosing beauty comfort or pleasure', 'beauty comfort or pleasure', 'adds something good to my life'] },
    { key: 'joy_recovery', terms: ['recover through joy', 'joy more easily than analysis', 'playful or light can shift'] },
    { key: 'pleasure_unearned_trust', terms: ['feeling good matters', 'pleasure does not have to be earned', 'earned by exhaustion'] },
    { key: 'spontaneous_interest', terms: ['spontaneous when something sparks interest', 'sparks interest', 'worth following'] },
    { key: 'body_aliveness_cues', terms: ['music movement touch laughter taste or color', 'recognize aliveness quickly', 'brings me back into myself'] },
    { key: 'joy_as_meaning', terms: ['fun as separate from a meaningful life', 'joy can be part of how i stay connected', 'joy part of how'] },
    { key: 'protects_delight', terms: ['openness to delight', 'protecting pleasure', 'protect pleasure'] },
    { key: 'pleasure_after_completion', terms: ['enjoy things but it feels easier once something important is finished', 'easier once something important is finished', 'important is finished'] },
    { key: 'earned_pleasure_relaxation', terms: ['pleasure feels more relaxed when earned', 'earned it even if', 'should not have to be earned'] },
    { key: 'enjoyment_with_afterward_tracking', terms: ['enjoy myself but still keep awareness of what is waiting', 'what is waiting for me afterward', 'waiting for you afterward'] },
    { key: 'joy_with_responsibility', terms: ['joy is available but sits next to responsibility', 'sense of responsibility rather than replacing it', 'joy with responsibility'] },
    { key: 'fun_blocked_by_incomplete', terms: ['hard to fully relax into something fun if something else feels incomplete', 'something else still feels incomplete', 'fun if something else'] },
    { key: 'breaks_between_effort', terms: ['breaks feel like pauses between effort', 'pauses between effort', 'valuable on their own'] },
    { key: 'contained_enjoyment', terms: ['enjoyment has a clear start and end point', 'clear start and end point', 'contained enjoyment'] },
    { key: 'pleasure_productivity_nonconflict', terms: ['pleasure and productivity do not conflict', "pleasure and productivity don't conflict", 'when pleasure and productivity'] },
    { key: 'present_with_task_tracking', terms: ['stay present while another part tracks', 'part tracks what still needs to be done', 'tracks what still needs to be done'] },
    { key: 'enjoyment_not_reward', terms: ['enjoyment stand on its own', 'not just as a reward', 'enjoyment not reward'] },
    { key: 'creative_block', terms: ['creative block', 'blocked creatively', 'stuck creatively', 'cannot write', "can't write", 'cannot make', "can't make", 'blank page', 'no words'] },
    { key: 'beauty_making', terms: ['rearranged', 'decorated', 'made it beautiful', 'lighting', 'color palette', 'designed the space', 'made the space', 'arranged the room'] },
    { key: 'function_over_feeling', terms: ['what works rather than how something feels', 'function over feeling', 'practical results matter more'] },
    { key: 'completion_over_experiment', terms: ['completing something than experimenting', 'finished and functional', 'more comfortable completing'] },
    { key: 'low_creative_emotional_expression', terms: ['not drawn to express emotions through creative outlets', 'express emotions through creative outlets', 'talking or doing feels more direct'] },
    { key: 'efficient_solution_focus', terms: ['most efficient solution', 'creativity secondary to effectiveness', 'efficient solution'] },
    { key: 'structure_over_open_interpretation', terms: ['clear instructions over open interpretation', 'structure more helpful than freedom', 'prefer clear instructions'] },
    { key: 'concrete_over_abstract_expression', terms: ['less connected to abstract or symbolic expression', 'concrete actions make more sense', 'abstract or symbolic expression'] },
    { key: 'low_completion_revisit', terms: ['not revisit something once complete', 'once it is complete', 'not always exploration'] },
    { key: 'done_well_satisfaction', terms: ['done well not expressive or unique', 'satisfied when something is done well', 'done well'] },
    { key: 'usefulness_over_originality', terms: ['usefulness over originality', 'value usefulness over originality', 'if something works that can be enough'] },
    { key: 'expression_without_usefulness', terms: ['expression that does not need to be useful', "expression that doesn't need to be useful", 'does not need to be useful'] },
    { key: 'beauty_function_both', terms: ['care deeply about how something feels', 'need it to function in real life', 'function in real life'] },
    { key: 'beauty_serves_livable', terms: ['beauty matters to me more when it serves', 'true useful or livable', 'serves something true'] },
    { key: 'expression_to_tangible', terms: ['creative expression most when it becomes something tangible', 'becomes something tangible', 'something tangible'] },
    { key: 'feeling_into_form', terms: ['move from feeling into form', 'feeling into form', 'from feeling into form'] },
    { key: 'creativity_not_abstract', terms: ['creativity to stay abstract', 'not want creativity to stay abstract', 'making it real'] },
    { key: 'detail_emotion_function', terms: ['details because they affect both emotion and function', 'both emotion and function', 'affect both emotion'] },
    { key: 'expression_execution_pride', terms: ['expression matters but execution matters too', 'both are present', 'execution matters too'] },
    { key: 'beautiful_impractical_frustration', terms: ['beautiful but do not hold up practically', 'beautiful but don’t hold up practically', 'hold up practically'] },
    { key: 'intuition_problem_solving', terms: ['between intuition and problem-solving', 'intuition and problem-solving', 'intuition and problem solving'] },
    { key: 'creativity_alive_with_structure', terms: ['creativity stay alive while still giving it structure', 'giving it structure', 'while still giving it structure'] },
    { key: 'expression_first_creating', terms: ['create for expression first', 'expression first', 'before i know what it is for'] },
    { key: 'feeling_over_practicality', terms: ['feeling behind something may matter more', 'more than whether it is practical', 'feeling behind something'] },
    { key: 'alive_idea_without_use', terms: ['idea because it feels alive', 'clear use yet', 'not because it has a clear use'] },
    { key: 'creativity_beyond_language', terms: ['ordinary language cannot fully hold', 'creativity may help me say things', 'language cannot fully hold'] },
    { key: 'emotion_beauty_personal_meaning', terms: ['carries emotion beauty or personal meaning', 'emotion beauty or personal meaning', 'most connected to my work'] },
    { key: 'useful_not_required', terms: ['does not have to be useful to be worth making', 'useful to be worth making', 'not have to be useful'] },
    { key: 'process_as_result', terms: ['process as much as the finished result', 'finished result', 'value the process'] },
    { key: 'mood_image_sound_start', terms: ['mood image sound color or feeling', 'before they become structured', 'ideas may begin as mood'] },
    { key: 'function_only_drains', terms: ['creativity becomes only about function', 'lose energy when creativity', 'only about function'] },
    { key: 'expression_to_form_choice', terms: ['giving expression room', 'bring all the way into form', 'all the way into form'] },
    { key: 'identity_rewriting', terms: ['identity', 'who i am', 'old story', 'new story', 'rewriting my story', 'becoming someone'] },
    { key: 'old_story_loosening', terms: ['old story', 'old role', 'old label', 'no longer who i am', 'used to be'] },
    { key: 'chapter_shift', terms: ['new chapter', 'life chapter', 'chapter shift', 'season changing', 'transition season'] },
    { key: 'self_definition', terms: ['define myself', 'defined myself', 'self-definition', 'who i am', 'named myself'] },
    { key: 'past_self_compassion', terms: ['past self', 'younger self', 'earlier version', 'little me'] },
    { key: 'self_forgiveness', terms: ['forgive myself', 'forgiven myself', 'self forgiveness'] },
    { key: 'inner_critic_softening', terms: ['inner critic', 'kinder to myself', 'kind to myself', 'self-talk', 'talk to myself'] },
    { key: 'permission_shift', terms: ['allowed myself', 'allow myself', 'gave myself permission', 'permission', 'let myself'] },
    { key: 'choosing_self', terms: ['chose myself', 'choose myself', 'choosing myself', 'picked myself'] },
    { key: 'less_explaining', terms: ['less explaining', 'stopped explaining', 'no longer explaining', 'explain less'] },
    { key: 'firm_inner_knowing', terms: ['know it is a no', 'knew it was a no', 'clarity comes first', 'own read was clear'] },
    { key: 'boundary_without_confirmation', terms: ['do not need everyone to understand', "don't need everyone to understand", 'boundary still valid', 'agreement not required'] },
    { key: 'quick_limit_clarity', terms: ['limit was clear', 'know my limit quickly', 'recognized my limit', 'limit quickly'] },
    { key: 'can_disappoint_others', terms: ['disappoint someone without abandoning myself', 'disappoint them without abandoning myself', 'their reaction does not override', 'reaction does not override'] },
    { key: 'simple_boundary_answer', terms: ['simple answer is enough', 'simple no is enough', 'no overexplain boundary', 'do not need to overexplain'] },
    { key: 'early_limit_honoring', terms: ['honor limits early', 'honored my limit early', 'boundary before resentment', 'before resentment builds'] },
    { key: 'boundary_clear_then_replayed', terms: ['clear about a boundary in the moment', 'replay it later wondering if i was too much', 'boundary in the moment'] },
    { key: 'no_right_then_reaction_discomfort', terms: ['saying no felt right at first', 'uncomfortable once i imagine how it affected', 'affected the other person'] },
    { key: 'instinct_trust_fades_after_reaction', terms: ['trust my instincts quickly but trust them less once someone reacts', 'trust them less once someone reacts', 'once someone reacts'] },
    { key: 'outcome_harder_than_decision', terms: ['decision itself is not the hardest part', 'sitting with the outcome', 'outcome is the hardest'] },
    { key: 'post_boundary_reassurance', terms: ['look for reassurance after setting a limit', 'reassurance after setting a limit', 'after setting a limit'] },
    { key: 'real_time_clarity_faded_confidence', terms: ['clarity strong in real time', 'confidence fades afterward', 'real time clarity'] },
    { key: 'boundary_fairness_recheck', terms: ['revisit boundaries to make sure i was fair', 'fair kind or justified enough', 'justified enough'] },
    { key: 'disappointment_reduces_certainty', terms: ['more certain when no one is disappointed', 'less certain when they are', 'when no one is disappointed'] },
    { key: 'limit_softening_after_fact', terms: ['limit mattered but another part wants to soften it', 'soften it after the fact', 'limit mattered'] },
    { key: 'boundary_without_approval', terms: ['boundary stand without needing to revisit it for approval', 'without needing to revisit it for approval', 'revisit it for approval'] },
    { key: 'avoids_clear_boundary_for_comfort', terms: ['avoid setting a clear boundary', 'keep things comfortable', 'clear boundary in the moment'] },
    { key: 'yes_over_tension', terms: ['saying yes can feel easier than introducing tension', 'yes can feel easier', 'introducing tension'] },
    { key: 'smooth_over_limit', terms: ['keeping things smooth over expressing my limit', 'keeping things smooth over expressing your limit', 'smooth over expressing my limit'] },
    { key: 'delayed_discomfort_after_agreement', terms: ['discomfort may come later', 'already agreed to something', 'once i have already agreed'] },
    { key: 'minimizes_real_cost', terms: ['not a big deal even when it quietly is', 'quietly is', 'tell myself it is not a big deal'] },
    { key: 'delays_boundaries_until_loud', terms: ['delay boundaries until they become harder to ignore', 'boundaries until they become harder to ignore', 'harder to ignore'] },
    { key: 'easygoing_carries_more', terms: ['experience me as easygoing', 'carry more than i intended', 'more than you intended'] },
    { key: 'internal_tension_external_smooth', terms: ['more tension internally than i show externally', 'tension internally', 'show externally'] },
    { key: 'boundary_after_cost_builds', terms: ['boundary may come later', 'cost has already built', 'after the cost has already built'] },
    { key: 'small_discomfort_early', terms: ['small discomfort early', 'does not become larger later', 'larger later'] },
    { key: 'limits_tested', terms: ['my limit', 'my limits', 'capacity limit', 'reached my limit', 'bandwidth'] },
    { key: 'integrates_insight', terms: ['integrated', 'clicked', 'landed', 'came together', 'i realized'] },
    { key: 'truth_telling', terms: ['told the truth', 'tell the truth', 'honest', 'honesty'] },
    { key: 'growth_edge', terms: ['growth edge', 'learning', 'practice', 'growing into'] },
    { key: 'transformation_season', terms: ['change', 'growth', 'becoming', 'transform', 'transition'] },
    { key: 'boundary_guilt', terms: ['guilty for saying no', 'guilt after no', 'felt bad saying no', 'guilty after saying no'] },
    { key: 'says_no', terms: ['said no', 'saying no', 'say no', 'declined', 'turned it down'] },
    { key: 'peace_boundary', terms: ['protect my peace', 'protected my peace', 'needed distance', 'need distance', 'stepped back', 'space for peace'] },
    { key: 'distance_for_safety', terms: ['needed distance', 'need distance', 'stepped back', 'pulled back', 'needed space'] },
    { key: 'autonomy_need', terms: ['controlled', 'trapped', 'no choice', 'need autonomy', 'needed autonomy', 'make my own choice', 'my own choice'] },
    { key: 'inner_authority', terms: ['my own knowing', 'inner authority', 'trusted my knowing', 'trust my knowing'] },
    { key: 'invisible_labor', terms: ['invisible labor', 'chores', 'logistics', 'scheduling', 'household'] },
    { key: 'selective_helping', terms: ['selective helping', 'choose when to help', 'chose when to help', 'helping is a choice', 'help when aligned'] },
    { key: 'defined_support', terms: ['defined support', 'defined way to help', 'clear way to help', 'specific way to help', 'clear boundaries around helping'] },
    { key: 'shared_responsibility', terms: ['shared responsibility', 'not all on me', 'not just mine', 'everyone does their part'] },
    { key: 'lets_others_handle', terms: ['let them handle', 'let others handle', 'others can handle', 'they can handle it', 'not take over'] },
    { key: 'care_with_boundaries', terms: ['care with boundaries', 'support with boundaries', 'help with boundaries', 'available but not everything'] },
    { key: 'assigned_responsibility_only', terms: ['not assigned to me', 'not my responsibility', 'not mine to solve', 'not my job', 'only what i committed to'] },
    { key: 'ritual_regulation', terms: ['routine', 'habit', 'ritual', 'system', 'warm up', 'wind down'] },
    { key: 'needs_pause', terms: ['need a pause', 'need pause', 'needed a pause', 'need a break', 'needed a break', 'buffer', 'transition', 'change of plans', 'routine changed', 'warm up', 'wind down'] },
    { key: 'calm_bracing', terms: ['interruption', 'interrupted', 'unexpected change', 'change of plans'] },
    { key: 'sensory_sensitivity', terms: ['sensory', 'overstimulated', 'over-stimulated', 'over stimulation', 'sensory overload', 'too loud', 'too bright', 'noise', 'lights', 'clutter', 'crowded', 'texture', 'screens'] },
    { key: 'head_pressure', terms: ['head pressure', 'headache', 'migraine', 'brain fog', 'foggy head'] },
    { key: 'body_heaviness', terms: ['shutdown', 'shut down', 'body heavy', 'heavy body', 'body went heavy'] },
    { key: 'selective_vulnerability', terms: ['masking', 'mask', 'performing', 'performative', 'pretending i am fine', 'pretending to be fine', 'guarded', 'edited myself', 'translate myself'] },
    { key: 'becoming_visible', terms: ['unmask', 'unmasking', 'be myself', 'show myself', 'less edited', 'not edit myself'] },
    { key: 'wants_to_be_seen', terms: ['seen accurately', 'understood accurately', 'misunderstood', 'accurately understood'] },
    { key: 'face_value_relating', terms: ['face value', 'take it at face value', 'took it at face value'] },
    { key: 'direct_communication_preference', terms: ['direct communication', 'say it directly', 'said directly', 'tell me directly', 'clear communication'] },
    { key: 'silence_neutral', terms: ['silence felt neutral', 'silence is neutral', 'silence did not bother me', "silence didn't bother me"] },
    { key: 'low_relational_tracking', terms: ['not read into it', 'not reading into it', "don't read into it", 'dont read into it', 'not tracking every shift'] },
    { key: 'low_reassurance_need', terms: ['do not need reassurance', "don't need reassurance", 'dont need reassurance', 'less reassurance'] },
    { key: 'clear_over_implied', terms: ['clear over implied', 'clearer than implied', 'what was said clearly', 'what is said directly'] },
    { key: 'tracks_tone_acts_unaffected', terms: ['changes in someone’s tone while acting like it did not affect me', "changes in someone's tone while acting like it did not affect me", 'acting like it did not affect me'] },
    { key: 'body_notices_distance_hidden', terms: ['body notices distance before my face', 'body may notice distance before', 'before my face words or behavior'] },
    { key: 'calm_outside_tracking_inside', terms: ['calm externally while internally checking', 'internally checking whether the relationship still feels okay', 'seem calm externally'] },
    { key: 'less_invested_protection', terms: ['acting less invested than i actually feel', 'less invested than i actually feel', 'protect myself by acting less invested'] },
    { key: 'pulls_back_first', terms: ['pull back first so i am not the one left reaching', 'pull back first', 'not the one left reaching'] },
    { key: 'says_doesnt_matter_tracks', terms: ['tell myself it does not matter', 'still tracking every shift', 'does not matter even while'] },
    { key: 'unaffected_until_safe', terms: ['look unaffected until i know whether it is safe', 'until it is safe to care openly', 'care openly'] },
    { key: 'hidden_silence_distress', terms: ['silence bothers me more than i let on', 'silence may bother me more than', 'more than i let on'] },
    { key: 'resists_reassurance_need', terms: ['need reassurance but resist needing it', 'resist needing reassurance', 'resist needing it'] },
    { key: 'protected_distance_connection', terms: ['connection matters deeply even when protection looks like distance', 'protection looks like distance', 'connection matters deeply'] },
    { key: 'low_tracking_sudden_standout', terms: ['not notice subtle shifts in connection most of the time', 'certain moments suddenly stand out', 'suddenly stand out'] },
    { key: 'simple_until_specific_complicated', terms: ['relationships may feel simple until something specific', 'makes them feel complicated', 'specific makes them feel complicated'] },
    { key: 'change_surprises_connection', terms: ['not track connection closely', 'something changes it can feel more surprising', 'connection closely'] },
    { key: 'unaffected_until_obvious_off', terms: ['feel unaffected until a moment clearly shows', 'something is off', 'clearly shows me something is off'] },
    { key: 'sharp_connection_awareness', terms: ['awareness of connection may come in sharp moments', 'sharp moments instead of constant tracking', 'constant tracking'] },
    { key: 'rare_relationship_worry_signal', terms: ['not worry about relationships often', 'signals can quickly get my attention', 'quickly get your attention'] },
    { key: 'trust_connection_until_broken', terms: ['trust connection easily', 'breaks that assumption', 'something breaks that assumption'] },
    { key: 'direct_shifts_impact', terms: ['not read between the lines', 'direct shifts can still impact', 'direct shifts'] },
    { key: 'steady_until_disrupted_connection', terms: ['steady in relationships until something clearly disrupts', 'clearly disrupts that feeling', 'relationships until something clearly'] },
    { key: 'awareness_without_monitoring', terms: ['building awareness without needing to monitor everything', 'without needing to monitor everything', 'awareness without monitoring'] },
    { key: 'relief', terms: ['relief', 'relieved', 'easier', 'exhale'] },
    { key: 'hope', terms: ['hope', 'hopeful', 'possible', 'optimistic'] },
    { key: 'mood_improvement', terms: ['better today', 'lighter mood', 'mood lifted', 'felt better'] },
    { key: 'quiet_safety', terms: ['calm', 'peaceful', 'safe', 'settled', 'quiet'] },
    { key: 'familiar_calm', terms: ['calm feels normal', 'quiet feels like quiet', 'relax without waiting', 'not waiting for something to go wrong'] },
    { key: 'outward_settled_under_ready', terms: ['settled on the outside while something in me stays ready', 'appear settled on the outside', 'slightly ready'] },
    { key: 'composed_still_tracking', terms: ['calm does not always mean fully relaxed', 'composed while still tracking', 'still tracking'] },
    { key: 'quiet_readiness', terms: ['quiet readiness even when nothing is actively wrong', 'nothing is actively wrong', 'quiet readiness'] },
    { key: 'smooth_monitoring_change', terms: ['move through situations smoothly while still monitoring', 'still monitoring for change', 'monitoring for change'] },
    { key: 'calm_seen_attention_hidden', terms: ['others see me as calm', 'still paying attention underneath', 'paying attention underneath'] },
    { key: 'guard_not_dropped', terms: ['not fully drop my guard', 'drop your guard', 'moments that seem safe'] },
    { key: 'prepared_steadiness', terms: ['steadiness may come from being prepared', 'steadiness comes from being prepared', 'being prepared not fully letting go', 'prepared steadiness'] },
    { key: 'handling_trust_keeps_engaged', terms: ['trust myself to handle things', 'keeps me slightly engaged', 'slightly engaged'] },
    { key: 'layered_relaxation', terms: ['relaxation may happen in layers', 'relaxation happens in layers', 'first outwardly then internally', 'more slowly internally'] },
    { key: 'soften_not_manage', terms: ['safe to soften not just to manage', 'not just to manage', 'actually safe to soften'] },
    { key: 'genuine_relaxation_in_alert_context', terms: ['genuinely relaxed in situations where others stay slightly on alert', 'others stay slightly on alert', 'genuinely relaxed'] },
    { key: 'settles_without_readiness', terms: ['settle quickly without holding a layer of readiness', 'without holding a layer of readiness', 'layer of readiness underneath'] },
    { key: 'problems_not_anticipated', terms: ['not anticipate problems until they clearly appear', 'until they clearly appear', 'anticipate problems'] },
    { key: 'complete_calm', terms: ['calm may feel complete', 'complete not partial', 'not partial'] },
    { key: 'face_value_trust_no_scanning', terms: ['trust situations at face value', 'without scanning for what could shift', 'what could shift'] },
    { key: 'prepares_only_with_reason', terms: ['not prepare for disruption unless there is a clear reason', 'clear reason', 'prepare for disruption'] },
    { key: 'ease_less_ready_for_change', terms: ['ease may be real', 'less ready for sudden change', 'sudden change'] },
    { key: 'grounded_without_monitoring', terms: ['grounded without needing to monitor', 'without needing to monitor', 'grounded without monitoring'] },
    { key: 'calm_presence_for_others', terms: ['rely on me for my calm presence', 'calm presence', 'tense situations'] },
    { key: 'open_with_early_signs', terms: ['staying open while still noticing early signs', 'noticing early signs', 'something is shifting'] },
    { key: 'easy_settling', terms: ['return to calm easily', 'settle easily', 'settled easily', 'readiness fades'] },
    { key: 'low_scanning', terms: ['do not monitor every shift', "don't monitor every shift", 'not scanning the room', 'not monitoring every shift'] },
    { key: 'trusts_safe_moments', terms: ['trust safe moments', 'safe moment felt real', 'receive safety as real', 'absence of danger is enough'] },
    { key: 'unbraced_stillness', terms: ['comfortable in stillness', 'stillness feels comfortable', 'body can rest there', 'unbraced'] },
    { key: 'quick_disruption_recovery', terms: ['recover from small disruptions', 'small disruption passed', 'did not take over the day', 'does not take over the day'] },
    { key: 'low_stress', terms: ['less stressed', 'low stress', 'not stressed'] },
    { key: 'restorative_moment', terms: ['rested', 'restorative', 'rest helped', 'slept well', 'nap helped'] },
    { key: 'body_lightness', terms: ['lighter', 'lightness', 'body relaxed', 'looser'] },
    { key: 'tension_release', terms: ['released', 'release', 'let go', 'softened'] },
    { key: 'somatic_safety', terms: ['felt safe in my body', 'body felt safe', 'settled body'] },
    { key: 'easy_rest', terms: ['rest comes easily', 'easy to rest', 'pause without justifying', 'rest without earning'] },
    { key: 'rest_without_guilt', terms: ['rest without guilt', 'no guilt resting', 'do nothing without guilt', 'not guilty for resting'] },
    { key: 'responds_to_fatigue', terms: ['when tired i slow down', 'respond to fatigue', 'listen when tired', 'slow down when tired'] },
    { key: 'ordinary_downtime', terms: ['ordinary downtime', 'quiet downtime', 'low pressure downtime', 'do nothing for a while'] },
    { key: 'restorative_pause', terms: ['simple pause', 'small pause', 'pause helped', 'quiet time helped', 'slower day'] },
    { key: 'rest_as_care', terms: ['rest as care', 'rest is care', 'receive rest as care', 'rest feels like care'] },
    { key: 'rest_needed_unresolved', terms: ['need rest and still keep going because something feels unresolved', 'something feels unresolved', 'rest and still keep going'] },
    { key: 'tired_but_not_free_stop', terms: ['know i am tired but do not feel free to stop', "know you're tired", 'do not feel free to stop'] },
    { key: 'rest_theory_hard_choice', terms: ['rest reasonable in theory', 'harder to choose when my mind is still tracking', 'mind is still tracking what needs attention'] },
    { key: 'one_more_thing_loop', terms: ['pause after one more thing', 'keep finding one more thing', 'one more thing'] },
    { key: 'body_rest_before_responsibility', terms: ['body asks for rest before responsibility agrees', 'body may ask for rest before', 'sense of responsibility agrees'] },
    { key: 'rest_awareness_frustration', terms: ['understand the need for rest but still struggle to protect it', 'struggle to protect rest', 'frustrated because i understand the need for rest'] },
    { key: 'stopping_exposes_unfinished', terms: ['stopping feels less like relief', 'leaving something exposed', 'less like relief and more like leaving'] },
    { key: 'bounded_rest_return', terms: ['rest has a clear boundary', 'mind knows it can return later', 'clear boundary so my mind knows'] },
    { key: 'allowed_before_finished', terms: ['allowed to take it before everything is finished', 'before everything is finished', 'feel allowed to take rest'] },
    { key: 'unfinished_not_unsafe', terms: ['unfinished does not always mean unsafe', 'unfinished does not mean unsafe', 'unfinished is not unsafe'] },
    { key: 'physical_pause_mind_moving', terms: ['pause physically while my mind keeps moving', 'mind keeps moving', 'pause physically'] },
    { key: 'outside_rest_before_inside', terms: ['rest may happen on the outside before it happens inside', 'outside before it happens inside', 'outside before inside'] },
    { key: 'break_without_recovery', terms: ['take breaks but still feel like i never fully recover', 'never fully recover', 'breaks but still'] },
    { key: 'still_body_scanning_mind', terms: ['body may be still while my attention keeps scanning', 'scanning planning or replaying', 'attention keeps scanning'] },
    { key: 'stop_activity_not_let_go', terms: ['know how to stop activity', 'not always how to let go internally', 'let go internally'] },
    { key: 'busy_mind_quiet_time', terms: ['quiet time may not feel restful', 'mind stays busy', 'quiet time'] },
    { key: 'break_confused_with_recovery', terms: ['confuse a break with recovery', 'system is still working', 'break with recovery'] },
    { key: 'rest_needs_safety', terms: ['rest may need more than stopping', 'sense of safety', 'more than stopping'] },
    { key: 'downtime_not_restore', terms: ['downtime does not actually restore me', 'downtime does not actually restore', 'does not restore you'] },
    { key: 'body_mind_rest', terms: ['rest that reaches both my body and my mind', 'body and your mind', 'both body and mind'] },
    { key: 'thought_first_processing', terms: ['thoughts first', 'mind picks up the story first', 'understand before i feel it', 'understand before feeling physically'] },
    { key: 'delayed_body_awareness', terms: ['body signals arrive later', 'miss early signs of stress', 'body gets attention later', 'notice my body later'] },
    { key: 'logic_over_sensation', terms: ['logic more than sensation', 'rely on logic', 'facts before feelings', 'can explain it so i feel fine'] },
    { key: 'late_stress_signals', terms: ['stress signs show up late', 'suddenly feels loud', 'hard to ignore tension', 'body suddenly loud'] },
    { key: 'functioning_over_settled', terms: ['functioning means fine', 'assume i am okay because functioning', 'functioning and settled', 'still functioning'] },
    { key: 'intentional_body_checkin', terms: ['check in with my body', 'intentional body check', 'body check-in', 'notice what my body is saying'] },
    { key: 'body_signal_interpretation', terms: ['notice a body signal and immediately start asking what it means', 'body signal and immediately', 'asking what it means'] },
    { key: 'sensation_first_mind_interprets', terms: ['sensation may be the first clue', 'mind moves in quickly to interpret', 'first clue'] },
    { key: 'sensation_reason_search', terms: ['tension heaviness or unease', 'searching for the reason behind it', 'reason behind it'] },
    { key: 'body_info_mind_organizes', terms: ['body gives me information but my mind wants to organize it', 'mind wants to organize it before i trust it', 'body gives you information'] },
    { key: 'sensation_problem_solving', terms: ['stay with a sensation without turning it into a problem to solve', 'turning it into a problem to solve', 'problem to solve'] },
    { key: 'analysis_pulls_from_signal', terms: ['analyzing it too quickly can pull me away from the signal', 'pull you away from the signal', 'analyzing it too quickly'] },
    { key: 'translates_body_to_thought', terms: ['body is speaking while still translating it into thoughts', 'translating it into thoughts', 'body is speaking'] },
    { key: 'body_says_mind_asks_why', terms: ['body may say something is here', 'mind may immediately ask why', 'something is here'] },
    { key: 'interpretation_crowds_awareness', terms: ['awareness is strong but crowded by interpretation', 'crowded by interpretation', 'awareness is strong'] },
    { key: 'sensation_before_explanation', terms: ['sensation exist for a moment before needing it to explain itself', 'before needing it to explain itself', 'sensation exist for a moment'] },
    { key: 'mental_first_body_agrees', terms: ['understand something mentally first', 'check whether my body agrees', 'body agrees'] },
    { key: 'thoughts_lead_body_confirms', terms: ['thoughts often lead', 'body can confirm what is actually true', 'actually true'] },
    { key: 'logical_before_physical', terms: ['make sense of a situation logically before noticing', 'how it feels physically', 'logically before noticing'] },
    { key: 'body_final_signal', terms: ['body may not be my first signal', 'final one', 'become the final one'] },
    { key: 'fine_until_body_says_otherwise', terms: ['believe something is fine until my body', 'body quietly says otherwise', 'quietly says otherwise'] },
    { key: 'mind_quick_body_slow', terms: ['mind may explain quickly', 'body takes longer to respond', 'takes longer to respond'] },
    { key: 'reasoning_and_body_settle', terms: ['reasoning and my body settle around it', 'body settle around it', 'reasoning and body'] },
    { key: 'later_sensation_matters', terms: ['sensation may arrive later', 'still matters', 'arrive later'] },
    { key: 'logic_accurate_incomplete', terms: ['logic can be accurate and incomplete', 'accurate and incomplete', 'logic can be accurate'] },
    { key: 'body_vote_when_mind_sure', terms: ['body have a vote', 'mind is already sure', 'when my mind is already sure'] },
    { key: 'enoughness', terms: ['enough', 'sufficient', 'plenty', 'had enough'] },
    { key: 'support_abundance_shift', terms: ['supported', 'help arrived', 'not alone', 'backed up'] },
    { key: 'receiving_openness', terms: ['received help', 'accepted help', 'compliment', 'gift'] },
    { key: 'open_receiving', terms: ['receive care without debt', 'let care matter', 'open to receiving', 'let good things in'] },
    { key: 'compliment_lands', terms: ['compliment landed', 'compliments land', 'let the compliment in', 'accepted the compliment'] },
    { key: 'asks_help_early', terms: ['asked for help early', 'ask for help before overwhelmed', 'asked before i was overwhelmed', 'support before crisis'] },
    { key: 'needs_belong', terms: ['my needs belong', 'needs belong in the room', 'my needs count', 'needs count'] },
    { key: 'support_reaches_inside', terms: ['support reached me', 'care reached me', 'support settled inside', 'care settled inside'] },
    { key: 'valued_without_usefulness', terms: ['valued without being useful', 'not need usefulness', 'loved without doing', 'valued for being present'] },
    { key: 'receives_then_returns', terms: ['let care in but part of me still wants to return it quickly', 'still wants to return it quickly', 'return it quickly'] },
    { key: 'indebted_receiving_discomfort', terms: ['receiving feels good but being indebted', 'being indebted may feel uncomfortable', 'indebted'] },
    { key: 'support_trusted_when_reciprocal', terms: ['trust support more easily when i know i can offer something back', 'offer something back', 'support more easily when'] },
    { key: 'care_evenness_question', terms: ['activate the question of how to keep things even', 'keep things even', 'care may reach me'] },
    { key: 'kindness_usefulness_pressure', terms: ['not reject kindness', 'pressure to respond with usefulness', 'respond with usefulness'] },
    { key: 'receives_but_exposed_need', terms: ['receive more than i used to', 'exposed by being the one who needs', 'being the one who needs'] },
    { key: 'appreciation_lands_slow_rest', terms: ['appreciation may land', 'fully resting in it can take longer', 'resting in it'] },
    { key: 'mutual_flow_safety', terms: ['giving and receiving both flow naturally', 'both flow naturally', 'relationships where giving and receiving'] },
    { key: 'support_too_much_fear', terms: ['want support but also want to make sure i am not taking too much', 'not taking too much', 'taking too much'] },
    { key: 'care_before_owed', terms: ['letting care stay with me before turning it into something i owe', 'turning it into something i owe', 'before turning it into something you owe'] },
    { key: 'support_without_dependence', terms: ['accept support more easily when it does not make me feel dependent', 'does not make me feel dependent', 'feel dependent'] },
    { key: 'care_with_selfhood', terms: ['care can feel good', 'still feel like myself inside it', 'feel like myself inside it'] },
    { key: 'help_with_control', terms: ['receive help while keeping a quiet sense of control', 'quiet sense of control', 'help while keeping'] },
    { key: 'supported_autonomy_intact', terms: ['supported may feel safest when my autonomy stays intact', 'autonomy stays intact', 'stays intact'] },
    { key: 'resists_managed_care', terms: ['not reject care', 'resist feeling managed by it', 'feeling managed'] },
    { key: 'help_respects_competence', terms: ['help more when it respects my competence', 'respects your competence', 'respects my competence'] },
    { key: 'collaborative_not_rescuing', terms: ['collaborative not rescuing', 'feels collaborative not rescuing', 'not rescuing'] },
    { key: 'care_strengthens_not_takes_over', terms: ['care that strengthens me rather than takes over', 'strengthens you rather than takes over', 'rather than takes over'] },
    { key: 'receiving_without_agency_loss', terms: ['does not shrink my sense of agency', 'without agency loss', 'sense of agency'] },
    { key: 'care_without_independence_proof', terms: ['care in without needing to prove i am still independent', 'prove you are still independent', 'still independent'] },
    { key: 'scarcity_planning', terms: ['make sure nothing runs out', 'nothing falls short', 'think ahead so nothing runs out'] },
    { key: 'planning_as_protection', terms: ['planning feels like protection', 'planning is protection', 'prepare as protection'] },
    { key: 'worst_case_preparation', terms: ['prepare for the worst', 'not caught off guard', 'caught off guard'] },
    { key: 'safety_over_flexibility', terms: ['safety over flexibility', 'decisions lean safety', 'choose safety over flexibility'] },
    { key: 'accounted_for_security', terms: ['everything accounted for', 'feel secure when accounted', 'accounted for'] },
    { key: 'control_for_uncertainty', terms: ['planned enough to reduce uncertainty', 'trust preparation more than trust', 'full control', 'reduce uncertainty'] },
    { key: 'resource_anxiety_only_with_reason', terms: ['anxious about resources unless clear reason', 'resources unless there is a clear reason', 'money time or support can matter without'] },
    { key: 'needs_handled_as_arise', terms: ['needs can be handled as they arise', 'handled as they arise', 'not prepare for every possible shortage'] },
    { key: 'practical_enoughness', terms: ['enough as a practical reality', 'basics are covered', 'body may believe it'] },
    { key: 'stability_feels_real', terms: ['stability can feel real', 'enjoy what i have without immediately worrying', 'without immediately worrying about losing'] },
    { key: 'spending_without_safety_math', terms: ['without turning every choice into a safety calculation', 'safety calculation', 'comfort convenience or pleasure'] },
    { key: 'resource_flexibility', terms: ['resources as flexible', 'rather than fixed', 'trust my ability to adjust'] },
    { key: 'low_resource_hoarding', terms: ['not feel the same pull to hoard', 'hoard energy time or money', 'constant fear'] },
    { key: 'enough_can_shift', terms: ['enough can shift', 'seasons need more caution', 'allow more openness'] },
    { key: 'preference_over_fear', terms: ['choices from preference', 'not only from fear', 'survival math'] },
    { key: 'trust_with_limits', terms: ['trust needs to be paired with practical limits', 'paired with practical limits'] },
    { key: 'resource_trust_with_concern', terms: ['believe things can be handled but certain situations', 'strong concern', 'things can be handled'] },
    { key: 'trust_baseline_fear_moments', terms: ['trust is my baseline', 'does not fully override moments of fear', 'moments of fear'] },
    { key: 'resource_calm_until_personal_stakes', terms: ['calm about resources most of the time', 'personal raises the stakes', 'raises the stakes'] },
    { key: 'fine_to_what_if_shift', terms: ['this will be fine to what if it is not', 'what if it is not', 'what if it isn’t'] },
    { key: 'light_planning_until_uncertain', terms: ['plan lightly most of the time', 'plan more intensely', 'something feels uncertain'] },
    { key: 'trust_worry_coexist', terms: ['trust and worry may coexist', 'coexist rather than cancel', 'trust and worry'] },
    { key: 'steady_after_resource_activation', terms: ['return to a steady state after concern passes', 'concern passes', 'activation felt strong'] },
    { key: 'logical_trust_worry_frustration', terms: ['worry shows up even when i logically know', 'logically know i will figure things out', 'figure things out'] },
    { key: 'resource_triggers_prepare', terms: ['triggers may activate a stronger need to prepare', 'prepare or protect', 'stronger need to prepare'] },
    { key: 'trust_leads_caution_respected', terms: ['letting trust lead', 'caution is useful', 'respecting the moments when caution'] },
    { key: 'meaning_before_action', terms: ['deeper meaning before dealing', 'look for deeper meaning before', 'meaning before action'] },
    { key: 'reflection_over_action', terms: ['reflection more comfortable than action', 'reflection over action', 'interpret instead of addressing'] },
    { key: 'interpretation_as_distance', terms: ['interpret something instead of addressing', 'meaning to distance', 'soften or distance'] },
    { key: 'symbolic_over_practical', terms: ['stay symbolic', 'symbolic longer', 'less grounded in next steps'] },
    { key: 'insight_without_steps', terms: ['clarity without next steps', 'meaning without steps', 'less grounded in next steps'] },
    { key: 'meaning_replaces_change', terms: ['interpretation safer than change', 'meaning replacing action', 'meaning without action'] },
    { key: 'concrete_over_symbolic', terms: ['what actually happened rather than what', 'rather than what they might symbolize', 'concrete observable useful'] },
    { key: 'meaning_when_useful', terms: ['meaning may matter', 'when it helps', 'live more clearly'] },
    { key: 'facts_over_interpretation', terms: ['grounded by facts', 'facts than interpretations', 'concrete details'] },
    { key: 'resists_forced_lesson', terms: ['turning pain into a lesson too quickly', 'simply hard unfair or sad', 'enough truth'] },
    { key: 'low_sign_reading', terms: ['not read much into timing', 'coincidence or signs', 'practical reason'] },
    { key: 'simple_explanations', terms: ['simpler explanations', 'abstract that feels straightforward', 'respectful of reality'] },
    { key: 'what_happened_what_helps', terms: ['what happened', 'what helps now'] },
    { key: 'meaning_without_spiritual_frame', terms: ['not need a spiritual frame', 'presence honesty and useful action', 'meaningful on their own'] },
    { key: 'evidence_anchor', terms: ['anchor is evidence', 'trust what can be observed', 'what can be observed'] },
    { key: 'room_for_unproven_meaning', terms: ['room for meaning that cannot be fully proven', 'cannot be fully proven', 'still feels real'] },
    { key: 'meaning_with_practical_action', terms: ['things matter deeply while still wanting to deal with them in practical ways', 'deal with them in practical ways', 'matter deeply'] },
    { key: 'meaning_not_action_replacement', terms: ['meaning may help me understand but does not replace action', 'does not replace the need for action', 'replace the need for action'] },
    { key: 'resists_quick_lessons', terms: ['turn everything into a lesson too quickly', 'resist explanations that turn everything', 'lesson too quickly'] },
    { key: 'why_and_next_step', terms: ['understand why something matters and know what to do next', 'what to do next', 'why something matters'] },
    { key: 'larger_connection_grounded', terms: ['connected to something larger but still grounded', 'grounded in what is actually happening', 'something larger'] },
    { key: 'meaning_lived_experience', terms: ['meaning feels real when connected to lived experience', 'connected to lived experience', 'lived experience'] },
    { key: 'interpretation_with_clarity', terms: ['open to interpretation without wanting to lose clarity', 'without wanting to lose clarity', 'interpretation with clarity'] },
    { key: 'meaning_not_minimizing_impact', terms: ['meaning is used to minimize real impact', 'minimize real impact', 'real impact'] },
    { key: 'reflection_and_realism', terms: ['reflection and realism at the same time', 'hold both reflection and realism', 'reflection and realism'] },
    { key: 'meaning_deepens_truth', terms: ['meaning deepen my experience without replacing what is true', 'without replacing what is true', 'deepens truth'] },
    { key: 'rapid_identity_shift', terms: ['shift how i see myself', 'identity shifts quickly', 'becoming someone new'] },
    { key: 'reinvention_orientation', terms: ['reinvention easier', 'reinvention feels easier', 'reinvent myself', 'new version of myself'] },
    { key: 'flexible_identity', terms: ['identity feels flexible', 'flexible identity', 'less anchored'] },
    { key: 'role_adaptation', terms: ['adapt to new roles', 'adapt identity', 'different roles'] },
    { key: 'context_dependent_self', terms: ['different versions in different contexts', 'different version of me', 'different versions of me', 'different versions of myself'] },
    { key: 'continuity_gap', terms: ['no consistent thread', 'less continuity', 'what remains true', 'holding onto what remains true'] },
    { key: 'stable_core_self', terms: ['same core person', 'sense of self stays recognizable', 'core person across'] },
    { key: 'growth_as_clarity', terms: ['growth may feel less like becoming someone new', 'clearer about who i already am', 'becoming clearer'] },
    { key: 'change_adds_not_rearranges', terms: ['new experiences add to me', 'without completely rearranging', 'not a full identity shift'] },
    { key: 'continuity_grounding', terms: ['grounded by continuity', 'knowing what has always mattered', 'continuity'] },
    { key: 'adapts_without_reinventing', terms: ['not need to reinvent myself', 'adapt while still feeling internally familiar', 'chapter ends'] },
    { key: 'stable_preferences_values', terms: ['stable sense of preferences', 'stable sense of my preferences', 'core does not disappear'] },
    { key: 'perception_not_identity', terms: ['others seeing me differently', 'does not fully define who i am', 'their perception'] },
    { key: 'returns_to_self', terms: ['return to myself easily', 'recognizable remains', 'after stressful seasons'] },
    { key: 'past_self_belongs', terms: ['past version of me', 'can still belong', 'as i mature'] },
    { key: 'change_without_threat', terms: ['without treating it as a threat', 'change to reach me', 'threat to who i am'] },
    { key: 'same_core_life_shifting', terms: ['same person at my core', 'parts of my life are shifting', 'same person at your core'] },
    { key: 'circumstance_change_identity_stable', terms: ['circumstances more than my identity', 'circumstances more than your identity', 'still requires adjustment'] },
    { key: 'steady_inside_reorganizing', terms: ['steady inside while everything around me is reorganizing', 'everything around me is reorganizing', 'steady inside'] },
    { key: 'self_intact_role_change', terms: ['sense of self stays intact', 'roles or environment change', 'self may stay intact'] },
    { key: 'fit_next_question', terms: ['not question who i am but question how that fits', 'how that fits into what is next', 'what’s next'] },
    { key: 'stability_transition_coexist', terms: ['stability and transition may exist at the same time', 'stability and transition', 'exist at the same time'] },
    { key: 'grounded_moving_awareness', terms: ['feel grounded but still aware that something is moving', 'aware that something is moving', 'grounded but still aware'] },
    { key: 'self_trust_unclear_path', terms: ['trust myself through change', 'even when the path is unclear', 'path is unclear'] },
    { key: 'integration_not_identity', terms: ['challenge may not be identity but integration', 'not identity but integration', 'how everything fits together now'] },
    { key: 'change_reshapes_not_redefines', terms: ['change to reshape my life without redefining me', 'without feeling like it has to redefine you', 'not redefine'] },
    { key: 'waking_life_processing', terms: ['through what happens during the day', 'rather than through dreams', 'waking life processing'] },
    { key: 'low_dream_interpretation', terms: ['not drawn to interpret dreams', 'dreams beyond what is obvious', 'disconnected from my waking life'] },
    { key: 'daytime_processing', terms: ['process emotions through conversation action or reflection while awake', 'nighttime does not play a major role', 'while awake'] },
    { key: 'real_events_over_symbols', terms: ['trust real events more than symbolic ones', 'real events more than symbolic', 'what actually happens feels more relevant'] },
    { key: 'dreams_fade_quickly', terms: ['dreams fade quickly', 'not revisit dreams once i wake up', 'without needing attention'] },
    { key: 'clear_over_symbolic_explanation', terms: ['clear explanations over symbolic meaning', 'direct understanding feels more reliable', 'symbolic meaning'] },
    { key: 'real_world_grounding', terms: ['grounded when focusing on real-world experiences', 'real-world experiences', 'where clarity tends to come from'] },
    { key: 'low_dream_theme_tracking', terms: ['not notice recurring dream themes', 'attention stays on waking life', 'recurring dream themes'] },
    { key: 'action_processing_change', terms: ['process change through action', 'doing something helps me understand', 'doing something helps you understand'] },
    { key: 'beneath_surface_attention', terms: ['beneath the surface still wants attention', 'something beneath the surface', 'wants attention'] },
    { key: 'symbols_grounded_real', terms: ['notice symbols dreams or patterns', 'connected to something real', 'symbols dreams or patterns'] },
    { key: 'meaning_clarifies_actual_life', terms: ['meaning matters most when it helps clarify', 'actual life', 'clarify my actual life'] },
    { key: 'symbolism_reality_resistance', terms: ['open to symbolism', 'too far removed from reality', 'removed from reality'] },
    { key: 'dream_image_true_feeling', terms: ['dream or image may stay with me', 'touches something true', 'dream or image'] },
    { key: 'meaning_connected_recognizable', terms: ['connects back to a feeling choice relationship or pattern', 'feeling choice relationship or pattern', 'pattern i can recognize'] },
    { key: 'reflection_without_disappearing', terms: ['enjoy reflection but do not want to disappear into it', 'disappear into it', 'reflection but do not want'] },
    { key: 'symbols_not_replace_happened', terms: ['symbols may help me understand something', 'do not replace what happened', 'replace what happened'] },
    { key: 'intuition_and_evidence', terms: ['intuition and evidence in the same hand', 'both intuition and evidence', 'same hand'] },
    { key: 'pattern_with_context', terms: ['pattern matters', 'context around it', 'so does the context'] },
    { key: 'meaning_grounded_real_life', terms: ['meaning deepen my understanding', 'real life', 'float away from my real life'] },
    { key: 'symbolic_self_understanding', terms: ['understand myself through images', 'dreams patterns and symbols', 'symbols before direct explanation'] },
    { key: 'metaphor_before_practical', terms: ['feeling or metaphor before it becomes practical', 'metaphor before it becomes practical', 'before it becomes practical'] },
    { key: 'repeated_symbols_pointing', terms: ['repeated symbols', 'pointing toward something', 'symbols and feel that they are pointing'] },
    { key: 'emotional_truth_symbol', terms: ['carries emotional truth', 'dream image song color or phrase', 'emotional truth'] },
    { key: 'nonliteral_feels_real', terms: ['not need something to be literal', 'to feel real', 'not literal for it to feel real'] },
    { key: 'symbolism_accesses_unsaid', terms: ['direct language misses', 'symbolic meaning may help', 'access things that direct language'] },
    { key: 'intuition_before_explanation', terms: ['trust intuition before i can explain', 'trust intuition before you can explain', 'before i can explain why'] },
    { key: 'inner_world_patterns', terms: ['inner world may speak in patterns', 'patterns rather than conclusions', 'inner world speaks in patterns'] },
    { key: 'indirect_meaning_connection', terms: ['meaning when it arrives indirectly', 'arrives indirectly', 'connected to meaning when'] },
    { key: 'symbolism_waking_life_check', terms: ['symbolism guide me while still checking', 'connects to my waking life', 'connects to your waking life'] },
    { key: 'moves_on_to_avoid_heavy', terms: ['move on from things quickly', 'staying would feel heavy', 'would feel heavy'] },
    { key: 'past_revisiting_unhelpful', terms: ['revisiting the past may not feel helpful', 'something is unfinished', 'past may not feel helpful'] },
    { key: 'next_over_lingering', terms: ['what is next instead of what still lingers', 'what still lingers', 'focus on what is next'] },
    { key: 'unprocessed_forward_easier', terms: ['feelings may stay unprocessed', 'moving forward feels easier', 'unprocessed because moving forward'] },
    { key: 'low_return_after_over', terms: ['not feel pulled to return', 'once it is over', 'return to something once'] },
    { key: 'forward_motion_over_reflection', terms: ['forward motion over reflection', 'prefer forward motion', 'over reflection'] },
    { key: 'emotions_not_registered', terms: ['emotions may not fully register', 'did not stay with them', 'fully register'] },
    { key: 'relief_in_closing_ununderstood', terms: ['relief in closing chapters', 'not fully understood', 'closing chapters'] },
    { key: 'later_importance_realization', terms: ['not realize something mattered more until much later', 'mattered more until much later', 'much later'] },
    { key: 'reflection_prevents_unacknowledged', terms: ['letting some reflection in', 'do not stay unacknowledged beneath the surface', 'beneath the surface'] },
    { key: 'subtle_shift_blindspot', terms: ['not register small shifts', 'small shifts in how i feel', 'change becomes noticeable only when'] },
    { key: 'obvious_change_only', terms: ['subtle improvements or easing may pass', 'bigger changes stand out', 'only when obvious or intense'] },
    { key: 'low_gradual_progress_tracking', terms: ['not track gradual progress', 'gradual progress', 'nothing has changed'] },
    { key: 'full_relief_need', terms: ['relief more when it arrives fully', 'not in small pieces', 'partial shifts feel incomplete'] },
    { key: 'threshold_awareness', terms: ['crosses a certain threshold', 'threshold', 'not register as meaningful'] },
    { key: 'improvement_blindspot', terms: ['easier to notice what is wrong than what is improving', "what's wrong than what's improving", 'improvement is obvious'] },
    { key: 'low_ease_savoring', terms: ['not pause to take in small moments of ease', 'small moments of ease', 'pass quickly without being fully experienced'] },
    { key: 'noticeable_change_tracking', terms: ['rely on noticeable changes', 'noticeable changes to tell me how i am doing', 'without them it can feel unclear'] },
    { key: 'strong_signal_trust', terms: ['trust bigger signals more than quieter ones', 'strong feelings feel more reliable', 'bigger signals'] },
    { key: 'small_shift_learning', terms: ['recognize the smaller shifts', 'smaller shifts that lead there', 'learning to recognize smaller shifts'] },
    { key: 'small_calm_duration_doubt', terms: ['small moment of calm', 'wonder if it will last', 'if it will last'] },
    { key: 'relief_flashes_caution', terms: ['relief may show up in little flashes', 'stays cautious around it', 'little flashes'] },
    { key: 'softening_interrupt_check', terms: ['body soften briefly', 'checking whether something will interrupt', 'whether something will interrupt'] },
    { key: 'small_good_not_trusted', terms: ['small good moments may be real', 'not feel strong enough to trust', 'strong enough to trust'] },
    { key: 'ease_waits_for_proof', terms: ['believe the ease is safe', 'waits for proof', 'ease is safe'] },
    { key: 'lightness_partial_day', terms: ['moment of lightness may matter', 'does not change the whole day', 'lightness may matter'] },
    { key: 'temporary_relief_discount', terms: ['small relief because it feels too temporary', 'too temporary to count', 'temporary to count'] },
    { key: 'calm_repetition_needed', terms: ['calm may need repetition', 'body believes it is more than a pause', 'more than a pause'] },
    { key: 'glimmer_expectation_hesitation', terms: ['notice glimmers but still hesitate', 'affect my expectations', 'affect your expectations'] },
    { key: 'small_good_moments_matter', terms: ['letting small good moments matter', 'prove everything is okay', 'small good moments matter'] },
    { key: 'small_changes_early', terms: ['notice small changes before they become obvious', 'small changes before they become obvious', 'before they become obvious'] },
    { key: 'slight_easing_tension_energy', terms: ['slight easing', 'small tension', 'tiny shift in energy'] },
    { key: 'trusts_subtle_signals', terms: ['trust subtle signals', 'nothing dramatic has happened', 'subtle signals even when'] },
    { key: 'small_relief_signals_change', terms: ['small moments of relief may matter', 'show that something is changing', 'something is changing'] },
    { key: 'tiny_increment_progress', terms: ['progress in tiny increments', 'big breakthrough', 'tiny increments'] },
    { key: 'early_signs_settling_strain', terms: ['early signs of settling strain or movement', 'settling strain or movement', 'awareness may catch early signs'] },
    { key: 'encouraged_by_small_shifts', terms: ['encouraged by small shifts', 'others would overlook', 'small shifts that others would overlook'] },
    { key: 'subtle_changes_self_understanding', terms: ['subtle changes may help me understand myself', 'before things become intense', 'help you understand yourself'] },
    { key: 'meaningful_without_drama', terms: ['need something to be dramatic', 'feel meaningful', 'not need something to be dramatic'] },
    { key: 'small_signals_without_overreading', terms: ['small signals guide me', 'reading too much into every tiny change', 'guide you without reading too much'] },
    { key: 'connection_glimmer', terms: ['connected', 'connection', 'understood', 'warm conversation'] },
    { key: 'creative_aliveness', terms: ['inspired', 'alive', 'spark', 'creative energy'] },
    { key: 'joy_tolerance', terms: ['joy', 'happy', 'delight', 'good thing'] },
    { key: 'play_glimmer', terms: ['play', 'playful', 'fun', 'silly'] },
  ];

  for (const journal of journals) {
    const date = asDateKey(journal.date);
    if (!date) continue;

    const content = String(journal.text ?? journal.content ?? '').toLowerCase();
    addKeywordSignals(signals, 'journal', date, content, journalSignals, 0.6);
  }

  return signals;
}

/**
 * Normalizes Sleep into V2 UserSignals.
 */
export function normalizeSleepV2(sleepLogs: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  for (const sleep of sleepLogs) {
    const date = asDateKey(sleep.date);
    if (!date) continue;

    const hours = sleep.hours ?? sleep.durationHours;
    const quality = sleep.quality ?? sleep.sleepQuality;

    if (typeof hours === 'number' && hours < 6) {
      addSignal(signals, 'low_sleep', 'sleep', date, 0.8, {
        label: 'Short sleep',
        value: hours,
      });
    }

    if (typeof quality === 'number' && quality <= 2) {
      addSignal(signals, 'poor_sleep_quality', 'sleep', date, 0.7, {
        label: 'Poor sleep quality',
        value: quality,
      });
    }

    if (typeof hours === 'number' && hours >= 7) {
      addSignal(signals, 'restorative_moment', 'sleep', date, 0.62, {
        label: 'Enough sleep',
        value: hours,
      });
    }

    if (typeof quality === 'number' && quality >= 4) {
      addSignal(signals, 'restorative_moment', 'sleep', date, 0.72, {
        label: 'Restorative sleep',
        value: quality,
      });
      addSignal(signals, 'body_lightness', 'sleep', date, 0.55, {
        label: 'Rested body',
        value: quality,
      });
    }
  }

  return signals;
}

/**
 * Normalizes dream entries into V2 UserSignals.
 */
export function normalizeDreamsV2(dreams: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  const textMappings: KeywordSignal[] = [
    { key: 'dream_searching', terms: ['search', 'looking for', 'lost', 'missing', 'find '] },
    { key: 'dream_home', terms: ['home', 'house', 'room', 'childhood', 'apartment'] },
    { key: 'dream_conflict', terms: ['argue', 'fight', 'conflict', 'chase', 'running from', 'threat'] },
    { key: 'dream_protection', terms: ['protect', 'guard', 'rescue', 'hide', 'save '] },
    { key: 'dream_loss', terms: ['loss', 'lost someone', 'death', 'grief', 'leaving', 'gone'] },
    { key: 'dream_relief', terms: ['relief', 'safe', 'comfort', 'beautiful', 'reunion', 'peaceful'] },
    { key: 'dream_repeated_symbol', terms: ['recurring', 'repeated', 'again', 'same place', 'same dream'] },
  ];

  const feelingMappings: Record<string, SignalKey[]> = {
    anxious: ['dream_after_stress', 'dream_emotional_tone'],
    panicked: ['dream_after_stress', 'dream_conflict'],
    terrified: ['dream_after_stress', 'dream_conflict'],
    scared: ['dream_after_stress', 'dream_emotional_tone'],
    alarmed: ['dream_after_stress', 'dream_emotional_tone'],
    overwhelmed: ['dream_after_stress', 'emotional_heaviness'],
    urgent: ['dream_after_stress', 'preparedness'],
    trapped: ['dream_conflict', 'dream_searching'],
    chased: ['dream_conflict', 'dream_after_stress'],
    betrayed: ['dream_emotional_tone', 'rupture_sensitivity'],
    lonely: ['dream_emotional_tone', 'loneliness'],
    isolated: ['dream_emotional_tone', 'belonging_ache'],
    vulnerable: ['dream_emotional_tone', 'selective_vulnerability'],
    powerless: ['dream_emotional_tone', 'autonomy_need'],
    heavy: ['dream_emotional_tone', 'emotional_heaviness'],
    exhausted: ['dream_emotional_tone', 'depletion'],
    numb: ['dream_emotional_tone', 'numbness_vs_calm'],
    grieving: ['dream_loss', 'dream_emotional_tone'],
    calm: ['dream_relief', 'quiet_safety'],
    peaceful: ['dream_relief', 'quiet_safety'],
    relieved: ['dream_relief', 'relief'],
    safe: ['dream_relief', 'somatic_safety'],
    curious: ['dream_searching', 'meaning_making'],
  };

  const themeMappings: Record<string, SignalKey[]> = {
    adventure: ['dream_searching'],
    conflict: ['dream_conflict', 'dream_after_stress'],
    connection: ['dream_after_relationship_theme', 'connection_glimmer'],
    transformation: ['dream_unfinished_processing', 'transformation_season'],
    mystery: ['dream_searching', 'dream_repeated_symbol'],
    survival: ['dream_protection', 'dream_conflict'],
    loss: ['dream_loss'],
    discovery: ['dream_searching', 'meaning_making'],
    mundane: ['dream_emotional_tone'],
    surreal: ['dream_repeated_symbol', 'dream_emotional_tone'],
    returning_home: ['dream_home'],
    home: ['dream_home'],
  };

  for (const dream of dreams) {
    const date = asDateKey(dream.date);
    if (!date) continue;

    const dreamText = String(dream.dreamText ?? dream.text ?? dream.notes ?? '');
    const dreamMood = String(dream.dreamMood ?? dream.mood ?? '');
    const searchable = asSearchText([dreamText, dreamMood]);

    if (dreamText.trim().length > 20) {
      addSignal(signals, 'dream_unfinished_processing', 'dream', date, 0.7, {
        label: 'Active dreaming',
      });
    }

    addKeywordSignals(signals, 'dream', date, searchable, textMappings, 0.65);

    const rawFeelings = parseJson<({ id?: string; label?: string; intensity?: number } | string)[]>(dream.dreamFeelings)
      ?? parseJson<({ id?: string; label?: string; intensity?: number } | string)[]>(dream.feelings)
      ?? [];
    for (const feeling of rawFeelings) {
      const id = typeof feeling === 'string' ? feeling : feeling.id ?? feeling.label;
      if (!id) continue;

      const normalized = id.toLowerCase().replace(/\s+/g, '_');
      const strength = strengthFromIntensity(
        typeof feeling === 'string' ? undefined : feeling.intensity,
        0.68,
      );
      for (const key of feelingMappings[normalized] ?? ['dream_emotional_tone']) {
        addSignal(signals, key, 'dream', date, strength, { label: normalized });
      }
    }

    const metadata = parseJson<{ theme?: string; overallTheme?: string; recurring?: boolean }>(dream.dreamMetadata)
      ?? dream.metadata
      ?? {};
    const theme = String(metadata.theme ?? metadata.overallTheme ?? '').toLowerCase();
    for (const key of themeMappings[theme] ?? []) {
      addSignal(signals, key, 'dream', date, 0.66, { label: theme });
    }
    if (metadata.recurring) {
      addSignal(signals, 'dream_repeated_symbol', 'dream', date, 0.75, { label: 'recurring dream' });
    }
  }

  return signals;
}

/**
 * Normalizes Body Map entries into V2 UserSignals.
 */
export function normalizeBodyMapV2(bodyMaps: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  const cueMap: Record<string, SignalKey[]> = {
    chest: ['chest_pressure'],
    heart: ['chest_pressure'],
    shoulders: ['shoulder_burden'],
    shoulder: ['shoulder_burden'],
    back: ['shoulder_burden'],
    neck: ['shoulder_burden'],
    jaw: ['jaw_restraint'],
    throat: ['throat_tightness', 'jaw_restraint'],
    stomach: ['gut_signal'],
    gut: ['gut_signal'],
    belly: ['gut_signal'],
    solar_plexus: ['gut_signal'],
    head: ['head_pressure'],
    headache: ['head_pressure'],
    migraine: ['head_pressure'],
    brain_fog: ['head_pressure'],
    foggy_head: ['head_pressure'],
    breath: ['breath_change'],
    breathing: ['breath_change'],
    heavy: ['body_heaviness'],
    heaviness: ['body_heaviness'],
    light: ['body_lightness'],
    lightness: ['body_lightness'],
    release: ['tension_release'],
    released: ['tension_release'],
    relaxed: ['tension_release', 'somatic_safety'],
    soft: ['tension_release', 'somatic_safety'],
    open: ['body_lightness', 'somatic_safety'],
    warm: ['somatic_safety'],
    steady: ['somatic_safety'],
    settled: ['somatic_safety'],
    ease: ['body_lightness'],
    safety: ['somatic_safety'],
    safe: ['somatic_safety'],
    sensory: ['sensory_sensitivity'],
    overstimulated: ['sensory_sensitivity'],
    over_stimulated: ['sensory_sensitivity'],
    sensory_overload: ['sensory_sensitivity'],
    noise: ['sensory_sensitivity'],
    loud: ['sensory_sensitivity'],
    bright: ['sensory_sensitivity'],
    lights: ['sensory_sensitivity'],
    screens: ['sensory_sensitivity'],
    clutter: ['sensory_sensitivity'],
    cluttered: ['sensory_sensitivity'],
    crowded: ['sensory_sensitivity'],
    texture: ['sensory_sensitivity'],
    overload: ['sensory_sensitivity', 'body_heaviness'],
    overloaded: ['sensory_sensitivity', 'body_heaviness'],
    shutdown: ['body_heaviness'],
    shut_down: ['body_heaviness'],
    bracing: ['calm_bracing'],
    calm: ['somatic_safety'],
  };

  for (const bodyMap of bodyMaps) {
    const date = asDateKey(bodyMap.date);
    if (!date) continue;

    const strength = strengthFromIntensity(bodyMap.intensity, 0.7);
    const cues = [
      ...(bodyMap.cues ?? []),
      bodyMap.region,
      bodyMap.sensation,
      bodyMap.emotion,
    ]
      .filter((cue): cue is string => typeof cue === 'string' && cue.trim().length > 0)
      .map((cue) => cue.toLowerCase().replace(/\s+/g, '_'));

    let matchedAny = false;
    for (const cue of cues) {
      for (const key of cueMap[cue] ?? []) {
        matchedAny = true;
        addSignal(signals, key, 'bodyMap', date, strength, { label: cue });
      }
    }

    if (matchedAny || cues.length > 0) {
      addSignal(signals, 'body_knows_first', 'bodyMap', date, Math.max(0.5, strength - 0.15), {
        label: 'Physical cue',
      });
    }
  }

  return signals;
}

/**
 * Normalizes daily reflection/self-knowledge answers into V2 UserSignals.
 */
export function normalizeReflectionAnswersV2(reflectionAnswers: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  const categorySignals: Record<string, SignalKey[]> = {
    values: ['meaning_making', 'self_trust_growth', 'purpose_signal'],
    archetypes: ['pattern_recognition', 'transformation_season', 'self_definition'],
    cognitive: ['deep_processing', 'need_for_exact_words', 'pattern_recognition'],
    intelligence: ['pattern_recognition', 'deep_processing', 'creative_processing'],
  };

  const keywordSignals: KeywordSignal[] = [
    { key: 'support_need', terms: ['support', 'help', 'held', 'care', 'comfort'] },
    { key: 'asks_for_support', terms: ['asked for help', 'asked for support', 'reached out', 'asked someone', 'told them i need', 'told someone i need'] },
    { key: 'support_scarcity', terms: ['alone', 'unsupported', 'scarcity', 'no one'] },
    { key: 'minimizes_need', terms: ["it's fine", 'its fine', 'not a big deal', "don't want to bother", 'dont want to bother', 'i can handle it', 'should not need', "shouldn't need", 'minimized my need'] },
    { key: 'wants_to_be_caught', terms: ['wish someone noticed', 'wanted someone to notice', 'check in on me', 'checked in on me', 'catch me before', 'without asking'] },
    { key: 'receiving_care_difficulty', terms: ['hard to receive', 'hard receiving', 'awkward receiving', 'deflected help', 'deflect help', 'could not accept help', "couldn't accept help"] },
    { key: 'fear_of_being_too_much', terms: ['too much', 'a burden', 'burden', 'needy', 'overwhelming people', 'too needy'] },
    { key: 'loneliness', terms: ['lonely', 'isolated', 'left out'] },
    { key: 'belonging_ache', terms: ['do not belong', "don't belong", 'dont belong', 'not belong', 'not fit', 'not fitting', 'out of place', 'outsider', 'excluded', 'left out', 'not represented'] },
    { key: 'chosen_family', terms: ['chosen family', 'found family', 'my people', 'community care', 'mutual aid', 'safe community'] },
    { key: 'small_circle_pressure', terms: ['small circle', 'small support system', 'only person i can ask', 'no one else to ask'] },
    { key: 'boundary_rebuilding', terms: ['boundary', 'boundaries', 'limit', 'limits'] },
    { key: 'says_no', terms: ['said no', 'saying no', 'my no', 'refused'] },
    { key: 'inner_authority', terms: ['permission', 'my truth', 'trust myself', 'inner authority'] },
    { key: 'guilt', terms: ['guilt', 'guilty', 'selfish'] },
    { key: 'rest_guilt', terms: ['lazy', 'should be doing', 'should do', 'rest'] },
    { key: 'responsibility_weight', terms: ['responsibility', 'responsible', 'obligation', 'carry', 'carrying'] },
    { key: 'caretaking_pressure', terms: ['caretake', 'caretake', 'take care of everyone'] },
    { key: 'mutuality_need', terms: ['mutual', 'reciprocal', 'one-sided', 'both ways'] },
    { key: 'repair_need', terms: ['repair', 'apology', 'make it right'] },
    { key: 'consistency_need', terms: ['reassurance', 'consistent', 'follow through', 'chosen'] },
    { key: 'wants_to_be_seen', terms: ['seen', 'noticed', 'understood', 'remembered'] },
    { key: 'meaning_making', terms: ['meaning', 'truth', 'purpose', 'values', 'why'] },
    { key: 'truth_telling', terms: ['honest', 'honesty', 'truth'] },
    { key: 'gratitude_and_grief', terms: ['grateful', 'gratitude', 'thankful'] },
    { key: 'relief', terms: ['relief', 'relieved', 'easier'] },
    { key: 'transformation_season', terms: ['change', 'growth', 'becoming', 'transform'] },
    { key: 'growth_edge', terms: ['growth edge', 'learning', 'practice'] },
    { key: 'justice_sensitivity', terms: ['justice', 'unfair', 'harm', 'discrimination', 'racism', 'sexism', 'homophobia', 'transphobia', 'ableism', 'classism', 'bias', 'institutional harm'] },
    { key: 'fairness_need', terms: ['fair', 'fairness', 'equal', 'unequal', 'double standard', 'bias'] },
    { key: 'values_conflict', terms: ['against my values', 'not aligned', 'misaligned', 'values conflict', 'institution', 'bureaucracy', 'cultural expectation', 'cultural expectations'] },
    { key: 'integrity_cost', terms: ['cost me to be honest', 'cost of honesty', 'choosing alignment', 'choose alignment'] },
    { key: 'creative_processing', terms: ['creative', 'write', 'writing', 'art', 'music'] },
    { key: 'expression_need', terms: ['need to express', 'needed to express', 'need to say', 'needed to say', 'say it out loud', 'get it out', 'put it into words', 'make it visible'] },
    { key: 'voice_emerging', terms: ['found my voice', 'finding my voice', 'use my voice', 'using my voice', 'speak up', 'spoke up', 'said what i meant', 'my voice'] },
    { key: 'creative_block', terms: ['creative block', 'blocked creatively', 'stuck creatively', 'cannot write', "can't write", 'cannot make', "can't make", 'blank page', 'no words'] },
    { key: 'beauty_making', terms: ['rearranged', 'decorated', 'made it beautiful', 'lighting', 'color palette', 'designed the space', 'made the space', 'arranged the room'] },
    { key: 'wants_to_build', terms: ['build', 'make', 'create'] },
    { key: 'time_scarcity', terms: ['rushing', 'rushed', 'not enough time', 'too little time', 'deadline'] },
    { key: 'mental_load', terms: ['mental load', 'tracking everything', 'remembering everything', 'juggling'] },
    { key: 'always_on', terms: ['always on', 'switched on', 'on alert', 'cannot turn off'] },
    { key: 'preparedness', terms: ['prepared', 'planning', 'plan ahead', 'checklist'] },
    { key: 'overfunctioning', terms: ['doing everything', 'handling everything', 'take over'] },
    { key: 'decision_uncertainty', terms: ['decision', 'decide', 'choice', 'choosing', 'task switching', 'context switching', 'switching tasks', 'switch contexts', 'change gears', 'changing gears'] },
    { key: 'clarity_before_release', terms: ['need clarity', 'needed clarity', 'clarity before', 'understand before', 'understand it before', 'understand it first'] },
    { key: 'analysis_as_regulation', terms: ['analyze', 'analyzing', 'analysis helps', 'logic helps', 'make a system', 'made a system', 'make it make sense', 'map it out'] },
    { key: 'intellectualizes_feeling', terms: ['intellectualize', 'intellectualizing', 'thinking instead of feeling', 'in my head', 'think before i feel'] },
    { key: 'seeks_context', terms: ['need context', 'needed context', 'full context', 'full picture', 'backstory', 'missing context'] },
    { key: 'need_for_exact_words', terms: ['exact words', 'precise words', 'right words', 'accurate words'] },
    { key: 'pattern_recognition', terms: ['pattern', 'patterns', 'systems', 'map it', 'mapping'] },
    { key: 'deep_processing', terms: ['deep process', 'deep processing', 'need time to process', 'needed time to process', 'process slowly'] },
    { key: 'high_standards', terms: ['high standards', 'quality', 'excellence', 'do it right'] },
    { key: 'creative_standards', terms: ['creative standards', 'make it better'] },
    { key: 'vision_gap', terms: ['too many ideas', 'unfinished ideas', 'follow through', 'cannot finish'] },
    { key: 'invisible_labor', terms: ['invisible labor', 'chores', 'logistics', 'scheduling', 'household'] },
    { key: 'ritual_regulation', terms: ['routine', 'habit', 'ritual', 'system', 'warm up', 'wind down'] },
    { key: 'needs_pause', terms: ['need a pause', 'need pause', 'needed a pause', 'need a break', 'needed a break', 'buffer', 'transition', 'change of plans', 'routine changed', 'warm up', 'wind down'] },
    { key: 'calm_bracing', terms: ['interruption', 'interrupted', 'unexpected change', 'change of plans'] },
    { key: 'sensory_sensitivity', terms: ['sensory', 'overstimulated', 'over-stimulated', 'over stimulation', 'sensory overload', 'too loud', 'too bright', 'noise', 'lights', 'clutter', 'crowded', 'texture', 'screens'] },
    { key: 'head_pressure', terms: ['head pressure', 'headache', 'migraine', 'brain fog', 'foggy head'] },
    { key: 'body_heaviness', terms: ['shutdown', 'shut down', 'body heavy', 'heavy body', 'body went heavy'] },
    { key: 'selective_vulnerability', terms: ['masking', 'mask', 'performing', 'performative', 'pretending i am fine', 'pretending to be fine', 'guarded', 'edited myself', 'translate myself'] },
    { key: 'becoming_visible', terms: ['unmask', 'unmasking', 'be myself', 'show myself', 'less edited', 'not edit myself'] },
    { key: 'wants_to_be_seen', terms: ['seen accurately', 'understood accurately', 'misunderstood', 'accurately understood'] },
    { key: 'identity_rewriting', terms: ['identity', 'who i am', 'old story', 'new story', 'rewriting my story', 'becoming someone'] },
    { key: 'old_story_loosening', terms: ['old story', 'old role', 'old label', 'no longer who i am', 'used to be'] },
    { key: 'chapter_shift', terms: ['new chapter', 'life chapter', 'chapter shift', 'season changing', 'transition season'] },
    { key: 'self_definition', terms: ['define myself', 'defined myself', 'self-definition', 'who i am', 'named myself'] },
    { key: 'past_self_compassion', terms: ['past self', 'younger self', 'earlier version', 'little me'] },
    { key: 'self_forgiveness', terms: ['forgive myself', 'forgiven myself', 'self forgiveness'] },
    { key: 'inner_critic_softening', terms: ['inner critic', 'kinder to myself', 'kind to myself', 'self-talk', 'talk to myself'] },
    { key: 'permission_shift', terms: ['allowed myself', 'allow myself', 'gave myself permission', 'permission', 'let myself'] },
    { key: 'choosing_self', terms: ['chose myself', 'choose myself', 'choosing myself', 'picked myself'] },
    { key: 'less_explaining', terms: ['less explaining', 'stopped explaining', 'no longer explaining', 'explain less'] },
    { key: 'limits_tested', terms: ['my limit', 'my limits', 'capacity limit', 'reached my limit', 'bandwidth'] },
    { key: 'integrates_insight', terms: ['integrated', 'clicked', 'landed', 'came together', 'i realized'] },
    { key: 'boundary_guilt', terms: ['guilty for saying no', 'guilt after no', 'felt bad saying no', 'guilty after saying no'] },
    { key: 'says_no', terms: ['said no', 'saying no', 'say no', 'declined', 'turned it down'] },
    { key: 'peace_boundary', terms: ['protect my peace', 'protected my peace', 'needed distance', 'need distance', 'stepped back', 'space for peace'] },
    { key: 'distance_for_safety', terms: ['needed distance', 'need distance', 'stepped back', 'pulled back', 'needed space'] },
    { key: 'autonomy_need', terms: ['controlled', 'trapped', 'no choice', 'need autonomy', 'needed autonomy', 'make my own choice', 'my own choice'] },
    { key: 'family_pattern_awareness', terms: ['family', 'family pattern', 'parent', 'childhood', 'generational', 'inherited'] },
    { key: 'family_loyalty_tension', terms: ['family obligation', 'cultural expectation', 'cultural expectations', 'tradition', 'loyalty', 'disappoint my family'] },
    { key: 'breaks_old_pattern', terms: ['break the cycle', 'break cycle', 'not pass this on', 'do it differently', 'pattern breaker'] },
    { key: 'home_as_safety', terms: ['home', 'room', 'space', 'safe at home', 'home felt safe', 'home feels safe', 'my apartment', 'sanctuary'] },
    { key: 'rooting_need', terms: ['roots', 'rooted', 'stability', 'stable base', 'home base', 'housing', 'place to land'] },
    { key: 'caretaking_pressure', terms: ['caregiver', 'caregiving', 'childcare', 'eldercare', 'taking care of my', 'caring for my'] },
    { key: 'protective_care', terms: ['protect them', 'keep them safe', 'my kid', 'my child', 'my pet', 'elderly parent'] },
    { key: 'scarcity_scanning', terms: ['money', 'rent', 'bills', 'groceries', 'finances', 'financial', 'budget', 'income', 'job security', 'housing cost', 'medical bills'] },
    { key: 'fear_of_loss', terms: ['lose my job', 'lose housing', 'lose the apartment', 'lose stability', 'lose support', 'taken away'] },
    { key: 'energy_scarcity', terms: ['ration energy', 'rationing energy', 'limited energy', 'spoons', 'conserve energy'] },
    { key: 'faith_meaning', terms: ['faith', 'prayer', 'church', 'god', 'spiritual'] },
    { key: 'spiritual_depth', terms: ['sacred', 'soul', 'existential', 'ancestors', 'ancestral'] },
    { key: 'purpose_signal', terms: ['calling', 'service', 'cause', 'community work'] },
    { key: 'legacy_signal', terms: ['legacy', 'future generations', 'next generation', 'ancestors'] },
    { key: 'enoughness', terms: ['enough', 'sufficient'] },
    { key: 'hope', terms: ['hope', 'hopeful', 'possible', 'optimistic'] },
    { key: 'mood_improvement', terms: ['better today', 'lighter mood', 'mood lifted', 'felt better'] },
    { key: 'quiet_safety', terms: ['calm', 'peaceful', 'safe', 'settled', 'quiet'] },
    { key: 'low_stress', terms: ['less stressed', 'low stress', 'not stressed'] },
    { key: 'restorative_moment', terms: ['rested', 'restorative', 'rest helped', 'pause helped'] },
    { key: 'body_lightness', terms: ['lighter', 'lightness', 'body relaxed', 'looser'] },
    { key: 'tension_release', terms: ['released', 'let go', 'softened', 'exhale'] },
    { key: 'somatic_safety', terms: ['felt safe in my body', 'body felt safe', 'settled body'] },
    { key: 'support_abundance_shift', terms: ['supported', 'help arrived', 'not alone', 'backed up'] },
    { key: 'receiving_openness', terms: ['received help', 'accepted help', 'compliment', 'gift'] },
    { key: 'connection_glimmer', terms: ['connected', 'connection', 'understood', 'warm conversation'] },
    { key: 'creative_aliveness', terms: ['inspired', 'alive', 'spark', 'creative energy'] },
    { key: 'joy_tolerance', terms: ['joy', 'happy', 'delight', 'good thing'] },
    { key: 'play_glimmer', terms: ['play', 'playful', 'fun', 'silly'] },
  ];

  for (const answer of reflectionAnswers) {
    const date = asDateKey(answer.date ?? answer.sealedAt);
    if (!date) continue;

    const category = String(answer.category ?? '').toLowerCase();
    const strength = strengthFromScale(answer.scaleValue, 0.6);
    for (const key of categorySignals[category] ?? []) {
      addSignal(signals, key, 'reflectionBank', date, strength * 0.85, {
        label: category || 'reflection',
        phrase: answer.questionText,
      });
    }

    const searchable = asSearchText([
      answer.questionText,
      answer.answer,
      answer.notes,
      category,
    ]);
    addKeywordSignals(signals, 'reflectionBank', date, searchable, keywordSignals, strength);
  }

  return signals;
}

/**
 * Normalizes drain-side trigger logs into V2 UserSignals.
 */
export function normalizeTriggerLogsV2(triggerLogs: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  const triggerSignals: KeywordSignal[] = [
    { key: 'mutuality_need', terms: ['conflict', 'relationship', 'partner', 'friend', 'rejection'] },
    { key: 'support_need', terms: ['support', 'help', 'held', 'care', 'comfort'] },
    { key: 'asks_for_support', terms: ['asked for help', 'asked for support', 'reached out', 'asked someone', 'told them i need', 'told someone i need'] },
    { key: 'minimizes_need', terms: ["it's fine", 'its fine', 'not a big deal', "don't want to bother", 'dont want to bother', 'i can handle it', 'should not need', "shouldn't need", 'minimized my need'] },
    { key: 'wants_to_be_caught', terms: ['wish someone noticed', 'wanted someone to notice', 'check in on me', 'checked in on me', 'catch me before', 'without asking'] },
    { key: 'receiving_care_difficulty', terms: ['hard to receive', 'hard receiving', 'awkward receiving', 'deflected help', 'deflect help', 'could not accept help', "couldn't accept help"] },
    { key: 'fear_of_being_too_much', terms: ['too much', 'a burden', 'burden', 'needy', 'overwhelming people', 'too needy'] },
    { key: 'belonging_ache', terms: ['do not belong', "don't belong", 'dont belong', 'not belong', 'not fit', 'not fitting', 'out of place', 'outsider', 'excluded', 'left out', 'not represented'] },
    { key: 'chosen_family', terms: ['chosen family', 'found family', 'my people', 'community care', 'mutual aid', 'safe community'] },
    { key: 'small_circle_pressure', terms: ['small circle', 'small support system', 'only person i can ask', 'no one else to ask'] },
    { key: 'repair_need', terms: ['repair', 'apology', 'rupture', 'argument'] },
    { key: 'consistency_need', terms: ['abandon', 'uncertain', 'ignored', 'unseen', 'text'] },
    { key: 'relationship_safety_testing', terms: ['trust', 'testing', 'safe with'] },
    { key: 'boundary_rebuilding', terms: ['boundary', 'people-pleasing', 'saying yes', 'limit'] },
    { key: 'boundary_guilt', terms: ['guilt after no', 'guilty for saying no'] },
    { key: 'responsibility_weight', terms: ['responsibility', 'unfinished', 'deadline', 'work'] },
    { key: 'time_scarcity', terms: ['rushing', 'late', 'not enough time', 'deadline'] },
    { key: 'mental_load', terms: ['mental load', 'tracking everything', 'remembering', 'juggling', 'logistics'] },
    { key: 'always_on', terms: ['always on', 'switched on', 'on alert', 'on call', 'cannot turn off'] },
    { key: 'preparedness', terms: ['prepared', 'planning', 'plan ahead', 'checklist', 'ready'] },
    { key: 'overfunctioning', terms: ['doing everything', 'handling everything', 'take over', 'overfunction'] },
    { key: 'decision_uncertainty', terms: ['decision', 'decide', 'choice', 'choosing', 'task switching', 'context switching', 'switching tasks', 'switch contexts', 'change gears', 'changing gears'] },
    { key: 'high_standards', terms: ['high standards', 'perfect', 'quality', 'do it right'] },
    { key: 'vision_gap', terms: ['too many ideas', 'unfinished ideas', 'follow through'] },
    { key: 'invisible_labor', terms: ['invisible labor', 'chores', 'scheduling', 'household'] },
    { key: 'creative_processing', terms: ['writing', 'journaling', 'art', 'music', 'designing', 'making', 'drawing', 'composing', 'processing through'] },
    { key: 'expression_need', terms: ['need to express', 'needed to express', 'need to say', 'needed to say', 'say it out loud', 'get it out', 'put it into words', 'make it visible'] },
    { key: 'voice_emerging', terms: ['found my voice', 'finding my voice', 'use my voice', 'using my voice', 'speak up', 'spoke up', 'said what i meant', 'my voice'] },
    { key: 'creative_block', terms: ['creative block', 'blocked creatively', 'stuck creatively', 'cannot write', "can't write", 'cannot make', "can't make", 'blank page', 'no words'] },
    { key: 'beauty_making', terms: ['rearranged', 'decorated', 'made it beautiful', 'lighting', 'color palette', 'designed the space', 'made the space', 'arranged the room'] },
    { key: 'identity_rewriting', terms: ['identity', 'who i am', 'old story', 'new story', 'rewriting my story', 'becoming someone'] },
    { key: 'old_story_loosening', terms: ['old story', 'old role', 'old label', 'no longer who i am', 'used to be'] },
    { key: 'chapter_shift', terms: ['new chapter', 'life chapter', 'chapter shift', 'season changing', 'transition season'] },
    { key: 'self_definition', terms: ['define myself', 'defined myself', 'self-definition', 'who i am', 'named myself'] },
    { key: 'permission_shift', terms: ['allowed myself', 'allow myself', 'gave myself permission', 'permission', 'let myself'] },
    { key: 'choosing_self', terms: ['chose myself', 'choose myself', 'choosing myself', 'picked myself'] },
    { key: 'less_explaining', terms: ['less explaining', 'stopped explaining', 'no longer explaining', 'explain less'] },
    { key: 'limits_tested', terms: ['my limit', 'my limits', 'capacity limit', 'reached my limit', 'bandwidth'] },
    { key: 'scarcity_scanning', terms: ['money', 'rent', 'bills', 'groceries', 'finances', 'financial', 'budget', 'income', 'job security', 'housing cost', 'medical bills'] },
    { key: 'fear_of_loss', terms: ['lose my job', 'lose housing', 'lose the apartment', 'lose stability', 'lose support', 'taken away'] },
    { key: 'energy_scarcity', terms: ['ration energy', 'rationing energy', 'limited energy', 'spoons', 'conserve energy'] },
    { key: 'values_conflict', terms: ['against my values', 'not aligned', 'misaligned', 'values conflict', 'institution', 'bureaucracy', 'cultural expectation', 'cultural expectations'] },
    { key: 'integrity_cost', terms: ['cost me to be honest', 'cost of honesty', 'choosing alignment', 'choose alignment'] },
    { key: 'needs_pause', terms: ['need a pause', 'need pause', 'needed a pause', 'need a break', 'needed a break', 'buffer', 'transition', 'change of plans', 'routine changed', 'warm up', 'wind down'] },
    { key: 'calm_bracing', terms: ['interruption', 'interrupted', 'unexpected change', 'change of plans'] },
    { key: 'overextension', terms: ['overwhelmed', 'overwhelm', 'overstimulated', 'too much', 'screens'] },
    { key: 'sensory_sensitivity', terms: ['overstimulated', 'over-stimulated', 'over stimulation', 'sensory overload', 'sensory', 'noise', 'lights', 'crowded', 'screens', 'too loud', 'too bright', 'clutter', 'texture'] },
    { key: 'head_pressure', terms: ['head pressure', 'headache', 'migraine', 'brain fog', 'foggy head'] },
    { key: 'analysis_as_regulation', terms: ['analyze', 'analyzing', 'logic helps', 'make a system', 'made a system', 'make it make sense', 'map it out'] },
    { key: 'intellectualizes_feeling', terms: ['intellectualize', 'intellectualizing', 'thinking instead of feeling', 'in my head'] },
    { key: 'seeks_context', terms: ['need context', 'needed context', 'full context', 'full picture', 'missing context'] },
    { key: 'selective_vulnerability', terms: ['masking', 'mask', 'performing', 'performative', 'pretending i am fine', 'edited myself', 'translate myself'] },
    { key: 'becoming_visible', terms: ['unmask', 'unmasking', 'be myself', 'show myself', 'less edited', 'not edit myself'] },
    { key: 'support_scarcity', terms: ['alone', 'isolation', 'unsupported', 'lonely'] },
    { key: 'calm_bracing', terms: ['uncertainty', 'waiting', 'control', 'bracing'] },
    { key: 'autonomy_need', terms: ['controlled', 'choice', 'trapped', 'no choice', 'need autonomy', 'needed autonomy', 'make my own choice', 'my own choice'] },
    { key: 'guilt', terms: ['guilt', 'guilty', 'selfish'] },
    { key: 'boundary_guilt', terms: ['guilty for saying no', 'guilt after no', 'felt bad saying no', 'guilty after saying no'] },
    { key: 'says_no', terms: ['said no', 'saying no', 'say no', 'declined', 'turned it down'] },
    { key: 'peace_boundary', terms: ['protect my peace', 'protected my peace', 'needed distance', 'need distance', 'stepped back', 'space for peace'] },
    { key: 'distance_for_safety', terms: ['needed distance', 'need distance', 'stepped back', 'pulled back', 'needed space'] },
    { key: 'self_blame', terms: ['my fault', 'blame myself', 'failed'] },
    { key: 'justice_sensitivity', terms: ['unfair', 'injustice', 'harm', 'discrimination', 'racism', 'sexism', 'homophobia', 'transphobia', 'ableism', 'classism', 'bias', 'institutional harm'] },
    { key: 'fairness_need', terms: ['fairness', 'unequal', 'double standard', 'bias'] },
    { key: 'anger', terms: ['angry', 'rage', 'resent'] },
    { key: 'family_pattern_awareness', terms: ['family', 'family pattern', 'parent', 'sibling', 'childhood', 'generational', 'inherited'] },
    { key: 'family_loyalty_tension', terms: ['loyalty', 'disloyal', 'family obligation', 'cultural expectation', 'cultural expectations', 'tradition', 'disappoint my family'] },
    { key: 'breaks_old_pattern', terms: ['break the cycle', 'break cycle', 'not pass this on', 'do it differently', 'pattern breaker'] },
    { key: 'home_as_safety', terms: ['safe at home', 'home felt safe', 'home feels safe', 'my room', 'my apartment', 'sanctuary'] },
    { key: 'rooting_need', terms: ['roots', 'rooted', 'stability', 'stable base', 'home base', 'housing', 'place to land'] },
    { key: 'caretaking_pressure', terms: ['caregiver', 'caregiving', 'childcare', 'eldercare', 'taking care of my', 'caring for my'] },
    { key: 'protective_care', terms: ['protect them', 'keep them safe', 'my kid', 'my child', 'my pet', 'elderly parent'] },
    { key: 'faith_meaning', terms: ['faith', 'prayer', 'church', 'god'] },
    { key: 'spiritual_depth', terms: ['spiritual', 'sacred', 'soul', 'ancestors', 'ancestral'] },
    { key: 'chest_pressure', terms: ['chest', 'heart', 'tight'] },
    { key: 'jaw_restraint', terms: ['jaw', 'throat', 'neck'] },
    { key: 'shoulder_burden', terms: ['shoulder', 'back'] },
    { key: 'gut_signal', terms: ['gut', 'stomach', 'belly', 'nausea'] },
  ];

  for (const event of triggerLogs) {
    const date = asDateKey(event.date ?? event.timestamp);
    if (!date) continue;

    const strength = strengthFromIntensity(event.intensity, 0.68);
    const searchable = asSearchText([
      event.event,
      event.contextArea,
      event.resolution,
      event.beforeState,
      event.nsState,
      event.sensations,
    ]);

    const matchedAny = addKeywordSignals(signals, 'triggerLog', date, searchable, triggerSignals, strength);
    if (!matchedAny) {
      addSignal(signals, 'low_capacity', 'triggerLog', date, strength * 0.85, {
        label: 'draining event',
        signal: event.event,
      });
    }
    if (event.nsState === 'dorsal') {
      addSignal(signals, 'depletion', 'triggerLog', date, strength, {
        label: 'dorsal shutdown',
        signal: event.event,
      });
    }
  }

  return signals;
}

/**
 * Normalizes nourish-side glimmer logs into V2 UserSignals.
 */
export function normalizeGlimmerLogsV2(glimmerLogs: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  const glimmerSignals: KeywordSignal[] = [
    { key: 'quiet_safety', terms: ['quiet', 'low noise', 'low-noise', 'dim', 'solitude', 'alone time', 'rest', 'peace', 'calm'] },
    { key: 'restorative_moment', terms: ['rest', 'deep sleep', 'nap', 'pause', 'buffer'] },
    { key: 'nature_regulation', terms: ['nature', 'sunlight', 'tree', 'water', 'sky', 'outside'] },
    { key: 'beauty_glimmer', terms: ['beauty', 'beautiful', 'color', 'light', 'flowers'] },
    { key: 'beauty_regulation', terms: ['music', 'art', 'design', 'atmosphere'] },
    { key: 'connection_glimmer', terms: ['support', 'conversation', 'held', 'care', 'connection', 'friend'] },
    { key: 'chosen_family', terms: ['chosen family', 'found family', 'my people', 'community care', 'mutual aid', 'safe community'] },
    { key: 'support_abundance_shift', terms: ['belonged', 'included', 'welcomed', 'fit in'] },
    { key: 'receiving_openness', terms: ['received', 'help', 'compliment', 'gift', 'accepted help', 'let them help'] },
    { key: 'support_abundance_shift', terms: ['supported', 'backed up', 'help arrived', 'they checked in', 'someone noticed'] },
    { key: 'boundary_rebuilding', terms: ['boundary', 'said no', 'protected'] },
    { key: 'says_no', terms: ['said no', 'saying no', 'declined', 'turned it down'] },
    { key: 'peace_boundary', terms: ['protect my peace', 'protected my peace', 'needed distance', 'stepped back', 'space for peace'] },
    { key: 'self_trust_growth', terms: ['trusted myself', 'chose myself', 'honored myself'] },
    { key: 'creative_processing', terms: ['creative', 'creativity', 'writing', 'making', 'movement'] },
    { key: 'creative_aliveness', terms: ['alive', 'spark', 'inspired'] },
    { key: 'expression_need', terms: ['expressed', 'said it out loud', 'put it into words', 'shared it'] },
    { key: 'voice_emerging', terms: ['found my voice', 'used my voice', 'spoke up', 'said what i meant'] },
    { key: 'beauty_making', terms: ['rearranged', 'decorated', 'made it beautiful', 'lighting', 'color palette', 'designed the space', 'arranged the room'] },
    { key: 'permission_shift', terms: ['allowed myself', 'gave myself permission', 'let myself'] },
    { key: 'choosing_self', terms: ['chose myself', 'choose myself', 'picked myself'] },
    { key: 'self_trust_growth', terms: ['trusted myself', 'self trust', 'trusted my knowing'] },
    { key: 'future_self_orientation', terms: ['future self', 'future me', 'life i want', 'building a life'] },
    { key: 'tension_release', terms: ['release', 'exhale', 'softened', 'tears'] },
    { key: 'play_glimmer', terms: ['play', 'fun', 'silly', 'game'] },
    { key: 'laughter_glimmer', terms: ['laugh', 'laughter', 'humor'] },
    { key: 'joy_tolerance', terms: ['joy', 'happy', 'delight', 'good thing', 'enjoy'] },
    { key: 'hope', terms: ['hope', 'hopeful', 'possible', 'optimistic'] },
    { key: 'mood_improvement', terms: ['better', 'lighter mood', 'mood lifted'] },
    { key: 'high_energy', terms: ['energized', 'energy', 'motivated'] },
    { key: 'ordinary_sacred', terms: ['ordinary', 'sacred', 'ritual', 'small moment'] },
    { key: 'ritual_regulation', terms: ['routine', 'ritual', 'buffer', 'transition', 'slow start', 'gentle start', 'warm up', 'wind down'] },
    { key: 'needs_pause', terms: ['pause', 'buffer', 'transition', 'slow start', 'gentle start', 'warm up', 'wind down'] },
    { key: 'home_as_safety', terms: ['home', 'cozy', 'room'] },
    { key: 'rooting_need', terms: ['rooted', 'grounded', 'stable', 'home base', 'place to land'] },
    { key: 'faith_meaning', terms: ['faith', 'prayer', 'church', 'god'] },
    { key: 'spiritual_depth', terms: ['spiritual', 'sacred', 'soul', 'ancestors', 'ancestral'] },
    { key: 'enoughness', terms: ['enough', 'plenty', 'sufficient'] },
    { key: 'relief', terms: ['relief', 'relieved', 'easier'] },
    { key: 'body_lightness', terms: ['light', 'lighter', 'loose'] },
    { key: 'somatic_safety', terms: ['safe', 'settled', 'ventral'] },
  ];

  for (const event of glimmerLogs) {
    const date = asDateKey(event.date ?? event.timestamp);
    if (!date) continue;

    const strength = strengthFromIntensity(event.intensity, 0.65);
    const searchable = asSearchText([
      event.event,
      event.contextArea,
      event.resolution,
      event.beforeState,
      event.nsState,
      event.sensations,
    ]);

    const matchedAny = addKeywordSignals(signals, 'glimmerLog', date, searchable, glimmerSignals, strength);
    addSignal(signals, 'glimmer_softening', 'glimmerLog', date, matchedAny ? strength * 0.9 : strength, {
      label: matchedAny ? 'glimmer' : 'restoring event',
      signal: event.event,
    });
    if (event.nsState === 'ventral') {
      addSignal(signals, 'quiet_safety', 'glimmerLog', date, strength, {
        label: 'ventral regulation',
        signal: event.event,
      });
    }
  }

  return signals;
}

/**
 * Normalizes relationship mirror entries into V2 UserSignals.
 */
export function normalizeRelationshipMirrorsV2(relationshipMirrors: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  const relationshipTagLabels: Record<string, string> = {
    t1: 'People-pleasing',
    t2: 'Fear of abandonment',
    t3: 'Rushing intimacy',
    t4: 'Caretaking others',
    t5: 'Over-explaining',
    t6: 'Pulling away',
    t7: 'Going quiet',
    t8: 'Minimizing needs',
    t9: 'Shutting down',
    t10: 'Needing space',
    t11: 'Trying to manage the outcome',
    t12: 'Difficulty with boundaries',
    t13: 'Testing the connection',
    t14: 'Perfectionism in love',
    t15: 'Seeking reassurance',
    t16: 'Feeling too much',
    t17: 'Scanning for rejection',
    t18: 'Defensiveness',
    t19: 'Feeling trapped',
    t20: 'Distracting yourself',
    t21: 'Avoiding repair',
    t22: 'Needing certainty',
    t23: 'Pushing for answers',
    t24: 'Emotional monitoring',
    t25: 'Assuming the worst',
    t26: 'Fixing instead of feeling',
    t27: 'Holding resentment',
    s1: 'Asking directly',
    s2: 'Naming needs clearly',
    s3: 'Letting myself be seen',
    s4: 'Staying present',
    s5: 'Receiving care without deflecting',
    s6: 'Respecting space',
    s7: 'Offering repair',
    s8: 'Feeling grounded',
    s9: 'Trusting the connection',
    s10: 'Letting things unfold',
  };

  const tagSignalMap: Record<string, SignalKey[]> = {
    t1: ['responsibility_weight', 'boundary_rebuilding'],
    t2: ['relationship_safety_testing', 'consistency_need', 'support_scarcity'],
    t3: ['mutuality_need'],
    t4: ['caretaking_pressure', 'support_need'],
    t5: ['overexplaining', 'need_for_exact_words'],
    t6: ['calm_bracing', 'relationship_safety_testing'],
    t7: ['loneliness', 'low_capacity'],
    t8: ['support_scarcity', 'fear_of_being_too_much'],
    t9: ['low_capacity'],
    t10: ['boundary_rebuilding', 'calm_bracing'],
    t11: ['calm_bracing', 'trust_builds_slowly'],
    t12: ['boundary_rebuilding'],
    t13: ['consistency_need', 'emotional_availability_need'],
    t14: ['self_blame', 'guilt'],
    t15: ['consistency_need', 'emotional_availability_need', 'support_need'],
    t16: ['fear_of_being_too_much', 'vulnerability'],
    t17: ['relationship_safety_testing', 'tone_sensitivity', 'rupture_sensitivity'],
    t18: ['truth_over_harmony', 'selective_vulnerability'],
    t19: ['trapped', 'distance_for_safety', 'autonomy_need'],
    t20: ['avoidance', 'distance_for_safety'],
    t21: ['avoidance', 'repair_need', 'avoids_clear_boundary_for_comfort'],
    t22: ['control_for_uncertainty', 'consistency_need'],
    t23: ['control_for_uncertainty', 'decision_uncertainty', 'need_for_exact_words'],
    t24: ['relationship_safety_testing', 'tone_sensitivity'],
    t25: ['worst_case_preparation', 'rupture_sensitivity'],
    t26: ['caretaking_pressure', 'avoidance'],
    t27: ['anger', 'repair_need', 'truth_over_harmony'],
    s1: ['consistency_need', 'self_trust_growth'],
    s2: ['support_need', 'self_trust_growth'],
    s3: ['mutuality_need', 'receiving_openness'],
    s4: ['quiet_safety', 'somatic_safety'],
    s5: ['support_need', 'connection_glimmer'],
    s6: ['boundary_rebuilding'],
    s7: ['mutuality_need', 'transformation_season'],
    s8: ['quiet_safety', 'restorative_moment'],
    s9: ['calm_bracing', 'self_trust_growth'],
    s10: ['self_trust_growth', 'inner_authority'],
  };

  const activatedEmotionSignalMap: Record<string, SignalKey[]> = {
    anger: ['anger', 'truth_over_harmony'],
    confusion: ['confusion', 'decision_uncertainty'],
    fear: ['fear', 'relationship_safety_testing'],
    grief: ['grief', 'rupture_sensitivity'],
    hope: ['hope', 'connection_glimmer'],
    loneliness: ['loneliness', 'belonging_ache'],
    pressure: ['high_stress', 'caretaking_pressure'],
    rejection: ['relationship_safety_testing', 'belonging_ache'],
    shame: ['shame', 'self_blame'],
    tenderness: ['vulnerability', 'hope'],
  };

  const needSignalMap: Record<string, SignalKey[]> = {
    boundaries: ['boundary_rebuilding', 'autonomy_need'],
    clarity: ['need_for_exact_words', 'truth_telling'],
    comfort: ['support_need', 'receiving_openness'],
    honesty: ['truth_telling', 'truth_over_harmony'],
    presence: ['emotional_availability_need', 'connection_glimmer'],
    reassurance: ['consistency_need', 'emotional_availability_need'],
    repair: ['repair_need', 'rupture_sensitivity'],
    softness: ['emotional_availability_need', 'support_need'],
    space: ['distance_for_safety', 'needs_pause'],
    time: ['needs_pause', 'trust_builds_slowly'],
  };

  const stateBeforeSignalMap: Record<string, SignalKey[]> = {
    fawn: ['caretaking_pressure', 'boundary_rebuilding'],
    fight: ['anger', 'truth_over_harmony'],
    flight: ['distance_for_safety', 'avoidance'],
    freeze: ['shutdown', 'low_capacity'],
    secure: ['quiet_safety'],
  };

  const stateAfterSignalMap: Record<string, SignalKey[]> = {
    secure: ['quiet_safety', 'connection_glimmer'],
  };

  const noteSignals: KeywordSignal[] = [
    { key: 'relationship_safety_testing', terms: ['safe', 'trust', 'testing'] },
    { key: 'belonging_ache', terms: ['do not belong', "don't belong", 'dont belong', 'not belong', 'not fit', 'not fitting', 'out of place', 'outsider', 'excluded', 'left out', 'not represented'] },
    { key: 'chosen_family', terms: ['chosen family', 'found family', 'my people', 'community care', 'mutual aid', 'safe community'] },
    { key: 'consistency_need', terms: ['reassurance', 'consistent', 'follow through', 'chosen'] },
    { key: 'repair_need', terms: ['repair', 'apology', 'rupture', 'make it right'] },
    { key: 'rupture_sensitivity', terms: ['conflict', 'distance', 'shift', 'off tone'] },
    { key: 'tone_sensitivity', terms: ['tone', 'warmth', 'cold', 'short with me'] },
    { key: 'emotional_availability_need', terms: ['available', 'present', 'responsive'] },
    { key: 'trust_builds_slowly', terms: ['slow trust', 'earn trust', 'trust slowly'] },
    { key: 'closeness_uncertainty', terms: ['closeness', 'too close', 'intimacy'] },
    { key: 'distance_for_safety', terms: ['space', 'distance', 'pull back', 'withdraw'] },
    { key: 'minimizes_need', terms: ["it's fine", 'its fine', 'not a big deal', "don't want to bother", 'dont want to bother', 'i can handle it', 'should not need', "shouldn't need", 'minimized my need'] },
    { key: 'wants_to_be_caught', terms: ['wish someone noticed', 'wanted someone to notice', 'check in on me', 'checked in on me', 'catch me before', 'without asking'] },
    { key: 'receiving_care_difficulty', terms: ['hard to receive', 'hard receiving', 'awkward receiving', 'deflected help', 'deflect help', 'could not accept help', "couldn't accept help"] },
    { key: 'fear_of_being_too_much', terms: ['too much', 'a burden', 'burden', 'needy', 'overwhelming people', 'too needy'] },
    { key: 'selective_vulnerability', terms: ['vulnerable', 'open up', 'guarded', 'masking', 'mask', 'performing', 'pretending i am fine', 'edited myself', 'translate myself'] },
    { key: 'becoming_visible', terms: ['unmask', 'unmasking', 'be myself', 'show myself', 'less edited', 'not edit myself'] },
    { key: 'truth_over_harmony', terms: ['truth', 'harmony', 'avoid conflict', 'honest'] },
    { key: 'loyalty_conflict', terms: ['loyalty', 'betray', 'betrayal'] },
    { key: 'mutuality_need', terms: ['mutual', 'reciprocal', 'one-sided', 'both ways'] },
    { key: 'overexplaining', terms: ['explain', 'overexplain', 'over-explain', 'over-explaining', 'defend myself', 'translate myself'] },
    { key: 'need_for_exact_words', terms: ['exact words', 'precise words', 'right words', 'accurate words'] },
    { key: 'voice_emerging', terms: ['found my voice', 'use my voice', 'used my voice', 'speak up', 'spoke up', 'said what i meant'] },
    { key: 'less_explaining', terms: ['less explaining', 'stopped explaining', 'no longer explaining', 'explain less'] },
    { key: 'permission_shift', terms: ['allowed myself', 'gave myself permission', 'let myself'] },
    { key: 'choosing_self', terms: ['chose myself', 'choose myself', 'picked myself'] },
    { key: 'self_definition', terms: ['define myself', 'defined myself', 'self-definition', 'who i am'] },
    { key: 'loneliness', terms: ['lonely', 'alone', 'distant'] },
    { key: 'wants_to_be_seen', terms: ['seen', 'noticed', 'understood', 'seen accurately', 'understood accurately', 'accurately understood', 'misunderstood'] },
    { key: 'support_need', terms: ['support', 'help', 'care'] },
    { key: 'asks_for_support', terms: ['asked for help', 'asked for support', 'reached out', 'asked someone', 'told them i need', 'told someone i need'] },
    { key: 'boundary_rebuilding', terms: ['boundary', 'boundaries', 'limit', 'no '] },
    { key: 'boundary_guilt', terms: ['guilty for saying no', 'guilt after no', 'felt bad saying no', 'guilty after saying no'] },
    { key: 'says_no', terms: ['said no', 'saying no', 'declined', 'turned it down'] },
    { key: 'peace_boundary', terms: ['protect my peace', 'protected my peace', 'needed distance', 'stepped back', 'space for peace'] },
    { key: 'caretaking_pressure', terms: ['caretake', 'manage everyone', 'responsible for them'] },
    { key: 'family_pattern_awareness', terms: ['family pattern', 'my family', 'parent', 'childhood', 'generational', 'inherited'] },
    { key: 'family_loyalty_tension', terms: ['family obligation', 'cultural expectation', 'cultural expectations', 'tradition', 'loyalty', 'disappoint my family'] },
  ];

  for (const entry of relationshipMirrors) {
    const date = asDateKey(entry.date);
    if (!date) continue;

    for (const tag of entry.tags ?? []) {
      for (const key of tagSignalMap[String(tag)] ?? []) {
        addSignal(signals, key, 'relationshipMirror', date, 0.75, {
          label: relationshipTagLabels[String(tag)] ?? String(tag),
        });
      }
    }

    const activatedEmotions = Array.isArray(entry.activatedEmotions)
      ? entry.activatedEmotions
      : [entry.activatedEmotions].filter(Boolean);
    const needs = Array.isArray(entry.needs)
      ? entry.needs
      : [entry.needs].filter(Boolean);

    for (const emotion of activatedEmotions) {
      const normalized = String(emotion).toLowerCase();
      for (const key of activatedEmotionSignalMap[normalized] ?? []) {
        addSignal(signals, key, 'relationshipMirror', date, 0.68, { label: normalized });
      }
    }

    for (const need of needs) {
      const normalized = String(need).toLowerCase();
      for (const key of needSignalMap[normalized] ?? []) {
        addSignal(signals, key, 'relationshipMirror', date, 0.7, { label: normalized });
      }
    }

    for (const key of stateBeforeSignalMap[String(entry.stateBefore ?? '').toLowerCase()] ?? []) {
      addSignal(signals, key, 'relationshipMirror', date, 0.64, { label: 'state before' });
    }

    for (const key of stateAfterSignalMap[String(entry.stateAfter ?? '').toLowerCase()] ?? []) {
      addSignal(signals, key, 'relationshipMirror', date, 0.6, { label: 'state after' });
    }

    const searchable = asSearchText([
      entry.note,
      entry.context,
      entry.relationshipType,
      entry.activatedEmotions,
      entry.needs,
      entry.stateBefore,
      entry.stateAfter,
    ]);
    addKeywordSignals(signals, 'relationshipMirror', date, searchable, noteSignals, 0.68);
  }

  return signals;
}

/**
 * Normalizes natal/chart themes into V2 UserSignals.
 */
export function normalizeNatalChartThemesV2(natalChartThemes: any[] = []): UserSignal[] {
  const signals: UserSignal[] = [];

  const themeSignals: Record<string, SignalKey> = {
    emotional: 'chart_emotional_depth_theme',
    emotion: 'chart_emotional_depth_theme',
    communication: 'chart_communication_theme',
    relationship: 'chart_relationship_theme',
    responsibility: 'chart_responsibility_theme',
    creativity: 'chart_creativity_theme',
    identity: 'chart_identity_theme',
    home: 'chart_home_family_theme',
    family: 'chart_home_family_theme',
    values: 'chart_values_theme',
  };

  for (const theme of natalChartThemes) {
    const date = asDateKey(theme.date ?? theme.createdAt ?? new Date().toISOString());
    if (!date) continue;

    const rawTheme = String(theme.theme ?? theme.key ?? theme.category ?? theme.label ?? '').toLowerCase();
    const key = themeSignals[rawTheme];
    if (!key) continue;

    addSignal(signals, key, 'natalChart', date, 0.45, { label: rawTheme });
    if (theme.active !== false) {
      addSignal(signals, 'chart_theme_confirmed', 'natalChart', date, 0.35, { label: rawTheme });
    }
  }

  return signals;
}

/**
 * Main Normalizer
 */
export function normalizeInsightInputsV2(raw: InsightRawInputs, referenceDate?: string): UserSignal[] {
  const dreamInputs = raw.dreams && raw.dreams.length > 0 ? raw.dreams : raw.sleepLogs;
  const signals = [
    ...normalizeReflectionAnswersV2(raw.reflectionAnswers),
    ...normalizeBodyMapV2(raw.bodyMaps),
    ...normalizeTriggerLogsV2(raw.triggerLogs),
    ...normalizeGlimmerLogsV2(raw.glimmerLogs),
    ...normalizeRelationshipMirrorsV2(raw.relationshipMirrors),
    ...normalizeJournalV2(raw.journals),
    ...normalizeDailyCheckInV2(raw.dailyCheckIns),
    ...normalizeSleepV2(raw.sleepLogs),
    ...normalizeDreamsV2(dreamInputs),
    ...normalizeNatalChartThemesV2(raw.natalChartThemes),
  ];

  const today = referenceDateKey(referenceDate);
  const todaySignals = signals.filter(signal => signal.date === today);
  const sources = new Set(todaySignals.map(signal => signal.source));
  const capacityTriggers: SignalKey[] = [
    'low_energy',
    'low_mood',
    'high_stress',
    'low_sleep',
    'poor_sleep_quality',
    'depletion',
    'overextension',
    'emotional_heaviness',
  ];
  const hasCapacityTrigger = todaySignals.some(signal => capacityTriggers.includes(signal.key));

  if (hasCapacityTrigger || sources.size >= 2) {
    const source = [...todaySignals].sort(compareSignalsByPrimarySource)[0]?.source ?? 'dailyCheckIn';
    addSignal(signals, 'low_capacity', source, today, 0.6, {
      label: 'Capacity signal',
    });
  }

  return signals.sort(compareSignalsByPrimarySource);
}
