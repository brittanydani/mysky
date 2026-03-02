# Astrology Term Audit — Daily Context Screen

**Scope:** All user-facing strings across 12 files that feed the Daily Context screen.  
**Exclusion:** `chart.tsx` (natal chart screen) retains standard astrology terminology by design.  
**Goal:** Identify every astrology-related term that reaches the user, classify each as user-facing vs. internal, and note whether the existing `storyLabels.ts` transform layer covers it.

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| 🔴 P0 | Entire library/system outputs astrology by design — needs architectural rewrite |
| 🟠 P1 | Specific user-facing string contains astrology — needs targeted fix |
| 🟡 P2 | Output goes through `applyStoryLabels`/`applyGuidanceLabels` but the transform has gaps |
| ⚪ P3 | Internal-only (variable names, types, comments) — cosmetic, no user impact |

---

## FILE 1: `services/today/todayContentLibrary.ts`  
*(2520 lines — 4 content libraries)*

### 🔴 P0 — COSMIC_WEATHER_LIBRARY (~480 entries, lines ~1780–2280)

**Every single entry is astrologically explicit.** This library is the source for the "Today's Context" card. Even after `applyGuidanceLabels()`, many terms survive because they are deeply embedded in sentence structure rather than being standalone words.

**Transit Moon Sign entries (12 signs × 20 = 240 entries):**

| Lines | Example text | Term(s) |
|-------|-------------|---------|
| ~1781 | "The Moon is charging through Aries. Initiative is in the air" | Moon, Aries |
| ~1782 | "Aries Moon energy: sharp, direct, impatient in the best way" | Aries Moon |
| ~1783 | "Moon in Aries: your impulses are louder than your plans" | Moon in Aries |
| ~1790 | "Moon in Taurus: comfort is louder than ambition" | Moon in Taurus |
| ~1810 | "Moon in Gemini: your mind is restless" | Moon in Gemini |
| (etc.) | Pattern repeats for all 12 signs | Moon in [Sign] |

**Intensity entries (~60):**

| Lines | Example text | Term(s) |
|-------|-------------|---------|
| ~2100 | "Active transits today — pay attention to what comes up" | transits |
| ~2101 | "The cosmos is loud today — multiple themes want attention" | cosmos |
| ~2102 | "Major aspects are active — this is a high-signal day" | aspects |
| ~2103 | "Celestial weather is charged today" | Celestial weather |
| ~2110 | "The cosmic weather is mild" | cosmic weather |
| ~2115 | "No major planetary noise today" | planetary |

**Retrograde entries (~40):**

| Lines | Example text | Term(s) |
|-------|-------------|---------|
| ~2150 | "Retrograde energy is in the air" | Retrograde |
| ~2151 | "Planetary review period active" | Planetary |
| ~2152 | "Inner planets are reviewing their notes" | planets |

**Moon Phase entries (~160):**

| Lines | Example text | Term(s) |
|-------|-------------|---------|
| ~2200 | "New Moon energy lingers — set intentions quietly" | New Moon |
| ~2210 | "Full Moon illuminates what's been hidden" | Full Moon |
| ~2215 | "Waxing Crescent energy: momentum is building" | Waxing Crescent |
| ~2220 | "First Quarter: push through resistance" | First Quarter |
| (etc.) | All 8 phases × 20 entries each | Moon phase names |

### 🔴 P0 — GREETING_LIBRARY (~200 entries, lines ~2290–2520)

**Nearly every greeting references astrology.** These are shown at the top of the Daily Context screen.

| Lines | Example text | Term(s) |
|-------|-------------|---------|
| ~2291 | "Here's what the sky is saying today" | the sky |
| ~2292 | "The stars have something to say" | the stars |
| ~2293 | "Let's see what the cosmos has in store" | the cosmos |
| ~2299 | "Your chart has some thoughts" | chart |
| ~2303 | "The planets have been busy while you slept" | the planets |
| ~2308 | "Here's your cosmic weather report" | cosmic weather |
| *Fire sign greetings:* | "Fire-starter, here's your cosmic fuel" | cosmic fuel |
| *Earth sign greetings:* | "The stars aren't going anywhere — and neither is your plan" | the stars |
| *Air sign greetings:* | "Let's check the cosmic mental weather" | cosmic |
| *Water sign greetings:* | "Your cosmic mirrors are ready" | cosmic mirrors |

