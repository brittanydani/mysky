/**
 * JournalEntryModal
 * * A cinematic, high-end writing environment featuring obsidian glass architecture,
 * transit-tied prompt engines, and jewel-tone interactive feedback.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { toLocalDateString } from '../utils/dateUtils';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import SkiaMetallicPill from './ui/SkiaMetallicPill';
import ShadowQuoteCard, { ShadowQuoteInline } from './ui/ShadowQuoteCard';
import { JournalEntry } from '../services/storage/models';
import { usePremium } from '../context/PremiumContext';
import { localDb } from '../services/storage/localDb';
import { AstrologyCalculator } from '../services/astrology/calculator';
import { ChartTiedPromptsService, ChartTiedPrompt, JournalPromptSet } from '../services/astrology/chartTiedPrompts';
import { NatalChart } from '../services/astrology/types';
import { ShadowQuoteEngine, ShadowQuoteResult, ShadowQuote } from '../services/astrology/shadowQuotes';
import { generateJournalPrompt, getFreePrompt, GeneratedPrompt, PromptSet } from '../services/journal/promptEngine';
import { getArchetypeProfile, getArchetypePrompt, ArchetypeProfile, ArchetypeJournalPrompt } from '../services/journal/archetypeIntegration';

import { AdvancedJournalAnalyzer } from '../services/premium/advancedJournal';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  amethyst: '#9D76C1',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

interface JournalEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => void;
  initialData?: JournalEntry;
}

type MoodKey = 'calm' | 'soft' | 'okay' | 'heavy' | 'stormy';
type EnergyKey = 'low' | 'steady' | 'high';

export default function JournalEntryModal({ visible, onClose, onSave, initialData }: JournalEntryModalProps) {
  const { isPremium } = usePremium();
  
  // ── Writing-mode state ──
  const [writingMode, setWritingMode] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseOpacity = useSharedValue(1);

  const [date, setDate] = useState(new Date());
  const [mood, setMood] = useState<MoodKey>('okay');
  const [energyLevel, setEnergyLevel] = useState<EnergyKey>('steady');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [chartId, setChartId] = useState<string>('');
  const [promptSet, setPromptSet] = useState<JournalPromptSet | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);

  const [enginePromptSet, setEnginePromptSet] = useState<PromptSet | null>(null);
  const [freePrompt, setFreePrompt] = useState<GeneratedPrompt | null>(null);

  const [shadowResult, setShadowResult] = useState<ShadowQuoteResult | null>(null);
  const [closeQuote, setCloseQuote] = useState<ShadowQuote | null>(null);
  const [showCloseQuote, setShowCloseQuote] = useState(false);
  const closeQuoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [archetypeProfile, setArchetypeProfile] = useState<ArchetypeProfile | null>(null);
  const [archetypePrompt, setArchetypePrompt] = useState<ArchetypeJournalPrompt | null>(null);

  useEffect(() => {
    return () => {
      if (closeQuoteTimeoutRef.current) clearTimeout(closeQuoteTimeoutRef.current);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // ── Debounced "pending save" indicator — fires 1.5 s after the user stops typing ──
  useEffect(() => {
    if (!writingMode || !content.trim()) return;
    setPendingSave(false);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      setPendingSave(true);
    }, 1500);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [content, writingMode]);

  // ── Pulsing animation for the save indicator ──
  useEffect(() => {
    if (pendingSave) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 900 }),
          withTiming(1, { duration: 900 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [pendingSave]);

  // Exit writing mode when the modal closes
  useEffect(() => {
    if (!visible) setWritingMode(false);
  }, [visible]);



  useEffect(() => {
    if (visible) loadUserChart();
  }, [visible]);

  useEffect(() => {
    if (visible) {
      getArchetypeProfile().then((profile) => {
        setArchetypeProfile(profile);
        if (profile) setArchetypePrompt(getArchetypePrompt(profile, mood));
      });
    }
  }, [visible]);

  // Re-derive prompt whenever the user changes their mood
  useEffect(() => {
    if (archetypeProfile) {
      setArchetypePrompt(getArchetypePrompt(archetypeProfile, mood));
    }
  }, [mood, archetypeProfile]);

  useEffect(() => {
    if (isPremium && userChart) {
      const prompts = ChartTiedPromptsService.getPromptSet(userChart, mood, new Date());
      setPromptSet(prompts);
      try {
        const engineSet = generateJournalPrompt(userChart, new Date());
        setEnginePromptSet(engineSet);
      } catch {}
    }
  }, [isPremium, userChart, mood]);

  useEffect(() => {
    if (!isPremium && visible) {
      try { setFreePrompt(getFreePrompt(new Date())); } catch {}
    }
  }, [isPremium, visible]);

  const loadUserChart = async () => {
    try {
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const savedChart = charts[0];
        setChartId(savedChart.id);
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
        setUserChart(chart);
        try {
          const shadow = await ShadowQuoteEngine.getJournalPromptQuote(chart);
          setShadowResult(shadow);
        } catch {}
      }
    } catch {}
  };

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  const enterWritingMode = useCallback(() => {
    setWritingMode(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const exitWritingMode = useCallback(() => {
    setWritingMode(false);
    Keyboard.dismiss();
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setDate(new Date(initialData.date));
      setMood(initialData.mood);
      const moonPhaseToEnergy: Record<string, EnergyKey> = {
        low: 'low', steady: 'steady', high: 'high',
        waning: 'low', full: 'steady', waxing: 'high', new: 'steady',
      };
      setEnergyLevel(moonPhaseToEnergy[initialData.moonPhase as string] ?? 'steady');
      setTitle(initialData.title || '');
      setContent(initialData.content);
    } else {
      setDate(new Date()); setMood('okay'); setEnergyLevel('steady');
      setTitle(''); setContent(''); setShowCloseQuote(false); setCloseQuote(null);
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Empty Reflection', 'Please share a few thoughts before saving.');
      return;
    }
    try {
      let transitSnapshotJson: string | undefined;
      if (userChart) {
        try {
          const snap = AdvancedJournalAnalyzer.captureTransitSnapshot(userChart, date);
          transitSnapshotJson = JSON.stringify(snap);
        } catch {}
      }
      onSave({
        date: toLocalDateString(date),
        mood,
        moonPhase: ({ low: 'waning', steady: 'full', high: 'waxing' } as Record<EnergyKey, string>)[energyLevel] as any,
        title: title.trim() || undefined,
        content: content.trim(),
        chartId: chartId || undefined,
        transitSnapshot: transitSnapshotJson,
      });
      if (shadowResult?.closeQuote) {
        setCloseQuote(shadowResult.closeQuote);
        setShowCloseQuote(true);
        if (closeQuoteTimeoutRef.current) clearTimeout(closeQuoteTimeoutRef.current);
        closeQuoteTimeoutRef.current = setTimeout(() => setShowCloseQuote(false), 4000);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      Alert.alert('Save Error', 'Could not secure your entry. Please try again.');
    }
  };

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={styles.container}>
          <SkiaDynamicCosmos />
          <SafeAreaView edges={['top']} style={styles.safeArea}>
            
            {/* Header — collapses to minimal bar in writing mode */}
            {writingMode ? (
              <View style={styles.writingHeader}>
                <Pressable style={styles.iconBtn} onPress={exitWritingMode} hitSlop={15}>
                  <Ionicons name="chevron-down" size={22} color={PALETTE.textMain} />
                </Pressable>
                <Text style={styles.writingDateLabel} numberOfLines={1}>
                  {formatDate(date)}
                </Text>
                <View style={styles.writingHeaderRight}>
                  {pendingSave && (
                    <Animated.View style={[styles.saveIndicator, pulseStyle]}>
                      <View style={styles.saveIndicatorDot} />
                      <Text style={styles.saveIndicatorText}>Secured</Text>
                    </Animated.View>
                  )}
                </View>
              </View>
            ) : (
              <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
                <Pressable style={styles.iconBtn} onPress={onClose} hitSlop={15}>
                  <Ionicons name="close" size={24} color={PALETTE.textMain} />
                </Pressable>
                <Text style={styles.headerTitle}>{initialData ? 'Edit Entry' : 'New Reflection'}</Text>
                <View style={{ width: 44 }} />
              </Animated.View>
            )}

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              {writingMode ? (
                /* ── Distraction-free writing surface ── */
                <>
                  <TextInput
                    style={styles.focusedContentInput}
                    value={content}
                    onChangeText={setContent}
                    placeholder="What is surfacing for you right now?"
                    placeholderTextColor="rgba(240,234,214,0.22)"
                    multiline
                    textAlignVertical="top"
                    autoFocus
                  />
                  {/* Mood quick-pick — floats above the keyboard */}
                  <View style={styles.moodToolbar}>
                    {(
                      [
                        { key: 'calm',   label: '☽ Calm',   color: '#6EBF8B' },
                        { key: 'soft',   label: '◌ Soft',   color: '#8BC4E8' },
                        { key: 'okay',   label: '◈ Okay',   color: '#C9AE78' },
                        { key: 'heavy',  label: '◎ Heavy',  color: 'rgba(201,174,120,0.55)' },
                        { key: 'stormy', label: '◉ Stormy', color: '#E07A7A' },
                      ] as { key: MoodKey; label: string; color: string }[]
                    ).map(({ key, label, color }) => (
                      <Pressable
                        key={key}
                        onPress={() => {
                          setMood(key);
                          Haptics.selectionAsync().catch(() => {});
                        }}
                        style={[
                          styles.moodChip,
                          mood === key && { borderColor: color, backgroundColor: `${color}22` },
                        ]}
                      >
                        <Text style={[styles.moodChipText, { color: mood === key ? color : 'rgba(255,255,255,0.45)' }]}>
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                
                {/* Date Selection */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                  <Text style={styles.sectionLabel}>Timeline</Text>
                  <Pressable style={styles.glassInteractive} onPress={() => setShowDatePicker(true)}>
                    <LinearGradient colors={['rgba(139, 196, 232, 0.12)', 'rgba(2,8,23,0.50)']} style={styles.innerGradient}>
                      <Ionicons name="calendar-outline" size={18} color={PALETTE.silverBlue} />
                      <Text style={styles.interactiveText}>{formatDate(date)}</Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>

                {/* Title Input */}
                <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                  <Text style={styles.sectionLabel}>Title (Optional)</Text>
                  <View style={styles.glassInput}>
                    <TextInput 
                      style={styles.titleInput} 
                      value={title} 
                      onChangeText={setTitle} 
                      placeholder="Title this moment..." 
                      placeholderTextColor={theme.textMuted} 
                    />
                  </View>
                </Animated.View>

                {/* Main Reflection Area */}
                <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
                  <View style={styles.reflectionHeader}>
                    <Text style={styles.sectionLabel}>Reflection</Text>
                    {(enginePromptSet || freePrompt) && (
                      <Pressable style={styles.promptsToggle} onPress={() => { Haptics.selectionAsync(); setShowPrompts(!showPrompts); }}>
                        <Ionicons name={showPrompts ? 'bulb' : 'bulb-outline'} size={16} color={PALETTE.gold} />
                        <Text style={styles.promptsToggleText}>Guided Prompts</Text>
                      </Pressable>
                    )}
                  </View>

                  {shadowResult && <ShadowQuoteInline text={shadowResult.quote.text} delay={100} />}

                  {/* Archetype Lens — mood-sensitive growth prompt */}
                  {archetypePrompt && (
                    <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.archetypePromptCard}>
                      <View style={[styles.archetypeAccent, { backgroundColor: archetypePrompt.archetypeColor }]} />
                      <View style={styles.archetypePromptInner}>
                        <Text style={[styles.archetypeLabel, { color: archetypePrompt.archetypeColor }]}>
                          {archetypePrompt.archetypeName.toUpperCase()}
                        </Text>
                        <Text style={styles.archetypeContext}>{archetypePrompt.context}</Text>
                        <Pressable
                          onPress={() => {
                            setContent((prev) =>
                              prev.trim()
                                ? `${prev}\n\n${archetypePrompt.question}`
                                : archetypePrompt.question,
                            );
                            Haptics.selectionAsync().catch(() => {});
                          }}
                        >
                          <Text style={styles.archetypeQuestion}>{archetypePrompt.question}</Text>
                        </Pressable>
                      </View>
                    </Animated.View>
                  )}

                  {/* Prompt Engine UI */}
                  {showPrompts && (isPremium && enginePromptSet ? (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.promptZone}>
                      <Text style={styles.transitContext}>✨ {enginePromptSet.dailySummary}</Text>
                      <Pressable style={styles.primaryPromptCard} onPress={() => { setContent(prev => prev.trim() ? `${prev}\n\n${enginePromptSet.primary.question}` : enginePromptSet.primary.question); setShowPrompts(false); }}>
                        <Text style={styles.promptContextLabel}>{enginePromptSet.primary.context}</Text>
                        <Text style={styles.primaryPromptText}>{enginePromptSet.primary.question}</Text>
                        {enginePromptSet.primary.chakra && (
                          <Text style={styles.chakraNote}>{enginePromptSet.primary.chakra.chakra.icon} Focus: {enginePromptSet.primary.chakra.bodyAwareness}</Text>
                        )}
                      </Pressable>
                    </Animated.View>
                  ) : !isPremium && freePrompt && (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.promptZone}>
                      <Pressable style={styles.primaryPromptCard} onPress={() => { setContent(prev => prev.trim() ? `${prev}\n\n${freePrompt.question}` : freePrompt.question); setShowPrompts(false); }}>
                        <Text style={styles.primaryPromptText}>{freePrompt.question}</Text>
                      </Pressable>
                    </Animated.View>
                  ))}

                  <View style={[styles.glassInput, styles.contentBox]}>
                    <TextInput
                      style={styles.contentInput}
                      value={content}
                      onChangeText={setContent}
                      onFocus={enterWritingMode}
                      placeholder="What is surfacing for you right now?"
                      placeholderTextColor={theme.textMuted}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                </Animated.View>

                {/* Footer / Save */}
                <Animated.View entering={FadeInUp.delay(500)} style={styles.footer}>
                  {showCloseQuote && closeQuote && <ShadowQuoteCard quote={closeQuote} variant="footer" isCloseQuote />}
                  <SkiaMetallicPill
                    label={initialData ? 'Secure Changes' : 'Secure Entry'}
                    onPress={handleSave}
                    borderRadius={16}
                  />
                </Animated.View>

              </ScrollView>
              )} {/* end writingMode ternary */}

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  themeVariant="dark"
                  onChange={(_e, d) => { setShowDatePicker(false); if(d) setDate(d); }}
                />
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '600', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  // ── Writing mode header ──
  writingHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  writingDateLabel: { flex: 1, fontSize: 13, color: 'rgba(240,234,214,0.50)', marginLeft: 4 },
  writingHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(110,191,139,0.12)', borderWidth: 1, borderColor: 'rgba(110,191,139,0.25)' },
  saveIndicatorDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#6EBF8B' },
  saveIndicatorText: { fontSize: 11, color: '#6EBF8B', fontWeight: '600', letterSpacing: 0.5 },

  // ── Distraction-free writing surface ──
  focusedContentInput: { flex: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 12, color: PALETTE.textMain, fontSize: 17, lineHeight: 28, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), textAlignVertical: 'top' },

  // ── Mood quick-pick toolbar (sits above keyboard in writing mode) ──
  moodToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(2,8,23,0.75)' },
  moodChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  moodChipText: { fontSize: 12, fontWeight: '600' },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },
  
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: PALETTE.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 },
  
  glassInteractive: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.glassBorder },
  innerGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  interactiveText: { color: PALETTE.textMain, fontSize: 16, fontWeight: '500' },
  
  glassInput: { backgroundColor: 'transparent', borderRadius: 16, borderWidth: 1, borderColor: PALETTE.glassBorder },
  titleInput: { padding: 16, color: PALETTE.textMain, fontSize: 16 },
  
  reflectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  promptsToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  promptsToggleText: { fontSize: 13, color: PALETTE.gold, fontWeight: '600' },
  
  promptZone: { marginBottom: 20 },
  transitContext: { fontSize: 13, color: PALETTE.silverBlue, fontStyle: 'italic', marginBottom: 12, textAlign: 'center' },
  primaryPromptCard: { backgroundColor: 'transparent', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(232,214,174,0.18)' },
  promptContextLabel: { fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  primaryPromptText: { fontSize: 16, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), fontStyle: 'italic', lineHeight: 24 },
  chakraNote: { fontSize: 12, color: PALETTE.gold, marginTop: 12, opacity: 0.8 },
  
  contentBox: { minHeight: 240 },
  contentInput: { padding: 16, color: PALETTE.textMain, fontSize: 16, lineHeight: 26 },

  // ── Archetype lens prompt card ──
  archetypePromptCard: { flexDirection: 'row', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.025)', marginBottom: 16 },
  archetypeAccent: { width: 3 },
  archetypePromptInner: { flex: 1, padding: 14, gap: 4 },
  archetypeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  archetypeContext: { fontSize: 12, color: 'rgba(255,255,255,0.40)', fontStyle: 'italic', lineHeight: 17 },
  archetypeQuestion: { fontSize: 14, color: 'rgba(255,255,255,0.72)', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), lineHeight: 21, marginTop: 2 },
  
  footer: { marginTop: 24 },
  saveBtn: { borderRadius: 16, overflow: 'hidden', },
  saveGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#020817', fontSize: 17, fontWeight: '700', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
});