import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import { applyStoryLabels } from '../../constants/storyLabels';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import ChapterCard from '../../components/ui/ChapterCard';
import SkiaStoryGate, { CHAPTER_COLORS } from '../../components/ui/SkiaStoryGate';
import { PsychologicalForcesRadar } from '../../components/ui/PsychologicalForcesRadar';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { FullNatalStoryGenerator, GeneratedChapter } from '../../services/premium/fullNatalStory';
import { exportChartToPdf } from '../../services/premium/pdfExport';
import { NatalChart } from '../../services/astrology/types';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4B872',
  bg: '#0A0A0C', // Unified OLED Black
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.08)',
};

const FORCE_COLORS_MAP: Record<string, string> = {
  'Sun': '#C9AE78',
  'Moon': '#8BC4E8',
  'Mars': '#CD7F5D',
  'Venus': '#F4C2C2',
  'Saturn': '#A9A9A9',
  'Jupiter': '#9370DB',
  'Mercury': '#FFEA70',
  'Pluto': '#9D76C1',
  'Neptune': '#48D1CC',
  'Uranus': '#FF8C00',
  'Aries': '#CD7F5D',
  'Taurus': '#6EBF8B',
  'Gemini': '#FFEA70',
  'Cancer': '#8BC4E8',
  'Leo': '#C9AE78',
  'Virgo': '#A9A9A9',
  'Libra': '#F4C2C2',
  'Scorpio': '#9D76C1',
  'Sagittarius': '#9370DB',
  'Capricorn': '#A9A9A9',
  'Aquarius': '#48D1CC',
  'Pisces': '#8BC4E8'
};

function calculateForces(chart: NatalChart | null) {
  if (!chart || !chart.placements) return [];
  
  const scores: Record<string, { label: string, val: number, color: string }> = {};
  
  const addScore = (key: string, points: number) => {
    if (!scores[key]) scores[key] = { label: key, val: 0, color: FORCE_COLORS_MAP[key] || theme.textGold };
    scores[key].val += points;
  };

  chart.placements.forEach(p => {
    const isLuminary = ['Sun', 'Moon'].includes(p.planet.name);
    const isPersonal = ['Mercury', 'Venus', 'Mars'].includes(p.planet.name);
    const points = isLuminary ? 30 : isPersonal ? 20 : 10;
    
    addScore(p.planet.name, points);
    if (p.sign && p.sign.name) {
      addScore(p.sign.name, points);
    }
  });

  if (chart.risingSign) {
    addScore(chart.risingSign.name, 30);
  }

  // Find top 6 forces
  const topForces = Object.values(scores)
    .sort((a, b) => b.val - a.val)
    .slice(0, 6)
    .map(f => ({
      label: f.label, // applyStoryLabels will run inside the radar chart on these technical names
      value: Math.min(100, (f.val / 60) * 100), // Normalize a bit so it maxes near 100
      color: f.color
    }));

  return topForces;
}