### 🟠 P1 — AFFIRMATION_LIBRARY (868 entries, lines 49–868)

**Mostly clean text, but ~20+ entries contain embedded astrology references:**

| Line | Text | Term(s) |
|------|------|---------|
| 326 | "New moons whisper beginnings..." | new moons |
| 350 | "the crescent moon reminds me..." | crescent moon |
| 393 | "the almost-full moon says..." | moon |
| 406 | "the full moon's light..." | full moon |
| 414 | "Full moons are for feeling" | full moons |
| 437 | "The disseminating moon says..." | disseminating moon |
| 546 | "Retrogrades recycle gold" | Retrogrades |
| 557 | "Mercury is playing tricks..." | Mercury |
| 560 | "the cosmic pause..." | cosmic |
| 720 | "cosmic recharge" | cosmic |
| 762 | "No part of my chart is a mistake" | chart |
| 766 | "My chart is not my destiny. It is my toolkit." | chart |
| 767 | "cosmic blueprint" | cosmic blueprint |
| 774 | "My chart has its own seasons" | chart |
| 810 | "all of my placements working together" | placements |

### 🟠 P1 — REFLECTION_LIBRARY (~720 entries, lines ~1000–1720)

**Mostly clean, ~10+ entries with astrology:**

| Line | Text | Term(s) |
|------|------|---------|
| ~329 | "what is the new moon asking you to begin?" | new moon |
| ~358 | "what is the crescent moon showing you?" | crescent moon |
| ~405 | "what is the full moon spotlighting?" | full moon |
| ~425 | "what has the full moon revealed?" | full moon |
| ~614 | "what is the retrograde bringing up?" | retrograde |
| ~617 | "what is the retrograde asking you to reconsider?" | retrograde |
| ~620 | "what has the retrograde slowed down for you?" | retrograde |
| ~611 | "Where is the divine timing in this?" | divine timing (borderline) |

---

## FILE 2: `services/today/todayContentEngine.ts`  
*(501 lines)*

### 🔴 P0 — `formatTagForDisplay()` (lines ~465–500)

All output labels are astrological. These become user-facing source attributions:

| Tag input | Display output |
|-----------|---------------|
| `'phase-new'` | `'New Moon'` |
| `'phase-full'` | `'Full Moon'` |
| `'transit-aries'` | `'Moon in Aries'` |
| (all 12 signs) | `'Moon in [Sign]'` |
| `'retrograde-active'` | `'Retrograde'` |
| `'love-active'` | `'Love transit'` |
| `'energy-active'` | `'Energy transit'` |
| (default) | `'Your cosmic blueprint'` |

### 🟠 P1 — `buildSourceDescription()` (lines ~450–460)

Creates joined source strings displayed under affirmations/reflections:

- `"Fire element × Waxing Crescent"` — contains moon phase name
- `"Moon in Aries × Intense energy"` — contains "Moon in [Sign]"
- `"Retrograde × Cardinal energy"` — contains "Retrograde"

### ⚪ P3 — Internal logic

- `buildTagProfile()` uses natal chart data, transit calculations, zodiac sign arrays — all internal, no user output.
- `TodayContent` interface field names (`cosmicWeather`, `affirmationSource`) — internal.

---

## FILE 3: `app/astrology-context.tsx`  
*(943 lines — main Daily Context screen renderer)*

### 🟠 P1 — Moon Phase Display (lines 390–410)

Moon phase names and messages are shown **directly, without any label transform**:

| Line | What's displayed | Example output | Filtered? |
|------|-----------------|----------------|-----------|
| 392 | `guidance.moonPhase` | "Full Moon", "Waxing Crescent" | ❌ NO |
| 393 | `guidance.moonPhaseMessage` | "Illuminate. See clearly what's been hidden." | ❌ NO |
| 390 | `guidance.moonPhaseEmoji` | 🌕 | N/A (emoji) |

