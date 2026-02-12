import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, FlatList, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import OnboardingModal from '../../components/OnboardingModal';
import BirthDataModal from '../../components/BirthDataModal';
import { localDb } from '../../services/storage/localDb';
import { NatalChart, BirthData } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { ChartDisplayManager } from '../../services/astrology/chartDisplayManager';
import { DailyInsightEngine, DailyInsight as DailyInsightData } from '../../services/astrology/dailyInsightEngine';
import { HumanGuidanceGenerator } from '../../services/astrology/humanGuidance';
import { InsightHistoryService } from '../../services/storage/insightHistory';
import { config } from '../../constants/config';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();

  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEditBirth, setShowEditBirth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dailyInsight, setDailyInsight] = useState<DailyInsightData | null>(null);

  const loadUserChart = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;

    if (!silent) setLoading(true);

    try {
      // ✅ With the updated localDb.ts (ensureReady), this is always safe
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
        chart.id = savedChart.id;
        chart.name = savedChart.name;
        chart.createdAt = savedChart.createdAt;
        chart.updatedAt = savedChart.updatedAt;

        setUserChart(chart);

        // Generate real transit-based daily insight
        try {
          const insight = DailyInsightEngine.generateDailyInsight(chart, new Date());
          setDailyInsight(insight);

          // Save to insight history for premium memory/recall
          if (isPremium && savedChart.id) {
            try {
              const guidance = HumanGuidanceGenerator.generateDailyGuidance(chart);
              await InsightHistoryService.saveInsight(guidance, savedChart.id, insight.signals);
            } catch (historyErr) {
              logger.error('Failed to save insight to history:', historyErr);
            }
          }
        } catch (e) {
          logger.error('Failed to generate daily insight:', e);
        }

        setShowOnboarding(false);
      } else {
        setUserChart(null);
        setDailyInsight(null);
        setShowOnboarding(true);
      }
    } catch (error) {
      logger.error('Failed to load user chart:', error);
      setUserChart(null);
      setDailyInsight(null);
      setShowOnboarding(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isPremium]);

  // ✅ Reload chart every time this screen is focused (await + cancel-safe)
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

  const handleOnboardingComplete = (chart: NatalChart) => {
    setUserChart(chart);
    setShowOnboarding(false);

    // Generate daily insight for newly created chart
    try {
      const insight = DailyInsightEngine.generateDailyInsight(chart, new Date());
      setDailyInsight(insight);

      // Save to insight history for premium memory/recall
      if (isPremium && chart.id) {
        const guidance = HumanGuidanceGenerator.generateDailyGuidance(chart);
        InsightHistoryService.saveInsight(guidance, chart.id, insight.signals).catch(e =>
          logger.error('Failed to save initial insight to history:', e)
        );
      }
    } catch (e) {
      logger.error('Failed to generate daily insight:', e);
    }
  };

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

      try {
        const insight = DailyInsightEngine.generateDailyInsight(chart, new Date());
        setDailyInsight(insight);
      } catch (e) {
        logger.error('Failed to regenerate daily insight:', e);
      }
    } catch (error) {
      logger.error('Failed to update chart:', error);
    }
  };

  const displayChart = userChart
    ? ChartDisplayManager.formatChartWithTimeWarnings(userChart)
    : null;

  const allPlacements = userChart ? [
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
  ] : [];

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={40} />
        <Text style={styles.loadingText}>Loading your cosmic story...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StarField starCount={40} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.title}>{config.appName}</Text>
                <Text style={styles.tagline}>
                  {userChart
                    ? `${userChart.sun.sign.name} ${userChart.sun.sign.symbol}`
                    : config.tagline}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Warning */}
          {displayChart?.warnings.length ? (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={18} color={theme.warning} />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Birth time unknown</Text>
                <Text style={styles.warningText}>{displayChart.warnings[0]}</Text>
              </View>
            </View>
          ) : null}

          {/* Chart Summary — Big Three */}
          {userChart && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.chartSummary}>
              <LinearGradient
                colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                style={styles.chartCard}
              >
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Your Cosmic Blueprint</Text>
                  <Text style={styles.chartDate}>
                    Born {parseLocalDate(userChart.birthData.date).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.bigThree}>
                  <View style={styles.signItem}>
                    <Text style={styles.signLabel}>Sun</Text>
                    <Text style={styles.signValue}>
                      {userChart.sun.sign.symbol} {userChart.sun.sign.name}
                    </Text>
                    <Text style={styles.signElement}>{userChart.sun.sign.element}</Text>
                  </View>

                  <View style={styles.signItem}>
                    <Text style={styles.signLabel}>Moon</Text>
                    <Text style={styles.signValue}>
                      {userChart.moon.sign.symbol} {userChart.moon.sign.name}
                    </Text>
                    <Text style={styles.signElement}>{userChart.moon.sign.element}</Text>
                  </View>

                  {userChart.ascendant && (
                    <View style={styles.signItem}>
                      <Text style={styles.signLabel}>Rising</Text>
                      <Text style={styles.signValue}>
                        {userChart.ascendant.sign.symbol} {userChart.ascendant.sign.name}
                      </Text>
                      <Text style={styles.signElement}>{userChart.ascendant.sign.element}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.chartActions}>
                  <Pressable
                    style={styles.viewChartButton}
                    onPress={() => router.push('/(tabs)/chart' as Href)}
                  >
                    <Text style={styles.viewChartText}>View Full Chart</Text>
                    <Ionicons name="arrow-forward" size={16} color={theme.primary} />
                  </Pressable>

                  <Pressable
                    style={styles.editBirthButton}
                    onPress={() => setShowEditBirth(true)}
                  >
                    <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                    <Text style={styles.editBirthText}>Edit Birth Data</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Create Chart CTA */}
          {!userChart && !loading && (
            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.chartSummary}>
              <LinearGradient
                colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                style={styles.chartCard}
              >
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Discover Your Cosmic Blueprint</Text>
                  <Text style={styles.chartDate}>Enter your birth details to get started</Text>
                </View>

                <Pressable style={styles.createChartButton} onPress={() => setShowOnboarding(true)}>
                  <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                  <Text style={styles.createChartText}>Create Your Chart</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Planetary Placements Strip */}
          {userChart && allPlacements.length > 0 && (
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
                      colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.7)']}
                      style={styles.planetChip}
                    >
                      <Text style={styles.planetSymbol}>{item.placement.planet.symbol}</Text>
                      <Text style={styles.planetName}>{item.label}</Text>
                      <Text style={styles.planetSign}>
                        {item.placement.sign.symbol} {item.placement.sign.name}
                      </Text>
                      <Text style={styles.planetDegree}>
                        {item.placement.degree}° {item.placement.sign.name.substring(0, 3)}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                )}
              />
            </Animated.View>
          )}

          {/* Quick Links */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Explore</Text>
            <View style={styles.quickLinksRow}>
              <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/story' as Href)}>
                <LinearGradient colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.7)']} style={styles.quickLinkGradient}>
                  <Ionicons name="book-outline" size={24} color={theme.primary} />
                  <Text style={styles.quickLinkTitle}>Story</Text>
                  <Text style={styles.quickLinkSub}>Your narrative</Text>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/journal' as Href)}>
                <LinearGradient colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.7)']} style={styles.quickLinkGradient}>
                  <Ionicons name="pencil-outline" size={24} color={theme.love} />
                  <Text style={styles.quickLinkTitle}>Journal</Text>
                  <Text style={styles.quickLinkSub}>Reflect & grow</Text>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.quickLink} onPress={() => router.push('/(tabs)/healing' as Href)}>
                <LinearGradient colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.7)']} style={styles.quickLinkGradient}>
                  <Ionicons name="heart-outline" size={24} color={theme.energy} />
                  <Text style={styles.quickLinkTitle}>Healing</Text>
                  <Text style={styles.quickLinkSub}>Inner work</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <OnboardingModal visible={showOnboarding} onComplete={handleOnboardingComplete} />

      <BirthDataModal
        visible={showEditBirth}
        onClose={() => setShowEditBirth(false)}
        onSave={handleEditBirthData}
        initialData={
          userChart
            ? {
                date: userChart.birthData.date,
                time: userChart.birthData.time,
                hasUnknownTime: userChart.birthData.hasUnknownTime,
                place: userChart.birthData.place,
                latitude: userChart.birthData.latitude,
                longitude: userChart.birthData.longitude,
                houseSystem: userChart.birthData.houseSystem,
                chartName: userChart.name,
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.textSecondary, fontStyle: 'italic' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg },
  header: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 32, fontWeight: '700', color: theme.textPrimary },
  tagline: { color: theme.primary, fontStyle: 'italic', marginTop: 6 },

  chartSummary: { marginBottom: theme.spacing.lg },
  chartCard: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg },
  chartHeader: { marginBottom: theme.spacing.lg },
  chartTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary },
  chartDate: { color: theme.textSecondary },
  bigThree: { flexDirection: 'row', justifyContent: 'space-between' },
  signItem: { alignItems: 'center', flex: 1 },
  signLabel: { color: theme.textMuted },
  signValue: { color: theme.textPrimary, fontWeight: '600' },
  signElement: { color: theme.primary, fontStyle: 'italic' },
  chartActions: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
  viewChartButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  viewChartText: { color: theme.primary, marginRight: 6 },
  editBirthButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  editBirthText: { color: theme.textSecondary, fontSize: 13, marginLeft: 6 },
  createChartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(201,169,98,0.15)',
  },
  createChartText: { color: theme.primary, fontWeight: '600', fontSize: 16, marginLeft: 8 },

  sectionBlock: { marginBottom: theme.spacing.lg },
  sectionTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: theme.spacing.md },

  planetStrip: { paddingRight: theme.spacing.lg },
  planetChip: {
    width: 115,
    height: 120,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.15)',
  },
  planetSymbol: { fontSize: 22, color: theme.primary, marginBottom: 4 },
  planetName: { color: theme.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  planetSign: { color: theme.textPrimary, fontWeight: '600', fontSize: 10, marginTop: 4, textAlign: 'center' },
  planetDegree: { color: theme.textSecondary, fontSize: 11, marginTop: 2 },

  quickLinksRow: { flexDirection: 'row', gap: theme.spacing.sm },
  quickLink: { flex: 1, borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  quickLinkGradient: { padding: theme.spacing.md, alignItems: 'center', height: 110, justifyContent: 'center' },
  quickLinkTitle: { color: theme.textPrimary, fontWeight: '700', fontSize: 14, marginTop: 8 },
  quickLinkSub: { color: theme.textMuted, fontSize: 11, textAlign: 'center', marginTop: 2 },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 179, 0, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  warningContent: { flex: 1, marginLeft: theme.spacing.sm },
  warningTitle: { color: theme.warning, fontWeight: '600', marginBottom: 2 },
  warningText: { color: theme.textSecondary, fontSize: 13 },
});
