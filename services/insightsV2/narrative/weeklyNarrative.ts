import type { GeneratedInsight } from '../../insights/types/knowledgeEngine';
import type {
  PremiumPatternItem,
  PremiumPatternProfile,
  PremiumThisWeekPatternItem,
  PremiumWeeklyDeepDiveItem,
} from '../adapters/premiumPatterns';
import type { InsightCategory, PatternConfidence, PatternMovement } from '../types';

export interface WeeklyNarrativeThread {
  id: string;
  activeTheme: string;
  deepDiveTitle: string;
  deepDiveBody: string;
  forwardTitle: string;
  forwardBody: string;
  questionToKeep: string;
  rootPatternId?: string;
  protectiveMove?: string;
  connectedPatternKeys: string[];
  connectedParagraphIds: string[];
  category?: InsightCategory;
  confidence: PatternConfidence;
  movement: PatternMovement;
  isV2Derived: true;
}

type NarrativeCopy = Pick<
  WeeklyNarrativeThread,
  'activeTheme' | 'deepDiveTitle' | 'deepDiveBody' | 'forwardTitle' | 'forwardBody' | 'questionToKeep'
>;

const ROOT_NARRATIVE_COPY: Record<string, NarrativeCopy> = {
  catchDisconnectionBeforeItHappens: {
    activeTheme:
      'Connection feels safest when you can understand the shift before it becomes a rupture.',
    deepDiveTitle: 'Connection Before The Break',
    deepDiveBody:
      'This week, the strongest thread is not only about relationships. It gathers around the moment when something shifts and your attention moves toward preventing the break. A tone change, an unclear reply, a pause after you speak, or an unfinished conversation can become bigger than it looks from the outside. The pattern is less about drama and more about trying to stay close before distance has a chance to become real.\n\nUnderneath that, there is a protective move: trying to keep connection from slipping away without warning. That protection makes sense because it probably helped you notice things early, repair quickly, and keep yourself close to what mattered. It may show up through careful wording, body bracing, or taking more responsibility for repair than the moment has clearly asked for. The protective move is trying to keep you from being misunderstood, dropped, or left alone with the break.\n\nThe cost is that your body can start living inside the rupture before the rupture has actually happened. You may explain more, brace sooner, or carry more responsibility for repair than the moment has truly asked of you. The softer edge this week is letting repair have time to arrive before you decide the connection is already gone. A connection can feel uncertain without already being lost.',
    forwardTitle: 'This Week Forward',
    forwardBody:
      'Watch for the moment when your body starts preparing for distance before distance is actually clear. The work is not to ignore the signal. The work is to give the signal company, context, and time. A connection can feel uncertain without already being lost.',
    questionToKeep:
      'What changes when you give the moment one more breath before you start repairing it alone?',
  },
  carryingBeforeChoiceHasRoom: {
    activeTheme:
      'Care feels safest when support enters before everything lands in your hands.',
    deepDiveTitle: 'Care Before Assignment',
    deepDiveBody:
      'This week, the strongest thread gathers around the moment when care becomes responsibility before choice has had room. You may notice what is unfinished, what could fall through, or who might need support before anyone says it out loud. That awareness can look calm from the outside, but inside it may already be calculating what needs to be handled. The pattern is not that you care too much; it is that noticing can turn into assignment very quickly.\n\nUnderneath that, there is a protective move: stepping in before you have checked whether the weight is yours. That protection makes sense because it helps keep people, plans, and fragile moments from collapsing. It probably helped you become reliable, attentive, and quick to respond where others moved more slowly. The difficulty is that reliability can start asking for more of you than the moment has actually named.\n\nThe cost is that support may arrive too late because you have already picked up the loose end. You can end up carrying what was never fully yours, then wondering why care feels so heavy. The softer edge this week is letting capacity, consent, and shared support enter before responsibility becomes private. Not every need becomes yours because you were the first one to notice it.',
    forwardTitle: 'This Week Forward',
    forwardBody:
      'Watch for the moment when noticing starts becoming ownership. You do not have to abandon care to pause before picking something up. The useful question is whether support, capacity, and consent are already in the room. Not every loose end belongs in your hands.',
    questionToKeep:
      'What did you pick up because you saw it first, not because it was clearly yours?',
  },
  makingUncertaintyTrackable: {
    activeTheme:
      'Uncertainty feels safer when it can be named, organized, or made small enough to move with.',
    deepDiveTitle: 'When Clarity Becomes Safety',
    deepDiveBody:
      'This week, several signals gather around the same pressure point: the moment when uncertainty asks to be made trackable. You may start planning ahead, shaping your words, watching for risk, or trying to understand the next step before it is fully available. That can look like carefulness, but it may also be your way of creating ground when the moment has not offered enough. The pattern is not a flaw in your thinking; it is a search for steadiness.\n\nUnderneath that, there is a protective move: turning uncertainty into something you can track, explain, or organize. That protection makes sense because it gives shape to situations that might otherwise feel too open, too fast, or too easy to misread. It can help you avoid preventable mistakes and speak with more accuracy. It can also make clarity feel like a requirement before you are allowed to move.\n\nThe cost is that your attention may keep working long after the present moment has offered all it can. You can end up trying to finish the whole future before taking one honest next step. The softer edge this week is letting the next move be true without making it total. Some uncertainty can stay unfinished without making the whole path unsafe.',
    forwardTitle: 'This Week Forward',
    forwardBody:
      'Watch for the moment when clarity starts feeling like the price of safety. The next step does not have to explain the whole future. It only has to be honest enough to take. Leave some of the unknown unfinalized.',
    questionToKeep:
      'Where are you trying to make the whole future clear before taking the next true step?',
  },
  distanceToStayFunctional: {
    activeTheme:
      'Distance can keep the moment manageable, but it may leave the real feeling waiting for later.',
    deepDiveTitle: 'Distance That Helps And Costs',
    deepDiveBody:
      'This week, the thread may gather around the moments when stepping back helps you keep functioning. You may go quiet, stay surface-level, minimize the impact, delay the feeling, or let something drift because naming it would ask too much. From the outside, it can look like ease or neutrality. Inside, it may be a way of keeping the moment from becoming too loaded too quickly.\n\nUnderneath that, there is a protective move: creating distance so the moment stays manageable. That protection makes sense because not every feeling is available the second it appears. Sometimes your system needs space before it can tell the truth without getting overwhelmed. The distance can be useful, especially when closeness, conflict, sensation, or emotion starts asking for more access than you have.\n\nThe cost is that important things can remain unresolved until they return later with more weight. The feeling may not disappear; it may simply wait until the room is quiet enough to be heard. The softer edge this week is finding a slower doorway back in. You can name one true piece without forcing the whole feeling open at once.',
    forwardTitle: 'This Week Forward',
    forwardBody:
      'Watch for the moment when distance helps you get through the interaction. That distance may be useful, but it does not have to become the final answer. Come back gently when there is enough room. One true piece is enough to begin.',
    questionToKeep:
      'Where did distance help you get through the moment, and what might still need a little contact?',
  },
  protectingChoiceFromPressure: {
    activeTheme:
      'Choice feels safest when pressure does not get to decide before your real yes or no arrives.',
    deepDiveTitle: 'Choice Under Pressure',
    deepDiveBody:
      'This week, the strongest thread may gather around the moment when a request starts taking up too much space. You may feel resistance, hesitation, resentment after yes, or a sharper need for boundaries before you can explain why. A practical request can become emotionally charged when it begins to feel like your choice is disappearing. The pattern is not simple defiance; it is your autonomy asking not to be rushed out of the room.\n\nUnderneath that, there is a protective move: protecting choice when pressure starts taking over. That protection makes sense because your real yes, no, or pause needs room to arrive honestly. It can help you preserve integrity when another person brings urgency into the room. It can also make simple requests feel like danger before you have checked whether there is still space to choose.\n\nThe cost is that pressure may become the whole story before you know what you actually want. You may pull back from the request instead of separating the request from the force around it. The softer edge this week is letting your choice arrive without making it defend its right to exist. A pause can be a complete answer while the real answer is still forming.',
    forwardTitle: 'This Week Forward',
    forwardBody:
      'Watch for the moment when pressure gets louder than the actual request. You do not have to answer from the pressure. Give your yes, no, or pause enough room to become honest. Choice needs space before it can feel like yours.',
    questionToKeep:
      'Where did the pressure around a request become louder than your actual choice?',
  },
  earningSafetyThroughUsefulness: {
    activeTheme:
      'Care feels more believable when it does not have to be earned through usefulness.',
    deepDiveTitle: 'Usefulness And Belonging',
    deepDiveBody:
      'This week, several signals may gather around the places where care, worth, and usefulness start to overlap. You may measure what support might cost, push output past recovery, take responsibility quickly, or feel uneasy when care arrives without a task attached. It can feel safer to be needed than simply received. The pattern is not neediness; it is a learned way of making belonging feel more predictable.\n\nUnderneath that, there is a protective move: trying to feel safe by being useful, prepared, or easy to value. That protection makes sense because usefulness gives care a reason that can feel easier to trust. It may have helped you stay close to people or systems where care felt conditional. It can also make ordinary support feel suspicious when there is nothing obvious to repay.\n\nThe cost is that rest, receiving, and simple kindness can feel less available than they really are. You may start calculating debt before care has had a chance to land. The softer edge this week is letting support arrive before it becomes a transaction. You do not have to prove your usefulness before care is allowed to be real.',
    forwardTitle: 'This Week Forward',
    forwardBody:
      'Watch for the moment when care starts turning into a ledger. You can notice the urge to repay without obeying it immediately. Let one kind thing arrive before assigning it a cost. Usefulness is not the only reason you belong.',
    questionToKeep:
      'Where did you try to become easier to value instead of letting care arrive as it was?',
  },
  bodyCarriesWhatIsUnspoken: {
    activeTheme:
      'Your body may be carrying the warning before the words have arrived.',
    deepDiveTitle: 'The Body Speaks Early',
    deepDiveBody:
      'This week, the strongest thread may gather around the moments when your body knows before the story is clear. Chest tightness, breath changes, a quick brace, fatigue after pressure, or a sensation that stays after a conversation can all hold information. You may keep moving while part of you is still trying to understand what the body noticed. The pattern may be your body making hidden weight more visible.\n\nUnderneath that, there is a protective move: letting the body hold the warning before the words arrive. That protection makes sense because sensation can speak before thought is ready. It may help you catch pressure, threat, grief, or emotional load before it becomes impossible to ignore. It can also leave you functioning while your body is still carrying a story your mind has not caught up to.\n\nThe cost is that the body ends up doing emotional labor in silence. Discomfort may stay louder than it needs to because it has not been acknowledged directly. The softer edge this week is treating sensation as information before it becomes an alarm. The signal usually softens when it gets contact, context, and room to settle.',
    forwardTitle: 'This Week Forward',
    forwardBody:
      'Watch for the first body cue instead of waiting for a perfect explanation. The sensation does not need to be dramatic to count. Give it a little contact and context before pushing past it. Your body may be telling the truth early.',
    questionToKeep:
      'Where did your body know something before your words did?',
  },
  meaningBeforeMovement: {
    activeTheme:
      'Movement feels safer when it does not ask you to abandon what still matters.',
    deepDiveTitle: 'Meaning Before The Next Step',
    deepDiveBody:
      'This week, the thread may gather around the places where the practical answer is not enough. You may check alignment, return to a change that has not fully landed, search for what the moment means, or hesitate when a next step feels technically possible but not honest. The pause may look like indecision from the outside. Inside, it may be a deeper value asking not to be negotiated away.\n\nUnderneath that, there is a protective move: looking for meaning before you let the next step become real. That protection makes sense because movement can feel costly when it asks you to leave part of yourself behind. It helps preserve continuity, identity, and the truth underneath the plan. It can also make movement harder when the full meaning is still unfinished.\n\nThe cost is that you may wait for a complete story before allowing a small, honest step. Meaning can become a gate instead of a guide. The softer edge this week is letting one grounded value orient the next move. The whole story can keep becoming clear while you still take one step that feels true.',
    forwardTitle: 'This Week Forward',
    forwardBody:
      'Watch for the place where a practical answer still feels incomplete. You may not need the whole meaning before you move. One grounded value can be enough to orient the next step. Let the story keep unfolding without freezing the movement entirely.',
    questionToKeep:
      'What value is already clear enough to guide one step, even if the full meaning is still forming?',
  },
};

