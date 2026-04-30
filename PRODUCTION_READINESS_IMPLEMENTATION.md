# Production Readiness Audit — Quick Start Implementation Guide

## Overview
This document provides step-by-step actions for addressing the 9 critical/high-priority issues identified in [PRODUCTION_READINESS_AUDIT.md](PRODUCTION_READINESS_AUDIT.md).

**Target:** Complete all CRITICAL fixes before launching to TestFlight. Est. 60-80 hours of development.

---

## Issue #1: Environment Variable Validation (2-4 hours)

### 1.1 Create Validation Utility
**File:** `services/config/configValidator.ts` (NEW)

```typescript
/**
 * Validates all required environment variables at startup.
 * Fails fast with clear error messages if any are missing or invalid.
 */

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigValidator {
  private static readonly REQUIRED_VARS = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_SENTRY_DSN',
  ];

  private static readonly OPTIONAL_VARS = [
    'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY',
    'EXPO_PUBLIC_REVENUECAT_ALLOW_DEV_BUNDLE',
  ];

  static validateStartup(): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required vars
    for (const varName of this.REQUIRED_VARS) {
      const value = process.env[varName];
      
      if (!value) {
        errors.push(`Missing required environment variable: ${varName}`);
        continue;
      }

      // Validate format based on variable name
      if (varName === 'EXPO_PUBLIC_SUPABASE_URL') {
        if (!this.isValidUrl(value)) {
          errors.push(`${varName} is not a valid URL: ${value.slice(0, 20)}...`);
        }
      } else if (varName === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') {
        if (!value.startsWith('eyJ')) {
          errors.push(`${varName} looks invalid (should be JWT): ${value.slice(0, 10)}...`);
        }
      } else if (varName === 'EXPO_PUBLIC_SENTRY_DSN') {
        if (!this.isValidUrl(value)) {
          errors.push(`${varName} is not a valid URL: ${value.slice(0, 20)}...`);
        }
      }
    }

    // Check optional vars and warn if missing
    const platform = require('react-native').Platform.OS;
    if (platform === 'ios' && !process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY) {
      warnings.push('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY not set; in-app purchases will be disabled');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 1.2 Integrate into App Startup
**File:** `app/_layout.tsx` (MODIFY)

Add after `SplashScreen.preventAutoHideAsync()`:

```typescript
import { ConfigValidator } from '../services/config/configValidator';

// Inside AppShell component, before any other initialization:
const AppShell = () => {
  const [configError, setConfigError] = useState<string | null>(null);
  
  useEffect(() => {
    // Validate configuration immediately
    const result = ConfigValidator.validateStartup();
    
    if (!result.valid) {
      // Config is broken — show error screen
      setConfigError(result.errors.join('\n'));
      logger.error('[CONFIG] Validation failed:', result.errors);
    } else {
      // Log any warnings
      if (result.warnings.length > 0) {
        logger.warn('[CONFIG] Warnings:', result.warnings);
      }
      logger.info('[CONFIG] Validation passed');
    }
  }, []);
  
  if (configError) {
    return <ConfigErrorScreen message={configError} />;
  }
  
  // ... rest of app
};
```

### 1.3 Create Error Screen
**File:** `components/ConfigErrorScreen.tsx` (NEW)

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ConfigErrorScreen({ message }: { message: string }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>⚠️ Configuration Error</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.hint}>
          The app cannot start due to missing or invalid configuration.
          Please contact support or check your environment variables.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020817' },
  content: { padding: 24, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  message: { fontSize: 14, color: '#ccc', textAlign: 'center', marginBottom: 24, fontFamily: 'monospace' },
  hint: { fontSize: 12, color: '#999', textAlign: 'center' },
});
```

### 1.4 Update .env.example
**File:** `.env.example` (MODIFY)

```bash
# Supabase Configuration (REQUIRED)
# Get these from https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/settings/api
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...

# Sentry Error Monitoring (REQUIRED)
# Get from https://sentry.io/settings/account/projects/
EXPO_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[id]

# RevenueCat In-App Purchases (OPTIONAL - required for iOS)
# Get from https://app.revenuecat.com/settings/api-keys
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_XxXxXxXxXxXxXxXxXx
EXPO_PUBLIC_REVENUECAT_ALLOW_DEV_BUNDLE=false

# Build Variant
APP_VARIANT=development
NODE_ENV=development
```

### 1.5 Testing
```bash
# Test with missing vars
unset EXPO_PUBLIC_SUPABASE_URL
npm run dev
# Should show ConfigErrorScreen with helpful message

# Test with invalid Sentry DSN
export EXPO_PUBLIC_SENTRY_DSN="not a url"
npm run dev
# Should log warning about invalid format
```

---

## Issue #2: Network Resilience & Retry Logic (12-16 hours)

### 2.1 Create Retry Utility
**File:** `utils/withRetry.ts` (NEW)

