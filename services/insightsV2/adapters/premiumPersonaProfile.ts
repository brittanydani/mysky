import type {
  EvidenceAnchor,
  InsightCategory,
  PatternConfidence,
  SelectedPersonaProfile,
  SignalKey,
} from '../types';

export interface PremiumPersonaProfile {
  key: string;
  title: string;
  label: 'A part of you';
  focus?: string;
  category: InsightCategory;
  confidence: PatternConfidence;
  selectedSentence: string;
  protectivePurpose: string;
  strengths: string[];
  growthEdge: string;
  whatHelps: string[];
  reflectionPrompt: string;
  evidenceSummary: string;
  matchedSignals: SignalKey[];
  matchedPatternKeys: string[];
  evidence: EvidenceAnchor[];
}

interface CategoryPersonaCopy {
  protectivePurpose: string;
  strengths: string[];
  growthEdge: string;
  whatHelps: string[];
  reflectionPrompt: string;
}

const DEFAULT_PERSONA_COPY: CategoryPersonaCopy = {
  protectivePurpose:
    'This part keeps you oriented by noticing what matters, tracking risk, and helping your system choose a steadier next step.',
  strengths: [
    'It can notice patterns that a more surface-level read might miss.',
    'It helps you stay connected to what feels meaningful, protective, or unresolved.',
  ],
  growthEdge:
    'The growth edge is letting this part inform you without letting it become the only voice in the room.',
  whatHelps: [
    'Name the pattern as one part of you, not the whole of you.',
    'Ask what it is protecting before deciding what to do next.',
  ],
  reflectionPrompt:
    'What is this part trying to protect, and what would help it feel less alone today?',
};

const CATEGORY_PERSONA_COPY: Partial<Record<InsightCategory, CategoryPersonaCopy>> = {
  responsibilityCare: {
    protectivePurpose:
      'This part learned to keep people, tasks, or emotional loose ends from falling through the cracks.',
    strengths: [
      'You often notice what needs care before it becomes obvious.',
      'You can hold responsibility with real tenderness and follow-through.',
    ],
    growthEdge:
      'The growth edge is letting care include a pause, so responsibility does not automatically become self-abandonment.',
    whatHelps: [
      'Ask whether the need is yours to hold, share, or simply notice.',
      'Let support be defined before you step all the way in.',
    ],
    reflectionPrompt:
      'Where can this caring part stay involved without taking over?',
  },
  workAmbition: {
    protectivePurpose:
      'This part uses progress, output, or high standards to help your system feel safer and more in control.',
    strengths: [
      'You can move toward what matters with discipline and vision.',
      'You often see the gap between what exists and what could be built.',
    ],
    growthEdge:
      'The growth edge is letting progress be meaningful without making constant output the only proof that you are okay.',
    whatHelps: [
      'Separate the standard from your current capacity.',
      'Let recovery count as part of the work, not a break from being serious.',
    ],
    reflectionPrompt:
      'What would still count as progress if your system did not have to prove anything today?',
  },
  safetyRegulation: {
    protectivePurpose:
      'This part keeps scanning for safety so your nervous system is not caught unprepared.',
    strengths: [
      'You can sense shifts quickly, sometimes before your mind has language for them.',
      'You have a precise read on what helps your body settle or brace.',
    ],
    growthEdge:
      'The growth edge is letting discernment stay available while giving your body enough evidence that it can soften.',
    whatHelps: [
      'Look for repeated evidence of safety instead of forcing calm.',
      'Use small, concrete cues: distance, clarity, breath, warmth, movement, or a defined pause.',
    ],
    reflectionPrompt:
      'What would give your body one real piece of evidence that this moment is safer or more contained?',
  },
  selfWorthReceiving: {
    protectivePurpose:
      'This part protects you from the vulnerability of needing, receiving, or being cared for without earning it first.',
    strengths: [
      'You can notice the emotional weight of care, reciprocity, and being valued.',
      'You are deeply attuned to whether support feels respectful or costly.',
    ],
    growthEdge:
      'The growth edge is letting care reach the real need before turning it into proof, debt, or usefulness.',
    whatHelps: [
      'Let one specific need be named without minimizing it.',
      'Notice support that preserves your agency instead of replacing it.',
    ],
    reflectionPrompt:
      'What kind of care would feel supportive without making you feel smaller?',
  },
  relationships: {
    protectivePurpose:
      'This part tracks tone, distance, repair, and belonging so connection feels safer to stay inside.',
    strengths: [
      'You can notice relational shifts with emotional precision.',
      'You often care about repair because the meaning underneath the moment matters.',
    ],
    growthEdge:
      'The growth edge is letting relational information matter without making every shift a verdict on your safety or worth.',
    whatHelps: [
      'Separate what happened from what your system fears it means.',
      'Ask for clarity, repair, or space before the story hardens.',
    ],
    reflectionPrompt:
      'Did this relational thread ask for closeness, distance, repair, reassurance, or clearer truth?',
  },
  bodySignals: {
    protectivePurpose:
      'This part uses body signals to bring attention to what your mind has not fully organized yet.',
    strengths: [
      'Your body gives you early information about strain, safety, grief, desire, or overload.',
      'You can learn from sensation without needing to turn it into a diagnosis.',
    ],
    growthEdge:
      'The growth edge is listening to the body as information without treating every sensation as an emergency.',
    whatHelps: [
      'Name the sensation, location, and intensity before interpreting it.',
      'Ask what would bring a little more regulation or room.',
    ],
    reflectionPrompt:
      'What sensation has been most noticeable, and what is it asking for?',
  },
  dreamsSymbols: {
    protectivePurpose:
      'This part processes emotional residue, symbols, and unfinished material while your waking mind is less defended.',
    strengths: [
      'You can notice meaning without needing every image to become a prediction.',
      'You can track repeated emotional themes across dreams and waking life.',
    ],
    growthEdge:
      'The growth edge is letting symbolic material clarify real feelings without replacing grounded action.',
    whatHelps: [
      'Start with the feeling that stayed after waking.',
      'Connect dream images back to lived themes, not certainty or fortune-telling.',
    ],
    reflectionPrompt:
      'What feeling from the dream seemed to stay with you after the dream ended?',
  },
  griefTransitions: {
    protectivePurpose:
      'This part protects the meaning of what changed by refusing to rush your emotional world past what still matters.',
    strengths: [
      'You can honor complexity when relief, grief, longing, or closure arrive together.',
      'You notice the slower emotional truth beneath a logical ending.',
    ],
    growthEdge:
      'The growth edge is allowing movement without treating returning feelings as failure.',
    whatHelps: [
      'Name what ended, what remains, and what has not fully landed.',
      'Let grief move in waves instead of demanding a straight line.',
    ],
    reflectionPrompt:
      'What part of this change still wants gentleness instead of speed?',
  },
  pleasurePlay: {
    protectivePurpose:
      'This part protects access to aliveness, delight, and relief when responsibility or pressure starts crowding out joy.',
    strengths: [
      'You can recognize what brings life back into your body.',
      'You notice that pleasure is not extra; it can be part of regulation and recovery.',
    ],
    growthEdge:
      'The growth edge is letting something good count before everything is finished or earned.',
    whatHelps: [
      'Track what creates even a small shift toward lightness.',
      'Let enjoyment have a container if structure makes pleasure feel safer.',
    ],
    reflectionPrompt:
      'What small form of aliveness deserves a little more room?',
  },
};