### 🟠 P1 — Affirmation Source Attribution (line ~540 area)

The source string from `todayContentEngine.buildSourceDescription()` or `dailyAffirmation.describeSource()` is displayed **without** `applyGuidanceLabels()`:

- Example output: `"Moon in Cancer × Waxing Gibbous"`, `"Aries Sun · Fire"`, `"Your cosmic blueprint"`

### 🟡 P2 — Cosmic Weather Card (line 367)

```tsx
applyGuidanceLabels(todayContent?.cosmicWeather || guidance.cosmicWeather)
```

Runs through `applyGuidanceLabels()` — but the source COSMIC_WEATHER_LIBRARY text is so structurally astrological that regex-based replacement cannot fully sanitize it. Example: "The Moon is charging through Aries" → after filter → "The Emotional body is charging through Initiation" (still reads strangely).

### 🟡 P2 — Signal Descriptions (lines 637–644, 670)

```tsx
applyGuidanceLabels(signal.description)
```

Signal descriptions come from `TransitSignal.description` in `dailyInsightEngine.ts`, which contains strings like "Moon conjunction Sun" → filtered to "Emotional body alignment Core vitality". Improved but still awkward.

### 🟡 P2 — Timeline fields (lines 658–660)

`insight.timeline.peakInfluence` and `insight.timeline.easesBy` — these are time strings (e.g., "Late morning"), generally clean. But `longerCycleNote` goes through `applyStoryLabels()` and may contain "Saturn has been here since Dec" type content.

### ⚪ P3 — Retrograde banners (lines 417–435)

Labels are already human-translated in `RETROGRADE_CONTEXT`:
- "Communication Review Cycle" (Mercury)
- "Relationship Review Cycle" (Venus)
- "Drive Review Cycle" (Mars)
- "Expansion Review Cycle" (Jupiter)
- "Structure Review Cycle" (Saturn)

Notes are also clean. **However**, the planet names ("Mercury", "Venus", etc.) are used as keys and the `planet` variable is used in `key={planet}` — not displayed as text.

### ⚪ P3 — Internal code

- Import paths referencing `astrology/`, `moonPhase`, `chartPatterns`, `chiron`, `nodes` — internal.
- Variable names: `userChart`, `retrogradePlanets`, `moonPhaseEmoji`, `chartPatterns`, `nodeInsight`, `chironInsight` — internal.

---

## FILE 4: `services/astrology/humanGuidance.ts`  
*(1318 lines)*

### 🟠 P1 — Greetings (lines 1218–1224)

These are fallback greetings when the todayContentEngine isn't used:

| Line | Text | Term(s) |
|------|------|---------|
| 1220 | `"Good morning. Here's what the sky is saying today."` | the sky |
| 1222 | `"Here's your cosmic weather for today."` | cosmic weather |
| 1224 | `"Settling into evening. Here's what's been in the air."` | clean (borderline) |

### 🟠 P1 — Cosmic Weather fallback (line 1233)

```typescript
cosmicWeather = `Moon in ${insight.moonSign}. A quieter cosmic day — follow your own rhythm.`;
```

Contains **dynamic** "Moon in [Sign]" (e.g., "Moon in Pisces") and "cosmic day".

### 🟠 P1 — Moon Phase Messages (lines 1246–1253)

These user-facing messages are returned in `moonPhaseMessage`:

| Phase | Message |
|-------|---------|
| New Moon | "Set intentions. Plant seeds in the dark." |
| Full Moon | "Illuminate. See clearly what's been hidden." |
| Waning Crescent | "Rest and surrender. Trust the cycle." |

The messages themselves are mostly clean psychological language, but they're paired with moon phase NAMES (e.g., displayed as "Full Moon" header + message).

### 🟠 P1 — Guidance pool entries

