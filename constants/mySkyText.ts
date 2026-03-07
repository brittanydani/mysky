// ─────────────────────────────────────────────────────────────────────────────
// MySky Text System
//
// Pure white for all primary content. Gold only for accents.
// Against the navy-black background (#020817), this gives maximum readability
// while keeping the premium, luxurious feel.
//
// Rule: white = content, gold = highlight, navy = space
// ─────────────────────────────────────────────────────────────────────────────

export const mySkyText = {
  // ── Primary content — pure white ────────────────────────────────────────
  /** Screen titles, modal headings, section titles */
  title:     '#FFFFFF',
  /** Same as title — alias for heading contexts */
  heading:   '#FFFFFF',

  // ── Body content — slightly softened ────────────────────────────────────
  /** Descriptions, onboarding text, card content */
  body:      'rgba(255, 255, 255, 0.85)',

  // ── Secondary content ────────────────────────────────────────────────────
  /** Helper text, metadata, subtitles */
  secondary: 'rgba(255, 255, 255, 0.65)',

  // ── Muted / UI labels ────────────────────────────────────────────────────
  /** Field labels, inactive tab labels, timestamps, hints */
  muted:     'rgba(255, 255, 255, 0.45)',

  // ── Gold accents — use sparingly ─────────────────────────────────────────
  /** Active tab labels, premium badges, feature highlights */
  goldAccent: '#E8D6AE',
  /** Softer gold for secondary accents */
  goldMuted:  '#C9AE78',
  /** Very small CAPS labels: PREMIUM, TODAY, FEATURED */
  goldCaps:   '#D4B87A',

  // ── Tab bar ──────────────────────────────────────────────────────────────
  /** Active tab label */
  tabActive:   '#FFFFFF',
  /** Inactive tab label — muted champagne, not bright white */
  tabInactive: 'rgba(185, 155, 95, 0.65)',
} as const;
