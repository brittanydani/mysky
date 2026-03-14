import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

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

// ── Roman numeral helper ──
function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

// ── Cinematic Palette (Harmonized) ──
const PALETTE = {
  gold: '#C9AE78', // Matched to Blueprint Hub
  silverBlue: '#C9AE78',
  bg: '#0A0A0C',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

const FORCE_COLORS_MAP: Record<string, string> = {
  'Sun': '#D9BF8C',
  'Moon': '#8BC4E8',
  'Mars': '#CD7F5D',
  'Venus': '#D4A3B3',
  'Saturn': '#A89BC8',
  'Jupiter': '#9370DB',
  'Mercury': '#FFEA70',
  'Pluto': '#9D76C1',
  'Neptune': '#48D1CC',
  'Uranus': '#FF8C00',
  'Aries': '#CD7F5D',
  'Taurus': '#6EBF8B',
  'Gemini': '#FFEA70',
  'Cancer': '#8BC4E8',
  'Leo': '#D9BF8C',
  'Virgo': '#A89BC8',
  'Libra': '#D4A3B3',
  'Scorpio': '#9D76C1',
  'Sagittarius': '#9370DB',
  'Capricorn': '#A89BC8',
  'Aquarius': '#48D1CC',
  'Pisces': '#8BC4E8'
};

function calculateForces(chart: NatalChart | null) {
  if (!chart || !chart.placements) return [];
  
  const scores: Record<string, { label: string, val: number, color: string }> = {};
  
  const addScore = (key: string, points: number) => {
    if (!scores[key]) scores[key] = { label: key, val: 0, color: FORCE_COLORS_MAP[key] || PALETTE.gold };
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

  return Object.values(scores)
    .sort((a, b) => b.val - a.val)
    .slice(0, 6)
    .map(f => ({
      label: f.label,
      value: Math.min(100, (f.val / 60) * 100),
      color: f.color
    }));
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

      const natalChart = AstrologyCalculator.generateNatalChart(birthData);
      const story = FullNatalStoryGenerator.generateFullStory(natalChart, isPremium);

      setChart(natalChart);
      setChapters(story.chapters);
    } catch (error) {
      logger.error('[StoryScreen] Failed to load story data:', error);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, [isPremium]);

  const handleExportPdf = useCallback(async () => {
    if (!isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/(tabs)/premium' as Href);
      return;
    }
    if (!chart || chapters.length === 0 || isExporting) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);

    try {
      await exportChartToPdf(chart, chapters);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      logger.error('[StoryScreen] PDF export failed:', err);
      Alert.alert('Export failed', 'Something went wrong generating the PDF. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        <ActivityIndicator size="large" color={PALETTE.gold} style={{ marginBottom: 16 }} />
        <Text style={styles.loadingText}>Mapping your architecture...</Text>
      </View>
    );
  }

  const unlockedCount = chapters.filter(c => !c.isPremium || isPremium).length;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={PALETTE.gold} />
          <Text style={styles.backText}>Blueprint</Text>
        </Pressable>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Life Narrative</Text>
            <Text style={styles.headerSub}>
              Your personal blueprint — a structured framework of behavioral patterns, core drives, and growth vectors derived from your unique data.
            </Text>
            {chapters.length > 0 && (
              <View style={styles.statsBadge}>
                <Text style={styles.statsText}>
                  {unlockedCount} / {chapters.length} CHAPTERS MAPPED
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Radar Chart */}
          {chart && chapters.length > 0 && (
            <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.radarWrapper}>
              <View style={styles.radarHeaderRow}>
                <Ionicons name="analytics-outline" size={18} color={PALETTE.silverBlue} />
                <Text style={styles.radarTitle}>Core Force Map</Text>
              </View>
              <PsychologicalForcesRadar forces={calculateForces(chart)} size={320} />
            </Animated.View>
          )}

          {/* Chapters */}
          {chapters.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.emptyStateContainer}>
              <LinearGradient colors={['rgba(217, 191, 140, 0.1)', 'rgba(10, 10, 15, 0.6)']} style={styles.emptyCard}>
                <Ionicons name="book-outline" size={48} color={PALETTE.textMuted} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>Your story awaits</Text>
                <Text style={styles.emptySubtitle}>
                  Enter your birth details to generate a highly personalized psychological narrative based on your cosmic placements.
                </Text>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/chart' as Href); }}
                  style={styles.emptyButton}
                >
                  <Text style={styles.emptyButtonText}>Build Your Blueprint</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          ) : (
            chapters.map((chapter, index) => {
              const isLocked = !isPremium && chapter.isPremium;
              const isExpanded = !isLocked && expandedChapterId === chapter.id;

              return (
                <Animated.View
                  key={chapter.id}
                  entering={FadeInDown.delay(200 + index * 80).duration(500)}
                  layout={Layout.springify().damping(16).stiffness(120)}
                >
                  <SkiaStoryGate
                    index={index}
                    title={applyStoryLabels(chapter.title)}
                    isUnlocked={!isLocked}
                    isPremium={isPremium}
                    accentColor={CHAPTER_COLORS[index] || PALETTE.gold}
                    onPress={() => {
                      if (isLocked) {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        router.push('/(tabs)/premium' as Href);
                      } else {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setExpandedChapterId(isExpanded ? null : chapter.id);
                      }
                    }}
                  />
                  {isExpanded && (
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

          {/* Upsell Prompt */}
          {!isPremium && chapters.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/premium' as Href); }}>
                <LinearGradient colors={['rgba(217, 191, 140, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.upsellGradient}>
                  <View style={styles.upsellHeader}>
                    <Ionicons name="sparkles" size={18} color={PALETTE.gold} />
                    <Text style={styles.upsellTitle}>7 more dimensions to explore</Text>
                  </View>
                  <Text style={styles.upsellText}>
                    Attachment Style · Conflict Resolution · Inner Child Patterns · Shadow Integration · Growth Vectors — and more.
                  </Text>
                  <View style={styles.unlockRow}>
                    <Text style={styles.unlockText}>Expand your blueprint</Text>
                    <Ionicons name="arrow-forward" size={14} color={PALETTE.gold} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

        </ScrollView>

        {/* Floating Export FAB */}
        {chapters.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.fabContainer}>
            <Pressable
              onPress={handleExportPdf}
              disabled={isExporting}
              style={({ pressed }) => [styles.floatingExportBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
            >
              <LinearGradient
                colors={['rgba(217, 191, 140, 0.2)', 'rgba(217, 191, 140, 0.08)']}
                style={styles.floatingExportGradient}
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={PALETTE.gold} />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={18} color={PALETTE.gold} />
                    <Text style={styles.floatingExportText}>Export Blueprint to PDF</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
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

  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: PALETTE.gold, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },

  loadingText: { color: PALETTE.textMuted, fontStyle: 'italic', fontSize: 14, marginTop: 12 },

  header: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  title: { fontSize: 34, fontWeight: '300', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), textAlign: 'center', marginBottom: 8 },
  headerSub: { fontSize: 14, color: PALETTE.textMuted, textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },

  statsBadge: { marginTop: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(217,191,140,0.1)', borderWidth: 1, borderColor: 'rgba(217,191,140,0.2)' },
  statsText: { color: PALETTE.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  radarWrapper: { alignItems: 'center', marginBottom: 48 },
  radarHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 20 },
  radarTitle: { color: PALETTE.silverBlue, fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  emptyStateContainer: { marginTop: 12 },
  emptyCard: { borderRadius: 24, padding: 32, borderWidth: 1, borderColor: PALETTE.glassBorder, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 24, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 12, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: PALETTE.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyButton: { backgroundColor: 'transparent', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(217,191,140,0.4)' },
  emptyButtonText: { color: PALETTE.gold, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },

  upsellGradient: { padding: 24, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(217, 191, 140, 0.2)', marginTop: 16 },
  upsellHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  upsellTitle: { fontSize: 18, fontWeight: '600', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  upsellText: { fontSize: 14, color: PALETTE.textMuted, lineHeight: 22 },
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  unlockText: { fontSize: 13, color: PALETTE.gold, fontWeight: '700', letterSpacing: 0.5 },

  fabContainer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  floatingExportBtn: { borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(217, 191, 140, 0.4)', shadowColor: '#D9BF8C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  floatingExportGradient: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 28, paddingVertical: 16 },
  floatingExportText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5, color: PALETTE.gold },
});
