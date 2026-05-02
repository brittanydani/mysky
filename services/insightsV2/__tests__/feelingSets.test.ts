import fs from 'fs';
import path from 'path';
import { FEELING_SET_BY_KEY, FEELING_SETS, type FeelingSetKey } from '../feelingSets';
import {
  SIGNAL_TO_FEELING_SET_KEY,
  selectPrimaryFeeling,
} from '../engine/selectPrimaryFeeling';
import { buildTodayInsights } from '../knowledgeEngineV2';
import type { SignalKey, UserSignal } from '../types';

function signalKeysFromTypes(): Set<string> {
  const typesPath = path.join(__dirname, '..', 'types.ts');
  const source = fs.readFileSync(typesPath, 'utf8');
  const signalBlock = source.slice(
    source.indexOf('export type SignalKey'),
    source.indexOf('export interface EvidenceAnchor'),
  );

  return new Set(Array.from(signalBlock.matchAll(/\| '([^']+)'/g), match => match[1]));
}

function signalFor(key: SignalKey, strength = 0.9): UserSignal {
  return {
    key,
    source: 'journal',
    date: '2026-04-24',
    strength,
    sentiment: 'neutral',
  };
}

describe('insightsV2 feeling sets', () => {
  it('keeps the provided feeling-set copy as the canonical list', () => {
    expect(FEELING_SETS).toHaveLength(75);
    expect(FEELING_SETS.map(set => set.setNumber)).toEqual([
      1,
      2,
      3,
      4,
      5,
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
    ]);
    expect(FEELING_SETS.every(set => set.sentences.length === 10)).toBe(true);

    expect(FEELING_SET_BY_KEY.hurt).toMatchObject({
      key: 'hurt',
      setNumber: 1,
      title: 'Hurt',
    });
    expect(FEELING_SET_BY_KEY.hurt.sentences).toEqual([
      `Hurt can make things feel personal, even when you’re trying to stay reasonable. It may not need to be minimized or explained away before it counts.`,
      `When hurt shows up repeatedly, it may be pointing to something that still needs care, clarity, repair, or distance.`,
      `Hurt is not a recovery tool. It is the thing your system may be asking you to tend to.`,
      `Sometimes hurt stays active because something important never felt fully acknowledged.`,
      `Hurt can be quiet and still shape the whole day. It does not have to be dramatic to be real.`,
      `When you feel hurt, your mind may look for the exact reason. But sometimes the first task is simply admitting that it landed.`,
      `Hurt can make you want closeness and protection at the same time. That contradiction can feel confusing, but it makes sense.`,
      `Some hurt is about what happened. Some hurt is about what it reminded you of.`,
      `If hurt keeps returning, it may be less about “moving on” and more about understanding what still feels unresolved.`,
      `Hurt may soften when it is named accurately, not when it is rushed into a lesson.`,
    ]);

    expect(FEELING_SET_BY_KEY.anger).toMatchObject({
      key: 'anger',
      setNumber: 2,
      title: 'Anger',
    });
    expect(FEELING_SET_BY_KEY.anger.sentences).toEqual([
      `Anger can show up when something feels crossed, dismissed, or unfair. It may not mean you’re overreacting — it may mean something mattered.`,
      `Anger often moves faster than understanding. You might feel it before you fully know what it’s about.`,
      `Sometimes anger is about what just happened. Sometimes it’s about what this moment reminded you of.`,
      `Anger can carry clarity, even when it feels uncomfortable. It may be pointing toward a boundary, not just a reaction.`,
      `You might try to calm anger quickly, but slowing down to understand it can change what it’s asking for.`,
      `Anger doesn’t always need to be acted on to be useful. Feeling it and naming it can already shift something.`,
      `Under anger, there is often something more vulnerable — hurt, fear, or feeling unseen.`,
      `Anger can make things feel urgent. Not everything it points to needs immediate action, but it may need attention.`,
      `Suppressed anger doesn’t disappear. It often shows up later as tension, irritability, or distance.`,
      `Anger may soften when it’s respected, not dismissed.`,
    ]);

    expect(FEELING_SET_BY_KEY.anxiety).toMatchObject({
      key: 'anxiety',
      setNumber: 3,
      title: 'Anxiety',
    });
    expect(FEELING_SET_BY_KEY.anxiety.sentences).toEqual([
      `Anxiety can make everything feel closer than it is, as if something needs your attention right now.`,
      `Your mind may try to solve anxiety by thinking ahead, even when there isn’t a clear problem yet.`,
      `Anxiety often shows up as preparation — scanning, planning, anticipating — even when nothing has gone wrong.`,
      `It can be hard to tell the difference between possibility and probability when anxiety is active.`,
      `Your body may feel the urgency before your mind understands why.`,
      `Anxiety can make you feel responsible for outcomes you don’t fully control.`,
      `Trying to eliminate anxiety completely can sometimes make it louder.`,
      `Anxiety may not mean something is wrong — it may mean something feels uncertain.`,
      `It can help to bring your attention back to what is actually happening, not just what could happen.`,
      `Anxiety may ease when your body feels safe, not just when your thoughts feel resolved.`,
    ]);

    expect(FEELING_SET_BY_KEY.sadness).toMatchObject({
      key: 'sadness',
      setNumber: 4,
      title: 'Sadness',
    });
    expect(FEELING_SET_BY_KEY.sadness.sentences).toEqual([
      `Sadness can slow things down, even when the world around you keeps moving.`,
      `It may not always have a clear reason. Sometimes it shows up before the story is fully known.`,
      `Sadness can make everything feel heavier, not just the thing that caused it.`,
      `You may want to move out of sadness quickly, but it often asks to be felt first.`,
      `Sadness can be about loss, but also about something missing or unmet.`,
      `It may come in waves rather than staying constant.`,
      `You might not notice how much something affected you until sadness shows up.`,
      `Sadness doesn’t always need to be fixed. Sometimes it needs space.`,
      `Letting yourself feel sad doesn’t mean you’ll stay there.`,
      `Sadness can soften when it’s allowed instead of resisted.`,
    ]);

    expect(FEELING_SET_BY_KEY.guilt).toMatchObject({
      key: 'guilt',
      setNumber: 5,
      title: 'Guilt',
    });
    expect(FEELING_SET_BY_KEY.guilt.sentences).toEqual([
      `Guilt can show up when something doesn’t match how you want to show up or who you want to be.`,
      `It may point to something you want to repair — or something you’ve taken responsibility for that isn’t fully yours.`,
      `Not all guilt is accurate. Sometimes it reflects care, not wrongdoing.`,
      `Guilt can make you want to fix things quickly, even when the situation is more complex.`,
      `You may feel guilt for setting boundaries, even when those boundaries are needed.`,
      `Guilt can stay active when something feels unresolved or unspoken.`,
      `It may help to ask whether the guilt is about your values or about someone else’s expectations.`,
      `Carrying guilt doesn’t always lead to repair — clarity does.`,
      `You can care about impact without holding all the responsibility.`,
      `Guilt may soften when you understand what is actually yours to hold.`,
    ]);

    expect(FEELING_SET_BY_KEY.shame).toMatchObject({
      key: 'shame',
      setNumber: 6,
      title: 'Shame',
    });
    expect(FEELING_SET_BY_KEY.shame.sentences).toEqual([
      `Shame can feel like it’s about who you are, not just what happened. That’s what makes it so heavy.`,
      `It often makes you want to hide, pull back, or become smaller.`,
      `Shame can stay even when the situation is over, because it attaches to identity, not just behavior.`,
      `You may replay moments trying to figure out what you did wrong, even when the answer isn’t clear.`,
      `Shame can make it hard to receive care, even when you need it most.`,
      `It may show up more strongly in situations where being seen feels risky.`,
      `Not all shame is accurate. Sometimes it reflects old messages more than current truth.`,
      `You might feel like you have to fix yourself before being allowed to be close to others.`,
      `Shame often softens in safe connection, not isolation.`,
      `It may ease when you separate “what happened” from “who I am.”`,
    ]);

    expect(FEELING_SET_BY_KEY.fear).toMatchObject({
      key: 'fear',
      setNumber: 7,
      title: 'Fear',
    });
    expect(FEELING_SET_BY_KEY.fear.sentences).toEqual([
      `Fear can make everything feel immediate, even when nothing has happened yet.`,
      `Your body may react before your mind has time to understand why.`,
      `Fear often focuses on what could go wrong, not what is likely.`,
      `It can narrow your attention to safety, even if it limits other possibilities.`,
      `Fear may show up as avoidance, hesitation, or needing more certainty.`,
      `You might feel pulled between wanting to move forward and wanting to stay protected.`,
      `Not all fear means danger. Sometimes it means something matters.`,
      `Fear can make decisions feel heavier than they actually are.`,
      `Your system may be trying to keep you safe, even if the signal is louder than necessary.`,
      `Fear may settle when your body feels supported, not just when your mind is convinced.`,
    ]);

    expect(FEELING_SET_BY_KEY.loneliness).toMatchObject({
      key: 'loneliness',
      setNumber: 8,
      title: 'Loneliness',
    });
    expect(FEELING_SET_BY_KEY.loneliness.sentences).toEqual([
      `Loneliness can be present even when you’re not physically alone.`,
      `It may feel like a lack of being understood, not just a lack of people.`,
      `You might want connection and also feel unsure how to reach for it.`,
      `Loneliness can make small disconnections feel bigger.`,
      `It may show up more when something meaningful isn’t being shared with anyone.`,
      `You might feel distant even in familiar relationships.`,
      `Loneliness can make you question whether you’re truly seen.`,
      `It may come and go depending on how connected you feel internally and externally.`,
      `Wanting connection doesn’t mean something is missing in you.`,
      `Loneliness may soften when something real is shared, even in a small way.`,
    ]);

    expect(FEELING_SET_BY_KEY.overwhelm).toMatchObject({
      key: 'overwhelm',
      setNumber: 9,
      title: 'Overwhelm',
    });
    expect(FEELING_SET_BY_KEY.overwhelm.sentences).toEqual([
      `Overwhelm can make everything feel like it’s happening at once.`,
      `Even small tasks can feel heavy when your system is already full.`,
      `It may be less about the size of one thing and more about the accumulation of many.`,
      `Overwhelm can make it hard to know where to start.`,
      `Your mind may try to hold everything at the same time instead of separating it.`,
      `You might feel pressure to do more, even when your capacity is lower.`,
      `Overwhelm can make rest feel less effective because your mind stays active.`,
      `It may show up as shutdown, avoidance, or irritability.`,
      `Not everything needs to be handled right now, even if it feels that way.`,
      `Overwhelm may ease when things are broken into smaller, clearer pieces.`,
    ]);

    expect(FEELING_SET_BY_KEY.resentment).toMatchObject({
      key: 'resentment',
      setNumber: 10,
      title: 'Resentment',
    });
    expect(FEELING_SET_BY_KEY.resentment.sentences).toEqual([
      `Resentment often builds when something has been given or tolerated for too long.`,
      `It may point to a boundary that wasn’t expressed or held.`,
      `You might feel frustrated, but also unsure how to change the situation.`,
      `Resentment can grow quietly before it becomes obvious.`,
      `It may not be about one moment, but about a pattern over time.`,
      `You might feel like you’ve been carrying more than your share.`,
      `Resentment can make connection feel harder, even when you still care.`,
      `It may be easier to feel irritation than to name what you actually need.`,
      `Addressing resentment often requires clarity, not just patience.`,
      `It may soften when what’s been unspoken finally has a place to be said.`,
    ]);

    expect(FEELING_SET_BY_KEY.jealousy).toMatchObject({
      key: 'jealousy',
      setNumber: 11,
      title: 'Jealousy',
    });
    expect(FEELING_SET_BY_KEY.jealousy.sentences).toEqual([
      `Jealousy can show up when something you want feels closer to someone else than it does to you.`,
      `It may not mean you wish badly for someone. It may mean something in you is aching to be included, chosen, seen, or allowed.`,
      `Jealousy can point toward desire before you have fully admitted the desire to yourself.`,
      `You might feel embarrassed by jealousy, but it often carries useful information about what matters to you.`,
      `Sometimes jealousy is less about comparison and more about grief for what you didn’t receive.`,
      `It can make someone else’s joy feel painful, even when you care about them.`,
      `Jealousy may soften when you ask what it is trying to show you, instead of judging yourself for feeling it.`,
      `It can become heavier when it stays hidden and unnamed.`,
      `Jealousy does not always need action, but it may need honesty.`,
      `Under jealousy, there is often a wish that deserves to be taken seriously.`,
    ]);

    expect(FEELING_SET_BY_KEY.regret).toMatchObject({
      key: 'regret',
      setNumber: 12,
      title: 'Regret',
    });
    expect(FEELING_SET_BY_KEY.regret.sentences).toEqual([
      `Regret can pull your mind back to a moment you wish you could handle differently.`,
      `It may show up when you can see something now that you couldn’t see clearly then.`,
      `Regret can be painful because it mixes care with hindsight.`,
      `You might replay the choice, looking for the version of you who could have known better.`,
      `Sometimes regret points toward repair. Other times it points toward grief.`,
      `Regret can become heavier when it turns into punishment instead of learning.`,
      `You can take responsibility without treating your past self with cruelty.`,
      `It may help to ask what was available to you then, not only what is obvious now.`,
      `Regret may soften when it becomes information for the future, not a sentence over the past.`,
      `The fact that you regret something may mean your values are still alive.`,
    ]);

    expect(FEELING_SET_BY_KEY.confusion).toMatchObject({
      key: 'confusion',
      setNumber: 13,
      title: 'Confusion',
    });
    expect(FEELING_SET_BY_KEY.confusion.sentences).toEqual([
      `Confusion can make even simple things feel harder to trust.`,
      `It often shows up when your feelings, facts, and instincts are not lining up yet.`,
      `You may want a clear answer before the situation is ready to give one.`,
      `Confusion can feel frustrating, but it may also mean you are noticing complexity.`,
      `Sometimes confusion protects you from choosing too quickly.`,
      `You might feel pulled toward certainty, even when more time would help.`,
      `Confusion can make you question yourself, especially when other people seem more certain.`,
      `Not knowing yet is not the same as failing to understand.`,
      `Clarity may come in pieces rather than all at once.`,
      `Confusion may ease when you stop forcing one answer before all parts of you have spoken.`,
    ]);

    expect(FEELING_SET_BY_KEY.numbness).toMatchObject({
      key: 'numbness',
      setNumber: 14,
      title: 'Numbness',
    });
    expect(FEELING_SET_BY_KEY.numbness.sentences).toEqual([
      `Numbness can feel like nothing is happening, but it often shows up when too much has been happening.`,
      `It may be your system lowering the volume because the feeling is too much to hold all at once.`,
      `Numbness can make it hard to know what you need, because the signal has gone quiet.`,
      `You might judge yourself for not feeling more, even when numbness is the response that arrived.`,
      `Numbness does not mean you don’t care. It may mean caring has become too much to access directly.`,
      `It can show up after stress, conflict, grief, fear, or exhaustion.`,
      `Numbness may soften slowly, not through force.`,
      `Sometimes the first sign of movement is not a big emotion, but a small preference.`,
      `It may help to notice what is still available: warmth, pressure, texture, breath, sound, or one small choice.`,
      `Numbness is not the end of feeling. It is often the place your system goes when feeling needs more safety.`,
    ]);

    expect(FEELING_SET_BY_KEY.relief).toMatchObject({
      key: 'relief',
      setNumber: 15,
      title: 'Relief',
    });
    expect(FEELING_SET_BY_KEY.relief.sentences).toEqual([
      `Relief can arrive quietly, like your body no longer has to hold itself as tightly.`,
      `It may show up after clarity, repair, rest, distance, or finally naming what was true.`,
      `Relief does not always mean everything is fixed. Sometimes it means one part of the pressure has lifted.`,
      `You might feel relief and sadness at the same time, especially if something was hard for a long time.`,
      `Relief can reveal how much you were carrying before you noticed the weight.`,
      `Sometimes relief comes when you stop trying to make something work that kept hurting.`,
      `It may feel unfamiliar if your body is used to staying prepared.`,
      `Relief can be worth noticing because it shows what your system responds to.`,
      `You may not need to explain relief immediately. Letting it land can be enough.`,
      `Relief may be your body’s way of saying, “Something is safer now.”`,
    ]);

    expect(FEELING_SET_BY_KEY.disappointment).toMatchObject({
      key: 'disappointment',
      setNumber: 16,
      title: 'Disappointment',
    });
    expect(FEELING_SET_BY_KEY.disappointment.sentences).toEqual([
      `Disappointment can feel like a quiet drop — something didn’t meet what you hoped for.`,
      `It may not be as loud as anger or sadness, but it can linger longer.`,
      `Disappointment often carries expectation that didn’t match reality.`,
      `You might feel it most when something mattered to you more than you realized.`,
      `It can show up as a loss of energy rather than a strong emotion.`,
      `Disappointment may be about the situation, or about what you thought was possible.`,
      `You might try to move past it quickly, even when it still has weight.`,
      `It can build when smaller disappointments go unacknowledged.`,
      `Disappointment doesn’t always need fixing — sometimes it needs to be named.`,
      `It may soften when you let yourself feel what didn’t happen, not just what did.`,
    ]);

    expect(FEELING_SET_BY_KEY.frustration).toMatchObject({
      key: 'frustration',
      setNumber: 17,
      title: 'Frustration',
    });
    expect(FEELING_SET_BY_KEY.frustration.sentences).toEqual([
      `Frustration can feel like blocked movement — wanting something to change, but it isn’t.`,
      `It often shows up when effort doesn’t lead to the result you expected.`,
      `Frustration can build when something keeps repeating without resolution.`,
      `You might feel it in your body as tension, pressure, or restlessness.`,
      `It can come from external obstacles or internal limits.`,
      `Frustration may push you toward action, even when action isn’t immediately helpful.`,
      `It can make small problems feel bigger when it accumulates.`,
      `You might feel impatient with yourself or with others.`,
      `Frustration can carry useful information about what isn’t working.`,
      `It may ease when you shift from forcing progress to adjusting approach.`,
    ]);

    expect(FEELING_SET_BY_KEY.insecurity).toMatchObject({
      key: 'insecurity',
      setNumber: 18,
      title: 'Insecurity',
    });
    expect(FEELING_SET_BY_KEY.insecurity.sentences).toEqual([
      `Insecurity can make you question your place, your worth, or how you’re being seen.`,
      `It often shows up in situations where something matters to you.`,
      `You might compare yourself more when insecurity is active.`,
      `It can make you look for reassurance or confirmation.`,
      `Insecurity may come and go depending on the environment or relationship.`,
      `You might feel more sensitive to feedback, tone, or perceived judgment.`,
      `It doesn’t always reflect reality — sometimes it reflects fear of being less than enough.`,
      `You may try to compensate, withdraw, or overperform.`,
      `Insecurity can feel personal, even when it’s situational.`,
      `It may soften when you reconnect to what is already true about you.`,
    ]);

    expect(FEELING_SET_BY_KEY.hope).toMatchObject({
      key: 'hope',
      setNumber: 19,
      title: 'Hope',
    });
    expect(FEELING_SET_BY_KEY.hope.sentences).toEqual([
      `Hope can feel like a quiet opening toward something better.`,
      `It may not be certainty — just a sense that things could shift.`,
      `Hope can exist even when things are still hard.`,
      `You might feel it as possibility rather than proof.`,
      `It can come and go, especially during uncertain times.`,
      `Hope may make it easier to stay engaged with something.`,
      `It can feel fragile when things haven’t changed yet.`,
      `Hope may grow when you see even small signs of movement.`,
      `It doesn’t require everything to be okay — just not completely closed.`,
      `Hope may be the part of you that keeps looking forward.`,
    ]);

    expect(FEELING_SET_BY_KEY.exhaustion).toMatchObject({
      key: 'exhaustion',
      setNumber: 20,
      title: 'Exhaustion',
    });
    expect(FEELING_SET_BY_KEY.exhaustion.sentences).toEqual([
      `Exhaustion can feel deeper than tiredness — like your system has been running for too long.`,
      `It may show up physically, mentally, or emotionally, or all at once.`,
      `Even small things can feel harder when exhaustion is present.`,
      `You might feel like you’re functioning, but not really recovering.`,
      `Exhaustion can build slowly without a clear moment of overload.`,
      `It may come from effort, stress, or holding too much for too long.`,
      `Rest may help, but sometimes it doesn’t feel like enough right away.`,
      `You might feel less patience, less clarity, or less capacity.`,
      `Exhaustion doesn’t mean weakness — it often means something has been sustained.`,
      `It may ease when both effort and pressure are allowed to decrease.`,
    ]);

    expect(FEELING_SET_BY_KEY.irritation).toMatchObject({
      key: 'irritation',
      setNumber: 21,
      title: 'Irritation',
    });
    expect(FEELING_SET_BY_KEY.irritation.sentences).toEqual([
      `Irritation can feel small, but it often points to something that’s been building.`,
      `It may show up quickly, even when the situation seems minor.`,
      `Irritation can come from repetition, interruption, or something feeling slightly off.`,
      `You might notice it more when your capacity is already lower.`,
      `It can be easier to feel irritation than to name what’s underneath it.`,
      `Irritation may signal that something needs adjusting, not just tolerating.`,
      `You might dismiss it as “not a big deal,” even when it keeps returning.`,
      `It can grow when it’s ignored or pushed aside.`,
      `Irritation often carries information about limits, preferences, or boundaries.`,
      `It may ease when you respond to the small signal instead of waiting for it to get louder.`,
    ]);

    expect(FEELING_SET_BY_KEY.embarrassment).toMatchObject({
      key: 'embarrassment',
      setNumber: 22,
      title: 'Embarrassment',
    });
    expect(FEELING_SET_BY_KEY.embarrassment.sentences).toEqual([
      `Embarrassment can feel like sudden exposure — like something about you was seen in a way you didn’t expect.`,
      `It may show up quickly and fade quickly, but still leave a trace.`,
      `You might replay the moment even after it’s over.`,
      `Embarrassment can make you want to hide, laugh it off, or move past it quickly.`,
      `It often connects to how you imagine others saw you.`,
      `You may feel more aware of yourself than you actually were to others.`,
      `Embarrassment doesn’t always reflect something serious — just something human.`,
      `It can feel bigger in your mind than it was in the moment.`,
      `Most people move on from moments like this faster than you think.`,
      `Embarrassment may soften when you allow yourself to be human instead of perfect.`,
    ]);

    expect(FEELING_SET_BY_KEY.desire).toMatchObject({
      key: 'desire',
      setNumber: 23,
      title: 'Desire',
    });
    expect(FEELING_SET_BY_KEY.desire.sentences).toEqual([
      `Desire can feel like a pull toward something — not always logical, but noticeable.`,
      `It may show up before you fully understand what it’s for.`,
      `Desire can feel energizing and uncomfortable at the same time.`,
      `You might hesitate to follow it if it doesn’t feel practical or safe.`,
      `It often points toward something you want more of, even if you haven’t named it yet.`,
      `Desire can shift depending on your environment, energy, or emotional state.`,
      `You might question it, especially if it conflicts with expectations.`,
      `Desire doesn’t always need immediate action, but it may want acknowledgment.`,
      `It can become quieter when it’s ignored repeatedly.`,
      `Desire may feel clearer when you allow it to exist without judgment.`,
    ]);

    expect(FEELING_SET_BY_KEY.pride).toMatchObject({
      key: 'pride',
      setNumber: 24,
      title: 'Pride',
    });
    expect(FEELING_SET_BY_KEY.pride.sentences).toEqual([
      `Pride can feel like a quiet sense of “I did that,” even if no one else notices.`,
      `It may come from effort, growth, or staying aligned with yourself.`,
      `Pride doesn’t have to be loud to be real.`,
      `You might downplay it, especially if you’re used to focusing on what’s next.`,
      `Pride can build when you recognize your own progress.`,
      `It may feel unfamiliar if you’re not used to acknowledging yourself.`,
      `Pride can exist alongside humility.`,
      `You might feel it more when you reflect than in the moment.`,
      `Letting pride land can strengthen your sense of self.`,
      `Pride may grow when you allow yourself to see what you’ve actually done.`,
    ]);

    expect(FEELING_SET_BY_KEY.doubt).toMatchObject({
      key: 'doubt',
      setNumber: 25,
      title: 'Doubt',
    });
    expect(FEELING_SET_BY_KEY.doubt.sentences).toEqual([
      `Doubt can make even clear things feel uncertain.`,
      `It may show up when something matters or carries risk.`,
      `You might question your decisions, your understanding, or yourself.`,
      `Doubt can slow things down, sometimes helpfully, sometimes not.`,
      `It may come from wanting to get it right.`,
      `You might look for more information to reduce it.`,
      `Doubt doesn’t always mean something is wrong — sometimes it means something is important.`,
      `It can become heavier when you expect yourself to feel completely certain.`,
      `You may move forward while still feeling unsure.`,
      `Doubt may ease when you accept that clarity doesn’t always come before action.`,
    ]);

    expect(FEELING_SET_BY_KEY.tenderness).toMatchObject({
      key: 'tenderness',
      setNumber: 26,
      title: 'Tenderness',
    });
    expect(FEELING_SET_BY_KEY.tenderness.sentences).toEqual([
      `Tenderness can feel soft and exposed at the same time.`,
      `It may show up when something matters more than you expected.`,
      `Tenderness can make you feel open, but also easier to hurt.`,
      `You might notice it around people, memories, animals, children, beauty, or moments that feel quietly meaningful.`,
      `It can feel like care before it becomes words.`,
      `Tenderness may make you want to move slowly instead of rushing past the feeling.`,
      `You might protect tenderness because it feels too vulnerable to show everywhere.`,
      `It can exist alongside sadness, love, grief, or hope.`,
      `Tenderness doesn’t always ask for action. Sometimes it asks for attention.`,
      `It may be one of the ways your system recognizes something worth caring about.`,
    ]);

    expect(FEELING_SET_BY_KEY.love).toMatchObject({
      key: 'love',
      setNumber: 27,
      title: 'Love',
    });
    expect(FEELING_SET_BY_KEY.love.sentences).toEqual([
      `Love can feel steady, intense, gentle, complicated, or all of those at once.`,
      `It may show up as care, attention, loyalty, longing, patience, protection, or the desire to stay close.`,
      `Love does not always feel simple, especially when fear or hurt is near it.`,
      `You might notice love most clearly when someone or something matters enough to affect you.`,
      `Love can make you want to give, but it can also reveal where you need care too.`,
      `It may feel easier to offer love than to receive it fully.`,
      `Love can stay present even when a relationship or situation is difficult.`,
      `Sometimes love asks for closeness. Sometimes it asks for boundaries.`,
      `Love may become clearer when it is not mixed with proving, rescuing, or fear.`,
      `It can be one of the strongest signs of what your life is organized around.`,
    ]);

    expect(FEELING_SET_BY_KEY.grief).toMatchObject({
      key: 'grief',
      setNumber: 28,
      title: 'Grief',
    });
    expect(FEELING_SET_BY_KEY.grief.sentences).toEqual([
      `Grief can arrive before you fully understand what was lost.`,
      `It may show up around endings, changes, distance, aging, missed chances, or things that never happened the way you needed them to.`,
      `Grief does not always look like crying. Sometimes it looks like heaviness, quietness, irritability, or feeling far away.`,
      `It can come in waves, even after you thought you were doing better.`,
      `Grief may attach to people, places, roles, versions of yourself, or futures you imagined.`,
      `You might feel grief for something that still matters, even if you know it cannot be changed.`,
      `Grief does not always need a solution. Sometimes it needs room.`,
      `It can feel confusing when grief and relief exist together.`,
      `Grief may soften when the loss is allowed to be real.`,
      `It often moves slowly because it is adjusting to a world that changed.`,
    ]);

    expect(FEELING_SET_BY_KEY.peace).toMatchObject({
      key: 'peace',
      setNumber: 29,
      title: 'Peace',
    });
    expect(FEELING_SET_BY_KEY.peace.sentences).toEqual([
      `Peace can feel quiet, not dramatic.`,
      `It may show up when your body no longer feels like it has to prepare for something.`,
      `Peace does not always mean everything is perfect. Sometimes it means something in you has stopped fighting.`,
      `You might notice peace as space, steadiness, or a lack of urgency.`,
      `It can feel unfamiliar if you are used to bracing.`,
      `Peace may come after clarity, distance, repair, rest, or acceptance.`,
      `You might not trust it right away if calm usually feels temporary.`,
      `Peace is worth noticing because it shows what your system can settle into.`,
      `It may be easier to feel peace when you are not trying to force it.`,
      `Peace can be small and still real.`,
    ]);

    expect(FEELING_SET_BY_KEY.joy).toMatchObject({
      key: 'joy',
      setNumber: 30,
      title: 'Joy',
    });
    expect(FEELING_SET_BY_KEY.joy.sentences).toEqual([
      `Joy can feel like a lift, a spark, or a sudden sense of aliveness.`,
      `It may come from something small — a song, a laugh, a color, a person, a moment that feels easy.`,
      `Joy does not always erase what is hard. It can exist beside it.`,
      `You might move past joy quickly if your attention is trained on what still needs care.`,
      `Joy can feel vulnerable because it opens you to wanting more.`,
      `It may show up when you are not trying to earn it.`,
      `Joy can remind you that your inner world is not only made of pain, pressure, or processing.`,
      `Sometimes joy returns before everything is solved.`,
      `Letting joy land can be its own kind of regulation.`,
      `Joy may be one way your system remembers that life can still reach you.`,
    ]);

    expect(FEELING_SET_BY_KEY.contentment).toMatchObject({
      key: 'contentment',
      setNumber: 31,
      title: 'Contentment',
    });
    expect(FEELING_SET_BY_KEY.contentment.sentences).toEqual([
      `Contentment can feel like not needing the moment to become anything else.`,
      `It may show up when enough actually feels like enough.`,
      `Contentment is quieter than excitement, but it can be deeply regulating.`,
      `You might miss it if you are looking only for big positive feelings.`,
      `It can feel like a pause in wanting, proving, or preparing.`,
      `Contentment may grow when your expectations and reality come closer together.`,
      `It does not mean you have stopped growing. It means something is allowed to be okay as it is.`,
      `You might feel contentment in ordinary moments that do not look impressive from the outside.`,
      `It can be easier to trust contentment when you are not comparing it to anyone else’s life.`,
      `Contentment may be your system recognizing, “This is enough for now.”`,
    ]);

    expect(FEELING_SET_BY_KEY.boredom).toMatchObject({
      key: 'boredom',
      setNumber: 32,
      title: 'Boredom',
    });
    expect(FEELING_SET_BY_KEY.boredom.sentences).toEqual([
      `Boredom can feel like restlessness without a clear direction.`,
      `It may show up when your mind wants stimulation, novelty, meaning, or movement.`,
      `Sometimes boredom is a signal that something feels too repetitive or disconnected.`,
      `Sometimes it is the uncomfortable space before creativity returns.`,
      `You might rush to fill boredom because stillness feels awkward.`,
      `Boredom can make ordinary life feel flatter than it actually is.`,
      `It may be pointing toward a need for play, challenge, connection, or change.`,
      `Not all boredom is bad. Some of it creates space for new ideas.`,
      `Boredom can feel heavier when you judge yourself for feeling it.`,
      `It may ease when you ask what kind of aliveness is missing.`,
    ]);

    expect(FEELING_SET_BY_KEY.restlessness).toMatchObject({
      key: 'restlessness',
      setNumber: 33,
      title: 'Restlessness',
    });
    expect(FEELING_SET_BY_KEY.restlessness.sentences).toEqual([
      `Restlessness can feel like your body or mind wants to move, but does not know where.`,
      `It may show up when something feels unfinished, trapped, delayed, or under-stimulating.`,
      `You might feel restless when you need action, change, or release.`,
      `Restlessness can make it hard to stay present.`,
      `It may push you toward doing something before you know what would actually help.`,
      `Sometimes restlessness is anxiety. Sometimes it is energy that needs a direction.`,
      `You might feel it as fidgeting, scrolling, pacing, planning, or jumping between tasks.`,
      `It can be useful to ask whether you need movement, clarity, stimulation, or comfort.`,
      `Restlessness may get louder when ignored, but not every impulse needs to be followed.`,
      `It may settle when the energy has somewhere honest to go.`,
    ]);

    expect(FEELING_SET_BY_KEY.vulnerability).toMatchObject({
      key: 'vulnerability',
      setNumber: 34,
      title: 'Vulnerability',
    });
    expect(FEELING_SET_BY_KEY.vulnerability.sentences).toEqual([
      `Vulnerability can feel like being more visible than usual.`,
      `It may show up when you share something real, need something, hope for something, or let someone matter.`,
      `Vulnerability can feel risky even when nothing bad is happening.`,
      `You might want closeness and protection at the same time.`,
      `It can make ordinary interactions feel more emotionally charged.`,
      `Vulnerability may be harder when you are unsure how the other person will respond.`,
      `It does not mean you are weak. It means something is open.`,
      `You might feel tempted to pull back right after being honest.`,
      `Vulnerability often needs safety, pacing, and choice.`,
      `It may become easier when you can stay connected to yourself while being seen.`,
    ]);

    expect(FEELING_SET_BY_KEY.helplessness).toMatchObject({
      key: 'helplessness',
      setNumber: 35,
      title: 'Helplessness',
    });
    expect(FEELING_SET_BY_KEY.helplessness.sentences).toEqual([
      `Helplessness can feel like wanting something to change but not seeing a way to affect it.`,
      `It may make your body feel heavy, frozen, small, or stuck.`,
      `Helplessness often shows up when effort no longer seems connected to outcome.`,
      `You might feel frustrated with yourself for not doing more, even when the situation has real limits.`,
      `It can make the future feel closed, even if it is not.`,
      `Helplessness may need compassion before it needs problem-solving.`,
      `Sometimes the smallest choice can matter because it reminds you that you still have some agency.`,
      `It may soften when the focus shifts from fixing everything to finding one reachable next step.`,
      `Helplessness is not laziness. It is often what happens when a system feels overwhelmed by limits.`,
      `It may need support, not pressure.`,
    ]);

    expect(FEELING_SET_BY_KEY.powerlessness).toMatchObject({
      key: 'powerlessness',
      setNumber: 36,
      title: 'Powerlessness',
    });
    expect(FEELING_SET_BY_KEY.powerlessness.sentences).toEqual([
      `Powerlessness can feel like your voice, choice, or effort does not matter enough.`,
      `It may show up when decisions are being made around you instead of with you.`,
      `Powerlessness can bring anger, shutdown, sadness, or a need to regain control somewhere else.`,
      `You might feel it strongly when fairness, safety, or autonomy is involved.`,
      `It can make small choices feel more important because they are the choices still available.`,
      `Powerlessness may be about the current situation, or it may touch older experiences of not being heard.`,
      `It can make you want to either fight harder or give up completely.`,
      `Naming powerlessness matters because it separates your worth from the limits of the situation.`,
      `It may ease when you find where your influence still exists.`,
      `Powerlessness does not mean you have no self. It means something around you has limited your agency.`,
    ]);

    expect(FEELING_SET_BY_KEY.bitterness).toMatchObject({
      key: 'bitterness',
      setNumber: 37,
      title: 'Bitterness',
    });
    expect(FEELING_SET_BY_KEY.bitterness.sentences).toEqual([
      `Bitterness can form when hurt has gone too long without repair.`,
      `It often carries disappointment, anger, and exhaustion together.`,
      `You might feel bitter when you have had to accept something that never felt fair.`,
      `Bitterness can protect you from hoping too much again.`,
      `It may make softness feel risky or foolish.`,
      `Sometimes bitterness points to grief that has hardened around the edges.`,
      `It can grow when harm is minimized or repeated.`,
      `Bitterness may need honesty before it can soften.`,
      `It does not mean you are a bad person. It may mean something in you got tired of being hurt.`,
      `It may ease when the truth of what happened is allowed to matter.`,
    ]);

    expect(FEELING_SET_BY_KEY.compassion).toMatchObject({
      key: 'compassion',
      setNumber: 38,
      title: 'Compassion',
    });
    expect(FEELING_SET_BY_KEY.compassion.sentences).toEqual([
      `Compassion can feel like care that does not need someone to be perfect first.`,
      `It may show up as softness, patience, concern, or the desire to understand.`,
      `Compassion does not mean excusing harm. It means seeing humanity clearly.`,
      `You might feel compassion for others more easily than for yourself.`,
      `It can make room for complexity without erasing accountability.`,
      `Compassion may be strongest when you can see the pain underneath behavior.`,
      `It can become draining when it turns into over-responsibility.`,
      `Healthy compassion still has boundaries.`,
      `You may feel more settled when compassion includes you too.`,
      `Compassion can be a bridge between truth and care.`,
    ]);

    expect(FEELING_SET_BY_KEY.gratitude).toMatchObject({
      key: 'gratitude',
      setNumber: 39,
      title: 'Gratitude',
    });
    expect(FEELING_SET_BY_KEY.gratitude.sentences).toEqual([
      `Gratitude can feel like noticing what is good without denying what is hard.`,
      `It may show up quietly, through appreciation, relief, warmth, or a sense of being held by something.`,
      `Gratitude does not require pretending everything is fine.`,
      `You might feel it more when something meets a need you did not realize was tender.`,
      `It can be small and still meaningful.`,
      `Gratitude may soften your body because something feels received.`,
      `You may resist gratitude if it feels like pressure to ignore pain.`,
      `Real gratitude has room for honesty.`,
      `It can point toward what supports you, nourishes you, or helps you feel less alone.`,
      `Gratitude may be your system recognizing, “This mattered.”`,
    ]);

    expect(FEELING_SET_BY_KEY.disgust).toMatchObject({
      key: 'disgust',
      setNumber: 40,
      title: 'Disgust',
    });
    expect(FEELING_SET_BY_KEY.disgust.sentences).toEqual([
      `Disgust can show up when something feels wrong, unsafe, invasive, or misaligned.`,
      `It may be physical before it is logical.`,
      `Disgust can create distance quickly because your system wants separation from what feels harmful.`,
      `You might feel it around behavior, environments, memories, smells, words, or dynamics.`,
      `It does not always need to be polite.`,
      `Disgust can point toward a strong boundary.`,
      `Sometimes it protects you from getting too close to something that does not feel okay.`,
      `You might judge yourself for feeling disgust, especially if others seem unaffected.`,
      `It may be worth asking what your body is trying to move away from.`,
      `Disgust often says, “This does not belong near me.”`,
    ]);

    expect(FEELING_SET_BY_KEY.admiration).toMatchObject({
      key: 'admiration',
      setNumber: 41,
      title: 'Admiration',
    });
    expect(FEELING_SET_BY_KEY.admiration.sentences).toEqual([
      `Admiration can show you what you value.`,
      `It may appear when someone reflects a quality you respect, want, or feel moved by.`,
      `Admiration does not have to become comparison.`,
      `You might feel it as warmth, inspiration, longing, or respect.`,
      `It can point toward something you want to grow in yourself.`,
      `Admiration may feel clean when it is not mixed with jealousy or self-criticism.`,
      `It can help you recognize what kind of person, life, or energy draws you.`,
      `You may admire someone because they make something feel possible.`,
      `Admiration can be a form of orientation.`,
      `It may be your inner world saying, “This matters to me.”`,
    ]);

    expect(FEELING_SET_BY_KEY.longing).toMatchObject({
      key: 'longing',
      setNumber: 42,
      title: 'Longing',
    });
    expect(FEELING_SET_BY_KEY.longing.sentences).toEqual([
      `Longing can feel like reaching toward something that is not fully here.`,
      `It may carry desire, sadness, hope, and ache at the same time.`,
      `Longing often points toward something meaningful, not something random.`,
      `You might feel it around connection, home, love, freedom, safety, purpose, or a version of life you can almost imagine.`,
      `It can be painful because it makes absence feel vivid.`,
      `Longing does not always mean you should chase something immediately.`,
      `Sometimes it asks to be understood before it asks to be acted on.`,
      `You may feel longing more strongly when life is close to what you want, but not quite there.`,
      `Longing can reveal what has been missing.`,
      `It may be your system reaching toward a life that feels more true.`,
    ]);

    expect(FEELING_SET_BY_KEY.acceptance).toMatchObject({
      key: 'acceptance',
      setNumber: 43,
      title: 'Acceptance',
    });
    expect(FEELING_SET_BY_KEY.acceptance.sentences).toEqual([
      `Acceptance can feel like stopping the fight with what is already true.`,
      `It does not always feel peaceful at first. Sometimes it feels sad, tired, or quiet.`,
      `Acceptance does not mean approval.`,
      `It may mean you are no longer spending energy arguing with reality.`,
      `You might feel it when something finally becomes clear enough to stop bargaining with.`,
      `Acceptance can make room for the next step, even if you do not like the situation.`,
      `It may arrive slowly, after resistance has had time to be heard.`,
      `You can accept something and still grieve it.`,
      `Acceptance often changes the question from “Why is this happening?” to “What now?”`,
      `It may be the moment your system stops trying to undo what cannot be undone.`,
    ]);

    expect(FEELING_SET_BY_KEY.trust).toMatchObject({
      key: 'trust',
      setNumber: 44,
      title: 'Trust',
    });
    expect(FEELING_SET_BY_KEY.trust.sentences).toEqual([
      `Trust can feel like not having to check constantly.`,
      `It may show up when consistency has repeated enough times to reach your body.`,
      `Trust is not always instant. Sometimes it builds through evidence.`,
      `You might feel trust as ease, openness, or less need to prepare for disappointment.`,
      `It can be specific: trust in a person, a process, yourself, timing, or your ability to handle what comes.`,
      `Trust does not mean ignoring risk.`,
      `It means something has become reliable enough to lean on.`,
      `You may notice trust most clearly when your body stops bracing.`,
      `Broken trust often needs repair, not just time.`,
      `Trust may grow when what is said and what is done begin to match.`,
    ]);

    expect(FEELING_SET_BY_KEY.mistrust).toMatchObject({
      key: 'mistrust',
      setNumber: 45,
      title: 'Mistrust',
    });
    expect(FEELING_SET_BY_KEY.mistrust.sentences).toEqual([
      `Mistrust can feel like your system refusing to relax.`,
      `It may show up when words and actions do not match.`,
      `You might feel it as doubt, distance, guardedness, or the need to verify.`,
      `Mistrust does not always mean you are being unfair. Sometimes it means something has not been repaired.`,
      `It can be hard to override mistrust with logic.`,
      `Your body may need evidence before it settles.`,
      `Mistrust can grow when concerns are dismissed instead of addressed.`,
      `It may protect you from being too open too quickly.`,
      `The question may not be “Why can’t I trust?” but “What would trust need?”`,
      `Mistrust may soften when consistency becomes stronger than uncertainty.`,
    ]);

    expect(FEELING_SET_BY_KEY.curiosity).toMatchObject({
      key: 'curiosity',
      setNumber: 46,
      title: 'Curiosity',
    });
    expect(FEELING_SET_BY_KEY.curiosity.sentences).toEqual([
      `Curiosity can feel like interest without immediate pressure.`,
      `It may open a door without forcing you through it.`,
      `Curiosity often brings energy, attention, or a sense of possibility.`,
      `You might feel it when something feels alive, unusual, confusing, or worth exploring.`,
      `It can help you stay with something without needing to judge it right away.`,
      `Curiosity is different from overthinking. It feels more open than urgent.`,
      `It may lead to creativity, learning, connection, or self-understanding.`,
      `You may notice curiosity returning when fear or pressure softens.`,
      `It can be a gentle sign that you are not closed off.`,
      `Curiosity may be your system saying, “There might be more here.”`,
    ]);

    expect(FEELING_SET_BY_KEY.confidence).toMatchObject({
      key: 'confidence',
      setNumber: 47,
      title: 'Confidence',
    });
    expect(FEELING_SET_BY_KEY.confidence.sentences).toEqual([
      `Confidence can feel like being able to move without asking for permission from every doubt.`,
      `It may show up quietly, through steadiness, clarity, or willingness to try.`,
      `Confidence does not mean no fear is present.`,
      `It means fear is not the only voice making the decision.`,
      `You might feel confident when your skills, values, and choices line up.`,
      `It can grow through repeated experiences of showing up and surviving the outcome.`,
      `Confidence may be specific to certain areas, not global.`,
      `You may miss confidence if you expect it to feel bold.`,
      `Sometimes confidence feels like calm follow-through.`,
      `It may be your system remembering, “I can handle this.”`,
    ]);

    expect(FEELING_SET_BY_KEY.inadequacy).toMatchObject({
      key: 'inadequacy',
      setNumber: 48,
      title: 'Inadequacy',
    });
    expect(FEELING_SET_BY_KEY.inadequacy.sentences).toEqual([
      `Inadequacy can make you feel like you are behind, lacking, or not enough.`,
      `It often grows through comparison.`,
      `You might focus on what is missing and overlook what is already real.`,
      `Inadequacy can make progress feel invisible.`,
      `It may show up when expectations are unclear or impossible to meet.`,
      `You might try to fix it by doing more, proving more, or becoming more.`,
      `It does not always tell the truth about your actual capacity.`,
      `Sometimes it reflects the standard you are measuring yourself against.`,
      `Inadequacy may soften when you ask whose scale you are using.`,
      `Feeling not enough is not the same as being not enough.`,
    ]);

    expect(FEELING_SET_BY_KEY.calm).toMatchObject({
      key: 'calm',
      setNumber: 49,
      title: 'Calm',
    });
    expect(FEELING_SET_BY_KEY.calm.sentences).toEqual([
      `Calm can feel like your body is no longer preparing for impact.`,
      `It may be subtle — less urgency, less tension, more room.`,
      `Calm does not always mean happiness. Sometimes it means steadiness.`,
      `You might notice calm after clarity, rest, distance, repair, or a sense of safety.`,
      `It can feel unfamiliar if tension has been the baseline.`,
      `Calm may not arrive all at once.`,
      `Sometimes it comes in brief moments before it becomes easier to trust.`,
      `Calm is worth tracking because it shows what your system responds to.`,
      `You may feel calm when you are not trying to force yourself to be okay.`,
      `Calm may be your body saying, “Nothing has to be handled this second.”`,
    ]);

    expect(FEELING_SET_BY_KEY.worry).toMatchObject({
      key: 'worry',
      setNumber: 50,
      title: 'Worry',
    });
    expect(FEELING_SET_BY_KEY.worry.sentences).toEqual([
      `Worry can feel like your mind trying to protect you by thinking ahead.`,
      `It often focuses on what could happen, not necessarily what is happening.`,
      `You might feel like if you stop worrying, you’ll miss something important.`,
      `Worry can create the illusion of preparation, even when it doesn’t change the outcome.`,
      `It may show up around people, money, health, timing, responsibility, or uncertainty.`,
      `Worry can be exhausting because it asks your body to respond to imagined futures.`,
      `You might try to solve every possibility before it arrives.`,
      `Worry may ease when you separate what is possible from what is likely.`,
      `It can help to ask what is actually within reach right now.`,
      `Worry may be your system asking for reassurance, structure, or one small next step.`,
    ]);

    expect(FEELING_SET_BY_KEY.conflicted).toMatchObject({
      key: 'conflicted',
      setNumber: 51,
      title: 'Conflicted',
    });
    expect(FEELING_SET_BY_KEY.conflicted.sentences).toEqual([
      `Feeling conflicted can mean more than one part of you has a valid point.`,
      `It may show up when your values, needs, fears, or hopes are pulling in different directions.`,
      `You might want clarity before you’re ready to choose.`,
      `Conflict inside you doesn’t always mean you’re confused. Sometimes it means the decision actually matters.`,
      `You may feel one thing emotionally and think something different logically.`,
      `Feeling conflicted can slow you down because no option feels fully clean.`,
      `It may help to ask what each side is trying to protect.`,
      `You don’t have to force one feeling to win immediately.`,
      `Sometimes the conflict softens when each part has been heard.`,
      `Being conflicted may be your system saying, “This needs care before it needs speed.”`,
    ]);

    expect(FEELING_SET_BY_KEY.defensive).toMatchObject({
      key: 'defensive',
      setNumber: 52,
      title: 'Defensive',
    });
    expect(FEELING_SET_BY_KEY.defensive.sentences).toEqual([
      `Defensiveness can show up when something feels like criticism, even if it wasn’t meant that way.`,
      `It may be your system trying to protect you from shame, blame, or being misunderstood.`,
      `You might feel the urge to explain, correct, justify, or push back quickly.`,
      `Defensiveness often moves faster than reflection.`,
      `It can make it hard to hear what is being said because your body is already preparing to protect you.`,
      `Sometimes defensiveness is pointing to a place that feels tender.`,
      `It may help to ask, “What did this make me feel accused of?”`,
      `Defensiveness does not mean you are wrong. It means something felt threatening.`,
      `It can soften when you feel safe enough to separate feedback from identity.`,
      `Defensiveness may be asking for a pause before response.`,
    ]);

    expect(FEELING_SET_BY_KEY.rejected).toMatchObject({
      key: 'rejected',
      setNumber: 53,
      title: 'Rejected',
    });
    expect(FEELING_SET_BY_KEY.rejected.sentences).toEqual([
      `Rejection can feel like being pushed out of a place you wanted to belong.`,
      `It may hurt even when you understand the reason logically.`,
      `Rejection can make you question your worth, not just the other person’s choice.`,
      `You might replay what happened, looking for the moment you became unwanted.`,
      `It can activate old feelings of not being chosen, included, or enough.`,
      `Rejection may make you want to reach harder or disappear completely.`,
      `The pain may be real even if the rejection wasn’t personal.`,
      `You may need time to separate someone’s response from your value.`,
      `Rejection can soften when you remember that not being chosen in one place does not make you unchoosable.`,
      `It may be asking for care around belonging.`,
    ]);

    expect(FEELING_SET_BY_KEY.included).toMatchObject({
      key: 'included',
      setNumber: 54,
      title: 'Included',
    });
    expect(FEELING_SET_BY_KEY.included.sentences).toEqual([
      `Inclusion can feel like your body doesn’t have to work as hard to belong.`,
      `It may show up when you’re invited, considered, remembered, or welcomed without having to ask.`,
      `Feeling included can be deeply regulating if exclusion has been familiar before.`,
      `You might notice inclusion in small details — being checked on, saved a place, or thought of.`,
      `It can feel emotional when belonging arrives without effort.`,
      `Inclusion may make it easier to relax into connection.`,
      `You may not fully trust it right away if you’re used to being left out.`,
      `It matters because it tells your system, “There is room for me here.”`,
      `Inclusion can feel simple from the outside and huge from the inside.`,
      `It may be worth noticing who makes belonging feel easier.`,
    ]);

    expect(FEELING_SET_BY_KEY.unseen).toMatchObject({
      key: 'unseen',
      setNumber: 55,
      title: 'Unseen',
    });
    expect(FEELING_SET_BY_KEY.unseen.sentences).toEqual([
      `Feeling unseen can hurt because it makes your inner world feel like it didn’t reach anyone.`,
      `It may show up when your effort, pain, needs, or truth are missed.`,
      `You might feel unseen even when people are physically present.`,
      `It can make you wonder whether you explained enough, showed enough, or mattered enough.`,
      `Feeling unseen often carries loneliness, frustration, or sadness underneath.`,
      `You may become quieter or louder depending on how much you want someone to notice.`,
      `It can feel especially painful when the missed part was important to you.`,
      `Sometimes the need is not attention — it is accurate recognition.`,
      `Feeling unseen may soften when someone names what was real without you having to prove it.`,
      `It may be pointing toward a place where you need deeper understanding, not just company.`,
    ]);

    expect(FEELING_SET_BY_KEY.seen).toMatchObject({
      key: 'seen',
      setNumber: 56,
      title: 'Seen',
    });
    expect(FEELING_SET_BY_KEY.seen.sentences).toEqual([
      `Feeling seen can land deeply when someone recognizes what is true without you having to overexplain.`,
      `It may feel like relief, warmth, softness, or sudden emotion.`,
      `Being seen is not just being noticed. It is being understood accurately.`,
      `You might feel your body settle when someone gets the part that mattered.`,
      `Feeling seen can make connection feel safer.`,
      `It may also feel vulnerable if you’re not used to being recognized clearly.`,
      `Sometimes being seen brings emotion because it reaches a place that was used to being missed.`,
      `It can remind you that your inner world is not too much to understand.`,
      `Feeling seen may be one of the clearest signs of safe connection.`,
      `It may be worth tracking who helps you feel more like yourself.`,
    ]);

    expect(FEELING_SET_BY_KEY.impatient).toMatchObject({
      key: 'impatient',
      setNumber: 57,
      title: 'Impatient',
    });
    expect(FEELING_SET_BY_KEY.impatient.sentences).toEqual([
      `Impatience can show up when the pace of reality feels slower than the pace inside you.`,
      `It may happen when you already know what you want to change, but the situation hasn’t caught up.`,
      `Impatience can make waiting feel like wasted time.`,
      `You might feel it when progress is unclear, delayed, or dependent on someone else.`,
      `It can create pressure to act before the moment is ready.`,
      `Sometimes impatience points to desire, urgency, or fear of being stuck.`,
      `It may help to ask whether speed would actually help, or just relieve discomfort.`,
      `Impatience does not always mean you should move faster.`,
      `It may be asking for a clearer next step, not immediate resolution.`,
      `Impatience can soften when the waiting has structure.`,
    ]);

    expect(FEELING_SET_BY_KEY.stuck).toMatchObject({
      key: 'stuck',
      setNumber: 58,
      title: 'Stuck',
    });
    expect(FEELING_SET_BY_KEY.stuck.sentences).toEqual([
      `Feeling stuck can make movement feel unavailable, even when options technically exist.`,
      `It may show up when every choice feels costly.`,
      `You might feel trapped between wanting change and fearing what change would require.`,
      `Stuckness can be mental, emotional, relational, or physical.`,
      `It often grows when the next step feels too big.`,
      `You may judge yourself for not moving, even while something in you is trying to protect you.`,
      `Stuck does not always mean unwilling. Sometimes it means overwhelmed by consequences.`,
      `It may help to look for the smallest honest movement instead of the full solution.`,
      `Feeling stuck can soften when the path becomes less all-or-nothing.`,
      `It may be your system asking for a safer way to begin.`,
    ]);

    expect(FEELING_SET_BY_KEY.energized).toMatchObject({
      key: 'energized',
      setNumber: 59,
      title: 'Energized',
    });
    expect(FEELING_SET_BY_KEY.energized.sentences).toEqual([
      `Feeling energized can show you where your interest, clarity, or aliveness is waking up.`,
      `It may come after rest, inspiration, movement, connection, or a sense of possibility.`,
      `Energized does not always mean calm. Sometimes it feels bright, active, or eager.`,
      `You might notice that certain people, places, or ideas bring energy back into you.`,
      `It can be useful to track what gives energy without creating pressure to use it immediately.`,
      `Energy may feel different from urgency. One opens you; the other rushes you.`,
      `Feeling energized can help you notice what matters.`,
      `It may fade if it is turned too quickly into obligation.`,
      `You may want to protect energy before it becomes overextension.`,
      `Energized may be your system saying, “There is life here.”`,
    ]);

    expect(FEELING_SET_BY_KEY.drained).toMatchObject({
      key: 'drained',
      setNumber: 60,
      title: 'Drained',
    });
    expect(FEELING_SET_BY_KEY.drained.sentences).toEqual([
      `Feeling drained can mean something has taken more from you than you had available.`,
      `It may show up after social effort, emotional labor, stress, conflict, or too many small demands.`,
      `Drained can feel different from tired — more empty than sleepy.`,
      `You might still function while feeling internally depleted.`,
      `It can be a sign that output has exceeded replenishment.`,
      `You may notice it after interactions that required more managing than receiving.`,
      `Feeling drained does not always mean something was wrong, but it does mean it cost you.`,
      `It may help to ask what took energy and what, if anything, gave some back.`,
      `Drained usually needs restoration, not self-criticism.`,
      `It may be your system asking you to stop spending energy you don’t have.`,
    ]);

    expect(FEELING_SET_BY_KEY.grounded).toMatchObject({
      key: 'grounded',
      setNumber: 61,
      title: 'Grounded',
    });
    expect(FEELING_SET_BY_KEY.grounded.sentences).toEqual([
      `Grounded can feel like being here, in your body, with enough steadiness to respond.`,
      `It may show up as slower breathing, clearer thinking, less urgency, or feeling more present.`,
      `Grounded does not mean everything is easy. It means you have more access to yourself inside it.`,
      `You might feel grounded after nature, movement, quiet, truth-telling, structure, or safe connection.`,
      `It can make the same situation feel more manageable.`,
      `Grounding is worth tracking because it shows what brings you back to yourself.`,
      `You may notice groundedness more clearly after feeling scattered.`,
      `It can be subtle, but it changes your relationship to the moment.`,
      `Grounded may mean your system has enough safety to stay present.`,
      `It may be your body saying, “I’m here now.”`,
    ]);

    expect(FEELING_SET_BY_KEY.scattered).toMatchObject({
      key: 'scattered',
      setNumber: 62,
      title: 'Scattered',
    });
    expect(FEELING_SET_BY_KEY.scattered.sentences).toEqual([
      `Scattered can feel like your attention is in too many places at once.`,
      `It may show up when there are too many inputs, decisions, emotions, or unfinished tasks.`,
      `You might start several things and struggle to settle into one.`,
      `Scattered often means your system is trying to track more than it can organize.`,
      `It can make simple choices feel harder.`,
      `You may feel scattered when your body needs grounding before your mind can focus.`,
      `It may help to reduce the number of open loops.`,
      `Scattered does not mean incapable. It means your attention is overextended.`,
      `One clear next step can sometimes matter more than a full plan.`,
      `Scattered may be asking for containment.`,
    ]);

    expect(FEELING_SET_BY_KEY.safe).toMatchObject({
      key: 'safe',
      setNumber: 63,
      title: 'Safe',
    });
    expect(FEELING_SET_BY_KEY.safe.sentences).toEqual([
      `Safe can feel like your body no longer has to prepare, explain, defend, or perform.`,
      `It may show up around certain people, places, routines, or moments of clarity.`,
      `Safety is not always dramatic. Sometimes it feels ordinary, quiet, and easy.`,
      `You might notice safety most clearly when you don’t have to monitor as much.`,
      `Feeling safe can make more of you available — your humor, tenderness, honesty, or rest.`,
      `It may take time for safety to reach your body, even when your mind recognizes it.`,
      `Safe does not mean nothing hard exists. It means you are not alone with it in the same way.`,
      `It can be worth noticing what helps your system stop bracing.`,
      `Safety often comes from consistency, not just reassurance.`,
      `Safe may be your body saying, “I can be here without shrinking.”`,
    ]);

    expect(FEELING_SET_BY_KEY.unsafe).toMatchObject({
      key: 'unsafe',
      setNumber: 64,
      title: 'Unsafe',
    });
    expect(FEELING_SET_BY_KEY.unsafe.sentences).toEqual([
      `Unsafe can feel like your body preparing before your mind has a full explanation.`,
      `It may show up as tension, vigilance, shrinking, silence, anger, nausea, or wanting distance.`,
      `Feeling unsafe does not always mean immediate danger, but it does mean your system is responding to something.`,
      `You might feel unsafe when someone is unpredictable, dismissive, invasive, or unclear.`,
      `It can be hard to relax while part of you is still assessing risk.`,
      `Unsafe feelings deserve attention, even if you later decide the situation is manageable.`,
      `Your body may need evidence of safety, not just words.`,
      `It may help to ask what would make the moment feel more clear, respectful, or contained.`,
      `Feeling unsafe is not something to shame yourself out of.`,
      `Unsafe may be your system saying, “I need more protection or distance here.”`,
    ]);

    expect(FEELING_SET_BY_KEY.trapped).toMatchObject({
      key: 'trapped',
      setNumber: 65,
      title: 'Trapped',
    });
    expect(FEELING_SET_BY_KEY.trapped.sentences).toEqual([
      `Trapped can feel like there is no clean way out.`,
      `It may show up when every option seems to have a consequence.`,
      `You might feel trapped by responsibility, money, relationships, expectations, timing, or fear.`,
      `Trapped feelings can make your body want to fight, freeze, shut down, or escape.`,
      `It can make the future feel smaller than it is.`,
      `Sometimes trapped means the next step is too big, not that no step exists.`,
      `You may need to find one place where choice still exists.`,
      `Trapped can soften when the situation becomes more specific and less total.`,
      `It may help to ask, “What part of this is actually fixed, and what part still has room?”`,
      `Trapped may be asking for agency, not pressure.`,
    ]);

    expect(FEELING_SET_BY_KEY.pressured).toMatchObject({
      key: 'pressured',
      setNumber: 66,
      title: 'Pressured',
    });
    expect(FEELING_SET_BY_KEY.pressured.sentences).toEqual([
      `Pressure can feel like there isn’t enough space between what is expected and what you can hold.`,
      `It may come from outside demands or internal standards.`,
      `You might feel like you have to perform, decide, or respond quickly.`,
      `Pressure can make your body tighten before your mind fully processes what’s happening.`,
      `It may push you toward action, even when you need more time.`,
      `You might feel like there’s no room for mistakes.`,
      `Pressure can make small things feel more urgent than they are.`,
      `It may build when expectations are unclear or constantly shifting.`,
      `You may respond by overworking, shutting down, or avoiding.`,
      `Pressure may ease when expectations become more defined or more flexible.`,
    ]);

    expect(FEELING_SET_BY_KEY.uncertain).toMatchObject({
      key: 'uncertain',
      setNumber: 67,
      title: 'Uncertain',
    });
    expect(FEELING_SET_BY_KEY.uncertain.sentences).toEqual([
      `Uncertainty can feel like not having solid ground to stand on.`,
      `You may not know what’s coming, what to expect, or what choice will lead where.`,
      `It can make decision-making feel heavier than usual.`,
      `You might look for clarity before moving forward.`,
      `Uncertainty often creates a pull toward control or avoidance.`,
      `It can feel uncomfortable because it removes predictability.`,
      `You may try to resolve it quickly, even when more time would help.`,
      `Not knowing does not always mean something is wrong.`,
      `You can move forward while still feeling uncertain.`,
      `Uncertainty may soften when you focus on what is known right now.`,
    ]);

    expect(FEELING_SET_BY_KEY.anticipation).toMatchObject({
      key: 'anticipation',
      setNumber: 68,
      title: 'Anticipation',
    });
    expect(FEELING_SET_BY_KEY.anticipation.sentences).toEqual([
      `Anticipation can feel like leaning forward into something that hasn’t happened yet.`,
      `It may carry excitement, nervousness, or both.`,
      `Your mind might start imagining possible outcomes.`,
      `Anticipation can make time feel slower.`,
      `You may feel more alert or energized while waiting.`,
      `It can build when something matters or feels meaningful.`,
      `Anticipation may make small details feel more important.`,
      `It doesn’t always reflect what will actually happen.`,
      `You might prepare emotionally before the moment arrives.`,
      `Anticipation may settle once the moment becomes real.`,
    ]);

    expect(FEELING_SET_BY_KEY.awkward).toMatchObject({
      key: 'awkward',
      setNumber: 69,
      title: 'Awkward',
    });
    expect(FEELING_SET_BY_KEY.awkward.sentences).toEqual([
      `Awkwardness can feel like not knowing where you fit in a moment.`,
      `It may show up when social expectations feel unclear.`,
      `You might become more aware of yourself than usual.`,
      `Awkwardness can make small interactions feel bigger.`,
      `It often passes quickly, even if it lingers in your mind.`,
      `You may replay the moment more than others do.`,
      `Awkwardness doesn’t mean something went wrong.`,
      `It can be part of learning, adjusting, or trying something new.`,
      `Most people experience it more often than they admit.`,
      `Awkwardness may soften when you allow imperfection.`,
    ]);

    expect(FEELING_SET_BY_KEY.disconnected).toMatchObject({
      key: 'disconnected',
      setNumber: 70,
      title: 'Disconnected',
    });
    expect(FEELING_SET_BY_KEY.disconnected.sentences).toEqual([
      `Disconnection can feel like distance from yourself, others, or the moment.`,
      `You may be present physically but not fully engaged.`,
      `It can show up as numbness, distraction, or lack of interest.`,
      `Disconnection may happen when something feels overwhelming or underwhelming.`,
      `You might struggle to access what you feel or need.`,
      `It can make connection feel harder even when it’s available.`,
      `Disconnection is often a response, not a failure.`,
      `You may need grounding or reconnection rather than pressure.`,
      `Small moments of presence can begin to shift it.`,
      `Disconnection may ease when something feels safe enough to re-enter.`,
    ]);

    expect(FEELING_SET_BY_KEY.inspired).toMatchObject({
      key: 'inspired',
      setNumber: 71,
      title: 'Inspired',
    });
    expect(FEELING_SET_BY_KEY.inspired.sentences).toEqual([
      `Inspiration can feel like a sudden sense of possibility or movement.`,
      `It may come from ideas, people, beauty, or insight.`,
      `You might feel more open, creative, or motivated.`,
      `Inspiration doesn’t always last, but it can leave a trace.`,
      `It may point toward something meaningful to you.`,
      `You might feel pulled to act, create, or explore.`,
      `Inspiration can feel energizing without pressure.`,
      `It may come when you are not forcing it.`,
      `Not every inspired moment needs to become something.`,
      `Inspiration may be your system recognizing what feels alive.`,
    ]);

    expect(FEELING_SET_BY_KEY.indifferent).toMatchObject({
      key: 'indifferent',
      setNumber: 72,
      title: 'Indifferent',
    });
    expect(FEELING_SET_BY_KEY.indifferent.sentences).toEqual([
      `Indifference can feel like something no longer holds emotional weight.`,
      `It may show up after distance, repetition, or resolution.`,
      `You might feel neutral where you once felt strong emotion.`,
      `Indifference can be peaceful or concerning, depending on the context.`,
      `It may signal that something no longer matters in the same way.`,
      `You might question whether you “should” feel more.`,
      `Indifference can be a form of protection or completion.`,
      `It may follow burnout, clarity, or letting go.`,
      `Not everything needs emotional intensity.`,
      `Indifference may reflect a shift, not a loss.`,
    ]);

    expect(FEELING_SET_BY_KEY.suspicious).toMatchObject({
      key: 'suspicious',
      setNumber: 73,
      title: 'Suspicious',
    });
    expect(FEELING_SET_BY_KEY.suspicious.sentences).toEqual([
      `Suspicion can feel like something isn’t fully adding up.`,
      `You might notice small inconsistencies or gaps.`,
      `It can create distance before trust is established.`,
      `Suspicion often shows up when clarity is missing.`,
      `You may look for confirmation before relaxing.`,
      `It can be protective, even if it feels uncomfortable.`,
      `Suspicion doesn’t always mean something is wrong.`,
      `It may reflect past experiences shaping current perception.`,
      `You might need more information before settling.`,
      `Suspicion may ease with consistency and transparency.`,
    ]);

    expect(FEELING_SET_BY_KEY.appreciated).toMatchObject({
      key: 'appreciated',
      setNumber: 74,
      title: 'Appreciated',
    });
    expect(FEELING_SET_BY_KEY.appreciated.sentences).toEqual([
      `Feeling appreciated can feel like your effort or presence was noticed.`,
      `It may land as warmth, relief, or quiet satisfaction.`,
      `You might feel more connected when appreciation is clear.`,
      `It can make effort feel more meaningful.`,
      `Appreciation doesn’t have to be big to matter.`,
      `You may not always take it in fully.`,
      `Feeling appreciated can reinforce your sense of belonging.`,
      `It may feel unfamiliar if it hasn’t been consistent.`,
      `You might value specific, genuine acknowledgment most.`,
      `Appreciation may help your system feel seen and valued.`,
    ]);

    expect(FEELING_SET_BY_KEY.unsupported).toMatchObject({
      key: 'unsupported',
      setNumber: 75,
      title: 'Unsupported',
    });
    expect(FEELING_SET_BY_KEY.unsupported.sentences).toEqual([
      `Feeling unsupported can feel like you are carrying something alone.`,
      `It may show up even when people are physically present.`,
      `You might feel like your needs are not being met or noticed.`,
      `It can bring frustration, sadness, or withdrawal.`,
      `You may hesitate to ask for help, even when you need it.`,
      `Feeling unsupported can make things feel heavier than they are.`,
      `It may reflect a mismatch between what you need and what is available.`,
      `You might question whether support is possible.`,
      `It can soften when needs are clearly expressed and received.`,
      `Feeling unsupported may be asking for connection, clarity, or care.`,
    ]);
  });

  it('lets expanded emotional signals select their feeling-set copy', () => {
    const selected = selectPrimaryFeeling([
      {
        key: 'resource_anxiety_only_with_reason',
        source: 'journal',
        date: '2026-04-24',
        strength: 0.8,
        sentiment: 'negative',
      },
      {
        key: 'support_abundance_shift',
        source: 'glimmerLog',
        date: '2026-04-24',
        strength: 0.7,
        sentiment: 'positive',
      },
    ]);

    expect(selected?.key).toBe('anxiety');
    expect(selected?.selectedSentence).toBe(FEELING_SET_BY_KEY.anxiety.sentences[0]);
  });

  it('keeps every feeling set reachable through a direct SignalKey or explicit alias', () => {
    const signalKeys = signalKeysFromTypes();
    const aliasedFeelingKeys = new Set(Object.values(SIGNAL_TO_FEELING_SET_KEY));

    const unreachable = FEELING_SETS
      .map(set => set.key)
      .filter(key => !signalKeys.has(key) && !aliasedFeelingKeys.has(key));

    expect(unreachable).toEqual([]);
  });

  it('lets obvious aliases win primaryFeeling when they are the strongest signal', () => {
    const cases: Array<[SignalKey, FeelingSetKey]> = [
      ['future_preoccupation', 'anxiety'],
      ['creative_block', 'frustration'],
      ['compliment_lands', 'appreciated'],
      ['permission_shift', 'acceptance'],
      ['open_receiving', 'awkward'],
      ['success_not_constant_output', 'pride'],
      ['protective_care', 'compassion'],
      ['conversation_replay', 'embarrassment'],
      ['repair_need', 'bitterness'],
      ['consistency_need', 'rejected'],
      ['connection_glimmer', 'seen'],
      ['preparedness', 'anticipation'],
      ['relationship_safety_testing', 'suspicious'],
    ];

    for (const [signalKey, feelingKey] of cases) {
      const selected = selectPrimaryFeeling([
        signalFor('mental_load', 0.99),
        signalFor(signalKey, 1),
      ]);

      expect(selected?.key).toBe(feelingKey);
      expect(selected?.selectedSentence).toBe(FEELING_SET_BY_KEY[feelingKey].sentences[0]);
    }
  });

  it('does not select primaryFeeling from unrelated signals', () => {
    const selected = selectPrimaryFeeling([
      signalFor('mental_load', 1),
      signalFor('invisible_labor', 0.95),
    ]);

    expect(selected).toBeNull();
  });

  it('returns primaryFeeling from buildTodayInsights when matching normalized signals exist', async () => {
    const result = await buildTodayInsights({
      date: '2026-04-24T12:00:00Z',
      rawInputs: {
        journals: [{
          date: '2026-04-24',
          text: 'I hit a creative block and felt stuck creatively with a blank page.',
        }],
      },
      history: [],
    });

    expect(result.primaryFeeling?.key).toBe('frustration');
    expect(result.primaryFeeling?.signalKey).toBe('creative_block');
  });
});
