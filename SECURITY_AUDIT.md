# MySky — Journal-Content Security & Privacy Audit

**Date:** 2025-01-27
**Scope:** All paths where journal content, dream text, mood check-ins, birth data, or derivative analytics are stored, transmitted, cached, or logged.
**Threat model:** Journal content is treated as health data / highly sensitive PII.

---

## Executive Summary

The codebase has **strong security fundamentals**. All journal, dream, check-in, birth, and insight data is AES-256-GCM encrypted before SQLite storage. The DEK never appears in logs. Supabase RLS is correctly enforced on all 8 tables. No `console.log` calls exist outside the centralized logger. One **P1 issue** was found (insights cache writing unencrypted derivative health data to disk) and has been patched. Seven **P2 structural improvements** were identified; three have been patched.

---

## P0 — Critical Data Leaks

**None found.** No active production data leaks were discovered.

---

## P1 — High-Severity Issues

### P1-1: Insights cache wrote unencrypted derivative health data to disk

| Field | Detail |
|-------|--------|
| **File** | `services/insights/cache.ts` |
| **Risk** | `InsightBundle` (mood patterns, journal theme summaries, note keywords) was serialized as plaintext JSON to `insights_bundle_v2.json` in the app cache directory. On a jailbroken/rooted device or via an iTunes backup, this file would expose sensitive health analytics. |
| **Status** | **PATCHED** |

**Patch applied:** Cache file is now encrypted with `FieldEncryptionService.encryptField()` before writing to disk and decrypted on read. If decryption fails (key rotation, corruption), the cache is treated as a miss and recomputed.

**Verification:**
1. Clear cache: delete `insights_bundle_v2.json` from device cache.
2. Trigger an insight recompute (change mood or journal).
3. Inspect file on disk — content should start with `ENC2:` (the AES-256-GCM prefix), not `{`.
4. Restart the app — insights should load from the encrypted cache without prompting recompute.

---

## P2 — Structural Improvements

### P2-1: Logger SENSITIVE_KEYS missing `stack`, `message`, `componentstack` — **PATCHED**

| Field | Detail |
|-------|--------|
| **File** | `utils/logger.ts` |
| **Risk** | Error boundaries log `{ name, message, stack }` objects. While error stacks don't typically contain raw user content, a future throw from within journal-processing code could embed user text in the `message` or `stack`. The `componentStack` string from React error boundaries is also unredacted. |

**Patch:** Added `'stack'`, `'message'`, `'componentstack'` to the `SENSITIVE_KEYS` array.

### P2-2: `checkInService` interpolated health data into error message — **PATCHED**

| Field | Detail |
|-------|--------|
| **File** | `services/patterns/checkInService.ts`, line ~164 |
| **Risk** | `throw new Error(\`Invalid moodScore: ${input.moodScore}\`)` embeds the raw user-supplied mood value into the error message, which may be logged by error boundaries. |

**Patch:** Changed to static message: `'Invalid moodScore: value is not a finite number'`.

### P2-3: `encryptionManager.ts` uses SHA256(key+data) instead of HMAC-SHA256

| Field | Detail |
|-------|--------|
| **File** | `services/storage/encryptionManager.ts` |
| **Risk** | `digestStringAsync(SHA256, hmacKey + ':' + data)` is vulnerable to length-extension attacks in theory. Practically unexploitable because the key is in SecureStore and the attacker cannot interact with the signing oracle. |
| **Recommendation** | When `expo-crypto` adds HMAC support, switch to proper HMAC-SHA256. Low urgency. |

### P2-4: PDF export writes unencrypted content to cache

| Field | Detail |
|-------|--------|
| **File** | `services/premium/pdfExport.ts` |
| **Risk** | Birth data and story content are written as a plaintext PDF to the cache directory during export. Cleanup is best-effort (`delete()` after share). |
| **Recommendation** | Inherent to the feature (users explicitly request the export). Consider encrypting the temp file and decrypting in a streaming share handler, or ensuring `delete()` is in a `finally` block. |

### P2-5: Logger redaction only works on object keys, not raw string arguments

| Field | Detail |
|-------|--------|
| **Risk** | If someone writes `logger.error("user content: " + rawText)`, the redaction engine won't catch it because it only inspects object keys. No current violations exist, but no structural guard prevents future ones. |
| **Recommendation** | Add a lint rule or code review guideline: "Never interpolate user content into logger string arguments; always pass as an object property." |

### P2-6: RevenueCat error leaks API key prefix

