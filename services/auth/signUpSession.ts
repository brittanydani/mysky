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

  try {
    const signInResult = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInResult?.error) {
      return {
        session: null,
        user: data.user ?? null,
        requiresEmailConfirmation: true,
      };
    }

    const session = signInResult?.data?.session ?? null;
    return {
      session,
      user: signInResult?.data?.user ?? session?.user ?? data.user ?? null,
      requiresEmailConfirmation: !session?.access_token,
    };
  } catch {
    return {
      session: null,
      user: data.user ?? null,
      requiresEmailConfirmation: true,
    };
  }
}