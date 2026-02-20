/**
 * Shadow Quote System (MySky Style)
 *
 * A shadow quote is:
 *   - a moment of honest recognition
 *   - a sentence that names what's usually unconscious
 *   - something that feels quietly confronting but relieving
 *   - "Oh. Yeah. That."
 *
 * CORE RULES (DO NOT BREAK):
 *   1. Never say "you should"
 *   2. Never use astrology terms
 *   3. Never imply something is wrong
 *   4. Always leave room for choice
 *   5. One sentence only (occasionally two, max)
 *
 * STRUCTURE (internal formula):
 *   AWARENESS + TENSION + SELF-PERSONALIZATION
 *   But it reads like a simple sentence.
 */

import { NatalChart, SimpleAspect, AspectTypeName } from './types';
import { TransitSignal } from './dailyInsightEngine';
import { detectChartPatterns } from './chartPatterns';
import { getTransitingLongitudes, computeTransitAspectsToNatal } from './transits';
import { logger } from '../../utils/logger';
import { toLocalDateString, dayOfYear } from '../../utils/dateUtils';
import { getMoonPhaseName } from '../../utils/moonPhase';

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type ShadowTone = 'awareness' | 'protective' | 'tension' | 'release';
export type ShadowIntensity = 'soft' | 'medium' | 'deep';
export type ShadowPlacement =
  | 'today-header'       // under transit headers on Today screen
  | 'journal-prompt'     // at the top of journal prompts
  | 'journal-close'      // after a journal entry is saved
  | 'emotional-footer';  // quiet footer on emotionally active days

export type ActivationTrigger =
  | 'south-node'
  | 'north-node'
  | 'chiron'
  | 'stellium'
  | 'saturn-aspect'
  | 'opposition-aspect'
  | 'node-axis'
  | 'relationship-transit'
  | 'moon-waning'
  | 'moon-new'
  | 'moon-full'
  | 'moon-waxing'
  | 'chiron-moon'
  | 'heavy-day'
  | 'journal-complete'
  | 'inner-planet-retrograde'
  | 'mars-transit'
  | 'venus-transit'
  | 'general';

export interface ShadowQuote {
  id: string;
  text: string;
  tone: ShadowTone;
  triggers: ActivationTrigger[];
  intensity: ShadowIntensity;
  /** Optional: which stellium house this targets (1-12) */
  stelliumHouse?: number;
}

export interface ShadowQuoteResult {
  /** The selected quote */
  quote: ShadowQuote;
  /** Where it should appear */
  placement: ShadowPlacement;
  /** Optional paired journal prompt */
  journalPrompt?: string;
  /** Optional closing quote (shown after journal save) */
  closeQuote?: ShadowQuote;
  /** Human-readable reason this quote was chosen (e.g. "Saturn aspect active") */
  activationReason?: string;
  /** Whether the day is emotionally heavy (deep intensity) */
  isHeavyDay?: boolean;
}

export interface DayActivationContext {
  hasChiron: boolean;
  hasOpposition: boolean;
  hasSaturnAspect: boolean;
  hasNodeAxis: boolean;
  hasRelationshipTransit: boolean;
  hasInnerRetrograde: boolean;
  hasMarsTransit: boolean;
  hasVenusTransit: boolean;
  moonPhase: string;
  stelliumHouses: number[];
  dayIntensity: ShadowIntensity;
  activeTransitSignals: TransitSignal[];
}

// ════════════════════════════════════════════════════════════════════════════
// SHADOW QUOTE CONTENT LIBRARY
// ════════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────
// 1. AWARENESS SHADOWS
//    Bring unconscious behavior into view.
//    Use when: South Node active, stellium house
//    overloaded, Saturn aspects
// ────────────────────────────────────────────────────

const AWARENESS_QUOTES: ShadowQuote[] = [
  { id: 'aw-01', text: "You're holding yourself to a standard you don't apply to others.", tone: 'awareness', triggers: ['saturn-aspect', 'general'], intensity: 'medium' },
  { id: 'aw-02', text: "You notice everyone else's needs faster than your own.", tone: 'awareness', triggers: ['south-node', 'relationship-transit'], intensity: 'medium' },
  { id: 'aw-03', text: "You keep waiting for permission you don't actually need.", tone: 'awareness', triggers: ['saturn-aspect', 'south-node'], intensity: 'deep' },
  { id: 'aw-04', text: "You already know the answer. You're looking for someone else to say it first.", tone: 'awareness', triggers: ['south-node', 'general'], intensity: 'deep' },
  { id: 'aw-05', text: "You rehearse conversations that may never happen.", tone: 'awareness', triggers: ['general', 'mars-transit'], intensity: 'soft' },
  { id: 'aw-06', text: "You're over-explaining yourself to people who aren't asking.", tone: 'awareness', triggers: ['saturn-aspect', 'general'], intensity: 'medium' },
  { id: 'aw-07', text: "You mistake being needed for being loved.", tone: 'awareness', triggers: ['south-node', 'relationship-transit'], intensity: 'deep' },
  { id: 'aw-08', text: "You call it loyalty when sometimes it's just fear of change.", tone: 'awareness', triggers: ['south-node', 'saturn-aspect'], intensity: 'deep' },
  { id: 'aw-09', text: "You're reading the room before you've checked in with yourself.", tone: 'awareness', triggers: ['general', 'relationship-transit'], intensity: 'medium' },
  { id: 'aw-10', text: "You decide you're fine before actually checking if you are.", tone: 'awareness', triggers: ['general', 'saturn-aspect'], intensity: 'medium' },
  { id: 'aw-11', text: "You're carrying a version of yourself that you've already outgrown.", tone: 'awareness', triggers: ['south-node', 'node-axis'], intensity: 'deep' },
  { id: 'aw-12', text: "You're performing calm when you're actually overwhelmed.", tone: 'awareness', triggers: ['heavy-day', 'saturn-aspect'], intensity: 'deep' },
  { id: 'aw-13', text: "You're asking if it's good enough when you haven't asked if it's yours.", tone: 'awareness', triggers: ['south-node', 'general'], intensity: 'medium' },
  { id: 'aw-14', text: "You keep shrinking to fit spaces you've already outgrown.", tone: 'awareness', triggers: ['node-axis', 'south-node'], intensity: 'deep' },
  { id: 'aw-15', text: "You say yes when you mean 'I'll figure it out later.'", tone: 'awareness', triggers: ['general', 'relationship-transit'], intensity: 'soft' },
  { id: 'aw-16', text: "You make others comfortable at the cost of your own clarity.", tone: 'awareness', triggers: ['relationship-transit', 'south-node'], intensity: 'medium' },
  { id: 'aw-17', text: "You treat rest like a reward instead of a right.", tone: 'awareness', triggers: ['saturn-aspect', 'general'], intensity: 'medium' },
  { id: 'aw-18', text: "You confuse overthinking with preparation.", tone: 'awareness', triggers: ['general', 'mars-transit'], intensity: 'soft' },
];

