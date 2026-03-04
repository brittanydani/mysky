import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';

export interface AstrologyIconProps {
  /** Size of the icon (width and height) */
  size?: number;
  /** Primary hex color for the glyph */
  color?: string;
  /** If true, renders a soft, glowing halo behind the paths */
  glow?: boolean;
}

/**
 * Chiron (⚷) — The Wounded Healer
 * Styled with elegant angles and perfect circle anchoring.
 */
export function ChironIcon({ size = 24, color = '#D4AF37', glow = true }: AstrologyIconProps) {
  const elements = (
    <>
      <Circle cx="12" cy="18.5" r="3.5" fill="none" />
      <Path d="M12 15 L12 3" fill="none" />
      <Path d="M12 9.5 L17.5 3" fill="none" />
      <Path d="M14.5 6 L18.5 11.5" fill="none" />
    </>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Soft Glow Layer */}
      {glow && (
        <G stroke={color} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.15}>
          {elements}
        </G>
      )}
      {/* Crisp Core Layer */}
      <G stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {elements}
      </G>
    </Svg>
  );
}

/**
 * North Node (☊) — Ascending Node / True Node
 * Features a perfectly swept bezier arch and hollow anchors.
 */
export function NorthNodeIcon({ size = 24, color = '#D4AF37', glow = true }: AstrologyIconProps) {
  const elements = (
    <>
      {/* Left and Right Anchors */}
      <Circle cx="5.5" cy="16.5" r="3" fill="none" />
      <Circle cx="18.5" cy="16.5" r="3" fill="none" />
      {/* Sweeping Arch */}
      <Path d="M 5.5 13.5 C 5.5 1, 18.5 1, 18.5 13.5" fill="none" />
    </>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {glow && (
        <G stroke={color} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.15}>
          {elements}
        </G>
      )}
      <G stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {elements}
      </G>
    </Svg>
  );
}

/**
 * South Node (☋) — Descending Node
 * Inverted arch with hollow anchors at the top.
 */
export function SouthNodeIcon({ size = 24, color = '#D4AF37', glow = true }: AstrologyIconProps) {
  const elements = (
    <>
      {/* Left and Right Anchors */}
      <Circle cx="5.5" cy="7.5" r="3" fill="none" />
      <Circle cx="18.5" cy="7.5" r="3" fill="none" />
      {/* Inverted Arch */}
      <Path d="M 5.5 10.5 C 5.5 23, 18.5 23, 18.5 10.5" fill="none" />
    </>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {glow && (
        <G stroke={color} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.15}>
          {elements}
        </G>
      )}
      <G stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {elements}
      </G>
    </Svg>
  );
}

/**
 * Lilith (⚸) — Black Moon
 * Elegant intersecting curves forming the crescent, anchored by a structural cross.
 */
export function LilithIcon({ size = 24, color = '#D4AF37', glow = true }: AstrologyIconProps) {
  const elements = (
    <>
      {/* Crescent */}
      <Path d="M 14 3.5 C 7.5 3.5, 7.5 13.5, 14 13.5" fill="none" />
      <Path d="M 14 3.5 C 10 3.5, 10 13.5, 14 13.5" fill="none" />
      {/* Cross */}
      <Path d="M 11 13 L 11 21" fill="none" />
      <Path d="M 8 17 L 14 17" fill="none" />
    </>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {glow && (
        <G stroke={color} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.15}>
          {elements}
        </G>
      )}
      <G stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {elements}
      </G>
    </Svg>
  );
}

/**
 * Part of Fortune (⊗) — Pars Fortunae
 * A perfect circle enclosing an intersecting cross.
 */
export function PartOfFortuneIcon({ size = 24, color = '#D4AF37', glow = true }: AstrologyIconProps) {
  const elements = (
    <>
      <Circle cx="12" cy="12" r="7.5" fill="none" />
      <Path d="M 6.7 6.7 L 17.3 17.3" fill="none" />
      <Path d="M 6.7 17.3 L 17.3 6.7" fill="none" />
    </>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {glow && (
        <G stroke={color} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.15}>
          {elements}
        </G>
      )}
      <G stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {elements}
      </G>
    </Svg>
  );
}

/**
 * Vertex (Vx) — Point of Destiny
 * A beautifully woven, continuous-feeling typography piece.
 */
export function VertexIcon({ size = 24, color = '#D4AF37', glow = true }: AstrologyIconProps) {
  const elements = (
    <>
      {/* The 'V' */}
      <Path d="M 5 6 L 10.5 18 L 14.5 9.5" fill="none" />
      {/* The 'x' */}
      <Path d="M 13 12 L 19 18" fill="none" />
      <Path d="M 13 18 L 19 12" fill="none" />
    </>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {glow && (
        <G stroke={color} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.15}>
          {elements}
        </G>
      )}
      <G stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {elements}
      </G>
    </Svg>
  );
}
