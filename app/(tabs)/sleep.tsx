/**
 * File: app/(tabs)/sleep.tsx
 * Sleep Tab — Rest tracking & dream journal
 */

import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { useRouter, Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Defs, RadialGradient, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaRestorationField from '../../components/ui/SkiaRestorationField';
import SkiaRestorationInsight from '../../components/ui/SkiaRestorationInsight';

import { localDb } from '../../services/storage/localDb';
import { SleepEntry, generateId } from '../../services/storage/models';
import { logger } from '../../utils/logger';
import { usePremium } from '../../context/PremiumContext';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { NatalChart } from '../../services/astrology/types';
import { DailyCheckIn } from '../../services/patterns/types';
import { generateDreamInterpretation } from '../../services/premium/dreamInterpretation';
import {
  generateGeminiDreamInterpretation,
  isGeminiAvailable,
  GeminiDreamResult,
} from '../../services/premium/geminiDreamInterpretation';
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
import SkiaSleepGraph, { SleepPoint } from '../../components/ui/SkiaSleepGraph';
import { DreamClusterMap } from '../../components/ui/DreamClusterMap';
import { useSyncDreamData } from '../../hooks/useSyncDreamData';
import SkiaPulseMonitor from '../../components/ui/SkiaPulseMonitor';
import SegmentRating from '../../components/ui/SegmentRating';
import AwakenStateSheet from '../../components/ui/AwakenStateSheet';
import PremiumPill from '../../components/ui/PremiumPill';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';

const SCREEN_W = Dimensions.get('window').width;

// ── Cinematic Palette (Obsidian & Gold) ──
const PALETTE = {
  bg: '#050507',
  cardBg: 'rgba(15, 18, 25, 0.65)',
  gold: '#C9AE78',
  goldGlow: 'rgba(201, 174, 120, 0.15)',
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  emerald: '#C9AE78',
  amethyst: '#C9AE78',
  textMain: '#F0EAD6',
  textMuted: 'rgba(240, 234, 214, 0.4)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassHighlight: 'rgba(255,255,255,0.15)',
};

// ── Volumetric 3D Moon Rating Component ──
const VolumetricMoon = memo(function VolumetricMoon({ active, size = 38 }: { active: boolean; size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {active && (
        <View style={[StyleSheet.absoluteFill, {
          backgroundColor: PALETTE.gold,
          borderRadius: size / 2,
          opacity: 0.15,
          transform: [{ scale: 1.4 }],
          shadowColor: PALETTE.gold,
          shadowRadius: 10,
          shadowOpacity: 0.5,
        }]} />
      )}
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <RadialGradient id="activeGrad" cx="30%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#FFF9EA" />
            <Stop offset="50%" stopColor={PALETTE.gold} />
            <Stop offset="100%" stopColor="#8A7B5E" />
          </RadialGradient>
          <SvgLinearGradient id="inactiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1A1C23" />
            <Stop offset="100%" stopColor="#0A0C10" />
          </SvgLinearGradient>
          <SvgLinearGradient id="rimLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx="20" cy="20" r="18" fill={active ? 'url(#activeGrad)' : 'url(#inactiveGrad)'} />
        <Circle cx="20" cy="20" r="18" fill="none" stroke="url(#rimLight)" strokeWidth="1" opacity={active ? 0.8 : 0.3} />
      </Svg>
    </View>
  );
});

// ── Feeling Item (memoized row for the feeling picker) ──
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
        {isSelected ? (
          <MetallicText color={PALETTE.amethyst} style={[styles.dreamMoodOptionText, styles.dreamMoodOptionTextSelected]}>
            {feel.label}
          </MetallicText>
        ) : (
          <Text style={styles.dreamMoodOptionText}>
            {feel.label}
          </Text>
        )}
        {isSelected && <MetallicIcon name="checkmark-outline" size={18} variant="gold" />}
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
                {n <= intensity ? (
                  <MetallicText color={PALETTE.amethyst} style={[styles.intensityDotText, styles.intensityDotTextActive]}>{n}</MetallicText>
                ) : (
                  <Text style={styles.intensityDotText}>{n}</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

// ── Type & Data Definitions ──
const FEELING_TIERS: { id: FeelingTier; label: string; color: string }[] = [
  { id: 'negative', label: 'Mostly Negative', color: PALETTE.copper },
  { id: 'positive', label: 'Mostly Positive', color: PALETTE.emerald },
  { id: 'mixed',    label: 'Mixed',           color: PALETTE.gold },
  { id: 'hard',     label: 'Hard to name',    color: PALETTE.amethyst },
  { id: 'all',      label: 'All',             color: PALETTE.silverBlue },
];

const FEELING_LOOKUP: Map<string, typeof DREAM_FEELINGS[number]> = new Map(
  DREAM_FEELINGS.map(f => [f.id, f]),
);

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

const AWAKEN_STATES: { id: AwakenState; label: string }[] = [
  { id: 'calm', label: 'Calm' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'scared', label: 'Scared' },
  { id: 'relieved', label: 'Relieved' },
  { id: 'confused', label: 'Confused' },
  { id: 'curious', label: 'Curious' },
  { id: 'sad', label: 'Sad' },
  { id: 'happy', label: 'Happy' },
  { id: 'peaceful', label: 'Peaceful' },
  { id: 'tired', label: 'Tired' },
  { id: 'energized', label: 'Energized' },
  { id: 'shaken', label: 'Shaken' },
  { id: 'disturbed', label: 'Disturbed' },
  { id: 'thoughtful', label: 'Thoughtful' },
  { id: 'inspired', label: 'Inspired' },
  { id: 'numb', label: 'Numb' },
  { id: 'grateful', label: 'Grateful' },
  { id: 'overwhelmed', label: 'Overwhelmed' },
  { id: 'hopeful', label: 'Hopeful' },
  { id: 'unsettled', label: 'Unsettled' },
];

const DREAM_THEMES: { id: DreamTheme; label: string }[] = [
  { id: 'adventure', label: 'Adventure' }, { id: 'conflict', label: 'Conflict' }, { id: 'connection', label: 'Connection' },
  { id: 'transformation', label: 'Transformation' }, { id: 'mystery', label: 'Mystery' }, { id: 'survival', label: 'Survival / Escape' },
  { id: 'loss', label: 'Loss / Grief' }, { id: 'discovery', label: 'Discovery' }, { id: 'mundane', label: 'Everyday Life' }, { id: 'surreal', label: 'Surreal' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (dateStr === todayStr) return 'Today';
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

// ── Component ──
export default function SleepScreen() {
  const { isPremium } = usePremium();
  const router = useRouter();
  useSyncDreamData();

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
  const [interpretations, setInterpretations] = useState<Record<string, DreamInterpretation>>({});
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Gemini AI interpretation state
  const [aiInterpretations, setAiInterpretations] = useState<Record<string, GeminiDreamResult>>({});
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [quality, setQuality] = useState(0);
  const [durationHours, setDurationHours] = useState(7.5);
  const [hasDuration, setHasDuration] = useState(false);
  const [dreamText, setDreamText] = useState('');

  const [selectedFeelings, setSelectedFeelings] = useState<SelectedFeeling[]>([]);
  const [dreamMetadata, setDreamMetadata] = useState<DreamMetadata>({
    vividness: 3, lucidity: 1, controlLevel: 3, awakenState: 'calm', recurring: false,
  });

  const [showAwakenSheet, setShowAwakenSheet] = useState(false);
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [selectedTier, setSelectedTier] = useState<FeelingTier | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);

  const [feelingSearch, setFeelingSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditingUnlocked, setIsEditingUnlocked] = useState(false);

  const today = useMemo(() => {
    const now = new Date();
    if (now.getHours() < 6) now.setDate(now.getDate() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

  const selectedFeelingLabels = useMemo(() => {
    const labels = selectedFeelings.map(f => FEELING_LOOKUP.get(f.id)?.label ?? f.id);
    if (labels.length <= 4) return labels.join(', ');
    return `${labels.slice(0, 4).join(', ')} +${labels.length - 4} more`;
  }, [selectedFeelings]);

  const applyEntryToForm = useCallback((entry: SleepEntry | undefined) => {
    if (entry) {
      setEditingEntryId(entry.id);
      setIsEditingUnlocked(false);
      setEditingDate(entry.date);
      setQuality(entry.quality ?? 0);
      if (entry.durationHours != null) { setHasDuration(true); setDurationHours(entry.durationHours); }
      else { setHasDuration(false); setDurationHours(7.5); }
      setDreamText(entry.dreamText ?? '');
      if (entry.dreamFeelings) {
        try { const parsed = JSON.parse(entry.dreamFeelings) as SelectedFeeling[]; setSelectedFeelings(Array.isArray(parsed) ? parsed : []); }
        catch { setSelectedFeelings([]); }
      } else { setSelectedFeelings([]); }
      if (entry.dreamMetadata) {
        try { setDreamMetadata(JSON.parse(entry.dreamMetadata) as DreamMetadata); }
        catch { setDreamMetadata({ vividness: 3, lucidity: 1, controlLevel: 3, awakenState: 'calm', recurring: false }); }
      } else { setDreamMetadata({ vividness: 3, lucidity: 1, controlLevel: 3, awakenState: 'calm', recurring: false }); }
      setShowAwakenSheet(false);
      setShowFeelingPicker(false);
      setSelectedTier(null);
      setShowMetadata(false);
    } else {
      setEditingEntryId(null); setIsEditingUnlocked(false); setEditingDate(null); setQuality(0);
      setDurationHours(7.5); setHasDuration(false); setDreamText(''); setSelectedFeelings([]);
      setDreamMetadata({ vividness: 3, lucidity: 1, controlLevel: 3, awakenState: 'calm', recurring: false });
      setShowAwakenSheet(false); setShowFeelingPicker(false); setSelectedTier(null); setShowMetadata(false);
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
          setChartId(savedChart.id);
          const [data, checkIns] = await Promise.all([
            localDb.getSleepEntries(savedChart.id, 30),
            localDb.getCheckIns(savedChart.id, 30),
          ]);
          setEntries(data); setRecentCheckIns(checkIns);
          applyEntryToForm(data.find(e => e.date === today));
          try {
            setNatalChart(AstrologyCalculator.generateNatalChart({
              date: savedChart.birthDate, time: savedChart.birthTime, hasUnknownTime: savedChart.hasUnknownTime,
              place: savedChart.birthPlace, latitude: savedChart.latitude, longitude: savedChart.longitude,
              timezone: savedChart.timezone, houseSystem: savedChart.houseSystem,
            }));
          } catch {}
        } catch (e) {
          logger.error('Sleep load failed:', e);
          setLoadError('Could not load your sleep data.');
        } finally { setLoading(false); }
      })();
    }, [applyEntryToForm, today])
  );

  const canSave = quality > 0 || hasDuration || dreamText.trim().length > 0;

  const handleSave = async () => {
    if (!chartId || !canSave || saving) return;
    try {
      setSaving(true);
      setSaveError(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const now = new Date().toISOString();
      const existingCreatedAt = editingEntryId ? entries.find(e => e.id === editingEntryId)?.createdAt ?? now : now;
      const entry: SleepEntry = {
        id: editingEntryId ?? generateId(), chartId, date: editingDate ?? today,
        durationHours: hasDuration ? durationHours : undefined,
        quality: quality > 0 ? quality : undefined,
        dreamText: dreamText.trim() || undefined,
        dreamMood: undefined,
        dreamFeelings: selectedFeelings.length > 0 ? JSON.stringify(selectedFeelings) : undefined,
        dreamMetadata: dreamText.trim().length > 0 ? JSON.stringify(dreamMetadata) : undefined,
        notes: undefined,
        createdAt: existingCreatedAt, updatedAt: now, isDeleted: false,
      };
      await localDb.saveSleepEntry(entry);
      const updated = await localDb.getSleepEntries(chartId, 30);
      setEntries(updated);
      const savedEntry = updated.find(e => e.id === entry.id);
      const savedId = entry.id;
      setInterpretations(prev => { const next = { ...prev }; delete next[savedId]; return next; });
      if (isPremium && savedEntry?.dreamText) {
        try {
          const aggregates = computeDreamAggregates(selectedFeelings, natalChart);
          const patterns = computeDreamPatterns(selectedFeelings, updated.filter(e => e.id !== savedEntry.id));
          const result = generateDreamInterpretation({ entry: savedEntry, dreamText: savedEntry.dreamText, feelings: selectedFeelings, metadata: dreamMetadata, aggregates, patterns });
          setInterpretations(prev => ({ ...prev, [savedEntry.id]: result }));
          setExpandedEntryId(savedEntry.id);
          // Auto-trigger Gemini AI interpretation for premium users
          if (isGeminiAvailable()) {
            setAiLoading(savedEntry.id);
            generateGeminiDreamInterpretation({
              dreamText: savedEntry.dreamText,
              feelings: selectedFeelings,
              onDeviceSummary: result.paragraph,
              symbols: result.extractedSymbols,
              interpretiveThemes: result.interpretiveThemes,
              patternAnalysis: result.patternAnalysis ? {
                primaryPattern: result.patternAnalysis.primaryPattern,
                undercurrentLabel: result.patternAnalysis.undercurrentLabel,
                endingType: result.patternAnalysis.endingType,
              } : undefined,
            }).then(aiRes => {
              setAiInterpretations(prev => ({ ...prev, [savedEntry.id]: aiRes }));
            }).catch(e => {
              logger.error('[Sleep] Auto AI interpretation failed:', e);
              setAiError(e.message ?? 'AI interpretation failed');
            }).finally(() => setAiLoading(null));
          }
        } catch (e) { logger.error('Auto dream interpretation failed:', e); }
      } else {
        if (expandedEntryId === savedId) setExpandedEntryId(null);
      }
      applyEntryToForm(savedEntry);
      setSaving(false); setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      logger.error('Sleep save failed:', e);
      const msg = 'Could not save entry. Please try again.';
      setSaveError(msg);
      Alert.alert('Save Error', msg);
      setSaving(false);
    }
  };

  const handleDreamReflect = useCallback((entry: SleepEntry) => {
    if (!entry.dreamText) return;
    if (expandedEntryId === entry.id) { setExpandedEntryId(null); return; }
    setExpandedEntryId(entry.id);
    Haptics.selectionAsync().catch(() => {});
    try {
      let feelings: SelectedFeeling[] = [];
      let metadata: DreamMetadata = { vividness: 3, lucidity: 1, controlLevel: 3, awakenState: 'calm', recurring: false };
      if (entry.dreamFeelings) { try { feelings = JSON.parse(entry.dreamFeelings); } catch {} }
      if (entry.dreamMetadata) { try { metadata = JSON.parse(entry.dreamMetadata); } catch {} }
      const aggregates = computeDreamAggregates(feelings, natalChart);
      const patterns = computeDreamPatterns(feelings, entries.filter(e => e.id !== entry.id));
      const result = generateDreamInterpretation({ entry, dreamText: entry.dreamText, feelings, metadata, aggregates, patterns });
      setInterpretations(prev => ({ ...prev, [entry.id]: result }));
      // Auto-trigger Gemini AI interpretation for premium users
      if (isPremium && isGeminiAvailable()) {
        setAiLoading(entry.id);
        generateGeminiDreamInterpretation({
          dreamText: entry.dreamText,
          feelings,
          onDeviceSummary: result.paragraph,
          symbols: result.extractedSymbols,
          interpretiveThemes: result.interpretiveThemes,
          patternAnalysis: result.patternAnalysis ? {
            primaryPattern: result.patternAnalysis.primaryPattern,
            undercurrentLabel: result.patternAnalysis.undercurrentLabel,
            endingType: result.patternAnalysis.endingType,
          } : undefined,
        }).then(aiRes => {
          setAiInterpretations(prev => ({ ...prev, [entry.id]: aiRes }));
        }).catch(e => {
          logger.error('[Sleep] Auto AI interpretation failed:', e);
        }).finally(() => setAiLoading(null));
      }
    } catch (e) {
      logger.error('Dream interpretation failed:', e);
      setExpandedEntryId(null);
    }
  }, [expandedEntryId, natalChart, entries]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Remove this sleep entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await localDb.deleteSleepEntry(id);
            if (chartId) {
              const updated = await localDb.getSleepEntries(chartId, 30);
              setEntries(updated);
              if (editingEntryId === id) applyEntryToForm(updated.find(e => e.date === today));
            }
          } catch (e) { logger.error('Sleep delete failed:', e); }
        },
      },
    ]);
  };

  const stats = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = entries.filter(e => new Date(e.date + 'T12:00:00') >= weekAgo);
    const durations = recent.filter(e => e.durationHours != null).map(e => e.durationHours!);
    const qualities = recent.filter(e => e.quality != null).map(e => e.quality!);
    return {
      count: recent.length,
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b) / durations.length : null,
      avgQuality: qualities.length > 0 ? qualities.reduce((a, b) => a + b) / qualities.length : null,
    };
  }, [entries]);

  const historicalSleep: SleepPoint[] = useMemo(() => {
    return entries.filter(e => e.durationHours != null || e.quality != null)
      .sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
      .map(e => ({ duration: e.durationHours ?? 0, quality: e.quality ?? 3, date: e.date }));
  }, [entries]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SkiaRestorationField quality={quality || 3} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back-outline" size={24} color={PALETTE.textMain} />
        </Pressable>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* ── High-End Typography Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Nightly Archive</Text>
            <GoldSubtitle style={styles.subtitle}>Circadian rest & symbolic memory</GoldSubtitle>
          </Animated.View>

          {/* ── Main Form (Volumetric Glass Card) ── */}
          <Animated.View entering={FadeInDown.delay(140).duration(600)} style={styles.section}>
            <View style={styles.formCard}>
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient colors={[PALETTE.cardBg, 'rgba(10, 12, 18, 0.85)']} style={StyleSheet.absoluteFill} />

              <View style={styles.formInner}>
                <View style={styles.formTitleRow}>
                  <Text style={styles.formTitle}>
                    {editingEntryId
                      ? editingDate === today
                        ? (isEditingUnlocked ? 'Editing today' : "Today's log")
                        : `Edit ${formatDate(editingDate!)}`
                      : 'How was last night?'}
                  </Text>
                  {editingEntryId && (editingDate !== today || isEditingUnlocked) && (
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setIsEditingUnlocked(false);
                        applyEntryToForm(entries.find(e => e.date === today));
                      }}
                      style={styles.cancelEditBtn}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={PALETTE.textMuted} />
                    </Pressable>
                  )}
                </View>

                <View pointerEvents={(editingEntryId && !isEditingUnlocked) ? 'none' : 'auto'} style={{ opacity: (editingEntryId && !isEditingUnlocked) ? 0.5 : 1 }}>

                  {/* ── Volumetric Moon Rating ── */}
                  <Text style={styles.fieldLabel}>Rest Quality</Text>
                  <View style={styles.qualityRow}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Pressable
                        key={n}
                        onPress={() => { Haptics.selectionAsync(); setQuality(n === quality ? 0 : n); }}
                      >
                        <VolumetricMoon active={n <= quality} />
                      </Pressable>
                    ))}
                  </View>
                  {quality > 0 && (
                    <Animated.View entering={FadeIn.duration(300)}>
                      <MetallicText style={styles.qualityStateLabel} variant="gold">
                        {['Exhausted', 'Restless', 'Moderate', 'Restored', 'Deeply Rested'][quality - 1]}
                      </MetallicText>
                    </Animated.View>
                  )}

                  {/* ── Hours Slept Picker ── */}
                  <Text style={[styles.fieldLabel, { marginTop: 32 }]}>Hours Slept</Text>
                  <View style={styles.hoursPickerRow}>
                    <Pressable
                      style={styles.hoursStepBtn}
                      onPress={() => { Haptics.selectionAsync(); setHasDuration(true); setDurationHours(h => Math.max(0.5, parseFloat((h - 0.5).toFixed(1)))); }}
                    >
                      <Ionicons name="remove-outline" size={22} color={PALETTE.textMain} />
                    </Pressable>
                    <Pressable
                      style={styles.hoursCircleDisplay}
                      onLongPress={() => { setHasDuration(false); setDurationHours(7.5); }}
                    >
                      <Text
                        style={[styles.hoursCircleValue, !hasDuration && { color: PALETTE.textMuted }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                      >
                        {hasDuration ? formatDuration(durationHours) : '—'}
                      </Text>
                      {hasDuration && (
                        <Text style={styles.hoursCircleQuality}>
                          {durationHours >= 8 ? 'Restorative' : durationHours >= 6 ? 'Moderate' : durationHours >= 4 ? 'Light' : 'Insufficient'}
                        </Text>
                      )}
                    </Pressable>
                    <Pressable
                      style={styles.hoursStepBtn}
                      onPress={() => { Haptics.selectionAsync(); setHasDuration(true); setDurationHours(h => Math.min(12, parseFloat((h + 0.5).toFixed(1)))); }}
                    >
                      <Ionicons name="add-outline" size={22} color={PALETTE.textMain} />
                    </Pressable>
                  </View>

                  {/* ── Dream Journal Section ── */}
                  <Text style={[styles.fieldLabel, { marginTop: 32 }]}>Dream Memory</Text>
                  <View style={[styles.dreamGlassCard, dreamText.length > 0 && styles.dreamGlassCardActive]}>
                    <TextInput
                      style={styles.dreamInputInner}
                      value={dreamText}
                      onChangeText={setDreamText}
                      placeholder="Fragments, feelings, or full narratives..."
                      placeholderTextColor={PALETTE.textMuted}
                      multiline
                      textAlignVertical="top"
                      selectionColor={PALETTE.gold}
                    />
                  </View>

                  {!isPremium && dreamText.trim().length > 0 && (
                    <Pressable onPress={() => router.push('/(tabs)/premium' as Href)} style={{ marginTop: 12 }}>
                      <LinearGradient colors={['rgba(157, 118, 193, 0.15)', 'rgba(10, 12, 18, 0.8)']} style={styles.premiumLockCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.premiumLockTitle, { color: PALETTE.textMain }]}>Symbolic Interpretation</Text>
                          <Text style={styles.premiumLockSub}>Deep analysis of archetypes and emotional patterns in your dreams.</Text>
                        </View>
                        <View style={styles.deeperSkyBadge}>
                          <MetallicIcon name="sparkles-outline" size={10} variant="gold" />
                          <MetallicText style={styles.deeperSkyBadgeText} variant="gold">DEEPER SKY</MetallicText>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  )}

                  {/* ── Dream Feelings Picker (shown when dream text is entered) ── */}
                  {dreamText.trim().length > 0 && (
                    <>
                      <Text style={[styles.fieldLabel, { marginTop: 24 }]}>How did the dream feel?</Text>
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
                          <View style={styles.tierRow}>
                            {FEELING_TIERS.map(tier => {
                              const isActive = selectedTier === tier.id;
                              const tierCount = tier.id === 'all'
                                ? selectedFeelings.length
                                : selectedFeelings.filter(f => FEELING_LOOKUP.get(f.id)?.tier === tier.id).length;
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

                          {selectedTier && (
                            <View style={styles.feelingSearchRow}>
                              <Ionicons name="search-outline" size={18} color={theme.textMuted} />
                              <TextInput
                                style={styles.feelingSearchInput}
                                value={feelingSearch}
                                onChangeText={setFeelingSearch}
                                placeholder="Search feelings"
                                placeholderTextColor={theme.textMuted}
                                autoCorrect={false}
                              />
                              {feelingSearch.length > 0 && (
                                <Pressable onPress={() => { setFeelingSearch(''); setDebouncedSearch(''); }}>
                                  <Ionicons name="close-circle-outline" size={18} color={theme.textMuted} />
                                </Pressable>
                              )}
                            </View>
                          )}

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

                      {/* ── Dream Details (metadata) ── */}
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
                            <SegmentRating value={dreamMetadata.vividness} onChange={n => setDreamMetadata(prev => ({ ...prev, vividness: n }))} />
                          </View>
                          <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Lucidity</Text>
                            <SegmentRating value={dreamMetadata.lucidity} onChange={n => setDreamMetadata(prev => ({ ...prev, lucidity: n }))} />
                          </View>
                          <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Sense of control</Text>
                            <SegmentRating value={dreamMetadata.controlLevel} onChange={n => setDreamMetadata(prev => ({ ...prev, controlLevel: n }))} />
                          </View>

                          <View style={[styles.metadataRow, { alignItems: 'flex-start', flexDirection: 'column', gap: 8 }]}>
                            <Text style={styles.metadataLabel}>Overall theme</Text>
                            <View style={styles.themeGrid}>
                              {DREAM_THEMES.map(t => (
                                <PremiumPill
                                  key={t.id}
                                  label={t.label}
                                  isSelected={dreamMetadata.overallTheme === t.id}
                                  onToggle={() => setDreamMetadata(prev => ({
                                    ...prev,
                                    overallTheme: prev.overallTheme === t.id ? undefined : t.id,
                                  }))}
                                  accentColor={PALETTE.amethyst}
                                />
                              ))}
                            </View>
                          </View>

                          <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Woke up feeling</Text>
                            <Pressable
                              onPress={() => { Haptics.selectionAsync().catch(() => {}); setShowAwakenSheet(true); }}
                              style={styles.awakenDropdown}
                            >
                              <Text style={styles.awakenDropdownText}>
                                {AWAKEN_STATES.find(s => s.id === dreamMetadata.awakenState)?.label ?? 'Calm'}
                              </Text>
                              <MetallicIcon name="chevron-up-outline" size={16} color={PALETTE.amethyst} />
                            </Pressable>
                          </View>

                          <Pressable
                            onPress={() => { Haptics.selectionAsync().catch(() => {}); setDreamMetadata(prev => ({ ...prev, recurring: !prev.recurring })); }}
                            style={styles.recurringRow}
                          >
                            <Text style={styles.metadataLabel}>Recurring dream?</Text>
                            <View style={[styles.toggleTrack, dreamMetadata.recurring && styles.toggleTrackActive]}>
                              <View style={[styles.toggleThumb, dreamMetadata.recurring && styles.toggleThumbActive]} />
                            </View>
                          </Pressable>
                        </View>
                      )}

                      <AwakenStateSheet
                        visible={showAwakenSheet}
                        options={AWAKEN_STATES}
                        selected={dreamMetadata.awakenState}
                        onSelect={id => setDreamMetadata(prev => ({ ...prev, awakenState: id as typeof prev.awakenState }))}
                        onClose={() => setShowAwakenSheet(false)}
                      />
                    </>
                  )}

                </View>

                {/* ── The Seal Artifact ── */}
                <View style={styles.sealSection}>
                  {editingEntryId && !isEditingUnlocked ? (
                    <View style={styles.pulseSection}>
                      <Text style={styles.pulseLabel}>Log Sealed</Text>
                      <Pressable style={styles.unlockBtn} onPress={() => { Haptics.selectionAsync(); setIsEditingUnlocked(true); }}>
                        <Text style={styles.unlockText}>Unlock to Edit</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.pulseSection}>
                      <Text style={styles.pulseLabel}>Hold to Seal Nightly Log</Text>
                      <SkiaPulseMonitor key={`seal-${editingEntryId ?? 'new'}-${String(isEditingUnlocked)}`} onSyncComplete={handleSave} />
                    </View>
                  )}
                </View>

                {saveError && (
                  <View style={styles.errorBanner}>
                    <MetallicIcon name="warning-outline" size={18} variant="copper" />
                    <MetallicText color={PALETTE.copper} style={styles.errorBannerText}>{saveError}</MetallicText>
                    <Pressable onPress={() => setSaveError(null)}>
                      <Ionicons name="close-outline" size={18} color={theme.textMuted} />
                    </Pressable>
                  </View>
                )}

              </View>
            </View>
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
                    <MetallicIcon name="sparkles-outline" size={18} variant="gold" />
                    <Text style={styles.todayInterpretTitle}>Your Dream Reflection</Text>
                  </View>
                  {/* Show AI result as primary when available, on-device as fallback */}
                  {(() => {
                    const aiResult = aiInterpretations[todayEntry.id];
                    const isLoadingAi = aiLoading === todayEntry.id;
                    if (aiResult) {
                      return (
                        <>
                          <Text style={styles.interpretBody}>{aiResult.paragraph}</Text>
                          <View style={styles.sitWithBox}>
                            <Text style={styles.sitWithLabel}>A question to sit with</Text>
                            <Text style={styles.sitWithText}>"{aiResult.question}"</Text>
                          </View>
                        </>
                      );
                    }
                    if (isLoadingAi) {
                      return (
                        <>
                          <Text style={styles.interpretBody}>{todayInterp.paragraph}</Text>
                          {todayInterp.patternAnalysis?.undercurrentLabel ? (
                            <View style={styles.undercurrentBox}>
                              <MetallicText color={PALETTE.amethyst} style={styles.undercurrentLabel}>{todayInterp.patternAnalysis.undercurrentLabel}</MetallicText>
                            </View>
                          ) : null}
                          <View style={styles.sitWithBox}>
                            <Text style={styles.sitWithLabel}>A question to sit with</Text>
                            <Text style={styles.sitWithText}>"{todayInterp.question}"</Text>
                          </View>
                          <View style={styles.aiLoadingRow}>
                            <MetallicIcon name="hourglass-outline" size={14} variant="gold" />
                            <Text style={styles.aiLoadingText}>Consulting the cosmos...</Text>
                          </View>
                        </>
                      );
                    }
                    // Gemini not available or failed — show on-device interpretation
                    return (
                      <>
                        <Text style={styles.interpretBody}>{todayInterp.paragraph}</Text>
                        {todayInterp.patternAnalysis?.undercurrentLabel ? (
                          <View style={styles.undercurrentBox}>
                            <MetallicText color={PALETTE.amethyst} style={styles.undercurrentLabel}>{todayInterp.patternAnalysis.undercurrentLabel}</MetallicText>
                          </View>
                        ) : null}
                        <View style={styles.sitWithBox}>
                          <Text style={styles.sitWithLabel}>A question to sit with</Text>
                          <Text style={styles.sitWithText}>"{todayInterp.question}"</Text>
                        </View>
                        {aiError && (
                          <Text style={styles.aiErrorText}>{aiError}</Text>
                        )}
                      </>
                    );
                  })()}
                </LinearGradient>
              </Animated.View>
            );
          })()}

          {/* ── Stats Section ── */}
          {stats.count > 0 && (
            <Animated.View entering={FadeInDown.delay(220).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Last 7 Days</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                  <MetallicText style={styles.statLabel} variant="gold">NIGHTS</MetallicText>
                  <Text style={styles.statValue}>{stats.count}</Text>
                  <Text style={styles.statSub}>logged</Text>
                </View>
                <View style={styles.statCard}>
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                  <MetallicText style={styles.statLabel} variant="gold">AVG SLEEP</MetallicText>
                  <Text style={styles.statValue}>{stats.avgDuration != null ? formatDuration(stats.avgDuration) : '—'}</Text>
                  <Text style={styles.statSub}>per night</Text>
                </View>
                <View style={styles.statCard}>
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                  <MetallicText style={styles.statLabel} variant="gold">AVG REST</MetallicText>
                  <Text style={styles.statValue}>{stats.avgQuality != null ? `${stats.avgQuality.toFixed(1)}/5` : '—'}</Text>
                  <Text style={styles.statSub}>quality</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Sleep Cycle Graph ── */}
          {historicalSleep.length >= 2 && (
            <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Trends</Text>
              <View style={styles.obsidianCard}>
                <LinearGradient colors={['rgba(20, 24, 35, 0.8)', 'rgba(10, 12, 18, 0.95)']} style={StyleSheet.absoluteFill} />
                <View style={styles.obsidianCardHeader}>
                  <MetallicIcon name="moon-outline" size={14} variant="gold" />
                  <MetallicText color={PALETTE.silverBlue} style={styles.obsidianCardEyebrow}>NIGHTLY ASCENT</MetallicText>
                </View>
                <SkiaSleepGraph data={historicalSleep} width={SCREEN_W - 80} height={140} />
                <View style={styles.obsidianCardFooter}>
                  <Text style={styles.obsidianCardFooterText}>
                    {historicalSleep.length} night{historicalSleep.length !== 1 ? 's' : ''} · Height = duration · Glow = quality
                  </Text>
                </View>
              </View>

              {recentCheckIns.length >= 2 && isPremium && (
                <View style={{ marginTop: 16 }}>
                  <SkiaRestorationInsight
                    data={historicalSleep.slice(-7).map((sp) => {
                      const ci = recentCheckIns.find(c => c.date === sp.date);
                      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      const d = new Date(sp.date + 'T12:00:00');
                      return { label: dayNames[d.getDay()] || '', quality: sp.quality, moodScore: ci?.moodScore ?? 5 };
                    })}
                    title="Sleep Quality vs. Morning Mood"
                  />
                </View>
              )}
            </Animated.View>
          )}

          {/* ── Dream Symbol Cluster (premium) ── */}
          {isPremium && entries.some(e => e.dreamText) && (
            <Animated.View entering={FadeInDown.delay(265).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Dream Symbols</Text>
              <View style={styles.obsidianCard}>
                <LinearGradient colors={['rgba(20, 24, 35, 0.8)', 'rgba(10, 12, 18, 0.95)']} style={StyleSheet.absoluteFill} />
                <View style={styles.obsidianCardHeader}>
                  <MetallicIcon name="planet-outline" size={14} variant="gold" />
                  <MetallicText color={PALETTE.silverBlue} style={styles.obsidianCardEyebrow}>RECURRING THEMES</MetallicText>
                </View>
                <DreamClusterMap height={280} />
              </View>
            </Animated.View>
          )}

          {/* ── Recent Nights History ── */}
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
                                {[1, 2, 3, 4, 5].map(n =>
                                  n <= entry.quality! ? (
                                    <MetallicIcon key={n} name="moon-outline" size={12} color={PALETTE.silverBlue} />
                                  ) : (
                                    <Ionicons key={n} name="moon-outline" size={12} color="rgba(255,255,255,0.15)" />
                                  )
                                )}
                              </View>
                            )}
                          </View>
                        </View>

                        {entry.dreamText ? <Text style={styles.entryDream} numberOfLines={isExpanded ? undefined : 2}>{entry.dreamText}</Text> : null}

                        {(entry.dreamMood || entry.dreamFeelings) ? (
                          <View style={styles.entryDreamMoodRow}>
                            <Text style={styles.entryDreamMoodText}>
                              {entry.dreamFeelings ? (() => {
                                try {
                                  const parsed = JSON.parse(entry.dreamFeelings) as SelectedFeeling[];
                                  return parsed.map(f => FEELING_LOOKUP.get(f.id)?.label ?? f.id).join(', ');
                                } catch { return entry.dreamMood ?? ''; }
                              })() : entry.dreamMood ?? ''}
                            </Text>
                          </View>
                        ) : null}

                        {isPremium && entry.dreamText ? (
                          <Pressable
                            onPress={() => handleDreamReflect(entry)}
                            style={({ pressed }) => [styles.reflectBtn, pressed && styles.reflectBtnPressed]}
                          >
                            <MetallicIcon name={isExpanded ? 'chevron-up' : 'sparkles'} size={14} variant="gold" />
                            <MetallicText color={PALETTE.amethyst} style={styles.reflectBtnText}>{isExpanded ? 'Close reflection' : 'Reflect on this dream'}</MetallicText>
                            <MetallicIcon name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} variant="gold" style={{ marginLeft: 'auto' }} />
                          </Pressable>
                        ) : null}
                      </LinearGradient>
                    </Pressable>

                    {isExpanded && interp && (
                      <Animated.View entering={FadeInDown.duration(300)}>
                        <LinearGradient colors={['rgba(157, 118, 193, 0.1)', 'rgba(2,8,23,0.50)']} style={styles.interpretCard}>
                          {(() => {
                            const aiResult = aiInterpretations[entry.id];
                            const isLoadingAi = aiLoading === entry.id;
                            if (aiResult) {
                              return (
                                <>
                                  <Text style={styles.interpretBody}>{aiResult.paragraph}</Text>
                                  <View style={styles.sitWithBox}>
                                    <Text style={styles.sitWithLabel}>A question to sit with</Text>
                                    <Text style={styles.sitWithText}>"{aiResult.question}"</Text>
                                  </View>
                                </>
                              );
                            }
                            if (isLoadingAi) {
                              return (
                                <>
                                  <Text style={styles.interpretBody}>{interp.paragraph}</Text>
                                  {interp.patternAnalysis?.undercurrentLabel ? (
                                    <View style={styles.undercurrentBox}>
                                      <MetallicText color={PALETTE.amethyst} style={styles.undercurrentLabel}>{interp.patternAnalysis.undercurrentLabel}</MetallicText>
                                    </View>
                                  ) : null}
                                  <View style={styles.sitWithBox}>
                                    <Text style={styles.sitWithLabel}>A question to sit with</Text>
                                    <Text style={styles.sitWithText}>"{interp.question}"</Text>
                                  </View>
                                  <View style={styles.aiLoadingRow}>
                                    <MetallicIcon name="hourglass-outline" size={14} variant="gold" />
                                    <Text style={styles.aiLoadingText}>Consulting the cosmos...</Text>
                                  </View>
                                </>
                              );
                            }
                            return (
                              <>
                                <Text style={styles.interpretBody}>{interp.paragraph}</Text>
                                {interp.patternAnalysis?.undercurrentLabel ? (
                                  <View style={styles.undercurrentBox}>
                                    <MetallicText color={PALETTE.amethyst} style={styles.undercurrentLabel}>{interp.patternAnalysis.undercurrentLabel}</MetallicText>
                                  </View>
                                ) : null}
                                <View style={styles.sitWithBox}>
                                  <Text style={styles.sitWithLabel}>A question to sit with</Text>
                                  <Text style={styles.sitWithText}>"{interp.question}"</Text>
                                </View>
                              </>
                            );
                          })()}
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
              <MetallicIcon name="cloud-offline-outline" size={48} variant="copper" />
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
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  header: { marginTop: 10, marginBottom: 24, paddingHorizontal: 4 },
  backButton: { padding: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  title: { fontSize: 34, fontWeight: '300', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 8 },
  subtitle: { fontSize: 14 },

  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 16, paddingLeft: 4 },

  // ── Form Card (deep glassmorphic volume) ──
  formCard: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.glassBorder },
  formInner: { padding: 28 },
  formTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  formTitle: { fontSize: 22, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  cancelEditBtn: { padding: 8 },

  fieldLabel: { fontSize: 13, fontWeight: '700', color: PALETTE.textMain, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },

  // Volumetric moon rating
  qualityRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  qualityStateLabel: { textAlign: 'center', fontSize: 11, fontWeight: '800', color: PALETTE.gold, letterSpacing: 1.5, marginTop: 16, textTransform: 'uppercase' },

  // Hours slept picker
  hoursPickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  hoursStepBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  hoursCircleDisplay: { width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.35)' },
  hoursCircleValue: { fontSize: 28, fontWeight: '700', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  hoursCircleQuality: { fontSize: 9, fontWeight: '800', color: PALETTE.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 5 },

  // Dream journal glass card
  dreamGlassCard: { borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, padding: 16, backgroundColor: 'rgba(0,0,0,0.3)', minHeight: 120 },
  dreamGlassCardActive: { borderColor: 'rgba(217, 191, 140, 0.4)', backgroundColor: 'rgba(217, 191, 140, 0.05)' },
  dreamInputInner: { fontSize: 16, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), lineHeight: 24 },

  // Premium lock cards
  premiumLockCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(217, 191, 140, 0.2)', padding: 20 },
  premiumLockTitle: { fontSize: 15, fontWeight: '700', color: PALETTE.gold, marginBottom: 4 },
  premiumLockSub: { fontSize: 13, color: PALETTE.textMuted, lineHeight: 18 },
  deeperSkyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(157, 118, 193, 0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(157, 118, 193, 0.3)' },
  deeperSkyBadgeText: { color: PALETTE.amethyst, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Feeling picker
  dreamMoodDropdown: { backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dreamMoodDropdownText: { color: PALETTE.textMain, fontSize: 15, fontWeight: '500', flex: 1, marginRight: 8 },
  dreamMoodDropdownPlaceholder: { color: PALETTE.textMuted, fontSize: 15 },
  dreamMoodOptions: { backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  dreamMoodOption: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  dreamMoodOptionSelected: { backgroundColor: 'rgba(157, 118, 193, 0.15)' },
  dreamMoodOptionText: { color: PALETTE.textMain, fontSize: 15 },
  dreamMoodOptionTextSelected: { color: PALETTE.amethyst, fontWeight: '600' },

  feelingSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  feelingSearchInput: { flex: 1, color: PALETTE.textMain, fontSize: 15, height: 40 },

  tierRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tierPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 24, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'transparent' },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  tierPillText: { color: PALETTE.textMuted, fontSize: 12, fontWeight: '600' },
  tierBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  tierBadgeText: { color: '#020817', fontSize: 11, fontWeight: '700' },
  tierHint: { color: PALETTE.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 24, paddingHorizontal: 16, fontStyle: 'italic' },

  intensityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  intensityLabel: { fontSize: 13, color: PALETTE.textMuted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  intensityDots: { flexDirection: 'row', gap: 8 },
  intensityDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder, alignItems: 'center', justifyContent: 'center' },
  intensityDotActive: { backgroundColor: 'rgba(201, 174, 120, 0.25)', borderColor: PALETTE.amethyst },
  intensityDotText: { fontSize: 14, color: PALETTE.textMuted, fontWeight: '600' },
  intensityDotTextActive: { color: PALETTE.amethyst },

  // Dream metadata
  metadataSection: { backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16, marginBottom: 12, padding: 16 },
  metadataRow: { marginBottom: 20 },
  metadataLabel: { fontSize: 14, color: PALETTE.textMuted, fontWeight: '600', marginBottom: 12 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  awakenDropdown: { backgroundColor: 'transparent', borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  awakenDropdownText: { color: PALETTE.textMain, fontSize: 15, fontWeight: '500' },
  recurringRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  toggleTrack: { width: 50, height: 28, borderRadius: 14, backgroundColor: 'transparent', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1, borderColor: PALETTE.glassBorder },
  toggleTrackActive: { backgroundColor: 'rgba(201, 174, 120, 0.4)', borderColor: PALETTE.amethyst },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: PALETTE.textMuted as string },
  toggleThumbActive: { alignSelf: 'flex-end', backgroundColor: PALETTE.amethyst },

  // Seal artifact
  sealSection: { alignItems: 'center', marginTop: 48, paddingTop: 32, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  pulseSection: { alignItems: 'center', position: 'relative' },
  pulseLabel: { color: PALETTE.textMain, fontSize: 13, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 },
  unlockBtn: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder },
  unlockText: { color: PALETTE.textMuted, fontWeight: '700', fontSize: 12, letterSpacing: 1 },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(205, 127, 93, 0.15)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(205, 127, 93, 0.3)', padding: 14, marginTop: 16 },
  errorBannerText: { flex: 1, color: PALETTE.copper, fontSize: 14, lineHeight: 20 },

  // Today's dream reflection
  todayInterpretCard: { borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(157, 118, 193, 0.25)', borderTopColor: 'rgba(157, 118, 193, 0.4)' },
  todayInterpretHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  todayInterpretTitle: { fontSize: 18, fontWeight: '700', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: PALETTE.glassBorder, overflow: 'hidden' },
  statLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  statValue: { fontSize: 24, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  statSub: { fontSize: 11, color: PALETTE.textMuted, marginTop: 4, textAlign: 'center', fontStyle: 'italic' },

  // Obsidian graph / cluster cards
  obsidianCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(139, 196, 232, 0.15)', overflow: 'hidden', alignItems: 'center' },
  obsidianCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 12 },
  obsidianCardEyebrow: { fontSize: 11, fontWeight: '800', color: PALETTE.silverBlue, letterSpacing: 1.5 },
  obsidianCardFooter: { marginTop: 10, alignSelf: 'center' },
  obsidianCardFooterText: { fontSize: 11, color: 'rgba(240, 234, 214, 0.3)', fontStyle: 'italic', textAlign: 'center' },

  // Entry history
  entryCard: { marginBottom: 16 },
  entryCardInner: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: PALETTE.glassBorder },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  entryDate: { fontSize: 16, fontWeight: '600', color: PALETTE.textMain },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entryMetaText: { fontSize: 13, color: PALETTE.textMuted, fontWeight: '500' },
  entryMoons: { flexDirection: 'row', gap: 2 },
  entryDream: { fontSize: 15, color: PALETTE.textMuted, lineHeight: 24, fontStyle: 'italic', marginBottom: 8 },
  entryDreamMoodRow: { marginTop: 4 },
  entryDreamMoodText: { fontSize: 13, color: PALETTE.textMuted, fontWeight: '500' },
  deleteHint: { fontSize: 12, color: PALETTE.textMuted, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },

  reflectBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(157, 118, 193, 0.1)', borderWidth: 1, borderColor: 'rgba(157, 118, 193, 0.2)' },
  reflectBtnPressed: { opacity: 0.7 },
  reflectBtnText: { fontSize: 14, color: PALETTE.amethyst, fontWeight: '600' },

  interpretCard: { borderRadius: 20, padding: 24, marginTop: 6, borderWidth: 1, borderColor: 'rgba(157, 118, 193, 0.2)' },
  interpretBody: { fontSize: 15, color: PALETTE.textMuted, lineHeight: 24 },

  undercurrentBox: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start', borderRadius: 12, backgroundColor: 'rgba(157, 118, 193, 0.10)', borderWidth: 1, borderColor: 'rgba(157, 118, 193, 0.18)' },
  undercurrentLabel: { fontSize: 12, fontWeight: '600', color: PALETTE.amethyst, letterSpacing: 0.8, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },

  sitWithBox: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(157, 118, 193, 0.15)' },
  sitWithLabel: { fontSize: 11, fontWeight: '700', color: PALETTE.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  sitWithText: { fontSize: 16, color: PALETTE.textMain, lineHeight: 24, fontStyle: 'italic', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },

  // AI Gemini interpretation
  aiSection: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(201, 174, 120, 0.15)' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: 'rgba(201, 174, 120, 0.08)', borderWidth: 1, borderColor: 'rgba(201, 174, 120, 0.25)' },
  aiBtnPressed: { opacity: 0.7 },
  aiBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  aiLoadingText: { fontSize: 13, color: PALETTE.textMuted, fontStyle: 'italic' },
  aiErrorText: { fontSize: 13, color: PALETTE.copper, textAlign: 'center', paddingVertical: 8 },
  aiResultBox: { marginTop: 4 },
  aiResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiResultLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },

  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '600', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), textAlign: 'center', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, color: PALETTE.textMuted, textAlign: 'center', lineHeight: 22 },
});
