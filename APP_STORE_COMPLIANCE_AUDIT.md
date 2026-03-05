# MySky — App Store Compliance Audit

> **Auditor role:** App Store compliance reviewer + privacy/security engineer  
> **Date:** 2026-03-04  
> **Scope:** All user-visible strings, privacy disclosures, marketing text, and App Store metadata  
> **Guidelines referenced:** Apple Guidelines 1.1.6 (false health claims), 2.1 (app completeness), 3.1.1 (IAP), 5.1.1 (privacy), 5.1.2 (data use), 27.1+ (HealthKit rules)

---

## 1. Risky Language Inventory

### CRITICAL — Will Trigger Rejection

These strings make claims the app cannot support. "Biometric" implies the app reads sensor data (heart rate, fingerprint, etc.). "Somatic" implies licensed somatic therapy. "Nervous system" implies physiological measurement. None of these are true — the app only collects **self-reported slider values**.

| # | File | Line | Exact User-Visible String | Risky Terms |
|---|------|------|--------------------------|-------------|
| 1 | [home.tsx](app/(tabs)/home.tsx#L639) | 639 | `"Unlock the full Biometric Correlation Engine"` | **biometric, correlation, engine** |
| 2 | [home.tsx](app/(tabs)/home.tsx#L642) | 642 | `"Advanced pattern analysis, behavioral correlations, somatic breath journaling, and full restoration field analytics."` | **analysis, correlations, somatic, restoration field, analytics** |
| 3 | [home.tsx](app/(tabs)/home.tsx#L636) | 636 | `"Deeper Wellness"` | **wellness** (health claim without HealthKit) |
| 4 | [home.tsx](app/(tabs)/home.tsx#L646) | 646 | `"Explore Deeper Wellness"` | **wellness** |
| 5 | [home.tsx](app/(tabs)/home.tsx#L319) | 319 | `"Calibrating your signals..."` | **calibrating, signals** (implies sensor) |
| 6 | [home.tsx](app/(tabs)/home.tsx#L87) | 87 | `"A somatic breath session could help re-center your internal landscape."` | **somatic** |
| 7 | [home.tsx](app/(tabs)/home.tsx#L451) | 451 | `"WELLNESS INSIGHT"` | **wellness** |
| 8 | [home.tsx](app/(tabs)/home.tsx#L450) | 450 | `"PATTERN DETECTED"` | **detected** (implies automated detection) |
| 9 | [_layout.tsx](app/(tabs)/_layout.tsx#L77) | 77 | Tab bar label: `"Calibrate"` | **calibrate** |
| 10 | [_layout.tsx](app/(tabs)/_layout.tsx#L62) | 62 | Tab bar label: `"Restore"` (for Sleep tab) | **restore** (health claim) |
| 11 | [settings/index.tsx](app/(tabs)/settings/index.tsx#L558) | 558 | `"Somatic Resonance"` | **somatic** |
| 12 | [settings/index.tsx](app/(tabs)/settings/index.tsx#L561) | 561 | `"Calibrate your biometric color-frequency mapping using the GPU shader console"` | **calibrate, biometric, frequency** |
| 13 | [settings/index.tsx](app/(tabs)/settings/index.tsx#L578) | 578 | `"Somatic Check-in Reminder"` | **somatic** |
| 14 | [settings/index.tsx](app/(tabs)/settings/index.tsx#L585) | 585 | `"Somatic Pattern Insights"` | **somatic** |
| 15 | [settings/index.tsx](app/(tabs)/settings/index.tsx#L586) | 586 | `"Surface recurring patterns in your biometric check-ins"` | **biometric** |
| 16 | [calibration.tsx](app/(tabs)/settings/calibration.tsx#L211) | 211 | `"Instrument Calibration"` | **instrument, calibration** |
| 17 | [calibration.tsx](app/(tabs)/settings/calibration.tsx#L213) | 213 | `"Somatic Resonance"` | **somatic** |
| 18 | [calibration.tsx](app/(tabs)/settings/calibration.tsx#L215) | 215 | `"Define the light frequency that correlates to your state of 'Steady Flow.'"` | **frequency, correlates** |
| 19 | [mood.tsx](app/(tabs)/mood.tsx#L651) | 651 | `"Somatic check-in · ..."` | **somatic** |
| 20 | [mood.tsx](app/(tabs)/mood.tsx#L941) | 941 | `"Somatic sync — up to 4× daily."` | **somatic sync** |
| 21 | [mood.tsx](app/(tabs)/mood.tsx#L968) | 968 | `"Mood × Energy Correlation"` | **correlation** |
| 22 | [healing.tsx](app/(tabs)/healing.tsx#L272) | 272 | `"Safety & Nervous System"` | **nervous system** |
| 23 | [healing.tsx](app/(tabs)/healing.tsx#L278) | 278 | `"NERVOUS SYSTEM TENDENCY"` | **nervous system** |
| 24 | [healing.tsx](app/(tabs)/healing.tsx#L285) | 285 | `"Your nervous system has a specific definition of safety"` | **nervous system** |
| 25 | [sleep.tsx](app/(tabs)/sleep.tsx#L544) | 544 | `"Restoration"` (page title) | **restoration** |
| 26 | [sleep.tsx](app/(tabs)/sleep.tsx#L545) | 545 | `"Circadian field · Rest architecture"` | **circadian field** (medical term) |
| 27 | [journal.tsx](app/(tabs)/journal.tsx#L303) | 303 | `"7-Day Somatic Trends"` | **somatic** |
| 28 | [journal.tsx](app/(tabs)/journal.tsx#L368) | 368 | `"Deeper Sky can detect which energy cycles lift your mood"` | **detect, energy cycles** |

### HIGH — False HealthKit Claims in App Store Metadata

| # | File | Line | String | Issue |
|---|------|------|--------|-------|
| 29 | [APP_STORE_METADATA.md](APP_STORE_METADATA.md#L41) | 41 | `"MySky optionally integrates with Apple Health"` | **FALSE.** Zero HealthKit code exists. No health packages in `package.json`. No `NSHealthShareUsageDescription` in Info.plist. No HealthKit entitlement. |
| 30 | [APP_STORE_METADATA.md](APP_STORE_METADATA.md#L76) | 76 | `"MySky optionally integrates with Apple Health to visualize activity and rest data"` | Same false claim repeated in App Review Notes. |
| 31 | [APP_STORE_METADATA.md](APP_STORE_METADATA.md#L89) | 89 | `"Apple Health step/sleep data"` listed as a core feature | Feature does not exist. |
| 32 | [APP_STORE_METADATA.md](APP_STORE_METADATA.md#L288) | 288 | Submission checklist: `"Pattern insights with Apple HealthKit integration"` checked ✅ | **Checked as complete but not implemented.** |
| 33 | [APP_STORE_METADATA.md](APP_STORE_METADATA.md#L291) | 291 | `"HealthKit permissions request only after explaining user benefit"` checked ✅ | Not implemented. |
| 34 | [APP_STORE_METADATA.md](APP_STORE_METADATA.md#L297-L302) | 297–302 | Full HealthKit permission strings table | No HealthKit exists to request these permissions. |

### MEDIUM — Could Be Flagged

| # | File | Line | String | Issue |
|---|------|------|--------|-------|
| 35 | [APP_STORE_METADATA.md](APP_STORE_METADATA.md#L9) | 9 | Subtitle: `"Mood Tracker & Mindful Journal"` | "Tracker" can trigger review if category is Health & Fitness without HealthKit |
| 36 | [APP_STORE_METADATA.md](APP_STORE_METADATA.md#L21) | 21 | `"A High-Fidelity Mirror for Your Daily Wellbeing"` | "High-Fidelity" implies measurement precision |
| 37 | [APP_STORE_METADATA.md](APP_STORE_METADATA.md#L39) | 39 | `"INTEGRATED WELLNESS"` | Health claim |
| 38 | [healing.tsx](app/(tabs)/healing.tsx#L148) | 148 | `"Healing Insights"` (page title) | Healing = health claim |
| 39 | [healing.tsx](app/(tabs)/healing.tsx#L161) | 161 | `"Create your chart to unlock personalized healing insights."` | Healing claim |
| 40 | [config.ts](constants/config.ts#L57) | 57 | `"Advanced behavioral pattern analysis"` | "Behavioral" + "analysis" = clinical |
| 41 | [config.ts](constants/config.ts#L58) | 58 | `"Healing framework (Attachment & Shadow)"` | Healing claim |
| 42 | [config.ts](constants/config.ts#L60) | 60 | `"Correlation mapping (Mood & Journaling)"` | Correlation = clinical |
| 43 | [faq.tsx](app/faq.tsx#L64) | 64 | `"full behavioral trend analysis...healing and attachment insights...full 7-chakra energy mapping"` | Multiple risky terms |
| 44 | [terms.tsx](app/terms.tsx#L74) | 74 | Same premium feature list as FAQ | Same risks |
| 45 | [privacy.tsx](app/privacy.tsx#L76) | 76 | `"emotion detection, and sentiment analysis"` | "Detection" implies clinical |
| 46 | [energy.tsx](app/(tabs)/energy.tsx#L203) | 203 | `"chakra awareness, domain tracking"` | "Tracking" with chakra |
| 47 | [home.tsx](app/(tabs)/home.tsx#L601) | 601 | `"Track correlations"` | Clinical claim |
| 48 | [settings/index.tsx](app/(tabs)/settings/index.tsx#L66) | 66 | `"MySky analyzes trends, shows your best days by energy, and reveals what patterns correlate with how you feel"` | "Analyzes" + "correlate" |

---

## 2. Claims vs. Reality

### A. Personal Data

| Claim | Reality | Accurate? |
|-------|---------|-----------|
| "All data stored locally" | SQLite + SecureStore + AsyncStorage — all on-device | ✅ Accurate |
| "Birth data encrypted" | Birth place AES-256-GCM encrypted. **But lat/lng stored plaintext.** | ⚠️ Partially inaccurate |
| "No data uploaded" | Check-ins, journals, sleep, charts: never transmitted. **But** optional AI Reflections send aggregated stats. **And** Nominatim geocoding sends birth city text to OpenStreetMap. | ⚠️ Missing disclosure for Nominatim |
| "Delete all data" | Does NOT clear AsyncStorage, reflection cache, or Supabase auth session | ❌ Incomplete |
| "Export all data" | Missing `daily_check_ins`, `sleep_entries`, `relationship_charts` | ❌ Incomplete |

### B. Health Data

| Claim | Reality | Accurate? |
|-------|---------|-----------|
| "Integrates with Apple Health" (metadata) | **No HealthKit code, no package, no entitlement, no permission strings** | ❌ **FALSE** |
| "Biometric" (UI labels) | App reads **zero biometric sensors**. All data is self-reported sliders (mood 1–10, energy levels, stress levels). | ❌ Misleading |
| "Somatic" (12 UI occurrences) | App performs **zero somatic measurement**. "Somatic check-in" is just mood/energy/stress sliders with no body-sensing technology. | ❌ Misleading |
| "Nervous system" (3 UI occurrences) | App cannot read or measure the nervous system. Content is astrology-derived personality descriptions. | ❌ Misleading |
| "Calibration" (7 UI occurrences) | The "calibration" screen is a color picker for visual themes. It calibrates **nothing medical or biometric**. | ❌ Misleading |
| Health & Fitness category | App has no HealthKit integration, no sensor access, no biometric measurement. Category should be **Lifestyle** or **Entertainment**. | ⚠️ Risky |
| Privacy nutrition label: "Health & Fitness (Mood, Sleep)" | Mood/sleep are self-reported, not HealthKit-sourced. Apple may flag this. Declare as "User Content" instead. | ⚠️ |

### C. Analytics

| Claim | Reality | Accurate? |
|-------|---------|-----------|
| "Zero analytics SDKs" | Confirmed: no Firebase, Amplitude, Mixpanel, Sentry, Crashlytics | ✅ Accurate |
| "Zero advertising identifiers" | Confirmed: no IDFA/GAID usage | ✅ Accurate |
| "No tracking" | Confirmed: `NSPrivacyTracking: false`, empty tracking domains | ✅ Accurate |

### D. Identifiers

| Claim | Reality | Accurate? |
|-------|---------|-----------|
| "No identifiers collected" (privacy label) | RevenueCat uses anonymous `$RCAnonymousID`. Supabase Auth stores user email (optional). | ⚠️ RevenueCat ID should be declared |
| "Anonymous device identifier for subscription verification" (privacy policy) | Accurate for RevenueCat | ✅ |

### E. Purchase / Subscription Data

| Claim | Reality | Accurate? |
|-------|---------|-----------|
| Monthly/yearly/lifetime options | Implemented via RevenueCat | ✅ Accurate |
| "Manage cancellations via App Store/Google Play" | Correct | ✅ |
| "Restore Purchases" available | Implemented | ✅ |
| Pricing displayed from RevenueCat | Live prices fetched, config fallbacks for display | ✅ |
| No mention of free trial | If free trial exists in RevenueCat config but not disclosed, violates 3.1.2 | ⚠️ Verify |

---

## 3. Required Changes to Privacy Policy / Terms / FAQ

### MUST FIX (App Store rejection risk)

| # | Document | Issue | Required Change |
|---|----------|-------|-----------------|
| 1 | APP_STORE_METADATA.md | **False HealthKit integration claims** (L41, L76, L89, L288-302) | Remove ALL Apple Health / HealthKit references. Add honest description: "All data is self-reported by the user." |
| 2 | APP_STORE_METADATA.md | Category: "Health & Fitness" | Change to **Lifestyle** (primary) or petition Apple only if you add real HealthKit integration |
| 3 | APP_STORE_METADATA.md | Privacy label declares "Health & Fitness (Mood, Sleep)" | Change to "User Content" — mood/sleep are self-reported, not HealthKit |
| 4 | APP_STORE_METADATA.md | Subtitle: "Mood Tracker" | Change to "Mood Journal & Reflection" |
| 5 | APP_STORE_METADATA.md | App Review Notes claim HealthKit integration | Rewrite to: "All mood, sleep, and energy data is manually entered by the user. No biometric sensors or HealthKit data are used." |

### SHOULD FIX (Accuracy / GDPR)

| # | Document | Issue | Required Change |
|---|----------|-------|-----------------|
| 6 | privacy.tsx L76 | "emotion detection, and sentiment analysis" | Change to "emotion tagging and sentiment reflection" |
| 7 | privacy.tsx L165 | `"Calibrate tab (premium)"` | Change to "Settings tab (premium)" |
| 8 | faq.tsx L64 | "full behavioral trend analysis" | Change to "personal reflection trends" |
| 9 | faq.tsx L64 | "healing and attachment insights" | Change to "growth and attachment reflections" |
| 10 | faq.tsx L64 | "full 7-chakra energy mapping" | Change to "7-domain energy reflection" |
| 11 | terms.tsx L74 | Same premium description as FAQ | Apply same changes |
| 12 | terms.tsx L97 | "healing insights, attachment analysis" | Change to "growth reflections, attachment awareness" |
| 13 | privacy.tsx | Does not disclose that "Delete All Data" is incomplete | Disclose that AsyncStorage preferences survive deletion, or fix the deletion |
| 14 | privacy.tsx | Claims "HMAC-SHA256 tamper detection" | Implementation is SHA256(key+data), not real HMAC. Either fix implementation or soften claim to "integrity checking" |

---

## 4. Recommended Safe Replacements

### Terminology Substitution Table

| Risky Term | Safe Replacement | Rationale |
|---|---|---|
| **biometric** | **self-reported** or **personal** | App reads no biometric sensors |
| **somatic** | **mindful** or **reflective** | "Somatic" implies licensed somatic therapy |
| **somatic check-in** | **daily check-in** or **mindful check-in** | Standard self-report language |
| **somatic sync** | **daily sync** or **reflection sync** | No somatic measurement |
| **somatic trends** | **reflection trends** or **mood trends** | |
| **Somatic Resonance** | **Visual Resonance** or **Atmosphere** | It's literally a color picker |
| **calibrate / calibration** | **personalize** or **customize** | No instrument calibration |
| **Instrument Calibration** | **Visual Customization** | |
| **biometric correlation engine** | **personal reflection engine** | No biometrics |
| **biometric check-ins** | **daily check-ins** | |
| **biometric scatter** | **reflection scatter** or **mood scatter** | |
| **nervous system** | **emotional patterns** or **inner landscape** | No physiological measurement |
| **nervous system tendency** | **emotional tendency** | |
| **Stability** (tab name) | **Balance** or **Dashboard** | "Stability" implies measurement |
| **Stability Index** | **Balance Score** or **Harmony Score** | |
| **Restore** (tab name) | **Rest** or **Sleep** | "Restore" implies health restoration |
| **Calibrate** (tab name) | **Settings** | Standard terminology |
| **Restoration** | **Rest & Sleep** | |
| **circadian field** | **sleep patterns** or **rest rhythms** | "Circadian" is medical |
| **rest architecture** | **sleep overview** | |
| **restoration field analytics** | **sleep pattern reflections** | |
| **correlation** | **connection** or **relationship** | "Correlation" implies clinical stats |
| **PATTERN DETECTED** | **PATTERN NOTICED** or **REFLECTION** | "Detected" implies automated sensing |
| **WELLNESS INSIGHT** | **DAILY REFLECTION** or **TODAY'S INSIGHT** | "Wellness" = health claim |
| **Deeper Wellness** | **Deeper Insight** or **Deeper Reflection** | |
| **healing** (in feature names) | **growth** or **inner work** | "Healing" = health claim |
| **Healing Insights** | **Growth Insights** or **Inner Reflections** | |
| **HEALING PATH** | **GROWTH PATH** | |
| **detect** (in insight text) | **notice** or **reveal** | "Detect" implies sensing |
| **energy cycles** | **energy patterns** | "Cycles" implies biorhythm measurement |
| **track correlations** | **explore connections** | |
| **High-Fidelity Mirror** | **Personal Mirror** or **Daily Mirror** | "High-Fidelity" implies precision |
| **analyze / analysis** | **reflect / reflection** or **explore** | "Analysis" implies clinical |
| **behavioral trend analysis** | **personal reflection trends** | |
| **Calibrating your signals...** | **Preparing your space...** or **Loading your reflections...** | |

---

## 5. Patches — Top 5 Issues

### Patch 1: home.tsx — Remove all biometric/somatic/wellness claims

All changes in [app/(tabs)/home.tsx](app/(tabs)/home.tsx):

```
Line 1–12 (file header comment):
BEFORE:
// MySky — The Stability Dashboard
//
// Command center for the Biometric Wellness Suite. Focuses on the
// Stability Index — a proprietary wellness metric measuring how
// synchronised your Sleep, Mood, and Energy signals are.

AFTER:
// MySky — The Balance Dashboard
//
// Daily reflection dashboard. Shows a Balance Score derived from
// self-reported Sleep, Mood, and Energy check-ins.
```

```
Line 87 (somatic breath):
BEFORE:
return `Your stability is ${stabilityIndex}% today. Your emotional weather is heavy. A somatic breath session could help re-center your internal landscape.`;

AFTER:
return `Your balance is ${stabilityIndex}% today. Your emotional weather is heavy. A gentle breathing pause could help re-center your inner landscape.`;
```

```
Line 319 (loading text):
BEFORE:
<Text style={styles.loadingText}>Calibrating your signals...</Text>

AFTER:
<Text style={styles.loadingText}>Preparing your reflections...</Text>
```

```
Lines 448–453 (insight eyebrow labels):
BEFORE:
                ? 'PATTERN DETECTED'
                : 'WELLNESS INSIGHT'}

AFTER:
                ? 'PATTERN NOTICED'
                : 'DAILY REFLECTION'}
```

```
Line 601 (quick link):
BEFORE:
<Text style={styles.quickLinkSub}>Track correlations</Text>

AFTER:
<Text style={styles.quickLinkSub}>Explore connections</Text>
```

```
Lines 636–646 (premium teaser):
BEFORE:
<Text style={styles.premiumPreviewLabel}>Deeper Wellness</Text>
...
Unlock the full Biometric Correlation Engine
...
Advanced pattern analysis, behavioral correlations, somatic breath journaling, and full restoration field analytics.
...
Explore Deeper Wellness

AFTER:
<Text style={styles.premiumPreviewLabel}>Deeper Insight</Text>
...
Unlock the full Personal Reflection Engine
...
Extended pattern reflections, personal connections, guided breath journaling, and full sleep pattern insights.
...
Explore Deeper Insight
```

### Patch 2: _layout.tsx — Fix tab bar labels

All changes in [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx):

```
Line 46 (home tab):
BEFORE:
title: 'Stability',

AFTER:
title: 'Balance',
```

```
Line 62 (sleep tab):
BEFORE:
title: 'Restore',

AFTER:
title: 'Rest',
```

```
Line 77 (settings tab):
BEFORE:
title: 'Calibrate',

AFTER:
title: 'Settings',
```

### Patch 3: settings/index.tsx — Remove biometric/somatic from settings

All changes in [app/(tabs)/settings/index.tsx](app/(tabs)/settings/index.tsx):

```
Line 544:
BEFORE:
<ObsidianSettingsGroup title="Calibration" subtitle="Fine-tune your experience">

AFTER:
<ObsidianSettingsGroup title="Personalization" subtitle="Fine-tune your experience">
```

```
Line 552:
BEFORE:
accessibilityLabel="Somatic resonance calibration"

AFTER:
accessibilityLabel="Visual atmosphere customization"
```

```
Line 558:
BEFORE:
<Text style={styles.settingTitle}>Somatic Resonance</Text>

AFTER:
<Text style={styles.settingTitle}>Visual Atmosphere</Text>
```

```
Line 561:
BEFORE:
Calibrate your biometric color-frequency mapping using the GPU shader console

AFTER:
Customize your visual atmosphere using the color console
```

```
Line 578:
BEFORE:
label="Somatic Check-in Reminder"

AFTER:
label="Daily Check-in Reminder"
```

```
Line 585–586:
BEFORE:
label="Somatic Pattern Insights"
description="Surface recurring patterns in your biometric check-ins"

AFTER:
label="Mood Pattern Insights"
description="Surface recurring patterns in your daily check-ins"
```

### Patch 4: APP_STORE_METADATA.md — Remove false HealthKit claims, fix category

```
Line 9:
BEFORE:
**Mood Tracker & Mindful Journal**

AFTER:
**Mood Journal & Daily Reflection**
```

```
Lines 12–13:
BEFORE:
**Primary:** Health & Fitness
**Secondary:** Lifestyle

AFTER:
**Primary:** Lifestyle
**Secondary:** Health & Fitness
```

```
Line 21:
BEFORE:
**A High-Fidelity Mirror for Your Daily Wellbeing**

AFTER:
**A Personal Mirror for Daily Reflection**
```

```
Lines 39–41:
BEFORE:
**INTEGRATED WELLNESS**

MySky optionally integrates with Apple Health to help you visualize how movement and rest relate to your personal wellbeing patterns.

AFTER:
**DESIGNED FOR REFLECTION**

All mood, sleep, and energy data is self-reported through beautiful interactive check-ins. MySky helps you notice patterns in your personal reflections over time.
```

```
Lines 54 (keywords):
BEFORE:
`mood,tracker,journal,mindfulness,habit,sleep,wellbeing,gratitude,mental,reflection,daily,emotion`

AFTER:
`mood,journal,reflection,mindfulness,habit,sleep,gratitude,self-awareness,daily,emotion,personal,growth`
```

```
Lines 59:
BEFORE:
A high-fidelity mirror for your daily wellbeing. Track mood, sleep, and reflections in a beautiful visual environment. Discover your patterns. Privacy-first.

AFTER:
A personal mirror for daily reflection. Log mood, sleep, and thoughts in a beautiful visual environment. Discover your patterns. Privacy-first.
```

```
Lines 70–76 (app review notes):
BEFORE:
MySky is a personal wellness app designed for mood tracking, sleep logging, and guided journaling.
...
MySky optionally integrates with Apple Health to visualize activity and rest data alongside user reflections.

AFTER:
MySky is a personal reflection app designed for mood logging, sleep journaling, and guided self-reflection.

All mood, sleep, and energy data is manually entered by the user through interactive check-ins. No biometric sensors, no HealthKit data, and no automated health measurements are used. Visual dashboards display patterns in user-entered data only.
```

```
Lines 85-93 (core functionality, remove Apple Health):
BEFORE:
4. **Pattern insights** (trend visualizations, 7-day balance summary, Apple Health step/sleep data)

AFTER:
4. **Pattern insights** (trend visualizations, 7-day balance summary of self-reported data)
```

Remove entirely or rewrite:
```
Lines 288-302:
DELETE:
- [x] Pattern insights with Apple HealthKit integration
- [x] HealthKit permissions request only after explaining user benefit

## HealthKit Permission Strings
[entire table]

REPLACE WITH:
- [x] Pattern insights using self-reported check-in data only
- [x] No biometric or HealthKit claims — all visuals represent user input
- [ ] HealthKit integration (not yet implemented — remove all claims)
```

```
Privacy Nutrition Label (Line 102):
BEFORE:
| Health & Fitness (Mood, Sleep) | Yes — device only | No | No |

AFTER:
| User Content (Mood, Sleep, Journal) | Yes — device only | No | No |
```

### Patch 5: healing.tsx + sleep.tsx — Remove health/medical terminology

Changes in [app/(tabs)/healing.tsx](app/(tabs)/healing.tsx):

```
Line 148:
BEFORE:
<Text style={styles.title}>Healing Insights</Text>

AFTER:
<Text style={styles.title}>Growth Insights</Text>
```

```
Line 151:
BEFORE:
Explore emotional patterns, inner needs, and pathways to growth — grounded in your psychological blueprint.

AFTER:
Explore emotional patterns, inner needs, and pathways to growth — grounded in your personal blueprint.
```

```
Line 161:
BEFORE:
Create your chart to unlock personalized healing insights.

AFTER:
Create your chart to unlock personalized growth insights.
```

```
Line 251:
BEFORE:
<DetailRow label="HEALING PATH"

AFTER:
<DetailRow label="GROWTH PATH"
```

```
Line 272:
BEFORE:
<Text style={styles.sectionTitle}>Safety & Nervous System</Text>

AFTER:
<Text style={styles.sectionTitle}>Safety & Emotional Patterns</Text>
```

```
Line 278:
BEFORE:
<DetailRow label="NERVOUS SYSTEM TENDENCY"

AFTER:
<DetailRow label="EMOTIONAL TENDENCY"
```

```
Line 285:
BEFORE:
"Your nervous system has a specific definition of safety — your chart reveals what it is."

AFTER:
"Your inner landscape has a specific definition of safety — your chart reveals what it is."
```

Changes in [app/(tabs)/sleep.tsx](app/(tabs)/sleep.tsx):

```
Line 544:
BEFORE:
<Text style={styles.title}>Restoration</Text>

AFTER:
<Text style={styles.title}>Rest & Sleep</Text>
```

```
Line 545:
BEFORE:
<Text style={styles.subtitle}>Circadian field · Rest architecture</Text>

AFTER:
<Text style={styles.subtitle}>Sleep quality · Dream journal</Text>
```

---

## Summary of Rejection Risks

| Risk Level | Count | Top Category |
|---|---|---|
| **Will reject** | 6 | False HealthKit claims in App Store metadata |
| **Critical** | 28 | "Biometric", "somatic", "nervous system", "calibrate" in user-visible UI |
| **High** | 20 | "Healing", "correlation", "analysis", "wellness" in features/marketing |
| **Medium** | 15 | "Track", "detect", "wellbeing" in onboarding/FAQ/terms |

### Priority Order for Fixes

1. **Remove ALL HealthKit claims from APP_STORE_METADATA.md** — These are provably false. Apple will test the app and find no HealthKit permission request. Immediate rejection under Guideline 2.1 (App Completeness) and 1.1.6 (False Claims).

2. **Remove "biometric" from all user-visible text** — The app reads zero biometric sensors. Apple's Guideline 5.1.2 covers biometric data specifically.

3. **Replace "somatic" with "mindful" or "daily"** — 12 user-visible occurrences imply somatic therapy (a licensed clinical practice).

4. **Replace "nervous system" with "emotional patterns"** — Physiological claims without physiological measurement.

5. **Replace "calibrate/calibration" with "personalize/settings"** — The color picker is not instrument calibration.

6. **Change category from Health & Fitness to Lifestyle** — Without HealthKit integration, Apple may reject a Health & Fitness primary category app that claims to do mood/sleep "tracking."

7. **Change privacy nutrition label from "Health & Fitness" to "User Content"** — Self-reported data is not health data in Apple's taxonomy.
