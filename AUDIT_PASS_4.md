# Audit Pass 4 — Structural & Behavioral Checklist

> **Scope:** 10-item checklist covering routes, imports, cold-start safety, premium
> gating, RevenueCat error handling, encryption lifecycle, DB migrations, consent
> flows, legal-document accuracy, and debug/dev artefacts.
>
> **Methodology:** Automated subagent sweeps of every file in the workspace, plus
> targeted manual verification of flagged items. Line numbers reference the state
> of the codebase at audit time.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1     |
| HIGH     | 9     |
| MEDIUM   | 8     |
| LOW      | 5     |
| **Total findings** | **23** |

| Checklist item | Verdict |
|----------------|---------|
| 1. Orphaned routes | ✅ PASS |
| 2. Dead imports | ✅ PASS |
| 3. Cold-start errors | ⚠ MINOR ISSUES |
| 4. Premium gating | ❌ BYPASS FOUND |
| 5. RevenueCat errors | ✅ PASS |
| 6. Encryption lifecycle | ❌ CRITICAL + HIGH |
| 7. DB migrations | ⚠ HIGH |
| 8. Consent flows | ❌ HIGH (GDPR) |
| 9. Privacy/terms/faq accuracy | ❌ HIGH (3 inaccuracies) |
| 10. Debug screens shipped | ❌ HIGH |

---

## 1. Orphaned Routes

**Verdict: ✅ PASS — no orphaned routes**

- `app/(tabs)/settings/_layout.tsx` declares `index` and `calibration` screens.
- `app/(tabs)/_layout.tsx` registers `name="settings"` tab pointing at the folder.
- `app/(tabs)/home.tsx` pushes `/(tabs)/settings` (valid).
- `app/(tabs)/settings/index.tsx` pushes `/(tabs)/settings/calibration` (valid).
- Root `app/_layout.tsx` boot sequence: consent → onboarding → tabs. No dead paths.

---

## 2. Dead Imports

**Verdict: ✅ PASS — zero broken imports across 1,055 import statements**

Automated sweep confirmed every `import` / `require` resolves to an existing
module. No circular dependency between context providers.

---

## 3. Cold-Start Errors in Modals/Contexts

**Verdict: ⚠ MINOR ISSUES**

### F-3a — No init timeout (MEDIUM)

**File:** `app/_layout.tsx`
**Lines:** 39–70

`RootLayout` renders `null` while `checkingConsent || !dbReady`. If
`initializeLocalDatabase()` hangs (corrupt DB, slow device), the user sees a
blank screen forever — no timeout, no retry, no fallback UI.

**Recommendation:** Add a 10-second timeout that shows an "Unable to start —
tap to retry" screen.

### F-3b — Tab screens mounted behind consent modal (LOW-MEDIUM)

**File:** `app/_layout.tsx`

`PrivacyConsentModal` renders as a fullscreen overlay *on top of* the tab
navigator. The tab screens (and their `useEffect` hooks) are already mounted.
Effects that fire on mount (e.g., fetching moon phase data in `home.tsx`) will
run before the user has consented.

**Recommendation:** Delay mounting `<Slot />` until consent is granted, or
wrap tab effects with a `consentGranted` guard.

---

## 4. Premium Gating

**Verdict: ❌ BYPASS FOUND**

### F-4a — growth.tsx calls AI insights without premium check (HIGH)

**File:** `app/(tabs)/growth.tsx`
**Lines:** 1–50 (imports), 322–360 (useEffect)

`growth.tsx` imports `generateReflectionInsights` from
`services/premium/reflectionInsights` and `useAuth` from `context/AuthContext`,
but does **not** import `usePremium`.

The `useEffect` at line 322 guards on:
```ts
if (checkIns.length < 7 || !session?.access_token) return;
```

This checks *authentication* (Supabase JWT) but not *entitlement*. A free user
who has created a Supabase account can trigger the AI Reflection Insights call.

The Edge Function (`supabase/functions/reflection-insights/index.ts`) also has
**no server-side premium check** — it only verifies JWT and rate-limits
(5 req/hour). The bypass is end-to-end.

**Impact:** Free users can consume Anthropic API credits (billed to you).

**Fix:**
```ts
// growth.tsx — add premium guard
import { usePremium } from '@/context/PremiumContext';
// ...
const { isPremium } = usePremium();
// in the useEffect:
if (checkIns.length < 7 || !session?.access_token || !isPremium) return;
```

Also add a server-side check in the Edge Function (query RevenueCat REST API or
store entitlement status in a Supabase table).

### Premium gating — other features: ✅ PASS

All 13 premium features listed in `constants/config.ts` are correctly gated by
`isPremium` checks or `<PremiumRequiredScreen>` wrappers in their respective
tab files. `DEBUG_FORCE_PREMIUM` is gated behind `__DEV__ && false` (safe).

