import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { Ionicons } from '@expo/vector-icons';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import InsightCard from '../../components/ui/InsightCard';
import { HealingInsightsGenerator, HealingInsights } from '../../services/premium/healingInsights';
import { ShadowQuoteEngine, ShadowQuote } from '../../services/astrology/shadowQuotes';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { localDb } from '../../services/storage/localDb';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4B872',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
  sage: '#8CBEAA',
  bg: '#0A0A0C', // Unified OLED Black
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.06)',
  sageBorder: 'rgba(140, 190, 170, 0.2)',
  sageGlass: 'rgba(140, 190, 170, 0.08)',
};

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
      logger.error('[Healing] Load Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const goToPremium = () => router.push('/(tabs)/premium' as Href);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <SkiaDynamicCosmos />
        <ActivityIndicator size="large" color={PALETTE.sage} style={{ marginBottom: 16 }} />
        <Text style={styles.loadingText}>Mapping your healing paths...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hub Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Healing Pathways</Text>
            <Text style={styles.headerSub}>
              Inner needs and emotional patterns, mapped by your blueprint.
            </Text>
          </Animated.View>

          {/* ── Daily Shadow Insight ── */}
          {healingQuote && (
            <Animated.View entering={FadeInDown.delay(150).duration(800)} style={styles.quoteContainer}>
              <Text style={styles.quoteMark}>“</Text>
              <Text style={styles.quoteText}>{healingQuote.text}</Text>
              <Text style={styles.quoteSub}>DAILY SHADOW PROMPT</Text>
            </Animated.View>
          )}

          {/* ── Empty State ── */}
          {!loading && !healingData && (
            <View style={styles.emptyStateContainer}>
              <LinearGradient colors={['rgba(212, 184, 114, 0.1)', 'rgba(10, 10, 12, 0.8)']} style={styles.emptyCard}>
                <Ionicons name="heart-outline" size={48} color={PALETTE.gold} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>Blueprint Required</Text>
                <Text style={styles.emptySubtitle}>We need your natal data to map your healing pathways.</Text>
                <Pressable onPress={() => router.push('/(tabs)/blueprint' as Href)} style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Calibrate Now</Text>
                </Pressable>
              </LinearGradient>
            </View>
          )}

          {/* ── Inner Child / Reparenting Hub ── */}
          {healingData && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
              {isPremium ? (
                <DeepCard icon="heart" title="Inner Child Architecture" color={PALETTE.sage}>
                  <Text style={styles.deepCardMain}>{healingData.reparenting.innerChildNeeds}</Text>
                  <View style={styles.deepDivider} />
                  <DetailRow label="NURTURE GAP" text={healingData.reparenting.whatWasMissing} color={PALETTE.sage} />
                  <DetailRow label="REPARENTING PATH" text={healingData.reparenting.howToProvideItNow} color={PALETTE.sage} />
                  <View style={[styles.affirmationBox, { borderLeftColor: PALETTE.sage }]}>
                    <Text style={[styles.affirmationText, { color: PALETTE.sage }]}>"{healingData.reparenting.affirmation}"</Text>
                  </View>
                </DeepCard>
              ) : (
                <InsightCard title="Inner Child Needs" content={healingData.reparenting.innerChildNeeds} icon="heart" variant="featured" />
              )}
            </Animated.View>
          )}

          {/* ── Fear & Protection Patterns ── */}
          {healingData && (
            <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Shadow Protection</Text>
              {isPremium ? (
                <DeepCard icon="shield-outline" title="Core Defense Pattern" color={PALETTE.sage}>
                  <Text style={styles.deepCardMain}>{healingData.fears.coreFear}</Text>
                  <View style={styles.deepDivider} />
                  <DetailRow label="MECHANISM" text={healingData.fears.howItShows} color={PALETTE.sage} />
                  <DetailRow label="GENTLE REFRAME" text={healingData.fears.gentleReframe} color={PALETTE.sage} />
                </DeepCard>
              ) : (
                <InsightCard title="Defense Patterns" content="Your blueprint reveals how you protect yourself when unsafe." icon="shield" locked lockedHint="Unlock Shadow Insights" onPress={goToPremium} />
              )}
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Shared Sub-Components ──

function DetailRow({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color }]}>{label}</Text>
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

function DeepCard({ icon, title, color, children }: { icon: any, title: string, color: string, children: React.ReactNode }) {
  return (
    <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(10, 10, 12, 0.8)']} style={styles.deepCard}>
      <View style={styles.deepCardHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.deepCardTitle}>{title}</Text>
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', fontSize: 15 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { marginTop: 16, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  headerSub: { fontSize: 14, color: PALETTE.sage, fontStyle: 'italic', marginTop: 4 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 18, color: '#FFFFFF', fontFamily: 'serif', marginBottom: 12 },

  // ── Bespoke shadow quote block ──
  quoteContainer: { alignItems: 'center', marginBottom: 48, marginTop: 8, paddingHorizontal: 16 },
  quoteMark: {
    fontSize: 72,
    color: 'rgba(140, 190, 170, 0.25)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    height: 52,
    lineHeight: 80,
    overflow: 'hidden',
  },
  quoteText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 20,
  },
  quoteSub: { fontSize: 10, color: PALETTE.sage, fontWeight: '800', letterSpacing: 2 },
  emptyStateContainer: { marginTop: 32 },
  emptyCard: { borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: PALETTE.glassBorder },
  emptyTitle: { fontSize: 24, color: '#FFFFFF', fontFamily: 'serif', marginBottom: 12 },
  emptySubtitle: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 24 },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.gold },
  emptyButtonText: { color: PALETTE.gold, fontWeight: '700' },
  deepCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: PALETTE.sageBorder },
  deepCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  deepCardTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '700' },
  deepCardMain: { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 24 },
  deepDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 },
  detailRow: { marginBottom: 16 },
  detailLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  detailText: { fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
  affirmationBox: { marginTop: 8, padding: 16, borderLeftWidth: 2 },
  affirmationText: { fontSize: 15, fontStyle: 'italic', lineHeight: 24 },
});

