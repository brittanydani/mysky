/**
 * File: app/(tabs)/inner-tensions.tsx
 * MySky — Inner Tensions
 *
 * Surfaces the psychological friction that lives beneath the surface:
 * competing nervous system states, ambivalent emotional pairs, recurring
 * dream patterns, and active shadow triggers.
 *
 * Free tier:   Nervous System Tension card (NS conflict score + competing states)
 * Premium:     NS Branch Map (radar), Ambivalence Patterns, Dream Patterns,
 *              Trigger Reflections
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { ChevronDown, ChevronLeft, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PremiumGate } from '../../components/ui/PremiumGate';
import {
  Canvas,
  LinearGradient as SkiaLinearGradient,
  Path as SkiaPath,
  Shadow,
  Skia,
  vec,
} from '@shopify/react-native-skia';

import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { MetallicLucideIcon } from '../../components/ui/MetallicLucideIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { PsychologicalForcesRadar } from '../../components/ui/PsychologicalForcesRadar';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';
import { supabaseDb } from '../../services/storage/supabaseDb';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import type { TriggerEvent } from '../../utils/triggerEventTypes';
import {
  computeInnerTensions,
  type InnerTensionsData,
  NS_STATE_FULL_LABELS,
  NS_STATE_DESCRIPTIONS,
  NS_BRANCH_COLORS,
  TRIGGER_DISPLAY,
} from '../../services/premium/innerTensionsEngine';
import { getTriggerReflectionQuestion, getTriggerTaxonomy } from '../../services/premium/triggerTaxonomy';
import type { NervousSystemBranch, ShadowTrigger } from '../../services/premium/dreamTypes';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = {
  gold:        '#D4AF37',
  rose:        '#D4A3B3',
  sage:        '#8CBEAA',
  lavender:    '#A89BC8',
  coral:       '#D4826A',
  textMain:    '#FFFFFF',
  textMuted:   'rgba(226,232,240,0.72)',
  textDim:     'rgba(255,255,255,0.62)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassBg:     'rgba(255,255,255,0.04)',
  lockBg:      'rgba(20,15,30,0.85)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function conflictInterpretation(
  score: number,
  states: NervousSystemBranch[],
): string {
  if (states.length < 2) return 'Your nervous system shows a single dominant state.';
  const a = NS_STATE_FULL_LABELS[states[0]];
  const b = NS_STATE_FULL_LABELS[states[1]];
  if (score > 0.75) return `High tension — ${a} and ${b} are pulling against each other simultaneously.`;
  if (score > 0.45) return `Moderate pull between ${a} and ${b}. One pushes while the other resists.`;
  return `${a} is dominant, with ${b} present but secondary.`;
}

function conflictScoreColor(score: number): string {
  if (score > 0.75) return PALETTE.coral;
  if (score > 0.45) return PALETTE.gold;
  return PALETTE.sage;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  const styles = useThemedStyles(createStyles);

  return (
    <Text style={styles.sectionLabel}>{children.toUpperCase()}</Text>
  );
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();

  return (
    <VelvetGlassSurface
      style={[styles.glassCard, style]}
      intensity={45}
      backgroundColor={theme.isDark ? 'rgba(11, 15, 25, 0.34)' : 'rgba(255, 255, 255, 0.72)'}
      borderColor="rgba(255,255,255,0.10)"
      highlightColor="rgba(255,255,255,0.05)"
    >
      {children}
    </VelvetGlassSurface>
  );
}

function CircularConflictGauge({ score, color }: { score: number; color: string }) {
  const styles = useThemedStyles(createStyles);
  const pct = Math.max(4, Math.round(score * 100));
  const size = 120;
  const strokeWidth = 11;
  const startAngle = 135;
  const sweepAngle = 270;
  const rect = useMemo(
    () => ({
      x: strokeWidth / 2,
      y: strokeWidth / 2,
      width: size - strokeWidth,
      height: size - strokeWidth,
    }),
    [size, strokeWidth],
  );

  const trackPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(rect, startAngle, sweepAngle);
    return path;
  }, [rect, startAngle, sweepAngle]);

  const valuePath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(rect, startAngle, sweepAngle * Math.max(0.04, Math.min(score, 1)));
    return path;
  }, [rect, score, startAngle, sweepAngle]);

  return (
    <View style={styles.conflictGaugeWrap}>
      <Canvas style={styles.conflictGaugeCanvas}>
        <SkiaPath path={trackPath} style="stroke" strokeWidth={strokeWidth} strokeCap="round" color="rgba(255,255,255,0.08)" />
        <SkiaPath path={valuePath} style="stroke" strokeWidth={strokeWidth} strokeCap="round">
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(size, size)}
            colors={['#F2D27A', color]}
          />
          <Shadow dx={0} dy={0} blur={18} color="#D4AF37" />
        </SkiaPath>
      </Canvas>
      <View style={styles.conflictGaugeCenter}>
        <Text style={[styles.conflictGaugeNumber, { color }]}>{pct}</Text>
        <Text style={styles.conflictGaugeUnit}>/100</Text>
      </View>
    </View>
  );
}

function TugOfWarBar({
  profile,
  states,
}: {
  profile: InnerTensionsData['nsProfile'];
  states: [NervousSystemBranch, NervousSystemBranch];
}) {
  const styles = useThemedStyles(createStyles);
  const [leftState, rightState] = states;
  const leftValue = profile[leftState] ?? 0;
  const rightValue = profile[rightState] ?? 0;
  const total = leftValue + rightValue;
  const leftPct = total > 0 ? (leftValue / total) * 100 : 50;
  const rightPct = 100 - leftPct;

  return (
    <View style={styles.tugWrap}>
      <View style={styles.tugHeader}>
        <Text style={[styles.tugLabel, { color: NS_BRANCH_COLORS[leftState] }]}>{NS_STATE_FULL_LABELS[leftState]}</Text>
        <Text style={styles.tugHint}>State distribution</Text>
        <Text style={[styles.tugLabel, { color: NS_BRANCH_COLORS[rightState] }]}>{NS_STATE_FULL_LABELS[rightState]}</Text>
      </View>
      <View style={styles.tugTrack}>
        <View style={[styles.tugFillLeft, { width: `${leftPct}%`, backgroundColor: NS_BRANCH_COLORS[leftState] }]} />
        <View style={[styles.tugFillRight, { width: `${rightPct}%`, backgroundColor: NS_BRANCH_COLORS[rightState] }]} />
      </View>
      <View style={styles.tugValues}>
        <Text style={styles.tugValue}>{Math.round(leftPct)}%</Text>
        <Text style={styles.tugValue}>{Math.round(rightPct)}%</Text>
      </View>
    </View>
  );
}

function NSConflictCard({ data }: { data: InnerTensionsData }) {
  const styles = useThemedStyles(createStyles);
  const { nsConflict, dataQuality } = data;
  const hasData = dataQuality.entriesWithFeelings > 0;
  const scoreColor = conflictScoreColor(nsConflict.conflictScore);
  const [stateA, stateB] = nsConflict.dominantStates as [NervousSystemBranch, NervousSystemBranch];

  if (!hasData) {
    return (
      <GlassCard>
        <Text style={styles.cardTitle}>Nervous System Shifts</Text>
        <Text style={styles.emptyStateText}>
          Your tension map grows as you log dreams and journal entries. Add feelings to a sleep entry or write a journal reflection to activate this view.
        </Text>
        <View style={styles.seedChip}>
          <MetallicText style={styles.seedChipText} color={PALETTE.gold}>Log a dream or journal entry to begin</MetallicText>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Text style={styles.cardTitle}>Overall Conflict Load</Text>
      <Text style={styles.cardSubtitle}>
        A single read on how much inner friction your recent entries are carrying.
      </Text>

      <View style={styles.conflictScoreRow}>
        <CircularConflictGauge score={nsConflict.conflictScore} color={scoreColor} />
        <View style={styles.conflictScoreRight}>
          <MetallicText style={styles.conflictScoreLabel} color={scoreColor}>
            {nsConflict.conflictScore > 0.75 ? 'High Internal Friction'
              : nsConflict.conflictScore > 0.45 ? 'Moderate Internal Friction'
              : 'Low Internal Friction'}
          </MetallicText>
          <Text style={styles.conflictScoreHint}>
            based on {dataQuality.totalEntries} entr{dataQuality.totalEntries !== 1 ? 'ies' : 'y'} across dreams, journals, and check-ins
          </Text>
          <Text style={styles.conflictGaugeHint}>
            This ring measures overall push-pull load. The bar below shows which direction the tension is leaning.
          </Text>
        </View>
      </View>

      {/* Competing states */}
      {stateA && stateB && (
        <>
          <View style={styles.conflictPairHeader}>
            <Text style={styles.conflictPairLabel}>Most active pairing</Text>
            <Text style={styles.conflictPairHint}>These are the two states showing up most often together.</Text>
          </View>
          <TugOfWarBar profile={data.nsProfile} states={[stateA, stateB]} />
          <View style={styles.conflictStatesRow}>
            <View style={styles.conflictState}>
              <View style={[styles.stateDot, { backgroundColor: NS_BRANCH_COLORS[stateA] }]} />
              <View>
                <MetallicText style={styles.stateName} color={NS_BRANCH_COLORS[stateA]}>
                  {NS_STATE_FULL_LABELS[stateA]}
                </MetallicText>
                <Text style={styles.stateDesc}>{NS_STATE_DESCRIPTIONS[stateA]}</Text>
              </View>
            </View>
            <View style={styles.conflictState}>
              <View style={[styles.stateDot, { backgroundColor: NS_BRANCH_COLORS[stateB] }]} />
              <View>
                <MetallicText style={styles.stateName} color={NS_BRANCH_COLORS[stateB]}>
                  {NS_STATE_FULL_LABELS[stateB]}
                </MetallicText>
                <Text style={styles.stateDesc}>{NS_STATE_DESCRIPTIONS[stateB]}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.conflictInterpretation}>
            {conflictInterpretation(nsConflict.conflictScore, nsConflict.dominantStates as NervousSystemBranch[])}
          </Text>
        </>
      )}
    </GlassCard>
  );
}

