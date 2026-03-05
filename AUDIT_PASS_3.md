# MySky — Targeted Audit Pass 3

**Date:** 2025-03-04  
**Scope:** Dead Imports, Cold-Start Safety, Debug/Dev Artifacts  

---

## AUDIT A: Dead Imports / Deleted File References

### A1. Broken Import Paths

**Automated scan of all ~1,055 import statements across `app/`, `components/`, `services/`, `lib/`, `utils/`, `context/`, `constants/`, `screenshots/`.**

| Finding | File | Line | Details | Severity |
|---------|------|------|---------|----------|
| **False positive (comment only)** | `services/insights/index.ts` | 7 | Usage example in JSDoc comment reads `from '../services/insights'` — this is a *comment*, not an executable import. The barrel file's own re-exports are all valid (`./types`, `./dayKey`, `./chartProfile`, `./pipeline`, `./cache`). | ⚪ None |

**Result: Zero broken imports.** All relative paths resolve correctly to `.ts`, `.tsx`, or `index.ts` files.

### A2. Settings Folder Restructure

- `grep -rn "from.*settings\.tsx" app/ components/ services/` → **No matches.**
- `app/(tabs)/settings/` is now a proper folder with `_layout.tsx`, `index.tsx`, and `calibration.tsx`. No file imports the old single-file path.

### A3. SomaticCalibration / SkiaSomaticCalibration Rename

- `grep -rn "SkiaSomaticCalibration\|SomaticCalibration"` → **No matches.**
- The rename to `VisualCalibration` (or the current `calibration.tsx` route) is complete with no stale references.

### A4. Circular Imports Between Context Providers

- `context/PremiumContext.tsx` imports only from `react`, `react-native-purchases`, `expo-haptics`, `../services/premium/revenuecat`, `../utils/logger`.
- `context/AuthContext.tsx` imports only from `react`, `react-native`, `@supabase/supabase-js`, `expo-haptics`, `../lib/supabase`, `../utils/logger`.
- `context/StarNotificationContext.tsx` imports only from `react`, `../components/ui/SkiaFallingStarNotification`.

**Result: No cross-context imports. No circular dependency risk.**

### A5. Deprecated / Legacy Files

| File | Line | Status | Severity |
|------|------|--------|----------|
| `services/premium/dreamInterpretation.legacy.ts` | 2 | Marked `@deprecated`, retained as reference. **Not imported anywhere.** | 🟡 Low — Dead code, safe to delete |
| `services/storage/secureStorage.ts` | 235 | `@deprecated` method — has replacement noted (`getRecentSecurityEvents()`). Internal only. | ⚪ Info |
| `services/storage/encryptionManager.ts` | 108, 115 | Two `@deprecated` methods kept for migration. | ⚪ Info |
| `services/storage/localDb.ts` | 246 | Comment: `cached_interpretations table removed` — cleanup note, no issue. | ⚪ Info |

---

## AUDIT B: Cold-Start Runtime Safety

### B1. Root Layout Boot Sequence (`app/_layout.tsx`)

**Initialization order:**
1. `useState` hooks initialize sync state (`checkingConsent`, `dbReady`, `needsPrivacyConsent`, `needsTermsConsent`, `onboardingComplete`)
2. `useEffect` fires `initializeApp()`:
   - `PrivacyComplianceManager.requestConsent()` → async, wrapped in try/catch ✅
   - `getTermsConsent()` via `expo-secure-store` (dynamic import) → wrapped in try/catch ✅
   - If no consent required: `runPostPrivacyConsentInit()` runs migrations, settings, DB init
   - If consent required: `setDbReady(true)` — app renders immediately with consent modal
3. **Guard against double-init:** `didRunPostConsentInitRef` ref prevents re-running heavy init ✅
4. **Blank screen while loading:** Returns `null` while `checkingConsent || !dbReady` — acceptable, but has no timeout/fallback if init hangs indefinitely.

| Finding | Severity | Details |
|---------|----------|---------|
| **No timeout on init** | 🟡 Medium | If `PrivacyComplianceManager.requestConsent()` hangs (SecureStore corruption, etc.), the app shows a blank screen forever. Consider a 10s timeout fallback. |
| **Error in init still sets dbReady** | ✅ Good | The catch block sets `setDbReady(true)` so the app doesn't permanently hang. |

### B2. Context Provider Analysis

#### PremiumContext.tsx
| Check | Status | Details |
|-------|--------|---------|
| Async init in useEffect | ✅ Safe | `revenueCatService.initialize()` + parallel `getCustomerInfo`/`getOfferings` wrapped in try/catch. On failure, `setIsReady(true)` unblocks the app. |
| Unmount safety | ✅ Safe | `isMounted` ref checked before every `setState` call. |
| Race conditions | ✅ Safe | No dependency on AuthContext or StarNotificationContext. Independent initialization. |
| `DEBUG_FORCE_PREMIUM` | ✅ Safe | Gated by `__DEV__ && false` — cannot activate in production even if toggled to `true` at dev time. |
| Listener cleanup | ✅ | `Purchases.addCustomerInfoUpdateListener` return value cleaned up in effect teardown. |

