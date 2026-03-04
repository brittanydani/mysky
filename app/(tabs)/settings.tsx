// app/(tabs)/settings.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import BackupPassphraseModal from '../../components/BackupPassphraseModal';
import PrivacySettingsModal from '../../components/PrivacySettingsModal';
import BirthDataModal from '../../components/BirthDataModal';
import { usePremium } from '../../context/PremiumContext';
import PremiumModal from '../../components/PremiumModal';
import { localDb } from '../../services/storage/localDb';
import { BackupService } from '../../services/storage/backupService';
import { BirthData } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import Constants from 'expo-constants';
import { FieldEncryptionService } from '../../services/storage/fieldEncryption';
import { logger } from '../../utils/logger';

const FAQ: { question: string; answer: string }[] = [
  {
    question: 'How accurate is my chart?',
    answer:
      'MySky uses the Swiss Ephemeris (via circular-natal-horoscope-js) for planetary calculations. Your chart is astronomically accurate to within fractions of a degree. For the most precise house cusps and rising sign, enter your exact birth time.',
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
      'When you create a backup, an encrypted .msky file is saved to your device\u2019s cache, then your device\u2019s share sheet opens so you choose the destination \u2014 Files, iCloud Drive, AirDrop, email, or any other app. MySky never uploads your backup to any server.',
  },
  {
    question: 'What does the PDF export include?',
    answer:
      'PDF export is a Deeper Sky (premium) feature. Tap "Export PDF" on the Your Themes screen to generate and share a PDF that includes a cover page with your birth data, your Big Three (Sun, Moon, Rising), a full planet placements table, house cusps (if birth time is known), all aspects grouped by type, and all 10 Personal Story chapters.',
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
      'Open the Sleep tab to log your nightly sleep. Rate quality (1\u20135 moons) and log duration \u2014 both are free. The encrypted dream journal and symbolic dream reflections are Deeper Sky (premium) features. When you log a dream, MySky generates a personalized reflection drawn from your sleep, mood, check-in, and journal data \u2014 entirely on your device, with no AI or network calls. You can log one entry per night and edit it any time that day. Free users see basic weekly averages; Deeper Sky members get full trend analysis over time.',
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
      'Yes. Monthly and yearly subscriptions are managed through your device\u2019s app store. On iOS, go to Settings > Apple ID > Subscriptions. On Android, go to Google Play > Subscriptions. You keep access through the end of your billing period. Lifetime purchases do not renew and do not have a cancellation setting (refunds follow the app store\u2019s policy).',
  },
  {
    question: 'How do I change my birth data?',
    answer:
      'Birth data cannot be changed after saving. A confirmation step lets you review everything before it\u2019s locked in. If you need to start fresh, you can delete all your data in Settings under Privacy Settings and set up your chart again.',
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
      'When you log a dream as a Deeper Sky member, MySky scans your dream text for recurring symbols (water, falling, doors, etc.) and maps them to Jungian archetypes. It then weaves in context from your mood check-ins, sleep patterns, and journal entries to shape the reflection. The result is a personalized reflection generated entirely on your device with no AI, no network calls, and no data leaving your phone.',
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();

  const successColor = (theme as any).success ?? theme.primary;
  const errorColor = (theme as any).error ?? '#E07A7A';

  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restoreUri, setRestoreUri] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showFaq, setShowFaq] = useState(false);
  const [encryptionKeyLost, setEncryptionKeyLost] = useState(false);

  // Dev-only: edit birth data for screenshots
  const [showDevBirthModal, setShowDevBirthModal] = useState(false);
  const [devBirthInitial, setDevBirthInitial] = useState<Partial<BirthData> & { chartName?: string } | undefined>(undefined);
  const [devChartId, setDevChartId] = useState<string | null>(null);

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

      // Detect encryption key loss — if the DEK is gone, warn the user
      const keyOk = await FieldEncryptionService.isKeyAvailable();
      setEncryptionKeyLost(!keyOk);
    } catch (error) {
      logger.error('Failed to load settings:', error);
    }
  }, [ensureSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
    const url = 'mailto:brittanyapps@outlook.com?subject=MySky%20Support';
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert('Unable to Open Mail', 'Please email brittanyapps@outlook.com.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to Open Mail', 'Please email brittanyapps@outlook.com.');
    }
  };

  const handleDevEditBirthData = useCallback(async () => {
    try {
      const charts = await localDb.getCharts();
      if (charts.length === 0) {
        Alert.alert('No Chart', 'No chart found to edit.');
        return;
      }
      const chart = charts[0];
      setDevChartId(chart.id);
      setDevBirthInitial({
        chartName: chart.name,
        date: chart.birthDate,
        time: chart.birthTime,
        hasUnknownTime: chart.hasUnknownTime,
        place: chart.birthPlace,
        latitude: chart.latitude,
        longitude: chart.longitude,
        timezone: chart.timezone,
        houseSystem: chart.houseSystem as any,
      });
      setShowDevBirthModal(true);
    } catch (error) {
      logger.error('Failed to load chart for dev edit:', error);
      Alert.alert('Error', 'Could not load chart data.');
    }
  }, []);

  const handleDevBirthSave = useCallback(async (birthData: BirthData, extra?: { chartName?: string }) => {
    setShowDevBirthModal(false);
    try {
      const chart = AstrologyCalculator.generateNatalChart(birthData);
      const now = new Date().toISOString();
      await localDb.saveChart({
        id: devChartId || chart.id,
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
      Alert.alert('Birth Data Updated', 'Restart the app or navigate away and back to see changes everywhere.');
    } catch (error) {
      logger.error('Dev birth data save failed:', error);
      Alert.alert('Error', 'Failed to update birth data.');
    }
  }, [devChartId]);

  const openPrivacyPolicy = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
    router.navigate('/privacy' as Href);
  };

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

  return (
    <View style={styles.container}>
      <StarField starCount={25} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your MySky experience</Text>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, theme.spacing.lg) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {encryptionKeyLost && (
            <Animated.View entering={FadeInDown.duration(500)} style={styles.keyLossBanner}>
              <LinearGradient
                colors={['rgba(224, 122, 122, 0.15)', 'rgba(224, 122, 122, 0.05)']}
                style={styles.keyLossBannerGradient}
              >
                <View style={styles.keyLossBannerHeader}>
                  <Ionicons name="warning" size={22} color={errorColor} />
                  <Text style={[styles.keyLossBannerTitle, { color: errorColor }]}>Encryption Key Unavailable</Text>
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
                    <Ionicons name="cloud-download" size={16} color={theme.primary} />
                    <Text style={styles.keyLossBannerButtonText}>Restore Backup</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.keyLossBannerButton, styles.keyLossBannerButtonDestructive]}
                    onPress={() => setShowPrivacyModal(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete all data"
                  >
                    <Ionicons name="trash" size={16} color={errorColor} />
                    <Text style={[styles.keyLossBannerButtonText, { color: errorColor }]}>Delete All Data</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Encrypted Backup</Text>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                style={styles.cardGradient}
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="cloud-upload" size={20} color={theme.primary} />
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
                    <Ionicons name="cloud-upload" size={16} color={theme.primary} />
                    <Text style={styles.syncButtonText}>{backupInProgress ? 'Preparing...' : 'Backup Now'}</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.syncButton, disableActions && styles.syncButtonDisabled]}
                    onPress={handleRestore}
                    disabled={disableActions}
                    accessibilityRole="button"
                    accessibilityLabel="Restore backup"
                  >
                    <Ionicons name="cloud-download" size={16} color={theme.primary} />
                    <Text style={styles.syncButtonText}>{restoreInProgress ? 'Restoring...' : 'Restore Backup'}</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Security & Data Protection</Text>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                style={styles.cardGradient}
              >
                <View style={styles.securityGrid}>
                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <Ionicons name="lock-closed" size={16} color={successColor} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>Local Encryption</Text>
                      <Text style={styles.securityDetail}>AES-256-GCM with a per-device key stored in your hardware keychain</Text>
                    </View>
                  </View>

                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <Ionicons name="airplane" size={16} color={successColor} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>No Content Transmitted</Text>
                      <Text style={styles.securityDetail}>Journal entries, dreams, and check-ins never leave your device. Birth-city text is sent to Nominatim for geocoding.</Text>
                    </View>
                  </View>

                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <Ionicons name="analytics" size={16} color={successColor} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>Zero Third-Party Analytics</Text>
                      <Text style={styles.securityDetail}>No tracking SDKs, no advertising IDs, no third-party profiling</Text>
                    </View>
                  </View>

                  <View style={styles.securityRow}>
                    <View style={styles.securityBullet}>
                      <Ionicons name="document-text" size={16} color={successColor} />
                    </View>
                    <View style={styles.securityContent}>
                      <Text style={styles.securityLabel}>Minimal Event Logging</Text>
                      <Text style={styles.securityDetail}>Only the 20 most recent security events are kept — no sensitive content is ever logged</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Data</Text>

            <Pressable style={styles.settingCard} onPress={() => setShowPrivacyModal(true)} accessibilityRole="button" accessibilityLabel="Privacy settings">
              <LinearGradient
                colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                style={styles.cardGradient}
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
                      <Text style={styles.settingTitle}>Privacy Settings</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      Export, delete, or manage your data on this device
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </View>
              </LinearGradient>
            </Pressable>

            <View style={styles.privacyInfo}>
              <View style={styles.privacyItem}>
                <Ionicons name="phone-portrait" size={16} color={successColor} />
                <Text style={styles.privacyText}>Data stored locally on your device</Text>
              </View>
              <View style={styles.privacyItem}>
                <Ionicons name="shield" size={16} color={successColor} />
                <Text style={styles.privacyText}>Protected by your device passcode / biometrics</Text>
              </View>
              <View style={styles.privacyItem}>
                <Ionicons name="ban" size={16} color={successColor} />
                <Text style={styles.privacyText}>Never sold or shared</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(475).duration(600)} style={styles.section}>
            <Pressable
              style={styles.sectionTitleRow}
              onPress={async () => {
                try { await Haptics.selectionAsync(); } catch {}
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
                <LinearGradient
                  colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                  style={styles.glossaryGradient}
                >
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
            <Text style={styles.sectionTitle}>Legal</Text>

            <Pressable
              style={styles.settingCard}
              onPress={openPrivacyPolicy}
              accessibilityRole="button"
              accessibilityLabel="Privacy Policy"
            >
              <LinearGradient
                colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                style={styles.cardGradient}
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                      <Text style={styles.settingTitle}>Privacy Policy</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      How MySky handles your data and protects your privacy
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.settingCard}
              onPress={openTerms}
              accessibilityRole="button"
              accessibilityLabel="Terms of Service"
            >
              <LinearGradient
                colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                style={styles.cardGradient}
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="reader-outline" size={20} color={theme.primary} />
                      <Text style={styles.settingTitle}>Terms of Service</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      App terms, subscription details, and disclaimers
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.settingCard}
              onPress={openFaq}
              accessibilityRole="button"
              accessibilityLabel="FAQ"
            >
              <LinearGradient
                colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                style={styles.cardGradient}
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="help-circle-outline" size={20} color={theme.primary} />
                      <Text style={styles.settingTitle}>FAQ</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      Answers to common questions about privacy, backups, and premium
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </View>
              </LinearGradient>
            </Pressable>

            <Text style={styles.versionText}>
              MySky v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(625).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>

            <Pressable
              style={styles.settingCard}
              onPress={openSupportEmail}
              accessibilityRole="link"
              accessibilityLabel="Contact us via email"
            >
              <LinearGradient
                colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                style={styles.cardGradient}
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="mail-outline" size={20} color={theme.primary} />
                      <Text style={styles.settingTitle}>Contact Us</Text>
                    </View>
                    <Text style={styles.settingDescription}>brittanyapps@outlook.com</Text>
                  </View>
                  <Ionicons name="open-outline" size={18} color={theme.textMuted} />
                </View>
              </LinearGradient>
            </Pressable>
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
                  colors={['rgba(201, 169, 98, 0.12)', 'rgba(201, 169, 98, 0.04)']}
                  style={[styles.cardGradient, { borderWidth: 1, borderColor: 'rgba(201, 169, 98, 0.2)' }]}
                >
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <Ionicons name="sparkles" size={20} color={theme.primary} />
                        <Text style={styles.settingTitle}>Deeper Sky</Text>
                      </View>
                      <Text style={styles.settingDescription}>
                        Full personal story, healing insights, unlimited relationships, pattern analysis, encrypted backup, and personalized guidance — $4.99/mo • $29.99/yr • $49.99 lifetime.
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color={theme.primary} />
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
                  try { await Haptics.selectionAsync(); } catch {}
                  try {
                    await Linking.openURL('https://apps.apple.com/account/subscriptions');
                  } catch {
                    Alert.alert('Unable to Open', 'Go to Settings → Apple ID → Subscriptions to manage your plan.');
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Manage your subscription"
              >
                <LinearGradient
                  colors={['rgba(201, 169, 98, 0.12)', 'rgba(201, 169, 98, 0.04)']}
                  style={[styles.cardGradient, { borderWidth: 1, borderColor: 'rgba(201, 169, 98, 0.2)' }]}
                >
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <Ionicons name="sparkles" size={20} color={theme.primary} />
                        <Text style={styles.settingTitle}>Deeper Sky Active</Text>
                      </View>
                      <Text style={styles.settingDescription}>
                        Manage, upgrade, or cancel your subscription
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={18} color={theme.primary} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          <PremiumModal visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} />

          {__DEV__ && (
            <Animated.View entering={FadeInDown.delay(775).duration(600)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: 'rgba(224, 122, 152, 0.8)' }]}>Developer Tools</Text>

              <Pressable
                style={styles.settingCard}
                onPress={handleDevEditBirthData}
                accessibilityRole="button"
                accessibilityLabel="Edit birth data (dev only)"
              >
                <LinearGradient
                  colors={['rgba(224, 122, 152, 0.12)', 'rgba(224, 122, 152, 0.04)']}
                  style={[styles.cardGradient, { borderWidth: 1, borderColor: 'rgba(224, 122, 152, 0.2)' }]}
                >
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingHeader}>
                        <Ionicons name="create-outline" size={20} color="rgba(224, 122, 152, 0.8)" />
                        <Text style={styles.settingTitle}>Edit Birth Data</Text>
                        <View style={[styles.premiumBadge, { backgroundColor: 'rgba(224, 122, 152, 0.2)' }]}>
                          <Text style={[styles.premiumText, { color: 'rgba(224, 122, 152, 0.8)' }]}>DEV</Text>
                        </View>
                      </View>
                      <Text style={styles.settingDescription}>
                        Temporarily change birth data for screenshots. This overwrites your chart.
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>

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

      {__DEV__ && (
        <BirthDataModal
          visible={showDevBirthModal}
          onClose={() => setShowDevBirthModal(false)}
          onSave={handleDevBirthSave}
          initialData={devBirthInitial}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },

  header: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },
  subtitle: { fontSize: 14, color: theme.primary, fontStyle: 'italic', marginTop: 2 },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg },

  section: { marginBottom: theme.spacing.xl },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },

  settingCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: theme.spacing.md,
  },
  cardGradient: { padding: theme.spacing.lg },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingInfo: { flex: 1, marginRight: theme.spacing.md },
  settingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs },
  settingTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginLeft: theme.spacing.sm, flex: 1 },

  premiumBadge: {
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  premiumText: { fontSize: 10, color: theme.primary, fontWeight: '600' },

  settingDescription: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  lastSyncText: { fontSize: 12, color: theme.textMuted, marginTop: theme.spacing.xs },

  backupActions: { gap: theme.spacing.sm },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    borderRadius: theme.borderRadius.sm,
  },
  syncButtonDisabled: { opacity: 0.6 },
  syncButtonText: { fontSize: 14, color: theme.primary, fontWeight: '600', marginLeft: theme.spacing.xs },

  premiumCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  premiumContent: { flexDirection: 'row', alignItems: 'center' },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  premiumInfo: { flex: 1 },
  premiumTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 },
  premiumDescription: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },

  privacyInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  privacyItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  privacyText: { fontSize: 12, color: theme.textSecondary, flex: 1 },

  securityGrid: { gap: theme.spacing.md },
  securityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  securityBullet: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(72, 187, 120, 0.12)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  securityContent: { flex: 1 },
  securityLabel: { fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 },
  securityDetail: { fontSize: 12, color: theme.textSecondary, lineHeight: 17 },

  chartSettingsSummary: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  settingTag: {
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  settingTagText: { fontSize: 11, color: theme.primary, fontWeight: '500' },

  glossaryGradient: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
  glossaryRow: { paddingVertical: theme.spacing.md },
  glossaryRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
  glossaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  glossaryTerm: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif', flex: 1 },
  glossaryDefinition: { fontSize: 14, color: theme.textSecondary, lineHeight: 20, marginTop: theme.spacing.xs },

  versionText: { fontSize: 12, color: theme.textMuted, textAlign: 'center', marginTop: theme.spacing.sm, fontStyle: 'italic' },

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
    fontFamily: 'serif',
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
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
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
