// File: app/(tabs)/chart.tsx
// Project: MySky — The Celestial Blueprint (Master Implementation)
// 
// ── DESIGN SPECIFICATION ─────────────────────────────────────────────────────
// VERSION: 3.2.0 (High-End "Lunar Sky" & "Midnight Slate" Update)
// AESTHETIC: Velvet Glass / Apple Editorial / Luxury Minimalism
// TYPOGRAPHY: Negative tracking headers (-1.2 to -5.0), serif-synthesis bodies.
// COLOR PALETTE: Obsidian #0A0A0F, Desert Titanium #CFAE73, Midnight Slate.
// ARCHITECTURE: High-density modular rendering with Skia-accelerated layers.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Pressable, 
  Alert, 
  Platform, 
  Dimensions, 
  PixelRatio, 
  Share, 
  Vibration,
  SectionList,
  FlatList,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { Ionicons, FontAwesome6, MaterialCommunityIcons, Feather, Entypo } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeOut,
  useAnimatedStyle, 
  withTiming, 
  useSharedValue, 
  withSpring, 
  interpolate, 
  Extrapolate,
  Layout, 
  SlideInRight, 
  useAnimatedScrollHandler 
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

// ── Custom UI Components ──
import { type AppTheme } from '../../constants/theme';
import { metallicFillColors, metallicFillPositions } from '../../constants/mySkyMetallic';
import { METALLIC_RED } from '../../constants/metallicPalettes';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaBreathingRing from '../../components/ui/SkiaBreathingRing';
import NatalChartWheel from '../../components/ui/NatalChartWheel';
import MoonPhaseView from '../../components/ui/MoonPhaseView';
import { 
  ChironIcon, 
  NorthNodeIcon, 
  SouthNodeIcon, 
  LilithIcon, 
  PartOfFortuneIcon, 
  VertexIcon, 
  PholusIcon 
} from '../../components/ui/AstrologyIcons';
import BirthDataModal from '../../components/BirthDataModal';
import AstrologySettingsModal from '../../components/AstrologySettingsModal';
import PremiumModal from '../../components/PremiumModal';
import { MetallicText } from '../../components/ui/MetallicText';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';

// ── Services & Storage ──
import { localDb } from '../../services/storage/localDb';
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { 
  NatalChart, 
  PlanetPlacement, 
  Aspect, 
  HouseCusp as HouseCuspType, 
  BirthData 
} from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { ChartDisplayManager } from '../../services/astrology/chartDisplayManager';
import { HOUSE_MEANINGS } from '../../services/astrology/constants';
import { detectChartPatterns, ChartPatterns } from '../../services/astrology/chartPatterns';
import { getChironInsightFromChart, ChironInsight } from '../../services/journal/chiron';
import { getNodeInsight, NodeInsight } from '../../services/journal/nodes';
import { RelationshipChart, generateId } from '../../services/storage/models';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { detectExtendedPatterns, ExtendedPatterns } from '../../services/astrology/aspectPatterns';
import { generateThemedSections, getAspectInterpretation, ThemedSection } from '../../services/astrology/natalInterpretations';
import { parseLocalDate } from '../../utils/dateUtils';
import { 
  analyzeChartDignity, 
  analyzeDispositorChain, 
  detectChartShape, 
  detectSingletons, 
  detectInterceptions, 
  ChartDignityAnalysis, 
  DispositorChain, 
  ChartShapeResult, 
  Singleton, 
  Interception 
} from '../../services/astrology/dignityService';
import { 
  generatePlanetDeepDive, 
  generateHouseDeepDives, 
  generateAngleInterpretations, 
  selectKeyAspects, 
  generatePointInterpretations, 
  PlanetDeepDive, 
  HouseDeepDive, 
  AngleInterpretation, 
  KeyAspect, 
  PointInterpretation 
} from '../../services/astrology/natalDeepInterpretations';
import { 
  generateCoreIdentitySummary, 
  generateRelationshipProfile, 
  generateCareerProfile, 
  generateEmotionalProfile, 
  generateShadowGrowth, 
  CoreIdentitySummary, 
  RelationshipProfile, 
  CareerProfile, 
  EmotionalProfile, 
  ShadowGrowthProfile 
} from '../../services/astrology/natalSynthesis';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Advanced System Configurations ──────────────────────────────────────────

/**
 * Cinematic Palette: Bioluminescent Lunar Sky
 * Strict semantic washes for navigation and active states.
 */
const PALETTE = {
  gold: '#D4AF37',          // 24k hardware icon fill
  titanium: '#CFAE73',      // Desert Titanium accent
  obsidian: '#0A0A0F',      // Deep space base
  slateMid: '#2C3645',      // Midnight Slate (Primary Anchors)
  slateDeep: '#1A1E29',     // Deep Slate (Secondary Anchors)
  atmosphere: '#A2C2E1',    // Icy Blue (Cognitive/Nav)
  nebula: '#A88BEB',        // Amethyst (Psychological depth)
  ember: '#DC5050',         // Tension (Challenging aspects)
  sage: '#6EBF8B',          // Somatic (Harmonious aspects)
  roseGold: '#E8C2CA',      // Emotional / Healing
  silver: '#D1D5DB',        // Technical / Meta
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#FF7A5C', 
  Earth: '#9ACD32', 
  Air: '#49DFFF', 
  Water: '#7B68EE',
};

const ZODIAC_FAMILY = Platform.select({ 
  ios: 'Apple Symbols', 
  default: 'sans-serif' 
}) ?? 'sans-serif';

/** * Sign Meta-Dictionary
 * Used for building secondary badges and elemental markers.
 */
const SIGN_LOOKUP: Record<string, { symbol: string; element: string; modality: string; ruler: string }> = {
  Aries: { symbol: '♈︎', element: 'Fire', modality: 'Cardinal', ruler: 'Mars' },
  Taurus: { symbol: '♉︎', element: 'Earth', modality: 'Fixed', ruler: 'Venus' },
  Gemini: { symbol: '♊︎', element: 'Air', modality: 'Mutable', ruler: 'Mercury' },
  Cancer: { symbol: '♋︎', element: 'Water', modality: 'Cardinal', ruler: 'Moon' },
  Leo: { symbol: '♌︎', element: 'Fire', modality: 'Fixed', ruler: 'Sun' },
  Virgo: { symbol: '♍︎', element: 'Earth', modality: 'Mutable', ruler: 'Mercury' },
  Libra: { symbol: '♎︎', element: 'Air', modality: 'Cardinal', ruler: 'Venus' },
  Scorpio: { symbol: '♏︎', element: 'Water', modality: 'Fixed', ruler: 'Pluto' },
  Sagittarius: { symbol: '♐︎', element: 'Fire', modality: 'Mutable', ruler: 'Jupiter' },
  Capricorn: { symbol: '♑︎', element: 'Earth', modality: 'Cardinal', ruler: 'Saturn' },
  Aquarius: { symbol: '♒︎', element: 'Air', modality: 'Fixed', ruler: 'Uranus' },
  Pisces: { symbol: '♓︎', element: 'Water', modality: 'Mutable', ruler: 'Neptune' },
};

const ASPECT_NATURE_COLORS: Record<string, string> = {
  Harmonious: PALETTE.sage,
  Challenging: PALETTE.ember,
  Neutral: PALETTE.titanium,
};

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

const SAFE_ASPECT_SYMBOLS: Record<string, string> = {
  Sextile: '✱',
  Semisextile: '∨',
  Quincunx: '⊻',
  Sesquiquadrate: '⊞',
};

const MULTI_CHAR_PLANETS = new Set([
  'Ascendant',
  'Midheaven',
  'North Node',
  'South Node',
  'Part of Fortune',
]);

function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'name' in value && typeof (value as { name?: unknown }).name === 'string') {
    return (value as { name: string }).name;
  }
  return '';
}

function normalizeDegMin(value: number): { deg: number; min: number } {
  const safeValue = Number.isFinite(value) ? value : 0;
  const deg = Math.floor(safeValue);
  const min = Math.round((safeValue - deg) * 60);
  return { deg, min };
}

function getRetrogradeFlag(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return Boolean(
    candidate.isRetrograde ??
    candidate.retrograde ??
    candidate.retro ??
    (typeof candidate.motion === 'string' && candidate.motion.toLowerCase() === 'retrograde')
  );
}

function safeAspectTypeName(aspect: Aspect): string {
  return safeString(aspect?.type?.name).toLowerCase();
}

// ── Reusable Hardware Components ───────────────────────────────────────────

/**
 * GradientSymbol
 * Renders a high-resolution celestial text glyph with metallic gradient masking.
 */
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

/**
 * GradientIcon
 * Wraps Lucide/Ionicons SVGs with sheer metallic fill for the hardware look.
 */
function GradientIcon({ size, children }: { size: number; children: React.ReactElement }) {
  return (
    <MaskedView style={{ width: size, height: size }} maskElement={children}>
      <LinearGradient {...GRAD_PROPS} style={{ width: size, height: size }} />
    </MaskedView>
  );
}

/**
 * SectionAccordion
 * Editorial Collapsible Section with directional Velvet Glass borders.
 */
