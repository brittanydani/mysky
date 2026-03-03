import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

// ── Shared sub-components ──

function DetailRow({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

function ToolList({ label, items }: { label: string; items: string[] }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.toolItem}>
          <View style={styles.toolDot} />
          <Text style={styles.toolText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function DeepCard({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={['rgba(30,45,71,0.85)', 'rgba(26,39,64,0.65)']}
      style={styles.deepCard}
    >
      <View style={styles.deepCardHeader}>
        <View style={styles.deepCardIcon}>
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>
        <Text style={styles.deepCardTitle}>{title}</Text>
      </View>
      {children}
    </LinearGradient>
  );
}

export default function HealingScreen() {
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

        const insights = HealingInsightsGenerator.generateHealingInsights(chart);
        setHealingData(insights);

        const result = await ShadowQuoteEngine.getDailyShadowQuote(chart);
        if (result.quote.tone === 'protective' || result.quote.tone === 'release') {
          setHealingQuote(result.quote);
        } else if (result.closeQuote) {
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Healing Insights</Text>
            <Text style={styles.headerSub}>
              Explore emotional patterns, inner needs, and pathways to growth — grounded in your psychological blueprint.
            </Text>
          </Animated.View>

          {/* Empty state */}
          {!loading && !healingData && !healingQuote && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No chart yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your chart to unlock personalized healing insights.
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

          {/* Shadow quote */}
          {healingQuote && (
            <Animated.View entering={FadeInDown.delay(150).duration(800)} style={styles.shadowSection}>
              <ShadowQuoteCard quote={healingQuote} variant="footer" animationDelay={0} />
            </Animated.View>
          )}

          {/* ── Inner Child / Reparenting ── */}
          {healingData && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              {isPremium ? (
                <DeepCard icon="heart" title="Inner Child">
                  <Text style={styles.deepCardMain}>{healingData.reparenting.innerChildNeeds}</Text>
                  <View style={styles.deepDivider} />
                  <DetailRow label="WHAT WAS MISSING" text={healingData.reparenting.whatWasMissing} />
                  <DetailRow label="HOW TO PROVIDE IT NOW" text={healingData.reparenting.howToProvideItNow} />
                  <DetailRow label="DAILY PRACTICE" text={healingData.reparenting.dailyPractice} />
                  <View style={styles.affirmationBox}>
                    <Text style={styles.affirmationText}>"{healingData.reparenting.affirmation}"</Text>
                  </View>
                </DeepCard>
              ) : (
                <InsightCard
                  title="Inner Child Needs"
                  content={healingData.reparenting.innerChildNeeds}
                  icon="heart"
                  variant="featured"
                />
              )}
            </Animated.View>
          )}

          {/* ── Fear Patterns ── */}
          {healingData && (
            <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Fear Patterns</Text>
              {isPremium ? (
                <DeepCard icon="shield" title="Core Fear">
                  <Text style={styles.deepCardMain}>{healingData.fears.coreFear}</Text>
                  <View style={styles.deepDivider} />
                  <DetailRow label="HOW IT SHOWS UP" text={healingData.fears.howItShows} />
                  <DetailRow label="WHAT IT PROTECTS" text={healingData.fears.whatItProtects} />
                  <DetailRow label="GENTLE REFRAME" text={healingData.fears.gentleReframe} />
                  <View style={styles.promptBox}>
                    <Text style={styles.promptBoxLabel}>REFLECTION PROMPT</Text>
                    <Text style={styles.promptBoxText}>{healingData.fears.journalPrompt}</Text>
                  </View>
                </DeepCard>
              ) : (
                <InsightCard
                  title="Fear Patterns"
                  content={`Your chart suggests a core pattern around ${healingData.fears.coreFear.split(' ').slice(0, 6).join(' ')}...`}
                  icon="shield"
                  locked
                  lockedHint="See what drives your deepest fears →"
                  onPress={goToPremium}
                />
              )}
            </Animated.View>
          )}

          {/* ── Attachment ── */}
          {healingData && (
            <Animated.View entering={FadeInDown.delay(340).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Attachment</Text>
              {isPremium ? (
                <DeepCard
                  icon="link"
                  title={`${healingData.attachment.style.charAt(0).toUpperCase() + healingData.attachment.style.slice(1)} Style`}
                >
                  <Text style={styles.deepCardMain}>{healingData.attachment.headline}</Text>
                  <View style={styles.deepDivider} />
                  <DetailRow label="DESCRIPTION" text={healingData.attachment.description} />
                  <DetailRow label="WHERE IT CAME FROM" text={healingData.attachment.origins} />
                  <DetailRow label="IN RELATIONSHIPS" text={healingData.attachment.inRelationships} />
                  <DetailRow label="HEALING PATH" text={healingData.attachment.healingPath} />
                  <View style={styles.affirmationBox}>
                    <Text style={styles.affirmationText}>"{healingData.attachment.affirmation}"</Text>
                  </View>
                </DeepCard>
              ) : (
                <InsightCard
                  title="Attachment Themes"
                  content={`Your attachment style leans ${healingData.attachment.style} — there's a reason for that.`}
                  icon="link"
                  locked
                  lockedHint="Understand how you learned to love →"
                  onPress={goToPremium}
                />
              )}
            </Animated.View>
          )}

          {/* ── Safety & Nervous System ── */}
          {healingData && (
            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Safety & Nervous System</Text>
              {isPremium ? (
                <DeepCard icon="moon" title="Regulation">
                  <Text style={styles.deepCardMain}>{healingData.safety.whatFeelsSafe}</Text>
                  <View style={styles.deepDivider} />
                  <DetailRow label="WHAT FEELS UNSAFE" text={healingData.safety.whatFeelsUnsafe} />
                  <DetailRow label="NERVOUS SYSTEM TENDENCY" text={healingData.safety.nervousSystemTendency} />
                  <ToolList label="SELF-SOOTHING TOOLS" items={healingData.safety.selfSoothingTools} />
                  <DetailRow label="BOUNDARY NEEDS" text={healingData.safety.boundaryNeeds} />
                </DeepCard>
              ) : (
                <InsightCard
                  title="Safety & Regulation"
                  content="Your nervous system has a specific definition of safety — your chart reveals what it is."
                  icon="moon"
                  locked
                  lockedHint="Discover what your body needs to feel safe →"
                  onPress={goToPremium}
                />
              )}
            </Animated.View>
          )}

          {/* ── Weekly Reflection ── */}
          {healingData && (
            <Animated.View entering={FadeInDown.delay(460).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>This Week's Reflection</Text>
              {isPremium ? (
                <LinearGradient
                  colors={['rgba(122,139,224,0.12)', 'rgba(122,139,224,0.04)']}
                  style={styles.weeklyCard}
                >
                  <Ionicons name="telescope-outline" size={20} color="#7A8BE0" style={{ marginBottom: 10 }} />
                  <Text style={styles.weeklyText}>{healingData.weeklyReflection}</Text>
                </LinearGradient>
              ) : (
                <InsightCard
                  title="Weekly Reflection"
                  content="A rotating weekly theme drawn from your chart — to sit with over the coming days."
                  icon="telescope-outline"
                  locked
                  lockedHint="Unlock weekly reflection themes →"
                  onPress={goToPremium}
                />
              )}
            </Animated.View>
          )}

          {/* ── Daily Journal Prompt ── */}
          {healingData && (
            <Animated.View entering={FadeInDown.delay(520).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Healing Prompt</Text>
              {isPremium ? (
                <InsightCard
                  title="Journal Prompt"
                  content={healingData.dailyJournalPrompt}
                  icon="book"
                />
              ) : (
                <InsightCard
                  title="Journal Prompt"
                  content="A personalized prompt based on your Moon and Chiron — designed to help you process what's coming up today."
                  icon="book"
                  locked
                  lockedHint="Unlock daily prompts tailored to your chart →"
                  onPress={goToPremium}
                />
              )}
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg },
  header: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  headerSub: { fontSize: 13, color: theme.textMuted, lineHeight: 19 },
  section: { marginTop: theme.spacing.lg },
  shadowSection: { marginBottom: theme.spacing.md },
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
  emptyTitle: { fontSize: 20, fontWeight: '600', color: theme.textPrimary, marginTop: 8 },
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
  emptyButtonText: { color: theme.background, fontWeight: '600', fontSize: 15 },

  // ── Deep Card ──
  deepCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  deepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  deepCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201,169,98,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  deepCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  deepCardMain: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  deepDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: theme.spacing.md,
  },
  detailRow: { marginBottom: theme.spacing.md },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  detailText: { fontSize: 14, color: theme.textSecondary, lineHeight: 21 },
  toolItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  toolDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.primary,
    marginTop: 7,
    marginRight: 8,
  },
  toolText: { flex: 1, fontSize: 14, color: theme.textSecondary, lineHeight: 21 },
  affirmationBox: {
    backgroundColor: 'rgba(201,169,98,0.08)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(201,169,98,0.3)',
  },
  affirmationText: {
    fontSize: 14,
    color: theme.primary,
    fontStyle: 'italic',
    lineHeight: 21,
    fontFamily: 'serif',
  },
  promptBox: {
    backgroundColor: 'rgba(139,196,232,0.08)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(139,196,232,0.25)',
  },
  promptBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8BC4E8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  promptBoxText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 21,
    fontStyle: 'italic',
  },

  // ── Weekly Reflection ──
  weeklyCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(122,139,224,0.15)',
    marginBottom: theme.spacing.md,
  },
  weeklyText: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 23,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'serif',
  },
});
