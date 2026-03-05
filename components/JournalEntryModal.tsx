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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { toLocalDateString } from '../utils/dateUtils';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import ShadowQuoteCard, { ShadowQuoteInline } from './ui/ShadowQuoteCard';
import { JournalEntry } from '../services/storage/models';
import { usePremium } from '../context/PremiumContext';
import { localDb } from '../services/storage/localDb';
import { AstrologyCalculator } from '../services/astrology/calculator';
import { ChartTiedPromptsService, ChartTiedPrompt, JournalPromptSet } from '../services/astrology/chartTiedPrompts';
import { NatalChart } from '../services/astrology/types';
import { ShadowQuoteEngine, ShadowQuoteResult, ShadowQuote } from '../services/astrology/shadowQuotes';
import { generateJournalPrompt, getFreePrompt, GeneratedPrompt, PromptSet } from '../services/journal/promptEngine';
import { useSomaticContext } from '../context/SomaticContext';
import { useSomaticBreathing } from '../hooks/useSomaticBreathing';
import { DynamicBreathPortal } from './ui/DynamicBreathPortal';
import { SkiaSyncSuccess } from './ui/SkiaSyncSuccess';
import { StabilityDeltaSparkline } from './ui/StabilityDeltaSparkline';

import { AdvancedJournalAnalyzer } from '../services/premium/advancedJournal';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C5B493',
  silverBlue: '#8BC4E8',
  amethyst: '#9D76C1',
  textMain: '#FDFBF7',
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
  const { tensionNodes } = useSomaticContext();
  
  // Gate: True if editing or if they just finished breathing
  const [isRegulated, setIsRegulated] = useState(!!initialData);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  
  // Use strongest tension node or baseline
  const primaryNode = tensionNodes.length > 0 
    ? tensionNodes.reduce((prev, curr) => (curr.intensity > prev.intensity ? curr : prev))
    : { x: 150, y: 0.5, intensity: 1, type: 'flow' };
    
  const breathConfig = useSomaticBreathing(primaryNode ? primaryNode.y : null, primaryNode?.intensity || 1);

  const handleBreathComplete = () => {
    setShowSyncSuccess(true);
  };

  const handleSyncComplete = () => {
    setShowSyncSuccess(false);
    setIsRegulated(true);
  };

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

  useEffect(() => {
    return () => {
      if (closeQuoteTimeoutRef.current) clearTimeout(closeQuoteTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (visible) loadUserChart();
  }, [visible]);

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
            
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
              <Pressable style={styles.iconBtn} onPress={onClose} hitSlop={15}>
                <Ionicons name="close" size={24} color={PALETTE.textMain} />
              </Pressable>
              <Text style={styles.headerTitle}>{initialData ? 'Edit Entry' : 'New Reflection'}</Text>
              <View style={{ width: 44 }} />
            </Animated.View>

            {/* Dynamic Breath Portal Rendering if not regulated */}
            {!isRegulated ? (
              <Animated.View entering={FadeInUp.duration(600)} style={styles.gateContainer}>
                {showSyncSuccess ? (
                  <SkiaSyncSuccess originX={primaryNode.x} originY={primaryNode.y * 500} onComplete={handleSyncComplete} />
                ) : (
                  <>
                    <Text style={styles.gateTitle}>Regulate to Reflect</Text>
                    <Text style={styles.gateSubtitle}>Align your nervous system for deeper insights.</Text>
                    <DynamicBreathPortal 
                      inhale={breathConfig.inhale} 
                      exhale={breathConfig.exhale} 
                      label={breathConfig.label} 
                      color={breathConfig.color} 
                      durationInSeconds={10} // Just for preview/flow ease, adjust as necessary
                      onComplete={handleBreathComplete} 
                    />
                  </>
                )}
              </Animated.View>
            ) : (
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                
                {/* Date Selection */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                  <Text style={styles.sectionLabel}>Timeline</Text>
                  <Pressable style={styles.glassInteractive} onPress={() => setShowDatePicker(true)}>
                    <LinearGradient colors={['rgba(139, 196, 232, 0.12)', 'rgba(20, 24, 34, 0.6)']} style={styles.innerGradient}>
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
                      placeholder="What is surfacing for you right now?"
                      placeholderTextColor={theme.textMuted}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <StabilityDeltaSparkline intensity={primaryNode.intensity} />
                  
                  <View style={styles.blueprintFooter}>
                    <Text style={styles.footerText}>
                      Alignment: {breathConfig.label} applied to {primaryNode.type} tension.
                    </Text>
                  </View>
                </Animated.View>

                {/* Footer / Save */}
                <Animated.View entering={FadeInUp.delay(500)} style={styles.footer}>
                  {showCloseQuote && closeQuote && <ShadowQuoteCard quote={closeQuote} variant="footer" isCloseQuote />}
                  <Pressable style={styles.saveBtn} onPress={handleSave}>
                    <LinearGradient colors={['#FFF4D4', '#C5B493', '#8B6508']} style={styles.saveGradient}>
                      <Text style={styles.saveBtnText}>{initialData ? 'Secure Changes' : 'Secure Entry'}</Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>

              </ScrollView>

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
            )}
          </SafeAreaView>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  gateTitle: { color: PALETTE.textMain, fontSize: 24, fontWeight: '700', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 8 },
  gateSubtitle: { color: theme.textMuted, fontSize: 15, marginBottom: 40, textAlign: 'center' },
  blueprintFooter: { marginTop: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8 },
  footerText: { color: theme.textMuted, fontSize: 12, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07090F' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerTitle: { fontSize: 18, color: PALETTE.textMain, fontWeight: '600', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },
  
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: PALETTE.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 },
  
  glassInteractive: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.glassBorder },
  innerGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  interactiveText: { color: PALETTE.textMain, fontSize: 16, fontWeight: '500' },
  
  glassInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: PALETTE.glassBorder },
  titleInput: { padding: 16, color: PALETTE.textMain, fontSize: 16 },
  
  reflectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  promptsToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  promptsToggleText: { fontSize: 13, color: PALETTE.gold, fontWeight: '600' },
  
  promptZone: { marginBottom: 20 },
  transitContext: { fontSize: 13, color: PALETTE.silverBlue, fontStyle: 'italic', marginBottom: 12, textAlign: 'center' },
  primaryPromptCard: { backgroundColor: 'rgba(197, 180, 147, 0.08)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(197, 180, 147, 0.2)' },
  promptContextLabel: { fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  primaryPromptText: { fontSize: 16, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), fontStyle: 'italic', lineHeight: 24 },
  chakraNote: { fontSize: 12, color: PALETTE.gold, marginTop: 12, opacity: 0.8 },
  
  contentBox: { minHeight: 240 },
  contentInput: { padding: 16, color: PALETTE.textMain, fontSize: 16, lineHeight: 26 },
  
  footer: { marginTop: 24 },
  saveBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: PALETTE.gold, shadowOpacity: 0.2, shadowRadius: 12 },
  saveGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#1A1A1A', fontSize: 17, fontWeight: '700', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
});