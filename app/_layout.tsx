// expo-standard-web-crypto is NOT imported at the top level.
// It chains: expo-standard-web-crypto → expo-crypto → requireNativeModule('ExpoCrypto')
// which is a synchronous TurboModule call at module eval time.
// On iOS 26 New Architecture this crashes before React mounts (same vector as
// the Skia/Reanimated eval-time crashes). Polyfill is installed lazily inside
// initializeApp() after the JS engine is fully bootstrapped.
//
// Sentry is also initialized inside AppShell after bootstrap gating completes,
// not at module load — top-level native TurboModule calls at eval time
// were causing dladdr/backtrace_symbols crashes on iOS 26 New Architecture.

import { Ionicons } from '@expo/vector-icons';
// File: app/_layout.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { Component, type ReactNode, useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from '../components/keyboard/KeyboardControllerCompat';
import { View, Text, TouchableOpacity, StyleSheet, DeviceEventEmitter } from 'react-native';
import { PremiumProvider } from '../context/PremiumContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { StarNotificationProvider } from '../context/StarNotificationContext';
import { MigrationService } from '../services/storage/migrationService';
import { PrivacyComplianceManager } from '../services/privacy/privacyComplianceManager';
import { AstrologySettingsService } from '../services/astrology/astrologySettingsService';
import { initHapticPreference } from '../utils/haptics';
import { localDb } from '../services/storage/localDb';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import { ENCRYPTED_ASYNC_USER_DATA_KEYS, PLAIN_ASYNC_USER_DATA_KEYS } from '../services/storage/userDataKeys';
import { generateId } from '../services/storage/models';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';
import { darkTheme, type AppTheme } from '../constants/theme';
import { IdentityVault } from '../utils/IdentityVault';
import { usePendingWidgetCheckIns } from '../hooks/usePendingWidgetCheckIns';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { ThemeProvider, useAppTheme, useThemedStyles } from '../context/ThemeContext';

// Keep splash visible until the app finishes initializing
SplashScreen.preventAutoHideAsync().catch(() => {});

// SkiaGradient removed — was triggering Skia barrel import at module eval time,
// which creates a Reanimated worklet runtime before React mounts (crash vector).
// ErrorBoundary and timeout UI now use plain Views instead.

function lazyRequire<T extends React.ComponentType<any>>(
  loader: () => { default: T }
): React.LazyExoticComponent<T> {
  return React.lazy(() => Promise.resolve().then(loader));
}

// Modals lazy-loaded to avoid pulling @shopify/react-native-skia into eval-time
// import graph (Skia barrel triggers Reanimated worklet runtime at module eval).
const OnboardingModal = lazyRequire(
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  () => require('../components/OnboardingModal') as { default: React.ComponentType<any> }
);
const PrivacyConsentModal = lazyRequire(
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  () => require('../components/PrivacyConsentModal') as { default: React.ComponentType<any> }
);
const AuthRequiredModal = lazyRequire(
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  () => require('../components/AuthRequiredModal') as { default: React.ComponentType<any> }
);
const CosmicBackground = lazyRequire(
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  () => require('../components/ui/CosmicBackground') as { default: React.ComponentType<any> }
);


// Allowlist of routes that notification deep links can navigate to.
// Prevents injection of arbitrary or external URLs via push notifications.
const ALLOWED_NOTIFICATION_ROUTES = new Set([
  '/(tabs)/home',
  '/(tabs)/journal',

  '/(tabs)/chart',
  '/(tabs)/sleep',

  '/(tabs)/internal-weather',
  '/(tabs)/patterns',

  '/(tabs)/identity',
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

const errorBoundaryStyles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: darkTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    color: darkTheme.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorBody: {
    color: darkTheme.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  errorButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: darkTheme.cardBorder,
    backgroundColor: darkTheme.surface,
  },
  errorButtonText: {
    color: darkTheme.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});

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
    loadSentry().then(({ Sentry }) => {
      Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack } } });
    }).catch(() => {
      // Sentry not available
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorBoundaryStyles.errorContainer}>
          <Ionicons name="warning-outline" size={56} color="#E8D6AE" style={{ marginBottom: 20 }} />
          <Text style={errorBoundaryStyles.errorTitle}>Something went wrong</Text>
          <Text style={errorBoundaryStyles.errorBody}>An unexpected error occurred. Please close the app and reopen it, or try reloading below.</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => this.setState({ hasError: false })}>
            <View style={errorBoundaryStyles.errorButtonGradient}>
              <Ionicons name="refresh-outline" size={16} color="#E8D6AE" style={{ marginRight: 8 }} />
              <Text style={errorBoundaryStyles.errorButtonText}>Reload Experience</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

