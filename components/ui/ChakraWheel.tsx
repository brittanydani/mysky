// File: components/ui/ChakraWheel.tsx
// MySky — Enhanced Energy Wheel with glowing chakra orbs
// Each node is a colored circle with outer glow ring + centered emoji

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { theme } from '../../constants/theme';
import ChakraSvgIcon from './ChakraIcons';

export type ChakraState = 'Flowing' | 'Sensitive' | 'Grounding Needed' | 'Quiet';

interface ChakraData {
  name: string;
  emoji: string;
  state: ChakraState;
}

interface ChakraWheelProps {
  chakras: ChakraData[];
  dominantChakra: ChakraData;
  size?: number;
}

const { width: SCREEN_W } = Dimensions.get('window');

const CHAKRA_COLORS: Record<ChakraState, { bg: string; border: string; glow: string }> = {
  Flowing: {
    bg: 'rgba(110,191,139,0.10)',
    border: 'rgba(110,191,139,0.30)',
    glow: 'rgba(110,191,139,0.08)',
  },
  Sensitive: {
    bg: 'rgba(224,176,122,0.12)',
    border: 'rgba(224,176,122,0.30)',
    glow: 'rgba(224,176,122,0.08)',
  },
  'Grounding Needed': {
    bg: 'rgba(224,122,122,0.12)',
    border: 'rgba(224,122,122,0.30)',
    glow: 'rgba(224,122,122,0.10)',
  },
  Quiet: {
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.10)',
    glow: 'rgba(255,255,255,0.03)',
  },
};

// Distinct warm colors per chakra position (matching traditional chakra colors)
const CHAKRA_POSITION_COLORS: Record<string, { inner: string; outer: string }> = {
  Crown:    { inner: '#9B6BC0', outer: 'rgba(155,107,192,0.10)' },
  'Third Eye': { inner: '#7B68C0', outer: 'rgba(123,104,192,0.10)' },
  Throat:   { inner: '#5B9BD5', outer: 'rgba(91,155,213,0.10)' },
  Heart:    { inner: '#6EBF8B', outer: 'rgba(110,191,139,0.10)' },
  'Solar Plexus': { inner: '#E0C35A', outer: 'rgba(224,195,90,0.10)' },
  Sacral:   { inner: '#E0A04A', outer: 'rgba(224,160,74,0.10)' },
  Root:     { inner: '#D06060', outer: 'rgba(208,96,96,0.10)' },
};

export default function ChakraWheel({
  chakras,
  dominantChakra,
  size,
}: ChakraWheelProps) {
  const wheelSize = size || SCREEN_W * 0.58;
  const nodeSize = wheelSize * 0.18;
  const radius = wheelSize * 0.36;

  return (
    <View style={[styles.container, { width: wheelSize, height: wheelSize }]}>
      {/* Background glow rings via SVG */}
      <Svg
        width={wheelSize}
        height={wheelSize}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={theme.primary} stopOpacity={0.08} />
            <Stop offset="70%" stopColor={theme.primary} stopOpacity={0.02} />
            <Stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* Subtle center glow */}
        <Circle
          cx={wheelSize / 2}
          cy={wheelSize / 2}
          r={wheelSize * 0.28}
          fill="url(#centerGlow)"
        />
        {/* Subtle orbit ring */}
        <Circle
          cx={wheelSize / 2}
          cy={wheelSize / 2}
          r={radius}
          fill="none"
          stroke="rgba(201,169,98,0.06)"
          strokeWidth={1}
          strokeDasharray="4 6"
        />
      </Svg>

      {/* Chakra nodes */}
      {chakras.map((c, idx) => {
        const angle = (idx / chakras.length) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const stateColors = CHAKRA_COLORS[c.state];
        const posColors = CHAKRA_POSITION_COLORS[c.name];
        const isDominant = c.name === dominantChakra.name;
        const actualSize = c.state === 'Quiet' ? nodeSize * 0.8 : isDominant ? nodeSize * 1.05 : nodeSize;

        return (
          <View
            key={c.name}
            style={[
              styles.nodeOuter,
              {
                left: wheelSize / 2 + x - actualSize / 2 - 4,
                top: wheelSize / 2 + y - actualSize / 2 - 4,
                width: actualSize + 8,
                height: actualSize + 8,
                borderRadius: (actualSize + 8) / 2,
              },
            ]}
          >
            {/* Outer glow ring */}
            <View
              style={[
                styles.nodeGlow,
                {
                  width: actualSize + 8,
                  height: actualSize + 8,
                  borderRadius: (actualSize + 8) / 2,
                  backgroundColor: posColors?.outer || stateColors.glow,
                },
              ]}
            />
            {/* Main node */}
            <View
              style={[
                styles.node,
                {
                  width: actualSize,
                  height: actualSize,
                  borderRadius: actualSize / 2,
                  backgroundColor: stateColors.bg,
                  borderColor: stateColors.border,
                  borderWidth: isDominant ? 1.5 : 1,
                },
              ]}
            >
              <ChakraSvgIcon
                name={c.name}
                size={actualSize * 0.58}
                opacity={c.state === 'Quiet' ? 0.35 : 1}
              />
            </View>
          </View>
        );
      })}

      {/* Center label */}
      <View style={styles.center}>
        <ChakraSvgIcon
          name={dominantChakra.name}
          size={36}
          opacity={1}
        />
        <Text style={styles.centerName}>{dominantChakra.name}</Text>
        <Text style={styles.centerState}>{dominantChakra.state}</Text>
      </View>
    </View>
  );
}

/* Legend bar for Flowing / Sensitive / Grounding Needed / Quiet */
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
      {states.map(s => (
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
  nodeOuter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeGlow: {
    position: 'absolute',
  },
  node: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  center: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -44,
    marginTop: -32,
    width: 88,
    alignItems: 'center',
  },
  centerName: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
  },
  centerState: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 1,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
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
