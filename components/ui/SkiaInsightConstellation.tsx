import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  BlurMask,
  Skia,
} from '@shopify/react-native-skia';
import type { DailyCheckIn } from '../../services/patterns/types';

interface Props {
  checkIns: DailyCheckIn[];
  size?: number;
}

const DOMAIN_COLORS: Record<string, string> = {
  mood:     '#FFDA03',
  energy:   '#9ACD32',
  stress:   '#F87171',
  sleep:    '#99B4E4',
  social:   '#C084FC',
  creative: '#FB923C',
};

const DOMAIN_KEYS = ['mood', 'energy', 'stress'] as const;

function levelToNum(level: string | undefined): number {
  switch (level) {
    case 'very_low':  return 2;
    case 'low':       return 3.5;
    case 'moderate':  return 5.5;
    case 'high':      return 7.5;
    case 'very_high': return 9;
    default:          return 5;
  }
}

/** Place nodes in a circular layout */
function nodePositions(count: number, cx: number, cy: number, radius: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

function SkiaInsightConstellation({ checkIns, size = 220 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const orbitR = size * 0.36;

  const domainAvgs = useMemo(() => {
    if (checkIns.length === 0) return DOMAIN_KEYS.map(() => 5);
    return DOMAIN_KEYS.map(domain => {
      if (domain === 'mood')   return checkIns.reduce((s, c) => s + c.moodScore, 0) / checkIns.length;
      if (domain === 'energy') return checkIns.reduce((s, c) => s + levelToNum(c.energyLevel), 0) / checkIns.length;
      if (domain === 'stress') return checkIns.reduce((s, c) => s + levelToNum(c.stressLevel), 0) / checkIns.length;
      return 5;
    });
  }, [checkIns]);

  const positions = nodePositions(DOMAIN_KEYS.length, cx, cy, orbitR);

  // Build edge paths between all node pairs
  const edges = useMemo(() => {
    const paths: { path: ReturnType<typeof Skia.Path.Make>; strength: number }[] = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const p = Skia.Path.Make();
        p.moveTo(positions[i].x, positions[i].y);
        p.lineTo(positions[j].x, positions[j].y);
        // Edge strength = how correlated the two metrics are (simple avg proximity)
        const diff = Math.abs(domainAvgs[i] - domainAvgs[j]) / 9;
        paths.push({ path: p, strength: 1 - diff });
      }
    }
    return paths;
  }, [positions, domainAvgs]);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ flex: 1 }}>
        {/* Centre glow */}
        <Circle cx={cx} cy={cy} r={size * 0.08} color="rgba(255,218,3,0.12)">
          <BlurMask blur={10} style="normal" />
        </Circle>
        <Circle cx={cx} cy={cy} r={size * 0.04} color="rgba(255,218,3,0.45)" />

        {/* Edges */}
        {edges.map((e, i) => (
          <Path
            key={i}
            path={e.path}
            color={`rgba(255,255,255,${(e.strength * 0.18).toFixed(2)})`}
            style="stroke"
            strokeWidth={1}
          />
        ))}

        {/* Domain nodes */}
        {DOMAIN_KEYS.map((domain, i) => {
          const { x, y } = positions[i];
          const avg = domainAvgs[i];
          const r = 6 + (avg / 10) * 8; // radius 6–14 based on value
          const color = DOMAIN_COLORS[domain] ?? '#ffffff';
          return (
            <React.Fragment key={domain}>
              <Circle cx={x} cy={y} r={r + 4} color={`${color}22`}>
                <BlurMask blur={6} style="normal" />
              </Circle>
              <Circle cx={x} cy={y} r={r} color={color} />
            </React.Fragment>
          );
        })}
      </Canvas>
    </View>
  );
}

export default memo(SkiaInsightConstellation);
