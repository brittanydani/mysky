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

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { PsychologicalForcesRadar } from '../../components/ui/PsychologicalForcesRadar';
import { MetallicText } from '../../components/ui/MetallicText';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { localDb } from '../../services/storage/localDb';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
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

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = {
  gold:        '#C9AE78',
  rose:        '#D4A3B3',
  sage:        '#8CBEAA',
  lavender:    '#A89BC8',
  coral:       '#D4826A',
  textMain:    '#FFFFFF',
  textMuted:   'rgba(255,255,255,0.55)',
  textDim:     'rgba(255,255,255,0.35)',
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
  return (
    <Text style={styles.sectionLabel}>{children}</Text>
  );
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.glassCard, style]}>
      {children}
    </View>
  );
}

function ConflictBar({
  score,
  stateA,
  stateB,
}: {
  score: number;
  stateA: NervousSystemBranch;
  stateB: NervousSystemBranch;
}) {
  // Width fractions: state1 = 1/(1+score), state2 = score/(1+score)
  const frac1 = 1 / (1 + score);
  const colorA = NS_BRANCH_COLORS[stateA];
  const colorB = NS_BRANCH_COLORS[stateB];

  return (
    <View style={styles.conflictBarWrap}>
      <View style={[styles.conflictBarSegA, { flex: frac1, backgroundColor: colorA + 'CC' }]} />
      <View style={[styles.conflictBarSegB, { flex: 1 - frac1, backgroundColor: colorB + 'CC' }]} />
    </View>
  );
}

