// app/trigger-log.tsx
// MySky — Polyvagal Trigger Log
// Log individual nervous system events (Drains & Glimmers), mapped to
// Polyvagal Theory states. All data stored locally. Nothing transmitted.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MetallicText } from '../components/ui/MetallicText';

const STORAGE_KEY = '@mysky:trigger_events';

const PALETTE = {
  bg: '#0A0A0C',
  sage: '#8CBEAA',
  emerald: '#C9AE78',
  rose: '#D4A3B3',
  copper: '#CD7F5D',
  lavender: '#A89BC8',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.5)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

type LogMode = 'drain' | 'nourish';
type NSState = 'sympathetic' | 'dorsal' | 'ventral';

interface TriggerEvent {
  id: string;
  timestamp: number;
  mode: LogMode;
  event: string;
  nsState: NSState;
  sensations: string[];
}

const SENSATIONS: Record<LogMode, string[]> = {
  drain: ['Tight Chest', 'Racing Heart', 'Shallow Breath', 'Jaw Tension', 'Brain Fog', 'Numbness', 'Heavy Limbs', 'Nausea'],
  nourish: ['Deep Breath', 'Warmth', 'Shoulders Dropped', 'Clear Mind', 'Soft Eyes', 'Grounded Feet', 'Spaciousness'],
};

export default function TriggerLogScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<LogMode>('drain');
  const [eventText, setEventText] = useState('');
  const [selectedState, setSelectedState] = useState<NSState | null>(null);
  const [selectedSensations, setSelectedSensations] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleMode = (newMode: LogMode) => {
    if (mode === newMode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMode(newMode);
    setSelectedState(null);
    setSelectedSensations([]);
  };

  const toggleSensation = (sensation: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedSensations(prev =>
      prev.includes(sensation) ? prev.filter(s => s !== sensation) : [...prev, sensation]
    );
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
    };

    try {
      const raw = await EncryptedAsyncStorage.getItem(STORAGE_KEY);
      const existing: TriggerEvent[] = raw ? JSON.parse(raw) : [];
      await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...existing]));
    } catch {
      // silent fail — entry lost on storage error, no UX disruption
    }

    setTimeout(() => {
      setSaving(false);
      router.back();
    }, 600);
  };

  const activeColor = mode === 'drain' ? PALETTE.rose : PALETTE.sage;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[`${activeColor}15`, 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.replace('/(tabs)/blueprint'); }}
          >
            <Ionicons name="close-outline" size={24} color={PALETTE.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <Text style={styles.headerTitle}>Nervous System Log</Text>
          </Animated.View>

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
                maxLength={120}
              />
            </View>
          </Animated.View>

          {/* ── Polyvagal State ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
            <Text style={styles.sectionLabel}>NERVOUS SYSTEM STATE</Text>
            <View style={styles.stateGrid}>
              {mode === 'drain' ? (
                <>
                  <Pressable
                    style={[
                      styles.stateCard,
                      selectedState === 'sympathetic' && {
                        borderColor: PALETTE.copper,
                        backgroundColor: `${PALETTE.copper}15`,
                      },
                    ]}
                    onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedState('sympathetic'); }}
                  >
                    {selectedState === 'sympathetic' ? (
                      <MetallicText style={styles.stateTitle} color={PALETTE.copper}>Fight or Flight</MetallicText>
                    ) : (
                      <Text style={styles.stateTitle}>Fight or Flight</Text>
                    )}
                    <Text style={styles.stateSub}>Anxious, frantic, mobilized, angry.</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.stateCard,
                      selectedState === 'dorsal' && {
                        borderColor: PALETTE.lavender,
                        backgroundColor: `${PALETTE.lavender}15`,
                      },
                    ]}
                    onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedState('dorsal'); }}
                  >
                    {selectedState === 'dorsal' ? (
                      <MetallicText style={styles.stateTitle} color={PALETTE.lavender}>Freeze or Fawn</MetallicText>
                    ) : (
                      <Text style={styles.stateTitle}>Freeze or Fawn</Text>
                    )}
                    <Text style={styles.stateSub}>Shut down, numb, disconnected, pleasing.</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={[
                    styles.stateCard,
                    selectedState === 'ventral' && {
                      borderColor: PALETTE.emerald,
                      backgroundColor: `${PALETTE.emerald}15`,
                    },
                  ]}
                  onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedState('ventral'); }}
                >
                  {selectedState === 'ventral' ? (
                    <MetallicText style={styles.stateTitle} color={PALETTE.emerald}>Safe & Social</MetallicText>
                  ) : (
                    <Text style={styles.stateTitle}>Safe & Social</Text>
                  )}
                  <Text style={styles.stateSub}>Grounded, connected, open, breathing freely.</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* ── Somatic Tags ── */}
          <Animated.View entering={FadeInDown.delay(240).duration(500)} style={styles.section}>
            <Text style={styles.sectionLabel}>SOMATIC CUES</Text>
            <View style={styles.tagCloud}>
              {SENSATIONS[mode].map((sensation) => {
                const isSelected = selectedSensations.includes(sensation);
                return (
                  <Pressable
                    key={sensation}
                    onPress={() => toggleSensation(sensation)}
                    style={[
                      styles.tagChip,
                      isSelected && {
                        backgroundColor: `${activeColor}20`,
                        borderColor: activeColor,
                      },
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
                { backgroundColor: (!eventText.trim() || !selectedState || saving) ? 'rgba(255,255,255,0.08)' : activeColor },
              ]}
              onPress={handleSeal}
              disabled={!eventText.trim() || !selectedState || saving}
            >
              <Text style={[
                styles.sealBtnText,
                { color: (!eventText.trim() || !selectedState || saving) ? PALETTE.textMuted : '#0A0A0C' },
              ]}>
                {saving ? 'SAVING...' : 'SAVE ENTRY'}
              </Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  headerRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontWeight: '300',
    marginBottom: 8,
  },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  toggleBtnActiveDrain: { backgroundColor: 'rgba(212, 163, 179, 0.15)' },
  toggleBtnActiveNourish: { backgroundColor: 'rgba(140, 190, 170, 0.15)' },
  toggleText: { fontSize: 13, fontWeight: '700', color: PALETTE.textMuted, letterSpacing: 0.5 },

  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 12,
  },

  inputSection: { marginBottom: 32 },
  inputGlass: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    minHeight: 100,
  },
  textInput: {
    color: PALETTE.textMain,
    fontSize: 16,
    fontFamily: 'Georgia',
    lineHeight: 24,
  },

  stateGrid: { gap: 12 },
  stateCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
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
  tagText: { fontSize: 11, color: PALETTE.textMuted, fontWeight: '500' },

  submitSection: { paddingHorizontal: 0, marginBottom: 8 },
  submitHint: {
    fontSize: 12,
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
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
});