| Field | Detail |
|-------|--------|
| **File** | `services/premium/revenuecat.ts` |
| **Risk** | Error message includes the first 5 characters of the API key (`appl_` prefix for Apple). This is the well-known prefix and not secret, so risk is minimal. |

### P2-7: GDPR export shares raw JSON via Share.share

| Field | Detail |
|-------|--------|
| **File** | `components/PrivacySettingsModal.tsx` |
| **Risk** | `exportAllUserData()` returns decrypted plaintext via the OS share sheet. The content passes through the clipboard and any share-intent receiver. |
| **Recommendation** | Inherent to GDPR compliance (user explicitly requests their data). Consider offering the export as an encrypted archive with a user-provided passphrase. |

---

## Audit Results by Domain

### 1. Supabase RLS & RPC Functions — ✅ PASS

| Table | RLS | SELECT policy | INSERT policy | UPDATE policy | DELETE policy |
|-------|-----|--------------|--------------|--------------|--------------|
| `dream_models` | ✅ | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `dream_entries` | ✅ | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `dream_symbols` | ✅ | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `dream_arcs` | ✅ | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `dream_text_signals` | ✅ | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `model_feedback` | ✅ | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `shared_dream_links` | ✅ | *(public read)* | `auth.uid() = user_id` | — | `auth.uid() = user_id` |
| `dream_generation_log` | ✅ | `auth.uid() = user_id` | `auth.uid() = user_id` | — | — |

**RPC:** `ensure_user_dream_model()` — `SECURITY DEFINER`, `search_path = ''`, uses `auth.uid()` internally, `REVOKE ALL ON FUNCTION FROM public` + `GRANT EXECUTE TO authenticated`. ✅

**Key design note:** `dream_entries.encrypted_dream_text` is documented as *client-encrypted* before upload, and `dream_text_signals` intentionally omits the `evidence` field to prevent raw text from reaching the server. ✅

### 2. Local SQLite Encryption — ✅ PASS

All sensitive fields encrypted via `FieldEncryptionService.encryptField()` (AES-256-GCM):

| Data type | Encrypted fields |
|-----------|-----------------|
| Journal entries | `content`, `title`, `keywords`, `emotions`, `sentiment` |
| Dream/sleep entries | `dreamText`, `notes`, `dreamFeelings`, `dreamMetadata`, `dreamMood` |
| Mood check-ins | `moodScore`, `energyLevel`, `stressLevel`, `tags`, `note`, `wins`, `challenges` |
| Birth charts | `birthPlace`, `name`, `birthDate`, `birthTime` |
| Insight history | `greeting`, `messages`, `headlines`, `journalPrompt`, `signals` |

Encryption is **fail-closed**: `encryptField()` throws on failure rather than writing plaintext. ✅
Decryption is **fail-safe**: `decryptField()` returns `DECRYPTION_FAILED_PLACEHOLDER` on failure rather than crashing. ✅

### 3. Key Management — ✅ PASS

- DEK stored in `expo-secure-store` (iOS Keychain / Android Keystore). ✅
- DEK **never logged** anywhere in the codebase (grep-verified across ~197 logger calls). ✅
- `rotateKey()` returns `{ staged: true }` — never returns the raw DEK to callers. ✅
- `exportDek()` wraps the DEK with a caller-provided AES key before returning. ✅
- HMAC key for `EncryptionManager` stored in SecureStore, never exposed. ✅

### 4. Backup Encryption — ✅ PASS

- PBKDF2-SHA256 with 600K iterations derives a backup encryption key from user passphrase. ✅
- AES-256-GCM encrypts the full backup blob before writing to disk. ✅
- Backup file size validated before reading (guard against memory exhaustion). ✅

### 5. Logging & Analytics — ✅ PASS (with P2 notes)

- Centralized `logger.ts` redacts 40+ sensitive field names. ✅ (now 43+ with `stack`, `message`, `componentstack`)
- Production mode suppresses `debug` and `info` — only `warn`/`error` emitted. ✅
- No `console.log` calls exist outside `logger.ts`. ✅
- No raw journal/dream text found in any Alert.alert or Toast message. ✅
- No third-party analytics SDK receives user content. ✅

---

## Patches Applied in This Audit

| # | Severity | File | Change |
|---|----------|------|--------|
| 1 | **P1** | `services/insights/cache.ts` | Encrypt cache file at rest with AES-256-GCM |
| 2 | **P2** | `utils/logger.ts` | Add `stack`, `message`, `componentstack` to SENSITIVE_KEYS |
| 3 | **P2** | `services/patterns/checkInService.ts` | Remove health-data interpolation from error message |

All patches verified: **zero compile errors**.
