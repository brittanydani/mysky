import React from 'react';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
} from 'react-native-svg';

type Props = { size?: number };

/**
 * Shield with checkmark — silver / platinum metallic gradient.
 * Used as the Privacy Policy header icon.
 */
export default function ShieldCheckIcon({ size = 140 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <SvgLinearGradient id="shieldFill" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#F0F2F5" stopOpacity={0.20} />
          <Stop offset="50%" stopColor="#A8B4C2" stopOpacity={0.12} />
          <Stop offset="100%" stopColor="#5A6A7A" stopOpacity={0.08} />
        </SvgLinearGradient>
        <SvgLinearGradient id="shieldStroke" x1="32" y1="4" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#F0F2F5" />
          <Stop offset="25%" stopColor="#D0D8E0" />
          <Stop offset="50%" stopColor="#A8B4C2" />
          <Stop offset="75%" stopColor="#7A8A9A" />
          <Stop offset="100%" stopColor="#4A5A6A" />
        </SvgLinearGradient>
      </Defs>

      {/* Glow */}
      <G opacity={0.10}>
        <Path
          d="M32 6 C32 6 14 12 14 12 L14 30 C14 44 32 56 32 56 C32 56 50 44 50 30 L50 12 C50 12 32 6 32 6Z"
          stroke="#A8B4C2"
          strokeWidth={6}
          strokeLinejoin="round"
        />
      </G>

      {/* Shield body fill */}
      <Path
        d="M32 6 C32 6 14 12 14 12 L14 30 C14 44 32 56 32 56 C32 56 50 44 50 30 L50 12 C50 12 32 6 32 6Z"
        fill="url(#shieldFill)"
      />

      {/* Shield outline */}
      <Path
        d="M32 6 C32 6 14 12 14 12 L14 30 C14 44 32 56 32 56 C32 56 50 44 50 30 L50 12 C50 12 32 6 32 6Z"
        stroke="url(#shieldStroke)"
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill="none"
      />

      {/* Inner shield line */}
      <Path
        d="M32 11 C32 11 18 16 18 16 L18 30 C18 41 32 51 32 51 C32 51 46 41 46 30 L46 16 C46 16 32 11 32 11Z"
        stroke="#A8B4C2"
        strokeWidth={0.6}
        strokeLinejoin="round"
        fill="none"
        opacity={0.3}
      />

      {/* Checkmark glow */}
      <Path
        d="M23 31 L29 37 L41 25"
        stroke="#D0D8E0"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.15}
      />

      {/* Checkmark */}
      <Path
        d="M23 31 L29 37 L41 25"
        stroke="url(#shieldStroke)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
