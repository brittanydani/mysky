import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import { applyStoryLabels } from '../../constants/storyLabels';
import StarField from '../../components/ui/StarField';
import ChapterCard from '../../components/ui/ChapterCard';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { FullNatalStoryGenerator, GeneratedChapter } from '../../services/premium/fullNatalStory';
import { exportChartToPdf } from '../../services/premium/pdfExport';
import { NatalChart } from '../../services/astrology/types';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';

export default function StoryScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();
  const [chapters, setChapters] = useState<GeneratedChapter[]>([]);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StarField starCount={30} />
        <Text style={styles.loadingText}>Loading your themes...</Text>
      </View>
    );
  }

  const unlockedCount = chapters.filter(c => !c.isPremium || isPremium).length;

  return (
    <View style={styles.container}>
      <StarField starCount={30} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.header}
          >
            <Text style={styles.title}>Your Themes</Text>
            <Text style={styles.headerSub}>
              A structured reflection shaped by your personal framework — designed for awareness and journaling, not prediction.
            </Text>
            {chapters.length > 0 && (
              <Text style={styles.subtitle}>
                {chapters.length} chapters — {unlockedCount} unlocked
              </Text>
            )}
            {chapters.length > 0 && (
              <Pressable
                onPress={handleExportPdf}
                disabled={isExporting}
                style={styles.exportButton}
                accessibilityRole="button"
                accessibilityLabel="Export chart as PDF"
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color={theme.background} />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={14} color={theme.background} />
                    <Text style={styles.exportButtonText}>Export PDF</Text>
                  </>
                )}
              </Pressable>
            )}
          </Animated.View>

          {/* Chapters */}
          {chapters.length === 0 ? (
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              style={styles.emptyState}
            >
              <Ionicons name="book-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>Your story awaits</Text>
              <Text style={styles.emptySubtitle}>
                Enter your birth details to unlock a personalized reflection framework designed for growth and awareness.
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/chart' as Href)}
                style={styles.emptyButton}
                accessibilityRole="button"
                accessibilityLabel="Create your framework"
              >
                <Text style={styles.emptyButtonText}>Create Your Framework</Text>
              </Pressable>
            </Animated.View>
          ) : (
            chapters.map((chapter, index) => {
              const isLocked = !isPremium && chapter.isPremium;

              return (
                <Animated.View
                  key={chapter.id}
                  entering={FadeInDown.delay(200 + index * 80).duration(500)}
                >
                  <ChapterCard
                    chapter={`Chapter ${index + 1}`}
                    title={applyStoryLabels(chapter.title)}
                    content={applyStoryLabels(chapter.content)}
                    preview={isLocked ? applyStoryLabels(chapter.reflection) : undefined}
                    reflection={!isLocked ? applyStoryLabels(chapter.reflection) : undefined}
                    affirmation={!isLocked ? applyStoryLabels(chapter.affirmation) : undefined}
                    isLocked={isLocked}
                    onPress={() => {
                      if (isLocked) router.push('/(tabs)/premium' as Href);
                    }}
                  />
                </Animated.View>
              );
            })
          )}

          {/* Unlock prompt */}
          {!isPremium && chapters.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(200 + chapters.length * 80).duration(500)}
              style={styles.unlockPrompt}
            >
              <Pressable
                onPress={() => router.push('/(tabs)/premium' as Href)}
                accessibilityRole="button"
                accessibilityLabel="Unlock all chapters"
              >
                <LinearGradient
                  colors={['rgba(201,169,98,0.12)', 'rgba(201,169,98,0.04)']}
                  style={styles.unlockButton}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="sparkles" size={16} color={theme.primary} />
                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif' }}>
                      7 more chapters await
                    </Text>
                  </View>

                  <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19, marginBottom: 10 }}>
                    How You Love · How You Navigate Conflict · Your Inner Child · Your Shadow Work · Your Growth Direction — and more.
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.unlockText}>Continue your story</Text>
                    <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    color: theme.textSecondary,
    fontStyle: 'italic',
    fontSize: 15,
  },
  headerSub: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  unlockPrompt: {
    marginTop: theme.spacing.md,
  },
  unlockButton: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.2)',
  },
  unlockText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.md,
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.background,
  },
  emptyButton: {
    marginTop: 12,
    backgroundColor: theme.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.full,
  },
  emptyButtonText: {
    color: theme.background,
    fontWeight: '600',
    fontSize: 15,
  },
});
