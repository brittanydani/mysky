/**
 * JournalEntryModal
 * * A cinematic, high-end writing environment featuring obsidian glass architecture,
 * transit-tied prompt engines, and jewel-tone interactive feedback.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { toLocalDateString } from '../utils/dateUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { AstrologySettingsService } from '../services/astrology/astrologySettingsService';
import { NatalChart } from '../services/astrology/types';
import { ShadowQuoteEngine, ShadowQuoteResult, ShadowQuote } from '../services/astrology/shadowQuotes';
import { generateJournalPrompt, getFreePrompt, GeneratedPrompt, PromptSet } from '../services/journal/promptEngine';
import { getArchetypeProfile, getArchetypePrompt, ArchetypeProfile, ArchetypeJournalPrompt } from '../services/journal/archetypeIntegration';

import { AdvancedJournalAnalyzer } from '../services/premium/advancedJournal';
import { MetallicText } from './ui/MetallicText';
import { MetallicIcon } from './ui/MetallicIcon';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  amethyst: '#9D76C1',
  jade: '#6BBFA3',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

interface JournalEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => void;
  initialData?: JournalEntry;
  recentTags?: string[]; // tag IDs from recent entries, most recent first
}

type MoodKey = 'calm' | 'soft' | 'okay' | 'heavy' | 'stormy';
type EnergyKey = 'low' | 'steady' | 'high';

const MOOD_OPTIONS: { key: MoodKey; label: string; color: string }[] = [
  { key: 'calm',   label: 'Calm',   color: '#6EBF8B' },
  { key: 'soft',   label: 'Soft',   color: '#8BC4E8' },
  { key: 'okay',   label: 'Okay',   color: '#C9AE78' },
  { key: 'heavy',  label: 'Heavy',  color: '#A89BC8' },
  { key: 'stormy', label: 'Stormy', color: '#E07A7A' },
];

const TAG_CATEGORIES: { id: string; label: string; tags: { id: string; label: string }[] }[] = [
  {
    id: 'emotion',
    label: 'Emotion',
    tags: [
      { id: 'calm',          label: 'Calm' },
      { id: 'happy',         label: 'Happy' },
      { id: 'joyful',        label: 'Joyful' },
      { id: 'grateful',      label: 'Grateful' },
      { id: 'hopeful',       label: 'Hopeful' },
      { id: 'content',       label: 'Content' },
      { id: 'proud',         label: 'Proud' },
      { id: 'excited',       label: 'Excited' },
      { id: 'peaceful',      label: 'Peaceful' },
      { id: 'lonely',        label: 'Lonely' },
      { id: 'sad',           label: 'Sad' },
      { id: 'disappointed',  label: 'Disappointed' },
      { id: 'grief',         label: 'Grief' },
      { id: 'hurt',          label: 'Hurt' },
      { id: 'angry',         label: 'Angry' },
      { id: 'irritated',     label: 'Irritated' },
      { id: 'frustrated',    label: 'Frustrated' },
      { id: 'anxious',       label: 'Anxious' },
      { id: 'overwhelmed',   label: 'Overwhelmed' },
      { id: 'numb',          label: 'Numb' },
      { id: 'confused',      label: 'Confused' },
      { id: 'fearful',       label: 'Fearful' },
      { id: 'ashamed',       label: 'Ashamed' },
      { id: 'guilty',        label: 'Guilty' },
    ],
  },
  {
    id: 'inner_state',
    label: 'Inner State',
    tags: [
      { id: 'grounded',      label: 'Grounded' },
      { id: 'heavy',         label: 'Heavy' },
      { id: 'dysregulated',  label: 'Dysregulated' },
      { id: 'triggered',     label: 'Triggered' },
      { id: 'drained',       label: 'Drained' },
      { id: 'exhausted',     label: 'Exhausted' },
      { id: 'burned_out',    label: 'Burned Out' },
      { id: 'disconnected',  label: 'Disconnected' },
      { id: 'sensitive',     label: 'Sensitive' },
      { id: 'foggy',         label: 'Foggy' },
      { id: 'clear',         label: 'Clear' },
      { id: 'reflective',    label: 'Reflective' },
      { id: 'open',          label: 'Open' },
      { id: 'guarded',       label: 'Guarded' },
      { id: 'vulnerable',    label: 'Vulnerable' },
      { id: 'resilient',     label: 'Resilient' },
      { id: 'stuck',         label: 'Stuck' },
      { id: 'uncertain',     label: 'Uncertain' },
      { id: 'empowered',     label: 'Empowered' },
    ],
  },
  {
    id: 'life_themes',
    label: 'Life Themes',
    tags: [
      { id: 'healing',     label: 'Healing' },
      { id: 'growth',      label: 'Growth' },
      { id: 'hope',        label: 'Hope' },
      { id: 'setback',     label: 'Setback' },
      { id: 'transition',  label: 'Transition' },
      { id: 'change',      label: 'Change' },
      { id: 'loss',        label: 'Loss' },
      { id: 'conflict',    label: 'Conflict' },
      { id: 'connection',  label: 'Connection' },
      { id: 'belonging',   label: 'Belonging' },
      { id: 'stability',   label: 'Stability' },
      { id: 'boundaries',  label: 'Boundaries' },
      { id: 'self_trust',  label: 'Self-Trust' },
      { id: 'self_doubt',  label: 'Self-Doubt' },
      { id: 'acceptance',  label: 'Acceptance' },
      { id: 'letting_go',  label: 'Letting Go' },
      { id: 'recovery',    label: 'Recovery' },
      { id: 'identity',    label: 'Identity' },
      { id: 'safety',      label: 'Safety' },
      { id: 'survival',    label: 'Survival' },
      { id: 'chaos',       label: 'Chaos' },
    ],
  },
  {
    id: 'relationships',
    label: 'Relationships',
    tags: [
      { id: 'family',        label: 'Family' },
      { id: 'parenting',     label: 'Parenting' },
      { id: 'friendship',    label: 'Friendship' },
      { id: 'love',          label: 'Love' },
      { id: 'attachment',    label: 'Attachment' },
      { id: 'support',       label: 'Support' },
      { id: 'misunderstood', label: 'Misunderstood' },
      { id: 'closeness',     label: 'Closeness' },
      { id: 'distance',      label: 'Distance' },
      { id: 'trust',         label: 'Trust' },
      { id: 'betrayal',      label: 'Betrayal' },
      { id: 'rejection',     label: 'Rejection' },
      { id: 'repair',        label: 'Repair' },
      { id: 'caregiving',    label: 'Caregiving' },
    ],
  },
  {
    id: 'body_energy',
    label: 'Body & Energy',
    tags: [
      { id: 'low_energy',      label: 'Low Energy' },
      { id: 'high_energy',     label: 'High Energy' },
      { id: 'wired',           label: 'Wired' },
      { id: 'rested',          label: 'Rested' },
      { id: 'tired',           label: 'Tired' },
      { id: 'tense',           label: 'Tense' },
      { id: 'relaxed',         label: 'Relaxed' },
      { id: 'calm_body',       label: 'Calm Body' },
      { id: 'pain',            label: 'Pain' },
      { id: 'sick',            label: 'Sick' },
      { id: 'sensory_overload',label: 'Sensory Overload' },
      { id: 'restless',        label: 'Restless' },
      { id: 'body_heaviness',  label: 'Body Heaviness' },
    ],
  },
  {
    id: 'mind',
    label: 'Mind & Reflection',
    tags: [
      { id: 'clarity',         label: 'Clarity' },
      { id: 'insight',         label: 'Insight' },
      { id: 'memory',          label: 'Memory' },
      { id: 'flashback',       label: 'Flashback' },
      { id: 'rumination',      label: 'Rumination' },
      { id: 'overthinking',    label: 'Overthinking' },
      { id: 'dream',           label: 'Dream' },
      { id: 'intuition',       label: 'Intuition' },
      { id: 'creativity',      label: 'Creativity' },
      { id: 'mental_load',     label: 'Mental Load' },
      { id: 'self_reflection', label: 'Self-Reflection' },
      { id: 'processing',      label: 'Processing' },
      { id: 'awareness',       label: 'Awareness' },
    ],
  },
  {
    id: 'daily_life',
    label: 'Daily Life',
    tags: [
      { id: 'work',         label: 'Work' },
      { id: 'school',       label: 'School' },
      { id: 'home',         label: 'Home' },
      { id: 'routine',      label: 'Routine' },
      { id: 'appointments', label: 'Appointments' },
      { id: 'cleaning',     label: 'Cleaning' },
      { id: 'rest',         label: 'Rest' },
      { id: 'sleep',        label: 'Sleep' },
      { id: 'morning',      label: 'Morning' },
      { id: 'evening',      label: 'Evening' },
      { id: 'weekend',      label: 'Weekend' },
      { id: 'nature',       label: 'Nature' },
    ],
  },
  {
    id: 'spirit',
    label: 'Spiritual',
    tags: [
      { id: 'purpose',           label: 'Purpose' },
      { id: 'alignment',         label: 'Alignment' },
      { id: 'inner_child',       label: 'Inner Child' },
      { id: 'shadow_work',       label: 'Shadow Work' },
      { id: 'emotional_pattern', label: 'Emotional Pattern' },
      { id: 'transformation',    label: 'Transformation' },
      { id: 'release',           label: 'Release' },
      { id: 'renewal',           label: 'Renewal' },
      { id: 'breakthrough',      label: 'Breakthrough' },
    ],
  },
];

const ALL_TAGS = TAG_CATEGORIES.flatMap((c) => c.tags);

const CUSTOM_TAGS_KEY = 'mysky_custom_journal_tags';

interface CustomTag {
  id: string;
  label: string;
  categoryId?: string; // which category this belongs to, undefined = uncategorized
}

export default function JournalEntryModal({ visible, onClose, onSave, initialData, recentTags }: JournalEntryModalProps) {
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
  const [tags, setTags] = useState<string[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [categoryNewTagInputs, setCategoryNewTagInputs] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [chartId, setChartId] = useState<string>('');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSave]);

  // Exit writing mode when the modal closes
  useEffect(() => {
    if (!visible) setWritingMode(false);
  }, [visible]);



  useEffect(() => {
    if (visible) {
      loadUserChart();
      loadCustomTags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (visible) {
      getArchetypeProfile().then((profile) => {
        setArchetypeProfile(profile);
        if (profile) setArchetypePrompt(getArchetypePrompt(profile, mood));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Re-derive prompt whenever the user changes their mood
  useEffect(() => {
    if (archetypeProfile) {
      setArchetypePrompt(getArchetypePrompt(archetypeProfile, mood));
    }
  }, [mood, archetypeProfile]);

  useEffect(() => {
    if (isPremium && userChart) {
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

  const loadCustomTags = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CUSTOM_TAGS_KEY);
      if (raw) setCustomTags(JSON.parse(raw));
    } catch {}
  }, []);

  const saveCustomTag = useCallback(async (label: string, categoryId?: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = 'custom_' + trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setCustomTags((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      const next = [...prev, { id, label: trimmed, categoryId }];
      AsyncStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    setTags((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (categoryId) {
      setCategoryNewTagInputs((prev) => ({ ...prev, [categoryId]: '' }));
    } else {
      setNewTagInput('');
    }
  }, []);

  const deleteCustomTag = useCallback((id: string) => {
    setCustomTags((prev) => {
      const next = prev.filter((t) => t.id !== id);
      AsyncStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    setTags((prev) => prev.filter((t) => t !== id));
  }, []);

  const loadUserChart = async () => {
    try {
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const savedChart = charts[0];
        setChartId(savedChart.id);
        const astroSettings = await AstrologySettingsService.getSettings();
        const chart = AstrologyCalculator.generateNatalChart({
          date: savedChart.birthDate,
          time: savedChart.birthTime,
          hasUnknownTime: savedChart.hasUnknownTime,
          place: savedChart.birthPlace,
          latitude: savedChart.latitude,
          longitude: savedChart.longitude,
          timezone: savedChart.timezone,
          houseSystem: savedChart.houseSystem,
          zodiacSystem: astroSettings.zodiacSystem,
          orbPreset: astroSettings.orbPreset,
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
      setTags(initialData.tags ?? []);
    } else {
      setDate(new Date()); setMood('okay'); setEnergyLevel('steady');
      setTitle(''); setContent(''); setTags([]); setShowCloseQuote(false); setCloseQuote(null);
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
        tags: tags.length > 0 ? tags : undefined,
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
    } catch {
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
                  <Ionicons name="chevron-down-outline" size={22} color={PALETTE.textMain} />
                </Pressable>
                <Text style={styles.writingDateLabel} numberOfLines={1}>
                  {formatDate(date)}
                </Text>
                <View style={styles.writingHeaderRight}>
                  {pendingSave && (
                    <Animated.View style={[styles.saveIndicator, pulseStyle]}>
                      <View style={styles.saveIndicatorDot} />
                      <MetallicText style={styles.saveIndicatorText} color="#6EBF8B">Secured</MetallicText>
                    </Animated.View>
                  )}
                </View>
              </View>
            ) : (
              <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
                <Pressable style={styles.iconBtn} onPress={onClose} hitSlop={15}>
                  <Ionicons name="close-outline" size={24} color={PALETTE.textMain} />
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
                        {mood === key ? (
                          <MetallicText style={styles.moodChipText} color={color}>{label}</MetallicText>
                        ) : (
                          <Text style={[styles.moodChipText, { color: 'rgba(255,255,255,0.45)' }]}>{label}</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                
                {/* Date Selection */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                  <MetallicText style={styles.sectionLabel} color={PALETTE.gold}>Timeline</MetallicText>
                  <Pressable style={styles.glassInteractive} onPress={() => setShowDatePicker(true)}>
                    <LinearGradient colors={['rgba(139, 196, 232, 0.12)', 'rgba(2,8,23,0.50)']} style={styles.innerGradient}>
                      <MetallicIcon name="calendar-outline" size={18} color={PALETTE.silverBlue} />
                      <Text style={styles.interactiveText}>{formatDate(date)}</Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>

                {/* Title Input */}
                <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                  <MetallicText style={styles.sectionLabel} color={PALETTE.gold}>Title (Optional)</MetallicText>
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

                {/* Mood Selector */}
                <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
                  <MetallicText style={styles.sectionLabel} color={PALETTE.gold}>Mood</MetallicText>
                  <View style={styles.moodRow}>
                    {MOOD_OPTIONS.map((m) => {
                      const isSelected = mood === m.key;
                      return (
                        <Pressable
                          key={m.key}
                          onPress={() => { setMood(m.key); Haptics.selectionAsync().catch(() => {}); }}
                          style={[
                            styles.moodPill,
                            isSelected && { borderColor: m.color, backgroundColor: `${m.color}20` },
                          ]}
                        >
                          {isSelected ? (
                            <MetallicText style={styles.moodPillText} color={m.color}>{m.label}</MetallicText>
                          ) : (
                            <Text style={[styles.moodPillText, { color: 'rgba(255,255,255,0.4)' }]}>{m.label}</Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>

                {/* Main Reflection Area */}
                <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
                  <View style={styles.reflectionHeader}>
                    <MetallicText style={styles.sectionLabel} color={PALETTE.gold}>Reflection</MetallicText>
                    {(enginePromptSet || freePrompt) && (
                      <Pressable style={styles.promptsToggle} onPress={() => { Haptics.selectionAsync(); setShowPrompts(!showPrompts); }}>
                        <MetallicIcon name={showPrompts ? 'bulb' : 'bulb-outline'} size={16} color={PALETTE.gold} />
                        <MetallicText style={styles.promptsToggleText} color={PALETTE.gold}>Guided Prompts</MetallicText>
                      </Pressable>
                    )}
                  </View>

                  {shadowResult && <ShadowQuoteInline text={shadowResult.quote.text} delay={100} />}

                  {/* Archetype Lens — only visible when user opens Guided Prompts */}
                  {showPrompts && archetypePrompt && (
                    <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.archetypePromptCard}>
                      <View style={[styles.archetypeAccent, { backgroundColor: archetypePrompt.archetypeColor }]} />
                      <View style={styles.archetypePromptInner}>
                        <MetallicText style={styles.archetypeLabel} color={archetypePrompt.archetypeColor}>
                          {archetypePrompt.archetypeName.toUpperCase()}
                        </MetallicText>
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
                      <MetallicText style={styles.transitContext} color={PALETTE.silverBlue}>✦ {enginePromptSet.dailySummary}</MetallicText>
                      <Pressable style={styles.primaryPromptCard} onPress={() => { setContent(prev => prev.trim() ? `${prev}\n\n${enginePromptSet.primary.question}` : enginePromptSet.primary.question); setShowPrompts(false); }}>
                        <Text style={styles.promptContextLabel}>{enginePromptSet.primary.context}</Text>
                        <Text style={styles.primaryPromptText}>{enginePromptSet.primary.question}</Text>
                        {enginePromptSet.primary.chakra && (
                          <MetallicText style={styles.chakraNote} color={PALETTE.gold}>{enginePromptSet.primary.chakra.chakra.icon} Focus: {enginePromptSet.primary.chakra.bodyAwareness}</MetallicText>
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

                {/* Tags */}
                <Animated.View entering={FadeInDown.delay(480)} style={styles.section}>
                  <View style={styles.tagsHeader}>
                    <MetallicText style={styles.sectionLabel} color={PALETTE.gold}>Tags</MetallicText>
                    <Pressable
                      style={styles.addTagsBtn}
                      onPress={() => { Haptics.selectionAsync().catch(() => {}); setTagSearch(''); setShowTagPicker(true); }}
                    >
                      <Ionicons name="add-outline" size={14} color={PALETTE.jade} />
                      <Text style={styles.addTagsBtnText}>Add Tags</Text>
                    </Pressable>
                  </View>
                  {tags.length > 0 ? (
                    <View style={styles.tagsWrap}>
                      {tags.map((tagId) => {
                        const builtIn = ALL_TAGS.find((t) => t.id === tagId);
                        const custom = !builtIn ? customTags.find((t) => t.id === tagId) : undefined;
                        const tag = builtIn ?? custom;
                        if (!tag) return null;
                        const accent = PALETTE.jade;
                        return (
                          <Pressable
                            key={tagId}
                            onPress={() => { Haptics.selectionAsync().catch(() => {}); setTags((prev) => prev.filter((t) => t !== tagId)); }}
                            style={[styles.tagChip, custom ? styles.tagChipSelectedCustom : styles.tagChipSelected]}
                          >
                            <MetallicText style={styles.tagChipText} color={accent}>{tag.label}</MetallicText>
                            <Ionicons name="close-outline" size={11} color={accent} style={{ marginLeft: 4, opacity: 0.7 }} />
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Pressable
                      style={styles.tagPlaceholder}
                      onPress={() => { Haptics.selectionAsync().catch(() => {}); setTagSearch(''); setShowTagPicker(true); }}
                    >
                      <Ionicons name="pricetags-outline" size={15} color="rgba(255,255,255,0.20)" />
                      <Text style={styles.tagPlaceholderText}>Healing, Growth, Parenting...</Text>
                    </Pressable>
                  )}
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
              )}
              {/* end writingMode ternary */}

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

        {/* ── Tag Picker Modal ── */}
        <Modal
          visible={showTagPicker}
          animationType="slide"
          transparent
          onRequestClose={() => { setShowTagPicker(false); setTagSearch(''); setNewTagInput(''); setCategoryNewTagInputs({}); }}
          onShow={loadCustomTags}
        >
          <Pressable style={styles.tagPickerOverlay} onPress={() => { setShowTagPicker(false); setTagSearch(''); setNewTagInput(''); setCategoryNewTagInputs({}); }}>
            <Pressable style={styles.tagPickerSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.tagPickerHandle} />
              <View style={styles.tagPickerHeader}>
                <Text style={styles.tagPickerTitle}>Add Tags</Text>
                <Pressable hitSlop={16} onPress={() => { setShowTagPicker(false); setTagSearch(''); setNewTagInput(''); setCategoryNewTagInputs({}); }}>
                  <Text style={styles.tagPickerDone}>Done</Text>
                </Pressable>
              </View>

              {/* Search */}
              <View style={styles.tagSearchWrap}>
                <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.30)" />
                <TextInput
                  style={styles.tagSearchInput}
                  value={tagSearch}
                  onChangeText={setTagSearch}
                  placeholder="Search tags..."
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {tagSearch.length > 0 && (
                  <Pressable hitSlop={10} onPress={() => setTagSearch('')}>
                    <Ionicons name="close-circle-outline" size={15} color="rgba(255,255,255,0.30)" />
                  </Pressable>
                )}
              </View>

              <ScrollView
                style={styles.tagPickerScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {(() => {
                  const q = tagSearch.toLowerCase().trim();

                  const allSearchable = [
                    ...ALL_TAGS,
                    ...customTags.filter((ct) => !ALL_TAGS.some((t) => t.id === ct.id)),
                  ];

                  const TagChip = ({ tag, isCustom }: { tag: { id: string; label: string }; isCustom?: boolean }) => {
                    const selected = tags.includes(tag.id);
                    return (
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setTags((prev) =>
                            prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id]
                          );
                        }}
                        onLongPress={isCustom ? () => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                          Alert.alert('Remove Tag', `Delete "${tag.label}" from your custom tags?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteCustomTag(tag.id) },
                          ]);
                        } : undefined}
                        style={[
                          styles.tagPickerChip,
                          selected && (isCustom ? styles.tagPickerChipSelectedCustom : styles.tagPickerChipSelected),
                        ]}
                      >
                        {selected && <Ionicons name="checkmark-outline" size={12} color={PALETTE.jade} style={{ marginRight: 4 }} />}
                        <Text style={[
                          styles.tagPickerChipText,
                          selected && (isCustom ? styles.tagPickerChipTextSelectedCustom : styles.tagPickerChipTextSelected),
                        ]}>
                          {tag.label}
                        </Text>
                      </Pressable>
                    );
                  };

                  if (q) {
                    const results = allSearchable.filter((t) => t.label.toLowerCase().includes(q));
                    return results.length > 0 ? (
                      <View style={styles.tagPickerRow}>
                        {results.map((tag) => (
                          <TagChip key={tag.id} tag={tag} isCustom={customTags.some((ct) => ct.id === tag.id)} />
                        ))}
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center', marginTop: 28, gap: 12 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.30)', fontSize: 14 }}>
                          No tags match "{tagSearch}"
                        </Text>
                        <Pressable
                          style={styles.createTagBtn}
                          onPress={() => { saveCustomTag(tagSearch); setTagSearch(''); }}
                        >
                          <Ionicons name="add-outline" size={14} color={PALETTE.jade} />
                          <Text style={styles.createTagBtnText}>Create "{tagSearch}"</Text>
                        </Pressable>
                      </View>
                    );
                  }

                  // Recently used — up to 8 unique tags, not already selected
                  const recentUnselected = (recentTags ?? [])
                    .filter((id, i, arr) => arr.indexOf(id) === i)
                    .filter((id) => !tags.includes(id))
                    .slice(0, 8)
                    .map((id) => allSearchable.find((t) => t.id === id))
                    .filter(Boolean) as { id: string; label: string }[];

                  return (
                    <>
                      {recentUnselected.length > 0 && (
                        <>
                          <Text style={styles.tagPickerSectionLabel}>Recently Used</Text>
                          <View style={styles.tagPickerRow}>
                            {recentUnselected.map((tag) => <TagChip key={tag.id} tag={tag} />)}
                          </View>
                        </>
                      )}

                      {/* Your Tags — uncategorized custom tags */}
                      <Text style={styles.tagPickerSectionLabel}>Your Tags</Text>
                      <View style={[styles.tagPickerRow, { marginBottom: 4 }]}>
                        {customTags.filter((t) => !t.categoryId).map((tag) => (
                          <TagChip key={tag.id} tag={tag} isCustom />
                        ))}
                        {/* Inline create input */}
                        <View style={styles.newTagInputWrap}>
                          <TextInput
                            style={styles.newTagInput}
                            value={newTagInput}
                            onChangeText={setNewTagInput}
                            placeholder="+ New tag"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            returnKeyType="done"
                            maxLength={30}
                            onSubmitEditing={() => { if (newTagInput.trim()) saveCustomTag(newTagInput); }}
                            blurOnSubmit={false}
                          />
                          {newTagInput.trim().length > 0 && (
                            <Pressable hitSlop={10} onPress={() => saveCustomTag(newTagInput)}>
                              <Ionicons name="checkmark-circle-outline" size={18} color={PALETTE.jade} />
                            </Pressable>
                          )}
                        </View>
                      </View>
                      {customTags.length > 0 && (
                        <Text style={styles.tagPickerHint}>Hold to delete a custom tag</Text>
                      )}

                      {TAG_CATEGORIES.map((cat) => {
                        const catCustomTags = customTags.filter((ct) => ct.categoryId === cat.id);
                        return (
                          <React.Fragment key={cat.id}>
                            <Text style={styles.tagPickerSectionLabel}>{cat.label}</Text>
                            <View style={styles.tagPickerRow}>
                              {cat.tags.map((tag) => <TagChip key={tag.id} tag={tag} />)}
                              {catCustomTags.map((tag) => <TagChip key={tag.id} tag={tag} isCustom />)}
                              <View style={styles.newTagInputWrap}>
                                <TextInput
                                  style={styles.newTagInput}
                                  value={categoryNewTagInputs[cat.id] || ''}
                                  onChangeText={(v) => setCategoryNewTagInputs((prev) => ({ ...prev, [cat.id]: v }))}
                                  placeholder="+ New"
                                  placeholderTextColor="rgba(255,255,255,0.25)"
                                  returnKeyType="done"
                                  maxLength={30}
                                  onSubmitEditing={() => {
                                    const v = (categoryNewTagInputs[cat.id] || '').trim();
                                    if (v) saveCustomTag(v, cat.id);
                                  }}
                                  blurOnSubmit={false}
                                />
                                {(categoryNewTagInputs[cat.id] || '').trim().length > 0 && (
                                  <Pressable hitSlop={10} onPress={() => saveCustomTag((categoryNewTagInputs[cat.id] || '').trim(), cat.id)}>
                                    <Ionicons name="checkmark-circle-outline" size={18} color={PALETTE.jade} />
                                  </Pressable>
                                )}
                              </View>
                            </View>
                          </React.Fragment>
                        );
                      })}
                    </>
                  );
                })()}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  // ── Writing mode header ──
  writingHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  writingDateLabel: { flex: 1, fontSize: 13, color: 'rgba(240,234,214,0.50)', marginLeft: 4 },
  writingHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(110,191,139,0.12)', borderWidth: 1, borderColor: 'rgba(110,191,139,0.25)' },
  saveIndicatorDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#6EBF8B' },
  saveIndicatorText: { fontSize: 11, color: '#6EBF8B', fontWeight: '600', letterSpacing: 0.5 },

  // ── Distraction-free writing surface ──
  focusedContentInput: { flex: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 12, color: PALETTE.textMain, fontSize: 17, lineHeight: 28, textAlignVertical: 'top' },

  // ── Mood quick-pick toolbar (sits above keyboard in writing mode) ──
  moodToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(2,8,23,0.75)' },
  moodChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  moodChipText: { fontSize: 11, fontWeight: '600' },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },
  
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: PALETTE.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 },
  
  glassInteractive: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.glassBorder },
  innerGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  interactiveText: { color: PALETTE.textMain, fontSize: 16, fontWeight: '500' },
  
  glassInput: { backgroundColor: 'transparent', borderRadius: 24, borderWidth: 1, borderColor: PALETTE.glassBorder },
  titleInput: { padding: 16, color: PALETTE.textMain, fontSize: 16 },
  
  reflectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  promptsToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  promptsToggleText: { fontSize: 13, color: PALETTE.gold, fontWeight: '600' },
  
  promptZone: { marginBottom: 20 },
  transitContext: { fontSize: 13, color: PALETTE.silverBlue, marginBottom: 12, textAlign: 'center' },
  primaryPromptCard: { backgroundColor: 'transparent', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(232,214,174,0.18)' },
  promptContextLabel: { fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  primaryPromptText: { fontSize: 16, color: PALETTE.textMain, lineHeight: 24 },
  chakraNote: { fontSize: 12, color: PALETTE.gold, marginTop: 12, opacity: 0.8 },
  
  contentBox: { minHeight: 240 },
  contentInput: { padding: 16, color: PALETTE.textMain, fontSize: 16, lineHeight: 26 },

  // ── Archetype lens prompt card ──
  archetypePromptCard: { flexDirection: 'row', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.025)', marginBottom: 16 },
  archetypeAccent: { width: 3 },
  archetypePromptInner: { flex: 1, padding: 14, gap: 4 },
  archetypeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  archetypeContext: { fontSize: 12, color: 'rgba(255,255,255,0.40)', lineHeight: 17 },
  archetypeQuestion: { fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 21, marginTop: 2 },
  
  // ── Mood row ──
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  moodPillText: { fontSize: 11, fontWeight: '600' },

  // ── Tags ──
  tagsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addTagsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(107,191,163,0.30)', backgroundColor: 'rgba(107,191,163,0.08)' },
  addTagsBtnText: { fontSize: 12, color: PALETTE.jade, fontWeight: '600' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 4 },
  tagPlaceholderText: { fontSize: 13, color: 'rgba(255,255,255,0.22)',  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tagChipSelected: {
    borderColor: 'rgba(107,191,163,0.45)',
    backgroundColor: 'rgba(107,191,163,0.12)',
  },
  tagChipSelectedCustom: {
    borderColor: 'rgba(107,191,163,0.45)',
    backgroundColor: 'rgba(107,191,163,0.12)',
  },
  tagChipText: { fontSize: 11, fontWeight: '600' },

  // ── Tag Picker Modal ──
  tagPickerOverlay: { flex: 1, backgroundColor: 'rgba(2,8,23,0.72)', justifyContent: 'flex-end' },
  tagPickerSheet: { backgroundColor: '#0D1628', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)', maxHeight: '82%' },
  tagPickerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  tagPickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  tagPickerTitle: { fontSize: 16, color: PALETTE.textMain, fontWeight: '700' },
  tagPickerDone: { fontSize: 14, color: PALETTE.jade, fontWeight: '700' },
  tagSearchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 8 },
  tagSearchInput: { flex: 1, color: PALETTE.textMain, fontSize: 14, padding: 0 },
  tagPickerScroll: { paddingHorizontal: 16, paddingBottom: 40 },
  tagPickerSectionLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(201,174,120,0.65)', letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 18, marginBottom: 8, paddingLeft: 2 },
  tagPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPickerChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.03)' },
  tagPickerChipSelected: { borderColor: 'rgba(107,191,163,0.50)', backgroundColor: 'rgba(107,191,163,0.14)' },
  tagPickerChipSelectedCustom: { borderColor: 'rgba(107,191,163,0.50)', backgroundColor: 'rgba(107,191,163,0.14)' },
  tagPickerChipText: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  tagPickerChipTextSelected: { color: PALETTE.jade, fontWeight: '700' },
  tagPickerChipTextSelectedCustom: { color: PALETTE.jade, fontWeight: '700' },
  createTagBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(107,191,163,0.35)', backgroundColor: 'rgba(107,191,163,0.10)' },
  createTagBtnText: { fontSize: 13, color: PALETTE.jade, fontWeight: '600' },
  newTagInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(107,191,163,0.30)', backgroundColor: 'rgba(107,191,163,0.05)', minWidth: 90 },
  newTagInput: { flex: 1, color: PALETTE.textMain, fontSize: 13, padding: 0, minWidth: 60 },
  tagPickerHint: { fontSize: 10, color: 'rgba(255,255,255,0.20)', textAlign: 'center', marginTop: 6, marginBottom: 2,  },

  footer: { marginTop: 24 },
  saveBtn: { borderRadius: 16, overflow: 'hidden', },
  saveGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#020817', fontSize: 17, fontWeight: '700' },
});