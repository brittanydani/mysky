// File: constants/goldTheme.ts

export const goldTheme = {
  background: {
    top: '#020817',
    bottom: '#030A18',
  },

  text: {
    white: '#F8FAFC',
    body: 'rgba(226,232,240,0.78)',

    // Only use these for text that is already intended to be gold/yellow accent text.
    goldPrimary: '#E8D6AE',
    goldSecondary: '#D8C39A',
    goldBright: '#F3E6C5',
  },

  stars: {
    bright: 'rgba(255,255,255,0.95)',
    dim: 'rgba(255,255,255,0.72)',
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
    ] as const,

    goldLogoLike: [
      '#FFF6DB',
      '#EEDDB7',
      '#D8BE8A',
      '#B89254',
      '#8A6A3C',
    ] as const,

    goldSoft: [
      '#FDF3D7',
      '#E8D7B0',
      '#CBB07A',
      '#9B7B47',
      '#6F562F',
    ] as const,

    cardBorder: [
      'rgba(255,248,220,0.42)',
      'rgba(221,187,131,0.22)',
      'rgba(111,85,46,0.18)',
    ] as const,

    cardFill: [
      'rgba(255,255,255,0.035)',
      'rgba(255,255,255,0.015)',
      'rgba(255,255,255,0.01)',
    ] as const,

    metallicReflection: [
      'rgba(255,255,255,0.00)',
      'rgba(255,255,255,0.12)',
      'rgba(255,248,220,0.36)',
      'rgba(255,255,255,0.08)',
      'rgba(255,255,255,0.00)',
      'rgba(111,85,46,0.05)',
      'rgba(255,248,220,0.22)',
      'rgba(255,255,255,0.00)',
    ] as const,

    glossTop: [
      'rgba(255,255,255,0.24)',
      'rgba(255,255,255,0.10)',
      'rgba(255,255,255,0.00)',
    ] as const,
  },

  button: {
    text: '#0B1220',
    border: 'rgba(255,244,214,0.30)',
    gloss: 'rgba(255,255,255,0.10)',
  },

  card: {
    fill: 'rgba(255,255,255,0.02)',
    fillStronger: 'rgba(255,255,255,0.035)',
    outline: 'rgba(255,248,220,0.24)',
    outlineBright: 'rgba(255,248,220,0.36)',
    innerGlow: 'rgba(255,248,220,0.06)',
    shadow: 'rgba(0,0,0,0.22)',
  },
} as const;

export type GoldTheme = typeof goldTheme;
