// File: app/(tabs)/blueprint.tsx
// MySky — Blueprint: The Master Layout
//
// The user's complete psychological architecture:
//   1. Hero — Core Force Map radar chart + Export PDF
//   2. Story — 10 Chapters as expandable cards
//   3. Deep Dives — Energy Domains + Relationships

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import { applyStoryLabels } from '../../constants/storyLabels';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { PsychologicalForcesRadar } from '../../components/ui/PsychologicalForcesRadar';
import ChapterCard from '../../components/ui/ChapterCard';
import SkiaStoryGate, { CHAPTER_COLORS } from '../../components/ui/SkiaStoryGate';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { FullNatalStoryGenerator, GeneratedChapter } from '../../services/premium/fullNatalStory';
import { exportChartToPdf } from '../../services/premium/pdfExport';
import { NatalChart } from '../../services/astrology/types';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { SkeletonBlueprint } from '../../components/ui/SkeletonLoader';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  emerald: '#6EBF8B',
  amethyst: '#9D76C1',
  textMain: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.75)',
  textMuted: 'rgba(255,255,255,0.45)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

// ── Force calculation ──

const FORCE_COLORS_MAP: Record<string, string> = {
  'Sun': '#C9AE78', 'Moon': '#8BC4E8', 'Mars': '#CD7F5D',
  'Venus': '#F4C2C2', 'Saturn': '#A9A9A9', 'Jupiter': '#9370DB',
  'Mercury': '#FFEA70', 'Pluto': '#9D76C1', 'Neptune': '#48D1CC',
  'Uranus': '#FF8C00', 'Aries': '#CD7F5D', 'Taurus': '#6EBF8B',
  'Gemini': '#FFEA70', 'Cancer': '#8BC4E8', 'Leo': '#C9AE78',
  'Virgo': '#A9A9A9', 'Libra': '#F4C2C2', 'Scorpio': '#9D76C1',
  'Sagittarius': '#9370DB', 'Capricorn': '#A9A9A9', 'Aquarius': '#48D1CC',
  'Pisces': '#8BC4E8',
};

function calculateForces(chart: NatalChart | null) {
  if (!chart || !chart.placements) return [];

  const scores: Record<string, { label: string; val: number; color: string }> = {};

  const addScore = (key: string, points: number) => {
    if (!scores[key]) scores[key] = { label: key, val: 0, color: FORCE_COLORS_MAP[key] || theme.textGold };
    scores[key].val += points;
  };

  chart.placements.forEach(p => {
    const isLuminary = ['Sun', 'Moon'].includes(p.planet.name);
    const isPersonal = ['Mercury', 'Venus', 'Mars'].includes(p.planet.name);
    const points = isLuminary ? 30 : isPersonal ? 20 : 10;
    addScore(p.planet.name, points);
    if (p.sign && p.sign.name) addScore(p.sign.name, points);
  });

  if (chart.risingSign) addScore(chart.risingSign.name, 30);

  return Object.values(scores)
    .sort((a, b) => b.val - a.val)
    .slice(0, 6)
    .map(f => ({
      label: f.label,
      value: Math.min(100, (f.val / 60) * 100),
      color: f.color,
    }));
}

// ── Deep-dive links (below chapters) ──

interface DeepDive {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  route: string;
  premium: boolean;
}

const DEEP_DIVES: DeepDive[] = [
  {
    id: 'energy',
    title: 'Energy Domains',
    subtitle: 'Chakra mandala & energy guidance',
    icon: 'pulse-outline',
    iconColor: PALETTE.amethyst,
    route: '/(tabs)/energy',
    premium: true,
  },
  {
    id: 'relationships',
    title: 'Relationships',
    subtitle: 'Add charts & explore dynamics',
    icon: 'people-outline',
    iconColor: PALETTE.silverBlue,
    route: '/(tabs)/relationships',
    premium: true,
  },
];

