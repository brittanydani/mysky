// File: components/ui/ChakraWheel.tsx
// MySky — Cinematic Skia Chakra Wheel with High-End GPU Shapes

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  vec,
  Line,
} from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { SkiaChakraNode } from './SkiaChakraNode';

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

// ===== Cinematic Jewel-Tone Chakra Palette =====
export const CHAKRA_COLORS: Record<string, { core: string; glow: string; deep: string }> = {
  Crown:          { core: '#9D76C1', glow: '#D4A3B3', deep: '#4A3559' }, // Amethyst
  'Third Eye':    { core: '#6A7391', glow: '#8BC4E8', deep: '#2C365E' }, // Indigo/Silver
  Throat:         { core: '#5C89A6', glow: '#BEE0F5', deep: '#26466D' }, // Sapphire
  Heart:          { core: '#6EBF8B', glow: '#A8E6B6', deep: '#2A5C3D' }, // Emerald
  'Solar Plexus': { core: '#C5B493', glow: '#FFF4D4', deep: '#8B6508' }, // Champagne Gold
  Sacral:         { core: '#CD7F5D', glow: '#E8A98C', deep: '#6B3A26' }, // Copper
  Root:           { core: '#C87878', glow: '#E8A9A9', deep: '#6A2B2B' }, // Garnet
};

// Elegant Champagne Gold Base
export const GOLD = {
  main: 'rgba(197, 180, 147, 0.4)',
  highlight: '#C5B493',
  glow: 'rgba(197, 180, 147, 0.8)',
  dark: '#8B6508',
  aura: 'rgba(253, 251, 247, 0.15)',
};

const STATE_COLORS: Record<ChakraState, string> = {
  Flowing: '#C5B493',             // Gold
  Sensitive: '#8BC4E8',           // Silver/Blue
  'Grounding Needed': '#CD7F5D',  // Copper
  Quiet: 'rgba(255,255,255,0.3)', // Frosted Glass
};

function safeName(name: string) {
  return (name ?? '').trim();
}