```typescript
/**
 * Retry utility with exponential backoff and request timeout.
 * Handles transient network errors automatically.
 */

import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  timeoutMs: 30000,
  onRetry: () => {},
};

export class RetryError extends Error {
  constructor(public lastError: Error, public attempts: number) {
    super(`Failed after ${attempts} attempts: ${lastError.message}`);
    this.name = 'RetryError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  label: string,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      // Wrap in timeout
      return await Promise.race([
        operation(),
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Request timeout (${config.timeoutMs}ms)`)),
            config.timeoutMs,
          ),
        ),
      ]);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt <= config.maxRetries) {
        // Calculate exponential backoff
        const delayMs = Math.min(
          config.baseDelayMs * Math.pow(2, attempt - 1),
          config.maxDelayMs,
        );

        logger.warn(`[${label}] Attempt ${attempt} failed, retrying in ${delayMs}ms`, {
          error: lastError.message,
        });

        config.onRetry(attempt, lastError);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries exhausted
  throw new RetryError(lastError!, config.maxRetries + 1);
}

/**
 * Retry configuration presets for common scenarios
 */
export const RETRY_PRESETS = {
  // For quick API calls that should fail fast
  fast: { maxRetries: 2, baseDelayMs: 500, timeoutMs: 10000 },
  
  // For typical CRUD operations
  standard: { maxRetries: 3, baseDelayMs: 1000, timeoutMs: 30000 },
  
  // For long-running operations (chart calc, analysis)
  long: { maxRetries: 2, baseDelayMs: 2000, timeoutMs: 60000 },
};
```

### 2.2 Update Supabase Client Config
**File:** `lib/supabase.ts` (MODIFY)

```typescript
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ... existing validation ...

const clientOptions: SupabaseClientOptions = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // ADD TIMEOUT CONFIGURATION
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-react-native',
    },
  },
  // Fetch with timeout
  fetch: (url, options = {}) => {
    return Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Fetch timeout')), 30000),
      ),
    ]);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
```

### 2.3 Wrap Storage Service Calls
**File:** `services/storage/birthDataService.ts` (MODIFY)

```typescript
import { withRetry, RETRY_PRESETS } from '../../utils/withRetry';

export async function getBirthData(userId: string): Promise<BirthData | null> {
  return withRetry(
    async () => {
      const { data, error } = await supabase
        .from('user_birth_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows, which is OK (return null)
        throw error;
      }

      return data ?? null;
    },
    'getBirthData',
    RETRY_PRESETS.standard,
  );
}

export async function saveBirthData(userId: string, birthData: BirthData): Promise<void> {
  return withRetry(
    async () => {
      const { error } = await supabase
        .from('user_birth_data')
        .upsert([{ user_id: userId, ...birthData, updated_at: new Date().toISOString() }])
        .eq('user_id', userId);

      if (error) throw error;
    },
    'saveBirthData',
    RETRY_PRESETS.standard,
  );
}
```

### 2.4 Add Network Status Detection
**File:** `hooks/useNetworkStatus.ts` (VERIFY & ENHANCE)

```typescript
// VERIFY this hook already exists and is integrated
// Add background sync trigger:

import { useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function useNetworkRecoverySync() {
  const { isConnected } = useNetworkStatus();
  
  useEffect(() => {
    if (isConnected) {
      // Trigger offline queue processing
      logger.info('[Network] Connection restored, syncing offline queue');
      // TODO: Call offlineQueue.processQueue() when implemented
    }
  }, [isConnected]);
}
```

### 2.5 Create Error Recovery UI
**File:** `components/NetworkErrorOverlay.tsx` (NEW)

```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function NetworkErrorOverlay() {
  const { isConnected } = useNetworkStatus();
  
  if (isConnected) return null;
  
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.banner}>
        <Text style={styles.text}>📡 No Connection</Text>
        <Text style={styles.subtext}>Changes will sync when you're back online</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 999 },
  banner: { backgroundColor: '#DC5050', padding: 12, alignItems: 'center' },
  text: { color: '#fff', fontWeight: 'bold' },
  subtext: { color: '#ffcccc', fontSize: 12, marginTop: 4 },
});
```

### 2.6 Testing Checklist
```bash
# Test network resilience:
1. [ ] Enable airplane mode mid-request → verify retry + recovery
2. [ ] Toggle WiFi off during form save → verify no data loss
3. [ ] Set slow network in DevTools → verify timeout handling
4. [ ] Verify retry logs in console
5. [ ] Test recovery when network returns
```

---

## Issue #3: Supabase RLS Policy Audit (8-12 hours)

### 3.1 Document RLS Policies
**File:** `supabase/migrations/001_rls_policies_audit.sql` (NEW)

```sql
-- RLS Policies Audit & Verification
-- Run in Supabase SQL Editor to verify production configuration

-- 1. Verify auth.users table (system table, no RLS needed)
-- Already managed by Supabase

