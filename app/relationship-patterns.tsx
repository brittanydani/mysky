// app/relationship-patterns.tsx
// MySky — Relational Mirror
// Psychological mirror for attachment tendencies. Categorizes patterns by
// relational style: Moving Toward (Anxious), Moving Away (Avoidant), Rigidity (Control).
// Includes Relational Gravity visualization. All data stored locally. Nothing transmitted.

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from '../components/keyboard/KeyboardControllerCompat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';
import { logger } from '../utils/logger';
import { Ionicons } from '@expo/vector-icons';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

const STORAGE_KEY = '@mysky:relationship_patterns';
const CUSTOM_TAGS_KEY = '@mysky:relationship_pattern_custom_tags';

const PALETTE = {
  anxious: '#7A9EBD',   // Steel blue — Moving Toward
  avoidant: '#C4877F',  // Dusty rose — Moving Away
  control: '#9088A8',   // Lavender grey — Rigidity
  secure: '#D9BF8C',    // Gold — Secure
  gold: '#D9BF8C',
  textMain: '#FFFFFF',
  textMuted: 'rgba(226,232,240,0.45)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#0A0A0F',
};

type PatternCategory = 'anxious' | 'avoidant' | 'control' | 'secure';

interface PatternTag {
  id: string;
  label: string;
  category: PatternCategory;
}

const PATTERN_TAGS: PatternTag[] = [
  // Moving Toward (Anxious / Over-functioning)
  { id: 't1', label: 'People-pleasing', category: 'anxious' },
  { id: 't2', label: 'Fear of abandonment', category: 'anxious' },
  { id: 't3', label: 'Rushing intimacy', category: 'anxious' },
  { id: 't4', label: 'Caretaking others', category: 'anxious' },
  { id: 't5', label: 'Over-explaining', category: 'anxious' },
  { id: 't15', label: 'Seeking reassurance', category: 'anxious' },
  { id: 't16', label: 'Self-silencing', category: 'anxious' },

  // Moving Away (Avoidant / Under-functioning)
  { id: 't6', label: 'Avoidant when close', category: 'avoidant' },
  { id: 't7', label: 'Emotional withdrawal', category: 'avoidant' },
  { id: 't8', label: 'Hyper-independence', category: 'avoidant' },
  { id: 't9', label: 'Shutting down', category: 'avoidant' },
  { id: 't10', label: 'Fear of enmeshment', category: 'avoidant' },
  { id: 't17', label: 'Difficulty trusting', category: 'avoidant' },

  // Rigidity / Protection (Control)
  { id: 't11', label: 'Need for control', category: 'control' },
  { id: 't12', label: 'Difficulty with boundaries', category: 'control' },
  { id: 't13', label: 'Testing the relationship', category: 'control' },
  { id: 't14', label: 'Perfectionism in love', category: 'control' },
  { id: 't18', label: 'Defensiveness', category: 'control' },

  // Secure (Regulated, Grounded Response)
  { id: 's1', label: 'Asking for reassurance directly', category: 'secure' },
  { id: 's2', label: 'Expressing needs clearly', category: 'secure' },
  { id: 's3', label: 'Letting myself be seen', category: 'secure' },
  { id: 's4', label: 'Staying present in connection', category: 'secure' },
  { id: 's5', label: 'Receiving care without deflecting', category: 'secure' },
  { id: 's6', label: 'Holding boundaries calmly', category: 'secure' },
  { id: 's7', label: 'Repairing after disconnection', category: 'secure' },
  { id: 's8', label: 'Self-soothing instead of spiraling', category: 'secure' },
  { id: 's9', label: 'Tolerating uncertainty', category: 'secure' },
  { id: 's10', label: 'Staying open instead of shutting down', category: 'secure' },
];

