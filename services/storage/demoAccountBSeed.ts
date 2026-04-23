/**
 * demoAccountBSeed.ts
 *
 * Fully populated 90-day seed data for the real Account B demo user.
 * This file is intentionally emotionally specific to Brittany.
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
    vibe: 'emotionally deep, attachment-heavy, perceptive, worn down but resilient, soft under pressure, lived-in and specific',
    notesForDifferenceFromAccountA: 'Account B should feel unmistakably Brittany: motherhood with Lucas, grief around Naomi, foster-care system strain, hearing loss, DID/parts awareness, attachment intensity with Annie, and deep relief with Jamie.'
  },
  coreValues: {
    selected: [
      'connection',
      'authenticity',
      'protection',
      'truth',
      'healing',
      'loyalty',
      'safety',
      'love'
    ],
    topFive: [
      'connection',
      'authenticity',
      'protection',
      'healing',
      'love'
    ]
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
    'comparison',
    'repair'
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
      innocent: 1
    },
    completedAt: '2026-03-17T10:00:00.000Z'
  },
  cognitiveStyle: {
    scope: 3,
    processing: 5,
    decisions: 2,
    notes: 'Deep emotional processing, high pattern recognition, slower when flooded, often self-doubting despite strong intuition but able to see meaning across experiences.'
  },
  dailyEntries: [
    {
      day: 1,
      date: '2026-01-22',
      promptResponse: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.\n\nWhat felt truest tonight was how quickly my body turned the whole day into a referendum on whether I am too much or not enough. Day 1 made that especially clear through the shape of \'i woke up already bracing\'.',
      journalTitle: 'I woke up already bracing',
      journalTags: [
        'Anxious',
        'Sensitive',
        'Self-Doubt',
        'Rejection',
        'Overthinking',
        'Processing'
      ],
      dailyReflectionAnswers: {
        day: 1,
        date: '2026-01-22',
        values: [
          {
            statement: 'I recognise the early signs of burnout in myself.',
            answer: 'Very True'
          },
          {
            statement: 'My sense of identity has shifted meaningfully in the last year.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I convert fear into fuel and motivation.',
            answer: 'True'
          },
          {
            statement: 'A journey — internal or external — has significantly changed who I am.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I organise my thoughts clearly before speaking about something complex.',
            answer: 'True'
          },
          {
            statement: 'I think primarily in images rather than words.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I feel uncomfortable when there is unresolved tension in a group.',
            answer: 'Somewhat'
          },
          {
            statement: 'I am a natural mediator in disagreements.',
            answer: 'True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'anxious',
        'sensitive',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'Woke up carrying the feeling of \'i woke up already bracing\' before anything else happened; my body was already leaning toward fear.',
      morningWin: 'Even with \'i woke up already bracing\' hanging over me, I still managed to speak more honestly than I usually do.',
      morningChallenge: 'What stayed difficult all day was that \'i woke up already bracing\' kept feeding the fear that I was being judged.',
      eveningMood: 2,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'overthinking',
        'processing',
        'triggered',
        'awareness'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'i woke up already bracing\'; even while winding down I could feel fear sitting in my hips.',
      eveningWin: 'By evening, I could still let Lucas have the version of me that was present instead of perfect even though \'i woke up already bracing\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i woke up already bracing\' kept echoing as the urge to overexplain myself.',
      sleepHours: 5.5,
      dreamText: 'My body reacted first in the dream and the meaning arrived later, which made the whole thing feel older than the actual scene. The feeling connected back to \'i woke up already bracing\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 2,
      date: '2026-01-23',
      promptResponse: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.\n\nUnder the surface, I could feel the younger part of me still hoping someone would notice without my having to ask for that much care directly. Day 2 made that especially clear through the shape of \'trying not to feel so visible\'.',
      journalTitle: 'Trying not to feel so visible',
      journalTags: [
        'Guarded',
        'Sensitive',
        'Self-Doubt',
        'Identity',
        'Awareness',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 2,
        date: '2026-01-23',
        values: [
          {
            statement: 'What I believe about the nature of life shapes how I treat people.',
            answer: 'True'
          },
          {
            statement: 'I say no without guilt when I need to.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'An experience far outside my comfort zone shaped who I am profoundly.',
            answer: 'True'
          },
          {
            statement: 'Some responsibilities feel noble while others feel like burdens.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I follow a personal decision rule that serves me well.',
            answer: 'True'
          },
          {
            statement: 'I adapt my communication style fluidly for different people.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I learn and remember things better when they are set to music.',
            answer: 'True'
          },
          {
            statement: 'I can tell when a note or instrument is slightly off-pitch.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'guarded',
        'sensitive',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'The first thing I noticed this morning was how \'trying not to feel so visible\' was still living in me; it landed as self-consciousness in my shoulders.',
      morningWin: 'A quiet win today was that I could feel \'trying not to feel so visible\' and still stay softer with myself in one key moment.',
      morningChallenge: 'The hardest part of today was that \'trying not to feel so visible\' kept turning into an old attachment ache.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'awareness',
        'home',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'I ended the day realizing \'trying not to feel so visible\' had shaped more of it than I wanted; the residue was self-consciousness in my shoulders.',
      eveningWin: 'By evening, I could still leave one thing unfinished without punishing myself even though \'trying not to feel so visible\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'trying not to feel so visible\' kept echoing as the sense that I was too much and not enough at once.',
      sleepHours: 6.2,
      dreamText: 'The dream made every social moment feel like a test I had not studied for. The feeling connected back to \'trying not to feel so visible\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 4
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 3,
      date: '2026-01-24',
      promptResponse: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.\n\nThe thread underneath all of it was how hard it can be to stay on my own side when shame or comparison get activated. Day 3 made that especially clear through the shape of \'the hearing part of feeling left out\'.',
      journalTitle: 'The hearing part of feeling left out',
      journalTags: [
        'Ashamed',
        'Frustrated',
        'Misunderstood',
        'Sensory Overload',
        'Mental Load',
        'Awareness'
      ],
      dailyReflectionAnswers: {
        day: 3,
        date: '2026-01-24',
        values: [
          {
            statement: 'There are family patterns I am consciously choosing to break.',
            answer: 'Very True'
          },
          {
            statement: 'I have made meaningful sacrifices for the people I love.',
            answer: 'True'
          },
          {
            statement: 'Being respected matters more to me than being liked.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I navigate the disorientation of becoming someone new.',
            answer: 'True'
          },
          {
            statement: 'I handle the loneliness of walking my own path with grace.',
            answer: 'True'
          },
          {
            statement: 'At least one of my personas is exhausting to maintain.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I actively seek out new information through my preferred channels.',
            answer: 'True'
          },
          {
            statement: 'I take smart, well-calculated risks.',
            answer: 'True'
          },
          {
            statement: 'I push through learning plateaus even when progress feels invisible.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'Music connects me to something larger than myself.',
            answer: 'True'
          },
          {
            statement: 'I can identify many plants, trees, or animals by sight.',
            answer: 'True'
          },
          {
            statement: 'I notice physical discomfort in spaces that feel wrong.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'ashamed',
        'frustrated',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'This morning had the mood of \'the hearing part of feeling left out\'—I was scanning early and trying not to let shame run the day.',
      morningWin: 'What I did right, despite \'the hearing part of feeling left out\', was pause before assuming the worst.',
      morningChallenge: 'My biggest challenge was how \'the hearing part of feeling left out\' opened the door to self-consciousness that made everything feel louder.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'mental_load',
        'awareness',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'the hearing part of feeling left out\', and my body held it as shame around my throat.',
      eveningWin: 'By evening, I could still notice my body before it was screaming even though \'the hearing part of feeling left out\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'the hearing part of feeling left out\' kept echoing as comparison that turned mean quickly.',
      sleepHours: 6.9,
      dreamText: 'The dream turned every conversation into subtitles that vanished before I could finish reading them. The feeling connected back to \'the hearing part of feeling left out\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 5
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 4,
      date: '2026-01-25',
      promptResponse: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.\n\nMore than anything, I needed gentleness that did not have to be earned first. Day 4 made that especially clear through the shape of \'a quiet grief day\'.',
      journalTitle: 'A quiet grief day',
      journalTags: [
        'Sad',
        'Grief',
        'Loss',
        'Memory',
        'Processing',
        'Inner Child'
      ],
      dailyReflectionAnswers: {
        day: 4,
        date: '2026-01-25',
        values: [
          {
            statement: 'My body clearly signals when I feel safe versus when I feel threatened.',
            answer: 'Very True'
          },
          {
            statement: 'I willingly sacrifice smaller things for what truly matters.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'There are things about the way the world works that I refuse to accept.',
            answer: 'True'
          },
          {
            statement: 'My shadow shows up clearly in my relationships.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I handle memories that contradict my current self-image with openness.',
            answer: 'True'
          },
          {
            statement: 'Unexpected inputs — walks, conversations, random articles — spark breakthroughs for me.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I tend to absorb new languages naturally and quickly.',
            answer: 'True'
          },
          {
            statement: 'I hum, whistle, or tap rhythms without realising it.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'low',
      morningTags: [
        'sad',
        'grief',
        'tenderness',
        'memory'
      ],
      morningNote: 'I started the day with \'a quiet grief day\' sitting close to the surface, which made my solar_plexus feel charged with heaviness.',
      morningWin: 'Even with \'a quiet grief day\' hanging over me, I still managed to let Lucas have the version of me that was present instead of perfect.',
      morningChallenge: 'What stayed difficult all day was that \'a quiet grief day\' kept feeding a body memory that got ahead of language.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'low',
      eveningTags: [
        'processing',
        'inner_child',
        'loss',
        'ache'
      ],
      eveningNote: 'The evening version of today was \'a quiet grief day\'; underneath everything else I was still carrying heaviness in my solar_plexus.',
      eveningWin: 'By evening, I could still come back to the moment instead of spiraling all the way out even though \'a quiet grief day\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'a quiet grief day\' kept echoing as the feeling of being outside the room even while in it.',
      sleepHours: 7.6,
      dreamText: 'The dream held grief quietly rather than dramatically; everything looked normal, but there was a low ache under the whole scene. The feeling connected back to \'a quiet grief day\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'grieving',
          intensity: 4
        },
        {
          id: 'heavy',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'grief',
        awakenState: 'emotional',
        recurring: false
      }
    },
    {
      day: 5,
      date: '2026-01-26',
      promptResponse: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.\n\nWhat hurt most was how ordinary the trigger looked from the outside compared with how total it felt inside me. Day 5 made that especially clear through the shape of \'i can feel comparison working on me\'.',
      journalTitle: 'I can feel comparison working on me',
      journalTags: [
        'Ashamed',
        'Self-Doubt',
        'Identity',
        'Acceptance',
        'Overthinking',
        'Self-Reflection'
      ],
      dailyReflectionAnswers: {
        day: 5,
        date: '2026-01-26',
        values: [
          {
            statement: 'I hold my beliefs with both conviction and humility.',
            answer: 'True'
          },
          {
            statement: 'I actively honour the people who have shaped me.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'Someone has truly taken care of me recently.',
            answer: 'True'
          },
          {
            statement: 'I understand what fulfilment looks like for someone who is always seeking.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'Small talk is valuable and enjoyable to me.',
            answer: 'Not True'
          },
          {
            statement: 'I take a completely different approach when my first method isn\'t working.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I process emotions partly by finding the exact words for them.',
            answer: 'True'
          },
          {
            statement: 'I recognise complex time signatures or polyrhythms.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'ashamed',
        'self_doubt',
        'comparison',
        'self_image'
      ],
      morningNote: 'The wake-up feeling was basically \'i can feel comparison working on me\'; before coffee or conversation I could already feel shame gathering in my face.',
      morningWin: 'A quiet win today was that I could feel \'i can feel comparison working on me\' and still leave one thing unfinished without punishing myself.',
      morningChallenge: 'The hardest part of today was that \'i can feel comparison working on me\' kept turning into the urge to overexplain myself.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'overthinking',
        'self_reflection',
        'inferiority',
        'shame'
      ],
      eveningNote: 'By evening, \'i can feel comparison working on me\' still felt true; I could tell the day had settled as shame and left a trace in my face.',
      eveningWin: 'By evening, I could still protect a small pocket of quiet even though \'i can feel comparison working on me\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i can feel comparison working on me\' kept echoing as caregiving depletion I could not hide from myself.',
      sleepHours: 8.3,
      dreamText: 'I kept noticing other women in the dream and turning them into evidence against myself. The feeling connected back to \'i can feel comparison working on me\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'ashamed',
          intensity: 5
        },
        {
          id: 'small',
          intensity: 4
        },
        {
          id: 'envious',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'comparison',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 6,
      date: '2026-01-27',
      promptResponse: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.\n\nI can tell this is one of the patterns I most want to heal because it still reaches me before I have language. Day 6 made that especially clear through the shape of \'missing naomi in small moments\'.',
      journalTitle: 'Missing Naomi in small moments',
      journalTags: [
        'Sad',
        'Attachment',
        'Loss',
        'Parenting',
        'Caregiving',
        'Memory'
      ],
      dailyReflectionAnswers: {
        day: 6,
        date: '2026-01-27',
        values: [
          {
            statement: 'I have made courageous choices this year.',
            answer: 'True'
          },
          {
            statement: 'I model the values I want to see in the world.',
            answer: 'True'
          },
          {
            statement: 'I am intentional about what deserves my emotional energy.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'Traits I dislike in others often reflect something unresolved in me.',
            answer: 'True'
          },
          {
            statement: 'A spiritual or philosophical question keeps calling me back.',
            answer: 'True'
          },
          {
            statement: 'I balance emotional generosity with meeting my own needs.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I balance logic and emotion effectively when making choices.',
            answer: 'True'
          },
          {
            statement: 'I seek disconfirming evidence for my beliefs, not just confirming evidence.',
            answer: 'True'
          },
          {
            statement: 'Breaking a familiar pattern has significantly shaped my thinking.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I remember faces far better than names.',
            answer: 'True'
          },
          {
            statement: 'I process stress through my body — tension, restlessness, movement.',
            answer: 'True'
          },
          {
            statement: 'I feel physical sensations when listening to certain music.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'sad',
        'attachment',
        'Naomi',
        'grief'
      ],
      morningNote: 'Woke up carrying the feeling of \'missing naomi in small moments\' before anything else happened; my body was already leaning toward longing.',
      morningWin: 'What I did right, despite \'missing naomi in small moments\', was notice my body before it was screaming.',
      morningChallenge: 'My biggest challenge was how \'missing naomi in small moments\' opened the door to the sense that I was too much and not enough at once.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'caregiving',
        'memory',
        'loss',
        'longing'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'missing naomi in small moments\'; even while winding down I could feel longing sitting in my throat.',
      eveningWin: 'By evening, I could still name the actual feeling instead of only the secondary one even though \'missing naomi in small moments\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'missing naomi in small moments\' kept echoing as grief that changed the temperature of everything.',
      sleepHours: 5.5,
      dreamText: 'The dream let me have Naomi back for a minute and then reminded me that love does not undo loss. The feeling connected back to \'missing naomi in small moments\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'longing',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'naomi',
        awakenState: 'emotional',
        recurring: true
      }
    },
    {
      day: 7,
      date: '2026-01-28',
      promptResponse: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.\n\nEven in the hardest part of it, I could feel how much I want connection without having to abandon myself to keep it. Day 7 made that especially clear through the shape of \'everything feels heavier when i am tired\'.',
      journalTitle: 'Everything feels heavier when I am tired',
      journalTags: [
        'Heavy',
        'Exhausted',
        'Low Energy',
        'Body Heaviness',
        'Mental Load',
        'Sleep'
      ],
      dailyReflectionAnswers: {
        day: 7,
        date: '2026-01-28',
        values: [
          {
            statement: 'I grow through discomfort rather than in spite of it.',
            answer: 'True'
          },
          {
            statement: 'The decisions I make are truly my own.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I can distinguish between genuine seeking and emotional avoidance.',
            answer: 'True'
          },
          {
            statement: 'I balance my need for disruption with others\' need for stability.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I extract useful learning from risks that didn\'t pay off.',
            answer: 'True'
          },
          {
            statement: 'Fatigue changes what I focus on in noticeable ways.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am drawn to liminal spaces — thresholds, transitions, edges.',
            answer: 'True'
          },
          {
            statement: 'I notice rhythms and patterns in everyday sounds.',
            answer: 'True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'heavy',
        'exhausted',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The first thing I noticed this morning was how \'everything feels heavier when i am tired\' was still living in me; it landed as dissociation in my hips.',
      morningWin: 'Even with \'everything feels heavier when i am tired\' hanging over me, I still managed to come back to the moment instead of spiraling all the way out.',
      morningChallenge: 'What stayed difficult all day was that \'everything feels heavier when i am tired\' kept feeding comparison that turned mean quickly.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'mental_load',
        'sleep',
        'triggered',
        'awareness'
      ],
      eveningNote: 'I ended the day realizing \'everything feels heavier when i am tired\' had shaped more of it than I wanted; the residue was dissociation in my hips.',
      eveningWin: 'By evening, I could still stop performing for a few minutes and just be there even though \'everything feels heavier when i am tired\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'everything feels heavier when i am tired\' kept echoing as the fear that I was being judged.',
      sleepHours: 6.2,
      dreamText: 'My body reacted first in the dream and the meaning arrived later, which made the whole thing feel older than the actual scene. The feeling connected back to \'everything feels heavier when i am tired\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 8,
      date: '2026-01-29',
      promptResponse: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.\n\nThere was also a quiet strength in being honest about it instead of pretending I was less affected than I really was. Day 8 made that especially clear through the shape of \'wanting to be noticed without asking\'.',
      journalTitle: 'Wanting to be noticed without asking',
      journalTags: [
        'Lonely',
        'Attachment',
        'Support',
        'Closeness',
        'Vulnerable',
        'Connection'
      ],
      dailyReflectionAnswers: {
        day: 8,
        date: '2026-01-29',
        values: [
          {
            statement: 'My relationship with my body has become more compassionate over time.',
            answer: 'True'
          },
          {
            statement: 'I interpret my own life story generously and kindly.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I don\'t always know what to do when my strength isn\'t enough.',
            answer: 'True'
          },
          {
            statement: 'I need time to recalibrate after performing a role for too long.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I connect insights across different areas of my life.',
            answer: 'True'
          },
          {
            statement: 'My confidence in a decision grows after I commit to it.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am very aware of my body in space.',
            answer: 'True'
          },
          {
            statement: 'I find joy in proofs, derivations, or formal logic.',
            answer: 'True'
          }
        ]
      },
      morningMood: 5,
      morningEnergy: 'medium',
      morningStress: 'medium',
      morningTags: [
        'lonely',
        'attachment',
        'overthinking',
        'sensitivity'
      ],
      morningNote: 'This morning had the mood of \'wanting to be noticed without asking\'—I was scanning early and trying not to let longing run the day.',
      morningWin: 'A quiet win today was that I could feel \'wanting to be noticed without asking\' and still protect a small pocket of quiet.',
      morningChallenge: 'The hardest part of today was that \'wanting to be noticed without asking\' kept turning into the feeling of being outside the room even while in it.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'vulnerable',
        'connection',
        'processing',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'wanting to be noticed without asking\', and my body held it as longing around my throat.',
      eveningWin: 'By evening, I could still speak more honestly than I usually do even though \'wanting to be noticed without asking\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'wanting to be noticed without asking\' kept echoing as an old attachment ache.',
      sleepHours: 6.9,
      dreamText: 'I woke up from a dream where every small thing took more effort than it should have. The feeling connected back to \'wanting to be noticed without asking\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'anxious',
          intensity: 4
        },
        {
          id: 'tired',
          intensity: 4
        },
        {
          id: 'exposed',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'default',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 9,
      date: '2026-01-30',
      promptResponse: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.\n\nI keep noticing how often loneliness hides underneath what first looks like irritability, awkwardness, or overthinking. Day 9 made that especially clear through the shape of \'i am more sensitive than i look\'.',
      journalTitle: 'I am more sensitive than I look',
      journalTags: [
        'Sensitive',
        'Guarded',
        'Self-Doubt',
        'Awareness',
        'Processing',
        'Safety'
      ],
      dailyReflectionAnswers: {
        day: 9,
        date: '2026-01-30',
        values: [
          {
            statement: 'Childhood experiences shaped my need for safety.',
            answer: 'Very True'
          },
          {
            statement: 'There are things that matter deeply to me that I rarely talk about.',
            answer: 'Very True'
          },
          {
            statement: 'I am comfortable showing all of my emotions publicly.',
            answer: 'Not True'
          }
        ],
        archetypes: [
          {
            statement: 'I wear a different mask at work than I do at home.',
            answer: 'True'
          },
          {
            statement: 'I celebrate others without diminishing myself.',
            answer: 'True'
          },
          {
            statement: 'I am looking toward a specific horizon in my life right now.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I make sense of situations that don\'t fit any known pattern.',
            answer: 'True'
          },
          {
            statement: 'I know when a problem is solved "enough" and move on.',
            answer: 'True'
          },
          {
            statement: 'My emotions enhance rather than cloud the clarity of my thinking.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I have a strong sense of direction and rarely get lost.',
            answer: 'True'
          },
          {
            statement: 'I can easily rotate objects in my mind.',
            answer: 'True'
          },
          {
            statement: 'I am energised by meaningful conversations.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'sensitive',
        'guarded',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'I started the day with \'i am more sensitive than i look\' sitting close to the surface, which made my face feel charged with anxiety.',
      morningWin: 'What I did right, despite \'i am more sensitive than i look\', was name the actual feeling instead of only the secondary one.',
      morningChallenge: 'My biggest challenge was how \'i am more sensitive than i look\' opened the door to caregiving depletion I could not hide from myself.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'high',
      eveningTags: [
        'processing',
        'safety',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'The evening version of today was \'i am more sensitive than i look\'; underneath everything else I was still carrying anxiety in my face.',
      eveningWin: 'By evening, I could still stay softer with myself in one key moment even though \'i am more sensitive than i look\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i am more sensitive than i look\' kept echoing as self-consciousness that made everything feel louder.',
      sleepHours: 7.6,
      dreamText: 'I kept entering conversations a beat too late in the dream and reading that as proof I did not belong. The feeling connected back to \'i am more sensitive than i look\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 5
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 10,
      date: '2026-01-31',
      promptResponse: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.\n\nWhat I wish for most is to feel at home in myself before I have to prove anything to anyone else. Day 10 made that especially clear through the shape of \'my body knew before my mind did\'.',
      journalTitle: 'My body knew before my mind did',
      journalTags: [
        'Triggered',
        'Anxious',
        'Body Heaviness',
        'Awareness',
        'Processing',
        'Survival'
      ],
      dailyReflectionAnswers: {
        day: 10,
        date: '2026-01-31',
        values: [
          {
            statement: 'I am holding onto obligations I need to release.',
            answer: 'True'
          },
          {
            statement: 'I express the qualities I admire in others rather than suppressing them in myself.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'My shadow side intensifies when I\'m under stress.',
            answer: 'True'
          },
          {
            statement: 'There is something I consistently lie to myself about.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I assess risk effectively even with incomplete information.',
            answer: 'True'
          },
          {
            statement: 'I retain information over the long term reliably.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I prefer verbal instructions over visual diagrams.',
            answer: 'Not True'
          },
          {
            statement: 'I believe that the most important truths cannot be put into words.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'triggered',
        'anxious',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The wake-up feeling was basically \'my body knew before my mind did\'; before coffee or conversation I could already feel flooding gathering in my head.',
      morningWin: 'Even with \'my body knew before my mind did\' hanging over me, I still managed to stop performing for a few minutes and just be there.',
      morningChallenge: 'What stayed difficult all day was that \'my body knew before my mind did\' kept feeding grief that changed the temperature of everything.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'survival',
        'triggered',
        'awareness'
      ],
      eveningNote: 'By evening, \'my body knew before my mind did\' still felt true; I could tell the day had settled as flooding and left a trace in my head.',
      eveningWin: 'By evening, I could still pause before assuming the worst even though \'my body knew before my mind did\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'my body knew before my mind did\' kept echoing as a body memory that got ahead of language.',
      sleepHours: 8.3,
      dreamText: 'My body reacted first in the dream and the meaning arrived later, which made the whole thing feel older than the actual scene. The feeling connected back to \'my body knew before my mind did\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 4
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 11,
      date: '2026-02-01',
      promptResponse: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.\n\nWhat felt truest tonight was how quickly my body turned the whole day into a referendum on whether I am too much or not enough. Day 11 made that especially clear through the shape of \'wishing i were easier to be\'.',
      journalTitle: 'Wishing I were easier to be',
      journalTags: [
        'Sad',
        'Self-Doubt',
        'Identity',
        'Hope',
        'Self-Reflection',
        'Healing'
      ],
      dailyReflectionAnswers: {
        day: 11,
        date: '2026-02-01',
        values: [
          {
            statement: 'There is at least one thing I absolutely refuse to compromise on.',
            answer: 'True'
          },
          {
            statement: 'My responsibilities to family feel aligned with my deeper values.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'The archetype I admire most reveals something important about me.',
            answer: 'True'
          },
          {
            statement: 'I hold complexity without collapsing into confusion.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I remain open to outcomes I didn\'t plan for.',
            answer: 'True'
          },
          {
            statement: 'I make room for unexpected ideas in an otherwise structured day.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I prefer watching a demonstration over reading instructions.',
            answer: 'True'
          },
          {
            statement: 'I can read maps effortlessly.',
            answer: 'Not True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'sad',
        'self_doubt',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'Woke up carrying the feeling of \'wishing i were easier to be\' before anything else happened; my body was already leaning toward dissociation.',
      morningWin: 'A quiet win today was that I could feel \'wishing i were easier to be\' and still speak more honestly than I usually do.',
      morningChallenge: 'The hardest part of today was that \'wishing i were easier to be\' kept turning into the fear that I was being judged.',
      eveningMood: 2,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'self_reflection',
        'healing',
        'triggered',
        'awareness'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'wishing i were easier to be\'; even while winding down I could feel dissociation sitting in my hips.',
      eveningWin: 'By evening, I could still let Lucas have the version of me that was present instead of perfect even though \'wishing i were easier to be\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'wishing i were easier to be\' kept echoing as the urge to overexplain myself.',
      sleepHours: 5.5,
      dreamText: 'The dream kept changing before I could orient to it, and my body stayed alarmed even when the details shifted. The feeling connected back to \'wishing i were easier to be\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 12,
      date: '2026-02-02',
      promptResponse: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.\n\nUnder the surface, I could feel the younger part of me still hoping someone would notice without my having to ask for that much care directly. Day 12 made that especially clear through the shape of \'the loneliness under competence\'.',
      journalTitle: 'The loneliness under competence',
      journalTags: [
        'Lonely',
        'Heavy',
        'Caregiving',
        'Mental Load',
        'Self-Reflection',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 12,
        date: '2026-02-02',
        values: [
          {
            statement: 'I know exactly what quality I value most in a close relationship.',
            answer: 'True'
          },
          {
            statement: 'The work I do feels like play to me.',
            answer: 'True'
          },
          {
            statement: 'I feel secure enough to let myself be vulnerable.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'Physical changes in my life mirror my internal transformation.',
            answer: 'True'
          },
          {
            statement: 'I listen most to the inner voice that actually serves me best.',
            answer: 'True'
          },
          {
            statement: 'I am actively searching for something meaningful in my life.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I communicate complex ideas clearly, even when others don\'t immediately understand.',
            answer: 'True'
          },
          {
            statement: 'Deep conversations energise my thinking.',
            answer: 'True'
          },
          {
            statement: 'I gather sufficient information before committing to a choice.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I question assumptions before accepting them.',
            answer: 'True'
          },
          {
            statement: 'I need regular solitude to recharge.',
            answer: 'Very True'
          },
          {
            statement: 'I naturally recognize patterns in music, like genre or era.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'lonely',
        'heavy',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'The first thing I noticed this morning was how \'the loneliness under competence\' was still living in me; it landed as loneliness in my shoulders.',
      morningWin: 'What I did right, despite \'the loneliness under competence\', was stay softer with myself in one key moment.',
      morningChallenge: 'My biggest challenge was how \'the loneliness under competence\' opened the door to an old attachment ache.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'self_reflection',
        'home',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'I ended the day realizing \'the loneliness under competence\' had shaped more of it than I wanted; the residue was loneliness in my shoulders.',
      eveningWin: 'By evening, I could still leave one thing unfinished without punishing myself even though \'the loneliness under competence\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'the loneliness under competence\' kept echoing as the sense that I was too much and not enough at once.',
      sleepHours: 6.2,
      dreamText: 'I kept entering conversations a beat too late in the dream and reading that as proof I did not belong. The feeling connected back to \'the loneliness under competence\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 4
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 13,
      date: '2026-02-03',
      promptResponse: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.\n\nThe thread underneath all of it was how hard it can be to stay on my own side when shame or comparison get activated. Day 13 made that especially clear through the shape of \'i needed more softness today\'.',
      journalTitle: 'I needed more softness today',
      journalTags: [
        'Overwhelmed',
        'Vulnerable',
        'Healing',
        'Rest',
        'Recovery',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 13,
        date: '2026-02-03',
        values: [
          {
            statement: 'I choose myself when it\'s the right thing to do.',
            answer: 'True'
          },
          {
            statement: 'Ageing is teaching me valuable things about what truly matters.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I naturally step in when someone needs help or rescuing.',
            answer: 'True'
          },
          {
            statement: 'I needed a hero in my life that I never had.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I make decisions from courage rather than fear.',
            answer: 'True'
          },
          {
            statement: 'I use metaphors effectively to understand my own life.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I feel at home in my body most of the time.',
            answer: 'Not True'
          },
          {
            statement: 'I narrate experiences vividly when telling stories.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'overwhelmed',
        'vulnerable',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'This morning had the mood of \'i needed more softness today\'—I was scanning early and trying not to let embarrassment run the day.',
      morningWin: 'Even with \'i needed more softness today\' hanging over me, I still managed to pause before assuming the worst.',
      morningChallenge: 'What stayed difficult all day was that \'i needed more softness today\' kept feeding self-consciousness that made everything feel louder.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'recovery',
        'home',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'i needed more softness today\', and my body held it as embarrassment around my throat.',
      eveningWin: 'By evening, I could still notice my body before it was screaming even though \'i needed more softness today\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i needed more softness today\' kept echoing as comparison that turned mean quickly.',
      sleepHours: 6.9,
      dreamText: 'I kept missing one crucial sentence and the whole room moved on without me, so I spent the rest of the dream pretending I understood. The feeling connected back to \'i needed more softness today\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 5
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 14,
      date: '2026-02-04',
      promptResponse: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.\n\nMore than anything, I needed gentleness that did not have to be earned first. Day 14 made that especially clear through the shape of \'it is hard not to read things as rejection\'.',
      journalTitle: 'It is hard not to read things as rejection',
      journalTags: [
        'Anxious',
        'Hurt',
        'Rejection',
        'Overthinking',
        'Rumination',
        'Emotional Pattern'
      ],
      dailyReflectionAnswers: {
        day: 14,
        date: '2026-02-04',
        values: [
          {
            statement: 'I can sense when my boundaries are being tested.',
            answer: 'True'
          },
          {
            statement: 'I have discovered truths late in life that I\'m genuinely grateful for.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'There is a gift hidden inside my greatest flaw.',
            answer: 'True'
          },
          {
            statement: 'I have been overthinking something that actually needs feeling instead.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I work on one task at a time rather than multitasking.',
            answer: 'True'
          },
          {
            statement: 'I address even the types of decisions I tend to avoid.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I feel spiritually connected to the natural world.',
            answer: 'True'
          },
          {
            statement: 'I enjoy debugging or troubleshooting problems.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'anxious',
        'hurt',
        'grief',
        'tenderness'
      ],
      morningNote: 'I started the day with \'it is hard not to read things as rejection\' sitting close to the surface, which made my solar_plexus feel charged with grief.',
      morningWin: 'A quiet win today was that I could feel \'it is hard not to read things as rejection\' and still let Lucas have the version of me that was present instead of perfect.',
      morningChallenge: 'The hardest part of today was that \'it is hard not to read things as rejection\' kept turning into a body memory that got ahead of language.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'rumination',
        'emotional_pattern',
        'loss',
        'ache'
      ],
      eveningNote: 'The evening version of today was \'it is hard not to read things as rejection\'; underneath everything else I was still carrying grief in my solar_plexus.',
      eveningWin: 'By evening, I could still come back to the moment instead of spiraling all the way out even though \'it is hard not to read things as rejection\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'it is hard not to read things as rejection\' kept echoing as the feeling of being outside the room even while in it.',
      sleepHours: 7.6,
      dreamText: 'Loss in the dream was less about one event and more about how nothing fully brightened. The feeling connected back to \'it is hard not to read things as rejection\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'grieving',
          intensity: 4
        },
        {
          id: 'heavy',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'grief',
        awakenState: 'emotional',
        recurring: false
      }
    },
    {
      day: 15,
      date: '2026-02-05',
      promptResponse: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.\n\nWhat hurt most was how ordinary the trigger looked from the outside compared with how total it felt inside me. Day 15 made that especially clear through the shape of \'i kept overexplaining and hated it\'.',
      journalTitle: 'I kept overexplaining and hated it',
      journalTags: [
        'Ashamed',
        'Anxious',
        'Misunderstood',
        'Processing',
        'Mental Load',
        'Self-Doubt'
      ],
      dailyReflectionAnswers: {
        day: 15,
        date: '2026-02-05',
        values: [
          {
            statement: 'I lift others without needing recognition for doing so.',
            answer: 'True'
          },
          {
            statement: 'I reconcile compassion with accountability in a balanced way.',
            answer: 'True'
          },
          {
            statement: 'I stay motivated even when progress feels invisible.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'Radical self-honesty is something I could practise more of.',
            answer: 'True'
          },
          {
            statement: 'I hold onto myself during major life transitions.',
            answer: 'True'
          },
          {
            statement: 'I am sitting with a book, talk, or idea that is actively changing me.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I notice when a current situation rhymes with one from my past.',
            answer: 'True'
          },
          {
            statement: 'I handle misunderstandings without becoming defensive.',
            answer: 'True'
          },
          {
            statement: 'Looking back over my reflections, I can see a clear pattern in how I think and grow.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I understand unspoken social rules instinctively.',
            answer: 'True'
          },
          {
            statement: 'I pick up new physical skills quickly.',
            answer: 'True'
          },
          {
            statement: 'I am drawn to introspection in all its forms.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'ashamed',
        'anxious',
        'comparison',
        'self_image'
      ],
      morningNote: 'The wake-up feeling was basically \'i kept overexplaining and hated it\'; before coffee or conversation I could already feel smallness gathering in my face.',
      morningWin: 'What I did right, despite \'i kept overexplaining and hated it\', was leave one thing unfinished without punishing myself.',
      morningChallenge: 'My biggest challenge was how \'i kept overexplaining and hated it\' opened the door to the urge to overexplain myself.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'mental_load',
        'self_doubt',
        'inferiority',
        'shame'
      ],
      eveningNote: 'By evening, \'i kept overexplaining and hated it\' still felt true; I could tell the day had settled as smallness and left a trace in my face.',
      eveningWin: 'By evening, I could still protect a small pocket of quiet even though \'i kept overexplaining and hated it\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i kept overexplaining and hated it\' kept echoing as caregiving depletion I could not hide from myself.',
      sleepHours: 8.3,
      dreamText: 'The dream made comparison feel instantaneous, like I lost myself before I even had a thought about it. The feeling connected back to \'i kept overexplaining and hated it\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'ashamed',
          intensity: 5
        },
        {
          id: 'small',
          intensity: 4
        },
        {
          id: 'envious',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'comparison',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 16,
      date: '2026-02-06',
      promptResponse: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.\n\nI can tell this is one of the patterns I most want to heal because it still reaches me before I have language. Day 16 made that especially clear through the shape of \'lucas deserved a less depleted version of me\'.',
      journalTitle: 'Lucas deserved a less depleted version of me',
      journalTags: [
        'Exhausted',
        'Parenting',
        'Caregiving',
        'Low Energy',
        'Tired',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 16,
        date: '2026-02-06',
        values: [
          {
            statement: 'I stay compassionate without losing myself in the process.',
            answer: 'True'
          },
          {
            statement: 'Social interaction drains me more than most people realise.',
            answer: 'Very True'
          }
        ],
        archetypes: [
          {
            statement: 'I have faced something deeply difficult this year.',
            answer: 'True'
          },
          {
            statement: 'I stay curious even when I feel like an expert in something.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I navigate situations where intuition and logic point in different directions.',
            answer: 'True'
          },
          {
            statement: 'I keep my mind sharp and engaged through deliberate practice.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am sensitive to the aesthetic quality of everyday spaces.',
            answer: 'True'
          },
          {
            statement: 'I notice the rhythm of speech and find some voices musical.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'low',
      morningTags: [
        'exhausted',
        'parenting',
        'Lucas',
        'motherhood'
      ],
      morningNote: 'Woke up carrying the feeling of \'lucas deserved a less depleted version of me\' before anything else happened; my body was already leaning toward pressure.',
      morningWin: 'Even with \'lucas deserved a less depleted version of me\' hanging over me, I still managed to notice my body before it was screaming.',
      morningChallenge: 'What stayed difficult all day was that \'lucas deserved a less depleted version of me\' kept feeding the sense that I was too much and not enough at once.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'low',
      eveningTags: [
        'tired',
        'home',
        'depletion',
        'devotion'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'lucas deserved a less depleted version of me\'; even while winding down I could feel pressure sitting in my arms.',
      eveningWin: 'By evening, I could still name the actual feeling instead of only the secondary one even though \'lucas deserved a less depleted version of me\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'lucas deserved a less depleted version of me\' kept echoing as grief that changed the temperature of everything.',
      sleepHours: 5.5,
      dreamText: 'I was moving through the dream with Lucas in my arms, protecting him while everything around us felt unstable. The feeling connected back to \'lucas deserved a less depleted version of me\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'protective',
          intensity: 4
        },
        {
          id: 'anxious',
          intensity: 4
        },
        {
          id: 'devoted',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'lucas',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 17,
      date: '2026-02-07',
      promptResponse: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.\n\nEven in the hardest part of it, I could feel how much I want connection without having to abandon myself to keep it. Day 17 made that especially clear through the shape of \'i miss being met quickly\'.',
      journalTitle: 'I miss being met quickly',
      journalTags: [
        'Lonely',
        'Hurt',
        'Attachment',
        'Distance',
        'Repair',
        'Connection'
      ],
      dailyReflectionAnswers: {
        day: 17,
        date: '2026-02-07',
        values: [
          {
            statement: 'I value honesty over harmony in my close relationships.',
            answer: 'True'
          },
          {
            statement: 'Certain relationship dynamics trigger me more than I\'d like.',
            answer: 'Very True'
          }
        ],
        archetypes: [
          {
            statement: 'My need for control reveals my deepest fear.',
            answer: 'True'
          },
          {
            statement: 'I have had to accept something very difficult about myself.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I am comfortable working with numbers and quantitative data.',
            answer: 'Not True'
          },
          {
            statement: 'I interrupt unhelpful thought patterns before they take over.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I notice when sound design is used intentionally in films or media.',
            answer: 'True'
          },
          {
            statement: 'I use visualisation as a planning or problem-solving tool.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'lonely',
        'hurt',
        'grief',
        'tenderness'
      ],
      morningNote: 'The first thing I noticed this morning was how \'i miss being met quickly\' was still living in me; it landed as sadness in my chest.',
      morningWin: 'A quiet win today was that I could feel \'i miss being met quickly\' and still come back to the moment instead of spiraling all the way out.',
      morningChallenge: 'The hardest part of today was that \'i miss being met quickly\' kept turning into comparison that turned mean quickly.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'repair',
        'connection',
        'loss',
        'ache'
      ],
      eveningNote: 'I ended the day realizing \'i miss being met quickly\' had shaped more of it than I wanted; the residue was sadness in my chest.',
      eveningWin: 'By evening, I could still stop performing for a few minutes and just be there even though \'i miss being met quickly\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i miss being met quickly\' kept echoing as the fear that I was being judged.',
      sleepHours: 6.2,
      dreamText: 'Loss in the dream was less about one event and more about how nothing fully brightened. The feeling connected back to \'i miss being met quickly\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'grieving',
          intensity: 5
        },
        {
          id: 'heavy',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'grief',
        awakenState: 'emotional',
        recurring: false
      }
    },
    {
      day: 18,
      date: '2026-02-08',
      promptResponse: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.\n\nThere was also a quiet strength in being honest about it instead of pretending I was less affected than I really was. Day 18 made that especially clear through the shape of \'old family pain in a new moment\'.',
      journalTitle: 'Old family pain in a new moment',
      journalTags: [
        'Sad',
        'Family',
        'Memory',
        'Hurt',
        'Processing',
        'Inner Child'
      ],
      dailyReflectionAnswers: {
        day: 18,
        date: '2026-02-08',
        values: [
          {
            statement: 'I am giving my truest self what it needs right now.',
            answer: 'True'
          },
          {
            statement: 'I have a healthy process for navigating grief and loss.',
            answer: 'True'
          },
          {
            statement: 'I can hold space for people whose values differ from mine.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I adapt socially without feeling fake.',
            answer: 'True'
          },
          {
            statement: 'My identity would shift dramatically if I stopped taking care of everyone.',
            answer: 'True'
          },
          {
            statement: 'Going against the grain has often been the right choice for me.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I rely on a mental model to understand human behaviour.',
            answer: 'True'
          },
          {
            statement: 'I approach problems from the top down, starting with the big picture.',
            answer: 'True'
          },
          {
            statement: 'I take feedback about how I think and communicate seriously.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I approach problems in a systematic, step-by-step way.',
            answer: 'True'
          },
          {
            statement: 'Language feels like my most natural creative medium.',
            answer: 'True'
          },
          {
            statement: 'I can reverse-engineer how something was made.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'sad',
        'family',
        'history',
        'belonging'
      ],
      morningNote: 'This morning had the mood of \'old family pain in a new moment\'—I was scanning early and trying not to let exclusion run the day.',
      morningWin: 'What I did right, despite \'old family pain in a new moment\', was protect a small pocket of quiet.',
      morningChallenge: 'My biggest challenge was how \'old family pain in a new moment\' opened the door to the feeling of being outside the room even while in it.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'inner_child',
        'old_pain',
        'exclusion'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'old family pain in a new moment\', and my body held it as exclusion around my face.',
      eveningWin: 'By evening, I could still speak more honestly than I usually do even though \'old family pain in a new moment\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'old family pain in a new moment\' kept echoing as an old attachment ache.',
      sleepHours: 6.9,
      dreamText: 'The dream used siblings and rooms and old house feelings to remind me how belonging can still feel conditional. The feeling connected back to \'old family pain in a new moment\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'excluded',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'small',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'family',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 19,
      date: '2026-02-09',
      promptResponse: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.\n\nI keep noticing how often loneliness hides underneath what first looks like irritability, awkwardness, or overthinking. Day 19 made that especially clear through the shape of \'today my hearing made me feel separate\'.',
      journalTitle: 'Today my hearing made me feel separate',
      journalTags: [
        'Frustrated',
        'Misunderstood',
        'Disconnected',
        'Sensory Overload',
        'Mental Load',
        'Awareness'
      ],
      dailyReflectionAnswers: {
        day: 19,
        date: '2026-02-09',
        values: [
          {
            statement: 'I am actively developing a skill or quality that matters to me.',
            answer: 'True'
          },
          {
            statement: 'Community is a meaningful part of my life.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I keep repeating a pattern even though I know better.',
            answer: 'True'
          },
          {
            statement: 'I would rather be a quiet hero than a visible one.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I reset my thinking effectively when I\'m going in circles.',
            answer: 'True'
          },
          {
            statement: 'I prefer consuming information alone rather than discussing it.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I enjoy creating visual art — painting, collage, digital design.',
            answer: 'True'
          },
          {
            statement: 'I can picture how furniture will look in a room before moving it.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'frustrated',
        'misunderstood',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'I started the day with \'today my hearing made me feel separate\' sitting close to the surface, which made my throat feel charged with shame.',
      morningWin: 'Even with \'today my hearing made me feel separate\' hanging over me, I still managed to name the actual feeling instead of only the secondary one.',
      morningChallenge: 'What stayed difficult all day was that \'today my hearing made me feel separate\' kept feeding caregiving depletion I could not hide from myself.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'mental_load',
        'awareness',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'The evening version of today was \'today my hearing made me feel separate\'; underneath everything else I was still carrying shame in my throat.',
      eveningWin: 'By evening, I could still stay softer with myself in one key moment even though \'today my hearing made me feel separate\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'today my hearing made me feel separate\' kept echoing as self-consciousness that made everything feel louder.',
      sleepHours: 7.6,
      dreamText: 'I kept missing one crucial sentence and the whole room moved on without me, so I spent the rest of the dream pretending I understood. The feeling connected back to \'today my hearing made me feel separate\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 5
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 20,
      date: '2026-02-10',
      promptResponse: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.\n\nWhat I wish for most is to feel at home in myself before I have to prove anything to anyone else. Day 20 made that especially clear through the shape of \'wanting to be chosen without performing\'.',
      journalTitle: 'Wanting to be chosen without performing',
      journalTags: [
        'Lonely',
        'Attachment',
        'Closeness',
        'Distance',
        'Overthinking',
        'Love'
      ],
      dailyReflectionAnswers: {
        day: 20,
        date: '2026-02-10',
        values: [
          {
            statement: 'Unexpected things energise me in surprising ways.',
            answer: 'True'
          },
          {
            statement: 'I wear a mask more often than I would like.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I use my influence ethically and intentionally.',
            answer: 'True'
          },
          {
            statement: 'I continue caring for others even when I\'m drained.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'Certain types of questions make me think more deeply than others.',
            answer: 'True'
          },
          {
            statement: 'I evaluate whether an idea is worth deeply pursuing before investing heavily.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I have experienced moments of deep connection to the cosmos.',
            answer: 'True'
          },
          {
            statement: 'I use empathy as my primary way of understanding others.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'lonely',
        'attachment',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The wake-up feeling was basically \'wanting to be chosen without performing\'; before coffee or conversation I could already feel alarm gathering in my head.',
      morningWin: 'A quiet win today was that I could feel \'wanting to be chosen without performing\' and still stop performing for a few minutes and just be there.',
      morningChallenge: 'The hardest part of today was that \'wanting to be chosen without performing\' kept turning into grief that changed the temperature of everything.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'overthinking',
        'love',
        'triggered',
        'awareness'
      ],
      eveningNote: 'By evening, \'wanting to be chosen without performing\' still felt true; I could tell the day had settled as alarm and left a trace in my head.',
      eveningWin: 'By evening, I could still pause before assuming the worst even though \'wanting to be chosen without performing\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'wanting to be chosen without performing\' kept echoing as a body memory that got ahead of language.',
      sleepHours: 8.3,
      dreamText: 'The dream kept changing before I could orient to it, and my body stayed alarmed even when the details shifted. The feeling connected back to \'wanting to be chosen without performing\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 4
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 21,
      date: '2026-02-11',
      promptResponse: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.\n\nWhat felt truest tonight was how quickly my body turned the whole day into a referendum on whether I am too much or not enough. Day 21 made that especially clear through the shape of \'i do not think people realize how much i carry\'.',
      journalTitle: 'I do not think people realize how much I carry',
      journalTags: [
        'Anxious',
        'Sensitive',
        'Self-Doubt',
        'Rejection',
        'Overthinking',
        'Processing'
      ],
      dailyReflectionAnswers: {
        day: 21,
        date: '2026-02-11',
        values: [
          {
            statement: 'Community and belonging give my life a dimension that solitude cannot.',
            answer: 'True'
          },
          {
            statement: 'I value freedom more than stability in this season of my life.',
            answer: 'True'
          },
          {
            statement: 'My greatest strengths have emerged from my hardest experiences.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I know how to reclaim my power after someone has taken it.',
            answer: 'True'
          },
          {
            statement: 'There is a role in life I play more naturally than any other.',
            answer: 'True'
          },
          {
            statement: 'I balance being a voice of reason with being emotionally present.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I apply lessons I wish I had been taught earlier in life.',
            answer: 'True'
          },
          {
            statement: 'Learning a difficult skill teaches me as much about myself as about the skill.',
            answer: 'True'
          },
          {
            statement: 'I perform best in structured conversation formats.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I contemplate the nature of consciousness and awareness.',
            answer: 'True'
          },
          {
            statement: 'I am fascinated by the overlap between science and spirituality.',
            answer: 'True'
          },
          {
            statement: 'I pick up on micro-expressions and body language.',
            answer: 'True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'anxious',
        'sensitive',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'Woke up carrying the feeling of \'i do not think people realize how much i carry\' before anything else happened; my body was already leaning toward fear.',
      morningWin: 'What I did right, despite \'i do not think people realize how much i carry\', was speak more honestly than I usually do.',
      morningChallenge: 'My biggest challenge was how \'i do not think people realize how much i carry\' opened the door to the fear that I was being judged.',
      eveningMood: 2,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'overthinking',
        'processing',
        'triggered',
        'awareness'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'i do not think people realize how much i carry\'; even while winding down I could feel fear sitting in my hips.',
      eveningWin: 'By evening, I could still let Lucas have the version of me that was present instead of perfect even though \'i do not think people realize how much i carry\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i do not think people realize how much i carry\' kept echoing as the urge to overexplain myself.',
      sleepHours: 5.5,
      dreamText: 'It felt like a body-memory dream more than a plot dream; the sensation was the real storyline. The feeling connected back to \'i do not think people realize how much i carry\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 22,
      date: '2026-02-12',
      promptResponse: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.\n\nUnder the surface, I could feel the younger part of me still hoping someone would notice without my having to ask for that much care directly. Day 22 made that especially clear through the shape of \'trying not to spiral\'.',
      journalTitle: 'Trying not to spiral',
      journalTags: [
        'Guarded',
        'Sensitive',
        'Self-Doubt',
        'Identity',
        'Awareness',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 22,
        date: '2026-02-12',
        values: [
          {
            statement: 'I balance giving and receiving well in my relationships.',
            answer: 'True'
          },
          {
            statement: 'I regularly do something kind just for myself.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I struggle to recover after giving everything I have.',
            answer: 'True'
          },
          {
            statement: 'A role I was once forced into turned out to be one I secretly enjoy.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I calibrate my confidence in my own judgement accurately.',
            answer: 'True'
          },
          {
            statement: 'I know when to trust my analysis and when to trust my instincts.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I enjoy sequences, codes, or ciphers.',
            answer: 'True'
          },
          {
            statement: 'I am comfortable being alone with my thoughts.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'guarded',
        'sensitive',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'The first thing I noticed this morning was how \'trying not to spiral\' was still living in me; it landed as self-consciousness in my shoulders.',
      morningWin: 'Even with \'trying not to spiral\' hanging over me, I still managed to stay softer with myself in one key moment.',
      morningChallenge: 'What stayed difficult all day was that \'trying not to spiral\' kept feeding an old attachment ache.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'awareness',
        'home',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'I ended the day realizing \'trying not to spiral\' had shaped more of it than I wanted; the residue was self-consciousness in my shoulders.',
      eveningWin: 'By evening, I could still leave one thing unfinished without punishing myself even though \'trying not to spiral\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'trying not to spiral\' kept echoing as the sense that I was too much and not enough at once.',
      sleepHours: 6.2,
      dreamText: 'I was in a room full of people again, trying to look normal while feeling unmistakably outside of the ease everyone else seemed to have. The feeling connected back to \'trying not to spiral\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 4
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 23,
      date: '2026-02-13',
      promptResponse: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.\n\nThe thread underneath all of it was how hard it can be to stay on my own side when shame or comparison get activated. Day 23 made that especially clear through the shape of \'i felt small in a way i could not hide from myself\'.',
      journalTitle: 'I felt small in a way I could not hide from myself',
      journalTags: [
        'Ashamed',
        'Frustrated',
        'Misunderstood',
        'Sensory Overload',
        'Mental Load',
        'Awareness'
      ],
      dailyReflectionAnswers: {
        day: 23,
        date: '2026-02-13',
        values: [
          {
            statement: 'I follow rules by conscious choice, not just habit.',
            answer: 'True'
          },
          {
            statement: 'Imagination plays an active role in my daily life.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I have exiled a part of myself that I need to welcome back.',
            answer: 'True'
          },
          {
            statement: 'Exploration has revealed truths I could never have found by staying put.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'Sleep and rest noticeably improve my ability to solve problems.',
            answer: 'True'
          },
          {
            statement: 'I teach myself new things independently and successfully.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I trust the signals my body sends me.',
            answer: 'True'
          },
          {
            statement: 'I notice visual details others miss.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'ashamed',
        'frustrated',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'This morning had the mood of \'i felt small in a way i could not hide from myself\'—I was scanning early and trying not to let shame run the day.',
      morningWin: 'A quiet win today was that I could feel \'i felt small in a way i could not hide from myself\' and still pause before assuming the worst.',
      morningChallenge: 'The hardest part of today was that \'i felt small in a way i could not hide from myself\' kept turning into self-consciousness that made everything feel louder.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'mental_load',
        'awareness',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'i felt small in a way i could not hide from myself\', and my body held it as shame around my throat.',
      eveningWin: 'By evening, I could still notice my body before it was screaming even though \'i felt small in a way i could not hide from myself\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i felt small in a way i could not hide from myself\' kept echoing as comparison that turned mean quickly.',
      sleepHours: 6.9,
      dreamText: 'Everyone in the dream heard the joke except me, and my embarrassment kept getting louder than the actual noise. The feeling connected back to \'i felt small in a way i could not hide from myself\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 5
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 24,
      date: '2026-02-14',
      promptResponse: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.\n\nMore than anything, I needed gentleness that did not have to be earned first. Day 24 made that especially clear through the shape of \'so much of me is trying to stay acceptable\'.',
      journalTitle: 'So much of me is trying to stay acceptable',
      journalTags: [
        'Sad',
        'Grief',
        'Loss',
        'Memory',
        'Processing',
        'Inner Child'
      ],
      dailyReflectionAnswers: {
        day: 24,
        date: '2026-02-14',
        values: [
          {
            statement: 'I listen to my body before it shouts at me.',
            answer: 'True'
          },
          {
            statement: 'I create spaces where others feel they belong.',
            answer: 'True'
          },
          {
            statement: 'I can be present with someone\'s pain without needing to fix it.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'My deepest intuition has a clear sense of where my life is headed.',
            answer: 'True'
          },
          {
            statement: 'I show up differently in each of my life roles, and I\'m aware of how.',
            answer: 'True'
          },
          {
            statement: 'I understand the difference between knowledge and true wisdom.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I extract surprising lessons from mundane experiences.',
            answer: 'True'
          },
          {
            statement: 'I wish I could recover a forgotten memory that feels important.',
            answer: 'True'
          },
          {
            statement: 'I appreciate and learn from elegant solutions to complex problems.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am drawn to natural textures — wood, stone, water, soil.',
            answer: 'True'
          },
          {
            statement: 'I am comfortable with ambiguity about who I am.',
            answer: 'True'
          },
          {
            statement: 'I feel a strong connection to animals.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'sad',
        'grief',
        'tenderness',
        'memory'
      ],
      morningNote: 'I started the day with \'so much of me is trying to stay acceptable\' sitting close to the surface, which made my solar_plexus feel charged with heaviness.',
      morningWin: 'What I did right, despite \'so much of me is trying to stay acceptable\', was let Lucas have the version of me that was present instead of perfect.',
      morningChallenge: 'My biggest challenge was how \'so much of me is trying to stay acceptable\' opened the door to a body memory that got ahead of language.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'inner_child',
        'loss',
        'ache'
      ],
      eveningNote: 'The evening version of today was \'so much of me is trying to stay acceptable\'; underneath everything else I was still carrying heaviness in my solar_plexus.',
      eveningWin: 'By evening, I could still come back to the moment instead of spiraling all the way out even though \'so much of me is trying to stay acceptable\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'so much of me is trying to stay acceptable\' kept echoing as the feeling of being outside the room even while in it.',
      sleepHours: 7.6,
      dreamText: 'I woke up with the sense that grief had been the weather system underneath the dream. The feeling connected back to \'so much of me is trying to stay acceptable\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'grieving',
          intensity: 4
        },
        {
          id: 'heavy',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'grief',
        awakenState: 'emotional',
        recurring: false
      }
    },
    {
      day: 25,
      date: '2026-02-15',
      promptResponse: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.\n\nWhat hurt most was how ordinary the trigger looked from the outside compared with how total it felt inside me. Day 25 made that especially clear through the shape of \'a body-memory kind of day\'.',
      journalTitle: 'A body-memory kind of day',
      journalTags: [
        'Ashamed',
        'Self-Doubt',
        'Identity',
        'Acceptance',
        'Overthinking',
        'Self-Reflection'
      ],
      dailyReflectionAnswers: {
        day: 25,
        date: '2026-02-15',
        values: [
          {
            statement: 'I experience the sacred in ways that are personal and real to me.',
            answer: 'True'
          },
          {
            statement: 'My presence has the kind of effect on others that I want it to have.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I share power in my relationships rather than accumulating it.',
            answer: 'True'
          },
          {
            statement: 'I integrate my dark side without acting it out destructively.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'Mindfulness or meditation is an active part of my life.',
            answer: 'True'
          },
          {
            statement: 'Pressure enhances rather than hinders my ability to learn.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am drawn to questions about identity — what makes me "me."',
            answer: 'True'
          },
          {
            statement: 'I am uncomfortable with surface-level answers to deep questions.',
            answer: 'Somewhat'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'ashamed',
        'self_doubt',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The wake-up feeling was basically \'a body-memory kind of day\'; before coffee or conversation I could already feel fear gathering in my hips.',
      morningWin: 'Even with \'a body-memory kind of day\' hanging over me, I still managed to leave one thing unfinished without punishing myself.',
      morningChallenge: 'What stayed difficult all day was that \'a body-memory kind of day\' kept feeding the urge to overexplain myself.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'overthinking',
        'self_reflection',
        'triggered',
        'awareness'
      ],
      eveningNote: 'By evening, \'a body-memory kind of day\' still felt true; I could tell the day had settled as fear and left a trace in my hips.',
      eveningWin: 'By evening, I could still protect a small pocket of quiet even though \'a body-memory kind of day\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'a body-memory kind of day\' kept echoing as caregiving depletion I could not hide from myself.',
      sleepHours: 8.3,
      dreamText: 'My body reacted first in the dream and the meaning arrived later, which made the whole thing feel older than the actual scene. The feeling connected back to \'a body-memory kind of day\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 26,
      date: '2026-02-16',
      promptResponse: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.\n\nI can tell this is one of the patterns I most want to heal because it still reaches me before I have language. Day 26 made that especially clear through the shape of \'i was more flooded than i looked\'.',
      journalTitle: 'I was more flooded than I looked',
      journalTags: [
        'Sad',
        'Attachment',
        'Loss',
        'Parenting',
        'Caregiving',
        'Memory'
      ],
      dailyReflectionAnswers: {
        day: 26,
        date: '2026-02-16',
        values: [
          {
            statement: 'There are people in my life who love the real me without performance.',
            answer: 'True'
          },
          {
            statement: 'I prioritise restoration over obligation when I need to.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I remain humble even when I know I\'m right.',
            answer: 'True'
          },
          {
            statement: 'I can tell when I\'m code-switching versus losing myself.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'My most vivid memories are emotional rather than visual or factual.',
            answer: 'True'
          },
          {
            statement: 'I balance breadth and depth effectively when exploring a new topic.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I classify and categorise natural phenomena instinctively.',
            answer: 'True'
          },
          {
            statement: 'I feel connected to something larger than myself.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'sad',
        'attachment',
        'Naomi',
        'grief'
      ],
      morningNote: 'Woke up carrying the feeling of \'i was more flooded than i looked\' before anything else happened; my body was already leaning toward longing.',
      morningWin: 'A quiet win today was that I could feel \'i was more flooded than i looked\' and still notice my body before it was screaming.',
      morningChallenge: 'The hardest part of today was that \'i was more flooded than i looked\' kept turning into the sense that I was too much and not enough at once.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'caregiving',
        'memory',
        'loss',
        'longing'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'i was more flooded than i looked\'; even while winding down I could feel longing sitting in my throat.',
      eveningWin: 'By evening, I could still name the actual feeling instead of only the secondary one even though \'i was more flooded than i looked\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i was more flooded than i looked\' kept echoing as grief that changed the temperature of everything.',
      sleepHours: 5.5,
      dreamText: 'I was trying to keep Naomi close while also knowing, even in the dream, that I could not stop the leaving. The feeling connected back to \'i was more flooded than i looked\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'longing',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'naomi',
        awakenState: 'emotional',
        recurring: true
      }
    },
    {
      day: 27,
      date: '2026-02-17',
      promptResponse: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.\n\nEven in the hardest part of it, I could feel how much I want connection without having to abandon myself to keep it. Day 27 made that especially clear through the shape of \'i wish belonging felt less fragile\'.',
      journalTitle: 'I wish belonging felt less fragile',
      journalTags: [
        'Heavy',
        'Exhausted',
        'Low Energy',
        'Body Heaviness',
        'Mental Load',
        'Sleep'
      ],
      dailyReflectionAnswers: {
        day: 27,
        date: '2026-02-17',
        values: [
          {
            statement: 'My ethical understanding comes more from experience than instruction.',
            answer: 'True'
          },
          {
            statement: 'Resilience is a quality I embody, not just admire.',
            answer: 'True'
          },
          {
            statement: 'I am clear about where my responsibility ends and someone else\'s begins.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I am strong without being hard or rigid.',
            answer: 'True'
          },
          {
            statement: 'I empower others without depleting myself.',
            answer: 'True'
          },
          {
            statement: 'I let people in without feeling dangerously exposed.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'Complex, challenging problems energise me.',
            answer: 'True'
          },
          {
            statement: 'I use constraints to boost my creativity.',
            answer: 'True'
          },
          {
            statement: 'I handle situations requiring pure logic with no room for feeling.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'Rhythm and tempo affect my energy and pace throughout the day.',
            answer: 'True'
          },
          {
            statement: 'I doodle, sketch, or draw when thinking.',
            answer: 'True'
          },
          {
            statement: 'I can navigate by mental maps rather than written directions.',
            answer: 'Somewhat'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'heavy',
        'exhausted',
        'family',
        'history'
      ],
      morningNote: 'The first thing I noticed this morning was how \'i wish belonging felt less fragile\' was still living in me; it landed as grief in my stomach.',
      morningWin: 'What I did right, despite \'i wish belonging felt less fragile\', was come back to the moment instead of spiraling all the way out.',
      morningChallenge: 'My biggest challenge was how \'i wish belonging felt less fragile\' opened the door to comparison that turned mean quickly.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'mental_load',
        'sleep',
        'old_pain',
        'exclusion'
      ],
      eveningNote: 'I ended the day realizing \'i wish belonging felt less fragile\' had shaped more of it than I wanted; the residue was grief in my stomach.',
      eveningWin: 'By evening, I could still stop performing for a few minutes and just be there even though \'i wish belonging felt less fragile\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i wish belonging felt less fragile\' kept echoing as the fear that I was being judged.',
      sleepHours: 6.2,
      dreamText: 'The dream used siblings and rooms and old house feelings to remind me how belonging can still feel conditional. The feeling connected back to \'i wish belonging felt less fragile\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'excluded',
          intensity: 5
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'small',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'family',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 28,
      date: '2026-02-18',
      promptResponse: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.\n\nThere was also a quiet strength in being honest about it instead of pretending I was less affected than I really was. Day 28 made that especially clear through the shape of \'the system takes and takes\'.',
      journalTitle: 'The system takes and takes',
      journalTags: [
        'Lonely',
        'Attachment',
        'Support',
        'Closeness',
        'Vulnerable',
        'Connection'
      ],
      dailyReflectionAnswers: {
        day: 28,
        date: '2026-02-18',
        values: [
          {
            statement: 'I feel a deep sense of belonging when I am outside.',
            answer: 'True'
          },
          {
            statement: 'I nurture myself with the same care I give others.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I reinvent myself while staying true to my core.',
            answer: 'True'
          },
          {
            statement: 'I bring the lessons of my seeking back to the people I love.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I learn as much from failure as I do from success.',
            answer: 'True'
          },
          {
            statement: 'I notice trends in my mood, energy, or focus across a typical week.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I enjoy teaching, mentoring, or guiding others.',
            answer: 'True'
          },
          {
            statement: 'I think about humanity\'s place in the universe.',
            answer: 'True'
          }
        ]
      },
      morningMood: 5,
      morningEnergy: 'medium',
      morningStress: 'low',
      morningTags: [
        'lonely',
        'attachment',
        'overthinking',
        'sensitivity'
      ],
      morningNote: 'This morning had the mood of \'the system takes and takes\'—I was scanning early and trying not to let longing run the day.',
      morningWin: 'Even with \'the system takes and takes\' hanging over me, I still managed to protect a small pocket of quiet.',
      morningChallenge: 'What stayed difficult all day was that \'the system takes and takes\' kept feeding the feeling of being outside the room even while in it.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'low',
      eveningTags: [
        'vulnerable',
        'connection',
        'processing',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'the system takes and takes\', and my body held it as longing around my throat.',
      eveningWin: 'By evening, I could still speak more honestly than I usually do even though \'the system takes and takes\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'the system takes and takes\' kept echoing as an old attachment ache.',
      sleepHours: 6.9,
      dreamText: 'The dream felt emotionally expensive in the same way some real days do: nothing catastrophic, just too much without enough softness. The feeling connected back to \'the system takes and takes\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'anxious',
          intensity: 4
        },
        {
          id: 'tired',
          intensity: 4
        },
        {
          id: 'exposed',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'default',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 29,
      date: '2026-02-19',
      promptResponse: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.\n\nI keep noticing how often loneliness hides underneath what first looks like irritability, awkwardness, or overthinking. Day 29 made that especially clear through the shape of \'i felt ugly and overaware today\'.',
      journalTitle: 'I felt ugly and overaware today',
      journalTags: [
        'Sensitive',
        'Guarded',
        'Self-Doubt',
        'Awareness',
        'Processing',
        'Safety'
      ],
      dailyReflectionAnswers: {
        day: 29,
        date: '2026-02-19',
        values: [
          {
            statement: 'I am living in a way I would want my grandchildren to know about.',
            answer: 'True'
          },
          {
            statement: 'I would create freely if I didn\'t worry about the result being good.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I understand something about wisdom that most people miss.',
            answer: 'True'
          },
          {
            statement: 'My daily actions are aligned with my deeper purpose.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'Daily reflection continues to reveal surprising things about my mind.',
            answer: 'True'
          },
          {
            statement: 'Understanding my own cognitive style has been genuinely useful.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I enjoy strategy games, chess, or competitive thinking.',
            answer: 'True'
          },
          {
            statement: 'I enjoy networking and building connections.',
            answer: 'Not True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'sensitive',
        'guarded',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'I started the day with \'i felt ugly and overaware today\' sitting close to the surface, which made my face feel charged with anxiety.',
      morningWin: 'A quiet win today was that I could feel \'i felt ugly and overaware today\' and still name the actual feeling instead of only the secondary one.',
      morningChallenge: 'The hardest part of today was that \'i felt ugly and overaware today\' kept turning into caregiving depletion I could not hide from myself.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'high',
      eveningTags: [
        'processing',
        'safety',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'The evening version of today was \'i felt ugly and overaware today\'; underneath everything else I was still carrying anxiety in my face.',
      eveningWin: 'By evening, I could still stay softer with myself in one key moment even though \'i felt ugly and overaware today\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i felt ugly and overaware today\' kept echoing as self-consciousness that made everything feel louder.',
      sleepHours: 7.6,
      dreamText: 'The dream made every social moment feel like a test I had not studied for. The feeling connected back to \'i felt ugly and overaware today\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 5
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 30,
      date: '2026-02-20',
      promptResponse: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.\n\nWhat I wish for most is to feel at home in myself before I have to prove anything to anyone else. Day 30 made that especially clear through the shape of \'i am tired of needing reassurance\'.',
      journalTitle: 'I am tired of needing reassurance',
      journalTags: [
        'Triggered',
        'Anxious',
        'Body Heaviness',
        'Awareness',
        'Processing',
        'Survival'
      ],
      dailyReflectionAnswers: {
        day: 30,
        date: '2026-02-20',
        values: [
          {
            statement: 'My relationships have taught me life\'s most valuable lessons.',
            answer: 'True'
          },
          {
            statement: 'I carry invisible emotional labour that others don\'t see.',
            answer: 'Very True'
          },
          {
            statement: 'There are things about me I wish people would ask about.',
            answer: 'Very True'
          }
        ],
        archetypes: [
          {
            statement: 'I am in a chrysalis stage of deep personal transformation.',
            answer: 'True'
          },
          {
            statement: 'I am deeply attached to at least one defence mechanism.',
            answer: 'True'
          },
          {
            statement: 'There is a gap between who I am and who others need me to be.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'My relationship with risk has matured and become healthier over time.',
            answer: 'True'
          },
          {
            statement: 'Analysis paralysis prevents me from acting when I need to.',
            answer: 'True'
          },
          {
            statement: 'I see a clear relationship between what I remember and who I\'m becoming.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am fascinated by how different cultures understand death and the divine.',
            answer: 'True'
          },
          {
            statement: 'I think about free will and whether our choices are truly ours.',
            answer: 'True'
          },
          {
            statement: 'I evaluate arguments by their structure, not just their content.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'triggered',
        'anxious',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The wake-up feeling was basically \'i am tired of needing reassurance\'; before coffee or conversation I could already feel flooding gathering in my head.',
      morningWin: 'What I did right, despite \'i am tired of needing reassurance\', was stop performing for a few minutes and just be there.',
      morningChallenge: 'My biggest challenge was how \'i am tired of needing reassurance\' opened the door to grief that changed the temperature of everything.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'survival',
        'triggered',
        'awareness'
      ],
      eveningNote: 'By evening, \'i am tired of needing reassurance\' still felt true; I could tell the day had settled as flooding and left a trace in my head.',
      eveningWin: 'By evening, I could still pause before assuming the worst even though \'i am tired of needing reassurance\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i am tired of needing reassurance\' kept echoing as a body memory that got ahead of language.',
      sleepHours: 8.3,
      dreamText: 'It felt like a body-memory dream more than a plot dream; the sensation was the real storyline. The feeling connected back to \'i am tired of needing reassurance\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 4
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 31,
      date: '2026-02-21',
      promptResponse: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.\n\nWhat felt truest tonight was how quickly my body turned the whole day into a referendum on whether I am too much or not enough. Day 31 made that especially clear through the shape of \'part of me still expects to be left\'.',
      journalTitle: 'Part of me still expects to be left',
      journalTags: [
        'Sad',
        'Self-Doubt',
        'Identity',
        'Hope',
        'Self-Reflection',
        'Healing'
      ],
      dailyReflectionAnswers: {
        day: 31,
        date: '2026-02-21',
        values: [
          {
            statement: 'Time in nature restores me in a way nothing else does.',
            answer: 'True'
          },
          {
            statement: 'I am spending my time on what I would prioritise if it were limited.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I react strongly when someone sees a part of me I try to hide.',
            answer: 'True'
          },
          {
            statement: 'My core wants something that the world doesn\'t make easy.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'Writing plays an active role in how I process my thoughts.',
            answer: 'Very True'
          },
          {
            statement: 'I break large problems into smaller, manageable pieces naturally.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I use my body to express what words cannot.',
            answer: 'True'
          },
          {
            statement: 'I can trace my current mood back to its origin.',
            answer: 'True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'sad',
        'self_doubt',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'Woke up carrying the feeling of \'part of me still expects to be left\' before anything else happened; my body was already leaning toward dissociation.',
      morningWin: 'Even with \'part of me still expects to be left\' hanging over me, I still managed to speak more honestly than I usually do.',
      morningChallenge: 'What stayed difficult all day was that \'part of me still expects to be left\' kept feeding the fear that I was being judged.',
      eveningMood: 2,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'self_reflection',
        'healing',
        'triggered',
        'awareness'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'part of me still expects to be left\'; even while winding down I could feel dissociation sitting in my hips.',
      eveningWin: 'By evening, I could still let Lucas have the version of me that was present instead of perfect even though \'part of me still expects to be left\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'part of me still expects to be left\' kept echoing as the urge to overexplain myself.',
      sleepHours: 5.5,
      dreamText: 'My body reacted first in the dream and the meaning arrived later, which made the whole thing feel older than the actual scene. The feeling connected back to \'part of me still expects to be left\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 32,
      date: '2026-02-22',
      promptResponse: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.\n\nUnder the surface, I could feel the younger part of me still hoping someone would notice without my having to ask for that much care directly. Day 32 made that especially clear through the shape of \'nothing huge happened and i still felt wrecked\'.',
      journalTitle: 'Nothing huge happened and I still felt wrecked',
      journalTags: [
        'Lonely',
        'Heavy',
        'Caregiving',
        'Mental Load',
        'Self-Reflection',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 32,
        date: '2026-02-22',
        values: [
          {
            statement: 'I tend to hold onto things — possessions, people, certainty — out of fear.',
            answer: 'True'
          },
          {
            statement: 'I feel safe even when the world feels uncertain.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I find deep meaning in mundane, everyday moments.',
            answer: 'True'
          },
          {
            statement: 'I balance careful analysis with gut intuition effectively.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I protect my creative flow from the things that kill it.',
            answer: 'True'
          },
          {
            statement: 'I handle information overload without becoming overwhelmed.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I instinctively create systems and frameworks to manage my life.',
            answer: 'True'
          },
          {
            statement: 'I naturally move or sway to rhythmic sounds.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'lonely',
        'heavy',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'The first thing I noticed this morning was how \'nothing huge happened and i still felt wrecked\' was still living in me; it landed as loneliness in my shoulders.',
      morningWin: 'A quiet win today was that I could feel \'nothing huge happened and i still felt wrecked\' and still stay softer with myself in one key moment.',
      morningChallenge: 'The hardest part of today was that \'nothing huge happened and i still felt wrecked\' kept turning into an old attachment ache.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'self_reflection',
        'home',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'I ended the day realizing \'nothing huge happened and i still felt wrecked\' had shaped more of it than I wanted; the residue was loneliness in my shoulders.',
      eveningWin: 'By evening, I could still leave one thing unfinished without punishing myself even though \'nothing huge happened and i still felt wrecked\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'nothing huge happened and i still felt wrecked\' kept echoing as the sense that I was too much and not enough at once.',
      sleepHours: 6.2,
      dreamText: 'The dream made every social moment feel like a test I had not studied for. The feeling connected back to \'nothing huge happened and i still felt wrecked\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 4
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 33,
      date: '2026-02-23',
      promptResponse: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.\n\nThe thread underneath all of it was how hard it can be to stay on my own side when shame or comparison get activated. Day 33 made that especially clear through the shape of \'i wanted to be held differently\'.',
      journalTitle: 'I wanted to be held differently',
      journalTags: [
        'Overwhelmed',
        'Vulnerable',
        'Healing',
        'Rest',
        'Recovery',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 33,
        date: '2026-02-23',
        values: [
          {
            statement: 'Nature has provided comfort during some of my hardest moments.',
            answer: 'True'
          },
          {
            statement: 'Breaking my own self-imposed rules has taught me something.',
            answer: 'True'
          },
          {
            statement: 'I have recently felt misunderstood in a way that revealed a deeper need.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'A label I once identified with no longer fits me.',
            answer: 'True'
          },
          {
            statement: 'I take care of others more than others take care of me.',
            answer: 'True'
          },
          {
            statement: 'Enchantment and wonder are alive in my adult life.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I handle disagreements about shared memories gracefully.',
            answer: 'True'
          },
          {
            statement: 'I recognise and correct the cognitive biases that affect my risk assessment.',
            answer: 'True'
          },
          {
            statement: 'The same thinking habit loops back when I\'m under stress.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I think of life events as having a soundtrack.',
            answer: 'True'
          },
          {
            statement: 'I spot patterns in data or information quickly.',
            answer: 'True'
          },
          {
            statement: 'I find it easy to parallel park or navigate tight spaces.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'overwhelmed',
        'vulnerable',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'This morning had the mood of \'i wanted to be held differently\'—I was scanning early and trying not to let embarrassment run the day.',
      morningWin: 'What I did right, despite \'i wanted to be held differently\', was pause before assuming the worst.',
      morningChallenge: 'My biggest challenge was how \'i wanted to be held differently\' opened the door to self-consciousness that made everything feel louder.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'recovery',
        'home',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'i wanted to be held differently\', and my body held it as embarrassment around my throat.',
      eveningWin: 'By evening, I could still notice my body before it was screaming even though \'i wanted to be held differently\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i wanted to be held differently\' kept echoing as comparison that turned mean quickly.',
      sleepHours: 6.9,
      dreamText: 'The dream turned every conversation into subtitles that vanished before I could finish reading them. The feeling connected back to \'i wanted to be held differently\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 5
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 34,
      date: '2026-02-24',
      promptResponse: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.\n\nMore than anything, I needed gentleness that did not have to be earned first. Day 34 made that especially clear through the shape of \'when i miss part of the conversation, i miss more than words\'.',
      journalTitle: 'When I miss part of the conversation, I miss more than words',
      journalTags: [
        'Anxious',
        'Hurt',
        'Rejection',
        'Overthinking',
        'Rumination',
        'Emotional Pattern'
      ],
      dailyReflectionAnswers: {
        day: 34,
        date: '2026-02-24',
        values: [
          {
            statement: 'I choose long-term fulfilment over short-term gratification.',
            answer: 'True'
          },
          {
            statement: 'I balance personal freedom with responsibility to people I love.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'Unknown territory excites me more than it scares me right now.',
            answer: 'True'
          },
          {
            statement: 'I act differently when no one is watching.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I manage involuntary rumination effectively.',
            answer: 'True'
          },
          {
            statement: 'I maintain balanced thinking — neither too emotional nor too analytical.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I notice the emotional key of a piece of music immediately.',
            answer: 'True'
          },
          {
            statement: 'I naturally take the lead in social situations.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'anxious',
        'hurt',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'I started the day with \'when i miss part of the conversation, i miss more than words\' sitting close to the surface, which made my ears feel charged with frustration.',
      morningWin: 'Even with \'when i miss part of the conversation, i miss more than words\' hanging over me, I still managed to let Lucas have the version of me that was present instead of perfect.',
      morningChallenge: 'What stayed difficult all day was that \'when i miss part of the conversation, i miss more than words\' kept feeding a body memory that got ahead of language.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'rumination',
        'emotional_pattern',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'The evening version of today was \'when i miss part of the conversation, i miss more than words\'; underneath everything else I was still carrying frustration in my ears.',
      eveningWin: 'By evening, I could still come back to the moment instead of spiraling all the way out even though \'when i miss part of the conversation, i miss more than words\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'when i miss part of the conversation, i miss more than words\' kept echoing as the feeling of being outside the room even while in it.',
      sleepHours: 7.6,
      dreamText: 'I kept missing one crucial sentence and the whole room moved on without me, so I spent the rest of the dream pretending I understood. The feeling connected back to \'when i miss part of the conversation, i miss more than words\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 4
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 35,
      date: '2026-02-25',
      promptResponse: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.\n\nWhat hurt most was how ordinary the trigger looked from the outside compared with how total it felt inside me. Day 35 made that especially clear through the shape of \'i keep trying to earn rest\'.',
      journalTitle: 'I keep trying to earn rest',
      journalTags: [
        'Ashamed',
        'Anxious',
        'Misunderstood',
        'Processing',
        'Mental Load',
        'Self-Doubt'
      ],
      dailyReflectionAnswers: {
        day: 35,
        date: '2026-02-25',
        values: [
          {
            statement: 'I know the line between disarming humor and avoidant humor.',
            answer: 'True'
          },
          {
            statement: 'My daydreams reveal something true about my desires.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I play a specific, recognisable role in my friends\' lives.',
            answer: 'True'
          },
          {
            statement: 'My public identity has diverged from who I really am.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I apply lessons from my past daily without even thinking about it.',
            answer: 'True'
          },
          {
            statement: 'My energy level and my thinking quality are closely connected.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I can tell when group dynamics shift.',
            answer: 'Somewhat'
          },
          {
            statement: 'I feel that nature teaches me things no book can.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'ashamed',
        'anxious',
        'comparison',
        'self_image'
      ],
      morningNote: 'The wake-up feeling was basically \'i keep trying to earn rest\'; before coffee or conversation I could already feel smallness gathering in my face.',
      morningWin: 'A quiet win today was that I could feel \'i keep trying to earn rest\' and still leave one thing unfinished without punishing myself.',
      morningChallenge: 'The hardest part of today was that \'i keep trying to earn rest\' kept turning into the urge to overexplain myself.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'mental_load',
        'self_doubt',
        'inferiority',
        'shame'
      ],
      eveningNote: 'By evening, \'i keep trying to earn rest\' still felt true; I could tell the day had settled as smallness and left a trace in my face.',
      eveningWin: 'By evening, I could still protect a small pocket of quiet even though \'i keep trying to earn rest\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i keep trying to earn rest\' kept echoing as caregiving depletion I could not hide from myself.',
      sleepHours: 8.3,
      dreamText: 'I kept noticing other women in the dream and turning them into evidence against myself. The feeling connected back to \'i keep trying to earn rest\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'ashamed',
          intensity: 5
        },
        {
          id: 'small',
          intensity: 4
        },
        {
          id: 'envious',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'comparison',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 36,
      date: '2026-02-26',
      promptResponse: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.\n\nI can tell this is one of the patterns I most want to heal because it still reaches me before I have language. Day 36 made that especially clear through the shape of \'my chest was tight all day\'.',
      journalTitle: 'My chest was tight all day',
      journalTags: [
        'Exhausted',
        'Parenting',
        'Caregiving',
        'Low Energy',
        'Tired',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 36,
        date: '2026-02-26',
        values: [
          {
            statement: 'Loyalty is important to me, but I recognise its limits.',
            answer: 'True'
          },
          {
            statement: 'I balance planning with surrendering to what I cannot control.',
            answer: 'True'
          },
          {
            statement: 'My online presence reflects who I actually am.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'My rational mind and my emotional mind have very different priorities.',
            answer: 'True'
          },
          {
            statement: 'My sense of self shifts depending on who I\'m with.',
            answer: 'True'
          },
          {
            statement: 'My caring nature has at times felt like a prison.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I detect subtext and unspoken meaning in conversations.',
            answer: 'True'
          },
          {
            statement: 'I make good decisions with high stakes and limited information.',
            answer: 'True'
          },
          {
            statement: 'I process and learn from my mistakes effectively after they happen.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I notice when correlation is mistaken for causation.',
            answer: 'True'
          },
          {
            statement: 'I feel drained by superficial interactions.',
            answer: 'True'
          },
          {
            statement: 'I enjoy cooking with fresh, seasonal, or wild ingredients.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'exhausted',
        'parenting',
        'Naomi',
        'attachment'
      ],
      morningNote: 'Woke up carrying the feeling of \'my chest was tight all day\' before anything else happened; my body was already leaning toward ache.',
      morningWin: 'What I did right, despite \'my chest was tight all day\', was notice my body before it was screaming.',
      morningChallenge: 'My biggest challenge was how \'my chest was tight all day\' opened the door to the sense that I was too much and not enough at once.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'tired',
        'home',
        'loss',
        'longing'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'my chest was tight all day\'; even while winding down I could feel ache sitting in my throat.',
      eveningWin: 'By evening, I could still name the actual feeling instead of only the secondary one even though \'my chest was tight all day\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'my chest was tight all day\' kept echoing as grief that changed the temperature of everything.',
      sleepHours: 5.5,
      dreamText: 'The dream let me have Naomi back for a minute and then reminded me that love does not undo loss. The feeling connected back to \'my chest was tight all day\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'longing',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'naomi',
        awakenState: 'emotional',
        recurring: true
      }
    },
    {
      day: 37,
      date: '2026-02-27',
      promptResponse: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.\n\nEven in the hardest part of it, I could feel how much I want connection without having to abandon myself to keep it. Day 37 made that especially clear through the shape of \'i hate how fast embarrassment turns into shame\'.',
      journalTitle: 'I hate how fast embarrassment turns into shame',
      journalTags: [
        'Lonely',
        'Hurt',
        'Attachment',
        'Distance',
        'Repair',
        'Connection'
      ],
      dailyReflectionAnswers: {
        day: 37,
        date: '2026-02-27',
        values: [
          {
            statement: 'I can distinguish between challenges worth pushing through and ones to release.',
            answer: 'True'
          },
          {
            statement: 'Playfulness is an active part of my adult life.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'A deep fear underlies my need for control.',
            answer: 'True'
          },
          {
            statement: 'A recurring dream or image keeps appearing in my life.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I become aware of new patterns in my life on a regular basis.',
            answer: 'True'
          },
          {
            statement: 'Deadlines improve the quality of my thinking.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I feel inspired or calmed by specific landscapes or environments.',
            answer: 'True'
          },
          {
            statement: 'I enjoy personality tests and frameworks for self-understanding.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'low',
      morningTags: [
        'lonely',
        'hurt',
        'overthinking',
        'sensitivity'
      ],
      morningNote: 'The first thing I noticed this morning was how \'i hate how fast embarrassment turns into shame\' was still living in me; it landed as anxiety in my head.',
      morningWin: 'Even with \'i hate how fast embarrassment turns into shame\' hanging over me, I still managed to come back to the moment instead of spiraling all the way out.',
      morningChallenge: 'What stayed difficult all day was that \'i hate how fast embarrassment turns into shame\' kept feeding comparison that turned mean quickly.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'low',
      eveningTags: [
        'repair',
        'connection',
        'processing',
        'fatigue'
      ],
      eveningNote: 'I ended the day realizing \'i hate how fast embarrassment turns into shame\' had shaped more of it than I wanted; the residue was anxiety in my head.',
      eveningWin: 'By evening, I could still stop performing for a few minutes and just be there even though \'i hate how fast embarrassment turns into shame\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i hate how fast embarrassment turns into shame\' kept echoing as the fear that I was being judged.',
      sleepHours: 6.2,
      dreamText: 'The dream felt emotionally expensive in the same way some real days do: nothing catastrophic, just too much without enough softness. The feeling connected back to \'i hate how fast embarrassment turns into shame\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'anxious',
          intensity: 5
        },
        {
          id: 'tired',
          intensity: 4
        },
        {
          id: 'exposed',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'default',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 38,
      date: '2026-02-28',
      promptResponse: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.\n\nThere was also a quiet strength in being honest about it instead of pretending I was less affected than I really was. Day 38 made that especially clear through the shape of \'some days i feel like a burden just for existing\'.',
      journalTitle: 'Some days I feel like a burden just for existing',
      journalTags: [
        'Sad',
        'Family',
        'Memory',
        'Hurt',
        'Processing',
        'Inner Child'
      ],
      dailyReflectionAnswers: {
        day: 38,
        date: '2026-02-28',
        values: [
          {
            statement: 'Fairness is reflected in how I treat the people closest to me.',
            answer: 'True'
          },
          {
            statement: 'I find elegance in the straightforward solution.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'A part of me needs to be seen but is too afraid to be visible.',
            answer: 'True'
          },
          {
            statement: 'A part of me craves stability while another part craves chaos.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I know exactly what question I\'d most love someone to ask me right now.',
            answer: 'True'
          },
          {
            statement: 'My mood influences which memories surface.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I thrive on teamwork and collaboration.',
            answer: 'Not True'
          },
          {
            statement: 'I spend time curating playlists for different moods.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'sad',
        'family',
        'history',
        'belonging'
      ],
      morningNote: 'This morning had the mood of \'some days i feel like a burden just for existing\'—I was scanning early and trying not to let exclusion run the day.',
      morningWin: 'A quiet win today was that I could feel \'some days i feel like a burden just for existing\' and still protect a small pocket of quiet.',
      morningChallenge: 'The hardest part of today was that \'some days i feel like a burden just for existing\' kept turning into the feeling of being outside the room even while in it.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'inner_child',
        'old_pain',
        'exclusion'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'some days i feel like a burden just for existing\', and my body held it as exclusion around my face.',
      eveningWin: 'By evening, I could still speak more honestly than I usually do even though \'some days i feel like a burden just for existing\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'some days i feel like a burden just for existing\' kept echoing as an old attachment ache.',
      sleepHours: 6.9,
      dreamText: 'I was at a family gathering where everyone else seemed to understand the emotional script except me. The feeling connected back to \'some days i feel like a burden just for existing\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'excluded',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'small',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'family',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 39,
      date: '2026-03-01',
      promptResponse: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.\n\nI keep noticing how often loneliness hides underneath what first looks like irritability, awkwardness, or overthinking. Day 39 made that especially clear through the shape of \'there is anger under this sadness\'.',
      journalTitle: 'There is anger under this sadness',
      journalTags: [
        'Frustrated',
        'Misunderstood',
        'Disconnected',
        'Sensory Overload',
        'Mental Load',
        'Awareness'
      ],
      dailyReflectionAnswers: {
        day: 39,
        date: '2026-03-01',
        values: [
          {
            statement: 'My days generally reflect what I consider a well-lived life.',
            answer: 'True'
          },
          {
            statement: 'I exercise autonomy in my daily decisions.',
            answer: 'True'
          },
          {
            statement: 'I protect white space in my life — time with no agenda.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I stay in contact with the mythic dimension of my life.',
            answer: 'True'
          },
          {
            statement: 'I hold the tension between rational understanding and deeper knowing.',
            answer: 'True'
          },
          {
            statement: 'I show courage even when fear is overwhelming.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I evaluate worst-case scenarios without catastrophising.',
            answer: 'True'
          },
          {
            statement: 'I make important decisions with clarity and confidence.',
            answer: 'True'
          },
          {
            statement: 'Technology has fundamentally changed how I think and communicate.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'A song can change my entire emotional state in seconds.',
            answer: 'True'
          },
          {
            statement: 'I like building mental models of how things work.',
            answer: 'True'
          },
          {
            statement: 'I can read the sky and sense the time or season without a clock.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'frustrated',
        'misunderstood',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'I started the day with \'there is anger under this sadness\' sitting close to the surface, which made my face feel charged with rejection.',
      morningWin: 'What I did right, despite \'there is anger under this sadness\', was name the actual feeling instead of only the secondary one.',
      morningChallenge: 'My biggest challenge was how \'there is anger under this sadness\' opened the door to caregiving depletion I could not hide from myself.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'mental_load',
        'awareness',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'The evening version of today was \'there is anger under this sadness\'; underneath everything else I was still carrying rejection in my face.',
      eveningWin: 'By evening, I could still stay softer with myself in one key moment even though \'there is anger under this sadness\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'there is anger under this sadness\' kept echoing as self-consciousness that made everything feel louder.',
      sleepHours: 7.6,
      dreamText: 'I kept entering conversations a beat too late in the dream and reading that as proof I did not belong. The feeling connected back to \'there is anger under this sadness\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 5
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 40,
      date: '2026-03-02',
      promptResponse: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.\n\nWhat I wish for most is to feel at home in myself before I have to prove anything to anyone else. Day 40 made that especially clear through the shape of \'i can feel the younger ache in me\'.',
      journalTitle: 'I can feel the younger ache in me',
      journalTags: [
        'Lonely',
        'Attachment',
        'Closeness',
        'Distance',
        'Overthinking',
        'Love'
      ],
      dailyReflectionAnswers: {
        day: 40,
        date: '2026-03-02',
        values: [
          {
            statement: 'Faith — in whatever form it takes for me — plays a real role in my daily life.',
            answer: 'True'
          },
          {
            statement: 'A moment of unexpected abundance recently reminded me of what truly matters.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'My life would look very different if I cared for myself first.',
            answer: 'True'
          },
          {
            statement: 'My contrarian nature both helps and isolates me.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'Quick decisions work out well for me.',
            answer: 'True'
          },
          {
            statement: 'I think about probability naturally in everyday decisions.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I can sense hidden motives in conversations.',
            answer: 'True'
          },
          {
            statement: 'I feel that exploring these questions is a core part of who I am.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'lonely',
        'attachment',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The wake-up feeling was basically \'i can feel the younger ache in me\'; before coffee or conversation I could already feel alarm gathering in my head.',
      morningWin: 'Even with \'i can feel the younger ache in me\' hanging over me, I still managed to stop performing for a few minutes and just be there.',
      morningChallenge: 'What stayed difficult all day was that \'i can feel the younger ache in me\' kept feeding grief that changed the temperature of everything.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'overthinking',
        'love',
        'triggered',
        'awareness'
      ],
      eveningNote: 'By evening, \'i can feel the younger ache in me\' still felt true; I could tell the day had settled as alarm and left a trace in my head.',
      eveningWin: 'By evening, I could still pause before assuming the worst even though \'i can feel the younger ache in me\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i can feel the younger ache in me\' kept echoing as a body memory that got ahead of language.',
      sleepHours: 8.3,
      dreamText: 'My body reacted first in the dream and the meaning arrived later, which made the whole thing feel older than the actual scene. The feeling connected back to \'i can feel the younger ache in me\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 4
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 41,
      date: '2026-03-03',
      promptResponse: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.\n\nWhat felt truest tonight was how quickly my body turned the whole day into a referendum on whether I am too much or not enough. Day 41 made that especially clear through the shape of \'i needed clarity and got ambiguity\'.',
      journalTitle: 'I needed clarity and got ambiguity',
      journalTags: [
        'Anxious',
        'Sensitive',
        'Self-Doubt',
        'Rejection',
        'Overthinking',
        'Processing'
      ],
      dailyReflectionAnswers: {
        day: 41,
        date: '2026-03-03',
        values: [
          {
            statement: 'I would live differently if no one was judging me.',
            answer: 'True'
          },
          {
            statement: 'I balance generosity with self-preservation.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I turn self-awareness into actual change, not just insight.',
            answer: 'True'
          },
          {
            statement: 'I stay authentic during periods of rapid personal growth.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I use my understanding of patterns to plan and prepare effectively.',
            answer: 'True'
          },
          {
            statement: 'I rely on feeling rather than analysis when encountering a stranger.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I feel a strong pull to understand human behaviour.',
            answer: 'True'
          },
          {
            statement: 'I set boundaries based on deep self-knowledge.',
            answer: 'True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'anxious',
        'sensitive',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'Woke up carrying the feeling of \'i needed clarity and got ambiguity\' before anything else happened; my body was already leaning toward fear.',
      morningWin: 'A quiet win today was that I could feel \'i needed clarity and got ambiguity\' and still speak more honestly than I usually do.',
      morningChallenge: 'The hardest part of today was that \'i needed clarity and got ambiguity\' kept turning into the fear that I was being judged.',
      eveningMood: 2,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'overthinking',
        'processing',
        'triggered',
        'awareness'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'i needed clarity and got ambiguity\'; even while winding down I could feel fear sitting in my hips.',
      eveningWin: 'By evening, I could still let Lucas have the version of me that was present instead of perfect even though \'i needed clarity and got ambiguity\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i needed clarity and got ambiguity\' kept echoing as the urge to overexplain myself.',
      sleepHours: 5.5,
      dreamText: 'The dream kept changing before I could orient to it, and my body stayed alarmed even when the details shifted. The feeling connected back to \'i needed clarity and got ambiguity\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 42,
      date: '2026-03-04',
      promptResponse: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.\n\nUnder the surface, I could feel the younger part of me still hoping someone would notice without my having to ask for that much care directly. Day 42 made that especially clear through the shape of \'my nervous system hates uncertainty\'.',
      journalTitle: 'My nervous system hates uncertainty',
      journalTags: [
        'Guarded',
        'Sensitive',
        'Self-Doubt',
        'Identity',
        'Awareness',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 42,
        date: '2026-03-04',
        values: [
          {
            statement: 'I keep doing things I wish I had the courage to quit.',
            answer: 'True'
          },
          {
            statement: 'My inner world feels vivid and rich today.',
            answer: 'True'
          },
          {
            statement: 'Spiritual growth is meaningful to me regardless of religion.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'A role is calling me that feels both exciting and terrifying.',
            answer: 'True'
          },
          {
            statement: 'I honour the mystery within myself.',
            answer: 'True'
          },
          {
            statement: 'I resist the temptation to use power to avoid painful feelings.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I learn by doing rather than by reading instructions.',
            answer: 'True'
          },
          {
            statement: 'I use reflection actively to improve my thinking process.',
            answer: 'True'
          },
          {
            statement: 'I am actively shifting a recurring theme in my life.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I prefer standing or walking to sitting.',
            answer: 'True'
          },
          {
            statement: 'I learn by doing — hands-on experience beats reading.',
            answer: 'True'
          },
          {
            statement: 'I focus better with the right kind of background music.',
            answer: 'True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'guarded',
        'sensitive',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The first thing I noticed this morning was how \'my nervous system hates uncertainty\' was still living in me; it landed as flooding in my head.',
      morningWin: 'What I did right, despite \'my nervous system hates uncertainty\', was stay softer with myself in one key moment.',
      morningChallenge: 'My biggest challenge was how \'my nervous system hates uncertainty\' opened the door to an old attachment ache.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'awareness',
        'home',
        'triggered',
        'survival'
      ],
      eveningNote: 'I ended the day realizing \'my nervous system hates uncertainty\' had shaped more of it than I wanted; the residue was flooding in my head.',
      eveningWin: 'By evening, I could still leave one thing unfinished without punishing myself even though \'my nervous system hates uncertainty\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'my nervous system hates uncertainty\' kept echoing as the sense that I was too much and not enough at once.',
      sleepHours: 6.2,
      dreamText: 'It felt like a body-memory dream more than a plot dream; the sensation was the real storyline. The feeling connected back to \'my nervous system hates uncertainty\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 4
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 43,
      date: '2026-03-05',
      promptResponse: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.\n\nThe thread underneath all of it was how hard it can be to stay on my own side when shame or comparison get activated. Day 43 made that especially clear through the shape of \'i did not want to be perceived today\'.',
      journalTitle: 'I did not want to be perceived today',
      journalTags: [
        'Ashamed',
        'Frustrated',
        'Misunderstood',
        'Sensory Overload',
        'Mental Load',
        'Awareness'
      ],
      dailyReflectionAnswers: {
        day: 43,
        date: '2026-03-05',
        values: [
          {
            statement: 'I create space for spontaneity even within a structured life.',
            answer: 'True'
          },
          {
            statement: 'I am fully honest with myself about how I feel right now.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'Opposing traits within me create my unique character.',
            answer: 'True'
          },
          {
            statement: 'Settling has felt right to me rather than suffocating.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'Daily reflection has revealed valuable things about myself.',
            answer: 'True'
          },
          {
            statement: 'I convey nuance effectively even when words feel insufficient.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I form meaningful connections quickly.',
            answer: 'True'
          },
          {
            statement: 'I notice my own cognitive biases in action.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'ashamed',
        'frustrated',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'This morning had the mood of \'i did not want to be perceived today\'—I was scanning early and trying not to let shame run the day.',
      morningWin: 'Even with \'i did not want to be perceived today\' hanging over me, I still managed to pause before assuming the worst.',
      morningChallenge: 'What stayed difficult all day was that \'i did not want to be perceived today\' kept feeding self-consciousness that made everything feel louder.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'mental_load',
        'awareness',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'i did not want to be perceived today\', and my body held it as shame around my throat.',
      eveningWin: 'By evening, I could still notice my body before it was screaming even though \'i did not want to be perceived today\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i did not want to be perceived today\' kept echoing as comparison that turned mean quickly.',
      sleepHours: 6.9,
      dreamText: 'I kept missing one crucial sentence and the whole room moved on without me, so I spent the rest of the dream pretending I understood. The feeling connected back to \'i did not want to be perceived today\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 5
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 44,
      date: '2026-03-06',
      promptResponse: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.\n\nMore than anything, I needed gentleness that did not have to be earned first. Day 44 made that especially clear through the shape of \'the grief comes back in flashes\'.',
      journalTitle: 'The grief comes back in flashes',
      journalTags: [
        'Sad',
        'Grief',
        'Loss',
        'Memory',
        'Processing',
        'Inner Child'
      ],
      dailyReflectionAnswers: {
        day: 44,
        date: '2026-03-06',
        values: [
          {
            statement: 'I need to give myself permission to stop doing something.',
            answer: 'True'
          },
          {
            statement: 'I treat myself with compassion when I fall short.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I find the sacred in everyday moments.',
            answer: 'True'
          },
          {
            statement: 'I channel my energy into something meaningful each day.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'A specific memory has shaped how I think today.',
            answer: 'True'
          },
          {
            statement: 'I share new ideas despite the vulnerability it requires.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am naturally athletic or physically coordinated.',
            answer: 'True'
          },
          {
            statement: 'Music significantly affects my mood.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'sad',
        'grief',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'I started the day with \'the grief comes back in flashes\' sitting close to the surface, which made my head feel charged with alarm.',
      morningWin: 'A quiet win today was that I could feel \'the grief comes back in flashes\' and still let Lucas have the version of me that was present instead of perfect.',
      morningChallenge: 'The hardest part of today was that \'the grief comes back in flashes\' kept turning into a body memory that got ahead of language.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'inner_child',
        'triggered',
        'awareness'
      ],
      eveningNote: 'The evening version of today was \'the grief comes back in flashes\'; underneath everything else I was still carrying alarm in my head.',
      eveningWin: 'By evening, I could still come back to the moment instead of spiraling all the way out even though \'the grief comes back in flashes\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'the grief comes back in flashes\' kept echoing as the feeling of being outside the room even while in it.',
      sleepHours: 7.6,
      dreamText: 'The dream kept changing before I could orient to it, and my body stayed alarmed even when the details shifted. The feeling connected back to \'the grief comes back in flashes\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 4
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 45,
      date: '2026-03-07',
      promptResponse: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.\n\nWhat hurt most was how ordinary the trigger looked from the outside compared with how total it felt inside me. Day 45 made that especially clear through the shape of \'i held it together, but barely\'.',
      journalTitle: 'I held it together, but barely',
      journalTags: [
        'Ashamed',
        'Self-Doubt',
        'Identity',
        'Acceptance',
        'Overthinking',
        'Self-Reflection'
      ],
      dailyReflectionAnswers: {
        day: 45,
        date: '2026-03-07',
        values: [
          {
            statement: 'Freedom means something specific and important to me right now.',
            answer: 'True'
          },
          {
            statement: 'I would defend my core principles even if I stood alone.',
            answer: 'True'
          },
          {
            statement: 'I can tell when a relationship is nourishing versus draining.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'My masks sometimes protect me and sometimes trap me.',
            answer: 'True'
          },
          {
            statement: 'I find meaning in the search itself, not just the destination.',
            answer: 'True'
          },
          {
            statement: 'A paradox within me has become a source of creative energy.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I sleep on important decisions before finalising them.',
            answer: 'True'
          },
          {
            statement: 'I make confident bets on myself and my abilities.',
            answer: 'True'
          },
          {
            statement: 'I recover my focus quickly after an interruption.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I think better when I am moving.',
            answer: 'True'
          },
          {
            statement: 'I prefer learning through physical demonstration.',
            answer: 'True'
          },
          {
            statement: 'I have a strong inner compass that guides my decisions.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'ashamed',
        'self_doubt',
        'comparison',
        'self_image'
      ],
      morningNote: 'The wake-up feeling was basically \'i held it together, but barely\'; before coffee or conversation I could already feel shame gathering in my face.',
      morningWin: 'What I did right, despite \'i held it together, but barely\', was leave one thing unfinished without punishing myself.',
      morningChallenge: 'My biggest challenge was how \'i held it together, but barely\' opened the door to the urge to overexplain myself.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'overthinking',
        'self_reflection',
        'inferiority',
        'shame'
      ],
      eveningNote: 'By evening, \'i held it together, but barely\' still felt true; I could tell the day had settled as shame and left a trace in my face.',
      eveningWin: 'By evening, I could still protect a small pocket of quiet even though \'i held it together, but barely\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i held it together, but barely\' kept echoing as caregiving depletion I could not hide from myself.',
      sleepHours: 8.3,
      dreamText: 'The dream made comparison feel instantaneous, like I lost myself before I even had a thought about it. The feeling connected back to \'i held it together, but barely\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'ashamed',
          intensity: 5
        },
        {
          id: 'small',
          intensity: 4
        },
        {
          id: 'envious',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'comparison',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 46,
      date: '2026-03-08',
      promptResponse: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.\n\nI can tell this is one of the patterns I most want to heal because it still reaches me before I have language. Day 46 made that especially clear through the shape of \'i wish i trusted myself more\'.',
      journalTitle: 'I wish I trusted myself more',
      journalTags: [
        'Sad',
        'Attachment',
        'Loss',
        'Parenting',
        'Caregiving',
        'Memory'
      ],
      dailyReflectionAnswers: {
        day: 46,
        date: '2026-03-08',
        values: [
          {
            statement: 'Caring for the natural world feels like a personal responsibility to me.',
            answer: 'True'
          },
          {
            statement: 'I fully honour my own boundaries.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I am rewriting an old story I used to believe about myself.',
            answer: 'True'
          },
          {
            statement: 'I can sense the line between empathy and enmeshment.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I manage the anxiety of irreversible decisions calmly.',
            answer: 'True'
          },
          {
            statement: 'I am attuned to my body\'s signals of danger or opportunity.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I approach creative work with analytical precision.',
            answer: 'True'
          },
          {
            statement: 'I notice when I am projecting my feelings onto others.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'sad',
        'attachment',
        'Naomi',
        'grief'
      ],
      morningNote: 'Woke up carrying the feeling of \'i wish i trusted myself more\' before anything else happened; my body was already leaning toward longing.',
      morningWin: 'Even with \'i wish i trusted myself more\' hanging over me, I still managed to notice my body before it was screaming.',
      morningChallenge: 'What stayed difficult all day was that \'i wish i trusted myself more\' kept feeding the sense that I was too much and not enough at once.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'caregiving',
        'memory',
        'loss',
        'longing'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'i wish i trusted myself more\'; even while winding down I could feel longing sitting in my throat.',
      eveningWin: 'By evening, I could still name the actual feeling instead of only the secondary one even though \'i wish i trusted myself more\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i wish i trusted myself more\' kept echoing as grief that changed the temperature of everything.',
      sleepHours: 5.5,
      dreamText: 'Naomi was there in the dream in an ordinary domestic way, which somehow hurt more because it felt like the bond was still active and unresolvable. The feeling connected back to \'i wish i trusted myself more\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'longing',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'naomi',
        awakenState: 'emotional',
        recurring: true
      }
    },
    {
      day: 47,
      date: '2026-03-09',
      promptResponse: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.\n\nEven in the hardest part of it, I could feel how much I want connection without having to abandon myself to keep it. Day 47 made that especially clear through the shape of \'today felt like too many selves at once\'.',
      journalTitle: 'Today felt like too many selves at once',
      journalTags: [
        'Heavy',
        'Exhausted',
        'Low Energy',
        'Body Heaviness',
        'Mental Load',
        'Sleep'
      ],
      dailyReflectionAnswers: {
        day: 47,
        date: '2026-03-09',
        values: [
          {
            statement: 'A boundary I set has improved an important relationship.',
            answer: 'True'
          },
          {
            statement: 'I actively celebrate the people I love.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I handle being wrong about something I was certain of with openness.',
            answer: 'True'
          },
          {
            statement: 'What I\'m chasing is sometimes a way of running from something else.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I distinguish between a genuinely good idea and an exciting but impractical one.',
            answer: 'True'
          },
          {
            statement: 'I manage my greatest cognitive distraction effectively.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I notice how light changes throughout the day.',
            answer: 'True'
          },
          {
            statement: 'I regularly check in with my own emotional state.',
            answer: 'True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'heavy',
        'exhausted',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The first thing I noticed this morning was how \'today felt like too many selves at once\' was still living in me; it landed as dissociation in my hips.',
      morningWin: 'A quiet win today was that I could feel \'today felt like too many selves at once\' and still come back to the moment instead of spiraling all the way out.',
      morningChallenge: 'The hardest part of today was that \'today felt like too many selves at once\' kept turning into comparison that turned mean quickly.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'mental_load',
        'sleep',
        'triggered',
        'awareness'
      ],
      eveningNote: 'I ended the day realizing \'today felt like too many selves at once\' had shaped more of it than I wanted; the residue was dissociation in my hips.',
      eveningWin: 'By evening, I could still stop performing for a few minutes and just be there even though \'today felt like too many selves at once\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'today felt like too many selves at once\' kept echoing as the fear that I was being judged.',
      sleepHours: 6.2,
      dreamText: 'The dream kept changing before I could orient to it, and my body stayed alarmed even when the details shifted. The feeling connected back to \'today felt like too many selves at once\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 48,
      date: '2026-03-10',
      promptResponse: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.\n\nThere was also a quiet strength in being honest about it instead of pretending I was less affected than I really was. Day 48 made that especially clear through the shape of \'i wanted to withdraw before anyone could reject me\'.',
      journalTitle: 'I wanted to withdraw before anyone could reject me',
      journalTags: [
        'Lonely',
        'Attachment',
        'Support',
        'Closeness',
        'Vulnerable',
        'Connection'
      ],
      dailyReflectionAnswers: {
        day: 48,
        date: '2026-03-10',
        values: [
          {
            statement: 'Specific injustices move me to action more than others.',
            answer: 'True'
          },
          {
            statement: 'I have a form of expression that feels completely natural to me.',
            answer: 'True'
          },
          {
            statement: 'I can hold space for someone whose actions I disagree with.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'There is something in me that needs to die in order for me to grow.',
            answer: 'True'
          },
          {
            statement: 'My relationships help me find and refine my sense of purpose.',
            answer: 'True'
          },
          {
            statement: 'I naturally question authority and established systems.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I notice subtle signals that others miss.',
            answer: 'True'
          },
          {
            statement: 'I remain creative even under pressure.',
            answer: 'True'
          },
          {
            statement: 'I handle conflicting advice from people I trust with clarity.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'Scientific reasoning excites me more than artistic expression.',
            answer: 'True'
          },
          {
            statement: 'I notice ecological patterns — migration, bloom cycles, tides.',
            answer: 'True'
          },
          {
            statement: 'I feel that compassion is the highest expression of intelligence.',
            answer: 'True'
          }
        ]
      },
      morningMood: 5,
      morningEnergy: 'medium',
      morningStress: 'medium',
      morningTags: [
        'lonely',
        'attachment',
        'overthinking',
        'sensitivity'
      ],
      morningNote: 'This morning had the mood of \'i wanted to withdraw before anyone could reject me\'—I was scanning early and trying not to let longing run the day.',
      morningWin: 'What I did right, despite \'i wanted to withdraw before anyone could reject me\', was protect a small pocket of quiet.',
      morningChallenge: 'My biggest challenge was how \'i wanted to withdraw before anyone could reject me\' opened the door to the feeling of being outside the room even while in it.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'vulnerable',
        'connection',
        'processing',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'i wanted to withdraw before anyone could reject me\', and my body held it as longing around my throat.',
      eveningWin: 'By evening, I could still speak more honestly than I usually do even though \'i wanted to withdraw before anyone could reject me\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i wanted to withdraw before anyone could reject me\' kept echoing as an old attachment ache.',
      sleepHours: 6.9,
      dreamText: 'The dream was ordinary on the surface and overwhelming underneath, which felt very familiar. The feeling connected back to \'i wanted to withdraw before anyone could reject me\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'anxious',
          intensity: 4
        },
        {
          id: 'tired',
          intensity: 4
        },
        {
          id: 'exposed',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'default',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 49,
      date: '2026-03-11',
      promptResponse: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.\n\nI keep noticing how often loneliness hides underneath what first looks like irritability, awkwardness, or overthinking. Day 49 made that especially clear through the shape of \'i can feel how much i want safe closeness\'.',
      journalTitle: 'I can feel how much I want safe closeness',
      journalTags: [
        'Sensitive',
        'Guarded',
        'Self-Doubt',
        'Awareness',
        'Processing',
        'Safety'
      ],
      dailyReflectionAnswers: {
        day: 49,
        date: '2026-03-11',
        values: [
          {
            statement: 'Total freedom, without any structure, would actually scare me.',
            answer: 'True'
          },
          {
            statement: 'People who know me well still have much to discover about me.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'Part of my identity feels actively under construction right now.',
            answer: 'True'
          },
          {
            statement: 'I would pursue a specific role in the world if nothing held me back.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I distinguish productive concern from anxious rumination.',
            answer: 'True'
          },
          {
            statement: 'Understanding how I think has improved my relationships.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I use self-knowledge to navigate relationships more effectively.',
            answer: 'True'
          },
          {
            statement: 'I remember things better when I write them down.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'sensitive',
        'guarded',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'I started the day with \'i can feel how much i want safe closeness\' sitting close to the surface, which made my face feel charged with anxiety.',
      morningWin: 'Even with \'i can feel how much i want safe closeness\' hanging over me, I still managed to name the actual feeling instead of only the secondary one.',
      morningChallenge: 'What stayed difficult all day was that \'i can feel how much i want safe closeness\' kept feeding caregiving depletion I could not hide from myself.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'high',
      eveningTags: [
        'processing',
        'safety',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'The evening version of today was \'i can feel how much i want safe closeness\'; underneath everything else I was still carrying anxiety in my face.',
      eveningWin: 'By evening, I could still stay softer with myself in one key moment even though \'i can feel how much i want safe closeness\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i can feel how much i want safe closeness\' kept echoing as self-consciousness that made everything feel louder.',
      sleepHours: 7.6,
      dreamText: 'I was in a room full of people again, trying to look normal while feeling unmistakably outside of the ease everyone else seemed to have. The feeling connected back to \'i can feel how much i want safe closeness\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 5
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 50,
      date: '2026-03-12',
      promptResponse: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.\n\nWhat I wish for most is to feel at home in myself before I have to prove anything to anyone else. Day 50 made that especially clear through the shape of \'the house felt heavy with my mood\'.',
      journalTitle: 'The house felt heavy with my mood',
      journalTags: [
        'Triggered',
        'Anxious',
        'Body Heaviness',
        'Awareness',
        'Processing',
        'Survival'
      ],
      dailyReflectionAnswers: {
        day: 50,
        date: '2026-03-12',
        values: [
          {
            statement: 'There is a person, place, or thing that represents home to me.',
            answer: 'True'
          },
          {
            statement: 'There is an area of my life that feels destabilisingly uncertain.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I can envision what the integration of my conflicting parts would look like.',
            answer: 'True'
          },
          {
            statement: 'I can sit comfortably with the discomfort of not knowing.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I create ideal conditions for my best thinking.',
            answer: 'True'
          },
          {
            statement: 'I read people accurately through intuitive perception.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I negotiate well because I understand what each side needs.',
            answer: 'True'
          },
          {
            statement: 'I am drawn to systems that help me understand myself — astrology, psychology, typology.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'triggered',
        'anxious',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The wake-up feeling was basically \'the house felt heavy with my mood\'; before coffee or conversation I could already feel flooding gathering in my head.',
      morningWin: 'A quiet win today was that I could feel \'the house felt heavy with my mood\' and still stop performing for a few minutes and just be there.',
      morningChallenge: 'The hardest part of today was that \'the house felt heavy with my mood\' kept turning into grief that changed the temperature of everything.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'survival',
        'triggered',
        'awareness'
      ],
      eveningNote: 'By evening, \'the house felt heavy with my mood\' still felt true; I could tell the day had settled as flooding and left a trace in my head.',
      eveningWin: 'By evening, I could still pause before assuming the worst even though \'the house felt heavy with my mood\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'the house felt heavy with my mood\' kept echoing as a body memory that got ahead of language.',
      sleepHours: 8.3,
      dreamText: 'The dream kept changing before I could orient to it, and my body stayed alarmed even when the details shifted. The feeling connected back to \'the house felt heavy with my mood\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 4
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 51,
      date: '2026-03-13',
      promptResponse: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.\n\nWhat felt truest tonight was how quickly my body turned the whole day into a referendum on whether I am too much or not enough. Day 51 made that especially clear through the shape of \'i kept replaying everything after\'.',
      journalTitle: 'I kept replaying everything after',
      journalTags: [
        'Sad',
        'Self-Doubt',
        'Identity',
        'Hope',
        'Self-Reflection',
        'Healing'
      ],
      dailyReflectionAnswers: {
        day: 51,
        date: '2026-03-13',
        values: [
          {
            statement: 'Family — however I define it — is central to who I am.',
            answer: 'True'
          },
          {
            statement: 'A creative dream I set aside still whispers to me.',
            answer: 'True'
          },
          {
            statement: 'Being truly seen by someone feels natural and welcome to me.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'Some of my personas serve a genuine purpose while others are just armour.',
            answer: 'True'
          },
          {
            statement: 'I balance confidence with genuine humility.',
            answer: 'True'
          },
          {
            statement: 'I lead without needing to control.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I return to the same subject again and again because it captivates me.',
            answer: 'True'
          },
          {
            statement: 'I protect my attention as the finite resource it is.',
            answer: 'True'
          },
          {
            statement: 'I mentally replay certain life experiences more than others.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I feel physical pain at environmental destruction.',
            answer: 'True'
          },
          {
            statement: 'I feel physical discomfort in overly artificial environments.',
            answer: 'True'
          },
          {
            statement: 'I enjoy physical rituals — stretching, yoga, breathwork.',
            answer: 'True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'sad',
        'self_doubt',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'Woke up carrying the feeling of \'i kept replaying everything after\' before anything else happened; my body was already leaning toward dissociation.',
      morningWin: 'What I did right, despite \'i kept replaying everything after\', was speak more honestly than I usually do.',
      morningChallenge: 'My biggest challenge was how \'i kept replaying everything after\' opened the door to the fear that I was being judged.',
      eveningMood: 2,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'self_reflection',
        'healing',
        'triggered',
        'awareness'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'i kept replaying everything after\'; even while winding down I could feel dissociation sitting in my hips.',
      eveningWin: 'By evening, I could still let Lucas have the version of me that was present instead of perfect even though \'i kept replaying everything after\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i kept replaying everything after\' kept echoing as the urge to overexplain myself.',
      sleepHours: 5.5,
      dreamText: 'It felt like a body-memory dream more than a plot dream; the sensation was the real storyline. The feeling connected back to \'i kept replaying everything after\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 52,
      date: '2026-03-14',
      promptResponse: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.\n\nUnder the surface, I could feel the younger part of me still hoping someone would notice without my having to ask for that much care directly. Day 52 made that especially clear through the shape of \'some pain is quiet but constant\'.',
      journalTitle: 'Some pain is quiet but constant',
      journalTags: [
        'Lonely',
        'Heavy',
        'Caregiving',
        'Mental Load',
        'Self-Reflection',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 52,
        date: '2026-03-14',
        values: [
          {
            statement: 'I am living in a way I want to be remembered for.',
            answer: 'True'
          },
          {
            statement: 'The person I am and the person I want to be are growing closer together.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I ask for help instead of pushing through alone.',
            answer: 'True'
          },
          {
            statement: 'I am trying to satisfy opposing desires at the same time.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I apply my thinking strengths across new and unfamiliar domains.',
            answer: 'True'
          },
          {
            statement: 'I handle being wrong about a pattern I thought I saw with humility.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'People come to me for advice or emotional support.',
            answer: 'True'
          },
          {
            statement: 'I prefer deep one-on-one conversations over large groups.',
            answer: 'Somewhat'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'lonely',
        'heavy',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'The first thing I noticed this morning was how \'some pain is quiet but constant\' was still living in me; it landed as loneliness in my shoulders.',
      morningWin: 'Even with \'some pain is quiet but constant\' hanging over me, I still managed to stay softer with myself in one key moment.',
      morningChallenge: 'What stayed difficult all day was that \'some pain is quiet but constant\' kept feeding an old attachment ache.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'self_reflection',
        'home',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'I ended the day realizing \'some pain is quiet but constant\' had shaped more of it than I wanted; the residue was loneliness in my shoulders.',
      eveningWin: 'By evening, I could still leave one thing unfinished without punishing myself even though \'some pain is quiet but constant\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'some pain is quiet but constant\' kept echoing as the sense that I was too much and not enough at once.',
      sleepHours: 6.2,
      dreamText: 'I was in a room full of people again, trying to look normal while feeling unmistakably outside of the ease everyone else seemed to have. The feeling connected back to \'some pain is quiet but constant\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 4
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 53,
      date: '2026-03-15',
      promptResponse: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.\n\nThe thread underneath all of it was how hard it can be to stay on my own side when shame or comparison get activated. Day 53 made that especially clear through the shape of \'i am always watching for shifts in tone\'.',
      journalTitle: 'I am always watching for shifts in tone',
      journalTags: [
        'Overwhelmed',
        'Vulnerable',
        'Healing',
        'Rest',
        'Recovery',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 53,
        date: '2026-03-15',
        values: [
          {
            statement: 'I have given care that I am genuinely proud of.',
            answer: 'True'
          },
          {
            statement: 'I feel both free and responsible at the same time.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'My emotional life is actively evolving.',
            answer: 'True'
          },
          {
            statement: 'I have surprised myself by how much I\'ve changed.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I explain complex ideas clearly to people unfamiliar with the subject.',
            answer: 'True'
          },
          {
            statement: 'I operate from my focused self far more than my scattered self.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am drawn to philosophy, theology, or existential literature.',
            answer: 'True'
          },
          {
            statement: 'I feel more mentally clear after exercise.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'overwhelmed',
        'vulnerable',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'This morning had the mood of \'i am always watching for shifts in tone\'—I was scanning early and trying not to let embarrassment run the day.',
      morningWin: 'A quiet win today was that I could feel \'i am always watching for shifts in tone\' and still pause before assuming the worst.',
      morningChallenge: 'The hardest part of today was that \'i am always watching for shifts in tone\' kept turning into self-consciousness that made everything feel louder.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'recovery',
        'home',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'i am always watching for shifts in tone\', and my body held it as embarrassment around my throat.',
      eveningWin: 'By evening, I could still notice my body before it was screaming even though \'i am always watching for shifts in tone\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i am always watching for shifts in tone\' kept echoing as comparison that turned mean quickly.',
      sleepHours: 6.9,
      dreamText: 'Everyone in the dream heard the joke except me, and my embarrassment kept getting louder than the actual noise. The feeling connected back to \'i am always watching for shifts in tone\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 5
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 54,
      date: '2026-03-16',
      promptResponse: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.\n\nMore than anything, I needed gentleness that did not have to be earned first. Day 54 made that especially clear through the shape of \'i wanted to be less needy and more honest\'.',
      journalTitle: 'I wanted to be less needy and more honest',
      journalTags: [
        'Anxious',
        'Hurt',
        'Rejection',
        'Overthinking',
        'Rumination',
        'Emotional Pattern'
      ],
      dailyReflectionAnswers: {
        day: 54,
        date: '2026-03-16',
        values: [
          {
            statement: 'My relationship with risk has matured over time.',
            answer: 'True'
          },
          {
            statement: 'I belong to myself even when I don\'t fit a group.',
            answer: 'Somewhat'
          },
          {
            statement: 'Past setbacks have redirected me toward something better.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I bring a specific energy to a room, and it\'s intentional.',
            answer: 'True'
          },
          {
            statement: 'I carry shame that protects something vulnerable in me.',
            answer: 'True'
          },
          {
            statement: 'Sitting with my darkest feelings reveals something I need to see.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I pay attention to things I usually overlook.',
            answer: 'True'
          },
          {
            statement: 'I remember how people made me feel more than what they said.',
            answer: 'True'
          },
          {
            statement: 'My mood positively influences how I approach obstacles.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'Physical touch is an important part of how I connect with people.',
            answer: 'True'
          },
          {
            statement: 'I express emotions through body language and gesture.',
            answer: 'True'
          },
          {
            statement: 'I use music therapeutically — to regulate, energise, or ground myself.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'anxious',
        'hurt',
        'grief',
        'tenderness'
      ],
      morningNote: 'I started the day with \'i wanted to be less needy and more honest\' sitting close to the surface, which made my solar_plexus feel charged with grief.',
      morningWin: 'What I did right, despite \'i wanted to be less needy and more honest\', was let Lucas have the version of me that was present instead of perfect.',
      morningChallenge: 'My biggest challenge was how \'i wanted to be less needy and more honest\' opened the door to a body memory that got ahead of language.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'rumination',
        'emotional_pattern',
        'loss',
        'ache'
      ],
      eveningNote: 'The evening version of today was \'i wanted to be less needy and more honest\'; underneath everything else I was still carrying grief in my solar_plexus.',
      eveningWin: 'By evening, I could still come back to the moment instead of spiraling all the way out even though \'i wanted to be less needy and more honest\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i wanted to be less needy and more honest\' kept echoing as the feeling of being outside the room even while in it.',
      sleepHours: 7.6,
      dreamText: 'I woke up with the sense that grief had been the weather system underneath the dream. The feeling connected back to \'i wanted to be less needy and more honest\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'grieving',
          intensity: 4
        },
        {
          id: 'heavy',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'grief',
        awakenState: 'emotional',
        recurring: false
      }
    },
    {
      day: 55,
      date: '2026-03-17',
      promptResponse: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.\n\nWhat hurt most was how ordinary the trigger looked from the outside compared with how total it felt inside me. Day 55 made that especially clear through the shape of \'the foster care stress lives in my body\'.',
      journalTitle: 'The foster care stress lives in my body',
      journalTags: [
        'Ashamed',
        'Anxious',
        'Misunderstood',
        'Processing',
        'Mental Load',
        'Self-Doubt'
      ],
      dailyReflectionAnswers: {
        day: 55,
        date: '2026-03-17',
        values: [
          {
            statement: 'Asking for help is something I do when I need it.',
            answer: 'True'
          },
          {
            statement: 'I can make confident choices between two things that both matter.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I reveal my true self slowly and deliberately to new people.',
            answer: 'True'
          },
          {
            statement: 'I handle the discomfort of asking for help.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'Specific communication styles trigger frustration in me.',
            answer: 'True'
          },
          {
            statement: 'My trust in my own intuition has grown over the years.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I feel that silence and stillness reveal truths that activity cannot.',
            answer: 'True'
          },
          {
            statement: 'I am deeply self-motivated — external encouragement is nice but not necessary.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'ashamed',
        'anxious',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The wake-up feeling was basically \'the foster care stress lives in my body\'; before coffee or conversation I could already feel dissociation gathering in my hips.',
      morningWin: 'Even with \'the foster care stress lives in my body\' hanging over me, I still managed to leave one thing unfinished without punishing myself.',
      morningChallenge: 'What stayed difficult all day was that \'the foster care stress lives in my body\' kept feeding the urge to overexplain myself.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'mental_load',
        'self_doubt',
        'triggered',
        'awareness'
      ],
      eveningNote: 'By evening, \'the foster care stress lives in my body\' still felt true; I could tell the day had settled as dissociation and left a trace in my hips.',
      eveningWin: 'By evening, I could still protect a small pocket of quiet even though \'the foster care stress lives in my body\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'the foster care stress lives in my body\' kept echoing as caregiving depletion I could not hide from myself.',
      sleepHours: 8.3,
      dreamText: 'My body reacted first in the dream and the meaning arrived later, which made the whole thing feel older than the actual scene. The feeling connected back to \'the foster care stress lives in my body\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 56,
      date: '2026-03-18',
      promptResponse: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.\n\nI can tell this is one of the patterns I most want to heal because it still reaches me before I have language. Day 56 made that especially clear through the shape of \'sometimes care feels invisible unless i collapse\'.',
      journalTitle: 'Sometimes care feels invisible unless I collapse',
      journalTags: [
        'Exhausted',
        'Parenting',
        'Caregiving',
        'Low Energy',
        'Tired',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 56,
        date: '2026-03-18',
        values: [
          {
            statement: 'I treat my physical health as a foundation, not an afterthought.',
            answer: 'True'
          },
          {
            statement: 'A lesson keeps returning to me because I haven\'t fully learned it yet.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I turn my insights into action rather than staying in my head.',
            answer: 'True'
          },
          {
            statement: 'I balance my desire for newness with appreciation for what I already have.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I engage most deeply in learning experiences that are hands-on and immersive.',
            answer: 'True'
          },
          {
            statement: 'I invite serendipity into my thinking process.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I find comfort in the rhythm and sound of words.',
            answer: 'True'
          },
          {
            statement: 'I can reproduce a rhythm after hearing it once.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'exhausted',
        'parenting',
        'Naomi',
        'attachment'
      ],
      morningNote: 'Woke up carrying the feeling of \'sometimes care feels invisible unless i collapse\' before anything else happened; my body was already leaning toward ache.',
      morningWin: 'A quiet win today was that I could feel \'sometimes care feels invisible unless i collapse\' and still notice my body before it was screaming.',
      morningChallenge: 'The hardest part of today was that \'sometimes care feels invisible unless i collapse\' kept turning into the sense that I was too much and not enough at once.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'tired',
        'home',
        'loss',
        'longing'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'sometimes care feels invisible unless i collapse\'; even while winding down I could feel ache sitting in my throat.',
      eveningWin: 'By evening, I could still name the actual feeling instead of only the secondary one even though \'sometimes care feels invisible unless i collapse\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'sometimes care feels invisible unless i collapse\' kept echoing as grief that changed the temperature of everything.',
      sleepHours: 5.5,
      dreamText: 'I was trying to keep Naomi close while also knowing, even in the dream, that I could not stop the leaving. The feeling connected back to \'sometimes care feels invisible unless i collapse\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'longing',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'naomi',
        awakenState: 'emotional',
        recurring: true
      }
    },
    {
      day: 57,
      date: '2026-03-19',
      promptResponse: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.\n\nEven in the hardest part of it, I could feel how much I want connection without having to abandon myself to keep it. Day 57 made that especially clear through the shape of \'i felt behind all day\'.',
      journalTitle: 'I felt behind all day',
      journalTags: [
        'Lonely',
        'Hurt',
        'Attachment',
        'Distance',
        'Repair',
        'Connection'
      ],
      dailyReflectionAnswers: {
        day: 57,
        date: '2026-03-19',
        values: [
          {
            statement: 'I navigate the tension between security and adventure with clarity.',
            answer: 'True'
          },
          {
            statement: 'A key relationship has shaped who I am today.',
            answer: 'True'
          },
          {
            statement: 'I have expressed who I truly am in brave ways.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'My rebellious streak is constructive rather than destructive.',
            answer: 'True'
          },
          {
            statement: 'I step up when no one else will.',
            answer: 'True'
          },
          {
            statement: 'A single conversation has profoundly transformed how I see myself.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I know when I have truly learned from an experience.',
            answer: 'True'
          },
          {
            statement: 'My memories of important events have changed and evolved over time.',
            answer: 'True'
          },
          {
            statement: 'I evaluate the credibility of new information sources carefully.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I prefer natural or earth-toned aesthetics in my surroundings.',
            answer: 'True'
          },
          {
            statement: 'I notice when my life feels meaningful and when it does not.',
            answer: 'True'
          },
          {
            statement: 'Reading is one of my favourite ways to spend time.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'lonely',
        'hurt',
        'overthinking',
        'sensitivity'
      ],
      morningNote: 'The first thing I noticed this morning was how \'i felt behind all day\' was still living in me; it landed as anxiety in my head.',
      morningWin: 'What I did right, despite \'i felt behind all day\', was come back to the moment instead of spiraling all the way out.',
      morningChallenge: 'My biggest challenge was how \'i felt behind all day\' opened the door to comparison that turned mean quickly.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'repair',
        'connection',
        'processing',
        'fatigue'
      ],
      eveningNote: 'I ended the day realizing \'i felt behind all day\' had shaped more of it than I wanted; the residue was anxiety in my head.',
      eveningWin: 'By evening, I could still stop performing for a few minutes and just be there even though \'i felt behind all day\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i felt behind all day\' kept echoing as the fear that I was being judged.',
      sleepHours: 6.2,
      dreamText: 'The dream was ordinary on the surface and overwhelming underneath, which felt very familiar. The feeling connected back to \'i felt behind all day\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'anxious',
          intensity: 5
        },
        {
          id: 'tired',
          intensity: 4
        },
        {
          id: 'exposed',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'default',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 58,
      date: '2026-03-20',
      promptResponse: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.\n\nThere was also a quiet strength in being honest about it instead of pretending I was less affected than I really was. Day 58 made that especially clear through the shape of \'the day asked too much from me\'.',
      journalTitle: 'The day asked too much from me',
      journalTags: [
        'Sad',
        'Family',
        'Memory',
        'Hurt',
        'Processing',
        'Inner Child'
      ],
      dailyReflectionAnswers: {
        day: 58,
        date: '2026-03-20',
        values: [
          {
            statement: 'I feel creatively alive on a regular basis.',
            answer: 'True'
          },
          {
            statement: 'I offer compassion without absorbing others\' suffering.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I express power without dominating others.',
            answer: 'True'
          },
          {
            statement: 'There is a system in my life that needs disrupting.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I prefer having a clear recommendation over many open options.',
            answer: 'True'
          },
          {
            statement: 'I have effective techniques for staying focused during long discussions.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'Writing helps me discover what I actually think.',
            answer: 'True'
          },
          {
            statement: 'I feel deeply connected to the people in my life.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'sad',
        'family',
        'history',
        'belonging'
      ],
      morningNote: 'This morning had the mood of \'the day asked too much from me\'—I was scanning early and trying not to let exclusion run the day.',
      morningWin: 'Even with \'the day asked too much from me\' hanging over me, I still managed to protect a small pocket of quiet.',
      morningChallenge: 'What stayed difficult all day was that \'the day asked too much from me\' kept feeding the feeling of being outside the room even while in it.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'inner_child',
        'old_pain',
        'exclusion'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'the day asked too much from me\', and my body held it as exclusion around my face.',
      eveningWin: 'By evening, I could still speak more honestly than I usually do even though \'the day asked too much from me\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'the day asked too much from me\' kept echoing as an old attachment ache.',
      sleepHours: 6.9,
      dreamText: 'The family setting in the dream felt familiar and off at the same time, like I knew the rules but never quite belonged inside them. The feeling connected back to \'the day asked too much from me\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'excluded',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'small',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'family',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 59,
      date: '2026-03-21',
      promptResponse: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.\n\nI keep noticing how often loneliness hides underneath what first looks like irritability, awkwardness, or overthinking. Day 59 made that especially clear through the shape of \'i wanted home to feel softer\'.',
      journalTitle: 'I wanted home to feel softer',
      journalTags: [
        'Frustrated',
        'Misunderstood',
        'Disconnected',
        'Sensory Overload',
        'Mental Load',
        'Awareness'
      ],
      dailyReflectionAnswers: {
        day: 59,
        date: '2026-03-21',
        values: [
          {
            statement: 'My life has a clear direction right now.',
            answer: 'True'
          },
          {
            statement: 'I know the difference between excellence and perfectionism.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I define myself by more than my job title or social labels.',
            answer: 'True'
          },
          {
            statement: 'I stay connected to community while maintaining my radical independence.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I fact-check my own assumptions before accepting them.',
            answer: 'True'
          },
          {
            statement: 'Time pressure improves rather than impairs my decision quality.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'Physical mastery gives me a deep sense of accomplishment.',
            answer: 'True'
          },
          {
            statement: 'I think about the meaning of life more than most people.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'frustrated',
        'misunderstood',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'I started the day with \'i wanted home to feel softer\' sitting close to the surface, which made my face feel charged with rejection.',
      morningWin: 'A quiet win today was that I could feel \'i wanted home to feel softer\' and still name the actual feeling instead of only the secondary one.',
      morningChallenge: 'The hardest part of today was that \'i wanted home to feel softer\' kept turning into caregiving depletion I could not hide from myself.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'mental_load',
        'awareness',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'The evening version of today was \'i wanted home to feel softer\'; underneath everything else I was still carrying rejection in my face.',
      eveningWin: 'By evening, I could still stay softer with myself in one key moment even though \'i wanted home to feel softer\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i wanted home to feel softer\' kept echoing as self-consciousness that made everything feel louder.',
      sleepHours: 7.6,
      dreamText: 'The dream made every social moment feel like a test I had not studied for. The feeling connected back to \'i wanted home to feel softer\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 5
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 60,
      date: '2026-03-22',
      promptResponse: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.\n\nWhat I wish for most is to feel at home in myself before I have to prove anything to anyone else. Day 60 made that especially clear through the shape of \'i notice rejection before i notice safety\'.',
      journalTitle: 'I notice rejection before I notice safety',
      journalTags: [
        'Lonely',
        'Attachment',
        'Closeness',
        'Distance',
        'Overthinking',
        'Love'
      ],
      dailyReflectionAnswers: {
        day: 60,
        date: '2026-03-22',
        values: [
          {
            statement: 'My relationship with the seasons reflects something true about my inner life.',
            answer: 'True'
          },
          {
            statement: 'I stay true to my ethics even when they conflict with social norms.',
            answer: 'True'
          },
          {
            statement: 'I reach for healthy things first when I feel overwhelmed.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'My analytical mind both serves and limits me.',
            answer: 'True'
          },
          {
            statement: 'I nurture the parts of myself that cannot be measured.',
            answer: 'True'
          },
          {
            statement: 'My rebellious energy has matured over time.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I build arguments using logic rather than emotion or narrative.',
            answer: 'True'
          },
          {
            statement: 'I redirect my attention when my mind wanders during something important.',
            answer: 'True'
          },
          {
            statement: 'I nurture ideas from initial spark all the way to fully formed concepts.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I can quickly estimate whether a claim is plausible based on numbers.',
            answer: 'Somewhat'
          },
          {
            statement: 'I enjoy physical improvisation — free movement, contact improv, play.',
            answer: 'True'
          },
          {
            statement: 'I feel emotionally mature compared to others my age.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'lonely',
        'attachment',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The wake-up feeling was basically \'i notice rejection before i notice safety\'; before coffee or conversation I could already feel alarm gathering in my head.',
      morningWin: 'What I did right, despite \'i notice rejection before i notice safety\', was stop performing for a few minutes and just be there.',
      morningChallenge: 'My biggest challenge was how \'i notice rejection before i notice safety\' opened the door to grief that changed the temperature of everything.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'overthinking',
        'love',
        'triggered',
        'awareness'
      ],
      eveningNote: 'By evening, \'i notice rejection before i notice safety\' still felt true; I could tell the day had settled as alarm and left a trace in my head.',
      eveningWin: 'By evening, I could still pause before assuming the worst even though \'i notice rejection before i notice safety\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i notice rejection before i notice safety\' kept echoing as a body memory that got ahead of language.',
      sleepHours: 8.3,
      dreamText: 'It felt like a body-memory dream more than a plot dream; the sensation was the real storyline. The feeling connected back to \'i notice rejection before i notice safety\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 4
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 61,
      date: '2026-03-23',
      promptResponse: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.\n\nWhat felt truest tonight was how quickly my body turned the whole day into a referendum on whether I am too much or not enough. Day 61 made that especially clear through the shape of \'i do not know how to stop comparing\'.',
      journalTitle: 'I do not know how to stop comparing',
      journalTags: [
        'Anxious',
        'Sensitive',
        'Self-Doubt',
        'Rejection',
        'Overthinking',
        'Processing'
      ],
      dailyReflectionAnswers: {
        day: 61,
        date: '2026-03-23',
        values: [
          {
            statement: 'I feel deeply aligned with my sense of purpose.',
            answer: 'True'
          },
          {
            statement: 'I feel proud of the person I am becoming.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I play an unofficial role in my family that was never assigned to me.',
            answer: 'True'
          },
          {
            statement: 'I am befriending parts of myself I was taught to suppress.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I direct attention to my inner life even during a busy day.',
            answer: 'True'
          },
          {
            statement: 'I store and retrieve memories of important conversations accurately.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I experience music as colours, textures, or images.',
            answer: 'True'
          },
          {
            statement: 'I compose or improvise music in my head.',
            answer: 'True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'anxious',
        'sensitive',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'Woke up carrying the feeling of \'i do not know how to stop comparing\' before anything else happened; my body was already leaning toward fear.',
      morningWin: 'Even with \'i do not know how to stop comparing\' hanging over me, I still managed to speak more honestly than I usually do.',
      morningChallenge: 'What stayed difficult all day was that \'i do not know how to stop comparing\' kept feeding the fear that I was being judged.',
      eveningMood: 2,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'overthinking',
        'processing',
        'triggered',
        'awareness'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'i do not know how to stop comparing\'; even while winding down I could feel fear sitting in my hips.',
      eveningWin: 'By evening, I could still let Lucas have the version of me that was present instead of perfect even though \'i do not know how to stop comparing\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i do not know how to stop comparing\' kept echoing as the urge to overexplain myself.',
      sleepHours: 5.5,
      dreamText: 'My body reacted first in the dream and the meaning arrived later, which made the whole thing feel older than the actual scene. The feeling connected back to \'i do not know how to stop comparing\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 62,
      date: '2026-03-24',
      promptResponse: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.\n\nUnder the surface, I could feel the younger part of me still hoping someone would notice without my having to ask for that much care directly. Day 62 made that especially clear through the shape of \'a dream stayed in my chest all morning\'.',
      journalTitle: 'A dream stayed in my chest all morning',
      journalTags: [
        'Guarded',
        'Sensitive',
        'Self-Doubt',
        'Identity',
        'Awareness',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 62,
        date: '2026-03-24',
        values: [
          {
            statement: 'I manage compassion fatigue by actively replenishing myself.',
            answer: 'True'
          },
          {
            statement: 'I create rituals and traditions that bring the people I love together.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I sometimes need to rebel against my own rebel.',
            answer: 'True'
          },
          {
            statement: 'My need for freedom affects my ability to commit.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'My unconventional thinking approach serves me well even when it isn\'t rewarded.',
            answer: 'True'
          },
          {
            statement: 'I retain the key points from long conversations accurately.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I have a detailed mental model of how my own mind works.',
            answer: 'True'
          },
          {
            statement: 'I can look at a flat pattern and imagine the 3D object it creates.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'guarded',
        'sensitive',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'The first thing I noticed this morning was how \'a dream stayed in my chest all morning\' was still living in me; it landed as self-consciousness in my shoulders.',
      morningWin: 'A quiet win today was that I could feel \'a dream stayed in my chest all morning\' and still stay softer with myself in one key moment.',
      morningChallenge: 'The hardest part of today was that \'a dream stayed in my chest all morning\' kept turning into an old attachment ache.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'awareness',
        'home',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'I ended the day realizing \'a dream stayed in my chest all morning\' had shaped more of it than I wanted; the residue was self-consciousness in my shoulders.',
      eveningWin: 'By evening, I could still leave one thing unfinished without punishing myself even though \'a dream stayed in my chest all morning\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'a dream stayed in my chest all morning\' kept echoing as the sense that I was too much and not enough at once.',
      sleepHours: 6.2,
      dreamText: 'The dream made every social moment feel like a test I had not studied for. The feeling connected back to \'a dream stayed in my chest all morning\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 4
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 63,
      date: '2026-03-25',
      promptResponse: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.\n\nThe thread underneath all of it was how hard it can be to stay on my own side when shame or comparison get activated. Day 63 made that especially clear through the shape of \'i felt both protective and depleted\'.',
      journalTitle: 'I felt both protective and depleted',
      journalTags: [
        'Ashamed',
        'Frustrated',
        'Misunderstood',
        'Sensory Overload',
        'Mental Load',
        'Awareness'
      ],
      dailyReflectionAnswers: {
        day: 63,
        date: '2026-03-25',
        values: [
          {
            statement: 'I celebrate belonging when I have it rather than taking it for granted.',
            answer: 'True'
          },
          {
            statement: 'I would benefit from a conversation with a wise mentor.',
            answer: 'True'
          },
          {
            statement: 'I can distinguish between healthy solitude and unhealthy isolation.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'A transformation that scared me turned out beautifully.',
            answer: 'True'
          },
          {
            statement: 'I can discern truth from comfortable illusion.',
            answer: 'True'
          },
          {
            statement: 'An emerging part of myself genuinely excites me.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'My thinking style has shaped my career or life path significantly.',
            answer: 'True'
          },
          {
            statement: 'I actively cultivate and develop my intuitive sense.',
            answer: 'True'
          },
          {
            statement: 'I balance pattern recognition with remaining open to exceptions.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I notice logical errors in arguments other people make.',
            answer: 'True'
          },
          {
            statement: 'I believe inner growth is the most important work a person can do.',
            answer: 'True'
          },
          {
            statement: 'I use past experiences to make better future decisions.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'ashamed',
        'frustrated',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'This morning had the mood of \'i felt both protective and depleted\'—I was scanning early and trying not to let shame run the day.',
      morningWin: 'What I did right, despite \'i felt both protective and depleted\', was pause before assuming the worst.',
      morningChallenge: 'My biggest challenge was how \'i felt both protective and depleted\' opened the door to self-consciousness that made everything feel louder.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'mental_load',
        'awareness',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'i felt both protective and depleted\', and my body held it as shame around my throat.',
      eveningWin: 'By evening, I could still notice my body before it was screaming even though \'i felt both protective and depleted\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i felt both protective and depleted\' kept echoing as comparison that turned mean quickly.',
      sleepHours: 6.9,
      dreamText: 'The dream turned every conversation into subtitles that vanished before I could finish reading them. The feeling connected back to \'i felt both protective and depleted\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 5
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 64,
      date: '2026-03-26',
      promptResponse: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.\n\nMore than anything, I needed gentleness that did not have to be earned first. Day 64 made that especially clear through the shape of \'i wanted someone to understand without explanation\'.',
      journalTitle: 'I wanted someone to understand without explanation',
      journalTags: [
        'Sad',
        'Grief',
        'Loss',
        'Memory',
        'Processing',
        'Inner Child'
      ],
      dailyReflectionAnswers: {
        day: 64,
        date: '2026-03-26',
        values: [
          {
            statement: 'I can clearly distinguish between my wants and my needs.',
            answer: 'True'
          },
          {
            statement: 'I handle disagreements with people I care about in a healthy way.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'An inner contradiction is a defining part of who I am.',
            answer: 'True'
          },
          {
            statement: 'My inner fire is alive and burning.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I handle choices with no clear right answer without becoming paralysed.',
            answer: 'True'
          },
          {
            statement: 'I summarise complex information for myself effectively.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I enjoy the physicality of nature — climbing, swimming, hiking.',
            answer: 'True'
          },
          {
            statement: 'I am fascinated by the history and origin of words.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'low',
      morningTags: [
        'sad',
        'grief',
        'tenderness',
        'memory'
      ],
      morningNote: 'I started the day with \'i wanted someone to understand without explanation\' sitting close to the surface, which made my solar_plexus feel charged with heaviness.',
      morningWin: 'Even with \'i wanted someone to understand without explanation\' hanging over me, I still managed to let Lucas have the version of me that was present instead of perfect.',
      morningChallenge: 'What stayed difficult all day was that \'i wanted someone to understand without explanation\' kept feeding a body memory that got ahead of language.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'low',
      eveningTags: [
        'processing',
        'inner_child',
        'loss',
        'ache'
      ],
      eveningNote: 'The evening version of today was \'i wanted someone to understand without explanation\'; underneath everything else I was still carrying heaviness in my solar_plexus.',
      eveningWin: 'By evening, I could still come back to the moment instead of spiraling all the way out even though \'i wanted someone to understand without explanation\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i wanted someone to understand without explanation\' kept echoing as the feeling of being outside the room even while in it.',
      sleepHours: 7.6,
      dreamText: 'The dream held grief quietly rather than dramatically; everything looked normal, but there was a low ache under the whole scene. The feeling connected back to \'i wanted someone to understand without explanation\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'grieving',
          intensity: 4
        },
        {
          id: 'heavy',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'grief',
        awakenState: 'emotional',
        recurring: false
      }
    },
    {
      day: 65,
      date: '2026-03-27',
      promptResponse: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.\n\nWhat hurt most was how ordinary the trigger looked from the outside compared with how total it felt inside me. Day 65 made that especially clear through the shape of \'i can feel how badly i want repair\'.',
      journalTitle: 'I can feel how badly I want repair',
      journalTags: [
        'Ashamed',
        'Self-Doubt',
        'Identity',
        'Acceptance',
        'Overthinking',
        'Self-Reflection'
      ],
      dailyReflectionAnswers: {
        day: 65,
        date: '2026-03-27',
        values: [
          {
            statement: 'I handle repeated boundary violations with firmness and clarity.',
            answer: 'True'
          },
          {
            statement: 'I am able to forgive even when the other person isn\'t sorry.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I navigate the soul\'s seasons — growth, decay, dormancy, rebirth — with awareness.',
            answer: 'True'
          },
          {
            statement: 'I have a complex relationship with authority figures.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I do my deepest work during a specific, consistent time of day.',
            answer: 'True'
          },
          {
            statement: 'Nostalgia plays a meaningful role in my thinking.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I can recognise the difference between what I feel and what I think.',
            answer: 'True'
          },
          {
            statement: 'I look for cause-and-effect relationships in what happens around me.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'ashamed',
        'self_doubt',
        'comparison',
        'self_image'
      ],
      morningNote: 'The wake-up feeling was basically \'i can feel how badly i want repair\'; before coffee or conversation I could already feel shame gathering in my face.',
      morningWin: 'A quiet win today was that I could feel \'i can feel how badly i want repair\' and still leave one thing unfinished without punishing myself.',
      morningChallenge: 'The hardest part of today was that \'i can feel how badly i want repair\' kept turning into the urge to overexplain myself.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'overthinking',
        'self_reflection',
        'inferiority',
        'shame'
      ],
      eveningNote: 'By evening, \'i can feel how badly i want repair\' still felt true; I could tell the day had settled as shame and left a trace in my face.',
      eveningWin: 'By evening, I could still protect a small pocket of quiet even though \'i can feel how badly i want repair\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i can feel how badly i want repair\' kept echoing as caregiving depletion I could not hide from myself.',
      sleepHours: 8.3,
      dreamText: 'I kept noticing other women in the dream and turning them into evidence against myself. The feeling connected back to \'i can feel how badly i want repair\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'ashamed',
          intensity: 5
        },
        {
          id: 'small',
          intensity: 4
        },
        {
          id: 'envious',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'comparison',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 66,
      date: '2026-03-28',
      promptResponse: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.\n\nI can tell this is one of the patterns I most want to heal because it still reaches me before I have language. Day 66 made that especially clear through the shape of \'being misunderstood hit me harder than it should have\'.',
      journalTitle: 'Being misunderstood hit me harder than it should have',
      journalTags: [
        'Sad',
        'Attachment',
        'Loss',
        'Parenting',
        'Caregiving',
        'Memory'
      ],
      dailyReflectionAnswers: {
        day: 66,
        date: '2026-03-28',
        values: [
          {
            statement: 'I have made peace with things I wish I could tell my younger self.',
            answer: 'True'
          },
          {
            statement: 'Someone specific taught me the most about caring for others.',
            answer: 'True'
          },
          {
            statement: 'I feel most like myself when I follow my own instincts.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'Some of my caring is performed rather than genuinely felt.',
            answer: 'True'
          },
          {
            statement: 'Part of my potential remains unlived.',
            answer: 'True'
          },
          {
            statement: 'My past self still influences my present choices.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I trust counterintuitive decisions that go against conventional wisdom.',
            answer: 'True'
          },
          {
            statement: 'Unexpected things capture my attention involuntarily.',
            answer: 'True'
          },
          {
            statement: 'I use an analytical framework — even an informal one — in daily life.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'Poetry or lyrical writing moves me deeply.',
            answer: 'True'
          },
          {
            statement: 'I use specific music to access certain memories or emotional states.',
            answer: 'True'
          },
          {
            statement: 'I notice inefficiencies in processes and systems.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'sad',
        'attachment',
        'Naomi',
        'grief'
      ],
      morningNote: 'Woke up carrying the feeling of \'being misunderstood hit me harder than it should have\' before anything else happened; my body was already leaning toward longing.',
      morningWin: 'What I did right, despite \'being misunderstood hit me harder than it should have\', was notice my body before it was screaming.',
      morningChallenge: 'My biggest challenge was how \'being misunderstood hit me harder than it should have\' opened the door to the sense that I was too much and not enough at once.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'caregiving',
        'memory',
        'loss',
        'longing'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'being misunderstood hit me harder than it should have\'; even while winding down I could feel longing sitting in my throat.',
      eveningWin: 'By evening, I could still name the actual feeling instead of only the secondary one even though \'being misunderstood hit me harder than it should have\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'being misunderstood hit me harder than it should have\' kept echoing as grief that changed the temperature of everything.',
      sleepHours: 5.5,
      dreamText: 'The dream let me have Naomi back for a minute and then reminded me that love does not undo loss. The feeling connected back to \'being misunderstood hit me harder than it should have\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'longing',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'naomi',
        awakenState: 'emotional',
        recurring: true
      }
    },
    {
      day: 67,
      date: '2026-03-29',
      promptResponse: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.\n\nEven in the hardest part of it, I could feel how much I want connection without having to abandon myself to keep it. Day 67 made that especially clear through the shape of \'i am trying not to harden\'.',
      journalTitle: 'I am trying not to harden',
      journalTags: [
        'Heavy',
        'Exhausted',
        'Low Energy',
        'Body Heaviness',
        'Mental Load',
        'Sleep'
      ],
      dailyReflectionAnswers: {
        day: 67,
        date: '2026-03-29',
        values: [
          {
            statement: 'A wounded part of me needs tenderness that I haven\'t fully given it.',
            answer: 'True'
          },
          {
            statement: 'I choose purpose over comfort when it matters.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'My seeking nature comes at a real cost to my relationships.',
            answer: 'True'
          },
          {
            statement: 'I would tear down something old to build something better.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I use self-observation to make better choices.',
            answer: 'True'
          },
          {
            statement: 'I approach personal problems differently than work problems.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I notice when someone needs support even before they ask.',
            answer: 'True'
          },
          {
            statement: 'I am drawn to photography, film, or visual storytelling.',
            answer: 'True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'heavy',
        'exhausted',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The first thing I noticed this morning was how \'i am trying not to harden\' was still living in me; it landed as dissociation in my hips.',
      morningWin: 'Even with \'i am trying not to harden\' hanging over me, I still managed to come back to the moment instead of spiraling all the way out.',
      morningChallenge: 'What stayed difficult all day was that \'i am trying not to harden\' kept feeding comparison that turned mean quickly.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'mental_load',
        'sleep',
        'triggered',
        'awareness'
      ],
      eveningNote: 'I ended the day realizing \'i am trying not to harden\' had shaped more of it than I wanted; the residue was dissociation in my hips.',
      eveningWin: 'By evening, I could still stop performing for a few minutes and just be there even though \'i am trying not to harden\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i am trying not to harden\' kept echoing as the fear that I was being judged.',
      sleepHours: 6.2,
      dreamText: 'My body reacted first in the dream and the meaning arrived later, which made the whole thing feel older than the actual scene. The feeling connected back to \'i am trying not to harden\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 68,
      date: '2026-03-30',
      promptResponse: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.\n\nThere was also a quiet strength in being honest about it instead of pretending I was less affected than I really was. Day 68 made that especially clear through the shape of \'the sadness sat behind everything today\'.',
      journalTitle: 'The sadness sat behind everything today',
      journalTags: [
        'Lonely',
        'Attachment',
        'Support',
        'Closeness',
        'Vulnerable',
        'Connection'
      ],
      dailyReflectionAnswers: {
        day: 68,
        date: '2026-03-30',
        values: [
          {
            statement: 'I feel fully authentic in the most important areas of my life.',
            answer: 'True'
          },
          {
            statement: 'I hold opinions that most people around me would disagree with.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I am letting go of the need for internal consistency.',
            answer: 'True'
          },
          {
            statement: 'There is something I would defend even if I were the only one standing.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I generate new ideas even when I feel stuck.',
            answer: 'True'
          },
          {
            statement: 'I approach new problems with a clear go-to method.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I understand my own defence mechanisms.',
            answer: 'True'
          },
          {
            statement: 'I feel responsible for the emotional well-being of those around me.',
            answer: 'True'
          }
        ]
      },
      morningMood: 5,
      morningEnergy: 'medium',
      morningStress: 'medium',
      morningTags: [
        'lonely',
        'attachment',
        'overthinking',
        'sensitivity'
      ],
      morningNote: 'This morning had the mood of \'the sadness sat behind everything today\'—I was scanning early and trying not to let longing run the day.',
      morningWin: 'A quiet win today was that I could feel \'the sadness sat behind everything today\' and still protect a small pocket of quiet.',
      morningChallenge: 'The hardest part of today was that \'the sadness sat behind everything today\' kept turning into the feeling of being outside the room even while in it.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'vulnerable',
        'connection',
        'processing',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'the sadness sat behind everything today\', and my body held it as longing around my throat.',
      eveningWin: 'By evening, I could still speak more honestly than I usually do even though \'the sadness sat behind everything today\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'the sadness sat behind everything today\' kept echoing as an old attachment ache.',
      sleepHours: 6.9,
      dreamText: 'I woke up from a dream where every small thing took more effort than it should have. The feeling connected back to \'the sadness sat behind everything today\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'anxious',
          intensity: 4
        },
        {
          id: 'tired',
          intensity: 4
        },
        {
          id: 'exposed',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'default',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 69,
      date: '2026-03-31',
      promptResponse: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.\n\nI keep noticing how often loneliness hides underneath what first looks like irritability, awkwardness, or overthinking. Day 69 made that especially clear through the shape of \'i can feel how much performance costs me\'.',
      journalTitle: 'I can feel how much performance costs me',
      journalTags: [
        'Sensitive',
        'Guarded',
        'Self-Doubt',
        'Awareness',
        'Processing',
        'Safety'
      ],
      dailyReflectionAnswers: {
        day: 69,
        date: '2026-03-31',
        values: [
          {
            statement: 'Trust builds slowly in me, but it builds solidly.',
            answer: 'True'
          },
          {
            statement: 'I am clear about which commitments truly deserve my energy.',
            answer: 'True'
          },
          {
            statement: 'I have experienced what unconditional acceptance feels like.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I listen to the quiet voice beneath all the noise.',
            answer: 'True'
          },
          {
            statement: 'Jealousy has shown me something important about my true desires.',
            answer: 'True'
          },
          {
            statement: 'I disown parts of myself in public settings.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I perform at my cognitive best when I feel psychologically safe.',
            answer: 'True'
          },
          {
            statement: 'I filter what to pay attention to and what to ignore efficiently.',
            answer: 'True'
          },
          {
            statement: 'I reframe uncertainty as possibility and openness.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I think about whether time is real or constructed.',
            answer: 'True'
          },
          {
            statement: 'I am fascinated by animal behaviour and consciousness.',
            answer: 'True'
          },
          {
            statement: 'I am curious about the relationship between mind and brain.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'sensitive',
        'guarded',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'I started the day with \'i can feel how much performance costs me\' sitting close to the surface, which made my face feel charged with anxiety.',
      morningWin: 'What I did right, despite \'i can feel how much performance costs me\', was name the actual feeling instead of only the secondary one.',
      morningChallenge: 'My biggest challenge was how \'i can feel how much performance costs me\' opened the door to caregiving depletion I could not hide from myself.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'high',
      eveningTags: [
        'processing',
        'safety',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'The evening version of today was \'i can feel how much performance costs me\'; underneath everything else I was still carrying anxiety in my face.',
      eveningWin: 'By evening, I could still stay softer with myself in one key moment even though \'i can feel how much performance costs me\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i can feel how much performance costs me\' kept echoing as self-consciousness that made everything feel louder.',
      sleepHours: 7.6,
      dreamText: 'I kept entering conversations a beat too late in the dream and reading that as proof I did not belong. The feeling connected back to \'i can feel how much performance costs me\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 5
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 70,
      date: '2026-04-01',
      promptResponse: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.\n\nWhat I wish for most is to feel at home in myself before I have to prove anything to anyone else. Day 70 made that especially clear through the shape of \'i needed permission to stop\'.',
      journalTitle: 'I needed permission to stop',
      journalTags: [
        'Triggered',
        'Anxious',
        'Body Heaviness',
        'Awareness',
        'Processing',
        'Survival'
      ],
      dailyReflectionAnswers: {
        day: 70,
        date: '2026-04-01',
        values: [
          {
            statement: 'I handle creative blocks with patience and curiosity.',
            answer: 'True'
          },
          {
            statement: 'Other people\'s experiences move me deeply.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I recognise when resistance is blocking my transformation.',
            answer: 'True'
          },
          {
            statement: 'I have one persona that is closer to my core than any other.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I use analogies effectively to make sense of new situations.',
            answer: 'True'
          },
          {
            statement: 'I prepare for unpredictable outcomes without spiralling into anxiety.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I find it easy to summarize what I have read or heard.',
            answer: 'True'
          },
          {
            statement: 'I am deeply affected by changes in weather or seasons.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'triggered',
        'anxious',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The wake-up feeling was basically \'i needed permission to stop\'; before coffee or conversation I could already feel flooding gathering in my head.',
      morningWin: 'Even with \'i needed permission to stop\' hanging over me, I still managed to stop performing for a few minutes and just be there.',
      morningChallenge: 'What stayed difficult all day was that \'i needed permission to stop\' kept feeding grief that changed the temperature of everything.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'survival',
        'triggered',
        'awareness'
      ],
      eveningNote: 'By evening, \'i needed permission to stop\' still felt true; I could tell the day had settled as flooding and left a trace in my head.',
      eveningWin: 'By evening, I could still pause before assuming the worst even though \'i needed permission to stop\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i needed permission to stop\' kept echoing as a body memory that got ahead of language.',
      sleepHours: 8.3,
      dreamText: 'My body reacted first in the dream and the meaning arrived later, which made the whole thing feel older than the actual scene. The feeling connected back to \'i needed permission to stop\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 4
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 71,
      date: '2026-04-02',
      promptResponse: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.\n\nWhat felt truest tonight was how quickly my body turned the whole day into a referendum on whether I am too much or not enough. Day 71 made that especially clear through the shape of \'i wish support reached me sooner\'.',
      journalTitle: 'I wish support reached me sooner',
      journalTags: [
        'Sad',
        'Self-Doubt',
        'Identity',
        'Hope',
        'Self-Reflection',
        'Healing'
      ],
      dailyReflectionAnswers: {
        day: 71,
        date: '2026-04-02',
        values: [
          {
            statement: 'I stand up for my beliefs even when it comes at a cost.',
            answer: 'True'
          },
          {
            statement: 'I practise small acts of justice and fairness daily.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I have finally understood a life pattern after years of living it.',
            answer: 'True'
          },
          {
            statement: 'I have been the villain in someone else\'s story without realising it.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I use unconventional approaches to problem-solving effectively.',
            answer: 'True'
          },
          {
            statement: 'Deepening my self-knowledge has changed how I approach the world.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I think about the nature of suffering and its role in growth.',
            answer: 'True'
          },
          {
            statement: 'My body holds memories that my mind has forgotten.',
            answer: 'True'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'sad',
        'self_doubt',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'Woke up carrying the feeling of \'i wish support reached me sooner\' before anything else happened; my body was already leaning toward dissociation.',
      morningWin: 'A quiet win today was that I could feel \'i wish support reached me sooner\' and still speak more honestly than I usually do.',
      morningChallenge: 'The hardest part of today was that \'i wish support reached me sooner\' kept turning into the fear that I was being judged.',
      eveningMood: 2,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'self_reflection',
        'healing',
        'triggered',
        'awareness'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'i wish support reached me sooner\'; even while winding down I could feel dissociation sitting in my hips.',
      eveningWin: 'By evening, I could still let Lucas have the version of me that was present instead of perfect even though \'i wish support reached me sooner\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i wish support reached me sooner\' kept echoing as the urge to overexplain myself.',
      sleepHours: 5.5,
      dreamText: 'The dream kept changing before I could orient to it, and my body stayed alarmed even when the details shifted. The feeling connected back to \'i wish support reached me sooner\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 72,
      date: '2026-04-03',
      promptResponse: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.\n\nUnder the surface, I could feel the younger part of me still hoping someone would notice without my having to ask for that much care directly. Day 72 made that especially clear through the shape of \'i felt disconnected even while functioning\'.',
      journalTitle: 'I felt disconnected even while functioning',
      journalTags: [
        'Lonely',
        'Heavy',
        'Caregiving',
        'Mental Load',
        'Self-Reflection',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 72,
        date: '2026-04-03',
        values: [
          {
            statement: 'I receive gifts, compliments, and help with genuine openness.',
            answer: 'True'
          },
          {
            statement: 'I feel grounded even when everything around me is shifting.',
            answer: 'True'
          },
          {
            statement: 'I carry emotional patterns inherited from my family.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I have recently felt powerless and had to find my way through it.',
            answer: 'True'
          },
          {
            statement: 'I am creating peace between my perfectionism and my humanity.',
            answer: 'True'
          },
          {
            statement: 'I am actively reconciling past trauma with present strength.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I cope effectively when outcomes are completely out of my hands.',
            answer: 'True'
          },
          {
            statement: 'Others count on me for a specific cognitive strength.',
            answer: 'True'
          },
          {
            statement: 'I work comfortably on problems whose end I cannot yet see.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I organise my thoughts spatially — mind maps, diagrams, or layouts.',
            answer: 'Somewhat'
          },
          {
            statement: 'I am good at packing, fitting objects into containers efficiently.',
            answer: 'True'
          },
          {
            statement: 'I am drawn to physical forms of art — pottery, sculpture, carpentry.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'lonely',
        'heavy',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'The first thing I noticed this morning was how \'i felt disconnected even while functioning\' was still living in me; it landed as loneliness in my shoulders.',
      morningWin: 'What I did right, despite \'i felt disconnected even while functioning\', was stay softer with myself in one key moment.',
      morningChallenge: 'My biggest challenge was how \'i felt disconnected even while functioning\' opened the door to an old attachment ache.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'self_reflection',
        'home',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'I ended the day realizing \'i felt disconnected even while functioning\' had shaped more of it than I wanted; the residue was loneliness in my shoulders.',
      eveningWin: 'By evening, I could still leave one thing unfinished without punishing myself even though \'i felt disconnected even while functioning\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i felt disconnected even while functioning\' kept echoing as the sense that I was too much and not enough at once.',
      sleepHours: 6.2,
      dreamText: 'I kept entering conversations a beat too late in the dream and reading that as proof I did not belong. The feeling connected back to \'i felt disconnected even while functioning\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 4
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 73,
      date: '2026-04-04',
      promptResponse: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.\n\nThe thread underneath all of it was how hard it can be to stay on my own side when shame or comparison get activated. Day 73 made that especially clear through the shape of \'there is a tiredness that sleep does not fix\'.',
      journalTitle: 'There is a tiredness that sleep does not fix',
      journalTags: [
        'Overwhelmed',
        'Vulnerable',
        'Healing',
        'Rest',
        'Recovery',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 73,
        date: '2026-04-04',
        values: [
          {
            statement: 'The values I most want to pass on are active in my daily life.',
            answer: 'True'
          },
          {
            statement: 'I struggle to forgive certain things, and that reveals something about my values.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I listen without giving advice when that\'s what someone truly needs.',
            answer: 'True'
          },
          {
            statement: 'My life roles — parent, partner, professional — compete for dominance.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'My inner creator speaks louder than my inner critic.',
            answer: 'True'
          },
          {
            statement: 'I find a way to get unstuck when I\'m blocked.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I notice the quality of air, light, and water wherever I go.',
            answer: 'True'
          },
          {
            statement: 'I learn best from diagrams, maps, and charts.',
            answer: 'Somewhat'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'overwhelmed',
        'vulnerable',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'This morning had the mood of \'there is a tiredness that sleep does not fix\'—I was scanning early and trying not to let embarrassment run the day.',
      morningWin: 'Even with \'there is a tiredness that sleep does not fix\' hanging over me, I still managed to pause before assuming the worst.',
      morningChallenge: 'What stayed difficult all day was that \'there is a tiredness that sleep does not fix\' kept feeding self-consciousness that made everything feel louder.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'recovery',
        'home',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'there is a tiredness that sleep does not fix\', and my body held it as embarrassment around my throat.',
      eveningWin: 'By evening, I could still notice my body before it was screaming even though \'there is a tiredness that sleep does not fix\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'there is a tiredness that sleep does not fix\' kept echoing as comparison that turned mean quickly.',
      sleepHours: 6.9,
      dreamText: 'I kept missing one crucial sentence and the whole room moved on without me, so I spent the rest of the dream pretending I understood. The feeling connected back to \'there is a tiredness that sleep does not fix\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 5
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 74,
      date: '2026-04-05',
      promptResponse: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.\n\nMore than anything, I needed gentleness that did not have to be earned first. Day 74 made that especially clear through the shape of \'i wanted to be less visible and more loved\'.',
      journalTitle: 'I wanted to be less visible and more loved',
      journalTags: [
        'Anxious',
        'Hurt',
        'Rejection',
        'Overthinking',
        'Rumination',
        'Emotional Pattern'
      ],
      dailyReflectionAnswers: {
        day: 74,
        date: '2026-04-05',
        values: [
          {
            statement: 'There are certain people I find it harder to be compassionate toward.',
            answer: 'True'
          },
          {
            statement: 'The people I am most alive with are the ones I laugh with most.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I stand in my power on ordinary days, not just dramatic ones.',
            answer: 'True'
          },
          {
            statement: 'I know the difference between rebellion and self-destruction.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I find meaningful connections in coincidences.',
            answer: 'True'
          },
          {
            statement: 'I detect when someone is not being fully honest.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I prefer precise language over approximate descriptions.',
            answer: 'True'
          },
          {
            statement: 'I often wonder if there are dimensions of reality we cannot perceive.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'anxious',
        'hurt',
        'grief',
        'tenderness'
      ],
      morningNote: 'I started the day with \'i wanted to be less visible and more loved\' sitting close to the surface, which made my solar_plexus feel charged with grief.',
      morningWin: 'A quiet win today was that I could feel \'i wanted to be less visible and more loved\' and still let Lucas have the version of me that was present instead of perfect.',
      morningChallenge: 'The hardest part of today was that \'i wanted to be less visible and more loved\' kept turning into a body memory that got ahead of language.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'rumination',
        'emotional_pattern',
        'loss',
        'ache'
      ],
      eveningNote: 'The evening version of today was \'i wanted to be less visible and more loved\'; underneath everything else I was still carrying grief in my solar_plexus.',
      eveningWin: 'By evening, I could still come back to the moment instead of spiraling all the way out even though \'i wanted to be less visible and more loved\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i wanted to be less visible and more loved\' kept echoing as the feeling of being outside the room even while in it.',
      sleepHours: 7.6,
      dreamText: 'Loss in the dream was less about one event and more about how nothing fully brightened. The feeling connected back to \'i wanted to be less visible and more loved\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'grieving',
          intensity: 4
        },
        {
          id: 'heavy',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'grief',
        awakenState: 'emotional',
        recurring: false
      }
    },
    {
      day: 75,
      date: '2026-04-06',
      promptResponse: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.\n\nWhat hurt most was how ordinary the trigger looked from the outside compared with how total it felt inside me. Day 75 made that especially clear through the shape of \'today i felt the fear of being replaceable\'.',
      journalTitle: 'Today I felt the fear of being replaceable',
      journalTags: [
        'Ashamed',
        'Anxious',
        'Misunderstood',
        'Processing',
        'Mental Load',
        'Self-Doubt'
      ],
      dailyReflectionAnswers: {
        day: 75,
        date: '2026-04-06',
        values: [
          {
            statement: 'I have a guiding sense of meaning that carries me through uncertainty.',
            answer: 'True'
          },
          {
            statement: 'I pretend not to care about things that actually matter to me.',
            answer: 'True'
          },
          {
            statement: 'I respond to ethical tests with integrity.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I need to challenge my own inner authority right now.',
            answer: 'True'
          },
          {
            statement: 'My most guarded self and my most unguarded self need a conversation.',
            answer: 'True'
          },
          {
            statement: 'I have a clear understanding of what personal power means to me.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I manage the mental cost of context switching well.',
            answer: 'True'
          },
          {
            statement: 'I handle the discomfort of being a beginner with patience.',
            answer: 'True'
          },
          {
            statement: 'Recurring memories reveal important things about my current needs.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I feel a deep sense of wonder about the natural world.',
            answer: 'True'
          },
          {
            statement: 'I notice sounds in nature — birdsong, wind, water — that others miss.',
            answer: 'True'
          },
          {
            statement: 'I think about ethics and moral philosophy in everyday situations.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'ashamed',
        'anxious',
        'comparison',
        'self_image'
      ],
      morningNote: 'The wake-up feeling was basically \'today i felt the fear of being replaceable\'; before coffee or conversation I could already feel smallness gathering in my face.',
      morningWin: 'What I did right, despite \'today i felt the fear of being replaceable\', was leave one thing unfinished without punishing myself.',
      morningChallenge: 'My biggest challenge was how \'today i felt the fear of being replaceable\' opened the door to the urge to overexplain myself.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'mental_load',
        'self_doubt',
        'inferiority',
        'shame'
      ],
      eveningNote: 'By evening, \'today i felt the fear of being replaceable\' still felt true; I could tell the day had settled as smallness and left a trace in my face.',
      eveningWin: 'By evening, I could still protect a small pocket of quiet even though \'today i felt the fear of being replaceable\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'today i felt the fear of being replaceable\' kept echoing as caregiving depletion I could not hide from myself.',
      sleepHours: 8.3,
      dreamText: 'The dream made comparison feel instantaneous, like I lost myself before I even had a thought about it. The feeling connected back to \'today i felt the fear of being replaceable\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'ashamed',
          intensity: 5
        },
        {
          id: 'small',
          intensity: 4
        },
        {
          id: 'envious',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'comparison',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 76,
      date: '2026-04-07',
      promptResponse: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.\n\nI can tell this is one of the patterns I most want to heal because it still reaches me before I have language. Day 76 made that especially clear through the shape of \'i wanted my body to unclench\'.',
      journalTitle: 'I wanted my body to unclench',
      journalTags: [
        'Exhausted',
        'Parenting',
        'Caregiving',
        'Low Energy',
        'Tired',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 76,
        date: '2026-04-07',
        values: [
          {
            statement: 'A specific choice I made gave me a powerful sense of freedom.',
            answer: 'True'
          },
          {
            statement: 'My definition of success reflects my own truth, not society\'s.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I can be vulnerable without feeling weak.',
            answer: 'True'
          },
          {
            statement: 'I balance my desire for connection with my need for solitude.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I deliberate carefully before committing to choices.',
            answer: 'True'
          },
          {
            statement: 'I catch myself overthinking and shift back to action.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am drawn to geometry, fractals, or visual patterns.',
            answer: 'True'
          },
          {
            statement: 'I am visually creative — I see beauty in unexpected places.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'exhausted',
        'parenting',
        'Naomi',
        'attachment'
      ],
      morningNote: 'Woke up carrying the feeling of \'i wanted my body to unclench\' before anything else happened; my body was already leaning toward ache.',
      morningWin: 'Even with \'i wanted my body to unclench\' hanging over me, I still managed to notice my body before it was screaming.',
      morningChallenge: 'What stayed difficult all day was that \'i wanted my body to unclench\' kept feeding the sense that I was too much and not enough at once.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'tired',
        'home',
        'loss',
        'longing'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'i wanted my body to unclench\'; even while winding down I could feel ache sitting in my throat.',
      eveningWin: 'By evening, I could still name the actual feeling instead of only the secondary one even though \'i wanted my body to unclench\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i wanted my body to unclench\' kept echoing as grief that changed the temperature of everything.',
      sleepHours: 5.5,
      dreamText: 'Naomi was there in the dream in an ordinary domestic way, which somehow hurt more because it felt like the bond was still active and unresolvable. The feeling connected back to \'i wanted my body to unclench\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'longing',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'naomi',
        awakenState: 'emotional',
        recurring: true
      }
    },
    {
      day: 77,
      date: '2026-04-08',
      promptResponse: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.\n\nEven in the hardest part of it, I could feel how much I want connection without having to abandon myself to keep it. Day 77 made that especially clear through the shape of \'the ache of not feeling singular\'.',
      journalTitle: 'The ache of not feeling singular',
      journalTags: [
        'Lonely',
        'Hurt',
        'Attachment',
        'Distance',
        'Repair',
        'Connection'
      ],
      dailyReflectionAnswers: {
        day: 77,
        date: '2026-04-08',
        values: [
          {
            statement: 'I am intentional about which causes deserve my energy.',
            answer: 'True'
          },
          {
            statement: 'I build stability without becoming rigid.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'A self-sabotaging behaviour keeps returning because it serves a hidden need.',
            answer: 'True'
          },
          {
            statement: 'I handle intellectual disagreements without making them personal.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I form opinions quickly when presented with new information.',
            answer: 'True'
          },
          {
            statement: 'I sustain deep concentration for extended periods.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I express emotions more easily through music than words.',
            answer: 'True'
          },
          {
            statement: 'I remember quotes and phrases long after I read them.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'lonely',
        'hurt',
        'overthinking',
        'sensitivity'
      ],
      morningNote: 'The first thing I noticed this morning was how \'the ache of not feeling singular\' was still living in me; it landed as anxiety in my head.',
      morningWin: 'A quiet win today was that I could feel \'the ache of not feeling singular\' and still come back to the moment instead of spiraling all the way out.',
      morningChallenge: 'The hardest part of today was that \'the ache of not feeling singular\' kept turning into comparison that turned mean quickly.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'repair',
        'connection',
        'processing',
        'fatigue'
      ],
      eveningNote: 'I ended the day realizing \'the ache of not feeling singular\' had shaped more of it than I wanted; the residue was anxiety in my head.',
      eveningWin: 'By evening, I could still stop performing for a few minutes and just be there even though \'the ache of not feeling singular\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'the ache of not feeling singular\' kept echoing as the fear that I was being judged.',
      sleepHours: 6.2,
      dreamText: 'I woke up from a dream where every small thing took more effort than it should have. The feeling connected back to \'the ache of not feeling singular\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'anxious',
          intensity: 5
        },
        {
          id: 'tired',
          intensity: 4
        },
        {
          id: 'exposed',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'default',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 78,
      date: '2026-04-09',
      promptResponse: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.\n\nThere was also a quiet strength in being honest about it instead of pretending I was less affected than I really was. Day 78 made that especially clear through the shape of \'i can see the pattern and still get caught in it\'.',
      journalTitle: 'I can see the pattern and still get caught in it',
      journalTags: [
        'Sad',
        'Family',
        'Memory',
        'Hurt',
        'Processing',
        'Inner Child'
      ],
      dailyReflectionAnswers: {
        day: 78,
        date: '2026-04-09',
        values: [
          {
            statement: 'I am able to repair trust when it breaks.',
            answer: 'True'
          },
          {
            statement: 'I know how to reclaim myself after giving too much away.',
            answer: 'True'
          },
          {
            statement: 'I navigate situations where someone needs more from me than I can give.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'A defining battle — literal or figurative — has shaped who I am.',
            answer: 'True'
          },
          {
            statement: 'Someone has said something empowering to me that still stays with me.',
            answer: 'True'
          },
          {
            statement: 'I am growing even when it doesn\'t feel like it.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I process my emotions through language.',
            answer: 'True'
          },
          {
            statement: 'I develop my cognitive weaknesses rather than only leaning into my strengths.',
            answer: 'True'
          },
          {
            statement: 'I integrate new knowledge with what I already know seamlessly.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am sensitive to tone and subtext in written messages.',
            answer: 'True'
          },
          {
            statement: 'I am comfortable with emotional complexity — I can hold multiple feelings at once.',
            answer: 'True'
          },
          {
            statement: 'I easily identify the key variables in a complex situation.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'sad',
        'family',
        'history',
        'belonging'
      ],
      morningNote: 'This morning had the mood of \'i can see the pattern and still get caught in it\'—I was scanning early and trying not to let exclusion run the day.',
      morningWin: 'What I did right, despite \'i can see the pattern and still get caught in it\', was protect a small pocket of quiet.',
      morningChallenge: 'My biggest challenge was how \'i can see the pattern and still get caught in it\' opened the door to the feeling of being outside the room even while in it.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'inner_child',
        'old_pain',
        'exclusion'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'i can see the pattern and still get caught in it\', and my body held it as exclusion around my face.',
      eveningWin: 'By evening, I could still speak more honestly than I usually do even though \'i can see the pattern and still get caught in it\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i can see the pattern and still get caught in it\' kept echoing as an old attachment ache.',
      sleepHours: 6.9,
      dreamText: 'The dream used siblings and rooms and old house feelings to remind me how belonging can still feel conditional. The feeling connected back to \'i can see the pattern and still get caught in it\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'excluded',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'small',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'family',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 79,
      date: '2026-04-10',
      promptResponse: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.\n\nI keep noticing how often loneliness hides underneath what first looks like irritability, awkwardness, or overthinking. Day 79 made that especially clear through the shape of \'i wish i felt safer in closeness\'.',
      journalTitle: 'I wish I felt safer in closeness',
      journalTags: [
        'Frustrated',
        'Misunderstood',
        'Disconnected',
        'Sensory Overload',
        'Mental Load',
        'Awareness'
      ],
      dailyReflectionAnswers: {
        day: 79,
        date: '2026-04-10',
        values: [
          {
            statement: 'My kindness is worth what it costs me.',
            answer: 'True'
          },
          {
            statement: 'I speak difficult truths even when it\'s uncomfortable.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I care for people without trying to fix them.',
            answer: 'True'
          },
          {
            statement: 'I distinguish between fighting a good fight and picking unnecessary battles.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I handle uncertainty in relationships with composure.',
            answer: 'True'
          },
          {
            statement: 'Specific sensory triggers bring a flood of old memories.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I enjoy design, architecture, or visual arts.',
            answer: 'True'
          },
          {
            statement: 'I enjoy gardening, foraging, or tending living things.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'frustrated',
        'misunderstood',
        'social_anxiety',
        'visibility'
      ],
      morningNote: 'I started the day with \'i wish i felt safer in closeness\' sitting close to the surface, which made my face feel charged with rejection.',
      morningWin: 'Even with \'i wish i felt safer in closeness\' hanging over me, I still managed to name the actual feeling instead of only the secondary one.',
      morningChallenge: 'What stayed difficult all day was that \'i wish i felt safer in closeness\' kept feeding caregiving depletion I could not hide from myself.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'mental_load',
        'awareness',
        'awkwardness',
        'rejection'
      ],
      eveningNote: 'The evening version of today was \'i wish i felt safer in closeness\'; underneath everything else I was still carrying rejection in my face.',
      eveningWin: 'By evening, I could still stay softer with myself in one key moment even though \'i wish i felt safer in closeness\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i wish i felt safer in closeness\' kept echoing as self-consciousness that made everything feel louder.',
      sleepHours: 7.6,
      dreamText: 'I was in a room full of people again, trying to look normal while feeling unmistakably outside of the ease everyone else seemed to have. The feeling connected back to \'i wish i felt safer in closeness\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'awkward',
          intensity: 5
        },
        {
          id: 'rejected',
          intensity: 4
        },
        {
          id: 'alone',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'groups',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 80,
      date: '2026-04-11',
      promptResponse: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.\n\nWhat I wish for most is to feel at home in myself before I have to prove anything to anyone else. Day 80 made that especially clear through the shape of \'i ended the day overstimulated and lonely\'.',
      journalTitle: 'I ended the day overstimulated and lonely',
      journalTags: [
        'Lonely',
        'Attachment',
        'Closeness',
        'Distance',
        'Overthinking',
        'Love'
      ],
      dailyReflectionAnswers: {
        day: 80,
        date: '2026-04-11',
        values: [
          {
            statement: 'A specific place in nature holds deep meaning for me.',
            answer: 'True'
          },
          {
            statement: 'I can find something funny even in my own suffering.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'Dropping all my masks for a day would be both terrifying and liberating.',
            answer: 'True'
          },
          {
            statement: 'I am deeply aware of what is most beautiful about being human.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I adapt my thinking style for different kinds of challenges.',
            answer: 'True'
          },
          {
            statement: 'I balance structured learning with explorative discovery.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I process information best when it is colour-coded or spatially arranged.',
            answer: 'True'
          },
          {
            statement: 'I am physically expressive — people can read my body easily.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'lonely',
        'attachment',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'The wake-up feeling was basically \'i ended the day overstimulated and lonely\'; before coffee or conversation I could already feel alarm gathering in my head.',
      morningWin: 'A quiet win today was that I could feel \'i ended the day overstimulated and lonely\' and still stop performing for a few minutes and just be there.',
      morningChallenge: 'The hardest part of today was that \'i ended the day overstimulated and lonely\' kept turning into grief that changed the temperature of everything.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'overthinking',
        'love',
        'triggered',
        'awareness'
      ],
      eveningNote: 'By evening, \'i ended the day overstimulated and lonely\' still felt true; I could tell the day had settled as alarm and left a trace in my head.',
      eveningWin: 'By evening, I could still pause before assuming the worst even though \'i ended the day overstimulated and lonely\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i ended the day overstimulated and lonely\' kept echoing as a body memory that got ahead of language.',
      sleepHours: 8.3,
      dreamText: 'The dream kept changing before I could orient to it, and my body stayed alarmed even when the details shifted. The feeling connected back to \'i ended the day overstimulated and lonely\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 4
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 81,
      date: '2026-04-12',
      promptResponse: 'I woke up already bracing for the day, like my body had already decided something would be hard before my mind could catch up. Even little things landed heavier because I was already tight inside. I want mornings to feel less like endurance and more like something I am allowed to enter gently. I want more softness with myself than I had today.\n\nWhat felt truest tonight was how quickly my body turned the whole day into a referendum on whether I am too much or not enough. Day 81 made that especially clear through the shape of \'i am tired of the system\'.',
      journalTitle: 'I am tired of the system',
      journalTags: [
        'Anxious',
        'Sensitive',
        'Self-Doubt',
        'Rejection',
        'Overthinking',
        'Processing'
      ],
      dailyReflectionAnswers: {
        day: 81,
        date: '2026-04-12',
        values: [
          {
            statement: 'I have a clear vision of how I want to grow in the next year.',
            answer: 'True'
          },
          {
            statement: 'I am tolerating things in my life that conflict with my values.',
            answer: 'True'
          },
          {
            statement: 'Complexity in my life often masks a lack of clarity about what matters.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I navigate the tension between going deep and going wide in life.',
            answer: 'True'
          },
          {
            statement: 'I carry wisdom I could share with someone going through what I once went through.',
            answer: 'True'
          },
          {
            statement: 'I am living inside a myth of my own making.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I think most effectively in writing rather than speaking or drawing.',
            answer: 'True'
          },
          {
            statement: 'I analyse complex issues thoroughly and effectively.',
            answer: 'True'
          },
          {
            statement: 'My inner monologue is structured and clear.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I prefer evidence-based decisions over intuition.',
            answer: 'True'
          },
          {
            statement: 'I remember places by their visual landmarks.',
            answer: 'True'
          },
          {
            statement: 'I enjoy group brainstorming and collaborative thinking.',
            answer: 'Somewhat'
          }
        ]
      },
      morningMood: 2,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'anxious',
        'sensitive',
        'body_memory',
        'vigilance'
      ],
      morningNote: 'Woke up carrying the feeling of \'i am tired of the system\' before anything else happened; my body was already leaning toward fear.',
      morningWin: 'What I did right, despite \'i am tired of the system\', was speak more honestly than I usually do.',
      morningChallenge: 'My biggest challenge was how \'i am tired of the system\' opened the door to the fear that I was being judged.',
      eveningMood: 2,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'overthinking',
        'processing',
        'triggered',
        'awareness'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'i am tired of the system\'; even while winding down I could feel fear sitting in my hips.',
      eveningWin: 'By evening, I could still let Lucas have the version of me that was present instead of perfect even though \'i am tired of the system\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'i am tired of the system\' kept echoing as the urge to overexplain myself.',
      sleepHours: 5.5,
      dreamText: 'It felt like a body-memory dream more than a plot dream; the sensation was the real storyline. The feeling connected back to \'i am tired of the system\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'shaken',
          intensity: 5
        },
        {
          id: 'overwhelmed',
          intensity: 4
        },
        {
          id: 'afraid',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'body',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 82,
      date: '2026-04-13',
      promptResponse: 'Today I became too aware of myself in the room. It felt like every word, pause, and expression was being monitored, mostly by me. I hate how quickly self-consciousness can turn ordinary interaction into something exhausting. The loneliness under this feeling was stronger than I wanted to admit.\n\nUnder the surface, I could feel the younger part of me still hoping someone would notice without my having to ask for that much care directly. Day 82 made that especially clear through the shape of \'wanting annie to choose me\'.',
      journalTitle: 'Wanting Annie to choose me',
      journalTags: [
        'Guarded',
        'Sensitive',
        'Self-Doubt',
        'Identity',
        'Awareness',
        'Home'
      ],
      dailyReflectionAnswers: {
        day: 82,
        date: '2026-04-13',
        values: [
          {
            statement: 'I over-control parts of my life because of an underlying fear.',
            answer: 'True'
          },
          {
            statement: 'My family of origin has shaped me in ways I am still discovering.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I handle someone trying to diminish my power with composure.',
            answer: 'True'
          },
          {
            statement: 'I respect both my extraverted and introverted needs.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I articulate what I think with precision and clarity.',
            answer: 'True'
          },
          {
            statement: 'I recognise when I am reasoning well versus poorly.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am deeply curious about what happens after death.',
            answer: 'True'
          },
          {
            statement: 'I prefer natural materials over synthetic ones.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'low',
      morningTags: [
        'guarded',
        'sensitive',
        'Annie',
        'attachment'
      ],
      morningNote: 'The first thing I noticed this morning was how \'wanting annie to choose me\' was still living in me; it landed as hope in my belly.',
      morningWin: 'Even with \'wanting annie to choose me\' hanging over me, I still managed to stay softer with myself in one key moment.',
      morningChallenge: 'What stayed difficult all day was that \'wanting annie to choose me\' kept feeding an old attachment ache.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'low',
      eveningTags: [
        'awareness',
        'home',
        'chosen-ness',
        'fear'
      ],
      eveningNote: 'I ended the day realizing \'wanting annie to choose me\' had shaped more of it than I wanted; the residue was hope in my belly.',
      eveningWin: 'By evening, I could still leave one thing unfinished without punishing myself even though \'wanting annie to choose me\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'wanting annie to choose me\' kept echoing as the sense that I was too much and not enough at once.',
      sleepHours: 6.2,
      dreamText: 'Annie was present in the dream but never fully reachable, which made longing feel like the whole architecture of the dream. The feeling connected back to \'wanting annie to choose me\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'longing',
          intensity: 4
        },
        {
          id: 'hopeful',
          intensity: 4
        },
        {
          id: 'jealous',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'annie',
        awakenState: 'emotional',
        recurring: true
      }
    },
    {
      day: 83,
      date: '2026-04-14',
      promptResponse: 'Missing parts of conversation never feels neutral for me. It turns into embarrassment, then shame, then that awful feeling of being outside of what everyone else seems to understand naturally. It is exhausting how quickly hearing loss becomes emotional. I can see the pattern, but that does not mean it stops hurting.\n\nThe thread underneath all of it was how hard it can be to stay on my own side when shame or comparison get activated. Day 83 made that especially clear through the shape of \'feeling left out again\'.',
      journalTitle: 'Feeling left out again',
      journalTags: [
        'Ashamed',
        'Frustrated',
        'Misunderstood',
        'Sensory Overload',
        'Mental Load',
        'Awareness'
      ],
      dailyReflectionAnswers: {
        day: 83,
        date: '2026-04-14',
        values: [
          {
            statement: 'There are areas of my life that need stronger boundaries right now.',
            answer: 'True'
          },
          {
            statement: 'I share my creative gifts generously with others.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I am embodying a specific archetype in this season of my life.',
            answer: 'True'
          },
          {
            statement: 'I am approaching a meaningful milestone of personal growth.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I adjust my beliefs when I discover I\'ve been wrong.',
            answer: 'True'
          },
          {
            statement: 'I find deep satisfaction in thorough analysis.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am drawn to live music and feel it differently than recorded music.',
            answer: 'True'
          },
          {
            statement: 'I know what triggers my anxiety, anger, or sadness.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'ashamed',
        'frustrated',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'This morning had the mood of \'feeling left out again\'—I was scanning early and trying not to let shame run the day.',
      morningWin: 'A quiet win today was that I could feel \'feeling left out again\' and still pause before assuming the worst.',
      morningChallenge: 'The hardest part of today was that \'feeling left out again\' kept turning into self-consciousness that made everything feel louder.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'mental_load',
        'awareness',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'feeling left out again\', and my body held it as shame around my throat.',
      eveningWin: 'By evening, I could still notice my body before it was screaming even though \'feeling left out again\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'feeling left out again\' kept echoing as comparison that turned mean quickly.',
      sleepHours: 6.9,
      dreamText: 'Everyone in the dream heard the joke except me, and my embarrassment kept getting louder than the actual noise. The feeling connected back to \'feeling left out again\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 5
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 84,
      date: '2026-04-15',
      promptResponse: 'The grief was quieter today, but it still changed the color of everything. It sat under the day like a low ache, not loud enough to stop me, but present enough that nothing felt fully light. What I needed most was clarity and steadiness.\n\nMore than anything, I needed gentleness that did not have to be earned first. Day 84 made that especially clear through the shape of \'feeling blurry inside\'.',
      journalTitle: 'Feeling blurry inside',
      journalTags: [
        'Sad',
        'Grief',
        'Loss',
        'Memory',
        'Processing',
        'Inner Child'
      ],
      dailyReflectionAnswers: {
        day: 84,
        date: '2026-04-15',
        values: [
          {
            statement: 'I know exactly how I want to be cared for when I\'m at my lowest.',
            answer: 'True'
          },
          {
            statement: 'I stay grounded during periods of uncertainty.',
            answer: 'True'
          },
          {
            statement: 'I prepare for the unknown without living in anxiety.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'My soul needs something that my ego keeps ignoring.',
            answer: 'True'
          },
          {
            statement: 'Powerlessness has a specific, recognisable feeling in my body.',
            answer: 'True'
          },
          {
            statement: 'I maintain dignity when life strips away my defences.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I process disagreements in real-time conversation effectively.',
            answer: 'True'
          },
          {
            statement: 'I notice when my attention is being manipulated.',
            answer: 'True'
          },
          {
            statement: 'I review my day mentally before sleep.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I enjoy experimenting with sound — instruments, apps, or voice.',
            answer: 'True'
          },
          {
            statement: 'I instinctively rearrange spaces to make them feel better.',
            answer: 'True'
          },
          {
            statement: 'I am drawn to philosophical paradoxes and thought experiments.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'sad',
        'grief',
        'tenderness',
        'memory'
      ],
      morningNote: 'I started the day with \'feeling blurry inside\' sitting close to the surface, which made my solar_plexus feel charged with heaviness.',
      morningWin: 'What I did right, despite \'feeling blurry inside\', was let Lucas have the version of me that was present instead of perfect.',
      morningChallenge: 'My biggest challenge was how \'feeling blurry inside\' opened the door to a body memory that got ahead of language.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'inner_child',
        'loss',
        'ache'
      ],
      eveningNote: 'The evening version of today was \'feeling blurry inside\'; underneath everything else I was still carrying heaviness in my solar_plexus.',
      eveningWin: 'By evening, I could still come back to the moment instead of spiraling all the way out even though \'feeling blurry inside\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'feeling blurry inside\' kept echoing as the feeling of being outside the room even while in it.',
      sleepHours: 7.6,
      dreamText: 'I woke up with the sense that grief had been the weather system underneath the dream. The feeling connected back to \'feeling blurry inside\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'grieving',
          intensity: 4
        },
        {
          id: 'heavy',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'grief',
        awakenState: 'emotional',
        recurring: false
      }
    },
    {
      day: 85,
      date: '2026-04-16',
      promptResponse: 'Comparison got into me fast today. I looked at other women and immediately started measuring myself against an ease I imagine they have. It is painful how quickly I can become less kind to myself when comparison takes over. Part of this touched something much older than today.\n\nWhat hurt most was how ordinary the trigger looked from the outside compared with how total it felt inside me. Day 85 made that especially clear through the shape of \'wishing i were easier to be\'.',
      journalTitle: 'Wishing I were easier to be tonight',
      journalTags: [
        'Ashamed',
        'Self-Doubt',
        'Identity',
        'Acceptance',
        'Overthinking',
        'Self-Reflection'
      ],
      dailyReflectionAnswers: {
        day: 85,
        date: '2026-04-16',
        values: [
          {
            statement: 'Honour is an active part of my personal code.',
            answer: 'True'
          },
          {
            statement: 'I am willing to be a beginner at something new.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'The most important things in my life are invisible.',
            answer: 'True'
          },
          {
            statement: 'I stay anchored even when my purpose feels unclear.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I move from thinking about an idea to actually implementing it.',
            answer: 'True'
          },
          {
            statement: 'I am evolving the aspects of my cognition I most want to improve.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am moved by the fragility and impermanence of life.',
            answer: 'True'
          },
          {
            statement: 'I would feel deeply diminished if music disappeared from my life.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'ashamed',
        'self_doubt',
        'comparison',
        'self_image'
      ],
      morningNote: 'The wake-up feeling was basically \'wishing i were easier to be\'; before coffee or conversation I could already feel shame gathering in my face.',
      morningWin: 'Even with \'wishing i were easier to be\' hanging over me, I still managed to leave one thing unfinished without punishing myself.',
      morningChallenge: 'What stayed difficult all day was that \'wishing i were easier to be\' kept feeding the urge to overexplain myself.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'high',
      eveningTags: [
        'overthinking',
        'self_reflection',
        'inferiority',
        'shame'
      ],
      eveningNote: 'By evening, \'wishing i were easier to be\' still felt true; I could tell the day had settled as shame and left a trace in my face.',
      eveningWin: 'By evening, I could still protect a small pocket of quiet even though \'wishing i were easier to be\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'wishing i were easier to be\' kept echoing as caregiving depletion I could not hide from myself.',
      sleepHours: 8.3,
      dreamText: 'The dream put me beside women who seemed effortlessly composed, and I felt myself shrinking in response. The feeling connected back to \'wishing i were easier to be\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'ashamed',
          intensity: 5
        },
        {
          id: 'small',
          intensity: 4
        },
        {
          id: 'envious',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'comparison',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 86,
      date: '2026-04-17',
      promptResponse: 'I missed Naomi in the ordinary moments today. That kind of missing almost hurts more, because it is woven into the everyday instead of arriving as one dramatic wave. The attachment is still there even though the circumstances changed. I wish I did not become so harsh with myself so quickly.\n\nI can tell this is one of the patterns I most want to heal because it still reaches me before I have language. Day 86 made that especially clear through the shape of \'everyone probably hates me\'.',
      journalTitle: 'Everyone probably hates me',
      journalTags: [
        'Sad',
        'Attachment',
        'Loss',
        'Parenting',
        'Caregiving',
        'Memory'
      ],
      dailyReflectionAnswers: {
        day: 86,
        date: '2026-04-17',
        values: [
          {
            statement: 'I make deliberate time to be in natural spaces.',
            answer: 'True'
          },
          {
            statement: 'The natural world has taught me something important about myself.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I can clearly differentiate between intuition and impulse.',
            answer: 'True'
          },
          {
            statement: 'Being "on" all day is cognitively and emotionally exhausting.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I have a comfort memory I return to when I need grounding.',
            answer: 'True'
          },
          {
            statement: 'Physical movement helps my thinking when I\'m stuck.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I notice when landscapes, forests, or green spaces are healthy or damaged.',
            answer: 'True'
          },
          {
            statement: 'I am good at making introductions and connecting people.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'sad',
        'attachment',
        'Naomi',
        'grief'
      ],
      morningNote: 'Woke up carrying the feeling of \'everyone probably hates me\' before anything else happened; my body was already leaning toward longing.',
      morningWin: 'A quiet win today was that I could feel \'everyone probably hates me\' and still notice my body before it was screaming.',
      morningChallenge: 'The hardest part of today was that \'everyone probably hates me\' kept turning into the sense that I was too much and not enough at once.',
      eveningMood: 3,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'caregiving',
        'memory',
        'loss',
        'longing'
      ],
      eveningNote: 'Tonight the aftertaste of the day was \'everyone probably hates me\'; even while winding down I could feel longing sitting in my throat.',
      eveningWin: 'By evening, I could still name the actual feeling instead of only the secondary one even though \'everyone probably hates me\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'everyone probably hates me\' kept echoing as grief that changed the temperature of everything.',
      sleepHours: 5.5,
      dreamText: 'I was trying to keep Naomi close while also knowing, even in the dream, that I could not stop the leaving. The feeling connected back to \'everyone probably hates me\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'longing',
          intensity: 4
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'naomi',
        awakenState: 'emotional',
        recurring: true
      }
    },
    {
      day: 87,
      date: '2026-04-18',
      promptResponse: 'Everything felt heavier because I am tired in a way sleep does not fully fix. When I am this worn down, even small disappointments can feel enormous. I want to remember that being tired is not the same thing as failing. I could feel the younger ache inside it too.\n\nEven in the hardest part of it, I could feel how much I want connection without having to abandon myself to keep it. Day 87 made that especially clear through the shape of \'the hearing part people do not see\'.',
      journalTitle: 'The hearing part people do not see',
      journalTags: [
        'Heavy',
        'Exhausted',
        'Low Energy',
        'Body Heaviness',
        'Mental Load',
        'Sleep'
      ],
      dailyReflectionAnswers: {
        day: 87,
        date: '2026-04-18',
        values: [
          {
            statement: 'I experience emotional security in my closest relationship.',
            answer: 'True'
          },
          {
            statement: 'I am neglecting a creative urge that wants my attention.',
            answer: 'True'
          },
          {
            statement: 'Someone else\'s compassion recently shifted the course of my day.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I experience real conflict between desire and duty.',
            answer: 'True'
          },
          {
            statement: 'I feel the vulnerability of being between who I was and who I\'m becoming.',
            answer: 'True'
          },
          {
            statement: 'Homecoming after a long internal journey brings me deep peace.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I listen more than I respond in conversations.',
            answer: 'True'
          },
          {
            statement: 'I adapt my plans fluidly when the rules keep changing.',
            answer: 'True'
          },
          {
            statement: 'I trust my first thought and act on it confidently.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I am drawn to stories about transformation and transcendence.',
            answer: 'True'
          },
          {
            statement: 'I find it hard to think clearly when my body feels tense.',
            answer: 'True'
          },
          {
            statement: 'I remember details about people — their stories, preferences, struggles.',
            answer: 'True'
          }
        ]
      },
      morningMood: 3,
      morningEnergy: 'low',
      morningStress: 'medium',
      morningTags: [
        'heavy',
        'exhausted',
        'hearing_loss',
        'exclusion'
      ],
      morningNote: 'The first thing I noticed this morning was how \'the hearing part people do not see\' was still living in me; it landed as shame in my throat.',
      morningWin: 'What I did right, despite \'the hearing part people do not see\', was come back to the moment instead of spiraling all the way out.',
      morningChallenge: 'My biggest challenge was how \'the hearing part people do not see\' opened the door to comparison that turned mean quickly.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'mental_load',
        'sleep',
        'misunderstood',
        'fatigue'
      ],
      eveningNote: 'I ended the day realizing \'the hearing part people do not see\' had shaped more of it than I wanted; the residue was shame in my throat.',
      eveningWin: 'By evening, I could still stop performing for a few minutes and just be there even though \'the hearing part people do not see\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'the hearing part people do not see\' kept echoing as the fear that I was being judged.',
      sleepHours: 6.2,
      dreamText: 'The dream turned every conversation into subtitles that vanished before I could finish reading them. The feeling connected back to \'the hearing part people do not see\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'embarrassed',
          intensity: 5
        },
        {
          id: 'left_out',
          intensity: 4
        },
        {
          id: 'frustrated',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'hearing',
        awakenState: 'shaken',
        recurring: true
      }
    },
    {
      day: 88,
      date: '2026-04-19',
      promptResponse: 'I wanted someone to notice without me having to explain everything first. There is a part of me that still longs for care that arrives before collapse. I think what I wanted most was to feel seen quickly and accurately. Even while functioning, I did not feel okay inside.\n\nThere was also a quiet strength in being honest about it instead of pretending I was less affected than I really was. Day 88 made that especially clear through the shape of \'raising lucas while running on empty\'.',
      journalTitle: 'Raising Lucas while running on empty',
      journalTags: [
        'Lonely',
        'Attachment',
        'Support',
        'Closeness',
        'Vulnerable',
        'Connection'
      ],
      dailyReflectionAnswers: {
        day: 88,
        date: '2026-04-19',
        values: [
          {
            statement: 'I use humor to connect rather than to deflect.',
            answer: 'True'
          },
          {
            statement: 'A recurring desire in me is guiding my life choices.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I honour my past while stepping into my future.',
            answer: 'True'
          },
          {
            statement: 'My relationship with silence reveals something important about me.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'These reflections have taught me something important about myself.',
            answer: 'True'
          },
          {
            statement: 'I default to seeing uncertainty as opportunity rather than threat.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I can tell what material something is by touching it.',
            answer: 'True'
          },
          {
            statement: 'I feel a responsibility to protect the natural world.',
            answer: 'True'
          }
        ]
      },
      morningMood: 5,
      morningEnergy: 'medium',
      morningStress: 'low',
      morningTags: [
        'lonely',
        'attachment',
        'Lucas',
        'motherhood'
      ],
      morningNote: 'This morning had the mood of \'raising lucas while running on empty\'—I was scanning early and trying not to let pressure run the day.',
      morningWin: 'Even with \'raising lucas while running on empty\' hanging over me, I still managed to protect a small pocket of quiet.',
      morningChallenge: 'What stayed difficult all day was that \'raising lucas while running on empty\' kept feeding the feeling of being outside the room even while in it.',
      eveningMood: 4,
      eveningEnergy: 'low',
      eveningStress: 'low',
      eveningTags: [
        'vulnerable',
        'connection',
        'depletion',
        'devotion'
      ],
      eveningNote: 'By nighttime, the thread running through the day was \'raising lucas while running on empty\', and my body held it as pressure around my arms.',
      eveningWin: 'By evening, I could still speak more honestly than I usually do even though \'raising lucas while running on empty\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'raising lucas while running on empty\' kept echoing as an old attachment ache.',
      sleepHours: 6.9,
      dreamText: 'I was moving through the dream with Lucas in my arms, protecting him while everything around us felt unstable. The feeling connected back to \'raising lucas while running on empty\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'protective',
          intensity: 4
        },
        {
          id: 'anxious',
          intensity: 4
        },
        {
          id: 'devoted',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 3,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'lucas',
        awakenState: 'shaken',
        recurring: false
      }
    },
    {
      day: 89,
      date: '2026-04-20',
      promptResponse: 'I could feel how permeable I was today. Tone, tension, and little disappointments all got in. Sensitivity is not just emotion for me. It is awareness, vigilance, and often exhaustion. This is the kind of thing other people probably do not notice, but I feel all of it.\n\nI keep noticing how often loneliness hides underneath what first looks like irritability, awkwardness, or overthinking. Day 89 made that especially clear through the shape of \'naomi leaving still hurts\'.',
      journalTitle: 'Naomi leaving still hurts',
      journalTags: [
        'Sensitive',
        'Guarded',
        'Self-Doubt',
        'Awareness',
        'Processing',
        'Safety'
      ],
      dailyReflectionAnswers: {
        day: 89,
        date: '2026-04-20',
        values: [
          {
            statement: 'I navigate moral grey areas thoughtfully rather than reactively.',
            answer: 'True'
          },
          {
            statement: 'I have learned something about life that I consider profoundly important.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I am on a meaningful quest or mission in my life right now.',
            answer: 'True'
          },
          {
            statement: 'My ideal self and my real self are not far apart.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I give my fullest attention to the activities that engage me.',
            answer: 'True'
          },
          {
            statement: 'I apply cognitive flexibility naturally in different situations.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I like categorising and organising information.',
            answer: 'True'
          },
          {
            statement: 'I feel calmer near water — rivers, lakes, ocean.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'sensitive',
        'guarded',
        'Naomi',
        'attachment'
      ],
      morningNote: 'I started the day with \'naomi leaving still hurts\' sitting close to the surface, which made my chest feel charged with grief.',
      morningWin: 'A quiet win today was that I could feel \'naomi leaving still hurts\' and still name the actual feeling instead of only the secondary one.',
      morningChallenge: 'The hardest part of today was that \'naomi leaving still hurts\' kept turning into caregiving depletion I could not hide from myself.',
      eveningMood: 5,
      eveningEnergy: 'medium',
      eveningStress: 'high',
      eveningTags: [
        'processing',
        'safety',
        'loss',
        'longing'
      ],
      eveningNote: 'The evening version of today was \'naomi leaving still hurts\'; underneath everything else I was still carrying grief in my chest.',
      eveningWin: 'By evening, I could still stay softer with myself in one key moment even though \'naomi leaving still hurts\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'naomi leaving still hurts\' kept echoing as self-consciousness that made everything feel louder.',
      sleepHours: 7.6,
      dreamText: 'I was trying to keep Naomi close while also knowing, even in the dream, that I could not stop the leaving. The feeling connected back to \'naomi leaving still hurts\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'longing',
          intensity: 5
        },
        {
          id: 'sad',
          intensity: 4
        },
        {
          id: 'tender',
          intensity: 3
        }
      ],
      dreamMetadata: {
        vividness: 4,
        lucidity: 1,
        controlLevel: 2,
        overallTheme: 'naomi',
        awakenState: 'emotional',
        recurring: true
      }
    },
    {
      day: 90,
      date: '2026-04-21',
      promptResponse: 'This felt like a body-memory kind of day. My body was reacting before I could name why, and everything felt louder because of it. I think sometimes my body tells the truth before language does. I want to feel more at home in myself than I did today.\n\nWhat I wish for most is to feel at home in myself before I have to prove anything to anyone else. Day 90 made that especially clear through the shape of \'dealing with sarah is its own strain\'.',
      journalTitle: 'Dealing with Sarah is its own strain',
      journalTags: [
        'Triggered',
        'Anxious',
        'Body Heaviness',
        'Awareness',
        'Processing',
        'Survival'
      ],
      dailyReflectionAnswers: {
        day: 90,
        date: '2026-04-21',
        values: [
          {
            statement: 'I know when to speak up and when to stay quiet.',
            answer: 'True'
          },
          {
            statement: 'I balance structure and spontaneity well in my life.',
            answer: 'True'
          },
          {
            statement: 'I am consciously creating the legacy I want to leave.',
            answer: 'True'
          }
        ],
        archetypes: [
          {
            statement: 'I process life experiences on a symbolic level, not just a literal one.',
            answer: 'True'
          },
          {
            statement: 'Part of my personality is actually a survival strategy from the past.',
            answer: 'True'
          },
          {
            statement: 'I perform a character when I\'m trying to impress someone.',
            answer: 'True'
          }
        ],
        cognitive: [
          {
            statement: 'I adopt mental models from others that improve my thinking.',
            answer: 'True'
          },
          {
            statement: 'Self-reflection plays a central role in my intellectual growth.',
            answer: 'True'
          },
          {
            statement: 'I reframe problems effectively when the original framing leads nowhere.',
            answer: 'True'
          }
        ],
        intelligence: [
          {
            statement: 'I rely on spreadsheets, charts, or structured tools to organise decisions.',
            answer: 'True'
          },
          {
            statement: 'I notice subtle shifts in someone\'s tone or energy.',
            answer: 'True'
          },
          {
            statement: 'I keep journals, notes, or letters regularly.',
            answer: 'True'
          }
        ]
      },
      morningMood: 4,
      morningEnergy: 'low',
      morningStress: 'high',
      morningTags: [
        'triggered',
        'anxious',
        'Sarah',
        'foster_care'
      ],
      morningNote: 'The wake-up feeling was basically \'dealing with sarah is its own strain\'; before coffee or conversation I could already feel dread gathering in my head.',
      morningWin: 'What I did right, despite \'dealing with sarah is its own strain\', was stop performing for a few minutes and just be there.',
      morningChallenge: 'My biggest challenge was how \'dealing with sarah is its own strain\' opened the door to grief that changed the temperature of everything.',
      eveningMood: 2,
      eveningEnergy: 'low',
      eveningStress: 'medium',
      eveningTags: [
        'processing',
        'survival',
        'anger',
        'helplessness'
      ],
      eveningNote: 'By evening, \'dealing with sarah is its own strain\' still felt true; I could tell the day had settled as dread and left a trace in my head.',
      eveningWin: 'By evening, I could still pause before assuming the worst even though \'dealing with sarah is its own strain\' had stayed with me.',
      eveningChallenge: 'Tonight the challenge was that \'dealing with sarah is its own strain\' kept echoing as a body memory that got ahead of language.',
      sleepHours: 8.3,
      dreamText: 'The dream made Sarah feel both far away and still capable of destabilizing everything. The feeling connected back to \'dealing with sarah is its own strain\', so I woke up with the emotional part of the dream still attached to the day.',
      dreamFeelings: [
        {
          id: 'angry',
          intensity: 4
        },
        {
          id: 'powerless',
          intensity: 4
        },
        {
          id: 'tense',
          intensity: 4
        }
      ],
      dreamMetadata: {
        vividness: 5,
        lucidity: 2,
        controlLevel: 1,
        overallTheme: 'sarah',
        awakenState: 'shaken',
        recurring: false
      }
    }
  ],
  reflectionsFlat: [
    {
      date: '2026-01-22',
      category: 'values',
      answer: 'Very True',
      questionText: 'I recognise the early signs of burnout in myself.'
    },
    {
      date: '2026-01-22',
      category: 'values',
      answer: 'True',
      questionText: 'My sense of identity has shifted meaningfully in the last year.'
    },
    {
      date: '2026-01-22',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I convert fear into fuel and motivation.'
    },
    {
      date: '2026-01-22',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A journey — internal or external — has significantly changed who I am.'
    },
    {
      date: '2026-01-22',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I organise my thoughts clearly before speaking about something complex.'
    },
    {
      date: '2026-01-22',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I think primarily in images rather than words.'
    },
    {
      date: '2026-01-22',
      category: 'intelligence',
      answer: 'Somewhat',
      questionText: 'I feel uncomfortable when there is unresolved tension in a group.'
    },
    {
      date: '2026-01-22',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am a natural mediator in disagreements.'
    },
    {
      date: '2026-01-23',
      category: 'values',
      answer: 'True',
      questionText: 'What I believe about the nature of life shapes how I treat people.'
    },
    {
      date: '2026-01-23',
      category: 'values',
      answer: 'True',
      questionText: 'I say no without guilt when I need to.'
    },
    {
      date: '2026-01-23',
      category: 'archetypes',
      answer: 'True',
      questionText: 'An experience far outside my comfort zone shaped who I am profoundly.'
    },
    {
      date: '2026-01-23',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Some responsibilities feel noble while others feel like burdens.'
    },
    {
      date: '2026-01-23',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I follow a personal decision rule that serves me well.'
    },
    {
      date: '2026-01-23',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I adapt my communication style fluidly for different people.'
    },
    {
      date: '2026-01-23',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I learn and remember things better when they are set to music.'
    },
    {
      date: '2026-01-23',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can tell when a note or instrument is slightly off-pitch.'
    },
    {
      date: '2026-01-24',
      category: 'values',
      answer: 'Very True',
      questionText: 'There are family patterns I am consciously choosing to break.'
    },
    {
      date: '2026-01-24',
      category: 'values',
      answer: 'True',
      questionText: 'I have made meaningful sacrifices for the people I love.'
    },
    {
      date: '2026-01-24',
      category: 'values',
      answer: 'True',
      questionText: 'Being respected matters more to me than being liked.'
    },
    {
      date: '2026-01-24',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I navigate the disorientation of becoming someone new.'
    },
    {
      date: '2026-01-24',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I handle the loneliness of walking my own path with grace.'
    },
    {
      date: '2026-01-24',
      category: 'archetypes',
      answer: 'True',
      questionText: 'At least one of my personas is exhausting to maintain.'
    },
    {
      date: '2026-01-24',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I actively seek out new information through my preferred channels.'
    },
    {
      date: '2026-01-24',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I take smart, well-calculated risks.'
    },
    {
      date: '2026-01-24',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I push through learning plateaus even when progress feels invisible.'
    },
    {
      date: '2026-01-24',
      category: 'intelligence',
      answer: 'True',
      questionText: 'Music connects me to something larger than myself.'
    },
    {
      date: '2026-01-24',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can identify many plants, trees, or animals by sight.'
    },
    {
      date: '2026-01-24',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice physical discomfort in spaces that feel wrong.'
    },
    {
      date: '2026-01-25',
      category: 'values',
      answer: 'Very True',
      questionText: 'My body clearly signals when I feel safe versus when I feel threatened.'
    },
    {
      date: '2026-01-25',
      category: 'values',
      answer: 'True',
      questionText: 'I willingly sacrifice smaller things for what truly matters.'
    },
    {
      date: '2026-01-25',
      category: 'archetypes',
      answer: 'True',
      questionText: 'There are things about the way the world works that I refuse to accept.'
    },
    {
      date: '2026-01-25',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My shadow shows up clearly in my relationships.'
    },
    {
      date: '2026-01-25',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I handle memories that contradict my current self-image with openness.'
    },
    {
      date: '2026-01-25',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Unexpected inputs — walks, conversations, random articles — spark breakthroughs for me.'
    },
    {
      date: '2026-01-25',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I tend to absorb new languages naturally and quickly.'
    },
    {
      date: '2026-01-25',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I hum, whistle, or tap rhythms without realising it.'
    },
    {
      date: '2026-01-26',
      category: 'values',
      answer: 'True',
      questionText: 'I hold my beliefs with both conviction and humility.'
    },
    {
      date: '2026-01-26',
      category: 'values',
      answer: 'True',
      questionText: 'I actively honour the people who have shaped me.'
    },
    {
      date: '2026-01-26',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Someone has truly taken care of me recently.'
    },
    {
      date: '2026-01-26',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I understand what fulfilment looks like for someone who is always seeking.'
    },
    {
      date: '2026-01-26',
      category: 'cognitive',
      answer: 'Not True',
      questionText: 'Small talk is valuable and enjoyable to me.'
    },
    {
      date: '2026-01-26',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I take a completely different approach when my first method isn\'t working.'
    },
    {
      date: '2026-01-26',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I process emotions partly by finding the exact words for them.'
    },
    {
      date: '2026-01-26',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I recognise complex time signatures or polyrhythms.'
    },
    {
      date: '2026-01-27',
      category: 'values',
      answer: 'True',
      questionText: 'I have made courageous choices this year.'
    },
    {
      date: '2026-01-27',
      category: 'values',
      answer: 'True',
      questionText: 'I model the values I want to see in the world.'
    },
    {
      date: '2026-01-27',
      category: 'values',
      answer: 'True',
      questionText: 'I am intentional about what deserves my emotional energy.'
    },
    {
      date: '2026-01-27',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Traits I dislike in others often reflect something unresolved in me.'
    },
    {
      date: '2026-01-27',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A spiritual or philosophical question keeps calling me back.'
    },
    {
      date: '2026-01-27',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I balance emotional generosity with meeting my own needs.'
    },
    {
      date: '2026-01-27',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I balance logic and emotion effectively when making choices.'
    },
    {
      date: '2026-01-27',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I seek disconfirming evidence for my beliefs, not just confirming evidence.'
    },
    {
      date: '2026-01-27',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Breaking a familiar pattern has significantly shaped my thinking.'
    },
    {
      date: '2026-01-27',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I remember faces far better than names.'
    },
    {
      date: '2026-01-27',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I process stress through my body — tension, restlessness, movement.'
    },
    {
      date: '2026-01-27',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel physical sensations when listening to certain music.'
    },
    {
      date: '2026-01-28',
      category: 'values',
      answer: 'True',
      questionText: 'I grow through discomfort rather than in spite of it.'
    },
    {
      date: '2026-01-28',
      category: 'values',
      answer: 'True',
      questionText: 'The decisions I make are truly my own.'
    },
    {
      date: '2026-01-28',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I can distinguish between genuine seeking and emotional avoidance.'
    },
    {
      date: '2026-01-28',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I balance my need for disruption with others\' need for stability.'
    },
    {
      date: '2026-01-28',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I extract useful learning from risks that didn\'t pay off.'
    },
    {
      date: '2026-01-28',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Fatigue changes what I focus on in noticeable ways.'
    },
    {
      date: '2026-01-28',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to liminal spaces — thresholds, transitions, edges.'
    },
    {
      date: '2026-01-28',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice rhythms and patterns in everyday sounds.'
    },
    {
      date: '2026-01-29',
      category: 'values',
      answer: 'True',
      questionText: 'My relationship with my body has become more compassionate over time.'
    },
    {
      date: '2026-01-29',
      category: 'values',
      answer: 'True',
      questionText: 'I interpret my own life story generously and kindly.'
    },
    {
      date: '2026-01-29',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I don\'t always know what to do when my strength isn\'t enough.'
    },
    {
      date: '2026-01-29',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I need time to recalibrate after performing a role for too long.'
    },
    {
      date: '2026-01-29',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I connect insights across different areas of my life.'
    },
    {
      date: '2026-01-29',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My confidence in a decision grows after I commit to it.'
    },
    {
      date: '2026-01-29',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am very aware of my body in space.'
    },
    {
      date: '2026-01-29',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I find joy in proofs, derivations, or formal logic.'
    },
    {
      date: '2026-01-30',
      category: 'values',
      answer: 'Very True',
      questionText: 'Childhood experiences shaped my need for safety.'
    },
    {
      date: '2026-01-30',
      category: 'values',
      answer: 'Very True',
      questionText: 'There are things that matter deeply to me that I rarely talk about.'
    },
    {
      date: '2026-01-30',
      category: 'values',
      answer: 'Not True',
      questionText: 'I am comfortable showing all of my emotions publicly.'
    },
    {
      date: '2026-01-30',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I wear a different mask at work than I do at home.'
    },
    {
      date: '2026-01-30',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I celebrate others without diminishing myself.'
    },
    {
      date: '2026-01-30',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am looking toward a specific horizon in my life right now.'
    },
    {
      date: '2026-01-30',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I make sense of situations that don\'t fit any known pattern.'
    },
    {
      date: '2026-01-30',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I know when a problem is solved "enough" and move on.'
    },
    {
      date: '2026-01-30',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My emotions enhance rather than cloud the clarity of my thinking.'
    },
    {
      date: '2026-01-30',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I have a strong sense of direction and rarely get lost.'
    },
    {
      date: '2026-01-30',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can easily rotate objects in my mind.'
    },
    {
      date: '2026-01-30',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am energised by meaningful conversations.'
    },
    {
      date: '2026-01-31',
      category: 'values',
      answer: 'True',
      questionText: 'I am holding onto obligations I need to release.'
    },
    {
      date: '2026-01-31',
      category: 'values',
      answer: 'True',
      questionText: 'I express the qualities I admire in others rather than suppressing them in myself.'
    },
    {
      date: '2026-01-31',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My shadow side intensifies when I\'m under stress.'
    },
    {
      date: '2026-01-31',
      category: 'archetypes',
      answer: 'True',
      questionText: 'There is something I consistently lie to myself about.'
    },
    {
      date: '2026-01-31',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I assess risk effectively even with incomplete information.'
    },
    {
      date: '2026-01-31',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I retain information over the long term reliably.'
    },
    {
      date: '2026-01-31',
      category: 'intelligence',
      answer: 'Not True',
      questionText: 'I prefer verbal instructions over visual diagrams.'
    },
    {
      date: '2026-01-31',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I believe that the most important truths cannot be put into words.'
    },
    {
      date: '2026-02-01',
      category: 'values',
      answer: 'True',
      questionText: 'There is at least one thing I absolutely refuse to compromise on.'
    },
    {
      date: '2026-02-01',
      category: 'values',
      answer: 'True',
      questionText: 'My responsibilities to family feel aligned with my deeper values.'
    },
    {
      date: '2026-02-01',
      category: 'archetypes',
      answer: 'True',
      questionText: 'The archetype I admire most reveals something important about me.'
    },
    {
      date: '2026-02-01',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I hold complexity without collapsing into confusion.'
    },
    {
      date: '2026-02-01',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I remain open to outcomes I didn\'t plan for.'
    },
    {
      date: '2026-02-01',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I make room for unexpected ideas in an otherwise structured day.'
    },
    {
      date: '2026-02-01',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I prefer watching a demonstration over reading instructions.'
    },
    {
      date: '2026-02-01',
      category: 'intelligence',
      answer: 'Not True',
      questionText: 'I can read maps effortlessly.'
    },
    {
      date: '2026-02-02',
      category: 'values',
      answer: 'True',
      questionText: 'I know exactly what quality I value most in a close relationship.'
    },
    {
      date: '2026-02-02',
      category: 'values',
      answer: 'True',
      questionText: 'The work I do feels like play to me.'
    },
    {
      date: '2026-02-02',
      category: 'values',
      answer: 'True',
      questionText: 'I feel secure enough to let myself be vulnerable.'
    },
    {
      date: '2026-02-02',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Physical changes in my life mirror my internal transformation.'
    },
    {
      date: '2026-02-02',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I listen most to the inner voice that actually serves me best.'
    },
    {
      date: '2026-02-02',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am actively searching for something meaningful in my life.'
    },
    {
      date: '2026-02-02',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I communicate complex ideas clearly, even when others don\'t immediately understand.'
    },
    {
      date: '2026-02-02',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Deep conversations energise my thinking.'
    },
    {
      date: '2026-02-02',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I gather sufficient information before committing to a choice.'
    },
    {
      date: '2026-02-02',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I question assumptions before accepting them.'
    },
    {
      date: '2026-02-02',
      category: 'intelligence',
      answer: 'Very True',
      questionText: 'I need regular solitude to recharge.'
    },
    {
      date: '2026-02-02',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I naturally recognize patterns in music, like genre or era.'
    },
    {
      date: '2026-02-03',
      category: 'values',
      answer: 'True',
      questionText: 'I choose myself when it\'s the right thing to do.'
    },
    {
      date: '2026-02-03',
      category: 'values',
      answer: 'True',
      questionText: 'Ageing is teaching me valuable things about what truly matters.'
    },
    {
      date: '2026-02-03',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I naturally step in when someone needs help or rescuing.'
    },
    {
      date: '2026-02-03',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I needed a hero in my life that I never had.'
    },
    {
      date: '2026-02-03',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I make decisions from courage rather than fear.'
    },
    {
      date: '2026-02-03',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I use metaphors effectively to understand my own life.'
    },
    {
      date: '2026-02-03',
      category: 'intelligence',
      answer: 'Not True',
      questionText: 'I feel at home in my body most of the time.'
    },
    {
      date: '2026-02-03',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I narrate experiences vividly when telling stories.'
    },
    {
      date: '2026-02-04',
      category: 'values',
      answer: 'True',
      questionText: 'I can sense when my boundaries are being tested.'
    },
    {
      date: '2026-02-04',
      category: 'values',
      answer: 'True',
      questionText: 'I have discovered truths late in life that I\'m genuinely grateful for.'
    },
    {
      date: '2026-02-04',
      category: 'archetypes',
      answer: 'True',
      questionText: 'There is a gift hidden inside my greatest flaw.'
    },
    {
      date: '2026-02-04',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I have been overthinking something that actually needs feeling instead.'
    },
    {
      date: '2026-02-04',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I work on one task at a time rather than multitasking.'
    },
    {
      date: '2026-02-04',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I address even the types of decisions I tend to avoid.'
    },
    {
      date: '2026-02-04',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel spiritually connected to the natural world.'
    },
    {
      date: '2026-02-04',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy debugging or troubleshooting problems.'
    },
    {
      date: '2026-02-05',
      category: 'values',
      answer: 'True',
      questionText: 'I lift others without needing recognition for doing so.'
    },
    {
      date: '2026-02-05',
      category: 'values',
      answer: 'True',
      questionText: 'I reconcile compassion with accountability in a balanced way.'
    },
    {
      date: '2026-02-05',
      category: 'values',
      answer: 'True',
      questionText: 'I stay motivated even when progress feels invisible.'
    },
    {
      date: '2026-02-05',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Radical self-honesty is something I could practise more of.'
    },
    {
      date: '2026-02-05',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I hold onto myself during major life transitions.'
    },
    {
      date: '2026-02-05',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am sitting with a book, talk, or idea that is actively changing me.'
    },
    {
      date: '2026-02-05',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I notice when a current situation rhymes with one from my past.'
    },
    {
      date: '2026-02-05',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I handle misunderstandings without becoming defensive.'
    },
    {
      date: '2026-02-05',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Looking back over my reflections, I can see a clear pattern in how I think and grow.'
    },
    {
      date: '2026-02-05',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I understand unspoken social rules instinctively.'
    },
    {
      date: '2026-02-05',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I pick up new physical skills quickly.'
    },
    {
      date: '2026-02-05',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to introspection in all its forms.'
    },
    {
      date: '2026-02-06',
      category: 'values',
      answer: 'True',
      questionText: 'I stay compassionate without losing myself in the process.'
    },
    {
      date: '2026-02-06',
      category: 'values',
      answer: 'Very True',
      questionText: 'Social interaction drains me more than most people realise.'
    },
    {
      date: '2026-02-06',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I have faced something deeply difficult this year.'
    },
    {
      date: '2026-02-06',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I stay curious even when I feel like an expert in something.'
    },
    {
      date: '2026-02-06',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I navigate situations where intuition and logic point in different directions.'
    },
    {
      date: '2026-02-06',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I keep my mind sharp and engaged through deliberate practice.'
    },
    {
      date: '2026-02-06',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am sensitive to the aesthetic quality of everyday spaces.'
    },
    {
      date: '2026-02-06',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice the rhythm of speech and find some voices musical.'
    },
    {
      date: '2026-02-07',
      category: 'values',
      answer: 'True',
      questionText: 'I value honesty over harmony in my close relationships.'
    },
    {
      date: '2026-02-07',
      category: 'values',
      answer: 'Very True',
      questionText: 'Certain relationship dynamics trigger me more than I\'d like.'
    },
    {
      date: '2026-02-07',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My need for control reveals my deepest fear.'
    },
    {
      date: '2026-02-07',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I have had to accept something very difficult about myself.'
    },
    {
      date: '2026-02-07',
      category: 'cognitive',
      answer: 'Not True',
      questionText: 'I am comfortable working with numbers and quantitative data.'
    },
    {
      date: '2026-02-07',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I interrupt unhelpful thought patterns before they take over.'
    },
    {
      date: '2026-02-07',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice when sound design is used intentionally in films or media.'
    },
    {
      date: '2026-02-07',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I use visualisation as a planning or problem-solving tool.'
    },
    {
      date: '2026-02-08',
      category: 'values',
      answer: 'True',
      questionText: 'I am giving my truest self what it needs right now.'
    },
    {
      date: '2026-02-08',
      category: 'values',
      answer: 'True',
      questionText: 'I have a healthy process for navigating grief and loss.'
    },
    {
      date: '2026-02-08',
      category: 'values',
      answer: 'True',
      questionText: 'I can hold space for people whose values differ from mine.'
    },
    {
      date: '2026-02-08',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I adapt socially without feeling fake.'
    },
    {
      date: '2026-02-08',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My identity would shift dramatically if I stopped taking care of everyone.'
    },
    {
      date: '2026-02-08',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Going against the grain has often been the right choice for me.'
    },
    {
      date: '2026-02-08',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I rely on a mental model to understand human behaviour.'
    },
    {
      date: '2026-02-08',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I approach problems from the top down, starting with the big picture.'
    },
    {
      date: '2026-02-08',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I take feedback about how I think and communicate seriously.'
    },
    {
      date: '2026-02-08',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I approach problems in a systematic, step-by-step way.'
    },
    {
      date: '2026-02-08',
      category: 'intelligence',
      answer: 'True',
      questionText: 'Language feels like my most natural creative medium.'
    },
    {
      date: '2026-02-08',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can reverse-engineer how something was made.'
    },
    {
      date: '2026-02-09',
      category: 'values',
      answer: 'True',
      questionText: 'I am actively developing a skill or quality that matters to me.'
    },
    {
      date: '2026-02-09',
      category: 'values',
      answer: 'True',
      questionText: 'Community is a meaningful part of my life.'
    },
    {
      date: '2026-02-09',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I keep repeating a pattern even though I know better.'
    },
    {
      date: '2026-02-09',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I would rather be a quiet hero than a visible one.'
    },
    {
      date: '2026-02-09',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I reset my thinking effectively when I\'m going in circles.'
    },
    {
      date: '2026-02-09',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I prefer consuming information alone rather than discussing it.'
    },
    {
      date: '2026-02-09',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy creating visual art — painting, collage, digital design.'
    },
    {
      date: '2026-02-09',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can picture how furniture will look in a room before moving it.'
    },
    {
      date: '2026-02-10',
      category: 'values',
      answer: 'True',
      questionText: 'Unexpected things energise me in surprising ways.'
    },
    {
      date: '2026-02-10',
      category: 'values',
      answer: 'True',
      questionText: 'I wear a mask more often than I would like.'
    },
    {
      date: '2026-02-10',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I use my influence ethically and intentionally.'
    },
    {
      date: '2026-02-10',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I continue caring for others even when I\'m drained.'
    },
    {
      date: '2026-02-10',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Certain types of questions make me think more deeply than others.'
    },
    {
      date: '2026-02-10',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I evaluate whether an idea is worth deeply pursuing before investing heavily.'
    },
    {
      date: '2026-02-10',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I have experienced moments of deep connection to the cosmos.'
    },
    {
      date: '2026-02-10',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I use empathy as my primary way of understanding others.'
    },
    {
      date: '2026-02-11',
      category: 'values',
      answer: 'True',
      questionText: 'Community and belonging give my life a dimension that solitude cannot.'
    },
    {
      date: '2026-02-11',
      category: 'values',
      answer: 'True',
      questionText: 'I value freedom more than stability in this season of my life.'
    },
    {
      date: '2026-02-11',
      category: 'values',
      answer: 'True',
      questionText: 'My greatest strengths have emerged from my hardest experiences.'
    },
    {
      date: '2026-02-11',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I know how to reclaim my power after someone has taken it.'
    },
    {
      date: '2026-02-11',
      category: 'archetypes',
      answer: 'True',
      questionText: 'There is a role in life I play more naturally than any other.'
    },
    {
      date: '2026-02-11',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I balance being a voice of reason with being emotionally present.'
    },
    {
      date: '2026-02-11',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I apply lessons I wish I had been taught earlier in life.'
    },
    {
      date: '2026-02-11',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Learning a difficult skill teaches me as much about myself as about the skill.'
    },
    {
      date: '2026-02-11',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I perform best in structured conversation formats.'
    },
    {
      date: '2026-02-11',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I contemplate the nature of consciousness and awareness.'
    },
    {
      date: '2026-02-11',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am fascinated by the overlap between science and spirituality.'
    },
    {
      date: '2026-02-11',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I pick up on micro-expressions and body language.'
    },
    {
      date: '2026-02-12',
      category: 'values',
      answer: 'True',
      questionText: 'I balance giving and receiving well in my relationships.'
    },
    {
      date: '2026-02-12',
      category: 'values',
      answer: 'True',
      questionText: 'I regularly do something kind just for myself.'
    },
    {
      date: '2026-02-12',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I struggle to recover after giving everything I have.'
    },
    {
      date: '2026-02-12',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A role I was once forced into turned out to be one I secretly enjoy.'
    },
    {
      date: '2026-02-12',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I calibrate my confidence in my own judgement accurately.'
    },
    {
      date: '2026-02-12',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I know when to trust my analysis and when to trust my instincts.'
    },
    {
      date: '2026-02-12',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy sequences, codes, or ciphers.'
    },
    {
      date: '2026-02-12',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am comfortable being alone with my thoughts.'
    },
    {
      date: '2026-02-13',
      category: 'values',
      answer: 'True',
      questionText: 'I follow rules by conscious choice, not just habit.'
    },
    {
      date: '2026-02-13',
      category: 'values',
      answer: 'True',
      questionText: 'Imagination plays an active role in my daily life.'
    },
    {
      date: '2026-02-13',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I have exiled a part of myself that I need to welcome back.'
    },
    {
      date: '2026-02-13',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Exploration has revealed truths I could never have found by staying put.'
    },
    {
      date: '2026-02-13',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Sleep and rest noticeably improve my ability to solve problems.'
    },
    {
      date: '2026-02-13',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I teach myself new things independently and successfully.'
    },
    {
      date: '2026-02-13',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I trust the signals my body sends me.'
    },
    {
      date: '2026-02-13',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice visual details others miss.'
    },
    {
      date: '2026-02-14',
      category: 'values',
      answer: 'True',
      questionText: 'I listen to my body before it shouts at me.'
    },
    {
      date: '2026-02-14',
      category: 'values',
      answer: 'True',
      questionText: 'I create spaces where others feel they belong.'
    },
    {
      date: '2026-02-14',
      category: 'values',
      answer: 'True',
      questionText: 'I can be present with someone\'s pain without needing to fix it.'
    },
    {
      date: '2026-02-14',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My deepest intuition has a clear sense of where my life is headed.'
    },
    {
      date: '2026-02-14',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I show up differently in each of my life roles, and I\'m aware of how.'
    },
    {
      date: '2026-02-14',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I understand the difference between knowledge and true wisdom.'
    },
    {
      date: '2026-02-14',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I extract surprising lessons from mundane experiences.'
    },
    {
      date: '2026-02-14',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I wish I could recover a forgotten memory that feels important.'
    },
    {
      date: '2026-02-14',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I appreciate and learn from elegant solutions to complex problems.'
    },
    {
      date: '2026-02-14',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to natural textures — wood, stone, water, soil.'
    },
    {
      date: '2026-02-14',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am comfortable with ambiguity about who I am.'
    },
    {
      date: '2026-02-14',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel a strong connection to animals.'
    },
    {
      date: '2026-02-15',
      category: 'values',
      answer: 'True',
      questionText: 'I experience the sacred in ways that are personal and real to me.'
    },
    {
      date: '2026-02-15',
      category: 'values',
      answer: 'True',
      questionText: 'My presence has the kind of effect on others that I want it to have.'
    },
    {
      date: '2026-02-15',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I share power in my relationships rather than accumulating it.'
    },
    {
      date: '2026-02-15',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I integrate my dark side without acting it out destructively.'
    },
    {
      date: '2026-02-15',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Mindfulness or meditation is an active part of my life.'
    },
    {
      date: '2026-02-15',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Pressure enhances rather than hinders my ability to learn.'
    },
    {
      date: '2026-02-15',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to questions about identity — what makes me "me."'
    },
    {
      date: '2026-02-15',
      category: 'intelligence',
      answer: 'Somewhat',
      questionText: 'I am uncomfortable with surface-level answers to deep questions.'
    },
    {
      date: '2026-02-16',
      category: 'values',
      answer: 'True',
      questionText: 'There are people in my life who love the real me without performance.'
    },
    {
      date: '2026-02-16',
      category: 'values',
      answer: 'True',
      questionText: 'I prioritise restoration over obligation when I need to.'
    },
    {
      date: '2026-02-16',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I remain humble even when I know I\'m right.'
    },
    {
      date: '2026-02-16',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I can tell when I\'m code-switching versus losing myself.'
    },
    {
      date: '2026-02-16',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My most vivid memories are emotional rather than visual or factual.'
    },
    {
      date: '2026-02-16',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I balance breadth and depth effectively when exploring a new topic.'
    },
    {
      date: '2026-02-16',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I classify and categorise natural phenomena instinctively.'
    },
    {
      date: '2026-02-16',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel connected to something larger than myself.'
    },
    {
      date: '2026-02-17',
      category: 'values',
      answer: 'True',
      questionText: 'My ethical understanding comes more from experience than instruction.'
    },
    {
      date: '2026-02-17',
      category: 'values',
      answer: 'True',
      questionText: 'Resilience is a quality I embody, not just admire.'
    },
    {
      date: '2026-02-17',
      category: 'values',
      answer: 'True',
      questionText: 'I am clear about where my responsibility ends and someone else\'s begins.'
    },
    {
      date: '2026-02-17',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am strong without being hard or rigid.'
    },
    {
      date: '2026-02-17',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I empower others without depleting myself.'
    },
    {
      date: '2026-02-17',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I let people in without feeling dangerously exposed.'
    },
    {
      date: '2026-02-17',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Complex, challenging problems energise me.'
    },
    {
      date: '2026-02-17',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I use constraints to boost my creativity.'
    },
    {
      date: '2026-02-17',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I handle situations requiring pure logic with no room for feeling.'
    },
    {
      date: '2026-02-17',
      category: 'intelligence',
      answer: 'True',
      questionText: 'Rhythm and tempo affect my energy and pace throughout the day.'
    },
    {
      date: '2026-02-17',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I doodle, sketch, or draw when thinking.'
    },
    {
      date: '2026-02-17',
      category: 'intelligence',
      answer: 'Somewhat',
      questionText: 'I can navigate by mental maps rather than written directions.'
    },
    {
      date: '2026-02-18',
      category: 'values',
      answer: 'True',
      questionText: 'I feel a deep sense of belonging when I am outside.'
    },
    {
      date: '2026-02-18',
      category: 'values',
      answer: 'True',
      questionText: 'I nurture myself with the same care I give others.'
    },
    {
      date: '2026-02-18',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I reinvent myself while staying true to my core.'
    },
    {
      date: '2026-02-18',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I bring the lessons of my seeking back to the people I love.'
    },
    {
      date: '2026-02-18',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I learn as much from failure as I do from success.'
    },
    {
      date: '2026-02-18',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I notice trends in my mood, energy, or focus across a typical week.'
    },
    {
      date: '2026-02-18',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy teaching, mentoring, or guiding others.'
    },
    {
      date: '2026-02-18',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I think about humanity\'s place in the universe.'
    },
    {
      date: '2026-02-19',
      category: 'values',
      answer: 'True',
      questionText: 'I am living in a way I would want my grandchildren to know about.'
    },
    {
      date: '2026-02-19',
      category: 'values',
      answer: 'True',
      questionText: 'I would create freely if I didn\'t worry about the result being good.'
    },
    {
      date: '2026-02-19',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I understand something about wisdom that most people miss.'
    },
    {
      date: '2026-02-19',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My daily actions are aligned with my deeper purpose.'
    },
    {
      date: '2026-02-19',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Daily reflection continues to reveal surprising things about my mind.'
    },
    {
      date: '2026-02-19',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Understanding my own cognitive style has been genuinely useful.'
    },
    {
      date: '2026-02-19',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy strategy games, chess, or competitive thinking.'
    },
    {
      date: '2026-02-19',
      category: 'intelligence',
      answer: 'Not True',
      questionText: 'I enjoy networking and building connections.'
    },
    {
      date: '2026-02-20',
      category: 'values',
      answer: 'True',
      questionText: 'My relationships have taught me life\'s most valuable lessons.'
    },
    {
      date: '2026-02-20',
      category: 'values',
      answer: 'Very True',
      questionText: 'I carry invisible emotional labour that others don\'t see.'
    },
    {
      date: '2026-02-20',
      category: 'values',
      answer: 'Very True',
      questionText: 'There are things about me I wish people would ask about.'
    },
    {
      date: '2026-02-20',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am in a chrysalis stage of deep personal transformation.'
    },
    {
      date: '2026-02-20',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am deeply attached to at least one defence mechanism.'
    },
    {
      date: '2026-02-20',
      category: 'archetypes',
      answer: 'True',
      questionText: 'There is a gap between who I am and who others need me to be.'
    },
    {
      date: '2026-02-20',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My relationship with risk has matured and become healthier over time.'
    },
    {
      date: '2026-02-20',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Analysis paralysis prevents me from acting when I need to.'
    },
    {
      date: '2026-02-20',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I see a clear relationship between what I remember and who I\'m becoming.'
    },
    {
      date: '2026-02-20',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am fascinated by how different cultures understand death and the divine.'
    },
    {
      date: '2026-02-20',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I think about free will and whether our choices are truly ours.'
    },
    {
      date: '2026-02-20',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I evaluate arguments by their structure, not just their content.'
    },
    {
      date: '2026-02-21',
      category: 'values',
      answer: 'True',
      questionText: 'Time in nature restores me in a way nothing else does.'
    },
    {
      date: '2026-02-21',
      category: 'values',
      answer: 'True',
      questionText: 'I am spending my time on what I would prioritise if it were limited.'
    },
    {
      date: '2026-02-21',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I react strongly when someone sees a part of me I try to hide.'
    },
    {
      date: '2026-02-21',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My core wants something that the world doesn\'t make easy.'
    },
    {
      date: '2026-02-21',
      category: 'cognitive',
      answer: 'Very True',
      questionText: 'Writing plays an active role in how I process my thoughts.'
    },
    {
      date: '2026-02-21',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I break large problems into smaller, manageable pieces naturally.'
    },
    {
      date: '2026-02-21',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I use my body to express what words cannot.'
    },
    {
      date: '2026-02-21',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can trace my current mood back to its origin.'
    },
    {
      date: '2026-02-22',
      category: 'values',
      answer: 'True',
      questionText: 'I tend to hold onto things — possessions, people, certainty — out of fear.'
    },
    {
      date: '2026-02-22',
      category: 'values',
      answer: 'True',
      questionText: 'I feel safe even when the world feels uncertain.'
    },
    {
      date: '2026-02-22',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I find deep meaning in mundane, everyday moments.'
    },
    {
      date: '2026-02-22',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I balance careful analysis with gut intuition effectively.'
    },
    {
      date: '2026-02-22',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I protect my creative flow from the things that kill it.'
    },
    {
      date: '2026-02-22',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I handle information overload without becoming overwhelmed.'
    },
    {
      date: '2026-02-22',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I instinctively create systems and frameworks to manage my life.'
    },
    {
      date: '2026-02-22',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I naturally move or sway to rhythmic sounds.'
    },
    {
      date: '2026-02-23',
      category: 'values',
      answer: 'True',
      questionText: 'Nature has provided comfort during some of my hardest moments.'
    },
    {
      date: '2026-02-23',
      category: 'values',
      answer: 'True',
      questionText: 'Breaking my own self-imposed rules has taught me something.'
    },
    {
      date: '2026-02-23',
      category: 'values',
      answer: 'True',
      questionText: 'I have recently felt misunderstood in a way that revealed a deeper need.'
    },
    {
      date: '2026-02-23',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A label I once identified with no longer fits me.'
    },
    {
      date: '2026-02-23',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I take care of others more than others take care of me.'
    },
    {
      date: '2026-02-23',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Enchantment and wonder are alive in my adult life.'
    },
    {
      date: '2026-02-23',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I handle disagreements about shared memories gracefully.'
    },
    {
      date: '2026-02-23',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I recognise and correct the cognitive biases that affect my risk assessment.'
    },
    {
      date: '2026-02-23',
      category: 'cognitive',
      answer: 'True',
      questionText: 'The same thinking habit loops back when I\'m under stress.'
    },
    {
      date: '2026-02-23',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I think of life events as having a soundtrack.'
    },
    {
      date: '2026-02-23',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I spot patterns in data or information quickly.'
    },
    {
      date: '2026-02-23',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I find it easy to parallel park or navigate tight spaces.'
    },
    {
      date: '2026-02-24',
      category: 'values',
      answer: 'True',
      questionText: 'I choose long-term fulfilment over short-term gratification.'
    },
    {
      date: '2026-02-24',
      category: 'values',
      answer: 'True',
      questionText: 'I balance personal freedom with responsibility to people I love.'
    },
    {
      date: '2026-02-24',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Unknown territory excites me more than it scares me right now.'
    },
    {
      date: '2026-02-24',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I act differently when no one is watching.'
    },
    {
      date: '2026-02-24',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I manage involuntary rumination effectively.'
    },
    {
      date: '2026-02-24',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I maintain balanced thinking — neither too emotional nor too analytical.'
    },
    {
      date: '2026-02-24',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice the emotional key of a piece of music immediately.'
    },
    {
      date: '2026-02-24',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I naturally take the lead in social situations.'
    },
    {
      date: '2026-02-25',
      category: 'values',
      answer: 'True',
      questionText: 'I know the line between disarming humor and avoidant humor.'
    },
    {
      date: '2026-02-25',
      category: 'values',
      answer: 'True',
      questionText: 'My daydreams reveal something true about my desires.'
    },
    {
      date: '2026-02-25',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I play a specific, recognisable role in my friends\' lives.'
    },
    {
      date: '2026-02-25',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My public identity has diverged from who I really am.'
    },
    {
      date: '2026-02-25',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I apply lessons from my past daily without even thinking about it.'
    },
    {
      date: '2026-02-25',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My energy level and my thinking quality are closely connected.'
    },
    {
      date: '2026-02-25',
      category: 'intelligence',
      answer: 'Somewhat',
      questionText: 'I can tell when group dynamics shift.'
    },
    {
      date: '2026-02-25',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel that nature teaches me things no book can.'
    },
    {
      date: '2026-02-26',
      category: 'values',
      answer: 'True',
      questionText: 'Loyalty is important to me, but I recognise its limits.'
    },
    {
      date: '2026-02-26',
      category: 'values',
      answer: 'True',
      questionText: 'I balance planning with surrendering to what I cannot control.'
    },
    {
      date: '2026-02-26',
      category: 'values',
      answer: 'True',
      questionText: 'My online presence reflects who I actually am.'
    },
    {
      date: '2026-02-26',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My rational mind and my emotional mind have very different priorities.'
    },
    {
      date: '2026-02-26',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My sense of self shifts depending on who I\'m with.'
    },
    {
      date: '2026-02-26',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My caring nature has at times felt like a prison.'
    },
    {
      date: '2026-02-26',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I detect subtext and unspoken meaning in conversations.'
    },
    {
      date: '2026-02-26',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I make good decisions with high stakes and limited information.'
    },
    {
      date: '2026-02-26',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I process and learn from my mistakes effectively after they happen.'
    },
    {
      date: '2026-02-26',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice when correlation is mistaken for causation.'
    },
    {
      date: '2026-02-26',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel drained by superficial interactions.'
    },
    {
      date: '2026-02-26',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy cooking with fresh, seasonal, or wild ingredients.'
    },
    {
      date: '2026-02-27',
      category: 'values',
      answer: 'True',
      questionText: 'I can distinguish between challenges worth pushing through and ones to release.'
    },
    {
      date: '2026-02-27',
      category: 'values',
      answer: 'True',
      questionText: 'Playfulness is an active part of my adult life.'
    },
    {
      date: '2026-02-27',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A deep fear underlies my need for control.'
    },
    {
      date: '2026-02-27',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A recurring dream or image keeps appearing in my life.'
    },
    {
      date: '2026-02-27',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I become aware of new patterns in my life on a regular basis.'
    },
    {
      date: '2026-02-27',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Deadlines improve the quality of my thinking.'
    },
    {
      date: '2026-02-27',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel inspired or calmed by specific landscapes or environments.'
    },
    {
      date: '2026-02-27',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy personality tests and frameworks for self-understanding.'
    },
    {
      date: '2026-02-28',
      category: 'values',
      answer: 'True',
      questionText: 'Fairness is reflected in how I treat the people closest to me.'
    },
    {
      date: '2026-02-28',
      category: 'values',
      answer: 'True',
      questionText: 'I find elegance in the straightforward solution.'
    },
    {
      date: '2026-02-28',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A part of me needs to be seen but is too afraid to be visible.'
    },
    {
      date: '2026-02-28',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A part of me craves stability while another part craves chaos.'
    },
    {
      date: '2026-02-28',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I know exactly what question I\'d most love someone to ask me right now.'
    },
    {
      date: '2026-02-28',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My mood influences which memories surface.'
    },
    {
      date: '2026-02-28',
      category: 'intelligence',
      answer: 'Not True',
      questionText: 'I thrive on teamwork and collaboration.'
    },
    {
      date: '2026-02-28',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I spend time curating playlists for different moods.'
    },
    {
      date: '2026-03-01',
      category: 'values',
      answer: 'True',
      questionText: 'My days generally reflect what I consider a well-lived life.'
    },
    {
      date: '2026-03-01',
      category: 'values',
      answer: 'True',
      questionText: 'I exercise autonomy in my daily decisions.'
    },
    {
      date: '2026-03-01',
      category: 'values',
      answer: 'True',
      questionText: 'I protect white space in my life — time with no agenda.'
    },
    {
      date: '2026-03-01',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I stay in contact with the mythic dimension of my life.'
    },
    {
      date: '2026-03-01',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I hold the tension between rational understanding and deeper knowing.'
    },
    {
      date: '2026-03-01',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I show courage even when fear is overwhelming.'
    },
    {
      date: '2026-03-01',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I evaluate worst-case scenarios without catastrophising.'
    },
    {
      date: '2026-03-01',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I make important decisions with clarity and confidence.'
    },
    {
      date: '2026-03-01',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Technology has fundamentally changed how I think and communicate.'
    },
    {
      date: '2026-03-01',
      category: 'intelligence',
      answer: 'True',
      questionText: 'A song can change my entire emotional state in seconds.'
    },
    {
      date: '2026-03-01',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I like building mental models of how things work.'
    },
    {
      date: '2026-03-01',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can read the sky and sense the time or season without a clock.'
    },
    {
      date: '2026-03-02',
      category: 'values',
      answer: 'True',
      questionText: 'Faith — in whatever form it takes for me — plays a real role in my daily life.'
    },
    {
      date: '2026-03-02',
      category: 'values',
      answer: 'True',
      questionText: 'A moment of unexpected abundance recently reminded me of what truly matters.'
    },
    {
      date: '2026-03-02',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My life would look very different if I cared for myself first.'
    },
    {
      date: '2026-03-02',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My contrarian nature both helps and isolates me.'
    },
    {
      date: '2026-03-02',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Quick decisions work out well for me.'
    },
    {
      date: '2026-03-02',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I think about probability naturally in everyday decisions.'
    },
    {
      date: '2026-03-02',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can sense hidden motives in conversations.'
    },
    {
      date: '2026-03-02',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel that exploring these questions is a core part of who I am.'
    },
    {
      date: '2026-03-03',
      category: 'values',
      answer: 'True',
      questionText: 'I would live differently if no one was judging me.'
    },
    {
      date: '2026-03-03',
      category: 'values',
      answer: 'True',
      questionText: 'I balance generosity with self-preservation.'
    },
    {
      date: '2026-03-03',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I turn self-awareness into actual change, not just insight.'
    },
    {
      date: '2026-03-03',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I stay authentic during periods of rapid personal growth.'
    },
    {
      date: '2026-03-03',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I use my understanding of patterns to plan and prepare effectively.'
    },
    {
      date: '2026-03-03',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I rely on feeling rather than analysis when encountering a stranger.'
    },
    {
      date: '2026-03-03',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel a strong pull to understand human behaviour.'
    },
    {
      date: '2026-03-03',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I set boundaries based on deep self-knowledge.'
    },
    {
      date: '2026-03-04',
      category: 'values',
      answer: 'True',
      questionText: 'I keep doing things I wish I had the courage to quit.'
    },
    {
      date: '2026-03-04',
      category: 'values',
      answer: 'True',
      questionText: 'My inner world feels vivid and rich today.'
    },
    {
      date: '2026-03-04',
      category: 'values',
      answer: 'True',
      questionText: 'Spiritual growth is meaningful to me regardless of religion.'
    },
    {
      date: '2026-03-04',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A role is calling me that feels both exciting and terrifying.'
    },
    {
      date: '2026-03-04',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I honour the mystery within myself.'
    },
    {
      date: '2026-03-04',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I resist the temptation to use power to avoid painful feelings.'
    },
    {
      date: '2026-03-04',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I learn by doing rather than by reading instructions.'
    },
    {
      date: '2026-03-04',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I use reflection actively to improve my thinking process.'
    },
    {
      date: '2026-03-04',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I am actively shifting a recurring theme in my life.'
    },
    {
      date: '2026-03-04',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I prefer standing or walking to sitting.'
    },
    {
      date: '2026-03-04',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I learn by doing — hands-on experience beats reading.'
    },
    {
      date: '2026-03-04',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I focus better with the right kind of background music.'
    },
    {
      date: '2026-03-05',
      category: 'values',
      answer: 'True',
      questionText: 'I create space for spontaneity even within a structured life.'
    },
    {
      date: '2026-03-05',
      category: 'values',
      answer: 'True',
      questionText: 'I am fully honest with myself about how I feel right now.'
    },
    {
      date: '2026-03-05',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Opposing traits within me create my unique character.'
    },
    {
      date: '2026-03-05',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Settling has felt right to me rather than suffocating.'
    },
    {
      date: '2026-03-05',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Daily reflection has revealed valuable things about myself.'
    },
    {
      date: '2026-03-05',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I convey nuance effectively even when words feel insufficient.'
    },
    {
      date: '2026-03-05',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I form meaningful connections quickly.'
    },
    {
      date: '2026-03-05',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice my own cognitive biases in action.'
    },
    {
      date: '2026-03-06',
      category: 'values',
      answer: 'True',
      questionText: 'I need to give myself permission to stop doing something.'
    },
    {
      date: '2026-03-06',
      category: 'values',
      answer: 'True',
      questionText: 'I treat myself with compassion when I fall short.'
    },
    {
      date: '2026-03-06',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I find the sacred in everyday moments.'
    },
    {
      date: '2026-03-06',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I channel my energy into something meaningful each day.'
    },
    {
      date: '2026-03-06',
      category: 'cognitive',
      answer: 'True',
      questionText: 'A specific memory has shaped how I think today.'
    },
    {
      date: '2026-03-06',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I share new ideas despite the vulnerability it requires.'
    },
    {
      date: '2026-03-06',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am naturally athletic or physically coordinated.'
    },
    {
      date: '2026-03-06',
      category: 'intelligence',
      answer: 'True',
      questionText: 'Music significantly affects my mood.'
    },
    {
      date: '2026-03-07',
      category: 'values',
      answer: 'True',
      questionText: 'Freedom means something specific and important to me right now.'
    },
    {
      date: '2026-03-07',
      category: 'values',
      answer: 'True',
      questionText: 'I would defend my core principles even if I stood alone.'
    },
    {
      date: '2026-03-07',
      category: 'values',
      answer: 'True',
      questionText: 'I can tell when a relationship is nourishing versus draining.'
    },
    {
      date: '2026-03-07',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My masks sometimes protect me and sometimes trap me.'
    },
    {
      date: '2026-03-07',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I find meaning in the search itself, not just the destination.'
    },
    {
      date: '2026-03-07',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A paradox within me has become a source of creative energy.'
    },
    {
      date: '2026-03-07',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I sleep on important decisions before finalising them.'
    },
    {
      date: '2026-03-07',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I make confident bets on myself and my abilities.'
    },
    {
      date: '2026-03-07',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I recover my focus quickly after an interruption.'
    },
    {
      date: '2026-03-07',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I think better when I am moving.'
    },
    {
      date: '2026-03-07',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I prefer learning through physical demonstration.'
    },
    {
      date: '2026-03-07',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I have a strong inner compass that guides my decisions.'
    },
    {
      date: '2026-03-08',
      category: 'values',
      answer: 'True',
      questionText: 'Caring for the natural world feels like a personal responsibility to me.'
    },
    {
      date: '2026-03-08',
      category: 'values',
      answer: 'True',
      questionText: 'I fully honour my own boundaries.'
    },
    {
      date: '2026-03-08',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am rewriting an old story I used to believe about myself.'
    },
    {
      date: '2026-03-08',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I can sense the line between empathy and enmeshment.'
    },
    {
      date: '2026-03-08',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I manage the anxiety of irreversible decisions calmly.'
    },
    {
      date: '2026-03-08',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I am attuned to my body\'s signals of danger or opportunity.'
    },
    {
      date: '2026-03-08',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I approach creative work with analytical precision.'
    },
    {
      date: '2026-03-08',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice when I am projecting my feelings onto others.'
    },
    {
      date: '2026-03-09',
      category: 'values',
      answer: 'True',
      questionText: 'A boundary I set has improved an important relationship.'
    },
    {
      date: '2026-03-09',
      category: 'values',
      answer: 'True',
      questionText: 'I actively celebrate the people I love.'
    },
    {
      date: '2026-03-09',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I handle being wrong about something I was certain of with openness.'
    },
    {
      date: '2026-03-09',
      category: 'archetypes',
      answer: 'True',
      questionText: 'What I\'m chasing is sometimes a way of running from something else.'
    },
    {
      date: '2026-03-09',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I distinguish between a genuinely good idea and an exciting but impractical one.'
    },
    {
      date: '2026-03-09',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I manage my greatest cognitive distraction effectively.'
    },
    {
      date: '2026-03-09',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice how light changes throughout the day.'
    },
    {
      date: '2026-03-09',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I regularly check in with my own emotional state.'
    },
    {
      date: '2026-03-10',
      category: 'values',
      answer: 'True',
      questionText: 'Specific injustices move me to action more than others.'
    },
    {
      date: '2026-03-10',
      category: 'values',
      answer: 'True',
      questionText: 'I have a form of expression that feels completely natural to me.'
    },
    {
      date: '2026-03-10',
      category: 'values',
      answer: 'True',
      questionText: 'I can hold space for someone whose actions I disagree with.'
    },
    {
      date: '2026-03-10',
      category: 'archetypes',
      answer: 'True',
      questionText: 'There is something in me that needs to die in order for me to grow.'
    },
    {
      date: '2026-03-10',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My relationships help me find and refine my sense of purpose.'
    },
    {
      date: '2026-03-10',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I naturally question authority and established systems.'
    },
    {
      date: '2026-03-10',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I notice subtle signals that others miss.'
    },
    {
      date: '2026-03-10',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I remain creative even under pressure.'
    },
    {
      date: '2026-03-10',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I handle conflicting advice from people I trust with clarity.'
    },
    {
      date: '2026-03-10',
      category: 'intelligence',
      answer: 'True',
      questionText: 'Scientific reasoning excites me more than artistic expression.'
    },
    {
      date: '2026-03-10',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice ecological patterns — migration, bloom cycles, tides.'
    },
    {
      date: '2026-03-10',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel that compassion is the highest expression of intelligence.'
    },
    {
      date: '2026-03-11',
      category: 'values',
      answer: 'True',
      questionText: 'Total freedom, without any structure, would actually scare me.'
    },
    {
      date: '2026-03-11',
      category: 'values',
      answer: 'True',
      questionText: 'People who know me well still have much to discover about me.'
    },
    {
      date: '2026-03-11',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Part of my identity feels actively under construction right now.'
    },
    {
      date: '2026-03-11',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I would pursue a specific role in the world if nothing held me back.'
    },
    {
      date: '2026-03-11',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I distinguish productive concern from anxious rumination.'
    },
    {
      date: '2026-03-11',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Understanding how I think has improved my relationships.'
    },
    {
      date: '2026-03-11',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I use self-knowledge to navigate relationships more effectively.'
    },
    {
      date: '2026-03-11',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I remember things better when I write them down.'
    },
    {
      date: '2026-03-12',
      category: 'values',
      answer: 'True',
      questionText: 'There is a person, place, or thing that represents home to me.'
    },
    {
      date: '2026-03-12',
      category: 'values',
      answer: 'True',
      questionText: 'There is an area of my life that feels destabilisingly uncertain.'
    },
    {
      date: '2026-03-12',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I can envision what the integration of my conflicting parts would look like.'
    },
    {
      date: '2026-03-12',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I can sit comfortably with the discomfort of not knowing.'
    },
    {
      date: '2026-03-12',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I create ideal conditions for my best thinking.'
    },
    {
      date: '2026-03-12',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I read people accurately through intuitive perception.'
    },
    {
      date: '2026-03-12',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I negotiate well because I understand what each side needs.'
    },
    {
      date: '2026-03-12',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to systems that help me understand myself — astrology, psychology, typology.'
    },
    {
      date: '2026-03-13',
      category: 'values',
      answer: 'True',
      questionText: 'Family — however I define it — is central to who I am.'
    },
    {
      date: '2026-03-13',
      category: 'values',
      answer: 'True',
      questionText: 'A creative dream I set aside still whispers to me.'
    },
    {
      date: '2026-03-13',
      category: 'values',
      answer: 'True',
      questionText: 'Being truly seen by someone feels natural and welcome to me.'
    },
    {
      date: '2026-03-13',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Some of my personas serve a genuine purpose while others are just armour.'
    },
    {
      date: '2026-03-13',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I balance confidence with genuine humility.'
    },
    {
      date: '2026-03-13',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I lead without needing to control.'
    },
    {
      date: '2026-03-13',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I return to the same subject again and again because it captivates me.'
    },
    {
      date: '2026-03-13',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I protect my attention as the finite resource it is.'
    },
    {
      date: '2026-03-13',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I mentally replay certain life experiences more than others.'
    },
    {
      date: '2026-03-13',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel physical pain at environmental destruction.'
    },
    {
      date: '2026-03-13',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel physical discomfort in overly artificial environments.'
    },
    {
      date: '2026-03-13',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy physical rituals — stretching, yoga, breathwork.'
    },
    {
      date: '2026-03-14',
      category: 'values',
      answer: 'True',
      questionText: 'I am living in a way I want to be remembered for.'
    },
    {
      date: '2026-03-14',
      category: 'values',
      answer: 'True',
      questionText: 'The person I am and the person I want to be are growing closer together.'
    },
    {
      date: '2026-03-14',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I ask for help instead of pushing through alone.'
    },
    {
      date: '2026-03-14',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am trying to satisfy opposing desires at the same time.'
    },
    {
      date: '2026-03-14',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I apply my thinking strengths across new and unfamiliar domains.'
    },
    {
      date: '2026-03-14',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I handle being wrong about a pattern I thought I saw with humility.'
    },
    {
      date: '2026-03-14',
      category: 'intelligence',
      answer: 'True',
      questionText: 'People come to me for advice or emotional support.'
    },
    {
      date: '2026-03-14',
      category: 'intelligence',
      answer: 'Somewhat',
      questionText: 'I prefer deep one-on-one conversations over large groups.'
    },
    {
      date: '2026-03-15',
      category: 'values',
      answer: 'True',
      questionText: 'I have given care that I am genuinely proud of.'
    },
    {
      date: '2026-03-15',
      category: 'values',
      answer: 'True',
      questionText: 'I feel both free and responsible at the same time.'
    },
    {
      date: '2026-03-15',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My emotional life is actively evolving.'
    },
    {
      date: '2026-03-15',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I have surprised myself by how much I\'ve changed.'
    },
    {
      date: '2026-03-15',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I explain complex ideas clearly to people unfamiliar with the subject.'
    },
    {
      date: '2026-03-15',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I operate from my focused self far more than my scattered self.'
    },
    {
      date: '2026-03-15',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to philosophy, theology, or existential literature.'
    },
    {
      date: '2026-03-15',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel more mentally clear after exercise.'
    },
    {
      date: '2026-03-16',
      category: 'values',
      answer: 'True',
      questionText: 'My relationship with risk has matured over time.'
    },
    {
      date: '2026-03-16',
      category: 'values',
      answer: 'Somewhat',
      questionText: 'I belong to myself even when I don\'t fit a group.'
    },
    {
      date: '2026-03-16',
      category: 'values',
      answer: 'True',
      questionText: 'Past setbacks have redirected me toward something better.'
    },
    {
      date: '2026-03-16',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I bring a specific energy to a room, and it\'s intentional.'
    },
    {
      date: '2026-03-16',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I carry shame that protects something vulnerable in me.'
    },
    {
      date: '2026-03-16',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Sitting with my darkest feelings reveals something I need to see.'
    },
    {
      date: '2026-03-16',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I pay attention to things I usually overlook.'
    },
    {
      date: '2026-03-16',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I remember how people made me feel more than what they said.'
    },
    {
      date: '2026-03-16',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My mood positively influences how I approach obstacles.'
    },
    {
      date: '2026-03-16',
      category: 'intelligence',
      answer: 'True',
      questionText: 'Physical touch is an important part of how I connect with people.'
    },
    {
      date: '2026-03-16',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I express emotions through body language and gesture.'
    },
    {
      date: '2026-03-16',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I use music therapeutically — to regulate, energise, or ground myself.'
    },
    {
      date: '2026-03-17',
      category: 'values',
      answer: 'True',
      questionText: 'Asking for help is something I do when I need it.'
    },
    {
      date: '2026-03-17',
      category: 'values',
      answer: 'True',
      questionText: 'I can make confident choices between two things that both matter.'
    },
    {
      date: '2026-03-17',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I reveal my true self slowly and deliberately to new people.'
    },
    {
      date: '2026-03-17',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I handle the discomfort of asking for help.'
    },
    {
      date: '2026-03-17',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Specific communication styles trigger frustration in me.'
    },
    {
      date: '2026-03-17',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My trust in my own intuition has grown over the years.'
    },
    {
      date: '2026-03-17',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel that silence and stillness reveal truths that activity cannot.'
    },
    {
      date: '2026-03-17',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am deeply self-motivated — external encouragement is nice but not necessary.'
    },
    {
      date: '2026-03-18',
      category: 'values',
      answer: 'True',
      questionText: 'I treat my physical health as a foundation, not an afterthought.'
    },
    {
      date: '2026-03-18',
      category: 'values',
      answer: 'True',
      questionText: 'A lesson keeps returning to me because I haven\'t fully learned it yet.'
    },
    {
      date: '2026-03-18',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I turn my insights into action rather than staying in my head.'
    },
    {
      date: '2026-03-18',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I balance my desire for newness with appreciation for what I already have.'
    },
    {
      date: '2026-03-18',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I engage most deeply in learning experiences that are hands-on and immersive.'
    },
    {
      date: '2026-03-18',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I invite serendipity into my thinking process.'
    },
    {
      date: '2026-03-18',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I find comfort in the rhythm and sound of words.'
    },
    {
      date: '2026-03-18',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can reproduce a rhythm after hearing it once.'
    },
    {
      date: '2026-03-19',
      category: 'values',
      answer: 'True',
      questionText: 'I navigate the tension between security and adventure with clarity.'
    },
    {
      date: '2026-03-19',
      category: 'values',
      answer: 'True',
      questionText: 'A key relationship has shaped who I am today.'
    },
    {
      date: '2026-03-19',
      category: 'values',
      answer: 'True',
      questionText: 'I have expressed who I truly am in brave ways.'
    },
    {
      date: '2026-03-19',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My rebellious streak is constructive rather than destructive.'
    },
    {
      date: '2026-03-19',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I step up when no one else will.'
    },
    {
      date: '2026-03-19',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A single conversation has profoundly transformed how I see myself.'
    },
    {
      date: '2026-03-19',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I know when I have truly learned from an experience.'
    },
    {
      date: '2026-03-19',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My memories of important events have changed and evolved over time.'
    },
    {
      date: '2026-03-19',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I evaluate the credibility of new information sources carefully.'
    },
    {
      date: '2026-03-19',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I prefer natural or earth-toned aesthetics in my surroundings.'
    },
    {
      date: '2026-03-19',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice when my life feels meaningful and when it does not.'
    },
    {
      date: '2026-03-19',
      category: 'intelligence',
      answer: 'True',
      questionText: 'Reading is one of my favourite ways to spend time.'
    },
    {
      date: '2026-03-20',
      category: 'values',
      answer: 'True',
      questionText: 'I feel creatively alive on a regular basis.'
    },
    {
      date: '2026-03-20',
      category: 'values',
      answer: 'True',
      questionText: 'I offer compassion without absorbing others\' suffering.'
    },
    {
      date: '2026-03-20',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I express power without dominating others.'
    },
    {
      date: '2026-03-20',
      category: 'archetypes',
      answer: 'True',
      questionText: 'There is a system in my life that needs disrupting.'
    },
    {
      date: '2026-03-20',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I prefer having a clear recommendation over many open options.'
    },
    {
      date: '2026-03-20',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I have effective techniques for staying focused during long discussions.'
    },
    {
      date: '2026-03-20',
      category: 'intelligence',
      answer: 'True',
      questionText: 'Writing helps me discover what I actually think.'
    },
    {
      date: '2026-03-20',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel deeply connected to the people in my life.'
    },
    {
      date: '2026-03-21',
      category: 'values',
      answer: 'True',
      questionText: 'My life has a clear direction right now.'
    },
    {
      date: '2026-03-21',
      category: 'values',
      answer: 'True',
      questionText: 'I know the difference between excellence and perfectionism.'
    },
    {
      date: '2026-03-21',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I define myself by more than my job title or social labels.'
    },
    {
      date: '2026-03-21',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I stay connected to community while maintaining my radical independence.'
    },
    {
      date: '2026-03-21',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I fact-check my own assumptions before accepting them.'
    },
    {
      date: '2026-03-21',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Time pressure improves rather than impairs my decision quality.'
    },
    {
      date: '2026-03-21',
      category: 'intelligence',
      answer: 'True',
      questionText: 'Physical mastery gives me a deep sense of accomplishment.'
    },
    {
      date: '2026-03-21',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I think about the meaning of life more than most people.'
    },
    {
      date: '2026-03-22',
      category: 'values',
      answer: 'True',
      questionText: 'My relationship with the seasons reflects something true about my inner life.'
    },
    {
      date: '2026-03-22',
      category: 'values',
      answer: 'True',
      questionText: 'I stay true to my ethics even when they conflict with social norms.'
    },
    {
      date: '2026-03-22',
      category: 'values',
      answer: 'True',
      questionText: 'I reach for healthy things first when I feel overwhelmed.'
    },
    {
      date: '2026-03-22',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My analytical mind both serves and limits me.'
    },
    {
      date: '2026-03-22',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I nurture the parts of myself that cannot be measured.'
    },
    {
      date: '2026-03-22',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My rebellious energy has matured over time.'
    },
    {
      date: '2026-03-22',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I build arguments using logic rather than emotion or narrative.'
    },
    {
      date: '2026-03-22',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I redirect my attention when my mind wanders during something important.'
    },
    {
      date: '2026-03-22',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I nurture ideas from initial spark all the way to fully formed concepts.'
    },
    {
      date: '2026-03-22',
      category: 'intelligence',
      answer: 'Somewhat',
      questionText: 'I can quickly estimate whether a claim is plausible based on numbers.'
    },
    {
      date: '2026-03-22',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy physical improvisation — free movement, contact improv, play.'
    },
    {
      date: '2026-03-22',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel emotionally mature compared to others my age.'
    },
    {
      date: '2026-03-23',
      category: 'values',
      answer: 'True',
      questionText: 'I feel deeply aligned with my sense of purpose.'
    },
    {
      date: '2026-03-23',
      category: 'values',
      answer: 'True',
      questionText: 'I feel proud of the person I am becoming.'
    },
    {
      date: '2026-03-23',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I play an unofficial role in my family that was never assigned to me.'
    },
    {
      date: '2026-03-23',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am befriending parts of myself I was taught to suppress.'
    },
    {
      date: '2026-03-23',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I direct attention to my inner life even during a busy day.'
    },
    {
      date: '2026-03-23',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I store and retrieve memories of important conversations accurately.'
    },
    {
      date: '2026-03-23',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I experience music as colours, textures, or images.'
    },
    {
      date: '2026-03-23',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I compose or improvise music in my head.'
    },
    {
      date: '2026-03-24',
      category: 'values',
      answer: 'True',
      questionText: 'I manage compassion fatigue by actively replenishing myself.'
    },
    {
      date: '2026-03-24',
      category: 'values',
      answer: 'True',
      questionText: 'I create rituals and traditions that bring the people I love together.'
    },
    {
      date: '2026-03-24',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I sometimes need to rebel against my own rebel.'
    },
    {
      date: '2026-03-24',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My need for freedom affects my ability to commit.'
    },
    {
      date: '2026-03-24',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My unconventional thinking approach serves me well even when it isn\'t rewarded.'
    },
    {
      date: '2026-03-24',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I retain the key points from long conversations accurately.'
    },
    {
      date: '2026-03-24',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I have a detailed mental model of how my own mind works.'
    },
    {
      date: '2026-03-24',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can look at a flat pattern and imagine the 3D object it creates.'
    },
    {
      date: '2026-03-25',
      category: 'values',
      answer: 'True',
      questionText: 'I celebrate belonging when I have it rather than taking it for granted.'
    },
    {
      date: '2026-03-25',
      category: 'values',
      answer: 'True',
      questionText: 'I would benefit from a conversation with a wise mentor.'
    },
    {
      date: '2026-03-25',
      category: 'values',
      answer: 'True',
      questionText: 'I can distinguish between healthy solitude and unhealthy isolation.'
    },
    {
      date: '2026-03-25',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A transformation that scared me turned out beautifully.'
    },
    {
      date: '2026-03-25',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I can discern truth from comfortable illusion.'
    },
    {
      date: '2026-03-25',
      category: 'archetypes',
      answer: 'True',
      questionText: 'An emerging part of myself genuinely excites me.'
    },
    {
      date: '2026-03-25',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My thinking style has shaped my career or life path significantly.'
    },
    {
      date: '2026-03-25',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I actively cultivate and develop my intuitive sense.'
    },
    {
      date: '2026-03-25',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I balance pattern recognition with remaining open to exceptions.'
    },
    {
      date: '2026-03-25',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice logical errors in arguments other people make.'
    },
    {
      date: '2026-03-25',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I believe inner growth is the most important work a person can do.'
    },
    {
      date: '2026-03-25',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I use past experiences to make better future decisions.'
    },
    {
      date: '2026-03-26',
      category: 'values',
      answer: 'True',
      questionText: 'I can clearly distinguish between my wants and my needs.'
    },
    {
      date: '2026-03-26',
      category: 'values',
      answer: 'True',
      questionText: 'I handle disagreements with people I care about in a healthy way.'
    },
    {
      date: '2026-03-26',
      category: 'archetypes',
      answer: 'True',
      questionText: 'An inner contradiction is a defining part of who I am.'
    },
    {
      date: '2026-03-26',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My inner fire is alive and burning.'
    },
    {
      date: '2026-03-26',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I handle choices with no clear right answer without becoming paralysed.'
    },
    {
      date: '2026-03-26',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I summarise complex information for myself effectively.'
    },
    {
      date: '2026-03-26',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy the physicality of nature — climbing, swimming, hiking.'
    },
    {
      date: '2026-03-26',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am fascinated by the history and origin of words.'
    },
    {
      date: '2026-03-27',
      category: 'values',
      answer: 'True',
      questionText: 'I handle repeated boundary violations with firmness and clarity.'
    },
    {
      date: '2026-03-27',
      category: 'values',
      answer: 'True',
      questionText: 'I am able to forgive even when the other person isn\'t sorry.'
    },
    {
      date: '2026-03-27',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I navigate the soul\'s seasons — growth, decay, dormancy, rebirth — with awareness.'
    },
    {
      date: '2026-03-27',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I have a complex relationship with authority figures.'
    },
    {
      date: '2026-03-27',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I do my deepest work during a specific, consistent time of day.'
    },
    {
      date: '2026-03-27',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Nostalgia plays a meaningful role in my thinking.'
    },
    {
      date: '2026-03-27',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can recognise the difference between what I feel and what I think.'
    },
    {
      date: '2026-03-27',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I look for cause-and-effect relationships in what happens around me.'
    },
    {
      date: '2026-03-28',
      category: 'values',
      answer: 'True',
      questionText: 'I have made peace with things I wish I could tell my younger self.'
    },
    {
      date: '2026-03-28',
      category: 'values',
      answer: 'True',
      questionText: 'Someone specific taught me the most about caring for others.'
    },
    {
      date: '2026-03-28',
      category: 'values',
      answer: 'True',
      questionText: 'I feel most like myself when I follow my own instincts.'
    },
    {
      date: '2026-03-28',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Some of my caring is performed rather than genuinely felt.'
    },
    {
      date: '2026-03-28',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Part of my potential remains unlived.'
    },
    {
      date: '2026-03-28',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My past self still influences my present choices.'
    },
    {
      date: '2026-03-28',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I trust counterintuitive decisions that go against conventional wisdom.'
    },
    {
      date: '2026-03-28',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Unexpected things capture my attention involuntarily.'
    },
    {
      date: '2026-03-28',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I use an analytical framework — even an informal one — in daily life.'
    },
    {
      date: '2026-03-28',
      category: 'intelligence',
      answer: 'True',
      questionText: 'Poetry or lyrical writing moves me deeply.'
    },
    {
      date: '2026-03-28',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I use specific music to access certain memories or emotional states.'
    },
    {
      date: '2026-03-28',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice inefficiencies in processes and systems.'
    },
    {
      date: '2026-03-29',
      category: 'values',
      answer: 'True',
      questionText: 'A wounded part of me needs tenderness that I haven\'t fully given it.'
    },
    {
      date: '2026-03-29',
      category: 'values',
      answer: 'True',
      questionText: 'I choose purpose over comfort when it matters.'
    },
    {
      date: '2026-03-29',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My seeking nature comes at a real cost to my relationships.'
    },
    {
      date: '2026-03-29',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I would tear down something old to build something better.'
    },
    {
      date: '2026-03-29',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I use self-observation to make better choices.'
    },
    {
      date: '2026-03-29',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I approach personal problems differently than work problems.'
    },
    {
      date: '2026-03-29',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice when someone needs support even before they ask.'
    },
    {
      date: '2026-03-29',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to photography, film, or visual storytelling.'
    },
    {
      date: '2026-03-30',
      category: 'values',
      answer: 'True',
      questionText: 'I feel fully authentic in the most important areas of my life.'
    },
    {
      date: '2026-03-30',
      category: 'values',
      answer: 'True',
      questionText: 'I hold opinions that most people around me would disagree with.'
    },
    {
      date: '2026-03-30',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am letting go of the need for internal consistency.'
    },
    {
      date: '2026-03-30',
      category: 'archetypes',
      answer: 'True',
      questionText: 'There is something I would defend even if I were the only one standing.'
    },
    {
      date: '2026-03-30',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I generate new ideas even when I feel stuck.'
    },
    {
      date: '2026-03-30',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I approach new problems with a clear go-to method.'
    },
    {
      date: '2026-03-30',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I understand my own defence mechanisms.'
    },
    {
      date: '2026-03-30',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel responsible for the emotional well-being of those around me.'
    },
    {
      date: '2026-03-31',
      category: 'values',
      answer: 'True',
      questionText: 'Trust builds slowly in me, but it builds solidly.'
    },
    {
      date: '2026-03-31',
      category: 'values',
      answer: 'True',
      questionText: 'I am clear about which commitments truly deserve my energy.'
    },
    {
      date: '2026-03-31',
      category: 'values',
      answer: 'True',
      questionText: 'I have experienced what unconditional acceptance feels like.'
    },
    {
      date: '2026-03-31',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I listen to the quiet voice beneath all the noise.'
    },
    {
      date: '2026-03-31',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Jealousy has shown me something important about my true desires.'
    },
    {
      date: '2026-03-31',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I disown parts of myself in public settings.'
    },
    {
      date: '2026-03-31',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I perform at my cognitive best when I feel psychologically safe.'
    },
    {
      date: '2026-03-31',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I filter what to pay attention to and what to ignore efficiently.'
    },
    {
      date: '2026-03-31',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I reframe uncertainty as possibility and openness.'
    },
    {
      date: '2026-03-31',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I think about whether time is real or constructed.'
    },
    {
      date: '2026-03-31',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am fascinated by animal behaviour and consciousness.'
    },
    {
      date: '2026-03-31',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am curious about the relationship between mind and brain.'
    },
    {
      date: '2026-04-01',
      category: 'values',
      answer: 'True',
      questionText: 'I handle creative blocks with patience and curiosity.'
    },
    {
      date: '2026-04-01',
      category: 'values',
      answer: 'True',
      questionText: 'Other people\'s experiences move me deeply.'
    },
    {
      date: '2026-04-01',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I recognise when resistance is blocking my transformation.'
    },
    {
      date: '2026-04-01',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I have one persona that is closer to my core than any other.'
    },
    {
      date: '2026-04-01',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I use analogies effectively to make sense of new situations.'
    },
    {
      date: '2026-04-01',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I prepare for unpredictable outcomes without spiralling into anxiety.'
    },
    {
      date: '2026-04-01',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I find it easy to summarize what I have read or heard.'
    },
    {
      date: '2026-04-01',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am deeply affected by changes in weather or seasons.'
    },
    {
      date: '2026-04-02',
      category: 'values',
      answer: 'True',
      questionText: 'I stand up for my beliefs even when it comes at a cost.'
    },
    {
      date: '2026-04-02',
      category: 'values',
      answer: 'True',
      questionText: 'I practise small acts of justice and fairness daily.'
    },
    {
      date: '2026-04-02',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I have finally understood a life pattern after years of living it.'
    },
    {
      date: '2026-04-02',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I have been the villain in someone else\'s story without realising it.'
    },
    {
      date: '2026-04-02',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I use unconventional approaches to problem-solving effectively.'
    },
    {
      date: '2026-04-02',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Deepening my self-knowledge has changed how I approach the world.'
    },
    {
      date: '2026-04-02',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I think about the nature of suffering and its role in growth.'
    },
    {
      date: '2026-04-02',
      category: 'intelligence',
      answer: 'True',
      questionText: 'My body holds memories that my mind has forgotten.'
    },
    {
      date: '2026-04-03',
      category: 'values',
      answer: 'True',
      questionText: 'I receive gifts, compliments, and help with genuine openness.'
    },
    {
      date: '2026-04-03',
      category: 'values',
      answer: 'True',
      questionText: 'I feel grounded even when everything around me is shifting.'
    },
    {
      date: '2026-04-03',
      category: 'values',
      answer: 'True',
      questionText: 'I carry emotional patterns inherited from my family.'
    },
    {
      date: '2026-04-03',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I have recently felt powerless and had to find my way through it.'
    },
    {
      date: '2026-04-03',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am creating peace between my perfectionism and my humanity.'
    },
    {
      date: '2026-04-03',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am actively reconciling past trauma with present strength.'
    },
    {
      date: '2026-04-03',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I cope effectively when outcomes are completely out of my hands.'
    },
    {
      date: '2026-04-03',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Others count on me for a specific cognitive strength.'
    },
    {
      date: '2026-04-03',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I work comfortably on problems whose end I cannot yet see.'
    },
    {
      date: '2026-04-03',
      category: 'intelligence',
      answer: 'Somewhat',
      questionText: 'I organise my thoughts spatially — mind maps, diagrams, or layouts.'
    },
    {
      date: '2026-04-03',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am good at packing, fitting objects into containers efficiently.'
    },
    {
      date: '2026-04-03',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to physical forms of art — pottery, sculpture, carpentry.'
    },
    {
      date: '2026-04-04',
      category: 'values',
      answer: 'True',
      questionText: 'The values I most want to pass on are active in my daily life.'
    },
    {
      date: '2026-04-04',
      category: 'values',
      answer: 'True',
      questionText: 'I struggle to forgive certain things, and that reveals something about my values.'
    },
    {
      date: '2026-04-04',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I listen without giving advice when that\'s what someone truly needs.'
    },
    {
      date: '2026-04-04',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My life roles — parent, partner, professional — compete for dominance.'
    },
    {
      date: '2026-04-04',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My inner creator speaks louder than my inner critic.'
    },
    {
      date: '2026-04-04',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I find a way to get unstuck when I\'m blocked.'
    },
    {
      date: '2026-04-04',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice the quality of air, light, and water wherever I go.'
    },
    {
      date: '2026-04-04',
      category: 'intelligence',
      answer: 'Somewhat',
      questionText: 'I learn best from diagrams, maps, and charts.'
    },
    {
      date: '2026-04-05',
      category: 'values',
      answer: 'True',
      questionText: 'There are certain people I find it harder to be compassionate toward.'
    },
    {
      date: '2026-04-05',
      category: 'values',
      answer: 'True',
      questionText: 'The people I am most alive with are the ones I laugh with most.'
    },
    {
      date: '2026-04-05',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I stand in my power on ordinary days, not just dramatic ones.'
    },
    {
      date: '2026-04-05',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I know the difference between rebellion and self-destruction.'
    },
    {
      date: '2026-04-05',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I find meaningful connections in coincidences.'
    },
    {
      date: '2026-04-05',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I detect when someone is not being fully honest.'
    },
    {
      date: '2026-04-05',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I prefer precise language over approximate descriptions.'
    },
    {
      date: '2026-04-05',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I often wonder if there are dimensions of reality we cannot perceive.'
    },
    {
      date: '2026-04-06',
      category: 'values',
      answer: 'True',
      questionText: 'I have a guiding sense of meaning that carries me through uncertainty.'
    },
    {
      date: '2026-04-06',
      category: 'values',
      answer: 'True',
      questionText: 'I pretend not to care about things that actually matter to me.'
    },
    {
      date: '2026-04-06',
      category: 'values',
      answer: 'True',
      questionText: 'I respond to ethical tests with integrity.'
    },
    {
      date: '2026-04-06',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I need to challenge my own inner authority right now.'
    },
    {
      date: '2026-04-06',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My most guarded self and my most unguarded self need a conversation.'
    },
    {
      date: '2026-04-06',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I have a clear understanding of what personal power means to me.'
    },
    {
      date: '2026-04-06',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I manage the mental cost of context switching well.'
    },
    {
      date: '2026-04-06',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I handle the discomfort of being a beginner with patience.'
    },
    {
      date: '2026-04-06',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Recurring memories reveal important things about my current needs.'
    },
    {
      date: '2026-04-06',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel a deep sense of wonder about the natural world.'
    },
    {
      date: '2026-04-06',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice sounds in nature — birdsong, wind, water — that others miss.'
    },
    {
      date: '2026-04-06',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I think about ethics and moral philosophy in everyday situations.'
    },
    {
      date: '2026-04-07',
      category: 'values',
      answer: 'True',
      questionText: 'A specific choice I made gave me a powerful sense of freedom.'
    },
    {
      date: '2026-04-07',
      category: 'values',
      answer: 'True',
      questionText: 'My definition of success reflects my own truth, not society\'s.'
    },
    {
      date: '2026-04-07',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I can be vulnerable without feeling weak.'
    },
    {
      date: '2026-04-07',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I balance my desire for connection with my need for solitude.'
    },
    {
      date: '2026-04-07',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I deliberate carefully before committing to choices.'
    },
    {
      date: '2026-04-07',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I catch myself overthinking and shift back to action.'
    },
    {
      date: '2026-04-07',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to geometry, fractals, or visual patterns.'
    },
    {
      date: '2026-04-07',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am visually creative — I see beauty in unexpected places.'
    },
    {
      date: '2026-04-08',
      category: 'values',
      answer: 'True',
      questionText: 'I am intentional about which causes deserve my energy.'
    },
    {
      date: '2026-04-08',
      category: 'values',
      answer: 'True',
      questionText: 'I build stability without becoming rigid.'
    },
    {
      date: '2026-04-08',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A self-sabotaging behaviour keeps returning because it serves a hidden need.'
    },
    {
      date: '2026-04-08',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I handle intellectual disagreements without making them personal.'
    },
    {
      date: '2026-04-08',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I form opinions quickly when presented with new information.'
    },
    {
      date: '2026-04-08',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I sustain deep concentration for extended periods.'
    },
    {
      date: '2026-04-08',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I express emotions more easily through music than words.'
    },
    {
      date: '2026-04-08',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I remember quotes and phrases long after I read them.'
    },
    {
      date: '2026-04-09',
      category: 'values',
      answer: 'True',
      questionText: 'I am able to repair trust when it breaks.'
    },
    {
      date: '2026-04-09',
      category: 'values',
      answer: 'True',
      questionText: 'I know how to reclaim myself after giving too much away.'
    },
    {
      date: '2026-04-09',
      category: 'values',
      answer: 'True',
      questionText: 'I navigate situations where someone needs more from me than I can give.'
    },
    {
      date: '2026-04-09',
      category: 'archetypes',
      answer: 'True',
      questionText: 'A defining battle — literal or figurative — has shaped who I am.'
    },
    {
      date: '2026-04-09',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Someone has said something empowering to me that still stays with me.'
    },
    {
      date: '2026-04-09',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am growing even when it doesn\'t feel like it.'
    },
    {
      date: '2026-04-09',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I process my emotions through language.'
    },
    {
      date: '2026-04-09',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I develop my cognitive weaknesses rather than only leaning into my strengths.'
    },
    {
      date: '2026-04-09',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I integrate new knowledge with what I already know seamlessly.'
    },
    {
      date: '2026-04-09',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am sensitive to tone and subtext in written messages.'
    },
    {
      date: '2026-04-09',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am comfortable with emotional complexity — I can hold multiple feelings at once.'
    },
    {
      date: '2026-04-09',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I easily identify the key variables in a complex situation.'
    },
    {
      date: '2026-04-10',
      category: 'values',
      answer: 'True',
      questionText: 'My kindness is worth what it costs me.'
    },
    {
      date: '2026-04-10',
      category: 'values',
      answer: 'True',
      questionText: 'I speak difficult truths even when it\'s uncomfortable.'
    },
    {
      date: '2026-04-10',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I care for people without trying to fix them.'
    },
    {
      date: '2026-04-10',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I distinguish between fighting a good fight and picking unnecessary battles.'
    },
    {
      date: '2026-04-10',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I handle uncertainty in relationships with composure.'
    },
    {
      date: '2026-04-10',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Specific sensory triggers bring a flood of old memories.'
    },
    {
      date: '2026-04-10',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy design, architecture, or visual arts.'
    },
    {
      date: '2026-04-10',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy gardening, foraging, or tending living things.'
    },
    {
      date: '2026-04-11',
      category: 'values',
      answer: 'True',
      questionText: 'A specific place in nature holds deep meaning for me.'
    },
    {
      date: '2026-04-11',
      category: 'values',
      answer: 'True',
      questionText: 'I can find something funny even in my own suffering.'
    },
    {
      date: '2026-04-11',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Dropping all my masks for a day would be both terrifying and liberating.'
    },
    {
      date: '2026-04-11',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am deeply aware of what is most beautiful about being human.'
    },
    {
      date: '2026-04-11',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I adapt my thinking style for different kinds of challenges.'
    },
    {
      date: '2026-04-11',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I balance structured learning with explorative discovery.'
    },
    {
      date: '2026-04-11',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I process information best when it is colour-coded or spatially arranged.'
    },
    {
      date: '2026-04-11',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am physically expressive — people can read my body easily.'
    },
    {
      date: '2026-04-12',
      category: 'values',
      answer: 'True',
      questionText: 'I have a clear vision of how I want to grow in the next year.'
    },
    {
      date: '2026-04-12',
      category: 'values',
      answer: 'True',
      questionText: 'I am tolerating things in my life that conflict with my values.'
    },
    {
      date: '2026-04-12',
      category: 'values',
      answer: 'True',
      questionText: 'Complexity in my life often masks a lack of clarity about what matters.'
    },
    {
      date: '2026-04-12',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I navigate the tension between going deep and going wide in life.'
    },
    {
      date: '2026-04-12',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I carry wisdom I could share with someone going through what I once went through.'
    },
    {
      date: '2026-04-12',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am living inside a myth of my own making.'
    },
    {
      date: '2026-04-12',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I think most effectively in writing rather than speaking or drawing.'
    },
    {
      date: '2026-04-12',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I analyse complex issues thoroughly and effectively.'
    },
    {
      date: '2026-04-12',
      category: 'cognitive',
      answer: 'True',
      questionText: 'My inner monologue is structured and clear.'
    },
    {
      date: '2026-04-12',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I prefer evidence-based decisions over intuition.'
    },
    {
      date: '2026-04-12',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I remember places by their visual landmarks.'
    },
    {
      date: '2026-04-12',
      category: 'intelligence',
      answer: 'Somewhat',
      questionText: 'I enjoy group brainstorming and collaborative thinking.'
    },
    {
      date: '2026-04-13',
      category: 'values',
      answer: 'True',
      questionText: 'I over-control parts of my life because of an underlying fear.'
    },
    {
      date: '2026-04-13',
      category: 'values',
      answer: 'True',
      questionText: 'My family of origin has shaped me in ways I am still discovering.'
    },
    {
      date: '2026-04-13',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I handle someone trying to diminish my power with composure.'
    },
    {
      date: '2026-04-13',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I respect both my extraverted and introverted needs.'
    },
    {
      date: '2026-04-13',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I articulate what I think with precision and clarity.'
    },
    {
      date: '2026-04-13',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I recognise when I am reasoning well versus poorly.'
    },
    {
      date: '2026-04-13',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am deeply curious about what happens after death.'
    },
    {
      date: '2026-04-13',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I prefer natural materials over synthetic ones.'
    },
    {
      date: '2026-04-14',
      category: 'values',
      answer: 'True',
      questionText: 'There are areas of my life that need stronger boundaries right now.'
    },
    {
      date: '2026-04-14',
      category: 'values',
      answer: 'True',
      questionText: 'I share my creative gifts generously with others.'
    },
    {
      date: '2026-04-14',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am embodying a specific archetype in this season of my life.'
    },
    {
      date: '2026-04-14',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am approaching a meaningful milestone of personal growth.'
    },
    {
      date: '2026-04-14',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I adjust my beliefs when I discover I\'ve been wrong.'
    },
    {
      date: '2026-04-14',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I find deep satisfaction in thorough analysis.'
    },
    {
      date: '2026-04-14',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to live music and feel it differently than recorded music.'
    },
    {
      date: '2026-04-14',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I know what triggers my anxiety, anger, or sadness.'
    },
    {
      date: '2026-04-15',
      category: 'values',
      answer: 'True',
      questionText: 'I know exactly how I want to be cared for when I\'m at my lowest.'
    },
    {
      date: '2026-04-15',
      category: 'values',
      answer: 'True',
      questionText: 'I stay grounded during periods of uncertainty.'
    },
    {
      date: '2026-04-15',
      category: 'values',
      answer: 'True',
      questionText: 'I prepare for the unknown without living in anxiety.'
    },
    {
      date: '2026-04-15',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My soul needs something that my ego keeps ignoring.'
    },
    {
      date: '2026-04-15',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Powerlessness has a specific, recognisable feeling in my body.'
    },
    {
      date: '2026-04-15',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I maintain dignity when life strips away my defences.'
    },
    {
      date: '2026-04-15',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I process disagreements in real-time conversation effectively.'
    },
    {
      date: '2026-04-15',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I notice when my attention is being manipulated.'
    },
    {
      date: '2026-04-15',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I review my day mentally before sleep.'
    },
    {
      date: '2026-04-15',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I enjoy experimenting with sound — instruments, apps, or voice.'
    },
    {
      date: '2026-04-15',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I instinctively rearrange spaces to make them feel better.'
    },
    {
      date: '2026-04-15',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to philosophical paradoxes and thought experiments.'
    },
    {
      date: '2026-04-16',
      category: 'values',
      answer: 'True',
      questionText: 'Honour is an active part of my personal code.'
    },
    {
      date: '2026-04-16',
      category: 'values',
      answer: 'True',
      questionText: 'I am willing to be a beginner at something new.'
    },
    {
      date: '2026-04-16',
      category: 'archetypes',
      answer: 'True',
      questionText: 'The most important things in my life are invisible.'
    },
    {
      date: '2026-04-16',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I stay anchored even when my purpose feels unclear.'
    },
    {
      date: '2026-04-16',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I move from thinking about an idea to actually implementing it.'
    },
    {
      date: '2026-04-16',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I am evolving the aspects of my cognition I most want to improve.'
    },
    {
      date: '2026-04-16',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am moved by the fragility and impermanence of life.'
    },
    {
      date: '2026-04-16',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I would feel deeply diminished if music disappeared from my life.'
    },
    {
      date: '2026-04-17',
      category: 'values',
      answer: 'True',
      questionText: 'I make deliberate time to be in natural spaces.'
    },
    {
      date: '2026-04-17',
      category: 'values',
      answer: 'True',
      questionText: 'The natural world has taught me something important about myself.'
    },
    {
      date: '2026-04-17',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I can clearly differentiate between intuition and impulse.'
    },
    {
      date: '2026-04-17',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Being "on" all day is cognitively and emotionally exhausting.'
    },
    {
      date: '2026-04-17',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I have a comfort memory I return to when I need grounding.'
    },
    {
      date: '2026-04-17',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Physical movement helps my thinking when I\'m stuck.'
    },
    {
      date: '2026-04-17',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice when landscapes, forests, or green spaces are healthy or damaged.'
    },
    {
      date: '2026-04-17',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am good at making introductions and connecting people.'
    },
    {
      date: '2026-04-18',
      category: 'values',
      answer: 'True',
      questionText: 'I experience emotional security in my closest relationship.'
    },
    {
      date: '2026-04-18',
      category: 'values',
      answer: 'True',
      questionText: 'I am neglecting a creative urge that wants my attention.'
    },
    {
      date: '2026-04-18',
      category: 'values',
      answer: 'True',
      questionText: 'Someone else\'s compassion recently shifted the course of my day.'
    },
    {
      date: '2026-04-18',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I experience real conflict between desire and duty.'
    },
    {
      date: '2026-04-18',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I feel the vulnerability of being between who I was and who I\'m becoming.'
    },
    {
      date: '2026-04-18',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Homecoming after a long internal journey brings me deep peace.'
    },
    {
      date: '2026-04-18',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I listen more than I respond in conversations.'
    },
    {
      date: '2026-04-18',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I adapt my plans fluidly when the rules keep changing.'
    },
    {
      date: '2026-04-18',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I trust my first thought and act on it confidently.'
    },
    {
      date: '2026-04-18',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I am drawn to stories about transformation and transcendence.'
    },
    {
      date: '2026-04-18',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I find it hard to think clearly when my body feels tense.'
    },
    {
      date: '2026-04-18',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I remember details about people — their stories, preferences, struggles.'
    },
    {
      date: '2026-04-19',
      category: 'values',
      answer: 'True',
      questionText: 'I use humor to connect rather than to deflect.'
    },
    {
      date: '2026-04-19',
      category: 'values',
      answer: 'True',
      questionText: 'A recurring desire in me is guiding my life choices.'
    },
    {
      date: '2026-04-19',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I honour my past while stepping into my future.'
    },
    {
      date: '2026-04-19',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My relationship with silence reveals something important about me.'
    },
    {
      date: '2026-04-19',
      category: 'cognitive',
      answer: 'True',
      questionText: 'These reflections have taught me something important about myself.'
    },
    {
      date: '2026-04-19',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I default to seeing uncertainty as opportunity rather than threat.'
    },
    {
      date: '2026-04-19',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I can tell what material something is by touching it.'
    },
    {
      date: '2026-04-19',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel a responsibility to protect the natural world.'
    },
    {
      date: '2026-04-20',
      category: 'values',
      answer: 'True',
      questionText: 'I navigate moral grey areas thoughtfully rather than reactively.'
    },
    {
      date: '2026-04-20',
      category: 'values',
      answer: 'True',
      questionText: 'I have learned something about life that I consider profoundly important.'
    },
    {
      date: '2026-04-20',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I am on a meaningful quest or mission in my life right now.'
    },
    {
      date: '2026-04-20',
      category: 'archetypes',
      answer: 'True',
      questionText: 'My ideal self and my real self are not far apart.'
    },
    {
      date: '2026-04-20',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I give my fullest attention to the activities that engage me.'
    },
    {
      date: '2026-04-20',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I apply cognitive flexibility naturally in different situations.'
    },
    {
      date: '2026-04-20',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I like categorising and organising information.'
    },
    {
      date: '2026-04-20',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I feel calmer near water — rivers, lakes, ocean.'
    },
    {
      date: '2026-04-21',
      category: 'values',
      answer: 'True',
      questionText: 'I know when to speak up and when to stay quiet.'
    },
    {
      date: '2026-04-21',
      category: 'values',
      answer: 'True',
      questionText: 'I balance structure and spontaneity well in my life.'
    },
    {
      date: '2026-04-21',
      category: 'values',
      answer: 'True',
      questionText: 'I am consciously creating the legacy I want to leave.'
    },
    {
      date: '2026-04-21',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I process life experiences on a symbolic level, not just a literal one.'
    },
    {
      date: '2026-04-21',
      category: 'archetypes',
      answer: 'True',
      questionText: 'Part of my personality is actually a survival strategy from the past.'
    },
    {
      date: '2026-04-21',
      category: 'archetypes',
      answer: 'True',
      questionText: 'I perform a character when I\'m trying to impress someone.'
    },
    {
      date: '2026-04-21',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I adopt mental models from others that improve my thinking.'
    },
    {
      date: '2026-04-21',
      category: 'cognitive',
      answer: 'True',
      questionText: 'Self-reflection plays a central role in my intellectual growth.'
    },
    {
      date: '2026-04-21',
      category: 'cognitive',
      answer: 'True',
      questionText: 'I reframe problems effectively when the original framing leads nowhere.'
    },
    {
      date: '2026-04-21',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I rely on spreadsheets, charts, or structured tools to organise decisions.'
    },
    {
      date: '2026-04-21',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I notice subtle shifts in someone\'s tone or energy.'
    },
    {
      date: '2026-04-21',
      category: 'intelligence',
      answer: 'True',
      questionText: 'I keep journals, notes, or letters regularly.'
    }
  ],
  somaticEntries: [
    {
      date: '2026-01-22T08:30:00.000Z',
      region: 'throat',
      emotion: 'anger',
      intensity: 2,
      note: '\'I woke up already bracing\' showed up physically in my throat today; the sensation felt like anger with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-01-23T09:30:00.000Z',
      region: 'heart',
      emotion: 'overwhelm',
      intensity: 3,
      note: '\'Trying not to feel so visible\' showed up physically in my heart today; the sensation felt like overwhelm with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-01-24T10:30:00.000Z',
      region: 'hips',
      emotion: 'tenderness',
      intensity: 4,
      note: '\'The hearing part of feeling left out\' showed up physically in my hips today; the sensation felt like tenderness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-01-25T11:30:00.000Z',
      region: 'jaw',
      emotion: 'loneliness',
      intensity: 5,
      note: '\'A quiet grief day\' showed up physically in my jaw today; the sensation felt like loneliness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Loss changing the whole tone of the day from underneath.',
      whatHelped: 'Crying instead of managing it into numbness.'
    },
    {
      date: '2026-01-26T12:30:00.000Z',
      region: 'legs',
      emotion: 'pressure',
      intensity: 2,
      note: '\'I can feel comparison working on me\' showed up physically in my legs today; the sensation felt like pressure with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Comparing myself to another woman and collapsing inward.',
      whatHelped: 'Interrupting the spiral before it became contempt.'
    },
    {
      date: '2026-01-27T13:30:00.000Z',
      region: 'back',
      emotion: 'numbness',
      intensity: 3,
      note: '\'Missing Naomi in small moments\' showed up physically in my back today; the sensation felt like numbness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Being reminded that attachment can stay active even after the role changes.',
      whatHelped: 'Letting the grief be grief instead of turning it into self-criticism.'
    },
    {
      date: '2026-01-28T14:30:00.000Z',
      region: 'arms',
      emotion: 'anxiety',
      intensity: 4,
      note: '\'Everything feels heavier when I am tired\' showed up physically in my arms today; the sensation felt like anxiety with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-01-29T15:30:00.000Z',
      region: 'back',
      emotion: 'dread',
      intensity: 5,
      note: '\'Wanting to be noticed without asking\' showed up physically in my back today; the sensation felt like dread with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Carrying more than I looked like I was carrying.',
      whatHelped: 'Quiet, less stimulation, and asking less of myself.'
    },
    {
      date: '2026-01-30T16:30:00.000Z',
      region: 'head',
      emotion: 'protectiveness',
      intensity: 2,
      note: '\'I am more sensitive than I look\' showed up physically in my head today; the sensation felt like protectiveness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-01-31T17:30:00.000Z',
      region: 'arms',
      emotion: 'shame',
      intensity: 3,
      note: '\'My body knew before my mind did\' showed up physically in my arms today; the sensation felt like shame with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-02-01T18:30:00.000Z',
      region: 'back',
      emotion: 'relief',
      intensity: 4,
      note: '\'Wishing I were easier to be\' showed up physically in my back today; the sensation felt like relief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-02-02T08:30:00.000Z',
      region: 'shoulders',
      emotion: 'grief',
      intensity: 5,
      note: '\'The loneliness under competence\' showed up physically in my shoulders today; the sensation felt like grief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-02-03T09:30:00.000Z',
      region: 'shoulders',
      emotion: 'anger',
      intensity: 2,
      note: '\'I needed more softness today\' showed up physically in my shoulders today; the sensation felt like anger with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-02-04T10:30:00.000Z',
      region: 'back',
      emotion: 'overwhelm',
      intensity: 3,
      note: '\'It is hard not to read things as rejection\' showed up physically in my back today; the sensation felt like overwhelm with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Loss changing the whole tone of the day from underneath.',
      whatHelped: 'Crying instead of managing it into numbness.'
    },
    {
      date: '2026-02-05T11:30:00.000Z',
      region: 'shoulders',
      emotion: 'tenderness',
      intensity: 4,
      note: '\'I kept overexplaining and hated it\' showed up physically in my shoulders today; the sensation felt like tenderness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Comparing myself to another woman and collapsing inward.',
      whatHelped: 'Interrupting the spiral before it became contempt.'
    },
    {
      date: '2026-02-06T12:30:00.000Z',
      region: 'solar_plexus',
      emotion: 'loneliness',
      intensity: 5,
      note: '\'Lucas deserved a less depleted version of me\' showed up physically in my solar_plexus today; the sensation felt like loneliness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Holding caregiving responsibility while already depleted.',
      whatHelped: 'Lowering the bar and choosing connection over performance.'
    },
    {
      date: '2026-02-07T13:30:00.000Z',
      region: 'chest',
      emotion: 'pressure',
      intensity: 2,
      note: '\'I miss being met quickly\' showed up physically in my chest today; the sensation felt like pressure with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Loss changing the whole tone of the day from underneath.',
      whatHelped: 'Crying instead of managing it into numbness.'
    },
    {
      date: '2026-02-08T14:30:00.000Z',
      region: 'arms',
      emotion: 'numbness',
      intensity: 3,
      note: '\'Old family pain in a new moment\' showed up physically in my arms today; the sensation felt like numbness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'An old family dynamic getting touched in the present.',
      whatHelped: 'Giving myself more validation than the room could.'
    },
    {
      date: '2026-02-09T15:30:00.000Z',
      region: 'heart',
      emotion: 'anxiety',
      intensity: 4,
      note: '\'Today my hearing made me feel separate\' showed up physically in my heart today; the sensation felt like anxiety with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-02-10T16:30:00.000Z',
      region: 'chest',
      emotion: 'dread',
      intensity: 5,
      note: '\'Wanting to be chosen without performing\' showed up physically in my chest today; the sensation felt like dread with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-02-11T17:30:00.000Z',
      region: 'arms',
      emotion: 'protectiveness',
      intensity: 2,
      note: '\'I do not think people realize how much I carry\' showed up physically in my arms today; the sensation felt like protectiveness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-02-12T18:30:00.000Z',
      region: 'legs',
      emotion: 'shame',
      intensity: 3,
      note: '\'Trying not to spiral\' showed up physically in my legs today; the sensation felt like shame with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-02-13T08:30:00.000Z',
      region: 'heart',
      emotion: 'relief',
      intensity: 4,
      note: '\'I felt small in a way I could not hide from myself\' showed up physically in my heart today; the sensation felt like relief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-02-14T09:30:00.000Z',
      region: 'stomach',
      emotion: 'grief',
      intensity: 5,
      note: '\'So much of me is trying to stay acceptable\' showed up physically in my stomach today; the sensation felt like grief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Loss changing the whole tone of the day from underneath.',
      whatHelped: 'Crying instead of managing it into numbness.'
    },
    {
      date: '2026-02-15T10:30:00.000Z',
      region: 'throat',
      emotion: 'anger',
      intensity: 2,
      note: '\'A body-memory kind of day\' showed up physically in my throat today; the sensation felt like anger with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-02-16T11:30:00.000Z',
      region: 'legs',
      emotion: 'overwhelm',
      intensity: 3,
      note: '\'I was more flooded than I looked\' showed up physically in my legs today; the sensation felt like overwhelm with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Being reminded that attachment can stay active even after the role changes.',
      whatHelped: 'Letting the grief be grief instead of turning it into self-criticism.'
    },
    {
      date: '2026-02-17T12:30:00.000Z',
      region: 'shoulders',
      emotion: 'tenderness',
      intensity: 4,
      note: '\'I wish belonging felt less fragile\' showed up physically in my shoulders today; the sensation felt like tenderness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'An old family dynamic getting touched in the present.',
      whatHelped: 'Giving myself more validation than the room could.'
    },
    {
      date: '2026-02-18T13:30:00.000Z',
      region: 'legs',
      emotion: 'loneliness',
      intensity: 5,
      note: '\'The system takes and takes\' showed up physically in my legs today; the sensation felt like loneliness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Carrying more than I looked like I was carrying.',
      whatHelped: 'Quiet, less stimulation, and asking less of myself.'
    },
    {
      date: '2026-02-19T14:30:00.000Z',
      region: 'head',
      emotion: 'pressure',
      intensity: 2,
      note: '\'I felt ugly and overaware today\' showed up physically in my head today; the sensation felt like pressure with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-02-20T15:30:00.000Z',
      region: 'chest',
      emotion: 'numbness',
      intensity: 3,
      note: '\'I am tired of needing reassurance\' showed up physically in my chest today; the sensation felt like numbness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-02-21T16:30:00.000Z',
      region: 'solar_plexus',
      emotion: 'anxiety',
      intensity: 4,
      note: '\'Part of me still expects to be left\' showed up physically in my solar_plexus today; the sensation felt like anxiety with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-02-22T17:30:00.000Z',
      region: 'head',
      emotion: 'dread',
      intensity: 5,
      note: '\'Nothing huge happened and I still felt wrecked\' showed up physically in my head today; the sensation felt like dread with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-02-23T18:30:00.000Z',
      region: 'head',
      emotion: 'protectiveness',
      intensity: 2,
      note: '\'I wanted to be held differently\' showed up physically in my head today; the sensation felt like protectiveness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-02-24T08:30:00.000Z',
      region: 'stomach',
      emotion: 'shame',
      intensity: 3,
      note: '\'When I miss part of the conversation, I miss more than words\' showed up physically in my stomach today; the sensation felt like shame with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-02-25T09:30:00.000Z',
      region: 'heart',
      emotion: 'relief',
      intensity: 4,
      note: '\'I keep trying to earn rest\' showed up physically in my heart today; the sensation felt like relief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Comparing myself to another woman and collapsing inward.',
      whatHelped: 'Interrupting the spiral before it became contempt.'
    },
    {
      date: '2026-02-26T10:30:00.000Z',
      region: 'legs',
      emotion: 'grief',
      intensity: 5,
      note: '\'My chest was tight all day\' showed up physically in my legs today; the sensation felt like grief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Being reminded that attachment can stay active even after the role changes.',
      whatHelped: 'Letting the grief be grief instead of turning it into self-criticism.'
    },
    {
      date: '2026-02-27T11:30:00.000Z',
      region: 'arms',
      emotion: 'anger',
      intensity: 2,
      note: '\'I hate how fast embarrassment turns into shame\' showed up physically in my arms today; the sensation felt like anger with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Carrying more than I looked like I was carrying.',
      whatHelped: 'Quiet, less stimulation, and asking less of myself.'
    },
    {
      date: '2026-02-28T12:30:00.000Z',
      region: 'stomach',
      emotion: 'overwhelm',
      intensity: 3,
      note: '\'Some days I feel like a burden just for existing\' showed up physically in my stomach today; the sensation felt like overwhelm with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'An old family dynamic getting touched in the present.',
      whatHelped: 'Giving myself more validation than the room could.'
    },
    {
      date: '2026-03-01T13:30:00.000Z',
      region: 'stomach',
      emotion: 'tenderness',
      intensity: 4,
      note: '\'There is anger under this sadness\' showed up physically in my stomach today; the sensation felt like tenderness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-03-02T14:30:00.000Z',
      region: 'hips',
      emotion: 'loneliness',
      intensity: 5,
      note: '\'I can feel the younger ache in me\' showed up physically in my hips today; the sensation felt like loneliness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-03-03T15:30:00.000Z',
      region: 'arms',
      emotion: 'pressure',
      intensity: 2,
      note: '\'I needed clarity and got ambiguity\' showed up physically in my arms today; the sensation felt like pressure with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-03-04T16:30:00.000Z',
      region: 'jaw',
      emotion: 'numbness',
      intensity: 3,
      note: '\'My nervous system hates uncertainty\' showed up physically in my jaw today; the sensation felt like numbness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-03-05T17:30:00.000Z',
      region: 'hips',
      emotion: 'anxiety',
      intensity: 4,
      note: '\'I did not want to be perceived today\' showed up physically in my hips today; the sensation felt like anxiety with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-03-06T18:30:00.000Z',
      region: 'shoulders',
      emotion: 'dread',
      intensity: 5,
      note: '\'The grief comes back in flashes\' showed up physically in my shoulders today; the sensation felt like dread with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-03-07T08:30:00.000Z',
      region: 'hips',
      emotion: 'protectiveness',
      intensity: 2,
      note: '\'I held it together, but barely\' showed up physically in my hips today; the sensation felt like protectiveness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Comparing myself to another woman and collapsing inward.',
      whatHelped: 'Interrupting the spiral before it became contempt.'
    },
    {
      date: '2026-03-08T09:30:00.000Z',
      region: 'head',
      emotion: 'shame',
      intensity: 3,
      note: '\'I wish I trusted myself more\' showed up physically in my head today; the sensation felt like shame with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Being reminded that attachment can stay active even after the role changes.',
      whatHelped: 'Letting the grief be grief instead of turning it into self-criticism.'
    },
    {
      date: '2026-03-09T10:30:00.000Z',
      region: 'back',
      emotion: 'relief',
      intensity: 4,
      note: '\'Today felt like too many selves at once\' showed up physically in my back today; the sensation felt like relief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-03-10T11:30:00.000Z',
      region: 'legs',
      emotion: 'grief',
      intensity: 5,
      note: '\'I wanted to withdraw before anyone could reject me\' showed up physically in my legs today; the sensation felt like grief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Carrying more than I looked like I was carrying.',
      whatHelped: 'Quiet, less stimulation, and asking less of myself.'
    },
    {
      date: '2026-03-11T12:30:00.000Z',
      region: 'solar_plexus',
      emotion: 'anger',
      intensity: 2,
      note: '\'I can feel how much I want safe closeness\' showed up physically in my solar_plexus today; the sensation felt like anger with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-03-12T13:30:00.000Z',
      region: 'chest',
      emotion: 'overwhelm',
      intensity: 3,
      note: '\'The house felt heavy with my mood\' showed up physically in my chest today; the sensation felt like overwhelm with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-03-13T14:30:00.000Z',
      region: 'stomach',
      emotion: 'tenderness',
      intensity: 4,
      note: '\'I kept replaying everything after\' showed up physically in my stomach today; the sensation felt like tenderness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-03-14T15:30:00.000Z',
      region: 'shoulders',
      emotion: 'loneliness',
      intensity: 5,
      note: '\'Some pain is quiet but constant\' showed up physically in my shoulders today; the sensation felt like loneliness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-03-15T16:30:00.000Z',
      region: 'stomach',
      emotion: 'pressure',
      intensity: 2,
      note: '\'I am always watching for shifts in tone\' showed up physically in my stomach today; the sensation felt like pressure with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-03-16T17:30:00.000Z',
      region: 'heart',
      emotion: 'numbness',
      intensity: 3,
      note: '\'I wanted to be less needy and more honest\' showed up physically in my heart today; the sensation felt like numbness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Loss changing the whole tone of the day from underneath.',
      whatHelped: 'Crying instead of managing it into numbness.'
    },
    {
      date: '2026-03-17T18:30:00.000Z',
      region: 'back',
      emotion: 'anxiety',
      intensity: 4,
      note: '\'The foster care stress lives in my body\' showed up physically in my back today; the sensation felt like anxiety with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-03-18T08:30:00.000Z',
      region: 'back',
      emotion: 'dread',
      intensity: 5,
      note: '\'Sometimes care feels invisible unless I collapse\' showed up physically in my back today; the sensation felt like dread with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Being reminded that attachment can stay active even after the role changes.',
      whatHelped: 'Letting the grief be grief instead of turning it into self-criticism.'
    },
    {
      date: '2026-03-19T09:30:00.000Z',
      region: 'back',
      emotion: 'protectiveness',
      intensity: 2,
      note: '\'I felt behind all day\' showed up physically in my back today; the sensation felt like protectiveness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Carrying more than I looked like I was carrying.',
      whatHelped: 'Quiet, less stimulation, and asking less of myself.'
    },
    {
      date: '2026-03-20T10:30:00.000Z',
      region: 'back',
      emotion: 'shame',
      intensity: 3,
      note: '\'The day asked too much from me\' showed up physically in my back today; the sensation felt like shame with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'An old family dynamic getting touched in the present.',
      whatHelped: 'Giving myself more validation than the room could.'
    },
    {
      date: '2026-03-21T11:30:00.000Z',
      region: 'arms',
      emotion: 'relief',
      intensity: 4,
      note: '\'I wanted home to feel softer\' showed up physically in my arms today; the sensation felt like relief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-03-22T12:30:00.000Z',
      region: 'jaw',
      emotion: 'grief',
      intensity: 5,
      note: '\'I notice rejection before I notice safety\' showed up physically in my jaw today; the sensation felt like grief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-03-23T13:30:00.000Z',
      region: 'legs',
      emotion: 'anger',
      intensity: 2,
      note: '\'I do not know how to stop comparing\' showed up physically in my legs today; the sensation felt like anger with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-03-24T14:30:00.000Z',
      region: 'solar_plexus',
      emotion: 'overwhelm',
      intensity: 3,
      note: '\'A dream stayed in my chest all morning\' showed up physically in my solar_plexus today; the sensation felt like overwhelm with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-03-25T15:30:00.000Z',
      region: 'solar_plexus',
      emotion: 'tenderness',
      intensity: 4,
      note: '\'I felt both protective and depleted\' showed up physically in my solar_plexus today; the sensation felt like tenderness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-03-26T16:30:00.000Z',
      region: 'legs',
      emotion: 'loneliness',
      intensity: 5,
      note: '\'I wanted someone to understand without explanation\' showed up physically in my legs today; the sensation felt like loneliness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Loss changing the whole tone of the day from underneath.',
      whatHelped: 'Crying instead of managing it into numbness.'
    },
    {
      date: '2026-03-27T17:30:00.000Z',
      region: 'arms',
      emotion: 'pressure',
      intensity: 2,
      note: '\'I can feel how badly I want repair\' showed up physically in my arms today; the sensation felt like pressure with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Comparing myself to another woman and collapsing inward.',
      whatHelped: 'Interrupting the spiral before it became contempt.'
    },
    {
      date: '2026-03-28T18:30:00.000Z',
      region: 'heart',
      emotion: 'numbness',
      intensity: 3,
      note: '\'Being misunderstood hit me harder than it should have\' showed up physically in my heart today; the sensation felt like numbness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Being reminded that attachment can stay active even after the role changes.',
      whatHelped: 'Letting the grief be grief instead of turning it into self-criticism.'
    },
    {
      date: '2026-03-29T08:30:00.000Z',
      region: 'head',
      emotion: 'anxiety',
      intensity: 4,
      note: '\'I am trying not to harden\' showed up physically in my head today; the sensation felt like anxiety with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-03-30T09:30:00.000Z',
      region: 'chest',
      emotion: 'dread',
      intensity: 5,
      note: '\'The sadness sat behind everything today\' showed up physically in my chest today; the sensation felt like dread with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Carrying more than I looked like I was carrying.',
      whatHelped: 'Quiet, less stimulation, and asking less of myself.'
    },
    {
      date: '2026-03-31T10:30:00.000Z',
      region: 'shoulders',
      emotion: 'protectiveness',
      intensity: 2,
      note: '\'I can feel how much performance costs me\' showed up physically in my shoulders today; the sensation felt like protectiveness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-04-01T11:30:00.000Z',
      region: 'hips',
      emotion: 'shame',
      intensity: 3,
      note: '\'I needed permission to stop\' showed up physically in my hips today; the sensation felt like shame with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-04-02T12:30:00.000Z',
      region: 'jaw',
      emotion: 'relief',
      intensity: 4,
      note: '\'I wish support reached me sooner\' showed up physically in my jaw today; the sensation felt like relief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-04-03T13:30:00.000Z',
      region: 'stomach',
      emotion: 'grief',
      intensity: 5,
      note: '\'I felt disconnected even while functioning\' showed up physically in my stomach today; the sensation felt like grief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-04-04T14:30:00.000Z',
      region: 'heart',
      emotion: 'anger',
      intensity: 2,
      note: '\'There is a tiredness that sleep does not fix\' showed up physically in my heart today; the sensation felt like anger with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-04-05T15:30:00.000Z',
      region: 'back',
      emotion: 'overwhelm',
      intensity: 3,
      note: '\'I wanted to be less visible and more loved\' showed up physically in my back today; the sensation felt like overwhelm with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Loss changing the whole tone of the day from underneath.',
      whatHelped: 'Crying instead of managing it into numbness.'
    },
    {
      date: '2026-04-06T16:30:00.000Z',
      region: 'chest',
      emotion: 'tenderness',
      intensity: 4,
      note: '\'Today I felt the fear of being replaceable\' showed up physically in my chest today; the sensation felt like tenderness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Comparing myself to another woman and collapsing inward.',
      whatHelped: 'Interrupting the spiral before it became contempt.'
    },
    {
      date: '2026-04-07T17:30:00.000Z',
      region: 'throat',
      emotion: 'loneliness',
      intensity: 5,
      note: '\'I wanted my body to unclench\' showed up physically in my throat today; the sensation felt like loneliness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Being reminded that attachment can stay active even after the role changes.',
      whatHelped: 'Letting the grief be grief instead of turning it into self-criticism.'
    },
    {
      date: '2026-04-08T18:30:00.000Z',
      region: 'heart',
      emotion: 'pressure',
      intensity: 2,
      note: '\'The ache of not feeling singular\' showed up physically in my heart today; the sensation felt like pressure with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Carrying more than I looked like I was carrying.',
      whatHelped: 'Quiet, less stimulation, and asking less of myself.'
    },
    {
      date: '2026-04-09T08:30:00.000Z',
      region: 'stomach',
      emotion: 'numbness',
      intensity: 3,
      note: '\'I can see the pattern and still get caught in it\' showed up physically in my stomach today; the sensation felt like numbness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'An old family dynamic getting touched in the present.',
      whatHelped: 'Giving myself more validation than the room could.'
    },
    {
      date: '2026-04-10T09:30:00.000Z',
      region: 'jaw',
      emotion: 'anxiety',
      intensity: 4,
      note: '\'I wish I felt safer in closeness\' showed up physically in my jaw today; the sensation felt like anxiety with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling too visible and outside of the room at the same time.',
      whatHelped: 'Grounding through breath and letting myself talk less.'
    },
    {
      date: '2026-04-11T10:30:00.000Z',
      region: 'jaw',
      emotion: 'dread',
      intensity: 5,
      note: '\'I ended the day overstimulated and lonely\' showed up physically in my jaw today; the sensation felt like dread with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-04-12T11:30:00.000Z',
      region: 'chest',
      emotion: 'protectiveness',
      intensity: 2,
      note: '\'I am tired of the system\' showed up physically in my chest today; the sensation felt like protectiveness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'A body memory coming online before my mind caught up.',
      whatHelped: 'Pausing long enough to notice sensation before story.'
    },
    {
      date: '2026-04-13T12:30:00.000Z',
      region: 'solar_plexus',
      emotion: 'shame',
      intensity: 3,
      note: '\'Wanting Annie to choose me\' showed up physically in my solar_plexus today; the sensation felt like shame with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Attachment longing showing up as a physical ache.',
      whatHelped: 'Writing honestly instead of pretending I was unaffected.'
    },
    {
      date: '2026-04-14T13:30:00.000Z',
      region: 'shoulders',
      emotion: 'relief',
      intensity: 4,
      note: '\'Feeling left out again\' showed up physically in my shoulders today; the sensation felt like relief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-04-15T14:30:00.000Z',
      region: 'hips',
      emotion: 'grief',
      intensity: 5,
      note: '\'Feeling blurry inside\' showed up physically in my hips today; the sensation felt like grief with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Loss changing the whole tone of the day from underneath.',
      whatHelped: 'Crying instead of managing it into numbness.'
    },
    {
      date: '2026-04-16T15:30:00.000Z',
      region: 'stomach',
      emotion: 'anger',
      intensity: 2,
      note: '\'Wishing I were easier to be\' showed up physically in my stomach today; the sensation felt like anger with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Comparing myself to another woman and collapsing inward.',
      whatHelped: 'Interrupting the spiral before it became contempt.'
    },
    {
      date: '2026-04-17T16:30:00.000Z',
      region: 'solar_plexus',
      emotion: 'overwhelm',
      intensity: 3,
      note: '\'Everyone probably hates me\' showed up physically in my solar_plexus today; the sensation felt like overwhelm with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Being reminded that attachment can stay active even after the role changes.',
      whatHelped: 'Letting the grief be grief instead of turning it into self-criticism.'
    },
    {
      date: '2026-04-18T17:30:00.000Z',
      region: 'shoulders',
      emotion: 'tenderness',
      intensity: 4,
      note: '\'The hearing part people do not see\' showed up physically in my shoulders today; the sensation felt like tenderness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Not catching part of a conversation and feeling the emotional lag after it.',
      whatHelped: 'Stepping away from noise and letting my face unclench.'
    },
    {
      date: '2026-04-19T18:30:00.000Z',
      region: 'back',
      emotion: 'loneliness',
      intensity: 5,
      note: '\'Raising Lucas while running on empty\' showed up physically in my back today; the sensation felt like loneliness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Holding caregiving responsibility while already depleted.',
      whatHelped: 'Lowering the bar and choosing connection over performance.'
    },
    {
      date: '2026-04-20T08:30:00.000Z',
      region: 'throat',
      emotion: 'pressure',
      intensity: 2,
      note: '\'Naomi leaving still hurts\' showed up physically in my throat today; the sensation felt like pressure with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Being reminded that attachment can stay active even after the role changes.',
      whatHelped: 'Letting the grief be grief instead of turning it into self-criticism.'
    },
    {
      date: '2026-04-21T09:30:00.000Z',
      region: 'stomach',
      emotion: 'numbness',
      intensity: 3,
      note: '\'Dealing with Sarah is its own strain\' showed up physically in my stomach today; the sensation felt like numbness with a very specific edge to it. What struck me was how quickly the body made the day personal.',
      trigger: 'Feeling system stress hit my body before I had words for it.',
      whatHelped: 'Moving my body and naming the anger directly.'
    }
  ],
  triggerEvents: [
    {
      date: '2026-01-22T09:00:00.000Z',
      mode: 'drain',
      event: 'Noticed a body memory before a clear thought — I woke up already bracing',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'jaw tension'
      ],
      note: 'This drain moment showed me how fast my system moves when my body was ahead of my mind. It paired with \'i woke up already bracing\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-01-23T10:00:00.000Z',
      mode: 'nourish',
      event: 'Felt late to the emotional tone of a group — Trying not to feel so visible',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'warm chest'
      ],
      note: 'The good part was how quickly my body recognized safety when I scanned for rejection before welcome. It paired with \'trying not to feel so visible\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-01-24T11:00:00.000Z',
      mode: 'drain',
      event: 'Laughed late because I did not catch the setup — The hearing part of feeling left out',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heavy limbs'
      ],
      note: 'I could feel the old pattern come online the second I could not catch what was happening quickly enough. It paired with \'the hearing part of feeling left out\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-01-25T12:00:00.000Z',
      mode: 'drain',
      event: 'Realized grief was underneath my irritability — A quiet grief day',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heat in face'
      ],
      note: 'The nervous-system shift was obvious as soon as loss changed the whole emotional temperature. It paired with \'a quiet grief day\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-01-26T13:00:00.000Z',
      mode: 'drain',
      event: 'Compared myself to another woman — I can feel comparison working on me',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'throat pressure'
      ],
      note: 'This drain moment showed me how fast my system moves when I turned on myself almost instantly. It paired with \'i can feel comparison working on me\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-01-27T14:00:00.000Z',
      mode: 'nourish',
      event: 'Passed a place tied to Naomi — Missing Naomi in small moments',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'fuller breath'
      ],
      note: 'The good part was how quickly my body recognized safety when attachment and absence were both present at once. It paired with \'missing naomi in small moments\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-01-28T15:00:00.000Z',
      mode: 'drain',
      event: 'Realized my nervous system had already decided it was unsafe — Everything feels heavier when I am tired',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'stomach drop'
      ],
      note: 'I could feel the old pattern come online the second my body was ahead of my mind. It paired with \'everything feels heavier when i am tired\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-01-29T16:00:00.000Z',
      mode: 'drain',
      event: 'Needed more softness than the day was offering — Wanting to be noticed without asking',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'jaw tension'
      ],
      note: 'The nervous-system shift was obvious as soon as I had less margin than I thought. It paired with \'wanting to be noticed without asking\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-01-30T17:00:00.000Z',
      mode: 'drain',
      event: 'Walked into a room already scanning — I am more sensitive than I look',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'held breath'
      ],
      note: 'This drain moment showed me how fast my system moves when I scanned for rejection before welcome. It paired with \'i am more sensitive than i look\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-01-31T18:00:00.000Z',
      mode: 'nourish',
      event: 'Felt my body react faster than language — My body knew before my mind did',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'grounded feet'
      ],
      note: 'The good part was how quickly my body recognized safety when my body was ahead of my mind. It paired with \'my body knew before my mind did\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-01T19:00:00.000Z',
      mode: 'drain',
      event: 'Realized my nervous system had already decided it was unsafe — Wishing I were easier to be',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heat in face'
      ],
      note: 'I could feel the old pattern come online the second my body was ahead of my mind. It paired with \'wishing i were easier to be\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-02T20:00:00.000Z',
      mode: 'drain',
      event: 'Noticed myself rehearsing before speaking — The loneliness under competence',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'throat pressure'
      ],
      note: 'The nervous-system shift was obvious as soon as I scanned for rejection before welcome. It paired with \'the loneliness under competence\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-03T09:00:00.000Z',
      mode: 'drain',
      event: 'Missed part of a conversation — I needed more softness today',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'chest tightening'
      ],
      note: 'This drain moment showed me how fast my system moves when I could not catch what was happening quickly enough. It paired with \'i needed more softness today\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-04T10:00:00.000Z',
      mode: 'nourish',
      event: 'Felt loss change the color of an ordinary moment — It is hard not to read things as rejection',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'softer jaw'
      ],
      note: 'The good part was how quickly my body recognized safety when loss changed the whole emotional temperature. It paired with \'it is hard not to read things as rejection\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-05T11:00:00.000Z',
      mode: 'drain',
      event: 'Turned someone else into proof against myself — I kept overexplaining and hated it',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'jaw tension'
      ],
      note: 'I could feel the old pattern come online the second I turned on myself almost instantly. It paired with \'i kept overexplaining and hated it\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-06T12:00:00.000Z',
      mode: 'drain',
      event: 'Cleaned up after Lucas while running on fumes — Lucas deserved a less depleted version of me',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'held breath'
      ],
      note: 'The nervous-system shift was obvious as soon as love did not cancel out depletion. It paired with \'lucas deserved a less depleted version of me\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-07T13:00:00.000Z',
      mode: 'drain',
      event: 'Had a quiet grief wave in the middle of the day — I miss being met quickly',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heavy limbs'
      ],
      note: 'This drain moment showed me how fast my system moves when loss changed the whole emotional temperature. It paired with \'i miss being met quickly\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-08T14:00:00.000Z',
      mode: 'nourish',
      event: 'Felt outside of family closeness — Old family pain in a new moment',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'clearer mind'
      ],
      note: 'The good part was how quickly my body recognized safety when belonging felt conditional again. It paired with \'old family pain in a new moment\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-09T15:00:00.000Z',
      mode: 'drain',
      event: 'Laughed late because I did not catch the setup — Today my hearing made me feel separate',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'throat pressure'
      ],
      note: 'I could feel the old pattern come online the second I could not catch what was happening quickly enough. It paired with \'today my hearing made me feel separate\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-10T16:00:00.000Z',
      mode: 'drain',
      event: 'Got flooded before I had a story for it — Wanting to be chosen without performing',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'chest tightening'
      ],
      note: 'The nervous-system shift was obvious as soon as my body was ahead of my mind. It paired with \'wanting to be chosen without performing\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-11T17:00:00.000Z',
      mode: 'drain',
      event: 'Noticed a body memory before a clear thought — I do not think people realize how much I carry',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'stomach drop'
      ],
      note: 'This drain moment showed me how fast my system moves when my body was ahead of my mind. It paired with \'i do not think people realize how much i carry\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-12T18:00:00.000Z',
      mode: 'nourish',
      event: 'Felt late to the emotional tone of a group — Trying not to spiral',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'shoulders dropping'
      ],
      note: 'The good part was how quickly my body recognized safety when I scanned for rejection before welcome. It paired with \'trying not to spiral\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-13T19:00:00.000Z',
      mode: 'drain',
      event: 'Laughed late because I did not catch the setup — I felt small in a way I could not hide from myself',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'held breath'
      ],
      note: 'I could feel the old pattern come online the second I could not catch what was happening quickly enough. It paired with \'i felt small in a way i could not hide from myself\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-14T20:00:00.000Z',
      mode: 'drain',
      event: 'Realized grief was underneath my irritability — So much of me is trying to stay acceptable',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heavy limbs'
      ],
      note: 'The nervous-system shift was obvious as soon as loss changed the whole emotional temperature. It paired with \'so much of me is trying to stay acceptable\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-15T09:00:00.000Z',
      mode: 'drain',
      event: 'Noticed a body memory before a clear thought — A body-memory kind of day',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heat in face'
      ],
      note: 'This drain moment showed me how fast my system moves when my body was ahead of my mind. It paired with \'a body-memory kind of day\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-16T10:00:00.000Z',
      mode: 'nourish',
      event: 'Passed a place tied to Naomi — I was more flooded than I looked',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'steady belly'
      ],
      note: 'The good part was how quickly my body recognized safety when attachment and absence were both present at once. It paired with \'i was more flooded than i looked\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-17T11:00:00.000Z',
      mode: 'drain',
      event: 'Remembered a family dynamic that still stings — I wish belonging felt less fragile',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'chest tightening'
      ],
      note: 'I could feel the old pattern come online the second belonging felt conditional again. It paired with \'i wish belonging felt less fragile\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-18T12:00:00.000Z',
      mode: 'drain',
      event: 'Needed more softness than the day was offering — The system takes and takes',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'stomach drop'
      ],
      note: 'The nervous-system shift was obvious as soon as I had less margin than I thought. It paired with \'the system takes and takes\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-19T13:00:00.000Z',
      mode: 'drain',
      event: 'Walked into a room already scanning — I felt ugly and overaware today',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'jaw tension'
      ],
      note: 'This drain moment showed me how fast my system moves when I scanned for rejection before welcome. It paired with \'i felt ugly and overaware today\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-20T14:00:00.000Z',
      mode: 'nourish',
      event: 'Felt my body react faster than language — I am tired of needing reassurance',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'warm chest'
      ],
      note: 'The good part was how quickly my body recognized safety when my body was ahead of my mind. It paired with \'i am tired of needing reassurance\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-21T15:00:00.000Z',
      mode: 'drain',
      event: 'Realized my nervous system had already decided it was unsafe — Part of me still expects to be left',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heavy limbs'
      ],
      note: 'I could feel the old pattern come online the second my body was ahead of my mind. It paired with \'part of me still expects to be left\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-22T16:00:00.000Z',
      mode: 'drain',
      event: 'Noticed myself rehearsing before speaking — Nothing huge happened and I still felt wrecked',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heat in face'
      ],
      note: 'The nervous-system shift was obvious as soon as I scanned for rejection before welcome. It paired with \'nothing huge happened and i still felt wrecked\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-23T17:00:00.000Z',
      mode: 'drain',
      event: 'Missed part of a conversation — I wanted to be held differently',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'throat pressure'
      ],
      note: 'This drain moment showed me how fast my system moves when I could not catch what was happening quickly enough. It paired with \'i wanted to be held differently\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-24T18:00:00.000Z',
      mode: 'nourish',
      event: 'Asked someone to repeat themselves twice — When I miss part of the conversation, I miss more than words',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'fuller breath'
      ],
      note: 'The good part was how quickly my body recognized safety when I could not catch what was happening quickly enough. It paired with \'when i miss part of the conversation, i miss more than words\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-25T19:00:00.000Z',
      mode: 'drain',
      event: 'Turned someone else into proof against myself — I keep trying to earn rest',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'stomach drop'
      ],
      note: 'I could feel the old pattern come online the second I turned on myself almost instantly. It paired with \'i keep trying to earn rest\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-26T20:00:00.000Z',
      mode: 'drain',
      event: 'Felt the emptiness after thinking of Naomi — My chest was tight all day',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'jaw tension'
      ],
      note: 'The nervous-system shift was obvious as soon as attachment and absence were both present at once. It paired with \'my chest was tight all day\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-27T09:00:00.000Z',
      mode: 'drain',
      event: 'Felt stretched thinner than I wanted to admit — I hate how fast embarrassment turns into shame',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'held breath'
      ],
      note: 'This drain moment showed me how fast my system moves when I had less margin than I thought. It paired with \'i hate how fast embarrassment turns into shame\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-02-28T10:00:00.000Z',
      mode: 'nourish',
      event: 'Felt outside of family closeness — Some days I feel like a burden just for existing',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'grounded feet'
      ],
      note: 'The good part was how quickly my body recognized safety when belonging felt conditional again. It paired with \'some days i feel like a burden just for existing\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-01T11:00:00.000Z',
      mode: 'drain',
      event: 'Could not tell where I fit in a room of people — There is anger under this sadness',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heat in face'
      ],
      note: 'I could feel the old pattern come online the second I scanned for rejection before welcome. It paired with \'there is anger under this sadness\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-02T12:00:00.000Z',
      mode: 'drain',
      event: 'Got flooded before I had a story for it — I can feel the younger ache in me',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'throat pressure'
      ],
      note: 'The nervous-system shift was obvious as soon as my body was ahead of my mind. It paired with \'i can feel the younger ache in me\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-03T13:00:00.000Z',
      mode: 'drain',
      event: 'Noticed a body memory before a clear thought — I needed clarity and got ambiguity',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'chest tightening'
      ],
      note: 'This drain moment showed me how fast my system moves when my body was ahead of my mind. It paired with \'i needed clarity and got ambiguity\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-04T14:00:00.000Z',
      mode: 'nourish',
      event: 'Felt my body react faster than language — My nervous system hates uncertainty',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'softer jaw'
      ],
      note: 'The good part was how quickly my body recognized safety when my body was ahead of my mind. It paired with \'my nervous system hates uncertainty\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-05T15:00:00.000Z',
      mode: 'drain',
      event: 'Laughed late because I did not catch the setup — I did not want to be perceived today',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'jaw tension'
      ],
      note: 'I could feel the old pattern come online the second I could not catch what was happening quickly enough. It paired with \'i did not want to be perceived today\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-06T16:00:00.000Z',
      mode: 'drain',
      event: 'Got flooded before I had a story for it — The grief comes back in flashes',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'held breath'
      ],
      note: 'The nervous-system shift was obvious as soon as my body was ahead of my mind. It paired with \'the grief comes back in flashes\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-07T17:00:00.000Z',
      mode: 'drain',
      event: 'Compared myself to another woman — I held it together, but barely',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heavy limbs'
      ],
      note: 'This drain moment showed me how fast my system moves when I turned on myself almost instantly. It paired with \'i held it together, but barely\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-08T18:00:00.000Z',
      mode: 'nourish',
      event: 'Passed a place tied to Naomi — I wish I trusted myself more',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'clearer mind'
      ],
      note: 'The good part was how quickly my body recognized safety when attachment and absence were both present at once. It paired with \'i wish i trusted myself more\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-09T19:00:00.000Z',
      mode: 'drain',
      event: 'Realized my nervous system had already decided it was unsafe — Today felt like too many selves at once',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'throat pressure'
      ],
      note: 'I could feel the old pattern come online the second my body was ahead of my mind. It paired with \'today felt like too many selves at once\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-10T20:00:00.000Z',
      mode: 'drain',
      event: 'Needed more softness than the day was offering — I wanted to withdraw before anyone could reject me',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'chest tightening'
      ],
      note: 'The nervous-system shift was obvious as soon as I had less margin than I thought. It paired with \'i wanted to withdraw before anyone could reject me\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-11T09:00:00.000Z',
      mode: 'drain',
      event: 'Walked into a room already scanning — I can feel how much I want safe closeness',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'stomach drop'
      ],
      note: 'This drain moment showed me how fast my system moves when I scanned for rejection before welcome. It paired with \'i can feel how much i want safe closeness\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-12T10:00:00.000Z',
      mode: 'nourish',
      event: 'Felt my body react faster than language — The house felt heavy with my mood',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'shoulders dropping'
      ],
      note: 'The good part was how quickly my body recognized safety when my body was ahead of my mind. It paired with \'the house felt heavy with my mood\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-13T11:00:00.000Z',
      mode: 'drain',
      event: 'Realized my nervous system had already decided it was unsafe — I kept replaying everything after',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'held breath'
      ],
      note: 'I could feel the old pattern come online the second my body was ahead of my mind. It paired with \'i kept replaying everything after\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-14T12:00:00.000Z',
      mode: 'drain',
      event: 'Noticed myself rehearsing before speaking — Some pain is quiet but constant',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heavy limbs'
      ],
      note: 'The nervous-system shift was obvious as soon as I scanned for rejection before welcome. It paired with \'some pain is quiet but constant\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-15T13:00:00.000Z',
      mode: 'drain',
      event: 'Missed part of a conversation — I am always watching for shifts in tone',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heat in face'
      ],
      note: 'This drain moment showed me how fast my system moves when I could not catch what was happening quickly enough. It paired with \'i am always watching for shifts in tone\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-16T14:00:00.000Z',
      mode: 'nourish',
      event: 'Felt loss change the color of an ordinary moment — I wanted to be less needy and more honest',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'steady belly'
      ],
      note: 'The good part was how quickly my body recognized safety when loss changed the whole emotional temperature. It paired with \'i wanted to be less needy and more honest\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-17T15:00:00.000Z',
      mode: 'drain',
      event: 'Realized my nervous system had already decided it was unsafe — The foster care stress lives in my body',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'chest tightening'
      ],
      note: 'I could feel the old pattern come online the second my body was ahead of my mind. It paired with \'the foster care stress lives in my body\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-18T16:00:00.000Z',
      mode: 'drain',
      event: 'Felt the emptiness after thinking of Naomi — Sometimes care feels invisible unless I collapse',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'stomach drop'
      ],
      note: 'The nervous-system shift was obvious as soon as attachment and absence were both present at once. It paired with \'sometimes care feels invisible unless i collapse\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-19T17:00:00.000Z',
      mode: 'drain',
      event: 'Felt stretched thinner than I wanted to admit — I felt behind all day',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'jaw tension'
      ],
      note: 'This drain moment showed me how fast my system moves when I had less margin than I thought. It paired with \'i felt behind all day\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-20T18:00:00.000Z',
      mode: 'nourish',
      event: 'Felt outside of family closeness — The day asked too much from me',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'warm chest'
      ],
      note: 'The good part was how quickly my body recognized safety when belonging felt conditional again. It paired with \'the day asked too much from me\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-21T19:00:00.000Z',
      mode: 'drain',
      event: 'Could not tell where I fit in a room of people — I wanted home to feel softer',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heavy limbs'
      ],
      note: 'I could feel the old pattern come online the second I scanned for rejection before welcome. It paired with \'i wanted home to feel softer\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-22T20:00:00.000Z',
      mode: 'drain',
      event: 'Got flooded before I had a story for it — I notice rejection before I notice safety',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heat in face'
      ],
      note: 'The nervous-system shift was obvious as soon as my body was ahead of my mind. It paired with \'i notice rejection before i notice safety\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-23T09:00:00.000Z',
      mode: 'drain',
      event: 'Noticed a body memory before a clear thought — I do not know how to stop comparing',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'throat pressure'
      ],
      note: 'This drain moment showed me how fast my system moves when my body was ahead of my mind. It paired with \'i do not know how to stop comparing\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-24T10:00:00.000Z',
      mode: 'nourish',
      event: 'Felt late to the emotional tone of a group — A dream stayed in my chest all morning',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'fuller breath'
      ],
      note: 'The good part was how quickly my body recognized safety when I scanned for rejection before welcome. It paired with \'a dream stayed in my chest all morning\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-25T11:00:00.000Z',
      mode: 'drain',
      event: 'Laughed late because I did not catch the setup — I felt both protective and depleted',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'stomach drop'
      ],
      note: 'I could feel the old pattern come online the second I could not catch what was happening quickly enough. It paired with \'i felt both protective and depleted\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-26T12:00:00.000Z',
      mode: 'drain',
      event: 'Realized grief was underneath my irritability — I wanted someone to understand without explanation',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'jaw tension'
      ],
      note: 'The nervous-system shift was obvious as soon as loss changed the whole emotional temperature. It paired with \'i wanted someone to understand without explanation\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-27T13:00:00.000Z',
      mode: 'drain',
      event: 'Compared myself to another woman — I can feel how badly I want repair',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'held breath'
      ],
      note: 'This drain moment showed me how fast my system moves when I turned on myself almost instantly. It paired with \'i can feel how badly i want repair\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-28T14:00:00.000Z',
      mode: 'nourish',
      event: 'Passed a place tied to Naomi — Being misunderstood hit me harder than it should have',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'grounded feet'
      ],
      note: 'The good part was how quickly my body recognized safety when attachment and absence were both present at once. It paired with \'being misunderstood hit me harder than it should have\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-29T15:00:00.000Z',
      mode: 'drain',
      event: 'Realized my nervous system had already decided it was unsafe — I am trying not to harden',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heat in face'
      ],
      note: 'I could feel the old pattern come online the second my body was ahead of my mind. It paired with \'i am trying not to harden\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-30T16:00:00.000Z',
      mode: 'drain',
      event: 'Needed more softness than the day was offering — The sadness sat behind everything today',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'throat pressure'
      ],
      note: 'The nervous-system shift was obvious as soon as I had less margin than I thought. It paired with \'the sadness sat behind everything today\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-03-31T17:00:00.000Z',
      mode: 'drain',
      event: 'Walked into a room already scanning — I can feel how much performance costs me',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'chest tightening'
      ],
      note: 'This drain moment showed me how fast my system moves when I scanned for rejection before welcome. It paired with \'i can feel how much performance costs me\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-01T18:00:00.000Z',
      mode: 'nourish',
      event: 'Felt my body react faster than language — I needed permission to stop',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'softer jaw'
      ],
      note: 'The good part was how quickly my body recognized safety when my body was ahead of my mind. It paired with \'i needed permission to stop\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-02T19:00:00.000Z',
      mode: 'drain',
      event: 'Realized my nervous system had already decided it was unsafe — I wish support reached me sooner',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'jaw tension'
      ],
      note: 'I could feel the old pattern come online the second my body was ahead of my mind. It paired with \'i wish support reached me sooner\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-03T20:00:00.000Z',
      mode: 'drain',
      event: 'Noticed myself rehearsing before speaking — I felt disconnected even while functioning',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'held breath'
      ],
      note: 'The nervous-system shift was obvious as soon as I scanned for rejection before welcome. It paired with \'i felt disconnected even while functioning\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-04T09:00:00.000Z',
      mode: 'drain',
      event: 'Missed part of a conversation — There is a tiredness that sleep does not fix',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heavy limbs'
      ],
      note: 'This drain moment showed me how fast my system moves when I could not catch what was happening quickly enough. It paired with \'there is a tiredness that sleep does not fix\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-05T10:00:00.000Z',
      mode: 'nourish',
      event: 'Felt loss change the color of an ordinary moment — I wanted to be less visible and more loved',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'clearer mind'
      ],
      note: 'The good part was how quickly my body recognized safety when loss changed the whole emotional temperature. It paired with \'i wanted to be less visible and more loved\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-06T11:00:00.000Z',
      mode: 'drain',
      event: 'Turned someone else into proof against myself — Today I felt the fear of being replaceable',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'throat pressure'
      ],
      note: 'I could feel the old pattern come online the second I turned on myself almost instantly. It paired with \'today i felt the fear of being replaceable\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-07T12:00:00.000Z',
      mode: 'drain',
      event: 'Felt the emptiness after thinking of Naomi — I wanted my body to unclench',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'chest tightening'
      ],
      note: 'The nervous-system shift was obvious as soon as attachment and absence were both present at once. It paired with \'i wanted my body to unclench\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-08T13:00:00.000Z',
      mode: 'drain',
      event: 'Felt stretched thinner than I wanted to admit — The ache of not feeling singular',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'stomach drop'
      ],
      note: 'This drain moment showed me how fast my system moves when I had less margin than I thought. It paired with \'the ache of not feeling singular\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-09T14:00:00.000Z',
      mode: 'nourish',
      event: 'Felt outside of family closeness — I can see the pattern and still get caught in it',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'shoulders dropping'
      ],
      note: 'The good part was how quickly my body recognized safety when belonging felt conditional again. It paired with \'i can see the pattern and still get caught in it\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-10T15:00:00.000Z',
      mode: 'drain',
      event: 'Could not tell where I fit in a room of people — I wish I felt safer in closeness',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'held breath'
      ],
      note: 'I could feel the old pattern come online the second I scanned for rejection before welcome. It paired with \'i wish i felt safer in closeness\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-11T16:00:00.000Z',
      mode: 'drain',
      event: 'Got flooded before I had a story for it — I ended the day overstimulated and lonely',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heavy limbs'
      ],
      note: 'The nervous-system shift was obvious as soon as my body was ahead of my mind. It paired with \'i ended the day overstimulated and lonely\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-12T17:00:00.000Z',
      mode: 'drain',
      event: 'Noticed a body memory before a clear thought — I am tired of the system',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heat in face'
      ],
      note: 'This drain moment showed me how fast my system moves when my body was ahead of my mind. It paired with \'i am tired of the system\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-13T18:00:00.000Z',
      mode: 'nourish',
      event: 'Wanted Annie to feel nearer than she was — Wanting Annie to choose me',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'steady belly'
      ],
      note: 'The good part was how quickly my body recognized safety when longing made me feel younger than the moment actually was. It paired with \'wanting annie to choose me\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-14T19:00:00.000Z',
      mode: 'drain',
      event: 'Laughed late because I did not catch the setup — Feeling left out again',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'chest tightening'
      ],
      note: 'I could feel the old pattern come online the second I could not catch what was happening quickly enough. It paired with \'feeling left out again\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-15T20:00:00.000Z',
      mode: 'drain',
      event: 'Realized grief was underneath my irritability — Feeling blurry inside',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'stomach drop'
      ],
      note: 'The nervous-system shift was obvious as soon as loss changed the whole emotional temperature. It paired with \'feeling blurry inside\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-16T09:00:00.000Z',
      mode: 'drain',
      event: 'Compared myself to another woman — Wishing I were easier to be',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'jaw tension'
      ],
      note: 'This drain moment showed me how fast my system moves when I turned on myself almost instantly. It paired with \'wishing i were easier to be\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-17T10:00:00.000Z',
      mode: 'nourish',
      event: 'Passed a place tied to Naomi — Everyone probably hates me',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'warm chest'
      ],
      note: 'The good part was how quickly my body recognized safety when attachment and absence were both present at once. It paired with \'everyone probably hates me\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-18T11:00:00.000Z',
      mode: 'drain',
      event: 'Laughed late because I did not catch the setup — The hearing part people do not see',
      nsState: 'sympathetic',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heavy limbs'
      ],
      note: 'I could feel the old pattern come online the second I could not catch what was happening quickly enough. It paired with \'the hearing part people do not see\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-19T12:00:00.000Z',
      mode: 'drain',
      event: 'Cleaned up after Lucas while running on fumes — Raising Lucas while running on empty',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'heat in face'
      ],
      note: 'The nervous-system shift was obvious as soon as love did not cancel out depletion. It paired with \'raising lucas while running on empty\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-20T13:00:00.000Z',
      mode: 'drain',
      event: 'Saw something that reminded me of Naomi — Naomi leaving still hurts',
      nsState: 'dorsal_vagal',
      sensations: [
        'chest tightening',
        'stomach drop',
        'throat pressure'
      ],
      note: 'This drain moment showed me how fast my system moves when attachment and absence were both present at once. It paired with \'naomi leaving still hurts\' in a way that made the pattern impossible to miss.'
    },
    {
      date: '2026-04-21T14:00:00.000Z',
      mode: 'nourish',
      event: 'Imagined another court-related interaction — Dealing with Sarah is its own strain',
      nsState: 'ventral_vagal',
      sensations: [
        'fuller breath',
        'softer jaw',
        'fuller breath'
      ],
      note: 'The good part was how quickly my body recognized safety when powerlessness and anger arrived together. It paired with \'dealing with sarah is its own strain\' in a way that made the pattern impossible to miss.'
    }
  ],
  relationshipPatterns: [
    {
      date: '2026-01-22',
      note: 'With Annie, the theme today was anxious attachment; when someone feels even slightly unavailable, I could feel how quickly I move from gratitude into the wish to feel singular and specially held. The way it showed up alongside \'i woke up already bracing\' told me I still need more room for honesty than performance.',
      tags: [
        'annie',
        'anxious-attachment',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-01-23',
      note: 'With Lucas, today\'s mirror was protective overfunctioning; I noticed how love and depletion can occupy the same breath when I sense distance before anyone names it. The way it showed up alongside \'trying not to feel so visible\' told me I still need more room for honesty than performance.',
      tags: [
        'lucas',
        'protective-overfunctioning',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-01-24',
      note: 'Around Jamie, the ache of wanting repair stood out; safety makes me realize how braced I usually am, especially when I am trying to stay composed while feeling young inside. The way it showed up alongside \'the hearing part of feeling left out\' told me I still need more room for honesty than performance.',
      tags: [
        'jamie',
        'the-ache-of-wanting-repair',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-01-25',
      note: 'Thinking about Naomi brought up hypervigilance about tone; the bond still lives in me even when the role ended, and a small moment lands on an old wound made that obvious again. The way it showed up alongside \'a quiet grief day\' told me I still need more room for honesty than performance.',
      tags: [
        'naomi',
        'hypervigilance-about-tone',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-01-26',
      note: 'With Angela, the mirror today was comparison turning inward; sibling history can make me feel both drawn in and quietly outside when the situation asks me to trust before I am ready. The way it showed up alongside \'i can feel comparison working on me\' told me I still need more room for honesty than performance.',
      tags: [
        'angela',
        'comparison-turning-inward',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-01-27',
      note: 'Nellie brings up grief after closeness for me; belonging feels tender and evaluative at the same time whenever someone feels even slightly unavailable. The way it showed up alongside \'missing naomi in small moments\' told me I still need more room for honesty than performance.',
      tags: [
        'nellie',
        'grief-after-closeness',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-01-28',
      note: 'Sarah activated the fear of being replaceable; I can hold anger, helplessness, and moral clarity all at once when I sense distance before anyone names it. The way it showed up alongside \'everything feels heavier when i am tired\' told me I still need more room for honesty than performance.',
      tags: [
        'sarah',
        'the-fear-of-being-replaceable',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-01-29',
      note: 'Anything that echoes Patti carries overexplaining to stay connected; my mind can stay present while my body still behaves like the past is happening when I am trying to stay composed while feeling young inside. The way it showed up alongside \'wanting to be noticed without asking\' told me I still need more room for honesty than performance.',
      tags: [
        'patti',
        'overexplaining-to-stay-connected',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-01-30',
      note: 'Anything that touches Chuck brings up bracing before trust; survival shows up first and interpretation comes later when a small moment lands on an old wound. The way it showed up alongside \'i am more sensitive than i look\' told me I still need more room for honesty than performance.',
      tags: [
        'chuck',
        'bracing-before-trust',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-01-31',
      note: 'Around other women, love carrying exhaustion became obvious; comparison can make me leave myself quickly when the situation asks me to trust before I am ready. The way it showed up alongside \'my body knew before my mind did\' told me I still need more room for honesty than performance.',
      tags: [
        'women-i-compare-myself-to',
        'love-carrying-exhaustion',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-02-01',
      note: 'In groups, the mirror was belonging feeling conditional; I scan for exclusion before I scan for welcome whenever someone feels even slightly unavailable. The way it showed up alongside \'wishing i were easier to be\' told me I still need more room for honesty than performance.',
      tags: [
        'groups',
        'belonging-feeling-conditional',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-02-02',
      note: 'With authority figures, self-abandonment in pursuit of harmony was the pattern; I start over-explaining the second I fear not being believed when I sense distance before anyone names it. The way it showed up alongside \'the loneliness under competence\' told me I still need more room for honesty than performance.',
      tags: [
        'authority-figures',
        'self-abandonment-in-pursuit-of-harmony',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-02-03',
      note: 'In the family system, anxious attachment rose up again; I can feel loyal and unseen at the same time when I am trying to stay composed while feeling young inside. The way it showed up alongside \'i needed more softness today\' told me I still need more room for honesty than performance.',
      tags: [
        'family-system',
        'anxious-attachment',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-02-04',
      note: 'With Annie, the theme today was protective overfunctioning; when a small moment lands on an old wound, I could feel how quickly I move from gratitude into the wish to feel singular and specially held. The way it showed up alongside \'it is hard not to read things as rejection\' told me I still need more room for honesty than performance.',
      tags: [
        'annie',
        'protective-overfunctioning',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-02-05',
      note: 'With Lucas, today\'s mirror was the ache of wanting repair; I noticed how love and depletion can occupy the same breath when the situation asks me to trust before I am ready. The way it showed up alongside \'i kept overexplaining and hated it\' told me I still need more room for honesty than performance.',
      tags: [
        'lucas',
        'the-ache-of-wanting-repair',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-02-06',
      note: 'Around Jamie, hypervigilance about tone stood out; safety makes me realize how braced I usually am, especially when someone feels even slightly unavailable. The way it showed up alongside \'lucas deserved a less depleted version of me\' told me I still need more room for honesty than performance.',
      tags: [
        'jamie',
        'hypervigilance-about-tone',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-02-07',
      note: 'Thinking about Naomi brought up comparison turning inward; the bond still lives in me even when the role ended, and I sense distance before anyone names it made that obvious again. The way it showed up alongside \'i miss being met quickly\' told me I still need more room for honesty than performance.',
      tags: [
        'naomi',
        'comparison-turning-inward',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-02-08',
      note: 'With Angela, the mirror today was grief after closeness; sibling history can make me feel both drawn in and quietly outside when I am trying to stay composed while feeling young inside. The way it showed up alongside \'old family pain in a new moment\' told me I still need more room for honesty than performance.',
      tags: [
        'angela',
        'grief-after-closeness',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-02-09',
      note: 'Nellie brings up the fear of being replaceable for me; belonging feels tender and evaluative at the same time whenever a small moment lands on an old wound. The way it showed up alongside \'today my hearing made me feel separate\' told me I still need more room for honesty than performance.',
      tags: [
        'nellie',
        'the-fear-of-being-replaceable',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-02-10',
      note: 'Sarah activated overexplaining to stay connected; I can hold anger, helplessness, and moral clarity all at once when the situation asks me to trust before I am ready. The way it showed up alongside \'wanting to be chosen without performing\' told me I still need more room for honesty than performance.',
      tags: [
        'sarah',
        'overexplaining-to-stay-connected',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-02-11',
      note: 'Anything that echoes Patti carries bracing before trust; my mind can stay present while my body still behaves like the past is happening when someone feels even slightly unavailable. The way it showed up alongside \'i do not think people realize how much i carry\' told me I still need more room for honesty than performance.',
      tags: [
        'patti',
        'bracing-before-trust',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-02-12',
      note: 'Anything that touches Chuck brings up love carrying exhaustion; survival shows up first and interpretation comes later when I sense distance before anyone names it. The way it showed up alongside \'trying not to spiral\' told me I still need more room for honesty than performance.',
      tags: [
        'chuck',
        'love-carrying-exhaustion',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-02-13',
      note: 'Around other women, belonging feeling conditional became obvious; comparison can make me leave myself quickly when I am trying to stay composed while feeling young inside. The way it showed up alongside \'i felt small in a way i could not hide from myself\' told me I still need more room for honesty than performance.',
      tags: [
        'women-i-compare-myself-to',
        'belonging-feeling-conditional',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-02-14',
      note: 'In groups, the mirror was self-abandonment in pursuit of harmony; I scan for exclusion before I scan for welcome whenever a small moment lands on an old wound. The way it showed up alongside \'so much of me is trying to stay acceptable\' told me I still need more room for honesty than performance.',
      tags: [
        'groups',
        'self-abandonment-in-pursuit-of-harmony',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-02-15',
      note: 'With authority figures, anxious attachment was the pattern; I start over-explaining the second I fear not being believed when the situation asks me to trust before I am ready. The way it showed up alongside \'a body-memory kind of day\' told me I still need more room for honesty than performance.',
      tags: [
        'authority-figures',
        'anxious-attachment',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-02-16',
      note: 'In the family system, protective overfunctioning rose up again; I can feel loyal and unseen at the same time when someone feels even slightly unavailable. The way it showed up alongside \'i was more flooded than i looked\' told me I still need more room for honesty than performance.',
      tags: [
        'family-system',
        'protective-overfunctioning',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-02-17',
      note: 'With Annie, the theme today was the ache of wanting repair; when I sense distance before anyone names it, I could feel how quickly I move from gratitude into the wish to feel singular and specially held. The way it showed up alongside \'i wish belonging felt less fragile\' told me I still need more room for honesty than performance.',
      tags: [
        'annie',
        'the-ache-of-wanting-repair',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-02-18',
      note: 'With Lucas, today\'s mirror was hypervigilance about tone; I noticed how love and depletion can occupy the same breath when I am trying to stay composed while feeling young inside. The way it showed up alongside \'the system takes and takes\' told me I still need more room for honesty than performance.',
      tags: [
        'lucas',
        'hypervigilance-about-tone',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-02-19',
      note: 'Around Jamie, comparison turning inward stood out; safety makes me realize how braced I usually am, especially when a small moment lands on an old wound. The way it showed up alongside \'i felt ugly and overaware today\' told me I still need more room for honesty than performance.',
      tags: [
        'jamie',
        'comparison-turning-inward',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-02-20',
      note: 'Thinking about Naomi brought up grief after closeness; the bond still lives in me even when the role ended, and the situation asks me to trust before I am ready made that obvious again. The way it showed up alongside \'i am tired of needing reassurance\' told me I still need more room for honesty than performance.',
      tags: [
        'naomi',
        'grief-after-closeness',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-02-21',
      note: 'With Angela, the mirror today was the fear of being replaceable; sibling history can make me feel both drawn in and quietly outside when someone feels even slightly unavailable. The way it showed up alongside \'part of me still expects to be left\' told me I still need more room for honesty than performance.',
      tags: [
        'angela',
        'the-fear-of-being-replaceable',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-02-22',
      note: 'Nellie brings up overexplaining to stay connected for me; belonging feels tender and evaluative at the same time whenever I sense distance before anyone names it. The way it showed up alongside \'nothing huge happened and i still felt wrecked\' told me I still need more room for honesty than performance.',
      tags: [
        'nellie',
        'overexplaining-to-stay-connected',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-02-23',
      note: 'Sarah activated bracing before trust; I can hold anger, helplessness, and moral clarity all at once when I am trying to stay composed while feeling young inside. The way it showed up alongside \'i wanted to be held differently\' told me I still need more room for honesty than performance.',
      tags: [
        'sarah',
        'bracing-before-trust',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-02-24',
      note: 'Anything that echoes Patti carries love carrying exhaustion; my mind can stay present while my body still behaves like the past is happening when a small moment lands on an old wound. The way it showed up alongside \'when i miss part of the conversation, i miss more than words\' told me I still need more room for honesty than performance.',
      tags: [
        'patti',
        'love-carrying-exhaustion',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-02-25',
      note: 'Anything that touches Chuck brings up belonging feeling conditional; survival shows up first and interpretation comes later when the situation asks me to trust before I am ready. The way it showed up alongside \'i keep trying to earn rest\' told me I still need more room for honesty than performance.',
      tags: [
        'chuck',
        'belonging-feeling-conditional',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-02-26',
      note: 'Around other women, self-abandonment in pursuit of harmony became obvious; comparison can make me leave myself quickly when someone feels even slightly unavailable. The way it showed up alongside \'my chest was tight all day\' told me I still need more room for honesty than performance.',
      tags: [
        'women-i-compare-myself-to',
        'self-abandonment-in-pursuit-of-harmony',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-02-27',
      note: 'In groups, the mirror was anxious attachment; I scan for exclusion before I scan for welcome whenever I sense distance before anyone names it. The way it showed up alongside \'i hate how fast embarrassment turns into shame\' told me I still need more room for honesty than performance.',
      tags: [
        'groups',
        'anxious-attachment',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-02-28',
      note: 'With authority figures, protective overfunctioning was the pattern; I start over-explaining the second I fear not being believed when I am trying to stay composed while feeling young inside. The way it showed up alongside \'some days i feel like a burden just for existing\' told me I still need more room for honesty than performance.',
      tags: [
        'authority-figures',
        'protective-overfunctioning',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-03-01',
      note: 'In the family system, the ache of wanting repair rose up again; I can feel loyal and unseen at the same time when a small moment lands on an old wound. The way it showed up alongside \'there is anger under this sadness\' told me I still need more room for honesty than performance.',
      tags: [
        'family-system',
        'the-ache-of-wanting-repair',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-03-02',
      note: 'With Annie, the theme today was hypervigilance about tone; when the situation asks me to trust before I am ready, I could feel how quickly I move from gratitude into the wish to feel singular and specially held. The way it showed up alongside \'i can feel the younger ache in me\' told me I still need more room for honesty than performance.',
      tags: [
        'annie',
        'hypervigilance-about-tone',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-03-03',
      note: 'With Lucas, today\'s mirror was comparison turning inward; I noticed how love and depletion can occupy the same breath when someone feels even slightly unavailable. The way it showed up alongside \'i needed clarity and got ambiguity\' told me I still need more room for honesty than performance.',
      tags: [
        'lucas',
        'comparison-turning-inward',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-03-04',
      note: 'Around Jamie, grief after closeness stood out; safety makes me realize how braced I usually am, especially when I sense distance before anyone names it. The way it showed up alongside \'my nervous system hates uncertainty\' told me I still need more room for honesty than performance.',
      tags: [
        'jamie',
        'grief-after-closeness',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-03-05',
      note: 'Thinking about Naomi brought up the fear of being replaceable; the bond still lives in me even when the role ended, and I am trying to stay composed while feeling young inside made that obvious again. The way it showed up alongside \'i did not want to be perceived today\' told me I still need more room for honesty than performance.',
      tags: [
        'naomi',
        'the-fear-of-being-replaceable',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-03-06',
      note: 'With Angela, the mirror today was overexplaining to stay connected; sibling history can make me feel both drawn in and quietly outside when a small moment lands on an old wound. The way it showed up alongside \'the grief comes back in flashes\' told me I still need more room for honesty than performance.',
      tags: [
        'angela',
        'overexplaining-to-stay-connected',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-03-07',
      note: 'Nellie brings up bracing before trust for me; belonging feels tender and evaluative at the same time whenever the situation asks me to trust before I am ready. The way it showed up alongside \'i held it together, but barely\' told me I still need more room for honesty than performance.',
      tags: [
        'nellie',
        'bracing-before-trust',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-03-08',
      note: 'Sarah activated love carrying exhaustion; I can hold anger, helplessness, and moral clarity all at once when someone feels even slightly unavailable. The way it showed up alongside \'i wish i trusted myself more\' told me I still need more room for honesty than performance.',
      tags: [
        'sarah',
        'love-carrying-exhaustion',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-03-09',
      note: 'Anything that echoes Patti carries belonging feeling conditional; my mind can stay present while my body still behaves like the past is happening when I sense distance before anyone names it. The way it showed up alongside \'today felt like too many selves at once\' told me I still need more room for honesty than performance.',
      tags: [
        'patti',
        'belonging-feeling-conditional',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-03-10',
      note: 'Anything that touches Chuck brings up self-abandonment in pursuit of harmony; survival shows up first and interpretation comes later when I am trying to stay composed while feeling young inside. The way it showed up alongside \'i wanted to withdraw before anyone could reject me\' told me I still need more room for honesty than performance.',
      tags: [
        'chuck',
        'self-abandonment-in-pursuit-of-harmony',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-03-11',
      note: 'Around other women, anxious attachment became obvious; comparison can make me leave myself quickly when a small moment lands on an old wound. The way it showed up alongside \'i can feel how much i want safe closeness\' told me I still need more room for honesty than performance.',
      tags: [
        'women-i-compare-myself-to',
        'anxious-attachment',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-03-12',
      note: 'In groups, the mirror was protective overfunctioning; I scan for exclusion before I scan for welcome whenever the situation asks me to trust before I am ready. The way it showed up alongside \'the house felt heavy with my mood\' told me I still need more room for honesty than performance.',
      tags: [
        'groups',
        'protective-overfunctioning',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-03-13',
      note: 'With authority figures, the ache of wanting repair was the pattern; I start over-explaining the second I fear not being believed when someone feels even slightly unavailable. The way it showed up alongside \'i kept replaying everything after\' told me I still need more room for honesty than performance.',
      tags: [
        'authority-figures',
        'the-ache-of-wanting-repair',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-03-14',
      note: 'In the family system, hypervigilance about tone rose up again; I can feel loyal and unseen at the same time when I sense distance before anyone names it. The way it showed up alongside \'some pain is quiet but constant\' told me I still need more room for honesty than performance.',
      tags: [
        'family-system',
        'hypervigilance-about-tone',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-03-15',
      note: 'With Annie, the theme today was comparison turning inward; when I am trying to stay composed while feeling young inside, I could feel how quickly I move from gratitude into the wish to feel singular and specially held. The way it showed up alongside \'i am always watching for shifts in tone\' told me I still need more room for honesty than performance.',
      tags: [
        'annie',
        'comparison-turning-inward',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-03-16',
      note: 'With Lucas, today\'s mirror was grief after closeness; I noticed how love and depletion can occupy the same breath when a small moment lands on an old wound. The way it showed up alongside \'i wanted to be less needy and more honest\' told me I still need more room for honesty than performance.',
      tags: [
        'lucas',
        'grief-after-closeness',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-03-17',
      note: 'Around Jamie, the fear of being replaceable stood out; safety makes me realize how braced I usually am, especially when the situation asks me to trust before I am ready. The way it showed up alongside \'the foster care stress lives in my body\' told me I still need more room for honesty than performance.',
      tags: [
        'jamie',
        'the-fear-of-being-replaceable',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-03-18',
      note: 'Thinking about Naomi brought up overexplaining to stay connected; the bond still lives in me even when the role ended, and someone feels even slightly unavailable made that obvious again. The way it showed up alongside \'sometimes care feels invisible unless i collapse\' told me I still need more room for honesty than performance.',
      tags: [
        'naomi',
        'overexplaining-to-stay-connected',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-03-19',
      note: 'With Angela, the mirror today was bracing before trust; sibling history can make me feel both drawn in and quietly outside when I sense distance before anyone names it. The way it showed up alongside \'i felt behind all day\' told me I still need more room for honesty than performance.',
      tags: [
        'angela',
        'bracing-before-trust',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-03-20',
      note: 'Nellie brings up love carrying exhaustion for me; belonging feels tender and evaluative at the same time whenever I am trying to stay composed while feeling young inside. The way it showed up alongside \'the day asked too much from me\' told me I still need more room for honesty than performance.',
      tags: [
        'nellie',
        'love-carrying-exhaustion',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-03-21',
      note: 'Sarah activated belonging feeling conditional; I can hold anger, helplessness, and moral clarity all at once when a small moment lands on an old wound. The way it showed up alongside \'i wanted home to feel softer\' told me I still need more room for honesty than performance.',
      tags: [
        'sarah',
        'belonging-feeling-conditional',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-03-22',
      note: 'Anything that echoes Patti carries self-abandonment in pursuit of harmony; my mind can stay present while my body still behaves like the past is happening when the situation asks me to trust before I am ready. The way it showed up alongside \'i notice rejection before i notice safety\' told me I still need more room for honesty than performance.',
      tags: [
        'patti',
        'self-abandonment-in-pursuit-of-harmony',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-03-23',
      note: 'Anything that touches Chuck brings up anxious attachment; survival shows up first and interpretation comes later when someone feels even slightly unavailable. The way it showed up alongside \'i do not know how to stop comparing\' told me I still need more room for honesty than performance.',
      tags: [
        'chuck',
        'anxious-attachment',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-03-24',
      note: 'Around other women, protective overfunctioning became obvious; comparison can make me leave myself quickly when I sense distance before anyone names it. The way it showed up alongside \'a dream stayed in my chest all morning\' told me I still need more room for honesty than performance.',
      tags: [
        'women-i-compare-myself-to',
        'protective-overfunctioning',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-03-25',
      note: 'In groups, the mirror was the ache of wanting repair; I scan for exclusion before I scan for welcome whenever I am trying to stay composed while feeling young inside. The way it showed up alongside \'i felt both protective and depleted\' told me I still need more room for honesty than performance.',
      tags: [
        'groups',
        'the-ache-of-wanting-repair',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-03-26',
      note: 'With authority figures, hypervigilance about tone was the pattern; I start over-explaining the second I fear not being believed when a small moment lands on an old wound. The way it showed up alongside \'i wanted someone to understand without explanation\' told me I still need more room for honesty than performance.',
      tags: [
        'authority-figures',
        'hypervigilance-about-tone',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-03-27',
      note: 'In the family system, comparison turning inward rose up again; I can feel loyal and unseen at the same time when the situation asks me to trust before I am ready. The way it showed up alongside \'i can feel how badly i want repair\' told me I still need more room for honesty than performance.',
      tags: [
        'family-system',
        'comparison-turning-inward',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-03-28',
      note: 'With Annie, the theme today was grief after closeness; when someone feels even slightly unavailable, I could feel how quickly I move from gratitude into the wish to feel singular and specially held. The way it showed up alongside \'being misunderstood hit me harder than it should have\' told me I still need more room for honesty than performance.',
      tags: [
        'annie',
        'grief-after-closeness',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-03-29',
      note: 'With Lucas, today\'s mirror was the fear of being replaceable; I noticed how love and depletion can occupy the same breath when I sense distance before anyone names it. The way it showed up alongside \'i am trying not to harden\' told me I still need more room for honesty than performance.',
      tags: [
        'lucas',
        'the-fear-of-being-replaceable',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-03-30',
      note: 'Around Jamie, overexplaining to stay connected stood out; safety makes me realize how braced I usually am, especially when I am trying to stay composed while feeling young inside. The way it showed up alongside \'the sadness sat behind everything today\' told me I still need more room for honesty than performance.',
      tags: [
        'jamie',
        'overexplaining-to-stay-connected',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-03-31',
      note: 'Thinking about Naomi brought up bracing before trust; the bond still lives in me even when the role ended, and a small moment lands on an old wound made that obvious again. The way it showed up alongside \'i can feel how much performance costs me\' told me I still need more room for honesty than performance.',
      tags: [
        'naomi',
        'bracing-before-trust',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-04-01',
      note: 'With Angela, the mirror today was love carrying exhaustion; sibling history can make me feel both drawn in and quietly outside when the situation asks me to trust before I am ready. The way it showed up alongside \'i needed permission to stop\' told me I still need more room for honesty than performance.',
      tags: [
        'angela',
        'love-carrying-exhaustion',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-04-02',
      note: 'Nellie brings up belonging feeling conditional for me; belonging feels tender and evaluative at the same time whenever someone feels even slightly unavailable. The way it showed up alongside \'i wish support reached me sooner\' told me I still need more room for honesty than performance.',
      tags: [
        'nellie',
        'belonging-feeling-conditional',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-04-03',
      note: 'Sarah activated self-abandonment in pursuit of harmony; I can hold anger, helplessness, and moral clarity all at once when I sense distance before anyone names it. The way it showed up alongside \'i felt disconnected even while functioning\' told me I still need more room for honesty than performance.',
      tags: [
        'sarah',
        'self-abandonment-in-pursuit-of-harmony',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-04-04',
      note: 'Anything that echoes Patti carries anxious attachment; my mind can stay present while my body still behaves like the past is happening when I am trying to stay composed while feeling young inside. The way it showed up alongside \'there is a tiredness that sleep does not fix\' told me I still need more room for honesty than performance.',
      tags: [
        'patti',
        'anxious-attachment',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-04-05',
      note: 'Anything that touches Chuck brings up protective overfunctioning; survival shows up first and interpretation comes later when a small moment lands on an old wound. The way it showed up alongside \'i wanted to be less visible and more loved\' told me I still need more room for honesty than performance.',
      tags: [
        'chuck',
        'protective-overfunctioning',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-04-06',
      note: 'Around other women, the ache of wanting repair became obvious; comparison can make me leave myself quickly when the situation asks me to trust before I am ready. The way it showed up alongside \'today i felt the fear of being replaceable\' told me I still need more room for honesty than performance.',
      tags: [
        'women-i-compare-myself-to',
        'the-ache-of-wanting-repair',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-04-07',
      note: 'In groups, the mirror was hypervigilance about tone; I scan for exclusion before I scan for welcome whenever someone feels even slightly unavailable. The way it showed up alongside \'i wanted my body to unclench\' told me I still need more room for honesty than performance.',
      tags: [
        'groups',
        'hypervigilance-about-tone',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-04-08',
      note: 'With authority figures, comparison turning inward was the pattern; I start over-explaining the second I fear not being believed when I sense distance before anyone names it. The way it showed up alongside \'the ache of not feeling singular\' told me I still need more room for honesty than performance.',
      tags: [
        'authority-figures',
        'comparison-turning-inward',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-04-09',
      note: 'In the family system, grief after closeness rose up again; I can feel loyal and unseen at the same time when I am trying to stay composed while feeling young inside. The way it showed up alongside \'i can see the pattern and still get caught in it\' told me I still need more room for honesty than performance.',
      tags: [
        'family-system',
        'grief-after-closeness',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-04-10',
      note: 'With Annie, the theme today was the fear of being replaceable; when a small moment lands on an old wound, I could feel how quickly I move from gratitude into the wish to feel singular and specially held. The way it showed up alongside \'i wish i felt safer in closeness\' told me I still need more room for honesty than performance.',
      tags: [
        'annie',
        'the-fear-of-being-replaceable',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-04-11',
      note: 'With Lucas, today\'s mirror was overexplaining to stay connected; I noticed how love and depletion can occupy the same breath when the situation asks me to trust before I am ready. The way it showed up alongside \'i ended the day overstimulated and lonely\' told me I still need more room for honesty than performance.',
      tags: [
        'lucas',
        'overexplaining-to-stay-connected',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-04-12',
      note: 'Around Jamie, bracing before trust stood out; safety makes me realize how braced I usually am, especially when someone feels even slightly unavailable. The way it showed up alongside \'i am tired of the system\' told me I still need more room for honesty than performance.',
      tags: [
        'jamie',
        'bracing-before-trust',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-04-13',
      note: 'Thinking about Naomi brought up love carrying exhaustion; the bond still lives in me even when the role ended, and I sense distance before anyone names it made that obvious again. The way it showed up alongside \'wanting annie to choose me\' told me I still need more room for honesty than performance.',
      tags: [
        'naomi',
        'love-carrying-exhaustion',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-04-14',
      note: 'With Angela, the mirror today was belonging feeling conditional; sibling history can make me feel both drawn in and quietly outside when I am trying to stay composed while feeling young inside. The way it showed up alongside \'feeling left out again\' told me I still need more room for honesty than performance.',
      tags: [
        'angela',
        'belonging-feeling-conditional',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-04-15',
      note: 'Nellie brings up self-abandonment in pursuit of harmony for me; belonging feels tender and evaluative at the same time whenever a small moment lands on an old wound. The way it showed up alongside \'feeling blurry inside\' told me I still need more room for honesty than performance.',
      tags: [
        'nellie',
        'self-abandonment-in-pursuit-of-harmony',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-04-16',
      note: 'Sarah activated anxious attachment; I can hold anger, helplessness, and moral clarity all at once when the situation asks me to trust before I am ready. The way it showed up alongside \'wishing i were easier to be\' told me I still need more room for honesty than performance.',
      tags: [
        'sarah',
        'anxious-attachment',
        'the-situation-asks-me-to-tru'
      ]
    },
    {
      date: '2026-04-17',
      note: 'Anything that echoes Patti carries protective overfunctioning; my mind can stay present while my body still behaves like the past is happening when someone feels even slightly unavailable. The way it showed up alongside \'everyone probably hates me\' told me I still need more room for honesty than performance.',
      tags: [
        'patti',
        'protective-overfunctioning',
        'someone-feels-even-slightly-'
      ]
    },
    {
      date: '2026-04-18',
      note: 'Anything that touches Chuck brings up the ache of wanting repair; survival shows up first and interpretation comes later when I sense distance before anyone names it. The way it showed up alongside \'the hearing part people do not see\' told me I still need more room for honesty than performance.',
      tags: [
        'chuck',
        'the-ache-of-wanting-repair',
        'i-sense-distance-before-anyo'
      ]
    },
    {
      date: '2026-04-19',
      note: 'Around other women, hypervigilance about tone became obvious; comparison can make me leave myself quickly when I am trying to stay composed while feeling young inside. The way it showed up alongside \'raising lucas while running on empty\' told me I still need more room for honesty than performance.',
      tags: [
        'women-i-compare-myself-to',
        'hypervigilance-about-tone',
        'i-am-trying-to-stay-composed'
      ]
    },
    {
      date: '2026-04-20',
      note: 'In groups, the mirror was comparison turning inward; I scan for exclusion before I scan for welcome whenever a small moment lands on an old wound. The way it showed up alongside \'naomi leaving still hurts\' told me I still need more room for honesty than performance.',
      tags: [
        'groups',
        'comparison-turning-inward',
        'a-small-moment-lands-on-an-o'
      ]
    },
    {
      date: '2026-04-21',
      note: 'With authority figures, grief after closeness was the pattern; I start over-explaining the second I fear not being believed when the situation asks me to trust before I am ready. The way it showed up alongside \'dealing with sarah is its own strain\' told me I still need more room for honesty than performance.',
      tags: [
        'authority-figures',
        'grief-after-closeness',
        'the-situation-asks-me-to-tru'
      ]
    }
  ],
  relationshipCharts: [
    {
      name: 'Lucas',
      relationship: 'son',
      birthDate: '2021-09-28',
      birthTime: '17:44',
      hasUnknownTime: false,
      birthPlace: 'Detroit, Michigan',
      latitude: 42.3314,
      longitude: -83.0458,
      timezone: 'America/Detroit',
      dynamicNote: 'Deepest daily attachment bond. This relationship carries fierce protectiveness, tenderness, depletion, responsibility, and the ache of wanting to be a safe home even when overwhelmed.'
    },
    {
      name: 'Annie',
      relationship: 'therapist / attachment figure',
      birthDate: '1989-08-22',
      birthTime: '02:59',
      hasUnknownTime: false,
      birthPlace: 'Grand Rapids, Michigan',
      latitude: 42.9634,
      longitude: -85.6681,
      timezone: 'America/Detroit',
      dynamicNote: 'Emotionally loaded attachment bond. This relationship carries longing, relief, fear of replacement, desire to feel singular and chosen, and deep sensitivity to closeness, distance, rupture, and repair.'
    }
  ]
};