// ────────────────────────────────────────────────────
// 2. PROTECTIVE SHADOWS
//    Honor the reason behind the pattern.
//    Use when: Chiron active, Moon waning phases,
//    inner planets retrograde
// ────────────────────────────────────────────────────

const PROTECTIVE_QUOTES: ShadowQuote[] = [
  { id: 'pr-01', text: "This pattern once kept you safe.", tone: 'protective', triggers: ['chiron', 'inner-planet-retrograde'], intensity: 'soft' },
  { id: 'pr-02', text: "There's a reason you learned to be this way.", tone: 'protective', triggers: ['chiron', 'moon-waning'], intensity: 'soft' },
  { id: 'pr-03', text: "You didn't imagine this need — you adapted to it.", tone: 'protective', triggers: ['chiron', 'heavy-day'], intensity: 'medium' },
  { id: 'pr-04', text: "The part of you that guards so carefully learned it early.", tone: 'protective', triggers: ['chiron', 'saturn-aspect'], intensity: 'medium' },
  { id: 'pr-05', text: "You became strong in the exact place you were left alone.", tone: 'protective', triggers: ['chiron', 'heavy-day'], intensity: 'deep' },
  { id: 'pr-06', text: "This hypervigilance was once intelligent.", tone: 'protective', triggers: ['chiron', 'inner-planet-retrograde'], intensity: 'medium' },
  { id: 'pr-07', text: "You don't need to justify what you survived.", tone: 'protective', triggers: ['chiron', 'heavy-day'], intensity: 'deep' },
  { id: 'pr-08', text: "You built this wall for good reasons. You're allowed to add a door.", tone: 'protective', triggers: ['chiron', 'moon-waning', 'inner-planet-retrograde'], intensity: 'medium' },
  { id: 'pr-09', text: "The way you adapted was creative, not broken.", tone: 'protective', triggers: ['chiron', 'inner-planet-retrograde'], intensity: 'soft' },
  { id: 'pr-10', text: "What looks like avoidance sometimes started as self-preservation.", tone: 'protective', triggers: ['chiron', 'saturn-aspect'], intensity: 'medium' },
  { id: 'pr-11', text: "Your softness isn't naive. It's what stayed whole.", tone: 'protective', triggers: ['chiron', 'moon-waning'], intensity: 'soft' },
  { id: 'pr-12', text: "You learned to read the room because the room used to be unpredictable.", tone: 'protective', triggers: ['chiron', 'heavy-day'], intensity: 'deep' },
  { id: 'pr-13', text: "Being guarded isn't a flaw. It was a solution.", tone: 'protective', triggers: ['chiron', 'inner-planet-retrograde'], intensity: 'medium' },
  { id: 'pr-14', text: "You're not too much. You were just in rooms that were too small.", tone: 'protective', triggers: ['chiron', 'heavy-day', 'moon-waning'], intensity: 'deep' },
  { id: 'pr-15', text: "The independence you carry? You earned it the hard way.", tone: 'protective', triggers: ['chiron', 'saturn-aspect'], intensity: 'medium' },
];

// ────────────────────────────────────────────────────
// 3. TENSION SHADOWS
//    Name the inner push–pull.
//    Use when: Opposition aspects, node axis
//    activation, relationship transits
// ────────────────────────────────────────────────────

const TENSION_QUOTES: ShadowQuote[] = [
  { id: 'te-01', text: "Part of you wants more. Another part wants certainty.", tone: 'tension', triggers: ['opposition-aspect', 'node-axis'], intensity: 'medium' },
  { id: 'te-02', text: "You're torn between staying comfortable and staying honest.", tone: 'tension', triggers: ['opposition-aspect', 'node-axis'], intensity: 'medium' },
  { id: 'te-03', text: "You want closeness, but not at the cost of yourself.", tone: 'tension', triggers: ['relationship-transit', 'opposition-aspect'], intensity: 'deep' },
  { id: 'te-04', text: "You crave freedom but also want to be chosen.", tone: 'tension', triggers: ['opposition-aspect', 'relationship-transit'], intensity: 'deep' },
  { id: 'te-05', text: "You're holding space for two truths that don't fit together yet.", tone: 'tension', triggers: ['opposition-aspect', 'node-axis'], intensity: 'medium' },
  { id: 'te-06', text: "You want to let go but you also want to be asked to stay.", tone: 'tension', triggers: ['relationship-transit', 'opposition-aspect'], intensity: 'deep' },
  { id: 'te-07', text: "You're outgrowing something you still love.", tone: 'tension', triggers: ['node-axis', 'opposition-aspect'], intensity: 'deep' },
  { id: 'te-08', text: "You want to be understood without having to explain everything.", tone: 'tension', triggers: ['relationship-transit', 'general'], intensity: 'medium' },
  { id: 'te-09', text: "You're afraid of losing what you're not sure you want.", tone: 'tension', triggers: ['opposition-aspect', 'node-axis'], intensity: 'deep' },
  { id: 'te-10', text: "Part of you is ready. Another part is asking for one more day.", tone: 'tension', triggers: ['node-axis', 'general'], intensity: 'soft' },
  { id: 'te-11', text: "You want answers but you're not sure you want to ask the question.", tone: 'tension', triggers: ['opposition-aspect', 'mars-transit'], intensity: 'medium' },
  { id: 'te-12', text: "You're holding back words that want movement.", tone: 'tension', triggers: ['mars-transit', 'opposition-aspect'], intensity: 'medium' },
  { id: 'te-13', text: "You want depth, but you also want it to be easy.", tone: 'tension', triggers: ['relationship-transit', 'node-axis'], intensity: 'medium' },
  { id: 'te-14', text: "You're loyal to a version of yourself that no longer fits.", tone: 'tension', triggers: ['node-axis', 'south-node'], intensity: 'deep' },
  { id: 'te-15', text: "You want to be brave but you also want someone to go first.", tone: 'tension', triggers: ['north-node', 'general'], intensity: 'soft' },
];

