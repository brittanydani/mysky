// File: app/relationship-patterns.tsx
// MySky — Relational Mirror
//
// Updated to "Lunar Sky" & "Smoked Glass" Aesthetic:
// 1. Purged "goldenish" mud from visualization and submit buttons.
// 2. Implemented "Midnight Slate" for the Relational Gravity anchor card.
// 3. Implemented "Tactile Hardware" pattern tags (Recessed Void vs. Icy Glow).
// 4. Mapped attachment styles to Lunar Sky semantic washes (Nebula, Stratosphere, Ember, Sage).
// 5. Integrated "Velvet Glass" 1px directional light-catch borders.

import * as React from 'react';
const { useCallback, useState, useMemo } = React;
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
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
  const { isPremium } = usePremium();
  
  const [entries, setEntries] = useState<PatternEntry[]>([]);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
    try {
      await addRelationshipPattern(newEntry);
    } catch (e) {
      logger.error('[RelationshipPatterns] Failed to save entry', e);
      setEntries(entries);
      return;
    }
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
            <MetallicIcon name="chevron-back-outline" size={22} variant="gold" />
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
                    Unlock a personalised read of what your relational gravity pattern actually means for how you connect.
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
              placeholder="What played out today? Describe the dynamic..."
              placeholderTextColor={theme.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
              multiline value={note} onChangeText={setNote}
            />

            <Text style={styles.tagSectionLabel}>SELECT ACTIVE PATTERNS</Text>

            {(['anxious', 'avoidant', 'control', 'secure'] as PatternCategory[]).map((cat) => {
              const { color } = getSemanticWashes(cat);
              const isExpanded = expandedCategory === cat;
              const tags = allTags.filter(t => t.category === cat);
              
              const pillItems: EditorialPillItem[] = tags.map(tag => ({
                key: tag.id,
                label: tag.label,
                selected: selectedTags.includes(tag.id),
                onPress: () => setSelectedTags(prev => 
                  prev.includes(tag.id) ? prev.filter(i => i !== tag.id) : [...prev, tag.id]
                ),
                accentColor: color,
                selectedBackgroundColor: `${color}15`,
                selectedTextColor: theme.textPrimary,
              }));

              return (
                <View key={cat} style={[styles.tagCategoryGroup, theme.velvetBorder]}>
                  <Pressable style={styles.tagCategoryHeader} onPress={() => setExpandedCategory(isExpanded ? null : cat)}>
                    <Text style={[styles.tagCategoryDot, { color }]}>◆</Text>
                    <Text style={styles.tagCategoryLabel}>{cat.toUpperCase()}</Text>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={color} style={{ marginLeft: 'auto' }} />
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
              {entries.map(e => (
                <View key={e.id}>
                  <VelvetGlassSurface style={styles.entryCard as any} intensity={20}>
                     <Text style={styles.entryDate}>{new Date(e.date).toLocaleDateString()}</Text>
                     <Text style={styles.entryNote}>{e.note}</Text>
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
  noteInput: { minHeight: 120, borderRadius: 24, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', padding: 20, paddingTop: 20, color: theme.textPrimary, fontSize: 16, marginBottom: 24 },
  tagSectionLabel: { fontSize: 10, color: theme.textMuted, fontWeight: '800', letterSpacing: 1.5, marginBottom: 16 },
  
  tagCategoryGroup: { marginBottom: 12, borderRadius: 20, padding: 16, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' },
  tagCategoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagCategoryDot: { fontSize: 8 },
  tagCategoryLabel: { fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 1 },
  tagRailContent: { paddingTop: 16 },
  
  submitBtn: { height: 56, borderRadius: 28, marginTop: 24, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  submitBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },

  historySection: { gap: 12 },
  entryCard: { padding: 20, borderRadius: 20, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  entryDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginBottom: 8 },
  entryNote: { fontSize: 14, color: theme.textPrimary, lineHeight: 20 },
  glowOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },
});
