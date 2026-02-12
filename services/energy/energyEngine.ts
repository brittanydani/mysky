// ─────────────────────────────────────────────────────────────
// MySky — Energy Engine
// Translates natal chart + transits + Moon into daily energy data
// No horoscopes. Personal energy weather, grounded in placements.
// ─────────────────────────────────────────────────────────────

import { NatalChart, PlanetPlacement, ZodiacSign } from '../astrology/types';
import { getTransitingLongitudes } from '../astrology/transits';
import { getMoonPhaseInfo } from '../../utils/moonPhase';

// ── Types ────────────────────────────────────────────────────

export type EnergyIntensity = 'Low' | 'Moderate' | 'High';

export type ChakraState = 'Flowing' | 'Sensitive' | 'Grounding Needed' | 'Quiet';

export interface ChakraReading {
  name: string;
  emoji: string;
  state: ChakraState;
  trigger: string;           // astrological trigger
  bodyCue: string;           // how it may show up physically
  healingSuggestion: string; // grounding practice for this chakra today
  elementConnection: string; // how the current element interacts with this chakra
  affirmation: string;       // a short affirmation aligned to the chakra state
  color: string;             // for UI
}

export type EnergyDomainName = 'Mental' | 'Emotional' | 'Physical' | 'Relational' | 'Creative / Spiritual';

export interface EnergyDomain {
  name: EnergyDomainName;
  icon: string;          // Ionicons name
  state: string;         // 2–4 word state
  why: string;           // astrological reason (specific, not generic)
  feeling: string;       // how it may feel
  suggestion: string;    // practical micro-action for this domain today
}

export interface EnergyGuidance {
  leanInto: string;
  leanIntoContext: string;        // why this matters today
  moveGentlyAround: string;
  moveGentlyContext: string;      // what makes this tricky right now
  bestUseOfEnergy: string;
  bestUseContext: string;         // how to actually do this
  ritual: string;                 // a specific grounding micro-action
}

export interface MoonPhaseReading {
  phase: string;
  emoji: string;
  personalMeaning: string;
}

export interface EnergySnapshot {
  date: string;
  tone: string;                    // 1–2 word energy tone
  intensity: EnergyIntensity;
  primaryDriver: string;           // "Moon in Pisces activating your 4th house"
  quickMeaning: string;            // 1 sentence

  chakras: ChakraReading[];        // all 7
  dominantChakra: ChakraReading;   // the single most active

  domains: EnergyDomain[];         // all 5
  freeDomainIndices: [number, number]; // which 2 are free today (rotating)

  guidance: EnergyGuidance;
  freeGuidanceLine: string;        // single line for free users

  moonPhase: MoonPhaseReading;
}

// ── Helpers ──────────────────────────────────────────────────

function signName(s: unknown): string {
  if (!s) return '';
  if (typeof s === 'string') return s;
  const obj = s as { name?: string };
  return obj?.name ?? '';
}

function signElement(s: unknown): string {
  if (!s) return '';
  if (typeof s === 'string') {
    return SIGN_ELEMENTS[s] ?? '';
  }
  const obj = s as { element?: string; name?: string };
  return obj?.element ?? SIGN_ELEMENTS[obj?.name ?? ''] ?? '';
}

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
  Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
  Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water',
};

const ZODIAC_SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function signFromLongitude(absDeg: number): string {
  const idx = Math.floor(((absDeg % 360) + 360) % 360 / 30);
  return ZODIAC_SIGN_NAMES[idx] ?? 'Aries';
}

