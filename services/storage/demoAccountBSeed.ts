/**
 * demoAccountBSeed.ts
 *
 * Account B seed data.
 * Uses the exact 90-day reflection schedule and answers each statement
 * in a first-person way, as if written by the user, while keeping Account B
 * separate from Account A-specific named relationship history.
 */

export type DemoEnergy = 'low' | 'medium' | 'high';
export type DemoStress = 'low' | 'medium' | 'high';

export type DreamFeeling = {
  id: string;
  intensity: number;
};

export type DreamMetadata = {
  vividness: number;
  lucidity: number;
  controlLevel: number;
  overallTheme: string;
  awakenState: string;
  recurring: boolean;
};

export type ReflectionScale = 'Not True' | 'Somewhat' | 'True' | 'Very True';

export type ReflectionAnswer = {
  statement: string;
  answer: ReflectionScale;
};

export type DailyReflectionAnswerSet = {
  day: number;
  date: string;
  values: ReflectionAnswer[];
  archetypes: ReflectionAnswer[];
  cognitive: ReflectionAnswer[];
  intelligence: ReflectionAnswer[];
};

export type DailyEntrySeed = {
  day: number;
  date: string;
  promptResponse: string;
  journalTitle: string;
  journalTags: string[];
  dailyReflectionAnswers: DailyReflectionAnswerSet;
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
  date: string;
  region: string;
  emotion: string;
  intensity: number;
  note: string;
  trigger?: string;
  whatHelped?: string;
};

export type TriggerEventSeed = {
  date: string;
  mode: 'drain' | 'nourish';
  event: string;
  nsState: 'ventral_vagal' | 'sympathetic' | 'dorsal_vagal';
  sensations: string[];
  note: string;
};

