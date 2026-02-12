// File: components/ui/ChakraWheel.tsx
// MySky — Chakra Wheel with clean inline yantra symbols

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Line,
  G,
  Path,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

export type ChakraState = 'Flowing' | 'Sensitive' | 'Grounding Needed' | 'Quiet';

export interface ChakraData {
  name: string;
  emoji?: string;
  state: ChakraState;
}

interface ChakraWheelProps {
  chakras: ChakraData[];
  dominantChakra: ChakraData;
  size?: number;
  showLabels?: boolean;
}

const { width: SCREEN_W } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ===== Chakra palette (YOUR exact hex codes) =====
export const CHAKRA_COLORS: Record<
  string,
  { core: string; glow: string; deep: string }
> = {
  Crown: { core: '#E040C0', glow: '#FF9EE8', deep: '#A02080' },
  'Third Eye': { core: '#9B6EFF', glow: '#D0B8FF', deep: '#6B40D0' },
  Throat: { core: '#40D8FF', glow: '#B0F0FF', deep: '#2098D0' },
  Heart: { core: '#50FF60', glow: '#B0FFB8', deep: '#30C040' },
  'Solar Plexus': { core: '#FFE830', glow: '#FFFFA0', deep: '#E0C000' },
  Sacral: { core: '#FF8830', glow: '#FFD0A0', deep: '#E06000' },
  Root: { core: '#FF3038', glow: '#FFB0B0', deep: '#D01020' },
};

export const GOLD = {
  main: '#FFE090',
  highlight: '#FFF8D8',
  glow: '#FFF8C0',
  dark: '#D8B060',
  aura: '#FFFAE0',
};

// State colors (legend)
const STATE_COLORS: Record<ChakraState, string> = {
  Flowing: '#60FFA0',
  Sensitive: '#FFD080',
  'Grounding Needed': '#FF7070',
  Quiet: 'rgba(255,255,255,0.35)',
};

function safeName(name: string) {
  return (name ?? '').trim();
}

function stateIntensity(state: ChakraState) {
  switch (state) {
    case 'Grounding Needed':
      return 1.0;
    case 'Sensitive':
      return 0.92;
    case 'Flowing':
      return 0.85;
    case 'Quiet':
    default:
      return 0.6;
  }
}

