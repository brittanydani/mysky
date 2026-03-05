# MySky — Deep Audit Pass 2 (Search-Driven)

> **Scope:** Every `.ts` / `.tsx` file under `/Users/brittany/Downloads/mysky`
> (213 source files, ~75 000 LOC).
> **Method:** Targeted regex searches + deep file reads for every hit.
> **Date:** 2025-07-03

---

## A. Executive Summary

This second audit pass ran **18 targeted regex sweeps** across the full codebase and **deep-read 15 flagged files** to verify, extend, and discover findings beyond the first manual audit. The result is **58 total findings** (10 Critical, 16 High, 20 Medium, 12 Low) plus 5 verified passes.

**Key new discoveries this pass:**
- 25 empty `catch {}` blocks swallowing errors silently (beyond haptics)
- Nominatim API leaks user-typed birth location to OpenStreetMap — disclosed in privacy policy but response validation is missing
- `sleep.tsx` connectivity check runs *before* save (correct) but also *after* failure (redundant round-trip)
- All `fetch()` calls confirmed (only 6 total — all legitimate)
- Android permissions correctly blocked via `blockedPermissions` in `app.json`
- No `TODO`, `FIXME`, `HACK`, `XXX`, or `WIP` markers anywhere in codebase
- Astrology calculator uses real Swiss Ephemeris — no fake positions
- PDF export is real (`expo-print`), not a stub
- RevenueCat sends zero PII — anonymous device ID only

---

## B. Search Results Inventory

### B1 — Placeholders / Stubs / Dead Code

| Search Pattern | Hits | Verdict |
|---|---|---|
| `TODO\|FIXME\|HACK\|XXX\|WIP` | **0** | ✅ Clean — no deferred work markers |
| `example\|sample\|mock\|dummy\|placeholder\|lorem` | ~40 | ✅ All legitimate: UI `placeholder` props, `sampleSize` stats variable, `@example` JSDoc. One exception: `feedbackHandlerExample.ts` is dead code (see below). |
| `console.log` (excl. logger.ts) | **1** | `SkiaBreathJournal.tsx:118` — `onPress={() => console.log('Saved')}`. Dead code file, not imported. |
| `@ts-ignore\|@ts-nocheck` | **0** | ✅ No type-safety suppressions |
| `eslint-disable` | **8** | All justified: exhaustive-deps (4), no-explicit-any (2), no-unused-vars (2). None suppress security rules. |
| `as any\|as unknown` | **~60** | 38 in `chart.tsx`, 8 in `relationships.tsx`, 3 in `journal.tsx`, scattered elsewhere. See finding B1-F1. |

**Confirmed Dead Code Files (not imported by any production code):**

| File | Lines | Notes |
|---|---|---|
| `services/premium/feedbackHandlerExample.ts` | ~85 | Example code. Imports `adaptiveLearning` but nothing imports this file. |
| `services/premium/supabaseDreamModelService.ts` | ~160 | Supabase dream model. Imports `adaptiveLearning` but nothing imports this file. |
| `services/premium/adaptiveLearning.ts` | ~200 | Learning rate engine. Only imported by the two dead files above. |
| `services/premium/dreamInterpretation.legacy.ts` | ~150 | Legacy dream engine. Not imported anywhere. |
| `components/journal/SkiaBreathJournal.tsx` | ~130 | Breath journal UI with `console.log('Saved')` stub. Not imported anywhere. |

> **Recommendation:** Delete all 5 files. They add ~725 lines of dead weight and the `console.log` stub would be a review flag.

---

### B2 — Correctness Risks

| Search Pattern | Hits | Key Findings |
|---|---|---|
| `new Date()\|toISOString\|.slice(0.*10)` | ~60 | **UTC date bug pattern confirmed** in 8 locations. `toISOString().split('T')[0]` and `.slice(0,10)` produce UTC dates, not local. `dateUtils.ts` provides correct `toLocalDateString()` but it's inconsistently used. See findings B2-F1 through B2-F4. |
| `Math.random` | 5 | ✅ All in visual effects (falling stars, warp transitions, cosmic background). None in scoring or data logic. |
| `parseFloat\|parseInt\|NaN\|Number(` | ~50 | `parseFloat(x.toFixed(n))` used extensively for display rounding. Division-by-zero guarded everywhere except one edge case. See B2-F5. |
| `average\|trend\|slope\|score` | ~80 | All legitimate scoring logic. No fake data or hardcoded scores. |

