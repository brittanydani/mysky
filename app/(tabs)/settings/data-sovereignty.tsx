// app/(tabs)/settings/data-sovereignty.tsx
// The Data Sovereignty Pledge — a simple, centered trust layer.

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../../../constants/theme';
import { SkiaDynamicCosmos } from '../../../components/ui/SkiaDynamicCosmos';
import { localDb } from '../../../services/storage/localDb';
import { AstrologyCalculator } from '../../../services/astrology/calculator';
import { FullNatalStoryGenerator } from '../../../services/premium/fullNatalStory';
import { exportChartToPdf } from '../../../services/premium/pdfExport';
import { usePremium } from '../../../context/PremiumContext';
import { logger } from '../../../utils/logger';

const GOLD = '#D4AF37';
const GOLD_SOFT = 'rgba(212, 175, 55, 0.8)';
const GOLD_DIM = 'rgba(212, 175, 55, 0.4)';

const PLEDGE_LINES = [
  'Your interior world is yours alone.',
  'MySky uses local-first encryption.',
  'We do not sell your soul\'s data.',
  'Your journals are your property.',
];

const PRINCIPLES = [
  {
    icon: 'lock-closed' as const,
    title: 'Local-First Encryption',
    detail: 'AES-256-GCM. Your encryption key lives in your device\'s hardware keychain — never on our servers.',
  },
  {
    icon: 'airplane' as const,
    title: 'Zero Content Transmission',
    detail: 'Journal entries, dreams, and check-ins never leave your device. Only birth-city text is sent for geocoding.',
  },
  {
    icon: 'analytics' as const,
    title: 'No Third-Party Profiling',
    detail: 'No tracking SDKs, no advertising IDs, no behavioral data sold — ever.',
  },
  {
    icon: 'person' as const,
    title: 'You Own Your Data',
    detail: 'Export a full JSON archive any time. Delete everything permanently whenever you choose.',
  },
];

export default function DataSovereigntyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = useCallback(async () => {
    if (!isPremium) {
      Alert.alert(
        'Deeper Sky Feature',
        'PDF export is available with Deeper Sky (premium).',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setExporting(true);
      const charts = await localDb.getCharts();
      if (!charts.length) {
        Alert.alert('No Chart Found', 'Set up your birth chart first to generate a PDF report.');
        return;
      }

      const dbChart = charts[0];
      const chart = AstrologyCalculator.generateNatalChart({
        date: dbChart.birthDate,
        time: dbChart.birthTime,
        hasUnknownTime: dbChart.hasUnknownTime,
        place: dbChart.birthPlace,
        latitude: dbChart.latitude,
        longitude: dbChart.longitude,
        timezone: dbChart.timezone,
        houseSystem: dbChart.houseSystem,
      });

      const story = FullNatalStoryGenerator.generateFullStory(chart, isPremium);
      const chapters = story.chapters;

      await exportChartToPdf(chart, chapters);
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    } catch (err: any) {
      logger.error('PDF export failed from data sovereignty screen:', err);
      Alert.alert('Export Failed', 'Something went wrong generating the PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [isPremium]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Back button */}
        <Pressable
          style={[styles.backBtn, { marginTop: insets.top > 0 ? 0 : 8 }]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={GOLD_SOFT} />
          <Text style={styles.backText}>Settings</Text>
        </Pressable>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(700)} style={styles.headerBlock}>
            <Text style={styles.eyebrow}>PROTOCOL 001</Text>
            <Text style={styles.title}>Data Sovereignty</Text>
            <View style={styles.titleRule} />
          </Animated.View>

          {/* Pledge */}
          <Animated.View entering={FadeInDown.delay(220).duration(700)} style={styles.pledgeBlock}>
            {PLEDGE_LINES.map((line, i) => (
              <Text key={i} style={styles.pledgeLine}>{line}</Text>
            ))}
          </Animated.View>

          {/* Principles */}
          <Animated.View entering={FadeInDown.delay(380).duration(700)} style={styles.principlesBlock}>
            {PRINCIPLES.map((p, i) => (
              <View
                key={p.title}
                style={[styles.principleRow, i < PRINCIPLES.length - 1 && styles.principleRowBorder]}
              >
                <View style={styles.principleIcon}>
                  <Ionicons name={p.icon} size={18} color={GOLD_SOFT} />
                </View>
                <View style={styles.principleText}>
                  <Text style={styles.principleTitle}>{p.title}</Text>
                  <Text style={styles.principleDetail}>{p.detail}</Text>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Export PDF — Clinical Report */}
          <Animated.View entering={FadeInDown.delay(520).duration(700)} style={styles.exportBlock}>
            <Text style={styles.exportLabel}>CLINICAL REPORT</Text>
            <Text style={styles.exportSubtitle}>
              Generate a PDF archive of your natal chart, placements, aspects, and full personal story.
              {!isPremium ? ' Requires Deeper Sky.' : ''}
            </Text>
            <Pressable
              style={[styles.exportBtn, (exporting || !isPremium) && styles.exportBtnDisabled]}
              onPress={handleExportPdf}
              disabled={exporting}
              accessibilityRole="button"
              accessibilityLabel="Export PDF clinical report"
            >
              <Ionicons
                name={exporting ? 'hourglass-outline' : 'document-text-outline'}
                size={16}
                color={isPremium ? GOLD : GOLD_DIM}
              />
              <Text style={[styles.exportBtnText, !isPremium && { color: GOLD_DIM }]}>
                {exporting ? 'Generating...' : 'Export PDF Report'}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Footer note */}
          <Animated.View entering={FadeInDown.delay(640).duration(700)} style={styles.footerNote}>
            <Text style={styles.footerText}>
              MySky is built on the principle that self-knowledge is sacred.{'\n'}
              No algorithm profits from your interior weather.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  backText: {
    fontSize: 16,
    color: GOLD_SOFT,
  },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 28,
    paddingTop: 12,
    alignItems: 'center',
  },

  headerBlock: {
    alignItems: 'center',
    marginBottom: 36,
    width: '100%',
  },
  eyebrow: {
    fontSize: 10,
    color: GOLD_DIM,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  titleRule: {
    marginTop: 16,
    width: 48,
    height: 1,
    backgroundColor: GOLD,
    opacity: 0.6,
  },

  pledgeBlock: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 14,
  },
  pledgeLine: {
    fontSize: 20,
    color: theme.textPrimary,
    fontFamily: 'serif',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 30,
    opacity: 0.92,
  },

  principlesBlock: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 40,
  },
  principleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 14,
  },
  principleRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(212, 175, 55, 0.12)',
  },
  principleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  principleText: { flex: 1 },
  principleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  principleDetail: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },

  exportBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  exportLabel: {
    fontSize: 10,
    color: GOLD_DIM,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  exportSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  exportBtnDisabled: {
    borderColor: GOLD_DIM,
    opacity: 0.7,
  },
  exportBtnText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  footerNote: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
