import React, { memo, useMemo } from 'react';
import { ViewStyle } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  RadialGradient,
  Group,
  vec,
  Circle,
  BlurMask,
  Oval,
} from '@shopify/react-native-skia';
import { mySkyGold } from '@/constants/mySkyMetallic';

type Props = {
  size?: number;
  style?: ViewStyle;
};

// Polar → cartesian helper
const polar = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

/**
 * MySkyDiamondSkia
 *
 * Round brilliant-cut diamond viewed from above — the iconic 57-facet starburst
 * pattern with 8 star facets, 8 bezel kites, 16 upper-girdle triangles, and a
 * luminous octagonal table. Champagne-gold metallic palette with specular
 * highlights, glow halo, and sparkle stars.
 */
const MySkyDiamondSkia = memo(function MySkyDiamondSkia({ size = 512, style }: Props) {
  const cx = size / 2;
  const cy = size / 2;

  // Radii for each ring of the brilliant pattern
  const rGirdle = size * 0.43;  // outermost circle edge
  const rBezel  = size * 0.30;  // where bezel kites meet star facets
  const rTable  = size * 0.17;  // octagonal table edge

  // 8 primary directions (N, NE, E, SE, S, SW, W, NW)
  const dirs = [0, 45, 90, 135, 180, 225, 270, 315];
  // 8 intermediate directions (between primaries)
  const mids = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

  const paths = useMemo(() => {
    const make = () => Skia.Path.Make();

    // Girdle points (16 — at every 22.5°)
    const gPts = Array.from({ length: 16 }, (_, i) => polar(cx, cy, rGirdle, i * 22.5));
    // Bezel points (8 — at every 45° offset by 22.5°, i.e. between primary dirs)
    const bPts = mids.map(a => polar(cx, cy, rBezel, a));
    // Star points (8 — at primary directions, at bezel radius inset)
    const sPts = dirs.map(a => polar(cx, cy, rBezel * 0.72, a));
    // Table points (8 — octagonal)
    const tPts = dirs.map(a => polar(cx, cy, rTable, a));

    // ── Table (center octagon) ──
    const table = make();
    table.moveTo(tPts[0].x, tPts[0].y);
    for (let i = 1; i < 8; i++) table.lineTo(tPts[i].x, tPts[i].y);
    table.close();

    // ── 8 Star facets (kite from table edge → star point → table edge) ──
    const starFacets = dirs.map((_, i) => {
      const p = make();
      p.moveTo(tPts[i].x, tPts[i].y);
      p.lineTo(sPts[i].x, sPts[i].y);
      p.lineTo(tPts[(i + 1) % 8].x, tPts[(i + 1) % 8].y);
      p.close();
      return p;
    });

    // ── 8 Bezel (kite) facets — from star point → girdle primary → bezel mid → girdle primary ──
    const bezelFacets = dirs.map((_, i) => {
      const gi = i * 2; // girdle index for this primary direction
      const p = make();
      p.moveTo(sPts[i].x, sPts[i].y);
      p.lineTo(gPts[gi].x, gPts[gi].y);
      p.lineTo(bPts[i].x, bPts[i].y);
      p.close();
      return p;
    });

    // ── 8 Bezel (kite) facets — second half (mirror from bezel mid back) ──
    const bezelFacets2 = dirs.map((_, i) => {
      const gi = i * 2; // girdle index for this primary direction
      const giNext = ((i + 1) % 8) * 2;
      const p = make();
      p.moveTo(bPts[i].x, bPts[i].y);
      p.lineTo(gPts[giNext].x, gPts[giNext].y);
      p.lineTo(sPts[(i + 1) % 8].x, sPts[(i + 1) % 8].y);
      p.close();
      return p;
    });

    // ── 16 Upper girdle facets (small triangles filling between star/bezel → girdle) ──
    const girdleFacets = dirs.map((_, i) => {
      const gi = i * 2;
      const giMid = gi + 1; // the mid-girdle point between two primaries
      const p = make();
      p.moveTo(bPts[i].x, bPts[i].y);
      p.lineTo(gPts[gi].x, gPts[gi].y);
      p.lineTo(gPts[giMid].x, gPts[giMid].y);
      p.close();
      return p;
    });

    const girdleFacets2 = dirs.map((_, i) => {
      const giMid = i * 2 + 1;
      const giNext = ((i + 1) % 8) * 2;
      const p = make();
      p.moveTo(bPts[i].x, bPts[i].y);
      p.lineTo(gPts[giMid].x, gPts[giMid].y);
      p.lineTo(gPts[giNext].x, gPts[giNext].y);
      p.close();
      return p;
    });

    // Outer circle outline
    const outline = make();
    outline.addCircle(cx, cy, rGirdle);

    // Specular flash — small bright arc shape near top-right of table
    const specFlash = make();
    const sf1 = polar(cx, cy, rTable * 0.5, 310);
    const sf2 = polar(cx, cy, rTable * 0.9, 340);
    const sf3 = polar(cx, cy, rTable * 0.8, 20);
    const sf4 = polar(cx, cy, rTable * 0.3, 350);
    specFlash.moveTo(sf1.x, sf1.y);
    specFlash.lineTo(sf2.x, sf2.y);
    specFlash.lineTo(sf3.x, sf3.y);
    specFlash.lineTo(sf4.x, sf4.y);
    specFlash.close();

    // 4-point sparkle star
    const sparkle = (px: number, py: number, r: number) => {
      const p = make();
      const ir = r * 0.18;
      p.moveTo(px, py - r);
      p.lineTo(px + ir, py - ir);
      p.lineTo(px + r, py);
      p.lineTo(px + ir, py + ir);
      p.lineTo(px, py + r);
      p.lineTo(px - ir, py + ir);
      p.lineTo(px - r, py);
      p.lineTo(px - ir, py - ir);
      p.close();
      return p;
    };

    const sp1 = polar(cx, cy, rGirdle + size * 0.04, 35);
    const sp2 = polar(cx, cy, rGirdle + size * 0.02, 195);
    const sp3 = polar(cx, cy, rGirdle * 0.7, 320);
    const star1 = sparkle(sp1.x, sp1.y, size * 0.04);
    const star2 = sparkle(sp2.x, sp2.y, size * 0.022);
    const star3 = sparkle(sp3.x, sp3.y, size * 0.015);

    return {
      table, starFacets, bezelFacets, bezelFacets2,
      girdleFacets, girdleFacets2, outline,
      specFlash, star1, star2, star3,
      gPts, bPts, sPts, tPts,
    };
  }, [size, cx, cy, rGirdle, rBezel, rTable]);

  const {
    table, starFacets, bezelFacets, bezelFacets2,
    girdleFacets, girdleFacets2, outline,
    specFlash, star1, star2, star3,
    gPts, bPts, sPts, tPts,
  } = paths;

  // Per-facet gradient colors — alternate between brighter / deeper to simulate
  // the light/dark pattern visible in a real brilliant cut
  const brightKite  = [mySkyGold.glossBright, mySkyGold.champagneLight, mySkyGold.champagne, mySkyGold.goldMid];
  const brightPos   = [0, 0.3, 0.65, 1];
  const darkKite    = [mySkyGold.goldMid, mySkyGold.goldDeep, mySkyGold.shadow, mySkyGold.shadowDeep];
  const darkPos     = [0, 0.35, 0.7, 1];
  const midKite     = [mySkyGold.champagne, mySkyGold.goldMid, mySkyGold.goldDeep, mySkyGold.shadow];
  const midPos      = [0, 0.3, 0.6, 1];

  // Assign alternating brightness to 8 sectors
  const sectorStyle = (i: number) => {
    const mod = i % 4;
    if (mod === 0) return { colors: brightKite, positions: brightPos };
    if (mod === 2) return { colors: darkKite, positions: darkPos };
    return { colors: midKite, positions: midPos };
  };

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      {/* ── Radial glow halo ── */}
      <Group opacity={0.38}>
        <Circle cx={cx} cy={cy} r={rGirdle * 1.25}>
          <RadialGradient
            c={vec(cx, cy)}
            r={rGirdle * 1.25}
            colors={[mySkyGold.champagne, mySkyGold.goldDeep, 'transparent']}
            positions={[0, 0.4, 1]}
          />
          <BlurMask blur={size * 0.06} style="normal" />
        </Circle>
      </Group>

      {/* ── Upper girdle facets (outermost small triangles) ── */}
      <Group>
        {girdleFacets.map((p, i) => {
          const gi = i * 2;
          const giMid = gi + 1;
          const s = sectorStyle(i);
          return (
            <Path key={`gf1-${i}`} path={p}>
              <LinearGradient
                start={vec(gPts[gi].x, gPts[gi].y)}
                end={vec(bPts[i].x, bPts[i].y)}
                colors={s.colors}
                positions={s.positions}
              />
            </Path>
          );
        })}
        {girdleFacets2.map((p, i) => {
          const giMid = i * 2 + 1;
          const s = sectorStyle((i + 1) % 8);
          return (
            <Path key={`gf2-${i}`} path={p}>
              <LinearGradient
                start={vec(gPts[giMid].x, gPts[giMid].y)}
                end={vec(bPts[i].x, bPts[i].y)}
                colors={s.colors}
                positions={s.positions}
              />
            </Path>
          );
        })}
      </Group>

      {/* ── Bezel kite facets (mid ring) ── */}
      <Group>
        {bezelFacets.map((p, i) => {
          const gi = i * 2;
          const s = sectorStyle(i);
          return (
            <Path key={`bf1-${i}`} path={p}>
              <LinearGradient
                start={vec(gPts[gi].x, gPts[gi].y)}
                end={vec(sPts[i].x, sPts[i].y)}
                colors={s.colors}
                positions={s.positions}
              />
            </Path>
          );
        })}
        {bezelFacets2.map((p, i) => {
          const giNext = ((i + 1) % 8) * 2;
          const s = sectorStyle((i + 1) % 8);
          return (
            <Path key={`bf2-${i}`} path={p}>
              <LinearGradient
                start={vec(gPts[giNext].x, gPts[giNext].y)}
                end={vec(sPts[(i + 1) % 8].x, sPts[(i + 1) % 8].y)}
                colors={s.colors}
                positions={s.positions}
              />
            </Path>
          );
        })}
      </Group>

      {/* ── Star facets (inner ring — 8 triangles radiating from table) ── */}
      <Group>
        {starFacets.map((p, i) => {
          // Star facets alternate bright/dark opposite to bezel for contrast
          const s = sectorStyle((i + 2) % 4 === 0 ? i : i + 1);
          return (
            <Path key={`sf-${i}`} path={p}>
              <LinearGradient
                start={vec(tPts[i].x, tPts[i].y)}
                end={vec(sPts[i].x, sPts[i].y)}
                colors={s.colors}
                positions={s.positions}
              />
            </Path>
          );
        })}
      </Group>

      {/* ── Table (center octagon — brightest, specular) ── */}
      <Path path={table}>
        <RadialGradient
          c={vec(cx - size * 0.02, cy - size * 0.03)}
          r={rTable * 1.1}
          colors={[mySkyGold.specular, mySkyGold.glossBright, mySkyGold.champagneLight, mySkyGold.champagne]}
          positions={[0, 0.25, 0.6, 1]}
        />
      </Path>

      {/* ── Facet edge lines ── */}
      <Group opacity={0.18}>
        {starFacets.map((p, i) => (
          <Path key={`sfe-${i}`} path={p} style="stroke" strokeWidth={size * 0.002} color={mySkyGold.goldMid} />
        ))}
        {bezelFacets.map((p, i) => (
          <Path key={`bfe1-${i}`} path={p} style="stroke" strokeWidth={size * 0.002} color={mySkyGold.goldMid} />
        ))}
        {bezelFacets2.map((p, i) => (
          <Path key={`bfe2-${i}`} path={p} style="stroke" strokeWidth={size * 0.002} color={mySkyGold.goldMid} />
        ))}
        {girdleFacets.map((p, i) => (
          <Path key={`gfe1-${i}`} path={p} style="stroke" strokeWidth={size * 0.0015} color={mySkyGold.goldMid} />
        ))}
        {girdleFacets2.map((p, i) => (
          <Path key={`gfe2-${i}`} path={p} style="stroke" strokeWidth={size * 0.0015} color={mySkyGold.goldMid} />
        ))}
      </Group>

      {/* Table edge — slightly more visible */}
      <Path path={table} style="stroke" strokeWidth={size * 0.003} color={mySkyGold.champagne} opacity={0.25} />

      {/* ── Outer girdle ring ── */}
      <Path path={outline} style="stroke" strokeWidth={size * 0.005} color={mySkyGold.goldDeep} opacity={0.65} />
      <Path path={outline} style="stroke" strokeWidth={size * 0.002} color={mySkyGold.glossBright} opacity={0.35} />

      {/* ── Specular flash on table ── */}
      <Path path={specFlash} color="white" opacity={0.40} />

      {/* ── Inner light bloom ── */}
      <Group opacity={0.14}>
        <Circle cx={cx - size * 0.02} cy={cy - size * 0.03} r={rTable * 0.7}>
          <RadialGradient
            c={vec(cx - size * 0.02, cy - size * 0.03)}
            r={rTable * 0.7}
            colors={['white', 'transparent']}
            positions={[0, 1]}
          />
        </Circle>
      </Group>

      {/* ── Sparkle stars ── */}
      <Group>
        <Path path={star1}>
          <LinearGradient
            start={vec(paths.gPts[0].x - size * 0.04, paths.gPts[0].y)}
            end={vec(paths.gPts[0].x + size * 0.04, paths.gPts[0].y)}
            colors={[mySkyGold.specular, mySkyGold.glossBright, mySkyGold.champagne]}
            positions={[0, 0.4, 1]}
          />
        </Path>
        <Path path={star2} opacity={0.5}>
          <LinearGradient
            start={vec(paths.gPts[8].x - size * 0.02, paths.gPts[8].y)}
            end={vec(paths.gPts[8].x + size * 0.02, paths.gPts[8].y)}
            colors={[mySkyGold.specular, mySkyGold.glossBright, mySkyGold.champagne]}
            positions={[0, 0.4, 1]}
          />
        </Path>
        <Path path={star3} opacity={0.4}>
          <LinearGradient
            start={vec(cx + size * 0.12, cy - size * 0.10)}
            end={vec(cx + size * 0.16, cy - size * 0.06)}
            colors={[mySkyGold.specular, mySkyGold.glossBright, mySkyGold.champagne]}
            positions={[0, 0.4, 1]}
          />
        </Path>
      </Group>
    </Canvas>
  );
});

export default MySkyDiamondSkia;
