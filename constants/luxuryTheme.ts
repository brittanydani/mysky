// File: constants/luxuryTheme.ts
// Central source of truth for the MySky luxury visual system.

export const luxuryTheme = {
  background: {
    top: '#040A18',
    mid: '#060E21',
    bottom: '#02050E',
    base: '#02040A',
    elevated: '#0A142A',
    panel: 'rgba(255,255,255,0.03)',
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
};

export type LuxuryTheme = typeof luxuryTheme;
