// File: services/dreams/dreamPatternDetection.ts
//
// Dream pattern detection engine for a journaling app.
// - Computes recurring symbols/actions/locations/people/emotions
// - Detects streaks, recency-weighted trends, co-occurrence pairs
// - Infers theme scores from tags
// - Detects archetypal dream patterns (chase, teeth, lost, late, etc.)
//
// Safe-by-design: produces reflective insights, not predictions.

export type ISODateString = string;

export type DreamEntry = {
  id: string;
  createdAt: ISODateString; // ISO string
  text?: string;

  // You can pass empty arrays if you only have raw text.
  symbols?: string[];
  actions?: string[];
  locations?: string[];
  people?: string[];
  emotions?: string[];

  // Optional: pre-tagged themes from your own classifier.
  themes?: string[];
};

export type PatternConfig = {
  // How many days count as "recent" for trend calculations.
  recentWindowDays: number;

  // Half-life for recency weighting (in days). Smaller => more weight on recent dreams.
  recencyHalfLifeDays: number;

  // Minimum occurrences to consider something "recurring".
  minOccurrences: number;

  // Minimum co-occurrence count for pairs.
  minPairOccurrences: number;

  // Max number of items to return per category.
  topK: number;

  // Streak detection: maximum allowed gap between dreams (days) to be considered consecutive.
  // If your dreams are daily-ish, set 2-3 days. If sporadic, set 7+.
  streakMaxGapDays: number;

  // Optional normalization: lowercases and trims tokens.
  normalizeTokens: boolean;
};

export type TopItem = {
  token: string;
  count: number;
  weightedCount: number; // recency-weighted count
  lastSeenAt?: ISODateString;
  firstSeenAt?: ISODateString;
  recentCount: number; // in recent window
  baselineCount: number; // outside recent window
  trendScore: number; // positive => rising lately
};

export type Streak = {
  token: string;
  category: TokenCategory;
  length: number;
  startAt: ISODateString;
  endAt: ISODateString;
  // How many dreams were examined and whether streak is ongoing
  ongoing: boolean;
};

export type PairItem = {
  a: string;
  b: string;
  count: number;
  weightedCount: number;
  lastSeenAt?: ISODateString;
};

export type DreamArchetype =
  | "CHASE"
  | "FALLING"
  | "TEETH"
  | "LOST"
  | "LATE"
  | "TRAPPED"
  | "DROWNING"
  | "PARALYSIS"
  | "PUBLIC_EXPOSURE"
  | "CONFRONTATION"
  | "DEATH_VISITATION"
  | "HOSPITAL"
  | "TRAVEL_HOTEL"
  | "DISASTER"
  | "SPIRITUAL_CONFLICT"
  | "FUTURISTIC";

export type ArchetypeHit = {
  archetype: DreamArchetype;
  score: number; // 0..1ish
  evidence: string[]; // matched tokens/rules
  lastSeenAt?: ISODateString;
  count: number;
};

export type ThemeScore = {
  theme: string;
  score: number; // weighted
  count: number; // raw
};

export type PatternReport = {
  totalDreams: number;
  rangeStart?: ISODateString;
  rangeEnd?: ISODateString;

  topSymbols: TopItem[];
  topActions: TopItem[];
  topLocations: TopItem[];
  topPeople: TopItem[];
  topEmotions: TopItem[];

  streaks: Streak[];

  topPairs: {
    // Common useful pairings:
    symbol_symbol: PairItem[];
    symbol_action: PairItem[];
    symbol_location: PairItem[];
    action_emotion: PairItem[];
  };

  archetypes: ArchetypeHit[];
  themeScores: ThemeScore[];

  // High-level narrative helpers
  summary: {
    risingTokens: { category: TokenCategory; token: string; trendScore: number }[];
    persistentTokens: { category: TokenCategory; token: string; weightedCount: number }[];
  };
};

type TokenCategory = "symbols" | "actions" | "locations" | "people" | "emotions";

