// File: app/(tabs)/home.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import BirthDataModal from '../../components/BirthDataModal';
import { localDb } from '../../services/storage/localDb';
import { NatalChart, BirthData } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { ChartDisplayManager } from '../../services/astrology/chartDisplayManager';
import { config } from '../../constants/config';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';
import { usePremium } from '../../context/PremiumContext';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
  textMain: '#FDFBF7',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

/** Rotating daily previews of what premium unlocks — personalized to chart */
const PREMIUM_PREVIEWS = [
  {
    icon: 'heart-half' as const,
    color: PALETTE.rose,
    label: 'Healing',
    title: 'Your attachment style is shaped by your emotional blueprint',
    sub: 'Understand your fear patterns, what safety looks like for you, and how to start healing.',
    cta: 'Explore your healing map',
    route: '/(tabs)/healing',
  },
  {
    icon: 'analytics' as const,
    color: PALETTE.emerald,
    label: 'Patterns',
    title: 'Your mood data is ready to reveal patterns',
    sub: 'See trends over time, discover which days you feel best, and correlate with daily influences.',
    cta: 'See your patterns',
    route: '/(tabs)/growth', // Pointing to the Reflect tab (growth.tsx)
  },
  {
    icon: 'people' as const,
    color: PALETTE.silverBlue,
    label: 'Relationships',
    title: 'Deeper Sky includes unlimited relationship profiles',
    sub: 'Partner, parent, child, friend — understand how you truly connect with the people who matter.',
    cta: 'Compare profiles',
    route: '/(tabs)/relationships',
  },
  {
    icon: 'compass' as const,
    color: PALETTE.copper,
    label: 'Chiron & Nodes',
    title: 'Your chart holds a sensitivity map only you can see',
    sub: "Chiron reveals your tender spots. Your Nodes show where you've been and where you're growing.",
    cta: 'Explore sensitive points',
    route: '/(tabs)/chart',
  },
];

function getDailyPreviewIndex(): number {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return dayOfYear % PREMIUM_PREVIEWS.length;
}