function SectionAccordion({
  title, 
  subtitle, 
  sectionKey, 
  openSections, 
  setOpenSections, 
  children,
}: {
  title: string; 
  subtitle?: string; 
  sectionKey: string;
  openSections: Set<string>;
  setOpenSections: React.Dispatch<React.SetStateAction<Set<string>>>;
  children: React.ReactNode;
}) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isOpen = openSections.has(sectionKey);
  
  const toggle = () => {
    Haptics.selectionAsync().catch(() => {});
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) next.delete(sectionKey);
      else next.add(sectionKey);
      return next;
    });
  };

  return (
    <View style={styles.accordionContainer}>
      <Pressable
        onPress={toggle}
        style={[styles.themedSectionHeader, isOpen && styles.themedSectionHeaderActive]}
        accessibilityRole="button"
        accessibilityLabel={`Toggle ${title}`}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.themedSectionHeaderText}>{title.toUpperCase()}</Text>
          {subtitle && !isOpen ? (
            <Text style={styles.accordionSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
        <Ionicons 
          name={isOpen ? 'chevron-up' : 'chevron-down'} 
          size={18} 
          color={PALETTE.titanium} 
        />
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(400)}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

// ── Types & Interfaces ──────────────────────────────────────────────────────

type TabKey = 'planets' | 'houses' | 'aspects' | 'patterns';
type RelationshipType = 'partner' | 'ex' | 'child' | 'parent' | 'friend' | 'sibling' | 'other';

const GLOSSARY_TERMS: { term: string; def: string }[] = [
  { term: 'Natal Chart', def: 'A mathematical blueprint of planetary geometry at the exact point of your entry into the space-time continuum.' },
  { term: 'Big Three', def: 'Sun (Ego), Moon (Emotional Core), and Rising (External Persona). The tripod of the self.' },
  { term: 'Chart Ruler', def: 'The planet that governs your Ascendant; the dominant architect of your life path and drive.' },
  { term: 'Dignity', def: 'The comfort level of a planet in its current sign. Domicile and Exaltation represent maximized potency.' },
  { term: 'Retrograde', def: 'Apparent backward motion; indicates a phase of internal re-processing and psychological revisiting.' },
  { term: 'Angular Houses', def: 'Houses 1, 4, 7, and 10. These represent the active pillars of the life structure.' },
  { term: 'Stellium', def: 'A high-density concentration of 3+ planets in a single sign or house, indicating intense thematic focus.' },
  { term: 'Nodes', def: 'Lunar intersection points; North Node indicates soul growth direction, South Node indicates past-life comfort.' },
];

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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { isPremium } = usePremium();

  // ── High-End Cinematic Gradient Definition ──
  // Using Midnight Slate and Atmosphere washes for layered depth.
  const chartGradients: Record<string, string[]> = {
    anchor: [PALETTE.slateMid, PALETTE.slateDeep],
    atmosphere: ['rgba(162, 194, 225, 0.15)', 'rgba(162, 194, 225, 0.05)'],
    stratosphere: ['rgba(92, 124, 170, 0.18)', 'rgba(92, 124, 170, 0.05)'],
    titanium: ['rgba(207, 174, 115, 0.12)', 'rgba(207, 174, 115, 0.02)'],
  };

  const chartSurfaceGradients = {
    rowPrimary: theme.isDark ? ['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)'] : ['rgba(255, 255, 255, 0.92)', 'rgba(236, 239, 244, 0.98)'],
    rowSecondary: theme.isDark ? ['rgba(255, 255, 255, 0.01)', 'rgba(255, 255, 255, 0.00)'] : [theme.cardSurface, 'rgba(231, 235, 240, 0.96)'],
    panel: theme.isDark ? chartGradients.anchor : ['rgba(255, 255, 255, 0.92)', 'rgba(236, 239, 244, 0.98)'],
    goldPanel: theme.isDark ? chartGradients.titanium : ['rgba(217, 191, 140, 0.14)', 'rgba(242, 235, 226, 0.98)'],
    goldPanelStrong: theme.isDark ? ['rgba(207, 174, 115, 0.18)', 'rgba(207, 174, 115, 0.06)'] : ['rgba(226, 204, 164, 0.32)', 'rgba(244, 237, 226, 0.98)'],
    goldPanelFaint: theme.isDark ? ['rgba(207, 174, 115, 0.10)', 'rgba(207, 174, 115, 0.03)'] : ['rgba(232, 214, 174, 0.18)', 'rgba(245, 240, 232, 0.98)'],
    goldPanelSoft: theme.isDark ? ['rgba(207, 174, 115, 0.14)', 'rgba(207, 174, 115, 0.04)'] : ['rgba(221, 198, 156, 0.24)', 'rgba(244, 238, 229, 0.98)'],
    goldPanelBarely: theme.isDark ? ['rgba(207, 174, 115, 0.08)', 'rgba(207, 174, 115, 0.02)'] : ['rgba(232, 214, 174, 0.12)', 'rgba(246, 242, 236, 0.98)'],
  };

  // ── Core Component State ──
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('planets');
  const [viewMode, setViewMode] = useState<'essentials' | 'complete'>('essentials');
  const [savedUserChartId, setSavedUserChartId] = useState<string | null>(null);

  // ── Synastry & Relationship State ──
  const [people, setPeople] = useState<RelationshipChart[]>([]);
  const [activeOverlays, setActiveOverlays] = useState<({ 
    person: RelationshipChart, 
    chart: NatalChart, 
    theme: 'silver' | 'roseGold' | 'iceBlue' 
  })[]>([]);
  
  const overlayPerson = activeOverlays.length > 0 ? activeOverlays[0].person : null;
  const overlayChart = activeOverlays.length > 0 ? activeOverlays[0].chart : null;

  // ── UI Control State ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRelTypePicker, setShowRelTypePicker] = useState(false);
  const [addingRelationType, setAddingRelationType] = useState<RelationshipType>('friend');
  const [showGlossary, setShowGlossary] = useState(false);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [showAstrologyModal, setShowAstrologyModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // ── System Configuration State ──
  const [houseSystemLabel, setHouseSystemLabel] = useState<string>('Whole Sign');
  const [orbPresetLabel, setOrbPresetLabel] = useState<string>('Normal');
  const [zodiacSystemLabel, setZodiacSystemLabel] = useState<string>('Tropical');
  const [chartOrientation, setChartOrientation] = useState<any>('standard-natal');

  /**
   * loadChart: Primary Synchronization Engine
   * Orchestrates the fetching of user settings and database chart recovery.
   */
  const loadChart = async () => {
    try {
      const astroSettings = await AstrologySettingsService.getSettings();
      setHouseSystemLabel(AstrologySettingsService.getHouseSystemLabel(astroSettings.houseSystem));
      setOrbPresetLabel(AstrologySettingsService.getOrbPresetLabel(astroSettings.orbPreset));
      setZodiacSystemLabel(astroSettings.zodiacSystem === 'sidereal' ? 'Sidereal' : 'Tropical');
      setChartOrientation(astroSettings.chartOrientation ?? 'standard-natal');

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
          zodiacSystem: astroSettings.zodiacSystem,
          orbPreset: astroSettings.orbPreset,
        };

        const chart = AstrologyCalculator.generateNatalChart(birthData);

        // Attach persistent database metadata
        (chart as any).id = saved.id;
        (chart as any).name = saved.name;
        (chart as any).createdAt = saved.createdAt;
        (chart as any).updatedAt = saved.updatedAt;

        setUserChart(chart);
        setSavedUserChartId(saved.id);

        // Load secondary synastry blueprints (Premium Feature)
        if (isPremium) {
          try {
            const rels = await localDb.getRelationshipCharts(saved.id);
            setPeople(rels);
          } catch (e) {
            logger.error('Synastry synchronization failed', e);
          }
        }
      } else {
        setUserChart(null);
        setSavedUserChartId(null);
      }
    } catch (error) {
      logger.error('Master blueprint load error', error);
      setUserChart(null);
    } finally {
      setLoading(false);
    }
  };

  // Re-synchronize ecosystem on screen focus
  useFocusEffect(
    useCallback(() => {
      void loadChart();
    }, [isPremium])
  );

  /**
   * handleSelectOverlay: Synastry Comparison Engine
   * Toggles the calculation and rendering of a secondary celestial sphere.
   */
  const handleSelectOverlay = useCallback(
    async (person: RelationshipChart) => {
      const isActive = activeOverlays.some((o) => o.person.id === person.id);

      if (isActive) {
        setActiveOverlays([]);
        Haptics.selectionAsync().catch(() => {});
        return;
      }

      try {
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
          zodiacSystem: astroSettings.zodiacSystem,
          orbPreset: astroSettings.orbPreset,
        };
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        (chart as any).name = person.name;

        setActiveOverlays([{ person, chart, theme: 'silver' }]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } catch (e) {
        logger.error('Synastry calculation error', e);
        Alert.alert('Ecosystem Error', 'Could not synthesize chart for this entity.');
      }
    },
    [activeOverlays]
  );

  // ── Database Interaction Handlers ──

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
          name: extra?.chartName || 'New Entity',
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
        setPeople((prev) => [...prev, newRel]);
        setShowAddModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        handleSelectOverlay(newRel);
      } catch (e) {
        logger.error('Database anchor error', e);
        Alert.alert('Error', 'Failed to anchor celestial data.');
      }
    },
    [savedUserChartId, addingRelationType, handleSelectOverlay]
  );

  const handleDeletePerson = useCallback(
    async (person: RelationshipChart) => {
      Alert.alert('Remove Blueprint', `Purge ${person.name}'s data from the archive?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge',
          style: 'destructive',
          onPress: async () => {
            try {
              await localDb.deleteRelationshipChart(person.id);
              setPeople((prev) => prev.filter((p) => p.id !== person.id));
              setActiveOverlays((prev) => prev.filter(o => o.person.id !== person.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch (e) {
              logger.error('Data purge failed', e);
            }
          },
        },
      ]);
    },
    []
  );

  // ── Analytical Context ──

  /** * Active Chart Context 
   * Dynamically switches the entire UI context between the primary user 
   * and any selected Synastry/Overlay partner.
   */
  const activeChart = overlayChart ?? userChart;

  /** * Display Warnings & Precision Calibration
   * Analyzes calculation confidence based on birth time reliability.
   */
  const displayChart = useMemo(() => {
    if (!userChart) return null;
    return ChartDisplayManager.formatChartWithTimeWarnings(userChart);
  }, [userChart]);

  /** * Planet Data Matrix
   * Maps the primary celestial bodies into a high-density editorial array.
   */
  const planetRows = useMemo(() => {
    if (!activeChart) return [];
    const baseList: { label: string; p: PlanetPlacement }[] = [
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
    
    // Injecting Angular points if calculation precision allows
    if (activeChart.ascendant) baseList.push({ label: 'Ascendant', p: activeChart.ascendant });
    if (activeChart.midheaven) baseList.push({ label: 'Midheaven', p: activeChart.midheaven });
    
    return baseList;
  }, [activeChart]);

  /** * Sensitive Point Synthesis
   * Processes mathematical points and minor bodies (Chiron, Nodes, PoF, Lilith).
   */
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

    // Local Synthesis Helper
    function addPoint(
      label: string,
      sign: string,
      degree: number,
      minute: number,
      house: number | undefined,
      retrograde: boolean,
      icon?: React.ReactNode
    ) {
      const lookup = SIGN_LOOKUP[sign] || { symbol: '', element: '', modality: '', ruler: '' };
      points.push({
        label, sign, signSymbol: lookup.symbol, element: lookup.element,
        degree, minute, house, retrograde, icon,
      });
    }

    // Processing Minor Body Array
    if (Array.isArray(activeChart.planets)) {
      for (const p of activeChart.planets as any[]) {
        const name = safeString(p.planet).toLowerCase();
        const signName = safeString(p.sign);
        const { deg, min } = normalizeDegMin(Number(p.degree ?? 0));
        const house = typeof p.house === 'number' ? p.house : undefined;
        const retrograde = getRetrogradeFlag(p);

        if (name === 'chiron') {
          addPoint('Chiron', signName, deg, min, house, retrograde, <ChironIcon size={20} color={'#000'} />);
        } else if (name.includes('node')) {
          const isNorth = name.includes('north') || name.includes('true');
          addPoint(isNorth ? 'North Node' : 'South Node', signName, deg, min, house, retrograde, 
            isNorth ? <NorthNodeIcon size={20} color={'#000'} /> : <SouthNodeIcon size={20} color={'#000'} />);
        } else if (name === 'lilith' || name === 'black moon lilith') {
          addPoint('Lilith', signName, deg, min, house, retrograde, <LilithIcon size={20} color={'#000'} />);
        }
      }
    }

    // Processing destinal angles
    if (Array.isArray(activeChart.angles)) {
      for (const angle of activeChart.angles) {
        if (angle.name === 'Vertex') {
          const { deg, min } = normalizeDegMin(Number(angle.degree ?? 0));
          addPoint('Vertex', safeString(angle.sign), deg, min, undefined, false, <VertexIcon size={20} color={'#000'} />);
        }
      }
    }

    // Synthesizing Part of Fortune (Solar/Lunar Convergence)
    if (activeChart.partOfFortune) {
      const pf = activeChart.partOfFortune;
      addPoint('Part of Fortune', safeString(pf.sign?.name ?? pf.sign), pf.degree, pf.minute, pf.house, false, <PartOfFortuneIcon size={20} color={'#000'} />);
    }

    const order: Record<string, number> = { 'North Node': 0, 'South Node': 1, 'Chiron': 2, 'Lilith': 3, 'Vertex': 4, 'Part of Fortune': 5 };
    return points.sort((a, b) => (order[a.label] ?? 99) - (order[b.label] ?? 99));
  }, [activeChart]);

  // ── Deep Interpretation Hooks ──

  const chironInsight = useMemo(() => activeChart && isPremium ? getChironInsightFromChart(activeChart) : null, [activeChart, isPremium]);
  const nodeInsight = useMemo(() => activeChart && isPremium ? getNodeInsight(activeChart) : null, [activeChart, isPremium]);

  const sortedAspects = useMemo(() => {
    const FREE_TYPES = new Set(['conjunction', 'sextile', 'square', 'trine', 'opposition']);
    if (!activeChart) return [];
    const all = [...(activeChart.aspects ?? [])].sort((a, b) => (a.orb ?? 99) - (b.orb ?? 99));
    return isPremium ? all : all.filter((a) => FREE_TYPES.has(safeAspectTypeName(a)));
  }, [activeChart, isPremium]);

  const hiddenAspectCount = useMemo(() => {
    if (!activeChart || isPremium) return 0;
    return (activeChart.aspects?.length ?? 0) - sortedAspects.length;
  }, [activeChart, isPremium, sortedAspects]);

  // ── Pattern & Structure Extraction ──

  const chartPatterns = useMemo(() => activeChart ? detectChartPatterns(activeChart) : null, [activeChart]);
  const extendedPatterns = useMemo(() => activeChart ? detectExtendedPatterns(activeChart) : null, [activeChart]);
  const dignityAnalysis = useMemo(() => activeChart && isPremium ? analyzeChartDignity(activeChart) : null, [activeChart, isPremium]);
  const dispositorChain = useMemo(() => activeChart && isPremium ? analyzeDispositorChain(activeChart) : null, [activeChart, isPremium]);
  const chartShape = useMemo(() => activeChart && isPremium ? detectChartShape(activeChart) : null, [activeChart, isPremium]);
  const singletons = useMemo(() => activeChart && isPremium ? detectSingletons(activeChart) : [], [activeChart, isPremium]);
  const interceptions = useMemo(() => activeChart && isPremium ? detectInterceptions(activeChart) : [], [activeChart, isPremium]);

  // ── Thematic Profile Synthesis ──

  const coreIdentity = useMemo(() => activeChart ? generateCoreIdentitySummary(activeChart) : null, [activeChart]);
  const keyAspects = useMemo(() => activeChart ? selectKeyAspects(activeChart, 10) : [], [activeChart]);
  const themedSections = useMemo(() => activeChart && isPremium ? generateThemedSections(activeChart) : [], [activeChart, isPremium]);

  const planetDeepDives = useMemo(() => {
    if (!activeChart || !isPremium) return [];
    const bodies = [
      activeChart.sun, activeChart.moon, activeChart.mercury, activeChart.venus, activeChart.mars,
      activeChart.jupiter, activeChart.saturn, activeChart.uranus, activeChart.neptune, activeChart.pluto
    ].filter(Boolean);
    return bodies.map(p => generatePlanetDeepDive(p, activeChart.aspects ?? []));
  }, [activeChart, isPremium]);

  const houseDeepDives = useMemo(() => activeChart && isPremium ? generateHouseDeepDives(activeChart) : [], [activeChart, isPremium]);
  const relationshipProfile = useMemo(() => activeChart && isPremium ? generateRelationshipProfile(activeChart) : null, [activeChart, isPremium]);
  const careerProfile = useMemo(() => activeChart && isPremium ? generateCareerProfile(activeChart) : null, [activeChart, isPremium]);
  const emotionalProfile = useMemo(() => activeChart && isPremium ? generateEmotionalProfile(activeChart) : null, [activeChart, isPremium]);
  const shadowGrowth = useMemo(() => activeChart && isPremium ? generateShadowGrowth(activeChart) : null, [activeChart, isPremium]);
  const angleInterpretations = useMemo(() => activeChart ? generateAngleInterpretations(activeChart) : [], [activeChart]);
  const pointInterpretations = useMemo(() => activeChart && isPremium ? generatePointInterpretations(activeChart) : [], [activeChart, isPremium]);
  const partOfFortune = useMemo(() => (activeChart as any)?.partOfFortune ?? null, [activeChart]);
  const dominantPlacement = useMemo(() => (chartPatterns as any)?.dominantFactors?.planetPlacement ?? null, [chartPatterns]);
  const descendant = useMemo(() => (activeChart as any)?.descendant ?? null, [activeChart]);
  const ic = useMemo(() => (activeChart as any)?.imumCoeli ?? (activeChart as any)?.ic ?? null, [activeChart]);
  const patternCount = useMemo(() => {
    const baseCount = (chartPatterns?.stelliums.length ?? 0)
      + (chartPatterns?.conjunctionClusters.length ?? 0)
      + (chartPatterns?.chartRuler ? 1 : 0)
      + ((chartPatterns?.retrogradeEmphasis?.count ?? 0) > 0 ? 1 : 0)
      + (extendedPatterns?.aspectPatterns?.length ?? 0)
      + (extendedPatterns?.hemisphereEmphasis && extendedPatterns.hemisphereEmphasis.dominant !== 'Balanced' ? 1 : 0)
      + (extendedPatterns?.houseEmphasis ? 1 : 0)
      + (chartShape ? 1 : 0)
      + singletons.length
      + interceptions.length;
    return baseCount;
  }, [chartPatterns, extendedPatterns, chartShape, singletons, interceptions]);

  // ── UI UI Tracking & Derivation ──

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);
  const [expandedHouse, setExpandedHouse] = useState<number | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['bigThree', 'coreIdentity', 'chartStory']));

  const birthDateStr = useMemo(() => {
    const chart = activeChart ?? userChart;
    const date = (chart as any)?.birthData?.date;
    if (!date) return '';
    try {
      const d = parseLocalDate(date);
      return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  }, [activeChart, userChart]);

  const birthTimeStr = useMemo(() => {
    try {
      const chart = activeChart ?? userChart;
      const bd = (chart as any)?.birthData;
      if (bd?.hasUnknownTime || !bd?.time) return '';
      const [hStr, mStr] = bd.time.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch { return ''; }
  }, [activeChart, userChart]);

  const planetsByHouse = useMemo(() => {
    if (!activeChart) return new Map<number, string[]>();
    const map = new Map<number, string[]>();
    const bodies = planetRows.map(r => r.p);
    for (const p of bodies) {
      if (!p.house) continue;
      if (!map.has(p.house)) map.set(p.house, []);
      map.get(p.house)!.push(p.planet.name);
    }
    return map;
  }, [activeChart, planetRows]);

  // ── Final Guardrails ──
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <SkiaDynamicCosmos />
        <SkiaBreathingRing size={100} color="gold" rings={3} />
        <Animated.View
          entering={FadeIn.delay(400).duration(800)}
          style={styles.loadingTextContainer}
        >
          <Text style={styles.loadingText}>SYNCHRONIZING CELESTIAL BLUEPRINT...</Text>
        </Animated.View>
      </View>
    );
  }

  if (!userChart) {
    return (
      <View style={[styles.container, styles.center]}>
        <SkiaDynamicCosmos />
        <MaterialCommunityIcons
          name="moon-waxing-crescent"
          size={64}
          color={PALETTE.titanium}
          style={{ opacity: 0.3, marginBottom: 24 }}
        />
        <Text style={styles.loadingText}>NO GENESIS ARCHIVE FOUND.</Text>
        <Text style={[styles.wheelHint, { paddingHorizontal: 40, marginTop: 12 }]}> 
          Your celestial blueprint personalizes your reflection and growth prompts throughout the MySky ecosystem.
        </Text>
        <Pressable
          style={styles.goHomeBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            router.replace('/(tabs)/home' as Href);
          }}
          accessibilityRole="button"
          accessibilityLabel="Initialize Genesis"
        >
          <VelvetGlassSurface style={styles.initBtnGlass} intensity={25}>
            <MetallicText style={styles.goHomeText} color={PALETTE.titanium}>
              INITIALIZE BLUEPRINT
            </MetallicText>
          </VelvetGlassSurface>
        </Pressable>
      </View>
    );
  }

  const houseCusps = activeChart?.houseCusps ?? [];

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Nebula depth — atmospheric glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -120, right: -100, backgroundColor: 'rgba(110, 140, 180, 0.15)' }]} />
        <View style={[styles.glowOrb, { bottom: 100, left: -140, backgroundColor: 'rgba(207, 174, 115, 0.08)' }]} />
        <View
          style={[
            styles.glowOrb,
            {
              top: SCREEN_HEIGHT * 0.4,
              left: SCREEN_WIDTH * 0.5,
              width: 600,
              height: 600,
              borderRadius: 300,
              opacity: 0.02,
              backgroundColor: PALETTE.nebula,
            },
          ]}
        />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.header}>
            <View style={styles.headerUtilityRow}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  router.replace('/(tabs)/identity' as Href);
                }}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Back to identity"
              >
                <MetallicIcon name="arrow-back-outline" size={22} color={PALETTE.titanium} />
                <Text style={styles.backText}>IDENTITY</Text>
              </Pressable>
              <MoonPhaseView size={42} />
            </View>
            <Text style={styles.heroTitle}>
              {activeOverlays.length > 0 ? 'Synastry' : 'Blueprint'}
            </Text>
            <GoldSubtitle style={styles.heroSubtitle}>
              {activeOverlays.length > 0
                ? `${(userChart as any).name || 'YOU'} + ${activeOverlays[0].person.name}`.toUpperCase()
                : `${birthDateStr ? `BORN ${birthDateStr}` : 'NATAL ALIGNMENT'}${birthTimeStr ? ` · ${birthTimeStr}` : ''}`.toUpperCase()}
            </GoldSubtitle>
            {activeOverlays.length === 0 && (
              <Animated.View entering={FadeIn.delay(600).duration(1000)}>
                <Text style={styles.headerEditorialFrame}>
                  Your unique celestial architecture personalizes the growth and reflection loops within the MySky ecosystem.
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* ── People Bar (Premium Multi-Chart) ── */}
          {isPremium && (
            <Animated.View entering={FadeInDown.delay(150).duration(800)} style={styles.peopleSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleBar}>
                {/* Your chart chip (always first) */}
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setActiveOverlays([]);
                  }}
                  style={[styles.personChip, activeOverlays.length === 0 && styles.personChipActive]}
                  accessibilityRole="button"
                  accessibilityLabel="Your chart"
                  accessibilityState={{ selected: !overlayPerson }}
                >
                  <Text style={[styles.personChipText, activeOverlays.length === 0 && styles.personChipTextActive]}>YOU</Text>
                </Pressable>

                {/* People chips */}
                {people.map((person) => {
                  const isActive = overlayPerson?.id === person.id;
                  return (
                  <Pressable
                    key={person.id}
                    onPress={() => handleSelectOverlay(person)}
                    onLongPress={() => {
                      Vibration.vibrate(50);
                      handleDeletePerson(person);
                    }}
                    style={[styles.personChip, isActive && styles.personChipActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`${person.name} overlay chart`}
                    accessibilityHint="Long press to remove"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.personChipText, isActive && styles.personChipTextActive]} numberOfLines={1}>
                      {person.name.toUpperCase()}
                    </Text>
                    <Text style={styles.personChipMeta}>
                      {RELATIONSHIP_LABELS[person.relationship as RelationshipType]?.toUpperCase() || ''}
                    </Text>
                  </Pressable>
                )})}

                {/* Add person button */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setShowRelTypePicker(true);
                  }}
                  style={styles.addSynastryBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Add person"
                >
                  <Ionicons name="add" size={20} color={PALETTE.titanium} />
                </Pressable>
              </ScrollView>

              {/* Overlay legend when active — luxury pill tags */}
              {activeOverlays.length > 0 && (
                <Animated.View entering={FadeIn.duration(400)} style={styles.overlayLegend}>
                  <View style={styles.legendPill}>
                    <View style={[styles.legendPillDot, { backgroundColor: '#FFFFFF' }]} />
                    <Text style={styles.overlayLegendText}>YOUR BLUEPRINT</Text>
                  </View>
                  <View style={styles.legendPill}>
                    <View style={[styles.legendPillDot, { backgroundColor: PALETTE.gold }]} />
                    <Text style={styles.overlayLegendText}>{overlayPerson?.name.toUpperCase()}'S</Text>
                  </View>
                  <View style={styles.legendPill}>
                    <View style={[styles.legendPillDot, { backgroundColor: PALETTE.silver }]} />
                    <Text style={styles.overlayLegendText}>CROSS-ASPECTS</Text>
                  </View>
                </Animated.View>
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
              <Ionicons name="alert-circle-outline" size={18} color="#E8A87C" />
              <Text style={styles.warningText}>{displayChart.warnings[0]}</Text>
            </View>
          ) : null}

          {/* ── Chart Wheel ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.wheelSection}>
            <View style={styles.wheelGlassContainer}>
              <NatalChartWheel
                chart={userChart}
                showAspects={true}
                overlayChart={overlayChart ?? undefined}
                overlayName={overlayPerson?.name}
                orientation={chartOrientation}
              />
            </View>

            <View style={styles.wheelMetaContainer}>
              <Text style={styles.wheelMetaText}>
                CELESTIAL PROJECTION · {houseSystemLabel.toUpperCase()} HOUSES
              </Text>
              <Text style={[styles.wheelMetaText, styles.wheelMetaTextMuted]}>
                {zodiacSystemLabel.toUpperCase()} COORDINATE SYSTEM
              </Text>
            </View>
            <Text style={styles.wheelHint}>TAP THE WHEEL TO ROTATE · PINCH TO EXPLORE SPECIFIC DEGREES</Text>
          </Animated.View>

          {/* ── Big Three Summary ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ width: '100%' }}>
            <SectionAccordion
              title="The Big Three"
              subtitle={`${activeChart!.sun.sign.name} Sun · ${activeChart!.moon.sign.name} Moon${activeChart!.ascendant ? ` · ${activeChart!.ascendant.sign.name} Rising` : ''}`}
              sectionKey="bigThree"
              openSections={openSections}
              setOpenSections={setOpenSections}
            >
            <View style={{ width: '100%' }}>
              <View style={styles.bigThreeGrid}>
                <VelvetGlassSurface style={[styles.bigThreeCard, styles.velvetBorder]} intensity={30}>
                  <View style={styles.bigThreeIconRow}>
                    <GradientSymbol symbol="☉" fontSize={24} w={30} h={30} />
                    <Text style={styles.bigThreeLabel}>SUN</Text>
                  </View>
                  <Text style={styles.bigThreeSignText}>{activeChart!.sun.sign.name.toUpperCase()}</Text>
                  <Text style={styles.bigThreeCoordText}>{activeChart!.sun.degree}°{String(activeChart!.sun.minute).padStart(2, '0')}'</Text>
                </VelvetGlassSurface>

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    router.push('/astrology-context' as Href);
                  }}
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.8 : 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Moon — tap to view today's cosmic context"
                >
                  <VelvetGlassSurface style={[styles.bigThreeCard, styles.velvetBorder]} intensity={30}>
                    <View style={styles.bigThreeIconRow}>
                      <GradientSymbol symbol="☽" fontSize={24} w={30} h={30} />
                      <Text style={styles.bigThreeLabel}>MOON</Text>
                    </View>
                    <Text style={styles.bigThreeSignText}>{activeChart!.moon.sign.name.toUpperCase()}</Text>
                    <Text style={styles.bigThreeCoordText}>{activeChart!.moon.degree}°{String(activeChart!.moon.minute).padStart(2, '0')}'</Text>
                    <Text style={styles.bigThreeMoonHint}>TODAY'S SKY</Text>
                  </VelvetGlassSurface>
                </Pressable>

                {activeChart!.ascendant && (
                  <VelvetGlassSurface style={[styles.bigThreeCard, styles.velvetBorder]} intensity={30}>
                    <View style={styles.bigThreeIconRow}>
                      <GradientSymbol symbol={activeChart!.ascendant.sign.symbol} fontSize={24} w={30} h={30} />
                      <Text style={styles.bigThreeLabel}>RISING</Text>
                    </View>
                    <Text style={styles.bigThreeSignText}>{activeChart!.ascendant.sign.name.toUpperCase()}</Text>
                    <Text style={styles.bigThreeCoordText}>{activeChart!.ascendant.degree}°{String(activeChart!.ascendant.minute).padStart(2, '0')}'</Text>
                  </VelvetGlassSurface>
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
                onPress={() => {
                  setViewMode('essentials');
                  if (activeTab !== 'planets') setActiveTab('planets');
                }}
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
                onPress={() => {
                  if (!isPremium) {
                    setShowPremiumModal(true);
                  } else {
                    setViewMode('complete');
                  }
                }}
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

          {/* ── Sensitive Points (Premium, Complete only) ── */}
          {viewMode === 'complete' && isPremium && sensitivePoints.length > 0 && (
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
            {(viewMode === 'complete' ? ['planets', 'houses', 'aspects', 'patterns'] as TabKey[] : ['planets'] as TabKey[]).map((tab) => (
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
                      ? `Planets (${viewMode === 'essentials' ? 7 : planetRows.length})`
                      : tab === 'houses'
                        ? `Houses (${houseCusps.length})`
                        : tab === 'aspects'
                          ? `Aspects (${sortedAspects.length})`
                          : `Patterns (${patternCount})`}
                  </MetallicText>
                ) : (
                  <Text style={styles.tabText}>
                    {tab === 'planets'
                      ? `Planets (${viewMode === 'essentials' ? 7 : planetRows.length})`
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

              {(viewMode === 'essentials' ? planetRows.slice(0, 7) : planetRows).map((row, idx) => {
                const elColor = ELEMENT_COLORS[row.p.sign.element] || theme.textSecondary;
                const retro = getRetrogradeFlag(row.p as any);
                const planetSymbol = (row.p as any)?.planet?.symbol ?? '•';

                return (
                  <VelvetGlassSurface key={row.label} intensity={15} style={{marginBottom: 8, borderRadius: 24}}>
                  <LinearGradient
                    colors={
                      idx % 2 === 0
                        ? chartSurfaceGradients.rowPrimary
                        : chartSurfaceGradients.rowSecondary
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
                            <Ionicons name="arrow-undo-outline" size={10} color="#C9AE78" />
                            <MetallicText style={styles.retroLabel} color="#E8D6AE">Retrograde</MetallicText>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                      <GradientSymbol symbol={row.p.sign.symbol} fontSize={18} w={24} h={24} style={{ marginRight: 6 }} />
                      <View style={{ flex: 1 }}>
                        <MetallicText color={elColor} style={styles.signName}>{row.p.sign.name}</MetallicText>
                        {viewMode === 'complete' && (
                          <Text style={styles.elementLabel}>
                            {row.p.sign.element} · {row.p.sign.modality}
                          </Text>
                        )}
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
                </VelvetGlassSurface>
                );
              })}

              {/* Sensitive Points (table section — premium, complete only) */}
              {viewMode === 'complete' && isPremium && sensitivePoints.length > 0 && (
                <>
                  <View style={styles.pointsDivider}>
                    <Text style={styles.pointsLabel}>Sensitive Points</Text>
                  </View>

                  {sensitivePoints.map((pt, idx) => (
                    <LinearGradient
                      key={pt.label}
                      colors={
                        idx % 2 === 0
                          ? chartSurfaceGradients.rowPrimary
                          : chartSurfaceGradients.rowSecondary
                      }
                      style={styles.tableRow}
                    >
                      <View style={[styles.td, { width: 140, flexDirection: 'row', alignItems: 'center' }]}>
                        <View style={styles.sensitiveIconBox}>
                          {pt.icon ? <GradientIcon size={18}>{pt.icon as React.ReactElement}</GradientIcon> : null}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.planetName}>{pt.label.toUpperCase()}</Text>
                          {pt.retrograde && (
                            <View style={styles.retroRow}>
                              <Ionicons name="arrow-undo-outline" size={10} color={PALETTE.titanium} />
                              <MetallicText style={styles.retroLabel} color="#E8D6AE">RETROGRADE</MetallicText>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                        <GradientSymbol symbol={pt.signSymbol} fontSize={18} w={24} h={24} style={{ marginRight: 6 }} />
                        <View style={{ flex: 1 }}>
                          <MetallicText
                            color={ELEMENT_COLORS[pt.element] || theme.textSecondary}
                            style={styles.signNameText}
                          >
                            {pt.sign.toUpperCase()}
                          </MetallicText>
                          <Text style={styles.elementLabelText}>{pt.element.toUpperCase()}</Text>
                        </View>
                      </View>

                      <View style={[styles.td, { flex: 1 }]}>
                        <Text style={styles.degreeValueText}>{pt.degree}°</Text>
                        <Text style={styles.minuteValueText}>{String(pt.minute).padStart(2, '0')}'</Text>
                      </View>

                      <View style={[styles.td, { flex: 1, alignItems: 'center' }]}>
                        <Text style={styles.houseValueText}>{pt.house || '—'}</Text>
                      </View>
                    </LinearGradient>
                  ))}
                </>
              )}
            </Animated.View>
          )}

          {/* ── Houses Table ── */}
          {activeTab === 'houses' && (
            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ width: '100%' }}>
              {houseCusps.length === 0 ? (
                <View style={styles.emptyBlueprintState}>
                  <Ionicons name="alert-circle-outline" size={32} color={theme.textMuted} />
                  <Text style={styles.emptyBlueprintText}>
                    HOUSE PRECISION REQUIRES AN INITIALIZED BIRTH TIME.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.editorialTableMeta}>
                    <Ionicons name="information-circle-outline" size={14} color={PALETTE.titanium} />
                    <Text style={styles.editorialMetaText}>
                      SYSTEM: {houseSystemLabel.toUpperCase()} · ZODIAC: {zodiacSystemLabel.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.tableHeader}>
                    <Text style={[styles.thText, { flex: 1 }]}>INDEX</Text>
                    <Text style={[styles.thText, { flex: 2 }]}>CUSP SIGN</Text>
                    <Text style={[styles.thText, { flex: 1 }]}>DEGREE</Text>
                    <Text style={[styles.thText, { flex: 3 }]}>DOMAIN</Text>
                  </View>

                  {houseCusps.map((cusp: HouseCuspType, idx: number) => {
                    const houseInfo = HOUSE_MEANINGS[cusp.house as keyof typeof HOUSE_MEANINGS];
                    const elColor = ELEMENT_COLORS[cusp.sign.element] || theme.textSecondary;
                    const occupants = planetsByHouse.get(cusp.house) || [];
                    const isAngular = [1, 4, 7, 10].includes(cusp.house);

                    return (
                      <VelvetGlassSurface
                        key={cusp.house}
                        intensity={15}
                        style={[styles.houseRowContainer, isAngular && styles.angularHighlight]}
                      >
                        <LinearGradient
                          colors={idx % 2 === 0 ? chartSurfaceGradients.rowPrimary : chartSurfaceGradients.rowSecondary}
                          style={styles.tableRow}
                        >
                          <View style={[styles.td, { flex: 1, alignItems: 'center' }]}> 
                            <View style={[styles.houseBadge, isAngular && { borderColor: PALETTE.gold }]}> 
                              <Text style={[styles.houseNumText, isAngular && { color: PALETTE.gold }]}> 
                                {cusp.house}
                              </Text>
                            </View>
                          </View>

                          <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}> 
                            <GradientSymbol symbol={cusp.sign.symbol} fontSize={18} w={24} h={24} style={{ marginRight: 6 }} />
                            <View style={{ flex: 1 }}>
                              <MetallicText color={elColor} style={styles.signNameText}>
                                {cusp.sign.name.toUpperCase()}
                              </MetallicText>
                            </View>
                          </View>

                          <View style={[styles.td, { flex: 1 }]}> 
                            <Text style={styles.degreeValueText}>
                              {activeChart?.houseSystem === 'whole-sign' ? '0°' : `${Math.floor(cusp.longitude % 30)}°`}
                            </Text>
                          </View>

                          <View style={[styles.td, { flex: 3 }]}> 
                            <Text style={styles.houseThemeTitle}>{houseInfo?.theme.toUpperCase() || ''}</Text>
                            {occupants.length > 0 && (
                              <View style={styles.occupantCloud}>
                                {occupants.map((p) => (
                                  <View key={p} style={styles.occupantPill}>
                                    <Text style={styles.occupantPillText}>{p.toUpperCase()}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        </LinearGradient>
                      </VelvetGlassSurface>
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
                            ? chartSurfaceGradients.rowPrimary
                            : chartSurfaceGradients.rowSecondary
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
                      <View style={[styles.legendDot, { backgroundColor: theme.isDark ? '#FFFFFF' : theme.textPrimary }]} />
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
                <LinearGradient colors={chartSurfaceGradients.goldPanelStrong} style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="ribbon-outline" size={20} color="#C9AE78" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Chart Ruler</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <GradientSymbol symbol={chartPatterns.chartRuler.planetSymbol} fontSize={15} w={18} h={17} />
                      <MetallicText style={styles.patternHighlightText} color="#CFAE73"> {chartPatterns.chartRuler.planet} in </MetallicText>
                      <GradientSymbol symbol={chartPatterns.chartRuler.rulerSignSymbol} fontSize={15} w={18} h={17} />
                      <MetallicText style={styles.patternHighlightText} color="#C9AE78"> {chartPatterns.chartRuler.rulerSign} · House {chartPatterns.chartRuler.rulerHouse}</MetallicText>
                    </View>
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.chartRuler.description}</Text>
                  <View style={styles.tooltipBox}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                    <Text style={styles.tooltipText}>
                      Your chart ruler is the planet that rules your rising sign (<Text style={{ fontFamily: ZODIAC_FAMILY, color: theme.isDark ? '#FFFFFF' : theme.textPrimary }}>{chartPatterns.chartRuler.risingSymbol}</Text>{' '}
                      {chartPatterns.chartRuler.risingSign}). Its placement colors your entire life path.
                    </Text>
                  </View>
                </LinearGradient>
              )}

              {/* Part of Fortune (premium) */}
              {isPremium && partOfFortune && (
                <LinearGradient colors={chartSurfaceGradients.panel} style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}>
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
                <LinearGradient colors={chartSurfaceGradients.panel} style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="star-outline" size={20} color="#C9AE78" style={styles.patternIcon} />
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
                    colors={chartSurfaceGradients.goldPanel}
                    style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}
                  >
                    <View style={styles.patternHeader}>
                      <Ionicons name="flash-outline" size={16} color="#C9AE78" style={styles.patternIcon} />
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
                      <Text style={[styles.patternDesc, { marginTop: 6, opacity: 0.8 }]}>{stellium.planetMixNote}</Text>
                    )}
                    {stellium.retroNote && (
                      <Text style={[styles.patternDesc, { marginTop: 6, opacity: 0.8 }]}>{stellium.retroNote}</Text>
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
                    colors={chartSurfaceGradients.panel}
                    style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}
                  >
                    <View style={styles.patternHeader}>
                      <Ionicons name="link-outline" size={20} color="#C9AE78" style={styles.patternIcon} />
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
                <LinearGradient colors={chartSurfaceGradients.panel} style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="arrow-undo-outline" size={20} color="#C9AE78" style={styles.patternIcon} />
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
                <LinearGradient colors={chartSurfaceGradients.panel} style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="flame-outline" size={20} color="#C9AE78" style={styles.patternIcon} />
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
                          color={theme.isDark ? elColor : '#1A1815'}
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
                <LinearGradient colors={chartSurfaceGradients.panel} style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="options-outline" size={20} color="#C9AE78" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Modality Balance</Text>
                  </View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 16, justifyContent: 'center' }]}>
                    {Object.entries(chartPatterns.modalityBalance.counts).map(([mod, count]) => {
                      const isDominant = mod === chartPatterns.modalityBalance.dominant;
                      return isDominant ? (
                        <MetallicText
                          key={mod}
                          style={[styles.patternHighlightText, { fontSize: 15 }]}
                          color={theme.isDark ? "#CFAE73" : '#1A1815'}
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
                <LinearGradient colors={chartSurfaceGradients.panel} style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="git-compare-outline" size={20} color="#C9AE78" style={styles.patternIcon} />
                    <Text style={styles.patternTitle}>Polarity Balance</Text>
                  </View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 24, justifyContent: 'center' }]}>
                    {[
                      { label: 'Masculine', count: chartPatterns.polarityBalance.masculine },
                      { label: 'Feminine', count: chartPatterns.polarityBalance.feminine },
                    ].map(({ label, count }) => {
                      const isDominant = label === chartPatterns.polarityBalance.dominant;
                      return isDominant ? (
                        <MetallicText key={label} style={[styles.patternHighlightText, { fontSize: 15 }]} color={theme.isDark ? "#CFAE73" : '#1A1815'}>
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
                  colors={chartSurfaceGradients.goldPanel}
                  style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}
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
                <LinearGradient colors={chartSurfaceGradients.panel} style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="contrast-outline" size={20} color="#C9AE78" style={styles.patternIcon} />
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
                <LinearGradient colors={chartSurfaceGradients.panel} style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="home-outline" size={20} color="#C9AE78" style={styles.patternIcon} />
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

          {/* ── Themed Interpretation Sections (premium, Complete only) ── */}
          {viewMode === 'complete' && isPremium && themedSections.length > 0 && (
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
                      colors={chartSurfaceGradients.goldPanelFaint}
                      style={[styles.themedCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}
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

          {/* ── Key Aspects Summary (Complete only) ── */}
          {viewMode === 'complete' && keyAspects.length > 0 && (
            <Animated.View entering={FadeInDown.delay(360).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion
                title="Strongest Aspects"
                subtitle="Your most important planetary connections"
                sectionKey="keyAspects"
                openSections={openSections}
                setOpenSections={setOpenSections}
              >
                {keyAspects.slice(0, 10).map((ka, idx) => (
                  <LinearGradient
                    key={`ka-${idx}`}
                    colors={idx % 2 === 0 ? chartSurfaceGradients.rowPrimary : chartSurfaceGradients.rowSecondary}
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
                    colors={chartSurfaceGradients.goldPanelFaint}
                    style={[styles.themedCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}
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
                    colors={chartSurfaceGradients.panel}
                    style={[styles.themedCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}
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
                <LinearGradient colors={chartSurfaceGradients.goldPanel} style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="ellipse-outline" size={20} color="#C9AE78" style={styles.patternIcon} />
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
                    colors={chartSurfaceGradients.panel}
                    style={[styles.themedCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}
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
                    colors={chartSurfaceGradients.panel}
                    style={[styles.themedCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}
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
                    colors={chartSurfaceGradients.rowPrimary}
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
                <LinearGradient colors={chartSurfaceGradients.goldPanelSoft} style={[styles.patternCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}>
                  <View style={styles.patternHeader}>
                    <Ionicons name="git-network-outline" size={20} color="#C9AE78" style={styles.patternIcon} />
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

          {/* ── Editorial Tool: Planetary Deep Dives ── */}
          {activeTab === 'planets' && viewMode === 'complete' && isPremium && (
            <Animated.View entering={FadeIn.duration(1000)} style={styles.deepDiveContainer}>
              <Text style={styles.editorialSectionLabel}>PLANETARY DEEP-DIVES</Text>
              {planetRows.map((row) => (
                <SectionAccordion
                  key={`dd-${row.label}`}
                  title={row.label}
                  subtitle={`${row.p.sign.name.toUpperCase()} · HOUSE ${row.p.house || '—'}`}
                  sectionKey={`dd-${row.label}`}
                  openSections={openSections}
                  setOpenSections={setOpenSections}
                >
                  <VelvetGlassSurface style={[styles.editorialCard, styles.velvetBorder]} intensity={20}>
                    <LinearGradient colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.ddHeaderRow}>
                      <GradientSymbol symbol={(row.p as any).planet?.symbol || '•'} fontSize={24} w={30} h={30} />
                      <View style={styles.ddHeaderLabels}>
                        <Text style={styles.ddPlanetSignText}>{row.p.sign.name.toUpperCase()}</Text>
                        <Text style={styles.ddPlanetElementText}>{row.p.sign.element.toUpperCase()} · {row.p.sign.modality.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.editorialBodyText}>
                      {generatePlanetDeepDive(row.p, activeChart!.aspects ?? []).synthesis}
                    </Text>
                    <View style={styles.ddFooterMeta}>
                      <Text style={styles.ddMetaValue}>DEGREE: {Math.floor(row.p.degree)}°{String(row.p.minute).padStart(2, '0')}'</Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.ddMetaValue}>HOUSE: {row.p.house ?? '—'}</Text>
                    </View>
                  </VelvetGlassSurface>
                </SectionAccordion>
              ))}
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
                      colors={chartSurfaceGradients.rowPrimary}
                      style={[styles.themedCard, { borderColor: "rgba(255,255,255,0.15)", borderWidth: 1 }]}
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

          {/* ── Advanced Thematic Profiles (Premium) ── */}
          {viewMode === 'complete' && isPremium && (
            <Animated.View entering={FadeIn.duration(800)} style={styles.profileStack}>
              <Text style={styles.editorialSectionLabel}>NARRATIVE SYNTHESIS</Text>

              {relationshipProfile && (
                <SectionAccordion title="The Relational Mirror" sectionKey="relational" openSections={openSections} setOpenSections={setOpenSections}>
                  <VelvetGlassSurface style={[styles.editorialCard, styles.velvetBorder]} intensity={25}>
                    <LinearGradient colors={['rgba(168, 139, 235, 0.12)', 'rgba(168, 139, 235, 0.04)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.profileHeader}>
                      <MaterialCommunityIcons name="heart-pulse" size={24} color={PALETTE.nebula} />
                      <Text style={styles.profileTitleText}>ATTACHMENT ARCHITECTURE</Text>
                    </View>
                    <Text style={styles.editorialBodyText}>{relationshipProfile.synthesis}</Text>
                    <View style={styles.tagCloud}>
                      <View style={styles.editorialTag}><Text style={styles.tagText}>LOVE STYLE: {relationshipProfile.loveStyle.toUpperCase()}</Text></View>
                      <View style={styles.editorialTag}><Text style={styles.tagText}>INTIMACY: {relationshipProfile.intimacyStyle.toUpperCase()}</Text></View>
                    </View>
                  </VelvetGlassSurface>
                </SectionAccordion>
              )}

              {careerProfile && (
                <SectionAccordion title="Vocation & Purpose" sectionKey="career" openSections={openSections} setOpenSections={setOpenSections}>
                  <VelvetGlassSurface style={[styles.editorialCard, styles.velvetBorder]} intensity={25}>
                    <LinearGradient colors={['rgba(207, 174, 115, 0.12)', 'rgba(207, 174, 115, 0.04)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.profileHeader}>
                      <MaterialCommunityIcons name="briefcase-variant-outline" size={24} color={PALETTE.titanium} />
                      <Text style={styles.profileTitleText}>VOCATIONAL ALCHEMY</Text>
                    </View>
                    <Text style={styles.editorialBodyText}>{careerProfile.synthesis}</Text>
                    <View style={styles.tagCloud}>
                      <View style={styles.editorialTag}><Text style={styles.tagText}>PUBLIC IMAGE: {careerProfile.publicImage.toUpperCase()}</Text></View>
                      <View style={styles.editorialTag}><Text style={styles.tagText}>WORK STYLE: {careerProfile.workStyle.toUpperCase()}</Text></View>
                    </View>
                  </VelvetGlassSurface>
                </SectionAccordion>
              )}

              {emotionalProfile && (
                <SectionAccordion title="Inner World Substrate" sectionKey="emotional" openSections={openSections} setOpenSections={setOpenSections}>
                  <VelvetGlassSurface style={[styles.editorialCard, styles.velvetBorder]} intensity={25}>
                    <LinearGradient colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.profileHeader}>
                      <MaterialCommunityIcons name="waves" size={24} color={PALETTE.sage} />
                      <Text style={styles.profileTitleText}>PSYCHOLOGICAL SUBSTRATE</Text>
                    </View>
                    <Text style={styles.editorialBodyText}>{emotionalProfile.synthesis}</Text>
                    <View style={styles.tagCloud}>
                      <View style={styles.editorialTag}><Text style={styles.tagText}>CORE FEARS: {emotionalProfile.coreFears.toUpperCase()}</Text></View>
                      <View style={styles.editorialTag}><Text style={styles.tagText}>HEALING: {emotionalProfile.healingThemes.toUpperCase()}</Text></View>
                    </View>
                  </VelvetGlassSurface>
                </SectionAccordion>
              )}

              {shadowGrowth && (
                <SectionAccordion title="Shadow & Evolution" sectionKey="shadow" openSections={openSections} setOpenSections={setOpenSections}>
                  <VelvetGlassSurface style={[styles.editorialCard, styles.velvetBorder]} intensity={35}>
                    <LinearGradient colors={['rgba(220, 80, 80, 0.15)', 'rgba(220, 80, 80, 0.05)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.profileHeader}>
                      <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={PALETTE.ember} />
                      <Text style={styles.profileTitleText}>EVOLUTIONARY GROWTH EDGE</Text>
                    </View>
                    <Text style={styles.editorialBodyText}>{shadowGrowth.synthesis}</Text>

                    <View style={styles.growthList}>
                      {shadowGrowth.growthEdges.map((edge, i) => (
                        <View key={i} style={styles.growthRow}>
                          <Ionicons name="arrow-forward" size={14} color={PALETTE.titanium} />
                          <Text style={styles.growthText}>{edge.toUpperCase()}</Text>
                        </View>
                      ))}
                    </View>
                  </VelvetGlassSurface>
                </SectionAccordion>
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

          {/* ── The Celestial Glossary (Instructional Context) ── */}
          <SectionAccordion
            title="Celestial Glossary"
            subtitle="Archetypal Definitions & System Logic"
            sectionKey="glossary"
            openSections={openSections}
            setOpenSections={setOpenSections}
          >
             <View style={styles.glossaryContainer}>
                {GLOSSARY_TERMS.map((item) => (
                  <Pressable
                    key={item.term}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setExpandedTerm(expandedTerm === item.term ? null : item.term);
                    }}
                    style={styles.glossaryRow}
                  >
                    <View style={styles.glossaryHeader}>
                       <Text style={styles.glossaryTerm}>{item.term.toUpperCase()}</Text>
                       <Ionicons name={expandedTerm === item.term ? 'remove' : 'add'} size={20} color={PALETTE.titanium} />
                    </View>
                    {expandedTerm === item.term && (
                      <Animated.View entering={FadeIn.duration(400)}>
                        <Text style={styles.glossaryDef}>{item.def}</Text>
                      </Animated.View>
                    )}
                  </Pressable>
                ))}
             </View>
          </SectionAccordion>

          {/* ── Calibration (System Settings) Launcher ── */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setShowAstrologyModal(true);
            }}
            style={styles.calibrationLauncher}
          >
            <VelvetGlassSurface style={[styles.calibrationGlass, styles.velvetBorder]} intensity={30}>
              <Ionicons name="settings-outline" size={22} color={PALETTE.titanium} />
              <MetallicText style={styles.calibrationText} variant="gold">CALIBRATE BLUEPRINT ENGINE</MetallicText>
            </VelvetGlassSurface>
          </Pressable>

          <View style={{ height: 140 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── Chart Settings Modal ── */}
      <AstrologySettingsModal
        visible={showAstrologyModal}
        onClose={() => setShowAstrologyModal(false)}
        onSettingsChanged={(updated) => {
          setHouseSystemLabel(AstrologySettingsService.getHouseSystemLabel(updated.houseSystem));
          setOrbPresetLabel(AstrologySettingsService.getOrbPresetLabel(updated.orbPreset));
          setZodiacSystemLabel(updated.zodiacSystem === 'sidereal' ? 'Sidereal' : 'Tropical');
          setChartOrientation(updated.chartOrientation ?? 'standard-natal');
          // Clear natal chart cache so changes take effect
          AstrologyCalculator.clearNatalChartCache();
          // Clear overlays so they regenerate with new settings
          setActiveOverlays([]);
          // Recalculate chart with new house system / orb settings
          void loadChart();
        }}
      />

      {/* ── Add Person Modal ── */}
      <BirthDataModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSaveNewPerson} />

      {/* ── Premium upsell (for Complete Chart tab) ── */}
      <PremiumModal visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    color: theme.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingTextContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  goHomeBtn: {
    marginTop: 16,
    borderRadius: 28,
    backgroundColor: 'transparent',
  },
  goHomeText: { color: '#CFAE73', fontWeight: '700' },
  initBtnGlass: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },

  header: {
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  headerUtilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: '#CFAE73',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', default: 'System' }),
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', default: 'System' }),
    letterSpacing: -1.2,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    letterSpacing: 1.4,
  },
  headerFrame: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 17,
    opacity: 0.8,
  },
  headerEditorialFrame: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 12,
    lineHeight: 19,
    maxWidth: 340,
    textAlign: 'left',
    opacity: 0.86,
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
    width: '100%',
    alignItems: 'center',
    minHeight: 152,
    justifyContent: 'center',
  },
  bigThreeGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'stretch',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
  },
  bigThreeRow: { flexDirection: 'row', justifyContent: 'space-evenly' },
  bigThreeItem: { alignItems: 'center', flex: 1 },
  bigThreeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bigThreeMoonHint: {
    color: 'rgba(168, 192, 214, 0.55)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 10,
  },
  bigThreeLabel: {
    color: theme.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  bigThreeSignText: {
    color: theme.textPrimary,
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  bigThreeCoordText: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.92,
  },
  bigThreeSign: { color: theme.textPrimary, fontWeight: '700', fontSize: 11, marginTop: 6, textAlign: 'center' },
  bigThreeDeg: { color: theme.textSecondary, fontSize: 9, marginTop: 3, textAlign: 'center', opacity: 0.9 },
  mcRow: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.cardBorder,
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
  insightTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '600', fontFamily: 'serif', textAlign: 'center' },
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
    backgroundColor: theme.isDark ? 'rgba(10, 18, 36,0.5)' : PALETTE.slateMid,
    padding: 4,
    width: '100%',
    borderWidth: theme.isDark ? 0 : 1,
    borderColor: theme.isDark ? 'transparent' : theme.cardBorder,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.borderRadius.md },
  tabBtnActive: { backgroundColor: theme.isDark ? 'rgba(162, 194, 225, 0.15)' : 'rgba(255, 255, 255, 0.92)' },
  tabText: { color: theme.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: '#C9AE78' },

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
    borderRadius: 24,
    marginBottom: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
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
  wheelSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  wheelGlassContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 36,
    backgroundColor: 'transparent',
  },
  wheelMetaContainer: {
    marginTop: 14,
    alignItems: 'center',
  },
  wheelMetaText: {
    color: theme.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  wheelMetaTextMuted: {
    color: 'rgba(255,255,255,0.25)',
    marginTop: 4,
  },
  wheelHint: {
    marginTop: 10,
    color: theme.isDark ? theme.textMuted : theme.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    opacity: theme.isDark ? 0.85 : 0.96,
  },

  td: { justifyContent: 'center', alignItems: 'center' },

  planetSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: theme.isDark ? '#FFFFFF' : theme.textPrimary, marginRight: 10, width: 28, textAlign: 'center' },
  signSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: theme.isDark ? '#FFFFFF' : theme.textPrimary, marginRight: 6, width: 24, textAlign: 'center' },
  planetName: { color: theme.textPrimary, fontWeight: '600', fontSize: 14, textAlign: 'center' },
  retroLabel: { color: theme.isDark ? '#FFFFFF' : theme.textPrimary, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  signName: { fontWeight: '600', fontSize: 10, textAlign: 'center' },
  elementLabel: { color: theme.textMuted, fontSize: 10, textAlign: 'center' },
  degreeText: { color: theme.textPrimary, fontWeight: '600', fontSize: 14, textAlign: 'center' },
  minuteText: { color: theme.textSecondary, fontSize: 11, textAlign: 'center' },
  houseNum: { color: theme.textPrimary, fontWeight: '700', fontSize: 16, textAlign: 'center' },

  houseSystemLabel: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    width: '100%',
  },
  houseNumLarge: { color: theme.primary, fontWeight: '700', fontSize: 18, textAlign: 'center' },
  houseTheme: { color: theme.textSecondary, fontSize: 12, lineHeight: 16, textAlign: 'center' },

  aspectPlanetSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: theme.isDark ? '#FFFFFF' : theme.textPrimary, marginRight: 6, width: 24, textAlign: 'center' },
  aspectIconWrap: { width: 24, marginRight: 6, alignItems: 'center', justifyContent: 'center' },
  aspectPlanetName: { color: theme.textPrimary, fontWeight: '600', fontSize: 13, textAlign: 'center' },
  aspectSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: theme.isDark ? '#FFFFFF' : theme.textPrimary, fontWeight: '700', textAlign: 'center' },
  aspectName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  aspectNature: { fontSize: 9, textAlign: 'center' },
  orbText: { fontWeight: '700', fontSize: 14, textAlign: 'center' },
  applyingLabel: { color: theme.textMuted, fontSize: 9, textAlign: 'center' },

  legend: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.isDark ? 'rgba(10, 18, 36,0.4)' : theme.cardSurface,
    alignItems: 'center',
    borderWidth: theme.isDark ? 0 : 1,
    borderColor: theme.isDark ? 'transparent' : theme.cardBorder,
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
  legendNote: { color: theme.textMuted, fontSize: 11, marginTop: theme.spacing.sm, textAlign: 'center' },

  aspectUpsell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: 8,
  },
  aspectUpsellText: { flex: 1, color: '#CFAE73', fontSize: 13, lineHeight: 18, textAlign: 'center' },

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
  patternHighlightText: { color: theme.isDark ? '#CFAE73' : '#1A1815', fontWeight: '700', fontSize: 15, textAlign: 'center' },
  patternDesc: { color: theme.textSecondary, fontSize: 12, lineHeight: 19, marginTop: theme.spacing.sm, textAlign: 'center' },
  tooltipBox: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', backgroundColor: 'transparent', borderRadius: theme.borderRadius.md, padding: 10, marginTop: theme.spacing.md },
  tooltipText: { color: theme.textMuted, fontSize: 11, lineHeight: 16, marginLeft: 6, flex: 1, textAlign: 'center' },

  // ── People Bar (Multi-Chart) ──
  peopleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 8,
  },
  peopleSection: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  personChip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.isDark ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: theme.isDark ? 1 : 0,
    borderColor: "rgba(255,255,255,0.15)",
  },
  personChipActive: {
    backgroundColor: 'transparent',
    borderColor: '#CFAE73',
    borderWidth: 1,
  },
  personChipText: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 110,
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  personChipTextActive: { color: '#CFAE73' },
  personChipRelation: { color: theme.textMuted, fontSize: 10, opacity: 0.7 },
  personChipMeta: {
    color: theme.textMuted,
    fontSize: 9,
    opacity: 0.75,
    marginTop: 2,
    letterSpacing: 0.7,
    textAlign: 'center',
  },
  addSynastryBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
  },

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
    borderColor: "rgba(255,255,255,0.15)",
  },
  legendPillDot: { width: 6, height: 6, borderRadius: 3 },
  legendPillText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  overlayLegendText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: theme.textPrimary,
  },

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
  overlayUpsellText: { flex: 1, color: '#C9AE78', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  calibrationLauncher: {
    width: '100%',
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  calibrationGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 28,
  },
  calibrationText: {
    color: theme.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
  },

  // ── Chart Glossary ──
  glossarySection: { alignSelf: 'stretch', marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl },
  glossarySectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  glossarySectionTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif' },
  glossaryCard: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  glossaryGradient: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
  glossaryRow: { paddingVertical: theme.spacing.md },
  glossaryRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.cardBorder },
  glossaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  glossaryTerm: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif', flex: 1 },
  glossaryDefinition: { fontSize: 14, color: theme.textPrimary, lineHeight: 20, marginTop: theme.spacing.xs },
  glossaryContainer: { width: '100%' },
  glossaryDef: { fontSize: 13, color: theme.textSecondary, lineHeight: 20, marginTop: theme.spacing.xs, fontFamily: 'serif' },

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
    borderTopColor: theme.cardBorder,
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

  sensitiveIconBox: {
    marginRight: 10,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 2,
  },
  signNameText: { fontWeight: '700', fontSize: 10, letterSpacing: 0.8, textAlign: 'center' },
  elementLabelText: { color: theme.textMuted, fontSize: 10, letterSpacing: 0.7, textAlign: 'center' },
  degreeValueText: { color: theme.textPrimary, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  minuteValueText: { color: theme.textSecondary, fontSize: 11, textAlign: 'center' },
  houseValueText: { color: theme.textPrimary, fontWeight: '700', fontSize: 16, textAlign: 'center' },
  emptyBlueprintState: { alignItems: 'center', paddingVertical: 40, width: '100%' },
  emptyBlueprintText: { color: theme.textMuted, fontSize: 13, marginTop: 12, textAlign: 'center', letterSpacing: 0.9 },
  editorialTableMeta: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  editorialMetaText: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
  thText: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  houseRowContainer: {
    marginBottom: 8,
    borderRadius: 24,
    overflow: 'hidden',
  },
  angularHighlight: {
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
  },
  houseBadge: {
    minWidth: 38,
    minHeight: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  houseNumText: { color: theme.textPrimary, fontWeight: '800', fontSize: 16, textAlign: 'center' },
  houseThemeTitle: {
    color: theme.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  occupantCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
  },
  occupantPill: {
    backgroundColor: 'rgba(232,214,174,0.08)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.12)',
  },
  occupantPillText: {
    color: '#CFAE73',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    textAlign: 'center',
  },

  // ── Aspect Interpretations ──
  aspectInterp: {
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 17,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },

  // ── Themed Interpretation Sections ──
  accordionContainer: { width: '100%', marginBottom: theme.spacing.sm },
  accordionSubtitle: { fontSize: 12, color: theme.textMuted, marginTop: 2, letterSpacing: 0.2 },
  themedSectionHeaderActive: { backgroundColor: 'rgba(255,255,255,0.05)' },
  themedSectionHeader: { flexDirection: 'row', padding: 25, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 28, alignItems: 'center' },
  themedSectionHeaderText: { fontSize: 20, fontWeight: '900', letterSpacing: 1.5, color: '#FFF' },
  velvetBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
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
    borderTopColor: theme.cardBorder,
    gap: 6,
  },
  themedCardDetail: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 19,
    fontFamily: 'serif',
  },

  profileStack: {
    width: '100%',
    marginTop: theme.spacing.sm,
  },
  editorialSectionLabel: {
    color: '#CFAE73',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  editorialCard: {
    width: '100%',
    borderRadius: 28,
    padding: theme.spacing.lg,
    overflow: 'hidden',
  },
  ddHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 25,
  },
  ddHeaderLabels: {
    flex: 1,
  },
  ddPlanetSignText: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  ddPlanetElementText: {
    color: PALETTE.titanium,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  ddFooterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 35,
    gap: 12,
    flexWrap: 'wrap',
  },
  ddMetaValue: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PALETTE.titanium,
    opacity: 0.3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: theme.spacing.md,
  },
  profileTitleText: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  editorialBodyText: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: theme.spacing.md,
  },
  editorialTag: {
    backgroundColor: 'rgba(232,214,174,0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.12)',
  },
  tagText: {
    color: '#E8D6AE',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  growthList: {
    marginTop: theme.spacing.md,
    gap: 8,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  growthText: {
    color: theme.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  deepDiveContainer: {
    width: '100%',
    marginTop: theme.spacing.md,
  },

});
