import {
  applyWeeklyNarrativeToDailyInsights,
  applyWeeklyNarrativeToPatterns,
  applyWeeklyNarrativeToThisWeekPattern,
  applyWeeklyNarrativeToWeeklyDeepDive,
  selectWeeklyNarrativeThread,
} from '../narrative/weeklyNarrative';

const rootPattern = {
  id: 'catchDisconnectionBeforeItHappens',
  title: 'Root Pattern',
  name: 'Catching disconnection before it happens',
  protectiveMove: 'trying to catch disconnection before it happens',
  body: 'Several patterns seem to gather around the same protective move.',
  protects: 'It protects the chance to stay close.',
  costs: 'It can make neutral moments feel urgent.',
  softens: 'It softens when repair has a real path back.',
  reflectionPrompt: 'Where did you try to prevent disconnection?',
  matchedPatternKeys: [
    'relationships_toneShiftSensitivity',
    'communicationVoice_overExplaining',
    'bodySignals_bracing',
  ],
  matchedPatternTitles: ['Tone Shift Sensitivity', 'Over-Explaining', 'Body Bracing'],
  matchedCategories: ['relationships', 'communicationVoice', 'bodySignals'],
  matchedDomains: ['attachmentConnection', 'powerVoiceAgency', 'embodimentSomaticSignals'],
  matchedSubcategories: ['toneShiftSensitivity', 'beingHeard', 'chestSignal'],
  matchedPatternTypes: ['highTracking'],
  matchedProtectiveStrategies: ['protectTruthFromMisunderstanding'],
  anchors: ['tone-shift', 'repair-need'],
  signalTypes: ['tone_sensitivity', 'overexplaining'],
  sources: ['relationshipMirror', 'triggerLog'],
  strength: 94,
  confidence: 'strong',
  evidenceCount: 3,
  isV2Derived: true,
} as const;

const dailyInsight = {
  id: 'today-1',
  slot: 'whatMySkyNoticed',
  slotLabel: 'What Stands Out',
  title: 'Tone Shift Sensitivity',
  observation: "When someone's tone shifts, your body catches it before your mind has the full story.",
  pattern: 'You start replaying what changed.',
  paragraphId: 'relationships_tone_shift_gold_001',
  category: 'relationships',
  majorDomain: 'attachmentConnection',
  insightSubcategory: 'toneShiftSensitivity',
  patternType: 'highTracking',
  reframe: { shame: '', clarity: 'That kind of bracing makes sense.' },
  prompt: 'What changes when you give the moment one more breath?',
  patternKey: 'relationships_toneShiftSensitivity',
  confidence: 'strong',
  movement: 'repeating',
  evidence: [],
  createdAt: '2026-04-24T12:00:00Z',
} as any;

const patternItem = {
  title: 'Communication Voice',
  body: 'When something matters, you start shaping your words before they leave you. You add context, soften one part, clarify another, and try to protect the meaning from being misread. That kind of precision has history. Being misunderstood has not always felt small. It just means clarity can start doing the work that safety should not have to do alone.',
  paragraphId: 'communicationVoice_highTracking_001',
  weeklyParagraphId: 'communicationVoice_weekly_001',
  patternKey: 'communicationVoice_overExplaining',
  category: 'communicationVoice',
  confidence: 'strong',
  movement: 'repeating',
  score: 92,
  majorDomain: 'powerVoiceAgency',
  insightSubcategory: 'beingHeard',
  patternType: 'highTracking',
  relatedSignals: ['overexplaining', 'tone_sensitivity'],
  matchedAnchors: ['tone-shift'],
  matchedSignals: ['overexplaining'],
  sourceCoverage: ['journal entries', 'relationship reflections'],
  evidenceSummary: 'It has repeated for roughly 30 days.',
  lastSeenAt: '2026-04-24',
  observedAcrossDays: 30,
  isV2Derived: true,
} as any;

const weeklyRead = {
  id: 'weekly-v2-communicationVoice_overExplaining',
  patternKey: 'communicationVoice_overExplaining',
  category: 'communicationVoice',
  title: 'Communication Voice',
  preview: 'When something matters, you start shaping your words.',
  body: 'This week, communication seems connected to the way repair and safety move together. When tone shifts or meaning feels easy to misread, your words may start doing extra work before you have decided what is actually needed. That carefulness makes sense because being misunderstood has not always felt small. The softer edge is letting clarity support connection without making it carry the whole relationship.',
  whyItMayMatter: 'Connection can change your body quickly.',
  reframe: 'Precision can be care without becoming armor.',
  evidenceSummary: 'It has repeated for roughly 30 days.',
  reflectionPrompt: 'What would make clarity less lonely?',
  confidence: 'strong',
  movement: 'repeating',
  isV2Derived: true,
} as any;

