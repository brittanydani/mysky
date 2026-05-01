import { buildTodayInsights } from '../knowledgeEngineV2';
import {
  normalizeDreamsV2,
  normalizeGlimmerLogsV2,
  normalizeInsightInputsV2,
  normalizeReflectionAnswersV2,
  normalizeRelationshipMirrorsV2,
  normalizeTriggerLogsV2,
} from '../normalizers';

describe('insightsV2 normalizers', () => {
  const now = '2026-04-24T12:00:00Z';
  const today = '2026-04-24';

  it('normalizes reflection answers into primary self-knowledge signals', () => {
    const signals = normalizeReflectionAnswersV2([
      {
        date: today,
        category: 'cognitive',
        questionText: 'What pattern did you notice?',
        answer: 'I needed exact words and meaning before I could settle.',
        scaleValue: 3,
      },
    ]);

    expect(signals.some(signal => signal.source === 'reflectionBank' && signal.key === 'deep_processing')).toBe(true);
    expect(signals.some(signal => signal.source === 'reflectionBank' && signal.key === 'need_for_exact_words')).toBe(true);
    expect(signals.some(signal => signal.source === 'reflectionBank' && signal.key === 'meaning_making')).toBe(true);
  });

  it('normalizes trigger logs into drain, body, and relationship signals', () => {
    const signals = normalizeTriggerLogsV2([
      {
        timestamp: new Date(now).getTime(),
        mode: 'drain',
        event: 'A work deadline made me feel unsupported and tight in my chest.',
        contextArea: 'work',
        nsState: 'sympathetic',
        sensations: ['chest'],
        intensity: 4,
      },
    ]);

    expect(signals.some(signal => signal.source === 'triggerLog' && signal.key === 'responsibility_weight')).toBe(true);
    expect(signals.some(signal => signal.source === 'triggerLog' && signal.key === 'support_scarcity')).toBe(true);
    expect(signals.some(signal => signal.source === 'triggerLog' && signal.key === 'chest_pressure')).toBe(true);
  });

  it('normalizes glimmer logs into restoring and regulation signals', () => {
    const signals = normalizeGlimmerLogsV2([
      {
        timestamp: new Date(now).getTime(),
        mode: 'nourish',
        event: 'Quiet sunlight at home helped my body feel safe and lighter.',
        nsState: 'ventral',
        sensations: ['soft chest'],
        intensity: 3,
      },
    ]);

    expect(signals.some(signal => signal.source === 'glimmerLog' && signal.key === 'glimmer_softening')).toBe(true);
    expect(signals.some(signal => signal.source === 'glimmerLog' && signal.key === 'quiet_safety')).toBe(true);
    expect(signals.some(signal => signal.source === 'glimmerLog' && signal.key === 'home_as_safety')).toBe(true);
  });

  it('normalizes relationship mirrors into V2 relationship signals', () => {
    const signals = normalizeRelationshipMirrorsV2([
      {
        date: today,
        tags: ['t2', 't13'],
        note: 'I needed reassurance, consistency, and repair after the rupture.',
      },
    ]);

    expect(signals.some(signal => signal.source === 'relationshipMirror' && signal.key === 'relationship_safety_testing')).toBe(true);
    expect(signals.some(signal => signal.source === 'relationshipMirror' && signal.key === 'consistency_need')).toBe(true);
    expect(signals.some(signal => signal.source === 'relationshipMirror' && signal.key === 'repair_need')).toBe(true);
  });

  it('normalizes dreams from text, feelings, and metadata', () => {
    const signals = normalizeDreamsV2([
      {
        date: today,
        dreamText: 'I was looking for a room in my childhood home and the same hallway kept repeating.',
        dreamFeelings: JSON.stringify([{ id: 'anxious', intensity: 4 }]),
        dreamMetadata: JSON.stringify({ overallTheme: 'loss', recurring: true }),
      },
    ]);

    expect(signals.some(signal => signal.source === 'dream' && signal.key === 'dream_searching')).toBe(true);
    expect(signals.some(signal => signal.source === 'dream' && signal.key === 'dream_home')).toBe(true);
    expect(signals.some(signal => signal.source === 'dream' && signal.key === 'dream_repeated_symbol')).toBe(true);
    expect(signals.some(signal => signal.source === 'dream' && signal.key === 'dream_loss')).toBe(true);
  });

  it('normalizes practical and action-oriented language into execution signals', () => {
    const signals = normalizeInsightInputsV2({
      journals: [{
        date: today,
        text: 'I am rushing toward a deadline at work with not enough time. My mental load is tracking everything, I cannot turn off, and I have too many ideas to finish well.',
      }],
      reflectionAnswers: [{
        date: today,
        category: 'values',
        questionText: 'What standard mattered?',
        answer: 'I need clarity before I decide, and I care about quality, planning, habits, and building the project.',
        scaleValue: 3,
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'time_scarcity')).toBe(true);
    expect(signals.some(signal => signal.key === 'mental_load')).toBe(true);
    expect(signals.some(signal => signal.key === 'always_on')).toBe(true);
    expect(signals.some(signal => signal.key === 'decision_uncertainty')).toBe(true);
    expect(signals.some(signal => signal.key === 'high_standards')).toBe(true);
    expect(signals.some(signal => signal.key === 'vision_gap')).toBe(true);
    expect(signals.some(signal => signal.key === 'wants_to_build')).toBe(true);
  });

  it('normalizes positive and high-capacity inputs into restorative signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 4,
        energy: 5,
        stress: 1,
        tags: ['rested', 'supported', 'joy'],
      }],
      journals: [{
        date: today,
        text: 'I felt relief and hope. Rest helped, my body felt lighter, and I felt connected and supported.',
      }],
      sleepLogs: [{
        date: today,
        durationHours: 7.5,
        quality: 5,
      }],
      bodyMaps: [{
        date: today,
        cues: ['open', 'settled'],
        intensity: 4,
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'high_energy')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_stress')).toBe(true);
    expect(signals.some(signal => signal.key === 'mood_improvement')).toBe(true);
    expect(signals.some(signal => signal.key === 'restorative_moment')).toBe(true);
    expect(signals.some(signal => signal.key === 'body_lightness')).toBe(true);
    expect(signals.some(signal => signal.key === 'connection_glimmer')).toBe(true);
    expect(signals.some(signal => signal.key === 'support_abundance_shift')).toBe(true);
  });

  it('normalizes sensory and executive-function language without requiring diagnostic labels', () => {
    const signals = normalizeInsightInputsV2({
      journals: [{
        date: today,
        text: 'Noise and bright lights made my head pressure and brain fog spike. Task switching and a change of plans meant I needed a transition buffer. I kept masking, analyzing everything, and looking for the exact words.',
      }],
      reflectionAnswers: [{
        date: today,
        category: 'cognitive',
        questionText: 'What helped you process?',
        answer: 'I needed full context and time to process before I could feel it.',
        scaleValue: 3,
      }],
      bodyMaps: [{
        date: today,
        cues: ['overstimulated', 'brain_fog', 'shutdown'],
        intensity: 4,
      }],
      relationshipMirrors: [{
        date: today,
        tags: ['t5'],
        note: 'I edited myself and wanted to unmask and be seen accurately.',
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'sensory_sensitivity')).toBe(true);
    expect(signals.some(signal => signal.key === 'head_pressure')).toBe(true);
    expect(signals.some(signal => signal.key === 'body_heaviness')).toBe(true);
    expect(signals.some(signal => signal.key === 'needs_pause')).toBe(true);
    expect(signals.some(signal => signal.key === 'calm_bracing')).toBe(true);
    expect(signals.some(signal => signal.key === 'decision_uncertainty')).toBe(true);
    expect(signals.some(signal => signal.key === 'analysis_as_regulation')).toBe(true);
    expect(signals.some(signal => signal.key === 'seeks_context')).toBe(true);
    expect(signals.some(signal => signal.key === 'need_for_exact_words')).toBe(true);
    expect(signals.some(signal => signal.key === 'selective_vulnerability')).toBe(true);
    expect(signals.some(signal => signal.key === 'becoming_visible')).toBe(true);
    expect(signals.some(signal => signal.key === 'wants_to_be_seen')).toBe(true);
  });

  it('normalizes life-context language into belonging, security, family, and systems signals', () => {
    const signals = normalizeInsightInputsV2({
      journals: [{
        date: today,
        text: 'I felt like I did not belong in that community, like an outsider. Cultural expectations and family obligation were misaligned with my values. Rent, bills, groceries, and job security made me afraid I could lose my job or lose housing. Caregiving and childcare had me protecting my kid.',
      }],
      reflectionAnswers: [{
        date: today,
        category: 'values',
        questionText: 'What context mattered?',
        answer: 'I want chosen family, community care, and a safe community. I am trying to break the cycle for future generations while staying connected to faith, prayer, and my ancestors.',
        scaleValue: 3,
      }],
      glimmerLogs: [{
        timestamp: new Date(now).getTime(),
        event: 'My people welcomed me, and that mutual aid made me feel included.',
        nsState: 'ventral',
        intensity: 3,
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'belonging_ache')).toBe(true);
    expect(signals.some(signal => signal.key === 'chosen_family')).toBe(true);
    expect(signals.some(signal => signal.key === 'family_loyalty_tension')).toBe(true);
    expect(signals.some(signal => signal.key === 'values_conflict')).toBe(true);
    expect(signals.some(signal => signal.key === 'scarcity_scanning')).toBe(true);
    expect(signals.some(signal => signal.key === 'fear_of_loss')).toBe(true);
    expect(signals.some(signal => signal.key === 'caretaking_pressure')).toBe(true);
    expect(signals.some(signal => signal.key === 'protective_care')).toBe(true);
    expect(signals.some(signal => signal.key === 'breaks_old_pattern')).toBe(true);
    expect(signals.some(signal => signal.key === 'faith_meaning')).toBe(true);
    expect(signals.some(signal => signal.key === 'legacy_signal')).toBe(true);
    expect(signals.some(signal => signal.key === 'support_abundance_shift')).toBe(true);
  });

  it('normalizes creative expression and identity-transition language', () => {
    const signals = normalizeInsightInputsV2({
      journals: [{
        date: today,
        text: 'Writing and making art helped me process. I needed to express it, put it into words, and found my voice, but the blank page also felt like a creative block. I rearranged the room with lighting and color. This feels like a new chapter where I am rewriting my old story and choosing myself.',
      }],
      reflectionAnswers: [{
        date: today,
        category: 'identity',
        questionText: 'What permission changed?',
        answer: 'I gave myself permission to define myself, forgive myself, and be kinder to my past self.',
        scaleValue: 3,
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'creative_processing')).toBe(true);
    expect(signals.some(signal => signal.key === 'expression_need')).toBe(true);
    expect(signals.some(signal => signal.key === 'voice_emerging')).toBe(true);
    expect(signals.some(signal => signal.key === 'creative_block')).toBe(true);
    expect(signals.some(signal => signal.key === 'beauty_making')).toBe(true);
    expect(signals.some(signal => signal.key === 'chapter_shift')).toBe(true);
    expect(signals.some(signal => signal.key === 'identity_rewriting')).toBe(true);
    expect(signals.some(signal => signal.key === 'old_story_loosening')).toBe(true);
    expect(signals.some(signal => signal.key === 'choosing_self')).toBe(true);
    expect(signals.some(signal => signal.key === 'permission_shift')).toBe(true);
    expect(signals.some(signal => signal.key === 'self_definition')).toBe(true);
    expect(signals.some(signal => signal.key === 'past_self_compassion')).toBe(true);
    expect(signals.some(signal => signal.key === 'self_forgiveness')).toBe(true);
  });

  it('normalizes support-seeking, receiving-care, and boundary language', () => {
    const signals = normalizeInsightInputsV2({
      journals: [{
        date: today,
        text: "I said no and felt guilty for saying no. I minimized my need and said it's fine because I don't want to bother anyone or be too much. I wish someone noticed and would check in on me without asking. It was hard to receive help, so I deflected help. I needed distance to protect my peace because I felt controlled and trapped.",
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'says_no')).toBe(true);
    expect(signals.some(signal => signal.key === 'boundary_guilt')).toBe(true);
    expect(signals.some(signal => signal.key === 'guilt')).toBe(true);
    expect(signals.some(signal => signal.key === 'minimizes_need')).toBe(true);
    expect(signals.some(signal => signal.key === 'fear_of_being_too_much')).toBe(true);
    expect(signals.some(signal => signal.key === 'wants_to_be_caught')).toBe(true);
    expect(signals.some(signal => signal.key === 'receiving_care_difficulty')).toBe(true);
    expect(signals.some(signal => signal.key === 'peace_boundary')).toBe(true);
    expect(signals.some(signal => signal.key === 'distance_for_safety')).toBe(true);
    expect(signals.some(signal => signal.key === 'autonomy_need')).toBe(true);
  });

  it('keeps primary source ordering across all V2 inputs', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{ date: today, mood: 2, energy: 1, stress: 5 }],
      journals: [{ date: today, text: 'I feel guilt and need support.' }],
      sleepLogs: [{ date: today, durationHours: 5, quality: 2 }],
      bodyMaps: [{ date: today, cues: ['chest'], intensity: 4 }],
      triggerLogs: [{ timestamp: new Date(now).getTime(), event: 'unsupported deadline', nsState: 'sympathetic' }],
      glimmerLogs: [{ timestamp: new Date(now).getTime(), event: 'quiet safe home', nsState: 'ventral' }],
      relationshipMirrors: [{ date: today, tags: ['t2'], note: 'I needed reassurance.' }],
      reflectionAnswers: [{
        date: today,
        category: 'values',
        questionText: 'What mattered?',
        answer: 'Support and truth',
        scaleValue: 3,
      }],
    }, now);

    const reflectionIndex = signals.findIndex(signal => signal.source === 'reflectionBank');
    const bodyIndex = signals.findIndex(signal => signal.source === 'bodyMap');
    const triggerIndex = signals.findIndex(signal => signal.source === 'triggerLog');
    const glimmerIndex = signals.findIndex(signal => signal.source === 'glimmerLog');
    const relationshipIndex = signals.findIndex(signal => signal.source === 'relationshipMirror');
    const journalIndex = signals.findIndex(signal => signal.source === 'journal');
    const checkInIndex = signals.findIndex(signal => signal.source === 'dailyCheckIn');
    const sleepIndex = signals.findIndex(signal => signal.source === 'sleep');

    expect(reflectionIndex).toBeGreaterThanOrEqual(0);
    expect(reflectionIndex).toBeLessThan(bodyIndex);
    expect(bodyIndex).toBeLessThan(triggerIndex);
    expect(triggerIndex).toBeLessThan(glimmerIndex);
    expect(glimmerIndex).toBeLessThan(relationshipIndex);
    expect(relationshipIndex).toBeLessThan(journalIndex);
    expect(journalIndex).toBeLessThan(checkInIndex);
    expect(checkInIndex).toBeLessThan(sleepIndex);
  });

  it('can produce an active relationship insight from relationship mirror data alone', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        relationshipMirrors: [
          {
            date: today,
            tags: ['t2', 't13'],
            note: 'I needed reassurance, consistency, trust, and repair after the rupture.',
          },
        ],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('relationships_001_safety_testing');
  });

  it('can produce an active practical insight from time pressure data', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        journals: [{
          date: today,
          text: 'I am rushing toward a deadline at work with not enough time. I am carrying responsibility and planning everything.',
        }],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('scarcity_006_time_scarcity');
    expect(insight?.angleKey).toBe('practical_001_time_pressure');
  });

  it('can produce an active positive insight from glimmer data', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        glimmerLogs: [
          {
            timestamp: new Date(now).getTime(),
            event: 'Quiet sunlight brought relief, helped my body feel safe, and left me lighter.',
            nsState: 'ventral',
            sensations: ['open chest'],
            intensity: 4,
          },
        ],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('glimmers_001_quiet_relief');
    expect(insight?.angleKey).toBe('positive_002_quiet_relief');
  });

  it('can produce an active sensory-load insight from input and body cues', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        bodyMaps: [{
          date: today,
          cues: ['brain_fog'],
          intensity: 5,
        }],
        journals: [{
          date: today,
          text: 'Sensory overload and bright lights made my head pressure spike.',
        }],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('body_signals_013_sensory_load');
    expect(insight?.angleKey).toBe('sensory_exec_002_sensory_load');
  });

  it('can produce an active task-switching insight from transition and clarity cues', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        reflectionAnswers: [{
          date: today,
          category: 'cognitive',
          questionText: 'What made the next step hard?',
          answer: 'Task switching and context switching made choosing hard. I needed clarity and full context before action, plus a transition buffer.',
          scaleValue: 3,
        }],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('cognitive_007_clarity_before_action');
    expect(insight?.angleKey).toBe('sensory_exec_004_task_switching');
  });

  it('can produce an active belonging-context insight from community and translation cues', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        journals: [{
          date: today,
          text: 'I did not belong in that community. I felt out of place and lonely, and I wanted to be seen accurately without translating myself.',
        }],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('support_belonging_008_belonging_ache');
    expect(insight?.angleKey).toBe('context_001_belonging_context');
  });

  it('can produce an active security-context insight from money, work, and housing cues', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        journals: [{
          date: today,
          text: 'Rent, bills, groceries, and job security made me scan for loss. I was afraid I could lose my job and lose housing, and I kept rationing energy.',
        }],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('scarcity_001_scarcity_scanner');
    expect(insight?.angleKey).toBe('context_005_security_pressure');
  });

  it('can produce an active dream-symbol insight from repeated dream material', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        dreams: [{
          date: today,
          dreamText: 'I was looking for a missing room in my childhood home, and the same hallway kept repeating.',
          dreamMetadata: JSON.stringify({ recurring: true }),
        }],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('dreams_003_repeated_symbol');
    expect(insight?.angleKey).toBe('symbolic_002_repeated_dream_symbol');
  });

  it('can produce an active chart insight when symbolic themes meet lived signals', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        natalChartThemes: [{
          date: today,
          theme: 'communication',
          active: true,
        }],
        reflectionAnswers: [{
          date: today,
          category: 'communication',
          questionText: 'What helped you name it?',
          answer: 'Exact words and writing helped me explain what I felt.',
          scaleValue: 3,
        }],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('chart_003_communication_theme');
    expect(insight?.angleKey).toBe('symbolic_006_communication_theme');
  });

  it('can produce an active creative-processing insight from expression cues', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        journals: [{
          date: today,
          text: 'Writing and making art helped me process the feeling. I needed to express it, put it into words, and found my voice.',
        }],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('creativity_001_creative_alchemy');
    expect(insight?.angleKey).toBe('creative_identity_001_creation_as_processing');
  });

  it('can produce an active chapter-shift insight from identity-transition cues', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        journals: [{
          date: today,
          text: 'This feels like a new chapter and transition season. I am rewriting my old story, becoming someone else, and building a life my future self can breathe inside.',
        }],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('identity_003_chapter_shift');
    expect(insight?.angleKey).toBe('creative_identity_006_chapter_shift');
  });

  it('can produce an active hard-to-ask insight from minimized support needs', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        journals: [{
          date: today,
          text: "I need support but minimized my need, said it's fine, don't want to bother anyone, and worried I was too much.",
        }],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('support_belonging_013_hard_to_ask');
    expect(insight?.angleKey).toBe('support_boundary_001_hard_to_ask');
  });

  it('can produce an active boundary-guilt insight after saying no', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        journals: [{
          date: today,
          text: 'I said no and felt guilty for saying no. I chose myself and trusted my knowing even though guilt stayed.',
        }],
      },
      history: [],
    });

    const insight = result.insights.find(item => item.slot === 'whatMySkyNoticed');
    expect(insight).toBeDefined();
    expect(insight?.patternKey).toBe('boundaries_003_guilt_after_saying_no');
    expect(insight?.angleKey).toBe('support_boundary_004_guilt_after_no');
  });
});