function unique(values: Array<string | undefined | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)));
}

function confidenceRank(confidence: PatternConfidence): number {
  if (confidence === 'veryStrong') return 4;
  if (confidence === 'strong') return 3;
  if (confidence === 'moderate') return 2;
  return 1;
}

function movementForThread(movements: PatternMovement[]): PatternMovement {
  if (movements.includes('intensifying')) return 'intensifying';
  if (movements.includes('returning')) return 'returning';
  if (movements.includes('softening')) return 'softening';
  if (movements.includes('repeating')) return 'repeating';
  return movements[0] ?? 'cross_source_match';
}

function bestConfidence(values: PatternConfidence[]): PatternConfidence {
  return [...values].sort((a, b) => confidenceRank(b) - confidenceRank(a))[0] ?? 'moderate';
}

function matchesThread(
  item: Pick<PremiumPatternItem, 'patternKey' | 'majorDomain' | 'insightSubcategory'>,
  threadKeys: Set<string>,
  domains: Set<string>,
  subcategories: Set<string>,
): boolean {
  return (
    threadKeys.has(item.patternKey) ||
    (!!item.majorDomain && domains.has(item.majorDomain)) ||
    (!!item.insightSubcategory && subcategories.has(item.insightSubcategory))
  );
}

export function selectWeeklyNarrativeThread({
  dailyInsights,
  premiumPatterns,
  premiumPatternProfile,
  thisWeeksV2Pattern,
  premiumWeeklyDeepDive,
}: {
  dailyInsights: GeneratedInsight[];
  premiumPatterns: PremiumPatternItem[];
  premiumPatternProfile: PremiumPatternProfile | null;
  thisWeeksV2Pattern: PremiumThisWeekPatternItem | null;
  premiumWeeklyDeepDive: PremiumWeeklyDeepDiveItem[];
}): WeeklyNarrativeThread | null {
  const rootPattern = premiumPatternProfile?.rootPattern;
  if (!rootPattern) return null;

  const copy = ROOT_NARRATIVE_COPY[rootPattern.id];
  if (!copy) return null;

  const rootPatternKeys = new Set(rootPattern.matchedPatternKeys);
  const rootDomains = new Set(rootPattern.matchedDomains);
  const rootSubcategories = new Set(rootPattern.matchedSubcategories);
  const connectedPatterns = premiumPatterns.filter(item =>
    matchesThread(item, rootPatternKeys, rootDomains, rootSubcategories),
  );
  const connectedDaily = dailyInsights.filter(insight =>
    rootPatternKeys.has(insight.patternKey) ||
    (!!insight.majorDomain && rootDomains.has(insight.majorDomain)) ||
    (!!insight.insightSubcategory && rootSubcategories.has(insight.insightSubcategory)),
  );
  const connectedWeekly = premiumWeeklyDeepDive.filter(item => rootPatternKeys.has(item.patternKey));
  const connectedThisWeek = thisWeeksV2Pattern && rootPatternKeys.has(thisWeeksV2Pattern.patternKey)
    ? [thisWeeksV2Pattern]
    : [];
  const confidence = bestConfidence([
    rootPattern.confidence,
    ...connectedPatterns.map(item => item.confidence),
    ...connectedDaily.map(item => item.confidence as PatternConfidence),
    ...connectedWeekly.map(item => item.confidence),
    ...connectedThisWeek.map(item => item.confidence),
  ]);
  const movement = movementForThread([
    ...connectedPatterns.map(item => item.movement),
    ...connectedDaily.map(item => item.movement as PatternMovement),
    ...connectedWeekly.map(item => item.movement),
    ...connectedThisWeek.map(item => item.movement),
  ]);

  return {
    id: `weekly-narrative-${rootPattern.id}`,
    ...copy,
    rootPatternId: rootPattern.id,
    protectiveMove: rootPattern.protectiveMove,
    connectedPatternKeys: unique([
      ...rootPattern.matchedPatternKeys,
      ...connectedPatterns.map(item => item.patternKey),
      ...connectedDaily.map(item => item.patternKey),
      ...connectedWeekly.map(item => item.patternKey),
      ...connectedThisWeek.map(item => item.patternKey),
    ]).slice(0, 12),
    connectedParagraphIds: unique([
      ...connectedPatterns.map(item => item.paragraphId),
      ...connectedPatterns.map(item => item.weeklyParagraphId),
      ...connectedDaily.map(item => item.paragraphId),
    ]),
    category: (connectedPatterns[0]?.category ?? connectedDaily[0]?.category) as InsightCategory | undefined,
    confidence,
    movement,
    isV2Derived: true,
  };
}

