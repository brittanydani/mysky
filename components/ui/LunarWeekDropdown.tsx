// components/ui/LunarWeekDropdown.tsx
// 7-day lunar forecast drawer for the Home header.
//
// Interaction model:
//   • Tap the moon orb  → navigate to Cosmic Context (existing MoonPhaseView behaviour)
//   • Tap the chevron   → spring-animate the glassmorphic weekly drawer open/closed
//
// Each day card shows: the day label, a mini volumetric moon orb (display-only),
// and the phase emoji. Phase data is computed via getMoonPhaseInfo() which uses
// the astronomy-engine JPL-grade ephemeris — no manual epoch arithmetic.

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { MetallicText } from './MetallicText';
import * as Haptics from 'expo-haptics';
import MoonPhaseView from './MoonPhaseView';
import { getMoonPhaseInfo } from '../../utils/moonPhase';

// ── Weekly data ───────────────────────────────────────────────────────────────

interface DayData {
  date: Date;
  dayLabel: string;
  emoji: string;
  name: string;
}

function buildWeeklyData(): DayData[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const info = getMoonPhaseInfo(date);
    return {
      date,
      dayLabel: i === 0
        ? 'TODAY'
        : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      emoji: info.emoji,
      name: info.name,
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

const DRAWER_HEIGHT = 116;

export default function LunarWeekDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const heightVal = useSharedValue(0);
  const opacityVal = useSharedValue(0);

  // Computed once per render cycle — phase data is deterministic for a given day
  const weeklyData = useMemo(() => buildWeeklyData(), []);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !isOpen;
    setIsOpen(next);
    heightVal.value = next ? DRAWER_HEIGHT : 0;
    opacityVal.value = next ? 1 : 0;
  };

  const drawerStyle = useAnimatedStyle(() => ({
    height: withSpring(heightVal.value, { damping: 16, stiffness: 180 }),
    opacity: withSpring(opacityVal.value, { damping: 16, stiffness: 220 }),
  }));

  return (
    <View style={styles.wrapper}>
      {/* ── Trigger row ─────────────────────────────────────────────────── */}
      <View style={styles.triggerRow}>
        {/* Moon orb — interactive=true so it retains tap → Cosmic Context */}
        <MoonPhaseView size={42} gradient />

        {/* Chevron — separate tap target for the drawer toggle */}
        <Pressable
          onPress={toggle}
          style={styles.chevronBtn}
          hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={isOpen ? 'Close lunar forecast' : 'Open weekly lunar forecast'}
        >
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={11}
            color="rgba(212,184,114,0.60)"
          />
        </Pressable>
      </View>

      {/* ── Expanding glassmorphic drawer ────────────────────────────────── */}
      <Animated.View style={[styles.drawer, drawerStyle]}>
        {/* Glass background — blur + dark tint overlay */}
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.drawerTint]} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollRow}
        >
          {weeklyData.map((item, i) => (
            <View key={i} style={styles.dayCard}>
              {i === 0 ? (
                <MetallicText style={styles.dayLabel} color="#C5B5A1">
                  {item.dayLabel}
                </MetallicText>
              ) : (
                <Text style={styles.dayLabel}>
                  {item.dayLabel}
                </Text>
              )}
              {/* interactive=false: display-only — prevents nested nav confusion */}
              <MoonPhaseView size={28} date={item.date} interactive={false} gradient />
              <Text style={styles.phaseEmoji}>{item.emoji}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-end',
    zIndex: 100,
    elevation: 100,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  chevronBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14, // align with lower third of the 42pt orb
  },

  // Drawer is absolutely positioned so it overlays scroll content without
  // affecting the header row's flex layout or pushing content down.
  drawer: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 312,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  drawerTint: {
    backgroundColor: 'rgba(6,4,18,0.52)',
  },

  scrollRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
    alignItems: 'center',
  },
  dayCard: {
    width: 52,
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.32)',
    letterSpacing: 0.8,
  },
  todayLabel: {
    color: '#C5B5A1',
  },
  phaseEmoji: {
    fontSize: 13,
  },
});
