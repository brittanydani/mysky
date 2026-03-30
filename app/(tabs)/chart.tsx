// File: app/(tabs)/chart.tsx

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import { metallicFillColors, metallicFillPositions } from '../../constants/mySkyMetallic';
import { METALLIC_RED } from '../../constants/metallicPalettes';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaBreathingRing from '../../components/ui/SkiaBreathingRing';
import NatalChartWheel from '../../components/ui/NatalChartWheel';
import MoonPhaseView from '../../components/ui/MoonPhaseView';
import { ChironIcon, NorthNodeIcon, SouthNodeIcon, LilithIcon, PartOfFortuneIcon, VertexIcon, PholusIcon } from '../../components/ui/AstrologyIcons';
import BirthDataModal from '../../components/BirthDataModal';
import AstrologySettingsModal from '../../components/AstrologySettingsModal';
import { localDb } from '../../services/storage/localDb';
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
import { MetallicText } from '../../components/ui/MetallicText';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { logger } from '../../utils/logger';
import { detectExtendedPatterns, ExtendedPatterns } from '../../services/astrology/aspectPatterns';
import { generateThemedSections, getAspectInterpretation, ThemedSection } from '../../services/astrology/natalInterpretations';
import { parseLocalDate } from '../../utils/dateUtils';
import { analyzeChartDignity, analyzeDispositorChain, detectChartShape, detectSingletons, detectInterceptions, ChartDignityAnalysis, DispositorChain, ChartShapeResult, Singleton, Interception } from '../../services/astrology/dignityService';
import { generatePlanetDeepDive, generateHouseDeepDives, generateAngleInterpretations, selectKeyAspects, generatePointInterpretations, PlanetDeepDive, HouseDeepDive, AngleInterpretation, KeyAspect, PointInterpretation } from '../../services/astrology/natalDeepInterpretations';
import { generateCoreIdentitySummary, generateRelationshipProfile, generateCareerProfile, generateEmotionalProfile, generateShadowGrowth, CoreIdentitySummary, RelationshipProfile, CareerProfile, EmotionalProfile, ShadowGrowthProfile } from '../../services/astrology/natalSynthesis';

// ── Colors per element ──
const ELEMENT_COLORS: Record<string, string> = {
  Fire:  '#FF7A5C', // warm coral-red — fire energy
  Earth: '#9ACD32', // lime-green — grounded, nature
  Air:   '#49DFFF', // sky cyan — intellect, breath
  Water: '#7B68EE', // periwinkle violet — emotion, depth
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
  Harmonious: '#9ACD32',
  Challenging: '#E07A7A',
  Neutral: '#FFDA03',
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

const RED_GRAD_PROPS = {
  colors: [...METALLIC_RED] as string[],
  locations: [0, 0.25, 0.5, 0.75, 1],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

// ── Fallback symbols for aspect glyphs that don't render on mobile ──
const SAFE_ASPECT_SYMBOLS: Record<string, string> = {
  Sextile:        '✱',   // ⚹ may not render; ✱ (U+2731) is widely supported
  Semisextile:    '∨',   // ⚺ rarely available; ∨ (logical or, U+2228)
  Quincunx:       '⊻',   // ⚻ rarely available; ⊻ (xor, U+22BB)
  Sesquiquadrate: '⊞',   // ⚼ rarely available; ⊞ (squared plus, U+229E)
};

/** Renders a zodiac/planet text glyph with the metallic fill gradient. */
function GradientSymbol({
  symbol,
  fontSize = 18,
  w = 28,
  h = 24,
  style,
  gradient,
}: {
  symbol: string;
  fontSize?: number;
  w?: number;
  h?: number;
  style?: object;
  gradient?: typeof GRAD_PROPS;
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
      <LinearGradient {...(gradient ?? GRAD_PROPS)} style={{ width: w, height: h }} />
    </MaskedView>
  );
}

/** Wraps a Chiron/Node SVG icon with the metallic fill gradient. */
function GradientIcon({ size, children }: { size: number; children: React.ReactElement }) {
  return (
    <MaskedView style={{ width: size, height: size }} maskElement={children}>
      <LinearGradient {...GRAD_PROPS} style={{ width: size, height: size }} />
    </MaskedView>
  );
}

/** Collapsible section wrapper to reduce chart screen density. */
function SectionAccordion({
  title, subtitle, sectionKey, openSections, setOpenSections, children,
}: {
  title: string; subtitle?: string; sectionKey: string;
  openSections: Set<string>;
  setOpenSections: React.Dispatch<React.SetStateAction<Set<string>>>;
  children: React.ReactNode;
}) {
  const isOpen = openSections.has(sectionKey);
  return (
    <>
      <Pressable
        onPress={() =>
          setOpenSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionKey)) next.delete(sectionKey);
            else next.add(sectionKey);
            return next;
          })
        }
        style={[styles.themedSectionHeader, { flexDirection: 'row', alignItems: 'center' }]}
        accessibilityRole="button"
        accessibilityLabel={`Toggle ${title}`}
      >
        <View style={{ width: 20 }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.themedSectionHeaderText, { textAlign: 'center' }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.patternDesc, { textAlign: 'center', marginTop: 4 }]}>{subtitle}</Text>
          ) : null}
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textMuted} />
      </Pressable>
      {isOpen ? children : null}
    </>
  );
}

