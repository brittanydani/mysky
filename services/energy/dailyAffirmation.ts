// ─────────────────────────────────────────────────────────────
// MySky — Daily Affirmation Engine
// One affirmation per day, drawn from 200+ options.
// Selection is personal: natal chart × transiting Moon × moon phase.
// ─────────────────────────────────────────────────────────────

import { NatalChart } from '../astrology/types';
import { getTransitingLongitudes } from '../astrology/transits';
import { getMoonPhaseTag as getPreciseMoonPhaseTag, getMoonPhaseName as getPreciseMoonPhaseName } from '../../utils/moonPhase';
import {
  extractSignName as signName,
  signNameFromLongitude as signFromLongitude,
  SIGN_TO_ELEMENT as SIGN_ELEMENTS,
  SIGN_TO_MODALITY as SIGN_MODALITIES,
  ZODIAC_SIGN_NAMES as ZODIAC_SIGNS,
} from '../astrology/sharedHelpers';
import { dayOfYear } from '../../utils/dateUtils';

// ── Types ────────────────────────────────────────────────────

export type AffirmationTag =
  | 'sun-fire' | 'sun-earth' | 'sun-air' | 'sun-water'
  | 'moon-fire' | 'moon-earth' | 'moon-air' | 'moon-water'
  | 'rising-fire' | 'rising-earth' | 'rising-air' | 'rising-water'
  | 'transit-aries' | 'transit-taurus' | 'transit-gemini' | 'transit-cancer'
  | 'transit-leo' | 'transit-virgo' | 'transit-libra' | 'transit-scorpio'
  | 'transit-sagittarius' | 'transit-capricorn' | 'transit-aquarius' | 'transit-pisces'
  | 'phase-new' | 'phase-waxing-crescent' | 'phase-first-quarter' | 'phase-waxing-gibbous'
  | 'phase-full' | 'phase-waning-gibbous' | 'phase-last-quarter' | 'phase-waning-crescent'
  | 'modality-cardinal' | 'modality-fixed' | 'modality-mutable'
  | 'retrograde-personal'
  | 'universal';

export interface DailyAffirmation {
  text: string;
  source: string;  // what drove this selection (e.g. "Sun in Fire × Waxing Gibbous Moon")
}

// ── Helpers ──────────────────────────────────────────────────

// signName, signFromLongitude, SIGN_ELEMENTS, SIGN_MODALITIES,
// ZODIAC_SIGNS, dayOfYear → imported from sharedHelpers and dateUtils

function getMoonPhaseTag(date: Date): AffirmationTag {
  return getPreciseMoonPhaseTag(date) as AffirmationTag;
}

function getMoonPhaseName(tag: AffirmationTag): string {
  // When called with a date-derived tag, we can map back; but since callers
  // mostly just need the name, delegate to the precise util when possible.
  const map: Record<string, string> = {
    'phase-new': 'New Moon',
    'phase-waxing-crescent': 'Waxing Crescent',
    'phase-first-quarter': 'First Quarter',
    'phase-waxing-gibbous': 'Waxing Gibbous',
    'phase-full': 'Full Moon',
    'phase-waning-gibbous': 'Waning Gibbous',
    'phase-last-quarter': 'Last Quarter',
    'phase-waning-crescent': 'Waning Crescent',
  };
  return map[tag] ?? '';
}

// ── Affirmation Pool (200+) ──────────────────────────────────
// Each affirmation has tags indicating when it's most relevant.
// Selection picks from the best-matching subset for a given day.

interface TaggedAffirmation {
  text: string;
  tags: AffirmationTag[];
}

