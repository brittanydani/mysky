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
import * as Haptics from 'expo-haptics';

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { revenueCatService } from '../services/premium/revenuecat';
import { DemoSeedService } from '../services/storage/demoSeedService';
import { localDb } from '../services/storage/localDb';
import { useDreamMapStore } from '../store/dreamMapStore';
import { useResonanceStore } from '../store/resonanceStore';
import { useSceneStore } from '../store/sceneStore';
import { useCircadianStore } from '../store/circadianStore';
import { useCorrelationStore } from '../store/correlationStore';
import { useCheckInStore } from '../store/checkInStore';

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

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
      if (event === 'SIGNED_IN' && newSession?.user) {
        revenueCatService.logIn(newSession.user.id).catch((e) => logger.error('[AuthContext] RC logIn failed:', e));
        // Auto-seed demo data for the App Store reviewer account only
        DemoSeedService.seedIfNeeded(newSession.user.email).catch((e) => logger.warn('[AuthContext] Demo seed failed:', e));
      } else if (event === 'SIGNED_OUT') {
        revenueCatService.logOut().catch((e) => logger.error('[AuthContext] RC logOut failed:', e));
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // 3. App Lifecycle Management — Stop refresh when backgrounded
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
        // Top-up demo data for any days missed while app was closed
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (s?.user?.email) DemoSeedService.seedIfNeeded(s.user.email).catch((e) => logger.warn('[AuthContext] Demo seed failed:', e));
        });
      } else {
        // Halt refresh to save energy for the user
        supabase.auth.stopAutoRefresh();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Tactile confirmation of closing the session
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { /* haptic not critical */ });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear sensitive cached data from Zustand stores
      useDreamMapStore.getState().clearCache();
      useResonanceStore.getState().clearCache();
      useSceneStore.getState().clearScene();
      useCircadianStore.getState().clearCache();
      useCorrelationStore.getState().clearCache();
      useCheckInStore.getState().resetStatus();

      // Clear unsynced queue before another account can sign in on this device.
      try {
        await localDb.clearSyncQueue();
      } catch (e) {
        logger.error('[AuthContext] Failed to clear sync queue during sign-out:', e);
      }

      if (isMounted.current) {
        setSession(null);
      }
      
      logger.info('[AuthContext] User successfully signed out');
    } catch (err) {
      logger.error('[AuthContext] Sign-out failed:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { /* haptic not critical */ });
    }
  }, []);

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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
