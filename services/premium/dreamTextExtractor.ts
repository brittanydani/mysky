// dreamTextExtractor.ts
// Phrase-to-evidence extractor (astrology-free)
// Converts dream journal text -> trigger signals + evidence snippets + coverage.
// Designed to be deterministic (no LLM) and privacy-friendly (local-only).
//
// Output matches the DreamTextSignals shape used by your synthesis engine:
//   { coverage: 0..1, triggers: {trigger: 0..1}, evidence: {trigger: EvidenceHit[]} }
//
// How it works:
// - Tokenizes text into sentences
// - Runs weighted regex patterns per trigger
// - Scores each trigger based on matched patterns, diversity, and density
// - Produces "evidence snippets" (short sentence fragments)
//
// You can tune weights and pattern lists over time.

export type ShadowTrigger =
  | "abandonment"
  | "rejection"
  | "betrayal"
  | "shame"
  | "exposure"
  | "control"
  | "power"
  | "helplessness"
  | "danger"
  | "intimacy"
  | "sexuality"
  | "consent_violation"
  | "worthiness"
  | "responsibility"
  | "failure"
  | "grief"
  | "identity"
  | "belonging"
  | "unpredictability"
  | "punishment"
  | "isolation"
  | "transformation";

export type EvidenceHit = {
  trigger: ShadowTrigger;
  patternId: string;
  weight: number; // 0..1
  // Short snippet excerpt (safe to show user)
  snippet: string;
  // Sentence index (for debugging or linking)
  sentenceIndex: number;
  // Raw match text (optional; keep short)
  match: string;
};

export type DreamTextSignals = {
  coverage: number; // 0..1 overall reliability
  triggers: Partial<Record<ShadowTrigger, number>>; // 0..1 per trigger
  evidence: Partial<Record<ShadowTrigger, EvidenceHit[]>>;
  meta: {
    charCount: number;
    sentenceCount: number;
    matchedPatterns: number;
    uniqueTriggersMatched: number;
  };
};

// -------------------------
// Utilities
// -------------------------
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function safeLower(s: string): string {
  return (s ?? "").toLowerCase();
}

function splitSentences(text: string): string[] {
  // Simple sentence splitter; robust enough for journals.
  // Keeps short lines as sentences too.
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) return [];

  // Split on punctuation OR double newlines; keep fragments.
  const rough = cleaned
    .split(/(?<=[.!?])\s+|\n{2,}/g)
    .map((s) => s.trim())
    .filter(Boolean);

  // If user writes one long paragraph with no punctuation, fallback by chunking.
  if (rough.length <= 1 && cleaned.length > 240) {
    const chunks: string[] = [];
    let i = 0;
    while (i < cleaned.length) {
      chunks.push(cleaned.slice(i, i + 160).trim());
      i += 160;
    }
    return chunks.filter(Boolean);
  }

  return rough;
}

