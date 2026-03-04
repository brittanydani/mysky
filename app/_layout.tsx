// File: app/_layout.tsx

import React, { Component, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import OnboardingModal from '../components/OnboardingModal';
import PrivacyConsentModal from '../components/PrivacyConsentModal';
import CosmicBackground from '../components/ui/CosmicBackground';

import { PremiumProvider } from '../context/PremiumContext';
import { AuthProvider } from '../context/AuthContext';
import { StarNotificationProvider } from '../context/StarNotificationContext';

import { MigrationService } from '../services/storage/migrationService';
import { PrivacyComplianceManager } from '../services/privacy/privacyComplianceManager';
import { AstrologySettingsService } from '../services/astrology/astrologySettingsService';
import { localDb } from '../services/storage/localDb';
import { logger } from '../utils/logger';

// ── Cinematic Error Boundary ──
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
          <Ionicons name="warning-outline" size={56} color="#D4AF37" style={{ marginBottom: 20 }} />
          <Text style={styles.errorTitle}>The stars misaligned</Text>
          <Text style={styles.errorBody}>Something unexpected happened. Please close the app and reopen it, or try reloading below.</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => this.setState({ hasError: false })}>
            <LinearGradient 
              colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']} 
              style={styles.errorButtonGradient}
            >
              <Ionicons name="refresh" size={16} color="#D4AF37" style={{ marginRight: 8 }} />
              <Text style={styles.errorButtonText}>Reload Experience</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

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
  const pathname = usePathname();
  const router = useRouter();

  const [checkingConsent, setCheckingConsent] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  const [needsPrivacyConsent, setNeedsPrivacyConsent] = useState(false);
  const [needsTermsConsent, setNeedsTermsConsent] = useState(false);

  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Prevent double-running the heavy init in edge cases
  const didRunPostConsentInitRef = useRef(false);

  const isOnLegalScreen = useMemo(() => {
    return pathname === '/terms' || pathname === '/privacy' || pathname === '/faq';
  }, [pathname]);

  const runPostPrivacyConsentInit = async (termsAccepted: boolean) => {
    if (didRunPostConsentInitRef.current) return;
    didRunPostConsentInitRef.current = true;

    try {
      // DB migration + settings should only happen once consent is granted
      await MigrationService.performMigrationIfNeeded();
      await AstrologySettingsService.getSettings();

      // If they already accepted terms previously, see if onboarding can be skipped
      if (termsAccepted) {
        try {
          await localDb.initialize();
          const charts = await localDb.getCharts();
          if (charts.length > 0) {
            setOnboardingComplete(true);
          }
        } catch (e) {
          logger.error('Failed to check existing charts:', e);
        }
      }
    } catch (error) {
      logger.error('Post-consent initialization failed:', error);
    } finally {
      setDbReady(true);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const privacyManager = new PrivacyComplianceManager();
        const consentStatus = await privacyManager.requestConsent();
        setNeedsPrivacyConsent(consentStatus.required);

        const termsAccepted = await getTermsConsent();
        setNeedsTermsConsent(!termsAccepted);

        // Only initialize DB / settings after privacy consent is granted
        if (!consentStatus.required) {
          await runPostPrivacyConsentInit(termsAccepted);
        } else {
          // We still consider the "app ready" enough to render UI (Stack + consent modal),
          // but we intentionally do NOT run migrations/settings until consent is granted.
          setDbReady(true);
        }
      } catch (error) {
        logger.error('Failed to initialize app:', error);
        setDbReady(true);
      } finally {
        setCheckingConsent(false);
      }
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrivacyConsent = async (granted: boolean) => {
    try {
      if (!granted) {
        // Keep gate up; do not initialize anything
        setNeedsPrivacyConsent(true);
        return;
      }

      setNeedsPrivacyConsent(false);

      // Now that consent is granted, complete the deferred initialization
      const termsAccepted = await getTermsConsent();
      setNeedsTermsConsent(!termsAccepted);
      await runPostPrivacyConsentInit(termsAccepted);
    } catch (error) {
      logger.error('Privacy consent handling failed:', error);
      setNeedsPrivacyConsent(true);
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

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
    router.replace('/(tabs)/mood');
  };

  if (checkingConsent || !dbReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PremiumProvider>
          <StarNotificationProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, position: 'relative' }}>
              <CosmicBackground />
              <SafeAreaProvider>
                <StatusBar style="light" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: 'transparent' },
                    animation: 'fade',
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="privacy" />
                  <Stack.Screen name="terms" />
                  <Stack.Screen name="faq" />
                </Stack>

                {/* Overlay gates (do NOT unmount navigation) */}
                {needsPrivacyConsent && (
                  <PrivacyConsentModal visible onConsent={handlePrivacyConsent} contactEmail="brittanyapps@outlook.com" />
                )}

                {/* IMPORTANT: Terms now happens INSIDE onboarding (after Welcome). */}
                {!needsPrivacyConsent && !onboardingComplete && !isOnLegalScreen && (
                  <OnboardingModal
                    visible
                    needsTermsConsent={needsTermsConsent}
                    onTermsConsent={handleTermsConsent}
                    onComplete={handleOnboardingComplete}
                  />
                )}
              </SafeAreaProvider>
            </View>
          </GestureHandlerRootView>
          </StarNotificationProvider>
        </PremiumProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: { 
    flex: 1, 
    backgroundColor: '#07090F', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 32 
  },
  errorTitle: { 
    color: '#FDFBF7', 
    fontSize: 26, 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), 
    marginBottom: 12,
    textAlign: 'center'
  },
  errorBody: { 
    color: '#8A8D98', 
    fontSize: 15, 
    textAlign: 'center', 
    marginBottom: 40, 
    lineHeight: 22,
    paddingHorizontal: 20
  },
  errorButtonGradient: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28, 
    paddingVertical: 14, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(212, 175, 55, 0.3)' 
  },
  errorButtonText: { 
    color: '#D4AF37', 
    fontSize: 15, 
    fontWeight: '600' 
  },
});
