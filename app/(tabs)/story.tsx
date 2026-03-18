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
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import ChapterCard from '../../components/ui/ChapterCard';
import SkiaStoryGate, { CHAPTER_COLORS } from '../../components/ui/SkiaStoryGate';
import { PsychologicalForcesRadar } from '../../components/ui/PsychologicalForcesRadar';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { FullNatalStoryGenerator, GeneratedChapter } from '../../services/premium/fullNatalStory';
import { exportChartToPdf } from '../../services/premium/pdfExport';
import { NatalChart } from '../../services/astrology/types';
import { DailyCheckIn } from '../../services/patterns/types';
import { JournalEntry } from '../../services/storage/models';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';

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


// Fixed 6-color palette — one from each color family, maximally distinct
const FORCE_PALETTE = [
  '#E07A98', // rose
  '#CD7F5D', // copper
  '#FFEA70', // yellow
  '#6EBF8B', // green
  '#49DFFF', // cyan
  '#7B68EE', // violet
];

const ANGULAR_HOUSES  = new Set([1, 4, 7, 10]);
const SUCCEDENT_HOUSES = new Set([2, 5, 8, 11]);

// Check-in tags that resonate with each planet / sign archetype
const FORCE_BEHAVIORAL_TAGS: Record<string, string[]> = {
  'Sun':         ['joy', 'creativity', 'eq_hopeful', 'eq_open', 'confidence'],
  'Moon':        ['eq_heavy', 'eq_calm', 'eq_grounded', 'grief', 'loneliness', 'family'],
  'Mercury':     ['work', 'productivity', 'screens', 'creative', 'clarity'],
  'Venus':       ['relationships', 'intimacy', 'social', 'eq_open', 'confidence'],
  'Mars':        ['movement', 'productivity', 'conflict', 'anxiety', 'career'],
  'Jupiter':     ['travel', 'creative', 'eq_hopeful', 'gratitude', 'joy'],
  'Saturn':      ['work', 'routine', 'finances', 'boundaries', 'career'],
  'Uranus':      ['travel', 'overstimulated', 'creative', 'anxiety'],
  'Neptune':     ['alone_time', 'nature', 'rest', 'eq_calm', 'eq_scattered'],
  'Pluto':       ['grief', 'conflict', 'health', 'boundaries', 'anxiety'],
  'Chiron':      ['health', 'grief', 'boundaries', 'family', 'loneliness'],
  'Aries':       ['movement', 'conflict', 'eq_focused', 'career', 'productivity'],
  'Taurus':      ['food', 'nature', 'rest', 'finances', 'health'],
  'Gemini':      ['work', 'social', 'screens', 'creative', 'clarity'],
  'Cancer':      ['family', 'alone_time', 'eq_heavy', 'eq_calm', 'loneliness'],
  'Leo':         ['creativity', 'social', 'joy', 'eq_hopeful', 'confidence'],
  'Virgo':       ['work', 'health', 'routine', 'productivity', 'anxiety'],
  'Libra':       ['relationships', 'social', 'eq_open', 'conflict', 'confidence'],
  'Scorpio':     ['grief', 'intimacy', 'boundaries', 'conflict', 'anxiety'],
  'Sagittarius': ['travel', 'eq_hopeful', 'nature', 'creative', 'joy'],
  'Capricorn':   ['work', 'routine', 'finances', 'productivity', 'career'],
  'Aquarius':    ['creative', 'social', 'overstimulated', 'alone_time'],
  'Pisces':      ['alone_time', 'nature', 'rest', 'eq_calm', 'eq_scattered', 'grief'],
};

// Which forces get an additional signal from raw energy/mood levels
const ENERGY_BOOSTED  = new Set(['Sun', 'Mars', 'Aries', 'Leo', 'Jupiter', 'Sagittarius']);
const EMOTION_BOOSTED = new Set(['Moon', 'Neptune', 'Cancer', 'Pisces', 'Scorpio', 'Chiron']);

