// File: app/(tabs)/chart.tsx

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { SkiaGradient } from '../../components/ui/SkiaGradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { theme } from '../../constants/theme';
import { metallicFillColors, metallicFillPositions } from '../../constants/mySkyMetallic';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import NatalChartWheel from '../../components/ui/NatalChartWheel';
import { ChironIcon, NorthNodeIcon, SouthNodeIcon } from '../../components/ui/AstrologyIcons';
import BirthDataModal from '../../components/BirthDataModal';
import AstrologySettingsModal from '../../components/AstrologySettingsModal';
import { localDb } from '../../services/storage/localDb';
import { PremiumSegmentedControl } from '../../components/ui/PremiumSegmentedControl';
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { NatalChart, PlanetPlacement, Aspect, HouseCusp as HouseCuspType, BirthData } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { ChartDisplayManager } from '../../services/astrology/chartDisplayManager';
import { HOUSE_MEANINGS } from '../../services/astrology/constants';
import { detectChartPatterns, ChartPatterns } from '../../services/astrology/chartPatterns';
import { getChironInsightFromChart, ChironInsight } from '../../services/journal/chiron';
import { getNodeInsight, NodeInsight } from '../../services/journal/nodes';
import { RelationshipChart, generateId } from '../../services/storage/models';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';

// ── Colors per element (muted, sophisticated — not neon) ──
const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#E57F7F',   // Muted Coral
  Earth: '#7FA88B',  // Sage Green
  Air: '#7F9CE5',    // Soft Periwinkle
  Water: '#7FA8E5',  // Slate Blue
};

// ── Zodiac Font Family (matches wheel exactly) ──
const ZODIAC_FAMILY = Platform.select({
  ios: 'Apple Symbols',
  android: 'Noto Sans Symbols2',
  default: 'sans-serif',
});

// ── Sign lookup (name → symbol + element) for sensitive points ──
const SIGN_LOOKUP: Record<string, { symbol: string; element: string }> = {
  Aries: { symbol: '♈\uFE0E', element: 'Fire' },
  Taurus: { symbol: '♉\uFE0E', element: 'Earth' },
  Gemini: { symbol: '♊\uFE0E', element: 'Air' },
  Cancer: { symbol: '♋\uFE0E', element: 'Water' },
  Leo: { symbol: '♌\uFE0E', element: 'Fire' },
  Virgo: { symbol: '♍\uFE0E', element: 'Earth' },
  Libra: { symbol: '♎\uFE0E', element: 'Air' },
  Scorpio: { symbol: '♏\uFE0E', element: 'Water' },
  Sagittarius: { symbol: '♐\uFE0E', element: 'Fire' },
  Capricorn: { symbol: '♑\uFE0E', element: 'Earth' },
  Aquarius: { symbol: '♒\uFE0E', element: 'Air' },
  Pisces: { symbol: '♓\uFE0E', element: 'Water' },
};

// ── Aspect nature colors ──
const ASPECT_NATURE_COLORS: Record<string, string> = {
  Harmonious: '#6EBF8B',
  Challenging: '#E07A7A',
  Neutral: '#C9AE78',
};

// ── Multi-character planet symbols that need smaller font in aspects tab ──
const MULTI_CHAR_PLANETS = new Set(['Ascendant', 'Midheaven']);

// ── Gradient helpers ──
const GRAD_PROPS = {
  colors: [...metallicFillColors] as string[],
  locations: [...metallicFillPositions] as number[],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

/** Renders a zodiac/planet text glyph with the metallic fill gradient. */
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

/** Wraps a Chiron/Node SVG icon with the metallic fill gradient. */
function GradientIcon({ size, children }: { size: number; children: React.ReactElement }) {
  return (
    <MaskedView style={{ width: size, height: size }} maskElement={children}>
      <SkiaGradient {...GRAD_PROPS} style={{ width: size, height: size }} />
    </MaskedView>
  );
}

type TabKey = 'planets' | 'houses' | 'aspects' | 'patterns';

// ── Premium planet data row: strict columns, tabular nums, elemental colors ──
type PlanetDataRowProps = {
  iconElement?: React.ReactNode;
  glyph?: string;
  glyphFontSize?: number;
  planet: string;
  isRetrograde?: boolean;
  signGlyph: string;
  sign: string;
  element: string;
  modality?: string;
  degrees: string;
  house: number | string;
};

function PlanetDataRow({
  iconElement,
  glyph,
  glyphFontSize = 20,
  planet,
  isRetrograde,
  signGlyph,
  sign,
  element,
  modality,
  degrees,
  house,
}: PlanetDataRowProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const elColor = ELEMENT_COLORS[element] || '#E8D6AE';

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { mass: 0.5, damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { mass: 0.5, damping: 15 }); }}
      onPress={() => Haptics.selectionAsync().catch(() => {})}
      accessibilityRole="button"
      accessibilityLabel={`${planet} in ${sign}`}
    >
      <Animated.View style={[styles.premiumRow, animStyle]}>
        {/* Col 1: glyph / icon */}
        <View style={styles.premiumColGlyph}>
          {iconElement ?? (
            <GradientSymbol
              symbol={glyph ?? '•'}
              fontSize={glyphFontSize}
              w={28}
              h={28}
            />
          )}
        </View>

        {/* Col 2: planet name + Rx badge */}
        <View style={styles.premiumColPlanet}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.premiumPlanetText}>{planet}</Text>
            {isRetrograde && (
              <View style={styles.premiumRxBadge}>
                <Text style={styles.premiumRxText}>Rx</Text>
              </View>
            )}
          </View>
        </View>

        {/* Col 3: sign glyph + name + element · modality */}
        <View style={styles.premiumColSign}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <GradientSymbol symbol={signGlyph} fontSize={13} w={16} h={16} />
            <Text style={[styles.premiumSignText, { color: elColor, marginLeft: 3 }]}>{sign}</Text>
          </View>
          <Text style={styles.premiumMetaText}>
            {element}{modality ? ` · ${modality}` : ''}
          </Text>
        </View>

        {/* Col 4: degrees with tabular nums */}
        <View style={styles.premiumColDegrees}>
          <Text style={styles.premiumDegreeText}>{degrees}</Text>
        </View>

        {/* Col 5: house number */}
        <View style={styles.premiumColHouse}>
          <Text style={styles.premiumHouseText}>{house || '—'}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

type SensitivePointRow = {
  label: 'Chiron' | 'North Node' | 'South Node';
  sign: string;
  signSymbol: string;
  element: string;
  degree: number;
  minute: number;
  house?: number;
  retrograde: boolean;
};

function normalizeDegMin(rawDeg: number) {
  let deg = Math.floor(rawDeg);
  let min = Math.round((rawDeg - deg) * 60);
  if (min === 60) {
    deg += 1;
    min = 0;
  }
  return { deg, min };
}

function safeString(s: unknown) {
  return typeof s === 'string' ? s : '';
}

function getRetrogradeFlag(obj: any): boolean {
  // supports both legacy `retrograde` and current `isRetrograde`
  return Boolean(obj?.isRetrograde ?? obj?.retrograde ?? false);
}

function safeAspectTypeName(a: any): string {
  return safeString(a?.type?.name).toLowerCase();
}

const GLOSSARY: { term: string; definition: string }[] = [
  { term: 'Natal Chart', definition: 'A map of where all the planets were at the exact moment you were born. Think of it as your unique personal blueprint.' },
  { term: 'Sun Sign', definition: 'The zodiac sign the Sun was in when you were born. It represents your core identity and ego.' },
  { term: 'Moon Sign', definition: 'The zodiac sign the Moon was in at your birth. It governs your emotions, instincts, and inner world.' },
  { term: 'Rising Sign (Ascendant)', definition: 'The zodiac sign rising on the eastern horizon at your birth. It shapes how others perceive you and your outward style.' },
  { term: 'Houses', definition: 'The 12 sections of your chart, each representing a different area of life — like relationships, career, or home.' },
  { term: 'Transit', definition: 'The current position of a planet in the sky and how it interacts with your natal chart. Transits correlate with moods and life themes — they reflect cycles and timing, not fixed outcomes.' },
  { term: 'Aspect', definition: 'An angle between two planets in your chart. Aspects show how different parts of your personality interact — harmoniously or with tension.' },
  { term: 'Retrograde', definition: 'When a planet appears to move backward in the sky. It often signals a time to slow down and revisit themes related to that planet.' },
  { term: 'Stellium', definition: 'Three or more planets clustered in the same sign or house. It creates an intense focus of energy in that area of your life.' },
  { term: 'Chiron', definition: 'Known as the "wounded healer." Its placement shows where you carry deep wounds — and where you have the greatest power to heal others.' },
  { term: 'Nodes (North & South)', definition: "The North Node points to your soul's growth direction. The South Node shows past-life patterns and comfort zones to move beyond." },
  { term: 'Conjunction', definition: 'When two planets sit very close together (within a few degrees). Their energies merge and amplify each other.' },
  { term: 'Opposition', definition: 'When two planets are directly across the chart from each other (180°). It creates tension that pushes you toward balance.' },
  { term: 'Trine', definition: 'A flowing, harmonious angle (120°) between two planets. Trines represent natural talents and ease.' },
  { term: 'Square', definition: 'A challenging 90° angle between two planets. Squares create friction that drives growth and action.' },
  { term: 'Cardinal Signs', definition: 'Aries, Cancer, Libra, Capricorn. Cardinal energy initiates — these signs start new seasons and are natural leaders and self-starters.' },
  { term: 'Fixed Signs', definition: 'Taurus, Leo, Scorpio, Aquarius. Fixed energy sustains — these signs are deeply determined, persistent, and resistant to change.' },
  { term: 'Mutable Signs', definition: 'Gemini, Virgo, Sagittarius, Pisces. Mutable energy adapts — these signs are flexible, versatile, and comfortable with change.' },
  { term: 'Fire Element', definition: 'Aries, Leo, Sagittarius. Fire signs are passionate, energetic, and action-oriented. They lead with enthusiasm and courage.' },
  { term: 'Earth Element', definition: 'Taurus, Virgo, Capricorn. Earth signs are grounded, practical, and reliable. They build things that last.' },
  { term: 'Air Element', definition: 'Gemini, Libra, Aquarius. Air signs are intellectual, communicative, and social. They process the world through ideas and connection.' },
  { term: 'Water Element', definition: 'Cancer, Scorpio, Pisces. Water signs are intuitive, emotional, and deeply feeling. They navigate life through empathy and instinct.' },
];

