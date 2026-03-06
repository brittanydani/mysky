/**
 * MetallicGoldIconSkia
 *
 * Renders a metallic-gold icon drawn entirely through Skia.
 * Layers:
 *   1. Dark under-stroke for depth
 *   2. Metallic gradient main stroke
 *   3. Thin bright highlight stroke for edge catch
 *   4. Optional glow behind icon
 *
 * Built-in icon names: sparkle, journal, lock, crown, star.
 * For custom shapes, pass a raw SVG path via `svgPath` prop.
 */

import React, { useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import {
  Canvas,
  Path,
  LinearGradient,
  Group,
  BlurMask,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { METALLIC_GOLD } from '../../constants/theme';

/* ────────────────── built-in SVG paths ────────────────── */
const ICON_PATHS: Record<string, string> = {
  sparkle:
    'M12 0 L14.4 8.4 L24 12 L14.4 15.6 L12 24 L9.6 15.6 L0 12 L9.6 8.4 Z',
  journal:
    'M4 2 Q4 0 6 0 L20 0 Q22 0 22 2 L22 22 Q22 24 20 24 L6 24 Q4 24 4 22 Z M7 5 L19 5 M7 9 L19 9 M7 13 L15 13',
  lock:
    'M6 10 L6 6 Q6 0 12 0 Q18 0 18 6 L18 10 M4 10 L20 10 Q22 10 22 12 L22 22 Q22 24 20 24 L4 24 Q2 24 2 22 L2 12 Q2 10 4 10 Z M12 15 L12 19',
  crown:
    'M1 20 L4 8 L8 14 L12 4 L16 14 L20 8 L23 20 Z M3 22 L21 22 Q23 22 23 20 L1 20 Q1 22 3 22 Z',
  star:
    'M12 0 L15.09 7.36 L23.51 8.58 L17.76 14.14 L19.18 22.52 L12 18.77 L4.82 22.52 L6.24 14.14 L0.49 8.58 L8.91 7.36 Z',
};

const VIEWBOX = 24; // all icons designed on a 24 × 24 grid

type MetallicGoldIconSkiaProps = {
  /** One of the built-in icon names, or omit and pass svgPath instead */
  name?: keyof typeof ICON_PATHS;
  /** Raw SVG path string (overrides name) */
  svgPath?: string;
  /** Rendered size */
  size?: number;
  /** When true, adds a soft gold glow behind the icon */
  glow?: boolean;
  style?: ViewStyle;
};

export default function MetallicGoldIconSkia({
  name = 'sparkle',
  svgPath,
  size = 24,
  glow = false,
  style,
}: MetallicGoldIconSkiaProps) {
  const rawPath = svgPath ?? ICON_PATHS[name] ?? ICON_PATHS.sparkle;
  const scale = size / VIEWBOX;

  const skiaPath = useMemo(() => {
    const p = Skia.Path.MakeFromSVGString(rawPath);
    if (!p) return Skia.Path.Make();
    return p;
  }, [rawPath]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale }]}>
          {/* Optional glow */}
          {glow && (
            <Path path={skiaPath} style="fill" color={METALLIC_GOLD.glow}>
              <BlurMask blur={6} style="solid" />
            </Path>
          )}

          {/* 1. Dark under-stroke for depth */}
          <Path
            path={skiaPath}
            style="stroke"
            strokeWidth={2}
            color={METALLIC_GOLD.deepShadow}
          />

          {/* 2. Metallic gradient main stroke */}
          <Path path={skiaPath} style="stroke" strokeWidth={1.4}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(VIEWBOX, VIEWBOX)}
              colors={[
                METALLIC_GOLD.highlight1,
                METALLIC_GOLD.light,
                METALLIC_GOLD.mid,
                METALLIC_GOLD.shadow1,
                METALLIC_GOLD.light,
                METALLIC_GOLD.highlight2,
              ]}
              positions={[0, 0.18, 0.38, 0.58, 0.78, 1]}
            />
          </Path>

          {/* 3. Metallic gradient fill */}
          <Path path={skiaPath} style="fill">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(VIEWBOX, VIEWBOX)}
              colors={[
                METALLIC_GOLD.highlight1,
                METALLIC_GOLD.light,
                METALLIC_GOLD.mid,
                METALLIC_GOLD.shadow1,
                METALLIC_GOLD.light,
                METALLIC_GOLD.highlight2,
              ]}
              positions={[0, 0.18, 0.38, 0.58, 0.78, 1]}
            />
          </Path>

          {/* 4. Thin bright highlight edge */}
          <Path
            path={skiaPath}
            style="stroke"
            strokeWidth={0.5}
            color="rgba(255,248,220,0.45)"
          />
        </Group>
      </Canvas>
    </View>
  );
}