---

### B3 — Security / Privacy / Networking

| Search Pattern | Hits | Key Findings |
|---|---|---|
| `fetch(` | **6** | All legitimate: (1) `sleep.tsx` connectivity check ×2, (2) `mood.tsx` connectivity check ×1, (3) `BirthDataModal.tsx` Nominatim geocoding, (4) `reflectionInsights.ts` Supabase Edge Function, (5) `reflection-insights/index.ts` Anthropic API (server-side). |
| `SecureStore\|AsyncStorage\|SQLite` | ~50 | SecureStore: encryption keys, consent records, audit trail. AsyncStorage: preferences, terms consent, calibration, auth sessions. SQLite: all user data. See storage matrix below. |
| `AES\|GCM\|encrypt\|decrypt\|hmac\|digest` | ~60 | AES-256-GCM implemented correctly via `@noble/ciphers`. HMAC flaw confirmed (SHA256(key+data), not HMAC-SHA256). Legacy XOR is read-only. |
| `camera\|microphone\|location\|tracking\|healthkit` | ~30 | ✅ No runtime permission requests for camera, mic, health, or fine location. Android `blockedPermissions` in `app.json` correctly blocks Camera, Microphone, Contacts, Calendar, SMS, Phone, Location. Privacy claims match. |
| `catch {}` (excl. haptics) | **25** | 10 in `settings/index.tsx`, 3 in `sleep.tsx`, 2 in `chart.tsx`, 3 in `journal.tsx`, 4 in `JournalEntryModal.tsx`, 1 in `relationships.tsx`, 1 in `secureStorage.ts`, 1 in `calibration.tsx`. See B3-F1. |

**Network Call Matrix:**

| Endpoint | File | Data Sent | PII Risk |
|---|---|---|---|
| `clients3.google.com/generate_204` | sleep.tsx, mood.tsx | HEAD request, no body | None — connectivity check only |
| `nominatim.openstreetmap.org/search` | BirthDataModal.tsx | User-typed city name | **Medium** — birth city sent to OSM. Disclosed in privacy policy. |
| Supabase Edge Function | reflectionInsights.ts | Aggregated mood/energy/stress stats, tag lift scores | **Low** — no PII. Verified: no name, birth date, journal text, or location sent. |
| `api.anthropic.com/v1/messages` | reflection-insights/index.ts | Aggregated stats (server-side only) | None — runs in Supabase Edge Function, user device never contacts Anthropic directly. |

**Storage Security Matrix:**

| Store | What's Stored | Encrypted? | Deleted on "Delete All"? |
|---|---|---|---|
| SQLite | Charts, journal, check-ins, sleep, relationships, insights | AES-256-GCM (selected fields) | ✅ Yes |
| SecureStore | Encryption DEK, HMAC key, consent records, audit trail | OS Keychain | ✅ Yes |
| SecureStore | Reflection insights cache | OS Keychain | ❌ **No** — survives deletion |
| AsyncStorage | Settings prefs, terms consent, calibration, haptic prefs | **No** — plaintext | ❌ **No** — survives deletion |
| Supabase Auth | Session token, user email | TLS in transit | ❌ **No** — not signed out |

---

## C. Findings Table

### Critical (10)

