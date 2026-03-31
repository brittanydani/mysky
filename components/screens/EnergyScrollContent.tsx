// components/screens/EnergyScrollContent.tsx
//
// Extracted energy screen content — renders everything inside the ScrollView
// (Hub 1 through footer). Used by both the standalone Energy tab screen and
// the embedded Energy pill inside the Identity (Blueprint) tab.

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SkiaGradient as LinearGradient } from '../ui/SkiaGradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import SkiaMetallicPill from '../ui/SkiaMetallicPill';
import { localDb } from '../../services/storage/localDb';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { usePremium } from '../../context/PremiumContext';
import { MetallicIcon } from '../ui/MetallicIcon';
import { MetallicText } from '../ui/MetallicText';
import {
  EnergyEngine,
  EnergySnapshot,
  EnergyIntensity,
  ChakraReading,
  BehaviorContext,
} from '../../services/energy/energyEngine';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';
import ChakraWheelComponent from '../ui/ChakraWheel';
import { SkiaChakraGlyph } from '../ui/SkiaChakraNode';
import { useCorrelationStore } from '../../store/correlationStore';
import { updateWidgetData } from '../../services/widgets/widgetDataService';

const CorrelationGyroscope = React.lazy(() =>
  import('../ui/CorrelationGyroscope').then(m => ({ default: m.CorrelationGyroscope }))
);

/* ── Constants ── */
const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = SCREEN_W * 0.75;

const INTENSITY_META: Record<EnergyIntensity, { label: string; color: string }> = {
  Low:      { label: 'Low Intensity',      color: theme.calm },
  Moderate: { label: 'Steady Intensity',   color: theme.okay },
  High:     { label: 'Elevated Intensity', color: theme.stormy },
};

function safeHaptic() {
  Haptics.selectionAsync().catch(() => {});
}

/* ════════════════════════════════════════════════
   PROPS
   ════════════════════════════════════════════════ */
