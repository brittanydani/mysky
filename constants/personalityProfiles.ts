/**
 * Personality Profiles — Silent Natal Chart Layer
 *
 * Converts natal chart placements into psychological trait descriptors.
 * Used internally by the dream interpretation engine to personalize output.
 *
 * IMPORTANT: Nothing in this file is shown to the user verbatim.
 * The output descriptors are woven into interpretation prose without
 * ever surfacing sign names, planet names, or astrological terminology.
 */

import { NatalChart } from '../services/astrology/types';

export interface PersonalityProfile {
  /** How this person tends to process and move through feelings */
  emotionalStyle: string;
  /** What drives and motivates them at a core level */
  coreMotivation: string;
  /** How they tend to respond under pressure or conflict */
  tensionResponse: string;
  /** How they connect and bond with others */
  connectionStyle: string;
  /** The recurring inner challenge they tend to work through */
  wrestlingTheme: string;
  /** Short phrase for "given your nature" sentence — fits after "given" */
  givenPhrase: string;
}

// ─── Moon Sign → Emotional Processing Style ──────────────────────────────────
// Describes how this person moves through feelings internally.
// Used in: inner landscape, closing reflection

const MOON_EMOTIONAL_STYLE: Record<string, string> = {
  Aries: 'process feelings through movement and action — emotions tend to arrive fast and need an outlet',
  Taurus: 'process feelings through the body; comfort, routine, and time are what let things settle',
  Gemini: 'process through talking and writing; understanding something tends to come before feeling it',
  Cancer: 'feel deeply through memory and connection — you\'re highly attuned to emotional atmosphere, your own and others\'',
  Leo: 'process through expression; being seen and acknowledged is part of how emotions move through you',
  Virgo: 'tend to organize feelings before fully feeling them — analysis arrives first, then the emotional weight',
  Libra: 'process best in relational context; it can be hard to know what you feel without a mirror to reflect it',
  Scorpio: 'process deeply and privately; emotions run beneath the surface and tend to be more intense than they appear',
  Sagittarius: 'process through meaning and movement — restlessness often signals something unresolved asking for space',
  Capricorn: 'process slowly and tend to contain emotions before expressing them; there\'s often a lag between feeling and release',
  Aquarius: 'process by stepping back and observing; strong emotions can feel foreign or overwhelming before they become legible',
  Pisces: 'feel by absorption — emotions arrive as atmosphere, often merging with the mood of what surrounds you',
};

// ─── Sun Sign → Core Motivation / Drive ─────────────────────────────────────
// Describes what drives them at heart — what they're oriented toward.
// Used in: inner landscape personalization

const SUN_CORE_MOTIVATION: Record<string, string> = {
  Aries: 'orient toward initiation and independence — you\'re drawn to being first into the unknown',
  Taurus: 'seek beauty, security, and the building of something lasting — substance over speed',
  Gemini: 'are energized by ideas, curiosity, and exchange — the mind is always in motion',
  Cancer: 'are moved by belonging, care, and the protection of what matters most',
  Leo: 'are drawn toward expression, impact, and being genuinely seen',
  Virgo: 'are motivated by refinement, service, and improving what already exists',
  Libra: 'seek fairness, harmony, and meaningful connection — beauty and balance matter deeply',
  Scorpio: 'are drawn toward depth, truth, and the kind of change that transforms',
  Sagittarius: 'seek meaning, expansion, and the feeling that there\'s always more to discover',
  Capricorn: 'are motivated by mastery, achievement, and building something that endures',
  Aquarius: 'are drawn toward originality, collective change, and breaking from convention',
  Pisces: 'are moved by compassion, creativity, and dissolving into something larger than yourself',
};

// ─── Mars Sign → Response Under Tension / Conflict ───────────────────────────
// Describes how they handle conflict, pressure, or confrontation.
// Used in: symbol interpretation (chase, shadow, confrontation themes)

const MARS_TENSION_RESPONSE: Record<string, string> = {
  Aries: 'respond to tension directly and quickly — your first instinct is to act or confront',
  Taurus: 'are slow to engage but immovable once you\'ve decided; conflict builds beneath the surface before releasing',
  Gemini: 'move through conflict verbally — tension often becomes debate, analysis, or negotiation',
  Cancer: 'tend to withdraw first, then feel the full weight of a conflict later when you\'re alone',
  Leo: 'respond with intensity and need resolution that acknowledges your perspective',
  Virgo: 'analyze and critique when under pressure — logic becomes the way to manage what feels overwhelming',
  Libra: 'tend to avoid conflict first, then over-accommodate to restore harmony',
  Scorpio: 'hold tension beneath the surface, processing quietly before responding with precision',
  Sagittarius: 'sometimes escape through humor or physical distance when things get too close',
  Capricorn: 'become quieter and more controlled under stress; there\'s a wall that goes up',
  Aquarius: 'detach and intellectualize; you can appear unbothered even when deeply affected',
  Pisces: 'absorb tension like atmosphere — it can become a weight you carry before you realize it',
};

// ─── Venus Sign → Connection Style ───────────────────────────────────────────
// Describes how they bond, love, and relate to others.
// Used in: family/past figure interpretations, relationship-themed dreams

