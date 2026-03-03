/**
 * context/AuthContext.tsx
 *
 * Provides Supabase auth state (session, user, loading) to the entire app.
 *
 * Usage in any component:
 *   const { session, user, signOut } = useAuth();
 *   const accessToken = session?.access_token;
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Current Supabase session (null if not signed in) */
  session: Session | null;
  /** Shortcut — session.user */
  user: User | null;
  /** True while the initial session is being restored from storage */
  loading: boolean;
  /** Sign out the current user */
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

  useEffect(() => {
    // 1. Restore existing session from AsyncStorage
    supabase.auth.getSession().then(({ data: { session: restored } }) => {
      setSession(restored);
      setLoading(false);
    });

    // 2. Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Auto-refresh token when app comes back to foreground
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch (err) {
      logger.error('Sign-out failed:', err);
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
  return useContext(AuthContext);
}
