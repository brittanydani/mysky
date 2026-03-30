// components/ui/SegmentRating.tsx
//
// Animated 5-segment fluid rating control.
// Replaces the 1-5 numbered circles in the dream metadata section.
//
// Visual behaviour:
//   • Tapping segment N fills segments 1–N with gold accent glow.
//   • Each segment springs into its active/inactive state independently.
//   • Active segments have a gradient-like glow achieved through nested
//     Animated.View layers — zero Skia/Canvas overhead.
//   • Light haptic fires on every value change.
//
// Usage:
//   <SegmentRating value={vividness} onChange={v => setVividness(v)} label="Vividness" />

import React, { memo, useEffect, useCallback } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ── Constants ─────────────────────────────────────────────────────────────────

const GOLD           = '#C9AE78';
const GOLD_BG        = 'rgba(201,174,120,0.18)';
const INACTIVE_BG    = 'rgba(255,255,255,0.05)';
const INACTIVE_BORDER = 'rgba(255,255,255,0.10)';
const ACTIVE_BORDER  = 'rgba(201,174,120,0.70)';

const SPRING = {
  mass:             0.5,
  damping:          18,
  stiffness:        350,
  overshootClamping: false,
} as const;

// ── Single segment ────────────────────────────────────────────────────────────

interface SegmentProps {
  index:    number;  // 1-based
  active:   boolean;
  onPress:  (n: number) => void;
}

const Segment = memo(function Segment({ index, active, onPress }: SegmentProps) {
  const filled = useSharedValue(active ? 1 : 0);
  const scale  = useSharedValue(1);

  useEffect(() => {
    filled.value = withTiming(active ? 1 : 0, { duration: 200 });
  }, [active, filled]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      filled.value,
      [0, 1],
      [INACTIVE_BG, GOLD_BG],
    ),
    borderColor: interpolateColor(
      filled.value,
      [0, 1],
      [INACTIVE_BORDER, ACTIVE_BORDER],
    ),
    transform: [{ scale: scale.value }],
  }));

  // Inner glow layer — only visible when active
  const glowStyle = useAnimatedStyle(() => ({
    opacity: filled.value * 0.35,
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.88, SPRING); }}
      onPressOut={() => { scale.value = withSpring(1.0, SPRING); }}
      onPress={() => onPress(index)}
      style={styles.segmentOuter}
      accessibilityRole="button"
      accessibilityLabel={`Rating ${index}`}
    >
      <Animated.View style={[styles.segment, animatedStyle]}>
        {/* Inner ambient glow when active */}
        <Animated.View style={[styles.segmentGlow, glowStyle]} />
      </Animated.View>
    </Pressable>
  );
});

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SegmentRatingProps {
  value:    number;  // 1–5 (0 = nothing selected)
  onChange: (v: number) => void;
  label?:   string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const SegmentRating = memo(function SegmentRating({ value, onChange, label }: SegmentRatingProps) {
  const handlePress = useCallback((n: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onChange(n === value ? n : n); // always set; parent may implement toggle
  }, [value, onChange]);

  const descriptor = value === 1 ? 'Low'
    : value === 2 ? 'Mild'
    : value === 3 ? 'Moderate'
    : value === 4 ? 'High'
    : value === 5 ? 'Intense'
    : '—';

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map(n => (
          <Segment
            key={n}
            index={n}
            active={n <= value}
            onPress={handlePress}
          />
        ))}
      </View>
      {label !== undefined && (
        <Text style={styles.descriptor}>
          {value > 0 ? descriptor : 'tap to rate'}
        </Text>
      )}
    </View>
  );
});

export default SegmentRating;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    alignItems: 'flex-end',
    gap:        4,
  },
  row: {
    flexDirection: 'row',
    gap:           5,
    alignItems:    'center',
  },
  segmentOuter: {
    // Touch target is slightly larger than visual
  },
  segment: {
    width:        38,
    height:       20,
    borderRadius: 6,
    borderWidth:  1,
    overflow:     'hidden',
    justifyContent: 'center',
    alignItems:   'center',
  },
  segmentGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GOLD,
    borderRadius:    6,
  },
  descriptor: {
    color:         'rgba(201,174,120,0.65)',
    fontSize:      10,
    fontWeight:    '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
