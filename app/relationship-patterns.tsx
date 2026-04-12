// File: app/relationship-patterns.tsx
// MySky — Relational Mirror
//
// Updated to "Lunar Sky" & "Smoked Glass" Aesthetic:
// 1. Purged "goldenish" mud from visualization and submit buttons.
// 2. Implemented "Midnight Slate" for the Relational Gravity anchor card.
// 3. Implemented "Tactile Hardware" pattern tags (Recessed Void vs. Icy Glow).
// 4. Mapped attachment styles to Lunar Sky semantic washes (Nebula, Stratosphere, Ember, Sage).
// 5. Integrated "Velvet Glass" 1px directional light-catch borders.

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
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

type PatternCategory = 'anxious' | 'avoidant' | 'control' | 'secure';

interface PatternTag {
  id: string;
  label: string;
  category: PatternCategory;
}

const PATTERN_TAGS: PatternTag[] = [
  { id: 't1', label: 'People-pleasing', category: 'anxious' },
  { id: 't2', label: 'Fear of abandonment', category: 'anxious' },
  { id: 't3', label: 'Rushing intimacy', category: 'anxious' },
  { id: 't4', label: 'Caretaking others', category: 'anxious' },
  { id: 't15', label: 'Seeking reassurance', category: 'anxious' },
  { id: 't6', label: 'Avoidant when close', category: 'avoidant' },
  { id: 't7', label: 'Emotional withdrawal', category: 'avoidant' },
  { id: 't8', label: 'Hyper-independence', category: 'avoidant' },
  { id: 't9', label: 'Shutting down', category: 'avoidant' },
  { id: 't11', label: 'Need for control', category: 'control' },
  { id: 't12', label: 'Difficulty with boundaries', category: 'control' },
  { id: 't18', label: 'Defensiveness', category: 'control' },
  { id: 's1', label: 'Direct Reassurance', category: 'secure' },
  { id: 's2', label: 'Clear Needs', category: 'secure' },
  { id: 's4', label: 'Staying Present', category: 'secure' },
  { id: 's6', label: 'Calm Boundaries', category: 'secure' },
  { id: 's8', label: 'Self-Soothing', category: 'secure' },
];

