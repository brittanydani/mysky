/**
 * Dream Pattern Engine — Pattern-First Interpretation
 *
 * Moves dream interpretation from "symbol lookup + stitch" to
 * "whole-dream psychological pattern recognition."
 *
 * Flow:
 *   1. Extract dream features (settings, characters, emotions, tensions, ending)
 *   2. Score 12 core dream patterns against extracted features
 *   3. Rank primary + secondary patterns
 *   4. Detect emotional contradictions (curiosity + shame, desire + fear, etc.)
 *   5. Analyze dream ending type and meaning
 *   6. Generate a flowing 6-section narrative using the pattern as lens
 *
 * The interpretation reads as one cohesive reflection, not separate symbol blocks.
 * Output is deterministic per input. No network calls, no AI.
 */

import type { KeywordMatch, DreamSymbolCategory } from './dreamKeywords';
import type {
  DreamAggregates,
  DreamMetadata,
  SelectedFeeling,
} from './dreamTypes';
import { FEELING_MAP } from './dreamTypes';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DreamPattern =
  | 'exposure'
  | 'boundary'
  | 'authority'
  | 'pursuit'
  | 'lost'
  | 'performance'
  | 'connection'
  | 'conflict'
  | 'caretaking'
  | 'transformation'
  | 'house_self'
  | 'stuck';

export type EndingType =
  | 'resolved'
  | 'unresolved'
  | 'abrupt'
  | 'escape'
  | 'relief'
  | 'confrontation'
  | 'unknown';

export interface EmotionalContradiction {
  poleA: string;
  poleB: string;
  intensity: number; // 0..1
}

export interface DreamFeatures {
  settings: string[];
  characters: string[];
  actions: string[];
  emotionsExplicit: string[];
  emotionsInferred: string[];
  socialContext: string[];
  tensionThemes: string[];
  endingType: EndingType;
  intimacyThemes: string[];
  authorityThemes: string[];
  privacyThemes: string[];
  safetyThemes: string[];
  symbolCategories: DreamSymbolCategory[];
}

export interface PatternResult {
  primaryPattern: DreamPattern;
  secondaryPatterns: DreamPattern[];
  confidence: number; // 0..1
  scores: Partial<Record<DreamPattern, number>>;
}

export interface EndingAnalysis {
  type: EndingType;
  meaning: string;
}

/** Display labels that fit the premium MySky aesthetic */
const PATTERN_DISPLAY_LABELS: Record<DreamPattern, string> = {
  exposure: 'Exposure & Vulnerability',
  boundary: 'Boundary Tension',
  authority: 'Authority Presence',
  pursuit: 'Pursuit & Threat',
  lost: 'Lost Within',
  performance: 'Performance & Judgment',
  connection: 'Longing for Connection',
  conflict: 'Inner Conflict',
  caretaking: 'Protective Instinct',
  transformation: 'Threshold of Change',
  house_self: 'Inner House',
  stuck: 'Repetition & Stuckness',
};

export interface PatternDreamAnalysis {
  primaryPattern: DreamPattern;
  secondaryPatterns: DreamPattern[];
  confidence: number;
  features: DreamFeatures;
  emotionalContradictions: EmotionalContradiction[];
  endingAnalysis: EndingAnalysis;
  undercurrentLabel: string;
  reflectionQuestion: string;
  narrative: string;
}

// ─── Feature Extraction ───────────────────────────────────────────────────────

