// File: constants/luxuryTheme.ts
// Central source of truth for the MySky luxury visual system.

export const luxuryTheme = {
  background: {
    top: '#020817',
    bottom: '#030A18',
    base: '#020817',
    elevated: '#0B1220',
    panel: 'rgba(255,255,255,0.02)',
  },

  text: {
    white: '#FFFFFF',
    heading: '#FFFFFF',
    body: 'rgba(226,232,240,0.78)',
    muted: 'rgba(226,232,240,0.58)',
    dim: 'rgba(226,232,240,0.42)',
    goldPrimary: '#FFFFFF',
    goldSecondary: '#FFFFFF',
    goldBright: '#FFFFFF',
    onDark: '#FFFFFF',
    onGold: '#0B1220',
  },

  stars: {
    bright: 'rgba(255,255,255,0.95)',
    dim: 'rgba(255,255,255,0.72)',
    count: 50,
    twinkleCount: 10,
  },

  metallicGold: {
    highlight1: '#FFF8E3',
    highlight2: '#F7E7C2',
    light: '#EED9A7',
    midLight: '#DDBB83',
    mid: '#CFAE73',
    shadow1: '#A8834B',
    shadow2: '#6F552E',
    deepShadow: '#4E3A1F',
    rim: 'rgba(255,248,220,0.60)',
    rimSoft: 'rgba(255,248,220,0.30)',
    glow: 'rgba(247,231,194,0.22)',
    gloss: 'rgba(255,255,255,0.18)',
  },

  gradients: {
    goldStrong: [
      '#FFF8E3',
      '#F7E7C2',
      '#EED9A7',
      '#CFAE73',
      '#9B7A46',
      '#6F552E',
    ],
    goldLogoLike: [
      '#FFF6DB',
      '#EEDDB7',
      '#D8BE8A',
      '#B89254',
      '#8A6A3C',
    ],
    goldSoft: [
      '#FDF3D7',
      '#E8D7B0',
      '#CBB07A',
      '#9B7B47',
      '#6F562F',
    ],
    cardBorder: [
      'rgba(255,248,220,0.42)',
      'rgba(221,187,131,0.22)',
      'rgba(111,85,46,0.18)',
    ],
    cardFill: ['transparent', 'transparent'],
    metallicReflection: [
      'rgba(255,255,255,0.00)',
      'rgba(255,255,255,0.12)',
      'rgba(255,248,220,0.36)',
      'rgba(255,255,255,0.08)',
      'rgba(255,255,255,0.00)',
      'rgba(111,85,46,0.05)',
      'rgba(255,248,220,0.22)',
      'rgba(255,255,255,0.00)',
    ],
    glossTop: [
      'rgba(255,255,255,0.24)',
      'rgba(255,255,255,0.10)',
      'rgba(255,255,255,0.00)',
    ],
  },

  button: {
    textDark: '#0B1220',
    border: 'rgba(255,244,214,0.30)',
    gloss: 'rgba(255,255,255,0.10)',
    disabledFill: 'rgba(255,255,255,0.08)',
    disabledBorder: 'rgba(255,255,255,0.12)',
    disabledText: 'rgba(226,232,240,0.42)',
  },

  card: {
    fill: 'rgba(255,255,255,0.02)',
    fillStronger: 'rgba(255,255,255,0.035)',
    outline: 'rgba(255,248,220,0.24)',
    outlineBright: 'rgba(255,248,220,0.36)',
    innerGlow: 'rgba(255,248,220,0.06)',
    border: 'rgba(255,255,255,0.06)',
    borderTop: 'rgba(255,255,255,0.12)',
    shadow: 'rgba(0,0,0,0.22)',
  },

  accents: {
    amethyst: '#9D76C1',
    emerald: '#6EBF8B',
    silverBlue: '#8BC4E8',
    copper: '#CD7F5D',
    rose: '#D4A3B3',
    sapphire: '#4A6FA5',
    ruby: '#9B2335',
    topaz: '#FFBF00',
    moonstone: '#AAB7C4',
  },

  glow: {
    gold: 'rgba(247,231,194,0.22)',
    emerald: 'rgba(110,191,139,0.18)',
    sapphire: 'rgba(74,111,165,0.18)',
    silverBlue: 'rgba(139,196,232,0.20)',
  },

  shadow: {
    card: 'transparent',
    glowGold: 'rgba(207,174,115,0.35)',
    glowSoft: 'rgba(247,231,194,0.18)',
  },

  radius: {
    card: 24,
    pill: 999,
    button: 999,
  },

  spacing: {
    screenX: 20,
    screenY: 20,
    cardPadding: 18,
    sectionGap: 16,
  },

  // ── Somatic Wave Colors (The Vitality System) ──────────────────────────────
  // Three pillars of human experience rendered as liquid-light Skia gradients.
  // High amplitude = high intensity; low amplitude = depletion.
  somaticWave: {
    // Mood — The Sun / Self / Joy
    mood: '#D4AF37',
    moodGlow: 'rgba(212, 175, 55, 0.30)',
    moodGlowFaint: 'rgba(212, 175, 55, 0.12)',
    // Energy — The Breath / Movement
    energy: '#7DEBDB',
    energyGlow: 'rgba(125, 235, 219, 0.30)',
    energyGlowFaint: 'rgba(125, 235, 219, 0.12)',
    // Rest — The Night / Recovery
    rest: '#A286F2',
    restGlow: 'rgba(162, 134, 242, 0.30)',
    restGlowFaint: 'rgba(162, 134, 242, 0.12)',
  },

  // ── Emotional Weather Colors (The Ambient System) ──────────────────────────
  // App-wide glow mapped to the Stability Index.
  // Instruct Skia RadialGradient to shift background based on this state.
  emotionalWeather: {
    // Aligned — mood and energy in sync; clear cool morning
    aligned: '#7DEBDB',
    alignedGlow: 'rgba(125, 235, 219, 0.20)',
    // Turbulent — high mismatch (e.g. High Energy + Low Mood); tense/agitated
    turbulent: '#D4832A',
    turbulentGlow: 'rgba(212, 131, 42, 0.22)',
    // Depleted — all metrics low; app dims to avoid over-stimulation
    depleted: '#3D4670',
    depletedGlow: 'rgba(61, 70, 112, 0.30)',
    depletedAccent: '#6B68A8',
  },

  // ── Energy Architecture (The Chakra System) ───────────────────────────────
  // Muted jewel tones for the Frequency Orb and Mandala Screen.
  chakraJewels: {
    root:      { name: 'Root',        symbolism: 'Survival, Grounding, Safety',           core: '#FF4D4D', glow: 'rgba(255, 77, 77, 0.40)',   deep: '#7A1818' },
    sacral:    { name: 'Sacral',      symbolism: 'Creativity, Emotions, Pleasure',         core: '#FFA500', glow: 'rgba(255, 165, 0, 0.40)',   deep: '#7A4D00' },
    solar:     { name: 'Solar',       symbolism: 'Power, Confidence, Mastery',             core: '#FFD700', glow: 'rgba(255, 215, 0, 0.40)',   deep: '#7A6500' },
    heart:     { name: 'Heart',       symbolism: 'Love, Compassion, Healing',              core: '#4CAF50', glow: 'rgba(76, 175, 80, 0.40)',   deep: '#1A5E1A' },
    throat:    { name: 'Throat',      symbolism: 'Truth, Communication, Voice',            core: '#00BFFF', glow: 'rgba(0, 191, 255, 0.40)',   deep: '#005A7A' },
    thirdEye:  { name: 'Third Eye',   symbolism: 'Intuition, Dreams, Vision',              core: '#483D8B', glow: 'rgba(72, 61, 139, 0.40)',   deep: '#1A1535' },
    crown:     { name: 'Crown',       symbolism: 'Connection, Purpose, Spirit',            core: '#EE82EE', glow: 'rgba(238, 130, 238, 0.40)', deep: '#6A2E6A' },
  },

  // ── Blueprint Colors (The Identity System) ────────────────────────────────
  // Architectural colors for the Blueprint Tab: past is silver, present is gold.
  blueprint: {
    natalBaseline: '#C0C0C0',                      // Silver — the unshakable past
    natalBaselineGlow: 'rgba(192, 192, 192, 0.15)',
    natalBaselineStroke: 'rgba(192, 192, 192, 0.45)',
    behavioralLayer: '#D4AF37',                    // Gold — alchemized experience
    behavioralLayerGlow: 'rgba(212, 175, 55, 0.18)',
    behavioralLayerStroke: 'rgba(212, 175, 55, 0.55)',
    gridLine: 'rgba(192, 192, 192, 0.12)',         // Silver-toned grid
    axisLine: 'rgba(192, 192, 192, 0.18)',
    // Typography — never pure 100% white
    textPrimary: 'rgba(255, 255, 255, 0.80)',      // 80% white: primary headers
    textSecondary: 'rgba(255, 255, 255, 0.60)',    // 60% white: secondary descriptions
  },

  // ── Skia Paint Logic (Technical Rendering Notes) ──────────────────────────
  // Reference these when writing Skia.Paint() or Canvas primitives.
  skiaPaint: {
    // Dithering: set paint.setDither(true) to prevent banding in dark gradients.
    // ColorFilter: use ColorFilter.MakeBlend(color, BlendMode.Screen) for stars
    //   and waves so overlapping colors get brighter (like real light), not muddy.
    // DropShadow for gold serif text:
    goldTextShadow: {
      dx: 0,
      dy: 1,
      blur: 2,
      color: 'rgba(0, 0, 0, 0.5)',
    },
  },
};

export type LuxuryTheme = typeof luxuryTheme;
