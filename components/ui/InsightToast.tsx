// File: components/ui/InsightToast.tsx
// MySky — Insight Toast Banner
//
// A small, elegant banner that slides in from the top of the screen.
// Renders globally (placed in _layout.tsx) above all other content.
// Driven by InsightToastContext.

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useInsightToast } from '../../context/InsightToastContext';

const { width } = Dimensions.get('window');

// ── Palette ──
const PALETTE = {
  gold: '#C9AE78',
  bg: 'rgba(8, 14, 36, 0.96)',
  border: 'rgba(201,174,120,0.20)',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
};

export default function InsightToast() {
  const insets = useSafeAreaInsets();
  const { current, visible, dismissToast } = useInsightToast();

  // Slide-in: starts off-screen above, slides down on show
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 250 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else {
      translateY.value = withTiming(-120, { duration: 320, easing: Easing.in(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 280 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  // Don't render at all if no content has ever been set
  if (!current && !visible) return null;

  const accentColor = current?.accentColor ?? PALETTE.gold;
  const iconName = (current?.icon ?? 'bulb-outline') as React.ComponentProps<typeof Ionicons>['name'];

  const handleTap = () => {
    current?.onTap?.();
    dismissToast();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8 },
        animStyle,
      ]}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      <Pressable
        onPress={handleTap}
        style={({ pressed }) => [
          styles.pill,
          { borderColor: `${accentColor}30` },
          pressed && { opacity: 0.85 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={current?.text ?? 'Insight notification'}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15` }]}>
          <Ionicons name={iconName} size={14} color={accentColor} />
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={styles.insightLabel} numberOfLines={2}>
            {current?.text ?? ''}
          </Text>
          {current?.actionLabel && (
            <Text style={[styles.actionLabel, { color: accentColor }]}>
              {current.actionLabel}
            </Text>
          )}
        </View>

        {/* Dismiss */}
        <Pressable
          onPress={dismissToast}
          style={styles.dismissBtn}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={12}
        >
          <Ionicons name="close" size={14} color={PALETTE.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.bg,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContainer: { flex: 1 },
  insightLabel: {
    color: PALETTE.textMain,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  dismissBtn: {
    padding: 4,
    flexShrink: 0,
  },
});
