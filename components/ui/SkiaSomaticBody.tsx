/**
 * components/ui/SkiaSomaticBody.tsx
 * MySky — Interactive Skia body map for somatic emotion logging.
 *
 * Architecture:
 *   • Full @shopify/react-native-skia Canvas — GPU-rendered silhouette, zero JS bridge during animation
 *   • Per-region layered rendering:
 *       ghost base → heat fill (sage tint) → selection fill (emotion color) → selection glow (BlurMask)
 *       → pulse bloom ring (BlurMask, high-heat only) → centroid activity dot
 *   • Selection transitions: withTiming on SharedValue → smooth UI-thread opacity fade
 *   • Heat map: sage tint opacity ∝ log frequency, animates with withTiming when new entries arrive
 *   • Pulse bloom: expanding Circle + BlurMask for regions above 50% of max frequency
 *   • Emotion color: React state prop; color updates on re-render, opacity transitions on UI thread
 *   • Tap handling: transparent Pressable hit-zone overlays (bounding boxes in natural coords × SCALE)
 *   • Legend column: React Native Pressable badges with per-region heat bar
 *
 * Coordinate model:
 *   All path data and circle cx/cy are defined in a 200×420 natural space.
 *   A <Group transform={[{scale: SCALE}]}> maps natural → canvas pixels.
 *   BlurMask blur values are in canvas pixels (device space, unaffected by Group scale).
 */

import React, { useEffect, useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ── Sizing ─────────────────────────────────────────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');

/** Natural coordinate space all path data is authored in. */
const NAT_W = 200;
const NAT_H = 420;

/**
 * Canvas width: ~46% of screen capped at 210 dp so the layout holds on iPad.
 * The legend column occupies the remaining width.
 */
const CANVAS_W = Math.min(Math.round(SCREEN_W * 0.46), 210);
const CANVAS_H = Math.round(CANVAS_W * (NAT_H / NAT_W));

/** Uniform scale from natural coords → canvas pixels. */
const SCALE = CANVAS_W / NAT_W;

// ── Palette ────────────────────────────────────────────────────────────────────
const SAGE          = '#8CBEAA';
const GHOST_FILL    = 'rgba(255,255,255,0.03)';
const GHOST_STROKE  = 'rgba(255,255,255,0.08)';
const HEAT_COLOR    = '#8CBEAA';   // same sage; opacity driven by SharedValue

// ── Region data (natural 200×420 coordinate space) ────────────────────────────
interface Region {
  id: string;
  label: string;
  icon: string;
  svgPath: string;
  cx: number;
  cy: number;
  /** Hit area in natural coords for Pressable overlays. */
  hit: { x: number; y: number; w: number; h: number };
}

const REGIONS: Region[] = [
  {
    id: 'head',
    label: 'Head & Mind',
    icon: '◉',
    svgPath:
      'M100 10 C72 10 54 28 54 52 C54 76 72 94 100 94 C128 94 146 76 146 52 C146 28 128 10 100 10 Z',
    cx: 100,
    cy: 52,
    hit: { x: 50, y: 6, w: 100, h: 92 },
  },
  {
    id: 'throat',
    label: 'Throat & Jaw',
    icon: '◎',
    svgPath:
      'M82 94 L82 120 Q100 128 118 120 L118 94 Q100 102 82 94 Z',
    cx: 100,
    cy: 110,
    hit: { x: 76, y: 90, w: 48, h: 44 },
  },
  {
    id: 'chest',
    label: 'Chest & Heart',
    icon: '♡',
    svgPath:
      'M60 120 Q56 124 52 130 L52 210 Q76 218 100 218 Q124 218 148 210 L148 130 Q144 124 140 120 Q118 128 100 128 Q82 128 60 120 Z',
    cx: 100,
    cy: 170,
    // extended left/right to include upper arm tap area
    hit: { x: 22, y: 116, w: 156, h: 106 },
  },
  {
    id: 'gut',
    label: 'Gut & Belly',
    icon: '◍',
    svgPath:
      'M52 210 L52 290 Q76 298 100 298 Q124 298 148 290 L148 210 Q124 218 100 218 Q76 218 52 210 Z',
    cx: 100,
    cy: 254,
    // extended left/right to include lower arm tap area
    hit: { x: 22, y: 206, w: 156, h: 96 },
  },
  {
    id: 'back',
    label: 'Hips & Pelvis',
    icon: '⠿',
    svgPath:
      'M52 290 L52 340 Q70 352 100 352 Q130 352 148 340 L148 290 Q124 298 100 298 Q76 298 52 290 Z',
    cx: 100,
    cy: 318,
    hit: { x: 48, y: 286, w: 104, h: 70 },
  },
  {
    id: 'limbs',
    label: 'Legs',
    icon: '⊕',
    svgPath:
      'M70 352 L58 410 L80 410 L100 368 L120 410 L142 410 L130 352 Q115 358 100 358 Q85 358 70 352 Z',
    cx: 100,
    cy: 385,
    hit: { x: 54, y: 348, w: 92, h: 76 },
  },
];

/** Exported so somatic-map.tsx can compute heatmap entry counts by region ID. */
export const SOMATIC_REGION_IDS = REGIONS.map((r) => r.id);

/** Region label lookup for history entries. */
export const SOMATIC_REGION_LABEL: Record<string, string> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r.label]),
);

