/**
 * PrivacySettingsModal
 * * High-end privacy controls using obsidian glass architecture.
 * Features jewel-tone action mapping and an illuminated rights ledger.
 */

import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import StarField from './ui/StarField';
import { secureStorage } from '../services/storage/secureStorage';
import { localDb } from '../services/storage/localDb';
import { logger } from '../utils/logger';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  textMain: '#FDFBF7',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

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
      await Share.share({ message: exportData, title: 'MySky Data Export' });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to secure your data for export.');
    } finally {
      setIsLoading(false);
    }
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
      await secureStorage.deleteAllUserData();
      await localDb.initialize();
      await localDb.hardDeleteAllData();
      Alert.alert('Reset Complete', 'Your personal data has been erased from this device.', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (error) {
      Alert.alert('Reset Failed', 'Process interrupted. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <StarField starCount={40} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Privacy & Data</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={15}>
              <Ionicons name="close" size={24} color={PALETTE.textMain} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
              
              {/* Privacy Status Grid */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>System Integrity</Text>
                <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassCard}>
                  {[
                    { label: 'Architecture', val: 'Local-First', icon: 'server-outline', color: PALETTE.silverBlue },
                    { label: 'Encryption', val: 'AES-256-GCM', icon: 'lock-closed-outline', color: PALETTE.silverBlue },
                    { label: 'Sharing', val: 'Never Sold', icon: 'ban-outline', color: PALETTE.gold },
                  ].map((item, i) => (
                    <View key={i} style={[styles.statusRow, i === 2 && { borderBottomWidth: 0 }]}>
                      <View style={styles.rowLead}>
                        <Ionicons name={item.icon as any} size={16} color={item.color} />
                        <Text style={styles.statusLabel}>{item.label}</Text>
                      </View>
                      <Text style={[styles.statusVal, { color: item.color }]}>{item.val}</Text>
                    </View>
                  ))}
                </LinearGradient>
              </View>

              {/* Data Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Your Archive</Text>
                {hasData ? (
                  <View style={styles.actionGrid}>
                    <Pressable style={styles.actionCard} onPress={handleExportData} disabled={isLoading}>
                      <LinearGradient colors={['rgba(139, 196, 232, 0.12)', 'rgba(255,255,255,0.02)']} style={styles.actionGradient}>
                        <Ionicons name="download-outline" size={22} color={PALETTE.silverBlue} />
                        <Text style={[styles.actionTitle, { color: PALETTE.silverBlue }]}>Export Archive</Text>
                        <Text style={styles.actionSub}>Create a readable backup of all entries.</Text>
                      </LinearGradient>
                    </Pressable>

                    <Pressable style={styles.actionCard} onPress={handleDeleteAllData} disabled={isLoading}>
                      <LinearGradient colors={['rgba(205, 127, 93, 0.12)', 'rgba(255,255,255,0.02)']} style={styles.actionGradient}>
                        <Ionicons name="trash-outline" size={22} color={PALETTE.copper} />
                        <Text style={[styles.actionTitle, { color: PALETTE.copper }]}>Hard Reset</Text>
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
                      <Ionicons name="checkmark-circle-outline" size={16} color={PALETTE.gold} />
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
  container: { flex: 1, backgroundColor: '#07090F' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  headerTitle: { fontSize: 20, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  closeBtn: { padding: 4 },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },
  content: { gap: 32 },

  section: { gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: PALETTE.gold, textTransform: 'uppercase', letterSpacing: 2, paddingLeft: 4 },
  
  glassCard: { borderRadius: 20, paddingHorizontal: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, borderTopColor: PALETTE.glassHighlight },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowLead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusLabel: { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },
  statusVal: { fontSize: 14, fontWeight: '700' },

  actionGrid: { gap: 12 },
  actionCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.glassBorder },
  actionGradient: { padding: 20, gap: 8 },
  actionTitle: { fontSize: 16, fontWeight: '700' },
  actionSub: { fontSize: 13, color: theme.textMuted, lineHeight: 18 },

  emptyCard: { padding: 40, alignItems: 'center', gap: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: PALETTE.glassBorder },
  emptyText: { color: theme.textMuted, fontSize: 14, fontStyle: 'italic' },

  rightsContainer: { gap: 12, paddingLeft: 4 },
  rightNode: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rightNodeText: { fontSize: 14, color: theme.textSecondary },

  complianceNote: { fontSize: 12, color: theme.textMuted, textAlign: 'center', fontStyle: 'italic', lineHeight: 18, paddingHorizontal: 20 },
});