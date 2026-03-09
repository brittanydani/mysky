/**
 * SkeletonLoader — Premium shimmer placeholder for loading states.
 * Renders grayed-out shapes with a sweeping gradient shimmer pass.
 * Drop-in replacement for ActivityIndicator / spinner patterns.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const SCREEN_W = Dimensions.get('window').width;

interface SkeletonLineProps {
  width: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/** A single shimmer bar */
export function SkeletonLine({ width, height = 14, borderRadius = 8, style }: SkeletonLineProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 0.6, 1], [0.08, 0.18, 0.18, 0.08]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: 'rgba(226,232,240,0.12)',
        },
        shimmerStyle,
        style,
      ]}
    />
  );
}

/** Pre-composed skeleton for a card with title, subtitle, and body lines */
export function SkeletonCard({ style }: { style?: any }) {
  return (
    <View style={[skeletonStyles.card, style]}>
      <SkeletonLine width="45%" height={18} style={{ marginBottom: 12 }} />
      <SkeletonLine width="70%" height={12} style={{ marginBottom: 20 }} />
      <SkeletonLine width="100%" height={10} style={{ marginBottom: 8 }} />
      <SkeletonLine width="90%" height={10} style={{ marginBottom: 8 }} />
      <SkeletonLine width="60%" height={10} />
    </View>
  );
}

/** Skeleton for the radar chart area */
export function SkeletonRadar({ size = 260 }: { size?: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.06, 0.14, 0.06]),
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: size }}>
      <Animated.View
        style={[
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size * 0.35,
            backgroundColor: 'rgba(226,232,240,0.1)',
          },
          pulseStyle,
        ]}
      />
    </View>
  );
}

/** Skeleton for chapter list items */
export function SkeletonChapterList({ count = 5 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={skeletonStyles.chapterRow}>
          <SkeletonLine width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonLine width="65%" height={14} />
            <SkeletonLine width="40%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Full Blueprint skeleton: radar + chapters */
export function SkeletonBlueprint() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 24 }}>
      {/* Title */}
      <SkeletonLine width="40%" height={24} style={{ marginBottom: 4 }} />
      <SkeletonLine width="80%" height={12} />

      {/* Radar area */}
      <SkeletonRadar />

      {/* Chapter list */}
      <SkeletonLine width="30%" height={16} style={{ marginTop: 8 }} />
      <SkeletonChapterList count={6} />
    </View>
  );
}

/** Insight synthesis placeholder with pulsing text */
export function SkeletonInsight({ message = 'Synthesizing your patterns...' }: { message?: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.35, 0.75]),
  }));

  return (
    <View style={skeletonStyles.insightWrap}>
      <Animated.Text style={[skeletonStyles.insightText, textStyle]}>{message}</Animated.Text>
      <View style={{ marginTop: 16, gap: 8 }}>
        <SkeletonLine width="100%" height={10} />
        <SkeletonLine width="85%" height={10} />
        <SkeletonLine width="55%" height={10} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: 'rgba(14,24,48,0.32)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  insightWrap: {
    borderRadius: 16,
    backgroundColor: 'rgba(14,24,48,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 20,
    alignItems: 'center',
  },
  insightText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(226,232,240,0.6)',
    letterSpacing: 0.3,
  },
});