// ── Ghost silhouette single compound path ─────────────────────────────────────
const GHOST_DATA =
  // Head
  'M100 10 C72 10 54 28 54 52 C54 76 72 94 100 94 C128 94 146 76 146 52 C146 28 128 10 100 10 Z ' +
  // Neck
  'M82 94 L82 120 Q100 128 118 120 L118 94 Q100 102 82 94 Z ' +
  // Torso
  'M60 120 Q56 124 52 130 L52 340 Q70 352 100 352 Q130 352 148 340 L148 130 Q144 124 140 120 Q118 128 100 128 Q82 128 60 120 Z ' +
  // Left arm
  'M52 130 Q36 132 28 150 L22 256 Q24 284 34 310 L44 308 Q50 282 52 256 L60 148 Z ' +
  // Right arm
  'M148 130 Q164 132 172 150 L178 256 Q176 284 166 310 L156 308 Q150 282 148 256 L140 148 Z ' +
  // Legs
  'M70 352 L58 420 L80 420 L100 368 L120 420 L142 420 L130 352 Q115 358 100 358 Q85 358 70 352 Z';

// ── Sparkle burst constants ────────────────────────────────────────────────────
/** Number of particles in the radial burst. */
const SPARKLE_COUNT = 8;
/** Pre-computed angle offsets for sparkle particles (evenly spaced with jitter). */
const SPARKLE_ANGLES = Array.from({ length: SPARKLE_COUNT }, (_, i) => {
  const base = (i / SPARKLE_COUNT) * Math.PI * 2;
  // Deterministic jitter so it looks organic but stays stable between re-renders.
  return base + (i % 3 === 0 ? 0.15 : i % 3 === 1 ? -0.1 : 0.05);
});

