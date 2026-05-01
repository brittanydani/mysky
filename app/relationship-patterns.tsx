// File: app/relationship-patterns.tsx
// MySky — Relational Mirror
//
// Updated to "Lunar Sky" & "Smoked Glass" Aesthetic:
// 1. Purged "goldenish" mud from visualization and submit buttons.
// 2. Implemented "Midnight Slate" for the Relational Gravity anchor card.
// 3. Implemented "Tactile Hardware" pattern tags (Recessed Void vs. Icy Glow).
// 4. Mapped attachment styles to Lunar Sky semantic washes (Nebula, Stratosphere, Ember, Sage).
// 5. Integrated "Velvet Glass" 1px directional light-catch borders.

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { KeyboardAwareScrollView } from '../components/keyboard/KeyboardControllerCompat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';
import { logger } from '../utils/logger';
import { Ionicons } from '@expo/vector-icons';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { EditorialPillGrid, EditorialPillItem } from '../components/ui/EditorialPillGrid';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { usePremium } from '../context/PremiumContext';
import { ReflectionDisclaimer } from '../components/ui/ReflectionDisclaimer';
import {
  addRelationshipPattern,
  loadPlainAccountScopedJson,
  loadRelationshipPatterns,
} from '../services/storage/selfKnowledgeStore';

const CUSTOM_TAGS_KEY = '@mysky:relationship_pattern_custom_tags';

type PatternCategory = 'anxious' | 'avoidant' | 'control' | 'secure';
type RegulationState = 'fight' | 'flight' | 'freeze' | 'fawn' | 'secure';

interface PatternTag {
  id: string;
  label: string;
  category: PatternCategory;
}

interface SelectableOption {
  id: string;
  label: string;
}

const PATTERN_TAGS: PatternTag[] = [
  { id: 't1', label: 'People-pleasing', category: 'anxious' },
  { id: 't2', label: 'Fear of abandonment', category: 'anxious' },
  { id: 't3', label: 'Rushing intimacy', category: 'anxious' },
  { id: 't4', label: 'Caretaking others', category: 'anxious' },
  { id: 't15', label: 'Seeking reassurance', category: 'anxious' },
  { id: 't5', label: 'Over-explaining', category: 'anxious' },
  { id: 't16', label: 'Feeling too much', category: 'anxious' },
  { id: 't17', label: 'Scanning for rejection', category: 'anxious' },
  { id: 't6', label: 'Pulling away', category: 'avoidant' },
  { id: 't7', label: 'Going quiet', category: 'avoidant' },
  { id: 't10', label: 'Needing space', category: 'avoidant' },
  { id: 't8', label: 'Minimizing needs', category: 'avoidant' },
  { id: 't19', label: 'Feeling trapped', category: 'avoidant' },
  { id: 't9', label: 'Shutting down', category: 'avoidant' },
  { id: 't20', label: 'Distracting yourself', category: 'avoidant' },
  { id: 't21', label: 'Avoiding repair', category: 'avoidant' },
  { id: 't11', label: 'Trying to manage the outcome', category: 'control' },
  { id: 't13', label: 'Testing the connection', category: 'control' },
  { id: 't22', label: 'Needing certainty', category: 'control' },
  { id: 't23', label: 'Pushing for answers', category: 'control' },
  { id: 't24', label: 'Emotional monitoring', category: 'control' },
  { id: 't25', label: 'Assuming the worst', category: 'control' },
  { id: 't26', label: 'Fixing instead of feeling', category: 'control' },
  { id: 't27', label: 'Holding resentment', category: 'control' },
  { id: 's2', label: 'Naming needs clearly', category: 'secure' },
  { id: 's4', label: 'Staying present', category: 'secure' },
  { id: 's7', label: 'Offering repair', category: 'secure' },
  { id: 's9', label: 'Trusting the connection', category: 'secure' },
  { id: 's1', label: 'Asking directly', category: 'secure' },
  { id: 's6', label: 'Respecting space', category: 'secure' },
  { id: 's8', label: 'Feeling grounded', category: 'secure' },
  { id: 's10', label: 'Letting things unfold', category: 'secure' },
];

