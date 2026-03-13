/**
 * components/ui/OrbitalPatternsMap.tsx
 * MySky — Orbital Patterns Orrery (Pure Skia — 120fps UI thread)
 *
 * Architecture:
 *   • 5 perspective-projected elliptical rings drawn as <Oval>
 *   • Orbital node per ring — kinematic dot traveling the ellipse at 60-120fps
 *   • Depth simulation: sin(angle) drives scale (0.4→1.0) + opacity (0.3→1.0)
 *   • Central stellar core: 4 concentric blurred circles, blendMode="screen"
 *   • Sparse starfield via <Points>
 *   • All animation driven by Reanimated useDerivedValue on the UI thread
 *   • No React Three Fiber · No THREE · Pure @shopify/react-native-skia
 */

import React, { useEffect, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Oval,
  Points,
  Group,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Ring definitions (rx uses SCREEN_W, ry uses a fraction of rx) ────────────
// Speeds chosen so orbital periods are multiples of 2π — seamless wrap at t=2π×100

interface RingDef {
  rx:        number;   // horizontal orbital radius (px)
  ry:        number;   // vertical orbital radius (px) — creates perspective tilt
  color:     string;   // ring stroke color
  nodeColor: string;   // node glow color
  speed:     number;   // angular speed (rad/s)
  phase:     number;   // initial phase offset (rad)
  opacity:   number;   // ring stroke opacity
  baseR:     number;   // base node radius at full depth
}

const _RINGS: Omit<RingDef, 'rx' | 'ry' | 'baseR'>[] = [
  { color: '#FFD460', nodeColor: '#FFF8C0', speed: 0.65, phase: 0.00, opacity: 0.52 },
  { color: '#20FFF0', nodeColor: '#B0FFF8', speed: 0.42, phase: 1.05, opacity: 0.40 },
  { color: '#9B6FFF', nodeColor: '#D4C4FF', speed: 0.28, phase: 2.09, opacity: 0.34 },
  { color: '#FF6BA8', nodeColor: '#FFD0E6', speed: 0.19, phase: 0.52, opacity: 0.26 },
  { color: '#7BB8F8', nodeColor: '#CBE8FF', speed: 0.12, phase: 1.57, opacity: 0.20 },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export interface OrbitalPatternsMapProps {
  height?: number;
}

export function OrbitalPatternsMap({ height = 300 }: OrbitalPatternsMapProps) {
  const { cx, cy, rings, starPts } = useMemo(() => {
    const cx = SCREEN_W / 2;
    const cy = height   / 2;
    const rings: RingDef[] = _RINGS.map((r, i) => ({
      ...r,
      rx:    Math.round(SCREEN_W * (0.215 + i * 0.045)),
      ry:    Math.round(height   * (0.092 + i * 0.038)),
      baseR: Math.round(SCREEN_W * 0.018),
    }));

    // Fibonacci-scattered starfield (2D projection)
    const starPts: { x: number; y: number }[] = [];
    for (let i = 0; i < 180; i++) {
      const angle = (i / 180) * Math.PI * 2 * 7.3;
      const dist  = height * 0.12 + (i % 9) * height * 0.035;
      starPts.push({
        x: cx + Math.cos(angle) * dist * (1 + (i % 5) * 0.2),
        y: cy + Math.sin(angle) * dist * 0.7,
      });
    }
    return { cx, cy, rings, starPts };
  }, [height]);

  // Continuously incrementing clock on the UI thread
  // 2π×100 period ensures sin/cos wraps seamlessly (all speeds are multiples of 0.01)
  const clock = useSharedValue(0);
  useEffect(() => {
    clock.value = withRepeat(
      withTiming(Math.PI * 2 * 100, { duration: 400_000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => { clock.value = 0; };
  }, []);

  // All 5 orbital node positions + depth values — one worklet for the batch
  const allPos = useDerivedValue(() => {
    const t = clock.value;
    return rings.map(ring => {
      const angle = t * ring.speed + ring.phase;
      const depth = Math.sin(angle); // -1 (far) → +1 (near)
      return {
        x:     cx + ring.rx * Math.cos(angle),
        y:     cy + ring.ry * Math.sin(angle),
        scale: 0.38 + (1 + depth) * 0.31,  // 0.38→1.0
        alpha: 0.28 + (1 + depth) * 0.36,  // 0.28→1.0
      };
    });
  });

  // Extract per-ring values — Reanimated auto-tracks allPos as dependency
  const n0cx    = useDerivedValue(() => allPos.value[0].x);
  const n0cy    = useDerivedValue(() => allPos.value[0].y);
  const n0r     = useDerivedValue(() => allPos.value[0].scale * rings[0].baseR);
  const n0alpha = useDerivedValue(() => allPos.value[0].alpha);

  const n1cx    = useDerivedValue(() => allPos.value[1].x);
  const n1cy    = useDerivedValue(() => allPos.value[1].y);
  const n1r     = useDerivedValue(() => allPos.value[1].scale * rings[1].baseR);
  const n1alpha = useDerivedValue(() => allPos.value[1].alpha);

  const n2cx    = useDerivedValue(() => allPos.value[2].x);
  const n2cy    = useDerivedValue(() => allPos.value[2].y);
  const n2r     = useDerivedValue(() => allPos.value[2].scale * rings[2].baseR);
  const n2alpha = useDerivedValue(() => allPos.value[2].alpha);

  const n3cx    = useDerivedValue(() => allPos.value[3].x);
  const n3cy    = useDerivedValue(() => allPos.value[3].y);
  const n3r     = useDerivedValue(() => allPos.value[3].scale * rings[3].baseR);
  const n3alpha = useDerivedValue(() => allPos.value[3].alpha);

  const n4cx    = useDerivedValue(() => allPos.value[4].x);
  const n4cy    = useDerivedValue(() => allPos.value[4].y);
  const n4r     = useDerivedValue(() => allPos.value[4].scale * rings[4].baseR);
  const n4alpha = useDerivedValue(() => allPos.value[4].alpha);

  // All 5 node positions as a SkPoint[] for the outer glow Points layer
  const glowPts = useDerivedValue<{ x: number; y: number }[]>(() =>
    allPos.value.map(p => ({ x: p.x, y: p.y }))
  );

  const nSets = [
    { cx: n0cx, cy: n0cy, r: n0r, a: n0alpha, nc: rings[0]?.nodeColor ?? '#FFF' },
    { cx: n1cx, cy: n1cy, r: n1r, a: n1alpha, nc: rings[1]?.nodeColor ?? '#FFF' },
    { cx: n2cx, cy: n2cy, r: n2r, a: n2alpha, nc: rings[2]?.nodeColor ?? '#FFF' },
    { cx: n3cx, cy: n3cy, r: n3r, a: n3alpha, nc: rings[3]?.nodeColor ?? '#FFF' },
    { cx: n4cx, cy: n4cy, r: n4r, a: n4alpha, nc: rings[4]?.nodeColor ?? '#FFF' },
  ];

  return (
    <View style={{ height, width: '100%' }}>
      <Canvas style={{ flex: 1 }}>

        {/* ── Background starfield ── */}
        <Points points={starPts} mode="points" color="#8898B8" strokeWidth={1.4} opacity={0.42} />

        {/* ── Elliptical orbital rings ── */}
        {rings.map((ring, i) => (
          <Oval
            key={i}
            x={cx - ring.rx}
            y={cy - ring.ry}
            width={ring.rx * 2}
            height={ring.ry * 2}
            style="stroke"
            strokeWidth={1.2}
            color={ring.color}
            opacity={ring.opacity}
          />
        ))}

        {/* ── Central stellar core — 4 concentric light-emitting circles ── */}
        <Circle cx={cx} cy={cy} r={52} color="#FFE080" opacity={0.05} blendMode="screen" />
        <Circle cx={cx} cy={cy} r={36} color="#FFD460" opacity={0.11} blendMode="screen" />
        <Circle cx={cx} cy={cy} r={22} color="#FFF0A0" opacity={0.30} blendMode="screen">
          <BlurMask blur={6} style="solid" />
        </Circle>
        <Circle cx={cx} cy={cy} r={9}  color="#FFFEF8" opacity={0.94} />

        {/* ── Outer glow aura — all 5 nodes as a single Points draw ── */}
        <Group opacity={0.10}>
          <Points points={glowPts} mode="points" color="#FFFFFF" strokeWidth={28}>
            <BlurMask blur={16} style="solid" />
          </Points>
        </Group>

        {/* ── Per-node animated core circles with depth scale + opacity ── */}
        {nSets.map((n, i) => (
          <Group key={i} opacity={n.a}>
            {/* Outer haze */}
            <Circle cx={n.cx} cy={n.cy} r={n.r} color={n.nc} opacity={0.12} blendMode="screen">
              <BlurMask blur={10} style="outer" />
            </Circle>
            {/* Inner glow */}
            <Circle cx={n.cx} cy={n.cy} r={n.r} color={n.nc} opacity={0.38} />
            {/* Bright core */}
            <Circle cx={n.cx} cy={n.cy} r={n.r} color="#FFFFFF" opacity={0.92} />
          </Group>
        ))}

      </Canvas>
    </View>
  );
}
