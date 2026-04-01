import 'expo-standard-web-crypto';
import { initSentry } from '../utils/sentry';

// Initialize Sentry before any other code runs
initSentry();

// eslint-disable-next-line import/first
import { GoldIcon } from '../components/ui/GoldIcon';
// File: app/_layout.tsx

import React, { Component, type ReactNode, useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, TouchableOpacity, StyleSheet, DeviceEventEmitter } from 'react-native';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';

import OnboardingModal from '../components/OnboardingModal';
import PrivacyConsentModal from '../components/PrivacyConsentModal';
import AuthRequiredModal from '../components/AuthRequiredModal';
import CosmicBackground from '../components/ui/CosmicBackground';

import { PremiumProvider } from '../context/PremiumContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { StarNotificationProvider } from '../context/StarNotificationContext';

import { MigrationService } from '../services/storage/migrationService';
import { PrivacyComplianceManager } from '../services/privacy/privacyComplianceManager';
import { AstrologySettingsService } from '../services/astrology/astrologySettingsService';
import { localDb } from '../services/storage/localDb';
import { logger } from '../utils/logger';
import { usePendingWidgetCheckIns } from '../hooks/usePendingWidgetCheckIns';
import { useSubscriptionStore } from '../store/useSubscriptionStore';

// Allowlist of routes that notification deep links can navigate to.
// Prevents injection of arbitrary or external URLs via push notifications.
const ALLOWED_NOTIFICATION_ROUTES = new Set([
  '/(tabs)/home',
  '/(tabs)/journal',

  '/(tabs)/chart',
  '/(tabs)/sleep',

  '/(tabs)/mood',
  '/(tabs)/growth',

  '/(tabs)/blueprint',
  '/(tabs)/healing',
  '/(tabs)/sanctuary',
  '/(tabs)/premium',
  '/(tabs)/relationships',
  '/(tabs)/inner-tensions',
  '/(tabs)/checkin',
  '/(tabs)/settings',
  '/checkin',
  '/insights',
  '/sanctuary',
  '/premium',
  '/inner-world',
  '/relationship-patterns',
  '/past-reflections',
  '/trigger-log',
  '/somatic-map',
  '/body-nervous',
  '/cognitive-style',
  '/archetypes',
]);

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
    try {
      const { Sentry } = require('../utils/sentry');
      Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack } } });
    } catch {
      // Sentry not available
    }
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
              <GoldIcon name="refresh-outline" size={16}  style={{ marginRight: 8 }}  />
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
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync('terms_consent', granted ? 'true' : 'false');
  } catch (e) {
    logger.error('[setTermsConsent] Failed to persist terms consent:', e);
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PremiumProvider>
          <StarNotificationProvider>
            <AppShell />
          </StarNotificationProvider>
        </PremiumProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AppShell() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  // Flush any check-ins queued by the Home Screen widget's "Log Energy" button
  usePendingWidgetCheckIns();

  const [checkingConsent, setCheckingConsent] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [initTimedOut, setInitTimedOut] = useState(false);

  const [needsPrivacyConsent, setNeedsPrivacyConsent] = useState(false);
  // Terms consent is tracked alongside privacy consent (combined modal).
  // The value is unused but setters maintain state for future separation.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [needsTermsConsent, setNeedsTermsConsent] = useState(false);

  const [onboardingComplete, setOnboardingComplete] = useState(false);
  // Suppresses AuthRequiredModal during the window between onboardingComplete
  // becoming true and the Supabase SIGNED_IN event updating session in AuthContext.
  const [completingOnboarding, setCompletingOnboarding] = useState(false);

  // Prevent double-running the heavy init in edge cases
  const didRunPostConsentInitRef = useRef(false);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevent double-navigation after onboarding completes
  const didNavigatePostOnboarding = useRef(false);

  const checkIfOnboardingCanBeSkipped = async () => {
    try {
      await localDb.initialize();
      const charts = await localDb.getCharts();
      const hasExistingChart = charts.length > 0;
      setOnboardingComplete(hasExistingChart);
      return hasExistingChart;
    } catch (e) {
      logger.error('Failed to check existing charts:', e);
      setOnboardingComplete(false);
      return false;
    }
  };

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
        const canSkip = await checkIfOnboardingCanBeSkipped();

        // If terms were "accepted" but no chart exists, the consent data is stale
        // (e.g. iOS Keychain surviving an app reinstall). Re-require both consent
        // gates so users always see terms & privacy during a fresh onboarding flow.
        if (!canSkip) {
          await setTermsConsent(false);
          setNeedsTermsConsent(true);
          setNeedsPrivacyConsent(true);
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
    setCompletingOnboarding(false);
    didRunPostConsentInitRef.current = false;
    didNavigatePostOnboarding.current = false;

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
    const consentSub = DeviceEventEmitter.addListener('CONSENT_WITHDRAWN', () => {
      setNeedsPrivacyConsent(true);
      setNeedsTermsConsent(true);
      setOnboardingComplete(false);
      // Allow post-consent init to run again after re-consent
      didRunPostConsentInitRef.current = false;
      logger.info('Consent withdrawn — session re-gated');
    });

    // Legacy onboarding screens can complete outside the root modal. Keep root
    // gate state in sync so tabs can mount immediately after profile creation.
    const onboardingSub = DeviceEventEmitter.addListener('ONBOARDING_COMPLETE', () => {
      setOnboardingComplete(true);
    });

    return () => {
      consentSub.remove();
      onboardingSub.remove();
    };
  }, []);

  // Deep-link routing from local notification taps
  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    import('expo-notifications').then((Notifications) => {
      sub = Notifications.addNotificationResponseReceivedListener(response => {
        const route = response.notification.request.content.data?.route as string | undefined;
        if (route && ALLOWED_NOTIFICATION_ROUTES.has(route)) {
          router.push(route as import('expo-router').Href);
        }
      });
    }).catch(() => {});
    return () => sub?.remove();
  }, [router]);

  const handlePrivacyConsent = async (granted: boolean) => {
    try {
      if (!granted) {
        // Keep gate up; do not initialize anything
        setNeedsPrivacyConsent(true);
        return;
      }

      // Persist consent so it survives app restarts
      try {
        const compliance = new PrivacyComplianceManager();
        await compliance.recordConsent({
          granted: true,
          policyVersion: PrivacyComplianceManager.DEFAULT_POLICY_VERSION,
          timestamp: new Date().toISOString(),
          method: 'explicit',
          lawfulBasis: 'consent',
          purpose: 'astrology_personalization',
        });
      } catch (e) {
        logger.error('[handlePrivacyConsent] Failed to record consent:', e);
      }

      setNeedsPrivacyConsent(false);

      // Terms consent is covered by accepting the combined privacy/terms modal
      await setTermsConsent(true);
      setNeedsTermsConsent(false);

      // Now that consent is granted, complete the deferred initialization
      // Pass false to skip the stale-reinstall check — user just explicitly consented.
      await runPostPrivacyConsentInit(false);
    } catch (error) {
      logger.error('Privacy consent handling failed:', error);
      setNeedsPrivacyConsent(true);
    }
  };

  // Reset the navigation guard whenever session is lost (sign-out) so that
  // signing back in via AuthRequiredModal correctly navigates to home.
  useEffect(() => {
    if (!session) {
      didNavigatePostOnboarding.current = false;
    }
  }, [session]);

  // Navigate to home once both onboarding is complete and session is confirmed.
  // Using an effect avoids a race where handleOnboardingComplete fires before
  // AuthContext has processed the SIGNED_IN event from the onboarding auth step.
  useEffect(() => {
    if (
      onboardingComplete &&
      !!session &&
      !needsPrivacyConsent &&
      !didNavigatePostOnboarding.current
    ) {
      didNavigatePostOnboarding.current = true;
      setCompletingOnboarding(false);
      router.replace('/(tabs)/home');
    }
  }, [onboardingComplete, session, needsPrivacyConsent, router]);

  const handleOnboardingComplete = async () => {
    setCompletingOnboarding(true);
    setOnboardingComplete(true);

    try {
      const { trackGrowthEvent } = await import('../services/growth/localAnalytics');
      await trackGrowthEvent('onboarding_completed');
    } catch (e) {
      logger.error('[RootLayout] Failed to track onboarding_completed:', e);
    }
    // Navigation is handled by the useEffect above once session confirms.
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
              <GoldIcon name="refresh-outline" size={16}  style={{ marginRight: 8 }}  />
              <Text style={styles.errorButtonText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }

  return (
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
            {/* Mount tabs only when privacy is satisfied and onboarding is complete with a valid session. */}
            {!needsPrivacyConsent && onboardingComplete && !!session && <Stack.Screen name="(tabs)" />}

            {/* Onboarding & Auth */}
            <Stack.Screen name="onboarding" />

            {/* --- HIDDEN SCREENS (MODALS) --- */}
            {/* Slide up over the tab bar — dedicated workspaces */}
            <Stack.Screen
              name="checkin"
              options={{
                presentation: 'modal',
                contentStyle: { backgroundColor: '#0A0A0C' },
              }}
            />
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
          {/* Re-consent gate — only shown when consent is withdrawn after onboarding is complete */}
          {needsPrivacyConsent && onboardingComplete && (
            <PrivacyConsentModal visible onConsent={handlePrivacyConsent} />
          )}

          {!onboardingComplete && (
            <OnboardingModal
              visible
              onPrivacyConsent={() => handlePrivacyConsent(true)}
              onComplete={handleOnboardingComplete}
            />
          )}

          {/* Auth gate — shown after onboarding when no session exists */}
          <AuthRequiredModal
            visible={
              !completingOnboarding &&
              !needsPrivacyConsent &&
              onboardingComplete &&
              !authLoading &&
              !session
            }
          />
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
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
    fontWeight: '700',
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
