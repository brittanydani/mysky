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

export class ConfigValidator {
  private static readonly REQUIRED_VARS = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ];

  private static readonly OPTIONAL_VARS = [
    'EXPO_PUBLIC_SENTRY_DSN',
    'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
    'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY',
  ];

  static validateStartup(): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const key of ConfigValidator.REQUIRED_VARS) {
      const value = process.env[key];

      if (!value) {
        errors.push(`Missing required environment variable: ${key}`);
        continue;
      }

      if (key === 'EXPO_PUBLIC_SUPABASE_URL' && !isValidUrl(value)) {
        errors.push(`${key} is not a valid URL: ${redact(value)}`);
      }

      if (key === 'EXPO_PUBLIC_SUPABASE_ANON_KEY' && !value.startsWith('eyJ')) {
        errors.push(`${key} does not look like a Supabase anon JWT: ${redact(value)}`);
      }
    }

    for (const key of ConfigValidator.OPTIONAL_VARS) {
      const value = process.env[key];

      if (!value) {
        warnings.push(`Optional environment variable is not set: ${key}`);
        continue;
      }

      if (key === 'EXPO_PUBLIC_SENTRY_DSN' && !isValidUrl(value)) {
        warnings.push(`${key} is set but does not look like a valid URL: ${redact(value)}`);
      }

      if (key === 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY' && Platform.OS === 'ios' && !value.startsWith('appl_')) {
        warnings.push(`${key} is set but does not start with appl_: ${redact(value)}`);
      }

      if (key === 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY' && Platform.OS === 'android' && !value.startsWith('goog_')) {
        warnings.push(`${key} is set but does not start with goog_: ${redact(value)}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
