import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import InsightCard from '../../components/ui/InsightCard';
import ShadowQuoteCard from '../../components/ui/ShadowQuoteCard';
import { HealingInsightsGenerator, HealingInsights } from '../../services/premium/healingInsights';
import { ShadowQuoteEngine, ShadowQuote } from '../../services/astrology/shadowQuotes';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { localDb } from '../../services/storage/localDb';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';

export default function HealingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();
  const [healingQuote, setHealingQuote] = useState<ShadowQuote | null>(null);
  const [healingData, setHealingData] = useState<HealingInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadHealingData();
    }, [])
  );

  const loadHealingData = async () => {
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
          timezone: savedChart.timezone,
          houseSystem: savedChart.houseSystem,
        };
        const chart = AstrologyCalculator.generateNatalChart(birthData);

        // Generate chart-derived healing insights
        const insights = HealingInsightsGenerator.generateHealingInsights(chart);
        setHealingData(insights);

        // Load shadow quote for healing screen
        const result = await ShadowQuoteEngine.getDailyShadowQuote(chart);
        // Prefer protective/release tones on the healing screen
        if (result.quote.tone === 'protective' || result.quote.tone === 'release') {
          setHealingQuote(result.quote);
        } else if (result.closeQuote) {
          // closeQuote is always release tone — perfect for healing
          setHealingQuote(result.closeQuote);
        }
      }
    } catch (e) {
      logger.error('[Healing] Failed to load healing data:', e);
    } finally {
      setLoading(false);
    }
  };

  const goToPremium = () => {
    router.push('/(tabs)/premium' as Href);
  };

  return (
    <View style={styles.container}>
      <StarField starCount={25} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.header}
          >
            <Text style={styles.title}>Healing Insights</Text>
            <Text style={styles.headerSub}>
              Explore emotional patterns, inner needs, and pathways to growth — grounded in your chart's psychological blueprint.
            </Text>
          </Animated.View>

          {/* Empty state — no chart yet */}
          {!loading && !healingData && !healingQuote && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No chart yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your natal chart to unlock personalized healing insights.
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/chart' as Href)}
                style={styles.emptyButton}
                accessibilityRole="button"
                accessibilityLabel="Create chart"
              >
                <Text style={styles.emptyButtonText}>Create Chart</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Shadow quote — soft Chiron/release truth */}
          {healingQuote && (
            <Animated.View entering={FadeInDown.delay(150).duration(800)} style={styles.shadowSection}>
              <ShadowQuoteCard
                quote={healingQuote}
                variant="footer"
                animationDelay={0}
              />
            </Animated.View>
          )}

          {/* Inner Child Needs - Featured (free) */}
          {healingData && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <InsightCard
                title="Inner Child Needs"
                content={healingData.reparenting.innerChildNeeds}
                icon="heart"
                variant="featured"
              />
            </Animated.View>
          )}

          {/* Deeper Healing — premium-gated */}
          {healingData && (
            <Animated.View
              entering={FadeInDown.delay(300).duration(600)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>Deeper Healing</Text>

              <InsightCard
                title="Fear Patterns"
                content={isPremium
                  ? healingData.fears.coreFear
                  : `Your chart suggests a core pattern around ${healingData.fears.coreFear.split(' ').slice(0, 6).join(' ')}...`
                }
                icon="shield"
                locked={!isPremium}
                lockedHint="See what drives your deepest fears →"
                onPress={!isPremium ? goToPremium : undefined}
              />

              <InsightCard
                title="Attachment Themes"
                content={isPremium
                  ? healingData.attachment.headline
                  : `Your attachment style leans ${healingData.attachment.style} — there's a reason for that.`
                }
                icon="link"
                locked={!isPremium}
                lockedHint="Understand how you learned to love →"
                onPress={!isPremium ? goToPremium : undefined}
              />

              <InsightCard
                title="Safety & Regulation"
                content={isPremium
                  ? healingData.safety.whatFeelsSafe
                  : `Your nervous system has a specific definition of safety — your chart reveals what it is.`
                }
                icon="moon"
                locked={!isPremium}
                lockedHint="Discover what your body needs to feel safe →"
                onPress={!isPremium ? goToPremium : undefined}
              />
            </Animated.View>
          )}

          {/* Daily healing prompt — premium (with teaser for free) */}
          {healingData && isPremium && (
            <Animated.View
              entering={FadeInDown.delay(400).duration(600)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>Today's Healing Prompt</Text>
              <InsightCard
                title="Journal Prompt"
                content={healingData.dailyJournalPrompt}
                icon="book"
              />
            </Animated.View>
          )}

          {healingData && !isPremium && (
            <Animated.View
              entering={FadeInDown.delay(400).duration(600)}
              style={styles.section}
            >
              <Text style={styles.sectionTitle}>Today's Healing Prompt</Text>
              <InsightCard
                title="Journal Prompt"
                content="A personalized prompt based on your Moon and Chiron — designed to help you process what's coming up today."
                icon="book"
                locked
                lockedHint="Unlock daily prompts tailored to your chart →"
                onPress={goToPremium}
              />
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
  header: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 19,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  shadowSection: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
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
