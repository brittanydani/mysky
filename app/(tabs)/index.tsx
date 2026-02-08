import React, { useState, useCallback, useMemo } from 'react';
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
import { NatalChart, PlanetPlacement, BirthData } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { ChartDisplayManager } from '../../services/astrology/chartDisplayManager';
import { DailyInsightEngine, DailyInsight as DailyInsightData, DailyInsightCard } from '../../services/astrology/dailyInsightEngine';
import { HumanGuidanceGenerator } from '../../services/astrology/humanGuidance';
import { InsightHistoryService } from '../../services/storage/insightHistory';
import { detectChartPatterns, ChartPatterns } from '../../services/astrology/chartPatterns';
import { config } from '../../constants/config';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Element color mapping ──
const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#E07A7A',
  Earth: '#6EBF8B',
  Air: '#8BC4E8',
  Water: '#7A8BE0',
};

const ELEMENT_EMOJI: Record<string, string> = {
  Fire: '🔥',
  Earth: '🌿',
  Air: '💨',
  Water: '🌊',
};

// ── Domain icon mapping ──
const DOMAIN_ICONS: Record<string, { name: string; color: string }> = {
  love: { name: 'heart', color: '#E07A98' },
  energy: { name: 'flash', color: '#E0B07A' },
  focus: { name: 'eye', color: '#8BC4E8' },
  mood: { name: 'water', color: '#7A8BE0' },
  direction: { name: 'compass', color: '#C9A962' },
  home: { name: 'home', color: '#6EBF8B' },
  growth: { name: 'leaf', color: '#6EBF8B' },
};