const VENUS_CONNECTION_STYLE: Record<string, string> = {
  Aries: 'love with intensity and respond best when reciprocation comes clearly and soon',
  Taurus: 'bond slowly, deeply, and through physical presence and loyalty; love is proven over time',
  Gemini: 'connect through conversation — mental stimulation is as necessary as emotional closeness',
  Cancer: 'love protectively; you bond through care, shared history, and the creation of safe space',
  Leo: 'love generously, and need genuine appreciation to feel truly connected',
  Virgo: 'express love through service and showing up practically for the people you care about',
  Libra: 'love beautifully and seek harmony; conflict in close relationships feels disproportionately disruptive',
  Scorpio: 'love with full depth; connection tends to be all-in or not at all',
  Sagittarius: 'love with freedom — closeness needs room to breathe to feel sustainable',
  Capricorn: 'love consistently and practically; reliability is how you prove devotion',
  Aquarius: 'love authentically but need independence; friendship is the foundation of connection',
  Pisces: 'love compassionately and selflessly — at the risk of losing yourself in others',
};

// ─── Saturn Sign → Recurring Inner Challenge ─────────────────────────────────
// Describes their recurring inner work — the challenge they keep meeting.
// Used in: shadow/threshold symbols, "something to sit with" prompts

const SATURN_WRESTLING_THEME: Record<string, string> = {
  Aries: 'tend to work through the tension between assertion and restraint — knowing when to push and when to let something be',
  Taurus: 'often work through fears of scarcity or instability — learning that security can be built from the inside',
  Gemini: 'tend to work through the scattered mind — learning to commit to a direction without losing curiosity',
  Cancer: 'often return to old emotional patterns, usually ones that formed early — learning that the past can inform without controlling',
  Leo: 'work through the relationship with recognition — learning to create without needing applause to validate it',
  Virgo: 'tend to wrestle with the inner critic — slowly learning that imperfection is not a flaw to be solved',
  Libra: 'often work through indecision and the discomfort of conflict — learning that healthy disagreement isn\'t the end of connection',
  Scorpio: 'work through questions of control and trust — slowly learning that surrender isn\'t the same as defeat',
  Sagittarius: 'tend to work through restlessness — learning that depth and staying have their own kind of meaning',
  Capricorn: 'often wrestle with perfectionism and the weight of self-expectation — slowly learning that rest is not failure',
  Aquarius: 'work through the tension between detachment and genuine belonging — learning to let people in without losing your distinctiveness',
  Pisces: 'tend to work through diffusion and boundaries — learning to stay present in your own life rather than drifting into others\'',
};

// ─── "Given" Phrase → for "given your nature" sentence construction ───────────
// Short phrases that complete "given your tendency to..." in prose.

const GIVEN_PHRASES: Record<string, string> = {
  Aries: 'move quickly through what arises',
  Taurus: 'need time and comfort to process',
  Gemini: 'understand something before fully feeling it',
  Cancer: 'absorb the emotional atmosphere around you',
  Leo: 'need expression to process what\'s internal',
  Virgo: 'reach for analysis before you allow feeling',
  Libra: 'orient toward harmony in your relationships',
  Scorpio: 'process things more deeply than you tend to show',
  Sagittarius: 'seek meaning in what you experience',
  Capricorn: 'carry more than others realize',
  Aquarius: 'observe from a step back before feeling fully',
  Pisces: 'feel everything at once',
};

// ─── Element → Archetypal Emotional Quality ───────────────────────────────────
// Used as a fallback when specific sign data is unavailable.

const ELEMENT_EMOTIONAL_QUALITY: Record<string, string> = {
  Fire: 'move through feelings with energy and intensity — emotions are felt in the body and expressed outwardly',
  Earth: 'process through the physical and practical; comfort, routine, and tangible grounding help',
  Air: 'reach for understanding before feeling — the mind often arrives first',
  Water: 'feel deeply and by absorption — the emotional atmosphere around you shapes your inner experience',
};

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Build a personality profile from a natal chart.
 * All output is in psychological language — no sign or planet names in the strings.
 * Returns a profile with descriptors that can be woven into interpretation prose.
 */
export function buildPersonalityProfile(chart: NatalChart): PersonalityProfile {
  const moonSign = chart.moonSign?.name || '';
  const sunSign = chart.sunSign?.name || '';
  const marsSign = chart.mars?.sign?.name || '';
  const venusSign = chart.venus?.sign?.name || '';
  const saturnSign = chart.saturn?.sign?.name || '';

  const moonElement = chart.moonSign?.element || 'Water';

  const emotionalStyle =
    MOON_EMOTIONAL_STYLE[moonSign] ??
    ELEMENT_EMOTIONAL_QUALITY[moonElement] ??
    'process feelings in your own layered way';

  const coreMotivation =
    SUN_CORE_MOTIVATION[sunSign] ??
    'are drawn toward what feels most authentic to who you are';

  const tensionResponse =
    MARS_TENSION_RESPONSE[marsSign] ??
    'tend to respond to conflict in ways shaped by your particular makeup';

  const connectionStyle =
    VENUS_CONNECTION_STYLE[venusSign] ??
    'connect most deeply through your own distinct way of caring';

  const wrestlingTheme =
    SATURN_WRESTLING_THEME[saturnSign] ??
    'tend to return to a recurring inner challenge that keeps inviting growth';

  const givenPhrase =
    GIVEN_PHRASES[moonSign] ??
    GIVEN_PHRASES[sunSign] ??
    'process things in your own way';

  return {
    emotionalStyle,
    coreMotivation,
    tensionResponse,
    connectionStyle,
    wrestlingTheme,
    givenPhrase,
  };
}
