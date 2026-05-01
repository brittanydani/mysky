import type {
  EvidenceAnchor,
  InsightDataSource,
  InsightRawInputs,
  SignalKey,
  UserSignal,
} from '../types';
import { compareSignalsByPrimarySource } from '../sourcePriority';

type KeywordSignal = {
  key: SignalKey;
  terms: string[];
  strength?: number;
  label?: string;
};

function asDateKey(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.slice(0, 10);
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
  }
  return null;
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
      productive: ['preparedness', 'high_standards'],
      focused: ['preparedness'],
      planning: ['preparedness', 'mental_load'],
      goals: ['future_self_orientation', 'wants_to_build'],
      chores: ['invisible_labor', 'mental_load'],
      routine: ['ritual_regulation'],
      writing: ['creative_processing', 'expression_need'],
      art: ['creative_processing', 'creative_aliveness'],
      music: ['creative_processing', 'creative_aliveness'],
      design: ['beauty_making', 'beauty_regulation'],
      voice: ['voice_emerging'],
      blocked: ['creative_block'],
      identity: ['self_definition', 'identity_rewriting'],
      growth: ['growth_edge', 'transformation_season'],
      permission: ['permission_shift', 'self_trust_growth'],
      boundary: ['boundary_rebuilding', 'limits_tested'],
      no: ['says_no', 'boundary_guilt'],
      autonomy: ['autonomy_need', 'inner_authority'],
      decision: ['decision_uncertainty'],
      creative: ['creative_aliveness', 'wants_to_build'],
      calm: ['quiet_safety', 'low_stress'],
      peaceful: ['quiet_safety'],
      rested: ['restorative_moment', 'body_lightness'],
      energized: ['high_energy', 'mood_improvement'],
      hopeful: ['hope'],
      connected: ['connection_glimmer', 'relief'],
      supported: ['support_abundance_shift', 'receiving_openness'],
      help: ['support_need', 'asks_for_support'],
      receiving: ['receiving_care_difficulty'],
      burden: ['fear_of_being_too_much'],
      community: ['chosen_family', 'connection_glimmer'],
      belonging: ['belonging_ache', 'wants_to_be_seen'],
      family: ['family_pattern_awareness'],
      culture: ['family_loyalty_tension', 'values_conflict'],
      home: ['home_as_safety', 'rooting_need'],
      money: ['scarcity_scanning'],
      bills: ['scarcity_scanning'],
      finances: ['scarcity_scanning'],
      caregiving: ['caretaking_pressure', 'protective_care'],
      childcare: ['caretaking_pressure', 'protective_care'],
      faith: ['faith_meaning'],
      spiritual: ['spiritual_depth', 'meaning_making'],
      justice: ['justice_sensitivity', 'fairness_need'],
      peace: ['peace_boundary', 'quiet_safety'],
      safe: ['quiet_safety', 'somatic_safety'],
      joy: ['joy_tolerance', 'mood_improvement'],
      playful: ['play_glimmer', 'joy_tolerance'],
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
    { key: 'anger', terms: ['angry'] },
    { key: 'belonging_ache', terms: ['do not belong', "don't belong", 'dont belong', 'not belong', 'not fit', 'not fitting', 'out of place', 'outsider', 'excluded', 'left out', 'not represented'] },
    { key: 'chosen_family', terms: ['chosen family', 'found family', 'my people', 'community care', 'mutual aid', 'safe community'] },
    { key: 'small_circle_pressure', terms: ['small circle', 'small support system', 'only person i can ask', 'no one else to ask'] },
    { key: 'family_pattern_awareness', terms: ['family pattern', 'my family', 'parent', 'parents', 'childhood', 'generational', 'inherited'] },
    { key: 'family_loyalty_tension', terms: ['family obligation', 'cultural expectation', 'cultural expectations', 'tradition', 'loyalty', 'disappoint my family'] },
    { key: 'breaks_old_pattern', terms: ['break the cycle', 'break cycle', 'not pass this on', 'do it differently', 'pattern breaker'] },
    { key: 'home_as_safety', terms: ['safe at home', 'home felt safe', 'home feels safe', 'my room', 'my apartment', 'sanctuary'] },
    { key: 'rooting_need', terms: ['roots', 'rooted', 'stability', 'stable base', 'home base', 'housing', 'place to land'] },
    { key: 'caretaking_pressure', terms: ['caregiver', 'caregiving', 'childcare', 'eldercare', 'taking care of my', 'caring for my'] },
    { key: 'protective_care', terms: ['protect them', 'keep them safe', 'my kid', 'my child', 'my pet', 'elderly parent'] },
    { key: 'scarcity_scanning', terms: ['money', 'rent', 'bills', 'groceries', 'finances', 'financial', 'budget', 'income', 'job security', 'housing cost', 'medical bills'] },
    { key: 'fear_of_loss', terms: ['lose my job', 'lose housing', 'lose the apartment', 'lose stability', 'lose support', 'taken away'] },
    { key: 'energy_scarcity', terms: ['ration energy', 'rationing energy', 'limited energy', 'spoons', 'conserve energy'] },
    { key: 'values_conflict', terms: ['against my values', 'not aligned', 'misaligned', 'values conflict', 'institution', 'bureaucracy'] },
    { key: 'integrity_cost', terms: ['cost me to be honest', 'cost of honesty', 'choosing alignment', 'choose alignment'] },
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
    { key: 'decision_uncertainty', terms: ['decision', 'decide', 'choose', 'choice', 'stuck choosing', 'task switching', 'context switching', 'switching tasks', 'switch contexts', 'change gears', 'changing gears'] },
    { key: 'clarity_before_release', terms: ['need clarity', 'needed clarity', 'clarity before', 'understand before', 'understand it before', 'understand it first'] },
    { key: 'analysis_as_regulation', terms: ['analyze', 'analyzing', 'analysis helps', 'logic helps', 'make a system', 'made a system', 'make it make sense', 'map it out'] },
    { key: 'intellectualizes_feeling', terms: ['intellectualize', 'intellectualizing', 'thinking instead of feeling', 'in my head', 'think before i feel'] },
    { key: 'seeks_context', terms: ['need context', 'needed context', 'full context', 'full picture', 'backstory', 'missing context'] },
    { key: 'need_for_exact_words', terms: ['exact words', 'precise words', 'right words', 'accurate words'] },
    { key: 'pattern_recognition', terms: ['pattern', 'patterns', 'systems', 'map it', 'mapping'] },
    { key: 'deep_processing', terms: ['deep process', 'deep processing', 'need time to process', 'needed time to process', 'process slowly'] },
    { key: 'high_standards', terms: ['high standards', 'quality', 'excellence', 'do it right'] },
    { key: 'creative_standards', terms: ['creative standards', 'make it good', 'make it better'] },
    { key: 'vision_gap', terms: ['too many ideas', 'unfinished ideas', 'more ideas than', 'cannot finish', 'follow through'] },
    { key: 'wants_to_build', terms: ['build', 'building', 'make something', 'project', 'goal'] },
    { key: 'creative_processing', terms: ['writing', 'journaling', 'art', 'music', 'designing', 'making', 'drawing', 'composing', 'processing through', 'made something'] },
    { key: 'expression_need', terms: ['need to express', 'needed to express', 'need to say', 'needed to say', 'say it out loud', 'get it out', 'put it into words', 'make it visible'] },
    { key: 'voice_emerging', terms: ['found my voice', 'finding my voice', 'use my voice', 'using my voice', 'speak up', 'spoke up', 'said what i meant', 'my voice'] },
    { key: 'creative_block', terms: ['creative block', 'blocked creatively', 'stuck creatively', 'cannot write', "can't write", 'cannot make', "can't make", 'blank page', 'no words'] },
    { key: 'beauty_making', terms: ['rearranged', 'decorated', 'made it beautiful', 'lighting', 'color palette', 'designed the space', 'made the space', 'arranged the room'] },
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
    { key: 'ritual_regulation', terms: ['routine', 'habit', 'ritual', 'system', 'warm up', 'wind down'] },
    { key: 'needs_pause', terms: ['need a pause', 'need pause', 'needed a pause', 'need a break', 'needed a break', 'buffer', 'transition', 'change of plans', 'routine changed', 'warm up', 'wind down'] },
    { key: 'calm_bracing', terms: ['interruption', 'interrupted', 'unexpected change', 'change of plans'] },
    { key: 'sensory_sensitivity', terms: ['sensory', 'overstimulated', 'over-stimulated', 'over stimulation', 'sensory overload', 'too loud', 'too bright', 'noise', 'lights', 'clutter', 'crowded', 'texture', 'screens'] },
    { key: 'head_pressure', terms: ['head pressure', 'headache', 'migraine', 'brain fog', 'foggy head'] },
    { key: 'body_heaviness', terms: ['shutdown', 'shut down', 'body heavy', 'heavy body', 'body went heavy'] },
    { key: 'selective_vulnerability', terms: ['masking', 'mask', 'performing', 'performative', 'pretending i am fine', 'pretending to be fine', 'guarded', 'edited myself', 'translate myself'] },
    { key: 'becoming_visible', terms: ['unmask', 'unmasking', 'be myself', 'show myself', 'less edited', 'not edit myself'] },
    { key: 'wants_to_be_seen', terms: ['seen accurately', 'understood accurately', 'misunderstood', 'accurately understood'] },
    { key: 'relief', terms: ['relief', 'relieved', 'easier', 'exhale'] },
    { key: 'hope', terms: ['hope', 'hopeful', 'possible', 'optimistic'] },
    { key: 'mood_improvement', terms: ['better today', 'lighter mood', 'mood lifted', 'felt better'] },
    { key: 'quiet_safety', terms: ['calm', 'peaceful', 'safe', 'settled', 'quiet'] },
    { key: 'low_stress', terms: ['less stressed', 'low stress', 'not stressed'] },
    { key: 'restorative_moment', terms: ['rested', 'restorative', 'rest helped', 'slept well', 'nap helped'] },
    { key: 'body_lightness', terms: ['lighter', 'lightness', 'body relaxed', 'looser'] },
    { key: 'tension_release', terms: ['released', 'release', 'let go', 'softened'] },
    { key: 'somatic_safety', terms: ['felt safe in my body', 'body felt safe', 'settled body'] },
    { key: 'enoughness', terms: ['enough', 'sufficient', 'plenty', 'had enough'] },
    { key: 'support_abundance_shift', terms: ['supported', 'help arrived', 'not alone', 'backed up'] },
    { key: 'receiving_openness', terms: ['received help', 'accepted help', 'compliment', 'gift'] },
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

    const rawFeelings = parseJson<Array<{ id?: string; label?: string; intensity?: number } | string>>(dream.dreamFeelings)
      ?? parseJson<Array<{ id?: string; label?: string; intensity?: number } | string>>(dream.feelings)
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
        addSignal(signals, key, 'relationshipMirror', date, 0.75, { label: String(tag) });
      }
    }

    const searchable = asSearchText([entry.note, entry.context, entry.relationshipType]);
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

  const today = (referenceDate ?? new Date().toISOString()).slice(0, 10);
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
