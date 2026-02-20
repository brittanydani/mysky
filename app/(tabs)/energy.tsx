// File: app/(tabs)/energy.tsx
// MySky — Energy Screen (Chakra wheel, domains, guidance)

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { usePremium } from '../../context/PremiumContext';
import {
  EnergyEngine,
  EnergySnapshot,
  EnergyIntensity,
  ChakraReading,
  ChakraState,
  BehaviorContext,
} from '../../services/energy/energyEngine';
import { logger } from '../../utils/logger';
import ChakraWheelComponent from '../../components/ui/ChakraWheel';

/* ── Constants ── */
const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = SCREEN_W * 0.75;

const INTENSITY_BAR: Record<EnergyIntensity, { fill: number; color: string; label: string }> = {
  Low:      { fill: 0.3,  color: theme.calm,  label: 'Low' },
  Moderate: { fill: 0.6,  color: theme.okay,  label: 'Steady' },
  High:     { fill: 0.95, color: theme.stormy, label: 'Elevated' },
};

const CHAKRA_STATE_COLORS: Record<ChakraState, string> = {
  Flowing:            theme.energy,
  Sensitive:          theme.heavy,
  'Grounding Needed': theme.stormy,
  Quiet:              'rgba(255,255,255,0.25)',
};

/* ── Helpers ── */
function safeHaptic() {
  Haptics.selectionAsync().catch(() => {});
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/* ════════════════════════════════════════════════
   MAIN SCREEN
   ════════════════════════════════════════════════ */
export default function EnergyScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();

  const [loading, setLoading] = useState(true);
  const [hasChart, setHasChart] = useState(false);
  const [snapshot, setSnapshot] = useState<EnergySnapshot | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [expandedDomain, setExpandedDomain] = useState<number | null>(null);
  const [wheelTooltip, setWheelTooltip] = useState<string | null>(null);
  const wheelTooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (wheelTooltipTimer.current) clearTimeout(wheelTooltipTimer.current);
    };
  }, []);

  /* pulse animation for intensity bar */
  const pulse = useSharedValue(0.7);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pulse is a Reanimated SharedValue (stable ref), only needs to run once
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  /* load chart + generate snapshot */
  useFocusEffect(
    useCallback(() => {
      Haptics.selectionAsync().catch(() => {});

      const load = async () => {
        try {
          setLoading(true);
          const charts = await localDb.getCharts();
          if (!charts || charts.length === 0) {
            setHasChart(false);
            return;
          }
          setHasChart(true);
          const saved = charts[0];
          setUserName(saved?.name ?? '');
          const birthData = {
            date: saved.birthDate,
            time: saved.birthTime,
            hasUnknownTime: saved.hasUnknownTime,
            place: saved.birthPlace,
            latitude: saved.latitude,
            longitude: saved.longitude,
            timezone: saved.timezone,
            houseSystem: saved.houseSystem,
          };
          const natal = AstrologyCalculator.generateNatalChart(birthData);

          // Load behavioral context for blended calculations
          let behavior: BehaviorContext | undefined;
          try {
            const today = new Date().toISOString().slice(0, 10);
            const checkIn = await localDb.getCheckInByDate(today, saved.id);
            const recentCheckIns = await localDb.getCheckIns(saved.id, 7);

            if (checkIn || recentCheckIns.length > 0) {
              behavior = {};
              if (checkIn) {
                behavior.recentMoodScore = checkIn.moodScore;
                behavior.recentEnergyLevel = checkIn.energyLevel as BehaviorContext['recentEnergyLevel'];
                behavior.recentStressLevel = checkIn.stressLevel as BehaviorContext['recentStressLevel'];
                behavior.recentTags = checkIn.tags;
              }
              if (recentCheckIns.length > 0) {
                const moodScores = recentCheckIns
                  .filter(c => c.moodScore != null)
                  .map(c => c.moodScore);
                if (moodScores.length > 0) {
                  behavior.averageMood7d = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
                }
              }
            }
          } catch (e) {
            // Behavioral context is optional — continue without it
            logger.error('Behavior context load failed (non-critical):', e);
          }

          const snap = EnergyEngine.generateSnapshot(natal, new Date(), behavior);
          setSnapshot(snap);
        } catch (e) {
          logger.error('Energy load failed:', e);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  /* ── No-chart state ── */
  if (!loading && !hasChart) {
    return (
      <View style={styles.container}>
        <StarField starCount={28} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={20} color={theme.primary} />
              <Text style={styles.backBtnText}>Mood</Text>
            </Pressable>
            <Text style={styles.title}>Energy</Text>
            <Text style={styles.subtitle}>Your personal energy weather {'\u2014'} built from your chart.</Text>
          </Animated.View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: 32 }]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <LinearGradient colors={['rgba(30,45,71,0.65)', 'rgba(26,39,64,0.45)']} style={[styles.card, styles.cardPad]}>
                <Ionicons name="sparkles" size={32} color={theme.primary} style={{ marginBottom: 12 }} />
                <Text style={styles.heroToneText}>Energy needs your chart</Text>
                <Text style={[styles.body, { marginTop: 8 }]}>
                  Create your natal chart to unlock your personal energy weather {'\u2014'} chakra awareness, domain tracking, and daily guidance.
                </Text>
                <Pressable style={styles.primaryBtn} onPress={() => { safeHaptic(); router.push('/(tabs)/home' as Href); }} accessibilityRole="button" accessibilityLabel="Create chart">
                  <Ionicons name="add-circle-outline" size={16} color={theme.primary} />
                  <Text style={styles.primaryBtnText}>Create Chart</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  /* ── Loading state ── */
  if (loading || !snapshot) {
    return (
      <View style={styles.container}>
        <StarField starCount={28} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Ionicons name="sparkles" size={28} color={theme.primary} />
            <Text style={[styles.body, { marginTop: 12 }]}>Reading your energy{'\u2026'}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  /* ── Main render ── */
  const barInfo = INTENSITY_BAR[snapshot.intensity];

  return (
    <View style={styles.container}>
      <StarField starCount={80} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.View entering={FadeInDown.delay(60).duration(600)} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={20} color={theme.primary} />
            <Text style={styles.backBtnText}>Mood</Text>
          </Pressable>
          <Text style={styles.title}>Energy</Text>
          <Text style={styles.subtitle}>
            {userName ? `${userName}'s energy` : 'Your energy'} {'\u2022'} {formatToday()}
          </Text>
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ═══ S1 — ENERGY SNAPSHOT ═══ */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <LinearGradient
              colors={['rgba(30,45,71,0.65)', 'rgba(26,39,64,0.45)']}
              style={[styles.card, { paddingHorizontal: 18, paddingVertical: 14 }]}
            >
              <View style={styles.toneBadge}>
                <Text style={styles.toneLabel}>{snapshot.tone}</Text>
                <View style={styles.toneSeparator} />
                <Text style={styles.intensityLabel}>{barInfo.label}</Text>
              </View>
              <View style={styles.intensityBarOuter}>
                <Animated.View
                  style={[
                    styles.intensityBarGlow,
                    { width: `${barInfo.fill * 100}%`, backgroundColor: barInfo.color },
                    pulseStyle,
                  ]}
                />
                <View
                  style={[
                    styles.intensityBarInner,
                    { width: `${barInfo.fill * 100}%`, backgroundColor: barInfo.color },
                  ]}
                />
              </View>
              <Text style={[styles.body, { marginTop: 6 }]}>{snapshot.quickMeaning}</Text>
            </LinearGradient>
          </Animated.View>

          {/* ═══ S2 — ENERGY WHEEL ═══ */}
          <Animated.View entering={FadeInDown.delay(160).duration(600)}>
            <Pressable
              style={styles.wheelContainer}
              onPress={() => {
                safeHaptic();
                if (snapshot) {
                  const dc = snapshot.dominantChakra;
                  const stateHint: Record<string, string> = {
                    'Grounding Needed': 'is overactive — grounding helps',
                    'Sensitive': 'is heightened — move gently',
                    'Flowing': 'is open and moving freely',
                    'Quiet': 'is resting quietly',
                  };
                  const tip = `${dc.name} ${stateHint[dc.state] || dc.state}`;
                  setWheelTooltip(tip);
                  if (wheelTooltipTimer.current) clearTimeout(wheelTooltipTimer.current);
                  wheelTooltipTimer.current = setTimeout(() => setWheelTooltip(null), 2800);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Energy wheel, tap for details"
            >
              <ChakraWheelComponent
                chakras={snapshot.chakras}
                dominantChakra={snapshot.dominantChakra}
                size={WHEEL_SIZE}
                showLabels={false}
              />
              {wheelTooltip && (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={styles.wheelTooltip}
                >
                  <Text style={styles.wheelTooltipText}>{wheelTooltip}</Text>
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>

          {/* ═══ S3 — CHAKRA FOCUS TODAY ═══ */}
          <SectionHeader icon="body-outline" title="Today's Focus" delay={220} />
          <Animated.View entering={FadeInDown.delay(240).duration(600)}>
            <ChakraCard chakra={snapshot.dominantChakra} highlight />
            {isPremium ? (
              <>
                {snapshot.chakras
                  .filter(c => c.name !== snapshot.dominantChakra.name && (c.state === 'Sensitive' || c.state === 'Grounding Needed'))
                  .map(c => <ChakraCard key={c.name} chakra={c} role="secondary" />)}
                {snapshot.chakras
                  .filter(c => c.name !== snapshot.dominantChakra.name && c.state !== 'Sensitive' && c.state !== 'Grounding Needed')
                  .length > 0 && (
                  <View style={styles.bgChakraSection}>
                    <Text style={styles.bgChakraLabel}>In the background</Text>
                    {snapshot.chakras
                      .filter(c => c.name !== snapshot.dominantChakra.name && c.state !== 'Sensitive' && c.state !== 'Grounding Needed')
                      .map(c => <ChakraCard key={c.name} chakra={c} role="background" />)}
                  </View>
                )}
              </>
            ) : (
              <LinearGradient colors={['rgba(201,169,98,0.10)', 'rgba(201,169,98,0.03)']} style={[styles.card, styles.cardPad, { borderColor: 'rgba(201,169,98,0.2)' }]}>
                <View style={styles.lockBanner}>
                  <Ionicons name="sparkles" size={14} color={theme.primary} />
                  <Text style={styles.lockText}>All 7 chakras with body cues and triggers</Text>
                </View>
                <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', marginTop: 6 }}>
                  Your chart activates specific energy centers {'\u2014'} see which ones need attention today
                </Text>
              </LinearGradient>
            )}
          </Animated.View>

          {/* ═══ S4 — ENERGY BY DOMAIN ═══ */}
          <SectionHeader icon="grid-outline" title="Energy by Domain" delay={320} />
          <Animated.View entering={FadeInDown.delay(340).duration(600)}>
            {snapshot.domains.map((d, idx) => {
              const isFree = snapshot.freeDomainIndices.includes(idx);
              const isLocked = !isPremium && !isFree;
              const isExpanded = expandedDomain === idx;
              return (
                <Pressable
                  key={d.name}
                  onPress={() => {
                    if (isLocked) {
                      safeHaptic();
                      router.push('/(tabs)/premium' as Href);
                      return;
                    }
                    safeHaptic();
                    setExpandedDomain(isExpanded ? null : idx);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.name} energy domain${isLocked ? ', locked' : ''}`}
                  accessibilityState={{ expanded: isExpanded }}
                >
                  <LinearGradient
                    colors={isLocked
                      ? ['rgba(20,30,46,0.5)', 'rgba(13,20,33,0.5)']
                      : ['rgba(30,45,71,0.60)', 'rgba(26,39,64,0.40)']
                    }
                    style={[styles.card, styles.cardPad, { marginBottom: 8 }]}
                  >
                    <View style={styles.domainRow}>
                      <View style={styles.domainIconWrap}>
                        <Ionicons
                          name={(d.icon as keyof typeof Ionicons.glyphMap) || 'ellipse'}
                          size={20}
                          color={isLocked ? theme.textMuted : theme.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.domainName, isLocked && styles.textLocked]}>{d.name}</Text>
                        <Text style={[styles.domainState, isLocked && styles.textLocked]}>
                          {isLocked ? '\u2022\u2022\u2022\u2022\u2022\u2022' : d.state}
                        </Text>
                      </View>
                      <Ionicons
                        name={isLocked ? 'lock-closed' : isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={isLocked ? theme.textMuted : theme.primary}
                      />
                    </View>
                    {isExpanded && !isLocked && (
                      <View style={styles.domainExpanded}>
                        <Text style={styles.body}>{d.feeling}</Text>
                        <View style={styles.domainWhyRow}>
                          <Ionicons name="information-circle-outline" size={14} color={theme.primary} />
                          <Text style={styles.domainWhyText}>{d.why}</Text>
                        </View>
                        <View style={styles.domainSuggestionRow}>
                          <Ionicons name="bulb-outline" size={14} color={theme.energy} />
                          <Text style={styles.domainSuggestionText}>{d.suggestion}</Text>
                        </View>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* ═══ S5 — ENERGY GUIDANCE ═══ */}
          <SectionHeader icon="compass-outline" title="Energy Guidance" delay={400} />
          <Animated.View entering={FadeInDown.delay(420).duration(600)}>
            <LinearGradient colors={['rgba(30,45,71,0.60)', 'rgba(26,39,64,0.40)']} style={[styles.card, styles.cardPad]}>
              {isPremium ? (
                <>
                  <GuidanceBlock icon="arrow-up-outline" label="Lean into" text={snapshot.guidance.leanInto} context={snapshot.guidance.leanIntoContext} color={theme.energy} />
                  <View style={styles.divider} />
                  <GuidanceBlock icon="hand-left-outline" label="Move gently around" text={snapshot.guidance.moveGentlyAround} context={snapshot.guidance.moveGentlyContext} color={theme.heavy} />
                  <View style={styles.divider} />
                  <GuidanceBlock icon="flash-outline" label="Best use of energy" text={snapshot.guidance.bestUseOfEnergy} context={snapshot.guidance.bestUseContext} color={theme.primary} />
                  <View style={styles.divider} />
                  <View style={styles.guidanceRitualBlock}>
                    <View style={styles.guidanceHeader}>
                      <Ionicons name="sparkles-outline" size={16} color={theme.calm} />
                      <Text style={[styles.guidanceLabel, { color: theme.calm }]}>Today{'\u2019'}s Micro-Ritual</Text>
                    </View>
                    <Text style={styles.guidanceRitualText}>{snapshot.guidance.ritual}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.guidanceFree}>{snapshot.freeGuidanceLine}</Text>
                  <Pressable
                    onPress={() => router.push('/(tabs)/premium' as Href)}
                    accessibilityRole="button"
                    accessibilityLabel="Unlock full energy guidance"
                  >
                    <View style={[styles.lockBanner, { marginTop: 12, backgroundColor: 'rgba(201,169,98,0.08)', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 }]}>
                      <Ionicons name="sparkles" size={14} color={theme.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.lockText, { fontWeight: '600' }]}>Full guidance includes:</Text>
                        <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                          Lean into · Move gently around · Best use of energy · Today's micro-ritual
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                    </View>
                  </Pressable>
                </>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── Footer ── */}
          <Animated.View entering={FadeInDown.delay(480).duration(600)} style={styles.footer}>
            <Text style={styles.footerText}>
              Energy is not prediction {'\u2014'} it is a mirror. Your chart creates conditions; you decide what to do with them.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════ */

function SectionHeader({ icon, title, delay }: { icon: keyof typeof Ionicons.glyphMap; title: string; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </Animated.View>
  );
}

type ChakraRole = 'primary' | 'secondary' | 'background';

function ChakraCard({ chakra, highlight, role }: { chakra: ChakraReading; highlight?: boolean; role?: ChakraRole }) {
  const resolvedRole = highlight ? 'primary' : (role ?? 'background');

  /* ── Background: compact one-liner ── */
  if (resolvedRole === 'background') {
    return (
      <LinearGradient
        colors={['rgba(25,38,58,0.40)', 'rgba(20,32,50,0.25)']}
        style={[styles.card, { padding: 14, marginBottom: 6 }]}
      >
        <View style={styles.chakraHeader}>
          <Text style={[styles.chakraEmoji, { fontSize: 20 }]}>{chakra.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.chakraName, { fontSize: 14, color: theme.textMuted }]}>{chakra.name}</Text>
            <Text style={[styles.bodyMuted, { fontSize: 12, marginTop: 1 }]}>
              {chakra.state === 'Quiet' ? 'Remains steady' : chakra.state === 'Flowing' ? 'Energy moving freely' : chakra.state}
            </Text>
          </View>
          <View style={[styles.chakraStateDot, { backgroundColor: CHAKRA_STATE_COLORS[chakra.state] }]} />
        </View>
      </LinearGradient>
    );
  }

  /* ── Secondary: brief with body cue + suggestion ── */
  if (resolvedRole === 'secondary') {
    return (
      <LinearGradient
        colors={['rgba(30,45,71,0.50)', 'rgba(26,39,64,0.30)']}
        style={[styles.card, styles.cardPad, { marginBottom: 8 }]}
      >
        <View style={styles.chakraHeader}>
          <Text style={styles.chakraEmoji}>{chakra.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.chakraName}>{chakra.name}</Text>
            <View style={styles.chakraStateRow}>
              <View style={[styles.chakraStateDot, { backgroundColor: CHAKRA_STATE_COLORS[chakra.state] }]} />
              <Text style={[styles.chakraStateText, { color: CHAKRA_STATE_COLORS[chakra.state] }]}>{chakra.state}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.bodyMuted, { marginTop: 6, fontStyle: 'italic' }]}>
          You may notice: {chakra.bodyCue.charAt(0).toLowerCase() + chakra.bodyCue.slice(1)}
        </Text>
        <View style={styles.chakraDetailRow}>
          <Ionicons name="heart-outline" size={13} color={theme.calm} />
          <Text style={styles.chakraDetailText}>{chakra.healingSuggestion}</Text>
        </View>
      </LinearGradient>
    );
  }

  /* ── Primary: full structured card ── */
  const cueItems = chakra.bodyCue
    .split(/[,;]|(?<=\.)\s+/)
    .map(s => s.trim().replace(/\.$/, ''))
    .filter(s => s.length > 3);

  return (
    <LinearGradient
      colors={['rgba(40,55,85,0.75)', 'rgba(30,45,71,0.55)']}
      style={[styles.card, styles.cardPad, { marginBottom: 10 }]}
    >
      <Text style={styles.focusRoleLabel}>Primary Focus Today</Text>
      <View style={styles.focusHeaderBlock}>
        <Text style={styles.focusChakraEmoji}>{chakra.emoji}</Text>
        <Text style={styles.focusChakraName}>{chakra.name}</Text>
      </View>
      <View style={styles.focusStateBadge}>
        <View style={[styles.focusStateDot, { backgroundColor: CHAKRA_STATE_COLORS[chakra.state] }]} />
        <Text style={[styles.focusStateText, { color: CHAKRA_STATE_COLORS[chakra.state] }]}>{chakra.state}</Text>
      </View>

      <View style={styles.focusDivider} />
      <Text style={styles.focusSectionLabel}>What you may notice</Text>
      {cueItems.length > 1 ? (
        cueItems.map((item, i) => (
          <View key={i} style={styles.focusBulletRow}>
            <Text style={styles.focusBulletDot}>{'\u2022'}</Text>
            <Text style={styles.focusBulletText}>{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.focusBodyText}>
          You may notice {chakra.bodyCue.charAt(0).toLowerCase() + chakra.bodyCue.slice(1)}
        </Text>
      )}

      <View style={styles.focusDivider} />
      <Text style={styles.focusSectionLabel}>Why</Text>
      <Text style={styles.focusWhyText}>{chakra.elementConnection}</Text>

      <View style={styles.focusDivider} />
      <Text style={styles.focusSectionLabel}>What helps</Text>
      <View style={styles.focusBulletRow}>
        <Text style={styles.focusBulletDot}>{'\u2022'}</Text>
        <Text style={styles.focusHelpText}>{chakra.healingSuggestion}</Text>
      </View>
      {chakra.groundingTip ? (
        <View style={[styles.focusBulletRow, { marginTop: 4 }]}>
          <Text style={styles.focusBulletDot}>{'\u2022'}</Text>
          <Text style={styles.focusHelpText}>{chakra.groundingTip}</Text>
        </View>
      ) : null}

      {chakra.affirmation ? (
        <View style={styles.affirmationWrap}>
          <Text style={styles.affirmationText}>{'\u201C'}{chakra.affirmation}{'\u201D'}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

function GuidanceBlock({ icon, label, text, context, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; text: string; context?: string; color: string }) {
  return (
    <View style={styles.guidanceBlock}>
      <View style={styles.guidanceHeader}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[styles.guidanceLabel, { color }]}>{label}</Text>
      </View>
      <Text style={styles.guidanceMainText}>{text}</Text>
      {context ? <Text style={styles.guidanceContextText}>{context}</Text> : null}
    </View>
  );
}

/* ════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  backBtnText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: theme.spacing.md,
  },
  cardPad: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  body: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMuted: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  textLocked: {
    color: theme.textMuted,
  },
  toneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  toneSeparator: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 2,
  },
  toneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    letterSpacing: 0.3,
  },
  intensityLabel: {
    fontSize: 13,
    color: theme.textSecondary ?? 'rgba(255,255,255,0.72)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  heroToneText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  intensityBarOuter: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  intensityBarGlow: {
    position: 'absolute' as const,
    top: -2,
    left: 0,
    height: 8,
    borderRadius: 4,
    opacity: 0.25,
  },
  intensityBarInner: {
    height: 4,
    borderRadius: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(201,169,98,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.22)',
    marginTop: 10,
  },
  primaryBtnText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  lockText: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  wheelContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  wheelTooltip: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(20,32,52,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,169,98,0.25)',
  },
  wheelTooltipText: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  chakraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chakraEmoji: {
    fontSize: 26,
  },
  chakraName: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  chakraStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  chakraStateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chakraStateText: {
    fontSize: 13,
    fontWeight: '600',
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  domainIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(201,169,98,0.10)',
  },
  domainName: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  domainState: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  domainExpanded: {
    marginTop: 10,
    paddingLeft: 50,
  },
  domainWhyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  domainWhyText: {
    flex: 1,
    color: theme.primary,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  domainSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  domainSuggestionText: {
    flex: 1,
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  chakraDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingTop: 6,
  },
  chakraDetailText: {
    flex: 1,
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  focusRoleLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.primary,
    marginBottom: 14,
  },
  focusHeaderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  focusChakraEmoji: {
    fontSize: 36,
  },
  focusChakraName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  focusStateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  focusStateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  focusStateText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  focusDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 16,
    marginBottom: 12,
  },
  focusSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  focusBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  focusBulletDot: {
    color: theme.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 1,
  },
  focusBulletText: {
    flex: 1,
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  focusBodyText: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  focusWhyText: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  focusHelpText: {
    color: theme.textPrimary,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  affirmationWrap: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  affirmationText: {
    color: theme.primary,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bgChakraSection: {
    marginTop: 12,
  },
  bgChakraLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  guidanceBlock: {
    marginBottom: 4,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  guidanceLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  guidanceMainText: {
    color: theme.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  guidanceContextText: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  guidanceRitualBlock: {
    marginBottom: 4,
    backgroundColor: 'rgba(110,191,139,0.06)',
    borderRadius: theme.borderRadius.sm,
    padding: 12,
  },
  guidanceRitualText: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  guidanceFree: {
    color: theme.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  footer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: theme.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 280,
  },
});