interface PatternEntry {
  id: string;
  date: string;
  note: string;
  tags: string[]; // Stores tag IDs for data integrity
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.sectionHeader}>
      <MetallicIcon name={icon as any} size={18} color={PALETTE.gold} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function RelationshipPatternsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const [entries, setEntries] = useState<PatternEntry[]>([]);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<PatternTag[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [activeCustomCategory, setActiveCustomCategory] = useState<PatternCategory | null>(null);
  const [editingCustomTagId, setEditingCustomTagId] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<PatternCategory>('anxious');

  useFocusEffect(
    useCallback(() => {
      EncryptedAsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) {
          try { setEntries(JSON.parse(raw)); } catch (e) {
            logger.warn('[RelationshipPatterns] Failed to parse stored entries:', e);
          }
        }
      }).catch((e) => { logger.warn('[RelationshipPatterns] Failed to load entries:', e); });
      EncryptedAsyncStorage.getItem(CUSTOM_TAGS_KEY).then((raw) => {
        if (raw) {
          try { setCustomTags(JSON.parse(raw)); } catch (e) {
            logger.warn('[RelationshipPatterns] Failed to parse custom tags:', e);
          }
        }
      }).catch((e) => { logger.warn('[RelationshipPatterns] Failed to load custom tags:', e); });
    }, []),
  );

  const allTags = useMemo(() => [...PATTERN_TAGS, ...customTags], [customTags]);

  const closeCustomComposer = useCallback(() => {
    setCustomTagInput('');
    setActiveCustomCategory(null);
    setEditingCustomTagId(null);
  }, []);

  const persistCustomTags = useCallback((next: PatternTag[]) => {
    EncryptedAsyncStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(next)).catch((e) => {
      logger.warn('[RelationshipPatterns] Failed to persist custom tags:', e);
    });
  }, []);

  const saveCustomTag = useCallback((label: string, category: PatternCategory, editingId?: string | null) => {
    const trimmed = label.trim();
    if (!trimmed) return;

    const tagId = editingId ?? `custom_${category}_${trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;

    setCustomTags((prev) => {
      const duplicate = prev.find((tag) =>
        tag.id !== tagId &&
        tag.category === category &&
        tag.label.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) return prev;

      const next = editingId
        ? prev.map((tag) => (tag.id === editingId ? { ...tag, label: trimmed, category } : tag))
        : [...prev, { id: tagId, label: trimmed, category }];
      persistCustomTags(next);
      return next;
    });
    setSelectedTags((prev) => (prev.includes(tagId) ? prev : [...prev, tagId]));
    closeCustomComposer();
  }, [closeCustomComposer, persistCustomTags]);

  const deleteCustomTag = useCallback((tagId: string) => {
    setCustomTags((prev) => {
      const next = prev.filter((tag) => tag.id !== tagId);
      persistCustomTags(next);
      return next;
    });
    setSelectedTags((prev) => prev.filter((candidate) => candidate !== tagId));
    if (editingCustomTagId === tagId) closeCustomComposer();
  }, [closeCustomComposer, editingCustomTagId, persistCustomTags]);

  const promptCustomTagAction = useCallback((tag: PatternTag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Custom Pattern', `Manage "${tag.label}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Edit',
        onPress: () => {
          setActiveCustomCategory(tag.category);
          setCustomTagInput(tag.label);
          setEditingCustomTagId(tag.id);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCustomTag(tag.id),
      },
    ]);
  }, [deleteCustomTag]);

  const toggleTag = (tagId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  };

  const addEntry = async () => {
    if (!note.trim() && selectedTags.length === 0) return;
    const newEntry: PatternEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      note: note.trim(),
      tags: selectedTags,
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    try {
      await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      Alert.alert('Error', 'Could not save entry. Please try again.');
      setEntries(entries);
      return;
    }
    // Cloud sync (fire-and-forget)
    import('../services/storage/syncService').then(({ enqueueRelationshipPattern }) =>
      enqueueRelationshipPattern(newEntry),
    ).catch(() => {});
    setNote('');
    setSelectedTags([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  // Psychological aggregation — categorize logged tags by attachment style
  const gravityStats = useMemo(() => {
    let anxiousCount = 0;
    let avoidantCount = 0;
    let controlCount = 0;
    let secureCount = 0;

    entries.forEach((entry) => {
      entry.tags.forEach((tagId) => {
        const tag = allTags.find((candidate) => candidate.id === tagId);
        if (tag?.category === 'anxious') anxiousCount++;
        if (tag?.category === 'avoidant') avoidantCount++;
        if (tag?.category === 'control') controlCount++;
        if (tag?.category === 'secure') secureCount++;
      });
    });

    const total = anxiousCount + avoidantCount + controlCount + secureCount;
    return {
      total,
      anxious: total > 0 ? (anxiousCount / total) * 100 : 0,
      avoidant: total > 0 ? (avoidantCount / total) * 100 : 0,
      control: total > 0 ? (controlCount / total) * 100 : 0,
      secure: total > 0 ? (secureCount / total) * 100 : 0,
    };
  }, [allTags, entries]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />

        {/* Nebula depth — atmospheric glow orbs */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(110, 140, 180, 0.12)' }]} />
          <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(217, 191, 140, 0.06)' }]} />
        </View>

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); router.replace('/(tabs)/identity'); }}
              hitSlop={10}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>
          </View>

          <View style={styles.titleArea}>
            <Text style={styles.headerTitle}>Relational Mirror</Text>
            <GoldSubtitle style={styles.headerSubtitle}>What you notice about yourself in connection</GoldSubtitle>
          </View>

          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bottomOffset={20}
            extraKeyboardSpace={12}
            disableScrollOnKeyboardHide
          >

            {/* Relational Gravity Visualization */}
            {gravityStats.total > 0 && (
              <>
              <SectionHeader title="Relational Gravity" icon="planet-outline" />
              <Animated.View entering={FadeIn.duration(600)}>
                <VelvetGlassSurface style={styles.summaryCard} intensity={30} backgroundColor={theme.isDark ? 'rgba(15, 15, 20, 0.56)' : 'rgba(255, 255, 255, 0.80)'}>
                <View style={styles.summaryHeader}>
                  <MetallicIcon name="planet-outline" size={16} color={PALETTE.gold} />
                  <MetallicText style={styles.summaryTitle} color={PALETTE.gold}>YOUR RELATIONAL GRAVITY</MetallicText>
                </View>

                <Text style={styles.summaryDescription}>
                  Based on your logs, here is how your nervous system tends to respond when triggered in connection.
                </Text>

                <View style={styles.gravityBarContainer}>
                  {gravityStats.anxious > 0 && (
                    <Animated.View
                      layout={Layout.springify()}
                      style={[styles.gravitySegment, { flex: gravityStats.anxious, backgroundColor: PALETTE.anxious }]}
                    />
                  )}
                  {gravityStats.avoidant > 0 && (
                    <Animated.View
                      layout={Layout.springify()}
                      style={[styles.gravitySegment, { flex: gravityStats.avoidant, backgroundColor: PALETTE.avoidant }]}
                    />
                  )}
                  {gravityStats.control > 0 && (
                    <Animated.View
                      layout={Layout.springify()}
                      style={[styles.gravitySegment, { flex: gravityStats.control, backgroundColor: PALETTE.control }]}
                    />
                  )}
                  {gravityStats.secure > 0 && (
                    <Animated.View
                      layout={Layout.springify()}
                      style={[styles.gravitySegment, { flex: gravityStats.secure, backgroundColor: PALETTE.secure }]}
                    />
                  )}
                </View>

                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <Text style={[styles.legendDot, { color: PALETTE.anxious }]}>◆</Text>
                    <Text style={[styles.legendText, { color: PALETTE.anxious }]}>Moving Toward</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <Text style={[styles.legendDot, { color: PALETTE.control }]}>◆</Text>
                    <Text style={[styles.legendText, { color: PALETTE.control }]}>Rigidity</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <Text style={[styles.legendDot, { color: PALETTE.avoidant }]}>◆</Text>
                    <Text style={[styles.legendText, { color: PALETTE.avoidant }]}>Moving Away</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <Text style={[styles.legendDot, { color: PALETTE.secure }]}>◆</Text>
                    <Text style={[styles.legendText, { color: PALETTE.secure }]}>Secure</Text>
                  </View>
                </View>
                </VelvetGlassSurface>
              </Animated.View>
              </>
            )}

            {/* Log Entry Form */}
            <SectionHeader title="Log a Pattern" icon="pencil-outline" />
            <Animated.View entering={FadeInDown.delay(220).duration(500)}>
              <VelvetGlassSurface style={styles.formCard} intensity={30} backgroundColor={theme.isDark ? 'rgba(15, 15, 20, 0.56)' : 'rgba(255, 255, 255, 0.80)'}>

              <TextInput
                style={styles.noteInput}
                placeholder="What dynamic played out today? Write freely..."
                placeholderTextColor={theme.isDark ? 'rgba(255,255,255,0.64)' : 'rgba(22,32,51,0.42)'}
                multiline
                maxLength={1000}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
                selectionColor={PALETTE.anxious}
              />

              <Text style={styles.tagSectionLabel}>SELECT ACTIVE PATTERNS</Text>
              <Text style={styles.tagHint}>Tap to select. Hold a custom pattern to edit or delete it.</Text>

              {(['anxious', 'avoidant', 'control', 'secure'] as PatternCategory[]).map((category) => {
                const categoryColor = PALETTE[category];
                const categoryLabel = category === 'anxious' ? 'Moving Toward' : category === 'avoidant' ? 'Moving Away' : category === 'control' ? 'Rigidity' : 'Secure';
                const categoryTags = PATTERN_TAGS.filter((t) => t.category === category);
                const categoryCustomTags = customTags.filter((tag) => tag.category === category);
                const selectedCount = selectedTags.filter((tagId) => allTags.find((tag) => tag.id === tagId)?.category === category).length;
                const isExpanded = expandedCategory === category;
                return (
                  <View key={category} style={styles.tagCategoryGroup}>
                    <Pressable
                      style={styles.tagCategoryHeader}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setExpandedCategory((current) => current === category ? current : category);
                      }}
                    >
                      <Text style={[styles.tagCategoryDot, { color: `${categoryColor}B8` }]}>◆</Text>
                      <Text style={styles.tagCategoryLabel}>{categoryLabel.toUpperCase()}</Text>
                      <View style={styles.tagCategoryMeta}>
                        {selectedCount > 0 && (
                          <Text style={styles.tagCategoryCount}>{selectedCount} selected</Text>
                        )}
                        <Ionicons name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={categoryColor} />
                      </View>
                    </Pressable>
                    {isExpanded && (
                      <View style={styles.tagCategoryBody}>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.tagRailContent}
                          style={styles.tagRail}
                        >
                          {categoryTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag.id);
                            return (
                              <Pressable
                                key={tag.id}
                                style={[
                                  styles.patternTag,
                                  isSelected && { borderColor: categoryColor, backgroundColor: `${categoryColor}18` },
                                ]}
                                onPress={() => toggleTag(tag.id)}
                              >
                                {isSelected ? (
                                  <MetallicText style={[styles.patternTagText, { fontWeight: '600' }]} color={categoryColor}>
                                    {tag.label}
                                  </MetallicText>
                                ) : (
                                  <Text style={styles.patternTagText}>
                                    {tag.label}
                                  </Text>
                                )}
                              </Pressable>
                            );
                          })}
                          {categoryCustomTags.map((tag) => {
                            const isSelected = selectedTags.includes(tag.id);
                            return (
                              <Pressable
                                key={tag.id}
                                style={[
                                  styles.patternTag,
                                  styles.customPatternTag,
                                  isSelected && { borderColor: categoryColor, backgroundColor: `${categoryColor}18` },
                                ]}
                                onPress={() => toggleTag(tag.id)}
                                onLongPress={() => promptCustomTagAction(tag)}
                              >
                                {isSelected ? (
                                  <MetallicText style={[styles.patternTagText, { fontWeight: '600' }]} color={categoryColor}>
                                    {tag.label}
                                  </MetallicText>
                                ) : (
                                  <Text style={styles.patternTagText}>
                                    {tag.label}
                                  </Text>
                                )}
                              </Pressable>
                            );
                          })}
                          {activeCustomCategory === category ? (
                            <View style={styles.customComposer}>
                              <TextInput
                                style={styles.customComposerInput}
                                value={customTagInput}
                                onChangeText={setCustomTagInput}
                                placeholder="Type your own..."
                                placeholderTextColor={theme.isDark ? 'rgba(255,255,255,0.42)' : 'rgba(22,32,51,0.36)'}
                                autoFocus
                                maxLength={40}
                                returnKeyType="done"
                                onSubmitEditing={() => {
                                  const value = customTagInput.trim();
                                  if (value) saveCustomTag(value, category, editingCustomTagId);
                                  else closeCustomComposer();
                                }}
                              />
                              <Pressable
                                hitSlop={8}
                                onPress={() => {
                                  const value = customTagInput.trim();
                                  if (value) saveCustomTag(value, category, editingCustomTagId);
                                  else closeCustomComposer();
                                }}
                              >
                                <Ionicons name={customTagInput.trim() ? 'checkmark-circle' : 'close-circle'} size={18} color={customTagInput.trim() ? categoryColor : 'rgba(255,255,255,0.42)'} />
                              </Pressable>
                            </View>
                          ) : (
                            <Pressable
                              style={[styles.patternTag, styles.addPatternTag, styles.addPatternTagStandalone]}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                setExpandedCategory(category);
                                setActiveCustomCategory(category);
                                setCustomTagInput('');
                                setEditingCustomTagId(null);
                              }}
                            >
                              <Ionicons name="add-outline" size={14} color={categoryColor} />
                              <MetallicText style={styles.addPatternTagText} color={categoryColor}>Custom</MetallicText>
                            </Pressable>
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                );
              })}

              {(note.trim().length > 0 || selectedTags.length > 0) && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <Pressable style={styles.submitBtn} onPress={addEntry}>
                    <LinearGradient colors={['rgba(217,191,140,0.3)', 'rgba(217,191,140,0.1)']} style={StyleSheet.absoluteFill} />
                    <MetallicText style={styles.submitBtnText} color={PALETTE.gold}>Seal Reflection</MetallicText>
                  </Pressable>
                </Animated.View>
              )}
              </VelvetGlassSurface>
            </Animated.View>

            {/* History */}
            {entries.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.historySection}>
                <SectionHeader title="Previous Reflections" icon="journal-outline" />
                <View style={styles.entryList}>
                  {entries.slice(0, 15).map((entry) => (
                    <VelvetGlassSurface key={entry.id} style={styles.entryCard} intensity={28} backgroundColor={theme.isDark ? 'rgba(15, 15, 20, 0.54)' : 'rgba(255, 255, 255, 0.80)'}>
                      <View style={styles.entryHeaderRow}>
                        <Ionicons name="journal-outline" size={14} color={theme.textMuted} />
                        <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      </View>

                      {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}

                      {entry.tags.length > 0 && (
                        <View style={styles.entryTagsRow}>
                          {entry.tags.map((tagId) => {
                            const tagData = allTags.find((tag) => tag.id === tagId);
                            if (!tagData) return null;
                            const tagColor = PALETTE[tagData.category];
                            return (
                              <View key={tagId} style={[styles.entryTag, { backgroundColor: `${tagColor}15`, borderColor: `${tagColor}30` }]}>
                                <MetallicText style={styles.entryTagText} color={tagColor}>{tagData.label}</MetallicText>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </VelvetGlassSurface>
                  ))}
                </View>
              </Animated.View>
            )}

            <View style={{ height: 140 }} />
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },

  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea:   { paddingHorizontal: 24, paddingBottom: 0, marginBottom: 32 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, borderWidth: 1, borderColor: theme.cardBorder, justifyContent: 'center', alignItems: 'center' },
  backIcon:   { color: theme.textPrimary, fontSize: 34, lineHeight: 34, marginTop: -2 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: { fontSize: 29, color: theme.textPrimary, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  headerSubtitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: theme.textSecondary },

  summaryCard: { borderRadius: 24, padding: 24, marginBottom: 32 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  summaryTitle: { fontSize: 12, color: PALETTE.gold, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  summaryDescription: { fontSize: 16, color: theme.textPrimary, lineHeight: 24, marginBottom: 32, fontWeight: '400' },

  gravityBarContainer: { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.pillSurface, marginBottom: 24, gap: 3 },
  gravitySegment: { height: '100%', borderRadius: 4 },

  legendRow: { flexDirection: 'row', marginTop: 8, justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  legendItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 6, paddingVertical: 2 },

  formCard: { borderRadius: 24, padding: 24, marginBottom: 32 },
  formTitle: { fontSize: 12, color: theme.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 20, textTransform: 'uppercase' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 8 },
  sectionTitle: { color: theme.textPrimary, fontSize: 19, fontWeight: '700' },
  noteInput: { minHeight: 120, borderRadius: 20, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, padding: 20, color: theme.textPrimary, fontSize: 16, lineHeight: 24, marginBottom: 32 },
  tagSectionLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '700', letterSpacing: 1.5, marginBottom: 20, textTransform: 'uppercase' },
  tagHint: { fontSize: 12, color: theme.textMuted, marginTop: -8, marginBottom: 20, lineHeight: 18 },

  patternTag: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface },
  customPatternTag: { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface },
  patternTagText: { fontSize: 13, color: theme.textSecondary, fontWeight: '600' },
  addPatternTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addPatternTagStandalone: { alignSelf: 'flex-start', marginTop: 2 },
  addPatternTagText: { fontSize: 13, fontWeight: '700' },
  customComposer: {
    minWidth: 170,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
  },
  customComposerInput: { minWidth: 120, flex: 1, color: theme.textPrimary, fontSize: 13, paddingVertical: 0 },

  submitBtn: { height: 58, borderRadius: 29, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(217,191,140,0.56)', justifyContent: 'center', alignItems: 'center', shadowColor: PALETTE.gold, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.16, shadowRadius: 22, elevation: 6 },
  submitBtnText: { fontSize: 15, color: PALETTE.gold, fontWeight: '800', letterSpacing: 0.7 },

  tagCategoryGroup: { marginBottom: 18, borderRadius: 22, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : theme.pillSurface, padding: 18 },
  tagCategoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagCategoryDot: { fontSize: 7, marginTop: 1 },
  tagCategoryLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: theme.textMuted },
  tagCategoryMeta: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagCategoryCount: { fontSize: 11, color: theme.textMuted, fontWeight: '600' },
  tagCategoryBody: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.cardBorder },
  tagRail: { marginHorizontal: -2 },
  tagRailContent: { gap: 10, paddingHorizontal: 2, alignItems: 'center' },

  legendDot: { fontSize: 8 },
  legendText: { fontSize: 12, fontWeight: '600' },

  historySection: { marginTop: 0 },
  entryList: { gap: 16 },
  entryCard: { borderRadius: 24, padding: 24 },
  entryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  entryDate: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
  entryNote: { fontSize: 16, color: theme.textPrimary, lineHeight: 24, marginBottom: 20 },
  entryTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  entryTag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  entryTagText: { fontSize: 12, fontWeight: '600' },
});