const AFFIRMATION_POOL: TaggedAffirmation[] = [
  // ═══════════════════════════════════════════════════════════
  // SUN ELEMENT — Identity & Core Self (20)
  // ═══════════════════════════════════════════════════════════
  { text: 'My fire does not need permission to burn.', tags: ['sun-fire'] },
  { text: 'I trust the urgency inside me — it knows where to go.', tags: ['sun-fire'] },
  { text: 'I am allowed to take up space with my full intensity.', tags: ['sun-fire'] },
  { text: 'My passion is not too much — it is exactly right.', tags: ['sun-fire'] },
  { text: 'I lead by showing up as myself, unedited.', tags: ['sun-fire'] },

  { text: 'I build things that last because I am willing to move slowly.', tags: ['sun-earth'] },
  { text: 'My steadiness is a form of power most people underestimate.', tags: ['sun-earth'] },
  { text: 'I do not need to rush to prove I am growing.', tags: ['sun-earth'] },
  { text: 'The ground beneath me holds. I hold too.', tags: ['sun-earth'] },
  { text: 'My patience is not passivity — it is precision.', tags: ['sun-earth'] },

  { text: 'My mind moves quickly because it is looking for truth.', tags: ['sun-air'] },
  { text: 'I do not need to choose between thinking and feeling — both are mine.', tags: ['sun-air'] },
  { text: 'Connection is my language. Today I let it speak.', tags: ['sun-air'] },
  { text: 'My curiosity is a compass. I follow it without apology.', tags: ['sun-air'] },
  { text: 'I trust the ideas that arrive without effort.', tags: ['sun-air'] },

  { text: 'My depth is not a burden — it is a gift few people have.', tags: ['sun-water'] },
  { text: 'I feel everything and I am still here. That is strength.', tags: ['sun-water'] },
  { text: 'My sensitivity is the source of my insight, not the obstacle to it.', tags: ['sun-water'] },
  { text: 'I am allowed to protect my inner world without explanation.', tags: ['sun-water'] },
  { text: 'What I absorb, I can also release. I choose what stays.', tags: ['sun-water'] },

  // ═══════════════════════════════════════════════════════════
  // MOON ELEMENT — Emotional Needs & Inner Life (20)
  // ═══════════════════════════════════════════════════════════
  { text: 'My emotional fire is honesty in motion.', tags: ['moon-fire'] },
  { text: 'I do not need to calm down to be taken seriously.', tags: ['moon-fire'] },
  { text: 'My anger has information. I listen before I act.', tags: ['moon-fire'] },
  { text: 'I feel fast — and that is not a flaw.', tags: ['moon-fire'] },
  { text: 'My instincts have earned my trust. I follow them today.', tags: ['moon-fire'] },

  { text: 'I deserve the comfort I give to everyone else.', tags: ['moon-earth'] },
  { text: 'My need for stability is not rigidity — it is self-knowledge.', tags: ['moon-earth'] },
  { text: 'I process slowly because I process thoroughly. That is enough.', tags: ['moon-earth'] },
  { text: 'My body tells me what I need before my mind catches up. I listen.', tags: ['moon-earth'] },
  { text: 'I am allowed to need the simple things.', tags: ['moon-earth'] },

  { text: 'Naming my feelings is how I set them free.', tags: ['moon-air'] },
  { text: 'I can observe my emotions without drowning in them.', tags: ['moon-air'] },
  { text: 'My emotional intelligence includes knowing when to think instead of feel.', tags: ['moon-air'] },
  { text: 'I process through conversation — that is valid and real.', tags: ['moon-air'] },
  { text: 'Distance from a feeling is sometimes the kindest thing I can offer myself.', tags: ['moon-air'] },

  { text: 'I do not have to understand a feeling to honor it.', tags: ['moon-water'] },
  { text: 'My tears are not weakness — they are my body telling the truth.', tags: ['moon-water'] },
  { text: 'I can hold space for my own pain the way I hold it for others.', tags: ['moon-water'] },
  { text: 'Not everything I feel belongs to me. I return what is not mine.', tags: ['moon-water'] },
  { text: 'My emotional depth is the same place my creativity lives. I honor both.', tags: ['moon-water'] },

  // ═══════════════════════════════════════════════════════════
  // RISING ELEMENT — How I Move Through the World (12)
  // ═══════════════════════════════════════════════════════════
  { text: 'I enter rooms with energy, and that is a gift I give.', tags: ['rising-fire'] },
  { text: 'People respond to my spark. I do not need to dim it.', tags: ['rising-fire'] },
  { text: 'My first impression is honest. I trust how I show up.', tags: ['rising-fire'] },

  { text: 'My calm exterior is not disconnection — it is composure.', tags: ['rising-earth'] },
  { text: 'I am more than what people first see. And what they first see is also real.', tags: ['rising-earth'] },
  { text: 'I move through the world with gravity. People feel it.', tags: ['rising-earth'] },

  { text: 'I adapt to every room I enter — and I still know who I am.', tags: ['rising-air'] },
  { text: 'My lightness is not superficiality. It is social intelligence.', tags: ['rising-air'] },
  { text: 'I connect easily because I am genuinely curious about people.', tags: ['rising-air'] },

  { text: 'People sense my depth before I speak. I let them.', tags: ['rising-water'] },
  { text: 'My softness is the first thing people feel. It is also the strongest.', tags: ['rising-water'] },
  { text: 'I do not owe anyone access to my inner world just because they can sense it.', tags: ['rising-water'] },

  // ═══════════════════════════════════════════════════════════
  // TRANSITING MOON SIGN — What Today Activates (48)
  // ═══════════════════════════════════════════════════════════
  { text: 'Today favors action over analysis. I trust my first move.', tags: ['transit-aries'] },
  { text: 'Courage is not the absence of fear — it is moving before I am ready.', tags: ['transit-aries'] },
  { text: 'I do not need a plan. I need momentum.', tags: ['transit-aries'] },
  { text: 'The impulse to begin is the message. I follow it.', tags: ['transit-aries'] },

  { text: 'Slow is not stuck. Today, patience is the practice.', tags: ['transit-taurus'] },
  { text: 'My body knows what my mind is still debating. I listen to the body.', tags: ['transit-taurus'] },
  { text: 'Pleasure is not indulgence — it is fuel.', tags: ['transit-taurus'] },
  { text: 'I deserve the comfort I keep postponing.', tags: ['transit-taurus'] },

  { text: 'My mind is alive with possibility. I pick one thread and follow it.', tags: ['transit-gemini'] },
  { text: 'I can hold two truths at once without choosing between them.', tags: ['transit-gemini'] },
  { text: 'Curiosity is my superpower today. I let it lead.', tags: ['transit-gemini'] },
  { text: 'The right words will come. I let them arrive instead of forcing them.', tags: ['transit-gemini'] },

  { text: 'What I feel today is real, even if it passes by tomorrow.', tags: ['transit-cancer'] },
  { text: 'I am allowed to need softness in a world that rewards hardness.', tags: ['transit-cancer'] },
  { text: 'Home is wherever I feel safe enough to be honest.', tags: ['transit-cancer'] },
  { text: 'I nurture myself first today — not out of selfishness, but necessity.', tags: ['transit-cancer'] },

  { text: 'I was not made to blend in. Today I let myself be visible.', tags: ['transit-leo'] },
  { text: 'My joy is not performative. It is permission.', tags: ['transit-leo'] },
  { text: 'Wanting to be seen is not vanity — it is a human need I honor.', tags: ['transit-leo'] },
  { text: 'I create because something in me needs to come out, not because it needs to be perfect.', tags: ['transit-leo'] },

  { text: 'I refine because I care, not because I am not enough.', tags: ['transit-virgo'] },
  { text: 'The small things matter today. I attend to one with full presence.', tags: ['transit-virgo'] },
  { text: 'My standards serve me only when I apply them with compassion.', tags: ['transit-virgo'] },
  { text: 'Done is better than perfect. Today, I finish something.', tags: ['transit-virgo'] },

  { text: 'Harmony is not the absence of conflict — it is the willingness to repair.', tags: ['transit-libra'] },
  { text: 'I can be fair to others without being unfair to myself.', tags: ['transit-libra'] },
  { text: 'Beauty is not frivolous. Today it is medicine.', tags: ['transit-libra'] },
  { text: 'I say the kind and true thing — not just the comfortable one.', tags: ['transit-libra'] },

  { text: 'I am not afraid of my own depth. I have been here before.', tags: ['transit-scorpio'] },
  { text: 'The truth I am avoiding is the one that will free me.', tags: ['transit-scorpio'] },
  { text: 'I transform by naming what I have been carrying silently.', tags: ['transit-scorpio'] },
  { text: 'Letting go is not losing — it is making space for what is real.', tags: ['transit-scorpio'] },

  { text: 'I expand by loosening my grip on how things should look.', tags: ['transit-sagittarius'] },
  { text: 'My need for freedom is not avoidance — it is oxygen.', tags: ['transit-sagittarius'] },
  { text: 'There is a version of this situation I have not considered yet. I stay open.', tags: ['transit-sagittarius'] },
  { text: 'Meaning is not found. It is made — and I am making it.', tags: ['transit-sagittarius'] },

  { text: 'I am not my productivity. But what I build today matters.', tags: ['transit-capricorn'] },
  { text: 'One disciplined step today is worth more than ten scattered ones.', tags: ['transit-capricorn'] },
  { text: 'Structure is freedom when I choose it for myself.', tags: ['transit-capricorn'] },
  { text: 'I can be responsible without being rigid. I can be strong without being closed.', tags: ['transit-capricorn'] },

  { text: 'The weird idea is the right idea today. I follow it.', tags: ['transit-aquarius'] },
  { text: 'I do not need to belong to a system that does not see me.', tags: ['transit-aquarius'] },
  { text: 'My detachment is not coldness — it is clarity.', tags: ['transit-aquarius'] },
  { text: 'I think differently because I am meant to. That is the point.', tags: ['transit-aquarius'] },

  { text: 'I surrender the need to know and let intuition speak.', tags: ['transit-pisces'] },
  { text: 'Rest is not laziness. Today, rest is the most productive thing I can do.', tags: ['transit-pisces'] },
  { text: 'I do not have to understand my feelings to trust them.', tags: ['transit-pisces'] },
  { text: 'My boundaries protect my gift. I draw them with love, not guilt.', tags: ['transit-pisces'] },

  // ═══════════════════════════════════════════════════════════
  // MOON PHASE — Cycle Rhythm (24)
  // ═══════════════════════════════════════════════════════════
  { text: 'I plant seeds in the dark and trust they will grow.', tags: ['phase-new'] },
  { text: 'This is a beginning — not a blank page, but a quiet breath before the first word.', tags: ['phase-new'] },
  { text: 'I set one intention today and hold it gently.', tags: ['phase-new'] },

  { text: 'What I started is already in motion. I keep tending it.', tags: ['phase-waxing-crescent'] },
  { text: 'Doubt is normal at the beginning. I keep going anyway.', tags: ['phase-waxing-crescent'] },
  { text: 'The seed does not question whether it will bloom. Neither will I.', tags: ['phase-waxing-crescent'] },

  { text: 'I choose commitment over comfort today.', tags: ['phase-first-quarter'] },
  { text: 'Friction is not failure. It is the feeling of something becoming real.', tags: ['phase-first-quarter'] },
  { text: 'I push through the resistance because what I am building matters.', tags: ['phase-first-quarter'] },

  { text: 'I refine instead of restarting. I am closer than I think.', tags: ['phase-waxing-gibbous'] },
  { text: 'Almost there is not failure. It is the final stretch before arrival.', tags: ['phase-waxing-gibbous'] },
  { text: 'I trust my process even when it is slower than I want.', tags: ['phase-waxing-gibbous'] },

  { text: 'What has been building is now visible. I let it be seen.', tags: ['phase-full'] },
  { text: 'I release the need to control how things are received.', tags: ['phase-full'] },
  { text: 'The full light reveals everything. I welcome what I see.', tags: ['phase-full'] },

  { text: 'I share what I have learned, even if it is incomplete.', tags: ['phase-waning-gibbous'] },
  { text: 'Gratitude is not passive. Today it is a decision.', tags: ['phase-waning-gibbous'] },
  { text: 'I keep what served me and gently set down what did not.', tags: ['phase-waning-gibbous'] },

  { text: 'Letting go is not giving up. It is making room.', tags: ['phase-last-quarter'] },
  { text: 'I release one thing today that I have been holding past its season.', tags: ['phase-last-quarter'] },
  { text: 'Some chapters end quietly. I let this one.', tags: ['phase-last-quarter'] },

  { text: 'Rest is its own kind of labor. I honor it today.', tags: ['phase-waning-crescent'] },
  { text: 'I trust the pause between endings and beginnings.', tags: ['phase-waning-crescent'] },
  { text: 'I do not need to know what comes next. I only need to be here now.', tags: ['phase-waning-crescent'] },

  // ═══════════════════════════════════════════════════════════
  // MODALITY — How I Engage With Change (12)
  // ═══════════════════════════════════════════════════════════
  { text: 'I initiate because waiting for permission is not in my design.', tags: ['modality-cardinal'] },
  { text: 'I was built to start things. Today I start one thing with intention.', tags: ['modality-cardinal'] },
  { text: 'My restlessness is vision without a landing strip. I build the strip today.', tags: ['modality-cardinal'] },
  { text: 'I move first and adjust in motion. That is how I was made.', tags: ['modality-cardinal'] },

  { text: 'My loyalty is not stubbornness — it is devotion that has been tested.', tags: ['modality-fixed'] },
  { text: 'I hold steady not because I cannot change, but because I choose what deserves my endurance.', tags: ['modality-fixed'] },
  { text: 'What I commit to, I become. I choose carefully.', tags: ['modality-fixed'] },
  { text: 'Consistency is my quiet superpower. I show up again today.', tags: ['modality-fixed'] },

  { text: 'I adapt because I understand that rigidity breaks what flexibility survives.', tags: ['modality-mutable'] },
  { text: 'My ability to shift is intelligence, not instability.', tags: ['modality-mutable'] },
  { text: 'I do not need certainty to move forward. I need willingness.', tags: ['modality-mutable'] },
  { text: 'Change does not threaten me. It is my native environment.', tags: ['modality-mutable'] },

  // ═══════════════════════════════════════════════════════════
  // RETROGRADE EMPHASIS — Inner Processing (8)
  // ═══════════════════════════════════════════════════════════
  { text: 'What turned inward in me is not broken. It is developing in private.', tags: ['retrograde-personal'] },
  { text: 'I process differently from most people. That is not a delay — it is depth.', tags: ['retrograde-personal'] },
  { text: 'My inner world is richer than what I show. I do not owe anyone a tour.', tags: ['retrograde-personal'] },
  { text: 'The answers I seek are inside, not outside. I stop looking outward today.', tags: ['retrograde-personal'] },
  { text: 'Revision is not regression. I am refining, not retreating.', tags: ['retrograde-personal'] },
  { text: 'I give myself permission to take longer. Depth cannot be rushed.', tags: ['retrograde-personal'] },
  { text: 'My internal timeline is valid even when the world runs on a different one.', tags: ['retrograde-personal'] },
  { text: 'I am not behind. I am building something that requires foundation work.', tags: ['retrograde-personal'] },

  // ═══════════════════════════════════════════════════════════
  // UNIVERSAL — Chart-Wide Truths (60)
  // ═══════════════════════════════════════════════════════════
  { text: 'I was born with a specific design. Today I trust it.', tags: ['universal'] },
  { text: 'The tension in my chart is where my growth lives. I stop avoiding it.', tags: ['universal'] },
  { text: 'I am not one thing. I am all of my placements working together.', tags: ['universal'] },
  { text: 'No part of my chart is a mistake. Every placement has purpose.', tags: ['universal'] },
  { text: 'I was not born to be simple. Complexity is my nature.', tags: ['universal'] },
  { text: 'I honor the contradiction between what I want and what I need. Both are true.', tags: ['universal'] },
  { text: 'The part of me I judge the most is the part that needs my attention today.', tags: ['universal'] },
  { text: 'I do not need to fix every imbalance. Some are by design.', tags: ['universal'] },
  { text: 'My chart is not my destiny. It is my toolkit.', tags: ['universal'] },
  { text: 'I am the only person alive with this exact cosmic blueprint. I honor it.', tags: ['universal'] },
  { text: 'What feels like conflict inside me is actually range.', tags: ['universal'] },
  { text: 'I stop comparing my path to anyone else\u2019s. Mine was never meant to look like theirs.', tags: ['universal'] },
  { text: 'I am already becoming who I was designed to be. I do not need to force it.', tags: ['universal'] },
  { text: 'Today I work with my energy, not against it.', tags: ['universal'] },
  { text: 'I trust my own timing, even when it makes no sense to others.', tags: ['universal'] },
  { text: 'The things that come easily to me are not lesser. They are my gifts.', tags: ['universal'] },
  { text: 'My shadows are not flaws. They are invitations to look deeper.', tags: ['universal'] },
  { text: 'I am allowed to change my mind without changing my worth.', tags: ['universal'] },
  { text: 'Every hard transit ends. I survive this one too.', tags: ['universal'] },
  { text: 'I am not behind. My chart has its own seasons.', tags: ['universal'] },
  { text: 'My sensitivity and my strength come from the same place.', tags: ['universal'] },
  { text: 'I do not owe anyone consistency when I am actively growing.', tags: ['universal'] },
  { text: 'The universe did not make me this way by accident.', tags: ['universal'] },
  { text: 'I choose presence over perfection today.', tags: ['universal'] },
  { text: 'My energy is finite and sacred. I choose where to spend it.', tags: ['universal'] },
  { text: 'I am allowed to outgrow versions of myself that no longer fit.', tags: ['universal'] },
  { text: 'Not every day needs to be a breakthrough. Some days I just hold steady.', tags: ['universal'] },
  { text: 'I release the pressure to be productive and let myself just exist.', tags: ['universal'] },
  { text: 'My worth is not determined by what I accomplish today.', tags: ['universal'] },
  { text: 'I am the sky, not the weather. The storm will pass.', tags: ['universal'] },
  { text: 'What is for me will not pass me by. I relax into that truth.', tags: ['universal'] },
  { text: 'I am not meant to be understood by everyone. Just by the right ones.', tags: ['universal'] },
  { text: 'I replace self-criticism with self-observation today.', tags: ['universal'] },
  { text: 'I have survived every difficult day so far. Today is no different.', tags: ['universal'] },
  { text: 'My nervous system deserves the same care I give my mind.', tags: ['universal'] },
  { text: 'I can hold space for grief and gratitude at the same time.', tags: ['universal'] },
  { text: 'I do not need to earn rest. I need rest in order to earn.', tags: ['universal'] },
  { text: 'I treat my energy like a resource, not an obligation.', tags: ['universal'] },
  { text: 'I notice what drains me today and give myself permission to step away.', tags: ['universal'] },
  { text: 'I choose alignment over achievement.', tags: ['universal'] },
  { text: 'I am not too much. I am the right amount for the right people.', tags: ['universal'] },
  { text: 'I let go of the version of today I planned and accept the one that arrived.', tags: ['universal'] },
  { text: 'My boundaries are not walls. They are instructions for how to love me.', tags: ['universal'] },
  { text: 'I do not have to understand the whole picture to take the next step.', tags: ['universal'] },
  { text: 'What I need is not a luxury. It is the foundation of everything I give.', tags: ['universal'] },
  { text: 'I breathe through what I cannot control and focus on what I can.', tags: ['universal'] },
  { text: 'I forgive the version of me that did not know better yet.', tags: ['universal'] },
  { text: 'I am where I am supposed to be, even if I cannot see why yet.', tags: ['universal'] },
  { text: 'I make room for joy today — not as a reward, but as a practice.', tags: ['universal'] },
  { text: 'My presence is enough. I do not need to perform.', tags: ['universal'] },
  { text: 'I am learning to need less approval and more alignment.', tags: ['universal'] },
  { text: 'Today I focus on progress, not perfection.', tags: ['universal'] },
  { text: 'I trust that what I am building in silence will speak loudly when it is ready.', tags: ['universal'] },
  { text: 'My capacity for feeling deeply is the same capacity that lets me love deeply.', tags: ['universal'] },
  { text: 'I do not diminish myself to make others comfortable.', tags: ['universal'] },
  { text: 'I am the author of my story, not a character in someone else\u2019s.', tags: ['universal'] },
  { text: 'What is unresolved in me is not urgent. It is unfolding.', tags: ['universal'] },
  { text: 'I carry my ancestors\u2019 strength and my own becoming. Both are real.', tags: ['universal'] },
  { text: 'The right path does not always feel certain. But it feels like mine.', tags: ['universal'] },
  { text: 'I am neither too late nor too early. I am arriving exactly on time.', tags: ['universal'] },
];