// ────────────────────────────────────────────────────
// 4. RELEASE SHADOWS
//    Offer soft permission.
//    Use when: Chiron + Moon, heavy emotional days,
//    journal completion moments
// ────────────────────────────────────────────────────

const RELEASE_QUOTES: ShadowQuote[] = [
  { id: 're-01', text: "You don't have to resolve this today.", tone: 'release', triggers: ['chiron-moon', 'heavy-day', 'journal-complete'], intensity: 'soft' },
  { id: 're-02', text: "This doesn't need a solution to be valid.", tone: 'release', triggers: ['chiron-moon', 'heavy-day', 'journal-complete'], intensity: 'soft' },
  { id: 're-03', text: "Awareness is enough for now.", tone: 'release', triggers: ['journal-complete', 'general'], intensity: 'soft' },
  { id: 're-04', text: "You don't have to be ready. You just have to be honest.", tone: 'release', triggers: ['heavy-day', 'chiron-moon'], intensity: 'medium' },
  { id: 're-05', text: "This feeling is passing through, not moving in.", tone: 'release', triggers: ['heavy-day', 'chiron-moon'], intensity: 'soft' },
  { id: 're-06', text: "You're not behind. You're integrating.", tone: 'release', triggers: ['moon-waning', 'journal-complete'], intensity: 'soft' },
  { id: 're-07', text: "You can put this down for today.", tone: 'release', triggers: ['heavy-day', 'journal-complete'], intensity: 'soft' },
  { id: 're-08', text: "You don't need the right words yet.", tone: 'release', triggers: ['journal-complete', 'chiron-moon'], intensity: 'soft' },
  { id: 're-09', text: "Nothing needs to be fixed right now.", tone: 'release', triggers: ['heavy-day', 'chiron-moon', 'journal-complete'], intensity: 'soft' },
  { id: 're-10', text: "You've done enough thinking for today.", tone: 'release', triggers: ['journal-complete', 'general'], intensity: 'soft' },
  { id: 're-11', text: "What you felt today mattered, even if it didn't lead anywhere.", tone: 'release', triggers: ['journal-complete', 'heavy-day'], intensity: 'medium' },
  { id: 're-12', text: "You don't owe anyone your healing timeline.", tone: 'release', triggers: ['chiron', 'heavy-day'], intensity: 'medium' },
  { id: 're-13', text: "Sitting with it is doing something.", tone: 'release', triggers: ['moon-waning', 'journal-complete'], intensity: 'soft' },
  { id: 're-14', text: "Let this be incomplete. It still counts.", tone: 'release', triggers: ['journal-complete', 'general'], intensity: 'soft' },
  { id: 're-15', text: "You noticed something today. That's the work.", tone: 'release', triggers: ['journal-complete', 'chiron-moon'], intensity: 'soft' },
];

// ────────────────────────────────────────────────────
// 5. CHIRON SHADOW QUOTES
//    Tone: gentle, validating
// ────────────────────────────────────────────────────

const CHIRON_QUOTES: ShadowQuote[] = [
  { id: 'ch-01', text: "This feels sensitive because it matters.", tone: 'protective', triggers: ['chiron'], intensity: 'soft' },
  { id: 'ch-02', text: "You notice this more deeply than most.", tone: 'protective', triggers: ['chiron'], intensity: 'soft' },
  { id: 'ch-03', text: "Tenderness doesn't mean fragility.", tone: 'protective', triggers: ['chiron'], intensity: 'soft' },
  { id: 'ch-04', text: "Your sensitivity is a form of intelligence.", tone: 'protective', triggers: ['chiron'], intensity: 'medium' },
  { id: 'ch-05', text: "This wound taught you something others won't understand without living it.", tone: 'protective', triggers: ['chiron'], intensity: 'deep' },
  { id: 'ch-06', text: "Being moved by this isn't weakness. It's presence.", tone: 'protective', triggers: ['chiron'], intensity: 'soft' },
  { id: 'ch-07', text: "You feel the crack in the room that everyone else walks past.", tone: 'protective', triggers: ['chiron'], intensity: 'medium' },
  { id: 'ch-08', text: "The place that still aches? That's also where your gift lives.", tone: 'protective', triggers: ['chiron'], intensity: 'deep' },
];

// ────────────────────────────────────────────────────
// 6. NODE SHADOW QUOTES
// ────────────────────────────────────────────────────

