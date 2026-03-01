/**
 * Sleep Tab — Rest tracking & dream journal
 *
 * Log nightly sleep quality (1–5 moons), duration, and dream journal.
 * Dream text is encrypted at rest via FieldEncryptionService.
 * Completely astrology-free.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { useRouter, Href } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import { localDb } from '../../services/storage/localDb';
import { SleepEntry, JournalEntry, generateId } from '../../services/storage/models';
import { logger } from '../../utils/logger';
import { usePremium } from '../../context/PremiumContext';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { NatalChart } from '../../services/astrology/types';
import { DailyCheckIn } from '../../services/patterns/types';
import {
  generateDreamInterpretation,
} from '../../services/premium/dreamInterpretation';
import {
  DreamInterpretation,
  DreamMetadata,
  SelectedFeeling,
  DREAM_FEELINGS,
  AwakenState,
  FeelingTier,
} from '../../services/premium/dreamTypes';

/** Tier options shown as the first step in the feeling picker */
const FEELING_TIERS: { id: FeelingTier; label: string; color: string }[] = [
  { id: 'negative', label: 'Mostly Negative', color: '#E85D75' },
  { id: 'positive', label: 'Mostly Positive', color: '#6CD97E' },
  { id: 'mixed',    label: 'Mixed',           color: '#E8A94D' },
  { id: 'hard',     label: 'Hard to name',    color: '#9B8EC4' },
  { id: 'all',      label: 'All',             color: '#8A9BB5' },
];
import { computeDreamAggregates, computeDreamPatterns } from '../../services/premium/dreamAggregates';

const ACCENT = '#7A8BE0';

