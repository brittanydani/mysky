// File: app/log/index.tsx
// LogSelectorModal — "What are we logging?"
//
// Presented as a full-screen modal that slides up over the tabs.
// Two option cards lead to the Internal Weather or Sleep log screens.

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';

// ── Palette ──────────────────────────────────────────────────────────────────

const P = {
  bg: '#020817',
  gold: '#D4AF37',
  goldLight: '#EBC07D',
  moonBlue: '#8BC4E8',
  textMain: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.72)',
  textMuted: 'rgba(255,255,255,0.42)',
  cardWeatherBg: 'rgba(212,175,55,0.04)',
  cardWeatherBorder: 'rgba(212,175,55,0.22)',
  cardSleepBg: 'rgba(139,196,232,0.04)',
  cardSleepBorder: 'rgba(139,196,232,0.22)',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function LogSelectorModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleWeather = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/log/internal-weather' as Href);
  }, [router]);

  const handleSleep = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/log/sleep' as Href);
  }, [router]);

  const handleDismiss = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Top area: drag handle + close button + header */}
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>

        <View style={styles.dragHandle} />

        <View style={styles.closeRow}>
          <Pressable
            style={styles.closeBtn}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          >
            <Ionicons name="close" size={20} color={P.textSoft} />
          </Pressable>
        </View>

        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={styles.eyebrow}>Log</Text>
          <Text style={styles.title}>What are we{'\n'}logging?</Text>
          <Text style={styles.subtitle}>Choose your path for this moment.</Text>
        </Animated.View>
      </View>

      {/* Option cards */}
      <View style={[styles.cards, { paddingBottom: insets.bottom + 32 }]}>

        {/* Internal Weather */}
        <Animated.View entering={FadeInDown.delay(120).duration(460)}>
          <Pressable
            style={({ pressed }) => [
              styles.card,
              styles.cardWeather,
              pressed && styles.cardPressed,
            ]}
            onPress={handleWeather}
            accessibilityRole="button"
            accessibilityLabel="Log Internal Weather — mood, energy, and stress"
          >
            <View style={[styles.iconRing, styles.iconRingGold]}>
              <Ionicons name="partly-sunny-outline" size={26} color={P.gold} />
            </View>

            <Text style={styles.cardTitle}>Internal Weather</Text>
            <Text style={styles.cardDesc}>
              Log mood, energy, stress, and what shaped your day.
            </Text>

            <View style={styles.cardChevron}>
              <Ionicons name="chevron-forward" size={17} color={P.goldLight} />
            </View>
          </Pressable>
        </Animated.View>

        {/* Sleep */}
        <Animated.View entering={FadeInDown.delay(240).duration(460)}>
          <Pressable
            style={({ pressed }) => [
              styles.card,
              styles.cardSleep,
              pressed && styles.cardPressed,
            ]}
            onPress={handleSleep}
            accessibilityRole="button"
            accessibilityLabel="Log Sleep — hours slept, quality, and dream impressions"
          >
            <View style={[styles.iconRing, styles.iconRingMoon]}>
              <Ionicons name="moon-outline" size={26} color={P.moonBlue} />
            </View>

            <Text style={styles.cardTitle}>Sleep</Text>
            <Text style={styles.cardDesc}>
              Log hours slept, sleep quality, and any dream impressions.
            </Text>

            <View style={styles.cardChevron}>
              <Ionicons name="chevron-forward" size={17} color={P.moonBlue} />
            </View>
          </Pressable>
        </Animated.View>

      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },

  // ── Top section ──
  top: {
    paddingHorizontal: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  eyebrow: {
    fontSize: 11,
    color: P.gold,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: P.textMain,
    letterSpacing: -0.6,
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: P.textSoft,
    letterSpacing: 0.1,
  },

  // ── Cards ──
  cards: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 14,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    position: 'relative',
  },
  cardWeather: {
    backgroundColor: P.cardWeatherBg,
    borderColor: P.cardWeatherBorder,
  },
  cardSleep: {
    backgroundColor: P.cardSleepBg,
    borderColor: P.cardSleepBorder,
  },
  cardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.978 }],
  },

  iconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconRingGold: {
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.22)',
  },
  iconRingMoon: {
    backgroundColor: 'rgba(139,196,232,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(139,196,232,0.22)',
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: '600',
    color: P.textMain,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: P.textSoft,
    lineHeight: 20,
    paddingRight: 28,
  },
  cardChevron: {
    position: 'absolute',
    right: 22,
    bottom: 26,
  },
});
