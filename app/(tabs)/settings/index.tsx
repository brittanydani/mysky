// app/(tabs)/settings/index.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { MetallicText } from '../../../components/ui/MetallicText';
import { MetallicIcon } from '../../../components/ui/MetallicIcon';
import { useRouter, useFocusEffect, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptedAsyncStorage } from '../../../services/storage/encryptedAsyncStorage';

import { type AppTheme } from '../../../constants/theme';
import { SkiaDynamicCosmos } from '../../../components/ui/SkiaDynamicCosmos';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import BackupPassphraseModal from '../../../components/BackupPassphraseModal';
import PrivacySettingsModal from '../../../components/PrivacySettingsModal';
import BirthDataModal from '../../../components/BirthDataModal';
import { usePremium } from '../../../context/PremiumContext';
import PremiumModal from '../../../components/PremiumModal';
import { localDb } from '../../../services/storage/localDb';
import { BackupService } from '../../../services/storage/backupService';
import { exportChartToPdf } from '../../../services/premium/pdfExport';
import { FullNatalStoryGenerator } from '../../../services/premium/fullNatalStory';
import { BirthData } from '../../../services/astrology/types';
import { AstrologyCalculator } from '../../../services/astrology/calculator';
import Constants from 'expo-constants';
import { FieldEncryptionService } from '../../../services/storage/fieldEncryption';
import { IdentityVault } from '../../../utils/IdentityVault';
import { logger } from '../../../utils/logger';
import { SUPPORT_EMAIL } from '../../../constants/config';
import { NotificationEngine } from '../../../utils/NotificationEngine';
import { setHapticsEnabled } from '../../../utils/haptics';
import GlassToggle from '../../../components/ui/GlassToggle';
import ObsidianSettingsGroup, { ObsidianDivider } from '../../../components/ui/ObsidianSettingsGroup';
import { GoldSubtitle } from '../../../components/ui/GoldSubtitle';
import { VelvetGlassCard } from '../../../components/ui/VelvetGlassCard';
import { useAppTheme, useThemedStyles, useThemePreference } from '../../../context/ThemeContext';

const FAQ: { question: string; answer: string }[] = [
  {
    question: 'How accurate is my chart?',
    answer:
      'MySky uses the Swiss Ephemeris for planetary calculations. Your chart is astronomically accurate to within fractions of a degree. For the most precise house cusps and rising sign, enter your exact birth time.',
  },
  {
    question: "What if I don't know my birth time?",
    answer:
      'You can still get your Sun sign, Moon sign (approximate), and planetary positions. House placements, rising sign, and Midheaven require a known birth time. MySky will clearly mark which features need a birth time.',
  },
  {
    question: 'Where is my data stored?',
    answer:
      'All your data stays on your device. Birth data, journal entries, and chart information are stored in a local database with sensitive fields encrypted using AES-256-GCM. Encryption keys are kept in your device’s secure keychain. Nothing is uploaded to any server.',
  },
  {
    question: 'Where does my backup go?',
    answer:
      'When you create a backup, an encrypted .msky file is saved to your device’s cache, then your device’s share sheet opens so you choose the destination — Files, iCloud Drive, AirDrop, email, or any other app. MySky never uploads your backup to any server.',
  },
  {
    question: 'What does the PDF export include?',
    answer:
      'PDF export is a Deeper Sky (premium) feature. Tap "Export PDF" in Settings to generate and share a PDF that includes a cover page with your birth data, your Big Three (Sun, Moon, Rising), a full planet placements table, house cusps (if birth time is known), all aspects grouped by type, and all 10 Personal Story chapters.',
  },
  {
    question: 'What does Deeper Sky include?',
    answer:
      'Deeper Sky unlocks encrypted backup & restore, the full personal story (10 chapters), attachment and inner-work reflections, unlimited relationship charts, journal pattern analysis, deeper insight summaries, Chiron & Node depth mapping, reflective daily guidance with action prompts, extended pattern analysis, full energy chakra mapping, and symbolic dream reflections.',
  },
  {
    question: 'How does mood and energy tracking work?',
    answer:
      'Tap the check-in button from the Today screen to log your mood (1–10), energy level, stress level, and optional tags like sleep, relationships, or creativity. You can also add notes, wins, and challenges. Your check-ins build a personal dataset over time — MySky analyzes trends, shows your best days by energy, and reveals what patterns correlate with how you feel.',
  },
  {
    question: 'How does sleep tracking work?',
    answer:
      'Open the Sleep tab to log your nightly sleep. Rate quality (1–5 moons), log duration, and write a dream narrative — all free. Symbolic dream interpretation and pattern analysis are Deeper Sky (premium) features. When a Deeper Sky member logs a dream, MySky generates a personalized reflection drawn from your sleep, mood, check-in, and journal data — entirely on your device, with no AI or network calls. You can log one entry per night and edit it any time that day. Free users see basic weekly averages; Deeper Sky members get full trend analysis over time.',
  },
  {
    question: 'What behavioral patterns does MySky track?',
    answer:
      'MySky tracks mood trends, energy highs and lows, stress patterns, sleep quality over time, journal keyword frequency, and emotional tone shifts in your writing — all on your device. The Insights tab shows weekly averages, what your best energy days look like, and what consistently restores or drains you based on your own data.',
  },
  {
    question: 'What is the Energy section?',
    answer:
      'The Energy section maps your chart to a chakra energy system. Free users see an energy snapshot with select domains. Deeper Sky members get all 7 chakras with body cues, triggers, guidance, and daily check-ins that track your energy patterns over time.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer:
      'Yes. Monthly and yearly subscriptions are managed through your device’s App Store account. Go to Settings > Apple ID > Subscriptions. You keep access through the end of your billing period.',
  },
  {
    question: 'How do I change my birth data?',
    answer:
      'You can update your birth data from the Home screen by tapping "Edit Birth Data" below your chart summary. Your chart and all dependent insights will recalculate automatically. If you prefer to start completely fresh, you can delete all your data in Settings under Privacy Settings and set up your chart again.',
  },
  {
    question: 'What house system does MySky use?',
    answer:
      'MySky defaults to Placidus. You can change the house system in the chart view settings. We support Placidus, Koch, Whole Sign, Equal House, Campanus, Regiomontanus, and Topocentric.',
  },
  {
    question: 'Is my journal private?',
    answer:
      'Completely. Journal entries are stored only on your device with sensitive fields encrypted at rest. They are never uploaded, analyzed externally, or shared with anyone. Your device passcode and biometrics provide an additional layer of protection.',
  },
  {
    question: 'How do symbolic dream reflections work?',
    answer:
      'Anyone can log a dream narrative — just open the Sleep tab and type in the Dream Memory field. MySky first scans your dream text for recurring symbols (water, falling, doors, etc.) and builds context from your selected dream feelings and recent patterns on-device, then sends only the dream text and selected feelings to Google Gemini for the narrative interpretation. Free users get the standard model, while Deeper Sky uses a richer model for more nuance.',
  },
];

