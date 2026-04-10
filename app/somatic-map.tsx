// app/somatic-map.tsx
// MySky — Somatic Map
// Log where emotions live in the body. Builds a heatmap over time.

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';
import { logger } from '../utils/logger';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { keepLastWordsTogether } from '../utils/textLayout';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { EditorialPillGrid } from '../components/ui/EditorialPillGrid';

const { width: SCREEN_W } = Dimensions.get('window');
const STORAGE_KEY = '@mysky:somatic_entries';
const SILHOUETTE_WIDTH = Math.min(SCREEN_W - 132, 220);
const SILHOUETTE_HEIGHT = 470;
const BODY_AURA_WIDTH = SILHOUETTE_WIDTH + 58;
const BODY_AURA_HEIGHT = SILHOUETTE_HEIGHT - 24;
const BODY_CORE_WIDTH = Math.round(SILHOUETTE_WIDTH * 0.58);
const BODY_CORE_HEIGHT = Math.round(SILHOUETTE_HEIGHT * 0.78);

const PALETTE = {
  sage:        '#8CBEAA',
  textMain:    '#FFFFFF',
  textMuted:   'rgba(226,232,240,0.45)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg:          '#0A0A0F',
};

const EMOTIONS_CORE = [
  'Anxiety', 'Sadness', 'Anger',     'Joy',
  'Fear',    'Peace',   'Tension',   'Numbness',
  'Grief',   'Excitement', 'Shame',  'Love',
];

const EMOTIONS_EXTENDED = [
  'Stress', 'Overwhelm', 'Frustration', 'Loneliness',
  'Contentment', 'Burnout', 'Safety', 'Relief',
  'Grounded', 'Disconnection', 'Irritability', 'Restlessness',
];

const EMOTION_COLORS: Record<string, string> = {
  Anxiety:       '#D9BF8C', Sadness:      '#C9AE78', Anger:         '#D4A3B3', Joy:           '#8CBEAA',
  Fear:          '#A89BC8', Peace:        '#D9BF8C', Tension:       '#D98C8C', Numbness:      '#6E8CB4',
  Grief:         '#9E8FB8', Excitement:   '#E8C97A', Shame:         '#B87EA0', Love:          '#E8A3B3',
  Stress:        '#D9A07A', Overwhelm:    '#C47A7A', Frustration:   '#D4956E', Loneliness:    '#7A9EC4',
  Contentment:   '#7ABEA0', Burnout:      '#8C8C9E', Safety:        '#7ACC9A', Relief:        '#90CEB4',
  Grounded:      '#A0B87A', Disconnection:'#7A8CA0', Irritability:  '#CC8A7A', Restlessness: '#C4A07A',
};

interface Zone {
  id: string;
  frontLabel: string;
  backLabel:  string;
}

const ZONES: Zone[] = [
  { id: 'head',   frontLabel: 'Head & Mind',    backLabel: 'Back of Head' },
  { id: 'throat', frontLabel: 'Throat & Jaw',   backLabel: 'Neck & Trapezius' },
  { id: 'chest',  frontLabel: 'Chest & Heart',  backLabel: 'Upper Back' },
  { id: 'arms',   frontLabel: 'Arms & Hands',   backLabel: 'Arms & Hands' },
  { id: 'gut',    frontLabel: 'Gut & Belly',    backLabel: '' },
  { id: 'back',   frontLabel: 'Hips & Pelvis',  backLabel: 'Lower Back & Glutes' },
  { id: 'limbs',  frontLabel: 'Legs & Feet',    backLabel: 'Hamstrings & Calves' },
];