function calculateForces(
  chart: NatalChart | null,
  checkIns: DailyCheckIn[] = [],
  journals: JournalEntry[] = [],
) {
  if (!chart || !chart.placements) return [];

  // Count tight aspects per planet (orb ≤ 5° = meaningfully aspected)
  const aspectCounts: Record<string, number> = {};
  (chart.aspects ?? []).forEach(a => {
    if (a.orb <= 5) {
      aspectCounts[a.planet1.name] = (aspectCounts[a.planet1.name] ?? 0) + 1;
      aspectCounts[a.planet2.name] = (aspectCounts[a.planet2.name] ?? 0) + 1;
    }
  });

  // Score each planet:
  //   base (by type) + angular house bonus + aspect activity bonus
  const planetScores: Record<string, { label: string; val: number; sign: string }> = {};
  chart.placements.forEach(p => {
    const base = p.planet.type === 'Luminary'      ? 40
               : p.planet.type === 'Personal'      ? 25
               : p.planet.type === 'Social'        ? 15
               : 10; // Transpersonal / Asteroid / Point
    const houseBonus   = ANGULAR_HOUSES.has(p.house)   ? 20
                       : SUCCEDENT_HOUSES.has(p.house) ?  5
                       : 0;
    const aspectBonus  = Math.min((aspectCounts[p.planet.name] ?? 0) * 8, 24);
    planetScores[p.planet.name] = {
      label: p.planet.name,
      val:   base + houseBonus + aspectBonus,
      sign:  p.sign?.name ?? '',
    };
  });

  // Score each sign: sum base scores of every planet occupying it.
  // Rising sign adds 40 (equal weight to a luminary).
  const signScores: Record<string, { label: string; val: number }> = {};
  chart.placements.forEach(p => {
    const sign = p.sign?.name;
    if (!sign) return;
    const base = p.planet.type === 'Luminary'  ? 40
               : p.planet.type === 'Personal'  ? 25
               : p.planet.type === 'Social'    ? 15
               : 10;
    if (!signScores[sign]) signScores[sign] = { label: sign, val: 0 };
    signScores[sign].val += base;
  });
  if (chart.risingSign?.name) {
    const r = chart.risingSign.name;
    if (!signScores[r]) signScores[r] = { label: r, val: 0 };
    signScores[r].val += 40;
  }

  // Pick top planets first, then fill remaining slots with signs that aren't
  // already represented by a top planet (avoids e.g. "Sun" + "Leo" together).
  const topPlanets = Object.values(planetScores)
    .sort((a, b) => b.val - a.val)
    .slice(0, 4);
  const occupiedSigns = new Set(topPlanets.map(p => p.sign));
  const topSigns = Object.values(signScores)
    .filter(s => !occupiedSigns.has(s.label))
    .sort((a, b) => b.val - a.val)
    .slice(0, 4);

  const combined = [...topPlanets, ...topSigns]
    .sort((a, b) => b.val - a.val)
    .slice(0, 6);

  const maxVal = combined[0]?.val ?? 100;

  // ── Behavioral augmentation ──────────────────────────────────────────────
  // How many check-ins and what mix of energy/mood levels
  const totalCI = checkIns.length;
  const energyNum = (e: DailyCheckIn['energyLevel']) =>
    e === 'high' ? 100 : e === 'medium' ? 50 : 0;
  const avgEnergy = totalCI > 0
    ? checkIns.reduce((s, c) => s + energyNum(c.energyLevel), 0) / totalCI
    : 50;
  const avgMood = totalCI > 0
    ? checkIns.reduce((s, c) => s + (c.moodScore - 1) * (100 / 9), 0) / totalCI
    : 50;

  // Journal mood signal: proportion of entries that are 'heavy' or 'stormy'
  const totalJ = journals.length;
  const emotionalJournalRate = totalJ > 0
    ? journals.filter(j => j.mood === 'heavy' || j.mood === 'stormy').length / totalJ
    : 0.5;

  // Weight natal vs behavioral based on data volume
  const natalWeight = totalCI < 5 ? 0.85 : 0.60;
  const behavWeight = 1 - natalWeight;

  return combined.map((f, i) => {
    const natalValue = Math.min(100, Math.round((f.val / maxVal) * 100));

    let behavioralScore = 50; // neutral baseline
    if (totalCI > 0) {
      const relatedTags = new Set(FORCE_BEHAVIORAL_TAGS[f.label] ?? []);
      const tagMatches = checkIns.filter(c =>
        c.tags.some(t => relatedTags.has(t as string))
      ).length;
      const tagScore = Math.min(100, Math.round((tagMatches / totalCI) * 150));

      // Extra signal from energy or emotional data
      const bonus = ENERGY_BOOSTED.has(f.label)
        ? (avgEnergy * 0.3 + avgMood * 0.1)
        : EMOTION_BOOSTED.has(f.label)
          ? emotionalJournalRate * 40
          : 0;

      behavioralScore = Math.min(100, Math.round(tagScore * 0.7 + bonus));
    }

    return {
      label: f.label,
      value: Math.min(100, Math.max(10,
        Math.round(natalValue * natalWeight + behavioralScore * behavWeight)
      )),
      color: FORCE_PALETTE[i],
    };
  });
}

