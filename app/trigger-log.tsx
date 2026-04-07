// app/trigger-log.tsx
// MySky — Polyvagal Trigger Log
// Log and review nervous system events (Drains & Glimmers), mapped to
// Polyvagal Theory states. All data stored locally. Nothing transmitted.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { formatTime, formatDate, timeOfDayLabel } from '../utils/triggerLogHelpers';
import type { TriggerEvent, LogMode, NSState } from '../utils/triggerEventTypes';
export type { TriggerEvent } from '../utils/triggerEventTypes';

const STORAGE_KEY = '@mysky:trigger_events';
const CUSTOM_AREAS_KEY = '@mysky:trigger_custom_areas';
const CUSTOM_SENSATIONS_KEY = '@mysky:trigger_custom_sensations';

const PALETTE = {
  bg: '#020817',
  sage: '#8CBEAA',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
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
  const isDrain = entry.mode === 'drain';
  const accentColor = isDrain ? PALETTE.copper : PALETTE.sage;
  const stateCard = NS_STATE_CARDS[entry.nsState];

  return (
    <View style={[histStyles.card, { borderColor: `${accentColor}30` }]}>
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
    </View>
  );
}

const histStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.025)',
    padding: 16,
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
  timeText: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  eventText: { fontSize: 15, color: PALETTE.textMain, lineHeight: 22, marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 },
  statePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statePillText: { fontSize: 11, fontWeight: '600' },
  areaPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  areaPillText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  intensityWrap: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  intensityDot: { width: 7, height: 7, borderRadius: 4 },
  todLabel: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  sensationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  sensationChip: { fontSize: 10, color: 'rgba(255,255,255,0.35)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  resolutionBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  resolutionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  resolutionText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 19 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function TriggerLogScreen() {
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

  const activeColor = mode === 'drain' ? PALETTE.copper : PALETTE.sage;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <LinearGradient
        colors={['rgba(140, 190, 170, 0.08)', 'transparent']}
        style={styles.topGlow}
      />

      {/* ── Post-save Confirmation Overlay ── */}
      {saved && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(400)}
          style={styles.confirmOverlay}
          pointerEvents="none"
        >
          <View style={styles.confirmCard}>
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
          </View>
        </Animated.View>
      )}

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MetallicIcon name="close-outline" size={22} color={PALETTE.textMuted} />
          </Pressable>

          {/* ── View mode toggle: Log / History ── */}
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

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Nervous System Log</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Polyvagal triggers · drains · glimmers</GoldSubtitle>
        </View>

        {/* ════════════════════════ HISTORY VIEW ════════════════════════ */}
        {viewMode === 'history' ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
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
            <View style={{ height: 48 }} />
          </ScrollView>
        ) : (

        /* ════════════════════════ LOG VIEW ════════════════════════ */
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Mode Toggle ── */}
          <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.toggleContainer}>
            <Pressable
              style={[styles.toggleBtn, mode === 'drain' && styles.toggleBtnActiveDrain]}
              onPress={() => toggleMode('drain')}
            >
              {mode === 'drain' ? (
                <MetallicText style={styles.toggleText} color={PALETTE.rose}>Trigger (Drain)</MetallicText>
              ) : (
                <Text style={styles.toggleText}>Trigger (Drain)</Text>
              )}
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, mode === 'nourish' && styles.toggleBtnActiveNourish]}
              onPress={() => toggleMode('nourish')}
            >
              {mode === 'nourish' ? (
                <MetallicText style={styles.toggleText} color={PALETTE.sage}>Glimmer (Nourish)</MetallicText>
              ) : (
                <Text style={styles.toggleText}>Glimmer (Nourish)</Text>
              )}
            </Pressable>
          </Animated.View>

          {/* ── Event Input ── */}
          <Animated.View entering={FadeInDown.delay(160).duration(500)} style={styles.inputSection}>
            <Text style={styles.sectionLabel}>WHAT HAPPENED?</Text>
            <View style={[styles.inputGlass, { borderColor: `${activeColor}40` }]}>
              <TextInput
                style={styles.textInput}
                placeholder={
                  mode === 'drain'
                    ? 'What shifted your energy downward?'
                    : 'What brought you a moment of peace?'
                }
                placeholderTextColor={PALETTE.textMuted}
                value={eventText}
                onChangeText={setEventText}
                multiline
                maxLength={1000}
              />
            </View>
          </Animated.View>

          {/* ── Intensity ── */}
          <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.section}>
            <Text style={styles.sectionLabel}>
              {mode === 'drain' ? 'INTENSITY' : 'DEPTH OF SHIFT'}
            </Text>
            <View style={styles.intensityRow}>
              {([1, 2, 3, 4, 5] as const).map(n => (
                <Pressable
                  key={n}
                  style={[
                    styles.intensityBtn,
                    intensity === n && { backgroundColor: `${activeColor}25`, borderColor: activeColor },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setIntensity(prev => (prev === n ? null : n));
                  }}
                >
                  <Text style={[styles.intensityNum, intensity !== null && n <= intensity && { color: activeColor }]}>
                    {n}
                  </Text>
                </Pressable>
              ))}
              <Text style={styles.intensityHint}>
                {intensity === null ? 'optional' : intensity <= 2 ? 'mild' : intensity <= 3 ? 'moderate' : intensity === 4 ? 'strong' : 'overwhelming'}
              </Text>
            </View>
          </Animated.View>

          {/* ── Context Area ── */}
          <Animated.View entering={FadeInDown.delay(190).duration(500)} style={styles.section}>
            <Text style={styles.sectionLabel}>LIFE AREA</Text>
            <Text style={styles.helperText}>Tap to select. Hold a custom area to edit or delete it.</Text>
            <View style={styles.tagCloud}>
              {(showMoreAreas ? [...PRIMARY_AREAS, ...EXTENDED_AREAS] : PRIMARY_AREAS).map(area => {
                const isSelected = contextArea === area;
                return (
                  <Pressable
                    key={area}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setContextArea(prev => (prev === area ? null : area));
                    }}
                    style={[
                      styles.tagChip,
                      isSelected && { backgroundColor: `${activeColor}18`, borderColor: activeColor },
                    ]}
                  >
                    {isSelected ? (
                      <MetallicText style={styles.tagText} color={activeColor}>{area}</MetallicText>
                    ) : (
                      <Text style={styles.tagText}>{area}</Text>
                    )}
                  </Pressable>
                );
              })}
              {customAreaOptions.map((area) => {
                const isSelected = contextArea === area.label;
                return (
                  <Pressable
                    key={area.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setContextArea(prev => (prev === area.label ? null : area.label));
                    }}
                    onLongPress={() => promptCustomAreaAction(area)}
                    style={[
                      styles.tagChip,
                      styles.customChip,
                      isSelected && { backgroundColor: `${activeColor}18`, borderColor: activeColor },
                    ]}
                  >
                    {isSelected ? (
                      <MetallicText style={styles.tagText} color={activeColor}>{area.label}</MetallicText>
                    ) : (
                      <Text style={styles.tagText}>{area.label}</Text>
                    )}
                  </Pressable>
                );
              })}
              {/* More toggle */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowMoreAreas(prev => !prev);
                }}
                style={[styles.tagChip, { borderStyle: 'dashed' }]}
              >
                <Text style={styles.tagText}>{showMoreAreas ? 'Less ↑' : 'More ↓'}</Text>
              </Pressable>
              {/* Custom area */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowCustomAreaInput(prev => !prev);
                  setEditingCustomAreaId(null);
                  setCustomAreaInput('');
                }}
                style={[
                  styles.tagChip,
                  showCustomAreaInput && { backgroundColor: `${activeColor}18`, borderColor: activeColor },
                ]}
              >
                <Text style={styles.tagText}>+ Custom</Text>
              </Pressable>
            </View>
            {showCustomAreaInput && (
              <View style={styles.customAreaRow}>
                <TextInput
                  value={customAreaInput}
                  onChangeText={setCustomAreaInput}
                  placeholder="e.g. School, Caregiving…"
                  placeholderTextColor={PALETTE.textMuted}
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
              <Pressable
                onPress={() => setContextArea(null)}
                style={[styles.tagChip, { alignSelf: 'flex-start', marginTop: 6 }]}
              >
                <Text style={styles.tagText}>{contextArea} ✕</Text>
              </Pressable>
            )}
          </Animated.View>

          {/* ── Polyvagal State ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
            <Text style={styles.sectionLabel}>NERVOUS SYSTEM STATE</Text>
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
                          isSelected && { borderColor: card.color, backgroundColor: `${card.color}15` },
                        ]}
                        onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedState(state); }}
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
                          isSelected && { borderColor: card.color, backgroundColor: `${card.color}15` },
                        ]}
                        onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedState(state); }}
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
              <Text style={styles.sectionLabel}>WHERE WERE YOU BEFORE?</Text>
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
            <Text style={styles.sectionLabel}>SOMATIC CUES</Text>
            <Text style={styles.helperText}>Tap to select. Hold a custom cue to edit or delete it.</Text>
            <View style={styles.tagCloud}>
              {SENSATIONS[mode].map((sensation) => {
                const isSelected = selectedSensations.includes(sensation);
                return (
                  <Pressable
                    key={sensation}
                    onPress={() => toggleSensation(sensation)}
                    style={[
                      styles.tagChip,
                      isSelected && { backgroundColor: `${activeColor}20`, borderColor: activeColor },
                    ]}
                  >
                    {isSelected ? (
                      <MetallicText style={styles.tagText} color={activeColor}>{sensation}</MetallicText>
                    ) : (
                      <Text style={styles.tagText}>{sensation}</Text>
                    )}
                  </Pressable>
                );
              })}
              {customSensationOptions
                .filter((option) => option.mode === mode)
                .map((option) => {
                  const isSelected = selectedSensations.includes(option.label);
                  return (
                  <Pressable
                    key={option.id}
                    onPress={() => toggleSensation(option.label)}
                    onLongPress={() => promptCustomSensationAction(option)}
                    style={[
                      styles.tagChip,
                      styles.customChip,
                      isSelected && { backgroundColor: `${activeColor}20`, borderColor: activeColor },
                    ]}
                  >
                    {isSelected ? (
                      <MetallicText style={styles.tagText} color={activeColor}>{option.label}</MetallicText>
                    ) : (
                      <Text style={styles.tagText}>{option.label}</Text>
                    )}
                  </Pressable>
                )})}
              {/* Add custom cue */}
              {showCustomInput ? (
                <View style={styles.customCueRow}>
                  <TextInput
                    style={styles.customCueInput}
                    placeholder="Custom cue…"
                    placeholderTextColor={PALETTE.textMuted}
                    value={customSensation}
                    onChangeText={setCustomSensation}
                    autoFocus
                    maxLength={40}
                    onSubmitEditing={addCustomSensation}
                    returnKeyType="done"
                  />
                  <Pressable style={styles.customCueAdd} onPress={addCustomSensation}>
                    <Text style={[styles.customCueAddText, { color: activeColor }]}>{editingCustomSensationId ? 'Update' : 'Add'}</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={[styles.tagChip, styles.addCueChip]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setShowCustomInput(true);
                    setEditingCustomSensationId(null);
                    setCustomSensation('');
                  }}
                >
                  <Text style={[styles.tagText, { color: PALETTE.textMuted }]}>+ custom</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* ── What Helped / Resolution ── */}
          <Animated.View entering={FadeInDown.delay(260).duration(500)} style={styles.inputSection}>
            <Text style={styles.sectionLabel}>
              {mode === 'drain' ? 'WHAT HELPED? (optional)' : 'WHAT CREATED THIS? (optional)'}
            </Text>
            <View style={[styles.inputGlass, { borderColor: `${activeColor}25` }]}>
              <TextInput
                style={[styles.textInput, { fontSize: 14 }]}
                placeholder={
                  mode === 'drain'
                    ? 'Walked, breathed, called someone, sat outside…'
                    : 'Music, sunlight, a kind word, stillness…'
                }
                placeholderTextColor={PALETTE.textMuted}
                value={resolution}
                onChangeText={setResolution}
                multiline
                maxLength={500}
              />
            </View>
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
                { backgroundColor: (!eventText.trim() || !selectedState || saving || saved) ? 'rgba(255,255,255,0.08)' : activeColor },
              ]}
              onPress={handleSeal}
              disabled={!eventText.trim() || !selectedState || saving || saved}
            >
              <Text style={[
                styles.sealBtnText,
                { color: (!eventText.trim() || !selectedState || saving || saved) ? PALETTE.textMuted : '#0A0A0C' },
              ]}>
                {saving ? 'SAVING…' : 'SAVE ENTRY'}
              </Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: 48 }} />
        </ScrollView>
        </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },

  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea: { paddingHorizontal: 24, paddingBottom: 8 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },

  viewToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 3 },
  viewToggleBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  viewToggleBtnActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  viewToggleText: { fontSize: 13, color: PALETTE.textMuted, fontWeight: '600' },
  viewToggleTextActive: { color: PALETTE.textMain },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14 },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  toggleBtnActiveDrain: { backgroundColor: 'rgba(205, 127, 93, 0.15)' },
  toggleBtnActiveNourish: { backgroundColor: 'rgba(140, 190, 170, 0.15)' },
  toggleText: { fontSize: 13, fontWeight: '700', color: PALETTE.textMuted, letterSpacing: 0.5 },

  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 16,
  },
  helperText: { fontSize: 12, color: 'rgba(255,255,255,0.42)', marginTop: -6, marginBottom: 14 },

  intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  intensityBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityNum: { fontSize: 16, fontWeight: '700', color: PALETTE.textMuted },
  intensityHint: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 4 },

  inputSection: { marginBottom: 32 },
  inputGlass: {
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 20,
    minHeight: 100,
  },
  textInput: {
    color: PALETTE.textMain,
    fontSize: 16,
    lineHeight: 24,
  },

  stateGrid: { gap: 12 },
  stateCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 20,
  },
  stateTitle: { fontSize: 16, fontWeight: '600', color: PALETTE.textMain, marginBottom: 4 },
  stateSub: { fontSize: 13, color: PALETTE.textMuted, lineHeight: 18 },

  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  customChip: { borderStyle: 'dashed' },
  addCueChip: { borderStyle: 'dashed' },
  tagText: { fontSize: 11, color: PALETTE.textMuted, fontWeight: '500' },

  customAreaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  customAreaInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    fontSize: 12,
    color: PALETTE.textMain,
  },
  customAreaConfirm: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  customCueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customCueInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    color: PALETTE.textMain,
    fontSize: 12,
  },
  customCueAdd: { paddingHorizontal: 12, paddingVertical: 7 },
  customCueAddText: { fontSize: 12, fontWeight: '700' },

  submitSection: { paddingHorizontal: 0, marginBottom: 8 },
  submitHint: {
    fontSize: 12,
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginBottom: 12,
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
  emptyTitle: { fontSize: 20, color: PALETTE.textMain, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, color: PALETTE.textMuted, textAlign: 'center', lineHeight: 21 },

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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 40,
    alignItems: 'center',
    maxWidth: 300,
  },

  confirmTitle: { fontSize: 28, color: PALETTE.textMain, fontWeight: '800', marginBottom: 10 },
  confirmBody: { fontSize: 14, color: PALETTE.textMuted, textAlign: 'center', lineHeight: 21 },
});
