import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import PremiumRequiredScreen from '../../components/PremiumRequiredScreen';
import { localDb } from '../../services/storage/localDb';
import { JournalEntry, generateId } from '../../services/storage/models';
import JournalEntryModal from '../../components/JournalEntryModal';
import { AdvancedJournalAnalyzer, PatternInsight, JournalEntryMeta, MoodLevel, TransitSnapshot } from '../../services/premium/advancedJournal';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';
import { CheckInService } from '../../services/patterns/checkInService';
import { DailyCheckIn } from '../../services/patterns/types';
import CheckInTrendGraph from '../../components/ui/CheckInTrendGraph';
import { analyzeJournalContent } from '../../services/journal/nlp';

const { width } = Dimensions.get('window');


export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();

  const [showPremiumRequired, setShowPremiumRequired] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>(undefined);

  const [patternInsights, setPatternInsights] = useState<PatternInsight[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedEntryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useFocusEffect(
    useCallback(() => {
      void loadEntries();
      void loadCheckIns();
    }, [])
  );

  useEffect(() => {
    if (entries.length >= 3) generatePatternInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, isPremium]);

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const moodToLevel = (mood: string): MoodLevel => {
    const map: Record<string, MoodLevel> = {
      calm: 5,
      soft: 4,
      okay: 3,
      heavy: 2,
      stormy: 1,
    };
    return map[mood] ?? 3;
  };

  const generatePatternInsights = () => {
    try {
      const entryMetas: JournalEntryMeta[] = entries.map((e) => {
        let transitSnapshot: TransitSnapshot | undefined;
        if (e.transitSnapshot) {
          try { transitSnapshot = JSON.parse(e.transitSnapshot); } catch {}
        }
        return {
          id: e.id,
          date: e.date,
          mood: { overall: moodToLevel(e.mood) },
          tags: [],
          wordCount: (e.content || '').trim().split(/\s+/).filter(Boolean).length,
          transitSnapshot,
        };
      });

      const insights = AdvancedJournalAnalyzer.analyzePatterns(entryMetas, isPremium);
      setPatternInsights(insights);
    } catch (e) {
      logger.error('[Journal] Pattern analysis failed:', e);
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const journalEntries = await localDb.getJournalEntries();
      const sorted = [...journalEntries].sort((a, b) => {
        if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
        return b.date.localeCompare(a.date);
      });
      setEntries(sorted);
    } catch (error) {
      logger.error('Failed to load journal entries:', error);
      Alert.alert('Error', 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load recent check-ins for the journal view.
   * Uses the primary chart ID to fetch the last 7 check-ins.
   */
  const loadCheckIns = async () => {
    try {
      const charts = await localDb.getCharts();
      const primaryChart = charts[0];
      if (!primaryChart) {
        setCheckIns([]);
        return;
      }
      const result = await CheckInService.getAllCheckIns(primaryChart.id, 7);
      setCheckIns(Array.isArray(result) ? result : []);
    } catch (error) {
      logger.error('Failed to load check-ins:', error);
      setCheckIns([]);
    }
  };

  const handleAddEntry = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setEditingEntry(undefined);
    setShowEntryModal(true);
  };

  const handleEditEntry = async (entry: JournalEntry) => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    setEditingEntry(entry);
    setShowEntryModal(true);
  };

  const handleSaveEntry = async (data: Partial<JournalEntry>) => {
    try {
      const nowIso = new Date().toISOString();

      // Run NLP analysis on plaintext content before encryption
      const contentText = data.content ?? editingEntry?.content ?? '';
      const nlp = analyzeJournalContent(contentText);
      const nlpFields = {
        contentKeywords: JSON.stringify(nlp.keywords),
        contentEmotions: JSON.stringify(nlp.emotions),
        contentSentiment: JSON.stringify(nlp.sentiment),
        contentWordCount: nlp.wordCount,
        contentReadingMinutes: nlp.readingMinutes,
      };

      if (editingEntry?.id) {
        const updated: JournalEntry = {
          ...editingEntry,
          ...data,
          ...nlpFields,
          id: editingEntry.id,
          createdAt: editingEntry.createdAt ?? nowIso,
          updatedAt: nowIso,
          date: (data.date ?? editingEntry.date) as string,
          chartId: data.chartId ?? editingEntry.chartId,
          transitSnapshot: data.transitSnapshot ?? editingEntry.transitSnapshot,
        } as JournalEntry;

        await localDb.updateJournalEntry(updated);
      } else {
        const created: JournalEntry = {
          id: generateId(),
          title: data.title ?? '',
          content: data.content ?? '',
          mood: (data.mood ?? 'okay') as any,
          moonPhase: (data.moonPhase ?? 'new') as any,
          date: (data.date ?? parseLocalDate(nowIso).toISOString().slice(0, 10)) as any,
          createdAt: nowIso,
          updatedAt: nowIso,
          isDeleted: false,
          chartId: data.chartId,
          transitSnapshot: data.transitSnapshot,
          ...nlpFields,
        } as JournalEntry;

        await localDb.addJournalEntry(created);
      }

      setShowEntryModal(false);
      setEditingEntry(undefined);
      await loadEntries();
    } catch (error) {
      logger.error('Failed to save journal entry:', error);
      Alert.alert('Error', 'Failed to save entry');
    }
  };

  const handleDeleteEntry = async (entry: JournalEntry) => {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await localDb.deleteJournalEntry(entry.id);
            await loadEntries();
          } catch (error) {
            logger.error('Failed to delete journal entry:', error);
            Alert.alert('Error', 'Failed to delete entry');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StarField starCount={25} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {showPremiumRequired ? (
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
            <PremiumRequiredScreen />
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.title}>Journal</Text>
                  <Text style={styles.subtitle}>Your inner landscape</Text>
                </View>
              </View>

              <Text style={styles.poeticIntro}>
                This is a space for your unfiltered truth. No one sees this but you. Let the words come without judgment.
              </Text>
            </Animated.View>

            {checkIns.length >= 2 && (
              isPremium ? (
                <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.checkInTrendSection}>
                  <Text style={styles.chartTitle}>7-Day Check-In Trends</Text>
                  <Text style={styles.checkInTrendSubtitle}>From your energy check-ins</Text>
                  <CheckInTrendGraph checkIns={checkIns} width={width - 32} />
                </Animated.View>
              ) : (
                <Pressable onPress={() => setShowPremiumRequired(true)}>
                  <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.checkInTrendSection}>
                    <Text style={styles.chartTitle}>7-Day Check-In Trends</Text>
                    <View style={styles.lockBox}>
                      <Ionicons name="lock-closed" size={32} color={theme.primary} />
                      <Text style={styles.lockTitle}>Premium Feature</Text>
                      <Text style={styles.lockSubtitle}>Unlock to see your 7-day check-in trends</Text>
                    </View>
                  </Animated.View>
                </Pressable>
              )
            )}

            {isPremium && patternInsights.length > 0 && (
              <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.insightsSection}>
                <Text style={styles.insightsTitle}>Pattern Insights</Text>
                <Text style={styles.insightsSubtitle}>What your journal reveals over time</Text>

                {patternInsights.map((insight, idx) => (
                  <LinearGradient
                    key={`${insight.title}-${idx}`}
                    colors={
                      insight.type === 'transit_correlation'
                        ? ['rgba(61, 41, 82, 0.18)', 'rgba(61, 41, 82, 0.06)']
                        : ['rgba(201, 169, 98, 0.12)', 'rgba(201, 169, 98, 0.05)']
                    }
                    style={styles.insightCard}
                  >
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightTitle}>{insight.title}</Text>
                      <View
                        style={[
                          styles.confidenceBadge,
                          insight.confidence === 'strong' && styles.confidenceStrong,
                          insight.confidence === 'suggested' && styles.confidenceSuggested,
                        ]}
                      >
                        <Text style={styles.confidenceText}>{insight.confidence}</Text>
                      </View>
                    </View>

                    <Text style={styles.insightDescription}>{insight.description}</Text>
                    {!!insight.evidence && <Text style={styles.insightEvidence}>{insight.evidence}</Text>}
                    {!!insight.actionable && <Text style={styles.insightActionable}>{insight.actionable}</Text>}
                  </LinearGradient>
                ))}
              </Animated.View>
            )}

            {!isPremium && entries.length >= 5 && (
              <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.insightsSection}>
                <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                  <LinearGradient
                    colors={['rgba(201, 169, 98, 0.1)', 'rgba(201, 169, 98, 0.04)']}
                    style={styles.insightCard}
                  >
                    <Text style={styles.insightTitle}>✨ You have {entries.length} entries</Text>
                    <Text style={styles.insightDescription}>
                      Deeper Sky can reveal the patterns behind your emotional experiences — like which energy cycles lift
                      your mood and which ones tend to challenge you.
                    </Text>
                    <Text style={styles.insightActionable}>See your patterns →</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.entriesSection}>
              <View style={styles.entriesHeader}>
                <Text style={styles.sectionTitle}>Recent Entries</Text>
                <Text style={styles.entriesCount}>{entries.length} entries</Text>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading entries...</Text>
                </View>
              ) : entries.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="book-outline" size={48} color={theme.textMuted} />
                  <Text style={styles.emptyTitle}>Start Your Journey</Text>
                  <Text style={styles.emptyDescription}>Begin tracking your emotional patterns and personal insights</Text>
                </View>
              ) : (
                entries.map((entry, index) => {
                  const isExpanded = expandedEntryIds.has(entry.id);
                  return (
                    <Animated.View key={entry.id} entering={FadeInDown.delay(400 + index * 50).duration(600)}>
                      <Pressable
                        style={styles.entryCard}
                        onPress={() => void handleEditEntry(entry)}
                        onLongPress={() => void handleDeleteEntry(entry)}
                      >
                        <LinearGradient
                          colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                          style={styles.entryGradient}
                        >
                          <View style={styles.entryHeader}>
                            <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                            <Text style={styles.entryTime}>{formatTime(entry.createdAt)}</Text>
                          </View>

                          {!!entry.title && (
                            <Text style={styles.entryTitle} numberOfLines={1}>
                              {entry.title}
                            </Text>
                          )}

                          <Text style={styles.entryContent} numberOfLines={isExpanded ? undefined : 3}>
                            {entry.content}
                          </Text>

                          <Pressable
                            style={styles.expandButton}
                            onPress={() => toggleExpanded(entry.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color="rgba(255,255,255,0.3)"
                            />
                          </Pressable>
                        </LinearGradient>
                      </Pressable>
                    </Animated.View>
                  );
                })
              )}
            </Animated.View>
          </ScrollView>
        )}

        {!showPremiumRequired && (
          <Animated.View
            entering={FadeInDown.delay(600).duration(600)}
            style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}
          >
            <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} onPress={() => void handleAddEntry()}>
              <LinearGradient colors={[...theme.goldGradient]} style={styles.fabGradient}>
                <Ionicons name="add" size={24} color="#1A1A1A" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        <JournalEntryModal
          visible={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          onSave={handleSaveEntry}
          initialData={editingEntry}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },

  header: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 32, fontWeight: '700', color: theme.textPrimary, fontFamily: 'serif', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: theme.primary, fontStyle: 'italic', marginTop: 2 },
  poeticIntro: {
    fontSize: 15,
    color: theme.textSecondary,
    fontStyle: 'italic',
    lineHeight: 24,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },

  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  checkInTrendSection: { marginBottom: theme.spacing.xl },
  checkInTrendSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },

  lockBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  lockTitle: { color: theme.primary, marginTop: 8, fontWeight: '600' },
  lockSubtitle: { color: theme.textSecondary, fontSize: 13, marginTop: 2 },

  insightsSection: { marginBottom: theme.spacing.xl, paddingHorizontal: theme.spacing.lg },
  insightsTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif', marginBottom: 2 },
  insightsSubtitle: { fontSize: 13, color: theme.textMuted, fontStyle: 'italic', marginBottom: theme.spacing.md },

  insightCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.15)',
    marginBottom: theme.spacing.md,
  },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  insightTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, flex: 1 },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginLeft: theme.spacing.sm },
  confidenceStrong: { backgroundColor: 'rgba(110, 191, 139, 0.2)' },
  confidenceSuggested: { backgroundColor: 'rgba(201, 169, 98, 0.15)' },
  confidenceText: { fontSize: 10, color: theme.textMuted, textTransform: 'capitalize', fontWeight: '500' },
  insightDescription: { fontSize: 14, color: theme.textSecondary, lineHeight: 21, marginBottom: theme.spacing.sm },
  insightEvidence: { fontSize: 12, color: theme.textMuted, fontStyle: 'italic', marginBottom: theme.spacing.xs },
  insightActionable: { fontSize: 13, color: theme.primary, fontStyle: 'italic', marginTop: theme.spacing.xs },

  entriesSection: { marginBottom: theme.spacing.xl, paddingHorizontal: theme.spacing.lg },
  entriesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif' },
  entriesCount: { fontSize: 14, color: theme.textMuted },

  loadingContainer: { padding: theme.spacing.xl, alignItems: 'center' },
  loadingText: { fontSize: 16, color: theme.textMuted },

  emptyContainer: { padding: theme.spacing.xl, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif', marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  emptyDescription: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 },

  entryCard: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.cardBorder, marginBottom: theme.spacing.md },
  entryGradient: { padding: theme.spacing.lg },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  entryDate: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  entryTime: { fontSize: 12, color: theme.textMuted },

  entryTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: theme.spacing.sm },
  entryContent: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  expandButton: { alignItems: 'center', marginTop: theme.spacing.sm },

  fabContainer: { position: 'absolute', right: theme.spacing.lg, zIndex: 1000 },
  fab: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', ...theme.shadows.glow },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.95 }] },
  fabGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
});