/** Determine which natal house a transiting longitude falls in. */
function houseForLongitude(absDeg: number, cuspDegrees: number[]): number | null {
  if (!Array.isArray(cuspDegrees) || cuspDegrees.length !== 12) return null;
  const lon = ((absDeg % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = ((cuspDegrees[i] % 360) + 360) % 360;
    const end = ((cuspDegrees[(i + 1) % 12] % 360) + 360) % 360;
    if (start <= end) {
      if (lon >= start && lon < end) return i + 1;
    } else {
      if (lon >= start || lon < end) return i + 1;
    }
  }
  return null;
}

function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

// ── Tone Mapping ─────────────────────────────────────────────

const MOON_TONES: Record<string, { tone: string; intensity: EnergyIntensity }> = {
  Aries:       { tone: 'Energy in Motion',      intensity: 'High' },
  Taurus:      { tone: 'Grounded',               intensity: 'Low' },
  Gemini:      { tone: 'Active',                 intensity: 'Moderate' },
  Cancer:      { tone: 'Sensitive',               intensity: 'Moderate' },
  Leo:         { tone: 'Expressive',              intensity: 'High' },
  Virgo:       { tone: 'Focused',                 intensity: 'Moderate' },
  Libra:       { tone: 'Flowing',                 intensity: 'Low' },
  Scorpio:     { tone: 'Inward',                  intensity: 'High' },
  Sagittarius: { tone: 'Seeking Movement',        intensity: 'High' },
  Capricorn:   { tone: 'Quiet',                   intensity: 'Moderate' },
  Aquarius:    { tone: 'Observing',               intensity: 'Moderate' },
  Pisces:      { tone: 'Open & Receiving',        intensity: 'Low' },
};

// ── Quick Meanings ───────────────────────────────────────────

const QUICK_MEANINGS: Record<string, string> = {
  Aries:       'Impulse energy is high; instincts lead before logic catches up.',
  Taurus:      'The body wants stillness and sensory comfort; slow decisions land better.',
  Gemini:      'Mental activity is elevated; ideas move fast but focus may scatter.',
  Cancer:      'Emotional sensitivity is higher; inner needs come forward.',
  Leo:         'Creative self-expression wants a stage; visibility feels magnetic.',
  Virgo:       'A desire to refine and improve surfaces; small corrections matter.',
  Libra:       'Relationship awareness sharpens; balance between self and other is the theme.',
  Scorpio:     'Emotional depth intensifies; honesty with yourself is the invitation.',
  Sagittarius: 'Your energy is seeking expansion; movement feels urgent but patience serves better.',
  Capricorn:   'Structure and responsibility feel stabilizing; do the next right thing.',
  Aquarius:    'Mental detachment offers perspective; innovation over repetition.',
  Pisces:      'Boundaries soften; intuition rises but overwhelm is possible without grounding.',
};

// ── Chakra System ────────────────────────────────────────────

const CHAKRA_DEFS = [
  { name: 'Root',        emoji: '🔴', color: '#E07A7A' },
  { name: 'Sacral',      emoji: '🟠', color: '#E0B07A' },
  { name: 'Solar Plexus', emoji: '🟡', color: '#E0D07A' },
  { name: 'Heart',       emoji: '🟢', color: '#6EBF8B' },
  { name: 'Throat',      emoji: '🔵', color: '#7AA8E0' },
  { name: 'Third Eye',   emoji: '🟣', color: '#9B7AE0' },
  { name: 'Crown',       emoji: '⚪', color: '#D0C8E8' },
];

// Map planet → primary chakra influence
const PLANET_CHAKRA: Record<string, number> = {
  Saturn: 0,   // Root
  Moon: 1,     // Sacral
  Mars: 2,     // Solar Plexus
  Sun: 2,      // Solar Plexus
  Venus: 3,    // Heart
  Mercury: 4,  // Throat
  Neptune: 5,  // Third Eye
  Jupiter: 5,  // Third Eye
  Uranus: 6,   // Crown
  Pluto: 0,    // Root (deep survival)
};

// Element → chakra activation bias
const ELEMENT_CHAKRA_BIAS: Record<string, number[]> = {
  Fire:  [2, 3],       // Solar Plexus, Heart
  Earth: [0, 1],       // Root, Sacral
  Air:   [4, 5],       // Throat, Third Eye
  Water: [1, 3, 5],    // Sacral, Heart, Third Eye
};

const CHAKRA_TRIGGERS: Record<string, Record<number, string>> = {
  Aries:       { 0: 'Moon activating survival instincts', 2: 'Moon fueling willpower and drive', 3: 'Heart wants bold expression' },
  Taurus:      { 0: 'Moon grounding through body', 1: 'Moon deepening comfort needs', 3: 'Heart craves sensory warmth' },
  Gemini:      { 4: 'Moon activating voice and ideas', 5: 'Moon sharpening perception', 2: 'Mental energy overriding gut instinct' },
  Cancer:      { 1: 'Moon amplifying emotional sensitivity', 3: 'Heart carrying old feelings', 0: 'Root seeking safety and home' },
  Leo:         { 2: 'Moon boosting self-confidence', 3: 'Heart wants to be witnessed', 4: 'Voice wants creative expression' },
  Virgo:       { 2: 'Moon refining self-discipline', 4: 'Throat filtering words carefully', 0: 'Root organizing for security' },
  Libra:       { 3: 'Heart balancing between self and other', 4: 'Throat seeking diplomatic expression', 5: 'Third eye weighing perspectives' },
  Scorpio:     { 1: 'Moon stirring deep emotional currents', 0: 'Root holding survival tension', 5: 'Third eye seeing beneath surfaces' },
  Sagittarius: { 5: 'Moon expanding vision and belief', 2: 'Solar plexus restless for action', 6: 'Crown reaching for meaning' },
  Capricorn:   { 0: 'Moon reinforcing structure and duty', 2: 'Solar plexus carrying responsibility', 4: 'Throat measured and cautious' },
  Aquarius:    { 6: 'Moon detaching for perspective', 5: 'Third eye innovating', 4: 'Throat expressing unconventional truth' },
  Pisces:      { 6: 'Moon dissolving boundaries', 5: 'Third eye receiving intuitive data', 1: 'Sacral absorbing ambient emotion' },
};

const CHAKRA_BODY_CUES: Record<number, Record<ChakraState, string>> = {
  0: {
    'Flowing':          'Legs feel steady, feet grounded, calm lower back.',
    'Sensitive':        'Tension in lower back, restless legs, clenching.',
    'Grounding Needed': 'Feeling unmoored, scattered, difficulty settling.',
    'Quiet':            'Neutral stability — neither activated nor stressed.',
  },
  1: {
    'Flowing':          'Hips feel open, creative impulse present, emotional ease.',
    'Sensitive':        'Gut feelings are louder, possible nausea or emotional waves.',
    'Grounding Needed': 'Emotional flooding, craving comfort food or touch.',
    'Quiet':            'Emotions are steady but not particularly active.',
  },
  2: {
    'Flowing':          'Confidence available, core feels energized, clear willpower.',
    'Sensitive':        'Stomach tension, urge to control, heightened reactivity.',
    'Grounding Needed': 'Self-doubt rising, energy scattered, difficulty deciding.',
    'Quiet':            'Motivation is low but calm — rest may be the message.',
  },
  3: {
    'Flowing':          'Chest feels open, compassion accessible, warmth in connection.',
    'Sensitive':        'Heart ache, longing, sensitivity to rejection or distance.',
    'Grounding Needed': 'Emotional walls going up, difficulty receiving care.',
    'Quiet':            'Heart is steady — neither wide open nor closed off.',
  },
  4: {
    'Flowing':          'Words come easily, truth feels accessible, clear communication.',
    'Sensitive':        'Jaw tension, urge to explain yourself, throat tightness.',
    'Grounding Needed': 'Difficulty expressing needs, swallowing words, avoidance.',
    'Quiet':            'Communication is relaxed — listening more than speaking.',
  },
  5: {
    'Flowing':          'Intuition is clear, insight arrives without effort.',
    'Sensitive':        'Headache behind eyes, overthinking, analysis paralysis.',
    'Grounding Needed': 'Mental fog, difficulty trusting perception, confusion.',
    'Quiet':            'Inner vision is resting — not much arriving unbidden.',
  },
  6: {
    'Flowing':          'Sense of connection to something larger, inner peace.',
    'Sensitive':        'Feeling existentially tender, questions about purpose.',
    'Grounding Needed': 'Dissociation, spacing out, difficulty being present.',
    'Quiet':            'Spiritual connection is background — stable, not urgent.',
  },
};

// ── Chakra Healing Suggestions ───────────────────────────────

const CHAKRA_HEALING: Record<number, Record<ChakraState, string>> = {
  0: {
    'Flowing':          'Walk barefoot if you can, or press your feet firmly into the ground for 30 seconds.',
    'Sensitive':        'Place both hands on your lower belly and breathe slowly into them for one minute.',
    'Grounding Needed': 'Stand against a wall with your back fully pressed to it. Feel the support behind you.',
    'Quiet':            'No action needed. Your root is stable — appreciate the steadiness.',
  },
  1: {
    'Flowing':          'Move your hips — stretch, dance, or simply sway. Let creative energy circulate.',
    'Sensitive':        'Place a warm hand below your navel. Acknowledge what you are feeling without naming it.',
    'Grounding Needed': 'Drink warm water slowly. Let your body register comfort before your mind takes over.',
    'Quiet':            'Gentle hip stretches or a warm bath can coax this center awake when you are ready.',
  },
  2: {
    'Flowing':          'Take one decisive action you have been postponing — even a small one counts.',
    'Sensitive':        'Unclench your jaw and soften your stomach muscles. Let go of the need to control.',
    'Grounding Needed': 'Write down three things you have already accomplished today, no matter how small.',
    'Quiet':            'Rest is its own strength. Do not force motivation — it will return.',
  },
  3: {
    'Flowing':          'Tell someone you appreciate them. Let your heart give what it already has.',
    'Sensitive':        'Place your hand on your chest and say: I do not have to earn tenderness.',
    'Grounding Needed': 'Write a short letter to yourself as if you were writing to someone you love.',
    'Quiet':            'Spend a few minutes in silence with your palm on your sternum. Just breathe.',
  },
  4: {
    'Flowing':          'Speak your truth to someone today — even a small honest statement counts.',
    'Sensitive':        'Hum for 30 seconds. The vibration loosens throat tension without forcing words.',
    'Grounding Needed': 'Write what you need to say before you say it. Let ink carry the first draft.',
    'Quiet':            'Listen more today. Your voice will come when it has something real to say.',
  },
  5: {
    'Flowing':          'Trust the first answer that arrives — before your mind starts editing it.',
    'Sensitive':        'Close your eyes for 60 seconds. Let images come and go without grasping.',
    'Grounding Needed': 'Step away from screens for 10 minutes. Let your perception recalibrate in quiet.',
    'Quiet':            'Read something that makes you think differently. Feed the third eye gently.',
  },
  6: {
    'Flowing':          'Sit in stillness for two minutes. You do not need to meditate — just be.',
    'Sensitive':        'Ask yourself: what question am I afraid to sit with? Then sit with it.',
    'Grounding Needed': 'Touch something physical — a textured surface, cold water, warm fabric. Come back to your body.',
    'Quiet':            'No spiritual homework today. Presence is enough.',
  },
};

// ── Chakra Affirmations ──────────────────────────────────────

const CHAKRA_AFFIRMATIONS: Record<number, Record<ChakraState, string>> = {
  0: {
    'Flowing':          'I am safe here. I have what I need.',
    'Sensitive':        'I can feel unsteady and still be held.',
    'Grounding Needed': 'I am allowed to take up space and stand still.',
    'Quiet':            'My foundation is quiet and strong.',
  },
  1: {
    'Flowing':          'I let pleasure and creativity move through me.',
    'Sensitive':        'My feelings are real, and they will pass.',
    'Grounding Needed': 'I do not need to fix what I feel — only witness it.',
    'Quiet':            'My emotional waters are still, and that is okay.',
  },
  2: {
    'Flowing':          'I trust my ability to act and choose.',
    'Sensitive':        'I release the need to control the outcome.',
    'Grounding Needed': 'I am enough, even when I am not producing.',
    'Quiet':            'Rest is not weakness. I will move again when I am ready.',
  },
  3: {
    'Flowing':          'My heart is open and I receive freely.',
    'Sensitive':        'I can feel deeply without losing myself.',
    'Grounding Needed': 'I deserve the same compassion I give to others.',
    'Quiet':            'Love is present even in the stillness.',
  },
  4: {
    'Flowing':          'My voice matters. I speak with clarity.',
    'Sensitive':        'I do not have to be perfect to be heard.',
    'Grounding Needed': 'I give myself permission to say what is true.',
    'Quiet':            'Silence is sometimes the most honest expression.',
  },
  5: {
    'Flowing':          'I trust what I see beyond the surface.',
    'Sensitive':        'I can observe without absorbing.',
    'Grounding Needed': 'Clarity will return. I do not have to force insight.',
    'Quiet':            'Not knowing is its own kind of wisdom.',
  },
  6: {
    'Flowing':          'I am connected to something larger than my story.',
    'Sensitive':        'My questions are sacred, even without answers.',
    'Grounding Needed': 'I come back to my body. I come back to now.',
    'Quiet':            'I am whole, even in ordinary moments.',
  },
};

// ── Element-Chakra Connections ────────────────────────────────

const ELEMENT_CHAKRA_CONNECTION: Record<string, Record<number, string>> = {
  Fire: {
    0: 'Fire can destabilize the root — ground through physical action, not avoidance.',
    1: 'Fire heats emotions quickly; passion may override patience.',
    2: 'Fire feeds solar plexus naturally — confidence and drive are amplified.',
    3: 'Fire in the heart brings bold love but can burn through gentleness.',
    4: 'Fire sharpens speech — words carry more force than usual.',
    5: 'Fire brightens intuition but can create impatient urgency around knowing.',
    6: 'Fire connects crown to action — spiritual insight wants to DO something.',
  },
  Earth: {
    0: 'Earth stabilizes the root — you feel more anchored and physically present.',
    1: 'Earth slows emotional processing — feelings arrive fully formed.',
    2: 'Earth steadies willpower but can make it rigid — flexibility is medicine.',
    3: 'Earth in the heart deepens loyalty but can resist vulnerability.',
    4: 'Earth makes words deliberate — say less, mean more.',
    5: 'Earth grounds intuition in the practical — trust what you can verify.',
    6: 'Earth connects spirit to the tangible — meaning through craft and labor.',
  },
  Air: {
    0: 'Air can unsettle the root — thoughts may create anxiety where there is none.',
    1: 'Air intellectualizes emotion — naming feelings helps more than analyzing them.',
    2: 'Air scatters willpower across many options — choose one and commit.',
    3: 'Air opens the heart through conversation — connection through understanding.',
    4: 'Air activates the throat naturally — communication flows freely.',
    5: 'Air feeds the third eye with data — be careful not to overthink insight.',
    6: 'Air connects crown to ideas — meaning arrives through perspective, not practice.',
  },
  Water: {
    0: 'Water softens the root — safety comes from feeling, not controlling.',
    1: 'Water amplifies the sacral — emotions are vivid and close to the surface.',
    2: 'Water can dissolve willpower — decisions may feel harder but deeper.',
    3: 'Water opens the heart wide — compassion flows but boundaries may thin.',
    4: 'Water softens the throat — what you feel may be hard to articulate.',
    5: 'Water deepens the third eye — intuition is strong but may feel overwhelming.',
    6: 'Water connects crown to the unseen — spiritual sensitivity is heightened.',
  },
};

// ── Domain Mapping ───────────────────────────────────────────

const DOMAIN_STATES: Record<string, Record<EnergyDomainName, { state: string; feeling: string; why: string; suggestion: string }>> = {
  Aries: {
    'Mental':              { state: 'Fast & Decisive',       feeling: 'Thoughts arrive as impulses — quick but not always thorough.', why: 'Aries Moon ignites the mental fire; Mars-ruled instinct overrides deliberation.', suggestion: 'Write your first impulse down, then wait 10 minutes before acting on it.' },
    'Emotional':           { state: 'Reactive',              feeling: 'Feelings flash and pass; anger may surface before sadness.', why: 'Cardinal fire activates emotional responses at speed; feelings become action before they become awareness.', suggestion: 'Name the feeling out loud before responding to it. Even three seconds of pause shifts the outcome.' },
    'Physical':            { state: 'Charged',               feeling: 'Body wants to move; stillness can feel frustrating.', why: 'Mars rules the muscles and adrenals; an Aries Moon charges the body with restless kinetic energy.', suggestion: 'Move for at least 10 minutes — a walk, stretch, or anything that lets the charge release safely.' },
    'Relational':          { state: 'Direct',                feeling: 'Patience for small talk is low; honesty feels urgent.', why: 'Aries Moon values authenticity over diplomacy; the desire to cut through pretense intensifies.', suggestion: 'Lead with honesty but check your tone. Directness lands better when it comes with warmth.' },
    'Creative / Spiritual': { state: 'Ignited',              feeling: 'Creative sparks need immediate action to survive.', why: 'Fire energy in the Moon creates short bursts of creative intensity — capture first, refine later.', suggestion: 'Start the thing. Do not plan it, do not outline it — just begin and let momentum carry it.' },
  },
  Taurus: {
    'Mental':              { state: 'Steady',                feeling: 'Thinking is deliberate; rushing decisions feels wrong.', why: 'Taurus Moon is exalted — the mind slows into a grounded, reliable rhythm that resists pressure.', suggestion: 'Trust the slower pace. Sleep on any decision that feels forced.' },
    'Emotional':           { state: 'Settled',               feeling: 'Emotions seek comfort and predictability.', why: 'Venus-ruled Moon craves emotional security; familiar routines become anchors.', suggestion: 'Wrap yourself in something comforting — a ritual, a texture, a familiar meal.' },
    'Physical':            { state: 'Grounded',              feeling: 'Body wants rest, nourishment, and sensory pleasure.', why: 'Earth Moon deepens body awareness; the physical senses become primary channels of information.', suggestion: 'Eat something nourishing and eat it slowly. Let your body receive instead of perform.' },
    'Relational':          { state: 'Warm but Cautious',     feeling: 'Trust builds slowly; loyalty runs deep when earned.', why: 'Fixed earth in the Moon creates strong attachment patterns — opening up requires safety first.', suggestion: 'Show up consistently for someone. Taurus love is demonstrated through presence, not grand gestures.' },
    'Creative / Spiritual': { state: 'Sensory',              feeling: 'Beauty, texture, and craft feel more alive than abstraction.', why: 'Venus-ruled Moon channels creativity through the physical — touch, sound, and material beauty.', suggestion: 'Work with your hands. Cook, arrange, draw, build — let the senses guide the process.' },
  },
  Gemini: {
    'Mental':              { state: 'Scattered & Quick',     feeling: 'Multiple thoughts compete; focusing requires effort.', why: 'Mercury-ruled Moon activates the nervous system; the mind splits attention across many channels.', suggestion: 'Use a single notepad to capture every thought, then pick just one to follow through on.' },
    'Emotional':           { state: 'Intellectualized',      feeling: 'You may think about feelings rather than feel them fully.', why: 'Air Moon processes emotion through language — understanding replaces experiencing.', suggestion: 'Say how you feel to someone without explaining why. Let the feeling stand on its own.' },
    'Physical':            { state: 'Restless',              feeling: 'Fidgeting, multitasking, or needing stimulation.', why: 'Mutable air agitates the nervous system; the body mirrors the mind\'s scattered energy.', suggestion: 'Walk while you think. Movement helps Gemini Moon energy integrate instead of scatter.' },
    'Relational':          { state: 'Talkative',             feeling: 'Connection through conversation; silence feels heavy.', why: 'Gemini Moon bonds through exchange — words ARE the connection, not a substitute for it.', suggestion: 'Have one real conversation instead of many surface ones. Depth satisfies more today.' },
    'Creative / Spiritual': { state: 'Curious',              feeling: 'Ideas flow easily but follow-through needs anchoring.', why: 'Mercury lights up creative ideation but lacks the fixed energy for completion.', suggestion: 'Capture five ideas and commit to exploring only one. Breadth is the gift; depth is the work.' },
  },
  Cancer: {
    'Mental':              { state: 'Reflective',            feeling: 'Mind drifts inward; memories surface unbidden.', why: 'Moon is domicile in Cancer — the mind turns toward the inner world, memory, and emotional processing.', suggestion: 'Journal for five minutes. Let the pen follow wherever your mind already wants to go.' },
    'Emotional':           { state: 'Open & Porous',         feeling: 'You may feel things more quickly today.', why: 'The Moon in its home sign amplifies emotional receptivity — everything registers more deeply.', suggestion: 'Check: is this feeling yours? Cancer Moon absorbs. Name what belongs to you and release the rest.' },
    'Physical':            { state: 'Sensitive',             feeling: 'Body absorbs atmosphere; comfort is medicine.', why: 'Water Moon heightens somatic sensitivity — the body feels environments before the mind processes them.', suggestion: 'Create physical comfort. Soft lighting, warm drinks, clean space — your body is listening.' },
    'Relational':          { state: 'Nurturing',             feeling: 'Need for closeness rises; rejection stings more.', why: 'Cancer Moon\'s cardinal water initiates emotional bonding — the desire to care and be cared for deepens.', suggestion: 'Reach out to someone you trust. You do not have to explain — just connect.' },
    'Creative / Spiritual': { state: 'Intuitive',            feeling: 'Inner knowing speaks louder than logic.', why: 'Moon in domicile opens direct access to the subconscious — creativity arrives through feeling, not thinking.', suggestion: 'Follow an intuitive impulse without analyzing it first. Let art come from the body.' },
  },
  Leo: {
    'Mental':              { state: 'Confident',             feeling: 'Thinking is bold; self-expression feels clearer.', why: 'Sun-ruled Moon lights up self-concept; the mind organizes around identity and creative output.', suggestion: 'Share an idea publicly — even a small one. Leo Moon clarity deserves an audience.' },
    'Emotional':           { state: 'Warm & Visible',        feeling: 'Emotions want to be seen and acknowledged.', why: 'Fixed fire in the Moon creates strong emotional needs around recognition and being witnessed.', suggestion: 'Tell someone how you feel without minimizing it. Leo Moon heals when feelings are honored.' },
    'Physical':            { state: 'Vital',                 feeling: 'Energy is available; body wants to move and be present.', why: 'Solar energy feeds the Moon\'s physical body — vitality, warmth, and presence are amplified.', suggestion: 'Do something that makes you feel alive in your body. Dance, stretch, stand in sunlight.' },
    'Relational':          { state: 'Generous',              feeling: 'Desire to give and be appreciated in return.', why: 'Leo Moon\'s generosity is real but comes with an honest need for reciprocity and recognition.', suggestion: 'Give freely, but also tell someone what you need. Generosity works both directions.' },
    'Creative / Spiritual': { state: 'Inspired',             feeling: 'Creative confidence is high; self-expression flows.', why: 'The Sun illuminates the Moon\'s creative instinct — the inner child wants to play and make.', suggestion: 'Create something purely for joy, not for output. Let the process be the point.' },
  },
  Virgo: {
    'Mental':              { state: 'Precise',               feeling: 'Mind seeks clarity and order; imprecision grates.', why: 'Mercury-ruled earth Moon organizes perception around usefulness; the mind wants to sort and correct.', suggestion: 'Channel precision into one task that actually matters. Let the rest be imperfect.' },
    'Emotional':           { state: 'Contained',             feeling: 'Feelings process through analysis; expression is measured.', why: 'Mutable earth Moon holds emotions close and examines them — feeling is filtered through understanding.', suggestion: 'Write what you feel before you analyze it. Give emotion a head start over logic.' },
    'Physical':            { state: 'Attentive',             feeling: 'Body awareness is sharp; small discomforts amplify.', why: 'Virgo Moon governs the body\'s nervous attention to detail — every sensation registers more clearly.', suggestion: 'Attend to the small thing that has been bothering you. Replace a pillow, stretch a tight muscle, tidy one shelf.' },
    'Relational':          { state: 'Helpful',               feeling: 'Love expressed through service and practical support.', why: 'Virgo Moon shows care through action — doing something useful IS the emotional expression.', suggestion: 'Do one practical thing for someone without being asked. It is how you say I care.' },
    'Creative / Spiritual': { state: 'Refined',              feeling: 'Craft over inspiration; editing feels more natural than drafting.', why: 'Mercury-earth Moon favors refinement — polishing what exists over generating what does not.', suggestion: 'Return to something unfinished and make it better. Editing is a creative act.' },
  },
  Libra: {
    'Mental':              { state: 'Balanced',              feeling: 'Seeing all sides makes decisions slower but fairer.', why: 'Venus-ruled air Moon weighs perspectives automatically — the mind seeks equilibrium before action.', suggestion: 'Set a decision deadline. Libra Moon can weigh forever — give yourself permission to choose imperfectly.' },
    'Emotional':           { state: 'Harmonizing',           feeling: 'Conflict avoidance rises; peace feels essential.', why: 'Cardinal air Moon initiates toward harmony — emotional discomfort with discord intensifies.', suggestion: 'Check if your peacemaking is genuine or if you are suppressing something that needs air.' },
    'Physical':            { state: 'Graceful',              feeling: 'Body wants beauty, comfort, and aesthetic pleasure.', why: 'Venus rules the body\'s desire for grace — physical environments affect mood more than usual.', suggestion: 'Beautify one small space around you. Light a candle, rearrange flowers, clear a surface.' },
    'Relational':          { state: 'Partnership-Focused',   feeling: 'Connection is central; being alone feels louder.', why: 'Libra Moon is the relationship Moon — self-understanding happens through mirrors, not isolation.', suggestion: 'Spend quality time with someone. If alone, write about a relationship that matters to you.' },
    'Creative / Spiritual': { state: 'Aesthetic',            feeling: 'Beauty and symmetry feel spiritually nourishing.', why: 'Venus-air Moon channels the sacred through beauty — art, design, and visual harmony become spiritual practice.', suggestion: 'Curate something beautiful. A playlist, a meal presentation, an outfit — let aesthetics be devotion.' },
  },
  Scorpio: {
    'Mental':              { state: 'Penetrating',           feeling: 'Mind goes deep; surface answers feel insufficient.', why: 'Scorpio Moon falls in detriment — the mind\'s intensity drives past comfort into hidden layers.', suggestion: 'Follow one thread all the way down. Do not settle for the first answer today.' },
    'Emotional':           { state: 'Intense',               feeling: 'Emotions are powerful, private, and hard to ignore.', why: 'Fixed water Moon concentrates emotional energy — feelings arrive with weight and demand acknowledgment.', suggestion: 'Write what you are feeling in raw, unfiltered language. Then decide what to do with it.' },
    'Physical':            { state: 'Tense',                 feeling: 'Body holds emotional charge; release is needed.', why: 'Scorpio Moon stores emotional energy in the body — tension accumulates where feelings go unspoken.', suggestion: 'Move your body to release held tension. Shaking, stretching, or deep breathing all help.' },
    'Relational':          { state: 'Guarded',               feeling: 'Trust is selective; emotional honesty feels essential.', why: 'Fixed water Moon protects emotional depths — vulnerability is only offered where safety is proven.', suggestion: 'Choose one person and share something real. Trust is built in small acts of honesty, not grand reveals.' },
    'Creative / Spiritual': { state: 'Transformative',       feeling: 'Art and insight emerge from what you let yourself feel.', why: 'Scorpio Moon transforms pain into meaning — creative power lives in what most people avoid.', suggestion: 'Create from the place that feels uncomfortable. The most honest art lives at the edge.' },
  },
  Sagittarius: {
    'Mental':              { state: 'Expansive',             feeling: 'Thinking broadens; limitation feels stifling.', why: 'Jupiter-ruled fire Moon expands mental horizons — the mind wants big-picture meaning, not small details.', suggestion: 'Zoom out on a problem you have been stuck in. Ask: what is the larger pattern here?' },
    'Emotional':           { state: 'Optimistic',            feeling: 'Emotions seek meaning; reframing comes naturally.', why: 'Mutable fire Moon processes emotion through philosophy — feelings become stories with purpose.', suggestion: 'Let optimism fuel you, but check if you are reframing too quickly. Some feelings need to be felt first.' },
    'Physical':            { state: 'Restless',              feeling: 'Body wants movement, space, and fresh air.', why: 'Jupiter expands the body\'s need for freedom — physical confinement creates emotional claustrophobia.', suggestion: 'Get outside. Even five minutes of fresh air and open sky resets Sagittarius Moon energy.' },
    'Relational':          { state: 'Freedom-Seeking',       feeling: 'Connection thrives through shared adventure, not obligation.', why: 'Sagittarius Moon bonds through exploration — relationships that feel like duty become suffocating.', suggestion: 'Invite someone into something new. A new restaurant, a walk in an unfamiliar place, a new topic.' },
    'Creative / Spiritual': { state: 'Visionary',            feeling: 'Big ideas feel possible; details can wait.', why: 'Jupiter-fire Moon fuels vision and aspiration — the soul wants to reach for what has never been tried.', suggestion: 'Dream big on paper. Write the vision without editing for practicality — details come later.' },
  },
  Capricorn: {
    'Mental':              { state: 'Disciplined',           feeling: 'Thinking is strategic; long-term view dominates.', why: 'Saturn-ruled Moon in detriment creates a mind that prioritizes structure and consequence over spontaneity.', suggestion: 'Make a plan for one thing that has been weighing on you. Structure is how you create ease.' },
    'Emotional':           { state: 'Reserved',              feeling: 'Emotions stay private; vulnerability feels risky.', why: 'Capricorn Moon holds feelings behind a wall of composure — emotional expression feels like exposure.', suggestion: 'Write down what you are feeling, even if you never share it. Acknowledgment does not require audience.' },
    'Physical':            { state: 'Enduring',              feeling: 'Body can push through but may be ignoring fatigue.', why: 'Saturn Moon creates physical endurance but suppresses signals of exhaustion — the body serves duty first.', suggestion: 'Rest before you think you need to. Capricorn Moon underestimates its own tiredness.' },
    'Relational':          { state: 'Responsible',           feeling: 'Relationships feel like commitments; lightness is elusive.', why: 'Saturn-ruled Moon approaches relationships through obligation — love expressed as reliability and duty.', suggestion: 'Do something playful with someone you care about. Not everything has to be serious to be meaningful.' },
    'Creative / Spiritual': { state: 'Purposeful',           feeling: 'Creativity serves a goal; art without function feels wasteful.', why: 'Saturn Moon needs creativity to justify itself — beauty must also be useful to feel worthwhile.', suggestion: 'Make something without a purpose. Let uselessness be the point, just this once.' },
  },
  Aquarius: {
    'Mental':              { state: 'Innovative',            feeling: 'Thinking is unconventional; new solutions surface.', why: 'Uranus and Saturn co-rule this Moon — the mind oscillates between radical innovation and structured logic.', suggestion: 'Approach a familiar problem from a completely new angle. Ask: what would I try if nothing was at stake?' },
    'Emotional':           { state: 'Detached',              feeling: 'Emotions are observed more than felt; objectivity rises.', why: 'Air Moon in fixed mode creates emotional distance — feelings are analyzed from above, not entered.', suggestion: 'Put your hand on your heart and ask: what am I actually feeling right now? Let the body answer, not the mind.' },
    'Physical':            { state: 'Electric',              feeling: 'Nervous system is alert; overstimulation is possible.', why: 'Uranus activates the nervous system — the body runs on electrical sensitivity and can overload.', suggestion: 'Limit sensory input for 20 minutes. Quiet, dim light, no screens — let the nervous system recalibrate.' },
    'Relational':          { state: 'Independent',           feeling: 'Need for space without losing connection.', why: 'Aquarius Moon values autonomy within belonging — closeness without freedom creates anxiety.', suggestion: 'Take space if you need it, but tell the person why. Disappearing creates the disconnection you are trying to avoid.' },
    'Creative / Spiritual': { state: 'Experimental',         feeling: 'Rules feel breakable; originality is the path.', why: 'Uranus Moon channels creativity through disruption — the muse lives outside convention.', suggestion: 'Break a rule in your creative process. Use the wrong tool, the wrong format, the wrong approach.' },
  },
  Pisces: {
    'Mental':              { state: 'Diffuse',               feeling: 'Thoughts drift; linear logic feels harder to sustain.', why: 'Neptune-ruled Moon dissolves mental boundaries — the mind receives more than it organizes.', suggestion: 'Do not fight the drift. Let your mind wander for 10 minutes, then write down what surfaced.' },
    'Emotional':           { state: 'Deeply Receptive',      feeling: 'Absorbing others\' feelings without realizing it.', why: 'Mutable water Moon has the thinnest emotional boundaries in the zodiac — everything gets in.', suggestion: 'Ask yourself: is this feeling mine? If not, visualize handing it back. Empathy does not require absorption.' },
    'Physical':            { state: 'Fatigued',              feeling: 'Body may feel heavy or unusually tired.', why: 'Neptune Moon dissolves physical vitality — the body prioritizes dream-state and recovery over action.', suggestion: 'Honor the tiredness instead of pushing through. A 20-minute rest now prevents a crash later.' },
    'Relational':          { state: 'Compassionate',         feeling: 'Empathy is heightened; boundaries may thin.', why: 'Pisces Moon merges with others emotionally — the line between your feelings and theirs blurs.', suggestion: 'Be generous with compassion but honest about your limits. You cannot pour from an empty vessel.' },
    'Creative / Spiritual': { state: 'Channeling',           feeling: 'Art, music, and spiritual insight arrive without effort.', why: 'Neptune Moon opens the channel between conscious and subconscious — creativity flows through you, not from you.', suggestion: 'Create without planning. Put on music, pick up a pen, open a blank page — let something arrive.' },
  },
};

// ── Moon Phase ───────────────────────────────────────────────

function getMoonPhase(date: Date = new Date()): { phase: string; emoji: string } {
  const info = getMoonPhaseInfo(date);
  return { phase: info.name, emoji: info.emoji };
}

const MOON_PHASE_MEANINGS: Record<string, string> = {
  'New Moon':        'New Moons often affect your self-image more than goals. This is a time for internal resets, not public launches.',
  'Waxing Crescent': 'Intention is building quietly. What you plant now emotionally will shape the weeks ahead.',
  'First Quarter':   'Tension between comfort and action surfaces. Decisions made now carry momentum.',
  'Waxing Gibbous':  'Refinement energy. Adjust rather than restart. Trust what you have already set in motion.',
  'Full Moon':       'Emotions peak and things become visible. What has been building will surface — let it.',
  'Waning Gibbous':  'Gratitude and perspective. What did this cycle teach you? Let insight settle before acting.',
  'Last Quarter':    'Release what no longer fits. Letting go is not failure — it is creating space.',
  'Waning Crescent': 'Rest and reflection. Your energy is preparing for the next cycle. Honor the pause.',
};

// ── Guidance Mapping ─────────────────────────────────────────

const GUIDANCE: Record<string, EnergyGuidance> = {
  Aries: {
    leanInto: 'Decisive action, physical movement, and honest expression.',
    leanIntoContext: 'Your energy is designed for direct engagement today. The impulse to move is not restlessness — it is your system clearing the path to clarity.',
    moveGentlyAround: 'Impulsive reactions and confrontation as emotional regulation.',
    moveGentlyContext: 'Speed is a strength, but today the gap between feeling and acting may be dangerously small. Pause is not weakness — it is aim.',
    bestUseOfEnergy: 'One bold move you have been postponing.',
    bestUseContext: 'Pick the thing that has been sitting in your chest. Send the message, make the call, start the project. Aries energy is wasted on hesitation.',
    ritual: 'Stand up. Shake your hands out for 30 seconds. Take three deep breaths. Then act on one thing.',
  },
  Taurus: {
    leanInto: 'Sensory comfort, slow decisions, and grounding routines.',
    leanIntoContext: 'Your body is your compass today. What feels physically good is also what is emotionally correct. Trust the slower rhythm.',
    moveGentlyAround: 'Stubbornness disguised as patience.',
    moveGentlyContext: 'There is a difference between waiting for the right time and refusing to move. Notice if comfort has become avoidance.',
    bestUseOfEnergy: 'Building something tangible and lasting.',
    bestUseContext: 'Your hands want to work. Cook, organize, build, plant — anything that leaves a physical result at the end.',
    ritual: 'Hold something warm in your hands for one minute — a mug, a stone, your own wrist. Feel the temperature. Be here.',
  },
  Gemini: {
    leanInto: 'Conversation, learning, and mental flexibility.',
    leanIntoContext: 'Your mind is your greatest tool today. Ideas are arriving faster than usual — the skill is catching the right ones and letting the rest pass.',
    moveGentlyAround: 'Over-explaining and information overload.',
    moveGentlyContext: 'More input is not more clarity. At some point today, you will know enough — the risk is continuing to research instead of deciding.',
    bestUseOfEnergy: 'One meaningful exchange of ideas.',
    bestUseContext: 'Find someone who thinks differently from you and have a real conversation. Not to convince — to understand.',
    ritual: 'Write three sentences about what is on your mind. Not a journal entry — just three honest sentences. Then close the notebook.',
  },
  Cancer: {
    leanInto: 'Emotional honesty, slower pacing, and nurturing yourself.',
    leanIntoContext: 'Your emotional intelligence is heightened. What you feel today is accurate — the challenge is not dismissing it as too much.',
    moveGentlyAround: 'Absorbing others\' emotions and over-protecting.',
    moveGentlyContext: 'Care is your superpower, but today you may absorb pain that is not yours. Check before you carry it.',
    bestUseOfEnergy: 'One act of genuine self-care.',
    bestUseContext: 'Not self-care as performance — real care. The thing your body has been asking for that you keep postponing.',
    ritual: 'Place one hand on your heart, one on your belly. Breathe slowly for five rounds. Say: I am allowed to need things too.',
  },
  Leo: {
    leanInto: 'Creative expression, visibility, and generous warmth.',
    leanIntoContext: 'Something in you wants to be seen today — not for ego, but because your authentic self-expression genuinely helps others feel permission to be themselves.',
    moveGentlyAround: 'Seeking validation to feel worthy.',
    moveGentlyContext: 'The desire to be appreciated is human and real. But today, notice if you are performing for approval instead of expressing for truth.',
    bestUseOfEnergy: 'Sharing something you made or felt.',
    bestUseContext: 'Creative output wants an audience today. Share a thought, post a creation, tell someone what they mean to you.',
    ritual: 'Put your hand on your chest. Say: I do not need permission to shine. Then do one thing that feels like you.',
  },
  Virgo: {
    leanInto: 'Refining one system, practical self-care, and clarity.',
    leanIntoContext: 'Your eye for what needs fixing is exceptionally sharp. Use it wisely — channel precision into improvement, not criticism.',
    moveGentlyAround: 'Perfectionism and self-criticism loops.',
    moveGentlyContext: 'The voice telling you it is not good enough may feel like high standards, but it is actually anxiety wearing a productive mask.',
    bestUseOfEnergy: 'Fixing the one thing that has been nagging you.',
    bestUseContext: 'You know what it is. The drawer, the email, the habit, the conversation. Do it and feel the weight lift.',
    ritual: 'Clean one surface completely. Wipe it, clear it, make it empty. Let the outer order settle the inner noise.',
  },
  Libra: {
    leanInto: 'Beauty, partnership, and harmonizing environments.',
    leanIntoContext: 'Relational energy is your native language today. Connecting, creating beauty, and bringing balance are not distractions — they are your work.',
    moveGentlyAround: 'People-pleasing at the cost of truth.',
    moveGentlyContext: 'Harmony is a gift, but not when it requires silencing what you actually think. Today, notice where peace costs you honesty.',
    bestUseOfEnergy: 'One honest conversation.',
    bestUseContext: 'Say the kind and true thing. Not the comfortable thing. Libra energy at its best is diplomatic honesty, not comfortable silence.',
    ritual: 'Light a candle or put on music that feels beautiful. Let beauty regulate your nervous system for five minutes.',
  },
  Scorpio: {
    leanInto: 'Emotional depth, honesty with yourself, and release.',
    leanIntoContext: 'Your capacity for truth is at its peak. What you see today is accurate, even if it is uncomfortable. Do not look away.',
    moveGentlyAround: 'Power struggles and testing people silently.',
    moveGentlyContext: 'Intensity is a gift, but today it may manifest as control. Notice if you are testing someone instead of talking to them.',
    bestUseOfEnergy: 'Naming one truth you have been avoiding.',
    bestUseContext: 'Write it down or say it aloud. Not to anyone — just to yourself. Acknowledgment is the first act of transformation.',
    ritual: 'Write down one thing you have been avoiding. Read it once. Then tear the paper up. The naming is the point.',
  },
  Sagittarius: {
    leanInto: 'Perspective, exploration, and philosophical thinking.',
    leanIntoContext: 'Your mind wants altitude today. Step back from the details and ask what the bigger picture is trying to show you.',
    moveGentlyAround: 'Escapism disguised as freedom.',
    moveGentlyContext: 'There is a difference between expanding your horizons and running from what is right in front of you. Check which one you are doing.',
    bestUseOfEnergy: 'Broadening your view on one stuck situation.',
    bestUseContext: 'The situation has not changed, but your perspective can. What would this look like from five years in the future?',
    ritual: 'Go outside and look at the sky for two minutes. Let the vastness recalibrate your sense of scale.',
  },
  Capricorn: {
    leanInto: 'Structure, responsibility, and doing the next right thing.',
    leanIntoContext: 'Discipline is your friend today, not your taskmaster. The calm satisfaction of completing something meaningful is available to you.',
    moveGentlyAround: 'Overwork and equating productivity with worth.',
    moveGentlyContext: 'You are not your output. The drive to prove your value through work may be louder today — notice it, and choose when to stop.',
    bestUseOfEnergy: 'One meaningful step toward a long-term goal.',
    bestUseContext: 'Not five steps — one. The one that actually matters. Do it thoroughly and then let it be enough.',
    ritual: 'Write tomorrow\'s to-do list tonight. Three items, no more. Let structure create permission to rest.',
  },
  Aquarius: {
    leanInto: 'Innovation, objectivity, and community connection.',
    leanIntoContext: 'Your ability to see systems and patterns is heightened. Use this clarity to reimagine, not just analyze.',
    moveGentlyAround: 'Emotional detachment and intellectualizing feelings.',
    moveGentlyContext: 'Objectivity is a lens, not a lifestyle. Today you may observe emotions from such a distance that you forget to actually feel them.',
    bestUseOfEnergy: 'One unconventional approach to a familiar problem.',
    bestUseContext: 'The solution you have been overlooking is probably the weird one. Try it.',
    ritual: 'Put your phone in another room for 30 minutes. Let your mind think its own thoughts without input.',
  },
  Pisces: {
    leanInto: 'Intuition, compassion, and creative flow.',
    leanIntoContext: 'Your inner knowing is louder than usual. What arrives without effort today is more trustworthy than what you force through analysis.',
    moveGentlyAround: 'Boundary dissolution and absorbing external pain.',
    moveGentlyContext: 'Compassion without boundaries becomes self-sacrifice. You can hold space for others without disappearing into their experience.',
    bestUseOfEnergy: 'Listening to what your body already knows.',
    bestUseContext: 'Your body has been sending signals you have been overriding. Today, pause and actually listen.',
    ritual: 'Lie down for five minutes with your eyes closed. Do not try to meditate. Just let whatever comes, come.',
  },
};

const FREE_GUIDANCE_LINES: Record<string, string> = {
  Aries:       'Move your body before you make a decision.',
  Taurus:      'Slow down — your best choices arrive with patience.',
  Gemini:      'Name it out loud; clarity lives in conversation.',
  Cancer:      'Protect your softness; choose who gets access.',
  Leo:         'Let yourself be seen — dimming does not serve anyone.',
  Virgo:       'Fix the one small thing; let the rest wait.',
  Libra:       'Choose the honest thing over the comfortable thing.',
  Scorpio:     'Tell yourself the truth first.',
  Sagittarius: 'Expand your perspective before you react.',
  Capricorn:   'Do the next right thing — then let it be enough.',
  Aquarius:    'Step back to see clearly; then reconnect.',
  Pisces:      'Less input, more inner listening.',
};

// ── Main Engine ──────────────────────────────────────────────

export class EnergyEngine {
  /**
   * Generate the complete daily energy snapshot from a natal chart.
   */
  static generateSnapshot(chart: NatalChart, date: Date = new Date()): EnergySnapshot {
    const moonSign = this.getCurrentMoonSign(chart, date);
    const moonElement = signElement(moonSign) || 'Water';
    const moonHouse = this.getMoonHouse(chart, date);

    // 1. Energy Snapshot (hero)
    const toneData = MOON_TONES[moonSign] ?? { tone: 'Shifting', intensity: 'Moderate' as EnergyIntensity };
    const driver = `Moon in ${moonSign}${moonHouse ? ` activating your ${moonHouse}${this.ordinalSuffix(moonHouse)} house` : ''}`;
    const quickMeaning = QUICK_MEANINGS[moonSign] ?? 'Your energy is in flux — tune inward for clarity.';

    // 2. Chakras
    const chakras = this.buildChakras(chart, moonSign, moonElement);
    const dominantChakra = this.pickDominant(chakras, moonSign);

    // 3. Domains
    const domains = this.buildDomains(moonSign);
    const doy = dayOfYear(date);
    const freeDomainIndices: [number, number] = [doy % 5, (doy + 2) % 5];

    // 4. Guidance
    const guidance = GUIDANCE[moonSign] ?? GUIDANCE.Cancer;
    const freeGuidanceLine = FREE_GUIDANCE_LINES[moonSign] ?? 'Listen to your body today.';

    // 5. Moon phase
    const { phase, emoji } = getMoonPhase(date);
    const personalMeaning = MOON_PHASE_MEANINGS[phase] ?? 'Observe how this phase moves through you.';

    return {
      date: date.toISOString().slice(0, 10),
      tone: toneData.tone,
      intensity: toneData.intensity,
      primaryDriver: driver,
      quickMeaning,

      chakras,
      dominantChakra,

      domains,
      freeDomainIndices,

      guidance,
      freeGuidanceLine,

      moonPhase: { phase, emoji, personalMeaning },
    };
  }

  // ── Internals ────────────────────────────────────────────

  /**
   * Get the REAL transiting Moon sign for the given date using the ephemeris.
   * Falls back to natal Moon sign only if the transit calculation fails.
   */
  private static getCurrentMoonSign(chart: NatalChart, date: Date): string {
    try {
      const lat = chart.birthData?.latitude ?? 0;
      const lon = chart.birthData?.longitude ?? 0;
      const transits = getTransitingLongitudes(date, lat, lon);
      const moonLongitude = transits['Moon'];
      if (typeof moonLongitude === 'number' && Number.isFinite(moonLongitude)) {
        return signFromLongitude(moonLongitude);
      }
    } catch (_e) {
      // Transit calculation failed — fall back to natal Moon
    }
    return signName(chart.moonSign) || signName(chart.moon?.sign) || 'Cancer';
  }

  /**
   * Get the transiting Moon's absolute longitude for house placement.
   */
  private static getTransitMoonLongitude(chart: NatalChart, date: Date): number | null {
    try {
      const lat = chart.birthData?.latitude ?? 0;
      const lon = chart.birthData?.longitude ?? 0;
      const transits = getTransitingLongitudes(date, lat, lon);
      const moonLongitude = transits['Moon'];
      if (typeof moonLongitude === 'number' && Number.isFinite(moonLongitude)) {
        return moonLongitude;
      }
    } catch (_e) {
      // fall through
    }
    return null;
  }

  /**
   * Determine which natal house the transiting Moon is activating.
   * Uses natal house cusps to find which house the transit Moon falls in.
   * Falls back to natal Moon house if transit data unavailable.
   */
  private static getMoonHouse(chart: NatalChart, date: Date): number | undefined {
    // Try transit Moon in natal houses
    const transitLon = this.getTransitMoonLongitude(chart, date);
    if (transitLon !== null) {
      // Use SimpleHouseCusp absolute degrees if available
      if (chart.houses && chart.houses.length === 12) {
        const cusps = chart.houses.map(h => h.absoluteDegree);
        const house = houseForLongitude(transitLon, cusps);
        if (house) return house;
      }
      // Fallback to legacy houseCusps
      if (chart.houseCusps && chart.houseCusps.length === 12) {
        const cusps = chart.houseCusps.map((h: any) => h.longitude ?? h.absoluteDegree ?? 0);
        const house = houseForLongitude(transitLon, cusps);
        if (house) return house;
      }
    }
    // Final fallback: natal Moon's house
    return chart.moon?.house;
  }

  private static ordinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return (s[(v - 20) % 10] || s[v] || s[0]);
  }

  private static buildChakras(
    chart: NatalChart,
    moonSign: string,
    moonElement: string,
  ): ChakraReading[] {
    const triggers = CHAKRA_TRIGGERS[moonSign] ?? {};
    const elementBias = ELEMENT_CHAKRA_BIAS[moonElement] ?? [];

    return CHAKRA_DEFS.map((def, idx) => {
      // Determine state
      let state: ChakraState = 'Quiet';
      const trigger = triggers[idx];

      if (trigger) {
        state = 'Sensitive'; // direct activation from moon sign
      } else if (elementBias.includes(idx)) {
        state = 'Flowing';   // element alignment
      }

      // Check if natal planets activate this chakra
      const natalActivators = this.getNatalChakraActivators(chart, idx);
      if (natalActivators.length > 0 && trigger) {
        state = 'Grounding Needed'; // double activation → overstimulation
      }

      const triggerText = trigger || this.getDefaultTrigger(idx, moonSign);
      const bodyCue = CHAKRA_BODY_CUES[idx]?.[state] ?? 'Notice sensations in this area.';
      const healingSuggestion = CHAKRA_HEALING[idx]?.[state] ?? 'Bring gentle awareness to this area of your body.';
      const affirmation = CHAKRA_AFFIRMATIONS[idx]?.[state] ?? 'I am present with what is.';
      const elementConnection = ELEMENT_CHAKRA_CONNECTION[moonElement]?.[idx] ?? `${moonElement} energy is present in your ${def.name} center.`;

      return {
        name: def.name,
        emoji: def.emoji,
        state,
        trigger: triggerText,
        bodyCue,
        healingSuggestion,
        elementConnection,
        affirmation,
        color: def.color,
      };
    });
  }

  private static getNatalChakraActivators(chart: NatalChart, chakraIdx: number): string[] {
    const result: string[] = [];
    for (const [planet, cIdx] of Object.entries(PLANET_CHAKRA)) {
      if (cIdx === chakraIdx) {
        // Check if this planet exists in chart
        const key = planet.toLowerCase() as keyof NatalChart;
        if ((chart as any)[key]) result.push(planet);
      }
    }
    return result;
  }

  private static getDefaultTrigger(chakraIdx: number, moonSign: string): string {
    const names = ['Root', 'Sacral', 'Solar Plexus', 'Heart', 'Throat', 'Third Eye', 'Crown'];
    return `${names[chakraIdx]} influenced by ambient ${moonSign} Moon energy`;
  }

  private static pickDominant(chakras: ChakraReading[], moonSign: string): ChakraReading {
    // Priority: Grounding Needed > Sensitive > Flowing > Quiet
    const priority: ChakraState[] = ['Grounding Needed', 'Sensitive', 'Flowing', 'Quiet'];
    for (const p of priority) {
      const found = chakras.find(c => c.state === p);
      if (found) return found;
    }
    return chakras[0];
  }

  private static buildDomains(moonSign: string): EnergyDomain[] {
    const domainNames: EnergyDomainName[] = ['Mental', 'Emotional', 'Physical', 'Relational', 'Creative / Spiritual'];
    const icons = ['bulb-outline', 'water-outline', 'body-outline', 'people-outline', 'color-palette-outline'];
    const states = DOMAIN_STATES[moonSign] ?? DOMAIN_STATES.Cancer;

    return domainNames.map((name, idx) => ({
      name,
      icon: icons[idx],
      state: states[name].state,
      why: states[name].why,
      feeling: states[name].feeling,
      suggestion: states[name].suggestion,
    }));
  }
}
