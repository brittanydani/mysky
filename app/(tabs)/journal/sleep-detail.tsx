/**
 * File: app/(tabs)/journal/sleep-detail.tsx
 * Full-Featured Sleep Detail Screen
 *
 * Deep-dive view for reading back a sleep entry, adding a dream narrative,
 * and accessing AI symbolic interpretation (premium).
 * Navigate to this screen via router.push('/(tabs)/journal/sleep-detail').
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';
import { Sparkles, ChevronLeft, Moon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MetallicText } from '../../../components/ui/MetallicText';
import { MetallicLucideIcon } from '../../../components/ui/MetallicLucideIcon';
import SkiaMetallicPill from '../../../components/ui/SkiaMetallicPill';

import { localDb } from '../../../services/storage/localDb';
import { SleepEntry, generateId } from '../../../services/storage/models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePremium } from '../../../context/PremiumContext';
import { useAuth } from '../../../context/AuthContext';
import { logger } from '../../../utils/logger';
import { parseLocalDate } from '../../../utils/dateUtils';
import { generateDreamInterpretation } from '../../../services/premium/dreamInterpretation';
import {
  generateGeminiDreamInterpretation,
  isGeminiAvailable,
  GeminiDreamResult,
} from '../../../services/premium/geminiDreamInterpretation';
import { computeDreamAggregates, computeDreamPatterns } from '../../../services/premium/dreamAggregates';
import { SkiaDynamicCosmos } from '../../../components/ui/SkiaDynamicCosmos';
import {
  DreamInterpretation,
  DreamMetadata,
  SelectedFeeling,
} from '../../../services/premium/dreamTypes';

const QUALITY_LABELS = ['Exhausted', 'Restless', 'Neutral', 'Restored', 'Deeply Vibrant'];
const DREAM_TEXT_MAX_LENGTH = 10000;

const DEFAULT_METADATA: DreamMetadata = {
  vividness: 3,
  lucidity: 1,
  controlLevel: 3,
  awakenState: 'calm',
  recurring: false,
};

export default function SleepDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { isPremium } = usePremium();
  const { session } = useAuth();
  const canUseGemini = isGeminiAvailable(Boolean(session?.access_token));

  const [entry, setEntry] = useState<SleepEntry | null>(null);
  const [allEntries, setAllEntries] = useState<SleepEntry[]>([]);
  const [dreamText, setDreamText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [interpretation, setInterpretation] = useState<DreamInterpretation | null>(null);
  const [interpreting, setInterpreting] = useState(false);
  const [reinterpretCount, setReinterpretCount] = useState(0);
  const [hasReinterpreted, setHasReinterpreted] = useState(false);

  // Gemini AI state
  const [aiResult, setAiResult] = useState<GeminiDreamResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (isPremium && reinterpretCount > 0 && entry && dreamText.trim()) {
      void runInterpretation(entry, dreamText, allEntries);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reinterpretCount]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        void loadEntry(id);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  const loadEntry = async (entryId: string) => {
    try {
      const charts = await localDb.getCharts();
      if (!charts.length) return;
      const entries = await localDb.getSleepEntries(charts[0].id, 90);
      setAllEntries(entries);
      const found = entries.find((e) => e.id === entryId);
      if (found) {
        setEntry(found);
        setDreamText(found.dreamText ?? '');
        // Restore persisted reinterpret flag
        const used = await AsyncStorage.getItem(`msky_reinterpreted_${entryId}`);
        if (used === '1') setHasReinterpreted(true);
        // Auto-generate interpretation if entry already has dream text
        if (isPremium && found.dreamText) {
          void runInterpretation(found, found.dreamText, entries);
        }
      }
    } catch (e) {
      logger.error('[SleepDetail] Failed to load entry:', e);
    } finally {
      setLoading(false);
    }
  };

  const runInterpretation = async (
    target: SleepEntry,
    text: string,
    entries: SleepEntry[],
  ) => {
    try {
      setInterpreting(true);
      let feelings: SelectedFeeling[] = [];
      let metadata: DreamMetadata = DEFAULT_METADATA;
      if (target.dreamFeelings) {
        try { feelings = JSON.parse(target.dreamFeelings); } catch {}
      }
      if (target.dreamMetadata) {
        try { metadata = JSON.parse(target.dreamMetadata); } catch {}
      }
      const aggregates = computeDreamAggregates(feelings, null);
      const otherEntries = entries.filter((e) => e.id !== target.id);
      const patterns = computeDreamPatterns(feelings, otherEntries);
      const result = generateDreamInterpretation({
        entry: target,
        dreamText: text,
        feelings,
        metadata,
        aggregates,
        patterns,
        seedSuffix: reinterpretCount > 0 ? String(reinterpretCount) : undefined,
      });
      setInterpretation(result);
      // Auto-trigger Gemini AI interpretation for premium users
      if (isPremium && canUseGemini) {
        setAiLoading(true);
        setAiError(null);
        generateGeminiDreamInterpretation({
          dreamText: text,
          feelings,
          onDeviceSummary: result.paragraph,
          symbols: result.extractedSymbols,
          interpretiveThemes: result.interpretiveThemes,
          patternAnalysis: result.patternAnalysis ? {
            primaryPattern: result.patternAnalysis.primaryPattern,
            undercurrentLabel: result.patternAnalysis.undercurrentLabel,
            endingType: result.patternAnalysis.endingType,
          } : undefined,
        }).then(aiRes => {
          setAiResult(aiRes);
        }).catch(e => {
          const msg = e.message ?? 'AI interpretation failed';
          const isAuthError = msg.includes('sign-in') || msg.includes('Sign in');
          if (isAuthError) {
            logger.warn('[SleepDetail] AI interpretation skipped (no active session)');
          } else {
            logger.error('[SleepDetail] Auto AI interpretation failed:', e);
          }
          setAiError(msg);
        }).finally(() => setAiLoading(false));
      }
    } catch (e) {
      logger.error('[SleepDetail] Interpretation failed:', e);
    } finally {
      setInterpreting(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    try {
      let saved: SleepEntry;
      if (entry) {
        const now = new Date().toISOString();
        saved = { ...entry, dreamText, updatedAt: now };
        await localDb.saveSleepEntry(saved);
        setEntry(saved);
      } else {
        const charts = await localDb.getCharts();
        if (!charts.length) {
          logger.warn('[SleepDetail] No chart found — entry not saved');
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        // Check for existing entry on this date to avoid duplicates
        const existing = await localDb.getSleepEntryByDate(charts[0].id, dateStr);
        if (existing) {
          saved = { ...existing, dreamText, updatedAt: now.toISOString() };
        } else {
          saved = {
            id: generateId(),
            chartId: charts[0].id,
            date: dateStr,
            dreamText,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            isDeleted: false,
          };
        }
        await localDb.saveSleepEntry(saved);
        setEntry(saved);
      }

      // Generate interpretation after a successful save when there's dream text
      if (isPremium && dreamText.trim().length > 0) {
        const refreshedEntries = allEntries.map((e) => e.id === saved.id ? saved : e);
        if (!allEntries.find((e) => e.id === saved.id)) {
          refreshedEntries.push(saved);
        }
        setAllEntries(refreshedEntries);
        void runInterpretation(saved, dreamText, refreshedEntries);
      }
    } catch (e) {
      logger.error('[SleepDetail] Failed to save entry:', e);
      Alert.alert('Save Error', 'Could not save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#C9AE78" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SkiaDynamicCosmos />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft color="#FFF" size={26} />
        </Pressable>
        <View style={styles.saveBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headerTitle}>Dream Record</Text>

        {/* Dream card — matching Archive DreamCard layout exactly */}
        <LinearGradient
          colors={['rgba(201,174,120,0.18)', 'transparent']}
          style={styles.card}
        >
          {entry && (
            <View style={styles.dreamCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dreamCardDate}>
                  {parseLocalDate(entry.date).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric',
                  }).toUpperCase()}
                </Text>
                {(!!entry.quality || !!entry.durationHours) && (
                  <View style={styles.dreamMeta}>
                    {!!entry.quality && (
                      <MetallicText color="#C9AE78" style={styles.dreamMoons}>
                        {'☽'.repeat(entry.quality)}
                      </MetallicText>
                    )}
                    {!!entry.quality && (
                      <MetallicText color="#C9AE78" style={styles.dreamQualityLabel}>
                        {QUALITY_LABELS[(entry.quality ?? 1) - 1]}
                      </MetallicText>
                    )}
                    {!!entry.durationHours && (
                      <Text style={styles.dreamDuration}> · {entry.durationHours}h</Text>
                    )}
                  </View>
                )}
              </View>
              <MetallicLucideIcon icon={Moon} color="#C9AE78" size={16} />
            </View>
          )}
          {dreamText.trim() ? (
            <Text style={styles.dreamExcerpt}>{dreamText}</Text>
          ) : (
            <Text style={styles.dreamNone}>No dream recalled</Text>
          )}
        </LinearGradient>

        {/* Premium AI section */}
        <LinearGradient
          colors={['rgba(201,174,120,0.18)', 'transparent']}
          style={[styles.premiumSection, !isPremium && styles.lockedSection]}
        >
          <MetallicLucideIcon icon={Sparkles} color="#C9AE78" size={20} />
          <MetallicText color="#C9AE78" style={styles.premiumTitle}>Symbolic Interpretation</MetallicText>
          {isPremium ? (
            interpreting ? (
              <ActivityIndicator color="#C9AE78" style={{ marginTop: 8 }} />
            ) : interpretation ? (
              <View style={{ gap: 16, width: '100%' }}>
                {/* Show AI result as primary when available, on-device as fallback */}
                {aiResult ? (
                  <>
                    <Text style={styles.interpretationParagraph}>{aiResult.paragraph}</Text>
                    <MetallicText color="#C9AE78" style={styles.reflectionQuestion}>{aiResult.question}</MetallicText>
                  </>
                ) : aiLoading ? (
                  <>
                    <Text style={styles.interpretationParagraph}>{interpretation.paragraph}</Text>
                    <MetallicText color="#C9AE78" style={styles.reflectionQuestion}>{interpretation.question}</MetallicText>
                    <View style={styles.aiLoadingRow}>
                      <ActivityIndicator color="#C9AE78" size="small" />
                      <Text style={styles.aiLoadingText}>Consulting the cosmos...</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.interpretationParagraph}>{interpretation.paragraph}</Text>
                    <MetallicText color="#C9AE78" style={styles.reflectionQuestion}>{interpretation.question}</MetallicText>
                    {aiError && (
                      <Text style={styles.aiErrorText}>{aiError}</Text>
                    )}
                  </>
                )}
                <Pressable
                  style={[styles.rerunBtn, hasReinterpreted && { opacity: 0.4 }]}
                  onPress={() => {
                    if (hasReinterpreted) return;
                    if (entry && dreamText.trim()) {
                      setAiResult(null);
                      setAiError(null);
                      setHasReinterpreted(true);
                      void AsyncStorage.setItem(`msky_reinterpreted_${entry.id}`, '1');
                      setReinterpretCount(c => c + 1);
                    }
                  }}
                >
                  <MetallicText color="#C9AE78" style={styles.rerunBtnText}>RE-INTERPRET</MetallicText>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.premiumBody}>
                Save your dream narrative above to generate your interpretation.
              </Text>
            )
          ) : (
            <>
              <Text style={styles.premiumBody}>
                Unlock deep symbolic analysis of your dream patterns.
              </Text>
              <SkiaMetallicPill
                label="UPGRADE TO DEEPER SKY"
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.push('/(tabs)/premium' as Href);
                }}
                height={44}
                borderRadius={20}
                labelStyle={{ fontWeight: '800', fontSize: 11, letterSpacing: 1.5 }}
              />
            </>
          )}
        </LinearGradient>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020817' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 34, color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.5, marginBottom: 4,
  },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  scrollPadding: { padding: 24, paddingTop: 8 },

  card: {
    borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 24,
  },
  dreamCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12,
  },
  dreamCardDate: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4,
  },
  dreamMeta: { flexDirection: 'row', alignItems: 'center' },
  dreamMoons: { fontSize: 14, color: '#C9AE78', letterSpacing: 1 },
  dreamQualityLabel: {
    fontSize: 12, color: 'rgba(201,174,120,0.7)', textTransform: 'uppercase',
    letterSpacing: 0.8, fontWeight: '600', marginLeft: 6,
  },
  dreamDuration: { fontSize: 12, color: 'rgba(226,232,240,0.45)' },
  dreamExcerpt: {
    fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 26,
  },
  dreamNone: { fontSize: 16, color: 'rgba(226,232,240,0.45)' },
  fullInput: {
    color: '#FFF', fontSize: 16,
    lineHeight: 26, textAlignVertical: 'top', minHeight: 250,
  },
  fullInputReadOnly: {
    color: 'rgba(255,255,255,0.85)', fontSize: 16,
    lineHeight: 26, minHeight: 80,
  },
  fullInputPlaceholder: {
    color: 'rgba(255,255,255,0.25)', fontSize: 15,
    lineHeight: 24, fontStyle: 'italic',
  },

  premiumSection: {
    alignItems: 'center', padding: 32, borderRadius: 24,
    borderWidth: 1, borderColor: '#C9AE78', gap: 12,
  },
  lockedSection: { borderStyle: 'dashed' },
  premiumTitle: {
    color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center',
  },
  premiumBody: {
    color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 20,
  },


  interpretationParagraph: {
    color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 24,
  },
  reflectionQuestion: {
    color: '#FFFFFF', fontSize: 14,
    lineHeight: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(201,174,120,0.2)',
    paddingTop: 16, marginTop: 4,
  },
  rerunBtn: {
    alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(217,191,140,0.3)',
  },
  rerunBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  // AI Gemini interpretation
  aiSection: { marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(217,191,140,0.2)', width: '100%' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: 'rgba(217,191,140,0.08)', borderWidth: 1, borderColor: 'rgba(217,191,140,0.25)' },
  aiBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  aiLoadingText: { fontSize: 13, color: 'rgba(255,255,255,0.4)',  },
  aiErrorText: { fontSize: 13, color: '#CD7F5D', textAlign: 'center', paddingVertical: 8 },
  aiResultBox: { marginTop: 4, width: '100%' },
  aiResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiResultLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
});
