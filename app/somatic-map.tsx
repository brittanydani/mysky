// app/somatic-map.tsx
// MySky — Somatic Map
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged legacy "Muddy Gold" remnants from background fills and pips.
// 2. Implemented "Midnight Slate" for the main body map anchor card.
// 3. Refined "Bioluminescent Hotspots" with high-contrast active glows.
// 4. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 5. Assigned Sage and Atmosphere Blue for silhouette depth and auxiliary navigation.

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
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const STORAGE_KEY = '@mysky:somatic_entries';
const SILHOUETTE_WIDTH = Math.min(SCREEN_W - 132, 220);
const SILHOUETTE_HEIGHT = 470;

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Interaction highlights
  atmosphere: '#A2C2E1', // Coarse silhouette glow
  sage: '#6B9080',       // Background aura
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
};

const EMOTION_COLORS: Record<string, string> = {
  Anxiety: '#A2C2E1', Sadness: '#5C7CAA', Anger: '#DC5050', Joy: '#D4AF37',
  Fear: '#A88BEB', Peace: '#6B9080', Tension: '#CD7F5D', Numbness: '#2C3645',
  Grief: '#5E3B8F', Excitement: '#F4E6BC', Shame: '#8B2121', Love: '#D4A0A0',
  Grounded: '#2A4E38', Disconnection: '#1A1E29', Irritability: '#8B2121', Restlessness: '#CD7F5D',
};

const ZONES = [
  { id: 'head', frontLabel: 'Head & Mind', backLabel: 'Back of Head' },
  { id: 'throat', frontLabel: 'Throat & Jaw', backLabel: 'Neck' },
  { id: 'chest', frontLabel: 'Chest & Heart', backLabel: 'Upper Back' },
  { id: 'arms', frontLabel: 'Arms & Hands', backLabel: 'Arms & Hands' },
  { id: 'gut', frontLabel: 'Gut & Belly', backLabel: '' },
  { id: 'back', frontLabel: 'Hips & Pelvis', backLabel: 'Lower Back' },
  { id: 'limbs', frontLabel: 'Legs & Feet', backLabel: 'Calves' },
];

