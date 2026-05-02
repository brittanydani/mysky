import {
  RESPONSIBILITY_CARE_EXPANSION,
  RESPONSIBILITY_CARE_PATTERNS,
} from '../patternPacks/responsibilityCarePatterns';
import {
  WORK_AMBITION_EXPANSION,
  WORK_AMBITION_PATTERNS,
} from '../patternPacks/workAmbitionPatterns';
import {
  GRIEF_TRANSITIONS_EXPANSION,
  GRIEF_TRANSITIONS_PATTERNS,
} from '../patternPacks/griefTransitionsPatterns';
import {
  TIME_RHYTHMS_EXPANSION,
  TIME_RHYTHMS_PATTERNS,
} from '../patternPacks/timeRhythmsPatterns';
import {
  SELF_WORTH_RECEIVING_EXPANSION,
  SELF_WORTH_RECEIVING_PATTERNS,
} from '../patternPacks/selfWorthReceivingPatterns';
import {
  COMMUNICATION_VOICE_EXPANSION,
  COMMUNICATION_VOICE_PATTERNS,
} from '../patternPacks/communicationVoicePatterns';
import {
  SPIRITUAL_MEANING_EXPANSION,
  SPIRITUAL_MEANING_PATTERNS,
} from '../patternPacks/spiritualMeaningPatterns';
import {
  SAFETY_REGULATION_EXPANSION,
  SAFETY_REGULATION_PATTERNS,
} from '../patternPacks/safetyRegulationPatterns';
import {
  LIFE_DIRECTION_EXPANSION,
  LIFE_DIRECTION_PATTERNS,
} from '../patternPacks/lifeDirectionPatterns';
import {
  PLEASURE_PLAY_EXPANSION,
  PLEASURE_PLAY_PATTERNS,
} from '../patternPacks/pleasurePlayPatterns';

