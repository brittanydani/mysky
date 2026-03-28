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
    
    // 1. Orbital Restoration — Hydrate session from local storage
    const initializeAuth = async () => {
      try {
        const { data: { session: restored }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (isMounted.current) {
          setSession(restored);
          if (restored?.user) {
            revenueCatService.logIn(restored.user.id);
          }
        }
      } catch (err) {
        logger.error('[AuthContext] Session restoration failed:', err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
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
        revenueCatService.logIn(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        revenueCatService.logOut();
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
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      if (isMounted.current) {
        setSession(null);
      }
      
      logger.info('[AuthContext] User successfully signed out');
    } catch (err) {
      logger.error('[AuthContext] Sign-out failed:', err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
