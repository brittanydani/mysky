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
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
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

const STORAGE_KEY = '@mysky:relationship_patterns';

const PALETTE = {
  anxious: '#D9BF8C',   // Gold — Moving Toward
  avoidant: '#8CBEAA',  // Sage — Moving Away
  control: '#CD7F5D',   // Copper — Rigidity
  gold: '#D9BF8C',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#020817',
};

type PatternCategory = 'anxious' | 'avoidant' | 'control';

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
];

interface PatternEntry {
  id: string;
  date: string;
  note: string;
  tags: string[]; // Stores tag IDs for data integrity
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={styles.sectionHeader}>
      <MetallicIcon name={icon as any} size={18} color={PALETTE.gold} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function RelationshipPatternsScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<PatternEntry[]>([]);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      EncryptedAsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) {
          try { setEntries(JSON.parse(raw)); } catch (e) {
            logger.warn('[RelationshipPatterns] Failed to parse stored entries:', e);
          }
        }
      }).catch((e) => { logger.warn('[RelationshipPatterns] Failed to load entries:', e); });
    }, []),
  );

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
    setNote('');
    setSelectedTags([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  // Psychological aggregation — categorize logged tags by attachment style
  const gravityStats = useMemo(() => {
    let anxiousCount = 0;
    let avoidantCount = 0;
    let controlCount = 0;

    entries.forEach((entry) => {
      entry.tags.forEach((tagId) => {
        const tag = PATTERN_TAGS.find((t) => t.id === tagId);
        if (tag?.category === 'anxious') anxiousCount++;
        if (tag?.category === 'avoidant') avoidantCount++;
        if (tag?.category === 'control') controlCount++;
      });
    });

    const total = anxiousCount + avoidantCount + controlCount;
    return {
      total,
      anxious: total > 0 ? (anxiousCount / total) * 100 : 0,
      avoidant: total > 0 ? (avoidantCount / total) * 100 : 0,
      control: total > 0 ? (controlCount / total) * 100 : 0,
    };
  }, [entries]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              style={styles.closeButton}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); router.replace('/(tabs)/blueprint'); }}
            >
              <Text style={styles.closeIcon}>×</Text>
            </Pressable>
          </View>

          <View style={styles.titleArea}>
            <Text style={styles.headerTitle}>Relational Mirror</Text>
            <GoldSubtitle style={styles.headerSubtitle}>What you notice about yourself in connection</GoldSubtitle>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Relational Gravity Visualization */}
            {gravityStats.total > 0 && (
              <>
              <SectionHeader title="Relational Gravity" icon="planet-outline" />
              <Animated.View entering={FadeIn.duration(600)} style={styles.summaryCard}>
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
                </View>

                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <MetallicText style={styles.legendDot} color={PALETTE.anxious}>◆</MetallicText>
                    <MetallicText style={styles.legendText} color={PALETTE.anxious}>Moving Toward</MetallicText>
                  </View>
                  <View style={styles.legendItem}>
                    <MetallicText style={styles.legendDot} color={PALETTE.avoidant}>◆</MetallicText>
                    <MetallicText style={styles.legendText} color={PALETTE.avoidant}>Moving Away</MetallicText>
                  </View>
                  <View style={styles.legendItem}>
                    <MetallicText style={styles.legendDot} color={PALETTE.control}>◆</MetallicText>
                    <MetallicText style={styles.legendText} color={PALETTE.control}>Rigidity</MetallicText>
                  </View>
                </View>
              </Animated.View>
              </>
            )}

            {/* Log Entry Form */}
            <SectionHeader title="Log a Pattern" icon="pencil-outline" />
            <Animated.View entering={FadeInDown.delay(220).duration(500)} style={styles.formCard}>

              <TextInput
                style={styles.noteInput}
                placeholder="What dynamic played out today? Write freely..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
                maxLength={1000}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
                selectionColor={PALETTE.anxious}
              />

              <Text style={styles.tagSectionLabel}>SELECT ACTIVE PATTERNS</Text>

              {(['anxious', 'avoidant', 'control'] as PatternCategory[]).map((category) => {
                const categoryColor = PALETTE[category];
                const categoryLabel = category === 'anxious' ? 'Moving Toward' : category === 'avoidant' ? 'Moving Away' : 'Rigidity';
                const categoryTags = PATTERN_TAGS.filter((t) => t.category === category);
                return (
                  <View key={category} style={styles.tagCategoryGroup}>
                    <View style={styles.tagCategoryHeader}>
                      <MetallicText style={styles.tagCategoryDot} color={categoryColor}>◆</MetallicText>
                      <MetallicText style={styles.tagCategoryLabel} color={categoryColor}>{categoryLabel}</MetallicText>
                    </View>
                    <View style={styles.tagGrid}>
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
                    </View>
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
            </Animated.View>

            {/* History */}
            {entries.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.historySection}>
                <SectionHeader title="Previous Reflections" icon="journal-outline" />
                <View style={styles.entryList}>
                  {entries.slice(0, 15).map((entry) => (
                    <View key={entry.id} style={styles.entryCard}>
                      <View style={styles.entryHeaderRow}>
                        <Ionicons name="journal-outline" size={14} color={PALETTE.textMuted} />
                        <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      </View>

                      {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}

                      {entry.tags.length > 0 && (
                        <View style={styles.entryTagsRow}>
                          {entry.tags.map((tagId) => {
                            const tagData = PATTERN_TAGS.find((t) => t.id === tagId);
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
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            <View style={{ height: 140 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
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
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  closeIcon:   { color: '#FFF', fontSize: 24, lineHeight: 28 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: { fontSize: 34, color: PALETTE.textMain, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' },

  summaryCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 28, marginBottom: 32, backgroundColor: 'rgba(255,255,255,0.02)' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  summaryTitle: { fontSize: 12, color: PALETTE.gold, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  summaryDescription: { fontSize: 16, color: 'rgba(255,255,255,0.9)', lineHeight: 24, marginBottom: 32, fontWeight: '400' },

  gravityBarContainer: { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 24, gap: 3 },
  gravitySegment: { height: '100%', borderRadius: 4 },

  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  formCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 28, marginBottom: 32, backgroundColor: 'rgba(255,255,255,0.02)' },
  formTitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 20, textTransform: 'uppercase' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 8 },
  sectionTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '700' },
  noteInput: { minHeight: 120, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', padding: 20, color: PALETTE.textMain, fontSize: 16, lineHeight: 24, marginBottom: 32 },
  tagSectionLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 20, textTransform: 'uppercase' },

  patternTag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' },
  patternTagText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

  submitBtn: { height: 56, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(217,191,140,0.4)', justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { fontSize: 15, color: PALETTE.gold, fontWeight: '700', letterSpacing: 0.5 },

  tagCategoryGroup: { marginBottom: 24 },
  tagCategoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tagCategoryDot: { fontSize: 8, marginTop: 1 },
  tagCategoryLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  legendDot: { fontSize: 8 },
  legendText: { fontSize: 12, fontWeight: '600' },

  historySection: { marginTop: 0 },
  entryList: { gap: 16 },
  entryCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 28, backgroundColor: 'rgba(255,255,255,0.02)' },
  entryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  entryDate: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  entryNote: { fontSize: 16, color: 'rgba(255,255,255,0.9)', lineHeight: 24, marginBottom: 20 },
  entryTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  entryTag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  entryTagText: { fontSize: 12, fontWeight: '600' },
});