async function getTermsConsent(): Promise<boolean> {
  try {
    const SecureStore = await loadSecureStore();
    const value = await SecureStore.getItemAsync('terms_consent');
    return value === 'true';
  } catch {
    return false;
  }
}

async function setTermsConsent(granted: boolean) {
  try {
    const SecureStore = await loadSecureStore();
    await SecureStore.setItemAsync('terms_consent', granted ? 'true' : 'false');
  } catch (e) {
    logger.error('[setTermsConsent] Failed to persist terms consent:', e);
  }
}

function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <StarNotificationProvider>
            <AppShell />
          </StarNotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Wrap with Sentry profiling only after Sentry is initialized (lazy).
// Sentry.wrap at module eval time throws ReferenceError on iOS 26 New
// Architecture because the native Sentry TurboModule isn't available yet.
export default RootLayout;

function loadSyncService() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return Promise.resolve().then(() => require('../services/storage/syncService'));
}

function loadSecureStore() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return Promise.resolve().then(() => require('expo-secure-store'));
}

function loadWebCrypto() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return Promise.resolve().then(() => require('expo-standard-web-crypto'));
}

function loadNotifications() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return Promise.resolve().then(() => require('expo-notifications'));
}

function loadGrowthAnalytics() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return Promise.resolve().then(() => require('../services/growth/localAnalytics'));
}

function loadSentry() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return Promise.resolve().then(() => require('../utils/sentry'));
}

const isLightweightDevMode =
  __DEV__ && Constants.expoConfig?.extra?.lightweightDevMode === true;