export type RelationshipPatternSeed = {
  date: string;
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

export type ReflectionRow = {
  date: string;
  category: 'values' | 'archetypes' | 'cognitive' | 'intelligence';
  answer: ReflectionScale;
  questionText: string;
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
  reflectionsFlat: ReflectionRow[];
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

const MORNING_NOTES = [
  'Woke up tired and emotionally braced.',
  'Dream residue stayed with me into the morning.',
  'Already feeling socially self-conscious.',
  'Trying to start the day softer.',
  'Body feels tight and a little flooded.',
  'Not much emotional margin this morning.',
  'Feeling lonely in a way I cannot fully explain.',
  'Trying not to assume the worst about myself.',
];

const EVENING_NOTES = [
  'Held a lot today and I can feel it in my body.',
  'Still replaying things I wish had gone differently.',
  'The day took more out of me than I expected.',
  'There were a few small moments of relief.',
  'I felt socially off and never fully recovered from it.',
  'The day felt emotionally loud.',
  'I kept going, but it was not light.',
  'Trying not to make today mean something global about me.',
];

const WINS = [
  'Stayed present during a hard moment.',
  'Caught a spiral earlier than usual.',
  'Let myself rest a little.',
  'Did not push quite as hard as I wanted to.',
  'Named what I was actually feeling.',
  'Told myself the truth instead of only the harsh version.',
  'Made it through without completely shutting down.',
  'Asked less of myself.',
];

const CHALLENGES = [
  'Feeling inferior and not being able to shake it.',
  'Conversation took more energy than I had.',
  'Old attachment pain was close to the surface.',
  'I felt awkward almost every time I interacted with people.',
  'I assumed people were upset with me.',
  'I carried too much emotionally.',
  'Body memory made everything louder.',
  'I needed more support than I had.',
];

const TAG_SETS: string[][] = [
  ['rejection', 'social_anxiety', 'inferiority'],
  ['hearing_loss', 'exclusion', 'fatigue'],
  ['caregiving', 'pressure', 'overwhelm'],
  ['grief', 'attachment', 'longing'],
  ['stress', 'systems', 'friction'],
  ['boundaries', 'self-trust', 'repair'],
  ['inner_world', 'parts', 'blurry'],
  ['body', 'trauma', 'awareness'],
  ['belonging', 'family_patterns', 'history'],
  ['rest', 'regulation', 'truth'],
  ['awkwardness', 'self_image', 'comparison'],
  ['solitude', 'reflection', 'meaning'],
];

const DREAM_TEXT_POOL = [
  'I was in a room full of people and I could feel that everyone hated me, even though no one said it directly. I kept trying to act normal, but everything I did felt awkward and wrong.',
  'In the dream I kept missing what people were saying and everyone else seemed connected to each other easily. I felt embarrassed, behind, and left out.',
  'I was trying to get somewhere important but everything kept slowing me down. I woke up feeling tense and urgent.',
  'I was in a building that kept changing shape. Every door led to more waiting, more uncertainty, and more people not really listening.',
  'I was following someone through different rooms trying to get close enough to feel chosen, but they stayed just out of reach the whole time.',
  'I was with someone safe in the dream and the whole feeling of it was steadiness. Nothing dramatic happened. It just felt like being safe enough to exhale.',
  'I was at a gathering but still somehow outside of it. Everyone else seemed to know how to belong naturally.',
  'I was moving through different rooms and each one felt like a different age or version of me. No part of me wanted exactly the same thing.',
];

const DREAM_FEELINGS_POOL: DreamFeeling[][] = [
  [{ id: 'rejected', intensity: 5 }, { id: 'ashamed', intensity: 5 }, { id: 'awkward', intensity: 4 }],
  [{ id: 'embarrassed', intensity: 5 }, { id: 'left_out', intensity: 4 }, { id: 'alone', intensity: 4 }],
  [{ id: 'urgent', intensity: 4 }, { id: 'panicked', intensity: 4 }, { id: 'afraid', intensity: 3 }],
  [{ id: 'ignored', intensity: 5 }, { id: 'trapped', intensity: 4 }, { id: 'drained', intensity: 4 }],
  [{ id: 'longing', intensity: 5 }, { id: 'sad', intensity: 4 }, { id: 'hopeful', intensity: 2 }],
  [{ id: 'safe', intensity: 4 }, { id: 'warm', intensity: 4 }, { id: 'rested', intensity: 3 }],
  [{ id: 'excluded', intensity: 5 }, { id: 'sad', intensity: 4 }, { id: 'small', intensity: 4 }],
  [{ id: 'fragmented', intensity: 5 }, { id: 'overwhelmed', intensity: 4 }, { id: 'hurt', intensity: 4 }],
];

const DREAM_THEMES = [
  'social_rejection',
  'missed_connection',
  'urgency',
  'systems_frustration',
  'attachment_longing',
  'safe_connection',
  'belonging',
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

export const ACCOUNT_B_REFLECTIONS: ReflectionRow[] = [
  { date: '2026-01-22', category: 'values', answer: 'Very True', questionText: 'I recognise the early signs of burnout in myself.' },
  { date: '2026-01-22', category: 'values', answer: 'Very True', questionText: 'My sense of identity has shifted meaningfully in the last year.' },
  { date: '2026-01-22', category: 'archetypes', answer: 'True', questionText: 'I convert fear into fuel and motivation.' },
  { date: '2026-01-22', category: 'archetypes', answer: 'True', questionText: 'A journey — internal or external — has significantly changed who I am.' },
  { date: '2026-01-22', category: 'cognitive', answer: 'True', questionText: 'I organise my thoughts clearly before speaking about something complex.' },
  { date: '2026-01-22', category: 'cognitive', answer: 'True', questionText: 'I think primarily in images rather than words.' },
  { date: '2026-01-22', category: 'intelligence', answer: 'True', questionText: 'I feel uncomfortable when there is unresolved tension in a group.' },
  { date: '2026-01-22', category: 'intelligence', answer: 'Somewhat', questionText: 'I am a natural mediator in disagreements.' },
  { date: '2026-01-23', category: 'values', answer: 'True', questionText: 'What I believe about the nature of life shapes how I treat people.' },
  { date: '2026-01-23', category: 'values', answer: 'Somewhat', questionText: 'I say no without guilt when I need to.' },
  { date: '2026-01-23', category: 'archetypes', answer: 'True', questionText: 'An experience far outside my comfort zone shaped who I am profoundly.' },
  { date: '2026-01-23', category: 'archetypes', answer: 'True', questionText: 'Some responsibilities feel noble while others feel like burdens.' },
  { date: '2026-01-23', category: 'cognitive', answer: 'True', questionText: 'I follow a personal decision rule that serves me well.' },
  { date: '2026-01-23', category: 'cognitive', answer: 'True', questionText: 'I adapt my communication style fluidly for different people.' },
  { date: '2026-01-23', category: 'intelligence', answer: 'True', questionText: 'I learn and remember things better when they are set to music.' },
  { date: '2026-01-23', category: 'intelligence', answer: 'Somewhat', questionText: 'I can tell when a note or instrument is slightly off-pitch.' },
  { date: '2026-01-24', category: 'values', answer: 'Very True', questionText: 'There are family patterns I am consciously choosing to break.' },
  { date: '2026-01-24', category: 'values', answer: 'Very True', questionText: 'I have made meaningful sacrifices for the people I love.' },
  { date: '2026-01-24', category: 'values', answer: 'Very True', questionText: 'Being respected matters more to me than being liked.' },
  { date: '2026-01-24', category: 'archetypes', answer: 'True', questionText: 'I navigate the disorientation of becoming someone new.' },
  { date: '2026-01-24', category: 'archetypes', answer: 'True', questionText: 'I handle the loneliness of walking my own path with grace.' },
  { date: '2026-01-24', category: 'archetypes', answer: 'True', questionText: 'At least one of my personas is exhausting to maintain.' },
  { date: '2026-01-24', category: 'cognitive', answer: 'True', questionText: 'I actively seek out new information through my preferred channels.' },
  { date: '2026-01-24', category: 'cognitive', answer: 'True', questionText: 'I take smart, well-calculated risks.' },
  { date: '2026-01-24', category: 'cognitive', answer: 'True', questionText: 'I push through learning plateaus even when progress feels invisible.' },
  { date: '2026-01-24', category: 'intelligence', answer: 'True', questionText: 'Music connects me to something larger than myself.' },
  { date: '2026-01-24', category: 'intelligence', answer: 'True', questionText: 'I can identify many plants, trees, or animals by sight.' },
  { date: '2026-01-24', category: 'intelligence', answer: 'True', questionText: 'I notice physical discomfort in spaces that feel wrong.' },
  { date: '2026-01-25', category: 'values', answer: 'Very True', questionText: 'My body clearly signals when I feel safe versus when I feel threatened.' },
  { date: '2026-01-25', category: 'values', answer: 'True', questionText: 'I willingly sacrifice smaller things for what truly matters.' },
  { date: '2026-01-25', category: 'archetypes', answer: 'True', questionText: 'There are things about the way the world works that I refuse to accept.' },
  { date: '2026-01-25', category: 'archetypes', answer: 'True', questionText: 'My shadow shows up clearly in my relationships.' },
  { date: '2026-01-25', category: 'cognitive', answer: 'True', questionText: 'I handle memories that contradict my current self-image with openness.' },
  { date: '2026-01-25', category: 'cognitive', answer: 'True', questionText: 'Unexpected inputs — walks, conversations, random articles — spark breakthroughs for me.' },
  { date: '2026-01-25', category: 'intelligence', answer: 'Somewhat', questionText: 'I tend to absorb new languages naturally and quickly.' },
  { date: '2026-01-25', category: 'intelligence', answer: 'True', questionText: 'I hum, whistle, or tap rhythms without realising it.' },
  { date: '2026-01-26', category: 'values', answer: 'True', questionText: 'I hold my beliefs with both conviction and humility.' },
  { date: '2026-01-26', category: 'values', answer: 'True', questionText: 'I actively honour the people who have shaped me.' },
  { date: '2026-01-26', category: 'archetypes', answer: 'True', questionText: 'Someone has truly taken care of me recently.' },
  { date: '2026-01-26', category: 'archetypes', answer: 'True', questionText: 'I understand what fulfilment looks like for someone who is always seeking.' },
  { date: '2026-01-26', category: 'cognitive', answer: 'Not True', questionText: 'Small talk is valuable and enjoyable to me.' },
  { date: '2026-01-26', category: 'cognitive', answer: 'True', questionText: 'I take a completely different approach when my first method isn\'t working.' },
  { date: '2026-01-26', category: 'intelligence', answer: 'Very True', questionText: 'I process emotions partly by finding the exact words for them.' },
  { date: '2026-01-26', category: 'intelligence', answer: 'True', questionText: 'I recognise complex time signatures or polyrhythms.' },
  { date: '2026-01-27', category: 'values', answer: 'True', questionText: 'I have made courageous choices this year.' },
  { date: '2026-01-27', category: 'values', answer: 'True', questionText: 'I model the values I want to see in the world.' },
  { date: '2026-01-27', category: 'values', answer: 'Very True', questionText: 'I am intentional about what deserves my emotional energy.' },
  { date: '2026-01-27', category: 'archetypes', answer: 'True', questionText: 'Traits I dislike in others often reflect something unresolved in me.' },
  { date: '2026-01-27', category: 'archetypes', answer: 'True', questionText: 'A spiritual or philosophical question keeps calling me back.' },
  { date: '2026-01-27', category: 'archetypes', answer: 'True', questionText: 'I balance emotional generosity with meeting my own needs.' },
  { date: '2026-01-27', category: 'cognitive', answer: 'True', questionText: 'I balance logic and emotion effectively when making choices.' },
  { date: '2026-01-27', category: 'cognitive', answer: 'True', questionText: 'I seek disconfirming evidence for my beliefs, not just confirming evidence.' },
  { date: '2026-01-27', category: 'cognitive', answer: 'True', questionText: 'Breaking a familiar pattern has significantly shaped my thinking.' },
  { date: '2026-01-27', category: 'intelligence', answer: 'True', questionText: 'I remember faces far better than names.' },
  { date: '2026-01-27', category: 'intelligence', answer: 'True', questionText: 'I process stress through my body — tension, restlessness, movement.' },
  { date: '2026-01-27', category: 'intelligence', answer: 'True', questionText: 'I feel physical sensations when listening to certain music.' },
  { date: '2026-01-28', category: 'values', answer: 'True', questionText: 'I grow through discomfort rather than in spite of it.' },
  { date: '2026-01-28', category: 'values', answer: 'True', questionText: 'The decisions I make are truly my own.' },
  { date: '2026-01-28', category: 'archetypes', answer: 'True', questionText: 'I can distinguish between genuine seeking and emotional avoidance.' },
  { date: '2026-01-28', category: 'archetypes', answer: 'True', questionText: 'I balance my need for disruption with others\' need for stability.' },
  { date: '2026-01-28', category: 'cognitive', answer: 'True', questionText: 'I extract useful learning from risks that didn\'t pay off.' },
  { date: '2026-01-28', category: 'cognitive', answer: 'True', questionText: 'Fatigue changes what I focus on in noticeable ways.' },
  { date: '2026-01-28', category: 'intelligence', answer: 'True', questionText: 'I am drawn to liminal spaces — thresholds, transitions, edges.' },
  { date: '2026-01-28', category: 'intelligence', answer: 'True', questionText: 'I notice rhythms and patterns in everyday sounds.' },
  { date: '2026-01-29', category: 'values', answer: 'Very True', questionText: 'My relationship with my body has become more compassionate over time.' },
  { date: '2026-01-29', category: 'values', answer: 'True', questionText: 'I interpret my own life story generously and kindly.' },
  { date: '2026-01-29', category: 'archetypes', answer: 'True', questionText: 'I don\'t always know what to do when my strength isn\'t enough.' },
  { date: '2026-01-29', category: 'archetypes', answer: 'True', questionText: 'I need time to recalibrate after performing a role for too long.' },
  { date: '2026-01-29', category: 'cognitive', answer: 'True', questionText: 'I connect insights across different areas of my life.' },
  { date: '2026-01-29', category: 'cognitive', answer: 'True', questionText: 'My confidence in a decision grows after I commit to it.' },
  { date: '2026-01-29', category: 'intelligence', answer: 'True', questionText: 'I am very aware of my body in space.' },
  { date: '2026-01-29', category: 'intelligence', answer: 'True', questionText: 'I find joy in proofs, derivations, or formal logic.' },
  { date: '2026-01-30', category: 'values', answer: 'Very True', questionText: 'Childhood experiences shaped my need for safety.' },
  { date: '2026-01-30', category: 'values', answer: 'Very True', questionText: 'There are things that matter deeply to me that I rarely talk about.' },
  { date: '2026-01-30', category: 'values', answer: 'Somewhat', questionText: 'I am comfortable showing all of my emotions publicly.' },
  { date: '2026-01-30', category: 'archetypes', answer: 'True', questionText: 'I wear a different mask at work than I do at home.' },
  { date: '2026-01-30', category: 'archetypes', answer: 'Somewhat', questionText: 'I celebrate others without diminishing myself.' },
  { date: '2026-01-30', category: 'archetypes', answer: 'True', questionText: 'I am looking toward a specific horizon in my life right now.' },
  { date: '2026-01-30', category: 'cognitive', answer: 'True', questionText: 'I make sense of situations that don\'t fit any known pattern.' },
  { date: '2026-01-30', category: 'cognitive', answer: 'True', questionText: 'I know when a problem is solved "enough" and move on.' },
  { date: '2026-01-30', category: 'cognitive', answer: 'True', questionText: 'My emotions enhance rather than cloud the clarity of my thinking.' },
  { date: '2026-01-30', category: 'intelligence', answer: 'Not True', questionText: 'I have a strong sense of direction and rarely get lost.' },
  { date: '2026-01-30', category: 'intelligence', answer: 'True', questionText: 'I can easily rotate objects in my mind.' },
  { date: '2026-01-30', category: 'intelligence', answer: 'True', questionText: 'I am energised by meaningful conversations.' },
  { date: '2026-01-31', category: 'values', answer: 'True', questionText: 'I am holding onto obligations I need to release.' },
  { date: '2026-01-31', category: 'values', answer: 'True', questionText: 'I express the qualities I admire in others rather than suppressing them in myself.' },
  { date: '2026-01-31', category: 'archetypes', answer: 'True', questionText: 'My shadow side intensifies when I\'m under stress.' },
  { date: '2026-01-31', category: 'archetypes', answer: 'True', questionText: 'There is something I consistently lie to myself about.' },
  { date: '2026-01-31', category: 'cognitive', answer: 'True', questionText: 'I assess risk effectively even with incomplete information.' },
  { date: '2026-01-31', category: 'cognitive', answer: 'True', questionText: 'I retain information over the long term reliably.' },
  { date: '2026-01-31', category: 'intelligence', answer: 'Not True', questionText: 'I prefer verbal instructions over visual diagrams.' },
  { date: '2026-01-31', category: 'intelligence', answer: 'True', questionText: 'I believe that the most important truths cannot be put into words.' },
  { date: '2026-02-01', category: 'values', answer: 'Very True', questionText: 'There is at least one thing I absolutely refuse to compromise on.' },
  { date: '2026-02-01', category: 'values', answer: 'True', questionText: 'My responsibilities to family feel aligned with my deeper values.' },
  { date: '2026-02-01', category: 'archetypes', answer: 'True', questionText: 'The archetype I admire most reveals something important about me.' },
  { date: '2026-02-01', category: 'archetypes', answer: 'True', questionText: 'I hold complexity without collapsing into confusion.' },
  { date: '2026-02-01', category: 'cognitive', answer: 'True', questionText: 'I remain open to outcomes I didn\'t plan for.' },
  { date: '2026-02-01', category: 'cognitive', answer: 'True', questionText: 'I make room for unexpected ideas in an otherwise structured day.' },
  { date: '2026-02-01', category: 'intelligence', answer: 'True', questionText: 'I prefer watching a demonstration over reading instructions.' },
  { date: '2026-02-01', category: 'intelligence', answer: 'Not True', questionText: 'I can read maps effortlessly.' },
  { date: '2026-02-02', category: 'values', answer: 'True', questionText: 'I know exactly what quality I value most in a close relationship.' },
  { date: '2026-02-02', category: 'values', answer: 'Somewhat', questionText: 'The work I do feels like play to me.' },
  { date: '2026-02-02', category: 'values', answer: 'True', questionText: 'I feel secure enough to let myself be vulnerable.' },
  { date: '2026-02-02', category: 'archetypes', answer: 'True', questionText: 'Physical changes in my life mirror my internal transformation.' },
  { date: '2026-02-02', category: 'archetypes', answer: 'True', questionText: 'I listen most to the inner voice that actually serves me best.' },
  { date: '2026-02-02', category: 'archetypes', answer: 'True', questionText: 'I am actively searching for something meaningful in my life.' },
  { date: '2026-02-02', category: 'cognitive', answer: 'True', questionText: 'I communicate complex ideas clearly, even when others don\'t immediately understand.' },
  { date: '2026-02-02', category: 'cognitive', answer: 'True', questionText: 'Deep conversations energise my thinking.' },
  { date: '2026-02-02', category: 'cognitive', answer: 'True', questionText: 'I gather sufficient information before committing to a choice.' },
  { date: '2026-02-02', category: 'intelligence', answer: 'True', questionText: 'I question assumptions before accepting them.' },
  { date: '2026-02-02', category: 'intelligence', answer: 'Very True', questionText: 'I need regular solitude to recharge.' },
  { date: '2026-02-02', category: 'intelligence', answer: 'True', questionText: 'I naturally recognize patterns in music, like genre or era.' },
  { date: '2026-02-03', category: 'values', answer: 'Very True', questionText: 'I choose myself when it\'s the right thing to do.' },
  { date: '2026-02-03', category: 'values', answer: 'True', questionText: 'Ageing is teaching me valuable things about what truly matters.' },
  { date: '2026-02-03', category: 'archetypes', answer: 'True', questionText: 'I naturally step in when someone needs help or rescuing.' },
  { date: '2026-02-03', category: 'archetypes', answer: 'True', questionText: 'I needed a hero in my life that I never had.' },
  { date: '2026-02-03', category: 'cognitive', answer: 'True', questionText: 'I make decisions from courage rather than fear.' },
  { date: '2026-02-03', category: 'cognitive', answer: 'True', questionText: 'I use metaphors effectively to understand my own life.' },
  { date: '2026-02-03', category: 'intelligence', answer: 'Not True', questionText: 'I feel at home in my body most of the time.' },
  { date: '2026-02-03', category: 'intelligence', answer: 'True', questionText: 'I narrate experiences vividly when telling stories.' },
  { date: '2026-02-04', category: 'values', answer: 'Very True', questionText: 'I can sense when my boundaries are being tested.' },
  { date: '2026-02-04', category: 'values', answer: 'Very True', questionText: 'I have discovered truths late in life that I\'m genuinely grateful for.' },
  { date: '2026-02-04', category: 'archetypes', answer: 'True', questionText: 'There is a gift hidden inside my greatest flaw.' },
  { date: '2026-02-04', category: 'archetypes', answer: 'True', questionText: 'I have been overthinking something that actually needs feeling instead.' },
  { date: '2026-02-04', category: 'cognitive', answer: 'True', questionText: 'I work on one task at a time rather than multitasking.' },
  { date: '2026-02-04', category: 'cognitive', answer: 'True', questionText: 'I address even the types of decisions I tend to avoid.' },
  { date: '2026-02-04', category: 'intelligence', answer: 'True', questionText: 'I feel spiritually connected to the natural world.' },
  { date: '2026-02-04', category: 'intelligence', answer: 'True', questionText: 'I enjoy debugging or troubleshooting problems.' },
  { date: '2026-02-05', category: 'values', answer: 'True', questionText: 'I lift others without needing recognition for doing so.' },
  { date: '2026-02-05', category: 'values', answer: 'True', questionText: 'I reconcile compassion with accountability in a balanced way.' },
  { date: '2026-02-05', category: 'values', answer: 'True', questionText: 'I stay motivated even when progress feels invisible.' },
  { date: '2026-02-05', category: 'archetypes', answer: 'True', questionText: 'Radical self-honesty is something I could practise more of.' },
  { date: '2026-02-05', category: 'archetypes', answer: 'True', questionText: 'I hold onto myself during major life transitions.' },
  { date: '2026-02-05', category: 'archetypes', answer: 'True', questionText: 'I am sitting with a book, talk, or idea that is actively changing me.' },
  { date: '2026-02-05', category: 'cognitive', answer: 'True', questionText: 'I notice when a current situation rhymes with one from my past.' },
  { date: '2026-02-05', category: 'cognitive', answer: 'True', questionText: 'I handle misunderstandings without becoming defensive.' },
  { date: '2026-02-05', category: 'cognitive', answer: 'True', questionText: 'Looking back over my reflections, I can see a clear pattern in how I think and grow.' },
  { date: '2026-02-05', category: 'intelligence', answer: 'True', questionText: 'I understand unspoken social rules instinctively.' },
  { date: '2026-02-05', category: 'intelligence', answer: 'True', questionText: 'I pick up new physical skills quickly.' },
  { date: '2026-02-05', category: 'intelligence', answer: 'True', questionText: 'I am drawn to introspection in all its forms.' },
  { date: '2026-02-06', category: 'values', answer: 'True', questionText: 'I stay compassionate without losing myself in the process.' },
  { date: '2026-02-06', category: 'values', answer: 'Very True', questionText: 'Social interaction drains me more than most people realise.' },
  { date: '2026-02-06', category: 'archetypes', answer: 'True', questionText: 'I have faced something deeply difficult this year.' },
  { date: '2026-02-06', category: 'archetypes', answer: 'True', questionText: 'I stay curious even when I feel like an expert in something.' },
  { date: '2026-02-06', category: 'cognitive', answer: 'True', questionText: 'I navigate situations where intuition and logic point in different directions.' },
  { date: '2026-02-06', category: 'cognitive', answer: 'True', questionText: 'I keep my mind sharp and engaged through deliberate practice.' },
  { date: '2026-02-06', category: 'intelligence', answer: 'True', questionText: 'I am sensitive to the aesthetic quality of everyday spaces.' },
  { date: '2026-02-06', category: 'intelligence', answer: 'True', questionText: 'I notice the rhythm of speech and find some voices musical.' },
  { date: '2026-02-07', category: 'values', answer: 'True', questionText: 'I value honesty over harmony in my close relationships.' },
  { date: '2026-02-07', category: 'values', answer: 'Very True', questionText: 'Certain relationship dynamics trigger me more than I\'d like.' },
  { date: '2026-02-07', category: 'archetypes', answer: 'True', questionText: 'My need for control reveals my deepest fear.' },
  { date: '2026-02-07', category: 'archetypes', answer: 'True', questionText: 'I have had to accept something very difficult about myself.' },
  { date: '2026-02-07', category: 'cognitive', answer: 'Not True', questionText: 'I am comfortable working with numbers and quantitative data.' },
  { date: '2026-02-07', category: 'cognitive', answer: 'True', questionText: 'I interrupt unhelpful thought patterns before they take over.' },
  { date: '2026-02-07', category: 'intelligence', answer: 'True', questionText: 'I notice when sound design is used intentionally in films or media.' },
  { date: '2026-02-07', category: 'intelligence', answer: 'True', questionText: 'I use visualisation as a planning or problem-solving tool.' },
  { date: '2026-02-08', category: 'values', answer: 'True', questionText: 'I am giving my truest self what it needs right now.' },
  { date: '2026-02-08', category: 'values', answer: 'True', questionText: 'I have a healthy process for navigating grief and loss.' },
  { date: '2026-02-08', category: 'values', answer: 'True', questionText: 'I can hold space for people whose values differ from mine.' },
  { date: '2026-02-08', category: 'archetypes', answer: 'True', questionText: 'I adapt socially without feeling fake.' },
  { date: '2026-02-08', category: 'archetypes', answer: 'True', questionText: 'My identity would shift dramatically if I stopped taking care of everyone.' },
  { date: '2026-02-08', category: 'archetypes', answer: 'True', questionText: 'Going against the grain has often been the right choice for me.' },
  { date: '2026-02-08', category: 'cognitive', answer: 'True', questionText: 'I rely on a mental model to understand human behaviour.' },
  { date: '2026-02-08', category: 'cognitive', answer: 'True', questionText: 'I approach problems from the top down, starting with the big picture.' },
  { date: '2026-02-08', category: 'cognitive', answer: 'True', questionText: 'I take feedback about how I think and communicate seriously.' },
  { date: '2026-02-08', category: 'intelligence', answer: 'True', questionText: 'I approach problems in a systematic, step-by-step way.' },
  { date: '2026-02-08', category: 'intelligence', answer: 'True', questionText: 'Language feels like my most natural creative medium.' },
  { date: '2026-02-08', category: 'intelligence', answer: 'True', questionText: 'I can reverse-engineer how something was made.' },
  { date: '2026-02-09', category: 'values', answer: 'True', questionText: 'I am actively developing a skill or quality that matters to me.' },
  { date: '2026-02-09', category: 'values', answer: 'True', questionText: 'Community is a meaningful part of my life.' },
  { date: '2026-02-09', category: 'archetypes', answer: 'True', questionText: 'I keep repeating a pattern even though I know better.' },
  { date: '2026-02-09', category: 'archetypes', answer: 'True', questionText: 'I would rather be a quiet hero than a visible one.' },
  { date: '2026-02-09', category: 'cognitive', answer: 'True', questionText: 'I reset my thinking effectively when I\'m going in circles.' },
  { date: '2026-02-09', category: 'cognitive', answer: 'True', questionText: 'I prefer consuming information alone rather than discussing it.' },
  { date: '2026-02-09', category: 'intelligence', answer: 'True', questionText: 'I enjoy creating visual art — painting, collage, digital design.' },
  { date: '2026-02-09', category: 'intelligence', answer: 'True', questionText: 'I can picture how furniture will look in a room before moving it.' },
  { date: '2026-02-10', category: 'values', answer: 'True', questionText: 'Unexpected things energise me in surprising ways.' },
  { date: '2026-02-10', category: 'values', answer: 'True', questionText: 'I wear a mask more often than I would like.' },
  { date: '2026-02-10', category: 'archetypes', answer: 'True', questionText: 'I use my influence ethically and intentionally.' },
  { date: '2026-02-10', category: 'archetypes', answer: 'True', questionText: 'I continue caring for others even when I\'m drained.' },
  { date: '2026-02-10', category: 'cognitive', answer: 'True', questionText: 'Certain types of questions make me think more deeply than others.' },
  { date: '2026-02-10', category: 'cognitive', answer: 'True', questionText: 'I evaluate whether an idea is worth deeply pursuing before investing heavily.' },
  { date: '2026-02-10', category: 'intelligence', answer: 'True', questionText: 'I have experienced moments of deep connection to the cosmos.' },
  { date: '2026-02-10', category: 'intelligence', answer: 'True', questionText: 'I use empathy as my primary way of understanding others.' },
  { date: '2026-02-11', category: 'values', answer: 'True', questionText: 'Community and belonging give my life a dimension that solitude cannot.' },
  { date: '2026-02-11', category: 'values', answer: 'True', questionText: 'I value freedom more than stability in this season of my life.' },
  { date: '2026-02-11', category: 'values', answer: 'True', questionText: 'My greatest strengths have emerged from my hardest experiences.' },
  { date: '2026-02-11', category: 'archetypes', answer: 'True', questionText: 'I know how to reclaim my power after someone has taken it.' },
  { date: '2026-02-11', category: 'archetypes', answer: 'True', questionText: 'There is a role in life I play more naturally than any other.' },
  { date: '2026-02-11', category: 'archetypes', answer: 'True', questionText: 'I balance being a voice of reason with being emotionally present.' },
  { date: '2026-02-11', category: 'cognitive', answer: 'True', questionText: 'I apply lessons I wish I had been taught earlier in life.' },
  { date: '2026-02-11', category: 'cognitive', answer: 'True', questionText: 'Learning a difficult skill teaches me as much about myself as about the skill.' },
  { date: '2026-02-11', category: 'cognitive', answer: 'True', questionText: 'I perform best in structured conversation formats.' },
  { date: '2026-02-11', category: 'intelligence', answer: 'True', questionText: 'I contemplate the nature of consciousness and awareness.' },
  { date: '2026-02-11', category: 'intelligence', answer: 'True', questionText: 'I am fascinated by the overlap between science and spirituality.' },
  { date: '2026-02-11', category: 'intelligence', answer: 'True', questionText: 'I pick up on micro-expressions and body language.' },
  { date: '2026-02-12', category: 'values', answer: 'True', questionText: 'I balance giving and receiving well in my relationships.' },
  { date: '2026-02-12', category: 'values', answer: 'True', questionText: 'I regularly do something kind just for myself.' },
  { date: '2026-02-12', category: 'archetypes', answer: 'True', questionText: 'I struggle to recover after giving everything I have.' },
  { date: '2026-02-12', category: 'archetypes', answer: 'True', questionText: 'A role I was once forced into turned out to be one I secretly enjoy.' },
  { date: '2026-02-12', category: 'cognitive', answer: 'True', questionText: 'I calibrate my confidence in my own judgement accurately.' },
  { date: '2026-02-12', category: 'cognitive', answer: 'True', questionText: 'I know when to trust my analysis and when to trust my instincts.' },
  { date: '2026-02-12', category: 'intelligence', answer: 'True', questionText: 'I enjoy sequences, codes, or ciphers.' },
  { date: '2026-02-12', category: 'intelligence', answer: 'True', questionText: 'I am comfortable being alone with my thoughts.' },
  { date: '2026-02-13', category: 'values', answer: 'True', questionText: 'I follow rules by conscious choice, not just habit.' },
  { date: '2026-02-13', category: 'values', answer: 'True', questionText: 'Imagination plays an active role in my daily life.' },
  { date: '2026-02-13', category: 'archetypes', answer: 'True', questionText: 'I have exiled a part of myself that I need to welcome back.' },
  { date: '2026-02-13', category: 'archetypes', answer: 'True', questionText: 'Exploration has revealed truths I could never have found by staying put.' },
  { date: '2026-02-13', category: 'cognitive', answer: 'True', questionText: 'Sleep and rest noticeably improve my ability to solve problems.' },
  { date: '2026-02-13', category: 'cognitive', answer: 'True', questionText: 'I teach myself new things independently and successfully.' },
  { date: '2026-02-13', category: 'intelligence', answer: 'True', questionText: 'I trust the signals my body sends me.' },
  { date: '2026-02-13', category: 'intelligence', answer: 'True', questionText: 'I notice visual details others miss.' },
  { date: '2026-02-14', category: 'values', answer: 'True', questionText: 'I listen to my body before it shouts at me.' },
  { date: '2026-02-14', category: 'values', answer: 'True', questionText: 'I create spaces where others feel they belong.' },
  { date: '2026-02-14', category: 'values', answer: 'True', questionText: 'I can be present with someone\'s pain without needing to fix it.' },
  { date: '2026-02-14', category: 'archetypes', answer: 'True', questionText: 'My deepest intuition has a clear sense of where my life is headed.' },
  { date: '2026-02-14', category: 'archetypes', answer: 'True', questionText: 'I show up differently in each of my life roles, and I\'m aware of how.' },
  { date: '2026-02-14', category: 'archetypes', answer: 'True', questionText: 'I understand the difference between knowledge and true wisdom.' },
  { date: '2026-02-14', category: 'cognitive', answer: 'True', questionText: 'I extract surprising lessons from mundane experiences.' },
  { date: '2026-02-14', category: 'cognitive', answer: 'True', questionText: 'I wish I could recover a forgotten memory that feels important.' },
  { date: '2026-02-14', category: 'cognitive', answer: 'True', questionText: 'I appreciate and learn from elegant solutions to complex problems.' },
  { date: '2026-02-14', category: 'intelligence', answer: 'True', questionText: 'I am drawn to natural textures — wood, stone, water, soil.' },
  { date: '2026-02-14', category: 'intelligence', answer: 'True', questionText: 'I am comfortable with ambiguity about who I am.' },
  { date: '2026-02-14', category: 'intelligence', answer: 'True', questionText: 'I feel a strong connection to animals.' },
  { date: '2026-02-15', category: 'values', answer: 'True', questionText: 'I experience the sacred in ways that are personal and real to me.' },
  { date: '2026-02-15', category: 'values', answer: 'True', questionText: 'My presence has the kind of effect on others that I want it to have.' },
  { date: '2026-02-15', category: 'archetypes', answer: 'True', questionText: 'I share power in my relationships rather than accumulating it.' },
  { date: '2026-02-15', category: 'archetypes', answer: 'True', questionText: 'I integrate my dark side without acting it out destructively.' },
  { date: '2026-02-15', category: 'cognitive', answer: 'True', questionText: 'Mindfulness or meditation is an active part of my life.' },
  { date: '2026-02-15', category: 'cognitive', answer: 'True', questionText: 'Pressure enhances rather than hinders my ability to learn.' },
  { date: '2026-02-15', category: 'intelligence', answer: 'True', questionText: 'I am drawn to questions about identity — what makes me "me."' },
  { date: '2026-02-15', category: 'intelligence', answer: 'True', questionText: 'I am uncomfortable with surface-level answers to deep questions.' },
  { date: '2026-02-16', category: 'values', answer: 'True', questionText: 'There are people in my life who love the real me without performance.' },
  { date: '2026-02-16', category: 'values', answer: 'True', questionText: 'I prioritise restoration over obligation when I need to.' },
  { date: '2026-02-16', category: 'archetypes', answer: 'True', questionText: 'I remain humble even when I know I\'m right.' },
  { date: '2026-02-16', category: 'archetypes', answer: 'True', questionText: 'I can tell when I\'m code-switching versus losing myself.' },
  { date: '2026-02-16', category: 'cognitive', answer: 'True', questionText: 'My most vivid memories are emotional rather than visual or factual.' },
  { date: '2026-02-16', category: 'cognitive', answer: 'True', questionText: 'I balance breadth and depth effectively when exploring a new topic.' },
  { date: '2026-02-16', category: 'intelligence', answer: 'True', questionText: 'I classify and categorise natural phenomena instinctively.' },
  { date: '2026-02-16', category: 'intelligence', answer: 'True', questionText: 'I feel connected to something larger than myself.' },
  { date: '2026-02-17', category: 'values', answer: 'True', questionText: 'My ethical understanding comes more from experience than instruction.' },
  { date: '2026-02-17', category: 'values', answer: 'True', questionText: 'Resilience is a quality I embody, not just admire.' },
  { date: '2026-02-17', category: 'values', answer: 'True', questionText: 'I am clear about where my responsibility ends and someone else\'s begins.' },
  { date: '2026-02-17', category: 'archetypes', answer: 'True', questionText: 'I am strong without being hard or rigid.' },
  { date: '2026-02-17', category: 'archetypes', answer: 'True', questionText: 'I empower others without depleting myself.' },
  { date: '2026-02-17', category: 'archetypes', answer: 'True', questionText: 'I let people in without feeling dangerously exposed.' },
  { date: '2026-02-17', category: 'cognitive', answer: 'True', questionText: 'Complex, challenging problems energise me.' },
  { date: '2026-02-17', category: 'cognitive', answer: 'True', questionText: 'I use constraints to boost my creativity.' },
  { date: '2026-02-17', category: 'cognitive', answer: 'True', questionText: 'I handle situations requiring pure logic with no room for feeling.' },
  { date: '2026-02-17', category: 'intelligence', answer: 'True', questionText: 'Rhythm and tempo affect my energy and pace throughout the day.' },
  { date: '2026-02-17', category: 'intelligence', answer: 'True', questionText: 'I doodle, sketch, or draw when thinking.' },
  { date: '2026-02-17', category: 'intelligence', answer: 'Somewhat', questionText: 'I can navigate by mental maps rather than written directions.' },
  { date: '2026-02-18', category: 'values', answer: 'True', questionText: 'I feel a deep sense of belonging when I am outside.' },
  { date: '2026-02-18', category: 'values', answer: 'True', questionText: 'I nurture myself with the same care I give others.' },
  { date: '2026-02-18', category: 'archetypes', answer: 'True', questionText: 'I reinvent myself while staying true to my core.' },
  { date: '2026-02-18', category: 'archetypes', answer: 'True', questionText: 'I bring the lessons of my seeking back to the people I love.' },
  { date: '2026-02-18', category: 'cognitive', answer: 'True', questionText: 'I learn as much from failure as I do from success.' },
  { date: '2026-02-18', category: 'cognitive', answer: 'True', questionText: 'I notice trends in my mood, energy, or focus across a typical week.' },
  { date: '2026-02-18', category: 'intelligence', answer: 'True', questionText: 'I enjoy teaching, mentoring, or guiding others.' },
  { date: '2026-02-18', category: 'intelligence', answer: 'True', questionText: 'I think about humanity\'s place in the universe.' },
  { date: '2026-02-19', category: 'values', answer: 'True', questionText: 'I am living in a way I would want my grandchildren to know about.' },
  { date: '2026-02-19', category: 'values', answer: 'True', questionText: 'I would create freely if I didn\'t worry about the result being good.' },
  { date: '2026-02-19', category: 'archetypes', answer: 'True', questionText: 'I understand something about wisdom that most people miss.' },
  { date: '2026-02-19', category: 'archetypes', answer: 'True', questionText: 'My daily actions are aligned with my deeper purpose.' },
  { date: '2026-02-19', category: 'cognitive', answer: 'True', questionText: 'Daily reflection continues to reveal surprising things about my mind.' },
  { date: '2026-02-19', category: 'cognitive', answer: 'True', questionText: 'Understanding my own cognitive style has been genuinely useful.' },
  { date: '2026-02-19', category: 'intelligence', answer: 'True', questionText: 'I enjoy strategy games, chess, or competitive thinking.' },
  { date: '2026-02-19', category: 'intelligence', answer: 'Not True', questionText: 'I enjoy networking and building connections.' },
  { date: '2026-02-20', category: 'values', answer: 'True', questionText: 'My relationships have taught me life\'s most valuable lessons.' },
  { date: '2026-02-20', category: 'values', answer: 'True', questionText: 'I carry invisible emotional labour that others don\'t see.' },
  { date: '2026-02-20', category: 'values', answer: 'True', questionText: 'There are things about me I wish people would ask about.' },
  { date: '2026-02-20', category: 'archetypes', answer: 'True', questionText: 'I am in a chrysalis stage of deep personal transformation.' },
  { date: '2026-02-20', category: 'archetypes', answer: 'True', questionText: 'I am deeply attached to at least one defence mechanism.' },
  { date: '2026-02-20', category: 'archetypes', answer: 'True', questionText: 'There is a gap between who I am and who others need me to be.' },
  { date: '2026-02-20', category: 'cognitive', answer: 'True', questionText: 'My relationship with risk has matured and become healthier over time.' },
  { date: '2026-02-20', category: 'cognitive', answer: 'True', questionText: 'Analysis paralysis prevents me from acting when I need to.' },
  { date: '2026-02-20', category: 'cognitive', answer: 'True', questionText: 'I see a clear relationship between what I remember and who I\'m becoming.' },
  { date: '2026-02-20', category: 'intelligence', answer: 'True', questionText: 'I am fascinated by how different cultures understand death and the divine.' },
  { date: '2026-02-20', category: 'intelligence', answer: 'True', questionText: 'I think about free will and whether our choices are truly ours.' },
  { date: '2026-02-20', category: 'intelligence', answer: 'True', questionText: 'I evaluate arguments by their structure, not just their content.' },
  { date: '2026-02-21', category: 'values', answer: 'True', questionText: 'Time in nature restores me in a way nothing else does.' },
  { date: '2026-02-21', category: 'values', answer: 'True', questionText: 'I am spending my time on what I would prioritise if it were limited.' },
  { date: '2026-02-21', category: 'archetypes', answer: 'True', questionText: 'I react strongly when someone sees a part of me I try to hide.' },
  { date: '2026-02-21', category: 'archetypes', answer: 'True', questionText: 'My core wants something that the world doesn\'t make easy.' },
  { date: '2026-02-21', category: 'cognitive', answer: 'Very True', questionText: 'Writing plays an active role in how I process my thoughts.' },
  { date: '2026-02-21', category: 'cognitive', answer: 'True', questionText: 'I break large problems into smaller, manageable pieces naturally.' },
  { date: '2026-02-21', category: 'intelligence', answer: 'True', questionText: 'I use my body to express what words cannot.' },
  { date: '2026-02-21', category: 'intelligence', answer: 'True', questionText: 'I can trace my current mood back to its origin.' },
  { date: '2026-02-22', category: 'values', answer: 'True', questionText: 'I tend to hold onto things — possessions, people, certainty — out of fear.' },
  { date: '2026-02-22', category: 'values', answer: 'True', questionText: 'I feel safe even when the world feels uncertain.' },
  { date: '2026-02-22', category: 'archetypes', answer: 'True', questionText: 'I find deep meaning in mundane, everyday moments.' },
  { date: '2026-02-22', category: 'archetypes', answer: 'True', questionText: 'I balance careful analysis with gut intuition effectively.' },
  { date: '2026-02-22', category: 'cognitive', answer: 'True', questionText: 'I protect my creative flow from the things that kill it.' },
  { date: '2026-02-22', category: 'cognitive', answer: 'True', questionText: 'I handle information overload without becoming overwhelmed.' },
  { date: '2026-02-22', category: 'intelligence', answer: 'True', questionText: 'I instinctively create systems and frameworks to manage my life.' },
  { date: '2026-02-22', category: 'intelligence', answer: 'True', questionText: 'I naturally move or sway to rhythmic sounds.' },
  { date: '2026-02-23', category: 'values', answer: 'True', questionText: 'Nature has provided comfort during some of my hardest moments.' },
  { date: '2026-02-23', category: 'values', answer: 'True', questionText: 'Breaking my own self-imposed rules has taught me something.' },
  { date: '2026-02-23', category: 'values', answer: 'True', questionText: 'I have recently felt misunderstood in a way that revealed a deeper need.' },
  { date: '2026-02-23', category: 'archetypes', answer: 'True', questionText: 'A label I once identified with no longer fits me.' },
  { date: '2026-02-23', category: 'archetypes', answer: 'True', questionText: 'I take care of others more than others take care of me.' },
  { date: '2026-02-23', category: 'archetypes', answer: 'True', questionText: 'Enchantment and wonder are alive in my adult life.' },
  { date: '2026-02-23', category: 'cognitive', answer: 'True', questionText: 'I handle disagreements about shared memories gracefully.' },
  { date: '2026-02-23', category: 'cognitive', answer: 'True', questionText: 'I recognise and correct the cognitive biases that affect my risk assessment.' },
  { date: '2026-02-23', category: 'cognitive', answer: 'True', questionText: 'The same thinking habit loops back when I\'m under stress.' },
  { date: '2026-02-23', category: 'intelligence', answer: 'True', questionText: 'I think of life events as having a soundtrack.' },
  { date: '2026-02-23', category: 'intelligence', answer: 'True', questionText: 'I spot patterns in data or information quickly.' },
  { date: '2026-02-23', category: 'intelligence', answer: 'Somewhat', questionText: 'I find it easy to parallel park or navigate tight spaces.' },
  { date: '2026-02-24', category: 'values', answer: 'True', questionText: 'I choose long-term fulfilment over short-term gratification.' },
  { date: '2026-02-24', category: 'values', answer: 'True', questionText: 'I balance personal freedom with responsibility to people I love.' },
  { date: '2026-02-24', category: 'archetypes', answer: 'True', questionText: 'Unknown territory excites me more than it scares me right now.' },
  { date: '2026-02-24', category: 'archetypes', answer: 'True', questionText: 'I act differently when no one is watching.' },
  { date: '2026-02-24', category: 'cognitive', answer: 'True', questionText: 'I manage involuntary rumination effectively.' },
  { date: '2026-02-24', category: 'cognitive', answer: 'True', questionText: 'I maintain balanced thinking — neither too emotional nor too analytical.' },
  { date: '2026-02-24', category: 'intelligence', answer: 'True', questionText: 'I notice the emotional key of a piece of music immediately.' },
  { date: '2026-02-24', category: 'intelligence', answer: 'True', questionText: 'I naturally take the lead in social situations.' },
  { date: '2026-02-25', category: 'values', answer: 'True', questionText: 'I know the line between disarming humor and avoidant humor.' },
  { date: '2026-02-25', category: 'values', answer: 'True', questionText: 'My daydreams reveal something true about my desires.' },
  { date: '2026-02-25', category: 'archetypes', answer: 'True', questionText: 'I play a specific, recognisable role in my friends\' lives.' },
  { date: '2026-02-25', category: 'archetypes', answer: 'True', questionText: 'My public identity has diverged from who I really am.' },
  { date: '2026-02-25', category: 'cognitive', answer: 'True', questionText: 'I apply lessons from my past daily without even thinking about it.' },
  { date: '2026-02-25', category: 'cognitive', answer: 'True', questionText: 'My energy level and my thinking quality are closely connected.' },
  { date: '2026-02-25', category: 'intelligence', answer: 'Somewhat', questionText: 'I can tell when group dynamics shift.' },
  { date: '2026-02-25', category: 'intelligence', answer: 'True', questionText: 'I feel that nature teaches me things no book can.' },
  { date: '2026-02-26', category: 'values', answer: 'True', questionText: 'Loyalty is important to me, but I recognise its limits.' },
  { date: '2026-02-26', category: 'values', answer: 'True', questionText: 'I balance planning with surrendering to what I cannot control.' },
  { date: '2026-02-26', category: 'values', answer: 'True', questionText: 'My online presence reflects who I actually am.' },
  { date: '2026-02-26', category: 'archetypes', answer: 'True', questionText: 'My rational mind and my emotional mind have very different priorities.' },
  { date: '2026-02-26', category: 'archetypes', answer: 'True', questionText: 'My sense of self shifts depending on who I\'m with.' },
  { date: '2026-02-26', category: 'archetypes', answer: 'True', questionText: 'My caring nature has at times felt like a prison.' },
  { date: '2026-02-26', category: 'cognitive', answer: 'True', questionText: 'I detect subtext and unspoken meaning in conversations.' },
  { date: '2026-02-26', category: 'cognitive', answer: 'True', questionText: 'I make good decisions with high stakes and limited information.' },
  { date: '2026-02-26', category: 'cognitive', answer: 'True', questionText: 'I process and learn from my mistakes effectively after they happen.' },
  { date: '2026-02-26', category: 'intelligence', answer: 'True', questionText: 'I notice when correlation is mistaken for causation.' },
  { date: '2026-02-26', category: 'intelligence', answer: 'True', questionText: 'I feel drained by superficial interactions.' },
  { date: '2026-02-26', category: 'intelligence', answer: 'True', questionText: 'I enjoy cooking with fresh, seasonal, or wild ingredients.' },
  { date: '2026-02-27', category: 'values', answer: 'True', questionText: 'I can distinguish between challenges worth pushing through and ones to release.' },
  { date: '2026-02-27', category: 'values', answer: 'True', questionText: 'Playfulness is an active part of my adult life.' },
  { date: '2026-02-27', category: 'archetypes', answer: 'True', questionText: 'A deep fear underlies my need for control.' },
  { date: '2026-02-27', category: 'archetypes', answer: 'True', questionText: 'A recurring dream or image keeps appearing in my life.' },
  { date: '2026-02-27', category: 'cognitive', answer: 'True', questionText: 'I become aware of new patterns in my life on a regular basis.' },
  { date: '2026-02-27', category: 'cognitive', answer: 'True', questionText: 'Deadlines improve the quality of my thinking.' },
  { date: '2026-02-27', category: 'intelligence', answer: 'True', questionText: 'I feel inspired or calmed by specific landscapes or environments.' },
  { date: '2026-02-27', category: 'intelligence', answer: 'True', questionText: 'I enjoy personality tests and frameworks for self-understanding.' },
  { date: '2026-02-28', category: 'values', answer: 'True', questionText: 'Fairness is reflected in how I treat the people closest to me.' },
  { date: '2026-02-28', category: 'values', answer: 'True', questionText: 'I find elegance in the straightforward solution.' },
  { date: '2026-02-28', category: 'archetypes', answer: 'True', questionText: 'A part of me needs to be seen but is too afraid to be visible.' },
  { date: '2026-02-28', category: 'archetypes', answer: 'True', questionText: 'A part of me craves stability while another part craves chaos.' },
  { date: '2026-02-28', category: 'cognitive', answer: 'True', questionText: 'I know exactly what question I\'d most love someone to ask me right now.' },
  { date: '2026-02-28', category: 'cognitive', answer: 'True', questionText: 'My mood influences which memories surface.' },
  { date: '2026-02-28', category: 'intelligence', answer: 'Not True', questionText: 'I thrive on teamwork and collaboration.' },
  { date: '2026-02-28', category: 'intelligence', answer: 'True', questionText: 'I spend time curating playlists for different moods.' },
  { date: '2026-03-01', category: 'values', answer: 'True', questionText: 'My days generally reflect what I consider a well-lived life.' },
  { date: '2026-03-01', category: 'values', answer: 'True', questionText: 'I exercise autonomy in my daily decisions.' },
  { date: '2026-03-01', category: 'values', answer: 'True', questionText: 'I protect white space in my life — time with no agenda.' },
  { date: '2026-03-01', category: 'archetypes', answer: 'True', questionText: 'I stay in contact with the mythic dimension of my life.' },
  { date: '2026-03-01', category: 'archetypes', answer: 'True', questionText: 'I hold the tension between rational understanding and deeper knowing.' },
  { date: '2026-03-01', category: 'archetypes', answer: 'True', questionText: 'I show courage even when fear is overwhelming.' },
  { date: '2026-03-01', category: 'cognitive', answer: 'True', questionText: 'I evaluate worst-case scenarios without catastrophising.' },
  { date: '2026-03-01', category: 'cognitive', answer: 'True', questionText: 'I make important decisions with clarity and confidence.' },
  { date: '2026-03-01', category: 'cognitive', answer: 'True', questionText: 'Technology has fundamentally changed how I think and communicate.' },
  { date: '2026-03-01', category: 'intelligence', answer: 'True', questionText: 'A song can change my entire emotional state in seconds.' },
  { date: '2026-03-01', category: 'intelligence', answer: 'True', questionText: 'I like building mental models of how things work.' },
  { date: '2026-03-01', category: 'intelligence', answer: 'True', questionText: 'I can read the sky and sense the time or season without a clock.' },
  { date: '2026-03-02', category: 'values', answer: 'True', questionText: 'Faith — in whatever form it takes for me — plays a real role in my daily life.' },
  { date: '2026-03-02', category: 'values', answer: 'True', questionText: 'A moment of unexpected abundance recently reminded me of what truly matters.' },
  { date: '2026-03-02', category: 'archetypes', answer: 'True', questionText: 'My life would look very different if I cared for myself first.' },
  { date: '2026-03-02', category: 'archetypes', answer: 'True', questionText: 'My contrarian nature both helps and isolates me.' },
  { date: '2026-03-02', category: 'cognitive', answer: 'True', questionText: 'Quick decisions work out well for me.' },
  { date: '2026-03-02', category: 'cognitive', answer: 'True', questionText: 'I think about probability naturally in everyday decisions.' },
  { date: '2026-03-02', category: 'intelligence', answer: 'True', questionText: 'I can sense hidden motives in conversations.' },
  { date: '2026-03-02', category: 'intelligence', answer: 'True', questionText: 'I feel that exploring these questions is a core part of who I am.' },
  { date: '2026-03-03', category: 'values', answer: 'True', questionText: 'I would live differently if no one was judging me.' },
  { date: '2026-03-03', category: 'values', answer: 'True', questionText: 'I balance generosity with self-preservation.' },
  { date: '2026-03-03', category: 'archetypes', answer: 'True', questionText: 'I turn self-awareness into actual change, not just insight.' },
  { date: '2026-03-03', category: 'archetypes', answer: 'True', questionText: 'I stay authentic during periods of rapid personal growth.' },
  { date: '2026-03-03', category: 'cognitive', answer: 'True', questionText: 'I use my understanding of patterns to plan and prepare effectively.' },
  { date: '2026-03-03', category: 'cognitive', answer: 'True', questionText: 'I rely on feeling rather than analysis when encountering a stranger.' },
  { date: '2026-03-03', category: 'intelligence', answer: 'True', questionText: 'I feel a strong pull to understand human behaviour.' },
  { date: '2026-03-03', category: 'intelligence', answer: 'True', questionText: 'I set boundaries based on deep self-knowledge.' },
  { date: '2026-03-04', category: 'values', answer: 'True', questionText: 'I keep doing things I wish I had the courage to quit.' },
  { date: '2026-03-04', category: 'values', answer: 'True', questionText: 'My inner world feels vivid and rich today.' },
  { date: '2026-03-04', category: 'values', answer: 'True', questionText: 'Spiritual growth is meaningful to me regardless of religion.' },
  { date: '2026-03-04', category: 'archetypes', answer: 'True', questionText: 'A role is calling me that feels both exciting and terrifying.' },
  { date: '2026-03-04', category: 'archetypes', answer: 'True', questionText: 'I honour the mystery within myself.' },
  { date: '2026-03-04', category: 'archetypes', answer: 'True', questionText: 'I resist the temptation to use power to avoid painful feelings.' },
  { date: '2026-03-04', category: 'cognitive', answer: 'True', questionText: 'I learn by doing rather than by reading instructions.' },
  { date: '2026-03-04', category: 'cognitive', answer: 'True', questionText: 'I use reflection actively to improve my thinking process.' },
  { date: '2026-03-04', category: 'cognitive', answer: 'True', questionText: 'I am actively shifting a recurring theme in my life.' },
  { date: '2026-03-04', category: 'intelligence', answer: 'True', questionText: 'I prefer standing or walking to sitting.' },
  { date: '2026-03-04', category: 'intelligence', answer: 'True', questionText: 'I learn by doing — hands-on experience beats reading.' },
  { date: '2026-03-04', category: 'intelligence', answer: 'True', questionText: 'I focus better with the right kind of background music.' },
  { date: '2026-03-05', category: 'values', answer: 'True', questionText: 'I create space for spontaneity even within a structured life.' },
  { date: '2026-03-05', category: 'values', answer: 'True', questionText: 'I am fully honest with myself about how I feel right now.' },
  { date: '2026-03-05', category: 'archetypes', answer: 'True', questionText: 'Opposing traits within me create my unique character.' },
  { date: '2026-03-05', category: 'archetypes', answer: 'True', questionText: 'Settling has felt right to me rather than suffocating.' },
  { date: '2026-03-05', category: 'cognitive', answer: 'True', questionText: 'Daily reflection has revealed valuable things about myself.' },
  { date: '2026-03-05', category: 'cognitive', answer: 'True', questionText: 'I convey nuance effectively even when words feel insufficient.' },
  { date: '2026-03-05', category: 'intelligence', answer: 'True', questionText: 'I form meaningful connections quickly.' },
  { date: '2026-03-05', category: 'intelligence', answer: 'True', questionText: 'I notice my own cognitive biases in action.' },
  { date: '2026-03-06', category: 'values', answer: 'True', questionText: 'I need to give myself permission to stop doing something.' },
  { date: '2026-03-06', category: 'values', answer: 'True', questionText: 'I treat myself with compassion when I fall short.' },
  { date: '2026-03-06', category: 'archetypes', answer: 'True', questionText: 'I find the sacred in everyday moments.' },
  { date: '2026-03-06', category: 'archetypes', answer: 'True', questionText: 'I channel my energy into something meaningful each day.' },
  { date: '2026-03-06', category: 'cognitive', answer: 'True', questionText: 'A specific memory has shaped how I think today.' },
  { date: '2026-03-06', category: 'cognitive', answer: 'True', questionText: 'I share new ideas despite the vulnerability it requires.' },
  { date: '2026-03-06', category: 'intelligence', answer: 'Not True', questionText: 'I am naturally athletic or physically coordinated.' },
  { date: '2026-03-06', category: 'intelligence', answer: 'True', questionText: 'Music significantly affects my mood.' },
  { date: '2026-03-07', category: 'values', answer: 'True', questionText: 'Freedom means something specific and important to me right now.' },
  { date: '2026-03-07', category: 'values', answer: 'True', questionText: 'I would defend my core principles even if I stood alone.' },
  { date: '2026-03-07', category: 'values', answer: 'True', questionText: 'I can tell when a relationship is nourishing versus draining.' },
  { date: '2026-03-07', category: 'archetypes', answer: 'True', questionText: 'My masks sometimes protect me and sometimes trap me.' },
  { date: '2026-03-07', category: 'archetypes', answer: 'True', questionText: 'I find meaning in the search itself, not just the destination.' },
  { date: '2026-03-07', category: 'archetypes', answer: 'True', questionText: 'A paradox within me has become a source of creative energy.' },
  { date: '2026-03-07', category: 'cognitive', answer: 'True', questionText: 'I sleep on important decisions before finalising them.' },
  { date: '2026-03-07', category: 'cognitive', answer: 'True', questionText: 'I make confident bets on myself and my abilities.' },
  { date: '2026-03-07', category: 'cognitive', answer: 'True', questionText: 'I recover my focus quickly after an interruption.' },
  { date: '2026-03-07', category: 'intelligence', answer: 'True', questionText: 'I think better when I am moving.' },
  { date: '2026-03-07', category: 'intelligence', answer: 'True', questionText: 'I prefer learning through physical demonstration.' },
  { date: '2026-03-07', category: 'intelligence', answer: 'True', questionText: 'I have a strong inner compass that guides my decisions.' },
  { date: '2026-03-08', category: 'values', answer: 'Very True', questionText: 'Caring for the natural world feels like a personal responsibility to me.' },
  { date: '2026-03-08', category: 'values', answer: 'Somewhat', questionText: 'I fully honour my own boundaries.' },
  { date: '2026-03-08', category: 'archetypes', answer: 'True', questionText: 'I am rewriting an old story I used to believe about myself.' },
  { date: '2026-03-08', category: 'archetypes', answer: 'True', questionText: 'I can sense the line between empathy and enmeshment.' },
  { date: '2026-03-08', category: 'cognitive', answer: 'Somewhat', questionText: 'I manage the anxiety of irreversible decisions calmly.' },
  { date: '2026-03-08', category: 'cognitive', answer: 'True', questionText: 'I am attuned to my body\'s signals of danger or opportunity.' },
  { date: '2026-03-08', category: 'intelligence', answer: 'True', questionText: 'I approach creative work with analytical precision.' },
  { date: '2026-03-08', category: 'intelligence', answer: 'True', questionText: 'I notice when I am projecting my feelings onto others.' },
  { date: '2026-03-09', category: 'values', answer: 'True', questionText: 'A boundary I set has improved an important relationship.' },
  { date: '2026-03-09', category: 'values', answer: 'True', questionText: 'I actively celebrate the people I love.' },
  { date: '2026-03-09', category: 'archetypes', answer: 'True', questionText: 'I handle being wrong about something I was certain of with openness.' },
  { date: '2026-03-09', category: 'archetypes', answer: 'True', questionText: 'What I\'m chasing is sometimes a way of running from something else.' },
  { date: '2026-03-09', category: 'cognitive', answer: 'True', questionText: 'I distinguish between a genuinely good idea and an exciting but impractical one.' },
  { date: '2026-03-09', category: 'cognitive', answer: 'True', questionText: 'I manage my greatest cognitive distraction effectively.' },
  { date: '2026-03-09', category: 'intelligence', answer: 'True', questionText: 'I notice how light changes throughout the day.' },
  { date: '2026-03-09', category: 'intelligence', answer: 'True', questionText: 'I regularly check in with my own emotional state.' },
  { date: '2026-03-10', category: 'values', answer: 'True', questionText: 'Specific injustices move me to action more than others.' },
  { date: '2026-03-10', category: 'values', answer: 'True', questionText: 'I have a form of expression that feels completely natural to me.' },
  { date: '2026-03-10', category: 'values', answer: 'True', questionText: 'I can hold space for someone whose actions I disagree with.' },
  { date: '2026-03-10', category: 'archetypes', answer: 'True', questionText: 'There is something in me that needs to die in order for me to grow.' },
  { date: '2026-03-10', category: 'archetypes', answer: 'True', questionText: 'My relationships help me find and refine my sense of purpose.' },
  { date: '2026-03-10', category: 'archetypes', answer: 'True', questionText: 'I naturally question authority and established systems.' },
  { date: '2026-03-10', category: 'cognitive', answer: 'True', questionText: 'I notice subtle signals that others miss.' },
  { date: '2026-03-10', category: 'cognitive', answer: 'True', questionText: 'I remain creative even under pressure.' },
  { date: '2026-03-10', category: 'cognitive', answer: 'True', questionText: 'I handle conflicting advice from people I trust with clarity.' },
  { date: '2026-03-10', category: 'intelligence', answer: 'True', questionText: 'Scientific reasoning excites me more than artistic expression.' },
  { date: '2026-03-10', category: 'intelligence', answer: 'True', questionText: 'I notice ecological patterns — migration, bloom cycles, tides.' },
  { date: '2026-03-10', category: 'intelligence', answer: 'True', questionText: 'I feel that compassion is the highest expression of intelligence.' },
  { date: '2026-03-11', category: 'values', answer: 'True', questionText: 'Total freedom, without any structure, would actually scare me.' },
  { date: '2026-03-11', category: 'values', answer: 'True', questionText: 'People who know me well still have much to discover about me.' },
  { date: '2026-03-11', category: 'archetypes', answer: 'True', questionText: 'Part of my identity feels actively under construction right now.' },
  { date: '2026-03-11', category: 'archetypes', answer: 'True', questionText: 'I would pursue a specific role in the world if nothing held me back.' },
  { date: '2026-03-11', category: 'cognitive', answer: 'True', questionText: 'I distinguish productive concern from anxious rumination.' },
  { date: '2026-03-11', category: 'cognitive', answer: 'True', questionText: 'Understanding how I think has improved my relationships.' },
  { date: '2026-03-11', category: 'intelligence', answer: 'True', questionText: 'I use self-knowledge to navigate relationships more effectively.' },
  { date: '2026-03-11', category: 'intelligence', answer: 'True', questionText: 'I remember things better when I write them down.' },
  { date: '2026-03-12', category: 'values', answer: 'True', questionText: 'There is a person, place, or thing that represents home to me.' },
  { date: '2026-03-12', category: 'values', answer: 'True', questionText: 'There is an area of my life that feels destabilisingly uncertain.' },
  { date: '2026-03-12', category: 'archetypes', answer: 'True', questionText: 'I can envision what the integration of my conflicting parts would look like.' },
  { date: '2026-03-12', category: 'archetypes', answer: 'True', questionText: 'I can sit comfortably with the discomfort of not knowing.' },
  { date: '2026-03-12', category: 'cognitive', answer: 'True', questionText: 'I create ideal conditions for my best thinking.' },
  { date: '2026-03-12', category: 'cognitive', answer: 'True', questionText: 'I read people accurately through intuitive perception.' },
  { date: '2026-03-12', category: 'intelligence', answer: 'True', questionText: 'I negotiate well because I understand what each side needs.' },
  { date: '2026-03-12', category: 'intelligence', answer: 'True', questionText: 'I am drawn to systems that help me understand myself — astrology, psychology, typology.' },
  { date: '2026-03-13', category: 'values', answer: 'True', questionText: 'Family — however I define it — is central to who I am.' },
  { date: '2026-03-13', category: 'values', answer: 'True', questionText: 'A creative dream I set aside still whispers to me.' },
  { date: '2026-03-13', category: 'values', answer: 'Somewhat', questionText: 'Being truly seen by someone feels natural and welcome to me.' },
  { date: '2026-03-13', category: 'archetypes', answer: 'True', questionText: 'Some of my personas serve a genuine purpose while others are just armour.' },
  { date: '2026-03-13', category: 'archetypes', answer: 'True', questionText: 'I balance confidence with genuine humility.' },
  { date: '2026-03-13', category: 'archetypes', answer: 'True', questionText: 'I lead without needing to control.' },
  { date: '2026-03-13', category: 'cognitive', answer: 'True', questionText: 'I return to the same subject again and again because it captivates me.' },
  { date: '2026-03-13', category: 'cognitive', answer: 'True', questionText: 'I protect my attention as the finite resource it is.' },
  { date: '2026-03-13', category: 'cognitive', answer: 'True', questionText: 'I mentally replay certain life experiences more than others.' },
  { date: '2026-03-13', category: 'intelligence', answer: 'True', questionText: 'I feel physical pain at environmental destruction.' },
  { date: '2026-03-13', category: 'intelligence', answer: 'True', questionText: 'I feel physical discomfort in overly artificial environments.' },
  { date: '2026-03-13', category: 'intelligence', answer: 'True', questionText: 'I enjoy physical rituals — stretching, yoga, breathwork.' },
  { date: '2026-03-14', category: 'values', answer: 'True', questionText: 'I am living in a way I want to be remembered for.' },
  { date: '2026-03-14', category: 'values', answer: 'True', questionText: 'The person I am and the person I want to be are growing closer together.' },
  { date: '2026-03-14', category: 'archetypes', answer: 'True', questionText: 'I ask for help instead of pushing through alone.' },
  { date: '2026-03-14', category: 'archetypes', answer: 'True', questionText: 'I am trying to satisfy opposing desires at the same time.' },
  { date: '2026-03-14', category: 'cognitive', answer: 'True', questionText: 'I apply my thinking strengths across new and unfamiliar domains.' },
  { date: '2026-03-14', category: 'cognitive', answer: 'True', questionText: 'I handle being wrong about a pattern I thought I saw with humility.' },
  { date: '2026-03-14', category: 'intelligence', answer: 'True', questionText: 'People come to me for advice or emotional support.' },
  { date: '2026-03-14', category: 'intelligence', answer: 'True', questionText: 'I prefer deep one-on-one conversations over large groups.' },
  { date: '2026-03-15', category: 'values', answer: 'True', questionText: 'I have given care that I am genuinely proud of.' },
  { date: '2026-03-15', category: 'values', answer: 'True', questionText: 'I feel both free and responsible at the same time.' },
  { date: '2026-03-15', category: 'archetypes', answer: 'True', questionText: 'My emotional life is actively evolving.' },
  { date: '2026-03-15', category: 'archetypes', answer: 'True', questionText: 'I have surprised myself by how much I\'ve changed.' },
  { date: '2026-03-15', category: 'cognitive', answer: 'True', questionText: 'I explain complex ideas clearly to people unfamiliar with the subject.' },
  { date: '2026-03-15', category: 'cognitive', answer: 'True', questionText: 'I operate from my focused self far more than my scattered self.' },
  { date: '2026-03-15', category: 'intelligence', answer: 'True', questionText: 'I am drawn to philosophy, theology, or existential literature.' },
  { date: '2026-03-15', category: 'intelligence', answer: 'True', questionText: 'I feel more mentally clear after exercise.' },
  { date: '2026-03-16', category: 'values', answer: 'True', questionText: 'My relationship with risk has matured over time.' },
  { date: '2026-03-16', category: 'values', answer: 'True', questionText: 'I belong to myself even when I don\'t fit a group.' },
  { date: '2026-03-16', category: 'values', answer: 'True', questionText: 'Past setbacks have redirected me toward something better.' },
  { date: '2026-03-16', category: 'archetypes', answer: 'True', questionText: 'I bring a specific energy to a room, and it\'s intentional.' },
  { date: '2026-03-16', category: 'archetypes', answer: 'True', questionText: 'I carry shame that protects something vulnerable in me.' },
  { date: '2026-03-16', category: 'archetypes', answer: 'True', questionText: 'Sitting with my darkest feelings reveals something I need to see.' },
  { date: '2026-03-16', category: 'cognitive', answer: 'True', questionText: 'I pay attention to things I usually overlook.' },
  { date: '2026-03-16', category: 'cognitive', answer: 'True', questionText: 'I remember how people made me feel more than what they said.' },
  { date: '2026-03-16', category: 'cognitive', answer: 'True', questionText: 'My mood positively influences how I approach obstacles.' },
  { date: '2026-03-16', category: 'intelligence', answer: 'True', questionText: 'Physical touch is an important part of how I connect with people.' },
  { date: '2026-03-16', category: 'intelligence', answer: 'True', questionText: 'I express emotions through body language and gesture.' },
  { date: '2026-03-16', category: 'intelligence', answer: 'True', questionText: 'I use music therapeutically — to regulate, energise, or ground myself.' },
  { date: '2026-03-17', category: 'values', answer: 'True', questionText: 'Asking for help is something I do when I need it.' },
  { date: '2026-03-17', category: 'values', answer: 'True', questionText: 'I can make confident choices between two things that both matter.' },
  { date: '2026-03-17', category: 'archetypes', answer: 'True', questionText: 'I reveal my true self slowly and deliberately to new people.' },
  { date: '2026-03-17', category: 'archetypes', answer: 'True', questionText: 'I handle the discomfort of asking for help.' },
  { date: '2026-03-17', category: 'cognitive', answer: 'True', questionText: 'Specific communication styles trigger frustration in me.' },
  { date: '2026-03-17', category: 'cognitive', answer: 'True', questionText: 'My trust in my own intuition has grown over the years.' },
  { date: '2026-03-17', category: 'intelligence', answer: 'True', questionText: 'I feel that silence and stillness reveal truths that activity cannot.' },
  { date: '2026-03-17', category: 'intelligence', answer: 'True', questionText: 'I am deeply self-motivated — external encouragement is nice but not necessary.' },
  { date: '2026-03-18', category: 'values', answer: 'True', questionText: 'I treat my physical health as a foundation, not an afterthought.' },
  { date: '2026-03-18', category: 'values', answer: 'True', questionText: 'A lesson keeps returning to me because I haven\'t fully learned it yet.' },
  { date: '2026-03-18', category: 'archetypes', answer: 'True', questionText: 'I turn my insights into action rather than staying in my head.' },
  { date: '2026-03-18', category: 'archetypes', answer: 'True', questionText: 'I balance my desire for newness with appreciation for what I already have.' },
  { date: '2026-03-18', category: 'cognitive', answer: 'True', questionText: 'I engage most deeply in learning experiences that are hands-on and immersive.' },
  { date: '2026-03-18', category: 'cognitive', answer: 'True', questionText: 'I invite serendipity into my thinking process.' },
  { date: '2026-03-18', category: 'intelligence', answer: 'True', questionText: 'I find comfort in the rhythm and sound of words.' },
  { date: '2026-03-18', category: 'intelligence', answer: 'True', questionText: 'I can reproduce a rhythm after hearing it once.' },
  { date: '2026-03-19', category: 'values', answer: 'True', questionText: 'I navigate the tension between security and adventure with clarity.' },
  { date: '2026-03-19', category: 'values', answer: 'True', questionText: 'A key relationship has shaped who I am today.' },
  { date: '2026-03-19', category: 'values', answer: 'True', questionText: 'I have expressed who I truly am in brave ways.' },
  { date: '2026-03-19', category: 'archetypes', answer: 'True', questionText: 'My rebellious streak is constructive rather than destructive.' },
  { date: '2026-03-19', category: 'archetypes', answer: 'True', questionText: 'I step up when no one else will.' },
  { date: '2026-03-19', category: 'archetypes', answer: 'True', questionText: 'A single conversation has profoundly transformed how I see myself.' },
  { date: '2026-03-19', category: 'cognitive', answer: 'True', questionText: 'I know when I have truly learned from an experience.' },
  { date: '2026-03-19', category: 'cognitive', answer: 'True', questionText: 'My memories of important events have changed and evolved over time.' },
  { date: '2026-03-19', category: 'cognitive', answer: 'True', questionText: 'I evaluate the credibility of new information sources carefully.' },
  { date: '2026-03-19', category: 'intelligence', answer: 'True', questionText: 'I prefer natural or earth-toned aesthetics in my surroundings.' },
  { date: '2026-03-19', category: 'intelligence', answer: 'True', questionText: 'I notice when my life feels meaningful and when it does not.' },
  { date: '2026-03-19', category: 'intelligence', answer: 'True', questionText: 'Reading is one of my favourite ways to spend time.' },
  { date: '2026-03-20', category: 'values', answer: 'True', questionText: 'I feel creatively alive on a regular basis.' },
  { date: '2026-03-20', category: 'values', answer: 'True', questionText: 'I offer compassion without absorbing others\' suffering.' },
  { date: '2026-03-20', category: 'archetypes', answer: 'True', questionText: 'I express power without dominating others.' },
  { date: '2026-03-20', category: 'archetypes', answer: 'True', questionText: 'There is a system in my life that needs disrupting.' },
  { date: '2026-03-20', category: 'cognitive', answer: 'True', questionText: 'I prefer having a clear recommendation over many open options.' },
  { date: '2026-03-20', category: 'cognitive', answer: 'True', questionText: 'I have effective techniques for staying focused during long discussions.' },
  { date: '2026-03-20', category: 'intelligence', answer: 'True', questionText: 'Writing helps me discover what I actually think.' },
  { date: '2026-03-20', category: 'intelligence', answer: 'True', questionText: 'I feel deeply connected to the people in my life.' },
  { date: '2026-03-21', category: 'values', answer: 'True', questionText: 'My life has a clear direction right now.' },
  { date: '2026-03-21', category: 'values', answer: 'True', questionText: 'I know the difference between excellence and perfectionism.' },
  { date: '2026-03-21', category: 'archetypes', answer: 'True', questionText: 'I define myself by more than my job title or social labels.' },
  { date: '2026-03-21', category: 'archetypes', answer: 'True', questionText: 'I stay connected to community while maintaining my radical independence.' },
  { date: '2026-03-21', category: 'cognitive', answer: 'True', questionText: 'I fact-check my own assumptions before accepting them.' },
  { date: '2026-03-21', category: 'cognitive', answer: 'True', questionText: 'Time pressure improves rather than impairs my decision quality.' },
  { date: '2026-03-21', category: 'intelligence', answer: 'True', questionText: 'Physical mastery gives me a deep sense of accomplishment.' },
  { date: '2026-03-21', category: 'intelligence', answer: 'True', questionText: 'I think about the meaning of life more than most people.' },
  { date: '2026-03-22', category: 'values', answer: 'True', questionText: 'My relationship with the seasons reflects something true about my inner life.' },
  { date: '2026-03-22', category: 'values', answer: 'True', questionText: 'I stay true to my ethics even when they conflict with social norms.' },
  { date: '2026-03-22', category: 'values', answer: 'True', questionText: 'I reach for healthy things first when I feel overwhelmed.' },
  { date: '2026-03-22', category: 'archetypes', answer: 'True', questionText: 'My analytical mind both serves and limits me.' },
  { date: '2026-03-22', category: 'archetypes', answer: 'True', questionText: 'I nurture the parts of myself that cannot be measured.' },
  { date: '2026-03-22', category: 'archetypes', answer: 'True', questionText: 'My rebellious energy has matured over time.' },
  { date: '2026-03-22', category: 'cognitive', answer: 'True', questionText: 'I build arguments using logic rather than emotion or narrative.' },
  { date: '2026-03-22', category: 'cognitive', answer: 'True', questionText: 'I redirect my attention when my mind wanders during something important.' },
  { date: '2026-03-22', category: 'cognitive', answer: 'True', questionText: 'I nurture ideas from initial spark all the way to fully formed concepts.' },
  { date: '2026-03-22', category: 'intelligence', answer: 'Somewhat', questionText: 'I can quickly estimate whether a claim is plausible based on numbers.' },
  { date: '2026-03-22', category: 'intelligence', answer: 'True', questionText: 'I enjoy physical improvisation — free movement, contact improv, play.' },
  { date: '2026-03-22', category: 'intelligence', answer: 'True', questionText: 'I feel emotionally mature compared to others my age.' },
  { date: '2026-03-23', category: 'values', answer: 'True', questionText: 'I feel deeply aligned with my sense of purpose.' },
  { date: '2026-03-23', category: 'values', answer: 'True', questionText: 'I feel proud of the person I am becoming.' },
  { date: '2026-03-23', category: 'archetypes', answer: 'True', questionText: 'I play an unofficial role in my family that was never assigned to me.' },
  { date: '2026-03-23', category: 'archetypes', answer: 'True', questionText: 'I am befriending parts of myself I was taught to suppress.' },
  { date: '2026-03-23', category: 'cognitive', answer: 'True', questionText: 'I direct attention to my inner life even during a busy day.' },
  { date: '2026-03-23', category: 'cognitive', answer: 'True', questionText: 'I store and retrieve memories of important conversations accurately.' },
  { date: '2026-03-23', category: 'intelligence', answer: 'True', questionText: 'I experience music as colours, textures, or images.' },
  { date: '2026-03-23', category: 'intelligence', answer: 'True', questionText: 'I compose or improvise music in my head.' },
  { date: '2026-03-24', category: 'values', answer: 'True', questionText: 'I manage compassion fatigue by actively replenishing myself.' },
  { date: '2026-03-24', category: 'values', answer: 'True', questionText: 'I create rituals and traditions that bring the people I love together.' },
  { date: '2026-03-24', category: 'archetypes', answer: 'True', questionText: 'I sometimes need to rebel against my own rebel.' },
  { date: '2026-03-24', category: 'archetypes', answer: 'True', questionText: 'My need for freedom affects my ability to commit.' },
  { date: '2026-03-24', category: 'cognitive', answer: 'True', questionText: 'My unconventional thinking approach serves me well even when it isn\'t rewarded.' },
  { date: '2026-03-24', category: 'cognitive', answer: 'True', questionText: 'I retain the key points from long conversations accurately.' },
  { date: '2026-03-24', category: 'intelligence', answer: 'True', questionText: 'I have a detailed mental model of how my own mind works.' },
  { date: '2026-03-24', category: 'intelligence', answer: 'True', questionText: 'I can look at a flat pattern and imagine the 3D object it creates.' },
  { date: '2026-03-25', category: 'values', answer: 'True', questionText: 'I celebrate belonging when I have it rather than taking it for granted.' },
  { date: '2026-03-25', category: 'values', answer: 'True', questionText: 'I would benefit from a conversation with a wise mentor.' },
  { date: '2026-03-25', category: 'values', answer: 'True', questionText: 'I can distinguish between healthy solitude and unhealthy isolation.' },
  { date: '2026-03-25', category: 'archetypes', answer: 'True', questionText: 'A transformation that scared me turned out beautifully.' },
  { date: '2026-03-25', category: 'archetypes', answer: 'True', questionText: 'I can discern truth from comfortable illusion.' },
  { date: '2026-03-25', category: 'archetypes', answer: 'True', questionText: 'An emerging part of myself genuinely excites me.' },
  { date: '2026-03-25', category: 'cognitive', answer: 'True', questionText: 'My thinking style has shaped my career or life path significantly.' },
  { date: '2026-03-25', category: 'cognitive', answer: 'True', questionText: 'I actively cultivate and develop my intuitive sense.' },
  { date: '2026-03-25', category: 'cognitive', answer: 'True', questionText: 'I balance pattern recognition with remaining open to exceptions.' },
  { date: '2026-03-25', category: 'intelligence', answer: 'True', questionText: 'I notice logical errors in arguments other people make.' },
  { date: '2026-03-25', category: 'intelligence', answer: 'True', questionText: 'I believe inner growth is the most important work a person can do.' },
  { date: '2026-03-25', category: 'intelligence', answer: 'True', questionText: 'I use past experiences to make better future decisions.' },
  { date: '2026-03-26', category: 'values', answer: 'True', questionText: 'I can clearly distinguish between my wants and my needs.' },
  { date: '2026-03-26', category: 'values', answer: 'True', questionText: 'I handle disagreements with people I care about in a healthy way.' },
  { date: '2026-03-26', category: 'archetypes', answer: 'True', questionText: 'An inner contradiction is a defining part of who I am.' },
  { date: '2026-03-26', category: 'archetypes', answer: 'True', questionText: 'My inner fire is alive and burning.' },
  { date: '2026-03-26', category: 'cognitive', answer: 'True', questionText: 'I handle choices with no clear right answer without becoming paralysed.' },
  { date: '2026-03-26', category: 'cognitive', answer: 'True', questionText: 'I summarise complex information for myself effectively.' },
  { date: '2026-03-26', category: 'intelligence', answer: 'True', questionText: 'I enjoy the physicality of nature — climbing, swimming, hiking.' },
  { date: '2026-03-26', category: 'intelligence', answer: 'True', questionText: 'I am fascinated by the history and origin of words.' },
  { date: '2026-03-27', category: 'values', answer: 'True', questionText: 'I handle repeated boundary violations with firmness and clarity.' },
  { date: '2026-03-27', category: 'values', answer: 'True', questionText: 'I am able to forgive even when the other person isn\'t sorry.' },
  { date: '2026-03-27', category: 'archetypes', answer: 'True', questionText: 'I navigate the soul\'s seasons — growth, decay, dormancy, rebirth — with awareness.' },
  { date: '2026-03-27', category: 'archetypes', answer: 'True', questionText: 'I have a complex relationship with authority figures.' },
  { date: '2026-03-27', category: 'cognitive', answer: 'True', questionText: 'I do my deepest work during a specific, consistent time of day.' },
  { date: '2026-03-27', category: 'cognitive', answer: 'True', questionText: 'Nostalgia plays a meaningful role in my thinking.' },
  { date: '2026-03-27', category: 'intelligence', answer: 'True', questionText: 'I can recognise the difference between what I feel and what I think.' },
  { date: '2026-03-27', category: 'intelligence', answer: 'True', questionText: 'I look for cause-and-effect relationships in what happens around me.' },
  { date: '2026-03-28', category: 'values', answer: 'True', questionText: 'I have made peace with things I wish I could tell my younger self.' },
  { date: '2026-03-28', category: 'values', answer: 'True', questionText: 'Someone specific taught me the most about caring for others.' },
  { date: '2026-03-28', category: 'values', answer: 'True', questionText: 'I feel most like myself when I follow my own instincts.' },
  { date: '2026-03-28', category: 'archetypes', answer: 'True', questionText: 'Some of my caring is performed rather than genuinely felt.' },
  { date: '2026-03-28', category: 'archetypes', answer: 'True', questionText: 'Part of my potential remains unlived.' },
  { date: '2026-03-28', category: 'archetypes', answer: 'True', questionText: 'My past self still influences my present choices.' },
  { date: '2026-03-28', category: 'cognitive', answer: 'True', questionText: 'I trust counterintuitive decisions that go against conventional wisdom.' },
  { date: '2026-03-28', category: 'cognitive', answer: 'True', questionText: 'Unexpected things capture my attention involuntarily.' },
  { date: '2026-03-28', category: 'cognitive', answer: 'True', questionText: 'I use an analytical framework — even an informal one — in daily life.' },
  { date: '2026-03-28', category: 'intelligence', answer: 'True', questionText: 'Poetry or lyrical writing moves me deeply.' },
  { date: '2026-03-28', category: 'intelligence', answer: 'True', questionText: 'I use specific music to access certain memories or emotional states.' },
  { date: '2026-03-28', category: 'intelligence', answer: 'True', questionText: 'I notice inefficiencies in processes and systems.' },
  { date: '2026-03-29', category: 'values', answer: 'True', questionText: 'A wounded part of me needs tenderness that I haven\'t fully given it.' },
  { date: '2026-03-29', category: 'values', answer: 'True', questionText: 'I choose purpose over comfort when it matters.' },
  { date: '2026-03-29', category: 'archetypes', answer: 'True', questionText: 'My seeking nature comes at a real cost to my relationships.' },
  { date: '2026-03-29', category: 'archetypes', answer: 'True', questionText: 'I would tear down something old to build something better.' },
  { date: '2026-03-29', category: 'cognitive', answer: 'True', questionText: 'I use self-observation to make better choices.' },
  { date: '2026-03-29', category: 'cognitive', answer: 'True', questionText: 'I approach personal problems differently than work problems.' },
  { date: '2026-03-29', category: 'intelligence', answer: 'True', questionText: 'I notice when someone needs support even before they ask.' },
  { date: '2026-03-29', category: 'intelligence', answer: 'True', questionText: 'I am drawn to photography, film, or visual storytelling.' },
  { date: '2026-03-30', category: 'values', answer: 'True', questionText: 'I feel fully authentic in the most important areas of my life.' },
  { date: '2026-03-30', category: 'values', answer: 'True', questionText: 'I hold opinions that most people around me would disagree with.' },
  { date: '2026-03-30', category: 'archetypes', answer: 'True', questionText: 'I am letting go of the need for internal consistency.' },
  { date: '2026-03-30', category: 'archetypes', answer: 'True', questionText: 'There is something I would defend even if I were the only one standing.' },
  { date: '2026-03-30', category: 'cognitive', answer: 'True', questionText: 'I generate new ideas even when I feel stuck.' },
  { date: '2026-03-30', category: 'cognitive', answer: 'True', questionText: 'I approach new problems with a clear go-to method.' },
  { date: '2026-03-30', category: 'intelligence', answer: 'True', questionText: 'I understand my own defence mechanisms.' },
  { date: '2026-03-30', category: 'intelligence', answer: 'True', questionText: 'I feel responsible for the emotional well-being of those around me.' },
  { date: '2026-03-31', category: 'values', answer: 'True', questionText: 'Trust builds slowly in me, but it builds solidly.' },
  { date: '2026-03-31', category: 'values', answer: 'True', questionText: 'I am clear about which commitments truly deserve my energy.' },
  { date: '2026-03-31', category: 'values', answer: 'True', questionText: 'I have experienced what unconditional acceptance feels like.' },
  { date: '2026-03-31', category: 'archetypes', answer: 'True', questionText: 'I listen to the quiet voice beneath all the noise.' },
  { date: '2026-03-31', category: 'archetypes', answer: 'True', questionText: 'Jealousy has shown me something important about my true desires.' },
  { date: '2026-03-31', category: 'archetypes', answer: 'True', questionText: 'I disown parts of myself in public settings.' },
  { date: '2026-03-31', category: 'cognitive', answer: 'True', questionText: 'I perform at my cognitive best when I feel psychologically safe.' },
  { date: '2026-03-31', category: 'cognitive', answer: 'True', questionText: 'I filter what to pay attention to and what to ignore efficiently.' },
  { date: '2026-03-31', category: 'cognitive', answer: 'True', questionText: 'I reframe uncertainty as possibility and openness.' },
  { date: '2026-03-31', category: 'intelligence', answer: 'True', questionText: 'I think about whether time is real or constructed.' },
  { date: '2026-03-31', category: 'intelligence', answer: 'True', questionText: 'I am fascinated by animal behaviour and consciousness.' },
  { date: '2026-03-31', category: 'intelligence', answer: 'True', questionText: 'I am curious about the relationship between mind and brain.' },
  { date: '2026-04-01', category: 'values', answer: 'True', questionText: 'I handle creative blocks with patience and curiosity.' },
  { date: '2026-04-01', category: 'values', answer: 'True', questionText: 'Other people\'s experiences move me deeply.' },
  { date: '2026-04-01', category: 'archetypes', answer: 'True', questionText: 'I recognise when resistance is blocking my transformation.' },
  { date: '2026-04-01', category: 'archetypes', answer: 'True', questionText: 'I have one persona that is closer to my core than any other.' },
  { date: '2026-04-01', category: 'cognitive', answer: 'True', questionText: 'I use analogies effectively to make sense of new situations.' },
  { date: '2026-04-01', category: 'cognitive', answer: 'True', questionText: 'I prepare for unpredictable outcomes without spiralling into anxiety.' },
  { date: '2026-04-01', category: 'intelligence', answer: 'True', questionText: 'I find it easy to summarize what I have read or heard.' },
  { date: '2026-04-01', category: 'intelligence', answer: 'True', questionText: 'I am deeply affected by changes in weather or seasons.' },
  { date: '2026-04-02', category: 'values', answer: 'Somewhat', questionText: 'I stand up for my beliefs even when it comes at a cost.' },
  { date: '2026-04-02', category: 'values', answer: 'True', questionText: 'I practise small acts of justice and fairness daily.' },
  { date: '2026-04-02', category: 'archetypes', answer: 'True', questionText: 'I have finally understood a life pattern after years of living it.' },
  { date: '2026-04-02', category: 'archetypes', answer: 'True', questionText: 'I have been the villain in someone else\'s story without realising it.' },
  { date: '2026-04-02', category: 'cognitive', answer: 'True', questionText: 'I use unconventional approaches to problem-solving effectively.' },
  { date: '2026-04-02', category: 'cognitive', answer: 'True', questionText: 'Deepening my self-knowledge has changed how I approach the world.' },
  { date: '2026-04-02', category: 'intelligence', answer: 'True', questionText: 'I think about the nature of suffering and its role in growth.' },
  { date: '2026-04-02', category: 'intelligence', answer: 'Very True', questionText: 'My body holds memories that my mind has forgotten.' },
  { date: '2026-04-03', category: 'values', answer: 'Somewhat', questionText: 'I receive gifts, compliments, and help with genuine openness.' },
  { date: '2026-04-03', category: 'values', answer: 'True', questionText: 'I feel grounded even when everything around me is shifting.' },
  { date: '2026-04-03', category: 'values', answer: 'True', questionText: 'I carry emotional patterns inherited from my family.' },
  { date: '2026-04-03', category: 'archetypes', answer: 'True', questionText: 'I have recently felt powerless and had to find my way through it.' },
  { date: '2026-04-03', category: 'archetypes', answer: 'True', questionText: 'I am creating peace between my perfectionism and my humanity.' },
  { date: '2026-04-03', category: 'archetypes', answer: 'True', questionText: 'I am actively reconciling past trauma with present strength.' },
  { date: '2026-04-03', category: 'cognitive', answer: 'True', questionText: 'I cope effectively when outcomes are completely out of my hands.' },
  { date: '2026-04-03', category: 'cognitive', answer: 'True', questionText: 'Others count on me for a specific cognitive strength.' },
  { date: '2026-04-03', category: 'cognitive', answer: 'True', questionText: 'I work comfortably on problems whose end I cannot yet see.' },
  { date: '2026-04-03', category: 'intelligence', answer: 'Somewhat', questionText: 'I organise my thoughts spatially — mind maps, diagrams, or layouts.' },
  { date: '2026-04-03', category: 'intelligence', answer: 'True', questionText: 'I am good at packing, fitting objects into containers efficiently.' },
  { date: '2026-04-03', category: 'intelligence', answer: 'True', questionText: 'I am drawn to physical forms of art — pottery, sculpture, carpentry.' },
  { date: '2026-04-04', category: 'values', answer: 'True', questionText: 'The values I most want to pass on are active in my daily life.' },
  { date: '2026-04-04', category: 'values', answer: 'True', questionText: 'I struggle to forgive certain things, and that reveals something about my values.' },
  { date: '2026-04-04', category: 'archetypes', answer: 'True', questionText: 'I listen without giving advice when that\'s what someone truly needs.' },
  { date: '2026-04-04', category: 'archetypes', answer: 'True', questionText: 'My life roles — parent, partner, professional — compete for dominance.' },
  { date: '2026-04-04', category: 'cognitive', answer: 'True', questionText: 'My inner creator speaks louder than my inner critic.' },
  { date: '2026-04-04', category: 'cognitive', answer: 'True', questionText: 'I find a way to get unstuck when I\'m blocked.' },
  { date: '2026-04-04', category: 'intelligence', answer: 'True', questionText: 'I notice the quality of air, light, and water wherever I go.' },
  { date: '2026-04-04', category: 'intelligence', answer: 'Somewhat', questionText: 'I learn best from diagrams, maps, and charts.' },
  { date: '2026-04-05', category: 'values', answer: 'True', questionText: 'There are certain people I find it harder to be compassionate toward.' },
  { date: '2026-04-05', category: 'values', answer: 'True', questionText: 'The people I am most alive with are the ones I laugh with most.' },
  { date: '2026-04-05', category: 'archetypes', answer: 'True', questionText: 'I stand in my power on ordinary days, not just dramatic ones.' },
  { date: '2026-04-05', category: 'archetypes', answer: 'True', questionText: 'I know the difference between rebellion and self-destruction.' },
  { date: '2026-04-05', category: 'cognitive', answer: 'True', questionText: 'I find meaningful connections in coincidences.' },
  { date: '2026-04-05', category: 'cognitive', answer: 'True', questionText: 'I detect when someone is not being fully honest.' },
  { date: '2026-04-05', category: 'intelligence', answer: 'True', questionText: 'I prefer precise language over approximate descriptions.' },
  { date: '2026-04-05', category: 'intelligence', answer: 'True', questionText: 'I often wonder if there are dimensions of reality we cannot perceive.' },
  { date: '2026-04-06', category: 'values', answer: 'True', questionText: 'I have a guiding sense of meaning that carries me through uncertainty.' },
  { date: '2026-04-06', category: 'values', answer: 'True', questionText: 'I pretend not to care about things that actually matter to me.' },
  { date: '2026-04-06', category: 'values', answer: 'True', questionText: 'I respond to ethical tests with integrity.' },
  { date: '2026-04-06', category: 'archetypes', answer: 'True', questionText: 'I need to challenge my own inner authority right now.' },
  { date: '2026-04-06', category: 'archetypes', answer: 'True', questionText: 'My most guarded self and my most unguarded self need a conversation.' },
  { date: '2026-04-06', category: 'archetypes', answer: 'True', questionText: 'I have a clear understanding of what personal power means to me.' },
  { date: '2026-04-06', category: 'cognitive', answer: 'True', questionText: 'I manage the mental cost of context switching well.' },
  { date: '2026-04-06', category: 'cognitive', answer: 'True', questionText: 'I handle the discomfort of being a beginner with patience.' },
  { date: '2026-04-06', category: 'cognitive', answer: 'True', questionText: 'Recurring memories reveal important things about my current needs.' },
  { date: '2026-04-06', category: 'intelligence', answer: 'True', questionText: 'I feel a deep sense of wonder about the natural world.' },
  { date: '2026-04-06', category: 'intelligence', answer: 'True', questionText: 'I notice sounds in nature — birdsong, wind, water — that others miss.' },
  { date: '2026-04-06', category: 'intelligence', answer: 'True', questionText: 'I think about ethics and moral philosophy in everyday situations.' },
  { date: '2026-04-07', category: 'values', answer: 'True', questionText: 'A specific choice I made gave me a powerful sense of freedom.' },
  { date: '2026-04-07', category: 'values', answer: 'True', questionText: 'My definition of success reflects my own truth, not society\'s.' },
  { date: '2026-04-07', category: 'archetypes', answer: 'True', questionText: 'I can be vulnerable without feeling weak.' },
  { date: '2026-04-07', category: 'archetypes', answer: 'True', questionText: 'I balance my desire for connection with my need for solitude.' },
  { date: '2026-04-07', category: 'cognitive', answer: 'True', questionText: 'I deliberate carefully before committing to choices.' },
  { date: '2026-04-07', category: 'cognitive', answer: 'True', questionText: 'I catch myself overthinking and shift back to action.' },
  { date: '2026-04-07', category: 'intelligence', answer: 'Somewhat', questionText: 'I am drawn to geometry, fractals, or visual patterns.' },
  { date: '2026-04-07', category: 'intelligence', answer: 'True', questionText: 'I am visually creative — I see beauty in unexpected places.' },
  { date: '2026-04-08', category: 'values', answer: 'True', questionText: 'I am intentional about which causes deserve my energy.' },
  { date: '2026-04-08', category: 'values', answer: 'True', questionText: 'I build stability without becoming rigid.' },
  { date: '2026-04-08', category: 'archetypes', answer: 'True', questionText: 'A self-sabotaging behaviour keeps returning because it serves a hidden need.' },
  { date: '2026-04-08', category: 'archetypes', answer: 'True', questionText: 'I handle intellectual disagreements without making them personal.' },
  { date: '2026-04-08', category: 'cognitive', answer: 'True', questionText: 'I form opinions quickly when presented with new information.' },
  { date: '2026-04-08', category: 'cognitive', answer: 'True', questionText: 'I sustain deep concentration for extended periods.' },
  { date: '2026-04-08', category: 'intelligence', answer: 'True', questionText: 'I express emotions more easily through music than words.' },
  { date: '2026-04-08', category: 'intelligence', answer: 'True', questionText: 'I remember quotes and phrases long after I read them.' },
  { date: '2026-04-09', category: 'values', answer: 'True', questionText: 'I am able to repair trust when it breaks.' },
  { date: '2026-04-09', category: 'values', answer: 'True', questionText: 'I know how to reclaim myself after giving too much away.' },
  { date: '2026-04-09', category: 'values', answer: 'True', questionText: 'I navigate situations where someone needs more from me than I can give.' },
  { date: '2026-04-09', category: 'archetypes', answer: 'True', questionText: 'A defining battle — literal or figurative — has shaped who I am.' },
  { date: '2026-04-09', category: 'archetypes', answer: 'True', questionText: 'Someone has said something empowering to me that still stays with me.' },
  { date: '2026-04-09', category: 'archetypes', answer: 'True', questionText: 'I am growing even when it doesn\'t feel like it.' },
  { date: '2026-04-09', category: 'cognitive', answer: 'Very True', questionText: 'I process my emotions through language.' },
  { date: '2026-04-09', category: 'cognitive', answer: 'True', questionText: 'I develop my cognitive weaknesses rather than only leaning into my strengths.' },
  { date: '2026-04-09', category: 'cognitive', answer: 'True', questionText: 'I integrate new knowledge with what I already know seamlessly.' },
  { date: '2026-04-09', category: 'intelligence', answer: 'True', questionText: 'I am sensitive to tone and subtext in written messages.' },
  { date: '2026-04-09', category: 'intelligence', answer: 'True', questionText: 'I am comfortable with emotional complexity — I can hold multiple feelings at once.' },
  { date: '2026-04-09', category: 'intelligence', answer: 'True', questionText: 'I easily identify the key variables in a complex situation.' },
  { date: '2026-04-10', category: 'values', answer: 'True', questionText: 'My kindness is worth what it costs me.' },
  { date: '2026-04-10', category: 'values', answer: 'True', questionText: 'I speak difficult truths even when it\'s uncomfortable.' },
  { date: '2026-04-10', category: 'archetypes', answer: 'True', questionText: 'I care for people without trying to fix them.' },
  { date: '2026-04-10', category: 'archetypes', answer: 'True', questionText: 'I distinguish between fighting a good fight and picking unnecessary battles.' },
  { date: '2026-04-10', category: 'cognitive', answer: 'True', questionText: 'I handle uncertainty in relationships with composure.' },
  { date: '2026-04-10', category: 'cognitive', answer: 'True', questionText: 'Specific sensory triggers bring a flood of old memories.' },
  { date: '2026-04-10', category: 'intelligence', answer: 'True', questionText: 'I enjoy design, architecture, or visual arts.' },
  { date: '2026-04-10', category: 'intelligence', answer: 'True', questionText: 'I enjoy gardening, foraging, or tending living things.' },
  { date: '2026-04-11', category: 'values', answer: 'True', questionText: 'A specific place in nature holds deep meaning for me.' },
  { date: '2026-04-11', category: 'values', answer: 'True', questionText: 'I can find something funny even in my own suffering.' },
  { date: '2026-04-11', category: 'archetypes', answer: 'True', questionText: 'Dropping all my masks for a day would be both terrifying and liberating.' },
  { date: '2026-04-11', category: 'archetypes', answer: 'True', questionText: 'I am deeply aware of what is most beautiful about being human.' },
  { date: '2026-04-11', category: 'cognitive', answer: 'True', questionText: 'I adapt my thinking style for different kinds of challenges.' },
  { date: '2026-04-11', category: 'cognitive', answer: 'True', questionText: 'I balance structured learning with explorative discovery.' },
  { date: '2026-04-11', category: 'intelligence', answer: 'True', questionText: 'I process information best when it is colour-coded or spatially arranged.' },
  { date: '2026-04-11', category: 'intelligence', answer: 'True', questionText: 'I am physically expressive — people can read my body easily.' },
  { date: '2026-04-12', category: 'values', answer: 'True', questionText: 'I have a clear vision of how I want to grow in the next year.' },
  { date: '2026-04-12', category: 'values', answer: 'True', questionText: 'I am tolerating things in my life that conflict with my values.' },
  { date: '2026-04-12', category: 'values', answer: 'True', questionText: 'Complexity in my life often masks a lack of clarity about what matters.' },
  { date: '2026-04-12', category: 'archetypes', answer: 'True', questionText: 'I navigate the tension between going deep and going wide in life.' },
  { date: '2026-04-12', category: 'archetypes', answer: 'True', questionText: 'I carry wisdom I could share with someone going through what I once went through.' },
  { date: '2026-04-12', category: 'archetypes', answer: 'True', questionText: 'I am living inside a myth of my own making.' },
  { date: '2026-04-12', category: 'cognitive', answer: 'True', questionText: 'I think most effectively in writing rather than speaking or drawing.' },
  { date: '2026-04-12', category: 'cognitive', answer: 'True', questionText: 'I analyse complex issues thoroughly and effectively.' },
  { date: '2026-04-12', category: 'cognitive', answer: 'True', questionText: 'My inner monologue is structured and clear.' },
  { date: '2026-04-12', category: 'intelligence', answer: 'Not True', questionText: 'I prefer evidence-based decisions over intuition.' },
  { date: '2026-04-12', category: 'intelligence', answer: 'True', questionText: 'I remember places by their visual landmarks.' },
  { date: '2026-04-12', category: 'intelligence', answer: 'Somewhat', questionText: 'I enjoy group brainstorming and collaborative thinking.' },
  { date: '2026-04-13', category: 'values', answer: 'True', questionText: 'I over-control parts of my life because of an underlying fear.' },
  { date: '2026-04-13', category: 'values', answer: 'Very True', questionText: 'My family of origin has shaped me in ways I am still discovering.' },
  { date: '2026-04-13', category: 'archetypes', answer: 'True', questionText: 'I handle someone trying to diminish my power with composure.' },
  { date: '2026-04-13', category: 'archetypes', answer: 'True', questionText: 'I respect both my extraverted and introverted needs.' },
  { date: '2026-04-13', category: 'cognitive', answer: 'True', questionText: 'I articulate what I think with precision and clarity.' },
  { date: '2026-04-13', category: 'cognitive', answer: 'True', questionText: 'I recognise when I am reasoning well versus poorly.' },
  { date: '2026-04-13', category: 'intelligence', answer: 'True', questionText: 'I am deeply curious about what happens after death.' },
  { date: '2026-04-13', category: 'intelligence', answer: 'True', questionText: 'I prefer natural materials over synthetic ones.' },
  { date: '2026-04-14', category: 'values', answer: 'Very True', questionText: 'There are areas of my life that need stronger boundaries right now.' },
  { date: '2026-04-14', category: 'values', answer: 'True', questionText: 'I share my creative gifts generously with others.' },
  { date: '2026-04-14', category: 'archetypes', answer: 'True', questionText: 'I am embodying a specific archetype in this season of my life.' },
  { date: '2026-04-14', category: 'archetypes', answer: 'True', questionText: 'I am approaching a meaningful milestone of personal growth.' },
  { date: '2026-04-14', category: 'cognitive', answer: 'True', questionText: 'I adjust my beliefs when I discover I\'ve been wrong.' },
  { date: '2026-04-14', category: 'cognitive', answer: 'True', questionText: 'I find deep satisfaction in thorough analysis.' },
  { date: '2026-04-14', category: 'intelligence', answer: 'True', questionText: 'I am drawn to live music and feel it differently than recorded music.' },
  { date: '2026-04-14', category: 'intelligence', answer: 'True', questionText: 'I know what triggers my anxiety, anger, or sadness.' },
  { date: '2026-04-15', category: 'values', answer: 'Very True', questionText: 'I know exactly how I want to be cared for when I\'m at my lowest.' },
  { date: '2026-04-15', category: 'values', answer: 'True', questionText: 'I stay grounded during periods of uncertainty.' },
  { date: '2026-04-15', category: 'values', answer: 'True', questionText: 'I prepare for the unknown without living in anxiety.' },
  { date: '2026-04-15', category: 'archetypes', answer: 'True', questionText: 'My soul needs something that my ego keeps ignoring.' },
  { date: '2026-04-15', category: 'archetypes', answer: 'True', questionText: 'Powerlessness has a specific, recognisable feeling in my body.' },
  { date: '2026-04-15', category: 'archetypes', answer: 'True', questionText: 'I maintain dignity when life strips away my defences.' },
  { date: '2026-04-15', category: 'cognitive', answer: 'True', questionText: 'I process disagreements in real-time conversation effectively.' },
  { date: '2026-04-15', category: 'cognitive', answer: 'True', questionText: 'I notice when my attention is being manipulated.' },
  { date: '2026-04-15', category: 'cognitive', answer: 'True', questionText: 'I review my day mentally before sleep.' },
  { date: '2026-04-15', category: 'intelligence', answer: 'True', questionText: 'I enjoy experimenting with sound — instruments, apps, or voice.' },
  { date: '2026-04-15', category: 'intelligence', answer: 'True', questionText: 'I instinctively rearrange spaces to make them feel better.' },
  { date: '2026-04-15', category: 'intelligence', answer: 'True', questionText: 'I am drawn to philosophical paradoxes and thought experiments.' },
  { date: '2026-04-16', category: 'values', answer: 'True', questionText: 'Honour is an active part of my personal code.' },
  { date: '2026-04-16', category: 'values', answer: 'True', questionText: 'I am willing to be a beginner at something new.' },
  { date: '2026-04-16', category: 'archetypes', answer: 'True', questionText: 'The most important things in my life are invisible.' },
  { date: '2026-04-16', category: 'archetypes', answer: 'True', questionText: 'I stay anchored even when my purpose feels unclear.' },
  { date: '2026-04-16', category: 'cognitive', answer: 'True', questionText: 'I move from thinking about an idea to actually implementing it.' },
  { date: '2026-04-16', category: 'cognitive', answer: 'True', questionText: 'I am evolving the aspects of my cognition I most want to improve.' },
  { date: '2026-04-16', category: 'intelligence', answer: 'True', questionText: 'I am moved by the fragility and impermanence of life.' },
  { date: '2026-04-16', category: 'intelligence', answer: 'True', questionText: 'I would feel deeply diminished if music disappeared from my life.' },
  { date: '2026-04-17', category: 'values', answer: 'True', questionText: 'I make deliberate time to be in natural spaces.' },
  { date: '2026-04-17', category: 'values', answer: 'True', questionText: 'The natural world has taught me something important about myself.' },
  { date: '2026-04-17', category: 'archetypes', answer: 'True', questionText: 'I can clearly differentiate between intuition and impulse.' },
  { date: '2026-04-17', category: 'archetypes', answer: 'True', questionText: 'Being "on" all day is cognitively and emotionally exhausting.' },
  { date: '2026-04-17', category: 'cognitive', answer: 'True', questionText: 'I have a comfort memory I return to when I need grounding.' },
  { date: '2026-04-17', category: 'cognitive', answer: 'True', questionText: 'Physical movement helps my thinking when I\'m stuck.' },
  { date: '2026-04-17', category: 'intelligence', answer: 'True', questionText: 'I notice when landscapes, forests, or green spaces are healthy or damaged.' },
  { date: '2026-04-17', category: 'intelligence', answer: 'True', questionText: 'I am good at making introductions and connecting people.' },
  { date: '2026-04-18', category: 'values', answer: 'True', questionText: 'I experience emotional security in my closest relationship.' },
  { date: '2026-04-18', category: 'values', answer: 'True', questionText: 'I am neglecting a creative urge that wants my attention.' },
  { date: '2026-04-18', category: 'values', answer: 'True', questionText: 'Someone else\'s compassion recently shifted the course of my day.' },
  { date: '2026-04-18', category: 'archetypes', answer: 'True', questionText: 'I experience real conflict between desire and duty.' },
  { date: '2026-04-18', category: 'archetypes', answer: 'True', questionText: 'I feel the vulnerability of being between who I was and who I\'m becoming.' },
  { date: '2026-04-18', category: 'archetypes', answer: 'True', questionText: 'Homecoming after a long internal journey brings me deep peace.' },
  { date: '2026-04-18', category: 'cognitive', answer: 'True', questionText: 'I listen more than I respond in conversations.' },
  { date: '2026-04-18', category: 'cognitive', answer: 'True', questionText: 'I adapt my plans fluidly when the rules keep changing.' },
  { date: '2026-04-18', category: 'cognitive', answer: 'Somewhat', questionText: 'I trust my first thought and act on it confidently.' },
  { date: '2026-04-18', category: 'intelligence', answer: 'True', questionText: 'I am drawn to stories about transformation and transcendence.' },
  { date: '2026-04-18', category: 'intelligence', answer: 'True', questionText: 'I find it hard to think clearly when my body feels tense.' },
  { date: '2026-04-18', category: 'intelligence', answer: 'True', questionText: 'I remember details about people — their stories, preferences, struggles.' },
  { date: '2026-04-19', category: 'values', answer: 'True', questionText: 'I use humor to connect rather than to deflect.' },
  { date: '2026-04-19', category: 'values', answer: 'True', questionText: 'A recurring desire in me is guiding my life choices.' },
  { date: '2026-04-19', category: 'archetypes', answer: 'True', questionText: 'I honour my past while stepping into my future.' },
  { date: '2026-04-19', category: 'archetypes', answer: 'True', questionText: 'My relationship with silence reveals something important about me.' },
  { date: '2026-04-19', category: 'cognitive', answer: 'True', questionText: 'These reflections have taught me something important about myself.' },
  { date: '2026-04-19', category: 'cognitive', answer: 'True', questionText: 'I default to seeing uncertainty as opportunity rather than threat.' },
  { date: '2026-04-19', category: 'intelligence', answer: 'True', questionText: 'I can tell what material something is by touching it.' },
  { date: '2026-04-19', category: 'intelligence', answer: 'True', questionText: 'I feel a responsibility to protect the natural world.' },
  { date: '2026-04-20', category: 'values', answer: 'True', questionText: 'I navigate moral grey areas thoughtfully rather than reactively.' },
  { date: '2026-04-20', category: 'values', answer: 'True', questionText: 'I have learned something about life that I consider profoundly important.' },
  { date: '2026-04-20', category: 'archetypes', answer: 'True', questionText: 'I am on a meaningful quest or mission in my life right now.' },
  { date: '2026-04-20', category: 'archetypes', answer: 'True', questionText: 'My ideal self and my real self are not far apart.' },
  { date: '2026-04-20', category: 'cognitive', answer: 'True', questionText: 'I give my fullest attention to the activities that engage me.' },
  { date: '2026-04-20', category: 'cognitive', answer: 'True', questionText: 'I apply cognitive flexibility naturally in different situations.' },
  { date: '2026-04-20', category: 'intelligence', answer: 'True', questionText: 'I like categorising and organising information.' },
  { date: '2026-04-20', category: 'intelligence', answer: 'True', questionText: 'I feel calmer near water — rivers, lakes, ocean.' },
  { date: '2026-04-21', category: 'values', answer: 'True', questionText: 'I know when to speak up and when to stay quiet.' },
  { date: '2026-04-21', category: 'values', answer: 'True', questionText: 'I balance structure and spontaneity well in my life.' },
  { date: '2026-04-21', category: 'values', answer: 'True', questionText: 'I am consciously creating the legacy I want to leave.' },
  { date: '2026-04-21', category: 'archetypes', answer: 'True', questionText: 'I process life experiences on a symbolic level, not just a literal one.' },
  { date: '2026-04-21', category: 'archetypes', answer: 'True', questionText: 'Part of my personality is actually a survival strategy from the past.' },
  { date: '2026-04-21', category: 'archetypes', answer: 'True', questionText: 'I perform a character when I\'m trying to impress someone.' },
  { date: '2026-04-21', category: 'cognitive', answer: 'True', questionText: 'I adopt mental models from others that improve my thinking.' },
  { date: '2026-04-21', category: 'cognitive', answer: 'True', questionText: 'Self-reflection plays a central role in my intellectual growth.' },
  { date: '2026-04-21', category: 'cognitive', answer: 'True', questionText: 'I reframe problems effectively when the original framing leads nowhere.' },
  { date: '2026-04-21', category: 'intelligence', answer: 'Somewhat', questionText: 'I rely on spreadsheets, charts, or structured tools to organise decisions.' },
  { date: '2026-04-21', category: 'intelligence', answer: 'True', questionText: 'I notice subtle shifts in someone\'s tone or energy.' },
  { date: '2026-04-21', category: 'intelligence', answer: 'True', questionText: 'I keep journals, notes, or letters regularly.' }
];

export const ACCOUNT_B_DAILY_REFLECTIONS: Record<number, DailyReflectionAnswerSet> = {
  1: {
    day: 1,
    date: '2026-01-22',
    values: [{ statement: 'I recognise the early signs of burnout in myself.', answer: 'Very True' }, { statement: 'My sense of identity has shifted meaningfully in the last year.', answer: 'Very True' }],
    archetypes: [{ statement: 'I convert fear into fuel and motivation.', answer: 'True' }, { statement: 'A journey — internal or external — has significantly changed who I am.', answer: 'True' }],
    cognitive: [{ statement: 'I organise my thoughts clearly before speaking about something complex.', answer: 'True' }, { statement: 'I think primarily in images rather than words.', answer: 'True' }],
    intelligence: [{ statement: 'I feel uncomfortable when there is unresolved tension in a group.', answer: 'True' }, { statement: 'I am a natural mediator in disagreements.', answer: 'Somewhat' }]
  },
  2: {
    day: 2,
    date: '2026-01-23',
    values: [{ statement: 'What I believe about the nature of life shapes how I treat people.', answer: 'True' }, { statement: 'I say no without guilt when I need to.', answer: 'Somewhat' }],
    archetypes: [{ statement: 'An experience far outside my comfort zone shaped who I am profoundly.', answer: 'True' }, { statement: 'Some responsibilities feel noble while others feel like burdens.', answer: 'True' }],
    cognitive: [{ statement: 'I follow a personal decision rule that serves me well.', answer: 'True' }, { statement: 'I adapt my communication style fluidly for different people.', answer: 'True' }],
    intelligence: [{ statement: 'I learn and remember things better when they are set to music.', answer: 'True' }, { statement: 'I can tell when a note or instrument is slightly off-pitch.', answer: 'Somewhat' }]
  },
  3: {
    day: 3,
    date: '2026-01-24',
    values: [{ statement: 'There are family patterns I am consciously choosing to break.', answer: 'Very True' }, { statement: 'I have made meaningful sacrifices for the people I love.', answer: 'Very True' }, { statement: 'Being respected matters more to me than being liked.', answer: 'Very True' }],
    archetypes: [{ statement: 'I navigate the disorientation of becoming someone new.', answer: 'True' }, { statement: 'I handle the loneliness of walking my own path with grace.', answer: 'True' }, { statement: 'At least one of my personas is exhausting to maintain.', answer: 'True' }],
    cognitive: [{ statement: 'I actively seek out new information through my preferred channels.', answer: 'True' }, { statement: 'I take smart, well-calculated risks.', answer: 'True' }, { statement: 'I push through learning plateaus even when progress feels invisible.', answer: 'True' }],
    intelligence: [{ statement: 'Music connects me to something larger than myself.', answer: 'True' }, { statement: 'I can identify many plants, trees, or animals by sight.', answer: 'True' }, { statement: 'I notice physical discomfort in spaces that feel wrong.', answer: 'True' }]
  },
  4: {
    day: 4,
    date: '2026-01-25',
    values: [{ statement: 'My body clearly signals when I feel safe versus when I feel threatened.', answer: 'Very True' }, { statement: 'I willingly sacrifice smaller things for what truly matters.', answer: 'True' }],
    archetypes: [{ statement: 'There are things about the way the world works that I refuse to accept.', answer: 'True' }, { statement: 'My shadow shows up clearly in my relationships.', answer: 'True' }],
    cognitive: [{ statement: 'I handle memories that contradict my current self-image with openness.', answer: 'True' }, { statement: 'Unexpected inputs — walks, conversations, random articles — spark breakthroughs for me.', answer: 'True' }],
    intelligence: [{ statement: 'I tend to absorb new languages naturally and quickly.', answer: 'Somewhat' }, { statement: 'I hum, whistle, or tap rhythms without realising it.', answer: 'True' }]
  },
  5: {
    day: 5,
    date: '2026-01-26',
    values: [{ statement: 'I hold my beliefs with both conviction and humility.', answer: 'True' }, { statement: 'I actively honour the people who have shaped me.', answer: 'True' }],
    archetypes: [{ statement: 'Someone has truly taken care of me recently.', answer: 'True' }, { statement: 'I understand what fulfilment looks like for someone who is always seeking.', answer: 'True' }],
    cognitive: [{ statement: 'Small talk is valuable and enjoyable to me.', answer: 'Not True' }, { statement: 'I take a completely different approach when my first method isn\'t working.', answer: 'True' }],
    intelligence: [{ statement: 'I process emotions partly by finding the exact words for them.', answer: 'Very True' }, { statement: 'I recognise complex time signatures or polyrhythms.', answer: 'True' }]
  },
  6: {
    day: 6,
    date: '2026-01-27',
    values: [{ statement: 'I have made courageous choices this year.', answer: 'True' }, { statement: 'I model the values I want to see in the world.', answer: 'True' }, { statement: 'I am intentional about what deserves my emotional energy.', answer: 'Very True' }],
    archetypes: [{ statement: 'Traits I dislike in others often reflect something unresolved in me.', answer: 'True' }, { statement: 'A spiritual or philosophical question keeps calling me back.', answer: 'True' }, { statement: 'I balance emotional generosity with meeting my own needs.', answer: 'True' }],
    cognitive: [{ statement: 'I balance logic and emotion effectively when making choices.', answer: 'True' }, { statement: 'I seek disconfirming evidence for my beliefs, not just confirming evidence.', answer: 'True' }, { statement: 'Breaking a familiar pattern has significantly shaped my thinking.', answer: 'True' }],
    intelligence: [{ statement: 'I remember faces far better than names.', answer: 'True' }, { statement: 'I process stress through my body — tension, restlessness, movement.', answer: 'True' }, { statement: 'I feel physical sensations when listening to certain music.', answer: 'True' }]
  },
  7: {
    day: 7,
    date: '2026-01-28',
    values: [{ statement: 'I grow through discomfort rather than in spite of it.', answer: 'True' }, { statement: 'The decisions I make are truly my own.', answer: 'True' }],
    archetypes: [{ statement: 'I can distinguish between genuine seeking and emotional avoidance.', answer: 'True' }, { statement: 'I balance my need for disruption with others\' need for stability.', answer: 'True' }],
    cognitive: [{ statement: 'I extract useful learning from risks that didn\'t pay off.', answer: 'True' }, { statement: 'Fatigue changes what I focus on in noticeable ways.', answer: 'True' }],
    intelligence: [{ statement: 'I am drawn to liminal spaces — thresholds, transitions, edges.', answer: 'True' }, { statement: 'I notice rhythms and patterns in everyday sounds.', answer: 'True' }]
  },
  8: {
    day: 8,
    date: '2026-01-29',
    values: [{ statement: 'My relationship with my body has become more compassionate over time.', answer: 'Very True' }, { statement: 'I interpret my own life story generously and kindly.', answer: 'True' }],
    archetypes: [{ statement: 'I don\'t always know what to do when my strength isn\'t enough.', answer: 'True' }, { statement: 'I need time to recalibrate after performing a role for too long.', answer: 'True' }],
    cognitive: [{ statement: 'I connect insights across different areas of my life.', answer: 'True' }, { statement: 'My confidence in a decision grows after I commit to it.', answer: 'True' }],
    intelligence: [{ statement: 'I am very aware of my body in space.', answer: 'True' }, { statement: 'I find joy in proofs, derivations, or formal logic.', answer: 'True' }]
  },
  9: {
    day: 9,
    date: '2026-01-30',
    values: [{ statement: 'Childhood experiences shaped my need for safety.', answer: 'Very True' }, { statement: 'There are things that matter deeply to me that I rarely talk about.', answer: 'Very True' }, { statement: 'I am comfortable showing all of my emotions publicly.', answer: 'Somewhat' }],
    archetypes: [{ statement: 'I wear a different mask at work than I do at home.', answer: 'True' }, { statement: 'I celebrate others without diminishing myself.', answer: 'Somewhat' }, { statement: 'I am looking toward a specific horizon in my life right now.', answer: 'True' }],
    cognitive: [{ statement: 'I make sense of situations that don\'t fit any known pattern.', answer: 'True' }, { statement: 'I know when a problem is solved "enough" and move on.', answer: 'True' }, { statement: 'My emotions enhance rather than cloud the clarity of my thinking.', answer: 'True' }],
    intelligence: [{ statement: 'I have a strong sense of direction and rarely get lost.', answer: 'Not True' }, { statement: 'I can easily rotate objects in my mind.', answer: 'True' }, { statement: 'I am energised by meaningful conversations.', answer: 'True' }]
  },
  10: {
    day: 10,
    date: '2026-01-31',
    values: [{ statement: 'I am holding onto obligations I need to release.', answer: 'True' }, { statement: 'I express the qualities I admire in others rather than suppressing them in myself.', answer: 'True' }],
    archetypes: [{ statement: 'My shadow side intensifies when I\'m under stress.', answer: 'True' }, { statement: 'There is something I consistently lie to myself about.', answer: 'True' }],
    cognitive: [{ statement: 'I assess risk effectively even with incomplete information.', answer: 'True' }, { statement: 'I retain information over the long term reliably.', answer: 'True' }],
    intelligence: [{ statement: 'I prefer verbal instructions over visual diagrams.', answer: 'Not True' }, { statement: 'I believe that the most important truths cannot be put into words.', answer: 'True' }]
  },
  11: {
    day: 11,
    date: '2026-02-01',
    values: [{ statement: 'There is at least one thing I absolutely refuse to compromise on.', answer: 'Very True' }, { statement: 'My responsibilities to family feel aligned with my deeper values.', answer: 'True' }],
    archetypes: [{ statement: 'The archetype I admire most reveals something important about me.', answer: 'True' }, { statement: 'I hold complexity without collapsing into confusion.', answer: 'True' }],
    cognitive: [{ statement: 'I remain open to outcomes I didn\'t plan for.', answer: 'True' }, { statement: 'I make room for unexpected ideas in an otherwise structured day.', answer: 'True' }],
    intelligence: [{ statement: 'I prefer watching a demonstration over reading instructions.', answer: 'True' }, { statement: 'I can read maps effortlessly.', answer: 'Not True' }]
  },
  12: {
    day: 12,
    date: '2026-02-02',
    values: [{ statement: 'I know exactly what quality I value most in a close relationship.', answer: 'True' }, { statement: 'The work I do feels like play to me.', answer: 'Somewhat' }, { statement: 'I feel secure enough to let myself be vulnerable.', answer: 'True' }],
    archetypes: [{ statement: 'Physical changes in my life mirror my internal transformation.', answer: 'True' }, { statement: 'I listen most to the inner voice that actually serves me best.', answer: 'True' }, { statement: 'I am actively searching for something meaningful in my life.', answer: 'True' }],
    cognitive: [{ statement: 'I communicate complex ideas clearly, even when others don\'t immediately understand.', answer: 'True' }, { statement: 'Deep conversations energise my thinking.', answer: 'True' }, { statement: 'I gather sufficient information before committing to a choice.', answer: 'True' }],
    intelligence: [{ statement: 'I question assumptions before accepting them.', answer: 'True' }, { statement: 'I need regular solitude to recharge.', answer: 'Very True' }, { statement: 'I naturally recognize patterns in music, like genre or era.', answer: 'True' }]
  },
  13: {
    day: 13,
    date: '2026-02-03',
    values: [{ statement: 'I choose myself when it\'s the right thing to do.', answer: 'Very True' }, { statement: 'Ageing is teaching me valuable things about what truly matters.', answer: 'True' }],
    archetypes: [{ statement: 'I naturally step in when someone needs help or rescuing.', answer: 'True' }, { statement: 'I needed a hero in my life that I never had.', answer: 'True' }],
    cognitive: [{ statement: 'I make decisions from courage rather than fear.', answer: 'True' }, { statement: 'I use metaphors effectively to understand my own life.', answer: 'True' }],
    intelligence: [{ statement: 'I feel at home in my body most of the time.', answer: 'Not True' }, { statement: 'I narrate experiences vividly when telling stories.', answer: 'True' }]
  },
  14: {
    day: 14,
    date: '2026-02-04',
    values: [{ statement: 'I can sense when my boundaries are being tested.', answer: 'Very True' }, { statement: 'I have discovered truths late in life that I\'m genuinely grateful for.', answer: 'Very True' }],
    archetypes: [{ statement: 'There is a gift hidden inside my greatest flaw.', answer: 'True' }, { statement: 'I have been overthinking something that actually needs feeling instead.', answer: 'True' }],
    cognitive: [{ statement: 'I work on one task at a time rather than multitasking.', answer: 'True' }, { statement: 'I address even the types of decisions I tend to avoid.', answer: 'True' }],
    intelligence: [{ statement: 'I feel spiritually connected to the natural world.', answer: 'True' }, { statement: 'I enjoy debugging or troubleshooting problems.', answer: 'True' }]
  },
  15: {
    day: 15,
    date: '2026-02-05',
    values: [{ statement: 'I lift others without needing recognition for doing so.', answer: 'True' }, { statement: 'I reconcile compassion with accountability in a balanced way.', answer: 'True' }, { statement: 'I stay motivated even when progress feels invisible.', answer: 'True' }],
    archetypes: [{ statement: 'Radical self-honesty is something I could practise more of.', answer: 'True' }, { statement: 'I hold onto myself during major life transitions.', answer: 'True' }, { statement: 'I am sitting with a book, talk, or idea that is actively changing me.', answer: 'True' }],
    cognitive: [{ statement: 'I notice when a current situation rhymes with one from my past.', answer: 'True' }, { statement: 'I handle misunderstandings without becoming defensive.', answer: 'True' }, { statement: 'Looking back over my reflections, I can see a clear pattern in how I think and grow.', answer: 'True' }],
    intelligence: [{ statement: 'I understand unspoken social rules instinctively.', answer: 'True' }, { statement: 'I pick up new physical skills quickly.', answer: 'True' }, { statement: 'I am drawn to introspection in all its forms.', answer: 'True' }]
  },
  16: {
    day: 16,
    date: '2026-02-06',
    values: [{ statement: 'I stay compassionate without losing myself in the process.', answer: 'True' }, { statement: 'Social interaction drains me more than most people realise.', answer: 'Very True' }],
    archetypes: [{ statement: 'I have faced something deeply difficult this year.', answer: 'True' }, { statement: 'I stay curious even when I feel like an expert in something.', answer: 'True' }],
    cognitive: [{ statement: 'I navigate situations where intuition and logic point in different directions.', answer: 'True' }, { statement: 'I keep my mind sharp and engaged through deliberate practice.', answer: 'True' }],
    intelligence: [{ statement: 'I am sensitive to the aesthetic quality of everyday spaces.', answer: 'True' }, { statement: 'I notice the rhythm of speech and find some voices musical.', answer: 'True' }]
  },
  17: {
    day: 17,
    date: '2026-02-07',
    values: [{ statement: 'I value honesty over harmony in my close relationships.', answer: 'True' }, { statement: 'Certain relationship dynamics trigger me more than I\'d like.', answer: 'Very True' }],
    archetypes: [{ statement: 'My need for control reveals my deepest fear.', answer: 'True' }, { statement: 'I have had to accept something very difficult about myself.', answer: 'True' }],
    cognitive: [{ statement: 'I am comfortable working with numbers and quantitative data.', answer: 'Not True' }, { statement: 'I interrupt unhelpful thought patterns before they take over.', answer: 'True' }],
    intelligence: [{ statement: 'I notice when sound design is used intentionally in films or media.', answer: 'True' }, { statement: 'I use visualisation as a planning or problem-solving tool.', answer: 'True' }]
  },
  18: {
    day: 18,
    date: '2026-02-08',
    values: [{ statement: 'I am giving my truest self what it needs right now.', answer: 'True' }, { statement: 'I have a healthy process for navigating grief and loss.', answer: 'True' }, { statement: 'I can hold space for people whose values differ from mine.', answer: 'True' }],
    archetypes: [{ statement: 'I adapt socially without feeling fake.', answer: 'True' }, { statement: 'My identity would shift dramatically if I stopped taking care of everyone.', answer: 'True' }, { statement: 'Going against the grain has often been the right choice for me.', answer: 'True' }],
    cognitive: [{ statement: 'I rely on a mental model to understand human behaviour.', answer: 'True' }, { statement: 'I approach problems from the top down, starting with the big picture.', answer: 'True' }, { statement: 'I take feedback about how I think and communicate seriously.', answer: 'True' }],
    intelligence: [{ statement: 'I approach problems in a systematic, step-by-step way.', answer: 'True' }, { statement: 'Language feels like my most natural creative medium.', answer: 'True' }, { statement: 'I can reverse-engineer how something was made.', answer: 'True' }]
  },
  19: {
    day: 19,
    date: '2026-02-09',
    values: [{ statement: 'I am actively developing a skill or quality that matters to me.', answer: 'True' }, { statement: 'Community is a meaningful part of my life.', answer: 'True' }],
    archetypes: [{ statement: 'I keep repeating a pattern even though I know better.', answer: 'True' }, { statement: 'I would rather be a quiet hero than a visible one.', answer: 'True' }],
    cognitive: [{ statement: 'I reset my thinking effectively when I\'m going in circles.', answer: 'True' }, { statement: 'I prefer consuming information alone rather than discussing it.', answer: 'True' }],
    intelligence: [{ statement: 'I enjoy creating visual art — painting, collage, digital design.', answer: 'True' }, { statement: 'I can picture how furniture will look in a room before moving it.', answer: 'True' }]
  },
  20: {
    day: 20,
    date: '2026-02-10',
    values: [{ statement: 'Unexpected things energise me in surprising ways.', answer: 'True' }, { statement: 'I wear a mask more often than I would like.', answer: 'True' }],
    archetypes: [{ statement: 'I use my influence ethically and intentionally.', answer: 'True' }, { statement: 'I continue caring for others even when I\'m drained.', answer: 'True' }],
    cognitive: [{ statement: 'Certain types of questions make me think more deeply than others.', answer: 'True' }, { statement: 'I evaluate whether an idea is worth deeply pursuing before investing heavily.', answer: 'True' }],
    intelligence: [{ statement: 'I have experienced moments of deep connection to the cosmos.', answer: 'True' }, { statement: 'I use empathy as my primary way of understanding others.', answer: 'True' }]
  },
  21: {
    day: 21,
    date: '2026-02-11',
    values: [{ statement: 'Community and belonging give my life a dimension that solitude cannot.', answer: 'True' }, { statement: 'I value freedom more than stability in this season of my life.', answer: 'True' }, { statement: 'My greatest strengths have emerged from my hardest experiences.', answer: 'True' }],
    archetypes: [{ statement: 'I know how to reclaim my power after someone has taken it.', answer: 'True' }, { statement: 'There is a role in life I play more naturally than any other.', answer: 'True' }, { statement: 'I balance being a voice of reason with being emotionally present.', answer: 'True' }],
    cognitive: [{ statement: 'I apply lessons I wish I had been taught earlier in life.', answer: 'True' }, { statement: 'Learning a difficult skill teaches me as much about myself as about the skill.', answer: 'True' }, { statement: 'I perform best in structured conversation formats.', answer: 'True' }],
    intelligence: [{ statement: 'I contemplate the nature of consciousness and awareness.', answer: 'True' }, { statement: 'I am fascinated by the overlap between science and spirituality.', answer: 'True' }, { statement: 'I pick up on micro-expressions and body language.', answer: 'True' }]
  },
  22: {
    day: 22,
    date: '2026-02-12',
    values: [{ statement: 'I balance giving and receiving well in my relationships.', answer: 'True' }, { statement: 'I regularly do something kind just for myself.', answer: 'True' }],
    archetypes: [{ statement: 'I struggle to recover after giving everything I have.', answer: 'True' }, { statement: 'A role I was once forced into turned out to be one I secretly enjoy.', answer: 'True' }],
    cognitive: [{ statement: 'I calibrate my confidence in my own judgement accurately.', answer: 'True' }, { statement: 'I know when to trust my analysis and when to trust my instincts.', answer: 'True' }],
    intelligence: [{ statement: 'I enjoy sequences, codes, or ciphers.', answer: 'True' }, { statement: 'I am comfortable being alone with my thoughts.', answer: 'True' }]
  },
  23: {
    day: 23,
    date: '2026-02-13',
    values: [{ statement: 'I follow rules by conscious choice, not just habit.', answer: 'True' }, { statement: 'Imagination plays an active role in my daily life.', answer: 'True' }],
    archetypes: [{ statement: 'I have exiled a part of myself that I need to welcome back.', answer: 'True' }, { statement: 'Exploration has revealed truths I could never have found by staying put.', answer: 'True' }],
    cognitive: [{ statement: 'Sleep and rest noticeably improve my ability to solve problems.', answer: 'True' }, { statement: 'I teach myself new things independently and successfully.', answer: 'True' }],
    intelligence: [{ statement: 'I trust the signals my body sends me.', answer: 'True' }, { statement: 'I notice visual details others miss.', answer: 'True' }]
  },
  24: {
    day: 24,
    date: '2026-02-14',
    values: [{ statement: 'I listen to my body before it shouts at me.', answer: 'True' }, { statement: 'I create spaces where others feel they belong.', answer: 'True' }, { statement: 'I can be present with someone\'s pain without needing to fix it.', answer: 'True' }],
    archetypes: [{ statement: 'My deepest intuition has a clear sense of where my life is headed.', answer: 'True' }, { statement: 'I show up differently in each of my life roles, and I\'m aware of how.', answer: 'True' }, { statement: 'I understand the difference between knowledge and true wisdom.', answer: 'True' }],
    cognitive: [{ statement: 'I extract surprising lessons from mundane experiences.', answer: 'True' }, { statement: 'I wish I could recover a forgotten memory that feels important.', answer: 'True' }, { statement: 'I appreciate and learn from elegant solutions to complex problems.', answer: 'True' }],
    intelligence: [{ statement: 'I am drawn to natural textures — wood, stone, water, soil.', answer: 'True' }, { statement: 'I am comfortable with ambiguity about who I am.', answer: 'True' }, { statement: 'I feel a strong connection to animals.', answer: 'True' }]
  },
  25: {
    day: 25,
    date: '2026-02-15',
    values: [{ statement: 'I experience the sacred in ways that are personal and real to me.', answer: 'True' }, { statement: 'My presence has the kind of effect on others that I want it to have.', answer: 'True' }],
    archetypes: [{ statement: 'I share power in my relationships rather than accumulating it.', answer: 'True' }, { statement: 'I integrate my dark side without acting it out destructively.', answer: 'True' }],
    cognitive: [{ statement: 'Mindfulness or meditation is an active part of my life.', answer: 'True' }, { statement: 'Pressure enhances rather than hinders my ability to learn.', answer: 'True' }],
    intelligence: [{ statement: 'I am drawn to questions about identity — what makes me "me."', answer: 'True' }, { statement: 'I am uncomfortable with surface-level answers to deep questions.', answer: 'True' }]
  },
  26: {
    day: 26,
    date: '2026-02-16',
    values: [{ statement: 'There are people in my life who love the real me without performance.', answer: 'True' }, { statement: 'I prioritise restoration over obligation when I need to.', answer: 'True' }],
    archetypes: [{ statement: 'I remain humble even when I know I\'m right.', answer: 'True' }, { statement: 'I can tell when I\'m code-switching versus losing myself.', answer: 'True' }],
    cognitive: [{ statement: 'My most vivid memories are emotional rather than visual or factual.', answer: 'True' }, { statement: 'I balance breadth and depth effectively when exploring a new topic.', answer: 'True' }],
    intelligence: [{ statement: 'I classify and categorise natural phenomena instinctively.', answer: 'True' }, { statement: 'I feel connected to something larger than myself.', answer: 'True' }]
  },
  27: {
    day: 27,
    date: '2026-02-17',
    values: [{ statement: 'My ethical understanding comes more from experience than instruction.', answer: 'True' }, { statement: 'Resilience is a quality I embody, not just admire.', answer: 'True' }, { statement: 'I am clear about where my responsibility ends and someone else\'s begins.', answer: 'True' }],
    archetypes: [{ statement: 'I am strong without being hard or rigid.', answer: 'True' }, { statement: 'I empower others without depleting myself.', answer: 'True' }, { statement: 'I let people in without feeling dangerously exposed.', answer: 'True' }],
    cognitive: [{ statement: 'Complex, challenging problems energise me.', answer: 'True' }, { statement: 'I use constraints to boost my creativity.', answer: 'True' }, { statement: 'I handle situations requiring pure logic with no room for feeling.', answer: 'True' }],
    intelligence: [{ statement: 'Rhythm and tempo affect my energy and pace throughout the day.', answer: 'True' }, { statement: 'I doodle, sketch, or draw when thinking.', answer: 'True' }, { statement: 'I can navigate by mental maps rather than written directions.', answer: 'Somewhat' }]
  },
  28: {
    day: 28,
    date: '2026-02-18',
    values: [{ statement: 'I feel a deep sense of belonging when I am outside.', answer: 'True' }, { statement: 'I nurture myself with the same care I give others.', answer: 'True' }],
    archetypes: [{ statement: 'I reinvent myself while staying true to my core.', answer: 'True' }, { statement: 'I bring the lessons of my seeking back to the people I love.', answer: 'True' }],
    cognitive: [{ statement: 'I learn as much from failure as I do from success.', answer: 'True' }, { statement: 'I notice trends in my mood, energy, or focus across a typical week.', answer: 'True' }],
    intelligence: [{ statement: 'I enjoy teaching, mentoring, or guiding others.', answer: 'True' }, { statement: 'I think about humanity\'s place in the universe.', answer: 'True' }]
  },
  29: {
    day: 29,
    date: '2026-02-19',
    values: [{ statement: 'I am living in a way I would want my grandchildren to know about.', answer: 'True' }, { statement: 'I would create freely if I didn\'t worry about the result being good.', answer: 'True' }],
    archetypes: [{ statement: 'I understand something about wisdom that most people miss.', answer: 'True' }, { statement: 'My daily actions are aligned with my deeper purpose.', answer: 'True' }],
    cognitive: [{ statement: 'Daily reflection continues to reveal surprising things about my mind.', answer: 'True' }, { statement: 'Understanding my own cognitive style has been genuinely useful.', answer: 'True' }],
    intelligence: [{ statement: 'I enjoy strategy games, chess, or competitive thinking.', answer: 'True' }, { statement: 'I enjoy networking and building connections.', answer: 'Not True' }]
  },
  30: {
    day: 30,
    date: '2026-02-20',
    values: [{ statement: 'My relationships have taught me life\'s most valuable lessons.', answer: 'True' }, { statement: 'I carry invisible emotional labour that others don\'t see.', answer: 'True' }, { statement: 'There are things about me I wish people would ask about.', answer: 'True' }],
    archetypes: [{ statement: 'I am in a chrysalis stage of deep personal transformation.', answer: 'True' }, { statement: 'I am deeply attached to at least one defence mechanism.', answer: 'True' }, { statement: 'There is a gap between who I am and who others need me to be.', answer: 'True' }],
    cognitive: [{ statement: 'My relationship with risk has matured and become healthier over time.', answer: 'True' }, { statement: 'Analysis paralysis prevents me from acting when I need to.', answer: 'True' }, { statement: 'I see a clear relationship between what I remember and who I\'m becoming.', answer: 'True' }],
    intelligence: [{ statement: 'I am fascinated by how different cultures understand death and the divine.', answer: 'True' }, { statement: 'I think about free will and whether our choices are truly ours.', answer: 'True' }, { statement: 'I evaluate arguments by their structure, not just their content.', answer: 'True' }]
  },
  31: {
    day: 31,
    date: '2026-02-21',
    values: [{ statement: 'Time in nature restores me in a way nothing else does.', answer: 'True' }, { statement: 'I am spending my time on what I would prioritise if it were limited.', answer: 'True' }],
    archetypes: [{ statement: 'I react strongly when someone sees a part of me I try to hide.', answer: 'True' }, { statement: 'My core wants something that the world doesn\'t make easy.', answer: 'True' }],
    cognitive: [{ statement: 'Writing plays an active role in how I process my thoughts.', answer: 'Very True' }, { statement: 'I break large problems into smaller, manageable pieces naturally.', answer: 'True' }],
    intelligence: [{ statement: 'I use my body to express what words cannot.', answer: 'True' }, { statement: 'I can trace my current mood back to its origin.', answer: 'True' }]
  },
  32: {
    day: 32,
    date: '2026-02-22',
    values: [{ statement: 'I tend to hold onto things — possessions, people, certainty — out of fear.', answer: 'True' }, { statement: 'I feel safe even when the world feels uncertain.', answer: 'True' }],
    archetypes: [{ statement: 'I find deep meaning in mundane, everyday moments.', answer: 'True' }, { statement: 'I balance careful analysis with gut intuition effectively.', answer: 'True' }],
    cognitive: [{ statement: 'I protect my creative flow from the things that kill it.', answer: 'True' }, { statement: 'I handle information overload without becoming overwhelmed.', answer: 'True' }],
    intelligence: [{ statement: 'I instinctively create systems and frameworks to manage my life.', answer: 'True' }, { statement: 'I naturally move or sway to rhythmic sounds.', answer: 'True' }]
  },
  33: {
    day: 33,
    date: '2026-02-23',
    values: [{ statement: 'Nature has provided comfort during some of my hardest moments.', answer: 'True' }, { statement: 'Breaking my own self-imposed rules has taught me something.', answer: 'True' }, { statement: 'I have recently felt misunderstood in a way that revealed a deeper need.', answer: 'True' }],
    archetypes: [{ statement: 'A label I once identified with no longer fits me.', answer: 'True' }, { statement: 'I take care of others more than others take care of me.', answer: 'True' }, { statement: 'Enchantment and wonder are alive in my adult life.', answer: 'True' }],
    cognitive: [{ statement: 'I handle disagreements about shared memories gracefully.', answer: 'True' }, { statement: 'I recognise and correct the cognitive biases that affect my risk assessment.', answer: 'True' }, { statement: 'The same thinking habit loops back when I\'m under stress.', answer: 'True' }],
    intelligence: [{ statement: 'I think of life events as having a soundtrack.', answer: 'True' }, { statement: 'I spot patterns in data or information quickly.', answer: 'True' }, { statement: 'I find it easy to parallel park or navigate tight spaces.', answer: 'Somewhat' }]
  },
  34: {
    day: 34,
    date: '2026-02-24',
    values: [{ statement: 'I choose long-term fulfilment over short-term gratification.', answer: 'True' }, { statement: 'I balance personal freedom with responsibility to people I love.', answer: 'True' }],
    archetypes: [{ statement: 'Unknown territory excites me more than it scares me right now.', answer: 'True' }, { statement: 'I act differently when no one is watching.', answer: 'True' }],
    cognitive: [{ statement: 'I manage involuntary rumination effectively.', answer: 'True' }, { statement: 'I maintain balanced thinking — neither too emotional nor too analytical.', answer: 'True' }],
    intelligence: [{ statement: 'I notice the emotional key of a piece of music immediately.', answer: 'True' }, { statement: 'I naturally take the lead in social situations.', answer: 'True' }]
  },
  35: {
    day: 35,
    date: '2026-02-25',
    values: [{ statement: 'I know the line between disarming humor and avoidant humor.', answer: 'True' }, { statement: 'My daydreams reveal something true about my desires.', answer: 'True' }],
    archetypes: [{ statement: 'I play a specific, recognisable role in my friends\' lives.', answer: 'True' }, { statement: 'My public identity has diverged from who I really am.', answer: 'True' }],
    cognitive: [{ statement: 'I apply lessons from my past daily without even thinking about it.', answer: 'True' }, { statement: 'My energy level and my thinking quality are closely connected.', answer: 'True' }],
    intelligence: [{ statement: 'I can tell when group dynamics shift.', answer: 'Somewhat' }, { statement: 'I feel that nature teaches me things no book can.', answer: 'True' }]
  },
  36: {
    day: 36,
    date: '2026-02-26',
    values: [{ statement: 'Loyalty is important to me, but I recognise its limits.', answer: 'True' }, { statement: 'I balance planning with surrendering to what I cannot control.', answer: 'True' }, { statement: 'My online presence reflects who I actually am.', answer: 'True' }],
    archetypes: [{ statement: 'My rational mind and my emotional mind have very different priorities.', answer: 'True' }, { statement: 'My sense of self shifts depending on who I\'m with.', answer: 'True' }, { statement: 'My caring nature has at times felt like a prison.', answer: 'True' }],
    cognitive: [{ statement: 'I detect subtext and unspoken meaning in conversations.', answer: 'True' }, { statement: 'I make good decisions with high stakes and limited information.', answer: 'True' }, { statement: 'I process and learn from my mistakes effectively after they happen.', answer: 'True' }],
    intelligence: [{ statement: 'I notice when correlation is mistaken for causation.', answer: 'True' }, { statement: 'I feel drained by superficial interactions.', answer: 'True' }, { statement: 'I enjoy cooking with fresh, seasonal, or wild ingredients.', answer: 'True' }]
  },
  37: {
    day: 37,
    date: '2026-02-27',
    values: [{ statement: 'I can distinguish between challenges worth pushing through and ones to release.', answer: 'True' }, { statement: 'Playfulness is an active part of my adult life.', answer: 'True' }],
    archetypes: [{ statement: 'A deep fear underlies my need for control.', answer: 'True' }, { statement: 'A recurring dream or image keeps appearing in my life.', answer: 'True' }],
    cognitive: [{ statement: 'I become aware of new patterns in my life on a regular basis.', answer: 'True' }, { statement: 'Deadlines improve the quality of my thinking.', answer: 'True' }],
    intelligence: [{ statement: 'I feel inspired or calmed by specific landscapes or environments.', answer: 'True' }, { statement: 'I enjoy personality tests and frameworks for self-understanding.', answer: 'True' }]
  },
  38: {
    day: 38,
    date: '2026-02-28',
    values: [{ statement: 'Fairness is reflected in how I treat the people closest to me.', answer: 'True' }, { statement: 'I find elegance in the straightforward solution.', answer: 'True' }],
    archetypes: [{ statement: 'A part of me needs to be seen but is too afraid to be visible.', answer: 'True' }, { statement: 'A part of me craves stability while another part craves chaos.', answer: 'True' }],
    cognitive: [{ statement: 'I know exactly what question I\'d most love someone to ask me right now.', answer: 'True' }, { statement: 'My mood influences which memories surface.', answer: 'True' }],
    intelligence: [{ statement: 'I thrive on teamwork and collaboration.', answer: 'Not True' }, { statement: 'I spend time curating playlists for different moods.', answer: 'True' }]
  },
  39: {
    day: 39,
    date: '2026-03-01',
    values: [{ statement: 'My days generally reflect what I consider a well-lived life.', answer: 'True' }, { statement: 'I exercise autonomy in my daily decisions.', answer: 'True' }, { statement: 'I protect white space in my life — time with no agenda.', answer: 'True' }],
    archetypes: [{ statement: 'I stay in contact with the mythic dimension of my life.', answer: 'True' }, { statement: 'I hold the tension between rational understanding and deeper knowing.', answer: 'True' }, { statement: 'I show courage even when fear is overwhelming.', answer: 'True' }],
    cognitive: [{ statement: 'I evaluate worst-case scenarios without catastrophising.', answer: 'True' }, { statement: 'I make important decisions with clarity and confidence.', answer: 'True' }, { statement: 'Technology has fundamentally changed how I think and communicate.', answer: 'True' }],
    intelligence: [{ statement: 'A song can change my entire emotional state in seconds.', answer: 'True' }, { statement: 'I like building mental models of how things work.', answer: 'True' }, { statement: 'I can read the sky and sense the time or season without a clock.', answer: 'True' }]
  },
  40: {
    day: 40,
    date: '2026-03-02',
    values: [{ statement: 'Faith — in whatever form it takes for me — plays a real role in my daily life.', answer: 'True' }, { statement: 'A moment of unexpected abundance recently reminded me of what truly matters.', answer: 'True' }],
    archetypes: [{ statement: 'My life would look very different if I cared for myself first.', answer: 'True' }, { statement: 'My contrarian nature both helps and isolates me.', answer: 'True' }],
    cognitive: [{ statement: 'Quick decisions work out well for me.', answer: 'True' }, { statement: 'I think about probability naturally in everyday decisions.', answer: 'True' }],
    intelligence: [{ statement: 'I can sense hidden motives in conversations.', answer: 'True' }, { statement: 'I feel that exploring these questions is a core part of who I am.', answer: 'True' }]
  },
  41: {
    day: 41,
    date: '2026-03-03',
    values: [{ statement: 'I would live differently if no one was judging me.', answer: 'True' }, { statement: 'I balance generosity with self-preservation.', answer: 'True' }],
    archetypes: [{ statement: 'I turn self-awareness into actual change, not just insight.', answer: 'True' }, { statement: 'I stay authentic during periods of rapid personal growth.', answer: 'True' }],
    cognitive: [{ statement: 'I use my understanding of patterns to plan and prepare effectively.', answer: 'True' }, { statement: 'I rely on feeling rather than analysis when encountering a stranger.', answer: 'True' }],
    intelligence: [{ statement: 'I feel a strong pull to understand human behaviour.', answer: 'True' }, { statement: 'I set boundaries based on deep self-knowledge.', answer: 'True' }]
  },
  42: {
    day: 42,
    date: '2026-03-04',
    values: [{ statement: 'I keep doing things I wish I had the courage to quit.', answer: 'True' }, { statement: 'My inner world feels vivid and rich today.', answer: 'True' }, { statement: 'Spiritual growth is meaningful to me regardless of religion.', answer: 'True' }],
    archetypes: [{ statement: 'A role is calling me that feels both exciting and terrifying.', answer: 'True' }, { statement: 'I honour the mystery within myself.', answer: 'True' }, { statement: 'I resist the temptation to use power to avoid painful feelings.', answer: 'True' }],
    cognitive: [{ statement: 'I learn by doing rather than by reading instructions.', answer: 'True' }, { statement: 'I use reflection actively to improve my thinking process.', answer: 'True' }, { statement: 'I am actively shifting a recurring theme in my life.', answer: 'True' }],
    intelligence: [{ statement: 'I prefer standing or walking to sitting.', answer: 'True' }, { statement: 'I learn by doing — hands-on experience beats reading.', answer: 'True' }, { statement: 'I focus better with the right kind of background music.', answer: 'True' }]
  },
  43: {
    day: 43,
    date: '2026-03-05',
    values: [{ statement: 'I create space for spontaneity even within a structured life.', answer: 'True' }, { statement: 'I am fully honest with myself about how I feel right now.', answer: 'True' }],
    archetypes: [{ statement: 'Opposing traits within me create my unique character.', answer: 'True' }, { statement: 'Settling has felt right to me rather than suffocating.', answer: 'True' }],
    cognitive: [{ statement: 'Daily reflection has revealed valuable things about myself.', answer: 'True' }, { statement: 'I convey nuance effectively even when words feel insufficient.', answer: 'True' }],
    intelligence: [{ statement: 'I form meaningful connections quickly.', answer: 'True' }, { statement: 'I notice my own cognitive biases in action.', answer: 'True' }]
  },
  44: {
    day: 44,
    date: '2026-03-06',
    values: [{ statement: 'I need to give myself permission to stop doing something.', answer: 'True' }, { statement: 'I treat myself with compassion when I fall short.', answer: 'True' }],
    archetypes: [{ statement: 'I find the sacred in everyday moments.', answer: 'True' }, { statement: 'I channel my energy into something meaningful each day.', answer: 'True' }],
    cognitive: [{ statement: 'A specific memory has shaped how I think today.', answer: 'True' }, { statement: 'I share new ideas despite the vulnerability it requires.', answer: 'True' }],
    intelligence: [{ statement: 'I am naturally athletic or physically coordinated.', answer: 'Not True' }, { statement: 'Music significantly affects my mood.', answer: 'True' }]
  },
  45: {
    day: 45,
    date: '2026-03-07',
    values: [{ statement: 'Freedom means something specific and important to me right now.', answer: 'True' }, { statement: 'I would defend my core principles even if I stood alone.', answer: 'True' }, { statement: 'I can tell when a relationship is nourishing versus draining.', answer: 'True' }],
    archetypes: [{ statement: 'My masks sometimes protect me and sometimes trap me.', answer: 'True' }, { statement: 'I find meaning in the search itself, not just the destination.', answer: 'True' }, { statement: 'A paradox within me has become a source of creative energy.', answer: 'True' }],
    cognitive: [{ statement: 'I sleep on important decisions before finalising them.', answer: 'True' }, { statement: 'I make confident bets on myself and my abilities.', answer: 'True' }, { statement: 'I recover my focus quickly after an interruption.', answer: 'True' }],
    intelligence: [{ statement: 'I think better when I am moving.', answer: 'True' }, { statement: 'I prefer learning through physical demonstration.', answer: 'True' }, { statement: 'I have a strong inner compass that guides my decisions.', answer: 'True' }]
  },
  46: {
    day: 46,
    date: '2026-03-08',
    values: [{ statement: 'Caring for the natural world feels like a personal responsibility to me.', answer: 'Very True' }, { statement: 'I fully honour my own boundaries.', answer: 'Somewhat' }],
    archetypes: [{ statement: 'I am rewriting an old story I used to believe about myself.', answer: 'True' }, { statement: 'I can sense the line between empathy and enmeshment.', answer: 'True' }],
    cognitive: [{ statement: 'I manage the anxiety of irreversible decisions calmly.', answer: 'Somewhat' }, { statement: 'I am attuned to my body\'s signals of danger or opportunity.', answer: 'True' }],
    intelligence: [{ statement: 'I approach creative work with analytical precision.', answer: 'True' }, { statement: 'I notice when I am projecting my feelings onto others.', answer: 'True' }]
  },
  47: {
    day: 47,
    date: '2026-03-09',
    values: [{ statement: 'A boundary I set has improved an important relationship.', answer: 'True' }, { statement: 'I actively celebrate the people I love.', answer: 'True' }],
    archetypes: [{ statement: 'I handle being wrong about something I was certain of with openness.', answer: 'True' }, { statement: 'What I\'m chasing is sometimes a way of running from something else.', answer: 'True' }],
    cognitive: [{ statement: 'I distinguish between a genuinely good idea and an exciting but impractical one.', answer: 'True' }, { statement: 'I manage my greatest cognitive distraction effectively.', answer: 'True' }],
    intelligence: [{ statement: 'I notice how light changes throughout the day.', answer: 'True' }, { statement: 'I regularly check in with my own emotional state.', answer: 'True' }]
  },
  48: {
    day: 48,
    date: '2026-03-10',
    values: [{ statement: 'Specific injustices move me to action more than others.', answer: 'True' }, { statement: 'I have a form of expression that feels completely natural to me.', answer: 'True' }, { statement: 'I can hold space for someone whose actions I disagree with.', answer: 'True' }],
    archetypes: [{ statement: 'There is something in me that needs to die in order for me to grow.', answer: 'True' }, { statement: 'My relationships help me find and refine my sense of purpose.', answer: 'True' }, { statement: 'I naturally question authority and established systems.', answer: 'True' }],
    cognitive: [{ statement: 'I notice subtle signals that others miss.', answer: 'True' }, { statement: 'I remain creative even under pressure.', answer: 'True' }, { statement: 'I handle conflicting advice from people I trust with clarity.', answer: 'True' }],
    intelligence: [{ statement: 'Scientific reasoning excites me more than artistic expression.', answer: 'True' }, { statement: 'I notice ecological patterns — migration, bloom cycles, tides.', answer: 'True' }, { statement: 'I feel that compassion is the highest expression of intelligence.', answer: 'True' }]
  },
  49: {
    day: 49,
    date: '2026-03-11',
    values: [{ statement: 'Total freedom, without any structure, would actually scare me.', answer: 'True' }, { statement: 'People who know me well still have much to discover about me.', answer: 'True' }],
    archetypes: [{ statement: 'Part of my identity feels actively under construction right now.', answer: 'True' }, { statement: 'I would pursue a specific role in the world if nothing held me back.', answer: 'True' }],
    cognitive: [{ statement: 'I distinguish productive concern from anxious rumination.', answer: 'True' }, { statement: 'Understanding how I think has improved my relationships.', answer: 'True' }],
    intelligence: [{ statement: 'I use self-knowledge to navigate relationships more effectively.', answer: 'True' }, { statement: 'I remember things better when I write them down.', answer: 'True' }]
  },
  50: {
    day: 50,
    date: '2026-03-12',
    values: [{ statement: 'There is a person, place, or thing that represents home to me.', answer: 'True' }, { statement: 'There is an area of my life that feels destabilisingly uncertain.', answer: 'True' }],
    archetypes: [{ statement: 'I can envision what the integration of my conflicting parts would look like.', answer: 'True' }, { statement: 'I can sit comfortably with the discomfort of not knowing.', answer: 'True' }],
    cognitive: [{ statement: 'I create ideal conditions for my best thinking.', answer: 'True' }, { statement: 'I read people accurately through intuitive perception.', answer: 'True' }],
    intelligence: [{ statement: 'I negotiate well because I understand what each side needs.', answer: 'True' }, { statement: 'I am drawn to systems that help me understand myself — astrology, psychology, typology.', answer: 'True' }]
  },
  51: {
    day: 51,
    date: '2026-03-13',
    values: [{ statement: 'Family — however I define it — is central to who I am.', answer: 'True' }, { statement: 'A creative dream I set aside still whispers to me.', answer: 'True' }, { statement: 'Being truly seen by someone feels natural and welcome to me.', answer: 'Somewhat' }],
    archetypes: [{ statement: 'Some of my personas serve a genuine purpose while others are just armour.', answer: 'True' }, { statement: 'I balance confidence with genuine humility.', answer: 'True' }, { statement: 'I lead without needing to control.', answer: 'True' }],
    cognitive: [{ statement: 'I return to the same subject again and again because it captivates me.', answer: 'True' }, { statement: 'I protect my attention as the finite resource it is.', answer: 'True' }, { statement: 'I mentally replay certain life experiences more than others.', answer: 'True' }],
    intelligence: [{ statement: 'I feel physical pain at environmental destruction.', answer: 'True' }, { statement: 'I feel physical discomfort in overly artificial environments.', answer: 'True' }, { statement: 'I enjoy physical rituals — stretching, yoga, breathwork.', answer: 'True' }]
  },
  52: {
    day: 52,
    date: '2026-03-14',
    values: [{ statement: 'I am living in a way I want to be remembered for.', answer: 'True' }, { statement: 'The person I am and the person I want to be are growing closer together.', answer: 'True' }],
    archetypes: [{ statement: 'I ask for help instead of pushing through alone.', answer: 'True' }, { statement: 'I am trying to satisfy opposing desires at the same time.', answer: 'True' }],
    cognitive: [{ statement: 'I apply my thinking strengths across new and unfamiliar domains.', answer: 'True' }, { statement: 'I handle being wrong about a pattern I thought I saw with humility.', answer: 'True' }],
    intelligence: [{ statement: 'People come to me for advice or emotional support.', answer: 'True' }, { statement: 'I prefer deep one-on-one conversations over large groups.', answer: 'True' }]
  },
  53: {
    day: 53,
    date: '2026-03-15',
    values: [{ statement: 'I have given care that I am genuinely proud of.', answer: 'True' }, { statement: 'I feel both free and responsible at the same time.', answer: 'True' }],
    archetypes: [{ statement: 'My emotional life is actively evolving.', answer: 'True' }, { statement: 'I have surprised myself by how much I\'ve changed.', answer: 'True' }],
    cognitive: [{ statement: 'I explain complex ideas clearly to people unfamiliar with the subject.', answer: 'True' }, { statement: 'I operate from my focused self far more than my scattered self.', answer: 'True' }],
    intelligence: [{ statement: 'I am drawn to philosophy, theology, or existential literature.', answer: 'True' }, { statement: 'I feel more mentally clear after exercise.', answer: 'True' }]
  },
  54: {
    day: 54,
    date: '2026-03-16',
    values: [{ statement: 'My relationship with risk has matured over time.', answer: 'True' }, { statement: 'I belong to myself even when I don\'t fit a group.', answer: 'True' }, { statement: 'Past setbacks have redirected me toward something better.', answer: 'True' }],
    archetypes: [{ statement: 'I bring a specific energy to a room, and it\'s intentional.', answer: 'True' }, { statement: 'I carry shame that protects something vulnerable in me.', answer: 'True' }, { statement: 'Sitting with my darkest feelings reveals something I need to see.', answer: 'True' }],
    cognitive: [{ statement: 'I pay attention to things I usually overlook.', answer: 'True' }, { statement: 'I remember how people made me feel more than what they said.', answer: 'True' }, { statement: 'My mood positively influences how I approach obstacles.', answer: 'True' }],
    intelligence: [{ statement: 'Physical touch is an important part of how I connect with people.', answer: 'True' }, { statement: 'I express emotions through body language and gesture.', answer: 'True' }, { statement: 'I use music therapeutically — to regulate, energise, or ground myself.', answer: 'True' }]
  },
  55: {
    day: 55,
    date: '2026-03-17',
    values: [{ statement: 'Asking for help is something I do when I need it.', answer: 'True' }, { statement: 'I can make confident choices between two things that both matter.', answer: 'True' }],
    archetypes: [{ statement: 'I reveal my true self slowly and deliberately to new people.', answer: 'True' }, { statement: 'I handle the discomfort of asking for help.', answer: 'True' }],
    cognitive: [{ statement: 'Specific communication styles trigger frustration in me.', answer: 'True' }, { statement: 'My trust in my own intuition has grown over the years.', answer: 'True' }],
    intelligence: [{ statement: 'I feel that silence and stillness reveal truths that activity cannot.', answer: 'True' }, { statement: 'I am deeply self-motivated — external encouragement is nice but not necessary.', answer: 'True' }]
  },
  56: {
    day: 56,
    date: '2026-03-18',
    values: [{ statement: 'I treat my physical health as a foundation, not an afterthought.', answer: 'True' }, { statement: 'A lesson keeps returning to me because I haven\'t fully learned it yet.', answer: 'True' }],
    archetypes: [{ statement: 'I turn my insights into action rather than staying in my head.', answer: 'True' }, { statement: 'I balance my desire for newness with appreciation for what I already have.', answer: 'True' }],
    cognitive: [{ statement: 'I engage most deeply in learning experiences that are hands-on and immersive.', answer: 'True' }, { statement: 'I invite serendipity into my thinking process.', answer: 'True' }],
    intelligence: [{ statement: 'I find comfort in the rhythm and sound of words.', answer: 'True' }, { statement: 'I can reproduce a rhythm after hearing it once.', answer: 'True' }]
  },
  57: {
    day: 57,
    date: '2026-03-19',
    values: [{ statement: 'I navigate the tension between security and adventure with clarity.', answer: 'True' }, { statement: 'A key relationship has shaped who I am today.', answer: 'True' }, { statement: 'I have expressed who I truly am in brave ways.', answer: 'True' }],
    archetypes: [{ statement: 'My rebellious streak is constructive rather than destructive.', answer: 'True' }, { statement: 'I step up when no one else will.', answer: 'True' }, { statement: 'A single conversation has profoundly transformed how I see myself.', answer: 'True' }],
    cognitive: [{ statement: 'I know when I have truly learned from an experience.', answer: 'True' }, { statement: 'My memories of important events have changed and evolved over time.', answer: 'True' }, { statement: 'I evaluate the credibility of new information sources carefully.', answer: 'True' }],
    intelligence: [{ statement: 'I prefer natural or earth-toned aesthetics in my surroundings.', answer: 'True' }, { statement: 'I notice when my life feels meaningful and when it does not.', answer: 'True' }, { statement: 'Reading is one of my favourite ways to spend time.', answer: 'True' }]
  },
  58: {
    day: 58,
    date: '2026-03-20',
    values: [{ statement: 'I feel creatively alive on a regular basis.', answer: 'True' }, { statement: 'I offer compassion without absorbing others\' suffering.', answer: 'True' }],
    archetypes: [{ statement: 'I express power without dominating others.', answer: 'True' }, { statement: 'There is a system in my life that needs disrupting.', answer: 'True' }],
    cognitive: [{ statement: 'I prefer having a clear recommendation over many open options.', answer: 'True' }, { statement: 'I have effective techniques for staying focused during long discussions.', answer: 'True' }],
    intelligence: [{ statement: 'Writing helps me discover what I actually think.', answer: 'True' }, { statement: 'I feel deeply connected to the people in my life.', answer: 'True' }]
  },
  59: {
    day: 59,
    date: '2026-03-21',
    values: [{ statement: 'My life has a clear direction right now.', answer: 'True' }, { statement: 'I know the difference between excellence and perfectionism.', answer: 'True' }],
    archetypes: [{ statement: 'I define myself by more than my job title or social labels.', answer: 'True' }, { statement: 'I stay connected to community while maintaining my radical independence.', answer: 'True' }],
    cognitive: [{ statement: 'I fact-check my own assumptions before accepting them.', answer: 'True' }, { statement: 'Time pressure improves rather than impairs my decision quality.', answer: 'True' }],
    intelligence: [{ statement: 'Physical mastery gives me a deep sense of accomplishment.', answer: 'True' }, { statement: 'I think about the meaning of life more than most people.', answer: 'True' }]
  },
  60: {
    day: 60,
    date: '2026-03-22',
    values: [{ statement: 'My relationship with the seasons reflects something true about my inner life.', answer: 'True' }, { statement: 'I stay true to my ethics even when they conflict with social norms.', answer: 'True' }, { statement: 'I reach for healthy things first when I feel overwhelmed.', answer: 'True' }],
    archetypes: [{ statement: 'My analytical mind both serves and limits me.', answer: 'True' }, { statement: 'I nurture the parts of myself that cannot be measured.', answer: 'True' }, { statement: 'My rebellious energy has matured over time.', answer: 'True' }],
    cognitive: [{ statement: 'I build arguments using logic rather than emotion or narrative.', answer: 'True' }, { statement: 'I redirect my attention when my mind wanders during something important.', answer: 'True' }, { statement: 'I nurture ideas from initial spark all the way to fully formed concepts.', answer: 'True' }],
    intelligence: [{ statement: 'I can quickly estimate whether a claim is plausible based on numbers.', answer: 'Somewhat' }, { statement: 'I enjoy physical improvisation — free movement, contact improv, play.', answer: 'True' }, { statement: 'I feel emotionally mature compared to others my age.', answer: 'True' }]
  },
  61: {
    day: 61,
    date: '2026-03-23',
    values: [{ statement: 'I feel deeply aligned with my sense of purpose.', answer: 'True' }, { statement: 'I feel proud of the person I am becoming.', answer: 'True' }],
    archetypes: [{ statement: 'I play an unofficial role in my family that was never assigned to me.', answer: 'True' }, { statement: 'I am befriending parts of myself I was taught to suppress.', answer: 'True' }],
    cognitive: [{ statement: 'I direct attention to my inner life even during a busy day.', answer: 'True' }, { statement: 'I store and retrieve memories of important conversations accurately.', answer: 'True' }],
    intelligence: [{ statement: 'I experience music as colours, textures, or images.', answer: 'True' }, { statement: 'I compose or improvise music in my head.', answer: 'True' }]
  },
  62: {
    day: 62,
    date: '2026-03-24',
    values: [{ statement: 'I manage compassion fatigue by actively replenishing myself.', answer: 'True' }, { statement: 'I create rituals and traditions that bring the people I love together.', answer: 'True' }],
    archetypes: [{ statement: 'I sometimes need to rebel against my own rebel.', answer: 'True' }, { statement: 'My need for freedom affects my ability to commit.', answer: 'True' }],
    cognitive: [{ statement: 'My unconventional thinking approach serves me well even when it isn\'t rewarded.', answer: 'True' }, { statement: 'I retain the key points from long conversations accurately.', answer: 'True' }],
    intelligence: [{ statement: 'I have a detailed mental model of how my own mind works.', answer: 'True' }, { statement: 'I can look at a flat pattern and imagine the 3D object it creates.', answer: 'True' }]
  },
  63: {
    day: 63,
    date: '2026-03-25',
    values: [{ statement: 'I celebrate belonging when I have it rather than taking it for granted.', answer: 'True' }, { statement: 'I would benefit from a conversation with a wise mentor.', answer: 'True' }, { statement: 'I can distinguish between healthy solitude and unhealthy isolation.', answer: 'True' }],
    archetypes: [{ statement: 'A transformation that scared me turned out beautifully.', answer: 'True' }, { statement: 'I can discern truth from comfortable illusion.', answer: 'True' }, { statement: 'An emerging part of myself genuinely excites me.', answer: 'True' }],
    cognitive: [{ statement: 'My thinking style has shaped my career or life path significantly.', answer: 'True' }, { statement: 'I actively cultivate and develop my intuitive sense.', answer: 'True' }, { statement: 'I balance pattern recognition with remaining open to exceptions.', answer: 'True' }],
    intelligence: [{ statement: 'I notice logical errors in arguments other people make.', answer: 'True' }, { statement: 'I believe inner growth is the most important work a person can do.', answer: 'True' }, { statement: 'I use past experiences to make better future decisions.', answer: 'True' }]
  },
  64: {
    day: 64,
    date: '2026-03-26',
    values: [{ statement: 'I can clearly distinguish between my wants and my needs.', answer: 'True' }, { statement: 'I handle disagreements with people I care about in a healthy way.', answer: 'True' }],
    archetypes: [{ statement: 'An inner contradiction is a defining part of who I am.', answer: 'True' }, { statement: 'My inner fire is alive and burning.', answer: 'True' }],
    cognitive: [{ statement: 'I handle choices with no clear right answer without becoming paralysed.', answer: 'True' }, { statement: 'I summarise complex information for myself effectively.', answer: 'True' }],
    intelligence: [{ statement: 'I enjoy the physicality of nature — climbing, swimming, hiking.', answer: 'True' }, { statement: 'I am fascinated by the history and origin of words.', answer: 'True' }]
  },
  65: {
    day: 65,
    date: '2026-03-27',
    values: [{ statement: 'I handle repeated boundary violations with firmness and clarity.', answer: 'True' }, { statement: 'I am able to forgive even when the other person isn\'t sorry.', answer: 'True' }],
    archetypes: [{ statement: 'I navigate the soul\'s seasons — growth, decay, dormancy, rebirth — with awareness.', answer: 'True' }, { statement: 'I have a complex relationship with authority figures.', answer: 'True' }],
    cognitive: [{ statement: 'I do my deepest work during a specific, consistent time of day.', answer: 'True' }, { statement: 'Nostalgia plays a meaningful role in my thinking.', answer: 'True' }],
    intelligence: [{ statement: 'I can recognise the difference between what I feel and what I think.', answer: 'True' }, { statement: 'I look for cause-and-effect relationships in what happens around me.', answer: 'True' }]
  },
  66: {
    day: 66,
    date: '2026-03-28',
    values: [{ statement: 'I have made peace with things I wish I could tell my younger self.', answer: 'True' }, { statement: 'Someone specific taught me the most about caring for others.', answer: 'True' }, { statement: 'I feel most like myself when I follow my own instincts.', answer: 'True' }],
    archetypes: [{ statement: 'Some of my caring is performed rather than genuinely felt.', answer: 'True' }, { statement: 'Part of my potential remains unlived.', answer: 'True' }, { statement: 'My past self still influences my present choices.', answer: 'True' }],
    cognitive: [{ statement: 'I trust counterintuitive decisions that go against conventional wisdom.', answer: 'True' }, { statement: 'Unexpected things capture my attention involuntarily.', answer: 'True' }, { statement: 'I use an analytical framework — even an informal one — in daily life.', answer: 'True' }],
    intelligence: [{ statement: 'Poetry or lyrical writing moves me deeply.', answer: 'True' }, { statement: 'I use specific music to access certain memories or emotional states.', answer: 'True' }, { statement: 'I notice inefficiencies in processes and systems.', answer: 'True' }]
  },
  67: {
    day: 67,
    date: '2026-03-29',
    values: [{ statement: 'A wounded part of me needs tenderness that I haven\'t fully given it.', answer: 'True' }, { statement: 'I choose purpose over comfort when it matters.', answer: 'True' }],
    archetypes: [{ statement: 'My seeking nature comes at a real cost to my relationships.', answer: 'True' }, { statement: 'I would tear down something old to build something better.', answer: 'True' }],
    cognitive: [{ statement: 'I use self-observation to make better choices.', answer: 'True' }, { statement: 'I approach personal problems differently than work problems.', answer: 'True' }],
    intelligence: [{ statement: 'I notice when someone needs support even before they ask.', answer: 'True' }, { statement: 'I am drawn to photography, film, or visual storytelling.', answer: 'True' }]
  },
  68: {
    day: 68,
    date: '2026-03-30',
    values: [{ statement: 'I feel fully authentic in the most important areas of my life.', answer: 'True' }, { statement: 'I hold opinions that most people around me would disagree with.', answer: 'True' }],
    archetypes: [{ statement: 'I am letting go of the need for internal consistency.', answer: 'True' }, { statement: 'There is something I would defend even if I were the only one standing.', answer: 'True' }],
    cognitive: [{ statement: 'I generate new ideas even when I feel stuck.', answer: 'True' }, { statement: 'I approach new problems with a clear go-to method.', answer: 'True' }],
    intelligence: [{ statement: 'I understand my own defence mechanisms.', answer: 'True' }, { statement: 'I feel responsible for the emotional well-being of those around me.', answer: 'True' }]
  },
  69: {
    day: 69,
    date: '2026-03-31',
    values: [{ statement: 'Trust builds slowly in me, but it builds solidly.', answer: 'True' }, { statement: 'I am clear about which commitments truly deserve my energy.', answer: 'True' }, { statement: 'I have experienced what unconditional acceptance feels like.', answer: 'True' }],
    archetypes: [{ statement: 'I listen to the quiet voice beneath all the noise.', answer: 'True' }, { statement: 'Jealousy has shown me something important about my true desires.', answer: 'True' }, { statement: 'I disown parts of myself in public settings.', answer: 'True' }],
    cognitive: [{ statement: 'I perform at my cognitive best when I feel psychologically safe.', answer: 'True' }, { statement: 'I filter what to pay attention to and what to ignore efficiently.', answer: 'True' }, { statement: 'I reframe uncertainty as possibility and openness.', answer: 'True' }],
    intelligence: [{ statement: 'I think about whether time is real or constructed.', answer: 'True' }, { statement: 'I am fascinated by animal behaviour and consciousness.', answer: 'True' }, { statement: 'I am curious about the relationship between mind and brain.', answer: 'True' }]
  },
  70: {
    day: 70,
    date: '2026-04-01',
    values: [{ statement: 'I handle creative blocks with patience and curiosity.', answer: 'True' }, { statement: 'Other people\'s experiences move me deeply.', answer: 'True' }],
    archetypes: [{ statement: 'I recognise when resistance is blocking my transformation.', answer: 'True' }, { statement: 'I have one persona that is closer to my core than any other.', answer: 'True' }],
    cognitive: [{ statement: 'I use analogies effectively to make sense of new situations.', answer: 'True' }, { statement: 'I prepare for unpredictable outcomes without spiralling into anxiety.', answer: 'True' }],
    intelligence: [{ statement: 'I find it easy to summarize what I have read or heard.', answer: 'True' }, { statement: 'I am deeply affected by changes in weather or seasons.', answer: 'True' }]
  },
  71: {
    day: 71,
    date: '2026-04-02',
    values: [{ statement: 'I stand up for my beliefs even when it comes at a cost.', answer: 'Somewhat' }, { statement: 'I practise small acts of justice and fairness daily.', answer: 'True' }],
    archetypes: [{ statement: 'I have finally understood a life pattern after years of living it.', answer: 'True' }, { statement: 'I have been the villain in someone else\'s story without realising it.', answer: 'True' }],
    cognitive: [{ statement: 'I use unconventional approaches to problem-solving effectively.', answer: 'True' }, { statement: 'Deepening my self-knowledge has changed how I approach the world.', answer: 'True' }],
    intelligence: [{ statement: 'I think about the nature of suffering and its role in growth.', answer: 'True' }, { statement: 'My body holds memories that my mind has forgotten.', answer: 'Very True' }]
  },
  72: {
    day: 72,
    date: '2026-04-03',
    values: [{ statement: 'I receive gifts, compliments, and help with genuine openness.', answer: 'Somewhat' }, { statement: 'I feel grounded even when everything around me is shifting.', answer: 'True' }, { statement: 'I carry emotional patterns inherited from my family.', answer: 'True' }],
    archetypes: [{ statement: 'I have recently felt powerless and had to find my way through it.', answer: 'True' }, { statement: 'I am creating peace between my perfectionism and my humanity.', answer: 'True' }, { statement: 'I am actively reconciling past trauma with present strength.', answer: 'True' }],
    cognitive: [{ statement: 'I cope effectively when outcomes are completely out of my hands.', answer: 'True' }, { statement: 'Others count on me for a specific cognitive strength.', answer: 'True' }, { statement: 'I work comfortably on problems whose end I cannot yet see.', answer: 'True' }],
    intelligence: [{ statement: 'I organise my thoughts spatially — mind maps, diagrams, or layouts.', answer: 'Somewhat' }, { statement: 'I am good at packing, fitting objects into containers efficiently.', answer: 'True' }, { statement: 'I am drawn to physical forms of art — pottery, sculpture, carpentry.', answer: 'True' }]
  },
  73: {
    day: 73,
    date: '2026-04-04',
    values: [{ statement: 'The values I most want to pass on are active in my daily life.', answer: 'True' }, { statement: 'I struggle to forgive certain things, and that reveals something about my values.', answer: 'True' }],
    archetypes: [{ statement: 'I listen without giving advice when that\'s what someone truly needs.', answer: 'True' }, { statement: 'My life roles — parent, partner, professional — compete for dominance.', answer: 'True' }],
    cognitive: [{ statement: 'My inner creator speaks louder than my inner critic.', answer: 'True' }, { statement: 'I find a way to get unstuck when I\'m blocked.', answer: 'True' }],
    intelligence: [{ statement: 'I notice the quality of air, light, and water wherever I go.', answer: 'True' }, { statement: 'I learn best from diagrams, maps, and charts.', answer: 'Somewhat' }]
  },
  74: {
    day: 74,
    date: '2026-04-05',
    values: [{ statement: 'There are certain people I find it harder to be compassionate toward.', answer: 'True' }, { statement: 'The people I am most alive with are the ones I laugh with most.', answer: 'True' }],
    archetypes: [{ statement: 'I stand in my power on ordinary days, not just dramatic ones.', answer: 'True' }, { statement: 'I know the difference between rebellion and self-destruction.', answer: 'True' }],
    cognitive: [{ statement: 'I find meaningful connections in coincidences.', answer: 'True' }, { statement: 'I detect when someone is not being fully honest.', answer: 'True' }],
    intelligence: [{ statement: 'I prefer precise language over approximate descriptions.', answer: 'True' }, { statement: 'I often wonder if there are dimensions of reality we cannot perceive.', answer: 'True' }]
  },
  75: {
    day: 75,
    date: '2026-04-06',
    values: [{ statement: 'I have a guiding sense of meaning that carries me through uncertainty.', answer: 'True' }, { statement: 'I pretend not to care about things that actually matter to me.', answer: 'True' }, { statement: 'I respond to ethical tests with integrity.', answer: 'True' }],
    archetypes: [{ statement: 'I need to challenge my own inner authority right now.', answer: 'True' }, { statement: 'My most guarded self and my most unguarded self need a conversation.', answer: 'True' }, { statement: 'I have a clear understanding of what personal power means to me.', answer: 'True' }],
    cognitive: [{ statement: 'I manage the mental cost of context switching well.', answer: 'True' }, { statement: 'I handle the discomfort of being a beginner with patience.', answer: 'True' }, { statement: 'Recurring memories reveal important things about my current needs.', answer: 'True' }],
    intelligence: [{ statement: 'I feel a deep sense of wonder about the natural world.', answer: 'True' }, { statement: 'I notice sounds in nature — birdsong, wind, water — that others miss.', answer: 'True' }, { statement: 'I think about ethics and moral philosophy in everyday situations.', answer: 'True' }]
  },
  76: {
    day: 76,
    date: '2026-04-07',
    values: [{ statement: 'A specific choice I made gave me a powerful sense of freedom.', answer: 'True' }, { statement: 'My definition of success reflects my own truth, not society\'s.', answer: 'True' }],
    archetypes: [{ statement: 'I can be vulnerable without feeling weak.', answer: 'True' }, { statement: 'I balance my desire for connection with my need for solitude.', answer: 'True' }],
    cognitive: [{ statement: 'I deliberate carefully before committing to choices.', answer: 'True' }, { statement: 'I catch myself overthinking and shift back to action.', answer: 'True' }],
    intelligence: [{ statement: 'I am drawn to geometry, fractals, or visual patterns.', answer: 'Somewhat' }, { statement: 'I am visually creative — I see beauty in unexpected places.', answer: 'True' }]
  },
  77: {
    day: 77,
    date: '2026-04-08',
    values: [{ statement: 'I am intentional about which causes deserve my energy.', answer: 'True' }, { statement: 'I build stability without becoming rigid.', answer: 'True' }],
    archetypes: [{ statement: 'A self-sabotaging behaviour keeps returning because it serves a hidden need.', answer: 'True' }, { statement: 'I handle intellectual disagreements without making them personal.', answer: 'True' }],
    cognitive: [{ statement: 'I form opinions quickly when presented with new information.', answer: 'True' }, { statement: 'I sustain deep concentration for extended periods.', answer: 'True' }],
    intelligence: [{ statement: 'I express emotions more easily through music than words.', answer: 'True' }, { statement: 'I remember quotes and phrases long after I read them.', answer: 'True' }]
  },
  78: {
    day: 78,
    date: '2026-04-09',
    values: [{ statement: 'I am able to repair trust when it breaks.', answer: 'True' }, { statement: 'I know how to reclaim myself after giving too much away.', answer: 'True' }, { statement: 'I navigate situations where someone needs more from me than I can give.', answer: 'True' }],
    archetypes: [{ statement: 'A defining battle — literal or figurative — has shaped who I am.', answer: 'True' }, { statement: 'Someone has said something empowering to me that still stays with me.', answer: 'True' }, { statement: 'I am growing even when it doesn\'t feel like it.', answer: 'True' }],
    cognitive: [{ statement: 'I process my emotions through language.', answer: 'Very True' }, { statement: 'I develop my cognitive weaknesses rather than only leaning into my strengths.', answer: 'True' }, { statement: 'I integrate new knowledge with what I already know seamlessly.', answer: 'True' }],
    intelligence: [{ statement: 'I am sensitive to tone and subtext in written messages.', answer: 'True' }, { statement: 'I am comfortable with emotional complexity — I can hold multiple feelings at once.', answer: 'True' }, { statement: 'I easily identify the key variables in a complex situation.', answer: 'True' }]
  },
  79: {
    day: 79,
    date: '2026-04-10',
    values: [{ statement: 'My kindness is worth what it costs me.', answer: 'True' }, { statement: 'I speak difficult truths even when it\'s uncomfortable.', answer: 'True' }],
    archetypes: [{ statement: 'I care for people without trying to fix them.', answer: 'True' }, { statement: 'I distinguish between fighting a good fight and picking unnecessary battles.', answer: 'True' }],
    cognitive: [{ statement: 'I handle uncertainty in relationships with composure.', answer: 'True' }, { statement: 'Specific sensory triggers bring a flood of old memories.', answer: 'True' }],
    intelligence: [{ statement: 'I enjoy design, architecture, or visual arts.', answer: 'True' }, { statement: 'I enjoy gardening, foraging, or tending living things.', answer: 'True' }]
  },
  80: {
    day: 80,
    date: '2026-04-11',
    values: [{ statement: 'A specific place in nature holds deep meaning for me.', answer: 'True' }, { statement: 'I can find something funny even in my own suffering.', answer: 'True' }],
    archetypes: [{ statement: 'Dropping all my masks for a day would be both terrifying and liberating.', answer: 'True' }, { statement: 'I am deeply aware of what is most beautiful about being human.', answer: 'True' }],
    cognitive: [{ statement: 'I adapt my thinking style for different kinds of challenges.', answer: 'True' }, { statement: 'I balance structured learning with explorative discovery.', answer: 'True' }],
    intelligence: [{ statement: 'I process information best when it is colour-coded or spatially arranged.', answer: 'True' }, { statement: 'I am physically expressive — people can read my body easily.', answer: 'True' }]
  },
  81: {
    day: 81,
    date: '2026-04-12',
    values: [{ statement: 'I have a clear vision of how I want to grow in the next year.', answer: 'True' }, { statement: 'I am tolerating things in my life that conflict with my values.', answer: 'True' }, { statement: 'Complexity in my life often masks a lack of clarity about what matters.', answer: 'True' }],
    archetypes: [{ statement: 'I navigate the tension between going deep and going wide in life.', answer: 'True' }, { statement: 'I carry wisdom I could share with someone going through what I once went through.', answer: 'True' }, { statement: 'I am living inside a myth of my own making.', answer: 'True' }],
    cognitive: [{ statement: 'I think most effectively in writing rather than speaking or drawing.', answer: 'True' }, { statement: 'I analyse complex issues thoroughly and effectively.', answer: 'True' }, { statement: 'My inner monologue is structured and clear.', answer: 'True' }],
    intelligence: [{ statement: 'I prefer evidence-based decisions over intuition.', answer: 'Not True' }, { statement: 'I remember places by their visual landmarks.', answer: 'True' }, { statement: 'I enjoy group brainstorming and collaborative thinking.', answer: 'Somewhat' }]
  },
  82: {
    day: 82,
    date: '2026-04-13',
    values: [{ statement: 'I over-control parts of my life because of an underlying fear.', answer: 'True' }, { statement: 'My family of origin has shaped me in ways I am still discovering.', answer: 'Very True' }],
    archetypes: [{ statement: 'I handle someone trying to diminish my power with composure.', answer: 'True' }, { statement: 'I respect both my extraverted and introverted needs.', answer: 'True' }],
    cognitive: [{ statement: 'I articulate what I think with precision and clarity.', answer: 'True' }, { statement: 'I recognise when I am reasoning well versus poorly.', answer: 'True' }],
    intelligence: [{ statement: 'I am deeply curious about what happens after death.', answer: 'True' }, { statement: 'I prefer natural materials over synthetic ones.', answer: 'True' }]
  },
  83: {
    day: 83,
    date: '2026-04-14',
    values: [{ statement: 'There are areas of my life that need stronger boundaries right now.', answer: 'Very True' }, { statement: 'I share my creative gifts generously with others.', answer: 'True' }],
    archetypes: [{ statement: 'I am embodying a specific archetype in this season of my life.', answer: 'True' }, { statement: 'I am approaching a meaningful milestone of personal growth.', answer: 'True' }],
    cognitive: [{ statement: 'I adjust my beliefs when I discover I\'ve been wrong.', answer: 'True' }, { statement: 'I find deep satisfaction in thorough analysis.', answer: 'True' }],
    intelligence: [{ statement: 'I am drawn to live music and feel it differently than recorded music.', answer: 'True' }, { statement: 'I know what triggers my anxiety, anger, or sadness.', answer: 'True' }]
  },
  84: {
    day: 84,
    date: '2026-04-15',
    values: [{ statement: 'I know exactly how I want to be cared for when I\'m at my lowest.', answer: 'Very True' }, { statement: 'I stay grounded during periods of uncertainty.', answer: 'True' }, { statement: 'I prepare for the unknown without living in anxiety.', answer: 'True' }],
    archetypes: [{ statement: 'My soul needs something that my ego keeps ignoring.', answer: 'True' }, { statement: 'Powerlessness has a specific, recognisable feeling in my body.', answer: 'True' }, { statement: 'I maintain dignity when life strips away my defences.', answer: 'True' }],
    cognitive: [{ statement: 'I process disagreements in real-time conversation effectively.', answer: 'True' }, { statement: 'I notice when my attention is being manipulated.', answer: 'True' }, { statement: 'I review my day mentally before sleep.', answer: 'True' }],
    intelligence: [{ statement: 'I enjoy experimenting with sound — instruments, apps, or voice.', answer: 'True' }, { statement: 'I instinctively rearrange spaces to make them feel better.', answer: 'True' }, { statement: 'I am drawn to philosophical paradoxes and thought experiments.', answer: 'True' }]
  },
  85: {
    day: 85,
    date: '2026-04-16',
    values: [{ statement: 'Honour is an active part of my personal code.', answer: 'True' }, { statement: 'I am willing to be a beginner at something new.', answer: 'True' }],
    archetypes: [{ statement: 'The most important things in my life are invisible.', answer: 'True' }, { statement: 'I stay anchored even when my purpose feels unclear.', answer: 'True' }],
    cognitive: [{ statement: 'I move from thinking about an idea to actually implementing it.', answer: 'True' }, { statement: 'I am evolving the aspects of my cognition I most want to improve.', answer: 'True' }],
    intelligence: [{ statement: 'I am moved by the fragility and impermanence of life.', answer: 'True' }, { statement: 'I would feel deeply diminished if music disappeared from my life.', answer: 'True' }]
  },
  86: {
    day: 86,
    date: '2026-04-17',
    values: [{ statement: 'I make deliberate time to be in natural spaces.', answer: 'True' }, { statement: 'The natural world has taught me something important about myself.', answer: 'True' }],
    archetypes: [{ statement: 'I can clearly differentiate between intuition and impulse.', answer: 'True' }, { statement: 'Being "on" all day is cognitively and emotionally exhausting.', answer: 'True' }],
    cognitive: [{ statement: 'I have a comfort memory I return to when I need grounding.', answer: 'True' }, { statement: 'Physical movement helps my thinking when I\'m stuck.', answer: 'True' }],
    intelligence: [{ statement: 'I notice when landscapes, forests, or green spaces are healthy or damaged.', answer: 'True' }, { statement: 'I am good at making introductions and connecting people.', answer: 'True' }]
  },
  87: {
    day: 87,
    date: '2026-04-18',
    values: [{ statement: 'I experience emotional security in my closest relationship.', answer: 'True' }, { statement: 'I am neglecting a creative urge that wants my attention.', answer: 'True' }, { statement: 'Someone else\'s compassion recently shifted the course of my day.', answer: 'True' }],
    archetypes: [{ statement: 'I experience real conflict between desire and duty.', answer: 'True' }, { statement: 'I feel the vulnerability of being between who I was and who I\'m becoming.', answer: 'True' }, { statement: 'Homecoming after a long internal journey brings me deep peace.', answer: 'True' }],
    cognitive: [{ statement: 'I listen more than I respond in conversations.', answer: 'True' }, { statement: 'I adapt my plans fluidly when the rules keep changing.', answer: 'True' }, { statement: 'I trust my first thought and act on it confidently.', answer: 'Somewhat' }],
    intelligence: [{ statement: 'I am drawn to stories about transformation and transcendence.', answer: 'True' }, { statement: 'I find it hard to think clearly when my body feels tense.', answer: 'True' }, { statement: 'I remember details about people — their stories, preferences, struggles.', answer: 'True' }]
  },
  88: {
    day: 88,
    date: '2026-04-19',
    values: [{ statement: 'I use humor to connect rather than to deflect.', answer: 'True' }, { statement: 'A recurring desire in me is guiding my life choices.', answer: 'True' }],
    archetypes: [{ statement: 'I honour my past while stepping into my future.', answer: 'True' }, { statement: 'My relationship with silence reveals something important about me.', answer: 'True' }],
    cognitive: [{ statement: 'These reflections have taught me something important about myself.', answer: 'True' }, { statement: 'I default to seeing uncertainty as opportunity rather than threat.', answer: 'True' }],
    intelligence: [{ statement: 'I can tell what material something is by touching it.', answer: 'True' }, { statement: 'I feel a responsibility to protect the natural world.', answer: 'True' }]
  },
  89: {
    day: 89,
    date: '2026-04-20',
    values: [{ statement: 'I navigate moral grey areas thoughtfully rather than reactively.', answer: 'True' }, { statement: 'I have learned something about life that I consider profoundly important.', answer: 'True' }],
    archetypes: [{ statement: 'I am on a meaningful quest or mission in my life right now.', answer: 'True' }, { statement: 'My ideal self and my real self are not far apart.', answer: 'True' }],
    cognitive: [{ statement: 'I give my fullest attention to the activities that engage me.', answer: 'True' }, { statement: 'I apply cognitive flexibility naturally in different situations.', answer: 'True' }],
    intelligence: [{ statement: 'I like categorising and organising information.', answer: 'True' }, { statement: 'I feel calmer near water — rivers, lakes, ocean.', answer: 'True' }]
  },
  90: {
    day: 90,
    date: '2026-04-21',
    values: [{ statement: 'I know when to speak up and when to stay quiet.', answer: 'True' }, { statement: 'I balance structure and spontaneity well in my life.', answer: 'True' }, { statement: 'I am consciously creating the legacy I want to leave.', answer: 'True' }],
    archetypes: [{ statement: 'I process life experiences on a symbolic level, not just a literal one.', answer: 'True' }, { statement: 'Part of my personality is actually a survival strategy from the past.', answer: 'True' }, { statement: 'I perform a character when I\'m trying to impress someone.', answer: 'True' }],
    cognitive: [{ statement: 'I adopt mental models from others that improve my thinking.', answer: 'True' }, { statement: 'Self-reflection plays a central role in my intellectual growth.', answer: 'True' }, { statement: 'I reframe problems effectively when the original framing leads nowhere.', answer: 'True' }],
    intelligence: [{ statement: 'I rely on spreadsheets, charts, or structured tools to organise decisions.', answer: 'Somewhat' }, { statement: 'I notice subtle shifts in someone\'s tone or energy.', answer: 'True' }, { statement: 'I keep journals, notes, or letters regularly.', answer: 'True' }]
  }
};

function buildPromptResponse(day: number): string {
  const reflection = ACCOUNT_B_DAILY_REFLECTIONS[day];
  const formatCategory = (items: ReflectionAnswer[]) =>
    items.map((item) => `${item.statement} = ${item.answer}`).join('; ');

  return [
    `values: ${formatCategory(reflection.values)}`,
    `archetypes: ${formatCategory(reflection.archetypes)}`,
    `cognitive: ${formatCategory(reflection.cognitive)}`,
    `intelligence: ${formatCategory(reflection.intelligence)}`,
  ].join(' | ');
}

const CSV_JOURNAL_DATA: Record<string, { title: string; text: string; tags: string[] }> = {
  '2026-01-22': { title: 'I woke up already bracing', text: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.', tags: ['Anxious', 'Sensitive', 'Self-Doubt', 'Rejection', 'Overthinking', 'Processing'] },
  '2026-01-23': { title: 'Trying not to feel so visible', text: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.', tags: ['Guarded', 'Sensitive', 'Self-Doubt', 'Identity', 'Awareness', 'Home'] },
  '2026-01-24': { title: 'The hearing part of feeling left out', text: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.', tags: ['Ashamed', 'Frustrated', 'Misunderstood', 'Sensory Overload', 'Mental Load', 'Awareness'] },
  '2026-01-25': { title: 'A quiet grief day', text: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.', tags: ['Sad', 'Grief', 'Loss', 'Memory', 'Processing', 'Inner Child'] },
  '2026-01-26': { title: 'I can feel comparison working on me', text: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.', tags: ['Ashamed', 'Self-Doubt', 'Identity', 'Acceptance', 'Overthinking', 'Self-Reflection'] },
  '2026-01-27': { title: 'Missing Naomi in small moments', text: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.', tags: ['Sad', 'Attachment', 'Loss', 'Parenting', 'Caregiving', 'Memory'] },
  '2026-01-28': { title: 'Everything feels heavier when I am tired', text: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.', tags: ['Heavy', 'Exhausted', 'Low Energy', 'Body Heaviness', 'Mental Load', 'Sleep'] },
  '2026-01-29': { title: 'Wanting to be noticed without asking', text: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.', tags: ['Lonely', 'Attachment', 'Support', 'Closeness', 'Vulnerable', 'Connection'] },
  '2026-01-30': { title: 'I am more sensitive than I look', text: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.', tags: ['Sensitive', 'Guarded', 'Self-Doubt', 'Awareness', 'Processing', 'Safety'] },
  '2026-01-31': { title: 'My body knew before my mind did', text: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.', tags: ['Triggered', 'Anxious', 'Body Heaviness', 'Awareness', 'Processing', 'Survival'] },
  '2026-02-01': { title: 'Wishing I were easier to be', text: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.', tags: ['Sad', 'Self-Doubt', 'Identity', 'Hope', 'Self-Reflection', 'Healing'] },
  '2026-02-02': { title: 'The loneliness under competence', text: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.', tags: ['Lonely', 'Heavy', 'Caregiving', 'Mental Load', 'Self-Reflection', 'Home'] },
  '2026-02-03': { title: 'I needed more softness today', text: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.', tags: ['Overwhelmed', 'Vulnerable', 'Healing', 'Rest', 'Recovery', 'Home'] },
  '2026-02-04': { title: 'It is hard not to read things as rejection', text: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.', tags: ['Anxious', 'Hurt', 'Rejection', 'Overthinking', 'Rumination', 'Emotional Pattern'] },
  '2026-02-05': { title: 'I kept overexplaining and hated it', text: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.', tags: ['Ashamed', 'Anxious', 'Misunderstood', 'Processing', 'Mental Load', 'Self-Doubt'] },
  '2026-02-06': { title: 'Lucas deserved a less depleted version of me', text: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.', tags: ['Exhausted', 'Parenting', 'Caregiving', 'Low Energy', 'Tired', 'Home'] },
  '2026-02-07': { title: 'I miss being met quickly', text: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.', tags: ['Lonely', 'Hurt', 'Attachment', 'Distance', 'Repair', 'Connection'] },
  '2026-02-08': { title: 'Old family pain in a new moment', text: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.', tags: ['Sad', 'Family', 'Memory', 'Hurt', 'Processing', 'Inner Child'] },
  '2026-02-09': { title: 'Today my hearing made me feel separate', text: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.', tags: ['Frustrated', 'Misunderstood', 'Disconnected', 'Sensory Overload', 'Mental Load', 'Awareness'] },
  '2026-02-10': { title: 'Wanting to be chosen without performing', text: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.', tags: ['Lonely', 'Attachment', 'Closeness', 'Distance', 'Overthinking', 'Love'] },
  '2026-02-11': { title: 'I do not think people realize how much I carry', text: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.', tags: ['Anxious', 'Sensitive', 'Self-Doubt', 'Rejection', 'Overthinking', 'Processing'] },
  '2026-02-12': { title: 'Trying not to spiral', text: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.', tags: ['Guarded', 'Sensitive', 'Self-Doubt', 'Identity', 'Awareness', 'Home'] },
  '2026-02-13': { title: 'I felt small in a way I could not hide from myself', text: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.', tags: ['Ashamed', 'Frustrated', 'Misunderstood', 'Sensory Overload', 'Mental Load', 'Awareness'] },
  '2026-02-14': { title: 'So much of me is trying to stay acceptable', text: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.', tags: ['Sad', 'Grief', 'Loss', 'Memory', 'Processing', 'Inner Child'] },
  '2026-02-15': { title: 'A body-memory kind of day', text: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.', tags: ['Ashamed', 'Self-Doubt', 'Identity', 'Acceptance', 'Overthinking', 'Self-Reflection'] },
  '2026-02-16': { title: 'I was more flooded than I looked', text: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.', tags: ['Sad', 'Attachment', 'Loss', 'Parenting', 'Caregiving', 'Memory'] },
  '2026-02-17': { title: 'I wish belonging felt less fragile', text: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.', tags: ['Heavy', 'Exhausted', 'Low Energy', 'Body Heaviness', 'Mental Load', 'Sleep'] },
  '2026-02-18': { title: 'The system takes and takes', text: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.', tags: ['Lonely', 'Attachment', 'Support', 'Closeness', 'Vulnerable', 'Connection'] },
  '2026-02-19': { title: 'I felt ugly and overaware today', text: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.', tags: ['Sensitive', 'Guarded', 'Self-Doubt', 'Awareness', 'Processing', 'Safety'] },
  '2026-02-20': { title: 'I am tired of needing reassurance', text: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.', tags: ['Triggered', 'Anxious', 'Body Heaviness', 'Awareness', 'Processing', 'Survival'] },
  '2026-02-21': { title: 'Part of me still expects to be left', text: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.', tags: ['Sad', 'Self-Doubt', 'Identity', 'Hope', 'Self-Reflection', 'Healing'] },
  '2026-02-22': { title: 'Nothing huge happened and I still felt wrecked', text: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.', tags: ['Lonely', 'Heavy', 'Caregiving', 'Mental Load', 'Self-Reflection', 'Home'] },
  '2026-02-23': { title: 'I wanted to be held differently', text: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.', tags: ['Overwhelmed', 'Vulnerable', 'Healing', 'Rest', 'Recovery', 'Home'] },
  '2026-02-24': { title: 'When I miss part of the conversation, I miss more than words', text: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.', tags: ['Anxious', 'Hurt', 'Rejection', 'Overthinking', 'Rumination', 'Emotional Pattern'] },
  '2026-02-25': { title: 'I keep trying to earn rest', text: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.', tags: ['Ashamed', 'Anxious', 'Misunderstood', 'Processing', 'Mental Load', 'Self-Doubt'] },
  '2026-02-26': { title: 'My chest was tight all day', text: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.', tags: ['Exhausted', 'Parenting', 'Caregiving', 'Low Energy', 'Tired', 'Home'] },
  '2026-02-27': { title: 'I hate how fast embarrassment turns into shame', text: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.', tags: ['Lonely', 'Hurt', 'Attachment', 'Distance', 'Repair', 'Connection'] },
  '2026-02-28': { title: 'Some days I feel like a burden just for existing', text: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.', tags: ['Sad', 'Family', 'Memory', 'Hurt', 'Processing', 'Inner Child'] },
  '2026-03-01': { title: 'There is anger under this sadness', text: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.', tags: ['Frustrated', 'Misunderstood', 'Disconnected', 'Sensory Overload', 'Mental Load', 'Awareness'] },
  '2026-03-02': { title: 'I can feel the younger ache in me', text: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.', tags: ['Lonely', 'Attachment', 'Closeness', 'Distance', 'Overthinking', 'Love'] },
  '2026-03-03': { title: 'I needed clarity and got ambiguity', text: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.', tags: ['Anxious', 'Sensitive', 'Self-Doubt', 'Rejection', 'Overthinking', 'Processing'] },
  '2026-03-04': { title: 'My nervous system hates uncertainty', text: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.', tags: ['Guarded', 'Sensitive', 'Self-Doubt', 'Identity', 'Awareness', 'Home'] },
  '2026-03-05': { title: 'I did not want to be perceived today', text: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.', tags: ['Ashamed', 'Frustrated', 'Misunderstood', 'Sensory Overload', 'Mental Load', 'Awareness'] },
  '2026-03-06': { title: 'The grief comes back in flashes', text: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.', tags: ['Sad', 'Grief', 'Loss', 'Memory', 'Processing', 'Inner Child'] },
  '2026-03-07': { title: 'I held it together, but barely', text: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.', tags: ['Ashamed', 'Self-Doubt', 'Identity', 'Acceptance', 'Overthinking', 'Self-Reflection'] },
  '2026-03-08': { title: 'I wish I trusted myself more', text: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.', tags: ['Sad', 'Attachment', 'Loss', 'Parenting', 'Caregiving', 'Memory'] },
  '2026-03-09': { title: 'Today felt like too many selves at once', text: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.', tags: ['Heavy', 'Exhausted', 'Low Energy', 'Body Heaviness', 'Mental Load', 'Sleep'] },
  '2026-03-10': { title: 'I wanted to withdraw before anyone could reject me', text: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.', tags: ['Lonely', 'Attachment', 'Support', 'Closeness', 'Vulnerable', 'Connection'] },
  '2026-03-11': { title: 'I can feel how much I want safe closeness', text: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.', tags: ['Sensitive', 'Guarded', 'Self-Doubt', 'Awareness', 'Processing', 'Safety'] },
  '2026-03-12': { title: 'The house felt heavy with my mood', text: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.', tags: ['Triggered', 'Anxious', 'Body Heaviness', 'Awareness', 'Processing', 'Survival'] },
  '2026-03-13': { title: 'I kept replaying everything after', text: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.', tags: ['Sad', 'Self-Doubt', 'Identity', 'Hope', 'Self-Reflection', 'Healing'] },
  '2026-03-14': { title: 'Some pain is quiet but constant', text: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.', tags: ['Lonely', 'Heavy', 'Caregiving', 'Mental Load', 'Self-Reflection', 'Home'] },
  '2026-03-15': { title: 'I am always watching for shifts in tone', text: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.', tags: ['Overwhelmed', 'Vulnerable', 'Healing', 'Rest', 'Recovery', 'Home'] },
  '2026-03-16': { title: 'I wanted to be less needy and more honest', text: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.', tags: ['Anxious', 'Hurt', 'Rejection', 'Overthinking', 'Rumination', 'Emotional Pattern'] },
  '2026-03-17': { title: 'The foster care stress lives in my body', text: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.', tags: ['Ashamed', 'Anxious', 'Misunderstood', 'Processing', 'Mental Load', 'Self-Doubt'] },
  '2026-03-18': { title: 'Sometimes care feels invisible unless I collapse', text: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.', tags: ['Exhausted', 'Parenting', 'Caregiving', 'Low Energy', 'Tired', 'Home'] },
  '2026-03-19': { title: 'I felt behind all day', text: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.', tags: ['Lonely', 'Hurt', 'Attachment', 'Distance', 'Repair', 'Connection'] },
  '2026-03-20': { title: 'The day asked too much from me', text: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.', tags: ['Sad', 'Family', 'Memory', 'Hurt', 'Processing', 'Inner Child'] },
  '2026-03-21': { title: 'I wanted home to feel softer', text: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.', tags: ['Frustrated', 'Misunderstood', 'Disconnected', 'Sensory Overload', 'Mental Load', 'Awareness'] },
  '2026-03-22': { title: 'I notice rejection before I notice safety', text: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.', tags: ['Lonely', 'Attachment', 'Closeness', 'Distance', 'Overthinking', 'Love'] },
  '2026-03-23': { title: 'I do not know how to stop comparing', text: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.', tags: ['Anxious', 'Sensitive', 'Self-Doubt', 'Rejection', 'Overthinking', 'Processing'] },
  '2026-03-24': { title: 'A dream stayed in my chest all morning', text: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.', tags: ['Guarded', 'Sensitive', 'Self-Doubt', 'Identity', 'Awareness', 'Home'] },
  '2026-03-25': { title: 'I felt both protective and depleted', text: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.', tags: ['Ashamed', 'Frustrated', 'Misunderstood', 'Sensory Overload', 'Mental Load', 'Awareness'] },
  '2026-03-26': { title: 'I wanted someone to understand without explanation', text: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.', tags: ['Sad', 'Grief', 'Loss', 'Memory', 'Processing', 'Inner Child'] },
  '2026-03-27': { title: 'I can feel how badly I want repair', text: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.', tags: ['Ashamed', 'Self-Doubt', 'Identity', 'Acceptance', 'Overthinking', 'Self-Reflection'] },
  '2026-03-28': { title: 'Being misunderstood hit me harder than it should have', text: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.', tags: ['Sad', 'Attachment', 'Loss', 'Parenting', 'Caregiving', 'Memory'] },
  '2026-03-29': { title: 'I am trying not to harden', text: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.', tags: ['Heavy', 'Exhausted', 'Low Energy', 'Body Heaviness', 'Mental Load', 'Sleep'] },
  '2026-03-30': { title: 'The sadness sat behind everything today', text: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.', tags: ['Lonely', 'Attachment', 'Support', 'Closeness', 'Vulnerable', 'Connection'] },
  '2026-03-31': { title: 'I can feel how much performance costs me', text: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.', tags: ['Sensitive', 'Guarded', 'Self-Doubt', 'Awareness', 'Processing', 'Safety'] },
  '2026-04-01': { title: 'I needed permission to stop', text: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.', tags: ['Triggered', 'Anxious', 'Body Heaviness', 'Awareness', 'Processing', 'Survival'] },
  '2026-04-02': { title: 'I wish support reached me sooner', text: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.', tags: ['Sad', 'Self-Doubt', 'Identity', 'Hope', 'Self-Reflection', 'Healing'] },
  '2026-04-03': { title: 'I felt disconnected even while functioning', text: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.', tags: ['Lonely', 'Heavy', 'Caregiving', 'Mental Load', 'Self-Reflection', 'Home'] },
  '2026-04-04': { title: 'There is a tiredness that sleep does not fix', text: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.', tags: ['Overwhelmed', 'Vulnerable', 'Healing', 'Rest', 'Recovery', 'Home'] },
  '2026-04-05': { title: 'I wanted to be less visible and more loved', text: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.', tags: ['Anxious', 'Hurt', 'Rejection', 'Overthinking', 'Rumination', 'Emotional Pattern'] },
  '2026-04-06': { title: 'Today I felt the fear of being replaceable', text: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.', tags: ['Ashamed', 'Anxious', 'Misunderstood', 'Processing', 'Mental Load', 'Self-Doubt'] },
  '2026-04-07': { title: 'I wanted my body to unclench', text: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.', tags: ['Exhausted', 'Parenting', 'Caregiving', 'Low Energy', 'Tired', 'Home'] },
  '2026-04-08': { title: 'The ache of not feeling singular', text: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.', tags: ['Lonely', 'Hurt', 'Attachment', 'Distance', 'Repair', 'Connection'] },
  '2026-04-09': { title: 'I can see the pattern and still get caught in it', text: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.', tags: ['Sad', 'Family', 'Memory', 'Hurt', 'Processing', 'Inner Child'] },
  '2026-04-10': { title: 'I wish I felt safer in closeness', text: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.', tags: ['Frustrated', 'Misunderstood', 'Disconnected', 'Sensory Overload', 'Mental Load', 'Awareness'] },
  '2026-04-11': { title: 'I ended the day overstimulated and lonely', text: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.', tags: ['Lonely', 'Attachment', 'Closeness', 'Distance', 'Overthinking', 'Love'] },
  '2026-04-12': { title: 'I am tired of the system', text: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.', tags: ['Anxious', 'Sensitive', 'Self-Doubt', 'Rejection', 'Overthinking', 'Processing'] },
  '2026-04-13': { title: 'Wanting Annie to choose me', text: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.', tags: ['Guarded', 'Sensitive', 'Self-Doubt', 'Identity', 'Awareness', 'Home'] },
  '2026-04-14': { title: 'Feeling left out again', text: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.', tags: ['Ashamed', 'Frustrated', 'Misunderstood', 'Sensory Overload', 'Mental Load', 'Awareness'] },
  '2026-04-15': { title: 'Feeling blurry inside', text: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.', tags: ['Sad', 'Grief', 'Loss', 'Memory', 'Processing', 'Inner Child'] },
  '2026-04-16': { title: 'Wishing I were easier to be', text: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.', tags: ['Ashamed', 'Self-Doubt', 'Identity', 'Acceptance', 'Overthinking', 'Self-Reflection'] },
  '2026-04-17': { title: 'Everyone probably hates me', text: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.', tags: ['Sad', 'Attachment', 'Loss', 'Parenting', 'Caregiving', 'Memory'] },
  '2026-04-18': { title: 'The hearing part people do not see', text: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.', tags: ['Heavy', 'Exhausted', 'Low Energy', 'Body Heaviness', 'Mental Load', 'Sleep'] },
  '2026-04-19': { title: 'Raising Lucas while running on empty', text: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.', tags: ['Lonely', 'Attachment', 'Support', 'Closeness', 'Vulnerable', 'Connection'] },
  '2026-04-20': { title: 'Naomi leaving still hurts', text: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.', tags: ['Sensitive', 'Guarded', 'Self-Doubt', 'Awareness', 'Processing', 'Safety'] },
  '2026-04-21': { title: 'Dealing with Sarah is its own strain', text: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.', tags: ['Triggered', 'Anxious', 'Body Heaviness', 'Awareness', 'Processing', 'Survival'] },
};


function buildDailyEntries(): DailyEntrySeed[] {
  const rows: DailyEntrySeed[] = [];

  for (let i = 0; i < 90; i++) {
    const day = i + 1;
    const date = isoDateFromOffset(i);
    const reflectionAnswers = ACCOUNT_B_DAILY_REFLECTIONS[day];
    const csvEntry = CSV_JOURNAL_DATA[date];
    const promptResponse = csvEntry ? csvEntry.text : buildPromptResponse(day);
    const journalTitle = csvEntry ? csvEntry.title : `Day ${day}`;
    const journalTags = csvEntry ? csvEntry.tags : [];
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
      day,
      date,
      promptResponse,
      journalTitle,
      journalTags,
      dailyReflectionAnswers: reflectionAnswers,
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
    vibe: 'reflective, emotionally deep, self-aware, private, overstretched, and quietly resilient',
    notesForDifferenceFromAccountA:
      'Account B stays separate from Account A. It uses the real reflection schedule and avoids reusing named Account A emotional content or relationship history.',
  },

  coreValues: {
    selected: ['connection', 'truth', 'healing', 'safety', 'authenticity', 'loyalty', 'meaning', 'protection'],
    topFive: ['connection', 'truth', 'healing', 'safety', 'authenticity'],
  },

  customJournalTags: [
    'hearing_loss',
    'rejection',
    'inferiority',
    'awkwardness',
    'attachment',
    'grief',
    'body_memory',
    'inner_world',
    'comparison',
    'overwhelm',
    'belonging',
    'regulation',
    'solitude',
    'meaning',
    'family_patterns',
    'boundaries',
    'repair',
    'self_trust',
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
    notes: 'Deep emotional processing, strong pattern recognition, verbal reflection, slower when flooded, often self-doubting despite real insight.',
  },

  dailyEntries: buildDailyEntries(),
  reflectionsFlat: ACCOUNT_B_REFLECTIONS,

  somaticEntries: [
    {
      date: isoDateTimeFromOffset(5, 14),
      region: 'chest',
      emotion: 'anxiety',
      intensity: 4,
      note: 'Felt tight in my chest after assuming someone was upset with me.',
      trigger: 'A social interaction that felt uncertain.',
      whatHelped: 'Stepping away and breathing slowly.',
    },
    {
      date: isoDateTimeFromOffset(12, 17),
      region: 'throat',
      emotion: 'pressure',
      intensity: 4,
      note: 'Felt like words were stuck and I was swallowing feelings.',
      trigger: 'Holding back what I actually wanted to say.',
      whatHelped: 'Writing instead of talking.',
    },
    {
      date: isoDateTimeFromOffset(19, 9),
      region: 'jaw',
      emotion: 'frustration',
      intensity: 3,
      note: 'My jaw was clenched after a stressful update and I did not realise it right away.',
      trigger: 'Feeling dismissed.',
      whatHelped: 'Unclenching and walking.',
    },
    {
      date: isoDateTimeFromOffset(27, 20),
      region: 'stomach',
      emotion: 'shame',
      intensity: 4,
      note: 'Felt sick after missing part of a conversation and feeling behind.',
      trigger: 'Not catching what someone said.',
      whatHelped: 'Being alone for a little while.',
    },
    {
      date: isoDateTimeFromOffset(35, 11),
      region: 'heart',
      emotion: 'tenderness',
      intensity: 4,
      note: 'Felt a warm ache after a moment of feeling understood.',
      trigger: 'Safe connection.',
      whatHelped: 'Letting myself stay in the warmth.',
    },
    {
      date: isoDateTimeFromOffset(43, 15),
      region: 'belly',
      emotion: 'dread',
      intensity: 5,
      note: 'My body knew I was overwhelmed before my mind admitted it.',
      trigger: 'Too many demands at once.',
      whatHelped: 'Cancelling one thing and lowering expectations.',
    },
    {
      date: isoDateTimeFromOffset(51, 8),
      region: 'shoulders',
      emotion: 'pressure',
      intensity: 4,
      note: 'Felt like I was carrying everything physically too.',
      trigger: 'Sustained responsibility without enough help.',
      whatHelped: 'Heat on my shoulders and sitting down.',
    },
    {
      date: isoDateTimeFromOffset(58, 22),
      region: 'solar_plexus',
      emotion: 'grief',
      intensity: 4,
      note: 'A heavy ache from remembering attachment and loss.',
      trigger: 'A memory that landed in my body.',
      whatHelped: 'Crying instead of suppressing it.',
    },
    {
      date: isoDateTimeFromOffset(66, 13),
      region: 'head',
      emotion: 'numbness',
      intensity: 3,
      note: 'Started feeling foggy and disconnected after emotional overload.',
      trigger: 'Too much internal conflict at once.',
      whatHelped: 'Quiet and less stimulation.',
    },
    {
      date: isoDateTimeFromOffset(74, 19),
      region: 'chest',
      emotion: 'warmth',
      intensity: 3,
      note: 'Felt softer after a calm moment of real connection.',
      trigger: 'Simple closeness.',
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
      event: 'Quiet moment of feeling understood',
      nsState: 'ventral_vagal',
      sensations: ['heart warmth', 'deeper breath'],
      note: 'Felt known instead of managed.',
    },
    {
      date: isoDateTimeFromOffset(11, 13),
      mode: 'drain',
      event: 'Missing part of a conversation',
      nsState: 'sympathetic',
      sensations: ['stomach drop', 'jaw tension'],
      note: 'Felt behind and embarrassed instantly.',
    },
    {
      date: isoDateTimeFromOffset(18, 19),
      mode: 'drain',
      event: 'Stressful systems update',
      nsState: 'sympathetic',
      sensations: ['chest tightening', 'held breath'],
      note: 'Anger and helplessness came up together.',
    },
    {
      date: isoDateTimeFromOffset(24, 21),
      mode: 'drain',
      event: 'Attachment ache',
      nsState: 'sympathetic',
      sensations: ['ache in chest', 'restless body'],
      note: 'Wanted to feel chosen and secure.',
    },
    {
      date: isoDateTimeFromOffset(29, 10),
      mode: 'nourish',
      event: 'Gentle moment of connection',
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
      note: 'Old belonging pain got touched.',
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
      event: 'Internal conflict',
      nsState: 'dorsal_vagal',
      sensations: ['foggy head', 'heavy limbs'],
      note: 'Felt blurry and internally split.',
    },
    {
      date: isoDateTimeFromOffset(56, 20),
      mode: 'nourish',
      event: 'Moment of honesty in reflection',
      nsState: 'ventral_vagal',
      sensations: ['clear chest', 'settled body'],
      note: 'Felt more integrated afterward.',
    },
    {
      date: isoDateTimeFromOffset(63, 17),
      mode: 'drain',
      event: 'Attachment grief flare',
      nsState: 'dorsal_vagal',
      sensations: ['heart ache', 'collapse feeling'],
      note: 'Loss was close to the surface.',
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
      event: 'Comparison spiral',
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
      note: 'I want to feel chosen in a way that is intense and young.',
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
      name: 'Close Friend',
      relationship: 'friend',
      birthDate: '',
      birthTime: '',
      hasUnknownTime: true,
      birthPlace: '',
      latitude: 0,
      longitude: 0,
      timezone: '',
      dynamicNote: 'Represents steadiness, safety, and being known.',
    },
    {
      name: 'Sibling',
      relationship: 'family',
      birthDate: '',
      birthTime: '',
      hasUnknownTime: true,
      birthPlace: '',
      latitude: 0,
      longitude: 0,
      timezone: '',
      dynamicNote: 'Represents belonging, exclusion, and layered family history.',
    },
    {
      name: 'Attachment Figure',
      relationship: 'important relationship',
      birthDate: '',
      birthTime: '',
      hasUnknownTime: true,
      birthPlace: '',
      latitude: 0,
      longitude: 0,
      timezone: '',
      dynamicNote: 'Represents longing, wanting to be chosen, and relational intensity.',
    },
  ],
};
