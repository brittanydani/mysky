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

const PALETTE = {
  sage: '#8CBEAA',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
  textMain: '#FFFFFF',
  textMuted: 'rgba(226,232,240,0.45)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

interface ToolCard {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  accentRgb: string;
  route: Href;
  iconOffset?: number;
  iconLeft?: number;
}

const TOOLS: ToolCard[] = [
  {
    title: 'Somatic Map',
    description: 'Track where emotions live in your body and notice patterns over time.',
    icon: '◍',
    iconColor: PALETTE.sage,
    accentRgb: '140, 190, 170',
    route: '/somatic-map' as Href,
  },
  {
    title: 'Trigger Log',
    description: 'Name what drains you and what restores you to build your nervous system profile.',
    icon: '⬥',
    iconColor: PALETTE.emerald,
    accentRgb: '110, 191, 139',
    route: '/trigger-log' as Href,
    iconOffset: -10,
    iconLeft: -4,
  },
];

export default function BodyNervousScreen() {
  const router = useRouter();

  const nav = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <LinearGradient
        colors={['rgba(140, 190, 170, 0.08)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.replace('/(tabs)/identity'); }}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Body & Nervous System</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Somatic awareness & regulation</GoldSubtitle>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.delay(140).duration(600)}>
            <LinearGradient
              colors={['rgba(140,190,170,0.08)', 'rgba(10,10,12,0.85)']}
              style={styles.infoCard}
            >
              <Text style={styles.infoText}>
                Your body holds wisdom your mind hasn't named yet. These tools help you listen.
              </Text>
            </LinearGradient>
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
                  <LinearGradient
                    colors={[`rgba(${tool.accentRgb}, 0.1)`, 'rgba(10,10,12,0.85)']}
                    style={styles.card}
                  >
                    <MetallicText style={[styles.cardIcon, { marginBottom: tool.iconOffset ?? 0, marginLeft: tool.iconLeft ?? 0 }]} color={tool.iconColor}>{tool.icon}</MetallicText>
                    <Text style={styles.cardTitle}>{tool.title}</Text>
                    <Text style={styles.cardSubtitle}>{tool.description}</Text>
                  </LinearGradient>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },

  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea:   { paddingHorizontal: 24, paddingBottom: 8 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon:   { color: '#FFF', fontSize: 34, lineHeight: 34, marginTop: -2 },

  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14 },

  infoCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(140,190,170,0.15)',
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
  },

  grid: { gap: 20 },
  card: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  cardIcon: { fontSize: 32, marginBottom: 16 },
  cardTitle: {
    fontSize: 20,
    color: PALETTE.textMain,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 16,
    color: PALETTE.textMuted,
    lineHeight: 24,
  },
});