function NSConflictCard({ data }: { data: InnerTensionsData }) {
  const { nsConflict, dataQuality } = data;
  const hasData = dataQuality.entriesWithFeelings > 0;
  const scoreColor = conflictScoreColor(nsConflict.conflictScore);
  const [stateA, stateB] = nsConflict.dominantStates as [NervousSystemBranch, NervousSystemBranch];

  if (!hasData) {
    return (
      <GlassCard>
        <Text style={styles.cardTitle}>Nervous System Tension</Text>
        <Text style={styles.emptyStateText}>
          Your tension map grows as you log dreams. Add feelings when you record a sleep entry to activate this view.
        </Text>
        <View style={styles.seedChip}>
          <MetallicText style={styles.seedChipText} color={PALETTE.gold}>Log a dream to begin</MetallicText>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Text style={styles.cardTitle}>Nervous System Tension</Text>

      {/* Score row */}
      <View style={styles.conflictScoreRow}>
        <View style={styles.conflictScoreCircle}>
          <MetallicText style={styles.conflictScoreNumber} color={scoreColor}>
            {Math.round(nsConflict.conflictScore * 100)}
          </MetallicText>
          <Text style={styles.conflictScoreUnit}>/100</Text>
        </View>
        <View style={styles.conflictScoreRight}>
          <MetallicText style={styles.conflictScoreLabel} color={scoreColor}>
            {nsConflict.conflictScore > 0.75 ? 'High Tension'
              : nsConflict.conflictScore > 0.45 ? 'Moderate Tension'
              : 'Low Tension'}
          </MetallicText>
          <Text style={styles.conflictScoreHint}>
            based on {dataQuality.entriesWithFeelings} dream{dataQuality.entriesWithFeelings !== 1 ? 's' : ''} logged
          </Text>
        </View>
      </View>

      {/* Competing states */}
      {stateA && stateB && (
        <>
          <ConflictBar score={nsConflict.conflictScore} stateA={stateA} stateB={stateB} />
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

function PremiumLockBanner({ onUnlock }: { onUnlock: () => void }) {
  return (
    <Pressable style={styles.lockBanner} onPress={onUnlock}>
      <LinearGradient
        colors={['rgba(201,174,120,0.12)', 'rgba(168,155,200,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.lockBannerRow}>
        <Lock size={16} color={PALETTE.gold} strokeWidth={1.5} />
        <MetallicText style={styles.lockBannerTitle} color={PALETTE.gold}>Unlock Your Full Tension Map</MetallicText>
      </View>
      <Text style={styles.lockBannerSub}>
        State balance radar · Ambivalence patterns · Dream archetypes · Trigger reflections
      </Text>
      <View style={styles.lockBannerButton}>
        <MetallicText style={styles.lockBannerButtonText} color={PALETTE.gold}>Upgrade to Premium</MetallicText>
      </View>
    </Pressable>
  );
}

function NSBranchMapSection({ data }: { data: InnerTensionsData }) {
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      <SectionLabel>State Balance</SectionLabel>
      <GlassCard>
        <Text style={styles.cardTitle}>Nervous System Map</Text>
        <Text style={styles.cardSubtitle}>
          How your six nervous system states distribute across your dream journal.
        </Text>
        <View style={styles.radarWrap}>
          <PsychologicalForcesRadar forces={data.nsBranchForces} size={Dimensions.get('window').width - 32} />
        </View>
        {data.dataQuality.entriesWithFeelings === 0 && (
          <Text style={styles.emptyStateText}>Log dreams with feelings to populate the map.</Text>
        )}
      </GlassCard>
    </Animated.View>
  );
}

function AmbivalenceSection({ data }: { data: InnerTensionsData }) {
  const { ambivalence } = data;

  return (
    <Animated.View entering={FadeInDown.delay(150).duration(400)}>
      <SectionLabel>Ambivalence Patterns</SectionLabel>
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
                  <Text style={styles.ambivalenceIntensity}>{intensityPct}%</Text>
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
            {dreamPatterns.map((p, i) => (
              <View key={p.pattern} style={styles.patternChip}>
                <LinearGradient
                  colors={['rgba(168,155,200,0.15)', 'rgba(168,155,200,0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.patternChipBadge}>
                  <MetallicText style={styles.patternChipBadgeText} color={PALETTE.lavender}>{p.count}</MetallicText>
                </View>
                <Text style={styles.patternChipLabel}>{p.label}</Text>
                <View style={styles.patternConfidenceBar}>
                  <View style={[styles.patternConfidenceFill, { width: `${Math.round(p.topConfidence * 100)}%` }]} />
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
  const { topTriggers } = data;
  const [expanded, setExpanded] = useState<ShadowTrigger | null>(null);

  const toggle = (t: ShadowTrigger) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpanded(prev => (prev === t ? null : t));
  };

  return (
    <Animated.View entering={FadeInDown.delay(250).duration(400)}>
      <SectionLabel>Trigger Reflections</SectionLabel>
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
              <Pressable key={item.trigger} onPress={() => toggle(item.trigger)} style={styles.triggerRow}>
                <View style={styles.triggerHeader}>
                  <View style={styles.triggerNameRow}>
                    <View style={[styles.triggerDot, { backgroundColor: PALETTE.gold + 'AA' }]} />
                    <Text style={styles.triggerName}>{label}</Text>
                  </View>
                  <View style={styles.triggerIntensityWrap}>
                    <Text style={styles.triggerIntensityText}>{intensityPct}%</Text>
                    <Text style={styles.triggerChevron}>{isOpen ? '↑' : '↓'}</Text>
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
          const charts = await localDb.getCharts();
          if (!charts.length) { setLoading(false); return; }
          const entries = await localDb.getSleepEntries(charts[0].id, 90);
          if (!cancelled) setData(computeInnerTensions(entries));
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
    router.replace('/(tabs)/blueprint' as Href);
  };

  const goPremium = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(tabs)/premium');
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient
        colors={['rgba(30,15,50,0.7)', 'rgba(10,10,15,0.9)', 'rgba(5,5,10,1)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Pressable style={styles.backButton} onPress={goBack}>
            <MetallicIcon name="arrow-back-outline" size={20} color={PALETTE.lavender} />
            <MetallicText style={styles.backLabel} color={PALETTE.lavender}>Identity</MetallicText>
          </Pressable>

          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.screenTitle}>Inner Tensions</Text>
            <GoldSubtitle style={styles.screenSubtitle}>
              Where your inner forces pull against each other
            </GoldSubtitle>
          </Animated.View>

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
                <SectionLabel>Nervous System</SectionLabel>
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
                <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.lockWrap}>
                  <PremiumLockBanner onUnlock={goPremium} />
                  {/* Blurred preview teaser */}
                  <View style={styles.blurPreviewWrap} pointerEvents="none">
                    <View style={styles.blurPreviewCard}>
                      <Text style={styles.blurPreviewTitle}>State Balance</Text>
                      <View style={styles.blurPreviewRadar} />
                    </View>
                    <View style={styles.blurPreviewOverlay} />
                  </View>
                </Animated.View>
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

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#060608' },
  safeArea:         { flex: 1 },
  scrollContent:    { paddingHorizontal: 20, paddingBottom: 120 },
  loader:           { marginTop: 80 },
  bottomSpacer:     { height: 40 },

  // Header
  backButton:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 4 },
  backLabel:   { fontSize: 14, color: PALETTE.textMuted, letterSpacing: 0.3 },
  screenTitle: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 4 },
  screenSubtitle: { fontSize: 14, marginBottom: 32 },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2.5,
    textTransform: 'uppercase', color: PALETTE.textDim,
    marginTop: 28, marginBottom: 10,
  },

  // Glass card
  glassCard: {
    backgroundColor: PALETTE.glassBg,
    borderWidth: 1, borderColor: PALETTE.glassBorder,
    borderRadius: 16, padding: 20, marginBottom: 4,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 17, fontWeight: '500', color: PALETTE.textMain,
    marginBottom: 6, letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 13, color: PALETTE.textMuted, lineHeight: 19,
    marginBottom: 16,
  },

  // Empty state
  emptyStateText: {
    fontSize: 13, color: PALETTE.textDim, lineHeight: 20,
    marginTop: 4,
  },
  seedChip: {
    marginTop: 14, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder,
  },
  seedChipText: { fontSize: 12, letterSpacing: 0.5 },

  // Conflict score
  conflictScoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 16 },
  conflictScoreCircle: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1.5, borderColor: PALETTE.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  conflictScoreNumber: { fontSize: 22, fontWeight: '300', letterSpacing: -0.5 },
  conflictScoreUnit:   { fontSize: 10, color: PALETTE.textDim, marginTop: -2 },
  conflictScoreRight:  { flex: 1 },
  conflictScoreLabel:  { fontSize: 15, fontWeight: '500', marginBottom: 3 },
  conflictScoreHint:   { fontSize: 12, color: PALETTE.textDim },

  // Conflict bar
  conflictBarWrap:  { flexDirection: 'row', height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  conflictBarSegA:  { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
  conflictBarSegB:  { borderTopRightRadius: 3, borderBottomRightRadius: 3 },

  conflictStatesRow:    { gap: 12, marginBottom: 14 },
  conflictState:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stateDot:             { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  stateName:            { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  stateDesc:            { fontSize: 11, color: PALETTE.textDim, letterSpacing: 0.2 },
  conflictInterpretation: {
    fontSize: 13, color: PALETTE.textMuted, lineHeight: 19,
    borderTopWidth: 1, borderTopColor: PALETTE.glassBorder,
    paddingTop: 14, marginTop: 4,
  },

  // Premium lock banner
  lockWrap: { marginTop: 8 },
  lockBanner: {
    borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(201,174,120,0.2)',
    overflow: 'hidden',
  },
  lockBannerRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  lockBannerTitle:      { fontSize: 16, fontWeight: '600' },
  lockBannerSub:        { fontSize: 12, color: PALETTE.textMuted, lineHeight: 18, marginBottom: 16 },
  lockBannerButton: {
    alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: PALETTE.gold,
  },
  lockBannerButtonText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },

  // Blurred teaser
  blurPreviewWrap:    { position: 'relative', overflow: 'hidden', borderRadius: 16 },
  blurPreviewCard:    { backgroundColor: PALETTE.glassBg, borderWidth: 1, borderColor: PALETTE.glassBorder, borderRadius: 16, padding: 20, opacity: 0.4 },
  blurPreviewTitle:   { fontSize: 17, fontWeight: '500', color: PALETTE.textMain, marginBottom: 12 },
  blurPreviewRadar:   { height: 150, backgroundColor: 'rgba(168,155,200,0.08)', borderRadius: 12 },
  blurPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,6,8,0.6)',
  },

  // Radar
  radarWrap: { alignItems: 'center', marginVertical: 8 },

  // Ambivalence
  ambivalencePair:    { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: PALETTE.glassBorder },
  ambivalencePairRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  ambivalenceTriggerWrap: { flex: 1 },
  ambivalenceTrigger: { fontSize: 14, fontWeight: '600' },
  ambivalenceArrow:   { fontSize: 14, color: PALETTE.textDim },
  ambivalenceIntensity: { fontSize: 12, color: PALETTE.textDim, minWidth: 36, textAlign: 'right' },
  ambivalenceBarBg:   { height: 4, backgroundColor: PALETTE.glassBorder, borderRadius: 2, marginBottom: 10 },
  ambivalenceBarFill: { height: 4, backgroundColor: PALETTE.gold + '80', borderRadius: 2 },
  ambivalenceReflection: { fontSize: 12, color: PALETTE.textDim, lineHeight: 18 },

  // Dream patterns
  patternGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  patternChip: {
    width: '47%', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: PALETTE.glassBorder,
    overflow: 'hidden', position: 'relative',
  },
  patternChipBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(168,155,200,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  patternChipBadgeText: { fontSize: 11, fontWeight: '700' },
  patternChipLabel:     { fontSize: 12, color: PALETTE.textMain, fontWeight: '500', lineHeight: 17, marginRight: 24 },
  patternConfidenceBar: { height: 3, backgroundColor: PALETTE.glassBorder, borderRadius: 2, marginTop: 10 },
  patternConfidenceFill: { height: 3, backgroundColor: PALETTE.lavender + '80', borderRadius: 2 },

  // Trigger reflections
  triggerRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: PALETTE.glassBorder },
  triggerHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  triggerNameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  triggerDot:         { width: 7, height: 7, borderRadius: 4 },
  triggerName:        { fontSize: 14, fontWeight: '600', color: PALETTE.textMain },
  triggerIntensityWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  triggerIntensityText: { fontSize: 12, color: PALETTE.textDim },
  triggerChevron:       { fontSize: 12, color: PALETTE.textDim },
  triggerBarBg:  { height: 3, backgroundColor: PALETTE.glassBorder, borderRadius: 2, marginBottom: 0 },
  triggerBarFill: { height: 3, backgroundColor: PALETTE.gold + '60', borderRadius: 2 },
  triggerExpanded: { marginTop: 12 },
  triggerDefinition: { fontSize: 12, color: PALETTE.textMuted, lineHeight: 18, marginBottom: 12 },
  triggerQuestion: { flexDirection: 'row', gap: 4 },
  triggerQuestionMark: { fontSize: 18, lineHeight: 22 },
  triggerQuestionText: {
    flex: 1, fontSize: 13, color: PALETTE.textMain,
    lineHeight: 20,
  },

});
