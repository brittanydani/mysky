import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

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
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();
  
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [guidance, setGuidance] = useState<HumanDailyGuidance | null>(null);
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [savedInsight, setSavedInsight] = useState<SavedInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWhyThis, setShowWhyThis] = useState(false);
  const [shadowQuote, setShadowQuote] = useState<ShadowQuoteResult | null>(null);
  const [chartPatterns, setChartPatterns] = useState<ChartPatterns | null>(null);
  const [chironInsight, setChironInsight] = useState<ChironInsight | null>(null);
  const [nodeInsight, setNodeInsight] = useState<NodeInsight | null>(null);
  const [premiumGuidance, setPremiumGuidance] = useState<PremiumDailyGuidance | null>(null);

  useEffect(() => {
    loadTodayData();
  }, [isPremium]);

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

  return (
    <View style={styles.container}>
      <StarField starCount={30} />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 0 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting Header */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.date}>{formatDate(guidance.date)}</Text>
                <Text style={styles.greeting}>{guidance.greeting}</Text>
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

          {/* Love */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.section}
          >
            <LinearGradient
              colors={['rgba(224, 122, 152, 0.12)', 'rgba(224, 122, 152, 0.04)']}
              style={styles.guidanceCard}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="heart" size={18} color="#E07A98" />
                <Text style={[styles.cardLabel, { color: '#E07A98' }]}>LOVE</Text>
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

          {/* Energy */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(600)}
            style={styles.section}
          >
            <LinearGradient
              colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']}
              style={styles.guidanceCard}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="flash" size={18} color="#6EBF8B" />
                <Text style={[styles.cardLabel, { color: '#6EBF8B' }]}>ENERGY</Text>
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

          {/* Growth */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.section}
          >
            <LinearGradient
              colors={['rgba(139, 196, 232, 0.12)', 'rgba(139, 196, 232, 0.04)']}
              style={styles.guidanceCard}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="leaf" size={18} color="#8BC4E8" />
                <Text style={[styles.cardLabel, { color: '#8BC4E8' }]}>GROWTH</Text>
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

          {/* Premium: Emotional Weather */}
          {premiumEmotional && (
            <Animated.View
              entering={FadeInDown.delay(420).duration(600)}
              style={styles.section}
            >
              <LinearGradient
                colors={['rgba(122, 139, 224, 0.12)', 'rgba(122, 139, 224, 0.04)']}
                style={styles.guidanceCard}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name="water" size={18} color="#7A8BE0" />
                  <Text style={[styles.cardLabel, { color: '#7A8BE0' }]}>EMOTIONAL WEATHER</Text>
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

          {/* Shadow Quote — quiet, honest, never dominates */}
          {/* On heavy days: footer variant (soft, low-key). Otherwise: standalone card */}
          {shadowQuote && (
            <Animated.View
              entering={FadeInDown.delay(450).duration(600)}
              style={styles.section}
            >
              <ShadowQuoteCard
                quote={shadowQuote.quote}
                variant={shadowQuote.isHeavyDay ? 'footer' : 'standalone'}
                animationDelay={0}
              />
              {shadowQuote.activationReason && (
                <Text style={styles.shadowReason}>{shadowQuote.activationReason}</Text>
              )}
            </Animated.View>
          )}

          {/* Journal Prompt */}
          <Animated.View 
            entering={FadeInDown.delay(600).duration(600)}
            style={styles.section}
          >
            <View style={styles.promptSection}>
              <Text style={styles.promptLabel}>Today&apos;s reflection</Text>
              <Text style={styles.promptText}>{guidance.journalPrompt}</Text>
              
              <Pressable
                style={styles.journalButton}
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
            </View>
          </Animated.View>

          {/* Premium: Evening Reflection */}
          {premiumGuidance && (
            <Animated.View
              entering={FadeInDown.delay(620).duration(600)}
              style={styles.section}
            >
              <LinearGradient
                colors={['rgba(122, 139, 224, 0.1)', 'rgba(122, 139, 224, 0.04)']}
                style={styles.reminderCard}
              >
                <Text style={styles.promptLabel}>Evening reflection</Text>
                <Text style={styles.reminderText}>{premiumGuidance.eveningReflection}</Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Premium: Why This? + Timeline */}
          {isPremium && insight && (
            <Animated.View 
              entering={FadeInDown.delay(650).duration(600)}
              style={styles.section}
            >
              <Pressable onPress={toggleWhyThis}>
                <LinearGradient
                  colors={['rgba(201, 169, 98, 0.1)', 'rgba(201, 169, 98, 0.05)']}
                  style={styles.whyThisCard}
                >
                  <View style={styles.whyThisHeader}>
                    <View style={styles.whyThisLeft}>
                      <Ionicons name="telescope" size={18} color={theme.primary} />
                      <Text style={styles.whyThisTitle}>Why this insight?</Text>
                    </View>
                    <Ionicons 
                      name={showWhyThis ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={theme.textMuted} 
                    />
                  </View>
                  
                  {showWhyThis && (
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

                      {/* Shadow quote — under transit signals, quiet truth */}
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

          {/* Gentle premium nudge for free users */}
          {!isPremium && (
            <Animated.View 
              entering={FadeInDown.delay(650).duration(600)}
              style={styles.section}
            >
              <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                <LinearGradient
                  colors={['rgba(201, 169, 98, 0.12)', 'rgba(201, 169, 98, 0.06)']}
                  style={styles.upsellCard}
                >
                  <View style={styles.upsellContent}>
                    <Ionicons name="telescope" size={20} color={theme.primary} />
                    <View style={styles.upsellText}>
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
    marginBottom: theme.spacing.xl,
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
  guidanceCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
  // Premium guidance extras
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
  // Premium: Why This?
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
  // Premium resonance layers
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
  // Shadow quote under transit signals
  transitShadowContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  // Shadow quote activation reason
  shadowReason: {
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'center' as const,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  // Free user upsell
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
  upsellText: {
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