---

## 5. RevenueCat Error Handling

**Verdict: ✅ PASS**

**File:** `services/premium/revenuecat.ts`

All five SDK entry points (`initialize`, `getOfferings`, `purchasePackage`,
`restorePurchases`, `getCustomerInfo`) have try/catch with descriptive error
messages. User-facing errors surface as strings, not raw exceptions.

- Offline: SDK caches last-known entitlements; `getCustomerInfo` catches network
  errors and returns cached state.
- Restore purchases: Implemented and accessible from settings screen.
- Stale entitlements: `PremiumContext` uses
  `Purchases.addCustomerInfoUpdateListener()` for real-time updates; the
  `entitlements.active` map excludes expired subscriptions automatically.

---

## 6. Encryption Lifecycle

**Verdict: ❌ CRITICAL + HIGH**

### F-6a — Key rotation destroys data (CRITICAL)

**File:** `services/storage/fieldEncryption.ts`

`rotateKey()` generates a new DEK and stores it via `commitRotatedKey()`, but
there is **no `reEncryptAll()` function**. Calling these methods replaces the
DEK in SecureStore without re-encrypting any ciphertext. All previously
encrypted fields become permanently unreadable.

This is dead code today, but it is a landmine: a future developer who sees
"rotateKey" and calls it will silently destroy user data.

**Fix:** Either implement `reEncryptAll()` (decrypt every encrypted field with
old key, re-encrypt with new key, commit atomically) or **delete**
`rotateKey()` + `commitRotatedKey()` and add a comment explaining why rotation
is not yet supported.

### F-6b — HMAC is SHA256(key+data), not HMAC-SHA256 (HIGH)

**File:** `services/storage/encryptionManager.ts`

The `computeHmac()` function concatenates `key + ':' + data` and hashes with
SHA-256. This is a length-extension-vulnerable construction, not real
HMAC-SHA256. Code comments falsely document it as "HMAC-SHA256".

**Fix:** Use the standard HMAC construction from `@noble/hashes/hmac`:
```ts
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
const mac = hmac(sha256, keyBytes, dataBytes);
```

### F-6c — lat/lng stored as plaintext PII (HIGH)

**File:** `services/storage/localDb.ts` (schema)

`saved_charts.latitude`, `saved_charts.longitude`, `relationship_charts.latitude`,
`relationship_charts.longitude` are `REAL` columns — plaintext precise birth
coordinates. Combined with birth date/time (also in these tables), this is
moderate-to-high PII sensitivity.

**Fix:** Encrypt lat/lng the same way other PII fields are encrypted, or
reduce precision to city-level (1 decimal place) before storing.

### F-6d — Silent DEK regeneration on SecureStore failure (MEDIUM)

**File:** `services/storage/fieldEncryption.ts`

`getDek()` catches SecureStore errors and generates a fresh DEK. If SecureStore
is temporarily unavailable (keychain locked after iOS update, device migration),
all existing encrypted data becomes permanently unreadable with no user-visible
warning.

**Recommendation:** Show a warning and retry before generating a new key. At
minimum, log to a persistent error store.

### F-6e — Decrypt failures silently degrade (MEDIUM)

**File:** `services/storage/fieldEncryption.ts`

Failed decryption returns `'[Unable to access encrypted data on this device]'`.
Callers that expect a number (e.g., mood scores) may silently convert this to
`NaN` or `0`. App won't crash, but chart data will be wrong.

### F-6f — HMAC failure recovery bypasses integrity (MEDIUM)

**File:** `services/storage/secureStorage.ts`

When HMAC verification fails, the recovery path strips the old HMAC and
re-signs the data with the current key — silently treating tampered data as
valid.

---

## 7. DB Migrations

**Verdict: ⚠ HIGH**

### F-7a — Encryption migrations not transactional (HIGH)

**File:** `services/storage/localDb.ts` — migrations v7, v11, v14

These migrations loop over all rows, encrypt a field in each row, and write
it back. None are wrapped in a transaction. A crash mid-loop (low battery, OS
kill) leaves the table in a mixed state: some rows encrypted, some plaintext.
Re-running the migration will double-encrypt already-encrypted rows.

**Fix:** Wrap each encryption migration in `BEGIN TRANSACTION` / `COMMIT` with
a `ROLLBACK` on error. Add an `isAlreadyEncrypted()` check (e.g., test for
IV prefix) before encrypting each row.

### F-7b — Non-atomic version bump (MEDIUM)

**File:** `services/storage/localDb.ts`

