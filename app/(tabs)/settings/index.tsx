// app/(tabs)/settings/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Linking, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptedAsyncStorage } from '../../../services/storage/encryptedAsyncStorage';

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
import { logger } from '../../../utils/logger';
import { SUPPORT_EMAIL } from '../../../constants/config';
import { NotificationEngine } from '../../../utils/NotificationEngine';
import SkiaCelestialToggle from '../../../components/ui/SkiaCelestialToggle';
import ObsidianSettingsGroup, { ObsidianDivider } from '../../../components/ui/ObsidianSettingsGroup';

// ── Desert Titanium & Velvet Tech Palette ──
const PREMIUM = {
  bgOled: '#000000',
  titanium: '#C5B5A1', // Sophisticated, high-tech desaturated gold
  glassBorder: 'rgba(197, 181, 161, 0.25)', 
  glassFill: 'rgba(15, 15, 15, 0.4)', 
  textMain: '#F5F5F7',
  textMuted: '#86868B',
  danger: '#FF453A',
  dangerGlow: 'rgba(255, 69, 58, 0.15)',
  success: '#30D158',
};

const DISPLAY = Platform.select({ ios: 'SFProDisplay-Regular', android: 'sans-serif', default: 'System' });
const DISPLAY_SEMIBOLD = Platform.select({ ios: 'SFProDisplay-Semibold', android: 'sans-serif-medium', default: 'System' });
const DISPLAY_BOLD = Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' });

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
      'Deeper Sky unlocks encrypted backup & restore, the full personal story (10 chapters), healing & inner work (attachment styles, shadow work), unlimited relationship charts, journal pattern analysis, deep insights & tag intelligence, Chiron & Node depth mapping, personalized daily guidance with action steps, extended pattern analysis, full energy chakra mapping, and symbolic dream reflections.',
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
      'Yes. Monthly and yearly subscriptions are managed through your device’s app store. On iOS, go to Settings > Apple ID > Subscriptions. On Android, go to Google Play > Subscriptions. You keep access through the end of your billing period. Lifetime purchases do not renew and do not have a cancellation setting (refunds follow the app store’s policy).',
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
      'Anyone can log a dream narrative — just open the Sleep tab and type in the Dream Memory field. Deeper Sky members also get symbolic interpretation: MySky scans your dream text for recurring symbols (water, falling, doors, etc.) and maps them to Jungian archetypes, weaving in context from your mood check-ins, sleep patterns, and journal entries. The result is a personalized reflection generated entirely on your device with no AI, no network calls, and no data leaving your phone.',
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();
  const { user, signOut } = useAuth();

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

  // ── Calibration preferences ──
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [moodInsightsEnabled, setMoodInsightsEnabled] = useState(true);
  const [dreamLoggingEnabled, setDreamLoggingEnabled] = useState(true);

  // ── Identity state ──
  const [identityName, setIdentityName] = useState<string>('');
  const [identityBirthSummary, setIdentityBirthSummary] = useState<string>('');
  const [identityPlace, setIdentityPlace] = useState<string>('');
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
      lastBackupAt: null as string | null,
    };
    await localDb.saveSettings(defaults);
    return defaults;
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await ensureSettings();
      setLastBackupAt(settings.lastBackupAt || null);

      const keyOk = await FieldEncryptionService.isKeyAvailable();
      setEncryptionKeyLost(!keyOk);

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

      try {
        const charts = await localDb.getCharts();
        if (charts.length > 0) {
          const chart = charts[0];
          setIdentityChartId(chart.id);
          setIdentityName(chart.name || '');
          setIdentityPlace(chart.birthPlace || '');
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

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const togglePref = useCallback(async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try { await AsyncStorage.setItem(key, value ? '1' : '0'); } catch {}
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    Alert.alert(
      'Deeper Sky Feature',
      'Encrypted backup & restore keeps your data safe. Available with Deeper Sky (subscription or lifetime).',
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
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert('Backup Ready', 'Your encrypted backup is ready to save or share.');
    } catch (error: any) {
      logger.error('Backup failed:', error);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert('Restore Complete', 'Your data has been restored on this device.');
      setRestoreUri(null);
      await loadSettings();
    } catch (error: any) {
      logger.error('Restore failed:', error);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      await Haptics.selectionAsync();
    } catch {}
    router.navigate('/privacy' as Href);
  };

  const handleEditIdentity = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    if (birthInitial) {
      setShowBirthModal(true);
    } else {
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
      setIdentityName(extra?.chartName ?? chart.name);
      setIdentityPlace(chart.birthData.place);
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
      await Haptics.selectionAsync();
    } catch {}
    router.navigate('/terms' as Href);
  };

  const openFaq = async () => {
    try {
      await Haptics.selectionAsync();
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
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const chart = AstrologyCalculator.generateNatalChart(birthInitial as any);
      const { chapters } = FullNatalStoryGenerator.generateFullStory(chart, true);
      await exportChartToPdf(chart, chapters);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      logger.error('Chart PDF export failed:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Export Failed', error?.message || 'Unable to generate PDF.');
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── OLED Base & Nebula Blur ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: PREMIUM.bgOled }]}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      </View>
      
      {/* ── Stars On Top ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <SkiaDynamicCosmos fill="transparent" />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Instrument precision · Data sovereignty</Text>
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
              <View style={styles.keyLossBannerHeader}>
                <Ionicons name="warning-outline" size={22} color={PREMIUM.danger} />
                <Text style={styles.keyLossBannerTitle}>Encryption Key Unavailable</Text>
              </View>
              <Text style={styles.keyLossBannerText}>
                Your encrypted data cannot be read on this device. This can happen after a device migration, OS update, or app reinstall.
              </Text>
              <View style={styles.keyLossBannerActions}>
                <Pressable
                  style={styles.keyLossBannerButton}
                  onPress={handleRestore}
                  accessibilityRole="button"
                >
                  <Ionicons name="cloud-download-outline" size={16} color={PREMIUM.titanium} />
                  <Text style={styles.keyLossBannerButtonText}>Restore Backup</Text>
                </Pressable>
                <Pressable
                  style={[styles.keyLossBannerButton, styles.keyLossBannerButtonDestructive]}
                  onPress={() => setShowPrivacyModal(true)}
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={16} color={PREMIUM.danger} />
                  <Text style={[styles.keyLossBannerButtonText, { color: PREMIUM.danger }]}>Delete All Data</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* ── Your Identity ── */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.section}>
            <ObsidianSettingsGroup title="Your Identity" subtitle="Birth chart anchor point">
              <View style={{ paddingHorizontal: 16 }}>
                <View style={styles.identityCard}>
                  <View style={styles.identityRow}>
                    <View style={styles.identityAvatar}>
                      <Ionicons name="person-outline" size={24} color={PREMIUM.titanium} />
                    </View>
                    <View style={styles.identityInfo}>
                      <Text style={styles.identityName}>{identityName || 'Your Chart'}</Text>
                      {identityBirthSummary ? (
                        <Text style={styles.identityDetail}>{identityBirthSummary}</Text>
                      ) : null}
                      {identityPlace ? (
                        <Text style={styles.identityDetail}>{identityPlace}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                <Pressable
                  style={styles.identityEditButton}
                  onPress={handleEditIdentity}
                  accessibilityRole="button"
                >
                  <Ionicons name="create-outline" size={16} color={PREMIUM.titanium} />
                  <Text style={styles.identityEditText}>Edit Birth Data</Text>
                </Pressable>
              </View>
            </ObsidianSettingsGroup>
          </Animated.View>

          {/* ── Encrypted Backup ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <ObsidianSettingsGroup title="Encrypted Backup" subtitle="End-to-end encrypted, you control the key">
                <View style={{ paddingHorizontal: 16 }}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <Ionicons name="cloud-upload-outline" size={20} color={PREMIUM.titanium} />
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
                    >
                      <Ionicons name="cloud-upload-outline" size={16} color={PREMIUM.titanium} />
                      <Text style={styles.syncButtonText}>{backupInProgress ? 'Preparing...' : 'Backup Now'}</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.syncButton, disableActions && styles.syncButtonDisabled]}
                      onPress={handleRestore}
                      disabled={disableActions}
                      accessibilityRole="button"
                    >
                      <Ionicons name="cloud-download-outline" size={16} color={PREMIUM.titanium} />
                      <Text style={styles.syncButtonText}>{restoreInProgress ? 'Restoring...' : 'Restore Backup'}</Text>
                    </Pressable>
                  </View>
                </View>
            </ObsidianSettingsGroup>
          </Animated.View>

          {/* ── Export ── */}
          <Animated.View entering={FadeInDown.delay(275).duration(600)} style={styles.section}>
            <ObsidianSettingsGroup title="Export" subtitle="Download your data as a PDF">
              <View style={{ paddingHorizontal: 16 }}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="document-outline" size={20} color={PREMIUM.titanium} />
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
                >
                  {pdfExporting ? (
                    <ActivityIndicator size="small" color={PREMIUM.titanium} />
                  ) : (
                    <Ionicons name="download-outline" size={16} color={PREMIUM.titanium} />
                  )}
                  <Text style={styles.syncButtonText}>
                    {pdfExporting ? 'Generating...' : 'Export PDF'}
                  </Text>
                </Pressable>
              </View>
            </ObsidianSettingsGroup>
          </Animated.View>

          {/* ── Security Details ── */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <ObsidianSettingsGroup title="Security & Data Protection" subtitle="Your data is fully encrypted">
                <View style={styles.securityGrid}>
                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <Ionicons name="lock-closed-outline" size={16} color={PREMIUM.success} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>Local Encryption</Text>
                      <Text style={styles.securityDetail}>AES-256-GCM with a per-device key stored in your hardware keychain</Text>
                    </View>
                  </View>

                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <Ionicons name="airplane-outline" size={16} color={PREMIUM.success} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>No Content Transmitted</Text>
                      <Text style={styles.securityDetail}>Journal entries, dreams, and check-ins never leave your device. Birth-city text is sent to Nominatim for geocoding.</Text>
                    </View>
                  </View>

                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <Ionicons name="analytics-outline" size={16} color={PREMIUM.success} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>Zero Third-Party Analytics</Text>
                      <Text style={styles.securityDetail}>No tracking SDKs, no advertising IDs, no third-party profiling</Text>
                    </View>
                  </View>

                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <Ionicons name="document-text-outline" size={16} color={PREMIUM.success} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>Minimal Event Logging</Text>
                      <Text style={styles.securityDetail}>Only the 20 most recent security events are kept — no sensitive content is ever logged</Text>
                    </View>
                  </View>
                </View>
            </ObsidianSettingsGroup>
          </Animated.View>

          {/* ── Calibration (Celestial Toggles) ── */}
          <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.section}>
            <ObsidianSettingsGroup title="Personalization" subtitle="Fine-tune your experience">
              <Pressable
                style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                onPress={async () => {
                  try { await Haptics.selectionAsync(); } catch {}
                  router.push('/settings/notifications' as Href);
                }}
                accessibilityRole="button"
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="notifications-outline" size={20} color={PREMIUM.textMain} />
                      <Text style={styles.settingTitle}>Notification Schedule</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      Set morning and evening reminder times
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={20} color={PREMIUM.textMuted} />
                </View>
              </Pressable>
              <ObsidianDivider />
              <SkiaCelestialToggle
                value={hapticEnabled}
                onToggle={(v) => togglePref('pref_haptic', v, setHapticEnabled)}
                label="Haptic Feedback"
                description="Tactile response on interactions"
              />
              <ObsidianDivider />
              <SkiaCelestialToggle
                value={dailyReminderEnabled}
                onToggle={toggleDailyReminder}
                label="Daily Check-in Reminder"
                description="Daily nudge to log your internal weather"
              />
              <ObsidianDivider />
              <SkiaCelestialToggle
                value={moodInsightsEnabled}
                onToggle={(v) => togglePref('pref_mood_insights', v, setMoodInsightsEnabled)}
                label="Mood Pattern Insights"
                description="Surface recurring patterns in your daily check-ins"
              />
              <ObsidianDivider />
              <SkiaCelestialToggle
                value={dreamLoggingEnabled}
                onToggle={(v) => togglePref('pref_dream_logging', v, setDreamLoggingEnabled)}
                label="Subconscious Capture"
                description="Enable dream logging and archetypal reflection"
              />
            </ObsidianSettingsGroup>
          </Animated.View>

          {/* ── Privacy & Data ── */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <ObsidianSettingsGroup title="Privacy & Data" subtitle="Device-only, encrypted at rest">
              <Pressable style={{ paddingHorizontal: 16, paddingVertical: 12 }} onPress={() => setShowPrivacyModal(true)} accessibilityRole="button">
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="shield-checkmark-outline" size={20} color={PREMIUM.textMain} />
                      <Text style={styles.settingTitle}>Privacy Settings</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      Export, delete, or manage your data on this device
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={20} color={PREMIUM.textMuted} />
                </View>
              </Pressable>
              <ObsidianDivider />
              <View style={[styles.privacyInfo, { marginHorizontal: 16, marginBottom: 8 }]}>
                <View style={styles.privacyItem}>
                  <Ionicons name="phone-portrait-outline" size={16} color={PREMIUM.textMuted} />
                  <Text style={styles.privacyText}>Data stored locally on your device</Text>
                </View>
                <View style={styles.privacyItem}>
                  <Ionicons name="shield-outline" size={16} color={PREMIUM.success} />
                  <Text style={styles.privacyText}>Protected by your device passcode / biometrics</Text>
                </View>
                <View style={styles.privacyItem}>
                  <Ionicons name="ban-outline" size={16} color={PREMIUM.danger} />
                  <Text style={styles.privacyText}>Never sold or shared</Text>
                </View>
              </View>
            </ObsidianSettingsGroup>
          </Animated.View>

          {/* ── FAQ Accordion ── */}
          <Animated.View entering={FadeInDown.delay(475).duration(600)} style={styles.section}>
            <Pressable
              style={styles.sectionTitleRow}
              onPress={async () => {
                try { await Haptics.selectionAsync(); } catch {}
                setShowFaq(prev => !prev);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.sectionTitle}>FAQ</Text>
              <Ionicons
                name={showFaq ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={PREMIUM.textMuted}
              />
            </Pressable>

            {showFaq && (
              <View style={styles.settingCard}>
                <BlurView intensity={30} tint="dark" style={styles.glossaryContainer}>
                  {FAQ.map((item, index) => (
                    <Pressable
                      key={item.question}
                      onPress={async () => {
                        try {
                          await Haptics.selectionAsync();
                        } catch {}
                        setExpandedFaq(expandedFaq === item.question ? null : item.question);
                      }}
                      style={[styles.glossaryRow, index < FAQ.length - 1 && styles.glossaryRowBorder]}
                      accessibilityRole="button"
                    >
                      <View style={styles.glossaryHeader}>
                        <Text style={styles.glossaryTerm}>{item.question}</Text>
                        <Ionicons
                          name={expandedFaq === item.question ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={PREMIUM.textMuted}
                        />
                      </View>
                      {expandedFaq === item.question && <Text style={styles.glossaryDefinition}>{item.answer}</Text>}
                    </Pressable>
                  ))}
                </BlurView>
              </View>
            )}
          </Animated.View>

          {/* ── Legal & Support ── */}
          <Animated.View entering={FadeInDown.delay(550).duration(600)} style={styles.section}>
            <ObsidianSettingsGroup title="Legal & Support" subtitle="Policies and documentation">
              <Pressable style={{ paddingHorizontal: 16, paddingVertical: 12 }} onPress={openPrivacyPolicy} accessibilityRole="button">
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="shield-half-outline" size={20} color={PREMIUM.textMain} />
                      <Text style={styles.settingTitle}>Privacy Policy</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={20} color={PREMIUM.textMuted} />
                </View>
              </Pressable>
              <ObsidianDivider />
              <Pressable style={{ paddingHorizontal: 16, paddingVertical: 12 }} onPress={openTerms} accessibilityRole="button">
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="ribbon-outline" size={20} color={PREMIUM.textMain} />
                      <Text style={styles.settingTitle}>Terms of Use (EULA)</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={20} color={PREMIUM.textMuted} />
                </View>
              </Pressable>
              <ObsidianDivider />
              <Pressable style={{ paddingHorizontal: 16, paddingVertical: 12 }} onPress={openSupportEmail} accessibilityRole="link">
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="mail-outline" size={20} color={PREMIUM.titanium} />
                      <Text style={styles.settingTitle}>Contact Support</Text>
                    </View>
                  </View>
                  <Ionicons name="open-outline" size={18} color={PREMIUM.textMuted} />
                </View>
              </Pressable>
            </ObsidianSettingsGroup>
          </Animated.View>

          {/* ── Premium Gateway ── */}
          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.section}>
              <Pressable
                style={styles.premiumCard}
                onPress={() => setShowPremiumModal(true)}
                accessibilityRole="button"
              >
                <BlurView intensity={40} tint="dark" style={styles.cardGradient}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <Ionicons name="sparkles-outline" size={20} color={PREMIUM.titanium} />
                        <Text style={styles.settingTitle}>Deeper Sky</Text>
                      </View>
                      <Text style={styles.settingDescription}>
                        Full personal story, healing insights, unlimited relationships, pattern analysis, encrypted backup, and personalized guidance — $4.99/mo • $29.99/yr • $49.99 lifetime.
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward-outline" size={20} color={PREMIUM.titanium} />
                  </View>
                </BlurView>
              </Pressable>
            </Animated.View>
          )}

          {isPremium && (
            <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.section}>
              <Text style={styles.sectionTitle}>Subscription</Text>
              <Pressable
                style={styles.premiumCard}
                onPress={async () => {
                  try { await Haptics.selectionAsync(); } catch {}
                  try {
                    const url = Platform.select({
                      ios: 'https://apps.apple.com/account/subscriptions',
                      android: 'https://play.google.com/store/account/subscriptions',
                      default: 'https://apps.apple.com/account/subscriptions',
                    });
                    await Linking.openURL(url);
                  } catch {
                    Alert.alert('Unable to Open', 'Go to your device\'s app store settings to manage your subscription.');
                  }
                }}
                accessibilityRole="button"
              >
                <BlurView intensity={40} tint="dark" style={styles.cardGradient}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <Ionicons name="sparkles-outline" size={20} color={PREMIUM.titanium} />
                        <Text style={styles.settingTitle}>Deeper Sky Active</Text>
                      </View>
                      <Text style={styles.settingDescription}>
                        Manage, upgrade, or cancel your subscription
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={18} color={PREMIUM.titanium} />
                  </View>
                </BlurView>
              </Pressable>
            </Animated.View>
          )}

          {/* Account */}
          {user && (
            <Animated.View entering={FadeInDown.delay(750).duration(600)} style={styles.section}>
              <ObsidianSettingsGroup title="Account" subtitle={user.email ?? ''}>
                <Pressable
                  style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                  onPress={() => {
                    Alert.alert(
                      'Sign Out',
                      'Are you sure you want to sign out?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Sign Out', style: 'destructive', onPress: signOut },
                      ],
                    );
                  }}
                  accessibilityRole="button"
                >
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <Ionicons name="log-out-outline" size={20} color={PREMIUM.textMain} />
                        <Text style={styles.settingTitle}>Sign Out</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={20} color={PREMIUM.textMuted} />
                  </View>
                </Pressable>
                <ObsidianDivider />
                <Pressable
                  style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                  onPress={() => {
                    Alert.alert(
                      'Delete Account',
                      'This will permanently delete your account and all associated data. Your local app data (charts, journals, check-ins) will remain on this device. This cannot be undone.',
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
                >
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <Ionicons name="trash-outline" size={20} color={PREMIUM.danger} />
                        <Text style={[styles.settingTitle, { color: PREMIUM.danger }]}>Delete Account</Text>
                      </View>
                      <Text style={styles.settingDescription}>
                        Permanently removes your account and synced data
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={20} color={PREMIUM.textMuted} />
                  </View>
                </Pressable>
              </ObsidianSettingsGroup>
            </Animated.View>
          )}

          {/* Version */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PREMIUM.bgOled },
  safeArea: { flex: 1 },

  header: { paddingHorizontal: 24, paddingVertical: 16 },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: PREMIUM.textMain,
    fontFamily: DISPLAY_BOLD,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: 14, 
    color: PREMIUM.titanium, 
    fontFamily: DISPLAY_SEMIBOLD,
    letterSpacing: 0.5,
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PREMIUM.titanium,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 8,
    fontFamily: DISPLAY_BOLD,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },

  settingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
    backgroundColor: PREMIUM.glassFill,
    marginBottom: 12,
  },
  cardGradient: { padding: 16 },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingInfo: { flex: 1, flexShrink: 1, marginRight: 12 },
  settingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  settingTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: PREMIUM.textMain, 
    marginLeft: 8, 
    flex: 1,
    fontFamily: DISPLAY_SEMIBOLD,
  },

  premiumBadge: {
    backgroundColor: 'rgba(197, 181, 161, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: { fontSize: 10, color: PREMIUM.titanium, fontWeight: '700', fontFamily: DISPLAY_BOLD },

  settingDescription: { 
    fontSize: 14, 
    color: PREMIUM.textMuted, 
    lineHeight: 20, 
    flexShrink: 1, 
    flexWrap: "wrap",
    fontFamily: DISPLAY,
  },
  lastSyncText: { 
    fontSize: 12, 
    color: PREMIUM.textMuted, 
    marginTop: 4,
    fontFamily: DISPLAY,
  },

  backupActions: { gap: 8 },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
  },
  syncButtonDisabled: { opacity: 0.5 },
  syncButtonText: { 
    fontSize: 14, 
    color: PREMIUM.titanium, 
    fontWeight: '600', 
    marginLeft: 6,
    fontFamily: DISPLAY_SEMIBOLD,
  },

  // ── Identity ──
  identityCard: {
    marginBottom: 12,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  identityAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PREMIUM.titanium,
    backgroundColor: 'rgba(197, 181, 161, 0.1)',
  },
  identityInfo: {
    flex: 1,
  },
  identityName: {
    fontSize: 18,
    fontWeight: '700',
    color: PREMIUM.textMain,
    fontFamily: DISPLAY_BOLD,
    marginBottom: 2,
  },
  identityDetail: {
    fontSize: 13,
    color: PREMIUM.textMuted,
    lineHeight: 18,
    fontFamily: DISPLAY,
  },
  identityEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
  },
  identityEditText: {
    fontSize: 14,
    fontWeight: '600',
    color: PREMIUM.titanium,
    fontFamily: DISPLAY_SEMIBOLD,
  },

  premiumCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PREMIUM.titanium,
    shadowColor: PREMIUM.titanium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },

  privacyInfo: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  privacyItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  privacyText: { 
    fontSize: 13, 
    color: PREMIUM.textMuted, 
    flex: 1,
    fontFamily: DISPLAY,
  },

  securityGrid: { gap: 12, paddingHorizontal: 16 },
  securityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  securityBullet: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: 'rgba(48, 209, 88, 0.15)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 1 
  },
  securityContent: { flex: 1 },
  securityLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: PREMIUM.textMain, 
    marginBottom: 2,
    fontFamily: DISPLAY_SEMIBOLD,
  },
  securityDetail: { 
    fontSize: 13, 
    color: PREMIUM.textMuted, 
    lineHeight: 18,
    fontFamily: DISPLAY,
  },

  glossaryContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  glossaryRow: { paddingVertical: 16 },
  glossaryRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: PREMIUM.glassBorder },
  glossaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  glossaryTerm: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: PREMIUM.textMain, 
    fontFamily: DISPLAY_SEMIBOLD, 
    flex: 1 
  },
  glossaryDefinition: { 
    fontSize: 14, 
    color: PREMIUM.textMuted, 
    lineHeight: 20, 
    marginTop: 6,
    fontFamily: DISPLAY,
  },

  versionText: { 
    fontSize: 11, 
    color: PREMIUM.textMuted, 
    textAlign: 'center', 
    marginTop: 24, 
    marginBottom: 12, 
    letterSpacing: 1,
    fontFamily: DISPLAY,
  },

  // Key-loss warning banner
  keyLossBanner: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.4)',
    backgroundColor: PREMIUM.dangerGlow,
    padding: 16,
  },
  keyLossBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  keyLossBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PREMIUM.danger,
    fontFamily: DISPLAY_BOLD,
  },
  keyLossBannerText: {
    fontSize: 14,
    color: PREMIUM.textMain,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: DISPLAY,
  },
  keyLossBannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  keyLossBannerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
  },
  keyLossBannerButtonDestructive: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  keyLossBannerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PREMIUM.titanium,
    fontFamily: DISPLAY_SEMIBOLD,
  },
});
