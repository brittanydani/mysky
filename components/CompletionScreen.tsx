// File: components/CompletionScreen.tsx
// MySky — Completion Screen (The Dopamine Hit)
//
// A full-screen modal that appears for 3+ seconds immediately after the
// "Hold to Sync/Seal" ring fills. Shows a glowing node animation,
// a micro-insight sentence, and a "Done" button.
//
// Props:
//   visible      — controls render
//   onDone       — called when user taps Done
//   microInsight — one-sentence feedback (from DailySynthesis engine)
//   checkInType  — 'weather' | 'rest' for color theming

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';

const { width, height } = Dimensions.get('window');

// ── Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  emerald: '#6EBF8B',
  copper: '#CD7F5D',
  textMain: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.75)',
  textMuted: 'rgba(255,255,255,0.45)',
};

// Theme per check-in type
const TYPE_THEME = {
  weather: {
    primary: '#C9AE78',
    secondary: '#6EBF8B',
    label: 'Internal Weather',
    icon: 'cloudy-outline' as const,
    successWord: 'Weather sealed.',
  },
  rest: {
    primary: '#8BC4E8',
    secondary: '#9D76C1',
    label: 'Morning Rest',
    icon: 'moon-outline' as const,
    successWord: 'Rest recorded.',
  },
};

// ─── Glowing Node Animation ───────────────────────────────────────────────────

function GlowingNode({ color }: { color: string }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Bloom in
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.2)) });

    // Then pulse
    const delay = 900;
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.65, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Inner ring pulses slightly offset
  const innerScale = useSharedValue(0.6);
  const innerOpacity = useSharedValue(0);
  useEffect(() => {
    innerOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    innerScale.value = withDelay(300, withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.3)) }));

    innerOpacity.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(0.4, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.85, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const innerStyle = useAnimatedStyle(() => ({
    opacity: innerOpacity.value,
    transform: [{ scale: innerScale.value }],
  }));

  return (
    <View style={styles.nodeContainer}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.nodeOuterGlow,
          { backgroundColor: `${color}12`, borderColor: `${color}18` },
          outerStyle,
        ]}
      />
      {/* Middle ring */}
      <Animated.View
        style={[
          styles.nodeMiddleRing,
          { borderColor: `${color}35` },
          innerStyle,
        ]}
      />
      {/* Core orb */}
      <Animated.View style={[styles.nodeCoreWrapper, outerStyle]}>
        <View style={[styles.nodeCore, { backgroundColor: `${color}CC`, shadowColor: color }]}>
          <View style={[styles.nodeCoreHighlight, { backgroundColor: `${color}50` }]} />
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CompletionScreenProps {
  visible: boolean;
  onDone: () => void;
  microInsight: string;
  checkInType: 'weather' | 'rest';
}

export default function CompletionScreen({
  visible,
  onDone,
  microInsight,
  checkInType,
}: CompletionScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = TYPE_THEME[checkInType];

  // Trigger success haptic on open
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onDone}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <SkiaDynamicCosmos />

        {/* Ambient background tint */}
        <View style={[
          styles.bgTint,
          { backgroundColor: `${theme.primary}06` },
        ]} />

        <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>

          {/* ── Check-in type label ── */}
          <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.typeRow}>
            <Ionicons name={theme.icon} size={14} color={theme.primary} />
            <Text style={[styles.typeLabel, { color: theme.primary }]}>{theme.label}</Text>
          </Animated.View>

          {/* ── Glowing node ── */}
          <GlowingNode color={theme.primary} />

          {/* ── Success word ── */}
          <Animated.Text
            entering={FadeInUp.delay(700).duration(600)}
            style={styles.successWord}
          >
            {theme.successWord}
          </Animated.Text>

          {/* ── Micro insight ── */}
          <Animated.Text
            entering={FadeInUp.delay(950).duration(700)}
            style={styles.microInsight}
          >
            {microInsight}
          </Animated.Text>

          {/* ── Spacer ── */}
          <View style={{ flex: 1 }} />

          {/* ── Done button ── */}
          <Animated.View entering={FadeInUp.delay(1200).duration(600)} style={styles.doneWrapper}>
            <Pressable
              style={({ pressed }) => [
                styles.doneBtn,
                { borderColor: `${theme.primary}45` },
                pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
              ]}
              onPress={onDone}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={[styles.doneBtnText, { color: theme.primary }]}>Done</Text>
            </Pressable>
          </Animated.View>

        </View>
      </View>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  bgTint: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 40,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Glowing node
  nodeContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  nodeOuterGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
  nodeMiddleRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
  },
  nodeCoreWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    shadowOpacity: 0.6,
    elevation: 12,
  },
  nodeCoreHighlight: {
    width: 28,
    height: 28,
    borderRadius: 14,
    position: 'absolute',
    top: 10,
    left: 12,
  },

  successWord: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  microInsight: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontStyle: 'italic',
    maxWidth: 300,
  },

  doneWrapper: { width: '100%' },
  doneBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
