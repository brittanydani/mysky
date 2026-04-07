import { supabase } from '../../lib/supabase';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return fallback;
}

export async function requestPasswordRecoveryCode(email: string): Promise<void> {
  const { error } = await supabase.functions.invoke('password-recovery', {
    body: {
      action: 'request',
      email: email.trim().toLowerCase(),
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error, 'Password recovery is temporarily unavailable.'));
  }
}

export async function completePasswordRecovery(params: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<void> {
  const { error } = await supabase.functions.invoke('password-recovery', {
    body: {
      action: 'verify',
      email: params.email.trim().toLowerCase(),
      code: params.code.trim(),
      newPassword: params.newPassword,
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error, 'Could not reset password right now.'));
  }
}