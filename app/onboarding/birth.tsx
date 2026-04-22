// app/onboarding/birth.tsx
// MySky — Onboarding Birth Data Wrapper
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged generic theme backgrounds in favor of the Absolute Midnight anchor.
// 2. Implemented atmospheric glow orbs to match the global Lunar Sky volume.
// 3. Cleaned up unused legacy styles.

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View, StyleSheet, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';

import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import BirthDataModal from '../../components/BirthDataModal';
import { BirthData } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { supabaseDb } from '../../services/storage/supabaseDb';
import { logger } from '../../utils/logger';
import { IdentityVault, CosmicIdentity } from '../../utils/IdentityVault';
import { type AppTheme } from '../../constants/theme';
import { useThemedStyles } from '../../context/ThemeContext';

/**
 * Ask for notification permissions with a rationale-first approach.
 * The iOS native prompt fires only once ever, so showing context before it
 * dramatically improves opt-in rate. Android 13+ also requires a permission.
 */
async function requestNotificationPermissions(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return;
    // Don't re-ask if already denied — system won't show the prompt anyway.
    if (existing === 'denied') return;

    await new Promise<void>((resolve) => {
      Alert.alert(
        'Stay in tune with your sky',
        'MySky can send you a morning note when a transit aligns with your chart — and alert you when your mood or sleep patterns are shifting.',
        [
          { text: 'Not now', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Allow notifications',
            onPress: async () => {
              try {
                await Notifications.requestPermissionsAsync();
              } catch {
                // Non-blocking — app works without notifications
              }
              resolve();
            },
          },
        ],
        { cancelable: true },
      );
    });
  } catch {
    // Non-blocking
  }
}

export default function OnboardingBirthScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const [visible, setVisible] = useState(true);
  const [savedName, setSavedName] = useState<string | undefined>(undefined);

  useEffect(() => {
    setVisible(true);
    EncryptedAsyncStorage.getItem('msky_user_name')
      .then((v) => { if (v) setSavedName(v); })
      .catch(() => {});
  }, []);

  const onSave = useCallback(async (birthData: BirthData, extra?: { chartName?: string }) => {
    try {
      const chart = AstrologyCalculator.generateNatalChart(birthData);

      const savedChart = {
        id: chart.id,
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
        updatedAt: chart.updatedAt,
        isDeleted: false,
      };

      await supabaseDb.saveChart(savedChart);

      // Seal the sensitive birth data in the hardware keychain / keystore.
      // This runs in parallel with navigation — failure is non-blocking since
      // the chart is already persisted in supabaseDb.
      const identity: CosmicIdentity = {
        name: extra?.chartName ?? 'My Chart',
        birthDate: birthData.date,
        birthTime: birthData.time,
        hasUnknownTime: birthData.hasUnknownTime,
        locationCity: birthData.place,
        locationLat: birthData.latitude,
        locationLng: birthData.longitude,
        timezone: birthData.timezone,
      };
      void IdentityVault.sealIdentity(identity).then((sealed) => {
        if (!sealed) {
          logger.error('[OnboardingBirth] IdentityVault seal failed');
        }
      });

      import('../../services/growth/localAnalytics')
        .then(({ trackGrowthEvent }) => trackGrowthEvent('onboarding_completed'))
        .catch((err) => logger.error('[OnboardingBirth] analytics failed:', err));

      DeviceEventEmitter.emit('ONBOARDING_COMPLETE');

      // Request notification permissions before navigating home.
      // Show a rationale alert first — the iOS system prompt only fires once,
      // so giving context dramatically improves opt-in rate.
      await requestNotificationPermissions();

      router.replace('/onboarding/chart-reveal' as Href);
    } catch (e) {
      logger.error('[OnboardingBirth] failed:', e);
      Alert.alert('Something went wrong', 'We could not save your birth details. Please try again.');
    }
  }, [router]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      
      {/* Nebula depth — atmospheric glow orbs to match global space theme */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* This screen exists only to host the modal as a step */}
        <BirthDataModal
          visible={visible}
          hideClose={true}
          title="Birth Details"
          initialData={savedName ? { chartName: savedName } : undefined}
          onClose={() => {
            // No-op: user must complete birth data to proceed
          }}
          onRestore={() => {
            router.push('/onboarding/restore' as Href);
          }}
          onSave={onSave}
        />
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background
  },
  safeArea: { 
    flex: 1 
  },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
});
