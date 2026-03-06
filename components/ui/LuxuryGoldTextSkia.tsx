/**
 * LuxuryGoldTextSkia
 *
 * Premium metallic-gradient headline text drawn via Skia.
 * Uses the system font manager (matchFont) — no bundled TTF needed.
 *
 * Layers:
 *   1. Subtle dark text shadow for depth
 *   2. Metallic gold gradient fill
 *   3. Optional bright highlight overlay (strong mode)
 *
 * Use for premium headlines, section titles, and accent text.
 * For body text, use the GOLD_TEXT solid constants from theme instead.
 */

import React, { useMemo } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import {
  Canvas,
  Text as SkiaText,
  LinearGradient,
  Group,
  matchFont,
  vec,
  BlurMask,
} from '@shopify/react-native-skia';
import { METALLIC_GOLD } from '../../constants/theme';

const FONT_FAMILY = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
}) as string;

type LuxuryGoldTextSkiaProps = {
  /** The text to render */
  text: string;
  /** Canvas width — should match the layout width */
  width: number;
  /** Canvas height — defaults based on fontSize */
  height?: number;
  /** Font size (default 28) */
  fontSize?: number;
  /** Font weight */
  fontWeight?: '400' | '500' | '600' | '700' | '800' | '900';
  /** When true, uses a brighter/more dramatic gradient */
  strong?: boolean;
  /** Horizontal alignment */
  align?: 'left' | 'center' | 'right';
  style?: ViewStyle;
};

export default function LuxuryGoldTextSkia({
  text,
  width,
  height,
  fontSize = 28,
  fontWeight = '700',
  strong = false,
  align = 'center',
  style,
}: LuxuryGoldTextSkiaProps) {
  const canvasHeight = height ?? Math.ceil(fontSize * 1.6);

  const font = useMemo(
    () =>
      matchFont({
        fontFamily: FONT_FAMILY,
        fontSize,
        fontWeight,
      }),
    [fontSize, fontWeight],
  );

  // Measure text to center it
  const textWidth = font ? font.getTextWidth(text) : 0;
  const x = useMemo(() => {
    if (align === 'left') return 4;
    if (align === 'right') return width - textWidth - 4;
    return (width - textWidth) / 2;
  }, [align, width, textWidth]);

  const y = fontSize + (canvasHeight - fontSize) / 2 - 2;

  const gradientColors = strong
    ? [
        METALLIC_GOLD.highlight1,
        '#FFF8E7',
        METALLIC_GOLD.light,
        METALLIC_GOLD.mid,
        METALLIC_GOLD.light,
        METALLIC_GOLD.highlight2,
      ]
    : [
        METALLIC_GOLD.highlight1,
        METALLIC_GOLD.light,
        METALLIC_GOLD.mid,
        METALLIC_GOLD.shadow1,
        METALLIC_GOLD.light,
        METALLIC_GOLD.highlight2,
      ];

  if (!font) return null;

  return (
    <View style={[{ width, height: canvasHeight }, style]}>
      <Canvas style={{ width, height: canvasHeight }}>
        <Group>
          {/* 1. Subtle shadow for depth */}
          <SkiaText
            x={x + 0.5}
            y={y + 1}
            text={text}
            font={font}
            color="rgba(0,0,0,0.35)"
          >
            <BlurMask blur={1.5} style="normal" />
          </SkiaText>

          {/* 2. Metallic gradient fill */}
          <SkiaText x={x} y={y} text={text} font={font}>
            <LinearGradient
              start={vec(x, y - fontSize)}
              end={vec(x + textWidth, y)}
              colors={gradientColors}
              positions={[0, 0.18, 0.38, 0.58, 0.78, 1]}
            />
          </SkiaText>

          {/* 3. Bright highlight edge (strong mode only) */}
          {strong && (
            <SkiaText
              x={x}
              y={y}
              text={text}
              font={font}
              color="rgba(255,248,220,0.12)"
            />
          )}
        </Group>
      </Canvas>
    </View>
  );
}