`PRAGMA user_version` is set once after all migrations complete. If the app
crashes between migration 15 and migration 18, the next launch re-runs all
migrations from 15. Combined with F-7a, this risks double-encryption.

**Recommendation:** Bump `PRAGMA user_version` after each migration step, or
use a migration-tracking table.

### F-7c — No forward-compatibility guard (MEDIUM)

**File:** `services/storage/localDb.ts`

If a user downgrades the app (TestFlight → App Store), the older binary will
open a database with a higher `user_version` and silently proceed. This could
cause undefined behavior if newer migrations added columns the old code doesn't
expect.

**Recommendation:** Add a max-version check on startup:
```ts
if (currentVersion > EXPECTED_VERSION) {
  throw new Error('Database was created by a newer version of MySky');
}
```

### Column safety: ✅ PASS

All `ALTER TABLE ADD COLUMN` statements use nullable types or supply `DEFAULT`
values. No `NOT NULL` without default — safe for existing rows.

---

## 8. Consent Flows

**Verdict: ❌ HIGH (GDPR gap)**

### F-8a — `terms_consent` not deleted during GDPR erasure (HIGH)

**File:** `services/storage/secureStorage.ts` — `deleteAllUserData()`

`deleteAllUserData()` deletes 11 SecureStore keys but does **not** delete
`terms_consent`. Under GDPR Article 17, "right to be forgotten" must erase
all personal data. Consent records contain a timestamp and the fact that
a specific device-user agreed to terms — this is personal data.

**Fix:** Add `'terms_consent'` to the deletion list in `deleteAllUserData()`.

### F-8b — Consent withdrawal doesn't force-exit session (MEDIUM)

**File:** `services/privacy/privacyComplianceManager.ts`

When a user withdraws privacy consent, `requireConsent()` blocks new writes —
but the current session continues. Any data already fetched into React state
remains displayed. A clean implementation would force a re-render to a
"consent required" gate or restart the app.

### Consent flows — other aspects: ✅ PASS

- First-run gating: `PrivacyConsentModal` blocks access until accepted.
- Settings toggles: Privacy consent toggle in settings correctly calls
  withdrawal handler.
- Persistence: Consent stored in SecureStore with 365-day expiry and auto
  re-request.
- "Deny" behavior: Modal stays on screen; user cannot proceed.

---

## 9. Privacy Policy / Terms / FAQ Accuracy

**Verdict: ❌ HIGH (3 inaccuracies)**

### F-9a — Sleep data claimed encrypted but stored plaintext (HIGH)

**Files:** `app/privacy.tsx`, `services/storage/localDb.ts`

Privacy policy states sleep quality and duration are encrypted. In the DB
schema, `sleep_entries.quality` is `TEXT` and `duration_hours` is `REAL` — both
plaintext. Only `notes` is encrypted.

**Fix:** Either encrypt `quality` and `duration_hours`, or update the privacy
policy to accurately state which sleep fields are encrypted.

### F-9b — "No check-in data is transmitted" is misleading (HIGH)

**File:** `app/privacy.tsx`

The policy states no check-in data leaves the device. In reality, the AI
Reflection Insights feature sends aggregated mood/stress/energy trends and
tag correlations to a Supabase Edge Function, which forwards them to the
Anthropic API. The data is aggregated (not raw entries), but the claim of
"no transmission" is inaccurate.

**Fix:** Add a disclosure: "If you use AI Reflection Insights (premium),
aggregated trend summaries are sent to our server for processing. No raw
journal entries or mood scores are transmitted."

### F-9c — "Encrypted SQLite database" implies full-DB encryption (HIGH)

**Files:** `app/privacy.tsx`, `app/faq.tsx`

Both documents refer to an "encrypted SQLite database." The actual
implementation is field-level encryption (specific columns encrypted with
AES-256-GCM). The database file itself is unencrypted and readable by anyone
with file-system access. Many columns (timestamps, sleep quality, lat/lng,
relationship type enums) are plaintext.

**Fix:** Replace "encrypted SQLite database" with "locally stored database
with field-level encryption on sensitive data."

### F-9d — lat/lng unencrypted despite PII sensitivity (MEDIUM)

**Files:** `app/privacy.tsx`, `services/storage/localDb.ts`

Privacy policy does not mention that birth coordinates are stored. These are
derived from the geocoding step during onboarding and stored as plaintext
`REAL` values. Combined with birth date/time, this is identifying information.

**Fix:** Disclose coordinate storage in the privacy policy, and consider
encrypting or reducing precision (see F-6c).

### F-9e — Dead `@anthropic-ai/sdk` dependency (LOW)

**File:** `package.json`

The Anthropic client SDK is listed as a dependency, but the app calls
Anthropic exclusively through the Supabase Edge Function (server-side fetch).
The SDK is unused dead weight that increases bundle size.