const DEFAULT_CONFIG: PatternConfig = {
  recentWindowDays: 14,
  recencyHalfLifeDays: 21,
  minOccurrences: 2,
  minPairOccurrences: 2,
  topK: 12,
  streakMaxGapDays: 3,
  normalizeTokens: true,
};

// --------- Public API ---------

export function detectDreamPatterns(
  entries: DreamEntry[],
  config: Partial<PatternConfig> = {}
): PatternReport {
  const cfg: PatternConfig = { ...DEFAULT_CONFIG, ...config };

  const sorted = [...entries]
    .filter((e) => !!e?.createdAt)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const totalDreams = sorted.length;
  const rangeStart = sorted[0]?.createdAt;
  const rangeEnd = sorted[sorted.length - 1]?.createdAt;

  // Flatten and normalize tokens per entry.
  const normalized = sorted.map((e) => normalizeEntryTokens(e, cfg.normalizeTokens));

  const now = rangeEnd ? new Date(rangeEnd).getTime() : Date.now();
  const recentCutoff = now - cfg.recentWindowDays * DAY_MS;

  // Compute token stats per category.
  const symbolStats = computeTokenStats(normalized, "symbols", now, recentCutoff, cfg);
  const actionStats = computeTokenStats(normalized, "actions", now, recentCutoff, cfg);
  const locationStats = computeTokenStats(normalized, "locations", now, recentCutoff, cfg);
  const peopleStats = computeTokenStats(normalized, "people", now, recentCutoff, cfg);
  const emotionStats = computeTokenStats(normalized, "emotions", now, recentCutoff, cfg);

  // Compute streaks for key categories (symbols + emotions are usually the most meaningful).
  const streaks = [
    ...computeStreaks(normalized, "symbols", cfg),
    ...computeStreaks(normalized, "emotions", cfg),
    ...computeStreaks(normalized, "locations", cfg),
  ]
    .sort((a, b) => b.length - a.length)
    .slice(0, Math.max(cfg.topK, 10));

  // Co-occurrence pairs (useful for context).
  const topPairs = {
    symbol_symbol: topPairsFrom(normalized, ["symbols", "symbols"], now, cfg),
    symbol_action: topPairsFrom(normalized, ["symbols", "actions"], now, cfg),
    symbol_location: topPairsFrom(normalized, ["symbols", "locations"], now, cfg),
    action_emotion: topPairsFrom(normalized, ["actions", "emotions"], now, cfg),
  };

  // Archetype detection: uses rules over tokens (and optional text).
  const archetypes = detectArchetypes(normalized, now, cfg)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  // Theme scoring: map tokens to themes (customizable).
  const themeScores = computeThemeScores(normalized, now, cfg)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  // Narrative summary helpers:
  const risingTokens = buildRisingList([
    { category: "symbols" as const, items: symbolStats },
    { category: "actions" as const, items: actionStats },
    { category: "locations" as const, items: locationStats },
    { category: "people" as const, items: peopleStats },
    { category: "emotions" as const, items: emotionStats },
  ]).slice(0, 12);

  const persistentTokens = buildPersistentList([
    { category: "symbols" as const, items: symbolStats },
    { category: "emotions" as const, items: emotionStats },
    { category: "actions" as const, items: actionStats },
  ]).slice(0, 12);

  return {
    totalDreams,
    rangeStart,
    rangeEnd,
    topSymbols: symbolStats.slice(0, cfg.topK),
    topActions: actionStats.slice(0, cfg.topK),
    topLocations: locationStats.slice(0, cfg.topK),
    topPeople: peopleStats.slice(0, cfg.topK),
    topEmotions: emotionStats.slice(0, cfg.topK),
    streaks,
    topPairs,
    archetypes,
    themeScores,
    summary: { risingTokens, persistentTokens },
  };
}

// --------- Token normalization ---------

