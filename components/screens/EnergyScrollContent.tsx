// components/screens/EnergyScrollContent.tsx
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" background gradients.
// 2. Implemented "Midnight Slate" for the Snapshot anchor card.
// 3. Implemented "Atmosphere" wash for active domains and "Stratosphere" for Chakra cards.
// 4. Implemented Recessed Voids for locked domains to create physical depth.
// 5. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 6. Redesigned free-tier lock banners to use crisp Atmosphere borders.

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SkiaGradient as LinearGradient } from '../ui/SkiaGradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/core';

import { type AppTheme } from '../../constants/theme';
import SkiaMetallicPill from '../ui/SkiaMetallicPill';
import { supabaseDb } from '../../services/storage/supabaseDb';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { usePremium } from '../../context/PremiumContext';
import { MetallicIcon } from '../ui/MetallicIcon';
import { GoldSubtitle } from '../ui/GoldSubtitle';
import { MetallicText } from '../ui/MetallicText';
import { VelvetGlassSurface } from '../ui/VelvetGlassSurface';
import {
  EnergyEngine,
  EnergySnapshot,
  EnergyIntensity,
  ChakraReading,
  BehaviorContext,
} from '../../services/energy/energyEngine';
import { logger } from '../../utils/logger';
import { getCheckInDateString } from '../../utils/dateUtils';
import ChakraWheelComponent from '../ui/ChakraWheel';
import { SkiaChakraGlyph } from '../ui/SkiaChakraNode';
import { useCorrelationStore } from '../../store/correlationStore';
import { updateWidgetData } from '../../services/widgets/widgetDataService';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

const CorrelationGyroscope = React.lazy(() =>
  import('../ui/CorrelationGyroscope').then(m => ({ default: m.CorrelationGyroscope }))
);

/* ── Constants ── */
const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = SCREEN_W * 0.75;

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Metallic Brand Gold
  atmosphere: '#A2C2E1', // Icy Blue
  stratosphere: '#5C7CAA', // Deep Slate Blue
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
};

function safeHaptic() {
  Haptics.selectionAsync().catch(() => {});
}

/* ════════════════════════════════════════════════
   PROPS
   ════════════════════════════════════════════════ */