const SOURCE_LABELS: Partial<Record<EvidenceAnchor['source'], string>> = {
  dailyCheckIn: 'daily check-ins',
  journal: 'journal entries',
  dream: 'dream material',
  sleep: 'sleep logs',
  triggerLog: 'trigger logs',
  glimmerLog: 'glimmer logs',
  bodyMap: 'body maps',
  relationshipMirror: 'relationship reflections',
  natalChart: 'natal chart themes',
  reflectionBank: 'reflection answers',
};

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ');
}

function formatList(values: string[]): string {
  if (values.length <= 1) return values[0] ?? '';
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
}

function confidenceLead(confidence: PatternConfidence): string {
  if (confidence === 'veryStrong') {
    return 'This part is showing up repeatedly';
  }
  if (confidence === 'strong') {
    return 'This part is showing up clearly';
  }
  if (confidence === 'moderate') {
    return 'This part is becoming clearer';
  }
  return 'This part is beginning to show itself';
}

function buildEvidenceSummary(profile: SelectedPersonaProfile): string {
  const sources = unique(
    profile.evidence.map(evidence => SOURCE_LABELS[evidence.source] ?? humanizeKey(evidence.source)),
  ).slice(0, 3);
  const signals = unique(profile.matchedSignals.map(humanizeKey)).slice(0, 3);
  const sourceText = sources.length ? ` across ${formatList(sources)}` : ' in your recent archive';
  const signalText = signals.length ? `, especially around ${formatList(signals)}` : '';

  return `${confidenceLead(profile.confidence)}${sourceText}${signalText}.`;
}

export function adaptPremiumPersonaProfile(
  profile: SelectedPersonaProfile | null,
): PremiumPersonaProfile | null {
  if (!profile || profile.confidence === 'emerging') return null;

  const copy = CATEGORY_PERSONA_COPY[profile.category] ?? DEFAULT_PERSONA_COPY;

  return {
    key: profile.key,
    title: profile.title,
    label: 'A part of you',
    focus: profile.focus,
    category: profile.category,
    confidence: profile.confidence,
    selectedSentence: profile.selectedSentence,
    protectivePurpose: copy.protectivePurpose,
    strengths: copy.strengths,
    growthEdge: copy.growthEdge,
    whatHelps: copy.whatHelps,
    reflectionPrompt: copy.reflectionPrompt,
    evidenceSummary: buildEvidenceSummary(profile),
    matchedSignals: profile.matchedSignals,
    matchedPatternKeys: profile.matchedPatternKeys,
    evidence: profile.evidence,
  };
}