// ── Compute element balance from chart ──
function getElementBalance(chart: NatalChart): { element: string; count: number; percent: number }[] {
  const placements: PlanetPlacement[] = [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ];

  const counts: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  for (const p of placements) {
    if (p?.sign?.element) counts[p.sign.element]++;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .map(([element, count]) => ({ element, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

// ── Get retrograde planets ──
function getRetrogradePlanets(chart: NatalChart): PlanetPlacement[] {
  const personal: PlanetPlacement[] = [
    chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ];
  return personal.filter(p => p?.isRetrograde);
}

// ── Dominant modality ──
function getDominantModality(chart: NatalChart): string {
  const placements: PlanetPlacement[] = [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn,
  ];
  const counts: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of placements) {
    if (p?.sign?.modality) counts[p.sign.modality]++;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

const MODALITY_DESCRIPTIONS: Record<string, string> = {
  Cardinal: 'You initiate — a natural starter and leader',
  Fixed: 'You sustain — deeply determined and persistent',
  Mutable: 'You adapt — flexible and open to change',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();

  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEditBirth, setShowEditBirth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dailyInsight, setDailyInsight] = useState<DailyInsightData | null>(null);

  // Reload chart every time this screen is focused (picks up edits from settings or other screens)
  useFocusEffect(
    useCallback(() => {
      loadUserChart();
    }, [])
  );

  const loadUserChart = async () => {
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
      } else {
        setShowOnboarding(true);
      }
    } catch (error) {
      logger.error('Failed to load user chart:', error);
      setShowOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

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

      // Update the existing chart in DB (or save as new if none existed)
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

      // Regenerate daily insight
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

  // Derived data
  const elementBalance = userChart ? getElementBalance(userChart) : [];
  const retrogradePlanets = userChart ? getRetrogradePlanets(userChart) : [];
  const dominantModality = userChart ? getDominantModality(userChart) : '';

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

  // Chart pattern analysis (stelliums, chart ruler, clusters, retrogrades)
  const chartPatterns = useMemo<ChartPatterns | null>(() => {
    if (!userChart) return null;
    return detectChartPatterns(userChart);
  }, [userChart]);

  // Does the chart have any notable highlights worth showing?
  const hasHighlights = chartPatterns && (
    chartPatterns.stelliums.length > 0 ||
    chartPatterns.conjunctionClusters.length > 0 ||
    chartPatterns.chartRuler !== null ||
    chartPatterns.retrogradeEmphasis.count > 0
  );

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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 0 },
          ]}
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
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              style={styles.chartSummary}
            >
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
                        {userChart.ascendant.sign.symbol}{' '}
                        {userChart.ascendant.sign.name}
                      </Text>
                      <Text style={styles.signElement}>
                        {userChart.ascendant.sign.element}
                      </Text>
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

          {/* ── Create Chart CTA (when no chart exists) ── */}
          {!userChart && !loading && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              style={styles.chartSummary}
            >
              <LinearGradient
                colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                style={styles.chartCard}
              >
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Discover Your Cosmic Blueprint</Text>
                  <Text style={styles.chartDate}>Enter your birth details to get started</Text>
                </View>

                <Pressable
                  style={styles.createChartButton}
                  onPress={() => setShowOnboarding(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                  <Text style={styles.createChartText}>Create Your Chart</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Planetary Placements Strip ── */}
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

          {/* ── Chart Highlights (stelliums, chart ruler, clusters, retrogrades) ── */}
          {userChart && hasHighlights && chartPatterns && (
            <Animated.View entering={FadeInDown.delay(275).duration(600)} style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>What Stands Out</Text>

              {/* Chart Ruler — free for everyone */}
              {chartPatterns.chartRuler && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                  style={styles.highlightCard}
                >
                  <View style={styles.highlightHeader}>
                    <Text style={styles.highlightEmoji}>👑</Text>
                    <View style={styles.highlightHeaderText}>
                      <Text style={styles.highlightTitle}>
                        Your Chart Ruler: {chartPatterns.chartRuler.planetSymbol} {chartPatterns.chartRuler.planet}
                      </Text>
                      <Text style={styles.highlightSubtitle}>
                        {chartPatterns.chartRuler.rulerSignSymbol} {chartPatterns.chartRuler.rulerSign} · House {chartPatterns.chartRuler.rulerHouse}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.highlightDesc}>{chartPatterns.chartRuler.description}</Text>
                </LinearGradient>
              )}

              {/* Stelliums — Free: 1 most personal, Premium: all */}
              {(() => {
                // Pick the most personal stellium (Sun or Moon involved) for free users
                const personalStellium = chartPatterns.stelliums.find(s =>
                  s.planets.some(p => p === 'Sun' || p === 'Moon' || p === '☉' || p === '☽')
                ) || chartPatterns.stelliums[0];
                const freeStelliums = personalStellium ? [personalStellium] : [];
                const visibleStelliums = isPremium ? chartPatterns.stelliums : freeStelliums;
                const hiddenCount = chartPatterns.stelliums.length - visibleStelliums.length;

                return (
                  <>
                    {visibleStelliums.map((s) => (
                      <LinearGradient
                        key={`${s.type}-${s.label}`}
                        colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                        style={styles.highlightCard}
                      >
                        <View style={styles.highlightHeader}>
                          <Text style={styles.highlightEmoji}>{s.type === 'combined' ? '◈' : '✦'}</Text>
                          <View style={styles.highlightHeaderText}>
                            <Text style={styles.highlightTitle}>
                              {s.cardTitle}
                            </Text>
                            <Text style={styles.highlightSubtitle}>
                              {s.planets.join(' · ')}
                            </Text>
                          </View>
                        </View>
                        {s.subtitle ? (
                          <Text style={styles.stelliumSubtitleText}>{s.subtitle}</Text>
                        ) : null}
                        <Text style={styles.highlightDesc}>{s.description}</Text>
                        {isPremium && s.elementCloser ? (
                          <Text style={styles.highlightDesc}>{s.elementCloser}</Text>
                        ) : null}
                        {isPremium && s.planetMixNote ? (
                          <Text style={styles.stelliumAnnotation}>{s.planetMixNote}</Text>
                        ) : null}
                        {isPremium && s.retroNote ? (
                          <Text style={styles.stelliumAnnotation}>{s.retroNote}</Text>
                        ) : null}
                      </LinearGradient>
                    ))}

                    {/* Soft premium nudge for hidden stelliums */}
                    {!isPremium && hiddenCount > 0 && (
                      <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                        <LinearGradient
                          colors={['rgba(201,169,98,0.1)', 'rgba(201,169,98,0.05)']}
                          style={styles.softUpsell}
                        >
                          <Ionicons name="sparkles" size={16} color={theme.primary} />
                          <Text style={styles.softUpsellText}>
                            {hiddenCount} more pattern{hiddenCount > 1 ? 's' : ''} in your chart — see how they shape your story
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                        </LinearGradient>
                      </Pressable>
                    )}
                  </>
                );
              })()}

              {/* Stellium overflow note */}
              {isPremium && chartPatterns.stelliumOverflow && (
                <Text style={styles.overflowNote}>Other areas also show notable concentration.</Text>
              )}

              {/* Conjunction Clusters (near-stelliums / tight pairs) */}
              {chartPatterns.conjunctionClusters
                .filter((c) => {
                  // Don't show clusters that overlap with stelliums
                  const stelliumPlanets = new Set(
                    chartPatterns.stelliums.flatMap((s) => s.planets)
                  );
                  return !c.planets.every((p) => stelliumPlanets.has(p));
                })
                .map((c, i) => (
                  <LinearGradient
                    key={`cluster-${i}`}
                    colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                    style={styles.highlightCard}
                  >
                    <View style={styles.highlightHeader}>
                      <Text style={styles.highlightEmoji}>⚡</Text>
                      <View style={styles.highlightHeaderText}>
                        <Text style={styles.highlightTitle}>Planet Cluster</Text>
                        <Text style={styles.highlightSubtitle}>
                          {c.planets.join(' · ')} ({c.tightestOrb}° apart)
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.highlightDesc}>{c.description}</Text>
                  </LinearGradient>
                ))}

              {/* Retrograde Emphasis (soft, inline) */}
              {chartPatterns.retrogradeEmphasis.count > 0 && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                  style={styles.highlightCard}
                >
                  <View style={styles.highlightHeader}>
                    <Text style={styles.highlightEmoji}>℞</Text>
                    <View style={styles.highlightHeaderText}>
                      <Text style={styles.highlightTitle}>Inner Processing Emphasis</Text>
                      <Text style={styles.highlightSubtitle}>
                        {chartPatterns.retrogradeEmphasis.planets.join(' · ')} retrograde
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.highlightDesc}>
                    {chartPatterns.retrogradeEmphasis.description}
                  </Text>
                </LinearGradient>
              )}
            </Animated.View>
          )}

          {/* ── Element Balance ── */}
          {userChart && elementBalance.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Elemental Balance</Text>
              <LinearGradient
                colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                style={styles.elementCard}
              >
                {elementBalance.map((el) => (
                  <View key={el.element} style={styles.elementRow}>
                    <View style={styles.elementLabelRow}>
                      <Text style={styles.elementEmoji}>{ELEMENT_EMOJI[el.element]}</Text>
                      <Text style={styles.elementName}>{el.element}</Text>
                      <Text style={styles.elementCount}>{el.count} planets</Text>
                    </View>
                    <View style={styles.elementBarBg}>
                      <View
                        style={[
                          styles.elementBarFill,
                          {
                            width: `${el.percent}%`,
                            backgroundColor: ELEMENT_COLORS[el.element],
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.elementPercent, { color: ELEMENT_COLORS[el.element] }]}>
                      {el.percent}%
                    </Text>
                  </View>
                ))}

                {/* Low-emphasis element note */}
                {elementBalance.filter(el => el.count === 0).map((el) => (
                  <View key={`low-${el.element}`} style={styles.lowElementRow}>
                    <Text style={styles.lowElementText}>
                      {ELEMENT_EMOJI[el.element]} {el.element} ({el.percent}%) —{' '}
                      {el.element === 'Fire' && 'Spontaneity may be quieter — not absent, just internal.'}
                      {el.element === 'Earth' && 'Grounding may take more conscious effort — a growth edge, not a flaw.'}
                      {el.element === 'Air' && 'Intellectual processing may come through other channels first.'}
                      {el.element === 'Water' && 'Emotional processing may be quieter or more private — not absent, just internal.'}
                    </Text>
                  </View>
                ))}
                {elementBalance.filter(el => el.count === 1 && el.percent <= 10).map((el) => (
                  <View key={`low-${el.element}`} style={styles.lowElementRow}>
                    <Text style={styles.lowElementText}>
                      {ELEMENT_EMOJI[el.element]} {el.element} ({el.percent}%) —{' '}
                      This energy is present but quiet. You may notice it shows up in more subtle or private ways.
                    </Text>
                  </View>
                ))}

                {/* Dominant modality */}
                <View style={styles.modalityRow}>
                  <Text style={styles.modalityLabel}>Dominant Mode</Text>
                  <Text style={styles.modalityValue}>{dominantModality}</Text>
                </View>
                <Text style={styles.modalityDescription}>
                  {MODALITY_DESCRIPTIONS[dominantModality] || ''}
                </Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Quick Links ── */}
          <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Explore</Text>
            <View style={styles.quickLinksRow}>
              <Pressable
                style={styles.quickLink}
                onPress={() => router.push('/(tabs)/story' as Href)}
              >
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.7)']}
                  style={styles.quickLinkGradient}
                >
                  <Ionicons name="book-outline" size={24} color={theme.primary} />
                  <Text style={styles.quickLinkTitle}>Story</Text>
                  <Text style={styles.quickLinkSub}>Your narrative</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={styles.quickLink}
                onPress={() => router.push('/(tabs)/journal' as Href)}
              >
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.7)']}
                  style={styles.quickLinkGradient}
                >
                  <Ionicons name="pencil-outline" size={24} color={theme.love} />
                  <Text style={styles.quickLinkTitle}>Journal</Text>
                  <Text style={styles.quickLinkSub}>Reflect & grow</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={styles.quickLink}
                onPress={() => router.push('/(tabs)/healing' as Href)}
              >
                <LinearGradient
                  colors={['rgba(30,45,71,0.9)', 'rgba(26,39,64,0.7)']}
                  style={styles.quickLinkGradient}
                >
                  <Ionicons name="heart-outline" size={24} color={theme.energy} />
                  <Text style={styles.quickLinkTitle}>Healing</Text>
                  <Text style={styles.quickLinkSub}>Inner work</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <OnboardingModal
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <BirthDataModal
        visible={showEditBirth}
        onClose={() => setShowEditBirth(false)}
        onSave={handleEditBirthData}
        initialData={userChart ? {
          date: userChart.birthData.date,
          time: userChart.birthData.time,
          hasUnknownTime: userChart.birthData.hasUnknownTime,
          place: userChart.birthData.place,
          latitude: userChart.birthData.latitude,
          longitude: userChart.birthData.longitude,
          houseSystem: userChart.birthData.houseSystem,
          chartName: userChart.name,
        } : undefined}
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

  // Chart Summary
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
  editBirthButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  editBirthText: { color: theme.textSecondary, fontSize: 13, marginLeft: 6 },
  createChartButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: theme.spacing.md, paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.md, backgroundColor: 'rgba(201,169,98,0.15)' },
  createChartText: { color: theme.primary, fontWeight: '600', fontSize: 16, marginLeft: 8 },

  // Section
  sectionBlock: { marginBottom: theme.spacing.lg },
  sectionTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: theme.spacing.md },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  seeAllText: { color: theme.primary, fontSize: 14, fontWeight: '600' },

  // Planet Strip
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
  planetSign: { color: theme.textPrimary, fontWeight: '600', fontSize: 13, marginTop: 4, textAlign: 'center' },
  planetDegree: { color: theme.textSecondary, fontSize: 11, marginTop: 2 },
  retroBadge: { color: theme.warning, fontSize: 10, fontWeight: '700', marginTop: 4, textAlign: 'center' },

  // Element Balance
  elementCard: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg },
  elementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  elementLabelRow: { flexDirection: 'row', alignItems: 'center', width: 110 },
  elementEmoji: { fontSize: 16, marginRight: 6 },
  elementName: { color: theme.textPrimary, fontWeight: '600', fontSize: 14, width: 40 },
  elementCount: { color: theme.textMuted, fontSize: 11 },
  elementBarBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, marginHorizontal: theme.spacing.sm },
  elementBarFill: { height: 8, borderRadius: 4 },
  elementPercent: { width: 36, textAlign: 'right', fontSize: 13, fontWeight: '700' },
  modalityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  modalityLabel: { color: theme.textMuted, fontSize: 13 },
  modalityValue: { color: theme.primary, fontWeight: '700', fontSize: 15 },
  modalityDescription: { color: theme.textSecondary, fontSize: 13, fontStyle: 'italic', marginTop: 4 },

  // Chart Highlights
  highlightCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  highlightEmoji: { fontSize: 18, marginRight: 10, marginTop: 1 },
  highlightHeaderText: { flex: 1 },
  highlightTitle: {
    color: theme.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  highlightSubtitle: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  highlightDesc: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  stelliumSubtitleText: {
    color: theme.primary,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  stelliumAnnotation: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 6,
  },
  overflowNote: {
    color: theme.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },

  // Soft premium upsell
  softUpsell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: 8,
  },
  softUpsellText: {
    flex: 1,
    color: theme.primary,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Low element note
  lowElementRow: {
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  lowElementText: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // Today's Weather
  weatherHeadlineCard: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, marginBottom: theme.spacing.md },
  weatherHeadline: { color: theme.textPrimary, fontSize: 20, fontWeight: '700', lineHeight: 28 },
  weatherSubtext: { color: theme.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 6 },
  mantraRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  mantraText: { color: theme.primary, fontSize: 14, fontStyle: 'italic', marginLeft: 6, fontWeight: '600' },

  // Insight Cards
  insightCard: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', marginBottom: theme.spacing.sm },
  insightCardGradient: { padding: theme.spacing.lg },
  insightCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  domainDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  insightCardDomain: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  insightCardObservation: { color: theme.textPrimary, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  insightCardChoice: { color: theme.textSecondary, fontSize: 13, lineHeight: 18, fontStyle: 'italic' },

  // Quick Links
  quickLinksRow: { flexDirection: 'row', gap: theme.spacing.sm },
  quickLink: { flex: 1, borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  quickLinkGradient: { padding: theme.spacing.md, alignItems: 'center', height: 110, justifyContent: 'center' },
  quickLinkTitle: { color: theme.textPrimary, fontWeight: '700', fontSize: 14, marginTop: 8 },
  quickLinkSub: { color: theme.textMuted, fontSize: 11, textAlign: 'center', marginTop: 2 },

  // Warning
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(255, 179, 0, 0.1)', borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.lg },
  warningContent: { flex: 1, marginLeft: theme.spacing.sm },
  warningTitle: { color: theme.warning, fontWeight: '600', marginBottom: 2 },
  warningText: { color: theme.textSecondary, fontSize: 13 },
});
