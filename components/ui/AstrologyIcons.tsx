import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Chiron (⚷) — The "wounded healer" key glyph
 * A stylized K with a circle at the base
 */
export function ChironIcon({ size = 24, color = '#C9A962' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {/* Circle at bottom */}
      <Circle cx="12" cy="18" r="4" stroke={color} strokeWidth={2} fill="none" />
      {/* Vertical stem */}
      <Path d={`M12 14 L12 2`} stroke={color} strokeWidth={2} strokeLinecap="round" />
      {/* Upper-right arm (K shape) */}
      <Path d={`M12 8 L19 3`} stroke={color} strokeWidth={2} strokeLinecap="round" />
      {/* Lower-right arm (K shape) */}
      <Path d={`M12 8 L19 13`} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * North Node (☊) — Ascending Node / Dragon's Head
 * A horseshoe shape open at the top (like headphones or Ω inverted)
 */
export function NorthNodeIcon({ size = 24, color = '#C9A962' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {/* U-shape (ascending node) */}
      <Path
        d="M5 6 C5 6 5 18 12 18 C19 18 19 6 19 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {/* Left circle */}
      <Circle cx="5" cy="6" r="3" stroke={color} strokeWidth={2} fill="none" />
      {/* Right circle */}
      <Circle cx="19" cy="6" r="3" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

/**
 * South Node (☋) — Descending Node / Dragon's Tail
 * An inverted horseshoe shape open at the bottom (like Ω)
 */
export function SouthNodeIcon({ size = 24, color = '#C9A962' }: IconProps) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {/* Inverted U-shape (descending node) */}
      <Path
        d="M5 18 C5 18 5 6 12 6 C19 6 19 18 19 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {/* Left circle */}
      <Circle cx="5" cy="18" r="3" stroke={color} strokeWidth={2} fill="none" />
      {/* Right circle */}
      <Circle cx="19" cy="18" r="3" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}
