import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
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
import AstrologySettingsModal from '../../components/AstrologySettingsModal';
import { usePremium } from '../../context/PremiumContext';
import { localDb } from '../../services/storage/localDb';
import { BackupService } from '../../services/storage/backupService';
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { logger } from '../../utils/logger';

const GLOSSARY: { term: string; definition: string }[] = [
  { term: 'Natal Chart', definition: 'A map of where all the planets were at the exact moment you were born. Think of it as your cosmic fingerprint.' },
  { term: 'Sun Sign', definition: 'The zodiac sign the Sun was in when you were born. It represents your core identity and ego.' },
  { term: 'Moon Sign', definition: 'The zodiac sign the Moon was in at your birth. It governs your emotions, instincts, and inner world.' },
  { term: 'Rising Sign (Ascendant)', definition: 'The zodiac sign rising on the eastern horizon at your birth. It shapes how others perceive you and your outward style.' },
  { term: 'Houses', definition: 'The 12 sections of your chart, each representing a different area of life — like relationships, career, or home.' },
  { term: 'Transit', definition: 'The current position of a planet in the sky and how it interacts with your natal chart. Transits trigger events and moods.' },
  { term: 'Aspect', definition: 'An angle between two planets in your chart. Aspects show how different parts of your personality interact — harmoniously or with tension.' },
  { term: 'Retrograde', definition: 'When a planet appears to move backward in the sky. It often signals a time to slow down and revisit themes related to that planet.' },
  { term: 'Stellium', definition: 'Three or more planets clustered in the same sign or house. It creates an intense focus of energy in that area of your life.' },
  { term: 'Chiron', definition: 'Known as the "wounded healer." Its placement shows where you carry deep wounds — and where you have the greatest power to heal others.' },
  { term: 'Nodes (North & South)', definition: 'The North Node points to your soul\'s growth direction. The South Node shows past-life patterns and comfort zones to move beyond.' },
  { term: 'Conjunction', definition: 'When two planets sit very close together (within a few degrees). Their energies merge and amplify each other.' },
  { term: 'Opposition', definition: 'When two planets are directly across the chart from each other (180°). It creates tension that pushes you toward balance.' },
  { term: 'Trine', definition: 'A flowing, harmonious angle (120°) between two planets. Trines represent natural talents and ease.' },
  { term: 'Square', definition: 'A challenging 90° angle between two planets. Squares create friction that drives growth and action.' },
  { term: 'Cardinal Signs', definition: 'Aries, Cancer, Libra, Capricorn. Cardinal energy initiates — these signs start new seasons and are natural leaders and self-starters.' },
  { term: 'Fixed Signs', definition: 'Taurus, Leo, Scorpio, Aquarius. Fixed energy sustains — these signs are deeply determined, persistent, and resistant to change.' },
  { term: 'Mutable Signs', definition: 'Gemini, Virgo, Sagittarius, Pisces. Mutable energy adapts — these signs are flexible, versatile, and comfortable with change.' },
  { term: 'Fire Element', definition: 'Aries, Leo, Sagittarius. Fire signs are passionate, energetic, and action-oriented. They lead with enthusiasm and courage.' },
  { term: 'Earth Element', definition: 'Taurus, Virgo, Capricorn. Earth signs are grounded, practical, and reliable. They build things that last.' },
  { term: 'Air Element', definition: 'Gemini, Libra, Aquarius. Air signs are intellectual, communicative, and social. They process the world through ideas and connection.' },
  { term: 'Water Element', definition: 'Cancer, Scorpio, Pisces. Water signs are intuitive, emotional, and deeply feeling. They navigate life through empathy and instinct.' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();

  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restoreUri, setRestoreUri] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAstrologyModal, setShowAstrologyModal] = useState(false);
  const [houseSystemLabel, setHouseSystemLabel] = useState<string>('Placidus');
  const [orbPresetLabel, setOrbPresetLabel] = useState<string>('Normal');

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
      
      // Load astrology settings
      const astroSettings = await AstrologySettingsService.getSettings();
      setHouseSystemLabel(AstrologySettingsService.getHouseSystemLabel(astroSettings.houseSystem));
      setOrbPresetLabel(AstrologySettingsService.getOrbPresetLabel(astroSettings.orbPreset));
    } catch (error) {
      logger.error('Failed to load settings:', error);
    }
  }, [ensureSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const gatePremium = async (): Promise<boolean> => {
    if (isPremium) return true;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
      await localDb.saveSettings({
        ...settings,
        lastBackupAt: now,
        updatedAt: now,
      });

      setLastBackupAt(now);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Backup Ready', 'Your encrypted backup is ready to save or share.');
    } catch (error: any) {
      logger.error('Backup failed:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Restore Complete', 'Your data has been restored on this device.');
      setRestoreUri(null);
      await loadSettings();
    } catch (error: any) {
      logger.error('Restore failed:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  const disableActions =
    backupInProgress ||
    restoreInProgress ||
    backupModalVisible ||
    restoreModalVisible;

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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 0 }]}
          showsVerticalScrollIndicator={false}
        >
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
                      <Text style={styles.lastSyncText}>
                        Last backup: {formatLastBackup(lastBackupAt)}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.backupActions}>
                  <Pressable
                    style={[styles.syncButton, disableActions && styles.syncButtonDisabled]}
                    onPress={handleBackup}
                    disabled={disableActions}
                  >
                    <Ionicons name="cloud-upload" size={16} color={theme.primary} />
                    <Text style={styles.syncButtonText}>
                      {backupInProgress ? 'Preparing...' : 'Backup Now'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.syncButton, disableActions && styles.syncButtonDisabled]}
                    onPress={handleRestore}
                    disabled={disableActions}
                  >
                    <Ionicons name="cloud-download" size={16} color={theme.primary} />
                    <Text style={styles.syncButtonText}>
                      {restoreInProgress ? 'Restoring...' : 'Restore Backup'}
                    </Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Chart Calculations</Text>

            <Pressable style={styles.settingCard} onPress={() => setShowAstrologyModal(true)}>
              <LinearGradient
                colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                style={styles.cardGradient}
              >
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Ionicons name="planet" size={20} color={theme.primary} />
                      <Text style={styles.settingTitle}>Chart Settings</Text>
                    </View>
                    <Text style={styles.settingDescription}>
                      House system, aspect orbs, and calculation preferences
                    </Text>
                    <View style={styles.chartSettingsSummary}>
                      <View style={styles.settingTag}>
                        <Text style={styles.settingTagText}>{houseSystemLabel}</Text>
                      </View>
                      <View style={styles.settingTag}>
                        <Text style={styles.settingTagText}>{orbPresetLabel} Orbs</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Astrology Glossary</Text>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']}
                style={styles.glossaryGradient}
              >
                {GLOSSARY.map((item, index) => (
                  <Pressable
                    key={item.term}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setExpandedTerm(expandedTerm === item.term ? null : item.term);
                    }}
                    style={[
                      styles.glossaryRow,
                      index < GLOSSARY.length - 1 && styles.glossaryRowBorder,
                    ]}
                  >
                    <View style={styles.glossaryHeader}>
                      <Text style={styles.glossaryTerm}>{item.term}</Text>
                      <Ionicons
                        name={expandedTerm === item.term ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={theme.textMuted}
                      />
                    </View>
                    {expandedTerm === item.term && (
                      <Text style={styles.glossaryDefinition}>{item.definition}</Text>
                    )}
                  </Pressable>
                ))}
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Data</Text>

            <Pressable style={styles.settingCard} onPress={() => setShowPrivacyModal(true)}>
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

          {!isPremium && (
            <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.section}>
              <Pressable style={styles.premiumCard} onPress={() => router.push('/(tabs)/premium' as Href)}>
                <LinearGradient
                  colors={['rgba(201, 169, 98, 0.2)', 'rgba(201, 169, 98, 0.1)']}
                  style={styles.cardGradient}
                >
                  <View style={styles.premiumContent}>
                    <View style={styles.premiumIcon}>
                      <Ionicons name="star" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.premiumInfo}>
                      <Text style={styles.premiumTitle}>Go deeper with your patterns</Text>
                      <Text style={styles.premiumDescription}>
                        Encrypted backup, full stellium depth, Chiron & Node mapping, and more
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.primary} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>

        <PrivacySettingsModal visible={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

        <AstrologySettingsModal
          visible={showAstrologyModal}
          onClose={() => setShowAstrologyModal(false)}
          onSettingsChanged={(updated) => {
            setHouseSystemLabel(AstrologySettingsService.getHouseSystemLabel(updated.houseSystem));
            setOrbPresetLabel(AstrologySettingsService.getOrbPresetLabel(updated.orbPreset));
          }}
        />

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
      </SafeAreaView>
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
  premiumCard: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201, 169, 98, 0.3)' },
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
  privacyInfo: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, gap: theme.spacing.sm },
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
});