| Line | Text | Term(s) |
|------|------|---------|
| 251 | "...unique to your chart..." | chart |
| 456 | "...just like the moon..." | the moon |
| 731 | "...Your soul is renovating its house..." | house (ambiguous — could be literal) |
| 994 | "The stars remind us: even in darkness, there is light." | the stars |

### ⚪ P3 — Internal field names

- `cosmicWeather`, `moonSign`, `moonPhase`, `moonPhaseEmoji`, `moonPhaseMessage`, `retrogradePlanets` in `HumanDailyGuidance` interface — internal.

---

## FILE 5: `services/astrology/dailyInsightEngine.ts`  
*(1450 lines)*

### 🟠 P1 — TRANSIT_TEMPLATE titles (user-facing)

Most titles are clean psychological language, but several contain astrology terms:

| Line | Title | Term(s) |
|------|-------|---------|
| 254 | `choicePoint: "...It's cosmic weather."` | cosmic weather |
| 270 | `title: 'Full Moon echo'` | Full Moon |
| 388 | `title: 'Venus return energy'` | Venus |
| 486 | `title: 'Mars return energy'` | Mars |
| 580 | `title: 'Mercury return'` | Mercury |
| 677 | `title: 'Solar return energy'` | Solar |
| 682 | `title: 'New Moon personal'` | New Moon |
| 700 | `title: 'Quarter Moon tension'` | Quarter Moon |
| 736 | `title: 'Full Moon personal'` | Full Moon |

### 🟡 P2 — TransitSignal.description field

The `description` field is generated from transit data and contains strings like:
- "Moon conjunction Sun" → passed through `applyGuidanceLabels()` in `astrology-context.tsx`
- After filter: "Emotional body alignment Core vitality" — improved but awkward

### ⚪ P3 — Internal constants

- `ORB_LIMITS`, `ASPECT_WEIGHTS`, `TRANSIT_PLANET_BOOST`, `NATAL_TARGET_BOOST`, `PLANET_TO_DOMAIN`, `HOUSE_TO_DOMAIN`, `MOON_IN_HOUSE_FALLBACK` — all internal computation.
- Planet names (`Moon`, `Venus`, `Mars`, etc.) used as object keys — internal.

---

## FILE 6: `services/astrology/shadowQuotes.ts`  
*(871 lines)*

### ✅ CLEAN — Quote text

