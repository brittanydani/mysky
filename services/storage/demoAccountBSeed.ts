/**
 * demoAccountBSeed.ts
 *
 * Data-driven seed source for Account B:
 *   brithornick92@gmail.com
 *
 * This is intentionally separate from the generic/reviewer seed file so
 * Account B can feel fully lived in and emotionally specific.
 */

export type DemoEnergy = 'low' | 'medium' | 'high';
export type DemoStress = 'low' | 'medium' | 'high';
export type DemoMoodLabel = 'calm' | 'soft' | 'okay' | 'heavy' | 'stormy';

export type DreamFeeling = {
  id: string;
  intensity: number; // 1-5
};

export type DreamMetadata = {
  vividness: number;
  lucidity: number;
  controlLevel: number;
  overallTheme: string;
  awakenState: string;
  recurring: boolean;
};

export type DailyEntrySeed = {
  day: number;
  date: string; // YYYY-MM-DD
  promptResponse: string;
  morningMood: number;
  morningEnergy: DemoEnergy;
  morningStress: DemoStress;
  morningTags: string[];
  morningNote: string;
  morningWin: string;
  morningChallenge: string;
  eveningMood: number;
  eveningEnergy: DemoEnergy;
  eveningStress: DemoStress;
  eveningTags: string[];
  eveningNote: string;
  eveningWin: string;
  eveningChallenge: string;
  sleepHours: number;
  dreamText: string;
  dreamFeelings: DreamFeeling[];
  dreamMetadata: DreamMetadata;
};

export type SomaticEntrySeed = {
  date: string; // ISO
  region: string;
  emotion: string;
  intensity: number;
  note: string;
  trigger?: string;
  whatHelped?: string;
};

export type TriggerEventSeed = {
  date: string; // ISO
  mode: 'drain' | 'nourish';
  event: string;
  nsState: 'ventral_vagal' | 'sympathetic' | 'dorsal_vagal';
  sensations: string[];
  note: string;
};

export type RelationshipPatternSeed = {
  date: string; // YYYY-MM-DD
  note: string;
  tags: string[];
};

export type RelationshipChartSeed = {
  name: string;
  relationship: string;
  birthDate: string;
  birthTime: string;
  hasUnknownTime: boolean;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string;
  dynamicNote: string;
};

export type AccountBDemoSeed = {
  profile: {
    displayName: string;
    email: string;
    birthDate: string;
    birthTime: string;
    hasUnknownTime: boolean;
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone: string;
    houseSystem: string;
    vibe: string;
    notesForDifferenceFromAccountA: string;
  };
  coreValues: {
    selected: string[];
    topFive: string[];
  };
  customJournalTags: string[];
  archetypeProfile: {
    dominant: string;
    scores: Record<string, number>;
    completedAt: string;
  };
  cognitiveStyle: {
    scope: number;
    processing: number;
    decisions: number;
    notes: string;
  };
  dailyEntries: DailyEntrySeed[];
  somaticEntries: SomaticEntrySeed[];
  triggerEvents: TriggerEventSeed[];
  relationshipPatterns: RelationshipPatternSeed[];
  relationshipCharts: RelationshipChartSeed[];
};

const DATE_START = new Date('2026-01-22T12:00:00.000Z');

function isoDateFromOffset(dayIndex: number): string {
  const d = new Date(DATE_START);
  d.setDate(d.getDate() + dayIndex);
  return d.toISOString().slice(0, 10);
}

function isoDateTimeFromOffset(dayIndex: number, hourUTC: number): string {
  const d = new Date(DATE_START);
  d.setDate(d.getDate() + dayIndex);
  d.setUTCHours(hourUTC, 0, 0, 0);
  return d.toISOString();
}

const PROMPT_RESPONSES = [
  `I woke up already feeling behind. Sometimes before anything even happens, I can feel the weight of being me and how hard it is to relax into the day.`,
  `What felt heavy today was how easily I assumed people were annoyed with me. What helped a little was reminding myself that not every silence means rejection.`,
  `My body needed less pressure and more gentleness today. I gave it some rest, but not as much as it was asking for.`,
  `Most of my energy went to holding everything together emotionally. It did not feel efficient, but it did feel necessary.`,
  `The interaction that affected me most was a small one, but it hit an old place. It made me feel awkward and too aware of myself.`,
  `I was trying not to feel how inferior I can feel around other people, especially when I think they are prettier, smarter, or more socially smooth.`,
  `What gave me steadiness today was one small moment of connection and the feeling that I was at least being honest with myself.`,
  `I got drained faster than expected by trying to look normal when internally I felt overstimulated and off.`,
  `What I did well today was keep going without being cruel to myself the entire time.`,
  `The strongest thought loop today was that people do not really like me and are just tolerating me.`,
  `I felt most like myself when I stopped trying to perform and just let the day be imperfect.`,
  `What I avoided today was a conversation that felt emotionally loaded because I did not have enough regulation for it.`,
];

const MORNING_NOTES = [
  `Woke up tired and emotionally braced.`,
  `Dream residue stayed with me into the morning.`,
  `Already feeling socially self-conscious.`,
  `Trying to start the day softer.`,
  `Body feels tight and a little flooded.`,
  `Not much emotional margin this morning.`,
  `Feeling lonely in a way I cannot fully explain.`,
  `Trying not to assume the worst about myself.`,
];

const EVENING_NOTES = [
  `Held a lot today and I can feel it in my body.`,
  `Still replaying things I wish had gone differently.`,
  `Parenting took more out of me than I expected.`,
  `There were a few small moments of relief.`,
  `I felt socially off and never fully recovered from it.`,
  `The day felt emotionally loud.`,
  `I kept going, but it was not light.`,
  `Trying not to make today mean something global about me.`,
];

const WINS = [
  `Stayed present during a hard moment.`,
  `Caught a spiral earlier than usual.`,
  `Let myself rest a little.`,
  `Did not push quite as hard as I wanted to.`,
  `Stayed softer with Lucas.`,
  `Told myself the truth instead of only the harsh version.`,
  `Made it through without completely shutting down.`,
  `Asked less of myself.`,
];

const CHALLENGES = [
  `Feeling inferior and not being able to shake it.`,
  `Hearing made conversation more exhausting than usual.`,
  `Attachment pain was close to the surface.`,
  `I felt awkward almost every time I interacted with people.`,
  `I assumed people were upset with me.`,
  `I carried too much emotionally.`,
  `Body memory made everything louder.`,
  `I needed more support than I had.`,
];

const TAG_SETS: string[][] = [
  ['rejection', 'social_anxiety', 'inferiority'],
  ['hearing_loss', 'exclusion', 'fatigue'],
  ['Lucas', 'motherhood', 'caregiving'],
  ['Naomi', 'grief', 'attachment'],
  ['Sarah', 'foster_care', 'stress'],
  ['foster_care', 'system', 'anger'],
  ['Annie', 'attachment', 'longing'],
  ['Jamie', 'connection', 'safety'],
  ['Angela', 'family', 'history'],
  ['Nellie', 'belonging', 'family'],
  ['DID', 'parts', 'inner_world'],
  ['body', 'trauma', 'awareness'],
];

const DREAM_TEXT_POOL = [
  `I was in a room full of people and I could feel that everyone hated me, even though no one said it directly. I kept trying to act normal, but everything I did felt awkward and wrong.`,
  `In the dream I kept missing what people were saying because of my hearing. Everyone else seemed connected to each other easily, and I felt embarrassed and behind.`,
  `I was trying to get to Lucas, but everything kept slowing me down. I woke up feeling protective and panicked.`,
  `I was in a foster care office that kept changing shape. Every door led to more waiting, more paperwork, and more people not listening.`,
  `I was following Annie through different rooms trying to get close enough to feel chosen. She was there, but just out of reach the whole time.`,
  `I was with Jamie in the dream and the whole feeling of it was steadiness. Nothing dramatic happened. It just felt like being safe enough to exhale.`,
  `I was at a family gathering but still somehow outside of it. Everyone else seemed to know how to belong naturally.`,
  `I was moving through different rooms and each one felt like a different age or part of me. No one inside wanted the same thing.`,
];

const DREAM_FEELINGS_POOL: DreamFeeling[][] = [
  [
    { id: 'rejected', intensity: 5 },
    { id: 'ashamed', intensity: 5 },
    { id: 'awkward', intensity: 4 },
  ],
  [
    { id: 'embarrassed', intensity: 5 },
    { id: 'left_out', intensity: 4 },
    { id: 'alone', intensity: 4 },
  ],
  [
    { id: 'protective', intensity: 5 },
    { id: 'panicked', intensity: 4 },
    { id: 'afraid', intensity: 4 },
  ],
  [
    { id: 'ignored', intensity: 5 },
    { id: 'trapped', intensity: 4 },
    { id: 'drained', intensity: 4 },
  ],
  [
    { id: 'longing', intensity: 5 },
    { id: 'sad', intensity: 4 },
    { id: 'hopeful', intensity: 3 },
  ],
  [
    { id: 'safe', intensity: 4 },
    { id: 'warm', intensity: 4 },
    { id: 'rested', intensity: 3 },
  ],
  [
    { id: 'excluded', intensity: 5 },
    { id: 'sad', intensity: 4 },
    { id: 'small', intensity: 4 },
  ],
  [
    { id: 'fragmented', intensity: 5 },
    { id: 'overwhelmed', intensity: 4 },
    { id: 'hurt', intensity: 4 },
  ],
];

const DREAM_THEMES = [
  'social_rejection',
  'hearing_and_exclusion',
  'protection',
  'system_frustration',
  'attachment_longing',
  'safe_connection',
  'family_belonging',
  'inner_parts',
];

function buildBaseDream(dayIndex: number) {
  const idx = dayIndex % DREAM_TEXT_POOL.length;
  return {
    dreamText: DREAM_TEXT_POOL[idx],
    dreamFeelings: DREAM_FEELINGS_POOL[idx],
    dreamMetadata: {
      vividness: 4,
      lucidity: 1,
      controlLevel: 1,
      overallTheme: DREAM_THEMES[idx],
      awakenState: idx === 5 ? 'peaceful' : 'shaken',
      recurring: idx === 0 || idx === 1 || idx === 4,
    } satisfies DreamMetadata,
  };
}

const ANCHOR_DREAMS_BY_DAY: Record<number, Partial<DailyEntrySeed>> = {
  7: {
    dreamText: `Annie and I met up in Detroit and were supposed to drive toward Grand Rapids together. Later we were at court, and she sat a few rows ahead next to someone she seemed to know. I felt sad and jealous because I wanted to be the only one she knew there. After court she drove off in her own car and I rode a bus with other people from court. I woke up wanting to be her favorite.`,
    dreamFeelings: [
      { id: 'sad', intensity: 5 },
      { id: 'jealous', intensity: 4 },
      { id: 'longing', intensity: 5 },
      { id: 'left_out', intensity: 4 },
    ],
    dreamMetadata: {
      vividness: 4,
      lucidity: 1,
      controlLevel: 1,
      overallTheme: 'attachment_longing',
      awakenState: 'emotional',
      recurring: false,
    },
  },
  15: {
    dreamText: `I had the scariest dream. I was back at Patti and Chuck’s house with a boy, Angela, and Catherine. Things kept shifting and becoming more threatening. There was a man outside who looked terrifying, Chuck blocked me from calling 911, and then he came downstairs with a gun and started shooting at me. After that he kept trying to hit me with his car and throwing bombs while I ran. No one helped me and the police never came.`,
    dreamFeelings: [
      { id: 'terrified', intensity: 5 },
      { id: 'unsafe', intensity: 5 },
      { id: 'panicked', intensity: 5 },
      { id: 'helpless', intensity: 4 },
    ],
    dreamMetadata: {
      vividness: 5,
      lucidity: 1,
      controlLevel: 1,
      overallTheme: 'danger_and_no_escape',
      awakenState: 'shaken',
      recurring: false,
    },
  },
  23: {
    dreamText: `It was around 5 a.m. when I woke up from a nightmare. In the dream, two men gave me a shot and raped me. I could not move or speak and felt completely paralyzed. The dream happened in the same room I was actually sleeping in, which made it feel horribly real. When I woke up, I checked the doors and tried to fall back asleep.`,
    dreamFeelings: [
      { id: 'terrified', intensity: 5 },
      { id: 'paralyzed', intensity: 5 },
      { id: 'unsafe', intensity: 5 },
      { id: 'shaken', intensity: 4 },
    ],
    dreamMetadata: {
      vividness: 5,
      lucidity: 1,
      controlLevel: 1,
      overallTheme: 'violation_and_paralysis',
      awakenState: 'afraid',
      recurring: false,
    },
  },
  34: {
    dreamText: `We were on a plane and people were saying God was calling people by name to die. Everyone panicked and jumped when the plane got low enough. After that there were bombs, forest fires, and people taking over. They used a hammer to mark people as part of their group and to kill them. I was terrified and just tried to survive by complying.`,
    dreamFeelings: [
      { id: 'terrified', intensity: 5 },
      { id: 'panicked', intensity: 5 },
      { id: 'pressured', intensity: 5 },
      { id: 'alone', intensity: 4 },
    ],
    dreamMetadata: {
      vividness: 5,
      lucidity: 1,
      controlLevel: 1,
      overallTheme: 'persecution_and_control',
      awakenState: 'shaken',
      recurring: false,
    },
  },
};

function buildDailyEntries(): DailyEntrySeed[] {
  const rows: DailyEntrySeed[] = [];

  for (let i = 0; i < 90; i++) {
    const promptResponse = PROMPT_RESPONSES[i % PROMPT_RESPONSES.length];
    const date = isoDateFromOffset(i);
    const morningMood = Math.max(2, Math.min(8, 6 - (i % 4 === 0 ? 1 : 0) + (i % 7 === 0 ? 1 : 0)));
    const eveningMood = Math.max(2, Math.min(8, morningMood + (i % 3 === 0 ? -1 : i % 5 === 0 ? 1 : 0)));
    const morningEnergy: DemoEnergy = i % 5 === 0 ? 'low' : i % 7 === 0 ? 'high' : 'medium';
    const eveningEnergy: DemoEnergy = i % 2 === 0 ? 'low' : 'medium';
    const morningStress: DemoStress = i % 4 === 0 ? 'high' : i % 6 === 0 ? 'low' : 'medium';
    const eveningStress: DemoStress = i % 3 === 0 ? 'high' : 'medium';
    const morningTags = TAG_SETS[i % TAG_SETS.length];
    const eveningTags = TAG_SETS[(i + 3) % TAG_SETS.length];
    const sleepHours = [7.5, 6.0, 8.0, 5.5, 7.0, 8.5, 6.5, 7.5, 9.0, 6.0][i % 10];
    const baseDream = buildBaseDream(i);

    rows.push({
      day: i + 1,
      date,
      promptResponse,
      morningMood,
      morningEnergy,
      morningStress,
      morningTags,
      morningNote: MORNING_NOTES[i % MORNING_NOTES.length],
      morningWin: WINS[i % WINS.length],
      morningChallenge: CHALLENGES[(i + 2) % CHALLENGES.length],
      eveningMood,
      eveningEnergy,
      eveningStress,
      eveningTags,
      eveningNote: EVENING_NOTES[i % EVENING_NOTES.length],
      eveningWin: WINS[(i + 3) % WINS.length],
      eveningChallenge: CHALLENGES[i % CHALLENGES.length],
      sleepHours,
      dreamText: baseDream.dreamText,
      dreamFeelings: baseDream.dreamFeelings,
      dreamMetadata: baseDream.dreamMetadata,
      ...(ANCHOR_DREAMS_BY_DAY[i + 1] ?? {}),
    });
  }

  return rows;
}