export default function StoryScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [chapters, setChapters] = useState<GeneratedChapter[]>([]);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
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

      const [recentCheckIns, recentJournals] = await Promise.all([
        localDb.getCheckIns(savedChart.id, 200),
        localDb.getJournalEntries(),
      ]);

      setChart(natalChart);
      setChapters(story.chapters);
      setCheckIns(recentCheckIns);
      setJournals(recentJournals);
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
          <MetallicIcon name="arrow-back" size={20} variant="gold" />
          <MetallicText style={styles.backText} variant="gold">Blueprint</MetallicText>
        </Pressable>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Life Narrative</Text>
            <GoldSubtitle style={styles.headerSub}>
              Your personal blueprint — a structured framework of behavioral patterns, core drives, and growth vectors derived from your unique data.
            </GoldSubtitle>
            {chapters.length > 0 && (
              <View style={styles.statsBadge}>
                <MetallicText style={styles.statsText} variant="gold">
                  {unlockedCount} / {chapters.length} CHAPTERS MAPPED
                </MetallicText>
              </View>
            )}
          </Animated.View>

          {/* Radar Chart */}
          {chart && chapters.length > 0 && (
            <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.radarWrapper}>
              <View style={styles.radarHeaderRow}>
                <MetallicIcon name="analytics-outline" size={18} variant="gold" />
                <MetallicText style={styles.radarTitle} variant="gold">Core Force Map</MetallicText>
              </View>
              <PsychologicalForcesRadar forces={calculateForces(chart, checkIns, journals)} size={320} />
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
                  <MetallicText style={styles.emptyButtonText} variant="gold">Build Your Blueprint</MetallicText>
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
                    title={chapter.title}
                    astrologyLabel={chapter.astrologyLabel || undefined}
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
                        chapter={chapter.astrologyLabel || `Chapter ${toRoman(index + 1)}`}
                        title={chapter.title}
                        content={chapter.content}
                        reflection={chapter.reflection}
                        affirmation={chapter.affirmation}
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
                    <MetallicIcon name="sparkles" size={18} variant="gold" />
                    <Text style={styles.upsellTitle}>7 more dimensions to explore</Text>
                  </View>
                  <Text style={styles.upsellText}>
                    Attachment Style · Conflict Resolution · Inner Child Patterns · Shadow Integration · Growth Vectors — and more.
                  </Text>
                  <View style={styles.unlockRow}>
                    <MetallicText style={styles.unlockText} variant="gold">Expand your blueprint</MetallicText>
                    <MetallicIcon name="arrow-forward" size={14} variant="gold" />
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
                    <MetallicIcon name="share-outline" size={18} variant="gold" />
                    <MetallicText style={styles.floatingExportText} variant="gold">Export Blueprint to PDF</MetallicText>
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
  title: { fontSize: 34, fontWeight: '300', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 8 },
  headerSub: { fontSize: 14 },

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
