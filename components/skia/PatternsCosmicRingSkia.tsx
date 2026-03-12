import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  BlurMask,
  vec,
  LinearGradient,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  size?: number;
  monthLabel?: string;
  title?: string;
  subtitle?: string;
}

const NODE_LABELS = ['Mood', 'Energy', 'Stress', 'Focus', 'Connection', 'Rest', 'Growth', 'Flow'];
const NODE_COLORS = ['#FFDA03', '#49DFFF', '#FF5A5F', '#4EA3FF', '#C86BFF', '#9ACD32', '#FF9A3C', '#5CADFF'];

function nodePosition(i: number, total: number, cx: number, cy: number, r: number) {
  const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function PatternsCosmicRingSkia({ size = 280, monthLabel, title, subtitle }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.40;
  const innerR = size * 0.22;

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 24000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const nodeCount = NODE_LABELS.length;
  const positions = Array.from({ length: nodeCount }, (_, i) =>
    nodePosition(i, nodeCount, cx, cy, outerR)
  );

  // Orbit arc path (full circle)
  const orbitPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(cx, cy, outerR);
    return p;
  }, [cx, cy, outerR]);

  // Inner ring
  const innerPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(cx, cy, innerR);
    return p;
  }, [cx, cy, innerR]);

  // Spoke paths from center to each node
  const spokes = positions.map(pos => {
    const p = Skia.Path.Make();
    p.moveTo(cx, cy);
    p.lineTo(pos.x, pos.y);
    return p;
  });

  return (
    <View style={{ width: size, height: size + 40 }}>
      <Canvas style={{ width: size, height: size }}>
        {/* Outer orbit ring */}
        <Path path={orbitPath} color="rgba(255,218,3,0.12)" style="stroke" strokeWidth={1} />

        {/* Inner ring */}
        <Path path={innerPath} color="rgba(255,255,255,0.06)" style="stroke" strokeWidth={1} />

        {/* Center glow */}
        <Circle cx={cx} cy={cy} r={size * 0.08} color="rgba(255,218,3,0.15)">
          <BlurMask blur={12} style="normal" />
        </Circle>
        <Circle cx={cx} cy={cy} r={size * 0.04} color="rgba(255,218,3,0.6)" />

        {/* Spokes */}
        {spokes.map((p, i) => (
          <Path key={i} path={p} color={`${NODE_COLORS[i]}18`} style="stroke" strokeWidth={1} />
        ))}

        {/* Node dots */}
        {positions.map((pos, i) => (
          <React.Fragment key={i}>
            <Circle cx={pos.x} cy={pos.y} r={7} color={`${NODE_COLORS[i]}30`}>
              <BlurMask blur={5} style="normal" />
            </Circle>
            <Circle cx={pos.x} cy={pos.y} r={4} color={NODE_COLORS[i]} />
          </React.Fragment>
        ))}
      </Canvas>

      {/* Labels */}
      {title || subtitle || monthLabel ? (
        <View style={styles.textRow}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {monthLabel && <Text style={styles.month}>{monthLabel}</Text>}
        </View>
      ) : null}
    </View>
  );
}

// useMemo shim for module scope
function useMemo<T>(factory: () => T, _deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return React.useMemo(factory, _deps);
}

const styles = StyleSheet.create({
  textRow: {
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,218,3,0.85)',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  month: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default memo(PatternsCosmicRingSkia);