function stateIntensity(state: ChakraState) {
  switch (state) {
    case 'Grounding Needed': return 1.0;
    case 'Sensitive':        return 0.95;
    case 'Flowing':          return 0.85;
    case 'Quiet':
    default:                 return 0.65;
  }
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export default function ChakraWheel({
  chakras, dominantChakra, size, showLabels = true,
}: ChakraWheelProps) {
  const wheelSize = size || SCREEN_W * 0.58;
  const cx = wheelSize / 2;
  const cy = wheelSize / 2;

  const orbitR = wheelSize * 0.34;
  const innerRingR = orbitR * 0.82;
  const outerRingR = orbitR * 1.18;

  const nodeR = wheelSize * 0.065;
  const centerR = wheelSize * 0.14;

  const dominantName = safeName(dominantChakra?.name);
  const domCol = CHAKRA_COLORS[dominantName] ?? CHAKRA_COLORS['Solar Plexus'];

  // Global heartbeat driving Skia glows on the UI thread
  const clock = useSharedValue(0);
  useEffect(() => {
    clock.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [clock]);

  const haloOpacity = useDerivedValue(() => 0.4 + clock.value * 0.3);
  const haloRadius = useDerivedValue(() => centerR * 1.55 + clock.value * (wheelSize * 0.03));

  const orbitList = useMemo(() => {
    const clean = chakras.map((c) => ({ ...c, name: safeName(c.name) }));
    return clean.filter((c) => c.name && c.name !== dominantName);
  }, [chakras, dominantName]);

  const angles = useMemo(() => {
    const n = Math.max(orbitList.length, 1);
    return orbitList.map((_, i) => (i * 360) / n);
  }, [orbitList]);

  const cosmicDust = useMemo(() => {
    const pts: { x: number; y: number; r: number; o: number }[] = [];
    [0, 45, 90, 135, 180, 225, 270, 315].forEach((angle) => {
      const pOuter = polarToCartesian(cx, cy, outerRingR, angle);
      const pInner = polarToCartesian(cx, cy, innerRingR, angle);
      pts.push({ x: pOuter.x, y: pOuter.y, r: 1.3, o: 0.35 });
      pts.push({ x: pInner.x, y: pInner.y, r: 0.9, o: 0.25 });
    });
    for (let i = 0; i < 18; i++) {
      const angle = (i * 137.5 + 10) % 360;
      const dist = orbitR * (0.25 + (((i * 7 + 3) % 13) / 13) * 1.2);
      const pos = polarToCartesian(cx, cy, dist, angle);
      pts.push({
        x: pos.x,
        y: pos.y,
        r: 0.4 + ((i * 3) % 5) * 0.16,
        o: 0.1 + ((i * 7) % 10) * 0.03,
      });
    }
    return pts;
  }, [cx, cy, orbitR, outerRingR, innerRingR]);

  return (
    <View style={[styles.container, { width: wheelSize, height: wheelSize }]}>
      <Canvas style={{ width: wheelSize, height: wheelSize }}>
        
        {/* Golden Radiance Background */}
        <Circle cx={cx} cy={cy} r={centerR * 3.8}>
          <RadialGradient
            c={vec(cx, cy)}
            r={centerR * 3.8}
            colors={[GOLD.aura, GOLD.glow, GOLD.main, 'transparent']}
            positions={[0, 0.3, 0.6, 1]}
          />
        </Circle>

        {/* Cinematic Golden Rings */}
        <Circle cx={cx} cy={cy} r={outerRingR} style="stroke" strokeWidth={2} color={GOLD.glow} opacity={0.2} />
        <Circle cx={cx} cy={cy} r={outerRingR} style="stroke" strokeWidth={0.8} color={GOLD.highlight} opacity={0.5} />
        <Circle cx={cx} cy={cy} r={innerRingR} style="stroke" strokeWidth={1.5} color={GOLD.glow} opacity={0.15} />
        <Circle cx={cx} cy={cy} r={innerRingR} style="stroke" strokeWidth={0.6} color={GOLD.highlight} opacity={0.4} />

        {/* Cross Guides */}
        {[0, 90].map((angle) => {
          const p1 = polarToCartesian(cx, cy, outerRingR + 6, angle);
          const p2 = polarToCartesian(cx, cy, outerRingR + 6, angle + 180);
          return (
            <Line
              key={`guide-${angle}`}
              p1={vec(p1.x, p1.y)}
              p2={vec(p2.x, p2.y)}
              color={GOLD.highlight}
              strokeWidth={0.6}
              opacity={0.2}
            />
          );
        })}

        {/* Spokes */}
        {orbitList.map((c, i) => {
          const p = polarToCartesian(cx, cy, orbitR, angles[i]);
          return (
            <Line
              key={`spoke-${i}`}
              p1={vec(cx, cy)}
              p2={vec(p.x, p.y)}
              color={GOLD.highlight}
              strokeWidth={1}
              opacity={0.4}
              style="stroke"
            />
          );
        })}

        {/* Dust Particles */}
        {cosmicDust.map((d, i) => (
          <Circle key={`dust-${i}`} cx={d.x} cy={d.y} r={d.r} color="#FDFBF7" opacity={d.o} />
        ))}

        {/* Animated Center Halo (Real-Time Skia Glow) */}
        <Circle cx={cx} cy={cy} r={haloRadius} opacity={haloOpacity}>
           <RadialGradient
            c={vec(cx, cy)}
            r={centerR * 1.6}
            colors={[domCol.glow, domCol.core, domCol.deep, 'transparent']}
            positions={[0, 0.3, 0.7, 1]}
          />
        </Circle>

        {/* Orbit Skia Nodes */}
        {orbitList.map((c, i) => {
          const name = safeName(c.name);
          const col = CHAKRA_COLORS[name] ?? CHAKRA_COLORS['Solar Plexus'];
          const intensity = stateIntensity(c.state);
          const p = polarToCartesian(cx, cy, orbitR, angles[i]);
          const nodeDia = nodeR * 2.5;

          return (
            <Group key={`orbit-${i}`} transform={[{ translateX: p.x - nodeDia/2 }, { translateY: p.y - nodeDia/2 }]}>
              <SkiaChakraNode
                name={name}
                color={col}
                stateColor={STATE_COLORS[c.state]}
                intensity={intensity}
                size={nodeDia}
                clock={clock}
              />
            </Group>
          );
        })}

        {/* Center Skia Node */}
        <Group transform={[{ translateX: cx - centerR * 2.5/2 }, { translateY: cy - centerR * 2.5/2 }]}>
          <SkiaChakraNode
            name={dominantName}
            color={domCol}
            stateColor={STATE_COLORS[dominantChakra.state]}
            intensity={1}
            size={centerR * 2.5}
            clock={clock}
          />
        </Group>

      </Canvas>

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
    Flowing: '#C5B493',             // Gold
    Sensitive: '#8BC4E8',           // Silver/Blue
    'Grounding Needed': '#CD7F5D',  // Copper
    Quiet: 'rgba(255,255,255,0.3)', // Frosted
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
    bottom: -36,
    alignItems: 'center',
  },
  centerName: {
    color: '#FDFBF7',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.5,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  centerState: {
    marginTop: 4,
    opacity: 0.95,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 40,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
