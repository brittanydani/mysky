// File: app/(tabs)/checkin.tsx
// MySky — Check In Hub
//
// Single entry point for daily self-logging.
// Two cards surface the two check-in pathways without cluttering the tab bar.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';

const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  emerald: '#6EBF8B',
  amethyst: '#9D76C1',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.45)',
  glassBorder: 'rgba(255,255,255,0.06)',
};

interface CheckInCard {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  gradientColors: [string, string];
  route: Href;
}

const CARDS: CheckInCard[] = [
  {
    title: 'Mood & Energy',
    subtitle: 'How are you feeling?',
    description: 'Log your emotional state, energy, and stress. Tag what shaped your day.',
    icon: 'happy-outline',
    color: '#8BC4E8',
    gradientColors: ['rgba(139, 196, 232, 0.18)', 'rgba(14, 18, 30, 0.7)'],
    route: '/(tabs)/mood' as Href,
  },
  {
    title: 'Sleep & Dreams',
    subtitle: 'How did you rest?',
    description: 'Track sleep quality, duration, and capture your dreams while they\'re fresh.',
    icon: 'moon-outline',
    color: '#9D76C1',
    gradientColors: ['rgba(157, 118, 193, 0.18)', 'rgba(14, 18, 30, 0.7)'],
    route: '/(tabs)/sleep' as Href,
  },
];

export default function CheckInScreen() {
  const router = useRouter();

  const nav = (route: Href) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.title}>Check In</Text>
            <Text style={styles.subtitle}>What would you like to track today?</Text>
          </Animated.View>

          {/* ── Check-in cards ── */}
          {CARDS.map((card, i) => (
            <Animated.View
              key={card.route as string}
              entering={FadeInDown.delay(160 + i * 100).duration(600)}
              style={styles.cardWrapper}
            >
              <Pressable
                onPress={() => nav(card.route)}
                style={({ pressed }) => [styles.pressable, pressed && styles.pressableActive]}
              >
                <LinearGradient colors={card.gradientColors} style={styles.card}>
                  <View style={[styles.iconRing, { borderColor: card.color + '40' }]}>
                    <Ionicons name={card.icon} size={28} color={card.color} />
                  </View>

                  <View style={styles.cardText}>
                    <Text style={styles.cardEyebrow}>{card.subtitle}</Text>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardDescription}>{card.description}</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={PALETTE.textMuted} style={styles.chevron} />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))}

          {/* ── Nudge ── */}
          <Animated.View entering={FadeInDown.delay(380).duration(600)} style={styles.nudge}>
            <Ionicons name="time-outline" size={14} color={PALETTE.textMuted} />
            <Text style={styles.nudgeText}>Takes about 2 minutes</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090F',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 12, android: 16, default: 12 }),
    justifyContent: 'center',
    gap: 16,
  },
  header: {
    marginBottom: 0,
  },
  waveWrapper: {
    marginHorizontal: -4,
    marginBottom: 2,
    overflow: 'hidden',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },
  cardWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  pressable: {
    borderRadius: 18,
  },
  pressableActive: {
    opacity: 0.8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 20,
    gap: 16,
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
    marginTop: 2,
  },
  chevron: {
    flexShrink: 0,
  },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  nudgeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
});
