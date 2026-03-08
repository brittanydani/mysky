import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { Ionicons } from '@expo/vector-icons';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import InsightCard from '../../components/ui/InsightCard';
import ShadowQuoteCard from '../../components/ui/ShadowQuoteCard';
import { HealingInsightsGenerator, HealingInsights } from '../../services/premium/healingInsights';
import { ShadowQuoteEngine, ShadowQuote } from '../../services/astrology/shadowQuotes';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { localDb } from '../../services/storage/localDb';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';

// ── Cinematic Palette ──
const PALETTE = {
  gold: theme.textGold,
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
  glassHighlight: theme.glass.highlight,
};

// ── Shared sub-components ──

function DetailRow({ label, text, color = PALETTE.gold }: { label: string; text: string; color?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color }]}>{label}</Text>
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

function ToolList({ label, items, color = PALETTE.gold }: { label: string; items: string[]; color?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color }]}>{label}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.toolItem}>
          <View style={[styles.toolDot, { backgroundColor: color }]} />
          <Text style={styles.toolText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function DeepCard({
  icon,
  title,
  color = PALETTE.gold,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={[theme.cardGradientStart, theme.cardGradientEnd]}
      style={styles.deepCard}
    >
      <View style={styles.deepCardHeader}>
        <View style={[styles.deepCardIcon, { backgroundColor: 'transparent' }]}>
          <Ionicons name={icon} size={18} color={color} />
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
    if (healingData) return; // Prevent unnecessary recalculation
    try {
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        // 1. Check Cache (assuming localDb has getCache/setCache, otherwise this is structural)
        // const cachedInsights = await localDb.getCache('healing_insights');
        // if (cachedInsights) {
        //   setHealingData(cachedInsights);
        //   setLoading(false);
        //   return;
        // }

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
        // await localDb.setCache('healing_insights', insights);

        // We can keep the quote generation here or move it.
        const result = await ShadowQuoteEngine.getDailyShadowQuote(chart);
        if (result.quote.tone === 'protective' || result.quote.tone === 'release') {
          setHealingQuote(result.quote);
        } else if (result.closeQuote) {
          setHealingQuote(result.closeQuote);
        }
      }
    } catch (e) {
      logger.error('[Healing] Production Load Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const goToPremium = () => {
    router.push('/(tabs)/premium' as Href);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Growth Insights</Text>
            <Text style={styles.headerSub}>
              Explore emotional patterns, inner needs, and pathways to growth — grounded in your personal blueprint.
            </Text>
          </Animated.View>

          {/* Shadow quote — right below the header */}
          {healingQuote && (
            <Animated.View entering={FadeInDown.delay(150).duration(800)} style={styles.shadowSection}>
              <ShadowQuoteCard quote={healingQuote} variant="footer" animationDelay={0} />
            </Animated.View>
          )}

          {/* Empty state */}
          {!loading && !healingData && !healingQuote && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.emptyStateContainer}>
              <LinearGradient colors={[theme.cardGradientStart, theme.cardGradientEnd]} style={styles.emptyCard}>
                <Ionicons name="heart-outline" size={48} color={theme.textMuted} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>No chart yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create your chart to unlock personalized growth insights.
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/chart' as Href)}
                  style={styles.emptyButton}
                  accessibilityRole="button"
                  accessibilityLabel="Create chart"
                >
                  <Text style={styles.emptyButtonText}>Create Chart</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Inner Child / Reparenting ── */}
          {healingData && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
              {isPremium ? (
                <DeepCard icon="heart" title="Inner Child" color={PALETTE.rose}>
                  <Text style={styles.deepCardMain}>{healingData.reparenting.innerChildNeeds}</Text>
                  <View style={styles.deepDivider} />
                  <DetailRow label="WHAT WAS MISSING" text={healingData.reparenting.whatWasMissing} color={PALETTE.rose} />
                  <DetailRow label="HOW TO PROVIDE IT NOW" text={healingData.reparenting.howToProvideItNow} color={PALETTE.rose} />
                  <DetailRow label="DAILY PRACTICE" text={healingData.reparenting.dailyPractice} color={PALETTE.rose} />
                  <View style={[styles.affirmationBox, { borderLeftColor: PALETTE.rose }]}>
                    <Text style={[styles.affirmationText, { color: PALETTE.rose }]}>"{healingData.reparenting.affirmation}"</Text>
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
                <DeepCard icon="shield" title="Core Fear" color={PALETTE.copper}>
                  <Text style={styles.deepCardMain}>{healingData.fears.coreFear}</Text>
                  <View style={styles.deepDivider} />
                  <DetailRow label="HOW IT SHOWS UP" text={healingData.fears.howItShows} color={PALETTE.copper} />
                  <DetailRow label="WHAT IT PROTECTS" text={healingData.fears.whatItProtects} color={PALETTE.copper} />
                  <DetailRow label="GENTLE REFRAME" text={healingData.fears.gentleReframe} color={PALETTE.copper} />
                  <View style={[styles.promptBox, { borderLeftColor: PALETTE.copper }]}>
                    <Text style={[styles.promptBoxLabel, { color: PALETTE.copper }]}>REFLECTION PROMPT</Text>
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
                  color={PALETTE.gold}
                >
                  <Text style={styles.deepCardMain}>{healingData.attachment.headline}</Text>
                  <View style={styles.deepDivider} />
                  <DetailRow label="DESCRIPTION" text={healingData.attachment.description} color={PALETTE.gold} />
                  <DetailRow label="WHERE IT CAME FROM" text={healingData.attachment.origins} color={PALETTE.gold} />
                  <DetailRow label="IN RELATIONSHIPS" text={healingData.attachment.inRelationships} color={PALETTE.gold} />
                  <DetailRow label="GROWTH PATH" text={healingData.attachment.healingPath} color={PALETTE.gold} />
                  <View style={[styles.affirmationBox, { borderLeftColor: PALETTE.gold }]}>
                    <Text style={[styles.affirmationText, { color: PALETTE.gold }]}>"{healingData.attachment.affirmation}"</Text>
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
              <Text style={styles.sectionTitle}>Safety & Emotional Patterns</Text>
              {isPremium ? (
                <DeepCard icon="moon" title="Emotional Regulation" color={PALETTE.silverBlue}>
                  <Text style={styles.deepCardMain}>{healingData.safety.whatFeelsSafe}</Text>
                  <View style={styles.deepDivider} />
                  <DetailRow label="WHAT FEELS UNSAFE" text={healingData.safety.whatFeelsUnsafe} color={PALETTE.silverBlue} />
                  <DetailRow label="EMOTIONAL TENDENCY" text={healingData.safety.nervousSystemTendency} color={PALETTE.silverBlue} />
                  <ToolList label="SELF-SOOTHING TOOLS" items={healingData.safety.selfSoothingTools} color={PALETTE.silverBlue} />
                  <DetailRow label="BOUNDARY NEEDS" text={healingData.safety.boundaryNeeds} color={PALETTE.silverBlue} />
                </DeepCard>
              ) : (
                <InsightCard
                  title="Safety & Regulation"
                  content="Your inner landscape has a specific definition of safety — your chart reveals what it is."
                  icon="moon"
                  locked
                  lockedHint="Discover what you need to feel safe →"
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
                  colors={['rgba(139, 196, 232, 0.15)', 'rgba(2,8,23,0.50)']}
                  style={styles.weeklyCard}
                >
                  <Ionicons name="telescope-outline" size={24} color={PALETTE.silverBlue} style={{ marginBottom: 12 }} />
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
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  
  header: { marginTop: 16, marginBottom: 8 },
  title: {
    fontSize: 34,
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  headerSub: { fontSize: 14, color: theme.textGold, lineHeight: 22, fontStyle: 'italic' },
  
  section: { marginTop: 8, marginBottom: 16 },
  shadowSection: { marginTop: -18, marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 12,
    letterSpacing: 0.3,
    paddingLeft: 4,
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
  emptyTitle: { fontSize: 24, color: theme.textPrimary, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), marginBottom: 12 },
  emptySubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emptyButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.25)',
  },
  emptyButtonText: { color: theme.textGold, fontWeight: '700', fontSize: 15 },

  // ── Deep Card (Cinematic Glass) ──
  deepCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
  },
  deepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  deepCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deepCardTitle: {
    fontSize: 20,
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  deepCardMain: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  deepDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'transparent',
    marginVertical: 16,
  },
  
  detailRow: { marginBottom: 16 },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  detailText: { fontSize: 15, color: theme.textPrimary, lineHeight: 22, fontWeight: '500' },
  
  toolItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6, gap: 10 },
  toolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  toolText: { flex: 1, fontSize: 15, color: theme.textPrimary, lineHeight: 22, fontWeight: '500' },
  
  affirmationBox: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 3,
  },
  affirmationText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  
  promptBox: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 3,
  },
  promptBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  promptBoxText: {
    fontSize: 15,
    color: theme.textPrimary,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // ── Weekly Reflection ──
  weeklyCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
    marginBottom: 8,
  },
  weeklyText: {
    fontSize: 17,
    color: theme.textPrimary,
    lineHeight: 26,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
});

