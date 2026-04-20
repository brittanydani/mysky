import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';

interface SignUpAndEnsureSessionParams {
  email: string;
  password: string;
}

interface SignUpAndEnsureSessionResult {
  session: Session | null;
  user: User | null;
  requiresEmailConfirmation: boolean;
}

export async function signUpAndEnsureSession({
  email,
  password,
}: SignUpAndEnsureSessionParams): Promise<SignUpAndEnsureSessionResult> {
  const normalizedEmail = email.trim();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  });
  if (error) throw error;

  const immediateSession = data.session ?? null;
  if (immediateSession?.access_token) {
    return {
      session: immediateSession,
      user: data.user ?? immediateSession.user ?? null,
      requiresEmailConfirmation: false,
    };
  }

  // Supabase sometimes needs a brief moment after sign-up before the account
  // is ready to accept a sign-in. Retry up to 3 times with increasing delays.
  const delays = [300, 800, 1500];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    await new Promise(r => setTimeout(r, delays[attempt]));
    try {
      const signInResult = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!signInResult?.error) {
        const session = signInResult?.data?.session ?? null;
        if (session?.access_token) {
          return {
            session,
            user: signInResult?.data?.user ?? session?.user ?? data.user ?? null,
            requiresEmailConfirmation: false,
          };
        }
        // No session + no error means email confirmation is genuinely required
        return {
          session: null,
          user: data.user ?? null,
          requiresEmailConfirmation: true,
        };
      }

      // If it's an email-not-confirmed error, stop retrying — confirmation is required
      const errMsg = signInResult.error?.message?.toLowerCase() ?? '';
      if (errMsg.includes('email') && errMsg.includes('confirm')) {
        return {
          session: null,
          user: data.user ?? null,
          requiresEmailConfirmation: true,
        };
      }
      // Otherwise it may be a transient error — continue retrying
    } catch {
      // Transient network error — retry
    }
  }

  return {
    session: null,
    user: data.user ?? null,
    requiresEmailConfirmation: true,
  };
}