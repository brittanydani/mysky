import { GoldIcon } from '../components/ui/GoldIcon';
// File: app/_layout.tsx

import React, { Component, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, TouchableOpacity, StyleSheet, Platform, DeviceEventEmitter } from 'react-native';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
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
import { usePendingWidgetCheckIns } from '../hooks/usePendingWidgetCheckIns';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import * as Notifications from 'expo-notifications';

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
          <GoldIcon name="warning-outline" size={56}  style={{ marginBottom: 20 }}  />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorBody}>An unexpected error occurred. Please close the app and reopen it, or try reloading below.</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => this.setState({ hasError: false })}>
            <LinearGradient 
              colors={['rgba(232, 214, 174, 0.15)', 'rgba(232,214,174,0.05)']} 
              style={styles.errorButtonGradient}
            >
              <GoldIcon name="refresh" size={16}  style={{ marginRight: 8 }}  />
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

  // Flush any check-ins queued by the Home Screen widget's "Log Energy" button
  usePendingWidgetCheckIns();

  const [checkingConsent, setCheckingConsent] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [initTimedOut, setInitTimedOut] = useState(false);

  const [needsPrivacyConsent, setNeedsPrivacyConsent] = useState(false);
  const [needsTermsConsent, setNeedsTermsConsent] = useState(false);

  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Prevent double-running the heavy init in edge cases
  const didRunPostConsentInitRef = useRef(false);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      // Boot the subscription store so isPro is known before any screen renders
      useSubscriptionStore.getState().initialize().catch((e) =>
        logger.error('Subscription store init failed:', e)
      );

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
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
      }
    };

    // Show retry UI if initialization takes too long (e.g. stuck SecureStore)
    initTimeoutRef.current = setTimeout(() => {
      if (checkingConsent || !dbReady) {
        setInitTimedOut(true);
        logger.error('App initialization timed out after 15 seconds');
      }
    }, 15_000);

    initializeApp();

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retryInit = () => {
    setInitTimedOut(false);
    setCheckingConsent(true);
    setDbReady(false);
    didRunPostConsentInitRef.current = false;

    initTimeoutRef.current = setTimeout(() => {
      setInitTimedOut(true);
      logger.error('App initialization retry timed out');
    }, 15_000);

    const retryInitializeApp = async () => {
      try {
        const privacyManager = new PrivacyComplianceManager();
        const consentStatus = await privacyManager.requestConsent();
        setNeedsPrivacyConsent(consentStatus.required);

        const termsAccepted = await getTermsConsent();
        setNeedsTermsConsent(!termsAccepted);

        if (!consentStatus.required) {
          await runPostPrivacyConsentInit(termsAccepted);
        } else {
          setDbReady(true);
        }
      } catch (error) {
        logger.error('Retry initialization failed:', error);
        setDbReady(true);
      } finally {
        setCheckingConsent(false);
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
      }
    };

    retryInitializeApp();
  };

  // Listen for consent withdrawal from settings — immediately re-gate the session
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('CONSENT_WITHDRAWN', () => {
      setNeedsPrivacyConsent(true);
      setOnboardingComplete(false);
      logger.info('Consent withdrawn — session re-gated');
    });
    return () => sub.remove();
  }, []);

  // Deep-link routing from local notification taps
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const route = response.notification.request.content.data?.route as string | undefined;
      if (route) {
        router.push(route as any);
      }
    });
    return () => sub.remove();
  }, [router]);

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
    if (initTimedOut) {
      return (
        <View style={styles.errorContainer}>
          <GoldIcon name="hourglass-outline" size={56}  style={{ marginBottom: 20 }}  />
          <Text style={styles.errorTitle}>Taking longer than expected</Text>
          <Text style={styles.errorBody}>Initialization is still loading. This can happen if secure storage is temporarily unavailable. Please try again.</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={retryInit}>
            <LinearGradient
              colors={['rgba(232, 214, 174, 0.15)', 'rgba(232,214,174,0.05)']}
              style={styles.errorButtonGradient}
            >
              <GoldIcon name="refresh" size={16}  style={{ marginRight: 8 }}  />
              <Text style={styles.errorButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }
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
                  {/* Only mount tabs after privacy consent is confirmed */}
                  {!needsPrivacyConsent && <Stack.Screen name="(tabs)" />}

                  {/* Onboarding & Auth */}
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(auth)/sign-in" options={{ presentation: 'modal' }} />

                  {/* --- HIDDEN SCREENS (MODALS) --- */}
                  {/* Slide up over the tab bar — dedicated workspaces */}
                  <Stack.Screen name="checkin" options={{ presentation: 'modal' }} />
                  <Stack.Screen
                    name="sanctuary"
                    options={{
                      presentation: 'fullScreenModal',
                      animation: 'fade_from_bottom',
                    }}
                  />
                  {/* Slide-up from within the tab context (e.g. natal chart detail) */}
                  <Stack.Screen name="astrology-context" options={{ animation: 'slide_from_bottom' }} />

                  {/* Legal */}
                  <Stack.Screen name="faq" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="privacy" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="terms" options={{ presentation: 'modal' }} />
                </Stack>

                {/* Overlay gates (do NOT unmount navigation) */}
                {needsPrivacyConsent && (
                  <PrivacyConsentModal visible onConsent={handlePrivacyConsent} contactEmail="support@mysky.app" />
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
    backgroundColor: '#020817', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 32 
  },
  errorTitle: { 
    color: '#FFFFFF', 
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
    borderColor: 'rgba(232,214,174,0.25)' 
  },
  errorButtonText: { 
    color: '#FFFFFF', 
    fontSize: 15, 
    fontWeight: '600' 
  },
});
