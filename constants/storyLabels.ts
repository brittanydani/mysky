/**
 * Story display labels — maps astrological terms to symbolic psychology language
 * used throughout the My Story screen.
 *
 * The natal chart screen retains standard astrology terminology. This file
 * applies only to the Story / Themes view via `applyStoryLabels`.
 *
 * Engine stays astrology. Interface becomes symbolic psychology.
 */

// ── Houses → Life Domains ─────────────────────────────────────────────────────

export const HOUSE_THEMES: Record<number, string> = {
  1: 'Identity domain',
  2: 'Resource domain',
  3: 'Communication domain',
  4: 'Inner foundation',
  5: 'Creative expression',
  6: 'Daily structure',
  7: 'Relational domain',
  8: 'Shadow domain',
  9: 'Philosophical domain',
  10: 'Public expression',
  11: 'Collective domain',
  12: 'Unconscious domain',
};

// Ordered list of ordinal strings as they appear in generated story text.
// Includes both correct ordinals (1st/2nd/3rd) AND the malformed "1th/2th/3th"
// produced by the signLabel generator's `${house}th House` template for houses 1–3.
const HOUSE_ORDINALS: [string, number][] = [
  ['1st', 1], ['1th', 1],
  ['2nd', 2], ['2th', 2],
  ['3rd', 3], ['3th', 3],
  ['4th', 4],
  ['5th', 5],
  ['6th', 6],
  ['7th', 7],
  ['8th', 8],
  ['9th', 9],
  ['10th', 10],
  ['11th', 11],
  ['12th', 12],
];

// ── Planets / Luminaries → Archetypal Forces ─────────────────────────────────

const PLANET_LABELS: Record<string, string> = {
  Sun: 'Core vitality',
  Moon: 'Emotional body',
  Mars: 'Activating force',
  Venus: 'Relational force',
  Saturn: 'Structural force',
  Jupiter: 'Expansion force',
  Mercury: 'Cognitive influence',
  Pluto: 'Transformational force',
  Neptune: 'Diffuse influence',
  Uranus: 'Disruptive force',
  Chiron: 'Healing archetype',
  Ascendant: 'Outward expression',
  Rising: 'Outward expression',
};

// ── Zodiac Signs → Quality Archetypes ────────────────────────────────────────

const SIGN_LABELS: Record<string, string> = {
  Aries: 'Initiation',
  Taurus: 'Stability',
  Gemini: 'Curiosity',
  Cancer: 'Attunement',
  Leo: 'Radiance',
  Virgo: 'Discernment',
  Libra: 'Harmony',
  Scorpio: 'Depth',
  Sagittarius: 'Vision',
  Capricorn: 'Mastery',
  Aquarius: 'Originality',
  Pisces: 'Transcendence',
};

// ── Aspects / Timing / Compound phrases ──────────────────────────────────────