All shadow quote `text` fields intentionally avoid astrology language (Rule #2 in file header). Example: "You're holding yourself to a standard you don't apply to others."

### ✅ MOSTLY CLEAN — `activationReason`

The `deriveActivationReason()` function (lines 798–840) outputs jargon-free reasons:
- "A sensitivity in your chart is active today" — contains "chart" (very mild)
- "Matched to the current lunar rhythm" — contains "lunar" (borderline)
- All others are clean: "Structure and boundaries are in focus", "Two parts of your life are in dialogue", etc.

### ⚪ P3 — Internal trigger types

`ActivationTrigger` type values (`'saturn-aspect'`, `'chiron'`, `'node-axis'`, `'moon-waning'`, etc.) — internal only.

---

## FILE 7: `services/premium/premiumDailyGuidance.ts`  
*(536 lines)*

### 🔴 P0 — TRANSIT_CONTEXTS (lines 167–201)

**Every entry is deeply astrological user-facing text**, shown to premium users:

| Line | Text | Term(s) |
|------|------|---------|
| 169 | "The Moon is aligning with your natal Moon today, creating a monthly emotional reset." | Moon, natal Moon |
| 170 | "The Moon is creating tension with your natal Moon" | Moon, natal Moon |
| 171 | "The Moon opposes your natal Moon" | Moon, natal Moon |
| 172 | "The Moon harmonizes with your natal Moon" | Moon, natal Moon |
| 176 | "The Moon connects with your Sun" | Moon, Sun |
| 177 | "Tension between the Moon and your Sun" | Moon, Sun |
| 183 | "The Moon touches your Venus" | Moon, Venus |
| 185 | "The Moon opposite Venus" | Moon, Venus |
| 190 | "The Moon activates your Mars" | Moon, Mars |
| 192 | "Moon-Mars opposition can externalize inner tension" | Moon-Mars opposition |
| 197 | "The Moon meets your Saturn" | Moon, Saturn |
| 198 | "Saturn pressure can feel heavy" | Saturn |
| 199 | "Moon-Saturn opposition highlights the tension" | Moon-Saturn opposition |
| 201 | "Gentle Saturnian energy" | Saturnian |

### 🟠 P1 — PHASE_CONTEXTS (lines 508–519)

Moon phase descriptions for premium users:

| Line | Text | Term(s) |
|------|------|---------|
| 509 | "🌑 New Moon energy supports new beginnings..." | New Moon |
| 513 | "🌕 Full Moon energy illuminates what's ready to be seen..." | Full Moon |
| 510 | "🌒 Waxing Crescent energy supports taking first steps..." | Waxing Crescent |
| (etc.) | All 8 phases | Moon phase names |

### 🟠 P1 — Generic transit fallback (line ~490)

```typescript
`The Moon is making a ${aspectType} aspect to your natal ${planet} today.`
```

Dynamically generates strings like "The Moon is making a trine aspect to your natal Venus today."

### 🟠 P1 — Free tier teaser strings

| Line | Text | Term(s) |
|------|------|---------|
| 310 | "Upgrade to Deeper Sky to see how the moon phase affects you." | moon phase |
| 312 | "Upgrade to Deeper Sky to understand what's happening in the sky and why it matters for you." | the sky |

### ⚪ P3 — Internal code

- `computeTransitAspectsToNatal`, `getTransitingLongitudes`, `SimpleAspect` imports — internal.

---

## FILE 8: `services/energy/dailyAffirmation.ts`  
*(506 lines)*

### 🟠 P1 — `describeSource()` (lines 474–506)

This function generates the user-facing attribution string shown under affirmations:

| Condition | Output | Term(s) |
|-----------|--------|---------|
| Transit tag | `"Moon in Cancer"`, `"Moon in Aries"` | Moon in [Sign] |
| Phase tag | `"New Moon"`, `"Full Moon"` | Moon phase names |
| Sun tag | `"Aries Sun · Fire"` | [Sign] Sun |
| Moon tag | `"Cancer Moon · Water"` | [Sign] Moon |
| Rising tag | `"Libra Rising · Air"` | [Sign] Rising |
| Retrograde tag | `"Retrograde emphasis"` | Retrograde |
| Fallback | `"Your cosmic blueprint"` | cosmic blueprint |
| No tag | `"Your chart today"` | chart |

### 🟠 P1 — Affirmation text with astrology references

| Line | Text | Term(s) |
|------|------|---------|
| 279 | "The tension in my chart is where my growth lives." | chart |
| 281 | "No part of my chart is a mistake. Every placement has purpose." | chart, placement |
| 286 | "My chart is not my destiny. It is my toolkit." | chart |
| 287 | "I am the only person alive with this exact cosmic blueprint." | cosmic blueprint |
| 296 | "Every hard transit ends. I survive this one too." | transit |
| 297 | "I am not behind. My chart has its own seasons." | chart |

### ⚪ P3 — Internal types and tags

- `AffirmationTag` type (`'transit-aries'`, `'phase-new'`, `'moon-fire'`, etc.) — internal.
- `buildProfileTags()` logic — internal.

---

## FILE 9: `constants/storyLabels.ts`  
*(363 lines — the transform layer)*

### Coverage Assessment

**What it catches:**

| Original term | Replacement |
|---------------|-------------|
| Moon (standalone) | Emotional body |
| Full Moon | Heightened awareness phase |
| New Moon | Initiation phase |
| Moon phase | Emotional cycle |
| Moon sign | Emotional nature |
| Sun sign | Core vitality |
| Rising sign | Outward expression |
| North Node | Growth direction |
| South Node | Past foundation |
| Natal chart / birth chart | Core blueprint / Personal framework |
| your chart / the chart | your personal framework / the personal framework |
| Retrograde | Review cycle |
| Horoscope | Reflection |
| All zodiac signs (Aries, etc.) | Quality archetypes (Initiation, Stability, etc.) |
| All planets | Archetypal forces (Emotional body, Activating force, etc.) |
| conjunction / opposition / etc. | alignment / tension dynamic / etc. |
| Transit | Current timing |
| Chiron return | Deep repair cycle |
| Chiron | Healing archetype |

### 🟡 P2 — GAPS in the transform layer

**Terms NOT caught by any filter function:**

| Uncaught term | Where it appears in user-facing text |
|---------------|--------------------------------------|
| `the sky` | humanGuidance.ts greetings, premiumDailyGuidance.ts |
| `the stars` | humanGuidance.ts GENTLE_REMINDERS, GREETING_LIBRARY |
| `the cosmos` | GREETING_LIBRARY |
| `cosmic weather` | GREETING_LIBRARY, humanGuidance.ts, dailyInsightEngine.ts |
| `cosmic blueprint` | dailyAffirmation.ts, todayContentEngine.ts, AFFIRMATION_LIBRARY |
| `cosmic pause` | AFFIRMATION_LIBRARY |
| `cosmic recharge` | AFFIRMATION_LIBRARY |
| `cosmic day` | humanGuidance.ts |
| `cosmic fuel` | GREETING_LIBRARY |
| `cosmic mirrors` | GREETING_LIBRARY |
| `cosmic mental weather` | GREETING_LIBRARY |
| `celestial weather` | COSMIC_WEATHER_LIBRARY |
| `celestial` | COSMIC_WEATHER_LIBRARY |
| `the planets` | GREETING_LIBRARY, COSMIC_WEATHER_LIBRARY |
| `planetary` | COSMIC_WEATHER_LIBRARY |
| `Saturnian` | premiumDailyGuidance.ts |
| `Solar` | dailyInsightEngine.ts titles |
| `lunar` | shadowQuotes.ts activationReason |
| `my chart` | AFFIRMATION_LIBRARY, dailyAffirmation.ts |
| `placements` | AFFIRMATION_LIBRARY |
| `transits` (plural) | COSMIC_WEATHER_LIBRARY |
| `aspects` (as noun) | COSMIC_WEATHER_LIBRARY |
| `new moons` (lowercase) | AFFIRMATION_LIBRARY |
| `full moons` (lowercase plural) | AFFIRMATION_LIBRARY |
| `crescent moon` | AFFIRMATION_LIBRARY, REFLECTION_LIBRARY |
| `disseminating moon` | AFFIRMATION_LIBRARY |
| `divine timing` | REFLECTION_LIBRARY |
| Intermediate moon phase names | Waxing Crescent, First Quarter, Waxing Gibbous, Waning Gibbous, Last Quarter, Waning Crescent |

---

## FILE 10: `app/(tabs)/insights.tsx`  
*(749 lines)*

### ✅ MOSTLY CLEAN

User-facing strings are clean: "Today's Reflection", reflection prompts are psychological.

| Line | Item | Note |
|------|------|------|
| 154 | `<StarField starCount={40} />` | Visual component, not text — acceptable |
| 320 | Comment: "chart + mood + journal cross-connection" | Internal comment only |
| 476 | `nav('/(tabs)/chart')` | Navigation target — internal |

No user-facing astrology term issues found.

---

## FILE 11: `app/(tabs)/energy.tsx`  
*(1084 lines)*

### ✅ MOSTLY CLEAN

| Line | Text | Note |
|------|------|------|
| 191 | "Your personal energy weather" | Clean |
| 203 | "Add your birth info to unlock your personal energy weather — chakra awareness, domain tracking, and daily guidance." | Clean |
| 207 | "Create Chart" | Uses "Chart" — very mild, acceptable in CTA context |
| 30, 183 | `<StarField>` component | Visual decoration, not text |

Domain guidance text is wrapped in `applyEnergyLabels()` which provides extensive cleanup of Moon/sign/planet/modality terms.

---

## FILE 12: `app/(tabs)/today.tsx`  
*(9 lines)*

### ✅ NO ISSUES

Single line: `<Redirect href="/astrology-context" />`. The URL path is internal routing only.

---

## Summary: Highest Impact Items

### Architecture-Level Rewrites Needed (P0)

1. **COSMIC_WEATHER_LIBRARY** (~480 entries in `todayContentLibrary.ts`) — every entry is structurally astrological. Regex filters cannot fix these. Needs full content rewrite in psychological/weather-metaphor language.

2. **GREETING_LIBRARY** (~200 entries in `todayContentLibrary.ts`) — nearly every greeting references stars/cosmos/chart/planets. Needs full content rewrite.

3. **TRANSIT_CONTEXTS** (~30 entries in `premiumDailyGuidance.ts`) — every entry explicitly names Moon/planets/aspects. Needs full content rewrite.

4. **`formatTagForDisplay()`** in `todayContentEngine.ts` — all output labels are astrological. Simple remapping fix.

### Targeted String Fixes Needed (P1)

5. **`describeSource()`** in `dailyAffirmation.ts` — generates "Moon in Aries", "Aries Sun · Fire", "Your cosmic blueprint". Remap to non-astro labels.

6. **`buildSourceDescription()`** in `todayContentEngine.ts` — same issue as #5.

7. **Moon phase display** in `astrology-context.tsx` (line 392) — "Full Moon", "New Moon" etc. shown directly without transform. Apply labels or use cycle metaphors.

8. **Affirmation source display** in `astrology-context.tsx` — not wrapped in `applyGuidanceLabels()`. Add the wrapper.

9. **Greetings** in `humanGuidance.ts` (lines 1220, 1222) — "the sky", "cosmic weather".

10. **cosmicWeather fallback** in `humanGuidance.ts` (line 1233) — "Moon in ${sign}. A quieter cosmic day".

11. **~20 affirmation entries** across `todayContentLibrary.ts` and `dailyAffirmation.ts` with embedded "chart", "cosmic", "moon", "Mercury", "retrograde" etc.

12. **~10 reflection entries** in `todayContentLibrary.ts` with "full moon", "new moon", "retrograde".

13. **~9 transit template titles** in `dailyInsightEngine.ts` with "Full Moon", "Venus return", "Mercury return", "Solar return", "Mars return", "Quarter Moon".

14. **PHASE_CONTEXTS** in `premiumDailyGuidance.ts` — "New Moon energy", "Full Moon energy", etc.

15. **Free-tier teaser strings** in `premiumDailyGuidance.ts` — "moon phase", "the sky".

### Transform Layer Gaps (P2)

16. **`storyLabels.ts`** missing coverage for: `cosmic *`, `the sky`, `the stars`, `the cosmos`, `celestial`, `the planets`, `planetary`, `Saturnian`, `Solar`, `lunar`, `placements`, `divine timing`, intermediate moon phase names, lowercase moon plurals, "my chart"/"your chart" in embedded sentence contexts.

---

## Recommended Fix Order

1. **Add missing terms to `storyLabels.ts`** (fixes P2 gaps — quick win, improves all filtered paths)
2. **Wrap affirmation source display in `applyGuidanceLabels()`** in `astrology-context.tsx` (line ~540)
3. **Remap `formatTagForDisplay()` and `buildSourceDescription()`** in `todayContentEngine.ts`
4. **Remap `describeSource()`** in `dailyAffirmation.ts`
5. **Fix hard-coded greetings** in `humanGuidance.ts`
6. **Fix cosmicWeather fallback** in `humanGuidance.ts`
7. **Apply transforms to moon phase names** in `astrology-context.tsx`
8. **Fix ~9 transit template titles** in `dailyInsightEngine.ts`
9. **Fix ~30 individual content entries** across affirmation/reflection libraries
10. **Rewrite COSMIC_WEATHER_LIBRARY** (~480 entries — largest effort)
11. **Rewrite GREETING_LIBRARY** (~200 entries)
12. **Rewrite TRANSIT_CONTEXTS** in `premiumDailyGuidance.ts` (~30 entries)
13. **Rewrite PHASE_CONTEXTS** in `premiumDailyGuidance.ts` (8 entries)