// ── Component interface ────────────────────────────────────────────────────────
interface SkiaSomaticBodyProps {
  regionCounts: Record<string, number>;
  maxCount: number;
  selectedRegion: string | null;
  emotionColor: string;
  onRegionPress: (id: string) => void;
  /** Region ID to play a sparkle burst on (set after logging an entry). */
  sparkleRegion?: string | null;
  /** Color for sparkle particles. */
  sparkleColor?: string;
  /** Called once the sparkle animation finishes so the parent can clear state. */
  onSparkleComplete?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function SkiaSomaticBody({
  regionCounts,
  maxCount,
  selectedRegion,
  emotionColor,
  onRegionPress,
  sparkleRegion = null,
  sparkleColor = SAGE,
  onSparkleComplete,
}: SkiaSomaticBodyProps) {

  // Precompute Skia paths from SVG strings — stable, never changes
  const skiaPaths = useMemo(() =>
    REGIONS.reduce<Record<string, ReturnType<typeof Skia.Path.MakeFromSVGString>>>((acc, r) => {
      acc[r.id] = Skia.Path.MakeFromSVGString(r.svgPath);
      return acc;
    }, {}),
  []);

  const ghostPath = useMemo(() => Skia.Path.MakeFromSVGString(GHOST_DATA), []);

  // ── Heat opacity SharedValues (one per region) ───────────────────────────────
  // Values 0→1 proportional to that region's share of the max logged count.
  // Animated with withTiming so new entries bloom in gently.
  const heat0 = useSharedValue(0);
  const heat1 = useSharedValue(0);
  const heat2 = useSharedValue(0);
  const heat3 = useSharedValue(0);
  const heat4 = useSharedValue(0);
  const heat5 = useSharedValue(0);

  useEffect(() => {
    const svs = [heat0, heat1, heat2, heat3, heat4, heat5];
    REGIONS.forEach((r, i) => {
      svs[i].value = withTiming(regionCounts[r.id] / maxCount, {
        duration: 700,
        easing: Easing.out(Easing.quad),
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionCounts, maxCount]);

  // ── Selection SharedValues (one per region) ──────────────────────────────────
  // 0 = unselected, 1 = selected — withTiming for smooth UI-thread fade.
  const sel0 = useSharedValue(0);
  const sel1 = useSharedValue(0);
  const sel2 = useSharedValue(0);
  const sel3 = useSharedValue(0);
  const sel4 = useSharedValue(0);
  const sel5 = useSharedValue(0);

  useEffect(() => {
    const svs = [sel0, sel1, sel2, sel3, sel4, sel5];
    REGIONS.forEach((r, i) => {
      svs[i].value = withTiming(selectedRegion === r.id ? 1 : 0, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion]);

  // ── Pulse SharedValues (one per region) ──────────────────────────────────────
  // 0→1 repeating expand-fade for regions with heat > 0.5.
  const pulse0 = useSharedValue(0);
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const pulse3 = useSharedValue(0);
  const pulse4 = useSharedValue(0);
  const pulse5 = useSharedValue(0);

  useEffect(() => {
    const svs   = [pulse0, pulse1, pulse2, pulse3, pulse4, pulse5];
    const heats = [heat0,  heat1,  heat2,  heat3,  heat4,  heat5];
    REGIONS.forEach((r, i) => {
      const heat = regionCounts[r.id] / maxCount;
      if (heat > 0.45) {
        svs[i].value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 0 }),
          ),
          -1,
          false,
        );
      } else {
        svs[i].value = withTiming(0, { duration: 400 });
      }
      void heats[i]; // reference to satisfy lint; heats are already updated above
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionCounts, maxCount]);

  // ── Derived values ────────────────────────────────────────────────────────────
  // Heat fill opacity (sage tint layer, proportional to frequency)
  const hOp0 = useDerivedValue(() => heat0.value * 0.50);
  const hOp1 = useDerivedValue(() => heat1.value * 0.50);
  const hOp2 = useDerivedValue(() => heat2.value * 0.50);
  const hOp3 = useDerivedValue(() => heat3.value * 0.50);
  const hOp4 = useDerivedValue(() => heat4.value * 0.50);
  const hOp5 = useDerivedValue(() => heat5.value * 0.50);
  const hOps = [hOp0, hOp1, hOp2, hOp3, hOp4, hOp5];

  // Selection fill opacity (emotion color layer)
  const sFill0 = useDerivedValue(() => sel0.value * 0.45);
  const sFill1 = useDerivedValue(() => sel1.value * 0.45);
  const sFill2 = useDerivedValue(() => sel2.value * 0.45);
  const sFill3 = useDerivedValue(() => sel3.value * 0.45);
  const sFill4 = useDerivedValue(() => sel4.value * 0.45);
  const sFill5 = useDerivedValue(() => sel5.value * 0.45);
  const sFills = [sFill0, sFill1, sFill2, sFill3, sFill4, sFill5];

  // Selection glow opacity (emotion color + BlurMask layer)
  const sGlow0 = useDerivedValue(() => sel0.value * 0.72);
  const sGlow1 = useDerivedValue(() => sel1.value * 0.72);
  const sGlow2 = useDerivedValue(() => sel2.value * 0.72);
  const sGlow3 = useDerivedValue(() => sel3.value * 0.72);
  const sGlow4 = useDerivedValue(() => sel4.value * 0.72);
  const sGlow5 = useDerivedValue(() => sel5.value * 0.72);
  const sGlows = [sGlow0, sGlow1, sGlow2, sGlow3, sGlow4, sGlow5];

  // Pulse bloom radius (natural coords, scaled by Group transform on screen)
  const pR0 = useDerivedValue(() => 5 + pulse0.value * 13);
  const pR1 = useDerivedValue(() => 5 + pulse1.value * 13);
  const pR2 = useDerivedValue(() => 5 + pulse2.value * 13);
  const pR3 = useDerivedValue(() => 5 + pulse3.value * 13);
  const pR4 = useDerivedValue(() => 5 + pulse4.value * 13);
  const pR5 = useDerivedValue(() => 5 + pulse5.value * 13);
  const pRs = [pR0, pR1, pR2, pR3, pR4, pR5];

  // Pulse bloom opacity (fade as it expands; gated on heat > threshold)
  const pOp0 = useDerivedValue(() => (1 - pulse0.value) * 0.60 * Math.min(heat0.value * 2.2, 1));
  const pOp1 = useDerivedValue(() => (1 - pulse1.value) * 0.60 * Math.min(heat1.value * 2.2, 1));
  const pOp2 = useDerivedValue(() => (1 - pulse2.value) * 0.60 * Math.min(heat2.value * 2.2, 1));
  const pOp3 = useDerivedValue(() => (1 - pulse3.value) * 0.60 * Math.min(heat3.value * 2.2, 1));
  const pOp4 = useDerivedValue(() => (1 - pulse4.value) * 0.60 * Math.min(heat4.value * 2.2, 1));
  const pOp5 = useDerivedValue(() => (1 - pulse5.value) * 0.60 * Math.min(heat5.value * 2.2, 1));
  const pOps = [pOp0, pOp1, pOp2, pOp3, pOp4, pOp5];

  // Centroid activity dot (visible when heat > 0 and not in selected state)
  const dOp0 = useDerivedValue(() => Math.min(heat0.value * 2.0, 0.80) * (1 - sel0.value));
  const dOp1 = useDerivedValue(() => Math.min(heat1.value * 2.0, 0.80) * (1 - sel1.value));
  const dOp2 = useDerivedValue(() => Math.min(heat2.value * 2.0, 0.80) * (1 - sel2.value));
  const dOp3 = useDerivedValue(() => Math.min(heat3.value * 2.0, 0.80) * (1 - sel3.value));
  const dOp4 = useDerivedValue(() => Math.min(heat4.value * 2.0, 0.80) * (1 - sel4.value));
  const dOp5 = useDerivedValue(() => Math.min(heat5.value * 2.0, 0.80) * (1 - sel5.value));
  const dOps = [dOp0, dOp1, dOp2, dOp3, dOp4, dOp5];

  // ── Sparkle burst ──────────────────────────────────────────────────────────
  // Single SharedValue 0→1 over 600ms drives all 8 particles in the burst.
  // Initialized to 1 so spkOp = (1-1)*0.85 = 0 at rest (invisible until triggered).
  const sparkProg = useSharedValue(1);
  const sparkleCx = useSharedValue(100);
  const sparkleCy = useSharedValue(100);

  useEffect(() => {
    if (!sparkleRegion) return;
    const target = REGIONS.find((r) => r.id === sparkleRegion);
    if (!target) return;
    sparkleCx.value = target.cx;
    sparkleCy.value = target.cy;
    sparkProg.value = 0;
    sparkProg.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
    const timer = setTimeout(() => {
      onSparkleComplete?.();
    }, 700);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sparkleRegion]);

  // Sparkle radii — one hook per particle (hooks cannot be called in a loop)
  const spkR0 = useDerivedValue(() => 4 + sparkProg.value * 16);
  const spkR1 = useDerivedValue(() => 4 + sparkProg.value * 18);
  const spkR2 = useDerivedValue(() => 4 + sparkProg.value * 20);
  const spkR3 = useDerivedValue(() => 4 + sparkProg.value * 22);
  const spkR4 = useDerivedValue(() => 4 + sparkProg.value * 24);
  const spkR5 = useDerivedValue(() => 4 + sparkProg.value * 26);
  const spkR6 = useDerivedValue(() => 4 + sparkProg.value * 28);
  const spkR7 = useDerivedValue(() => 4 + sparkProg.value * 30);
  // Sparkle cx per particle — must be top-level, not inside JSX or a loop
  const spkCx0 = useDerivedValue(() => sparkleCx.value + Math.cos(SPARKLE_ANGLES[0]) * spkR0.value);
  const spkCx1 = useDerivedValue(() => sparkleCx.value + Math.cos(SPARKLE_ANGLES[1]) * spkR1.value);
  const spkCx2 = useDerivedValue(() => sparkleCx.value + Math.cos(SPARKLE_ANGLES[2]) * spkR2.value);
  const spkCx3 = useDerivedValue(() => sparkleCx.value + Math.cos(SPARKLE_ANGLES[3]) * spkR3.value);
  const spkCx4 = useDerivedValue(() => sparkleCx.value + Math.cos(SPARKLE_ANGLES[4]) * spkR4.value);
  const spkCx5 = useDerivedValue(() => sparkleCx.value + Math.cos(SPARKLE_ANGLES[5]) * spkR5.value);
  const spkCx6 = useDerivedValue(() => sparkleCx.value + Math.cos(SPARKLE_ANGLES[6]) * spkR6.value);
  const spkCx7 = useDerivedValue(() => sparkleCx.value + Math.cos(SPARKLE_ANGLES[7]) * spkR7.value);
  const spkCxArr = [spkCx0, spkCx1, spkCx2, spkCx3, spkCx4, spkCx5, spkCx6, spkCx7];

  // Sparkle cy per particle
  const spkCy0 = useDerivedValue(() => sparkleCy.value + Math.sin(SPARKLE_ANGLES[0]) * spkR0.value);
  const spkCy1 = useDerivedValue(() => sparkleCy.value + Math.sin(SPARKLE_ANGLES[1]) * spkR1.value);
  const spkCy2 = useDerivedValue(() => sparkleCy.value + Math.sin(SPARKLE_ANGLES[2]) * spkR2.value);
  const spkCy3 = useDerivedValue(() => sparkleCy.value + Math.sin(SPARKLE_ANGLES[3]) * spkR3.value);
  const spkCy4 = useDerivedValue(() => sparkleCy.value + Math.sin(SPARKLE_ANGLES[4]) * spkR4.value);
  const spkCy5 = useDerivedValue(() => sparkleCy.value + Math.sin(SPARKLE_ANGLES[5]) * spkR5.value);
  const spkCy6 = useDerivedValue(() => sparkleCy.value + Math.sin(SPARKLE_ANGLES[6]) * spkR6.value);
  const spkCy7 = useDerivedValue(() => sparkleCy.value + Math.sin(SPARKLE_ANGLES[7]) * spkR7.value);
  const spkCyArr = [spkCy0, spkCy1, spkCy2, spkCy3, spkCy4, spkCy5, spkCy6, spkCy7];

  // Shared dot radius (shrinks as burst expands) + shared opacity
  const spkDotR = useDerivedValue(() => 2.5 * (1 - sparkProg.value * 0.6));
  const spkOp   = useDerivedValue(() => (1 - sparkProg.value) * 0.85);

  return (
    <View style={styles.root}>

      {/* ── Skia silhouette canvas ── */}
      <View style={{ width: CANVAS_W, height: CANVAS_H }}>
        <Canvas style={{ width: CANVAS_W, height: CANVAS_H }}>
          {/*
            Single Group transform scales all natural-space coordinates to canvas pixels.
            BlurMask blur values are specified in canvas pixels (device space) and are
            unaffected by this transform.
          */}
          <Group transform={[{ scale: SCALE }]}>

            {/* Layer 0: Ghost base silhouette */}
            {ghostPath && (
              <Path
                path={ghostPath}
                color={GHOST_FILL}
              />
            )}

            {/* Layers 1–5 per region */}
            {REGIONS.map((region, i) => {
              const skiaPath = skiaPaths[region.id];
              if (!skiaPath) return null;
              return (
                <Group key={region.id}>

                  {/* Layer 1: Heat fill — sage tint proportional to log frequency */}
                  <Path
                    path={skiaPath}
                    color={HEAT_COLOR}
                    opacity={hOps[i]}
                  />

                  {/* Layer 2: Selection fill — emotion color at 45% opacity */}
                  <Path
                    path={skiaPath}
                    color={emotionColor}
                    opacity={sFills[i]}
                  />

                  {/* Layer 3: Selection glow — emotion color behind soft blur */}
                  <Path
                    path={skiaPath}
                    color={emotionColor}
                    opacity={sGlows[i]}
                  >
                    {/*
                      blur is in canvas pixels (device space).
                      14 canvas px = soft luminous halo around selected region.
                    */}
                    <BlurMask blur={14} style="solid" />
                  </Path>

                  {/* Layer 4: Pulse bloom ring — expands + fades for high-heat regions */}
                  <Circle
                    cx={region.cx}
                    cy={region.cy}
                    r={pRs[i]}
                    color={SAGE}
                    opacity={pOps[i]}
                  >
                    <BlurMask blur={6} style="normal" />
                  </Circle>

                  {/* Layer 5: Centroid activity dot — static sage dot when heat > 0 */}
                  <Circle
                    cx={region.cx}
                    cy={region.cy}
                    r={3}
                    color={SAGE}
                    opacity={dOps[i]}
                  />

                </Group>
              );
            })}

            {/* Layer 6: Sparkle burst — radial particle bloom on log.
                Always rendered (never conditional) so hook count stays stable.
                spkOp = 0 at rest (sparkProg initialised to 1). */}
            {SPARKLE_ANGLES.map((_angle, idx) => (
              <Circle
                key={`sparkle-${idx}`}
                cx={spkCxArr[idx]}
                cy={spkCyArr[idx]}
                r={spkDotR}
                color={sparkleColor}
                opacity={spkOp}
              >
                <BlurMask blur={3} style="normal" />
              </Circle>
            ))}

            {/* Ghost stroke on top so it reads over heat fills */}
            {ghostPath && (
              <Path
                path={ghostPath}
                color={GHOST_STROKE}
                style="stroke"
                strokeWidth={1 / SCALE}
              />
            )}

          </Group>
        </Canvas>

        {/* Transparent Pressable hit zones aligned to each region */}
        {REGIONS.map((region) => (
          <Pressable
            key={region.id}
            style={[
              styles.hitZone,
              {
                left:   region.hit.x * SCALE,
                top:    region.hit.y * SCALE,
                width:  region.hit.w * SCALE,
                height: region.hit.h * SCALE,
              },
            ]}
            hitSlop={8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onRegionPress(region.id);
            }}
          />
        ))}
      </View>

      {/* ── Legend column ── */}
      <View style={styles.legend}>
        {REGIONS.map((r) => {
          const heat       = regionCounts[r.id] / maxCount;
          const isSelected = selectedRegion === r.id;
          return (
            <Pressable
              key={r.id}
              style={[styles.legendBadge, isSelected && styles.legendBadgeSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onRegionPress(r.id);
              }}
            >
              <Text style={[styles.legendIcon, isSelected && { color: SAGE }]}>
                {r.icon}
              </Text>
              <Text style={[styles.legendLabel, isSelected && { color: SAGE }]}>
                {r.label}
              </Text>
              {heat > 0 && (
                <View
                  style={[
                    styles.heatBar,
                    { width: `${Math.round(heat * 100)}%` as unknown as number },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  hitZone: {
    position: 'absolute',
  },
  legend: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: 6,
    alignSelf: 'center',
  },
  legendBadge: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.025)',
    overflow: 'hidden',
  },
  legendBadgeSelected: {
    borderColor: 'rgba(140,190,170,0.5)',
    backgroundColor: 'rgba(140,190,170,0.08)',
  },
  legendIcon: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.30)',
    marginBottom: 2,
  },
  legendLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.38)',
    lineHeight: 14,
  },
  heatBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: '#8CBEAA',
    opacity: 0.55,
    borderRadius: 1,
  },
});