/** Awaken state options for metadata picker */
const AWAKEN_STATES: { id: AwakenState; label: string }[] = [
  { id: 'calm', label: 'Calm' },
  { id: 'startled', label: 'Startled' },
  { id: 'confused', label: 'Confused' },
  { id: 'unsettled', label: 'Unsettled' },
  { id: 'relieved', label: 'Relieved' },
  { id: 'heavy', label: 'Heavy' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00'); // noon to avoid TZ edge cases
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (dateStr === todayStr) return 'Tonight / Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function SleepScreen() {
  const { isPremium } = usePremium();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [chartId, setChartId] = useState<string | null>(null);
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When non-null, we're editing an existing entry
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  // Date of the entry being edited (so we don't overwrite it with today)
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // Dream interpretation state
  const [natalChart, setNatalChart] = useState<NatalChart | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<DailyCheckIn[]>([]);
  const [recentJournalEntries, setRecentJournalEntries] = useState<JournalEntry[]>([]);
  /** Map of entryId → generated interpretation (lazy, on tap) */
  const [interpretations, setInterpretations] = useState<Record<string, DreamInterpretation>>({});
  /** Which entry's dream reflection is expanded */
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Form state
  const [quality, setQuality] = useState(0);           // 0 = unset, 1-5
  const [durationHours, setDurationHours] = useState(7.5);
  const [hasDuration, setHasDuration] = useState(false);
  const [dreamText, setDreamText] = useState('');
  // New feeling/metadata state for v2 engine
  const [selectedFeelings, setSelectedFeelings] = useState<SelectedFeeling[]>([]);
  const [dreamMetadata, setDreamMetadata] = useState<DreamMetadata>({
    vividness: 3,
    lucidity: 1,
    awakenState: 'calm',
    recurring: false,
  });
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [selectedTier, setSelectedTier] = useState<FeelingTier | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Clear saved timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Populate the form from an existing entry (edit mode) or reset to blank (new mode)
  const applyEntryToForm = useCallback((entry: SleepEntry | undefined) => {
    if (entry) {
      setEditingEntryId(entry.id);
      setEditingDate(entry.date);
      setQuality(entry.quality ?? 0);
      if (entry.durationHours != null) {
        setHasDuration(true);
        setDurationHours(entry.durationHours);
      } else {
        setHasDuration(false);
        setDurationHours(7.5);
      }
      setDreamText(entry.dreamText ?? '');
      // Parse feelings & metadata from stored JSON
      if (entry.dreamFeelings) {
        try {
          const parsed = JSON.parse(entry.dreamFeelings) as SelectedFeeling[];
          setSelectedFeelings(Array.isArray(parsed) ? parsed : []);
        } catch { setSelectedFeelings([]); }
      } else { setSelectedFeelings([]); }
      if (entry.dreamMetadata) {
        try {
          const parsed = JSON.parse(entry.dreamMetadata) as DreamMetadata;
          setDreamMetadata(parsed);
        } catch {
          setDreamMetadata({ vividness: 3, lucidity: 1, awakenState: 'calm', recurring: false });
        }
      } else {
        setDreamMetadata({ vividness: 3, lucidity: 1, awakenState: 'calm', recurring: false });
      }
      setShowFeelingPicker(false);
      setSelectedTier(null);
      setShowMetadata(false);
    } else {
      setEditingEntryId(null);
      setEditingDate(null);
      setQuality(0);
      setDurationHours(7.5);
      setHasDuration(false);
      setDreamText('');
      setSelectedFeelings([]);
      setDreamMetadata({ vividness: 3, lucidity: 1, awakenState: 'calm', recurring: false });
      setShowFeelingPicker(false);
      setSelectedTier(null);
      setShowMetadata(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setLoading(true);
          const charts = await localDb.getCharts();
          if (charts.length === 0) return;
          const savedChart = charts[0];
          const id = savedChart.id;
          setChartId(id);

          const [data, checkIns, journalEntries] = await Promise.all([
            localDb.getSleepEntries(id, 30),
            localDb.getCheckIns(id, 30),
            localDb.getJournalEntries(),
          ]);

          setEntries(data);
          setRecentCheckIns(checkIns);
          setRecentJournalEntries(journalEntries.slice(0, 5));
          applyEntryToForm(data.find(e => e.date === today));

          // Generate natal chart silently for personality profile layer
          try {
            const chart = AstrologyCalculator.generateNatalChart({
              date: savedChart.birthDate,
              time: savedChart.birthTime,
              hasUnknownTime: savedChart.hasUnknownTime,
              place: savedChart.birthPlace,
              latitude: savedChart.latitude,
              longitude: savedChart.longitude,
              timezone: savedChart.timezone,
              houseSystem: savedChart.houseSystem,
            });
            setNatalChart(chart);
          } catch {
            // Chart unavailable — interpretation still works, just without personality layer
          }
        } catch (e) {
          logger.error('Sleep load failed:', e);
        } finally {
          setLoading(false);
        }
      })();
    }, [applyEntryToForm, today])
  );

  const canSave = quality > 0 || hasDuration || dreamText.trim().length > 0;

  const handleSave = async () => {
    if (!chartId || !canSave || saving) return;
    try {
      setSaving(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      const now = new Date().toISOString();

      // Preserve createdAt when updating an existing entry
      const existingCreatedAt = editingEntryId
        ? entries.find(e => e.id === editingEntryId)?.createdAt ?? now
        : now;

      const entry: SleepEntry = {
        id: editingEntryId ?? generateId(),
        chartId,
        date: editingDate ?? today,
        durationHours: hasDuration ? durationHours : undefined,
        quality: quality > 0 ? quality : undefined,
        dreamText: dreamText.trim() || undefined,
        dreamMood: undefined,
        dreamFeelings: selectedFeelings.length > 0 ? JSON.stringify(selectedFeelings) : undefined,
        dreamMetadata: dreamText.trim().length > 0 ? JSON.stringify(dreamMetadata) : undefined,
        notes: undefined,
        createdAt: existingCreatedAt,
        updatedAt: now,
        isDeleted: false,
      };

      await localDb.saveSleepEntry(entry);

      const updated = await localDb.getSleepEntries(chartId, 30);
      setEntries(updated);

      // Find the saved entry in the refreshed list
      const savedEntry = updated.find(e => e.id === entry.id);

      // Clear cached interpretation so it regenerates with updated dream text
      const savedId = entry.id;
      setInterpretations(prev => {
        const next = { ...prev };
        delete next[savedId];
        return next;
      });

      // Auto-generate interpretation when premium user saves a dream with text or feelings
      if (isPremium && savedEntry?.dreamText) {
        try {
          const aggregates = computeDreamAggregates(selectedFeelings, natalChart);
          const patterns = computeDreamPatterns(selectedFeelings, updated.filter(e => e.id !== savedEntry.id));
          const result = generateDreamInterpretation({
            entry: savedEntry,
            dreamText: savedEntry.dreamText,
            feelings: selectedFeelings,
            metadata: dreamMetadata,
            aggregates,
            patterns,
          });
          setInterpretations(prev => ({ ...prev, [savedEntry.id]: result }));
          setExpandedEntryId(savedEntry.id);
        } catch (e) {
          logger.error('Auto dream interpretation failed:', e);
        }
      } else {
        if (expandedEntryId === savedId) setExpandedEntryId(null);
      }

      // Stay in edit mode for the entry we just saved
      applyEntryToForm(savedEntry);

      // Show brief "Saved" confirmation
      setSaving(false);
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      logger.error('Sleep save failed:', e);
      Alert.alert('Error', 'Could not save entry. Please try again.');
      setSaving(false);
    }
  };

  const handleDreamReflect = useCallback((entry: SleepEntry) => {
    if (!entry.dreamText) return;

    // Toggle off if already open
    if (expandedEntryId === entry.id) {
      setExpandedEntryId(null);
      return;
    }

    setExpandedEntryId(entry.id);
    Haptics.selectionAsync().catch(() => {});

    // Generate if not already cached
    if (!interpretations[entry.id]) {
      try {
        // Parse stored feelings and metadata
        let feelings: SelectedFeeling[] = [];
        let metadata: DreamMetadata = { vividness: 3, lucidity: 1, awakenState: 'calm', recurring: false };
        if (entry.dreamFeelings) {
          try { feelings = JSON.parse(entry.dreamFeelings); } catch {}
        }
        if (entry.dreamMetadata) {
          try { metadata = JSON.parse(entry.dreamMetadata); } catch {}
        }
        const aggregates = computeDreamAggregates(feelings, natalChart);
        const otherEntries = entries.filter(e => e.id !== entry.id);
        const patterns = computeDreamPatterns(feelings, otherEntries);
        const result = generateDreamInterpretation({
          entry,
          dreamText: entry.dreamText,
          feelings,
          metadata,
          aggregates,
          patterns,
        });
        setInterpretations(prev => ({ ...prev, [entry.id]: result }));
      } catch (e) {
        logger.error('Dream interpretation failed:', e);
        setExpandedEntryId(null);
      }
    }
  }, [expandedEntryId, interpretations, natalChart, entries]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Remove this sleep entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await localDb.deleteSleepEntry(id);
            if (chartId) {
              const updated = await localDb.getSleepEntries(chartId, 30);
              setEntries(updated);

              // Reset form if we just deleted the entry being edited
              if (editingEntryId === id) {
                const todayEntry = updated.find(e => e.date === today);
                applyEntryToForm(todayEntry);
              }
            }
          } catch (e) {
            logger.error('Sleep delete failed:', e);
          }
        },
      },
    ]);
  };

  const stats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = entries.filter(e => new Date(e.date + 'T12:00:00') >= weekAgo);
    const durations = recent.filter(e => e.durationHours != null).map(e => e.durationHours!);
    const qualities = recent.filter(e => e.quality != null).map(e => e.quality!);
    return {
      count: recent.length,
      avgDuration: durations.length > 0
        ? durations.reduce((a, b) => a + b) / durations.length
        : null,
      avgQuality: qualities.length > 0
        ? qualities.reduce((a, b) => a + b) / qualities.length
        : null,
    };
  }, [entries]);

  return (
    <View style={styles.container}>
      <StarField starCount={40} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Sleep</Text>
            <Text style={styles.subtitle}>Track your rest and dreams</Text>
          </Animated.View>

          {/* ── Log Form ── */}
          <Animated.View entering={FadeInDown.delay(140).duration(600)} style={styles.section}>
            <LinearGradient
              colors={['rgba(122, 139, 224, 0.10)', 'rgba(122, 139, 224, 0.03)']}
              style={styles.formCard}
            >
              <View style={styles.formTitleRow}>
                <Text style={styles.formTitle}>
                  {editingEntryId
                    ? editingDate === today
                      ? "Update tonight's entry"
                      : `Edit ${formatDate(editingDate!)}`
                    : 'How was last night?'}
                </Text>
                {editingEntryId && editingDate !== today && (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      applyEntryToForm(entries.find(e => e.date === today));
                    }}
                    style={styles.cancelEditBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel editing, return to today"
                  >
                    <Ionicons name="close-circle-outline" size={16} color={theme.textMuted} />
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </Pressable>
                )}
              </View>

              {/* Quality rating */}
              <Text style={styles.fieldLabel}>How rested do you feel?</Text>
              <View style={styles.qualityRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Pressable
                    key={n}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setQuality(n === quality ? 0 : n);
                    }}
                    style={styles.moonBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate sleep ${n} out of 5`}
                  >
                    <Ionicons
                      name={n <= quality ? 'moon' : 'moon-outline'}
                      size={30}
                      color={n <= quality ? theme.primary : theme.textMuted}
                    />
                  </Pressable>
                ))}
              </View>

              {/* Duration stepper */}
              <Text style={styles.fieldLabel}>Hours slept</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setHasDuration(true);
                    setDurationHours(h => Math.max(0.5, parseFloat((h - 0.5).toFixed(1))));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease hours"
                >
                  <Ionicons name="remove" size={22} color={theme.textPrimary} />
                </Pressable>

                <Pressable
                  style={styles.stepperValue}
                  onLongPress={() => { setHasDuration(false); setDurationHours(7.5); }}
                  accessibilityRole="button"
                  accessibilityLabel={hasDuration ? `${durationHours} hours, long press to clear` : 'Hours not set'}
                >
                  <Text style={[styles.stepperValueText, !hasDuration && styles.stepperPlaceholder]}>
                    {hasDuration ? formatDuration(durationHours) : '—'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setHasDuration(true);
                    setDurationHours(h => Math.min(12, parseFloat((h + 0.5).toFixed(1))));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Increase hours"
                >
                  <Ionicons name="add" size={22} color={theme.textPrimary} />
                </Pressable>
              </View>
              {hasDuration && (
                <Text style={styles.stepperHint}>Long press to clear</Text>
              )}

              {/* Dream journal — Deeper Sky only */}
              <Text style={styles.fieldLabel}>Dream journal</Text>
              {isPremium ? (
                <TextInput
                  style={styles.dreamInput}
                  value={dreamText}
                  onChangeText={setDreamText}
                  placeholder="What did you dream about?"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              ) : (
                <Pressable
                  onPress={() => router.push('/(tabs)/premium' as Href)}
                  accessibilityRole="button"
                  accessibilityLabel="Unlock dream journal with Deeper Sky"
                >
                  <LinearGradient
                    colors={['rgba(201,169,98,0.08)', 'rgba(201,169,98,0.03)']}
                    style={styles.dreamLock}
                  >
                    <Ionicons name="lock-closed" size={15} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dreamLockTitle}>Dream journal — Deeper Sky</Text>
                      <Text style={styles.dreamLockSub}>Log and search your dreams with Deeper Sky</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                  </LinearGradient>
                </Pressable>
              )}

              {/* Dream feelings — multi-select with intensity (shown when dream text is non-empty, premium only) */}
              {isPremium && dreamText.trim().length > 0 && (
                <>
                  <Text style={styles.fieldLabel}>How did the dream feel?</Text>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setShowFeelingPicker(prev => !prev);
                    }}
                    style={styles.dreamMoodDropdown}
                    accessibilityRole="button"
                    accessibilityLabel={selectedFeelings.length > 0 ? `${selectedFeelings.length} feelings selected` : 'Select dream feelings'}
                  >
                    <Text style={selectedFeelings.length > 0 ? styles.dreamMoodDropdownText : styles.dreamMoodDropdownPlaceholder}>
                      {selectedFeelings.length > 0
                        ? selectedFeelings.map(f => DREAM_FEELINGS.find(d => d.id === f.id)?.label ?? f.id).join(', ')
                        : 'Tap to select feelings…'}
                    </Text>
                    <Ionicons
                      name={showFeelingPicker ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={theme.textMuted}
                    />
                  </Pressable>
                  {showFeelingPicker && (
                    <View style={styles.dreamMoodOptions}>
                      {/* Step 1: Tier selector */}
                      <View style={styles.tierRow}>
                        {FEELING_TIERS.map(tier => {
                          const isActive = selectedTier === tier.id;
                          const tierCount = tier.id === 'all'
                            ? selectedFeelings.length
                            : selectedFeelings.filter(f => DREAM_FEELINGS.find(d => d.id === f.id)?.tier === tier.id).length;
                          return (
                            <Pressable
                              key={tier.id}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                setSelectedTier(prev => prev === tier.id ? null : tier.id);
                              }}
                              style={[
                                styles.tierPill,
                                isActive && { backgroundColor: tier.color + '22', borderColor: tier.color },
                              ]}
                              accessibilityRole="button"
                              accessibilityLabel={`${tier.label}${isActive ? ', showing' : ''}`}
                            >
                              <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                              <Text style={[
                                styles.tierPillText,
                                isActive && { color: tier.color },
                              ]}>{tier.label}</Text>
                              {tierCount > 0 && (
                                <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
                                  <Text style={styles.tierBadgeText}>{tierCount}</Text>
                                </View>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Step 2: Filtered feelings for selected tier (alphabetical) */}
                      {selectedTier && [...DREAM_FEELINGS]
                        .filter(f => selectedTier === 'all' || f.tier === selectedTier)
                        .sort((a, b) => a.label.localeCompare(b.label))
                        .map(feel => {
                        const existing = selectedFeelings.find(f => f.id === feel.id);
                        const isSelected = !!existing;
                        return (
                          <View key={feel.id}>
                            <Pressable
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                if (isSelected) {
                                  setSelectedFeelings(prev => prev.filter(f => f.id !== feel.id));
                                } else {
                                  setSelectedFeelings(prev => [...prev, { id: feel.id, intensity: 3 }]);
                                }
                              }}
                              style={[styles.dreamMoodOption, isSelected && styles.dreamMoodOptionSelected]}
                              accessibilityRole="button"
                              accessibilityLabel={`${feel.label}${isSelected ? ', selected' : ''}`}
                            >
                              <Text style={[styles.dreamMoodOptionText, isSelected && styles.dreamMoodOptionTextSelected]}>
                                {feel.label}
                              </Text>
                              {isSelected && (
                                <Ionicons name="checkmark" size={16} color={ACCENT} />
                              )}
                            </Pressable>
                            {/* Intensity slider for selected feelings */}
                            {isSelected && (
                              <View style={styles.intensityRow}>
                                <Text style={styles.intensityLabel}>Intensity</Text>
                                <View style={styles.intensityDots}>
                                  {[1, 2, 3, 4, 5].map(n => (
                                    <Pressable
                                      key={n}
                                      onPress={() => {
                                        Haptics.selectionAsync().catch(() => {});
                                        setSelectedFeelings(prev =>
                                          prev.map(f => f.id === feel.id ? { ...f, intensity: n } : f)
                                        );
                                      }}
                                      style={[
                                        styles.intensityDot,
                                        n <= (existing?.intensity ?? 0) && styles.intensityDotActive,
                                      ]}
                                      accessibilityRole="button"
                                      accessibilityLabel={`Intensity ${n}`}
                                    >
                                      <Text style={[
                                        styles.intensityDotText,
                                        n <= (existing?.intensity ?? 0) && styles.intensityDotTextActive,
                                      ]}>{n}</Text>
                                    </Pressable>
                                  ))}
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}

                      {/* Hint when no tier is selected */}
                      {!selectedTier && (
                        <Text style={styles.tierHint}>Choose a category above to see feelings</Text>
                      )}
                    </View>
                  )}

                  {/* Dream metadata section */}
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setShowMetadata(prev => !prev);
                    }}
                    style={[styles.dreamMoodDropdown, { marginTop: theme.spacing.sm }]}
                    accessibilityRole="button"
                    accessibilityLabel="Dream details"
                  >
                    <Text style={styles.dreamMoodDropdownText}>Dream details</Text>
                    <Ionicons
                      name={showMetadata ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={theme.textMuted}
                    />
                  </Pressable>
                  {showMetadata && (
                    <View style={styles.metadataSection}>
                      {/* Vividness */}
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Vividness</Text>
                        <View style={styles.intensityDots}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Pressable
                              key={n}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                setDreamMetadata(prev => ({ ...prev, vividness: n }));
                              }}
                              style={[styles.intensityDot, n <= dreamMetadata.vividness && styles.intensityDotActive]}
                              accessibilityRole="button"
                              accessibilityLabel={`Vividness ${n}`}
                            >
                              <Text style={[styles.intensityDotText, n <= dreamMetadata.vividness && styles.intensityDotTextActive]}>{n}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                      {/* Lucidity */}
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Lucidity</Text>
                        <View style={styles.intensityDots}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Pressable
                              key={n}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                setDreamMetadata(prev => ({ ...prev, lucidity: n }));
                              }}
                              style={[styles.intensityDot, n <= dreamMetadata.lucidity && styles.intensityDotActive]}
                              accessibilityRole="button"
                              accessibilityLabel={`Lucidity ${n}`}
                            >
                              <Text style={[styles.intensityDotText, n <= dreamMetadata.lucidity && styles.intensityDotTextActive]}>{n}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                      {/* Awaken state */}
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Woke up feeling</Text>
                        <View style={styles.awakenRow}>
                          {AWAKEN_STATES.map(s => (
                            <Pressable
                              key={s.id}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                setDreamMetadata(prev => ({ ...prev, awakenState: s.id }));
                              }}
                              style={[styles.awakenChip, dreamMetadata.awakenState === s.id && styles.awakenChipActive]}
                              accessibilityRole="button"
                              accessibilityLabel={`Woke up ${s.label}`}
                            >
                              <Text style={[styles.awakenChipText, dreamMetadata.awakenState === s.id && styles.awakenChipTextActive]}>
                                {s.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                      {/* Recurring toggle */}
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setDreamMetadata(prev => ({ ...prev, recurring: !prev.recurring }));
                        }}
                        style={styles.recurringRow}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: dreamMetadata.recurring }}
                        accessibilityLabel="Recurring dream"
                      >
                        <Text style={styles.metadataLabel}>Recurring dream?</Text>
                        <View style={[styles.toggleTrack, dreamMetadata.recurring && styles.toggleTrackActive]}>
                          <View style={[styles.toggleThumb, dreamMetadata.recurring && styles.toggleThumbActive]} />
                        </View>
                      </Pressable>
                    </View>
                  )}
                </>
              )}

              {/* Save */}
              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  (!canSave || saving || saved) && styles.saveBtnDisabled,
                  pressed && styles.saveBtnPressed,
                ]}
                onPress={handleSave}
                disabled={!canSave || saving || saved}
                accessibilityRole="button"
                accessibilityLabel="Save sleep entry"
              >
                <LinearGradient
                  colors={
                    saved
                      ? ['rgba(110,191,139,0.6)', 'rgba(110,191,139,0.4)']
                      : canSave
                        ? [...theme.goldGradient]
                        : ['rgba(201,169,98,0.3)', 'rgba(201,169,98,0.2)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveBtnGradient}
                >
                  <Text style={[styles.saveBtnText, !canSave && !saved && styles.saveBtnTextDisabled]}>
                    {saving ? 'Saving…' : saved ? 'Saved ✓' : editingEntryId ? 'Update Entry' : 'Save Entry'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </Animated.View>

          {/* ── Today's Dream Reflection (inline, premium) ── */}
          {(() => {
            const todayEntry = entries.find(e => e.date === today);
            const todayInterp = todayEntry ? interpretations[todayEntry.id] : null;
            if (!isPremium || !todayEntry?.dreamText || !todayInterp) return null;
            return (
              <Animated.View entering={FadeInDown.delay(180).duration(600)} style={styles.section}>
                <LinearGradient
                  colors={['rgba(122,139,224,0.12)', 'rgba(122,139,224,0.03)']}
                  style={styles.todayInterpretCard}
                >
                  <View style={styles.todayInterpretHeader}>
                    <Ionicons name="sparkles" size={16} color={ACCENT} />
                    <Text style={styles.todayInterpretTitle}>Your Dream Reflection</Text>
                  </View>

                  <Text style={styles.interpretBody}>{todayInterp.paragraph}</Text>

                  <View style={styles.sitWithBox}>
                    <Text style={styles.sitWithLabel}>A question to sit with</Text>
                    <Text style={styles.sitWithText}>{todayInterp.question}</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            );
          })()}

          {/* ── Stats ── */}
          {stats.count > 0 && (
            <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Last 7 Days</Text>
              <View style={styles.statsRow}>
                <LinearGradient
                  colors={['rgba(122,139,224,0.12)', 'rgba(122,139,224,0.04)']}
                  style={styles.statCard}
                >
                  <Text style={styles.statLabel}>NIGHTS</Text>
                  <Text style={styles.statValue}>{stats.count}</Text>
                  <Text style={styles.statSub}>logged</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['rgba(201,169,98,0.10)', 'rgba(201,169,98,0.03)']}
                  style={styles.statCard}
                >
                  <Text style={styles.statLabel}>AVG SLEEP</Text>
                  <Text style={styles.statValue}>
                    {stats.avgDuration != null ? formatDuration(stats.avgDuration) : '—'}
                  </Text>
                  <Text style={styles.statSub}>per night</Text>
                </LinearGradient>

                <LinearGradient
                  colors={['rgba(110,191,139,0.10)', 'rgba(110,191,139,0.03)']}
                  style={styles.statCard}
                >
                  <Text style={styles.statLabel}>AVG REST</Text>
                  <Text style={styles.statValue}>
                    {stats.avgQuality != null ? `${stats.avgQuality.toFixed(1)}/5` : '—'}
                  </Text>
                  <Text style={styles.statSub}>quality</Text>
                </LinearGradient>
              </View>
            </Animated.View>
          )}

          {/* ── History ── */}
          {entries.length > 0 && (
            <Animated.View entering={FadeInDown.delay(280).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Nights</Text>

              {entries.map(entry => {
                const isExpanded = expandedEntryId === entry.id;
                const interp = interpretations[entry.id];
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        applyEntryToForm(entry);
                        scrollRef.current?.scrollTo({ y: 0, animated: true });
                      }}
                      onLongPress={() => handleDelete(entry.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Sleep entry for ${entry.date}, tap to edit`}
                      accessibilityHint="Tap to edit, long press to delete"
                    >
                      <LinearGradient
                        colors={['rgba(30,45,71,0.85)', 'rgba(26,39,64,0.55)']}
                        style={styles.entryCardInner}
                      >
                        <View style={styles.entryHeader}>
                          <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                          <View style={styles.entryMeta}>
                            {entry.durationHours != null && (
                              <View style={styles.entryMetaItem}>
                                <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                                <Text style={styles.entryMetaText}>{formatDuration(entry.durationHours)}</Text>
                              </View>
                            )}
                            {entry.quality != null && (
                              <View style={styles.entryMoons}>
                                {[1, 2, 3, 4, 5].map(n => (
                                  <Ionicons
                                    key={n}
                                    name={n <= entry.quality! ? 'moon' : 'moon-outline'}
                                    size={11}
                                    color={n <= entry.quality! ? theme.primary : 'rgba(201,169,98,0.3)'}
                                  />
                                ))}
                              </View>
                            )}
                          </View>
                        </View>

                        {entry.dreamText ? (
                          <Text style={styles.entryDream} numberOfLines={isExpanded ? undefined : 2}>
                            {entry.dreamText}
                          </Text>
                        ) : null}

                        {entry.dreamMood || entry.dreamFeelings ? (
                          <View style={styles.entryDreamMoodRow}>
                            <Text style={styles.entryDreamMoodText}>
                              {entry.dreamFeelings
                                ? (() => {
                                    try {
                                      const parsed = JSON.parse(entry.dreamFeelings) as SelectedFeeling[];
                                      return parsed.map(f => DREAM_FEELINGS.find(d => d.id === f.id)?.label ?? f.id).join(', ');
                                    } catch { return entry.dreamMood ?? ''; }
                                  })()
                                : entry.dreamMood ?? ''}
                            </Text>
                          </View>
                        ) : null}

                        {/* Dream Reflection button — premium only */}
                        {isPremium && entry.dreamText ? (
                          <Pressable
                            onPress={() => handleDreamReflect(entry)}
                            style={({ pressed }) => [
                              styles.reflectBtn,
                              pressed && styles.reflectBtnPressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={isExpanded ? 'Close dream reflection' : 'Open dream reflection'}
                          >
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'sparkles'}
                              size={14}
                              color={ACCENT}
                            />
                            <Text style={styles.reflectBtnText}>
                              {isExpanded ? 'Close reflection' : 'Reflect on this dream'}
                            </Text>
                            <Ionicons
                              name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                              size={12}
                              color={ACCENT}
                              style={{ marginLeft: 'auto' }}
                            />
                          </Pressable>
                        ) : null}
                      </LinearGradient>
                    </Pressable>

                    {/* Expanded dream interpretation — v2 format */}
                    {isExpanded && interp && (
                      <Animated.View entering={FadeInDown.duration(400)}>
                        <LinearGradient
                          colors={['rgba(122,139,224,0.10)', 'rgba(122,139,224,0.04)']}
                          style={styles.interpretCard}
                        >
                          <Text style={styles.interpretBody}>{interp.paragraph}</Text>

                          <View style={styles.sitWithBox}>
                            <Text style={styles.sitWithLabel}>A question to sit with</Text>
                            <Text style={styles.sitWithText}>{interp.question}</Text>
                          </View>
                        </LinearGradient>
                      </Animated.View>
                    )}
                  </View>
                );
              })}

              <Text style={styles.deleteHint}>Tap to edit · Long press to delete</Text>
            </Animated.View>
          )}

          {/* ── Empty state ── */}
          {!loading && entries.length === 0 && (
            <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.emptyState}>
              <Ionicons name="moon-outline" size={44} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>Your sleep story starts here</Text>
              <Text style={styles.emptySubtitle}>
                Log your first night above. Even just a quality rating helps you spot patterns over time.
              </Text>
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

  header: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.lg },
  title: { fontSize: 30, fontWeight: '700', color: theme.textPrimary, fontFamily: 'serif' },
  subtitle: { color: theme.textSecondary, fontSize: 15, marginTop: 6 },

  section: { marginBottom: theme.spacing.lg },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: theme.spacing.md,
    letterSpacing: 0.3,
  },

  // Form card
  formCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(122, 139, 224, 0.15)',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    flex: 1,
  },
  formTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: theme.spacing.lg,
  },
  cancelEditBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cancelEditText: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  optional: { fontWeight: '400', color: theme.textMuted, fontSize: 12 },

  // Quality rating
  qualityRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.sm },
  moonBtn: { padding: 6 },

  // Duration stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  stepperBtn: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  stepperValueText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  stepperPlaceholder: { color: theme.textMuted, fontWeight: '400', fontSize: 22 },
  stepperHint: {
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },

  // Dream / notes input
  dreamInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    marginBottom: theme.spacing.md,
  },
  dreamLock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.18)',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  dreamLockTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 2,
  },
  dreamLockSub: {
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 16,
  },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    marginBottom: theme.spacing.md,
  },

  // Dream mood dropdown
  dreamMoodDropdown: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  dreamMoodDropdownText: {
    color: theme.textPrimary,
    fontSize: 15,
  },
  dreamMoodDropdownPlaceholder: {
    color: theme.textMuted,
    fontSize: 15,
  },
  dreamMoodOptions: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  dreamMoodOption: {
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dreamMoodOptionSelected: {
    backgroundColor: 'rgba(122,139,224,0.08)',
  },
  dreamMoodOptionText: {
    color: theme.textPrimary,
    fontSize: 15,
  },
  dreamMoodOptionTextSelected: {
    color: ACCENT,
    fontWeight: '600',
  },

  // Tiered feeling selector
  tierRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierPillText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tierBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  tierBadgeText: {
    color: '#0D1421',
    fontSize: 10,
    fontWeight: '700',
  },
  tierHint: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },

  // Save button
  saveBtn: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  saveBtnGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#0D1421' },
  saveBtnTextDisabled: { color: theme.textMuted },

  // Stats
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm },
  statCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 82,
    justifyContent: 'center',
  },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: theme.textMuted, marginBottom: 4 },
  statValue: { fontSize: 19, fontWeight: '700', color: theme.textPrimary },
  statSub: { fontSize: 10, color: theme.textMuted, marginTop: 2, textAlign: 'center' },

  // Entry cards
  entryCard: { marginBottom: theme.spacing.sm },
  entryCardInner: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  entryDate: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  entryMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  entryMetaText: { fontSize: 12, color: theme.textMuted },
  entryMoons: { flexDirection: 'row', gap: 2 },
  entryDream: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  entryDreamMoodRow: {
    marginTop: 4,
  },
  entryDreamMoodText: {
    fontSize: 12,
    color: theme.textMuted,
  },
  deleteHint: {
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },

  // Dream reflection
  reflectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(122,139,224,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(122,139,224,0.15)',
  },
  reflectBtnPressed: {
    opacity: 0.7,
  },
  reflectBtnText: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '600',
  },
  todayInterpretCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(122,139,224,0.18)',
  },
  todayInterpretHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  todayInterpretTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  interpretCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(122,139,224,0.15)',
  },
  symbolRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  symbolChip: {
    backgroundColor: 'rgba(122,139,224,0.15)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  symbolChipText: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: '600',
  },
  interpretSection: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: theme.spacing.md,
  },
  interpretBody: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 21,
  },
  sitWithBox: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(122,139,224,0.10)',
  },
  sitWithLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sitWithText: {
    fontSize: 14,
    color: theme.textPrimary,
    lineHeight: 21,
    fontStyle: 'italic',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Intensity selector (for feelings)
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(122,139,224,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  intensityLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  intensityDots: {
    flexDirection: 'row',
    gap: 6,
  },
  intensityDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityDotActive: {
    backgroundColor: 'rgba(122,139,224,0.25)',
    borderColor: ACCENT,
  },
  intensityDotText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
  },
  intensityDotTextActive: {
    color: ACCENT,
  },

  // Metadata section
  metadataSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  metadataRow: {
    marginBottom: theme.spacing.md,
  },
  metadataLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  awakenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  awakenChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  awakenChipActive: {
    backgroundColor: 'rgba(122,139,224,0.20)',
    borderColor: ACCENT,
  },
  awakenChipText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  awakenChipTextActive: {
    color: ACCENT,
    fontWeight: '600',
  },
  recurringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: 'rgba(122,139,224,0.40)',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.textMuted,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: ACCENT,
  },

  // Theme cards (interpretation v2)
  themeCardBox: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(122,139,224,0.08)',
  },
  themeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(122,139,224,0.15)',
    marginLeft: 8,
  },
  confidenceHigh: {
    backgroundColor: 'rgba(110,191,139,0.20)',
  },
  confidenceLow: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textMuted,
    letterSpacing: 0.5,
  },
  evidenceList: {
    marginTop: 8,
    paddingLeft: 4,
  },
  evidenceItem: {
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 18,
    marginBottom: 2,
  },
});
