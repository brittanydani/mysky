import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import SkiaMoodSealButton from '../../components/ui/SkiaMoodSealButton';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { CheckInService, getLogicalToday } from '../../services/patterns/checkInService';
import type { DailyCheckIn, EnergyLevel, StressLevel, ThemeTag, CheckInInput } from '../../services/patterns/types';
import type { NatalChart } from '../../services/astrology/types';
import { usePremium } from '../../context/PremiumContext';
import PremiumModal from '../../components/PremiumModal';
import { NeonWaveChart } from '../../components/ui/NeonWaveChart';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MetallicText } from '../../components/ui/MetallicText';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';
import { keepLastWordsTogether } from '../../utils/textLayout';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';

const { width } = Dimensions.get('window');
// scrollContent paddingH 24x2 + trendCard padding 20x2
const CARD_INNER_W = width - 88;
const APPLE_SPRING = { damping: 20, stiffness: 90, mass: 1 } as const;
const SLIDER_THUMB_WIDTH = 20;
const SLIDER_THUMB_HEIGHT = 40;

type PillPolarity = 'neutral' | 'pos' | 'neg';

interface CustomPill {
  id: string;
  label: string;
  polarity: PillPolarity;
}

interface CheckInMetaPayload {
  customInfluences?: CustomPill[];
  customEmotions?: CustomPill[];
  sliders?: [number, number, number];
}

const CHECKIN_META_MARKER = '||CHECKIN_META||';

// ─── Semantic Palette ─────────────────────────────────────────────────────────
const PALETTE = {
  gold: '#D4AF37',       // Metallic hardware elements
  atmosphere: '#A2C2E1', // Icy Blue for glass & Energy
  ember: '#DC5050',      // Stress/Warning
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
  sage: '#6B9080',       // Growth/Glimmer
  bg: '#0A0A0F',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function numToEnergyLevel(v: number): EnergyLevel {
  if (v <= 3) return 'low';
  if (v <= 7) return 'medium';
  return 'high';
}

function numToStressLevel(v: number): StressLevel {
  if (v <= 3) return 'low';
  if (v <= 7) return 'medium';
  return 'high';
}

function normalizePillLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function buildCustomPillId(label: string): string {
  return normalizePillLabel(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function humanizeTag(tag: string): string {
  return tag
    .replace(/^eq_/, '')
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function nextPolarity(current?: PillPolarity): PillPolarity {
  if (!current) return 'neutral';
  if (current === 'neutral') return 'pos';
  if (current === 'pos') return 'neg';
  return 'neutral';
}

function serializeCheckInMeta(payload: CheckInMetaPayload): string {
  return `${CHECKIN_META_MARKER}${encodeURIComponent(JSON.stringify(payload))}`;
}

function parseCheckInMeta(note?: string | null): CheckInMetaPayload {
  const rawNote = note ?? '';
  if (!rawNote) return {};

  if (rawNote.includes(CHECKIN_META_MARKER)) {
    const serialized = rawNote.split(CHECKIN_META_MARKER)[1] ?? '';
    try {
      return JSON.parse(decodeURIComponent(serialized)) as CheckInMetaPayload;
    } catch {
      return {};
    }
  }

  const slidersMatch = rawNote.match(/\|\|SLIDERS\|\|(\d+),(\d+),(\d+)/);
  const [legacyInfluence = '', legacyEmotion = ''] = rawNote.split('||EMOTION||');
  const cleanedInfluence = legacyInfluence.replace(/\|\|SLIDERS\|\|.*$/, '').trim();
  const cleanedEmotion = legacyEmotion.replace(/\|\|SLIDERS\|\|.*$/, '').trim();

  return {
    sliders: slidersMatch
      ? [Number(slidersMatch[1]), Number(slidersMatch[2]), Number(slidersMatch[3])]
      : undefined,
    customInfluences: cleanedInfluence
      ? [{ id: buildCustomPillId(cleanedInfluence), label: normalizePillLabel(cleanedInfluence), polarity: 'neutral' }]
      : [],
    customEmotions: cleanedEmotion
      ? [{ id: buildCustomPillId(cleanedEmotion), label: normalizePillLabel(cleanedEmotion), polarity: 'neutral' }]
      : [],
  };
}

const INFLUENCE_TAG_MAP: Record<string, ThemeTag> = {
  'Sleep':        'sleep',
  'Work':         'work',
  'Relationships':'relationships',
  'Health':       'health',
  'Movement':     'movement',
  'Nature':       'nature',
  'Alone time':   'alone_time',
  'Finances':     'finances',
  'Weather':      'weather',
  'Food':         'food',
  'Creativity':   'creative',
  'Family':       'family',
  'Social media': 'screens',
  'Rest':         'rest',
  'News':         'news' as ThemeTag,
  'Music':        'music' as ThemeTag,
  'Body':         'health',
  'Spirit':       'spirit' as ThemeTag,
};

const EMOTION_TAG_MAP: Record<string, ThemeTag> = {
  // Original 8 — kept on their canonical tags
  'Radiant':    'eq_hopeful',
  'Grounded':   'eq_grounded',
  'Anxious':    'eq_anxious',
  'Scattered':  'eq_scattered',
  'Inspired':   'eq_focused',
  'Heavy':      'eq_heavy',
  'Resilient':  'eq_open',
  'Numb':       'eq_disconnected',
  // New 12 — each gets its own unique tag so analytics can distinguish them
  'Hopeful':    'eq_hopeful',
  'Content':    'eq_content' as ThemeTag,
  'Grateful':   'eq_grateful' as ThemeTag,
  'Melancholy': 'eq_melancholy' as ThemeTag,
  'Tender':     'eq_tender' as ThemeTag,
  'Alive':      'eq_alive' as ThemeTag,
  'Depleted':   'eq_depleted' as ThemeTag,
  'Curious':    'eq_curious' as ThemeTag,
  'Peaceful':   'eq_peaceful' as ThemeTag,
  'Irritable':  'eq_irritable',
  'Lonely':     'eq_lonely' as ThemeTag,
  'Connected':  'eq_connected' as ThemeTag,
};

const INFLUENCE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'Sleep':         'moon-outline',
  'Work':          'briefcase-outline',
  'Relationships': 'people-outline',
  'Health':        'heart-outline',
  'Movement':      'walk-outline',
  'Nature':        'leaf-outline',
  'Alone time':    'person-outline',
  'Finances':      'cash-outline',
  'Weather':       'partly-sunny-outline',
  'Food':          'restaurant-outline',
  'Creativity':    'color-palette-outline',
  'Family':        'home-outline',
  'Social media':  'phone-portrait-outline',
  'Rest':          'bed-outline',
  'News':          'newspaper-outline',
  'Music':         'musical-notes-outline',
  'Body':          'body-outline',
  'Spirit':        'flower-outline',
};

const EMOTION_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'Radiant':    'sparkles-outline',
  'Grounded':   'earth-outline',
  'Anxious':    'pulse-outline',
  'Scattered':  'shuffle-outline',
  'Inspired':   'bulb-outline',
  'Heavy':      'thunderstorm-outline',
  'Resilient':  'shield-outline',
  'Numb':       'water-outline',
  'Hopeful':    'sunny-outline',
  'Content':    'happy-outline',
  'Grateful':   'heart-outline',
  'Melancholy': 'cloudy-outline',
  'Tender':     'rose-outline',
  'Alive':      'flash-outline',
  'Depleted':   'battery-dead-outline',
  'Curious':    'search-outline',
  'Peaceful':   'leaf-outline',
  'Irritable':  'flame-outline',
  'Lonely':     'person-outline',
  'Connected':  'link-outline',
};

function energyLevelToNum(e: EnergyLevel): number {
  if (e === 'low') return 2;
  if (e === 'high') return 8;
  return 5;
}

function stressLevelToNum(s: StressLevel): number {
  if (s === 'low') return 2;
  if (s === 'high') return 8;
  return 5;
}

// Reverse maps: stored tag → display label
const REV_INFLUENCE_TAG: Record<string, string> = Object.fromEntries(
  Object.entries(INFLUENCE_TAG_MAP).map(([k, v]) => [v, k])
);
const REV_EMOTION_TAG: Record<string, string> = Object.fromEntries(
  Object.entries(EMOTION_TAG_MAP).map(([k, v]) => [v, k])
);

function computeTrendLabel(checkIns: DailyCheckIn[]): string {
  // Average per day first so days with multiple check-ins aren't over-weighted
  const byDate = new Map<string, number[]>();
  for (const c of checkIns) {
    if (c.moodScore == null) continue;
    if (!byDate.has(c.date)) byDate.set(c.date, []);
    byDate.get(c.date)!.push(c.moodScore);
  }
  const scores = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, vals]) => vals.reduce((a, b) => a + b, 0) / vals.length);

  if (scores.length < 5) return 'Early days';
  const half = Math.floor(scores.length / 2);
  const early = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const recent = scores.slice(-half).reduce((a, b) => a + b, 0) / half;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const delta = recent - early;
  const rising = delta > 0.5;
  const declining = delta < -0.5;

  // Low zone (avg < 4)
  if (avg < 4) {
    if (rising)    return 'Recovering';
    if (declining) return 'Dropping';
    return 'Persistently low';
  }
  // Below-neutral zone (4–5.5)
  if (avg < 5.5) {
    if (rising)    return 'Lifting';
    if (declining) return 'Dipping';
    return 'Holding low';
  }
  // Neutral zone (5.5–7)
  if (avg < 7) {
    if (rising)    return 'Rising';
    if (declining) return 'Easing down';
    return 'Balanced';
  }
  // High zone (7–8.5)
  if (avg < 8.5) {
    if (rising)    return 'Climbing';
    if (declining) return 'Softening';
    return 'Holding well';
  }
  // Very high zone (8.5+)
  if (rising)    return 'Peaking';
  if (declining) return 'Coming down';
  return 'Consistently high';
}