// ── Selection Engine ─────────────────────────────────────────

export class DailyAffirmationEngine {
  /**
   * Get today's single affirmation for a chart.
   * Deterministic: same chart + same date = same affirmation.
   */
  static getAffirmation(chart: NatalChart, date: Date = new Date()): DailyAffirmation {
    // 1. Build the user's tag profile from their chart
    const profileTags = this.buildProfileTags(chart, date);

    // 2. Score each affirmation by how many tags match
    const scored = AFFIRMATION_POOL.map((a, idx) => {
      let score = 0;
      let bestMatchTag = '';
      for (const tag of a.tags) {
        if (profileTags.has(tag)) {
          score += this.tagWeight(tag);
          if (!bestMatchTag || this.tagWeight(tag) > this.tagWeight(bestMatchTag as AffirmationTag)) {
            bestMatchTag = tag;
          }
        }
      }
      // Universal always gets a baseline so they can fill gaps
      if (a.tags.includes('universal')) {
        score = Math.max(score, 1);
        if (!bestMatchTag) bestMatchTag = 'universal';
      }
      return { affirmation: a, score, bestMatchTag, idx };
    });

    // 3. Get top-tier matches (score >= best * 0.6)
    const maxScore = Math.max(...scored.map(s => s.score));
    const threshold = maxScore * 0.6;
    const candidates = scored.filter(s => s.score >= threshold);

    // 4. Deterministic daily selection using day + year as seed
    const doy = dayOfYear(date);
    const yearSeed = date.getFullYear();
    const seed = (doy * 31 + yearSeed * 7) % candidates.length;
    const selected = candidates[seed];

    // 5. Generate readable source description
    const source = this.describeSource(selected.bestMatchTag, chart, date);

    return {
      text: selected.affirmation.text,
      source,
    };
  }