interface EnergyScrollContentProps {
  /** When true, skips inner horizontal padding (parent already provides it). */
  embedded?: boolean;
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */
export function EnergyScrollContent({ embedded = false }: EnergyScrollContentProps) {
  const router = useRouter();
  const { isPremium } = usePremium();
  const syncCorrelations = useCorrelationStore((s) => s.syncCorrelations);
  const hasCorrelationData = useCorrelationStore((s) => s.correlations.length > 0);

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

  useFocusEffect(
    useCallback(() => {
      Haptics.selectionAsync().catch(() => {});
      syncCorrelations();

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
          const storedName = await EncryptedAsyncStorage.getItem('msky_user_name').catch(() => null);
          setUserName(storedName?.trim() || saved?.name?.split(' ')[0] || '');
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
          const astroSettings = await AstrologySettingsService.getSettings();
          const natal = AstrologyCalculator.generateNatalChart({ ...birthData, zodiacSystem: astroSettings.zodiacSystem, orbPreset: astroSettings.orbPreset });

          let behavior: BehaviorContext | undefined;
          try {
            const today = toLocalDateString(new Date());
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
            logger.error('Behavior context load failed (non-critical):', e);
          }

          const snap = EnergyEngine.generateSnapshot(natal, new Date(), behavior);
          setSnapshot(snap);

          const energyLevelMap: Record<EnergyIntensity, number> = {
            Low: 0.3, Moderate: 0.6, High: 0.9,
          };
          const transitShort = snap.primaryDriver
            .split(' activating')[0]
            .split(' ·')[0];
          const chakraHex = snap.dominantChakra.color.replace('#', '');
          updateWidgetData({
            energyLevel: energyLevelMap[snap.intensity],
            focusTitle:  snap.dominantChakra.name,
            transit:     transitShort,
            statusText:  snap.dominantChakra.state,
            captionText: snap.quickMeaning,
            orbColorR:   parseInt(chakraHex.substring(0, 2), 16) / 255,
            orbColorG:   parseInt(chakraHex.substring(2, 4), 16) / 255,
            orbColorB:   parseInt(chakraHex.substring(4, 6), 16) / 255,
          });
        } catch (e) {
          logger.error('Energy load failed:', e);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [syncCorrelations])
  );

  /* ── No-chart inline state ── */
  if (!loading && !hasChart) {
    return (
      <>
        <Animated.View entering={FadeIn.duration(1000)} style={styles.somaticHeader}>
          <Text style={styles.somaticPrompt}>Your energy mirror awaits</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.50)']} style={[styles.card, styles.cardPad]}>
            <Text style={styles.heroToneText}>Energy needs your birth info</Text>
            <Text style={[styles.body, { marginTop: 8 }]}>
              Add your birth info to unlock your personal energy weather {'—'} chakra awareness, domain tracking, and daily guidance.
            </Text>
            <SkiaMetallicPill
              label="Create Chart"
              onPress={() => { safeHaptic(); router.push('/(tabs)/home' as Href); }}
              icon={<Ionicons name="add-circle-outline" size={16} color="#020817" />}
              style={{ marginTop: 16 }}
              labelStyle={{ fontSize: 15 }}
            />
          </LinearGradient>
        </Animated.View>
      </>
    );
  }

  /* ── Loading inline state ── */
  if (loading || !snapshot) {
    return (
      <View style={styles.inlineLoading}>
        <Text style={styles.body}>Reading your energy{'…'}</Text>
      </View>
    );
  }

  /* ── Derived values ── */
  const intensityMeta = INTENSITY_META[snapshot.intensity];
  const contentStyle = embedded ? styles.contentEmbedded : styles.content;

  return (
    <>
      {/* ═══ HUB 1 — SOMATIC ANCHOR ═══ */}
      <Animated.View entering={FadeIn.duration(1000)} style={styles.somaticHeader}>
        <Text style={styles.somaticPrompt}>
          {userName ? `${userName}, focus inward` : 'Focus your awareness internally'}...
        </Text>
      </Animated.View>

      {/* ═══ HUB 2 — ENERGY WEATHER ═══ */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)} style={contentStyle}>
        <LinearGradient
          colors={['rgba(212,184,114,0.10)', 'rgba(10,10,12,0.80)']}
          style={styles.snapshotCard}
        >
          <Text style={styles.toneLabel}>{snapshot.tone}</Text>
          {intensityMeta.color === '#FFFFFF' ? (
            <Text style={[styles.intensityBadge, { color: intensityMeta.color }]}>
              {intensityMeta.label}
            </Text>
          ) : (
            <MetallicText style={styles.intensityBadge} color={intensityMeta.color}>
              {intensityMeta.label}
            </MetallicText>
          )}
          <Text style={styles.meaningText}>{snapshot.quickMeaning}</Text>
        </LinearGradient>
      </Animated.View>

      {/* ═══ HUB 3 — CHAKRA WHEEL ═══ */}
      <Animated.View entering={FadeInDown.delay(300).duration(600)}>
        <Pressable
          style={styles.wheelContainer}
          onPress={() => {
            safeHaptic();
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
            <Animated.View entering={FadeInDown.duration(300)} style={styles.wheelTooltip}>
              <Text style={styles.wheelTooltipText}>{wheelTooltip}</Text>
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>

      {/* ═══ HUB 4 — CHAKRA FOCUS TODAY ═══ */}
      <View style={contentStyle}>
        <SectionHeader icon="body-outline" title="Today's Focus" delay={360} />
        <Animated.View entering={FadeInDown.delay(380).duration(600)}>
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
            <LinearGradient colors={['rgba(232,214,174,0.08)', 'rgba(232,214,174,0.03)']} style={[styles.card, styles.cardPad, { borderColor: 'rgba(232,214,174,0.18)' }]}>
              <View style={styles.lockBanner}>
                <Ionicons name="sparkles-outline" size={14} color={theme.primary} />
                <Text style={styles.lockText}>All 7 chakras with body cues and triggers</Text>
              </View>
              <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', marginTop: 6 }}>
                Your birth data activates specific energy centers {'—'} see which ones need attention today
              </Text>
            </LinearGradient>
          )}
        </Animated.View>

        {/* ═══ HUB 5 — NEURAL PATTERNS (Premium, only with real data) ═══ */}
        {isPremium && hasCorrelationData && (
          <>
            <SectionHeader icon="analytics-outline" title="Neural Patterns" delay={460} />
            <Animated.View entering={FadeInDown.delay(480).duration(600)} style={{ marginBottom: 16 }}>
              <Suspense fallback={<ActivityIndicator color={theme.primary} style={{ height: 280 }} />}>
                <CorrelationGyroscope height={280} />
              </Suspense>
            </Animated.View>
          </>
        )}

        {/* ═══ HUB 7 — ENERGY BY DOMAIN ═══ */}
        <SectionHeader icon="grid-outline" title="Energy Domains" delay={500} />
        <Animated.View entering={FadeInDown.delay(520).duration(600)}>
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
                    ? ['rgba(10,18,36,0.5)', 'rgba(13,20,33,0.5)']
                    : ['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.50)']
                  }
                  style={[styles.card, { padding: 16, marginBottom: 8 }]}
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
                        {isLocked ? '••••••' : d.state}
                      </Text>
                    </View>
                    <Ionicons
                      name={isLocked ? 'lock-closed' : isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={isLocked ? theme.textMuted : theme.primary}
                    />
                  </View>
                  {isExpanded && !isLocked && (
                    <Animated.View entering={FadeInDown.duration(300)} style={styles.domainExpanded}>
                      <Text style={styles.body}>{d.feeling}</Text>
                      <View style={styles.domainWhyRow}>
                        <Ionicons name="information-circle-outline" size={14} color={theme.primary} />
                        <Text style={styles.domainWhyText}>{d.why}</Text>
                      </View>
                      <View style={styles.domainSuggestionRow}>
                        <MetallicIcon name="bulb-outline" size={14} variant="green" />
                        <Text style={styles.domainSuggestionText}>{d.suggestion}</Text>
                      </View>
                    </Animated.View>
                  )}
                </LinearGradient>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* ═══ HUB 8 — ENERGY GUIDANCE ═══ */}
        <SectionHeader icon="compass-outline" title="Energy Guidance" delay={560} />
        <Animated.View entering={FadeInDown.delay(580).duration(600)}>
          <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.50)']} style={[styles.card, styles.cardPad]}>
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
                    <MetallicIcon name="sparkles-outline" size={16} variant="green" />
                    <MetallicText style={styles.guidanceLabel} variant="green">{"Today\u2019s Micro-Ritual"}</MetallicText>
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
                  <View style={[styles.lockBanner, { marginTop: 12, backgroundColor: 'transparent', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 }]}>
                    <Ionicons name="sparkles-outline" size={14} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.lockText, { fontWeight: '600' }]}>Full guidance includes:</Text>
                      <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                        Lean into · Move gently around · Best use of energy · Today's micro-ritual
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward-outline" size={14} color={theme.primary} />
                  </View>
                </Pressable>
              </>
            )}
          </LinearGradient>
        </Animated.View>

        {/* ── Footer ── */}
        <Animated.View entering={FadeInDown.delay(620).duration(600)} style={styles.footer}>
          <Text style={styles.footerText}>
            Energy is not a forecast {'—'} it is a mirror. Your personal framework creates conditions; you decide what to do with them.
          </Text>
        </Animated.View>
      </View>
    </>
  );
}