#### AuthContext.tsx
| Check | Status | Details |
|-------|--------|---------|
| Session restoration | ✅ Safe | `supabase.auth.getSession()` in try/catch. Sets `loading: false` in `finally`. |
| Auth state listener | ✅ Safe | `onAuthStateChange` subscription cleaned up on unmount. |
| App state lifecycle | ✅ Safe | `AppState.addEventListener` cleaned up via `sub.remove()`. Auto-refresh stopped when backgrounded. |
| Unmount safety | ✅ | `isMounted` ref guards all `setState` calls. |
| Race with PremiumContext | ✅ | AuthProvider wraps PremiumProvider in layout — Auth initializes first, but Premium doesn't depend on Auth state. |

#### StarNotificationContext.tsx
| Check | Status | Details |
|-------|--------|---------|
| Side effects | ✅ None | Pure ref-based — no async operations, no useEffect. Only a `useRef` and `useCallback`. |
| Crash risk | ✅ None | `starRef.current?.show(message)` — optional chaining prevents null crash. |

### B3. Modal Safety Analysis

#### PrivacyConsentModal
| Check | Status | Details |
|-------|--------|---------|
| Null checks on props | ✅ | `contactEmail` has fallback default. `visible` and `onConsent` are always provided from layout. |
| Unmount during animation | ✅ Safe | Uses `react-native-reanimated` `FadeInDown`/`FadeInUp` entering animations — these are declarative and handle unmount gracefully. No imperative `Animated.timing` cleanup needed. |
| Visibility conflicts | ✅ | `needsPrivacyConsent` is mutually exclusive with `OnboardingModal` rendering (`!needsPrivacyConsent && ...`). |

#### OnboardingModal
| Check | Status | Details |
|-------|--------|---------|
| Null checks | ✅ | `needsTermsConsent` defaulted to `false`, `onTermsConsent` optional. |
| Unmount cleanup | ✅ | `timeoutRef` cleared in both effect cleanup and visibility-change effect. |
| Nested modal (BirthDataModal) | ✅ | `showBirthModal` state reset to `false` when `visible` changes to `false`. |
| Nested modal (TermsConsentModal) | ✅ | `showTermsModal` state reset similarly. |

#### BirthDataModal
| Check | Status | Details |
|-------|--------|---------|
| Null checks | ✅ | `initialData` is optional with proper defaults. `onSave` and `onClose` always provided by callers. |
| Animation safety | ✅ | Declarative `FadeInDown`/`FadeInUp` reanimated animations. |

**Modal Visibility Conflicts:** The layout logic correctly prevents simultaneous modal display:
- `PrivacyConsentModal` shows only when `needsPrivacyConsent === true`
- `OnboardingModal` shows only when `!needsPrivacyConsent && !onboardingComplete && !isOnLegalScreen`
- These are mutually exclusive conditions ✅

---

## AUDIT C: Debug Screens / Example Handlers

### C1. console.log in Production Code

| File | Line | Code | Severity |
|------|------|------|----------|
| **`components/journal/SkiaBreathJournal.tsx`** | 118 | `onPress={() => console.log('Saved')}` | 🔴 **High** — This is a **stub handler** on a "Secure Entry" button. The button does nothing in production except log to console. This is an incomplete feature. |
| `utils/logger.ts` | 62 | `(console[level] ?? console.log)(...safeArgs)` | ⚪ Info — This is the logger implementation itself; debug/info are suppressed in production. Correct. |
| `lib/supabase.ts` | 17 | `console.warn(...)` for missing env vars | 🟡 Low — Startup warning if env vars are missing. Acceptable but could use `logger.warn` for consistency. |

### C2. `__DEV__` Gated Features

| File | Line(s) | What's Gated | Status |
|------|---------|--------------|--------|
| `app/(tabs)/settings/index.tsx` | 853–887 | "Developer Tools" section with "Edit Birth Data" button | ✅ Properly gated |
| `app/(tabs)/settings/index.tsx` | 914–924 | Dev-only `BirthDataModal` instance | ✅ Properly gated |
| `components/journal/SkiaBreathJournal.tsx` | 85–91 | "Simulate Breath" cycle-increment button | ✅ Properly gated |
| `context/PremiumContext.tsx` | 33–34 | `DEBUG_FORCE_PREMIUM = __DEV__ && false` | ✅ Properly gated (double-locked) |
| `services/premium/revenuecat.ts` | 21 | Verbose logging in dev, WARN only in production | ✅ Properly gated |
| `utils/logger.ts` | 3 | Dev detection for log level filtering | ✅ Properly gated |