type Hotspot = {
  zoneId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const SILHOUETTE_PATHS: Record<'female' | 'male', Record<'front' | 'back', string>> = {
  female: {
    front: 'M100 18 C84 18 71 31 70 49 C69 66 76 82 82 96 C68 111 59 127 57 149 C55 176 64 198 74 220 C80 235 82 255 80 278 C78 310 72 356 66 430 C62 477 68 527 80 582 C87 612 90 648 88 690 C87 722 91 750 100 776 C109 750 113 722 112 690 C110 648 113 612 120 582 C132 527 138 477 134 430 C128 356 122 310 120 278 C118 255 120 235 126 220 C136 198 145 176 143 149 C141 127 132 111 118 96 C124 82 131 66 130 49 C129 31 116 18 100 18 Z M82 99 C67 101 54 111 44 126 C34 143 29 165 31 187 C33 210 42 229 53 245 C60 256 63 270 61 288 C59 305 55 327 58 350 C61 378 70 401 80 420 C84 383 87 338 86 300 C85 266 79 232 76 198 C73 163 76 125 82 99 Z M118 99 C133 101 146 111 156 126 C166 143 171 165 169 187 C167 210 158 229 147 245 C140 256 137 270 139 288 C141 305 145 327 142 350 C139 378 130 401 120 420 C116 383 113 338 114 300 C115 266 121 232 124 198 C127 163 124 125 118 99 Z',
    back: 'M100 18 C84 18 71 31 70 49 C69 67 76 83 84 96 C74 106 66 120 63 138 C58 170 66 197 76 220 C82 234 84 253 82 274 C79 307 72 355 67 432 C64 483 69 533 81 586 C88 614 91 649 89 689 C88 721 91 749 100 776 C109 749 112 721 111 689 C109 649 112 614 119 586 C131 533 136 483 133 432 C128 355 121 307 118 274 C116 253 118 234 124 220 C134 197 142 170 137 138 C134 120 126 106 116 96 C124 83 131 67 130 49 C129 31 116 18 100 18 Z M84 104 C75 111 68 121 64 135 C57 162 62 188 72 208 C78 220 81 236 80 255 C78 293 72 339 68 394 C72 376 77 359 83 344 C89 327 90 306 88 282 C85 238 82 154 84 104 Z M116 104 C125 111 132 121 136 135 C143 162 138 188 128 208 C122 220 119 236 120 255 C122 293 128 339 132 394 C128 376 123 359 117 344 C111 327 110 306 112 282 C115 238 118 154 116 104 Z',
  },
  male: {
    front: 'M100 18 C84 18 70 31 69 50 C68 69 77 85 84 98 C71 112 62 130 60 154 C58 183 67 205 79 229 C86 244 89 264 87 286 C84 321 77 374 71 442 C67 493 72 548 83 603 C89 633 92 667 91 707 C90 733 93 757 100 776 C107 757 110 733 109 707 C108 667 111 633 117 603 C128 548 133 493 129 442 C123 374 116 321 113 286 C111 264 114 244 121 229 C133 205 142 183 140 154 C138 130 129 112 116 98 C123 85 132 69 131 50 C130 31 116 18 100 18 Z M84 101 C64 104 48 117 37 135 C26 154 22 178 25 203 C28 228 39 247 52 264 C60 274 64 289 63 309 C61 329 58 353 62 378 C66 406 74 430 82 450 C87 413 90 361 89 322 C88 281 82 241 79 205 C76 165 78 127 84 101 Z M116 101 C136 104 152 117 163 135 C174 154 178 178 175 203 C172 228 161 247 148 264 C140 274 136 289 137 309 C139 329 142 353 138 378 C134 406 126 430 118 450 C113 413 110 361 111 322 C112 281 118 241 121 205 C124 165 122 127 116 101 Z',
    back: 'M100 18 C84 18 70 31 69 50 C68 69 77 85 86 98 C75 109 67 123 64 142 C59 175 67 202 79 226 C85 239 88 258 86 281 C83 317 77 370 72 445 C68 497 73 552 84 607 C90 637 93 670 92 709 C91 734 94 758 100 776 C106 758 109 734 108 709 C107 670 110 637 116 607 C127 552 132 497 128 445 C123 370 117 317 114 281 C112 258 115 239 121 226 C133 202 141 175 136 142 C133 123 125 109 114 98 C123 85 132 69 131 50 C130 31 116 18 100 18 Z M86 106 C75 114 67 126 63 143 C56 171 62 198 72 220 C78 232 81 248 80 269 C79 306 73 350 70 401 C74 383 79 366 85 349 C91 332 93 311 91 286 C88 244 84 160 86 106 Z M114 106 C125 114 133 126 137 143 C144 171 138 198 128 220 C122 232 119 248 120 269 C121 306 127 350 130 401 C126 383 121 366 115 349 C109 332 107 311 109 286 C112 244 116 160 114 106 Z',
  },
};

const HOTSPOTS: Record<'female' | 'male', Record<'front' | 'back', Hotspot[]>> = {
  female: {
    front: [
      { zoneId: 'head', x: 0.5, y: 0.1, width: 0.15, height: 0.095 },
      { zoneId: 'throat', x: 0.5, y: 0.205, width: 0.14, height: 0.06 },
      { zoneId: 'chest', x: 0.5, y: 0.31, width: 0.22, height: 0.12 },
      { zoneId: 'arms', x: 0.5, y: 0.37, width: 0.44, height: 0.105 },
      { zoneId: 'gut', x: 0.5, y: 0.49, width: 0.2, height: 0.1 },
      { zoneId: 'back', x: 0.5, y: 0.62, width: 0.22, height: 0.1 },
      { zoneId: 'limbs', x: 0.5, y: 0.83, width: 0.24, height: 0.18 },
    ],
    back: [
      { zoneId: 'head', x: 0.5, y: 0.1, width: 0.15, height: 0.095 },
      { zoneId: 'throat', x: 0.5, y: 0.21, width: 0.15, height: 0.065 },
      { zoneId: 'chest', x: 0.5, y: 0.34, width: 0.24, height: 0.13 },
      { zoneId: 'arms', x: 0.5, y: 0.39, width: 0.46, height: 0.105 },
      { zoneId: 'back', x: 0.5, y: 0.56, width: 0.22, height: 0.12 },
      { zoneId: 'limbs', x: 0.5, y: 0.83, width: 0.26, height: 0.18 },
    ],
  },
  male: {
    front: [
      { zoneId: 'head', x: 0.5, y: 0.1, width: 0.16, height: 0.1 },
      { zoneId: 'throat', x: 0.5, y: 0.205, width: 0.15, height: 0.065 },
      { zoneId: 'chest', x: 0.5, y: 0.305, width: 0.26, height: 0.13 },
      { zoneId: 'arms', x: 0.5, y: 0.37, width: 0.52, height: 0.11 },
      { zoneId: 'gut', x: 0.5, y: 0.49, width: 0.22, height: 0.105 },
      { zoneId: 'back', x: 0.5, y: 0.625, width: 0.2, height: 0.095 },
      { zoneId: 'limbs', x: 0.5, y: 0.83, width: 0.22, height: 0.19 },
    ],
    back: [
      { zoneId: 'head', x: 0.5, y: 0.1, width: 0.16, height: 0.1 },
      { zoneId: 'throat', x: 0.5, y: 0.21, width: 0.16, height: 0.07 },
      { zoneId: 'chest', x: 0.5, y: 0.335, width: 0.27, height: 0.135 },
      { zoneId: 'arms', x: 0.5, y: 0.39, width: 0.54, height: 0.11 },
      { zoneId: 'back', x: 0.5, y: 0.56, width: 0.22, height: 0.12 },
      { zoneId: 'limbs', x: 0.5, y: 0.83, width: 0.24, height: 0.19 },
    ],
  },
};

interface SomaticEntry {
  id: string;
  date: string;
  region: string;
  side?: 'front' | 'back';
  gender?: 'female' | 'male';
  emotion: string;
  intensity: number;
}

export default function SomaticMapScreen() {
  const router = useRouter();

  const [entries,         setEntries]         = useState<SomaticEntry[]>([]);
  const [selectedRegion,  setSelectedRegion]  = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity,       setIntensity]       = useState<number>(3);
  const [side,            setSide]            = useState<'front' | 'back'>('front');
  const [gender,          setGender]          = useState<'female' | 'male'>('female');
  const [showMoreEmotions, setShowMoreEmotions] = useState(false);

  useFocusEffect(
    useCallback(() => {
      EncryptedAsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) { try { setEntries(JSON.parse(raw)); } catch (e) { logger.warn('[SomaticMap] Failed to parse stored entries:', e); } }
      }).catch((e) => { logger.warn('[SomaticMap] Failed to load entries:', e); });
    }, []),
  );

  const activeEmotionColor =
    (selectedEmotion && EMOTION_COLORS[selectedEmotion]) || PALETTE.sage;

  const silhouettePath = useMemo(() => SILHOUETTE_PATHS[gender][side], [gender, side]);
  const hotspots = useMemo(() => HOTSPOTS[gender][side], [gender, side]);

  const handleZonePress = (zoneId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedRegion((prev) => (prev === zoneId ? null : zoneId));
  };

  const selectedZoneLabel = selectedRegion
    ? (() => {
        const zone = ZONES.find((z) => z.id === selectedRegion);
        if (!zone) return null;
        return side === 'front' ? zone.frontLabel : zone.backLabel;
      })()
    : null;

  const logEntry = async () => {
    if (!selectedRegion || !selectedEmotion) return;
    const newEntry: SomaticEntry = {
      id:        Date.now().toString(),
      date:      new Date().toISOString(),
      region:    selectedRegion,
      side,
      gender,
      emotion:   selectedEmotion,
      intensity,
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    try {
      await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      Alert.alert('Error', 'Could not save entry. Please try again.');
      setEntries(entries);
      return;
    }
    // Cloud sync (fire-and-forget)
    import('../services/storage/syncService').then(({ enqueueSomaticEntry }) =>
      enqueueSomaticEntry(newEntry),
    ).catch(() => {});
    setSelectedRegion(null);
    setSelectedEmotion(null);
    setIntensity(3);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Delete Entry', 'Remove this somatic entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = entries.filter((e) => e.id !== id);
          setEntries(updated);
          try {
            await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {
            setEntries(entries);
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        },
      },
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const zoneLabel = (zoneId: string, entrySide?: 'front' | 'back') => {
    const zone = ZONES.find((z) => z.id === zoneId);
    if (!zone) return zoneId;
    const s = entrySide ?? 'front';
    const label = s === 'back' ? zone.backLabel : zone.frontLabel;
    return label || zone.frontLabel || zone.backLabel || zoneId;
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <LinearGradient
        colors={['rgba(140, 190, 170, 0.08)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); if (router.canGoBack()) router.back(); }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MetallicIcon name="chevron-back-outline" size={22} color={PALETTE.textMuted} />
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>{keepLastWordsTogether('Somatic Map')}</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Where emotions live in your body</GoldSubtitle>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Front / Back + Female / Male toggles */}
          <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.toggleRow}>
            <View style={styles.sideToggle}>
              {(['front', 'back'] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[styles.sideBtn, side === s && styles.sideBtnActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSide(s);
                    setSelectedRegion(null);
                  }}
                >
                  <Text style={[styles.sideBtnText, side === s && styles.sideBtnTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sideToggle}>
              {(['female', 'male'] as const).map((g) => (
                <Pressable
                  key={g}
                  style={[styles.sideBtn, gender === g && styles.sideBtnActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setGender(g);
                    setSelectedRegion(null);
                  }}
                >
                  <Text style={[styles.sideBtnText, gender === g && styles.sideBtnTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Body map */}
          <Animated.View entering={FadeInDown.delay(160).duration(500)}>
            <VelvetGlassSurface style={styles.bodyWrap} intensity={45} backgroundColor="rgba(12, 15, 24, 0.34)">
            <View style={styles.bodyAura} pointerEvents="none" />
            <View style={styles.bodyCoreGlow} pointerEvents="none" />
            <View style={styles.bodyFrame}>
              <Svg
                width={SILHOUETTE_WIDTH}
                height={SILHOUETTE_HEIGHT}
                viewBox="0 0 200 776"
                preserveAspectRatio="xMidYMid meet"
              >
                <Ellipse
                  cx="100"
                  cy="352"
                  rx="54"
                  ry="214"
                  fill="rgba(140,190,170,0.07)"
                />
                <Path
                  d={silhouettePath}
                  fill="rgba(231,243,255,0.14)"
                  stroke="rgba(236,245,255,0.6)"
                  strokeWidth={1.2}
                />
                <Path
                  d={silhouettePath}
                  fill="transparent"
                  stroke="rgba(140,190,170,0.30)"
                  strokeWidth={2.4}
                />
              </Svg>

              <View style={styles.hotspotLayer} pointerEvents="box-none">
                {hotspots.map((hotspot) => {
                  const selected = selectedRegion === hotspot.zoneId;
                  const zoneColor = selected ? activeEmotionColor : 'rgba(225,236,248,0.2)';
                  return (
                    <Pressable
                      key={`${side}-${hotspot.zoneId}`}
                      style={[
                        styles.hotspot,
                        {
                          left: hotspot.x * SILHOUETTE_WIDTH - (hotspot.width * SILHOUETTE_WIDTH) / 2,
                          top: hotspot.y * SILHOUETTE_HEIGHT - (hotspot.height * SILHOUETTE_HEIGHT) / 2,
                          width: hotspot.width * SILHOUETTE_WIDTH,
                          height: hotspot.height * SILHOUETTE_HEIGHT,
                          borderColor: selected ? `${zoneColor}AA` : 'rgba(255,255,255,0.12)',
                          backgroundColor: selected ? `${zoneColor}22` : 'rgba(255,255,255,0.03)',
                        },
                      ]}
                      onPress={() => handleZonePress(hotspot.zoneId)}
                      accessibilityRole="button"
                      accessibilityLabel={zoneLabel(hotspot.zoneId, side)}
                    >
                      <View
                        style={[
                          styles.hotspotPulse,
                          { backgroundColor: selected ? zoneColor : 'rgba(255,255,255,0.18)' },
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Text style={styles.bodyPrompt}>
              Tap the part of the body where the feeling is most noticeable.
            </Text>
            </VelvetGlassSurface>
          </Animated.View>

          {/* Selected zone pill */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.selectionRow}>
            {selectedZoneLabel ? (
              <VelvetGlassSurface style={[styles.selectionPill, { borderColor: `${activeEmotionColor}55` }]} intensity={24} backgroundColor="rgba(255,255,255,0.04)">
                <View style={[styles.selectionDot, { backgroundColor: activeEmotionColor }]} />
                <Text style={[styles.selectionText, { color: activeEmotionColor }]}>
                  {selectedZoneLabel}
                </Text>
                <Pressable onPress={() => setSelectedRegion(null)} hitSlop={10}>
                  <Text style={styles.selectionClear}>×</Text>
                </Pressable>
              </VelvetGlassSurface>
            ) : (
              <Text style={styles.tapHint}>Tap a body region to begin</Text>
            )}
          </Animated.View>

          {/* Emotion selector */}
          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>EMOTION PRESENT</Text>
            <EditorialPillGrid
              style={styles.emotionWrap}
              items={[
                ...(showMoreEmotions ? [...EMOTIONS_CORE, ...EMOTIONS_EXTENDED] : EMOTIONS_CORE).map((em) => ({
                  key: em,
                  label: em,
                  selected: selectedEmotion === em,
                  accentColor: EMOTION_COLORS[em] ?? PALETTE.sage,
                  selectedBackgroundColor: '#D4AF37',
                  onPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedEmotion(selectedEmotion === em ? null : em);
                  },
                  labelStyle: styles.emotionText,
                  selectedLabelStyle: styles.emotionTextSelected,
                })),
                {
                  key: 'toggle-emotions',
                  label: showMoreEmotions ? '− Less' : '+ More',
                  variant: 'utility',
                  style: styles.emotionMoreBtn,
                  labelStyle: styles.emotionMoreText,
                  onPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setShowMoreEmotions((prev) => !prev);
                  },
                },
              ]}
            />
          </Animated.View>

          {/* Intensity */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>INTENSITY</Text>
            <View style={styles.intensityRow}>
              {[1, 2, 3, 4, 5].map((v) => (
                <Pressable
                  key={v}
                  style={[styles.intensityDot, v <= intensity && styles.intensityDotFilled]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setIntensity(v);
                  }}
                />
              ))}
              <Text style={styles.intensityLabel}>
                {['Subtle', 'Mild', 'Moderate', 'Strong', 'Intense'][intensity - 1]}
              </Text>
            </View>
          </Animated.View>

          {/* Log button */}
          {(selectedRegion || selectedEmotion) && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.logRow}>
              <Pressable
                style={[styles.logBtn, (!selectedRegion || !selectedEmotion) && styles.logBtnDim]}
                onPress={logEntry}
                disabled={!selectedRegion || !selectedEmotion}
              >
                <MetallicText style={styles.logBtnText} color="#0A0A0F">
                  Log This Sensation
                </MetallicText>
              </Pressable>
            </Animated.View>
          )}

          {/* Entry history */}
          {entries.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.historySection}>
              <Text style={styles.sectionLabel}>RECENT ENTRIES</Text>
              <View style={styles.entryList}>
                {entries.slice(0, 20).map((entry) => {
                  const color = EMOTION_COLORS[entry.emotion] ?? PALETTE.sage;
                  return (
                    <Pressable
                      key={entry.id}
                      style={styles.entryRow}
                      onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                        deleteEntry(entry.id);
                      }}
                    >
                      <View style={[styles.entryDot, { backgroundColor: color }]} />
                      <View style={styles.entryMeta}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <MetallicText style={styles.entryMain} color={color}>{entry.emotion}</MetallicText>
                          <Text style={styles.entryMain}> · {zoneLabel(entry.region, entry.side)}</Text>
                        </View>
                        <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      </View>
                      <View style={styles.entryIntensity}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <View
                            key={i}
                            style={[styles.intensityPip, i < entry.intensity && { backgroundColor: color }]}
                          />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: PALETTE.bg },
  safeArea:   { flex: 1 },
  topGlow:    { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  header:     { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 10 },
  titleArea:  { paddingHorizontal: 24, paddingBottom: 0, marginBottom: 34 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: {
    fontSize: 26,
    color: PALETTE.textMain,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 31,
    marginBottom: 6,
    maxWidth: '82%',
  },
  headerSubtitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.68)' },

  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
    alignSelf: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  // Front / Back toggle
  sideToggle: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  sideBtn: {
    minWidth: 88,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  sideBtnText:       { fontSize: 13, color: 'rgba(255,255,255,0.58)', fontWeight: '700', letterSpacing: 0.2 },
  sideBtnTextActive: { color: '#0A0A0F' },

  // Body
  bodyWrap: {
    position: 'relative',
    alignItems: 'center',
    borderRadius: 30,
    paddingVertical: 26,
    paddingHorizontal: 24,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#D9BF8C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 6,
  },
  bodyAura: {
    position: 'absolute',
    top: 22,
    width: BODY_AURA_WIDTH,
    height: BODY_AURA_HEIGHT,
    borderRadius: BODY_AURA_WIDTH / 2,
    alignSelf: 'center',
    backgroundColor: 'rgba(140,190,170,0.055)',
    shadowColor: '#8CBEAA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
    elevation: 2,
  },
  bodyCoreGlow: {
    position: 'absolute',
    top: 54,
    width: BODY_CORE_WIDTH,
    height: BODY_CORE_HEIGHT,
    borderRadius: BODY_CORE_WIDTH / 2,
    alignSelf: 'center',
    backgroundColor: 'rgba(214,244,233,0.045)',
  },
  bodyFrame: {
    width: SILHOUETTE_WIDTH,
    height: SILHOUETTE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotLayer: {
    position: 'absolute',
    width: SILHOUETTE_WIDTH,
    height: SILHOUETTE_HEIGHT,
  },
  hotspot: {
    position: 'absolute',
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotPulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  bodyPrompt: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(232,240,248,0.7)',
    textAlign: 'center',
    maxWidth: 260,
  },

  // Selection indicator
  selectionRow: {
    alignItems: 'center',
    marginBottom: 4,
    minHeight: 36,
  },
  selectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  selectionDot:  { width: 7, height: 7, borderRadius: 3.5 },
  selectionText: { fontSize: 11, fontWeight: '600' },
  selectionClear:{ fontSize: 18, color: 'rgba(255,255,255,0.58)', lineHeight: 20 },
  tapHint:       { fontSize: 12, color: 'rgba(255,255,255,0.58)' },

  sectionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.62)',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 16,
  },

  emotionWrap: { justifyContent: 'center' },
  emotionMoreBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  emotionMoreText: { fontSize: 11, color: 'rgba(255,255,255,0.68)', fontWeight: '700', letterSpacing: 0.5 },
  emotionText: { fontSize: 13, color: 'rgba(226,232,240,0.82)', fontWeight: '600', textAlign: 'center' },
  emotionTextSelected: { color: '#0A0A0F' },

  intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  intensityDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  intensityDotFilled: {
    backgroundColor: 'rgba(217,191,140,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    shadowColor: '#D9BF8C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 4,
  },
  intensityLabel: { fontSize: 12, color: 'rgba(255,255,255,0.62)', marginLeft: 6 },

  logRow: { marginTop: 28, alignItems: 'center' },
  logBtn: {
    paddingVertical: 14, paddingHorizontal: 36, borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#D4AF37',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6,
  },
  logBtnDim:  { opacity: 0.5 },
  logBtnText: { fontSize: 14, color: '#0A0A0F', fontWeight: '800', letterSpacing: 0.4 },

  historySection: { marginTop: 36 },
  entryList:      { gap: 8 },
  entryRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 20, paddingVertical: 16, gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  entryDot:  { width: 8, height: 8, borderRadius: 4 },
  entryMeta: { flex: 1 },
  entryMain: { fontSize: 13, color: PALETTE.textMuted, marginBottom: 2 },
  entryDate: { fontSize: 11, color: 'rgba(255,255,255,0.46)' },
  entryIntensity: { flexDirection: 'row', gap: 3 },
  intensityPip: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
