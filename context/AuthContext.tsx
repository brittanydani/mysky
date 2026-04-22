/**
 * context/AuthContext.tsx
 *
 * Provides Supabase auth state (session, user, loading) to the entire app.
 * High-end refactor for the Deeper Sky ecosystem.
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
import { isAutoDemoSeedEnabled } from '../constants/config';
import { logger } from '../utils/logger';
import { revenueCatService } from '../services/premium/revenuecat';
import { DemoSeedService } from '../services/storage/demoAccountBSeedService';
import { useDreamMapStore } from '../store/dreamMapStore';
import { useResonanceStore } from '../store/resonanceStore';
import { useSceneStore } from '../store/sceneStore';
import { useCircadianStore } from '../store/circadianStore';
import { useCorrelationStore } from '../store/correlationStore';
import { useCheckInStore } from '../store/checkInStore';
import * as Haptics from '../utils/haptics';
import { IdentityVault } from '../utils/IdentityVault';

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: (options?: { localOnly?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadLocalDb() {
  const mod = await import('../services/storage/localDb');
  return mod.localDb;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const lastDemoSyncTimestamp = useRef(0);

  const syncDemoArtifacts = useCallback(async (email: string | null | undefined) => {
    const now = Date.now();
    if (now - lastDemoSyncTimestamp.current < 30_000) return;
    lastDemoSyncTimestamp.current = now;

    if (isAutoDemoSeedEnabled()) {
      await DemoSeedService.seedIfNeeded(email);
      return;
    }

    await DemoSeedService.cleanupStaleDemoArtifacts(email);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    // 1. Orbital Restoration — Hydrate session from local storage (with retry)
    const initializeAuth = async () => {
      const MAX_RETRIES = 3;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const { data: { session: restored }, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (isMounted.current) {
            setSession(restored);
            if (restored?.user) {
              // Await so any RC initialization exception surfaces here rather
              // than as an unhandled fire-and-forget rejection.
              await revenueCatService.logIn(restored.user.id);
              await syncDemoArtifacts(restored.user.email);
            }
          }
          break; // success
        } catch (err) {
          if (attempt === MAX_RETRIES || !isMounted.current) {
            logger.error('[AuthContext] Session restoration failed after retries:', err);
            break;
          }
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
          logger.warn(`[AuthContext] Session restore attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      if (isMounted.current) setLoading(false);
    };

    initializeAuth();

    // 2. Observer Pattern — Listen for real-time auth transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      logger.info(`[AuthContext] State change: ${event}`);
      if (isMounted.current) {
        setSession(newSession);
      }
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
        revenueCatService.logIn(newSession.user.id).catch((e) => logger.error('[AuthContext] RC logIn failed:', e));
        syncDemoArtifacts(newSession.user.email).catch((e) => logger.warn('[AuthContext] Demo sync failed:', e));
      } else if (event === 'SIGNED_OUT') {
        revenueCatService.logOut().catch((e) => logger.error('[AuthContext] RC logOut failed:', e));
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [syncDemoArtifacts]);

  // 3. App Lifecycle Management — Stop refresh when backgrounded
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
        void (async () => {
          try {
            const { data: { session: hydratedSession }, error } = await supabase.auth.getSession();
            if (error) throw error;

            let nextSession = hydratedSession;
            const expiresAtMs = hydratedSession?.expires_at ? hydratedSession.expires_at * 1000 : null;
            const shouldRefresh = Boolean(hydratedSession?.refresh_token)
              && expiresAtMs !== null
              && expiresAtMs <= Date.now() + 60_000;

            if (shouldRefresh) {
              const { data, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) throw refreshError;
              nextSession = data.session ?? hydratedSession;
            }

            if (isMounted.current) {
              setSession(nextSession ?? null);
            }

            // Top-up demo data for any days missed while app was closed.
            if (nextSession?.user?.email) {
              syncDemoArtifacts(nextSession.user.email).catch((e) => logger.warn('[AuthContext] Demo sync failed:', e));
            }

          } catch (e) {
            logger.warn('[AuthContext] Failed to sync session on foreground:', e);
          }
        })();
      } else {
        // Halt refresh to save energy for the user
        supabase.auth.stopAutoRefresh();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [syncDemoArtifacts]);

  const clearSignedOutState = useCallback(async () => {
    // Clear sensitive cached data from Zustand stores
    useDreamMapStore.getState().clearCache();
    useResonanceStore.getState().clearCache();
    useSceneStore.getState().clearScene();
    useCircadianStore.getState().clearCache();
    useCorrelationStore.getState().clearCache();
    useCheckInStore.getState().resetStatus();

    // Clear unsynced queue before another account can sign in on this device.
    try {
      const localDb = await loadLocalDb();
      await localDb.clearSyncQueue();
    } catch (e) {
      logger.error('[AuthContext] Failed to clear sync queue during sign-out:', e);
    }

    // Destroy the hardware-sealed identity to prevent the next user from inheriting it
    try {
      await IdentityVault.destroyIdentity();
    } catch (e) {
      logger.error('[AuthContext] Failed to destroy IdentityVault during sign-out:', e);
    }

    if (isMounted.current) {
      setSession(null);
    }
  }, []);

  const signOut = useCallback(async (options?: { localOnly?: boolean }) => {
    try {
      // Tactile confirmation of closing the session
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { /* haptic not critical */ });
      
      const { error } = await supabase.auth.signOut(options?.localOnly ? { scope: 'local' } : undefined);
      if (error) throw error;

      await clearSignedOutState();
      
      logger.info('[AuthContext] User successfully signed out');
    } catch (err) {
      logger.error('[AuthContext] Sign-out failed:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { /* haptic not critical */ });
    }
  }, [clearSignedOutState]);

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
