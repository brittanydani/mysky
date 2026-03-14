import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  PanResponder,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import SkiaMoodSealButton from '../../components/ui/SkiaMoodSealButton';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { CheckInService } from '../../services/patterns/checkInService';
import type { DailyCheckIn, EnergyLevel, StressLevel, ThemeTag, CheckInInput } from '../../services/patterns/types';
import type { NatalChart } from '../../services/astrology/types';
import { usePremium } from '../../context/PremiumContext';
import { NeonWaveChart } from '../../components/ui/NeonWaveChart';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';

const { width } = Dimensions.get('window');
// scrollContent paddingH 24x2 + trendCard padding 20x2
const CARD_INNER_W = width - 88;
const FONT_SERIF = Platform.select({ ios: 'Georgia', android: 'serif' });

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
};

const EMOTION_TAG_MAP: Record<string, ThemeTag> = {
  'Radiant':   'eq_hopeful',
  'Grounded':  'eq_grounded',
  'Anxious':   'eq_anxious',
  'Scattered': 'eq_scattered',
  'Inspired':  'eq_focused',
  'Heavy':     'eq_heavy',
  'Resilient': 'eq_open',
  'Numb':      'eq_disconnected',
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
};

const EMOTION_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'Radiant':   'sparkles-outline',
  'Grounded':  'earth-outline',
  'Anxious':   'pulse-outline',
  'Scattered': 'shuffle-outline',
  'Inspired':  'bulb-outline',
  'Heavy':     'thunderstorm-outline',
  'Resilient': 'shield-outline',
  'Numb':      'water-outline',
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
  const scores = checkIns
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(c => c.moodScore);
  if (scores.length < 3) return 'Early days';
  const half = Math.floor(scores.length / 2);
  const early = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const recent = scores.slice(-half).reduce((a, b) => a + b, 0) / half;
  if (recent > early + 0.5) return 'Rising';
  if (recent < early - 0.5) return 'Declining';
  return 'Stable';
}

const MAX_DAYS_BACK = 30;