/** Text-based feature extraction regexes */
const FEATURE_PATTERNS = {
  settings: {
    bathroom: /\b(bathroom|restroom|toilet|shower|bath)\b/i,
    school: /\b(school|classroom|campus|university|college|exam room)\b/i,
    workplace: /\b(work|office|meeting|cubicle|job|workplace)\b/i,
    stage: /\b(stage|podium|spotlight|audience|presentation|auditorium)\b/i,
    house: /\b(house|home|room|bedroom|kitchen|basement|attic|hallway|stairs|living room|apartment)\b/i,
    outdoor: /\b(forest|woods|field|mountain|road|path|highway|bridge|tunnel|cliff)\b/i,
    hospital: /\b(hospital|doctor|surgery|ambulance|clinic|emergency room)\b/i,
    water: /\b(ocean|sea|lake|river|pool|beach|underwater|boat|ship)\b/i,
    public: /\b(mall|store|restaurant|airport|train|bus|crowd|street|market|park)\b/i,
    dark: /\b(dark|darkness|shadow|fog|mist|dim|pitch black)\b/i,
  },
  characters: {
    parent: /\b(father|mother|dad|mom|parent|adoptive (father|mother|dad|mom))\b/i,
    partner: /\b(partner|husband|wife|boyfriend|girlfriend|spouse|significant other|lover|ex)\b/i,
    child: /\b(child|baby|infant|son|daughter|kid|toddler)\b/i,
    authority: /\b(boss|teacher|professor|police|officer|judge|principal|coach|supervisor)\b/i,
    stranger: /\b(stranger|unknown person|unfamiliar|someone i (didn'?t|don'?t) (know|recognize))\b/i,
    family: /\b(brother|sister|sibling|uncle|aunt|cousin|grandparent|grandmother|grandfather)\b/i,
    friend: /\b(friend|best friend|companion|classmate|roommate|colleague)\b/i,
    group: /\b(crowd|people|group|everyone|them|audience)\b/i,
  },
  socialContext: {
    public: /\b(public|everyone|people (around|watching|staring|looking)|in front of|crowded|weren'?t alone|observed|watched)\b/i,
    private: /\b(alone|by myself|private|hidden|locked|secret|no one|isolated|empty)\b/i,
    judged: /\b(judg(ed|ing|ment)|embarrass(ed|ing)|sham(e|ed)|ridicul(e|ed)|laughing at|mocking|humiliat(ed|ing))\b/i,
    intimate: /\b(intimate|close|touching|holding|naked|nude|undressed|exposed|vulnerability|vulnerable)\b/i,
  },
  tensionThemes: {
    boundary_crossing: /\b(intrude|intrusion|too close|crossed a line|violat(e|ed|ing)|personal space|invad(e|ed|ing)|inappropriate)\b/i,
    powerlessness: /\b(helpless|powerless|couldn'?t move|couldn'?t (stop|prevent|escape)|frozen|paralyzed|trapped|stuck|pinned)\b/i,
    pursuit: /\b(chas(e|ed|ing)|hunt(ed|ing)|follow(ed|ing)|running from|hiding from|escape|fled|flee|run away|running away)\b/i,
    loss: /\b(lost|missing|can'?t find|searching|looking for|disappeared|gone|left behind|abandoned)\b/i,
    failure: /\b(fail(ed|ing|ure)|unprepared|forgot|wrong answer|late|missed|not ready|fumbled|dropped|couldn'?t remember)\b/i,
    exposure: /\b(naked|nude|exposed|seen|caught|walked in on|discovered|revealed|uncovered)\b/i,
    conflict: /\b(fight|fought|argued|argument|yell(ed|ing)|scream(ed|ing)|hit|punch(ed)?|attack(ed)?|confrontation)\b/i,
    transformation: /\b(chang(ed|ing)|transform(ed|ing)|became|turning into|morphed|shifting|evolving|growing)\b/i,
    caretaking: /\b(protect(ed|ing)|sav(e|ed|ing)|rescue(d)?|carry(ing)?|caring for|tending|nursing|watching over|responsible for)\b/i,
    repetition: /\b(again and again|keep(s)? happening|loop(ing)?|over and over|can'?t (stop|leave)|same (thing|place)|repeated|cycle|going in circles)\b/i,
  },
  intimacyThemes: {
    desire: /\b(desire|want(ed|ing)|crav(e|ed|ing)|attracted|aroused|drawn to|magnetic|longing)\b/i,
    closeness: /\b(close(ness)?|connect(ed|ion)|intimacy|intimate|embrace|hug(ged|ging)?|cuddle|hold(ing)?|kiss(ed|ing)?)\b/i,
    sexual: /\b(sex(ual)?|erotic|sensual|aroused|orgasm|body|physical|passion(ate)?)\b/i,
  },
  authorityThemes: {
    power: /\b(power|control(led|ling)?|dominat(e|ed|ing)|authority|command|order(ed|ing)?|obey|submit|subordinate)\b/i,
    approval: /\b(approv(al|e|ed)|permission|validation|accept(ance|ed)?|judgment|evaluat(e|ed|ing)|grade|score|pass|test)\b/i,
    punishment: /\b(punish(ed|ment)?|scold(ed)?|disciplin(e|ed)|grounded|blame(d)?|guilt(y)?|wrong|bad)\b/i,
  },
  privacyThemes: {
    exposure: /\b(expos(e|ed|ing|ure)|see-through|visible|transparent|can'?t hide|nowhere to hide|open|public)\b/i,
    private_violated: /\b(walk(ed)? in|barg(e|ed) in|door (open|unlocked)|no lock|can'?t close|broken door|window open|watched|spied on)\b/i,
  },
  safetyThemes: {
    unsafe: /\b(unsafe|danger(ous)?|threat(ened)?|scary|frightening|terrif(ied|ying)|alarm(ed|ing)?)\b/i,
    safe: /\b(safe|protected|secure|comfort(able|ing)?|warm|shelter(ed)?|home)\b/i,
    unclear: /\b(unclear|confus(ed|ing)|uncertain|unsure|ambiguous|mixed|conflicted|didn'?t know)\b/i,
  },
  actions: {
    running: /\b(run(ning)?|ran|sprint(ed|ing)?|dash(ed|ing)?)\b/i,
    hiding: /\b(hid(e|ing|den)?|conceal(ed|ing)?|duck(ed|ing)?|crouch(ed|ing)?)\b/i,
    falling: /\b(fall(ing)?|fell|drop(ped|ping)?|plummet(ed|ing)?|tumbling)\b/i,
    flying: /\b(fly(ing)?|flew|float(ed|ing)?|soar(ed|ing)?|hover(ed|ing)?|levitat(e|ed|ing))\b/i,
    searching: /\b(search(ed|ing)?|look(ed|ing) for|hunting for|trying to find|wander(ed|ing))\b/i,
    fighting: /\b(fight(ing)?|fought|battl(e|ed|ing)|wrestl(e|ed|ing)|struggl(e|ed|ing))\b/i,
    speaking: /\b(speak(ing)?|spoke|talk(ed|ing)?|said|shouted|whisper(ed|ing)?|call(ed|ing))\b/i,
    watching: /\b(watch(ed|ing)?|observ(ed|ing)?|staring|gazed|looked on|witness(ed)?)\b/i,
  },
} as const;

/** Infer ending type from metadata + dream text cues */
function inferEndingType(
  dreamText: string,
  metadata: DreamMetadata,
): EndingType {
  const lower = dreamText.toLowerCase();

  // Check for explicit resolution cues
  if (/\b(resolved|figured out|understood|realized|finally|made it|escaped|got away|woke up relieved)\b/i.test(lower)) {
    return 'resolved';
  }
  if (/\b(woke up (suddenly|startled|scared|panicking)|jolted awake|snapped out)\b/i.test(lower)) {
    return 'abrupt';
  }
  if (/\b(ran away|got out|escaped|fled|managed to leave)\b/i.test(lower) && metadata.awakenState === 'relieved') {
    return 'escape';
  }
  if (/\b(faced|confronted|stood up|fought back|spoke up|told them)\b/i.test(lower)) {
    return 'confrontation';
  }

  // Infer from awaken state
  if (metadata.awakenState === 'relieved') return 'relief';
  if (metadata.awakenState === 'shaken' || metadata.awakenState === 'scared') return 'abrupt';
  if (metadata.awakenState === 'confused' || metadata.awakenState === 'unsettled' || metadata.awakenState === 'anxious' || metadata.awakenState === 'disturbed' || metadata.awakenState === 'overwhelmed') return 'unresolved';

  // Default: if dream text just stops without conclusion markers
  if (lower.length > 50 && !/\b(then|finally|eventually|after that|in the end)\b/i.test(lower)) {
    return 'unresolved';
  }

  return 'unknown';
}

/**
 * Extract structured dream features from text, keyword matches, feelings, and metadata.
 */
export function extractDreamFeatures(
  dreamText: string,
  keywordMatches: KeywordMatch[],
  feelings: SelectedFeeling[],
  metadata: DreamMetadata,
  aggregates: DreamAggregates,
): DreamFeatures {
  const lower = dreamText.toLowerCase();

  // Extract settings from regex
  const settings: string[] = [];
  for (const [key, regex] of Object.entries(FEATURE_PATTERNS.settings)) {
    if (regex.test(lower)) settings.push(key);
  }
  // Also pull from keyword matches with 'places' or 'buildings' categories
  for (const m of keywordMatches) {
    if (m.entry.category === 'places' || m.entry.category === 'buildings') {
      const label = m.entry.keywords[0];
      if (!settings.includes(label)) settings.push(label);
    }
  }

  // Extract characters
  const characters: string[] = [];
  for (const [key, regex] of Object.entries(FEATURE_PATTERNS.characters)) {
    if (regex.test(lower)) characters.push(key);
  }
  for (const m of keywordMatches) {
    if (m.entry.category === 'people') {
      const label = m.entry.keywords[0];
      if (!characters.includes(label)) characters.push(label);
    }
  }

  // Extract actions
  const actions: string[] = [];
  for (const [key, regex] of Object.entries(FEATURE_PATTERNS.actions)) {
    if (regex.test(lower)) actions.push(key);
  }

  // Explicit emotions from user-selected feelings
  const emotionsExplicit = feelings
    .filter(f => f.intensity >= 2)
    .map(f => FEELING_MAP[f.id]?.label ?? f.id);

  // Inferred emotions from dream text
  const emotionsInferred: string[] = [];
  const emotionChecks: [string, RegExp][] = [
    ['vulnerable', /\b(vulnerab(le|ility)|exposed|unprotected|open)\b/i],
    ['awkward', /\b(awkward|uncomfortable|uneasy|weird|strange)\b/i],
    ['confused', /\b(confus(ed|ing)|bewildered|disoriented|puzzled|lost)\b/i],
    ['afraid', /\b(afraid|scared|frightened|terrified|fearful)\b/i],
    ['angry', /\b(angry|furious|enraged|mad|irritated|resentful)\b/i],
    ['sad', /\b(sad|grief|grieving|mourning|crying|tears|sorrow|heartbroken)\b/i],
    ['ashamed', /\b(asham(ed)?|embarrass(ed|ing)|humiliat(ed|ing)|mortified)\b/i],
    ['curious', /\b(curious|intrigued|fascinated|wondering|drawn)\b/i],
    ['relieved', /\b(reliev(ed|f)|calm(ed)?|peaceful|at ease)\b/i],
    ['longing', /\b(longing|yearning|missing|aching|nostalgic|homesick)\b/i],
  ];
  for (const [label, regex] of emotionChecks) {
    if (regex.test(lower)) emotionsInferred.push(label);
  }

  // Social context
  const socialContext: string[] = [];
  for (const [key, regex] of Object.entries(FEATURE_PATTERNS.socialContext)) {
    if (regex.test(lower)) socialContext.push(key);
  }

  // Tension themes
  const tensionThemes: string[] = [];
  for (const [key, regex] of Object.entries(FEATURE_PATTERNS.tensionThemes)) {
    if (regex.test(lower)) tensionThemes.push(key);
  }

  // Intimacy themes
  const intimacyThemes: string[] = [];
  for (const [key, regex] of Object.entries(FEATURE_PATTERNS.intimacyThemes)) {
    if (regex.test(lower)) intimacyThemes.push(key);
  }

  // Authority themes
  const authorityThemes: string[] = [];
  for (const [key, regex] of Object.entries(FEATURE_PATTERNS.authorityThemes)) {
    if (regex.test(lower)) authorityThemes.push(key);
  }

  // Privacy themes
  const privacyThemes: string[] = [];
  for (const [key, regex] of Object.entries(FEATURE_PATTERNS.privacyThemes)) {
    if (regex.test(lower)) privacyThemes.push(key);
  }

  // Safety themes
  const safetyThemes: string[] = [];
  for (const [key, regex] of Object.entries(FEATURE_PATTERNS.safetyThemes)) {
    if (regex.test(lower)) safetyThemes.push(key);
  }

  // Unique symbol categories from keyword matches
  const symbolCategories = [...new Set(keywordMatches.map(m => m.entry.category))];

  return {
    settings,
    characters,
    actions,
    emotionsExplicit,
    emotionsInferred,
    socialContext,
    tensionThemes,
    endingType: inferEndingType(dreamText, metadata),
    intimacyThemes,
    authorityThemes,
    privacyThemes,
    safetyThemes,
    symbolCategories,
  };
}

// ─── Pattern Scoring ──────────────────────────────────────────────────────────

/** Pattern scoring rules: which features signal which pattern */
type PatternRule = {
  settings: string[];
  characters: string[];
  emotions: string[];
  tensions: string[];
  socialContext: string[];
  actions: string[];
  intimacy: string[];
  authority: string[];
  privacy: string[];
  safety: string[];
  weights: {
    settings: number;
    characters: number;
    emotions: number;
    tensions: number;
    socialContext: number;
    actions: number;
    intimacy: number;
    authority: number;
    privacy: number;
    safety: number;
    unresolvedEnding: number;
  };
};

const PATTERN_RULES: Record<DreamPattern, PatternRule> = {
  exposure: {
    settings: ['bathroom', 'school', 'stage', 'public'],
    characters: ['group', 'stranger', 'authority'],
    emotions: ['Exposed', 'Ashamed', 'Embarrassed', 'Humiliated', 'Vulnerable', 'ashamed', 'vulnerable'],
    tensions: ['exposure'],
    socialContext: ['public', 'judged'],
    actions: [],
    intimacy: [],
    authority: [],
    privacy: ['exposure', 'private_violated'],
    safety: ['unsafe'],
    weights: {
      settings: 2,
      characters: 1,
      emotions: 3,
      tensions: 4,
      socialContext: 4,
      actions: 0,
      intimacy: 0,
      authority: 0,
      privacy: 3,
      safety: 1,
      unresolvedEnding: 1,
    },
  },
  boundary: {
    settings: ['bathroom', 'house', 'dark'],
    characters: ['parent', 'partner', 'family', 'stranger'],
    emotions: ['Confused', 'Uncomfortable', 'Exposed', 'Violated', 'Uneasy', 'confused', 'awkward', 'vulnerable'],
    tensions: ['boundary_crossing'],
    socialContext: ['intimate'],
    actions: [],
    intimacy: ['closeness', 'desire'],
    authority: [],
    privacy: ['exposure', 'private_violated'],
    safety: ['unclear'],
    weights: {
      settings: 2,
      characters: 2,
      emotions: 2,
      tensions: 5,
      socialContext: 2,
      actions: 0,
      intimacy: 3,
      authority: 0,
      privacy: 3,
      safety: 2,
      unresolvedEnding: 2,
    },
  },
  authority: {
    settings: ['school', 'workplace'],
    characters: ['parent', 'authority'],
    emotions: ['Pressured', 'Anxious', 'Defensive', 'Frustrated', 'afraid'],
    tensions: ['powerlessness'],
    socialContext: ['judged'],
    actions: [],
    intimacy: [],
    authority: ['power', 'approval', 'punishment'],
    privacy: [],
    safety: ['unsafe'],
    weights: {
      settings: 1,
      characters: 4,
      emotions: 1,
      tensions: 3,
      socialContext: 2,
      actions: 0,
      intimacy: 0,
      authority: 5,
      privacy: 0,
      safety: 1,
      unresolvedEnding: 1,
    },
  },
  pursuit: {
    settings: ['outdoor', 'dark', 'house'],
    characters: ['stranger', 'group'],
    emotions: ['Panicked', 'Terrified', 'Anxious', 'Alarmed', 'afraid'],
    tensions: ['pursuit'],
    socialContext: [],
    actions: ['running', 'hiding'],
    intimacy: [],
    authority: [],
    privacy: [],
    safety: ['unsafe'],
    weights: {
      settings: 1,
      characters: 1,
      emotions: 2,
      tensions: 5,
      socialContext: 0,
      actions: 4,
      intimacy: 0,
      authority: 0,
      privacy: 0,
      safety: 2,
      unresolvedEnding: 2,
    },
  },
  lost: {
    settings: ['house', 'outdoor', 'dark', 'public'],
    characters: [],
    emotions: ['Confused', 'Anxious', 'Overwhelmed', 'Disoriented', 'confused'],
    tensions: ['loss'],
    socialContext: ['private'],
    actions: ['searching'],
    intimacy: [],
    authority: [],
    privacy: [],
    safety: ['unclear'],
    weights: {
      settings: 2,
      characters: 0,
      emotions: 2,
      tensions: 4,
      socialContext: 1,
      actions: 4,
      intimacy: 0,
      authority: 0,
      privacy: 0,
      safety: 2,
      unresolvedEnding: 3,
    },
  },
  performance: {
    settings: ['school', 'stage', 'workplace'],
    characters: ['authority', 'group'],
    emotions: ['Anxious', 'Stressed', 'Panicked', 'Pressured', 'Exposed', 'Frustrated'],
    tensions: ['failure'],
    socialContext: ['public', 'judged'],
    actions: ['speaking'],
    intimacy: [],
    authority: ['approval'],
    privacy: [],
    safety: [],
    weights: {
      settings: 3,
      characters: 2,
      emotions: 2,
      tensions: 5,
      socialContext: 3,
      actions: 2,
      intimacy: 0,
      authority: 3,
      privacy: 0,
      safety: 0,
      unresolvedEnding: 1,
    },
  },
  connection: {
    settings: ['house', 'outdoor', 'water'],
    characters: ['partner', 'friend', 'family', 'child'],
    emotions: ['Yearning', 'Nostalgic', 'Tender', 'Bittersweet', 'longing', 'sad'],
    tensions: ['loss'],
    socialContext: ['intimate', 'private'],
    actions: ['searching'],
    intimacy: ['closeness', 'desire'],
    authority: [],
    privacy: [],
    safety: ['safe'],
    weights: {
      settings: 1,
      characters: 3,
      emotions: 3,
      tensions: 2,
      socialContext: 2,
      actions: 2,
      intimacy: 4,
      authority: 0,
      privacy: 0,
      safety: 1,
      unresolvedEnding: 2,
    },
  },
  conflict: {
    settings: ['house', 'workplace', 'outdoor'],
    characters: ['partner', 'parent', 'family', 'friend', 'stranger'],
    emotions: ['Angry', 'Frustrated', 'Enraged', 'Defensive', 'Betrayed', 'angry'],
    tensions: ['conflict'],
    socialContext: [],
    actions: ['fighting', 'speaking'],
    intimacy: [],
    authority: ['power'],
    privacy: [],
    safety: ['unsafe'],
    weights: {
      settings: 1,
      characters: 2,
      emotions: 3,
      tensions: 5,
      socialContext: 0,
      actions: 3,
      intimacy: 0,
      authority: 2,
      privacy: 0,
      safety: 1,
      unresolvedEnding: 1,
    },
  },
  caretaking: {
    settings: ['house', 'hospital', 'outdoor'],
    characters: ['child', 'family', 'partner', 'friend'],
    emotions: ['Protective', 'Anxious', 'Tender', 'Overwhelmed', 'Responsible'],
    tensions: ['caretaking'],
    socialContext: [],
    actions: ['watching'],
    intimacy: ['closeness'],
    authority: [],
    privacy: [],
    safety: ['unsafe', 'safe'],
    weights: {
      settings: 1,
      characters: 3,
      emotions: 2,
      tensions: 5,
      socialContext: 0,
      actions: 2,
      intimacy: 1,
      authority: 0,
      privacy: 0,
      safety: 2,
      unresolvedEnding: 1,
    },
  },
  transformation: {
    settings: ['water', 'outdoor', 'dark'],
    characters: [],
    emotions: ['Awed', 'Electrified', 'Peaceful', 'Unsettled', 'Curious'],
    tensions: ['transformation'],
    socialContext: [],
    actions: ['flying'],
    intimacy: [],
    authority: [],
    privacy: [],
    safety: ['unclear'],
    weights: {
      settings: 2,
      characters: 0,
      emotions: 2,
      tensions: 5,
      socialContext: 0,
      actions: 2,
      intimacy: 0,
      authority: 0,
      privacy: 0,
      safety: 1,
      unresolvedEnding: 1,
    },
  },
  house_self: {
    settings: ['house'],
    characters: [],
    emotions: ['Curious', 'Confused', 'Nostalgic', 'Awed', 'curious', 'confused'],
    tensions: [],
    socialContext: ['private'],
    actions: ['searching'],
    intimacy: [],
    authority: [],
    privacy: [],
    safety: ['safe', 'unclear'],
    weights: {
      settings: 5,
      characters: 0,
      emotions: 2,
      tensions: 1,
      socialContext: 2,
      actions: 2,
      intimacy: 0,
      authority: 0,
      privacy: 0,
      safety: 1,
      unresolvedEnding: 1,
    },
  },
  stuck: {
    settings: ['house', 'dark'],
    characters: [],
    emotions: ['Frustrated', 'Overwhelmed', 'Exhausted', 'Trapped', 'Helpless'],
    tensions: ['repetition', 'powerlessness'],
    socialContext: [],
    actions: [],
    intimacy: [],
    authority: [],
    privacy: [],
    safety: ['unsafe'],
    weights: {
      settings: 1,
      characters: 0,
      emotions: 3,
      tensions: 5,
      socialContext: 0,
      actions: 0,
      intimacy: 0,
      authority: 0,
      privacy: 0,
      safety: 2,
      unresolvedEnding: 3,
    },
  },
};

/**
 * Count how many items from `needles` appear in `haystack` (case-insensitive).
 */
function countOverlap(haystack: string[], needles: string[]): number {
  if (needles.length === 0) return 0;
  const haystackLower = new Set(haystack.map(h => h.toLowerCase()));
  return needles.filter(n => haystackLower.has(n.toLowerCase())).length;
}

/**
 * Score all 12 dream patterns against extracted features.
 * Returns ranked patterns with scores and confidence.
 */
export function scoreDreamPatterns(features: DreamFeatures): PatternResult {
  const scores: Partial<Record<DreamPattern, number>> = {};

  const ALL_PATTERNS: DreamPattern[] = [
    'exposure', 'boundary', 'authority', 'pursuit', 'lost', 'performance',
    'connection', 'conflict', 'caretaking', 'transformation', 'house_self', 'stuck',
  ];

  const allEmotions = [...features.emotionsExplicit, ...features.emotionsInferred];

  for (const pattern of ALL_PATTERNS) {
    const rule = PATTERN_RULES[pattern];
    const w = rule.weights;

    let raw = 0;
    let maxPossible = 0;

    // Settings
    if (rule.settings.length > 0) {
      const hits = countOverlap(features.settings, rule.settings);
      raw += (hits / rule.settings.length) * w.settings;
    }
    maxPossible += w.settings;

    // Characters
    if (rule.characters.length > 0) {
      const hits = countOverlap(features.characters, rule.characters);
      raw += (hits / rule.characters.length) * w.characters;
    }
    maxPossible += w.characters;

    // Emotions
    if (rule.emotions.length > 0) {
      const hits = countOverlap(allEmotions, rule.emotions);
      raw += (hits / rule.emotions.length) * w.emotions;
    }
    maxPossible += w.emotions;

    // Tensions
    if (rule.tensions.length > 0) {
      const hits = countOverlap(features.tensionThemes, rule.tensions);
      raw += (hits / rule.tensions.length) * w.tensions;
    }
    maxPossible += w.tensions;

    // Social context
    if (rule.socialContext.length > 0) {
      const hits = countOverlap(features.socialContext, rule.socialContext);
      raw += (hits / rule.socialContext.length) * w.socialContext;
    }
    maxPossible += w.socialContext;

    // Actions
    if (rule.actions.length > 0) {
      const hits = countOverlap(features.actions, rule.actions);
      raw += (hits / rule.actions.length) * w.actions;
    }
    maxPossible += w.actions;

    // Intimacy
    if (rule.intimacy.length > 0) {
      const hits = countOverlap(features.intimacyThemes, rule.intimacy);
      raw += (hits / rule.intimacy.length) * w.intimacy;
    }
    maxPossible += w.intimacy;

    // Authority
    if (rule.authority.length > 0) {
      const hits = countOverlap(features.authorityThemes, rule.authority);
      raw += (hits / rule.authority.length) * w.authority;
    }
    maxPossible += w.authority;

    // Privacy
    if (rule.privacy.length > 0) {
      const hits = countOverlap(features.privacyThemes, rule.privacy);
      raw += (hits / rule.privacy.length) * w.privacy;
    }
    maxPossible += w.privacy;

    // Safety
    if (rule.safety.length > 0) {
      const hits = countOverlap(features.safetyThemes, rule.safety);
      raw += (hits / rule.safety.length) * w.safety;
    }
    maxPossible += w.safety;

    // Unresolved ending bonus
    if (features.endingType === 'unresolved' || features.endingType === 'abrupt') {
      raw += w.unresolvedEnding;
    }
    maxPossible += w.unresolvedEnding;

    scores[pattern] = maxPossible > 0 ? raw / maxPossible : 0;
  }

  // Rank by score
  const ranked = ALL_PATTERNS
    .map(p => ({ pattern: p, score: scores[p] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const primary = ranked[0];
  const runnerUp = ranked[1];
  const secondaries = ranked
    .slice(1)
    .filter(r => r.score >= 0.15 && r.score >= primary.score * 0.4)
    .slice(0, 2)
    .map(r => r.pattern);

  // ── Adaptive confidence scoring ──────────────────────────────────────────
  // Instead of returning raw score as confidence, compute a composite that
  // accounts for how clearly the top pattern separates from the rest and
  // how many features the dream actually provided as evidence.

  // Separation: how far ahead the primary is vs the runner-up (0..1)
  // A clear winner (0.35 vs 0.10) is far more confident than a near-tie.
  const separation = primary.score > 0
    ? Math.min(1, (primary.score - (runnerUp?.score ?? 0)) / primary.score)
    : 0;

  // Feature density: how many distinct features were actually extracted.
  // More evidence = higher confidence in the pattern assignment.
  const featureCount =
    features.settings.length +
    features.characters.length +
    features.actions.length +
    features.tensionThemes.length +
    features.socialContext.length +
    features.intimacyThemes.length +
    features.authorityThemes.length +
    features.privacyThemes.length +
    features.safetyThemes.length;
  // Diminishing returns: first 6 features matter most, then it tapers off
  const featureDensity = Math.min(1, featureCount / 6);

  // Composite confidence: weighted blend
  //   40% raw score (does the dream match the pattern?)
  //   35% separation  (is the match clearly dominant?)
  //   25% feature density (does the dream have enough evidence?)
  const confidence = 0.40 * primary.score + 0.35 * separation + 0.25 * featureDensity;

  return {
    primaryPattern: primary.pattern,
    secondaryPatterns: secondaries,
    confidence,
    scores,
  };
}

// ─── Emotional Contradiction Detection ────────────────────────────────────────

/** Opposing emotional poles that create psychological tension */
const CONTRADICTION_PAIRS: [string[], string[], string][] = [
  // [poleA labels, poleB labels, description]
  [['curious', 'drawn', 'intrigued', 'fascinated'], ['ashamed', 'embarrassed', 'humiliated'], 'curiosity and shame'],
  [['curious', 'drawn', 'intrigued'], ['confused', 'disoriented', 'bewildered'], 'curiosity and confusion'],
  [['desire', 'attracted', 'aroused', 'drawn', 'yearning', 'tempted'], ['afraid', 'scared', 'terrified', 'anxious'], 'desire and fear'],
  [['desire', 'attracted', 'aroused', 'yearning'], ['ashamed', 'embarrassed', 'guilty'], 'desire and shame'],
  [['tender', 'loving', 'caring', 'affectionate'], ['angry', 'frustrated', 'resentful', 'enraged'], 'love and anger'],
  [['safe', 'comforted', 'protected', 'calm'], ['anxious', 'afraid', 'uneasy', 'unsafe'], 'safety and threat'],
  [['powerful', 'strong', 'confident'], ['helpless', 'powerless', 'trapped', 'stuck'], 'power and helplessness'],
  [['relieved', 'peaceful', 'calm'], ['unsettled', 'uneasy', 'disturbed'], 'relief and disturbance'],
  [['connected', 'close', 'intimate'], ['isolated', 'alone', 'abandoned', 'distant'], 'closeness and isolation'],
  [['excited', 'thrilled', 'electrified'], ['overwhelmed', 'exhausted', 'drained'], 'excitement and overwhelm'],
];

/**
 * Detect emotional contradictions from the user's feelings and inferred emotions.
 */
export function detectEmotionalContradictions(
  feelings: SelectedFeeling[],
  emotionsInferred: string[],
): EmotionalContradiction[] {
  const allLabels = [
    ...feelings.filter(f => f.intensity >= 2).map(f => (FEELING_MAP[f.id]?.label ?? f.id).toLowerCase()),
    ...emotionsInferred.map(e => e.toLowerCase()),
  ];

  const contradictions: EmotionalContradiction[] = [];

  for (const [poleALabels, poleBLabels, description] of CONTRADICTION_PAIRS) {
    const hasA = poleALabels.some(a => allLabels.includes(a));
    const hasB = poleBLabels.some(b => allLabels.includes(b));

    if (hasA && hasB) {
      // Intensity is based on feeling intensities where available
      const aIntensity = feelings
        .filter(f => poleALabels.includes((FEELING_MAP[f.id]?.label ?? '').toLowerCase()))
        .reduce((max, f) => Math.max(max, f.intensity), 0);
      const bIntensity = feelings
        .filter(f => poleBLabels.includes((FEELING_MAP[f.id]?.label ?? '').toLowerCase()))
        .reduce((max, f) => Math.max(max, f.intensity), 0);

      const intensity = Math.min(1, ((aIntensity || 3) + (bIntensity || 3)) / 10);

      contradictions.push({
        poleA: description.split(' and ')[0],
        poleB: description.split(' and ')[1],
        intensity,
      });
    }
  }

  return contradictions.sort((a, b) => b.intensity - a.intensity);
}

// ─── Ending Analysis ──────────────────────────────────────────────────────────

const ENDING_MEANINGS: Record<EndingType, string[]> = {
  resolved: [
    'This dream found its way to something like closure, and that matters. Even if it wasn’t neat, the fact that your mind let it resolve suggests a part of you has found its footing with whatever was being processed.',
    'The resolution at the end of this dream is a good sign. It doesn’t mean everything is figured out, but it does suggest your inner world is moving toward a new understanding — even if it’s still forming.',
    'Something settled by the end of this dream, even if just slightly. That resolution hints that your mind may be further along in processing this than you’d think.',
  ],
  unresolved: [
    'This dream didn’t wrap up neatly, and honestly, that’s probably the most honest part of it. Whatever it’s working through doesn’t have a simple answer yet — and the dream is okay with that.',
    'The open ending here isn’t a failure — it’s a process still in motion. Your mind is still turning something over, still feeling around the edges of it, and the dream reflects that truthfully.',
    'You may have woken up with the feeling that the dream wasn’t finished. That’s because whatever it’s processing isn’t finished either — not in a bad way, just in a "this needs more time" kind of way.',
  ],
  abrupt: [
    'Waking up suddenly from this dream probably left you feeling rattled, and that’s because whatever surfaced hit close to something real. When the emotional material gets too intense, the dream just… stops.',
    'The abrupt ending is actually significant — it usually means the dream touched on something your mind wasn’t quite ready to sit with. That kind of intensity is worth noticing.',
    'This dream cut off before it finished, which often happens when the feeling underneath it reaches a point your nervous system decides is "enough for now." What was happening right before you woke up might be the most important part.',
  ],
  escape: [
    'You found a way out in this dream, and that matters. Whether it was running, flying, or just suddenly being somewhere else, the escape signals that part of you is ready to move past something that’s felt confining.',
    'The escape at the end is interesting — your dreaming mind gave you an exit, which suggests a growing sense that you don’t have to stay in whatever situation the dream was staging.',
  ],
  relief: [
    'If there was a wave of relief when you woke up, that’s your mind recognizing it just worked through something heavy without having to actually live through it. That’s what dreams are for.',
    'Waking with relief doesn’t mean the dream was meaningless — it means your deeper mind completed a round of processing and came out the other side. Think of it as emotional exercise.',
  ],
  confrontation: [
    'This dream moved toward confrontation rather than away from it, and that’s a significant shift. A part of you seems ready to face something head-on instead of working around it.',
    'The confrontation at the end of this dream might feel intense, but it’s often a sign of readiness — your mind rehearsing the moment of standing your ground.',
  ],
  unknown: [
    'The way this dream ended is hard to pin down, and that’s okay. Sometimes the most meaningful thing isn’t the ending itself — it’s what keeps echoing after you wake up.',
    'However this dream ended, the part that still sits with you is probably the part that matters most.',
  ],
};

/**
 * Analyze the dream's ending and produce a contextual meaning.
 */
export function analyzeEnding(
  endingType: EndingType,
  seed: number,
): EndingAnalysis {
  const meanings = ENDING_MEANINGS[endingType];
  const idx = Math.abs(Math.floor(seed * 997 + 77)) % meanings.length;
  return {
    type: endingType,
    meaning: meanings[idx],
  };
}

// ─── Undercurrent Labels ──────────────────────────────────────────────────────

/**
 * Generate an elegant undercurrent label from the pattern + contradictions.
 */
function buildUndercurrentLabel(
  primaryPattern: DreamPattern,
  contradictions: EmotionalContradiction[],
): string {
  // If there's a strong contradiction, use it
  if (contradictions.length > 0 && contradictions[0].intensity >= 0.5) {
    const c = contradictions[0];
    return `${capitalize(c.poleA)} meeting ${c.poleB}`;
  }

  // Otherwise use the pattern's display label
  return PATTERN_DISPLAY_LABELS[primaryPattern];
}

// ─── Pattern-Aware Reflection Questions ───────────────────────────────────────

const PATTERN_QUESTIONS: Record<DreamPattern, string[]> = {
  exposure: [
    'What parts of yourself feel most visible right now — and how does that visibility sit with you?',
    'Is there something you’ve been keeping private that feels like it’s asking to be acknowledged?',
    'What might it feel like to be fully seen without needing to perform or protect?',
  ],
  boundary: [
    'Where in your life right now do boundaries feel unclear or hard to hold?',
    'What kinds of closeness or emotional situations feel both compelling and uncomfortable at the same time?',
    'What might it feel like to hold curiosity about confusing emotions without needing to immediately resolve them?',
  ],
  authority: [
    'Whose approval still carries weight in your inner world — and what would it feel like to need it less?',
    'Where in your life are you giving someone else the power to define your worth?',
    'What might change if you trusted your own authority a little more?',
  ],
  pursuit: [
    'What are you running from in your waking life — and what might happen if you stopped?',
    'Is there something you’ve been avoiding that keeps finding its way back to you?',
    'What would it take to feel safe enough to stop running?',
  ],
  lost: [
    'Where in your life right now does the path forward feel unclear?',
    'What would it feel like to be lost without it meaning you’re failing?',
    'Is there a part of you that already knows the direction, even if the mind hasn’t caught up?',
  ],
  performance: [
    'Where are you holding yourself to a standard that might not be yours?',
    'What would "enough" look like if no one was watching?',
    'What might shift if failure were allowed to be part of the process, not the end of it?',
  ],
  connection: [
    'What kind of connection is your heart reaching for right now?',
    'Is there a relationship — past or present — that still carries unfinished emotional weight?',
    'What might it feel like to let yourself be fully met by someone?',
  ],
  conflict: [
    'What truth have you been holding back — and what would it cost to speak it?',
    'Where in your life is tension building beneath the surface?',
    'What would it feel like to hold anger without needing to act on it or suppress it?',
  ],
  caretaking: [
    'Who are you taking care of in your life right now — and who is taking care of you?',
    'Is there a part of you that needs the same protection you’re offering others?',
    'What might it feel like to set down the weight of responsibility, even briefly?',
  ],
  transformation: [
    'What version of yourself feels like it’s emerging — and what version feels like it’s being left behind?',
    'What would you need in order to trust the process of changing?',
    'Is there something you’re becoming that both excites and unsettles you?',
  ],
  house_self: [
    'What part of yourself have you not visited in a while?',
    'If your inner world were a house, which room would you be afraid to enter?',
    'What might be waiting for you in the spaces you usually avoid?',
  ],
  stuck: [
    'What in your life right now feels like it keeps repeating without moving forward?',
    'What would it take to break the pattern — and what might you have to let go of to do it?',
    'Is there something your mind keeps circling that your heart already knows the answer to?',
  ],
};

// ─── Narrative Generation ─────────────────────────────────────────────────────

/** Pick a variant deterministically */
function pickVariant<T>(variants: readonly T[], seed: number, offset: number): T {
  const idx = Math.abs(Math.floor(seed * 997 + offset * 131)) % variants.length;
  return variants[idx];
}

/** Capitalize the first character of a string (sentence-start formatting). */
const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Return a person label with an appropriate determiner for natural prose.
 * Personal relationship terms (mom, dad, partner, etc.) work without an article.
 * Non-personal nouns (stranger, boss, crowd, etc.) get "a" or "an".
 */
function labelWithDeterminer(label: string): string {
  const PERSONAL = new Set([
    'mom', 'dad', 'mother', 'father', 'adoptive dad', 'ex', 'friend',
    'husband', 'wife', 'partner', 'brother', 'sister', 'sibling',
    'grandma', 'grandpa', 'grandmother', 'grandfather',
  ]);
  if (PERSONAL.has(label.toLowerCase())) return label;
  return /^[aeiou]/i.test(label) ? `an ${label}` : `a ${label}`;
}

/**
 * Pattern-level narrative templates for section 2 (pattern explanation).
 * Each pattern gets gentle, open-ended interpretive language.
 */
const PATTERN_EXPLANATIONS: Record<DreamPattern, string[]> = {
  exposure: [
    'You know that feeling of suddenly realizing everyone can see something you thought was hidden? This dream taps into that. It’s not necessarily about embarrassment — it’s about what happens when the walls come down before you’re ready.',
    'Something private is asking to be seen. This dream seems less about actual exposure and more about standing in that uncomfortable gap between who you show the world and what you’re actually carrying inside.',
    'There’s a vulnerability in this dream that runs deeper than the images suggest. It’s the feeling of being visible in a way that wasn’t your choice — and that kind of openness, even in a dream, can feel like a lot.',
  ],
  boundary: [
    'This dream seems to be sitting with a question you might already be asking yourself: where do I end and someone else begins? That blur between closeness and overwhelm can be hard to navigate, and your dreaming mind seems to be working it out.',
    'There’s a tension in this dream between wanting to let people in and needing to protect your space. Boundary dreams often show up not when things are falling apart, but when you’re quietly renegotiating what you allow.',
    'Something about limits — who’s crossing yours, or whether you can hold them — seems to be at the heart of this one. It’s the kind of thing that’s hard to put into words during the day but shows up clearly at night.',
  ],
  authority: [
    'Power dynamics are running through this dream, and they probably feel familiar. Whether it’s a boss, a parent, or just the weight of someone else’s expectations, the real question underneath isn’t about them — it’s about how much space you’re giving yourself to disagree.',
    'This dream puts you in a position where someone else holds the power, and that tension between wanting approval and wanting autonomy is real. It’s not always about a specific person — sometimes it’s about the part of you that still asks for permission.',
    'There’s something here about the gap between what you’re told you should do and what actually feels right. Authority in dreams often isn’t about the person — it’s about the part of you that’s ready to trust your own judgment.',
  ],
  pursuit: [
    'Being chased in a dream is one of the most physically intense experiences your mind can create, and it usually doesn’t mean something is literally after you. More often, it’s something you’ve been avoiding — a feeling, a conversation, a truth — catching up.',
    'Your mind staged a survival scenario here, and the urgency of it probably still echoes. Pursuit dreams tend to show up when stress has been building quietly, and the thing you’re running from is often the thing most worth turning toward.',
    'There’s something chasing you in this dream, and the fact that your mind chose running — rather than confronting — might be saying something about where you are right now. Whatever it is, it’s not going away on its own.',
  ],
  lost: [
    'Being lost is such a specific kind of discomfort — it’s not pain, it’s not fear exactly, it’s the unsettling absence of knowing where you are. This dream seems to mirror that same feeling about something in your waking life — maybe a decision, a direction, or just the sense that you’re between chapters.',
    'This dream dropped you into unfamiliar territory with no map, and that feeling usually isn’t random. It tends to show up when something in your life is genuinely uncertain — when you’re searching for an answer that isn’t clear yet.',
    'The disorientation in this dream isn’t about the landscape. It’s the feeling of not knowing where you stand — in a relationship, in your career, in your own sense of self. That kind of lostness deserves patience, not panic.',
  ],
  performance: [
    'The pressure in this dream is palpable, and it probably feels familiar. Whether it’s a test, a presentation, or just the weight of being watched, the anxiety usually isn’t about the task itself — it’s about what failing would say about you.',
    'You know the feeling of standing in front of people and suddenly doubting everything? This dream seems to be replaying that loop. The question underneath it all usually isn’t "can I do this?" — it’s "what happens if I’m not good enough?"',
    'Performance dreams hit different because they go straight to self-worth. Your mind isn’t testing your ability — it’s testing how you handle the possibility of being seen as less than you want to be.',
  ],
  connection: [
    'There’s a reaching-toward-someone quality in this dream that’s hard to miss. Whether it’s a reunion, a conversation, or just the presence of someone who matters, the dream seems to be holding space for a kind of closeness that’s missing or incomplete right now.',
    'This dream carries a quiet ache — the kind that comes from wanting to be understood, to belong, or to be met halfway by someone. That longing often hides during the day, but dreams don’t let it stay buried.',
    'Something in your relational world seems unfinished — a conversation that didn’t happen, a goodbye that wasn’t enough, or a closeness you’re missing more than you let on. This dream is holding those feelings gently.',
  ],
  conflict: [
    'There’s fire in this dream — tension, friction, maybe even anger — and it’s almost certainly about something that hasn’t had space to come out during the day. Dreams will stage the fight your waking self has been avoiding.',
    'The confrontation in this dream isn’t random. It usually mirrors something that’s been simmering — a frustration you haven’t expressed, a line someone crossed, or a part of you that’s done being quiet about it.',
    'When a dream turns confrontational, it’s rarely about the other person. It’s usually about you finding the version of yourself that’s ready to push back — against a situation, a pattern, or a dynamic that doesn’t fit anymore.',
  ],
  caretaking: [
    'This dream puts you in the role of protector, and if you’re honest, that probably doesn’t surprise you. The question it raises isn’t whether you care too much — it’s whether you ever let someone care for you the same way.',
    'There’s a deep sense of responsibility running through this dream, and it feels like more than just kindness. It might be pointing to a pattern where you define your worth by how well you hold others together — sometimes at your own expense.',
    'The person you’re protecting in this dream might be someone real, or they might be a part of you. Either way, the dream is asking you to notice how naturally you step into the caretaking role — and what it costs you.',
  ],
  transformation: [
    'Something is changing in this dream — maybe you, maybe the world around you — and the feeling is probably equal parts exciting and terrifying. Transformation dreams tend to arrive when you’re at a threshold, even if you haven’t fully stepped through yet.',
    'Your dreaming mind seems to be rehearsing a shift. Whether it’s an ending, a beginning, or that disorienting space between the two, this dream is processing the reality that you’re becoming someone slightly different from who you were.',
    'There’s a before-and-after quality to this dream. Something old is falling away and something new is taking shape, and the mixed feelings that come with that — grief and excitement, loss and possibility — are all part of it.',
  ],
  house_self: [
    'In dreams, houses are almost always about you — each room a different part of who you are. Discovering a hidden room, finding a door you’d forgotten, or wandering through unfamiliar hallways usually means there’s something inside you that’s asking to be explored.',
    'Your dream turned your inner world into a physical space, and the parts you lingered in probably matter. The rooms that felt familiar are the parts of yourself you know well; the ones that made you uneasy might be the ones worth opening.',
    'There’s something deeply personal about a house dream. It’s your mind building a map of who you are right now — which parts feel like home, which feel abandoned, and which might be ready to be lived in again.',
  ],
  stuck: [
    'If this dream felt like you were running in place, that’s because the feeling it’s processing is exactly that. Something in your life might be cycling without moving forward, and your dreaming mind is showing you the frustration your waking self keeps pushing aside.',
    'The repetition in this dream isn’t a glitch — it’s a message. There’s something your mind keeps circling back to, some question or situation it can’t let go of yet, and the dream is asking you to stop trying to push through and instead look at what’s holding you in place.',
    'Feeling stuck is one of the most universally frustrating experiences, and your dream captured it perfectly. The loop isn’t there to punish you — it’s there because something unresolved keeps asking for your attention.',
  ],
};

/**
 * Generate a cohesive, flowing 6-section narrative interpretation
 * using the dream pattern as the organizing lens.
 *
 * Sections:
 *   1. Dream Overview — ground the reader in the atmosphere
 *   2. Pattern Context — explain the environment through the pattern lens
 *   3. Relational/Character Meaning — interpret people through the pattern
 *   4. Emotional Landscape — weave emotions naturally into the narrative
 *   5. Unresolved Tension — ending analysis + psychological theme
 *   6. Reflection Question — one calm, elegant question
 *
 * Each section flows into the next. No abrupt topic jumps.
 */
export function generatePatternNarrative(
  dreamText: string,
  features: DreamFeatures,
  patternResult: PatternResult,
  contradictions: EmotionalContradiction[],
  ending: EndingAnalysis,
  keywordMatches: KeywordMatch[],
  aggregates: DreamAggregates,
  seed: number,
): { narrative: string; undercurrentLabel: string; reflectionQuestion: string } {
  const sections: string[] = [];
  const { primaryPattern, secondaryPatterns } = patternResult;

  // Key data
  const topMatches = keywordMatches.slice(0, 6);
  const placeMatch = topMatches.find(m => m.entry.category === 'places' || m.entry.category === 'buildings');
  const personMatch = topMatches.find(m => m.entry.category === 'people');
  const patternLabel = PATTERN_DISPLAY_LABELS[primaryPattern];

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. DREAM OVERVIEW — Ground the reader in atmosphere + central pattern
  // ═══════════════════════════════════════════════════════════════════════════

  {
    const settingPhrase = placeMatch
      ? `in a ${placeMatch.entry.keywords[0]} setting`
      : features.settings.length > 0
        ? `in a ${features.settings[0]} setting`
        : '';
    const characterPhrase = personMatch
      ? `, with ${labelWithDeterminer(personMatch.entry.keywords[0])} present`
      : features.characters.length > 0
        ? `, with ${labelWithDeterminer(features.characters[0])} present`
        : '';

    const atmosphereWord = aggregates.valenceScore > 0.3 ? 'tender'
      : aggregates.valenceScore > -0.3 ? 'charged'
      : 'unsettling';

    if (settingPhrase) {
      const overviewVariants = [
        `Your dream placed you ${settingPhrase}${characterPhrase}, and even now, something about that scene probably still lingers. The ${atmosphereWord} quality of it wasn’t accidental — there’s a thread of ${patternLabel.toLowerCase()} running through the whole experience.`,
        `There’s a reason this dream chose ${settingPhrase.replace('in a ', 'a ')} as its stage${characterPhrase}. The atmosphere felt ${atmosphereWord}, and underneath the surface details, it seems to be working through something about ${patternLabel.toLowerCase()}.`,
        `This dream unfolded ${settingPhrase}${characterPhrase} — and the fact that it felt ${atmosphereWord} matters. More than any single detail, the dream as a whole seems to be sitting with ${patternLabel.toLowerCase()}.`,
        `Something about being ${settingPhrase}${characterPhrase} clearly stayed with you. The ${atmosphereWord} feeling that came with it points to something deeper — what looks like ${patternLabel.toLowerCase()} woven through the experience.`,
      ] as const;
      sections.push(pickVariant(overviewVariants, seed, 1));
    } else {
      const noSettingVariants = [
        `Even without a vivid setting, this dream carries a ${atmosphereWord} emotional weight that’s hard to shake. What comes through most clearly is a sense of ${patternLabel.toLowerCase()} — the kind of thing that lingers after waking.`,
        `The details may feel fuzzy, but the feeling is clear. There’s a thread of ${patternLabel.toLowerCase()} running through this dream, and the ${atmosphereWord} quality of it suggests your inner world was working on something that matters.`,
        `What’s interesting about this dream isn’t the imagery — it’s the feeling. Something about ${patternLabel.toLowerCase()} seems to be at the center, even if the dream didn’t hand you a neat storyline to go with it.`,
      ] as const;
      sections.push(pickVariant(noSettingVariants, seed, 1));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. PATTERN CONTEXT — Interpret the environment through the pattern lens
  // ═══════════════════════════════════════════════════════════════════════════

  {
    const explanations = PATTERN_EXPLANATIONS[primaryPattern];
    let explanation = pickVariant(explanations, seed, 2);

    // If there's a place, weave it into the pattern explanation
    if (placeMatch) {
      const placeLabel = placeMatch.entry.keywords[0];
      const placeMeaning = placeMatch.entry.meaning
        .replace(/^[^—–—]*[—–—]\s*/, '')
        .replace(/\.$/, '');

      const placeContextVariants = [
        `The fact that it happened in a ${placeLabel} adds something — ${placeLabel}s are often tied to ${placeMeaning}, which deepens the feeling of what the dream was exploring.`,
        `And the ${placeLabel} setting isn’t just backdrop. It’s a space that often carries feelings of ${placeMeaning}, which makes the pattern feel even more personal.`,
        `Setting this in a ${placeLabel} — a place connected to ${placeMeaning} — grounds the pattern in something specific and makes the vulnerability feel more concrete.`,
      ] as const;
      explanation += ' ' + pickVariant(placeContextVariants, seed, 21);
    }

    // If secondary patterns are present, weave them in
    if (secondaryPatterns.length > 0) {
      const secondaryLabels = secondaryPatterns.map(p => PATTERN_DISPLAY_LABELS[p].toLowerCase());
      if (secondaryLabels.length === 1) {
        explanation += ` There’s also a quieter thread of ${secondaryLabels[0]} running underneath — not the main theme, but present enough to add texture to the experience.`;
      } else {
        explanation += ` Threads of ${secondaryLabels.join(' and ')} are woven in too, giving the dream more emotional range than a single pattern could hold.`;
      }
    }

    sections.push(explanation);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. RELATIONAL / CHARACTER MEANING — Interpret people through the pattern
  // ═══════════════════════════════════════════════════════════════════════════

  if (features.characters.length > 0) {
    const mainCharacter = personMatch?.entry.keywords[0] ?? features.characters[0];
    const isAuthority = ['parent', 'authority'].some(c =>
      features.characters.includes(c) ||
      (personMatch && ['father', 'mother', 'boss', 'teacher', 'dad', 'mom'].includes(personMatch.entry.keywords[0]))
    );
    const isFamily = features.characters.includes('family') || features.characters.includes('parent');

    // Pattern-specific relational interpretation
    const mc = labelWithDeterminer(mainCharacter);
    if (primaryPattern === 'boundary' || primaryPattern === 'exposure') {
      const boundaryRelVariants = [
        `Having ${mc} there makes this dream more personal. When someone you know shows up in a dream about vulnerability or boundaries, it usually isn’t about them specifically — it’s about what the space between you feels like, and whether it feels safe.`,
        `The fact that ${mc} was part of this matters. Their presence seems to bring up something about the unspoken rules between you — about closeness, distance, and which parts of yourself feel okay to show.`,
        `${capitalize(mc)} being in this dream adds a layer that’s worth sitting with. It’s less about them and more about the emotional dynamic — the question of who gets to see you when your guard is down.`,
      ] as const;
      sections.push(pickVariant(boundaryRelVariants, seed, 3));
    } else if (primaryPattern === 'authority' && isAuthority) {
      const authRelVariants = [
        `${capitalize(mc)} showing up here isn’t a coincidence. ${isFamily ? 'Family figures' : 'Authority figures'} in dreams rarely mean exactly what they seem — they tend to carry the full weight of your history with power, approval, and whether you felt free to be yourself around them.`,
        `There’s something about ${mc} that your dreaming mind needed to revisit. They may not represent the person exactly — more likely, they’re standing in for a whole pattern of how you relate to authority, judgment, or the need to be seen as capable.`,
      ] as const;
      sections.push(pickVariant(authRelVariants, seed, 3));
    } else if (primaryPattern === 'connection') {
      const connectRelVariants = [
        `${capitalize(mc)} being part of this dream gives the longing a face. Whether the connection felt warm or incomplete, what you felt in their presence says something about what closeness means to you right now.`,
        `The fact that ${mc} was there changes the texture of this dream. It’s not abstract longing — it’s something about this specific relationship, or the kind of connection they represent, that your dreaming mind wanted to spend time with.`,
        `${capitalize(mc)} seems to embody something your heart is reaching for right now. The dream may be less about the person and more about the quality of connection they bring — and whether you’re getting enough of it.`,
      ] as const;
      sections.push(pickVariant(connectRelVariants, seed, 3));
    } else if (personMatch) {
      // Generic character interpretation through the pattern lens
      const genericRelVariants = [
        `${capitalize(mc)} showing up in this dream adds something personal to what might otherwise feel abstract. Your dreaming mind chose them for a reason — not necessarily because of who they are, but because of the feelings and history they carry.`,
        `With ${mc} in the scene, the dream becomes less about concepts and more about relationships. Whatever they represent in your inner world — safety, unfinished business, comfort, tension — is probably part of what the dream is working through.`,
        `The presence of ${mc} grounds this dream in something real. They may not represent themselves literally, but the emotions tied to them — the history, the dynamics — are very much part of what’s being processed here.`,
      ] as const;
      sections.push(pickVariant(genericRelVariants, seed, 3));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. EMOTIONAL LANDSCAPE — Weave emotions naturally into the narrative
  // ═══════════════════════════════════════════════════════════════════════════

  {
    const allEmotions = [...features.emotionsExplicit, ...features.emotionsInferred];
    const uniqueEmotions = [...new Set(allEmotions)].slice(0, 4);

    if (contradictions.length > 0) {
      // Lead with the emotional contradiction — this is the deepest insight
      const c = contradictions[0];
      const contradictionVariants = [
        `Here’s what makes this dream interesting: you felt both ${c.poleA} and ${c.poleB}, and your mind didn’t try to pick one. Dreams do this when a feeling is too layered for a simple label — when the honest answer is "both." That doesn’t mean you’re confused. It means you’re processing something real.`,
        `The tension between ${c.poleA} and ${c.poleB} in this dream is worth noticing. Most of the time, we pressure ourselves to feel one thing at a time — but your dreaming mind let both exist side by side, which usually happens when something genuinely complex is being worked through.`,
        `There’s a push-pull between ${c.poleA} and ${c.poleB} in this dream that your waking mind might try to smooth over. But the dream didn’t. It held both feelings at once, which is often how the mind processes experiences that don’t fit neatly into boxes.`,
        `You were feeling ${c.poleA} and ${c.poleB} at the same time, which might sound contradictory — but it’s actually one of the most honest things a dream can do. It means the experience it’s processing has more than one side, and your mind isn’t rushing to simplify it.`,
      ] as const;
      sections.push(pickVariant(contradictionVariants, seed, 4));
    } else if (uniqueEmotions.length >= 2) {
      // Multiple emotions — narrate them in context
      const emotionList = uniqueEmotions.map(e => e.toLowerCase());
      const multiEmotionVariants = [
        `The feelings of ${emotionList.slice(0, -1).join(', ')} and ${emotionList[emotionList.length - 1]} didn’t arrive separately — they were braided together, and that blend matters. It suggests your mind was sitting with something that doesn’t have a simple emotional label, the kind of thing that takes more than one feeling to hold.`,
        `You can feel the emotional range in this dream: ${emotionList.join(', ')}. That combination doesn’t mean anything went wrong — it means whatever your mind was processing has real depth to it, the kind of depth that one emotion alone can’t capture.`,
        `The ${emotionList.join(' and ')} woven through this dream suggest you were working through something that matters. When feelings show up in clusters like this, it’s usually a sign that the experience underneath them is rich and layered rather than simple.`,
      ] as const;
      sections.push(pickVariant(multiEmotionVariants, seed, 4));
    } else if (uniqueEmotions.length === 1) {
      const soloEmotionVariants = [
        `The ${uniqueEmotions[0].toLowerCase()} running through this dream wasn’t just background noise — it was the whole atmosphere. That single, steady feeling is usually the thing your inner world most needs you to notice.`,
        `${uniqueEmotions[0]} colored everything in this dream, and it’s worth paying attention to. When one feeling dominates that completely, it’s often pointing to something your mind is actively sitting with in waking life too.`,
        `Everything in this dream seems to circle back to ${uniqueEmotions[0].toLowerCase()}. That kind of emotional clarity — one feeling holding the whole dream together — usually means it’s something your mind really wants you to acknowledge.`,
      ] as const;
      sections.push(pickVariant(soloEmotionVariants, seed, 4));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. UNRESOLVED TENSION — Ending analysis + psychological theme
  // ═══════════════════════════════════════════════════════════════════════════

  sections.push(ending.meaning);

  // If high distress, add a gentle somatic close
  if (aggregates.activationScore === 'high' && aggregates.valenceScore <= -0.3) {
    const somaticVariants = [
      'If your body is still holding any of that tension, a few slow breaths can help — just enough to remind yourself you’re here now, not there.',
      'If any of that intensity is still lingering in your body, try placing a hand on your chest and breathing slowly. It helps your nervous system catch up to the fact that the dream is over.',
      'Dreams this intense can leave a physical echo. If you notice tightness or restlessness, a few deep breaths can gently close the door on what surfaced.',
    ] as const;
    sections.push(pickVariant(somaticVariants, seed, 5));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. REFLECTION QUESTION — One elegant question from the pattern
  // ═══════════════════════════════════════════════════════════════════════════

  const questions = PATTERN_QUESTIONS[primaryPattern];
  const reflectionQuestion = pickVariant(questions, seed, 6);

  // ── Build the undercurrent label ──
  const undercurrentLabel = buildUndercurrentLabel(primaryPattern, contradictions);

  return {
    narrative: sections.join('\n\n'),
    undercurrentLabel,
    reflectionQuestion,
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Run the full Dream Pattern Engine pipeline.
 *
 * Input: dream text, keyword matches, feelings, metadata, aggregates.
 * Output: full PatternDreamAnalysis with narrative, patterns, contradictions, and more.
 *
 * Uses adaptive confidence gating:
 *   - Composite confidence blends raw score, separation from runner-up,
 *     and feature density (how much evidence the dream provided).
 *   - Base threshold: 0.25 (pattern must clear this minimum).
 *   - Short dreams (<80 chars) need higher confidence (0.35) since
 *     sparse text produces unreliable feature extraction.
 *   - Minimum 2 extracted features required to avoid scoring noise
 *     on dreams that contain almost no analyzable content.
 *
 * Returns null when confidence is insufficient, so the caller can
 * fall back to the existing interpretation engine.
 */
export function analyzeDreamPattern(
  dreamText: string,
  keywordMatches: KeywordMatch[],
  feelings: SelectedFeeling[],
  metadata: DreamMetadata,
  aggregates: DreamAggregates,
  seed: number,
): PatternDreamAnalysis | null {
  // 1. Feature extraction
  const features = extractDreamFeatures(dreamText, keywordMatches, feelings, metadata, aggregates);

  // ── Minimum evidence gate ───────────────────────────────────────────────
  // If the dream text produced almost nothing to analyze, the pattern
  // engine can't do meaningful work. Fall back early.
  const totalFeatures =
    features.settings.length +
    features.characters.length +
    features.actions.length +
    features.tensionThemes.length +
    features.socialContext.length +
    features.intimacyThemes.length +
    features.authorityThemes.length +
    features.privacyThemes.length +
    features.safetyThemes.length;
  if (totalFeatures < 2) return null;

  // 2. Pattern scoring
  const patternResult = scoreDreamPatterns(features);

  // 3. Adaptive confidence gate
  // Short dreams need higher confidence because sparse text produces
  // less reliable feature extraction.
  const threshold = dreamText.length < 80 ? 0.35 : 0.25;
  if (patternResult.confidence < threshold) return null;

  // 4. Emotional contradiction detection
  const contradictions = detectEmotionalContradictions(feelings, features.emotionsInferred);

  // 5. Ending analysis
  const ending = analyzeEnding(features.endingType, seed);

  // 6. Narrative generation
  const { narrative, undercurrentLabel, reflectionQuestion } = generatePatternNarrative(
    dreamText,
    features,
    patternResult,
    contradictions,
    ending,
    keywordMatches,
    aggregates,
    seed,
  );

  return {
    primaryPattern: patternResult.primaryPattern,
    secondaryPatterns: patternResult.secondaryPatterns,
    confidence: patternResult.confidence,
    features,
    emotionalContradictions: contradictions,
    endingAnalysis: ending,
    undercurrentLabel,
    reflectionQuestion,
    narrative,
  };
}
