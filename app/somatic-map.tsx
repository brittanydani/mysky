// app/somatic-map.tsx
// MySky — Somatic Map
// Log where emotions live in the body. Builds a heatmap over time.
// All entries stored locally via AsyncStorage. Nothing transmitted.

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import {
  SkiaSomaticBody,
  SOMATIC_REGION_IDS,
  SOMATIC_REGION_LABEL,
} from '../components/ui/SkiaSomaticBody';

const STORAGE_KEY = '@mysky:somatic_entries';

const PALETTE = {
  sage: '#8CBEAA',
  gold: '#D9BF8C',
  rose: '#D4A3B3',
  silverBlue: '#8BC4E8',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#0A0A0C',
};

const EMOTIONS = [
  'Anxiety', 'Sadness', 'Anger', 'Joy',
  'Fear', 'Peace', 'Tension', 'Numbness',
  'Grief', 'Excitement', 'Shame', 'Love',
];

const EMOTION_COLORS: Record<string, string> = {
  Anxiety: '#D9BF8C', Sadness: '#8BC4E8', Anger: '#D4A3B3', Joy: '#8CBEAA',
  Fear: '#A89BC8',    Peace: '#6EBF8B',   Tension: '#D98C8C', Numbness: '#6E8CB4',
  Grief: '#9E8FB8',   Excitement: '#E8C97A', Shame: '#B87EA0', Love: '#E8A3B3',
};

interface SomaticEntry {
  id: string;
  date: string;
  region: string;
  emotion: string;
  intensity: number;
  note?: string;
}

export default function SomaticMapScreen() {
  const router = useRouter();

  const [entries, setEntries] = useState<SomaticEntry[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(3);
  const [sparkleRegion, setSparkleRegion] = useState<string | null>(null);
  const [sparkleColor, setSparkleColor] = useState<string>(PALETTE.sage);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) {
          try { setEntries(JSON.parse(raw)); } catch {}
        }
      });
    }, []),
  );

  // Resolved emotion color — updates Skia canvas glow in real-time as user selects
  const activeEmotionColor =
    (selectedEmotion && EMOTION_COLORS[selectedEmotion]) || PALETTE.sage;

  const logEntry = async () => {
    if (!selectedRegion || !selectedEmotion) return;
    // Capture before clearing — used for sparkle burst
    const loggedRegion = selectedRegion;
    const loggedColor = activeEmotionColor;
    const newEntry: SomaticEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      region: selectedRegion,
      emotion: selectedEmotion,
      intensity,
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      Alert.alert('Error', 'Could not save entry. Please try again.');
      setEntries(entries);
      return;
    }
    setSelectedRegion(null);
    setSelectedEmotion(null);
    setIntensity(3);
    setSparkleColor(loggedColor);
    setSparkleRegion(loggedRegion);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  // Heatmap — memoized so SkiaSomaticBody only re-runs its useEffects when entries change
  const regionCounts = useMemo(
    () =>
      SOMATIC_REGION_IDS.reduce<Record<string, number>>((acc, id) => {
        acc[id] = entries.filter((e) => e.region === id).length;
        return acc;
      }, {}),
    [entries],
  );

  const maxCount = useMemo(
    () => Math.max(...Object.values(regionCounts), 1),
    [regionCounts],
  );

  const handleRegionPress = (id: string) => {
    setSelectedRegion((prev) => (prev === id ? null : id));
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient
        colors={['rgba(140,190,170,0.07)', 'transparent']}
        style={styles.topGlow}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable
          style={styles.backBtn}
          onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
        >
          <Text style={styles.backText}>← Body & Nervous System</Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.header}>
            <Text style={styles.headerTitle}>Somatic Map</Text>
            <GoldSubtitle style={styles.headerSubtitle}>Where emotions live in your body</GoldSubtitle>
          </Animated.View>

          {/* Skia body silhouette — GPU-rendered heat map + selection glow */}
          <Animated.View entering={FadeInDown.delay(140).duration(500)}>
            <Text style={styles.sectionLabel}>BODY REGION — tap to select</Text>
            <SkiaSomaticBody
              regionCounts={regionCounts}
              maxCount={maxCount}
              selectedRegion={selectedRegion}
              emotionColor={activeEmotionColor}
              onRegionPress={handleRegionPress}
              sparkleRegion={sparkleRegion}
              sparkleColor={sparkleColor}
              onSparkleComplete={() => setSparkleRegion(null)}
            />
          </Animated.View>

          {/* Emotion selector */}
          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>EMOTION PRESENT</Text>
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
                    <Text style={[styles.emotionText, isSelected && { color }]}>{em}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Intensity */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>INTENSITY</Text>
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
                {intensity === 1 ? 'Subtle' : intensity === 2 ? 'Mild' : intensity === 3 ? 'Moderate' : intensity === 4 ? 'Strong' : 'Intense'}
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
                <Text style={styles.logBtnText}>Log This Sensation</Text>
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
                  const regionLabel = SOMATIC_REGION_LABEL[entry.region] ?? entry.region;
                  return (
                    <View key={entry.id} style={styles.entryRow}>
                      <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
                      <View style={[styles.entryDot, { backgroundColor: color }]} />
                      <View style={styles.entryMeta}>
                        <Text style={styles.entryMain}>
                          <Text style={{ color }}>{entry.emotion}</Text>
                          {' · '}
                          {regionLabel}
                        </Text>
                        <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      </View>
                      <View style={styles.entryIntensity}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.intensityPip,
                              i < entry.intensity && { backgroundColor: color },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
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
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },

  backBtn: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4 },
  backText: { fontSize: 14, color: 'rgba(140,190,170,0.7)', fontWeight: '600' },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  header: { marginBottom: 32 },
  headerTitle: {
    fontSize: 34,
    color: PALETTE.textMain,
    fontFamily: 'Georgia',
    fontWeight: '300',
    marginBottom: 8,
  },
  headerSubtitle: { fontSize: 14, color: PALETTE.sage },

  sectionLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  emotionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emotionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emotionText: { fontSize: 13, color: PALETTE.textMuted },

  intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  intensityDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  intensityDotFilled: {
    backgroundColor: PALETTE.sage,
    borderColor: PALETTE.sage,
  },
  intensityLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 6 },

  logRow: { marginTop: 28, alignItems: 'center' },
  logBtn: {
    height: 50,
    paddingHorizontal: 36,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(140,190,170,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logBtnDim: { opacity: 0.5 },
  logBtnText: { fontSize: 14, color: PALETTE.sage, fontWeight: '700' },

  historySection: { marginTop: 36 },
  entryList: { gap: 8 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  entryDot: { width: 8, height: 8, borderRadius: 4 },
  entryMeta: { flex: 1 },
  entryMain: { fontSize: 13, color: PALETTE.textMuted, marginBottom: 2 },
  entryDate: { fontSize: 11, color: 'rgba(255,255,255,0.25)' },
  entryIntensity: { flexDirection: 'row', gap: 3 },
  intensityPip: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