function NSBranchMapSection({ data }: { data: InnerTensionsData }) {
  const styles = useThemedStyles(createStyles);

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      <SectionLabel>State Balance</SectionLabel>
      <GlassCard>
        <Text style={styles.cardTitle}>Balance Across States</Text>
        <Text style={styles.cardSubtitle}>
          A separate view of which states are carrying the most weight right now. This is your state mix, not your conflict-load score.
        </Text>
        <View style={styles.radarWrap}>
          <PsychologicalForcesRadar forces={data.nsBranchForces} size={272} />
          <View style={styles.stateBalanceLegend}>
            {data.nsBranchForces.map((force) => (
              <View key={force.label} style={styles.stateBalanceLegendItem}>
                <View style={[styles.stateBalanceLegendDot, { backgroundColor: force.color }]} />
                <Text style={styles.stateBalanceLegendLabel}>{force.label}</Text>
                <Text style={styles.stateBalanceLegendValue}>{Math.round(force.value)}%</Text>
              </View>
            ))}
          </View>
        </View>
        {data.dataQuality.entriesWithFeelings === 0 && (
          <Text style={styles.emptyStateText}>Log dreams with feelings to populate the map.</Text>
        )}
      </GlassCard>
    </Animated.View>
  );
}

function AmbivalenceSection({ data }: { data: InnerTensionsData }) {
  const styles = useThemedStyles(createStyles);
  const { ambivalence } = data;

  return (
    <Animated.View entering={FadeInDown.delay(150).duration(400)}>
      <SectionLabel>Conflicting Pulls</SectionLabel>
      <GlassCard>
        <Text style={styles.cardTitle}>Conflicting Emotional Pairs</Text>
        <Text style={styles.cardSubtitle}>
          Feelings that pull in opposite directions — craving one thing while fearing it.
        </Text>

        {!ambivalence.detected || ambivalence.pairs.length === 0 ? (
          <Text style={styles.emptyStateText}>
            No ambivalent pairs detected yet. These emerge when opposing triggers both score above threshold across multiple dreams.
          </Text>
        ) : (
          ambivalence.pairs.slice(0, 3).map((pair, i) => {
            const labelA = TRIGGER_DISPLAY[pair.positiveTrigger as ShadowTrigger] ?? pair.positiveTrigger;
            const labelB = TRIGGER_DISPLAY[pair.negativeTrigger as ShadowTrigger] ?? pair.negativeTrigger;
            const intensityPct = Math.round(pair.intensity * 100);
            return (
              <View key={i} style={styles.ambivalencePair}>
                <View style={styles.ambivalencePairRow}>
                  <View style={styles.ambivalenceTriggerWrap}>
                    <MetallicText style={styles.ambivalenceTrigger} color={PALETTE.sage}>{labelA}</MetallicText>
                  </View>
                  <Text style={styles.ambivalenceArrow}>↔</Text>
                  <View style={styles.ambivalenceTriggerWrap}>
                    <MetallicText style={styles.ambivalenceTrigger} color={PALETTE.coral}>{labelB}</MetallicText>
                  </View>
                  <View style={styles.ambivalenceIntensityWrap}>
                    <Text style={styles.ambivalenceIntensity}>{intensityPct}%</Text>
                    <Text style={styles.ambivalenceIntensityLabel}>pattern frequency</Text>
                  </View>
                </View>
                <View style={styles.ambivalenceBarBg}>
                  <View style={[styles.ambivalenceBarFill, { width: `${intensityPct}%` }]} />
                </View>
                <Text style={styles.ambivalenceReflection}>
                  {getTriggerReflectionQuestion(pair.positiveTrigger as ShadowTrigger, i + 1)}
                </Text>
              </View>
            );
          })
        )}
      </GlassCard>
    </Animated.View>
  );
}

