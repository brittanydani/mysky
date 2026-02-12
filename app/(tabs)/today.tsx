import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import ShadowQuoteCard from '../../components/ui/ShadowQuoteCard';
import { localDb } from '../../services/storage/localDb';
import { NatalChart } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { HumanGuidanceGenerator, HumanDailyGuidance } from '../../services/astrology/humanGuidance';
import { DailyInsightEngine, DailyInsight } from '../../services/astrology/dailyInsightEngine';
import { InsightHistoryService, SavedInsight } from '../../services/storage/insightHistory';
import { ShadowQuoteEngine, ShadowQuoteResult } from '../../services/astrology/shadowQuotes';
import { detectChartPatterns, ChartPatterns } from '../../services/astrology/chartPatterns';
import { getChironInsightFromChart, ChironInsight } from '../../services/journal/chiron';
import { getNodeInsight, NodeInsight } from '../../services/journal/nodes';
import { PremiumDailyGuidanceGenerator, PremiumDailyGuidance } from '../../services/premium/premiumDailyGuidance';
import { DailyAffirmationEngine, DailyAffirmation } from '../../services/energy/dailyAffirmation';
import { TodayContentEngine, TodayContent } from '../../services/today/todayContentEngine';
import { getTransitInfo } from '../../services/astrology/transits';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';
import { getMoonPhaseInfo } from '../../utils/moonPhase';

// ── Moon phase (precise, via astronomy-engine) ──
function getMoonPhase(date: Date): { name: string; emoji: string; message: string } {
  const info = getMoonPhaseInfo(date);
  return { name: info.name, emoji: info.emoji, message: info.message };
}

// ── Intensity glow colors ──
const INTENSITY_COLORS: Record<string, string> = {
  calm: 'rgba(139, 196, 232, 0.08)',
  moderate: 'rgba(201, 169, 98, 0.10)',
  intense: 'rgba(224, 122, 152, 0.12)',
};

// ── Domain glow color for highlight ring ──
const DOMAIN_HIGHLIGHT: Record<string, string> = {
  love: 'rgba(224, 122, 152, 0.25)',
  energy: 'rgba(110, 191, 139, 0.25)',
  growth: 'rgba(139, 196, 232, 0.25)',
  focus: 'rgba(139, 196, 232, 0.25)',
  mood: 'rgba(122, 139, 224, 0.25)',
  direction: 'rgba(201, 169, 98, 0.25)',
  home: 'rgba(110, 191, 139, 0.25)',
};