const SILHOUETTE_PATHS: any = {
  female: {
    front: 'M100 18 C84 18 71 31 70 49 C69 66 76 82 82 96 C68 111 59 127 57 149 C55 176 64 198 74 220 C80 235 82 255 80 278 C78 310 72 356 66 430 C62 477 68 527 80 582 C87 612 90 648 88 690 C87 722 91 750 100 776 C109 750 113 722 112 690 C110 648 113 612 120 582 C132 527 138 477 134 430 C128 356 122 310 120 278 C118 255 120 235 126 220 C136 198 145 176 143 149 C141 127 132 111 118 96 C124 82 131 66 130 49 C129 31 116 18 100 18 Z M82 99 C67 101 54 111 44 126 C34 143 29 165 31 187 C33 210 42 229 53 245 C60 256 63 270 61 288 C59 305 55 327 58 350 C61 378 70 401 80 420 C84 383 87 338 86 300 C85 266 79 232 76 198 C73 163 76 125 82 99 Z M118 99 C133 101 146 111 156 126 C166 143 171 165 169 187 C167 210 158 229 147 245 C140 256 137 270 139 288 C141 305 145 327 142 350 C139 378 130 401 120 420 C116 383 113 338 114 300 C115 266 121 232 124 198 C127 163 124 125 118 99 Z',
    back: 'M100 18 C84 18 71 31 70 49 C69 67 76 83 84 96 C74 106 66 120 63 138 C58 170 66 197 76 220 C82 234 84 253 82 274 C79 307 72 355 67 432 C64 483 69 533 81 586 C88 614 91 649 89 689 C88 721 91 749 100 776 C109 749 112 721 111 689 C109 649 112 614 119 586 C131 533 136 483 133 432 C128 355 121 307 118 274 C116 253 118 234 124 220 C134 197 142 170 137 138 C134 120 126 106 116 96 C124 83 131 67 130 49 C129 31 116 18 100 18 Z M84 104 C75 111 68 121 64 135 C57 162 62 188 72 208 C78 220 81 236 80 255 C78 293 72 339 68 394 C72 376 77 359 83 344 C89 327 90 306 88 282 C85 238 82 154 84 104 Z M116 104 C125 111 132 121 136 135 C143 162 138 188 128 208 C122 220 119 236 120 255 C122 293 128 339 132 394 C128 376 123 359 117 344 C111 327 110 306 112 282 C115 238 118 154 116 104 Z',
  },
  male: {
    front: 'M100 18 C84 18 70 31 69 50 C68 69 77 85 84 98 C71 112 62 130 60 154 C58 183 67 205 79 229 C86 244 89 264 87 286 C84 321 77 374 71 442 C67 493 72 548 83 603 C89 633 92 667 91 707 C90 733 93 757 100 776 C107 757 110 733 109 707 C108 667 111 633 117 603 C128 548 133 493 129 442 C123 374 116 321 113 286 C111 264 114 244 121 229 C133 205 142 183 140 154 C138 130 129 112 116 98 C123 85 132 69 131 50 C130 31 116 18 100 18 Z M84 101 C64 104 48 117 37 135 C26 154 22 178 25 203 C28 228 39 247 52 264 C60 274 64 289 63 309 C61 329 58 353 62 378 C66 406 74 430 82 450 C87 413 90 361 89 322 C88 281 82 241 79 205 C76 165 78 127 84 101 Z M116 101 C136 104 152 117 163 135 C174 154 178 178 175 203 C172 228 161 247 148 264 C140 274 136 289 137 309 C139 329 142 353 138 378 C134 406 126 430 118 450 C113 413 110 361 111 322 C112 281 118 241 121 205 C124 165 122 127 116 101 Z',
    back: 'M100 18 C84 18 70 31 69 50 C68 69 77 85 86 98 C75 109 67 123 64 142 C59 175 67 202 79 226 C85 239 88 258 86 281 C83 317 77 370 72 445 C68 497 73 552 84 607 C90 637 93 670 92 709 C91 734 94 758 100 776 C106 758 109 734 108 709 C107 670 110 637 116 607 C127 552 132 497 128 445 C123 370 117 317 114 281 C112 258 115 239 121 226 C133 202 141 175 136 142 C133 123 125 109 114 98 C123 85 132 69 131 50 C130 31 116 18 100 18 Z M86 106 C75 114 67 126 63 143 C56 171 62 198 72 220 C78 232 81 248 80 269 C79 306 73 350 70 401 C74 383 79 366 85 349 C91 332 93 311 91 286 C88 244 84 160 86 106 Z M114 106 C125 114 133 126 137 143 C144 171 138 198 128 220 C122 232 119 248 120 269 C121 306 127 350 130 401 C126 383 121 366 115 349 C109 332 107 311 109 286 C112 244 116 160 114 106 Z',
  },
};
const HOTSPOTS: any = {
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

export default function SomaticMapScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();

  const [entries, setEntries] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [gender, setGender] = useState<'female' | 'male'>('female');

  useFocusEffect(useCallback(() => {
    EncryptedAsyncStorage.getItem(STORAGE_KEY).then(raw => raw && setEntries(JSON.parse(raw))).catch(e => logger.warn(e));
  }, []));

  const activeColor = selectedEmotion ? EMOTION_COLORS[selectedEmotion] : PALETTE.sage;

  const logEntry = async () => {
    if (!selectedRegion || !selectedEmotion) return;
    const entry = { id: Date.now().toString(), date: new Date().toISOString(), region: selectedRegion, side, gender, emotion: selectedEmotion, intensity };
    const updated = [entry, ...entries];
    setEntries(updated);
    await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSelectedRegion(null); setSelectedEmotion(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient colors={['rgba(107, 144, 128, 0.12)', 'transparent']} style={styles.topGlow} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
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
                <Pressable key={s} onPress={() => setSide(s)} style={[styles.toggleBtn, side === s && styles.toggleBtnActive]}>
                  <Text style={[styles.toggleBtnText, side === s && { color: '#0A0A0F' }]}>{s.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.hardwareToggle}>
              {['female', 'male'].map((g: any) => (
                <Pressable key={g} onPress={() => setGender(g)} style={[styles.toggleBtn, gender === g && styles.toggleBtnActive]}>
                  <Text style={[styles.toggleBtnText, gender === g && { color: '#0A0A0F' }]}>{g.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Main Map (Midnight Slate Anchor) */}
          <VelvetGlassSurface style={styles.bodyWrap} intensity={45} backgroundColor={theme.cardSurfaceValues}>
            <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
            <View style={styles.bodyFrame}>
              <Svg width={SILHOUETTE_WIDTH} height={SILHOUETTE_HEIGHT} viewBox="0 0 200 776" preserveAspectRatio="xMidYMid meet">
                <Path d={SILHOUETTE_PATHS[gender][side]} fill="rgba(162, 194, 225, 0.15)" stroke="rgba(255, 255, 255, 0.25)" strokeWidth={1.5} />
              </Svg>
              <View style={styles.hotspotLayer}>
                {HOTSPOTS[gender][side].map((h: any) => {
                  const sel = selectedRegion === h.zoneId;
                  return (
                    <Pressable key={h.zoneId} onPress={() => setSelectedRegion(sel ? null : h.zoneId)} style={[
                      styles.hotspot, 
                      { left: h.x * SILHOUETTE_WIDTH - (h.width * SILHOUETTE_WIDTH) / 2, top: h.y * SILHOUETTE_HEIGHT - (h.height * SILHOUETTE_HEIGHT) / 2, width: h.width * SILHOUETTE_WIDTH, height: h.height * SILHOUETTE_HEIGHT },
                      sel ? { borderColor: activeColor, backgroundColor: `${activeColor}20`, transform: [{scale: 1.1}] } : styles.hotspotRecessed
                    ]}>
                      <View style={[styles.hotspotPulse, { backgroundColor: sel ? activeColor : 'rgba(255,255,255,0.1)' }]} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </VelvetGlassSurface>

          {/* Emotion Pill Cloud (Recessed vs Raised) */}
          <Text style={styles.sectionLabel}>EMOTION PRESENT</Text>
          <View style={styles.pillCloud}>
            {Object.keys(EMOTION_COLORS).slice(0, 12).map(em => (
              <Pressable key={em} onPress={() => setSelectedEmotion(selectedEmotion === em ? null : em)} style={[
                styles.emotionPill,
                selectedEmotion === em ? { backgroundColor: EMOTION_COLORS[em], borderColor: EMOTION_COLORS[em] } : styles.pillRecessed
              ]}>
                <Text style={[styles.emotionText, selectedEmotion === em && { color: '#0A0A0F', fontWeight: '800' }]}>{em}</Text>
              </Pressable>
            ))}
          </View>

          {/* Log Entry Action */}
          {(selectedRegion && selectedEmotion) && (
            <Animated.View entering={FadeIn} style={styles.logRow}>
              <Pressable style={[styles.logBtn, styles.velvetBorder]} onPress={logEntry}>
                <LinearGradient colors={['rgba(44, 54, 69, 0.95)', 'rgba(26, 30, 41, 0.60)']} style={StyleSheet.absoluteFill} />
                <MetallicText style={styles.logBtnText} variant="gold">LOG SENSATION</MetallicText>
              </Pressable>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  header: { paddingHorizontal: 24, paddingVertical: 8 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  titleArea: { paddingHorizontal: 24, marginBottom: 32 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
  headerSubtitle: { fontSize: 13, marginTop: 4 },
  
  toggleRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 24 },
  hardwareToggle: { flexDirection: 'row', padding: 4, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  toggleBtnActive: { backgroundColor: '#FFF' },
  toggleBtnText: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },

  bodyWrap: { borderRadius: 32, paddingVertical: 32, marginBottom: 32, alignItems: 'center', overflow: 'hidden' },
  bodyFrame: { position: 'relative' },
  hotspotLayer: { ...StyleSheet.absoluteFillObject },
  hotspot: { position: 'absolute', borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  hotspotRecessed: { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.05)' },
  hotspotPulse: { width: 6, height: 6, borderRadius: 3 },

  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 16, marginLeft: 24 },
  pillCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 24 },
  emotionPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  pillRecessed: { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.05)' },
  emotionText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  logRow: { paddingHorizontal: 24, marginTop: 40 },
  logBtn: { height: 56, borderRadius: 28, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  logBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
