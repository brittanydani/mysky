// app/trigger-log.tsx
// MySky — Polyvagal Trigger Log
// Log and review nervous system events (Drains & Glimmers), mapped to
// Polyvagal Theory states. All data stored locally. Nothing transmitted.

import * as React from 'react';
const { useState, useEffect } = React;
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
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
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
export type { TriggerEvent } from '../utils/triggerEventTypes';

const STORAGE_KEY = '@mysky:trigger_events';
const CUSTOM_AREAS_KEY = '@mysky:trigger_custom_areas';
const CUSTOM_SENSATIONS_KEY = '@mysky:trigger_custom_sensations';

const PALETTE = {
  bg: '#0A0A0F',
  gold: '#D9BF8C',
  sage: '#8CBEAA',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
  crimson: '#FF8FA1',
  copper: '#CD7F5D',
  lavender: '#A89BC8',
  textMain: '#FFFFFF',
  textMuted: 'rgba(226,232,240,0.45)',
  glassBorder: 'rgba(255,255,255,0.08)',
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
  sympathetic: { label: 'Fight or Flight', sub: 'Anxious, frantic, mobilized, angry.', color: PALETTE.copper },
  dorsal:      { label: 'Freeze or Fawn',  sub: 'Shut down, numb, disconnected, pleasing.', color: PALETTE.lavender },
  ventral:     { label: 'Safe & Social',   sub: 'Grounded, connected, open, breathing freely.', color: PALETTE.sage },
  still:       { label: 'Safe & Still',    sub: 'Quiet, calm, peacefully alone, restored.', color: PALETTE.rose },
};

// ─────────────────────────────────────────────────────────────────────────────
// History Entry Component
// ─────────────────────────────────────────────────────────────────────────────

function HistoryEntry({ entry }: { entry: TriggerEvent }) {
  const histStyles = useThemedStyles(createHistStyles);
  const theme = useAppTheme();
  const isDrain = entry.mode === 'drain';
  const accentColor = isDrain ? PALETTE.copper : PALETTE.sage;
  const stateCard = NS_STATE_CARDS[entry.nsState];

  return (
    <VelvetGlassSurface style={histStyles.card} intensity={26} backgroundColor={theme.isDark ? 'rgba(15, 15, 20, 0.54)' : 'rgba(255, 255, 255, 0.82)'}>
      <View style={histStyles.cardHeader}>
        <View style={[histStyles.modeBadge, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }]}>
          <Text style={[histStyles.modeBadgeText, { color: accentColor }]}>
            {isDrain ? 'DRAIN' : 'GLIMMER'}
          </Text>
        </View>
        <Text style={histStyles.timeText}>{formatDate(entry.timestamp)} · {formatTime(entry.timestamp)}</Text>
      </View>

      <Text style={histStyles.eventText}>{entry.event}</Text>

      <View style={histStyles.metaRow}>
        <View style={[histStyles.statePill, { borderColor: `${stateCard.color}40`, backgroundColor: `${stateCard.color}10` }]}>
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
                  { backgroundColor: i <= entry.intensity! ? accentColor : 'rgba(255,255,255,0.1)' },
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
    </VelvetGlassSurface>
  );
}

const createHistStyles = (theme: AppTheme) => StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  modeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  timeText: { fontSize: 11, color: theme.textMuted },
  eventText: { fontSize: 15, color: theme.textPrimary, lineHeight: 22, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 },
  statePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statePillText: { fontSize: 11, fontWeight: '600' },
  areaPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.pillSurface, borderWidth: 1, borderColor: theme.cardBorder },
  areaPillText: { fontSize: 11, color: theme.textSecondary },
  intensityWrap: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  intensityDot: { width: 7, height: 7, borderRadius: 4 },
  todLabel: { fontSize: 11, color: theme.textMuted },
  sensationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  sensationChip: { fontSize: 10, color: theme.textSecondary, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : theme.pillSurface, borderWidth: 1, borderColor: theme.cardBorder },
  resolutionBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.cardBorder },
  resolutionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: theme.textMuted, marginBottom: 4 },
  resolutionText: { fontSize: 13, color: theme.textSecondary, lineHeight: 19 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 }}>
      <MetallicIcon name={icon as any} size={16} variant="gold" />
      <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>
    </View>
  );
}

