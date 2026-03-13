/**
 * Daily Context — Stack Screen
 *
 * Full-Disclosure layer. Instrumental Precision, Narrative Continuity,
 * Atmospheric Depth. Aligned with the High-End 5-Hub Architecture.
 *
 * Reached intentionally via router.push('/astrology-context') from the
 * Insights tab. NOT a bottom tab.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/core';

// ── Design tokens ──
const PALETTE = {
  gold: '#D4B872',
  bg: '#0A0A0C',        // Unified OLED black — makes SkiaDynamicCosmos feel infinite
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.08)',
};
import { applyStoryLabels, applyGuidanceLabels } from '../constants/storyLabels';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import ShadowQuoteCard from '../components/ui/ShadowQuoteCard';
import { localDb } from '../services/storage/localDb';
import { NatalChart } from '../services/astrology/types';
import { AstrologyCalculator } from '../services/astrology/calculator';
import { HumanGuidanceGenerator, HumanDailyGuidance } from '../services/astrology/humanGuidance';
import { DailyInsightEngine, DailyInsight } from '../services/astrology/dailyInsightEngine';
import { InsightHistoryService, SavedInsight } from '../services/storage/insightHistory';
import { ShadowQuoteEngine, ShadowQuoteResult } from '../services/astrology/shadowQuotes';
import { detectChartPatterns, ChartPatterns } from '../services/astrology/chartPatterns';
import { getChironInsightFromChart, ChironInsight } from '../services/journal/chiron';
import { getNodeInsight, NodeInsight } from '../services/journal/nodes';
import { PremiumDailyGuidanceGenerator, PremiumDailyGuidance } from '../services/premium/premiumDailyGuidance';
import { DailyAffirmationEngine, DailyAffirmation } from '../services/energy/dailyAffirmation';
import { TodayContentEngine, TodayContent } from '../services/today/todayContentEngine';
import { getTransitInfo } from '../services/astrology/transits';
import { usePremium } from '../context/PremiumContext';
import { logger } from '../utils/logger';
import { parseLocalDate } from '../utils/dateUtils';
import { getMoonPhaseInfo } from '../utils/moonPhase';

// ── Moon phase (precise, via astronomy-engine) ──
function getMoonPhase(date: Date): { name: string; emoji: string; message: string } {
  const info = getMoonPhaseInfo(date);
  return { name: info.name, emoji: info.emoji, message: info.message };
}

// ── Domain glow color for highlight ring ──
const DOMAIN_HIGHLIGHT: Record<string, string> = {
  love:      'rgba(224, 122, 152, 0.25)',
  energy:    'rgba(110, 191, 139, 0.25)',
  growth:    'rgba(139, 196, 232, 0.25)',
  focus:     'rgba(139, 196, 232, 0.25)',
  mood:      'rgba(122, 139, 224, 0.25)',
  direction: 'rgba(232,214,174,0.18)',
  home:      'rgba(110, 191, 139, 0.25)',
};

// ── Retrograde Review Cycles — Architectural Holds ──
const RETROGRADE_CONTEXT: Record<string, { label: string; note: string }> = {
  Mercury: { label: 'Communication Review', note: 'Double-check details. Patience is a somatic tool today.' },
  Venus:   { label: 'Relational Review',     note: 'Internalize your values. Old connection patterns may resurface.' },
  Mars:    { label: 'Drive Review',           note: 'Energy turns inward. Strategy over action. Do not force outcomes.' },
  Jupiter: { label: 'Expansion Review',       note: 'Growth becomes internal. Revisit beliefs and what expansion means to you.' },
  Saturn:  { label: 'Structure Review',       note: 'Review your structures and commitments. Rebuild what needs a stronger foundation.' },
};

// ── Shared nav bar shown in all render states ──
function NavBar({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.navBar}>
      <Pressable
        style={styles.backBtn}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </Pressable>
      <Text style={styles.navTitle}>Daily Context</Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

export default function AstrologyContextScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();

  // Prevent setState after unmount / fast nav
  const isMountedRef = useRef(true);
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [guidance, setGuidance] = useState<HumanDailyGuidance | null>(null);
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [savedInsight, setSavedInsight] = useState<SavedInsight | null>(null);
  const [yesterdayInsight, setYesterdayInsight] = useState<SavedInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWhyThis, setShowWhyThis] = useState(false);
  const [showMoonWeek, setShowMoonWeek] = useState(false);
  const [shadowQuote, setShadowQuote] = useState<ShadowQuoteResult | null>(null);
  const [chartPatterns, setChartPatterns] = useState<ChartPatterns | null>(null);
  const [chironInsight, setChironInsight] = useState<ChironInsight | null>(null);
  const [nodeInsight, setNodeInsight] = useState<NodeInsight | null>(null);
  const [premiumGuidance, setPremiumGuidance] = useState<PremiumDailyGuidance | null>(null);
  const [dailyAffirmation, setDailyAffirmation] = useState<DailyAffirmation | null>(null);
  const [todayContent, setTodayContent] = useState<TodayContent | null>(null);
  const [retrogradePlanets, setRetrogradePlanets] = useState<string[]>([]);

  // Week's moon phases (today + 6 days)
  const weekMoonPhases = useMemo(() => {
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const phase = getMoonPhase(d);
      return { ...phase, label: i === 0 ? 'Today' : days[d.getDay()], date: d.getDate() };
    });
  }, []);

  const loadTodayData = useCallback(async () => {
    // When revisiting, refresh + show a short loading state (prevents stale “yesterday” + keeps premium changes in sync)
    if (isMountedRef.current) setLoading(true);
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

        if (isMountedRef.current) setUserChart(chart);

        // Generate human-first daily guidance
        const dailyGuidance = HumanGuidanceGenerator.generateDailyGuidance(chart);
        if (isMountedRef.current) setGuidance(dailyGuidance);

        // Get full insight with timeline (for premium features)
        const dailyInsight = DailyInsightEngine.generateDailyInsight(chart);
        if (isMountedRef.current) setInsight(dailyInsight);

        // Detect retrograde transiting planets
        let currentRetrogrades: string[] = [];
        try {
          const transitInfo = getTransitInfo(
            new Date(),
            chart.birthData.latitude || 0,
            chart.birthData.longitude || 0,
          );
          currentRetrogrades = transitInfo.retrogrades;
          if (isMountedRef.current) setRetrogradePlanets(currentRetrogrades);
        } catch (e) {
          logger.error('Failed to detect retrogrades:', e);
        }

        // Generate daily affirmation from chart + transits
        try {
          const affirmation = DailyAffirmationEngine.getAffirmation(chart, new Date());
          if (isMountedRef.current) setDailyAffirmation(affirmation);
        } catch (e) {
          logger.error('Failed to generate daily affirmation:', e);
        }

        // Generate today's content from massive library
        try {
          const content = await TodayContentEngine.generateTodayContent(
            chart,
            new Date(),
            dailyGuidance.intensity,
            dailyGuidance.dominantDomain,
            currentRetrogrades.length > 0,
          );
          if (isMountedRef.current) setTodayContent(content);
        } catch (e) {
          logger.error('Failed to generate today content:', e);
        }

        // Generate today's shadow quote
        try {
          const shadow = await ShadowQuoteEngine.getDailyShadowQuote(chart);
          if (isMountedRef.current) setShadowQuote(shadow);
        } catch (e) {
          logger.error('Failed to generate shadow quote:', e);
        }

        // Premium: generate stellium/chiron/node context + personalized guidance
        if (isPremium) {
          try {
            if (isMountedRef.current) {
              setChartPatterns(detectChartPatterns(chart));
              setChironInsight(getChironInsightFromChart(chart));
              setNodeInsight(getNodeInsight(chart));
              setPremiumGuidance(PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart));
            }
          } catch {
            // Non-critical premium context
          }
        } else {
          // Ensure premium-only content doesn’t “stick” after downgrades / dev testing
          if (isMountedRef.current) {
            setChartPatterns(null);
            setChironInsight(null);
            setNodeInsight(null);
            setPremiumGuidance(null);
          }
        }

        // Save to history and get saved record
        if (savedChart.id) {
          const saved = await InsightHistoryService.saveInsight(
            dailyGuidance,
            savedChart.id,
            dailyInsight.signals
          );
          if (isMountedRef.current) setSavedInsight(saved);

          // Get yesterday's insight for continuity thread
          try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yStr = yesterday.toISOString().split('T')[0];
            const yInsight = await InsightHistoryService.getInsightByDate(yStr, savedChart.id);
            if (isMountedRef.current) setYesterdayInsight(yInsight);
          } catch {
            // Not critical
          }
        }
      }
    } catch (error) {
      logger.error('Failed to load today data:', error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [isPremium]);

  useFocusEffect(
    useCallback(() => {
      void loadTodayData();
      // Collapse expanded panels on re-entry (feels more intentional)
      setShowWhyThis(false);
      setShowMoonWeek(false);
    }, [loadTodayData])
  );
  const toggleFavorite = useCallback(async () => {
    if (!savedInsight) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    const newStatus = await InsightHistoryService.toggleFavorite(savedInsight.id);
    setSavedInsight(prev => prev ? { ...prev, isFavorite: newStatus } : null);
  }, [savedInsight]);

  const toggleWhyThis = useCallback(async () => {
    try { await Haptics.selectionAsync(); } catch {}
    setShowWhyThis(prev => !prev);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <NavBar onBack={() => router.back()} />
          <View style={styles.centeredFlex}>
            <Text style={styles.loadingText}>Preparing your daily context…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!userChart || !guidance) {
    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <NavBar onBack={() => router.back()} />
          <View style={styles.centeredFlex}>
            <Text style={styles.emptyTitle}>Your daily guidance awaits</Text>
            <Text style={styles.loadingText}>Create your chart to receive personalized daily insights</Text>
            <Pressable
              style={styles.createChartButton}
              onPress={() => router.push('/')}
              accessibilityRole="button"
              accessibilityLabel="Get started"
            >
              <Text style={styles.createChartText}>Get Started</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Cache premium category lookups to avoid repeated .find() calls
  const premiumLove = premiumGuidance?.categories.find(c => c.category === 'love');
  const premiumEnergy = premiumGuidance?.categories.find(c => c.category === 'energy');
  const premiumWork = premiumGuidance?.categories.find(c => c.category === 'work');
  const premiumEmotional = premiumGuidance?.categories.find(c => c.category === 'emotional');

  const formatDate = (dateString?: string) => {
    const date = parseLocalDate(dateString || new Date().toISOString().split('T')[0]);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const dominantDomain = guidance.dominantDomain || 'mood';
  const intensity      = guidance.intensity || 'calm';
  const notableRetrogrades = retrogradePlanets.filter(p => RETROGRADE_CONTEXT[p]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <NavBar onBack={() => router.back()} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Greeting Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.dateLabel}>{formatDate(guidance.date)}</Text>
                <Text style={styles.greeting}>{todayContent?.greeting || guidance.greeting}</Text>
              </View>
              {isPremium && savedInsight && (
                <Pressable
                  onPress={toggleFavorite}
                  hitSlop={12}
                  style={styles.favoriteButton}
                  accessibilityRole="button"
                  accessibilityLabel={savedInsight.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Ionicons
                    name={savedInsight.isFavorite ? 'heart' : 'heart-outline'}
                    size={24}
                    color={savedInsight.isFavorite ? '#E07A98' : 'rgba(255,255,255,0.3)'}
                  />
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* ── Hub 1: Cosmic Weather (The Instrument) ── */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.section}>
            <LinearGradient
              colors={['rgba(212, 184, 114, 0.12)', 'rgba(10, 10, 12, 0.8)']}
              style={styles.weatherCard}
            >
              <View style={styles.weatherHeader}>
                <Ionicons name="partly-sunny-outline" size={18} color={PALETTE.gold} />
                <Text style={styles.weatherEyebrow}>CURRENT FREQUENCY</Text>
              </View>
              <Text style={styles.weatherText}>{applyGuidanceLabels(todayContent?.cosmicWeather || guidance.cosmicWeather)}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>
                  Intensity: <Text style={styles.metaValue}>{intensity === 'calm' ? 'Gentle' : intensity === 'moderate' ? 'Active' : 'High'}</Text>
                </Text>
                <View style={styles.metaSep} />
                <Text style={styles.metaLabel}>
                  Focus: <Text style={styles.metaValue}>
                    {dominantDomain === 'love' ? 'Love' : dominantDomain === 'energy' ? 'Energy' : dominantDomain === 'mood' ? 'Mood' : 'Growth'}
                  </Text>
                </Text>
                {notableRetrogrades.length > 0 && (
                  <>
                    <View style={styles.metaSep} />
                    <Text style={[styles.metaLabel, { color: '#E8D6AE' }]}>
                      {notableRetrogrades.length} review cycle{notableRetrogrades.length > 1 ? 's' : ''}
                    </Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── Hub 2: Moon Phase + Week Forecast ── */}
          <Animated.View entering={FadeInDown.delay(180).duration(600)} style={styles.section}>
            <Pressable
              onPress={async () => {
                try { await Haptics.selectionAsync(); } catch {}
                setShowMoonWeek(prev => !prev);
              }}
              accessibilityRole="button"
              accessibilityLabel={showMoonWeek ? 'Collapse moon week view' : 'Expand moon week view'}
            >
              <LinearGradient
                colors={['rgba(14, 24, 48, 0.8)', 'rgba(10, 10, 12, 0.5)']}
                style={styles.moonCard}
              >
                <View style={styles.moonCardContent}>
                  <Text style={styles.moonEmoji}>{guidance.moonPhaseEmoji || '🌙'}</Text>
                  <View style={styles.moonTextContainer}>
                    <Text style={styles.moonPhaseName}>{guidance.moonPhase || 'Moon Phase'}</Text>
                    <Text style={styles.moonPhaseMessage}>{guidance.moonPhaseMessage || ''}</Text>
                  </View>
                  <Ionicons name={showMoonWeek ? 'chevron-up' : 'chevron-down'} size={20} color="rgba(255,255,255,0.3)" />
                </View>
                {guidance.moonSign && (
                  <View style={styles.moonSignRow}>
                    <Text style={styles.moonSignLabel}>Today's quality</Text>
                    <Text style={styles.moonSignValue}>{applyStoryLabels(guidance.moonSign)}</Text>
                  </View>
                )}
                {showMoonWeek && (
                  <View style={styles.moonWeekRow}>
                    {weekMoonPhases.map((day, i) => (
                      <View key={i} style={[styles.moonWeekDay, i === 0 && styles.moonWeekDayToday]}>
                        <Text style={styles.moonWeekEmoji}>{day.emoji}</Text>
                        <Text style={[styles.moonWeekLabel, i === 0 && styles.moonWeekLabelToday]}>{day.label}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Hub 3: Review Cycles (Architectural Holds) ── */}
          {notableRetrogrades.length > 0 && (
            <Animated.View entering={FadeInDown.delay(190).duration(600)} style={styles.section}>
              {notableRetrogrades.map((planet) => {
                const ctx = RETROGRADE_CONTEXT[planet];
                return (
                  <View key={planet} style={styles.retroCard}>
                    <View style={styles.retroHeader}>
                      <Ionicons name="sync" size={14} color="#E8D6AE" />
                      <Text style={styles.retroTitle}>{ctx.label}</Text>
                      <View style={styles.retrogradeBadge}>
                        <Text style={styles.retrogradeBadgeText}>↺</Text>
                      </View>
                    </View>
                    <Text style={styles.retroNote}>{ctx.note}</Text>
                  </View>
                );
              })}
            </Animated.View>
          )}

          {/* ── Narrative Bridge: Yesterday → Today ── */}
          {yesterdayInsight && (
            <Animated.View entering={FadeInDown.delay(195).duration(600)} style={styles.section}>
              <View style={styles.yesterdayCard}>
                <View style={styles.yesterdayHeader}>
                  <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.yesterdayLabel}>Building on yesterday</Text>
                </View>
                <Text style={styles.yesterdayText}>
                  Yesterday's theme was{' '}
                  <Text style={styles.yesterdayHighlight}>
                    {applyStoryLabels(yesterdayInsight.loveHeadline || 'reflection').toLowerCase()}
                  </Text>{' '}
                  — today builds on that energy.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── Love Card ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <LinearGradient
              colors={['rgba(224, 122, 152, 0.12)', 'rgba(224, 122, 152, 0.04)']}
              style={[
                styles.guidanceCard,
                dominantDomain === 'love' && { borderWidth: 1.5, borderColor: DOMAIN_HIGHLIGHT.love },
              ]}
            >
              <View style={[styles.cardTopGlow, { backgroundColor: '#E07A98' }]} />
              <View style={styles.cardHeader}>
                <Ionicons name="heart" size={18} color="#E07A98" />
                <Text style={[styles.cardLabel, { color: '#E07A98' }]}>LOVE</Text>
                {dominantDomain === 'love' && (
                  <View style={styles.strongestBadge}><Text style={styles.strongestBadgeText}>strongest today</Text></View>
                )}
              </View>
              <Text style={styles.cardHeadline}>{applyGuidanceLabels(guidance.love.headline)}</Text>
              <Text style={styles.cardMessage}>{applyGuidanceLabels(guidance.love.message)}</Text>
              {premiumLove && (
                <View style={styles.premiumExtra}>
                  <Text style={styles.premiumKeyInsight}>{applyGuidanceLabels(premiumLove.keyInsight)}</Text>
                  <Text style={styles.premiumAction}>{applyGuidanceLabels(premiumLove.actionSuggestion)}</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── Energy Card ── */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <LinearGradient
              colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']}
              style={[
                styles.guidanceCard,
                dominantDomain === 'energy' && { borderWidth: 1.5, borderColor: DOMAIN_HIGHLIGHT.energy },
              ]}
            >
              <View style={[styles.cardTopGlow, { backgroundColor: '#6EBF8B' }]} />
              <View style={styles.cardHeader}>
                <Ionicons name="flash" size={18} color="#6EBF8B" />
                <Text style={[styles.cardLabel, { color: '#6EBF8B' }]}>ENERGY</Text>
                {dominantDomain === 'energy' && (
                  <View style={styles.strongestBadge}><Text style={styles.strongestBadgeText}>strongest today</Text></View>
                )}
              </View>
              <Text style={styles.cardHeadline}>{applyGuidanceLabels(guidance.energy.headline)}</Text>
              <Text style={styles.cardMessage}>{applyGuidanceLabels(guidance.energy.message)}</Text>
              {premiumEnergy && (
                <View style={styles.premiumExtra}>
                  <Text style={styles.premiumKeyInsight}>{applyGuidanceLabels(premiumEnergy.keyInsight)}</Text>
                  <Text style={styles.premiumAction}>{applyGuidanceLabels(premiumEnergy.actionSuggestion)}</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── Growth Card ── */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <LinearGradient
              colors={['rgba(139, 196, 232, 0.12)', 'rgba(139, 196, 232, 0.04)']}
              style={[
                styles.guidanceCard,
                (dominantDomain === 'growth' || dominantDomain === 'focus' || dominantDomain === 'direction')
                  && { borderWidth: 1.5, borderColor: DOMAIN_HIGHLIGHT.growth },
              ]}
            >
              <View style={[styles.cardTopGlow, { backgroundColor: '#8BC4E8' }]} />
              <View style={styles.cardHeader}>
                <Ionicons name="leaf" size={18} color="#8BC4E8" />
                <Text style={[styles.cardLabel, { color: '#8BC4E8' }]}>GROWTH</Text>
                {(dominantDomain === 'growth' || dominantDomain === 'focus' || dominantDomain === 'direction') && (
                  <View style={styles.strongestBadge}><Text style={styles.strongestBadgeText}>strongest today</Text></View>
                )}
              </View>
              <Text style={styles.cardHeadline}>{applyGuidanceLabels(guidance.growth.headline)}</Text>
              <Text style={styles.cardMessage}>{applyGuidanceLabels(guidance.growth.message)}</Text>
              {premiumWork && (
                <View style={styles.premiumExtra}>
                  <Text style={styles.premiumKeyInsight}>{applyGuidanceLabels(premiumWork.keyInsight)}</Text>
                  <Text style={styles.premiumAction}>{applyGuidanceLabels(premiumWork.actionSuggestion)}</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── 8. Premium: Emotional Weather ── */}
          {premiumEmotional && (
            <Animated.View entering={FadeInDown.delay(420).duration(600)} style={styles.section}>
              <LinearGradient
                colors={['rgba(122, 139, 224, 0.12)', 'rgba(122, 139, 224, 0.04)']}
                style={[
                  styles.guidanceCard,
                  dominantDomain === 'mood' && { borderWidth: 1.5, borderColor: DOMAIN_HIGHLIGHT.mood },
                ]}
              >
                <View style={[styles.cardTopGlow, { backgroundColor: '#7A8BE0' }]} />
                <View style={styles.cardHeader}>
                  <Ionicons name="water" size={18} color="#7A8BE0" />
                  <Text style={[styles.cardLabel, { color: '#7A8BE0' }]}>EMOTIONAL WEATHER</Text>
                  {dominantDomain === 'mood' && (
                    <View style={styles.strongestBadge}><Text style={styles.strongestBadgeText}>strongest today</Text></View>
                  )}
                </View>
                <Text style={styles.cardHeadline}>{applyGuidanceLabels(premiumEmotional.keyInsight)}</Text>
                <Text style={styles.cardMessage}>{applyGuidanceLabels(premiumEmotional.guidance)}</Text>
                <View style={styles.premiumExtra}>
                  <Text style={styles.premiumAction}>{applyGuidanceLabels(premiumEmotional.actionSuggestion)}</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Daily Affirmation ── */}
          <Animated.View entering={FadeInDown.delay(440).duration(600)} style={styles.section}>
            <LinearGradient
              colors={['rgba(14, 24, 48, 0.6)', 'rgba(10, 10, 12, 0.35)']}
              style={styles.affirmationCard}
            >
              <Ionicons name="sparkles" size={18} color={PALETTE.gold} style={{ marginBottom: 8 }} />
              <Text style={styles.affirmationText}>
                &ldquo;{todayContent?.affirmation || dailyAffirmation?.text || 'I trust my own timing.'}&rdquo;
              </Text>
              <Text style={styles.affirmationSource}>
                {todayContent?.affirmationSource || dailyAffirmation?.source || ''}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* ── Premium: Evening Reflection ── */}
          {premiumGuidance && (
            <Animated.View entering={FadeInDown.delay(520).duration(600)} style={styles.section}>
              <LinearGradient
                colors={['rgba(122, 139, 224, 0.1)', 'rgba(122, 139, 224, 0.04)']}
                style={styles.reminderCard}
              >
                <Text style={styles.promptLabel}>Evening reflection</Text>
                <Text style={styles.reminderText}>{applyGuidanceLabels(premiumGuidance.eveningReflection)}</Text>
                <Pressable
                  style={[styles.journalButton, { marginTop: 16 }]}
                  onPress={() => router.push('/(tabs)/journal')}
                  accessibilityRole="button"
                  accessibilityLabel="Write in journal"
                >
                  <LinearGradient
                    colors={['rgba(232,214,174,0.18)', 'rgba(232, 214, 174, 0.1)']}
                    style={styles.journalGradient}
                  >
                    <Ionicons name="create-outline" size={18} color={PALETTE.gold} />
                    <Text style={styles.journalButtonText}>Write in Journal</Text>
                  </LinearGradient>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Hub 4: Active Patterns / Why This? ── */}
          {insight && (
            <Animated.View entering={FadeInDown.delay(550).duration(600)} style={styles.section}>
              <Pressable
                onPress={isPremium ? toggleWhyThis : () => router.push('/(tabs)/premium')}
                accessibilityRole="button"
                accessibilityLabel="Why this insight"
              >
                <LinearGradient
                  colors={['rgba(212, 184, 114, 0.08)', 'rgba(212, 184, 114, 0.03)']}
                  style={styles.whyThisCard}
                >
                  <View style={styles.whyThisHeader}>
                    <View style={styles.whyThisLeft}>
                      <Ionicons name="telescope" size={18} color={PALETTE.gold} />
                      <Text style={styles.whyThisTitle}>Active Patterns</Text>
                    </View>
                    {isPremium ? (
                      <Ionicons name={showWhyThis ? 'chevron-up' : 'chevron-down'} size={20} color="rgba(255,255,255,0.3)" />
                    ) : (
                      <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.3)" />
                    )}
                  </View>

                  {/* Free: teaser row */}
                  {!isPremium && insight.signals.length > 0 && (
                    <View style={styles.whyThisTeaser}>
                      <View style={styles.signalRow}>
                        <View style={styles.signalDot} />
                        <Text style={styles.signalText}>{applyGuidanceLabels(insight.signals[0].description)}</Text>
                        <Text style={styles.signalOrb}>{insight.signals[0].orb}</Text>
                      </View>
                      {insight.signals.length > 1 && (
                        <Text style={styles.teaserMore}>
                          + {insight.signals.length - 1} more pattern{insight.signals.length > 2 ? 's' : ''} shaping your day
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Premium: full expanded signals */}
                  {isPremium && showWhyThis && (
                    <View style={styles.whyThisContent}>
                      {insight.timeline && (
                        <View style={styles.timelineSection}>
                          <View style={styles.timelineRow}>
                            <Text style={styles.timelineLabel}>Strongest:</Text>
                            <Text style={styles.timelineValue}>{insight.timeline.peakInfluence}</Text>
                          </View>
                          <View style={styles.timelineRow}>
                            <Text style={styles.timelineLabel}>Eases by:</Text>
                            <Text style={styles.timelineValue}>{insight.timeline.easesBy}</Text>
                          </View>
                          {insight.timeline.isPartOfLongerCycle && insight.timeline.longerCycleNote && (
                            <Text style={styles.cycleNote}>{applyStoryLabels(insight.timeline.longerCycleNote)}</Text>
                          )}
                        </View>
                      )}

                      <View style={styles.signalsSection}>
                        <Text style={styles.signalsSectionTitle}>Signal mapping:</Text>
                        {insight.signals.map((signal: { description: string; orb: string }, index: number) => (
                          <View key={index} style={styles.signalRow}>
                            <View style={styles.signalDot} />
                            <Text style={styles.signalText}>{applyGuidanceLabels(signal.description)}</Text>
                            <Text style={styles.signalOrb}>{signal.orb}</Text>
                          </View>
                        ))}
                      </View>

                      {/* ── Hub 5: Sacred Text — ShadowQuote + Chiron vertically stacked ── */}
                      {(shadowQuote || chironInsight) && (
                        <View style={styles.sacredTextStack}>
                          {shadowQuote && (
                            <ShadowQuoteCard quote={shadowQuote.quote} variant="inline" animationDelay={200} />
                          )}
                          {chironInsight && (
                            <View style={[styles.resonanceSection, shadowQuote && styles.resonanceSectionSpaced]}>
                              <Text style={styles.resonanceLabel}>✦ Sensitivity note</Text>
                              <Text style={styles.resonanceText}>
                                {applyStoryLabels(chironInsight.theme)} This may add an extra layer of feeling today.
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {chartPatterns && chartPatterns.stelliums.length > 0 && (
                        <View style={styles.resonanceSection}>
                          <Text style={styles.resonanceLabel}>Why this might feel familiar</Text>
                          <Text style={styles.resonanceText}>
                            You have a concentration in {applyStoryLabels(chartPatterns.stelliums[0].label)} — themes in this area tend to hit with extra weight.
                          </Text>
                        </View>
                      )}

                      {nodeInsight && (
                        <View style={styles.resonanceSection}>
                          <Text style={styles.resonanceLabel}>🧭 Growth frame</Text>
                          <Text style={styles.resonanceText}>{applyStoryLabels(nodeInsight.fusionLine)}</Text>
                        </View>
                      )}
                    </View>
                  )}
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
  container:     { flex: 1, backgroundColor: PALETTE.bg },
  safeArea:      { flex: 1 },
  scrollView:    { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 60 },
  centeredFlex:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },

  // ── Nav ──
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, height: 60,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn:  { width: 44, height: 44, justifyContent: 'center' },
  navTitle: {
    flex: 1, textAlign: 'center', color: '#FFF',
    fontSize: 16, fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // ── Loading / empty ──
  loadingText: { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 24 },
  emptyTitle:  { fontSize: 24, fontWeight: '600', color: '#FFF', fontFamily: 'serif', marginBottom: 12, textAlign: 'center' },
  createChartButton: {
    marginTop: 24, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(212,184,114,0.25)',
  },
  createChartText: { color: PALETTE.gold, fontWeight: '600', fontSize: 16 },

  // ── Header ──
  header:         { marginTop: 24, marginBottom: 32 },
  headerRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText:     { flex: 1 },
  favoriteButton: { padding: 8, marginTop: 2 },
  dateLabel: {
    color: PALETTE.gold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  greeting: {
    color: '#FFFFFF', fontSize: 24, fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 8, lineHeight: 32,
  },

  section: { marginBottom: 20 },

  // ── Cosmic Weather ──
  weatherCard: {
    padding: 24, borderRadius: 28, borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  weatherHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  weatherEyebrow: { color: PALETTE.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  weatherText: {
    color: '#FFFFFF', fontSize: 17, lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  metaLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  metaValue: {
    color: '#FFF', fontWeight: '700', textTransform: 'capitalize',
    fontVariant: ['tabular-nums'],
  },
  metaSep: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 12 },

  // ── Moon Phase ──
  moonCard: {
    borderRadius: 24, padding: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  moonCardContent:    { flexDirection: 'row', alignItems: 'center' },
  moonEmoji:          { fontSize: 36, marginRight: 16 },
  moonTextContainer:  { flex: 1 },
  moonPhaseName:      { color: '#FFF', fontWeight: '600', fontSize: 17 },
  moonPhaseMessage:   { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  moonSignRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  moonSignLabel:      { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginRight: 6 },
  moonSignValue:      { color: PALETTE.gold, fontWeight: '700', fontSize: 15 },
  moonWeekRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 16,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  moonWeekDay:        { alignItems: 'center', flex: 1 },
  moonWeekDayToday:   { opacity: 1 },
  moonWeekEmoji:      { fontSize: 22, marginBottom: 4 },
  moonWeekLabel:      { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  moonWeekLabelToday: { color: PALETTE.gold, fontWeight: '600' },

  // ── Retrograde Cards (Architectural Holds) ──
  retroCard: {
    padding: 20, borderRadius: 20, marginBottom: 12,
    backgroundColor: 'rgba(224, 176, 122, 0.05)',
    borderWidth: 1, borderColor: 'rgba(224, 176, 122, 0.15)',
  },
  retroHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  retroTitle:  { color: '#E8D6AE', fontSize: 14, fontWeight: '700', flex: 1 },
  retrogradeBadge: {
    backgroundColor: 'rgba(224, 176, 122, 0.15)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  retrogradeBadgeText: { fontSize: 11, fontWeight: '700', color: '#E8D6AE' },
  retroNote: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20 },

  // ── Narrative Bridge: Yesterday → Today ──
  yesterdayCard: {
    borderRadius: 20, padding: 16, borderWidth: 1,
    // Sheer glass border distinguishes it from the current day's active guidance
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  yesterdayHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  yesterdayLabel: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5, textTransform: 'uppercase', marginLeft: 6,
  },
  yesterdayText:      { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 20 },
  yesterdayHighlight: { color: PALETTE.gold, fontStyle: 'italic' },

  // ── Domain Guidance Cards ──
  guidanceCard: {
    borderRadius: 28, padding: 24, borderWidth: 1,
    borderColor: PALETTE.glassBorder, overflow: 'hidden',
  },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginLeft: 8 },
  cardHeadline: { fontSize: 20, fontWeight: '600', color: '#FFF', lineHeight: 28, letterSpacing: -0.3, marginBottom: 8 },
  cardMessage:  { fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 26 },
  cardTopGlow:  { position: 'absolute', top: 0, left: 20, right: 20, height: 1.5, opacity: 0.65 },
  strongestBadge: { marginLeft: 'auto' },
  strongestBadgeText: {
    fontSize: 8, fontWeight: '600', color: PALETTE.gold,
    letterSpacing: 0.2, textTransform: 'uppercase',
  },
  premiumExtra: {
    marginTop: 16, paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  premiumKeyInsight: { fontSize: 15, fontWeight: '600', color: PALETTE.gold, marginBottom: 4 },
  premiumAction:     { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },

  // ── Daily Affirmation ──
  affirmationCard: {
    borderRadius: 28, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(212,184,114,0.1)',
  },
  affirmationText: {
    color: PALETTE.gold, fontSize: 16, fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 24, textAlign: 'center',
  },
  affirmationSource: {
    color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 10,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },

  // ── Evening Reflection ──
  reminderCard: {
    borderRadius: 28, padding: 24, borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.18)', alignItems: 'center',
  },
  promptLabel: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16,
  },
  reminderText: {
    fontSize: 16, color: '#FFF', fontStyle: 'italic',
    textAlign: 'center', lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  journalButton:     { borderRadius: 16, overflow: 'hidden' },
  journalGradient:   {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 24,
  },
  journalButtonText: { fontSize: 15, color: PALETTE.gold, fontWeight: '600', marginLeft: 8 },

  // ── Active Patterns / Why This? ──
  whyThisCard: {
    borderRadius: 28, padding: 20, borderWidth: 1,
    borderColor: 'rgba(212,184,114,0.18)',
  },
  whyThisHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  whyThisLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  whyThisTitle:  { fontSize: 15, fontWeight: '600', color: PALETTE.gold },
  whyThisTeaser: {
    marginTop: 16, paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  teaserMore: { fontSize: 12, color: PALETTE.gold, fontStyle: 'italic', marginTop: 8 },
  whyThisContent: {
    marginTop: 20, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  timelineSection: { marginBottom: 20 },
  timelineRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  timelineLabel:   { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  timelineValue:   { fontSize: 14, color: '#FFF', fontWeight: '500' },
  cycleNote: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic', marginTop: 8, lineHeight: 20,
  },
  signalsSection:      { gap: 4 },
  signalsSectionTitle: {
    fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '600',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
  },
  signalRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  signalDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.gold },
  signalText: { flex: 1, color: 'rgba(255,255,255,0.65)', fontSize: 14 },
  signalOrb:  { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontVariant: ['tabular-nums'] },

  // ── Sacred Text Stack: ShadowQuote + Chiron vertically stacked ──
  sacredTextStack: {
    marginTop: 20, paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  resonanceSection: {
    marginTop: 16, paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  resonanceSectionSpaced: { marginTop: 8 },
  resonanceLabel: { fontSize: 13, fontWeight: '600', color: PALETTE.gold, marginBottom: 4 },
  resonanceText:  { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 19, fontStyle: 'italic' },
});