// IMPORTANT: Runs BEFORE single-word planet/sign replacement in applyStoryLabels.
// Ordered longest-first so multi-word phrases are caught before their fragments.
const PHRASE_REPLACEMENTS: [RegExp, string][] = [
  // Moon-compound phrases (must precede Moon → Emotional body single-word replacement)
  [/\bMoon phase\b/gi, 'Emotional cycle'],
  [/\bFull Moon\b/g, 'Heightened awareness phase'],
  [/\bfull moon\b/g, 'heightened awareness phase'],
  [/\bNew Moon\b/g, 'Initiation phase'],
  [/\bnew moon\b/g, 'initiation phase'],
  [/\bWaxing [Mm]oon\b/g, 'Building phase'],
  [/\bWaning [Mm]oon\b/g, 'Integration phase'],

  // Node / sign compound phrases (must precede single-word planet/sign replacement)
  [/\bNorth Node's\b/gi, "Growth direction's"],
  [/\bNorth Node\b/gi, 'Growth direction'],
  [/\bSouth Node's\b/gi, "Past foundation's"],
  [/\bSouth Node\b/gi, 'Past foundation'],
  [/\bSun sign\b/gi, 'Core vitality'],
  [/\bMoon sign\b/gi, 'Emotional nature'],
  [/\bRising sign\b/gi, 'Outward expression'],

  // Chiron compound (before Chiron standalone)
  [/\bChiron return\b/gi, 'Deep repair cycle'],
  [/\bWounded [Hh]ealer\b/gi, 'Core sensitivity'],
  [/\bwounded healer\b/gi, 'core sensitivity'],

  // Chart / birth terminology
  [/\bNatal chart\b/g, 'Core blueprint'],
  [/\bnatal chart\b/g, 'core blueprint'],
  [/\bBirth chart\b/g, 'Personal framework'],
  [/\bbirth chart\b/g, 'personal framework'],
  [/\byour chart\b/gi, 'your personal framework'],
  [/\bthe chart\b/gi, 'the personal framework'],
  [/\bChart ruler\b/gi, 'Governing influence'],
  [/\bChart pattern\b/gi, 'Structural pattern'],
  [/\bAspect pattern\b/gi, 'Interaction pattern'],
  [/\bStellium\b/gi, 'Concentrated emphasis'],
  [/\bCosmic message\b/gi, 'Timing reflection'],
  [/\bDaily horoscope\b/gi, 'Daily context'],
  [/\bTransit activation\b/gi, 'Active phase'],

  // Aspects and timing (single-word)
  [/\bRetrograde\b/g, 'Review cycle'],
  [/\bretrograde\b/g, 'review cycle'],
  [/\bConjunction\b/g, 'Alignment'],
  [/\bconjunction\b/g, 'alignment'],
  [/\bOpposition\b/g, 'Tension dynamic'],
  [/\bopposition\b/g, 'tension dynamic'],
  [/\bSquare\b/g, 'Friction pattern'],
  [/\bsquare\b/g, 'friction pattern'],
  [/\bTrine\b/g, 'Supportive alignment'],
  [/\btrine\b/g, 'supportive alignment'],
  [/\bSextile\b/g, 'Cooperative influence'],
  [/\bsextile\b/g, 'cooperative influence'],
  [/\bTransit\b/g, 'Current timing'],
  [/\btransit\b/g, 'current timing'],
  [/\bHoroscope\b/g, 'Reflection'],
  [/\bhoroscope\b/g, 'reflection'],
  [/\bPrediction\b/g, 'Insight'],
  [/\bprediction\b/g, 'insight'],
  [/\bDestiny\b/g, 'Direction'],
  [/\bdestiny\b/g, 'direction'],
  [/\bFate\b/g, 'Pattern'],
  [/\bfate\b/g, 'pattern'],
];

// ── Energy-screen extras ──────────────────────────────────────────────────────

// Matches original zodiac sign names in "[Sign] Moon" constructs (energy pre-pass)
const ZODIAC_SIGN_PATTERN =
  'Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces';

// Matches force labels (after PLANET_LABELS substitution) for energy Moon constructs
const FORCE_ALT =
  'Activating force|Relational force|Structural force|Expansion force|' +
  'Cognitive influence|Transformational force|Diffuse influence|Disruptive force|Healing archetype|' +
  'Core vitality|Emotional body|Outward expression|Growth direction';

// ── Main transform ────────────────────────────────────────────────────────────

/**
 * Transforms astrological terminology in generated story text into the MySky
 * symbolic psychology language. Apply to all user-facing story fields
 * (content, title, reflection, affirmation).
 *
 * This is purely a display transform — all underlying chart calculations are
 * unaffected.
 */
export function applyStoryLabels(text: string): string {
  if (!text) return text;
  let result = text;

  // 1. Replace "Nth House" / "Nth house" with life domain labels
  for (const [ord, num] of HOUSE_ORDINALS) {
    const label = HOUSE_THEMES[num];
    result = result.replace(new RegExp(`\\b${ord}\\s+[Hh]ouse\\b`, 'g'), label);
  }

  // 2. Replace compound phrases and banned terms BEFORE single-word planet/sign replacement
  //    (handles Moon-compound phrases, North Node, chart terminology, aspects)
  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  // 3. Replace planet and luminary names with archetypal force labels (case-insensitive)
  for (const [planet, label] of Object.entries(PLANET_LABELS)) {
    result = result.replace(new RegExp(`\\b${planet}\\b`, 'gi'), label);
  }

  // 4. Replace zodiac sign names with quality archetypes (case-insensitive)
  for (const [sign, label] of Object.entries(SIGN_LABELS)) {
    result = result.replace(new RegExp(`\\b${sign}\\b`, 'gi'), label);
  }

  // 5. Rename section sub-headers embedded in chapter content (case-insensitive)
  result = result.replace(/\bHouse Insight\b/gi, 'Life Domain Insight');

  return result;
}

/**
 * Extended transform for the Energy screen. Builds on `applyStoryLabels` and
 * additionally cleans the astrological `why` text produced by the energy
 * engine (zodiac-Moon constructs, modality/technical terms, etc.).
 */
export function applyEnergyLabels(text: string): string {
  if (!text) return text;
  let result = text;

  // ── Pre-pass: handle patterns that use original planet/sign names ─────────
  // MUST run before applyStoryLabels replaces those terms.

  // [Sign] Moon's possessive  →  "Today's active quality"
  result = result.replace(
    new RegExp(`\\b(${ZODIAC_SIGN_PATTERN})\\s+Moon's\\b`, 'gi'),
    "Today's active quality",
  );
  // [Sign] Moon  →  "the active quality"
  result = result.replace(
    new RegExp(`\\b(${ZODIAC_SIGN_PATTERN})\\s+Moon\\b`, 'gi'),
    'the active quality',
  );
  // Sun-ruled Moon  →  "the active quality"
  result = result.replace(/\bSun[- ]ruled\s+Moon\b/gi, 'the active quality');
  // Sun-ruled (without Moon)  →  "Vital"
  result = result.replace(/\bSun[- ]ruled\b/gi, 'Vital');
  // Solar energy  →  "Vital energy"
  result = result.replace(/\bSolar energy\b/gi, 'Vital energy');
  // [Modality] [element] Moon
  result = result.replace(
    /\b(Cardinal|Fixed|Mutable)\s+(fire|earth|air|water)\s+Moon\b/gi,
    'the active quality',
  );
  // [Element] Moon
  result = result.replace(/\b(Fire|Earth|Air|Water)\s+Moon\b/gi, 'the active quality');
  // Moon in domicile / its home sign
  result = result.replace(
    /\b[Mm]oon\s+in\s+(?:its\s+home\s+sign|domicile)\b/gi,
    'the active quality',
  );
  result = result.replace(/\bin\s+its\s+home\s+sign\b/gi, 'in alignment');
  // Moon is domicile
  result = result.replace(
    /\b[Mm]oon\s+is\s+domicile\b/gi,
    'the active quality is in alignment',
  );
  // Remaining bare Moon references (before applyStoryLabels replaces Moon → Emotional body)
  result = result.replace(/\bthis\s+Moon\b/gi, 'this quality');
  result = result.replace(/\bthe\s+Moon\b/gi, 'the active quality');

  // ── Main transforms ────────────────────────────────────────────────────────
  result = applyStoryLabels(result);

  // ── Post-pass: handle force-based Moon constructs (planet labels applied) ─

  // "[Force]-ruled [element?] Moon|Emotional body"
  result = result.replace(
    new RegExp(
      `\\b(${FORCE_ALT})[ -]ruled(?:\\s+(?:fire|earth|air|water))?\\s+(?:Moon|Emotional body)\\b`,
      'gi',
    ),
    'the active quality',
  );
  // "[Force]-[element] Moon|Emotional body"
  result = result.replace(
    new RegExp(`\\b(${FORCE_ALT})-(fire|earth|air|water)\\s+(?:Moon|Emotional body)\\b`, 'gi'),
    'the active quality',
  );
  // "[Force] Moon|Emotional body" standalone
  result = result.replace(
    new RegExp(`\\b(${FORCE_ALT})\\s+(?:Moon|Emotional body)\\b`, 'gi'),
    'the active quality',
  );
  // "[Force]-ruled" (remaining, not followed by Moon/Emotional body)
  result = result.replace(
    new RegExp(`\\b(${FORCE_ALT})[ -]ruled\\b`, 'gi'),
    (_match, label: string) => label,
  );

  // [Modality] [element] standalone (remaining after pre-pass)
  result = result.replace(/\b(Cardinal|Fixed|Mutable)\s+(fire|earth|air|water)\b/gi, (_m, _mod, element: string) => element);

  // "Emotional body" references (Moon that slipped through into applyStoryLabels)
  result = result.replace(/\bthis\s+Emotional body\b/gi, 'this quality');
  result = result.replace(/\bthe\s+Emotional body\b/gi, 'the active quality');
  result = result.replace(/\bEmotional body's\b/gi, "the active quality's");
  result = result.replace(/\bEmotional body\b/gi, 'active quality');

  // Technical astrology terms
  result = result.replace(/\bfalls\s+in\s+detriment\b/gi, 'works at its edge');
  result = result.replace(/\bin\s+detriment\b/gi, 'at its edge');
  result = result.replace(/\bexalted\b/gi, 'amplified');
  result = result.replace(/\bdomicile\b/gi, 'aligned');

  return result;
}