const SOUTH_NODE_QUOTES: ShadowQuote[] = [
  { id: 'sn-01', text: "Familiar doesn't always mean aligned.", tone: 'awareness', triggers: ['south-node'], intensity: 'medium' },
  { id: 'sn-02', text: "You know this path well.", tone: 'awareness', triggers: ['south-node'], intensity: 'soft' },
  { id: 'sn-03', text: "You don't have to stay here to be safe.", tone: 'awareness', triggers: ['south-node'], intensity: 'medium' },
  { id: 'sn-04', text: "Comfort can be a place you hide and a place you heal. You'll know which.", tone: 'awareness', triggers: ['south-node'], intensity: 'deep' },
  { id: 'sn-05', text: "You've mastered this. That's exactly why it's time to go.", tone: 'awareness', triggers: ['south-node'], intensity: 'deep' },
  { id: 'sn-06', text: "This feels easy because you've done it a thousand times.", tone: 'awareness', triggers: ['south-node'], intensity: 'medium' },
];

const NORTH_NODE_QUOTES: ShadowQuote[] = [
  { id: 'nn-01', text: "Growth rarely feels confident at first.", tone: 'tension', triggers: ['north-node'], intensity: 'soft' },
  { id: 'nn-02', text: "This feels awkward because it's new.", tone: 'tension', triggers: ['north-node'], intensity: 'soft' },
  { id: 'nn-03', text: "Discomfort doesn't mean misalignment.", tone: 'tension', triggers: ['north-node'], intensity: 'medium' },
  { id: 'nn-04', text: "You're not failing at this. You're learning it for the first time.", tone: 'tension', triggers: ['north-node'], intensity: 'medium' },
  { id: 'nn-05', text: "The unfamiliar path is unfamiliar because you haven't walked it yet.", tone: 'tension', triggers: ['north-node'], intensity: 'soft' },
  { id: 'nn-06', text: "What calls you forward will never feel as safe as what you're leaving.", tone: 'tension', triggers: ['north-node'], intensity: 'deep' },
];

// ────────────────────────────────────────────────────
// 7. STELLIUM SHADOW QUOTES (house-driven)
// ────────────────────────────────────────────────────

