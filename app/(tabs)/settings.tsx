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
import { usePremium } from '../../context/PremiumContext';
import PremiumModal from '../../components/PremiumModal';
import { localDb } from '../../services/storage/localDb';
import { BackupService } from '../../services/storage/backupService';
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
      'All your data stays on your device. Birth data, journal entries, and chart information are stored in a local database with sensitive fields encrypted using AES-256. Encryption keys are kept in your device\u2019s secure keychain. Nothing is uploaded to any server.',
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
      'Yes. Subscriptions are managed through your device\u2019s app store. On iOS, go to Settings > Apple ID > Subscriptions. On Android, go to Google Play > Subscriptions. You keep access through the end of your billing period.',
  },
  {
    question: 'How do I change my birth data?',
    answer:
      'Open your chart profile, then tap the edit icon next to your birth information. You can update your birth date, time, and location at any time. Your chart and all insights will recalculate automatically.',
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

const PRIVACY_POLICY = `Last updated: February 27, 2026

MySky ("the App") is committed to protecting your privacy. This policy explains how we handle your information.

DATA COLLECTION & STORAGE
- All personal data (birth information, journal entries, mood & energy check-ins, sleep entries, chart data) is stored locally on your device only.
- Sensitive fields are encrypted at rest using AES-256 with keys stored in your device's secure keychain/keystore.
- We do not collect, transmit, or store your personal data on any external server.
- We do not use analytics, tracking, or advertising SDKs.

BIRTH DATA
- Your birth date, time, and location are used solely to calculate your personalization framework on your device.
- This data never leaves your device unless you choose to create an encrypted backup or export a PDF.

JOURNAL ENTRIES, MOOD CHECK-INS & SLEEP TRACKING
- Journal content, mood & energy check-in data, and sleep entries are stored locally with sensitive fields encrypted at rest.
- On-device pattern analysis (mood trends, keyword frequency, emotion tone) is computed entirely on your device.
- None of this data is ever shared, uploaded, or analyzed externally.
- Premium encrypted backups use AES-256 encryption with a passphrase only you know.

PDF EXPORT
- PDF files are generated entirely on your device.
- The file is saved to your device's temporary cache and presented via the share sheet — you choose where it goes.
- MySky does not upload or retain the PDF.

BACKUP & RESTORE
- Encrypted backups are created locally and presented via the share sheet for you to save wherever you choose.
- Backup files are encrypted with AES-256 using a passphrase only you know.
- MySky never uploads your backup to any server.

SUBSCRIPTIONS
- Subscription purchases are handled by Apple (App Store) or Google (Google Play).
- We receive anonymized transaction confirmations but no personal billing information.

THIRD-PARTY SERVICES
- RevenueCat: Used for subscription management. Receives only anonymized app user IDs, not personal data.
- No other third-party services receive your data.
- Your data is never used for AI training, advertising, or marketing.

YOUR RIGHTS
- Access: View all your stored data at any time.
- Export: Export your data as a PDF or encrypted backup via Settings.
- Delete: Permanently delete all your data at any time via Privacy Settings.
- Portability: Take your data with you via encrypted backup.
- No account required: MySky works without creating any account.

CHILDREN'S PRIVACY
- MySky is not directed at children under 13. We do not knowingly collect data from children.

CONTACT
- For privacy questions: brittanyapps@outlook.com

CHANGES
- We will update this policy as needed. Continued use of the App constitutes acceptance of any changes.`;

const TERMS_OF_SERVICE = `Last updated: February 27, 2026

By using MySky ("the App"), you agree to these Terms of Service.

1. ACCEPTANCE
By downloading or using MySky, you agree to be bound by these terms. If you do not agree, do not use the App.

2. DESCRIPTION OF SERVICE
MySky is a personal growth and wellness app that provides:
- Daily mood, energy & stress check-ins with pattern analysis
- Sleep logging (quality & duration; dream journal requires Deeper Sky)
- Journaling with guided prompts and behavioral insights
- Natal chart used as a personalization framework
- Daily personalized guidance and reflection prompts
- Chakra energy mapping tied to your chart
- Relationship compatibility analysis
- Personal story generation
- PDF chart export (premium)
- Encrypted backup and restore (premium)
All content is generated and stored locally on your device.

3. ASTROLOGICAL CONTENT
- MySky provides personalized interpretations for self-reflection and personal growth purposes only.
- Interpretive content is not a substitute for professional medical, psychological, financial, or legal advice.
- Planetary calculations are based on established astronomical data (Swiss Ephemeris) but interpretations are generalized.

4. SUBSCRIPTIONS
- Free features include: daily mood & energy check-ins, sleep logging (quality & duration), journal with guided prompts, basic weekly averages, natal chart & Big Three, basic daily guidance, one relationship chart, and privacy controls. Dream journal, sleep & mood trend analysis, and behavioral pattern charts require Deeper Sky.
- "Deeper Sky" premium features require a subscription managed through Apple (App Store) or Google (Google Play).
- Prices are displayed in the App before purchase.
- Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
- Manage or cancel subscriptions in your device Settings > Apple ID > Subscriptions (iOS) or Google Play > Subscriptions (Android).

5. USER DATA
- All data is stored locally on your device with sensitive fields encrypted at rest.
- You are responsible for your device security and any backup files you create.
- We are not responsible for data loss due to device failure, deletion, or other causes outside our control.
- See our Privacy Policy for details on data handling.

6. INTELLECTUAL PROPERTY
- All content, design, and code in MySky are owned by the developer.
- You retain ownership of your personal data, journal entries, and check-ins.
- You may not copy, modify, distribute, or reverse-engineer the App.

7. DISCLAIMER OF WARRANTIES
- MySky is provided "as is" without warranties of any kind.
- We do not guarantee uninterrupted or error-free operation.

8. LIMITATION OF LIABILITY
- To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the App.

9. GOVERNING LAW
- These terms are governed by the laws of the United States. Any disputes will be resolved in accordance with applicable federal and state laws.

10. CHANGES TO TERMS
- We may update these terms at any time. Continued use constitutes acceptance.

11. CONTACT
- For questions about these terms: brittanyapps@outlook.com`;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();

  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restoreUri, setRestoreUri] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [expandedLegal, setExpandedLegal] = useState<string | null>(null);
  const [showFaq, setShowFaq] = useState(false);
  const [encryptionKeyLost, setEncryptionKeyLost] = useState(false);

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
      'Encrypted backup & restore keeps your data safe. Available with Deeper Sky.',
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
                  <Ionicons name="warning" size={22} color={theme.error} />
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
                    <Ionicons name="trash" size={16} color={theme.error} />
                    <Text style={[styles.keyLossBannerButtonText, { color: theme.error }]}>Delete All Data</Text>
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

          <Animated.View entering={FadeInDown.delay(375).duration(600)} style={styles.section}>
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
                <Ionicons name="phone-portrait" size={16} color={theme.success} />
                <Text style={styles.privacyText}>Data stored locally on your device</Text>
              </View>
              <View style={styles.privacyItem}>
                <Ionicons name="shield" size={16} color={theme.success} />
                <Text style={styles.privacyText}>Protected by your device passcode / biometrics</Text>
              </View>
              <View style={styles.privacyItem}>
                <Ionicons name="ban" size={16} color={theme.success} />
                <Text style={styles.privacyText}>Never sold or shared</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(425).duration(600)} style={styles.section}>
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

          <Animated.View entering={FadeInDown.delay(475).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                style={styles.glossaryGradient}
              >
                <Pressable
                  onPress={async () => {
                    try {
                      await Haptics.selectionAsync();
                    } catch {}
                    setExpandedLegal(expandedLegal === 'privacy' ? null : 'privacy');
                  }}
                  style={[styles.glossaryRow, styles.glossaryRowBorder]}
                  accessibilityRole="button"
                  accessibilityLabel="Privacy Policy"
                >
                  <View style={styles.glossaryHeader}>
                    <View style={styles.legalHeader}>
                      <Ionicons name="document-text-outline" size={16} color={theme.primary} />
                      <Text style={styles.glossaryTerm}>Privacy Policy</Text>
                    </View>
                    <Ionicons
                      name={expandedLegal === 'privacy' ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={theme.textMuted}
                    />
                  </View>
                  {expandedLegal === 'privacy' && <Text style={styles.legalText}>{PRIVACY_POLICY}</Text>}
                </Pressable>

                <Pressable
                  onPress={async () => {
                    try {
                      await Haptics.selectionAsync();
                    } catch {}
                    setExpandedLegal(expandedLegal === 'terms' ? null : 'terms');
                  }}
                  style={styles.glossaryRow}
                  accessibilityRole="button"
                  accessibilityLabel="Terms of Service"
                >
                  <View style={styles.glossaryHeader}>
                    <View style={styles.legalHeader}>
                      <Ionicons name="reader-outline" size={16} color={theme.primary} />
                      <Text style={styles.glossaryTerm}>Terms of Service</Text>
                    </View>
                    <Ionicons
                      name={expandedLegal === 'terms' ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={theme.textMuted}
                    />
                  </View>
                  {expandedLegal === 'terms' && <Text style={styles.legalText}>{TERMS_OF_SERVICE}</Text>}
                </Pressable>
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(525).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>

            <Pressable style={styles.settingCard} onPress={openSupportEmail} accessibilityRole="link" accessibilityLabel="Contact us via email">
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

            {/* Version text moved below premium card only */}
          </Animated.View>


          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(575).duration(600)} style={styles.section}>
              <Pressable style={styles.settingCard} onPress={() => setShowPremiumModal(true)} accessibilityRole="button" accessibilityLabel="Learn about premium features">
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
                        Full personal story, healing insights, unlimited relationships, pattern analysis, encrypted backup, and personalized guidance — from $4.99/mo.
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color={theme.primary} />
                  </View>
                </LinearGradient>
              </Pressable>
              <Text style={styles.versionText}>MySky v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
            </Animated.View>
          )}

      <PremiumModal visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
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

  legalHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 },
  legalText: { fontSize: 12, color: theme.textSecondary, lineHeight: 18, marginTop: theme.spacing.sm, fontFamily: 'monospace' },

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
    color: theme.error,
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