### C3. Screenshots Route — PRODUCTION REACHABLE

| Finding | Severity |
|---------|----------|
| **`app/screenshots.tsx` has NO `__DEV__` gate** | 🔴 **High** |

**Details:** The file at `app/screenshots.tsx` exports a full page component that renders `ScreenshotGallery` (from `screenshots/ScreenshotGallery.tsx`). The comment says "Dev-only route" but there is **no runtime guard**. Because Expo Router uses file-based routing, this page is accessible at `/screenshots` in production builds.

The `screenshots/mocks/` folder contains 6 mock screen components (`MockDashboardScreen`, `MockJournalScreen`, `MockMoodScreen`, `MockPatternsScreen`, `MockPersonalizeScreen`, `MockSleepScreen`) that render synthetic/demo data.

**Impact:** Any user who navigates to `/screenshots` in a production build will see mock App Store screenshots with fake data. Not a security risk, but:
- Exposes internal demo content to end users
- May confuse users who discover it
- The mock components bundle into the production binary unnecessarily

**Fix options:**
1. Add `if (!__DEV__) return <Redirect href="/" />;` at the top of `screenshots.tsx`
2. Move `screenshots.tsx` out of `app/` entirely
3. Use Expo Router's route groups to exclude it from production

### C4. Orphaned / Incomplete Components

| File | Issue | Severity |
|------|-------|----------|
| **`components/journal/SkiaBreathJournal.tsx`** | Not imported anywhere in the app. Contains a `console.log('Saved')` stub handler. Appears to be an incomplete/abandoned feature. | 🟡 Medium — Dead code in bundle |
| **`services/premium/dreamInterpretation.legacy.ts`** | 445-line deprecated file, not imported. | 🟡 Low — Dead code, ~445 lines in bundle |

### C5. Debugging Comments Left in Code

| File | Line | Comment | Severity |
|------|------|---------|----------|
| `components/ui/NatalChartWheelSkia.tsx` | 1030 | `{/* Film grain overlay (RuntimeShader) temporarily disabled for debugging black screen issue */}` | 🟡 Low — Disabled feature with debug rationale. Should be tracked as a TODO or removed. |

### C6. Hardcoded API Keys / Credentials

| File | Status | Details |
|------|--------|---------|
| `lib/supabase.ts` | ✅ Safe | Reads from `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` env vars. |
| `services/premium/revenuecat.ts` | ✅ Safe | Reads from `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` env vars. |
| `constants/config.ts` | ✅ Safe | Contains only display strings and pricing info (overridden by RevenueCat live). |
| `.env` | ⚠️ **Note** | Contains actual RevenueCat iOS API key (`appl_...`), Supabase URL, anon key, and Edge Function URL. The `.gitignore` correctly excludes `.env`. The Supabase anon key is a *public* key by design (Row Level Security enforces access). RevenueCat public API keys are also designed for client-side use. **No secret keys exposed.** |

### C7. Test/Debug/Dev Routes

| Route | Status |
|-------|--------|
| `/screenshots` | 🔴 **Reachable in production** (see C3) |
| `/faq` | ✅ Legitimate user-facing route |
| `/privacy` | ✅ Legitimate user-facing route |
| `/terms` | ✅ Legitimate user-facing route |
| `/(auth)/sign-in` | ✅ Legitimate auth route |
| `/+not-found` | ✅ Proper 404 handler |
| `/error` | ✅ Proper error boundary |
| `/astrology-context` | ✅ Legitimate stack route |

---

## Summary — Action Items

### 🔴 High Priority
1. **`app/screenshots.tsx`** — Gate behind `__DEV__` or remove from `app/` folder. Currently reachable in production at `/screenshots`.
2. **`components/journal/SkiaBreathJournal.tsx:118`** — `console.log('Saved')` stub handler on "Secure Entry" button. Either implement the save logic or remove/disable the component.

### 🟡 Medium Priority
3. **`app/_layout.tsx`** — Add a timeout fallback (e.g., 10 seconds) for the init sequence to prevent infinite blank screen if `PrivacyComplianceManager.requestConsent()` hangs.
4. **`components/journal/SkiaBreathJournal.tsx`** — Entirely orphaned component (not imported anywhere). Remove from bundle.
5. **`services/premium/dreamInterpretation.legacy.ts`** — 445 lines of dead code. Delete when ready.
6. **`components/ui/NatalChartWheelSkia.tsx:1030`** — Disabled RuntimeShader with debug comment. Track as issue or clean up.

### ⚪ Low Priority / Info
7. **`lib/supabase.ts:17`** — Use `logger.warn` instead of `console.warn` for consistency.
8. **Deprecated methods in `secureStorage.ts` and `encryptionManager.ts`** — Tracked via `@deprecated` JSDoc. Remove once migration period ends.
