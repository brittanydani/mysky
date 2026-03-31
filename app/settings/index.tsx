// File: app/settings/index.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Alert, ActivityIndicator, Linking, DeviceEventEmitter } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { MetallicText } from '../../components/ui/MetallicText';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { IdentityVault } from '../../utils/IdentityVault';
import { localDb } from '../../services/storage/localDb';
import { FieldEncryptionService } from '../../services/storage/fieldEncryption';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { BackupService } from '../../services/storage/backupService';
import { secureStorage } from '../../services/storage/secureStorage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import BackupPassphraseModal from '../../components/BackupPassphraseModal';
import { logger } from '../../utils/logger';
import { SUPPORT_EMAIL } from '../../constants/config';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';

/** Wraps a field value safely for CSV output. */
function csvEscape(value: string): string {
  const s = String(value ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

export default function SettingsHub() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { isPremium } = usePremium();
  const [isResetting, setIsResetting] = useState(false);

  // ── Dynamic header identity ─────────────────────────────────────────────────
  const [identityName, setIdentityName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const vault = await IdentityVault.openVault();
        if (vault?.name) { setIdentityName(vault.name); return; }
        const charts = await localDb.getCharts();
        if (charts.length > 0) setIdentityName(charts[0].name || '');
      } catch { /* non-fatal */ }
    })();
  }, []);

  const subscriptionLabel = isPremium ? 'Deeper Sky Active' : 'Free Plan';
  const headerSubtitle = identityName
    ? `${identityName} · ${subscriptionLabel}`
    : subscriptionLabel;

  // ── Backup & Sync ────────────────────────────────────────────────────────────
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);

  const handleBackup = async () => {
    if (!isPremium) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Deeper Sky Feature',
        'Encrypted backup & restore is available with a Deeper Sky subscription.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Learn more', onPress: () => router.push('/(tabs)/premium' as Href) },
        ]
      );
      return;
    }
    await Haptics.selectionAsync();
    setBackupModalVisible(true);
  };

  const performBackup = async (passphrase: string) => {
    setBackupModalVisible(false);
    try {
      setBackupInProgress(true);
      const { uri } = await BackupService.createEncryptedBackupFile(passphrase);

      // Share loop — allows saving to multiple locations
      let keepSharing = true;
      while (keepSharing) {
        await BackupService.shareBackupFile(uri, false);
        keepSharing = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Backup Saved',
            'Would you like to save a copy to another location?',
            [
              { text: 'Done', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Save Again', onPress: () => resolve(true) },
            ]
          );
        });
      }

      await BackupService.cleanupBackupFile(uri);
      const existing = await localDb.getSettings();
      const now = new Date().toISOString();
      if (existing) await localDb.saveSettings({ ...existing, lastBackupAt: now, updatedAt: now });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      logger.error('[Settings] Backup failed:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Backup Failed', error?.message ?? 'Unable to create backup. Please try again.');
    } finally {
      setBackupInProgress(false);
    }
  };

  // ── Export Data (CSV) ────────────────────────────────────────────────────────
  const handleExportCsv = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const [entries, charts] = await Promise.all([
        localDb.getJournalEntries(),
        localDb.getCharts(),
      ]);
      const chartId = charts[0]?.id ?? '';
      const checkIns = chartId ? await localDb.getCheckIns(chartId, 10000) : [];

      const journalRows = [
        'date,title,content,mood',
        ...entries.map(e => [
          e.date ?? '',
          csvEscape(e.title ?? ''),
          csvEscape(e.content ?? ''),
          e.mood ?? '',
        ].join(',')),
      ];

      const checkInRows = [
        'date,moodScore,energyLevel,stressLevel,note,wins,challenges,tags',
        ...checkIns.map(c => [
          c.date ?? '',
          String(c.moodScore ?? ''),
          String(c.energyLevel ?? ''),
          String(c.stressLevel ?? ''),
          csvEscape(c.note ?? ''),
          csvEscape(c.wins ?? ''),
          csvEscape(c.challenges ?? ''),
          csvEscape((c.tags ?? []).join(';')),
        ].join(',')),
      ];

      const csv = [
        '=== JOURNAL ENTRIES ===',
        ...journalRows,
        '',
        '=== CHECK-INS ===',
        ...checkInRows,
      ].join('\n');

      const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      if (!baseDir) throw new Error('No writable directory available');
      const filename = `mysky-export-${new Date().toISOString().slice(0, 10)}.csv`;
      const uri = `${baseDir}${filename}`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Export Saved', `Data saved locally as ${filename}.`);
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
      try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch { /* best-effort cleanup */ }
    } catch (error: any) {
      logger.error('[Settings] CSV export failed:', error);
      Alert.alert('Export Failed', error?.message ?? 'Unable to export data. Please try again.');
    }
  };

  // ── Contact Us ───────────────────────────────────────────────────────────────
  const handleContact = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=MySky%20Support`;
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert('Unable to Open Mail', `Please email ${SUPPORT_EMAIL} directly.`);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to Open Mail', `Please email ${SUPPORT_EMAIL} directly.`);
    }
  };

  const handleRoute = (route: string) => {
    Haptics.selectionAsync();
    router.push(route as any);
  };

  // ── Account ──────────────────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    await Haptics.selectionAsync();
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/onboarding' as any);
          },
        },
      ],
      { cancelable: true }
    );
  }, [signOut, router]);

  const executeDeleteAccount = useCallback(async () => {
    setIsResetting(true);
    try {
      // 1. Delete server-side account via RPC
      const { error: rpcError } = await supabase.rpc('delete_user_account');
      if (rpcError) throw rpcError;
      // 2. Wipe local data (same flow as hard reset)
      await IdentityVault.destroyIdentity();
      await FieldEncryptionService.destroyDek();
      await localDb.hardDeleteAllData();
      // 3. Clear consent records so terms/privacy are shown during re-onboarding
      await secureStorage.deleteAllUserData();
      await Promise.all([
        EncryptedAsyncStorage.removeItem('msky_user_name'),
        EncryptedAsyncStorage.removeItem('@mysky:archetype_profile'),
        EncryptedAsyncStorage.removeItem('@mysky:cognitive_style'),
        EncryptedAsyncStorage.removeItem('@mysky:somatic_entries'),
        EncryptedAsyncStorage.removeItem('@mysky:trigger_events'),
        EncryptedAsyncStorage.removeItem('@mysky:relationship_patterns'),
        EncryptedAsyncStorage.removeItem('@mysky:daily_reflections'),
        AsyncStorage.removeItem('@mysky:core_values'),
      ]);
      // 4. Sign out (session is already invalid after deletion)
      await signOut();
      logger.info('[Settings] Account deleted and all data destroyed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Reset gate state so consent modals appear immediately
      DeviceEventEmitter.emit('CONSENT_WITHDRAWN');
      router.replace('/onboarding' as any);
    } catch (err) {
      logger.error('[Settings] Account deletion failed:', err);
      setIsResetting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Deletion Failed', 'Something went wrong. Please try again or contact support.');
    }
  }, [signOut, router]);

  const handleDeleteAccount = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Account?',
      'This will permanently delete your account and all data from our servers. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: executeDeleteAccount },
      ],
      { cancelable: true }
    );
  }, [executeDeleteAccount]);

  const executeHardReset = useCallback(async () => {
    setIsResetting(true);
    try {
      // 1. Wipe the hardware vault (raw birth PII)
      await IdentityVault.destroyIdentity();
      // 2. Wipe the SQLite data encryption key — all existing encrypted rows
      //    are now permanently unreadable at the cryptographic layer
      await FieldEncryptionService.destroyDek();
      // 3. Delete all rows from the SQLite database
      await localDb.hardDeleteAllData();
      // 4. Clear consent records so terms/privacy are shown during re-onboarding
      await secureStorage.deleteAllUserData();
      // 5. Clear sensitive AsyncStorage keys (encrypted personal data)
      await Promise.all([
        EncryptedAsyncStorage.removeItem('msky_user_name'),
        EncryptedAsyncStorage.removeItem('@mysky:archetype_profile'),
        EncryptedAsyncStorage.removeItem('@mysky:cognitive_style'),
        EncryptedAsyncStorage.removeItem('@mysky:somatic_entries'),
        EncryptedAsyncStorage.removeItem('@mysky:trigger_events'),
        EncryptedAsyncStorage.removeItem('@mysky:relationship_patterns'),
        EncryptedAsyncStorage.removeItem('@mysky:daily_reflections'),
        // Core values uses plain AsyncStorage (not encrypted)
        AsyncStorage.removeItem('@mysky:core_values'),
      ]);
      // 6. Sign out of Supabase
      await signOut();

      logger.info('[Settings] Hard reset complete — all data destroyed');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Reset gate state so consent modals appear immediately
      DeviceEventEmitter.emit('CONSENT_WITHDRAWN');
      // Replace the entire navigation stack with onboarding
      router.replace('/onboarding' as any);
    } catch (err) {
      logger.error('[Settings] Hard reset failed:', err);
      setIsResetting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Reset Failed', 'Something went wrong. Please try again.');
    }
  }, [signOut, router]);

  const handleHardReset = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Erase All Data?',
      'This will permanently delete your identity vault, journal, chart, and mood history from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase Everything',
          style: 'destructive',
          onPress: executeHardReset,
        },
      ],
      { cancelable: true }
    );
  }, [executeHardReset]);

  return (
    <View style={styles.container}>
      {/* Subtle Background Atmosphere */}
      <LinearGradient
        colors={['rgba(217, 191, 140, 0.05)', 'transparent']}
        style={styles.ambientTop}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <GoldSubtitle style={styles.headerSubtitle}>{headerSubtitle}</GoldSubtitle>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Group 1: Preferences */}
        <SettingsGroup title="PREFERENCES">
          <SettingsRow
            icon="star-outline"
            title="Edit Birth Data"
            subtitle="Update time and location"
            onPress={() => handleRoute('/onboarding/birth')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="color-palette-outline"
            title="Color Calibration"
            subtitle="Map colors to your mood states"
            onPress={() => handleRoute('/settings/calibration')}
          />
        </SettingsGroup>

        {/* Group 2: Data & Privacy */}
        <SettingsGroup title="DATA & SECURITY">
          <SettingsRow
            icon="lock-closed-outline"
            title="Privacy & Security"
            subtitle="AES-256-GCM encryption details"
            onPress={() => handleRoute('/privacy')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="download-outline"
            title="Export Data"
            subtitle="Download a CSV of your journal & check-ins"
            onPress={handleExportCsv}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="cloud-outline"
            title="Backup & Sync"
            subtitle={backupInProgress ? 'Creating backup…' : 'Encrypted .msky vault backup'}
            onPress={handleBackup}
          />
        </SettingsGroup>

        {/* Group 3: Support */}
        <SettingsGroup title="SUPPORT">
          <SettingsRow
            icon="help-circle-outline"
            title="FAQ & Guides"
            subtitle="How to read your chart and patterns"
            onPress={() => handleRoute('/faq')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="mail-outline"
            title="Contact Us"
            subtitle="Reach the development team"
            onPress={handleContact}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="document-text-outline"
            title="Terms of Use (EULA)"
            onPress={() => handleRoute('/terms')}
          />
        </SettingsGroup>

        {/* Group 4: Account */}
        <SettingsGroup title="ACCOUNT">
          <SettingsRow
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleSignOut}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently remove your account and data"
            onPress={handleDeleteAccount}
            danger
          />
        </SettingsGroup>

        {/* Group 5: Danger Zone */}
        <View style={styles.dangerZone}>
          <Pressable
            style={({ pressed }) => [styles.dangerButton, pressed && { opacity: 0.7 }, isResetting && { opacity: 0.5 }]}
            onPress={handleHardReset}
            disabled={isResetting}
          >
            {isResetting ? (
              <ActivityIndicator color="#FF453A" />
            ) : (
              <Text style={styles.dangerButtonText}>Erase All Data & Reset</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.versionText}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        <View style={{ height: 60 }} />
      </ScrollView>

      <BackupPassphraseModal
        visible={backupModalVisible}
        mode="backup"
        onCancel={() => setBackupModalVisible(false)}
        onConfirm={performBackup}
      />
    </View>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────────

const SettingsGroup = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.groupContainer}>
    <Text style={styles.groupTitle}>{title}</Text>
    <View style={styles.groupCard}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      {children}
    </View>
  </View>
);

const SettingsRow = ({
  icon,
  title,
  subtitle,
  onPress,
  danger,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) => (
  <Pressable
    style={({ pressed }) => [styles.row, pressed && { backgroundColor: 'rgba(255,255,255,0.02)' }]}
    onPress={onPress}
  >
    <View style={styles.rowIconContainer}>
      {icon.includes('-') ? (
        <Ionicons name={icon as any} size={16} color="#D9BF8C" />
      ) : (
        <Text style={styles.rowIcon}>{icon}</Text>
      )}
    </View>
    <View style={styles.rowTextContainer}>
      {danger ? (
        <MetallicText color="#FF453A" style={styles.rowTitle}>{title}</MetallicText>
      ) : (
        <Text style={styles.rowTitle}>{title}</Text>
      )}
      {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
    </View>
    <Text style={styles.chevron}>›</Text>
  </Pressable>
);

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  ambientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },

  header: { paddingTop: 80, paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: {
    fontSize: 34,
    color: '#FFF',
    fontFamily: Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' }),
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },

  groupContainer: { marginBottom: 32 },
  groupTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 8,
  },
  groupCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },

  row: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  rowIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 191, 140, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rowIcon: { color: '#D9BF8C', fontSize: 16 },
  rowTextContainer: { flex: 1, justifyContent: 'center' },
  rowTitle: { fontSize: 16, color: '#FFF', fontWeight: '500', marginBottom: 2 },
  rowSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  chevron: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.2)',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginLeft: 16,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 72 },

  dangerZone: { marginTop: 16, marginBottom: 40, alignItems: 'center' },
  dangerButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    backgroundColor: 'rgba(217, 140, 140, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 140, 140, 0.3)',
  },
  dangerButtonText: { color: '#D98C8C', fontSize: 14, fontWeight: '600' },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 8,
    marginBottom: 16,
  },
});
