import {
  adaptPremiumPatterns,
  adaptWeeklyPremiumPatternCandidates,
  selectPremiumPatternProfile,
  selectPremiumWeeklyDeepDive,
  selectThisWeeksV2Pattern,
  type PremiumPatternItem,
} from '../adapters/premiumPatterns';
import type { ArchivePatternScore } from '../types';

const item = (overrides: Partial<PremiumPatternItem>): PremiumPatternItem => ({
  title: 'Invisible Load',
  body:
    'The pattern around care and responsibility carries a direct message here: you notice what needs holding before you notice whether it should be yours. It tends to get loud when care turns into responsibility, before anyone names how much weight has entered the moment. The pressure in that moment points to private load becoming visible, not to a personal defect. The weight is not proof that you care too much; it shows how quickly care can become private labor. Let capacity and support enter before the loose end lands entirely in your hands.',
  lens: 'protective_patterns',
  concept: 'protective_behavior',
  writerShape: 'punch',
  paragraphId: 'responsibilityCare_punch_001',
  weeklyParagraphId: 'responsibilityCare_weekly_001',
  weeklyBody:
    'This week, care and responsibility seems to be organizing more than one moment. It may show up when care turns into responsibility, before anyone names how much weight has entered the moment. The important signal is not the event by itself; it is how quickly you notice what needs holding before you notice whether it should be yours. The weight is not proof that you care too much; it shows how quickly care can become private labor.\n\nCarry this into next week as a capacity question before it becomes a character question. Notice what would change when support feels uncertain, especially around shared load. The next useful response is shared support, not another demand to make the signal disappear. Let capacity and support enter before the loose end lands entirely in your hands.',
  specificityAnchor: 'when you are holding more than the visible task',
  fingerprint: 'v2:responsibilityCare_invisibleLoad',
  score: 92,
  patternKey: 'responsibilityCare_invisibleLoad',
  category: 'responsibilityCare',
  confidence: 'strong',
  movement: 'repeating',
  evidenceSummary: 'It has repeated for roughly 30 days, especially in journaling and body check-ins.',
  sourceCoverage: ['journal entries', 'body maps'],
  lastSeenAt: '2026-04-24',
  observedAcrossDays: 30,
  relatedSignals: ['mental_load', 'responsibility_weight'],
  shameLabel: 'I should be able to handle this.',
  clarityReframe: 'This may be the cost of carrying things that are hard for others to see.',
  librarySectionTitle: 'Responsibility & Care',
  archiveSectionTitle: 'Responsibility & Care',
  isV2Derived: true,
  ...overrides,
});

