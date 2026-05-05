import { selectPrimaryPersona } from '../engine/selectPrimaryPersona';
import { buildTodayInsights } from '../buildTodayInsights';
import { PERSONA_PROFILES } from '../personaProfiles';
import type { ArchivePatternScore, UserSignal } from '../types';

describe('insightsV2 persona profiles', () => {
  const now = '2026-04-24T12:00:00Z';
  const today = '2026-04-24';

  it('keeps the provided persona copy as the canonical list', () => {
    expect(PERSONA_PROFILES).toHaveLength(99);
    expect(PERSONA_PROFILES.map(profile => profile.personNumber)).toEqual([
      1,
      2,
      3,
      4,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      38,
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49,
      50,
      51,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      59,
      60,
      61,
      62,
      63,
      64,
      65,
      66,
      67,
      68,
      69,
      70,
      71,
      72,
      73,
      74,
      75,
      76,
      77,
      78,
      79,
      80,
      81,
      82,
      83,
      84,
      85,
      86,
      87,
      88,
      89,
      90,
      91,
      92,
      93,
      94,
      95,
      96,
      97,
      98,
      99,
      100,
    ]);
    expect(PERSONA_PROFILES.every(profile => profile.sentences.length === 10)).toBe(true);

    const relationalTracker = PERSONA_PROFILES.find(profile => profile.key === 'relationalTracker');
    expect(relationalTracker?.sentences[0]).toBe(
      `You may notice small changes in someone’s tone before anything is said directly. That can help you understand what is happening, but it can also keep you on alert when the other person may not even realize they shifted.`,
    );

    const boundariesSelfTrust = PERSONA_PROFILES.find(profile => profile.key === 'boundariesSelfTrust');
    expect(boundariesSelfTrust?.intro[0]).toBe(
      `This person may know what they feel, but still hesitate to treat that knowing as enough. They often look for confirmation before trusting their own limit.`,
    );
    expect(boundariesSelfTrust?.sentences[0]).toBe(
      `You may feel a limit before you can explain it. Your body or mood may say “too much” before your mind has a clear reason ready.`,
    );

    const safetyRegulation = PERSONA_PROFILES.find(profile => profile.key === 'safetyRegulation');
    expect(safetyRegulation?.intro[0]).toBe(
      `This person’s system is often subtly on alert. Even when nothing is obviously wrong, part of them may stay prepared, scanning, or slightly braced.`,
    );
    expect(safetyRegulation?.sentences[0]).toBe(
      `You may not always notice when you’re tense, because it feels normal. The baseline can be slightly braced, so true relaxation stands out more than tension does.`,
    );

    const griefTransitions = PERSONA_PROFILES.find(profile => profile.key === 'griefTransitions');
    expect(griefTransitions?.intro[0]).toBe(
      `This person is often in between states — something has changed, ended, or shifted, and part of them is still catching up to what that means.`,
    );
    expect(griefTransitions?.sentences[0]).toBe(
      `You may notice that something can be “over” logically but not feel over emotionally. The ending happens first, and the feeling follows later.`,
    );

    const timeRhythms = PERSONA_PROFILES.find(profile => profile.key === 'timeRhythms');
    expect(timeRhythms?.intro[0]).toBe(
      `This person is affected by when things happen, not just what happens. Their capacity, mood, and clarity shift across the day or week in patterns that aren’t always obvious at first.`,
    );
    expect(timeRhythms?.sentences[0]).toBe(
      `You may notice that the same task feels very different depending on when you do it. It’s not always about difficulty — it’s about timing.`,
    );

    const communicationVoice = PERSONA_PROFILES.find(profile => profile.key === 'communicationVoice');
    expect(communicationVoice?.intro[0]).toBe(
      `This person doesn’t just communicate — they often adjust, soften, explain, or hold back depending on how safe it feels to be fully understood.`,
    );
    expect(communicationVoice?.sentences[0]).toBe(
      `You may think carefully about how you say things, not just what you say. Tone, wording, and timing all seem to matter, especially when you’re trying to avoid being misunderstood.`,
    );

    const pleasurePlay = PERSONA_PROFILES.find(profile => profile.key === 'pleasurePlay');
    expect(pleasurePlay?.intro[0]).toBe(
      `This person doesn’t struggle with effort — they struggle more with letting themselves feel good without a reason. Pleasure may feel optional, earned, or easy to overlook.`,
    );
    expect(pleasurePlay?.sentences[0]).toBe(
      `You may notice that you don’t always prioritize things that feel good unless there’s a clear purpose. Enjoyment can quietly fall to the bottom when something else feels more important.`,
    );

    const lifeDirection = PERSONA_PROFILES.find(profile => profile.key === 'lifeDirection');
    expect(lifeDirection?.intro[0]).toBe(
      `This person is not aimless — they’re aware of possibility, but may feel tension between moving forward and needing clarity first.`,
    );
    expect(lifeDirection?.sentences[0]).toBe(
      `You may feel a pull toward change, even if you’re not fully sure what that change looks like yet. The sense of “something needs to shift” can show up before the direction is clear.`,
    );

    const scarcityAbundance = PERSONA_PROFILES.find(profile => profile.key === 'scarcityAbundance');
    expect(scarcityAbundance?.intro[0]).toBe(
      `This person may not just think about resources practically. They may feel resources emotionally — as safety, freedom, risk, pressure, or proof that things are okay.`,
    );
    expect(scarcityAbundance?.sentences[0]).toBe(
      `You may feel calmer when you know there is enough — enough time, enough money, enough support, enough room to breathe. The number itself may matter less than the feeling of not being close to the edge.`,
    );

    const spiritualMeaning = PERSONA_PROFILES.find(profile => profile.key === 'spiritualMeaning');
    expect(spiritualMeaning?.intro[0]).toBe(
      `This person doesn’t just ask what’s happening — they ask what it means. They may look for patterns, purpose, or something that connects their experience into a bigger picture.`,
    );
    expect(spiritualMeaning?.sentences[0]).toBe(
      `You may find yourself searching for meaning in what happens, especially when something feels significant. It’s not enough for it to just occur — you want to understand why it mattered.`,
    );

    const identityGrowth = PERSONA_PROFILES.find(profile => profile.key === 'identityGrowth');
    expect(identityGrowth?.intro).toEqual([]);
    expect(identityGrowth?.sentences[0]).toBe(
      `You may notice that you’re not quite the same person you were before, even if it’s hard to explain exactly what changed. The shift can feel clear internally but harder to describe outwardly.`,
    );

    const familyHome = PERSONA_PROFILES.find(profile => profile.key === 'familyHome');
    expect(familyHome?.intro).toEqual([]);
    expect(familyHome?.sentences[0]).toBe(
      `You may notice that certain reactions feel automatic around family, even if you don’t respond that way in other parts of your life.`,
    );

    const glimmersRegulation = PERSONA_PROFILES.find(profile => profile.key === 'glimmersRegulation');
    expect(glimmersRegulation?.intro).toEqual([]);
    expect(glimmersRegulation?.sentences[0]).toBe(
      `You may not always notice when something small helps you feel better. The shift can be quiet — a little less tension, a little more space.`,
    );

    const creativityExpression = PERSONA_PROFILES.find(profile => profile.key === 'creativityExpression');
    expect(creativityExpression?.intro).toEqual([]);
    expect(creativityExpression?.sentences[0]).toBe(
      `You may feel most connected to yourself when you’re making something, even if it isn’t polished yet. The act of creating gives part of you a place to go.`,
    );

    const valuesIntegrity = PERSONA_PROFILES.find(profile => profile.key === 'valuesIntegrity');
    expect(valuesIntegrity?.intro).toEqual([]);
    expect(valuesIntegrity?.sentences[0]).toBe(
      `You may feel unsettled when something doesn’t match your values, even if everyone else seems fine with it. Your discomfort can be information, not overreaction.`,
    );

    const dreamsSymbols = PERSONA_PROFILES.find(profile => profile.key === 'dreamsSymbols');
    expect(dreamsSymbols?.intro).toEqual([]);
    expect(dreamsSymbols?.sentences[0]).toBe(
      `Your dreams may pick up themes before your waking mind is ready to name them. The images can feel strange, but the emotion underneath often makes sense.`,
    );

    const detachedNonCarrier = PERSONA_PROFILES.find(profile => profile.key === 'detachedNonCarrier');
    expect(detachedNonCarrier?.intro[0]).toBe(
      `This person does not automatically take responsibility for everything around them. They can let situations unfold without immediately stepping in — though sometimes that distance can become avoidance.`,
    );
    expect(detachedNonCarrier?.sentences[0]).toBe(
      `You may be able to let things sit without rushing to fix them. That can protect your energy, but it can also mean some problems grow louder before you choose to engage.`,
    );

    const quickMover = PERSONA_PROFILES.find(profile => profile.key === 'quickMover');
    expect(quickMover?.intro[0]).toBe(
      `This person doesn’t stay with things for long. They tend to move on, redirect, or act forward, sometimes before meaning fully forms.`,
    );
    expect(quickMover?.sentences[0]).toBe(
      `When something happens, you tend to move forward fairly quickly. You don’t always feel the need to sit with it for long, especially if there’s a next step available.`,
    );

    const relationalMinimalist = PERSONA_PROFILES.find(profile => profile.key === 'relationalMinimalist');
    expect(relationalMinimalist?.intro[0]).toBe(
      `This person does not read deeply into subtle relational cues. They rely more on what is said directly than on tone, silence, or implication.`,
    );
    expect(relationalMinimalist?.sentences[0]).toBe(
      `You may take interactions more at face value. If something hasn’t been said clearly, it doesn’t always feel necessary to interpret it.`,
    );

    const immediateExpresser = PERSONA_PROFILES.find(profile => profile.key === 'immediateExpresser');
    expect(immediateExpresser?.intro[0]).toBe(
      `This person tends to externalize quickly. When something is felt, it moves outward — through words, tone, or visible reaction.`,
    );
    expect(immediateExpresser?.sentences[0]).toBe(
      `When something affects you, it tends to come out quickly. You don’t usually hold it in for long before expressing it.`,
    );

    const selectiveHelper = PERSONA_PROFILES.find(profile => profile.key === 'selectiveHelper');
    expect(selectiveHelper?.intro[0]).toBe(
      `This person does not automatically step into caregiving. They tend to choose when and how to help, rather than doing it by default.`,
    );
    expect(selectiveHelper?.sentences[0]).toBe(
      `You don’t feel responsible for everything that needs to be done. You tend to decide what is actually yours before stepping in.`,
    );

    const lowPressureDrifter = PERSONA_PROFILES.find(profile => profile.key === 'lowPressureDrifter');
    expect(lowPressureDrifter?.intro[0]).toBe(
      `This person doesn’t organize life around achievement. They may value ease, flexibility, or freedom more than constant progress.`,
    );
    expect(lowPressureDrifter?.sentences[0]).toBe(
      `You may not feel naturally motivated by pressure. When something starts to feel too demanding, your energy may drop instead of sharpen.`,
    );

    const steadyBaselinePerson = PERSONA_PROFILES.find(profile => profile.key === 'steadyBaselinePerson');
    expect(steadyBaselinePerson?.intro[0]).toBe(
      `This person’s emotions tend to stay fairly consistent. They may not experience dramatic internal swings unless something significant happens.`,
    );
    expect(steadyBaselinePerson?.sentences[0]).toBe(
      `Your emotional state may stay fairly even across the day. Feelings still matter, but they don’t always take over the whole atmosphere.`,
    );

    const easyRester = PERSONA_PROFILES.find(profile => profile.key === 'easyRester');
    expect(easyRester?.intro[0]).toBe(
      `This person can stop more naturally. Rest does not always feel earned, risky, or complicated.`,
    );
    expect(easyRester?.sentences[0]).toBe(
      `You may be able to pause without needing to justify it. Rest can feel like a normal part of life, not something you have to earn first.`,
    );

    const bodyDisconnectedThinker = PERSONA_PROFILES.find(profile => profile.key === 'bodyDisconnectedThinker');
    expect(bodyDisconnectedThinker?.intro[0]).toBe(
      `This person notices thoughts, facts, or plans before physical cues. The body may only get attention once sensations become strong.`,
    );
    expect(bodyDisconnectedThinker?.sentences[0]).toBe(
      `You may understand what is happening before you feel it physically. Your mind picks up the story first, while your body’s signals may arrive later.`,
    );

    const openReceiver = PERSONA_PROFILES.find(profile => profile.key === 'openReceiver');
    expect(openReceiver?.intro[0]).toBe(
      `This person can take in care, kindness, appreciation, and support without needing to immediately earn or repay it.`,
    );
    expect(openReceiver?.sentences[0]).toBe(
      `You may be able to receive care without turning it into a debt. When someone shows up for you, you can let it matter without rushing to balance the scale.`,
    );

    const firmInnerKnower = PERSONA_PROFILES.find(profile => profile.key === 'firmInnerKnower');
    expect(firmInnerKnower?.intro[0]).toBe(
      `This person tends to recognize their limits quickly and does not need much outside confirmation before honoring them.`,
    );
    expect(firmInnerKnower?.sentences[0]).toBe(
      `You may know when something is a no before you can fully explain why. The clarity comes first, and the explanation can come later.`,
    );

    const naturallyUnbracedPerson = PERSONA_PROFILES.find(profile => profile.key === 'naturallyUnbracedPerson');
    expect(naturallyUnbracedPerson?.intro[0]).toBe(
      `This person’s body can settle without constantly scanning. Calm feels familiar, not suspicious.`,
    );
    expect(naturallyUnbracedPerson?.sentences[0]).toBe(
      `You may be able to relax without waiting for something to go wrong. Quiet can feel like quiet, not a warning sign.`,
    );

    const cleanClosureMover = PERSONA_PROFILES.find(profile => profile.key === 'cleanClosureMover');
    expect(cleanClosureMover?.intro[0]).toBe(
      `This person can accept endings more directly. They may move into the next chapter without needing to revisit the old one for long.`,
    );
    expect(cleanClosureMover?.sentences[0]).toBe(
      `You may be able to recognize when something is done and let that be enough. The ending may hurt, but it does not always keep pulling you backward.`,
    );

    const rhythmInsensitivePusher = PERSONA_PROFILES.find(profile => profile.key === 'rhythmInsensitivePusher');
    expect(rhythmInsensitivePusher?.intro[0]).toBe(
      `This person tends to expect the same capacity from themselves regardless of time, energy, season, or cycle.`,
    );
    expect(rhythmInsensitivePusher?.sentences[0]).toBe(
      `You may expect yourself to function the same way at every point in the day. When your energy changes, it can feel like failure instead of rhythm.`,
    );

    const directSpeaker = PERSONA_PROFILES.find(profile => profile.key === 'directSpeaker');
    expect(directSpeaker?.intro[0]).toBe(
      `This person says things plainly and does not usually spend a lot of energy softening, editing, or replaying every word.`,
    );
    expect(directSpeaker?.sentences[0]).toBe(
      `You may say what you mean without needing to build a long explanation around it. Directness feels cleaner than circling the point.`,
    );

    const pleasureNaturalPerson = PERSONA_PROFILES.find(profile => profile.key === 'pleasureNaturalPerson');
    expect(pleasureNaturalPerson?.intro[0]).toBe(
      `This person lets joy, fun, desire, and play exist without needing to justify them first.`,
    );
    expect(pleasureNaturalPerson?.sentences[0]).toBe(
      `You may allow enjoyment without turning it into something productive. If something feels good, that can be enough reason to make room for it.`,
    );

    const presentFocusedPerson = PERSONA_PROFILES.find(profile => profile.key === 'presentFocusedPerson');
    expect(presentFocusedPerson?.intro[0]).toBe(
      `This person is less focused on where life is heading and more grounded in what is directly in front of them.`,
    );
    expect(presentFocusedPerson?.sentences[0]).toBe(
      `You may feel more connected to the current moment than to a distant future. What matters most is often what is happening now, not what it might become.`,
    );

    const resourceTrustingPerson = PERSONA_PROFILES.find(profile => profile.key === 'resourceTrustingPerson');
    expect(resourceTrustingPerson?.intro[0]).toBe(
      `This person tends to trust that resources can be managed, replenished, or figured out without constant bracing.`,
    );
    expect(resourceTrustingPerson?.sentences[0]).toBe(
      `You may not feel anxious about resources unless there is a clear reason. Money, time, or support can matter without taking over your whole nervous system.`,
    );

    const practicalLiteralist = PERSONA_PROFILES.find(profile => profile.key === 'practicalLiteralist');
    expect(practicalLiteralist?.intro[0]).toBe(
      `This person does not automatically search for hidden meaning. They tend to trust what is concrete, observable, and useful.`,
    );
    expect(practicalLiteralist?.sentences[0]).toBe(
      `You may prefer to understand things through what actually happened rather than what they might symbolize.`,
    );

    const stableSelfConceptPerson = PERSONA_PROFILES.find(profile => profile.key === 'stableSelfConceptPerson');
    expect(stableSelfConceptPerson?.intro[0]).toBe(
      `This person experiences themselves as fairly consistent over time, even as life changes around them.`,
    );
    expect(stableSelfConceptPerson?.sentences[0]).toBe(
      `You may feel like the same core person across different seasons. Circumstances change, but your sense of self stays recognizable.`,
    );

    const individuatedFamilyMember = PERSONA_PROFILES.find(profile => profile.key === 'individuatedFamilyMember');
    expect(individuatedFamilyMember?.intro[0]).toBe(
      `This person can stay themselves around family. Old roles don’t automatically take over.`,
    );
    expect(individuatedFamilyMember?.sentences[0]).toBe(
      `You may notice that you don’t shift as much around family as you used to. You can stay closer to who you are now, even in familiar environments.`,
    );

    const bigShiftNoticer = PERSONA_PROFILES.find(profile => profile.key === 'bigShiftNoticer');
    expect(bigShiftNoticer?.intro[0]).toBe(
      `This person notices change mostly when it is obvious or intense, not subtle.`,
    );
    expect(bigShiftNoticer?.sentences[0]).toBe(
      `You may not register small shifts in how you feel. Change tends to become noticeable only when it’s clear or strong.`,
    );

    const practicalImplementer = PERSONA_PROFILES.find(profile => profile.key === 'practicalImplementer');
    expect(practicalImplementer?.intro[0]).toBe(
      `This person focuses more on function, execution, and usefulness than on emotional or creative expression.`,
    );
    expect(practicalImplementer?.sentences[0]).toBe(
      `You may focus on what works rather than how something feels. Practical results tend to matter more than creative exploration.`,
    );

    const flexiblePragmatist = PERSONA_PROFILES.find(profile => profile.key === 'flexiblePragmatist');
    expect(flexiblePragmatist?.intro[0]).toBe(
      `This person can tolerate ambiguity, compromise, and “good enough” without strong internal conflict.`,
    );
    expect(flexiblePragmatist?.sentences[0]).toBe(
      `You may be able to adapt your standards depending on the situation. What matters can shift based on context.`,
    );

    const wakingLifeProcessor = PERSONA_PROFILES.find(profile => profile.key === 'wakingLifeProcessor');
    expect(wakingLifeProcessor?.intro[0]).toBe(
      `This person processes experience primarily through real-life events, thoughts, and conversations, not symbolic or dream-based meaning.`,
    );
    expect(wakingLifeProcessor?.sentences[0]).toBe(
      `You may make sense of things through what happens during the day, rather than through dreams or symbolic patterns.`,
    );

    const responsibleNonCarrier = PERSONA_PROFILES.find(profile => profile.key === 'responsibleNonCarrier');
    expect(responsibleNonCarrier?.intro[0]).toBe(
      `Notices what needs care, but doesn’t always step in.`,
    );
    expect(responsibleNonCarrier?.sentences[0]).toBe(
      `You may notice what needs attention without automatically making it your job. That can be a real shift if responsibility used to feel immediate.`,
    );

    const deepProcessorWhoMovesFast = PERSONA_PROFILES.find(profile => profile.key === 'deepProcessorWhoMovesFast');
    expect(deepProcessorWhoMovesFast?.intro[0]).toBe(
      `Wants meaning, but also gets tired of sitting in the same feeling.`,
    );
    expect(deepProcessorWhoMovesFast?.sentences[0]).toBe(
      `You may want to understand something deeply, then suddenly reach a point where you cannot keep circling it anymore.`,
    );

    const relationalTrackerWhoActsDetached = PERSONA_PROFILES.find(profile =>
      profile.key === 'relationalTrackerWhoActsDetached',
    );
    expect(relationalTrackerWhoActsDetached?.intro[0]).toBe(
      `Notices subtle shifts, but may pretend not to care.`,
    );
    expect(relationalTrackerWhoActsDetached?.sentences[0]).toBe(
      `You may pick up on changes in someone’s tone while acting like it didn’t affect you.`,
    );

    const quietExpresser = PERSONA_PROFILES.find(profile => profile.key === 'quietExpresser');
    expect(quietExpresser?.intro[0]).toBe(
      `Feels intensely, but the words often come later.`,
    );
    expect(quietExpresser?.sentences[0]).toBe(
      `You may know something affected you before you know how to say it.`,
    );

    const selectiveCaregiver = PERSONA_PROFILES.find(profile => profile.key === 'selectiveCaregiver');
    expect(selectiveCaregiver?.intro[0]).toBe(
      `Cares deeply, but is learning not to overextend automatically.`,
    );
    expect(selectiveCaregiver?.sentences[0]).toBe(
      `You may still care with your whole heart, but you are becoming more careful about what you take on.`,
    );

    const ambitiousDrifter = PERSONA_PROFILES.find(profile => profile.key === 'ambitiousDrifter');
    expect(ambitiousDrifter?.intro[0]).toBe(
      `Wants to succeed, but rigid pressure shuts them down.`,
    );
    expect(ambitiousDrifter?.sentences[0]).toBe(
      `You may have big hopes, but too much structure can make them feel heavy instead of exciting.`,
    );

    const steadyPersonWithSuddenWeather = PERSONA_PROFILES.find(profile =>
      profile.key === 'steadyPersonWithSuddenWeather',
    );
    expect(steadyPersonWithSuddenWeather?.intro[0]).toBe(
      `Usually even, but certain triggers change everything quickly.`,
    );
    expect(steadyPersonWithSuddenWeather?.sentences[0]).toBe(
      `Most of the time, you may feel fairly steady — until something specific cuts through that steadiness.`,
    );

    const restAwareOverrider = PERSONA_PROFILES.find(profile => profile.key === 'restAwareOverrider');
    expect(restAwareOverrider?.intro[0]).toBe(
      `Knows rest matters, but still overrides it when things feel unfinished.`,
    );
    expect(restAwareOverrider?.sentences[0]).toBe(
      `You may know you need rest and still keep going because something feels unresolved.`,
    );

    const bodyAwareThinker = PERSONA_PROFILES.find(profile => profile.key === 'bodyAwareThinker');
    expect(bodyAwareThinker?.intro[0]).toBe(
      `Notices body signals, then quickly tries to explain them.`,
    );
    expect(bodyAwareThinker?.sentences[0]).toBe(
      `You may notice a body signal and immediately start asking what it means.`,
    );

    const openReceiverWhoStillBalancesScale = PERSONA_PROFILES.find(profile =>
      profile.key === 'openReceiverWhoStillBalancesScale',
    );
    expect(openReceiverWhoStillBalancesScale?.intro[0]).toBe(
      `Can receive care, but still feels the pull to give something back.`,
    );
    expect(openReceiverWhoStillBalancesScale?.sentences[0]).toBe(
      `You may be able to let care in, but part of you still wants to return it quickly.`,
    );

    const firmBoundaryDoubter = PERSONA_PROFILES.find(profile => profile.key === 'firmBoundaryDoubter');
    expect(firmBoundaryDoubter?.intro[0]).toBe(
      `Knows their limit, but second-guesses it afterward.`,
    );
    expect(firmBoundaryDoubter?.sentences[0]).toBe(
      `You may feel clear about a boundary in the moment, then replay it later wondering if you were too much.`,
    );

    const calmBracedPerson = PERSONA_PROFILES.find(profile => profile.key === 'calmBracedPerson');
    expect(calmBracedPerson?.intro[0]).toBe(
      `Looks calm, but part of them stays prepared underneath.`,
    );
    expect(calmBracedPerson?.sentences[0]).toBe(
      `You may appear settled on the outside while something in you stays slightly ready.`,
    );

    const closureSeekerWhoStillGrieves = PERSONA_PROFILES.find(profile =>
      profile.key === 'closureSeekerWhoStillGrieves',
    );
    expect(closureSeekerWhoStillGrieves?.intro[0]).toBe(
      `Moves forward, but certain things return later.`,
    );
    expect(closureSeekerWhoStillGrieves?.sentences[0]).toBe(
      `You may want closure so you can move on, but some feelings don’t follow that timeline.`,
    );

    const rhythmAwarePusher = PERSONA_PROFILES.find(profile => profile.key === 'rhythmAwarePusher');
    expect(rhythmAwarePusher?.intro[0]).toBe(
      `Knows timing matters, but still overrides it.`,
    );
    expect(rhythmAwarePusher?.sentences[0]).toBe(
      `You may understand your energy patterns and still expect yourself to perform outside them.`,
    );

    const directOverexplainer = PERSONA_PROFILES.find(profile => profile.key === 'directOverexplainer');
    expect(directOverexplainer?.intro[0]).toBe(
      `Values clarity, but adds layers when something matters.`,
    );
    expect(directOverexplainer?.sentences[0]).toBe(
      `You may speak clearly, but when something is important, you add more detail to make sure nothing is misunderstood.`,
    );

    const pleasureAllowedAchiever = PERSONA_PROFILES.find(profile => profile.key === 'pleasureAllowedAchiever');
    expect(pleasureAllowedAchiever?.intro[0]).toBe(
      `Enjoys pleasure, but still ties it to completion or productivity.`,
    );
    expect(pleasureAllowedAchiever?.sentences[0]).toBe(
      `You may let yourself enjoy things, but it feels easier once something important is finished.`,
    );

    const presentFocusedDreamer = PERSONA_PROFILES.find(profile => profile.key === 'presentFocusedDreamer');
    expect(presentFocusedDreamer?.intro[0]).toBe(
      `Lives in the moment, but occasionally pulled into big future questions.`,
    );
    expect(presentFocusedDreamer?.sentences[0]).toBe(
      `You may stay grounded in your current life most of the time, but certain decisions suddenly open up bigger questions.`,
    );

    const resourceTrustingWorrier = PERSONA_PROFILES.find(profile => profile.key === 'resourceTrustingWorrier');
    expect(resourceTrustingWorrier?.intro[0]).toBe(
      `Usually trusts things will work out, but still gets activated under pressure.`,
    );
    expect(resourceTrustingWorrier?.sentences[0]).toBe(
      `You may generally believe things can be handled, but certain situations still bring up strong concern.`,
    );

    const spiritualPracticalist = PERSONA_PROFILES.find(profile => profile.key === 'spiritualPracticalist');
    expect(spiritualPracticalist?.intro[0]).toBe(
      `Sees meaning, but doesn’t want it to replace reality.`,
    );
    expect(spiritualPracticalist?.sentences[0]).toBe(
      `You may feel that things matter deeply, while still wanting to deal with them in practical ways.`,
    );

    const stableSelfInTransition = PERSONA_PROFILES.find(profile => profile.key === 'stableSelfInTransition');
    expect(stableSelfInTransition?.intro[0]).toBe(
      `Feels consistent internally, but still navigating real change.`,
    );
    expect(stableSelfInTransition?.sentences[0]).toBe(
      `You may feel like the same person at your core, even while parts of your life are shifting.`,
    );

    const individuatedFamilyCarrier = PERSONA_PROFILES.find(profile => profile.key === 'individuatedFamilyCarrier');
    expect(individuatedFamilyCarrier?.intro[0]).toBe(
      `Can stay themselves around family, but old roles still pull at them.`,
    );
    expect(individuatedFamilyCarrier?.sentences[0]).toBe(
      `You may feel more like yourself around family than you used to, while still noticing old roles trying to come back online.`,
    );

    const subtleGlimmerSkeptic = PERSONA_PROFILES.find(profile => profile.key === 'subtleGlimmerSkeptic');
    expect(subtleGlimmerSkeptic?.intro[0]).toBe(
      `Notices small moments of relief, but doesn’t fully trust them yet.`,
    );
    expect(subtleGlimmerSkeptic?.sentences[0]).toBe(
      `You may notice a small moment of calm, then quickly wonder if it will last.`,
    );

    const creativeImplementer = PERSONA_PROFILES.find(profile => profile.key === 'creativeImplementer');
    expect(creativeImplementer?.intro[0]).toBe(
      `Cares about beauty and expression, but also wants things to work.`,
    );
    expect(creativeImplementer?.sentences[0]).toBe(
      `You may care deeply about how something feels, but you also need it to function in real life.`,
    );

    const valuesDrivenPragmatist = PERSONA_PROFILES.find(profile => profile.key === 'valuesDrivenPragmatist');
    expect(valuesDrivenPragmatist?.intro[0]).toBe(
      `Cares deeply about integrity, but can tolerate some compromise.`,
    );
    expect(valuesDrivenPragmatist?.sentences[0]).toBe(
      `You may care about doing what feels right, while still understanding that real life sometimes requires tradeoffs.`,
    );

    const symbolicRealist = PERSONA_PROFILES.find(profile => profile.key === 'symbolicRealist');
    expect(symbolicRealist?.intro[0]).toBe(
      `Notices patterns and symbols, but wants them grounded in real life.`,
    );
    expect(symbolicRealist?.sentences[0]).toBe(
      `You may notice symbols, dreams, or patterns, but you still want them connected to something real.`,
    );

    const unawareOverEngager = PERSONA_PROFILES.find(profile => profile.key === 'unawareOverEngager');
    expect(unawareOverEngager?.intro[0]).toBe(
      `(Doesn’t notice responsibility early, but once they do, they may take on too much)`,
    );
    expect(unawareOverEngager?.sentences[0]).toBe(
      `You may not notice what needs attention right away, but when you do, you can quickly feel pulled into it.`,
    );

    const fastMoverWhoCirclesBack = PERSONA_PROFILES.find(profile => profile.key === 'fastMoverWhoCirclesBack');
    expect(fastMoverWhoCirclesBack?.intro[0]).toBe(
      `(Moves on quickly, but things return later)`,
    );
    expect(fastMoverWhoCirclesBack?.sentences[0]).toBe(
      `You may move on from something quickly, then find yourself thinking about it again later.`,
    );

    const detachedConnector = PERSONA_PROFILES.find(profile => profile.key === 'detachedConnector');
    expect(detachedConnector?.intro[0]).toBe(
      `(Doesn’t track much, but occasionally becomes suddenly aware or reactive)`,
    );
    expect(detachedConnector?.sentences[0]).toBe(
      `You may not notice subtle shifts in connection most of the time, but certain moments suddenly stand out.`,
    );

    const immediateButUnsureExpresser = PERSONA_PROFILES.find(profile =>
      profile.key === 'immediateButUnsureExpresser',
    );
    expect(immediateButUnsureExpresser?.intro[0]).toBe(
      `(Speaks quickly, but may not fully understand what they feel yet)`,
    );
    expect(immediateButUnsureExpresser?.sentences[0]).toBe(
      `You may express something right away, then realize later you didn’t fully understand it.`,
    );

    const overextendedGiver = PERSONA_PROFILES.find(profile => profile.key === 'overextendedGiver');
    expect(overextendedGiver?.intro[0]).toBe(
      `(Doesn’t choose carefully — tends to give first, then notice the cost)`,
    );
    expect(overextendedGiver?.sentences[0]).toBe(
      `You may step in to help before checking whether you actually have the capacity.`,
    );

    const pressureFueledAchiever = PERSONA_PROFILES.find(profile => profile.key === 'pressureFueledAchiever');
    expect(pressureFueledAchiever?.intro[0]).toBe(
      `Thrives under structure and expectations, but may not know who they are without pressure.`,
    );
    expect(pressureFueledAchiever?.sentences[0]).toBe(
      `You may feel most motivated when expectations are clear and the stakes are real.`,
    );

    const emotionallyVariableSteadyOne = PERSONA_PROFILES.find(profile =>
      profile.key === 'emotionallyVariableSteadyOne',
    );
    expect(emotionallyVariableSteadyOne?.intro[0]).toBe(
      `Feels a lot internally, but still appears steady and consistent externally.`,
    );
    expect(emotionallyVariableSteadyOne?.sentences[0]).toBe(
      `Your emotions may shift more than people realize, because you don’t always show the full change outwardly.`,
    );

    const restlessRester = PERSONA_PROFILES.find(profile => profile.key === 'restlessRester');
    expect(restlessRester?.intro[0]).toBe(
      `Stops often enough, but does not always settle into rest.`,
    );
    expect(restlessRester?.sentences[0]).toBe(
      `You may pause physically while your mind keeps moving.`,
    );

    const thoughtFirstBodyListener = PERSONA_PROFILES.find(profile => profile.key === 'thoughtFirstBodyListener');
    expect(thoughtFirstBodyListener?.intro[0]).toBe(
      `Starts in the mind, but eventually uses the body as confirmation.`,
    );
    expect(thoughtFirstBodyListener?.sentences[0]).toBe(
      `You may understand something mentally first, then check whether your body agrees.`,
    );

    const independentReceiver = PERSONA_PROFILES.find(profile => profile.key === 'independentReceiver');
    expect(independentReceiver?.intro[0]).toBe(
      `Can receive care, but also needs to feel independent while receiving it.`,
    );
    expect(independentReceiver?.sentences[0]).toBe(
      `You may accept support more easily when it does not make you feel dependent.`,
    );

    const boundaryAvoidantHarmonizer = PERSONA_PROFILES.find(profile =>
      profile.key === 'boundaryAvoidantHarmonizer',
    );
    expect(boundaryAvoidantHarmonizer?.intro[0]).toBe(
      `(Avoids setting boundaries to keep things smooth, then feels it later)`,
    );
    expect(boundaryAvoidantHarmonizer?.sentences[0]).toBe(
      `You may avoid setting a clear boundary in the moment to keep things comfortable.`,
    );

    const fullySettledResponder = PERSONA_PROFILES.find(profile => profile.key === 'fullySettledResponder');
    expect(fullySettledResponder?.intro[0]).toBe(
      `(Doesn’t brace underneath — but may underprepare or miss early signals)`,
    );
    expect(fullySettledResponder?.sentences[0]).toBe(
      `You may feel genuinely relaxed in situations where others stay slightly on alert.`,
    );

    const griefAvoidantMover = PERSONA_PROFILES.find(profile => profile.key === 'griefAvoidantMover');
    expect(griefAvoidantMover?.intro[0]).toBe(
      `(Moves forward quickly and avoids revisiting what’s unresolved)`,
    );
    expect(griefAvoidantMover?.sentences[0]).toBe(
      `You may move on from things quickly, especially when staying would feel heavy.`,
    );

    const rhythmFollower = PERSONA_PROFILES.find(profile => profile.key === 'rhythmFollower');
    expect(rhythmFollower?.intro[0]).toBe(
      `(Understands timing and fully adapts to it — sometimes at the cost of consistency)`,
    );
    expect(rhythmFollower?.sentences[0]).toBe(
      `You may adjust your actions based on how you feel in the moment.`,
    );

    const minimalCommunicator = PERSONA_PROFILES.find(profile => profile.key === 'minimalCommunicator');
    expect(minimalCommunicator?.intro[0]).toBe(
      `(Says only what’s necessary — may under-communicate when more clarity would help)`,
    );
    expect(minimalCommunicator?.sentences[0]).toBe(
      `You may prefer to keep communication simple and direct, without adding extra detail.`,
    );

    const pleasureAvoidantProducer = PERSONA_PROFILES.find(profile => profile.key === 'pleasureAvoidantProducer');
    expect(pleasureAvoidantProducer?.intro[0]).toBe(
      `(Defaults to productivity and delays or minimizes pleasure)`,
    );
    expect(pleasureAvoidantProducer?.sentences[0]).toBe(
      `You may prioritize getting things done before allowing yourself to enjoy anything.`,
    );

    const futureOrientedEscaper = PERSONA_PROFILES.find(profile => profile.key === 'futureOrientedEscaper');
    expect(futureOrientedEscaper?.intro[0]).toBe(
      `(Lives in future thinking, sometimes at the expense of the present)`,
    );
    expect(futureOrientedEscaper?.sentences[0]).toBe(
      `You may think about what’s next more than what’s happening now.`,
    );

    const scarcityDrivenPlanner = PERSONA_PROFILES.find(profile => profile.key === 'scarcityDrivenPlanner');
    expect(scarcityDrivenPlanner?.intro[0]).toBe(
      `(Leads with caution and preparation rather than trust)`,
    );
    expect(scarcityDrivenPlanner?.sentences[0]).toBe(
      `You may think ahead to make sure nothing runs out or falls short.`,
    );

    const meaningSeekingEscapist = PERSONA_PROFILES.find(profile => profile.key === 'meaningSeekingEscapist');
    expect(meaningSeekingEscapist?.intro[0]).toBe(
      `(Leans into meaning to avoid concrete reality or action)`,
    );
    expect(meaningSeekingEscapist?.sentences[0]).toBe(
      `You may look for deeper meaning before dealing with what is directly in front of you.`,
    );

    const identityReinventor = PERSONA_PROFILES.find(profile => profile.key === 'identityReinventor');
    expect(identityReinventor?.intro[0]).toBe(
      `(Adapts identity quickly, sometimes losing continuity)`,
    );
    expect(identityReinventor?.sentences[0]).toBe(
      `You may shift how you see yourself depending on what’s happening around you.`,
    );

    const familyAbsorbedAdult = PERSONA_PROFILES.find(profile => profile.key === 'familyAbsorbedAdult');
    expect(familyAbsorbedAdult?.intro).toEqual([]);
    expect(familyAbsorbedAdult?.sentences[0]).toBe(
      `You may feel like family dynamics pull you in before you realize it’s happening.`,
    );

    const subtleShiftNoticer = PERSONA_PROFILES.find(profile => profile.key === 'subtleShiftNoticer');
    expect(subtleShiftNoticer?.intro).toEqual([]);
    expect(subtleShiftNoticer?.sentences[0]).toBe(
      `You may notice small changes before they become obvious.`,
    );

    const expressiveCreator = PERSONA_PROFILES.find(profile => profile.key === 'expressiveCreator');
    expect(expressiveCreator?.intro).toEqual([]);
    expect(expressiveCreator?.sentences[0]).toBe(
      `You may create for expression first, even before you know what it’s for.`,
    );

    const integrityPurist = PERSONA_PROFILES.find(profile => profile.key === 'integrityPurist');
    expect(integrityPurist?.intro).toEqual([]);
    expect(integrityPurist?.sentences[0]).toBe(
      `You may feel internal conflict quickly when something does not match your values.`,
    );

    const pureSymbolicProcessor = PERSONA_PROFILES.find(profile => profile.key === 'pureSymbolicProcessor');
    expect(pureSymbolicProcessor?.intro).toEqual([]);
    expect(pureSymbolicProcessor?.sentences[0]).toBe(
      `You may understand yourself through images, dreams, patterns, and symbols before direct explanation.`,
    );
  });

  it('selects exactly one primary persona from the canonical profiles', () => {
    const signals: UserSignal[] = [
      signal('responsibility_weight', 'journal'),
      signal('mental_load', 'journal'),
      signal('caretaking_pressure', 'triggerLog'),
      signal('overfunctioning', 'reflectionBank'),
      signal('always_on', 'journal'),
      signal('preparedness', 'dailyCheckIn'),
      signal('invisible_labor', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'responsibility_care_002_capable_one',
        title: 'The Capable One Pattern',
        category: 'responsibilityCare',
        score: 0.82,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal'],
        evidence: [],
        lastSeenAt: today,
      },
      {
        patternKey: 'rest_capacity_002_same_load_less_fuel',
        title: 'The Same Load, Less Fuel',
        category: 'restCapacity',
        score: 0.49,
        confidence: 'emerging',
        movement: 'new',
        timeframeDays: 30,
        sources: ['journal'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('overResponsibleStabilizer');
    expect(selected?.title).toBe('The Over-Responsible Stabilizer');
    expect(selected?.selectedSentence).toBe(
      `When things feel uncertain, you seem to look for the part you can control. That may help you feel less helpless, but it can also make you responsible for calming situations that were never fully yours to manage.`,
    );
  });

  it('can select Boundaries & Self-Trust as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('boundary_rebuilding', 'journal'),
      signal('boundary_guilt', 'journal'),
      signal('self_trust_growth', 'reflectionBank'),
      signal('inner_authority', 'triggerLog'),
      signal('says_no', 'journal'),
      signal('limits_tested', 'dailyCheckIn'),
      signal('overexplaining', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'boundaries_005_inner_authority',
        title: 'The Inner Authority Pattern',
        category: 'boundariesSelfTrust',
        score: 0.84,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('boundariesSelfTrust');
    expect(selected?.title).toBe('Boundaries & Self-Trust');
    expect(selected?.sentences).toContain(
      `Self-trust may not arrive as total certainty. Sometimes it is just the quiet willingness to take your own discomfort seriously.`,
    );
  });

  it('can select Safety & Regulation as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('always_on', 'journal'),
      signal('preparedness', 'dailyCheckIn'),
      signal('calm_bracing', 'reflectionBank'),
      signal('calm_is_new', 'journal'),
      signal('numbness_vs_calm', 'bodyMap'),
      signal('somatic_safety', 'bodyMap'),
      signal('quiet_safety', 'glimmerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'safety_regulation_001_calm_bracing',
        title: 'When Calm Still Feels Watchful',
        category: 'safetyRegulation',
        score: 0.86,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'bodyMap'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('safetyRegulation');
    expect(selected?.title).toBe('Safety & Regulation');
    expect(selected?.sentences).toContain(
      `Feeling safe may not come from convincing yourself things are okay. It may come from repeated experiences where nothing goes wrong and your body slowly starts to believe it.`,
    );
  });

  it('can select Grief & Transitions as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('gratitude_and_grief', 'journal'),
      signal('chapter_shift', 'journal'),
      signal('dream_loss', 'dream'),
      signal('identity_rewriting', 'reflectionBank'),
      signal('old_story_loosening', 'journal'),
      signal('transformation_season', 'dailyCheckIn'),
      signal('longing', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'grief_transitions_002_chapter_shift',
        title: 'The Chapter Shift',
        category: 'griefTransitions',
        score: 0.87,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'dream'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('griefTransitions');
    expect(selected?.title).toBe('Grief & Transitions');
    expect(selected?.sentences).toContain(
      `Transitions may feel less like a clear step and more like a gradual shift. You may already be changing, even if it doesn’t feel fully complete yet.`,
    );
  });

  it('can select Time & Rhythms as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('time_scarcity', 'journal'),
      signal('high_energy', 'dailyCheckIn'),
      signal('low_energy', 'dailyCheckIn'),
      signal('capacity_strain', 'triggerLog'),
      signal('low_capacity', 'triggerLog'),
      signal('energy_scarcity', 'journal'),
      signal('ritual_regulation', 'reflectionBank'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'time_rhythms_002_energy_window',
        title: 'Energy Windows',
        category: 'timeRhythms',
        score: 0.88,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'dailyCheckIn'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('timeRhythms');
    expect(selected?.title).toBe('Time & Rhythms');
    expect(selected?.sentences).toContain(
      `You may not need more discipline as much as you need better alignment with your own patterns. When timing fits, things tend to move more smoothly.`,
    );
  });

  it('can select Communication & Voice as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('need_for_exact_words', 'journal'),
      signal('voice_emerging', 'reflectionBank'),
      signal('repair_need', 'relationshipMirror'),
      signal('overexplaining', 'relationshipMirror'),
      signal('truth_telling', 'journal'),
      signal('expression_need', 'glimmerLog'),
      signal('tone_sensitivity', 'relationshipMirror'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'communication_voice_001_exact_words',
        title: 'The Exact Words Pattern',
        category: 'communicationVoice',
        score: 0.89,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'relationshipMirror'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('communicationVoice');
    expect(selected?.title).toBe('Communication & Voice');
    expect(selected?.sentences).toContain(
      `Your voice may feel clearest in environments where you don’t have to manage how it will be taken. When you don’t have to adjust as much, what you say tends to come more naturally.`,
    );
  });

  it('can select Pleasure & Play as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('play_starved', 'journal'),
      signal('joy_tolerance', 'glimmerLog'),
      signal('play_glimmer', 'glimmerLog'),
      signal('laughter_glimmer', 'glimmerLog'),
      signal('creative_aliveness', 'reflectionBank'),
      signal('restorative_moment', 'dailyCheckIn'),
      signal('body_lightness', 'bodyMap'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'pleasure_play_001_play_starved',
        title: 'Play-Starved Aliveness',
        category: 'pleasurePlay',
        score: 0.9,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'glimmerLog'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('pleasurePlay');
    expect(selected?.title).toBe('Pleasure & Play');
    expect(selected?.sentences).toContain(
      `Pleasure may not be something you lack — it may be something you don’t always give space to. When it’s allowed, even briefly, it tends to show up naturally.`,
    );
  });

  it('can select Life Direction as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('future_self_orientation', 'journal'),
      signal('decision_uncertainty', 'journal'),
      signal('identity_rewriting', 'reflectionBank'),
      signal('chapter_shift', 'journal'),
      signal('purpose_signal', 'reflectionBank'),
      signal('growth_edge', 'dailyCheckIn'),
      signal('wants_to_build', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'life_direction_001_future_self',
        title: 'Future Self Orientation',
        category: 'lifeDirection',
        score: 0.91,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'reflectionBank'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('lifeDirection');
    expect(selected?.title).toBe('Life Direction');
    expect(selected?.sentences).toContain(
      `Direction may not come from finding the perfect path. It may come from paying attention to what keeps pulling your attention back, even when you try to ignore it.`,
    );
  });

  it('can select Scarcity & Abundance as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('scarcity_scanning', 'journal'),
      signal('enoughness', 'glimmerLog'),
      signal('fear_of_loss', 'journal'),
      signal('energy_scarcity', 'reflectionBank'),
      signal('time_scarcity', 'journal'),
      signal('support_abundance_shift', 'glimmerLog'),
      signal('receiving_openness', 'glimmerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'scarcity_001_scarcity_scanner',
        title: 'Scarcity Scanner',
        category: 'scarcityAbundance',
        score: 0.92,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'glimmerLog'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('scarcityAbundance');
    expect(selected?.title).toBe('Scarcity & Abundance');
    expect(selected?.sentences).toContain(
      `Your sense of “enough” may be emotional as much as financial. Sometimes the question underneath isn’t “Do I have enough?” but “Can I finally stop worrying?”`,
    );
  });

  it('can select Spiritual Meaning as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('faith_meaning', 'journal'),
      signal('spiritual_depth', 'reflectionBank'),
      signal('purpose_signal', 'reflectionBank'),
      signal('meaning_making', 'journal'),
      signal('pattern_recognition', 'journal'),
      signal('ordinary_sacred', 'glimmerLog'),
      signal('hope', 'dailyCheckIn'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'spiritual_meaning_001_faith_meaning',
        title: 'Faith Meaning',
        category: 'spiritualMeaning',
        score: 0.93,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'reflectionBank'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('spiritualMeaning');
    expect(selected?.title).toBe('Spiritual Meaning');
    expect(selected?.sentences).toContain(
      `Meaning may not come from one clear answer. It may come from paying attention to what keeps returning, what feels real to you, and what continues to matter over time.`,
    );
  });

  it('can select Identity & Growth as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('identity_rewriting', 'journal'),
      signal('self_definition', 'reflectionBank'),
      signal('old_story_loosening', 'journal'),
      signal('chapter_shift', 'journal'),
      signal('transformation_season', 'dailyCheckIn'),
      signal('growth_edge', 'reflectionBank'),
      signal('future_self_orientation', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'identity_010_between_worlds',
        title: 'Between Worlds',
        category: 'identityGrowth',
        score: 0.94,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'reflectionBank'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('identityGrowth');
    expect(selected?.title).toBe('Identity & Growth');
    expect(selected?.sentences).toContain(
      `Becoming someone new may not feel like gaining something — it may feel like letting go of what used to define you.`,
    );
  });

  it('can select Family & Home as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('family_pattern_awareness', 'journal'),
      signal('family_loyalty_tension', 'relationshipMirror'),
      signal('home_as_safety', 'journal'),
      signal('rooting_need', 'reflectionBank'),
      signal('protective_care', 'triggerLog'),
      signal('breaks_old_pattern', 'journal'),
      signal('responsibility_weight', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'family_001_pattern_awareness',
        title: 'Family Pattern Awareness',
        category: 'familyHome',
        score: 0.94,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'relationshipMirror'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('familyHome');
    expect(selected?.title).toBe('Family & Home');
    expect(selected?.sentences).toContain(
      `Home may not just be a place — it may be a set of feelings your body recognizes, even when your mind has moved on.`,
    );
  });

  it('can select Glimmers & Regulation as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('glimmer_softening', 'glimmerLog'),
      signal('quiet_safety', 'glimmerLog'),
      signal('nature_regulation', 'glimmerLog'),
      signal('beauty_glimmer', 'glimmerLog'),
      signal('connection_glimmer', 'relationshipMirror'),
      signal('calm_is_new', 'journal'),
      signal('body_lightness', 'bodyMap'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'glimmers_001_quiet_relief',
        title: 'What Actually Softens You',
        category: 'glimmersRegulation',
        score: 0.94,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['glimmerLog', 'bodyMap'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('glimmersRegulation');
    expect(selected?.title).toBe('Glimmers & Regulation');
    expect(selected?.sentences).toContain(
      `Paying attention to what helps you settle, even slightly, may give you more information than focusing only on what feels wrong.`,
    );
  });

  it('can select Creativity & Expression as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('creative_processing', 'journal'),
      signal('creative_aliveness', 'reflectionBank'),
      signal('expression_need', 'journal'),
      signal('creative_block', 'triggerLog'),
      signal('vision_gap', 'journal'),
      signal('creative_standards', 'reflectionBank'),
      signal('voice_emerging', 'glimmerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'creativity_001_creative_alchemy',
        title: 'Creative Alchemy',
        category: 'creativityExpression',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'reflectionBank'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('creativityExpression');
    expect(selected?.title).toBe('Creativity & Expression');
    expect(selected?.sentences).toContain(
      `Your creative voice may get stronger when you stop trying to make it sound like anyone else’s. The more honest it feels, the more alive it becomes.`,
    );
  });

  it('can select Values & Integrity as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('justice_sensitivity', 'journal'),
      signal('fairness_need', 'journal'),
      signal('integrity_cost', 'reflectionBank'),
      signal('moral_weight', 'journal'),
      signal('values_conflict', 'triggerLog'),
      signal('truth_telling', 'relationshipMirror'),
      signal('truth_over_harmony', 'relationshipMirror'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'values_001_justice_advocate',
        title: 'Justice Advocate',
        category: 'valuesIntegrity',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'relationshipMirror'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('valuesIntegrity');
    expect(selected?.title).toBe('Values & Integrity');
    expect(selected?.sentences).toContain(
      `Your inner compass may not always give you the easiest answer, but it tends to point toward the answer you can live with.`,
    );
  });

  it('can select Dreams & Symbols as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('dream_unfinished_processing', 'dream'),
      signal('dream_repeated_symbol', 'dream'),
      signal('dream_emotional_tone', 'dream'),
      signal('dream_after_stress', 'dream'),
      signal('dream_home', 'dream'),
      signal('dream_searching', 'dream'),
      signal('pattern_recognition', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'dreams_003_repeated_symbol',
        title: 'Repeated Dream Symbol',
        category: 'dreamsSymbols',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['dream', 'journal'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('dreamsSymbols');
    expect(selected?.title).toBe('Dreams & Symbols');
    expect(selected?.sentences).toContain(
      `Not every dream needs to be decoded. Sometimes the most useful question is not “What does this mean?” but “What feeling did it leave behind?”`,
    );
  });

  it('can select The Detached Non-Carrier as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('peace_boundary', 'journal'),
      signal('autonomy_need', 'journal'),
      signal('choosing_self', 'reflectionBank'),
      signal('less_explaining', 'relationshipMirror'),
      signal('boundary_rebuilding', 'journal'),
      signal('self_trust_growth', 'glimmerLog'),
      signal('quiet_safety', 'glimmerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'boundaries_004_peace_boundary',
        title: 'The Peace Boundary',
        category: 'boundariesSelfTrust',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'glimmerLog'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('detachedNonCarrier');
    expect(selected?.title).toBe('The Detached Non-Carrier');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to not over-carry. The growth edge is knowing when distance is wisdom — and when care is asking you to come closer.`,
    );
  });

  it('can select The Quick Mover as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('action_forward_processing', 'journal'),
      signal('move_on_orientation', 'journal'),
      signal('what_now_focus', 'reflectionBank'),
      signal('quick_recovery', 'dailyCheckIn'),
      signal('present_focus', 'journal'),
      signal('lets_it_pass', 'journal'),
      signal('high_energy', 'dailyCheckIn'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'cognitive_009_action_forward_processing',
        title: 'Action Forward Processing',
        category: 'cognitiveStyle',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'dailyCheckIn'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('quickMover');
    expect(selected?.title).toBe('The Quick Mover');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to keep moving. The growth edge is noticing when something needs more attention before you leave it behind.`,
    );
  });

  it('can select The Relational Minimalist as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('face_value_relating', 'relationshipMirror'),
      signal('direct_communication_preference', 'relationshipMirror'),
      signal('silence_neutral', 'journal'),
      signal('low_relational_tracking', 'journal'),
      signal('low_reassurance_need', 'reflectionBank'),
      signal('clear_over_implied', 'relationshipMirror'),
      signal('low_stress', 'dailyCheckIn'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'relationships_012_face_value_relating',
        title: 'Face Value Relating',
        category: 'relationships',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'relationshipMirror'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('relationalMinimalist');
    expect(selected?.title).toBe('The Relational Minimalist');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to stay grounded in what is actually happening. The growth edge is noticing when something unsaid still matters.`,
    );
  });

  it('can select The Immediate Expresser as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('immediate_expression', 'journal'),
      signal('real_time_reaction', 'relationshipMirror'),
      signal('talks_to_process', 'journal'),
      signal('emotional_externalizing', 'triggerLog'),
      signal('fresh_expression', 'journal'),
      signal('open_communication_need', 'relationshipMirror'),
      signal('voice_emerging', 'reflectionBank'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'communication_voice_010_immediate_expression',
        title: 'Immediate Expression',
        category: 'communicationVoice',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'relationshipMirror'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('immediateExpresser');
    expect(selected?.title).toBe('The Immediate Expresser');
    expect(selected?.sentences).toContain(
      `Your strength may be your honesty in the moment. The growth edge is learning when pacing your expression creates more space for it to land.`,
    );
  });

  it('can select The Selective Helper as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('selective_helping', 'journal'),
      signal('defined_support', 'journal'),
      signal('shared_responsibility', 'reflectionBank'),
      signal('lets_others_handle', 'relationshipMirror'),
      signal('care_with_boundaries', 'journal'),
      signal('assigned_responsibility_only', 'triggerLog'),
      signal('peace_boundary', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'responsibility_care_009_selective_helping',
        title: 'Selective Helping',
        category: 'responsibilityCare',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'relationshipMirror'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('selectiveHelper');
    expect(selected?.title).toBe('The Selective Helper');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to choose your involvement. The growth edge is recognizing when stepping in matters, even if it wasn’t assigned to you.`,
    );
  });

  it('can select The Low-Pressure Drifter as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('low_pressure_motivation', 'journal'),
      signal('flexibility_need', 'journal'),
      signal('ease_over_achievement', 'reflectionBank'),
      signal('obligation_resistance', 'journal'),
      signal('freedom_before_ambition', 'triggerLog'),
      signal('burst_pacing', 'journal'),
      signal('play_glimmer', 'glimmerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'work_ambition_010_low_pressure_drifter',
        title: 'Low Pressure Drifting',
        category: 'workAmbition',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'reflectionBank'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('lowPressureDrifter');
    expect(selected?.title).toBe('The Low-Pressure Drifter');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to keep life from becoming only about achievement. The growth edge is finding enough structure to support what you actually care about.`,
    );
  });

  it('can select The Steady Baseline Person as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('steady_mood_baseline', 'journal'),
      signal('obvious_cause_emotions', 'reflectionBank'),
      signal('baseline_recovery', 'journal'),
      signal('practical_mood_tracking', 'dailyCheckIn'),
      signal('low_emotional_variability', 'journal'),
      signal('subtle_emotion_blindspot', 'reflectionBank'),
      signal('quiet_safety', 'glimmerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'emotional_weather_012_steady_baseline',
        title: 'Steady Baseline',
        category: 'emotionalWeather',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'dailyCheckIn'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('steadyBaselinePerson');
    expect(selected?.title).toBe('The Steady Baseline Person');
    expect(selected?.sentences).toContain(
      `Your strength may be your steadiness. The growth edge is noticing smaller emotional signals before they have to become loud.`,
    );
  });

  it('can select The Easy Rester as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('easy_rest', 'journal'),
      signal('rest_without_guilt', 'journal'),
      signal('responds_to_fatigue', 'bodyMap'),
      signal('ordinary_downtime', 'journal'),
      signal('restorative_pause', 'glimmerLog'),
      signal('rest_as_care', 'reflectionBank'),
      signal('quiet_safety', 'glimmerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'rest_capacity_010_easy_rest',
        title: 'Easy Rest',
        category: 'restCapacity',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'glimmerLog'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('easyRester');
    expect(selected?.title).toBe('The Easy Rester');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to receive rest as care. The growth edge is protecting that rest when others do not understand its importance.`,
    );
  });

  it('can select The Body-Disconnected Thinker as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('thought_first_processing', 'journal'),
      signal('delayed_body_awareness', 'bodyMap'),
      signal('logic_over_sensation', 'reflectionBank'),
      signal('late_stress_signals', 'triggerLog'),
      signal('functioning_over_settled', 'journal'),
      signal('intentional_body_checkin', 'bodyMap'),
      signal('intellectualizes_feeling', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'body_signals_012_thought_first',
        title: 'Thought First Processing',
        category: 'bodySignals',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'bodyMap'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('bodyDisconnectedThinker');
    expect(selected?.title).toBe('The Body-Disconnected Thinker');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to think clearly through a lot. The growth edge is letting your body become part of the information, not just the thing carrying you through.`,
    );
  });

  it('can select The Open Receiver as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('open_receiving', 'journal'),
      signal('compliment_lands', 'glimmerLog'),
      signal('asks_help_early', 'journal'),
      signal('needs_belong', 'reflectionBank'),
      signal('support_reaches_inside', 'glimmerLog'),
      signal('valued_without_usefulness', 'journal'),
      signal('receiving_openness', 'glimmerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [
      {
        patternKey: 'self_worth_010_open_receiver',
        title: 'Open Receiving',
        category: 'selfWorthReceiving',
        score: 0.95,
        confidence: 'strong',
        movement: 'new',
        timeframeDays: 90,
        sources: ['journal', 'glimmerLog'],
        evidence: [],
        lastSeenAt: today,
      },
    ];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('openReceiver');
    expect(selected?.title).toBe('The Open Receiver');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to let good things in. The growth edge is staying open even when receiving feels vulnerable.`,
    );
  });

  it('can select The Firm Inner Knower as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('firm_inner_knowing', 'journal'),
      signal('boundary_without_confirmation', 'journal'),
      signal('quick_limit_clarity', 'bodyMap'),
      signal('can_disappoint_others', 'relationshipMirror'),
      signal('simple_boundary_answer', 'journal'),
      signal('early_limit_honoring', 'reflectionBank'),
      signal('inner_authority', 'triggerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'boundaries_018_firm_inner_knowing',
      title: 'Firm Inner Knowing',
      category: 'boundariesSelfTrust',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('firmInnerKnower');
    expect(selected?.title).toBe('The Firm Inner Knower');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to stay connected to yourself under pressure. The growth edge is staying open to feedback without letting it replace your own knowing.`,
    );
  });

  it('can select The Naturally Unbraced Person as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('familiar_calm', 'journal'),
      signal('easy_settling', 'bodyMap'),
      signal('low_scanning', 'relationshipMirror'),
      signal('trusts_safe_moments', 'glimmerLog'),
      signal('unbraced_stillness', 'bodyMap'),
      signal('quick_disruption_recovery', 'journal'),
      signal('quiet_safety', 'glimmerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'safety_regulation_014_naturally_unbraced',
      title: 'Naturally Unbraced',
      category: 'safetyRegulation',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('naturallyUnbracedPerson');
    expect(selected?.title).toBe('The Naturally Unbraced Person');
    expect(selected?.sentences).toContain(
      `Your strength may be your access to ease. The growth edge is recognizing when someone else’s body needs more time to feel the safety that seems obvious to you.`,
    );
  });

  it('can select The Clean-Closure Mover as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('clean_closure', 'journal'),
      signal('future_after_ending', 'reflectionBank'),
      signal('lets_endings_complete', 'journal'),
      signal('direct_closure_need', 'relationshipMirror'),
      signal('memory_without_attachment', 'journal'),
      signal('relief_after_ending', 'glimmerLog'),
      signal('chapter_shift', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'grief_transitions_011_clean_closure',
      title: 'Clean Closure',
      category: 'griefTransitions',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'glimmerLog'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('cleanClosureMover');
    expect(selected?.title).toBe('The Clean-Closure Mover');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to move with life’s changes. The growth edge is slowing down when something deserves more mourning than your instinct wants to give it.`,
    );
  });

  it('can select The Rhythm-Insensitive Pusher as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('same_capacity_expectation', 'journal'),
      signal('pushes_low_capacity', 'journal'),
      signal('schedule_over_capacity', 'reflectionBank'),
      signal('overrides_tiredness', 'bodyMap'),
      signal('willpower_over_timing', 'journal'),
      signal('ignores_energy_patterns', 'dailyCheckIn'),
      signal('overextension', 'triggerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'time_rhythms_013_rhythm_insensitive_push',
      title: 'Rhythm-Insensitive Push',
      category: 'timeRhythms',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('rhythmInsensitivePusher');
    expect(selected?.title).toBe('The Rhythm-Insensitive Pusher');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to keep going across changing conditions. The growth edge is learning that adapting to rhythm is not the same as giving up.`,
    );
  });

  it('can select The Direct Speaker as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('plain_direct_speech', 'journal'),
      signal('clear_words_preference', 'relationshipMirror'),
      signal('says_it_sooner', 'journal'),
      signal('low_conversation_replay', 'reflectionBank'),
      signal('honesty_over_delivery', 'journal'),
      signal('directness_with_repair', 'relationshipMirror'),
      signal('truth_telling', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'communication_voice_011_direct_speaker',
      title: 'Direct Speaker',
      category: 'communicationVoice',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('directSpeaker');
    expect(selected?.title).toBe('The Direct Speaker');
    expect(selected?.sentences).toContain(
      `Your strength may be your clarity. The growth edge is remembering that directness lands best when the other person can still feel your care inside it.`,
    );
  });

  it('can select The Pleasure-Avoidant Producer as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('productivity_before_pleasure', 'journal'),
      signal('pleasure_secondary', 'journal'),
      signal('enjoyment_minimized', 'glimmerLog'),
      signal('relaxation_discomfort', 'bodyMap'),
      signal('output_over_enjoyment', 'reflectionBank'),
      signal('responsibilities_during_pleasure', 'journal'),
      signal('mental_load', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'pleasure_play_011_pleasure_avoidant_producer',
      title: 'Pleasure-Avoidant Producer',
      category: 'pleasurePlay',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'glimmerLog'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('pleasureAvoidantProducer');
    expect(selected?.title).toBe('The Pleasure-Avoidant Producer');
    expect(selected?.sentences).toContain(
      `Your balance may be letting pleasure exist before everything is finished.`,
    );
  });

  it('can select The Future-Oriented Escaper as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('future_preoccupation', 'journal'),
      signal('change_over_present', 'reflectionBank'),
      signal('planning_over_presence', 'journal'),
      signal('restless_without_progress', 'dailyCheckIn'),
      signal('present_as_stepping_stone', 'journal'),
      signal('already_thinking_next', 'reflectionBank'),
      signal('future_self_orientation', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'life_direction_011_future_oriented_escape',
      title: 'Future-Oriented Escape',
      category: 'lifeDirection',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('futureOrientedEscaper');
    expect(selected?.title).toBe('The Future-Oriented Escaper');
    expect(selected?.sentences).toContain(
      `Your balance may be letting the present have weight, not just the future.`,
    );
  });

  it('can select The Scarcity-Driven Planner as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('scarcity_planning', 'journal'),
      signal('planning_as_protection', 'journal'),
      signal('worst_case_preparation', 'triggerLog'),
      signal('safety_over_flexibility', 'reflectionBank'),
      signal('accounted_for_security', 'journal'),
      signal('control_for_uncertainty', 'dailyCheckIn'),
      signal('scarcity_scanning', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'scarcity_011_driven_planning',
      title: 'Scarcity-Driven Planning',
      category: 'scarcityAbundance',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'dailyCheckIn'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('scarcityDrivenPlanner');
    expect(selected?.title).toBe('The Scarcity-Driven Planner');
    expect(selected?.sentences).toContain(
      `Your balance may be allowing space for things to work out without full control.`,
    );
  });

  it('can select The Meaning-Seeking Escapist as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('meaning_before_action', 'journal'),
      signal('reflection_over_action', 'reflectionBank'),
      signal('interpretation_as_distance', 'journal'),
      signal('symbolic_over_practical', 'dream'),
      signal('insight_without_steps', 'journal'),
      signal('meaning_replaces_change', 'reflectionBank'),
      signal('meaning_making', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'spiritual_meaning_011_meaning_escape',
      title: 'Meaning-Seeking Escape',
      category: 'spiritualMeaning',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('meaningSeekingEscapist');
    expect(selected?.title).toBe('The Meaning-Seeking Escapist');
    expect(selected?.sentences).toContain(
      `Your balance may be letting meaning guide you without replacing action.`,
    );
  });

  it('can select The Identity-Reinventor as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('rapid_identity_shift', 'journal'),
      signal('reinvention_orientation', 'reflectionBank'),
      signal('flexible_identity', 'journal'),
      signal('role_adaptation', 'relationshipMirror'),
      signal('context_dependent_self', 'journal'),
      signal('continuity_gap', 'reflectionBank'),
      signal('identity_rewriting', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'identity_011_reinvention',
      title: 'Identity Reinvention',
      category: 'identityGrowth',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('identityReinventor');
    expect(selected?.title).toBe('The Identity-Reinventor');
    expect(selected?.sentences).toContain(
      `Your balance may be holding onto what remains true while still allowing change.`,
    );
  });

  it('can select The Pleasure-Natural Person as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('pleasure_without_productivity', 'journal'),
      signal('natural_play', 'glimmerLog'),
      signal('desire_as_information', 'reflectionBank'),
      signal('chooses_beauty_comfort', 'journal'),
      signal('joy_recovery', 'dailyCheckIn'),
      signal('pleasure_unearned_trust', 'journal'),
      signal('joy_tolerance', 'glimmerLog'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'pleasure_play_012_pleasure_natural',
      title: 'Pleasure Natural',
      category: 'pleasurePlay',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'glimmerLog'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('pleasureNaturalPerson');
    expect(selected?.title).toBe('The Pleasure-Natural Person');
    expect(selected?.sentences).toContain(
      `Your strength may be your openness to delight. The growth edge is protecting pleasure without using it to avoid what still needs care.`,
    );
  });

  it('can select The Present-Focused Person as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('current_moment_grounding', 'journal'),
      signal('low_future_urgency', 'reflectionBank'),
      signal('lives_without_interpreting', 'journal'),
      signal('current_reality_decisions', 'dailyCheckIn'),
      signal('long_term_planning_overwhelm', 'journal'),
      signal('next_step_momentum', 'reflectionBank'),
      signal('present_focus', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'life_direction_012_present_focused',
      title: 'Present Focused',
      category: 'lifeDirection',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('presentFocusedPerson');
    expect(selected?.title).toBe('The Present-Focused Person');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to live inside the life you have. The growth edge is noticing when the future needs attention before it becomes urgent.`,
    );
  });

  it('can select The Resource-Trusting Person as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('resource_anxiety_only_with_reason', 'journal'),
      signal('needs_handled_as_arise', 'reflectionBank'),
      signal('practical_enoughness', 'journal'),
      signal('stability_feels_real', 'dailyCheckIn'),
      signal('spending_without_safety_math', 'journal'),
      signal('resource_flexibility', 'reflectionBank'),
      signal('enoughness', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'scarcity_012_resource_trusting',
      title: 'Resource Trusting',
      category: 'scarcityAbundance',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('resourceTrustingPerson');
    expect(selected?.title).toBe('The Resource-Trusting Person');
    expect(selected?.sentences).toContain(
      `Your strength may be your trust in provision and adaptability. The growth edge is noticing when trust needs to be paired with practical limits.`,
    );
  });

  it('can select The Practical Literalist as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('concrete_over_symbolic', 'journal'),
      signal('meaning_when_useful', 'reflectionBank'),
      signal('facts_over_interpretation', 'journal'),
      signal('resists_forced_lesson', 'triggerLog'),
      signal('low_sign_reading', 'journal'),
      signal('simple_explanations', 'reflectionBank'),
      signal('truth_telling', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'spiritual_meaning_012_practical_literalist',
      title: 'Practical Literalist',
      category: 'spiritualMeaning',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('practicalLiteralist');
    expect(selected?.title).toBe('The Practical Literalist');
    expect(selected?.sentences).toContain(
      `Your strength may be your groundedness. The growth edge is leaving room for meaning that cannot be fully proven but still feels real.`,
    );
  });

  it('can select The Stable Self-Concept Person as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('stable_core_self', 'journal'),
      signal('growth_as_clarity', 'reflectionBank'),
      signal('change_adds_not_rearranges', 'journal'),
      signal('continuity_grounding', 'dailyCheckIn'),
      signal('adapts_without_reinventing', 'journal'),
      signal('stable_preferences_values', 'reflectionBank'),
      signal('self_definition', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'identity_012_stable_self_concept',
      title: 'Stable Self Concept',
      category: 'identityGrowth',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('stableSelfConceptPerson');
    expect(selected?.title).toBe('The Stable Self-Concept Person');
    expect(selected?.sentences).toContain(
      `Your strength may be your inner continuity. The growth edge is allowing change to reach you without treating it as a threat to who you are.`,
    );
  });

  it('can select The Individuated Family Member as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('family_individuation', 'journal'),
      signal('old_roles_observed', 'reflectionBank'),
      signal('not_family_emotional_manager', 'journal'),
      signal('neutral_family_presence', 'dailyCheckIn'),
      signal('intentional_family_involvement', 'relationshipMirror'),
      signal('old_pattern_nonparticipation', 'journal'),
      signal('inner_authority', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'family_home_012_individuated_family_member',
      title: 'Individuated Family Member',
      category: 'familyHome',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('individuatedFamilyMember');
    expect(selected?.title).toBe('The Individuated Family Member');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to remain yourself in familiar spaces. The growth edge is allowing connection without losing that autonomy.`,
    );
  });

  it('can select The Big-Shift Noticer as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('subtle_shift_blindspot', 'journal'),
      signal('obvious_change_only', 'glimmerLog'),
      signal('low_gradual_progress_tracking', 'reflectionBank'),
      signal('full_relief_need', 'bodyMap'),
      signal('threshold_awareness', 'journal'),
      signal('improvement_blindspot', 'dailyCheckIn'),
      signal('subtle_emotion_blindspot', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'glimmers_regulation_012_big_shift_noticer',
      title: 'Big-Shift Noticer',
      category: 'glimmersRegulation',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'glimmerLog'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('bigShiftNoticer');
    expect(selected?.title).toBe('The Big-Shift Noticer');
    expect(selected?.sentences).toContain(
      `Your strength may be your clarity when something truly changes. The growth edge is learning to recognize the smaller shifts that lead there.`,
    );
  });

  it('can select The Practical Implementer as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('function_over_feeling', 'journal'),
      signal('completion_over_experiment', 'reflectionBank'),
      signal('low_creative_emotional_expression', 'journal'),
      signal('efficient_solution_focus', 'dailyCheckIn'),
      signal('structure_over_open_interpretation', 'journal'),
      signal('concrete_over_abstract_expression', 'reflectionBank'),
      signal('wants_to_build', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'creativity_expression_012_practical_implementer',
      title: 'Practical Implementer',
      category: 'creativityExpression',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('practicalImplementer');
    expect(selected?.title).toBe('The Practical Implementer');
    expect(selected?.sentences).toContain(
      `Your strength may be your ability to bring things into reality. The growth edge is allowing space for expression that doesn’t need to be useful.`,
    );
  });

  it('can select The Flexible Pragmatist as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('contextual_standards', 'journal'),
      signal('good_enough_acceptance', 'reflectionBank'),
      signal('practicality_over_alignment', 'journal'),
      signal('flexibility_over_consistency', 'dailyCheckIn'),
      signal('moves_without_full_resolution', 'journal'),
      signal('low_inconsistency_dwelling', 'reflectionBank'),
      signal('flexibility_need', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'values_integrity_012_flexible_pragmatist',
      title: 'Flexible Pragmatist',
      category: 'valuesIntegrity',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('flexiblePragmatist');
    expect(selected?.title).toBe('The Flexible Pragmatist');
    expect(selected?.sentences).toContain(
      `Your strength may be your adaptability. The growth edge is noticing when something matters enough to hold more firmly.`,
    );
  });

  it('can select The Waking-Life Processor as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('waking_life_processing', 'journal'),
      signal('low_dream_interpretation', 'dream'),
      signal('daytime_processing', 'reflectionBank'),
      signal('real_events_over_symbols', 'journal'),
      signal('dreams_fade_quickly', 'dream'),
      signal('clear_over_symbolic_explanation', 'journal'),
      signal('talks_to_process', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'dreams_symbols_012_waking_life_processor',
      title: 'Waking-Life Processor',
      category: 'dreamsSymbols',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'dream'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('wakingLifeProcessor');
    expect(selected?.title).toBe('The Waking-Life Processor');
    expect(selected?.sentences).toContain(
      `Your strength may be your focus on reality as it is. The growth edge is noticing when something beneath the surface still wants attention.`,
    );
  });

  it('can select The Responsible Non-Carrier as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('notices_need_without_job', 'journal'),
      signal('help_pull_with_boundary', 'reflectionBank'),
      signal('emotional_not_practical_responsibility', 'journal'),
      signal('care_without_action', 'relationshipMirror'),
      signal('ownership_pause', 'journal'),
      signal('guilt_for_not_stepping_in', 'dailyCheckIn'),
      signal('selective_helping', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'responsibility_care_012_responsible_non_carrier',
      title: 'Responsible Non-Carrier',
      category: 'responsibilityCare',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('responsibleNonCarrier');
    expect(selected?.title).toBe('The Responsible Non-Carrier');
    expect(selected?.sentences).toContain(
      `Your growth may be in letting concern exist without turning it into over-responsibility.`,
    );
  });

  it('can select The Deep Processor Who Moves Fast as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('deep_reflection_limit', 'journal'),
      signal('meaning_relief_tension', 'reflectionBank'),
      signal('intense_short_processing', 'journal'),
      signal('moves_when_consuming', 'dailyCheckIn'),
      signal('waves_reflection_action', 'journal'),
      signal('revisit_after_done', 'reflectionBank'),
      signal('deep_processing', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'cognitive_style_012_deep_fast_processor',
      title: 'Deep Fast Processor',
      category: 'cognitiveStyle',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('deepProcessorWhoMovesFast');
    expect(selected?.title).toBe('The Deep Processor Who Moves Fast');
    expect(selected?.sentences).toContain(
      `Your balance may be learning when reflection is helping — and when it has become another place to stay stuck.`,
    );
  });

  it('can select The Relational Tracker Who Acts Detached as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('tracks_tone_acts_unaffected', 'journal'),
      signal('body_notices_distance_hidden', 'bodyMap'),
      signal('calm_outside_tracking_inside', 'relationshipMirror'),
      signal('less_invested_protection', 'journal'),
      signal('pulls_back_first', 'relationshipMirror'),
      signal('says_doesnt_matter_tracks', 'journal'),
      signal('tone_sensitivity', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'relationships_012_tracker_acts_detached',
      title: 'Tracker Acts Detached',
      category: 'relationships',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('relationalTrackerWhoActsDetached');
    expect(selected?.title).toBe('The Relational Tracker Who Acts Detached');
    expect(selected?.sentences).toContain(
      `Your contradiction may be that connection matters deeply, even when your protection looks like distance.`,
    );
  });

  it('can select The Quiet Expresser as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('affected_before_words', 'journal'),
      signal('quiet_from_too_much', 'reflectionBank'),
      signal('private_word_rehearsal', 'journal'),
      signal('expression_after_settling', 'dailyCheckIn'),
      signal('silence_not_indifference', 'relationshipMirror'),
      signal('space_then_conversation', 'journal'),
      signal('voice_emerging', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'communication_voice_012_quiet_expresser',
      title: 'Quiet Expresser',
      category: 'communicationVoice',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('quietExpresser');
    expect(selected?.title).toBe('The Quiet Expresser');
    expect(selected?.sentences).toContain(
      `Your voice may be strongest after quiet has helped you find it.`,
    );
  });

  it('can select The Selective Caregiver as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('careful_about_taken_on', 'journal'),
      signal('chosen_support', 'reflectionBank'),
      signal('capacity_before_support', 'journal'),
      signal('care_not_availability', 'dailyCheckIn'),
      signal('show_up_when_yours', 'journal'),
      signal('old_overgive_pull', 'reflectionBank'),
      signal('care_with_boundaries', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'responsibility_care_013_selective_caregiver',
      title: 'Selective Caregiver',
      category: 'responsibilityCare',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('selectiveCaregiver');
    expect(selected?.title).toBe('The Selective Caregiver');
    expect(selected?.sentences).toContain(
      `Your growth may be realizing that sustainable care is still real care.`,
    );
  });

  it('can select The Ambitious Drifter as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('big_hopes_structure_heavy', 'journal'),
      signal('cares_resists_pressure', 'reflectionBank'),
      signal('goal_as_test_shutdown', 'journal'),
      signal('experiment_room_motivation', 'dailyCheckIn'),
      signal('progress_without_productivity_life', 'journal'),
      signal('burst_ambition', 'reflectionBank'),
      signal('low_pressure_motivation', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'work_ambition_012_ambitious_drifter',
      title: 'Ambitious Drifter',
      category: 'workAmbition',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('ambitiousDrifter');
    expect(selected?.title).toBe('The Ambitious Drifter');
    expect(selected?.sentences).toContain(
      `Your balance may be learning how to build enough structure to support your goals without turning them into a cage.`,
    );
  });

  it('can select The Steady Person With Sudden Weather as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('steady_until_trigger', 'journal'),
      signal('sharp_emotional_shift', 'reflectionBank'),
      signal('baseline_interruption_surprise', 'journal'),
      signal('delayed_buildup_awareness', 'dailyCheckIn'),
      signal('steady_not_unaffected', 'journal'),
      signal('trigger_faster_than_explanation', 'bodyMap'),
      signal('steady_mood_baseline', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'emotional_weather_012_steady_sudden_weather',
      title: 'Steady With Sudden Weather',
      category: 'emotionalWeather',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('steadyPersonWithSuddenWeather');
    expect(selected?.title).toBe('The Steady Person With Sudden Weather');
    expect(selected?.sentences).toContain(
      `Your pattern may be less about mood swings and more about specific places where your steadiness gets interrupted.`,
    );
  });

  it('can select The Rest-Aware Overrider as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('rest_needed_unresolved', 'journal'),
      signal('tired_but_not_free_stop', 'bodyMap'),
      signal('rest_theory_hard_choice', 'reflectionBank'),
      signal('one_more_thing_loop', 'journal'),
      signal('body_rest_before_responsibility', 'bodyMap'),
      signal('rest_awareness_frustration', 'dailyCheckIn'),
      signal('rest_resistance', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'rest_capacity_012_rest_aware_overrider',
      title: 'Rest-Aware Overrider',
      category: 'restCapacity',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('restAwareOverrider');
    expect(selected?.title).toBe('The Rest-Aware Overrider');
    expect(selected?.sentences).toContain(
      `Your growth may be learning that unfinished does not always mean unsafe.`,
    );
  });

  it('can select The Body-Aware Thinker as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('body_signal_interpretation', 'bodyMap'),
      signal('sensation_first_mind_interprets', 'journal'),
      signal('sensation_reason_search', 'bodyMap'),
      signal('body_info_mind_organizes', 'reflectionBank'),
      signal('sensation_problem_solving', 'journal'),
      signal('analysis_pulls_from_signal', 'bodyMap'),
      signal('body_knows_first', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'body_signals_012_body_aware_thinker',
      title: 'Body-Aware Thinker',
      category: 'bodySignals',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('bodyAwareThinker');
    expect(selected?.title).toBe('The Body-Aware Thinker');
    expect(selected?.sentences).toContain(
      `Your balance may be letting the sensation exist for a moment before needing it to explain itself.`,
    );
  });

  it('can select The Open Receiver Who Still Balances the Scale as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('receives_then_returns', 'journal'),
      signal('indebted_receiving_discomfort', 'reflectionBank'),
      signal('support_trusted_when_reciprocal', 'journal'),
      signal('care_evenness_question', 'relationshipMirror'),
      signal('kindness_usefulness_pressure', 'journal'),
      signal('receives_but_exposed_need', 'dailyCheckIn'),
      signal('open_receiving', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'self_worth_receiving_012_balanced_receiver',
      title: 'Balanced Receiver',
      category: 'selfWorthReceiving',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('openReceiverWhoStillBalancesScale');
    expect(selected?.title).toBe('The Open Receiver Who Still Balances the Scale');
    expect(selected?.sentences).toContain(
      `Your growth may be letting care stay with you before turning it into something you owe.`,
    );
  });

  it('can select The Firm Boundary Doubter as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('boundary_clear_then_replayed', 'journal'),
      signal('no_right_then_reaction_discomfort', 'reflectionBank'),
      signal('instinct_trust_fades_after_reaction', 'journal'),
      signal('outcome_harder_than_decision', 'dailyCheckIn'),
      signal('post_boundary_reassurance', 'relationshipMirror'),
      signal('real_time_clarity_faded_confidence', 'journal'),
      signal('firm_inner_knowing', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'boundaries_012_firm_boundary_doubter',
      title: 'Firm Boundary Doubter',
      category: 'boundariesSelfTrust',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('firmBoundaryDoubter');
    expect(selected?.title).toBe('The Firm Boundary Doubter');
    expect(selected?.sentences).toContain(
      `Your balance may be learning to let your boundary stand without needing to revisit it for approval.`,
    );
  });

  it('can select The Calm-Braced Person as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('outward_settled_under_ready', 'journal'),
      signal('composed_still_tracking', 'bodyMap'),
      signal('quiet_readiness', 'journal'),
      signal('smooth_monitoring_change', 'dailyCheckIn'),
      signal('calm_seen_attention_hidden', 'reflectionBank'),
      signal('guard_not_dropped', 'journal'),
      signal('calm_bracing', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'safety_regulation_012_calm_braced',
      title: 'Calm-Braced Person',
      category: 'safetyRegulation',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('calmBracedPerson');
    expect(selected?.title).toBe('The Calm-Braced Person');
    expect(selected?.sentences).toContain(
      `Your balance may be learning when it’s actually safe to soften, not just to manage.`,
    );
  });

  it('can select The Closure-Seeker Who Still Grieves as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('closure_wanted_feelings_lag', 'journal'),
      signal('ready_then_resurfacing', 'reflectionBank'),
      signal('resolution_processing_split', 'journal'),
      signal('done_but_unfinished_underneath', 'dailyCheckIn'),
      signal('forward_with_waves', 'journal'),
      signal('unwanted_revisiting', 'reflectionBank'),
      signal('clean_closure', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'grief_transitions_012_closure_still_grieves',
      title: 'Closure Still Grieves',
      category: 'griefTransitions',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('closureSeekerWhoStillGrieves');
    expect(selected?.title).toBe('The Closure-Seeker Who Still Grieves');
    expect(selected?.sentences).toContain(
      `Your balance may be allowing both forward movement and returning feelings without forcing one to cancel the other.`,
    );
  });

  it('can select The Rhythm-Aware Pusher as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('knows_rhythm_overrides', 'journal'),
      signal('awareness_hard_to_follow', 'reflectionBank'),
      signal('easier_later_push_now', 'journal'),
      signal('rhythm_known_expectations_ignore', 'dailyCheckIn'),
      signal('capacity_difference_same_practice', 'bodyMap'),
      signal('timing_plan_overridden', 'journal'),
      signal('pushes_low_capacity', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'time_rhythms_012_rhythm_aware_pusher',
      title: 'Rhythm-Aware Pusher',
      category: 'timeRhythms',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('rhythmAwarePusher');
    expect(selected?.title).toBe('The Rhythm-Aware Pusher');
    expect(selected?.sentences).toContain(
      `Your growth may be trusting your timing enough to let it guide your decisions, not just inform them.`,
    );
  });

  it('can select The Direct Overexplainer as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('clear_speech_extra_detail', 'journal'),
      signal('direct_with_extra_explanation', 'reflectionBank'),
      signal('continues_after_meaning', 'journal'),
      signal('words_trusted_reception_not', 'relationshipMirror'),
      signal('responsible_for_understanding', 'journal'),
      signal('clarifies_after_clear', 'dailyCheckIn'),
      signal('plain_direct_speech', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'communication_voice_012_direct_overexplainer',
      title: 'Direct Overexplainer',
      category: 'communicationVoice',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('directOverexplainer');
    expect(selected?.title).toBe('The Direct Overexplainer');
    expect(selected?.sentences).toContain(
      `Your balance may be trusting that your first clear expression is often enough.`,
    );
  });

  it('can select The Pleasure-Allowed Achiever as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('pleasure_after_completion', 'journal'),
      signal('earned_pleasure_relaxation', 'reflectionBank'),
      signal('enjoyment_with_afterward_tracking', 'journal'),
      signal('joy_with_responsibility', 'dailyCheckIn'),
      signal('fun_blocked_by_incomplete', 'journal'),
      signal('breaks_between_effort', 'bodyMap'),
      signal('enjoyment_not_reward', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'pleasure_play_013_pleasure_allowed_achiever',
      title: 'Pleasure-Allowed Achiever',
      category: 'pleasurePlay',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('pleasureAllowedAchiever');
    expect(selected?.title).toBe('The Pleasure-Allowed Achiever');
    expect(selected?.sentences).toContain(
      `Your balance may be letting enjoyment stand on its own, not just as a reward.`,
    );
  });

  it('can select The Present-Focused Dreamer as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('present_grounded_future_questions', 'journal'),
      signal('rare_future_thought_intense', 'reflectionBank'),
      signal('future_key_moment_pull', 'journal'),
      signal('plan_free_until_urgent', 'dailyCheckIn'),
      signal('now_focus_with_possibility', 'journal'),
      signal('big_questions_in_waves', 'reflectionBank'),
      signal('present_guides_future_listens', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'life_direction_013_present_focused_dreamer',
      title: 'Present-Focused Dreamer',
      category: 'lifeDirection',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('presentFocusedDreamer');
    expect(selected?.title).toBe('The Present-Focused Dreamer');
    expect(selected?.sentences).toContain(
      `Your balance may be letting the present guide you while still listening when the future asks for attention.`,
    );
  });

  it('can select The Resource-Trusting Worrier as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('resource_trust_with_concern', 'journal'),
      signal('trust_baseline_fear_moments', 'reflectionBank'),
      signal('resource_calm_until_personal_stakes', 'journal'),
      signal('fine_to_what_if_shift', 'dailyCheckIn'),
      signal('light_planning_until_uncertain', 'journal'),
      signal('trust_worry_coexist', 'reflectionBank'),
      signal('trust_leads_caution_respected', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'scarcity_013_resource_trusting_worrier',
      title: 'Resource-Trusting Worrier',
      category: 'scarcityAbundance',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('resourceTrustingWorrier');
    expect(selected?.title).toBe('The Resource-Trusting Worrier');
    expect(selected?.sentences).toContain(
      `Your balance may be letting trust lead, while still respecting the moments when caution is useful.`,
    );
  });

  it('can select The Spiritual Practicalist as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('meaning_with_practical_action', 'journal'),
      signal('meaning_not_action_replacement', 'reflectionBank'),
      signal('resists_quick_lessons', 'journal'),
      signal('why_and_next_step', 'dailyCheckIn'),
      signal('larger_connection_grounded', 'journal'),
      signal('meaning_lived_experience', 'reflectionBank'),
      signal('meaning_deepens_truth', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'spiritual_meaning_013_practicalist',
      title: 'Spiritual Practicalist',
      category: 'spiritualMeaning',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('spiritualPracticalist');
    expect(selected?.title).toBe('The Spiritual Practicalist');
    expect(selected?.sentences).toContain(
      `Your balance may be letting meaning deepen your experience without replacing what is true.`,
    );
  });

  it('can select The Stable Self in Transition as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('same_core_life_shifting', 'journal'),
      signal('circumstance_change_identity_stable', 'reflectionBank'),
      signal('steady_inside_reorganizing', 'journal'),
      signal('self_intact_role_change', 'dailyCheckIn'),
      signal('fit_next_question', 'journal'),
      signal('stability_transition_coexist', 'reflectionBank'),
      signal('change_reshapes_not_redefines', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'identity_013_stable_self_in_transition',
      title: 'Stable Self in Transition',
      category: 'identityGrowth',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('stableSelfInTransition');
    expect(selected?.title).toBe('The Stable Self in Transition');
    expect(selected?.sentences).toContain(
      `Your balance may be allowing change to reshape your life without feeling like it has to redefine you.`,
    );
  });

  it('can select The Individuated Family Carrier as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('family_self_with_old_roles', 'journal'),
      signal('family_responsibility_automatic', 'reflectionBank'),
      signal('current_self_old_role_pull', 'journal'),
      signal('family_activates_old_parts', 'dailyCheckIn'),
      signal('family_choice_effort', 'journal'),
      signal('old_expectations_body_pressure', 'bodyMap'),
      signal('connected_without_old_identity', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'family_home_013_individuated_family_carrier',
      title: 'Individuated Family Carrier',
      category: 'familyHome',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('individuatedFamilyCarrier');
    expect(selected?.title).toBe('The Individuated Family Carrier');
    expect(selected?.sentences).toContain(
      `Your balance may be staying connected where it’s healthy, without handing your identity back to the old role.`,
    );
  });

  it('can select The Subtle-Glimmer Skeptic as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('small_calm_duration_doubt', 'journal'),
      signal('relief_flashes_caution', 'glimmerLog'),
      signal('softening_interrupt_check', 'bodyMap'),
      signal('small_good_not_trusted', 'journal'),
      signal('ease_waits_for_proof', 'reflectionBank'),
      signal('lightness_partial_day', 'dailyCheckIn'),
      signal('small_good_moments_matter', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'glimmers_regulation_013_subtle_glimmer_skeptic',
      title: 'Subtle-Glimmer Skeptic',
      category: 'glimmersRegulation',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'glimmerLog'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('subtleGlimmerSkeptic');
    expect(selected?.title).toBe('The Subtle-Glimmer Skeptic');
    expect(selected?.sentences).toContain(
      `Your balance may be letting small good moments matter without needing them to prove everything is okay.`,
    );
  });

  it('can select The Creative Implementer as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('beauty_function_both', 'journal'),
      signal('beauty_serves_livable', 'reflectionBank'),
      signal('expression_to_tangible', 'journal'),
      signal('feeling_into_form', 'dailyCheckIn'),
      signal('creativity_not_abstract', 'journal'),
      signal('detail_emotion_function', 'bodyMap'),
      signal('creativity_alive_with_structure', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'creativity_expression_013_creative_implementer',
      title: 'Creative Implementer',
      category: 'creativityExpression',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('creativeImplementer');
    expect(selected?.title).toBe('The Creative Implementer');
    expect(selected?.sentences).toContain(
      `Your balance may be letting creativity stay alive while still giving it structure.`,
    );
  });

  it('can select The Values-Driven Pragmatist as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('values_with_tradeoffs', 'journal'),
      signal('compromise_discernment', 'reflectionBank'),
      signal('flexible_details_firm_principle', 'journal'),
      signal('practicality_without_replacing_values', 'dailyCheckIn'),
      signal('small_bend_not_crossed', 'journal'),
      signal('workable_option_cost', 'reflectionBank'),
      signal('adaptable_not_negotiating_values', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'values_integrity_013_values_driven_pragmatist',
      title: 'Values-Driven Pragmatist',
      category: 'valuesIntegrity',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('valuesDrivenPragmatist');
    expect(selected?.title).toBe('The Values-Driven Pragmatist');
    expect(selected?.sentences).toContain(
      `Your balance may be staying adaptable without slowly negotiating away what matters most.`,
    );
  });

  it('can select The Symbolic Realist as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('symbols_grounded_real', 'journal'),
      signal('meaning_clarifies_actual_life', 'reflectionBank'),
      signal('symbolism_reality_resistance', 'journal'),
      signal('dream_image_true_feeling', 'dream'),
      signal('meaning_connected_recognizable', 'journal'),
      signal('reflection_without_disappearing', 'reflectionBank'),
      signal('meaning_grounded_real_life', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'dreams_symbols_013_symbolic_realist',
      title: 'Symbolic Realist',
      category: 'dreamsSymbols',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'dream'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('symbolicRealist');
    expect(selected?.title).toBe('The Symbolic Realist');
    expect(selected?.sentences).toContain(
      `Your balance may be letting meaning deepen your understanding without letting it float away from your real life.`,
    );
  });

  it('can select The Unaware Over-Engager as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('responsibility_not_noticed_early', 'journal'),
      signal('responsibility_registers_intense', 'reflectionBank'),
      signal('not_mine_to_should_handle', 'journal'),
      signal('selective_obligation_activation', 'dailyCheckIn'),
      signal('clear_need_sudden_urgency', 'journal'),
      signal('step_in_after_involved', 'relationshipMirror'),
      signal('earlier_notice_less_all_or_nothing', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'responsibility_care_014_unaware_over_engager',
      title: 'Unaware Over-Engager',
      category: 'responsibilityCare',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('unawareOverEngager');
    expect(selected?.title).toBe('The Unaware Over-Engager');
    expect(selected?.sentences).toContain(
      `Your balance may be noticing earlier — so engagement doesn’t have to become all-or-nothing.`,
    );
  });

  it('can select The Fast Mover Who Circles Back as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('moves_on_then_returns', 'journal'),
      signal('easy_let_go_then_back', 'reflectionBank'),
      signal('delayed_processing_when_calm', 'journal'),
      signal('done_then_affected', 'dailyCheckIn'),
      signal('forward_closure_lag', 'journal'),
      signal('revisits_after_left_behind', 'reflectionBank'),
      signal('earlier_reflection_prevents_return', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'cognitive_style_014_fast_mover_circles_back',
      title: 'Fast Mover Circles Back',
      category: 'cognitiveStyle',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('fastMoverWhoCirclesBack');
    expect(selected?.title).toBe('The Fast Mover Who Circles Back');
    expect(selected?.sentences).toContain(
      `Your balance may be allowing a little reflection earlier, so it doesn’t have to return later.`,
    );
  });

  it('can select The Detached Connector as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('low_tracking_sudden_standout', 'journal'),
      signal('simple_until_specific_complicated', 'reflectionBank'),
      signal('change_surprises_connection', 'relationshipMirror'),
      signal('unaffected_until_obvious_off', 'dailyCheckIn'),
      signal('sharp_connection_awareness', 'journal'),
      signal('rare_relationship_worry_signal', 'relationshipMirror'),
      signal('awareness_without_monitoring', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'relationships_014_detached_connector',
      title: 'Detached Connector',
      category: 'relationships',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('detachedConnector');
    expect(selected?.title).toBe('The Detached Connector');
    expect(selected?.sentences).toContain(
      `Your balance may be building awareness without needing to monitor everything.`,
    );
  });

  it('can select The Immediate-but-Unsure Expresser as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('expresses_then_understands_later', 'journal'),
      signal('talking_process_unclear_first', 'reflectionBank'),
      signal('in_moment_then_refine', 'journal'),
      signal('expression_before_clarity', 'dailyCheckIn'),
      signal('speaking_relief_adjust_later', 'journal'),
      signal('revisits_spoken_after_time', 'relationshipMirror'),
      signal('express_with_refine_space', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'communication_voice_014_immediate_unsure_expresser',
      title: 'Immediate Unsure Expresser',
      category: 'communicationVoice',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('immediateButUnsureExpresser');
    expect(selected?.title).toBe('The Immediate-but-Unsure Expresser');
    expect(selected?.sentences).toContain(
      `Your balance may be letting yourself express while also giving space to refine later.`,
    );
  });

  it('can select The Overextended Giver as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('helps_before_capacity_check', 'journal'),
      signal('automatic_giving_need', 'reflectionBank'),
      signal('energy_cost_after_commit', 'journal'),
      signal('yes_before_pause', 'dailyCheckIn'),
      signal('limits_noticed_after_crossed', 'journal'),
      signal('natural_help_overwhelming', 'bodyMap'),
      signal('pause_before_giving', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'responsibility_care_015_overextended_giver',
      title: 'Overextended Giver',
      category: 'responsibilityCare',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('overextendedGiver');
    expect(selected?.title).toBe('The Overextended Giver');
    expect(selected?.sentences).toContain(
      `Your balance may be adding a pause before you give, not after.`,
    );
  });

  it('can select The Pressure-Fueled Achiever as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('clear_expectations_motivation', 'journal'),
      signal('pressure_sharpens_focus', 'reflectionBank'),
      signal('deadline_standard_best_work', 'journal'),
      signal('structure_directs_energy', 'dailyCheckIn'),
      signal('freedom_without_direction_discomfort', 'journal'),
      signal('achievement_momentum_slowing_loss', 'bodyMap'),
      signal('meaning_not_only_pressure', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'work_ambition_014_pressure_fueled_achiever',
      title: 'Pressure-Fueled Achiever',
      category: 'workAmbition',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('pressureFueledAchiever');
    expect(selected?.title).toBe('The Pressure-Fueled Achiever');
    expect(selected?.sentences).toContain(
      `Your balance may be learning that motivation can come from meaning, not only pressure.`,
    );
  });

  it('can select The Emotionally Variable Steady One as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('hidden_emotional_variability', 'journal'),
      signal('internal_feeling_external_function', 'reflectionBank'),
      signal('consistent_outside_quick_inside', 'journal'),
      signal('contained_until_understood', 'dailyCheckIn'),
      signal('steady_not_simple', 'journal'),
      signal('calm_outside_many_states', 'bodyMap'),
      signal('trusted_people_inner_weather', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'emotional_weather_014_variable_steady_one',
      title: 'Emotionally Variable Steady One',
      category: 'emotionalWeather',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('emotionallyVariableSteadyOne');
    expect(selected?.title).toBe('The Emotionally Variable Steady One');
    expect(selected?.sentences).toContain(
      `Your balance may be letting trusted people know when your inner weather is changing.`,
    );
  });

  it('can select The Restless Rester as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('physical_pause_mind_moving', 'journal'),
      signal('outside_rest_before_inside', 'reflectionBank'),
      signal('break_without_recovery', 'journal'),
      signal('still_body_scanning_mind', 'bodyMap'),
      signal('stop_activity_not_let_go', 'journal'),
      signal('busy_mind_quiet_time', 'dailyCheckIn'),
      signal('body_mind_rest', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'rest_capacity_014_restless_rester',
      title: 'Restless Rester',
      category: 'restCapacity',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('restlessRester');
    expect(selected?.title).toBe('The Restless Rester');
    expect(selected?.sentences).toContain(
      `Your balance may be finding the kind of rest that reaches both your body and your mind.`,
    );
  });

  it('can select The Thought-First Body Listener as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('mental_first_body_agrees', 'journal'),
      signal('thoughts_lead_body_confirms', 'reflectionBank'),
      signal('logical_before_physical', 'journal'),
      signal('body_final_signal', 'bodyMap'),
      signal('fine_until_body_says_otherwise', 'journal'),
      signal('mind_quick_body_slow', 'dailyCheckIn'),
      signal('body_vote_when_mind_sure', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'body_signals_014_thought_first_body_listener',
      title: 'Thought-First Body Listener',
      category: 'bodySignals',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('thoughtFirstBodyListener');
    expect(selected?.title).toBe('The Thought-First Body Listener');
    expect(selected?.sentences).toContain(
      `Your balance may be letting your body have a vote, even when your mind is already sure.`,
    );
  });

  it('can select The Independent Receiver as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('support_without_dependence', 'journal'),
      signal('care_with_selfhood', 'reflectionBank'),
      signal('help_with_control', 'journal'),
      signal('supported_autonomy_intact', 'dailyCheckIn'),
      signal('resists_managed_care', 'relationshipMirror'),
      signal('help_respects_competence', 'journal'),
      signal('care_without_independence_proof', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'self_worth_receiving_014_independent_receiver',
      title: 'Independent Receiver',
      category: 'selfWorthReceiving',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('independentReceiver');
    expect(selected?.title).toBe('The Independent Receiver');
    expect(selected?.sentences).toContain(
      `Your balance may be letting care in without needing to prove you are still independent.`,
    );
  });

  it('can select The Boundary-Avoidant Harmonizer as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('avoids_clear_boundary_for_comfort', 'journal'),
      signal('yes_over_tension', 'reflectionBank'),
      signal('smooth_over_limit', 'journal'),
      signal('delayed_discomfort_after_agreement', 'dailyCheckIn'),
      signal('minimizes_real_cost', 'relationshipMirror'),
      signal('delays_boundaries_until_loud', 'journal'),
      signal('small_discomfort_early', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'boundaries_self_trust_015_boundary_avoidant_harmonizer',
      title: 'Boundary-Avoidant Harmonizer',
      category: 'boundariesSelfTrust',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('boundaryAvoidantHarmonizer');
    expect(selected?.title).toBe('The Boundary-Avoidant Harmonizer');
    expect(selected?.sentences).toContain(
      `Your balance may be allowing small discomfort early, so it doesn’t become larger later.`,
    );
  });

  it('can select The Fully Settled Responder as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('genuine_relaxation_in_alert_context', 'journal'),
      signal('settles_without_readiness', 'bodyMap'),
      signal('problems_not_anticipated', 'reflectionBank'),
      signal('complete_calm', 'dailyCheckIn'),
      signal('face_value_trust_no_scanning', 'journal'),
      signal('prepares_only_with_reason', 'journal'),
      signal('open_with_early_signs', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'safety_regulation_015_fully_settled_responder',
      title: 'Fully Settled Responder',
      category: 'safetyRegulation',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('fullySettledResponder');
    expect(selected?.title).toBe('The Fully Settled Responder');
    expect(selected?.sentences).toContain(
      `Your balance may be staying open while still noticing early signs when something is shifting.`,
    );
  });

  it('can select The Grief-Avoidant Mover as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('moves_on_to_avoid_heavy', 'journal'),
      signal('past_revisiting_unhelpful', 'reflectionBank'),
      signal('next_over_lingering', 'journal'),
      signal('unprocessed_forward_easier', 'dailyCheckIn'),
      signal('low_return_after_over', 'journal'),
      signal('forward_motion_over_reflection', 'journal'),
      signal('reflection_prevents_unacknowledged', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'grief_transitions_015_grief_avoidant_mover',
      title: 'Grief-Avoidant Mover',
      category: 'griefTransitions',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('griefAvoidantMover');
    expect(selected?.title).toBe('The Grief-Avoidant Mover');
    expect(selected?.sentences).toContain(
      `Your balance may be letting some reflection in, so things don’t stay unacknowledged beneath the surface.`,
    );
  });

  it('can select The Rhythm-Follower as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('moment_based_action', 'journal'),
      signal('energy_guides_decisions', 'reflectionBank'),
      signal('moves_with_rhythm', 'bodyMap'),
      signal('capacity_changes_consistency_hard', 'dailyCheckIn'),
      signal('trusts_unpredictable_timing', 'journal'),
      signal('productive_slow_day_variation', 'journal'),
      signal('consistency_supports_rhythm', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'time_rhythms_015_rhythm_follower',
      title: 'Rhythm-Follower',
      category: 'timeRhythms',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('rhythmFollower');
    expect(selected?.title).toBe('The Rhythm-Follower');
    expect(selected?.sentences).toContain(
      `Your balance may be building enough consistency to support your rhythm without overriding it.`,
    );
  });

  it('can select The Minimal Communicator as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('simple_direct_no_extra_detail', 'journal'),
      signal('no_need_to_expand', 'reflectionBank'),
      signal('assumes_message_clear', 'journal'),
      signal('revisit_only_if_asked', 'dailyCheckIn'),
      signal('efficient_words_interpretation_room', 'relationshipMirror'),
      signal('low_responsibility_for_reception', 'journal'),
      signal('more_explanation_connection', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'communication_voice_015_minimal_communicator',
      title: 'Minimal Communicator',
      category: 'communicationVoice',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('minimalCommunicator');
    expect(selected?.title).toBe('The Minimal Communicator');
    expect(selected?.sentences).toContain(
      `Your balance may be recognizing when a little more explanation creates more connection.`,
    );
  });

  it('can select The Family-Absorbed Adult as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('family_dynamics_pull_in', 'journal'),
      signal('old_roles_feel_current', 'reflectionBank'),
      signal('adult_body_old_position', 'bodyMap'),
      signal('family_expectations_louder', 'relationshipMirror'),
      signal('family_residue_carried', 'journal'),
      signal('old_pattern_wants_unclear', 'journal'),
      signal('old_role_not_current_self', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'family_home_016_family_absorbed_adult',
      title: 'Family-Absorbed Adult',
      category: 'familyHome',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'relationshipMirror'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('familyAbsorbedAdult');
    expect(selected?.title).toBe('The Family-Absorbed Adult');
    expect(selected?.sentences).toContain(
      `Your balance may be remembering that the old role can feel familiar without being who you are now.`,
    );
  });

  it('can select The Subtle-Shift Noticer as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('small_changes_early', 'journal'),
      signal('slight_easing_tension_energy', 'bodyMap'),
      signal('trusts_subtle_signals', 'reflectionBank'),
      signal('small_relief_signals_change', 'glimmerLog'),
      signal('tiny_increment_progress', 'journal'),
      signal('early_signs_settling_strain', 'journal'),
      signal('small_signals_without_overreading', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'glimmers_regulation_016_subtle_shift_noticer',
      title: 'Subtle-Shift Noticer',
      category: 'glimmersRegulation',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'glimmerLog'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('subtleShiftNoticer');
    expect(selected?.title).toBe('The Subtle-Shift Noticer');
    expect(selected?.sentences).toContain(
      `Your balance may be letting small signals guide you without reading too much into every tiny change.`,
    );
  });

  it('can select The Expressive Creator as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('expression_first_creating', 'journal'),
      signal('feeling_over_practicality', 'reflectionBank'),
      signal('alive_idea_without_use', 'journal'),
      signal('creativity_beyond_language', 'journal'),
      signal('emotion_beauty_personal_meaning', 'dailyCheckIn'),
      signal('useful_not_required', 'journal'),
      signal('expression_to_form_choice', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'creativity_expression_016_expressive_creator',
      title: 'Expressive Creator',
      category: 'creativityExpression',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'reflectionBank'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('expressiveCreator');
    expect(selected?.title).toBe('The Expressive Creator');
    expect(selected?.sentences).toContain(
      `Your balance may be giving expression room while still choosing which ideas you want to bring all the way into form.`,
    );
  });

  it('can select The Integrity Purist as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('quick_values_conflict', 'journal'),
      signal('compromise_deep_cost', 'reflectionBank'),
      signal('good_enough_misaligned', 'journal'),
      signal('practical_but_wrong_body_resist', 'bodyMap'),
      signal('conscience_settling', 'journal'),
      signal('small_misalignment_bothers', 'journal'),
      signal('integrity_without_perfection', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'values_integrity_016_integrity_purist',
      title: 'Integrity Purist',
      category: 'valuesIntegrity',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'bodyMap'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('integrityPurist');
    expect(selected?.title).toBe('The Integrity Purist');
    expect(selected?.sentences).toContain(
      `Your balance may be protecting your integrity without requiring every situation to meet a perfect standard.`,
    );
  });

  it('can select The Pure Symbolic Processor as the one primary persona', () => {
    const signals: UserSignal[] = [
      signal('symbolic_self_understanding', 'journal'),
      signal('metaphor_before_practical', 'dream'),
      signal('repeated_symbols_pointing', 'dream'),
      signal('emotional_truth_symbol', 'journal'),
      signal('nonliteral_feels_real', 'reflectionBank'),
      signal('symbolism_accesses_unsaid', 'journal'),
      signal('symbolism_waking_life_check', 'journal'),
    ];

    const archivePatterns: ArchivePatternScore[] = [{
      patternKey: 'dreams_symbols_016_pure_symbolic_processor',
      title: 'Pure Symbolic Processor',
      category: 'dreamsSymbols',
      score: 0.95,
      confidence: 'strong',
      movement: 'new',
      timeframeDays: 90,
      sources: ['journal', 'dream'],
      evidence: [],
      lastSeenAt: today,
    }];

    const selected = selectPrimaryPersona({ archivePatterns, recentSignals: signals });

    expect(selected?.key).toBe('pureSymbolicProcessor');
    expect(selected?.title).toBe('The Pure Symbolic Processor');
    expect(selected?.sentences).toContain(
      `Your balance may be letting symbolism guide you while still checking how it connects to your waking life.`,
    );
  });

  it('returns the selected persona from the V2 engine without replacing the daily insight', async () => {
    const result = await buildTodayInsights({
      date: now,
      rawInputs: {
        dailyCheckIns: [{
          date: today,
          mood: 3,
          energy: 3,
          stress: 4,
          tags: ['work', 'planning', 'chores'],
        }],
        journals: [{
          date: today,
          text: 'I feel responsible for carrying the mental load and tracking everything. I cannot turn off, I handle everything, and I keep preparing with a checklist. The household chores and logistics feel like invisible labor.',
        }],
      },
      history: [],
    });

    expect(result.primaryPersona?.key).toBe('overResponsibleStabilizer');
    expect(result.primaryPersona?.sentences).toContain(
      `Your strength may show up as steadiness under pressure, but that does not mean pressure is harmless to you. You can be good at carrying something and still deserve to put it down.`,
    );
    expect(result.insights.some(insight => insight.slot === 'whatMySkyNoticed')).toBe(true);
  });
});

function signal(key: UserSignal['key'], source: UserSignal['source']): UserSignal {
  return {
    key,
    source,
    date: '2026-04-24',
    strength: 0.82,
    evidence: { source, date: '2026-04-24', label: key },
  };
}