const MAX_DAYS_BACK = 30;

function formatDisplayDate(dateStr: string): string {
  const todayStr = getLogicalToday();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterdayDate);
  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MoodCheckIn() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { isPremium } = usePremium();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);

  const [selectedInfluences, setSelectedInfluences] = useState<Map<string, 'neutral' | 'pos' | 'neg'>>(new Map());
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(new Set());
  const [customInfluenceInput, setCustomInfluenceInput] = useState('');
  const [customEmotionInput, setCustomEmotionInput] = useState('');
  const [customInfluences, setCustomInfluences] = useState<CustomPill[]>([]);
  const [customEmotions, setCustomEmotions] = useState<CustomPill[]>([]);
  const [editingCustomInfluenceId, setEditingCustomInfluenceId] = useState<string | null>(null);
  const [editingCustomEmotionId, setEditingCustomEmotionId] = useState<string | null>(null);
  const [emotionSectionOpen, setEmotionSectionOpen] = useState(false);
  const [influenceSectionOpen, setInfluenceSectionOpen] = useState(false);

  const [chartId, setChartId] = useState<string | null>(null);
  const [natalChart, setNatalChart] = useState<NatalChart | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<DailyCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [completedSlots, setCompletedSlots] = useState<string[]>([]);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLogicalToday());
  const [selectedSlot, setSelectedSlot] = useState<import('../../services/patterns/types').TimeOfDay>(
    () => CheckInService.getCurrentTimeSlot()
  );

  // When true, the next loadSlot run was triggered by a focus reset — skip
  // auto-slot selection so the user lands on the current time slot with a
  // fresh (empty) form rather than being jumped to a previously filled slot.
  const isFocusResetRef = useRef(true);

  // Ref that always holds the latest form values so handleSeal can be a stable
  // callback (empty deps). A stable onSeal means the LongPress gesture inside
  // SkiaMoodSealButton never rebuilds mid-hold, preventing premature cancels.
  const sealRef = useRef({
    chartId, natalChart, isSaving,
    mood, energy, stress,
    selectedInfluences, selectedEmotions,
    customInfluenceInput, customEmotionInput,
    customInfluences, customEmotions,
    isPremium, selectedSlot, selectedDate,
  });
  useEffect(() => {
    sealRef.current = {
      chartId, natalChart, isSaving,
      mood, energy, stress,
      selectedInfluences, selectedEmotions,
      customInfluenceInput, customEmotionInput,
      customInfluences, customEmotions,
      isPremium, selectedSlot, selectedDate,
    };
  });

  const influences = ['Sleep', 'Work', 'Relationships', 'Health', 'Movement', 'Nature', 'Alone time', 'Finances', 'Weather', 'Food', 'Creativity', 'Family', 'Social media', 'Rest', 'News', 'Music', 'Body', 'Spirit'];
  const premiumEmotions = ['Radiant', 'Grounded', 'Anxious', 'Scattered', 'Inspired', 'Heavy', 'Resilient', 'Numb', 'Hopeful', 'Content', 'Grateful', 'Melancholy', 'Tender', 'Alive', 'Depleted', 'Curious', 'Peaceful', 'Irritable', 'Lonely', 'Connected'];

  // Adaptive contextual prompt based on yesterday's data
  const contextualPrompt = useMemo(() => {
    if (isLoading || recentCheckIns.length < 2) return null;
    const today = getLogicalToday();
    const yesterdayDate = new Date(today + 'T12:00:00');
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterdayDate);
    const yesterdayCheckIns = recentCheckIns.filter(c => c.date === yesterdayStr);
    if (!yesterdayCheckIns.length) return null;
    const lastMood = yesterdayCheckIns[yesterdayCheckIns.length - 1].moodScore;
    const lastStress = yesterdayCheckIns[yesterdayCheckIns.length - 1].stressLevel;
    const lastEnergy = yesterdayCheckIns[yesterdayCheckIns.length - 1].energyLevel;
    if (lastMood <= 3) return 'Yesterday felt heavy — how are you carrying it today?';
    if (lastStress === 'high') return 'You logged high stress yesterday — has anything shifted?';
    if (lastEnergy === 'low') return 'Your energy was low yesterday — how does your body feel now?';
    if (lastMood >= 8) return 'Yesterday felt bright — is that momentum still with you?';
    // 3-day declining trend
    const sorted = [...recentCheckIns].sort((a, b) => a.date.localeCompare(b.date));
    const last3 = sorted.slice(-3);
    if (last3.length === 3 && last3[0].moodScore > last3[1].moodScore && last3[1].moodScore > last3[2].moodScore) {
      return 'Your mood has been dipping for a few days — what might need attention?';
    }
    return null;
  }, [isLoading, recentCheckIns]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      // Reset date/slot on every focus so stale state from a previous visit
      // doesn't linger after the user returns to this screen a day later.
      // Use the actual calendar date so users always land on "today" even
      // between midnight and 6am (avoids the pre-6am logical-yesterday shift).
      isFocusResetRef.current = true;
      setSelectedDate(getLogicalToday());
      setSelectedSlot(CheckInService.getCurrentTimeSlot());

      const load = async () => {
        try {
          setIsLoading(true);
          const charts = await localDb.getCharts();
          if (cancelled || !charts || charts.length === 0) {
            setIsLoading(false);
            return;
          }
          const saved = charts[0];
          const birthData = {
            date: saved.birthDate,
            time: saved.birthTime,
            hasUnknownTime: saved.hasUnknownTime,
            place: saved.birthPlace,
            latitude: saved.latitude,
            longitude: saved.longitude,
            timezone: saved.timezone,
            houseSystem: saved.houseSystem,
          };
          const astroSettings = await AstrologySettingsService.getSettings();
          const natal = AstrologyCalculator.generateNatalChart({ ...birthData, zodiacSystem: astroSettings.zodiacSystem, orbPreset: astroSettings.orbPreset });
          const today = getLogicalToday();
          const sevenDaysAgo = toLocalDateString(new Date(new Date(today + 'T12:00:00').getTime() - 6 * 86_400_000));
          const recent = await localDb.getCheckInsInRange(saved.id, sevenDaysAgo, today);

          if (!cancelled) {
            setChartId(saved.id);
            setNatalChart(natal);
            setRecentCheckIns(recent);
          }
        } catch (e) {
          logger.error('[MoodCheckIn] Load failed:', e);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };

      load().catch(() => {});
      return () => { cancelled = true; };
    }, [])
  );

  // Track previous date+chartId so we can distinguish date-navigation from slot-taps.
  // Use a combined key so the initial chartId load also counts as "dateChanged".
  const prevNavKeyRef = useRef('');

  // Load the check-in for the currently selected date + slot
  useEffect(() => {
    if (!chartId) return;
    let cancelled = false;

    const loadSlot = async () => {
      try {
        const navKey = `${chartId}::${selectedDate}`;
        const dateChanged = prevNavKeyRef.current !== navKey;
        prevNavKeyRef.current = navKey;

        const slots = await CheckInService.getCompletedTimeSlotsForDate(chartId, selectedDate);
        const existing = await CheckInService.getCheckInForDateAndSlot(chartId, selectedDate, selectedSlot);

        if (!cancelled) {
          setCompletedSlots(slots);

          // Only auto-select an existing slot when the user explicitly navigated
          // to a different date (via the arrows). Skip on focus resets so the
          // user always lands on the current time slot with a fresh form.
          // Also skip when the user taps a slot pill (dateChanged=false).
          const skipAutoSelect = isFocusResetRef.current;
          isFocusResetRef.current = false;
          if (!skipAutoSelect && dateChanged && !existing && slots.length > 0 && !slots.includes(selectedSlot)) {
            setSelectedSlot(slots[0] as import('../../services/patterns/types').TimeOfDay);
            return; // effect will re-run with the new slot
          }

          if (existing) {
            setIsEditingExisting(true);
            setMood(existing.moodScore);
            setEnergy(energyLevelToNum(existing.energyLevel));
            setStress(stressLevelToNum(existing.stressLevel));
            const meta = parseCheckInMeta(existing.note);
            const influenceMetaById = new Map((meta.customInfluences ?? []).map((pill) => [pill.id, pill]));
            const emotionMetaById = new Map((meta.customEmotions ?? []).map((pill) => [pill.id, pill]));
            const restoredInfluences = new Map<string, PillPolarity>();
            const restoredCustomInfluences: CustomPill[] = [];
            const restoredEmotions = new Set<string>();
            const restoredCustomEmotions: CustomPill[] = [];

            existing.tags.forEach((tagValue) => {
              let baseTag = typeof tagValue === 'string' ? tagValue : '';
              let polarity: PillPolarity = 'neutral';
              if (baseTag.endsWith('_pos')) { baseTag = baseTag.replace(/_pos$/, ''); polarity = 'pos'; }
              else if (baseTag.endsWith('_neg')) { baseTag = baseTag.replace(/_neg$/, ''); polarity = 'neg'; }

              const influenceLabel = REV_INFLUENCE_TAG[baseTag];
              if (influenceLabel) {
                restoredInfluences.set(influenceLabel, polarity);
                return;
              }

              const emotionLabel = REV_EMOTION_TAG[baseTag];
              if (emotionLabel) {
                restoredEmotions.add(emotionLabel);
                return;
              }

              if (baseTag.startsWith('eq_')) {
                const emotionId = buildCustomPillId(humanizeTag(baseTag));
                const knownEmotion = emotionMetaById.get(emotionId);
                restoredCustomEmotions.push({
                  id: knownEmotion?.id ?? emotionId,
                  label: knownEmotion?.label ?? humanizeTag(baseTag),
                  polarity: knownEmotion?.polarity ?? polarity,
                });
                return;
              }

              const influenceId = buildCustomPillId(humanizeTag(baseTag));
              const knownInfluence = influenceMetaById.get(influenceId);
              restoredCustomInfluences.push({
                id: knownInfluence?.id ?? influenceId,
                label: knownInfluence?.label ?? humanizeTag(baseTag),
                polarity: knownInfluence?.polarity ?? polarity,
              });
            });

            setSelectedInfluences(restoredInfluences);
            setSelectedEmotions(restoredEmotions);
            setCustomInfluences(restoredCustomInfluences.filter((pill, index, arr) => arr.findIndex((entry) => entry.id === pill.id) === index));
            setCustomEmotions(restoredCustomEmotions.filter((pill, index, arr) => arr.findIndex((entry) => entry.id === pill.id) === index));
            if (meta.sliders) {
              setMood(Number(meta.sliders[0]));
              setEnergy(Number(meta.sliders[1]));
              setStress(Number(meta.sliders[2]));
            } else {
              setMood(existing.moodScore);
              setEnergy(energyLevelToNum(existing.energyLevel));
              setStress(stressLevelToNum(existing.stressLevel));
            }
            setCustomInfluenceInput('');
            setCustomEmotionInput('');
            setEditingCustomInfluenceId(null);
            setEditingCustomEmotionId(null);
          } else {
            setIsEditingExisting(false);
            setMood(5);
            setEnergy(5);
            setStress(5);
            setSelectedInfluences(new Map());
            setSelectedEmotions(new Set());
            setCustomInfluenceInput('');
            setCustomEmotionInput('');
            setCustomInfluences([]);
            setCustomEmotions([]);
            setEditingCustomInfluenceId(null);
            setEditingCustomEmotionId(null);
          }
        }
      } catch (e) {
        logger.error('[MoodCheckIn] Slot load failed:', e);
      }
    };

    loadSlot().catch(() => {});
    return () => { cancelled = true; };
  }, [chartId, selectedDate, selectedSlot]);

  const toggleInfluenceTag = (tag: string) => {
    Haptics.selectionAsync();
    setSelectedInfluences((prev) => {
      const next = new Map(prev);
      const curr = next.get(tag);
      next.set(tag, nextPolarity(curr));
      return next;
    });
  };

  const clearInfluenceTag = useCallback((tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedInfluences((prev) => {
      const next = new Map(prev);
      next.delete(tag);
      return next;
    });
  }, []);

  const toggleEmotionTag = (
    tag: string,
    set: Set<string>,
    setSetter: React.Dispatch<React.SetStateAction<Set<string>>>,
  ) => {
    Haptics.selectionAsync();
    const newSet = new Set(set);
    if (newSet.has(tag)) newSet.delete(tag);
    else newSet.add(tag);
    setSetter(newSet);
  };

  const upsertCustomPill = useCallback((
    label: string,
    setPills: React.Dispatch<React.SetStateAction<CustomPill[]>>,
    editingId: string | null,
    clearEditing: () => void,
  ) => {
    const normalized = normalizePillLabel(label);
    if (!normalized) return;
    const nextId = buildCustomPillId(normalized);

    setPills((prev) => {
      const duplicate = prev.find((pill) => pill.id === nextId && pill.id !== editingId);
      if (duplicate) {
        return prev;
      }
      if (editingId) {
        return prev.map((pill) => pill.id === editingId ? { ...pill, id: nextId, label: normalized } : pill);
      }
      return [...prev, { id: nextId, label: normalized, polarity: 'neutral' }];
    });
    clearEditing();
  }, []);

  const cycleCustomPill = useCallback((pillId: string, setPills: React.Dispatch<React.SetStateAction<CustomPill[]>>) => {
    Haptics.selectionAsync().catch(() => {});
    setPills((prev) => prev.map((pill) => pill.id === pillId ? { ...pill, polarity: nextPolarity(pill.polarity) } : pill));
  }, []);

  const promptCustomPillAction = useCallback((pill: CustomPill, type: 'influence' | 'emotion') => {
    Alert.alert(
      pill.label,
      'Choose an action for this custom pill.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          onPress: () => {
            if (type === 'influence') {
              setEditingCustomInfluenceId(pill.id);
              setCustomInfluenceInput(pill.label);
            } else {
              setEditingCustomEmotionId(pill.id);
              setCustomEmotionInput(pill.label);
              setEmotionSectionOpen(true);
            }
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (type === 'influence') {
              setCustomInfluences((prev) => prev.filter((entry) => entry.id !== pill.id));
              if (editingCustomInfluenceId === pill.id) {
                setEditingCustomInfluenceId(null);
                setCustomInfluenceInput('');
              }
            } else {
              setCustomEmotions((prev) => prev.filter((entry) => entry.id !== pill.id));
              if (editingCustomEmotionId === pill.id) {
                setEditingCustomEmotionId(null);
                setCustomEmotionInput('');
              }
            }
          },
        },
      ],
    );
  }, [editingCustomEmotionId, editingCustomInfluenceId]);


  // Converts free text into a stable tag slug for the insights pipeline.
  // Spaces → underscores so "burnt out" → "burnt_out" (readable in insights).
  // Then strip any remaining non-alphanum chars (punctuation, emoji, etc.).
  const textToTag = (text: string): ThemeTag =>
    text.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') as ThemeTag;

  // Stable callback — reads all form state from sealRef so the gesture inside
  // SkiaMoodSealButton never gets a new onSeal reference mid-hold.
  const handleSeal = useCallback(async () => {
    const {
      chartId, natalChart, isSaving,
      mood, energy, stress,
      selectedInfluences, selectedEmotions,
      customInfluences, customEmotions,
      isPremium, selectedSlot, selectedDate,
    } = sealRef.current;

    if (!chartId || !natalChart || isSaving) return;
    setIsSaving(true);
    try {
      const influenceTags: ThemeTag[] = [...selectedInfluences.entries()].map(([t, polarity]) => {
        const baseTag = INFLUENCE_TAG_MAP[t] ?? t;
        if (polarity === 'pos') return `${baseTag}_pos` as ThemeTag;
        if (polarity === 'neg') return `${baseTag}_neg` as ThemeTag;
        return baseTag as ThemeTag;
      });
      const emotionTags: ThemeTag[] = isPremium
        ? [...selectedEmotions].map(t => EMOTION_TAG_MAP[t] ?? t)
        : [];
      const customInfluenceTags: ThemeTag[] = customInfluences.map((pill) => {
        const baseTag = textToTag(pill.label);
        if (pill.polarity === 'pos') return `${baseTag}_pos` as ThemeTag;
        if (pill.polarity === 'neg') return `${baseTag}_neg` as ThemeTag;
        return baseTag;
      });
      const customEmotionTags: ThemeTag[] = isPremium
        ? customEmotions.map((pill) => {
            const baseTag = `eq_${textToTag(pill.label)}` as ThemeTag;
            if (pill.polarity === 'pos') return `${baseTag}_pos` as ThemeTag;
            if (pill.polarity === 'neg') return `${baseTag}_neg` as ThemeTag;
            return baseTag;
          })
        : [];

      const input: CheckInInput = {
        moodScore: mood,
        energyLevel: numToEnergyLevel(energy),
        stressLevel: numToStressLevel(stress),
        tags: [...influenceTags, ...emotionTags, ...customInfluenceTags, ...customEmotionTags],
        timeOfDay: selectedSlot,
        date: selectedDate,
        note: serializeCheckInMeta({
          customInfluences,
          customEmotions: isPremium ? customEmotions : [],
          sliders: [mood, energy, stress],
        }),
      };
      await CheckInService.saveCheckIn(input, natalChart, chartId);

      // Refresh completed slots + recent data so the UI reflects the save
      const slots = await CheckInService.getCompletedTimeSlotsForDate(chartId, selectedDate);
      const today = getLogicalToday();
      const sevenDaysAgo = toLocalDateString(new Date(new Date(today + 'T12:00:00').getTime() - 6 * 86_400_000));
      const recent = await localDb.getCheckInsInRange(chartId, sevenDaysAgo, today);
      setCompletedSlots(slots);
      setRecentCheckIns(recent);
      setIsEditingExisting(true);
      setIsSaving(false);
    } catch (e) {
      logger.error('[MoodCheckIn] Save failed:', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setIsSaving(false);
    }
  }, []);

  const trendLabel = useMemo(() => computeTrendLabel(recentCheckIns), [recentCheckIns]);
  const canSeal = !isSaving && !!chartId;
  const todayStr = getLogicalToday();
  const canGoBack = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - MAX_DAYS_BACK);
    return new Date(selectedDate + 'T12:00:00') > minDate;
  };
  const canGoForward = () => selectedDate < todayStr;
  const navigateDate = (direction: -1 | 1) => {
    Haptics.selectionAsync().catch(() => {});
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + direction);
    setSelectedDate(toLocalDateString(d));
  };
  const ALL_SLOTS: { key: string; label: string; iconName: keyof typeof Ionicons.glyphMap; iconColor: string }[] = [
    { key: 'morning',   label: 'Morning',   iconName: 'sunny-outline',         iconColor: '#F0C87E' },
    { key: 'afternoon', label: 'Afternoon', iconName: 'partly-sunny-outline',  iconColor: '#D9BF8C' },
    { key: 'evening',   label: 'Evening',   iconName: 'cloudy-night-outline',  iconColor: '#A89BC8' },
    { key: 'night',     label: 'Night',     iconName: 'moon-outline',          iconColor: '#D4AF37' },
  ];

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Nebula depth — atmospheric glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back-outline" size={22} color={theme.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.titleArea}>
        <Text style={styles.headerTitle}>{keepLastWordsTogether('Internal Weather')}</Text>
        {isEditingExisting ? (
          <MetallicText style={styles.headerEditingBadge} variant="gold">
            {selectedDate === todayStr
              ? "Editing today's entry"
              : `Editing ${formatDisplayDate(selectedDate)}`}
          </MetallicText>
        ) : (
          <GoldSubtitle style={styles.headerSubtitle}>Mirroring your emotional and physical climate</GoldSubtitle>
        )}
      </View>

      {/* Date Navigator */}
      <View style={styles.dateNav}>
        <Pressable
          onPress={() => navigateDate(-1)}
          disabled={!canGoBack()}
          hitSlop={12}
          style={styles.dateArrow}
          accessibilityRole="button"
          accessibilityLabel="Previous day"
          accessibilityState={{ disabled: !canGoBack() }}
        >
          <Ionicons name="chevron-back-outline" size={18} color={canGoBack() ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'} />
        </Pressable>
        <Text style={styles.dateNavLabel}>{formatDisplayDate(selectedDate)}</Text>
        <Pressable
          onPress={() => navigateDate(1)}
          disabled={!canGoForward()}
          hitSlop={12}
          style={styles.dateArrow}
          accessibilityRole="button"
          accessibilityLabel="Next day"
          accessibilityState={{ disabled: !canGoForward() }}
        >
          <Ionicons name="chevron-forward-outline" size={18} color={canGoForward() ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── 7-Day Trend (Midnight Slate Anchor) ── */}
        <VelvetGlassSurface
          style={styles.trendCard}
          intensity={35}
          backgroundColor="transparent"
          borderColor="transparent"
        >
          <LinearGradient colors={['rgba(44, 54, 69, 0.90)', 'rgba(26, 30, 41, 0.45)']} style={StyleSheet.absoluteFill} />
          <View style={styles.trendHeader}>
            <Text style={[styles.trendLabel]}>7-DAY MOOD TREND</Text>
            <MetallicText style={styles.trendStatus} variant="gold">{isLoading ? '…' : trendLabel}</MetallicText>
          </View>
          {isLoading ? (
            <View style={styles.trendPlaceholder}>
              <View style={styles.trendSkeletonBars}>
                {[64, 112, 86, 148, 104, 134, 92].map((height, index) => (
                  <View key={`trend-skeleton-${index}`} style={styles.trendSkeletonColumn}>
                    <View style={[styles.trendSkeletonBar, { height }]} />
                  </View>
                ))}
              </View>
            </View>
          ) : recentCheckIns.length >= 2 ? (
            <NeonWaveChart checkIns={recentCheckIns} width={CARD_INNER_W} height={190} />
          ) : (
            <View style={styles.trendPlaceholder}>
              <Text style={styles.trendEmptyText}>
                {recentCheckIns.length === 1
                  ? 'One more check-in to reveal your trend'
                  : 'Complete your first check-in to begin tracking'}
              </Text>
            </View>
          )}
        </VelvetGlassSurface>

        {/* Adaptive Contextual Prompt */}
        {contextualPrompt && (
          <View style={{ marginBottom: 16, paddingHorizontal: 4 }}>
            <Text style={{ color: PALETTE.gold, fontSize: 14, fontStyle: 'italic', lineHeight: 20, textAlign: 'center' }}>
              {contextualPrompt}
            </Text>
          </View>
        )}

        {/* 1–10 Haptic Sliders */}
        <VelvetGlassSurface
          style={styles.slidersContainer}
          intensity={20}
          backgroundColor="transparent"
          borderColor="transparent"
        >
          <LinearGradient colors={['rgba(162, 194, 225, 0.15)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
          <CustomHapticSlider title="Mood" value={mood} setValue={setMood} color={PALETTE.gold} labels={['Low', 'Neutral', 'High']} />
          <View style={styles.divider} />
          <CustomHapticSlider title="Energy" value={energy} setValue={setEnergy} color={PALETTE.atmosphere} labels={['Exhausted', 'Steady', 'Energized']} />
          <View style={styles.divider} />
          <CustomHapticSlider title="Stress" value={stress} setValue={setStress} color={PALETTE.ember} labels={['Calm', 'Balanced', 'Overwhelmed']} />
        </VelvetGlassSurface>

        {/* Influence Tags */}
        <VelvetGlassSurface
          style={styles.tagsCard}
          intensity={25}
          backgroundColor="transparent"
          borderColor="transparent"
        >
          <LinearGradient colors={['rgba(162, 194, 225, 0.12)', 'rgba(162, 194, 225, 0.04)']} style={StyleSheet.absoluteFill} />
          <View style={styles.tagsSection}>
            <Text style={styles.sectionLabel}>WHAT'S INFLUENCING THIS?</Text>
            <Text style={styles.tagsHint}>Tap to cycle neutral, glimmer, or drain. Hold built-ins to clear. Hold custom pills to edit or delete.</Text>
          <View style={styles.tagGrid}>
            {(influenceSectionOpen ? influences : influences.slice(0, 6)).map(tag => (
              <TagButton
                key={tag}
                title={tag}
                icon={INFLUENCE_ICONS[tag]}
                isSelected={selectedInfluences.has(tag)}
                polarity={selectedInfluences.get(tag) ?? 'neutral'}
                onPress={() => toggleInfluenceTag(tag)}
                onLongPress={() => clearInfluenceTag(tag)}
              />
            ))}
            {influenceSectionOpen && customInfluences.map((pill) => (
              <Pressable
                key={pill.id}
                style={[
                  styles.tagButton,
                  styles.tagButtonSelected,
                  pill.polarity === 'pos' && styles.tagButtonPositive,
                  pill.polarity === 'neg' && styles.tagButtonNegative,
                ]}
                onPress={() => cycleCustomPill(pill.id, setCustomInfluences)}
                onLongPress={() => promptCustomPillAction(pill, 'influence')}
              >
                <Ionicons name="add-circle-outline" size={11} color={pill.polarity === 'neg' ? '#FFF4F6' : '#050507'} style={styles.tagIcon} />
                <Text style={[
                  styles.tagText,
                  pill.polarity !== 'neg' && styles.tagTextSelected,
                  pill.polarity === 'neg' && styles.tagTextDangerActive,
                ]}>{pill.label}</Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.tagButton, { paddingHorizontal: 14 }]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setInfluenceSectionOpen((prev) => !prev);
              }}
            >
              <Ionicons
                name={influenceSectionOpen ? 'chevron-up' : 'chevron-down'}
                size={15}
                color="rgba(255,255,255,0.7)"
              />
            </Pressable>
          </View>
          {influenceSectionOpen && (
            <View style={styles.customPillComposer}>
            <TextInput
              style={[styles.customInfluenceInput, customInfluenceInput.trim().length > 0 && styles.customInputActive]}
              placeholder="Anything else on your mind..."
              placeholderTextColor={theme.isDark ? 'rgba(255,255,255,0.36)' : 'rgba(22,32,51,0.38)'}
              value={customInfluenceInput}
              onChangeText={setCustomInfluenceInput}
              onSubmitEditing={() => {
                if (!customInfluenceInput.trim()) return;
                Haptics.selectionAsync().catch(() => {});
                upsertCustomPill(customInfluenceInput, setCustomInfluences, editingCustomInfluenceId, () => {
                  setCustomInfluenceInput('');
                  setEditingCustomInfluenceId(null);
                });
              }}
              returnKeyType="done"
              maxLength={120}
            />
            <Pressable
              style={[
                styles.customComposerAction,
                customInfluenceInput.trim().length > 0 && styles.customComposerActionEnabled,
              ]}
              onPress={() => {
                if (!customInfluenceInput.trim()) return;
                Haptics.selectionAsync().catch(() => {});
                upsertCustomPill(customInfluenceInput, setCustomInfluences, editingCustomInfluenceId, () => {
                  setCustomInfluenceInput('');
                  setEditingCustomInfluenceId(null);
                });
              }}
            >
              <Ionicons name={editingCustomInfluenceId ? 'checkmark-outline' : 'add-outline'} size={11} color={customInfluenceInput.trim().length > 0 ? '#08110D' : 'rgba(255,255,255,0.7)'} />
              <Text style={[styles.customComposerActionText, customInfluenceInput.trim().length > 0 && styles.customComposerActionTextEnabled]}>{editingCustomInfluenceId ? 'Update' : 'Add'}</Text>
            </Pressable>
          </View>
          )}
          </View>
        </VelvetGlassSurface>

        {/* Emotional Quality Tags (Deeper Sky) — collapsible dropdown */}
        <VelvetGlassSurface
          style={styles.tagsCard}
          intensity={25}
          backgroundColor="transparent"
          borderColor="transparent"
        >
          <LinearGradient colors={['rgba(162, 194, 225, 0.12)', 'rgba(162, 194, 225, 0.04)']} style={StyleSheet.absoluteFill} />
          <View style={styles.tagsSection}>
            <Pressable
              style={styles.emotionDropdownHeader}
              onPress={() => { Haptics.selectionAsync(); setEmotionSectionOpen(o => !o); }}
              accessibilityRole="button"
              accessibilityLabel="Emotional quality section"
              accessibilityState={{ expanded: emotionSectionOpen }}
            >
              <View style={styles.premiumHeaderRow}>
                <Text style={styles.sectionLabel}>EMOTIONAL QUALITY</Text>
                <View style={styles.premiumBadge}>
                  <MetallicText style={styles.premiumBadgeText} variant="gold">✦ DEEPER SKY</MetallicText>
                </View>
              </View>
              <View style={styles.emotionDropdownChevronRow}>
                {selectedEmotions.size > 0 && (
                  <Text style={styles.emotionDropdownCount}>{selectedEmotions.size} selected</Text>
                )}
                {customEmotions.length > 0 && (
                  <Text style={styles.emotionDropdownCustom} numberOfLines={1}>{customEmotions.map((pill) => pill.label).join(', ')}</Text>
                )}
                <Ionicons
                  name={emotionSectionOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="rgba(255,255,255,0.35)"
                />
              </View>
            </Pressable>

          {emotionSectionOpen && (
            <>
              <View style={styles.tagGrid}>
                {premiumEmotions.map(tag => (
                  <TagButton
                    key={tag}
                    title={tag}
                    icon={EMOTION_ICONS[tag]}
                    isSelected={selectedEmotions.has(tag)}
                    onPress={() => {
                      if (!isPremium) { setShowPremiumModal(true); return; }
                      toggleEmotionTag(tag, selectedEmotions, setSelectedEmotions);
                    }}
                    isPremiumVariant
                    isLocked={!isPremium}
                  />
                ))}
                {isPremium && customEmotions.map((pill) => (
                  <Pressable
                    key={pill.id}
                    style={[
                      styles.tagButton,
                      styles.tagButtonSelected,
                      pill.polarity === 'pos' && styles.tagButtonPositive,
                      pill.polarity === 'neg' && styles.tagButtonNegative,
                    ]}
                    onPress={() => cycleCustomPill(pill.id, setCustomEmotions)}
                    onLongPress={() => promptCustomPillAction(pill, 'emotion')}
                  >
                    <Ionicons name="add-circle-outline" size={11} color={pill.polarity === 'neg' ? '#FFF4F6' : '#050507'} style={styles.tagIcon} />
                    <Text style={[
                      styles.tagText,
                      pill.polarity !== 'neg' && styles.tagTextSelected,
                      pill.polarity === 'neg' && styles.tagTextDangerActive,
                    ]}>{pill.label}</Text>
                  </Pressable>
                ))}
              </View>
              {isPremium && (
                <View style={styles.customPillComposer}>
                  <TextInput
                    style={[styles.customInfluenceInput, customEmotionInput.trim().length > 0 && styles.customInputActive]}
                    placeholder="Your own word..."
                      placeholderTextColor="rgba(110,140,180,0.52)"
                    value={customEmotionInput}
                    onChangeText={setCustomEmotionInput}
                    onSubmitEditing={() => {
                      if (!customEmotionInput.trim()) return;
                      Haptics.selectionAsync().catch(() => {});
                      upsertCustomPill(customEmotionInput, setCustomEmotions, editingCustomEmotionId, () => {
                        setCustomEmotionInput('');
                        setEditingCustomEmotionId(null);
                      });
                    }}
                    returnKeyType="done"
                    maxLength={60}
                  />
                  <Pressable
                    style={[
                      styles.customComposerAction,
                      customEmotionInput.trim().length > 0 && styles.customComposerActionEnabled,
                    ]}
                    onPress={() => {
                      if (!customEmotionInput.trim()) return;
                      Haptics.selectionAsync().catch(() => {});
                      upsertCustomPill(customEmotionInput, setCustomEmotions, editingCustomEmotionId, () => {
                        setCustomEmotionInput('');
                        setEditingCustomEmotionId(null);
                      });
                    }}
                  >
                    <Ionicons name={editingCustomEmotionId ? 'checkmark-outline' : 'add-outline'} size={11} color={customEmotionInput.trim().length > 0 ? '#08110D' : 'rgba(255,255,255,0.7)'} />
                    <Text style={[styles.customComposerActionText, customEmotionInput.trim().length > 0 && styles.customComposerActionTextEnabled]}>{editingCustomEmotionId ? 'Update' : 'Add'}</Text>
                  </Pressable>
                </View>
              )}
              {!isPremium && (
                <Text style={styles.lockedHint}>
                  Unlock with Deeper Sky to track emotional quality.
                </Text>
              )}
            </>
          )}
          </View>
        </VelvetGlassSurface>

        {/* Time Slot Tracker — tap a slot to edit it */}
        <View style={styles.slotRow}>
          {ALL_SLOTS.map(({ key, label, iconName, iconColor }) => {
            const isDone      = completedSlots.includes(key);
            const isSelected  = key === selectedSlot;
            const activeColor = isDone ? '#D4AF37' : isSelected ? iconColor : 'rgba(255,255,255,0.22)';
            return (
              <Pressable
                key={key}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSelectedSlot(key as import('../../services/patterns/types').TimeOfDay);
                }}
                style={[
                  styles.slotPill,
                  isDone     && styles.slotPillDone,
                  isSelected && styles.slotPillSelected,
                  isSelected && isDone && styles.slotPillSelectedDone,
                ]}
              >
                <View style={[
                  styles.slotIconWrap,
                  isDone     && styles.slotIconWrapDone,
                  isSelected && { borderColor: `${iconColor}66` },
                ]}>
                  {isDone || isSelected ? (
                    <MetallicIcon
                      name={isDone ? 'checkmark' : iconName}
                      size={11}
                      color={activeColor}
                    />
                  ) : (
                    <Ionicons
                      name={iconName}
                      size={11}
                      color={activeColor}
                    />
                  )}
                </View>
                {isDone ? (
                  <MetallicText style={[styles.slotLabel, styles.slotLabelDone]} variant="gold">{label}</MetallicText>
                ) : isSelected ? (
                  <MetallicText style={styles.slotLabel} color={iconColor}>{label}</MetallicText>
                ) : (
                  <Text style={styles.slotLabel}>{label}</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Hold to Seal — Premium Skia Orb */}
        <View style={styles.sealContainer}>
          <SkiaMoodSealButton
            onSeal={handleSeal}
            isSaving={isSaving}
            disabled={!canSeal}
            isEditing={isEditingExisting}
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
      </SafeAreaView>
      <PremiumModal visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </View>
  );
}

// ─── Custom Haptic Slider ─────────────────────────────────────────────────────

const CustomHapticSlider = ({
  title,
  value,
  setValue,
  color,
  labels,
}: {
  title: string;
  value: number;
  setValue: (v: number) => void;
  color: string;
  labels: string[];
}) => {
  const styles = useThemedStyles(createStyles);
  const maxSteps = 10;
  const trackWidth = useSharedValue(CARD_INNER_W);
  const progress = useSharedValue((value - 1) / (maxSteps - 1));
  const currentStep = useSharedValue(value);
  const thumbScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.42);

  const emitStepHaptic = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
  }, []);

  useEffect(() => {
    currentStep.value = value;
    progress.value = withSpring((value - 1) / (maxSteps - 1), APPLE_SPRING);
  }, [currentStep, maxSteps, progress, value]);

  const commitStep = useCallback((nextStep: number) => {
    setValue(nextStep);
  }, [setValue]);

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      'worklet';
      thumbScale.value = withSpring(0.95, APPLE_SPRING);
      glowOpacity.value = withTiming(0.88, { duration: 140 });

      const widthValue = Math.max(trackWidth.value, 1);
      const clampedX = Math.max(0, Math.min(event.x, widthValue));
      const nextProgress = clampedX / widthValue;
      const nextStep = Math.max(1, Math.min(maxSteps, Math.round(nextProgress * (maxSteps - 1)) + 1));

      progress.value = nextProgress;
      if (nextStep !== currentStep.value) {
        currentStep.value = nextStep;
        runOnJS(emitStepHaptic)();
        runOnJS(commitStep)(nextStep);
      }
    })
    .onUpdate((event) => {
      'worklet';
      const widthValue = Math.max(trackWidth.value, 1);
      const clampedX = Math.max(0, Math.min(event.x, widthValue));
      const nextProgress = clampedX / widthValue;
      const nextStep = Math.max(1, Math.min(maxSteps, Math.round(nextProgress * (maxSteps - 1)) + 1));

      progress.value = nextProgress;
      if (nextStep !== currentStep.value) {
        currentStep.value = nextStep;
        runOnJS(emitStepHaptic)();
        runOnJS(commitStep)(nextStep);
      }
    })
    .onFinalize(() => {
      'worklet';
      thumbScale.value = withSpring(1, APPLE_SPRING);
      glowOpacity.value = withTiming(0.42, { duration: 220 });
      progress.value = withSpring((currentStep.value - 1) / (maxSteps - 1), APPLE_SPRING);
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(progress.value * trackWidth.value, 12),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * trackWidth.value - (SLIDER_THUMB_WIDTH / 2) },
      { scale: thumbScale.value },
    ],
    shadowOpacity: glowOpacity.value,
  }));

  const thumbHaloStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * trackWidth.value - 15 },
      { scale: thumbScale.value },
    ],
    opacity: glowOpacity.value * 0.36,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    width: Math.max(progress.value * trackWidth.value, 18),
    opacity: glowOpacity.value * 0.34,
  }));

  return (
    <View style={styles.sliderWrapper}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderTitle}>{title}</Text>
        <MetallicText style={[styles.sliderValue]} color={color}>{value}</MetallicText>
      </View>

      <GestureDetector gesture={panGesture}>
        <View
          style={styles.trackContainer}
          onLayout={(event) => {
            trackWidth.value = event.nativeEvent.layout.width;
          }}
        >
          <View style={styles.trackBackground} />
          <View style={styles.trackTicksRow} pointerEvents="none">
            {Array.from({ length: maxSteps }).map((_, index) => (
              <View key={`${title}-${index + 1}`} style={styles.trackTick} />
            ))}
          </View>
          <Animated.View style={[styles.trackGlow, glowStyle, { backgroundColor: color }]} />
          <Animated.View style={[styles.trackFill, fillStyle, { backgroundColor: color }]} />
          <Animated.View pointerEvents="none" style={[styles.thumbHalo, thumbHaloStyle, { backgroundColor: color }]} />
          <Animated.View style={[styles.thumb, thumbStyle, { shadowColor: color, borderColor: `${color}55` }]}> 
            <View style={styles.thumbSheen} />
            <View style={[styles.thumbInner, { backgroundColor: color }]} />
            <View style={styles.thumbCoreHighlight} />
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.labelsRow}>
        <Text style={styles.sliderLabel}>{labels[0]}</Text>
        <Text style={[styles.sliderLabel, { textAlign: 'center' }]}>{labels[1]}</Text>
        <Text style={[styles.sliderLabel, { textAlign: 'right' }]}>{labels[2]}</Text>
      </View>
    </View>
  );
};

