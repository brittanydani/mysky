/**
 * File: app/(tabs)/journal/sleep-detail.tsx
 * Full-Featured Sleep Detail Screen
 *
 * Deep-dive view for reading back a sleep entry, adding a dream narrative,
 * and accessing AI dream interpretation with a premium model upgrade.
 * Navigate to this screen via router.push('/(tabs)/journal/sleep-detail').
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';
import { Sparkles, ChevronLeft, Moon } from 'lucide-react-native';
import { SkiaGradient as LinearGradient } from '../../../components/ui/SkiaGradient';
import { MetallicText } from '../../../components/ui/MetallicText';
import { MetallicLucideIcon } from '../../../components/ui/MetallicLucideIcon';
import SkiaMetallicPill from '../../../components/ui/SkiaMetallicPill';

import { supabaseDb } from '../../../services/storage/supabaseDb';
import { isDecryptionFailure } from '../../../services/storage/fieldEncryption';
import { SleepEntry } from '../../../services/storage/models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePremium } from '../../../context/PremiumContext';
import { useAuth } from '../../../context/AuthContext';
import { getDreamReinterpretPerDreamLimit } from '../../../constants/config';
import { logger } from '../../../utils/logger';
import { parseLocalDate } from '../../../utils/dateUtils';
import { generateDreamInterpretation } from '../../../services/premium/dreamInterpretation';
import {
  generateGeminiDreamInterpretation,
  isGeminiAvailable,
  isExpectedGeminiDreamError,
  GeminiDreamResult,
} from '../../../services/premium/geminiDreamInterpretation';
import { computeDreamAggregates, computeDreamPatterns } from '../../../services/premium/dreamAggregates';
import { SkiaDynamicCosmos } from '../../../components/ui/SkiaDynamicCosmos';
import {
  DreamInterpretation,
  DreamMetadata,
  SelectedFeeling,
} from '../../../services/premium/dreamTypes';
import type { AppTheme } from '../../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../../context/ThemeContext';

const QUALITY_LABELS = ['Exhausted', 'Restless', 'Neutral', 'Restored', 'Deeply Vibrant'];
const DEFAULT_METADATA: DreamMetadata = {
  vividness: 3,
  lucidity: 1,
  controlLevel: 3,
  awakenState: 'calm',
  recurring: false,
};

const DREAM_REINTERPRET_KEY_PREFIX = '@mysky:dream_reinterpret';

function getDreamReinterpretKey(dreamId?: string | null, userId?: string | null): string {
  return `${DREAM_REINTERPRET_KEY_PREFIX}:${userId ?? 'anon'}:${dreamId ?? 'unknown'}`;
}

export default function SleepDetailScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { isPremium } = usePremium();
  const { session, user } = useAuth();
  const canUseGemini = isGeminiAvailable(Boolean(session?.access_token));
  const perDreamReinterpretLimit = getDreamReinterpretPerDreamLimit(user?.email);

  const [entry, setEntry] = useState<SleepEntry | null>(null);
  const [allEntries, setAllEntries] = useState<SleepEntry[]>([]);
  const [dreamText, setDreamText] = useState('');
  const [loading, setLoading] = useState(!!id);
  const [interpretation, setInterpretation] = useState<DreamInterpretation | null>(null);
  const [interpreting, setInterpreting] = useState(false);
  const [reinterpretCount, setReinterpretCount] = useState(0);
  const [dreamReinterpretUsedCount, setDreamReinterpretUsedCount] = useState(0);

  // Gemini AI state
  const [aiResult, setAiResult] = useState<GeminiDreamResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (reinterpretCount > 0 && entry && dreamText.trim()) {
      void runInterpretation(entry, dreamText, allEntries);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reinterpretCount]);

  const hasReachedDreamReinterpretLimit = dreamReinterpretUsedCount >= perDreamReinterpretLimit;
  const remainingReinterprets = Math.max(0, perDreamReinterpretLimit - dreamReinterpretUsedCount);

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
      const charts = await supabaseDb.getCharts();
      if (!charts.length) return;
      const entries = await supabaseDb.getSleepEntries(charts[0].id, 90);
      setAllEntries(entries);
      const found = entries.find((e) => e.id === entryId);
      if (found) {
        setEntry(found);
        const savedText = found.dreamText?.trim() || found.notes?.trim() || '';
        setDreamText(savedText);
        const dreamKey = getDreamReinterpretKey(found.id, user?.id);
        const used = await AsyncStorage.getItem(dreamKey);
        const parsedUsed = Number.parseInt(used ?? '0', 10);
        setDreamReinterpretUsedCount(Number.isFinite(parsedUsed) ? parsedUsed : 0);
        // Auto-generate interpretation if entry already has dream text
        if (savedText && !isDecryptionFailure(savedText)) {
          void runInterpretation(found, savedText, entries);
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
      // Auto-trigger Gemini AI interpretation for all signed-in users.
      if (canUseGemini) {
        setAiLoading(true);
        setAiError(null);
        generateGeminiDreamInterpretation({
          dreamText: text,
          feelings,
          modelTier: isPremium ? 'premium' : 'free',
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
          const msg = e instanceof Error ? e.message : 'AI interpretation failed';
          if (isExpectedGeminiDreamError(e)) {
            logger.warn('[SleepDetail] Auto AI interpretation unavailable:', msg);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft color={theme.textPrimary} size={26} />
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
          colors={theme.isDark ? ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.03)'] : ['rgba(162, 194, 225, 0.18)', 'transparent']}
          style={[styles.card, theme.isDark && styles.cardDark]}
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
                      <MetallicText color="#D4AF37" style={styles.dreamMoons}>
                        {'☽'.repeat(entry.quality)}
                      </MetallicText>
                    )}
                    {!!entry.quality && (
                      <MetallicText color="#D4AF37" style={styles.dreamQualityLabel}>
                        {QUALITY_LABELS[(entry.quality ?? 1) - 1]}
                      </MetallicText>
                    )}
                    {!!entry.durationHours && (
                      <Text style={styles.dreamDuration}> · {entry.durationHours}h</Text>
                    )}
                  </View>
                )}
              </View>
              <MetallicLucideIcon icon={Moon} color="#D4AF37" size={16} />
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
          colors={theme.isDark ? ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.03)'] : ['rgba(162, 194, 225, 0.18)', 'transparent']}
          style={[styles.premiumSection, theme.isDark && styles.premiumSectionDark]}
        >
          <MetallicLucideIcon icon={Sparkles} color="#D4AF37" size={20} />
          <MetallicText color="#D4AF37" style={styles.premiumTitle}>AI Dream Interpretation</MetallicText>
          <Text style={styles.modelHint}>
            {isPremium
              ? 'Deeper Sky uses a richer Gemini model for dream readings.'
              : 'Free accounts use a faster Gemini model. Deeper Sky upgrades the depth and nuance.'}
          </Text>
          {interpreting ? (
            <ActivityIndicator color="#D4AF37" style={{ marginTop: 8 }} />
          ) : interpretation ? (
            <View style={{ gap: 16, width: '100%' }}>
              {aiResult ? (
                <>
                  <Text style={styles.interpretationParagraph}>{aiResult.paragraph}</Text>
                  <MetallicText color="#D4AF37" style={styles.reflectionQuestion}>{aiResult.question}</MetallicText>
                </>
              ) : aiLoading ? (
                <>
                  <Text style={styles.interpretationParagraph}>{interpretation.paragraph}</Text>
                  <MetallicText color="#D4AF37" style={styles.reflectionQuestion}>{interpretation.question}</MetallicText>
                  <View style={styles.aiLoadingRow}>
                    <ActivityIndicator color="#D4AF37" size="small" />
                    <Text style={styles.aiLoadingText}>Consulting Gemini...</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.interpretationParagraph}>{interpretation.paragraph}</Text>
                  <MetallicText color="#D4AF37" style={styles.reflectionQuestion}>{interpretation.question}</MetallicText>
                  {aiError && (
                    <Text style={styles.aiErrorText}>{aiError}</Text>
                  )}
                </>
              )}
              <Pressable
                style={[styles.rerunBtn, hasReachedDreamReinterpretLimit && { opacity: 0.4 }]}
                onPress={() => {
                  if (hasReachedDreamReinterpretLimit) return;
                  if (entry && dreamText.trim()) {
                    setAiResult(null);
                    setAiError(null);
                    const nextUsedCount = dreamReinterpretUsedCount + 1;
                    setDreamReinterpretUsedCount(nextUsedCount);
                    void AsyncStorage.setItem(getDreamReinterpretKey(entry.id, user?.id), String(nextUsedCount));
                    setReinterpretCount(c => c + 1);
                  }
                }}
              >
                <MetallicText color="#D4AF37" style={styles.rerunBtnText}>
                  {hasReachedDreamReinterpretLimit ? 'RE-INTERPRET LIMIT REACHED' : 'RE-INTERPRET'}
                </MetallicText>
              </Pressable>
              <Text style={styles.reinterpretHint}>
                {remainingReinterprets === 1
                  ? '1 re-interpret remaining for this dream.'
                  : `${remainingReinterprets} re-interprets remaining for this dream.`}
              </Text>
              {!isPremium && (
                <SkiaMetallicPill
                  label="UPGRADE TO DEEPER SKY MODEL"
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    router.push('/(tabs)/premium' as Href);
                  }}
                  height={44}
                  borderRadius={20}
                  labelStyle={{ fontWeight: '800', fontSize: 11, letterSpacing: 1.5 }}
                />
              )}
            </View>
          ) : (
            <>
              <Text style={styles.premiumBody}>
                Save your dream narrative above to generate an AI interpretation.
              </Text>
              {!isPremium && (
                <SkiaMetallicPill
                  label="UPGRADE TO DEEPER SKY MODEL"
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    router.push('/(tabs)/premium' as Href);
                  }}
                  height={44}
                  borderRadius={20}
                  labelStyle={{ fontWeight: '800', fontSize: 11, letterSpacing: 1.5 }}
                />
              )}
            </>
          )}
        </LinearGradient>
        <View style={{ height: 40 }} />
      </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
    borderWidth: 1, borderColor: theme.cardBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32, color: theme.textPrimary, fontWeight: '800', letterSpacing: -1, marginBottom: 4,
  },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  saveText: { color: theme.textPrimary, fontSize: 14, fontWeight: '600' },
  scrollPadding: { padding: 24, paddingTop: 8 },

  card: {
    borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 24,
  },
  cardDark: {
    borderTopColor: 'rgba(255,255,255,0.15)',
    borderLeftColor: 'rgba(255,255,255,0.06)',
    borderRightColor: 'rgba(255,255,255,0.06)',
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dreamCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12,
  },
  dreamCardDate: {
    fontSize: 12, fontWeight: '600', color: theme.textMuted,
    letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 4,
  },
  dreamMeta: { flexDirection: 'row', alignItems: 'center' },
  dreamMoons: { fontSize: 14, color: '#D4AF37', letterSpacing: 1 },
  dreamQualityLabel: {
    fontSize: 12, color: 'rgba(212, 175, 55,0.7)', textTransform: 'uppercase',
    letterSpacing: 0.8, fontWeight: '600', marginLeft: 6,
  },
  dreamDuration: { fontSize: 12, color: theme.textMuted },
  dreamExcerpt: {
    fontSize: 16, color: theme.textPrimary, lineHeight: 26,
  },
  dreamNone: { fontSize: 16, color: theme.textMuted },
  fullInput: {
    color: theme.textPrimary, fontSize: 16,
    lineHeight: 26, textAlignVertical: 'top', minHeight: 250,
  },
  fullInputReadOnly: {
    color: theme.textPrimary, fontSize: 16,
    lineHeight: 26, minHeight: 80,
  },
  fullInputPlaceholder: {
    color: theme.textMuted, fontSize: 15,
    lineHeight: 24, fontStyle: 'italic',
  },

  premiumSection: {
    alignItems: 'center', padding: 32, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 12,
  },
  premiumSectionDark: {
    borderTopColor: 'rgba(255,255,255,0.12)',
    borderLeftColor: 'rgba(255,255,255,0.06)',
    borderRightColor: 'rgba(255,255,255,0.06)',
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  premiumTitle: {
    color: theme.textPrimary, fontSize: 16, fontWeight: '600', textAlign: 'center',
  },
  modelHint: {
    color: theme.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 19,
  },
  premiumBody: {
    color: theme.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20,
  },


  interpretationParagraph: {
    color: theme.textSecondary, fontSize: 15, lineHeight: 24,
  },
  reflectionQuestion: {
    color: theme.textPrimary, fontSize: 14,
    lineHeight: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(212, 175, 55,0.2)',
    paddingTop: 16, marginTop: 4,
  },
  rerunBtn: {
    alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212, 175, 55,0.3)',
  },
  rerunBtnText: { color: theme.textPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  reinterpretHint: { color: theme.textMuted, fontSize: 12, textAlign: 'right' },

  // AI Gemini interpretation
  aiSection: { marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(212, 175, 55,0.2)', width: '100%' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: 'rgba(212, 175, 55,0.08)', borderWidth: 1, borderColor: 'rgba(212, 175, 55,0.25)' },
  aiBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  aiLoadingText: { fontSize: 13, color: theme.textMuted,  },
  aiErrorText: { fontSize: 13, color: '#CD7F5D', textAlign: 'center', paddingVertical: 8 },
  aiResultBox: { marginTop: 4, width: '100%' },
  aiResultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiResultLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
});