function normalizeEntryTokens(entry: DreamEntry, normalize: boolean): DreamEntry {
  const n = (arr?: string[]) => {
    const base = Array.isArray(arr) ? arr : [];
    const cleaned = base
      .map((x) => (typeof x === "string" ? x : ""))
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => (normalize ? x.toLowerCase() : x));

    // Deduplicate within one entry to avoid overweighting a single dream.
    return Array.from(new Set(cleaned));
  };

  return {
    ...entry,
    symbols: n(entry.symbols),
    actions: n(entry.actions),
    locations: n(entry.locations),
    people: n(entry.people),
    emotions: n(entry.emotions),
    themes: n(entry.themes),
  };
}

// --------- Core scoring utilities ---------

const DAY_MS = 24 * 60 * 60 * 1000;

function recencyWeight(daysAgo: number, halfLifeDays: number): number {
  // Exponential decay: weight = 0.5^(daysAgo/halfLife)
  if (halfLifeDays <= 0) return 1;
  return Math.pow(0.5, daysAgo / halfLifeDays);
}

function computeTokenStats(
  entries: DreamEntry[],
  category: TokenCategory,
  nowMs: number,
  recentCutoffMs: number,
  cfg: PatternConfig
): TopItem[] {
  type Stat = {
    count: number;
    weightedCount: number;
    firstSeenAt?: ISODateString;
    lastSeenAt?: ISODateString;
    recentCount: number;
    baselineCount: number;
  };

  const map = new Map<string, Stat>();

  for (const e of entries) {
    const t = new Date(e.createdAt).getTime();
    const daysAgo = Math.max(0, (nowMs - t) / DAY_MS);
    const w = recencyWeight(daysAgo, cfg.recencyHalfLifeDays);

    const tokens = (e[category] ?? []) as string[];
    for (const token of tokens) {
      const stat = map.get(token) ?? {
        count: 0,
        weightedCount: 0,
        recentCount: 0,
        baselineCount: 0,
      };

      stat.count += 1;
      stat.weightedCount += w;

      if (!stat.firstSeenAt) stat.firstSeenAt = e.createdAt;
      stat.lastSeenAt = e.createdAt;

      if (t >= recentCutoffMs) stat.recentCount += 1;
      else stat.baselineCount += 1;

      map.set(token, stat);
    }
  }

  const items: TopItem[] = [];
  for (const [token, s] of map.entries()) {
    if (s.count < cfg.minOccurrences) continue;

    const trendScore = computeTrendScore(s.recentCount, s.baselineCount, cfg.recentWindowDays);

    items.push({
      token,
      count: s.count,
      weightedCount: round3(s.weightedCount),
      firstSeenAt: s.firstSeenAt,
      lastSeenAt: s.lastSeenAt,
      recentCount: s.recentCount,
      baselineCount: s.baselineCount,
      trendScore: round3(trendScore),
    });
  }

  // Primary sort: weightedCount, secondary: raw count, tertiary: trendScore
  items.sort((a, b) => {
    if (b.weightedCount !== a.weightedCount) return b.weightedCount - a.weightedCount;
    if (b.count !== a.count) return b.count - a.count;
    return b.trendScore - a.trendScore;
  });

  return items;
}

