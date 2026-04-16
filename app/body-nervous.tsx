// app/body-nervous.tsx
// MySky — Body & Nervous System Hub
// Gateway to Somatic Map and Trigger Log tools.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

const ACCENT = {
  sage: '#8CBEAA',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
};

interface ToolCard {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  accentRgb: string;
  route: Href;
}

const TOOLS: ToolCard[] = [
  {
    title: 'Somatic Map',
    description: 'Track where emotions live in your body and notice patterns over time.',
    icon: '◍',
    iconColor: ACCENT.sage,
    accentRgb: '140, 190, 170',
    route: '/somatic-map' as Href,
  },
  {
    title: 'Trigger Log',
    description: 'Name what drains you and what restores you to build your nervous system profile.',
    icon: '⬥',
    iconColor: ACCENT.emerald,
    accentRgb: '110, 191, 139',
    route: '/trigger-log' as Href,
  },
];

export default function BodyNervousScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const nav = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.replace('/(tabs)/identity'); }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MetallicIcon name="chevron-back-outline" size={22} variant="gold" />
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Body & Nervous System</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Somatic awareness & regulation</GoldSubtitle>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.delay(140).duration(600)}>
            <VelvetGlassSurface style={styles.infoCard} intensity={45} backgroundColor={theme.isDark ? 'rgba(18, 18, 24, 0.62)' : 'rgba(255, 255, 255, 0.82)'}>
            {theme.isDark && (
            <LinearGradient
              colors={['rgba(140,190,170,0.08)', 'rgba(10,10,12,0.18)']}
              style={StyleSheet.absoluteFill}
            >
              <View />
            </LinearGradient>
            )}
              <Text style={styles.infoText}>
                Your body holds wisdom your mind hasn't named yet. These tools help you listen.
              </Text>
            </VelvetGlassSurface>
          </Animated.View>

          <View style={[styles.grid, { marginTop: 20 }]}>
            {TOOLS.map((tool, i) => (
              <Animated.View
                key={tool.route as string}
                entering={FadeInDown.delay(220 + i * 80).duration(600)}
              >
                <Pressable
                  style={({ pressed }) => [pressed && styles.cardPressed]}
                  onPress={() => nav(tool.route)}
                >
                  <VelvetGlassSurface style={styles.card} intensity={45} backgroundColor={theme.isDark ? 'rgba(18, 18, 24, 0.62)' : 'rgba(255, 255, 255, 0.82)'}>
                  {theme.isDark && (
                  <LinearGradient
                    colors={[`rgba(${tool.accentRgb}, 0.10)`, 'rgba(10,10,12,0.18)']}
                    style={StyleSheet.absoluteFill}
                  >
                    <View />
                  </LinearGradient>
                  )}
                    <View style={styles.cardHeader}>
                      <MetallicText style={styles.cardIcon} color={tool.iconColor}>{tool.icon}</MetallicText>
                    </View>
                    <Text style={styles.cardTitle}>{tool.title}</Text>
                    <Text style={styles.cardSubtitle}>{tool.description}</Text>
                  </VelvetGlassSurface>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },

  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea:   { paddingHorizontal: 24, paddingBottom: 8 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, borderWidth: 1, borderColor: theme.cardBorder, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: {
    fontSize: 32,
    color: theme.textPrimary,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
    maxWidth: '88%',
  },
  headerSubtitle: { fontSize: 12, color: theme.textSecondary },

  infoCard: {
    borderRadius: 28,
    padding: 28,
    overflow: 'hidden',
  },
  infoText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 20,
  },

  grid: { gap: 20 },
  card: {
    padding: 28,
    borderRadius: 28,
    overflow: 'hidden',
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardIcon: { fontSize: 32 },
  cardTitle: {
    fontSize: 20,
    color: theme.textPrimary,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 22,
  },
});
