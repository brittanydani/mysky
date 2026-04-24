// app/trigger-log.tsx
// MySky — Polyvagal Trigger Log
// Log and review nervous system events (Drains & Glimmers), mapped to
// Polyvagal Theory states. Supabase is canonical; local storage is cache only.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '../components/keyboard/KeyboardControllerCompat';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { EditorialLikertScale } from '../components/ui/EditorialLikertScale';
import { EditorialPillGrid } from '../components/ui/EditorialPillGrid';
import { formatTime, formatDate, timeOfDayLabel } from '../utils/triggerLogHelpers';
import { keepLastWordsTogether } from '../utils/textLayout';
import type { TriggerEvent, LogMode, NSState } from '../utils/triggerEventTypes';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import {
  addTriggerEvent,
  loadPlainAccountScopedJson,
  loadTriggerEvents,
  savePlainAccountScopedJson,
} from '../services/storage/selfKnowledgeStore';
export type { TriggerEvent } from '../utils/triggerEventTypes';

const CUSTOM_AREAS_KEY = '@mysky:trigger_custom_areas';
const CUSTOM_SENSATIONS_KEY = '@mysky:trigger_custom_sensations';

// Cinematic High-End Palette (User Preferences)
const PALETTE = {
  bg: '#0A0C10',
  gold: '#D4AF37', // Match home.tsx metallic gold
  sage: '#7E8C54',
  coral: '#FB5E63',
  taupe: '#A49E97',
  midnightSlate: '#2C3645',
  atmosphere: '#A2C2E1',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassSurface: 'rgba(255, 255, 255, 0.03)',
};

type ViewMode = 'log' | 'history';

interface CustomAreaOption {
  id: string;
  label: string;
}

interface CustomSensationOption {
  id: string;
  label: string;
  mode: LogMode;
}

const SENSATIONS: Record<LogMode, string[]> = {
  drain: [
    'Tight Chest', 'Racing Heart', 'Shallow Breath', 'Jaw Tension', 'Brain Fog',
    'Numbness', 'Heavy Limbs', 'Nausea', 'Shaky Hands', 'Hot Face',
    'Held Breath', 'Stomach Drop', 'Eye Strain', 'Shoulder Lift', 'Clenched Fists',
  ],
  nourish: [
    'Deep Breath', 'Warmth', 'Shoulders Dropped', 'Clear Mind', 'Soft Eyes',
    'Grounded Feet', 'Spaciousness', 'Open Chest', 'Slow Heartbeat', 'Relaxed Jaw',
    'Tingles', 'Tears of Relief', 'Yawning', 'Gentle Smile', 'Light Body',
  ],
};

const PRIMARY_AREAS = ['Work', 'Home', 'Body', 'Family', 'Parenting', 'Social', 'Solitude', 'Transit', 'Money', 'Sleep', 'Health', 'Creativity'];
const EXTENDED_AREAS = ['Nature', 'Screens', 'Intimacy', 'Food', 'Movement', 'Grief', 'Learning', 'Spirituality', 'Identity'];

const NS_STATE_CARDS: Record<string, { label: string; sub: string; color: string }> = {
  sympathetic: { label: 'Fight or Flight', sub: 'Anxious, frantic, mobilized, angry.', color: PALETTE.coral },
  dorsal:      { label: 'Freeze or Fawn',  sub: 'Shut down, numb, disconnected, pleasing.', color: PALETTE.taupe },
  ventral:     { label: 'Safe & Social',   sub: 'Grounded, connected, open, breathing freely.', color: PALETTE.sage },
  still:       { label: 'Safe & Still',    sub: 'Quiet, calm, peacefully alone, restored.', color: PALETTE.gold },
};

// ─────────────────────────────────────────────────────────────────────────────
// Home Screen Match: Section Header Component
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.sectionHeader}>
      <MetallicIcon name={icon as any} size={18} color={PALETTE.gold} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// History Entry Component
// ─────────────────────────────────────────────────────────────────────────────

