import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import ChapterCard from '../../components/ui/ChapterCard';
import { localDb } from '../../services/storage/localDb';
import { NatalChart } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { FullNatalStoryGenerator, GeneratedChapter } from '../../services/premium/fullNatalStory';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';

export default function StoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();
  const [chapters, setChapters] = useState<GeneratedChapter[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadStoryData();
    }, [isPremium])
  );

  const loadStoryData = async () => {
    try {
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const savedChart = charts[0];
        const birthData = {
          date: savedChart.birthDate,
          time: savedChart.birthTime,
          hasUnknownTime: savedChart.hasUnknownTime,
          place: savedChart.birthPlace,
          latitude: savedChart.latitude,
          longitude: savedChart.longitude,
          houseSystem: savedChart.houseSystem,
        };
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        const story = FullNatalStoryGenerator.generateFullStory(chart, isPremium);
        setChapters(story.chapters);
      }
    } catch (error) {
      logger.error('Failed to load story data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StarField starCount={30} />
        <Text style={styles.loadingText}>Loading your story...</Text>
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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.header}
          >
            <Text style={styles.title}>Your Cosmic Story</Text>
            {chapters.length > 0 && (
              <Text style={styles.subtitle}>
                {chapters.length} chapters — {unlockedCount} unlocked
              </Text>
            )}
          </Animated.View>

          {/* Chapters */}
          {chapters.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>Your story awaits</Text>
              <Text style={styles.emptySubtitle}>
                Create your natal chart to reveal your personalized cosmic narrative.
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/chart' as Href)}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>Create Chart</Text>
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
                  title={chapter.title}
                  content={chapter.content}
                  preview={isLocked ? chapter.reflection : undefined}
                  reflection={!isLocked ? chapter.reflection : undefined}
                  affirmation={!isLocked ? chapter.affirmation : undefined}
                  isLocked={isLocked}
                  onPress={() => {
                    if (isLocked) router.push('/(tabs)/premium' as Href);
                  }}
                />
              </Animated.View>
            );
          })
          )}

          {/* Unlock prompt for free users */}
          {!isPremium && (
            <Animated.View
              entering={FadeInDown.delay(200 + chapters.length * 80).duration(500)}
              style={styles.unlockPrompt}
            >
              <Pressable
                onPress={() => router.push('/(tabs)/premium' as Href)}
                style={styles.unlockButton}
              >
                <Ionicons name="sparkles" size={16} color={theme.primary} />
                <Text style={styles.unlockText}>Unlock all chapters with Deeper Sky</Text>
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
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  unlockText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
    marginLeft: theme.spacing.sm,
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
