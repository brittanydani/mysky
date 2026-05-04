export interface InsightSupportAlignmentInput {
  category?: string | null;
  majorDomain?: string | null;
  insightSubcategory?: string | null;
  patternType?: string | null;
  anchors?: readonly string[] | null;
  tags?: readonly string[] | null;
  signalTypes?: readonly string[] | null;
  title?: string | null;
  body?: string | null;
  observation?: string | null;
  pattern?: string | null;
}

type HumanizedPhrase = {
  label: string;
  active?: string;
  short?: string;
  question?: string;
  aliases?: readonly string[];
};

const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'another',
  'around',
  'before',
  'being',
  'because',
  'between',
  'could',
  'does',
  'doesn',
  'every',
  'feel',
  'feeling',
  'feels',
  'from',
  'have',
  'into',
  'just',
  'like',
  'more',
  'need',
  'needs',
  'only',
  'part',
  'same',
  'some',
  'start',
  'starts',
  'still',
  'that',
  'than',
  'their',
  'there',
  'thing',
  'this',
  'through',
  'what',
  'when',
  'where',
  'while',
  'with',
  'without',
  'would',
  'your',
]);

const HUMANIZED_PHRASES: Record<string, HumanizedPhrase> = {
  actionrecovery: {
    label: 'movement returning after feeling stuck',
    active: 'movement starts returning after feeling stuck',
    short: 'that returning movement',
    aliases: ['one small step', 'small effort', 'effort', 'movement', 'stuck place', 'next step'],
  },
  effortdoubt: {
    label: 'the doubt that trying will change anything',
    active: 'part of you wants movement but does not trust the effort will matter',
    short: 'that doubt about effort',
    aliases: ['effort', 'trying', 'movement', 'change anything', 'small effort'],
  },
  responsepattern: {
    label: 'a familiar response',
    active: 'your body reaches for an old response before your mind has language for it',
    short: 'that familiar response',
    aliases: ['old response', 'familiar response', 'body before words'],
  },
  beliefaboutchange: {
    label: 'the belief that change may not hold',
    active: 'wanting change brings up doubt about whether it can last',
    short: 'that doubt about change',
    aliases: ['change', 'hope', 'disappointment', 'whether change can last'],
  },
  embodiedknowing: {
    label: 'body knowing before words',
    active: 'your body recognizes the moment before your mind has clean language',
    short: 'that body signal',
    aliases: ['body cues', 'body before words', 'body signal', 'early body read'],
  },
  connectionworth: {
    label: 'feeling chosen, remembered, or wanted',
    active: 'the need to feel chosen or remembered gets touched',
    short: 'feeling chosen',
    aliases: ['chosen', 'remembered', 'wanted', 'mattering in connection'],
  },
  repairseeking: {
    label: 'needing repair or closure',
    active: 'the need for repair or closure gets activated',
    short: 'repair or closure',
    aliases: ['repair', 'closure', 'reassurance', 'bridge back'],
  },
  toneshiftsensitivity: {
    label: 'noticing a shift in tone',
    active: 'a shift in tone starts to matter before the story is clear',
    short: 'the tone shift',
    aliases: ['tone shift', 'reply timing', 'pause', 'distance'],
  },
  selfworthreceiving: {
    label: 'receiving care without having to earn it',
    active: 'care starts touching the question of whether you have to earn it',
    short: 'receiving care',
    aliases: ['receiving', 'care offered', 'deserving', 'support without debt'],
  },
  safetyregulation: {
    label: 'finding enough safety to soften',
    active: 'your system looks for enough safety to soften',
    short: 'enough safety to soften',
    aliases: ['safety', 'softening', 'steadiness', 'bracing'],
  },
  valuesintegrity: {
    label: 'staying close to what feels true',
    active: 'the choice starts pulling you away from what feels true',
    short: 'what feels true',
    aliases: ['values', 'integrity', 'alignment', 'truth'],
  },
  alignmentsignal: {
    label: 'staying close to what feels true',
    active: 'alignment starts asking to be included',
    short: 'that alignment signal',
    aliases: ['values', 'integrity', 'truth', 'misalignment'],
  },
  tensionpattern: {
    label: 'the tension in your body',
    active: 'tension shows up in your body before the meaning is clear',
    short: 'that body tension',
    aliases: ['tension', 'body tension', 'tightness'],
  },
  sensationavoidance: {
    label: 'moving around what your body is feeling',
    active: 'you move around what your body is feeling before you name it',
    short: 'what your body is feeling',
    aliases: ['sensation', 'body feeling', 'staying busy'],
  },
  usefulnessworth: {
    label: 'your worth feeling tied to being useful',
    active: 'your worth starts feeling tied to being useful',
    short: 'that usefulness bind',
    aliases: ['worth', 'useful', 'earning care', 'being enough'],
  },
  beliefaboutworth: {
    label: 'the question of being enough',
    active: 'the question of being enough starts pulling at the moment',
    short: 'being enough',
    aliases: ['worth', 'enoughness', 'self worth'],
  },
  meaninggap: {
    label: 'the gap between what works and what feels meaningful',
    active: 'the practical answer stops feeling like enough',
    short: 'that meaning gap',
    aliases: ['meaning', 'purpose', 'larger question', 'what feels meaningful'],
  },
};

