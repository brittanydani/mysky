import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaGradient as LinearGradient } from '../ui/SkiaGradient';
import { VelvetGlassSurface } from '../ui/VelvetGlassSurface';
import { useThemedStyles } from '../../context/ThemeContext';
import { type AppTheme } from '../../constants/theme';

// ── TYPES & DATA ──

interface ChartModule {
  id: string;
  title: string;
  description: string;
  glyph: string;
  iconColor: string;
  washColors: [string, string];
  route: Href;
}

const STORY_MODULES: ChartModule[] = [
  {
    id: 'core',
    title: 'Core Self',
    description: 'Your identity is rooted in water energy with a mutable approach — selfhood rooted in emotional depth, empathy, and intuitive knowing.',
    glyph: '☉',
    iconColor: '#A2C2E1',
    washColors: ['#131722', '#030509'],
    route: '/(tabs)/chart/core-self' as Href,
  },
  {
    id: 'emotion',
    title: 'Emotional World',
    description: 'Your emotional nature processes through air — you process feelings through thinking and conversation, needing understanding to settle.',
    glyph: '☽',
    iconColor: '#6EBF8B',
    washColors: ['#151C1A', '#030509'],
    route: '/(tabs)/chart/emotions' as Href,
  },
  {
    id: 'love',
    title: 'Love & Relationships',
    description: 'You love like a Pisces and desire like a Taurus — emotional intuition and practical desire create steady, meaningful connections.',
    glyph: '♀',
    iconColor: '#DC5050',
    washColors: ['#201315', '#030509'],
    route: '/(tabs)/chart/relationships' as Href,
  },
  {
    id: 'comm',
    title: 'Communication',
    description: 'Your mind works through air — curious, social, and comfortable with complexity. You make sense of the world by naming it and questioning it.',
    glyph: '☿',
    iconColor: '#A88BEB',
    washColors: ['#1A1520', '#030509'],
    route: '/(tabs)/chart/communication' as Href,
  },
];

// ── COMPONENT ──

export const ChartStorySection = () => {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();

  const handlePress = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(route);
  };

  return (
    <View style={styles.sectionContainer}>

      {/* ── Section Header ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Chart Story</Text>
      </View>

      {/* ── Flowing Modules ── */}
      <View style={styles.grid}>
        {STORY_MODULES.map((mod, i) => (
          <Animated.View
            key={mod.id}
            entering={FadeInDown.delay(200 + i * 100).duration(800)}
          >
            <Pressable
              style={({ pressed }) => [pressed && styles.cardPressed]}
              onPress={() => handlePress(mod.route)}
            >
              <VelvetGlassSurface
                style={[styles.card, styles.velvetBorder]}
                intensity={45}
              >
                {/* ── Atmospheric Wash ── */}
                <LinearGradient
                  colors={mod.washColors}
                  style={StyleSheet.absoluteFill}
                />

                {/* ── Top Row: Glyph Hardware Badge ── */}
                <View style={styles.cardHeader}>
                  <View style={[styles.hardwareBadge, { borderColor: `${mod.iconColor}30` }]}>
                    <Text style={[styles.glyphText, { color: mod.iconColor }]}>
                      {mod.glyph}
                    </Text>
                  </View>
                </View>

                {/* ── Content: Sans-Serif Header + Serif Body ── */}
                <View style={styles.cardTextContent}>
                  <Text style={styles.cardTitle}>{mod.title}</Text>
                  <Text style={styles.cardDescription}>{mod.description}</Text>
                </View>

                {/* ── Bottom Row: CTA ── */}
                <View style={styles.cardActionRow}>
                  <Text style={[styles.actionText, { color: mod.iconColor }]}>
                    EXPLORE MODULE
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={mod.iconColor} />
                </View>

              </VelvetGlassSurface>
            </Pressable>
          </Animated.View>
        ))}
      </View>

    </View>
  );
};

// ── STYLES ──

const createStyles = (theme: AppTheme) => StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 64,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  grid: {
    gap: 20,
  },
  card: {
    padding: 28,
    borderRadius: 32,
    overflow: 'hidden',
    minHeight: 220,
    justifyContent: 'space-between',
  },
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  hardwareBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
  },
  glyphText: {
    fontSize: 24,
    fontWeight: '400',
    transform: [{ translateY: -2 }],
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -1.0,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    opacity: 0.8,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
