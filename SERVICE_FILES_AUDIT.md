# MySky Services Directory — Comprehensive Audit Report

**Scope:** All files under `/services/` (10 subdirectories, ~70 files)  
**Categories:** TypeScript errors, bugs, logic issues, missing exports, broken imports, undefined variables, type mismatches, dead code, missing error handling, incomplete files, inconsistencies, null/undefined check gaps, security concerns

---

## Table of Contents

1. [astrology/](#1-astrology)
2. [energy/](#2-energy)
3. [insights/](#3-insights)
4. [journal/](#4-journal)
5. [patterns/](#5-patterns)
6. [premium/](#6-premium)
7. [privacy/](#7-privacy)
8. [storage/](#8-storage)
9. [today/](#9-today)
10. [Cross-Cutting Issues](#10-cross-cutting-issues)

---

## 1. astrology/

### Issue 1.1 — `as any` casts on untyped library (transits.ts)

**Files:** `services/astrology/transits.ts` lines 58, 114, 155, 158–159  
**Category:** Type safety  
**Description:** `circular-natal-horoscope-js` has no TypeScript declarations. The code accesses `(horoscope as any).CelestialBodies`, `(p as any).absoluteDegree`, `(p as any).sign`, etc., scattered throughout the file. If the library updates its internal property names (e.g., `CelestialBodies` renamed to `celestialBodies`), all accesses silently break at runtime.  
**Suggested Fix:** Create a local `types/circular-natal-horoscope.d.ts` declaration file mapping the known API surface (Origin, Horoscope, CelestialBodies, etc.). Replace all `as any` casts with typed accesses. At minimum, centralise access behind a helper wrapper that validates key shapes.

---

### Issue 1.2 — Same `as any` pattern duplicated (dailyInsightEngine.ts)

**File:** `services/astrology/dailyInsightEngine.ts` line 1159  
**Category:** Type safety  
**Description:** `(horoscope as any).CelestialBodies` is used identically to `transits.ts` but in a separate file. Same breakage risk, doubled.  
**Suggested Fix:** Share a single typed wrapper for `circular-natal-horoscope-js` between `transits.ts` and `dailyInsightEngine.ts`.

---

### Issue 1.3 — `shadowQuotes.ts` creates its own SQLite table outside migration system

**File:** `services/astrology/shadowQuotes.ts` lines 628–637  
**Category:** Inconsistency / potential data integrity  
**Description:** `getDb()` runs `CREATE TABLE IF NOT EXISTS shadow_quotes_shown` inline rather than through the migration system in `localDb.ts` (which manages `CURRENT_DB_VERSION` and versioned migrations). This table is invisible to the migration framework, meaning it won't be included in backup/restore operations and won't be dropped/recreated on schema version bumps.  
**Suggested Fix:** Move the `shadow_quotes_shown` table creation into the migration chain in `localDb.ts` at the next version increment.

---

### Issue 1.4 — Domain cast to `any` in shadow signal conversion

**File:** `services/astrology/shadowQuotes.ts` line 867  
**Category:** Type safety  
**Description:** `domain: (PLANET_TO_DOMAIN[a.pointB] || PLANET_TO_DOMAIN[a.pointA] || 'mood') as any` casts the domain to `any` instead of using the proper domain type from the transit system.  
**Suggested Fix:** Import or define the `LifeDomain` type and cast to that instead, or use a type guard.

---

### Issue 1.5 — Chiron/Node transit proxy logic makes assumptions

**File:** `services/astrology/shadowQuotes.ts` lines 688–691  
**Category:** Logic issue  
**Description:** `hasChiron` is derived as `hasSaturnAspect || dayIntensity === 'deep'`, and `hasNodeAxis` equals `hasOpposition`. These are proxy heuristics (commented as "Since Chiron/Nodes aren't in the transit engine yet") but they conflate distinct astrological phenomena. Any Saturn aspect triggers Chiron quotes; any opposition triggers Node axis quotes. This produces semantically incorrect quote selections.  
**Suggested Fix:** Add a TODO or feature flag making this explicit. Consider tightening — e.g., only flag `hasChiron` when Saturn aspects Moon or Sun specifically, rather than any Saturn aspect.

---

### Issue 1.6 — `detectActivations` silently swallows chart pattern errors

**File:** `services/astrology/shadowQuotes.ts` lines 659–668  
**Category:** Missing error handling  
**Description:** `detectChartPatterns(chart)` is wrapped in a bare `catch {}` block. If chartPatterns throws due to malformed data, stellium detection silently fails with an empty array, producing potentially misleading "no stellium" results. No logging occurs.  
**Suggested Fix:** Add `logger.warn` inside the catch block so failures are observable in telemetry.

---

### Issue 1.7 — `synastryEngine.ts` aspect-type lookup relies on case-sensitive find

**File:** `services/astrology/synastryEngine.ts` lines 710–717  
**Category:** Potential bug  
**Description:** `ASPECT_TYPES.find((at) => this.normalizeAspectName(at.name) === aspect.name)` — the `normalizeAspectName` is only applied to `at.name`, not to `aspect.name`. If the constant names in `ASPECT_TARGETS` and `ASPECT_TYPES` ever diverge in casing, the find returns `undefined` and the aspect is silently dropped.  
**Suggested Fix:** Normalise both sides: `this.normalizeAspectName(at.name) === this.normalizeAspectName(aspect.name)`.

---

### Issue 1.8 — `calculator.ts` uses `as any` for planet lookup

**File:** `services/astrology/calculator.ts` line 80  
**Category:** Type safety  
**Description:** `ensurePointPlanet(planetName as any)` bypasses the type system for chart points (Ascendant, Midheaven). If `planetName` is an unexpected string, `ensurePointPlanet` may produce incorrect output.  
**Suggested Fix:** Define a union type for valid point names and narrow before casting.

---

### Issue 1.9 — `humanGuidance.ts` generates greeting that varies by hour (non-deterministic)

**File:** `services/astrology/humanGuidance.ts` lines 1243–1251  
**Category:** Inconsistency  
**Description:** `generateDailyGuidance` uses `date.getHours()` for the greeting, making the output vary depending on when the function is called within the same day. This conflicts with the comment describing deterministic day-based output. Caching the result would return a stale greeting if fetched in the morning and re-displayed in the evening.  
**Suggested Fix:** Either remove the time-of-day greeting variation (use a day-deterministic greeting), or document that this method should not be cached.

---

### Issue 1.10 — `energyEngine.ts` accesses chart with dynamic key via `as any`

**File:** `services/energy/energyEngine.ts` line 841  
**Category:** Type safety  
**Description:** `(chart as any)[key]` uses dynamic property access to discover which planets exist on the chart object. If chart property names change, this silently produces `undefined`.  
**Suggested Fix:** Use a typed helper or explicit property list (`chart.sun`, `chart.moon`, etc.) instead of dynamic key access.

---

## 2. energy/

### Issue 2.1 — No issues found beyond Issue 1.10 above

The `energyEngine.ts` file is well-structured with proper error handling and fallback patterns. The `as any` dynamic key access is covered in Issue 1.10.

---

## 3. insights/

### Issue 3.1 — Silent catch blocks in insight pipeline

**File:** `services/insights/pipeline.ts` lines 94, 101, 108  
**Category:** Missing error handling  
**Description:** Three `catch { /* ignore parse errors */ }` blocks silently swallow JSON parse failures. If corrupted data enters the pipeline, these create invisible data loss — the insight is simply skipped with no telemetry.  
**Suggested Fix:** Add `logger.debug` or `logger.warn` inside the catch blocks to enable debugging production issues.

---

## 4. journal/

### Issue 4.1 — No significant issues found

The journal service files (`journalAnalysis.ts`, `sentimentAnalysis.ts`, `nlpEngine.ts`, etc.) are well-structured with proper error handling and type usage.

---

## 5. patterns/

### Issue 5.1 — `checkInService.ts` has silent catch

**File:** `services/patterns/checkInService.ts` line 36  
**Category:** Missing error handling  
**Description:** Bare `catch {}` block when loading check-in data. If the database query fails, the function returns a default/empty result with no diagnostic information.  
**Suggested Fix:** Add `logger.error` to the catch block.

---

## 6. premium/

### Issue 6.1 — **CRITICAL:** Duplicate `generateDreamInterpretation` exports with incompatible signatures

**Files:**  
- `services/premium/dreamInterpretation.ts` line 523  
- `services/premium/dreamInterpretation.legacy.ts` line 396  

**Category:** Naming conflict / broken imports  
**Description:** Both files export a function named `generateDreamInterpretation` but with completely different signatures and return types:

- **v3 (dreamInterpretation.ts):** `(input: DreamInterpretationInput) => DreamInterpretation` — returns `{ paragraph, question, explicitImagery, interpretiveThemes }`
- **Legacy:** `(entry, dreamText, dreamMood, chart, recentCheckIns, recentJournalEntries) => DreamInterpretation` — returns `{ symbolLabels, reflection, innerLandscape, somethingToSitWith }`

The app imports from `dreamInterpretation.ts` (confirmed in `app/(tabs)/sleep.tsx` line 41), so the legacy file is currently unused. However, any file accidentally importing from the wrong path will get a function with a completely different API, causing runtime crashes.  

**Suggested Fix:** Rename the legacy export to `generateDreamInterpretationLegacy` or add a deprecation notice and barrel export that makes the distinction explicit.

---

### Issue 6.2 — **Inconsistent signal weights** between two dream engines

**Files:**  
- `services/premium/dreamInterpretation.ts` lines 49–54: `text: 0.55, feelings: 0.25`  
- `services/premium/dreamSynthesisEngine.ts` lines 5–9: `feelings: 0.60, text: 0.20`  

**Category:** Logic inconsistency  
**Description:** The two engines that interpret dreams use radically different priorities. `dreamInterpretation.ts` weighs text at 0.55 (text-first), while `dreamSynthesisEngine.ts` weighs feelings at 0.60 (feelings-first). Both claim to be the authoritative dream engine. This means the same dream input could produce very different interpretations depending on which code path is taken.  
**Suggested Fix:** Decide on a canonical weight set and use shared constants. If both engines serve different purposes, document why they intentionally differ.

---

### Issue 6.3 — `ShadowTrigger` type defined 4 separate times

**Files:**  
- `services/premium/dreamTypes.ts` line 32 (canonical)  
- `services/premium/dreamTextExtractor.ts` line 17 (local redeclaration)  
- `services/premium/triggerTaxonomy22.ts` line 9 (separate definition)  
- `services/premium/themeDefinitions.ts` line 26 (re-export alias)  

**Category:** Type duplication / drift risk  
**Description:** The `ShadowTrigger` union type is defined independently in 4 files. If a trigger is added to one definition but not others, type checking will pass in files using the outdated definition while runtime behavior diverges. The `dreamTextExtractor.ts` copy is particularly dangerous because it has its own local list that could drift from `dreamTypes.ts`.  
**Suggested Fix:** Designate `dreamTypes.ts` as the single source of truth. All other files should `import type { ShadowTrigger } from './dreamTypes'`. The `triggerTaxonomy22.ts` definition, if distinct, should be given its own name (e.g., `TaxonomyShadowTrigger`).

---

### Issue 6.4 — `dreamSynthesisEngine.ts` re-exports types under different names

**File:** `services/premium/dreamSynthesisEngine.ts` lines 28–36  
**Category:** Confusing exports  
**Description:** Types from `dreamTypes.ts` are re-exported with aliases: `AttachmentStyle` → `AttachmentTone`, `DreamFeelingDef` → `FeelingDefinition`, etc. Downstream consumers like `dreamRenderer.ts` import these aliases. This creates confusion about canonical type names and makes tracing types through the codebase harder.  
**Suggested Fix:** Import directly from `dreamTypes.ts` in downstream consumers rather than going through `dreamSynthesisEngine.ts` re-exports. Remove the aliases.

---

### Issue 6.5 — `dreamRenderer.ts` imports `ShadowTrigger` from synthesis engine re-export

**File:** `services/premium/dreamRenderer.ts` line 19  
**Category:** Fragile import chain  
**Description:** `import type { EngineOutput, SelectedFeeling, ShadowTrigger } from "./dreamSynthesisEngine"` — `ShadowTrigger` is actually defined in `dreamTypes.ts` and re-exported through `dreamSynthesisEngine.ts`. If the re-export is ever removed, this import breaks.  
**Suggested Fix:** Import `ShadowTrigger` directly from `dreamTypes.ts`.

---

### Issue 6.6 — `supabaseDreamModelService.ts` imports from re-export chain

**File:** `services/premium/supabaseDreamModelService.ts` line 15  
**Category:** Fragile import chain  
**Description:** `import type { ShadowTrigger } from "./dreamSynthesisEngine"` — same issue as 6.5.  
**Suggested Fix:** Import directly from `dreamTypes.ts`.

---

### Issue 6.7 — `supabaseDreamModelService.ts` doesn't validate user ID format

**File:** `services/premium/supabaseDreamModelService.ts`  
**Category:** Missing validation / security  
**Description:** `getOrCreateModel` fetches the user via `supabase.auth.getUser()` and uses `user.id` directly in an RPC call. There's no validation that the user ID is a valid UUID. If the auth layer returns a malformed user object, the RPC call could fail with an unhelpful error or worse.  
**Suggested Fix:** Add a UUID format check before the RPC call: `if (!user?.id?.match(/^[0-9a-f-]{36}$/i)) throw new Error('Invalid user ID')`.

---

### Issue 6.8 — `reflectionInsights.ts` falls back to anon key for auth

**File:** `services/premium/reflectionInsights.ts` (approx. line 113–123)  
**Category:** Security concern  
**Description:** When no user session token is available, the code falls back to the Supabase anon key for the Edge Function authorization header. The Edge Function likely requires a valid JWT to identify the user — sending the anon key will cause the function to either fail or process the request without user context. The error is silently caught.  
**Suggested Fix:** If no user token is available, fail fast with a clear error ("Premium feature requires authentication") instead of making a doomed network call.

---

### Issue 6.9 — `reflectionInsights.ts` cache key collision risk

**File:** `services/premium/reflectionInsights.ts`  
**Category:** Logic issue  
**Description:** The cache key is built from `SHA256(day + JSON.stringify(payload))` and stored in SecureStore. If the payload contains floating-point transit values that differ by tiny amounts between calls on the same day (e.g., due to slightly different calculation times), the hash won't match and the cache is bypassed, causing unnecessary Edge Function calls.  
**Suggested Fix:** Round numerical values in the payload before hashing, or use only the date + chart ID as the cache key.

---

### Issue 6.10 — `dreamAggregates.ts` Moon element mapping may be stigmatizing

**File:** `services/premium/dreamAggregates.ts` line ~164  
**Category:** Content / interpretation concern  
**Description:** `inferChartBias` maps Water Moon → `freeze` nervous system branch, Fire Moon → `fight`. These are default nervous system associations that present chart placements as fixed psychological traits. Telling a user their Water Moon means they default to "freeze" could be perceived as stigmatizing.  
**Suggested Fix:** Add softening language in the UI layer ("may tend toward" rather than "defaults to"), or use these only as minor baseline weights (which the current code does — weight 0.03) and document that intent clearly.

---

### Issue 6.11 — `adaptiveLearning.ts` learning rate always decays but never resets

**File:** `services/premium/adaptiveLearning.ts`  
**Category:** Logic issue  
**Description:** The learning rate decays with each update (`rate = BASE / (1 + DECAY * updateCount)`) but never resets. After hundreds of dream entries, the model effectively stops learning, even if the user's patterns genuinely change. This is intentional ("stabilise over time") but could cause the model to become "stuck."  
**Suggested Fix:** Consider a periodic rate reset or a "significant change" detector that bumps the rate when trigger distributions shift dramatically.

---

### Issue 6.12 — `pdfExport.ts` temp file cleanup could fail silently

**File:** `services/premium/pdfExport.ts` (end of `exportChartToPdf`)  
**Category:** Resource leak  
**Description:** After sharing the PDF, the temp file is deleted with `FileSystem.deleteAsync`. If sharing throws, the catch block doesn't attempt cleanup, potentially leaving temp files accumulating in the cache directory.  
**Suggested Fix:** Move the `deleteAsync` call into a `finally` block to ensure cleanup regardless of sharing success.

---

### Issue 6.13 — `dreamArchetypeStats.ts` imports from `constants/dreamSymbols`

**File:** `services/premium/dreamArchetypeStats.ts`  
**Category:** Import dependency direction  
**Description:** This service file imports from `constants/dreamSymbols`, which creates a dependency from the `services/` layer to the `constants/` layer. While not technically wrong, it's the only premium service that reaches into `constants/` — all others use local type/data files. This could cause issues if the constants are restructured.  
**Suggested Fix:** Consider extracting the needed archetype mappings into the premium service directory, or accept this as a deliberate cross-layer dependency.

---

### Issue 6.14 — `todayContentEngine.ts` creates its own SQLite table outside migration system

**File:** `services/today/todayContentEngine.ts` line 36  
**Category:** Same as Issue 1.3  
**Description:** Same pattern as `shadowQuotes.ts` — `getDb()` creates `today_content_shown` table via `CREATE TABLE IF NOT EXISTS` outside the migration framework.  
**Suggested Fix:** Same as 1.3 — incorporate into the migration chain.

---

## 7. privacy/

### Issue 7.1 — No significant issues found

The privacy service files (`privacyComplianceManager.ts`, `lawfulBasisAudit.ts`, `consentManager.ts`, `dataRetentionService.ts`, `privacyDashboard.ts`) are well-structured with comprehensive consent tracking, audit trails, and GDPR-compliant workflows. Error handling is thorough.

---

## 8. storage/

### Issue 8.1 — `secureStorage.ts` uses deprecated `encryptSensitiveData`/`decryptSensitiveData`

**File:** `services/storage/secureStorage.ts` lines 339, 349  
**Category:** Deprecated API usage  
**Description:** `setEncryptedItem` calls `EncryptionManager.encryptSensitiveData()` which is marked `@deprecated` in `encryptionManager.ts` (lines 115, 108). The deprecated methods are "kept for migration only."  
**Suggested Fix:** Migrate `setEncryptedItem` to use `EncryptionManager.signSensitiveData()` and update `getEncryptedItem` to use `verifySensitiveData()` (which it already does at line 373). This creates a read/write asymmetry — writes use the deprecated method while reads use the new one. Align both.

---

### Issue 8.2 — HMAC integrity failure returns `null` (silent data loss)

**File:** `services/storage/secureStorage.ts` lines 374–387  
**Category:** Silent data loss / security  
**Description:** When HMAC verification fails and recovery also fails, `getEncryptedItem` returns `null`. Callers like `getCharts()` treat `null` as "no data" and return `[]`. The user's charts silently disappear. There's a `logger.error` call, but no user-facing indication that data was lost due to an integrity failure.  
**Suggested Fix:** Consider throwing an integrity error that can be caught at a higher level and shown to the user as "your data may have been corrupted — try restoring from backup." At minimum, track the number of integrity failures in a diagnostic counter.

---

### Issue 8.3 — SecureStore progressive trimming can silently lose data

**File:** `services/storage/secureStorage.ts` lines 344–352  
**Category:** Silent data loss  
**Description:** When encrypted data exceeds the 2KB soft limit and the value is an array, the code progressively trims the array (`trimmed.slice(-Math.max(1, Math.floor(trimmed.length * 0.75)))`) until it fits. The trimming strategy keeps the **last 75%** of items on each pass, effectively losing the oldest entries. But there's a bug: `slice(-N)` keeps the last N items, while `Math.floor(trimmed.length * 0.75)` is 75% of the current length. After one pass of a 100-item array, you keep 75 items. After another pass, 56 items. This converges, but the user is never notified their data was trimmed.  
**Suggested Fix:** Log the data that was trimmed at `logger.warn` level (already done partially), but also consider surfacing a diagnostic to the user. More importantly, the code should migrate large datasets to SQLite (which `localDb.ts` already supports) rather than force-fitting into SecureStore.

---

### Issue 8.4 — `encryptionManager.ts` silent catch blocks

**File:** `services/storage/encryptionManager.ts` lines 89, 134  
**Category:** Missing error handling  
**Description:** Both `decryptSensitiveData` and `tryParseSensitiveData` have bare `catch {}` blocks that return `null` on any error. Encryption failures (wrong key, corrupted ciphertext, invalid nonce) are all treated identically with no diagnostic.  
**Suggested Fix:** Add `logger.error` with the error object for debugging, while still returning `null` to maintain the graceful degradation behavior.

---

### Issue 8.5 — `backupService.ts` uses `(globalThis as any)?.crypto` for WebCrypto

**File:** `services/storage/backupService.ts` line 98  
**Category:** Type safety / platform compatibility  
**Description:** WebCrypto access via `(globalThis as any)?.crypto` bypasses type checking. On some React Native environments, `globalThis.crypto` may be `undefined` or an incomplete polyfill (e.g., missing `subtle`).  
**Suggested Fix:** Use a typed check: `const crypto = typeof globalThis !== 'undefined' && globalThis.crypto?.subtle ? globalThis.crypto : undefined;` and fail fast with a clear error if unavailable.

---

### Issue 8.6 — `backupService.ts` file size check via `as any`

**File:** `services/storage/backupService.ts` line 314  
**Category:** Type safety  
**Description:** `(fileInfo as any).size > MAX_BACKUP_SIZE` — the `FileSystem.getInfoAsync` return type from expo-file-system does include `size` on the `exists: true` branch, but the code casts to `any` instead of narrowing properly.  
**Suggested Fix:** Check `fileInfo.exists` first, then access `fileInfo.size` directly (it's typed on the `exists: true` discriminated union).

---

### Issue 8.7 — `localDb.ts` uses `as any` for PRAGMA results and null casts

**File:** `services/storage/localDb.ts` lines 64, 81, 105, 263  
**Category:** Type safety  
**Description:** Multiple `as any` casts for `PRAGMA table_info` results, `PRAGMA user_version`, and `null as any` for default values. The PRAGMA results have a known shape that could be typed.  
**Suggested Fix:** Define interfaces for PRAGMA results: `interface PragmaTableInfo { cid: number; name: string; type: string; ... }` and `interface PragmaUserVersion { user_version: number }`.

---

### Issue 8.8 — `fieldEncryption.ts` uses `as any` for dynamic field access

**File:** `services/storage/fieldEncryption.ts` lines 427, 446  
**Category:** Type safety  
**Description:** `(result as any)[fieldName] = await this.encryptField(value)` uses `as any` to write dynamic field names. While necessary for the generic encryption API, this disables all type checking on the result object.  
**Suggested Fix:** Use a generic with `Record<string, EncryptedField | string>` return type, or use `Object.defineProperty` with proper typing.

---

### Issue 8.9 — `insightHistory.ts` silent catch block

**File:** `services/storage/insightHistory.ts` line 215  
**Category:** Missing error handling  
**Description:** Bare `catch {}` block when loading insight history. Failed loads are indistinguishable from empty history.  
**Suggested Fix:** Add `logger.warn` or `logger.error` in the catch block.

---

## 9. today/

### Issue 9.1 — `todayContentEngine.ts` creates table outside migration system

See Issue 6.14 above.

---

### Issue 9.2 — `todayContentEngine.ts` triple silent catch blocks

**File:** `services/today/todayContentEngine.ts` lines 154, 242, 272  
**Category:** Missing error handling  
**Description:** Three bare `catch {}` blocks for database operations (loading shown content IDs, marking content as shown, cleanup). Failures are completely invisible.  
**Suggested Fix:** Add `logger.warn` to each catch block.

---

## 10. Cross-Cutting Issues

### Issue 10.1 — Two independent SQLite table creation patterns outside migration system

**Files:**  
- `services/astrology/shadowQuotes.ts` line 628 (`shadow_quotes_shown`)  
- `services/today/todayContentEngine.ts` line 36 (`today_content_shown`)  

**Category:** Architectural inconsistency  
**Description:** Both files create their own tables with `CREATE TABLE IF NOT EXISTS` inline, bypassing the migration system in `localDb.ts`. This means:
- These tables won't be backed up/restored via `backupService.ts` (which uses the migration-managed schema)
- Schema changes to these tables require code changes rather than migration scripts
- The tables are invisible to the `localDb.ts` version tracking  

**Suggested Fix:** Consolidate all table creation into `localDb.ts` migrations.

---

### Issue 10.2 — Pervasive `catch {}` anti-pattern (12+ occurrences)

**Files:** `swissEphemerisEngine.ts`, `timezoneHandler.ts`, `calculator.ts`, `shadowQuotes.ts`, `dreamAggregates.ts`, `reflectionInsights.ts`, `todayContentEngine.ts`, `checkInService.ts`, `encryptionManager.ts`, `insightHistory.ts`, `pipeline.ts`  
**Category:** Missing error handling  
**Description:** At least 20 bare `catch {}` or `catch { }` blocks across the service directory. These create invisible failure modes where:
- Database queries fail silently
- Encryption/decryption errors are swallowed
- Transit calculations fail without diagnostics
- JSON parse errors disappear  

**Suggested Fix:** Audit all bare catch blocks and add at minimum `logger.warn` calls. For critical paths (encryption, database), consider re-throwing after logging, or using a telemetry/diagnostic counter.

---

### Issue 10.3 — No consistent error boundary pattern

**Category:** Architecture  
**Description:** Some services throw errors (e.g., `requireConsent` in `secureStorage.ts`), some return `null` on failure (e.g., `getEncryptedItem`), and some return `[]` (e.g., `getCharts`). Callers can't distinguish between "no data exists" and "data exists but couldn't be read."  
**Suggested Fix:** Establish a consistent error handling convention:
- Use a `Result<T, E>` pattern or custom error types
- At minimum, distinguish `null` (no data) from Error (failed to read)

---

### Issue 10.4 — `circular-natal-horoscope-js` has no type declarations

**Category:** Type safety (affects `transits.ts`, `dailyInsightEngine.ts`)  
**Description:** The third-party library `circular-natal-horoscope-js` has no TypeScript declarations, leading to `as any` casts throughout the astrology service. This is the root cause of Issues 1.1 and 1.2.  
**Suggested Fix:** Create `/types/circular-natal-horoscope-js.d.ts` with declarations for `Origin`, `Horoscope`, `CelestialBodies`, etc.

---

### Issue 10.5 — `ShadowTrigger` type fragmentation across 4 files

See Issue 6.3 above. This is the highest-risk type duplication in the codebase.

---

### Issue 10.6 — Dream engine signal weight inconsistency

See Issue 6.2 above. The two active dream interpretation paths use incompatible scoring weights.

---

### Issue 10.7 — Test exports leaked to production bundles

**Files:**  
- `services/premium/dreamSynthesisEngine.ts` line 571: `export const __test = { ... }`
- `services/premium/dreamInterpretation.ts` (similar `__test` export)  

**Category:** Dead code / bundle size  
**Description:** `__test` exports expose internal functions (`scoreFeelings`, `blendTriggerScores`, etc.) for testing. These are included in the production bundle since they're unconditional exports.  
**Suggested Fix:** Gate behind `process.env.NODE_ENV !== 'production'` or move to separate test helper files that import from the source. Alternatively, use `@internal` JSDoc tags and configure the bundler to tree-shake.

---

### Issue 10.8 — `dreamInterpretation.legacy.ts` is dead code

**File:** `services/premium/dreamInterpretation.legacy.ts` (entire file, ~350 lines)  
**Category:** Dead code  
**Description:** No file in the codebase imports from `dreamInterpretation.legacy.ts`. The app uses `dreamInterpretation.ts` (confirmed by `sleep.tsx` import). The legacy file adds 350 lines to the bundle and maintenance surface for no benefit.  
**Suggested Fix:** Remove the file, or move it to a `__legacy/` directory excluded from the build.

---

### Issue 10.9 — `feedbackHandlerExample.ts` is example code in production

**File:** `services/premium/feedbackHandlerExample.ts` (~85 lines)  
**Category:** Dead code / incomplete  
**Description:** The filename itself indicates this is example/reference code. It imports real services (`supabaseDreamModelService`, `adaptiveLearning`) but isn't imported by any other file. If it was meant to be integrated, it's incomplete. If it's reference code, it shouldn't be in the production source tree.  
**Suggested Fix:** Either integrate it into the actual feedback flow, or move it to a `docs/` or `examples/` directory.

---

## Summary

| Severity    | Count | Key Areas |
|-------------|-------|-----------|
| **Critical**    | 1     | Duplicate `generateDreamInterpretation` exports (#6.1) |
| **High**        | 5     | Signal weight inconsistency (#6.2), ShadowTrigger fragmentation (#6.3), deprecated API usage (#8.1), HMAC silent data loss (#8.2), silent data trimming (#8.3) |
| **Medium**      | 12    | `as any` casts (#1.1, 1.2, 1.4, 8.5–8.8), bare catch blocks (#10.2), SQLite outside migrations (#10.1), proxy Chiron/Node logic (#1.5), auth fallback (#6.8) |
| **Low**         | 10    | Dead code (#10.8, 10.9), test exports in prod (#10.7), re-export aliases (#6.4), cache key collision (#6.9), content concerns (#6.10), learning rate (#6.11), temp file cleanup (#6.12), import direction (#6.13), non-deterministic greeting (#1.9) |

**Total issues identified: 28**