interface EnergyScrollContentProps {
  embedded?: boolean;
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */
export function EnergyScrollContent({ embedded = false }: EnergyScrollContentProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { isPremium } = usePremium();
  
  // Semantic Lunar Sky Gradients
  const energyPanelGradients = {
    primary: theme.isDark ? ['rgba(162, 194, 225, 0.15)', 'rgba(162, 194, 225, 0.05)'] : ['rgba(240, 245, 252, 0.7)', 'rgba(240, 245, 252, 0.4)'], // Atmosphere Wash
    secondary: theme.isDark ? ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.3)'] : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.05)'], // Recessed Void
    snapshot: theme.isDark ? ['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)'] : ['rgba(240, 245, 252, 0.9)', 'rgba(240, 245, 252, 0.6)'], // Midnight Slate
    stratosphere: theme.isDark ? ['rgba(92, 124, 170, 0.20)', 'rgba(92, 124, 170, 0.05)'] : ['rgba(240, 245, 252, 0.7)', 'rgba(240, 245, 252, 0.4)'], // Stratosphere
  } as const;

  const syncCorrelations = useCorrelationStore((s) => s.syncCorrelations);
  const hasCorrelationData = useCorrelationStore((s) => s.correlations.length > 0);

  const [loading, setLoading] = useState(true);
  const [hasChart, setHasChart] = useState(false);
  const [snapshot, setSnapshot] = useState<EnergySnapshot | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [expandedDomain, setExpandedDomain] = useState<number | null>(null);
  const [wheelTooltip, setWheelTooltip] = useState<string | null>(null);
  const wheelTooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const INTENSITY_META: Record<EnergyIntensity, { label: string; color: string }> = {
    Low: { label: 'Low Intensity', color: theme.success },
    Moderate: { label: 'Steady Intensity', color: theme.silverBlue },
    High: { label: 'Elevated Intensity', color: theme.error },
  };

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
          const charts = await supabaseDb.getCharts();
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
            const today = getCheckInDateString();
            const checkIn = await supabaseDb.getCheckInByDate(today, saved.id);
            const recentCheckIns = await supabaseDb.getCheckIns(saved.id, 7);

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
          const transitShort = snap.primaryDriver.split(' activating')[0].split(' ·')[0];
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
          <VelvetGlassSurface style={[styles.card, styles.cardPad]} intensity={25}>
            <LinearGradient colors={energyPanelGradients.primary as any} style={StyleSheet.absoluteFill} />
            <Text style={styles.heroToneText}>Energy needs your birth info</Text>
            <Text style={[styles.body, { marginTop: 8 }]}>
              Add your birth info to unlock your personal energy weather {'—'} chakra awareness, domain tracking, and daily guidance.
            </Text>
            <SkiaMetallicPill
              label="Create Chart"
              onPress={() => { safeHaptic(); router.push('/(tabs)/home' as Href); }}
              icon={<Ionicons name="add-circle-outline" size={16} color="#1A1815" />}
              style={{ marginTop: 16 }}
              labelStyle={{ fontSize: 15 }}
            />
          </VelvetGlassSurface>
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

      {/* ═══ HUB 2 — ENERGY WEATHER (Midnight Slate Anchor) ═══ */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)} style={contentStyle}>
        <VelvetGlassSurface style={styles.snapshotCard} intensity={25}>
          <LinearGradient colors={energyPanelGradients.snapshot as any} style={StyleSheet.absoluteFill} />
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
        </VelvetGlassSurface>
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

      {/* ═══ HUB 4 — CHAKRA FOCUS TODAY (Stratosphere Wash) ═══ */}
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
            <VelvetGlassSurface style={[styles.card, styles.cardPad]} intensity={25}>
              <LinearGradient colors={energyPanelGradients.primary as any} style={StyleSheet.absoluteFill} />
              <View style={[styles.lockBanner, { borderColor: PALETTE.atmosphere }]}>
                <Ionicons name="sparkles-outline" size={14} color={PALETTE.atmosphere} />
                <Text style={styles.lockText}>All 7 chakras with body cues and triggers</Text>
              </View>
              <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', marginTop: 10 }}>
                Your birth data activates specific energy centers {'—'} see which ones need attention today
              </Text>
            </VelvetGlassSurface>
          )}
        </Animated.View>

        {/* ═══ HUB 5 — NEURAL PATTERNS ═══ */}
        {isPremium && hasCorrelationData && (
          <>
            <SectionHeader icon="analytics-outline" title="Neural Patterns" delay={460} />
            <Animated.View entering={FadeInDown.delay(480).duration(600)} style={{ marginBottom: 16 }}>
              <Suspense fallback={<ActivityIndicator color={PALETTE.atmosphere} style={{ height: 280 }} />}>
                <CorrelationGyroscope height={280} />
              </Suspense>
            </Animated.View>
          </>
        )}

        {/* ═══ HUB 7 — ENERGY BY DOMAIN (Atmosphere Wash & Recessed Voids) ═══ */}
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
                  safeHaptic();
                  if (isLocked) {
                    router.push('/(tabs)/premium' as Href);
                    return;
                  }
                  setExpandedDomain(isExpanded ? null : idx);
                }}
              >
                <VelvetGlassSurface style={[styles.card, { padding: 16, marginBottom: 8 }]} intensity={isLocked ? 10 : 25}>
                  <LinearGradient
                    colors={isLocked ? energyPanelGradients.secondary : energyPanelGradients.primary as any}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.domainRow}>
                    <View style={[styles.domainIconWrap, isLocked && { backgroundColor: 'transparent' }]}>
                      <Ionicons
                        name={(d.icon as keyof typeof Ionicons.glyphMap) || 'ellipse'}
                        size={20}
                        color={isLocked ? 'rgba(255,255,255,0.2)' : PALETTE.atmosphere}
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
                      color={isLocked ? 'rgba(255,255,255,0.2)' : PALETTE.atmosphere}
                    />
                  </View>
                  {isExpanded && !isLocked && (
                    <Animated.View entering={FadeInDown.duration(300)} style={styles.domainExpanded}>
                      <Text style={styles.body}>{d.feeling}</Text>
                      <View style={styles.domainWhyRow}>
                        <Ionicons name="information-circle-outline" size={14} color={PALETTE.atmosphere} />
                        <Text style={styles.domainWhyText}>{d.why}</Text>
                      </View>
                      <View style={styles.domainSuggestionRow}>
                        <MetallicIcon name="bulb-outline" size={14} variant="green" />
                        <GoldSubtitle style={styles.domainSuggestionText}>{d.suggestion}</GoldSubtitle>
                      </View>
                    </Animated.View>
                  )}
                </VelvetGlassSurface>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* ═══ HUB 8 — ENERGY GUIDANCE (Atmosphere Wash) ═══ */}
        <SectionHeader icon="compass-outline" title="Energy Guidance" delay={560} />
        <Animated.View entering={FadeInDown.delay(580).duration(600)}>
          <VelvetGlassSurface style={[styles.card, styles.cardPad]} intensity={25}>
            <LinearGradient colors={energyPanelGradients.primary as any} style={StyleSheet.absoluteFill} />
            {isPremium ? (
              <>
                <GuidanceBlock icon="arrow-up-outline" label="Lean into" text={snapshot.guidance.leanInto} context={snapshot.guidance.leanIntoContext} color={theme.success} />
                <View style={styles.divider} />
                <GuidanceBlock icon="hand-left-outline" label="Move gently around" text={snapshot.guidance.moveGentlyAround} context={snapshot.guidance.moveGentlyContext} color={theme.error} />
                <View style={styles.divider} />
                <GuidanceBlock icon="flash-outline" label="Best use of energy" text={snapshot.guidance.bestUseOfEnergy} context={snapshot.guidance.bestUseContext} color={PALETTE.atmosphere} />
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
                <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                  <View style={[styles.lockBanner, { marginTop: 12, backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(162, 194, 225, 0.3)' }]}>
                    <Ionicons name="sparkles-outline" size={14} color={PALETTE.atmosphere} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.lockText, { fontWeight: '600', color: PALETTE.atmosphere }]}>Full guidance includes:</Text>
                      <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                        Lean into · Move gently around · Best use of energy · Today's micro-ritual
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward-outline" size={14} color={PALETTE.atmosphere} />
                  </View>
                </Pressable>
              </>
            )}
          </VelvetGlassSurface>
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
  const styles = useThemedStyles(createStyles);
  const content = (
    <View style={styles.sectionTitleRow}>
      <MetallicIcon name={icon as any} size={18} variant="gold" />
      <MetallicText style={styles.sectionTitle} variant="gold">{title}</MetallicText>
    </View>
  );
  if (delay != null) {
    return <Animated.View entering={FadeInDown.delay(delay).duration(600)}>{content}</Animated.View>;
  }
  return content;
}