function DreamPatternsSection({ data }: { data: InnerTensionsData }) {
  const styles = useThemedStyles(createStyles);
  const { dreamPatterns, dataQuality } = data;

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)}>
      <SectionLabel>Active Dream Patterns</SectionLabel>
      <GlassCard>
        <Text style={styles.cardTitle}>Recurring Themes</Text>
        <Text style={styles.cardSubtitle}>
          The psychological patterns appearing most in your recent dreams.
        </Text>

        {dataQuality.entriesWithText === 0 ? (
          <Text style={styles.emptyStateText}>
            Add dream narratives when logging sleep to activate pattern recognition.
          </Text>
        ) : dreamPatterns.length === 0 ? (
          <Text style={styles.emptyStateText}>
            No strong patterns detected yet. Patterns emerge after several entries with dream text.
          </Text>
        ) : (
          <View style={styles.patternGrid}>
            {dreamPatterns.map((p) => (
              <View key={p.pattern} style={styles.patternChip}>
                <LinearGradient
                  colors={['rgba(168,155,200,0.15)', 'rgba(168,155,200,0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.patternChipInner}>
                  <View style={styles.patternChipHeader}>
                    <View style={styles.patternChipTitleWrap}>
                      <Text
                        style={styles.patternChipLabel}
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        minimumFontScale={0.9}
                      >
                        {p.label}
                      </Text>
                    </View>
                      <View style={styles.patternChipBadge}>
                        <Text style={styles.patternChipBadgeCount}>{p.count}</Text>
                        <Text style={styles.patternChipBadgeLabel}>{p.count === 1 ? 'dream' : 'dreams'}</Text>
                      </View>
                  </View>
                  <View style={styles.patternConfidenceBar}>
                    <View style={[styles.patternConfidenceFill, { width: `${Math.round(p.topConfidence * 100)}%` }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

function TriggerReflectionsSection({ data }: { data: InnerTensionsData }) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { topTriggers } = data;
  const [expanded, setExpanded] = useState<ShadowTrigger | null>(null);

  const toggle = (t: ShadowTrigger) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpanded(prev => (prev === t ? null : t));
  };

  return (
    <Animated.View entering={FadeInDown.delay(250).duration(400)}>
      <SectionLabel>What Changed Your Energy</SectionLabel>
      <GlassCard>
        <Text style={styles.cardTitle}>Your Most Active Triggers</Text>
        <Text style={styles.cardSubtitle}>
          Tap a trigger to surface a reflection question drawn from your pattern.
        </Text>

        {topTriggers.length === 0 ? (
          <Text style={styles.emptyStateText}>
            Active triggers appear here once dream feelings accumulate. Keep logging.
          </Text>
        ) : (
          topTriggers.map((item, i) => {
            const label = TRIGGER_DISPLAY[item.trigger];
            const taxonomy = getTriggerTaxonomy(item.trigger);
            const isOpen = expanded === item.trigger;
            const question = getTriggerReflectionQuestion(item.trigger, i);
            const intensityPct = Math.round(item.score * 100);

            return (
              <Pressable
                key={item.trigger}
                onPress={() => toggle(item.trigger)}
                style={[styles.triggerRow, i > 0 && styles.triggerRowSeparated]}
                hitSlop={12}
              >
                <View style={styles.triggerHeader}>
                  <View style={styles.triggerNameRow}>
                    <View style={[styles.triggerDot, { backgroundColor: PALETTE.gold + 'AA' }]} />
                    <Text style={styles.triggerName}>{label}</Text>
                  </View>
                  <View style={styles.triggerIntensityWrap}>
                    <Text style={styles.triggerIntensityText}>{intensityPct}%</Text>
                    {isOpen ? (
                      <ChevronUp size={14} color={theme.textMuted} strokeWidth={1.5} style={styles.triggerChevron} />
                    ) : (
                      <ChevronDown size={14} color={theme.textMuted} strokeWidth={1.5} style={styles.triggerChevron} />
                    )}
                  </View>
                </View>
                <View style={styles.triggerBarBg}>
                  <View style={[styles.triggerBarFill, { width: `${intensityPct}%` }]} />
                </View>
                {isOpen && (
                  <View style={styles.triggerExpanded}>
                    <Text style={styles.triggerDefinition}>{taxonomy.coreDefinition}</Text>
                    <View style={styles.triggerQuestion}>
                      <MetallicText style={styles.triggerQuestionMark} color={PALETTE.gold}>"</MetallicText>
                      <Text style={styles.triggerQuestionText}>{question}</Text>
                      <MetallicText style={styles.triggerQuestionMark} color={PALETTE.gold}>"</MetallicText>
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </GlassCard>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InnerTensionsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { isPremium } = usePremium();
  const [data, setData] = useState<InnerTensionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          const [charts, journalEntries, triggerRaw] = await Promise.all([
            supabaseDb.getCharts(),
            supabaseDb.getJournalEntries(),
            EncryptedAsyncStorage.getItem('@mysky:trigger_events').catch(() => null),
          ]);
          const triggerEvents: TriggerEvent[] = (() => {
            try { return triggerRaw ? JSON.parse(triggerRaw) : []; } catch { return []; }
          })();
          const sleepEntries = charts.length
            ? await supabaseDb.getSleepEntries(charts[0].id, 90)
            : [];
          const checkIns = charts.length
            ? await supabaseDb.getCheckIns(charts[0].id, 120)
            : [];
          if (!cancelled) setData(computeInnerTensions(
            sleepEntries,
            journalEntries.slice(0, 90),
            checkIns,
            triggerEvents.slice(0, 120),
          ));
        } catch (err) {
          logger.error('InnerTensions: failed to load', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, []),
  );

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.replace('/(tabs)/identity' as Href);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Nebula depth — atmospheric glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(110, 140, 180, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(212, 175, 55, 0.06)' }]} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={goBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
            <MetallicLucideIcon icon={ChevronLeft} size={20} color={theme.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.screenTitle}>Inner Tensions</Text>
          <GoldSubtitle style={styles.screenSubtitle}>
            Where your inner forces pull against each other
          </GoldSubtitle>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {loading ? (
            <ActivityIndicator
              style={styles.loader}
              color={PALETTE.gold}
              size="large"
            />
          ) : !data ? (
            <GlassCard style={{ marginTop: 32 }}>
              <Text style={styles.emptyStateText}>
                Save a birth chart to begin building your tension map.
              </Text>
            </GlassCard>
          ) : (
            <>
              {/* ── FREE SECTION ── */}
              <Animated.View entering={FadeInDown.delay(60).duration(400)}>
                <SectionLabel>Nervous System Shifts</SectionLabel>
                <NSConflictCard data={data} />
              </Animated.View>

              {/* ── PREMIUM GATE / SECTIONS ── */}
              {isPremium ? (
                <>
                  <NSBranchMapSection data={data} />
                  <AmbivalenceSection data={data} />
                  <DreamPatternsSection data={data} />
                  <TriggerReflectionsSection data={data} />
                </>
              ) : (
                <PremiumGate
                  feature="Deep Tension Analysis"
                  teaser="Branch maps, ambivalence patterns, dream echoes, and trigger reflections — synthesized from your data."
                >
                  <NSBranchMapSection data={data} />
                  <AmbivalenceSection data={data} />
                </PremiumGate>
              )}

              <View style={styles.bottomSpacer} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container:        { flex: 1, backgroundColor: theme.background },
  safeArea:         { flex: 1 },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
  header:           { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea:        { paddingHorizontal: 24, paddingBottom: 8 },
  backButton:       { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, borderWidth: 1, borderColor: theme.cardBorder, justifyContent: 'center', alignItems: 'center' },
  scrollContent:    { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  loader:           { marginTop: 80 },
  bottomSpacer:     { height: 40 },

  screenTitle: { fontSize: 32, fontWeight: '800', color: theme.textPrimary, letterSpacing: -1, marginBottom: 4, maxWidth: '88%' },
  screenSubtitle: { fontSize: 14, marginBottom: 32 },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '800',
    color: theme.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 8, marginBottom: 20,
  },

  // Glass card
  glassCard: {
    borderRadius: 24, padding: 24, marginBottom: 4,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 17, fontWeight: '500', color: theme.textPrimary,
    marginBottom: 6, letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 13, color: theme.textMuted, lineHeight: 22,
    marginBottom: 16,
  },

  // Empty state
  emptyStateText: {
    fontSize: 13, color: theme.textMuted, lineHeight: 20,
    marginTop: 4,
  },
  seedChip: {
    marginTop: 14, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: theme.cardBorder,
  },
  seedChipText: { fontSize: 12, letterSpacing: 0.5 },

  // Conflict score
  conflictScoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 16 },
  conflictScoreRight:  { flex: 1 },
  conflictScoreLabel:  { fontSize: 15, fontWeight: '500', marginBottom: 3 },
  conflictScoreHint:   { fontSize: 12, color: theme.textMuted },
  conflictGaugeWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  conflictGaugeCanvas: { width: 120, height: 120 },
  conflictGaugeCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  conflictGaugeNumber: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8 },
  conflictGaugeUnit: { fontSize: 10, color: theme.textMuted, marginTop: 1 },
  conflictGaugeHint: { fontSize: 12, color: theme.textMuted, lineHeight: 18, marginTop: 12 },

  conflictPairHeader: { marginBottom: 12 },
  conflictPairLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: theme.textSecondary, marginBottom: 4 },
  conflictPairHint: { fontSize: 12, color: theme.textMuted, lineHeight: 18 },
  tugWrap: { marginBottom: 16 },
  tugHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  tugLabel: { flex: 1, fontSize: 11, fontWeight: '700' },
  tugHint: { fontSize: 10, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1.1 },
  tugTrack: { flexDirection: 'row', height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.pillSurface },
  tugFillLeft: { height: '100%' },
  tugFillRight: { height: '100%' },
  tugValues: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  tugValue: { fontSize: 11, color: theme.textMuted, fontWeight: '700' },

  conflictStatesRow:    { gap: 12, marginBottom: 14 },
  conflictState:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stateDot:             { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  stateName:            { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  stateDesc:            { fontSize: 12, color: theme.textMuted, letterSpacing: 0.2, lineHeight: 17 },
  conflictInterpretation: {
    fontSize: 13, color: theme.textMuted, lineHeight: 22,
    borderTopWidth: 1, borderTopColor: theme.cardBorder,
    paddingTop: 16, marginTop: 16,
  },

  // Premium lock banner
  lockWrap: { marginTop: 8 },
  lockBanner: {
    borderRadius: 24, padding: 24, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(212, 175, 55,0.2)',
    overflow: 'hidden',
  },
  lockBannerRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  lockBannerTitle:      { fontSize: 16, fontWeight: '600' },
  lockBannerSub:        { fontSize: 12, color: theme.textMuted, lineHeight: 18, marginBottom: 16 },
  lockBannerButton: {
    alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: PALETTE.gold,
  },
  lockBannerButtonText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

  // Blurred teaser
  blurPreviewWrap:    { position: 'relative', overflow: 'hidden', borderRadius: 16 },
  blurPreviewCard: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 24, padding: 24, opacity: 0.4 },
  blurPreviewTitle:   { fontSize: 17, fontWeight: '500', color: theme.textPrimary, marginBottom: 12 },
  blurPreviewRadar:   { height: 150, backgroundColor: 'rgba(168,155,200,0.08)', borderRadius: 16 },
  blurPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,6,8,0.6)',
  },

  // Radar
  radarWrap: { alignItems: 'center', marginVertical: 8, gap: 18 },
  stateBalanceLegend: {
    width: '100%',
    gap: 10,
  },
  stateBalanceLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  stateBalanceLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stateBalanceLegendLabel: {
    flex: 1,
    fontSize: 12,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  stateBalanceLegendValue: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '700',
  },
  stateBalanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stateBalanceLabel: { width: 76, fontSize: 12, color: theme.textPrimary, fontWeight: '600' },
  stateBalanceBar: { flex: 1, height: 10, borderRadius: 999, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.pillSurface, overflow: 'hidden' },
  stateBalanceFill: { height: '100%', borderRadius: 999 },
  stateBalanceValue: { width: 28, textAlign: 'right', fontSize: 12, color: theme.textMuted, fontWeight: '600' },

  // Ambivalence
  ambivalencePair:    { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.cardBorder },
  ambivalencePairRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  ambivalenceTriggerWrap: { flex: 1 },
  ambivalenceTrigger: { fontSize: 14, fontWeight: '600' },
  ambivalenceArrow:   { fontSize: 14, color: theme.textMuted },
  ambivalenceIntensityWrap: { minWidth: 60, alignItems: 'flex-end' },
  ambivalenceIntensity: { fontSize: 12, color: theme.textPrimary, minWidth: 36, textAlign: 'right', fontWeight: '700' },
  ambivalenceIntensityLabel: { fontSize: 9, color: theme.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 },
  ambivalenceBarBg:   { height: 8, backgroundColor: theme.cardBorder, borderRadius: 999, marginBottom: 10, overflow: 'hidden' },
  ambivalenceBarFill: { height: 8, backgroundColor: PALETTE.gold + '80', borderRadius: 999 },
  ambivalenceReflection: { fontSize: 12, color: theme.textMuted, lineHeight: 18 },

  // Dream patterns
  patternGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  patternChip: {
    flexBasis: '48%',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 132,
    minHeight: 108,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1, borderColor: theme.cardBorder,
    overflow: 'hidden', position: 'relative',
  },
  patternChipInner: {
    flex: 1,
    minHeight: 76,
    justifyContent: 'space-between',
    gap: 12,
  },
  patternChipHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  patternChipTitleWrap: { flex: 1, minWidth: 0, paddingRight: 10 },
  patternChipBadge: {
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(168,155,200,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(168,155,200,0.28)',
    alignItems: 'center', justifyContent: 'center',
    gap: 1,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  patternChipBadgeCount: { fontSize: 12, fontWeight: '800', color: theme.isDark ? PALETTE.lavender : '#4A3B69', lineHeight: 13, textAlign: 'center' },
  patternChipBadgeLabel: { fontSize: 8, fontWeight: '700', color: theme.isDark ? theme.textSecondary : '#4A3B69', textTransform: 'uppercase', letterSpacing: 0.6, lineHeight: 9 },
  patternChipLabel: {
    fontSize: 12,
    color: theme.textPrimary,
    fontWeight: '600',
    lineHeight: 17,
  },
  patternConfidenceBar: { marginTop: 'auto', height: 3, backgroundColor: theme.cardBorder, borderRadius: 2 },
  patternConfidenceFill: { height: 3, backgroundColor: PALETTE.lavender + '80', borderRadius: 2 },

  // Trigger reflections
  triggerRow: { marginTop: 0, paddingTop: 0 },
  triggerRowSeparated: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.cardBorder },
  triggerHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  triggerNameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  triggerDot:         { width: 7, height: 7, borderRadius: 4 },
  triggerName:        { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  triggerIntensityWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  triggerIntensityText: { fontSize: 12, color: theme.textMuted, lineHeight: 16 },
  triggerChevron: { marginTop: 0 },
  triggerBarBg:  { height: 3, backgroundColor: theme.cardBorder, borderRadius: 2, marginBottom: 0 },
  triggerBarFill: { height: 3, backgroundColor: PALETTE.gold + '60', borderRadius: 2 },
  triggerExpanded: { marginTop: 12 },
  triggerDefinition: { fontSize: 12, color: theme.textMuted, lineHeight: 18, marginBottom: 12 },
  triggerQuestion: { flexDirection: 'row', gap: 4 },
  triggerQuestionMark: { fontSize: 18, lineHeight: 22 },
  triggerQuestionText: {
    flex: 1, fontSize: 13, color: theme.textPrimary,
    lineHeight: 20,
  },

});