// ─── Tag Button ───────────────────────────────────────────────────────────────

const TagButton = ({
  title,
  icon,
  isSelected,
  polarity = 'neutral',
  onPress,
  onLongPress,
  isPremiumVariant = false,
  isLocked = false,
}: {
  title: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  isSelected: boolean;
  polarity?: 'neutral' | 'pos' | 'neg';
  onPress: () => void;
  onLongPress?: () => void;
  isPremiumVariant?: boolean;
  isLocked?: boolean;
}) => {
  const styles = useThemedStyles(createStyles);
  const iconColor = isLocked
    ? 'rgba(110,140,180,0.3)'
    : isSelected
      ? polarity === 'neg' ? '#FFF4F6' : '#050507'
      : isPremiumVariant ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.78)';

  const resolvedIcon: React.ComponentProps<typeof Ionicons>['name'] =
    isLocked ? 'lock-closed-outline' : (icon ?? 'ellipse-outline');

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.tagButton,
        isPremiumVariant && styles.tagButtonPremiumBase,
        isSelected && (isPremiumVariant ? styles.tagButtonSelectedPremium : styles.tagButtonSelected),
        isSelected && polarity === 'pos' && styles.tagButtonPositive,
        isSelected && polarity === 'neg' && styles.tagButtonNegative,
        isLocked && styles.tagButtonLocked,
      ]}
    >
      <Ionicons
        name={resolvedIcon}
        size={11}
        color={iconColor}
        style={styles.tagIcon}
      />
      <Text style={[
        styles.tagText,
        isSelected && styles.tagTextSelected,
        isSelected && polarity === 'neg' && styles.tagTextDangerActive,
        isLocked && styles.tagTextLocked
      ]}>
        {title}
      </Text>
      {isPremiumVariant && isSelected && (
        <View style={styles.tagPremiumGlow} />
      )}
    </Pressable>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea: { paddingHorizontal: 24, paddingBottom: 8 },
  headerSubtitle: { marginTop: 2 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 23, color: theme.textPrimary, fontWeight: '800', letterSpacing: -0.72, lineHeight: 27, marginBottom: 4, maxWidth: '82%' },
  headerEditingBadge: { fontSize: 10, color: theme.textPrimary, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3, opacity: 0.8 },

  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 16, gap: 16 },
  dateArrow: { padding: 4 },
  dateNavLabel: { fontSize: 15, color: theme.textPrimary, fontWeight: '600', letterSpacing: 0.5, minWidth: 90, textAlign: 'center' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: theme.textPrimary, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 0, marginBottom: 12 },
  tagsHint: { fontSize: 12, color: theme.textSecondary, marginTop: 0, marginBottom: 18, lineHeight: 18 },

  trendCard: { borderRadius: 24, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  trendLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  trendStatus: { fontSize: 12, fontWeight: '700' },
  trendPlaceholder: { height: 190, justifyContent: 'center', alignItems: 'center' },
  trendSkeletonBars: {
    width: '100%',
    height: 190,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 10,
  },
  trendSkeletonColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  trendSkeletonBar: {
    width: '58%',
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: theme.isDark ? 'rgba(162, 194, 225, 0.16)' : 'rgba(162, 194, 225, 0.18)',
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(226, 194, 122, 0.18)' : 'rgba(212, 175, 55, 0.16)',
  },
  trendEmptyText: { fontSize: 12, color: theme.textMuted, textAlign: 'center', lineHeight: 18 },

  slidersContainer: { borderRadius: 24, padding: 24, marginBottom: 32 },
  divider: { height: 1, backgroundColor: theme.cardBorder, marginVertical: 24 },

  sliderWrapper: { width: '100%' },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sliderTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  sliderValue: { fontSize: 18, fontWeight: 'bold' },

  trackContainer: { height: 50, justifyContent: 'center' },
  trackBackground: { position: 'absolute', left: 0, right: 0, height: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.5)' },
  trackTicksRow: { position: 'absolute', left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackTick: { width: 1, height: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)' },
  trackGlow: { position: 'absolute', left: 0, height: 18, borderRadius: 5 },
  trackFill: { position: 'absolute', left: 0, height: 10, borderRadius: 5, opacity: 0.9 },
  thumbHalo: {
    position: 'absolute',
    left: 0,
    width: 30,
    height: 52,
    borderRadius: 10,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: SLIDER_THUMB_WIDTH,
    height: SLIDER_THUMB_HEIGHT,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbSheen: {
    position: 'absolute',
    top: 5,
    width: 10,
    height: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  thumbInner: { width: 4, height: 20, borderRadius: 2 },
  thumbCoreHighlight: {
    position: 'absolute',
    top: 10,
    width: 4,
    height: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },

  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  sliderLabel: { fontSize: 8, color: theme.textMuted, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.8, flex: 1 },

  customInfluenceInput: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.isDark ? theme.cardBorder : 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 13,
    color: theme.textPrimary,
    flex: 1,
  },
  customInputActive: {
    borderColor: theme.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(212, 175, 55, 0.24)',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.72)',
  },
  customPillComposer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customComposerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
  },
  customComposerActionEnabled: {
    borderColor: 'rgba(212, 175, 55,0.52)',
    backgroundColor: 'rgba(212, 175, 55,0.92)',
  },
  customComposerActionText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  customComposerActionTextEnabled: {
    color: '#100B02',
  },

  tagsCard: { borderRadius: 24, padding: 24, marginBottom: 20 },
  tagsSection: { marginBottom: 0 },
  premiumHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(162, 194, 225, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', marginTop: -16 },
  premiumBadgeText: { color: '#D4AF37', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  lockedHint: { fontSize: 11, color: 'rgba(212, 175, 55,0.72)', marginTop: 12, lineHeight: 16 },

  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  tagButtonPremiumBase: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.04)',
    borderColor: theme.isDark ? theme.cardBorder : 'rgba(0, 0, 0, 0.06)',
  },
  tagButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#4A3F35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDark ? 0 : 0.12,
    shadowRadius: 8,
    elevation: theme.isDark ? 0 : 3,
  },
  tagButtonPositive: { backgroundColor: 'rgba(107, 144, 128, 0.2)', borderColor: '#6B9080' },
  tagButtonNegative: { backgroundColor: 'rgba(220, 80, 80, 0.2)', borderColor: '#DC5050' },
  tagButtonSelectedPremium: {
    backgroundColor: 'rgba(212,175,55,0.88)',
    borderColor: theme.isDark ? 'rgba(255,255,255,0.24)' : 'rgba(181, 138, 58, 0.28)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  },
  tagButtonLocked: { opacity: 0.6 },
  tagIcon: { marginRight: 6 },
  tagPremiumGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: theme.cardBorder,
    borderRadius: 20,
  },
  tagText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  tagTextSelected: { color: '#FFF', fontWeight: 'bold' },
  tagTextDangerActive: { color: '#FFF', fontWeight: '700' },
  tagTextLocked: { color: theme.textSecondary },

  sealContainer: { alignItems: 'center', marginTop: 48 },

  slotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 40,
    marginBottom: 24,
  },
  slotPill: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    
  },
  slotPillDone: {
    backgroundColor: 'rgba(212, 175, 55,0.10)',
    borderColor: 'rgba(212, 175, 55,0.34)',
  },
  slotPillSelected: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212,175,55,0.08)',
    shadowColor: '#4A3F35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: theme.isDark ? 0 : 0.10,
    shadowRadius: 6,
    elevation: theme.isDark ? 0 : 2,
  },
  slotPillSelectedDone: {
    borderColor: theme.isDark ? 'rgba(255,255,255,0.26)' : 'rgba(212, 175, 55, 0.24)',
    backgroundColor: 'rgba(212, 175, 55,0.16)',
  },
  slotIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotIconWrapDone: {
    borderColor: 'rgba(212, 175, 55,0.40)',
    backgroundColor: 'rgba(162, 194, 225, 0.12)',
  },
  slotLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: 0.5 },
  slotLabelDone: { color: '#D4AF37' },

  emotionDropdownHeader: {
    marginBottom: 14,
  },
  emotionDropdownChevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  emotionDropdownCount: {
    fontSize: 11,
    color: 'rgba(184,204,230,0.88)',
    fontWeight: '600',
  },
  emotionDropdownCustom: {
    fontSize: 11,
    color: 'rgba(184,204,230,0.74)',
    flex: 1,
  },
});