const STELLIUM_HOUSE_QUOTES: Record<number, ShadowQuote[]> = {
  1: [
    { id: 'st1-01', text: "You feel pressure to be someone, even when resting.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 1 },
    { id: 'st1-02', text: "You've made your identity a project. It's okay to just exist.", tone: 'awareness', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 1 },
    { id: 'st1-03', text: "You curate how you're perceived before anyone asks you to.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 1 },
    { id: 'st1-04', text: "Resting doesn't erase you. You're still here when you're still.", tone: 'release', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 1 },
  ],
  2: [
    { id: 'st2-01', text: "You tie your worth to what you produce.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 2 },
    { id: 'st2-02', text: "Security feels like something you have to earn every day.", tone: 'awareness', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 2 },
    { id: 'st2-03', text: "You confuse having enough with being enough.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 2 },
    { id: 'st2-04', text: "Stability isn't something you owe the world. It's something you deserve.", tone: 'protective', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 2 },
  ],
  3: [
    { id: 'st3-01', text: "You process out loud and then wonder if you said too much.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 3 },
    { id: 'st3-02', text: "Your mind is always two conversations ahead.", tone: 'awareness', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 3 },
    { id: 'st3-03', text: "Not every thought needs to become a sentence.", tone: 'release', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 3 },
    { id: 'st3-04', text: "You learn by talking, but you heal by listening — to yourself.", tone: 'protective', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 3 },
  ],
  4: [
    { id: 'st4-01', text: "You carry emotional weight quietly.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 4 },
    { id: 'st4-02', text: "Home is a feeling you've been building your whole life.", tone: 'protective', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 4 },
    { id: 'st4-03', text: "Your roots run deep. That's strength, not heaviness.", tone: 'protective', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 4 },
    { id: 'st4-04', text: "You feel responsible for the emotional climate around you.", tone: 'awareness', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 4 },
  ],
  5: [
    { id: 'st5-01', text: "You need to create, but you also need permission to be bad at it.", tone: 'tension', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 5 },
    { id: 'st5-02', text: "Play feels productive to you. That's both a gift and a trap.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 5 },
    { id: 'st5-03', text: "You perform joy sometimes instead of just feeling it.", tone: 'awareness', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 5 },
    { id: 'st5-04', text: "Your inner child doesn't need a purpose. Just a moment.", tone: 'release', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 5 },
  ],
  6: [
    { id: 'st6-01', text: "You find safety in being useful.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 6 },
    { id: 'st6-02', text: "You optimize yourself like a system when you're actually a person.", tone: 'awareness', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 6 },
    { id: 'st6-03', text: "Your body keeps the score, even when your calendar doesn't.", tone: 'protective', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 6 },
    { id: 'st6-04', text: "Being helpful doesn't mean being available to everyone.", tone: 'release', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 6 },
  ],
  7: [
    { id: 'st7-01', text: "You adapt quickly to keep connection smooth.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 7 },
    { id: 'st7-02', text: "You know their needs. When was the last time you named yours?", tone: 'awareness', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 7 },
    { id: 'st7-03', text: "Partnership is your mirror. Sometimes mirrors show too much.", tone: 'tension', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 7 },
    { id: 'st7-04', text: "You don't disappear in relationships. You just get quieter.", tone: 'protective', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 7 },
  ],
  8: [
    { id: 'st8-01', text: "You see beneath surfaces. It's exhausting to pretend you don't.", tone: 'awareness', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 8 },
    { id: 'st8-02', text: "You're drawn to depth but tired of always being the one who goes there.", tone: 'tension', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 8 },
    { id: 'st8-03', text: "Intensity is your comfort zone. Lightness feels like a risk.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 8 },
    { id: 'st8-04', text: "Not everything needs to be a transformation. Some things can just be.", tone: 'release', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 8 },
  ],
  9: [
    { id: 'st9-01', text: "You search for meaning in everything. Some things just are.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 9 },
    { id: 'st9-02', text: "You've made beliefs a home. Sometimes homes need renovation.", tone: 'tension', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 9 },
    { id: 'st9-03', text: "Your vision is expansive. Your body is still here.", tone: 'awareness', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 9 },
    { id: 'st9-04', text: "Wisdom isn't the same as certainty. You're allowed not to know.", tone: 'release', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 9 },
  ],
  10: [
    { id: 'st10-01', text: "You measure yourself by impact more than ease.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 10 },
    { id: 'st10-02', text: "Achievement is your love language. What happens when you stop achieving?", tone: 'tension', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 10 },
    { id: 'st10-03', text: "You've built a reputation. But who are you without it?", tone: 'awareness', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 10 },
    { id: 'st10-04', text: "Your ambition is a strength. Your rest is not a weakness.", tone: 'protective', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 10 },
  ],
  11: [
    { id: 'st11-01', text: "You care about the group, but forget to include yourself in it.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 11 },
    { id: 'st11-02', text: "You future-plan to avoid present-feeling.", tone: 'awareness', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 11 },
    { id: 'st11-03', text: "You're everyone's ally. Who's yours?", tone: 'tension', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 11 },
    { id: 'st11-04', text: "The collective matters. But so does the individual holding it together.", tone: 'protective', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 11 },
  ],
  12: [
    { id: 'st12-01', text: "You absorb what isn't yours and call it intuition.", tone: 'awareness', triggers: ['stellium'], intensity: 'deep', stelliumHouse: 12 },
    { id: 'st12-02', text: "Solitude heals you, but isolation doesn't. You know the difference.", tone: 'tension', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 12 },
    { id: 'st12-03', text: "You feel everything. Not all of it belongs to you.", tone: 'awareness', triggers: ['stellium'], intensity: 'medium', stelliumHouse: 12 },
    { id: 'st12-04', text: "Surrender isn't giving up. It's the bravest thing you do.", tone: 'release', triggers: ['stellium'], intensity: 'soft', stelliumHouse: 12 },
  ],
};

// ────────────────────────────────────────────────────
// 8. RELATIONSHIP SHADOW QUOTES
// ────────────────────────────────────────────────────

const RELATIONSHIP_QUOTES: ShadowQuote[] = [
  { id: 'rl-01', text: "You notice imbalance before others do.", tone: 'awareness', triggers: ['relationship-transit'], intensity: 'medium' },
  { id: 'rl-02', text: "You give clarity that you don't always receive.", tone: 'awareness', triggers: ['relationship-transit'], intensity: 'medium' },
  { id: 'rl-03', text: "You sense shifts before they're spoken.", tone: 'awareness', triggers: ['relationship-transit'], intensity: 'soft' },
  { id: 'rl-04', text: "You make people feel seen. Who sees you?", tone: 'tension', triggers: ['relationship-transit'], intensity: 'deep' },
  { id: 'rl-05', text: "You translate yourself for others. They don't know you're doing it.", tone: 'awareness', triggers: ['relationship-transit'], intensity: 'medium' },
  { id: 'rl-06', text: "You hold the emotional temperature of every room you enter.", tone: 'awareness', triggers: ['relationship-transit'], intensity: 'medium' },
];

// ────────────────────────────────────────────────────
// 9. MOON PHASE SHADOW QUOTES
// ────────────────────────────────────────────────────

const MOON_PHASE_QUOTES: Record<string, ShadowQuote[]> = {
  waning: [
    { id: 'mp-w01', text: "You've already learned something here.", tone: 'release', triggers: ['moon-waning'], intensity: 'soft' },
    { id: 'mp-w02', text: "This phase asks for integration, not action.", tone: 'release', triggers: ['moon-waning'], intensity: 'soft' },
    { id: 'mp-w03', text: "Let the lesson land before reaching for the next one.", tone: 'release', triggers: ['moon-waning'], intensity: 'medium' },
  ],
  new: [
    { id: 'mp-n01', text: "You don't need certainty to begin.", tone: 'tension', triggers: ['moon-new'], intensity: 'soft' },
    { id: 'mp-n02', text: "Something is forming that you can't see yet. That's okay.", tone: 'release', triggers: ['moon-new'], intensity: 'soft' },
    { id: 'mp-n03', text: "Beginnings don't announce themselves. They whisper.", tone: 'awareness', triggers: ['moon-new'], intensity: 'soft' },
  ],
  full: [
    { id: 'mp-f01', text: "What's been building is now visible. Look at it.", tone: 'awareness', triggers: ['moon-full'], intensity: 'medium' },
    { id: 'mp-f02', text: "Fullness includes everything — even what you'd rather not see.", tone: 'tension', triggers: ['moon-full'], intensity: 'medium' },
    { id: 'mp-f03', text: "You can't unsee what the light reveals. That's the gift.", tone: 'awareness', triggers: ['moon-full'], intensity: 'deep' },
    { id: 'mp-f04', text: "Completion isn't the same as resolution. Both are real.", tone: 'release', triggers: ['moon-full'], intensity: 'soft' },
  ],
  waxing: [
    { id: 'mp-x01', text: "Momentum isn't the same as clarity. Both are useful.", tone: 'awareness', triggers: ['moon-waxing'], intensity: 'soft' },
    { id: 'mp-x02', text: "Building doesn't have to feel certain to be worthwhile.", tone: 'tension', triggers: ['moon-waxing'], intensity: 'soft' },
    { id: 'mp-x03', text: "You're in the middle. The middle is allowed to be messy.", tone: 'release', triggers: ['moon-waxing'], intensity: 'soft' },
    { id: 'mp-x04', text: "Progress doesn't always look like progress. Sometimes it looks like patience.", tone: 'protective', triggers: ['moon-waxing'], intensity: 'medium' },
  ],
};

// ────────────────────────────────────────────────────
// 10. SHADOW-PAIRED JOURNAL PROMPTS
// ────────────────────────────────────────────────────

const SHADOW_JOURNAL_PROMPTS: Record<ShadowTone, string[]> = {
  awareness: [
    "What wants expression before it turns into tension?",
    "What are you doing automatically that you could do intentionally?",
    "Where are you performing instead of being?",
    "What truth are you circling around but haven't landed on?",
    "What pattern do you notice today that you usually ignore?",
    "What are you tolerating that you've stopped questioning?",
    "Who are you being today that isn't quite you?",
  ],
  protective: [
    "What part of you needs acknowledgment today?",
    "What survival skill have you been using that you no longer need?",
    "When did you first learn to do this?",
    "What would your younger self want to hear from you right now?",
    "What are you protecting, and is it still in danger?",
    "What would safety feel like if you didn't have to earn it?",
  ],
  tension: [
    "What are the two things pulling you in different directions right now?",
    "What would you choose if both options were safe?",
    "What are you afraid of wanting?",
    "What conversation are you avoiding? What might it open up?",
    "Where are you stuck between who you were and who you're becoming?",
    "What would it feel like to stop holding both sides?",
  ],
  release: [
    "What can you set down today, even temporarily?",
    "What would it mean to let this be unfinished?",
    "What permission are you waiting for that you could give yourself?",
    "What's one kind thing you could say to yourself right now?",
    "What have you been carrying that isn't yours?",
    "If you didn't need to fix anything, what would you do with this moment?",
  ],
};


// ════════════════════════════════════════════════════════════════════════════
// QUOTE SELECTION ENGINE
// ════════════════════════════════════════════════════════════════════════════

/**
 * 14-day anti-repetition key for AsyncStorage / SQLite
 */
const SHOWN_QUOTES_KEY = 'shadow_quotes_shown';
const ANTI_REPEAT_DAYS = 14;

/**
 * Get all quotes as a flat array
 */
function getAllQuotes(): ShadowQuote[] {
  const stelliumQuotes = Object.values(STELLIUM_HOUSE_QUOTES).flat();
  const moonQuotes = Object.values(MOON_PHASE_QUOTES).flat();
  return [
    ...AWARENESS_QUOTES,
    ...PROTECTIVE_QUOTES,
    ...TENSION_QUOTES,
    ...RELEASE_QUOTES,
    ...CHIRON_QUOTES,
    ...SOUTH_NODE_QUOTES,
    ...NORTH_NODE_QUOTES,
    ...RELATIONSHIP_QUOTES,
    ...stelliumQuotes,
    ...moonQuotes,
  ];
}

/**
 * Detect activations from the user's chart and current transits
 */
function detectActivations(
  chart: NatalChart,
  transitSignals: TransitSignal[],
  moonPhase: string,
): DayActivationContext {
  // Detect stellium houses
  const stelliumHouses: number[] = [];
  try {
    const patterns = detectChartPatterns(chart);
    for (const s of patterns.stelliums) {
      // Extract house number from label like "1st House" or combined stelliums
      const houseMatch = s.label.match(/(\d+)(?:st|nd|rd|th)\s*House/i);
      if (houseMatch) {
        stelliumHouses.push(parseInt(houseMatch[1], 10));
      }
      // For house-type stelliums, parse from type
      if (s.type === 'house' || s.type === 'combined') {
        const numMatch = s.label.match(/House\s*(\d+)/i) || s.label.match(/(\d+)/);
        if (numMatch && !stelliumHouses.includes(parseInt(numMatch[1], 10))) {
          stelliumHouses.push(parseInt(numMatch[1], 10));
        }
      }
    }
  } catch {
    // Chart patterns may not be available
  }

  // Analyze transit signals for activations
  let hasOpposition = false;
  let hasSaturnAspect = false;
  let hasRelationshipTransit = false;
  let hasMarsTransit = false;
  let hasVenusTransit = false;

  for (const signal of transitSignals) {
    if (signal.aspectType === 'opposition') hasOpposition = true;
    if (signal.transitingPlanet === 'Saturn') hasSaturnAspect = true;
    if (signal.transitingPlanet === 'Mars') hasMarsTransit = true;
    if (signal.transitingPlanet === 'Venus') hasVenusTransit = true;
    if (signal.domain === 'love' || signal.natalTarget === 'Venus') {
      hasRelationshipTransit = true;
    }
  }

  // Check for retrogrades among inner planets in the natal chart
  let hasInnerRetrograde = false;
  const innerPlanets = ['Mercury', 'Venus', 'Mars'];
  for (const p of chart.placements) {
    if (innerPlanets.includes(p.planet.name) && p.isRetrograde) {
      hasInnerRetrograde = true;
      break;
    }
  }

  // Day intensity: sum of transit signal scores
  const totalScore = transitSignals.reduce((sum, s) => sum + s.score, 0);
  let dayIntensity: ShadowIntensity = 'soft';
  if (totalScore > 30) dayIntensity = 'deep';
  else if (totalScore > 15) dayIntensity = 'medium';

  // We simulate Chiron / Node presence based on aspects and known patterns
  // Since Chiron/Nodes aren't in the transit engine yet, we derive from:
  // - Saturn aspects (proxy for Chiron-like themes)
  // - Node axis: opposition aspects (proxy for N/S Node tension)
  const hasChiron = hasSaturnAspect || dayIntensity === 'deep';
  const hasNodeAxis = hasOpposition;

  return {
    hasChiron,
    hasOpposition,
    hasSaturnAspect,
    hasNodeAxis,
    hasRelationshipTransit,
    hasInnerRetrograde,
    hasMarsTransit,
    hasVenusTransit,
    moonPhase: moonPhase.toLowerCase(),
    stelliumHouses,
    dayIntensity,
    activeTransitSignals: transitSignals,
  };
}

/**
 * Score a quote against the current activation context.
 * Higher score = better match.
 */
function scoreQuote(quote: ShadowQuote, ctx: DayActivationContext): number {
  let score = 0;

  const triggerMap: Record<ActivationTrigger, boolean> = {
    'south-node': ctx.hasNodeAxis,
    'north-node': ctx.hasNodeAxis,
    'chiron': ctx.hasChiron,
    'stellium': ctx.stelliumHouses.length > 0,
    'saturn-aspect': ctx.hasSaturnAspect,
    'opposition-aspect': ctx.hasOpposition,
    'node-axis': ctx.hasNodeAxis,
    'relationship-transit': ctx.hasRelationshipTransit,
    'moon-waning': ctx.moonPhase.includes('waning'),
    'moon-new': ctx.moonPhase.includes('new'),
    'moon-full': ctx.moonPhase.includes('full'),
    'moon-waxing': ctx.moonPhase.includes('waxing'),
    'chiron-moon': ctx.hasChiron && ctx.moonPhase.includes('waning'),
    'heavy-day': ctx.dayIntensity === 'deep',
    'journal-complete': false, // scored separately for close quotes
    'inner-planet-retrograde': ctx.hasInnerRetrograde,
    'mars-transit': ctx.hasMarsTransit,
    'venus-transit': ctx.hasVenusTransit,
    'general': true,
  };

  for (const trigger of quote.triggers) {
    if (triggerMap[trigger]) {
      score += trigger === 'general' ? 1 : 3;
    }
  }

  // Stellium house specificity bonus
  if (quote.stelliumHouse && ctx.stelliumHouses.includes(quote.stelliumHouse)) {
    score += 5;
  }

  // Intensity matching: prefer matching day intensity
  if (quote.intensity === ctx.dayIntensity) {
    score += 2;
  }

  // On heavy days, default to protective tone (per spec)
  if (ctx.dayIntensity === 'deep' && quote.tone === 'protective') {
    score += 3;
  }

  return score;
}


// ════════════════════════════════════════════════════════════════════════════
// ANTI-REPETITION (SQLite-backed)
// ════════════════════════════════════════════════════════════════════════════

interface ShownQuoteRecord {
  quoteId: string;
  shownAt: string; // ISO date
}

async function getRecentlyShownIds(): Promise<Set<string>> {
  try {
    const db = await getDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ANTI_REPEAT_DAYS);
    const cutoffStr = toLocalDateString(cutoff);

    const rows: any[] = await db.getAllAsync(
      'SELECT quote_id FROM shadow_quotes_shown WHERE shown_at >= ?',
      [cutoffStr]
    );
    return new Set(rows.map((r: any) => r.quote_id));
  } catch {
    return new Set();
  }
}

async function markQuoteShown(quoteId: string): Promise<void> {
  try {
    const db = await getDb();
    const today = toLocalDateString(new Date());
    await db.runAsync(
      'INSERT OR REPLACE INTO shadow_quotes_shown (quote_id, shown_at) VALUES (?, ?)',
      [quoteId, today]
    );

    // Cleanup old records (> 30 days)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    await db.runAsync(
      'DELETE FROM shadow_quotes_shown WHERE shown_at < ?',
      [toLocalDateString(cutoff)]
    );
  } catch (e) {
    logger.error('[ShadowQuotes] Failed to mark quote shown:', e);
  }
}

async function getDb() {
  const SQLite = require('expo-sqlite');
  const db = await SQLite.openDatabaseAsync('mysky.db');
  // Ensure table exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS shadow_quotes_shown (
      quote_id TEXT PRIMARY KEY,
      shown_at TEXT NOT NULL
    );
  `);
  return db;
}


// ════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════════════════

export class ShadowQuoteEngine {

  /**
   * Generate the day's shadow quote for the Today screen.
   * Returns the best-matching quote based on chart, transits, and moon phase.
   */
  static async getDailyShadowQuote(
    chart: NatalChart,
    date: Date = new Date(),
  ): Promise<ShadowQuoteResult> {
    const ctx = this.buildContextFromChart(chart, date);
    return this.selectQuote(ctx, 'today-header');
  }

  /**
   * Generate a shadow quote for the journal prompt header.
   */
  static async getJournalPromptQuote(
    chart: NatalChart,
    date: Date = new Date(),
  ): Promise<ShadowQuoteResult> {
    const ctx = this.buildContextFromChart(chart, date);
    return this.selectQuote(ctx, 'journal-prompt');
  }

  /**
   * Generate a shadow quote for after journal entry is saved.
   * Always a release-tone quote.
   */
  static async getJournalCloseQuote(): Promise<ShadowQuote> {
    const recentIds = await getRecentlyShownIds();
    const releasePool = RELEASE_QUOTES.filter(q => !recentIds.has(q.id));
    const pool = releasePool.length > 0 ? releasePool : RELEASE_QUOTES;

    // Deterministic-ish selection using date
    const today = new Date();
    const dayHash = today.getFullYear() * 1000 + dayOfYear(today);
    const idx = (dayHash * 7 + 13) % pool.length;
    const quote = pool[idx];

    await markQuoteShown(quote.id);
    return quote;
  }

  /**
   * Generate a shadow quote using pre-computed activation context.
   * Use this when you already have transit data available.
   */
  static async getQuoteFromContext(
    ctx: DayActivationContext,
    placement: ShadowPlacement,
  ): Promise<ShadowQuoteResult> {
    return this.selectQuote(ctx, placement);
  }

  /**
   * Build an activation context from data you already have.
   * Useful when integrating into existing screens that already computed transits.
   */
  static buildActivationContext(
    chart: NatalChart,
    moonPhase: string,
    transitSignals: TransitSignal[],
  ): DayActivationContext {
    return detectActivations(chart, transitSignals, moonPhase);
  }

  /**
   * Build activation context directly from a chart + date.
   * Computes its own lightweight transit aspects.
   */
  private static buildContextFromChart(
    chart: NatalChart,
    date: Date,
  ): DayActivationContext {
    let transitSignals: TransitSignal[] = [];
    let moonPhase = 'Waxing Crescent';

    try {
      const transits = getTransitingLongitudes(
        date,
        chart.birthData.latitude,
        chart.birthData.longitude,
        chart.houseSystem || 'whole-sign',
      );
      const aspects = computeTransitAspectsToNatal(chart, transits);
      transitSignals = transitAspectsToActivationSignals(aspects);
      moonPhase = getMoonPhaseName(date);
    } catch (e) {
      logger.error('[ShadowQuotes] Transit computation failed, using defaults:', e);
    }

    return detectActivations(chart, transitSignals, moonPhase);
  }

  /**
   * Internal: select the best quote from the full library.
   */
  private static async selectQuote(
    ctx: DayActivationContext,
    placement: ShadowPlacement,
  ): Promise<ShadowQuoteResult> {
    const recentIds = await getRecentlyShownIds();
    const allQuotes = getAllQuotes();

    // Score all quotes
    const scored = allQuotes
      .filter(q => !recentIds.has(q.id))
      .map(q => ({ quote: q, score: scoreQuote(q, ctx) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    // If all filtered out, reset and use all quotes
    const candidates = scored.length > 0
      ? scored
      : allQuotes
          .map(q => ({ quote: q, score: scoreQuote(q, ctx) }))
          .sort((a, b) => b.score - a.score);

    // Take from top 5 with weighted randomness for variety
    const topN = candidates.slice(0, 5);
    const today = new Date();
    const dayHash = today.getFullYear() * 1000 + dayOfYear(today);
    const selectedIdx = dayHash % topN.length;
    const selected = topN[selectedIdx].quote;

    // Mark as shown
    await markQuoteShown(selected.id);

    // Pick a paired journal prompt
    const promptPool = SHADOW_JOURNAL_PROMPTS[selected.tone];
    const promptIdx = (dayHash + 3) % promptPool.length;

    // Pick a close quote (always release tone)
    const closePool = RELEASE_QUOTES.filter(q => q.id !== selected.id && !recentIds.has(q.id));
    const closeQuote = closePool.length > 0
      ? closePool[(dayHash + 7) % closePool.length]
      : RELEASE_QUOTES[(dayHash + 7) % RELEASE_QUOTES.length];

    return {
      quote: selected,
      placement,
      journalPrompt: promptPool[promptIdx],
      closeQuote,
      activationReason: deriveActivationReason(selected, ctx),
      isHeavyDay: ctx.dayIntensity === 'deep',
    };
  }
}

/**
 * Derive a human-readable reason for why this quote was chosen.
 * Never uses astrology jargon — keeps it in "feeling" language.
 */
function deriveActivationReason(
  quote: ShadowQuote,
  ctx: DayActivationContext,
): string | undefined {
  // Prioritize the most specific trigger match
  if (quote.stelliumHouse && ctx.stelliumHouses.includes(quote.stelliumHouse)) {
    return 'Based on a concentration in your chart';
  }
  if (quote.triggers.includes('chiron') && ctx.hasChiron) {
    return 'A sensitivity in your chart is active today';
  }
  if (quote.triggers.includes('node-axis') && ctx.hasNodeAxis) {
    return 'Your growth edge is in focus today';
  }
  if (quote.triggers.includes('south-node') && ctx.hasNodeAxis) {
    return 'A familiar pattern is surfacing';
  }
  if (quote.triggers.includes('north-node') && ctx.hasNodeAxis) {
    return 'Something new is asking for attention';
  }
  if (quote.triggers.includes('relationship-transit') && ctx.hasRelationshipTransit) {
    return 'Connection themes are active right now';
  }
  if (quote.triggers.includes('opposition-aspect') && ctx.hasOpposition) {
    return 'Two parts of your life are in dialogue';
  }
  if (quote.triggers.includes('saturn-aspect') && ctx.hasSaturnAspect) {
    return 'Structure and boundaries are in focus';
  }
  if (quote.triggers.includes('heavy-day') && ctx.dayIntensity === 'deep') {
    return 'Today carries extra emotional weight';
  }
  const moonTriggers: ActivationTrigger[] = ['moon-waning', 'moon-new', 'moon-full', 'moon-waxing'];
  for (const mt of moonTriggers) {
    if (quote.triggers.includes(mt)) {
      return 'Matched to the current lunar rhythm';
    }
  }
  return undefined;
}


// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// getDayOfYear → imported as dayOfYear from dateUtils
// getMoonPhaseName → imported from utils/moonPhase
// ════════════════════════════════════════════════════════════════════════════

/**
 * Convert transit SimpleAspects into lightweight TransitSignal-like objects
 * for the shadow quote activation context.
 */
function transitAspectsToActivationSignals(
  aspects: SimpleAspect[],
): TransitSignal[] {
  const PLANET_TO_DOMAIN: Record<string, string> = {
    Venus: 'love', Mars: 'energy', Mercury: 'focus',
    Moon: 'mood', Sun: 'direction', Jupiter: 'growth', Saturn: 'focus',
  };
  const ASPECT_WEIGHTS: Record<string, number> = {
    conjunction: 6, opposition: 5, square: 5, trine: 4, sextile: 3,
  };

  return aspects.map(a => ({
    transitingPlanet: a.pointA,
    natalTarget: a.pointB,
    aspectType: a.type,
    orb: a.orb,
    score: (ASPECT_WEIGHTS[a.type] || 3) * (1 - a.orb / 4),
    domain: (PLANET_TO_DOMAIN[a.pointB] || PLANET_TO_DOMAIN[a.pointA] || 'mood') as any,
    isAngle: a.pointB === 'Ascendant' || a.pointB === 'Midheaven',
  }));
}
