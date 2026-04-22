// File: app/onboarding/restore.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, Keyboard, TouchableWithoutFeedback, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, Href } from 'expo-router';

import { type AppTheme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaMetallicPill from '../../components/ui/SkiaMetallicPill';
import { BackupService } from '../../services/storage/backupService';
import { supabaseDb } from '../../services/storage/supabaseDb';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { IdentityVault } from '../../utils/IdentityVault';
import { logger } from '../../utils/logger';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

export default function OnboardingRestoreScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
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

      const charts = await supabaseDb.getCharts();
      if (!charts.length) {
        Alert.alert('No Charts Found', 'The backup did not contain any chart data.');
        setBusy(false);
        return;
      }

      const astroSettings = await AstrologySettingsService.getSettings();
      const birthData = {
        date: charts[0].birthDate,
        time: charts[0].birthTime,
        hasUnknownTime: charts[0].hasUnknownTime,
        place: charts[0].birthPlace,
        latitude: charts[0].latitude,
        longitude: charts[0].longitude,
        houseSystem: astroSettings.houseSystem ?? charts[0].houseSystem,
        zodiacSystem: astroSettings.zodiacSystem,
        orbPreset: astroSettings.orbPreset,
        timezone: charts[0].timezone,
      };

      AstrologyCalculator.generateNatalChart(birthData); // sanity compute

      // Seal the restored identity into the hardware keychain
      IdentityVault.sealIdentity({
        name: charts[0].name ?? 'My Chart',
        birthDate: charts[0].birthDate,
        birthTime: charts[0].birthTime,
        hasUnknownTime: charts[0].hasUnknownTime,
        locationCity: charts[0].birthPlace,
        locationLat: charts[0].latitude,
        locationLng: charts[0].longitude,
        timezone: charts[0].timezone,
      }).then((sealed) => {
        if (!sealed) {
          logger.error('[Restore] IdentityVault seal failed');
        }
      });

      DeviceEventEmitter.emit('ONBOARDING_COMPLETE');
      router.replace('/onboarding/chart-reveal' as Href);
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

        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
          <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
        </View>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          
          {/* Header */}
          <View style={styles.headerBar}>
            <Pressable 
              style={styles.backButton} 
              onPress={() => (router.canGoBack() ? router.back() : undefined)}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back-outline" size={24} color={theme.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Restore Backup</Text>
            <View style={styles.backButton} />
          </View>

          <View style={styles.content}>
            <LinearGradient 
              colors={[theme.cardGradientStart, theme.cardGradientEnd]} 
              style={styles.glassCard}
            >
              <View style={styles.cardHeader}>
                <MetallicIcon name="cloud-download-outline" size={32} color={theme.textGold} style={{ marginBottom: 12 }} />
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
                <MetallicIcon 
                  name={backupUri ? "checkmark-circle" : "folder-open-outline"} 
                  size={20} 
                  color={backupUri ? '#6EBF8B' : theme.textGold} 
                />
                <MetallicText style={backupUri ? [styles.pickText, { fontWeight: '700' as const }] : styles.pickText} color={backupUri ? '#6EBF8B' : theme.textGold}>
                  {backupUri ? 'Backup file selected' : 'Choose backup file'}
                </MetallicText>
              </Pressable>

              <TextInput
                style={styles.input}
                value={passphrase}
                onChangeText={setPassphrase}
                placeholder="Enter passphrase"
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
                icon={!busy ? <Ionicons name="arrow-forward-outline" size={18} color={theme.textInk} /> : undefined}
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingHorizontal: 24, paddingBottom: 8 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -1,
  },
  
  content: { paddingHorizontal: 24, paddingTop: 20 },
  
  glassCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface,
    padding: 28,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    color: theme.textPrimary,
    fontWeight: '700',
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
  pickText: { color: theme.textGold, fontWeight: '600', fontSize: 15 },
  
  input: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: theme.textPrimary,
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
  ctaText: { fontSize: 16, fontWeight: '700', color: theme.textInk },
  
  note: { 
    marginTop: 20, 
    textAlign: 'center', 
    color: theme.textMuted, 
    fontSize: 12, 
     
  },
});