describe('new category archive patterns', () => {
  it('expands responsibility care to the full 20-pattern category', () => {
    const keys = RESPONSIBILITY_CARE_PATTERNS.map((pattern) => pattern.key);

    expect(RESPONSIBILITY_CARE_EXPANSION).toHaveLength(17);
    expect(RESPONSIBILITY_CARE_PATTERNS).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves supplied responsibility care copy', () => {
    expect(RESPONSIBILITY_CARE_EXPANSION[0]).toMatchObject({
      key: 'responsibilityCare_invisibleLoad',
      title: 'Invisible Load',
      description:
        'Mental and emotional responsibility is showing up even when there is not a visible task attached to it.',
      shameLabel: 'I should be able to handle this.',
      clarityReframe:
        'This may not be about weakness. It may be the cost of carrying things that are hard for others to see.',
    });
    expect(RESPONSIBILITY_CARE_EXPANSION[16]).toMatchObject({
      key: 'responsibilityCare_involvementIntensity',
      title: 'Intense Once Involved',
      shameLabel: 'If I am involved, I have to give all of myself.',
      clarityReframe:
        'Involvement does not have to mean total absorption.',
    });
  });

  it('does not use the same signal as matching and conflicting evidence', () => {
    [
      ...RESPONSIBILITY_CARE_EXPANSION,
      ...WORK_AMBITION_EXPANSION,
      ...GRIEF_TRANSITIONS_EXPANSION,
      ...TIME_RHYTHMS_EXPANSION,
      ...SELF_WORTH_RECEIVING_EXPANSION,
      ...COMMUNICATION_VOICE_EXPANSION,
      ...SPIRITUAL_MEANING_EXPANSION,
      ...SAFETY_REGULATION_EXPANSION,
      ...LIFE_DIRECTION_EXPANSION,
      ...PLEASURE_PLAY_EXPANSION,
    ].forEach((pattern) => {
      const matchingSignals = new Set([
        ...pattern.requiredSignals,
        ...pattern.supportingSignals,
      ]);

      pattern.conflictingSignals?.forEach((signal) => {
        expect(matchingSignals.has(signal)).toBe(false);
      });
    });
  });

  it('expands work ambition to the full 20-pattern category', () => {
    const keys = WORK_AMBITION_PATTERNS.map((pattern) => pattern.key);

    expect(WORK_AMBITION_EXPANSION).toHaveLength(17);
    expect(WORK_AMBITION_PATTERNS).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves supplied work ambition copy', () => {
    expect(WORK_AMBITION_EXPANSION[0]).toMatchObject({
      key: 'workAmbition_pressureAsSafety',
      title: 'Progress Feels Like Safety',
      description:
        'Progress and output are functioning as emotional anchors, not just productivity markers.',
      shameLabel: 'If I am not making progress, I am falling behind.',
      clarityReframe:
        'Progress may help you feel safe, but safety cannot depend only on constant output.',
    });
    expect(WORK_AMBITION_EXPANSION[16]).toMatchObject({
      key: 'workAmbition_capacityVsStandards',
      title: 'Capacity and Standards Are Out of Sync',
      shameLabel: 'I should be able to meet the standard anyway.',
      clarityReframe:
        'The standard may be real, but so is capacity. Ignoring either one distorts the picture.',
    });
  });

  it('expands grief transitions to the full 20-pattern category', () => {
    const keys = GRIEF_TRANSITIONS_PATTERNS.map((pattern) => pattern.key);

    expect(GRIEF_TRANSITIONS_EXPANSION).toHaveLength(17);
    expect(GRIEF_TRANSITIONS_PATTERNS).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves supplied grief transitions copy', () => {
    expect(GRIEF_TRANSITIONS_EXPANSION[0]).toMatchObject({
      key: 'griefTransitions_logicalOverEmotional',
      title: 'Over Logically, Not Emotionally',
      description:
        'Something has ended or shifted, but the emotional impact is still catching up.',
      shameLabel: 'I should be over this by now.',
      clarityReframe:
        'Knowing something is over does not mean your emotional world has finished adjusting.',
    });
    expect(GRIEF_TRANSITIONS_EXPANSION[16]).toMatchObject({
      key: 'griefTransitions_oldAndNewBothTrue',
      title: 'Old and New Both Feel True',
      shameLabel:
        'I need to choose whether I am moving on or holding on.',
      clarityReframe:
        'You may be doing both: honoring what was while slowly making room for what is next.',
    });
  });

  it('expands time rhythms to the full 20-pattern category', () => {
    const keys = TIME_RHYTHMS_PATTERNS.map((pattern) => pattern.key);

    expect(TIME_RHYTHMS_EXPANSION).toHaveLength(17);
    expect(TIME_RHYTHMS_PATTERNS).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves supplied time rhythms copy', () => {
    expect(TIME_RHYTHMS_EXPANSION[0]).toMatchObject({
      key: 'timeRhythms_energyWindows',
      title: 'Energy Windows',
      description:
        'Capacity changes depending on timing, even when the task itself stays the same.',
      shameLabel: 'I should have the same capacity all day.',
      clarityReframe:
        'Your capacity may have a rhythm. Working with it can be more effective than judging the shifts.',
    });
    expect(TIME_RHYTHMS_EXPANSION[16]).toMatchObject({
      key: 'timeRhythms_timingAsData',
      title: 'Timing Is Data',
      shameLabel: 'Timing should not matter this much.',
      clarityReframe:
        'Timing is part of the pattern. It can show you when your system has more or less room.',
    });
  });

  it('expands self worth receiving to the full 20-pattern category', () => {
    const keys = SELF_WORTH_RECEIVING_PATTERNS.map((pattern) => pattern.key);

    expect(SELF_WORTH_RECEIVING_EXPANSION).toHaveLength(17);
    expect(SELF_WORTH_RECEIVING_PATTERNS).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves supplied self worth receiving copy', () => {
    expect(SELF_WORTH_RECEIVING_EXPANSION[0]).toMatchObject({
      key: 'selfWorthReceiving_minimizedNeed',
      title: 'Needs Made Smaller',
      description:
        'Needs are present, but they are being minimized before they are expressed.',
      shameLabel: 'My needs are too much.',
      clarityReframe:
        'Making a need smaller can feel safer, but it can also keep support from reaching the real place.',
    });
    expect(SELF_WORTH_RECEIVING_EXPANSION[16]).toMatchObject({
      key: 'selfWorthReceiving_innerCriticSoftening',
      title: 'The Inner Critic Is Softening',
      shameLabel: 'I have to be hard on myself to improve.',
      clarityReframe:
        'Softening toward yourself does not erase accountability. It may make growth more honest and less punishing.',
    });
  });

  it('expands communication voice to the full 20-pattern category', () => {
    const keys = COMMUNICATION_VOICE_PATTERNS.map((pattern) => pattern.key);

    expect(COMMUNICATION_VOICE_EXPANSION).toHaveLength(17);
    expect(COMMUNICATION_VOICE_PATTERNS).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves supplied communication voice copy', () => {
    expect(COMMUNICATION_VOICE_EXPANSION[0]).toMatchObject({
      key: 'communicationVoice_carefulWords',
      title: 'Careful Words',
      description:
        'The user is choosing words carefully because being misunderstood has emotional weight.',
      shameLabel: 'I am making this too complicated.',
      clarityReframe:
        'Careful wording may be your way of protecting meaning from being misunderstood.',
    });
    expect(COMMUNICATION_VOICE_EXPANSION[16]).toMatchObject({
      key: 'communicationVoice_voiceWithCare',
      title: 'Voice With Care',
      shameLabel: 'Honesty has to be harsh to be real.',
      clarityReframe:
        'Your voice can be clear without becoming cruel. Care and honesty can belong in the same sentence.',
    });
  });

  it('expands spiritual meaning to the full 20-pattern category', () => {
    const keys = SPIRITUAL_MEANING_PATTERNS.map((pattern) => pattern.key);

    expect(SPIRITUAL_MEANING_EXPANSION).toHaveLength(17);
    expect(SPIRITUAL_MEANING_PATTERNS).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves supplied spiritual meaning copy', () => {
    expect(SPIRITUAL_MEANING_EXPANSION[0]).toMatchObject({
      key: 'spiritualMeaning_meaningMaking',
      title: 'Looking for Meaning',
      description:
        'The user is trying to understand the deeper meaning or significance of what happened.',
      shameLabel: 'I should not need this to mean something.',
      clarityReframe:
        'Looking for meaning may be part of how you stay connected to what matters, not a failure to accept reality.',
    });
    expect(SPIRITUAL_MEANING_EXPANSION[16]).toMatchObject({
      key: 'spiritualMeaning_meaningWithoutCertainty',
      title: 'Meaning Without Certainty',
      shameLabel: 'If I cannot explain it, it does not count.',
      clarityReframe: 'Meaning can be real before it is fully clear.',
    });
  });

  it('expands safety regulation to the full 20-pattern category', () => {
    const keys = SAFETY_REGULATION_PATTERNS.map((pattern) => pattern.key);

    expect(SAFETY_REGULATION_EXPANSION).toHaveLength(17);
    expect(SAFETY_REGULATION_PATTERNS).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves supplied safety regulation copy', () => {
    expect(SAFETY_REGULATION_EXPANSION[0]).toMatchObject({
      key: 'safetyRegulation_subtleBracing',
      title: 'Subtle Bracing',
      description:
        'The user appears calm or functional while the body remains slightly prepared underneath.',
      shameLabel: 'If I look calm, I should feel calm.',
      clarityReframe:
        'Looking composed and feeling fully safe are not always the same thing.',
    });
    expect(SAFETY_REGULATION_EXPANSION[16]).toMatchObject({
      key: 'safetyRegulation_trappedActivation',
      title: 'Trapped Activation',
      shameLabel: 'I should be able to just deal with it.',
      clarityReframe:
        'Feeling trapped can make your system search for agency. Even one real choice can matter.',
    });
  });

  it('expands life direction to the full 20-pattern category', () => {
    const keys = LIFE_DIRECTION_PATTERNS.map((pattern) => pattern.key);

    expect(LIFE_DIRECTION_EXPANSION).toHaveLength(17);
    expect(LIFE_DIRECTION_PATTERNS).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves supplied life direction copy', () => {
    expect(LIFE_DIRECTION_EXPANSION[0]).toMatchObject({
      key: 'lifeDirection_quietPull',
      title: 'A Quiet Pull',
      description:
        'A direction or change is beginning to form before the full plan is clear.',
      shameLabel: 'I should already know where this is going.',
      clarityReframe:
        'Direction does not always arrive as certainty. Sometimes it starts as a pull that keeps returning.',
    });
    expect(LIFE_DIRECTION_EXPANSION[16]).toMatchObject({
      key: 'lifeDirection_selfTrustThroughChange',
      title: 'Self-Trust Through Change',
      shameLabel: 'I need the whole plan before I can trust myself.',
      clarityReframe:
        'Self-trust does not require knowing everything. It may mean staying connected to yourself as the next part becomes clear.',
    });
  });

  it('expands pleasure play to the full 20-pattern category', () => {
    const keys = PLEASURE_PLAY_PATTERNS.map((pattern) => pattern.key);

    expect(PLEASURE_PLAY_EXPANSION).toHaveLength(17);
    expect(PLEASURE_PLAY_PATTERNS).toHaveLength(20);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves supplied pleasure play copy', () => {
    expect(PLEASURE_PLAY_EXPANSION[0]).toMatchObject({
      key: 'pleasurePlay_playStarved',
      title: 'Joy Is Getting Crowded Out',
      description:
        'Pleasure, play, or enjoyment is present as a need but is not getting much space.',
      shameLabel: 'Fun can wait until everything else is handled.',
      clarityReframe:
        'Pleasure may not be extra. It may be one way your system reconnects with aliveness.',
    });
    expect(PLEASURE_PLAY_EXPANSION[16]).toMatchObject({
      key: 'pleasurePlay_curiosityReturns',
      title: 'Curiosity Returns',
      shameLabel: 'Curiosity is not important compared to everything else.',
      clarityReframe:
        'Curiosity can be a sign that your system has enough room to look outward again.',
    });
  });
});
