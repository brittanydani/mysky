import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { SkiaGradient } from '../components/ui/SkiaGradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { metallicFillColors, metallicFillPositions } from '../constants/mySkyMetallic';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getMoonPhaseInfo } from '../utils/moonPhase';
import { getTransitInfo } from '../services/astrology/transits';
import { signNameFromLongitude, degreeInSign, normalize360 } from '../services/astrology/sharedHelpers';
import MoonPhaseView from '../components/ui/MoonPhaseView';

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

// ── Sign glyphs ──────────────────────────────────────────────────────────────
const SIGN_SYMBOL: Record<string, string> = {
  Aries: '♈︎', Taurus: '♉︎', Gemini: '♊︎', Cancer: '♋︎',
  Leo: '♌︎', Virgo: '♍︎', Libra: '♎︎', Scorpio: '♏︎',
  Sagittarius: '♐︎', Capricorn: '♑︎', Aquarius: '♒︎', Pisces: '♓︎',
};

// ── Zodiac font family (matches chart screen exactly) ─────────────────────────
const ZODIAC_FAMILY = Platform.select({
  ios: 'Apple Symbols',
  android: 'Noto Sans Symbols2',
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

export default function CosmicContext() {
  const router = useRouter();

  // Live moon phase from the astronomy engine
  const moonInfo = useMemo(() => getMoonPhaseInfo(), []);

  // Live transiting longitudes and retrogrades
  const transitInfo = useMemo(() => getTransitInfo(new Date(), 0, 0), []);

  // Build the transit rows for the five personal planets
  const activeTransits = useMemo(() =>
    PERSONAL_PLANETS.flatMap((planet) => {
      const lon = transitInfo.longitudes[planet];
      if (lon == null) return [];
      const sign = signNameFromLongitude(lon);
      const isRx = transitInfo.retrogrades.includes(planet);
      const meta = PLANET_META[planet];
      const impact = TRANSIT_IMPACT[planet]?.[sign] ?? '';
      return [{ planet, sign, isRx, symbol: meta.symbol, color: meta.color, impact }];
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
        isToday: d.toDateString() === today.toDateString(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
      };
    });
  }, []);

  const handleBack = () => {
    Haptics.selectionAsync();
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(110, 140, 180, 0.15)', 'transparent']} style={styles.ambientTop} />

      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Cosmic Context</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Hero Moon ──────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <MoonPhaseView size={120} />
          <Text style={styles.moonTitle}>
            {moonInfo.name}{moonSign ? ` in ${moonSign}` : ''}
          </Text>
          {moonSign != null && moonDegree != null && (
            <Text style={styles.moonDegree}>
              {SIGN_SYMBOL[moonSign] ?? ''} {moonDegree}° {moonSign}
            </Text>
          )}

          {/* Void-of-Course badge */}
          {vocHours != null && vocHours < 24 && (
            <View style={styles.vocBadge}>
              <View style={styles.vocPulse} />
              <Text style={styles.vocText}>
                VOID-OF-COURSE IN {formatHoursMinutes(vocHours)}
              </Text>
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
          <View style={styles.weekRow}>
            {weeklyPhases.map(({ date, phase, isToday, dayName, dayNum }) => (
              <View key={date.toISOString()} style={styles.weekDayCol}>
                <Text style={[styles.weekDayName, isToday && styles.weekDayNameToday]}>
                  {dayName.toUpperCase()}
                </Text>
                <Text style={[styles.weekDayNum, isToday && styles.weekDayNumToday]}>
                  {dayNum}
                </Text>
                <View style={isToday ? styles.weekOrbToday : styles.weekOrb}>
                  <MoonPhaseView size={28} date={date} interactive={false} />
                </View>
                <Text style={styles.weekPhaseEmoji}>{phase.emoji}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Retrograde Alerts ──────────────────────────────────────── */}
        {retrogrades.length > 0 && (
          <View style={styles.rxAlertCard}>
            <View style={styles.rxAlertHeader}>
              <Ionicons name="warning-outline" size={16} color="#D98C8C" />
              <Text style={styles.rxAlertTitle}>
                {retrogrades.length === 1
                  ? `${retrogrades[0]} is Retrograde`
                  : `${retrogrades.join(' & ')} are Retrograde`}
              </Text>
            </View>
            <Text style={styles.rxAlertBody}>
              Revisit, review, and reflect. Avoid launching new initiatives in the domains governed by{' '}
              {retrogrades.join(' and ')}.
            </Text>
          </View>
        )}

        {/* ── Daily Alignment ────────────────────────────────────────── */}
        <View style={styles.affirmationCard}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.premiumHeaderRow}>
            <Text style={styles.affirmationLabel}>DAILY ALIGNMENT</Text>
            <Text style={styles.premiumIcon}>✦</Text>
          </View>
          <Text style={styles.affirmationText}>
            {moonInfo.emoji}{'  '}{moonInfo.message}
          </Text>
        </View>

        {/* ── Active Transits ────────────────────────────────────────── */}
        <View style={styles.transitsSection}>
          <Text style={styles.sectionLabel}>ACTIVE TRANSITS</Text>
          <View style={styles.transitsContainer}>
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
                  </View>
                </View>
                {index < activeTransits.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── Acknowledge ────────────────────────────────────────────── */}
        <Pressable
          style={({ pressed }) => [styles.acknowledgeBtn, pressed && { opacity: 0.8 }]}
          onPress={handleBack}
        >
          <Text style={styles.acknowledgeBtnText}>Acknowledge</Text>
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050507' },
  ambientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backArrow: { color: '#FFF', fontSize: 36, fontWeight: '300', lineHeight: 40 },
  headerTitle: { fontSize: 16, color: '#FFF', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
  sectionLabel: { fontSize: 11, fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginBottom: 16 },

  // ── Hero Moon ─────────────────────────────────────────────────────────────
  heroSection: { alignItems: 'center', marginBottom: 20 },

  // ── Weekly Moon ───────────────────────────────────────────────────────────
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, marginBottom: 4 },
  weekHeaderLabel: { fontSize: 11, fontWeight: 'bold', color: 'rgba(212,184,114,0.7)', letterSpacing: 1.5 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(212,184,114,0.12)', marginBottom: 28 },
  weekDayCol: { flex: 1, alignItems: 'center', gap: 4 },
  weekDayName: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.8 },
  weekDayNameToday: { color: '#D4B872' },
  weekDayNum: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  weekDayNumToday: { color: '#D4B872', fontWeight: '800' },
  weekOrb: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  weekOrbToday: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212,184,114,0.4)' },
  weekPhaseEmoji: { fontSize: 12 },

  moonTitle: { fontSize: 22, color: '#FFF', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginTop: 20, marginBottom: 4 },
  moonDegree: { fontSize: 14, color: '#D4B872', letterSpacing: 1, marginBottom: 16 },

  // VoC
  vocBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212,184,114,0.08)', borderWidth: 1, borderColor: 'rgba(212,184,114,0.25)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  vocPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D4B872', marginRight: 8 },
  vocText: { fontSize: 10, fontWeight: '800', color: '#D4B872', letterSpacing: 1.2 },

  // ── Retrograde Alert ──────────────────────────────────────────────────────
  rxAlertCard: { backgroundColor: 'rgba(217,140,140,0.07)', borderWidth: 1, borderColor: 'rgba(217,140,140,0.25)', borderRadius: 20, padding: 20, marginBottom: 24 },
  rxAlertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rxAlertTitle: { fontSize: 14, fontWeight: '700', color: '#D98C8C' },
  rxAlertBody: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20 },

  // ── Daily Alignment ───────────────────────────────────────────────────────
  affirmationCard: { padding: 24, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(217,191,140,0.2)', marginBottom: 32 },
  premiumHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  affirmationLabel: { fontSize: 11, fontWeight: 'bold', color: '#D9BF8C', letterSpacing: 1.5 },
  premiumIcon: { color: '#D9BF8C', fontSize: 14 },
  affirmationText: { fontSize: 18, color: '#FFF', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), fontStyle: 'italic', lineHeight: 28 },

  // ── Transits ──────────────────────────────────────────────────────────────
  transitsSection: { marginBottom: 32 },
  transitsContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  transitRow: { flexDirection: 'row', alignItems: 'flex-start' },
  transitDetails: { flex: 1 },
  transitHeaderRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
  transitTitle: { fontSize: 16, color: '#FFF', fontWeight: '600' },
  transitIn: { fontSize: 16, color: 'rgba(255,255,255,0.45)', fontWeight: '400' },
  rxBadge: { backgroundColor: 'rgba(217,140,140,0.2)', color: '#D98C8C', fontSize: 9, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  transitImpact: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20, marginLeft: 44 },

  // ── Acknowledge ───────────────────────────────────────────────────────────
  acknowledgeBtn: { height: 56, borderRadius: 28, backgroundColor: '#D4B872', justifyContent: 'center', alignItems: 'center' },
  acknowledgeBtnText: { fontSize: 16, fontWeight: '700', color: '#050507', letterSpacing: 0.5 },
});