  // ── Internals ────────────────────────────────────────────

  private static buildProfileTags(chart: NatalChart, date: Date): Set<AffirmationTag> {
    const tags = new Set<AffirmationTag>();

    // Sun element
    const sunSign = signName(chart.sunSign) || signName(chart.sun?.sign) || '';
    const sunElement = chart.sun?.sign?.element || SIGN_ELEMENTS[sunSign] || '';
    if (sunElement) tags.add(`sun-${sunElement.toLowerCase()}` as AffirmationTag);

    // Moon element
    const moonSign = signName(chart.moonSign) || signName(chart.moon?.sign) || '';
    const moonElement = chart.moon?.sign?.element || SIGN_ELEMENTS[moonSign] || '';
    if (moonElement) tags.add(`moon-${moonElement.toLowerCase()}` as AffirmationTag);

    // Rising element
    const risingSign = signName(chart.risingSign) || signName(chart.ascendant?.sign) || '';
    const risingElement = chart.ascendant?.sign?.element || SIGN_ELEMENTS[risingSign] || '';
    if (risingElement) tags.add(`rising-${risingElement.toLowerCase()}` as AffirmationTag);

    // Dominant modality from Sun sign
    const sunModality = chart.sun?.sign?.modality || SIGN_MODALITIES[sunSign] || '';
    if (sunModality) tags.add(`modality-${sunModality.toLowerCase()}` as AffirmationTag);

    // Retrograde emphasis (3+ natal retrogrades)
    const retroCount = [
      chart.mercury, chart.venus, chart.mars, chart.jupiter,
      chart.saturn, chart.uranus, chart.neptune, chart.pluto,
    ].filter(p => p?.isRetrograde).length;
    if (retroCount >= 3) tags.add('retrograde-personal');

    // Transiting Moon sign
    const transitMoonSign = this.getTransitMoonSign(chart, date);
    if (transitMoonSign) {
      tags.add(`transit-${transitMoonSign.toLowerCase()}` as AffirmationTag);
    }

    // Moon phase
    tags.add(getMoonPhaseTag(date));

    // Universal is always relevant
    tags.add('universal');

    return tags;
  }

