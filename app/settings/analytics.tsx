import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import {
  getGrowthAnalyticsSnapshot,
  trackGrowthEvent,
  type GrowthAnalyticsState,
} from '../../services/growth/localAnalytics';
import { logger } from '../../utils/logger';

const PALETTE = {
  bg: '#000000',
  textMain: '#F5F5F7',
  textMuted: '#86868B',
  gold: '#C5B5A1',
  border: 'rgba(197, 181, 161, 0.25)',
  fill: 'rgba(15, 15, 15, 0.5)',
};

function formatDate(value?: string): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function AnalyticsInspectorScreen() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<GrowthAnalyticsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const nextSnapshot = await getGrowthAnalyticsSnapshot();
      setSnapshot(nextSnapshot);
      trackGrowthEvent('analytics_screen_viewed').catch(() => {});
    } catch (error) {
      logger.error('[AnalyticsInspector] Failed to load snapshot:', error);
      Alert.alert('Unable to Load', 'Could not load the analytics snapshot.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSnapshot().catch(() => {});
    }, [loadSnapshot]),
  );

  const handleShare = useCallback(async () => {
    if (!snapshot || sharing) return;

    setSharing(true);
    try {
      const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!directory) throw new Error('No writable directory available');

      const fileName = `mysky-growth-analytics-${new Date().toISOString().slice(0, 10)}.json`;
      const uri = `${directory}${fileName}`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(snapshot, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Snapshot Saved', `Analytics snapshot saved as ${fileName}.`);
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/json',
          UTI: Platform.OS === 'ios' ? 'public.json' : undefined,
        });
      }

      trackGrowthEvent('analytics_snapshot_shared').catch(() => {});
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch {
        // best-effort cleanup
      }
    } catch (error) {
      logger.error('[AnalyticsInspector] Failed to share snapshot:', error);
      Alert.alert('Share Failed', 'Could not share the analytics snapshot.');
    } finally {
      setSharing(false);
    }
  }, [sharing, snapshot]);

  const counts = Object.entries(snapshot?.counts ?? {}).sort((a, b) => (b[1] as number) - (a[1] as number)) as [string, number][];
  const experiments = Object.entries(snapshot?.experiments ?? {});
  const recentEvents = [...(snapshot?.recentEvents ?? [])].reverse();

  // This screen is for internal development only
  if (!__DEV__) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Not available</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.back();
            }}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back-outline" size={24} color={PALETTE.textMain} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Growth Analytics</Text>
            <GoldSubtitle style={styles.subtitle}>Local snapshot only. Nothing leaves the device unless you share it.</GoldSubtitle>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={() => loadSnapshot().catch(() => {})} style={styles.actionButton}>
              <Ionicons name="refresh-outline" size={16} color={PALETTE.gold} />
              <Text style={styles.actionText}>Refresh</Text>
            </Pressable>
            <Pressable onPress={handleShare} style={styles.actionButton} disabled={!snapshot || sharing}>
              {sharing ? (
                <ActivityIndicator size="small" color={PALETTE.gold} />
              ) : (
                <Ionicons name="share-outline" size={16} color={PALETTE.gold} />
              )}
              <Text style={styles.actionText}>Share JSON</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={PALETTE.gold} />
            </View>
          ) : (
            <>
              <LinearGradient colors={['rgba(197, 181, 161, 0.12)', 'rgba(10, 10, 12, 0.8)']} style={styles.card}>
                <Text style={styles.cardTitle}>Assigned Experiments</Text>
                {experiments.length === 0 ? (
                  <Text style={styles.cardBody}>No experiment variants have been assigned yet.</Text>
                ) : (
                  experiments.map(([name, value]) => (
                    <View key={name} style={styles.row}>
                      <Text style={styles.rowLabel}>{name}</Text>
                      <Text style={styles.rowValue}>{String(value)}</Text>
                    </View>
                  ))
                )}
              </LinearGradient>

              <LinearGradient colors={['rgba(139, 196, 232, 0.08)', 'rgba(10, 10, 12, 0.8)']} style={styles.card}>
                <Text style={styles.cardTitle}>Event Counts</Text>
                {counts.length === 0 ? (
                  <Text style={styles.cardBody}>No growth events have been recorded yet.</Text>
                ) : (
                  counts.map(([key, value]) => (
                    <View key={key} style={styles.row}>
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.rowLabel}>{key}</Text>
                        <Text style={styles.rowMeta}>First {formatDate(snapshot?.firstSeenAt[key])}</Text>
                        <Text style={styles.rowMeta}>Last {formatDate(snapshot?.lastSeenAt[key])}</Text>
                      </View>
                      <Text style={styles.countValue}>{String(value)}</Text>
                    </View>
                  ))
                )}
              </LinearGradient>

              <LinearGradient colors={['rgba(205, 127, 93, 0.08)', 'rgba(10, 10, 12, 0.8)']} style={styles.card}>
                <Text style={styles.cardTitle}>Recent Events</Text>
                {recentEvents.length === 0 ? (
                  <Text style={styles.cardBody}>No recent events yet.</Text>
                ) : (
                  recentEvents.map((event, index) => (
                    <View key={`${event.name}-${event.at}-${index}`} style={styles.eventItem}>
                      <View style={styles.row}>
                        <Text style={styles.rowLabel}>{event.name}</Text>
                        <Text style={styles.rowMeta}>{formatDate(event.at)}</Text>
                      </View>
                      {event.metadata ? (
                        <Text style={styles.eventMeta}>{JSON.stringify(event.metadata)}</Text>
                      ) : null}
                    </View>
                  ))
                )}
              </LinearGradient>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 64 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 8, marginTop: 8 },
  header: { marginTop: 12, marginBottom: 20 },
  title: { color: PALETTE.textMain, fontSize: 32, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 14,
    backgroundColor: PALETTE.fill,
    paddingVertical: 12,
  },
  actionText: { color: PALETTE.gold, fontSize: 14, fontWeight: '700' },
  loadingWrap: { paddingVertical: 80 },
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
  },
  cardTitle: { color: PALETTE.textMain, fontSize: 17, fontWeight: '700', marginBottom: 14 },
  cardBody: { color: PALETTE.textMuted, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  rowTextWrap: { flex: 1 },
  rowLabel: { color: PALETTE.textMain, fontSize: 14, fontWeight: '600', flex: 1 },
  rowValue: { color: PALETTE.gold, fontSize: 14, fontWeight: '700' },
  rowMeta: { color: PALETTE.textMuted, fontSize: 12, lineHeight: 18 },
  countValue: { color: PALETTE.gold, fontSize: 18, fontWeight: '800' },
  eventItem: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  eventMeta: { color: PALETTE.textMuted, fontSize: 12, marginTop: 6, lineHeight: 18 },
});