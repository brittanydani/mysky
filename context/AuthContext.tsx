/**
 * context/AuthContext.tsx
 *
 * Provides Supabase auth state (session, user, loading) to the entire app.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { revenueCatService } from '../services/premium/revenuecat';
import { useDreamMapStore } from '../store/dreamMapStore';
import { useResonanceStore } from '../store/resonanceStore';
import { useSceneStore } from '../store/sceneStore';
import { useCircadianStore } from '../store/circadianStore';
import { useCorrelationStore } from '../store/correlationStore';
import { useCheckInStore } from '../store/checkInStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import * as Haptics from '../utils/haptics';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: (options?: { localOnly?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_SESSION_RESTORE_TIMEOUT_MS = 8_000;
const AUTH_USER_VALIDATION_TIMEOUT_MS = 8_000;
const AUTH_FOREGROUND_SYNC_TIMEOUT_MS = 8_000;

async function withAuthTimeout<T>(
  label: string,
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function isRecoverableAuthValidationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /timeout|network|fetch|abort|offline|failed to fetch|network request failed/i.test(message);
}

async function clearInvalidLocalAuthState(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    logger.warn('[AuthContext] Failed to clear invalid local Supabase session:', error);
  }

  try {
    await revenueCatService.logOut();
  } catch (error) {
    logger.warn('[AuthContext] Failed to clear RevenueCat identity after invalid session:', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(true);

  const setSessionIfChanged = useCallback((nextSession: Session | null) => {
    if (!isMounted.current) return;

    setSession((prevSession) => {
      const prevAccessToken = prevSession?.access_token ?? null;
      const nextAccessToken = nextSession?.access_token ?? null;

      if (prevAccessToken === nextAccessToken) {
        return prevSession;
      }

      return nextSession;
    });
  }, []);

  useEffect(() => {
    isMounted.current = true;

    const initializeAuth = async () => {
      const MAX_RETRIES = 3;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          const {
            data: { session: restored },
            error,
          } = await withAuthTimeout(
            'Supabase session restore',
            supabase.auth.getSession(),
            AUTH_SESSION_RESTORE_TIMEOUT_MS,
          );

          if (error) throw error;

          let verifiedSession = restored ?? null;

          if (restored?.user) {
            try {
              const {
                data: { user },
                error: userError,
              } = await withAuthTimeout(
                'Supabase restored user validation',
                supabase.auth.getUser(),
                AUTH_USER_VALIDATION_TIMEOUT_MS,
              );

              if (userError) throw userError;
              if (!user || user.id !== restored.user.id) {
                throw new Error('Restored session user could not be verified');
              }
            } catch (validationError) {
              if (isRecoverableAuthValidationError(validationError)) {
                logger.warn('[AuthContext] Restored session validation deferred:', validationError);
              } else {
                logger.warn('[AuthContext] Restored session is invalid; clearing local session:', validationError);
                await clearInvalidLocalAuthState();
                verifiedSession = null;
              }
            }
          }

          setSessionIfChanged(verifiedSession);

          if (verifiedSession?.user) {
            void revenueCatService
              .logIn(verifiedSession.user.id)
              .catch((e) => logger.error('[AuthContext] RC logIn failed:', e));
          }

          break;
        } catch (err) {
          if (attempt === MAX_RETRIES || !isMounted.current) {
            logger.error('[AuthContext] Session restoration failed after retries:', err);
            break;
          }

          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
          logger.warn(
            `[AuthContext] Session restore attempt ${attempt} failed, retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      if (isMounted.current) {
        setLoading(false);
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      logger.info(`[AuthContext] State change: ${event}`);

      setSessionIfChanged(newSession);

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
        void revenueCatService
          .logIn(newSession.user.id)
          .catch((e) => logger.error('[AuthContext] RC logIn failed:', e));
      } else if (event === 'SIGNED_OUT') {
        void revenueCatService
          .logOut()
          .catch((e) => logger.error('[AuthContext] RC logOut failed:', e));
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [setSessionIfChanged]);

  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();

        void (async () => {
          try {
            const {
              data: { session: hydratedSession },
              error,
            } = await withAuthTimeout(
              'Supabase foreground session sync',
              supabase.auth.getSession(),
              AUTH_FOREGROUND_SYNC_TIMEOUT_MS,
            );

            if (error) throw error;

            let nextSession = hydratedSession;
            const expiresAtMs = hydratedSession?.expires_at
              ? hydratedSession.expires_at * 1000
              : null;

            const shouldRefresh =
              Boolean(hydratedSession?.refresh_token) &&
              expiresAtMs !== null &&
              expiresAtMs <= Date.now() + 60_000;

            if (shouldRefresh) {
              const { data, error: refreshError } = await withAuthTimeout(
                'Supabase foreground token refresh',
                supabase.auth.refreshSession(),
                AUTH_FOREGROUND_SYNC_TIMEOUT_MS,
              );
              if (refreshError) throw refreshError;
              nextSession = data.session ?? hydratedSession;
            }

            setSessionIfChanged(nextSession ?? null);
          } catch (e) {
            logger.warn('[AuthContext] Failed to sync session on foreground:', e);
            if (!isRecoverableAuthValidationError(e)) {
              await clearInvalidLocalAuthState();
              setSessionIfChanged(null);
            }
          }
        })();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [setSessionIfChanged]);

  const clearSignedOutState = useCallback(async () => {
    useDreamMapStore.getState().clearCache();
    useResonanceStore.getState().clearCache();
    useSceneStore.getState().clearScene();
    useCircadianStore.getState().clearCache();
    useCorrelationStore.getState().clearCache();
    useCheckInStore.getState().resetStatus();
    useSubscriptionStore.getState().reset();
    if (isMounted.current) {
      setSession(null);
    }
  }, []);

  const signOut = useCallback(
    async (options?: { localOnly?: boolean }) => {
      let signOutError: unknown = null;

      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

        const { error } = await supabase.auth.signOut(
          options?.localOnly ? { scope: 'local' } : undefined,
        );

        if (error) throw error;
      } catch (err) {
        signOutError = err;
        logger.error('[AuthContext] Sign-out failed:', err);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }

      if (!signOutError || options?.localOnly) {
        await clearSignedOutState();
      }

      if (signOutError) {
        throw signOutError;
      }

      logger.info('[AuthContext] User successfully signed out');
    },
    [clearSignedOutState],
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
