// app/inner-world.tsx
// MySky — Inner World Hub
// Gateway to Core Values, Archetypes, and Cognitive Style tools.

import React, { useCallback, useState } from 'react';
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
import { BlurView } from 'expo-blur';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';

const PALETTE = {
  gold: '#D9BF8C',
  lavender: '#A89BC8',
  silverBlue: '#8BC4E8',
  emerald: '#6EBF8B',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#0A0A0C',
};

type ToolId = 'values' | 'archetypes' | 'cognitive';

interface ToolCard {
  id: ToolId;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  accentRgb: string;
  route: Href;
}

const TOOLS: ToolCard[] = [
  {
    id: 'values',
    title: 'Core Values',
    description: 'Identify what guides your everyday choices and uncover hidden contradictions.',
    icon: '◈',
    iconColor: PALETTE.gold,
    accentRgb: '217, 191, 140',
    route: '/core-values' as Href,
  },
  {
    id: 'archetypes',
    title: 'Archetypes',
    description: 'Discover the Jungian patterns driving your behavior and relationships.',
    icon: '⬡',
    iconColor: PALETTE.lavender,
    accentRgb: '168, 155, 200',
    route: '/archetypes' as Href,
  },
  {
    id: 'cognitive',
    title: 'Cognitive Style',
    description: 'Map how your mind naturally processes information and makes decisions.',
    icon: '◉',
    iconColor: PALETTE.silverBlue,
    accentRgb: '139, 196, 232',
    route: '/cognitive-style' as Href,
  },
];

export default function InnerWorldScreen() {
  const router = useRouter();
  const [completion, setCompletion] = useState<Record<ToolId, boolean>>({
    values: false,
    archetypes: false,
    cognitive: false,
  });

  // Check storage on focus to dynamically update completion badges
  useFocusEffect(
    useCallback(() => {
      const checkProgress = async () => {
        try {
          const [valuesRaw, archetypesRaw, cognitiveRaw] = await Promise.all([
            AsyncStorage.getItem('@mysky:core_values'),
            AsyncStorage.getItem('@mysky:archetype_profile'),
            AsyncStorage.getItem('@mysky:cognitive_style'),
          ]);

          setCompletion({
            values: !!valuesRaw && JSON.parse(valuesRaw).topFive?.length > 0,
            archetypes: !!archetypesRaw,
            cognitive: !!cognitiveRaw && Object.keys(JSON.parse(cognitiveRaw)).length === 3,
          });
        } catch (e) {
          console.warn('[InnerWorld] Failed to load progress', e);
        }
      };

      checkProgress();
    }, [])
  );

  const nav = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(route);
  };

  const allCompleted = completion.values && completion.archetypes && completion.cognitive;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <LinearGradient
        colors={['rgba(168, 155, 200, 0.08)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          style={styles.backBtn}
          onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
        >
          <Ionicons name="arrow-back" size={20} color={PALETTE.lavender} />
          <Text style={styles.backText}>Identity</Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.headerTitle}>Inner World</Text>
            <GoldSubtitle style={styles.headerSubtitle}>Mind, values & cognitive patterns</GoldSubtitle>
          </Animated.View>

          {/* Sync Status Banner */}
          {allCompleted && (
            <Animated.View entering={FadeInDown.duration(500)} layout={Layout.springify()} style={styles.syncBanner}>
              <Ionicons name="git-network-outline" size={16} color={PALETTE.emerald} />
              <Text style={styles.syncText}>INNER WORLD SYNCHRONIZED</Text>
            </Animated.View>
          )}

          <View style={styles.grid}>
            {TOOLS.map((tool, i) => {
              const isDone = completion[tool.id];

              return (
                <Animated.View
                  key={tool.id}
                  entering={FadeInDown.delay(160 + i * 80).duration(600)}
                  layout={Layout.springify()}
                >
                  <Pressable
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    onPress={() => nav(tool.route)}
                  >
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <LinearGradient
                      colors={[`rgba(${tool.accentRgb}, 0.1)`, 'transparent']}
                      style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.cardContent}>
                      <View style={styles.cardHeader}>
                        <Text style={[styles.cardIcon, { color: tool.iconColor }]}>{tool.icon}</Text>

                        {/* Dynamic Completion Badge */}
                        <View style={[styles.badge, isDone ? { backgroundColor: `${PALETTE.emerald}20`, borderColor: `${PALETTE.emerald}40` } : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                          <Text style={[styles.badgeText, isDone ? { color: PALETTE.emerald } : { color: PALETTE.textMuted }]}>
                            {isDone ? 'SEALED' : 'EXPLORE'}
                          </Text>
                          {isDone && <Ionicons name="checkmark" size={10} color={PALETTE.emerald} style={{ marginLeft: 4 }} />}
                        </View>
                      </View>

                      <View>
                        <Text style={styles.cardTitle}>{tool.title}</Text>
                        <Text style={styles.cardSubtitle}>{tool.description}</Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: PALETTE.lavender, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  header: { marginBottom: 32 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '300',
    marginBottom: 8,
  },
  headerSubtitle: { fontSize: 14 },

  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(110, 191, 139, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(110, 191, 139, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  syncText: { fontSize: 11, color: PALETTE.emerald, fontWeight: '800', letterSpacing: 1.5 },

  grid: { gap: 20 },
  card: {
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  cardContent: { flex: 1, padding: 24, justifyContent: 'space-between' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIcon: { fontSize: 32 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  cardTitle: {
    fontSize: 20,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '400',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: PALETTE.textMuted,
    lineHeight: 18,
    paddingRight: 10,
  },
});
