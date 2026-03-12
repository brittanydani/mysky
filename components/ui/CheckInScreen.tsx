/**
 * components/ui/CheckInScreen.tsx
 * MySky — Relationship Resonance Check-In overlay
 *
 * Transparent overlay rendered above GlobalCanvas while activeScene is
 * 'CHECK_IN_SPHERE'. The plasma sphere in GlobalCanvas reacts in real-time
 * via checkInInteractionStore.getLiveMood() — no React re-renders on the
 * hot path.
 *
 * Gesture path:
 *   Reanimated shared values (sliderX, moodValue) stay on the UI thread.
 *   JS bridge is only crossed via useAnimatedReaction at a throttled threshold
 *   and via runOnJS for per-step haptics.
 *
 * Save path:
 *   Supabase upsert with onConflict: 'user_id,log_date' — one row per day.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';

import { useSceneStore } from '@/store/sceneStore';
import { useCheckInStore } from '@/store/checkInStore';
import { useCheckInInteractionStore } from '@/store/checkInInteractionStore';
import { useLoadTodayCheckIn } from '@/hooks/useLoadTodayCheckIn';

const { width } = Dimensions.get('window');
const TRACK_WIDTH = width - 80;
const KNOB_SIZE   = 30;
const DEFAULT_MOOD = 5;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(max, value));
}

function moodToSliderX(value: number) {
  return (value / 10) * TRACK_WIDTH;
}

export default function CheckInScreen() {
  const setActiveScene   = useSceneStore((s) => s.setActiveScene);
  const { isSaving, isLoadingToday, saveStatus, error, saveDailyLog, resetStatus } = useCheckInStore();
  const setLiveMood      = useCheckInInteractionStore((s) => s.setLiveMood);
  const setCommittedMood = useCheckInInteractionStore((s) => s.setCommittedMood);
  const resetInteraction = useCheckInInteractionStore((s) => s.reset);

  const [displayMood, setDisplayMood] = useState(DEFAULT_MOOD);

  const sliderX        = useSharedValue(moodToSliderX(DEFAULT_MOOD));
  const moodValue      = useSharedValue(DEFAULT_MOOD);
  const gestureStartX  = useSharedValue(moodToSliderX(DEFAULT_MOOD));
  const lastHapticStep = useSharedValue(Math.round(DEFAULT_MOOD));

  const lastBridgedMoodRef = useRef(DEFAULT_MOOD);

  const setSliderFromMood = useCallback(
    (mood: number) => {
      const clamped = Math.max(0, Math.min(10, mood));
      sliderX.value        = moodToSliderX(clamped);
      moodValue.value      = clamped;
      gestureStartX.value  = moodToSliderX(clamped);
      lastHapticStep.value = Math.round(clamped);
      lastBridgedMoodRef.current = clamped;
      setDisplayMood(clamped);
    },
    [gestureStartX, lastHapticStep, moodValue, sliderX]
  );

  const updateMoodBridge = useCallback(
    (value: number) => {
      const clamped = Math.max(0, Math.min(10, value));
      setLiveMood(clamped);
      if (Math.abs(clamped - lastBridgedMoodRef.current) >= 0.08) {
        lastBridgedMoodRef.current = clamped;
        setDisplayMood(clamped);
      }
    },
    [setLiveMood]
  );

  const fireSelectionHaptic = useCallback(() => { Haptics.selectionAsync(); }, []);
  const fireSaveImpact      = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }, []);
  const fireSaveSuccess     = useCallback(() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, []);
  const fireSaveError       = useCallback(() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); }, []);

  useFocusEffect(
    useCallback(() => {
      setActiveScene('CHECK_IN_SPHERE');
      resetStatus();
      resetInteraction();

      return () => {
        setActiveScene('NONE' as never);
        resetStatus();
      };
    }, [resetInteraction, resetStatus, setActiveScene])
  );

  useLoadTodayCheckIn({
    setSliderFromMood: (mood) => {
      setSliderFromMood(mood);
      setLiveMood(mood);
      setCommittedMood(mood);
    },
    fallbackMood: DEFAULT_MOOD,
  });

  useAnimatedReaction(
    () => moodValue.value,
    (current, previous) => {
      if (previous === null || Math.abs(current - previous) >= 0.08) {
        runOnJS(updateMoodBridge)(current);
      }
    },
    [updateMoodBridge]
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          gestureStartX.value = sliderX.value;
        })
        .onUpdate((event) => {
          const nextX    = clamp(gestureStartX.value + event.translationX, 0, TRACK_WIDTH);
          sliderX.value  = nextX;
          const nextMood = (nextX / TRACK_WIDTH) * 10;
          moodValue.value = nextMood;

          const step = Math.round(nextMood);
          if (step !== lastHapticStep.value) {
            lastHapticStep.value = step;
            runOnJS(fireSelectionHaptic)();
          }
        }),
    [fireSelectionHaptic, gestureStartX, lastHapticStep, moodValue, sliderX]
  );

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderX.value - KNOB_SIZE / 2 }],
  }));

  const handleSave = useCallback(async () => {
    const mood = Math.max(0, Math.min(10, moodValue.value));
    fireSaveImpact();
    setCommittedMood(mood);
    await saveDailyLog(mood);
  }, [fireSaveImpact, moodValue, saveDailyLog, setCommittedMood]);

  useEffect(() => {
    if (saveStatus === 'success') {
      fireSaveSuccess();
      const t = setTimeout(() => resetStatus(), 2500);
      return () => clearTimeout(t);
    }
    if (saveStatus === 'error') {
      fireSaveError();
    }
  }, [fireSaveError, fireSaveSuccess, resetStatus, saveStatus]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header} pointerEvents="none">
        <Text style={styles.title}>Current State</Text>
        <Text style={styles.subtitle}>Calibrate your resonance</Text>
      </View>

      <View style={styles.bottomUI} pointerEvents="box-none">
        <Text style={styles.valueText}>{displayMood.toFixed(1)}</Text>

        <GestureDetector gesture={pan}>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack} />
            <Animated.View style={[styles.sliderKnob, knobStyle]} />
          </View>
        </GestureDetector>

        <View style={styles.labelRow}>
          <Text style={styles.labelText}>Calm</Text>
          <Text style={styles.labelText}>Intense</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            saveStatus === 'success' && styles.successButton,
            pressed && !isSaving && saveStatus !== 'success' && styles.saveButtonPressed,
          ]}
          onPress={handleSave}
          disabled={isSaving || isLoadingToday}
        >
          <Text style={styles.saveButtonText}>
            {isLoadingToday
              ? 'Loading...'
              : isSaving
              ? 'Syncing...'
              : saveStatus === 'success'
              ? 'Resonance Logged'
              : 'Lock Alignment'}
          </Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  bottomUI: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  valueText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  },
  sliderContainer: {
    width: '100%',
    height: 42,
    justifyContent: 'center',
  },
  sliderTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
  },
  sliderKnob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    marginBottom: 40,
  },
  labelText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  saveButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(20,22,40,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  successButton: {
    borderColor: '#00F5FF',
    backgroundColor: 'rgba(0,245,255,0.10)',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  errorText: {
    color: '#FF8DA1',
    fontSize: 13,
    marginTop: 14,
    textAlign: 'center',
  },
});
