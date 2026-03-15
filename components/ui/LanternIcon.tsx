import React from 'react';
import Svg, {
  Path,
  Rect,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  G,
} from 'react-native-svg';

type Props = { size?: number };

/**
 * Lantern — sapphire / blue-steel metallic gradient.
 * Used as the FAQ header icon.
 */
export default function LanternIcon({ size = 140 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <SvgLinearGradient id="steelStroke" x1="32" y1="6" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#D4E4F4" />
          <Stop offset="20%" stopColor="#8AACCF" />
          <Stop offset="50%" stopColor="#5A86AD" />
          <Stop offset="80%" stopColor="#3A6080" />
          <Stop offset="100%" stopColor="#1E3A55" />
        </SvgLinearGradient>
        <SvgLinearGradient id="steelFill" x1="32" y1="14" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#D4E4F4" stopOpacity={0.16} />
          <Stop offset="50%" stopColor="#5A86AD" stopOpacity={0.08} />
          <Stop offset="100%" stopColor="#1E3A55" stopOpacity={0.04} />
        </SvgLinearGradient>
        <SvgRadialGradient id="glow" cx="32" cy="32" r="10" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#E8D49A" stopOpacity={0.45} />
          <Stop offset="70%" stopColor="#D4B060" stopOpacity={0.12} />
          <Stop offset="100%" stopColor="#D4B060" stopOpacity={0} />
        </SvgRadialGradient>
        <SvgLinearGradient id="glassBody" x1="32" y1="16" x2="32" y2="46" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#D4E4F4" stopOpacity={0.12} />
          <Stop offset="50%" stopColor="#8AACCF" stopOpacity={0.06} />
          <Stop offset="100%" stopColor="#3A6080" stopOpacity={0.03} />
        </SvgLinearGradient>
      </Defs>

      {/* Outer glow */}
      <G opacity={0.08}>
        <Path
          d="M22 16 L22 46 Q22 50 32 50 Q42 50 42 46 L42 16 Q42 12 32 12 Q22 12 22 16Z"
          stroke="#8AACCF"
          strokeWidth={5}
        />
      </G>

      {/* ── Top handle/ring ── */}
      <Path
        d="M28 12 Q28 7 32 7 Q36 7 36 12"
        stroke="url(#steelStroke)"
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Top cap ── */}
      <Rect x="24" y="13" width="16" height="4" rx="1.5" fill="url(#steelFill)" stroke="url(#steelStroke)" strokeWidth={1.2} />

      {/* ── Glass body ── */}
      <Path
        d="M24 17 L22.5 44 Q22.5 48 32 48 Q41.5 48 41.5 44 L40 17 Z"
        fill="url(#glassBody)"
        stroke="url(#steelStroke)"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />

      {/* Inner warm glow */}
      <Circle cx="32" cy="32" r="10" fill="url(#glow)" />

      {/* ── Flame ── */}
      <Path
        d="M32 25 Q34.5 28 34 31 Q33.5 34 32 35 Q30.5 34 30 31 Q29.5 28 32 25Z"
        fill="#E8D49A"
        opacity={0.7}
      />
      <Path
        d="M32 27.5 Q33.2 29 33 31 Q32.7 32.5 32 33 Q31.3 32.5 31 31 Q30.8 29 32 27.5Z"
        fill="#FFF7E8"
        opacity={0.5}
      />

      {/* ── Bottom cap ── */}
      <Rect x="25" y="47" width="14" height="3.5" rx="1.2" fill="url(#steelFill)" stroke="url(#steelStroke)" strokeWidth={1} />

      {/* ── Base foot ── */}
      <Path
        d="M26 50.5 L26 54 Q26 55 28 55 L36 55 Q38 55 38 54 L38 50.5"
        fill="url(#steelFill)"
        stroke="url(#steelStroke)"
        strokeWidth={1}
        strokeLinejoin="round"
      />

      {/* Cross-bars on glass (decorative) */}
      <Path d="M24.5 26 L39.5 26" stroke="url(#steelStroke)" strokeWidth={0.6} opacity={0.4} />
      <Path d="M23.5 37 L40.5 37" stroke="url(#steelStroke)" strokeWidth={0.6} opacity={0.4} />
    </Svg>
  );
}
