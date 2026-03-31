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
  Platform,
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
  emerald: '#C9AE78',
  rose: '#D4A3B3',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.6)',
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
        <Pressable
          style={styles.backBtn}
          onPress={() => { Haptics.selectionAsync().catch(() => {}); router.replace('/(tabs)/blueprint'); }}
        >
          <MetallicText style={styles.backText} variant="green">← Identity</MetallicText>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.headerTitle}>Body & Nervous System</Text>
            <GoldSubtitle style={styles.headerSubtitle}>Somatic awareness & regulation</GoldSubtitle>
          </Animated.View>

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
  container: { flex: 1, backgroundColor: '#0A0A0C' },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  backBtn: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: 'rgba(140,190,170,0.8)', fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  header: { marginBottom: 32 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14 },

  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(140,190,170,0.15)',
    padding: 16,
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