function computeTrendScore(recentCount: number, baselineCount: number, recentWindowDays: number): number {
  // Simple normalized uplift:
  // - If baseline is small, avoid blowups with smoothing.
  const smooth = 1;
  const r = recentCount + smooth;
  const b = baselineCount + smooth;

  // If mostly recent, score > 0; if mostly older, score < 0.
  // Range ~ [-1, +1]
  return (r - b) / (r + b);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// --------- Streak detection ---------

function computeStreaks(entries: DreamEntry[], category: TokenCategory, cfg: PatternConfig): Streak[] {
  // Approach:
  // - Iterate dreams in chronological order
  // - For each token, track current streak length and last dream date
  // - Consider dreams "consecutive" if gapDays <= streakMaxGapDays
  // - Streak increments if token appears in this dream
  // - If token absent, streak resets
  //
  // To avoid tracking infinite tokens, we first find candidates (minOccurrences).
  const tokenCounts = new Map<string, number>();
  for (const e of entries) {
    for (const token of (e[category] ?? []) as string[]) {
      tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
    }
  }

  const candidates = Array.from(tokenCounts.entries())
    .filter(([, c]) => c >= cfg.minOccurrences)
    .map(([t]) => t);

  type State = { length: number; startAt?: ISODateString; lastAt?: ISODateString; best?: Streak };
  const state = new Map<string, State>();
  for (const t of candidates) state.set(t, { length: 0 });

  const maxGapMs = cfg.streakMaxGapDays * DAY_MS;

  for (const e of entries) {
    const tMs = new Date(e.createdAt).getTime();
    const tokens = new Set(((e[category] ?? []) as string[]) ?? []);

    for (const token of candidates) {
      const s = state.get(token)!;
      const has = tokens.has(token);

      if (!has) {
        // reset streak
        s.length = 0;
        s.startAt = undefined;
        s.lastAt = undefined;
        continue;
      }

      // has token
      if (s.length === 0) {
        s.length = 1;
        s.startAt = e.createdAt;
        s.lastAt = e.createdAt;
      } else {
        const lastMs = s.lastAt ? new Date(s.lastAt).getTime() : tMs;
        const gap = tMs - lastMs;

        if (gap <= maxGapMs) {
          s.length += 1;
          s.lastAt = e.createdAt;
        } else {
          // gap too large; start new streak
          s.length = 1;
          s.startAt = e.createdAt;
          s.lastAt = e.createdAt;
        }
      }

      // update best
      const current: Streak = {
        token,
        category,
        length: s.length,
        startAt: s.startAt!,
        endAt: s.lastAt!,
        ongoing: e.createdAt === entries[entries.length - 1]?.createdAt,
      };

      if (!s.best || current.length > s.best.length) {
        s.best = { ...current, ongoing: false };
      }

      // If we're at the last dream and streak is ongoing, capture it too.
      if (e.id === entries[entries.length - 1]?.id) {
        s.best = pickBetterStreak(s.best, { ...current, ongoing: true });
      }
    }
  }

  const out: Streak[] = [];
  for (const [, s] of state.entries()) {
    if (s.best && s.best.length >= cfg.minOccurrences) out.push(s.best);
  }

  // prefer longer streaks, then more recent end
  out.sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return new Date(b.endAt).getTime() - new Date(a.endAt).getTime();
  });

  return out;
}

function pickBetterStreak(a?: Streak, b?: Streak): Streak | undefined {
  if (!a) return b;
  if (!b) return a;
  if (b.length > a.length) return b;
  if (b.length < a.length) return a;
  // same length: pick more recent
  return new Date(b.endAt).getTime() > new Date(a.endAt).getTime() ? b : a;
}

// --------- Co-occurrence pairs ---------

function topPairsFrom(
  entries: DreamEntry[],
  categories: [TokenCategory, TokenCategory],
  nowMs: number,
  cfg: PatternConfig
): PairItem[] {
  const [catA, catB] = categories;

  type PairStat = { count: number; weightedCount: number; lastSeenAt?: ISODateString };
  const map = new Map<string, PairStat>();

  for (const e of entries) {
    const tMs = new Date(e.createdAt).getTime();
    const daysAgo = Math.max(0, (nowMs - tMs) / DAY_MS);
    const w = recencyWeight(daysAgo, cfg.recencyHalfLifeDays);

    const a = Array.from(new Set(((e[catA] ?? []) as string[]) ?? []));
    const b = Array.from(new Set(((e[catB] ?? []) as string[]) ?? []));

    if (a.length === 0 || b.length === 0) continue;

    for (const ta of a) {
      for (const tb of b) {
        // Avoid duplicate mirrored pairs only for same-category pair lists
        if (catA === catB && ta === tb) continue;

        const [x, y] = catA === catB ? sort2(ta, tb) : [ta, tb];
        const key = `${x}||${y}`;

        const s = map.get(key) ?? { count: 0, weightedCount: 0 };
        s.count += 1;
        s.weightedCount += w;
        s.lastSeenAt = e.createdAt;
        map.set(key, s);
      }
    }
  }

  const out: PairItem[] = [];
  for (const [key, s] of map.entries()) {
    if (s.count < cfg.minPairOccurrences) continue;
    const [a, b] = key.split("||");
    out.push({
      a,
      b,
      count: s.count,
      weightedCount: round3(s.weightedCount),
      lastSeenAt: s.lastSeenAt,
    });
  }

  out.sort((x, y) => {
    if (y.weightedCount !== x.weightedCount) return y.weightedCount - x.weightedCount;
    return y.count - x.count;
  });

  return out.slice(0, cfg.topK);
}