export const ACCOUNT_B_DEMO_SEED: AccountBDemoSeed = {
  profile: {
    displayName: 'Brittany',
    email: 'brithornick92@gmail.com',
    birthDate: '1992-08-01',
    birthTime: '06:09',
    hasUnknownTime: false,
    birthPlace: 'Detroit, Michigan',
    latitude: 42.3314,
    longitude: -83.0458,
    timezone: 'America/Detroit',
    houseSystem: 'placidus',
    vibe: 'emotionally deep, attachment-heavy, perceptive, worn down but resilient, soft under pressure, lived-in and real',
    notesForDifferenceFromAccountA:
      'Account B should feel more intimate, more attachment-driven, more specific to motherhood, foster care, hearing loss, DID/parts, and relational pain.',
  },

  coreValues: {
    selected: ['connection', 'authenticity', 'protection', 'truth', 'healing', 'loyalty', 'safety', 'love'],
    topFive: ['connection', 'authenticity', 'protection', 'healing', 'love'],
  },

  customJournalTags: [
    'hearing_loss',
    'Lucas',
    'Naomi',
    'Sarah',
    'foster_care',
    'Annie',
    'Jamie',
    'Angela',
    'Nellie',
    'DID',
    'parts',
    'rejection',
    'inferiority',
    'awkwardness',
    'attachment',
    'grief',
    'motherhood',
    'body_memory',
  ],

  archetypeProfile: {
    dominant: 'caregiver',
    scores: {
      hero: 2,
      caregiver: 5,
      seeker: 4,
      sage: 3,
      rebel: 2,
      lover: 4,
      orphan: 5,
      innocent: 1,
    },
    completedAt: '2026-03-17T10:00:00.000Z',
  },

  cognitiveStyle: {
    scope: 3,
    processing: 5,
    decisions: 2,
    notes: 'Deep emotional processing, high pattern recognition, slower when flooded, often self-doubting despite strong intuition.',
  },

  dailyEntries: buildDailyEntries(),

  somaticEntries: [
    {
      date: isoDateTimeFromOffset(5, 14),
      region: 'chest',
      emotion: 'anxiety',
      intensity: 4,
      note: 'Felt tight in my chest after thinking people were upset with me.',
      trigger: 'Social interaction that felt off.',
      whatHelped: 'Stepping away and breathing slowly.',
    },
    {
      date: isoDateTimeFromOffset(12, 17),
      region: 'throat',
      emotion: 'pressure',
      intensity: 4,
      note: 'Felt like words were stuck and I was swallowing feelings.',
      trigger: 'Wanting to say more and holding back.',
      whatHelped: 'Writing instead of speaking.',
    },
    {
      date: isoDateTimeFromOffset(19, 9),
      region: 'jaw',
      emotion: 'frustration',
      intensity: 3,
      note: 'Noticed my jaw was clenched after a hard foster care update.',
      trigger: 'System stress.',
      whatHelped: 'Unclenching and a short walk.',
    },
    {
      date: isoDateTimeFromOffset(27, 20),
      region: 'stomach',
      emotion: 'shame',
      intensity: 4,
      note: 'Felt sick after missing part of a conversation because of my hearing.',
      trigger: 'Not catching what someone said.',
      whatHelped: 'Being alone for a little while.',
    },
    {
      date: isoDateTimeFromOffset(35, 11),
      region: 'heart',
      emotion: 'tenderness',
      intensity: 4,
      note: 'Felt a warm ache thinking about Jamie and being known safely.',
      trigger: 'Connection with Jamie.',
      whatHelped: 'Letting myself stay in the warmth.',
    },
    {
      date: isoDateTimeFromOffset(43, 15),
      region: 'belly',
      emotion: 'dread',
      intensity: 5,
      note: 'Body knew I was overwhelmed before I admitted it.',
      trigger: 'Too many demands at once.',
      whatHelped: 'Cancelling one thing and lowering expectations.',
    },
    {
      date: isoDateTimeFromOffset(51, 8),
      region: 'shoulders',
      emotion: 'pressure',
      intensity: 4,
      note: 'Felt like I was carrying everything physically too.',
      trigger: 'Lucas needing a lot and feeling alone in it.',
      whatHelped: 'Heat on my shoulders and sitting down.',
    },
    {
      date: isoDateTimeFromOffset(58, 22),
      region: 'solar_plexus',
      emotion: 'grief',
      intensity: 4,
      note: 'A heavy ache when thinking about Naomi leaving.',
      trigger: 'Memory of attachment and loss.',
      whatHelped: 'Crying instead of suppressing it.',
    },
    {
      date: isoDateTimeFromOffset(66, 13),
      region: 'head',
      emotion: 'numbness',
      intensity: 3,
      note: 'Started feeling foggy and disconnected after emotional overload.',
      trigger: 'Too much inner conflict at once.',
      whatHelped: 'Quiet and less stimulation.',
    },
    {
      date: isoDateTimeFromOffset(74, 19),
      region: 'chest',
      emotion: 'warmth',
      intensity: 3,
      note: 'Felt softer after a calm moment with Lucas.',
      trigger: 'Simple connection.',
      whatHelped: 'Staying present instead of rushing.',
    },
    {
      date: isoDateTimeFromOffset(81, 10),
      region: 'hips',
      emotion: 'tension',
      intensity: 3,
      note: 'Held stress in my body most of the morning.',
      trigger: 'Anticipating hard conversations.',
      whatHelped: 'Movement and stretching.',
    },
    {
      date: isoDateTimeFromOffset(87, 16),
      region: 'heart',
      emotion: 'openness',
      intensity: 4,
      note: 'A rare feeling of relief and truth.',
      trigger: 'Feeling internally aligned.',
      whatHelped: 'Not arguing with the moment.',
    },
  ],

  triggerEvents: [
    {
      date: isoDateTimeFromOffset(6, 16),
      mode: 'nourish',
      event: 'Quiet connection with Jamie',
      nsState: 'ventral_vagal',
      sensations: ['heart warmth', 'deeper breath'],
      note: 'Felt known instead of managed.',
    },
    {
      date: isoDateTimeFromOffset(11, 13),
      mode: 'drain',
      event: 'Missing part of conversation because of hearing',
      nsState: 'sympathetic',
      sensations: ['stomach drop', 'jaw tension'],
      note: 'Felt behind and embarrassed instantly.',
    },
    {
      date: isoDateTimeFromOffset(18, 19),
      mode: 'drain',
      event: 'Foster care update that felt minimizing',
      nsState: 'sympathetic',
      sensations: ['chest tightening', 'held breath'],
      note: 'Anger and helplessness came up together.',
    },
    {
      date: isoDateTimeFromOffset(24, 21),
      mode: 'drain',
      event: 'Attachment ache after thinking about Annie',
      nsState: 'sympathetic',
      sensations: ['ache in chest', 'restless body'],
      note: 'Wanted to feel chosen and special.',
    },
    {
      date: isoDateTimeFromOffset(29, 10),
      mode: 'nourish',
      event: 'Gentle parenting moment with Lucas',
      nsState: 'ventral_vagal',
      sensations: ['soft chest', 'slower breathing'],
      note: 'Felt connected instead of only responsible.',
    },
    {
      date: isoDateTimeFromOffset(36, 18),
      mode: 'drain',
      event: 'Family exclusion feeling',
      nsState: 'dorsal_vagal',
      sensations: ['heaviness', 'numbness'],
      note: 'Old sibling pain got touched.',
    },
    {
      date: isoDateTimeFromOffset(42, 14),
      mode: 'nourish',
      event: 'Letting myself rest without earning it',
      nsState: 'ventral_vagal',
      sensations: ['shoulders dropping', 'warmth'],
      note: 'Small but real regulation.',
    },
    {
      date: isoDateTimeFromOffset(49, 15),
      mode: 'drain',
      event: 'Inner conflict between parts',
      nsState: 'dorsal_vagal',
      sensations: ['foggy head', 'heavy limbs'],
      note: 'Felt blurry and internally split.',
    },
    {
      date: isoDateTimeFromOffset(56, 20),
      mode: 'nourish',
      event: 'Moment of honesty in journaling',
      nsState: 'ventral_vagal',
      sensations: ['clear chest', 'settled body'],
      note: 'Felt more integrated afterward.',
    },
    {
      date: isoDateTimeFromOffset(63, 17),
      mode: 'drain',
      event: 'Thinking about Naomi leaving',
      nsState: 'dorsal_vagal',
      sensations: ['heart ache', 'collapse feeling'],
      note: 'Attachment grief still lives close to the surface.',
    },
    {
      date: isoDateTimeFromOffset(71, 9),
      mode: 'nourish',
      event: 'Feeling understood without overexplaining',
      nsState: 'ventral_vagal',
      sensations: ['full breath', 'soft jaw'],
      note: 'That kind of safety matters a lot.',
    },
    {
      date: isoDateTimeFromOffset(84, 12),
      mode: 'drain',
      event: 'Comparing myself to other women',
      nsState: 'sympathetic',
      sensations: ['stomach knot', 'hot face'],
      note: 'Pretty, smart, normal all felt far away.',
    },
  ],

  relationshipPatterns: [
    {
      date: isoDateFromOffset(8),
      note: 'I can become quickly convinced someone is upset with me even when there is very little evidence.',
      tags: ['anxious-attachment', 'hypervigilance', 'reassurance-seeking'],
    },
    {
      date: isoDateFromOffset(17),
      note: 'When I feel inferior, I either over-explain or pull back completely.',
      tags: ['people-pleasing', 'withdrawal', 'self-trust'],
    },
    {
      date: isoDateFromOffset(26),
      note: 'I want to feel chosen in a way that is intense and young, especially in attachment relationships.',
      tags: ['anxious-attachment', 'vulnerability', 'reassurance-seeking'],
    },
    {
      date: isoDateFromOffset(39),
      note: 'I tend to caretake hard and then feel unseen for how much I am holding.',
      tags: ['caretaking', 'resentment', 'over-giving'],
    },
    {
      date: isoDateFromOffset(48),
      note: 'When I do set a boundary, I usually second-guess it afterward.',
      tags: ['boundaries', 'self-trust', 'clarity'],
    },
    {
      date: isoDateFromOffset(57),
      note: 'Being misunderstood can hurt me more than direct conflict because it touches older attachment wounds.',
      tags: ['vulnerability', 'conflict', 'hypervigilance'],
    },
    {
      date: isoDateFromOffset(68),
      note: 'I can feel both fiercely protective and deeply lonely in close relationships at the same time.',
      tags: ['caretaking', 'emotional-distance', 'anxious-attachment'],
    },
    {
      date: isoDateFromOffset(79),
      note: 'Repair matters a lot to me, but I often brace before I trust that it is real.',
      tags: ['repair', 'secure-attachment', 'hypervigilance'],
    },
  ],

  relationshipCharts: [
    {
      name: 'Annie',
      relationship: 'therapist / attachment figure',
      birthDate: '',
      birthTime: '',
      hasUnknownTime: true,
      birthPlace: '',
      latitude: 0,
      longitude: 0,
      timezone: '',
      dynamicNote: 'Deep attachment, longing to feel chosen, emotionally loaded and very significant.',
    },
    {
      name: 'Jamie',
      relationship: 'best friend',
      birthDate: '',
      birthTime: '',
      hasUnknownTime: true,
      birthPlace: '',
      latitude: 0,
      longitude: 0,
      timezone: '',
      dynamicNote: 'Represents safety, steadiness, and feeling known in a way that lands deeply.',
    },
    {
      name: 'Angela',
      relationship: 'sister',
      birthDate: '',
      birthTime: '',
      hasUnknownTime: true,
      birthPlace: '',
      latitude: 0,
      longitude: 0,
      timezone: '',
      dynamicNote: 'Complex sibling bond with love, hurt, grief, and history layered together.',
    },
    {
      name: 'Nellie',
      relationship: 'sister',
      birthDate: '',
      birthTime: '',
      hasUnknownTime: true,
      birthPlace: '',
      latitude: 0,
      longitude: 0,
      timezone: '',
      dynamicNote: 'Emotionally tied to belonging, exclusion, and family closeness dynamics.',
    },
  ],
};