function excerptAround(sentence: string, matchIndex: number, matchLen: number, maxLen = 120): string {
  const s = sentence.trim();
  if (s.length <= maxLen) return s;

  const start = Math.max(0, matchIndex - Math.floor(maxLen / 2));
  const end = Math.min(s.length, start + maxLen);
  const slice = s.slice(start, end).trim();
  const prefix = start > 0 ? "\u2026" : "";
  const suffix = end < s.length ? "\u2026" : "";
  return `${prefix}${slice}${suffix}`;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// -------------------------
// Pattern Library
// -------------------------
type PatternDef = {
  id: string;
  // IMPORTANT: use non-global regex so we can compute index reliably per exec.
  re: RegExp;
  weight: number; // 0..1
  // Optional hint to support future UX (not required)
  hint?: string;
};

type TriggerPatternMap = Record<ShadowTrigger, PatternDef[]>;

const W = {
  LOW: 0.25,
  MED: 0.45,
  HIGH: 0.7,
  VERY_HIGH: 0.9,
};

// NOTE: Patterns are intentionally broad but not graphic.
// We avoid explicit content; we focus on boundaries, coercion, fear, etc.
export const TRIGGER_PATTERNS: TriggerPatternMap = {
  abandonment: [
    { id: "abandon_left", re: /\b(left me|left us|left behind|walked away|abandoned)\b/i, weight: W.HIGH },
    { id: "abandon_disappear", re: /\b(disappeared|vanished|gone suddenly|no longer there)\b/i, weight: W.MED },
    { id: "abandon_missed", re: /\b(missed (the|my|our) (train|bus|flight)|they left without me)\b/i, weight: W.MED },
    { id: "abandon_no_response", re: /\b(no answer|wouldn't answer|ignored my calls|ghosted)\b/i, weight: W.MED },
    { id: "abandon_locked_out", re: /\b(locked out|shut out|door (was|is) locked)\b/i, weight: W.MED },
    { id: "abandon_separated", re: /\b(separated|couldn't find (him|her|them)|lost (him|her|them))\b/i, weight: W.MED },
    { id: "abandon_breakup", re: /\b(broke up|divorced|we were done|they dumped me)\b/i, weight: W.HIGH },
  ],

  rejection: [
    { id: "reject_excluded", re: /\b(kicked out|not allowed|wasn't invited|uninvited|excluded)\b/i, weight: W.HIGH },
    { id: "reject_ignored", re: /\b(ignored me|looked right through me|pretended I wasn't there)\b/i, weight: W.MED },
    { id: "reject_laughed", re: /\b(laughed at me|mocked me|made fun of me)\b/i, weight: W.HIGH },
    { id: "reject_not_wanted", re: /\b(didn't want me|told me to leave|go away)\b/i, weight: W.HIGH },
    { id: "reject_cold", re: /\b(cold shoulder|they were cold|dismissed me)\b/i, weight: W.MED },
    { id: "reject_denied", re: /\b(denied me|refused me|turned me down)\b/i, weight: W.MED },
  ],

  betrayal: [
    { id: "betray_lied", re: /\b(lied to me|lied|deceived|tricked)\b/i, weight: W.MED },
    { id: "betray_secret", re: /\b(told my secret|exposed my secret|shared (it|that) with)\b/i, weight: W.HIGH },
    { id: "betray_cheat", re: /\b(cheated|affair|two-timing)\b/i, weight: W.HIGH },
    { id: "betray_backstab", re: /\b(backstabbed|turned on me|took their side)\b/i, weight: W.HIGH },
    { id: "betray_stole", re: /\b(stole|robbed|took (my|our) (money|phone|keys))\b/i, weight: W.MED },
    { id: "betray_framed", re: /\b(framed me|set me up|blamed me for)\b/i, weight: W.HIGH },
  ],

  shame: [
    { id: "shame_humiliate", re: /\b(humiliated|mortified|embarrassed)\b/i, weight: W.HIGH },
    { id: "shame_dirty", re: /\b(dirty|disgusting|gross|filthy)\b/i, weight: W.MED },
    { id: "shame_guilt", re: /\b(guilty|it was my fault|I felt bad)\b/i, weight: W.MED },
    { id: "shame_small", re: /\b(so small|felt small|ashamed)\b/i, weight: W.HIGH },
    { id: "shame_hide", re: /\b(hide(ing)?|cover(ing)? up|couldn't let them see)\b/i, weight: W.MED },
  ],

  exposure: [
    { id: "expose_watched", re: /\b(watched me|staring|everyone stared|eyes on me)\b/i, weight: W.MED },
    { id: "expose_public", re: /\b(in public|on stage|presentation|spotlight)\b/i, weight: W.MED },
    { id: "expose_naked", re: /\b(naked|no clothes|undressed)\b/i, weight: W.HIGH },
    { id: "expose_recorded", re: /\b(recorded|camera|filmed|surveillance)\b/i, weight: W.MED },
    { id: "expose_messages", re: /\b(texts were (out|leaked)|messages leaked|my phone was (taken|hacked))\b/i, weight: W.HIGH },
    { id: "expose_cant_speak", re: /\b(trying to speak|couldn't speak|no voice|couldn't scream)\b/i, weight: W.HIGH },
  ],

  control: [
    { id: "control_rules", re: /\b(rules|strict|had to follow|not allowed)\b/i, weight: W.MED },
    { id: "control_checked", re: /\b(check(ed|ing) (locks|doors|phone|messages)|kept checking)\b/i, weight: W.MED },
    { id: "control_locked", re: /\b(locked (me|us) in|couldn't leave|wouldn't let me leave)\b/i, weight: W.HIGH },
    { id: "control_taken", re: /\b(took control|controlled me|made me)\b/i, weight: W.HIGH },
    { id: "control_schedule", re: /\b(schedule|plan|routine|had to be on time)\b/i, weight: W.LOW },
  ],

  power: [
    { id: "power_fight", re: /\b(fought back|stood up|confronted|yelled back)\b/i, weight: W.MED },
    { id: "power_dominance", re: /\b(dominated|power over|in charge|bossed)\b/i, weight: W.MED },
    { id: "power_restraint", re: /\b(restrained|held down|pinned|couldn't move)\b/i, weight: W.HIGH },
    { id: "power_keys", re: /\b(took my keys|took my phone|took my wallet)\b/i, weight: W.MED },
    { id: "power_choice", re: /\b(I decided|I chose|I refused|I said no)\b/i, weight: W.MED },
  ],

  helplessness: [
    { id: "help_less", re: /\b(helpless|powerless|couldn't do anything|nothing I could do)\b/i, weight: W.HIGH },
    { id: "help_stuck", re: /\b(stuck|trapped|cornered|couldn't get out)\b/i, weight: W.HIGH },
    { id: "help_slow", re: /\b(slow motion|moving so slowly|heavy legs)\b/i, weight: W.MED },
    { id: "help_no_tools", re: /\b(no phone|phone didn't work|couldn't call|no signal)\b/i, weight: W.MED },
    { id: "help_brakes", re: /\b(brakes? (didn't|wouldn't) work|car wouldn't stop)\b/i, weight: W.HIGH },
  ],

  danger: [
    { id: "danger_chase", re: /\b(chased|running from|being hunted|they were after me)\b/i, weight: W.HIGH },
    { id: "danger_attack", re: /\b(attacked|threatened|hurt me|came at me)\b/i, weight: W.HIGH },
    { id: "danger_intruder", re: /\b(intruder|break[- ]?in|someone broke in)\b/i, weight: W.HIGH },
    { id: "danger_weapon", re: /\b(weapon|gun|knife|blood)\b/i, weight: W.HIGH },
    { id: "danger_disaster", re: /\b(fire|explosion|earthquake|tornado|flood|crash)\b/i, weight: W.MED },
    { id: "danger_dark", re: /\b(dark|shadowy|couldn't see)\b/i, weight: W.LOW },
  ],

  intimacy: [
    { id: "intimacy_hug", re: /\b(hug(ged)?|held me|cuddled|snuggled)\b/i, weight: W.MED },
    { id: "intimacy_care", re: /\b(took care of me|comforted me|soothed me)\b/i, weight: W.MED },
    { id: "intimacy_eye", re: /\b(looked into my eyes|felt close|felt connected)\b/i, weight: W.MED },
    { id: "intimacy_kiss", re: /\b(kiss(ed)?|almost kissed)\b/i, weight: W.MED },
    { id: "intimacy_home", re: /\b(in bed together|shared a room|sleeping next to)\b/i, weight: W.LOW },
  ],

  sexuality: [
    { id: "sex_aroused", re: /\b(aroused|turned on|horny)\b/i, weight: W.HIGH },
    { id: "sex_sex", re: /\b(had sex|sex|hooked up|made out)\b/i, weight: W.HIGH },
    { id: "sex_nudity", re: /\b(nude|naked)\b/i, weight: W.MED },
    { id: "sex_intense", re: /\b(intense|passionate|couldn't stop)\b/i, weight: W.LOW },
  ],

  consent_violation: [
    // Keep patterns general and non-graphic.
    { id: "consent_forced", re: /\b(forced|wouldn't stop|wouldn't let me|I couldn't get away)\b/i, weight: W.VERY_HIGH },
    { id: "consent_no", re: /\b(I said no|I tried to say no|I didn't want)\b/i, weight: W.HIGH },
    { id: "consent_touched", re: /\b(touched me|grabbed me|cornered me)\b/i, weight: W.HIGH },
    { id: "consent_followed", re: /\b(followed me|wouldn't leave me alone)\b/i, weight: W.MED },
    { id: "consent_fear", re: /\b(felt violated|felt unsafe)\b/i, weight: W.HIGH },
  ],

  worthiness: [
    { id: "worthy_prove", re: /\b(prove(d)? myself|trying to prove|earn(ed)? it)\b/i, weight: W.MED },
    { id: "worthy_not_enough", re: /\b(not good enough|not enough|unworthy|undeserving)\b/i, weight: W.HIGH },
    { id: "worthy_compare", re: /\b(they chose (her|him) over me|replaced me)\b/i, weight: W.HIGH },
    { id: "worthy_apology", re: /\b(kept apologizing|sorry for)\b/i, weight: W.LOW },
    { id: "worthy_praise", re: /\b(proud of me|praised me|finally approved)\b/i, weight: W.MED },
  ],

  responsibility: [
    { id: "resp_caretake", re: /\b(took care of|babysit|caretaker|responsible for)\b/i, weight: W.MED },
    { id: "resp_workload", re: /\b(deadline|so much to do|too much|overwhelmed)\b/i, weight: W.MED },
    { id: "resp_fix", re: /\b(I had to fix|I had to handle|I had to manage)\b/i, weight: W.MED },
    { id: "resp_protect", re: /\b(protect(ed)? (him|her|them)|kept them safe)\b/i, weight: W.MED },
    { id: "resp_parent", re: /\b(kids?|child(ren)?|baby)\b/i, weight: W.LOW },
  ],

  failure: [
    { id: "fail_test", re: /\b(test|exam|quiz|failed|failing)\b/i, weight: W.MED },
    { id: "fail_late", re: /\b(late|missed (it|them)|forgot|couldn't remember)\b/i, weight: W.MED },
    { id: "fail_mistake", re: /\b(mistake|messed up|ruined)\b/i, weight: W.MED },
    { id: "fail_unprepared", re: /\b(unprepared|didn't study|didn't have what I needed)\b/i, weight: W.MED },
    { id: "fail_impossible", re: /\b(impossible|couldn't do it|nothing worked)\b/i, weight: W.MED },
  ],

  grief: [
    { id: "grief_miss", re: /\b(missed (him|her|them)|longed for|aching)\b/i, weight: W.MED },
    { id: "grief_funeral", re: /\b(funeral|grave|death|died)\b/i, weight: W.HIGH },
    { id: "grief_goodbye", re: /\b(goodbye|last time|never again)\b/i, weight: W.MED },
    { id: "grief_cry", re: /\b(crying|sobbing|tears)\b/i, weight: W.MED },
    { id: "grief_oldplace", re: /\b(old house|childhood home|back then)\b/i, weight: W.LOW },
  ],

  identity: [
    { id: "id_mirror", re: /\b(mirror|reflection|photo of me|looked different)\b/i, weight: W.MED },
    { id: "id_name", re: /\b(new name|different name|called me)\b/i, weight: W.MED },
    { id: "id_age", re: /\b(I was a kid|I was younger|I was older)\b/i, weight: W.MED },
    { id: "id_costume", re: /\b(costume|disguise|pretending to be|acting like)\b/i, weight: W.MED },
    { id: "id_imposter", re: /\b(imposter|didn't belong there)\b/i, weight: W.MED },
  ],

  belonging: [
    { id: "belong_welcome", re: /\b(welcomed|invited|included|they wanted me there)\b/i, weight: W.MED },
    { id: "belong_home", re: /\b(home|my room|safe place)\b/i, weight: W.LOW },
    { id: "belong_family", re: /\b(family|mom|dad|sister|brother)\b/i, weight: W.LOW },
    { id: "belong_group", re: /\b(group|friends|party|team)\b/i, weight: W.LOW },
    { id: "belong_seat", re: /\b(there was a place for me|saved me a seat)\b/i, weight: W.MED },
  ],

  unpredictability: [
    { id: "unpred_changed", re: /\b(suddenly|out of nowhere|randomly)\b/i, weight: W.LOW },
    { id: "unpred_rules", re: /\b(rules changed|moving goalposts|kept changing)\b/i, weight: W.MED },
    { id: "unpred_lost", re: /\b(lost|couldn't find my way|wrong turn|gps)\b/i, weight: W.MED },
    { id: "unpred_weird", re: /\b(surreal|weird|uncanny|didn't make sense)\b/i, weight: W.MED },
    { id: "unpred_break", re: /\b(broke|fell apart|glitched|malfunctioned)\b/i, weight: W.LOW },
  ],

  punishment: [
    { id: "punish_arrest", re: /\b(arrested|police|handcuffs|jail)\b/i, weight: W.HIGH },
    { id: "punish_scold", re: /\b(scolded|yelled at me|in trouble|grounded)\b/i, weight: W.MED },
    { id: "punish_sentenced", re: /\b(sentenced|court|judge|trial)\b/i, weight: W.HIGH },
    { id: "punish_consequence", re: /\b(consequences|punished|pay for it)\b/i, weight: W.MED },
    { id: "punish_shame", re: /\b(publicly|in front of everyone)\b/i, weight: W.LOW },
  ],

  isolation: [
    { id: "isol_alone", re: /\b(alone|by myself|no one was there)\b/i, weight: W.MED },
    { id: "isol_empty", re: /\b(empty|deserted|abandoned place)\b/i, weight: W.MED },
    { id: "isol_unheard", re: /\b(no one heard me|no one helped|nobody came)\b/i, weight: W.HIGH },
    { id: "isol_hidden", re: /\b(hiding|hid|stayed hidden)\b/i, weight: W.MED },
    { id: "isol_locked", re: /\b(locked in|couldn't get out)\b/i, weight: W.MED },
  ],

  transformation: [
    { id: "trans_move", re: /\b(moving|packed|new house|relocating)\b/i, weight: W.MED },
    { id: "trans_door", re: /\b(doorway|threshold|bridge|staircase|hallway)\b/i, weight: W.LOW },
    { id: "trans_renovate", re: /\b(renovate|rebuild|repair|construction)\b/i, weight: W.MED },
    { id: "trans_shift", re: /\b(changed|transform(ed)?|became)\b/i, weight: W.LOW },
    { id: "trans_newlife", re: /\b(new life|starting over|fresh start)\b/i, weight: W.MED },
  ],
};

// -------------------------
// Scoring Model (per trigger)
// -------------------------
type TriggerAggregate = {
  totalWeight: number;
  matchedPatternIds: string[];
  hits: EvidenceHit[];
};

function scoreTrigger(agg: TriggerAggregate): number {
  // Base: saturating curve based on total weight.
  // Add diversity bonus if multiple distinct patterns hit.
  const base = 1 - Math.exp(-agg.totalWeight); // saturates toward 1
  const diversity = clamp(agg.matchedPatternIds.length / 4, 0, 1) * 0.20; // up to +0.20
  // Penalize if only low-weight vague matches (e.g., "suddenly" only)
  const lowOnly = agg.totalWeight < 0.35 && agg.matchedPatternIds.length <= 1 ? 0.10 : 0;
  return clamp(base + diversity - lowOnly, 0, 1);
}

function computeCoverage(meta: {
  charCount: number;
  sentenceCount: number;
  matchedPatterns: number;
  uniqueTriggersMatched: number;
}): number {
  const { charCount, sentenceCount, matchedPatterns, uniqueTriggersMatched } = meta;

  const lengthFactor = clamp(charCount / 400, 0, 1); // 400+ chars = good
  const sentenceFactor = clamp(sentenceCount / 5, 0, 1);
  const matchFactor = clamp(matchedPatterns / 6, 0, 1);
  const triggerFactor = clamp(uniqueTriggersMatched / 5, 0, 1);

  // Weighted blend — favors actual matches, then text length, then diversity.
  const cov = 0.45 * matchFactor + 0.25 * lengthFactor + 0.15 * triggerFactor + 0.15 * sentenceFactor;
  return clamp(cov, 0, 1);
}

// -------------------------
// Main extraction
// -------------------------
export function extractDreamTextSignals(text: string, opts?: { maxEvidencePerTrigger?: number }): DreamTextSignals {
  const maxEvidencePerTrigger = opts?.maxEvidencePerTrigger ?? 4;

  const raw = (text ?? "").trim();
  const charCount = raw.length;

  const sentences = splitSentences(raw);
  const sentenceCount = sentences.length;

  const aggregates: Partial<Record<ShadowTrigger, TriggerAggregate>> = {};
  const evidence: Partial<Record<ShadowTrigger, EvidenceHit[]>> = {};

  const initAgg = (_t: ShadowTrigger): TriggerAggregate => ({
    totalWeight: 0,
    matchedPatternIds: [],
    hits: [],
  });

  let matchedPatterns = 0;

  // Pre-lowercase sentences for cheap scanning (but regex still runs on original for indices)
  const sentencesLower = sentences.map((s) => safeLower(s));

  (Object.keys(TRIGGER_PATTERNS) as ShadowTrigger[]).forEach((trigger) => {
    const patterns = TRIGGER_PATTERNS[trigger];
    let agg = aggregates[trigger];
    if (!agg) {
      agg = initAgg(trigger);
      aggregates[trigger] = agg;
    }

    for (let si = 0; si < sentences.length; si++) {
      const sent = sentences[si];
      const sentLower = sentencesLower[si];

      for (const p of patterns) {
        // Very cheap skip: if sentence is very short and pattern weight low, skip.
        if (sentLower.length < 18 && p.weight <= 0.3) continue;

        const m = p.re.exec(sent);
        if (!m) continue;

        matchedPatterns += 1;
        agg.totalWeight += p.weight;

        if (!agg.matchedPatternIds.includes(p.id)) agg.matchedPatternIds.push(p.id);

        const matchText = (m[0] ?? "").toString().slice(0, 40);
        const idx = typeof m.index === "number" ? m.index : Math.max(0, sentLower.indexOf(matchText.toLowerCase()));
        const snippet = excerptAround(sent, idx, matchText.length, 120);

        const hit: EvidenceHit = {
          trigger,
          patternId: p.id,
          weight: p.weight,
          snippet,
          sentenceIndex: si,
          match: matchText,
        };

        agg.hits.push(hit);

        // Cap evidence per trigger (keep best hits by weight)
        const hitsSorted = agg.hits
          .slice()
          .sort((a, b) => b.weight - a.weight || a.sentenceIndex - b.sentenceIndex);
        agg.hits = hitsSorted.slice(0, maxEvidencePerTrigger * 2); // keep some extra for de-dupe later
      }
    }

    // De-dupe evidence snippets by sentenceIndex + patternId
    const uniqKey = new Set<string>();
    const deduped: EvidenceHit[] = [];
    for (const h of agg.hits.sort((a, b) => b.weight - a.weight || a.sentenceIndex - b.sentenceIndex)) {
      const k = `${h.patternId}:${h.sentenceIndex}`;
      if (uniqKey.has(k)) continue;
      uniqKey.add(k);
      deduped.push(h);
      if (deduped.length >= maxEvidencePerTrigger) break;
    }
    evidence[trigger] = deduped;
    agg.hits = deduped;
  });

  // Build trigger scores
  const triggerScores: Partial<Record<ShadowTrigger, number>> = {};
  const triggersMatched: ShadowTrigger[] = [];

  for (const t of Object.keys(TRIGGER_PATTERNS) as ShadowTrigger[]) {
    const agg = aggregates[t];
    if (!agg) continue;
    const score = scoreTrigger(agg);
    if (score > 0) {
      triggerScores[t] = score;
      triggersMatched.push(t);
    } else {
      triggerScores[t] = 0;
      // keep evidence empty for cleanliness
      evidence[t] = (evidence[t] ?? []).filter(() => false);
    }
  }

  const uniqueTriggersMatched = unique(triggersMatched.filter((t) => (triggerScores[t] ?? 0) > 0.15)).length;

  const meta = {
    charCount,
    sentenceCount,
    matchedPatterns,
    uniqueTriggersMatched,
  };

  const coverage = computeCoverage(meta);

  // Soft reliability drop if text is extremely short
  const shortPenalty = charCount < 80 ? 0.18 : charCount < 160 ? 0.08 : 0;
  const finalCoverage = clamp(coverage - shortPenalty, 0, 1);

  return {
    coverage: finalCoverage,
    triggers: triggerScores,
    evidence,
    meta,
  };
}

// -------------------------
// Optional helper: pick "best evidence" strings for UI
// -------------------------
export function formatEvidenceForUI(
  signals: DreamTextSignals,
  topTriggers: ShadowTrigger[],
  maxPerTrigger = 2
): Array<{ trigger: ShadowTrigger; snippets: string[] }> {
  return topTriggers.map((t) => {
    const hits = signals.evidence[t] ?? [];
    const snippets = hits.slice(0, maxPerTrigger).map((h) => h.snippet);
    return { trigger: t, snippets };
  });
}
