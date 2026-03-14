// File: app/onboarding/restore.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaMetallicPill from '../../components/ui/SkiaMetallicPill';
import { BackupService } from '../../services/storage/backupService';
import { localDb } from '../../services/storage/localDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { logger } from '../../utils/logger';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

export default function OnboardingRestoreScreen() {
  const router = useRouter();
  const [backupUri, setBackupUri] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = useCallback(async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      const uri = await BackupService.pickBackupFile();
      if (!uri) return;
      setBackupUri(uri);
    } catch (e) {
      logger.error('[Restore] pickBackupFile failed:', e);
    }
  }, []);

  const restore = useCallback(async () => {
    if (!backupUri) {
      Alert.alert('No file selected', 'Please choose a backup file first.');
      return;
    }
    if (!passphrase || passphrase.trim().length < 8) {
      Alert.alert('Invalid Passphrase', 'Passphrase must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      await BackupService.restoreFromBackupFile(backupUri, passphrase);

      const charts = await localDb.getCharts();
      if (!charts.length) {
        Alert.alert('No Charts Found', 'The backup did not contain any chart data.');
        setBusy(false);
        return;
      }

      const birthData = {
        date: charts[0].birthDate,
        time: charts[0].birthTime,
        hasUnknownTime: charts[0].hasUnknownTime,
        place: charts[0].birthPlace,
        latitude: charts[0].latitude,
        longitude: charts[0].longitude,
        houseSystem: charts[0].houseSystem,
        timezone: charts[0].timezone,
      };

      AstrologyCalculator.generateNatalChart(birthData); // sanity compute
      router.replace('/(tabs)/home' as Href);
    } catch (e) {
      logger.error('[Restore] restore failed:', e);
      Alert.alert('Restore Failed', 'Could not restore from backup. Please check your passphrase and try again.');
    } finally {
      setBusy(false);
    }
  }, [backupUri, passphrase, router]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          
          {/* Header */}
          <View style={styles.headerBar}>
            <Pressable 
              style={styles.backButton} 
              onPress={() => router.replace('/onboarding/consent?mode=restore' as Href)}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color={PALETTE.textMain} />
            </Pressable>
            <Text style={styles.headerTitle}>Restore Backup</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.content}>
            <LinearGradient 
              colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} 
              style={styles.glassCard}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="cloud-download" size={32} color={PALETTE.gold} style={{ marginBottom: 12 }} />
                <Text style={styles.cardTitle}>Recover Your Data</Text>
                <Text style={styles.cardSubtitle}>
                  Select your encrypted .msky backup file and enter the passphrase used to secure it.
                </Text>
              </View>

              <Pressable 
                style={[styles.pickBtn, backupUri && styles.pickBtnSuccess]} 
                onPress={pick} 
                accessibilityRole="button"
              >
                <Ionicons 
                  name={backupUri ? "checkmark-circle" : "folder-open-outline"} 
                  size={20} 
                  color={backupUri ? '#6EBF8B' : PALETTE.gold} 
                />
                <Text style={[styles.pickText, backupUri && { color: '#6EBF8B' }]}>
                  {backupUri ? 'Backup file selected' : 'Choose backup file'}
                </Text>
              </Pressable>

              <TextInput
                style={styles.input}
                value={passphrase}
                onChangeText={setPassphrase}
                placeholder="Enter 8+ character passphrase"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />

              <SkiaMetallicPill
                label={busy ? 'Restoring...' : 'Restore Data'}
                onPress={restore}
                disabled={!backupUri || busy}
                icon={!busy ? <Ionicons name="arrow-forward" size={18} color="#020817" /> : undefined}
              />

              <Text style={styles.note}>
                Your backup is decrypted entirely on your device.
              </Text>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: PALETTE.textMain, 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) 
  },
  
  content: { paddingHorizontal: 20, paddingTop: 32 },
  
  glassCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
    padding: 24,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    color: PALETTE.textMain,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  pickBtn: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,214,174,0.25)',
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  pickBtnSuccess: {
    borderColor: 'rgba(110, 191, 139, 0.4)',
    backgroundColor: 'rgba(110, 191, 139, 0.1)',
  },
  pickText: { color: PALETTE.gold, fontWeight: '600', fontSize: 15 },
  
  input: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: PALETTE.textMain,
    textAlign: 'center',
    marginBottom: 24,
  },
  
  ctaButton: { 
    borderRadius: 16, 
    overflow: 'hidden', 
 
 
 
 
  },
  ctaGradient: { 
    paddingVertical: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(232, 214, 174, 0.4)',
    borderRadius: 16,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#020817' },
  
  note: { 
    marginTop: 20, 
    textAlign: 'center', 
    color: theme.textMuted, 
    fontSize: 12, 
    fontStyle: 'italic' 
  },
});