// ✅ Keep node size fixed. Only glow rings change by state.
function stateGlowScale(state: ChakraState) {
  switch (state) {
    case 'Grounding Needed':
      return 2.6;
    case 'Sensitive':
      return 2.2;
    case 'Flowing':
      return 1.85;
    case 'Quiet':
    default:
      return 1.35;
  }
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// ── Inline yantra geometry helpers ──

function petalD(
  cx: number, cy: number, angleDeg: number,
  innerR: number, outerR: number, w: number,
): string {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  const p = a + Math.PI / 2;
  const bx = cx + innerR * Math.cos(a);
  const by = cy + innerR * Math.sin(a);
  const tx = cx + outerR * Math.cos(a);
  const ty = cy + outerR * Math.sin(a);
  const mr = (innerR + outerR) * 0.55;
  const c1x = cx + mr * Math.cos(a) - w * Math.cos(p);
  const c1y = cy + mr * Math.sin(a) - w * Math.sin(p);
  const c2x = cx + mr * Math.cos(a) + w * Math.cos(p);
  const c2y = cy + mr * Math.sin(a) + w * Math.sin(p);
  return `M${bx} ${by}Q${c1x} ${c1y} ${tx} ${ty}Q${c2x} ${c2y} ${bx} ${by}Z`;
}

function petalsRingD(
  cx: number, cy: number, n: number,
  innerR: number, outerR: number, w: number,
): string {
  let d = '';
  for (let i = 0; i < n; i++) d += petalD(cx, cy, (i * 360) / n, innerR, outerR, w);
  return d;
}

function triUpD(cx: number, cy: number, r: number): string {
  const pts = [0, 120, 240].map((deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  });
  return `M${pts[0]}L${pts[1]}L${pts[2]}Z`;
}

function triDownD(cx: number, cy: number, r: number): string {
  const pts = [0, 120, 240].map((deg) => {
    const a = ((deg + 90) * Math.PI) / 180;
    return `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  });
  return `M${pts[0]}L${pts[1]}L${pts[2]}Z`;
}

function hexagramD(cx: number, cy: number, r: number): string {
  return triUpD(cx, cy, r) + triDownD(cx, cy, r);
}

function diamondD(cx: number, cy: number, r: number): string {
  return `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`;
}

// Per-chakra icon size and stroke tuning (all pure white)
const CHAKRA_ICON_TUNING: Record<
  string,
  { scale: number; sw: number }
> = {
  Crown:          { scale: 1.3,  sw: 1.5 },
  'Third Eye':    { scale: 1.5,  sw: 1.4 },
  Throat:         { scale: 1.35, sw: 1.4 },
  Heart:          { scale: 1.4,  sw: 1.5 },
  'Solar Plexus': { scale: 1.6,  sw: 1.5 },
  Sacral:         { scale: 1.35, sw: 1.4 },
  Root:           { scale: 1.35, sw: 1.4 },
};

function renderSymbolPaths(
  name: string, cx: number, cy: number, r: number,
  stroke: string, sw: number,
): React.ReactNode {
  const lj = 'round' as const;
  switch (name) {
    case 'Crown': {
      const petals = petalsRingD(cx, cy, 12, r * 0.3, r, r * 0.2);
      const star = hexagramD(cx, cy, r * 0.42);
      return (
        <>
          <Path d={petals} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
          <Path d={star} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
        </>
      );
    }
    case 'Third Eye': {
      const cr = r * 0.38;
      const pr = r * 0.95;
      const lp = `M${cx - cr} ${cy}C${cx - cr * 1.5} ${cy - r * 0.55} ${cx - pr} ${cy - r * 0.25} ${cx - pr} ${cy}C${cx - pr} ${cy + r * 0.25} ${cx - cr * 1.5} ${cy + r * 0.55} ${cx - cr} ${cy}`;
      const rp = `M${cx + cr} ${cy}C${cx + cr * 1.5} ${cy - r * 0.55} ${cx + pr} ${cy - r * 0.25} ${cx + pr} ${cy}C${cx + pr} ${cy + r * 0.25} ${cx + cr * 1.5} ${cy + r * 0.55} ${cx + cr} ${cy}`;
      const tri = triDownD(cx, cy, cr * 0.65);
      return (
        <>
          <Circle cx={cx} cy={cy} r={cr} fill="none" stroke={stroke} strokeWidth={sw} />
          <Path d={lp + rp} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
          <Path d={tri} fill="none" stroke={stroke} strokeWidth={sw * 0.8} strokeLinejoin={lj} />
        </>
      );
    }
    case 'Throat': {
      const petals = petalsRingD(cx, cy, 16, r * 0.35, r, r * 0.14);
      const tri = triDownD(cx, cy, r * 0.32);
      return (
        <>
          <Path d={petals} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
          <Circle cx={cx} cy={cy} r={r * 0.35} fill="none" stroke={stroke} strokeWidth={sw} />
          <Path d={tri} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
        </>
      );
    }
    case 'Heart': {
      const petals = petalsRingD(cx, cy, 12, r * 0.3, r, r * 0.2);
      const star = hexagramD(cx, cy, r * 0.38);
      return (
        <>
          <Path d={petals} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
          <Path d={star} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
        </>
      );
    }
    case 'Solar Plexus': {
      const petals = petalsRingD(cx, cy, 10, r * 0.3, r, r * 0.2);
      const tri = triDownD(cx, cy, r * 0.38);
      return (
        <>
          <Path d={petals} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
          <Path d={tri} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
        </>
      );
    }
    case 'Sacral': {
      const petals = petalsRingD(cx, cy, 6, r * 0.3, r, r * 0.25);
      return (
        <>
          <Path d={petals} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
          <Circle cx={cx} cy={cy} r={r * 0.38} fill="none" stroke={stroke} strokeWidth={sw} />
        </>
      );
    }
    case 'Root': {
      const petals = petalsRingD(cx, cy, 4, r * 0.25, r, r * 0.28);
      const sq = diamondD(cx, cy, r * 0.45);
      return (
        <>
          <Path d={petals} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
          <Path d={sq} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin={lj} />
        </>
      );
    }
    default:
      return <Circle cx={cx} cy={cy} r={r * 0.3} fill="none" stroke={stroke} strokeWidth={sw} />;
  }
}

// Renders the chakra yantra with a dark plate behind it
function ChakraSymbol({
  name,
  x,
  y,
  baseSize,
  opacity = 1,
  basePlateOpacity = 0.5,
}: {
  name: string;
  x: number;
  y: number;
  baseSize: number;
  opacity?: number;
  basePlateOpacity?: number;
}) {
  const tuning = CHAKRA_ICON_TUNING[name] ?? { scale: 1.25, sw: 1.3 };
  const size = baseSize * tuning.scale;
  const plateR = baseSize * 0.86;
  const stroke = '#FFFFFF';

  return (
    <G opacity={opacity}>
      <Circle cx={x} cy={y} r={plateR} fill={`rgba(0,0,0,${basePlateOpacity})`} />
      {renderSymbolPaths(name, x, y, size / 2, stroke, tuning.sw)}
    </G>
  );
}

export default function ChakraWheel({
  chakras,
  dominantChakra,
  size,
  showLabels = true,
}: ChakraWheelProps) {
  const wheelSize = size || SCREEN_W * 0.58;
  const cx = wheelSize / 2;
  const cy = wheelSize / 2;

  const orbitR = wheelSize * 0.34;
  const innerRingR = orbitR * 0.82;
  const outerRingR = orbitR * 1.18;

  // ✅ Node circle sizes stay constant (no scaling)
  const nodeR = wheelSize * 0.065;
  const centerR = wheelSize * 0.14;

  // Icon base sizes (then per-chakra scales apply)
  const ORBIT_ICON_BASE = nodeR * 1.55;
  const CENTER_ICON_BASE = centerR * 1.15;

  const dominantName = safeName(dominantChakra?.name);
  const dom = CHAKRA_COLORS[dominantName] ?? CHAKRA_COLORS['Solar Plexus'];

  // Animated center pulse (behind)
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse]);

  const haloOpacity = useDerivedValue(() => 0.5 + pulse.value * 0.3);
  const haloRadius = useDerivedValue(() => centerR * 1.65 + pulse.value * (wheelSize * 0.02));
  const haloAnimatedProps = useAnimatedProps(() => ({
    opacity: haloOpacity.value,
    r: haloRadius.value,
  }));

  // ✅ Orbit nodes exclude dominant (dominant in center)
  const orbitList = useMemo(() => {
    const clean = chakras.map((c) => ({ ...c, name: safeName(c.name) }));
    return clean.filter((c) => c.name && c.name !== dominantName);
  }, [chakras, dominantName]);

  // ✅ Even spacing angles (uniform distribution)
  const angles = useMemo(() => {
    const n = Math.max(orbitList.length, 1);
    return orbitList.map((_, i) => (i * 360) / n);
  }, [orbitList]);

  const cosmicDust = useMemo(() => {
    const pts: { x: number; y: number; r: number; o: number }[] = [];
    [0, 45, 90, 135, 180, 225, 270, 315].forEach((angle) => {
      const pOuter = polarToCartesian(cx, cy, outerRingR, angle);
      const pInner = polarToCartesian(cx, cy, innerRingR, angle);
      pts.push({ x: pOuter.x, y: pOuter.y, r: 1.3, o: 0.25 });
      pts.push({ x: pInner.x, y: pInner.y, r: 0.9, o: 0.18 });
    });
    for (let i = 0; i < 18; i++) {
      const angle = (i * 137.5 + 10) % 360;
      const dist = orbitR * (0.25 + (((i * 7 + 3) % 13) / 13) * 1.2);
      const pos = polarToCartesian(cx, cy, dist, angle);
      pts.push({
        x: pos.x,
        y: pos.y,
        r: 0.4 + ((i * 3) % 5) * 0.16,
        o: 0.05 + ((i * 7) % 10) * 0.018,
      });
    }
    return pts;
  }, [cx, cy, orbitR, outerRingR, innerRingR]);

  return (
    <View style={[styles.container, { width: wheelSize, height: wheelSize }]}>
      <Svg width={wheelSize} height={wheelSize} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="goldenRadiance" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={GOLD.aura} stopOpacity={0.4} />
            <Stop offset="25%" stopColor={GOLD.glow} stopOpacity={0.2} />
            <Stop offset="55%" stopColor={GOLD.main} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={GOLD.main} stopOpacity={0} />
          </RadialGradient>

          <RadialGradient id="centerHalo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={GOLD.aura} stopOpacity={0.55} />
            <Stop offset="22%" stopColor={dom.core} stopOpacity={0.48} />
            <Stop offset="48%" stopColor={dom.glow} stopOpacity={0.25} />
            <Stop offset="74%" stopColor={GOLD.glow} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={GOLD.glow} stopOpacity={0} />
          </RadialGradient>

          <RadialGradient id="centerFill" cx="45%" cy="45%" r="55%">
            <Stop offset="0%" stopColor={GOLD.aura} stopOpacity={0.95} />
            <Stop offset="25%" stopColor={dom.glow} stopOpacity={1} />
            <Stop offset="55%" stopColor={dom.core} stopOpacity={0.95} />
            <Stop offset="85%" stopColor={dom.deep} stopOpacity={0.88} />
            <Stop offset="100%" stopColor={dom.deep} stopOpacity={0.75} />
          </RadialGradient>

          {orbitList.map((c) => {
            const name = safeName(c.name);
            const col = CHAKRA_COLORS[name] ?? CHAKRA_COLORS['Solar Plexus'];
            const idSafe = name.replace(/\s/g, '');
            return (
              <React.Fragment key={`defs-${idSafe}`}>
                <RadialGradient id={`nodeGrad-${idSafe}`} cx="45%" cy="45%" r="55%">
                  <Stop offset="0%" stopColor={col.glow} stopOpacity={0.8} />
                  <Stop offset="35%" stopColor={col.core} stopOpacity={0.9} />
                  <Stop offset="72%" stopColor={col.deep} stopOpacity={0.8} />
                  <Stop offset="100%" stopColor="#0A0E1A" stopOpacity={0.5} />
                </RadialGradient>

                <RadialGradient id={`nodeGlow-${idSafe}`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={col.core} stopOpacity={0.7} />
                  <Stop offset="30%" stopColor={col.glow} stopOpacity={0.35} />
                  <Stop offset="65%" stopColor={col.glow} stopOpacity={0.12} />
                  <Stop offset="100%" stopColor={col.glow} stopOpacity={0} />
                </RadialGradient>
              </React.Fragment>
            );
          })}
        </Defs>

        {/* Background radiance */}
        <Circle cx={cx} cy={cy} r={centerR * 3.5} fill="url(#goldenRadiance)" />

        {/* Rings */}
        <Circle
          cx={cx}
          cy={cy}
          r={outerRingR}
          fill="none"
          stroke={GOLD.glow}
          strokeOpacity={0.18}
          strokeWidth={3.2}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={outerRingR}
          fill="none"
          stroke={GOLD.highlight}
          strokeOpacity={0.65}
          strokeWidth={0.9}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={innerRingR}
          fill="none"
          stroke={GOLD.glow}
          strokeOpacity={0.14}
          strokeWidth={2.7}
        />
        <Circle
          cx={cx}
          cy={cy}
          r={innerRingR}
          fill="none"
          stroke={GOLD.highlight}
          strokeOpacity={0.55}
          strokeWidth={0.8}
        />

        {/* Cross guides */}
        {[0, 90].map((angle) => {
          const p1 = polarToCartesian(cx, cy, outerRingR + 4, angle);
          const p2 = polarToCartesian(cx, cy, outerRingR + 4, angle + 180);
          return (
            <Line
              key={`cardinal-${angle}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={GOLD.highlight}
              strokeOpacity={0.14}
              strokeWidth={0.6}
            />
          );
        })}

        {/* Dust */}
        {cosmicDust.map((s, i) => (
          <Circle key={`dust-${i}`} cx={s.x} cy={s.y} r={s.r} fill={GOLD.aura} opacity={s.o} />
        ))}

        {/* Spokes */}
        {orbitList.map((c, i) => {
          const angle = angles[i];
          const p = polarToCartesian(cx, cy, orbitR, angle);
          return (
            <G key={`spoke-${c.name}-${i}`}>
              <Line
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke={GOLD.main}
                strokeOpacity={0.2}
                strokeWidth={0.6}
              />
              <Line
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke={GOLD.highlight}
                strokeOpacity={0.5}
                strokeWidth={1.2}
                strokeDasharray="2 10"
                strokeLinecap="round"
              />
            </G>
          );
        })}

        {/* Center halo pulse (behind) */}
        <AnimatedCircle cx={cx} cy={cy} fill="url(#centerHalo)" animatedProps={haloAnimatedProps} />

        {/* Center node */}
        <Circle cx={cx} cy={cy} r={centerR} fill="url(#centerFill)" />
        <Circle
          cx={cx}
          cy={cy}
          r={centerR}
          fill="none"
          stroke={dom.glow}
          strokeOpacity={0.9}
          strokeWidth={1.5}
        />

        {/* ✅ Center icon: dark base UNDER svg; NO effects on svg */}
        <ChakraSymbol
          name={dominantName}
          x={cx}
          y={cy}
          baseSize={CENTER_ICON_BASE}
          opacity={1}
          basePlateOpacity={0.38}
        />

        {/* Orbit node OUTER GLOWS (behind) — icons do NOT get glows/shadows */}
        {orbitList.map((c, i) => {
          const name = safeName(c.name);
          const idSafe = name.replace(/\s/g, '');
          const intensity = stateIntensity(c.state);
          const glowMult = stateGlowScale(c.state);
          const p = polarToCartesian(cx, cy, orbitR, angles[i]);
          return (
            <Circle
              key={`outer-glow-${name}-${i}`}
              cx={p.x}
              cy={p.y}
              r={nodeR * glowMult}
              fill={`url(#nodeGlow-${idSafe})`}
              opacity={intensity}
            />
          );
        })}

        {/* Orbit nodes (fixed node size) + SVG icons */}
        {orbitList.map((c, i) => {
          const name = safeName(c.name);
          const col = CHAKRA_COLORS[name] ?? CHAKRA_COLORS['Solar Plexus'];
          const intensity = stateIntensity(c.state);
          const idSafe = name.replace(/\s/g, '');
          const p = polarToCartesian(cx, cy, orbitR, angles[i]);

          return (
            <G key={`node-${name}-${i}`}>
              <Circle
                cx={p.x}
                cy={p.y}
                r={nodeR}
                fill={`url(#nodeGrad-${idSafe})`}
                opacity={intensity}
              />
              <Circle
                cx={p.x}
                cy={p.y}
                r={nodeR}
                fill="none"
                stroke={col.glow}
                strokeOpacity={0.85 * intensity}
                strokeWidth={1.8}
              />
              <Circle
                cx={p.x}
                cy={p.y}
                r={nodeR + 3}
                fill="none"
                stroke={STATE_COLORS[c.state]}
                strokeOpacity={0.6 * intensity}
                strokeWidth={0.9}
              />

              {/* ✅ BIG SVG icon (no effects on it) */}
              <ChakraSymbol
                name={name}
                x={p.x}
                y={p.y}
                baseSize={ORBIT_ICON_BASE}
                opacity={0.98 * intensity}
                basePlateOpacity={0.52}
              />
            </G>
          );
        })}
      </Svg>

      {showLabels && (
        <View pointerEvents="none" style={styles.centerLabel}>
          <Text style={styles.centerName}>{dominantName}</Text>
          <Text style={[styles.centerState, { color: STATE_COLORS[dominantChakra.state] }]}>
            {dominantChakra.state}
          </Text>
        </View>
      )}
    </View>
  );
}

/* Legend bar */
export function ChakraLegend() {
  const states: ChakraState[] = ['Flowing', 'Sensitive', 'Grounding Needed', 'Quiet'];
  const dotColors: Record<ChakraState, string> = {
    Flowing: theme.energy,
    Sensitive: theme.heavy,
    'Grounding Needed': theme.stormy,
    Quiet: 'rgba(255,255,255,0.25)',
  };

  return (
    <View style={styles.legendRow}>
      {states.map((s) => (
        <View key={s} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: dotColors[s] }]} />
          <Text style={styles.legendLabel}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  centerLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -28,
    alignItems: 'center',
  },
  centerName: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  centerState: {
    marginTop: 4,
    opacity: 0.92,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 34,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
});
