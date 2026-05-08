import { supabase } from '../../lib/supabase';

function getStringErrorFromPayload(payload: unknown): string | null {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const value = (payload as { error: unknown }).error;
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  if (payload && typeof payload === 'object' && 'message' in payload) {
    const value = (payload as { message: unknown }).message;
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return null;
}

async function getErrorMessage(error: unknown, data: unknown, fallback: string): Promise<string> {
  const dataMessage = getStringErrorFromPayload(data);
  if (dataMessage) return dataMessage;

  const context = error && typeof error === 'object' && 'context' in error
    ? (error as { context?: unknown }).context
    : null;

  const responseLike = context && typeof context === 'object'
    ? context as { clone?: () => unknown; json?: () => Promise<unknown>; text?: () => Promise<string> }
    : null;

  if (responseLike) {
    try {
      const reader = typeof responseLike.clone === 'function'
        ? responseLike.clone()
        : responseLike;
      const body = reader && typeof reader === 'object' && 'json' in reader
        ? await (reader as { json: () => Promise<unknown> }).json()
        : null;
      const bodyMessage = getStringErrorFromPayload(body);
      if (bodyMessage) return bodyMessage;
    } catch {
      // Fall through to message/fallback handling.
    }
  }

  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    const message = (error as { message: string }).message.trim();
    if (
      message &&
      !message.includes('non-2xx status code') &&
      message !== 'FunctionsHttpError'
    ) {
      return message;
    }
  }

  return fallback;
}

export async function requestPasswordRecoveryCode(email: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('password-recovery', {
    body: {
      action: 'request',
      email: email.trim().toLowerCase(),
    },
  });

  const dataError = getStringErrorFromPayload(data);
  if (error || dataError) {
    throw new Error(await getErrorMessage(error, data, 'Password recovery is temporarily unavailable.'));
  }
}

export async function completePasswordRecovery(params: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke('password-recovery', {
    body: {
      action: 'verify',
      email: params.email.trim().toLowerCase(),
      code: params.code.trim(),
      newPassword: params.newPassword,
    },
  });

  const dataError = getStringErrorFromPayload(data);
  if (error || dataError) {
    throw new Error(await getErrorMessage(error, data, 'Could not reset password right now.'));
  }
}
