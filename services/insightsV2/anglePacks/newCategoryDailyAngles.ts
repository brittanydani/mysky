import type { DailyAngle } from '../types';

export const NEW_CATEGORY_DAILY_ANGLES: DailyAngle[] = [
  // responsibilityCare
  {
    key: 'responsibilityCare_emergingLoad',
    patternKey: 'responsibilityCare_invisibleLoad',
    title: 'The Load Is Starting to Show',
    triggerSignals: ['mental_load', 'responsibility_weight', 'invisible_labor'],
    avoidIfSignals: ['easy_rest', 'rest_without_guilt'],
    observation: 'Responsibility is showing up as more than a task list.',
    pattern:
      'You may be tracking what needs care even when you are not actively doing anything. That kind of load can be easy to miss because it often happens in the background.',
    reframe:
      'This is not just being organized. It may be invisible labor becoming visible enough to name.',
    question: 'What are you carrying mentally that no one else can see?',
    tone: 'clear',
    cooldownDays: 10,
  },
  {
    key: 'responsibilityCare_repeatingOverfunctioning',
    patternKey: 'responsibilityCare_overfunctioningLoop',
    title: 'You Step In Before You Check Capacity',
    triggerSignals: ['overfunctioning', 'caretaking_pressure', 'capacity_strain'],
    avoidIfSignals: ['care_with_boundaries', 'shared_responsibility'],
    observation: 'Your entries suggest a repeated pull toward stepping in.',
    pattern:
      'When something feels like it needs care, you may respond before checking whether you actually have room. The care is real, but the timing may be costing you.',
    reframe:
      'The signal is not that you care too much. It is that your care may need a pause before it becomes responsibility.',
    question: 'Where would a pause protect your care instead of weakening it?',
    tone: 'deep',
    cooldownDays: 14,
  },
  {
    key: 'responsibilityCare_mixedCareBoundary',
    patternKey: 'responsibilityCare_careWithLimits',
    title: 'Care and Limits Are Both Present',
    triggerSignals: [
      'careful_about_taken_on',
      'limits_protect_care',
      'support_without_guilt',
    ],
    observation: 'There is a more bounded form of care showing up.',
    pattern:
      'You may still care deeply, but you are not automatically turning every need into your job. That is an important difference.',
    reframe:
      'This looks like care becoming more sustainable, not less real.',
    question: 'What kind of care feels possible without self-abandoning?',
    tone: 'grounding',
    cooldownDays: 14,
  },

  // workAmbition
  {
    key: 'workAmbition_emergingPressure',
    patternKey: 'workAmbition_pressureAsSafety',
    title: 'Progress Feels Like Safety',
    triggerSignals: ['excellence_pressure', 'high_standards', 'wants_to_build'],
    avoidIfSignals: ['low_pressure_motivation', 'ease_over_achievement'],
    observation: 'Progress may be carrying more emotional weight than usual.',
    pattern:
      'Getting things done may help you feel steady, but it can also make rest feel uncomfortable when nothing visible is moving.',
    reframe:
      'The pressure may not be about ambition alone. It may be about wanting proof that things are okay.',
    question:
      'What would still count as progress if nothing visible got finished today?',
    tone: 'clear',
    cooldownDays: 10,
  },
  {
    key: 'workAmbition_repeatingStandards',
    patternKey: 'workAmbition_movingFinishLine',
    title: 'The Finish Line Keeps Moving',
    triggerSignals: ['high_standards', 'excellence_pressure', 'creative_standards'],
    avoidIfSignals: ['good_enough_acceptance'],
    observation: 'High standards are showing up as a repeating pattern.',
    pattern:
      'What once felt like enough may start becoming the new minimum. That can make your work stronger, but it can also make satisfaction hard to reach.',
    reframe:
      'This is not a lack of gratitude. It may be a standard that keeps rising faster than your capacity.',
    question: 'Where has “better” quietly replaced “enough”?',
    tone: 'deep',
    cooldownDays: 14,
  },
  {
    key: 'workAmbition_mixedBurnout',
    patternKey: 'workAmbition_burnoutSignals',
    title: 'Capability May Be Hiding Strain',
    triggerSignals: ['burnout_risk', 'overextension', 'depletion'],
    avoidIfSignals: ['high_energy', 'restorative_moment'],
    observation:
      'Your capacity may be lower than your functioning makes it look.',
    pattern:
      'You may still be getting things done, but the cost is starting to show through tiredness, heaviness, or less room for joy.',
    reframe:
      'Being capable under pressure does not mean pressure is harmless.',
    question: 'What would you notice if you measured strain, not just output?',
    tone: 'direct',
    cooldownDays: 14,
  },

  // griefTransitions
  {
    key: 'griefTransitions_emergingEnding',
    patternKey: 'griefTransitions_logicalOverEmotional',
    title: 'The Ending Has Not Fully Landed',
    triggerSignals: ['chapter_shift', 'old_story_loosening', 'sadness'],
    avoidIfSignals: ['clean_closure', 'quick_recovery'],
    observation: 'Something may be ending faster logically than emotionally.',
    pattern:
      'You may know something has changed, but your emotional world is still catching up. That gap can make the present feel strange or unfinished.',
    reframe:
      'This is not being stuck. It may be the slower part of you adjusting to a real shift.',
    question: 'What part of this change has not fully landed yet?',
    tone: 'soft',
    cooldownDays: 14,
  },
  {
    key: 'griefTransitions_repeatingWaves',
    patternKey: 'griefTransitions_griefReturns',
    title: 'Grief Is Returning in Waves',
    triggerSignals: ['gratitude_and_grief', 'longing', 'dream_loss'],
    avoidIfSignals: ['relief_after_ending'],
    observation: 'Loss or transition is showing up more than once.',
    pattern:
      'The feeling may come and go rather than stay constant. That does not make it random; it may mean different parts of the change are becoming real at different times.',
    reframe: 'Grief does not always move in a straight line.',
    question: 'What keeps returning because it still mattered?',
    tone: 'deep',
    cooldownDays: 21,
  },
  {
    key: 'griefTransitions_mixedReliefLoss',
    patternKey: 'griefTransitions_reliefAndGrief',
    title: 'Relief and Grief Can Both Be True',
    triggerSignals: ['gratitude_and_grief', 'relief', 'mixed_emotions'],
    observation: 'This transition may carry more than one emotional truth.',
    pattern:
      'You may feel lighter in one way and sad in another. Relief does not erase loss, and grief does not cancel relief.',
    reframe: 'Mixed emotion may be the most honest read here.',
    question: 'What are you relieved by, and what are you still grieving?',
    tone: 'grounding',
    cooldownDays: 21,
  },

  // timeRhythms
  {
    key: 'timeRhythms_emergingEnergyWindow',
    patternKey: 'timeRhythms_energyWindows',
    title: 'Timing Is Affecting Capacity',
    triggerSignals: ['high_energy', 'low_energy', 'capacity_strain'],
    observation: 'Your capacity appears to shift with timing.',
    pattern:
      'The same task may feel different depending on when it lands. This may be less about discipline and more about energy windows.',
    reframe: 'Timing is data, not an excuse.',
    question: 'When does your day naturally give you more room?',
    tone: 'clear',
    cooldownDays: 10,
  },
  {
    key: 'timeRhythms_repeatingLowCapacity',
    patternKey: 'timeRhythms_lowCapacityPatterns',
    title: 'Low-Capacity Moments Have a Pattern',
    triggerSignals: ['low_capacity', 'low_energy', 'poor_sleep_quality'],
    avoidIfSignals: ['high_energy'],
    observation: 'Low-capacity states are repeating enough to notice.',
    pattern:
      'You may be judging yourself in moments that are actually predictable. Sleep, stress, timing, and accumulated load may be shaping what feels possible.',
    reframe:
      'This may need rhythm-aware planning, not more self-criticism.',
    question: 'What keeps landing in your lowest-capacity window?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'timeRhythms_mixedPushingTiming',
    patternKey: 'timeRhythms_rhythmAwarePushing',
    title: 'You Know the Rhythm, Then Override It',
    triggerSignals: [
      'knows_rhythm_overrides',
      'pushes_low_capacity',
      'same_capacity_expectation',
    ],
    avoidIfSignals: ['moves_with_rhythm'],
    observation:
      'There may be a gap between knowing your rhythm and following it.',
    pattern:
      'You may recognize when something would be easier later, but pressure can still make now feel necessary.',
    reframe:
      'The issue may not be awareness. It may be permission to trust the awareness.',
    question: 'Where are you overriding timing that you already understand?',
    tone: 'deep',
    cooldownDays: 14,
  },

  // selfWorthReceiving
  {
    key: 'selfWorthReceiving_emergingNeed',
    patternKey: 'selfWorthReceiving_minimizedNeed',
    title: 'Your Needs Are Quiet, Not Absent',
    triggerSignals: ['minimizes_need', 'support_need', 'fear_of_being_too_much'],
    avoidIfSignals: ['open_receiving'],
    observation:
      'Your needs may be present but softened before they are expressed.',
    pattern:
      'You may make your needs easier to carry by making them smaller. That can protect you from feeling exposed, but it can also keep support from reaching the real place.',
    reframe: 'A quiet need is still a need.',
    question:
      'What need are you making more acceptable by making it smaller?',
    tone: 'soft',
    cooldownDays: 14,
  },
  {
    key: 'selfWorthReceiving_repeatingEarnedCare',
    patternKey: 'selfWorthReceiving_earnedCare',
    title: 'Care Feels Easier When It Is Earned',
    triggerSignals: [
      'receiving_care_difficulty',
      'kindness_usefulness_pressure',
      'indebted_receiving_discomfort',
    ],
    avoidIfSignals: ['receiving_without_agency_loss'],
    observation:
      'Receiving support may be connected to whether you feel you earned it.',
    pattern:
      'You may be able to accept care more easily when you can point to a reason you deserve it. Freely given care may feel more vulnerable.',
    reframe:
      'This is not ingratitude. It may be your system learning how to receive without proving.',
    question: 'What kind of care is hardest to let in without repaying it?',
    tone: 'deep',
    cooldownDays: 21,
  },
  {
    key: 'selfWorthReceiving_mixedReceiving',
    patternKey: 'selfWorthReceiving_receivesButBalances',
    title: 'You Let Care In, Then Try to Balance It',
    triggerSignals: [
      'receives_then_returns',
      'care_evenness_question',
      'support_trusted_when_reciprocal',
    ],
    observation: 'Support may reach you, but reciprocity still matters.',
    pattern:
      'You may not reject care, but part of you may want to give something back quickly so the relationship feels even.',
    reframe:
      'Receiving is happening. The growth edge may be letting care stay before turning it into something owed.',
    question:
      'What happens if you let support remain a gift for a little longer?',
    tone: 'grounding',
    cooldownDays: 21,
  },

  // communicationVoice
  {
    key: 'communicationVoice_emergingCarefulWords',
    patternKey: 'communicationVoice_carefulWords',
    title: 'Your Words Are Carrying Extra Care',
    triggerSignals: ['need_for_exact_words', 'overexplaining', 'tone_sensitivity'],
    avoidIfSignals: ['plain_direct_speech'],
    observation:
      'How you say something may matter as much as what you say.',
    pattern:
      'You may choose your words carefully because being misunderstood has a cost. The more something matters, the more precision you may reach for.',
    reframe: 'This may be care for accuracy, not just overthinking.',
    question: 'Where are you trying to be understood exactly?',
    tone: 'clear',
    cooldownDays: 10,
  },
  {
    key: 'communicationVoice_repeatingRepairNeed',
    patternKey: 'communicationVoice_repairSettles',
    title: 'Repair Matters More Than Moving On',
    triggerSignals: ['repair_need', 'rupture_sensitivity', 'wants_to_be_seen'],
    avoidIfSignals: ['low_conversation_replay'],
    observation: 'Repair appears to matter for your system to settle.',
    pattern:
      'It may not be enough for a conversation to be technically over. If the meaning was missed, your body may still feel the rupture.',
    reframe:
      'Wanting repair is not the same as wanting conflict. It may be how clarity becomes safety.',
    question:
      'What kind of repair actually helps your body believe the rupture is over?',
    tone: 'deep',
    cooldownDays: 14,
  },
  {
    key: 'communicationVoice_mixedDirectExplain',
    patternKey: 'communicationVoice_directOverexplainer',
    title: 'You Say It Clearly, Then Keep Clarifying',
    triggerSignals: ['plain_direct_speech', 'overexplaining', 'need_for_exact_words'],
    observation: 'Directness and extra explanation may both be present.',
    pattern:
      'You may know what you mean and still add layers when it matters. The extra words may be less about uncertainty and more about wanting it to land correctly.',
    reframe:
      'Clarity may already be there. The question is whether you trust it to be received.',
    question: 'Where might your first clear version already be enough?',
    tone: 'grounding',
    cooldownDays: 14,
  },

  // spiritualMeaning
  {
    key: 'spiritualMeaning_emergingMeaning',
    patternKey: 'spiritual_meaning_001_faith_meaning',
    title: 'You Are Looking for Meaning',
    triggerSignals: ['faith_meaning', 'meaning_making', 'ordinary_sacred'],
    observation: 'Meaning is showing up as part of how you process.',
    pattern:
      'You may not only be asking what happened. You may be asking why it mattered, what it touched, or how it fits into something larger.',
    reframe:
      'Meaning can be grounding when it stays connected to what is real.',
    question:
      'What feels meaningful here without needing to explain everything?',
    tone: 'deep',
    cooldownDays: 14,
  },
  {
    key: 'spiritualMeaning_repeatingPurpose',
    patternKey: 'spiritual_meaning_003_purpose_as_compass',
    title: 'Purpose Keeps Returning',
    triggerSignals: ['purpose_signal', 'legacy_signal', 'future_self_orientation'],
    observation: 'Purpose or direction is appearing repeatedly.',
    pattern:
      'You may be noticing a recurring pull toward what your life is meant to hold, build, or protect.',
    reframe:
      'This does not have to become a final answer today. It may be a signal worth listening to over time.',
    question: 'What keeps mattering even when other things shift?',
    tone: 'deep',
    cooldownDays: 21,
  },
  {
    key: 'spiritualMeaning_mixedPracticalMeaning',
    patternKey: 'spiritual_meaning_001_faith_meaning',
    title: 'Meaning Needs a Next Step',
    triggerSignals: [
      'meaning_with_practical_action',
      'why_and_next_step',
      'reflection_and_realism',
    ],
    avoidIfSignals: ['meaning_replaces_change'],
    observation: 'Meaning and practical action may both be needed.',
    pattern:
      'You may want the deeper meaning, but not if it floats away from real life. The insight matters most when it helps you live more clearly.',
    reframe: 'Meaning does not have to replace action. It can guide it.',
    question:
      'What practical next step would honor the meaning you are noticing?',
    tone: 'clear',
    cooldownDays: 21,
  },

  // safetyRegulation
  {
    key: 'safetyRegulation_emergingBracing',
    patternKey: 'safety_regulation_001_calm_bracing',
    title: 'Your Body May Be Bracing Quietly',
    triggerSignals: ['calm_bracing', 'preparedness', 'always_on'],
    avoidIfSignals: ['easy_settling', 'settles_without_readiness'],
    observation: 'Preparedness is showing up as a body-level pattern.',
    pattern:
      'You may look calm or functional while part of you remains ready for something to shift.',
    reframe:
      'This is not overreacting. It may be your body staying prepared before it knows it can soften.',
    question: 'Where are you managing well but not actually relaxed?',
    tone: 'soft',
    cooldownDays: 10,
  },
  {
    key: 'safetyRegulation_repeatingCalmUnfamiliar',
    patternKey: 'safety_regulation_003_numbness_or_calm',
    title: 'Calm May Still Feel Unfamiliar',
    triggerSignals: ['calm_is_new', 'numbness_vs_calm', 'quiet_safety'],
    observation: 'Safety may be present, but not fully trusted yet.',
    pattern:
      'When things get quiet, part of you may still check whether something is missing. Calm can take time to feel believable.',
    reframe:
      'The goal is not forcing calm. It is letting repeated safety become more recognizable.',
    question: 'What helps calm feel real instead of suspicious?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'safetyRegulation_mixedSettledButTracking',
    patternKey: 'safety_regulation_001_calm_bracing',
    title: 'Settled and Still Tracking',
    triggerSignals: [
      'outward_settled_under_ready',
      'composed_still_tracking',
      'quiet_readiness',
    ],
    avoidIfSignals: ['complete_calm'],
    observation:
      'You may be settled on the outside while still tracking underneath.',
    pattern:
      'The calm may be real, but not complete. Some part of you may still be monitoring for what could change.',
    reframe: 'This is a layered state, not a contradiction.',
    question: 'What would let the deeper layer soften too?',
    tone: 'deep',
    cooldownDays: 14,
  },

  // lifeDirection
  {
    key: 'lifeDirection_emergingPull',
    patternKey: 'life_direction_001_future_self',
    title: 'A Quiet Pull Is Showing Up',
    triggerSignals: ['future_self_orientation', 'growth_edge', 'purpose_signal'],
    observation:
      'There may be a direction forming before the full plan is clear.',
    pattern:
      'You may feel that something wants to shift, even if you cannot fully name what it is yet.',
    reframe:
      'Direction does not always arrive as certainty. Sometimes it starts as attention that keeps returning.',
    question: 'What keeps pulling your attention back?',
    tone: 'deep',
    cooldownDays: 14,
  },
  {
    key: 'lifeDirection_repeatingDecisionWeight',
    patternKey: 'life_direction_002_decision_fog',
    title: 'This Decision Carries Identity Weight',
    triggerSignals: ['decision_uncertainty', 'identity_rewriting', 'values_conflict'],
    observation:
      'A decision may feel bigger because it touches who you are becoming.',
    pattern:
      'This may not feel like choosing between options. It may feel like choosing a version of your life.',
    reframe:
      'The heaviness makes sense when the choice carries identity, values, or future-self meaning.',
    question: 'What version of you is this decision asking you to trust?',
    tone: 'deep',
    cooldownDays: 21,
  },
  {
    key: 'lifeDirection_mixedStabilityGrowth',
    patternKey: 'life_direction_003_life_reorientation',
    title: 'Stability and Growth Are Both Asking for Space',
    triggerSignals: [
      'future_self_orientation',
      'chapter_shift',
      'self_trust_growth',
    ],
    observation:
      'You may be holding both the need for steadiness and the desire to grow.',
    pattern:
      'One part of you may want security, while another part wants movement. Neither one is wrong.',
    reframe:
      'The work may be finding a step that honors growth without abandoning stability.',
    question:
      'What is one move forward that does not overwhelm your need for steadiness?',
    tone: 'grounding',
    cooldownDays: 21,
  },

  // pleasurePlay
  {
    key: 'pleasurePlay_emergingPlayStarved',
    patternKey: 'pleasure_play_001_play_starved',
    title: 'Joy May Be Getting Crowded Out',
    triggerSignals: ['play_starved', 'pleasure_secondary', 'enjoyment_minimized'],
    avoidIfSignals: ['joy_tolerance', 'play_glimmer'],
    observation: 'Pleasure may be available but not getting much room.',
    pattern:
      'You may move past enjoyable moments quickly because something else feels more important.',
    reframe:
      'Joy is not a distraction from your life. It may be part of how your system recovers access to aliveness.',
    question: 'What small enjoyable thing keeps getting postponed?',
    tone: 'soft',
    cooldownDays: 10,
  },
  {
    key: 'pleasurePlay_repeatingEarnedPleasure',
    patternKey: 'pleasure_play_002_joy_tolerance',
    title: 'Pleasure Feels Easier After Completion',
    triggerSignals: [
      'pleasure_after_completion',
      'earned_pleasure_relaxation',
      'responsibilities_during_pleasure',
    ],
    avoidIfSignals: ['pleasure_without_productivity'],
    observation:
      'Enjoyment may be tied to whether enough has been done first.',
    pattern:
      'You may let yourself enjoy things more easily once something important is finished. But if the finish line keeps moving, pleasure keeps waiting.',
    reframe: 'Enjoyment does not have to be only a reward.',
    question:
      'What would it feel like to let something good happen before everything is complete?',
    tone: 'grounding',
    cooldownDays: 14,
  },
  {
    key: 'pleasurePlay_mixedAliveness',
    patternKey: 'pleasure_play_003_beauty_as_aliveness',
    title: 'Your Aliveness Has Clues',
    triggerSignals: ['body_aliveness_cues', 'creative_aliveness', 'play_glimmer'],
    observation: 'Certain moments may bring more life back into your body.',
    pattern:
      'Music, color, movement, humor, touch, beauty, or curiosity may shift your state before your mind has to explain why.',
    reframe:
      'This is useful data. Pleasure can show what restores you, not just what entertains you.',
    question: 'What reliably makes you feel more alive?',
    tone: 'encouraging',
    cooldownDays: 14,
  },
];