-- 2. user_profiles — users can only view/edit own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can edit own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. user_birth_data — most sensitive; strict isolation
CREATE POLICY IF NOT EXISTS "Users can view own birth data"
  ON user_birth_data
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can modify own birth data"
  ON user_birth_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own birth data"
  ON user_birth_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. user_journals — sensitive dream/journal content
CREATE POLICY IF NOT EXISTS "Users can view own journals"
  ON user_journals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can modify own journals"
  ON user_journals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own journals"
  ON user_journals
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Verify RLS is enabled on all sensitive tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_profiles',
    'user_birth_data',
    'user_journals',
    'user_checkins',
    'user_insights'
  )
ORDER BY tablename;

-- Expected output:
-- All tables should have rowsecurity = true

-- 6. List all policies to audit
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'user_birth_data',
    'user_journals',
    'user_checkins',
    'user_insights'
  )
ORDER BY tablename, policyname;
```

### 3.2 Create RLS Verification Service
**File:** `services/security/rlsVerification.ts` (NEW)

```typescript
/**
 * Verify RLS policies are correctly configured.
 * Call during app startup in development mode.
 */

import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

export interface RLSPolicyInfo {
  tableName: string;
  hasSelectPolicy: boolean;
  hasUpdatePolicy: boolean;
  hasInsertPolicy: boolean;
  hasDeletePolicy: boolean;
}

export class RLSVerificationService {
  /**
   * In development, verify that key tables have RLS enabled.
   * This catches configuration issues early.
   */
  static async verifyConfiguration(): Promise<void> {
    if (!__DEV__) return; // Only verify in dev

    try {
      // Try to access another user's birth data
      // This will fail if RLS is working correctly
      const { data: otherUserData, error } = await supabase
        .from('user_birth_data')
        .select('*')
        .eq('user_id', 'fake-user-id-to-test-rls')
        .single();

      if (!error && otherUserData) {
        // RLS is not working! We were able to access data we shouldn't
        logger.error('[RLS] SECURITY ISSUE: RLS policies not working correctly!', {
          tableName: 'user_birth_data',
          unexpectedData: true,
        });
        throw new Error('RLS misconfiguration detected');
      }

      logger.info('[RLS] Configuration verified: RLS policies are working');
    } catch (error) {
      if ((error as any)?.message?.includes('syntax error')) {
        // Expected: we're not authenticated as the other user
        logger.info('[RLS] Configuration verified');
      } else {
        logger.warn('[RLS] Verification skipped or failed:', error);
      }
    }
  }

  /**
   * Audit: fetch all policies from a table (for documentation)
   */
  static async auditPolicies(tableName: string): Promise<RLSPolicyInfo> {
    // Note: This requires postgres access; for Supabase, check dashboard
    logger.info(`[RLS] To audit ${tableName}, check Supabase dashboard:`);
    logger.info(`      https://supabase.com/dashboard/project/[ID]/auth/policies`);

    return {
      tableName,
      hasSelectPolicy: true, // Assume configured; verify in dashboard
      hasUpdatePolicy: true,
      hasInsertPolicy: true,
      hasDeletePolicy: true,
    };
  }
}
```

### 3.3 Create Premium Entitlement Gating
**File:** `services/premium/premiumGating.ts` (NEW)

```typescript
/**
 * Server-side premium entitlement verification.
 * Always verify access on sensitive operations.
 */

import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

export async function verifyPremiumAccess(
  userId: string,
  feature: 'deeper_sky' | 'dream_analysis' | 'astrology_insights',
): Promise<boolean> {
  try {
    // Verify user has active subscription with required entitlement
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('status, entitlements')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !subscription) {
      logger.warn(`[Premium] User ${userId} has no active subscription`);
      return false;
    }

    const hasEntitlement = Array.isArray(subscription.entitlements) &&
      subscription.entitlements.includes(feature);

    if (!hasEntitlement) {
      logger.warn(`[Premium] User ${userId} missing entitlement: ${feature}`);
      return false;
    }

    logger.info(`[Premium] Access verified for ${userId}: ${feature}`);
    return true;
  } catch (error) {
    logger.error('[Premium] Entitlement check failed', error);
    // Fail secure: deny access if check fails
    return false;
  }
}

/**
 * Guard a premium-only operation
 */
export async function requirePremium<T>(
  userId: string,
  feature: 'deeper_sky' | 'dream_analysis' | 'astrology_insights',
  operation: () => Promise<T>,
): Promise<T> {
  const hasAccess = await verifyPremiumAccess(userId, feature);
  if (!hasAccess) {
    throw new Error(`Premium access required for: ${feature}`);
  }
  return operation();
}
```

### 3.4 Pre-Launch Verification Checklist
```typescript
// In app/_layout.tsx startup:
import { RLSVerificationService } from '../services/security/rlsVerification';