export function applyWeeklyNarrativeToDailyInsights(
  insights: GeneratedInsight[],
  thread: WeeklyNarrativeThread | null,
): GeneratedInsight[] {
  if (!thread) return insights;
  const connectedKeys = new Set(thread.connectedPatternKeys);
  return insights.map(insight => ({
    ...insight,
    activeWeeklyTheme: thread.activeTheme,
    narrativeThreadId: thread.id,
    narrativeRole: connectedKeys.has(insight.patternKey) ? 'today' : 'supporting',
  }));
}

export function applyWeeklyNarrativeToPatterns(
  patterns: PremiumPatternItem[],
  thread: WeeklyNarrativeThread | null,
): PremiumPatternItem[] {
  if (!thread) return patterns;
  const connectedKeys = new Set(thread.connectedPatternKeys);
  return patterns.map(item => ({
    ...item,
    activeWeeklyTheme: thread.activeTheme,
    narrativeThreadId: thread.id,
    narrativeRole: connectedKeys.has(item.patternKey) ? 'patternCard' : 'supporting',
  }));
}

export function applyWeeklyNarrativeToThisWeekPattern(
  item: PremiumThisWeekPatternItem | null,
  thread: WeeklyNarrativeThread | null,
): PremiumThisWeekPatternItem | null {
  if (!item || !thread || item.isEmptyState) return item;
  return {
    ...item,
    activeWeeklyTheme: thread.activeTheme,
    narrativeThreadId: thread.id,
    narrativeRole: 'thisWeek',
    narrativeForward: thread.forwardBody,
    narrativeQuestion: thread.questionToKeep,
    connectedPatternKeys: thread.connectedPatternKeys,
  };
}

export function applyWeeklyNarrativeToWeeklyDeepDive(
  reads: PremiumWeeklyDeepDiveItem[],
  thread: WeeklyNarrativeThread | null,
): PremiumWeeklyDeepDiveItem[] {
  if (!thread) return reads;
  return reads.map(read => ({
    ...read,
    activeWeeklyTheme: thread.activeTheme,
    narrativeThreadId: thread.id,
    narrativeRole: thread.connectedPatternKeys.includes(read.patternKey) ? 'weeklyDeepDive' : 'supporting',
    connectedPatternKeys: thread.connectedPatternKeys,
  }));
}
