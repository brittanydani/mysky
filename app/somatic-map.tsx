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
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';

import Body, { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';

const { width: SCREEN_W } = Dimensions.get('window');
const STORAGE_KEY = '@mysky:somatic_entries';

// Body SVG is 200px wide at scale=1; target ~55% of screen width
const BODY_SCALE = (SCREEN_W * 0.55) / 200;

const PALETTE = {
  sage:        '#8CBEAA',
  textMain:    '#FFFFFF',
  textMuted:   'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg:          '#0A0A0C',
};

const EMOTIONS = [
  'Anxiety', 'Sadness', 'Anger',     'Joy',
  'Fear',    'Peace',   'Tension',   'Numbness',
  'Grief',   'Excitement', 'Shame',  'Love',
];

const EMOTION_COLORS: Record<string, string> = {
  Anxiety:    '#D9BF8C', Sadness: '#8BC4E8', Anger:    '#D4A3B3', Joy:       '#8CBEAA',
  Fear:       '#A89BC8', Peace:   '#6EBF8B', Tension:  '#D98C8C', Numbness:  '#6E8CB4',
  Grief:      '#9E8FB8', Excitement: '#E8C97A', Shame: '#B87EA0', Love:      '#E8A3B3',
};

// Sage heat steps: low → high
const HEAT_COLORS: readonly string[] = [
  'rgba(140,190,170,0.30)',
  'rgba(140,190,170,0.62)',
  'rgba(140,190,170,0.92)',
];

interface Zone {
  id: string;
  frontLabel: string;
  backLabel:  string;
  frontSlugs: Slug[];
  backSlugs:  Slug[];
}

const ZONES: Zone[] = [
  { id: 'head',   frontLabel: 'Head & Mind',    backLabel: 'Back of Head',       frontSlugs: ['head', 'hair'],                                            backSlugs: ['hair'] },
  { id: 'throat', frontLabel: 'Throat & Jaw',   backLabel: 'Neck & Trapezius',   frontSlugs: ['neck', 'trapezius'],                                       backSlugs: ['neck', 'trapezius'] },
  { id: 'chest',  frontLabel: 'Chest & Heart',  backLabel: 'Upper Back',         frontSlugs: ['chest', 'deltoids'],                                       backSlugs: ['upper-back', 'deltoids'] },
  { id: 'arms',   frontLabel: 'Arms & Hands',   backLabel: 'Arms & Hands',       frontSlugs: ['biceps', 'triceps', 'forearm', 'hands'],                   backSlugs: ['triceps', 'forearm', 'hands'] },
  { id: 'gut',    frontLabel: 'Gut & Belly',    backLabel: '',                   frontSlugs: ['abs', 'obliques'],                                         backSlugs: [] },
  { id: 'back',   frontLabel: 'Hips & Pelvis',  backLabel: 'Lower Back & Glutes', frontSlugs: ['adductors'],                                              backSlugs: ['lower-back', 'gluteal', 'adductors'] },
  { id: 'limbs',  frontLabel: 'Legs & Feet',    backLabel: 'Hamstrings & Calves', frontSlugs: ['quadriceps', 'tibialis', 'knees', 'ankles', 'feet', 'calves'], backSlugs: ['hamstring', 'calves', 'feet'] },
];

// Flat slug → zone ID lookup (built once at module level)
const SLUG_TO_ZONE: Record<string, string> = {};
ZONES.forEach((z) => {
  [...z.frontSlugs, ...z.backSlugs].forEach((s) => { SLUG_TO_ZONE[s] = z.id; });
});

interface SomaticEntry {
  id: string;
  date: string;
  region: string;
  side?: 'front' | 'back';
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

  useFocusEffect(
    useCallback(() => {
      EncryptedAsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) { try { setEntries(JSON.parse(raw)); } catch {} }
      });
    }, []),
  );

  const activeEmotionColor =
    (selectedEmotion && EMOTION_COLORS[selectedEmotion]) || PALETTE.sage;

  // Build Body component data — nothing is highlighted until the user taps a region.
  const bodyData = useMemo<ExtendedBodyPart[]>(() => {
    if (!selectedRegion) return [];

    const zone = ZONES.find((z) => z.id === selectedRegion);
    if (!zone) return [];

    const slugs = side === 'front' ? zone.frontSlugs : zone.backSlugs;
    return slugs.map((slug) => ({ slug, styles: { fill: activeEmotionColor } }));
  }, [selectedRegion, activeEmotionColor, side]);

  const handleBodyPartPress = (bodyPart: ExtendedBodyPart) => {
    if (!bodyPart.slug) return;
    const zoneId = SLUG_TO_ZONE[bodyPart.slug];
    if (!zoneId) return;
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
      <LinearGradient colors={['rgba(140,190,170,0.07)', 'transparent']} style={styles.topGlow} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          style={styles.backBtn}
          onPress={() => { Haptics.selectionAsync().catch(() => {}); if (router.canGoBack()) router.back(); }}
        >
          <MetallicText style={styles.backText} variant="green">← Body & Nervous System</MetallicText>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.headerTitle}>Somatic Map</Text>
            <GoldSubtitle style={styles.headerSubtitle}>Where emotions live in your body</GoldSubtitle>
          </Animated.View>

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
          <Animated.View entering={FadeInDown.delay(160).duration(500)} style={styles.bodyWrap}>
            <Body
              key={`${side}-${gender}`}
              data={bodyData}
              scale={BODY_SCALE}
              side={side}
              gender={gender}
              colors={HEAT_COLORS}
              defaultFill="rgba(22,34,58,0.9)"
              defaultStroke="rgba(255,255,255,0.13)"
              defaultStrokeWidth={0.8}
              border="rgba(255,255,255,0.20)"
              onBodyPartPress={handleBodyPartPress}
            />
          </Animated.View>

          {/* Selected zone pill */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.selectionRow}>
            {selectedZoneLabel ? (
              <View style={[styles.selectionPill, { borderColor: `${activeEmotionColor}55` }]}>
                <View style={[styles.selectionDot, { backgroundColor: activeEmotionColor }]} />
                <Text style={[styles.selectionText, { color: activeEmotionColor }]}>
                  {selectedZoneLabel}
                </Text>
                <Pressable onPress={() => setSelectedRegion(null)} hitSlop={10}>
                  <Text style={styles.selectionClear}>×</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.tapHint}>Tap a body region to begin</Text>
            )}
          </Animated.View>

          {/* Emotion selector */}
          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>EMOTION PRESENT</Text>
            <View style={styles.emotionWrap}>
              {EMOTIONS.map((em) => {
                const isSelected = selectedEmotion === em;
                const color = EMOTION_COLORS[em] ?? PALETTE.sage;
                return (
                  <Pressable
                    key={em}
                    style={[
                      styles.emotionChip,
                      isSelected && { borderColor: `${color}70`, backgroundColor: `${color}18` },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setSelectedEmotion(isSelected ? null : em);
                    }}
                  >
                    {isSelected
                      ? <MetallicText style={styles.emotionText} color={color}>{em}</MetallicText>
                      : <Text style={styles.emotionText}>{em}</Text>
                    }
                  </Pressable>
                );
              })}
            </View>
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
                <LinearGradient
                  colors={['rgba(140,190,170,0.3)', 'rgba(140,190,170,0.1)']}
                  style={StyleSheet.absoluteFill}
                />
                <MetallicText style={styles.logBtnText} color={PALETTE.sage}>
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
  topGlow:    { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },

  backBtn:  { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: 'rgba(140,190,170,0.7)', fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  header:        { marginBottom: 24 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14 },

  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    alignSelf: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  // Front / Back toggle
  sideToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  sideBtn: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  sideBtnActive: {
    borderColor: 'rgba(140,190,170,0.55)',
    backgroundColor: 'rgba(140,190,170,0.10)',
  },
  sideBtnText:       { fontSize: 13, color: 'rgba(255,255,255,0.40)', fontWeight: '600' },
  sideBtnTextActive: { color: '#8CBEAA' },

  // Body
  bodyWrap: {
    alignItems: 'center',
    marginBottom: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  selectionDot:  { width: 7, height: 7, borderRadius: 3.5 },
  selectionText: { fontSize: 11, fontWeight: '600' },
  selectionClear:{ fontSize: 18, color: 'rgba(255,255,255,0.35)', lineHeight: 20 },
  tapHint:       { fontSize: 12, color: 'rgba(255,255,255,0.25)',  },

  sectionLabel: {
    fontSize: 19,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 20,
  },

  emotionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emotionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emotionText: { fontSize: 11, color: PALETTE.textMuted },

  intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  intensityDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  intensityDotFilled: { backgroundColor: PALETTE.sage, borderColor: PALETTE.sage },
  intensityLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 6 },

  logRow: { marginTop: 28, alignItems: 'center' },
  logBtn: {
    height: 50, paddingHorizontal: 36, borderRadius: 25,
    overflow: 'hidden', borderWidth: 1,
    borderColor: 'rgba(140,190,170,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  logBtnDim:  { opacity: 0.5 },
  logBtnText: { fontSize: 14, color: PALETTE.sage, fontWeight: '700' },

  historySection: { marginTop: 36 },
  entryList:      { gap: 8 },
  entryRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  entryDot:  { width: 8, height: 8, borderRadius: 4 },
  entryMeta: { flex: 1 },
  entryMain: { fontSize: 13, color: PALETTE.textMuted, marginBottom: 2 },
  entryDate: { fontSize: 11, color: 'rgba(255,255,255,0.25)' },
  entryIntensity: { flexDirection: 'row', gap: 3 },
  intensityPip: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
