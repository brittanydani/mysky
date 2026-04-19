// app/somatic-map.tsx
// MySky — Somatic Map
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged legacy "Muddy Gold" remnants from background fills and pips.
// 2. Implemented "Midnight Slate" for the main body map anchor card.
// 3. Refined "Bioluminescent Hotspots" with high-contrast active glows.
// 4. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 5. Assigned Sage and Atmosphere Blue for silhouette depth and auxiliary navigation.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import Body, { Slug } from 'react-native-body-highlighter';
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
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const STORAGE_KEY = '@mysky:somatic_entries';
const FIGURE_WIDTH = Math.min(SCREEN_W - 96, 200);
const BODY_SCALE = FIGURE_WIDTH / 200;

const EMOTION_COLORS: Record<string, string> = {
  Anxiety: '#A2C2E1', Sadness: '#5C7CAA', Anger: '#DC5050', Joy: '#D4AF37',
  Fear: '#A88BEB', Peace: '#6B9080', Grief: '#B48AD4', Excitement: '#F4E6BC',
  Shame: '#D46B6B', Love: '#D4A0A0', Grounded: '#4E9A6E', Disconnection: '#7A7F8E',
  Frustration: '#E07845', Loneliness: '#7B8EBF', Overwhelm: '#C47DB5', Hope: '#7EC8A0',
  Vulnerability: '#C9A0D4',
};

const SENSATION_COLORS: Record<string, string> = {
  Tension: '#CD7F5D', Numbness: '#8A92A1', Tingling: '#A88BEB', Warmth: '#D4AF37',
  Heaviness: '#5C7CAA', Lightness: '#F4E6BC', Pressure: '#D46B6B', Restlessness: '#CD7F5D',
  Pulsing: '#A2C2E1', Chill: '#6B9080', Aching: '#D4A0A0',
  Fluttering: '#E0A4C8', Burning: '#E06040', Hollowness: '#7A7F8E', Shakiness: '#B8A0D4',
  Nausea: '#8BAA7A',
};