function HistoryEntry({ entry }: { entry: TriggerEvent }) {
  const histStyles = useThemedStyles(createHistStyles);
  const theme = useAppTheme();
  const isDrain = entry.mode === 'drain';
  const accentColor = isDrain ? PALETTE.coral : PALETTE.sage;
  const stateCard = NS_STATE_CARDS[entry.nsState];

  return (
    <VelvetGlassSurface style={histStyles.card} intensity={20}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(44, 54, 69, 0.40)', 'rgba(26, 30, 41, 0.20)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={histStyles.insightPadding}>
        <View style={histStyles.cardHeader}>
          <View style={[histStyles.modeBadge, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]}>
            <Text style={[histStyles.modeBadgeText, { color: accentColor }]}>
              {isDrain ? 'DRAIN' : 'GLIMMER'}
            </Text>
          </View>
          <Text style={histStyles.timeText}>{formatDate(entry.timestamp)} · {formatTime(entry.timestamp)}</Text>
        </View>

        <Text style={histStyles.eventText}>{entry.event}</Text>

        <View style={histStyles.metaRow}>
          <View style={[histStyles.statePill, { borderColor: `${stateCard.color}30`, backgroundColor: `${stateCard.color}10` }]}>
            <Text style={[histStyles.statePillText, { color: stateCard.color }]}>{stateCard.label}</Text>
          </View>
          {entry.contextArea && (
            <View style={histStyles.areaPill}>
              <Text style={histStyles.areaPillText}>{entry.contextArea}</Text>
            </View>
          )}
          {entry.intensity && (
            <View style={histStyles.intensityWrap}>
              {[1, 2, 3, 4, 5].map(i => (
                <View
                  key={i}
                  style={[
                    histStyles.intensityDot,
                    { backgroundColor: i <= entry.intensity! ? accentColor : PALETTE.glassBorder },
                  ]}
                />
              ))}
            </View>
          )}
          <Text style={histStyles.todLabel}>{timeOfDayLabel(entry.timestamp)}</Text>
        </View>

        {entry.sensations.length > 0 && (
          <View style={histStyles.sensationRow}>
            {entry.sensations.map(s => (
              <Text key={s} style={histStyles.sensationChip}>{s}</Text>
            ))}
          </View>
        )}

        {entry.resolution ? (
          <View style={histStyles.resolutionBox}>
            <Text style={histStyles.resolutionLabel}>WHAT HELPED</Text>
            <Text style={histStyles.resolutionText}>{entry.resolution}</Text>
          </View>
        ) : null}
      </View>
    </VelvetGlassSurface>
  );
}

