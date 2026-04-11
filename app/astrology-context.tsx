import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SkiaGradient as LinearGradient, SkiaGradient } from '../components/ui/SkiaGradient';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import MaskedView from '@react-native-masked-view/masked-view';
import { metallicFillColors, metallicFillPositions } from '../constants/mySkyMetallic';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getMoonPhaseInfo, getMoonSignForDate } from '../utils/moonPhase';
import { getTransitInfo } from '../services/astrology/transits';
import { signNameFromLongitude, degreeInSign, normalize360 } from '../services/astrology/sharedHelpers';
import MoonPhaseView from '../components/ui/MoonPhaseView';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { localDb } from '../services/storage/localDb';
import { AdvancedJournalAnalyzer, PatternInsight, JournalEntryMeta, MoodLevel, TransitSnapshot } from '../services/premium/advancedJournal';
import { usePremium } from '../context/PremiumContext';
import { useFocusEffect } from '@react-navigation/core';
import { dayOfYear, toLocalDateString } from '../utils/dateUtils';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

type TransitCoordinates = {
  latitude: number;
  longitude: number;
};

// ── Rotating daily reflection prompts ──
const REFLECTION_PROMPTS = [
  'What felt most charged for you today?',
  'Where did you notice tension — and what was underneath it?',
  'What restored your energy today?',
  'What are you quietly proud of, even if no one else noticed?',
  'What did you want to say but held back?',
  'Who or what brought a moment of ease today?',
  'What do you want to release before tomorrow?',
];

function getDailyPrompt(): string {
  const currentDayOfYear = dayOfYear();
  return REFLECTION_PROMPTS[currentDayOfYear % REFLECTION_PROMPTS.length];
}

// Mean lunar velocity ≈ 13.176°/day → hours per degree
const MOON_DEG_PER_HOUR = 13.176 / 24;

/**
 * Estimate hours until the Moon enters the next sign.
 * Returns null when the longitude is unavailable.
 */
function hoursUntilMoonIngress(moonLon: number): number {
  const degLeft = 30 - degreeInSign(normalize360(moonLon));
  return degLeft / MOON_DEG_PER_HOUR;
}