const ANCHOR_PHRASES: Record<string, string> = {
  'after-conflict': 'after conflict',
  'body-before-words': 'your body noticing before words arrive',
  'care-turns-responsibility': 'care turning into responsibility',
  'choice-cost': 'a next step carrying real cost',
  'clarity-before-movement': 'needing enough clarity for one small move',
  'connection-safety': 'connection feeling safe enough',
  deserving: 'the question of deserving care',
  'demand-density': 'too much crowding the same moment',
  'dream-residue': 'a dream feeling still lingering',
  'explaining-accurately': 'trying to explain yourself accurately',
  'future-pressure': 'pressure around the next step',
  'hard-choice': 'a choice with a quiet cost',
  'joy-unfamiliar': 'joy feeling unfamiliar',
  'low-sleep': 'low sleep or thin recovery',
  'meaning-gap': 'the gap between what works and what feels meaningful',
  'nervous-system': 'your system looking for safety',
  repair: 'repair or closure',
  'receiving-care': 'care being offered',
  'rushed-transitions': 'rushed transitions',
  'safety-scan': 'scanning for enough safety',
  'scarcity-scan': 'checking whether there will be enough',
  'tone-shift': 'a shift in tone',
  unresolved: 'something unresolved',
  'values-pressure': 'pressure around what feels true',
};

const RAW_PHRASE_REPLACEMENTS: Array<[string, string]> = [
  ['when usefulness worth asks for more access than you have', 'when your worth starts feeling tied to being useful'],
  ['usefulness worth asks for more access than you have', 'your worth starts feeling tied to being useful'],
  ['when does belief about worth start pulling in two directions?', 'when does the question of being enough start pulling you in two directions?'],
  ['belief about worth start pulling in two directions', 'the question of being enough start pulling you in two directions'],
  ['doubt about whether effort will change anything', 'the doubt that trying will change anything'],
  ['belief about change', 'the belief that change may not hold'],
  ['response pattern', 'a familiar response'],
  ['the return of movement after a stuck place', 'movement returning after feeling stuck'],
  ['return of movement after a stuck place', 'movement returning after feeling stuck'],
  ['protection for the deeper value', 'staying close to what feels true'],
  ['the meaning gap', 'the gap between what works and what feels meaningful'],
  ['meaning gap', 'the gap between what works and what feels meaningful'],
  ['embodied knowing', 'body knowing before words'],
  ['usefulness worth', 'your worth feeling tied to being useful'],
  ['belief about worth', 'the question of being enough'],
  ['sensation avoidance', 'moving around what your body is feeling'],
  ['tension pattern', 'the tension in your body'],
];

const DOMAIN_MISMATCH_TERMS = {
  attachment: [
    'closeness',
    'connection',
    'relationship',
    'reassurance',
    'repair',
    'being chosen',
    'chosen',
    'wanted',
  ],
  body: [
    'body',
    'nervous system',
    'sensation',
    'somatic',
    'chest',
    'breath',
    'bracing',
  ],
  meaning: [
    'meaning',
    'purpose',
    'symbol',
    'sacred',
    'faith',
    'larger question',
  ],
};

function phraseKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function splitTerm(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeText(value: string): string {
  return humanizeInsightParagraphBody(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map(value => value.trim()).filter(Boolean)));
}

function capitalizeLike(match: string, replacement: string): string {
  if (!match || match[0] !== match[0].toUpperCase()) return replacement;
  return replacement.charAt(0).toUpperCase() + replacement.slice(1);
}

function replaceLiteralPhrase(text: string, raw: string, replacement: string): string {
  const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  return text.replace(regex, match => capitalizeLike(match, replacement));
}

function addHumanizedPhraseTerms(value: string, terms: string[]): void {
  const direct = HUMANIZED_PHRASES[phraseKey(value)];
  if (!direct) return;
  terms.push(direct.label);
  if (direct.active) terms.push(direct.active);
  if (direct.short) terms.push(direct.short);
  terms.push(...(direct.aliases ?? []));
}

function importantWords(value: string, maxWords = 18): string[] {
  return splitTerm(value)
    .split(' ')
    .filter(word => word.length >= 4 && !STOP_WORDS.has(word))
    .slice(0, maxWords);
}

export function humanizeSubcategoryPhrase(
  value: string | null | undefined,
  role: 'label' | 'active' | 'short' | 'question' = 'label',
): string {
  if (!value) return '';
  const phrase = HUMANIZED_PHRASES[phraseKey(value)];
  if (phrase) {
    return phrase[role] ?? phrase.label;
  }
  return splitTerm(value);
}

export function anchorToNaturalPhrase(value: string | null | undefined): string {
  if (!value) return '';
  const normalizedAnchor = value.trim().toLowerCase();
  const mapped = ANCHOR_PHRASES[normalizedAnchor];
  if (mapped) return mapped;

  const phrase = HUMANIZED_PHRASES[phraseKey(value)];
  if (phrase) return phrase.label;

  return splitTerm(value);
}

