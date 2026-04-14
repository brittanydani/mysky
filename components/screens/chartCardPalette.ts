export const CHART_CARD_COLORS = {
  midnight: '#2C3645',
  sage: '#608A8D',
  purple: '#85769F',
  taupe: '#A49E97',
  moss: '#879788',
  slate: '#596C7D',
  rose: '#9C8481',
  stone: '#8E8C8A',
  steel: '#7A8189',
} as const;

// Utility to convert hex strings to rgb values to feed to rgba()
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
};

// Generate standard gradient arrays from the base colors
export const CHART_CARD_WASHES = {
  midnight: ['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)'] as [string, string], // Special deeper gradient
  sage: [`rgba(${hexToRgb(CHART_CARD_COLORS.sage)}, 0.24)`, `rgba(${hexToRgb(CHART_CARD_COLORS.sage)}, 0.08)`] as [string, string],
  purple: [`rgba(${hexToRgb(CHART_CARD_COLORS.purple)}, 0.20)`, `rgba(${hexToRgb(CHART_CARD_COLORS.purple)}, 0.06)`] as [string, string],
  taupe: [`rgba(${hexToRgb(CHART_CARD_COLORS.taupe)}, 0.28)`, `rgba(${hexToRgb(CHART_CARD_COLORS.taupe)}, 0.12)`] as [string, string],
  moss: [`rgba(${hexToRgb(CHART_CARD_COLORS.moss)}, 0.24)`, `rgba(${hexToRgb(CHART_CARD_COLORS.moss)}, 0.08)`] as [string, string],
  slate: [`rgba(${hexToRgb(CHART_CARD_COLORS.slate)}, 0.24)`, `rgba(${hexToRgb(CHART_CARD_COLORS.slate)}, 0.08)`] as [string, string],
  rose: [`rgba(${hexToRgb(CHART_CARD_COLORS.rose)}, 0.20)`, `rgba(${hexToRgb(CHART_CARD_COLORS.rose)}, 0.06)`] as [string, string],
  stone: [`rgba(${hexToRgb(CHART_CARD_COLORS.stone)}, 0.24)`, `rgba(${hexToRgb(CHART_CARD_COLORS.stone)}, 0.08)`] as [string, string],
  steel: [`rgba(${hexToRgb(CHART_CARD_COLORS.steel)}, 0.24)`, `rgba(${hexToRgb(CHART_CARD_COLORS.steel)}, 0.08)`] as [string, string],
} as const;