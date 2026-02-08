import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import StarField from './ui/StarField';
import { ShadowQuoteInline } from './ui/ShadowQuoteCard';
import ShadowQuoteCard from './ui/ShadowQuoteCard';
import { JournalEntry } from '../services/storage/models';
import { usePremium } from '../context/PremiumContext';
import { localDb } from '../services/storage/localDb';
import { AstrologyCalculator } from '../services/astrology/calculator';
import { ChartTiedPromptsService, ChartTiedPrompt, JournalPromptSet } from '../services/astrology/chartTiedPrompts';
import { NatalChart } from '../services/astrology/types';
import { ShadowQuoteEngine, ShadowQuoteResult, ShadowQuote } from '../services/astrology/shadowQuotes';
import { generateJournalPrompt, getFreePrompt, GeneratedPrompt, PromptSet } from '../services/journal/promptEngine';
import { getChakraInfo } from '../services/journal/chakraSystem';

interface JournalEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => void;
  initialData?: JournalEntry;
}

const moodOptions = [
  { key: 'calm', label: 'Calm', icon: 'leaf', color: '#6EBF8B', description: 'Peaceful and centered' },
  { key: 'soft', label: 'Soft', icon: 'water', color: '#8BC4E8', description: 'Gentle and flowing' },
  { key: 'okay', label: 'Okay', icon: 'partly-sunny', color: '#C9A962', description: 'Balanced and neutral' },
  { key: 'heavy', label: 'Heavy', icon: 'cloudy', color: '#E0B07A', description: 'Weighed down' },
  { key: 'stormy', label: 'Stormy', icon: 'thunderstorm', color: '#E07A7A', description: 'Turbulent and intense' },
] as const;

const moonPhaseOptions = [
  { key: 'new', label: 'New Moon', icon: 'moon', description: 'New beginnings' },
  { key: 'waxing', label: 'Waxing Moon', icon: 'moon', description: 'Growing energy' },
  { key: 'full', label: 'Full Moon', icon: 'moon', description: 'Peak illumination' },
  { key: 'waning', label: 'Waning Moon', icon: 'moon', description: 'Releasing energy' },
] as const;

type MoodKey = (typeof moodOptions)[number]['key'];
type MoonKey = (typeof moonPhaseOptions)[number]['key'];

