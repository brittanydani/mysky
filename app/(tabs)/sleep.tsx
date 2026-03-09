/**
 * File: app/(tabs)/sleep.tsx
 * Sleep Tab — Rest tracking & dream journal
 *
 * Log nightly sleep quality (1–5 moons), duration, and dream journal.
 * Dream text is encrypted at rest via FieldEncryptionService.
 * Completely astrology-free.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { useRouter, Href } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaRestorationField from '../../components/ui/SkiaRestorationField';
import SkiaRestorationInsight from '../../components/ui/SkiaRestorationInsight';
import { DreamSymbolChips } from '../../components/ui/DreamSymbolChips';

import { localDb } from '../../services/storage/localDb';
import { SleepEntry, JournalEntry, generateId } from '../../services/storage/models';
import { logger } from '../../utils/logger';
import { usePremium } from '../../context/PremiumContext';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { NatalChart } from '../../services/astrology/types';
import { DailyCheckIn } from '../../services/patterns/types';
import { generateDreamInterpretation } from '../../services/premium/dreamInterpretation';
import {
  DreamInterpretation,
  DreamMetadata,
  DreamTheme,
  SelectedFeeling,
  DREAM_FEELINGS,
  AwakenState,
  FeelingTier,
} from '../../services/premium/dreamTypes';
import { computeDreamAggregates, computeDreamPatterns } from '../../services/premium/dreamAggregates';
import SkiaSleepGraph from '../../components/ui/SkiaSleepGraph';
import type { SleepPoint } from '../../components/ui/SkiaSleepGraph';
import SkiaPulseMonitor from '../../components/ui/SkiaPulseMonitor';
import SkiaMoonDragger from '../../components/ui/SkiaMoonDragger';

const SCREEN_W = Dimensions.get('window').width;

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  amethyst: '#9D76C1',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

/** Tier options shown as the first step in the feeling picker */
const FEELING_TIERS: { id: FeelingTier; label: string; color: string }[] = [
  { id: 'negative', label: 'Mostly Negative', color: PALETTE.copper },
  { id: 'positive', label: 'Mostly Positive', color: PALETTE.emerald },
  { id: 'mixed',    label: 'Mixed',           color: PALETTE.gold },
  { id: 'hard',     label: 'Hard to name',    color: PALETTE.amethyst },
  { id: 'all',      label: 'All',             color: PALETTE.silverBlue },
];

/** Precomputed lookup map: feeling id → DreamFeelingDef */
const FEELING_LOOKUP: Map<string, typeof DREAM_FEELINGS[number]> = new Map(
  DREAM_FEELINGS.map(f => [f.id, f]),
);

/** Simple fuzzy match */
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  if (lowerText.includes(lowerQuery)) return true;
  let ti = 0;
  for (let qi = 0; qi < lowerQuery.length; qi++) {
    const idx = lowerText.indexOf(lowerQuery[qi], ti);
    if (idx === -1) return false;
    ti = idx + 1;
  }
  return true;
}

// ─── Memoized Feeling Item ────────────────────────────────────────────────────

interface FeelingItemProps {
  feel: typeof DREAM_FEELINGS[number];
  isSelected: boolean;
  intensity: number;
  onToggle: (id: string) => void;
  onIntensityChange: (id: string, intensity: number) => void;
}

