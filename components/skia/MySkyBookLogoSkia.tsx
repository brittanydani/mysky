import React, { memo, useMemo } from 'react';
import { ViewStyle } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import { metallicStopsHero, metallicPositionsHero, metallicStopsStar, metallicPositionsStar } from '@/constants/mySkyMetallic';

// ── helpers ─────────────────────────────────────────────────────────────────

function make4PointStar(cx: number, cy: number, outer: number, inner: number) {
  const p = Skia.Path.Make();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    if (i === 0) p.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    else p.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  p.close();
  return p;
}

// ── component ────────────────────────────────────────────────────────────────

type Props = {
  size?: number;
  style?: ViewStyle;
  /**
   * Fill colour for the page interiors.
   * On dark (navy) backgrounds: keep the default (near-transparent warm cream).
   * On light backgrounds: pass 'white' or '#FFFDF4'.
   */
  pageFill?: string;
};

/**
 * MySkyBookLogoSkia
 *
 * Fully vector, parametric open-book logo built in Skia.
 * Uses the shared mySkyMetallic gold system so it matches every other
 * Skia element in the app (pills, tab icons, badges, etc.).
 *
 * Geometry:
 *   - 3 page layers per side (outer = back, inner = front)
 *   - Pages fan out at the bottom (each outer layer extends further)
 *   - Spine forms a V at centre
 *   - Three 4-point sparkle stars above (left small, centre large, right medium)
 */
const MySkyBookLogoSkia = memo(function MySkyBookLogoSkia({
  size = 512,
  style,
  pageFill = 'rgba(255, 252, 240, 0.07)',
}: Props) {
  const cx = size / 2;

  // ── book geometry ──────────────────────────────────────────────────────────
  const spineTopY    = size * 0.362;
  const spineBottomY = size * 0.688;
  const strokeW      = size * 0.011;

  /**
   * Left page layers (3): index 0 = outermost / back page, 2 = innermost / front page.
   *   tlx/tly  — top-left corner
   *   blx/bly  — bottom-left corner (fan tip)
   *   bsx/bsy  — bottom point returning toward the spine
   */
  const leftLayers = useMemo(() => [
    // outermost — back
    {
      tlx: cx - size * 0.385, tly: spineTopY + size * 0.033,
      blx: cx - size * 0.415, bly: spineBottomY + size * 0.023,
      bsx: cx - size * 0.082, bsy: spineBottomY + size * 0.013,
    },
    // middle
    {
      tlx: cx - size * 0.328, tly: spineTopY + size * 0.026,
      blx: cx - size * 0.352, bly: spineBottomY + size * 0.010,
      bsx: cx - size * 0.067, bsy: spineBottomY + size * 0.004,
    },
    // innermost — front
    {
      tlx: cx - size * 0.272, tly: spineTopY + size * 0.018,
      blx: cx - size * 0.290, bly: spineBottomY - size * 0.005,
      bsx: cx - size * 0.052, bsy: spineBottomY,
    },
  ], [cx, size, spineTopY, spineBottomY]);

  const leftPaths = useMemo(() =>
    leftLayers.map(l => {
      const p = Skia.Path.Make();
      p.moveTo(cx, spineTopY);
      p.lineTo(l.tlx, l.tly);
      p.lineTo(l.blx, l.bly);
      p.lineTo(l.bsx, l.bsy);
      p.lineTo(cx, spineBottomY);
      p.close();
      return p;
    }),
    [leftLayers, cx, spineTopY, spineBottomY]
  );

  const rightPaths = useMemo(() => {
    const mir = (x: number) => size - x;
    return leftLayers.map(l => {
      const p = Skia.Path.Make();
      p.moveTo(cx, spineTopY);
      p.lineTo(mir(l.tlx), l.tly);
      p.lineTo(mir(l.blx), l.bly);
      p.lineTo(mir(l.bsx), l.bsy);
      p.lineTo(cx, spineBottomY);
      p.close();
      return p;
    });
  }, [leftLayers, cx, size, spineTopY, spineBottomY]);

  // ── sparkle stars ──────────────────────────────────────────────────────────
  const starCenter = useMemo(
    () => make4PointStar(cx,             size * 0.200, size * 0.040, size * 0.013),
    [cx, size]
  );
  const starLeft = useMemo(
    () => make4PointStar(cx - size * 0.124, size * 0.257, size * 0.026, size * 0.008),
    [cx, size]
  );
  const starRight = useMemo(
    () => make4PointStar(cx + size * 0.118, size * 0.261, size * 0.023, size * 0.007),
    [cx, size]
  );

  // ── gradient definitions ───────────────────────────────────────────────────
  // Book metallic: diagonal sweep left-top → right-bottom catches the same
  // light direction as the reference image.
  const bookGradStart = vec(cx - size * 0.38, spineTopY);
  const bookGradEnd   = vec(cx + size * 0.38, spineBottomY);

  const starColors    = [...metallicStopsStar];
  const starPositions = [...metallicPositionsStar];

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      {/*
       * Pages — painted back-to-front (outer first) so inner pages
       * naturally cover the centre of outer layers, exactly like fanned pages.
       */}
      {leftPaths.map((path, i) => (
        <Group key={`L${i}`}>
          {/* Subtle page interior */}
          <Path path={path} color={pageFill} style="fill" />
          {/* Metallic gold border */}
          <Path path={path} style="stroke" strokeWidth={strokeW}>
            <LinearGradient
              start={bookGradStart}
              end={bookGradEnd}
              colors={[...metallicStopsHero]}
              positions={[...metallicPositionsHero]}
            />
          </Path>
        </Group>
      ))}

      {rightPaths.map((path, i) => (
        <Group key={`R${i}`}>
          <Path path={path} color={pageFill} style="fill" />
          <Path path={path} style="stroke" strokeWidth={strokeW}>
            <LinearGradient
              start={bookGradStart}
              end={bookGradEnd}
              colors={[...metallicStopsHero]}
              positions={[...metallicPositionsHero]}
            />
          </Path>
        </Group>
      ))}

      {/* ── Stars ── */}
      <Path path={starCenter}>
        <LinearGradient
          start={vec(cx, size * 0.160)}
          end={vec(cx, size * 0.245)}
          colors={starColors}
          positions={starPositions}
        />
      </Path>
      <Path path={starLeft}>
        <LinearGradient
          start={vec(cx - size * 0.124, size * 0.231)}
          end={vec(cx - size * 0.124, size * 0.283)}
          colors={starColors}
          positions={starPositions}
        />
      </Path>
      <Path path={starRight}>
        <LinearGradient
          start={vec(cx + size * 0.118, size * 0.238)}
          end={vec(cx + size * 0.118, size * 0.287)}
          colors={starColors}
          positions={starPositions}
        />
      </Path>
    </Canvas>
  );
});

export default MySkyBookLogoSkia;
