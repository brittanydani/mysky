/**
 * SkiaBreathJournal
 * A high-end somatic journaling interface.
 * Requires 3 breath cycles to "unlock" the reflection state.
 *
 * App Store Classification: Nervous System Regulation Tool
 *   - Coherent Breathing (3 cycles) serves as a "Somatic Gate"
 *   - Skia BackdropBlur lifts progressively as cycles complete
 *   - Journal input is disabled until the user achieves alignment
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import {
  Canvas,
  BackdropBlur,
  Fill,
} from '@shopify/react-native-skia';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import SkiaBreathPortal from '../ui/SkiaBreathPortal';
import SkiaOrbitalButton from '../ui/SkiaOrbitalButton';

const { width, height } = Dimensions.get('window');
const REQUIRED_CYCLES = 3;

export default function SkiaBreathJournal() {
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [entry, setEntry] = useState('');

  const blurIntensity = useSharedValue(20);
  const portalOpacity = useSharedValue(1);

  // ── Unlock logic ──
  // When 3 breath cycles are complete, dissolve the fog and reveal the journal.
  useEffect(() => {
    if (cyclesCompleted >= REQUIRED_CYCLES) {
      blurIntensity.value = withTiming(0, {
        duration: 1500,
        easing: Easing.out(Easing.exp),
      });
      portalOpacity.value = withTiming(0, { duration: 800 });
      const timeout = setTimeout(() => setUnlocked(true), 1500);
      return () => clearTimeout(timeout);
    }
  }, [cyclesCompleted, blurIntensity, portalOpacity]);

  const animatedPortalStyle = useAnimatedStyle(() => ({
    opacity: portalOpacity.value,
    transform: [{ scale: portalOpacity.value }],
  }));

  return (
    <View style={styles.container}>
      {/* ── 1. The Somatic Gate (Breath Portal) ── */}
      {!unlocked && (
        <Animated.View style={[styles.portalOverlay, animatedPortalStyle]}>
          <Text style={styles.eyebrow}>Somatic Alignment Required</Text>
          <Text style={styles.instruction}>
            Breathe with the light to unlock your reflection
          </Text>

          <SkiaBreathPortal />

          <Text style={styles.cycleCount}>
            {cyclesCompleted} / {REQUIRED_CYCLES} Cycles
          </Text>

          {/* Temporary trigger — in production, hook into SkiaBreathPortal's
              animation loop to increment cycles automatically. */}
          {__DEV__ && (
            <Pressable
              onPress={() => setCyclesCompleted((c) => c + 1)}
              style={styles.testBtn}
            >
              <Text style={styles.testBtnLabel}>Simulate Breath</Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      {/* ── 2. The Obsidian Journal Input ── */}
      <View style={styles.journalWrapper}>
        <View style={styles.inputHeader}>
          <Text style={styles.headerTitle}>Daily Reflection</Text>
          <Text style={styles.headerSub}>Secured via Somatic Sync</Text>
        </View>

        <TextInput
          multiline
          placeholder="Begin typing your reflection..."
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={entry}
          onChangeText={setEntry}
          style={styles.textInput}
          editable={unlocked}
        />

        {unlocked && (
          <Animated.View entering={FadeIn.delay(500)} style={styles.footer}>
            <SkiaOrbitalButton
              label="Secure Entry"
              loading={false}
              onPress={() => console.log('Saved')}
            />
          </Animated.View>
        )}
      </View>

      {/* ── 3. The Skia Fog Filter ── */}
      {!unlocked && (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <BackdropBlur blur={blurIntensity}>
            <Fill color="rgba(7, 9, 15, 0.6)" />
          </BackdropBlur>
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07090F' },
  portalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  journalWrapper: { flex: 1, padding: 24, paddingTop: 60 },
  eyebrow: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  instruction: {
    color: '#FDFBF7',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  cycleCount: {
    color: '#6EBF8B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 20,
  },
  inputHeader: { marginBottom: 24 },
  headerTitle: {
    color: '#FDFBF7',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  headerSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 4,
  },
  textInput: {
    flex: 1,
    color: '#FDFBF7',
    fontSize: 18,
    lineHeight: 28,
    textAlignVertical: 'top',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  footer: { marginTop: 20 },
  testBtn: {
    marginTop: 40,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  testBtnLabel: {
    color: '#FFF',
    fontSize: 10,
  },
});
