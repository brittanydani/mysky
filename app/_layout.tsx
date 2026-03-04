// File: app/_layout.tsx

import React, { Component, type ReactNode, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import OnboardingModal from '../components/OnboardingModal';
import TermsConsentModal from '../components/TermsConsentModal';
import PrivacyConsentModal from '../components/PrivacyConsentModal';

import { PremiumProvider } from '../context/PremiumContext';
import { AuthProvider } from '../context/AuthContext';

import { MigrationService } from '../services/storage/migrationService';
import { PrivacyComplianceManager } from '../services/privacy/privacyComplianceManager';
import { AstrologySettingsService } from '../services/astrology/astrologySettingsService';
import { logger } from '../utils/logger';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logger.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorBody}>Please close and reopen the app.</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => this.setState({ hasError: false })}>
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, backgroundColor: '#0D1421', alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '600', marginBottom: 12 },
  errorBody: { color: '#8899AA', fontSize: 15, textAlign: 'center', marginBottom: 32 },
  errorButton: { backgroundColor: '#1E3A5F', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  errorButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
});

async function getTermsConsent(): Promise<boolean> {
  try {
    const SecureStore = await import('expo-secure-store');
    const value = await SecureStore.getItemAsync('terms_consent');
    return value === 'true';
  } catch {
    return false;
  }
}

async function setTermsConsent(granted: boolean) {
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync('terms_consent', granted ? 'true' : 'false');
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [needsPrivacyConsent, setNeedsPrivacyConsent] = useState(false);
  const [needsTermsConsent, setNeedsTermsConsent] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const privacyManager = new PrivacyComplianceManager();
        const consentStatus = await privacyManager.requestConsent();
        setNeedsPrivacyConsent(consentStatus.required);

        const termsAccepted = await getTermsConsent();
        setNeedsTermsConsent(!termsAccepted);

        if (!consentStatus.required) {
          await MigrationService.performMigrationIfNeeded();
          await AstrologySettingsService.getSettings();
        }

        setDbReady(true);
      } catch (error) {
        logger.error('Failed to initialize app:', error);
        setDbReady(true);
      } finally {
        setCheckingConsent(false);
      }
    };

    initializeApp();
  }, []);

  const handlePrivacyConsent = async (granted: boolean) => {
    try {
      const privacyManager = new PrivacyComplianceManager();

      if (granted) {
        await privacyManager.recordConsent({
          granted: true,
          policyVersion: await privacyManager.getPolicyVersion(),
          timestamp: new Date().toISOString(),
          method: 'explicit',
          lawfulBasis: 'consent',
          purpose: 'astrology_personalization',
        });

        await MigrationService.performMigrationIfNeeded();
        await AstrologySettingsService.getSettings();

        setNeedsPrivacyConsent(false);
      } else {
        await privacyManager.withdrawConsent();
        logger.info('User declined privacy consent');
        setNeedsPrivacyConsent(true);
      }
    } catch (error) {
      logger.error('Privacy consent handling failed:', error);
      if (granted) setNeedsPrivacyConsent(false);
    }
  };

  const handleTermsConsent = async (granted: boolean) => {
    try {
      await setTermsConsent(granted);
      setNeedsTermsConsent(!granted);
    } catch (error) {
      logger.error('Terms consent handling failed:', error);
      setNeedsTermsConsent(!granted);
    }
  };

  if (checkingConsent || !dbReady) {
    return null; // you can swap in a loading screen later
  }

  const showPrivacyModal = needsPrivacyConsent;
  const showTermsModal = !showPrivacyModal && needsTermsConsent;
  const showOnboarding = !showPrivacyModal && !showTermsModal && !onboardingComplete;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PremiumProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <StatusBar style="light" />

              {/* ✅ Router is ALWAYS mounted so /terms /privacy /faq can stay open */}
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#0D1421' },
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="privacy" />
                <Stack.Screen name="terms" />
                <Stack.Screen name="faq" />
              </Stack>

              {/* ✅ Overlays (do NOT early return) */}
              <PrivacyConsentModal
                visible={showPrivacyModal}
                onConsent={handlePrivacyConsent}
                contactEmail="brittanyapps@outlook.com"
              />

              <TermsConsentModal
                visible={showTermsModal}
                onConsent={handleTermsConsent}
              />

              <OnboardingModal
                visible={showOnboarding}
                onComplete={() => setOnboardingComplete(true)}
              />
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </PremiumProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