function formatDisplayDate(dateStr: string): string {
  const todayStr = toLocalDateString(new Date());
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
  const router = useRouter();
  const { isPremium } = usePremium();

  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);

  const [selectedInfluences, setSelectedInfluences] = useState<Set<string>>(new Set());
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(new Set());

  const [chartId, setChartId] = useState<string | null>(null);
  const [natalChart, setNatalChart] = useState<NatalChart | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<DailyCheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [completedSlots, setCompletedSlots] = useState<string[]>([]);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateString(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<import('../../services/patterns/types').TimeOfDay>(
    () => CheckInService.getCurrentTimeSlot()
  );

  const influences = ['Sleep', 'Work', 'Relationships', 'Health', 'Movement', 'Nature', 'Alone time', 'Finances', 'Weather'];
  const premiumEmotions = ['Radiant', 'Grounded', 'Anxious', 'Scattered', 'Inspired', 'Heavy', 'Resilient', 'Numb'];

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

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
          const natal = AstrologyCalculator.generateNatalChart(birthData);
          const recent = await localDb.getCheckIns(saved.id, 7);

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

      load();
      return () => { cancelled = true; };
    }, [])
  );

  // Load the check-in for the currently selected date + slot
  useEffect(() => {
    if (!chartId) return;
    let cancelled = false;

    const loadSlot = async () => {
      try {
        const slots = await CheckInService.getCompletedTimeSlotsForDate(chartId, selectedDate);
        const existing = await CheckInService.getCheckInForDateAndSlot(chartId, selectedDate, selectedSlot);

        if (!cancelled) {
          setCompletedSlots(slots);
          if (existing) {
            setIsEditingExisting(true);
            setMood(existing.moodScore);
            setEnergy(energyLevelToNum(existing.energyLevel));
            setStress(stressLevelToNum(existing.stressLevel));
            setSelectedInfluences(new Set(
              existing.tags.map(t => REV_INFLUENCE_TAG[t]).filter(Boolean)
            ));
            setSelectedEmotions(new Set(
              existing.tags.map(t => REV_EMOTION_TAG[t]).filter(Boolean)
            ));
          } else {
            setIsEditingExisting(false);
            setMood(5);
            setEnergy(5);
            setStress(5);
            setSelectedInfluences(new Set());
            setSelectedEmotions(new Set());
          }
        }
      } catch (e) {
        logger.error('[MoodCheckIn] Slot load failed:', e);
      }
    };

    loadSlot();
    return () => { cancelled = true; };
  }, [chartId, selectedDate, selectedSlot]);

  const toggleTag = (
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

  const handleSeal = async () => {
    if (!chartId || !natalChart || isSaving) return;
    setIsSaving(true);
    try {
      const influenceTags: ThemeTag[] = [...selectedInfluences].map(t => INFLUENCE_TAG_MAP[t] ?? t);
      const emotionTags: ThemeTag[] = isPremium
        ? [...selectedEmotions].map(t => EMOTION_TAG_MAP[t] ?? t)
        : [];
      const input: CheckInInput = {
        moodScore: mood,
        energyLevel: numToEnergyLevel(energy),
        stressLevel: numToStressLevel(stress),
        tags: [...influenceTags, ...emotionTags],
        timeOfDay: selectedSlot,
        date: selectedDate,
      };
      await CheckInService.saveCheckIn(input, natalChart, chartId);

      // Refresh completed slots + recent data so the UI reflects the save
      const slots = await CheckInService.getCompletedTimeSlotsForDate(chartId, selectedDate);
      const recent = await localDb.getCheckIns(chartId, 7);
      setCompletedSlots(slots);
      setRecentCheckIns(recent);
      setIsEditingExisting(true);
      setIsSaving(false);
    } catch (e) {
      logger.error('[MoodCheckIn] Save failed:', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setIsSaving(false);
    }
  };

  const trendLabel = computeTrendLabel(recentCheckIns);
  const canSeal = !isSaving && !!chartId;
  const todayStr = toLocalDateString(new Date());
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
  const ALL_SLOTS: Array<{ key: string; label: string; iconName: keyof typeof Ionicons.glyphMap; iconColor: string }> = [
    { key: 'morning',   label: 'Morning',   iconName: 'sunny-outline',         iconColor: '#F0C87E' },
    { key: 'afternoon', label: 'Afternoon', iconName: 'partly-sunny-outline',  iconColor: '#D9BF8C' },
    { key: 'evening',   label: 'Evening',   iconName: 'cloudy-night-outline',  iconColor: '#A89BC8' },
    { key: 'night',     label: 'Night',     iconName: 'moon-outline',          iconColor: '#8BC4E8' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(217, 191, 140, 0.1)', 'transparent']} style={styles.topGlow} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.closeButton}
        >
          <Text style={styles.closeIcon}>×</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Internal Weather</Text>
          {isEditingExisting && (
            <Text style={styles.headerEditingBadge}>
              {selectedDate === todayStr
                ? "Editing today's entry"
                : `Editing ${formatDisplayDate(selectedDate)}`}
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Date Navigator */}
      <View style={styles.dateNav}>
        <Pressable
          onPress={() => navigateDate(-1)}
          disabled={!canGoBack()}
          hitSlop={12}
          style={styles.dateArrow}
        >
          <Ionicons name="chevron-back" size={18} color={canGoBack() ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'} />
        </Pressable>
        <Text style={styles.dateNavLabel}>{formatDisplayDate(selectedDate)}</Text>
        <Pressable
          onPress={() => navigateDate(1)}
          disabled={!canGoForward()}
          hitSlop={12}
          style={styles.dateArrow}
        >
          <Ionicons name="chevron-forward" size={18} color={canGoForward() ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)'} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 7-Day Trend */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.sectionLabel}>7-DAY MOOD TREND</Text>
            <Text style={styles.trendValue}>{isLoading ? '…' : trendLabel}</Text>
          </View>
          {isLoading ? (
            <View style={styles.trendPlaceholder}>
              <ActivityIndicator size="small" color="rgba(217,191,140,0.5)" />
            </View>
          ) : recentCheckIns.length >= 2 ? (
            <NeonWaveChart checkIns={recentCheckIns} width={CARD_INNER_W} height={140} />
          ) : (
            <View style={styles.trendPlaceholder}>
              <Text style={styles.trendEmptyText}>
                {recentCheckIns.length === 1
                  ? 'One more check-in to reveal your trend'
                  : 'Complete your first check-in to begin tracking'}
              </Text>
            </View>
          )}
        </View>

        {/* 1–10 Haptic Sliders */}
        <View style={styles.slidersContainer}>
          <CustomHapticSlider title="Mood" value={mood} setValue={setMood} color="#D9BF8C" labels={['Low', 'Neutral', 'High']} />
          <View style={styles.divider} />
          <CustomHapticSlider title="Energy" value={energy} setValue={setEnergy} color="#6E8CB4" labels={['Exhausted', 'Steady', 'Energized']} />
          <View style={styles.divider} />
          <CustomHapticSlider title="Stress" value={stress} setValue={setStress} color="#D98C8C" labels={['Calm', 'Balanced', 'Overwhelmed']} />
        </View>

        {/* Influence Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.sectionLabel}>WHAT’S INFLUENCING THIS?</Text>
          <View style={styles.tagGrid}>
            {influences.map(tag => (
              <TagButton
                key={tag}
                title={tag}
                icon={INFLUENCE_ICONS[tag]}
                isSelected={selectedInfluences.has(tag)}
                onPress={() => toggleTag(tag, selectedInfluences, setSelectedInfluences)}
              />
            ))}
          </View>
        </View>

        {/* Emotional Quality Tags (Deeper Sky) */}
        <View style={styles.tagsSection}>
          <View style={styles.premiumHeaderRow}>
            <Text style={styles.sectionLabel}>EMOTIONAL QUALITY</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>✦ DEEPER SKY</Text>
            </View>
          </View>
          <View style={styles.tagGrid}>
            {premiumEmotions.map(tag => (
              <TagButton
                key={tag}
                title={tag}
                icon={EMOTION_ICONS[tag]}
                isSelected={selectedEmotions.has(tag)}
                onPress={() => {
                  if (!isPremium) return;
                  toggleTag(tag, selectedEmotions, setSelectedEmotions);
                }}
                isPremiumVariant
                isLocked={!isPremium}
              />
            ))}
          </View>
          {!isPremium && (
            <Text style={styles.lockedHint}>
              Unlock with Deeper Sky to track emotional quality
            </Text>
          )}
        </View>

        {/* Time Slot Tracker — tap a slot to edit it */}
        <View style={styles.slotRow}>
          {ALL_SLOTS.map(({ key, label, iconName, iconColor }) => {
            const isDone      = completedSlots.includes(key);
            const isSelected  = key === selectedSlot;
            const activeColor = isDone ? '#6EBF8B' : isSelected ? iconColor : 'rgba(255,255,255,0.22)';
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
                  <Ionicons
                    name={isDone ? 'checkmark' : iconName}
                    size={15}
                    color={activeColor}
                  />
                </View>
                <Text style={[
                  styles.slotLabel,
                  isDone     && styles.slotLabelDone,
                  isSelected && !isDone && { color: iconColor },
                  isSelected && isDone  && styles.slotLabelDone,
                ]}>{label}</Text>
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
  const sliderWidth = width - 88;
  const maxSteps = 10;

  // Keep a ref so the panResponder (created once) always reads the current step.
  const valueRef = useRef(value);
  valueRef.current = value;

  const handleTouch = (locationX: number) => {
    let rawPercentage = locationX / sliderWidth;
    rawPercentage = Math.max(0, Math.min(1, rawPercentage));
    let step = Math.round(rawPercentage * (maxSteps - 1)) + 1;
    step = Math.max(1, Math.min(maxSteps, step));
    if (step !== valueRef.current) {
      Haptics.selectionAsync();
      setValue(step);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.locationX),
    })
  ).current;

  const fillWidth = ((value - 1) / (maxSteps - 1)) * sliderWidth;

  return (
    <View style={styles.sliderWrapper}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderTitle}>{title}</Text>
        <Text style={[styles.sliderValue, { color }]}>{value}</Text>
      </View>

      <View style={styles.trackContainer} {...panResponder.panHandlers}>
        <View style={styles.trackBackground} />
        <View style={[styles.trackFill, { width: fillWidth, backgroundColor: color }]} />
        <View style={[styles.thumb, { transform: [{ translateX: fillWidth - 12 }], shadowColor: color }]} />
      </View>

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
  onPress,
  isPremiumVariant = false,
  isLocked = false,
}: {
  title: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  isSelected: boolean;
  onPress: () => void;
  isPremiumVariant?: boolean;
  isLocked?: boolean;
}) => {
  const iconColor = isLocked
    ? 'rgba(110,140,180,0.3)'
    : isSelected
      ? isPremiumVariant ? '#FFF' : '#050507'
      : isPremiumVariant ? 'rgba(110,140,180,0.7)' : 'rgba(255,255,255,0.5)';

  const resolvedIcon: React.ComponentProps<typeof Ionicons>['name'] =
    isLocked ? 'lock-closed-outline' : (icon ?? 'ellipse-outline');

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tagButton,
        isPremiumVariant && styles.tagButtonPremiumBase,
        isSelected && (isPremiumVariant ? styles.tagButtonSelectedPremium : styles.tagButtonSelected),
        isLocked && styles.tagButtonLocked,
      ]}
    >
      <Ionicons
        name={resolvedIcon}
        size={13}
        color={iconColor}
        style={styles.tagIcon}
      />
      <Text style={[styles.tagText, isSelected && styles.tagTextSelected, isLocked && styles.tagTextLocked]}>
        {title}
      </Text>
      {isPremiumVariant && isSelected && (
        <View style={styles.tagPremiumGlow} />
      )}
    </Pressable>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 12 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  closeIcon: { color: '#FFF', fontSize: 24, lineHeight: 28 },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 16, color: '#FFF', fontFamily: FONT_SERIF, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6 },
  headerEditingBadge: { fontSize: 10, color: '#D9BF8C', letterSpacing: 1, textTransform: 'uppercase', marginTop: 3, opacity: 0.8 },

  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 16, gap: 16 },
  dateArrow: { padding: 4 },
  dateNavLabel: { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: '600', letterSpacing: 0.5, minWidth: 90, textAlign: 'center' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.8, marginBottom: 16 },

  trendCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(226, 194, 122, 0.14)', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  trendValue: { fontSize: 13, color: '#E2C27A', fontWeight: '700', letterSpacing: 0.3 },
  trendPlaceholder: { height: 60, justifyContent: 'center', alignItems: 'center' },
  trendEmptyText: { fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', textAlign: 'center' },

  slidersContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 32 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 24 },

  sliderWrapper: { width: '100%' },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sliderTitle: { fontSize: 16, color: '#FFF', fontFamily: 'Georgia' },
  sliderValue: { fontSize: 18, fontWeight: 'bold' },

  trackContainer: { height: 32, justifyContent: 'center' },
  trackBackground: { position: 'absolute', left: 0, right: 0, height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4 },
  trackFill: { position: 'absolute', left: 0, height: 8, borderRadius: 4 },
  thumb: { position: 'absolute', left: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 },

  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  sliderLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 1, flex: 1 },

  tagsSection: { marginBottom: 32 },
  premiumHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(110, 140, 180, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(110, 140, 180, 0.3)', marginTop: -16 },
  premiumBadgeText: { color: '#6E8CB4', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  lockedHint: { fontSize: 11, color: 'rgba(110,140,180,0.5)', fontStyle: 'italic', marginTop: 12 },

  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  tagButtonPremiumBase: {
    backgroundColor: 'rgba(110,140,180,0.07)',
    borderColor: 'rgba(110,140,180,0.2)',
  },
  tagButtonSelected: { backgroundColor: '#FFF', borderColor: '#FFF' },
  tagButtonSelectedPremium: {
    backgroundColor: '#6E8CB4',
    borderColor: '#8AABCF',
    shadowColor: '#6E8CB4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 6,
  },
  tagButtonLocked: { opacity: 0.35 },
  tagIcon: { marginRight: 5 },
  tagPremiumGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  tagText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  tagTextSelected: { color: '#050507', fontWeight: 'bold' },
  tagTextLocked: { color: 'rgba(255,255,255,0.4)' },

  sealContainer: { alignItems: 'center', marginTop: 8 },

  slotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 4,
  },
  slotPill: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    minWidth: 72,
  },
  slotPillDone: {
    backgroundColor: 'rgba(110,191,139,0.10)',
    borderColor: 'rgba(110,191,139,0.30)',
  },
  slotPillSelected: {
    borderColor: 'rgba(217,191,140,0.55)',
    backgroundColor: 'rgba(217,191,140,0.08)',
  },
  slotPillSelectedDone: {
    borderColor: 'rgba(110,191,139,0.55)',
    backgroundColor: 'rgba(110,191,139,0.14)',
  },
  slotIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotIconWrapDone: {
    borderColor: 'rgba(110,191,139,0.40)',
    backgroundColor: 'rgba(110,191,139,0.12)',
  },
  slotLabel: { fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: '600', letterSpacing: 0.5 },
  slotLabelDone: { color: '#6EBF8B' },
});