const LEGACY_PATTERN_TAGS: PatternTag[] = [
  { id: 't12', label: 'Difficulty with boundaries', category: 'control' },
  { id: 't14', label: 'Perfectionism in love', category: 'control' },
  { id: 't18', label: 'Defensiveness', category: 'control' },
  { id: 's3', label: 'Letting myself be seen', category: 'secure' },
  { id: 's5', label: 'Receiving care without deflecting', category: 'secure' },
];

const ACTIVATION_OPTIONS: SelectableOption[] = [
  { id: 'fear', label: 'Fear' },
  { id: 'shame', label: 'Shame' },
  { id: 'loneliness', label: 'Loneliness' },
  { id: 'rejection', label: 'Rejection' },
  { id: 'pressure', label: 'Pressure' },
  { id: 'anger', label: 'Anger' },
  { id: 'grief', label: 'Grief' },
  { id: 'confusion', label: 'Confusion' },
  { id: 'tenderness', label: 'Tenderness' },
  { id: 'hope', label: 'Hope' },
];

const NEED_OPTIONS: SelectableOption[] = [
  { id: 'reassurance', label: 'Reassurance' },
  { id: 'space', label: 'Space' },
  { id: 'clarity', label: 'Clarity' },
  { id: 'comfort', label: 'Comfort' },
  { id: 'repair', label: 'Repair' },
  { id: 'honesty', label: 'Honesty' },
  { id: 'softness', label: 'Softness' },
  { id: 'boundaries', label: 'Boundaries' },
  { id: 'presence', label: 'Presence' },
  { id: 'time', label: 'Time' },
];

const REGULATION_STATES: (SelectableOption & { id: RegulationState })[] = [
  { id: 'fight', label: 'Fight' },
  { id: 'flight', label: 'Flight' },
  { id: 'freeze', label: 'Freeze' },
  { id: 'fawn', label: 'Fawn' },
  { id: 'secure', label: 'Secure' },
];

interface PatternEntry {
  id: string;
  date: string;
  note: string;
  tags: string[];
  activatedEmotions?: string[];
  needs?: string[];
  stateBefore?: RegulationState | null;
  stateAfter?: RegulationState | null;
}