function AppShell() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  // Ref so the initializeApp closure always reads the current authLoading value
  // without needing authLoading in the effect dependency array.
  const authLoadingRef = useRef(authLoading);
  useEffect(() => { authLoadingRef.current = authLoading; }, [authLoading]);

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
  const [sessionDataReady, setSessionDataReady] = useState(false);
  // Suppresses AuthRequiredModal during the window between onboardingComplete
  // becoming true and the Supabase SIGNED_IN event updating session in AuthContext.
  const [completingOnboarding, setCompletingOnboarding] = useState(false);

  // Prevent double-running the heavy init in edge cases
  const didRunPostConsentInitRef = useRef(false);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didHideSplash = useRef(false);
  // Prevent double-navigation after onboarding completes
  const didNavigatePostOnboarding = useRef(false);
  const sessionBootstrapRef = useRef(0);
  const authEntryIntentRef = useRef<'sign-in-home' | null>(null);

  const bindLocalSettingsToUser = async (userId: string, resetSyncState = false) => {
    const current = await localDb.getSettings();
    const now = new Date().toISOString();
    await localDb.updateSettings({
      id: 'default',
      cloudSyncEnabled: current?.cloudSyncEnabled ?? false,
      lastSyncAt: resetSyncState ? undefined : current?.lastSyncAt,
      lastBackupAt: current?.lastBackupAt,
      userId,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    });
  };

  const clearLocalDataForUserSwitch = async () => {
    await localDb.clearAccountScopedData();
    await Promise.all([
      ...ENCRYPTED_ASYNC_USER_DATA_KEYS.map((key) => EncryptedAsyncStorage.removeItem(key)),
      ...PLAIN_ASYNC_USER_DATA_KEYS.map((key) => AsyncStorage.removeItem(key)),
      IdentityVault.destroyIdentity().catch(() => {}),
    ]);
  };

  const prepareLocalStateForSession = async (userId: string) => {
    const settings = await localDb.getSettings();
    const storedUserId = settings?.userId ?? null;

    if (storedUserId && storedUserId !== userId) {
      logger.info('[auth] New account detected on device — clearing previous local user data');
      await clearLocalDataForUserSwitch();
      await bindLocalSettingsToUser(userId, true);
      return;
    }

    await bindLocalSettingsToUser(userId, false);
  };

  const restoreChartFromIdentityVault = async () => {
    try {
      const sealedIdentity = await IdentityVault.openVault();
      if (!sealedIdentity?.birthDate || !sealedIdentity.locationCity.trim()) {
        return false;
      }

      const hasValidCoordinates =
        Number.isFinite(sealedIdentity.locationLat) &&
        Number.isFinite(sealedIdentity.locationLng);
      if (!hasValidCoordinates) {
        logger.warn('[onboarding] Sealed identity missing valid coordinates');
        return false;
      }

      const astroSettings = await AstrologySettingsService.getSettings();
      const now = new Date().toISOString();
      await localDb.saveChart({
        id: generateId(),
        name: sealedIdentity.name.trim() || 'My Chart',
        birthDate: sealedIdentity.birthDate,
        birthTime: sealedIdentity.hasUnknownTime ? undefined : sealedIdentity.birthTime,
        hasUnknownTime: sealedIdentity.hasUnknownTime,
        birthPlace: sealedIdentity.locationCity.trim(),
        latitude: sealedIdentity.locationLat,
        longitude: sealedIdentity.locationLng,
        timezone: sealedIdentity.timezone,
        houseSystem: astroSettings.houseSystem,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      });

      logger.info('[onboarding] Restored chart from sealed identity');
      return true;
    } catch (error) {
      logger.error('[onboarding] Failed to restore chart from sealed identity:', error);
      return false;
    }
  };

  const checkIfOnboardingCanBeSkipped = async () => {
    try {
      await localDb.initialize();
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        setOnboardingComplete(true);
        return true;
      }

      // If SQLite was cleared but the device keychain still has the sealed birth
      // profile, restore the local chart and keep the user out of onboarding.
      const restoredFromVault = await restoreChartFromIdentityVault();
      const canSkip = restoredFromVault;
      setOnboardingComplete(canSkip);
      return canSkip;
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
      logger.info('[post-consent] step: migration');
      await MigrationService.performMigrationIfNeeded();
      logger.info('[post-consent] step: astrology settings');
      await AstrologySettingsService.getSettings();
      logger.info('[post-consent] step: haptic preference');
      await initHapticPreference();

      // Boot the subscription store so isPro is known before any screen renders
      logger.info('[post-consent] step: subscription store');
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
        // Install the Web Crypto polyfill now that the JS engine is bootstrapped.
        // expo-standard-web-crypto → expo-crypto → requireNativeModule('ExpoCrypto')
        // must not run at module eval time (iOS 26 New Architecture crash vector).
        logger.info('[init] step: webCrypto polyfill');
        try {
          await loadWebCrypto().then((m) => {
            if (typeof m.polyfillWebCrypto === 'function') m.polyfillWebCrypto();
          });
        } catch (e) {
          logger.error('[init] webCrypto polyfill failed:', e);
        }

        // Wait for AuthContext to finish its own SecureStore/Keychain reads
        // (session restore) before we start our own. Concurrent Keychain
        // access on iOS 26 was causing TurboModule queue crashes at launch.
        // authLoadingRef is a ref so the closure always reads the latest value.
        logger.info('[init] step: waiting for auth context');
        await new Promise<void>((resolve) => {
          if (!authLoadingRef.current) { resolve(); return; }
          authCheckIntervalRef.current = setInterval(() => {
            if (!authLoadingRef.current) {
              if (authCheckIntervalRef.current) clearInterval(authCheckIntervalRef.current);
              resolve();
            }
          }, 20);
        });

        logger.info('[init] step: privacy consent');
        const privacyManager = new PrivacyComplianceManager();
        let consentStatus = await privacyManager.requestConsent();

        logger.info('[init] step: terms consent');
        let termsAccepted = await getTermsConsent();
        // If the user already has a valid session they previously accepted the
        // terms — re-hydrate the SecureStore key so future cold starts skip the
        // consent prompt (fresh installs wipe Keychain, but session survives).
        // Read the live session directly — `session` state is null at closure
        // capture time since this effect runs once with [] deps.
        const { data: { session: initLiveSession } } = await supabase.auth.getSession();
        if (consentStatus.required && initLiveSession) {
          logger.info('[init] session present — auto-restoring privacy consent');
          await privacyManager.recordConsent({
            granted: true,
            policyVersion: consentStatus.policyVersion,
            timestamp: new Date().toISOString(),
            method: 'explicit',
            lawfulBasis: 'consent',
            purpose: 'astrology_personalization',
          });
          consentStatus = {
            ...consentStatus,
            required: false,
          };
        }

        if (!termsAccepted && initLiveSession) {
          logger.info('[init] session present — auto-restoring terms consent');
          await setTermsConsent(true);
          termsAccepted = true;
        }
        setNeedsPrivacyConsent(consentStatus.required);
        setNeedsTermsConsent(!termsAccepted);

        // Only initialize DB / settings after privacy consent is granted
        if (!consentStatus.required) {
          logger.info('[init] step: post-privacy-consent init');
          await runPostPrivacyConsentInit(termsAccepted);
        } else {
          // We still consider the "app ready" enough to render UI (Stack + consent modal),
          // but we intentionally do NOT run migrations/settings until consent is granted.
          setDbReady(true);
        }
        logger.info('[init] complete');
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
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current);
        authCheckIntervalRef.current = null;
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

  // Configure notification display behaviour and deep-link routing from taps.
  // setNotificationHandler must be called before any notification is displayed
  // so that foreground notifications are shown (not silently dropped on iOS).
  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    loadNotifications().then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      sub = Notifications.addNotificationResponseReceivedListener((response: import('expo-notifications').NotificationResponse) => {
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
      sessionBootstrapRef.current += 1;
      didNavigatePostOnboarding.current = false;
      setCompletingOnboarding(false);
      setSessionDataReady(false);
      authEntryIntentRef.current = null;
    }
  }, [session]);

  // Flush pending sync queue and trigger a pull whenever the user signs in.
  // Pull is sequenced after flush so that last_sync_at reflects local writes first.
  useEffect(() => {
    if (!session) return;
    const bootstrapId = ++sessionBootstrapRef.current;
    setSessionDataReady(false);

    const isStale = () => bootstrapId !== sessionBootstrapRef.current;

    (async () => {
      if (isStale()) return;
      await prepareLocalStateForSession(session.user.id).catch((e) =>
        logger.error('[auth] Failed to prepare local state for session:', e),
      );
      if (isStale()) return;

      try {
        const { flushQueue, pullFromSupabase, syncBirthProfileFromLocal } = await loadSyncService();
        if (isStale()) return;
        await syncBirthProfileFromLocal().catch((e: unknown) => logger.warn('[auth] Sync profile failed:', e));
        if (isStale()) return;
        await flushQueue().catch((e: unknown) => logger.warn('[sync] Queue flush failed:', e));
        if (isStale()) return;
        await pullFromSupabase().catch((e: unknown) => logger.warn('[sync] Pull failed:', e));
      } catch (e) {
        logger.error('[auth] Failed to load sync service for session bootstrap:', e);
      }

      if (isStale()) return;
      await bindLocalSettingsToUser(session.user.id, false).catch((e) => logger.warn('[auth] Bind settings failed:', e));
      if (isStale()) return;

      if (authEntryIntentRef.current === 'sign-in-home') {
        setOnboardingComplete(true);
        setSessionDataReady(true);
        return;
      }

      await checkIfOnboardingCanBeSkipped().catch(() => false);
      if (isStale()) return;
      setSessionDataReady(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Navigate to home once both onboarding is complete and session is confirmed.
  // Using an effect avoids a race where handleOnboardingComplete fires before
  // AuthContext has processed the SIGNED_IN event from the onboarding auth step.
  useEffect(() => {
    if (
      onboardingComplete &&
      !!session &&
      sessionDataReady &&
      !needsPrivacyConsent &&
      !didNavigatePostOnboarding.current
    ) {
      didNavigatePostOnboarding.current = true;
      setCompletingOnboarding(false);
      router.replace('/(tabs)/home');
    }
  }, [onboardingComplete, session, sessionDataReady, needsPrivacyConsent, router]);

  const handleOnboardingComplete = async (_chart?: import('../services/astrology/types').NatalChart) => {
    setCompletingOnboarding(true);
    setOnboardingComplete(true);

    if (isLightweightDevMode) {
      return;
    }

    try {
      const { trackGrowthEvent } = await loadGrowthAnalytics();
      await trackGrowthEvent('onboarding_completed');
    } catch (e) {
      logger.error('[RootLayout] Failed to track onboarding_completed:', e);
    }
    // Navigation is handled by the useEffect above once session confirms.
  };

  const handleExistingSignInComplete = async () => {
    authEntryIntentRef.current = 'sign-in-home';
    setCompletingOnboarding(true);
    setOnboardingComplete(true);

    if (needsPrivacyConsent) {
      await handlePrivacyConsent(true);
    } else {
      await setTermsConsent(true);
      setNeedsTermsConsent(false);
    }
  };

  // Hide splash screen once all init gates have passed, then init Sentry.
  // Sentry must not run at module load or before bootstrap completes \u2014
  // its native TurboModule call was crashing on iOS 26 New Architecture.
  useEffect(() => {
    if (!checkingConsent && dbReady && !authLoading && (!session || sessionDataReady) && !didHideSplash.current) {
      didHideSplash.current = true;
      SplashScreen.hideAsync().catch(() => {});

      if (isLightweightDevMode) {
        return;
      }

      loadSentry().then(({ initSentry }) => {
        try { initSentry(); } catch { /* native module unavailable */ }
      }).catch(() => {});
    }
  }, [checkingConsent, dbReady, authLoading, session, sessionDataReady]);

  if (checkingConsent || !dbReady) {
    if (initTimedOut) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="hourglass-outline" size={56} color="#E8D6AE" style={{ marginBottom: 20 }} />
          <Text style={styles.errorTitle}>Taking longer than expected</Text>
          <Text style={styles.errorBody}>Initialization is still loading. This can happen if secure storage is temporarily unavailable. Please try again.</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={retryInit}>
            <View
              style={styles.errorButtonGradient}
            >
              <Ionicons name="refresh-outline" size={16} color="#E8D6AE" style={{ marginRight: 8 }} />
              <Text style={styles.errorButtonText}>Retry</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }

  return (
    <PremiumProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider preload={false}>
        <View style={{ flex: 1, position: 'relative' }}>
          {isLightweightDevMode ? (
            <View style={{ flex: 1, backgroundColor: theme.background }} />
          ) : (
            <React.Suspense fallback={<View style={{ flex: 1, backgroundColor: theme.background }} />}>
              <CosmicBackground />
            </React.Suspense>
          )}
          <SafeAreaProvider>
            <StatusBar style={theme.statusBarStyle} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'fade',
              }}
            >
              {/* Keep the screen list static for Expo Router; access is gated by overlays and redirects. */}
              <Stack.Screen name="(tabs)" />

              {/* --- HIDDEN SCREENS (MODALS) --- */}
              {/* Slide up over the tab bar — dedicated workspaces */}
              <Stack.Screen
                name="checkin"
                options={{
                  presentation: 'modal',
                  contentStyle: { backgroundColor: theme.background },
                }}
              />
              <Stack.Screen
                name="daily-reflection"
                options={{
                  presentation: 'modal',
                  contentStyle: { backgroundColor: theme.background },
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
            <React.Suspense fallback={null}>
            {/* Re-consent gate — only shown when consent is withdrawn after onboarding is complete */}
            {needsPrivacyConsent && onboardingComplete && (
              <PrivacyConsentModal visible onConsent={handlePrivacyConsent} />
            )}

            {!onboardingComplete && (
              <OnboardingModal
                visible
                onPrivacyConsent={() => handlePrivacyConsent(true)}
                onSignInComplete={handleExistingSignInComplete}
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
            </React.Suspense>
          </SafeAreaProvider>
        </View>
      </KeyboardProvider>
    </GestureHandlerRootView>
    </PremiumProvider>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    color: theme.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorBody: {
    color: theme.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  errorButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.surface,
  },
  errorButtonText: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