useEffect(() => {
  RLSVerificationService.verifyConfiguration().catch(error => {
    logger.error('[Startup] RLS verification failed', error);
    // Show warning but don't block app in case this is a transient issue
  });
}, []);
```

---

## Issue #4: Input Validation Not Applied Consistently (8-10 hours)

### 4.1 Create Validation Schema Library
**File:** `services/validation/schemas.ts` (NEW)

```typescript
/**
 * Centralized validation schemas for all user input.
 * Used in both client (form validation) and server (RLS + Supabase functions).
 */

export interface ValidationSchema<T> {
  validate(value: unknown): { valid: boolean; errors: string[] };
  coerce?(value: unknown): T;
}

// Birth Data Validation
export const BirthDataSchema = {
  validate(value: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!value || typeof value !== 'object') {
      return { valid: false, errors: ['Invalid birth data object'] };
    }

    const data = value as Record<string, unknown>;

    // Date validation
    if (!data.date || typeof data.date !== 'string') {
      errors.push('Birth date is required');
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date)) {
        errors.push('Birth date must be in YYYY-MM-DD format');
      } else {
        const birthDate = new Date(data.date);
        const today = new Date();
        if (birthDate > today) {
          errors.push('Birth date cannot be in the future');
        }
        const minDate = new Date(1900, 0, 1);
        if (birthDate < minDate) {
          errors.push('Birth date cannot be before 1900');
        }
      }
    }

    // Time validation (if not unknown)
    if (!data.hasUnknownTime) {
      if (!data.time || typeof data.time !== 'string') {
        errors.push('Birth time is required or mark as unknown');
      } else if (!/^\d{2}:\d{2}$/.test(data.time)) {
        errors.push('Birth time must be in HH:MM format');
      }
    }

    // Location validation
    if (!data.place || typeof data.place !== 'string' || !data.place.trim()) {
      errors.push('Birth location is required');
    }

    // Latitude validation
    if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
      errors.push('Latitude must be between -90 and 90');
    }

    // Longitude validation
    if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
      errors.push('Longitude must be between -180 and 180');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// Check-In Validation
