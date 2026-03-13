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

export default function SleepQuickLog() {
  const router = useRouter();
  const [quality, setQuality] = useState(3);
  const [saving, setSaving] = useState(false);

  const handleQuickSeal = async () => {
    if (saving) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    try {
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const now = new Date();
        await localDb.saveSleepEntry({
          id: generateId(),
          chartId: charts[0].id,
          date: now.toISOString().split('T')[0],
          quality,
          durationHours: 8.0,
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

      <Text style={styles.modalTitle}>Quick Sleep Log</Text>

      {/* Moon quality rating */}
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

      <Text style={styles.qualityLabel}>
        {['Exhausted', 'Restless', 'Neutral', 'Restored', 'Deeply Vibrant'][quality - 1]}
      </Text>

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
    marginBottom: 40, letterSpacing: 0.5,
  },
  moonRow: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  moon: { fontSize: 40, color: '#6E8CB4' },
  qualityLabel: {
    color: '#6E8CB4', fontFamily: 'Georgia', fontStyle: 'italic',
    fontSize: 14, marginBottom: 60,
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