type RelationshipType = 'partner' | 'ex' | 'child' | 'parent' | 'friend' | 'sibling' | 'other';

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  partner: 'Partner',
  ex: 'Ex',
  child: 'Child',
  parent: 'Parent',
  friend: 'Friend',
  sibling: 'Sibling',
  other: 'Other',
};

export default function ChartScreen() {
  const router = useRouter();
  const { isPremium } = usePremium();

  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('planets');

  // Multi-chart state
  const [savedUserChartId, setSavedUserChartId] = useState<string | null>(null);
  const [people, setPeople] = useState<RelationshipChart[]>([]);
  const [activeOverlays, setActiveOverlays] = useState<Array<{person: RelationshipChart, chart: NatalChart, theme: 'silver'|'roseGold'|'iceBlue'}>>([]);
  const overlayPerson = activeOverlays.length > 0 ? activeOverlays[0].person : null;
  const overlayChart = activeOverlays.length > 0 ? activeOverlays[0].chart : null;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRelTypePicker, setShowRelTypePicker] = useState(false);
  const [addingRelationType, setAddingRelationType] = useState<RelationshipType>('friend');
  const [showGlossary, setShowGlossary] = useState(false);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [showAstrologyModal, setShowAstrologyModal] = useState(false);
  const [houseSystemLabel, setHouseSystemLabel] = useState<string>('Whole Sign');
  const [orbPresetLabel, setOrbPresetLabel] = useState<string>('Normal');

  // Reload chart every time this screen is focused (fixes "No chart found" after creating from Home)
  useFocusEffect(
    useCallback(() => {
      void loadChart();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- loadChart is defined below; adding it would create a circular dependency
    }, [isPremium])
  );

  const loadChart = async () => {
    try {
      const astroSettings = await AstrologySettingsService.getSettings();
      setHouseSystemLabel(AstrologySettingsService.getHouseSystemLabel(astroSettings.houseSystem));
      setOrbPresetLabel(AstrologySettingsService.getOrbPresetLabel(astroSettings.orbPreset));

      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const saved = charts[0];
        const birthData = {
          date: saved.birthDate,
          time: saved.birthTime,
          hasUnknownTime: saved.hasUnknownTime,
          place: saved.birthPlace,
          latitude: saved.latitude,
          longitude: saved.longitude,
          timezone: saved.timezone,
          houseSystem: astroSettings.houseSystem,
        };

        const chart = AstrologyCalculator.generateNatalChart(birthData);

        // attach DB metadata (safe even if your NatalChart type doesn’t declare them)
        (chart as any).id = saved.id;
        (chart as any).name = saved.name;
        (chart as any).createdAt = saved.createdAt;
        (chart as any).updatedAt = saved.updatedAt;

        setUserChart(chart);
        setSavedUserChartId(saved.id);

        // Load relationship charts for overlay (premium)
        if (isPremium) {
          try {
            const rels = await localDb.getRelationshipCharts(saved.id);
            setPeople(rels);
          } catch (e) {
            logger.error('Failed to load relationship charts:', e);
          }
        }
      } else {
        setUserChart(null);
        setSavedUserChartId(null);
      }
    } catch (error) {
      logger.error('Failed to load chart:', error);
      setUserChart(null);
    } finally {
      setLoading(false);
    }

  };

  // ── Overlay handlers ──
  const handleSelectOverlay = useCallback(
    async (person: RelationshipChart) => {
      // Find if already active
      const isActive = activeOverlays.some((o) => o.person.id === person.id);
      
      if (isActive) {
        // Toggle off
        setActiveOverlays((prev) => prev.filter((o) => o.person.id !== person.id));
        Haptics.selectionAsync().catch(() => {});
        return;
      }

      if (activeOverlays.length >= 2) {
        Alert.alert('Too many overlays', 'You can only overlay up to 2 charts.');
        return;
      }

      try {
        // Use the user's house system setting for overlay charts too
        const astroSettings = await AstrologySettingsService.getSettings();
        const birthData: BirthData = {
          date: person.birthDate,
          time: person.birthTime,
          hasUnknownTime: person.hasUnknownTime,
          place: person.birthPlace,
          latitude: person.latitude,
          longitude: person.longitude,
          timezone: person.timezone,
          houseSystem: astroSettings.houseSystem,
        };
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        (chart as any).name = person.name;
        
        // Pick a theme based on existing
        const usedThemes = activeOverlays.map(o => o.theme);
        const availableThemes: ('silver'|'roseGold'|'iceBlue')[] = ['silver', 'roseGold', 'iceBlue'];
        const chosenTheme = availableThemes.find(t => !usedThemes.includes(t)) || 'silver';

        setActiveOverlays((prev) => [...prev, { person, chart, theme: chosenTheme }]);
        Haptics.selectionAsync().catch(() => {});
      } catch (e) {
        logger.error('Failed to generate overlay chart:', e);
        Alert.alert('Error', 'Could not generate chart for this person.');
      }
    },
    [activeOverlays]
  );

  const handleAddPerson = useCallback((type: RelationshipType) => {
    setAddingRelationType(type);
    setShowRelTypePicker(false);
    setShowAddModal(true);
  }, []);

  const handleSaveNewPerson = useCallback(
    async (birthData: BirthData, extra?: { chartName?: string }) => {
      if (!savedUserChartId) return;
      try {
        const now = new Date().toISOString();
        const newRel: RelationshipChart = {
          id: generateId(),
          name: extra?.chartName || 'New Person',
          relationship: addingRelationType,
          birthDate: birthData.date,
          birthTime: birthData.time,
          hasUnknownTime: birthData.hasUnknownTime,
          birthPlace: birthData.place,
          latitude: birthData.latitude,
          longitude: birthData.longitude,
          timezone: birthData.timezone,
          userChartId: savedUserChartId,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };
        await localDb.saveRelationshipChart(newRel);
        setPeople((prev) => [newRel, ...prev]);
        setShowAddModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        // Auto-select as overlay
        handleSelectOverlay(newRel);
      } catch (e) {
        logger.error('Failed to save relationship chart:', e);
        Alert.alert('Error', 'Failed to save person. Please try again.');
      }
    },
    [savedUserChartId, addingRelationType, handleSelectOverlay]
  );

  const handleDeletePerson = useCallback(
    async (person: RelationshipChart) => {
      Alert.alert('Remove Chart', `Remove ${person.name}'s chart?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await localDb.deleteRelationshipChart(person.id);
              setPeople((prev) => prev.filter((p) => p.id !== person.id));
              setActiveOverlays((prev) => prev.filter(o => o.person.id !== person.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch (e) {
              logger.error('Failed to delete relationship chart:', e);
            }
          },
        },
      ]);
    },
    []
  );

  // The chart whose details are displayed below the wheel
  const activeChart = overlayChart ?? userChart;

  const displayChart = userChart ? ChartDisplayManager.formatChartWithTimeWarnings(userChart) : null;

  // ── All planet rows ──
  const planetRows = useMemo(() => {
    if (!activeChart) return [];
    const list: { label: string; p: PlanetPlacement }[] = [
      { label: 'Sun', p: activeChart.sun },
      { label: 'Moon', p: activeChart.moon },
      { label: 'Mercury', p: activeChart.mercury },
      { label: 'Venus', p: activeChart.venus },
      { label: 'Mars', p: activeChart.mars },
      { label: 'Jupiter', p: activeChart.jupiter },
      { label: 'Saturn', p: activeChart.saturn },
      { label: 'Uranus', p: activeChart.uranus },
      { label: 'Neptune', p: activeChart.neptune },
      { label: 'Pluto', p: activeChart.pluto },
    ];
    if (activeChart.ascendant) list.push({ label: 'Ascendant', p: activeChart.ascendant });
    if (activeChart.midheaven) list.push({ label: 'Midheaven', p: activeChart.midheaven });
    return list;
  }, [activeChart]);

  // ── Sensitive points (Chiron, Nodes) ──
  const sensitivePoints = useMemo<SensitivePointRow[]>(() => {
    if (!activeChart?.planets) return [];
    const points: SensitivePointRow[] = [];

    for (const p of activeChart.planets as any[]) {
      const name = safeString(p.planet).toLowerCase();
      const signName = safeString(p.sign);
      const lookup = SIGN_LOOKUP[signName] || { symbol: '', element: '' };
      const { deg, min } = normalizeDegMin(Number(p.degree ?? 0));

      const baseRow = {
        sign: signName,
        signSymbol: lookup.symbol,
        element: lookup.element,
        degree: deg,
        minute: min,
        house: typeof p.house === 'number' ? p.house : undefined,
        retrograde: getRetrogradeFlag(p),
      };

      if (name === 'chiron') {
        points.push({ label: 'Chiron', ...baseRow });
      } else if (name === 'north node' || name === 'northnode' || name === 'true node') {
        points.push({ label: 'North Node', ...baseRow });
      } else if (name === 'south node' || name === 'southnode') {
        points.push({ label: 'South Node', ...baseRow });
      }
    }

    const order: Record<SensitivePointRow['label'], number> = { 'North Node': 0, 'South Node': 1, Chiron: 2 };
    return points.sort((a, b) => order[a.label] - order[b.label]);
  }, [activeChart]);

  // ── Chiron & Node insights (premium) ──
  const chironInsight = useMemo<ChironInsight | null>(() => {
    if (!activeChart || !isPremium) return null;
    return getChironInsightFromChart(activeChart);
  }, [activeChart, isPremium]);

  const nodeInsight = useMemo<NodeInsight | null>(() => {
    if (!activeChart || !isPremium) return null;
    return getNodeInsight(activeChart);
  }, [activeChart, isPremium]);

  // ── Sorted aspects (tightest first), gated by premium ──
  const sortedAspects = useMemo(() => {
    const FREE_ASPECT_TYPES = new Set(['conjunction', 'opposition', 'trine', 'square']);
    if (!activeChart) return [];
    const all = [...(activeChart.aspects ?? [])].sort((a, b) => (a.orb ?? 99) - (b.orb ?? 99));
    if (isPremium) return all;
    return all.filter((a) => FREE_ASPECT_TYPES.has(safeAspectTypeName(a)));
  }, [activeChart, isPremium]);

  const hiddenAspectCount = useMemo(() => {
    if (!activeChart || isPremium) return 0;
    return (activeChart.aspects?.length ?? 0) - sortedAspects.length;
  }, [activeChart, isPremium, sortedAspects]);

  // ── Chart pattern analysis ──
  const chartPatterns = useMemo<ChartPatterns | null>(() => {
    if (!activeChart) return null;
    return detectChartPatterns(activeChart);
  }, [activeChart]);

  // ── Pattern count for tab label ──
  const patternCount = useMemo(() => {
    if (!chartPatterns) return 0;
    let count = 0;
    if (chartPatterns.chartRuler) count++;
    if (activeChart?.partOfFortune) count++;
    count++; // dominant planet (always computed)
    count += chartPatterns.stelliums.length;
    count += chartPatterns.conjunctionClusters.length;
    if (chartPatterns.retrogradeEmphasis.count >= 3) count++;
    if (chartPatterns.elementBalance) count++;
    if (chartPatterns.modalityBalance) count++;
    return count;
  }, [chartPatterns, activeChart]);

  // ── Part of Fortune (free) ──
  const partOfFortune = useMemo(() => {
    if (!activeChart?.partOfFortune) return null;
    return activeChart.partOfFortune;
  }, [activeChart]);

  // ── Dominant Planet (free) — improved scoring (aspects + angularity) ──
  const dominantPlanet = useMemo(() => {
    if (!activeChart) return null;

    const majors = new Set([
      'Sun',
      'Moon',
      'Mercury',
      'Venus',
      'Mars',
      'Jupiter',
      'Saturn',
      'Uranus',
      'Neptune',
      'Pluto',
    ]);

    const base: { planet?: string; name?: string; sign?: any; degree?: number; house?: number }[] = [];

    if (Array.isArray((activeChart as any).planets) && (activeChart as any).planets.length) {
      for (const p of (activeChart as any).planets) {
        const n = safeString((p as any).planet);
        if (majors.has(n)) base.push(p as any);
      }
    } else {
      base.push(
        { planet: 'Sun', ...(activeChart.sun as any) },
        { planet: 'Moon', ...(activeChart.moon as any) },
        { planet: 'Mercury', ...(activeChart.mercury as any) },
        { planet: 'Venus', ...(activeChart.venus as any) },
        { planet: 'Mars', ...(activeChart.mars as any) },
        { planet: 'Jupiter', ...(activeChart.jupiter as any) },
        { planet: 'Saturn', ...(activeChart.saturn as any) },
        { planet: 'Uranus', ...(activeChart.uranus as any) },
        { planet: 'Neptune', ...(activeChart.neptune as any) },
        { planet: 'Pluto', ...(activeChart.pluto as any) }
      );
    }

    const scores: Record<string, number> = {};
    for (const p of base) {
      const n = safeString((p as any).planet ?? (p as any).name);
      if (!n) continue;
      scores[n] = 0;
      const house = (p as any).house;
      if (house === 1 || house === 4 || house === 7 || house === 10) scores[n] += 2;
      if (house === 2 || house === 5 || house === 8 || house === 11) scores[n] += 1;
    }

    if (Array.isArray(activeChart.aspects)) {
      for (const a of activeChart.aspects) {
        const p1 = safeString(a.planet1?.name);
        const p2 = safeString(a.planet2?.name);

        if (p1 && scores[p1] !== undefined) scores[p1] += 1;
        if (p2 && scores[p2] !== undefined) scores[p2] += 1;

        if ((a.orb ?? 99) < 2) {
          if (p1 && scores[p1] !== undefined) scores[p1] += 0.5;
          if (p2 && scores[p2] !== undefined) scores[p2] += 0.5;
        }
      }
    }

    let best: string | null = null;
    let bestScore = -Infinity;
    for (const [k, v] of Object.entries(scores)) {
      if (v > bestScore) {
        bestScore = v;
        best = k;
      }
    }

    if (!best) return null;
    return base.find((p) => safeString((p as any).planet ?? (p as any).name) === best) || null;
  }, [activeChart]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <SkiaDynamicCosmos />
        <Text style={styles.loadingText}>Loading natal chart…</Text>
      </View>
    );
  }

  if (!userChart) {
    return (
      <View style={[styles.container, styles.center]}>
        <SkiaDynamicCosmos />
        <Text style={styles.loadingText}>No chart found. Create your chart from Home.</Text>
        <Pressable
          style={styles.goHomeBtn}
          onPress={() => router.push('/' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Go to Home"
        >
          <Text style={styles.goHomeText}>Go to Home</Text>
        </Pressable>
      </View>
    );
  }

  const birthDateStr = (() => {
    try {
      const chart = activeChart ?? userChart;
      const d = parseLocalDate((chart as any)?.birthData?.date);
      return d?.toLocaleDateString() ?? '';
    } catch {
      return '';
    }
  })();

  const houseCusps = activeChart?.houseCusps ?? [];

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <SkiaDynamicCosmos />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>
              {activeOverlays.length > 0 
                ? (activeOverlays.length > 1 ? 'Group Dynamic' : 'Relationship Chart') 
                : 'Your Chart'}
            </Text>
            <Text style={styles.subtitle}>
              {activeOverlays.length > 0
                ? `${(userChart as any).name || 'You'} + ${activeOverlays.length > 1 ? `${activeOverlays.length} Others` : activeOverlays[0].person.name}`
                : `${(userChart as any).name || 'Your Chart'}${birthDateStr ? ` · Born ${birthDateStr}` : ''}`}
            </Text>
            {activeOverlays.length === 0 && (
              <Text style={styles.headerFrame}>
                Your chart personalizes your reflection and growth prompts throughout MySky.
              </Text>
            )}
          </Animated.View>

          {/* ── People Bar (Premium Multi-Chart) ── */}
          {isPremium && (
            <Animated.View entering={FadeInDown.delay(120).duration(600)} style={{ width: '100%', alignItems: 'center' }}>
              <BlurView intensity={45} tint="dark" style={styles.glassPeopleBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleBar}>
                {/* Your chart chip (always first) */}
                <Pressable
                  onPress={() => {
                    setActiveOverlays([]);
                    Haptics.selectionAsync().catch(() => {});
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Your chart"
                  accessibilityState={{ selected: !overlayPerson }}
                >
                  {!overlayPerson ? (
                    <View style={[styles.personChip, styles.personChipActive]}>
                      <Ionicons name="person" size={14} color="#FFFFFF" />
                      <Text style={[styles.personChipText, { color: '#FFFFFF', fontWeight: '700' }]}>You</Text>
                    </View>
                  ) : (
                    <View style={styles.personChip}>
                      <Ionicons name="person" size={14} color={theme.textMuted} />
                      <Text style={styles.personChipText}>You</Text>
                    </View>
                  )}
                </Pressable>

                {/* People chips */}
                {people.map((person) => {
                  const isActive = overlayPerson?.id === person.id;
                  return (
                  <Pressable
                    key={person.id}
                    onPress={() => handleSelectOverlay(person)}
                    onLongPress={() => handleDeletePerson(person)}
                    accessibilityRole="button"
                    accessibilityLabel={`${person.name} overlay chart`}
                    accessibilityHint="Long press to remove"
                    accessibilityState={{ selected: isActive }}
                  >
                    {isActive ? (
                      <View style={[styles.personChip, styles.personChipActive]}>
                        <Ionicons name="layers-outline" size={14} color="#FFFFFF" />
                        <Text style={[styles.personChipText, { color: '#FFFFFF', fontWeight: '700' }]} numberOfLines={1}>
                          {person.name}
                        </Text>
                        <Text style={[styles.personChipRelation, { color: '#FFFFFF', opacity: 0.8 }]}>
                          {RELATIONSHIP_LABELS[person.relationship as RelationshipType] || ''}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.personChip}>
                        <Ionicons name="layers-outline" size={14} color={theme.textMuted} />
                        <Text style={styles.personChipText} numberOfLines={1}>
                          {person.name}
                        </Text>
                        <Text style={styles.personChipRelation}>
                          {RELATIONSHIP_LABELS[person.relationship as RelationshipType] || ''}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                )})}

                {/* Add person button — minimal circular icon */}
                <Pressable
                  onPress={() => setShowRelTypePicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Add person"
                >
                  <View style={styles.addPersonChip}>
                    <FontAwesome6 name="plus" size={13} color={'rgba(232,214,174,0.85)'} />
                  </View>
                </Pressable>
              </ScrollView>
              </BlurView>

              {/* Overlay legend when active — luxury pill tags */}
              {activeOverlays.length > 0 && (
                <View style={styles.overlayLegend}>
                  <View style={styles.legendPill}>
                    <View style={[styles.legendPillDot, { backgroundColor: '#FFFFFF' }]} />
                    <Text style={[styles.legendPillText, { color: '#FFFFFF' }]}>Your planets</Text>
                  </View>
                  {activeOverlays.map(overlay => {
                    const activeColor = overlay.theme === 'roseGold' ? '#E8C2CA' : overlay.theme === 'iceBlue' ? '#C4D2FA' : '#D1D5DB';
                    return (
                      <View key={`legend-${overlay.person.id}`} style={styles.legendPill}>
                        <View style={[styles.legendPillDot, { backgroundColor: activeColor }]} />
                        <Text style={[styles.legendPillText, { color: activeColor }]}>
                          {overlay.person.name}'s planets
                        </Text>
                      </View>
                    );
                  })}
                  {activeOverlays.length === 1 && (
                    <View style={styles.legendPill}>
                      <View style={[styles.legendPillDot, { backgroundColor: '#C3CAD6' }]} />
                      <Text style={[styles.legendPillText, { color: '#C3CAD6' }]}>Cross-aspects</Text>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          )}

          {/* ── Relationship Type Picker Modal ── */}
          {showRelTypePicker && (
            <View style={styles.relTypePickerOverlay}>
              <View style={[styles.relTypePicker, { backgroundColor: 'transparent' }]}> 
                <Text style={styles.relTypeTitle}>What's their relationship to you?</Text>
                {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((type) => (
                  <Pressable
                    key={type}
                    style={styles.relTypeOption}
                    onPress={() => handleAddPerson(type)}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${RELATIONSHIP_LABELS[type]}`}
                  >
                    <Text style={styles.relTypeOptionText}>{RELATIONSHIP_LABELS[type]}</Text>
                  </Pressable>
                ))}
                <Pressable
                  style={styles.relTypeCancelBtn}
                  onPress={() => setShowRelTypePicker(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={styles.relTypeCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Birth time warning ── */}
          {displayChart?.warnings?.length ? (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={18} color={theme.warning} />
              <Text style={styles.warningText}>{displayChart.warnings[0]}</Text>
            </View>
          ) : null}

          {/* ── Chart Wheel ── */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={{ alignItems: 'center', width: '100%' }}>
            <View style={styles.wheelFrame}>
              <View style={styles.wheelInner}>
                <NatalChartWheel
                  chart={userChart}
                  showAspects={true}
                  overlayChart={activeOverlays.length > 0 ? activeOverlays[0].chart : undefined}
                  overlayName={activeOverlays.length > 0 ? activeOverlays[0].person.name : undefined}
                />
              </View>
            </View>

            <Text style={styles.wheelHint}>Tap a person to overlay · Long-press to remove</Text>
          </Animated.View>

          {/* ── Big Three Summary ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ width: '100%' }}>
            <View style={[styles.bigThreeCard, { backgroundColor: 'transparent' }]}>
              <View style={styles.bigThreeRow}>
                <View style={styles.bigThreeItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <GradientSymbol symbol="☉" fontSize={16} w={20} h={20} />
                    <Text style={styles.bigThreeLabel}> Sun</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                    <GradientSymbol symbol={activeChart!.sun.sign.symbol} fontSize={18} w={22} h={20} />
                    <Text style={[styles.bigThreeSign, { marginTop: 0 }]}> {activeChart!.sun.sign.name}</Text>
                  </View>
                  <Text style={styles.bigThreeDeg}>
                    {activeChart!.sun.degree}°{String(activeChart!.sun.minute).padStart(2, '0')}' · H{activeChart!.sun.house}
                  </Text>
                </View>

                <View style={styles.bigThreeItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <GradientSymbol symbol="☽" fontSize={16} w={20} h={20} />
                    <Text style={styles.bigThreeLabel}> Moon</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                    <GradientSymbol symbol={activeChart!.moon.sign.symbol} fontSize={18} w={22} h={20} />
                    <Text style={[styles.bigThreeSign, { marginTop: 0 }]}> {activeChart!.moon.sign.name}</Text>
                  </View>
                  <Text style={styles.bigThreeDeg}>
                    {activeChart!.moon.degree}°{String(activeChart!.moon.minute).padStart(2, '0')}' · H{activeChart!.moon.house}
                  </Text>
                </View>

                {activeChart!.ascendant && (
                  <View style={styles.bigThreeItem}>
                    <Text style={styles.bigThreeLabel}>Rising</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                      <GradientSymbol symbol={activeChart!.ascendant.sign.symbol} fontSize={18} w={22} h={20} />
                      <Text style={[styles.bigThreeSign, { marginTop: 0 }]}> {activeChart!.ascendant.sign.name}</Text>
                    </View>
                    <Text style={styles.bigThreeDeg}>
                      {activeChart!.ascendant.degree}°{String(activeChart!.ascendant.minute).padStart(2, '0')}'
                    </Text>
                  </View>
                )}
              </View>

              {activeChart!.midheaven && (
                <View style={styles.mcRow}>
                  <Text style={styles.mcLabel}>MC · Midheaven</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
                    <GradientSymbol symbol={activeChart!.midheaven.sign.symbol} fontSize={22} w={26} h={24} />
                    <Text style={[styles.mcSign, { marginTop: 0 }]}> {activeChart!.midheaven.sign.name}</Text>
                  </View>
                  <Text style={styles.mcDeg}>
                    {activeChart!.midheaven.degree}°{String(activeChart!.midheaven.minute).padStart(2, '0')}'
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── Sensitive Points (Premium) ── */}
          {isPremium && sensitivePoints.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250).duration(600)} style={{ width: '100%' }}>
              <Text style={styles.sensitiveTitle}>Sensitive Points</Text>

              {/* 3-column coordinate grid */}
              <View style={styles.sensitiveGridCard}>
                {sensitivePoints.map((pt, idx) => {
                  const degStr = `${pt.degree}°${String(pt.minute).padStart(2, '0')}'${pt.house ? ` · H${pt.house}` : ''}`;
                  return (
                    <React.Fragment key={pt.label}>
                      {idx > 0 && <View style={styles.sensitiveVerticalDivider} />}
                      <View style={styles.sensitiveGridItem}>
                        <View style={{ marginBottom: 6 }}>
                          {pt.label === 'Chiron' && <GradientIcon size={22}><ChironIcon size={22} color={'#000'} /></GradientIcon>}
                          {pt.label === 'North Node' && <GradientIcon size={22}><NorthNodeIcon size={22} color={'#000'} /></GradientIcon>}
                          {pt.label === 'South Node' && <GradientIcon size={22}><SouthNodeIcon size={22} color={'#000'} /></GradientIcon>}
                        </View>
                        <Text style={styles.sensitiveGridName}>{pt.label}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                          <GradientSymbol symbol={pt.signSymbol} fontSize={12} w={15} h={14} />
                          <Text style={styles.sensitiveGridSign}> {pt.sign}</Text>
                        </View>
                        <Text style={styles.sensitiveGridDeg}>{degStr}</Text>
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>

              {/* Interpretation cards */}
              {(chironInsight || nodeInsight) && (
                <View style={styles.sensitiveInterpCard}>
                  {chironInsight && (
                    <View style={styles.sensitiveInterpBlock}>
                      <View style={styles.sensitiveInterpHeader}>
                        <View style={{ marginRight: 8 }}>
                          <GradientIcon size={16}><ChironIcon size={16} color={'#000'} /></GradientIcon>
                        </View>
                        <Text style={styles.sensitiveInterpTitle}>{chironInsight.title}</Text>
                      </View>
                      <Text style={styles.sensitiveInterpBody}>{chironInsight.theme}</Text>
                    </View>
                  )}

                  {chironInsight && nodeInsight && <View style={styles.sensitiveHorizDivider} />}

                  {nodeInsight && (
                    <View style={styles.sensitiveInterpBlock}>
                      <View style={styles.sensitiveInterpHeader}>
                        <View style={{ marginRight: 8 }}>
                          <GradientIcon size={16}><NorthNodeIcon size={16} color={'#000'} /></GradientIcon>
                        </View>
                        <Text style={styles.sensitiveInterpTitle}>Nodal Axis · Path Forward</Text>
                      </View>
                      <Text style={styles.sensitiveInterpBody}>{nodeInsight.fusionLine}</Text>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          )}

          {/* ── Tab Switcher ── */}
          <Animated.View entering={FadeInDown.delay(250).duration(600)}>
            <PremiumSegmentedControl
              options={[
                { id: 'planets', label: 'Planets', count: planetRows.length },
                { id: 'houses', label: 'Houses', count: houseCusps.length },
                { id: 'aspects', label: 'Aspects', count: sortedAspects.length },
                { id: 'patterns', label: 'Patterns', count: patternCount },
              ]}
              selectedIndex={['planets', 'houses', 'aspects', 'patterns'].indexOf(activeTab)}
              onChange={(index) => setActiveTab((['planets', 'houses', 'aspects', 'patterns'] as TabKey[])[index])}
            />
          </Animated.View>

          {/* ── Planets Table ── */}
          {activeTab === 'planets' && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ width: '100%' }}>
              <View style={styles.tableHeader}>
                <View style={{ width: 40 }} />
                <Text style={[styles.th, { flex: 1, textAlign: 'left' }]}>Planet</Text>
                <Text style={[styles.th, { width: 96, textAlign: 'right', paddingRight: 12 }]}>Sign</Text>
                <Text style={[styles.th, { width: 64, textAlign: 'right', paddingRight: 12 }]}>Deg</Text>
                <Text style={[styles.th, { width: 24, textAlign: 'center' }]}>H</Text>
              </View>

              {planetRows.map((row) => {
                const retro = getRetrogradeFlag(row.p as any);
                const planetSymbol = (row.p as any)?.planet?.symbol ?? '•';
                const degrees = `${row.p.degree}°${String(row.p.minute).padStart(2, '0')}'`;

                return (
                  <PlanetDataRow
                    key={row.label}
                    glyph={planetSymbol}
                    glyphFontSize={planetSymbol.length > 1 ? 13 : 20}
                    planet={row.label}
                    isRetrograde={retro}
                    signGlyph={row.p.sign.symbol}
                    sign={row.p.sign.name}
                    element={row.p.sign.element}
                    modality={row.p.sign.modality}
                    degrees={degrees}
                    house={row.p.house || '—'}
                  />
                );
              })}

              {/* Sensitive Points (table section) */}
              {sensitivePoints.length > 0 && (
                <>
                  <View style={styles.pointsDivider}>
                    <Text style={styles.pointsLabel}>Sensitive Points</Text>
                  </View>

                  {sensitivePoints.map((pt) => {
                    const icon =
                      pt.label === 'Chiron' ? <GradientIcon size={20}><ChironIcon size={20} color={'#000'} /></GradientIcon> :
                      pt.label === 'North Node' ? <GradientIcon size={20}><NorthNodeIcon size={20} color={'#000'} /></GradientIcon> :
                      <GradientIcon size={20}><SouthNodeIcon size={20} color={'#000'} /></GradientIcon>;
                    const degrees = `${pt.degree}°${String(pt.minute).padStart(2, '0')}'`;

                    return (
                      <PlanetDataRow
                        key={pt.label}
                        iconElement={icon}
                        planet={pt.label}
                        isRetrograde={pt.retrograde}
                        signGlyph={pt.signSymbol}
                        sign={pt.sign}
                        element={pt.element}
                        degrees={degrees}
                        house={pt.house || '—'}
                      />
                    );
                  })}
                </>
              )}
            </Animated.View>
          )}

          {/* ── Houses Table ── */}
          {activeTab === 'houses' && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ width: '100%' }}>
              {houseCusps.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="alert-circle-outline" size={32} color={theme.textMuted} />
                  <Text style={styles.emptyText}>House positions require a known birth time.</Text>
                </View>
              ) : (
                <>
                  {activeChart?.houseSystem && (
                    <Text style={styles.houseSystemLabel}>
                      {activeChart.houseSystem === 'whole-sign'
                        ? 'Whole Sign'
                        : activeChart.houseSystem === 'equal-house'
                          ? 'Equal House'
                          : activeChart.houseSystem.charAt(0).toUpperCase() + activeChart.houseSystem.slice(1)}{' '}
                      Houses
                    </Text>
                  )}

                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 1 }]}>House</Text>
                    <Text style={[styles.th, { flex: 2 }]}>Sign</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Deg</Text>
                    <Text style={[styles.th, { flex: 3 }]}>Theme</Text>
                  </View>

                  {houseCusps.map((cusp: HouseCuspType, idx: number) => {
                    const houseInfo = HOUSE_MEANINGS[cusp.house as keyof typeof HOUSE_MEANINGS];
                    const elColor = ELEMENT_COLORS[cusp.sign.element] || theme.textSecondary;

                    const simpleH = (activeChart as any)?.houses?.[idx];
                    const deg = simpleH ? Math.floor(simpleH.degree) : Math.floor(cusp.longitude % 30);
                    const min = simpleH
                      ? Math.round((simpleH.degree % 1) * 60)
                      : Math.floor((cusp.longitude % 1) * 60);

                    const isWholeSign = activeChart?.houseSystem === 'whole-sign';

                    return (
                      <LinearGradient
                        key={cusp.house}
                        colors={
                          idx % 2 === 0
                            ? ['rgba(14, 24, 48,0.5)', 'rgba(10, 18, 36,0.3)']
                            : ['rgba(10, 18, 36,0.4)', 'rgba(10, 18, 36,0.3)']
                        }
                        style={styles.tableRow}
                      >
                        <View style={[styles.td, { flex: 1, alignItems: 'center' }]}>
                          <Text style={styles.houseNumLarge}>{cusp.house}</Text>
                        </View>

                        <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                          <GradientSymbol symbol={cusp.sign.symbol} fontSize={18} w={24} h={24} style={{ marginRight: 6 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.signName, { color: elColor }]}>{cusp.sign.name}</Text>
                          </View>
                        </View>

                        <View style={[styles.td, { flex: 1 }]}>
                          <Text style={styles.degreeText}>
                            {isWholeSign ? '0°' : `${deg}°${String(min).padStart(2, '0')}'`}
                          </Text>
                        </View>

                        <View style={[styles.td, { flex: 3 }]}>
                          <Text style={styles.houseTheme}>{houseInfo?.theme || ''}</Text>
                        </View>
                      </LinearGradient>
                    );
                  })}
                </>
              )}
            </Animated.View>
          )}

          {/* ── Aspects Table ── */}
          {activeTab === 'aspects' && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ width: '100%' }}>
              {sortedAspects.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="git-network-outline" size={32} color={theme.textMuted} />
                  <Text style={styles.emptyText}>No aspects found.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 2 }]}>Planet 1</Text>
                    <Text style={[styles.th, { flex: 2 }]}>Aspect</Text>
                    <Text style={[styles.th, { flex: 2 }]}>Planet 2</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Orb</Text>
                  </View>

                  {sortedAspects.map((asp: Aspect, idx: number) => {
                    const natureColor = ASPECT_NATURE_COLORS[asp.type.nature] || theme.textSecondary;

                    const renderPlanetIcon = (planet: { name: string; symbol: string }) => {
                      if (planet.name === 'Chiron') {
                        return (
                          <View style={styles.aspectIconWrap}>
                            <GradientIcon size={18}><ChironIcon size={18} color={'#000'} /></GradientIcon>
                          </View>
                        );
                      }
                      if (planet.name === 'North Node') {
                        return (
                          <View style={styles.aspectIconWrap}>
                            <GradientIcon size={18}><NorthNodeIcon size={18} color={'#000'} /></GradientIcon>
                          </View>
                        );
                      }
                      if (planet.name === 'South Node') {
                        return (
                          <View style={styles.aspectIconWrap}>
                            <GradientIcon size={18}><SouthNodeIcon size={18} color={'#000'} /></GradientIcon>
                          </View>
                        );
                      }
                      if (MULTI_CHAR_PLANETS.has(planet.name)) {
                        return <GradientSymbol symbol={planet.symbol} fontSize={11} w={24} h={24} style={{ marginRight: 6 }} />;
                      }
                      return <GradientSymbol symbol={planet.symbol} fontSize={18} w={24} h={24} style={{ marginRight: 6 }} />;
                    };

                    return (
                      <LinearGradient
                        key={`${asp.planet1.name}-${asp.type.name}-${asp.planet2.name}-${idx}`}
                        colors={
                          idx % 2 === 0
                            ? ['rgba(14, 24, 48,0.5)', 'rgba(10, 18, 36,0.3)']
                            : ['rgba(10, 18, 36,0.4)', 'rgba(10, 18, 36,0.3)']
                        }
                        style={styles.tableRow}
                      >
                        <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                          {renderPlanetIcon(asp.planet1)}
                          <Text
                            style={[
                              styles.aspectPlanetName,
                              { flex: 1 },
                              MULTI_CHAR_PLANETS.has(asp.planet1.name) && { fontSize: 10 },
                            ]}
                          >
                            {asp.planet1.name}
                          </Text>
                        </View>

                        <View style={[styles.td, { flex: 2, alignItems: 'center' }]}>
                          <GradientSymbol symbol={asp.type.symbol} fontSize={18} w={24} h={24} />
                          <Text style={[styles.aspectName, { color: natureColor }]}>{asp.type.name}</Text>
                          <Text style={[styles.aspectNature, { color: natureColor }]}>{asp.type.nature}</Text>
                        </View>

                        <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                          {renderPlanetIcon(asp.planet2)}
                          <Text
                            style={[
                              styles.aspectPlanetName,
                              { flex: 1 },
                              MULTI_CHAR_PLANETS.has(asp.planet2.name) && { fontSize: 10 },
                            ]}
                          >
                            {asp.planet2.name}
                          </Text>
                        </View>

                        <View style={[styles.td, { flex: 1, alignItems: 'center' }]}>
                          <Text
                            style={[
                              styles.orbText,
                              {
                                color: asp.orb < 2 ? '#6EBF8B' : asp.orb < 5 ? theme.primary : theme.textSecondary,
                              },
                            ]}
                          >
                            {asp.orb.toFixed(1)}°
                          </Text>
                          {asp.isApplying && <Text style={styles.applyingLabel}>applying</Text>}
                        </View>
                      </LinearGradient>
                    );
                  })}

                  <View style={styles.legend}>
                    <Text style={styles.legendTitle}>Aspect Legend</Text>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: '#6EBF8B' }]} />
                      <Text style={styles.legendText}>Harmonious (trines, sextiles)</Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: '#E07A7A' }]} />
                      <Text style={styles.legendText}>Challenging (squares, oppositions)</Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: '#FFFFFF' }]} />
                      <Text style={styles.legendText}>Neutral (conjunctions)</Text>
                    </View>
                    <Text style={styles.legendNote}>Tighter orbs (lower numbers) = stronger influence</Text>
                  </View>

                  {!isPremium && hiddenAspectCount > 0 && (
                    <Pressable
                      onPress={() => router.push('/(tabs)/premium' as Href)}
                      accessibilityRole="button"
                      accessibilityLabel="Unlock more aspects"
                    >
                      <LinearGradient colors={['rgba(232, 214, 174,0.1)', 'rgba(232, 214, 174,0.05)']} style={styles.aspectUpsell}>
                        <Ionicons name="sparkles" size={16} color={theme.textPrimary} />
                        <Text style={styles.aspectUpsellText}>
                          {hiddenAspectCount} more subtle aspect{hiddenAspectCount > 1 ? 's' : ''} — sextiles, quincunxes, and more
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.textPrimary} />
                      </LinearGradient>
                    </Pressable>
                  )}
                </>
              )}
            </Animated.View>
          )}

          {/* ── Patterns Tab ── */}
          {activeTab === 'patterns' && chartPatterns && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ width: '100%' }}>
              {/* Chart Ruler */}
              {chartPatterns.chartRuler && (
                <LinearGradient colors={['rgba(232, 214, 174,0.15)', 'rgba(14, 24, 48,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Text style={[styles.patternIcon, { marginTop: -7 }]}>👑</Text>
                    <Text style={styles.patternTitle}>Chart Ruler</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <GradientSymbol symbol={chartPatterns.chartRuler.planetSymbol} fontSize={15} w={18} h={17} />
                      <Text style={styles.patternHighlightText}> {chartPatterns.chartRuler.planet} in </Text>
                      <GradientSymbol symbol={chartPatterns.chartRuler.rulerSignSymbol} fontSize={15} w={18} h={17} />
                      <Text style={styles.patternHighlightText}> {chartPatterns.chartRuler.rulerSign} · House {chartPatterns.chartRuler.rulerHouse}</Text>
                    </View>
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.chartRuler.description}</Text>
                  <View style={styles.tooltipBox}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                    <Text style={styles.tooltipText}>
                      Your chart ruler is the planet that rules your rising sign (<Text style={{ fontFamily: ZODIAC_FAMILY, color: '#E8D6AE' }}>{chartPatterns.chartRuler.risingSymbol}</Text>{' '}
                      {chartPatterns.chartRuler.risingSign}). Its placement colors your entire life path.
                    </Text>
                  </View>
                </LinearGradient>
              )}

              {/* Part of Fortune (premium) */}
              {isPremium && partOfFortune && (
                <LinearGradient colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="sunny-outline" size={20} color={theme.textPrimary} style={{ marginRight: 10 }} />
                    <Text style={styles.patternTitle}>Point of Flow</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <GradientSymbol symbol={partOfFortune.sign?.symbol ?? ''} fontSize={15} w={18} h={17} />
                      <Text style={styles.patternHighlightText}> {partOfFortune.sign?.name} · {Math.floor(partOfFortune.degree)}°{partOfFortune.house ? ` · House ${partOfFortune.house}` : ''}</Text>
                    </View>
                  </View>
                  <Text style={styles.patternDesc}>
                    This point (traditionally "Part of Fortune") reflects where you tend to find ease, natural resilience,
                    and a felt sense of alignment. Its sign and house shape how this feels in daily life.
                  </Text>
                  <View style={styles.tooltipBox}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                    <Text style={styles.tooltipText}>Calculated from your Sun, Moon, and Ascendant. A reflective archetype — not a prediction.</Text>
                  </View>
                </LinearGradient>
              )}

              {/* Dominant Planet (free) */}
              {dominantPlanet && (
                <LinearGradient colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternIcon}>🌟</Text>
                    <Text style={styles.patternTitle}>Dominant Planet</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <Text style={styles.patternHighlightText}>
                      {safeString((dominantPlanet as any).planet ?? (dominantPlanet as any).name)} in {(dominantPlanet as any).sign?.name} ·{' '}
                      {Math.floor((dominantPlanet as any).degree ?? 0)}°
                      {(dominantPlanet as any).house ? ` · House ${(dominantPlanet as any).house}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.patternDesc}>
                    Your dominant planet is the one most “active” in your chart (aspect involvement + angularity). Its themes tend to color your personality, motivations, and life path more than others.
                  </Text>
                  <View style={styles.tooltipBox}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                    <Text style={styles.tooltipText}>This is a calculated highlight, not a fate statement — it points to the loudest recurring signal.</Text>
                  </View>
                </LinearGradient>
              )}

              {/* Pattern Depth Upsell (free users only) */}
              {!isPremium && (
                <Pressable onPress={() => router.push('/(tabs)/premium' as Href)} accessibilityRole="button" accessibilityLabel="Unlock pattern depth">
                  <LinearGradient
                    colors={['rgba(232,214,174,0.08)', 'rgba(232,214,174,0.03)']}
                    style={[styles.patternCard, { borderWidth: 1, borderColor: 'rgba(232, 214, 174,0.18)' }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="lock-closed" size={16} color={theme.textPrimary} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.primary }}>More patterns in your chart</Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 3, lineHeight: 18 }}>
                          Stelliums, conjunction clusters, element & modality balance, retrograde emphasis, and Point of Flow
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={theme.textPrimary} />
                    </View>
                  </LinearGradient>
                </Pressable>
              )}

              {/* Stelliums (premium) */}
              {isPremium &&
                chartPatterns.stelliums.map((stellium, idx) => (
                  <LinearGradient
                    key={`stellium-${idx}`}
                    colors={['rgba(232, 214, 174,0.12)', 'rgba(14, 24, 48,0.7)']}
                    style={styles.patternCard}
                  >
                    <View style={styles.patternHeader}>
                      <Text style={[styles.patternIcon, { marginRight: -8, marginTop: -20, fontSize: 11 }]}>⚡</Text>
                      <Text style={styles.patternTitle}>{stellium.cardTitle}</Text>
                    </View>
                    <View style={styles.patternHighlight}>
                      <Text style={styles.patternHighlightText}>{stellium.planets.join(', ')}</Text>
                    </View>
                    <Text style={styles.patternDesc}>{stellium.subtitle}</Text>
                    <Text style={[styles.patternDesc, { marginTop: 8 }]}>{stellium.description}</Text>
                    {stellium.narrative ? (
                      <Text style={[styles.patternDesc, { marginTop: 10, lineHeight: 22 }]}>{stellium.narrative}</Text>
                    ) : null}
                    {stellium.planetMixNote && (
                      <Text style={[styles.patternDesc, { marginTop: 6, fontStyle: 'italic', opacity: 0.8 }]}>{stellium.planetMixNote}</Text>
                    )}
                    {stellium.retroNote && (
                      <Text style={[styles.patternDesc, { marginTop: 6, fontStyle: 'italic', opacity: 0.8 }]}>{stellium.retroNote}</Text>
                    )}
                    {stellium.elementCloser && (
                      <View style={styles.tooltipBox}>
                        <Ionicons name="leaf-outline" size={14} color={theme.textMuted} />
                        <Text style={styles.tooltipText}>{stellium.elementCloser}</Text>
                      </View>
                    )}
                  </LinearGradient>
                ))}

              {isPremium && chartPatterns.stelliumOverflow && (
                <View style={styles.tooltipBox}>
                  <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                  <Text style={styles.tooltipText}>Additional stelliums detected but not shown — your chart has several concentrated areas.</Text>
                </View>
              )}

              {/* Conjunction Clusters (premium) */}
              {isPremium &&
                chartPatterns.conjunctionClusters.map((cluster, idx) => (
                  <LinearGradient
                    key={`cluster-${idx}`}
                    colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']}
                    style={styles.patternCard}
                  >
                    <View style={styles.patternHeader}>
                      <Text style={styles.patternIcon}>🔗</Text>
                      <Text style={styles.patternTitle}>Conjunction Cluster</Text>
                    </View>
                    <View style={styles.patternHighlight}>
                      <Text style={styles.patternHighlightText}>{cluster.planets.join(' · ')}</Text>
                    </View>
                    <Text style={styles.patternDesc}>{cluster.description}</Text>
                    <View style={styles.tooltipBox}>
                      <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                      <Text style={styles.tooltipText}>Tightest orb: {cluster.tightestOrb.toFixed(1)}° — these planets blend their energies closely.</Text>
                    </View>
                  </LinearGradient>
                ))}

              {/* Retrograde Emphasis (premium) */}
              {isPremium && chartPatterns.retrogradeEmphasis.count >= 3 && (
                <LinearGradient colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternIcon}>℞</Text>
                    <Text style={styles.patternTitle}>Retrograde Emphasis</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <Text style={styles.patternHighlightText}>
                      {chartPatterns.retrogradeEmphasis.count} planets retrograde: {chartPatterns.retrogradeEmphasis.planets.join(', ')}
                    </Text>
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.retrogradeEmphasis.description}</Text>
                </LinearGradient>
              )}

              {/* Element Balance (premium) */}
              {isPremium && chartPatterns.elementBalance && (
                <LinearGradient colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternIcon}>🜂</Text>
                    <Text style={styles.patternTitle}>Element Balance</Text>
                  </View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }]}>
                    {Object.entries(chartPatterns.elementBalance.counts).map(([el, count]) => (
                      <Text
                        key={el}
                        style={[
                          styles.patternHighlightText,
                          {
                            color: el === chartPatterns.elementBalance.dominant ? ELEMENT_COLORS[el] || theme.primary : theme.textMuted,
                            fontSize: el === chartPatterns.elementBalance.dominant ? 15 : 13,
                          },
                        ]}
                      >
                        {el}: {count as number}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.elementBalance.description}</Text>
                  {chartPatterns.elementBalance.missing && (
                    <View style={styles.tooltipBox}>
                      <Ionicons name="water-outline" size={14} color={theme.textMuted} />
                      <Text style={styles.tooltipText}>No planets in {chartPatterns.elementBalance.missing} — this element's themes may require more conscious effort.</Text>
                    </View>
                  )}
                </LinearGradient>
              )}

              {/* Modality Balance (premium) */}
              {isPremium && chartPatterns.modalityBalance && (
                <LinearGradient colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternIcon}>⚖</Text>
                    <Text style={styles.patternTitle}>Modality Balance</Text>
                  </View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 16, justifyContent: 'center' }]}>
                    {Object.entries(chartPatterns.modalityBalance.counts).map(([mod, count]) => (
                      <Text
                        key={mod}
                        style={[
                          styles.patternHighlightText,
                          {
                            color: mod === chartPatterns.modalityBalance.dominant ? theme.primary : theme.textMuted,
                            fontSize: mod === chartPatterns.modalityBalance.dominant ? 15 : 13,
                          },
                        ]}
                      >
                        {mod}: {count as number}
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.modalityBalance.description}</Text>
                </LinearGradient>
              )}

              {/* Fallback (premium users only — free users see upsell card instead) */}
              {isPremium &&
                chartPatterns.stelliums.length === 0 &&
                chartPatterns.conjunctionClusters.length === 0 &&
                !chartPatterns.chartRuler &&
                chartPatterns.retrogradeEmphasis.count === 0 &&
                !chironInsight &&
                !nodeInsight && (
                  <View style={styles.emptyState}>
                    <Ionicons name="sparkles-outline" size={32} color={theme.textMuted} />
                    <Text style={styles.emptyText}>Your chart has a balanced distribution — no extreme concentrations detected.</Text>
                  </View>
                )}
            </Animated.View>
          )}

          {/* ── Deeper Sky Upsell (bottom, free users only) ── */}
          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ width: '100%' }}>
              <Pressable
                onPress={() => router.push('/(tabs)/premium' as Href)}
                accessibilityRole="button"
                accessibilityLabel="Unlock Deeper Sky premium features"
              >
                <LinearGradient
                  colors={['rgba(232, 214, 174,0.12)', 'rgba(232, 214, 174,0.04)']}
                  style={[styles.overlayUpsell, { borderWidth: 1, borderColor: 'rgba(232,214,174,0.18)' }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="sparkles" size={16} color={theme.textPrimary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.overlayUpsellText, { fontWeight: '600' }]}>Your chart has more to say</Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                        Chiron sensitivity, Node axis depth, chart overlays, and minor aspects
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={theme.textPrimary} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* ── Chart Settings ── */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.glossarySection}>
            <Pressable
              style={styles.chartSettingsCard}
              onPress={() => setShowAstrologyModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Chart settings"
            >
              <LinearGradient colors={['rgba(14, 24, 48, 0.6)', 'rgba(10, 18, 36, 0.4)']} style={styles.chartSettingsGradient}>
                <View style={styles.chartSettingsRow}>
                  <View style={{ flex: 1, marginRight: theme.spacing.md }}>
                    <View style={styles.chartSettingsHeader}>
                      <Ionicons name="planet" size={20} color={'#E8D6AE'} />
                      <Text style={styles.chartSettingsTitle}>Chart Settings</Text>
                    </View>
                    <Text style={styles.chartSettingsDescription}>House system, aspect orbs, and calculation preferences</Text>
                    <View style={styles.chartSettingsTags}>
                      <View style={styles.settingTag}>
                        <Text style={styles.settingTagText}>{houseSystemLabel}</Text>
                      </View>
                      <View style={styles.settingTag}>
                        <Text style={styles.settingTagText}>{orbPresetLabel} Orbs</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Chart Glossary ── */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.glossarySection}>
            <Pressable
              style={styles.glossarySectionTitleRow}
              onPress={async () => {
                try {
                  await Haptics.selectionAsync();
                } catch {}
                setShowGlossary((prev) => !prev);
              }}
              accessibilityRole="button"
              accessibilityLabel="Toggle chart glossary"
            >
              <Text style={styles.glossarySectionTitle}>Chart Glossary</Text>
              <Ionicons name={showGlossary ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textMuted} />
            </Pressable>

            {showGlossary && (
              <View style={styles.glossaryCard}>
                <LinearGradient colors={['rgba(14, 24, 48, 0.6)', 'rgba(10, 18, 36, 0.4)']} style={styles.glossaryGradient}>
                  {GLOSSARY.map((item, index) => (
                    <Pressable
                      key={item.term}
                      onPress={async () => {
                        try {
                          await Haptics.selectionAsync();
                        } catch {}
                        setExpandedTerm(expandedTerm === item.term ? null : item.term);
                      }}
                      style={[styles.glossaryRow, index < GLOSSARY.length - 1 && styles.glossaryRowBorder]}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.term}, glossary term`}
                    >
                      <View style={styles.glossaryHeader}>
                        <Text style={styles.glossaryTerm}>{item.term}</Text>
                        <Ionicons name={expandedTerm === item.term ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textMuted} />
                      </View>
                      {expandedTerm === item.term && <Text style={styles.glossaryDefinition}>{item.definition}</Text>}
                    </Pressable>
                  ))}
                </LinearGradient>
              </View>
            )}
          </Animated.View>

          {/* ── Section: Explore more ── */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Explore</Text>
            <View style={styles.exploreGrid}>
              <Pressable style={styles.exploreChip} onPress={() => router.push('/(tabs)/healing' as Href)}>
                 <LinearGradient colors={['rgba(35, 40, 55, 0.4)' as any, 'rgba(20, 24, 34, 0.7)' as any]} style={styles.exploreChipGradient}>
                   <View style={[styles.exploreIconWrap, { backgroundColor: 'rgba(212, 163, 179, 0.15)' }]}>
                     <Ionicons name="heart-outline" size={20} color="#D4A3B3" />
                   </View>
                   <View>
                     <Text style={styles.exploreChipTitle}>Healing</Text>
                     <Text style={styles.exploreChipSub}>Inner work</Text>
                   </View>
                 </LinearGradient>
              </Pressable>

              <Pressable style={styles.exploreChip} onPress={() => router.push('/(tabs)/relationships' as Href)}>
                 <LinearGradient colors={['rgba(35, 40, 55, 0.4)' as any, 'rgba(20, 24, 34, 0.7)' as any]} style={styles.exploreChipGradient}>
                   <View style={[styles.exploreIconWrap, { backgroundColor: 'rgba(224, 187, 228, 0.15)' }]}>
                     <Ionicons name="people-outline" size={20} color="#E0BBE4" />
                   </View>
                   <View>
                     <Text style={styles.exploreChipTitle}>Connections</Text>
                     <Text style={styles.exploreChipSub}>Relationship charts</Text>
                   </View>
                 </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* ── Chart Settings Modal ── */}
      <AstrologySettingsModal
        visible={showAstrologyModal}
        onClose={() => setShowAstrologyModal(false)}
        onSettingsChanged={(updated) => {
          setHouseSystemLabel(AstrologySettingsService.getHouseSystemLabel(updated.houseSystem));
          setOrbPresetLabel(AstrologySettingsService.getOrbPresetLabel(updated.orbPreset));
          // Clear overlays so they regenerate with new settings
          setActiveOverlays([]);
          // Recalculate chart with new house system / orb settings
          void loadChart();
        }}
      />

      {/* ── Add Person Modal ── */}
      <BirthDataModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSaveNewPerson} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    color: theme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  goHomeBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  goHomeText: { color: theme.primary, fontWeight: '700' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, alignItems: 'center' },

  header: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  headerFrame: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 17,
    opacity: 0.8,
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,179,0,0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  warningText: {
    color: theme.textSecondary,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },

  bigThreeCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  bigThreeRow: { flexDirection: 'row', justifyContent: 'space-evenly' },
  bigThreeItem: { alignItems: 'center', flex: 1 },
  bigThreeLabel: {
    color: theme.textSecondary,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontWeight: '500',
  },
  bigThreeSign: { color: theme.textPrimary, fontWeight: '700', fontSize: 15, marginTop: 6, textAlign: 'center', letterSpacing: 0.3 },
  bigThreeDeg: { color: theme.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center', fontVariant: ['tabular-nums'] },
  mcRow: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    width: '100%',
  },
  mcLabel: { color: theme.textSecondary, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center', fontWeight: '500' },
  mcSign: { color: theme.textPrimary, fontWeight: '700', fontSize: 18, marginTop: 4, textAlign: 'center', letterSpacing: 0.3 },
  mcDeg: { color: theme.textSecondary, fontSize: 11, marginTop: 2, textAlign: 'center', fontVariant: ['tabular-nums'] },

  sensitiveCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  sensitiveTitle: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  sensitiveGridCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(14, 18, 32, 0.7)',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    width: '100%',
  },
  sensitiveGridItem: {
    flex: 1,
    alignItems: 'center',
  },
  sensitiveVerticalDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 4,
  },
  sensitiveGridName: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  sensitiveGridSign: {
    color: theme.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  sensitiveGridDeg: {
    color: theme.textMuted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  sensitiveInterpCard: {
    backgroundColor: 'rgba(14, 18, 32, 0.7)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  sensitiveInterpBlock: {
    padding: 20,
  },
  sensitiveInterpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sensitiveInterpTitle: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    flex: 1,
  },
  sensitiveInterpBody: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '400',
  },
  sensitiveHorizDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 20,
  },

  insightBox: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    width: '100%',
  },
  insightLabel: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  insightTitle: { color: '#E8D6AE', fontSize: 15, fontWeight: '600', fontFamily: 'serif', textAlign: 'center' },
  insightText: { color: theme.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },

  pointsDivider: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 214, 174,0.15)',
  },
  pointsLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },

  tabRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(10, 18, 36,0.5)',
    padding: 4,
    width: '100%',
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.borderRadius.md },
  tabBtnActive: { backgroundColor: 'transparent' },
  tabText: { color: theme.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: theme.primary },

  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 214, 174,0.15)',
    width: '100%',
  },
  th: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  wheelFrame: {
    width: '100%',
    alignItems: 'center',
    padding: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  wheelInner: {
    width: '100%',
    alignItems: 'center',
    padding: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  wheelHint: {
    marginTop: 10,
    color: theme.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.85,
  },

  td: { justifyContent: 'center', alignItems: 'center' },

  planetSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: '#E8D6AE', marginRight: 10, width: 28, textAlign: 'center' },
  signSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: '#E8D6AE', marginRight: 6, width: 24, textAlign: 'center' },
  planetName: { color: theme.textPrimary, fontWeight: '600', fontSize: 14, textAlign: 'center' },
  retroLabel: { color: '#E8D6AE', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  signName: { fontWeight: '600', fontSize: 12, textAlign: 'center' },
  elementLabel: { color: theme.textMuted, fontSize: 10, textAlign: 'center' },
  degreeText: { color: theme.textPrimary, fontWeight: '600', fontSize: 14, textAlign: 'center' },
  minuteText: { color: theme.textSecondary, fontSize: 11, textAlign: 'center' },
  houseNum: { color: theme.textPrimary, fontWeight: '700', fontSize: 16, textAlign: 'center' },

  houseSystemLabel: {
    color: theme.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    width: '100%',
  },
  houseNumLarge: { color: theme.primary, fontWeight: '700', fontSize: 18, textAlign: 'center' },
  houseTheme: { color: theme.textSecondary, fontSize: 12, lineHeight: 16, textAlign: 'center' },

  aspectPlanetSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: '#E8D6AE', marginRight: 6, width: 24, textAlign: 'center' },
  aspectIconWrap: { width: 24, marginRight: 6, alignItems: 'center', justifyContent: 'center' },
  aspectPlanetName: { color: theme.textPrimary, fontWeight: '600', fontSize: 13, textAlign: 'center' },
  aspectSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: '#E8D6AE', fontWeight: '700', textAlign: 'center' },
  aspectName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  aspectNature: { fontSize: 9, fontStyle: 'italic', textAlign: 'center' },
  orbText: { fontWeight: '700', fontSize: 14, textAlign: 'center' },
  applyingLabel: { color: theme.textMuted, fontSize: 9, fontStyle: 'italic', textAlign: 'center' },

  legend: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(10, 18, 36,0.4)',
    alignItems: 'center',
  },
  legendTitle: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, justifyContent: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { color: theme.textSecondary, fontSize: 13, textAlign: 'center' },
  legendNote: { color: theme.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: theme.spacing.sm, textAlign: 'center' },

  aspectUpsell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: 8,
  },
  aspectUpsellText: { flex: 1, color: theme.primary, fontSize: 13, fontStyle: 'italic', lineHeight: 18, textAlign: 'center' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: theme.textMuted, fontSize: 14, marginTop: 12, textAlign: 'center' },

  patternCard: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, marginBottom: theme.spacing.md, width: '100%', alignItems: 'center' },
  patternHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md },
  patternIcon: { fontSize: 20, marginRight: 10 },
  patternTitle: { color: theme.textPrimary, fontWeight: '700', fontSize: 17, textAlign: 'center' },
  patternHighlight: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.md,
    alignSelf: 'center',
  },
  patternHighlightText: { color: theme.primary, fontWeight: '700', fontSize: 15, textAlign: 'center' },
  patternDesc: { color: theme.textSecondary, fontSize: 13, lineHeight: 20, marginTop: theme.spacing.sm, textAlign: 'center' },
  tooltipBox: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', backgroundColor: 'transparent', borderRadius: theme.borderRadius.md, padding: 10, marginTop: theme.spacing.md },
  tooltipText: { color: theme.textMuted, fontSize: 11, lineHeight: 16, marginLeft: 6, flex: 1, fontStyle: 'italic', textAlign: 'center' },

  // ── People Bar (Multi-Chart) ──
  peopleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 8,
  },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  personChipActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
  },
  personChipText: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 80,
  },
  personChipTextActive: { color: theme.primary },
  personChipRelation: { color: theme.textMuted, fontSize: 10, fontStyle: 'italic', opacity: 0.7 },

  addPersonChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPersonText: { color: theme.primary, fontSize: 13, fontWeight: '600' },

  // ── Glassmorphism people bar ──
  glassPeopleBar: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(14, 14, 20, 0.45)',
    maxWidth: '100%',
    marginBottom: 8,
  },
  overlayLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  legendPillDot: { width: 6, height: 6, borderRadius: 3 },
  legendPillText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },

  // ── Relationship Type Picker ──
  relTypePickerOverlay: { width: '100%', marginBottom: theme.spacing.md },
  relTypePicker: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, alignItems: 'center' },
  relTypeTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: theme.spacing.md, textAlign: 'center' },
  relTypeOption: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'transparent',
    marginBottom: 6,
    alignItems: 'center',
  },
  relTypeOptionText: { color: theme.textPrimary, fontSize: 15, fontWeight: '600' },
  relTypeCancelBtn: { marginTop: theme.spacing.sm, paddingVertical: 10, alignItems: 'center' },
  relTypeCancelText: { color: theme.textMuted, fontSize: 14, fontWeight: '500' },

  // ── Overlay Upsell (Free users) ──
  overlayUpsell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: 8,
    marginTop: 48,
    marginBottom: theme.spacing.xl,
  },
  overlayUpsellText: { flex: 1, color: theme.primary, fontSize: 13, fontStyle: 'italic', lineHeight: 18, textAlign: 'center' },

  // ── Chart Settings card ──
  chartSettingsCard: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.cardBorder, marginBottom: theme.spacing.md },
  chartSettingsGradient: { padding: theme.spacing.lg },
  chartSettingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartSettingsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs },
  chartSettingsTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginLeft: theme.spacing.sm },
  chartSettingsDescription: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  chartSettingsTags: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  settingTag: { backgroundColor: 'transparent', paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.sm },
  settingTagText: { fontSize: 11, color: '#E8D6AE', fontWeight: '500' },

  // ── Chart Glossary ──
  glossarySection: { alignSelf: 'stretch', marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl },
  glossarySectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  glossarySectionTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif' },
  glossaryCard: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.cardBorder },
  glossaryGradient: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
  glossaryRow: { paddingVertical: theme.spacing.md },
  glossaryRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
  glossaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  glossaryTerm: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif', flex: 1 },
  glossaryDefinition: { fontSize: 14, color: '#E8D6AE', lineHeight: 20, marginTop: theme.spacing.xs },

  // ── Explore Section ──
  section: { width: '100%', marginBottom: 32 },
  sectionTitle: { fontSize: 18, color: theme.textPrimary, fontFamily: 'serif', marginBottom: 12, letterSpacing: 0.3, paddingLeft: 4, alignSelf: 'flex-start' },
  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  exploreChip: { width: '48%', flexGrow: 1, borderRadius: 16, overflow: 'hidden' },
  exploreChipGradient: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 80, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16 },
  exploreIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  exploreChipTitle: { color: theme.textPrimary, fontWeight: '600', fontSize: 15, marginBottom: 2 },
  exploreChipSub: { color: theme.textMuted, fontSize: 12 },

  // ── Premium planet data rows ──
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(14, 18, 32, 0.55)',
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  premiumColGlyph: {
    width: 32,
    alignItems: 'center',
  },
  premiumColPlanet: {
    flex: 1,
    paddingLeft: 8,
  },
  premiumColSign: {
    width: 96,
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  premiumColDegrees: {
    width: 64,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  premiumColHouse: {
    width: 24,
    alignItems: 'center',
  },
  premiumPlanetText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
    letterSpacing: 0.3,
  },
  premiumRxBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 4,
  },
  premiumRxText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  premiumSignText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  premiumMetaText: {
    fontSize: 10,
    color: theme.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  premiumDegreeText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
  premiumHouseText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
  },
});