export function normalizeInsightTerm(value: string): string {
  const phrase = HUMANIZED_PHRASES[phraseKey(value)];
  return normalizeText(phrase?.label ?? anchorToNaturalPhrase(value) ?? value);
}

export function humanizeInsightParagraphBody(
  body: string,
  insight?: InsightSupportAlignmentInput | null,
): string {
  let next = body;
  for (const [raw, replacement] of RAW_PHRASE_REPLACEMENTS) {
    next = replaceLiteralPhrase(next, raw, replacement);
  }

  if (insight?.insightSubcategory) {
    const raw = splitTerm(insight.insightSubcategory);
    const replacement = humanizeSubcategoryPhrase(insight.insightSubcategory);
    if (raw && replacement && raw !== replacement) {
      next = replaceLiteralPhrase(next, raw, replacement);
    }
  }

  return next.replace(/\s+/g, ' ').trim();
}

export function getInsightAlignmentTerms(insight: InsightSupportAlignmentInput | null | undefined): string[] {
  if (!insight) return [];

  const terms: string[] = [];
  const directTerms = [
    insight.category,
    insight.majorDomain,
    insight.insightSubcategory,
    insight.patternType,
    ...(insight.anchors ?? []),
    ...(insight.tags ?? []),
    ...(insight.signalTypes ?? []),
  ];

  for (const value of directTerms) {
    if (!value) continue;
    terms.push(splitTerm(value));
    terms.push(anchorToNaturalPhrase(value));
    addHumanizedPhraseTerms(value, terms);
  }

  const textFields = [
    insight.title,
    insight.body,
    insight.observation,
    insight.pattern,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  for (const text of textFields) {
    terms.push(...importantWords(humanizeInsightParagraphBody(text, insight)));
  }

  return unique(terms.map(term => normalizeText(term)).filter(term => term.length >= 3));
}

function termTokenSet(terms: readonly string[]): Set<string> {
  const tokens = new Set<string>();
  for (const term of terms) {
    for (const word of importantWords(term, 32)) {
      tokens.add(word);
    }
  }
  return tokens;
}

function categoryKey(insight: InsightSupportAlignmentInput | null | undefined): string {
  return splitTerm(insight?.category ?? '');
}

function hasInsightTerm(insight: InsightSupportAlignmentInput | null | undefined, values: readonly string[]): boolean {
  const haystack = getInsightAlignmentTerms(insight).join(' ');
  return values.some(value => haystack.includes(normalizeText(value)));
}

function mismatchPenalty(text: string, insight: InsightSupportAlignmentInput | null | undefined): number {
  const normalized = normalizeText(text);
  const category = categoryKey(insight);
  let penalty = 0;

  const relationalContext =
    ['relationships', 'support belonging', 'self worth receiving', 'communication voice', 'family home'].includes(category) ||
    hasInsightTerm(insight, ['relationship', 'connection', 'repair', 'tone', 'receiving care', 'belonging']);
  if (!relationalContext) {
    for (const term of DOMAIN_MISMATCH_TERMS.attachment) {
      if (normalized.includes(normalizeText(term))) penalty -= 5;
    }
  }

  const bodyContext =
    ['body signals', 'safety regulation', 'rest capacity', 'glimmers regulation', 'pleasure play'].includes(category) ||
    hasInsightTerm(insight, ['body', 'somatic', 'sensation', 'safety', 'bracing', 'sleep', 'rest']);
  if (!bodyContext) {
    for (const term of DOMAIN_MISMATCH_TERMS.body) {
      if (normalized.includes(normalizeText(term))) penalty -= 4;
    }
  }

  const meaningContext =
    ['spiritual meaning', 'dreams symbols', 'natal chart reflection', 'values integrity', 'life direction'].includes(category) ||
    hasInsightTerm(insight, ['meaning', 'purpose', 'symbol', 'values', 'truth', 'direction']);
  if (!meaningContext) {
    for (const term of DOMAIN_MISMATCH_TERMS.meaning) {
      if (normalized.includes(normalizeText(term))) penalty -= 4;
    }
  }

  return penalty;
}

export function scoreSupportAlignment(
  text: string,
  insightLike: InsightSupportAlignmentInput | null | undefined,
): number {
  const terms = getInsightAlignmentTerms(insightLike);
  if (!text.trim() || terms.length === 0) return 0;

  const normalizedText = normalizeText(text);
  const textTokens = new Set(importantWords(normalizedText, 64));
  const insightTokens = termTokenSet(terms);

  let score = mismatchPenalty(text, insightLike);
  for (const term of terms) {
    if (term.length >= 5 && normalizedText.includes(term)) {
      score += term.split(' ').length > 1 ? 3 : 1;
    }
  }
  for (const token of textTokens) {
    if (insightTokens.has(token)) score += 1;
  }

  return score;
}

export function isSupportTextAligned(
  text: string,
  insightLike: InsightSupportAlignmentInput | null | undefined,
): boolean {
  return scoreSupportAlignment(text, insightLike) >= 2;
}