// ── Retrograde context messages ──
const RETROGRADE_CONTEXT: Record<string, { icon: string; label: string; note: string }> = {
  Mercury: { icon: '☿', label: 'Mercury Retrograde', note: 'Communication, tech, and plans may need extra patience. Double-check details.' },
  Venus: { icon: '♀', label: 'Venus Retrograde', note: 'Relationships and values are under review. Old feelings may resurface.' },
  Mars: { icon: '♂', label: 'Mars Retrograde', note: 'Energy turns inward. Strategy over action. Avoid forcing outcomes.' },
  Jupiter: { icon: '♃', label: 'Jupiter Retrograde', note: 'Growth becomes internal. Revisit beliefs and what expansion means to you.' },
  Saturn: { icon: '♄', label: 'Saturn Retrograde', note: 'Review your structures and commitments. Rebuild what needs a stronger foundation.' },
};

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();
  
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

  useFocusEffect(
    useCallback(() => {
      loadTodayData();
    }, [isPremium])
  );

  const loadTodayData = async () => {
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
          houseSystem: savedChart.houseSystem
        };
        
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        chart.id = savedChart.id;
        chart.name = savedChart.name;
        chart.createdAt = savedChart.createdAt;
        chart.updatedAt = savedChart.updatedAt;
        
        setUserChart(chart);
        
        // Generate human-first daily guidance
        const dailyGuidance = HumanGuidanceGenerator.generateDailyGuidance(chart);
        setGuidance(dailyGuidance);
        
        // Get full insight with timeline (for premium features)
        const dailyInsight = DailyInsightEngine.generateDailyInsight(chart);
        setInsight(dailyInsight);

        // Detect retrograde transiting planets
        try {
          const transitInfo = getTransitInfo(
            new Date(),
            chart.birthData.latitude || 0,
            chart.birthData.longitude || 0,
          );
          setRetrogradePlanets(transitInfo.retrogrades);
        } catch (e) {
          logger.error('Failed to detect retrogrades:', e);
        }

        // Generate daily affirmation from chart + transits
        try {
          const affirmation = DailyAffirmationEngine.getAffirmation(chart, new Date());
          setDailyAffirmation(affirmation);
        } catch (e) {
          logger.error('Failed to generate daily affirmation:', e);
        }

        // Generate today's content from massive library (greetings, affirmations, reflections, cosmic weather)
        try {
          const content = await TodayContentEngine.generateTodayContent(
            chart,
            new Date(),
            dailyGuidance.intensity,
            dailyGuidance.dominantDomain,
            (dailyGuidance as any).retrogradePlanets?.length > 0,
          );
          setTodayContent(content);
        } catch (e) {
          logger.error('Failed to generate today content:', e);
        }

        // Generate today's shadow quote
        try {
          const shadow = await ShadowQuoteEngine.getDailyShadowQuote(chart);
          setShadowQuote(shadow);
        } catch (e) {
          logger.error('Failed to generate shadow quote:', e);
        }

        // Premium: generate stellium/chiron/node context + personalized guidance
        if (isPremium) {
          try {
            setChartPatterns(detectChartPatterns(chart));
            setChironInsight(getChironInsightFromChart(chart));
            setNodeInsight(getNodeInsight(chart));
            setPremiumGuidance(PremiumDailyGuidanceGenerator.generatePremiumGuidance(chart));
          } catch {
            // Non-critical premium context
          }
        }
        
        // Save to history and get saved record
        if (savedChart.id) {
          const saved = await InsightHistoryService.saveInsight(
            dailyGuidance,
            savedChart.id,
            dailyInsight.signals
          );
          setSavedInsight(saved);

          // Get yesterday's insight for continuity thread
          try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yStr = yesterday.toISOString().split('T')[0];
            const yInsight = await InsightHistoryService.getInsightByDate(yStr, savedChart.id);
            setYesterdayInsight(yInsight);
          } catch {
            // Not critical
          }
        }
      }
    } catch (error) {
      logger.error('Failed to load today data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = useCallback(async () => {
    if (!savedInsight) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newStatus = await InsightHistoryService.toggleFavorite(savedInsight.id);
    setSavedInsight(prev => prev ? { ...prev, isFavorite: newStatus } : null);
  }, [savedInsight]);

  const toggleWhyThis = useCallback(async () => {
    await Haptics.selectionAsync();
    setShowWhyThis(prev => !prev);
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={40} />
        <Text style={styles.loadingText}>Reading the stars for you...</Text>
      </View>
    );
  }

  if (!userChart || !guidance) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={40} />
        <Text style={styles.emptyTitle}>Your daily guidance awaits</Text>
        <Text style={styles.loadingText}>Create your chart to receive personalized cosmic insights</Text>
        <Pressable
          style={styles.createChartButton}
          onPress={() => router.push('/' as Href)}
        >
          <Text style={styles.createChartText}>Get Started</Text>
        </Pressable>
      </View>
    );
  }

  // Cache premium category lookups to avoid repeated .find() calls
  const premiumLove = premiumGuidance?.categories.find(c => c.category === 'love');
  const premiumEnergy = premiumGuidance?.categories.find(c => c.category === 'energy');
  const premiumWork = premiumGuidance?.categories.find(c => c.category === 'work');
  const premiumEmotional = premiumGuidance?.categories.find(c => c.category === 'emotional');

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Determine which card is most intense (for visual highlight ring)
  const dominantDomain = guidance.dominantDomain || 'mood';
  const intensity = guidance.intensity || 'calm';

  // Relevant retrogrades (Mercury through Saturn are most noticeable)
  const notableRetrogrades = retrogradePlanets.filter(p => RETROGRADE_CONTEXT[p]);

  return (
    <View style={styles.container}>
      <StarField starCount={30} />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Greeting Header ── */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.date}>{formatDate(guidance.date)}</Text>
                <Text style={styles.greeting}>{todayContent?.greeting || guidance.greeting}</Text>
              </View>
              {/* Favorite button (premium) */}
              {isPremium && savedInsight && (
                <Pressable onPress={toggleFavorite} hitSlop={12} style={styles.favoriteButton}>
                  <Ionicons 
                    name={savedInsight.isFavorite ? 'heart' : 'heart-outline'} 
                    size={24} 
                    color={savedInsight.isFavorite ? theme.love : theme.textMuted} 
                  />
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* ── 1. Cosmic Weather Summary ── */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(600)}
            style={styles.section}
          >
            <LinearGradient
              colors={[INTENSITY_COLORS[intensity] || INTENSITY_COLORS.calm, 'rgba(26, 39, 64, 0.4)']}
              style={styles.cosmicWeatherCard}
            >
              <View style={styles.cosmicWeatherHeader}>
                <Ionicons name="partly-sunny" size={20} color={theme.primary} />
                <Text style={styles.cosmicWeatherLabel}>COSMIC WEATHER</Text>
              </View>
              <Text style={styles.cosmicWeatherText}>{todayContent?.cosmicWeather || guidance.cosmicWeather}</Text>

              {/* Intensity indicator */}
              <View style={styles.intensityRow}>
                <View style={[styles.intensityDot, { backgroundColor: intensity === 'calm' ? theme.growth : intensity === 'moderate' ? theme.primary : theme.love }]} />
                <Text style={styles.intensityText}>
                  {intensity === 'calm' ? 'Gentle day' : intensity === 'moderate' ? 'Active energy' : 'High intensity'}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── 2. Moon Phase + Sign ── */}
          <Animated.View entering={FadeInDown.delay(180).duration(600)}>
            <Pressable
              style={styles.section}
              onPress={() => setShowMoonWeek(prev => !prev)}
            >
              <LinearGradient
                colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.5)']}
                style={styles.moonPhaseCard}
              >
                <View style={styles.moonPhaseContent}>
                  <Text style={styles.moonEmoji}>{guidance.moonPhaseEmoji || '🌙'}</Text>
                  <View style={styles.moonPhaseTextContainer}>
                    <Text style={styles.moonPhaseName}>{guidance.moonPhase || 'Moon Phase'}</Text>
                    <Text style={styles.moonPhaseMessage}>{guidance.moonPhaseMessage || ''}</Text>
                  </View>
                  <Ionicons name={showMoonWeek ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textMuted} />
                </View>

                {/* Moon sign */}
                {guidance.moonSign && (
                  <View style={styles.moonSignRow}>
                    <Text style={styles.moonSignLabel}>Moon in</Text>
                    <Text style={styles.moonSignValue}>{guidance.moonSign}</Text>
                  </View>
                )}

                {/* Weekly moon phases (expandable) */}
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

          {/* ── 3. Retrograde Awareness Banner ── */}
          {notableRetrogrades.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(190).duration(600)}
              style={styles.section}
            >
              {notableRetrogrades.map((planet) => {
                const ctx = RETROGRADE_CONTEXT[planet];
                return (
                  <LinearGradient
                    key={planet}
                    colors={['rgba(224, 176, 122, 0.10)', 'rgba(224, 176, 122, 0.04)']}
                    style={styles.retrogradeBanner}
                  >
                    <View style={styles.retrogradeHeader}>
                      <Text style={styles.retrogradeIcon}>{ctx.icon}</Text>
                      <Text style={styles.retrogradeLabel}>{ctx.label}</Text>
                      <View style={styles.retrogradeBadge}>
                        <Text style={styles.retrogradeBadgeText}>℞</Text>
                      </View>
                    </View>
                    <Text style={styles.retrogradeNote}>{ctx.note}</Text>
                  </LinearGradient>
                );
              })}
            </Animated.View>
          )}

          {/* ── 4. Yesterday → Today Thread ── */}
          {yesterdayInsight && (
            <Animated.View
              entering={FadeInDown.delay(195).duration(600)}
              style={styles.section}
            >
              <LinearGradient
                colors={['rgba(30, 45, 71, 0.5)', 'rgba(26, 39, 64, 0.3)']}
                style={styles.yesterdayCard}
              >
                <View style={styles.yesterdayHeader}>
                  <Ionicons name="arrow-forward" size={14} color={theme.textMuted} />
                  <Text style={styles.yesterdayLabel}>Building on yesterday</Text>
                </View>
                <Text style={styles.yesterdayText}>
                  Yesterday&apos;s theme was <Text style={styles.yesterdayHighlight}>{yesterdayInsight.loveHeadline?.toLowerCase() || 'reflection'}</Text> — today builds on that energy.
                </Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── 5. Love Card ── */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.section}
          >
            <LinearGradient
              colors={['rgba(224, 122, 152, 0.12)', 'rgba(224, 122, 152, 0.04)']}
              style={[
                styles.guidanceCard,
                dominantDomain === 'love' && styles.guidanceCardHighlight,
                dominantDomain === 'love' && { borderColor: DOMAIN_HIGHLIGHT.love },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="heart" size={18} color="#E07A98" />
                <Text style={[styles.cardLabel, { color: '#E07A98' }]}>LOVE</Text>
                {dominantDomain === 'love' && (
                  <View style={styles.strongestBadge}>
                    <Text style={styles.strongestBadgeText}>strongest today</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardHeadline}>{guidance.love.headline}</Text>
              <Text style={styles.cardMessage}>{guidance.love.message}</Text>
              {premiumLove && (
                <View style={styles.premiumExtra}>
                  <Text style={styles.premiumKeyInsight}>{premiumLove.keyInsight}</Text>
                  <Text style={styles.premiumAction}>{premiumLove.actionSuggestion}</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── 6. Energy Card ── */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(600)}
            style={styles.section}
          >
            <LinearGradient
              colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']}
              style={[
                styles.guidanceCard,
                dominantDomain === 'energy' && styles.guidanceCardHighlight,
                dominantDomain === 'energy' && { borderColor: DOMAIN_HIGHLIGHT.energy },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="flash" size={18} color="#6EBF8B" />
                <Text style={[styles.cardLabel, { color: '#6EBF8B' }]}>ENERGY</Text>
                {dominantDomain === 'energy' && (
                  <View style={styles.strongestBadge}>
                    <Text style={styles.strongestBadgeText}>strongest today</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardHeadline}>{guidance.energy.headline}</Text>
              <Text style={styles.cardMessage}>{guidance.energy.message}</Text>
              {premiumEnergy && (
                <View style={styles.premiumExtra}>
                  <Text style={styles.premiumKeyInsight}>{premiumEnergy.keyInsight}</Text>
                  <Text style={styles.premiumAction}>{premiumEnergy.actionSuggestion}</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── 7. Growth Card ── */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.section}
          >
            <LinearGradient
              colors={['rgba(139, 196, 232, 0.12)', 'rgba(139, 196, 232, 0.04)']}
              style={[
                styles.guidanceCard,
                (dominantDomain === 'growth' || dominantDomain === 'focus' || dominantDomain === 'direction') && styles.guidanceCardHighlight,
                (dominantDomain === 'growth' || dominantDomain === 'focus' || dominantDomain === 'direction') && { borderColor: DOMAIN_HIGHLIGHT.growth },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="leaf" size={18} color="#8BC4E8" />
                <Text style={[styles.cardLabel, { color: '#8BC4E8' }]}>GROWTH</Text>
                {(dominantDomain === 'growth' || dominantDomain === 'focus' || dominantDomain === 'direction') && (
                  <View style={styles.strongestBadge}>
                    <Text style={styles.strongestBadgeText}>strongest today</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardHeadline}>{guidance.growth.headline}</Text>
              <Text style={styles.cardMessage}>{guidance.growth.message}</Text>
              {premiumWork && (
                <View style={styles.premiumExtra}>
                  <Text style={styles.premiumKeyInsight}>{premiumWork.keyInsight}</Text>
                  <Text style={styles.premiumAction}>{premiumWork.actionSuggestion}</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── 8. Premium: Emotional Weather ── */}
          {premiumEmotional && (
            <Animated.View
              entering={FadeInDown.delay(420).duration(600)}
              style={styles.section}
            >
              <LinearGradient
                colors={['rgba(122, 139, 224, 0.12)', 'rgba(122, 139, 224, 0.04)']}
                style={[
                  styles.guidanceCard,
                  dominantDomain === 'mood' && styles.guidanceCardHighlight,
                  dominantDomain === 'mood' && { borderColor: DOMAIN_HIGHLIGHT.mood },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name="water" size={18} color="#7A8BE0" />
                  <Text style={[styles.cardLabel, { color: '#7A8BE0' }]}>EMOTIONAL WEATHER</Text>
                  {dominantDomain === 'mood' && (
                    <View style={styles.strongestBadge}>
                      <Text style={styles.strongestBadgeText}>strongest today</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardHeadline}>
                  {premiumEmotional.keyInsight}
                </Text>
                <Text style={styles.cardMessage}>
                  {premiumEmotional.guidance}
                </Text>
                <View style={styles.premiumExtra}>
                  <Text style={styles.premiumAction}>
                    {premiumEmotional.actionSuggestion}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── 9. Daily Affirmation Card ── */}
          <Animated.View
            entering={FadeInDown.delay(440).duration(600)}
            style={styles.section}
          >
            <LinearGradient
              colors={['rgba(30,45,71,0.6)', 'rgba(26,39,64,0.35)']}
              style={styles.affirmationCard}
            >
              <Ionicons name="sparkles" size={18} color={theme.primary} style={{ marginBottom: 8 }} />
              <Text style={styles.affirmationText}>&ldquo;{todayContent?.affirmation || dailyAffirmation?.text || 'I trust my own timing.'}&rdquo;</Text>
              <Text style={styles.affirmationSource}>{todayContent?.affirmationSource || dailyAffirmation?.source || ''}</Text>
            </LinearGradient>
          </Animated.View>

          {/* ── 12. Premium: Evening Reflection ── */}
          {premiumGuidance && (
            <Animated.View
              entering={FadeInDown.delay(520).duration(600)}
              style={styles.section}
            >
              <LinearGradient
                colors={['rgba(122, 139, 224, 0.1)', 'rgba(122, 139, 224, 0.04)']}
                style={styles.reminderCard}
              >
                <Text style={styles.promptLabel}>Evening reflection</Text>
                <Text style={styles.reminderText}>{premiumGuidance.eveningReflection}</Text>
                
                <Pressable
                  style={[styles.journalButton, { marginTop: 16 }]}
                  onPress={() => router.push('/(tabs)/journal' as Href)}
                >
                  <LinearGradient
                    colors={['rgba(201, 169, 98, 0.2)', 'rgba(201, 169, 98, 0.1)']}
                    style={styles.journalGradient}
                  >
                    <Ionicons name="create-outline" size={18} color={theme.primary} />
                    <Text style={styles.journalButtonText}>Write in Journal</Text>
                  </LinearGradient>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── 13. Why This? (Premium: full, Free: teaser with first signal) ── */}
          {insight && (
            <Animated.View 
              entering={FadeInDown.delay(550).duration(600)}
              style={styles.section}
            >
              <Pressable onPress={isPremium ? toggleWhyThis : () => router.push('/(tabs)/premium' as Href)}>
                <LinearGradient
                  colors={['rgba(201, 169, 98, 0.1)', 'rgba(201, 169, 98, 0.05)']}
                  style={styles.whyThisCard}
                >
                  <View style={styles.whyThisHeader}>
                    <View style={styles.whyThisLeft}>
                      <Ionicons name="telescope" size={18} color={theme.primary} />
                      <Text style={styles.whyThisTitle}>Why this insight?</Text>
                    </View>
                    {isPremium ? (
                      <Ionicons 
                        name={showWhyThis ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={theme.textMuted} 
                      />
                    ) : (
                      <Ionicons name="lock-closed" size={16} color={theme.textMuted} />
                    )}
                  </View>

                  {/* Free users: show teaser (first signal) */}
                  {!isPremium && insight.signals.length > 0 && (
                    <View style={styles.whyThisTeaser}>
                      <View style={styles.signalRow}>
                        <View style={styles.signalDot} />
                        <Text style={styles.signalText}>{insight.signals[0].description}</Text>
                        <Text style={styles.signalOrb}>{insight.signals[0].orb}</Text>
                      </View>
                      {insight.signals.length > 1 && (
                        <Text style={styles.teaserMore}>
                          + {insight.signals.length - 1} more transit{insight.signals.length > 2 ? 's' : ''} shaping your day
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {/* Premium users: full expanded view */}
                  {isPremium && showWhyThis && (
                    <View style={styles.whyThisContent}>
                      {/* Timeline */}
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
                            <Text style={styles.cycleNote}>{insight.timeline.longerCycleNote}</Text>
                          )}
                        </View>
                      )}
                      
                      {/* Signals */}
                      <View style={styles.signalsSection}>
                        <Text style={styles.signalsSectionTitle}>Active transits:</Text>
                        {insight.signals.map((signal, index) => (
                          <View key={index} style={styles.signalRow}>
                            <View style={styles.signalDot} />
                            <Text style={styles.signalText}>{signal.description}</Text>
                            <Text style={styles.signalOrb}>{signal.orb}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Shadow quote — under transit signals */}
                      {shadowQuote && (
                        <View style={styles.transitShadowContainer}>
                          <ShadowQuoteCard
                            quote={shadowQuote.quote}
                            variant="inline"
                            animationDelay={200}
                          />
                        </View>
                      )}

                      {/* Stellium resonance */}
                      {chartPatterns && chartPatterns.stelliums.length > 0 && (
                        <View style={styles.resonanceSection}>
                          <Text style={styles.resonanceLabel}>Why this might feel familiar</Text>
                          <Text style={styles.resonanceText}>
                            You have a concentration in {chartPatterns.stelliums[0].label} — themes in this area tend to hit with extra weight.
                          </Text>
                        </View>
                      )}

                      {/* Chiron sensitivity */}
                      {chironInsight && (
                        <View style={styles.resonanceSection}>
                          <Text style={styles.resonanceLabel}>🪐 Sensitivity note</Text>
                          <Text style={styles.resonanceText}>
                            {chironInsight.theme} This may add an extra layer of feeling today.
                          </Text>
                        </View>
                      )}

                      {/* Node growth frame */}
                      {nodeInsight && (
                        <View style={styles.resonanceSection}>
                          <Text style={styles.resonanceLabel}>🧭 Growth frame</Text>
                          <Text style={styles.resonanceText}>{nodeInsight.fusionLine}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* ── 14. Gentle premium nudge for free users ── */}
          {!isPremium && (
            <Animated.View 
              entering={FadeInDown.delay(600).duration(600)}
              style={styles.section}
            >
              <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                <LinearGradient
                  colors={['rgba(201, 169, 98, 0.12)', 'rgba(201, 169, 98, 0.06)']}
                  style={styles.upsellCard}
                >
                  <View style={styles.upsellContent}>
                    <Ionicons name="telescope" size={20} color={theme.primary} />
                    <View style={styles.upsellTextContainer}>
                      <Text style={styles.upsellTitle}>See how this evolves over time</Text>
                      <Text style={styles.upsellDescription}>
                        Exact transits, timing, and the patterns behind your daily insights
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.primary} />
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  createChartButton: {
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  createChartText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 16,
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
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  favoriteButton: {
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  date: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  greeting: {
    fontSize: 22,
    color: theme.textPrimary,
    fontFamily: 'serif',
    lineHeight: 30,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },

  // ── Cosmic Weather Summary ──
  cosmicWeatherCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.15)',
  },
  cosmicWeatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cosmicWeatherLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.primary,
    marginLeft: theme.spacing.sm,
  },
  cosmicWeatherText: {
    fontSize: 16,
    color: theme.textPrimary,
    lineHeight: 24,
    fontFamily: 'serif',
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  intensityText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── Moon Phase ──
  moonPhaseCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  moonPhaseContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moonEmoji: {
    fontSize: 36,
    marginRight: theme.spacing.md,
  },
  moonPhaseTextContainer: {
    flex: 1,
  },
  moonPhaseName: {
    color: theme.textPrimary,
    fontWeight: '600',
    fontSize: 17,
  },
  moonPhaseMessage: {
    color: theme.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 2,
  },
  moonSignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  moonSignLabel: {
    color: theme.textMuted,
    fontSize: 13,
    marginRight: 6,
  },
  moonSignValue: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  moonWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  moonWeekDay: {
    alignItems: 'center',
    flex: 1,
  },
  moonWeekDayToday: {
    opacity: 1,
  },
  moonWeekEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  moonWeekLabel: {
    fontSize: 11,
    color: theme.textMuted,
  },
  moonWeekLabelToday: {
    color: theme.primary,
    fontWeight: '600',
  },

  // ── Retrograde Banner ──
  retrogradeBanner: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(224, 176, 122, 0.15)',
    marginBottom: theme.spacing.sm,
  },
  retrogradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  retrogradeIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  retrogradeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.warning,
    flex: 1,
  },
  retrogradeBadge: {
    backgroundColor: 'rgba(224, 176, 122, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  retrogradeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.warning,
  },
  retrogradeNote: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 19,
  },

  // ── Yesterday Thread ──
  yesterdayCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  yesterdayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  yesterdayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: theme.spacing.xs,
  },
  yesterdayText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  yesterdayHighlight: {
    color: theme.primary,
    fontStyle: 'italic',
  },

  // ── Guidance Cards ──
  guidanceCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  guidanceCardHighlight: {
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginLeft: theme.spacing.sm,
  },
  strongestBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  strongestBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: theme.primary,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  cardHeadline: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.sm,
  },
  cardMessage: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  premiumExtra: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  premiumKeyInsight: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  premiumAction: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 19,
  },

  // ── Daily Affirmation ──
  affirmationCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.1)',
  },
  affirmationText: {
    color: theme.primary,
    fontSize: 16,
    fontStyle: 'italic' as const,
    fontFamily: 'serif',
    lineHeight: 24,
    textAlign: 'center' as const,
  },
  affirmationSource: {
    color: theme.textMuted,
    fontSize: 11,
    marginTop: theme.spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  mantraRow: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  mantraText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Shadow Quote ──
  shadowReason: {
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'center' as const,
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // ── Journal Prompt ──
  promptSection: {
    backgroundColor: 'rgba(30, 45, 71, 0.5)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
  },
  promptText: {
    fontSize: 18,
    color: theme.textPrimary,
    fontStyle: 'italic',
    lineHeight: 28,
    fontFamily: 'serif',
    marginBottom: theme.spacing.lg,
  },
  journalButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  journalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  journalButtonText: {
    fontSize: 15,
    color: theme.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  // ── Evening Reflection ──
  reminderCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.2)',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: 16,
    color: theme.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'serif',
  },

  // ── Why This? ──
  whyThisCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.2)',
  },
  whyThisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whyThisLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  whyThisTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.primary,
  },
  whyThisTeaser: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  teaserMore: {
    fontSize: 12,
    color: theme.primary,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  whyThisContent: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  timelineSection: {
    marginBottom: theme.spacing.lg,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  timelineLabel: {
    fontSize: 14,
    color: theme.textMuted,
  },
  timelineValue: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  cycleNote: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  signalsSection: {
    gap: theme.spacing.sm,
  },
  signalsSectionTitle: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
  },
  signalText: {
    flex: 1,
    fontSize: 13,
    color: theme.textSecondary,
  },
  signalOrb: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'monospace',
  },
  resonanceSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  resonanceLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: theme.textGold,
    marginBottom: 4,
  },
  resonanceText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
  transitShadowContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },

  // ── Free user upsell ──
  upsellCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.15)',
  },
  upsellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  upsellTextContainer: {
    flex: 1,
  },
  upsellTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  upsellDescription: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
});
