/**
 * File: app/sleep.tsx
 * Quick-Log Modal — Speed-first rest logging
 *
 * Minimalist modal for fast sleep quality capture.
 * Opens as a sheet over the tab bar via router.push('/sleep').
 * Full narrative editing lives in app/(tabs)/journal/sleep-detail.tsx.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { localDb } from '../services/storage/localDb';
import { generateId } from '../services/storage/models';
import { logger } from '../utils/logger';

const QUALITY_LABELS = ['Exhausted', 'Restless', 'Neutral', 'Restored', 'Deeply Vibrant'];
const MIN_HOURS = 2;
const MAX_HOURS = 14;
const STEP = 0.5;

function formatHours(h: number): string {
  const whole = Math.floor(h);
  const half = h % 1 !== 0;
  return half ? `${whole}h 30m` : `${whole}h`;
}

export default function SleepQuickLog() {
  const router = useRouter();
  const [quality, setQuality] = useState(3);
  const [hours, setHours] = useState(7);
  const [saving, setSaving] = useState(false);

  const adjustHours = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    setHours((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      return Math.min(MAX_HOURS, Math.max(MIN_HOURS, next));
    });
  };

  const handleQuickSeal = async () => {
    if (saving) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    try {
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const now = new Date();
        // Use local date string to avoid UTC midnight offset on YYYY-MM-DD entries
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        await localDb.saveSleepEntry({
          id: generateId(),
          chartId: charts[0].id,
          date: dateStr,
          durationHours: hours,
          quality,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          isDeleted: false,
        });
      } else {
        logger.warn('[SleepQuickLog] No chart found — entry not saved');
      }
    } catch (e) {
      logger.error('[SleepQuickLog] Failed to save entry:', e);
    }

    router.back();
  };

  return (
    <View style={styles.modalContainer}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Drag handle */}
      <View style={styles.handle} />

      <Text style={styles.modalTitle}>Sleep Log</Text>

      {/* Duration picker */}
      <Text style={styles.sectionLabel}>HOURS SLEPT</Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => adjustHours(-STEP)}
          disabled={hours <= MIN_HOURS}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.stepperBtn, hours <= MIN_HOURS && styles.stepperBtnDisabled]}
        >
          <Text style={styles.stepperIcon}>−</Text>
        </Pressable>

        <View style={styles.hoursDisplay}>
          <Text style={styles.hoursValue}>{formatHours(hours)}</Text>
        </View>

        <Pressable
          onPress={() => adjustHours(STEP)}
          disabled={hours >= MAX_HOURS}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.stepperBtn, hours >= MAX_HOURS && styles.stepperBtnDisabled]}
        >
          <Text style={styles.stepperIcon}>+</Text>
        </Pressable>
      </View>

      {/* Quality rating */}
      <Text style={[styles.sectionLabel, { marginTop: 36 }]}>SLEEP QUALITY</Text>
      <View style={styles.moonRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable
            key={i}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setQuality(i);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={[styles.moon, { opacity: i <= quality ? 1 : 0.2 }]}>☾</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.qualityLabel}>{QUALITY_LABELS[quality - 1]}</Text>

      <Pressable
        style={[styles.quickSealBtn, saving && styles.disabledBtn]}
        onPress={handleQuickSeal}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#050507" />
        ) : (
          <Text style={styles.btnText}>SEAL REST</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1, padding: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2,
    position: 'absolute', top: 16,
  },
  modalTitle: {
    color: '#FFF', fontSize: 24, fontFamily: 'Georgia',
    marginBottom: 36, letterSpacing: 0.5,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2,
    fontWeight: '600', marginBottom: 16,
  },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', gap: 24,
  },
  stepperBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  stepperBtnDisabled: { opacity: 0.3 },
  stepperIcon: { color: '#FFF', fontSize: 22, lineHeight: 26 },
  hoursDisplay: {
    minWidth: 100, alignItems: 'center',
  },
  hoursValue: {
    color: '#D9BF8C', fontSize: 36, fontFamily: 'Georgia', letterSpacing: 0.5,
  },
  moonRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  moon: { fontSize: 38, color: '#6E8CB4' },
  qualityLabel: {
    color: '#6E8CB4', fontFamily: 'Georgia', fontStyle: 'italic',
    fontSize: 14, marginBottom: 48,
  },
  quickSealBtn: {
    backgroundColor: '#D9BF8C', width: '100%', height: 60,
    borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#D9BF8C', shadowRadius: 10, shadowOpacity: 0.3,
    marginBottom: 16,
  },
  disabledBtn: { opacity: 0.5 },
  btnText: { fontWeight: '800', letterSpacing: 2, color: '#050507', fontSize: 14 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  cancelText: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },
});
