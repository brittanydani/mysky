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

  it('normalizes opposite persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 4,
        energy: 4,
        stress: 1,
        tags: ['action', 'direct', 'expressive', 'neutral', 'defined support'],
      }],
      journals: [{
        date: today,
        text: "I process through action and move on instead of dwelling. My next step was clear, I bounced back, stayed present, and let it pass. I take conversations at face value, prefer direct communication, and don't read into it when silence felt neutral. I don't need reassurance if what was said clearly is enough. When I was upset it came out quickly, I talked it out, reacted in real time, and needed open communication while it was fresh. Helping is a choice, not my responsibility, and I let others handle things when there is shared responsibility, help with boundaries, and a defined way to help.",
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'action_forward_processing')).toBe(true);
    expect(signals.some(signal => signal.key === 'move_on_orientation')).toBe(true);
    expect(signals.some(signal => signal.key === 'what_now_focus')).toBe(true);
    expect(signals.some(signal => signal.key === 'quick_recovery')).toBe(true);
    expect(signals.some(signal => signal.key === 'present_focus')).toBe(true);
    expect(signals.some(signal => signal.key === 'lets_it_pass')).toBe(true);
    expect(signals.some(signal => signal.key === 'face_value_relating')).toBe(true);
    expect(signals.some(signal => signal.key === 'direct_communication_preference')).toBe(true);
    expect(signals.some(signal => signal.key === 'silence_neutral')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_relational_tracking')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_reassurance_need')).toBe(true);
    expect(signals.some(signal => signal.key === 'clear_over_implied')).toBe(true);
    expect(signals.some(signal => signal.key === 'immediate_expression')).toBe(true);
    expect(signals.some(signal => signal.key === 'real_time_reaction')).toBe(true);
    expect(signals.some(signal => signal.key === 'talks_to_process')).toBe(true);
    expect(signals.some(signal => signal.key === 'emotional_externalizing')).toBe(true);
    expect(signals.some(signal => signal.key === 'fresh_expression')).toBe(true);
    expect(signals.some(signal => signal.key === 'open_communication_need')).toBe(true);
    expect(signals.some(signal => signal.key === 'selective_helping')).toBe(true);
    expect(signals.some(signal => signal.key === 'defined_support')).toBe(true);
    expect(signals.some(signal => signal.key === 'shared_responsibility')).toBe(true);
    expect(signals.some(signal => signal.key === 'lets_others_handle')).toBe(true);
    expect(signals.some(signal => signal.key === 'care_with_boundaries')).toBe(true);
    expect(signals.some(signal => signal.key === 'assigned_responsibility_only')).toBe(true);
  });

  it('normalizes expanded opposite persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 4,
        energy: 3,
        stress: 1,
        tags: ['ease', 'flexible', 'steady', 'resting', 'receive', 'compliment'],
      }],
      journals: [{
        date: today,
        text: 'Pressure makes my energy drop, and I need flexibility with room to breathe. Life feels livable matters more than progress, not everything needs to be a project, I need freedom before ambition, and I work in bursts. My mood has a steady baseline, there was an obvious cause, I returned to baseline, practical explanations helped, I am not up and down, and subtle emotional changes are easy to miss. Rest comes easily, I can rest without guilt, when tired I slow down, ordinary downtime and a simple pause helped, and rest as care feels normal. Thoughts first, then body signals arrive later. I rely on logic more than sensation, stress signs show up late, I assume I am okay because functioning, and I check in with my body intentionally. I can receive care without debt, the compliment landed, I asked for help early, my needs belong, support reached me, and I feel valued without being useful.',
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'low_pressure_motivation')).toBe(true);
    expect(signals.some(signal => signal.key === 'flexibility_need')).toBe(true);
    expect(signals.some(signal => signal.key === 'ease_over_achievement')).toBe(true);
    expect(signals.some(signal => signal.key === 'obligation_resistance')).toBe(true);
    expect(signals.some(signal => signal.key === 'freedom_before_ambition')).toBe(true);
    expect(signals.some(signal => signal.key === 'burst_pacing')).toBe(true);
    expect(signals.some(signal => signal.key === 'steady_mood_baseline')).toBe(true);
    expect(signals.some(signal => signal.key === 'obvious_cause_emotions')).toBe(true);
    expect(signals.some(signal => signal.key === 'baseline_recovery')).toBe(true);
    expect(signals.some(signal => signal.key === 'practical_mood_tracking')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_emotional_variability')).toBe(true);
    expect(signals.some(signal => signal.key === 'subtle_emotion_blindspot')).toBe(true);
    expect(signals.some(signal => signal.key === 'easy_rest')).toBe(true);
    expect(signals.some(signal => signal.key === 'rest_without_guilt')).toBe(true);
    expect(signals.some(signal => signal.key === 'responds_to_fatigue')).toBe(true);
    expect(signals.some(signal => signal.key === 'ordinary_downtime')).toBe(true);
    expect(signals.some(signal => signal.key === 'restorative_pause')).toBe(true);
    expect(signals.some(signal => signal.key === 'rest_as_care')).toBe(true);
    expect(signals.some(signal => signal.key === 'thought_first_processing')).toBe(true);
    expect(signals.some(signal => signal.key === 'delayed_body_awareness')).toBe(true);
    expect(signals.some(signal => signal.key === 'logic_over_sensation')).toBe(true);
    expect(signals.some(signal => signal.key === 'late_stress_signals')).toBe(true);
    expect(signals.some(signal => signal.key === 'functioning_over_settled')).toBe(true);
    expect(signals.some(signal => signal.key === 'intentional_body_checkin')).toBe(true);
    expect(signals.some(signal => signal.key === 'open_receiving')).toBe(true);
    expect(signals.some(signal => signal.key === 'compliment_lands')).toBe(true);
    expect(signals.some(signal => signal.key === 'asks_help_early')).toBe(true);
    expect(signals.some(signal => signal.key === 'needs_belong')).toBe(true);
    expect(signals.some(signal => signal.key === 'support_reaches_inside')).toBe(true);
    expect(signals.some(signal => signal.key === 'valued_without_usefulness')).toBe(true);
  });

  it('normalizes later opposite persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 4,
        energy: 3,
        stress: 2,
        tags: ['clear', 'unbraced', 'closure', 'future', 'direct', 'productive'],
      }],
      journals: [{
        date: today,
        text: "I knew it was a no and my boundary still valid, the limit was clear. I can disappoint someone without abandoning myself, a simple no is enough, and I honored my limit early before resentment builds. Calm feels normal, I settle easily, I don't monitor every shift, I trust safe moments, stillness feels comfortable, and small disruption passed. I recognized it was done, my attention shifted forward, I let the ending complete, closure helps me move, I can hold memory without attachment, and I felt relief after ending. I expect the same capacity all day, push through low capacity, schedule not capacity, override tiredness, expect willpower, and ignore energy patterns. I said what I mean, trust clear words, say it sooner, don't replay conversations, choose honesty over perfect delivery, and trust repair can happen. I put getting things done before enjoying, pleasure feels secondary, move past enjoyment quickly, relaxing feels less natural, value more with output, and my mind stays on responsibilities. I think about what comes next, focus on change instead of present, planning ahead feels safer, restless when nothing moves forward, the present feels like a stepping stone, and I am already thinking about what comes next. I think ahead so nothing runs out, planning feels like protection, prepare for the worst, choose safety over flexibility, need everything accounted for, and trust preparation more than trust. I look for deeper meaning before action, reflection more comfortable than action, interpret something instead of addressing it, stay symbolic, have clarity without next steps, and interpretation safer than change. My identity shifts quickly, reinvention feels easier, identity feels flexible, I adapt to new roles, different versions of me show in different contexts, and I feel less continuity.",
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'firm_inner_knowing')).toBe(true);
    expect(signals.some(signal => signal.key === 'boundary_without_confirmation')).toBe(true);
    expect(signals.some(signal => signal.key === 'quick_limit_clarity')).toBe(true);
    expect(signals.some(signal => signal.key === 'can_disappoint_others')).toBe(true);
    expect(signals.some(signal => signal.key === 'simple_boundary_answer')).toBe(true);
    expect(signals.some(signal => signal.key === 'early_limit_honoring')).toBe(true);
    expect(signals.some(signal => signal.key === 'familiar_calm')).toBe(true);
    expect(signals.some(signal => signal.key === 'easy_settling')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_scanning')).toBe(true);
    expect(signals.some(signal => signal.key === 'trusts_safe_moments')).toBe(true);
    expect(signals.some(signal => signal.key === 'unbraced_stillness')).toBe(true);
    expect(signals.some(signal => signal.key === 'quick_disruption_recovery')).toBe(true);
    expect(signals.some(signal => signal.key === 'clean_closure')).toBe(true);
    expect(signals.some(signal => signal.key === 'future_after_ending')).toBe(true);
    expect(signals.some(signal => signal.key === 'lets_endings_complete')).toBe(true);
    expect(signals.some(signal => signal.key === 'direct_closure_need')).toBe(true);
    expect(signals.some(signal => signal.key === 'memory_without_attachment')).toBe(true);
    expect(signals.some(signal => signal.key === 'relief_after_ending')).toBe(true);
    expect(signals.some(signal => signal.key === 'same_capacity_expectation')).toBe(true);
    expect(signals.some(signal => signal.key === 'pushes_low_capacity')).toBe(true);
    expect(signals.some(signal => signal.key === 'schedule_over_capacity')).toBe(true);
    expect(signals.some(signal => signal.key === 'overrides_tiredness')).toBe(true);
    expect(signals.some(signal => signal.key === 'willpower_over_timing')).toBe(true);
    expect(signals.some(signal => signal.key === 'ignores_energy_patterns')).toBe(true);
    expect(signals.some(signal => signal.key === 'plain_direct_speech')).toBe(true);
    expect(signals.some(signal => signal.key === 'clear_words_preference')).toBe(true);
    expect(signals.some(signal => signal.key === 'says_it_sooner')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_conversation_replay')).toBe(true);
    expect(signals.some(signal => signal.key === 'honesty_over_delivery')).toBe(true);
    expect(signals.some(signal => signal.key === 'directness_with_repair')).toBe(true);
    expect(signals.some(signal => signal.key === 'productivity_before_pleasure')).toBe(true);
    expect(signals.some(signal => signal.key === 'pleasure_secondary')).toBe(true);
    expect(signals.some(signal => signal.key === 'enjoyment_minimized')).toBe(true);
    expect(signals.some(signal => signal.key === 'relaxation_discomfort')).toBe(true);
    expect(signals.some(signal => signal.key === 'output_over_enjoyment')).toBe(true);
    expect(signals.some(signal => signal.key === 'responsibilities_during_pleasure')).toBe(true);
    expect(signals.some(signal => signal.key === 'future_preoccupation')).toBe(true);
    expect(signals.some(signal => signal.key === 'change_over_present')).toBe(true);
    expect(signals.some(signal => signal.key === 'planning_over_presence')).toBe(true);
    expect(signals.some(signal => signal.key === 'restless_without_progress')).toBe(true);
    expect(signals.some(signal => signal.key === 'present_as_stepping_stone')).toBe(true);
    expect(signals.some(signal => signal.key === 'already_thinking_next')).toBe(true);
    expect(signals.some(signal => signal.key === 'scarcity_planning')).toBe(true);
    expect(signals.some(signal => signal.key === 'planning_as_protection')).toBe(true);
    expect(signals.some(signal => signal.key === 'worst_case_preparation')).toBe(true);
    expect(signals.some(signal => signal.key === 'safety_over_flexibility')).toBe(true);
    expect(signals.some(signal => signal.key === 'accounted_for_security')).toBe(true);
    expect(signals.some(signal => signal.key === 'control_for_uncertainty')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_before_action')).toBe(true);
    expect(signals.some(signal => signal.key === 'reflection_over_action')).toBe(true);
    expect(signals.some(signal => signal.key === 'interpretation_as_distance')).toBe(true);
    expect(signals.some(signal => signal.key === 'symbolic_over_practical')).toBe(true);
    expect(signals.some(signal => signal.key === 'insight_without_steps')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_replaces_change')).toBe(true);
    expect(signals.some(signal => signal.key === 'rapid_identity_shift')).toBe(true);
    expect(signals.some(signal => signal.key === 'reinvention_orientation')).toBe(true);
    expect(signals.some(signal => signal.key === 'flexible_identity')).toBe(true);
    expect(signals.some(signal => signal.key === 'role_adaptation')).toBe(true);
    expect(signals.some(signal => signal.key === 'context_dependent_self')).toBe(true);
    expect(signals.some(signal => signal.key === 'continuity_gap')).toBe(true);
  });

  it('normalizes middle opposite persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 4,
        energy: 3,
        stress: 2,
        tags: ['joy', 'playful', 'present', 'stable', 'practical'],
      }],
      journals: [{
        date: today,
        text: 'I allow enjoyment without turning it into something productive, play comes naturally, desire gets to be information, choosing beauty comfort or pleasure adds something good to my life, I recover through joy, and pleasure does not have to be earned. When something sparks interest it is worth following, music movement touch laughter taste or color brings me back into myself, joy can be part of how I stay connected, and I am protecting pleasure. I am connected to the current moment, long term direction may not feel urgent, some chapters are simply lived and not constantly interpreted, I make choices based on what fits my current reality, too much planning ahead overwhelms me, and momentum through the next step is enough. I trust life to reveal direction gradually, stop turning every choice into a life-defining moment, staying present feels more honest than chasing a future identity, and the future needs attention before it becomes urgent. I am anxious about resources unless clear reason, trust needs can be handled as they arise, enough as a practical reality when basics are covered, stability can feel real, and I spend without turning every choice into a safety calculation. I see resources as flexible rather than fixed, do not feel the same pull to hoard energy time or money, remember enough can shift, make choices from preference not only from fear, and trust needs to be paired with practical limits. I prefer what actually happened rather than what it might symbolize, meaning may matter when it helps me live more clearly, I feel grounded by facts, resist turning pain into a lesson too quickly, and do not read much into timing, coincidence or signs unless there is a practical reason. Simpler explanations help, I ask what happened and what helps now, I do not need a spiritual frame, trust what can be observed, and leave room for meaning that cannot be fully proven. I feel like the same core person, growth may feel less like becoming someone new and more like becoming clearer about who I already am, new experiences add to me without completely rearranging me, and I feel grounded by continuity. I do not need to reinvent myself when a chapter ends, I have a stable sense of my preferences and the core does not disappear, others seeing me differently does not fully define who I am, I return to myself easily after stressful seasons, the past version of me can still belong, and I allow change to reach me without treating it as a threat.',
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'pleasure_without_productivity')).toBe(true);
    expect(signals.some(signal => signal.key === 'natural_play')).toBe(true);
    expect(signals.some(signal => signal.key === 'desire_as_information')).toBe(true);
    expect(signals.some(signal => signal.key === 'chooses_beauty_comfort')).toBe(true);
    expect(signals.some(signal => signal.key === 'joy_recovery')).toBe(true);
    expect(signals.some(signal => signal.key === 'pleasure_unearned_trust')).toBe(true);
    expect(signals.some(signal => signal.key === 'spontaneous_interest')).toBe(true);
    expect(signals.some(signal => signal.key === 'body_aliveness_cues')).toBe(true);
    expect(signals.some(signal => signal.key === 'joy_as_meaning')).toBe(true);
    expect(signals.some(signal => signal.key === 'protects_delight')).toBe(true);
    expect(signals.some(signal => signal.key === 'current_moment_grounding')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_future_urgency')).toBe(true);
    expect(signals.some(signal => signal.key === 'lives_without_interpreting')).toBe(true);
    expect(signals.some(signal => signal.key === 'current_reality_decisions')).toBe(true);
    expect(signals.some(signal => signal.key === 'long_term_planning_overwhelm')).toBe(true);
    expect(signals.some(signal => signal.key === 'next_step_momentum')).toBe(true);
    expect(signals.some(signal => signal.key === 'gradual_direction_trust')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_life_defining_pressure')).toBe(true);
    expect(signals.some(signal => signal.key === 'presence_over_optimization')).toBe(true);
    expect(signals.some(signal => signal.key === 'future_attention_when_needed')).toBe(true);
    expect(signals.some(signal => signal.key === 'resource_anxiety_only_with_reason')).toBe(true);
    expect(signals.some(signal => signal.key === 'needs_handled_as_arise')).toBe(true);
    expect(signals.some(signal => signal.key === 'practical_enoughness')).toBe(true);
    expect(signals.some(signal => signal.key === 'stability_feels_real')).toBe(true);
    expect(signals.some(signal => signal.key === 'spending_without_safety_math')).toBe(true);
    expect(signals.some(signal => signal.key === 'resource_flexibility')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_resource_hoarding')).toBe(true);
    expect(signals.some(signal => signal.key === 'enough_can_shift')).toBe(true);
    expect(signals.some(signal => signal.key === 'preference_over_fear')).toBe(true);
    expect(signals.some(signal => signal.key === 'trust_with_limits')).toBe(true);
    expect(signals.some(signal => signal.key === 'concrete_over_symbolic')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_when_useful')).toBe(true);
    expect(signals.some(signal => signal.key === 'facts_over_interpretation')).toBe(true);
    expect(signals.some(signal => signal.key === 'resists_forced_lesson')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_sign_reading')).toBe(true);
    expect(signals.some(signal => signal.key === 'simple_explanations')).toBe(true);
    expect(signals.some(signal => signal.key === 'what_happened_what_helps')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_without_spiritual_frame')).toBe(true);
    expect(signals.some(signal => signal.key === 'evidence_anchor')).toBe(true);
    expect(signals.some(signal => signal.key === 'room_for_unproven_meaning')).toBe(true);
    expect(signals.some(signal => signal.key === 'stable_core_self')).toBe(true);
    expect(signals.some(signal => signal.key === 'growth_as_clarity')).toBe(true);
    expect(signals.some(signal => signal.key === 'change_adds_not_rearranges')).toBe(true);
    expect(signals.some(signal => signal.key === 'continuity_grounding')).toBe(true);
    expect(signals.some(signal => signal.key === 'adapts_without_reinventing')).toBe(true);
    expect(signals.some(signal => signal.key === 'stable_preferences_values')).toBe(true);
    expect(signals.some(signal => signal.key === 'perception_not_identity')).toBe(true);
    expect(signals.some(signal => signal.key === 'returns_to_self')).toBe(true);
    expect(signals.some(signal => signal.key === 'past_self_belongs')).toBe(true);
    expect(signals.some(signal => signal.key === 'change_without_threat')).toBe(true);
  });

  it('normalizes family through dream opposite persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 3,
        energy: 3,
        stress: 2,
        tags: ['family', 'flexible'],
      }],
      journals: [{
        date: today,
        text: 'I can stay myself around family, old roles still exist but I recognize them without stepping back into them, and I am not responsible for maintaining the emotional balance. Family feels more neutral now, I can choose how involved I want to be, notice an old pattern and decide not to participate, and expectation does not automatically become identity. I can stay grounded even if others are reacting strongly, not carry family dynamics with me after I leave, and allow connection without losing autonomy. I do not register small shifts, subtle improvements or easing may pass, I do not track gradual progress, relief more when it arrives fully, and awareness sharpens when something crosses a certain threshold. It is easier to notice what is wrong than what is improving, I do not pause to take in small moments of ease, rely on noticeable changes, trust bigger signals more than quieter ones, and I am learning to recognize smaller shifts. I focus on what works rather than how something feels, feel more comfortable completing something than experimenting, and I am not drawn to express emotions through creative outlets. I look for the most efficient solution, prefer clear instructions over open interpretation, feel less connected to abstract or symbolic expression, and do not revisit something once complete. I feel satisfied when something is done well, value usefulness over originality, and allow expression that does not need to be useful. I adapt my standards depending on the situation, good enough can feel acceptable, prioritize practicality over strict alignment, and flexibility can feel more useful than consistency. I move forward even when something is not fully resolved, do not dwell on small inconsistencies, am comfortable making tradeoffs, do not feel a strong need to challenge every misalignment, value outcomes over principles, and notice when something matters enough to hold more firmly. I make sense of things through what happens during the day rather than through dreams, I am not drawn to interpret dreams beyond what is obvious, and I process emotions through conversation action or reflection while awake. I trust real events more than symbolic ones, dreams fade quickly, I prefer clear explanations over symbolic meaning, and I feel grounded when focusing on real-world experiences. I do not notice recurring dream themes, process change through action, and notice when something beneath the surface still wants attention.',
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'family_individuation')).toBe(true);
    expect(signals.some(signal => signal.key === 'old_roles_observed')).toBe(true);
    expect(signals.some(signal => signal.key === 'not_family_emotional_manager')).toBe(true);
    expect(signals.some(signal => signal.key === 'neutral_family_presence')).toBe(true);
    expect(signals.some(signal => signal.key === 'intentional_family_involvement')).toBe(true);
    expect(signals.some(signal => signal.key === 'old_pattern_nonparticipation')).toBe(true);
    expect(signals.some(signal => signal.key === 'expectation_not_identity')).toBe(true);
    expect(signals.some(signal => signal.key === 'grounded_around_family_intensity')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_family_lingering')).toBe(true);
    expect(signals.some(signal => signal.key === 'autonomy_in_family_connection')).toBe(true);
    expect(signals.some(signal => signal.key === 'subtle_shift_blindspot')).toBe(true);
    expect(signals.some(signal => signal.key === 'obvious_change_only')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_gradual_progress_tracking')).toBe(true);
    expect(signals.some(signal => signal.key === 'full_relief_need')).toBe(true);
    expect(signals.some(signal => signal.key === 'threshold_awareness')).toBe(true);
    expect(signals.some(signal => signal.key === 'improvement_blindspot')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_ease_savoring')).toBe(true);
    expect(signals.some(signal => signal.key === 'noticeable_change_tracking')).toBe(true);
    expect(signals.some(signal => signal.key === 'strong_signal_trust')).toBe(true);
    expect(signals.some(signal => signal.key === 'small_shift_learning')).toBe(true);
    expect(signals.some(signal => signal.key === 'function_over_feeling')).toBe(true);
    expect(signals.some(signal => signal.key === 'completion_over_experiment')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_creative_emotional_expression')).toBe(true);
    expect(signals.some(signal => signal.key === 'efficient_solution_focus')).toBe(true);
    expect(signals.some(signal => signal.key === 'structure_over_open_interpretation')).toBe(true);
    expect(signals.some(signal => signal.key === 'concrete_over_abstract_expression')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_completion_revisit')).toBe(true);
    expect(signals.some(signal => signal.key === 'done_well_satisfaction')).toBe(true);
    expect(signals.some(signal => signal.key === 'usefulness_over_originality')).toBe(true);
    expect(signals.some(signal => signal.key === 'expression_without_usefulness')).toBe(true);
    expect(signals.some(signal => signal.key === 'contextual_standards')).toBe(true);
    expect(signals.some(signal => signal.key === 'good_enough_acceptance')).toBe(true);
    expect(signals.some(signal => signal.key === 'practicality_over_alignment')).toBe(true);
    expect(signals.some(signal => signal.key === 'flexibility_over_consistency')).toBe(true);
    expect(signals.some(signal => signal.key === 'moves_without_full_resolution')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_inconsistency_dwelling')).toBe(true);
    expect(signals.some(signal => signal.key === 'tradeoff_comfort')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_misalignment_challenge')).toBe(true);
    expect(signals.some(signal => signal.key === 'outcomes_over_principles')).toBe(true);
    expect(signals.some(signal => signal.key === 'firm_when_matters')).toBe(true);
    expect(signals.some(signal => signal.key === 'waking_life_processing')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_dream_interpretation')).toBe(true);
    expect(signals.some(signal => signal.key === 'daytime_processing')).toBe(true);
    expect(signals.some(signal => signal.key === 'real_events_over_symbols')).toBe(true);
    expect(signals.some(signal => signal.key === 'dreams_fade_quickly')).toBe(true);
    expect(signals.some(signal => signal.key === 'clear_over_symbolic_explanation')).toBe(true);
    expect(signals.some(signal => signal.key === 'real_world_grounding')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_dream_theme_tracking')).toBe(true);
    expect(signals.some(signal => signal.key === 'action_processing_change')).toBe(true);
    expect(signals.some(signal => signal.key === 'beneath_surface_attention')).toBe(true);
  });

  it('normalizes hybrid persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 3,
        energy: 3,
        stress: 3,
        tags: ['support', 'boundaries'],
      }],
      journals: [{
        date: today,
        text: 'I notice what needs attention without automatically making it my job, still feel the pull to help even when stepping back is healthier, and feel responsible emotionally without wanting to become responsible practically. I care deeply while still letting someone else handle their part, pause before deciding whether it actually belongs to me, and feel guilty for not stepping in even when I made the right choice. I am learning that noticing a need is not the same as being assigned to meet it, the limit does not erase the care, I track what is happening but no longer move as quickly into fixing, and I let concern exist without turning it into over-responsibility. I want to understand something deeply then cannot keep circling it anymore, another part wants relief from thinking, I process intensely in a short window, and staying in it starts to feel too consuming. Clarity may come in waves with deep reflection first, I revisit something later even after deciding I was done, understanding takes too long, I use action to give my processing somewhere to go, I need meaning but not endless meaning-making, and I notice when reflection is helping or becomes another place to stay stuck. I pick up changes in someone’s tone while acting like it did not affect me, my body notices distance before my face, I seem calm externally while internally checking whether the relationship still feels okay, and I protect myself by acting less invested than I actually feel. I pull back first so I am not the one left reaching, tell myself it does not matter while still tracking every shift, look unaffected until I know whether it is safe to care openly, silence bothers me more than I let on, I need reassurance but resist needing it, and connection matters deeply even when protection looks like distance. Something affected me before I know how to say it, I go quiet because there is too much, rehearse my words privately, and expression comes after the intensity has settled enough to become language. Silence is not the same as indifference, I need space first then conversation later, it comes out carefully because I have been holding it for a while, people expect an immediate response while I am still sorting through, I express more honestly once I no longer feel pressured to perform clarity, and my voice is strongest after quiet helped me find it. I am becoming more careful about what I take on, helping feels better when it is chosen not automatic, I pause before offering support and ask whether I actually have capacity. Care does not have to mean availability, when responsibility is truly mine I can show up fully, I feel the old pull to overgive even while knowing it will cost me, I am redefining care as something with boundaries, support is more meaningful when it does not come from guilt, I am generous but less willing to abandon myself, and sustainable care is still real care.',
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'notices_need_without_job')).toBe(true);
    expect(signals.some(signal => signal.key === 'help_pull_with_boundary')).toBe(true);
    expect(signals.some(signal => signal.key === 'emotional_not_practical_responsibility')).toBe(true);
    expect(signals.some(signal => signal.key === 'care_without_action')).toBe(true);
    expect(signals.some(signal => signal.key === 'ownership_pause')).toBe(true);
    expect(signals.some(signal => signal.key === 'guilt_for_not_stepping_in')).toBe(true);
    expect(signals.some(signal => signal.key === 'need_not_assignment')).toBe(true);
    expect(signals.some(signal => signal.key === 'limits_protect_care')).toBe(true);
    expect(signals.some(signal => signal.key === 'tracks_without_fixing')).toBe(true);
    expect(signals.some(signal => signal.key === 'concern_without_overresponsibility')).toBe(true);
    expect(signals.some(signal => signal.key === 'deep_reflection_limit')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_relief_tension')).toBe(true);
    expect(signals.some(signal => signal.key === 'intense_short_processing')).toBe(true);
    expect(signals.some(signal => signal.key === 'moves_when_consuming')).toBe(true);
    expect(signals.some(signal => signal.key === 'waves_reflection_action')).toBe(true);
    expect(signals.some(signal => signal.key === 'revisit_after_done')).toBe(true);
    expect(signals.some(signal => signal.key === 'impatient_processing')).toBe(true);
    expect(signals.some(signal => signal.key === 'action_for_processing')).toBe(true);
    expect(signals.some(signal => signal.key === 'bounded_meaning')).toBe(true);
    expect(signals.some(signal => signal.key === 'reflection_stuck_awareness')).toBe(true);
    expect(signals.some(signal => signal.key === 'tracks_tone_acts_unaffected')).toBe(true);
    expect(signals.some(signal => signal.key === 'body_notices_distance_hidden')).toBe(true);
    expect(signals.some(signal => signal.key === 'calm_outside_tracking_inside')).toBe(true);
    expect(signals.some(signal => signal.key === 'less_invested_protection')).toBe(true);
    expect(signals.some(signal => signal.key === 'pulls_back_first')).toBe(true);
    expect(signals.some(signal => signal.key === 'says_doesnt_matter_tracks')).toBe(true);
    expect(signals.some(signal => signal.key === 'unaffected_until_safe')).toBe(true);
    expect(signals.some(signal => signal.key === 'hidden_silence_distress')).toBe(true);
    expect(signals.some(signal => signal.key === 'resists_reassurance_need')).toBe(true);
    expect(signals.some(signal => signal.key === 'protected_distance_connection')).toBe(true);
    expect(signals.some(signal => signal.key === 'affected_before_words')).toBe(true);
    expect(signals.some(signal => signal.key === 'quiet_from_too_much')).toBe(true);
    expect(signals.some(signal => signal.key === 'private_word_rehearsal')).toBe(true);
    expect(signals.some(signal => signal.key === 'expression_after_settling')).toBe(true);
    expect(signals.some(signal => signal.key === 'silence_not_indifference')).toBe(true);
    expect(signals.some(signal => signal.key === 'space_then_conversation')).toBe(true);
    expect(signals.some(signal => signal.key === 'careful_after_holding')).toBe(true);
    expect(signals.some(signal => signal.key === 'immediate_response_pressure')).toBe(true);
    expect(signals.some(signal => signal.key === 'honest_after_no_pressure')).toBe(true);
    expect(signals.some(signal => signal.key === 'voice_after_quiet')).toBe(true);
    expect(signals.some(signal => signal.key === 'careful_about_taken_on')).toBe(true);
    expect(signals.some(signal => signal.key === 'chosen_support')).toBe(true);
    expect(signals.some(signal => signal.key === 'capacity_before_support')).toBe(true);
    expect(signals.some(signal => signal.key === 'care_not_availability')).toBe(true);
    expect(signals.some(signal => signal.key === 'show_up_when_yours')).toBe(true);
    expect(signals.some(signal => signal.key === 'old_overgive_pull')).toBe(true);
    expect(signals.some(signal => signal.key === 'bounded_care_redefinition')).toBe(true);
    expect(signals.some(signal => signal.key === 'support_without_guilt')).toBe(true);
    expect(signals.some(signal => signal.key === 'generous_without_self_abandoning')).toBe(true);
    expect(signals.some(signal => signal.key === 'sustainable_care')).toBe(true);
  });

  it('normalizes ambition through receiving hybrid persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 3,
        energy: 2,
        stress: 3,
        tags: ['steady', 'rest'],
      }],
      journals: [{
        date: today,
        text: 'I have big hopes but too much structure can make them feel heavy, and I care deeply about doing well while resisting pressure. My motivation disappears when a goal starts feeling like a test. I move best when there is room to experiment, want progress without wanting my whole life organized around productivity, and ambition may show up in bursts. I want success, but not success that requires constant output. I need to feel free enough to care about it again, struggle when something I love becomes something I have to do, and want structure to support my goals without turning them into a cage. I feel fairly steady until something specific cuts through, my emotions may not shift constantly but the change can feel sharp, and I am surprised by how strongly certain things affect me because they interrupt a baseline that usually feels stable. I do not notice emotional buildup until it suddenly becomes obvious. My steadiness is real, but it does not mean I am unaffected. Triggers move through me faster than my mind can explain. I recover well from ordinary stress but specific situations can stay with me longer. People see me as steady and miss the moments when something lands deeply. I need to know my few strong triggers clearly because my steadiness gets interrupted. I need rest and still keep going because something feels unresolved. I know I am tired but do not feel free to stop. Rest seems reasonable in theory, but harder to choose when my mind is still tracking what needs attention. I promise myself I will pause after one more thing, then keep finding one more thing. My body may ask for rest before my sense of responsibility agrees. I am frustrated because I understand the need for rest but still struggle to protect it. Stopping feels less like relief and more like leaving something exposed. Rest has a clear boundary when my mind knows it can return later. I want to feel allowed to take rest before everything is finished, because unfinished does not always mean unsafe. I notice a body signal and immediately start asking what it means. Sensation may be the first clue, but my mind moves in quickly to interpret. I feel tension heaviness or unease and start searching for the reason behind it. My body gives me information but my mind wants to organize it before I trust it. I struggle to stay with a sensation without turning it into a problem to solve. Analyzing it too quickly can pull me away from the signal. I know my body is speaking while still translating it into thoughts. The body may say something is here, and my mind may immediately ask why. My awareness is strong but crowded by interpretation. I am practicing letting the sensation exist for a moment before needing it to explain itself. I let care in but part of me still wants to return it quickly. Receiving feels good but being indebted may feel uncomfortable. I trust support more easily when I can offer something back. Care may reach me and activate the question of how to keep things even. I do not reject kindness, but I feel pressure to respond with usefulness. I receive more than I used to while still feeling exposed by being the one who needs. Appreciation may land, but fully resting in it can take longer. I feel safe where giving and receiving both flow naturally. I want support but also want to make sure I am not taking too much. I am learning to let care stay with me before turning it into something I owe.',
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'big_hopes_structure_heavy')).toBe(true);
    expect(signals.some(signal => signal.key === 'cares_resists_pressure')).toBe(true);
    expect(signals.some(signal => signal.key === 'goal_as_test_shutdown')).toBe(true);
    expect(signals.some(signal => signal.key === 'experiment_room_motivation')).toBe(true);
    expect(signals.some(signal => signal.key === 'progress_without_productivity_life')).toBe(true);
    expect(signals.some(signal => signal.key === 'burst_ambition')).toBe(true);
    expect(signals.some(signal => signal.key === 'success_not_constant_output')).toBe(true);
    expect(signals.some(signal => signal.key === 'freedom_restores_care')).toBe(true);
    expect(signals.some(signal => signal.key === 'loved_goal_becomes_have_to')).toBe(true);
    expect(signals.some(signal => signal.key === 'supportive_structure_not_cage')).toBe(true);
    expect(signals.some(signal => signal.key === 'steady_until_trigger')).toBe(true);
    expect(signals.some(signal => signal.key === 'sharp_emotional_shift')).toBe(true);
    expect(signals.some(signal => signal.key === 'baseline_interruption_surprise')).toBe(true);
    expect(signals.some(signal => signal.key === 'delayed_buildup_awareness')).toBe(true);
    expect(signals.some(signal => signal.key === 'steady_not_unaffected')).toBe(true);
    expect(signals.some(signal => signal.key === 'trigger_faster_than_explanation')).toBe(true);
    expect(signals.some(signal => signal.key === 'ordinary_stress_recovers_specific_lingers')).toBe(true);
    expect(signals.some(signal => signal.key === 'unseen_deep_landing')).toBe(true);
    expect(signals.some(signal => signal.key === 'few_strong_triggers')).toBe(true);
    expect(signals.some(signal => signal.key === 'steadiness_interrupted')).toBe(true);
    expect(signals.some(signal => signal.key === 'rest_needed_unresolved')).toBe(true);
    expect(signals.some(signal => signal.key === 'tired_but_not_free_stop')).toBe(true);
    expect(signals.some(signal => signal.key === 'rest_theory_hard_choice')).toBe(true);
    expect(signals.some(signal => signal.key === 'one_more_thing_loop')).toBe(true);
    expect(signals.some(signal => signal.key === 'body_rest_before_responsibility')).toBe(true);
    expect(signals.some(signal => signal.key === 'rest_awareness_frustration')).toBe(true);
    expect(signals.some(signal => signal.key === 'stopping_exposes_unfinished')).toBe(true);
    expect(signals.some(signal => signal.key === 'bounded_rest_return')).toBe(true);
    expect(signals.some(signal => signal.key === 'allowed_before_finished')).toBe(true);
    expect(signals.some(signal => signal.key === 'unfinished_not_unsafe')).toBe(true);
    expect(signals.some(signal => signal.key === 'body_signal_interpretation')).toBe(true);
    expect(signals.some(signal => signal.key === 'sensation_first_mind_interprets')).toBe(true);
    expect(signals.some(signal => signal.key === 'sensation_reason_search')).toBe(true);
    expect(signals.some(signal => signal.key === 'body_info_mind_organizes')).toBe(true);
    expect(signals.some(signal => signal.key === 'sensation_problem_solving')).toBe(true);
    expect(signals.some(signal => signal.key === 'analysis_pulls_from_signal')).toBe(true);
    expect(signals.some(signal => signal.key === 'translates_body_to_thought')).toBe(true);
    expect(signals.some(signal => signal.key === 'body_says_mind_asks_why')).toBe(true);
    expect(signals.some(signal => signal.key === 'interpretation_crowds_awareness')).toBe(true);
    expect(signals.some(signal => signal.key === 'sensation_before_explanation')).toBe(true);
    expect(signals.some(signal => signal.key === 'receives_then_returns')).toBe(true);
    expect(signals.some(signal => signal.key === 'indebted_receiving_discomfort')).toBe(true);
    expect(signals.some(signal => signal.key === 'support_trusted_when_reciprocal')).toBe(true);
    expect(signals.some(signal => signal.key === 'care_evenness_question')).toBe(true);
    expect(signals.some(signal => signal.key === 'kindness_usefulness_pressure')).toBe(true);
    expect(signals.some(signal => signal.key === 'receives_but_exposed_need')).toBe(true);
    expect(signals.some(signal => signal.key === 'appreciation_lands_slow_rest')).toBe(true);
    expect(signals.some(signal => signal.key === 'mutual_flow_safety')).toBe(true);
    expect(signals.some(signal => signal.key === 'support_too_much_fear')).toBe(true);
    expect(signals.some(signal => signal.key === 'care_before_owed')).toBe(true);
  });

  it('normalizes boundary through communication hybrid persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 3,
        energy: 3,
        stress: 3,
        tags: ['clear', 'calm', 'closure', 'direct'],
      }],
      journals: [{
        date: today,
        text: 'I felt clear about a boundary in the moment, then replay it later wondering if I was too much. Saying no felt right at first, but uncomfortable once I imagine how it affected the other person. I trust my instincts quickly but trust them less once someone reacts. The decision itself is not the hardest part; sitting with the outcome is. I look for reassurance after setting a limit. My clarity is strong in real time but confidence fades afterward. I revisit boundaries to make sure I was fair, kind, or justified enough. I feel more certain when no one is disappointed and less certain when they are. My limit mattered, but another part wants to soften it after the fact. I am learning to let the boundary stand without needing to revisit it for approval. I appear settled on the outside while something in me stays ready. Calm does not always mean fully relaxed; it means composed while still tracking. My body holds quiet readiness even when nothing is actively wrong. I move through situations smoothly while still monitoring for change. Others see me as calm, but I am still paying attention underneath. I do not fully drop my guard. My steadiness comes from being prepared, and I trust myself to handle things, which keeps me slightly engaged. Relaxation happens in layers, and I am learning when it is safe to soften not just to manage. I want closure so I can move on, but feelings do not follow that timeline. I feel ready to leave something behind, then notice it resurfacing unexpectedly. Part of me wants resolution while another part still has something to process. I think I am done only to realize there is still something unfinished underneath. Moving forward may be real, even if something comes back in waves. I do not want to revisit something, but moments bring it back. Closure may feel like a decision, while grief moves on its own schedule. I feel frustrated when something returns after I thought it was settled. Both are true: moving on and still affected. I am allowing forward movement and returning feelings without forcing one to cancel the other. I understand my energy patterns and still expect myself to perform outside them. Awareness is there, but following it consistently can be harder. Something would be easier later but I push through now anyway. My mind may recognize rhythm while expectations ignore it. I feel the difference between high and low capacity but treat them the same in practice. I plan around timing then override the plan when pressure shows up. I know when rest or delay would help but choose momentum instead. There is a gap between what I know works and what I actually do. I feel frustrated not because I do not understand my rhythm, but because I do not always follow it. I am trusting my timing enough to let it guide decisions, not just inform them. I speak clearly but add more detail to make sure nothing is misunderstood. My instinct is to be direct but care shows up as extra explanation. I say what I mean then continue explaining to make sure it lands the right way. I trust my words but not always that they will be received as intended. I feel responsible for how it is understood, not just what is said. I keep clarifying even after my point was already clear. My communication may expand under pressure because I want accuracy. I feel settled once I have fully explained, even when it was not strictly necessary. The more important conversation has more layers I may add. I am learning my first clear expression is often enough.',
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'boundary_clear_then_replayed')).toBe(true);
    expect(signals.some(signal => signal.key === 'no_right_then_reaction_discomfort')).toBe(true);
    expect(signals.some(signal => signal.key === 'instinct_trust_fades_after_reaction')).toBe(true);
    expect(signals.some(signal => signal.key === 'outcome_harder_than_decision')).toBe(true);
    expect(signals.some(signal => signal.key === 'post_boundary_reassurance')).toBe(true);
    expect(signals.some(signal => signal.key === 'real_time_clarity_faded_confidence')).toBe(true);
    expect(signals.some(signal => signal.key === 'boundary_fairness_recheck')).toBe(true);
    expect(signals.some(signal => signal.key === 'disappointment_reduces_certainty')).toBe(true);
    expect(signals.some(signal => signal.key === 'limit_softening_after_fact')).toBe(true);
    expect(signals.some(signal => signal.key === 'boundary_without_approval')).toBe(true);
    expect(signals.some(signal => signal.key === 'outward_settled_under_ready')).toBe(true);
    expect(signals.some(signal => signal.key === 'composed_still_tracking')).toBe(true);
    expect(signals.some(signal => signal.key === 'quiet_readiness')).toBe(true);
    expect(signals.some(signal => signal.key === 'smooth_monitoring_change')).toBe(true);
    expect(signals.some(signal => signal.key === 'calm_seen_attention_hidden')).toBe(true);
    expect(signals.some(signal => signal.key === 'guard_not_dropped')).toBe(true);
    expect(signals.some(signal => signal.key === 'prepared_steadiness')).toBe(true);
    expect(signals.some(signal => signal.key === 'handling_trust_keeps_engaged')).toBe(true);
    expect(signals.some(signal => signal.key === 'layered_relaxation')).toBe(true);
    expect(signals.some(signal => signal.key === 'soften_not_manage')).toBe(true);
    expect(signals.some(signal => signal.key === 'closure_wanted_feelings_lag')).toBe(true);
    expect(signals.some(signal => signal.key === 'ready_then_resurfacing')).toBe(true);
    expect(signals.some(signal => signal.key === 'resolution_processing_split')).toBe(true);
    expect(signals.some(signal => signal.key === 'done_but_unfinished_underneath')).toBe(true);
    expect(signals.some(signal => signal.key === 'forward_with_waves')).toBe(true);
    expect(signals.some(signal => signal.key === 'unwanted_revisiting')).toBe(true);
    expect(signals.some(signal => signal.key === 'closure_decision_grief_schedule')).toBe(true);
    expect(signals.some(signal => signal.key === 'settled_then_returns_frustration')).toBe(true);
    expect(signals.some(signal => signal.key === 'moving_on_still_affected')).toBe(true);
    expect(signals.some(signal => signal.key === 'forward_and_returning_feelings')).toBe(true);
    expect(signals.some(signal => signal.key === 'knows_rhythm_overrides')).toBe(true);
    expect(signals.some(signal => signal.key === 'awareness_hard_to_follow')).toBe(true);
    expect(signals.some(signal => signal.key === 'easier_later_push_now')).toBe(true);
    expect(signals.some(signal => signal.key === 'rhythm_known_expectations_ignore')).toBe(true);
    expect(signals.some(signal => signal.key === 'capacity_difference_same_practice')).toBe(true);
    expect(signals.some(signal => signal.key === 'timing_plan_overridden')).toBe(true);
    expect(signals.some(signal => signal.key === 'knows_delay_helps_choose_momentum')).toBe(true);
    expect(signals.some(signal => signal.key === 'knows_works_not_done')).toBe(true);
    expect(signals.some(signal => signal.key === 'rhythm_following_frustration')).toBe(true);
    expect(signals.some(signal => signal.key === 'timing_guides_decisions')).toBe(true);
    expect(signals.some(signal => signal.key === 'clear_speech_extra_detail')).toBe(true);
    expect(signals.some(signal => signal.key === 'direct_with_extra_explanation')).toBe(true);
    expect(signals.some(signal => signal.key === 'continues_after_meaning')).toBe(true);
    expect(signals.some(signal => signal.key === 'words_trusted_reception_not')).toBe(true);
    expect(signals.some(signal => signal.key === 'responsible_for_understanding')).toBe(true);
    expect(signals.some(signal => signal.key === 'clarifies_after_clear')).toBe(true);
    expect(signals.some(signal => signal.key === 'pressure_expands_accuracy')).toBe(true);
    expect(signals.some(signal => signal.key === 'settled_after_full_explanation')).toBe(true);
    expect(signals.some(signal => signal.key === 'important_conversation_layers')).toBe(true);
    expect(signals.some(signal => signal.key === 'first_expression_enough')).toBe(true);
  });

  it('normalizes late hybrid persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 3,
        energy: 3,
        stress: 3,
        tags: ['present', 'resources', 'meaning'],
      }],
      journals: [{
        date: today,
        text: 'I enjoy things but it feels easier once something important is finished. Pleasure feels more relaxed when earned, even if I know it should not have to be earned. I enjoy myself but still keep awareness of what is waiting for me afterward. Joy is available but sits next to responsibility. It is hard to fully relax into something fun if something else still feels incomplete. Breaks feel like pauses between effort, enjoyment has a clear start and end point, pleasure and productivity do not conflict, I try to stay present while another part tracks what still needs to be done, and I want enjoyment stand on its own, not just as a reward. I stay grounded in my current life most of the time, but decisions suddenly open up bigger questions. I do not think far ahead regularly, but when I do it can feel intense and important. The future may not guide daily choices, but it can pull my attention in key moments. I feel comfortable without a clear plan until direction feels urgent. My focus tends to stay close to what is real now, but I am not disconnected from possibility. Big questions may come in waves. I trust the present most of the time while wanting a clearer path. Direction may matter most when something begins to shift. I do not define myself by long-term goals, but I still feel when something wants to change. I am letting the present guide me while the future asks for attention. I believe things can be handled but certain situations still bring up strong concern. Trust is my baseline, but it does not fully override moments of fear. I feel calm about resources most of the time until something personal raises the stakes. My thinking shifts from this will be fine to what if it is not. I plan lightly most of the time but plan more intensely when something feels uncertain. Trust and worry may coexist. I return to a steady state after concern passes even if the activation felt strong. Worry shows up even when I logically know I will figure things out. Certain triggers may activate a stronger need to prepare or protect. I am letting trust lead while respecting the moments when caution is useful. Things matter deeply while still wanting to deal with them in practical ways. Meaning may help me understand but does not replace the need for action. I resist explanations that turn everything into a lesson too quickly. I want to understand why something matters and know what to do next. I feel connected to something larger but still grounded in what is actually happening. Meaning feels real when connected to lived experience. I am open to interpretation without wanting to lose clarity. Meaning is used to minimize real impact. I can hold both reflection and realism at the same time. I let meaning deepen my experience without replacing what is true. I feel like the same person at my core while parts of my life are shifting. Change affects circumstances more than my identity and still requires adjustment. I feel steady inside while everything around me is reorganizing. My sense of self stays intact even when roles or environment change. I do not question who I am but question how that fits into what is next. Stability and transition may exist at the same time. I feel grounded but still aware that something is moving. I trust myself through change even when the path is unclear. The challenge may not be identity but integration and how everything fits together now. I allow change to reshape my life without redefining me.',
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'pleasure_after_completion')).toBe(true);
    expect(signals.some(signal => signal.key === 'earned_pleasure_relaxation')).toBe(true);
    expect(signals.some(signal => signal.key === 'enjoyment_with_afterward_tracking')).toBe(true);
    expect(signals.some(signal => signal.key === 'joy_with_responsibility')).toBe(true);
    expect(signals.some(signal => signal.key === 'fun_blocked_by_incomplete')).toBe(true);
    expect(signals.some(signal => signal.key === 'breaks_between_effort')).toBe(true);
    expect(signals.some(signal => signal.key === 'contained_enjoyment')).toBe(true);
    expect(signals.some(signal => signal.key === 'pleasure_productivity_nonconflict')).toBe(true);
    expect(signals.some(signal => signal.key === 'present_with_task_tracking')).toBe(true);
    expect(signals.some(signal => signal.key === 'enjoyment_not_reward')).toBe(true);
    expect(signals.some(signal => signal.key === 'present_grounded_future_questions')).toBe(true);
    expect(signals.some(signal => signal.key === 'rare_future_thought_intense')).toBe(true);
    expect(signals.some(signal => signal.key === 'future_key_moment_pull')).toBe(true);
    expect(signals.some(signal => signal.key === 'plan_free_until_urgent')).toBe(true);
    expect(signals.some(signal => signal.key === 'now_focus_with_possibility')).toBe(true);
    expect(signals.some(signal => signal.key === 'big_questions_in_waves')).toBe(true);
    expect(signals.some(signal => signal.key === 'present_trust_path_want')).toBe(true);
    expect(signals.some(signal => signal.key === 'direction_when_shift')).toBe(true);
    expect(signals.some(signal => signal.key === 'not_goal_defined_change_signal')).toBe(true);
    expect(signals.some(signal => signal.key === 'present_guides_future_listens')).toBe(true);
    expect(signals.some(signal => signal.key === 'resource_trust_with_concern')).toBe(true);
    expect(signals.some(signal => signal.key === 'trust_baseline_fear_moments')).toBe(true);
    expect(signals.some(signal => signal.key === 'resource_calm_until_personal_stakes')).toBe(true);
    expect(signals.some(signal => signal.key === 'fine_to_what_if_shift')).toBe(true);
    expect(signals.some(signal => signal.key === 'light_planning_until_uncertain')).toBe(true);
    expect(signals.some(signal => signal.key === 'trust_worry_coexist')).toBe(true);
    expect(signals.some(signal => signal.key === 'steady_after_resource_activation')).toBe(true);
    expect(signals.some(signal => signal.key === 'logical_trust_worry_frustration')).toBe(true);
    expect(signals.some(signal => signal.key === 'resource_triggers_prepare')).toBe(true);
    expect(signals.some(signal => signal.key === 'trust_leads_caution_respected')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_with_practical_action')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_not_action_replacement')).toBe(true);
    expect(signals.some(signal => signal.key === 'resists_quick_lessons')).toBe(true);
    expect(signals.some(signal => signal.key === 'why_and_next_step')).toBe(true);
    expect(signals.some(signal => signal.key === 'larger_connection_grounded')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_lived_experience')).toBe(true);
    expect(signals.some(signal => signal.key === 'interpretation_with_clarity')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_not_minimizing_impact')).toBe(true);
    expect(signals.some(signal => signal.key === 'reflection_and_realism')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_deepens_truth')).toBe(true);
    expect(signals.some(signal => signal.key === 'same_core_life_shifting')).toBe(true);
    expect(signals.some(signal => signal.key === 'circumstance_change_identity_stable')).toBe(true);
    expect(signals.some(signal => signal.key === 'steady_inside_reorganizing')).toBe(true);
    expect(signals.some(signal => signal.key === 'self_intact_role_change')).toBe(true);
    expect(signals.some(signal => signal.key === 'fit_next_question')).toBe(true);
    expect(signals.some(signal => signal.key === 'stability_transition_coexist')).toBe(true);
    expect(signals.some(signal => signal.key === 'grounded_moving_awareness')).toBe(true);
    expect(signals.some(signal => signal.key === 'self_trust_unclear_path')).toBe(true);
    expect(signals.some(signal => signal.key === 'integration_not_identity')).toBe(true);
    expect(signals.some(signal => signal.key === 'change_reshapes_not_redefines')).toBe(true);
  });

  it('normalizes family through symbolic realist hybrid persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 3,
        energy: 3,
        stress: 3,
        tags: ['family', 'practical'],
      }],
      journals: [{
        date: today,
        text: 'I feel more like myself around family than I used to, while old roles trying to come back online. I am not responsible for the whole family dynamic anymore, but familiar patterns can still make responsibility feel automatic. I feel grounded in who I am now, then pulled into who I had to be before. Family may not fully define me, but it can activate parts of me other environments do not reach. I am able to choose more than I once could, even if choosing still takes effort. Old expectations may not control me, but they create pressure in my body. I notice myself responding differently now, then feeling the old guilt afterward. Being separate from the family pattern feels freeing and uncomfortable at the same time. I have more autonomy now, but history still has a way of making moments feel loaded. I am staying connected where it is healthy without handing my identity back to the old role. I noticed a small moment of calm and wondered if it will last. Relief may show up in little flashes, but part of me stays cautious around it. I felt my body soften briefly, then started checking whether something will interrupt. Small good moments may be real, even if they do not feel strong enough to trust. I want to believe the ease is safe, while another part waits for proof. A moment of lightness may matter, even when it does not change the whole day. I pass over small relief because it feels too temporary to count. Calm may need repetition before my body believes it is more than a pause. I notice glimmers but still hesitate to affect my expectations. I am letting small good moments matter without needing them to prove everything is okay. I care deeply about how something feels, but I also need it to function in real life. Beauty matters to me more when it serves something true useful or livable. I enjoy creative expression most when it becomes something tangible. My ideas move from feeling into form. I do not want creativity to stay abstract, because part of the satisfaction comes from making it real. I care about details because they affect both emotion and function. Expression matters but execution matters too, and I feel proud when both are present. I feel frustrated by ideas that are beautiful but do not hold up practically. My creative process moves between intuition and problem-solving. I am letting creativity stay alive while still giving it structure. I care about doing what feels right while still understanding that real life sometimes requires tradeoffs. Not every compromise feels like betrayal, and knowing the difference matters. I am flexible on details while staying firm about the deeper principle underneath. Practicality can matter without replacing my values. I am willing to bend when the cost is small, but not when something important in me feels crossed. I choose the workable option while still noticing what it costs emotionally. My integrity may be less about perfection and more about knowing which lines I cannot comfortably cross. I can tolerate ambiguity when needed, but not dishonesty. Some choices may look practical from the outside while still requiring an internal check-in. I am staying adaptable without slowly negotiating away what matters most. I notice symbols dreams or patterns, but still want them connected to something real. Meaning matters most when it helps clarify my actual life. I am open to symbolism while resisting explanations that feel too far removed from reality. A dream or image may stay with me because it touches something true. I trust meaning more when it connects back to a feeling choice relationship or pattern I can recognize. I enjoy reflection but do not want to disappear into it. Symbols may help me understand something, but they do not replace what happened. I hold both intuition and evidence in the same hand. The pattern matters, but so does the context around it. I let meaning deepen my understanding without letting it float away from my real life.',
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'family_self_with_old_roles')).toBe(true);
    expect(signals.some(signal => signal.key === 'family_responsibility_automatic')).toBe(true);
    expect(signals.some(signal => signal.key === 'current_self_old_role_pull')).toBe(true);
    expect(signals.some(signal => signal.key === 'family_activates_old_parts')).toBe(true);
    expect(signals.some(signal => signal.key === 'family_choice_effort')).toBe(true);
    expect(signals.some(signal => signal.key === 'old_expectations_body_pressure')).toBe(true);
    expect(signals.some(signal => signal.key === 'old_guilt_after_new_response')).toBe(true);
    expect(signals.some(signal => signal.key === 'separate_pattern_mixed')).toBe(true);
    expect(signals.some(signal => signal.key === 'autonomy_history_loaded')).toBe(true);
    expect(signals.some(signal => signal.key === 'connected_without_old_identity')).toBe(true);
    expect(signals.some(signal => signal.key === 'small_calm_duration_doubt')).toBe(true);
    expect(signals.some(signal => signal.key === 'relief_flashes_caution')).toBe(true);
    expect(signals.some(signal => signal.key === 'softening_interrupt_check')).toBe(true);
    expect(signals.some(signal => signal.key === 'small_good_not_trusted')).toBe(true);
    expect(signals.some(signal => signal.key === 'ease_waits_for_proof')).toBe(true);
    expect(signals.some(signal => signal.key === 'lightness_partial_day')).toBe(true);
    expect(signals.some(signal => signal.key === 'temporary_relief_discount')).toBe(true);
    expect(signals.some(signal => signal.key === 'calm_repetition_needed')).toBe(true);
    expect(signals.some(signal => signal.key === 'glimmer_expectation_hesitation')).toBe(true);
    expect(signals.some(signal => signal.key === 'small_good_moments_matter')).toBe(true);
    expect(signals.some(signal => signal.key === 'beauty_function_both')).toBe(true);
    expect(signals.some(signal => signal.key === 'beauty_serves_livable')).toBe(true);
    expect(signals.some(signal => signal.key === 'expression_to_tangible')).toBe(true);
    expect(signals.some(signal => signal.key === 'feeling_into_form')).toBe(true);
    expect(signals.some(signal => signal.key === 'creativity_not_abstract')).toBe(true);
    expect(signals.some(signal => signal.key === 'detail_emotion_function')).toBe(true);
    expect(signals.some(signal => signal.key === 'expression_execution_pride')).toBe(true);
    expect(signals.some(signal => signal.key === 'beautiful_impractical_frustration')).toBe(true);
    expect(signals.some(signal => signal.key === 'intuition_problem_solving')).toBe(true);
    expect(signals.some(signal => signal.key === 'creativity_alive_with_structure')).toBe(true);
    expect(signals.some(signal => signal.key === 'values_with_tradeoffs')).toBe(true);
    expect(signals.some(signal => signal.key === 'compromise_discernment')).toBe(true);
    expect(signals.some(signal => signal.key === 'flexible_details_firm_principle')).toBe(true);
    expect(signals.some(signal => signal.key === 'practicality_without_replacing_values')).toBe(true);
    expect(signals.some(signal => signal.key === 'small_bend_not_crossed')).toBe(true);
    expect(signals.some(signal => signal.key === 'workable_option_cost')).toBe(true);
    expect(signals.some(signal => signal.key === 'integrity_lines_not_perfection')).toBe(true);
    expect(signals.some(signal => signal.key === 'ambiguity_not_dishonesty')).toBe(true);
    expect(signals.some(signal => signal.key === 'practical_choice_inner_check')).toBe(true);
    expect(signals.some(signal => signal.key === 'adaptable_not_negotiating_values')).toBe(true);
    expect(signals.some(signal => signal.key === 'symbols_grounded_real')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_clarifies_actual_life')).toBe(true);
    expect(signals.some(signal => signal.key === 'symbolism_reality_resistance')).toBe(true);
    expect(signals.some(signal => signal.key === 'dream_image_true_feeling')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_connected_recognizable')).toBe(true);
    expect(signals.some(signal => signal.key === 'reflection_without_disappearing')).toBe(true);
    expect(signals.some(signal => signal.key === 'symbols_not_replace_happened')).toBe(true);
    expect(signals.some(signal => signal.key === 'intuition_and_evidence')).toBe(true);
    expect(signals.some(signal => signal.key === 'pattern_with_context')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_grounded_real_life')).toBe(true);
  });

  it('normalizes over-engagement through overextended-giver persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 3,
        energy: 2,
        stress: 4,
        tags: ['support', 'direct'],
      }],
      journals: [{
        date: today,
        text: 'I may not notice what needs attention right away, but when I do, I quickly feel pulled into it. Responsibility may not feel constant, but it can become intense once something registers as important. I move from this is not mine to I should handle this more quickly than expected. I do not track everything, but certain situations activate a strong sense of obligation. When something becomes clear, I feel a sudden urgency to respond. I step in fully once I feel involved, even if I was distant before. Responsibility may come in waves rather than staying consistent. I am surprised by how much I take on once something matters. I do not prepare for responsibility, but I feel it strongly once it arrives. I am noticing earlier so engagement does not have to become all-or-nothing. I move on from something quickly, then find myself thinking about it again later. It can be easy to let something go until it quietly comes back. I do not process in the moment, but my mind returns when things are calmer. I feel done with something, then realize later it still affected me. Moving forward may come naturally, but full closure may take longer. I revisit things after I have already left them behind. My processing may be delayed rather than absent. I feel fine initially then more reflective afterward. Something may not feel important until it has distance. I am allowing a little reflection earlier so it does not have to return later. I do not notice subtle shifts in connection most of the time, but certain moments suddenly stand out. Relationships may feel simple until something specific makes them feel complicated. I do not track connection closely, but when something changes it can feel more surprising. I feel unaffected until a moment clearly shows me something is off. My awareness of connection may come in sharp moments instead of constant tracking. I do not worry about relationships often, but certain signals can quickly get my attention. I trust connection easily, but feel unsettled when something breaks that assumption. I do not read between the lines, but direct shifts can still impact me. I feel steady in relationships until something clearly disrupts that feeling. I am building awareness without needing to monitor everything. I express something right away, then realize later I did not fully understand it. Talking may help me process, even if the first version is not fully clear. I say what I feel in the moment, then refine it afterward. Expression may come before clarity. I feel better after speaking, even if I later adjust what I meant. I revisit what I said once I have had more time to think. My feelings come out in real time, even while they are still forming. I do not hold things in, but that does not mean they are fully processed. I clarify my own emotions through conversation. I am giving space to refine later. I step in to help before checking whether I actually have the capacity. Giving can feel automatic, especially when someone else needs something. I realize the impact on my energy after I have already committed. It is easier to say yes than to pause and decide. I do not notice limits until they have already been crossed. Helping may feel natural even when it becomes overwhelming. I prioritize someone else\'s need before checking my own. I feel responsible once I am already involved. Pulling back can feel harder than stepping in. I am adding a pause before I give, not after.',
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'responsibility_not_noticed_early')).toBe(true);
    expect(signals.some(signal => signal.key === 'responsibility_registers_intense')).toBe(true);
    expect(signals.some(signal => signal.key === 'not_mine_to_should_handle')).toBe(true);
    expect(signals.some(signal => signal.key === 'selective_obligation_activation')).toBe(true);
    expect(signals.some(signal => signal.key === 'clear_need_sudden_urgency')).toBe(true);
    expect(signals.some(signal => signal.key === 'step_in_after_involved')).toBe(true);
    expect(signals.some(signal => signal.key === 'responsibility_waves')).toBe(true);
    expect(signals.some(signal => signal.key === 'surprised_by_taken_on')).toBe(true);
    expect(signals.some(signal => signal.key === 'responsibility_arrives_unprepared')).toBe(true);
    expect(signals.some(signal => signal.key === 'earlier_notice_less_all_or_nothing')).toBe(true);
    expect(signals.some(signal => signal.key === 'moves_on_then_returns')).toBe(true);
    expect(signals.some(signal => signal.key === 'easy_let_go_then_back')).toBe(true);
    expect(signals.some(signal => signal.key === 'delayed_processing_when_calm')).toBe(true);
    expect(signals.some(signal => signal.key === 'done_then_affected')).toBe(true);
    expect(signals.some(signal => signal.key === 'forward_closure_lag')).toBe(true);
    expect(signals.some(signal => signal.key === 'revisits_after_left_behind')).toBe(true);
    expect(signals.some(signal => signal.key === 'delayed_not_absent_processing')).toBe(true);
    expect(signals.some(signal => signal.key === 'fine_then_reflective')).toBe(true);
    expect(signals.some(signal => signal.key === 'distance_reveals_importance')).toBe(true);
    expect(signals.some(signal => signal.key === 'earlier_reflection_prevents_return')).toBe(true);
    expect(signals.some(signal => signal.key === 'low_tracking_sudden_standout')).toBe(true);
    expect(signals.some(signal => signal.key === 'simple_until_specific_complicated')).toBe(true);
    expect(signals.some(signal => signal.key === 'change_surprises_connection')).toBe(true);
    expect(signals.some(signal => signal.key === 'unaffected_until_obvious_off')).toBe(true);
    expect(signals.some(signal => signal.key === 'sharp_connection_awareness')).toBe(true);
    expect(signals.some(signal => signal.key === 'rare_relationship_worry_signal')).toBe(true);
    expect(signals.some(signal => signal.key === 'trust_connection_until_broken')).toBe(true);
    expect(signals.some(signal => signal.key === 'direct_shifts_impact')).toBe(true);
    expect(signals.some(signal => signal.key === 'steady_until_disrupted_connection')).toBe(true);
    expect(signals.some(signal => signal.key === 'awareness_without_monitoring')).toBe(true);
    expect(signals.some(signal => signal.key === 'expresses_then_understands_later')).toBe(true);
    expect(signals.some(signal => signal.key === 'talking_process_unclear_first')).toBe(true);
    expect(signals.some(signal => signal.key === 'in_moment_then_refine')).toBe(true);
    expect(signals.some(signal => signal.key === 'expression_before_clarity')).toBe(true);
    expect(signals.some(signal => signal.key === 'speaking_relief_adjust_later')).toBe(true);
    expect(signals.some(signal => signal.key === 'revisits_spoken_after_time')).toBe(true);
    expect(signals.some(signal => signal.key === 'real_time_forming_feelings')).toBe(true);
    expect(signals.some(signal => signal.key === 'not_holding_not_processed')).toBe(true);
    expect(signals.some(signal => signal.key === 'conversation_clarifies_emotion')).toBe(true);
    expect(signals.some(signal => signal.key === 'express_with_refine_space')).toBe(true);
    expect(signals.some(signal => signal.key === 'helps_before_capacity_check')).toBe(true);
    expect(signals.some(signal => signal.key === 'automatic_giving_need')).toBe(true);
    expect(signals.some(signal => signal.key === 'energy_cost_after_commit')).toBe(true);
    expect(signals.some(signal => signal.key === 'yes_before_pause')).toBe(true);
    expect(signals.some(signal => signal.key === 'limits_noticed_after_crossed')).toBe(true);
    expect(signals.some(signal => signal.key === 'natural_help_overwhelming')).toBe(true);
    expect(signals.some(signal => signal.key === 'other_need_before_own')).toBe(true);
    expect(signals.some(signal => signal.key === 'responsible_after_involved')).toBe(true);
    expect(signals.some(signal => signal.key === 'pulling_back_harder')).toBe(true);
    expect(signals.some(signal => signal.key === 'pause_before_giving')).toBe(true);
  });

  it('normalizes pressure-achiever through independent-receiver persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      dailyCheckIns: [{
        date: today,
        mood: 3,
        energy: 3,
        stress: 3,
        tags: ['productive', 'resting'],
      }],
      journals: [{
        date: today,
        text: 'I feel motivated when expectations are clear and the stakes are real. Pressure can sharpen my focus, but it may also make ease feel unproductive. I do my best work when there is a deadline standard or goal to meet. Structure helps me feel safe because it tells me where to put my energy. I feel uncomfortable when there is too much freedom and not enough direction. Achievement may give me momentum, but slowing down can feel like losing ground. I trust myself more when I am performing well. Without pressure, I feel less connected to my drive. I am highly capable under demand, but less practiced at moving from desire instead of obligation. I am learning motivation can come from meaning, not only pressure. My emotions may shift more than people realize because I do not always show the full change outwardly. I feel a lot internally while still functioning in a steady way. Others experience me as consistent even when my inner state is moving quickly. I keep emotional shifts contained until I understand them better. My steadiness may be real, but it does not mean my feelings are simple. I move through several internal states while still looking calm from the outside. Emotional change may happen quietly. I do not want every feeling to become visible just because it is present. I need people to understand that steady is not the same as unaffected. I am letting trusted people know when my inner weather is changing. I pause physically while my mind keeps moving. Rest may happen on the outside before it happens inside. I take breaks but still feel like I never fully recover. My body may be still while my attention keeps scanning planning or replaying. I know how to stop activity, but not always how to let go internally. Quiet time may not feel restful if my mind stays busy. I confuse a break with recovery, even when my system is still working. Rest may need more than stopping; it may need a sense of safety. Downtime does not actually restore me. I need rest that reaches both my body and my mind. I understand something mentally first, then check whether my body agrees. My thoughts often lead, but my body can confirm what is actually true. I make sense of a situation logically before noticing how it feels physically. The body may not be my first signal, but it can become the final one. I believe something is fine until my body quietly says otherwise. My mind may explain quickly, while my body takes longer to respond. I trust a decision more when both my reasoning and my body settle around it. Sensation may arrive later, but it still matters. Logic can be accurate and incomplete at the same time. I am letting my body have a vote, even when my mind is already sure. I accept support more easily when it does not make me feel dependent. Care can feel good, but only when I still feel like myself inside it. I receive help while keeping a quiet sense of control. Being supported may feel safest when my autonomy stays intact. I do not reject care, but I resist feeling managed by it. I appreciate help more when it respects my competence. Support lands better when it feels collaborative not rescuing. I want care that strengthens me rather than takes over. Receiving is possible when it does not shrink my sense of agency. I let care in without needing to prove I am still independent.',
      }],
    }, now);

    expect(signals.some(signal => signal.key === 'clear_expectations_motivation')).toBe(true);
    expect(signals.some(signal => signal.key === 'pressure_sharpens_focus')).toBe(true);
    expect(signals.some(signal => signal.key === 'deadline_standard_best_work')).toBe(true);
    expect(signals.some(signal => signal.key === 'structure_directs_energy')).toBe(true);
    expect(signals.some(signal => signal.key === 'freedom_without_direction_discomfort')).toBe(true);
    expect(signals.some(signal => signal.key === 'achievement_momentum_slowing_loss')).toBe(true);
    expect(signals.some(signal => signal.key === 'self_trust_when_performing')).toBe(true);
    expect(signals.some(signal => signal.key === 'drive_less_without_pressure')).toBe(true);
    expect(signals.some(signal => signal.key === 'demand_capable_obligation')).toBe(true);
    expect(signals.some(signal => signal.key === 'meaning_not_only_pressure')).toBe(true);
    expect(signals.some(signal => signal.key === 'hidden_emotional_variability')).toBe(true);
    expect(signals.some(signal => signal.key === 'internal_feeling_external_function')).toBe(true);
    expect(signals.some(signal => signal.key === 'consistent_outside_quick_inside')).toBe(true);
    expect(signals.some(signal => signal.key === 'contained_until_understood')).toBe(true);
    expect(signals.some(signal => signal.key === 'steady_not_simple')).toBe(true);
    expect(signals.some(signal => signal.key === 'calm_outside_many_states')).toBe(true);
    expect(signals.some(signal => signal.key === 'quiet_emotional_change')).toBe(true);
    expect(signals.some(signal => signal.key === 'feeling_not_visible')).toBe(true);
    expect(signals.some(signal => signal.key === 'steady_not_unaffected_inner')).toBe(true);
    expect(signals.some(signal => signal.key === 'trusted_people_inner_weather')).toBe(true);
    expect(signals.some(signal => signal.key === 'physical_pause_mind_moving')).toBe(true);
    expect(signals.some(signal => signal.key === 'outside_rest_before_inside')).toBe(true);
    expect(signals.some(signal => signal.key === 'break_without_recovery')).toBe(true);
    expect(signals.some(signal => signal.key === 'still_body_scanning_mind')).toBe(true);
    expect(signals.some(signal => signal.key === 'stop_activity_not_let_go')).toBe(true);
    expect(signals.some(signal => signal.key === 'busy_mind_quiet_time')).toBe(true);
    expect(signals.some(signal => signal.key === 'break_confused_with_recovery')).toBe(true);
    expect(signals.some(signal => signal.key === 'rest_needs_safety')).toBe(true);
    expect(signals.some(signal => signal.key === 'downtime_not_restore')).toBe(true);
    expect(signals.some(signal => signal.key === 'body_mind_rest')).toBe(true);
    expect(signals.some(signal => signal.key === 'mental_first_body_agrees')).toBe(true);
    expect(signals.some(signal => signal.key === 'thoughts_lead_body_confirms')).toBe(true);
    expect(signals.some(signal => signal.key === 'logical_before_physical')).toBe(true);
    expect(signals.some(signal => signal.key === 'body_final_signal')).toBe(true);
    expect(signals.some(signal => signal.key === 'fine_until_body_says_otherwise')).toBe(true);
    expect(signals.some(signal => signal.key === 'mind_quick_body_slow')).toBe(true);
    expect(signals.some(signal => signal.key === 'reasoning_and_body_settle')).toBe(true);
    expect(signals.some(signal => signal.key === 'later_sensation_matters')).toBe(true);
    expect(signals.some(signal => signal.key === 'logic_accurate_incomplete')).toBe(true);
    expect(signals.some(signal => signal.key === 'body_vote_when_mind_sure')).toBe(true);
    expect(signals.some(signal => signal.key === 'support_without_dependence')).toBe(true);
    expect(signals.some(signal => signal.key === 'care_with_selfhood')).toBe(true);
    expect(signals.some(signal => signal.key === 'help_with_control')).toBe(true);
    expect(signals.some(signal => signal.key === 'supported_autonomy_intact')).toBe(true);
    expect(signals.some(signal => signal.key === 'resists_managed_care')).toBe(true);
    expect(signals.some(signal => signal.key === 'help_respects_competence')).toBe(true);
    expect(signals.some(signal => signal.key === 'collaborative_not_rescuing')).toBe(true);
    expect(signals.some(signal => signal.key === 'care_strengthens_not_takes_over')).toBe(true);
    expect(signals.some(signal => signal.key === 'receiving_without_agency_loss')).toBe(true);
    expect(signals.some(signal => signal.key === 'care_without_independence_proof')).toBe(true);
  });

  it('normalizes boundary-avoidant through minimal-communicator persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      journals: [{
        date: today,
        text: 'I avoid setting a clear boundary in the moment to keep things comfortable. Saying yes can feel easier than introducing tension. I prioritize keeping things smooth over expressing my limit. The discomfort may come later once I have already agreed to something. I tell myself it is not a big deal even when it quietly is. I delay boundaries until they become harder to ignore. Others experience me as easygoing while I carry more than I intended. I feel more tension internally than I show externally. The boundary may come later after the cost has already built. I am allowing small discomfort early so it does not become larger later. I feel genuinely relaxed in situations where others stay slightly on alert. My body can settle quickly without holding a layer of readiness underneath. I do not anticipate problems until they clearly appear. Calm may feel complete, not partial. I trust situations at face value without scanning for what could shift. I do not prepare for disruption unless there is a clear reason. My ease may be real, but it can leave me less ready for sudden change. I feel grounded without needing to monitor. Others rely on me for my calm presence in tense situations. I am staying open while still noticing early signs when something is shifting. I move on from things quickly, especially when staying would feel heavy. Revisiting the past may not feel helpful even when something is unfinished. I focus on what is next instead of what still lingers. Some feelings may stay unprocessed because moving forward feels easier. I do not feel pulled to return once it is over. I prefer forward motion over reflection. Certain emotions may not fully register because I did not stay with them. I feel relief in closing chapters even if they are not fully understood. I might not realize something mattered more until much later. I am letting some reflection in so things do not stay unacknowledged beneath the surface. I adjust my actions based on how I feel in the moment. My energy may guide my decisions more than a fixed plan. I move with my natural rhythm rather than pushing through it. Consistency may feel harder when my capacity changes day to day. I trust my timing even when it looks unpredictable from the outside. Some days may be very productive while others are more reflective or slow. I resist forcing myself into a pattern that does not match how I feel. I value alignment over routine. Structure may help but only when it allows flexibility. I am building enough consistency to support my rhythm without overriding it. I prefer to keep communication simple and direct without adding extra detail. Once I have said something, I do not feel the need to expand on it. I assume my message is clear enough without further explanation. I do not revisit what I said unless someone asks for more. My words may be efficient, but sometimes leave room for interpretation. I do not feel responsible for how my message is received beyond what I said. I prefer brevity over elaboration. Others may want more context than I naturally provide. I do not feel the need to clarify unless something goes wrong. I know a little more explanation creates more connection.',
      }],
    }, now);

    const expectedSignals = [
      'avoids_clear_boundary_for_comfort',
      'yes_over_tension',
      'smooth_over_limit',
      'delayed_discomfort_after_agreement',
      'minimizes_real_cost',
      'delays_boundaries_until_loud',
      'easygoing_carries_more',
      'internal_tension_external_smooth',
      'boundary_after_cost_builds',
      'small_discomfort_early',
      'genuine_relaxation_in_alert_context',
      'settles_without_readiness',
      'problems_not_anticipated',
      'complete_calm',
      'face_value_trust_no_scanning',
      'prepares_only_with_reason',
      'ease_less_ready_for_change',
      'grounded_without_monitoring',
      'calm_presence_for_others',
      'open_with_early_signs',
      'moves_on_to_avoid_heavy',
      'past_revisiting_unhelpful',
      'next_over_lingering',
      'unprocessed_forward_easier',
      'low_return_after_over',
      'forward_motion_over_reflection',
      'emotions_not_registered',
      'relief_in_closing_ununderstood',
      'later_importance_realization',
      'reflection_prevents_unacknowledged',
      'moment_based_action',
      'energy_guides_decisions',
      'moves_with_rhythm',
      'capacity_changes_consistency_hard',
      'trusts_unpredictable_timing',
      'productive_slow_day_variation',
      'resists_forced_pattern',
      'alignment_over_routine',
      'flexible_structure_need',
      'consistency_supports_rhythm',
      'simple_direct_no_extra_detail',
      'no_need_to_expand',
      'assumes_message_clear',
      'revisit_only_if_asked',
      'efficient_words_interpretation_room',
      'low_responsibility_for_reception',
      'brevity_over_elaboration',
      'others_need_more_context',
      'clarify_only_when_wrong',
      'more_explanation_connection',
    ] as const;

    for (const key of expectedSignals) {
      expect(signals.some(signal => signal.key === key)).toBe(true);
    }
  });

  it('normalizes family-absorbed through pure-symbolic persona language into explicit routing signals', () => {
    const signals = normalizeInsightInputsV2({
      journals: [{
        date: today,
        text: 'My family dynamics pull me in before I realize it is happening. Old roles can still feel current around certain people. I am an adult now but my body can respond like I am back in an older position. Family expectations may feel louder than my own preferences in the moment. I leave family interactions still carrying the emotional residue with me. It is hard to tell what I actually want when the old pattern is active. I feel responsible for keeping the peace even when no one directly asked. My autonomy is real but harder to access around familiar dynamics. Family moments make me feel smaller younger or less separate than I am. The old role can feel familiar without being who I am now. I notice small changes before they become obvious. A slight easing, a small tension, and a tiny shift in energy register quickly. I trust subtle signals even when nothing dramatic has happened. Small moments of relief may matter because they show that something is changing. I notice progress in tiny increments rather than waiting for a big breakthrough. My awareness may catch early signs of settling strain or movement. I feel encouraged by small shifts that others would overlook. Subtle changes may help me understand myself before things become intense. I do not need something to be dramatic to feel meaningful. I let small signals guide me without reading too much into every tiny change. I create for expression first before I know what it is for. The feeling behind something may matter more than whether it is practical. I follow an idea because it feels alive, not because it has a clear use yet. Creativity may help me say things that ordinary language cannot fully hold. I feel most connected to my work when it carries emotion beauty or personal meaning. A piece does not have to be useful to be worth making. I value the process as much as the finished result. My ideas may begin as mood image sound color or feeling before they become structured. I lose energy when creativity becomes only about function. I am giving expression room while choosing which ideas to bring all the way into form. I feel internal conflict quickly when something does not match my values. Compromise can feel costly when it touches something that matters deeply. I struggle with good enough if it feels dishonest or misaligned. My body may resist choices that look practical but feel wrong. I need actions to match my conscience before I can feel settled. Small misalignments may bother me more than others expect. I prefer a harder honest path over an easier one that costs my integrity. Flexibility may be difficult when the principle underneath feels important. I may not be able to move on until something feels named truthfully. I am protecting my integrity without requiring every situation to meet a perfect standard. I understand myself through images, dreams patterns and symbols before direct explanation. Meaning may come through feeling or metaphor before it becomes practical. I notice repeated symbols and feel they are pointing toward something. A dream image song color or phrase may stay with me because it carries emotional truth. I do not need something to be literal to feel real. Symbolic meaning may help me access things that direct language misses. I trust intuition before I can explain why something matters. My inner world may speak in patterns rather than conclusions. I feel connected to meaning when it arrives indirectly. I let symbolism guide me while still checking how it connects to my waking life.',
      }],
    }, now);

    const expectedSignals = [
      'family_dynamics_pull_in',
      'old_roles_feel_current',
      'adult_body_old_position',
      'family_expectations_louder',
      'family_residue_carried',
      'old_pattern_wants_unclear',
      'peacekeeping_responsibility',
      'autonomy_harder_in_family',
      'smaller_younger_less_separate',
      'old_role_not_current_self',
      'small_changes_early',
      'slight_easing_tension_energy',
      'trusts_subtle_signals',
      'small_relief_signals_change',
      'tiny_increment_progress',
      'early_signs_settling_strain',
      'encouraged_by_small_shifts',
      'subtle_changes_self_understanding',
      'meaningful_without_drama',
      'small_signals_without_overreading',
      'expression_first_creating',
      'feeling_over_practicality',
      'alive_idea_without_use',
      'creativity_beyond_language',
      'emotion_beauty_personal_meaning',
      'useful_not_required',
      'process_as_result',
      'mood_image_sound_start',
      'function_only_drains',
      'expression_to_form_choice',
      'quick_values_conflict',
      'compromise_deep_cost',
      'good_enough_misaligned',
      'practical_but_wrong_body_resist',
      'conscience_settling',
      'small_misalignment_bothers',
      'harder_honest_path',
      'principle_limits_flexibility',
      'truth_named_before_move_on',
      'integrity_without_perfection',
      'symbolic_self_understanding',
      'metaphor_before_practical',
      'repeated_symbols_pointing',
      'emotional_truth_symbol',
      'nonliteral_feels_real',
      'symbolism_accesses_unsaid',
      'intuition_before_explanation',
      'inner_world_patterns',
      'indirect_meaning_connection',
      'symbolism_waking_life_check',
    ] as const;

    for (const key of expectedSignals) {
      expect(signals.some(signal => signal.key === key)).toBe(true);
    }
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

  it('keeps dream-symbol material out of Today insights because dreams use the separate dream engine', async () => {
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
    expect(insight).toBeUndefined();
    expect(result.insights.some(item => item.category === 'dreamsSymbols')).toBe(false);
    expect(result.patternScores.some(score => score.category === 'dreamsSymbols')).toBe(false);
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
