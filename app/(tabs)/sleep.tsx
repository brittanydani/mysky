/**
 * Sleep Tab — Rest tracking & dream journal
 *
 * Log nightly sleep quality (1–5 moons), duration, and dream notes.
 * Dream text and notes are encrypted at rest via FieldEncryptionService.
 * Completely astrology-free.
 */

import React, { useCallback, useMemo, useState } from 'react';
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
import { SleepEntry, generateId } from '../../services/storage/models';
import { logger } from '../../utils/logger';
import { usePremium } from '../../context/PremiumContext';

const ACCENT = '#7A8BE0';

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
  const [chartId, setChartId] = useState<string | null>(null);
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // When non-null, we're editing today's existing entry instead of creating a new one
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Form state
  const [quality, setQuality] = useState(0);           // 0 = unset, 1-5
  const [durationHours, setDurationHours] = useState(7.5);
  const [hasDuration, setHasDuration] = useState(false);
  const [dreamText, setDreamText] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Populate the form from an existing entry (edit mode) or reset to blank (new mode)
  const applyEntryToForm = useCallback((entry: SleepEntry | undefined) => {
    if (entry) {
      setEditingEntryId(entry.id);
      setQuality(entry.quality ?? 0);
      if (entry.durationHours != null) {
        setHasDuration(true);
        setDurationHours(entry.durationHours);
      } else {
        setHasDuration(false);
        setDurationHours(7.5);
      }
      setDreamText(entry.dreamText ?? '');
      setNotes(entry.notes ?? '');
      if (entry.notes) setShowNotes(true);
    } else {
      setEditingEntryId(null);
      setQuality(0);
      setDurationHours(7.5);
      setHasDuration(false);
      setDreamText('');
      setNotes('');
      setShowNotes(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setLoading(true);
          const charts = await localDb.getCharts();
          if (charts.length === 0) return;
          const id = charts[0].id;
          setChartId(id);
          const data = await localDb.getSleepEntries(id, 30);
          setEntries(data);
          applyEntryToForm(data.find(e => e.date === today));
        } catch (e) {
          logger.error('Sleep load failed:', e);
        } finally {
          setLoading(false);
        }
      })();
    }, [applyEntryToForm, today])
  );

  const canSave = quality > 0 || hasDuration || dreamText.trim().length > 0 || notes.trim().length > 0;

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
        date: today,
        durationHours: hasDuration ? durationHours : undefined,
        quality: quality > 0 ? quality : undefined,
        dreamText: dreamText.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: existingCreatedAt,
        updatedAt: now,
        isDeleted: false,
      };

      await localDb.saveSleepEntry(entry);

      const updated = await localDb.getSleepEntries(chartId, 30);
      setEntries(updated);
      // Stay in edit mode for the entry we just saved
      applyEntryToForm(updated.find(e => e.date === today));
    } catch (e) {
      logger.error('Sleep save failed:', e);
      Alert.alert('Error', 'Could not save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
              <Text style={styles.formTitle}>
                {editingEntryId ? "Update tonight's entry" : 'How was last night?'}
              </Text>

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

              {/* Notes toggle */}
              {!showNotes ? (
                <Pressable
                  style={styles.addNotesBtn}
                  onPress={() => setShowNotes(true)}
                  accessibilityRole="button"
                >
                  <Ionicons name="add-circle-outline" size={16} color={ACCENT} />
                  <Text style={styles.addNotesBtnText}>Add notes</Text>
                </Pressable>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>
                    Notes{'  '}
                    <Text style={styles.optional}>(optional)</Text>
                  </Text>
                  <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Any observations about your sleep…"
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </>
              )}

              {/* Save */}
              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  (!canSave || saving) && styles.saveBtnDisabled,
                  pressed && styles.saveBtnPressed,
                ]}
                onPress={handleSave}
                disabled={!canSave || saving}
                accessibilityRole="button"
                accessibilityLabel="Save sleep entry"
              >
                <LinearGradient
                  colors={canSave ? [...theme.goldGradient] : ['rgba(201,169,98,0.3)', 'rgba(201,169,98,0.2)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveBtnGradient}
                >
                  <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                    {saving ? 'Saving…' : editingEntryId ? 'Update Entry' : 'Save Entry'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </LinearGradient>
          </Animated.View>

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

              {entries.map(entry => (
                <Pressable
                  key={entry.id}
                  onLongPress={() => handleDelete(entry.id)}
                  style={styles.entryCard}
                  accessibilityRole="button"
                  accessibilityLabel={`Sleep entry for ${entry.date}`}
                  accessibilityHint="Long press to delete"
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
                      <Text style={styles.entryDream} numberOfLines={2}>
                        {entry.dreamText}
                      </Text>
                    ) : null}
                  </LinearGradient>
                </Pressable>
              ))}

              <Text style={styles.deleteHint}>Long press any entry to delete</Text>
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
    marginBottom: theme.spacing.lg,
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

  addNotesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  addNotesBtnText: { fontSize: 14, color: ACCENT, fontWeight: '600' },

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
  deleteHint: {
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
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
});
