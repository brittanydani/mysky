// app/inner-world.tsx
// MySky — Inner World Hub
// Gateway to Core Values, Archetypes, and Cognitive Style tools,
// with daily reflection questions embedded per-category.

import React, { useCallback, useState, useRef } from 'react';
import { logger } from '../utils/logger';
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
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import {
  getCategorySealStatus,
  getReflectionDate,
  loadReflections,
  getCurrentStreak,
} from '../services/insights/dailyReflectionService';
import {
  getSomaticReflectionCorrelations,
  SomaticCorrelation,
} from '../services/insights/reflectionProfileSync';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  ReflectionCategory,
} from '../constants/dailyReflectionQuestions';

const PALETTE = {
  gold: '#D4AF37',
  lavender: '#A89BC8',
  silverBlue: '#C9AE78',
  emerald: '#6EBF8B',
  rose: '#C88BA8',
  textMain: '#FFFFFF',
  textMuted: 'rgba(226,232,240,0.45)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#0A0A0F',
};

const SOMATIC_FALLBACK_LABELS = {
  overall: 'Across Reflections',
} as const;

const SOMATIC_FALLBACK_ICONS = {
  overall: '◌',
} as const;

type ToolId = 'values' | 'archetypes' | 'cognitive' | 'intelligence';

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
  {
    id: 'intelligence',
    title: 'Intelligence Profile',
    description: 'Discover your unique mix of intelligences — how your mind is brilliant.',
    icon: '✧',
    iconColor: PALETTE.rose,
    accentRgb: '200, 139, 168',
    route: '/intelligence-profile' as Href,
  },
];

