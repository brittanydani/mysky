// components/ui/AwakenStateSheet.tsx
//
// Custom animated bottom sheet for selecting "Woke up feeling."
// Replaces the inline dropdown with a frosted-glass panel that
// slides up from the bottom with a spring snap.
//
// No @gorhom/bottom-sheet dependency needed — uses React Native Modal
// + Reanimated translateY + expo-blur BlurView.

import React, { useCallback, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { MetallicIcon } from './MetallicIcon';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AwakenStateOption {
  id:    string;
  label: string;
}

export interface AwakenStateSheetProps {
  visible:   boolean;
  options:   AwakenStateOption[];
  selected:  string;
  onSelect:  (id: string) => void;
  onClose:   () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SHEET_H     = 340;
const SNAP_OPEN   = 0;
const SNAP_CLOSED = SHEET_H + 40;

const SPRING = {
  mass:              0.6,
  damping:           20,
  stiffness:         280,
  overshootClamping: false,
} as const;

const AMETHYST = '#9D76C1';

// ── Component ─────────────────────────────────────────────────────────────────

export default function AwakenStateSheet({
  visible,
  options,
  selected,
  onSelect,
  onClose,
}: AwakenStateSheetProps) {
  const translateY   = useSharedValue(SNAP_CLOSED);
  const backdropOp   = useSharedValue(0);

  // ── Animate open/close when visibility changes ────────────────────────────
  useEffect(() => {
    if (visible) {
      translateY.value  = withSpring(SNAP_OPEN, SPRING);
      backdropOp.value  = withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) });
    } else {
      translateY.value  = withTiming(SNAP_CLOSED, { duration: 240, easing: Easing.in(Easing.quad) });
      backdropOp.value  = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, backdropOp]);

  // ── Swipe-down drag to dismiss ────────────────────────────────────────────
  const startY   = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      'worklet';
      const next = startY.value + e.translationY;
      translateY.value = Math.max(SNAP_OPEN, next);
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY > 80 || e.velocityY > 600) {
        translateY.value = withTiming(SNAP_CLOSED, { duration: 200 });
        backdropOp.value = withTiming(0, { duration: 180 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(SNAP_OPEN, SPRING);
      }
    });

  // ── Animated styles ───────────────────────────────────────────────────────
  const sheetStyle    = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOp.value,
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelect(id);
    onClose();
  }, [onSelect, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dim backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet panel */}
      <View style={styles.sheetAnchor} pointerEvents="box-none">
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            {/* Frosted glass background */}
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

            {/* Handle bar */}
            <View style={styles.handle} />

            {/* Title */}
            <View style={styles.titleRow}>
              <MetallicIcon name="moon-outline" size={16} color={AMETHYST} />
              <Text style={styles.title}>Woke up feeling</Text>
            </View>

            {/* Options */}
            <ScrollView
              style={styles.listContainer}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {options.map((opt) => {
                const isSelected = opt.id === selected;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => handleSelect(opt.id)}
                    style={({ pressed }) => [
                      styles.item,
                      isSelected && styles.itemSelected,
                      pressed && styles.itemPressed,
                    ]}
                  >
                    <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <MetallicIcon name="checkmark-outline" size={16} color={AMETHYST} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetAnchor: {
    flex:           1,
    justifyContent: 'flex-end',
  },
  sheet: {
    height:           SHEET_H,
    borderTopLeftRadius:  20,
    borderTopRightRadius: 20,
    overflow:         'hidden',
    borderTopWidth:   1,
    borderTopColor:   'rgba(255,255,255,0.10)',
    borderLeftWidth:  1,
    borderLeftColor:  'rgba(255,255,255,0.07)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.07)',
  },
  handle: {
    width:           44,
    height:          4,
    borderRadius:    2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf:       'center',
    marginTop:       12,
    marginBottom:    4,
  },
  titleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    color:         '#FFFFFF',
    fontSize:      14,
    fontWeight:    '700',
    letterSpacing: 0.5,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical:   8,
    gap:               4,
  },
  item: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical:    14,
    paddingHorizontal:  16,
    borderRadius:   12,
    borderWidth:    1,
    borderColor:    'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  itemSelected: {
    backgroundColor: 'rgba(157,118,193,0.12)',
    borderColor:     'rgba(157,118,193,0.35)',
  },
  itemPressed: {
    opacity: 0.75,
  },
  itemLabel: {
    color:      'rgba(255,255,255,0.75)',
    fontSize:   15,
    fontWeight: '500',
  },
  itemLabelSelected: {
    color:      '#FFFFFF',
    fontWeight: '600',
  },
});