export default function StoryScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [chapters, setChapters] = useState<GeneratedChapter[]>([]);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  const loadStoryData = useCallback(async () => {
    try {
      setLoading(true);

      const charts = await localDb.getCharts();
      if (charts.length === 0) {
        setChapters([]);
        return;
      }

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

      const chart = AstrologyCalculator.generateNatalChart(birthData);
      const story = FullNatalStoryGenerator.generateFullStory(chart, isPremium);

      setChart(chart);
      setChapters(story.chapters);
    } catch (error) {
      logger.error('Failed to load story data:', error);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, [isPremium]);

  const handleExportPdf = useCallback(async () => {
    if (!isPremium) {
      router.push('/(tabs)/premium' as Href);
      return;
    }
    if (!chart || chapters.length === 0) return;
    if (isExporting) return;

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

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        if (!isActive) return;
        await loadStoryData();
      })();

      return () => {
        isActive = false;
      };
    }, [loadStoryData])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <SkiaDynamicCosmos />
        <ActivityIndicator size="large" color={theme.textGold} style={{ marginBottom: 16 }} />
        <Text style={styles.loadingText}>Mapping your architecture...</Text>
      </View>
    );
  }

  const unlockedCount = chapters.filter(c => !c.isPremium || isPremium).length;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Architecture</Text>
            <Text style={styles.headerSub}>
              Your personal blueprint — a structured framework of behavioral patterns, core drives, and growth vectors derived from your unique data.
            </Text>
            {chapters.length > 0 && (
              <View style={styles.statsBadge}>
                <Text style={styles.statsText}>
                  {unlockedCount} / {chapters.length} DIMENSIONS MAPPED
                </Text>
              </View>
            )}
            
          </Animated.View>

          {/* Radar Chart */}
          {chart && chapters.length > 0 && (
            <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.radarWrapper}>
              <Text style={styles.radarTitle}>Core Force Map</Text>
              <PsychologicalForcesRadar forces={calculateForces(chart)} size={320} />
            </Animated.View>
          )}

          {/* Chapters */}
          {chapters.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.emptyStateContainer}>
              <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.emptyCard}>
                <Ionicons name="book-outline" size={48} color={theme.textMuted} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>Your architecture awaits</Text>
                <Text style={styles.emptySubtitle}>
                  Enter your birth details to build a personalized blueprint of behavioral patterns, drives, and growth directions.
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/chart' as Href)}
                  style={styles.emptyButton}
                  accessibilityRole="button"
                  accessibilityLabel="Build your blueprint"
                >
                  <Text style={styles.emptyButtonText}>Build Your Blueprint</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          ) : (
            chapters.map((chapter, index) => {
              const isLocked = !isPremium && chapter.isPremium;

              return (
                <Animated.View
                  key={chapter.id}
                  entering={FadeInDown.delay(200 + index * 80).duration(500)}
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
                        setExpandedChapterId(prev => prev === chapter.id ? null : chapter.id);
                      }
                    }}
                  />
                  {!isLocked && expandedChapterId === chapter.id && (
                    <Animated.View entering={FadeInDown.duration(400)}>
                      <ChapterCard
                        chapter={`Chapter ${toRoman(index + 1)}`}
                        title={applyStoryLabels(chapter.title)}
                        content={applyStoryLabels(chapter.content)}
                        reflection={applyStoryLabels(chapter.reflection)}
                        affirmation={applyStoryLabels(chapter.affirmation)}
                      />
                    </Animated.View>
                  )}
                </Animated.View>
              );
            })
          )}

          {/* Unlock prompt */}
          {!isPremium && chapters.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200 + chapters.length * 80).duration(500)}>
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
                    <Ionicons name="sparkles" size={18} color={theme.textGold} />
                    <Text style={styles.upsellTitle}>
                      7 more dimensions to explore
                    </Text>
                  </View>

                  <Text style={styles.upsellText}>
                    Attachment Style · Conflict Resolution · Inner Child Patterns · Shadow Integration · Growth Vectors — and more.
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                    <Text style={styles.unlockText}>Expand your blueprint</Text>
                    <Ionicons name="arrow-forward" size={14} color={theme.textGold} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

        </ScrollView>

        {/* ── Floating Export FAB ── */}
        {chapters.length > 0 && (
          <Pressable
            onPress={handleExportPdf}
            disabled={isExporting}
            style={({ pressed }) => [styles.floatingExportBtn, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel="Export chart as PDF"
          >
            <LinearGradient
              colors={['rgba(212,184,114,0.18)', 'rgba(212,184,114,0.06)']}
              style={styles.floatingExportGradient}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={PALETTE.gold} />
              ) : (
                <>
                  <Ionicons name="share-outline" size={16} color={PALETTE.gold} />
                  <Text style={styles.floatingExportText}>Export as PDF</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  
  loadingText: {
    color: theme.textSecondary,
    fontStyle: 'italic',
    fontSize: 15,
  },
  
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: PALETTE.textMain,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statsBadge: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(212,184,114,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,184,114,0.2)',
  },
  statsText: {
    color: PALETTE.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },

  radarWrapper: {
    alignItems: 'center',
    marginBottom: 48,
  },
  radarTitle: {
    color: PALETTE.textMain,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },

  // ── Floating Export FAB ──
  floatingExportBtn: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,184,114,0.35)',
    shadowColor: '#D4B872',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingExportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
  },
  floatingExportText: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.gold,
  },

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
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  upsellText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  unlockText: {
    fontSize: 14,
    color: theme.textGold,
    fontWeight: '600',
  },

  emptyStateContainer: { marginTop: 32 },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
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
    color: theme.textGold,
    fontWeight: '700',
    fontSize: 15,
  },
});