export default function InnerWorldScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [completion, setCompletion] = useState<Record<ToolId, boolean>>({
    values: false,
    archetypes: false,
    cognitive: false,
    intelligence: false,
  });
  const [categorySealed, setCategorySealed] = useState<Record<ReflectionCategory, boolean>>({
    values: false,
    archetypes: false,
    cognitive: false,
    intelligence: false,
  });
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [somaticCorrelations, setSomaticCorrelations] = useState<SomaticCorrelation[]>([]);

  const hasCompleteCognitiveProfile = (raw: string | null): boolean => {
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw) as Partial<Record<'scope' | 'processing' | 'decisions', number>>;
      return ['scope', 'processing', 'decisions'].every((key) => parsed[key as 'scope' | 'processing' | 'decisions'] !== undefined);
    } catch {
      return false;
    }
  };

  // Check storage on focus to dynamically update completion badges + load questions
  useFocusEffect(
    useCallback(() => {
      const checkProgress = async () => {
        try {
          const refDate = getReflectionDate();

          const [valuesRaw, archetypesRaw, cognitiveRaw, intelligenceRaw, sealStatus, reflData, currentStreak] =
            await Promise.all([
              EncryptedAsyncStorage.getItem('@mysky:core_values'),
              EncryptedAsyncStorage.getItem('@mysky:archetype_profile'),
              EncryptedAsyncStorage.getItem('@mysky:cognitive_style'),
              EncryptedAsyncStorage.getItem('@mysky:intelligence_profile'),
              getCategorySealStatus(refDate),
              loadReflections(),
              getCurrentStreak(),
            ]);

          setCompletion({
            values: !!valuesRaw && JSON.parse(valuesRaw).topFive?.length > 0,
            archetypes: !!archetypesRaw,
            cognitive: hasCompleteCognitiveProfile(cognitiveRaw),
            intelligence: !!intelligenceRaw,
          });

          setCategorySealed(sealStatus);

          setStreak(currentStreak);
          setTotalDays(new Set(reflData.answers.map(a => a.date)).size);

          // Somatic cross-reference (non-blocking — runs after primary load)
          getSomaticReflectionCorrelations().then(setSomaticCorrelations).catch(() => {});
        } catch (e) {
          logger.warn('[InnerWorld] Failed to load progress', e);
        }
      };

      checkProgress().catch(() => {});
    }, [])
  );

  const nav = (route: Href) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(route);
  };

  const allToolsCompleted = completion.values && completion.archetypes && completion.cognitive && completion.intelligence;
  const allCategoriesSealed = categorySealed.values && categorySealed.archetypes && categorySealed.cognitive && categorySealed.intelligence;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <LinearGradient
        colors={['rgba(168, 155, 200, 0.08)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.replace('/(tabs)/identity'); }}
          >
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Inner World</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Mind, values & cognitive patterns</GoldSubtitle>
        </View>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            {/* Sync Status Banner */}
            {allToolsCompleted && (
              <Animated.View entering={FadeInDown.duration(500)} layout={Layout.springify()} style={styles.syncBanner}>
                <MetallicIcon name="git-network-outline" size={16} color={PALETTE.gold} />
                <MetallicText style={styles.syncText} color={PALETTE.gold}>INNER WORLD SYNCHRONIZED</MetallicText>
              </Animated.View>
            )}

            {/* Stats Bar */}
            {(streak > 0 || totalDays > 0) && (
              <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsBar}>
                <View style={styles.statItem}>
                  <MetallicText style={styles.statValue} color={PALETTE.gold}>
                    {totalDays}
                  </MetallicText>
                  <Text style={styles.statLabel}>days</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MetallicText style={styles.statValue} color={PALETTE.gold}>
                    {streak}
                  </MetallicText>
                  <Text style={styles.statLabel}>streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MetallicText style={styles.statValue} color={PALETTE.silverBlue}>
                    {Object.values(categorySealed).filter(Boolean).length}/4
                  </MetallicText>
                  <Text style={styles.statLabel}>recorded</Text>
                </View>
              </Animated.View>
            )}

            {/* All Sealed Banner */}
            {allCategoriesSealed && (
              <Animated.View entering={FadeIn.duration(500)} style={styles.sealedBanner}>
                <MetallicIcon name="shield-checkmark-outline" size={16} color={PALETTE.gold} />
                <MetallicText style={styles.sealedBannerText} color={PALETTE.gold}>
                  ALL CATEGORIES RECORDED TODAY
                </MetallicText>
              </Animated.View>
            )}

            {/* Tool Cards */}
            <Animated.View entering={FadeInDown.delay(560).duration(600)} style={styles.dailyHeader}>
              <MetallicText style={styles.dailyHeaderTitle} color={PALETTE.lavender}>Explore & Log</MetallicText>
              <GoldSubtitle style={styles.dailyHeaderSub}>Build your inner world profile</GoldSubtitle>
            </Animated.View>

            <View style={styles.grid}>
              {TOOLS.map((tool, i) => {
                const isDone = completion[tool.id];

                return (
                  <Animated.View
                    key={tool.id}
                    entering={FadeInDown.delay(620 + i * 80).duration(600)}
                    layout={Layout.springify()}
                  >
                    <Pressable
                      style={({ pressed }) => [pressed && styles.cardPressed]}
                      onPress={() => nav(tool.route)}
                    >
                      <VelvetGlassSurface style={styles.card} intensity={45} backgroundColor="rgba(18, 18, 24, 0.62)">
                        <LinearGradient
                          colors={[`rgba(${tool.accentRgb}, 0.10)`, 'rgba(10,10,15,0.18)']}
                          style={StyleSheet.absoluteFill}
                        >
                          <View />
                        </LinearGradient>
                        <View style={styles.cardHeader}>
                          <MetallicText style={[styles.cardIcon]} color={tool.iconColor}>{tool.icon}</MetallicText>

                          <View style={[styles.badge, isDone ? { backgroundColor: `${PALETTE.gold}18`, borderColor: `${PALETTE.gold}38` } : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                            {isDone ? (
                              <MetallicText style={styles.badgeText} color={PALETTE.gold}>RECORDED</MetallicText>
                            ) : (
                              <Text style={[styles.badgeText, { color: PALETTE.textMuted }]}>EXPLORE</Text>
                            )}
                            {isDone && <MetallicIcon name="checkmark-outline" size={10} color={PALETTE.gold} style={{ marginLeft: 4 }} />}
                          </View>
                        </View>

                        <Text style={styles.cardTitle}>{tool.title}</Text>
                        <Text style={styles.cardSubtitle}>{tool.description}</Text>
                      </VelvetGlassSurface>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* Journey Progress */}
            {totalDays > 0 && (
              <Animated.View entering={FadeIn.delay(900).duration(500)} style={styles.progressSection}>
                <Text style={styles.progressTitle}>Your Journey</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min((totalDays / 365) * 100, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {totalDays} of 365 days — {Math.round((totalDays / 365) * 100)}% of a full cycle
                </Text>

                <Pressable
                  style={styles.pastLink}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    router.push('/past-reflections');
                  }}
                >
                  <MetallicIcon name="time-outline" size={16} color={PALETTE.gold} />
                  <MetallicText style={styles.pastLinkText} color={PALETTE.gold}>
                    View Past Reflections
                  </MetallicText>
                  <MetallicIcon name="chevron-forward-outline" size={14} color={PALETTE.gold} />
                </Pressable>
              </Animated.View>
            )}

            {/* Body Intelligence */}
            {somaticCorrelations.length > 0 && (
              <Animated.View entering={FadeInDown.delay(400).duration(500)}>
                <VelvetGlassSurface style={styles.somaticCard} intensity={40} backgroundColor="rgba(18, 24, 20, 0.56)">
                <Text style={styles.somaticLabel}>BODY INTELLIGENCE</Text>
                <Text style={styles.somaticDesc}>
                  The body states that show up most often on your reflection days:
                </Text>
                {somaticCorrelations.map(c => (
                  <View key={c.category} style={styles.somaticRow}>
                    <Text style={styles.somaticCat}>
                      {c.category === 'overall'
                        ? `${SOMATIC_FALLBACK_ICONS.overall} ${SOMATIC_FALLBACK_LABELS.overall}`
                        : `${CATEGORY_ICONS[c.category]} ${CATEGORY_LABELS[c.category]}`}
                    </Text>
                    <View style={styles.somaticValueGroup}>
                      <Text style={styles.somaticEmotion}>{c.topEmotion}</Text>
                      <Text style={styles.somaticCount}>
                        {c.count} {c.count === 1 ? 'day' : 'days'}
                      </Text>
                    </View>
                  </View>
                ))}
                </VelvetGlassSurface>
              </Animated.View>
            )}

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

  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea:   { paddingHorizontal: 24, paddingBottom: 8 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', justifyContent: 'center', alignItems: 'center' },
  closeIcon:   { color: '#FFF', fontSize: 24, lineHeight: 28 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: {
    fontSize: 31,
    color: PALETTE.textMain,
    fontWeight: '700',
    letterSpacing: -0.9,
    marginBottom: 4,
    maxWidth: '88%',
  },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.72)' },

  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(217,191,140,0.18)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  syncText: { fontSize: 11, color: PALETTE.emerald, fontWeight: '800', letterSpacing: 1.5 },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.62)', fontWeight: '600', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 28, backgroundColor: PALETTE.glassBorder },

  // Sealed banner
  sealedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(217,191,140,0.18)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  sealedBannerText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  grid: { gap: 20, marginBottom: 36 },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderTopColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
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
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    color: 'rgba(226,232,240,0.7)',
    lineHeight: 22,
  },

  // Daily questions header
  dailyHeader: { marginBottom: 24 },
  dailyHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  dailyHeaderSub: { fontSize: 13, color: 'rgba(255,255,255,0.66)' },

  // Progress
  progressSection: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: PALETTE.glassBorder,
  },
  progressTitle: {
    fontSize: 13,
    color: PALETTE.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: PALETTE.gold,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(226,232,240,0.68)',
    lineHeight: 18,
  },
  pastLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(217, 191, 140, 0.15)',
    borderRadius: 14,
  },
  pastLinkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },

  // Body Intelligence (somatic cross-reference)
  somaticCard: {
    marginTop: 24,
    borderRadius: 24,
    padding: 20,
    gap: 10,
  },
  somaticLabel: {
    fontSize: 10,
    color: PALETTE.emerald,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  somaticDesc: {
    fontSize: 12,
    color: PALETTE.textMuted,
    lineHeight: 17,
  },
  somaticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  somaticCat: {
    fontSize: 13,
    color: PALETTE.textMain,
    fontWeight: '700',
  },
  somaticValueGroup: {
    alignItems: 'flex-end',
    gap: 2,
  },
  somaticEmotion: {
    fontSize: 13,
    color: PALETTE.emerald,
    fontWeight: '600',
  },
  somaticCount: {
    fontSize: 11,
    color: PALETTE.textMuted,
    fontWeight: '500',
  },
});
