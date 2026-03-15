import React from 'react';
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
} from 'react-native-svg';

type Props = { size?: number };

/**
 * Scales of Justice — copper / bronze metallic gradient.
 * Used as the Terms of Service header icon.
 */
export default function ScrollSealIcon({ size = 140 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <SvgLinearGradient id="copperStroke" x1="32" y1="6" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#F2D6C0" />
          <Stop offset="25%" stopColor="#D4956A" />
          <Stop offset="50%" stopColor="#B87340" />
          <Stop offset="75%" stopColor="#8C5228" />
          <Stop offset="100%" stopColor="#5C3418" />
        </SvgLinearGradient>
        <SvgLinearGradient id="copperFill" x1="32" y1="6" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#F2D6C0" stopOpacity={0.18} />
          <Stop offset="50%" stopColor="#B87340" stopOpacity={0.10} />
          <Stop offset="100%" stopColor="#5C3418" stopOpacity={0.06} />
        </SvgLinearGradient>
        <SvgLinearGradient id="panLeft" x1="14" y1="26" x2="26" y2="36" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#F2D6C0" stopOpacity={0.22} />
          <Stop offset="100%" stopColor="#8C5228" stopOpacity={0.10} />
        </SvgLinearGradient>
        <SvgLinearGradient id="panRight" x1="38" y1="26" x2="50" y2="36" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#F2D6C0" stopOpacity={0.22} />
          <Stop offset="100%" stopColor="#8C5228" stopOpacity={0.10} />
        </SvgLinearGradient>
      </Defs>

      {/* Glow */}
      <G opacity={0.08}>
        <Line x1="32" y1="8" x2="32" y2="54" stroke="#D4956A" strokeWidth={5} strokeLinecap="round" />
        <Line x1="14" y1="22" x2="50" y2="22" stroke="#D4956A" strokeWidth={5} strokeLinecap="round" />
      </G>

      {/* ── Central pillar ── */}
      <Line x1="32" y1="10" x2="32" y2="54" stroke="url(#copperStroke)" strokeWidth={2} strokeLinecap="round" />

      {/* ── Crossbeam ── */}
      <Line x1="13" y1="22" x2="51" y2="22" stroke="url(#copperStroke)" strokeWidth={1.8} strokeLinecap="round" />

      {/* ── Top ornament (small circle) ── */}
      <Circle cx="32" cy="10" r="2.5" fill="url(#copperFill)" stroke="url(#copperStroke)" strokeWidth={1.2} />

      {/* ── Left pan chains ── */}
      <Line x1="14" y1="22" x2="12" y2="33" stroke="url(#copperStroke)" strokeWidth={1} />
      <Line x1="14" y1="22" x2="26" y2="33" stroke="url(#copperStroke)" strokeWidth={1} />

      {/* Left pan (bowl) */}
      <Path
        d="M10 33 Q12 40 19 40 Q26 40 28 33"
        fill="url(#panLeft)"
        stroke="url(#copperStroke)"
        strokeWidth={1.2}
        strokeLinecap="round"
      />

      {/* ── Right pan chains ── */}
      <Line x1="50" y1="22" x2="38" y2="33" stroke="url(#copperStroke)" strokeWidth={1} />
      <Line x1="50" y1="22" x2="52" y2="33" stroke="url(#copperStroke)" strokeWidth={1} />

      {/* Right pan (bowl) */}
      <Path
        d="M36 33 Q38 40 45 40 Q52 40 54 33"
        fill="url(#panRight)"
        stroke="url(#copperStroke)"
        strokeWidth={1.2}
        strokeLinecap="round"
      />

      {/* ── Base ── */}
      <Path
        d="M24 54 L40 54"
        stroke="url(#copperStroke)"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      {/* Base foot detail */}
      <Path
        d="M28 54 Q32 57 36 54"
        stroke="url(#copperStroke)"
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