function sort2(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// --------- Archetype detection ---------

function detectArchetypes(entries: DreamEntry[], nowMs: number, cfg: PatternConfig): ArchetypeHit[] {
  // Rule-based + evidence harvesting. Add more rules over time.
  const rules: Record<DreamArchetype, { mustAny?: string[]; boosts?: string[]; categories?: TokenCategory[] }> = {
    CHASE: {
      mustAny: ["being chased", "chased", "pursued", "hunted", "stalked"],
      boosts: ["running", "escaping", "hiding", "panic", "fear", "dark alley", "tunnel", "hallway"],
    },
    FALLING: { mustAny: ["falling", "fall"], boosts: ["cliff", "stairs", "elevator", "loss of control", "fear"] },
    TEETH: { mustAny: ["teeth falling out", "loose teeth", "broken teeth", "cracked teeth", "teeth crumbling"] },
    LOST: { mustAny: ["lost", "lost while traveling", "can't find", "searching"], boosts: ["maze", "labyrinth", "map", "wrong turn"] },
    LATE: { mustAny: ["running late", "missed flight", "missed train", "missed bus", "late to class", "deadline"], boosts: ["school", "exam", "airport", "station", "panic"] },
    TRAPPED: { mustAny: ["trapped", "locked", "no escape", "blocked exit", "cage", "confined"], boosts: ["panic", "fear", "small room", "closing walls"] },
    DROWNING: { mustAny: ["drowning", "sinking"], boosts: ["ocean", "flood", "dark water", "panic"] },
    PARALYSIS: { mustAny: ["sleep paralysis", "paralysis", "unable to move", "can't walk", "frozen body"], boosts: ["shadow figure", "pressure on chest", "silent scream"] },
    PUBLIC_EXPOSURE: { mustAny: ["nakedness", "being exposed", "naked in public"], boosts: ["shame", "embarrassment", "crowd", "being watched"] },
    CONFRONTATION: { mustAny: ["fighting", "arguing", "confrontation"], boosts: ["rage", "anger", "authority", "police"] },
    DEATH_VISITATION: { mustAny: ["seeing a dead loved one", "deceased", "ghost of loved one", "funeral"], boosts: ["message", "comforting", "goodbye"] },
    HOSPITAL: { mustAny: ["hospital", "emergency room", "surgery", "doctor", "nurse"], boosts: ["medicine", "pills", "injury", "illness"] },
    TRAVEL_HOTEL: { mustAny: ["hotel", "motel", "vacation", "airport", "travel"], boosts: ["suitcase", "lost while traveling", "foreign language"] },
    DISASTER: { mustAny: ["volcano", "earthquake", "tsunami", "tornado", "hurricane", "flood", "wildfire"], boosts: ["panic", "evacuation", "destruction"] },
    SPIRITUAL_CONFLICT: { mustAny: ["devil", "demon", "hell"], boosts: ["god", "angel", "prayer", "judgment", "temptation"] },
    FUTURISTIC: { mustAny: ["futuristic city", "spaceship", "alien", "android", "robot", "simulation", "virtual reality"], boosts: ["portal", "time travel", "parallel universe"] },
  };

  type Agg = { count: number; weighted: number; evidence: Set<string>; lastSeenAt?: ISODateString };
  const agg = new Map<DreamArchetype, Agg>();

  for (const e of entries) {
    const tMs = new Date(e.createdAt).getTime();
    const daysAgo = Math.max(0, (nowMs - tMs) / DAY_MS);
    const w = recencyWeight(daysAgo, cfg.recencyHalfLifeDays);

    const bag = new Set<string>([
      ...(e.symbols ?? []),
      ...(e.actions ?? []),
      ...(e.locations ?? []),
      ...(e.people ?? []),
      ...(e.emotions ?? []),
      ...(e.themes ?? []),
      ...(e.text ? tokenizeText(e.text, cfg.normalizeTokens) : []),
    ]);

    for (const archetype of Object.keys(rules) as DreamArchetype[]) {
      const rule = rules[archetype];
      const mustAny = rule.mustAny ?? [];
      const boosts = rule.boosts ?? [];

      const mustHit = mustAny.some((t) => bag.has(normalizeToken(t, cfg.normalizeTokens)));
      if (!mustHit) continue;

      const boostHits = boosts.filter((t) => bag.has(normalizeToken(t, cfg.normalizeTokens)));
      const scoreBoost = Math.min(0.35, boostHits.length * 0.08);

      const baseScore = 0.65 + scoreBoost; // 0.65..1.0-ish
      const a = agg.get(archetype) ?? { count: 0, weighted: 0, evidence: new Set<string>() };

      a.count += 1;
      a.weighted += w * baseScore;
      a.lastSeenAt = e.createdAt;
      mustAny.forEach((t) => {
        const nt = normalizeToken(t, cfg.normalizeTokens);
        if (bag.has(nt)) a.evidence.add(nt);
      });
      boostHits.forEach((t) => a.evidence.add(normalizeToken(t, cfg.normalizeTokens)));

      agg.set(archetype, a);
    }
  }

  const out: ArchetypeHit[] = [];
  for (const [archetype, a] of agg.entries()) {
    // Convert weighted to a 0..1-ish score
    const score = Math.min(1, a.weighted / Math.max(1, a.count));
    out.push({
      archetype,
      score: round3(score),
      evidence: Array.from(a.evidence).slice(0, 12),
      lastSeenAt: a.lastSeenAt,
      count: a.count,
    });
  }

  return out;
}

function tokenizeText(text: string, normalize: boolean): string[] {
  const raw = text
    .split(/[\s,.;:!?()\[\]{}"""'']/g)
    .map((t) => t.trim())
    .filter(Boolean);

  const cleaned = raw
    .map((t) => (normalize ? t.toLowerCase() : t))
    .filter((t) => t.length >= 3 && t.length <= 30);

  // Deduplicate
  return Array.from(new Set(cleaned));
}

function normalizeToken(t: string, normalize: boolean): string {
  const x = (t ?? "").trim();
  return normalize ? x.toLowerCase() : x;
}

// --------- Theme scoring ---------

function computeThemeScores(entries: DreamEntry[], nowMs: number, cfg: PatternConfig): ThemeScore[] {
  // Simple, extensible mapping from tokens -> themes.
  // You can customize this to match your product language (e.g., "stress", "healing", "connection").
  const THEME_MAP: Array<{ theme: string; tokens: string[] }> = [
    { theme: "fear", tokens: ["fear", "panic", "nightmare", "being chased", "trapped", "threat", "monster", "darkness"] },
    { theme: "control", tokens: ["losing control", "crashing", "paralysis", "locked", "blocked exit", "unable to move"] },
    { theme: "overwhelm", tokens: ["drowning", "flood", "tsunami", "storm", "overwhelm", "chaos"] },
    { theme: "identity", tokens: ["mask", "disguise", "mirror", "different face", "changing identity", "split identity"] },
    { theme: "attachment", tokens: ["abandonment", "rejection", "being replaced", "loneliness", "longing", "hugging"] },
    { theme: "love", tokens: ["love", "romance", "kiss", "hug", "partner", "wedding", "affection"] },
    { theme: "boundaries", tokens: ["unwanted touch", "violation", "power imbalance", "manipulation", "control", "unsafe"] },
    { theme: "healing", tokens: ["healing", "recovery", "therapy", "medicine", "hospital", "forgiveness", "relief"] },
    { theme: "grief", tokens: ["grief", "funeral", "seeing a dead loved one", "deceased", "mourning", "goodbye"] },
    { theme: "transition", tokens: ["travel", "vacation", "hotel", "moving", "crossroads", "bridge", "new beginning"] },
    { theme: "spirituality", tokens: ["god", "angel", "prayer", "temple", "church", "divine", "sacred"] },
    { theme: "shadow", tokens: ["shadow figure", "devil", "demon", "hell", "void", "abyss", "temptation"] },
  ];

  const themeAgg = new Map<string, { count: number; weighted: number }>();

  for (const e of entries) {
    const tMs = new Date(e.createdAt).getTime();
    const daysAgo = Math.max(0, (nowMs - tMs) / DAY_MS);
    const w = recencyWeight(daysAgo, cfg.recencyHalfLifeDays);

    const bag = new Set<string>([
      ...(e.symbols ?? []),
      ...(e.actions ?? []),
      ...(e.locations ?? []),
      ...(e.people ?? []),
      ...(e.emotions ?? []),
      ...(e.themes ?? []),
      ...(e.text ? tokenizeText(e.text, cfg.normalizeTokens) : []),
    ]);

    for (const row of THEME_MAP) {
      const hits = row.tokens
        .map((t) => normalizeToken(t, cfg.normalizeTokens))
        .filter((t) => bag.has(t));

      if (hits.length === 0) continue;

      // Each dream contributes at most 1 "count" to avoid overweighting.
      const base = 1;
      const boost = Math.min(0.6, hits.length * 0.12);
      const score = base + boost;

      const a = themeAgg.get(row.theme) ?? { count: 0, weighted: 0 };
      a.count += 1;
      a.weighted += w * score;
      themeAgg.set(row.theme, a);
    }
  }

  const out: ThemeScore[] = [];
  for (const [theme, a] of themeAgg.entries()) {
    out.push({
      theme,
      score: round3(a.weighted),
      count: a.count,
    });
  }

  return out;
}

// --------- Summary helpers ---------

function buildRisingList(groups: Array<{ category: TokenCategory; items: TopItem[] }>): Array<{
  category: TokenCategory;
  token: string;
  trendScore: number;
}> {
  const out: Array<{ category: TokenCategory; token: string; trendScore: number; weightedCount: number }> = [];
  for (const g of groups) {
    for (const it of g.items) {
      if (it.count < 2) continue;
      if (it.trendScore <= 0.15) continue; // rising threshold
      out.push({ category: g.category, token: it.token, trendScore: it.trendScore, weightedCount: it.weightedCount });
    }
  }
  out.sort((a, b) => b.trendScore - a.trendScore || b.weightedCount - a.weightedCount);
  return out.map(({ category, token, trendScore }) => ({ category, token, trendScore }));
}

function buildPersistentList(groups: Array<{ category: TokenCategory; items: TopItem[] }>): Array<{
  category: TokenCategory;
  token: string;
  weightedCount: number;
}> {
  const out: Array<{ category: TokenCategory; token: string; weightedCount: number }> = [];
  for (const g of groups) {
    for (const it of g.items) {
      if (it.count < 3) continue;
      out.push({ category: g.category, token: it.token, weightedCount: it.weightedCount });
    }
  }
  out.sort((a, b) => b.weightedCount - a.weightedCount);
  return out.slice(0, 24);
}
