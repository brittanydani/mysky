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
    public: /\b(mall|store|restaurant|airport|train|bus|crowd|street|market|park|arena|stadium|venue|concert|theater|theatre|auditorium|gymnasium|gym|bleachers|grandstand|basketball|football|baseball|soccer|hockey|sports|game|event|pavilion|fairground)\b/i,
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
    crowd_pressure: /\b(crowd(ed|ing)?|too (loud|busy|much)|overstimulat(ed|ing)|surrounded|couldn'?t (leave|breathe|focus|relax|settle)|expected to|supposed to (enjoy|be happy|have fun|like it)|felt out of place|didn'?t belong|everyone (else|around|seemed)|felt (wrong|off|disconnected|distant|hollow)|wanted to (leave|go|escape|get out)|had to (stay|be there|act|pretend))\b/i,
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

  // Check escape BEFORE resolved — "escaped" and "got away" are escape cues,
  // not resolution cues, especially with a relieved awaken state.
  if (/\b(ran away|got out|escaped|fled|managed to leave|got away)\b/i.test(lower) && metadata.awakenState === 'relieved') {
    return 'escape';
  }
  if (/\b(woke up (suddenly|startled|scared|panicking)|jolted awake|snapped out)\b/i.test(lower)) {
    return 'abrupt';
  }
  if (/\b(faced|confronted|stood up|fought back|spoke up|told them)\b/i.test(lower)) {
    return 'confrontation';
  }
  // Resolution cues — without escape-specific words that belong above
  if (/\b(resolved|figured out|understood|realized|finally|made it|woke up relieved)\b/i.test(lower)) {
    return 'resolved';
  }

  // Infer from awaken state
  if (metadata.awakenState === 'relieved') return 'relief';
  if (metadata.awakenState === 'shaken' || metadata.awakenState === 'scared') return 'abrupt';
  if (metadata.awakenState === 'confused' || metadata.awakenState === 'unsettled' || metadata.awakenState === 'anxious' || metadata.awakenState === 'disturbed' || metadata.awakenState === 'overwhelmed') return 'unresolved';

  // Only default to unresolved when other unresolved evidence is present —
  // many dreams end clearly without explicit narrative transition words.
  const hasUnresolvedEvidence =
    /\b(searching|stuck|confused|can'?t find|lost|trapped|going in circles)\b/i.test(lower);
  if (hasUnresolvedEvidence) {
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
    emotions: ['Exposed', 'Ashamed', 'Embarrassed', 'Humiliated', 'Vulnerable', 'ashamed', 'vulnerable', 'Overwhelmed', 'Uneasy', 'Anxious', 'Uncomfortable', 'Awkward', 'Disconnected'],
    tensions: ['exposure', 'crowd_pressure'],
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
    settings: ['house', 'dark', 'public'],
    characters: [],
    emotions: ['Frustrated', 'Overwhelmed', 'Exhausted', 'Trapped', 'Helpless', 'Uneasy', 'Anxious'],
    tensions: ['repetition', 'powerlessness', 'crowd_pressure'],
    socialContext: ['public'],
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

// ─── Canonical Emotion Buckets ────────────────────────────────────────────────

/**
 * Map diverse emotion labels to canonical buckets so that synonym differences
 * between FEELING_MAP labels, inferred emotions, and pattern rule lists
 * don't silently break scoring.
 */
const EMOTION_BUCKETS: Record<string, string[]> = {
  shame: ['ashamed', 'embarrassed', 'humiliated', 'mortified', 'exposed', 'disgraced'],
  fear: ['afraid', 'scared', 'terrified', 'alarmed', 'panicked', 'frightened', 'fearful'],
  anger: ['angry', 'furious', 'enraged', 'irritated', 'resentful', 'frustrated', 'mad'],
  longing: ['yearning', 'nostalgic', 'missing', 'aching', 'homesick', 'longing', 'bittersweet'],
  sadness: ['sad', 'grief', 'grieving', 'mourning', 'heartbroken', 'sorrow'],
  anxiety: ['anxious', 'stressed', 'uneasy', 'pressured', 'overwhelmed', 'nervous', 'worried'],
  vulnerability: ['vulnerable', 'exposed', 'unprotected', 'open', 'defenseless'],
  curiosity: ['curious', 'intrigued', 'fascinated', 'wondering', 'drawn'],
  relief: ['relieved', 'calm', 'peaceful', 'at ease', 'comforted'],
  confusion: ['confused', 'disoriented', 'bewildered', 'puzzled', 'lost', 'uncertain'],
  tenderness: ['tender', 'loving', 'caring', 'affectionate', 'warm', 'protective'],
  powerlessness: ['helpless', 'powerless', 'trapped', 'stuck', 'frozen', 'paralyzed'],
  excitement: ['excited', 'thrilled', 'electrified', 'awed', 'exhilarated'],
  disconnection: ['disconnected', 'distant', 'hollow', 'numb', 'detached', 'removed'],
  awkwardness: ['awkward', 'uncomfortable', 'out of place'],
};

/** Pre-built reverse lookup: lowercase label → canonical bucket name */
const LABEL_TO_BUCKET: Map<string, string> = new Map();
for (const [bucket, labels] of Object.entries(EMOTION_BUCKETS)) {
  for (const label of labels) {
    LABEL_TO_BUCKET.set(label.toLowerCase(), bucket);
  }
}

/** Resolve an emotion label to its canonical bucket name, or return it lowercased. */
function canonicalEmotion(label: string): string {
  return LABEL_TO_BUCKET.get(label.toLowerCase()) ?? label.toLowerCase();
}

/**
 * Count how many items from `needles` appear in `haystack` (case-insensitive).
 * When `useEmotionBuckets` is true, both sides are normalized to canonical
 * emotion buckets before comparison so that synonyms match correctly.
 */
function countOverlap(haystack: string[], needles: string[], useEmotionBuckets = false): number {
  if (needles.length === 0) return 0;
  if (useEmotionBuckets) {
    const haystackBuckets = new Set(haystack.map(canonicalEmotion));
    const needleBuckets = new Set(needles.map(canonicalEmotion));
    let count = 0;
    for (const b of needleBuckets) {
      if (haystackBuckets.has(b)) count++;
    }
    return count;
  }
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

    // Emotions — use canonical buckets so synonyms match
    if (rule.emotions.length > 0) {
      const hits = countOverlap(allEmotions, rule.emotions, true);
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

  // Composite confidence: feature density acts as a multiplier/cap, not
  // independent additive fuel. Dense dreams support confidence but can't
  // inflate it when pattern fit is weak.
  const evidenceFactor = 0.7 + 0.3 * featureDensity;
  const confidence = (0.55 * primary.score + 0.45 * separation) * evidenceFactor;

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

      const intensity = Math.min(1, ((aIntensity || 1) + (bIntensity || 1)) / 10);

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
    'Your dream let itself finish — not perfectly, not neatly, but it found a kind of landing. That willingness to resolve, even loosely, usually means some quiet part of you has already made peace with something your waking mind is still catching up to.',
    'There’s a settling at the end of this dream, like a breath you didn’t realize you were holding finally letting go. The answers aren’t clear yet — but something inside you has shifted, and the dream knew it before you did.',
    'The way this dream closed itself carries a quiet weight. Something resolved — not dramatically, but in that slow, honest way things settle when you stop forcing them. You might be further through this than you think.',
  ],
  unresolved: [
    'This dream didn’t give you an ending, and that’s not a flaw — it’s the truest thing about it. Whatever lives underneath this hasn’t found its shape yet. The dream is honoring that by refusing to pretend otherwise.',
    'Notice how the dream just… left you there. That open-endedness isn’t emptiness — it’s your mind still circling something it can’t quite name, still running its fingers along the edges of a feeling that hasn’t fully landed.',
    'If you woke up feeling like something was left mid-sentence, trust that instinct. The dream isn’t broken — it’s being honest about where you are. Some things need to stay unfinished a little longer before they’re ready to be understood.',
  ],
  abrupt: [
    'The dream pulled the plug on itself, and that sudden silence probably still echoes. Something surfaced that was too close, too real, too charged — and your mind decided mid-sentence that you’d gone far enough for one night.',
    'Pay attention to what was happening right before everything cut out. That’s where the heat is — the exact moment your deeper mind reached something it wasn’t quite ready to hold. The abruptness isn’t random. It’s a boundary your psyche drew in real time.',
    'Your nervous system has its own sense of timing, and it decided this dream had gone far enough. That cutoff point — that exact frozen frame where everything stopped — is probably the most honest image the whole dream produced.',
  ],
  escape: [
    'You found the exit. Whether you ran, flew, or simply vanished from the scene, something in you said enough — and meant it. That kind of escape often marks the moment a part of you stops tolerating something it used to endure.',
    'Your dreaming mind did something interesting — it let you leave. Not everyone’s dreams do that. The fact that yours built a door and pushed you through it says something about readiness, about a growing refusal to stay in spaces that no longer fit.',
  ],
  relief: [
    'That wave of relief when you woke? That’s the feeling of your mind completing a circuit — working all the way through something heavy and coming out intact on the other side. Your body knows the difference between surviving something and merely dreaming it, and right now it’s settling into that distinction.',
    'The relief isn’t a sign the dream didn’t matter — it’s proof that it did. Something real was processed, metabolized, moved through. You carried it while you slept so you wouldn’t have to carry it into the day.',
  ],
  confrontation: [
    'Instead of flinching, this dream leaned in. That shift toward confrontation — toward facing something rather than circling it — usually signals that a part of you has grown tired of accommodation. Something inside you is ready to meet what it’s been avoiding.',
    'Your mind rehearsed a version of courage while you slept. The confrontation may have felt jarring, but it’s the psyche’s way of practicing — testing whether you’re ready to stand somewhere you’ve previously only imagined standing.',
  ],
  unknown: [
    'The ending slipped away before you could name it — and maybe that’s the point. Sometimes a dream doesn’t want to be resolved. It wants to be remembered. Whatever fragment still echoes is probably the part worth keeping.',
    'Don’t chase the ending. Chase the feeling that’s still sitting in your chest. That’s where the dream lives now.',
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
    'Where in your life have you felt expected to enjoy something that actually left you feeling disconnected, overwhelmed, or out of place?',
    'What part of you knows when an environment looks fine from the outside but feels wrong on the inside?',
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
    'There’s a moment — you probably know it — when you suddenly realize the thing you thought was hidden is visible to everyone in the room. This dream lives in that moment. Not the embarrassment itself, but the sickening split-second before it, when the walls dissolve and you haven’t decided yet who you are without them.',
    'Something private is pushing toward the surface, and this dream is the pressure it creates on the way up. Less about being seen and more about the ache of the gap — that widening space between the face you wear outward and the thing you carry alone.',
    'The vulnerability here goes deeper than the images. It’s the particular rawness of being made visible on someone else’s terms — of having your privacy peeled away not by your own hand, but by circumstance, or worse, by someone who didn’t ask.',
    'This dream holds a very specific kind of aloneness — the kind that happens in the middle of everything. All that noise, all that energy, and yet you’re somewhere else entirely. That gap between the life happening around you and the silence inside you is what the dream is actually about.',
    'Surrounded by everything, connected to nothing. The crowd, the sound, the motion — it was all there, and you were watching it from behind glass. That disconnection isn’t about introversion or mood. It’s about the distance between how a life looks from the outside and how it actually registers when you’re the one living it.',
    'There’s a particular hollowness in this dream that’s hard to explain to anyone who hasn’t felt it — being in the center of something and still somehow outside of it. It’s the loneliness of performing presence, of being somewhere in body while something essential in you stays home.',
  ],
  boundary: [
    'There’s an old question buried in this dream, one you may already be circling in daylight: where do I end and where does someone else begin? The line between closeness and invasion is thinner than most people admit, and your dreaming mind is walking that edge.',
    'The pull in this dream runs in two directions at once — toward openness and toward self-preservation. These kinds of dreams tend not to arrive during crisis. They arrive during the quieter negotiations, when you’re silently redrawing the lines of what you’ll let in and what you won’t.',
    'This one is about the geography of closeness — who’s allowed where, and what happens when someone steps past a line you didn’t even know you’d drawn. It’s the kind of tension that stays invisible during the day and turns architectural at night.',
  ],
  authority: [
    'There’s an old power structure running through this dream, and it probably didn’t need to introduce itself — you recognized it immediately. But the real tension isn’t about whoever held the authority. It’s about the version of you who’s quietly deciding whether you’re still willing to be smaller than you are.',
    'Someone else held the power in this dream, and you could feel it in your posture, in your voice, in the space you allowed yourself to take up. The tension between wanting to be approved of and wanting to be free of needing it rarely belongs to one person. It belongs to every version of yourself that ever shrank to fit someone else’s expectations.',
    'The dream is pressing on a nerve between obedience and instinct — between what you’ve been taught to do and what your gut already knows. The authority figure isn’t really the point. The point is the part of you that’s starting to believe your own voice matters more.',
  ],
  pursuit: [
    'The body remembers this dream. The pounding heart, the legs that wouldn’t move fast enough, the certainty that something was closing the distance. What’s chasing you almost never has a face, because it isn’t a person — it’s the feeling, the conversation, the recognition you’ve been outrunning in daylight.',
    'Your mind built an entire chase scene just to show you what urgency feels like from the inside. That adrenaline wasn’t random — it belongs to something that’s been building pressure quietly, patiently, waiting for you to turn around and finally look at it.',
    'Something in this dream wanted to be faced, and you chose to run. That’s not weakness — it’s honest. It tells you exactly where your threshold is right now. But the thing behind you already knows your pace, and it has no intention of giving up.',
  ],
  lost: [
    'Being lost is its own frequency of discomfort — not pain, not quite fear, but the hollowing realization that the ground you thought was solid turns out to be unfamiliar. This dream mirrors the same vertigo that lives in uncharted territory — a decision unmade, a path dissolving underfoot, the strange hush between one chapter and the next.',
    'Your dreaming mind stripped away every landmark and left you standing in the unknown. That disorientation wasn’t cruelty — it was accuracy. Something in your waking life has genuinely lost its map, and the dream is showing you what that uncertainty actually looks like when you stop pretending you know where you’re going.',
    'The landscape isn’t the thing that’s lost — you are. Not in a dramatic way, but in the quiet, disorienting way of not quite knowing where you stand anymore. In a relationship, in your work, in your own sense of who you’re becoming. That kind of lostness doesn’t need solving. It needs sitting with.',
  ],
  performance: [
    'You can still feel the weight of it — the eyes, the expectation, the impossible arithmetic of performing well enough to be safe. The test was never really the test. It was the question underneath: what are you worth if you stumble? That’s the real exam this dream is running.',
    'Your dream recreated that exact moment — the one where confidence evaporates and every pair of eyes becomes a verdict. The loop it’s replaying isn’t really about ability. It’s about the terrifying possibility that who you are, stripped of achievement, might not be enough.',
    'Performance dreams are surgically precise — they bypass every defense and go straight for the identity. Your mind isn’t interested in whether you can pass the test. It’s interested in who you become in the moment you believe you might fail.',
  ],
  connection: [
    'Something in this dream was reaching — across a room, across years, across the distance between how close you are to someone and how close you wish you were. The dream isn’t about the person exactly. It’s about the shape of the space they’d fill if they were here the way you need them to be.',
    'There’s an ache in this dream that doesn’t announce itself — it just sits there, steady and warm and impossible to ignore. The longing to be understood. To be met, truly met, by someone who doesn’t need you to translate yourself. That feeling buries itself during the day, but your dreams know exactly where to dig.',
    'Something between you and someone else remains unfinished — a sentence that never got said, a goodbye that didn’t hold enough, or a closeness you pretend you’ve made peace with losing. This dream isn’t rushing you. It’s just holding the door open to what you haven’t let yourself feel yet.',
  ],
  conflict: [
    'There’s heat in this dream — the kind that builds behind closed teeth and swallowed words. Your waking self may be diplomatic, patient, measured. But your dreaming self lit a match, because something in you has been waiting too long for its turn to speak.',
    'The collision in this dream didn’t come from nowhere. It’s the echo of something that’s been simmering — a boundary that was crossed and never addressed, a frustration that got swallowed instead of spoken, a part of you that’s been keeping the peace at its own expense.',
    'The fight in this dream isn’t really about the other person. It’s about you — specifically, the version of you that’s done contorting to fit a shape someone else designed. Something in you is rehearsing what it looks like to stop accommodating and start taking up space.',
  ],
  caretaking: [
    'You were the protector in this dream, and some part of you probably slipped into that role as naturally as breathing. But the dream is asking a harder question than whether you care. It’s asking who holds you when your arms are full of everyone else.',
    'The weight of responsibility in this dream runs deeper than obligation — it feels almost like identity. There may be a pattern here worth examining: the one where your value quietly becomes inseparable from how well you hold other people together, as if your own needs are a luxury you haven’t earned.',
    'The person you were protecting might be someone you know, or they might be a younger, softer part of yourself that still needs sheltering. Either way, the dream is quietly pointing at the price tag — the one you never look at, attached to every time you choose someone else’s needs over your own.',
  ],
  transformation: [
    'Something is shedding its skin in this dream — maybe the world, maybe you. Transformation announces itself with a feeling that lives exactly between terror and awe, and that’s probably what you felt. These dreams arrive at thresholds, in the hallway between who you’ve been and who you haven’t yet allowed yourself to become.',
    'Your dreaming mind is rehearsing a metamorphosis. There’s an ending somewhere in this dream, and a beginning trying to form on the other side of it, and you’re standing in the disorienting space where both exist at once — no longer who you were, not yet who you’ll be.',
    'This dream has a fault line running through it — a before and an after. Something familiar is dissolving, and something unnamed is taking its place. The grief and the excitement are arriving in the same breath, because that’s how real change always feels.',
  ],
  house_self: [
    'Your mind built you a house, and then it watched where you wandered. In dreams like this, every room is an interior you carry — some lived in, some locked, some you forgot existed. Whatever door caught your attention is probably the part of yourself that’s been knocking from the other side.',
    'Your inner world became architecture while you slept. The rooms you recognized are the parts of yourself you visit often — the habits, the identity, the comfortable self. But the rooms that unsettled you, the hallways that felt too long? Those are the unopened letters from yourself.',
    'A house dream is your psyche’s self-portrait, rendered in walls and doorways. It’s mapping you — which parts feel like home, which have gone cold from disuse, and which are quietly renovating themselves in the dark, preparing to be lived in again.',
  ],
  stuck: [
    'The dream gave you the physical sensation of going nowhere, and that’s because something in your life is doing exactly that. A loop. A holding pattern. Your waking mind keeps pushing forward, but your dreaming mind pulled back the curtain and showed you the treadmill underneath.',
    'The repetition isn’t a malfunction — it’s a mirror. There’s something your mind keeps returning to, some unresolved gravity that pulls you back before you can get clear. The dream isn’t asking you to push harder. It’s asking you to look down and see what your feet are stuck in.',
    'Few things are more maddening than effort without movement, and your dream rendered that frustration perfectly. But the loop isn’t punishment — it’s persistence. Something unresolved keeps circling back, again and again, because it’s not done with you yet.',
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
  const { primaryPattern, secondaryPatterns, confidence } = patternResult;

  // Confidence-aware tone helpers — vary certainty of language by band
  const toneVerb = confidence >= 0.65 ? 'seems to be' : confidence >= 0.45 ? 'may be' : 'could be';
  const toneAdverb = confidence >= 0.65 ? '' : confidence >= 0.45 ? 'possibly ' : 'perhaps ';
  const toneQualifier = confidence >= 0.65
    ? 'and that thread runs clearly through the experience'
    : confidence >= 0.45
      ? 'though the thread is still taking shape'
      : 'though this is one of several possible readings';

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
        `Your dream placed you ${settingPhrase}${characterPhrase}, and something about that scene is probably still with you — a residue the waking mind can’t quite wash off. The ${atmosphereWord} quality of it wasn’t accidental — there ${toneVerb} a thread of ${patternLabel.toLowerCase()} running through the experience, ${toneQualifier}.`,
        `There’s a reason this dream chose ${settingPhrase.replace('in a ', 'a ')} as its stage${characterPhrase}. The atmosphere felt ${atmosphereWord}, and underneath the surface details, it ${toneVerb} ${toneAdverb}working through something about ${patternLabel.toLowerCase()}.`,
        `This dream unfolded ${settingPhrase}${characterPhrase} — and the ${atmosphereWord} quality of the whole thing isn’t decoration — it’s information. More than any single detail, the dream as a whole ${toneVerb} ${toneAdverb}sitting with ${patternLabel.toLowerCase()}.`,
        `Something about being ${settingPhrase}${characterPhrase} clearly stayed with you. The ${atmosphereWord} feeling that came with it ${toneAdverb}points to something deeper — what ${confidence >= 0.65 ? 'looks like' : 'might be'} ${patternLabel.toLowerCase()} woven through the experience.`,
      ] as const;
      sections.push(pickVariant(overviewVariants, seed, 1));
    } else {
      const noSettingVariants = [
        `The setting may have been vague, but the feeling wasn’t. This dream carries a ${atmosphereWord} emotional weight that clings to you after waking. What comes through most clearly is ${confidence >= 0.65 ? 'a sense of' : 'what might be'} ${patternLabel.toLowerCase()} — the kind of thing that lingers after waking.`,
        `The images blur, but the feeling stays sharp. There ${toneVerb} a thread of ${patternLabel.toLowerCase()} running through this dream, and the ${atmosphereWord} quality of it suggests your inner world was working on something that matters.`,
        `The most interesting thing about this dream isn’t what you saw — it’s what you felt. Something about ${patternLabel.toLowerCase()} ${toneVerb} at the center, even if the dream didn’t hand you a neat storyline to go with it.`,
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
        `The fact that it unfolded in a ${placeLabel} adds a specific emotional texture. These spaces tend to carry associations with ${placeMeaning}, which sharpens what the dream was really exploring.`,
        `And the ${placeLabel} isn’t just scenery — it’s emotionally loaded. It’s the kind of space that tends to hold feelings of ${placeMeaning}, which makes this dream feel less abstract and more like it’s pointing at something specific.`,
        `Placing this in a ${placeLabel} — a space woven with ${placeMeaning} — gives the dream a specificity that makes the vulnerability feel less theoretical and more like something you’ve actually lived.`,
      ] as const;
      explanation += ' ' + pickVariant(placeContextVariants, seed, 21);
    }

    // If secondary patterns are present, weave them in
    if (secondaryPatterns.length > 0) {
      const secondaryLabels = secondaryPatterns.map(p => PATTERN_DISPLAY_LABELS[p].toLowerCase());
      if (secondaryLabels.length === 1) {
        explanation += ` There’s also a quieter thread of ${secondaryLabels[0]} moving underneath — not the dominant note, but persistent enough to give the dream a second dimension, a depth the primary pattern alone can’t explain.`;
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
        `Having ${mc} there changes everything. In a dream about vulnerability, a familiar face isn’t a casting choice — it’s an emotional coordinate. The dream isn’t asking what you think of them. It’s asking what happens to you in the space between.`,
        `${capitalize(mc)} didn’t wander into this dream by accident. Their presence activates something specific — the unspoken contract between you about what’s allowed, what’s hidden, and how much of yourself you can safely reveal in their orbit.`,
        `${capitalize(mc)} being in this dream adds a layer that doesn’t have simple answers. It’s less about who they are and more about what proximity to them does to you — who you become, what you protect, and what you involuntarily reveal when your guard comes down.`,
      ] as const;
      sections.push(pickVariant(boundaryRelVariants, seed, 3));
    } else if (primaryPattern === 'authority' && isAuthority) {
      const authRelVariants = [
        `${capitalize(mc)} showing up here isn’t a coincidence. ${isFamily ? 'Family figures' : 'Authority figures'} in dreams rarely mean exactly what they seem — they tend to carry the full weight of your history with power, approval, and whether you felt free to be yourself around them.`,
        `There’s something about ${mc} that your dreaming mind needed to revisit. They may not represent the actual person so much as the shape they left on you — a whole pattern of how you stand in the presence of judgment, how you hold yourself when someone else decides whether you’re enough.`,
      ] as const;
      sections.push(pickVariant(authRelVariants, seed, 3));
    } else if (primaryPattern === 'connection') {
      const connectRelVariants = [
        `${capitalize(mc)} being in this dream turns abstract longing into something you can almost touch. What you felt in their presence — the warmth, the incompleteness, the distance that somehow still ached — says more about what your heart is really asking for than any waking thought could.`,
        `${capitalize(mc)} being there changes everything about this dream. The longing stops being theoretical and becomes specific — tethered to a real face, a real history, a particular quality of closeness your dreaming mind isn’t ready to let go of.`,
        `${capitalize(mc)} seems to carry something your heart recognizes and reaches for. The dream may be less about the person and more about the particular flavor of being known, being held, being met — and the quiet hunger when that flavor goes missing from your days.`,
      ] as const;
      sections.push(pickVariant(connectRelVariants, seed, 3));
    } else if (personMatch) {
      // Generic character interpretation through the pattern lens
      const genericRelVariants = [
        `${capitalize(mc)} showing up in this dream pulls the whole experience out of abstraction and into something personal. Your dreaming mind cast them deliberately — not for who they are on the surface, but for the emotional weight they carry in your inner world.`,
        `With ${mc} in the scene, the dream shifts from metaphor to memory. Whatever they represent in your interior — safety, unfinished business, the particular ache of a certain kind of closeness — is woven into everything the dream was trying to process.`,
        `The presence of ${mc} anchors this dream to something lived and felt. They may not represent themselves literally, but the emotional residue they carry in you — the history, the unresolved notes, the particular way they make you feel — is threaded through everything that happened here.`,
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
        `Here’s what makes this dream worth paying attention to: you felt both ${c.poleA} and ${c.poleB}, and your dreaming mind didn’t try to resolve the contradiction. It let both exist. That’s rare — in waking life we’re always pressured to pick a lane. But the dream knows the honest answer is both, and it’s not afraid of that.`,
        `${capitalize(c.poleA)} and ${c.poleB} don’t usually share a room — but in this dream, they did. That tension is worth noticing, because it means whatever your mind is processing is too layered to flatten into a single feeling. The dream is holding complexity your waking mind might try to simplify.`,
        `There’s a pull between ${c.poleA} and ${c.poleB} in this dream that your waking mind would probably try to smooth over. But the dream refused to choose. It held the contradiction open, the way you’d hold a wound open to let it breathe. That’s not confusion — that’s courage.`,
        `${capitalize(c.poleA)} and ${c.poleB} at the same time — it sounds impossible, but it’s actually one of the most honest states a dream can produce. It means whatever you’re processing has real depth, real texture, and your mind respects it enough not to flatten it into something easier to carry.`,
      ] as const;
      sections.push(pickVariant(contradictionVariants, seed, 4));
    } else if (uniqueEmotions.length >= 2) {
      // Multiple emotions — narrate them in context
      const emotionList = uniqueEmotions.map(e => e.toLowerCase());
      const multiEmotionVariants = [
        `The feelings of ${emotionList.slice(0, -1).join(', ')} and ${emotionList[emotionList.length - 1]} didn’t arrive separately — they bled into each other, the way colors do in water. That’s not emotional noise. It’s your dreaming mind refusing to simplify something your waking mind keeps trying to file under one label. The truth of what you’re carrying needs all of them at once.`,
        `You can feel the emotional range in this dream: ${emotionList.join(', ')}. That combination is a fingerprint — no one else would dream this exact emotional chord. Whatever you’re processing lives at the intersection of all of them, in a place no single feeling can reach alone. The dream didn’t simplify it because it can’t be simplified.`,
        `The ${emotionList.join(' and ')} woven through this dream suggest your dreaming mind was holding something the size of a whole season of your life — not a single event, but a current running underneath everything. When this many feelings converge in one dream, it’s because what you’re processing is too alive, too real, too yours to reduce to just one.`,
      ] as const;
      sections.push(pickVariant(multiEmotionVariants, seed, 4));
    } else if (uniqueEmotions.length === 1) {
      const soloEmotionVariants = [
        `The ${uniqueEmotions[0].toLowerCase()} in this dream wasn’t background noise — it was the entire weather system. When a single emotion saturates a dream this completely, it’s usually the one feeling your waking mind has been holding at arm’s length. The dream brought it close.`,
        `${uniqueEmotions[0]} colored everything in this dream — every image, every interaction, every transition. When one feeling dominates that completely, it’s not a mood. It’s a message. Something in your waking life is carrying this same frequency, and the dream is turning up the volume so you’ll finally hear it.`,
        `Everything in this dream circles back to ${uniqueEmotions[0].toLowerCase()}, like a gravitational center the whole experience orbits. That kind of emotional singularity — one feeling holding an entire dream in its gravity — usually means your mind has decided this is the thing that needs acknowledging, whether you’re ready for it or not.`,
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
      'If your body is still holding any of that — a tightness in the chest, a restlessness in the limbs — a few slow breaths can help bridge you back. You’re here now. The dream is behind you.',
      'If any of that intensity is still humming in your body, try placing a hand on your chest and breathing slowly. Your nervous system sometimes needs a physical signal that the dream is over — that you made it through.',
      'Dreams this vivid leave traces in the body. If you notice tension, heaviness, or a restlessness you can’t quite name, a few deep breaths can help close the circuit — letting your body know it’s safe to set the dream down.',
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
  // Emotional features count at half weight — a dream can be short but
  // emotionally rich and still deserve pattern analysis.
  const structuralFeatures =
    features.settings.length +
    features.characters.length +
    features.actions.length +
    features.tensionThemes.length +
    features.socialContext.length +
    features.intimacyThemes.length +
    features.authorityThemes.length +
    features.privacyThemes.length +
    features.safetyThemes.length;
  const emotionalFeatures =
    features.emotionsExplicit.length +
    features.emotionsInferred.length;
  const totalEvidence = structuralFeatures + emotionalFeatures * 0.5;
  if (totalEvidence < 2) return null;

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