// ── Real Account B Reflections ──────────────────────────────────────────
// To use, fill in the 'answer' fields with one of:
// 'Not True', 'Somewhat', 'True', 'Very True'
export const ACCOUNT_B_REFLECTIONS = [

  // Day: 2026-01-22
  { date: '2026-01-22', category: 'values', answer: '', questionText: 'I recognise the early signs of burnout in myself.' },
  { date: '2026-01-22', category: 'values', answer: '', questionText: 'My sense of identity has shifted meaningfully in the last year.' },
  { date: '2026-01-22', category: 'archetypes', answer: '', questionText: 'I convert fear into fuel and motivation.' },
  { date: '2026-01-22', category: 'archetypes', answer: '', questionText: 'A journey — internal or external — has significantly changed who I am.' },
  { date: '2026-01-22', category: 'cognitive', answer: '', questionText: 'I organise my thoughts clearly before speaking about something complex.' },
  { date: '2026-01-22', category: 'cognitive', answer: '', questionText: 'I think primarily in images rather than words.' },
  { date: '2026-01-22', category: 'intelligence', answer: '', questionText: 'I feel uncomfortable when there is unresolved tension in a group.' },
  { date: '2026-01-22', category: 'intelligence', answer: '', questionText: 'I am a natural mediator in disagreements.' },

  // Day: 2026-01-23
  { date: '2026-01-23', category: 'values', answer: '', questionText: 'What I believe about the nature of life shapes how I treat people.' },
  { date: '2026-01-23', category: 'values', answer: '', questionText: 'I say no without guilt when I need to.' },
  { date: '2026-01-23', category: 'archetypes', answer: '', questionText: 'An experience far outside my comfort zone shaped who I am profoundly.' },
  { date: '2026-01-23', category: 'archetypes', answer: '', questionText: 'Some responsibilities feel noble while others feel like burdens.' },
  { date: '2026-01-23', category: 'cognitive', answer: '', questionText: 'I follow a personal decision rule that serves me well.' },
  { date: '2026-01-23', category: 'cognitive', answer: '', questionText: 'I adapt my communication style fluidly for different people.' },
  { date: '2026-01-23', category: 'intelligence', answer: '', questionText: 'I learn and remember things better when they are set to music.' },
  { date: '2026-01-23', category: 'intelligence', answer: '', questionText: 'I can tell when a note or instrument is slightly off-pitch.' },

  // Day: 2026-01-24
  { date: '2026-01-24', category: 'values', answer: '', questionText: 'There are family patterns I am consciously choosing to break.' },
  { date: '2026-01-24', category: 'values', answer: '', questionText: 'I have made meaningful sacrifices for the people I love.' },
  { date: '2026-01-24', category: 'values', answer: '', questionText: 'Being respected matters more to me than being liked.' },
  { date: '2026-01-24', category: 'archetypes', answer: '', questionText: 'I navigate the disorientation of becoming someone new.' },
  { date: '2026-01-24', category: 'archetypes', answer: '', questionText: 'I handle the loneliness of walking my own path with grace.' },
  { date: '2026-01-24', category: 'archetypes', answer: '', questionText: 'At least one of my personas is exhausting to maintain.' },
  { date: '2026-01-24', category: 'cognitive', answer: '', questionText: 'I actively seek out new information through my preferred channels.' },
  { date: '2026-01-24', category: 'cognitive', answer: '', questionText: 'I take smart, well-calculated risks.' },
  { date: '2026-01-24', category: 'cognitive', answer: '', questionText: 'I push through learning plateaus even when progress feels invisible.' },
  { date: '2026-01-24', category: 'intelligence', answer: '', questionText: 'Music connects me to something larger than myself.' },
  { date: '2026-01-24', category: 'intelligence', answer: '', questionText: 'I can identify many plants, trees, or animals by sight.' },
  { date: '2026-01-24', category: 'intelligence', answer: '', questionText: 'I notice physical discomfort in spaces that feel wrong.' },

  // Day: 2026-01-25
  { date: '2026-01-25', category: 'values', answer: '', questionText: 'My body clearly signals when I feel safe versus when I feel threatened.' },
  { date: '2026-01-25', category: 'values', answer: '', questionText: 'I willingly sacrifice smaller things for what truly matters.' },
  { date: '2026-01-25', category: 'archetypes', answer: '', questionText: 'There are things about the way the world works that I refuse to accept.' },
  { date: '2026-01-25', category: 'archetypes', answer: '', questionText: 'My shadow shows up clearly in my relationships.' },
  { date: '2026-01-25', category: 'cognitive', answer: '', questionText: 'I handle memories that contradict my current self-image with openness.' },
  { date: '2026-01-25', category: 'cognitive', answer: '', questionText: 'Unexpected inputs — walks, conversations, random articles — spark breakthroughs for me.' },
  { date: '2026-01-25', category: 'intelligence', answer: '', questionText: 'I tend to absorb new languages naturally and quickly.' },
  { date: '2026-01-25', category: 'intelligence', answer: '', questionText: 'I hum, whistle, or tap rhythms without realising it.' },

  // Day: 2026-01-26
  { date: '2026-01-26', category: 'values', answer: '', questionText: 'I hold my beliefs with both conviction and humility.' },
  { date: '2026-01-26', category: 'values', answer: '', questionText: 'I actively honour the people who have shaped me.' },
  { date: '2026-01-26', category: 'archetypes', answer: '', questionText: 'Someone has truly taken care of me recently.' },
  { date: '2026-01-26', category: 'archetypes', answer: '', questionText: 'I understand what fulfilment looks like for someone who is always seeking.' },
  { date: '2026-01-26', category: 'cognitive', answer: '', questionText: 'Small talk is valuable and enjoyable to me.' },
  { date: '2026-01-26', category: 'cognitive', answer: '', questionText: 'I take a completely different approach when my first method isn\'t working.' },
  { date: '2026-01-26', category: 'intelligence', answer: '', questionText: 'I process emotions partly by finding the exact words for them.' },
  { date: '2026-01-26', category: 'intelligence', answer: '', questionText: 'I recognise complex time signatures or polyrhythms.' },

  // Day: 2026-01-27
  { date: '2026-01-27', category: 'values', answer: '', questionText: 'I have made courageous choices this year.' },
  { date: '2026-01-27', category: 'values', answer: '', questionText: 'I model the values I want to see in the world.' },
  { date: '2026-01-27', category: 'values', answer: '', questionText: 'I am intentional about what deserves my emotional energy.' },
  { date: '2026-01-27', category: 'archetypes', answer: '', questionText: 'Traits I dislike in others often reflect something unresolved in me.' },
  { date: '2026-01-27', category: 'archetypes', answer: '', questionText: 'A spiritual or philosophical question keeps calling me back.' },
  { date: '2026-01-27', category: 'archetypes', answer: '', questionText: 'I balance emotional generosity with meeting my own needs.' },
  { date: '2026-01-27', category: 'cognitive', answer: '', questionText: 'I balance logic and emotion effectively when making choices.' },
  { date: '2026-01-27', category: 'cognitive', answer: '', questionText: 'I seek disconfirming evidence for my beliefs, not just confirming evidence.' },
  { date: '2026-01-27', category: 'cognitive', answer: '', questionText: 'Breaking a familiar pattern has significantly shaped my thinking.' },
  { date: '2026-01-27', category: 'intelligence', answer: '', questionText: 'I remember faces far better than names.' },
  { date: '2026-01-27', category: 'intelligence', answer: '', questionText: 'I process stress through my body — tension, restlessness, movement.' },
  { date: '2026-01-27', category: 'intelligence', answer: '', questionText: 'I feel physical sensations when listening to certain music.' },

  // Day: 2026-01-28
  { date: '2026-01-28', category: 'values', answer: '', questionText: 'I grow through discomfort rather than in spite of it.' },
  { date: '2026-01-28', category: 'values', answer: '', questionText: 'The decisions I make are truly my own.' },
  { date: '2026-01-28', category: 'archetypes', answer: '', questionText: 'I can distinguish between genuine seeking and emotional avoidance.' },
  { date: '2026-01-28', category: 'archetypes', answer: '', questionText: 'I balance my need for disruption with others\' need for stability.' },
  { date: '2026-01-28', category: 'cognitive', answer: '', questionText: 'I extract useful learning from risks that didn\'t pay off.' },
  { date: '2026-01-28', category: 'cognitive', answer: '', questionText: 'Fatigue changes what I focus on in noticeable ways.' },
  { date: '2026-01-28', category: 'intelligence', answer: '', questionText: 'I am drawn to liminal spaces — thresholds, transitions, edges.' },
  { date: '2026-01-28', category: 'intelligence', answer: '', questionText: 'I notice rhythms and patterns in everyday sounds.' },

  // Day: 2026-01-29
  { date: '2026-01-29', category: 'values', answer: '', questionText: 'My relationship with my body has become more compassionate over time.' },
  { date: '2026-01-29', category: 'values', answer: '', questionText: 'I interpret my own life story generously and kindly.' },
  { date: '2026-01-29', category: 'archetypes', answer: '', questionText: 'I don\'t always know what to do when my strength isn\'t enough.' },
  { date: '2026-01-29', category: 'archetypes', answer: '', questionText: 'I need time to recalibrate after performing a role for too long.' },
  { date: '2026-01-29', category: 'cognitive', answer: '', questionText: 'I connect insights across different areas of my life.' },
  { date: '2026-01-29', category: 'cognitive', answer: '', questionText: 'My confidence in a decision grows after I commit to it.' },
  { date: '2026-01-29', category: 'intelligence', answer: '', questionText: 'I am very aware of my body in space.' },
  { date: '2026-01-29', category: 'intelligence', answer: '', questionText: 'I find joy in proofs, derivations, or formal logic.' },

  // Day: 2026-01-30
  { date: '2026-01-30', category: 'values', answer: '', questionText: 'Childhood experiences shaped my need for safety.' },
  { date: '2026-01-30', category: 'values', answer: '', questionText: 'There are things that matter deeply to me that I rarely talk about.' },
  { date: '2026-01-30', category: 'values', answer: '', questionText: 'I am comfortable showing all of my emotions publicly.' },
  { date: '2026-01-30', category: 'archetypes', answer: '', questionText: 'I wear a different mask at work than I do at home.' },
  { date: '2026-01-30', category: 'archetypes', answer: '', questionText: 'I celebrate others without diminishing myself.' },
  { date: '2026-01-30', category: 'archetypes', answer: '', questionText: 'I am looking toward a specific horizon in my life right now.' },
  { date: '2026-01-30', category: 'cognitive', answer: '', questionText: 'I make sense of situations that don\'t fit any known pattern.' },
  { date: '2026-01-30', category: 'cognitive', answer: '', questionText: 'I know when a problem is solved "enough" and move on.' },
  { date: '2026-01-30', category: 'cognitive', answer: '', questionText: 'My emotions enhance rather than cloud the clarity of my thinking.' },
  { date: '2026-01-30', category: 'intelligence', answer: '', questionText: 'I have a strong sense of direction and rarely get lost.' },
  { date: '2026-01-30', category: 'intelligence', answer: '', questionText: 'I can easily rotate objects in my mind.' },
  { date: '2026-01-30', category: 'intelligence', answer: '', questionText: 'I am energised by meaningful conversations.' },

  // Day: 2026-01-31
  { date: '2026-01-31', category: 'values', answer: '', questionText: 'I am holding onto obligations I need to release.' },
  { date: '2026-01-31', category: 'values', answer: '', questionText: 'I express the qualities I admire in others rather than suppressing them in myself.' },
  { date: '2026-01-31', category: 'archetypes', answer: '', questionText: 'My shadow side intensifies when I\'m under stress.' },
  { date: '2026-01-31', category: 'archetypes', answer: '', questionText: 'There is something I consistently lie to myself about.' },
  { date: '2026-01-31', category: 'cognitive', answer: '', questionText: 'I assess risk effectively even with incomplete information.' },
  { date: '2026-01-31', category: 'cognitive', answer: '', questionText: 'I retain information over the long term reliably.' },
  { date: '2026-01-31', category: 'intelligence', answer: '', questionText: 'I prefer verbal instructions over visual diagrams.' },
  { date: '2026-01-31', category: 'intelligence', answer: '', questionText: 'I believe that the most important truths cannot be put into words.' },

  // Day: 2026-02-01
  { date: '2026-02-01', category: 'values', answer: '', questionText: 'There is at least one thing I absolutely refuse to compromise on.' },
  { date: '2026-02-01', category: 'values', answer: '', questionText: 'My responsibilities to family feel aligned with my deeper values.' },
  { date: '2026-02-01', category: 'archetypes', answer: '', questionText: 'The archetype I admire most reveals something important about me.' },
  { date: '2026-02-01', category: 'archetypes', answer: '', questionText: 'I hold complexity without collapsing into confusion.' },
  { date: '2026-02-01', category: 'cognitive', answer: '', questionText: 'I remain open to outcomes I didn\'t plan for.' },
  { date: '2026-02-01', category: 'cognitive', answer: '', questionText: 'I make room for unexpected ideas in an otherwise structured day.' },
  { date: '2026-02-01', category: 'intelligence', answer: '', questionText: 'I prefer watching a demonstration over reading instructions.' },
  { date: '2026-02-01', category: 'intelligence', answer: '', questionText: 'I can read maps effortlessly.' },

  // Day: 2026-02-02
  { date: '2026-02-02', category: 'values', answer: '', questionText: 'I know exactly what quality I value most in a close relationship.' },
  { date: '2026-02-02', category: 'values', answer: '', questionText: 'The work I do feels like play to me.' },
  { date: '2026-02-02', category: 'values', answer: '', questionText: 'I feel secure enough to let myself be vulnerable.' },
  { date: '2026-02-02', category: 'archetypes', answer: '', questionText: 'Physical changes in my life mirror my internal transformation.' },
  { date: '2026-02-02', category: 'archetypes', answer: '', questionText: 'I listen most to the inner voice that actually serves me best.' },
  { date: '2026-02-02', category: 'archetypes', answer: '', questionText: 'I am actively searching for something meaningful in my life.' },
  { date: '2026-02-02', category: 'cognitive', answer: '', questionText: 'I communicate complex ideas clearly, even when others don\'t immediately understand.' },
  { date: '2026-02-02', category: 'cognitive', answer: '', questionText: 'Deep conversations energise my thinking.' },
  { date: '2026-02-02', category: 'cognitive', answer: '', questionText: 'I gather sufficient information before committing to a choice.' },
  { date: '2026-02-02', category: 'intelligence', answer: '', questionText: 'I question assumptions before accepting them.' },
  { date: '2026-02-02', category: 'intelligence', answer: '', questionText: 'I need regular solitude to recharge.' },
  { date: '2026-02-02', category: 'intelligence', answer: '', questionText: 'I naturally recognize patterns in music, like genre or era.' },

  // Day: 2026-02-03
  { date: '2026-02-03', category: 'values', answer: '', questionText: 'I choose myself when it\'s the right thing to do.' },
  { date: '2026-02-03', category: 'values', answer: '', questionText: 'Ageing is teaching me valuable things about what truly matters.' },
  { date: '2026-02-03', category: 'archetypes', answer: '', questionText: 'I naturally step in when someone needs help or rescuing.' },
  { date: '2026-02-03', category: 'archetypes', answer: '', questionText: 'I needed a hero in my life that I never had.' },
  { date: '2026-02-03', category: 'cognitive', answer: '', questionText: 'I make decisions from courage rather than fear.' },
  { date: '2026-02-03', category: 'cognitive', answer: '', questionText: 'I use metaphors effectively to understand my own life.' },
  { date: '2026-02-03', category: 'intelligence', answer: '', questionText: 'I feel at home in my body most of the time.' },
  { date: '2026-02-03', category: 'intelligence', answer: '', questionText: 'I narrate experiences vividly when telling stories.' },

  // Day: 2026-02-04
  { date: '2026-02-04', category: 'values', answer: '', questionText: 'I can sense when my boundaries are being tested.' },
  { date: '2026-02-04', category: 'values', answer: '', questionText: 'I have discovered truths late in life that I\'m genuinely grateful for.' },
  { date: '2026-02-04', category: 'archetypes', answer: '', questionText: 'There is a gift hidden inside my greatest flaw.' },
  { date: '2026-02-04', category: 'archetypes', answer: '', questionText: 'I have been overthinking something that actually needs feeling instead.' },
  { date: '2026-02-04', category: 'cognitive', answer: '', questionText: 'I work on one task at a time rather than multitasking.' },
  { date: '2026-02-04', category: 'cognitive', answer: '', questionText: 'I address even the types of decisions I tend to avoid.' },
  { date: '2026-02-04', category: 'intelligence', answer: '', questionText: 'I feel spiritually connected to the natural world.' },
  { date: '2026-02-04', category: 'intelligence', answer: '', questionText: 'I enjoy debugging or troubleshooting problems.' },

  // Day: 2026-02-05
  { date: '2026-02-05', category: 'values', answer: '', questionText: 'I lift others without needing recognition for doing so.' },
  { date: '2026-02-05', category: 'values', answer: '', questionText: 'I reconcile compassion with accountability in a balanced way.' },
  { date: '2026-02-05', category: 'values', answer: '', questionText: 'I stay motivated even when progress feels invisible.' },
  { date: '2026-02-05', category: 'archetypes', answer: '', questionText: 'Radical self-honesty is something I could practise more of.' },
  { date: '2026-02-05', category: 'archetypes', answer: '', questionText: 'I hold onto myself during major life transitions.' },
  { date: '2026-02-05', category: 'archetypes', answer: '', questionText: 'I am sitting with a book, talk, or idea that is actively changing me.' },
  { date: '2026-02-05', category: 'cognitive', answer: '', questionText: 'I notice when a current situation rhymes with one from my past.' },
  { date: '2026-02-05', category: 'cognitive', answer: '', questionText: 'I handle misunderstandings without becoming defensive.' },
  { date: '2026-02-05', category: 'cognitive', answer: '', questionText: 'Looking back over my reflections, I can see a clear pattern in how I think and grow.' },
  { date: '2026-02-05', category: 'intelligence', answer: '', questionText: 'I understand unspoken social rules instinctively.' },
  { date: '2026-02-05', category: 'intelligence', answer: '', questionText: 'I pick up new physical skills quickly.' },
  { date: '2026-02-05', category: 'intelligence', answer: '', questionText: 'I am drawn to introspection in all its forms.' },

  // Day: 2026-02-06
  { date: '2026-02-06', category: 'values', answer: '', questionText: 'I stay compassionate without losing myself in the process.' },
  { date: '2026-02-06', category: 'values', answer: '', questionText: 'Social interaction drains me more than most people realise.' },
  { date: '2026-02-06', category: 'archetypes', answer: '', questionText: 'I have faced something deeply difficult this year.' },
  { date: '2026-02-06', category: 'archetypes', answer: '', questionText: 'I stay curious even when I feel like an expert in something.' },
  { date: '2026-02-06', category: 'cognitive', answer: '', questionText: 'I navigate situations where intuition and logic point in different directions.' },
  { date: '2026-02-06', category: 'cognitive', answer: '', questionText: 'I keep my mind sharp and engaged through deliberate practice.' },
  { date: '2026-02-06', category: 'intelligence', answer: '', questionText: 'I am sensitive to the aesthetic quality of everyday spaces.' },
  { date: '2026-02-06', category: 'intelligence', answer: '', questionText: 'I notice the rhythm of speech and find some voices musical.' },

  // Day: 2026-02-07
  { date: '2026-02-07', category: 'values', answer: '', questionText: 'I value honesty over harmony in my close relationships.' },
  { date: '2026-02-07', category: 'values', answer: '', questionText: 'Certain relationship dynamics trigger me more than I\'d like.' },
  { date: '2026-02-07', category: 'archetypes', answer: '', questionText: 'My need for control reveals my deepest fear.' },
  { date: '2026-02-07', category: 'archetypes', answer: '', questionText: 'I have had to accept something very difficult about myself.' },
  { date: '2026-02-07', category: 'cognitive', answer: '', questionText: 'I am comfortable working with numbers and quantitative data.' },
  { date: '2026-02-07', category: 'cognitive', answer: '', questionText: 'I interrupt unhelpful thought patterns before they take over.' },
  { date: '2026-02-07', category: 'intelligence', answer: '', questionText: 'I notice when sound design is used intentionally in films or media.' },
  { date: '2026-02-07', category: 'intelligence', answer: '', questionText: 'I use visualisation as a planning or problem-solving tool.' },

  // Day: 2026-02-08
  { date: '2026-02-08', category: 'values', answer: '', questionText: 'I am giving my truest self what it needs right now.' },
  { date: '2026-02-08', category: 'values', answer: '', questionText: 'I have a healthy process for navigating grief and loss.' },
  { date: '2026-02-08', category: 'values', answer: '', questionText: 'I can hold space for people whose values differ from mine.' },
  { date: '2026-02-08', category: 'archetypes', answer: '', questionText: 'I adapt socially without feeling fake.' },
  { date: '2026-02-08', category: 'archetypes', answer: '', questionText: 'My identity would shift dramatically if I stopped taking care of everyone.' },
  { date: '2026-02-08', category: 'archetypes', answer: '', questionText: 'Going against the grain has often been the right choice for me.' },
  { date: '2026-02-08', category: 'cognitive', answer: '', questionText: 'I rely on a mental model to understand human behaviour.' },
  { date: '2026-02-08', category: 'cognitive', answer: '', questionText: 'I approach problems from the top down, starting with the big picture.' },
  { date: '2026-02-08', category: 'cognitive', answer: '', questionText: 'I take feedback about how I think and communicate seriously.' },
  { date: '2026-02-08', category: 'intelligence', answer: '', questionText: 'I approach problems in a systematic, step-by-step way.' },
  { date: '2026-02-08', category: 'intelligence', answer: '', questionText: 'Language feels like my most natural creative medium.' },
  { date: '2026-02-08', category: 'intelligence', answer: '', questionText: 'I can reverse-engineer how something was made.' },

  // Day: 2026-02-09
  { date: '2026-02-09', category: 'values', answer: '', questionText: 'I am actively developing a skill or quality that matters to me.' },
  { date: '2026-02-09', category: 'values', answer: '', questionText: 'Community is a meaningful part of my life.' },
  { date: '2026-02-09', category: 'archetypes', answer: '', questionText: 'I keep repeating a pattern even though I know better.' },
  { date: '2026-02-09', category: 'archetypes', answer: '', questionText: 'I would rather be a quiet hero than a visible one.' },
  { date: '2026-02-09', category: 'cognitive', answer: '', questionText: 'I reset my thinking effectively when I\'m going in circles.' },
  { date: '2026-02-09', category: 'cognitive', answer: '', questionText: 'I prefer consuming information alone rather than discussing it.' },
  { date: '2026-02-09', category: 'intelligence', answer: '', questionText: 'I enjoy creating visual art — painting, collage, digital design.' },
  { date: '2026-02-09', category: 'intelligence', answer: '', questionText: 'I can picture how furniture will look in a room before moving it.' },

  // Day: 2026-02-10
  { date: '2026-02-10', category: 'values', answer: '', questionText: 'Unexpected things energise me in surprising ways.' },
  { date: '2026-02-10', category: 'values', answer: '', questionText: 'I wear a mask more often than I would like.' },
  { date: '2026-02-10', category: 'archetypes', answer: '', questionText: 'I use my influence ethically and intentionally.' },
  { date: '2026-02-10', category: 'archetypes', answer: '', questionText: 'I continue caring for others even when I\'m drained.' },
  { date: '2026-02-10', category: 'cognitive', answer: '', questionText: 'Certain types of questions make me think more deeply than others.' },
  { date: '2026-02-10', category: 'cognitive', answer: '', questionText: 'I evaluate whether an idea is worth deeply pursuing before investing heavily.' },
  { date: '2026-02-10', category: 'intelligence', answer: '', questionText: 'I have experienced moments of deep connection to the cosmos.' },
  { date: '2026-02-10', category: 'intelligence', answer: '', questionText: 'I use empathy as my primary way of understanding others.' },

  // Day: 2026-02-11
  { date: '2026-02-11', category: 'values', answer: '', questionText: 'Community and belonging give my life a dimension that solitude cannot.' },
  { date: '2026-02-11', category: 'values', answer: '', questionText: 'I value freedom more than stability in this season of my life.' },
  { date: '2026-02-11', category: 'values', answer: '', questionText: 'My greatest strengths have emerged from my hardest experiences.' },
  { date: '2026-02-11', category: 'archetypes', answer: '', questionText: 'I know how to reclaim my power after someone has taken it.' },
  { date: '2026-02-11', category: 'archetypes', answer: '', questionText: 'There is a role in life I play more naturally than any other.' },
  { date: '2026-02-11', category: 'archetypes', answer: '', questionText: 'I balance being a voice of reason with being emotionally present.' },
  { date: '2026-02-11', category: 'cognitive', answer: '', questionText: 'I apply lessons I wish I had been taught earlier in life.' },
  { date: '2026-02-11', category: 'cognitive', answer: '', questionText: 'Learning a difficult skill teaches me as much about myself as about the skill.' },
  { date: '2026-02-11', category: 'cognitive', answer: '', questionText: 'I perform best in structured conversation formats.' },
  { date: '2026-02-11', category: 'intelligence', answer: '', questionText: 'I contemplate the nature of consciousness and awareness.' },
  { date: '2026-02-11', category: 'intelligence', answer: '', questionText: 'I am fascinated by the overlap between science and spirituality.' },
  { date: '2026-02-11', category: 'intelligence', answer: '', questionText: 'I pick up on micro-expressions and body language.' },

  // Day: 2026-02-12
  { date: '2026-02-12', category: 'values', answer: '', questionText: 'I balance giving and receiving well in my relationships.' },
  { date: '2026-02-12', category: 'values', answer: '', questionText: 'I regularly do something kind just for myself.' },
  { date: '2026-02-12', category: 'archetypes', answer: '', questionText: 'I struggle to recover after giving everything I have.' },
  { date: '2026-02-12', category: 'archetypes', answer: '', questionText: 'A role I was once forced into turned out to be one I secretly enjoy.' },
  { date: '2026-02-12', category: 'cognitive', answer: '', questionText: 'I calibrate my confidence in my own judgement accurately.' },
  { date: '2026-02-12', category: 'cognitive', answer: '', questionText: 'I know when to trust my analysis and when to trust my instincts.' },
  { date: '2026-02-12', category: 'intelligence', answer: '', questionText: 'I enjoy sequences, codes, or ciphers.' },
  { date: '2026-02-12', category: 'intelligence', answer: '', questionText: 'I am comfortable being alone with my thoughts.' },

  // Day: 2026-02-13
  { date: '2026-02-13', category: 'values', answer: '', questionText: 'I follow rules by conscious choice, not just habit.' },
  { date: '2026-02-13', category: 'values', answer: '', questionText: 'Imagination plays an active role in my daily life.' },
  { date: '2026-02-13', category: 'archetypes', answer: '', questionText: 'I have exiled a part of myself that I need to welcome back.' },
  { date: '2026-02-13', category: 'archetypes', answer: '', questionText: 'Exploration has revealed truths I could never have found by staying put.' },
  { date: '2026-02-13', category: 'cognitive', answer: '', questionText: 'Sleep and rest noticeably improve my ability to solve problems.' },
  { date: '2026-02-13', category: 'cognitive', answer: '', questionText: 'I teach myself new things independently and successfully.' },
  { date: '2026-02-13', category: 'intelligence', answer: '', questionText: 'I trust the signals my body sends me.' },
  { date: '2026-02-13', category: 'intelligence', answer: '', questionText: 'I notice visual details others miss.' },

  // Day: 2026-02-14
  { date: '2026-02-14', category: 'values', answer: '', questionText: 'I listen to my body before it shouts at me.' },
  { date: '2026-02-14', category: 'values', answer: '', questionText: 'I create spaces where others feel they belong.' },
  { date: '2026-02-14', category: 'values', answer: '', questionText: 'I can be present with someone\'s pain without needing to fix it.' },
  { date: '2026-02-14', category: 'archetypes', answer: '', questionText: 'My deepest intuition has a clear sense of where my life is headed.' },
  { date: '2026-02-14', category: 'archetypes', answer: '', questionText: 'I show up differently in each of my life roles, and I\'m aware of how.' },
  { date: '2026-02-14', category: 'archetypes', answer: '', questionText: 'I understand the difference between knowledge and true wisdom.' },
  { date: '2026-02-14', category: 'cognitive', answer: '', questionText: 'I extract surprising lessons from mundane experiences.' },
  { date: '2026-02-14', category: 'cognitive', answer: '', questionText: 'I wish I could recover a forgotten memory that feels important.' },
  { date: '2026-02-14', category: 'cognitive', answer: '', questionText: 'I appreciate and learn from elegant solutions to complex problems.' },
  { date: '2026-02-14', category: 'intelligence', answer: '', questionText: 'I am drawn to natural textures — wood, stone, water, soil.' },
  { date: '2026-02-14', category: 'intelligence', answer: '', questionText: 'I am comfortable with ambiguity about who I am.' },
  { date: '2026-02-14', category: 'intelligence', answer: '', questionText: 'I feel a strong connection to animals.' },

  // Day: 2026-02-15
  { date: '2026-02-15', category: 'values', answer: '', questionText: 'I experience the sacred in ways that are personal and real to me.' },
  { date: '2026-02-15', category: 'values', answer: '', questionText: 'My presence has the kind of effect on others that I want it to have.' },
  { date: '2026-02-15', category: 'archetypes', answer: '', questionText: 'I share power in my relationships rather than accumulating it.' },
  { date: '2026-02-15', category: 'archetypes', answer: '', questionText: 'I integrate my dark side without acting it out destructively.' },
  { date: '2026-02-15', category: 'cognitive', answer: '', questionText: 'Mindfulness or meditation is an active part of my life.' },
  { date: '2026-02-15', category: 'cognitive', answer: '', questionText: 'Pressure enhances rather than hinders my ability to learn.' },
  { date: '2026-02-15', category: 'intelligence', answer: '', questionText: 'I am drawn to questions about identity — what makes me "me."' },
  { date: '2026-02-15', category: 'intelligence', answer: '', questionText: 'I am uncomfortable with surface-level answers to deep questions.' },

  // Day: 2026-02-16
  { date: '2026-02-16', category: 'values', answer: '', questionText: 'There are people in my life who love the real me without performance.' },
  { date: '2026-02-16', category: 'values', answer: '', questionText: 'I prioritise restoration over obligation when I need to.' },
  { date: '2026-02-16', category: 'archetypes', answer: '', questionText: 'I remain humble even when I know I\'m right.' },
  { date: '2026-02-16', category: 'archetypes', answer: '', questionText: 'I can tell when I\'m code-switching versus losing myself.' },
  { date: '2026-02-16', category: 'cognitive', answer: '', questionText: 'My most vivid memories are emotional rather than visual or factual.' },
  { date: '2026-02-16', category: 'cognitive', answer: '', questionText: 'I balance breadth and depth effectively when exploring a new topic.' },
  { date: '2026-02-16', category: 'intelligence', answer: '', questionText: 'I classify and categorise natural phenomena instinctively.' },
  { date: '2026-02-16', category: 'intelligence', answer: '', questionText: 'I feel connected to something larger than myself.' },

  // Day: 2026-02-17
  { date: '2026-02-17', category: 'values', answer: '', questionText: 'My ethical understanding comes more from experience than instruction.' },
  { date: '2026-02-17', category: 'values', answer: '', questionText: 'Resilience is a quality I embody, not just admire.' },
  { date: '2026-02-17', category: 'values', answer: '', questionText: 'I am clear about where my responsibility ends and someone else\'s begins.' },
  { date: '2026-02-17', category: 'archetypes', answer: '', questionText: 'I am strong without being hard or rigid.' },
  { date: '2026-02-17', category: 'archetypes', answer: '', questionText: 'I empower others without depleting myself.' },
  { date: '2026-02-17', category: 'archetypes', answer: '', questionText: 'I let people in without feeling dangerously exposed.' },
  { date: '2026-02-17', category: 'cognitive', answer: '', questionText: 'Complex, challenging problems energise me.' },
  { date: '2026-02-17', category: 'cognitive', answer: '', questionText: 'I use constraints to boost my creativity.' },
  { date: '2026-02-17', category: 'cognitive', answer: '', questionText: 'I handle situations requiring pure logic with no room for feeling.' },
  { date: '2026-02-17', category: 'intelligence', answer: '', questionText: 'Rhythm and tempo affect my energy and pace throughout the day.' },
  { date: '2026-02-17', category: 'intelligence', answer: '', questionText: 'I doodle, sketch, or draw when thinking.' },
  { date: '2026-02-17', category: 'intelligence', answer: '', questionText: 'I can navigate by mental maps rather than written directions.' },

  // Day: 2026-02-18
  { date: '2026-02-18', category: 'values', answer: '', questionText: 'I feel a deep sense of belonging when I am outside.' },
  { date: '2026-02-18', category: 'values', answer: '', questionText: 'I nurture myself with the same care I give others.' },
  { date: '2026-02-18', category: 'archetypes', answer: '', questionText: 'I reinvent myself while staying true to my core.' },
  { date: '2026-02-18', category: 'archetypes', answer: '', questionText: 'I bring the lessons of my seeking back to the people I love.' },
  { date: '2026-02-18', category: 'cognitive', answer: '', questionText: 'I learn as much from failure as I do from success.' },
  { date: '2026-02-18', category: 'cognitive', answer: '', questionText: 'I notice trends in my mood, energy, or focus across a typical week.' },
  { date: '2026-02-18', category: 'intelligence', answer: '', questionText: 'I enjoy teaching, mentoring, or guiding others.' },
  { date: '2026-02-18', category: 'intelligence', answer: '', questionText: 'I think about humanity\'s place in the universe.' },

  // Day: 2026-02-19
  { date: '2026-02-19', category: 'values', answer: '', questionText: 'I am living in a way I would want my grandchildren to know about.' },
  { date: '2026-02-19', category: 'values', answer: '', questionText: 'I would create freely if I didn\'t worry about the result being good.' },
  { date: '2026-02-19', category: 'archetypes', answer: '', questionText: 'I understand something about wisdom that most people miss.' },
  { date: '2026-02-19', category: 'archetypes', answer: '', questionText: 'My daily actions are aligned with my deeper purpose.' },
  { date: '2026-02-19', category: 'cognitive', answer: '', questionText: 'Daily reflection continues to reveal surprising things about my mind.' },
  { date: '2026-02-19', category: 'cognitive', answer: '', questionText: 'Understanding my own cognitive style has been genuinely useful.' },
  { date: '2026-02-19', category: 'intelligence', answer: '', questionText: 'I enjoy strategy games, chess, or competitive thinking.' },
  { date: '2026-02-19', category: 'intelligence', answer: '', questionText: 'I enjoy networking and building connections.' },

  // Day: 2026-02-20
  { date: '2026-02-20', category: 'values', answer: '', questionText: 'My relationships have taught me life\'s most valuable lessons.' },
  { date: '2026-02-20', category: 'values', answer: '', questionText: 'I carry invisible emotional labour that others don\'t see.' },
  { date: '2026-02-20', category: 'values', answer: '', questionText: 'There are things about me I wish people would ask about.' },
  { date: '2026-02-20', category: 'archetypes', answer: '', questionText: 'I am in a chrysalis stage of deep personal transformation.' },
  { date: '2026-02-20', category: 'archetypes', answer: '', questionText: 'I am deeply attached to at least one defence mechanism.' },
  { date: '2026-02-20', category: 'archetypes', answer: '', questionText: 'There is a gap between who I am and who others need me to be.' },
  { date: '2026-02-20', category: 'cognitive', answer: '', questionText: 'My relationship with risk has matured and become healthier over time.' },
  { date: '2026-02-20', category: 'cognitive', answer: '', questionText: 'Analysis paralysis prevents me from acting when I need to.' },
  { date: '2026-02-20', category: 'cognitive', answer: '', questionText: 'I see a clear relationship between what I remember and who I\'m becoming.' },
  { date: '2026-02-20', category: 'intelligence', answer: '', questionText: 'I am fascinated by how different cultures understand death and the divine.' },
  { date: '2026-02-20', category: 'intelligence', answer: '', questionText: 'I think about free will and whether our choices are truly ours.' },
  { date: '2026-02-20', category: 'intelligence', answer: '', questionText: 'I evaluate arguments by their structure, not just their content.' },

  // Day: 2026-02-21
  { date: '2026-02-21', category: 'values', answer: '', questionText: 'Time in nature restores me in a way nothing else does.' },
  { date: '2026-02-21', category: 'values', answer: '', questionText: 'I am spending my time on what I would prioritise if it were limited.' },
  { date: '2026-02-21', category: 'archetypes', answer: '', questionText: 'I react strongly when someone sees a part of me I try to hide.' },
  { date: '2026-02-21', category: 'archetypes', answer: '', questionText: 'My core wants something that the world doesn\'t make easy.' },
  { date: '2026-02-21', category: 'cognitive', answer: '', questionText: 'Writing plays an active role in how I process my thoughts.' },
  { date: '2026-02-21', category: 'cognitive', answer: '', questionText: 'I break large problems into smaller, manageable pieces naturally.' },
  { date: '2026-02-21', category: 'intelligence', answer: '', questionText: 'I use my body to express what words cannot.' },
  { date: '2026-02-21', category: 'intelligence', answer: '', questionText: 'I can trace my current mood back to its origin.' },

  // Day: 2026-02-22
  { date: '2026-02-22', category: 'values', answer: '', questionText: 'I tend to hold onto things — possessions, people, certainty — out of fear.' },
  { date: '2026-02-22', category: 'values', answer: '', questionText: 'I feel safe even when the world feels uncertain.' },
  { date: '2026-02-22', category: 'archetypes', answer: '', questionText: 'I find deep meaning in mundane, everyday moments.' },
  { date: '2026-02-22', category: 'archetypes', answer: '', questionText: 'I balance careful analysis with gut intuition effectively.' },
  { date: '2026-02-22', category: 'cognitive', answer: '', questionText: 'I protect my creative flow from the things that kill it.' },
  { date: '2026-02-22', category: 'cognitive', answer: '', questionText: 'I handle information overload without becoming overwhelmed.' },
  { date: '2026-02-22', category: 'intelligence', answer: '', questionText: 'I instinctively create systems and frameworks to manage my life.' },
  { date: '2026-02-22', category: 'intelligence', answer: '', questionText: 'I naturally move or sway to rhythmic sounds.' },

  // Day: 2026-02-23
  { date: '2026-02-23', category: 'values', answer: '', questionText: 'Nature has provided comfort during some of my hardest moments.' },
  { date: '2026-02-23', category: 'values', answer: '', questionText: 'Breaking my own self-imposed rules has taught me something.' },
  { date: '2026-02-23', category: 'values', answer: '', questionText: 'I have recently felt misunderstood in a way that revealed a deeper need.' },
  { date: '2026-02-23', category: 'archetypes', answer: '', questionText: 'A label I once identified with no longer fits me.' },
  { date: '2026-02-23', category: 'archetypes', answer: '', questionText: 'I take care of others more than others take care of me.' },
  { date: '2026-02-23', category: 'archetypes', answer: '', questionText: 'Enchantment and wonder are alive in my adult life.' },
  { date: '2026-02-23', category: 'cognitive', answer: '', questionText: 'I handle disagreements about shared memories gracefully.' },
  { date: '2026-02-23', category: 'cognitive', answer: '', questionText: 'I recognise and correct the cognitive biases that affect my risk assessment.' },
  { date: '2026-02-23', category: 'cognitive', answer: '', questionText: 'The same thinking habit loops back when I\'m under stress.' },
  { date: '2026-02-23', category: 'intelligence', answer: '', questionText: 'I think of life events as having a soundtrack.' },
  { date: '2026-02-23', category: 'intelligence', answer: '', questionText: 'I spot patterns in data or information quickly.' },
  { date: '2026-02-23', category: 'intelligence', answer: '', questionText: 'I find it easy to parallel park or navigate tight spaces.' },

  // Day: 2026-02-24
  { date: '2026-02-24', category: 'values', answer: '', questionText: 'I choose long-term fulfilment over short-term gratification.' },
  { date: '2026-02-24', category: 'values', answer: '', questionText: 'I balance personal freedom with responsibility to people I love.' },
  { date: '2026-02-24', category: 'archetypes', answer: '', questionText: 'Unknown territory excites me more than it scares me right now.' },
  { date: '2026-02-24', category: 'archetypes', answer: '', questionText: 'I act differently when no one is watching.' },
  { date: '2026-02-24', category: 'cognitive', answer: '', questionText: 'I manage involuntary rumination effectively.' },
  { date: '2026-02-24', category: 'cognitive', answer: '', questionText: 'I maintain balanced thinking — neither too emotional nor too analytical.' },
  { date: '2026-02-24', category: 'intelligence', answer: '', questionText: 'I notice the emotional key of a piece of music immediately.' },
  { date: '2026-02-24', category: 'intelligence', answer: '', questionText: 'I naturally take the lead in social situations.' },

  // Day: 2026-02-25
  { date: '2026-02-25', category: 'values', answer: '', questionText: 'I know the line between disarming humor and avoidant humor.' },
  { date: '2026-02-25', category: 'values', answer: '', questionText: 'My daydreams reveal something true about my desires.' },
  { date: '2026-02-25', category: 'archetypes', answer: '', questionText: 'I play a specific, recognisable role in my friends\' lives.' },
  { date: '2026-02-25', category: 'archetypes', answer: '', questionText: 'My public identity has diverged from who I really am.' },
  { date: '2026-02-25', category: 'cognitive', answer: '', questionText: 'I apply lessons from my past daily without even thinking about it.' },
  { date: '2026-02-25', category: 'cognitive', answer: '', questionText: 'My energy level and my thinking quality are closely connected.' },
  { date: '2026-02-25', category: 'intelligence', answer: '', questionText: 'I can tell when group dynamics shift.' },
  { date: '2026-02-25', category: 'intelligence', answer: '', questionText: 'I feel that nature teaches me things no book can.' },

  // Day: 2026-02-26
  { date: '2026-02-26', category: 'values', answer: '', questionText: 'Loyalty is important to me, but I recognise its limits.' },
  { date: '2026-02-26', category: 'values', answer: '', questionText: 'I balance planning with surrendering to what I cannot control.' },
  { date: '2026-02-26', category: 'values', answer: '', questionText: 'My online presence reflects who I actually am.' },
  { date: '2026-02-26', category: 'archetypes', answer: '', questionText: 'My rational mind and my emotional mind have very different priorities.' },
  { date: '2026-02-26', category: 'archetypes', answer: '', questionText: 'My sense of self shifts depending on who I\'m with.' },
  { date: '2026-02-26', category: 'archetypes', answer: '', questionText: 'My caring nature has at times felt like a prison.' },
  { date: '2026-02-26', category: 'cognitive', answer: '', questionText: 'I detect subtext and unspoken meaning in conversations.' },
  { date: '2026-02-26', category: 'cognitive', answer: '', questionText: 'I make good decisions with high stakes and limited information.' },
  { date: '2026-02-26', category: 'cognitive', answer: '', questionText: 'I process and learn from my mistakes effectively after they happen.' },
  { date: '2026-02-26', category: 'intelligence', answer: '', questionText: 'I notice when correlation is mistaken for causation.' },
  { date: '2026-02-26', category: 'intelligence', answer: '', questionText: 'I feel drained by superficial interactions.' },
  { date: '2026-02-26', category: 'intelligence', answer: '', questionText: 'I enjoy cooking with fresh, seasonal, or wild ingredients.' },

  // Day: 2026-02-27
  { date: '2026-02-27', category: 'values', answer: '', questionText: 'I can distinguish between challenges worth pushing through and ones to release.' },
  { date: '2026-02-27', category: 'values', answer: '', questionText: 'Playfulness is an active part of my adult life.' },
  { date: '2026-02-27', category: 'archetypes', answer: '', questionText: 'A deep fear underlies my need for control.' },
  { date: '2026-02-27', category: 'archetypes', answer: '', questionText: 'A recurring dream or image keeps appearing in my life.' },
  { date: '2026-02-27', category: 'cognitive', answer: '', questionText: 'I become aware of new patterns in my life on a regular basis.' },
  { date: '2026-02-27', category: 'cognitive', answer: '', questionText: 'Deadlines improve the quality of my thinking.' },
  { date: '2026-02-27', category: 'intelligence', answer: '', questionText: 'I feel inspired or calmed by specific landscapes or environments.' },
  { date: '2026-02-27', category: 'intelligence', answer: '', questionText: 'I enjoy personality tests and frameworks for self-understanding.' },

  // Day: 2026-02-28
  { date: '2026-02-28', category: 'values', answer: '', questionText: 'Fairness is reflected in how I treat the people closest to me.' },
  { date: '2026-02-28', category: 'values', answer: '', questionText: 'I find elegance in the straightforward solution.' },
  { date: '2026-02-28', category: 'archetypes', answer: '', questionText: 'A part of me needs to be seen but is too afraid to be visible.' },
  { date: '2026-02-28', category: 'archetypes', answer: '', questionText: 'A part of me craves stability while another part craves chaos.' },
  { date: '2026-02-28', category: 'cognitive', answer: '', questionText: 'I know exactly what question I\'d most love someone to ask me right now.' },
  { date: '2026-02-28', category: 'cognitive', answer: '', questionText: 'My mood influences which memories surface.' },
  { date: '2026-02-28', category: 'intelligence', answer: '', questionText: 'I thrive on teamwork and collaboration.' },
  { date: '2026-02-28', category: 'intelligence', answer: '', questionText: 'I spend time curating playlists for different moods.' },

  // Day: 2026-03-01
  { date: '2026-03-01', category: 'values', answer: '', questionText: 'My days generally reflect what I consider a well-lived life.' },
  { date: '2026-03-01', category: 'values', answer: '', questionText: 'I exercise autonomy in my daily decisions.' },
  { date: '2026-03-01', category: 'values', answer: '', questionText: 'I protect white space in my life — time with no agenda.' },
  { date: '2026-03-01', category: 'archetypes', answer: '', questionText: 'I stay in contact with the mythic dimension of my life.' },
  { date: '2026-03-01', category: 'archetypes', answer: '', questionText: 'I hold the tension between rational understanding and deeper knowing.' },
  { date: '2026-03-01', category: 'archetypes', answer: '', questionText: 'I show courage even when fear is overwhelming.' },
  { date: '2026-03-01', category: 'cognitive', answer: '', questionText: 'I evaluate worst-case scenarios without catastrophising.' },
  { date: '2026-03-01', category: 'cognitive', answer: '', questionText: 'I make important decisions with clarity and confidence.' },
  { date: '2026-03-01', category: 'cognitive', answer: '', questionText: 'Technology has fundamentally changed how I think and communicate.' },
  { date: '2026-03-01', category: 'intelligence', answer: '', questionText: 'A song can change my entire emotional state in seconds.' },
  { date: '2026-03-01', category: 'intelligence', answer: '', questionText: 'I like building mental models of how things work.' },
  { date: '2026-03-01', category: 'intelligence', answer: '', questionText: 'I can read the sky and sense the time or season without a clock.' },

  // Day: 2026-03-02
  { date: '2026-03-02', category: 'values', answer: '', questionText: 'Faith — in whatever form it takes for me — plays a real role in my daily life.' },
  { date: '2026-03-02', category: 'values', answer: '', questionText: 'A moment of unexpected abundance recently reminded me of what truly matters.' },
  { date: '2026-03-02', category: 'archetypes', answer: '', questionText: 'My life would look very different if I cared for myself first.' },
  { date: '2026-03-02', category: 'archetypes', answer: '', questionText: 'My contrarian nature both helps and isolates me.' },
  { date: '2026-03-02', category: 'cognitive', answer: '', questionText: 'Quick decisions work out well for me.' },
  { date: '2026-03-02', category: 'cognitive', answer: '', questionText: 'I think about probability naturally in everyday decisions.' },
  { date: '2026-03-02', category: 'intelligence', answer: '', questionText: 'I can sense hidden motives in conversations.' },
  { date: '2026-03-02', category: 'intelligence', answer: '', questionText: 'I feel that exploring these questions is a core part of who I am.' },

  // Day: 2026-03-03
  { date: '2026-03-03', category: 'values', answer: '', questionText: 'I would live differently if no one was judging me.' },
  { date: '2026-03-03', category: 'values', answer: '', questionText: 'I balance generosity with self-preservation.' },
  { date: '2026-03-03', category: 'archetypes', answer: '', questionText: 'I turn self-awareness into actual change, not just insight.' },
  { date: '2026-03-03', category: 'archetypes', answer: '', questionText: 'I stay authentic during periods of rapid personal growth.' },
  { date: '2026-03-03', category: 'cognitive', answer: '', questionText: 'I use my understanding of patterns to plan and prepare effectively.' },
  { date: '2026-03-03', category: 'cognitive', answer: '', questionText: 'I rely on feeling rather than analysis when encountering a stranger.' },
  { date: '2026-03-03', category: 'intelligence', answer: '', questionText: 'I feel a strong pull to understand human behaviour.' },
  { date: '2026-03-03', category: 'intelligence', answer: '', questionText: 'I set boundaries based on deep self-knowledge.' },

  // Day: 2026-03-04
  { date: '2026-03-04', category: 'values', answer: '', questionText: 'I keep doing things I wish I had the courage to quit.' },
  { date: '2026-03-04', category: 'values', answer: '', questionText: 'My inner world feels vivid and rich today.' },
  { date: '2026-03-04', category: 'values', answer: '', questionText: 'Spiritual growth is meaningful to me regardless of religion.' },
  { date: '2026-03-04', category: 'archetypes', answer: '', questionText: 'A role is calling me that feels both exciting and terrifying.' },
  { date: '2026-03-04', category: 'archetypes', answer: '', questionText: 'I honour the mystery within myself.' },
  { date: '2026-03-04', category: 'archetypes', answer: '', questionText: 'I resist the temptation to use power to avoid painful feelings.' },
  { date: '2026-03-04', category: 'cognitive', answer: '', questionText: 'I learn by doing rather than by reading instructions.' },
  { date: '2026-03-04', category: 'cognitive', answer: '', questionText: 'I use reflection actively to improve my thinking process.' },
  { date: '2026-03-04', category: 'cognitive', answer: '', questionText: 'I am actively shifting a recurring theme in my life.' },
  { date: '2026-03-04', category: 'intelligence', answer: '', questionText: 'I prefer standing or walking to sitting.' },
  { date: '2026-03-04', category: 'intelligence', answer: '', questionText: 'I learn by doing — hands-on experience beats reading.' },
  { date: '2026-03-04', category: 'intelligence', answer: '', questionText: 'I focus better with the right kind of background music.' },

  // Day: 2026-03-05
  { date: '2026-03-05', category: 'values', answer: '', questionText: 'I create space for spontaneity even within a structured life.' },
  { date: '2026-03-05', category: 'values', answer: '', questionText: 'I am fully honest with myself about how I feel right now.' },
  { date: '2026-03-05', category: 'archetypes', answer: '', questionText: 'Opposing traits within me create my unique character.' },
  { date: '2026-03-05', category: 'archetypes', answer: '', questionText: 'Settling has felt right to me rather than suffocating.' },
  { date: '2026-03-05', category: 'cognitive', answer: '', questionText: 'Daily reflection has revealed valuable things about myself.' },
  { date: '2026-03-05', category: 'cognitive', answer: '', questionText: 'I convey nuance effectively even when words feel insufficient.' },
  { date: '2026-03-05', category: 'intelligence', answer: '', questionText: 'I form meaningful connections quickly.' },
  { date: '2026-03-05', category: 'intelligence', answer: '', questionText: 'I notice my own cognitive biases in action.' },

  // Day: 2026-03-06
  { date: '2026-03-06', category: 'values', answer: '', questionText: 'I need to give myself permission to stop doing something.' },
  { date: '2026-03-06', category: 'values', answer: '', questionText: 'I treat myself with compassion when I fall short.' },
  { date: '2026-03-06', category: 'archetypes', answer: '', questionText: 'I find the sacred in everyday moments.' },
  { date: '2026-03-06', category: 'archetypes', answer: '', questionText: 'I channel my energy into something meaningful each day.' },
  { date: '2026-03-06', category: 'cognitive', answer: '', questionText: 'A specific memory has shaped how I think today.' },
  { date: '2026-03-06', category: 'cognitive', answer: '', questionText: 'I share new ideas despite the vulnerability it requires.' },
  { date: '2026-03-06', category: 'intelligence', answer: '', questionText: 'I am naturally athletic or physically coordinated.' },
  { date: '2026-03-06', category: 'intelligence', answer: '', questionText: 'Music significantly affects my mood.' },

  // Day: 2026-03-07
  { date: '2026-03-07', category: 'values', answer: '', questionText: 'Freedom means something specific and important to me right now.' },
  { date: '2026-03-07', category: 'values', answer: '', questionText: 'I would defend my core principles even if I stood alone.' },
  { date: '2026-03-07', category: 'values', answer: '', questionText: 'I can tell when a relationship is nourishing versus draining.' },
  { date: '2026-03-07', category: 'archetypes', answer: '', questionText: 'My masks sometimes protect me and sometimes trap me.' },
  { date: '2026-03-07', category: 'archetypes', answer: '', questionText: 'I find meaning in the search itself, not just the destination.' },
  { date: '2026-03-07', category: 'archetypes', answer: '', questionText: 'A paradox within me has become a source of creative energy.' },
  { date: '2026-03-07', category: 'cognitive', answer: '', questionText: 'I sleep on important decisions before finalising them.' },
  { date: '2026-03-07', category: 'cognitive', answer: '', questionText: 'I make confident bets on myself and my abilities.' },
  { date: '2026-03-07', category: 'cognitive', answer: '', questionText: 'I recover my focus quickly after an interruption.' },
  { date: '2026-03-07', category: 'intelligence', answer: '', questionText: 'I think better when I am moving.' },
  { date: '2026-03-07', category: 'intelligence', answer: '', questionText: 'I prefer learning through physical demonstration.' },
  { date: '2026-03-07', category: 'intelligence', answer: '', questionText: 'I have a strong inner compass that guides my decisions.' },

  // Day: 2026-03-08
  { date: '2026-03-08', category: 'values', answer: '', questionText: 'Caring for the natural world feels like a personal responsibility to me.' },
  { date: '2026-03-08', category: 'values', answer: '', questionText: 'I fully honour my own boundaries.' },
  { date: '2026-03-08', category: 'archetypes', answer: '', questionText: 'I am rewriting an old story I used to believe about myself.' },
  { date: '2026-03-08', category: 'archetypes', answer: '', questionText: 'I can sense the line between empathy and enmeshment.' },
  { date: '2026-03-08', category: 'cognitive', answer: '', questionText: 'I manage the anxiety of irreversible decisions calmly.' },
  { date: '2026-03-08', category: 'cognitive', answer: '', questionText: 'I am attuned to my body\'s signals of danger or opportunity.' },
  { date: '2026-03-08', category: 'intelligence', answer: '', questionText: 'I approach creative work with analytical precision.' },
  { date: '2026-03-08', category: 'intelligence', answer: '', questionText: 'I notice when I am projecting my feelings onto others.' },

  // Day: 2026-03-09
  { date: '2026-03-09', category: 'values', answer: '', questionText: 'A boundary I set has improved an important relationship.' },
  { date: '2026-03-09', category: 'values', answer: '', questionText: 'I actively celebrate the people I love.' },
  { date: '2026-03-09', category: 'archetypes', answer: '', questionText: 'I handle being wrong about something I was certain of with openness.' },
  { date: '2026-03-09', category: 'archetypes', answer: '', questionText: 'What I\'m chasing is sometimes a way of running from something else.' },
  { date: '2026-03-09', category: 'cognitive', answer: '', questionText: 'I distinguish between a genuinely good idea and an exciting but impractical one.' },
  { date: '2026-03-09', category: 'cognitive', answer: '', questionText: 'I manage my greatest cognitive distraction effectively.' },
  { date: '2026-03-09', category: 'intelligence', answer: '', questionText: 'I notice how light changes throughout the day.' },
  { date: '2026-03-09', category: 'intelligence', answer: '', questionText: 'I regularly check in with my own emotional state.' },

  // Day: 2026-03-10
  { date: '2026-03-10', category: 'values', answer: '', questionText: 'Specific injustices move me to action more than others.' },
  { date: '2026-03-10', category: 'values', answer: '', questionText: 'I have a form of expression that feels completely natural to me.' },
  { date: '2026-03-10', category: 'values', answer: '', questionText: 'I can hold space for someone whose actions I disagree with.' },
  { date: '2026-03-10', category: 'archetypes', answer: '', questionText: 'There is something in me that needs to die in order for me to grow.' },
  { date: '2026-03-10', category: 'archetypes', answer: '', questionText: 'My relationships help me find and refine my sense of purpose.' },
  { date: '2026-03-10', category: 'archetypes', answer: '', questionText: 'I naturally question authority and established systems.' },
  { date: '2026-03-10', category: 'cognitive', answer: '', questionText: 'I notice subtle signals that others miss.' },
  { date: '2026-03-10', category: 'cognitive', answer: '', questionText: 'I remain creative even under pressure.' },
  { date: '2026-03-10', category: 'cognitive', answer: '', questionText: 'I handle conflicting advice from people I trust with clarity.' },
  { date: '2026-03-10', category: 'intelligence', answer: '', questionText: 'Scientific reasoning excites me more than artistic expression.' },
  { date: '2026-03-10', category: 'intelligence', answer: '', questionText: 'I notice ecological patterns — migration, bloom cycles, tides.' },
  { date: '2026-03-10', category: 'intelligence', answer: '', questionText: 'I feel that compassion is the highest expression of intelligence.' },

  // Day: 2026-03-11
  { date: '2026-03-11', category: 'values', answer: '', questionText: 'Total freedom, without any structure, would actually scare me.' },
  { date: '2026-03-11', category: 'values', answer: '', questionText: 'People who know me well still have much to discover about me.' },
  { date: '2026-03-11', category: 'archetypes', answer: '', questionText: 'Part of my identity feels actively under construction right now.' },
  { date: '2026-03-11', category: 'archetypes', answer: '', questionText: 'I would pursue a specific role in the world if nothing held me back.' },
  { date: '2026-03-11', category: 'cognitive', answer: '', questionText: 'I distinguish productive concern from anxious rumination.' },
  { date: '2026-03-11', category: 'cognitive', answer: '', questionText: 'Understanding how I think has improved my relationships.' },
  { date: '2026-03-11', category: 'intelligence', answer: '', questionText: 'I use self-knowledge to navigate relationships more effectively.' },
  { date: '2026-03-11', category: 'intelligence', answer: '', questionText: 'I remember things better when I write them down.' },

  // Day: 2026-03-12
  { date: '2026-03-12', category: 'values', answer: '', questionText: 'There is a person, place, or thing that represents home to me.' },
  { date: '2026-03-12', category: 'values', answer: '', questionText: 'There is an area of my life that feels destabilisingly uncertain.' },
  { date: '2026-03-12', category: 'archetypes', answer: '', questionText: 'I can envision what the integration of my conflicting parts would look like.' },
  { date: '2026-03-12', category: 'archetypes', answer: '', questionText: 'I can sit comfortably with the discomfort of not knowing.' },
  { date: '2026-03-12', category: 'cognitive', answer: '', questionText: 'I create ideal conditions for my best thinking.' },
  { date: '2026-03-12', category: 'cognitive', answer: '', questionText: 'I read people accurately through intuitive perception.' },
  { date: '2026-03-12', category: 'intelligence', answer: '', questionText: 'I negotiate well because I understand what each side needs.' },
  { date: '2026-03-12', category: 'intelligence', answer: '', questionText: 'I am drawn to systems that help me understand myself — astrology, psychology, typology.' },

  // Day: 2026-03-13
  { date: '2026-03-13', category: 'values', answer: '', questionText: 'Family — however I define it — is central to who I am.' },
  { date: '2026-03-13', category: 'values', answer: '', questionText: 'A creative dream I set aside still whispers to me.' },
  { date: '2026-03-13', category: 'values', answer: '', questionText: 'Being truly seen by someone feels natural and welcome to me.' },
  { date: '2026-03-13', category: 'archetypes', answer: '', questionText: 'Some of my personas serve a genuine purpose while others are just armour.' },
  { date: '2026-03-13', category: 'archetypes', answer: '', questionText: 'I balance confidence with genuine humility.' },
  { date: '2026-03-13', category: 'archetypes', answer: '', questionText: 'I lead without needing to control.' },
  { date: '2026-03-13', category: 'cognitive', answer: '', questionText: 'I return to the same subject again and again because it captivates me.' },
  { date: '2026-03-13', category: 'cognitive', answer: '', questionText: 'I protect my attention as the finite resource it is.' },
  { date: '2026-03-13', category: 'cognitive', answer: '', questionText: 'I mentally replay certain life experiences more than others.' },
  { date: '2026-03-13', category: 'intelligence', answer: '', questionText: 'I feel physical pain at environmental destruction.' },
  { date: '2026-03-13', category: 'intelligence', answer: '', questionText: 'I feel physical discomfort in overly artificial environments.' },
  { date: '2026-03-13', category: 'intelligence', answer: '', questionText: 'I enjoy physical rituals — stretching, yoga, breathwork.' },

  // Day: 2026-03-14
  { date: '2026-03-14', category: 'values', answer: '', questionText: 'I am living in a way I want to be remembered for.' },
  { date: '2026-03-14', category: 'values', answer: '', questionText: 'The person I am and the person I want to be are growing closer together.' },
  { date: '2026-03-14', category: 'archetypes', answer: '', questionText: 'I ask for help instead of pushing through alone.' },
  { date: '2026-03-14', category: 'archetypes', answer: '', questionText: 'I am trying to satisfy opposing desires at the same time.' },
  { date: '2026-03-14', category: 'cognitive', answer: '', questionText: 'I apply my thinking strengths across new and unfamiliar domains.' },
  { date: '2026-03-14', category: 'cognitive', answer: '', questionText: 'I handle being wrong about a pattern I thought I saw with humility.' },
  { date: '2026-03-14', category: 'intelligence', answer: '', questionText: 'People come to me for advice or emotional support.' },
  { date: '2026-03-14', category: 'intelligence', answer: '', questionText: 'I prefer deep one-on-one conversations over large groups.' },

  // Day: 2026-03-15
  { date: '2026-03-15', category: 'values', answer: '', questionText: 'I have given care that I am genuinely proud of.' },
  { date: '2026-03-15', category: 'values', answer: '', questionText: 'I feel both free and responsible at the same time.' },
  { date: '2026-03-15', category: 'archetypes', answer: '', questionText: 'My emotional life is actively evolving.' },
  { date: '2026-03-15', category: 'archetypes', answer: '', questionText: 'I have surprised myself by how much I\'ve changed.' },
  { date: '2026-03-15', category: 'cognitive', answer: '', questionText: 'I explain complex ideas clearly to people unfamiliar with the subject.' },
  { date: '2026-03-15', category: 'cognitive', answer: '', questionText: 'I operate from my focused self far more than my scattered self.' },
  { date: '2026-03-15', category: 'intelligence', answer: '', questionText: 'I am drawn to philosophy, theology, or existential literature.' },
  { date: '2026-03-15', category: 'intelligence', answer: '', questionText: 'I feel more mentally clear after exercise.' },

  // Day: 2026-03-16
  { date: '2026-03-16', category: 'values', answer: '', questionText: 'My relationship with risk has matured over time.' },
  { date: '2026-03-16', category: 'values', answer: '', questionText: 'I belong to myself even when I don\'t fit a group.' },
  { date: '2026-03-16', category: 'values', answer: '', questionText: 'Past setbacks have redirected me toward something better.' },
  { date: '2026-03-16', category: 'archetypes', answer: '', questionText: 'I bring a specific energy to a room, and it\'s intentional.' },
  { date: '2026-03-16', category: 'archetypes', answer: '', questionText: 'I carry shame that protects something vulnerable in me.' },
  { date: '2026-03-16', category: 'archetypes', answer: '', questionText: 'Sitting with my darkest feelings reveals something I need to see.' },
  { date: '2026-03-16', category: 'cognitive', answer: '', questionText: 'I pay attention to things I usually overlook.' },
  { date: '2026-03-16', category: 'cognitive', answer: '', questionText: 'I remember how people made me feel more than what they said.' },
  { date: '2026-03-16', category: 'cognitive', answer: '', questionText: 'My mood positively influences how I approach obstacles.' },
  { date: '2026-03-16', category: 'intelligence', answer: '', questionText: 'Physical touch is an important part of how I connect with people.' },
  { date: '2026-03-16', category: 'intelligence', answer: '', questionText: 'I express emotions through body language and gesture.' },
  { date: '2026-03-16', category: 'intelligence', answer: '', questionText: 'I use music therapeutically — to regulate, energise, or ground myself.' },

  // Day: 2026-03-17
  { date: '2026-03-17', category: 'values', answer: '', questionText: 'Asking for help is something I do when I need it.' },
  { date: '2026-03-17', category: 'values', answer: '', questionText: 'I can make confident choices between two things that both matter.' },
  { date: '2026-03-17', category: 'archetypes', answer: '', questionText: 'I reveal my true self slowly and deliberately to new people.' },
  { date: '2026-03-17', category: 'archetypes', answer: '', questionText: 'I handle the discomfort of asking for help.' },
  { date: '2026-03-17', category: 'cognitive', answer: '', questionText: 'Specific communication styles trigger frustration in me.' },
  { date: '2026-03-17', category: 'cognitive', answer: '', questionText: 'My trust in my own intuition has grown over the years.' },
  { date: '2026-03-17', category: 'intelligence', answer: '', questionText: 'I feel that silence and stillness reveal truths that activity cannot.' },
  { date: '2026-03-17', category: 'intelligence', answer: '', questionText: 'I am deeply self-motivated — external encouragement is nice but not necessary.' },

  // Day: 2026-03-18
  { date: '2026-03-18', category: 'values', answer: '', questionText: 'I treat my physical health as a foundation, not an afterthought.' },
  { date: '2026-03-18', category: 'values', answer: '', questionText: 'A lesson keeps returning to me because I haven\'t fully learned it yet.' },
  { date: '2026-03-18', category: 'archetypes', answer: '', questionText: 'I turn my insights into action rather than staying in my head.' },
  { date: '2026-03-18', category: 'archetypes', answer: '', questionText: 'I balance my desire for newness with appreciation for what I already have.' },
  { date: '2026-03-18', category: 'cognitive', answer: '', questionText: 'I engage most deeply in learning experiences that are hands-on and immersive.' },
  { date: '2026-03-18', category: 'cognitive', answer: '', questionText: 'I invite serendipity into my thinking process.' },
  { date: '2026-03-18', category: 'intelligence', answer: '', questionText: 'I find comfort in the rhythm and sound of words.' },
  { date: '2026-03-18', category: 'intelligence', answer: '', questionText: 'I can reproduce a rhythm after hearing it once.' },

  // Day: 2026-03-19
  { date: '2026-03-19', category: 'values', answer: '', questionText: 'I navigate the tension between security and adventure with clarity.' },
  { date: '2026-03-19', category: 'values', answer: '', questionText: 'A key relationship has shaped who I am today.' },
  { date: '2026-03-19', category: 'values', answer: '', questionText: 'I have expressed who I truly am in brave ways.' },
  { date: '2026-03-19', category: 'archetypes', answer: '', questionText: 'My rebellious streak is constructive rather than destructive.' },
  { date: '2026-03-19', category: 'archetypes', answer: '', questionText: 'I step up when no one else will.' },
  { date: '2026-03-19', category: 'archetypes', answer: '', questionText: 'A single conversation has profoundly transformed how I see myself.' },
  { date: '2026-03-19', category: 'cognitive', answer: '', questionText: 'I know when I have truly learned from an experience.' },
  { date: '2026-03-19', category: 'cognitive', answer: '', questionText: 'My memories of important events have changed and evolved over time.' },
  { date: '2026-03-19', category: 'cognitive', answer: '', questionText: 'I evaluate the credibility of new information sources carefully.' },
  { date: '2026-03-19', category: 'intelligence', answer: '', questionText: 'I prefer natural or earth-toned aesthetics in my surroundings.' },
  { date: '2026-03-19', category: 'intelligence', answer: '', questionText: 'I notice when my life feels meaningful and when it does not.' },
  { date: '2026-03-19', category: 'intelligence', answer: '', questionText: 'Reading is one of my favourite ways to spend time.' },

  // Day: 2026-03-20
  { date: '2026-03-20', category: 'values', answer: '', questionText: 'I feel creatively alive on a regular basis.' },
  { date: '2026-03-20', category: 'values', answer: '', questionText: 'I offer compassion without absorbing others\' suffering.' },
  { date: '2026-03-20', category: 'archetypes', answer: '', questionText: 'I express power without dominating others.' },
  { date: '2026-03-20', category: 'archetypes', answer: '', questionText: 'There is a system in my life that needs disrupting.' },
  { date: '2026-03-20', category: 'cognitive', answer: '', questionText: 'I prefer having a clear recommendation over many open options.' },
  { date: '2026-03-20', category: 'cognitive', answer: '', questionText: 'I have effective techniques for staying focused during long discussions.' },
  { date: '2026-03-20', category: 'intelligence', answer: '', questionText: 'Writing helps me discover what I actually think.' },
  { date: '2026-03-20', category: 'intelligence', answer: '', questionText: 'I feel deeply connected to the people in my life.' },

  // Day: 2026-03-21
  { date: '2026-03-21', category: 'values', answer: '', questionText: 'My life has a clear direction right now.' },
  { date: '2026-03-21', category: 'values', answer: '', questionText: 'I know the difference between excellence and perfectionism.' },
  { date: '2026-03-21', category: 'archetypes', answer: '', questionText: 'I define myself by more than my job title or social labels.' },
  { date: '2026-03-21', category: 'archetypes', answer: '', questionText: 'I stay connected to community while maintaining my radical independence.' },
  { date: '2026-03-21', category: 'cognitive', answer: '', questionText: 'I fact-check my own assumptions before accepting them.' },
  { date: '2026-03-21', category: 'cognitive', answer: '', questionText: 'Time pressure improves rather than impairs my decision quality.' },
  { date: '2026-03-21', category: 'intelligence', answer: '', questionText: 'Physical mastery gives me a deep sense of accomplishment.' },
  { date: '2026-03-21', category: 'intelligence', answer: '', questionText: 'I think about the meaning of life more than most people.' },

  // Day: 2026-03-22
  { date: '2026-03-22', category: 'values', answer: '', questionText: 'My relationship with the seasons reflects something true about my inner life.' },
  { date: '2026-03-22', category: 'values', answer: '', questionText: 'I stay true to my ethics even when they conflict with social norms.' },
  { date: '2026-03-22', category: 'values', answer: '', questionText: 'I reach for healthy things first when I feel overwhelmed.' },
  { date: '2026-03-22', category: 'archetypes', answer: '', questionText: 'My analytical mind both serves and limits me.' },
  { date: '2026-03-22', category: 'archetypes', answer: '', questionText: 'I nurture the parts of myself that cannot be measured.' },
  { date: '2026-03-22', category: 'archetypes', answer: '', questionText: 'My rebellious energy has matured over time.' },
  { date: '2026-03-22', category: 'cognitive', answer: '', questionText: 'I build arguments using logic rather than emotion or narrative.' },
  { date: '2026-03-22', category: 'cognitive', answer: '', questionText: 'I redirect my attention when my mind wanders during something important.' },
  { date: '2026-03-22', category: 'cognitive', answer: '', questionText: 'I nurture ideas from initial spark all the way to fully formed concepts.' },
  { date: '2026-03-22', category: 'intelligence', answer: '', questionText: 'I can quickly estimate whether a claim is plausible based on numbers.' },
  { date: '2026-03-22', category: 'intelligence', answer: '', questionText: 'I enjoy physical improvisation — free movement, contact improv, play.' },
  { date: '2026-03-22', category: 'intelligence', answer: '', questionText: 'I feel emotionally mature compared to others my age.' },

  // Day: 2026-03-23
  { date: '2026-03-23', category: 'values', answer: '', questionText: 'I feel deeply aligned with my sense of purpose.' },
  { date: '2026-03-23', category: 'values', answer: '', questionText: 'I feel proud of the person I am becoming.' },
  { date: '2026-03-23', category: 'archetypes', answer: '', questionText: 'I play an unofficial role in my family that was never assigned to me.' },
  { date: '2026-03-23', category: 'archetypes', answer: '', questionText: 'I am befriending parts of myself I was taught to suppress.' },
  { date: '2026-03-23', category: 'cognitive', answer: '', questionText: 'I direct attention to my inner life even during a busy day.' },
  { date: '2026-03-23', category: 'cognitive', answer: '', questionText: 'I store and retrieve memories of important conversations accurately.' },
  { date: '2026-03-23', category: 'intelligence', answer: '', questionText: 'I experience music as colours, textures, or images.' },
  { date: '2026-03-23', category: 'intelligence', answer: '', questionText: 'I compose or improvise music in my head.' },

  // Day: 2026-03-24
  { date: '2026-03-24', category: 'values', answer: '', questionText: 'I manage compassion fatigue by actively replenishing myself.' },
  { date: '2026-03-24', category: 'values', answer: '', questionText: 'I create rituals and traditions that bring the people I love together.' },
  { date: '2026-03-24', category: 'archetypes', answer: '', questionText: 'I sometimes need to rebel against my own rebel.' },
  { date: '2026-03-24', category: 'archetypes', answer: '', questionText: 'My need for freedom affects my ability to commit.' },
  { date: '2026-03-24', category: 'cognitive', answer: '', questionText: 'My unconventional thinking approach serves me well even when it isn\'t rewarded.' },
  { date: '2026-03-24', category: 'cognitive', answer: '', questionText: 'I retain the key points from long conversations accurately.' },
  { date: '2026-03-24', category: 'intelligence', answer: '', questionText: 'I have a detailed mental model of how my own mind works.' },
  { date: '2026-03-24', category: 'intelligence', answer: '', questionText: 'I can look at a flat pattern and imagine the 3D object it creates.' },

  // Day: 2026-03-25
  { date: '2026-03-25', category: 'values', answer: '', questionText: 'I celebrate belonging when I have it rather than taking it for granted.' },
  { date: '2026-03-25', category: 'values', answer: '', questionText: 'I would benefit from a conversation with a wise mentor.' },
  { date: '2026-03-25', category: 'values', answer: '', questionText: 'I can distinguish between healthy solitude and unhealthy isolation.' },
  { date: '2026-03-25', category: 'archetypes', answer: '', questionText: 'A transformation that scared me turned out beautifully.' },
  { date: '2026-03-25', category: 'archetypes', answer: '', questionText: 'I can discern truth from comfortable illusion.' },
  { date: '2026-03-25', category: 'archetypes', answer: '', questionText: 'An emerging part of myself genuinely excites me.' },
  { date: '2026-03-25', category: 'cognitive', answer: '', questionText: 'My thinking style has shaped my career or life path significantly.' },
  { date: '2026-03-25', category: 'cognitive', answer: '', questionText: 'I actively cultivate and develop my intuitive sense.' },
  { date: '2026-03-25', category: 'cognitive', answer: '', questionText: 'I balance pattern recognition with remaining open to exceptions.' },
  { date: '2026-03-25', category: 'intelligence', answer: '', questionText: 'I notice logical errors in arguments other people make.' },
  { date: '2026-03-25', category: 'intelligence', answer: '', questionText: 'I believe inner growth is the most important work a person can do.' },
  { date: '2026-03-25', category: 'intelligence', answer: '', questionText: 'I use past experiences to make better future decisions.' },

  // Day: 2026-03-26
  { date: '2026-03-26', category: 'values', answer: '', questionText: 'I can clearly distinguish between my wants and my needs.' },
  { date: '2026-03-26', category: 'values', answer: '', questionText: 'I handle disagreements with people I care about in a healthy way.' },
  { date: '2026-03-26', category: 'archetypes', answer: '', questionText: 'An inner contradiction is a defining part of who I am.' },
  { date: '2026-03-26', category: 'archetypes', answer: '', questionText: 'My inner fire is alive and burning.' },
  { date: '2026-03-26', category: 'cognitive', answer: '', questionText: 'I handle choices with no clear right answer without becoming paralysed.' },
  { date: '2026-03-26', category: 'cognitive', answer: '', questionText: 'I summarise complex information for myself effectively.' },
  { date: '2026-03-26', category: 'intelligence', answer: '', questionText: 'I enjoy the physicality of nature — climbing, swimming, hiking.' },
  { date: '2026-03-26', category: 'intelligence', answer: '', questionText: 'I am fascinated by the history and origin of words.' },

  // Day: 2026-03-27
  { date: '2026-03-27', category: 'values', answer: '', questionText: 'I handle repeated boundary violations with firmness and clarity.' },
  { date: '2026-03-27', category: 'values', answer: '', questionText: 'I am able to forgive even when the other person isn\'t sorry.' },
  { date: '2026-03-27', category: 'archetypes', answer: '', questionText: 'I navigate the soul\'s seasons — growth, decay, dormancy, rebirth — with awareness.' },
  { date: '2026-03-27', category: 'archetypes', answer: '', questionText: 'I have a complex relationship with authority figures.' },
  { date: '2026-03-27', category: 'cognitive', answer: '', questionText: 'I do my deepest work during a specific, consistent time of day.' },
  { date: '2026-03-27', category: 'cognitive', answer: '', questionText: 'Nostalgia plays a meaningful role in my thinking.' },
  { date: '2026-03-27', category: 'intelligence', answer: '', questionText: 'I can recognise the difference between what I feel and what I think.' },
  { date: '2026-03-27', category: 'intelligence', answer: '', questionText: 'I look for cause-and-effect relationships in what happens around me.' },

  // Day: 2026-03-28
  { date: '2026-03-28', category: 'values', answer: '', questionText: 'I have made peace with things I wish I could tell my younger self.' },
  { date: '2026-03-28', category: 'values', answer: '', questionText: 'Someone specific taught me the most about caring for others.' },
  { date: '2026-03-28', category: 'values', answer: '', questionText: 'I feel most like myself when I follow my own instincts.' },
  { date: '2026-03-28', category: 'archetypes', answer: '', questionText: 'Some of my caring is performed rather than genuinely felt.' },
  { date: '2026-03-28', category: 'archetypes', answer: '', questionText: 'Part of my potential remains unlived.' },
  { date: '2026-03-28', category: 'archetypes', answer: '', questionText: 'My past self still influences my present choices.' },
  { date: '2026-03-28', category: 'cognitive', answer: '', questionText: 'I trust counterintuitive decisions that go against conventional wisdom.' },
  { date: '2026-03-28', category: 'cognitive', answer: '', questionText: 'Unexpected things capture my attention involuntarily.' },
  { date: '2026-03-28', category: 'cognitive', answer: '', questionText: 'I use an analytical framework — even an informal one — in daily life.' },
  { date: '2026-03-28', category: 'intelligence', answer: '', questionText: 'Poetry or lyrical writing moves me deeply.' },
  { date: '2026-03-28', category: 'intelligence', answer: '', questionText: 'I use specific music to access certain memories or emotional states.' },
  { date: '2026-03-28', category: 'intelligence', answer: '', questionText: 'I notice inefficiencies in processes and systems.' },

  // Day: 2026-03-29
  { date: '2026-03-29', category: 'values', answer: '', questionText: 'A wounded part of me needs tenderness that I haven\'t fully given it.' },
  { date: '2026-03-29', category: 'values', answer: '', questionText: 'I choose purpose over comfort when it matters.' },
  { date: '2026-03-29', category: 'archetypes', answer: '', questionText: 'My seeking nature comes at a real cost to my relationships.' },
  { date: '2026-03-29', category: 'archetypes', answer: '', questionText: 'I would tear down something old to build something better.' },
  { date: '2026-03-29', category: 'cognitive', answer: '', questionText: 'I use self-observation to make better choices.' },
  { date: '2026-03-29', category: 'cognitive', answer: '', questionText: 'I approach personal problems differently than work problems.' },
  { date: '2026-03-29', category: 'intelligence', answer: '', questionText: 'I notice when someone needs support even before they ask.' },
  { date: '2026-03-29', category: 'intelligence', answer: '', questionText: 'I am drawn to photography, film, or visual storytelling.' },

  // Day: 2026-03-30
  { date: '2026-03-30', category: 'values', answer: '', questionText: 'I feel fully authentic in the most important areas of my life.' },
  { date: '2026-03-30', category: 'values', answer: '', questionText: 'I hold opinions that most people around me would disagree with.' },
  { date: '2026-03-30', category: 'archetypes', answer: '', questionText: 'I am letting go of the need for internal consistency.' },
  { date: '2026-03-30', category: 'archetypes', answer: '', questionText: 'There is something I would defend even if I were the only one standing.' },
  { date: '2026-03-30', category: 'cognitive', answer: '', questionText: 'I generate new ideas even when I feel stuck.' },
  { date: '2026-03-30', category: 'cognitive', answer: '', questionText: 'I approach new problems with a clear go-to method.' },
  { date: '2026-03-30', category: 'intelligence', answer: '', questionText: 'I understand my own defence mechanisms.' },
  { date: '2026-03-30', category: 'intelligence', answer: '', questionText: 'I feel responsible for the emotional well-being of those around me.' },

  // Day: 2026-03-31
  { date: '2026-03-31', category: 'values', answer: '', questionText: 'Trust builds slowly in me, but it builds solidly.' },
  { date: '2026-03-31', category: 'values', answer: '', questionText: 'I am clear about which commitments truly deserve my energy.' },
  { date: '2026-03-31', category: 'values', answer: '', questionText: 'I have experienced what unconditional acceptance feels like.' },
  { date: '2026-03-31', category: 'archetypes', answer: '', questionText: 'I listen to the quiet voice beneath all the noise.' },
  { date: '2026-03-31', category: 'archetypes', answer: '', questionText: 'Jealousy has shown me something important about my true desires.' },
  { date: '2026-03-31', category: 'archetypes', answer: '', questionText: 'I disown parts of myself in public settings.' },
  { date: '2026-03-31', category: 'cognitive', answer: '', questionText: 'I perform at my cognitive best when I feel psychologically safe.' },
  { date: '2026-03-31', category: 'cognitive', answer: '', questionText: 'I filter what to pay attention to and what to ignore efficiently.' },
  { date: '2026-03-31', category: 'cognitive', answer: '', questionText: 'I reframe uncertainty as possibility and openness.' },
  { date: '2026-03-31', category: 'intelligence', answer: '', questionText: 'I think about whether time is real or constructed.' },
  { date: '2026-03-31', category: 'intelligence', answer: '', questionText: 'I am fascinated by animal behaviour and consciousness.' },
  { date: '2026-03-31', category: 'intelligence', answer: '', questionText: 'I am curious about the relationship between mind and brain.' },

  // Day: 2026-04-01
  { date: '2026-04-01', category: 'values', answer: '', questionText: 'I handle creative blocks with patience and curiosity.' },
  { date: '2026-04-01', category: 'values', answer: '', questionText: 'Other people\'s experiences move me deeply.' },
  { date: '2026-04-01', category: 'archetypes', answer: '', questionText: 'I recognise when resistance is blocking my transformation.' },
  { date: '2026-04-01', category: 'archetypes', answer: '', questionText: 'I have one persona that is closer to my core than any other.' },
  { date: '2026-04-01', category: 'cognitive', answer: '', questionText: 'I use analogies effectively to make sense of new situations.' },
  { date: '2026-04-01', category: 'cognitive', answer: '', questionText: 'I prepare for unpredictable outcomes without spiralling into anxiety.' },
  { date: '2026-04-01', category: 'intelligence', answer: '', questionText: 'I find it easy to summarize what I have read or heard.' },
  { date: '2026-04-01', category: 'intelligence', answer: '', questionText: 'I am deeply affected by changes in weather or seasons.' },

  // Day: 2026-04-02
  { date: '2026-04-02', category: 'values', answer: '', questionText: 'I stand up for my beliefs even when it comes at a cost.' },
  { date: '2026-04-02', category: 'values', answer: '', questionText: 'I practise small acts of justice and fairness daily.' },
  { date: '2026-04-02', category: 'archetypes', answer: '', questionText: 'I have finally understood a life pattern after years of living it.' },
  { date: '2026-04-02', category: 'archetypes', answer: '', questionText: 'I have been the villain in someone else\'s story without realising it.' },
  { date: '2026-04-02', category: 'cognitive', answer: '', questionText: 'I use unconventional approaches to problem-solving effectively.' },
  { date: '2026-04-02', category: 'cognitive', answer: '', questionText: 'Deepening my self-knowledge has changed how I approach the world.' },
  { date: '2026-04-02', category: 'intelligence', answer: '', questionText: 'I think about the nature of suffering and its role in growth.' },
  { date: '2026-04-02', category: 'intelligence', answer: '', questionText: 'My body holds memories that my mind has forgotten.' },

  // Day: 2026-04-03
  { date: '2026-04-03', category: 'values', answer: '', questionText: 'I receive gifts, compliments, and help with genuine openness.' },
  { date: '2026-04-03', category: 'values', answer: '', questionText: 'I feel grounded even when everything around me is shifting.' },
  { date: '2026-04-03', category: 'values', answer: '', questionText: 'I carry emotional patterns inherited from my family.' },
  { date: '2026-04-03', category: 'archetypes', answer: '', questionText: 'I have recently felt powerless and had to find my way through it.' },
  { date: '2026-04-03', category: 'archetypes', answer: '', questionText: 'I am creating peace between my perfectionism and my humanity.' },
  { date: '2026-04-03', category: 'archetypes', answer: '', questionText: 'I am actively reconciling past trauma with present strength.' },
  { date: '2026-04-03', category: 'cognitive', answer: '', questionText: 'I cope effectively when outcomes are completely out of my hands.' },
  { date: '2026-04-03', category: 'cognitive', answer: '', questionText: 'Others count on me for a specific cognitive strength.' },
  { date: '2026-04-03', category: 'cognitive', answer: '', questionText: 'I work comfortably on problems whose end I cannot yet see.' },
  { date: '2026-04-03', category: 'intelligence', answer: '', questionText: 'I organise my thoughts spatially — mind maps, diagrams, or layouts.' },
  { date: '2026-04-03', category: 'intelligence', answer: '', questionText: 'I am good at packing, fitting objects into containers efficiently.' },
  { date: '2026-04-03', category: 'intelligence', answer: '', questionText: 'I am drawn to physical forms of art — pottery, sculpture, carpentry.' },

  // Day: 2026-04-04
  { date: '2026-04-04', category: 'values', answer: '', questionText: 'The values I most want to pass on are active in my daily life.' },
  { date: '2026-04-04', category: 'values', answer: '', questionText: 'I struggle to forgive certain things, and that reveals something about my values.' },
  { date: '2026-04-04', category: 'archetypes', answer: '', questionText: 'I listen without giving advice when that\'s what someone truly needs.' },
  { date: '2026-04-04', category: 'archetypes', answer: '', questionText: 'My life roles — parent, partner, professional — compete for dominance.' },
  { date: '2026-04-04', category: 'cognitive', answer: '', questionText: 'My inner creator speaks louder than my inner critic.' },
  { date: '2026-04-04', category: 'cognitive', answer: '', questionText: 'I find a way to get unstuck when I\'m blocked.' },
  { date: '2026-04-04', category: 'intelligence', answer: '', questionText: 'I notice the quality of air, light, and water wherever I go.' },
  { date: '2026-04-04', category: 'intelligence', answer: '', questionText: 'I learn best from diagrams, maps, and charts.' },

  // Day: 2026-04-05
  { date: '2026-04-05', category: 'values', answer: '', questionText: 'There are certain people I find it harder to be compassionate toward.' },
  { date: '2026-04-05', category: 'values', answer: '', questionText: 'The people I am most alive with are the ones I laugh with most.' },
  { date: '2026-04-05', category: 'archetypes', answer: '', questionText: 'I stand in my power on ordinary days, not just dramatic ones.' },
  { date: '2026-04-05', category: 'archetypes', answer: '', questionText: 'I know the difference between rebellion and self-destruction.' },
  { date: '2026-04-05', category: 'cognitive', answer: '', questionText: 'I find meaningful connections in coincidences.' },
  { date: '2026-04-05', category: 'cognitive', answer: '', questionText: 'I detect when someone is not being fully honest.' },
  { date: '2026-04-05', category: 'intelligence', answer: '', questionText: 'I prefer precise language over approximate descriptions.' },
  { date: '2026-04-05', category: 'intelligence', answer: '', questionText: 'I often wonder if there are dimensions of reality we cannot perceive.' },

  // Day: 2026-04-06
  { date: '2026-04-06', category: 'values', answer: '', questionText: 'I have a guiding sense of meaning that carries me through uncertainty.' },
  { date: '2026-04-06', category: 'values', answer: '', questionText: 'I pretend not to care about things that actually matter to me.' },
  { date: '2026-04-06', category: 'values', answer: '', questionText: 'I respond to ethical tests with integrity.' },
  { date: '2026-04-06', category: 'archetypes', answer: '', questionText: 'I need to challenge my own inner authority right now.' },
  { date: '2026-04-06', category: 'archetypes', answer: '', questionText: 'My most guarded self and my most unguarded self need a conversation.' },
  { date: '2026-04-06', category: 'archetypes', answer: '', questionText: 'I have a clear understanding of what personal power means to me.' },
  { date: '2026-04-06', category: 'cognitive', answer: '', questionText: 'I manage the mental cost of context switching well.' },
  { date: '2026-04-06', category: 'cognitive', answer: '', questionText: 'I handle the discomfort of being a beginner with patience.' },
  { date: '2026-04-06', category: 'cognitive', answer: '', questionText: 'Recurring memories reveal important things about my current needs.' },
  { date: '2026-04-06', category: 'intelligence', answer: '', questionText: 'I feel a deep sense of wonder about the natural world.' },
  { date: '2026-04-06', category: 'intelligence', answer: '', questionText: 'I notice sounds in nature — birdsong, wind, water — that others miss.' },
  { date: '2026-04-06', category: 'intelligence', answer: '', questionText: 'I think about ethics and moral philosophy in everyday situations.' },

  // Day: 2026-04-07
  { date: '2026-04-07', category: 'values', answer: '', questionText: 'A specific choice I made gave me a powerful sense of freedom.' },
  { date: '2026-04-07', category: 'values', answer: '', questionText: 'My definition of success reflects my own truth, not society\'s.' },
  { date: '2026-04-07', category: 'archetypes', answer: '', questionText: 'I can be vulnerable without feeling weak.' },
  { date: '2026-04-07', category: 'archetypes', answer: '', questionText: 'I balance my desire for connection with my need for solitude.' },
  { date: '2026-04-07', category: 'cognitive', answer: '', questionText: 'I deliberate carefully before committing to choices.' },
  { date: '2026-04-07', category: 'cognitive', answer: '', questionText: 'I catch myself overthinking and shift back to action.' },
  { date: '2026-04-07', category: 'intelligence', answer: '', questionText: 'I am drawn to geometry, fractals, or visual patterns.' },
  { date: '2026-04-07', category: 'intelligence', answer: '', questionText: 'I am visually creative — I see beauty in unexpected places.' },

  // Day: 2026-04-08
  { date: '2026-04-08', category: 'values', answer: '', questionText: 'I am intentional about which causes deserve my energy.' },
  { date: '2026-04-08', category: 'values', answer: '', questionText: 'I build stability without becoming rigid.' },
  { date: '2026-04-08', category: 'archetypes', answer: '', questionText: 'A self-sabotaging behaviour keeps returning because it serves a hidden need.' },
  { date: '2026-04-08', category: 'archetypes', answer: '', questionText: 'I handle intellectual disagreements without making them personal.' },
  { date: '2026-04-08', category: 'cognitive', answer: '', questionText: 'I form opinions quickly when presented with new information.' },
  { date: '2026-04-08', category: 'cognitive', answer: '', questionText: 'I sustain deep concentration for extended periods.' },
  { date: '2026-04-08', category: 'intelligence', answer: '', questionText: 'I express emotions more easily through music than words.' },
  { date: '2026-04-08', category: 'intelligence', answer: '', questionText: 'I remember quotes and phrases long after I read them.' },

  // Day: 2026-04-09
  { date: '2026-04-09', category: 'values', answer: '', questionText: 'I am able to repair trust when it breaks.' },
  { date: '2026-04-09', category: 'values', answer: '', questionText: 'I know how to reclaim myself after giving too much away.' },
  { date: '2026-04-09', category: 'values', answer: '', questionText: 'I navigate situations where someone needs more from me than I can give.' },
  { date: '2026-04-09', category: 'archetypes', answer: '', questionText: 'A defining battle — literal or figurative — has shaped who I am.' },
  { date: '2026-04-09', category: 'archetypes', answer: '', questionText: 'Someone has said something empowering to me that still stays with me.' },
  { date: '2026-04-09', category: 'archetypes', answer: '', questionText: 'I am growing even when it doesn\'t feel like it.' },
  { date: '2026-04-09', category: 'cognitive', answer: '', questionText: 'I process my emotions through language.' },
  { date: '2026-04-09', category: 'cognitive', answer: '', questionText: 'I develop my cognitive weaknesses rather than only leaning into my strengths.' },
  { date: '2026-04-09', category: 'cognitive', answer: '', questionText: 'I integrate new knowledge with what I already know seamlessly.' },
  { date: '2026-04-09', category: 'intelligence', answer: '', questionText: 'I am sensitive to tone and subtext in written messages.' },
  { date: '2026-04-09', category: 'intelligence', answer: '', questionText: 'I am comfortable with emotional complexity — I can hold multiple feelings at once.' },
  { date: '2026-04-09', category: 'intelligence', answer: '', questionText: 'I easily identify the key variables in a complex situation.' },

  // Day: 2026-04-10
  { date: '2026-04-10', category: 'values', answer: '', questionText: 'My kindness is worth what it costs me.' },
  { date: '2026-04-10', category: 'values', answer: '', questionText: 'I speak difficult truths even when it\'s uncomfortable.' },
  { date: '2026-04-10', category: 'archetypes', answer: '', questionText: 'I care for people without trying to fix them.' },
  { date: '2026-04-10', category: 'archetypes', answer: '', questionText: 'I distinguish between fighting a good fight and picking unnecessary battles.' },
  { date: '2026-04-10', category: 'cognitive', answer: '', questionText: 'I handle uncertainty in relationships with composure.' },
  { date: '2026-04-10', category: 'cognitive', answer: '', questionText: 'Specific sensory triggers bring a flood of old memories.' },
  { date: '2026-04-10', category: 'intelligence', answer: '', questionText: 'I enjoy design, architecture, or visual arts.' },
  { date: '2026-04-10', category: 'intelligence', answer: '', questionText: 'I enjoy gardening, foraging, or tending living things.' },

  // Day: 2026-04-11
  { date: '2026-04-11', category: 'values', answer: '', questionText: 'A specific place in nature holds deep meaning for me.' },
  { date: '2026-04-11', category: 'values', answer: '', questionText: 'I can find something funny even in my own suffering.' },
  { date: '2026-04-11', category: 'archetypes', answer: '', questionText: 'Dropping all my masks for a day would be both terrifying and liberating.' },
  { date: '2026-04-11', category: 'archetypes', answer: '', questionText: 'I am deeply aware of what is most beautiful about being human.' },
  { date: '2026-04-11', category: 'cognitive', answer: '', questionText: 'I adapt my thinking style for different kinds of challenges.' },
  { date: '2026-04-11', category: 'cognitive', answer: '', questionText: 'I balance structured learning with explorative discovery.' },
  { date: '2026-04-11', category: 'intelligence', answer: '', questionText: 'I process information best when it is colour-coded or spatially arranged.' },
  { date: '2026-04-11', category: 'intelligence', answer: '', questionText: 'I am physically expressive — people can read my body easily.' },

  // Day: 2026-04-12
  { date: '2026-04-12', category: 'values', answer: '', questionText: 'I have a clear vision of how I want to grow in the next year.' },
  { date: '2026-04-12', category: 'values', answer: '', questionText: 'I am tolerating things in my life that conflict with my values.' },
  { date: '2026-04-12', category: 'values', answer: '', questionText: 'Complexity in my life often masks a lack of clarity about what matters.' },
  { date: '2026-04-12', category: 'archetypes', answer: '', questionText: 'I navigate the tension between going deep and going wide in life.' },
  { date: '2026-04-12', category: 'archetypes', answer: '', questionText: 'I carry wisdom I could share with someone going through what I once went through.' },
  { date: '2026-04-12', category: 'archetypes', answer: '', questionText: 'I am living inside a myth of my own making.' },
  { date: '2026-04-12', category: 'cognitive', answer: '', questionText: 'I think most effectively in writing rather than speaking or drawing.' },
  { date: '2026-04-12', category: 'cognitive', answer: '', questionText: 'I analyse complex issues thoroughly and effectively.' },
  { date: '2026-04-12', category: 'cognitive', answer: '', questionText: 'My inner monologue is structured and clear.' },
  { date: '2026-04-12', category: 'intelligence', answer: '', questionText: 'I prefer evidence-based decisions over intuition.' },
  { date: '2026-04-12', category: 'intelligence', answer: '', questionText: 'I remember places by their visual landmarks.' },
  { date: '2026-04-12', category: 'intelligence', answer: '', questionText: 'I enjoy group brainstorming and collaborative thinking.' },

  // Day: 2026-04-13
  { date: '2026-04-13', category: 'values', answer: '', questionText: 'I over-control parts of my life because of an underlying fear.' },
  { date: '2026-04-13', category: 'values', answer: '', questionText: 'My family of origin has shaped me in ways I am still discovering.' },
  { date: '2026-04-13', category: 'archetypes', answer: '', questionText: 'I handle someone trying to diminish my power with composure.' },
  { date: '2026-04-13', category: 'archetypes', answer: '', questionText: 'I respect both my extraverted and introverted needs.' },
  { date: '2026-04-13', category: 'cognitive', answer: '', questionText: 'I articulate what I think with precision and clarity.' },
  { date: '2026-04-13', category: 'cognitive', answer: '', questionText: 'I recognise when I am reasoning well versus poorly.' },
  { date: '2026-04-13', category: 'intelligence', answer: '', questionText: 'I am deeply curious about what happens after death.' },
  { date: '2026-04-13', category: 'intelligence', answer: '', questionText: 'I prefer natural materials over synthetic ones.' },

  // Day: 2026-04-14
  { date: '2026-04-14', category: 'values', answer: '', questionText: 'There are areas of my life that need stronger boundaries right now.' },
  { date: '2026-04-14', category: 'values', answer: '', questionText: 'I share my creative gifts generously with others.' },
  { date: '2026-04-14', category: 'archetypes', answer: '', questionText: 'I am embodying a specific archetype in this season of my life.' },
  { date: '2026-04-14', category: 'archetypes', answer: '', questionText: 'I am approaching a meaningful milestone of personal growth.' },
  { date: '2026-04-14', category: 'cognitive', answer: '', questionText: 'I adjust my beliefs when I discover I\'ve been wrong.' },
  { date: '2026-04-14', category: 'cognitive', answer: '', questionText: 'I find deep satisfaction in thorough analysis.' },
  { date: '2026-04-14', category: 'intelligence', answer: '', questionText: 'I am drawn to live music and feel it differently than recorded music.' },
  { date: '2026-04-14', category: 'intelligence', answer: '', questionText: 'I know what triggers my anxiety, anger, or sadness.' },

  // Day: 2026-04-15
  { date: '2026-04-15', category: 'values', answer: '', questionText: 'I know exactly how I want to be cared for when I\'m at my lowest.' },
  { date: '2026-04-15', category: 'values', answer: '', questionText: 'I stay grounded during periods of uncertainty.' },
  { date: '2026-04-15', category: 'values', answer: '', questionText: 'I prepare for the unknown without living in anxiety.' },
  { date: '2026-04-15', category: 'archetypes', answer: '', questionText: 'My soul needs something that my ego keeps ignoring.' },
  { date: '2026-04-15', category: 'archetypes', answer: '', questionText: 'Powerlessness has a specific, recognisable feeling in my body.' },
  { date: '2026-04-15', category: 'archetypes', answer: '', questionText: 'I maintain dignity when life strips away my defences.' },
  { date: '2026-04-15', category: 'cognitive', answer: '', questionText: 'I process disagreements in real-time conversation effectively.' },
  { date: '2026-04-15', category: 'cognitive', answer: '', questionText: 'I notice when my attention is being manipulated.' },
  { date: '2026-04-15', category: 'cognitive', answer: '', questionText: 'I review my day mentally before sleep.' },
  { date: '2026-04-15', category: 'intelligence', answer: '', questionText: 'I enjoy experimenting with sound — instruments, apps, or voice.' },
  { date: '2026-04-15', category: 'intelligence', answer: '', questionText: 'I instinctively rearrange spaces to make them feel better.' },
  { date: '2026-04-15', category: 'intelligence', answer: '', questionText: 'I am drawn to philosophical paradoxes and thought experiments.' },

  // Day: 2026-04-16
  { date: '2026-04-16', category: 'values', answer: '', questionText: 'Honour is an active part of my personal code.' },
  { date: '2026-04-16', category: 'values', answer: '', questionText: 'I am willing to be a beginner at something new.' },
  { date: '2026-04-16', category: 'archetypes', answer: '', questionText: 'The most important things in my life are invisible.' },
  { date: '2026-04-16', category: 'archetypes', answer: '', questionText: 'I stay anchored even when my purpose feels unclear.' },
  { date: '2026-04-16', category: 'cognitive', answer: '', questionText: 'I move from thinking about an idea to actually implementing it.' },
  { date: '2026-04-16', category: 'cognitive', answer: '', questionText: 'I am evolving the aspects of my cognition I most want to improve.' },
  { date: '2026-04-16', category: 'intelligence', answer: '', questionText: 'I am moved by the fragility and impermanence of life.' },
  { date: '2026-04-16', category: 'intelligence', answer: '', questionText: 'I would feel deeply diminished if music disappeared from my life.' },

  // Day: 2026-04-17
  { date: '2026-04-17', category: 'values', answer: '', questionText: 'I make deliberate time to be in natural spaces.' },
  { date: '2026-04-17', category: 'values', answer: '', questionText: 'The natural world has taught me something important about myself.' },
  { date: '2026-04-17', category: 'archetypes', answer: '', questionText: 'I can clearly differentiate between intuition and impulse.' },
  { date: '2026-04-17', category: 'archetypes', answer: '', questionText: 'Being "on" all day is cognitively and emotionally exhausting.' },
  { date: '2026-04-17', category: 'cognitive', answer: '', questionText: 'I have a comfort memory I return to when I need grounding.' },
  { date: '2026-04-17', category: 'cognitive', answer: '', questionText: 'Physical movement helps my thinking when I\'m stuck.' },
  { date: '2026-04-17', category: 'intelligence', answer: '', questionText: 'I notice when landscapes, forests, or green spaces are healthy or damaged.' },
  { date: '2026-04-17', category: 'intelligence', answer: '', questionText: 'I am good at making introductions and connecting people.' },

  // Day: 2026-04-18
  { date: '2026-04-18', category: 'values', answer: '', questionText: 'I experience emotional security in my closest relationship.' },
  { date: '2026-04-18', category: 'values', answer: '', questionText: 'I am neglecting a creative urge that wants my attention.' },
  { date: '2026-04-18', category: 'values', answer: '', questionText: 'Someone else\'s compassion recently shifted the course of my day.' },
  { date: '2026-04-18', category: 'archetypes', answer: '', questionText: 'I experience real conflict between desire and duty.' },
  { date: '2026-04-18', category: 'archetypes', answer: '', questionText: 'I feel the vulnerability of being between who I was and who I\'m becoming.' },
  { date: '2026-04-18', category: 'archetypes', answer: '', questionText: 'Homecoming after a long internal journey brings me deep peace.' },
  { date: '2026-04-18', category: 'cognitive', answer: '', questionText: 'I listen more than I respond in conversations.' },
  { date: '2026-04-18', category: 'cognitive', answer: '', questionText: 'I adapt my plans fluidly when the rules keep changing.' },
  { date: '2026-04-18', category: 'cognitive', answer: '', questionText: 'I trust my first thought and act on it confidently.' },
  { date: '2026-04-18', category: 'intelligence', answer: '', questionText: 'I am drawn to stories about transformation and transcendence.' },
  { date: '2026-04-18', category: 'intelligence', answer: '', questionText: 'I find it hard to think clearly when my body feels tense.' },
  { date: '2026-04-18', category: 'intelligence', answer: '', questionText: 'I remember details about people — their stories, preferences, struggles.' },

  // Day: 2026-04-19
  { date: '2026-04-19', category: 'values', answer: '', questionText: 'I use humor to connect rather than to deflect.' },
  { date: '2026-04-19', category: 'values', answer: '', questionText: 'A recurring desire in me is guiding my life choices.' },
  { date: '2026-04-19', category: 'archetypes', answer: '', questionText: 'I honour my past while stepping into my future.' },
  { date: '2026-04-19', category: 'archetypes', answer: '', questionText: 'My relationship with silence reveals something important about me.' },
  { date: '2026-04-19', category: 'cognitive', answer: '', questionText: 'These reflections have taught me something important about myself.' },
  { date: '2026-04-19', category: 'cognitive', answer: '', questionText: 'I default to seeing uncertainty as opportunity rather than threat.' },
  { date: '2026-04-19', category: 'intelligence', answer: '', questionText: 'I can tell what material something is by touching it.' },
  { date: '2026-04-19', category: 'intelligence', answer: '', questionText: 'I feel a responsibility to protect the natural world.' },

  // Day: 2026-04-20
  { date: '2026-04-20', category: 'values', answer: '', questionText: 'I navigate moral grey areas thoughtfully rather than reactively.' },
  { date: '2026-04-20', category: 'values', answer: '', questionText: 'I have learned something about life that I consider profoundly important.' },
  { date: '2026-04-20', category: 'archetypes', answer: '', questionText: 'I am on a meaningful quest or mission in my life right now.' },
  { date: '2026-04-20', category: 'archetypes', answer: '', questionText: 'My ideal self and my real self are not far apart.' },
  { date: '2026-04-20', category: 'cognitive', answer: '', questionText: 'I give my fullest attention to the activities that engage me.' },
  { date: '2026-04-20', category: 'cognitive', answer: '', questionText: 'I apply cognitive flexibility naturally in different situations.' },
  { date: '2026-04-20', category: 'intelligence', answer: '', questionText: 'I like categorising and organising information.' },
  { date: '2026-04-20', category: 'intelligence', answer: '', questionText: 'I feel calmer near water — rivers, lakes, ocean.' },

  // Day: 2026-04-21
  { date: '2026-04-21', category: 'values', answer: '', questionText: 'I know when to speak up and when to stay quiet.' },
  { date: '2026-04-21', category: 'values', answer: '', questionText: 'I balance structure and spontaneity well in my life.' },
  { date: '2026-04-21', category: 'values', answer: '', questionText: 'I am consciously creating the legacy I want to leave.' },
  { date: '2026-04-21', category: 'archetypes', answer: '', questionText: 'I process life experiences on a symbolic level, not just a literal one.' },
  { date: '2026-04-21', category: 'archetypes', answer: '', questionText: 'Part of my personality is actually a survival strategy from the past.' },
  { date: '2026-04-21', category: 'archetypes', answer: '', questionText: 'I perform a character when I\'m trying to impress someone.' },
  { date: '2026-04-21', category: 'cognitive', answer: '', questionText: 'I adopt mental models from others that improve my thinking.' },
  { date: '2026-04-21', category: 'cognitive', answer: '', questionText: 'Self-reflection plays a central role in my intellectual growth.' },
  { date: '2026-04-21', category: 'cognitive', answer: '', questionText: 'I reframe problems effectively when the original framing leads nowhere.' },
  { date: '2026-04-21', category: 'intelligence', answer: '', questionText: 'I rely on spreadsheets, charts, or structured tools to organise decisions.' },
  { date: '2026-04-21', category: 'intelligence', answer: '', questionText: 'I notice subtle shifts in someone\'s tone or energy.' },
  { date: '2026-04-21', category: 'intelligence', answer: '', questionText: 'I keep journals, notes, or letters regularly.' },
];