  private static getTransitMoonSign(chart: NatalChart, date: Date): string {
    try {
      const lat = chart.birthData?.latitude ?? 0;
      const lon = chart.birthData?.longitude ?? 0;
      const transits = getTransitingLongitudes(date, lat, lon);
      const moonLon = transits['Moon'];
      if (typeof moonLon === 'number' && Number.isFinite(moonLon)) {
        return signFromLongitude(moonLon);
      }
    } catch (_e) {
      // fallback
    }
    return '';
  }

  /**
   * Weight tags by specificity — more personal = higher weight.
   * Transit and phase tags get extra weight because they change daily.
   */
  private static tagWeight(tag: AffirmationTag): number {
    if (tag.startsWith('transit-')) return 4;   // changes every ~2.5 days
    if (tag.startsWith('phase-'))  return 3;    // changes every ~3.5 days
    if (tag.startsWith('sun-'))    return 2;    // core identity
    if (tag.startsWith('moon-'))   return 2;    // emotional core
    if (tag.startsWith('rising-')) return 2;    // outer self
    if (tag.startsWith('modality-')) return 1;
    if (tag === 'retrograde-personal') return 2;
    return 1; // universal
  }

  /**
   * Human-readable description of why this affirmation was chosen.
   */
  private static describeSource(tag: string, chart: NatalChart, date: Date): string {
    if (!tag) return 'Your chart today';

    if (tag.startsWith('transit-')) {
      const sign = tag.replace('transit-', '');
      const capitalized = sign.charAt(0).toUpperCase() + sign.slice(1);
      return `Moon in ${capitalized}`;
    }
    if (tag.startsWith('phase-')) {
      return getMoonPhaseName(tag as AffirmationTag);
    }
    if (tag.startsWith('sun-')) {
      const element = tag.replace('sun-', '');
      const sunSign = signName(chart.sunSign) || signName(chart.sun?.sign) || '';
      return `${sunSign} Sun · ${element.charAt(0).toUpperCase() + element.slice(1)}`;
    }
    if (tag.startsWith('moon-')) {
      const element = tag.replace('moon-', '');
      const moonSign = signName(chart.moonSign) || signName(chart.moon?.sign) || '';
      return `${moonSign} Moon · ${element.charAt(0).toUpperCase() + element.slice(1)}`;
    }
    if (tag.startsWith('rising-')) {
      const element = tag.replace('rising-', '');
      const rising = signName(chart.risingSign) || signName(chart.ascendant?.sign) || '';
      return `${rising} Rising · ${element.charAt(0).toUpperCase() + element.slice(1)}`;
    }
    if (tag.startsWith('modality-')) {
      const mod = tag.replace('modality-', '');
      return `${mod.charAt(0).toUpperCase() + mod.slice(1)} energy`;
    }
    if (tag === 'retrograde-personal') {
      return 'Retrograde emphasis';
    }
    return 'Your cosmic blueprint';
  }
}