export default function JournalEntryModal({ visible, onClose, onSave, initialData }: JournalEntryModalProps) {
  const { isPremium } = usePremium();
  
  const [date, setDate] = useState(new Date());
  const [mood, setMood] = useState<MoodKey>('okay');
  const [moonPhase, setMoonPhase] = useState<MoonKey>('new');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Premium: Chart-tied prompts (legacy)
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [promptSet, setPromptSet] = useState<JournalPromptSet | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);

  // New 4-layer prompt engine
  const [enginePromptSet, setEnginePromptSet] = useState<PromptSet | null>(null);
  const [freePrompt, setFreePrompt] = useState<GeneratedPrompt | null>(null);

  // Shadow quotes
  const [shadowResult, setShadowResult] = useState<ShadowQuoteResult | null>(null);
  const [closeQuote, setCloseQuote] = useState<ShadowQuote | null>(null);
  const [showCloseQuote, setShowCloseQuote] = useState(false);

  // Load user chart for premium prompts
  useEffect(() => {
    if (isPremium && visible) {
      loadUserChart();
    }
  }, [isPremium, visible]);

  // Load shadow quote for all users (chart optional — works with lighter context)
  useEffect(() => {
    if (visible && !isPremium) {
      loadShadowQuoteOnly();
    }
  }, [visible, isPremium]);

  // Update prompts when mood changes (legacy)
  useEffect(() => {
    if (isPremium && userChart) {
      const prompts = ChartTiedPromptsService.getPromptSet(userChart, mood, new Date());
      setPromptSet(prompts);
      // Also generate new engine prompts
      try {
        const engineSet = generateJournalPrompt(userChart, new Date());
        setEnginePromptSet(engineSet);
      } catch {
        // Engine failed, legacy prompts remain
      }
    }
  }, [isPremium, userChart, mood]);

  // Free-tier prompt (no chart needed)
  useEffect(() => {
    if (!isPremium && visible) {
      try {
        setFreePrompt(getFreePrompt(new Date()));
      } catch {
        // Ignore
      }
    }
  }, [isPremium, visible]);

  const loadUserChart = async () => {
    try {
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const savedChart = charts[0];
        const birthData = {
          date: savedChart.birthDate,
          time: savedChart.birthTime,
          hasUnknownTime: savedChart.hasUnknownTime,
          place: savedChart.birthPlace,
          latitude: savedChart.latitude,
          longitude: savedChart.longitude,
          houseSystem: savedChart.houseSystem
        };
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        setUserChart(chart);

        // Load shadow quote for journal
        try {
          const shadow = await ShadowQuoteEngine.getJournalPromptQuote(chart);
          setShadowResult(shadow);
        } catch {
          // Continue without shadow quote
        }
      }
    } catch (e) {
      // Continue without chart-tied prompts
    }
  };

  const loadShadowQuoteOnly = async () => {
    try {
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const savedChart = charts[0];
        const birthData = {
          date: savedChart.birthDate,
          time: savedChart.birthTime,
          hasUnknownTime: savedChart.hasUnknownTime,
          place: savedChart.birthPlace,
          latitude: savedChart.latitude,
          longitude: savedChart.longitude,
          houseSystem: savedChart.houseSystem,
        };
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        const shadow = await ShadowQuoteEngine.getJournalPromptQuote(chart);
        setShadowResult(shadow);
      }
    } catch {
      // Shadow quotes are non-critical
    }
  };

  const usePrompt = useCallback((prompt: ChartTiedPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Append prompt to content with attribution
    setContent(prev => {
      if (prev.trim()) {
        return `${prev}\n\n${prompt.prompt}`;
      }
      return prompt.prompt;
    });
    setShowPrompts(false);
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (initialData) {
      setDate(new Date(initialData.date));
      setMood(initialData.mood);
      setMoonPhase(initialData.moonPhase);
      setTitle(initialData.title || '');
      setContent(initialData.content);
    } else {
      setDate(new Date());
      setMood('okay');
      setMoonPhase('new');
      setTitle('');
      setContent('');
      setShowCloseQuote(false);
      setCloseQuote(null);
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please write something in your journal entry.');
      return;
    }

    onSave({
      date: toLocalDateString(date),
      mood,
      moonPhase,
      title: title.trim() || undefined,
      content: content.trim(),
    });

    // Show close shadow quote after saving
    if (shadowResult?.closeQuote) {
      setCloseQuote(shadowResult.closeQuote);
      setShowCloseQuote(true);
      // Auto-hide after 4 seconds
      setTimeout(() => setShowCloseQuote(false), 4000);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <StarField starCount={20} />

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>{initialData ? 'Edit Entry' : 'New Entry'}</Text>
            <View style={styles.closeButton} />
          </Animated.View>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>Date</Text>
                <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                  <LinearGradient
                    colors={['rgba(201, 169, 98, 0.15)', 'rgba(201, 169, 98, 0.05)']}
                    style={styles.dateGradient}
                  >
                    <Ionicons name="calendar" size={20} color={theme.primary} />
                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>How are you feeling?</Text>
                <View style={styles.moodGrid}>
                  {moodOptions.map((m) => (
                    <Pressable
                      key={m.key}
                      style={[styles.moodOption, mood === m.key && styles.moodOptionSelected]}
                      onPress={() => {
                        setMood(m.key);
                        Haptics.selectionAsync();
                      }}
                    >
                      <LinearGradient
                        colors={
                          mood === m.key
                            ? [`${m.color}40`, `${m.color}20`]
                            : ['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']
                        }
                        style={styles.moodGradient}
                      >
                        <View
                          style={[
                            styles.moodIcon,
                            { backgroundColor: mood === m.key ? m.color : 'rgba(255, 255, 255, 0.1)' },
                          ]}
                        >
                          <Ionicons name={m.icon as any} size={20} color={mood === m.key ? 'white' : theme.textMuted} />
                        </View>
                        <Text style={[styles.moodLabel, { color: mood === m.key ? theme.textPrimary : theme.textSecondary }]}>
                          {m.label}
                        </Text>
                        <Text style={styles.moodDescription}>{m.description}</Text>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>Moon Phase</Text>
                <View style={styles.moonPhaseGrid}>
                  {moonPhaseOptions.map((p) => (
                    <Pressable
                      key={p.key}
                      style={[styles.moonPhaseOption, moonPhase === p.key && styles.moonPhaseOptionSelected]}
                      onPress={() => {
                        setMoonPhase(p.key);
                        Haptics.selectionAsync();
                      }}
                    >
                      <LinearGradient
                        colors={
                          moonPhase === p.key
                            ? ['rgba(201, 169, 98, 0.2)', 'rgba(201, 169, 98, 0.1)']
                            : ['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']
                        }
                        style={styles.moonPhaseGradient}
                      >
                        <Ionicons
                          name={p.icon as any}
                          size={16}
                          color={moonPhase === p.key ? theme.primary : theme.textMuted}
                        />
                        <Text
                          style={[
                            styles.moonPhaseLabel,
                            { color: moonPhase === p.key ? theme.textPrimary : theme.textSecondary },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>Title (Optional)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.titleInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Give your entry a title..."
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.section}>
                <View style={styles.reflectionHeader}>
                  <Text style={styles.sectionTitle}>Your Reflection</Text>
                  {/* Prompts button — available for all users */}
                  {(enginePromptSet || promptSet || freePrompt) && (
                    <Pressable 
                      style={styles.promptsButton}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowPrompts(!showPrompts);
                      }}
                    >
                      <Ionicons 
                        name={showPrompts ? 'bulb' : 'bulb-outline'} 
                        size={18} 
                        color={theme.primary} 
                      />
                      <Text style={styles.promptsButtonText}>Prompts</Text>
                    </Pressable>
                  )}
                </View>

                {/* Shadow quote — quiet truth at the top of reflection */}
                {shadowResult && (
                  <ShadowQuoteInline
                    text={shadowResult.quote.text}
                    delay={100}
                  />
                )}

                {/* Premium: 4-Layer Prompt Engine */}
                {isPremium && showPrompts && enginePromptSet && (
                  <Animated.View entering={FadeInDown.duration(300)} style={styles.promptsContainer}>
                    {/* Daily summary */}
                    <Text style={styles.transitContext}>
                      ✨ {enginePromptSet.dailySummary}
                    </Text>

                    {/* Primary prompt — full 4 layers */}
                    <Pressable
                      style={styles.promptCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setContent(prev => prev.trim() ? `${prev}\n\n${enginePromptSet.primary.question}` : enginePromptSet.primary.question);
                        setShowPrompts(false);
                      }}
                    >
                      <Text style={styles.promptContextLine}>{enginePromptSet.primary.context}</Text>
                      <Text style={styles.promptText}>{enginePromptSet.primary.question}</Text>
                      {enginePromptSet.primary.close && (
                        <Text style={styles.promptClose}>{enginePromptSet.primary.close}</Text>
                      )}
                      {enginePromptSet.primary.chakra && (
                        <View style={styles.chakraHint}>
                          <Text style={styles.chakraHintText}>
                            {enginePromptSet.primary.chakra.chakra.icon} {enginePromptSet.primary.chakra.bodyAwareness}
                          </Text>
                        </View>
                      )}
                    </Pressable>

                    {/* Alternative prompts */}
                    {enginePromptSet.alternatives.length > 0 && (
                      <View style={styles.altPromptsRow}>
                        {enginePromptSet.alternatives.map((alt, index) => (
                          <Pressable
                            key={index}
                            style={styles.altPromptCard}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setContent(prev => prev.trim() ? `${prev}\n\n${alt.question}` : alt.question);
                              setShowPrompts(false);
                            }}
                          >
                            <Text style={styles.altPromptContext} numberOfLines={1}>{alt.context}</Text>
                            <Text style={styles.altPromptText} numberOfLines={2}>{alt.question}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </Animated.View>
                )}

                {/* Free-tier: Single daily prompt */}
                {!isPremium && showPrompts && freePrompt && (
                  <Animated.View entering={FadeInDown.duration(300)} style={styles.promptsContainer}>
                    <Pressable
                      style={styles.promptCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setContent(prev => prev.trim() ? `${prev}\n\n${freePrompt.question}` : freePrompt.question);
                        setShowPrompts(false);
                      }}
                    >
                      <Text style={styles.promptContextLine}>{freePrompt.context}</Text>
                      <Text style={styles.promptText}>{freePrompt.question}</Text>
                      {freePrompt.close && (
                        <Text style={styles.promptClose}>{freePrompt.close}</Text>
                      )}
                    </Pressable>
                  </Animated.View>
                )}

                {/* Legacy fallback if engine not available */}
                {isPremium && showPrompts && !enginePromptSet && promptSet && (
                  <Animated.View entering={FadeInDown.duration(300)} style={styles.promptsContainer}>
                    <Pressable
                      style={styles.promptCard}
                      onPress={() => usePrompt(promptSet.primary)}
                    >
                      <Text style={styles.promptText}>{promptSet.primary.prompt}</Text>
                      <Text style={styles.promptContext}>{promptSet.primary.context}</Text>
                    </Pressable>
                  </Animated.View>
                )}
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.contentInput}
                    value={content}
                    onChangeText={setContent}
                    placeholder="What's on your mind? How are you feeling? What insights have you discovered?"
                    placeholderTextColor={theme.textMuted}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(700).duration(600)} style={styles.saveContainer}>
                {/* Close quote — appears briefly after saving */}
                {showCloseQuote && closeQuote && (
                  <ShadowQuoteCard
                    quote={closeQuote}
                    variant="footer"
                    isCloseQuote
                    animationDelay={0}
                  />
                )}
                <Pressable style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]} onPress={handleSave}>
                  <LinearGradient
                    colors={['#E8D5A8', '#C9A962', '#B8994F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveGradient}
                  >
                    <Text style={styles.saveButtonText}>{initialData ? 'Update Entry' : 'Save Entry'}</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </ScrollView>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
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
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  section: { marginTop: theme.spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: theme.spacing.md, fontFamily: 'serif' },
  dateButton: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.cardBorder },
  dateGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  dateText: { fontSize: 16, color: theme.textPrimary, marginLeft: theme.spacing.md, flex: 1 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  moodOption: { flex: 1, minWidth: '45%', borderRadius: theme.borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.cardBorder },
  moodOptionSelected: { borderColor: theme.primary },
  moodGradient: { padding: theme.spacing.lg, alignItems: 'center', minHeight: 100 },
  moodIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm },
  moodLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  moodDescription: { fontSize: 11, color: theme.textMuted, textAlign: 'center' },
  moonPhaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  moonPhaseOption: { flex: 1, minWidth: '45%', borderRadius: theme.borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.cardBorder },
  moonPhaseOptionSelected: { borderColor: theme.primary },
  moonPhaseGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md },
  moonPhaseLabel: { fontSize: 13, fontWeight: '500', marginLeft: theme.spacing.sm },
  inputContainer: { backgroundColor: theme.backgroundTertiary, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.cardBorder },
  titleInput: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, fontSize: 16, color: theme.textPrimary },
  contentInput: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, fontSize: 16, color: theme.textPrimary, minHeight: 120 },
  // Premium prompts
  reflectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  promptsButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: theme.spacing.sm, paddingVertical: 4 },
  promptsButtonText: { fontSize: 13, color: theme.primary, fontWeight: '500' },
  promptsContainer: { marginBottom: theme.spacing.md },
  transitContext: { fontSize: 12, color: theme.primary, fontStyle: 'italic', marginBottom: theme.spacing.sm, textAlign: 'center' },
  promptCard: { backgroundColor: 'rgba(201, 169, 98, 0.1)', borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: 'rgba(201, 169, 98, 0.2)' },
  promptContextLine: { fontSize: 12, color: theme.textMuted, fontStyle: 'italic', marginBottom: 6, letterSpacing: 0.3 },
  promptText: { fontSize: 15, color: theme.textPrimary, fontStyle: 'italic', lineHeight: 22, marginBottom: 4 },
  promptClose: { fontSize: 12, color: theme.primary, marginTop: 6, fontWeight: '500', letterSpacing: 0.3 },
  promptContext: { fontSize: 11, color: theme.textMuted },
  chakraHint: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  chakraHintText: { fontSize: 11, color: theme.textMuted, fontStyle: 'italic', lineHeight: 16 },
  altPromptsRow: { flexDirection: 'row', gap: theme.spacing.sm },
  altPromptCard: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: theme.borderRadius.md, padding: theme.spacing.sm },
  altPromptContext: { fontSize: 10, color: theme.textMuted, marginBottom: 2, fontStyle: 'italic' },
  altPromptText: { fontSize: 12, color: theme.textSecondary, fontStyle: 'italic', lineHeight: 16 },
  saveContainer: { marginTop: theme.spacing.xl },
  saveButton: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', ...theme.shadows.glow },
  saveButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  saveGradient: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl, alignItems: 'center' },
  saveButtonText: { fontSize: 18, fontWeight: '700', color: '#0D1421', fontFamily: 'serif' },
});
