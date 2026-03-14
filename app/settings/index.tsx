// File: app/settings/index.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Alert, ActivityIndicator, Linking } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { IdentityVault } from '../../utils/IdentityVault';
import { localDb } from '../../services/storage/localDb';
import { FieldEncryptionService } from '../../services/storage/fieldEncryption';
import { BackupService } from '../../services/storage/backupService';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import BackupPassphraseModal from '../../components/BackupPassphraseModal';
import { logger } from '../../utils/logger';
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
      await BackupService.shareBackupFile(uri);
      const existing = await localDb.getSettings();
      const now = new Date().toISOString();
      if (existing) await localDb.saveSettings({ ...existing, lastBackupAt: now, updatedAt: now });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Backup Ready', 'Your encrypted backup is ready to save or share.');
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
    const url = 'mailto:support@mysky.app?subject=MySky%20Support';
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert('Unable to Open Mail', 'Please email support@mysky.app directly.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to Open Mail', 'Please email support@mysky.app directly.');
    }
  };

  const handleRoute = (route: string) => {
    Haptics.selectionAsync();
    router.push(route as any);
  };

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
      // 4. Sign out of Supabase
      await signOut();

      logger.info('[Settings] Hard reset complete — all data destroyed');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            icon="⚝"
            title="Edit Birth Data"
            subtitle="Update time and location"
            onPress={() => handleRoute('/onboarding/birth')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="✺"
            title="Color Calibration"
            subtitle="Map colors to your mood states"
            onPress={() => handleRoute('/settings/calibration')}
          />
        </SettingsGroup>

        {/* Group 2: Data & Privacy */}
        <SettingsGroup title="DATA & SECURITY">
          <SettingsRow
            icon="🔒"
            title="Privacy & Security"
            subtitle="AES-256-GCM encryption details"
            onPress={() => handleRoute('/privacy')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="⎘"
            title="Export Data"
            subtitle="Download a CSV of your journal & check-ins"
            onPress={handleExportCsv}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="☁"
            title="Backup & Sync"
            subtitle={backupInProgress ? 'Creating backup…' : 'Encrypted .msky vault backup'}
            onPress={handleBackup}
          />
        </SettingsGroup>

        {/* Group 3: Support */}
        <SettingsGroup title="SUPPORT">
          <SettingsRow
            icon="?"
            title="FAQ & Guides"
            subtitle="How to read your chart and patterns"
            onPress={() => handleRoute('/faq')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="✉"
            title="Contact Us"
            subtitle="Reach the development team"
            onPress={handleContact}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="§"
            title="Terms of Service"
            onPress={() => handleRoute('/terms')}
          />
        </SettingsGroup>

        {/* Group 4: Danger Zone */}
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

        <View style={{ height: 100 }} />
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
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) => (
  <Pressable
    style={({ pressed }) => [styles.row, pressed && { backgroundColor: 'rgba(255,255,255,0.02)' }]}
    onPress={onPress}
  >
    <View style={styles.rowIconContainer}>
      <Text style={styles.rowIcon}>{icon}</Text>
    </View>
    <View style={styles.rowTextContainer}>
      <Text style={styles.rowTitle}>{title}</Text>
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
    fontFamily: 'Georgia',
    fontWeight: '300',
    marginBottom: 8,
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
});
