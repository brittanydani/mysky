/**
 * Validates required runtime configuration at startup.
 * Keeps production from failing silently when required env vars are missing or malformed.
 */

import { Platform } from 'react-native';

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const isValidUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const redact = (value: string): string => {
  if (!value) return '';
  if (value.length <= 10) return '[set]';
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

type RequiredEnvKey =
  | 'EXPO_PUBLIC_SUPABASE_URL'
  | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  | 'EXPO_PUBLIC_SENTRY_DSN';

type OptionalEnvKey =
  | 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY'
  | 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY'
  | 'EXPO_PUBLIC_REVENUECAT_ALLOW_DEV_BUNDLE'
  | 'EXPO_PUBLIC_ASTROLOGY_CALCULATION_URL';

type EnvKey = RequiredEnvKey | OptionalEnvKey;

const getPublicEnvValue = (key: EnvKey): string | undefined => {
  // Expo only inlines EXPO_PUBLIC_* values for direct dot-notation access.
  // Bracket access like process.env[key] remains undefined in native release bundles.
  switch (key) {
    case 'EXPO_PUBLIC_SUPABASE_URL':
      return process.env.EXPO_PUBLIC_SUPABASE_URL;
    case 'EXPO_PUBLIC_SUPABASE_ANON_KEY':
      return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    case 'EXPO_PUBLIC_SENTRY_DSN':
      return process.env.EXPO_PUBLIC_SENTRY_DSN;
    case 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY':
      return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
    case 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY':
      return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
    case 'EXPO_PUBLIC_REVENUECAT_ALLOW_DEV_BUNDLE':
      return process.env.EXPO_PUBLIC_REVENUECAT_ALLOW_DEV_BUNDLE;
    case 'EXPO_PUBLIC_ASTROLOGY_CALCULATION_URL':
      return process.env.EXPO_PUBLIC_ASTROLOGY_CALCULATION_URL;
  }
};

const isValidSupabasePublicKey = (value: string): boolean =>
  value.startsWith('eyJ') || value.startsWith('sb_publishable_');

export class ConfigValidator {
  private static readonly REQUIRED_VARS: RequiredEnvKey[] = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_SENTRY_DSN',
  ];

  private static readonly OPTIONAL_VARS: OptionalEnvKey[] = [
    'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
    'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY',
    'EXPO_PUBLIC_REVENUECAT_ALLOW_DEV_BUNDLE',
    'EXPO_PUBLIC_ASTROLOGY_CALCULATION_URL',
  ];

  static validateStartup(): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const key of ConfigValidator.REQUIRED_VARS) {
      const value = getPublicEnvValue(key);

      if (!value) {
        errors.push(`Missing required environment variable: ${key}`);
        continue;
      }

      if (key === 'EXPO_PUBLIC_SUPABASE_URL' && !isValidUrl(value)) {
        errors.push(`${key} is not a valid URL: ${redact(value)}`);
      }

      if (key === 'EXPO_PUBLIC_SUPABASE_ANON_KEY' && !isValidSupabasePublicKey(value)) {
        errors.push(`${key} does not look like a Supabase public key: ${redact(value)}`);
      }

      if (key === 'EXPO_PUBLIC_SENTRY_DSN' && !isValidUrl(value)) {
        errors.push(`${key} is not a valid URL: ${redact(value)}`);
      }
    }

    for (const key of ConfigValidator.OPTIONAL_VARS) {
      const value = getPublicEnvValue(key);

      if (!value) {
        if (key === 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY' && Platform.OS === 'ios') {
          warnings.push(`Optional environment variable is not set: ${key}`);
        }
        if (key === 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY' && Platform.OS === 'android') {
          warnings.push(`Optional environment variable is not set: ${key}`);
        }
        continue;
      }

      if (key === 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY' && Platform.OS === 'ios' && !value.startsWith('appl_')) {
        warnings.push(`${key} is set but does not start with appl_: ${redact(value)}`);
      }

      if (key === 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY' && Platform.OS === 'android' && !value.startsWith('goog_')) {
        warnings.push(`${key} is set but does not start with goog_: ${redact(value)}`);
      }

      if (key === 'EXPO_PUBLIC_ASTROLOGY_CALCULATION_URL' && !isValidUrl(value)) {
        warnings.push(`${key} is set but is not a valid URL: ${redact(value)}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