const thisWeekPattern = {
  id: 'this-week-v2-bodySignals_bracing',
  patternKey: 'bodySignals_bracing',
  category: 'bodySignals',
  title: 'Body Signal',
  body: 'Your chest tightens before the situation has fully explained itself. You keep moving, but part of you stays with the moment, trying to understand what your body already noticed. That reaction is not random. Your body learned to speak early. The signal usually stays until it is actually acknowledged.',
  reframe: 'Your body is trying to get your attention.',
  confidence: 'strong',
  movement: 'repeating',
  evidenceSummary: 'It has repeated for roughly 30 days.',
  isV2Derived: true,
} as any;

describe('weekly narrative coherence', () => {
  it('selects a shared active weekly theme from the root pattern layer', () => {
    const thread = selectWeeklyNarrativeThread({
      dailyInsights: [dailyInsight],
      premiumPatterns: [patternItem],
      premiumPatternProfile: {
        title: 'Your Pattern Profile',
        subtitle: 'A deeper read.',
        portrait: rootPattern.body,
        rootPattern: rootPattern as any,
        sections: [],
        reflectionPrompt: rootPattern.reflectionPrompt,
        areaLabels: [],
        sourcePatternKeys: [...rootPattern.matchedPatternKeys],
      },
      thisWeeksV2Pattern: thisWeekPattern,
      premiumWeeklyDeepDive: [weeklyRead],
    });

    expect(thread?.activeTheme).toBe(
      'Connection feels safest when you can understand the shift before it becomes a rupture.',
    );
    expect(thread?.connectedPatternKeys).toEqual(expect.arrayContaining([
      'relationships_toneShiftSensitivity',
      'communicationVoice_overExplaining',
      'bodySignals_bracing',
    ]));
    expect(thread?.deepDiveBody).not.toMatch(/attachment theory|based on|detected in|seen across|the user/i);
    expect(thread?.forwardBody).toContain('A connection can feel uncertain without already being lost.');
  });

  it('annotates each visible surface without reusing the same paragraph body', () => {
    const thread = selectWeeklyNarrativeThread({
      dailyInsights: [dailyInsight],
      premiumPatterns: [patternItem],
      premiumPatternProfile: {
        title: 'Your Pattern Profile',
        subtitle: 'A deeper read.',
        portrait: rootPattern.body,
        rootPattern: rootPattern as any,
        sections: [],
        reflectionPrompt: rootPattern.reflectionPrompt,
        areaLabels: [],
        sourcePatternKeys: [...rootPattern.matchedPatternKeys],
      },
      thisWeeksV2Pattern: thisWeekPattern,
      premiumWeeklyDeepDive: [weeklyRead],
    });

    const [daily] = applyWeeklyNarrativeToDailyInsights([dailyInsight], thread);
    const [pattern] = applyWeeklyNarrativeToPatterns([patternItem], thread);
    const [weekly] = applyWeeklyNarrativeToWeeklyDeepDive([weeklyRead], thread);
    const thisWeek = applyWeeklyNarrativeToThisWeekPattern(thisWeekPattern, thread);

    expect(daily.activeWeeklyTheme).toBe(thread?.activeTheme);
    expect(pattern.activeWeeklyTheme).toBe(thread?.activeTheme);
    expect(weekly.activeWeeklyTheme).toBe(thread?.activeTheme);
    expect(thisWeek?.activeWeeklyTheme).toBe(thread?.activeTheme);
    expect(thisWeek?.narrativeForward).toBe(thread?.forwardBody);
    expect(thisWeek?.narrativeQuestion).toBe(thread?.questionToKeep);

    const bodyKeys = new Set([
      `${daily.observation} ${daily.pattern}`,
      pattern.body,
      weekly.body,
      thisWeek?.body,
      thread?.deepDiveBody,
      thread?.forwardBody,
    ]);
    expect(bodyKeys.size).toBe(6);
  });
});