export default function HomeScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();

  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [showEditBirth, setShowEditBirth] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUserChart = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);

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
        chart.id = savedChart.id;
        chart.name = savedChart.name;
        chart.createdAt = savedChart.createdAt;
        chart.updatedAt = savedChart.updatedAt;

        setUserChart(chart);
      } else {
        setUserChart(null);
        router.replace('/onboarding' as Href);
      }
    } catch (error) {
      logger.error('Failed to load user chart:', error);
      setUserChart(null);
      router.replace('/onboarding' as Href);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          await loadUserChart();
        } catch (e) {
          logger.error('Home focus load failed:', e);
        }
      })();
    }, [loadUserChart])
  );

  const handleEditBirthData = async (birthData: BirthData, extra?: { chartName?: string }) => {
    setShowEditBirth(false);
    try {
      const chart = AstrologyCalculator.generateNatalChart(birthData);

      const charts = await localDb.getCharts();
      const existingId = charts.length > 0 ? charts[0].id : chart.id;

      const savedChart = {
        id: existingId,
        name: extra?.chartName ?? chart.name,
        birthDate: chart.birthData.date,
        birthTime: chart.birthData.time,
        hasUnknownTime: chart.birthData.hasUnknownTime,
        birthPlace: chart.birthData.place,
        latitude: chart.birthData.latitude,
        longitude: chart.birthData.longitude,
        timezone: chart.birthData.timezone,
        houseSystem: chart.birthData.houseSystem,
        createdAt: charts.length > 0 ? charts[0].createdAt : chart.createdAt,
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      };

      await localDb.saveChart(savedChart);

      chart.id = existingId;
      chart.name = savedChart.name;
      chart.createdAt = savedChart.createdAt;
      chart.updatedAt = savedChart.updatedAt;
      setUserChart(chart);
    } catch (error) {
      logger.error('Failed to update chart:', error);
    }
  };

  const displayChart = userChart ? ChartDisplayManager.formatChartWithTimeWarnings(userChart) : null;

  const allPlacements = userChart
    ? [
        { label: 'Sun', placement: userChart.sun },
        { label: 'Moon', placement: userChart.moon },
        { label: 'Mercury', placement: userChart.mercury },
        { label: 'Venus', placement: userChart.venus },
        { label: 'Mars', placement: userChart.mars },
        { label: 'Jupiter', placement: userChart.jupiter },
        { label: 'Saturn', placement: userChart.saturn },
        { label: 'Uranus', placement: userChart.uranus },
        { label: 'Neptune', placement: userChart.neptune },
        { label: 'Pluto', placement: userChart.pluto },
      ]
    : [];

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={40} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (!userChart) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={40} />
        <Text style={styles.loadingText}>Preparing onboarding…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StarField starCount={60} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.title}>{config.appName}</Text>
                <Text style={styles.tagline}>
                  {userChart ? `Your story in the stars.` : config.tagline}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Warnings ── */}
          {displayChart?.warnings.length ? (
            <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.warningBox}>
              <Ionicons name="alert-circle" size={20} color={PALETTE.copper} />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Birth time unknown</Text>
                <Text style={styles.warningText}>{displayChart.warnings[0]}</Text>
              </View>
            </Animated.View>
          ) : null}

          {/* ── Hero Chart Summary (Glassmorphic) ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.chartSummary}>
            <LinearGradient
              colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']}
              style={styles.chartCard}
            >
              <View style={styles.chartHeader}>
                <View>
                  <Text style={styles.chartTitle}>{userChart.name || 'Your Personal Map'}</Text>
                  <Text style={styles.chartDate}>Born {parseLocalDate(userChart.birthData.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.heroSunNode}>
                  <LinearGradient colors={['#FFF4D4', '#D4AF37', '#7A5C13']} style={styles.heroSunGradient} />
                  <Text style={styles.heroSunSymbol}>☉</Text>
                </View>
              </View>

              <View style={styles.bigThree}>
                <View style={styles.signItem}>
                  <Text style={styles.signLabel}>Sun</Text>
                  <Text style={styles.signValue}>{userChart.sun.sign.symbol} {userChart.sun.sign.name}</Text>
                </View>

                <View style={styles.signItem}>
                  <Text style={styles.signLabel}>Moon</Text>
                  <Text style={styles.signValue}>{userChart.moon.sign.symbol} {userChart.moon.sign.name}</Text>
                </View>

                {userChart.ascendant && (
                  <View style={styles.signItem}>
                    <Text style={styles.signLabel}>Rising</Text>
                    <Text style={styles.signValue}>{userChart.ascendant.sign.symbol} {userChart.ascendant.sign.name}</Text>
                  </View>
                )}
              </View>

              <View style={styles.chartActions}>
                <Pressable style={styles.viewChartButton} onPress={() => router.push('/(tabs)/chart' as Href)}>
                  <Text style={styles.viewChartText}>See Full Chart</Text>
                  <Ionicons name="arrow-forward" size={14} color={PALETTE.gold} />
                </Pressable>

                <Pressable style={styles.editBirthButton} onPress={() => setShowEditBirth(true)}>
                  <Ionicons name="create-outline" size={14} color={theme.textMuted} />
                  <Text style={styles.editBirthText}>Edit Birth Data</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Planet Strip ── */}
          {allPlacements.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Your Planets</Text>
              <FlatList
                horizontal
                data={allPlacements}
                keyExtractor={(item) => item.label}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.planetStrip}
                renderItem={({ item, index }) => (
                  <Animated.View entering={FadeInRight.delay(index * 60).duration(400)}>
                    <LinearGradient
                      colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']}
                      style={styles.planetChip}
                    >
                      <Text style={styles.planetSymbol}>{item.placement.planet.symbol}</Text>
                      <Text style={styles.planetName}>{item.label}</Text>
                      <Text style={styles.planetSign}>{item.placement.sign.symbol} {item.placement.sign.name}</Text>
                      <Text style={styles.planetDegree}>{item.placement.degree}°</Text>
                    </LinearGradient>
                  </Animated.View>
                )}
              />
            </Animated.View>
          )}

          {/* ── Premium Teaser ── */}
          {!isPremium && (() => {
            const preview = PREMIUM_PREVIEWS[getDailyPreviewIndex()];
            return (
              <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.sectionBlock}>
                <Pressable onPress={() => router.push(preview.route as Href)}>
                  <LinearGradient
                    colors={[`${preview.color}15`, 'rgba(20, 24, 34, 0.8)']}
                    style={styles.premiumPreviewCard}
                  >
                    <View style={styles.premiumPreviewHeader}>
                      <View style={[styles.premiumPreviewIcon, { backgroundColor: `${preview.color}20` }]}>
                        <Ionicons name={preview.icon} size={18} color={preview.color} />
                      </View>
                      <Text style={styles.premiumPreviewLabel}>{preview.label}</Text>
                      <View style={styles.premiumPreviewBadge}>
                        <Ionicons name="sparkles" size={10} color={PALETTE.gold} />
                        <Text style={styles.premiumPreviewBadgeText}>Deeper Sky</Text>
                      </View>
                    </View>
                    <Text style={styles.premiumPreviewTitle}>{preview.title}</Text>
                    <Text style={styles.premiumPreviewSub}>{preview.sub}</Text>
                    <View style={styles.premiumPreviewCta}>
                      <Text style={[styles.premiumPreviewCtaText, { color: preview.color }]}>{preview.cta}</Text>
                      <Ionicons name="arrow-forward" size={14} color={preview.color} />
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })()}

          {/* ── Quick Links ── */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Explore</Text>
            <View style={styles.quickLinksRow}>
              
              <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/story' as Href)}>
                <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.quickLinkGradient}>
                  <View style={[styles.quickLinkIconWrap, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
                     <Ionicons name="book-outline" size={22} color={PALETTE.gold} />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.quickLinkTitle}>Story</Text>
                    <Text style={styles.quickLinkSub}>Your narrative</Text>
                  </View>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/journal' as Href)}>
                <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.quickLinkGradient}>
                   <View style={[styles.quickLinkIconWrap, { backgroundColor: 'rgba(212, 163, 179, 0.15)' }]}>
                     <Ionicons name="pencil-outline" size={22} color={PALETTE.rose} />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.quickLinkTitle}>Journal</Text>
                    <Text style={styles.quickLinkSub}>Record entries</Text>
                  </View>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/growth' as Href)}>
                <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.quickLinkGradient}>
                   <View style={[styles.quickLinkIconWrap, { backgroundColor: 'rgba(110, 191, 139, 0.15)' }]}>
                     <Ionicons name="leaf-outline" size={22} color={PALETTE.emerald} />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.quickLinkTitle}>Reflect</Text>
                    <Text style={styles.quickLinkSub}>Track patterns</Text>
                  </View>
                </LinearGradient>
              </Pressable>

            </View>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>

      <BirthDataModal
        visible={showEditBirth}
        onClose={() => setShowEditBirth(false)}
        onSave={handleEditBirthData}
        initialData={{
          date: userChart.birthData.date,
          time: userChart.birthData.time,
          hasUnknownTime: userChart.birthData.hasUnknownTime,
          place: userChart.birthData.place,
          latitude: userChart.birthData.latitude,
          longitude: userChart.birthData.longitude,
          houseSystem: userChart.birthData.houseSystem,
          chartName: userChart.name,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07090F' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.textSecondary, fontStyle: 'italic', marginTop: 16 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  header: { marginTop: 16, marginBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 34, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), letterSpacing: 0.5 },
  tagline: { color: theme.textSecondary, fontSize: 15, fontStyle: 'italic', marginTop: 6, letterSpacing: 0.3 },

  chartSummary: { marginBottom: 32 },
  chartCard: { 
    borderRadius: 20, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: PALETTE.glassBorder, 
    borderTopColor: PALETTE.glassHighlight 
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  chartTitle: { fontSize: 22, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 4 },
  chartDate: { color: theme.textSecondary, fontSize: 13 },
  
  heroSunNode: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  heroSunGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    opacity: 0.8,
  },
  heroSunSymbol: { color: '#4A3500', fontSize: 18, fontWeight: '600' },

  bigThree: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  signItem: { alignItems: 'flex-start', flex: 1 },
  signLabel: { color: theme.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  signValue: { color: PALETTE.textMain, fontWeight: '600', fontSize: 15, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  
  chartActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)' },
  viewChartButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewChartText: { color: PALETTE.gold, fontSize: 14, fontWeight: '600' },
  editBirthButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBirthText: { color: theme.textMuted, fontSize: 12, fontWeight: '500' },

  sectionBlock: { marginBottom: 32 },
  sectionTitle: { color: PALETTE.textMain, fontSize: 20, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 16, paddingLeft: 4 },

  planetStrip: { paddingRight: 20, gap: 10 },
  planetChip: {
    minWidth: 100,
    height: 110,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  planetSymbol: { fontSize: 24, color: PALETTE.gold, marginBottom: 6 },
  planetName: { color: theme.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  planetSign: { color: PALETTE.textMain, fontWeight: '600', fontSize: 12, marginTop: 4, textAlign: 'center' },
  planetDegree: { color: theme.textSecondary, fontSize: 11, marginTop: 2 },

  quickLinksRow: { flexDirection: 'row', gap: 10 },
  quickLink: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  quickLinkGradient: { padding: 12, alignItems: 'flex-start', height: 110, borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16 },
  quickLinkIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  quickLinkTitle: { color: PALETTE.textMain, fontWeight: '600', fontSize: 14, marginBottom: 2 },
  quickLinkSub: { color: theme.textMuted, fontSize: 11 },

  premiumPreviewCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
  },
  premiumPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  premiumPreviewIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  premiumPreviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    flex: 1,
  },
  premiumPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumPreviewBadgeText: { fontSize: 10, fontWeight: '700', color: PALETTE.gold },
  premiumPreviewTitle: { fontSize: 20, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), lineHeight: 28, marginBottom: 8 },
  premiumPreviewSub: { fontSize: 14, color: theme.textSecondary, lineHeight: 22, marginBottom: 16 },
  premiumPreviewCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  premiumPreviewCtaText: { fontSize: 14, fontWeight: '600' },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(205, 127, 93, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(205, 127, 93, 0.2)',
  },
  warningContent: { flex: 1, marginLeft: 12 },
  warningTitle: { color: PALETTE.copper, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  warningText: { color: theme.textSecondary, fontSize: 14, lineHeight: 20 },
});