const FeelingItem = memo(function FeelingItem({
  feel,
  isSelected,
  intensity,
  onToggle,
  onIntensityChange,
}: FeelingItemProps) {
  return (
    <View>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onToggle(feel.id);
        }}
        style={[styles.dreamMoodOption, isSelected && styles.dreamMoodOptionSelected]}
      >
        <Text style={[styles.dreamMoodOptionText, isSelected && styles.dreamMoodOptionTextSelected]}>
          {feel.label}
        </Text>
        {isSelected && <Ionicons name="checkmark" size={18} color={PALETTE.amethyst} />}
      </Pressable>
      {isSelected && (
        <View style={styles.intensityRow}>
          <Text style={styles.intensityLabel}>Intensity</Text>
          <View style={styles.intensityDots}>
            {[1, 2, 3, 4, 5].map(n => (
              <Pressable
                key={n}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onIntensityChange(feel.id, n);
                }}
                style={[styles.intensityDot, n <= intensity && styles.intensityDotActive]}
              >
                <Text style={[styles.intensityDotText, n <= intensity && styles.intensityDotTextActive]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

/** Awaken state options for metadata picker */
const AWAKEN_STATES: { id: AwakenState; label: string }[] = [
  { id: 'calm', label: 'Calm' },
  { id: 'startled', label: 'Startled' },
  { id: 'confused', label: 'Confused' },
  { id: 'unsettled', label: 'Unsettled' },
  { id: 'relieved', label: 'Relieved' },
  { id: 'heavy', label: 'Heavy' },
  { id: 'drained', label: 'Drained' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'thoughtful', label: 'Thoughtful' },
];

/** Overall dream theme options */
const DREAM_THEMES: { id: DreamTheme; label: string }[] = [
  { id: 'adventure', label: 'Adventure' },
  { id: 'conflict', label: 'Conflict' },
  { id: 'connection', label: 'Connection' },
  { id: 'transformation', label: 'Transformation' },
  { id: 'mystery', label: 'Mystery' },
  { id: 'survival', label: 'Survival / Escape' },
  { id: 'loss', label: 'Loss / Grief' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'mundane', label: 'Everyday Life' },
  { id: 'surreal', label: 'Surreal' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
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

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const [natalChart, setNatalChart] = useState<NatalChart | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<DailyCheckIn[]>([]);
  const [recentJournalEntries, setRecentJournalEntries] = useState<JournalEntry[]>([]);
  const [interpretations, setInterpretations] = useState<Record<string, DreamInterpretation>>({});
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const [quality, setQuality] = useState(0);
  const [durationHours, setDurationHours] = useState(7.5);
  const [hasDuration, setHasDuration] = useState(false);
  const [dreamText, setDreamText] = useState('');
  
  const [selectedFeelings, setSelectedFeelings] = useState<SelectedFeeling[]>([]);
  const [dreamMetadata, setDreamMetadata] = useState<DreamMetadata>({
    vividness: 3, lucidity: 1, controlLevel: 3, awakenState: 'calm', recurring: false,
  });
  
  const [showAwakenDropdown, setShowAwakenDropdown] = useState(false);
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [selectedTier, setSelectedTier] = useState<FeelingTier | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  
  const [feelingSearch, setFeelingSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isEditingUnlocked, setIsEditingUnlocked] = useState(false);

  // Logical "today": reset for the next day at 6:00 AM local time
  const today = useMemo(() => {
    const now = new Date();
    if (now.getHours() < 6) {
      now.setDate(now.getDate() - 1);
    }
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => { setDebouncedSearch(feelingSearch); }, 250);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [feelingSearch]);

  const filteredFeelings = useMemo(() => {
    if (!selectedTier) return [];
    return DREAM_FEELINGS
      .filter(f => selectedTier === 'all' || f.tier === selectedTier)
      .filter(f => fuzzyMatch(f.label, debouncedSearch))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedTier, debouncedSearch]);

  const handleToggleFeeling = useCallback((id: string) => {
    setSelectedFeelings(prev => {
      const exists = prev.some(f => f.id === id);
      return exists ? prev.filter(f => f.id !== id) : [...prev, { id, intensity: 3 }];
    });
  }, []);

  const handleIntensityChange = useCallback((id: string, intensity: number) => {
    setSelectedFeelings(prev => prev.map(f => (f.id === id ? { ...f, intensity } : f)));
  }, []);

  const selectedFeelingLabels = useMemo(
    () => selectedFeelings.map(f => FEELING_LOOKUP.get(f.id)?.label ?? f.id).join(', '),
    [selectedFeelings],
  );

  const applyEntryToForm = useCallback((entry: SleepEntry | undefined) => {
    if (entry) {
      setEditingEntryId(entry.id);
      setIsEditingUnlocked(false);
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
        } catch { setDreamMetadata({ vividness: 3, lucidity: 1, controlLevel: 3, awakenState: 'calm', recurring: false }); }
      } else {
        setDreamMetadata({ vividness: 3, lucidity: 1, controlLevel: 3, awakenState: 'calm', recurring: false });
      }
      setShowAwakenDropdown(false);
      setShowFeelingPicker(false);
      setSelectedTier(null);
      setShowMetadata(false);
    } else {
      setEditingEntryId(null);
      setIsEditingUnlocked(false);
      setEditingDate(null);
      setQuality(0);
      setDurationHours(7.5);
      setHasDuration(false);
      setDreamText('');
      setSelectedFeelings([]);
      setDreamMetadata({ vividness: 3, lucidity: 1, controlLevel: 3, awakenState: 'calm', recurring: false });
      setShowAwakenDropdown(false);
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
            localDb.getJournalEntriesPaginated(5),
          ]);

          setEntries(data);
          setRecentCheckIns(checkIns);
          setRecentJournalEntries(journalEntries);
          applyEntryToForm(data.find(e => e.date === today));

          try {
            const chart = AstrologyCalculator.generateNatalChart({
              date: savedChart.birthDate, time: savedChart.birthTime, hasUnknownTime: savedChart.hasUnknownTime,
              place: savedChart.birthPlace, latitude: savedChart.latitude, longitude: savedChart.longitude,
              timezone: savedChart.timezone, houseSystem: savedChart.houseSystem,
            });
            setNatalChart(chart);
          } catch {}
        } catch (e) {
          logger.error('Sleep load failed:', e);
          setLoadError('Could not load your sleep data. Check your connection and pull down to retry.');
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
      setSaveError(null);

      let isConnected = true;
      try { await fetch('https://clients3.google.com/generate_204', { method: 'HEAD', mode: 'no-cors' }); } catch { isConnected = false; }
      if (!isConnected) logger.warn('Saving sleep entry while offline');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      const now = new Date().toISOString();
      const existingCreatedAt = editingEntryId ? entries.find(e => e.id === editingEntryId)?.createdAt ?? now : now;

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

      const savedEntry = updated.find(e => e.id === entry.id);
      const savedId = entry.id;
      
      setInterpretations(prev => {
        const next = { ...prev };
        delete next[savedId];
        return next;
      });

      if (isPremium && savedEntry?.dreamText) {
        try {
          const aggregates = computeDreamAggregates(selectedFeelings, natalChart);
          const patterns = computeDreamPatterns(selectedFeelings, updated.filter(e => e.id !== savedEntry.id));
          const result = generateDreamInterpretation({
            entry: savedEntry, dreamText: savedEntry.dreamText, feelings: selectedFeelings,
            metadata: dreamMetadata, aggregates, patterns,
          });
          setInterpretations(prev => ({ ...prev, [savedEntry.id]: result }));
          setExpandedEntryId(savedEntry.id);
        } catch (e) {
          logger.error('Auto dream interpretation failed:', e);
        }
      } else {
        if (expandedEntryId === savedId) setExpandedEntryId(null);
      }

      applyEntryToForm(savedEntry);
      setSaving(false);
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      logger.error('Sleep save failed:', e);
      let isOffline = false;
      try { await fetch('https://clients3.google.com/generate_204', { method: 'HEAD', mode: 'no-cors' }); } catch { isOffline = true; }
      const msg = isOffline ? 'You appear to be offline. Your entry could not be saved.' : 'Could not save entry. Please try again.';
      setSaveError(msg);
      Alert.alert('Save Error', msg);
      setSaving(false);
    }
  };

  const handleDreamReflect = useCallback((entry: SleepEntry) => {
    if (!entry.dreamText) return;
    if (expandedEntryId === entry.id) {
      setExpandedEntryId(null);
      return;
    }

    setExpandedEntryId(entry.id);
    Haptics.selectionAsync().catch(() => {});

    // Always regenerate interpretation (no stale cache)
    try {
      let feelings: SelectedFeeling[] = [];
      let metadata: DreamMetadata = { vividness: 3, lucidity: 1, controlLevel: 3, awakenState: 'calm', recurring: false };
      if (entry.dreamFeelings) { try { feelings = JSON.parse(entry.dreamFeelings); } catch {} }
      if (entry.dreamMetadata) { try { metadata = JSON.parse(entry.dreamMetadata); } catch {} }
      
      const aggregates = computeDreamAggregates(feelings, natalChart);
      const otherEntries = entries.filter(e => e.id !== entry.id);
      const patterns = computeDreamPatterns(feelings, otherEntries);
      
      const result = generateDreamInterpretation({
        entry, dreamText: entry.dreamText, feelings, metadata, aggregates, patterns,
      });
      setInterpretations(prev => ({ ...prev, [entry.id]: result }));
    } catch (e) {
      logger.error('Dream interpretation failed:', e);
      setExpandedEntryId(null);
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
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b) / durations.length : null,
      avgQuality: qualities.length > 0 ? qualities.reduce((a, b) => a + b) / qualities.length : null,
    };
  }, [entries]);

  /** Map SleepEntry[] → SleepPoint[] for the restoration graph (sorted ascending by date) */
  const historicalSleep: SleepPoint[] = useMemo(() => {
    return entries
      .filter(e => e.durationHours != null || e.quality != null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14) // last 14 nights for a clear visual
      .map(e => ({
        duration: e.durationHours ?? 0,
        quality: e.quality ?? 3,
        date: e.date,
      }));
  }, [entries]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SkiaRestorationField quality={quality || 3} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Rest & Sleep</Text>
            <Text style={styles.subtitle}>Sleep quality · Dream journal</Text>
          </Animated.View>

          {/* ── Log Form (Cinematic Glass) ── */}
          <Animated.View entering={FadeInDown.delay(140).duration(600)} style={styles.section}>
            <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.formCard}>
              <View style={styles.formTitleRow}>
                <Text style={styles.formTitle}>
                  {editingEntryId ? editingDate === today ? (isEditingUnlocked ? "Editing tonight's entry" : "Tonight's rest log") : `Edit ${formatDate(editingDate!)}` : 'How was last night?'}
                </Text>
                {editingEntryId && (editingDate !== today || isEditingUnlocked) && (
                  <Pressable
                    onPress={() => { 
                      Haptics.selectionAsync().catch(() => {});
                      if (editingDate === today) {
                        setIsEditingUnlocked(false);
                        applyEntryToForm(entries.find(e => e.date === today));
                      } else {
                        applyEntryToForm(entries.find(e => e.date === today));
                      }
                    }}
                    style={styles.cancelEditBtn}
                  >
                    <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </Pressable>
                )}
              </View>

              <View pointerEvents={(editingEntryId && !isEditingUnlocked) ? 'none' : 'auto'} style={{ opacity: (editingEntryId && !isEditingUnlocked) ? 0.7 : 1 }}>
              {/* Quality rating */}
              <Text style={styles.fieldLabel}>How rested do you feel?</Text>
              <View style={styles.qualityRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Pressable
                    key={n}
                    onPress={() => { Haptics.selectionAsync().catch(() => {}); setQuality(n === quality ? 0 : n); }}
                    style={styles.moonBtn}
                  >
                    <Ionicons name={n <= quality ? 'moon' : 'moon-outline'} size={32} color={n <= quality ? PALETTE.silverBlue : 'rgba(255,255,255,0.1)'} />
                  </Pressable>
                ))}
              </View>

              {/* Moon Dragger — Radial duration instrument */}
              <Text style={styles.fieldLabel}>Hours slept</Text>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <SkiaMoonDragger
                  value={durationHours}
                  onChange={(h) => { setHasDuration(true); setDurationHours(h); }}
                />
              </View>

              {/* Duration stepper (fine-tune) */}
              <Text style={[styles.fieldLabel, { fontSize: 12, color: theme.textMuted }]}>Fine-tune</Text>
              <View style={styles.stepperRow}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => { Haptics.selectionAsync().catch(() => {}); setHasDuration(true); setDurationHours(h => Math.max(0.5, parseFloat((h - 0.5).toFixed(1)))); }}
                >
                  <Ionicons name="remove" size={24} color={PALETTE.textMain} />
                </Pressable>

                <Pressable
                  style={styles.stepperValue}
                  onLongPress={() => { setHasDuration(false); setDurationHours(7.5); }}
                >
                  <Text style={[styles.stepperValueText, !hasDuration && styles.stepperPlaceholder]}>
                    {hasDuration ? formatDuration(durationHours) : '—'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.stepperBtn}
                  onPress={() => { Haptics.selectionAsync().catch(() => {}); setHasDuration(true); setDurationHours(h => Math.min(12, parseFloat((h + 0.5).toFixed(1)))); }}
                >
                  <Ionicons name="add" size={24} color={PALETTE.textMain} />
                </Pressable>
              </View>
              {hasDuration && <Text style={styles.stepperHint}>Long press to clear</Text>}

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
                <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                  <LinearGradient colors={['rgba(232, 214, 174, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.dreamLock}>
                    <Ionicons name="lock-closed" size={16} color={PALETTE.gold} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dreamLockTitle}>Dream journal — Deeper Sky</Text>
                      <Text style={styles.dreamLockSub}>Log and search your dreams with Deeper Sky</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={PALETTE.gold} />
                  </LinearGradient>
                </Pressable>
              )}

              {/* Dream feelings */}
              {isPremium && dreamText.trim().length > 0 && (
                <>
                  <Text style={styles.fieldLabel}>How did the dream feel?</Text>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setShowFeelingPicker(prev => !prev);
                      if (!showFeelingPicker) { setFeelingSearch(''); setDebouncedSearch(''); }
                    }}
                    style={styles.dreamMoodDropdown}
                  >
                    <Text style={selectedFeelings.length > 0 ? styles.dreamMoodDropdownText : styles.dreamMoodDropdownPlaceholder}>
                      {selectedFeelings.length > 0 ? selectedFeelingLabels : 'Tap to select feelings…'}
                    </Text>
                    <Ionicons name={showFeelingPicker ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
                  </Pressable>

                  {showFeelingPicker && (
                    <View style={styles.dreamMoodOptions}>
                      {/* Tier selector */}
                      <View style={styles.tierRow}>
                        {FEELING_TIERS.map(tier => {
                          const isActive = selectedTier === tier.id;
                          const tierCount = tier.id === 'all' ? selectedFeelings.length : selectedFeelings.filter(f => FEELING_LOOKUP.get(f.id)?.tier === tier.id).length;
                          return (
                            <Pressable
                              key={tier.id}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                setSelectedTier(prev => prev === tier.id ? null : tier.id);
                                setFeelingSearch(''); setDebouncedSearch('');
                              }}
                              style={[styles.tierPill, isActive && { backgroundColor: tier.color + '22', borderColor: tier.color }]}
                            >
                              <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                              <Text style={[styles.tierPillText, isActive && { color: tier.color }]}>{tier.label}</Text>
                              {tierCount > 0 && (
                                <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
                                  <Text style={styles.tierBadgeText}>{tierCount}</Text>
                                </View>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Search input */}
                      {selectedTier && (
                        <View style={styles.feelingSearchRow}>
                          <Ionicons name="search-outline" size={18} color={theme.textMuted} />
                          <TextInput
                            style={styles.feelingSearchInput}
                            value={feelingSearch}
                            onChangeText={setFeelingSearch}
                            placeholder="Search feelings…"
                            placeholderTextColor={theme.textMuted}
                            autoCorrect={false}
                          />
                          {feelingSearch.length > 0 && (
                            <Pressable onPress={() => { setFeelingSearch(''); setDebouncedSearch(''); }}>
                              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                            </Pressable>
                          )}
                        </View>
                      )}

                      {/* Feeling list */}
                      {selectedTier && filteredFeelings.length > 0 && (
                        <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                          {filteredFeelings.map(feel => {
                            const existing = selectedFeelings.find(f => f.id === feel.id);
                            return (
                              <FeelingItem
                                key={feel.id}
                                feel={feel}
                                isSelected={!!existing}
                                intensity={existing?.intensity ?? 0}
                                onToggle={handleToggleFeeling}
                                onIntensityChange={handleIntensityChange}
                              />
                            );
                          })}
                        </ScrollView>
                      )}

                      {selectedTier && filteredFeelings.length === 0 && debouncedSearch.length > 0 && (
                        <Text style={styles.tierHint}>No feelings match "{debouncedSearch}"</Text>
                      )}
                      {!selectedTier && (
                        <Text style={styles.tierHint}>Choose a category above to see feelings</Text>
                      )}
                    </View>
                  )}

                  {/* Dream metadata section */}
                  <Pressable
                    onPress={() => { Haptics.selectionAsync().catch(() => {}); setShowMetadata(prev => !prev); }}
                    style={[styles.dreamMoodDropdown, { marginTop: 12 }]}
                  >
                    <Text style={styles.dreamMoodDropdownText}>Dream details</Text>
                    <Ionicons name={showMetadata ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
                  </Pressable>
                  
                  {showMetadata && (
                    <View style={styles.metadataSection}>
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Vividness</Text>
                        <View style={styles.intensityDots}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Pressable key={n} onPress={() => { Haptics.selectionAsync().catch(() => {}); setDreamMetadata(prev => ({ ...prev, vividness: n })); }} style={[styles.intensityDot, n <= dreamMetadata.vividness && styles.intensityDotActive]}>
                              <Text style={[styles.intensityDotText, n <= dreamMetadata.vividness && styles.intensityDotTextActive]}>{n}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Lucidity</Text>
                        <View style={styles.intensityDots}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Pressable key={n} onPress={() => { Haptics.selectionAsync().catch(() => {}); setDreamMetadata(prev => ({ ...prev, lucidity: n })); }} style={[styles.intensityDot, n <= dreamMetadata.lucidity && styles.intensityDotActive]}>
                              <Text style={[styles.intensityDotText, n <= dreamMetadata.lucidity && styles.intensityDotTextActive]}>{n}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Sense of control</Text>
                        <View style={styles.intensityDots}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Pressable key={n} onPress={() => { Haptics.selectionAsync().catch(() => {}); setDreamMetadata(prev => ({ ...prev, controlLevel: n })); }} style={[styles.intensityDot, n <= dreamMetadata.controlLevel && styles.intensityDotActive]}>
                              <Text style={[styles.intensityDotText, n <= dreamMetadata.controlLevel && styles.intensityDotTextActive]}>{n}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Overall theme</Text>
                        <View style={styles.awakenRow}>
                          {DREAM_THEMES.map(t => (
                            <Pressable key={t.id} onPress={() => { Haptics.selectionAsync().catch(() => {}); setDreamMetadata(prev => ({ ...prev, overallTheme: prev.overallTheme === t.id ? undefined : t.id })); }} style={[styles.awakenChip, dreamMetadata.overallTheme === t.id && styles.awakenChipActive]}>
                              <Text style={[styles.awakenChipText, dreamMetadata.overallTheme === t.id && styles.awakenChipTextActive]}>{t.label}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Woke up feeling</Text>
                        <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); setShowAwakenDropdown(prev => !prev); }} style={styles.awakenDropdown}>
                          <Text style={styles.awakenDropdownText}>{AWAKEN_STATES.find(s => s.id === dreamMetadata.awakenState)?.label ?? 'Calm'}</Text>
                          <Ionicons name={showAwakenDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
                        </Pressable>
                        {showAwakenDropdown && (
                          <View style={styles.awakenDropdownList}>
                            {AWAKEN_STATES.map(s => (
                              <Pressable key={s.id} onPress={() => { Haptics.selectionAsync().catch(() => {}); setDreamMetadata(prev => ({ ...prev, awakenState: s.id })); setShowAwakenDropdown(false); }} style={[styles.awakenDropdownItem, dreamMetadata.awakenState === s.id && styles.awakenDropdownItemActive]}>
                                <Text style={[styles.awakenDropdownItemText, dreamMetadata.awakenState === s.id && styles.awakenDropdownItemTextActive]}>{s.label}</Text>
                                {dreamMetadata.awakenState === s.id && <Ionicons name="checkmark" size={18} color={PALETTE.amethyst} />}
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                      
                      <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); setDreamMetadata(prev => ({ ...prev, recurring: !prev.recurring })); }} style={styles.recurringRow}>
                        <Text style={styles.metadataLabel}>Recurring dream?</Text>
                        <View style={[styles.toggleTrack, dreamMetadata.recurring && styles.toggleTrackActive]}>
                          <View style={[styles.toggleThumb, dreamMetadata.recurring && styles.toggleThumbActive]} />
                        </View>
                      </Pressable>
                    </View>
                  )}
                </>
              )}

              </View>

              {/* Somatic Pulse Monitor / Action Area */}
              {editingEntryId && !isEditingUnlocked ? (
                <View style={styles.pulseSection}>
                  <Text style={[styles.pulseLabel, { color: PALETTE.emerald, marginBottom: 12 }]}>Rest data sealed softly 🌙</Text>
                  <Pressable 
                    style={{ backgroundColor: 'transparent', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, alignSelf: 'center' }}
                    onPress={() => { Haptics.selectionAsync().catch(()=>{}); setIsEditingUnlocked(true); }}
                  >
                    <Text style={{ color: PALETTE.textMain, fontSize: 14, fontWeight: '600' }}>Edit Entry</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.pulseSection}>
                  <Text style={styles.pulseLabel}>Hold to seal your rest data</Text>
                  <Text style={styles.pulseHint}>Hold to seal and confirm</Text>
                  <SkiaPulseMonitor onSyncComplete={handleSave} />
                </View>
              )}

              {saveError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="warning-outline" size={18} color={PALETTE.copper} />
                  <Text style={styles.errorBannerText}>{saveError}</Text>
                  <Pressable onPress={() => setSaveError(null)}><Ionicons name="close" size={18} color={theme.textMuted} /></Pressable>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── Today's Dream Reflection (inline, premium) ── */}
          {(() => {
            const todayEntry = entries.find(e => e.date === today);
            const todayInterp = todayEntry ? interpretations[todayEntry.id] : null;
            if (!isPremium || !todayEntry?.dreamText || !todayInterp) return null;
            return (
              <Animated.View entering={FadeInDown.delay(180).duration(600)} style={styles.section}>
                <LinearGradient colors={['rgba(157, 118, 193, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.todayInterpretCard}>
                  <View style={styles.todayInterpretHeader}>
                    <Ionicons name="sparkles" size={18} color={PALETTE.amethyst} />
                    <Text style={styles.todayInterpretTitle}>Your Dream Reflection</Text>
                  </View>
                  <Text style={styles.interpretBody}>{todayInterp.paragraph}</Text>
                  {todayInterp.patternAnalysis?.undercurrentLabel ? (
                    <View style={styles.undercurrentBox}>
                      <Text style={styles.undercurrentLabel}>{todayInterp.patternAnalysis.undercurrentLabel}</Text>
                    </View>
                  ) : null}
                  <View style={styles.sitWithBox}>
                    <Text style={styles.sitWithLabel}>A question to sit with</Text>
                    <Text style={styles.sitWithText}>"{todayInterp.question}"</Text>
                                </View>
                                {/* <DreamSymbolChips symbols={todayInterp.extractedSymbols} /> */}
                </LinearGradient>
              </Animated.View>
            );
          })()}

          {/* ── Stats ── */}
          {stats.count > 0 && (
            <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Last 7 Days</Text>
              <View style={styles.statsRow}>
                <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(2,8,23,0.60)']} style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: PALETTE.silverBlue }]}>NIGHTS</Text>
                  <Text style={styles.statValue}>{stats.count}</Text>
                  <Text style={styles.statSub}>logged</Text>
                </LinearGradient>
                <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(2,8,23,0.60)']} style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: PALETTE.gold }]}>AVG SLEEP</Text>
                  <Text style={styles.statValue}>{stats.avgDuration != null ? formatDuration(stats.avgDuration) : '—'}</Text>
                  <Text style={styles.statSub}>per night</Text>
                </LinearGradient>
                <LinearGradient colors={['rgba(35, 40, 55, 0.6)', 'rgba(2,8,23,0.60)']} style={styles.statCard}>
                  <Text style={[styles.statLabel, { color: PALETTE.emerald }]}>AVG REST</Text>
                  <Text style={styles.statValue}>{stats.avgQuality != null ? `${stats.avgQuality.toFixed(1)}/5` : '—'}</Text>
                  <Text style={styles.statSub}>quality</Text>
                </LinearGradient>
              </View>
            </Animated.View>
          )}

          {/* ── Sleep Cycle Graph ── */}
          {historicalSleep.length >= 2 && (
            <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Trends</Text>
              <LinearGradient
                colors={['rgba(15, 18, 28, 0.85)', 'rgba(10, 13, 22, 0.95)']}
                style={styles.obsidianCard}
              >
                <View style={styles.obsidianCardHeader}>
                  <Ionicons name="moon-outline" size={14} color={PALETTE.silverBlue} />
                  <Text style={styles.obsidianCardEyebrow}>Nightly Ascent</Text>
                </View>
                <SkiaSleepGraph
                  data={historicalSleep}
                  width={SCREEN_W - 80}
                  height={140}
                />
                <View style={styles.obsidianCardFooter}>
                  <Text style={styles.obsidianCardFooterText}>
                    {historicalSleep.length} night{historicalSleep.length !== 1 ? 's' : ''} · Height = duration · Glow = quality
                  </Text>
                </View>
              </LinearGradient>

              {/* ── Sleep Insight: Sleep Quality vs Morning Mood ── */}
              {recentCheckIns.length >= 2 && isPremium && (
                <View style={{ marginTop: 16 }}>
                  <SkiaRestorationInsight
                    data={historicalSleep.slice(-7).map((sp, i) => {
                      const ci = recentCheckIns.find(c => c.date === sp.date);
                      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      const d = new Date(sp.date + 'T12:00:00');
                      return {
                        label: dayNames[d.getDay()] || '',
                        quality: sp.quality,
                        moodScore: ci?.moodScore ?? 5,
                      };
                    })}
                    title="Sleep Quality vs. Morning Mood"
                  />
                </View>
              )}
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
                      onPress={() => { Haptics.selectionAsync().catch(() => {}); applyEntryToForm(entry); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}
                      onLongPress={() => handleDelete(entry.id)}
                    >
                      <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.entryCardInner}>
                        <View style={styles.entryHeader}>
                          <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                          <View style={styles.entryMeta}>
                            {entry.durationHours != null && (
                              <View style={styles.entryMetaItem}>
                                <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                                <Text style={styles.entryMetaText}>{formatDuration(entry.durationHours)}</Text>
                              </View>
                            )}
                            {entry.quality != null && (
                              <View style={styles.entryMoons}>
                                {[1, 2, 3, 4, 5].map(n => (
                                  <Ionicons key={n} name={n <= entry.quality! ? 'moon' : 'moon-outline'} size={12} color={n <= entry.quality! ? PALETTE.silverBlue : 'rgba(255,255,255,0.15)'} />
                                ))}
                              </View>
                            )}
                          </View>
                        </View>

                        {entry.dreamText ? <Text style={styles.entryDream} numberOfLines={isExpanded ? undefined : 2}>{entry.dreamText}</Text> : null}

                        {entry.dreamMood || entry.dreamFeelings ? (
                          <View style={styles.entryDreamMoodRow}>
                            <Text style={styles.entryDreamMoodText}>
                              {entry.dreamFeelings ? (() => { try { const parsed = JSON.parse(entry.dreamFeelings) as SelectedFeeling[]; return parsed.map(f => FEELING_LOOKUP.get(f.id)?.label ?? f.id).join(', '); } catch { return entry.dreamMood ?? ''; } })() : entry.dreamMood ?? ''}
                            </Text>
                          </View>
                        ) : null}

                        {isPremium && entry.dreamText ? (
                          <Pressable onPress={() => handleDreamReflect(entry)} style={({ pressed }) => [styles.reflectBtn, pressed && styles.reflectBtnPressed]}>
                            <Ionicons name={isExpanded ? 'chevron-up' : 'sparkles'} size={14} color={PALETTE.amethyst} />
                            <Text style={styles.reflectBtnText}>{isExpanded ? 'Close reflection' : 'Reflect on this dream'}</Text>
                            <Ionicons name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} color={PALETTE.amethyst} style={{ marginLeft: 'auto' }} />
                          </Pressable>
                        ) : null}
                      </LinearGradient>
                    </Pressable>

                    {isExpanded && interp && (
                      <Animated.View entering={FadeInDown.duration(400)}>
                        <LinearGradient colors={['rgba(157, 118, 193, 0.1)', 'rgba(2,8,23,0.50)']} style={styles.interpretCard}>
                          <Text style={styles.interpretBody}>{interp.paragraph}</Text>
                          {interp.patternAnalysis?.undercurrentLabel ? (
                            <View style={styles.undercurrentBox}>
                              <Text style={styles.undercurrentLabel}>{interp.patternAnalysis.undercurrentLabel}</Text>
                            </View>
                          ) : null}
                          <View style={styles.sitWithBox}>
                            <Text style={styles.sitWithLabel}>A question to sit with</Text>
                            <Text style={styles.sitWithText}>"{interp.question}"</Text>
                          </View>
                          {/* <DreamSymbolChips symbols={interp.extractedSymbols} /> */}
                        </LinearGradient>
                      </Animated.View>
                    )}
                  </View>
                );
              })}
              <Text style={styles.deleteHint}>Tap to edit · Long press to delete</Text>
            </Animated.View>
          )}

          {loadError && entries.length === 0 && (
            <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={48} color={PALETTE.copper} />
              <Text style={styles.emptyTitle}>Could not load data</Text>
              <Text style={styles.emptySubtitle}>{loadError}</Text>
            </Animated.View>
          )}

          {!loading && !loadError && entries.length === 0 && (
            <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.emptyState}>
              <Ionicons name="moon-outline" size={56} color={theme.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Your sleep story starts here</Text>
              <Text style={styles.emptySubtitle}>Log your first night above. Even just a quality rating helps you spot patterns over time.</Text>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  header: { marginTop: 16, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '700', color: theme.textPrimary, fontFamily: 'serif', letterSpacing: 0.5 },
  subtitle: { color: theme.textSecondary, fontSize: 15, fontStyle: 'italic', marginTop: 4 },

  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 16, paddingLeft: 4 },

  formCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
  },
  formTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  formTitle: { fontSize: 20, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), flex: 1 },
  
  cancelEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'transparent' },
  cancelEditText: { fontSize: 13, color: theme.textMuted, fontWeight: '600' },
  
  fieldLabel: { fontSize: 14, fontWeight: '600', color: PALETTE.textMain, marginBottom: 12, marginTop: 24 },
  
  qualityRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  moonBtn: { padding: 4 },

  stepperRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', borderRadius: 16, borderWidth: 1, borderColor: PALETTE.glassBorder, overflow: 'hidden', marginBottom: 6 },
  stepperBtn: { paddingHorizontal: 24, paddingVertical: 16, justifyContent: 'center', alignItems: 'center' },
  stepperValue: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  stepperValueText: { fontSize: 24, fontWeight: '700', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  stepperPlaceholder: { color: theme.textMuted, fontWeight: '400', fontSize: 24 },
  stepperHint: { fontSize: 12, color: theme.textMuted, textAlign: 'center', fontStyle: 'italic', marginBottom: 8 },

  dreamInput: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderRadius: 16,
    padding: 16,
    color: PALETTE.textMain,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    marginBottom: 8,
  },
  dreamLock: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(232,214,174,0.18)', padding: 16, marginBottom: 8 },
  dreamLockTitle: { fontSize: 14, fontWeight: '600', color: PALETTE.gold, marginBottom: 4 },
  dreamLockSub: { fontSize: 13, color: theme.textMuted, lineHeight: 18 },

  dreamMoodDropdown: { backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dreamMoodDropdownText: { color: PALETTE.textMain, fontSize: 15, fontWeight: '500' },
  dreamMoodDropdownPlaceholder: { color: theme.textMuted, fontSize: 15 },
  dreamMoodOptions: { backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  dreamMoodOption: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  dreamMoodOptionSelected: { backgroundColor: 'rgba(157, 118, 193, 0.15)' },
  dreamMoodOptionText: { color: PALETTE.textMain, fontSize: 15 },
  dreamMoodOptionTextSelected: { color: PALETTE.amethyst, fontWeight: '600' },

  feelingSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  feelingSearchInput: { flex: 1, color: PALETTE.textMain, fontSize: 15, height: 40 },

  tierRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tierPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'transparent' },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  tierPillText: { color: theme.textSecondary, fontSize: 14, fontWeight: '600' },
  tierBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  tierBadgeText: { color: '#020817', fontSize: 11, fontWeight: '700' },
  tierHint: { color: theme.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 24, paddingHorizontal: 16, fontStyle: 'italic' },

  intensityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  intensityLabel: { fontSize: 13, color: theme.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  intensityDots: { flexDirection: 'row', gap: 8 },
  intensityDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder, alignItems: 'center', justifyContent: 'center' },
  intensityDotActive: { backgroundColor: 'rgba(157, 118, 193, 0.25)', borderColor: PALETTE.amethyst },
  intensityDotText: { fontSize: 14, color: theme.textMuted, fontWeight: '600' },
  intensityDotTextActive: { color: PALETTE.amethyst },

  metadataSection: { backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16, marginBottom: 12, padding: 16 },
  metadataRow: { marginBottom: 20 },
  metadataLabel: { fontSize: 14, color: theme.textSecondary, fontWeight: '600', marginBottom: 12 },
  
  awakenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  awakenChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder },
  awakenChipActive: { backgroundColor: 'rgba(157, 118, 193, 0.2)', borderColor: PALETTE.amethyst },
  awakenChipText: { fontSize: 14, color: theme.textMuted, fontWeight: '500' },
  awakenChipTextActive: { color: PALETTE.amethyst, fontWeight: '600' },

  awakenDropdown: { backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  awakenDropdownText: { color: PALETTE.textMain, fontSize: 15, fontWeight: '500' },
  awakenDropdownList: { backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16, marginTop: 8, overflow: 'hidden' },
  awakenDropdownItem: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  awakenDropdownItemActive: { backgroundColor: 'rgba(157, 118, 193, 0.15)' },
  awakenDropdownItemText: { fontSize: 15, color: theme.textSecondary, fontWeight: '500' },
  awakenDropdownItemTextActive: { color: PALETTE.amethyst, fontWeight: '600' },

  recurringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  toggleTrack: { width: 50, height: 28, borderRadius: 14, backgroundColor: 'transparent', justifyContent: 'center', paddingHorizontal: 3 },
  toggleTrackActive: { backgroundColor: 'rgba(157, 118, 193, 0.4)' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: theme.textMuted },
  toggleThumbActive: { alignSelf: 'flex-end', backgroundColor: PALETTE.amethyst },

  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  saveBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232,214,174,0.25)', borderRadius: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: PALETTE.gold },
  saveBtnTextDisabled: { color: theme.textMuted },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(205, 127, 93, 0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(205, 127, 93, 0.3)', padding: 14, marginTop: 16 },
  errorBannerText: { flex: 1, color: PALETTE.copper, fontSize: 14, lineHeight: 20 },

  // Obsidian card (Sleep Trends)
  obsidianCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 196, 232, 0.08)',
    borderTopColor: 'rgba(139, 196, 232, 0.15)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  obsidianCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  obsidianCardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.silverBlue,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  obsidianCardFooter: {
    marginTop: 10,
    alignSelf: 'center',
  },
  obsidianCardFooterText: {
    fontSize: 11,
    color: 'rgba(240, 234, 214, 0.3)',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: PALETTE.glassBorder, borderTopColor: PALETTE.glassHighlight, minHeight: 90, justifyContent: 'center' },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', color: PALETTE.textMain },
  statSub: { fontSize: 11, color: theme.textMuted, marginTop: 4, textAlign: 'center', fontStyle: 'italic' },

  entryCard: { marginBottom: 16 },
  entryCardInner: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, borderTopColor: PALETTE.glassHighlight },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  entryDate: { fontSize: 16, fontWeight: '600', color: PALETTE.textMain },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entryMetaText: { fontSize: 13, color: theme.textMuted, fontWeight: '500' },
  entryMoons: { flexDirection: 'row', gap: 2 },
  entryDream: { fontSize: 15, color: theme.textSecondary, lineHeight: 24, fontStyle: 'italic', marginBottom: 8 },
  entryDreamMoodRow: { marginTop: 4 },
  entryDreamMoodText: { fontSize: 13, color: theme.textMuted, fontWeight: '500' },
  deleteHint: { fontSize: 12, color: theme.textMuted, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },

  reflectBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(157, 118, 193, 0.1)', borderWidth: 1, borderColor: 'rgba(157, 118, 193, 0.2)' },
  reflectBtnPressed: { opacity: 0.7 },
  reflectBtnText: { fontSize: 14, color: PALETTE.amethyst, fontWeight: '600' },
  
  todayInterpretCard: { borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(157, 118, 193, 0.25)', borderTopColor: 'rgba(157, 118, 193, 0.4)' },
  todayInterpretHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  todayInterpretTitle: { fontSize: 18, fontWeight: '700', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  interpretCard: { borderRadius: 20, padding: 24, marginTop: 6, borderWidth: 1, borderColor: 'rgba(157, 118, 193, 0.2)' },
  interpretBody: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
  
  undercurrentBox: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start', borderRadius: 12, backgroundColor: 'rgba(157, 118, 193, 0.10)', borderWidth: 1, borderColor: 'rgba(157, 118, 193, 0.18)' },
  undercurrentLabel: { fontSize: 12, fontWeight: '600', color: PALETTE.amethyst, letterSpacing: 0.8, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },

  sitWithBox: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(157, 118, 193, 0.15)' },
  sitWithLabel: { fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  sitWithText: { fontSize: 16, color: PALETTE.textMain, lineHeight: 24, fontStyle: 'italic', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },

  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), textAlign: 'center', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Pulse monitor
  pulseSection: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  pulseLabel: { color: PALETTE.textMain, fontSize: 15, fontWeight: '700', letterSpacing: 0.3, textAlign: 'center' },
  pulseHint: { color: theme.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
});