/* ════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════ */

function SectionHeader({ icon, title, delay }: { icon: keyof typeof Ionicons.glyphMap; title: string; delay?: number }) {
  const content = (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
  if (delay != null) {
    return <Animated.View entering={FadeInDown.delay(delay).duration(600)}>{content}</Animated.View>;
  }
  return content;
}

type ChakraRole = 'primary' | 'secondary' | 'background';

function ChakraCard({ chakra, highlight, role }: { chakra: ChakraReading; highlight?: boolean; role?: ChakraRole }) {
  const resolvedRole = highlight ? 'primary' : (role ?? 'background');

  if (resolvedRole === 'background') {
    return (
      <LinearGradient
        colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.50)']}
        style={[styles.card, { padding: 14, marginBottom: 6 }]}
      >
        <View style={styles.chakraHeader}>
          <SkiaChakraGlyph name={chakra.name} size={34} variant="vivid" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.chakraName, { fontSize: 14, color: 'rgba(255,255,255,0.95)' }]}>{chakra.name}</Text>
            <Text style={[styles.bodyMuted, { fontSize: 12, marginTop: 1, color: 'rgba(255,255,255,0.70)' }]}>
              {chakra.state === 'Quiet' ? 'Remains steady' : chakra.state === 'Flowing' ? 'Energy moving freely' : chakra.state}
            </Text>
          </View>
          <View style={[styles.chakraStateDot, { backgroundColor: 'rgba(255,255,255,0.60)' }]} />
        </View>
      </LinearGradient>
    );
  }

  if (resolvedRole === 'secondary') {
    return (
      <LinearGradient
        colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.50)']}
        style={[styles.card, styles.cardPad, { marginBottom: 8 }]}
      >
        <View style={styles.chakraHeader}>
          <SkiaChakraGlyph name={chakra.name} size={42} variant="vivid" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.chakraName, { color: '#fff' }]}>{chakra.name}</Text>
            <View style={styles.chakraStateRow}>
              <View style={[styles.chakraStateDot, { backgroundColor: 'rgba(255,255,255,0.60)' }]} />
              <Text style={[styles.chakraStateText, { color: 'rgba(255,255,255,0.85)' }]}>{chakra.state}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.bodyMuted, { marginTop: 6, fontStyle: 'italic', color: 'rgba(255,255,255,0.80)' }]}>
          You may notice: {chakra.bodyCue.charAt(0).toLowerCase() + chakra.bodyCue.slice(1)}
        </Text>
        <View style={styles.chakraDetailRow}>
          <Ionicons name="heart-outline" size={13} color="rgba(255,255,255,0.70)" />
          <Text style={[styles.chakraDetailText, { color: 'rgba(255,255,255,0.85)' }]}>{chakra.healingSuggestion}</Text>
        </View>
      </LinearGradient>
    );
  }

  const cueItems = chakra.bodyCue
    .split(/[,;]|(?<=\.)\s+/)
    .map(s => s.trim().replace(/\.$/, ''))
    .filter(s => s.length > 3);

  return (
    <LinearGradient
      colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.50)']}
      style={[styles.card, styles.cardPad, { marginBottom: 10 }]}
    >
      <Text style={[styles.focusRoleLabel, { color: 'rgba(255,255,255,0.75)' }]}>Primary Focus Today</Text>
      <View style={styles.focusHeaderBlock}>
        <SkiaChakraGlyph name={chakra.name} size={64} variant="vivid" />
        <Text style={[styles.focusChakraName, { color: '#fff' }]}>{chakra.name}</Text>
      </View>
      <View style={styles.focusStateBadge}>
        <View style={[styles.focusStateDot, { backgroundColor: 'rgba(255,255,255,0.55)' }]} />
        <Text style={[styles.focusStateText, { color: 'rgba(255,255,255,0.90)' }]}>{chakra.state}</Text>
      </View>

      <View style={[styles.focusDivider, { borderTopColor: 'rgba(255,255,255,0.20)', borderTopWidth: StyleSheet.hairlineWidth }]} />
      <Text style={[styles.focusSectionLabel, { color: 'rgba(255,255,255,0.65)' }]}>What you may notice</Text>
      {cueItems.length > 1 ? (
        cueItems.map((item, i) => (
          <View key={i} style={styles.focusBulletRow}>
            <Text style={[styles.focusBulletDot, { color: 'rgba(255,255,255,0.55)' }]}>{'•'}</Text>
            <Text style={[styles.focusBulletText, { color: 'rgba(255,255,255,0.90)' }]}>{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
          </View>
        ))
      ) : (
        <Text style={[styles.focusBodyText, { color: 'rgba(255,255,255,0.90)' }]}>
          You may notice {chakra.bodyCue.charAt(0).toLowerCase() + chakra.bodyCue.slice(1)}
        </Text>
      )}

      <View style={styles.focusDivider} />
      <Text style={styles.focusSectionLabel}>Why</Text>
      <Text style={styles.focusWhyText}>{chakra.elementConnection}</Text>

      <View style={styles.focusDivider} />
      <Text style={styles.focusSectionLabel}>What helps</Text>
      <View style={styles.focusBulletRow}>
        <Text style={styles.focusBulletDot}>{'•'}</Text>
        <Text style={styles.focusHelpText}>{chakra.healingSuggestion}</Text>
      </View>
      {chakra.groundingTip ? (
        <View style={[styles.focusBulletRow, { marginTop: 4 }]}>
          <Text style={styles.focusBulletDot}>{'•'}</Text>
          <Text style={styles.focusHelpText}>{chakra.groundingTip}</Text>
        </View>
      ) : null}

      {chakra.affirmation ? (
        <View style={styles.affirmationWrap}>
          <Text style={styles.affirmationText}>{'"'}{chakra.affirmation}{'"'}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

function GuidanceBlock({ icon, label, text, context, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; text: string; context?: string; color: string }) {
  const isWhite = color === '#FFFFFF';
  return (
    <View style={styles.guidanceBlock}>
      <View style={styles.guidanceHeader}>
        {isWhite ? (
          <Ionicons name={icon} size={16} color={color} />
        ) : (
          <MetallicIcon name={icon} size={16} color={color} />
        )}
        {isWhite ? (
          <Text style={[styles.guidanceLabel, { color }]}>{label}</Text>
        ) : (
          <MetallicText style={styles.guidanceLabel} color={color}>{label}</MetallicText>
        )}
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
  inlineLoading: {
    paddingVertical: 48,
    alignItems: 'center',
  },

  /* ── Content padding variants ── */
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  contentEmbedded: {
    // no extra horizontal padding — parent (blueprint) already provides it
  },

  /* ── Somatic anchor ── */
  somaticHeader: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  somaticPrompt: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
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

  /* ── Snapshot card ── */
  snapshotCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: theme.spacing.md,
  },
  toneLabel: {
    color: theme.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  intensityBadge: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  meaningText: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  heroToneText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },

  body: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  bodyMuted: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  textLocked: {
    color: theme.textMuted,
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
    backgroundColor: 'transparent',
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
    borderColor: 'rgba(232,214,174,0.18)',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: 'transparent',
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
