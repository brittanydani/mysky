// File: app/onboarding/birth.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { EncryptedAsyncStorage } from '../../services/storage/encryptedAsyncStorage';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import BirthDataModal from '../../components/BirthDataModal';
import { BirthData } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { localDb } from '../../services/storage/localDb';
import { logger } from '../../utils/logger';
import { IdentityVault, CosmicIdentity } from '../../utils/IdentityVault';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  textMain: '#F0EAD6',
};

export default function OnboardingBirthScreen() {
  const router = useRouter();
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

      await localDb.saveChart(savedChart);

      // Seal the sensitive birth data in the hardware keychain / keystore.
      // This runs in parallel with navigation — failure is non-blocking since
      // the chart is already persisted in localDb.
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
      IdentityVault.sealIdentity(identity).catch((err) =>
        logger.error('[OnboardingBirth] IdentityVault seal failed:', err)
      );

      router.replace('/(tabs)/home' as Href);
    } catch (e) {
      logger.error('[OnboardingBirth] failed:', e);
    }
  }, [router]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* This screen exists only to host the modal as a step */}
        <BirthDataModal
          visible={visible}
          hideClose={true}
          title="Birth Details"          initialData={savedName ? { chartName: savedName } : undefined}          onClose={() => {
            // Don’t allow skipping this step if user chose onboarding
            router.replace('/onboarding' as Href);
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

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#020817' 
  },
  safeArea: { 
    flex: 1 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerText: { 
    color: PALETTE.textMain, 
    fontSize: 22, 
    fontWeight: '700', 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    letterSpacing: 0.5,
  },
});