export default function RelationshipPatternsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { isPremium } = usePremium();
  
  const [entries, setEntries] = useState<PatternEntry[]>([]);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedActivations, setSelectedActivations] = useState<string[]>([]);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [stateBefore, setStateBefore] = useState<RegulationState | null>(null);
  const [stateAfter, setStateAfter] = useState<RegulationState | null>(null);
  const [lastSavedEntry, setLastSavedEntry] = useState<PatternEntry | null>(null);
  const [customTags, setCustomTags] = useState<PatternTag[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<PatternCategory | null>('anxious');

  useFocusEffect(
    useCallback(() => {
      loadRelationshipPatterns()
        .then(setEntries)
        .catch(e => logger.warn('[RelationshipPatterns] Load failed', e));

      loadPlainAccountScopedJson<PatternTag[]>(CUSTOM_TAGS_KEY, [], CUSTOM_TAGS_KEY)
        .then(setCustomTags)
        .catch(e => logger.warn('[RelationshipPatterns] Custom tags failed', e));
    }, []),
  );

  const allTags = useMemo(() => [...PATTERN_TAGS, ...customTags], [customTags]);
  const resolvableTags = useMemo(() => [...PATTERN_TAGS, ...LEGACY_PATTERN_TAGS, ...customTags], [customTags]);

  const canSave = Boolean(
    note.trim()
      || selectedTags.length > 0
      || selectedActivations.length > 0
      || selectedNeeds.length > 0
      || stateBefore
      || stateAfter,
  );

  const getSemanticWashes = (cat: PatternCategory) => {
    if (cat === 'anxious') return { wash: ['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.05)'], color: '#A88BEB' }; // Nebula
    if (cat === 'avoidant') return { wash: ['rgba(92, 124, 170, 0.20)', 'rgba(92, 124, 170, 0.05)'], color: '#5C7CAA' }; // Stratosphere
    if (cat === 'control') return { wash: ['rgba(220, 80, 80, 0.20)', 'rgba(220, 80, 80, 0.05)'], color: '#DC5050' }; // Ember
    return { wash: ['rgba(107, 144, 128, 0.20)', 'rgba(107, 144, 128, 0.05)'], color: '#6B9080' }; // Sage
  };

  const addEntry = async () => {
    if (!canSave) return;
    const newEntry: PatternEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      note: note.trim(),
      tags: selectedTags,
      activatedEmotions: selectedActivations,
      needs: selectedNeeds,
      stateBefore,
      stateAfter,
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    try {
      await addRelationshipPattern(newEntry);
    } catch (e) {
      logger.error('[RelationshipPatterns] Failed to save entry', e);
      setEntries(entries);
      return;
    }
    setNote('');
    setSelectedTags([]);
    setSelectedActivations([]);
    setSelectedNeeds([]);
    setStateBefore(null);
    setStateAfter(null);
    setLastSavedEntry(newEntry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const clearSavedInsight = () => setLastSavedEntry(null);

  const toggleMultiSelect = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    clearSavedInsight();
    Haptics.selectionAsync().catch(() => {});
    setter(prev => (
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    ));
  };

  const buildBridgePillItems = (
    options: SelectableOption[],
    selected: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    accentColor: string,
  ): EditorialPillItem[] => options.map(option => ({
    key: option.id,
    label: option.label,
    selected: selected.includes(option.id),
    onPress: () => toggleMultiSelect(option.id, setter),
    accentColor,
    selectedBackgroundColor: `${accentColor}1F`,
    selectedTextColor: theme.textPrimary,
  }));

  const buildStatePillItems = (
    selected: RegulationState | null,
    setter: React.Dispatch<React.SetStateAction<RegulationState | null>>,
  ): EditorialPillItem[] => REGULATION_STATES.map(option => ({
    key: option.id,
    label: option.label,
    selected: selected === option.id,
    onPress: () => {
      clearSavedInsight();
      Haptics.selectionAsync().catch(() => {});
      setter(prev => prev === option.id ? null : option.id);
    },
    accentColor: '#6B9080',
    selectedBackgroundColor: 'rgba(107, 144, 128, 0.20)',
    selectedTextColor: theme.textPrimary,
  }));

  const resolveOptionLabels = (options: SelectableOption[], ids?: string[]) => (
    ids?.map(id => options.find(option => option.id === id)?.label ?? id) ?? []
  );

  const resolveStateLabel = (state?: RegulationState | null) => (
    state ? REGULATION_STATES.find(option => option.id === state)?.label ?? state : null
  );

  const gravityStats = useMemo(() => {
    let counts = { anxious: 0, avoidant: 0, control: 0, secure: 0 };
    entries.forEach(e => e.tags.forEach(tId => {
      const cat = resolvableTags.find(t => t.id === tId)?.category;
      if (cat) counts[cat]++;
    }));
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return {
      total,
      anxious: total > 0 ? (counts.anxious / total) * 100 : 0,
      avoidant: total > 0 ? (counts.avoidant / total) * 100 : 0,
      control: total > 0 ? (counts.control / total) * 100 : 0,
      secure: total > 0 ? (counts.secure / total) * 100 : 0,
    };
  }, [resolvableTags, entries]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/identity')}>
            <MetallicIcon name="chevron-back-outline" size={22} variant="gold" />
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Relational Mirror</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Notice the patterns beneath your connections</GoldSubtitle>
        </View>

        <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Relational Gravity (Anchor: Midnight Slate) */}
          {gravityStats.total > 0 && (
            <Animated.View entering={FadeIn.duration(600)}>
              <SectionHeader title="Relational Gravity" icon="planet-outline" />
              <VelvetGlassSurface style={styles.summaryCard as any} intensity={30}>
                <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
                <View style={styles.summaryHeader}>
                  <MetallicIcon name="planet-outline" size={16} variant="gold" />
                  <MetallicText style={styles.summaryTitle} variant="gold">YOUR RELATIONAL GRAVITY</MetallicText>
                </View>
                
                <View style={styles.gravityBarContainer}>
                  <View style={[styles.gravitySegment, { flex: gravityStats.anxious, backgroundColor: '#A88BEB' }]} />
                  <View style={[styles.gravitySegment, { flex: gravityStats.avoidant, backgroundColor: '#5C7CAA' }]} />
                  <View style={[styles.gravitySegment, { flex: gravityStats.control, backgroundColor: '#DC5050' }]} />
                  <View style={[styles.gravitySegment, { flex: gravityStats.secure, backgroundColor: '#6B9080' }]} />
                </View>

                <View style={styles.legendRow}>
                  <LegendItem label="Anxious" color="#A88BEB" />
                  <LegendItem label="Avoidant" color="#5C7CAA" />
                  <LegendItem label="Rigid" color="#DC5050" />
                  <LegendItem label="Secure" color="#6B9080" />
                </View>
              </VelvetGlassSurface>

              {/* Premium insight interpretation gate */}
              {!isPremium && entries.length >= 3 && (
                <Pressable
                  onPress={() => router.push('/(tabs)/premium' as any)}
                  style={{ marginTop: 12, marginBottom: 4, padding: 20, borderRadius: 20, backgroundColor: 'rgba(212,175,55,0.07)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.22)', alignItems: 'center', gap: 6 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MetallicIcon name="lock-closed-outline" size={12} variant="gold" />
                    <Text style={{ color: 'rgba(212,175,55,0.9)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>DEEPER SKY</Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                    Unlock a personalized read of what your relational gravity pattern actually means for how you connect.
                  </Text>
                  <Text style={{ color: 'rgba(212,175,55,0.8)', fontSize: 12, fontWeight: '600', marginTop: 4 }}>Reveal Your Interpretation →</Text>
                </Pressable>
              )}
            </Animated.View>
          )}

          {/* Log Form */}
          <SectionHeader title="Log a Pattern" icon="pencil-outline" />
          <VelvetGlassSurface style={styles.formCard as any} intensity={30} backgroundColor={theme.isDark ? 'rgba(15, 15, 20, 0.54)' : 'rgba(255, 255, 255, 0.82)'}>
            
            <TextInput
              style={styles.noteInput}
              placeholder="What happened — and what did it stir in you?"
              placeholderTextColor={theme.isDark ? 'rgba(255,255,255,0.58)' : 'rgba(0,0,0,0.48)'}
              multiline value={note} onChangeText={(value) => {
                clearSavedInsight();
                setNote(value);
              }}
            />
            <Text style={styles.inputHelper}>Notice the feeling beneath the interaction, not just the details.</Text>

            <Text style={styles.tagSectionLabel}>SELECT ACTIVE PATTERNS</Text>

            {(['anxious', 'avoidant', 'control', 'secure'] as PatternCategory[]).map((cat) => {
              const { color } = getSemanticWashes(cat);
              const isExpanded = expandedCategory === cat;
              const tags = allTags.filter(t => t.category === cat);
              
              const pillItems: EditorialPillItem[] = tags.map(tag => ({
                key: tag.id,
                label: tag.label,
                selected: selectedTags.includes(tag.id),
                onPress: () => toggleMultiSelect(tag.id, setSelectedTags),
                accentColor: color,
                selectedBackgroundColor: `${color}15`,
                selectedTextColor: theme.textPrimary,
              }));

              return (
                <View key={cat} style={[styles.tagCategoryGroup, theme.velvetBorder]}>
                  <Pressable style={styles.tagCategoryHeader} onPress={() => setExpandedCategory(isExpanded ? null : cat)}>
                    <Text style={[styles.tagCategoryDot, { color }]}>◆</Text>
                    <Text style={styles.tagCategoryLabel}>{cat.toUpperCase()}</Text>
                    <Ionicons name={isExpanded ? 'remove' : 'add'} size={16} color={color} style={{ marginLeft: 'auto' }} />
                  </Pressable>

                  {isExpanded && (
                    <EditorialPillGrid
                      items={pillItems}
                      style={styles.tagRailContent}
                    />
                  )}
                </View>
              );
            })}

            <View style={styles.bridgeBlock}>
              <Text style={styles.bridgeQuestionTitle}>What felt activated?</Text>
              <EditorialPillGrid
                items={buildBridgePillItems(ACTIVATION_OPTIONS, selectedActivations, setSelectedActivations, '#A88BEB')}
                style={styles.bridgePillGrid}
              />
            </View>

            <View style={styles.bridgeBlock}>
              <Text style={styles.bridgeQuestionTitle}>What did you need?</Text>
              <EditorialPillGrid
                items={buildBridgePillItems(NEED_OPTIONS, selectedNeeds, setSelectedNeeds, '#6B9080')}
                style={styles.bridgePillGrid}
              />
            </View>

            <View style={styles.stateGrid}>
              <View style={styles.stateBlock}>
                <Text style={styles.bridgeQuestionTitle}>Where were you before this?</Text>
                <EditorialPillGrid
                  items={buildStatePillItems(stateBefore, setStateBefore)}
                  style={styles.bridgePillGrid}
                />
              </View>
              <View style={styles.stateBlock}>
                <Text style={styles.bridgeQuestionTitle}>Where did it move you?</Text>
                <EditorialPillGrid
                  items={buildStatePillItems(stateAfter, setStateAfter)}
                  style={styles.bridgePillGrid}
                />
              </View>
            </View>

            { canSave && (
              <Pressable style={styles.submitBtn} onPress={addEntry}>
                <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
                <MetallicText style={styles.submitBtnText} variant="gold">Save Reflection</MetallicText>
              </Pressable>
            )}
          </VelvetGlassSurface>

          {lastSavedEntry && (
            <Animated.View entering={FadeIn.duration(500)} style={styles.savedInsightWrap}>
              <VelvetGlassSurface style={styles.savedInsightCard as any} intensity={24}>
                <LinearGradient colors={['rgba(107, 144, 128, 0.18)', 'rgba(15, 18, 25, 0.68)']} style={StyleSheet.absoluteFill} />
                <View style={styles.savedInsightHeader}>
                  <MetallicIcon name="sparkles-outline" size={16} variant="gold" />
                  <MetallicText style={styles.savedInsightEyebrow} variant="gold">REFLECTION SAVED</MetallicText>
                </View>
                <Text style={styles.savedInsightText}>
                  This may be less about the interaction itself and more about what it touched in you. Patterns often repeat where a need has gone unseen for a long time.
                </Text>
                <View style={styles.nextStepPrompt}>
                  <Text style={styles.nextStepPromptText}>What would feel like one secure next step?</Text>
                </View>
              </VelvetGlassSurface>
            </Animated.View>
          )}

          {/* History */}
          {entries.length > 0 && (
            <View style={styles.historySection}>
              <SectionHeader title="Previous Reflections" icon="journal-outline" />
              {entries.map(e => (
                <View key={e.id}>
                  <VelvetGlassSurface style={styles.entryCard as any} intensity={20}>
                     <Text style={styles.entryDate}>{new Date(e.date).toLocaleDateString()}</Text>
                     {e.note ? <Text style={styles.entryNote}>{e.note}</Text> : null}
                     {(() => {
                       const patternLabels = e.tags.map(tagId => resolvableTags.find(tag => tag.id === tagId)?.label ?? tagId);
                       const activationLabels = resolveOptionLabels(ACTIVATION_OPTIONS, e.activatedEmotions);
                       const needLabels = resolveOptionLabels(NEED_OPTIONS, e.needs);
                       const beforeLabel = resolveStateLabel(e.stateBefore);
                       const afterLabel = resolveStateLabel(e.stateAfter);
                       const movementLabels = [
                         beforeLabel ? `Before: ${beforeLabel}` : null,
                         afterLabel ? `Moved to: ${afterLabel}` : null,
                       ].filter((label): label is string => !!label);
                       const labels = [...patternLabels, ...activationLabels, ...needLabels, ...movementLabels];
                       if (labels.length === 0) return null;
                       const visibleLabels = labels.slice(0, 8);
                       const hiddenLabelCount = labels.length - visibleLabels.length;

                       return (
                         <View style={styles.entryChipRow}>
                           {visibleLabels.map(label => (
                             <View key={label} style={styles.entryChip}>
                               <Text style={styles.entryChipText}>{label}</Text>
                             </View>
                           ))}
                           {hiddenLabelCount > 0 && (
                             <View style={styles.entryChip}>
                               <Text style={styles.entryChipText}>+{hiddenLabelCount}</Text>
                             </View>
                           )}
                         </View>
                       );
                     })()}
                  </VelvetGlassSurface>
                </View>
              ))}
            </View>
          )}

          {entries.length === 0 && (
            <View style={styles.emptyHint}>
              <Text style={styles.emptyHintText}>Start logging relationship reflections to see your patterns emerge over time.</Text>
            </View>
          )}

          <ReflectionDisclaimer body="These patterns are for noticing and reflection — not clinical diagnosis or attachment assessment." />

          <View style={{ height: 100 }} />
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={{ color, fontSize: 8 }}>◆</Text>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 }}>
      <MetallicIcon name={icon as any} size={16} variant="gold" />
      <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  emptyHint: { marginTop: 16, marginBottom: 16, padding: 20, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emptyHintText: { fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 21, textAlign: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 12 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  titleArea: { paddingHorizontal: 24, marginVertical: 32 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: theme.textPrimary, letterSpacing: -1 },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  
  summaryCard: { borderRadius: 24, padding: 24, marginBottom: 32, overflow: 'hidden' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  summaryTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  
  gravityBarContainer: { height: 6, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 16 },
  gravitySegment: { height: '100%' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },

  formCard: { borderRadius: 28, padding: 24, marginBottom: 32 },
  noteInput: { minHeight: 126, borderRadius: 24, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.035)', borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', padding: 20, paddingTop: 20, color: theme.textPrimary, fontSize: 16, lineHeight: 23, marginBottom: 10 },
  inputHelper: { color: theme.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 24, paddingHorizontal: 2 },
  tagSectionLabel: { fontSize: 10, color: theme.textMuted, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
  
  tagCategoryGroup: { marginBottom: 12, borderRadius: 20, padding: 16, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' },
  tagCategoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagCategoryDot: { fontSize: 8 },
  tagCategoryLabel: { fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 1 },
  tagRailContent: { paddingTop: 16 },
  bridgeBlock: { marginTop: 18 },
  bridgeQuestionTitle: { color: theme.textPrimary, fontSize: 14, fontWeight: '700', lineHeight: 19, marginBottom: 12 },
  bridgePillGrid: { gap: 10 },
  stateGrid: { gap: 18, marginTop: 18 },
  stateBlock: { gap: 0 },
  
  submitBtn: { height: 56, borderRadius: 28, marginTop: 24, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  submitBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  savedInsightWrap: { marginTop: -12, marginBottom: 28 },
  savedInsightCard: { borderRadius: 24, padding: 20, overflow: 'hidden' },
  savedInsightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  savedInsightEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  savedInsightText: { color: theme.textPrimary, fontSize: 14, lineHeight: 21 },
  nextStepPrompt: { marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.035)', borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)' },
  nextStepPromptText: { color: theme.textSecondary, fontSize: 13, fontWeight: '700', lineHeight: 19 },

  historySection: { gap: 12 },
  entryCard: { padding: 20, borderRadius: 20, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  entryDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginBottom: 8 },
  entryNote: { fontSize: 14, color: theme.textPrimary, lineHeight: 20 },
  entryChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  entryChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.035)', borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
  entryChipText: { color: theme.textSecondary, fontSize: 10, fontWeight: '700', lineHeight: 13 },
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },
});