export default function BlueprintScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [chapters, setChapters] = useState<GeneratedChapter[]>([]);
  const [hasChart, setHasChart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          setLoading(true);
          const charts = await localDb.getCharts();
          if (!isActive) return;

          if (charts.length > 0) {
            setHasChart(true);
            const savedChart = charts[0];
            const birthData = {
              date: savedChart.birthDate,
              time: savedChart.birthTime,
              hasUnknownTime: savedChart.hasUnknownTime,
              place: savedChart.birthPlace,
              latitude: savedChart.latitude,
              longitude: savedChart.longitude,
              timezone: savedChart.timezone,
              houseSystem: savedChart.houseSystem,
            };
            const natal = AstrologyCalculator.generateNatalChart(birthData);
            const story = FullNatalStoryGenerator.generateFullStory(natal, isPremium);
            if (!isActive) return;
            setChart(natal);
            setChapters(story.chapters);
          } else {
            setHasChart(false);
            setChart(null);
            setChapters([]);
          }
        } catch (e) {
          logger.error('[Blueprint] load failed:', e);
        } finally {
          if (isActive) setLoading(false);
        }
      })();

      return () => { isActive = false; };
    }, [isPremium])
  );

  const handleExportPdf = useCallback(async () => {
    if (!isPremium) {
      router.push('/(tabs)/premium' as Href);
      return;
    }
    if (!chart || chapters.length === 0 || isExporting) return;

    setIsExporting(true);
    try {
      await exportChartToPdf(chart, chapters);
    } catch (err) {
      logger.error('PDF export failed:', err);
      Alert.alert('Export failed', 'Something went wrong generating the PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [isPremium, chart, chapters, isExporting, router]);

  const handleDeepDivePress = useCallback((item: DeepDive) => {
    if (!hasChart) {
      router.push('/(tabs)/home' as Href);
      return;
    }
    if (item.premium && !isPremium) {
      router.push('/(tabs)/premium' as Href);
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    router.push(item.route as Href);
  }, [hasChart, isPremium, router]);

  const forces = calculateForces(chart);
  const unlockedCount = chapters.filter(c => !c.isPremium || isPremium).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView style={styles.safeArea}>
          <SkeletonBlueprint />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. Header ── */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <Text style={styles.title}>Blueprint</Text>
            <Text style={styles.headerSub}>
              Your personal architecture — a structured framework of behavioral patterns, core drives, and growth vectors.
            </Text>
            {chapters.length > 0 && (
              <Text style={styles.dimensionLabel}>
                {chapters.length} dimensions — {unlockedCount} mapped
              </Text>
            )}
          </Animated.View>

          {/* ── Hero: Core Force Map ── */}
          {hasChart && forces.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.radarWrap}>
              <Text style={styles.radarLabel}>Core Force Map</Text>
              <PsychologicalForcesRadar forces={forces} size={SCREEN_W - 40} />

              {/* Export PDF */}
              <Pressable
                onPress={handleExportPdf}
                disabled={isExporting}
                style={({ pressed }) => [styles.exportButton, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel="Export chart as PDF"
              >
                <LinearGradient
                  colors={['rgba(232,214,174,0.18)', 'rgba(232,214,174,0.08)']}
                  style={styles.exportBtnGradient}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color={PALETTE.gold} />
                  ) : (
                    <>
                      <Ionicons name="share-outline" size={16} color={PALETTE.gold} />
                      <Text style={styles.exportButtonText}>Export PDF</Text>
                      {!isPremium && (
                        <View style={styles.premiumBadge}>
                          <Ionicons name="diamond-outline" size={10} color={PALETTE.gold} />
                          <Text style={styles.premiumText}>PRO</Text>
                        </View>
                      )}
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.emptyState}>
              <LinearGradient
                colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']}
                style={styles.emptyCard}
              >
                <Ionicons name="book-outline" size={48} color={PALETTE.textMuted} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>Your architecture awaits</Text>
                <Text style={styles.emptySubtitle}>
                  Enter your birth details to build a personalized blueprint of behavioral patterns, drives, and growth directions.
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/home' as Href)}
                  style={styles.emptyButton}
                  accessibilityRole="button"
                  accessibilityLabel="Build your blueprint"
                >
                  <Text style={styles.emptyButtonText}>Build Your Blueprint</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── 2. The 10 Chapters ── */}
          {chapters.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Story</Text>
              <Text style={styles.sectionSubtitle}>10 dimensions of your psychological architecture</Text>
            </Animated.View>
          )}

          {chapters.map((chapter, index) => {
            const isLocked = !isPremium && chapter.isPremium;

            return (
              <Animated.View
                key={chapter.id}
                entering={FadeInDown.delay(250 + index * 60).duration(500)}
              >
                <SkiaStoryGate
                  index={index}
                  title={applyStoryLabels(chapter.title)}
                  isUnlocked={!isLocked}
                  isPremium={isPremium}
                  accentColor={CHAPTER_COLORS[index]}
                  onPress={() => {
                    if (isLocked) {
                      router.push('/(tabs)/premium' as Href);
                    } else {
                      Haptics.selectionAsync().catch(() => {});
                      setExpandedChapterId(prev => prev === chapter.id ? null : chapter.id);
                    }
                  }}
                />
                {!isLocked && expandedChapterId === chapter.id && (
                  <Animated.View entering={FadeInDown.duration(400)}>
                    <ChapterCard
                      chapter={`Chapter ${index + 1}`}
                      title={applyStoryLabels(chapter.title)}
                      content={applyStoryLabels(chapter.content)}
                      reflection={applyStoryLabels(chapter.reflection)}
                      affirmation={applyStoryLabels(chapter.affirmation)}
                    />
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}

          {/* Unlock prompt */}
          {!isPremium && chapters.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250 + chapters.length * 60).duration(500)}>
              <Pressable
                onPress={() => router.push('/(tabs)/premium' as Href)}
                accessibilityRole="button"
                accessibilityLabel="Unlock all chapters"
              >
                <LinearGradient
                  colors={['rgba(232, 214, 174, 0.15)', 'rgba(2,8,23,0.60)']}
                  style={styles.upsellGradient}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Ionicons name="sparkles" size={18} color={PALETTE.gold} />
                    <Text style={styles.upsellTitle}>7 more dimensions to explore</Text>
                  </View>
                  <Text style={styles.upsellText}>
                    Attachment Style · Conflict Resolution · Inner Child Patterns · Shadow Integration · Growth Vectors — and more.
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                    <Text style={styles.unlockText}>Expand your blueprint</Text>
                    <Ionicons name="arrow-forward" size={14} color={PALETTE.gold} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* ── 3. Deep Dives ── */}
          {hasChart && (
            <Animated.View entering={FadeInDown.delay(300 + chapters.length * 60).duration(500)} style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Frameworks</Text>
              <Text style={styles.sectionSubtitle}>Additional structural tools</Text>
            </Animated.View>
          )}

          {hasChart && DEEP_DIVES.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(350 + chapters.length * 60 + index * 80).duration(500)}
            >
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => handleDeepDivePress(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}: ${item.subtitle}`}
              >
                <LinearGradient
                  colors={['rgba(14, 24, 48, 0.55)', 'rgba(10, 18, 36, 0.40)']}
                  style={styles.cardInner}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.iconCircle, { backgroundColor: `${item.iconColor}15` }]}>
                      <Ionicons name={item.icon} size={24} color={item.iconColor} />
                    </View>
                    <View style={styles.cardTextCol}>
                      <View style={styles.titleRow}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {item.premium && !isPremium && (
                          <View style={styles.premiumBadge}>
                            <Ionicons name="diamond-outline" size={10} color={PALETTE.gold} />
                            <Text style={styles.premiumText}>PRO</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={PALETTE.textMuted} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },

  loadingText: {
    color: PALETTE.textMuted,
    fontStyle: 'italic',
    fontSize: 15,
  },

  // Header
  header: { alignItems: 'center', marginBottom: 24 },
  title: {
    color: PALETTE.textMain,
    fontSize: 32,
    fontWeight: '700',
    fontFamily: SERIF,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  headerSub: {
    color: PALETTE.textSoft,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  dimensionLabel: {
    color: PALETTE.textMuted,
    fontSize: 13,
    marginTop: 12,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },

  // Radar
  radarWrap: { alignItems: 'center', marginBottom: 28 },
  radarLabel: {
    color: PALETTE.textSoft,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: SERIF,
    marginBottom: 4,
  },

  // Export PDF
  exportButton: { marginTop: 4, borderRadius: 20, overflow: 'hidden' },
  exportBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.25)',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.gold,
  },

  // Section headers
  sectionHeader: { marginTop: 8, marginBottom: 16 },
  sectionTitle: {
    color: PALETTE.textMain,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: SERIF,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: PALETTE.textMuted,
    fontSize: 13,
  },

  // Deep-dive cards
  card: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  cardInner: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  cardTextCol: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    color: PALETTE.textMain,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: PALETTE.textSoft,
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },

  // Premium badge
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 174, 120, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201, 174, 120, 0.25)',
  },
  premiumText: {
    color: PALETTE.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Upsell
  upsellGradient: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.18)',
    marginTop: 16,
  },
  upsellTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PALETTE.textMain,
    fontFamily: SERIF,
  },
  upsellText: {
    fontSize: 14,
    color: PALETTE.textSoft,
    lineHeight: 22,
  },
  unlockText: {
    fontSize: 14,
    color: PALETTE.gold,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    marginBottom: 24,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    color: PALETTE.textMain,
    fontFamily: SERIF,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: PALETTE.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.25)',
  },
  emptyButtonText: {
    color: PALETTE.gold,
    fontWeight: '700',
    fontSize: 15,
  },
});