type TabKey = 'planets' | 'houses' | 'aspects' | 'patterns';

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
  const [activeOverlays, setActiveOverlays] = useState<({person: RelationshipChart, chart: NatalChart, theme: 'silver'|'roseGold'|'iceBlue'})[]>([]);
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
      setZodiacSystemLabel(astroSettings.zodiacSystem === 'sidereal' ? 'Sidereal' : 'Tropical');

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

  // ── Sensitive points (Chiron, Nodes, Lilith, Vertex, Part of Fortune, Pholus) ──
  const sensitivePoints = useMemo(() => {
    if (!activeChart) return [];
    const points: {
      label: string;
      sign: string;
      signSymbol: string;
      element: string;
      degree: number;
      minute: number;
      house?: number;
      retrograde: boolean;
      icon?: React.ReactNode;
    }[] = [];

    // Helper to add a point
    function addPoint(label: string, sign: string, degree: number, minute: number, house: number | undefined, retrograde: boolean, icon?: React.ReactNode) {
      const lookup = SIGN_LOOKUP[sign] || { symbol: '', element: '' };
      points.push({
        label,
        sign,
        signSymbol: lookup.symbol,
        element: lookup.element,
        degree,
        minute,
        house,
        retrograde,
        icon,
      });
    }

    // Planets array: Chiron, Nodes, Lilith, Pholus
    if (Array.isArray(activeChart.planets)) {
      for (const p of activeChart.planets as any[]) {
        const name = safeString(p.planet).toLowerCase();
        const signName = safeString(p.sign);
        const { deg, min } = normalizeDegMin(Number(p.degree ?? 0));
        const house = typeof p.house === 'number' ? p.house : undefined;
        const retrograde = getRetrogradeFlag(p);
        if (name === 'chiron') {
          addPoint('Chiron', signName, deg, min, house, retrograde, <ChironIcon size={20} color={'#000'} />);
        } else if (name === 'north node' || name === 'northnode' || name === 'true node') {
          addPoint('North Node', signName, deg, min, house, retrograde, <NorthNodeIcon size={20} color={'#000'} />);
        } else if (name === 'south node' || name === 'southnode') {
          addPoint('South Node', signName, deg, min, house, retrograde, <SouthNodeIcon size={20} color={'#000'} />);
        } else if (name === 'lilith' || name === 'black moon lilith') {
          addPoint('Lilith', signName, deg, min, house, retrograde, <LilithIcon size={20} color={'#000'} />);
        } else if (name === 'pholus') {
          addPoint('Pholus', signName, deg, min, house, retrograde, <PholusIcon size={20} color={'#000'} />);
        }
      }
    }

    // Vertex (from angles)
    if (Array.isArray(activeChart.angles)) {
      for (const angle of activeChart.angles) {
        if (angle.name === 'Vertex') {
          const signName = safeString(angle.sign);
          const { deg, min } = normalizeDegMin(Number(angle.degree ?? 0));
          addPoint('Vertex', signName, deg, min, undefined, false, <VertexIcon size={20} color={'#000'} />);
        }
      }
    }

    // Part of Fortune (from partOfFortune field)
    if (activeChart.partOfFortune) {
      const pf = activeChart.partOfFortune;
      addPoint('Part of Fortune', safeString(pf.sign?.name ?? pf.sign), pf.degree, pf.minute, pf.house, false, <PartOfFortuneIcon size={20} color={'#000'} />);
    }

    // Order: North Node, South Node, Chiron, Lilith, Vertex, Part of Fortune, Pholus
    const order: Record<string, number> = {
      'North Node': 0,
      'South Node': 1,
      'Chiron': 2,
      'Lilith': 3,
      'Vertex': 4,
      'Part of Fortune': 5,
      'Pholus': 6,
    };
    return points.sort((a, b) => (order[a.label] ?? 99) - (order[b.label] ?? 99));
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
    const FREE_ASPECT_TYPES = new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition']);
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

  // ── Pattern count for tab label (tier-aware) ──
  const patternCount = useMemo(() => {
    if (!chartPatterns) return 0;
    let count = 0;
    // Free tier: element + modality + polarity balance always visible
    if (chartPatterns.elementBalance) count++;
    if (chartPatterns.modalityBalance) count++;
    if (chartPatterns.polarityBalance) count++;
    if (!isPremium) return count;
    // Premium additions
    if (chartPatterns.chartRuler) count++;
    if (activeChart?.partOfFortune) count++;
    if (chartPatterns.dominantFactors.planet) count++;
    count += chartPatterns.stelliums.length;
    count += chartPatterns.conjunctionClusters.length;
    if (chartPatterns.retrogradeEmphasis.count >= 3) count++;
    return count;
  }, [chartPatterns, activeChart, isPremium]);

  // ── Part of Fortune (free) ──
  const partOfFortune = useMemo(() => {
    if (!activeChart?.partOfFortune) return null;
    return activeChart.partOfFortune;
  }, [activeChart]);

  // ── Dominant placement (premium) — from chartPatterns.dominantFactors ──
  const dominantPlacement = useMemo(() => {
    if (!activeChart || !chartPatterns) return null;
    const name = chartPatterns.dominantFactors.planet;
    if (!name) return null;
    return (activeChart.planets ?? []).find((p: any) => safeString(p.planet) === name) ?? null;
  }, [activeChart, chartPatterns]);

  // ── Extended patterns: aspect patterns, hemisphere emphasis, house emphasis ──
  const extendedPatterns = useMemo<ExtendedPatterns | null>(() => {
    if (!activeChart) return null;
    return detectExtendedPatterns(activeChart);
  }, [activeChart]);

  // ── Themed interpretation sections (premium) ──
  const themedSections = useMemo<ThemedSection[]>(() => {
    if (!activeChart || !isPremium) return [];
    return generateThemedSections(activeChart);
  }, [activeChart, isPremium]);

  // ── Expanded interpretation section state ──
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // ── View mode toggle: 'essentials' vs 'complete' ──
  const [viewMode, setViewMode] = useState<'essentials' | 'complete'>('essentials');

  // ── Core Identity Summary (blended Sun/Moon/Rising/chart ruler) ──
  const coreIdentity = useMemo<CoreIdentitySummary | null>(() => {
    if (!activeChart) return null;
    return generateCoreIdentitySummary(activeChart);
  }, [activeChart]);

  // ── Key Aspects (top 10 most important) ──
  const keyAspects = useMemo<KeyAspect[]>(() => {
    if (!activeChart) return [];
    return selectKeyAspects(activeChart, 10);
  }, [activeChart]);

  // ── Dignity Analysis ──
  const dignityAnalysis = useMemo<ChartDignityAnalysis | null>(() => {
    if (!activeChart || !isPremium) return null;
    return analyzeChartDignity(activeChart);
  }, [activeChart, isPremium]);

  // ── Dispositor Chain ──
  const dispositorChain = useMemo<DispositorChain | null>(() => {
    if (!activeChart || !isPremium) return null;
    return analyzeDispositorChain(activeChart);
  }, [activeChart, isPremium]);

  // ── Chart Shape ──
  const chartShape = useMemo<ChartShapeResult | null>(() => {
    if (!activeChart || !isPremium) return null;
    return detectChartShape(activeChart);
  }, [activeChart, isPremium]);

  // ── Singletons ──
  const singletons = useMemo<Singleton[]>(() => {
    if (!activeChart || !isPremium) return [];
    return detectSingletons(activeChart);
  }, [activeChart, isPremium]);

  // ── Interceptions ──
  const interceptions = useMemo<Interception[]>(() => {
    if (!activeChart || !isPremium) return [];
    return detectInterceptions(activeChart);
  }, [activeChart, isPremium]);

  // ── Planet Deep Dives ──
  const planetDeepDives = useMemo<PlanetDeepDive[]>(() => {
    if (!activeChart || !isPremium) return [];
    const placements = [
      activeChart.sun, activeChart.moon, activeChart.mercury, activeChart.venus, activeChart.mars,
      activeChart.jupiter, activeChart.saturn, activeChart.uranus, activeChart.neptune, activeChart.pluto,
    ].filter(Boolean);
    return placements.map(p => generatePlanetDeepDive(p, activeChart.aspects ?? []));
  }, [activeChart, isPremium]);

  // ── House Deep Dives ──
  const houseDeepDives = useMemo<HouseDeepDive[]>(() => {
    if (!activeChart || !isPremium) return [];
    return generateHouseDeepDives(activeChart);
  }, [activeChart, isPremium]);

  // ── Angle Interpretations ──
  const angleInterpretations = useMemo<AngleInterpretation[]>(() => {
    if (!activeChart) return [];
    return generateAngleInterpretations(activeChart);
  }, [activeChart]);

  // ── Point Interpretations ──
  const pointInterpretations = useMemo<PointInterpretation[]>(() => {
    if (!activeChart || !isPremium) return [];
    return generatePointInterpretations(activeChart);
  }, [activeChart, isPremium]);

  // ── Relationship Profile ──
  const relationshipProfile = useMemo<RelationshipProfile | null>(() => {
    if (!activeChart || !isPremium) return null;
    return generateRelationshipProfile(activeChart);
  }, [activeChart, isPremium]);

  // ── Career Profile ──
  const careerProfile = useMemo<CareerProfile | null>(() => {
    if (!activeChart || !isPremium) return null;
    return generateCareerProfile(activeChart);
  }, [activeChart, isPremium]);

  // ── Emotional Profile ──
  const emotionalProfile = useMemo<EmotionalProfile | null>(() => {
    if (!activeChart || !isPremium) return null;
    return generateEmotionalProfile(activeChart);
  }, [activeChart, isPremium]);

  // ── Shadow & Growth ──
  const shadowGrowth = useMemo<ShadowGrowthProfile | null>(() => {
    if (!activeChart || !isPremium) return null;
    return generateShadowGrowth(activeChart);
  }, [activeChart, isPremium]);

  // ── Expanded deep-dive section tracking ──
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);
  const [expandedHouse, setExpandedHouse] = useState<number | null>(null);
  const [expandedLifeTheme, setExpandedLifeTheme] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['bigThree', 'coreIdentity', 'chartStory']));

  // ── Angles from chart (Descendant, IC) ──
  const descendant = useMemo(() => {
    return (activeChart?.angles ?? []).find(a => a.name === 'Descendant') ?? null;
  }, [activeChart]);

  const ic = useMemo(() => {
    return (activeChart?.angles ?? []).find(a => a.name === 'IC') ?? null;
  }, [activeChart]);

  // ── Zodiac system label ──
  const [zodiacSystemLabel, setZodiacSystemLabel] = useState<string>('Tropical');

  // ── Planets grouped by house (for houses tab) ──
  const planetsByHouse = useMemo(() => {
    if (!activeChart) return new Map<number, string[]>();
    const map = new Map<number, string[]>();
    const planets = [
      activeChart.sun, activeChart.moon, activeChart.mercury, activeChart.venus, activeChart.mars,
      activeChart.jupiter, activeChart.saturn, activeChart.uranus, activeChart.neptune, activeChart.pluto,
    ].filter(Boolean);
    for (const p of planets) {
      if (!p.house) continue;
      if (!map.has(p.house)) map.set(p.house, []);
      map.get(p.house)!.push(p.planet.name);
    }
    return map;
  }, [activeChart]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <SkiaDynamicCosmos />
        <SkiaBreathingRing size={80} color="gold" rings={2} />
        <Text style={[styles.loadingText, { marginTop: 20 }]}>Loading natal chart…</Text>
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
          onPress={() => router.replace('/(tabs)/home' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Go to Home"
        >
          <MetallicText style={styles.goHomeText} color="#CFAE73">Go to Home</MetallicText>
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
        <SkiaDynamicCosmos fill="#020817" />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 4 }}>
              <Pressable onPress={() => router.replace('/(tabs)/blueprint' as Href)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MetallicIcon name="arrow-back-outline" size={18} color="rgba(255,255,255,0.5)" />
                <MetallicText style={{ fontSize: 14, letterSpacing: 0.3 }} color="rgba(255,255,255,0.5)">Identity</MetallicText>
              </Pressable>
              <MoonPhaseView size={34} />
            </View>
            <Text style={styles.title}>
              {activeOverlays.length > 0 
                ? (activeOverlays.length > 1 ? 'Group Dynamic' : 'Relationship Chart') 
                : 'Your Chart'}
            </Text>
            <GoldSubtitle style={styles.subtitle}>
              {activeOverlays.length > 0
                ? `${(userChart as any).name || 'You'} + ${activeOverlays.length > 1 ? `${activeOverlays.length} Others` : activeOverlays[0].person.name}`
                : `${(userChart as any).name || 'Your Chart'}${birthDateStr ? ` · Born ${birthDateStr}` : ''}`}
            </GoldSubtitle>
            {activeOverlays.length === 0 && (
              <Text style={styles.headerFrame}>
                Your chart personalizes your reflection and growth prompts throughout MySky.
              </Text>
            )}
          </Animated.View>

          {/* ── People Bar (Premium Multi-Chart) ── */}
          {isPremium && (
            <Animated.View entering={FadeInDown.delay(120).duration(600)} style={{ width: '100%' }}>
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
                      <Ionicons name="person-outline" size={14} color="#FFFFFF" />
                      <Text style={[styles.personChipText, { color: '#FFFFFF', fontWeight: '700' }]}>You</Text>
                    </View>
                  ) : (
                    <View style={styles.personChip}>
                      <Ionicons name="person-outline" size={14} color={theme.textMuted} />
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

                {/* Add person button */}
                <Pressable
                  onPress={() => setShowRelTypePicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Add person"
                >
                  <LinearGradient
                    colors={[...metallicFillColors]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addPersonChip}
                  >
                    <FontAwesome6 name="plus" size={12} color={"#141222"} />
                    <Text style={[styles.addPersonText, { color: "#141222", fontWeight: "700" }]}>Add</Text>
                  </LinearGradient>
                </Pressable>
              </ScrollView>

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
                        <MetallicText style={styles.legendPillText} color={activeColor}>
                          {overlay.person.name}'s planets
                        </MetallicText>
                      </View>
                    );
                  })}
                  {activeOverlays.length === 1 && (
                    <View style={styles.legendPill}>
                      <View style={[styles.legendPillDot, { backgroundColor: '#C3CAD6' }]} />
                      <MetallicText style={styles.legendPillText} color="#C3CAD6">Cross-aspects</MetallicText>
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
            <SectionAccordion
              title="Your Placements"
              subtitle={`${activeChart!.sun.sign.name} Sun · ${activeChart!.moon.sign.name} Moon${activeChart!.ascendant ? ` · ${activeChart!.ascendant.sign.name} Rising` : ''}`}
              sectionKey="bigThree"
              openSections={openSections}
              setOpenSections={setOpenSections}
            >
            <View style={[styles.bigThreeCard, { backgroundColor: 'transparent' }]}> 
              <View style={styles.bigThreeRow}>
                <View style={styles.bigThreeItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <GradientSymbol symbol="☉" fontSize={11} w={13} h={13} />
                    <Text style={styles.bigThreeLabel}> Sun</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
                    <GradientSymbol symbol={activeChart!.sun.sign.symbol} fontSize={12} w={15} h={14} />
                    <Text style={[styles.bigThreeSign, { marginTop: 0 }]}> {activeChart!.sun.sign.name}</Text>
                  </View>
                  <Text style={styles.bigThreeDeg}>
                    {activeChart!.sun.degree}°{String(activeChart!.sun.minute).padStart(2, '0')}' · House{' '}
                    {activeChart!.sun.house}
                  </Text>
                </View>

                <Pressable
                  style={styles.bigThreeItem}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    router.push('/astrology-context' as Href);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Moon — tap to view today's cosmic context"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <GradientSymbol symbol="☽" fontSize={11} w={13} h={13} />
                    <Text style={styles.bigThreeLabel}> Moon</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
                    <GradientSymbol symbol={activeChart!.moon.sign.symbol} fontSize={12} w={15} h={14} />
                    <Text style={[styles.bigThreeSign, { marginTop: 0 }]}> {activeChart!.moon.sign.name}</Text>
                  </View>
                  <Text style={styles.bigThreeDeg}>
                    {activeChart!.moon.degree}°{String(activeChart!.moon.minute).padStart(2, '0')}' · House{' '}
                    {activeChart!.moon.house}
                  </Text>
                  <Text style={styles.bigThreeMoonHint}>Today's sky ›</Text>
                </Pressable>

                {activeChart!.ascendant && (
                  <View style={styles.bigThreeItem}>
                    <Text style={styles.bigThreeLabel}>AC Rising</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
                      <GradientSymbol symbol={activeChart!.ascendant.sign.symbol} fontSize={12} w={15} h={14} />
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
                  <Text style={styles.mcLabel}>MC Midheaven</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                    <GradientSymbol symbol={activeChart!.midheaven.sign.symbol} fontSize={16} w={20} h={18} />
                    <Text style={[styles.mcSign, { marginTop: 0 }]}> {activeChart!.midheaven.sign.name}</Text>
                  </View>
                  <Text style={styles.mcDeg}>
                    {activeChart!.midheaven.degree}°{String(activeChart!.midheaven.minute).padStart(2, '0')}'
                  </Text>
                </View>
              )}

              {/* ── Descendant + IC ── */}
              {(descendant || ic) && (
                <View style={styles.anglesRow}>
                  {descendant && (
                    <View style={styles.angleItem}>
                      <Text style={styles.angleLabel}>DC Descendant</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 3 }}>
                        <GradientSymbol symbol={SIGN_LOOKUP[typeof descendant.sign === 'string' ? descendant.sign : descendant.sign.name]?.symbol ?? ''} fontSize={12} w={15} h={14} />
                        <Text style={[styles.bigThreeSign, { marginTop: 0, fontSize: 11 }]}> {typeof descendant.sign === 'string' ? descendant.sign : descendant.sign.name}</Text>
                      </View>
                      <Text style={styles.bigThreeDeg}>{descendant.degree}°</Text>
                    </View>
                  )}
                  {ic && (
                    <View style={styles.angleItem}>
                      <Text style={styles.angleLabel}>IC Imum Coeli</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 3 }}>
                        <GradientSymbol symbol={SIGN_LOOKUP[typeof ic.sign === 'string' ? ic.sign : ic.sign.name]?.symbol ?? ''} fontSize={12} w={15} h={14} />
                        <Text style={[styles.bigThreeSign, { marginTop: 0, fontSize: 11 }]}> {typeof ic.sign === 'string' ? ic.sign : ic.sign.name}</Text>
                      </View>
                      <Text style={styles.bigThreeDeg}>{ic.degree}°</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            </SectionAccordion>
          </Animated.View>

          {/* ── Core Identity Summary ── */}
          {coreIdentity && (
            <Animated.View entering={FadeInDown.delay(210).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Your Chart at a Glance"
                sectionKey="coreIdentity"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                <View style={[styles.patternCard, { backgroundColor: 'transparent' }]}>
                  <Text style={[styles.patternDesc, { fontSize: 13, lineHeight: 20 }]}>
                    {coreIdentity.overview}
                  </Text>
                  {coreIdentity.quickThemes.length > 0 && (
                    <View style={{ marginTop: 14, gap: 6, alignItems: 'center' }}>
                      {coreIdentity.quickThemes.map((t, i) => (
                        <View key={i} style={styles.themedPlacementChip}>
                          <Text style={styles.themedPlacementText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── View Mode Toggle ── */}
          <Animated.View entering={FadeInDown.delay(215).duration(600)} style={{ width: '100%' }}>
            <View style={[styles.tabRow, { marginBottom: theme.spacing.md }]}>
              <Pressable
                style={[styles.tabBtn, viewMode === 'essentials' && styles.tabBtnActive]}
                onPress={() => setViewMode('essentials')}
                accessibilityRole="tab"
                accessibilityLabel="Essentials view"
                accessibilityState={{ selected: viewMode === 'essentials' }}
              >
                {viewMode === 'essentials' ? (
                  <MetallicText style={[styles.tabText, styles.tabTextActive]} color="#CFAE73">Essentials</MetallicText>
                ) : (
                  <Text style={styles.tabText}>Essentials</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.tabBtn, viewMode === 'complete' && styles.tabBtnActive]}
                onPress={() => setViewMode('complete')}
                accessibilityRole="tab"
                accessibilityLabel="Complete view"
                accessibilityState={{ selected: viewMode === 'complete' }}
              >
                {viewMode === 'complete' ? (
                  <MetallicText style={[styles.tabText, styles.tabTextActive]} color="#CFAE73">Complete Chart</MetallicText>
                ) : (
                  <Text style={styles.tabText}>Complete Chart</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Calculation Transparency ── */}
          <Animated.View entering={FadeInDown.delay(220).duration(600)} style={{ width: '100%' }}>
            <SectionAccordion
              title="Chart Details"
              subtitle={`${zodiacSystemLabel} · ${houseSystemLabel}`}
              sectionKey="chartDetails"
              openSections={openSections}
              setOpenSections={setOpenSections}
            >
              <View style={styles.transparencyBar}>
                {activeChart?.birthData?.date && (
                  <Text style={styles.transparencyText}>
                    {(() => {
                      try {
                        const d = parseLocalDate(activeChart.birthData.date);
                        return d?.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) ?? '';
                      } catch { return ''; }
                    })()}
                    {activeChart.birthData.time ? ` at ${activeChart.birthData.time}` : ' (time unknown)'}
                  </Text>
                )}
                {activeChart?.birthData?.place ? (
                  <Text style={styles.transparencyText}>{activeChart.birthData.place}</Text>
                ) : null}
                {activeChart?.birthData?.timezone ? (
                  <Text style={styles.transparencyTextMuted}>Timezone: {activeChart.birthData.timezone}</Text>
                ) : null}
                <Text style={styles.transparencyTextMuted}>
                  {zodiacSystemLabel} · {houseSystemLabel}
                </Text>
                {activeChart?.birthData?.hasUnknownTime && (
                  <Text style={styles.transparencyNote}>
                    Birth time is unknown — houses, Ascendant, and angles may not be accurate.
                  </Text>
                )}
              </View>
            </SectionAccordion>
          </Animated.View>

          {/* ── Sensitive Points (Premium) ── */}
          {isPremium && sensitivePoints.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Sensitive Points"
                subtitle={`Chiron, Nodes, Lilith & ${sensitivePoints.length} more`}
                sectionKey="sensitivePoints"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                <View style={[styles.sensitiveCard, { backgroundColor: 'transparent' }]}>
                  <View style={styles.sensitiveGrid}>
                    {sensitivePoints.map((pt) => (
                      <View key={pt.label} style={styles.sensitiveItem}>
                        <View style={{ marginBottom: 4 }}>
                          {pt.icon ? <GradientIcon size={20}>{pt.icon as React.ReactElement}</GradientIcon> : null}
                        </View>
                        <Text style={styles.sensitiveName}>{pt.label}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                          <GradientSymbol symbol={pt.signSymbol} fontSize={13} w={16} h={15} />
                          <Text style={[styles.sensitiveSign, { marginTop: 0 }]}> {pt.sign}</Text>
                        </View>
                        <Text style={styles.sensitiveDeg}>
                          {pt.degree}°{String(pt.minute).padStart(2, '0')}'{pt.house ? ` · H${pt.house}` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {chironInsight && (
                    <View style={styles.insightBox}>
                      <Text style={styles.insightLabel}>Chiron Theme</Text>
                      <MetallicText style={styles.insightTitle} color="#E8D6AE">{chironInsight.title}</MetallicText>
                      <Text style={styles.insightText}>{chironInsight.theme}</Text>
                    </View>
                  )}

                  {nodeInsight && (
                    <View style={styles.insightBox}>
                      <Text style={styles.insightLabel}>Node Axis</Text>
                      <Text style={styles.insightText}>{nodeInsight.fusionLine}</Text>
                    </View>
                  )}
                </View>
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Tab Switcher ── */}
          <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.tabRow}>
            {(['planets', 'houses', 'aspects', 'patterns'] as TabKey[]).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityLabel={`${tab.charAt(0).toUpperCase() + tab.slice(1)} tab`}
                accessibilityState={{ selected: activeTab === tab }}
              >
                {activeTab === tab ? (
                  <MetallicText style={[styles.tabText, styles.tabTextActive]} color="#CFAE73">
                    {tab === 'planets'
                      ? `Planets (${planetRows.length})`
                      : tab === 'houses'
                        ? `Houses (${houseCusps.length})`
                        : tab === 'aspects'
                          ? `Aspects (${sortedAspects.length})`
                          : `Patterns (${patternCount})`}
                  </MetallicText>
                ) : (
                  <Text style={styles.tabText}>
                    {tab === 'planets'
                      ? `Planets (${planetRows.length})`
                      : tab === 'houses'
                        ? `Houses (${houseCusps.length})`
                        : tab === 'aspects'
                          ? `Aspects (${sortedAspects.length})`
                          : `Patterns (${patternCount})`}
                  </Text>
                )}
              </Pressable>
            ))}
          </Animated.View>

          {/* ── Planets Table ── */}
          {activeTab === 'planets' && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ width: '100%' }}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 140 }]}>Planet</Text>
                <Text style={[styles.th, { flex: 2 }]}>Sign</Text>
                <Text style={[styles.th, { flex: 1 }]}>Deg</Text>
                <Text style={[styles.th, { flex: 1 }]}>House</Text>
              </View>

              {planetRows.map((row, idx) => {
                const elColor = ELEMENT_COLORS[row.p.sign.element] || theme.textSecondary;
                const retro = getRetrogradeFlag(row.p as any);
                const planetSymbol = (row.p as any)?.planet?.symbol ?? '•';

                return (
                  <LinearGradient
                    key={row.label}
                    colors={
                      idx % 2 === 0
                        ? ['rgba(14, 24, 48,0.5)', 'rgba(10, 18, 36,0.3)']
                        : ['rgba(10, 18, 36,0.4)', 'rgba(10, 18, 36,0.3)']
                    }
                    style={styles.tableRow}
                  >
                    <View style={[styles.td, { width: 140, flexDirection: 'row', alignItems: 'center' }]}>
                      <GradientSymbol
                        symbol={planetSymbol}
                        fontSize={planetSymbol.length > 1 ? 13 : 18}
                        w={28}
                        h={24}
                        style={{ marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.planetName, MULTI_CHAR_PLANETS.has(row.label) && { fontSize: 11 }]}>
                          {row.label}
                        </Text>
                        {retro && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                            <Ionicons name="arrow-undo-outline" size={10} color="#E8D6AE" />
                            <MetallicText style={styles.retroLabel} color="#E8D6AE">Retrograde</MetallicText>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                      <GradientSymbol symbol={row.p.sign.symbol} fontSize={18} w={24} h={24} style={{ marginRight: 6 }} />
                      <View style={{ flex: 1 }}>
                        <MetallicText color={elColor} style={styles.signName}>{row.p.sign.name}</MetallicText>
                        <Text style={styles.elementLabel}>
                          {row.p.sign.element} · {row.p.sign.modality}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.td, { flex: 1 }]}>
                      <Text style={styles.degreeText}>{row.p.degree}°</Text>
                      <Text style={styles.minuteText}>{String(row.p.minute).padStart(2, '0')}'</Text>
                    </View>

                    <View style={[styles.td, { flex: 1, alignItems: 'center' }]}>
                      <Text style={styles.houseNum}>{row.p.house || '—'}</Text>
                    </View>
                  </LinearGradient>
                );
              })}

              {/* Sensitive Points (table section — premium only) */}
              {isPremium && sensitivePoints.length > 0 && (
                <>
                  <View style={styles.pointsDivider}>
                    <Text style={styles.pointsLabel}>Sensitive Points</Text>
                  </View>

                  {sensitivePoints.map((pt, idx) => (
                    <LinearGradient
                      key={pt.label}
                      colors={
                        idx % 2 === 0
                          ? ['rgba(14, 24, 48,0.5)', 'rgba(10, 18, 36,0.3)']
                          : ['rgba(10, 18, 36,0.4)', 'rgba(10, 18, 36,0.3)']
                      }
                      style={styles.tableRow}
                    >
                      <View style={[styles.td, { width: 140, flexDirection: 'row', alignItems: 'center' }]}>
                        <View style={{ marginRight: 10, width: 28, alignItems: 'center' }}>
                          {pt.icon ? <GradientIcon size={18}>{pt.icon as React.ReactElement}</GradientIcon> : null}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.planetName}>{pt.label}</Text>
                          {pt.retrograde && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                              <Ionicons name="arrow-undo-outline" size={10} color="#E8D6AE" />
                              <MetallicText style={styles.retroLabel} color="#E8D6AE">Retrograde</MetallicText>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                        <GradientSymbol symbol={pt.signSymbol} fontSize={18} w={24} h={24} style={{ marginRight: 6 }} />
                        <View style={{ flex: 1 }}>
                          <MetallicText
                            color={ELEMENT_COLORS[pt.element] || theme.textSecondary}
                            style={styles.signName}
                          >
                            {pt.sign}
                          </MetallicText>
                          <Text style={styles.elementLabel}>{pt.element}</Text>
                        </View>
                      </View>

                      <View style={[styles.td, { flex: 1 }]}>
                        <Text style={styles.degreeText}>{pt.degree}°</Text>
                        <Text style={styles.minuteText}>{String(pt.minute).padStart(2, '0')}'</Text>
                      </View>

                      <View style={[styles.td, { flex: 1, alignItems: 'center' }]}>
                        <Text style={styles.houseNum}>{pt.house || '—'}</Text>
                      </View>
                    </LinearGradient>
                  ))}
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
                            <MetallicText color={elColor} style={styles.signName}>{cusp.sign.name}</MetallicText>
                          </View>
                        </View>

                        <View style={[styles.td, { flex: 1 }]}>
                          <Text style={styles.degreeText}>
                            {isWholeSign ? '0°' : `${deg}°${String(min).padStart(2, '0')}'`}
                          </Text>
                        </View>

                        <View style={[styles.td, { flex: 3 }]}>
                          <Text style={styles.houseTheme}>{houseInfo?.theme || ''}</Text>
                          {planetsByHouse.get(cusp.house)?.length ? (
                            <Text style={styles.housePlanets}>
                              {planetsByHouse.get(cusp.house)!.join(', ')}
                            </Text>
                          ) : null}
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
                      <React.Fragment key={`${asp.planet1.name}-${asp.type.name}-${asp.planet2.name}-${idx}`}>
                      <LinearGradient
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
                          <GradientSymbol
                            symbol={SAFE_ASPECT_SYMBOLS[asp.type.name] ?? asp.type.symbol}
                            fontSize={18}
                            w={24}
                            h={24}
                            gradient={asp.type.nature === 'Challenging' ? RED_GRAD_PROPS : undefined}
                          />
                          <MetallicText color={natureColor} style={styles.aspectName}>{asp.type.name}</MetallicText>
                          <MetallicText color={natureColor} style={styles.aspectNature}>{asp.type.nature}</MetallicText>
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
                          {asp.orb < 2 ? (
                            <MetallicText color="#9ACD32" style={styles.orbText}>
                              {asp.orb.toFixed(1)}°
                            </MetallicText>
                          ) : (
                            <Text
                              style={[
                                styles.orbText,
                                {
                                  color: asp.orb < 5 ? theme.primary : theme.textSecondary,
                                },
                              ]}
                            >
                              {asp.orb.toFixed(1)}°
                            </Text>
                          )}
                          {asp.isApplying && <Text style={styles.applyingLabel}>applying</Text>}
                        </View>
                      </LinearGradient>
                      {isPremium && (
                        <Text style={styles.aspectInterp}>
                          {getAspectInterpretation(asp)}
                        </Text>
                      )}
                    </React.Fragment>
                    );
                  })}

                  <View style={styles.legend}>
                    <Text style={styles.legendTitle}>Aspect Legend</Text>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: '#9ACD32' }]} />
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
                        <Ionicons name="sparkles-outline" size={16} color={theme.textPrimary} />
                        <MetallicText style={styles.aspectUpsellText} color="#CFAE73">
                          {hiddenAspectCount} more subtle aspect{hiddenAspectCount > 1 ? 's' : ''} — sextiles, quincunxes, and more
                        </MetallicText>
                        <Ionicons name="chevron-forward-outline" size={16} color={theme.textPrimary} />
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
              {/* Chart Ruler (premium) */}
              {isPremium && chartPatterns.chartRuler && (
                <LinearGradient colors={['rgba(232, 214, 174,0.15)', 'rgba(14, 24, 48,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="ribbon-outline" size={20} color="#E8D6AE" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Chart Ruler</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <GradientSymbol symbol={chartPatterns.chartRuler.planetSymbol} fontSize={15} w={18} h={17} />
                      <MetallicText style={styles.patternHighlightText} color="#CFAE73"> {chartPatterns.chartRuler.planet} in </MetallicText>
                      <GradientSymbol symbol={chartPatterns.chartRuler.rulerSignSymbol} fontSize={15} w={18} h={17} />
                      <MetallicText style={styles.patternHighlightText} color="#CFAE73"> {chartPatterns.chartRuler.rulerSign} · House {chartPatterns.chartRuler.rulerHouse}</MetallicText>
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
                      <MetallicText style={styles.patternHighlightText} color="#CFAE73"> {partOfFortune.sign?.name} · {Math.floor(partOfFortune.degree)}°{partOfFortune.house ? ` · House ${partOfFortune.house}` : ''}</MetallicText>
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

              {/* Dominant Planet (premium) */}
              {isPremium && dominantPlacement && chartPatterns && (
                <LinearGradient colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="star-outline" size={20} color="#E8D6AE" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Dominant Planet</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <MetallicText style={styles.patternHighlightText} color="#CFAE73">
                      {safeString((dominantPlacement as any).planet)} in {(dominantPlacement as any).sign?.name ?? safeString((dominantPlacement as any).sign)} ·{' '}
                      {Math.floor((dominantPlacement as any).degree ?? 0)}°
                      {(dominantPlacement as any).house ? ` · House ${(dominantPlacement as any).house}` : ''}
                    </MetallicText>
                  </View>
                  <Text style={styles.patternDesc}>
                    {chartPatterns.dominantFactors.descriptions.planet}
                  </Text>
                  <View style={styles.tooltipBox}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                    <Text style={styles.tooltipText}>Scored by aspect count, tight aspects (under 2{'\u00b0'}), and angular house placement.</Text>
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
                      <Ionicons name="lock-closed-outline" size={16} color={theme.textPrimary} />
                      <View style={{ flex: 1 }}>
                        <MetallicText style={{ fontSize: 14, fontWeight: '600' }} color="#CFAE73">More patterns in your chart</MetallicText>
                        <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 3, lineHeight: 18 }}>
                          Chart ruler, dominant planet, sensitive points, stelliums, retrogrades, and Point of Flow
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward-outline" size={16} color={theme.textPrimary} />
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
                      <Ionicons name="flash-outline" size={16} color="#E8D6AE" style={styles.patternIcon} />
                      <Text style={styles.patternTitle}>{stellium.cardTitle}</Text>
                    </View>
                    <View style={styles.patternHighlight}>
                      <MetallicText style={styles.patternHighlightText} color="#CFAE73">{stellium.planets.join(', ')}</MetallicText>
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
                      <Ionicons name="link-outline" size={20} color="#E8D6AE" style={styles.patternIcon} />
                      <Text style={styles.patternTitle}>Conjunction Cluster</Text>
                    </View>
                    <View style={styles.patternHighlight}>
                      <MetallicText style={styles.patternHighlightText} color="#CFAE73">{cluster.planets.join(' · ')}</MetallicText>
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
                    <Ionicons name="arrow-undo-outline" size={20} color="#E8D6AE" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Retrograde Emphasis</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <MetallicText style={styles.patternHighlightText} color="#CFAE73">
                      {chartPatterns.retrogradeEmphasis.count} planets retrograde: {chartPatterns.retrogradeEmphasis.planets.join(', ')}
                    </MetallicText>
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.retrogradeEmphasis.description}</Text>
                </LinearGradient>
              )}

              {/* Element Balance (free) */}
              {chartPatterns.elementBalance && (
                <LinearGradient colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="flame-outline" size={20} color="#E8D6AE" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Element Balance</Text>
                  </View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }]}>
                    {Object.entries(chartPatterns.elementBalance.counts).map(([el, count]) => {
                      const isDominant = el === chartPatterns.elementBalance.dominant;
                      const elColor = ELEMENT_COLORS[el] || theme.primary;
                      return isDominant ? (
                        <MetallicText
                          key={el}
                          style={[styles.patternHighlightText, { fontSize: 15 }]}
                          color={elColor}
                        >
                          {el}: {count as number}
                        </MetallicText>
                      ) : (
                        <Text
                          key={el}
                          style={[styles.patternHighlightText, { color: theme.textMuted, fontSize: 13 }]}
                        >
                          {el}: {count as number}
                        </Text>
                      );
                    })}
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

              {/* Modality Balance (free) */}
              {chartPatterns.modalityBalance && (
                <LinearGradient colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="options-outline" size={20} color="#E8D6AE" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Modality Balance</Text>
                  </View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 16, justifyContent: 'center' }]}>
                    {Object.entries(chartPatterns.modalityBalance.counts).map(([mod, count]) => {
                      const isDominant = mod === chartPatterns.modalityBalance.dominant;
                      return isDominant ? (
                        <MetallicText
                          key={mod}
                          style={[styles.patternHighlightText, { fontSize: 15 }]}
                          color="#CFAE73"
                        >
                          {mod}: {count as number}
                        </MetallicText>
                      ) : (
                        <Text
                          key={mod}
                          style={[styles.patternHighlightText, { color: theme.textMuted, fontSize: 13 }]}
                        >
                          {mod}: {count as number}
                        </Text>
                      );
                    })}
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.modalityBalance.description}</Text>
                </LinearGradient>
              )}

              {/* Polarity Balance (free) */}
              {chartPatterns.polarityBalance && (
                <LinearGradient colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="git-compare-outline" size={20} color="#E8D6AE" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Polarity Balance</Text>
                  </View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 24, justifyContent: 'center' }]}>
                    {[
                      { label: 'Masculine', count: chartPatterns.polarityBalance.masculine },
                      { label: 'Feminine', count: chartPatterns.polarityBalance.feminine },
                    ].map(({ label, count }) => {
                      const isDominant = label === chartPatterns.polarityBalance.dominant;
                      return isDominant ? (
                        <MetallicText key={label} style={[styles.patternHighlightText, { fontSize: 15 }]} color="#CFAE73">
                          {label}: {count}
                        </MetallicText>
                      ) : (
                        <Text key={label} style={[styles.patternHighlightText, { color: theme.textMuted, fontSize: 13 }]}>
                          {label}: {count}
                        </Text>
                      );
                    })}
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.polarityBalance.description}</Text>
                  <View style={styles.tooltipBox}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                    <Text style={styles.tooltipText}>Masculine = Fire + Air signs. Feminine = Earth + Water signs. Based on your 10 core planets.</Text>
                  </View>
                </LinearGradient>
              )}

              {/* Aspect Patterns (premium) — Grand Trine, T-Square, Yod, etc. */}
              {isPremium && extendedPatterns?.aspectPatterns?.map((pattern, idx) => (
                <LinearGradient
                  key={`aspat-${idx}`}
                  colors={['rgba(232, 214, 174,0.12)', 'rgba(14, 24, 48,0.7)']}
                  style={styles.patternCard}
                >
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternIcon}>
                      {pattern.name === 'Grand Trine' ? '△' :
                       pattern.name === 'T-Square' ? '⊤' :
                       pattern.name === 'Grand Cross' ? '✚' :
                       pattern.name === 'Yod' ? '☞' :
                       pattern.name === 'Kite' ? '◇' :
                       pattern.name === 'Mystic Rectangle' ? '▭' : '⬡'}
                    </Text>
                    <Text style={styles.patternTitle}>{pattern.name}</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <MetallicText style={styles.patternHighlightText} color="#CFAE73">
                      {pattern.planets.join(' · ')}
                    </MetallicText>
                  </View>
                  <Text style={styles.patternDesc}>{pattern.description}</Text>
                </LinearGradient>
              ))}

              {/* Hemisphere Emphasis (premium) */}
              {isPremium && extendedPatterns?.hemisphereEmphasis && extendedPatterns.hemisphereEmphasis.dominant !== 'Balanced' && (
                <LinearGradient colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="contrast-outline" size={20} color="#E8D6AE" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Hemisphere Emphasis</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <MetallicText style={styles.patternHighlightText} color="#CFAE73">
                      {extendedPatterns.hemisphereEmphasis.dominant} emphasis
                    </MetallicText>
                  </View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }]}>
                    <Text style={[styles.patternHighlightText, { color: theme.textMuted, fontSize: 12 }]}>
                      E: {extendedPatterns.hemisphereEmphasis.eastern}  W: {extendedPatterns.hemisphereEmphasis.western}  N: {extendedPatterns.hemisphereEmphasis.northern}  S: {extendedPatterns.hemisphereEmphasis.southern}
                    </Text>
                  </View>
                  <Text style={styles.patternDesc}>{extendedPatterns.hemisphereEmphasis.description}</Text>
                </LinearGradient>
              )}

              {/* House Type Emphasis (premium) */}
              {isPremium && extendedPatterns?.houseEmphasis && (
                <LinearGradient colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="home-outline" size={20} color="#E8D6AE" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>House Emphasis</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <MetallicText style={styles.patternHighlightText} color="#CFAE73">
                      {extendedPatterns.houseEmphasis.dominant} houses dominant
                    </MetallicText>
                  </View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 14, justifyContent: 'center' }]}>
                    <Text style={[styles.patternHighlightText, { color: theme.textMuted, fontSize: 12 }]}>
                      Angular: {extendedPatterns.houseEmphasis.angularCount}  Succedent: {extendedPatterns.houseEmphasis.succedentCount}  Cadent: {extendedPatterns.houseEmphasis.cadentCount}
                    </Text>
                  </View>
                  <Text style={styles.patternDesc}>{extendedPatterns.houseEmphasis.description}</Text>
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

          {/* ── Themed Interpretation Sections (premium) ── */}
          {isPremium && themedSections.length > 0 && (
            <Animated.View entering={FadeInDown.delay(350).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Your Chart Story"
                subtitle="Thematic interpretations woven from your placements"
                sectionKey="chartStory"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                {themedSections.map((section) => (
                  <Pressable
                    key={section.id}
                    onPress={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${section.title} interpretation section`}
                  >
                    <LinearGradient
                      colors={['rgba(232, 214, 174,0.08)', 'rgba(14, 24, 48,0.6)']}
                      style={styles.themedCard}
                    >
                      <View style={styles.themedCardHeaderRow}>
                        <GradientSymbol symbol={section.icon} fontSize={20} w={24} h={24} style={{ marginRight: 4 }} />
                        <Text style={styles.themedCardTitle}>{section.title}</Text>
                        <Ionicons
                          name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={theme.textMuted}
                        />
                      </View>
                      <View style={styles.themedCardPlacements}>
                        {section.placements.map((p, pi) => (
                          <View key={pi} style={styles.themedPlacementChip}>
                            <Text style={styles.themedPlacementText}>{p}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.themedCardSummary}>{section.summary}</Text>
                      {expandedSection === section.id && section.details.length > 0 && (
                        <View style={styles.themedCardDetails}>
                          {section.details.map((detail, di) => (
                            <Text key={di} style={styles.themedCardDetail}>• {detail}</Text>
                          ))}
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ══════════════════════════════════════════════════════
              COMPLETE VIEW — Advanced sections shown when toggled
              ══════════════════════════════════════════════════════ */}

          {/* ── Key Aspects Summary ── */}
          {keyAspects.length > 0 && (
            <Animated.View entering={FadeInDown.delay(360).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Strongest Aspects"
                subtitle="Your most important planetary connections"
                sectionKey="keyAspects"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                {keyAspects.slice(0, viewMode === 'complete' ? 10 : 5).map((ka, idx) => (
                  <LinearGradient
                    key={`ka-${idx}`}
                    colors={idx % 2 === 0 ? ['rgba(14, 24, 48,0.5)', 'rgba(10, 18, 36,0.3)'] : ['rgba(10, 18, 36,0.4)', 'rgba(10, 18, 36,0.3)']}
                    style={[styles.tableRow, { flexDirection: 'column', alignItems: 'center', gap: 6 }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <MetallicText style={{ fontSize: 14, fontWeight: '700' }} color="#CFAE73">
                        {ka.planet1} {ka.type.toLowerCase()} {ka.planet2}
                      </MetallicText>
                      <Text style={{ fontSize: 12, color: ka.nature === 'Harmonious' ? '#9ACD32' : ka.nature === 'Challenging' ? '#991FA6' : '#FFDA03' }}>
                        {ka.orb.toFixed(1)}° · {ka.nature}
                      </Text>
                      {ka.isApplying && <Text style={styles.applyingLabel}>applying</Text>}
                    </View>
                    {isPremium && (
                      <Text style={[styles.patternDesc, { fontSize: 12, marginTop: 2 }]}>{ka.interpretation}</Text>
                    )}
                  </LinearGradient>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Angle Interpretations ── */}
          {viewMode === 'complete' && angleInterpretations.length > 0 && (
            <Animated.View entering={FadeInDown.delay(370).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Angles & Axes"
                subtitle="The four cardinal points of your chart"
                sectionKey="anglesAxes"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                {angleInterpretations.map((ai, idx) => (
                  <LinearGradient
                    key={ai.name}
                    colors={['rgba(232, 214, 174,0.08)', 'rgba(14, 24, 48,0.6)']}
                    style={styles.themedCard}
                  >
                    <View style={styles.themedCardHeaderRow}>
                      <Text style={styles.themedCardTitle}>{ai.name}</Text>
                      <MetallicText style={{ fontSize: 13, fontWeight: '600' }} color="#CFAE73">{ai.sign} · {ai.degree}°</MetallicText>
                    </View>
                    <Text style={styles.themedCardSummary}>{ai.interpretation}</Text>
                  </LinearGradient>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Sensitive Point Interpretations (Complete View) ── */}
          {viewMode === 'complete' && isPremium && pointInterpretations.length > 0 && (
            <Animated.View entering={FadeInDown.delay(375).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Chart Points"
                subtitle="Nodes, Chiron, Lilith, Part of Fortune & Vertex"
                sectionKey="chartPoints"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                {pointInterpretations.map((pi, idx) => (
                  <LinearGradient
                    key={pi.name}
                    colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']}
                    style={styles.themedCard}
                  >
                    <View style={styles.themedCardHeaderRow}>
                      <Text style={styles.themedCardTitle}>{pi.name}</Text>
                      <MetallicText style={{ fontSize: 13, fontWeight: '600' }} color="#CFAE73">
                        {pi.sign}{pi.house ? ` · House ${pi.house}` : ''}
                      </MetallicText>
                    </View>
                    <Text style={styles.themedCardSummary}>{pi.interpretation}</Text>
                  </LinearGradient>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Chart Shape ── */}
          {viewMode === 'complete' && isPremium && chartShape && chartShape.shape !== 'Unknown' && (
            <Animated.View entering={FadeInDown.delay(380).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Chart Shape"
                subtitle={chartShape.shape}
                sectionKey="chartShape"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                <LinearGradient colors={['rgba(232, 214, 174,0.12)', 'rgba(14, 24, 48,0.7)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="ellipse-outline" size={20} color="#E8D6AE" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Chart Shape: {chartShape.shape}</Text>
                  </View>
                  {chartShape.handlePlanet && (
                    <View style={styles.patternHighlight}>
                      <MetallicText style={styles.patternHighlightText} color="#CFAE73">
                        Handle: {chartShape.handlePlanet}
                      </MetallicText>
                    </View>
                  )}
                  <Text style={styles.patternDesc}>{chartShape.description}</Text>
                </LinearGradient>
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Singletons ── */}
          {viewMode === 'complete' && isPremium && singletons.length > 0 && (
            <Animated.View entering={FadeInDown.delay(385).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Singleton Planets"
                subtitle="Planets isolated in their hemisphere or element"
                sectionKey="singletons"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                {singletons.map((s, idx) => (
                  <LinearGradient
                    key={`singleton-${idx}`}
                    colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']}
                    style={styles.themedCard}
                  >
                    <View style={styles.themedCardHeaderRow}>
                      <Text style={styles.themedCardTitle}>{s.planet}</Text>
                      <View style={styles.themedPlacementChip}>
                        <Text style={styles.themedPlacementText}>{s.detail}</Text>
                      </View>
                    </View>
                    <Text style={styles.themedCardSummary}>{s.description}</Text>
                  </LinearGradient>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Interceptions ── */}
          {viewMode === 'complete' && isPremium && interceptions.length > 0 && (
            <Animated.View entering={FadeInDown.delay(388).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Interceptions"
                subtitle="Signs contained within a house without a cusp"
                sectionKey="interceptions"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                {interceptions.map((ic, idx) => (
                  <LinearGradient
                    key={`intercept-${idx}`}
                    colors={['rgba(14, 24, 48,0.8)', 'rgba(10, 18, 36,0.6)']}
                    style={styles.themedCard}
                  >
                    <View style={styles.themedCardHeaderRow}>
                      <Text style={styles.themedCardTitle}>{ic.interceptedSigns[0]} / {ic.interceptedSigns[1]}</Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>Houses {ic.houses[0]} & {ic.houses[1]}</Text>
                    </View>
                    <Text style={styles.themedCardSummary}>{ic.description}</Text>
                  </LinearGradient>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Planet Dignity ── */}
          {viewMode === 'complete' && isPremium && dignityAnalysis && (
            <Animated.View entering={FadeInDown.delay(390).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Planet Strength & Dignity"
                subtitle="Which parts of your chart are strong, comfortable, or challenged"
                sectionKey="planetDignity"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
              <Text style={[styles.patternDesc, { marginBottom: 12, textAlign: 'center' }]}>{dignityAnalysis.summary}</Text>
              {dignityAnalysis.strongestPlanets.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                  {dignityAnalysis.strongestPlanets.map(d => (
                    <View key={d.planet} style={[styles.themedPlacementChip, { borderColor: 'rgba(154,205,50,0.3)' }]}>
                      <Text style={[styles.themedPlacementText, { color: '#9ACD32' }]}>{d.planet}: {d.dignity}</Text>
                    </View>
                  ))}
                </View>
              )}
              {dignityAnalysis.challengedPlanets.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                  {dignityAnalysis.challengedPlanets.map(d => (
                    <View key={d.planet} style={[styles.themedPlacementChip, { borderColor: 'rgba(153,31,166,0.3)' }]}>
                      <Text style={[styles.themedPlacementText, { color: '#991FA6' }]}>{d.planet}: {d.dignity}</Text>
                    </View>
                  ))}
                </View>
              )}
              {dignityAnalysis.planetDignities.filter(d => d.dignity !== 'peregrine').map(d => (
                <Pressable
                  key={d.planet}
                  onPress={() => setExpandedPlanet(expandedPlanet === d.planet ? null : d.planet)}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.planet} dignity details`}
                >
                  <LinearGradient
                    colors={['rgba(14, 24, 48,0.5)', 'rgba(10, 18, 36,0.3)']}
                    style={[styles.tableRow, { flexDirection: 'column', alignItems: 'center', gap: 4 }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.planetName}>{d.planet}</Text>
                      <MetallicText style={{ fontSize: 12, fontWeight: '600' }} color={
                        d.dignity === 'domicile' || d.dignity === 'exaltation' ? '#9ACD32' : '#991FA6'
                      }>
                        {d.dignity.charAt(0).toUpperCase() + d.dignity.slice(1)} in {d.sign}
                      </MetallicText>
                      <Ionicons name={expandedPlanet === d.planet ? 'chevron-up' : 'chevron-down'} size={14} color={theme.textMuted} />
                    </View>
                    {expandedPlanet === d.planet && (
                      <Text style={[styles.patternDesc, { fontSize: 12, marginTop: 4 }]}>{d.description}</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Dispositor Chain & Rulership ── */}
          {viewMode === 'complete' && isPremium && dispositorChain && (
            <Animated.View entering={FadeInDown.delay(395).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Rulership & Dispositors"
                subtitle={dispositorChain.finalDispositor ? `Final dispositor: ${dispositorChain.finalDispositor}` : 'Planetary rulership chain'}
                sectionKey="dispositors"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                <LinearGradient colors={['rgba(232, 214, 174,0.10)', 'rgba(14, 24, 48,0.6)']} style={styles.patternCard}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="git-network-outline" size={20} color="#E8D6AE" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Rulership & Dispositors</Text>
                  </View>
                  {dispositorChain.finalDispositor && (
                    <View style={styles.patternHighlight}>
                      <MetallicText style={styles.patternHighlightText} color="#CFAE73">
                        Final Dispositor: {dispositorChain.finalDispositor}
                      </MetallicText>
                    </View>
                  )}
                  {dispositorChain.mutualReceptions.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                      {dispositorChain.mutualReceptions.map(([a, b], idx) => (
                        <View key={idx} style={styles.themedPlacementChip}>
                          <Text style={styles.themedPlacementText}>Mutual Reception: {a} ↔ {b}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={styles.patternDesc}>{dispositorChain.description}</Text>
                  <View style={styles.tooltipBox}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                    <Text style={styles.tooltipText}>
                      Each planet answers to the ruler of its sign. The dispositor chain shows this hierarchy — the final dispositor (if present) is the planet that ultimately directs the chart.
                    </Text>
                  </View>
                </LinearGradient>
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Planet-by-Planet Deep Dive ── */}
          {viewMode === 'complete' && isPremium && planetDeepDives.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Planet-by-Planet Deep Dive"
                subtitle="Each planet as a mini-profile in your chart"
                sectionKey="planetDeepDive"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
              {planetDeepDives.map((dd) => (
                <Pressable
                  key={dd.planet}
                  onPress={() => setExpandedPlanet(expandedPlanet === `dd-${dd.planet}` ? null : `dd-${dd.planet}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${dd.planet} deep dive`}
                >
                  <LinearGradient
                    colors={['rgba(232, 214, 174,0.06)', 'rgba(14, 24, 48,0.5)']}
                    style={styles.themedCard}
                  >
                    <View style={styles.themedCardHeaderRow}>
                      <Text style={[styles.themedCardTitle, { flex: 0, flexShrink: 0, fontSize: 11 }]} numberOfLines={1}>{dd.planet}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'flex-end', flexShrink: 1, overflow: 'hidden' }}>
                        <View style={styles.themedPlacementChip}>
                          <Text style={[styles.themedPlacementText, { fontSize: 8 }]} numberOfLines={1}>{dd.sign}</Text>
                        </View>
                        {dd.house > 0 && (
                          <View style={styles.themedPlacementChip}>
                            <Text style={[styles.themedPlacementText, { fontSize: 8 }]} numberOfLines={1}>House {dd.house}</Text>
                          </View>
                        )}
                        {dd.isRetrograde && (
                          <View style={[styles.themedPlacementChip, { borderColor: 'rgba(232, 214, 174, 0.3)' }]}>
                            <Text style={[styles.themedPlacementText, { color: '#E8D6AE', fontSize: 8 }]}>℞</Text>
                          </View>
                        )}
                        {dd.dignity.dignity !== 'peregrine' && (
                          <View style={[styles.themedPlacementChip, { borderColor: dd.dignity.dignity === 'domicile' || dd.dignity.dignity === 'exaltation' ? 'rgba(154,205,50,0.3)' : 'rgba(153,31,166,0.3)' }]}>
                            <Text style={[styles.themedPlacementText, { color: dd.dignity.dignity === 'domicile' || dd.dignity.dignity === 'exaltation' ? '#9ACD32' : '#991FA6', fontSize: 8 }]} numberOfLines={1}>
                              {dd.dignity.dignity}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name={expandedPlanet === `dd-${dd.planet}` ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textMuted} />
                    </View>
                    <Text style={[styles.themedCardSummary, { fontSize: 12, lineHeight: 17 }]} numberOfLines={expandedPlanet === `dd-${dd.planet}` ? undefined : 2}>
                      {dd.synthesis}
                    </Text>
                    {expandedPlanet === `dd-${dd.planet}` && dd.aspects.length > 0 && (
                      <View style={styles.themedCardDetails}>
                        {dd.aspects.map((asp, ai) => (
                          <Text key={ai} style={styles.themedCardDetail}>• {asp}</Text>
                        ))}
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── House-by-House Interpretation ── */}
          {viewMode === 'complete' && isPremium && houseDeepDives.length > 0 && (
            <Animated.View entering={FadeInDown.delay(410).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="House-by-House Interpretation"
                subtitle="12 areas of life, each with cusp sign, ruler, and occupants"
                sectionKey="houseDeepDive"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                {houseDeepDives.map((hd) => (
                  <Pressable
                    key={hd.house}
                    onPress={() => setExpandedHouse(expandedHouse === hd.house ? null : hd.house)}
                    accessibilityRole="button"
                    accessibilityLabel={`House ${hd.house} interpretation`}
                  >
                    <LinearGradient
                      colors={['rgba(14, 24, 48,0.5)', 'rgba(10, 18, 36,0.3)']}
                      style={styles.themedCard}
                    >
                      <View style={[styles.themedCardHeaderRow, { justifyContent: 'center' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <MetallicText style={{ fontSize: 16, fontWeight: '700' }} color="#CFAE73">{hd.house}</MetallicText>
                          <Text style={[styles.themedCardTitle, { flex: 0, textAlign: 'center' }]}>{hd.cuspSign}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          {hd.ruler && (
                            <View style={styles.themedPlacementChip}>
                              <Text style={styles.themedPlacementText}>♜ {hd.ruler}</Text>
                            </View>
                          )}
                          {hd.occupants.length > 0 && (
                            <View style={[styles.themedPlacementChip, { borderColor: 'rgba(207, 174, 115, 0.3)' }]}>
                              <Text style={styles.themedPlacementText}>{hd.occupants.join(', ')}</Text>
                            </View>
                          )}
                        </View>
                        <Ionicons name={expandedHouse === hd.house ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textMuted} />
                      </View>
                      {expandedHouse === hd.house && (
                        <Text style={[styles.themedCardSummary, { marginTop: 8, textAlign: 'center' }]}>{hd.synthesis}</Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Life Themes (grouped) ── */}
          {isPremium && (relationshipProfile || careerProfile || emotionalProfile || shadowGrowth) && (
            <Animated.View entering={FadeInDown.delay(420).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Life Themes"
                subtitle="Relationship, career, emotional, and growth profiles"
                sectionKey="lifeThemes"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                {relationshipProfile && (
                  <Pressable
                    onPress={() => setExpandedLifeTheme(expandedLifeTheme === 'relationship' ? null : 'relationship')}
                    accessibilityRole="button"
                    accessibilityLabel="Relationship profile"
                  >
                    <LinearGradient colors={['rgba(232, 214, 174,0.08)', 'rgba(14, 24, 48,0.6)']} style={styles.themedCard}>
                      <View style={styles.themedCardHeaderRow}>
                        <GradientIcon size={20}><Ionicons name="heart-outline" size={20} color="#000" /></GradientIcon>
                        <Text style={styles.themedCardTitle}>Relationship Profile</Text>
                        <Ionicons name={expandedLifeTheme === 'relationship' ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
                      </View>
                      <View style={styles.themedCardPlacements}>
                        {relationshipProfile.keyPlanets.map((p, i) => (
                          <View key={i} style={styles.themedPlacementChip}>
                            <Text style={styles.themedPlacementText}>{p}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.themedCardSummary} numberOfLines={expandedLifeTheme === 'relationship' ? undefined : 3}>
                        {relationshipProfile.synthesis}
                      </Text>
                      {expandedLifeTheme === 'relationship' && (
                        <View style={styles.themedCardDetails}>
                          <Text style={styles.themedCardDetail}>• Love Style: {relationshipProfile.loveStyle}</Text>
                          <Text style={styles.themedCardDetail}>• Attraction: {relationshipProfile.attractionPattern}</Text>
                          <Text style={styles.themedCardDetail}>• Intimacy: {relationshipProfile.intimacyStyle}</Text>
                          <Text style={styles.themedCardDetail}>• Partnership Lessons: {relationshipProfile.partnershipLessons}</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}

                {careerProfile && (
                  <Pressable
                    onPress={() => setExpandedLifeTheme(expandedLifeTheme === 'career' ? null : 'career')}
                    accessibilityRole="button"
                    accessibilityLabel="Career and purpose profile"
                  >
                    <LinearGradient colors={['rgba(232, 214, 174,0.08)', 'rgba(14, 24, 48,0.6)']} style={styles.themedCard}>
                      <View style={styles.themedCardHeaderRow}>
                        <GradientIcon size={20}><Ionicons name="briefcase-outline" size={20} color="#000" /></GradientIcon>
                        <Text style={styles.themedCardTitle}>Career & Life Direction</Text>
                        <Ionicons name={expandedLifeTheme === 'career' ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
                      </View>
                      <View style={styles.themedCardPlacements}>
                        {careerProfile.keyPlanets.map((p, i) => (
                          <View key={i} style={styles.themedPlacementChip}>
                            <Text style={styles.themedPlacementText}>{p}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.themedCardSummary} numberOfLines={expandedLifeTheme === 'career' ? undefined : 3}>
                        {careerProfile.synthesis}
                      </Text>
                      {expandedLifeTheme === 'career' && (
                        <View style={styles.themedCardDetails}>
                          <Text style={styles.themedCardDetail}>• Vocation: {careerProfile.vocationThemes}</Text>
                          <Text style={styles.themedCardDetail}>• Work Style: {careerProfile.workStyle}</Text>
                          <Text style={styles.themedCardDetail}>• Public Image: {careerProfile.publicImage}</Text>
                          <Text style={styles.themedCardDetail}>• Growth Path: {careerProfile.growthPath}</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}

                {emotionalProfile && (
                  <Pressable
                    onPress={() => setExpandedLifeTheme(expandedLifeTheme === 'emotional' ? null : 'emotional')}
                    accessibilityRole="button"
                    accessibilityLabel="Emotional and psychological profile"
                  >
                    <LinearGradient colors={['rgba(232, 214, 174,0.08)', 'rgba(14, 24, 48,0.6)']} style={styles.themedCard}>
                      <View style={styles.themedCardHeaderRow}>
                        <GradientIcon size={20}><Ionicons name="water-outline" size={20} color="#000" /></GradientIcon>
                        <Text style={styles.themedCardTitle}>Emotional & Inner World</Text>
                        <Ionicons name={expandedLifeTheme === 'emotional' ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
                      </View>
                      <Text style={styles.themedCardSummary} numberOfLines={expandedLifeTheme === 'emotional' ? undefined : 3}>
                        {emotionalProfile.synthesis}
                      </Text>
                      {expandedLifeTheme === 'emotional' && (
                        <View style={styles.themedCardDetails}>
                          <Text style={styles.themedCardDetail}>• Emotional Style: {emotionalProfile.emotionalStyle}</Text>
                          <Text style={styles.themedCardDetail}>• Core Patterns: {emotionalProfile.coreFears}</Text>
                          <Text style={styles.themedCardDetail}>• Under Stress: {emotionalProfile.defenseMechanisms}</Text>
                          <Text style={styles.themedCardDetail}>• Attachment: {emotionalProfile.attachmentStyle}</Text>
                          <Text style={styles.themedCardDetail}>• Healing: {emotionalProfile.healingThemes}</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}

                {shadowGrowth && (
                  <Pressable
                    onPress={() => setExpandedLifeTheme(expandedLifeTheme === 'shadow' ? null : 'shadow')}
                    accessibilityRole="button"
                    accessibilityLabel="Shadow and growth profile"
                  >
                    <LinearGradient colors={['rgba(232, 214, 174,0.08)', 'rgba(14, 24, 48,0.6)']} style={styles.themedCard}>
                      <View style={styles.themedCardHeaderRow}>
                        <GradientIcon size={20}><Ionicons name="moon-outline" size={20} color="#000" /></GradientIcon>
                        <Text style={styles.themedCardTitle}>Shadow & Growth Path</Text>
                        <Ionicons name={expandedLifeTheme === 'shadow' ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
                      </View>
                      <Text style={styles.themedCardSummary} numberOfLines={expandedLifeTheme === 'shadow' ? undefined : 3}>
                        {shadowGrowth.synthesis}
                      </Text>
                      {expandedLifeTheme === 'shadow' && (
                        <View style={styles.themedCardDetails}>
                          <Text style={styles.themedCardDetail}>• Saturn Lessons: {shadowGrowth.saturnLessons}</Text>
                          <Text style={styles.themedCardDetail}>• Chiron Wound: {shadowGrowth.chironWound}</Text>
                          <Text style={styles.themedCardDetail}>• Pluto Transformation: {shadowGrowth.plutoTransformation}</Text>
                          <Text style={styles.themedCardDetail}>• Node Axis: {shadowGrowth.nodeAxis}</Text>
                          {shadowGrowth.growthEdges.map((edge, i) => (
                            <Text key={i} style={styles.themedCardDetail}>• {edge}</Text>
                          ))}
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}
              </SectionAccordion>
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
                    <Ionicons name="sparkles-outline" size={16} color={theme.textPrimary} />
                    <View style={{ flex: 1 }}>
                      <MetallicText style={[styles.overlayUpsellText, { fontWeight: '600' }]} color="#CFAE73">Your chart has more to say</MetallicText>
                      <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                        Nodes, Chiron, Lilith, Vertex, chart ruler, stelliums, retrogrades, and minor aspects
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward-outline" size={16} color={theme.textPrimary} />
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
                      <MetallicIcon name="planet-outline" size={20} color="#E8D6AE" />
                      <Text style={styles.chartSettingsTitle}>Chart Settings</Text>
                    </View>
                    <Text style={styles.chartSettingsDescription}>House system, aspect orbs, and calculation preferences</Text>
                    <View style={styles.chartSettingsTags}>
                      <View style={styles.settingTag}>
                        <MetallicText style={styles.settingTagText} color="#E8D6AE">{houseSystemLabel}</MetallicText>
                      </View>
                      <View style={styles.settingTag}>
                        <MetallicText style={styles.settingTagText} color="#E8D6AE">{orbPresetLabel} Orbs</MetallicText>
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
                      {expandedTerm === item.term && <MetallicText style={styles.glossaryDefinition} color="#E8D6AE">{item.definition}</MetallicText>}
                    </Pressable>
                  ))}
                </LinearGradient>
              </View>
            )}
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
  container: { flex: 1, backgroundColor: '#020817' },
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
  goHomeText: { color: '#CFAE73', fontWeight: '700' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, alignItems: 'center' },

  header: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginTop: theme.spacing.md,
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' }),
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontStyle: 'italic',
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
  bigThreeMoonHint: {
    color: 'rgba(168, 192, 214, 0.55)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: 5,
  },
  bigThreeLabel: {
    color: theme.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  bigThreeSign: { color: theme.textPrimary, fontWeight: '700', fontSize: 11, marginTop: 6, textAlign: 'center' },
  bigThreeDeg: { color: theme.textSecondary, fontSize: 9, marginTop: 3, textAlign: 'center', opacity: 0.9 },
  mcRow: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    width: '100%',
  },
  mcLabel: { color: theme.textMuted, fontSize: 11, letterSpacing: 0.5, textAlign: 'center' },
  mcSign: { color: theme.textPrimary, fontWeight: '700', fontSize: 14, marginTop: 4, textAlign: 'center' },
  mcDeg: { color: theme.textSecondary, fontSize: 10, marginTop: 2, textAlign: 'center' },

  sensitiveCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  sensitiveTitle: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  sensitiveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sensitiveItem: { alignItems: 'center', minWidth: 90 },
  sensitiveName: { color: theme.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  sensitiveSign: { color: theme.textSecondary, fontSize: 13, fontWeight: '500', marginTop: 2, textAlign: 'center' },
  sensitiveDeg: { color: theme.textMuted, fontSize: 11, marginTop: 1, textAlign: 'center' },

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
  tabTextActive: { color: '#CFAE73' },

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
  signName: { fontWeight: '600', fontSize: 10, textAlign: 'center' },
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
  aspectUpsellText: { flex: 1, color: '#CFAE73', fontSize: 13, fontStyle: 'italic', lineHeight: 18, textAlign: 'center' },

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
  patternHighlightText: { color: '#CFAE73', fontWeight: '700', fontSize: 15, textAlign: 'center' },
  patternDesc: { color: theme.textSecondary, fontSize: 12, lineHeight: 19, marginTop: theme.spacing.sm, textAlign: 'center' },
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
    backgroundColor: 'transparent',
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  personChipText: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 80,
  },
  personChipTextActive: { color: '#CFAE73' },
  personChipRelation: { color: theme.textMuted, fontSize: 10, fontStyle: 'italic', opacity: 0.7 },

  addPersonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#FFDA03',
  },
  addPersonText: { color: '#CFAE73', fontSize: 13, fontWeight: '600' },

  // ── Overlay Legend (luxury pill tags) ──
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
    marginTop: 24,
    marginBottom: theme.spacing.xl,
  },
  overlayUpsellText: { flex: 1, color: '#CFAE73', fontSize: 13, fontStyle: 'italic', lineHeight: 18, textAlign: 'center' },

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

  // ── Transparency Bar ──
  transparencyBar: {
    alignSelf: 'stretch',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.10)',
  },
  transparencyBarInner: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: 4,
  },
  transparencyText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontFamily: 'serif',
  },
  transparencyTextMuted: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'serif',
  },
  transparencyNote: {
    fontSize: 11,
    color: '#C2955A',
    fontStyle: 'italic',
    marginTop: 2,
  },

  // ── Angles (DC / IC) ──
  anglesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  angleItem: {
    alignItems: 'center',
    gap: 2,
  },
  angleLabel: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── House Planets ──
  housePlanets: {
    fontSize: 12,
    color: '#CFAE73',
    fontFamily: 'serif',
    marginTop: 2,
  },

  // ── Aspect Interpretations ──
  aspectInterp: {
    fontSize: 12,
    color: theme.textMuted,
    fontStyle: 'italic',
    lineHeight: 17,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },

  // ── Themed Interpretation Sections ──
  themedSectionHeader: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  themedSectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },
  themedCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.10)',
  },
  themedCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: theme.spacing.sm,
  },
  themedCardIcon: {
    fontSize: 20,
  },
  themedCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    flex: 1,
  },
  themedCardPlacements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  themedPlacementChip: {
    backgroundColor: 'rgba(232,214,174,0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.12)',
  },
  themedPlacementText: {
    fontSize: 10,
    color: '#CFAE73',
    fontFamily: 'serif',
  },
  themedCardSummary: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 19,
    fontFamily: 'serif',
  },
  themedCardDetails: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  themedCardDetail: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 19,
    fontFamily: 'serif',
  },

});
