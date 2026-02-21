import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import StarField from './ui/StarField';
import { secureStorage } from '../services/storage/secureStorage';
import { localDb } from '../services/storage/localDb';
import { logger } from '../utils/logger';

interface PrivacySettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacySettingsModal({ visible, onClose }: PrivacySettingsModalProps) {
  const [hasData, setHasData] = useState(false);
  const [consentRecord, setConsentRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) loadPrivacyInfo();
  }, [visible]);

  const loadPrivacyInfo = async () => {
    try {
      // Check both SQLite (primary storage) and SecureStore for user data
      await localDb.initialize();
      const [secureData, dbCharts, dbEntries, consent] = await Promise.all([
        secureStorage.hasUserData(),
        localDb.getCharts(),
        localDb.getJournalEntries(),
        secureStorage.getConsentRecord(),
      ]);
      setHasData(!!secureData || dbCharts.length > 0 || dbEntries.length > 0);
      setConsentRecord(consent ?? null);
    } catch (error) {
      logger.error('Error loading privacy info:', error);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      Haptics.selectionAsync().catch(() => {});

      const userData = await secureStorage.exportAllUserData();
      const exportData = JSON.stringify(userData, null, 2);

      await Share.share({
        message: exportData,
        title: 'MySky Data Export',
      });
    } catch (error) {
      logger.error('Error exporting data:', error);
      Alert.alert('Export Failed', 'Unable to export your data. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your birth charts, journal entries, and settings. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All Data', style: 'destructive', onPress: confirmDeleteAllData },
      ]
    );
  };

  const confirmDeleteAllData = async () => {
    try {
      setIsLoading(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

      await secureStorage.deleteAllUserData();

      // Ensure DB is initialized before deleting (safe order)
      await localDb.initialize();
      await localDb.hardDeleteAllData();

      Alert.alert('Data Deleted', 'All your personal data has been permanently deleted from this device.', [
        {
          text: 'OK',
          onPress: () => {
            setHasData(false);
            setConsentRecord(null);
            onClose();
          },
        },
      ]);
    } catch (error) {
      logger.error('Error deleting data:', error);
      Alert.alert('Deletion Failed', 'Unable to delete your data. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${mm}/${dd}/${yyyy} ${hours}:${minutes} ${ampm}`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <StarField starCount={30} />

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>Privacy & Data</Text>
            <Pressable style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.content}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
                  <Text style={styles.sectionTitle}>Privacy Status</Text>
                </View>

                <View style={styles.statusCard}>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Data Storage</Text>
                    <Text style={styles.statusValue}>Local Device Only</Text>
                  </View>

                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Encryption</Text>
                    <Text style={styles.statusValue}>Device Keychain</Text>
                  </View>

                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Data Sharing</Text>
                    <Text style={styles.statusValue}>Never</Text>
                  </View>

                  {consentRecord?.timestamp && (
                    <View style={styles.statusItem}>
                      <Text style={styles.statusLabel}>Consent Given</Text>
                      <Text style={styles.statusValue}>{formatDate(consentRecord.timestamp)}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="folder-open" size={24} color={theme.primary} />
                  <Text style={styles.sectionTitle}>Your Data</Text>
                </View>

                {hasData ? (
                  <View style={styles.dataActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        styles.exportButton,
                        pressed && styles.buttonPressed,
                        isLoading && styles.buttonDisabled,
                      ]}
                      onPress={handleExportData}
                      disabled={isLoading}
                    >
                      <View style={styles.actionTopRow}>
                        <Ionicons name="download" size={20} color={theme.primary} />
                        <Text style={styles.exportButtonText}>Export My Data</Text>
                      </View>
                      <Text style={styles.actionDescription}>Download all your charts and journal entries</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.actionButton,
                        styles.deleteButton,
                        pressed && styles.buttonPressed,
                        isLoading && styles.buttonDisabled,
                      ]}
                      onPress={handleDeleteAllData}
                      disabled={isLoading}
                    >
                      <View style={styles.actionTopRow}>
                        <Ionicons name="trash" size={20} color="#FF6B6B" />
                        <Text style={styles.deleteButtonText}>Delete All Data</Text>
                      </View>
                      <Text style={styles.actionDescription}>Permanently remove all personal information</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.noDataCard}>
                    <Ionicons name="folder-open-outline" size={48} color={theme.textMuted} />
                    <Text style={styles.noDataText}>No personal data stored</Text>
                    <Text style={styles.noDataSubtext}>Create your first chart to start using MySky</Text>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text" size={24} color={theme.primary} />
                  <Text style={styles.sectionTitle}>Your Rights</Text>
                </View>

                <View style={styles.rightsCard}>
                  <View style={styles.rightItem}>
                    <Ionicons name="eye" size={16} color={theme.primary} />
                    <Text style={styles.rightText}>Access your data anytime</Text>
                  </View>
                  <View style={styles.rightItem}>
                    <Ionicons name="download" size={16} color={theme.primary} />
                    <Text style={styles.rightText}>Export in readable format</Text>
                  </View>
                  <View style={styles.rightItem}>
                    <Ionicons name="trash" size={16} color={theme.primary} />
                    <Text style={styles.rightText}>Delete all data permanently</Text>
                  </View>
                  <View style={styles.rightItem}>
                    <Ionicons name="ban" size={16} color={theme.primary} />
                    <Text style={styles.rightText}>No data selling or sharing</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.complianceText}>
                  MySky is designed with GDPR and CCPA data protection principles in mind. Your birth data stays on your device and is never sold or shared.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, fontFamily: 'serif' },
  closeButton: { padding: theme.spacing.sm },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.lg },
  content: { gap: theme.spacing.xl },
  section: { gap: theme.spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary },
  statusCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, gap: theme.spacing.md },
  statusItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontSize: 14, color: theme.textSecondary },
  statusValue: { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  dataActions: { gap: theme.spacing.md },
  actionButton: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, gap: 6 },
  actionTopRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  exportButton: { borderWidth: 1, borderColor: 'rgba(201, 169, 98, 0.3)' },
  deleteButton: { borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.3)' },
  buttonPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.5 },
  exportButtonText: { fontSize: 16, fontWeight: '600', color: theme.primary, flex: 1 },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#FF6B6B', flex: 1 },
  actionDescription: { fontSize: 12, color: theme.textMuted, lineHeight: 16 },
  noDataCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: theme.borderRadius.lg, padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.sm },
  noDataText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
  noDataSubtext: { fontSize: 14, color: theme.textMuted, textAlign: 'center' },
  rightsCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, gap: theme.spacing.sm },
  rightItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  rightText: { fontSize: 14, color: theme.textSecondary, flex: 1 },
  complianceText: { fontSize: 12, color: theme.textMuted, lineHeight: 18, textAlign: 'center', fontStyle: 'italic' },
});