| ID | File | Lines | Finding |
|---|---|---|---|
| C-01 | [services/storage/encryptionManager.ts](services/storage/encryptionManager.ts#L56-L61) | 56–61 | **Flawed HMAC construction.** Uses `SHA256(key + ':' + data)` instead of `HMAC-SHA256(key, data)`. Vulnerable to length-extension attacks. Named "HMAC" throughout but is not HMAC. |
| C-02 | [services/storage/secureStorage.ts](services/storage/secureStorage.ts#L373-L387) | 373–387 | **HMAC bypass on validation failure.** `getEncryptedItem()` catch block auto-recovers tampered data by re-signing it, making the integrity check ineffective. |
| C-03 | [services/storage/encryptionManager.ts](services/storage/encryptionManager.ts#L1-L10) | 1–10 | **Misleading type name.** `EncryptedPayload` contains plaintext `data` — it's only signed, not encrypted. Deprecated aliases `encryptSensitiveData`/`decryptSensitiveData` compound the confusion. |
| C-04 | [services/storage/fieldEncryption.ts](services/storage/fieldEncryption.ts#L462-L492) | 462–492 | **Key rotation broken.** `rotateKey()` stages a new DEK but does NOT re-encrypt any data. No `reEncryptAll()` method exists. Calling `commitRotatedKey()` without re-encrypting rows makes all existing data permanently unreadable. |
| C-05 | [services/storage/fieldEncryption.ts](services/storage/fieldEncryption.ts#L141-L183) | 141–183 | **Legacy XOR cipher still active.** `decryptField()` auto-detects and decrypts `ENC:` prefixed data using XOR. While read-only (new data is AES-GCM), XOR provides zero real security for existing legacy data. |
| C-06 | [services/privacy/privacyComplianceManager.ts](services/privacy/privacyComplianceManager.ts#L173-L185) | 173–185 | **GDPR export missing 3 tables.** `handleExportRequest()` omits `daily_check_ins`, `sleep_entries`, and `relationship_charts`. Violates GDPR Article 20 (data portability). |
| C-07 | [services/privacy/privacyComplianceManager.ts](services/privacy/privacyComplianceManager.ts#L199-L207) | 199–207 | **Delete All Data incomplete.** Does not clear AsyncStorage (prefs, terms consent, calibration), SecureStore reflection cache, or sign out of Supabase auth. User data survives "deletion." |
| C-08 | [services/privacy/privacyComplianceManager.ts](services/privacy/privacyComplianceManager.ts#L143-L159) | 143–159 | **Access request incomplete.** `handleAccessRequest()` omits `daily_check_ins`, `sleep_entries`, `relationship_charts`, and `insight_history`. Violates GDPR Article 15. |
| C-09 | [services/storage/localDb.ts](services/storage/localDb.ts#L680-L718) | 680–718 | **Migration v11 partial encryption risk.** No idempotency marker. If encryption partially completes but `user_version` is bumped, unencrypted rows are permanently skipped. Same issue in v14 (L893–914). |
| C-10 | [app/(tabs)/chart.tsx](app/(tabs)/chart.tsx#L552) | 552, 578–579 | **`as any` hides missing properties.** `(chart as any)?.birthData?.date` and `(chart as any)?.name` access properties not on the type — will produce `undefined` at runtime if the shape differs. |

### High (16)

| ID | File | Lines | Finding |
|---|---|---|---|
| H-01 | [utils/insightsEngine.ts](utils/insightsEngine.ts#L338) | 338, 1783 | **UTC date bug.** `.toISOString().slice(0,10)` produces UTC date. Near midnight in western timezones, "today's" check-ins appear as tomorrow's. `dateUtils.toLocalDateString()` exists but isn't used. |
| H-02 | [app/(tabs)/sleep.tsx](app/(tabs)/sleep.tsx#L181) | 181, 184 | **UTC date bug.** `formatDate()` uses `.toISOString().split('T')[0]` for "today" and "yesterday" comparisons — wrong near midnight. |
| H-03 | [app/(tabs)/energy.tsx](app/(tabs)/energy.tsx#L141) | 141 | **UTC date bug.** `new Date().toISOString().slice(0, 10)` used for today's date key. Wrong near midnight in negative UTC offsets. |
| H-04 | [app/(tabs)/mood.tsx](app/(tabs)/mood.tsx#L134) | 134 | **UTC date bug.** Same `toISOString()` pattern for the "today" date key. |
| H-05 | [app/astrology-context.tsx](app/astrology-context.tsx#L249) | 249 | **UTC date bug.** `toISOString()` date key for daily transit/moon phase lookups. |
| H-06 | [services/today/dailyLoop.ts](services/today/dailyLoop.ts) | various | **ENERGY_MAP / STRESS_MAP value mismatch.** Different numeric mappings than `services/insights/pipeline.ts`. Same energy level string maps to different numbers in different engines, producing inconsistent trend calculations. |
| H-07 | [services/storage/localDb.ts](services/storage/localDb.ts#L786-L800) | 786–800 | **Migration v12 silent data loss.** `INSERT OR IGNORE` during table swap silently drops rows that conflict on `(date, chart_id, time_of_day)`. |
| H-08 | [services/storage/backupService.ts](services/storage/backupService.ts#L371-L392) | 371–392 | **Restore is merge, not replace.** `INSERT OR REPLACE` preserves existing data with different IDs. Users expecting a clean restore get a merged dataset. |
| H-09 | [services/storage/migrationService.ts](services/storage/migrationService.ts#L36-L61) | 36–61 | **Migration not atomic.** No transactional boundary between data write and marker set. If app crashes between, migration re-runs (currently idempotent, but fragile for future migrations). |
| H-10 | [services/storage/localDb.ts](services/storage/localDb.ts) | various | **Lat/lng stored plaintext.** Birth coordinates in `charts` table stored unencrypted alongside encrypted `birthPlace`. Enables geolocation even after field encryption. |
| H-11 | [components/BirthDataModal.tsx](components/BirthDataModal.tsx#L213-L224) | 213–224 | **Nominatim response not validated.** `response.json()` result directly set into state. If OSM returns error JSON, rate-limit HTML, or unexpected shape, the UI gets garbage data with no error shown. |
| H-12 | [services/storage/secureStorage.ts](services/storage/secureStorage.ts) | various | **Race condition in read-modify-write.** Multiple concurrent calls to `saveChart()`, `saveSettings()`, etc. can overwrite each other. No locking or optimistic concurrency. |
| H-13 | [app/(tabs)/chart.tsx](app/(tabs)/chart.tsx) | various | **38 `as any` casts.** ~5 hide real type gaps (properties not on type), ~33 are lazy polymorphic access. Fragile — any type change will silently break. |
| H-14 | [services/storage/localDb.ts](services/storage/localDb.ts) | various | **Soft delete retains encrypted content.** `isDeleted = 1` rows keep encrypted journal text, birth data, dream text. Only hard-delete (`DELETE FROM`) truly removes data. |
| H-15 | [services/storage/backupService.ts](services/storage/backupService.ts#L335) | 335, 359 | **Backup schema version rigid.** `schemaVersion === 1` exact match. When bumped to 2, all existing `.msky` backups fail to restore with no migration path. |
| H-16 | [app/(tabs)/growth.tsx](app/(tabs)/growth.tsx#L133-L134) | 133–134 | **UTC vs local date mismatch.** `new Date(c.date)` interprets ISO date string as UTC midnight. Compared with local-timezone week boundaries. Off-by-one day for negative UTC offset users. |

### Medium (20)

| ID | File | Lines | Finding |
|---|---|---|---|
| M-01 | [app/(tabs)/settings/index.tsx](app/(tabs)/settings/index.tsx) | 189, 196, 226, 232, 273, 281, 370, 377, 384, 662 | **10 empty `catch {}` blocks.** AsyncStorage writes for preferences silently fail. If storage is full or corrupted, user settings changes are lost with no feedback. |
| M-02 | [components/JournalEntryModal.tsx](components/JournalEntryModal.tsx) | 104, 110, 134, 136, 168 | **5 empty `catch {}` blocks.** Journal prompt loading, transit snapshot parsing, and NLP tag generation silently fail. |
| M-03 | [app/(tabs)/sleep.tsx](app/(tabs)/sleep.tsx) | 355, 459, 460 | **3 empty `catch {}` blocks.** Dream feelings/metadata JSON parsing silently fails (produces undefined data). |
| M-04 | [app/(tabs)/chart.tsx](app/(tabs)/chart.tsx) | 1514, 1533 | **2 empty `catch {}` blocks.** Chart deletion and copy operations silently swallow errors. |
| M-05 | [app/(tabs)/journal.tsx](app/(tabs)/journal.tsx) | 151, 226, 234 | **3 empty `catch {}` blocks.** Transit snapshot and journal operations fail silently. |
| M-06 | [app/(tabs)/relationships.tsx](app/(tabs)/relationships.tsx) | 231 | **1 empty `catch {}` block.** Relationship chart operation fails silently. |
| M-07 | [services/storage/secureStorage.ts](services/storage/secureStorage.ts) | 426 | **1 empty `catch {}` block.** `SecureStore.deleteItemAsync` failure during cleanup goes silent. |
| M-08 | [services/storage/encryptionManager.ts](services/storage/encryptionManager.ts#L80-L85) | 80–85 | **`tryParseSensitiveData` bypasses integrity check.** Used as recovery path but accepts potentially tampered data. |
| M-09 | [services/storage/fieldEncryption.ts](services/storage/fieldEncryption.ts#L252) | 252 | **Empty strings bypass encryption.** `encryptField('')` returns `''` unencrypted. If empty strings are meaningful data (e.g., intentionally blank journal), this is an info leak. |
| M-10 | [services/storage/backupService.ts](services/storage/backupService.ts#L195) | 195 | **8-char minimum passphrase.** Meets bare minimum (NIST SP 800-63B) but for backup encryption, 12+ recommended. No complexity requirements. |
| M-11 | [services/storage/backupService.ts](services/storage/backupService.ts#L316) | 316 | **`(fileInfo as any).size`** hides type gap. If filesystem doesn't return `size`, evaluates as `undefined > 50MB → false`, silently skipping the size guard. |
| M-12 | [services/premium/pdfExport.ts](services/premium/pdfExport.ts#L57-L63) | 57–63 | **HTML escaping doesn't filter `javascript:` URIs.** `esc()` covers `&<>"'` but not protocol injection. Low risk since user content is wrapped in `esc()`, but `expo-print` renders in WebView. |
| M-13 | [context/PremiumContext.tsx](context/PremiumContext.tsx#L42) | 42 | **`DEBUG_FORCE_PREMIUM` relies on discipline.** Currently `__DEV__ && false` (safe), but no CI guard against accidental `true`. |
| M-14 | [context/PremiumContext.tsx](context/PremiumContext.tsx#L53-L60) | 53–60 | **Premium state race.** Separate `setCustomerInfo` + `setIsPremium` updates could desync for one render in non-batched contexts (RevenueCat listener callback). |
| M-15 | [services/storage/backupService.ts](services/storage/backupService.ts#L371-L392) | 371–392 | **Restore not atomic.** Sequential saves with no wrapping transaction. App crash mid-restore = partial dataset. |
| M-16 | [components/BirthDataModal.tsx](components/BirthDataModal.tsx#L223-L224) | 223–224 | **Nominatim error swallowed.** `catch` only hides suggestions — no logging, no user feedback for network errors during location search. |
| M-17 | [services/privacy/privacyComplianceManager.ts](services/privacy/privacyComplianceManager.ts#L199-L207) | 199–207 | **Reflection insights cache survives deletion.** SecureStore keys for `mysky_reflection_insights_v2:*` are not cleared by `deleteAllUserData`. |
| M-18 | [services/storage/localDb.ts](services/storage/localDb.ts#L64) | 64 | **`\|\|` vs `??` for user_version.** `(result as any)?.user_version || 0` — if version is `0`, evaluates correctly but `?? 0` is semantically precise. |
| M-19 | [app/(tabs)/sleep.tsx](app/(tabs)/sleep.tsx#L375) | 375, 437 | **Redundant connectivity check.** Connectivity fetched before save AND after failure. The post-failure check adds a round-trip just to customize the error message. Consider caching the pre-save result. |
| M-20 | [services/storage/migrationService.ts](services/storage/migrationService.ts#L36-L61) | 36–61 | **No rollback on migration failure.** If `saveSettings()` succeeds but `setMigrationMarker()` throws, user gets re-migrated next launch. Currently idempotent (overwrite), but fragile. |

### Low (12)

| ID | File | Lines | Finding |
|---|---|---|---|
| L-01 | [services/premium/revenuecat.ts](services/premium/revenuecat.ts#L34) | 34 | **API key prefix logged.** `apiKey?.slice(0, 5)` in error message. Only shows `appl_`/`goog_` prefix — minimal risk. |
| L-02 | [services/astrology/calculator.ts](services/astrology/calculator.ts#L82) | 82 | **`speed: 0` default.** `convertToLegacyPlanetPlacement` sets `speed: 0`. If callers forget to overwrite, planet appears stationary. |
| L-03 | [services/astrology/calculator.ts](services/astrology/calculator.ts#L115) | 115 | **Day chart heuristic.** `isDayChartFromSunHouse` uses houses 7–12 = day. Simplified but may be inaccurate for polar latitudes. |
| L-04 | [utils/dateUtils.ts](utils/dateUtils.ts#L44-L47) | 44–47 | **DST edge case in `dayOfYear`.** Uses `86400000ms` as day length. Across DST transitions, this can be off by ±1 hour, causing an off-by-one day. Used for content selection only — negligible impact. |
| L-05 | [services/storage/fieldEncryption.ts](services/storage/fieldEncryption.ts#L160-L171) | 160–171 | **Non-constant-time XOR tag check.** Legacy tag verification loop continues to end (some timing resistance) but isn't truly constant-time. Deprecated path — low impact. |
| L-06 | [services/storage/backupService.ts](services/storage/backupService.ts#L569) | 569 | **PDF cache cleanup best-effort.** If app crashes after PDF generation but before `deleteAsync`, PDF stays in cache. OS eventually clears it. |
| L-07 | [services/premium/reflectionInsights.ts](services/premium/reflectionInsights.ts#L35-L36) | 35–36 | **Missing env var produces confusing error.** If `EXPO_PUBLIC_SUPABASE_ANON_KEY` is unset, the anon key header is empty string → Supabase returns 401. Error message won't explain why. |
| L-08 | [context/PremiumContext.tsx](context/PremiumContext.tsx#L105) | 105 | **Listener cleanup cast.** `as unknown as (() => void)` for RevenueCat listener. If SDK changes return type, cleanup silently fails. Mitigated by `typeof` guard. |
| L-09 | [services/storage/migrationService.ts](services/storage/migrationService.ts#L29-L30) | 29–30 | **Corrupted marker = re-migration on every launch.** `isMigrationCompleted` returns `false` on error. Safe (idempotent) but noisy. |
| L-10 | [app/(tabs)/growth.tsx](app/(tabs)/growth.tsx#L60-L63) | 60–63 | **Daily prompt timezone edge.** Day-of-year calculated in local time; near midnight, prompt could change at unexpected time vs. UTC-based features elsewhere. |
| L-11 | [services/storage/encryptionManager.ts](services/storage/encryptionManager.ts#L107-L116) | 107–116 | **Deprecated aliases persist.** `encryptSensitiveData`/`decryptSensitiveData` alias `signSensitiveData`/`validateAndParseSensitiveData`. Names imply encryption that doesn't happen. |
| L-12 | [components/journal/SkiaBreathJournal.tsx](components/journal/SkiaBreathJournal.tsx#L118) | 118 | **`console.log('Saved')` stub.** Dead code file — not imported — but stub would fail review. Delete file. |

---

## D. Verified Passes

| Area | Verification | Result |
|---|---|---|
| **Swiss Ephemeris** | `calculator.ts` uses `origin` (Swiss Ephemeris) as primary engine with `circular-natal-horoscope-js` fallback | ✅ Real ephemeris, no fake positions |
| **PDF Export** | `pdfExport.ts` uses `expo-print` → `printToFileAsync()` with full HTML generation | ✅ Real PDF, not a stub |
| **RevenueCat PII** | Only `Purchases.configure({ apiKey })`, offerings, and purchase calls. No user data sent | ✅ Anonymous device ID only |
| **Reflection Insights PII** | Payload contains only aggregated mood/energy/stress stats + tag lift scores. No name, birth date, location, or journal text | ✅ Matches "aggregated stats only" claim |
| **Android Permissions** | `app.json` `blockedPermissions` blocks Camera, Microphone, Contacts, Calendar, SMS, Phone, Location (fine + coarse + background) | ✅ Matches privacy policy claims |
| **`dateUtils.ts` Correctness** | `toLocalDateString()` uses `getFullYear()/getMonth()/getDate()` (local timezone). `parseLocalDate()` uses `new Date(y, m-1, d)` (local midnight) | ✅ Correct — the problem is inconsistent usage elsewhere |
| **`Math.random` Safety** | Only in visual effects (SkiaFallingStarNotification, SkiaWarpTransition, CosmicBackground) | ✅ Not used in any scoring or data logic |
| **No Tracking SDKs** | Zero hits for Firebase, Amplitude, Mixpanel, Sentry, Crashlytics, or any analytics SDK | ✅ Matches "zero analytics SDKs" claim |

---

## E. Calculation Engine Validation

| Engine | File | Status |
|---|---|---|
| Natal chart | `services/astrology/calculator.ts` | ✅ Swiss Ephemeris primary, JS fallback. Real longitudes. |
| Aspects | `calculator.ts` L700+ | ✅ Standard orb formula: `strength = max(0, 1 - orb/maxOrb)`. Division guarded with `\|\| 8`. |
| Transit overlay | `calculator.ts` | ✅ Same engine for transits. |
| Moon phase | `utils/moonPhase.ts` | ✅ Metonic cycle calculation. |
| Mood averages | `mood.tsx` L530–535 | ✅ Guarded: `.filter(l => data[l].moods.length >= 1)` before division. |
| Growth averages | `growth.tsx` L142 | ✅ Guarded: `arr.length > 0 ? reduce/length : null`. |
| Tag analytics | `utils/tagAnalytics.ts` | ✅ Lift/impact/correlation math with proper guards. |
| Sleep stats | `sleep.tsx` | ⚠️ UTC date comparison in `formatDate()` (H-02). |
| Insight trends | `utils/insightsEngine.ts` | ⚠️ UTC date key (H-01) + ENERGY_MAP mismatch (H-06). |
| Daily loop | `services/today/dailyLoop.ts` | ⚠️ Different ENERGY_MAP/STRESS_MAP values than pipeline.ts (H-06). |

---

## F. Privacy / Terms / FAQ Consistency

| Claim | Where Stated | Verified? | Notes |
|---|---|---|---|
| "AES-256-GCM encryption" | privacy.tsx, terms.tsx, faq.tsx, settings | ✅ | Implemented in `fieldEncryption.ts`. But legacy XOR and plaintext lat/lng remain. |
| "Zero analytics SDKs" | privacy.tsx, faq.tsx | ✅ | No Firebase, Amplitude, Mixpanel, Sentry, Crashlytics found. |
| "No advertising identifiers" | privacy.tsx | ✅ | No IDFA/GAID usage. |
| "No cross-app tracking" | privacy.tsx, terms.tsx | ✅ | `NSPrivacyTracking: false`. No tracking domains. |
| "Data stored locally" | privacy.tsx, terms.tsx | ✅ | SQLite + SecureStore + AsyncStorage — all on-device. Supabase optional. |
| "RevenueCat: anonymous device ID only" | privacy.tsx | ✅ | Confirmed — no PII sent to RevenueCat. |
| "City name geocoding via OpenStreetMap" | faq.tsx | ✅ | Nominatim API confirmed. **But**: privacy.tsx says "Coarse Location: For timezone resolution via on-device tz-lookup (not GPS tracking)" — this underdescribes the Nominatim geocoding of user-typed birth city. |
| "AI reflections: aggregated stats only" | faq.tsx | ✅ | Payload verified — no PII. Only mood/energy/stress aggregates + tag lift scores. |
| "All data types not linked to identity" | privacy.tsx | ⚠️ | True for App Store privacy labels, but Supabase auth links email to user_id. If user signs in, data is linkable server-side. |
| "Delete all data" removes everything | settings, privacy.tsx | ❌ | AsyncStorage, reflection cache, Supabase auth session survive deletion (C-07). |
| "Export your data" includes all data | settings, privacy.tsx | ❌ | Missing check-ins, sleep, relationships (C-06). |

---

## G. Priority Patches

### Patch 1 — Fix UTC Date Bug (H-01 through H-05)

Replace all `toISOString().split('T')[0]` and `.toISOString().slice(0,10)` with `toLocalDateString()` from `dateUtils.ts`.

**Files to fix:**
- [utils/insightsEngine.ts](utils/insightsEngine.ts#L338) — L338, L1783
- [app/(tabs)/sleep.tsx](app/(tabs)/sleep.tsx#L181) — L181, L184
- [app/(tabs)/energy.tsx](app/(tabs)/energy.tsx#L141) — L141
- [app/(tabs)/mood.tsx](app/(tabs)/mood.tsx#L134) — L134
- [app/astrology-context.tsx](app/astrology-context.tsx#L249) — L249
- [app/(tabs)/growth.tsx](app/(tabs)/growth.tsx#L133) — L133–134

```ts
// BEFORE (wrong — UTC):
const today = new Date().toISOString().slice(0, 10);

// AFTER (correct — local timezone):
import { toLocalDateString } from '../utils/dateUtils';
const today = toLocalDateString(new Date());
```

### Patch 2 — Complete GDPR Export (C-06)

```ts
// In services/privacy/privacyComplianceManager.ts handleExportRequest():
// ADD after existing exports:
const checkIns = await localDb.getCheckIns(chartId, 9999);
const sleepEntries = await localDb.getSleepEntries(chartId, 9999);
const relationships = await localDb.getRelationshipCharts(chartId);

return {
  ...existingExport,
  checkIns,
  sleepEntries,
  relationships,
};
```

### Patch 3 — Complete Delete All Data (C-07)

```ts
// In services/privacy/privacyComplianceManager.ts handleDeletionRequest():
// ADD after existing deletion:
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

await AsyncStorage.clear();
await SecureStore.deleteItemAsync('mysky_reflection_insights_v2');
try { await supabase.auth.signOut(); } catch {}
```

### Patch 4 — Fix HMAC Construction (C-01)

```ts
// In services/storage/encryptionManager.ts:
// BEFORE:
const hash = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  `${key}:${data}`
);

// AFTER (proper HMAC):
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

const keyBytes = new TextEncoder().encode(key);
const dataBytes = new TextEncoder().encode(data);
const hash = bytesToHex(hmac(sha256, keyBytes, dataBytes));
```

### Patch 5 — Stop HMAC Bypass on Failure (C-02)

```ts
// In services/storage/secureStorage.ts getEncryptedItem() catch block:
// BEFORE:
} catch (e) {
  logger.warn('Integrity check failed, re-signing data');
  // ... auto-recovery that re-signs tampered data
}

// AFTER:
} catch (e) {
  logger.error('Integrity check FAILED — possible tampering', { key });
  throw new Error(`Data integrity violation for key: ${key}`);
}
```

### Patch 6 — Delete Dead Code

```bash
rm services/premium/feedbackHandlerExample.ts
rm services/premium/supabaseDreamModelService.ts
rm services/premium/adaptiveLearning.ts
rm services/premium/dreamInterpretation.legacy.ts
rm components/journal/SkiaBreathJournal.tsx
```

### Patch 7 — Unify ENERGY_MAP / STRESS_MAP (H-06)

Extract canonical maps to a shared constants file and import everywhere:

```ts
// constants/scoreMaps.ts
export const ENERGY_MAP: Record<string, number> = {
  very_low: 1, low: 2.5, moderate: 5, high: 7.5, very_high: 10,
};
export const STRESS_MAP: Record<string, number> = {
  very_low: 1, low: 2.5, moderate: 5, high: 7.5, very_high: 10,
};
```

Import in: `services/insights/pipeline.ts`, `services/today/dailyLoop.ts`, `utils/insightsEngine.ts`.

### Patch 8 — Validate Nominatim Response (H-11)

```ts
// In components/BirthDataModal.tsx, after fetch:
const data = await response.json();
if (!Array.isArray(data)) {
  logger.warn('Nominatim returned unexpected response shape');
  setLocationSuggestions([]);
  return;
}
setLocationSuggestions(data);
```

### Patch 9 — Add Logging to Non-Haptic Empty Catches (M-01 through M-07)

Replace `catch {}` with `catch (e) { logger.warn('...context...', e); }` in:
- `settings/index.tsx` (10 instances — AsyncStorage writes)
- `JournalEntryModal.tsx` (5 instances)
- `sleep.tsx` (3 instances — JSON parsing)
- `chart.tsx` (2 instances)
- `journal.tsx` (3 instances)
- `relationships.tsx` (1 instance)

### Patch 10 — Encrypt Lat/Lng (H-10)

```ts
// In services/storage/localDb.ts, modify saveChart() to encrypt lat/lng:
await FieldEncryptionService.encryptField(String(chart.lat));
await FieldEncryptionService.encryptField(String(chart.lng));
// And decrypt in getCharts()
```

---

## H. Summary Statistics

| Category | Count |
|---|---|
| Total findings | **58** |
| Critical | 10 |
| High | 16 |
| Medium | 20 |
| Low | 12 |
| Verified Passes | 8 |
| Dead code files | 5 (~725 LOC) |
| Empty `catch {}` (non-haptic) | 25 |
| `as any` casts | 38 (5 hiding real type gaps) |
| UTC date bug locations | 8 |
| Unique `fetch()` destinations | 4 |
| Missing from GDPR export | 3 tables |
| Missing from Delete All | 3 stores |