type ChakraRole = 'primary' | 'secondary' | 'background';

function ChakraCard({ chakra, highlight, role }: { chakra: ChakraReading; highlight?: boolean; role?: ChakraRole }) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const resolvedRole = highlight ? 'primary' : (role ?? 'background');
  
  // Stratosphere Wash for Chakra Bioluminescence
  const chakraCardGradient = theme.isDark
    ? ['rgba(92, 124, 170, 0.20)', 'rgba(92, 124, 170, 0.05)']
    : ['rgba(240, 245, 252, 0.7)', 'rgba(240, 245, 252, 0.4)'];

  if (resolvedRole === 'background') {
    return (
      <VelvetGlassSurface style={[styles.card, { padding: 14, marginBottom: 6 }]} intensity={25}>
        <LinearGradient colors={chakraCardGradient as any} style={StyleSheet.absoluteFill} />
        <View style={styles.chakraHeader}>
          <SkiaChakraGlyph name={chakra.name} size={34} variant="vivid" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.chakraName, { fontSize: 14, color: theme.textPrimary }]}>{chakra.name}</Text>
            <Text style={[styles.bodyMuted, { fontSize: 12, marginTop: 1, color: theme.textSecondary }]}>
              {chakra.state === 'Quiet' ? 'Remains steady' : chakra.state === 'Flowing' ? 'Energy moving freely' : chakra.state}
            </Text>
          </View>
          <View style={[styles.chakraStateDot, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.60)' : theme.textMuted }]} />
        </View>
      </VelvetGlassSurface>
    );
  }

  if (resolvedRole === 'secondary') {
    return (
      <VelvetGlassSurface style={[styles.card, styles.cardPad, { marginBottom: 8 }]} intensity={25}>
        <LinearGradient colors={chakraCardGradient as any} style={StyleSheet.absoluteFill} />
        <View style={styles.chakraHeader}>
          <SkiaChakraGlyph name={chakra.name} size={42} variant="vivid" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.chakraName, { color: theme.textPrimary }]}>{chakra.name}</Text>
            <View style={styles.chakraStateRow}>
              <View style={[styles.chakraStateDot, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.60)' : theme.textMuted }]} />
              <Text style={[styles.chakraStateText, { color: theme.textSecondary }]}>{chakra.state}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.bodyMuted, { marginTop: 6, color: theme.textSecondary }]}> 
          You may notice: {chakra.bodyCue.charAt(0).toLowerCase() + chakra.bodyCue.slice(1)}
        </Text>
        <View style={styles.chakraDetailRow}>
          <Ionicons name="heart-outline" size={13} color={theme.isDark ? 'rgba(255,255,255,0.70)' : theme.textMuted} />
          <Text style={[styles.chakraDetailText, { color: theme.textPrimary }]}>{chakra.healingSuggestion}</Text>
        </View>
      </VelvetGlassSurface>
    );
  }

  const cueItems = chakra.bodyCue
    .split(/[,;]|(?<=\.)\s+/)
    .map(s => s.trim().replace(/\.$/, ''))
    .filter(s => s.length > 3);

  return (
    <VelvetGlassSurface style={[styles.card, styles.cardPad, { marginBottom: 10 }]} intensity={25}>
      <LinearGradient colors={chakraCardGradient as any} style={StyleSheet.absoluteFill} />
      <Text style={[styles.focusRoleLabel, { color: PALETTE.atmosphere }]}>Primary Focus Today</Text>
      <View style={styles.focusHeaderBlock}>
        <SkiaChakraGlyph name={chakra.name} size={64} variant="vivid" />
        <Text style={[styles.focusChakraName, { color: theme.textPrimary }]}>{chakra.name}</Text>
      </View>
      <View style={styles.focusStateBadge}>
        <View style={[styles.focusStateDot, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.55)' : theme.textMuted }]} />
        <Text style={[styles.focusStateText, { color: theme.textPrimary }]}>{chakra.state}</Text>
      </View>

      <View style={[styles.focusDivider, { borderTopColor: 'rgba(255,255,255,0.1)', borderTopWidth: StyleSheet.hairlineWidth }]} />
      <Text style={[styles.focusSectionLabel, { color: theme.isDark ? 'rgba(255,255,255,0.65)' : theme.textMuted }]}>What you may notice</Text>
      {cueItems.length > 1 ? (
        cueItems.map((item, i) => (
          <View key={i} style={styles.focusBulletRow}>
            <Text style={[styles.focusBulletDot, { color: theme.isDark ? 'rgba(255,255,255,0.55)' : theme.textMuted }]}>{'•'}</Text>
            <Text style={[styles.focusBulletText, { color: theme.textPrimary }]}>{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
          </View>
        ))
      ) : (
        <Text style={[styles.focusBodyText, { color: theme.textPrimary }]}> 
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
    </VelvetGlassSurface>
  );
}

function GuidanceBlock({ icon, label, text, context, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; text: string; context?: string; color: string }) {
  const styles = useThemedStyles(createStyles);
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
const createStyles = (theme: AppTheme) => StyleSheet.create({
  inlineLoading: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  contentEmbedded: {},

  somaticHeader: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  somaticPrompt: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },

  card: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopColor: 'rgba(255,255,255,0.2)', // Velvet Glass light-catch
    marginBottom: theme.spacing.md,
  },
  cardPad: {
    padding: theme.spacing.lg,
  },

  snapshotCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopColor: 'rgba(255,255,255,0.2)',
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  toneLabel: {
    color: theme.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  intensityBadge: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  meaningText: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  heroToneText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
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
    color: 'rgba(255,255,255,0.3)',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: theme.isDark ? 'rgba(20,32,52,0.92)' : '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
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
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.pillSurface,
  },
  domainName: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  domainState: {
    color: PALETTE.atmosphere,
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
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  domainWhyText: {
    flex: 1,
    color: PALETTE.atmosphere,
    fontSize: 13,
    lineHeight: 18,
  },
  domainSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  domainSuggestionText: {
    flex: 1,
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
    color: PALETTE.atmosphere,
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
    color: PALETTE.atmosphere,
    fontSize: 14,
    lineHeight: 20,
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
    backgroundColor: 'rgba(107,144,128,0.08)',
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(107,144,128,0.2)',
  },
  guidanceRitualText: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  guidanceFree: {
    color: theme.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 280,
  },
});