describe('selectPremiumWeeklyDeepDive', () => {
  it('selects capped V2-derived weekly reads, skips the archive core when enough alternatives exist, and includes recovery', () => {
    const reads = selectPremiumWeeklyDeepDive([
      item({
        title: 'Core archive pattern',
        patternKey: 'responsibilityCare_invisibleLoad',
        category: 'responsibilityCare',
        score: 99,
      }),
      item({
        title: 'Care Feels Earned',
        patternKey: 'selfWorthReceiving_earnedCare',
        category: 'selfWorthReceiving',
        score: 90,
      }),
      item({
        title: 'Letting Joy Land',
        patternKey: 'pleasurePlay_joyTolerance',
        category: 'pleasurePlay',
        concept: 'recovery_pattern',
        lens: 'recovery_patterns',
        score: 82,
      }),
      item({
        title: 'Subtle Bracing',
        patternKey: 'safetyRegulation_subtleBracing',
        category: 'safetyRegulation',
        score: 80,
      }),
      item({
        title: 'Another Safety Pattern',
        patternKey: 'safetyRegulation_alwaysOn',
        category: 'safetyRegulation',
        score: 78,
      }),
    ]);

    expect(reads.length).toBeGreaterThanOrEqual(2);
    expect(reads.length).toBeLessThanOrEqual(4);
    expect(reads.some(read => read.patternKey === 'responsibilityCare_invisibleLoad')).toBe(false);
    expect(reads.some(read => read.category === 'pleasurePlay')).toBe(true);
    expect(new Set(reads.map(read => read.category)).size).toBe(reads.length);
    expect(reads.every(read => read.isV2Derived)).toBe(true);
    expect(reads.some(read => read.patternKey === 'unknown')).toBe(false);
  });

  it('does not emit debug labels in weekly read copy', () => {
    const [read] = selectPremiumWeeklyDeepDive([
      item({
        title: 'Letting Joy Land',
        patternKey: 'pleasurePlay_joyTolerance',
        category: 'pleasurePlay',
        concept: 'recovery_pattern',
        lens: 'recovery_patterns',
      }),
    ]);

    const copy = [
      read.title,
      read.body,
      read.whyItMayMatter,
      read.reframe,
      read.evidenceSummary,
      read.reflectionPrompt,
    ].join(' ');

    expect(copy).not.toMatch(/High-value read|Insight type|Priority|Evidence:|debug|score/i);
    expect(copy).not.toMatch(/evidence is .*clear read|evidence is .*clear enough|evidence is .*take seriously/i);
    expect(copy).not.toMatch(/Your archive|MySky is noticing|MySky is seeing|The data suggests|This pattern indicates/i);
    expect(copy).not.toMatch(/This does not read as|It reads as|Seen across/i);
    expect(read.body).not.toContain('This week, the signal gathered');
    expect(read.body).not.toContain('The point is not');
    expect(read.body.split('\n\n')).toHaveLength(2);
    expect(read.whyItMayMatter).toContain('Recovery');
    expect(read.reflectionPrompt).toContain('helped');
  });

  it('uses softer V2 fallback reads when only low-score patterns are available', () => {
    const reads = selectPremiumWeeklyDeepDive([
      item({
        title: 'Early Responsibility Thread',
        patternKey: 'responsibilityCare_needNotAssignment',
        category: 'responsibilityCare',
        confidence: 'emerging',
        movement: 'new',
        score: 24,
      }),
      item({
        title: 'Early Rhythm Thread',
        patternKey: 'timeRhythms_timingAsData',
        category: 'timeRhythms',
        body:
          'When the day has no margin, the pressure starts before anything is actually late. You move ahead in your mind, trying to keep the next thing from catching you off guard. That response makes sense when too much has been fitting into too little room. It can help you stay prepared, but it also keeps your body from ever fully arriving. The pace itself becomes part of what needs care.',
        weeklyBody:
          'This week, time and rhythm may be asking for a more honest amount of space. During rushed transitions, you may feel your mind moving ahead before the current moment has finished. That does not mean you are failing at discipline. It means the shape of the day may be asking for more room than it has been given.\n\nThe useful question is not how to force more into the same space. Start with the place where the day begins to compress. A little more margin there may change more than another push for speed. The pressure may not need more force.',
        confidence: 'emerging',
        movement: 'new',
        score: 18,
      }),
    ]);

    expect(reads).toHaveLength(2);
    expect(reads.every(read => read.isV2Derived)).toBe(true);
    expect(reads.every(read => read.isLowConfidenceFallback)).toBe(true);
    expect(reads[0].body.split('\n\n').length).toBeGreaterThanOrEqual(2);
    expect(reads[0].body).not.toContain('light signal');
    expect(reads[0].reframe).toContain('possible thread');
  });

  it('returns a polished V2 low-data empty state when no V2 patterns exist', () => {
    const reads = selectPremiumWeeklyDeepDive([]);

    expect(reads).toHaveLength(1);
    expect(reads[0].isV2Derived).toBe(true);
    expect(reads[0].isEmptyState).toBe(true);
    expect(reads[0].patternKey).toBe('weeklyDeepDive_lowData');
    expect(reads[0].title).toContain('Still Gathering Signal');
    expect(reads[0].body).toContain('Rather than forcing a pattern too early');
  });

  it('can adapt low-score V2 pattern scores for Weekly without adding them to the main premium map', () => {
    const lowScore: ArchivePatternScore = {
      patternKey: 'responsibilityCare_invisibleLoad',
      title: 'Invisible Load',
      category: 'responsibilityCare',
      score: 0.24,
      confidence: 'emerging',
      movement: 'new',
      timeframeDays: 30,
      sources: ['journal'],
      evidence: [],
      lastSeenAt: '2026-04-24',
    };

    expect(adaptPremiumPatterns([lowScore])).toHaveLength(0);
    const weeklyCandidates = adaptWeeklyPremiumPatternCandidates([lowScore]);
    expect(weeklyCandidates).toHaveLength(1);
    expect(weeklyCandidates[0].patternKey).toBe('responsibilityCare_invisibleLoad');
  });

  it('does not adapt dream-only scores into Weekly or This Week pattern reads', () => {
    const dreamScore: ArchivePatternScore = {
      patternKey: 'dreams_001_unfinished_processing',
      title: 'When Dreams Continue the Conversation',
      category: 'dreamsSymbols',
      score: 0.9,
      confidence: 'veryStrong',
      movement: 'repeating',
      timeframeDays: 90,
      sources: ['dream'],
      evidence: [
        {
          source: 'dream',
          date: '2026-04-24',
          label: 'Dream',
          signal: 'dream_unfinished_processing',
          strength: 0.9,
        },
      ],
      lastSeenAt: '2026-04-24',
    };

    expect(adaptWeeklyPremiumPatternCandidates([dreamScore])).toHaveLength(0);

    const selected = selectThisWeeksV2Pattern([dreamScore], [], []);

    expect(selected.isEmptyState).toBe(true);
    expect(selected.category).not.toBe('dreamsSymbols');
  });

  it("selects This Week's Pattern from V2 patterns when available", () => {
    const selected = selectThisWeeksV2Pattern(
      [],
      [
        item({
          title: 'Care Feels Earned',
          patternKey: 'selfWorthReceiving_earnedCare',
          category: 'selfWorthReceiving',
          score: 90,
          confidence: 'strong',
        }),
      ],
      [],
    );

    expect(selected.patternKey).toBe('selfWorthReceiving_earnedCare');
    expect(selected.isV2Derived).toBe(true);
    expect(selected.isEmptyState).toBeFalsy();
    expect(selected.patternKey).not.toBe('unknown');
  });

  it('avoids duplicating the top Weekly Deep Dive item when a strong alternative exists', () => {
    const weeklyReads = selectPremiumWeeklyDeepDive([
      item({
        title: 'Letting Joy Land',
        patternKey: 'pleasurePlay_joyTolerance',
        category: 'pleasurePlay',
        concept: 'recovery_pattern',
        score: 96,
      }),
      item({
        title: 'Care Feels Earned',
        patternKey: 'selfWorthReceiving_earnedCare',
        category: 'selfWorthReceiving',
        score: 90,
      }),
    ]);

    const selected = selectThisWeeksV2Pattern(
      [],
      [
        item({
          title: 'Letting Joy Land',
          patternKey: 'pleasurePlay_joyTolerance',
          category: 'pleasurePlay',
          concept: 'recovery_pattern',
          score: 96,
        }),
        item({
          title: 'Care Feels Earned',
          patternKey: 'selfWorthReceiving_earnedCare',
          category: 'selfWorthReceiving',
          score: 90,
        }),
      ],
      weeklyReads,
    );

    expect(weeklyReads[0].patternKey).toBe('pleasurePlay_joyTolerance');
    expect(selected.patternKey).toBe('selfWorthReceiving_earnedCare');
  });

  it("uses a soft low-confidence V2 fallback for This Week's Pattern when needed", () => {
    const lowScore: ArchivePatternScore = {
      patternKey: 'responsibilityCare_invisibleLoad',
      title: 'Invisible Load',
      category: 'responsibilityCare',
      score: 0.24,
      confidence: 'emerging',
      movement: 'new',
      timeframeDays: 30,
      sources: ['journal'],
      evidence: [],
      lastSeenAt: '2026-04-24',
    };

    const selected = selectThisWeeksV2Pattern([lowScore], [], []);

    expect(selected.patternKey).toBe('responsibilityCare_invisibleLoad');
    expect(selected.isLowConfidenceFallback).toBe(true);
    expect(selected.body).toMatch(/care|responsibility|support|load|held|weight|pick it up/i);
    expect(selected.body).not.toContain('early thread');
    expect(selected.reframe).toContain('stay spacious');
  });

  it("uses a V2 low-data empty state for This Week's Pattern when no V2 patterns exist", () => {
    const selected = selectThisWeeksV2Pattern([], [], []);

    expect(selected.patternKey).toBe('thisWeek_lowData');
    expect(selected.isEmptyState).toBe(true);
    expect(selected.isV2Derived).toBe(true);
    expect(selected.title).toContain('Still Forming');
  });

  it('builds Pattern Profile as a cohesive V2 profile with distinct prominent areas', () => {
    const profile = selectPremiumPatternProfile([
      item({
        title: 'Invisible Load',
        patternKey: 'responsibilityCare_invisibleLoad',
        category: 'responsibilityCare',
        archiveSectionTitle: 'Responsibility & Care',
        score: 96,
        confidence: 'veryStrong',
      }),
      item({
        title: 'Repair Helps You Settle',
        patternKey: 'communicationVoice_repairSettles',
        category: 'communicationVoice',
        archiveSectionTitle: 'Relationships',
        score: 90,
        clarityReframe:
          'Needing repair does not mean you want conflict. It may be how your body knows the rupture is actually over.',
        shameLabel: 'I should just move on.',
        evidenceSummary: 'Seen across relationship reflections and journal entries over roughly 45 days.',
        relatedSignals: ['repair_need', 'rupture_sensitivity', 'tone_sensitivity'],
      }),
      item({
        title: 'Subtle Bracing',
        patternKey: 'safetyRegulation_subtleBracing',
        category: 'safetyRegulation',
        archiveSectionTitle: 'Safety & Regulation',
        score: 82,
        clarityReframe:
          'Looking composed and feeling fully safe are not always the same thing.',
        shameLabel: 'If I look calm, I should feel calm.',
        evidenceSummary: 'Seen across body maps and trigger logs over roughly 30 days.',
        relatedSignals: ['calm_bracing', 'preparedness', 'always_on'],
      }),
      item({
        title: 'Letting Joy Land',
        patternKey: 'pleasurePlay_joyTolerance',
        category: 'pleasurePlay',
        concept: 'recovery_pattern',
        lens: 'recovery_patterns',
        archiveSectionTitle: 'What Helps',
        score: 78,
        clarityReframe:
          'Letting joy land does not require pretending everything is solved.',
        evidenceSummary: 'Seen across glimmer logs and reflection answers over roughly 90 days.',
        relatedSignals: ['joy_tolerance', 'play_glimmer', 'body_lightness'],
      }),
    ]);

    expect(profile.isLowData).toBeFalsy();
    expect(profile.title).toBe('Your Pattern Profile');
    expect(profile.sections.length).toBeGreaterThanOrEqual(2);
    expect(profile.sections.length).toBeLessThanOrEqual(3);
    expect(new Set(profile.sections.map(section => section.title)).size).toBe(profile.sections.length);
    expect(profile.growthOrRecovery?.title).toBe('What Helps You Soften');
    expect(profile.rootPattern?.id).toBe('catchDisconnectionBeforeItHappens');
    expect(profile.portrait).toContain('Several patterns seem to gather around the same protective move');
    expect(profile.portrait).toContain('trying to catch disconnection before it happens');
    expect(profile.rootPattern?.protects).toContain('stay close');
    expect(profile.rootPattern?.costs).toContain('neutral moments');
    expect(profile.rootPattern?.softens).toContain('repair has a real path back');
    expect(profile.portrait).not.toContain('Right now, the clearest shape is around');
    expect(profile.portrait).not.toMatch(/clearest shape is around|give this profile|gives this profile/i);
    expect(profile.portrait).not.toMatch(/invisible responsibility.*relief.*bracing/i);
    expect(profile.portrait).not.toMatch(/notices strain early, reaches for repair, and stays braced/i);
    expect(profile.portrait).not.toContain('Invisible Load, Repair Helps You Settle, and Subtle Bracing');
    expect(profile.sourcePatternKeys).toEqual(expect.arrayContaining([
      'responsibilityCare_invisibleLoad',
      'communicationVoice_repairSettles',
    ]));

    const copy = [
      profile.title,
      profile.subtitle,
      profile.portrait,
      ...profile.sections.flatMap(section => [section.title, section.body]),
      profile.growthOrRecovery?.title ?? '',
      profile.growthOrRecovery?.body ?? '',
      profile.reflectionPrompt,
    ].join(' ');

    expect(copy).toContain('With invisible load');
    expect(copy).toContain('Tone, repair, support, distance, and being understood are not background details for you');
    expect(copy).toContain('This is the cost of carrying things that are hard for others to see');
    expect(copy).toContain('Watch for it when you are holding more than the visible task');
    expect(copy).not.toMatch(/It has repeated for roughly|Seen across|body maps|trigger logs/i);
    expect(copy).not.toContain('The strongest threads right now are');
    expect(copy).not.toMatch(/Dreams and symbols carry emotional residue|Capacity has a rhythm|Boundaries and self-trust/i);
    expect(profile.sections.every(section => /\byou\b|\byour\b|\byour system\b|For you\b/i.test(section.body))).toBe(true);
    expect(copy).not.toMatch(/Your archive|MySky noticed|MySky is noticing|The data suggests|This pattern indicates|This may point to/i);
  });

  it('adds a root-pattern layer when several visible patterns share a protective move', () => {
    const profile = selectPremiumPatternProfile([
      item({
        title: 'Tone Shift Sensitivity',
        patternKey: 'relationships_toneShiftSensitivity',
        category: 'relationships',
        archiveSectionTitle: 'Relationships',
        score: 96,
        confidence: 'veryStrong',
        relatedSignals: ['tone_sensitivity', 'repair_need', 'sharp_connection_awareness'],
        sourceCoverage: ['relationship reflections', 'trigger logs'],
      }),
      item({
        title: 'Over-Explaining',
        patternKey: 'communicationVoice_overExplaining',
        category: 'communicationVoice',
        archiveSectionTitle: 'Communication',
        score: 92,
        confidence: 'strong',
        relatedSignals: ['overexplaining', 'more_explanation_connection', 'contained_until_understood'],
        sourceCoverage: ['journal entries', 'relationship reflections'],
      }),
      item({
        title: 'Body Bracing',
        patternKey: 'bodySignals_bracing',
        category: 'bodySignals',
        archiveSectionTitle: 'Body Signals',
        score: 88,
        confidence: 'strong',
        relatedSignals: ['body_signal_interpretation', 'calm_bracing', 'chest_pressure'],
        sourceCoverage: ['body maps', 'trigger logs'],
      }),
      item({
        title: 'Receiving Support',
        patternKey: 'selfWorthReceiving_support',
        category: 'selfWorthReceiving',
        archiveSectionTitle: 'Receiving Support',
        patternType: 'pushPull',
        score: 84,
        confidence: 'strong',
        relatedSignals: ['support_need', 'receiving_care_difficulty', 'support_reaches_inside'],
        sourceCoverage: ['reflection answers', 'relationship reflections'],
      }),
    ]);

    expect(profile.rootPattern?.id).toBe('catchDisconnectionBeforeItHappens');
    expect(profile.subtitle).toContain('protective move underneath several patterns');
    expect(profile.portrait).toContain('Several patterns seem to gather around the same protective move');
    expect(profile.portrait).toContain('trying to catch disconnection before it happens');
    expect(profile.rootPattern?.protects).toContain('stay close');
    expect(profile.rootPattern?.costs).toContain('neutral moments');
    expect(profile.rootPattern?.softens).toContain('repair has a real path back');
    expect(profile.areaLabels).toContain('Catching disconnection before it happens');
    expect(profile.sourcePatternKeys).toEqual(expect.arrayContaining([
      'relationships_toneShiftSensitivity',
      'communicationVoice_overExplaining',
      'bodySignals_bracing',
    ]));

    const copy = [
      profile.portrait,
      profile.rootPattern?.protects ?? '',
      profile.rootPattern?.costs ?? '',
      profile.rootPattern?.softens ?? '',
    ].join(' ');
    expect(copy).not.toMatch(/attachment theory|repair\/rupture|the user|based on|detected in|seen across/i);
  });

  it('returns a polished low-data Pattern Profile when prominent areas are not ready', () => {
    const profile = selectPremiumPatternProfile([
      item({
        title: 'Early Responsibility Thread',
        patternKey: 'responsibilityCare_needNotAssignment',
        category: 'responsibilityCare',
        confidence: 'emerging',
        movement: 'new',
        score: 24,
      }),
    ]);

    expect(profile.isLowData).toBe(true);
    expect(profile.sections).toHaveLength(0);
    expect(profile.portrait).toContain('This profile is still forming');
    expect(profile.portrait).not.toMatch(/Your archive|MySky noticed|The data suggests/i);
  });
});