export default function SettingsScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const settingsFaqGradient = theme.isDark
    ? ['rgba(14, 24, 48, 0.6)', 'rgba(10, 18, 36, 0.4)']
    : [theme.cardSurfaceStrong, 'rgba(236, 240, 245, 0.98)'];
  const { preference: appearanceMode, resolvedMode, setPreference: setAppearanceMode } = useThemePreference();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();
  const { user, signOut } = useAuth();

  const errorColor = theme.error;

  // ── Accent colors for settings sections ──
  const accentGold = '#D4AF37';
  const accentCopper = '#CD7F5D';

  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restoreUri, setRestoreUri] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showFaq, setShowFaq] = useState(false);
  const [encryptionKeyLost, setEncryptionKeyLost] = useState(false);

  // ── Calibration preferences (persisted via AsyncStorage) ──
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [moodInsightsEnabled, setMoodInsightsEnabled] = useState(true);
  const [dreamLoggingEnabled, setDreamLoggingEnabled] = useState(true);

  // ── Identity state ──
  const [identityName, setIdentityName] = useState<string>('');
  const [identityBirthSummary, setIdentityBirthSummary] = useState<string>('');
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [birthInitial, setBirthInitial] = useState<Partial<BirthData> & { chartName?: string } | undefined>(undefined);
  const [identityChartId, setIdentityChartId] = useState<string | null>(null);

  const ensureSettings = useCallback(async () => {
    const existing = await localDb.getSettings();
    if (existing) return existing;

    const now = new Date().toISOString();
    const defaults = {
      id: 'default',
      cloudSyncEnabled: false,
      createdAt: now,
      updatedAt: now,
      lastBackupAt: undefined,
    };
    await localDb.saveSettings(defaults);
    return defaults;
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await ensureSettings();
      setLastBackupAt(settings.lastBackupAt || null);

      // Detect encryption key loss — if the DEK is gone, warn the user
      const keyOk = await FieldEncryptionService.isKeyAvailable();
      setEncryptionKeyLost(!keyOk);

      // Calibration preferences
      const [haptic, reminder, mood, dream] = await Promise.all([
        AsyncStorage.getItem('pref_haptic'),
        AsyncStorage.getItem('pref_daily_reminder'),
        AsyncStorage.getItem('pref_mood_insights'),
        AsyncStorage.getItem('pref_dream_logging'),
      ]);
      if (haptic !== null) setHapticEnabled(haptic === '1');
      if (reminder !== null) setDailyReminderEnabled(reminder === '1');
      if (mood !== null) setMoodInsightsEnabled(mood === '1');
      if (dream !== null) setDreamLoggingEnabled(dream === '1');

      // Load identity
      try {
        const charts = await localDb.getCharts();
        if (charts.length > 0) {
          const chart = charts[0];
          setIdentityChartId(chart.id);
          setIdentityName(chart.name || '');
          const dateStr = chart.birthDate
            ? new Date(chart.birthDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : '';
          const timeStr = chart.hasUnknownTime ? 'Unknown time' : (chart.birthTime || '');
          setIdentityBirthSummary([dateStr, timeStr].filter(Boolean).join(' · '));
          setBirthInitial({
            chartName: chart.name,
            date: chart.birthDate,
            time: chart.birthTime,
            hasUnknownTime: chart.hasUnknownTime,
            place: chart.birthPlace,
            latitude: chart.latitude,
            longitude: chart.longitude,
            timezone: chart.timezone,
            houseSystem: chart.houseSystem as import('../../../services/astrology/types').HouseSystem,
          });
        }
        const storedName = await EncryptedAsyncStorage.getItem('msky_user_name');
        if (storedName) setIdentityName(prev => prev || storedName);
      } catch (innerErr) {
        logger.warn('Failed to load identity chart data:', innerErr);
      }
    } catch (error) {
      logger.error('Failed to load settings:', error);
    }
  }, [ensureSettings]);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  // ── Calibration toggle helpers ──
  const togglePref = useCallback(async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try {
      await AsyncStorage.setItem(key, value ? '1' : '0');
      if (key === 'pref_haptic') setHapticsEnabled(value);
    } catch {}
  }, []);

  const toggleDailyReminder = useCallback(async (value: boolean) => {
    setDailyReminderEnabled(value);
    try {
      await AsyncStorage.setItem('pref_daily_reminder', value ? '1' : '0');
      if (value) {
        const hasPermission = await NotificationEngine.requestPermissions();
        if (!hasPermission) {
          setDailyReminderEnabled(false);
          await AsyncStorage.setItem('pref_daily_reminder', '0');
          return;
        }
        // Read saved evening time from SecureStore or use default 20:00
        const SecureStore = await import('expo-secure-store');
        const [eh, em] = await Promise.all([
          SecureStore.getItemAsync('notif_evening_hour'),
          SecureStore.getItemAsync('notif_evening_minute'),
        ]);
        const hour = eh !== null ? Number(eh) : 20;
        const minute = em !== null ? Number(em) : 0;
        await NotificationEngine.scheduleCheckInReminder(hour, minute);
      } else {
        await NotificationEngine.cancelCheckInReminder();
      }
    } catch {}
  }, []);

  const gatePremium = async (): Promise<boolean> => {
    if (isPremium) return true;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    } catch {}
    Alert.alert(
      'Deeper Sky Feature',
      'Encrypted backup & restore keeps your data safe. Available with a Deeper Sky subscription.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Learn more', onPress: () => router.push('/(tabs)/premium' as Href) },
      ]
    );
    return false;
  };

  const handleBackup = async () => {
    if (!(await gatePremium())) return;
    setBackupModalVisible(true);
  };

  const performBackup = async (passphrase: string) => {
    try {
      setBackupInProgress(true);
      const { uri } = await BackupService.createEncryptedBackupFile(passphrase);
      await BackupService.shareBackupFile(uri);

      const settings = await ensureSettings();
      const now = new Date().toISOString();
      await localDb.saveSettings({ ...settings, lastBackupAt: now, updatedAt: now });

      setLastBackupAt(now);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {}
      Alert.alert('Backup Ready', 'Your encrypted backup is ready to save or share.');
    } catch (error: any) {
      logger.error('Backup failed:', error);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } catch {}
      Alert.alert('Backup Failed', error?.message || 'Unable to create backup');
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleRestore = async () => {
    if (!(await gatePremium())) return;

    Alert.alert(
      'Restore Backup',
      'Restoring will replace your current charts and journal entries on this device. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: async () => {
            try {
              const uri = await BackupService.pickBackupFile();
              if (!uri) return;
              setRestoreUri(uri);
              setRestoreModalVisible(true);
            } catch (error: any) {
              logger.error('Restore file selection failed:', error);
              Alert.alert('Restore Failed', error?.message || 'Unable to select backup file');
            }
          },
        },
      ]
    );
  };

  const performRestore = async (passphrase: string) => {
    if (!restoreUri) return;
    try {
      setRestoreInProgress(true);
      await BackupService.restoreFromBackupFile(restoreUri, passphrase);

      // Re-seal identity from restored chart data
      try {
        const charts = await localDb.getCharts();
        if (charts.length > 0) {
          await IdentityVault.sealIdentity({
            name: charts[0].name ?? 'My Chart',
            birthDate: charts[0].birthDate,
            birthTime: charts[0].birthTime,
            hasUnknownTime: charts[0].hasUnknownTime,
            locationCity: charts[0].birthPlace,
            locationLat: charts[0].latitude,
            locationLng: charts[0].longitude,
            timezone: charts[0].timezone,
          });
        }
      } catch (sealErr) {
        logger.error('[Settings] IdentityVault seal after restore failed:', sealErr);
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {}
      Alert.alert('Restore Complete', 'Your data has been restored on this device.');
      setRestoreUri(null);
      await loadSettings();
    } catch (error: any) {
      logger.error('Restore failed:', error);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } catch {}
      Alert.alert('Restore Failed', error?.message || 'Unable to restore backup');
    } finally {
      setRestoreInProgress(false);
    }
  };

  const formatLastBackup = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const disableActions = backupInProgress || restoreInProgress || backupModalVisible || restoreModalVisible;

  const openSupportEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=MySky%20Support`;
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert('Unable to Open Mail', `Please email ${SUPPORT_EMAIL}.`);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to Open Mail', `Please email ${SUPPORT_EMAIL}.`);
    }
  };

  const openPrivacyPolicy = async () => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    router.navigate('/privacy' as Href);
  };

  const handleEditIdentity = useCallback(async () => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    if (birthInitial) {
      setShowBirthModal(true);
    } else {
      // If no chart data, try to load it fresh
      try {
        const charts = await localDb.getCharts();
        if (charts.length > 0) {
          const chart = charts[0];
          setIdentityChartId(chart.id);
          setBirthInitial({
            chartName: chart.name,
            date: chart.birthDate,
            time: chart.birthTime,
            hasUnknownTime: chart.hasUnknownTime,
            place: chart.birthPlace,
            latitude: chart.latitude,
            longitude: chart.longitude,
            timezone: chart.timezone,
            houseSystem: chart.houseSystem as import('../../../services/astrology/types').HouseSystem,
          });
          setShowBirthModal(true);
        } else {
          Alert.alert('No Chart', 'Complete onboarding first to set up your birth data.');
        }
      } catch {
        Alert.alert('Error', 'Could not load chart data.');
      }
    }
  }, [birthInitial]);

  const handleIdentitySave = useCallback(async (birthData: BirthData, extra?: { chartName?: string }) => {
    setShowBirthModal(false);
    try {
      const chart = AstrologyCalculator.generateNatalChart(birthData);
      const now = new Date().toISOString();
      await localDb.saveChart({
        id: identityChartId || chart.id,
        name: extra?.chartName ?? chart.name,
        birthDate: chart.birthData.date,
        birthTime: chart.birthData.time,
        hasUnknownTime: chart.birthData.hasUnknownTime,
        birthPlace: chart.birthData.place,
        latitude: chart.birthData.latitude,
        longitude: chart.birthData.longitude,
        houseSystem: chart.birthData.houseSystem,
        timezone: chart.birthData.timezone,
        createdAt: chart.createdAt,
        updatedAt: now,
        isDeleted: false,
      });
      setIdentityName(extra?.chartName ?? chart.name ?? '');
      const dateStr = chart.birthData.date
        ? new Date(chart.birthData.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '';
      const timeStr = chart.birthData.hasUnknownTime ? 'Unknown time' : (chart.birthData.time || '');
      setIdentityBirthSummary([dateStr, timeStr].filter(Boolean).join(' · '));
      setBirthInitial({
        chartName: extra?.chartName ?? chart.name,
        ...birthData,
      });
      Alert.alert('Birth Data Updated', 'Your chart and insights will recalculate.');
    } catch (error) {
      logger.error('Identity save failed:', error);
      Alert.alert('Error', 'Failed to update birth data.');
    }
  }, [identityChartId]);

  const openTerms = async () => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    router.navigate('/terms' as Href);
  };

  const openFaq = async () => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    router.navigate('/faq' as Href);
  };

  const handleExportChartPdf = async () => {
    if (!(await gatePremium())) return;
    if (pdfExporting) return;
    if (!birthInitial) {
      Alert.alert('No Chart', 'Set up your birth data first.');
      return;
    }
    try {
      setPdfExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const chart = AstrologyCalculator.generateNatalChart(birthInitial as any);
      const { chapters } = FullNatalStoryGenerator.generateFullStory(chart, true);
      await exportChartToPdf(chart, chapters);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error: any) {
      logger.error('Chart PDF export failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Export Failed', error?.message || 'Unable to generate PDF.');
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Nebula depth — atmospheric glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(110, 140, 180, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(212, 175, 55, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.titleArea}>
              <Text style={styles.greeting}>Settings</Text>
              <GoldSubtitle style={styles.dateLabel}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </GoldSubtitle>
            </View>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          {encryptionKeyLost && (
            <Animated.View entering={FadeInDown.duration(500)} style={styles.keyLossBanner}>
              <LinearGradient
                colors={['rgba(224, 122, 122, 0.15)', 'rgba(224, 122, 122, 0.05)']}
                style={styles.keyLossBannerGradient}
              >
                <View style={styles.keyLossBannerHeader}>
                  <MetallicIcon name="warning-outline" size={22} color={errorColor} />
                  <MetallicText color={errorColor} style={[styles.keyLossBannerTitle, { color: errorColor }]}>Encryption Key Unavailable</MetallicText>
                </View>
                <Text style={styles.keyLossBannerText}>
                  Your encrypted data cannot be read on this device. This can happen after a device migration, OS update, or app reinstall.
                </Text>
                <View style={styles.keyLossBannerActions}>
                  <Pressable
                    style={styles.keyLossBannerButton}
                    onPress={handleRestore}
                    accessibilityRole="button"
                    accessibilityLabel="Restore backup"
                  >
                    <Ionicons name="cloud-download-outline" size={16} color={theme.primary} />
                    <Text style={styles.keyLossBannerButtonText}>Restore Backup</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.keyLossBannerButton, styles.keyLossBannerButtonDestructive]}
                    onPress={() => setShowPrivacyModal(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete all data"
                  >
                    <MetallicIcon name="trash-outline" size={16} color={errorColor} />
                    <MetallicText color={errorColor} style={[styles.keyLossBannerButtonText, { color: errorColor }]}>Delete All Data</MetallicText>
                  </Pressable>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Your Identity ── */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.section}>
            <VelvetGlassCard
              interactive={false}
              style={styles.groupShell}
              backgroundColor={theme.isDark ? 'rgba(15, 14, 18, 0.56)' : 'rgba(255,255,255,0.78)'}
              borderColor="rgba(212,175,55,0.12)"
              topEdgeColor="rgba(255,255,255,0.18)"
            >
            <ObsidianSettingsGroup title="Your Identity" subtitle="Birth chart anchor point" style={styles.groupInner}>
              <View style={{ paddingHorizontal: 20 }}>
                <View style={styles.identityCard}>
                  <View style={styles.identityRow}>
                    <View style={styles.identityAvatarContainer}>
                      <LinearGradient
                        colors={['rgba(162, 194, 225, 0.20)', 'rgba(162, 194, 225, 0.05)']}
                        style={styles.identityAvatar}
                      >
                        <MetallicIcon name="person-outline" size={24} color={accentGold} />
                      </LinearGradient>
                    </View>
                    <View style={styles.identityInfo}>
                      <Text style={styles.identityName}>{identityName || 'Your Chart'}</Text>
                      {identityBirthSummary ? (
                        <Text style={styles.identityDetail}>{identityBirthSummary}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                <Pressable
                  style={styles.identityEditButton}
                  onPress={handleEditIdentity}
                  accessibilityRole="button"
                  accessibilityLabel="Edit birth data"
                >
                  <MetallicIcon name="create-outline" size={16} color={accentGold} />
                  <MetallicText color={accentGold} style={styles.identityEditText}>Edit Birth Data</MetallicText>
                </Pressable>
              </View>
            </ObsidianSettingsGroup>
            </VelvetGlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <VelvetGlassCard
              interactive={false}
              style={styles.groupShell}
              backgroundColor={theme.isDark ? 'rgba(15, 14, 18, 0.56)' : 'rgba(255,255,255,0.78)'}
              borderColor="rgba(212,175,55,0.12)"
              topEdgeColor="rgba(255,255,255,0.18)"
            >
            <ObsidianSettingsGroup title="Encrypted Backup" subtitle="End-to-end encrypted, you control the key" style={styles.groupInner}>
                <View style={{ paddingHorizontal: 20 }}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <MetallicIcon name="cloud-upload-outline" size={20} color={accentGold} />
                        <Text style={styles.settingTitle}>Backup & Restore</Text>
                        {!isPremium && (
                          <View style={styles.premiumBadge}>
                            <Text style={styles.premiumText}>Premium</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.settingDescription}>
                        Create an end-to-end encrypted backup you control.
                      </Text>

                      {lastBackupAt && (
                        <Text style={styles.lastSyncText}>Last backup: {formatLastBackup(lastBackupAt)}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.backupActions}>
                    <Pressable
                      style={[styles.syncButton, disableActions && styles.syncButtonDisabled]}
                      onPress={handleBackup}
                      disabled={disableActions}
                      accessibilityRole="button"
                      accessibilityLabel="Backup now"
                    >
                      <MetallicIcon name="cloud-upload-outline" size={16} color={accentGold} />
                      <MetallicText color={accentGold} style={styles.syncButtonText}>{backupInProgress ? 'Preparing...' : 'Backup Now'}</MetallicText>
                    </Pressable>

                    <Pressable
                      style={[styles.syncButton, disableActions && styles.syncButtonDisabled]}
                      onPress={handleRestore}
                      disabled={disableActions}
                      accessibilityRole="button"
                      accessibilityLabel="Restore backup"
                    >
                      <MetallicIcon name="cloud-download-outline" size={16} color={accentGold} />
                      <MetallicText color={accentGold} style={styles.syncButtonText}>{restoreInProgress ? 'Restoring...' : 'Restore Backup'}</MetallicText>
                    </Pressable>
                  </View>
                </View>
            </ObsidianSettingsGroup>
            </VelvetGlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(275).duration(600)} style={styles.section}>
            <VelvetGlassCard
              interactive={false}
              style={styles.groupShell}
              backgroundColor={theme.isDark ? 'rgba(15, 14, 18, 0.56)' : 'rgba(255,255,255,0.78)'}
              borderColor="rgba(212,175,55,0.12)"
              topEdgeColor="rgba(255,255,255,0.18)"
            >
            <ObsidianSettingsGroup title="Export" subtitle="Download your data as a PDF" style={styles.groupInner}>
              <View style={{ paddingHorizontal: 20 }}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <MetallicIcon name="document-outline" size={20} color={accentGold} />
                      <Text style={styles.settingTitle}>Export Chart PDF</Text>
                      {!isPremium && (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumText}>Premium</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.settingDescription}>
                      Export your natal chart, planet placements, aspects, and full personal story as a shareable PDF.
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={[styles.syncButton, pdfExporting && styles.syncButtonDisabled]}
                  onPress={handleExportChartPdf}
                  disabled={pdfExporting}
                  accessibilityRole="button"
                  accessibilityLabel="Export chart as PDF"
                >
                  {pdfExporting ? (
                    <ActivityIndicator size="small" color={accentGold} />
                  ) : (
                    <MetallicIcon name="download-outline" size={16} color={accentGold} />
                  )}
                  <MetallicText color={accentGold} style={styles.syncButtonText}>
                    {pdfExporting ? 'Generating...' : 'Export PDF'}
                  </MetallicText>
                </Pressable>
              </View>
            </ObsidianSettingsGroup>
            </VelvetGlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <VelvetGlassCard
              interactive={false}
              style={styles.groupShell}
              backgroundColor={theme.isDark ? 'rgba(15, 14, 18, 0.56)' : 'rgba(255,255,255,0.78)'}
              borderColor="rgba(212,175,55,0.12)"
              topEdgeColor="rgba(255,255,255,0.18)"
            >
            <ObsidianSettingsGroup title="Security & Data Protection" subtitle="Your data is fully encrypted" style={styles.groupInner}>
                <View style={styles.securityGrid}>
                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <MetallicIcon name="lock-closed-outline" size={16} color={accentGold} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>Local Encryption</Text>
                      <Text style={styles.securityDetail}>AES-256-GCM with a per-device key stored in your hardware keychain</Text>
                    </View>
                  </View>

                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <MetallicIcon name="airplane-outline" size={16} color={accentGold} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>No Content Transmitted</Text>
                      <Text style={styles.securityDetail}>Journal entries, dreams, and check-ins never leave your device. Birth-city text is sent to Nominatim for geocoding.</Text>
                    </View>
                  </View>

                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <MetallicIcon name="analytics-outline" size={16} color={accentGold} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>Zero Third-Party Analytics</Text>
                      <Text style={styles.securityDetail}>No tracking SDKs, no advertising IDs, no third-party profiling</Text>
                    </View>
                  </View>

                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <MetallicIcon name="document-text-outline" size={16} color={accentGold} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>Minimal Event Logging</Text>
                      <Text style={styles.securityDetail}>Only the 20 most recent security events are kept — no sensitive content is ever logged</Text>
                    </View>
                  </View>
                </View>
            </ObsidianSettingsGroup>
            </VelvetGlassCard>
          </Animated.View>

          {/* ── Calibration (Celestial Toggles) ── */}
          <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.section}>
            <VelvetGlassCard
              interactive={false}
              style={styles.groupShell}
              backgroundColor={theme.isDark ? 'rgba(15, 14, 18, 0.56)' : 'rgba(255,255,255,0.78)'}
              borderColor="rgba(212,175,55,0.12)"
              topEdgeColor="rgba(255,255,255,0.18)"
            >
            <ObsidianSettingsGroup title="Personalization" subtitle="Fine-tune your experience" style={styles.groupInner}>
              <Pressable
                style={{ paddingHorizontal: 20, paddingVertical: 14 }}
                onPress={async () => {
                  try { Haptics.selectionAsync().catch(() => {}); } catch {}
                  router.push('/settings/notifications' as Href);
                }}
                accessibilityRole="button"
                accessibilityLabel="Notification schedule settings"
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <MetallicIcon name="notifications-outline" size={20} color={accentGold} />
                      <Text style={styles.settingTitle}>Notification Schedule</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      Set morning and evening reminder times
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color={styles.chevronTint.color} />
                </View>
              </Pressable>
              <ObsidianDivider />
              <GlassToggle
                value={hapticEnabled}
                onToggle={(v) => togglePref('pref_haptic', v, setHapticEnabled)}
                label="Haptic Feedback"
                description="Tactile response on interactions"
              />
              <ObsidianDivider />
              <GlassToggle
                value={dailyReminderEnabled}
                onToggle={toggleDailyReminder}
                label="Daily Check-in Reminder"
                description="Daily nudge to log your internal weather"
              />
              <ObsidianDivider />
              <GlassToggle
                value={moodInsightsEnabled}
                onToggle={(v) => togglePref('pref_mood_insights', v, setMoodInsightsEnabled)}
                label="Mood Pattern Insights"
                description="Surface recurring patterns in your daily check-ins"
              />
              <ObsidianDivider />
              <GlassToggle
                value={dreamLoggingEnabled}
                onToggle={(v) => togglePref('pref_dream_logging', v, setDreamLoggingEnabled)}
                label="Subconscious Capture"
                description="Enable dream logging and archetypal reflection"
              />
            </ObsidianSettingsGroup>
            </VelvetGlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <VelvetGlassCard
              interactive={false}
              style={styles.groupShell}
              backgroundColor={theme.isDark ? 'rgba(15, 14, 18, 0.56)' : 'rgba(255,255,255,0.78)'}
              borderColor="rgba(212,175,55,0.12)"
              topEdgeColor="rgba(255,255,255,0.18)"
            >
            <ObsidianSettingsGroup title="Privacy & Data" subtitle="Device-only, encrypted at rest" style={styles.groupInner}>
              <Pressable style={{ paddingHorizontal: 20, paddingVertical: 14 }} onPress={() => setShowPrivacyModal(true)} accessibilityRole="button" accessibilityLabel="Privacy settings">
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <MetallicIcon name="shield-checkmark-outline" size={20} color={accentGold} />
                      <Text style={styles.settingTitle}>Privacy Settings</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      Export, delete, or manage your data on this device
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color={styles.chevronTint.color} />
                </View>
              </Pressable>
              <ObsidianDivider />
              <View style={[styles.privacyInfo, { marginHorizontal: 16, marginBottom: 8 }]}>
                <View style={styles.privacyItem}>
                  <MetallicIcon name="phone-portrait-outline" size={16} color={accentGold} />
                  <Text style={styles.privacyText}>Data stored locally on your device</Text>
                </View>
                <View style={styles.privacyItem}>
                  <MetallicIcon name="shield-outline" size={16} color={accentGold} />
                  <Text style={styles.privacyText}>Protected by your device passcode / biometrics</Text>
                </View>
                <View style={styles.privacyItem}>
                  <MetallicIcon name="ban-outline" size={16} color={accentGold} />
                  <Text style={styles.privacyText}>Never sold or shared</Text>
                </View>
              </View>
            </ObsidianSettingsGroup>
            </VelvetGlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(475).duration(600)} style={styles.section}>
            <Pressable
              style={styles.sectionTitleRow}
              onPress={async () => {
                try { Haptics.selectionAsync().catch(() => {}); } catch {}
                setShowFaq(prev => !prev);
              }}
              accessibilityRole="button"
              accessibilityLabel="Toggle FAQ"
            >
              <Text style={styles.sectionTitle}>FAQ</Text>
              <Ionicons
                name={showFaq ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.textMuted}
              />
            </Pressable>

            {showFaq && (
              <View style={styles.settingCard}>
                <LinearGradient colors={settingsFaqGradient} style={styles.glossaryGradient}>
                  {FAQ.map((item, index) => (
                    <Pressable
                      key={item.question}
                      onPress={async () => {
                        try {
                          Haptics.selectionAsync().catch(() => {});
                        } catch {}
                        setExpandedFaq(expandedFaq === item.question ? null : item.question);
                      }}
                      style={[styles.glossaryRow, index < FAQ.length - 1 && styles.glossaryRowBorder]}
                      accessibilityRole="button"
                      accessibilityLabel={item.question}
                    >
                      <View style={styles.glossaryHeader}>
                        <Text style={styles.glossaryTerm}>{item.question}</Text>
                        <Ionicons
                          name={expandedFaq === item.question ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={theme.textMuted}
                        />
                      </View>
                      {expandedFaq === item.question && <Text style={styles.glossaryDefinition}>{item.answer}</Text>}
                    </Pressable>
                  ))}
                </LinearGradient>
              </View>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(550).duration(600)} style={styles.section}>
            <ObsidianSettingsGroup title="Legal" subtitle="Policies and documentation">
              <Pressable
                style={{ paddingHorizontal: 20, paddingVertical: 14 }}
                onPress={openPrivacyPolicy}
                accessibilityRole="button"
                accessibilityLabel="Privacy Policy"
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <MetallicIcon name="shield-half-outline" size={20} color={accentGold} />
                      <Text style={styles.settingTitle}>Privacy Policy</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      How MySky handles your data and protects your privacy
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color={styles.chevronTint.color} />
                </View>
              </Pressable>
              <ObsidianDivider />
              <Pressable
                style={{ paddingHorizontal: 20, paddingVertical: 14 }}
                onPress={openTerms}
                accessibilityRole="button"
                accessibilityLabel="Terms of Use (EULA)"
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <MetallicIcon name="ribbon-outline" size={20} color={accentGold} />
                      <Text style={styles.settingTitle}>Terms of Use (EULA)</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      App terms, subscription details, and disclaimers
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color={styles.chevronTint.color} />
                </View>
              </Pressable>
              <ObsidianDivider />
              <Pressable
                style={{ paddingHorizontal: 20, paddingVertical: 14 }}
                onPress={openFaq}
                accessibilityRole="button"
                accessibilityLabel="FAQ"
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <MetallicIcon name="diamond-outline" size={20} color={accentGold} />
                      <Text style={styles.settingTitle}>FAQ</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      Answers to common questions about privacy, backups, and premium
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={16} color={styles.chevronTint.color} />
                </View>
              </Pressable>
            </ObsidianSettingsGroup>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(625).duration(600)} style={styles.section}>
            <ObsidianSettingsGroup title="Support" subtitle="We're here to help">
              <Pressable
                style={{ paddingHorizontal: 20, paddingVertical: 14 }}
                onPress={openSupportEmail}
                accessibilityRole="link"
                accessibilityLabel="Contact us via email"
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <MetallicIcon name="mail-outline" size={20} color={accentGold} />
                      <Text style={styles.settingTitle}>Contact Us</Text>
                    </View>
                    <Text style={styles.settingDescription}>Get help with MySky</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={styles.chevronTint.color} />
                </View>
              </Pressable>
            </ObsidianSettingsGroup>
          </Animated.View>

          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.section}>
              <Pressable
                style={styles.settingCard}
                onPress={() => setShowPremiumModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Learn about premium features"
              >
                <LinearGradient
                  colors={['rgba(232, 214, 174, 0.12)', 'rgba(232, 214, 174, 0.04)']}
                  style={[styles.cardGradient, { borderWidth: 1, borderColor: 'rgba(232,214,174,0.18)' }]}
                >
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <MetallicIcon name="sparkles-outline" size={20} color={accentGold} />
                        <Text style={styles.settingTitle}>Deeper Sky</Text>
                      </View>
                      <Text style={styles.settingDescription}>
                        Full personal story, deeper reflection insights, unlimited relationships, pattern analysis, encrypted backup, and reflective guidance — $4.99/mo or $29.99/yr.
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward-outline" size={16} color={styles.chevronTint.color} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {isPremium && (
            <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Subscription</Text>
              <Pressable
                style={styles.settingCard}
                onPress={async () => {
                  try { Haptics.selectionAsync().catch(() => {}); } catch {}
                  try {
                    const url = 'https://apps.apple.com/account/subscriptions';
                    await Linking.openURL(url);
                  } catch {
                    const instructions = 'Go to Settings → Apple ID → Subscriptions to manage your plan.';
                    Alert.alert('Unable to Open', instructions);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Manage your subscription"
              >
                <LinearGradient
                  colors={['rgba(232, 214, 174, 0.12)', 'rgba(232, 214, 174, 0.04)']}
                  style={[styles.cardGradient, { borderWidth: 1, borderColor: 'rgba(232,214,174,0.18)' }]}
                >
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <MetallicIcon name="sparkles-outline" size={20} color={accentGold} />
                        <Text style={styles.settingTitle}>Deeper Sky Active</Text>
                      </View>
                      <Text style={styles.settingDescription}>
                        Manage, upgrade, or cancel your subscription
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={16} color={styles.chevronTint.color} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Account */}
          {user && (
            <Animated.View entering={FadeInDown.delay(750).duration(600)} style={styles.section}>
              <ObsidianSettingsGroup title="Account" subtitle={user.email ?? ''}>
                <Pressable
                  style={{ paddingHorizontal: 20, paddingVertical: 14 }}
                  onPress={() => {
                    Alert.alert(
                      'Sign Out',
                      'Are you sure you want to sign out?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Sign Out',
                          style: 'destructive',
                          onPress: signOut,
                        },
                      ],
                    );
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Sign out"
                >
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <MetallicIcon name="log-out-outline" size={20} color={accentCopper} />
                        <Text style={styles.settingTitle}>Sign Out</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={16} color="rgba(255,255,255,0.3)" />
                  </View>
                </Pressable>
                <ObsidianDivider />
                <Pressable
                  style={{ paddingHorizontal: 20, paddingVertical: 14 }}
                  onPress={() => {
                    Alert.alert(
                      'Delete Account',
                      'This will permanently delete your account and synced data. Local data already on this device is not erased immediately, but it will not be reused by a different signed-in account. This cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete Account',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              const { error } = await supabase.rpc('delete_user_account');
                              if (error) throw error;
                              await signOut();
                            } catch (err: unknown) {
                              const msg = err instanceof Error ? err.message : 'Something went wrong';
                              Alert.alert('Error', `Could not delete account: ${msg}\n\nPlease contact ${SUPPORT_EMAIL} to request deletion.`);
                            }
                          },
                        },
                      ],
                    );
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Delete account"
                >
                  <View style={styles.deleteAccountRow}>
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <View style={styles.settingHeader}>
                          <MetallicIcon name="trash-outline" size={20} color={errorColor} />
                          <MetallicText color={errorColor} style={styles.settingTitle}>Delete Account</MetallicText>
                        </View>
                        <Text style={styles.settingDescription}>
                          Permanently removes your account and synced data
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward-outline" size={16} color="rgba(220,50,50,0.4)" />
                    </View>
                  </View>
                </Pressable>
              </ObsidianSettingsGroup>
            </Animated.View>
          )}

          {/* Version — always at the very bottom */}
          <Text style={styles.versionText}>
            MySky v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </ScrollView>
      </SafeAreaView>

      <PremiumModal visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      <PrivacySettingsModal visible={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      <BackupPassphraseModal
        visible={backupModalVisible}
        mode="backup"
        onCancel={() => setBackupModalVisible(false)}
        onConfirm={async (passphrase) => {
          setBackupModalVisible(false);
          await performBackup(passphrase);
        }}
      />

      <BackupPassphraseModal
        visible={restoreModalVisible}
        mode="restore"
        onCancel={() => {
          setRestoreModalVisible(false);
          setRestoreUri(null);
        }}
        onConfirm={async (passphrase) => {
          setRestoreModalVisible(false);
          await performRestore(passphrase);
        }}
      />

      <BirthDataModal
        visible={showBirthModal}
        onClose={() => setShowBirthModal(false)}
        onSave={handleIdentitySave}
        initialData={birthInitial}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },

  header: { marginTop: 10, marginBottom: 8, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleArea: { flex: 1 },
  greeting: {
    color: theme.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dateLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4 },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },

  section: { marginBottom: theme.spacing.xl },
  groupShell: {
    borderRadius: 28,
  },
  groupInner: {
    width: '100%',
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 20,
    marginTop: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  chevronTint: {
    color: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(22,32,51,0.3)',
  },

  settingCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: 16,
  },
  cardGradient: { padding: 28 },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingInfo: { flex: 1, flexShrink: 1, marginRight: theme.spacing.md },
  settingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs },
  settingTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginLeft: theme.spacing.sm, flex: 1 },

  premiumBadge: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  premiumText: { fontSize: 10, color: theme.primary, fontWeight: '600' },

  settingDescription: { fontSize: 14, color: theme.textSecondary, lineHeight: 22, flexShrink: 1, flexWrap: "wrap" },
  lastSyncText: { fontSize: 12, color: theme.textMuted, marginTop: theme.spacing.xs },

  backupActions: { gap: theme.spacing.sm },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,248,240,0.54)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(212,175,55,0.14)' : 'rgba(181,138,58,0.18)',
  },
  syncButtonDisabled: { opacity: 0.6 },
  syncButtonText: { fontSize: 14, color: '#D4AF37', fontWeight: '600' },

  // ── Identity ──
  identityCard: {
    marginBottom: 12,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  identityAvatarContainer: {},
  identityAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  identityInfo: {
    flex: 1,
  },
  identityName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  identityDetail: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  identityEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(162, 194, 225, 0.10)',
    borderWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.28)',
    borderLeftColor: 'rgba(212, 175, 55, 0.18)',
    borderRightColor: 'rgba(212, 175, 55, 0.12)',
    borderBottomColor: 'rgba(212, 175, 55, 0.08)',
  },
  identityEditText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },

  premiumCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.25)',
  },
  premiumContent: { flexDirection: 'row', alignItems: 'center' },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  premiumInfo: { flex: 1 },
  premiumTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 },
  premiumDescription: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },

  privacyInfo: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,249,243,0.6)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(181,138,58,0.12)',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  privacyItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  privacyText: { fontSize: 12, color: theme.textSecondary, flex: 1 },

  appearanceBlock: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  appearanceOptionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    padding: 4,
    borderRadius: 24,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,249,243,0.5)',
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(181,138,58,0.12)',
  },
  appearanceChip: {
    flex: 1,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(181,138,58,0.12)',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appearanceChipActive: {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.82)' : 'rgba(162, 194, 225, 0.22)',
    borderColor: theme.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(212,175,55,0.36)',
  },
  appearanceChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.isDark ? 'rgba(255,255,255,0.62)' : 'rgba(22,32,51,0.56)',
  },
  appearanceChipTextActive: {
    color: theme.isDark ? '#0A0A0F' : '#7A5A15',
    fontWeight: '700',
  },
  appearanceCaption: {
    marginTop: theme.spacing.sm,
    fontSize: 12,
    color: theme.textMuted,
  },

  securityGrid: { gap: 20, paddingHorizontal: 20, paddingVertical: 8 },
  securityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  securityBullet: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(162, 194, 225, 0.10)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  securityContent: { flex: 1 },
  securityLabel: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 },
  securityDetail: { fontSize: 12, color: theme.textSecondary, lineHeight: 17 },

  chartSettingsSummary: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  settingTag: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  settingTagText: { fontSize: 11, color: theme.primary, fontWeight: '500' },

  glossaryGradient: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
  glossaryRow: { paddingVertical: theme.spacing.md },
  glossaryRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.cardBorder },
  glossaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  glossaryTerm: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, flex: 1 },
  glossaryDefinition: { fontSize: 14, color: theme.textSecondary, lineHeight: 20, marginTop: theme.spacing.xs },

  versionText: { fontSize: 11, color: theme.textMuted, textAlign: 'center', marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm, letterSpacing: 0.5 },

  deleteAccountRow: {
    borderRadius: 18,
    marginHorizontal: 10,
    marginBottom: 4,
    backgroundColor: 'rgba(220, 50, 50, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(220, 50, 50, 0.14)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  // Key-loss warning banner
  keyLossBanner: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 122, 0.4)',
  },
  keyLossBannerGradient: {
    padding: theme.spacing.lg,
  },
  keyLossBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  keyLossBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E07A7A',
  },
  keyLossBannerText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  keyLossBannerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  keyLossBannerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.sm,
  },
  keyLossBannerButtonDestructive: {
    backgroundColor: 'rgba(224, 122, 122, 0.1)',
  },
  keyLossBannerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
});
