/**
 * PrivacySettingsModal
 * * High-end privacy controls using obsidian glass architecture.
 * Features jewel-tone action mapping and an illuminated rights ledger.
 */

import React, { useEffect, useState } from 'react';
import { Alert, DeviceEventEmitter, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MetallicIcon } from './ui/MetallicIcon';

import { theme } from '../constants/theme';
import { PrivacyComplianceManager } from '../services/privacy/privacyComplianceManager';
import { logger } from '../utils/logger';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import { localDb } from '../services/storage/localDb';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

interface PrivacySettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacySettingsModal({ visible, onClose }: PrivacySettingsModalProps) {
  const [hasData, setHasData] = useState(false);
  const [consentRecord, setConsentRecord] = useState<{
    granted: boolean;
    expired?: boolean;
    policyVersion?: string;
    timestamp?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const compliance = new PrivacyComplianceManager();

  useEffect(() => {
    if (visible) loadPrivacyInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const loadPrivacyInfo = async () => {
    try {
      await localDb.initialize();
      const [dbCharts, dbEntries, consentStatus] = await Promise.all([
        localDb.getCharts(),
        localDb.getJournalEntries(),
        compliance.getConsentStatus(),
      ]);
      setHasData(dbCharts.length > 0 || dbEntries.length > 0);
      setConsentRecord(consentStatus);
    } catch (error) {
      logger.error('Error loading privacy info:', error);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      Haptics.selectionAsync().catch(() => {});
      // Export from both SQLite (where real data lives) and SecureStore
      const result = await compliance.handleExportRequest();
      if (!result.success || !result.package) {
        Alert.alert('Export Failed', 'Unable to gather your data for export.');
        return;
      }
      const exportData = JSON.stringify(result.package, null, 2);
      await Share.share({ message: exportData, title: 'MySky Data Export' });
    } catch {
      Alert.alert('Export Failed', 'Unable to secure your data for export.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawConsent = () => {
    Alert.alert(
      'Withdraw Consent',
      'This will revoke your data processing consent. You can still use the app, but new data will not be saved until you consent again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await compliance.withdrawConsent();
              await loadPrivacyInfo();
              // Close modal and force the root layout to re-gate the session
              onClose();
              DeviceEventEmitter.emit('CONSENT_WITHDRAWN');
            } catch {
              Alert.alert('Error', 'Could not withdraw consent. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Permanent Deletion',
      'This will erase all birth data, journal entries, and personal insights. This cosmic reset cannot be reversed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Everything', style: 'destructive', onPress: confirmDeleteAllData },
      ]
    );
  };

  const confirmDeleteAllData = async () => {
    try {
      setIsLoading(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      await compliance.handleDeletionRequest();
      Alert.alert('Reset Complete', 'Your personal data has been erased from this device.', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch {
      Alert.alert('Reset Failed', 'Process interrupted. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Privacy & Data</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={15}>
              <Ionicons name="close-outline" size={24} color={PALETTE.textMain} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
              
              {/* Privacy Status Grid */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>System Integrity</Text>
                <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.glassCard}>
                  {[
                    { label: 'Architecture', val: 'Local-First', icon: 'server-outline', color: "#FFFFFF" },
                    { label: 'Encryption', val: 'AES-256-GCM', icon: 'lock-closed-outline', color: "#FFFFFF" },
                    { label: 'Sharing', val: 'Never Sold', icon: 'ban-outline', color: "#FFFFFF" },
                  ].map((item, i) => (
                    <View key={i} style={[styles.statusRow, i === 2 && { borderBottomWidth: 0 }]}>
                      <View style={styles.rowLead}>
                        <Ionicons name={item.icon as any} size={16} color={item.color} />
                        <Text style={styles.statusLabel}>{item.label}</Text>
                      </View>
                      <Text style={[styles.statusVal, { color: "#FFFFFF" }]}>{item.val}</Text>
                    </View>
                  ))}
                </LinearGradient>
              </View>

              {/* Consent Status */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Consent Record</Text>
                <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.glassCard}>
                  <View style={[styles.statusRow, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }]}>
                    <View style={styles.rowLead}>
                      <MetallicIcon name="checkmark-circle-outline" size={16} color={consentRecord?.granted ? PALETTE.gold : PALETTE.copper} />
                      <Text style={styles.statusLabel}>Status</Text>
                    </View>
                    <Text style={[styles.statusVal, { color: "#FFFFFF" }]}>
                      {consentRecord?.granted ? (consentRecord.expired ? 'Expired' : 'Active') : 'Not granted'}
                    </Text>
                  </View>
                  {consentRecord?.timestamp && (
                    <View style={[styles.statusRow, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }]}>
                      <View style={styles.rowLead}>
                        <MetallicIcon name="time-outline" size={16} color={PALETTE.silverBlue} />
                        <Text style={styles.statusLabel}>Consented</Text>
                      </View>
                      <Text style={[styles.statusVal, { color: "#FFFFFF" }]}>
                        {new Date(consentRecord.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.statusRow, { borderBottomWidth: 0 }]}>
                    <View style={styles.rowLead}>
                      <MetallicIcon name="document-outline" size={16} color={PALETTE.silverBlue} />
                      <Text style={styles.statusLabel}>Policy Version</Text>
                    </View>
                    <Text style={[styles.statusVal, { color: "#FFFFFF" }]}>
                      {consentRecord?.policyVersion ?? '—'}
                    </Text>
                  </View>
                </LinearGradient>
                {consentRecord?.granted && (
                  <Pressable style={styles.actionCard} onPress={handleWithdrawConsent} disabled={isLoading}>
                    <LinearGradient colors={['rgba(205, 127, 93, 0.08)', 'rgba(255,255,255,0.02)']} style={styles.actionGradient}>
                      <MetallicIcon name="close-circle-outline" size={22} color={PALETTE.copper} />
                      <Text style={[styles.actionTitle, { color: "#FFFFFF" }]}>Withdraw Consent</Text>
                      <Text style={styles.actionSub}>Revoke data processing consent. Existing data is preserved.</Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>

              {/* Data Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Your Archive</Text>
                {hasData ? (
                  <View style={styles.actionGrid}>
                    <Pressable style={styles.actionCard} onPress={handleExportData} disabled={isLoading}>
                      <LinearGradient colors={['rgba(201, 174, 120, 0.12)', 'rgba(255,255,255,0.02)']} style={styles.actionGradient}>
                        <MetallicIcon name="download-outline" size={22} color={PALETTE.silverBlue} />
                        <Text style={[styles.actionTitle, { color: "#FFFFFF" }]}>Export Archive</Text>
                        <Text style={styles.actionSub}>Create a readable backup of all entries.</Text>
                      </LinearGradient>
                    </Pressable>

                    <Pressable style={styles.actionCard} onPress={handleDeleteAllData} disabled={isLoading}>
                      <LinearGradient colors={['rgba(205, 127, 93, 0.12)', 'rgba(255,255,255,0.02)']} style={styles.actionGradient}>
                        <MetallicIcon name="trash-outline" size={22} color={PALETTE.copper} />
                        <Text style={[styles.actionTitle, { color: "#FFFFFF" }]}>Hard Reset</Text>
                        <Text style={styles.actionSub}>Permanently erase all data from this device.</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons name="cloud-offline-outline" size={32} color={theme.textMuted} />
                    <Text style={styles.emptyText}>No personal records found</Text>
                  </View>
                )}
              </View>

              {/* Rights Ledger */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Inalienable Rights</Text>
                <View style={styles.rightsContainer}>
                  {[
                    'Right to access your complete data',
                    'Right to full data portability',
                    'Right to be forgotten (total deletion)',
                    'Right to private computation only',
                  ].map((right, i) => (
                    <View key={i} style={styles.rightNode}>
                      <MetallicIcon name="checkmark-circle-outline" size={16} color={PALETTE.gold} />
                      <Text style={styles.rightNodeText}>{right}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Text style={styles.complianceNote}>
                MySky is built on privacy by design. We adhere to the core principles of GDPR and CCPA to ensure you remain the sole owner of your narrative.
              </Text>

            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerTitle: { fontSize: 34, color: "#FFFFFF", fontWeight: '800', letterSpacing: -0.5 },
  closeBtn: { padding: 4 },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  content: { gap: 32 },

  section: { gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: "#FFFFFF", textTransform: 'uppercase', letterSpacing: 2, paddingLeft: 4 },
  
  glassCard: { borderRadius: 24, paddingHorizontal: 24, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'rgba(255,255,255,0.02)' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowLead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusLabel: { fontSize: 14, color: "#FFFFFF", fontWeight: '500' },
  statusVal: { fontSize: 14, fontWeight: '700' },

  actionGrid: { gap: 12 },
  actionCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.glassBorder },
  actionGradient: { padding: 28, gap: 8 },
  actionTitle: { fontSize: 16, fontWeight: '700' },
  actionSub: { fontSize: 13, color: "#FFFFFF", lineHeight: 18 },

  emptyCard: { padding: 40, alignItems: 'center', gap: 12, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: PALETTE.glassBorder },
  emptyText: { color: "#FFFFFF", fontSize: 14,  },

  rightsContainer: { gap: 12, paddingLeft: 4 },
  rightNode: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rightNodeText: { fontSize: 14, color: "#FFFFFF" },

  complianceNote: { fontSize: 12, color: "#FFFFFF", textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
});