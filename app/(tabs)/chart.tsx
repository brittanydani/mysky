// File: app/(tabs)/chart.tsx
// Project: MySky — The Celestial Blueprint (Master Implementation)
// 
// ── DESIGN SPECIFICATION ─────────────────────────────────────────────────────
// VERSION: 3.2.0 (High-End "Lunar Sky" & "Midnight Slate" Update)
// AESTHETIC: Velvet Glass / Apple Editorial / Luxury Minimalism
// TYPOGRAPHY: Negative tracking headers (-1.2 to -5.0), serif-synthesis bodies.
// COLOR PALETTE: Obsidian #0A0A0F, Desert Titanium #E8D6AE, Midnight Slate.
// ARCHITECTURE: High-density modular rendering with Skia-accelerated layers.
// ─────────────────────────────────────────────────────────────────────────────

import { ChartBigThreeSection } from '../../components/screens/ChartBigThreeSection';
import { ChartDignitiesSection } from '../../components/screens/ChartDignitiesSection';

import React, { useCallback, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  type ViewStyle,
  type TextStyle,
  Pressable, 
  Alert, 
  Platform, 
  Vibration,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeInDown, 
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
import { trackGrowthEvent } from '../../services/growth/localAnalytics';

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
import { detectChartPatterns } from '../../services/astrology/chartPatterns';

import { RelationshipChart, generateId } from '../../services/storage/models';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { detectExtendedPatterns } from '../../services/astrology/aspectPatterns';
import { generateThemedSections, getAspectInterpretation } from '../../services/astrology/natalInterpretations';
import { 
  analyzeChartDignity, 
  analyzeDispositorChain, 
  detectChartShape, 
  detectSingletons, 
  detectInterceptions, 
} from '../../services/astrology/dignityService';
import { 
  generatePlanetDeepDive, 
  generateHouseDeepDives, 
  generateAngleInterpretations, 
  selectKeyAspects, 
  generatePointInterpretations, 
} from '../../services/astrology/natalDeepInterpretations';
import { 
  generateCoreIdentitySummary, 
  generateRelationshipProfile, 
  generateCareerProfile, 
  generateEmotionalProfile, 
  generateShadowGrowth, 
} from '../../services/astrology/natalSynthesis';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { personalizeLifeThemeSummary } from './chartHelpers';
import { ChartStorySection } from '../../components/ui/editorial/ChartStorySection';

// ── Advanced System Configurations ──────────────────────────────────────────

/**
 * Cinematic Palette: Bioluminescent Lunar Sky
 * Strict semantic washes for navigation and active states.
 */
const PALETTE = {
  gold: '#E8D6AE',          // 24k hardware icon fill
  titanium: '#E8D6AE',      // Desert Titanium accent
  obsidian: '#0A0A0F',      // Deep space base
  slateMid: '#2C3645',      // Midnight Slate (Primary Anchors)
  slateDeep: '#1A1E29',     // Deep Slate (Secondary Anchors)
  atmosphere: '#A2C2E1',    // Icy Blue (Cognitive/Nav)
  nebula: '#A88BEB',        // Amethyst (Psychological depth)
  ember: '#DC5050',         // Tension (Challenging aspects)
  sageOriginal: '#8D9A8F',  // Original soft sage
  sage: '#608A8D',          // Somatic (Harmonious aspects)
  roseGold: '#E8C2CA',      // Emotional / Healing
  silver: '#D1D5DB',        // Technical / Meta
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#FF7A5C', 
  Earth: '#608A8D', 
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
  start: { x: 0.1, y: 0 },
  end: { x: 0.9, y: 1 },
};

const RED_GRAD_PROPS = {
  colors: [...METALLIC_RED] as string[],
  locations: [0, 0.18, 0.36, 0.50, 0.64, 0.82, 1],
  start: { x: 0.1, y: 0 },
  end: { x: 0.9, y: 1 },
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
  const styles = useThemedStyles(createStyles) as any;
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
    <View style={styles.accordionContainer as ViewStyle}>
      <Pressable
        onPress={toggle}
        style={[styles.themedSectionHeader as ViewStyle, isOpen && (styles.themedSectionHeaderActive as ViewStyle)]}
        accessibilityRole="button"
        accessibilityLabel={`Toggle ${title}`}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.themedSectionHeaderText as TextStyle}>{title.toUpperCase()}</Text>
          {subtitle && !isOpen ? (
            <Text style={styles.accordionSubtitle as TextStyle}>{subtitle}</Text>
          ) : null}
        </View>
        <Ionicons 
          name={isOpen ? 'chevron-up' : 'chevron-down'} 
          size={18} 
          color={PALETTE.titanium} 
        />
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.accordionContent as ViewStyle}>
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
  { term: 'Natal Chart', def: 'A map of where all the planets were at the exact moment you were born. Think of it as your unique personal blueprint.' },
  { term: 'Sun Sign', def: 'The zodiac sign the Sun was in when you were born. It represents your core identity and ego.' },
  { term: 'Moon Sign', def: 'The zodiac sign the Moon was in at your birth. It governs your emotions, instincts, and inner world.' },
  { term: 'Rising Sign (Ascendant)', def: 'The zodiac sign rising on the eastern horizon at your birth. It shapes how others perceive you and your outward style.' },
  { term: 'Ascendant', def: 'Also called your Rising Sign. It describes the tone of your outer personality, how you first meet life, and how other people often experience you at first.' },
  { term: 'Houses', def: 'The 12 sections of your chart, each representing a different area of life — like relationships, career, or home.' },
  { term: 'Transit', def: 'The current position of a planet in the sky and how it interacts with your natal chart. Transits correlate with moods and life themes — they reflect cycles and timing, not fixed outcomes.' },
  { term: 'Aspect', def: 'An angle between two planets in your chart. Aspects show how different parts of your personality interact — harmoniously or with tension.' },
  { term: 'Orb', def: 'Orb tells you how close an aspect is to being exact. A smaller orb usually means the aspect feels stronger, clearer, or more noticeable in your life.' },
  { term: 'Retrograde', def: 'When a planet appears to move backward in the sky. It often signals a time to slow down and revisit themes related to that planet.' },
  { term: 'Stellium', def: 'Three or more planets clustered in the same sign or house. It creates an intense focus of energy in that area of your life.' },
  { term: 'Chiron', def: 'Known as the "wounded healer." Its placement shows where you carry deep wounds — and where you have the greatest power to heal others.' },
  { term: 'Nodes (North & South)', def: 'The Nodes describe a growth axis in your chart. The North Node points toward growth and development, while the South Node points toward familiar habits, strengths, and patterns you may already know well.' },
  { term: 'North Node', def: 'The North Node points toward the qualities and life lessons your chart is asking you to grow into. It can feel unfamiliar at first, but it often describes meaningful development.' },
  { term: 'South Node', def: 'The South Node describes old habits, familiar patterns, and natural strengths you may fall back on automatically. It is not bad, but it can become limiting if you stay there too long.' },
  { term: 'Conjunction', def: 'When two planets sit very close together (within a few degrees). Their energies merge and amplify each other.' },
  { term: 'Opposition', def: 'When two planets are directly across the chart from each other (180°). It creates tension that pushes you toward balance.' },
  { term: 'Trine', def: 'A flowing, harmonious angle (120°) between two planets. Trines represent natural talents and ease.' },
  { term: 'Square', def: 'A challenging 90° angle between two planets. Squares create friction that drives growth and action.' },
  { term: 'Cardinal Signs', def: 'Aries, Cancer, Libra, Capricorn. Cardinal energy initiates — these signs start new seasons and are natural leaders and self-starters.' },
  { term: 'Fixed Signs', def: 'Taurus, Leo, Scorpio, Aquarius. Fixed energy sustains — these signs are deeply determined, persistent, and resistant to change.' },
  { term: 'Mutable Signs', def: 'Gemini, Virgo, Sagittarius, Pisces. Mutable energy adapts — these signs are flexible, versatile, and comfortable with change.' },
  { term: 'Fire Element', def: 'Aries, Leo, Sagittarius. Fire signs are passionate, energetic, and action-oriented. They lead with enthusiasm and courage.' },
  { term: 'Earth Element', def: 'Taurus, Virgo, Capricorn. Earth signs are grounded, practical, and reliable. They build things that last.' },
  { term: 'Air Element', def: 'Gemini, Libra, Aquarius. Air signs are intellectual, communicative, and social. They process the world through ideas and connection.' },
  { term: 'Water Element', def: 'Cancer, Scorpio, Pisces. Water signs are intuitive, emotional, and deeply feeling. They navigate life through empathy and instinct.' },
  { term: 'Midheaven (MC)', def: 'The highest point of your chart, representing your public image, career path, and life direction. It shows how the world sees your achievements.' },
  { term: 'MC', def: 'Short for Midheaven. It points to public life, direction, visibility, and the kind of contribution or reputation you may grow into over time.' },
  { term: 'Midheaven', def: 'Also called the MC. It describes your public direction, reputation, and the part of life where you may feel called to grow, contribute, or be recognized.' },
  { term: 'Descendant (DC)', def: 'The sign on your 7th house cusp, directly opposite your Ascendant. It reveals what you seek in partnerships and how you relate one-on-one.' },
  { term: 'DC', def: 'Short for Descendant. It points to partnership, one-to-one relationships, and the qualities you often meet, seek, or learn from through other people.' },
  { term: 'Descendant', def: 'The Descendant sits opposite your Ascendant and speaks to partnership. It often describes the kinds of people, qualities, and relationship dynamics that teach you the most about yourself.' },
  { term: 'Imum Coeli (IC)', def: 'The lowest point of your chart, representing your roots, home life, and private inner world. It shows your emotional foundation.' },
  { term: 'IC', def: 'Short for Imum Coeli. It describes your roots, private life, emotional foundation, and what helps you feel inwardly safe or anchored.' },
  { term: 'Sextile', def: 'A supportive 60° angle between two planets. Sextiles represent opportunities that require a little effort to unlock.' },
  { term: 'Quincunx (Inconjunct)', def: "An awkward 150° angle between two planets. It creates a nagging sense that two parts of your life don't quite fit — requiring constant adjustment." },
  { term: 'Semisextile', def: 'A subtle 30° angle between two planets. It usually shows a quiet connection between two parts of you that do not fully blend, but can still learn to work together.' },
  { term: 'Sesquiquadrate', def: 'A tense 135° angle between two planets. It often creates a background pressure or irritation that pushes growth, adjustment, and greater self-awareness.' },
  { term: 'Lilith (Black Moon)', def: 'A calculated point representing your raw, untamed instincts and the parts of yourself society told you to suppress.' },
  { term: 'Part of Fortune', def: 'A calculated point blending your Sun, Moon, and Ascendant. It highlights where you find joy, luck, and a natural sense of flow.' },
  { term: 'Vertex', def: 'A fated point in your chart associated with destined encounters and turning points that feel beyond your control.' },
  { term: 'Juno', def: 'Juno is an asteroid linked with commitment, partnership patterns, and what long-term loyalty or devotion can look like in your life. It can add nuance to how you bond and what you need from commitment.' },
  { term: 'Pholus', def: 'Pholus is a small body often associated with chain reactions and small things that open much bigger processes. In self-understanding work, it can point to places where one shift has a surprisingly wide impact.' },
  { term: 'Chart Ruler', def: 'The planet that rules your Rising sign. It acts as the CEO of your chart, coloring your entire life approach and motivation.' },
  { term: 'Dominant Planet', def: 'The planet with the most influence in your chart based on its sign, house, and aspects. It shapes your personality more than any other.' },
  { term: 'Dignity', def: "A planet's comfort level in its sign. A planet in domicile or exaltation is strong and at ease; in detriment or fall, it must work harder to express itself." },
  { term: 'Domicile', def: 'A planet is in domicile when it is in the sign it rules. This usually means its energy can express itself more naturally, confidently, and directly.' },
  { term: 'Exaltation', def: 'A planet is in exaltation when it is in a sign where its strengths are especially elevated or refined. This can make that part of you feel gifted, supported, or easier to trust.' },
  { term: 'Detriment', def: 'A planet is in detriment when it is in the sign opposite one it rules. Its energy is still usable, but it may feel less straightforward or require more conscious effort to understand.' },
  { term: 'Fall', def: 'A planet is in fall when it is in a sign opposite its exaltation. This can describe an area of life that feels more tender, effortful, or slow to trust, but it can also become a source of depth.' },
  { term: 'Dispositor', def: 'The planet that rules the sign another planet sits in. Dispositor chains show which planet ultimately "calls the shots" in your chart.' },
  { term: 'Mutual Reception', def: 'When two planets each sit in the sign the other rules — they support each other like a handshake agreement, strengthening both.' },
  { term: 'Chart Shape', def: 'The overall pattern formed by your planets around the wheel — like Bowl, Bucket, or Splash. It reveals your broad approach to engaging with the world.' },
  { term: 'Singleton', def: 'A planet that stands alone in a hemisphere, element, or modality. It carries outsized importance as the sole representative of that energy.' },
  { term: 'Hemisphere Emphasis', def: 'Hemisphere emphasis means more of your planets gather on one half of the chart than the other. This can show whether your energy tends to lean more inward or outward, more personal or more public.' },
  { term: 'Polarity', def: 'Polarity usually refers to the balance between masculine and feminine signs in a chart. In astrology, this is about style of energy — outward-moving and active versus inward-moving and receptive — not gender identity.' },
  { term: 'Angle', def: 'The angles are the four anchor points of a chart: Ascendant, Descendant, Midheaven, and IC. They describe major life directions like identity, relationship, public life, and private foundation.' },
  { term: 'Interception', def: 'When a sign is completely contained within a house without touching a cusp. Intercepted energies can feel hidden or harder to access until consciously developed.' },
  { term: 'Grand Trine', def: 'Three planets forming an equilateral triangle (all 120° apart). A Grand Trine is a gift of natural talent — but can also lead to complacency.' },
  { term: 'T-Square', def: 'Two planets in opposition with a third squaring both. A T-Square creates persistent tension that drives ambition and growth through challenge.' },
  { term: 'Yod (Finger of God)', def: "Two planets in sextile, both quincunx a third. A Yod creates a sense of fated mission — an urgent, unavoidable calling in the apex planet's domain." },
  { term: 'Grand Cross', def: 'Four planets forming a cross of two oppositions and four squares. It creates intense pressure from all sides but also extraordinary resilience.' },
  { term: 'Applying vs Separating', def: 'An applying aspect is still forming and growing stronger. A separating aspect has already peaked and is fading — applying aspects have more influence.' },
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
  const styles = useThemedStyles(createStyles) as any;
  const router = useRouter();
  const { isPremium } = usePremium();

  // ── High-End Cinematic Gradient Definition ──
  // Using Midnight Slate and Atmosphere washes for layered depth.
  const chartGradients: Record<string, string[]> = {
    anchor: [PALETTE.slateMid, PALETTE.slateDeep],
    atmosphere: ['rgba(162, 194, 225, 0.15)', 'rgba(162, 194, 225, 0.05)'],
    stratosphere: ['rgba(92, 124, 170, 0.18)', 'rgba(92, 124, 170, 0.05)'],
    titanium: ['rgba(207, 174, 115, 0.12)', 'rgba(207, 174, 115, 0.02)'],
    sand: ['rgba(176, 170, 163, 0.36)', 'rgba(148, 142, 136, 0.24)'],
    sage: ['rgba(96, 138, 141, 0.34)', 'rgba(96, 138, 141, 0.20)'],
    sageOriginal: ['rgba(141, 154, 143, 0.34)', 'rgba(141, 154, 143, 0.20)'],
    plum: ['rgba(168, 139, 235, 0.20)', 'rgba(168, 139, 235, 0.05)'],
    rose: ['rgba(232, 194, 202, 0.18)', 'rgba(232, 194, 202, 0.05)'],
    ember: ['rgba(220, 80, 80, 0.20)', 'rgba(220, 80, 80, 0.05)'],
  };

  const chartSurfaceGradients = {
    rowPrimary: theme.cardSurfaceAnchor as unknown as string[],
    rowSecondary: theme.cardSurfaceValues as unknown as string[],
    panel: theme.cardSurfaceAnchor as unknown as string[],
    goldPanel: theme.cardSurfaceCognitive as unknown as string[],
    goldPanelStrong: theme.cardSurfaceAnchor as unknown as string[],
    goldPanelFaint: theme.cardSurfaceValues as unknown as string[],
    goldPanelSoft: theme.cardSurfaceRelational as unknown as string[],
    goldPanelBarely: theme.cardSurfaceAnchor as unknown as string[],
    settings: theme.cardSurfaceAnchor as unknown as string[],
    storySection: chartGradients.plum,
    aspectsSectionHarmonious: chartGradients.sage,
    aspectsSectionChallenging: chartGradients.plum,
    aspectsSectionNeutral: chartGradients.sand,
    aspectsSectionFallback: chartGradients.anchor,
    dignitySection: chartGradients.sand,
    planetSection: theme.cardSurfaceSomatic as unknown as string[],
    houseSection: chartGradients.sand,
    lifeThemesSection: chartGradients.sageOriginal,
    pointsSection: chartGradients.sand,
    singletonSection: chartGradients.plum,
    anglesSection: chartGradients.plum,
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
  const [, setOrbPresetLabel] = useState<string>('Normal');
  const [zodiacSystemLabel, setZodiacSystemLabel] = useState<string>('Tropical');
  const [chartOrientation, setChartOrientation] = useState<any>('standard-natal');

  /**
   * loadChart: Primary Synchronization Engine
   * Orchestrates the fetching of user settings and database chart recovery.
   */
  const loadChart = useCallback(async () => {
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
  }, [isPremium]);

  // Re-synchronize ecosystem on screen focus
  useFocusEffect(
    useCallback(() => {
      trackGrowthEvent('analytics_screen_viewed', { screen: 'chart' }).catch(() => {});
      void loadChart();
    }, [loadChart])
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
        } else if (name === 'pholus') {
          addPoint('Pholus', signName, deg, min, house, retrograde, <PholusIcon size={20} color={'#000'} />);
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

    const order: Record<string, number> = { 'North Node': 0, 'South Node': 1, 'Chiron': 2, 'Lilith': 3, 'Vertex': 4, 'Part of Fortune': 5, 'Pholus': 6 };
    return points.sort((a, b) => (order[a.label] ?? 99) - (order[b.label] ?? 99));
  }, [activeChart]);

  // ── Deep Interpretation Hooks ──



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
  const [expandedLifeTheme, setExpandedLifeTheme] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['bigThree', 'coreIdentity', 'chartStory']));

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
      <View style={[styles.container as ViewStyle, styles.center as ViewStyle]}>
        <SkiaDynamicCosmos />
        <SkiaBreathingRing size={100} color="gold" rings={3} />
        <Animated.View
          entering={FadeIn.delay(400).duration(800)}
          style={styles.loadingTextContainer as ViewStyle}
        >
          <Text style={styles.loadingText as TextStyle}>SYNCHRONIZING CELESTIAL BLUEPRINT...</Text>
        </Animated.View>
      </View>
    );
  }

  if (!userChart) {
    return (
      <View style={[styles.container as ViewStyle, styles.center as ViewStyle]}>
        <SkiaDynamicCosmos />
        <MaterialCommunityIcons
          name="moon-waxing-crescent"
          size={64}
          color={PALETTE.titanium}
          style={{ opacity: 0.3, marginBottom: 24 }}
        />
        <Text style={styles.loadingText as TextStyle}>NO GENESIS ARCHIVE FOUND.</Text>
        <Text style={[styles.wheelHint as TextStyle, { paddingHorizontal: 24, marginTop: 12 }]}> 
          Set up your birth profile to unlock chart context, reflective prompts, and personalized trend views across MySky.
        </Text>
        <Pressable
          style={styles.goHomeBtn as ViewStyle}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            router.replace('/(tabs)/home' as Href);
          }}
          accessibilityRole="button"
          accessibilityLabel="Initialize Genesis"
        >
          <VelvetGlassSurface style={styles.initBtnGlass as ViewStyle} intensity={25}>
            <MetallicText style={styles.goHomeText as TextStyle} color={PALETTE.titanium}>
              SET UP BIRTH PROFILE
            </MetallicText>
          </VelvetGlassSurface>
        </Pressable>
      </View>
    );
  }

  const houseCusps = activeChart?.houseCusps ?? [];

  return (
    <View style={styles.container as ViewStyle}>
      <SkiaDynamicCosmos />

      {/* Atmospheric Nebula Depth */}
      <View style={StyleSheet.absoluteFill as ViewStyle} pointerEvents="none">
        <View style={[styles.glowOrb as ViewStyle, { top: -80, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb as ViewStyle, { bottom: 140, left: -100, backgroundColor: 'rgba(212, 175, 55, 0.08)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea as ViewStyle}>
        <ScrollView
          contentContainerStyle={styles.scrollContent as ViewStyle}
          showsVerticalScrollIndicator={false}
        >

          {/* ── 1. Editorial Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  router.replace('/(tabs)/identity' as Href);
                }}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Back to identity"
              >
                <MetallicIcon name="chevron-back" size={20} color={PALETTE.gold} />
                <MetallicText style={styles.backLabel} color={PALETTE.gold}>IDENTITY</MetallicText>
              </Pressable>
              <Pressable
                style={styles.settingsAction}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setShowAstrologyModal(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Chart settings"
              >
                <MetallicIcon name="options-outline" size={20} color={PALETTE.gold} />
              </Pressable>
            </View>

            <View style={styles.titleStack}>
              <Text style={styles.heroTitle} adjustsFontSizeToFit numberOfLines={1}>
                {activeOverlays.length > 0 ? 'Synastry' : 'Cosmic Blueprint'}
              </Text>
              <Text style={styles.heroSubtitle}>
                {activeOverlays.length > 0
                  ? `${(userChart as any).name || 'YOU'} + ${activeOverlays[0].person.name}`.toUpperCase()
                  : `${(userChart as any).name ? `${(userChart as any).name.toUpperCase()} · ` : ''}EVOLUTIONARY PATH`}
              </Text>
            </View>
          </Animated.View>

          {/* ── Birth time warning ── */}
          {displayChart?.warnings?.length ? (
            <View style={styles.warningBox}>
              <MetallicIcon name="alert-circle-outline" size={18} color={PALETTE.gold} />
              <Text style={styles.warningText}>{displayChart.warnings[0]}</Text>
            </View>
          ) : null}

          {/* ── 2. The Floating Wheel ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.wheelSection}>
            {/* Synastry people bar (premium) */}
            {isPremium && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleBar} style={{ marginBottom: 36 }}>
                <Pressable
                  onPress={() => { Haptics.selectionAsync().catch(() => {}); setActiveOverlays([]); }}
                  style={[styles.personChip, activeOverlays.length === 0 && styles.personChipActive]}
                >
                  <Text style={[styles.personChipText, activeOverlays.length === 0 && styles.personChipTextActive]}>YOU</Text>
                </Pressable>
                {people.map((person) => {
                  const isActive = overlayPerson?.id === person.id;
                  return (
                    <Pressable
                      key={person.id}
                      onPress={() => handleSelectOverlay(person)}
                      onLongPress={() => { Vibration.vibrate(50); handleDeletePerson(person); }}
                      style={[styles.personChip, isActive && styles.personChipActive]}
                    >
                      <Text style={[styles.personChipText, isActive && styles.personChipTextActive]} numberOfLines={1}>
                        {person.name.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setShowRelTypePicker(true); }}
                  style={styles.addSynastryBtn}
                >
                  <MetallicIcon name="add" size={20} color={PALETTE.gold} />
                </Pressable>
              </ScrollView>
            )}

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
              <Text style={styles.wheelCaption}>
                {zodiacSystemLabel.toUpperCase()} · {houseSystemLabel.toUpperCase()} HOUSES
              </Text>
            </View>
          </Animated.View>

          {/* ── 3. Your Chart Story ── */}
          <ChartStorySection coreIdentity={coreIdentity} />

          {/* ── 4. Big Three Modules ── */}
          <ChartBigThreeSection
            chart={activeChart!}
            onMoonPress={() => router.push('/astrology-context' as Href)}
          />

          {/* ── Share Big Three ── */}
          {!overlayChart && (
            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  const sun = activeChart?.sun?.sign?.name ?? '';
                  const moon = activeChart?.moon?.sign?.name ?? '';
                  const rising = activeChart?.ascendant?.sign?.name;
                  const risingLine = rising ? `↑  ${rising} Rising` : '';
                  const elementLine = (() => {
                    const el = activeChart?.sunSign?.element;
                    return el ? `Element: ${el}` : '';
                  })();
                  const lines = [
                    '✦  My Cosmic Blueprint',
                    '─────────────────',
                    `☉  ${sun} Sun`,
                    `☽  ${moon} Moon`,
                    risingLine,
                    elementLine,
                    '─────────────────',
                    'Tracked on MySky — self-knowledge, astrology & daily patterns.',
                    'Download: https://apps.apple.com/app/mysky/id6758646585',
                  ].filter(Boolean).join('\n');
                  Share.share({ message: lines }).catch(() => {});
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: 'rgba(212,175,55,0.30)',
                  backgroundColor: pressed ? 'rgba(212,175,55,0.10)' : 'rgba(212,175,55,0.05)',
                })}
                accessibilityRole="button"
                accessibilityLabel="Share your Big Three"
              >
                <Ionicons name="share-outline" size={16} color={PALETTE.gold} />
                <Text style={{ color: PALETTE.gold, fontSize: 13, fontWeight: '600', letterSpacing: 1 }}>
                  SHARE YOUR BIG THREE
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* ── 5. Dignity & Friction ── */}
          {isPremium && <ChartDignitiesSection dignityAnalysis={dignityAnalysis} />}

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
                  <MetallicText style={[styles.tabText, styles.tabTextActive]} color="#E8D6AE">Essentials</MetallicText>
                ) : (
                  <Text style={styles.tabText}>Essentials</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.tabBtn, viewMode === 'complete' && styles.tabBtnActive]}
                onPress={() => {
                  if (!isPremium) { setShowPremiumModal(true); } else { setViewMode('complete'); }
                }}
                accessibilityRole="tab"
                accessibilityLabel="Complete view"
                accessibilityState={{ selected: viewMode === 'complete' }}
              >
                {viewMode === 'complete' ? (
                  <MetallicText style={[styles.tabText, styles.tabTextActive]} color="#E8D6AE">Complete Chart</MetallicText>
                ) : (
                  <Text style={styles.tabText}>Complete Chart</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>

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
                  <MetallicText style={[styles.tabText, styles.tabTextActive]} color="#E8D6AE">
                    {tab === 'planets' ? `Planets (${viewMode === 'essentials' ? Math.min(7, planetRows.length) : planetRows.length})` :
                     tab === 'houses' ? `Houses (${houseCusps.length})` :
                     tab === 'aspects' ? `Aspects (${sortedAspects.length})` :
                     `Patterns (${patternCount})`}
                  </MetallicText>
                ) : (
                  <Text style={styles.tabText}>
                    {tab === 'planets' ? `Planets (${viewMode === 'essentials' ? Math.min(7, planetRows.length) : planetRows.length})` :
                     tab === 'houses' ? `Houses (${houseCusps.length})` :
                     tab === 'aspects' ? `Aspects (${sortedAspects.length})` :
                     `Patterns (${patternCount})`}
                  </Text>
                )}
              </Pressable>
            ))}
          </Animated.View>

          {/* ── Planets Table ── */}
          {activeTab === 'planets' && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ width: '100%' }}>
              <View style={[styles.tableHeader, styles.blueprintTableHeader]}>
                <Text style={[styles.th, styles.planetsTh, { width: 140 }]} numberOfLines={1}>Planet</Text>
                <Text style={[styles.th, styles.planetsTh, { flex: 2 }]} numberOfLines={1}>Sign</Text>
                <Text style={[styles.th, styles.planetsTh, { flex: 1 }]} numberOfLines={1}>Deg</Text>
                <Text style={[styles.th, styles.planetsTh, { flex: 1 }]} numberOfLines={1}>House</Text>
              </View>
              {(viewMode === 'essentials' ? planetRows.slice(0, Math.min(7, planetRows.length)) : planetRows).map((row, idx) => {
                const elColor = ELEMENT_COLORS[row.p.sign.element] || theme.textSecondary;
                const retro = getRetrogradeFlag(row.p as any);
                const planetSymbol = (row.p as any)?.planet?.symbol ?? '•';
                return (
                  <VelvetGlassSurface key={row.label} intensity={45} style={styles.blueprintRowShell}>
                    <LinearGradient
                      colors={idx % 2 === 0 ? chartSurfaceGradients.rowPrimary : chartSurfaceGradients.rowSecondary}
                      style={styles.tableRow}
                    >
                      <View style={[styles.td, styles.blueprintLeadCell, { width: 140 }]}> 
                        <View style={styles.blueprintIconSlot}>
                          <GradientSymbol symbol={planetSymbol} fontSize={planetSymbol.length > 1 ? 13 : 18} w={28} h={24} />
                        </View>
                        <View style={styles.blueprintTextStack}>
                          <Text style={[styles.planetName, MULTI_CHAR_PLANETS.has(row.label) && { fontSize: 11 }]}>{row.label}</Text>
                          {retro && (
                            <View style={styles.retroRow}>
                              <Ionicons name="arrow-undo-outline" size={10} color="#C9AE78" />
                              <MetallicText style={styles.retroLabel} color="#E8D6AE">Retrograde</MetallicText>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={[styles.td, styles.blueprintLeadCell, { flex: 2 }]}> 
                        <View style={styles.blueprintSymbolSlot}>
                          <GradientSymbol symbol={row.p.sign.symbol} fontSize={18} w={24} h={24} />
                        </View>
                        <View style={styles.blueprintTextStack}>
                          <MetallicText color={elColor} style={styles.signName}>{row.p.sign.name}</MetallicText>
                          {viewMode === 'complete' && (
                            <Text style={styles.elementLabel}>{row.p.sign.element} · {row.p.sign.modality}</Text>
                          )}
                        </View>
                      </View>
                      <View style={[styles.td, { flex: 1 }]}>
                        <Text style={[styles.degreeText, styles.planetsDegreeText]}>{row.p.degree}°</Text>
                        <Text style={styles.minuteText}>{String(row.p.minute).padStart(2, '0')}'</Text>
                      </View>
                      <View style={[styles.td, { flex: 1, alignItems: 'center' }]}>
                        <Text style={styles.houseNum}>{row.p.house || '—'}</Text>
                      </View>
                    </LinearGradient>
                  </VelvetGlassSurface>
                );
              })}
              {/* Sensitive Points in planets table (complete, premium) */}
              {viewMode === 'complete' && isPremium && sensitivePoints.length > 0 && (
                <>
                  <View style={styles.pointsDivider}>
                    <Text style={styles.pointsLabel}>Sensitive Points</Text>
                  </View>
                  {sensitivePoints.map((pt, idx) => (
                    <VelvetGlassSurface key={pt.label} intensity={45} style={styles.blueprintRowShell}>
                      <LinearGradient
                        colors={idx % 2 === 0 ? chartSurfaceGradients.rowPrimary : chartSurfaceGradients.rowSecondary}
                        style={styles.tableRow}
                      >
                        <View style={[styles.td, styles.blueprintLeadCell, { width: 140 }]}> 
                          <View style={styles.sensitiveIconBox}>
                            {pt.icon ? <GradientIcon size={18}>{pt.icon as React.ReactElement}</GradientIcon> : null}
                          </View>
                          <View style={styles.blueprintTextStack}>
                            <Text style={styles.planetName}>{pt.label}</Text>
                            {pt.retrograde && (
                              <View style={styles.retroRow}>
                                <Ionicons name="arrow-undo-outline" size={10} color="#C9AE78" />
                                <MetallicText style={styles.retroLabel} color="#E8D6AE">Retrograde</MetallicText>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={[styles.td, styles.blueprintLeadCell, { flex: 2 }]}> 
                          <View style={styles.blueprintSymbolSlot}>
                            <GradientSymbol symbol={pt.signSymbol} fontSize={18} w={24} h={24} />
                          </View>
                          <View style={styles.blueprintTextStack}>
                            <MetallicText color={ELEMENT_COLORS[pt.element] || theme.textSecondary} style={styles.signName}>{pt.sign}</MetallicText>
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
                    </VelvetGlassSurface>
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
                      {activeChart.houseSystem === 'whole-sign' ? 'Whole Sign' :
                       activeChart.houseSystem === 'equal-house' ? 'Equal House' :
                       activeChart.houseSystem.charAt(0).toUpperCase() + activeChart.houseSystem.slice(1)} Houses
                    </Text>
                  )}
                  <View style={[styles.tableHeader, styles.blueprintTableHeader]}>
                    <Text style={[styles.th, styles.housesTh, { flex: 1 }]} numberOfLines={1}>House</Text>
                    <Text style={[styles.th, styles.housesTh, { flex: 2 }]} numberOfLines={1}>Sign</Text>
                    <Text style={[styles.th, styles.housesTh, { flex: 1 }]} numberOfLines={1}>Deg</Text>
                    <Text style={[styles.th, styles.housesTh, { flex: 3 }]} numberOfLines={1}>Theme</Text>
                  </View>
                  {houseCusps.map((cusp: HouseCuspType, idx: number) => {
                    const houseInfo = HOUSE_MEANINGS[cusp.house as keyof typeof HOUSE_MEANINGS];
                    const elColor = ELEMENT_COLORS[cusp.sign.element] || theme.textSecondary;
                    const simpleH = (activeChart as any)?.houses?.[idx];
                    const deg = simpleH ? Math.floor(simpleH.degree) : Math.floor(cusp.longitude % 30);
                    const min = simpleH ? Math.round((simpleH.degree % 1) * 60) : Math.floor((cusp.longitude % 1) * 60);
                    const isWholeSign = activeChart?.houseSystem === 'whole-sign';
                    const isAngular = [1, 4, 7, 10].includes(cusp.house);
                    return (
                      <VelvetGlassSurface key={cusp.house} intensity={45} style={[styles.houseRowContainer, isAngular && styles.angularHighlight]}>
                        <LinearGradient
                          colors={idx % 2 === 0 ? chartSurfaceGradients.rowPrimary : chartSurfaceGradients.rowSecondary}
                          style={styles.tableRow}
                        >
                          <View style={[styles.td, { flex: 1, alignItems: 'center' }]}> 
                            <View style={styles.houseBadge}><Text style={styles.houseNumText}>{cusp.house}</Text></View>
                          </View>
                          <View style={[styles.td, styles.blueprintLeadCell, { flex: 2 }]}> 
                            <View style={styles.blueprintSymbolSlot}>
                              <GradientSymbol symbol={cusp.sign.symbol} fontSize={18} w={24} h={24} />
                            </View>
                            <View style={styles.blueprintTextStack}>
                              <MetallicText color={elColor} style={styles.signName}>{cusp.sign.name}</MetallicText>
                            </View>
                          </View>
                          <View style={[styles.td, { flex: 1 }]}> 
                            <Text style={[styles.degreeText, styles.housesDegreeText]}>{isWholeSign ? '0°' : `${deg}°${String(min).padStart(2, '0')}'`}</Text>
                          </View>
                          <View style={[styles.td, { flex: 3 }]}> 
                            <Text style={styles.houseTheme}>{houseInfo?.theme || ''}</Text>
                            {planetsByHouse.get(cusp.house)?.length ? (
                              <View style={styles.occupantCloud}>
                                {planetsByHouse.get(cusp.house)!.map((planet) => (
                                  <View key={`${cusp.house}-${planet}`} style={styles.occupantPill}>
                                    <Text style={styles.occupantPillText}>{planet}</Text>
                                  </View>
                                ))}
                              </View>
                            ) : null}
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
                  <View style={[styles.tableHeader, styles.blueprintTableHeader]}>
                    <Text style={[styles.th, { flex: 2 }]}>Planet 1</Text>
                    <Text style={[styles.th, { flex: 2 }]}>Aspect</Text>
                    <Text style={[styles.th, { flex: 2 }]}>Planet 2</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Orb</Text>
                  </View>
                  {sortedAspects.map((asp: Aspect, idx: number) => {
                    const natureColor = ASPECT_NATURE_COLORS[asp.type.nature] || theme.textSecondary;
                    const renderPlanetIcon = (planet: { name: string; symbol: string }) => {
                      if (planet.name === 'Chiron') return <View style={styles.aspectIconWrap}><GradientIcon size={18}><ChironIcon size={18} color={'#000'} /></GradientIcon></View>;
                      if (planet.name === 'North Node') return <View style={styles.aspectIconWrap}><GradientIcon size={18}><NorthNodeIcon size={18} color={'#000'} /></GradientIcon></View>;
                      if (planet.name === 'South Node') return <View style={styles.aspectIconWrap}><GradientIcon size={18}><SouthNodeIcon size={18} color={'#000'} /></GradientIcon></View>;
                      if (MULTI_CHAR_PLANETS.has(planet.name)) return <GradientSymbol symbol={planet.symbol} fontSize={11} w={24} h={24} />;
                      return <GradientSymbol symbol={planet.symbol} fontSize={18} w={24} h={24} />;
                    };
                    return (
                      <React.Fragment key={`${asp.planet1.name}-${asp.type.name}-${asp.planet2.name}-${idx}`}>
                        <VelvetGlassSurface intensity={45} style={styles.blueprintRowShell}>
                          <LinearGradient
                            colors={idx % 2 === 0 ? chartSurfaceGradients.rowPrimary : chartSurfaceGradients.rowSecondary}
                            style={styles.tableRow}
                          >
                            <View style={[styles.td, styles.blueprintLeadCell, { flex: 2 }]}> 
                              <View style={styles.aspectIconWrap}>{renderPlanetIcon(asp.planet1)}</View>
                              <View style={styles.blueprintTextStack}>
                                <Text style={[styles.aspectPlanetName, MULTI_CHAR_PLANETS.has(asp.planet1.name) && { fontSize: 10 }]}>{asp.planet1.name}</Text>
                              </View>
                            </View>
                            <View style={[styles.td, { flex: 2, alignItems: 'center' }]}> 
                              <GradientSymbol symbol={SAFE_ASPECT_SYMBOLS[asp.type.name] ?? asp.type.symbol} fontSize={18} w={24} h={24} gradient={asp.type.nature === 'Challenging' ? RED_GRAD_PROPS : undefined} />
                              <MetallicText color={natureColor} style={styles.aspectName}>{asp.type.name}</MetallicText>
                              <Text style={[styles.aspectNature, { color: natureColor }]}>{asp.type.nature}</Text>
                            </View>
                            <View style={[styles.td, styles.blueprintLeadCell, { flex: 2 }]}> 
                              <View style={styles.aspectIconWrap}>{renderPlanetIcon(asp.planet2)}</View>
                              <View style={styles.blueprintTextStack}>
                                <Text style={[styles.aspectPlanetName, MULTI_CHAR_PLANETS.has(asp.planet2.name) && { fontSize: 10 }]}>{asp.planet2.name}</Text>
                              </View>
                            </View>
                            <View style={[styles.td, { flex: 1, alignItems: 'center' }]}> 
                              {asp.orb < 2 ? (
                                <MetallicText color="#608A8D" style={styles.orbText}>{asp.orb.toFixed(1)}°</MetallicText>
                              ) : (
                                <Text style={[styles.orbText, { color: asp.orb < 5 ? theme.primary : theme.textSecondary }]}>{asp.orb.toFixed(1)}°</Text>
                              )}
                              {asp.isApplying && <Text style={styles.applyingLabel}>applying</Text>}
                            </View>
                          </LinearGradient>
                          {isPremium && <Text style={styles.aspectInterp}>{getAspectInterpretation(asp)}</Text>}
                        </VelvetGlassSurface>
                      </React.Fragment>
                    );
                  })}
                  <VelvetGlassSurface style={styles.legend} intensity={45}>
                    <LinearGradient colors={chartSurfaceGradients.storySection} style={StyleSheet.absoluteFill} />
                    <Text style={styles.legendTitle}>Aspect Legend</Text>
                    <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: '#608A8D' }]} /><Text style={styles.legendText}>Harmonious (trines, sextiles)</Text></View>
                    <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: '#E07A7A' }]} /><Text style={styles.legendText}>Challenging (squares, oppositions)</Text></View>
                    <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: theme.isDark ? '#FFFFFF' : theme.textPrimary }]} /><Text style={styles.legendText}>Neutral (conjunctions)</Text></View>
                    <Text style={styles.legendNote}>Tighter orbs (lower numbers) = stronger influence</Text>
                  </VelvetGlassSurface>
                  {!isPremium && hiddenAspectCount > 0 && (
                    <Pressable onPress={() => router.push('/(tabs)/premium' as Href)} accessibilityRole="button" accessibilityLabel="Unlock more aspects">
                      <LinearGradient colors={chartSurfaceGradients.panel} style={styles.aspectUpsell}>
                        <MetallicIcon name="sparkles-outline" size={16} color={PALETTE.gold} />
                        <MetallicText style={styles.aspectUpsellText} color="#E8D6AE">{hiddenAspectCount} more subtle aspect{hiddenAspectCount > 1 ? 's' : ''} — sextiles, quincunxes, and more</MetallicText>
                        <MetallicIcon name="chevron-forward-outline" size={16} color={PALETTE.gold} />
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
              {isPremium && chartPatterns.chartRuler && (
                <VelvetGlassSurface style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.goldPanelStrong} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="ribbon-outline" size={20} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>Chart Ruler</Text></View>
                  <View style={styles.patternHighlight}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <GradientSymbol symbol={chartPatterns.chartRuler.planetSymbol} fontSize={15} w={18} h={17} />
                      <MetallicText style={styles.patternHighlightText} color="#E8D6AE"> {chartPatterns.chartRuler.planet} in </MetallicText>
                      <GradientSymbol symbol={chartPatterns.chartRuler.rulerSignSymbol} fontSize={15} w={18} h={17} />
                      <MetallicText style={styles.patternHighlightText} color="#C9AE78"> {chartPatterns.chartRuler.rulerSign} · House {chartPatterns.chartRuler.rulerHouse}</MetallicText>
                    </View>
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.chartRuler.description}</Text>
                  <View style={styles.tooltipBox}>
                    <MetallicIcon name="information-circle-outline" size={14} color={PALETTE.gold} />
                    <Text style={styles.tooltipText}>Your chart ruler is the planet that rules your rising sign (<Text style={{ fontFamily: ZODIAC_FAMILY, color: theme.isDark ? '#FFFFFF' : theme.textPrimary }}>{chartPatterns.chartRuler.risingSymbol}</Text> {chartPatterns.chartRuler.risingSign}). Its placement colors your entire life path.</Text>
                  </View>
                </VelvetGlassSurface>
              )}
              {isPremium && partOfFortune && (
                <VelvetGlassSurface style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.panel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="sunny-outline" size={20} color={PALETTE.gold} style={{ marginRight: 10 }} /><Text style={styles.patternTitle}>Point of Flow</Text></View>
                  <View style={styles.patternHighlight}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <GradientSymbol symbol={partOfFortune.sign?.symbol ?? ''} fontSize={15} w={18} h={17} />
                      <MetallicText style={styles.patternHighlightText} color="#E8D6AE"> {partOfFortune.sign?.name} · {Math.floor(partOfFortune.degree)}°{partOfFortune.house ? ` · House ${partOfFortune.house}` : ''}</MetallicText>
                    </View>
                  </View>
                  <Text style={styles.patternDesc}>This point reflects where you tend to find ease, natural resilience, and a felt sense of alignment. Its sign and house shape how this feels in daily life.</Text>
                  <View style={styles.tooltipBox}><MetallicIcon name="information-circle-outline" size={14} color={PALETTE.gold} /><Text style={styles.tooltipText}>Calculated from your Sun, Moon, and Ascendant. A reflective archetype — not a prediction.</Text></View>
                </VelvetGlassSurface>
              )}
              {isPremium && dominantPlacement && chartPatterns && (
                <VelvetGlassSurface style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.panel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="star-outline" size={20} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>Dominant Planet</Text></View>
                  <View style={styles.patternHighlight}>
                    <MetallicText style={styles.patternHighlightText} color="#E8D6AE">
                      {safeString((dominantPlacement as any).planet)} in {(dominantPlacement as any).sign?.name ?? safeString((dominantPlacement as any).sign)} · {Math.floor((dominantPlacement as any).degree ?? 0)}°{(dominantPlacement as any).house ? ` · House ${(dominantPlacement as any).house}` : ''}
                    </MetallicText>
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.dominantFactors.descriptions.planet}</Text>
                  <View style={styles.tooltipBox}><MetallicIcon name="information-circle-outline" size={14} color={PALETTE.gold} /><Text style={styles.tooltipText}>Scored by aspect count, tight aspects (under 2°), and angular house placement.</Text></View>
                </VelvetGlassSurface>
              )}
              {!isPremium && (
                <Pressable onPress={() => router.push('/(tabs)/premium' as Href)} accessibilityRole="button" accessibilityLabel="Unlock pattern depth">
                  <LinearGradient colors={chartSurfaceGradients.panel} style={[styles.patternCard, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MetallicIcon name="lock-closed-outline" size={16} color={PALETTE.gold} />
                      <View style={{ flex: 1 }}>
                        <MetallicText style={{ fontSize: 14, fontWeight: '600' }} color="#E8D6AE">More patterns in your chart</MetallicText>
                        <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 3, lineHeight: 18 }}>Chart ruler, dominant planet, sensitive points, stelliums, retrogrades, and Point of Flow</Text>
                      </View>
                      <MetallicIcon name="arrow-forward-outline" size={16} color={PALETTE.gold} />
                    </View>
                  </LinearGradient>
                </Pressable>
              )}
              {isPremium && chartPatterns.stelliums.map((stellium, idx) => (
                <VelvetGlassSurface key={`stellium-${idx}`} style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.goldPanel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="flash-outline" size={16} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>{stellium.cardTitle}</Text></View>
                  <View style={styles.patternHighlight}><MetallicText style={styles.patternHighlightText} color="#E8D6AE">{stellium.planets.join(', ')}</MetallicText></View>
                  <Text style={styles.patternDesc}>{stellium.subtitle}</Text>
                  <Text style={[styles.patternDesc, { marginTop: 8 }]}>{stellium.description}</Text>
                  {stellium.narrative ? <Text style={[styles.patternDesc, { marginTop: 10, lineHeight: 22 }]}>{stellium.narrative}</Text> : null}
                  {stellium.planetMixNote && <Text style={[styles.patternDesc, { marginTop: 6, opacity: 0.8 }]}>{stellium.planetMixNote}</Text>}
                  {stellium.retroNote && <Text style={[styles.patternDesc, { marginTop: 6, opacity: 0.8 }]}>{stellium.retroNote}</Text>}
                  {stellium.elementCloser && <View style={styles.tooltipBox}><MetallicIcon name="leaf-outline" size={14} color={PALETTE.gold} /><Text style={styles.tooltipText}>{stellium.elementCloser}</Text></View>}
                </VelvetGlassSurface>
              ))}
              {isPremium && chartPatterns.conjunctionClusters.map((cluster, idx) => (
                <VelvetGlassSurface key={`cluster-${idx}`} style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.panel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="link-outline" size={20} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>Conjunction Cluster</Text></View>
                  <View style={styles.patternHighlight}><MetallicText style={styles.patternHighlightText} color="#E8D6AE">{cluster.planets.join(' · ')}</MetallicText></View>
                  <Text style={styles.patternDesc}>{cluster.description}</Text>
                  <View style={styles.tooltipBox}><MetallicIcon name="information-circle-outline" size={14} color={PALETTE.gold} /><Text style={styles.tooltipText}>Tightest orb: {cluster.tightestOrb.toFixed(1)}° — these planets blend their energies closely.</Text></View>
                </VelvetGlassSurface>
              ))}
              {isPremium && chartPatterns.retrogradeEmphasis.count >= 3 && (
                <VelvetGlassSurface style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.panel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="arrow-undo-outline" size={20} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>Retrograde Emphasis</Text></View>
                  <View style={styles.patternHighlight}><MetallicText style={styles.patternHighlightText} color="#E8D6AE">{chartPatterns.retrogradeEmphasis.count} planets retrograde: {chartPatterns.retrogradeEmphasis.planets.join(', ')}</MetallicText></View>
                  <Text style={styles.patternDesc}>{chartPatterns.retrogradeEmphasis.description}</Text>
                </VelvetGlassSurface>
              )}
              {chartPatterns.elementBalance && (
                <VelvetGlassSurface style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.panel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="flame-outline" size={20} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>Element Balance</Text></View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }]}>
                    {Object.entries(chartPatterns.elementBalance.counts).map(([el, count]) => {
                      const isDominant = el === chartPatterns.elementBalance.dominant;
                      const elColor = ELEMENT_COLORS[el] || theme.primary;
                      return isDominant ? (
                        <MetallicText key={el} style={[styles.patternHighlightText, { fontSize: 15 }]} color={theme.isDark ? elColor : '#1A1815'}>{el}: {count as number}</MetallicText>
                      ) : (
                        <Text key={el} style={[styles.patternHighlightText, { color: theme.textMuted, fontSize: 13 }]}>{el}: {count as number}</Text>
                      );
                    })}
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.elementBalance.description}</Text>
                  {chartPatterns.elementBalance.missing && <View style={styles.tooltipBox}><MetallicIcon name="water-outline" size={14} color={PALETTE.gold} /><Text style={styles.tooltipText}>No planets in {chartPatterns.elementBalance.missing} — this element's themes may require more conscious effort.</Text></View>}
                </VelvetGlassSurface>
              )}
              {chartPatterns.modalityBalance && (
                <VelvetGlassSurface style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.panel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="options-outline" size={20} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>Modality Balance</Text></View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 16, justifyContent: 'center' }]}>
                    {Object.entries(chartPatterns.modalityBalance.counts).map(([mod, count]) => {
                      const isDominant = mod === chartPatterns.modalityBalance.dominant;
                      return isDominant ? (
                        <MetallicText key={mod} style={[styles.patternHighlightText, { fontSize: 15 }]} color={theme.isDark ? '#E8D6AE' : '#1A1815'}>{mod}: {count as number}</MetallicText>
                      ) : (
                        <Text key={mod} style={[styles.patternHighlightText, { color: theme.textMuted, fontSize: 13 }]}>{mod}: {count as number}</Text>
                      );
                    })}
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.modalityBalance.description}</Text>
                </VelvetGlassSurface>
              )}
              {chartPatterns.polarityBalance && (
                <VelvetGlassSurface style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.panel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="git-compare-outline" size={20} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>Polarity Balance</Text></View>
                  <View style={[styles.patternHighlight, { flexDirection: 'row', gap: 24, justifyContent: 'center' }]}>
                    {[{ label: 'Masculine', count: chartPatterns.polarityBalance.masculine }, { label: 'Feminine', count: chartPatterns.polarityBalance.feminine }].map(({ label, count }) => {
                      const isDominant = label === chartPatterns.polarityBalance.dominant;
                      return isDominant ? (
                        <MetallicText key={label} style={[styles.patternHighlightText, { fontSize: 15 }]} color={theme.isDark ? '#E8D6AE' : '#1A1815'}>{label}: {count}</MetallicText>
                      ) : (
                        <Text key={label} style={[styles.patternHighlightText, { color: theme.textMuted, fontSize: 13 }]}>{label}: {count}</Text>
                      );
                    })}
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.polarityBalance.description}</Text>
                  <View style={styles.tooltipBox}><MetallicIcon name="information-circle-outline" size={14} color={PALETTE.gold} /><Text style={styles.tooltipText}>Masculine = Fire + Air signs. Feminine = Earth + Water signs. Based on your 10 core planets.</Text></View>
                </VelvetGlassSurface>
              )}
              {isPremium && extendedPatterns?.aspectPatterns?.map((pattern, idx) => (
                <VelvetGlassSurface key={`aspat-${idx}`} style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.goldPanel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternIcon}>{pattern.name === 'Grand Trine' ? '△' : pattern.name === 'T-Square' ? '⊤' : pattern.name === 'Grand Cross' ? '✚' : pattern.name === 'Yod' ? '☞' : pattern.name === 'Kite' ? '◇' : pattern.name === 'Mystic Rectangle' ? '▭' : '⬡'}</Text>
                    <Text style={styles.patternTitle}>{pattern.name}</Text>
                  </View>
                  <View style={styles.patternHighlight}><MetallicText style={styles.patternHighlightText} color="#E8D6AE">{pattern.planets.join(' · ')}</MetallicText></View>
                  <Text style={styles.patternDesc}>{pattern.description}</Text>
                </VelvetGlassSurface>
              ))}
              {isPremium && extendedPatterns?.hemisphereEmphasis && extendedPatterns.hemisphereEmphasis.dominant !== 'Balanced' && (
                <VelvetGlassSurface style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.panel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="contrast-outline" size={20} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>Hemisphere Emphasis</Text></View>
                  <View style={styles.patternHighlight}><MetallicText style={styles.patternHighlightText} color="#E8D6AE">{extendedPatterns.hemisphereEmphasis.dominant} emphasis</MetallicText></View>
                  <Text style={styles.patternDesc}>{extendedPatterns.hemisphereEmphasis.description}</Text>
                </VelvetGlassSurface>
              )}
              {isPremium && extendedPatterns?.houseEmphasis && (
                <VelvetGlassSurface style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.panel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="home-outline" size={20} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>House Emphasis</Text></View>
                  <View style={styles.patternHighlight}><MetallicText style={styles.patternHighlightText} color="#E8D6AE">{extendedPatterns.houseEmphasis.dominant} houses dominant</MetallicText></View>
                  <Text style={styles.patternDesc}>{extendedPatterns.houseEmphasis.description}</Text>
                </VelvetGlassSurface>
              )}
            </Animated.View>
          )}

          {/* ── Themed Interpretation Sections (premium, Complete only) ── */}
          {viewMode === 'complete' && isPremium && themedSections.length > 0 && (
            <Animated.View entering={FadeInDown.delay(350).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="Your Chart Story" subtitle="Thematic interpretations woven from your placements" sectionKey="chartStory" openSections={openSections} setOpenSections={setOpenSections}>
                {themedSections.map((section) => (
                  <Pressable key={section.id} onPress={() => setExpandedSection(expandedSection === section.id ? null : section.id)} accessibilityRole="button" accessibilityLabel={`${section.title} interpretation section`}>
                    <VelvetGlassSurface style={styles.themedCard} intensity={45}>
                    <LinearGradient colors={chartSurfaceGradients.goldPanelFaint} style={StyleSheet.absoluteFill} />
                      <View style={styles.themedCardHeaderRow}>
                        <GradientSymbol symbol={section.icon} fontSize={20} w={24} h={24} style={{ marginRight: 4 }} />
                        <Text style={styles.themedCardTitle}>{section.title}</Text>
                        <MetallicIcon name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'} size={18} color={PALETTE.gold} />
                      </View>
                      <View style={styles.themedCardPlacements}>
                        {section.placements.map((p, pi) => <View key={pi} style={styles.themedPlacementChip}><Text style={styles.themedPlacementText}>{p}</Text></View>)}
                      </View>
                      <Text style={styles.themedCardSummary}>{section.summary}</Text>
                      {expandedSection === section.id && section.details.length > 0 && (
                        <View style={styles.themedCardDetails}>
                          {section.details.map((detail, di) => <Text key={di} style={styles.themedCardDetail}>• {detail}</Text>)}
                        </View>
                      )}
                    </VelvetGlassSurface>
                  </Pressable>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Key Aspects Summary (Complete only) ── */}
          {viewMode === 'complete' && keyAspects.length > 0 && (
            <Animated.View entering={FadeInDown.delay(360).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="Strongest Aspects" subtitle="Your most important planetary connections" sectionKey="keyAspects" openSections={openSections} setOpenSections={setOpenSections}>
                {keyAspects.slice(0, 10).map((ka, idx) => (
                  <VelvetGlassSurface key={`ka-${idx}`} style={styles.strongAspectCard} intensity={45}>
                    <LinearGradient
                      colors={
                        ka.nature === 'Harmonious'
                          ? chartSurfaceGradients.aspectsSectionHarmonious
                          : ka.nature === 'Challenging'
                            ? chartSurfaceGradients.aspectsSectionChallenging
                            : ka.nature === 'Neutral'
                              ? chartSurfaceGradients.aspectsSectionNeutral
                              : chartSurfaceGradients.aspectsSectionFallback
                      }
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.strongAspectHeader}>
                        <Text style={styles.strongAspectTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{ka.planet1} {ka.type.toLowerCase()} {ka.planet2}</Text>
                        <Text style={[styles.strongAspectMeta, { color: ka.nature === 'Harmonious' ? '#608A8D' : ka.nature === 'Challenging' ? '#A88BEB' : ka.nature === 'Neutral' ? '#A49E97' : '#E8D6AE' }]}>{ka.orb.toFixed(1)}° · {ka.nature}</Text>
                    </View>
                    {isPremium && <Text style={styles.strongAspectDescription}>{ka.interpretation}</Text>}
                  </VelvetGlassSurface>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Angle Interpretations ── */}
          {viewMode === 'complete' && angleInterpretations.length > 0 && (
            <Animated.View entering={FadeInDown.delay(370).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="Angles & Axes" subtitle="The four cardinal points of your chart" sectionKey="anglesAxes" openSections={openSections} setOpenSections={setOpenSections}>
                {angleInterpretations.map((ai) => (
                  <VelvetGlassSurface key={ai.name} style={styles.themedCard} intensity={45}>
                  <LinearGradient colors={chartSurfaceGradients.anglesSection} style={StyleSheet.absoluteFill} />
                    <View style={styles.themedCardHeaderRow}>
                      <Text style={[styles.themedCardTitle, styles.angleCardTitle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{ai.name}</Text>
                      <MetallicText style={{ fontSize: 13, fontWeight: '600' }} color="#E8D6AE">{ai.sign} · {ai.degree}°</MetallicText>
                    </View>
                    <Text style={styles.themedCardSummary}>{ai.interpretation}</Text>
                  </VelvetGlassSurface>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Sensitive Point Interpretations ── */}
          {viewMode === 'complete' && isPremium && pointInterpretations.length > 0 && (
            <Animated.View entering={FadeInDown.delay(375).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="Chart Points" subtitle="Nodes, Chiron, Lilith, Part of Fortune & Vertex" sectionKey="chartPoints" openSections={openSections} setOpenSections={setOpenSections}>
                {pointInterpretations.map((pi) => (
                  <VelvetGlassSurface key={pi.name} style={styles.themedCard} intensity={45}>
                  <LinearGradient colors={chartSurfaceGradients.pointsSection} style={StyleSheet.absoluteFill} />
                    <View style={styles.themedCardHeaderRow}>
                      <Text style={styles.themedCardTitle}>{pi.name}</Text>
                      <MetallicText style={{ fontSize: 13, fontWeight: '600' }} color="#E8D6AE">{pi.sign}{pi.house ? ` · House ${pi.house}` : ''}</MetallicText>
                    </View>
                    <Text style={styles.themedCardSummary}>{pi.interpretation}</Text>
                  </VelvetGlassSurface>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Chart Shape ── */}
          {viewMode === 'complete' && isPremium && chartShape && chartShape.shape !== 'Unknown' && (
            <Animated.View entering={FadeInDown.delay(380).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="Chart Shape" subtitle={chartShape.shape} sectionKey="chartShape" openSections={openSections} setOpenSections={setOpenSections}>
                <VelvetGlassSurface style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.goldPanel} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="ellipse-outline" size={20} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>Chart Shape: {chartShape.shape}</Text></View>
                  {chartShape.handlePlanet && <View style={styles.patternHighlight}><MetallicText style={styles.patternHighlightText} color="#E8D6AE">Handle: {chartShape.handlePlanet}</MetallicText></View>}
                  <Text style={styles.patternDesc}>{chartShape.description}</Text>
                </VelvetGlassSurface>
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Singletons ── */}
          {viewMode === 'complete' && isPremium && singletons.length > 0 && (
            <Animated.View entering={FadeInDown.delay(385).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="Singleton Planets" subtitle="Planets isolated in their hemisphere or element" sectionKey="singletons" openSections={openSections} setOpenSections={setOpenSections}>
                {singletons.map((s, idx) => (
                  <VelvetGlassSurface key={`singleton-${idx}`} style={styles.themedCard} intensity={45}>
                  <LinearGradient colors={chartSurfaceGradients.singletonSection} style={StyleSheet.absoluteFill} />
                    <View style={styles.themedCardHeaderRow}>
                      <Text style={styles.themedCardTitle}>{s.planet}</Text>
                      <View style={styles.themedPlacementChip}><Text style={styles.themedPlacementText}>{s.detail}</Text></View>
                    </View>
                    <Text style={styles.themedCardSummary}>{s.description}</Text>
                  </VelvetGlassSurface>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Interceptions ── */}
          {viewMode === 'complete' && isPremium && interceptions.length > 0 && (
            <Animated.View entering={FadeInDown.delay(388).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="Interceptions" subtitle="Signs contained within a house without a cusp" sectionKey="interceptions" openSections={openSections} setOpenSections={setOpenSections}>
                {interceptions.map((ic, idx) => (
                  <VelvetGlassSurface key={`intercept-${idx}`} style={styles.themedCard} intensity={45}>
                  <LinearGradient colors={chartSurfaceGradients.panel} style={StyleSheet.absoluteFill} />
                    <View style={styles.themedCardHeaderRow}>
                      <Text style={styles.themedCardTitle}>{ic.interceptedSigns[0]} / {ic.interceptedSigns[1]}</Text>
                      <Text style={{ fontSize: 12, color: theme.textMuted }}>Houses {ic.houses[0]} & {ic.houses[1]}</Text>
                    </View>
                    <Text style={styles.themedCardSummary}>{ic.description}</Text>
                  </VelvetGlassSurface>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Planet Dignity (Complete only) ── */}
          {viewMode === 'complete' && isPremium && dignityAnalysis && (
            <Animated.View entering={FadeInDown.delay(390).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="Planet Strength & Dignity" subtitle="Which parts of your chart are strong, comfortable, or challenged" sectionKey="planetDignity" openSections={openSections} setOpenSections={setOpenSections}>
                <Text style={styles.dignitySummary}>{dignityAnalysis.summary}</Text>
                {dignityAnalysis.strongestPlanets.length > 0 && (
                  <View style={styles.dignityChipGroup}>
                    {dignityAnalysis.strongestPlanets.map(d => <View key={d.planet} style={[styles.themedPlacementChip, { borderColor: 'rgba(96,138,141,0.35)' }]}><Text style={[styles.themedPlacementText, { color: '#608A8D' }]}>{d.planet}: {d.dignity}</Text></View>)}
                  </View>
                )}
                {dignityAnalysis.challengedPlanets.length > 0 && (
                  <View style={styles.dignityChipGroup}>
                    {dignityAnalysis.challengedPlanets.map(d => <View key={d.planet} style={[styles.themedPlacementChip, { borderColor: 'rgba(153,31,166,0.3)' }]}><Text style={[styles.themedPlacementText, { color: '#991FA6' }]}>{d.planet}: {d.dignity}</Text></View>)}
                  </View>
                )}
                {dignityAnalysis.planetDignities.filter(d => d.dignity !== 'peregrine').map(d => (
                  <Pressable key={d.planet} onPress={() => setExpandedPlanet(expandedPlanet === d.planet ? null : d.planet)} accessibilityRole="button" accessibilityLabel={`${d.planet} dignity details`}>
                    <VelvetGlassSurface style={styles.dignityCard} intensity={45}>
                      <LinearGradient colors={chartSurfaceGradients.dignitySection} style={StyleSheet.absoluteFill} />
                      <View style={styles.dignityCardHeader}>
                        <Text style={styles.dignityPlanetName}>{d.planet}</Text>
                        <Text style={[styles.dignityMeta, { color: d.dignity === 'domicile' || d.dignity === 'exaltation' ? '#608A8D' : '#A88BEB' }]}> 
                          {d.dignity.charAt(0).toUpperCase() + d.dignity.slice(1)} in {d.sign}
                        </Text>
                        <MetallicIcon name={expandedPlanet === d.planet ? 'chevron-up' : 'chevron-down'} size={14} color={PALETTE.gold} />
                      </View>
                      {expandedPlanet === d.planet && <Text style={styles.dignityDescription}>{d.description}</Text>}
                    </VelvetGlassSurface>
                  </Pressable>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Dispositor Chain ── */}
          {viewMode === 'complete' && isPremium && dispositorChain && (
            <Animated.View entering={FadeInDown.delay(395).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="Rulership & Dispositors" subtitle={dispositorChain.finalDispositor ? `Final dispositor: ${dispositorChain.finalDispositor}` : 'Planetary rulership chain'} sectionKey="dispositors" openSections={openSections} setOpenSections={setOpenSections}>
                <VelvetGlassSurface style={styles.patternCard} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.goldPanelSoft} style={StyleSheet.absoluteFill} />
                  <View style={styles.patternHeader}><MetallicIcon name="git-network-outline" size={20} color={PALETTE.gold} style={styles.patternIcon as ViewStyle} /><Text style={styles.patternTitle}>Rulership & Dispositors</Text></View>
                  {dispositorChain.finalDispositor && <View style={styles.patternHighlight}><MetallicText style={styles.patternHighlightText} color="#E8D6AE">Final Dispositor: {dispositorChain.finalDispositor}</MetallicText></View>}
                  {dispositorChain.mutualReceptions.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                      {dispositorChain.mutualReceptions.map(([a, b], idx) => <View key={idx} style={styles.themedPlacementChip}><Text style={styles.themedPlacementText}>Mutual Reception: {a} ↔ {b}</Text></View>)}
                    </View>
                  )}
                  <Text style={styles.patternDesc}>{dispositorChain.description}</Text>
                  <View style={styles.tooltipBox}><MetallicIcon name="information-circle-outline" size={14} color={PALETTE.gold} /><Text style={styles.tooltipText}>Each planet answers to the ruler of its sign. The dispositor chain shows this hierarchy — the final dispositor (if present) is the planet that ultimately directs the chart.</Text></View>
                </VelvetGlassSurface>
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Planet Deep Dive ── */}
          {viewMode === 'complete' && isPremium && planetDeepDives.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="Planet-by-Planet Deep Dive" subtitle="Each planet as a mini-profile in your chart" sectionKey="planetDeepDive" openSections={openSections} setOpenSections={setOpenSections}>
                {planetDeepDives.map((dd) => (
                  <Pressable key={dd.planet} onPress={() => setExpandedPlanet(expandedPlanet === `dd-${dd.planet}` ? null : `dd-${dd.planet}`)} accessibilityRole="button" accessibilityLabel={`${dd.planet} deep dive`}>
                    <VelvetGlassSurface style={styles.themedCard} intensity={45}>
                    <LinearGradient colors={chartSurfaceGradients.planetSection} style={StyleSheet.absoluteFill} />
                      <View style={[styles.themedCardHeaderRow, styles.planetDiveHeaderRow]}>
                        <Text style={[styles.themedCardTitle, styles.planetDiveTitle]} numberOfLines={1}>{dd.planet}</Text>
                        <View style={styles.planetDiveChipRow}>
                          <View style={styles.themedPlacementChip}><Text style={[styles.themedPlacementText, { fontSize: 8 }]} numberOfLines={1}>{dd.sign}</Text></View>
                          {dd.house > 0 && <View style={styles.themedPlacementChip}><Text style={[styles.themedPlacementText, { fontSize: 8 }]} numberOfLines={1}>House {dd.house}</Text></View>}
                          {dd.isRetrograde && <View style={[styles.themedPlacementChip, { borderColor: 'rgba(232, 214, 174, 0.3)' }]}><Text style={[styles.themedPlacementText, { color: theme.isDark ? '#FFFFFF' : theme.textPrimary, fontSize: 8 }]}>℞</Text></View>}
                          {dd.dignity.dignity !== 'peregrine' && <View style={[styles.themedPlacementChip, { borderColor: dd.dignity.dignity === 'domicile' || dd.dignity.dignity === 'exaltation' ? 'rgba(96,138,141,0.35)' : 'rgba(168,139,235,0.35)' }]}><Text style={[styles.themedPlacementText, { color: dd.dignity.dignity === 'domicile' || dd.dignity.dignity === 'exaltation' ? '#608A8D' : '#A88BEB', fontSize: 8 }]} numberOfLines={1}>{dd.dignity.dignity}</Text></View>}
                        </View>
                        <MetallicIcon name={expandedPlanet === `dd-${dd.planet}` ? 'chevron-up' : 'chevron-down'} size={16} color={PALETTE.gold} />
                      </View>
                      <Text
                        style={[styles.themedCardSummary, styles.planetDiveSummary]}
                        numberOfLines={expandedPlanet === `dd-${dd.planet}` ? undefined : 2}
                      >
                        {dd.synthesis}
                      </Text>
                      {expandedPlanet === `dd-${dd.planet}` && dd.aspects.length > 0 && (
                        <View style={[styles.themedCardDetails, styles.planetDiveDetails]}>
                          {dd.aspects.map((asp, ai) => <Text key={ai} style={[styles.themedCardDetail, styles.planetDiveDetail]}>• {asp}</Text>)}
                        </View>
                      )}
                    </VelvetGlassSurface>
                  </Pressable>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── House Deep Dive ── */}
          {viewMode === 'complete' && isPremium && houseDeepDives.length > 0 && (
            <Animated.View entering={FadeInDown.delay(410).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="House-by-House Interpretation" subtitle="12 areas of life, each with cusp sign, ruler, and occupants" sectionKey="houseDeepDive" openSections={openSections} setOpenSections={setOpenSections}>
                {houseDeepDives.map((hd) => (
                  <Pressable key={hd.house} onPress={() => setExpandedHouse(expandedHouse === hd.house ? null : hd.house)} accessibilityRole="button" accessibilityLabel={`House ${hd.house} interpretation`}>
                    <VelvetGlassSurface style={styles.themedCard} intensity={45}>
                    <LinearGradient colors={chartSurfaceGradients.houseSection} style={StyleSheet.absoluteFill} />
                      <View style={[styles.themedCardHeaderRow, styles.houseDiveHeaderRow]}>
                        <View style={styles.houseDiveContentStack}>
                          <View style={styles.houseDiveTitleRow}>
                            <MetallicText style={{ fontSize: 16, fontWeight: '700' }} color="#E8D6AE">{hd.house}</MetallicText>
                            <Text style={[styles.themedCardTitle, styles.houseDiveTitle]} numberOfLines={1}>{hd.cuspSign}</Text>
                          </View>
                          <View style={styles.houseDiveChipRow}>
                            {hd.ruler && <View style={styles.themedPlacementChip}><Text style={styles.themedPlacementText}>♜ {hd.ruler}</Text></View>}
                            {hd.occupants.length > 0 && <View style={[styles.themedPlacementChip, { borderColor: 'rgba(207, 174, 115, 0.3)' }]}><Text style={styles.themedPlacementText}>{hd.occupants.join(', ')}</Text></View>}
                          </View>
                        </View>
                        <MetallicIcon style={styles.houseDiveChevron as ViewStyle} name={expandedHouse === hd.house ? 'chevron-up' : 'chevron-down'} size={16} color={PALETTE.gold} />
                      </View>
                      {expandedHouse === hd.house && <Text style={[styles.themedCardSummary, styles.houseDiveSummary]}>{hd.synthesis}</Text>}
                    </VelvetGlassSurface>
                  </Pressable>
                ))}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Life Themes ── */}
          {viewMode === 'complete' && isPremium && (relationshipProfile || careerProfile || emotionalProfile || shadowGrowth) && (
            <Animated.View entering={FadeInDown.delay(420).duration(600)} style={{ width: '100%' }}>
              <SectionAccordion title="Life Themes" subtitle="Relationship, career, emotional, and growth profiles" sectionKey="lifeThemes" openSections={openSections} setOpenSections={setOpenSections}>
                {relationshipProfile && (
                  <Pressable onPress={() => setExpandedLifeTheme(expandedLifeTheme === 'relationship' ? null : 'relationship')} accessibilityRole="button" accessibilityLabel="Relationship profile">
                    <VelvetGlassSurface style={styles.themedCard} intensity={45}>
                    <LinearGradient colors={chartSurfaceGradients.lifeThemesSection} style={StyleSheet.absoluteFill} />
                      <View style={styles.themedCardHeaderRow}>
                        <GradientIcon size={20}><Ionicons name="heart-outline" size={20} color="#000" /></GradientIcon>
                        <Text style={styles.themedCardTitle}>Relationship Profile</Text>
                        <MetallicIcon name={expandedLifeTheme === 'relationship' ? 'chevron-up' : 'chevron-down'} size={18} color={PALETTE.gold} />
                      </View>
                      <View style={styles.themedCardPlacements}>
                        {relationshipProfile.keyPlanets.map((p, i) => <View key={i} style={styles.themedPlacementChip}><Text style={styles.themedPlacementText}>{p}</Text></View>)}
                      </View>
                      {!expandedLifeTheme || expandedLifeTheme !== 'relationship' ? (
                        <Text style={styles.themedCardSummary} numberOfLines={2}>{personalizeLifeThemeSummary('relationship', relationshipProfile.synthesis)}</Text>
                      ) : null}
                      {expandedLifeTheme === 'relationship' && (
                        <View style={styles.themedCardDetails}>
                          <Text style={styles.themedCardDetail}>{personalizeLifeThemeSummary('relationship', relationshipProfile.synthesis)}</Text>
                          <Text style={styles.themedCardDetail}>• The way you love tends to feel like: {relationshipProfile.loveStyle}</Text>
                          <Text style={styles.themedCardDetail}>• You are often drawn toward: {relationshipProfile.attractionPattern}</Text>
                          <Text style={styles.themedCardDetail}>• Closeness may feel safest when: {relationshipProfile.intimacyStyle}</Text>
                          <Text style={styles.themedCardDetail}>• The relationship lesson underneath this is: {relationshipProfile.partnershipLessons}</Text>
                        </View>
                      )}
                    </VelvetGlassSurface>
                  </Pressable>
                )}
                {careerProfile && (
                  <Pressable onPress={() => setExpandedLifeTheme(expandedLifeTheme === 'career' ? null : 'career')} accessibilityRole="button" accessibilityLabel="Career and purpose profile">
                    <VelvetGlassSurface style={styles.themedCard} intensity={45}>
                    <LinearGradient colors={chartSurfaceGradients.lifeThemesSection} style={StyleSheet.absoluteFill} />
                      <View style={styles.themedCardHeaderRow}>
                        <GradientIcon size={20}><Ionicons name="briefcase-outline" size={20} color="#000" /></GradientIcon>
                        <Text style={styles.themedCardTitle}>Career & Life Direction</Text>
                        <MetallicIcon name={expandedLifeTheme === 'career' ? 'chevron-up' : 'chevron-down'} size={18} color={PALETTE.gold} />
                      </View>
                      <View style={styles.themedCardPlacements}>
                        {careerProfile.keyPlanets.map((p, i) => <View key={i} style={styles.themedPlacementChip}><Text style={styles.themedPlacementText}>{p}</Text></View>)}
                      </View>
                      {!expandedLifeTheme || expandedLifeTheme !== 'career' ? (
                        <Text style={styles.themedCardSummary} numberOfLines={2}>{personalizeLifeThemeSummary('career', careerProfile.synthesis)}</Text>
                      ) : null}
                      {expandedLifeTheme === 'career' && (
                        <View style={styles.themedCardDetails}>
                          <Text style={styles.themedCardDetail}>{personalizeLifeThemeSummary('career', careerProfile.synthesis)}</Text>
                          <Text style={styles.themedCardDetail}>• The work that seems most aligned for you is: {careerProfile.vocationThemes}</Text>
                          <Text style={styles.themedCardDetail}>• You tend to work best when: {careerProfile.workStyle}</Text>
                          <Text style={styles.themedCardDetail}>• People may read your public presence as: {careerProfile.publicImage}</Text>
                          <Text style={styles.themedCardDetail}>• The next layer of growth here is: {careerProfile.growthPath}</Text>
                        </View>
                      )}
                    </VelvetGlassSurface>
                  </Pressable>
                )}
                {emotionalProfile && (
                  <Pressable onPress={() => setExpandedLifeTheme(expandedLifeTheme === 'emotional' ? null : 'emotional')} accessibilityRole="button" accessibilityLabel="Emotional and psychological profile">
                    <VelvetGlassSurface style={styles.themedCard} intensity={45}>
                    <LinearGradient colors={chartSurfaceGradients.lifeThemesSection} style={StyleSheet.absoluteFill} />
                      <View style={styles.themedCardHeaderRow}>
                        <GradientIcon size={20}><Ionicons name="water-outline" size={20} color="#000" /></GradientIcon>
                        <Text style={styles.themedCardTitle}>Emotional & Inner World</Text>
                        <MetallicIcon name={expandedLifeTheme === 'emotional' ? 'chevron-up' : 'chevron-down'} size={18} color={PALETTE.gold} />
                      </View>
                      {!expandedLifeTheme || expandedLifeTheme !== 'emotional' ? (
                        <Text style={styles.themedCardSummary} numberOfLines={2}>{personalizeLifeThemeSummary('emotional', emotionalProfile.synthesis)}</Text>
                      ) : null}
                      {expandedLifeTheme === 'emotional' && (
                        <View style={styles.themedCardDetails}>
                          <Text style={styles.themedCardDetail}>{personalizeLifeThemeSummary('emotional', emotionalProfile.synthesis)}</Text>
                          <Text style={styles.themedCardDetail}>• Your emotional style tends to be: {emotionalProfile.emotionalStyle}</Text>
                          <Text style={styles.themedCardDetail}>• The fear pattern underneath it may sound like: {emotionalProfile.coreFears}</Text>
                          <Text style={styles.themedCardDetail}>• Under strain, you may protect yourself by: {emotionalProfile.defenseMechanisms}</Text>
                          <Text style={styles.themedCardDetail}>• In attachment, this can feel like: {emotionalProfile.attachmentStyle}</Text>
                          <Text style={styles.themedCardDetail}>• The healing thread running through it is: {emotionalProfile.healingThemes}</Text>
                        </View>
                      )}
                    </VelvetGlassSurface>
                  </Pressable>
                )}
                {shadowGrowth && (
                  <Pressable onPress={() => setExpandedLifeTheme(expandedLifeTheme === 'shadow' ? null : 'shadow')} accessibilityRole="button" accessibilityLabel="Shadow and growth profile">
                    <VelvetGlassSurface style={styles.themedCard} intensity={45}>
                    <LinearGradient colors={chartSurfaceGradients.lifeThemesSection} style={StyleSheet.absoluteFill} />
                      <View style={styles.themedCardHeaderRow}>
                        <GradientIcon size={20}><Ionicons name="moon-outline" size={20} color="#000" /></GradientIcon>
                        <Text style={styles.themedCardTitle}>Shadow & Growth Path</Text>
                        <MetallicIcon name={expandedLifeTheme === 'shadow' ? 'chevron-up' : 'chevron-down'} size={18} color={PALETTE.gold} />
                      </View>
                      {!expandedLifeTheme || expandedLifeTheme !== 'shadow' ? (
                        <Text style={styles.themedCardSummary} numberOfLines={2}>{personalizeLifeThemeSummary('shadow', shadowGrowth.synthesis)}</Text>
                      ) : null}
                      {expandedLifeTheme === 'shadow' && (
                        <View style={styles.themedCardDetails}>
                          <Text style={styles.themedCardDetail}>{personalizeLifeThemeSummary('shadow', shadowGrowth.synthesis)}</Text>
                          <Text style={styles.themedCardDetail}>• The long lesson asking for maturity is: {shadowGrowth.saturnLessons}</Text>
                          <Text style={styles.themedCardDetail}>• The tender place still asking for gentleness is: {shadowGrowth.chironWound}</Text>
                          <Text style={styles.themedCardDetail}>• The transformation underway in you is: {shadowGrowth.plutoTransformation}</Text>
                          <Text style={styles.themedCardDetail}>• The growth direction pulling you forward is: {shadowGrowth.nodeAxis}</Text>
                          {shadowGrowth.growthEdges.map((edge, i) => <Text key={i} style={styles.themedCardDetail}>• {edge}</Text>)}
                        </View>
                      )}
                    </VelvetGlassSurface>
                  </Pressable>
                )}
              </SectionAccordion>
            </Animated.View>
          )}

          {/* ── Premium Upsell (free users) ── */}
          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ width: '100%' }}>
              <Pressable onPress={() => router.push('/(tabs)/premium' as Href)} accessibilityRole="button" accessibilityLabel="Unlock Deeper Sky premium features">
                <LinearGradient colors={chartSurfaceGradients.panel} style={[styles.overlayUpsell, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MetallicIcon name="sparkles-outline" size={16} color={PALETTE.gold} />
                    <View style={{ flex: 1 }}>
                      <MetallicText style={[styles.overlayUpsellText, { fontWeight: '600' }]} color="#E8D6AE">Your chart has more to say</MetallicText>
                      <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Nodes, Chiron, Lilith, Vertex, chart ruler, stelliums, retrogrades, and minor aspects</Text>
                    </View>
                    <MetallicIcon name="arrow-forward-outline" size={16} color={PALETTE.gold} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* ── Chart Glossary ── */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.glossarySection}>
            <Pressable
              style={styles.glossarySectionTitleRow}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setShowGlossary((prev) => !prev); }}
              accessibilityRole="button"
              accessibilityLabel="Toggle chart glossary"
            >
              <Text style={styles.glossarySectionTitle}>Chart Glossary</Text>
              <MetallicIcon name={showGlossary ? 'chevron-up' : 'chevron-down'} size={20} color={PALETTE.gold} />
            </Pressable>
            {showGlossary && (
              <View style={styles.glossaryCard}>
                <VelvetGlassSurface style={{ flex: 1 }} intensity={45}>
                <LinearGradient colors={chartSurfaceGradients.settings} style={StyleSheet.absoluteFill} />
                <View style={styles.glossaryGradient}>
                  {GLOSSARY_TERMS.map((item, index) => (
                    <Pressable
                      key={item.term}
                      onPress={() => { Haptics.selectionAsync().catch(() => {}); setExpandedTerm(expandedTerm === item.term ? null : item.term); }}
                      style={[styles.glossaryRow, index < GLOSSARY_TERMS.length - 1 && styles.glossaryRowBorder]}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.term}, glossary term`}
                    >
                      <View style={styles.glossaryHeader}>
                        <Text style={styles.glossaryTerm}>{item.term}</Text>
                        <MetallicIcon name={expandedTerm === item.term ? 'chevron-up' : 'chevron-down'} size={16} color={PALETTE.gold} />
                      </View>
                      {expandedTerm === item.term && <Text style={styles.glossaryDefinition}>{item.def}</Text>}
                    </Pressable>
                  ))}
                </View>
                </VelvetGlassSurface>
              </View>
            )}
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

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
              >
                <Text style={styles.relTypeOptionText}>{RELATIONSHIP_LABELS[type]}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.relTypeCancelBtn} onPress={() => setShowRelTypePicker(false)}>
              <Text style={styles.relTypeCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Modals ── */}
      <AstrologySettingsModal
        visible={showAstrologyModal}
        onClose={() => { setShowAstrologyModal(false); void loadChart(); }}
      />
      <BirthDataModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSaveNewPerson} />
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
  goHomeText: { color: '#E8D6AE', fontWeight: '700' },
  initBtnGlass: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140, gap: 0 },
  glowOrb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.5,
  },

  header: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E8D6AE',
    letterSpacing: 1.5,
  },
  settingsAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStack: {
    flex: 1,
  },
  wheelCaption: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.58)',
    fontWeight: '500',
    letterSpacing: 1.4,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
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
    color: '#E8D6AE',
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
    marginBottom: 32,
    width: '100%',
  },
  warningText: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },

  bigThreeCard: {
    borderRadius: 32,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
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
    borderRadius: 32,
    padding: 28,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
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
  sensitiveName: { color: theme.textPrimary, fontSize: 13, fontWeight: '700', textAlign: 'center', letterSpacing: -0.3 },
  sensitiveSign: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500', marginTop: 2, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  sensitiveDeg: { color: 'rgba(255,255,255,0.40)', fontSize: 11, marginTop: 2, textAlign: 'center' },

  insightBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    padding: 20,
    marginTop: theme.spacing.md,
    width: '100%',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  insightLabel: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  insightTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center', marginBottom: 6 },
  insightText: { color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 22, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  pointsDivider: {
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 12,
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
    marginBottom: 32,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.isDark ? 'rgba(10, 18, 36,0.5)' : PALETTE.slateMid,
    padding: 3,
    width: '100%',
    borderWidth: theme.isDark ? 0 : 1,
    borderColor: theme.isDark ? 'transparent' : theme.cardBorder,
  },
  tabBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 2, alignItems: 'center', borderRadius: theme.borderRadius.md },
  tabBtnActive: { backgroundColor: theme.isDark ? 'rgba(162, 194, 225, 0.15)' : 'rgba(255, 255, 255, 0.92)' },
  tabText: { color: theme.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: '#C9AE78' },

  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 214, 174,0.15)',
    width: '100%',
  },
  blueprintTableHeader: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 22,
    borderBottomWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  th: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  planetsTh: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  housesTh: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 28,
    width: '100%',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  blueprintRowShell: {
    marginBottom: 12,
    borderRadius: 28,
    overflow: 'hidden',
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
    marginBottom: 48,
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
    marginTop: 10,
    alignItems: 'center',
    paddingHorizontal: 24,
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
  blueprintLeadCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  blueprintIconSlot: {
    width: 28,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueprintSymbolSlot: {
    width: 24,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueprintTextStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  planetSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: theme.isDark ? '#FFFFFF' : theme.textPrimary, marginRight: 10, width: 28, textAlign: 'center' },
  signSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: theme.isDark ? '#FFFFFF' : theme.textPrimary, marginRight: 6, width: 24, textAlign: 'center' },
  planetName: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: -0.3, textAlign: 'center' },
  retroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  signName: { fontWeight: '700', fontSize: 13, letterSpacing: -0.2, color: '#FFFFFF', textAlign: 'center' },
  elementLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 3, fontWeight: '500', letterSpacing: 0.3, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  degreeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, textAlign: 'center' },
  planetsDegreeText: { fontSize: 12.5 },
  housesDegreeText: { fontSize: 12.5 },
  minuteText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  houseNum: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, textAlign: 'center' },

  houseSystemLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
    width: '100%',
  },
  houseNumLarge: { color: '#E8D6AE', fontWeight: '800', fontSize: 18, textAlign: 'center' },
  houseTheme: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
  },

  aspectPlanetSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: theme.isDark ? '#FFFFFF' : theme.textPrimary, marginRight: 6, width: 24, textAlign: 'center' },
  aspectIconWrap: { width: 24, minWidth: 24, alignItems: 'center', justifyContent: 'center' },
  aspectPlanetName: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  aspectSymbol: { fontFamily: ZODIAC_FAMILY, fontSize: 18, color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  aspectName: { fontSize: 12, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
  aspectNature: { fontSize: 10, textAlign: 'center', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.9, textTransform: 'uppercase', marginTop: 2 },
  orbText: { fontWeight: '800', fontSize: 15, textAlign: 'center' },
  applyingLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'center', letterSpacing: 0.8, marginTop: 2, textTransform: 'uppercase' },

  legend: {
    marginTop: 20,
    padding: 28,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    borderLeftColor: 'rgba(255,255,255,0.08)',
    borderRightColor: 'rgba(255,255,255,0.03)',
    borderBottomColor: 'rgba(255,255,255,0.01)',
  },
  legendTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendText: { color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 22, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', textAlign: 'center', fontWeight: '500' },
  legendNote: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 10, lineHeight: 18, textAlign: 'center' },

  aspectUpsell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: 8,
  },
  aspectUpsellText: { flex: 1, color: '#E8D6AE', fontSize: 13, lineHeight: 18, textAlign: 'center' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: theme.textMuted, fontSize: 14, marginTop: 12, textAlign: 'center' },

  patternCard: {
    borderRadius: 32,
    padding: 28,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  },
  patternHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  patternIcon: { fontSize: 20, marginRight: 12 },
  patternTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 26,
    letterSpacing: -1,
    flex: 1,
  },
  patternHighlight: {
    backgroundColor: 'rgba(44, 54, 69, 0.88)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
    borderLeftColor: 'rgba(255,255,255,0.08)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  patternHighlightText: { color: '#E8D6AE', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  patternDesc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '500',
  },
  dignitySummary: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  tooltipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    gap: 8,
  },
  tooltipText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 18, flex: 1 },

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
    borderColor: '#E8D6AE',
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
  personChipTextActive: { color: '#E8D6AE' },
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
  addPersonText: { color: '#E8D6AE', fontSize: 13, fontWeight: '600' },

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
    marginBottom: 32,
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
  glossarySection: { alignSelf: 'stretch', marginHorizontal: 0, marginBottom: 32 },
  glossarySectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  glossarySectionTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif' },
  glossaryCard: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  glossaryGradient: { paddingHorizontal: 28, paddingVertical: 8 },
  glossaryRow: { paddingVertical: 16 },
  glossaryRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.cardBorder },
  glossaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  glossaryTerm: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif', flex: 1 },
  glossaryDefinition: { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 22, marginTop: 8, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  glossaryContainer: { width: '100%' },
  glossaryDef: { fontSize: 13, color: theme.textSecondary, lineHeight: 20, marginTop: theme.spacing.xs, fontFamily: 'serif' },

  // ── Transparency Bar ──
  transparencyBar: {
    alignSelf: 'stretch',
    marginHorizontal: 0,
    marginBottom: 32,
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
    color: '#E8D6AE',
    fontFamily: 'serif',
    marginTop: 2,
  },

  sensitiveIconBox: {
    width: 28,
    minWidth: 28,
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
    marginBottom: 12,
    borderRadius: 28,
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
    backgroundColor: 'rgba(44, 54, 69, 0.88)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
    borderLeftColor: 'rgba(255,255,255,0.08)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  occupantPillText: {
    color: '#E8D6AE',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    textAlign: 'center',
  },

  // ── Aspect Interpretations ──
  aspectInterp: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 22,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '500',
  },

  // ── Themed Interpretation Sections ──
  accordionContainer: { width: '100%', marginTop: 16, marginBottom: 20 },
  accordionContent: { marginTop: 24 },
  accordionSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, letterSpacing: 2.2, textTransform: 'uppercase' },
  themedSectionHeaderActive: { backgroundColor: 'rgba(44, 54, 69, 0.96)' },
  themedSectionHeader: {
    flexDirection: 'row',
    padding: 28,
    backgroundColor: 'rgba(44, 54, 69, 0.88)',
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    borderLeftColor: 'rgba(255,255,255,0.08)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  themedSectionHeaderText: { fontSize: 20, fontWeight: '900', letterSpacing: 1.5, color: '#FFF' },
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderLeftColor: 'rgba(255,255,255,0.12)',
    borderRightColor: 'rgba(255,255,255,0.05)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  themedCard: {
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 32,
    padding: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    borderLeftColor: 'rgba(255,255,255,0.08)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  themedCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  themedCardIcon: {
    fontSize: 20,
  },
  themedCardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    flex: 1,
  },
  angleCardTitle: {
    fontSize: 22,
    marginRight: 8,
  },
  themedCardPlacements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  themedPlacementChip: {
    backgroundColor: 'rgba(44, 54, 69, 0.88)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
    borderLeftColor: 'rgba(255,255,255,0.08)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  themedPlacementText: {
    fontSize: 10,
    color: '#E8D6AE',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  themedCardSummary: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '500',
  },
  themedCardDetails: {
    marginTop: 14,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.10)',
    gap: 8,
  },
  planetDiveDetails: {
    marginTop: 16,
  },
  themedCardDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 21,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  profileStack: {
    width: '100%',
    marginTop: 12,
  },
  editorialSectionLabel: {
    color: '#E8D6AE',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  editorialCard: {
    width: '100%',
    borderRadius: 32,
    padding: 28,
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
  planetDiveHeaderRow: {
    alignItems: 'center',
    gap: 10,
  },
  planetDiveTitle: {
    flex: 0,
    flexShrink: 0,
    fontSize: 14,
    textAlign: 'center',
  },
  planetDiveChipRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
    justifyContent: 'center',
    flexShrink: 1,
    overflow: 'hidden',
  },
  planetDiveSummary: {
    textAlign: 'center',
  },
  planetDiveDetail: {
    textAlign: 'center',
  },
  houseDiveHeaderRow: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    paddingRight: 22,
  },
  houseDiveContentStack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  houseDiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  houseDiveTitle: {
    flex: 0,
    flexShrink: 1,
    fontSize: 24,
    textAlign: 'center',
  },
  houseDiveChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  houseDiveChevron: {
    position: 'absolute',
    right: 0,
    top: 4,
  },
  houseDiveSummary: {
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  dignityChipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
    width: '100%',
  },
  dignityCard: {
    borderRadius: 32,
    alignSelf: 'center',
    width: '100%',
    padding: 22,
    marginBottom: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  dignityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  dignityPlanetName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  dignityMeta: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  dignityDescription: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '500',
  },
  strongAspectCard: {
    borderRadius: 32,
    padding: 22,
    marginBottom: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  strongAspectHeader: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  strongAspectTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    width: '100%',
  },
  strongAspectMeta: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  strongAspectDescription: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '500',
  },

});
