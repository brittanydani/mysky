import React, { memo, useMemo } from 'react';
import { ViewStyle } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  Group,
  vec,
} from '@shopify/react-native-skia';
import { mySkyGold, metallicStopsSoft, metallicPositionsSoft, metallicStopsHero, metallicPositionsHero } from '@/constants/mySkyMetallic';

type Props = {
  size?: number;
  style?: ViewStyle;
};

/**
 * MySkyDiamondSkia
 *
 * Classic cut gemstone rendered with individual facets, each with its own
 * metallic gradient direction to simulate the reflective cut-diamond look.
 * Uses the shared champagne-gold metallic system.
 * Suitable for the premium / Deeper Sky screen.
 */
const MySkyDiamondSkia = memo(function MySkyDiamondSkia({ size = 512, style }: Props) {
  const cx = size / 2;

  // ── Key points ────────────────────────────────────────────────────────────
  // Table (flat top edge)
  const tY  = size * 0.185;
  const tL  = { x: cx - size * 0.220, y: tY };
  const tR  = { x: cx + size * 0.220, y: tY };
  const tCL = { x: cx - size * 0.090, y: tY }; // table mid-left (for inner facet line)
  const tCR = { x: cx + size * 0.090, y: tY }; // table mid-right

  // Crown bevel corners (between table and girdle)
  const cL  = { x: cx - size * 0.380, y: size * 0.310 };
  const cR  = { x: cx + size * 0.380, y: size * 0.310 };

  // Girdle (widest horizontal band — thin strip)
  const gY  = size * 0.415;
  const gL  = { x: cx - size * 0.390, y: gY };
  const gR  = { x: cx + size * 0.390, y: gY };

  // Pavilion mid-points (for inner facet lines)
  const pavML = { x: cx - size * 0.200, y: size * 0.600 };
  const pavMR = { x: cx + size * 0.200, y: size * 0.600 };

  // Bottom apex
  const bot  = { x: cx, y: size * 0.820 };

  // ── Facet paths ───────────────────────────────────────────────────────────
  const paths = useMemo(() => {
    const make = () => Skia.Path.Make();

    // ── Crown ──

    // Table top (flat trapezoid face — the "table" facet)
    const tableFacet = make();
    tableFacet.moveTo(tL.x, tL.y);
    tableFacet.lineTo(tR.x, tR.y);
    tableFacet.lineTo(tCR.x + size * 0.06, tY + size * 0.065);
    tableFacet.lineTo(tCL.x - size * 0.06, tY + size * 0.065);
    tableFacet.close();

    // Left crown upper (table-left → crown-left → down to table-left inner)
    const crownL = make();
    crownL.moveTo(tL.x, tY);
    crownL.lineTo(cL.x, cL.y);
    crownL.lineTo(tCL.x - size * 0.06, tY + size * 0.065);
    crownL.close();

    // Right crown upper (mirror)
    const crownR = make();
    crownR.moveTo(tR.x, tY);
    crownR.lineTo(cR.x, cR.y);
    crownR.lineTo(tCR.x + size * 0.06, tY + size * 0.065);
    crownR.close();

    // Left crown lower (crown-left → girdle-left → table-inner-area)
    const crownLLower = make();
    crownLLower.moveTo(cL.x, cL.y);
    crownLLower.lineTo(gL.x, gY);
    crownLLower.lineTo(tCL.x - size * 0.06, tY + size * 0.065);
    crownLLower.close();

    // Right crown lower (mirror)
    const crownRLower = make();
    crownRLower.moveTo(cR.x, cR.y);
    crownRLower.lineTo(gR.x, gY);
    crownRLower.lineTo(tCR.x + size * 0.06, tY + size * 0.065);
    crownRLower.close();

    // Center crown (from table center area down to girdle center)
    const crownCenter = make();
    crownCenter.moveTo(tCL.x - size * 0.06, tY + size * 0.065);
    crownCenter.lineTo(tCR.x + size * 0.06, tY + size * 0.065);
    crownCenter.lineTo(cx + size * 0.06, gY);
    crownCenter.lineTo(cx - size * 0.06, gY);
    crownCenter.close();

    // ── Pavilion ──

    // Left pavilion (girdle-left → pavML → bottom)
    const pavL = make();
    pavL.moveTo(gL.x, gY);
    pavL.lineTo(cx - size * 0.06, gY);
    pavL.lineTo(bot.x, bot.y);
    pavL.close();

    // Left outer pavilion
    const pavLOuter = make();
    pavLOuter.moveTo(gL.x, gY);
    pavLOuter.lineTo(pavML.x, pavML.y);
    pavLOuter.lineTo(bot.x, bot.y);
    pavLOuter.close();

    // Right pavilion (mirror)
    const pavR = make();
    pavR.moveTo(gR.x, gY);
    pavR.lineTo(cx + size * 0.06, gY);
    pavR.lineTo(bot.x, bot.y);
    pavR.close();

    const pavROuter = make();
    pavROuter.moveTo(gR.x, gY);
    pavROuter.lineTo(pavMR.x, pavMR.y);
    pavROuter.lineTo(bot.x, bot.y);
    pavROuter.close();

    // Center pavilion kite
    const pavCenter = make();
    pavCenter.moveTo(cx - size * 0.06, gY);
    pavCenter.lineTo(cx + size * 0.06, gY);
    pavCenter.lineTo(pavMR.x, pavMR.y);
    pavCenter.lineTo(bot.x, bot.y);
    pavCenter.lineTo(pavML.x, pavML.y);
    pavCenter.close();

    // Girdle strip (thin horizontal band between crown and pavilion)
    const girdle = make();
    girdle.moveTo(gL.x, gY - size * 0.006);
    girdle.lineTo(gR.x, gY - size * 0.006);
    girdle.lineTo(gR.x, gY + size * 0.006);
    girdle.lineTo(gL.x, gY + size * 0.006);
    girdle.close();

    return { tableFacet, crownL, crownR, crownLLower, crownRLower, crownCenter, pavL, pavLOuter, pavR, pavROuter, pavCenter, girdle };
  }, [size, cx]);

  // ── Outer silhouette (for stroke edge) ────────────────────────────────────
  const outline = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(tL.x, tY);
    p.lineTo(cL.x, cL.y);
    p.lineTo(gL.x, gY);
    p.lineTo(bot.x, bot.y);
    p.lineTo(gR.x, gY);
    p.lineTo(cR.x, cR.y);
    p.lineTo(tR.x, tY);
    p.close();
    return p;
  }, [size, cx]);

  // ── Gradient helpers ──────────────────────────────────────────────────────
  const vTop    = vec(cx, tY);
  const vBot    = vec(cx, bot.y);
  const vGirdle = vec(cx, gY);

  // Bright for table / crown highlights
  const crownColors = [mySkyGold.specular, mySkyGold.glossBright, mySkyGold.champagneLight, mySkyGold.champagne, mySkyGold.goldMid];
  const crownPos    = [0, 0.2, 0.45, 0.72, 1];

  // Darker for pavilion (light comes from above, pavilion in shadow)
  const pavColors   = [mySkyGold.champagne, mySkyGold.goldMid, mySkyGold.goldDeep, mySkyGold.shadow, mySkyGold.shadowDeep];
  const pavPos      = [0, 0.25, 0.52, 0.78, 1];

  // Girdle: bright metallic band
  const girdleColors = [...metallicStopsSoft];
  const girdlePos    = [...metallicPositionsSoft];

  const { tableFacet, crownL, crownR, crownLLower, crownRLower, crownCenter, pavL, pavLOuter, pavR, pavROuter, pavCenter, girdle } = paths;

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      {/* ── Crown facets (bright — light catches top) ── */}
      <Group>
        {/* Table — brightest facet */}
        <Path path={tableFacet}>
          <LinearGradient
            start={vec(cx, tY)}
            end={vec(cx, tY + size * 0.08)}
            colors={[mySkyGold.specular, mySkyGold.glossBright, mySkyGold.glossSoft]}
            positions={[0, 0.4, 1]}
          />
        </Path>

        {/* Left upper crown */}
        <Path path={crownL}>
          <LinearGradient
            start={vec(cx - size * 0.38, tY)}
            end={vec(cx, gY)}
            colors={crownColors}
            positions={crownPos}
          />
        </Path>

        {/* Right upper crown */}
        <Path path={crownR}>
          <LinearGradient
            start={vec(cx + size * 0.38, tY)}
            end={vec(cx, gY)}
            colors={crownColors}
            positions={crownPos}
          />
        </Path>

        {/* Left lower crown */}
        <Path path={crownLLower}>
          <LinearGradient
            start={vec(cx - size * 0.38, cL.y)}
            end={vec(cx, gY)}
            colors={[mySkyGold.champagneLight, mySkyGold.champagne, mySkyGold.goldMid, mySkyGold.goldDeep]}
            positions={[0, 0.3, 0.65, 1]}
          />
        </Path>

        {/* Right lower crown */}
        <Path path={crownRLower}>
          <LinearGradient
            start={vec(cx + size * 0.38, cR.y)}
            end={vec(cx, gY)}
            colors={[mySkyGold.champagneLight, mySkyGold.champagne, mySkyGold.goldMid, mySkyGold.goldDeep]}
            positions={[0, 0.3, 0.65, 1]}
          />
        </Path>

        {/* Center crown */}
        <Path path={crownCenter}>
          <LinearGradient
            start={vTop}
            end={vGirdle}
            colors={[mySkyGold.glossSoft, mySkyGold.champagne, mySkyGold.goldMid]}
            positions={[0, 0.5, 1]}
          />
        </Path>
      </Group>

      {/* ── Girdle strip ── */}
      <Path path={girdle}>
        <LinearGradient
          start={vec(gL.x, gY)}
          end={vec(gR.x, gY)}
          colors={girdleColors}
          positions={girdlePos}
        />
      </Path>

      {/* ── Pavilion facets (darker — in shadow) ── */}
      <Group>
        <Path path={pavL}>
          <LinearGradient start={vGirdle} end={vBot} colors={pavColors} positions={pavPos} />
        </Path>
        <Path path={pavLOuter}>
          <LinearGradient
            start={vec(gL.x, gY)}
            end={vBot}
            colors={[mySkyGold.goldMid, mySkyGold.goldDeep, mySkyGold.shadow, mySkyGold.shadowDeep]}
            positions={[0, 0.35, 0.7, 1]}
          />
        </Path>
        <Path path={pavR}>
          <LinearGradient start={vGirdle} end={vBot} colors={pavColors} positions={pavPos} />
        </Path>
        <Path path={pavROuter}>
          <LinearGradient
            start={vec(gR.x, gY)}
            end={vBot}
            colors={[mySkyGold.goldMid, mySkyGold.goldDeep, mySkyGold.shadow, mySkyGold.shadowDeep]}
            positions={[0, 0.35, 0.7, 1]}
          />
        </Path>
        <Path path={pavCenter}>
          <LinearGradient
            start={vGirdle}
            end={vBot}
            colors={[mySkyGold.champagne, mySkyGold.goldMid, mySkyGold.shadow]}
            positions={[0, 0.45, 1]}
          />
        </Path>
      </Group>

      {/* ── Facet edge lines (crisp metallic definition) ── */}
      {[tableFacet, crownL, crownR, crownLLower, crownRLower, crownCenter, pavL, pavLOuter, pavR, pavROuter, pavCenter].map(
        (p, i) => (
          <Path key={`fl-${i}`} path={p} style="stroke" strokeWidth={size * 0.004} color={mySkyGold.shadow} opacity={0.55} />
        )
      )}

      {/* ── Outer silhouette border ── */}
      <Path path={outline} style="stroke" strokeWidth={size * 0.010} color={mySkyGold.shadow} />

      {/* ── Specular highlight on table edge ── */}
      <Path path={outline} style="stroke" strokeWidth={size * 0.003} color={mySkyGold.specular} opacity={0.45} />
    </Canvas>
  );
});

export default MySkyDiamondSkia;