export default function SomaticMapScreen() {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const router = useRouter();

  const [entries, setEntries] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedSensation, setSelectedSensation] = useState<string | null>(null);
  const [intensity] = useState(3);
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [gender, setGender] = useState<'female' | 'male'>('female');

  useFocusEffect(useCallback(() => {
    EncryptedAsyncStorage.getItem(STORAGE_KEY).then(raw => raw && setEntries(JSON.parse(raw))).catch(e => logger.warn(e));
  }, []));

  const logEntry = async () => {
    if (!selectedRegion || !selectedEmotion) return;
    const entry = { id: Date.now().toString(), date: new Date().toISOString(), region: selectedRegion, side, gender, emotion: selectedEmotion, sensation: selectedSensation, intensity };
    const updated = [entry, ...entries];
    setEntries(updated);
    await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSelectedRegion(null); setSelectedEmotion(null); setSelectedSensation(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Delete Sensation', 'Remove this entry from your log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = entries.filter(e => e.id !== id);
          setEntries(updated);
          await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient colors={['rgba(107, 144, 128, 0.12)', 'transparent']} style={styles.topGlow} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
            <MetallicIcon name="chevron-back-outline" size={22} color="#FFF" />
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Somatic Map</Text>
          <GoldSubtitle style={styles.headerSubtitle}>The body as an emotional instrument</GoldSubtitle>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Hardware Toggles */}
          <View style={styles.toggleRow}>
            <View style={styles.hardwareToggle}>
              {['front', 'back'].map((s: any) => (
                <Pressable key={s} onPress={() => setSide(s)} style={[styles.toggleBtn, side === s && styles.toggleBtnActive]} accessibilityRole="radio" accessibilityState={{ selected: side === s }} accessibilityLabel={s === 'front' ? 'Front view' : 'Back view'}>
                  <Text style={[styles.toggleBtnText, side === s && { color: theme.background }]}>{s.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.hardwareToggle}>
              {['female', 'male'].map((g: any) => (
                <Pressable key={g} onPress={() => setGender(g)} style={[styles.toggleBtn, gender === g && styles.toggleBtnActive]} accessibilityRole="radio" accessibilityState={{ selected: gender === g }} accessibilityLabel={g === 'female' ? 'Female body' : 'Male body'}>
                  <Text style={[styles.toggleBtnText, gender === g && { color: theme.background }]}>{g.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Main Map (Midnight Slate Anchor) */}
          <VelvetGlassSurface style={styles.bodyWrap} intensity={45}>
                        <Body
              key={`${side}-${gender}`}
              data={[
                { slug: 'hair' as Slug, intensity: 0, styles: { fill: 'rgba(255, 255, 255, 0.8)', stroke: 'rgba(255, 255, 255, 0.8)', strokeWidth: 2 } },
                ...(selectedRegion ? [{ slug: selectedRegion as Slug, intensity: 2 }] : []),
              ]}
              scale={BODY_SCALE}
              side={side}
              gender={gender}
              colors={['transparent', '#FFFFFF', '#FFFFFF']}
              defaultFill="transparent"
              defaultStroke="none"
              defaultStrokeWidth={0}
              border="rgba(255, 255, 255, 0.8)"
              onBodyPartPress={(p) => {
                if (p.slug) {
                  setSelectedRegion(selectedRegion === p.slug ? null : p.slug);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            />
          </VelvetGlassSurface>

          {/* Emotion Pill Cloud */}
          <Text style={styles.sectionLabel}>EMOTION</Text>
          <View style={styles.pillCloud}>
            {Object.keys(EMOTION_COLORS).map(em => (
              <Pressable key={em} onPress={() => setSelectedEmotion(selectedEmotion === em ? null : em)} style={[
                styles.emotionPill,
                { borderColor: `${EMOTION_COLORS[em]}40` },
                selectedEmotion === em && { backgroundColor: EMOTION_COLORS[em], borderColor: EMOTION_COLORS[em] }
              ]}>
                <Text style={[styles.emotionText, { color: EMOTION_COLORS[em] }, selectedEmotion === em && { color: '#0A0A0F', fontWeight: '800' }]}>{em}</Text>
              </Pressable>
            ))}
          </View>

          {/* Sensation Pill Cloud */}
          <Text style={[styles.sectionLabel, { marginTop: 28 }]}>SENSATION</Text>
          <View style={styles.pillCloud}>
            {Object.keys(SENSATION_COLORS).map(s => (
              <Pressable key={s} onPress={() => setSelectedSensation(selectedSensation === s ? null : s)} style={[
                styles.emotionPill,
                { borderColor: `${SENSATION_COLORS[s]}40` },
                selectedSensation === s && { backgroundColor: SENSATION_COLORS[s], borderColor: SENSATION_COLORS[s] }
              ]}>
                <Text style={[styles.emotionText, { color: SENSATION_COLORS[s] }, selectedSensation === s && { color: '#0A0A0F', fontWeight: '800' }]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {/* Log Entry Action */}
          {(selectedRegion && selectedEmotion) && (
            <Animated.View entering={FadeIn} style={styles.logRow}>
              <Pressable style={[styles.logBtn, { backgroundColor: theme.textInk }]} onPress={logEntry} accessibilityRole="button" accessibilityLabel="Log sensation">
                <Text style={[styles.logBtnText, { color: theme.background }]}>LOG SENSATION</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Logged Sensations */}
          {entries.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionLabel}>RECENT SENSATIONS</Text>
              {entries.slice(0, 10).map((entry, idx) => (
                <Animated.View key={entry.id} entering={FadeInDown.delay(idx * 60).duration(400)}>
                  <Pressable onLongPress={() => deleteEntry(entry.id)}>
                  <VelvetGlassSurface style={[styles.historyCard, styles.velvetBorder]} intensity={26}>
                    <View style={styles.historyHeader}>
                      <View style={[styles.emotionDot, { backgroundColor: EMOTION_COLORS[entry.emotion] || 'rgba(255,255,255,0.3)' }]} />
                      <Text style={styles.historyEmotion}>{entry.emotion}</Text>
                      <Text style={styles.historyDate}>
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' · '}
                        {new Date(entry.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.historyRegion}>{entry.region} · {entry.side}{entry.sensation ? ` · ${entry.sensation}` : ''}</Text>
                  </VelvetGlassSurface>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  velvetBorder: {
    ...theme.velvetBorder,
  },
  header: { paddingHorizontal: 24, paddingVertical: 8 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  titleArea: { paddingHorizontal: 24, marginBottom: 32 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: theme.textPrimary, letterSpacing: -1 },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 140 },
  
  toggleRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 24 },
  hardwareToggle: { flexDirection: 'row', padding: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  toggleBtnActive: { backgroundColor: theme.textInk },
  toggleBtnText: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },

  bodyWrap: { borderRadius: 32, paddingVertical: 40, marginBottom: 32, alignItems: 'center', overflow: 'hidden' },

  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 16, marginLeft: 24 },
  pillCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 24 },
  emotionPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  pillRecessed: { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.05)' },
  emotionText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  logRow: { paddingHorizontal: 24, marginTop: 40 },
  logBtn: { height: 56, borderRadius: 28, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  logBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },

  historySection: { marginTop: 40 },
  historyCard: { borderRadius: 20, padding: 20, marginBottom: 14 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emotionDot: { width: 8, height: 8, borderRadius: 4 },
  historyEmotion: { fontSize: 14, fontWeight: '700', color: theme.textPrimary, flex: 1 },
  historyDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  historyRegion: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
});