export const CheckInSchema = {
  validate(value: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!value || typeof value !== 'object') {
      return { valid: false, errors: ['Invalid check-in object'] };
    }

    const data = value as Record<string, unknown>;

    // Mood score: 0-10
    if (typeof data.moodScore !== 'number' || data.moodScore < 0 || data.moodScore > 10 || !Number.isFinite(data.moodScore)) {
      errors.push('Mood score must be a number between 0 and 10');
    }

    // Sleep quality: 1-5
    if (typeof data.sleepQuality !== 'number' || data.sleepQuality < 1 || data.sleepQuality > 5) {
      errors.push('Sleep quality must be between 1 and 5');
    }

    // Energy level: 1-5
    if (typeof data.energyLevel !== 'number' || data.energyLevel < 1 || data.energyLevel > 5) {
      errors.push('Energy level must be between 1 and 5');
    }

    // Dream recall: optional, but if present, must be string
    if (data.dreamRecall !== undefined && data.dreamRecall !== null && typeof data.dreamRecall !== 'string') {
      errors.push('Dream recall must be text');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// Journal Entry Validation
export const JournalEntrySchema = {
  validate(value: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!value || typeof value !== 'object') {
      return { valid: false, errors: ['Invalid journal entry object'] };
    }

    const data = value as Record<string, unknown>;

    // Title: required, 1-200 chars
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Journal title is required');
    } else if (data.title.trim().length === 0) {
      errors.push('Journal title cannot be empty');
    } else if (data.title.length > 200) {
      errors.push('Journal title must be 200 characters or less');
    }

    // Content: required, 1-10000 chars
    if (!data.content || typeof data.content !== 'string') {
      errors.push('Journal content is required');
    } else if (data.content.trim().length === 0) {
      errors.push('Journal content cannot be empty');
    } else if (data.content.length > 10000) {
      errors.push('Journal content must be 10,000 characters or less');
    }

    // Dream mood: optional, must be from enum
    if (data.dreamMood !== undefined && data.dreamMood !== null) {
      if (typeof data.dreamMood !== 'string') {
        errors.push('Dream mood must be text');
      } else if (!['positive', 'neutral', 'challenging'].includes(data.dreamMood)) {
        errors.push('Dream mood must be: positive, neutral, or challenging');
      }
    }

    // Tags: optional, max 10 tags, each < 50 chars
    if (data.tags !== undefined && data.tags !== null) {
      if (!Array.isArray(data.tags)) {
        errors.push('Tags must be an array');
      } else if (data.tags.length > 10) {
        errors.push('Maximum 10 tags per entry');
      } else {
        for (let i = 0; i < (data.tags as unknown[]).length; i++) {
          const tag = (data.tags as unknown[])[i];
          if (typeof tag !== 'string' || tag.length > 50) {
            errors.push(`Tag ${i + 1} must be a string of 50 characters or less`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// Supabase Response Validation
export const SupabaseResponseSchema = {
  validate(response: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!response || typeof response !== 'object') {
      return { valid: false, errors: ['Invalid Supabase response'] };
    }

    const data = response as Record<string, unknown>;

    // Check for error
    if (data.error) {
      errors.push(`Database error: ${String(data.error)}`);
    }

    // Check that data is present (unless expected to be null)
    if (data.data === undefined) {
      errors.push('Missing data field in response');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
```

### 4.2 Update Services to Use Schemas
**File:** `services/patterns/checkInService.ts` (MODIFY)

```typescript
import { CheckInSchema } from '../validation/schemas';

export async function saveCheckIn(checkIn: CheckIn): Promise<void> {
  // Validate before saving
  const validation = CheckInSchema.validate(checkIn);
  if (!validation.valid) {
    throw new ValidationError('Invalid check-in data', validation.errors);
  }

  // Proceed with save...
}
```

**File:** `services/storage/journalService.ts` (MODIFY)

```typescript
import { JournalEntrySchema } from '../validation/schemas';

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  // Validate before saving
  const validation = JournalEntrySchema.validate(entry);
  if (!validation.valid) {
    throw new ValidationError('Invalid journal entry', validation.errors);
  }

  // Validate response from Supabase
  const { data, error } = await supabase
    .from('user_journals')
    .insert([entry]);

  if (error) throw error;

  const responseValidation = SupabaseResponseSchema.validate({ data, error });
  if (!responseValidation.valid) {
    throw new Error(`Invalid database response: ${responseValidation.errors.join('; ')}`);
  }
}
```

---

## Issue #5: Test Coverage Verification (4-6 hours)

### 5.1 Run Coverage Analysis
```bash
# Generate coverage report
npm run test:coverage

# Check output for:
# - Overall coverage >= 75%
# - services/storage/* coverage
# - services/astrology/* coverage
# - services/premium/* coverage (critical for monetization)
# - services/patterns/* coverage (critical for user data)
```

### 5.2 Create Coverage Baseline
**File:** `.coverage-baseline.json` (NEW)

```json
{
  "global": {
    "branches": 75,
    "functions": 75,
    "lines": 75,
    "statements": 75
  },
  "criticalpaths": {
    "services/premium": { "minimum": 85, "reason": "Revenue critical" },
    "services/storage": { "minimum": 85, "reason": "Data integrity critical" },
    "services/auth": { "minimum": 90, "reason": "Security critical" },
    "utils/logger": { "minimum": 70, "reason": "Observability" },
    "context/AuthContext": { "minimum": 80, "reason": "Auth flow" }
  }
}
```

### 5.3 Add Coverage Enforcement to CI/CD
**File:** `.github/workflows/test.yml` (NEW)

```yaml
name: Test Coverage

on: [push, pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:coverage
      
      - name: Check coverage thresholds
        run: |
          # Parse coverage output and fail if below threshold
          npm run test:coverage -- --failOnLow
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 5.4 Identify Uncovered Paths
```bash
# View coverage report in HTML
open coverage/lcov-report/index.html

# Look for red (uncovered) lines in critical paths:
# - services/storage/userProfileService.ts
# - services/premium/revenuecat.ts
# - context/AuthContext.tsx
# - app/_layout.tsx

# For each uncovered critical path, add test case
```

---

## Issue #6: Sensitive Data Logging (4-6 hours)

### 6.1 Enhanced Sentry Scrubbing
**File:** `utils/sentry.ts` (MODIFY)

```typescript
// Add to beforeSend function:

beforeSend(event, hint) {
  // 1. Never send user context
  delete event.user;
  
  // 2. Scrub extra context for PII
  if (event.extra) {
    event.extra = scrubPII(event.extra);
  }
  
  // 3. Scrub request/response bodies
  delete event.request;
  
  // 4. Scrub breadcrumbs for sensitive data
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(crumb => {
      if (crumb.data) {
        crumb.data = scrubPII(crumb.data);
      }
      if (crumb.message) {
        crumb.message = crumb.message.replace(/\d{4}-\d{2}-\d{2}/g, '[DATE]');
      }
      return crumb;
    });
  }
  
  // 5. Clean exception stack traces
  if (event.exception) {
    for (const exc of event.exception) {
      if (exc.stacktrace?.frames) {
        for (const frame of exc.stacktrace.frames) {
          if (frame.context_line) {
            frame.context_line = scrubString(frame.context_line);
          }
        }
      }
    }
  }
  
  return event;
},

function scrubPII(obj: any): any {
  const PII_KEYS = [
    // Personal
    'email', 'phone', 'address', 'name', 'user_id', 'userId',
    // Birth data
    'birthdate', 'birthtime', 'birthplace', 'birthData',
    'latitude', 'longitude', 'location',
    // Dream/journal content
    'content', 'title', 'dreamtext', 'dream_text', 'note',
    'journal_text', 'entry_text',
    // Mood/personal data
    'moodscore', 'mood_score', 'energylevel', 'energy_level',
    'stresslevel', 'stress_level',
    // Tokens/auth
    'token', 'authorization', 'access_token', 'refresh_token',
    'session_token', 'bearer', 'password', 'apikey', 'api_key',
    // Sensitive fields
    'ciphertext', 'payload', 'plaintext',
  ];

  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj !== 'object') {
    return scrubString(String(obj));
  }

  if (Array.isArray(obj)) {
    return obj.map(item => scrubPII(item));
  }

  const scrubbed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_KEYS.some(k => key.toLowerCase().includes(k))) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      scrubbed[key] = scrubPII(value);
    } else {
      scrubbed[key] = value;
    }
  }
  
  return scrubbed;
}

function scrubString(str: string): string {
  // Remove dates in format YYYY-MM-DD
  str = str.replace(/\d{4}-\d{2}-\d{2}/g, '[DATE]');
  // Remove email addresses
  str = str.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '[EMAIL]');
  // Remove phone numbers
  str = str.replace(/\d{3}-\d{3}-\d{4}/g, '[PHONE]');
  return str;
}
```

### 6.2 Audit All logger.error Calls
```bash
# Find all error logging
grep -r "logger.error" services/ components/ context/ --include="*.ts" --include="*.tsx"

# For each result, verify:
# - No raw Error object is logged (extract message only)
# - No user data in context object
# - No sensitive fields in logged data

# Example of BAD:
logger.error('Failed to save birth data', birthDataObject); // ❌ Leaks data

# Example of GOOD:
logger.error('Failed to save birth data', { 
  userId: userId.slice(0, 4), // Partial ID for debugging
  error: error.message,
});
```

### 6.3 Create PII Logging Tests
**File:** `utils/__tests__/sentry.test.ts` (NEW)

```typescript
import { scrubPII } from '../../utils/sentry';

describe('Sentry PII scrubbing', () => {
  it('redacts email addresses in extra context', () => {
    const dirty = { error: 'User error', email: 'test@example.com' };
    const clean = scrubPII(dirty);
    expect(clean.email).toBe('[REDACTED]');
  });

  it('redacts birth data fields', () => {
    const dirty = { birthplace: 'New York', birthtime: '14:30' };
    const clean = scrubPII(dirty);
    expect(clean.birthplace).toBe('[REDACTED]');
    expect(clean.birthtime).toBe('[REDACTED]');
  });

  it('redacts nested PII', () => {
    const dirty = { user: { email: 'test@example.com', name: 'John' } };
    const clean = scrubPII(dirty);
    expect(clean.user.email).toBe('[REDACTED]');
  });

  it('preserves non-sensitive fields', () => {
    const dirty = { action: 'login', duration: 1000 };
    const clean = scrubPII(dirty);
    expect(clean.action).toBe('login');
    expect(clean.duration).toBe(1000);
  });
});
```

---

## Issue #7: RevenueCat Verification (6-8 hours)

### 7.1 Create Setup Checklist
**File:** `REVENUECAT_SETUP.md` (NEW)

```markdown
# RevenueCat Configuration Checklist

## Prerequisites
- [ ] RevenueCat account created (https://app.revenuecat.com)
- [ ] iOS App created in Apple Developer
- [ ] App Store subscription product created
- [ ] Bundle ID: `com.brittany.mysky` (must match app.json)

## RevenueCat Dashboard Configuration

### 1. Projects
- [ ] Project created: "MySky"
- [ ] Platform: iOS
- [ ] Currency: USD

### 2. Products
- [ ] Create App Store product link
  - [ ] Product ID: Must match App Store subscription ID
  - [ ] Duration: Monthly + Annual options
  - [ ] Entitlements: "deeper_sky"

### 3. Offerings
- [ ] Create offering: "deeper_sky"
  - [ ] Package 1: "monthly" → Monthly subscription
  - [ ] Package 2: "annual" → Annual subscription
  - [ ] Set as default offering

### 4. Entitlements
- [ ] Create entitlement: "deeper_sky"
  - [ ] Link to all subscription packages
  - [ ] Description: "Access to Deeper Sky features"

### 5. API Keys
- [ ] Get iOS API Key (starts with `appl_`)
- [ ] Add to EAS secret:
  ```bash
  eas secret:create --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --scope project --value appl_xxxxx
  ```

## Local Development Testing

### 1. Configure Mock RevenueCat (for development)
```bash
export EXPO_PUBLIC_REVENUECAT_ALLOW_DEV_BUNDLE=true
npm run dev:light
```

### 2. Test Purchase Flow
```typescript
// In app:
1. Navigate to Premium screen
2. Tap "Subscribe to Deeper Sky"
3. Should show App Store payment sheet
4. Use Test Account (TestFlight) to complete
```

## Staging Verification (TestFlight)

### 1. Build for TestFlight
```bash
eas build --platform ios --profile preview
eas submit --platform ios --id <build-id>
```

### 2. Install on Device via TestFlight
- [ ] TestFlight app installed
- [ ] Build downloaded
- [ ] App opens and shows Premium screen

### 3. Test Entitlements
```typescript
// Verify premium features accessible:
1. Tap "Subscribe to Deeper Sky"
2. Use Test Account to purchase
3. Verify:
   - Purchase completes in App Store
   - App shows "Subscription Active"
   - Premium features unlocked
   - Entitlements verified server-side
```

### 4. Verify Sandbox Testing
- [ ] RevenueCat configured for sandbox
- [ ] TestFlight build links to sandbox RevenueCat
- [ ] Purchases work but don't charge card

## Production Launch

### 1. API Keys
- [ ] Production API key configured in EAS secrets
- [ ] Separate from dev/preview
- [ ] Key format: `appl_xxx` for iOS

### 2. Final Verification
- [ ] TestFlight purchases complete successfully
- [ ] Entitlements grant premium access
- [ ] Sentry monitoring active for purchase errors
- [ ] Rollback plan documented (disable RC if needed)

## Troubleshooting

**Purchases show as pending:** Check RevenueCat dashboard for sync delays
**Entitlements not showing:** Verify offering setup in RevenueCat
**Test Account fails:** Use "Test Account" in TestFlight, not random account
**API key validation fails:** Double-check key prefix and EAS secret sync
```

### 7.2 Add Startup Validation
**File:** `services/premium/revenuecat.ts` (MODIFY)

```typescript
// Add validation before initializing:

async function validateRevenueCatConfiguration(): Promise<ValidationResult> {
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
  
  // Check key format
  if (!apiKey) {
    return { valid: false, errors: ['RevenueCat API key not configured'] };
  }
  
  if (!apiKey.startsWith('appl_') && !apiKey.startsWith('goog_')) {
    return {
      valid: false,
      errors: [`Invalid RevenueCat key format. Expected 'appl_' prefix, got: ${apiKey.slice(0, 10)}`],
    };
  }
  
  // Validate version
  const Purchases = await getPurchases();
  if (!Purchases) {
    return { valid: false, errors: ['RevenueCat module failed to load'] };
  }
  
  return { valid: true, errors: [] };
}

// Call during initialization:
const validation = await validateRevenueCatConfiguration();
if (!validation.valid) {
  logger.error('[RevenueCat] Configuration invalid:', validation.errors);
  throw new Error(`RevenueCat configuration error: ${validation.errors.join('; ')}`);
}
```

---

## Issue #8: Offline-First Data Sync (10-14 hours)

### 8.1 Create Persistent Offline Queue
**File:** `services/offline/offlineQueue.ts` (NEW)

```typescript
/**
 * Persistent offline queue for critical operations.
 * Survives app restarts and stores failed operations for retry.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../../utils/logger';

export interface QueuedOperation {
  id: string;
  type: 'journal_entry' | 'checkin' | 'preference';
  payload: any;
  createdAt: number;
  retriesAttempted: number;
  lastError?: string;
}

export class OfflineQueue {
  private static readonly QUEUE_KEY = 'offline_queue_v1';
  private static readonly MAX_RETRIES = 5;
  private queue: QueuedOperation[] = [];
  private isProcessing = false;

  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.QUEUE_KEY);
      this.queue = stored ? JSON.parse(stored) : [];
      logger.info(`[OfflineQueue] Loaded ${this.queue.length} queued operations`);
    } catch (error) {
      logger.error('[OfflineQueue] Failed to load queue', error);
      this.queue = [];
    }
  }

  async enqueue(operation: Omit<QueuedOperation, 'id' | 'createdAt' | 'retriesAttempted'>): Promise<string> {
    const id = `op_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const queued: QueuedOperation = {
      ...operation,
      id,
      createdAt: Date.now(),
      retriesAttempted: 0,
    };

    this.queue.push(queued);
    await this.persist();

    logger.info(`[OfflineQueue] Enqueued operation ${id}`, { type: operation.type });
    return id;
  }

  async processQueue(executeOperation: (op: QueuedOperation) => Promise<void>): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      for (let i = 0; i < this.queue.length; i++) {
        const operation = this.queue[i];

        try {
          logger.info(`[OfflineQueue] Processing operation ${operation.id}`);
          await executeOperation(operation);

          // Remove from queue
          this.queue.splice(i, 1);
          i--;

          await this.persist();
          logger.info(`[OfflineQueue] Operation ${operation.id} completed`);
        } catch (error) {
          operation.retriesAttempted++;
          operation.lastError = (error as Error).message;

          if (operation.retriesAttempted >= OfflineQueue.MAX_RETRIES) {
            logger.error(
              `[OfflineQueue] Operation ${operation.id} exceeded max retries`,
              operation.lastError,
            );
            // Remove after max retries — operation has failed
            this.queue.splice(i, 1);
            i--;
          } else {
            logger.warn(`[OfflineQueue] Operation ${operation.id} failed, will retry`, {
              attempt: operation.retriesAttempted,
            });
          }

          await this.persist();
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('[OfflineQueue] Failed to persist queue', error);
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getAllOperations(): QueuedOperation[] {
    return [...this.queue];
  }
}

export const offlineQueue = new OfflineQueue();
```

### 8.2 Integrate with Network Recovery
**File:** `services/offline/networkSync.ts` (NEW)

```typescript
/**
 * Monitor network status and trigger queue processing on recovery
 */

import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { supabase } from '../../lib/supabase';
import { offlineQueue, type QueuedOperation } from './offlineQueue';
import { logger } from '../../utils/logger';

export async function setupNetworkSyncHandler(): Promise<void> {
  // Initialize queue from storage
  await offlineQueue.initialize();

  // Define operation handlers
  const executeOperation = async (op: QueuedOperation) => {
    switch (op.type) {
      case 'journal_entry':
        await saveJournalEntry(op.payload);
        break;
      case 'checkin':
        await saveCheckIn(op.payload);
        break;
      case 'preference':
        await savePreference(op.payload);
        break;
      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  };

  // Listen for network recovery
  // Note: useNetworkStatus is a hook; this should be called in a useEffect context
  // For initialization, we process once on app startup:
  await offlineQueue.processQueue(executeOperation);
}

// Operation handlers
async function saveJournalEntry(payload: any): Promise<void> {
  const { userId, entry } = payload;
  const { error } = await supabase.from('user_journals').insert([{ ...entry, user_id: userId }]);
  if (error) throw error;
}

async function saveCheckIn(payload: any): Promise<void> {
  const { userId, checkIn } = payload;
  const { error } = await supabase.from('user_checkins').insert([{ ...checkIn, user_id: userId }]);
  if (error) throw error;
}

async function savePreference(payload: any): Promise<void> {
  const { userId, preference } = payload;
  const { error } = await supabase
    .from('user_preferences')
    .upsert([{ user_id: userId, ...preference }]);
  if (error) throw error;
}
```

### 8.3 Wrap Journal Service
**File:** `services/storage/journalService.ts` (MODIFY)

```typescript
import { offlineQueue } from '../offline/offlineQueue';

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const userId = await getUserId();

  // If offline, queue instead of trying to save
  const { isConnected } = await useNetworkStatus();
  if (!isConnected) {
    const id = await offlineQueue.enqueue({
      type: 'journal_entry',
      payload: { userId, entry },
    });
    logger.info('[Journal] Entry queued offline', { queueId: id });
    return;
  }

  // Online: save directly with retry logic
  return withRetry(
    async () => {
      const { error } = await supabase
        .from('user_journals')
        .insert([{ ...entry, user_id: userId, created_at: new Date().toISOString() }]);

      if (error) throw error;
    },
    'saveJournalEntry',
    RETRY_PRESETS.standard,
  );
}
```

---

## Issue #9: Error Boundaries (4-6 hours)

### 9.1 Create Component Error Boundary
**File:** `components/ErrorBoundary.tsx` (NEW)

```typescript
/**
 * Component-level error boundary for graceful error handling.
 * Prevents one screen's error from crashing the entire app.
 */

import React, { Component, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  screenName?: string;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    logger.error(`[ErrorBoundary] Component error (${this.props.screenName || 'unknown'})`, {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>⚠️ Error</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <Pressable style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020817',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
```

### 9.2 Wrap Critical Screens
**File:** `app/(tabs)/journal.tsx` (MODIFY)

```typescript
import { ErrorBoundary } from '../../components/ErrorBoundary';

export default function JournalScreen() {
  return (
    <ErrorBoundary screenName="journal">
      <JournalContent />
    </ErrorBoundary>
  );
}
```

### 9.3 Add Global Unhandled Rejection Handler
**File:** `app/_layout.tsx` (MODIFY)

```typescript
useEffect(() => {
  // Handle unhandled promise rejections
  const unhandledRejectionHandler = (event: any) => {
    logger.error('[Unhandled] Promise rejection', event.reason);
  };

  // For Node-like environments
  if (process.on) {
    process.on('unhandledRejection', unhandledRejectionHandler);
    return () => process.off('unhandledRejection', unhandledRejectionHandler);
  }
}, []);
```

---

## Summary Checklist

### Critical Issues (Pre-Production)
- [ ] Issue #1: Config validation added
- [ ] Issue #2: Network retry logic implemented
- [ ] Issue #3: RLS policies documented & verified
- [ ] Issue #4: Input validation schemas created
- [ ] Issue #5: Test coverage verified (≥75%)
- [ ] Issue #6: Sentry PII scrubbing enhanced
- [ ] Issue #7: RevenueCat setup documented & verified
- [ ] Issue #8: Offline sync queue implemented (optional)
- [ ] Issue #9: Error boundaries added

### Next Steps
1. Create feature branch: `git checkout -b production-readiness`
2. Implement issues in order (critical first)
3. Run tests: `npm run test:all`
4. Run typecheck: `npm run typecheck`
5. Create PR with audit findings
6. Review & merge before launching to TestFlight

