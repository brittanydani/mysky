// Precise moon phase calculation using astronomy-engine (JPL-grade ephemeris)
import { MoonPhase as AstroMoonPhase } from 'astronomy-engine';

export type MoonPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export type MoonPhaseTag =
  | 'phase-new'
  | 'phase-waxing-crescent'
  | 'phase-first-quarter'
  | 'phase-waxing-gibbous'
  | 'phase-full'
  | 'phase-waning-gibbous'
  | 'phase-last-quarter'
  | 'phase-waning-crescent';

export interface MoonPhaseInfo {
  name: MoonPhaseName;
  emoji: string;
  tag: MoonPhaseTag;
  message: string;
  /** Moon phase angle 0–360° (0=New, 90=First Quarter, 180=Full, 270=Last Quarter) */
  angle: number;
}

// Named phases (New, Quarter, Full) are instantaneous events; we label only the
// day on which the exact moment falls — ±6° window (~1 day, since Moon moves ~12.2°/day).
// Intermediate phases (Crescents, Gibbous) fill the remaining ~78° (~6.4 days each).
// Verified against SpaceWeatherLive & lunar-calendar.net for Feb 2026.
const PHASE_TABLE: Array<{
  maxAngle: number;
  name: MoonPhaseName;
  emoji: string;
  tag: MoonPhaseTag;
  message: string;
}> = [
  { maxAngle: 6,     name: 'New Moon',         emoji: '🌑', tag: 'phase-new',              message: 'Set intentions. Plant seeds in the dark.' },
  { maxAngle: 84,    name: 'Waxing Crescent',  emoji: '🌒', tag: 'phase-waxing-crescent',  message: 'Momentum is building. Keep going.' },
  { maxAngle: 96,    name: 'First Quarter',     emoji: '🌓', tag: 'phase-first-quarter',    message: 'Push through resistance. Commit.' },
  { maxAngle: 174,   name: 'Waxing Gibbous',   emoji: '🌔', tag: 'phase-waxing-gibbous',   message: 'Refine and adjust. Almost there.' },
  { maxAngle: 186,   name: 'Full Moon',         emoji: '🌕', tag: 'phase-full',             message: "Illuminate. See clearly what's been hidden." },
  { maxAngle: 264,   name: 'Waning Gibbous',   emoji: '🌖', tag: 'phase-waning-gibbous',   message: "Share what you've learned. Give back." },
  { maxAngle: 276,   name: 'Last Quarter',      emoji: '🌗', tag: 'phase-last-quarter',     message: 'Release what no longer serves you.' },
  { maxAngle: 354,   name: 'Waning Crescent',  emoji: '🌘', tag: 'phase-waning-crescent',  message: 'Rest and surrender. Trust the cycle.' },
];

/**
 * Get precise moon phase info for a given date using JPL-grade ephemeris.
 * Uses astronomy-engine's MoonPhase() which returns the angular distance
 * between the Moon and Sun (0°=New, 90°=First Quarter, 180°=Full, 270°=Last Quarter).
 */
export function getMoonPhaseInfo(date: Date = new Date()): MoonPhaseInfo {
  const angle = AstroMoonPhase(date);

  for (const entry of PHASE_TABLE) {
    if (angle < entry.maxAngle) {
      return { name: entry.name, emoji: entry.emoji, tag: entry.tag, message: entry.message, angle };
    }
  }
  // > 354° wraps to New Moon
  const nm = PHASE_TABLE[0];
  return { name: nm.name, emoji: nm.emoji, tag: nm.tag, message: nm.message, angle };
}

/**
 * Get just the phase name string (e.g. 'Waning Gibbous').
 */
export function getMoonPhaseName(date: Date = new Date()): MoonPhaseName {
  return getMoonPhaseInfo(date).name;
}

/**
 * Get just the phase tag (e.g. 'phase-waning-gibbous').
 */
export function getMoonPhaseTag(date: Date = new Date()): MoonPhaseTag {
  return getMoonPhaseInfo(date).tag;
}

/** Underscore-style tag used by journal prompts and check-in storage (e.g. 'waning_crescent') */
export type MoonPhaseKeyTag =
  | 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
  | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

const TAG_TO_KEY: Record<MoonPhaseTag, MoonPhaseKeyTag> = {
  'phase-new': 'new',
  'phase-waxing-crescent': 'waxing_crescent',
  'phase-first-quarter': 'first_quarter',
  'phase-waxing-gibbous': 'waxing_gibbous',
  'phase-full': 'full',
  'phase-waning-gibbous': 'waning_gibbous',
  'phase-last-quarter': 'last_quarter',
  'phase-waning-crescent': 'waning_crescent',
};

/**
 * Get the underscore-style phase key (e.g. 'waning_crescent').
 * Used by journal prompt library and check-in storage.
 */
export function getMoonPhaseKey(date: Date = new Date()): MoonPhaseKeyTag {
  return TAG_TO_KEY[getMoonPhaseInfo(date).tag];
}