const createHistStyles = (theme: AppTheme) => StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    overflow: 'hidden',
  },
  insightPadding: {
    padding: 24,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  modeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  timeText: { fontSize: 12, color: PALETTE.taupe, fontWeight: '600' },
  eventText: { fontSize: 16, color: theme.textPrimary, lineHeight: 24, marginBottom: 16, letterSpacing: 0.2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 },
  statePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  statePillText: { fontSize: 12, fontWeight: '700' },
  areaPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : theme.pillSurface, borderWidth: 1, borderColor: PALETTE.glassBorder },
  areaPillText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
  intensityWrap: { flexDirection: 'row', gap: 4, alignItems: 'center', marginHorizontal: 4 },
  intensityDot: { width: 6, height: 6, borderRadius: 3 },
  todLabel: { fontSize: 12, color: PALETTE.taupe },
  sensationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  sensationChip: { fontSize: 11, color: theme.textSecondary, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : theme.pillSurface, borderWidth: 1, borderColor: PALETTE.glassBorder },
  resolutionBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: PALETTE.glassBorder },
  resolutionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: PALETTE.taupe, marginBottom: 8 },
  resolutionText: { fontSize: 14, color: theme.textSecondary, lineHeight: 22 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function TriggerLogScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('log');
  const [mode, setMode] = useState<LogMode>('drain');
  const [eventText, setEventText] = useState('');
  const [selectedState, setSelectedState] = useState<NSState | null>(null);
  const [selectedSensations, setSelectedSensations] = useState<string[]>([]);
  const [customSensation, setCustomSensation] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSensationOptions, setCustomSensationOptions] = useState<CustomSensationOption[]>([]);
  const [editingCustomSensationId, setEditingCustomSensationId] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [resolution, setResolution] = useState('');
  const [contextArea, setContextArea] = useState<string | null>(null);
  const [showMoreAreas, setShowMoreAreas] = useState(false);
  const [customAreaInput, setCustomAreaInput] = useState('');
  const [showCustomAreaInput, setShowCustomAreaInput] = useState(false);
  const [customAreaOptions, setCustomAreaOptions] = useState<CustomAreaOption[]>([]);
  const [editingCustomAreaId, setEditingCustomAreaId] = useState<string | null>(null);
  const [beforeState, setBeforeState] = useState<NSState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<TriggerEvent[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    loadHistory().catch(() => {});
    loadCustomOptions().catch(() => {});
  }, []);

  const loadHistory = async () => {
    try {
      setHistory(await loadTriggerEvents());
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoaded(true);
    }
  };

  const loadCustomOptions = async () => {
    try {
      const [areasRaw, sensationsRaw] = await Promise.all([
        loadPlainAccountScopedJson<CustomAreaOption[]>(CUSTOM_AREAS_KEY, [], CUSTOM_AREAS_KEY),
        loadPlainAccountScopedJson<CustomSensationOption[]>(CUSTOM_SENSATIONS_KEY, [], CUSTOM_SENSATIONS_KEY),
      ]);
      setCustomAreaOptions(areasRaw);
      setCustomSensationOptions(sensationsRaw);
    } catch {
      setCustomAreaOptions([]);
      setCustomSensationOptions([]);
    }
  };

  const closeCustomAreaComposer = () => {
    setCustomAreaInput('');
    setShowCustomAreaInput(false);
    setEditingCustomAreaId(null);
  };

  const closeCustomSensationComposer = () => {
    setCustomSensation('');
    setShowCustomInput(false);
    setEditingCustomSensationId(null);
  };

  const persistCustomAreas = (next: CustomAreaOption[]) => {
    savePlainAccountScopedJson(CUSTOM_AREAS_KEY, next).catch(() => {});
  };

  const persistCustomSensations = (next: CustomSensationOption[]) => {
    savePlainAccountScopedJson(CUSTOM_SENSATIONS_KEY, next).catch(() => {});
  };

  const toggleMode = (newMode: LogMode) => {
    if (mode === newMode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMode(newMode);
    setSelectedState(null);
    setSelectedSensations([]);
    setIntensity(null);
    setBeforeState(null);
  };

  const toggleSensation = (sensation: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedSensations(prev =>
      prev.includes(sensation) ? prev.filter(s => s !== sensation) : [...prev, sensation]
    );
  };

  const addCustomSensation = () => {
    const trimmed = customSensation.trim();
    if (!trimmed) return;

    const sensationId = editingCustomSensationId ?? `custom_${mode}_${trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
    const previousLabel = editingCustomSensationId
      ? customSensationOptions.find((option) => option.id === editingCustomSensationId)?.label
      : null;

    setCustomSensationOptions((prev) => {
      const duplicate = prev.find((option) =>
        option.id !== sensationId &&
        option.mode === mode &&
        option.label.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return prev;

      const next = editingCustomSensationId
        ? prev.map((option) => (option.id === editingCustomSensationId ? { ...option, label: trimmed, mode } : option))
        : [...prev, { id: sensationId, label: trimmed, mode }];
      persistCustomSensations(next);
      return next;
    });
    setSelectedSensations((prev) => {
      const withoutPrevious = previousLabel ? prev.filter((value) => value !== previousLabel) : prev;
      return withoutPrevious.includes(trimmed) ? withoutPrevious : [...withoutPrevious, trimmed];
    });
    closeCustomSensationComposer();
  };

  const saveCustomArea = () => {
    const trimmed = customAreaInput.trim();
    if (!trimmed) return;

    const areaId = editingCustomAreaId ?? `custom_area_${trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
    const previousLabel = editingCustomAreaId
      ? customAreaOptions.find((option) => option.id === editingCustomAreaId)?.label
      : null;

    setCustomAreaOptions((prev) => {
      const duplicate = prev.find((option) =>
        option.id !== areaId && option.label.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return prev;

      const next = editingCustomAreaId
        ? prev.map((option) => (option.id === editingCustomAreaId ? { ...option, label: trimmed } : option))
        : [...prev, { id: areaId, label: trimmed }];
      persistCustomAreas(next);
      return next;
    });
    setContextArea((prev) => (previousLabel && prev === previousLabel ? trimmed : trimmed));
    closeCustomAreaComposer();
  };

  const promptCustomAreaAction = (area: CustomAreaOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Custom Area', `Manage "${area.label}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Edit',
        onPress: () => {
          setCustomAreaInput(area.label);
          setEditingCustomAreaId(area.id);
          setShowCustomAreaInput(true);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setCustomAreaOptions((prev) => {
            const next = prev.filter((option) => option.id !== area.id);
            persistCustomAreas(next);
            return next;
          });
          setContextArea((prev) => (prev === area.label ? null : prev));
          if (editingCustomAreaId === area.id) closeCustomAreaComposer();
        },
      },
    ]);
  };

  const promptCustomSensationAction = (sensation: CustomSensationOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Custom Cue', `Manage "${sensation.label}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Edit',
        onPress: () => {
          setCustomSensation(sensation.label);
          setEditingCustomSensationId(sensation.id);
          setShowCustomInput(true);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setCustomSensationOptions((prev) => {
            const next = prev.filter((option) => option.id !== sensation.id);
            persistCustomSensations(next);
            return next;
          });
          setSelectedSensations((prev) => prev.filter((value) => value !== sensation.label));
          if (editingCustomSensationId === sensation.id) closeCustomSensationComposer();
        },
      },
    ]);
  };

  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const handleSeal = async () => {
    if (!eventText.trim() || !selectedState) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const entry: TriggerEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      mode,
      event: eventText.trim(),
      nsState: selectedState,
      sensations: selectedSensations,
      ...(intensity !== null ? { intensity } : {}),
      ...(resolution.trim() ? { resolution: resolution.trim() } : {}),
      ...(contextArea ? { contextArea } : {}),
      ...(mode === 'nourish' && beforeState ? { beforeState } : {}),
    };

    try {
      const existing = await loadTriggerEvents();
      const updated = [entry, ...existing];
      await addTriggerEvent(entry);
      setHistory(updated);
    } catch {}

    setSaving(false);
    setSaved(true);

    navigationTimeoutRef.current = setTimeout(() => {
      setSaved(false);
      router.back();
    }, 2200);
  };

  const activeColor = mode === 'drain' ? PALETTE.coral : PALETTE.sage;
  const placeholderColor = PALETTE.textMuted;

  return (
    <View style={styles.container}>
      {/* Home Screen Base Background Layer */}
      <SkiaDynamicCosmos />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(110, 140, 180, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(212, 175, 55, 0.06)' }]} />
      </View>

      {/* Post-save Confirmation Overlay */}
      {saved && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(400)}
          style={styles.confirmOverlay}
          pointerEvents="none"
        >
          <VelvetGlassSurface style={styles.confirmCard} intensity={30}>
            <LinearGradient pointerEvents="none" colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
            <MetallicIcon name={mode === 'drain' ? 'pulse-outline' : 'sunny-outline'} size={44} style={{ marginBottom: 14 }} />
            <Text style={styles.confirmTitle}>Logged.</Text>
            <Text style={styles.confirmBody}>
              {mode === 'drain'
                ? 'You noticed. That awareness is the first shift.'
                : 'A glimmer recognized becomes a resource carried forward.'}
            </Text>
          </VelvetGlassSurface>
        </Animated.View>
      )}

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header Row */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
            hitSlop={10}
          >
            <MetallicIcon name="chevron-back-outline" size={24} color={PALETTE.taupe} />
          </Pressable>

          {/* View Mode Toggle */}
          <View style={styles.viewToggle}>
            <Pressable
              style={[styles.viewToggleBtn, viewMode === 'log' && styles.viewToggleBtnActive]}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setViewMode('log'); }}
            >
              <Text style={[styles.viewToggleText, viewMode === 'log' && styles.viewToggleTextActive]}>Log</Text>
            </Pressable>
            <Pressable
              style={[styles.viewToggleBtn, viewMode === 'history' && styles.viewToggleBtnActive]}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setViewMode('history'); }}
            >
              <Text style={[styles.viewToggleText, viewMode === 'history' && styles.viewToggleTextActive]}>
                History{history.length > 0 ? ` (${history.length})` : ''}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Title Area matching Home */}
        <Animated.View entering={FadeInDown.duration(1000)} style={styles.titleArea}>
          <Text style={styles.greeting}>{keepLastWordsTogether('Nervous System Log')}</Text>
          <GoldSubtitle style={styles.subtitle}>Triggers, drains, and glimmers</GoldSubtitle>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ════════════════════════ HISTORY VIEW ════════════════════════ */}
          {viewMode === 'history' ? (
            <View style={{ paddingTop: 16 }}>
              {!historyLoaded ? (
                <Text style={styles.emptyText}>Loading…</Text>
              ) : history.length === 0 ? (
                <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🌿</Text>
                  <Text style={styles.emptyTitle}>No entries yet</Text>
                  <Text style={styles.emptyText}>Switch to Log to record your first event.</Text>
                </Animated.View>
              ) : (
                <>
                  {history.map((entry, i) => (
                    <Animated.View key={entry.id} entering={FadeInDown.delay(i * 40).duration(400)}>
                      <HistoryEntry entry={entry} />
                    </Animated.View>
                  ))}
                </>
              )}
            </View>
          ) : (

          /* ════════════════════════ LOG VIEW ════════════════════════ */
          <View>
            {/* Card 1: Event & Mode */}
            <SectionHeader title="Log An Event" icon="pencil-outline" />
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <VelvetGlassSurface style={styles.logCard} intensity={20}>
                <LinearGradient pointerEvents="none" colors={['rgba(44, 54, 69, 0.40)', 'rgba(26, 30, 41, 0.20)']} style={StyleSheet.absoluteFill} />
                <View style={styles.insightPadding}>
                  <View style={styles.toggleContainer}>
                    <Pressable
                      style={[styles.toggleBtn, mode === 'drain' && styles.toggleBtnActiveDrain]}
                      onPress={() => toggleMode('drain')}
                    >
                      <Text style={[styles.toggleText, mode === 'drain' && styles.toggleTextActiveDrain]}>Trigger</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.toggleBtn, mode === 'nourish' && styles.toggleBtnActiveNourish]}
                      onPress={() => toggleMode('nourish')}
                    >
                      <Text style={[styles.toggleText, mode === 'nourish' && styles.toggleTextActiveNourish]}>Glimmer</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.cardLabel}>WHAT HAPPENED?</Text>
                  <View style={[styles.inputGlass, { borderColor: theme.isDark ? `${activeColor}40` : PALETTE.glassBorder }]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={
                        mode === 'drain'
                          ? 'What shifted your energy downward?'
                          : 'What brought you a moment of peace?'
                      }
                      placeholderTextColor={placeholderColor}
                      value={eventText}
                      onChangeText={setEventText}
                      multiline
                      maxLength={1000}
                    />
                  </View>
                </View>
              </VelvetGlassSurface>
            </Animated.View>

            {/* Card 2: Context & Intensity */}
            <SectionHeader title="Context & Energy" icon="compass-outline" />
            <Animated.View entering={FadeInDown.delay(300).duration(600)}>
              <VelvetGlassSurface style={styles.logCard} intensity={20}>
                <LinearGradient pointerEvents="none" colors={['rgba(44, 54, 69, 0.40)', 'rgba(26, 30, 41, 0.20)']} style={StyleSheet.absoluteFill} />
                <View style={styles.insightPadding}>
                  <Text style={styles.cardLabel}>
                    {mode === 'drain' ? 'INTENSITY' : 'DEPTH OF SHIFT'}
                  </Text>
                  <View style={styles.intensityRow}>
                    <EditorialLikertScale
                      value={intensity}
                      onChange={(nextValue) => setIntensity(nextValue as 1 | 2 | 3 | 4 | 5 | null)}
                      clearable
                      stretch={false}
                      style={styles.intensityScaleRow}
                      buttonStyle={styles.intensityBtn}
                      selectedButtonStyle={styles.intensityBtnSelected}
                      labelStyle={styles.intensityNum}
                      selectedLabelStyle={styles.intensityNumSelected}
                    />
                    <Text style={styles.intensityHint}>optional</Text>
                  </View>

                  <Text style={[styles.cardLabel, { marginTop: 32 }]}>LIFE AREA</Text>
                  <Text style={styles.helperText}>Tap to select. Hold a custom area to edit or delete it.</Text>
                  <EditorialPillGrid
                    style={styles.tagCloud}
                    items={[
                      ...(showMoreAreas ? [...PRIMARY_AREAS, ...EXTENDED_AREAS] : PRIMARY_AREAS).map((area) => ({
                        key: area,
                        label: area,
                        selected: contextArea === area,
                        selectedBackgroundColor: PALETTE.textMain,
                        selectedTextColor: PALETTE.bg,
                        onPress: () => {
                          Haptics.selectionAsync().catch(() => {});
                          setContextArea((prev) => (prev === area ? null : area));
                        },
                        labelStyle: styles.tagText,
                        selectedLabelStyle: styles.tagTextSelected,
                      })),
                      ...customAreaOptions.map((area) => ({
                        key: area.id,
                        label: area.label,
                        selected: contextArea === area.label,
                        variant: 'custom' as const,
                        selectedBackgroundColor: PALETTE.textMain,
                        selectedTextColor: PALETTE.bg,
                        onPress: () => {
                          Haptics.selectionAsync().catch(() => {});
                          setContextArea((prev) => (prev === area.label ? null : area.label));
                        },
                        onLongPress: () => promptCustomAreaAction(area),
                        labelStyle: styles.tagText,
                        selectedLabelStyle: styles.tagTextSelected,
                      })),
                      {
                        key: 'toggle-areas',
                        label: showMoreAreas ? 'Less ↑' : 'More ↓',
                        variant: 'utility' as const,
                        onPress: () => {
                          Haptics.selectionAsync().catch(() => {});
                          setShowMoreAreas((prev) => !prev);
                        },
                        labelStyle: styles.tagText,
                      },
                      {
                        key: 'custom-area',
                        label: '+ Custom',
                        selected: showCustomAreaInput,
                        variant: 'utility' as const,
                        selectedBackgroundColor: PALETTE.textMain,
                        selectedTextColor: PALETTE.bg,
                        onPress: () => {
                          Haptics.selectionAsync().catch(() => {});
                          setShowCustomAreaInput((prev) => !prev);
                          setEditingCustomAreaId(null);
                          setCustomAreaInput('');
                        },
                        labelStyle: styles.tagText,
                        selectedLabelStyle: styles.tagTextSelected,
                      },
                    ]}
                  />
                  {showCustomAreaInput && (
                    <View style={styles.customAreaRow}>
                      <TextInput
                        value={customAreaInput}
                        onChangeText={setCustomAreaInput}
                        placeholder="e.g. School, Caregiving…"
                        placeholderTextColor={placeholderColor}
                        style={styles.customAreaInput}
                        returnKeyType="done"
                        onSubmitEditing={saveCustomArea}
                      />
                      <Pressable onPress={saveCustomArea} style={[styles.customAreaConfirm, { borderColor: activeColor }]}>
                        <MetallicText style={styles.tagText} color={activeColor}>{editingCustomAreaId ? 'Update' : 'Set'}</MetallicText>
                      </Pressable>
                    </View>
                  )}
                  {contextArea && !PRIMARY_AREAS.includes(contextArea) && !EXTENDED_AREAS.includes(contextArea) && !customAreaOptions.some((area) => area.label === contextArea) && (
                    <EditorialPillGrid
                      items={[{ key: `ad-hoc-${contextArea}`, label: `${contextArea} ✕`, onPress: () => setContextArea(null), style: styles.adHocContextChip, labelStyle: styles.tagText }]}
                    />
                  )}
                </View>
              </VelvetGlassSurface>
            </Animated.View>

            {/* Card 3: Nervous System State */}
            <SectionHeader title="Nervous System" icon="pulse-outline" />
            <Animated.View entering={FadeInDown.delay(400).duration(600)}>
              <VelvetGlassSurface style={styles.logCard} intensity={20}>
                <LinearGradient pointerEvents="none" colors={['rgba(44, 54, 69, 0.40)', 'rgba(26, 30, 41, 0.20)']} style={StyleSheet.absoluteFill} />
                <View style={styles.insightPadding}>
                  <Text style={styles.cardLabel}>CURRENT STATE</Text>
                  <View style={styles.stateGrid}>
                    {(mode === 'drain' ? ['sympathetic', 'dorsal'] : ['ventral', 'still']).map(state => {
                      const card = NS_STATE_CARDS[state];
                      const isSelected = selectedState === state;
                      return (
                        <Pressable
                          key={state}
                          style={[styles.stateCard, isSelected && styles.stateCardSelected]}
                          onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedState(state as NSState); }}
                        >
                          <Text style={styles.stateTitle}>{card.label}</Text>
                          <Text style={styles.stateSub}>{card.sub}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {mode === 'nourish' && (
                    <>
                      <Text style={[styles.cardLabel, { marginTop: 32 }]}>WHERE DID YOU START?</Text>
                      <View style={styles.stateGrid}>
                        {(['sympathetic', 'dorsal', 'ventral', 'still'] as NSState[]).map(state => {
                          const card = NS_STATE_CARDS[state];
                          const isSelected = beforeState === state;
                          return (
                            <Pressable
                              key={state}
                              style={[styles.stateCard, isSelected && { borderColor: card.color, backgroundColor: `${card.color}15` }]}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                setBeforeState(prev => (prev === state ? null : state));
                              }}
                            >
                              <Text style={styles.stateTitle}>{card.label}</Text>
                              <Text style={styles.stateSub}>{card.sub}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              </VelvetGlassSurface>
            </Animated.View>

            {/* Card 4: Somatics & Resolution */}
            <SectionHeader title="Body & Response" icon="body-outline" />
            <Animated.View entering={FadeInDown.delay(500).duration(600)}>
              <VelvetGlassSurface style={styles.logCard} intensity={20}>
                <LinearGradient pointerEvents="none" colors={['rgba(44, 54, 69, 0.40)', 'rgba(26, 30, 41, 0.20)']} style={StyleSheet.absoluteFill} />
                <View style={styles.insightPadding}>
                  <Text style={styles.cardLabel}>SOMATIC CUES</Text>
                  <Text style={styles.helperText}>Tap to select. Hold a custom cue to edit or delete it.</Text>
                  <EditorialPillGrid
                    style={styles.tagCloud}
                    items={[
                      ...SENSATIONS[mode].map((sensation) => ({
                        key: sensation,
                        label: sensation,
                        selected: selectedSensations.includes(sensation),
                        selectedBackgroundColor: PALETTE.textMain,
                        selectedTextColor: PALETTE.bg,
                        onPress: () => toggleSensation(sensation),
                        labelStyle: styles.tagText,
                        selectedLabelStyle: styles.tagTextSelected,
                      })),
                      ...customSensationOptions.filter((o) => o.mode === mode).map((option) => ({
                        key: option.id,
                        label: option.label,
                        selected: selectedSensations.includes(option.label),
                        variant: 'custom' as const,
                        selectedBackgroundColor: PALETTE.textMain,
                        selectedTextColor: PALETTE.bg,
                        onPress: () => toggleSensation(option.label),
                        onLongPress: () => promptCustomSensationAction(option),
                        labelStyle: styles.tagText,
                        selectedLabelStyle: styles.tagTextSelected,
                      })),
                      ...(!showCustomInput ? [{
                        key: 'add-custom-cue', label: '+ custom', variant: 'utility' as const, style: styles.addCueChip, labelStyle: [styles.tagText, styles.addCueText],
                        onPress: () => { Haptics.selectionAsync().catch(() => {}); setShowCustomInput(true); setEditingCustomSensationId(null); setCustomSensation(''); },
                      }] : []),
                    ]}
                  />
                  {showCustomInput ? (
                    <View style={styles.customCueRow}>
                      <TextInput
                        style={styles.customCueInput}
                        placeholder="Custom cue…"
                        placeholderTextColor={placeholderColor}
                        value={customSensation}
                        onChangeText={setCustomSensation}
                        autoFocus
                        maxLength={40}
                        onSubmitEditing={addCustomSensation}
                        returnKeyType="done"
                      />
                      <Pressable style={[styles.customCueAdd, styles.utilityChip]} onPress={addCustomSensation}>
                        <Text style={[styles.customCueAddText, { color: activeColor }]}>{editingCustomSensationId ? 'Update' : 'Add'}</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  <Text style={[styles.cardLabel, { marginTop: 32 }]}>
                    {mode === 'drain' ? 'WHAT HELPED? (optional)' : 'WHAT CREATED THIS? (optional)'}
                  </Text>
                  <View style={[styles.inputGlass, { minHeight: 100 }]}>
                    <TextInput
                      style={[styles.textInput, { minHeight: 100, fontSize: 16 }]}
                      placeholder={mode === 'drain' ? 'Walked, breathed, called someone, sat outside…' : 'Music, sunlight, a kind word, stillness…'}
                      placeholderTextColor={placeholderColor}
                      value={resolution}
                      onChangeText={setResolution}
                      multiline
                      maxLength={500}
                    />
                  </View>
                </View>
              </VelvetGlassSurface>
            </Animated.View>

            {/* Save Button */}
            <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.submitSection}>
              {(!eventText.trim() || !selectedState) && (
                <Text style={styles.submitHint}>
                  {!eventText.trim() ? 'Describe what happened to log this entry' : 'Select a nervous system state above'}
                </Text>
              )}
              <Pressable
                style={[styles.sealBtn, { backgroundColor: (!eventText.trim() || !selectedState || saving || saved) ? 'rgba(255,255,255,0.1)' : PALETTE.textMain }]}
                onPress={handleSeal}
                disabled={!eventText.trim() || !selectedState || saving || saved}
              >
                <Text style={[styles.sealBtnText, { color: (!eventText.trim() || !selectedState || saving || saved) ? PALETTE.textMuted : PALETTE.bg }]}>
                  {saving ? 'SAVING…' : 'SAVE ENTRY'}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
          )}

          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => {
  const raisedBorder = theme.isDark ? 'rgba(255,255,255,0.10)' : theme.cardBorder;
  const raisedTopBorder = theme.isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.68)';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: PALETTE.bg },
    safeArea: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 8 },
    titleArea: { marginBottom: 32 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: PALETTE.glassSurface, borderWidth: 1, borderColor: PALETTE.glassBorder, justifyContent: 'center', alignItems: 'center' },

    viewToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: PALETTE.glassBorder },
    viewToggleBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 11, backgroundColor: 'transparent' },
    viewToggleBtnActive: { backgroundColor: 'rgba(255,255,255,0.09)', borderColor: 'rgba(255,255,255,0.16)', borderWidth: 1 },
    viewToggleText: { fontSize: 13, color: PALETTE.textMuted, fontWeight: '600' },
    viewToggleTextActive: { color: PALETTE.textMain },

    greeting: { fontSize: 32, color: PALETTE.textMain, fontWeight: '800', letterSpacing: -1, lineHeight: 36, marginBottom: 4, maxWidth: '88%' },
    subtitle: { fontSize: 12, fontWeight: '600' },

    // Nebula background glow orbs matching Home
    glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },

    // Section Header matching Home
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 8 },
    sectionTitle: { color: PALETTE.textMain, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },

    // Reusable Log Card
    logCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: raisedBorder,
      borderTopColor: raisedTopBorder,
      backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
      overflow: 'hidden',
      marginBottom: 32,
    },
    insightPadding: { padding: 24 },
    cardLabel: { fontSize: 10, color: PALETTE.textMuted, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 },

    // Log Elements
    toggleContainer: { flexDirection: 'row', minHeight: 56, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, marginBottom: 32, padding: 4, borderWidth: 1, borderColor: PALETTE.glassBorder, gap: 4 },
    toggleBtn: { flex: 1, minHeight: 48, paddingVertical: 13, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'transparent' },
    toggleBtnActiveDrain: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FFFFFF' },
    toggleBtnActiveNourish: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FFFFFF' },
    toggleText: { fontSize: 14, lineHeight: 18, fontWeight: '700', color: PALETTE.textMuted, letterSpacing: 0.2 },
    toggleTextActiveDrain: { color: PALETTE.bg },
    toggleTextActiveNourish: { color: PALETTE.bg },

    helperText: { fontSize: 12, color: PALETTE.textMuted, marginTop: -6, marginBottom: 14, lineHeight: 18 },

    intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    intensityScaleRow: { alignItems: 'center', gap: 8 },
    intensityBtn: { width: 44, height: 44, borderRadius: 22, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: PALETTE.glassBorder, justifyContent: 'center', alignItems: 'center' },
    intensityNum: { fontSize: 16, fontWeight: '700', color: PALETTE.textMain },
    intensityBtnSelected: { backgroundColor: PALETTE.taupe, borderColor: PALETTE.taupe },
    intensityNumSelected: { color: PALETTE.bg },
    intensityHint: { fontSize: 13, color: PALETTE.textMuted, marginLeft: 8 },

    inputGlass: { borderRadius: 16, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 16, paddingVertical: 0, minHeight: 120 },
    textInput: { color: PALETTE.textMain, fontSize: 16, lineHeight: 24, minHeight: 120, paddingTop: 16, paddingBottom: 22, textAlignVertical: 'top' },

    stateGrid: { gap: 12 },
    stateCard: { borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'rgba(0,0,0,0.2)', padding: 20 },
    stateCardSelected: { backgroundColor: 'rgba(164, 158, 151, 0.1)', borderColor: PALETTE.taupe },
    stateTitle: { fontSize: 17, fontWeight: '700', color: PALETTE.textMain, marginBottom: 6 },
    stateSub: { fontSize: 14, color: PALETTE.textMuted, lineHeight: 20 },

    tagCloud: { marginTop: 4, marginBottom: 4 },
    addCueChip: { borderRadius: 20 },
    utilityChip: { backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: PALETTE.glassBorder },
    tagText: { fontSize: 11, lineHeight: 14, color: PALETTE.textMain, fontWeight: '600' },
    tagTextSelected: { color: PALETTE.bg },
    addCueText: { color: PALETTE.textMain },
    adHocContextChip: { alignSelf: 'flex-start', marginTop: 6 },

    customAreaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
    customAreaInput: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 16, fontSize: 14, color: PALETTE.textMain },
    customAreaConfirm: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
    customCueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
    customCueInput: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 16, color: PALETTE.textMain, fontSize: 14 },
    customCueAdd: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'rgba(0,0,0,0.2)' },
    customCueAddText: { fontSize: 14, fontWeight: '700' },

    submitSection: { paddingHorizontal: 0, marginBottom: 8, alignItems: 'center' },
    submitHint: { fontSize: 13, color: PALETTE.textMuted, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
    sealBtn: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    sealBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 1.2 },

    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyEmoji: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 20, color: PALETTE.textMain, fontWeight: '700', marginBottom: 8 },
    emptyText: { fontSize: 14, color: PALETTE.textMuted, textAlign: 'center', lineHeight: 21 },

    confirmOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 100, backgroundColor: 'rgba(10, 12, 16, 0.85)' },
    confirmCard: { borderRadius: 32, padding: 40, alignItems: 'center', maxWidth: 320, borderWidth: 1, borderColor: raisedBorder, borderTopColor: raisedTopBorder, overflow: 'hidden' },
    confirmTitle: { fontSize: 32, color: PALETTE.textMain, fontWeight: '800', marginBottom: 12, letterSpacing: -1 },
    confirmBody: { fontSize: 15, color: PALETTE.textMuted, textAlign: 'center', lineHeight: 22 },
  });
};