function formatHoursMinutes(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ── Planet metadata ─────────────────────────────────────────────────────────
const PLANET_META: Record<string, { symbol: string; color: string }> = {
  Sun:     { symbol: '☉', color: '#D4B872' },
  Moon:    { symbol: '☽', color: '#A8C0D6' },
  Mercury: { symbol: '☿', color: '#B0C4DE' },
  Venus:   { symbol: '♀', color: '#D4A0A0' },
  Mars:    { symbol: '♂', color: '#C87272' },
};

// ── Planet-in-sign interpretations (personal planets × 12 signs) ────────────
const TRANSIT_IMPACT: Record<string, Record<string, string>> = {
  Sun: {
    Aries:       'Identity sharpens. Bold initiatives and fresh beginnings are favored.',
    Taurus:      'Life force grounds into patience, sensory pleasure, and slow-built momentum.',
    Gemini:      'Vitality flows into curiosity, language, and many simultaneous threads.',
    Cancer:      'The self turns inward — nurturing, protecting, and feeling deeply.',
    Leo:         'Creative self-expression and the need to be authentically seen are amplified.',
    Virgo:       'Attention narrows to detail, craft, and acts of grounded, useful service.',
    Libra:       'Harmony, beauty, and the art of relationship come into sharp focus.',
    Scorpio:     'The self dives into depth, transformation, and the reckoning with shadow.',
    Sagittarius: 'Expansion, philosophy, and the restless search for meaning are electrified.',
    Capricorn:   'Discipline and long-term ambition receive the full support of the life force.',
    Aquarius:    'Innovation, ideals, and collective thinking captivate the identity field.',
    Pisces:      'Boundaries thin. Intuition, compassion, and spiritual surrender lead the way.',
  },
  Moon: {
    Aries:       'Emotions flare quickly. Reactions feel urgent and impulses arrive fast.',
    Taurus:      'A deep need for physical comfort, sensory beauty, and grounding emerges.',
    Gemini:      'The inner world turns restless, talkative, and hungry for mental input.',
    Cancer:      'Emotional tides run high. The heart longs for safety, home, and care.',
    Leo:         'Feelings want to be witnessed and celebrated, not quietly contained.',
    Virgo:       'Emotions channel into a desire to organise, refine, and quietly improve.',
    Libra:       'Inner peace depends on harmony — friction feels sharper than usual today.',
    Scorpio:     'Deep emotional processing is underway. Shadows and secrets may surface.',
    Sagittarius: 'Restlessness rises. The soul craves freedom, truth, and wider horizons.',
    Capricorn:   'Emotions quiet to a composed undertone. Structure becomes a source of comfort.',
    Aquarius:    'Detachment and unusual currents color the emotional body today.',
    Pisces:      'The line between feeling and intuition thins. Let impressions move through you.',
  },
  Mercury: {
    Aries:       'Thoughts cut fast and direct. Words may outpace careful consideration.',
    Taurus:      'Mental energy slows into deliberate, thorough, and grounded consideration.',
    Gemini:      'Connection across multiple topics and people is energized and effortless.',
    Cancer:      'The mind draws on memory and emotional intuition rather than pure logic.',
    Leo:         'Thinking turns bold and persuasive; words carry extra creative force.',
    Virgo:       'Analytical and precise — ideal for research, editing, and methodical work.',
    Libra:       'The mind weighs every perspective carefully before committing to a view.',
    Scorpio:     'Thought turns investigative and penetrating. Beneath the surface is where truth lives.',
    Sagittarius: 'Ideas scale to the philosophical. Communication feels broad and impassioned.',
    Capricorn:   'Thinking is strategic, measured, and fixed on practical long-term outcomes.',
    Aquarius:    'Original ideas and unconventional perspectives electrify the mental field.',
    Pisces:      'The mind drifts between vision and logic — dreamlike, receptive, and impressionistic.',
  },
  Venus: {
    Aries:       'Attraction pulses bold and direct. Love wants action and immediate presence.',
    Taurus:      'Sensual pleasures and loyal, embodied affection feel profoundly satisfying.',
    Gemini:      'Flirtatious and curious — connection needs wit, variety, and lively exchange.',
    Cancer:      'Love expresses as nurturing, protective care and deep emotional attunement.',
    Leo:         'Romance craves warmth, grand gestures, and the thrill of being adored.',
    Virgo:       'Love is shown through acts of service and attentive, practical devotion.',
    Libra:       'Beauty, refinement, and partnership flourish in Venus\'s home territory.',
    Scorpio:     'Desire runs deep and consuming. Connection must be intensely authentic.',
    Sagittarius: 'Love craves freedom, adventure, and honest, unfiltered togetherness.',
    Capricorn:   'Affection is expressed through loyalty, reliability, and commitment over time.',
    Aquarius:    'Love values friendship, individuality, and a mind-first kind of intimacy.',
    Pisces:      'Romantic idealism peaks. Love feels transcendent, porous, and spiritually charged.',
  },
  Mars: {
    Aries:       'Drive is at its peak. Physical energy and ambition have no ceiling today.',
    Taurus:      'Determined, slow-burning force builds momentum through patient persistence.',
    Gemini:      'Energy scatters across many threads. Fast-moving, but direction is needed.',
    Cancer:      'Drive is fueled by emotional need — protection and belonging as motivation.',
    Leo:         'Action is bold and theatrical, propelled by pride and creative passion.',
    Virgo:       'Energy is best channeled into precision work, health, and methodical effort.',
    Libra:       'Drive is tempered by the need for consensus. Decisive action is harder today.',
    Scorpio:     'Willpower is formidable, relentless, and deeply strategic. Go all the way.',
    Sagittarius: 'Enthusiasm runs high. Energy propels toward expansion, knowledge, and adventure.',
    Capricorn:   'Ambition channels into structured, disciplined, and goal-oriented persistence.',
    Aquarius:    'Drive is directed toward innovation, reform, and collective or future-focused causes.',
    Pisces:      'Energy flows in waves — intuitive surges, creative momentum, and sacred rest.',
  },
};

// Five personal planets shown in the Cosmic Context panel (ordered by speed).
const PERSONAL_PLANETS = ['Moon', 'Sun', 'Mercury', 'Venus', 'Mars'] as const;

// ── Beginner-friendly planet descriptions ─────────────────────────────────────
const PLANET_GOVERNS: Record<string, string> = {
  Sun:     'your identity, confidence, and life direction',
  Moon:    'your emotions, moods, and inner needs',
  Mercury: 'how you think, communicate, and process information',
  Venus:   'how you love, connect, and find beauty',
  Mars:    'your drive, energy, and what you pursue',
};

// ── Short sign energy descriptors (plain English) ─────────────────────────────
const SIGN_ESSENCE: Record<string, string> = {
  Aries:       'bold, fast-moving Aries brings urgency and a push toward action',
  Taurus:      'grounded Taurus slows things down and craves comfort and stability',
  Gemini:      'curious Gemini adds variety, chatter, and a need for mental stimulation',
  Cancer:      'sensitive Cancer turns attention toward home, safety, and emotional care',
  Leo:         'warm Leo amplifies the need for creative expression and being truly seen',
  Virgo:       'detail-oriented Virgo directs energy toward order, health, and refinement',
  Libra:       'harmonious Libra seeks balance, fairness, and peaceful connection',
  Scorpio:     'deep Scorpio pulls everything beneath the surface — intensity and truth rule',
  Sagittarius: 'freedom-loving Sagittarius expands horizons and sparks the search for meaning',
  Capricorn:   'disciplined Capricorn focuses energy on patience, structure, and long-term goals',
  Aquarius:    'unconventional Aquarius brings detachment, originality, and idealistic thinking',
  Pisces:      'dreamy Pisces softens boundaries and heightens intuition and sensitivity',
};

// ── Sign glyphs ──────────────────────────────────────────────────────────────
const SIGN_SYMBOL: Record<string, string> = {
  Aries: '♈︎', Taurus: '♉︎', Gemini: '♊︎', Cancer: '♋︎',
  Leo: '♌︎', Virgo: '♍︎', Libra: '♎︎', Scorpio: '♏︎',
  Sagittarius: '♐︎', Capricorn: '♑︎', Aquarius: '♒︎', Pisces: '♓︎',
};

// ── Zodiac font family (matches chart screen exactly) ─────────────────────────
const ZODIAC_FAMILY = Platform.select({
  ios: 'Apple Symbols',
  default: 'sans-serif',
});

const GRAD_PROPS = {
  colors: [...metallicFillColors] as string[],
  locations: [...metallicFillPositions] as number[],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

function GradientSymbol({
  symbol,
  fontSize = 18,
  w = 28,
  h = 24,
  style,
}: {
  symbol: string;
  fontSize?: number;
  w?: number;
  h?: number;
  style?: object;
}) {
  return (
    <MaskedView
      style={[{ width: w, height: h }, style]}
      maskElement={
        <Text
          style={{
            fontFamily: ZODIAC_FAMILY,
            fontSize,
            color: '#000',
            lineHeight: h,
            width: w,
            textAlign: 'center',
            backgroundColor: 'transparent',
          }}
        >
          {symbol}
        </Text>
      }
    >
      <SkiaGradient {...GRAD_PROPS} style={{ width: w, height: h }} />
    </MaskedView>
  );
}

const ActionPill = ({ label, icon, color, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable onPress={onPress} style={[styles.actionPill, { borderColor: `${color}40` }]}>
      <MetallicIcon name={icon} size={16} color={color} />
      <MetallicText style={styles.actionLabel} color={color}>{label}</MetallicText>
    </Pressable>
  );
};

export default function CosmicContext() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { isPremium } = usePremium();
  const [transitInsights, setTransitInsights] = useState<PatternInsight[]>([]);
  const [transitCoordinates, setTransitCoordinates] = useState<TransitCoordinates>({ latitude: 0, longitude: 0 });

  const loadTransitCoordinates = useCallback(async () => {
    try {
      const charts = await localDb.getCharts();
      const saved = charts[0];
      if (!saved) return;
      setTransitCoordinates(prev => (
        prev.latitude === saved.latitude && prev.longitude === saved.longitude
          ? prev
          : { latitude: saved.latitude, longitude: saved.longitude }
      ));
    } catch {
      // Keep fallback coordinates if the chart is unavailable.
    }
  }, []);

  const loadTransitInsights = useCallback(async () => {
    try {
      const entries = await localDb.getJournalEntriesPaginated(90);
      if (entries.length < 3) return;
      const moodMap: Record<string, MoodLevel> = { calm: 5, soft: 4, okay: 3, heavy: 2, stormy: 1 };
      const metas: JournalEntryMeta[] = entries.map((e) => {
        let transitSnapshot: TransitSnapshot | undefined;
        if (e.transitSnapshot) { try { transitSnapshot = JSON.parse(e.transitSnapshot); } catch {} }
        return { id: e.id, date: e.date, mood: { overall: moodMap[e.mood] ?? 3 }, tags: [], wordCount: e.contentWordCount ?? (e.content || '').trim().split(/\s+/).filter(Boolean).length, transitSnapshot };
      });
      const all = AdvancedJournalAnalyzer.analyzePatterns(metas, isPremium);
      setTransitInsights(all.filter(i => i.type === 'transit_correlation' || i.icon === 'moon-outline' || i.icon === 'planet-outline'));
    } catch {}
  }, [isPremium]);

  useFocusEffect(useCallback(() => {
    void loadTransitInsights();
    void loadTransitCoordinates();
  }, [loadTransitCoordinates, loadTransitInsights]));

  useEffect(() => {
    void loadTransitCoordinates();
  }, [loadTransitCoordinates]);

  // Live moon phase from the astronomy engine
  const moonInfo = useMemo(() => getMoonPhaseInfo(), []);

  // Live transiting longitudes and retrogrades
  const transitInfo = useMemo(
    () => getTransitInfo(new Date(), transitCoordinates.latitude, transitCoordinates.longitude),
    [transitCoordinates.latitude, transitCoordinates.longitude]
  );

  // Build the transit rows for the five personal planets
  const activeTransits = useMemo(() =>
    PERSONAL_PLANETS.flatMap((planet) => {
      const lon = transitInfo.longitudes[planet];
      if (lon == null) return [];
      const sign = signNameFromLongitude(lon);
      const isRx = transitInfo.retrogrades.includes(planet);
      const meta = PLANET_META[planet];
      const impact = TRANSIT_IMPACT[planet]?.[sign] ?? '';
      const governs = PLANET_GOVERNS[planet] ?? '';
      const essence = SIGN_ESSENCE[sign] ?? '';
      const source = governs && essence
        ? `The ${planet} shapes ${governs}. Right now it's moving through ${sign} — ${essence}.`
        : '';
      return [{ planet, sign, isRx, symbol: meta.symbol, color: meta.color, impact, source }];
    }),
  [transitInfo]);

  // Moon sign, degree, and VoC estimate
  const moonLon = transitInfo.longitudes['Moon'] ?? null;
  const moonSign = useMemo(() =>
    moonLon != null ? signNameFromLongitude(moonLon) : null,
  [moonLon]);
  const moonDegree = useMemo(() =>
    moonLon != null ? Math.floor(degreeInSign(normalize360(moonLon))) : null,
  [moonLon]);
  const vocHours = useMemo(() =>
    moonLon != null ? hoursUntilMoonIngress(moonLon) : null,
  [moonLon]);

  const retrogrades = transitInfo.retrogrades;

  const [weekExpanded, setWeekExpanded] = useState(false);
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);

  // Build moon phase info for each day of the current week (Mon–Sun)
  const weeklyPhases = useMemo(() => {
    const today = new Date();
    const dow = today.getDay(); // 0=Sun, 1=Mon …
    const startOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(today.getDate() + startOffset);
    monday.setHours(12, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        date: d,
        phase: getMoonPhaseInfo(d),
        sign: getMoonSignForDate(d),
        isToday: d.toDateString() === today.toDateString(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
      };
    });
  }, []);

  const handleBack = () => {
    Haptics.selectionAsync();
    router.replace('/(tabs)/identity');
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={handleBack} hitSlop={10}>
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Cosmic Context</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Moon, transits & cosmic weather</GoldSubtitle>
        </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Hero Moon ──────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <MoonPhaseView size={120} gradient interactive={false} />
          <Text style={styles.moonTitle}>
            {moonInfo.name}{moonSign ? ` in ${moonSign}` : ''}
          </Text>
          {moonSign != null && moonDegree != null && (
          <MetallicText style={styles.moonDegree} color="#D4B872">
              {SIGN_SYMBOL[moonSign] ?? ''} {moonDegree}° {moonSign}
            </MetallicText>
          )}

          {/* Void-of-Course badge */}
          {vocHours != null && vocHours < 24 && (
            <View style={styles.vocBadge}>
              <View style={styles.vocPulse} />
              <MetallicText style={styles.vocText} color="#D4B872">
                VOID-OF-COURSE IN {formatHoursMinutes(vocHours)}
              </MetallicText>
            </View>
          )}
        </View>

        {/* ── Weekly Moon Phases ─────────────────────────────────────── */}
        <Pressable
          style={styles.weekHeader}
          onPress={() => {
            Haptics.selectionAsync();
            setWeekExpanded(v => !v);
          }}
          accessibilityRole="button"
          accessibilityLabel="Toggle weekly moon phases"
        >
          <Text style={styles.weekHeaderLabel}>MOON PHASES THIS WEEK</Text>
          <Ionicons
            name={weekExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="rgba(212,184,114,0.7)"
          />
        </Pressable>

        {weekExpanded && (
          <>
            <View style={styles.weekRow}>
              {weeklyPhases.map(({ date, phase, isToday, dayName, dayNum }, i) => {
                const isActive = activeDayIdx === i;
                return (
                  <Pressable
                    key={toLocalDateString(date)}
                    style={[styles.weekDayCol, isActive && styles.weekDayColActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveDayIdx(prev => (prev === i ? null : i));
                    }}
                    hitSlop={10}
                  >
                    {isToday ? (
                      <MetallicText style={styles.weekDayName} color="#D4B872">{dayName.toUpperCase()}</MetallicText>
                    ) : (
                      <Text style={styles.weekDayName}>{dayName.toUpperCase()}</Text>
                    )}
                    {isToday ? (
                      <MetallicText style={[styles.weekDayNum, { fontWeight: '800' }]} color="#D4B872">{dayNum}</MetallicText>
                    ) : (
                      <Text style={styles.weekDayNum}>{dayNum}</Text>
                    )}
                    <View style={isToday ? styles.weekOrbToday : styles.weekOrb}>
                      <MoonPhaseView size={28} date={date} interactive={false} gradient />
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {activeDayIdx !== null && weeklyPhases[activeDayIdx] && (
              <View style={styles.weekInfoStrip}>
                <MoonPhaseView
                  size={72}
                  date={weeklyPhases[activeDayIdx].date}
                  interactive={false}
                  gradient
                />
                <Text style={styles.weekInfoPhase}>
                  {weeklyPhases[activeDayIdx].phase.name}
                </Text>
                <Text style={styles.weekInfoSign}>
                  Moon in {weeklyPhases[activeDayIdx].sign}
                </Text>
                <Text style={styles.weekInfoMessage}>
                  {weeklyPhases[activeDayIdx].phase.message}
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── Retrograde Alerts ──────────────────────────────────────── */}
        {retrogrades.length > 0 && (
          <VelvetGlassSurface style={styles.rxAlertCard} intensity={42} backgroundColor={theme.isDark ? 'rgba(28, 18, 18, 0.56)' : 'rgba(255, 249, 243, 0.88)'}>
            <View style={styles.rxAlertHeader}>
              <MetallicIcon name="warning-outline" size={16} color="#D98C8C" />
              <MetallicText style={styles.rxAlertTitle} color="#D98C8C">
                {retrogrades.length === 1
                  ? `${retrogrades[0]} is Retrograde`
                  : `${retrogrades.join(' & ')} are Retrograde`}
              </MetallicText>
            </View>
            <Text style={styles.rxAlertBody}>
              Revisit, review, and reflect. Avoid launching new initiatives in the domains governed by{' '}
              {retrogrades.join(' and ')}.
            </Text>
          </VelvetGlassSurface>
        )}

        {/* ── Daily Alignment ────────────────────────────────────────── */}
        <VelvetGlassSurface style={styles.affirmationCard} intensity={45} backgroundColor={theme.isDark ? 'rgba(18, 18, 24, 0.62)' : 'rgba(255, 255, 255, 0.82)'}>
          <View style={styles.premiumHeaderRow}>
            <MetallicText style={styles.affirmationLabel} color="#D9BF8C">DAILY ALIGNMENT</MetallicText>
            <MetallicText style={styles.premiumIcon} color="#D9BF8C">✦</MetallicText>
          </View>
          <Text style={styles.affirmationText}>
            {moonInfo.emoji}{'  '}{moonInfo.message}
          </Text>
        </VelvetGlassSurface>

        {/* ── Active Transits ────────────────────────────────────────── */}
        <View style={styles.transitsSection}>
          <Text style={styles.sectionLabel}>ACTIVE TRANSITS</Text>
          <VelvetGlassSurface style={styles.transitsContainer} intensity={45} backgroundColor={theme.isDark ? 'rgba(18, 18, 24, 0.62)' : 'rgba(255, 255, 255, 0.82)'}>
            {activeTransits.map((transit, index) => (
              <View key={transit.planet}>
                <View style={styles.transitRow}>
                  <GradientSymbol
                    symbol={transit.symbol}
                    fontSize={20}
                    w={28}
                    h={28}
                    style={{ marginRight: 16, marginTop: 2 }}
                  />
                  <View style={styles.transitDetails}>
                    <View style={styles.transitHeaderRow}>
                      <Text style={styles.transitTitle}>{transit.planet}</Text>
                      <Text style={styles.transitIn}> in </Text>
                      <GradientSymbol
                        symbol={SIGN_SYMBOL[transit.sign] ?? ''}
                        fontSize={16}
                        w={20}
                        h={20}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.transitTitle}>{transit.sign}</Text>
                      {transit.isRx && <Text style={styles.rxBadge}>Rx</Text>}
                    </View>
                    <Text style={styles.transitImpact}>{transit.impact}</Text>
                    {transit.source ? (
                      <Text style={styles.transitSource}>{transit.source}</Text>
                    ) : null}
                  </View>
                </View>
                {index < activeTransits.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </VelvetGlassSurface>
        </View>

        {/* ── Astrology Insights from Journal ── */}
        {isPremium && transitInsights.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200)} style={{ marginBottom: 24 }}>
            <Text style={styles.sectionLabel}>YOUR COSMIC PATTERNS</Text>
            <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 14, marginTop: -10 }}>How planetary transits correlate with your journal entries</Text>
            {transitInsights.map((insight, idx) => (
              <VelvetGlassSurface key={`${insight.title}-${idx}`} style={styles.insightCard} intensity={40} backgroundColor={theme.isDark ? 'rgba(18, 18, 24, 0.58)' : 'rgba(255, 255, 255, 0.80)'}>
                <LinearGradient colors={['rgba(168,155,200,0.12)', 'rgba(10,10,12,0.18)']} style={StyleSheet.absoluteFill}>
                  <View />
                </LinearGradient>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                  <MetallicIcon name={(insight.icon ?? 'planet-outline') as any} size={16} color="#A89BC8" />
                  <MetallicText color="#A89BC8" style={{ fontSize: 14, fontWeight: '600', flex: 1 }}>{insight.title}</MetallicText>
                  <View style={[styles.confidenceBadge, insight.confidence === 'strong' && styles.confidenceStrong, insight.confidence === 'suggested' && styles.confidenceSuggested]}>
                    <Text style={[styles.confidenceText, insight.confidence === 'suggested' && { color: '#C9AE78' }]}>{insight.confidence.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.transitImpact}>{insight.description}</Text>
                {!!insight.evidence && <Text style={[styles.transitSource, { marginTop: 4 }]}>{insight.evidence}</Text>}
                {!!insight.actionable && <Text style={[styles.transitImpact, styles.actionableText]}>{insight.actionable}</Text>}
              </VelvetGlassSurface>
            ))}
          </Animated.View>
        )}

        {/* ── Reflection Prompt ── */}
        <Animated.View entering={FadeInDown.delay(300)} style={{ marginBottom: 24 }}>
          <VelvetGlassSurface style={styles.reflectionCard} intensity={42} backgroundColor={theme.isDark ? 'rgba(18, 18, 24, 0.62)' : 'rgba(255, 255, 255, 0.82)'}>
            <LinearGradient colors={['rgba(212, 184, 114, 0.10)', 'rgba(10, 10, 12, 0.18)']} style={StyleSheet.absoluteFill}>
              <View />
            </LinearGradient>
            <View style={styles.promptHeader}>
              <MetallicIcon name="sparkles-outline" size={14} variant="gold" />
              <MetallicText style={styles.promptEyebrow} variant="gold">TODAY'S REFLECTION</MetallicText>
            </View>
            <Text style={styles.promptText}>{getDailyPrompt()}</Text>
            <View style={styles.actionRow}>
              <ActionPill label="Log Mood" icon="happy-outline" color="#C9AE78" onPress={() => router.push('/(tabs)/internal-weather')} />
              <ActionPill label="Journal" icon="create-outline" color="#D4B872" onPress={() => router.push('/(tabs)/journal')} />
            </View>
          </VelvetGlassSurface>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  ambientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  safeArea: { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea:   { paddingHorizontal: 24, paddingBottom: 8 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, borderWidth: 1, borderColor: theme.cardBorder, justifyContent: 'center', alignItems: 'center' },
  closeIcon:   { color: theme.textPrimary, fontSize: 24, lineHeight: 28 },
  titleHeader: { marginBottom: 32 },
  headerTitle: { fontSize: 30, color: theme.textPrimary, fontWeight: '700', letterSpacing: -0.8, marginBottom: 6, maxWidth: '88%' },
  headerSubtitle: { fontSize: 12, color: theme.textSecondary },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  sectionLabel: { fontSize: 11, fontWeight: 'bold', color: theme.textMuted, letterSpacing: 1.5, marginBottom: 16 },

  // ── Hero Moon ─────────────────────────────────────────────────────────────
  heroSection: { alignItems: 'center', marginBottom: 20 },

  // ── Weekly Moon ───────────────────────────────────────────────────────────
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, marginBottom: 4 },
  weekHeaderLabel: { fontSize: 11, fontWeight: 'bold', color: theme.textSecondary, letterSpacing: 1.5 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(212,184,114,0.16)', marginBottom: 28 },
  weekDayCol: { flex: 1, alignItems: 'center', gap: 4 },
  weekDayName: { fontSize: 9, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.8 },
  weekDayNameToday: { color: theme.textPrimary },
  weekDayNum: { fontSize: 11, color: theme.textMuted, fontWeight: '500' },
  weekDayNumToday: { color: theme.textPrimary, fontWeight: '800' },
  weekOrb: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  weekOrbToday: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,184,114,0.4)' },
  weekDayColActive: { backgroundColor: 'rgba(212,184,114,0.08)', borderRadius: 12 },
  weekInfoStrip: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : theme.pillSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,184,114,0.18)',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 18,
    marginTop: -8,
    marginBottom: 28,
    alignItems: 'center',
    gap: 6,
  },
  weekInfoPhase: { fontSize: 15, color: theme.textPrimary, fontWeight: '700' },
  weekInfoSign: { fontSize: 13, color: 'rgba(201,174,120,0.85)', fontWeight: '600' },
  weekInfoMessage: { fontSize: 12, color: theme.textMuted, textAlign: 'center', marginTop: 2 },

  moonTitle: { fontSize: 22, color: theme.textPrimary, fontWeight: '700', marginTop: 20, marginBottom: 4 },
  moonDegree: { fontSize: 14, color: theme.textPrimary, letterSpacing: 1, marginBottom: 16 },

  // VoC
  vocBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212,184,114,0.08)', borderWidth: 1, borderColor: 'rgba(212,184,114,0.25)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  vocPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C9AE78', marginRight: 8 },
  vocText: { fontSize: 10, fontWeight: '800', color: theme.textPrimary, letterSpacing: 1.2 },

  // ── Retrograde Alert ──────────────────────────────────────────────────────
  rxAlertCard: { borderRadius: 28, padding: 28, marginBottom: 24 },
  rxAlertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rxAlertTitle: { fontSize: 14, fontWeight: '700', color: '#D98C8C' },
  rxAlertBody: { fontSize: 13, color: theme.textSecondary, lineHeight: 20 },

  // ── Daily Alignment ───────────────────────────────────────────────────────
  affirmationCard: { padding: 28, borderRadius: 28, marginBottom: 32 },
  premiumHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  affirmationLabel: { fontSize: 11, fontWeight: 'bold', color: theme.textPrimary, letterSpacing: 1.5 },
  premiumIcon: { color: '#C9AE78', fontSize: 14 },
  affirmationText: { fontSize: 18, color: theme.textPrimary, lineHeight: 28 },

  // ── Transits ──────────────────────────────────────────────────────────────
  transitsSection: { marginBottom: 32 },
  transitsContainer: { borderRadius: 28, padding: 28 },
  transitRow: { flexDirection: 'row', alignItems: 'flex-start' },
  transitDetails: { flex: 1 },
  transitHeaderRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  transitTitle: { fontSize: 16, color: theme.textPrimary, fontWeight: '600' },
  transitIn: { fontSize: 16, color: theme.textMuted, fontWeight: '400' },
  rxBadge: { backgroundColor: 'rgba(217,140,140,0.2)', color: '#D98C8C', fontSize: 9, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  transitImpact: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  transitSource: { fontSize: 12, color: theme.isDark ? 'rgba(212,184,114,0.58)' : theme.primaryDark, lineHeight: 17, marginTop: 5, fontStyle: 'italic' },
  actionableText: { color: theme.isDark ? 'rgba(255,255,255,0.85)' : theme.textPrimary, marginTop: 6 },
  divider: { height: 1, backgroundColor: theme.cardBorder, marginVertical: 20, marginLeft: 44 },
  insightCard: {
    padding: 18,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },
  confidenceBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(168,155,200,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(168,155,200,0.24)',
  },
  confidenceStrong: {
    backgroundColor: 'rgba(110,183,155,0.14)',
    borderColor: 'rgba(110,183,155,0.28)',
  },
  confidenceSuggested: {
    backgroundColor: 'rgba(201,174,120,0.12)',
    borderColor: 'rgba(201,174,120,0.24)',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#A89BC8',
  },

  // Reflection prompt
  reflectionCard: { padding: 24, borderRadius: 28, marginBottom: 8, overflow: 'hidden' },
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  promptEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  promptText: { color: theme.textPrimary, fontSize: 20, lineHeight: 30, fontWeight: '700', marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  actionLabel: { fontWeight: '700', fontSize: 13 },
});