interface PatternEntry {
  id: string;
  date: string;
  note: string;
  tags: string[];
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
        if (raw) setEntries(JSON.parse(raw));
      }).catch(e => logger.warn('[RelationshipPatterns] Load failed', e));
      
      EncryptedAsyncStorage.getItem(CUSTOM_TAGS_KEY).then((raw) => {
        if (raw) setCustomTags(JSON.parse(raw));
      }).catch(e => logger.warn('[RelationshipPatterns] Custom tags failed', e));
    }, []),
  );

  const allTags = useMemo(() => [...PATTERN_TAGS, ...customTags], [customTags]);

  const getSemanticWashes = (cat: PatternCategory) => {
    if (cat === 'anxious') return { wash: ['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.05)'], color: '#A88BEB' }; // Nebula
    if (cat === 'avoidant') return { wash: ['rgba(92, 124, 170, 0.20)', 'rgba(92, 124, 170, 0.05)'], color: '#5C7CAA' }; // Stratosphere
    if (cat === 'control') return { wash: ['rgba(220, 80, 80, 0.20)', 'rgba(220, 80, 80, 0.05)'], color: '#DC5050' }; // Ember
    return { wash: ['rgba(107, 144, 128, 0.20)', 'rgba(107, 144, 128, 0.05)'], color: '#6B9080' }; // Sage
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
    await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNote('');
    setSelectedTags([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const gravityStats = useMemo(() => {
    let counts = { anxious: 0, avoidant: 0, control: 0, secure: 0 };
    entries.forEach(e => e.tags.forEach(tId => {
      const cat = allTags.find(t => t.id === tId)?.category;
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
  }, [allTags, entries]);

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
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Relational Mirror</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Mirroring your attachment and connection dynamics</GoldSubtitle>
        </View>

        <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Relational Gravity (Anchor: Midnight Slate) */}
          {gravityStats.total > 0 && (
            <Animated.View entering={FadeIn.duration(600)}>
              <SectionHeader title="Relational Gravity" icon="planet-outline" />
              <VelvetGlassSurface style={styles.summaryCard} intensity={30}>
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
            </Animated.View>
          )}

          {/* Log Form (Atmosphere Blue) */}
          <SectionHeader title="Log a Pattern" icon="pencil-outline" />
          <VelvetGlassSurface style={styles.formCard} intensity={30}>
            <LinearGradient colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']} style={StyleSheet.absoluteFill} />
            
            <TextInput
              style={styles.noteInput}
              placeholder="What played out today? Describe the dynamic..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline value={note} onChangeText={setNote}
            />

            <Text style={styles.tagSectionLabel}>SELECT ACTIVE PATTERNS</Text>

            {(['anxious', 'avoidant', 'control', 'secure'] as PatternCategory[]).map((cat) => {
              const { wash, color } = getSemanticWashes(cat);
              const isExpanded = expandedCategory === cat;
              const tags = allTags.filter(t => t.category === cat);
              
              return (
                <View key={cat} style={[styles.tagCategoryGroup, theme.velvetBorder]}>
                  <Pressable style={styles.tagCategoryHeader} onPress={() => setExpandedCategory(cat)}>
                    <Text style={[styles.tagCategoryDot, { color }]}>◆</Text>
                    <Text style={styles.tagCategoryLabel}>{cat.toUpperCase()}</Text>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={color} style={{ marginLeft: 'auto' }} />
                  </Pressable>

                  {isExpanded && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRailContent}>
                      {tags.map(tag => {
                        const isSelected = selectedTags.includes(tag.id);
                        return (
                          <Pressable key={tag.id} onPress={() => setSelectedTags(prev => isSelected ? prev.filter(i => i !== tag.id) : [...prev, tag.id])}
                            style={[styles.patternTag, isSelected ? { backgroundColor: 'rgba(162, 194, 225, 0.15)', borderColor: 'rgba(162, 194, 225, 0.4)' } : styles.patternTagUnselected]}>
                            <Text style={[styles.patternTagText, isSelected && { color: '#FFF' }]}>{tag.label}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              );
            })}

            { (note.trim() || selectedTags.length > 0) && (
              <Pressable style={styles.submitBtn} onPress={addEntry}>
                <LinearGradient colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} style={StyleSheet.absoluteFill} />
                <MetallicText style={styles.submitBtnText} variant="gold">Seal Reflection</MetallicText>
              </Pressable>
            )}
          </VelvetGlassSurface>

          {/* History */}
          {entries.length > 0 && (
            <View style={styles.historySection}>
              <SectionHeader title="Previous Reflections" icon="journal-outline" />
              {entries.slice(0, 10).map(e => (
                <VelvetGlassSurface key={e.id} style={styles.entryCard} intensity={20}>
                   <Text style={styles.entryDate}>{new Date(e.date).toLocaleDateString()}</Text>
                   <Text style={styles.entryNote}>{e.note}</Text>
                </VelvetGlassSurface>
              ))}
            </View>
          )}

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
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 }}>
      <MetallicIcon name={icon as any} size={16} variant="gold" />
      <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  header: { paddingHorizontal: 24, paddingTop: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { color: '#FFF', fontSize: 30, marginTop: -4 },
  titleArea: { paddingHorizontal: 24, marginVertical: 32 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  
  summaryCard: { borderRadius: 24, padding: 24, marginBottom: 32, overflow: 'hidden' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  summaryTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  
  gravityBarContainer: { height: 6, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 16 },
  gravitySegment: { height: '100%' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },

  formCard: { borderRadius: 24, padding: 24, marginBottom: 32, overflow: 'hidden' },
  noteInput: { minHeight: 100, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', padding: 20, color: '#FFF', fontSize: 16, marginBottom: 24 },
  tagSectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
  
  tagCategoryGroup: { marginBottom: 12, borderRadius: 16, padding: 16, backgroundColor: 'rgba(255,255,255,0.03)' },
  tagCategoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagCategoryDot: { fontSize: 8 },
  tagCategoryLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  tagRailContent: { gap: 8, paddingTop: 16 },
  
  patternTag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  patternTagUnselected: { backgroundColor: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.05)' },
  patternTagText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  
  submitBtn: { height: 56, borderRadius: 28, marginTop: 24, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  submitBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  historySection: { gap: 12 },
  entryCard: { padding: 20, borderRadius: 20, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  entryDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginBottom: 8 },
  entryNote: { fontSize: 14, color: '#FFF', lineHeight: 20 },
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },
});