**Fix:** `npm uninstall @anthropic-ai/sdk`

---

## 10. Debug Screens / Dev Artefacts

**Verdict: ❌ HIGH**

### F-10a — screenshots.tsx reachable in production (HIGH)

**File:** `app/screenshots.tsx`

This file provides a screenshot gallery with mock data for App Store
submissions. It is a valid Expo Router route at `/screenshots` with no
`__DEV__` guard. Any user can navigate to it (e.g., via deep link).

**Fix:** Gate the entire component:
```tsx
import { Redirect } from 'expo-router';

export default function ScreenshotsPage() {
  if (!__DEV__) return <Redirect href="/" />;
  // ... existing dev UI
}
```

### F-10b — SkiaBreathJournal.tsx orphaned dead code (MEDIUM)

**File:** `components/journal/SkiaBreathJournal.tsx`

This component is not imported anywhere in the codebase. It contains:
- A "Secure Entry" button whose handler is `console.log('Saved')` — a stub.
- "Somatic Alignment Required" / "Somatic Sync" text (App Store risk flagged
  in Pass 3).

**Fix:** Delete the file.

### F-10c — dreamInterpretation.legacy.ts dead code (LOW)

**File:** `services/insights/dreamInterpretation.legacy.ts`

445 lines of deprecated dream interpretation logic. Not imported anywhere.

**Fix:** Delete the file.

---

## Priority Fix Order

### Must-fix before next release

| # | Finding | Severity | Effort |
|---|---------|----------|--------|
| 1 | F-6a: Delete or complete key rotation | CRITICAL | 30 min |
| 2 | F-4a: Add `isPremium` guard to growth.tsx + Edge Function | HIGH | 1 hr |
| 3 | F-8a: Add `terms_consent` to GDPR deletion | HIGH | 5 min |
| 4 | F-10a: Gate screenshots.tsx behind `__DEV__` | HIGH | 5 min |
| 5 | F-9a/b/c: Fix privacy policy inaccuracies | HIGH | 30 min |
| 6 | F-7a: Wrap encryption migrations in transactions | HIGH | 1 hr |
| 7 | F-6b: Replace fake HMAC with real HMAC-SHA256 | HIGH | 30 min |
| 8 | F-6c: Encrypt or reduce precision of lat/lng | HIGH | 1 hr |

### Should-fix

| # | Finding | Severity | Effort |
|---|---------|----------|--------|
| 9 | F-3a: Add init timeout with retry UI | MEDIUM | 30 min |
| 10 | F-6d: Warn before silent DEK regeneration | MEDIUM | 30 min |
| 11 | F-6f: Don't re-sign data that fails HMAC | MEDIUM | 15 min |
| 12 | F-7b: Atomic version bumps per migration | MEDIUM | 30 min |
| 13 | F-7c: Forward-compatibility version guard | MEDIUM | 15 min |
| 14 | F-8b: Force session exit on consent withdrawal | MEDIUM | 30 min |
| 15 | F-10b: Delete SkiaBreathJournal.tsx | MEDIUM | 2 min |
| 16 | F-6e: Handle decrypt-failure placeholders in charts | MEDIUM | 30 min |

### Nice-to-have

| # | Finding | Severity | Effort |
|---|---------|----------|--------|
| 17 | F-3b: Delay tab mount until consent granted | LOW-MEDIUM | 30 min |
| 18 | F-10c: Delete dreamInterpretation.legacy.ts | LOW | 2 min |
| 19 | F-9e: Remove dead @anthropic-ai/sdk dependency | LOW | 2 min |
| 20 | F-9d: Disclose lat/lng in privacy policy | MEDIUM | 10 min |

---

## Files Examined

```
app/_layout.tsx                                 (280 lines)
app/(tabs)/_layout.tsx                          (96 lines)
app/(tabs)/home.tsx
app/(tabs)/growth.tsx                           (746 lines)
app/(tabs)/settings/_layout.tsx                 (11 lines)
app/(tabs)/settings/index.tsx
app/(tabs)/settings/calibration.tsx
app/privacy.tsx
app/terms.tsx
app/faq.tsx
app/screenshots.tsx
components/journal/SkiaBreathJournal.tsx
constants/config.ts
context/PremiumContext.tsx
context/AuthContext.tsx
services/premium/revenuecat.ts
services/premium/reflectionInsights.ts
services/storage/fieldEncryption.ts
services/storage/encryptionManager.ts
services/storage/localDb.ts
services/storage/secureStorage.ts
services/storage/backupService.ts
services/privacy/privacyComplianceManager.ts
services/insights/dreamInterpretation.legacy.ts
supabase/functions/reflection-insights/index.ts (341 lines)
package.json
```