export default function TriggerLogScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
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
      const raw = await EncryptedAsyncStorage.getItem(STORAGE_KEY);
      setHistory(raw ? JSON.parse(raw) : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoaded(true);
    }
  };

  const loadCustomOptions = async () => {
    try {
      const [areasRaw, sensationsRaw] = await Promise.all([
        EncryptedAsyncStorage.getItem(CUSTOM_AREAS_KEY),
        EncryptedAsyncStorage.getItem(CUSTOM_SENSATIONS_KEY),
      ]);
      setCustomAreaOptions(areasRaw ? JSON.parse(areasRaw) : []);
      setCustomSensationOptions(sensationsRaw ? JSON.parse(sensationsRaw) : []);
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
    EncryptedAsyncStorage.setItem(CUSTOM_AREAS_KEY, JSON.stringify(next)).catch(() => {});
  };

  const persistCustomSensations = (next: CustomSensationOption[]) => {
    EncryptedAsyncStorage.setItem(CUSTOM_SENSATIONS_KEY, JSON.stringify(next)).catch(() => {});
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
      const raw = await EncryptedAsyncStorage.getItem(STORAGE_KEY);
      const existing: TriggerEvent[] = raw ? JSON.parse(raw) : [];
      const updated = [entry, ...existing];
      await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setHistory(updated);
      // Cloud sync (fire-and-forget)
      import('../services/storage/syncService').then(({ enqueueTriggerEvent }) =>
        enqueueTriggerEvent(entry),
      ).catch(() => {});
    } catch {
      // silent fail — entry lost on storage error, no UX disruption
    }

    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
      router.back();
    }, 2200);
  };

  const activeColor = mode === 'drain' ? PALETTE.crimson : PALETTE.gold;
  const placeholderColor = theme.textMuted;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(140, 190, 170, 0.10)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(205, 127, 93, 0.06)' }]} />
      </View>

      {/* ── Post-save Confirmation Overlay ── */}
      {saved && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(400)}
          style={styles.confirmOverlay}
          pointerEvents="none"
        >
          <VelvetGlassSurface style={styles.confirmCard} intensity={30} backgroundColor={theme.isDark ? 'rgba(15, 15, 20, 0.66)' : 'rgba(255, 255, 255, 0.88)'}>
            <MetallicIcon
              name={mode === 'drain' ? 'pulse-outline' : 'sunny-outline'}
              size={44}
              style={{ marginBottom: 14 }}
            />
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
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MetallicIcon name="chevron-back-outline" size={22} color={theme.textMuted} />
          </Pressable>

          {/* ── View mode toggle: Log / History ── */}
          
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>{keepLastWordsTogether('Nervous System Log')}</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Triggers, drains, and glimmers</GoldSubtitle>
        </View>

        
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bottomOffset={24}
          extraKeyboardSpace={12}
          disableScrollOnKeyboardHide
        >

          <SectionHeader title="Log An Event" icon="pencil-outline" />
          <VelvetGlassSurface style={styles.formCard} intensity={30} backgroundColor={theme.isDark ? 'rgba(15, 15, 20, 0.54)' : 'rgba(255, 255, 255, 0.82)'}>
          {/* ── Mode Toggle ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.toggleContainer}>
            <Pressable
              style={[styles.toggleBtn, mode === 'drain' && styles.toggleBtnActiveDrain]}
              onPress={() => toggleMode('drain')}
              accessibilityRole="radio"
              accessibilityState={{ selected: mode === 'drain' }}
              accessibilityLabel="Log as trigger (drain)"
            >
              <Text style={[styles.toggleText, mode === 'drain' && styles.toggleTextActiveDrain]}>Trigger (Drain)</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, mode === 'nourish' && styles.toggleBtnActiveNourish]}
              onPress={() => toggleMode('nourish')}
              accessibilityRole="radio"
              accessibilityState={{ selected: mode === 'nourish' }}
              accessibilityLabel="Log as glimmer (nourish)"
            >
              <Text style={[styles.toggleText, mode === 'nourish' && styles.toggleTextActiveNourish]}>Glimmer (Nourish)</Text>
            </Pressable>
          </Animated.View>

          {/* ── Event Input ── */}
          <Animated.View entering={FadeInDown.delay(160).duration(500)} style={styles.inputSection}>
            <Text style={styles.tagSectionLabel}>WHAT HAPPENED?</Text>
            <VelvetGlassSurface
              style={styles.noteInput as any}
              intensity={30}
              backgroundColor={theme.isDark ? 'rgba(18, 18, 24, 0.7)' : 'rgba(0, 0, 0, 0.03)'}
              borderColor={theme.isDark ? `${activeColor}30` : 'rgba(0, 0, 0, 0.06)'}
              highlightColor="rgba(255,255,255,0.16)"
              topEdgeColor="rgba(255,255,255,0.24)"
            >
              <TextInput
                style={[styles.noteInput, {marginTop: 0}] as any}
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
            </VelvetGlassSurface>
          </Animated.View>

          {/* ── Intensity ── */}
          <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.section}>
            <Text style={styles.tagSectionLabel}>
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
              <Text style={styles.intensityHint}>
                {intensity === null ? 'optional' : intensity <= 2 ? 'mild' : intensity <= 3 ? 'moderate' : intensity === 4 ? 'strong' : 'overwhelming'}
              </Text>
            </View>
          </Animated.View>

          {/* ── Context Area ── */}
          <Animated.View entering={FadeInDown.delay(190).duration(500)} style={styles.section}>
            <Text style={styles.tagSectionLabel}>LIFE AREA</Text>
            <Text style={styles.helperText}>Tap to select. Hold a custom area to edit or delete it.</Text>
            <EditorialPillGrid
              style={styles.tagCloud}
              items={[
                ...(showMoreAreas ? [...PRIMARY_AREAS, ...EXTENDED_AREAS] : PRIMARY_AREAS).map((area) => ({
                  key: area,
                  label: area,
                  selected: contextArea === area,
                  selectedBackgroundColor: theme.isDark ? 'rgba(255,255,255,0.92)' : 'rgba(181, 138, 58, 0.22)',
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
                  selectedBackgroundColor: theme.isDark ? 'rgba(255,255,255,0.92)' : 'rgba(181, 138, 58, 0.22)',
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
                  selectedBackgroundColor: theme.isDark ? 'rgba(255,255,255,0.92)' : 'rgba(181, 138, 58, 0.22)',
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
                <Pressable
                  onPress={saveCustomArea}
                  style={[styles.customAreaConfirm, { borderColor: activeColor }]}
                >
                  <MetallicText style={styles.tagText} color={activeColor}>{editingCustomAreaId ? 'Update' : 'Set'}</MetallicText>
                </Pressable>
              </View>
            )}
            {contextArea && !PRIMARY_AREAS.includes(contextArea) && !EXTENDED_AREAS.includes(contextArea) && !customAreaOptions.some((area) => area.label === contextArea) && (
              <EditorialPillGrid
                items={[
                  {
                    key: `ad-hoc-${contextArea}`,
                    label: `${contextArea} ✕`,
                    onPress: () => setContextArea(null),
                    style: styles.adHocContextChip,
                    labelStyle: styles.tagText,
                  },
                ]}
              />
            )}
          </Animated.View>

          {/* ── Current State ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
            <Text style={styles.tagSectionLabel}>CURRENT STATE</Text>
            <View style={styles.stateGrid}>
              {mode === 'drain' ? (
                <>
                  {(['sympathetic', 'dorsal'] as NSState[]).map(state => {
                    const card = NS_STATE_CARDS[state];
                    const isSelected = selectedState === state;
                    return (
                      <Pressable
                        key={state}
                        style={[
                          styles.stateCard,
                          isSelected && styles.stateCardSelected,
                        ]}
                        onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedState(state); }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={card.label}
                      >
                        {isSelected ? (
                          <MetallicText style={styles.stateTitle} color={card.color}>{card.label}</MetallicText>
                        ) : (
                          <Text style={styles.stateTitle}>{card.label}</Text>
                        )}
                        <Text style={styles.stateSub}>{card.sub}</Text>
                      </Pressable>
                    );
                  })}
                </>
              ) : (
                <>
                  {(['ventral', 'still'] as NSState[]).map(state => {
                    const card = NS_STATE_CARDS[state];
                    const isSelected = selectedState === state;
                    return (
                      <Pressable
                        key={state}
                        style={[
                          styles.stateCard,
                          isSelected && styles.stateCardSelected,
                        ]}
                        onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedState(state); }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={card.label}
                      >
                        {isSelected ? (
                          <MetallicText style={styles.stateTitle} color={card.color}>{card.label}</MetallicText>
                        ) : (
                          <Text style={styles.stateTitle}>{card.label}</Text>
                        )}
                        <Text style={styles.stateSub}>{card.sub}</Text>
                      </Pressable>
                    );
                  })}
                </>
              )}
            </View>
          </Animated.View>

          {/* ── Before State (Glimmers only) ── */}
          {mode === 'nourish' && (
            <Animated.View entering={FadeInDown.delay(210).duration(500)} style={styles.section}>
              <Text style={styles.tagSectionLabel}>WHERE DID YOU START?</Text>
              <View style={styles.stateGrid}>
                {(['sympathetic', 'dorsal', 'ventral', 'still'] as NSState[]).map(state => {
                  const card = NS_STATE_CARDS[state];
                  const isSelected = beforeState === state;
                  return (
                    <Pressable
                      key={state}
                      style={[
                        styles.stateCard,
                        isSelected && { borderColor: card.color, backgroundColor: `${card.color}15` },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setBeforeState(prev => (prev === state ? null : state));
                      }}
                    >
                      {isSelected ? (
                        <MetallicText style={styles.stateTitle} color={card.color}>{card.label}</MetallicText>
                      ) : (
                        <Text style={styles.stateTitle}>{card.label}</Text>
                      )}
                      <Text style={styles.stateSub}>{card.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── Somatic Tags ── */}
          <Animated.View entering={FadeInDown.delay(240).duration(500)} style={styles.section}>
            <Text style={styles.tagSectionLabel}>SOMATIC CUES</Text>
            <Text style={styles.helperText}>Tap to select. Hold a custom cue to edit or delete it.</Text>
            <EditorialPillGrid
              style={styles.tagCloud}
              items={[
                ...SENSATIONS[mode].map((sensation) => ({
                  key: sensation,
                  label: sensation,
                  selected: selectedSensations.includes(sensation),
                  selectedBackgroundColor: theme.isDark ? 'rgba(255,255,255,0.92)' : 'rgba(181, 138, 58, 0.22)',
                  onPress: () => toggleSensation(sensation),
                  labelStyle: styles.tagText,
                  selectedLabelStyle: styles.tagTextSelected,
                })),
                ...customSensationOptions
                  .filter((option) => option.mode === mode)
                  .map((option) => ({
                    key: option.id,
                    label: option.label,
                    selected: selectedSensations.includes(option.label),
                    variant: 'custom' as const,
                    selectedBackgroundColor: theme.isDark ? 'rgba(255,255,255,0.92)' : 'rgba(181, 138, 58, 0.22)',
                    onPress: () => toggleSensation(option.label),
                    onLongPress: () => promptCustomSensationAction(option),
                    labelStyle: styles.tagText,
                    selectedLabelStyle: styles.tagTextSelected,
                  })),
                ...(!showCustomInput
                  ? [{
                      key: 'add-custom-cue',
                      label: '+ custom',
                      variant: 'utility' as const,
                      style: styles.addCueChip,
                      labelStyle: [styles.tagText, styles.addCueText],
                      onPress: () => {
                        Haptics.selectionAsync().catch(() => {});
                        setShowCustomInput(true);
                        setEditingCustomSensationId(null);
                        setCustomSensation('');
                      },
                    }]
                  : []),
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
          </Animated.View>

          {/* ── What Helped / Resolution ── */}
          <Animated.View entering={FadeInDown.delay(260).duration(500)} style={styles.inputSection}>
            <Text style={styles.tagSectionLabel}>
              {mode === 'drain' ? 'WHAT HELPED? (optional)' : 'WHAT CREATED THIS? (optional)'}
            </Text>
            <VelvetGlassSurface
              style={styles.noteInput as any}
              intensity={30}
              backgroundColor={theme.isDark ? 'rgba(18, 18, 24, 0.7)' : 'rgba(255, 255, 255, 0.85)'}
              borderColor={`${activeColor}24`}
              highlightColor="rgba(255,255,255,0.14)"
            >
              <TextInput
                style={[styles.textInput, { fontSize: 14 }]}
                placeholder={
                  mode === 'drain'
                    ? 'Walked, breathed, called someone, sat outside…'
                    : 'Music, sunlight, a kind word, stillness…'
                }
                placeholderTextColor={placeholderColor}
                value={resolution}
                onChangeText={setResolution}
                multiline
                maxLength={500}
              />
            </VelvetGlassSurface>
          </Animated.View>

          {/* ── Submit Button ── */}
          <Animated.View entering={FadeInDown.delay(280).duration(500)} style={styles.submitSection}>
            {(!eventText.trim() || !selectedState) && (
              <Text style={styles.submitHint}>
                {!eventText.trim() ? 'Describe what happened to log this entry' : 'Select a nervous system state above'}
              </Text>
            )}
            <Pressable
              style={[
                styles.sealBtn,
                { backgroundColor: (!eventText.trim() || !selectedState || saving || saved) ? (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(212, 175, 55, 0.18)') : activeColor },
              ]}
              onPress={handleSeal}
              disabled={!eventText.trim() || !selectedState || saving || saved}
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Entry logged' : 'Log this entry'}
              accessibilityState={{ disabled: !eventText.trim() || !selectedState || saving || saved }}
            >
              <Text style={[
                styles.sealBtnText,
                { color: (!eventText.trim() || !selectedState || saving || saved) ? theme.textMuted : '#0A0A0C' },
              ]}>
                {saving ? 'SAVING…' : 'SAVE ENTRY'}
              </Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: 48 }} />
            {/* ── Close VelvetGlassSurface ── */}
          </VelvetGlassSurface>

          {/* ════════════════════════ HISTORY MIGRATED ════════════════════════ */}
          {history.length > 0 && (
            <View style={styles.historySection}>
              <SectionHeader title="Previous Reflections" icon="journal-outline" />
              {history.slice(0, 10).map((entry, i) => (
                  <View key={entry.id}><HistoryEntry entry={entry} /></View>
              ))}
            </View>
          )}

          {history.length === 0 && (
            <View style={styles.emptyHint}>
              <Text style={styles.emptyHintText}>Start logging nervous system events to see your patterns emerge over time.</Text>
            </View>
          )}
          <View style={{ height: 100 }} />

</KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },

  formCard: { borderRadius: 28, padding: 24, marginBottom: 32 },
  noteInput: { minHeight: 120, borderRadius: 24, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', padding: 20, paddingTop: 20, color: theme.textPrimary, fontSize: 16, marginBottom: 24, textAlignVertical: 'top' },
  tagSectionLabel: { fontSize: 10, color: theme.textMuted, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16, textTransform: 'uppercase' },
  submitBtn: { height: 56, borderRadius: 28, marginTop: 24, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  submitBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 1, color: '#0A0A0C' },
  emptyHint: { marginTop: 16, marginBottom: 16, padding: 20, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyHintText: { fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 21, textAlign: 'center' },
  historySection: { gap: 12 },

  safeArea: { flex: 1 },

  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingHorizontal: 24 },
  titleArea: { paddingHorizontal: 24, marginVertical: 32 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, borderWidth: 1, borderColor: theme.cardBorder, justifyContent: 'center', alignItems: 'center' },

  viewToggle: { flexDirection: 'row', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.035)' : theme.pillSurface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: theme.cardBorder },
  viewToggleBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 11, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : theme.pillSurfaceMuted, borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(212, 175, 55, 0.12)' },
  viewToggleBtnActive: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.72)', borderColor: theme.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(212, 175, 55, 0.2)' },
  viewToggleText: { fontSize: 13, color: theme.textMuted, fontWeight: '600' },
  viewToggleTextActive: { color: theme.textPrimary },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  headerTitle: {
    fontSize: 32,
    color: theme.textPrimary,
    fontWeight: '800',
    letterSpacing: -1,
  },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
    borderRadius: 18,
    padding: 4,
    marginBottom: 30,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.pillSurface },
  toggleBtnActiveDrain: {
    backgroundColor: 'rgba(220, 50, 50, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(220, 50, 50, 0.3)',
    shadowColor: '#FF8FA1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 3,
  },
  toggleBtnActiveNourish: {
    backgroundColor: '#D4AF37',
  },
  toggleText: { fontSize: 13, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.35 },
  toggleTextActiveDrain: { color: theme.isDark ? 'rgba(255,255,255,0.92)' : '#1A1815' },
  toggleTextActiveNourish: { color: '#0A0A0F' },

  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 16,
  },
  helperText: { fontSize: 12, color: theme.textMuted, marginTop: -6, marginBottom: 14, lineHeight: 18 },

  intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  intensityScaleRow: { alignItems: 'center' },
  intensityBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  intensityNum: { fontSize: 16, fontWeight: '700', color: theme.textMuted },
  intensityBtnSelected: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' },
  intensityNumSelected: { color: '#0A0A0F' },
  intensityHint: { fontSize: 11, color: theme.textMuted },

  inputSection: { marginBottom: 32 },
  inputGlass: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.pillSurface,
    paddingHorizontal: 24,
    paddingVertical: 0,
    minHeight: 154,
  },
  textInput: {
    color: theme.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 154,
    paddingTop: 16,
    paddingBottom: 22,
    textAlignVertical: 'top',
  },

  stateGrid: { gap: 12 },
  stateCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
    padding: 24,
  },
  stateCardSelected: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(181, 138, 58, 0.16)' },
  stateTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
  stateSub: { fontSize: 13, color: theme.textSecondary, lineHeight: 19 },

  tagCloud: {},
  addCueChip: { borderRadius: 20 },
  utilityChip: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : theme.pillSurface, borderWidth: 1, borderColor: theme.cardBorder },
  tagText: { fontSize: 11, color: theme.textSecondary, fontWeight: '600' },
  tagTextSelected: { color: '#0A0A0F' },
  addCueText: { color: theme.textMuted },
  adHocContextChip: { alignSelf: 'flex-start', marginTop: 6 },

  customAreaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  customAreaInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : theme.pillSurface,
    paddingHorizontal: 12,
    fontSize: 12,
    color: theme.textPrimary,
  },
  customAreaConfirm: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : theme.pillSurface,
  },
  customCueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customCueInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : theme.pillSurface,
    paddingHorizontal: 14,
    color: theme.textPrimary,
    fontSize: 12,
  },
  customCueAdd: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : theme.pillSurface },
  customCueAddText: { fontSize: 12, fontWeight: '700' },

  submitSection: { paddingHorizontal: 0, marginBottom: 8 },
  submitHint: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  sealBtn: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  sealBtnText: { color: '#0A0A0C', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: theme.textPrimary, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 21 },

  // Post-save overlay
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(2, 8, 23, 0.85)',
  },
  confirmCard: {
    borderRadius: 32,
    padding: 36,
    alignItems: 'center',
    maxWidth: 300,
  },

  confirmTitle: { fontSize: 28, color: theme.textPrimary, fontWeight: '800', marginBottom: 10 },
  confirmBody: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 21 },
});
