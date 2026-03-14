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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';

const STORAGE_KEY = '@mysky:relationship_patterns';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PALETTE = {
  anxious: '#D4A3B3',   // Rose — Moving Toward
  avoidant: '#8BC4E8',  // Silver Blue — Moving Away
  control: '#A89BC8',   // Lavender — Rigidity
  gold: '#D9BF8C',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#0A0A0C',
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

  // Moving Away (Avoidant / Under-functioning)
  { id: 't6', label: 'Avoidant when close', category: 'avoidant' },
  { id: 't7', label: 'Emotional withdrawal', category: 'avoidant' },
  { id: 't8', label: 'Hyper-independence', category: 'avoidant' },
  { id: 't9', label: 'Shutting down', category: 'avoidant' },
  { id: 't10', label: 'Fear of enmeshment', category: 'avoidant' },

  // Rigidity / Protection (Control)
  { id: 't11', label: 'Need for control', category: 'control' },
  { id: 't12', label: 'Difficulty with boundaries', category: 'control' },
  { id: 't13', label: 'Testing the relationship', category: 'control' },
  { id: 't14', label: 'Perfectionism in love', category: 'control' },
];

interface PatternEntry {
  id: string;
  date: string;
  note: string;
  tags: string[]; // Stores tag IDs for data integrity
}

export default function RelationshipPatternsScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<PatternEntry[]>([]);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) {
          try { setEntries(JSON.parse(raw)); } catch {}
        }
      });
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
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
        <LinearGradient colors={['rgba(212,163,179,0.08)', 'transparent']} style={styles.topGlow} />

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Pressable
            style={styles.backBtn}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
          >
            <Ionicons name="arrow-back" size={20} color={PALETTE.anxious} />
            <Text style={styles.backText}>Identity Hub</Text>
          </Pressable>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
              <Text style={styles.headerTitle}>Relational Mirror</Text>
              <GoldSubtitle style={styles.headerSubtitle}>What you notice about yourself in connection</GoldSubtitle>
            </Animated.View>

            {/* Relational Gravity Visualization */}
            {gravityStats.total > 0 && (
              <Animated.View entering={FadeIn.duration(600)} style={styles.summaryCard}>
                <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.summaryHeader}>
                  <Ionicons name="planet-outline" size={16} color={PALETTE.gold} />
                  <Text style={styles.summaryTitle}>YOUR RELATIONAL GRAVITY</Text>
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
                    <View style={[styles.legendDot, { backgroundColor: PALETTE.anxious }]} />
                    <Text style={styles.legendText}>Moving Toward</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: PALETTE.avoidant }]} />
                    <Text style={styles.legendText}>Moving Away</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: PALETTE.control }]} />
                    <Text style={styles.legendText}>Rigidity</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Log Entry Form */}
            <Animated.View entering={FadeInDown.delay(220).duration(500)} style={styles.formCard}>
              <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={styles.formTitle}>LOG A PATTERN</Text>

              <TextInput
                style={styles.noteInput}
                placeholder="What dynamic played out today? Write freely..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                multiline
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
                selectionColor={PALETTE.anxious}
              />

              <Text style={styles.tagSectionLabel}>SELECT ACTIVE PATTERNS</Text>
              <View style={styles.tagGrid}>
                {PATTERN_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  const activeColor = PALETTE[tag.category];
                  return (
                    <Pressable
                      key={tag.id}
                      style={[
                        styles.patternTag,
                        isSelected && { borderColor: activeColor, backgroundColor: `${activeColor}15` },
                      ]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      <Text style={[styles.patternTagText, isSelected && { color: activeColor, fontWeight: '600' }]}>
                        {tag.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {(note.trim().length > 0 || selectedTags.length > 0) && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <Pressable style={styles.submitBtn} onPress={addEntry}>
                    <LinearGradient colors={['rgba(212,163,179,0.3)', 'rgba(212,163,179,0.1)']} style={StyleSheet.absoluteFill} />
                    <Text style={styles.submitBtnText}>Seal Reflection</Text>
                  </Pressable>
                </Animated.View>
              )}
            </Animated.View>

            {/* History */}
            {entries.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.historySection}>
                <Text style={styles.historyTitle}>PREVIOUS REFLECTIONS</Text>
                <View style={styles.entryList}>
                  {entries.slice(0, 15).map((entry) => (
                    <View key={entry.id} style={styles.entryCard}>
                      <BlurView intensity={12} tint="dark" style={StyleSheet.absoluteFill} />
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
                                <Text style={[styles.entryTagText, { color: tagColor }]}>{tagData.label}</Text>
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

            <View style={{ height: 120 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: PALETTE.anxious, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  header: { marginBottom: 32 },
  headerTitle: { fontSize: 34, color: PALETTE.textMain, fontFamily: 'Georgia', fontWeight: '300', marginBottom: 8 },
  headerSubtitle: { fontSize: 14 },

  summaryCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(212,163,179,0.2)', padding: 24, marginBottom: 24 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  summaryTitle: { fontSize: 11, color: PALETTE.gold, fontWeight: '800', letterSpacing: 1.5 },
  summaryDescription: { fontSize: 13, color: PALETTE.textMuted, lineHeight: 18, marginBottom: 24 },

  gravityBarContainer: { height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 16, gap: 2 },
  gravitySegment: { height: '100%', borderRadius: 4 },

  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: PALETTE.textMuted, fontWeight: '600' },

  formCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.glassBorder, padding: 24, marginBottom: 32 },
  formTitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
  noteInput: { minHeight: 100, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, color: PALETTE.textMain, fontSize: 15, fontFamily: 'Georgia', lineHeight: 22, marginBottom: 24 },
  tagSectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },

  patternTag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' },
  patternTagText: { fontSize: 13, color: PALETTE.textMuted },

  submitBtn: { height: 52, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(212,163,179,0.5)', justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { fontSize: 14, color: PALETTE.anxious, fontWeight: '800', letterSpacing: 0.5 },

  historySection: { marginTop: 8 },
  historyTitle: { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
  entryList: { gap: 12 },
  entryCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 20 },
  entryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  entryDate: { fontSize: 12, color: PALETTE.textMuted, fontWeight: '600' },
  entryNote: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontFamily: 'Georgia', lineHeight: 22, marginBottom: 16 },
  entryTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  entryTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  entryTagText: { fontSize: 11, fontWeight: '700' },
});
