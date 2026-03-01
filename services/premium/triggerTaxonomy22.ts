// triggerTaxonomy22.ts
// Expanded 22-trigger taxonomy for the dream engine.

export type Valence = "positive" | "negative" | "mixed";
export type Activation = "low" | "medium" | "high";
export type AttachmentTone = "secure" | "anxious" | "avoidant" | "disorganized";
export type NervousSystemBranch = "fight" | "flight" | "freeze" | "collapse" | "ventral_safety";

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

export type TriggerDefinition = {
  id: ShadowTrigger;
  label: string;

  // What this trigger means psychologically (plain language)
  coreDefinition: string;

  // Dream "symbols" / motifs that commonly express it
  commonMotifs: string[];

  // Feeling-language that often accompanies it (for UI suggestions + validation)
  commonFeels: string[];

  // Typical pattern defaults (engine can override via user selections)
  defaultValence: Valence;
  defaultActivation: Activation;

  // Which attachment pattern it often resembles in the moment
  typicalAttachment: AttachmentTone[];

  // Typical autonomic signatures (can be blended)
  typicalNervousSystem: NervousSystemBranch[];

  // Micro-themes your cards can reference for specificity
  subThemes: string[];

  // Gentle interpretation frame starter (for card "what it may reflect")
  interpretationFrame: string;
};

/**
 * All 22 shadow triggers as an array, for iteration / validation.
 */
export const SHADOW_TRIGGERS_22: readonly ShadowTrigger[] = [
  "abandonment", "rejection", "betrayal", "shame", "exposure", "control",
  "power", "helplessness", "danger", "intimacy", "sexuality", "consent_violation",
  "worthiness", "responsibility", "failure", "grief", "identity", "belonging",
  "unpredictability", "punishment", "isolation", "transformation",
] as const;

export const TRIGGER_TAXONOMY_22: Record<ShadowTrigger, TriggerDefinition> = {
  abandonment: {
    id: "abandonment",
    label: "Abandonment",
    coreDefinition:
      "Fear or expectation of being left, forgotten, replaced, or emotionally dropped when you need closeness or support.",
    commonMotifs: [
      "being left behind",
      "someone disappears",
      "missed train/plane",
      "doors locked / can't enter",
      "searching for someone",
      "phone calls not answered",
      "goodbyes without closure",
    ],
    commonFeels: ["panicky", "aching", "desperate", "sad", "clingy", "empty", "yearning"],
    defaultValence: "negative",
    defaultActivation: "high",
    typicalAttachment: ["anxious", "disorganized"],
    typicalNervousSystem: ["flight", "freeze"],
    subThemes: ["replacement", "object permanence", "separation distress", "not chosen", "not returned to"],
    interpretationFrame:
      "May reflect sensitivity to disconnection, uncertainty about stability, or a need for reassurance and continuity.",
  },

  rejection: {
    id: "rejection",
    label: "Rejection",
    coreDefinition:
      "Fear or experience of being excluded, dismissed, disliked, or judged as unwanted by a person or group.",
    commonMotifs: [
      "not invited",
      "kicked out",
      "everyone ignores you",
      "public dismissal",
      "failed social entry (can't get in)",
      "being laughed at",
    ],
    commonFeels: ["stung", "hurt", "embarrassed", "angry", "small", "ashamed", "lonely"],
    defaultValence: "negative",
    defaultActivation: "medium",
    typicalAttachment: ["anxious", "avoidant", "disorganized"],
    typicalNervousSystem: ["fight", "freeze"],
    subThemes: ["social rank", "belonging threat", "being misunderstood", "not acceptable", "being unwanted"],
    interpretationFrame:
      "May reflect social vulnerability, fear of judgment, or older experiences of not being welcomed as you are.",
  },

  betrayal: {
    id: "betrayal",
    label: "Betrayal",
    coreDefinition:
      "A rupture of trust — someone is unsafe, dishonest, disloyal, or chooses others over you.",
    commonMotifs: [
      "cheating / two lives",
      "someone shares your secret",
      "you're framed/blamed",
      "friend turns on you",
      "stolen items",
      "double-cross / setup",
    ],
    commonFeels: ["shocked", "furious", "grieving", "paranoid", "hurt", "disoriented"],
    defaultValence: "negative",
    defaultActivation: "high",
    typicalAttachment: ["disorganized", "anxious"],
    typicalNervousSystem: ["fight", "flight"],
    subThemes: ["trust collapse", "hypervigilance", "loyalty tests", "inconsistent care", "gaslighting"],
    interpretationFrame:
      "May reflect a trust injury, fear of being misled, or the need to strengthen boundaries and discernment.",
  },

  shame: {
    id: "shame",
    label: "Shame",
    coreDefinition:
      "Sense of being fundamentally wrong, bad, dirty, or unlovable — not just doing something wrong, but being wrong.",
    commonMotifs: [
      "humiliation",
      "being laughed at",
      "dirty/contaminated",
      "being scolded",
      "can't hide a flaw",
      "public mistakes",
    ],
    commonFeels: ["mortified", "dirty", "cringing", "small", "guilty", "wanting to disappear"],
    defaultValence: "negative",
    defaultActivation: "medium",
    typicalAttachment: ["avoidant", "disorganized", "anxious"],
    typicalNervousSystem: ["freeze", "collapse"],
    subThemes: ["defectiveness", "self-contempt", "exile parts", "moral injury", "internal critic"],
    interpretationFrame:
      "May reflect self-attack patterns, fear of exposure, or an old belief that love requires being perfect.",
  },

  exposure: {
    id: "exposure",
    label: "Exposure",
    coreDefinition:
      "Fear of being seen too clearly — losing privacy, being watched, revealed, or unable to control what others know.",
    commonMotifs: [
      "naked / underdressed",
      "on stage unprepared",
      "being recorded",
      "phone hacked / messages leaked",
      "everyone staring",
      "no voice / can't speak",
    ],
    commonFeels: ["exposed", "panicked", "embarrassed", "unsafe", "hyperaware", "frozen"],
    defaultValence: "negative",
    defaultActivation: "high",
    typicalAttachment: ["avoidant", "disorganized"],
    typicalNervousSystem: ["flight", "freeze"],
    subThemes: ["privacy violation", "spotlight fear", "being evaluated", "losing control of narrative"],
    interpretationFrame:
      "May reflect vulnerability around visibility, boundaries, or a fear of being judged if fully seen.",
  },

  control: {
    id: "control",
    label: "Control",
    coreDefinition:
      "Power struggle around autonomy — being controlled, controlling others, or rigidly managing outcomes to feel safe.",
    commonMotifs: [
      "locked doors",
      "rules you can't break",
      "someone won't let you leave",
      "you obsessively check things",
      "missing keys/phone",
      "being forced into a plan",
    ],
    commonFeels: ["tense", "rigid", "angry", "trapped", "driven", "restless"],
    defaultValence: "mixed",
    defaultActivation: "high",
    typicalAttachment: ["avoidant", "anxious", "disorganized"],
    typicalNervousSystem: ["fight", "flight"],
    subThemes: ["autonomy threat", "hyper-responsibility", "perfectionism", "compulsion", "safety through certainty"],
    interpretationFrame:
      "May reflect a need for safety and predictability — or a conflict between freedom and fear of chaos.",
  },

  power: {
    id: "power",
    label: "Power",
    coreDefinition:
      "Themes of dominance, agency, status, and influence — either claiming power, losing it, or negotiating it.",
    commonMotifs: [
      "confrontation",
      "winning/losing a contest",
      "being promoted / demoted",
      "being restrained",
      "someone takes your resources",
      "you refuse / assert yourself",
    ],
    commonFeels: ["strong", "enraged", "determined", "defiant", "humiliated", "emboldened"],
    defaultValence: "mixed",
    defaultActivation: "high",
    typicalAttachment: ["secure", "disorganized", "avoidant"],
    typicalNervousSystem: ["fight", "ventral_safety"],
    subThemes: ["agency", "status threat", "dominance/submission", "voice", "self-advocacy"],
    interpretationFrame:
      "May reflect your relationship with agency — where you feel empowered, overridden, or ready to reclaim voice.",
  },

  helplessness: {
    id: "helplessness",
    label: "Helplessness",
    coreDefinition:
      "Feeling unable to act, escape, or influence what's happening — especially when something matters.",
    commonMotifs: [
      "moving in slow motion",
      "can't run / legs heavy",
      "car brakes don't work",
      "phone won't dial",
      "frozen body",
      "trapped in a room",
    ],
    commonFeels: ["panicked", "stuck", "small", "defeated", "frustrated", "numb"],
    defaultValence: "negative",
    defaultActivation: "high",
    typicalAttachment: ["disorganized", "anxious"],
    typicalNervousSystem: ["freeze", "collapse"],
    subThemes: ["learned helplessness", "shutdown", "blocked action", "no rescue", "dependency fear"],
    interpretationFrame:
      "May reflect overwhelm, past powerlessness, or a present situation where you're carrying too much alone.",
  },

  danger: {
    id: "danger",
    label: "Danger",
    coreDefinition:
      "Threat detection — physical or emotional danger, pursuit, attack, catastrophe, or looming harm.",
    commonMotifs: [
      "being chased",
      "intruder",
      "accident/crash",
      "weapons",
      "natural disasters",
      "dark unknown presence",
    ],
    commonFeels: ["terrified", "hyperalert", "urgent", "panicked", "ready to bolt"],
    defaultValence: "negative",
    defaultActivation: "high",
    typicalAttachment: ["disorganized"],
    typicalNervousSystem: ["flight", "fight", "freeze"],
    subThemes: ["hypervigilance", "threat bias", "unsafe environment", "anticipation", "startle response"],
    interpretationFrame:
      "May reflect stress load, vigilance patterns, or emotional danger cues that your system treats as urgent.",
  },

  intimacy: {
    id: "intimacy",
    label: "Intimacy",
    coreDefinition:
      "Closeness, comfort, tenderness, connection, and being emotionally met — or fear of closeness.",
    commonMotifs: [
      "hugging/cuddling",
      "being cared for",
      "eye contact",
      "being chosen",
      "sleeping beside someone",
      "reunion",
    ],
    commonFeels: ["warm", "safe", "melting", "seen", "yearning", "nervous-excited"],
    defaultValence: "positive",
    defaultActivation: "medium",
    typicalAttachment: ["secure", "anxious", "disorganized"],
    typicalNervousSystem: ["ventral_safety", "flight"],
    subThemes: ["co-regulation", "earned safety", "attachment hunger", "fear of closeness", "trust building"],
    interpretationFrame:
      "May reflect a need for comfort, a growing capacity for closeness, or mixed feelings about being truly seen.",
  },

  sexuality: {
    id: "sexuality",
    label: "Sexuality",
    coreDefinition:
      "Erotic energy, desire, attraction, pleasure, boundaries, and intimacy charge — can be safe, conflicted, or symbolic.",
    commonMotifs: [
      "arousal",
      "kissing/sex",
      "nudity",
      "seduction",
      "magnetic pull",
      "taboo intensity",
    ],
    commonFeels: ["turned on", "curious", "bold", "conflicted", "ashamed", "alive"],
    defaultValence: "mixed",
    defaultActivation: "high",
    typicalAttachment: ["secure", "anxious", "avoidant", "disorganized"],
    typicalNervousSystem: ["ventral_safety", "flight", "fight"],
    subThemes: ["desire", "pleasure", "taboo", "ownership of wants", "boundary testing"],
    interpretationFrame:
      "May reflect desire, vitality, closeness needs, or a place where pleasure and safety are being renegotiated.",
  },

  consent_violation: {
    id: "consent_violation",
    label: "Consent Violation",
    coreDefinition:
      "Any theme of boundaries being crossed — coercion, inability to say no, being trapped, or body autonomy threatened.",
    commonMotifs: [
      "can't get away",
      "frozen voice",
      "someone won't stop",
      "cornered/followed",
      "touch without permission",
      "unsafe pressure",
    ],
    commonFeels: ["violated", "terrified", "powerless", "frozen", "sick", "panicked"],
    defaultValence: "negative",
    defaultActivation: "high",
    typicalAttachment: ["disorganized"],
    typicalNervousSystem: ["freeze", "flight", "collapse"],
    subThemes: ["boundary collapse", "autonomy threat", "fawning pressure", "no-exit", "body alarm"],
    interpretationFrame:
      "May reflect boundary stress, past body memories, or a present situation where 'no' doesn't feel fully available.",
  },

  worthiness: {
    id: "worthiness",
    label: "Worthiness",
    coreDefinition:
      "Themes of deserving love, being enough, earning approval, or fearing replacement and inadequacy.",
    commonMotifs: [
      "being evaluated",
      "trying to prove yourself",
      "approval withheld",
      "someone chooses another",
      "praise finally given",
      "you're not recognized",
    ],
    commonFeels: ["anxious", "hungry for approval", "hopeful", "defeated", "jealous", "relieved"],
    defaultValence: "mixed",
    defaultActivation: "medium",
    typicalAttachment: ["anxious", "disorganized"],
    typicalNervousSystem: ["flight", "freeze"],
    subThemes: ["comparison", "replacement fear", "approval seeking", "earned love", "inner critic pressure"],
    interpretationFrame:
      "May reflect a longing to be chosen as you are, or a belief that love must be earned through performance.",
  },

  responsibility: {
    id: "responsibility",
    label: "Responsibility",
    coreDefinition:
      "Carrying others, managing outcomes, preventing harm, or feeling you must hold everything together.",
    commonMotifs: [
      "caretaking",
      "saving others",
      "big workload",
      "deadlines",
      "protecting a child/pet",
      "cleaning up messes",
    ],
    commonFeels: ["burdened", "driven", "protective", "overwhelmed", "competent", "resentful"],
    defaultValence: "mixed",
    defaultActivation: "medium",
    typicalAttachment: ["anxious", "avoidant", "secure"],
    typicalNervousSystem: ["fight", "flight", "ventral_safety"],
    subThemes: ["overfunctioning", "parentified role", "hyper-responsibility", "rescuer energy", "duty vs needs"],
    interpretationFrame:
      "May reflect caretaking load, fear of letting people down, or the need to receive support rather than only give it.",
  },

  failure: {
    id: "failure",
    label: "Failure",
    coreDefinition:
      "Fear of messing up, being unprepared, missing something important, or being seen as incompetent.",
    commonMotifs: [
      "test/exam",
      "late/missed event",
      "forgot crucial item",
      "can't perform on stage",
      "technology breaks",
      "attempts keep failing",
    ],
    commonFeels: ["stressed", "ashamed", "panicked", "frustrated", "self-critical"],
    defaultValence: "negative",
    defaultActivation: "high",
    typicalAttachment: ["anxious", "avoidant"],
    typicalNervousSystem: ["flight", "freeze"],
    subThemes: ["performance anxiety", "perfectionism", "imposter fear", "punitive standards", "catastrophizing"],
    interpretationFrame:
      "May reflect pressure, fear of judgment, or unrealistic standards that are exhausting your system.",
  },

  grief: {
    id: "grief",
    label: "Grief",
    coreDefinition:
      "Loss processing — mourning people, time, opportunities, versions of self, safety, or what should have been.",
    commonMotifs: [
      "funerals",
      "goodbyes",
      "old places",
      "missing someone",
      "crying",
      "searching for what's gone",
    ],
    commonFeels: ["sad", "tender", "longing", "heavy", "nostalgic", "raw"],
    defaultValence: "negative",
    defaultActivation: "low",
    typicalAttachment: ["secure", "anxious", "disorganized"],
    typicalNervousSystem: ["collapse", "ventral_safety"],
    subThemes: ["mourning", "unmet needs", "yearning", "closure", "acceptance"],
    interpretationFrame:
      "May reflect mourning, letting go, or your system making room for what was true and what still hurts.",
  },

  identity: {
    id: "identity",
    label: "Identity",
    coreDefinition:
      "Questions of who you are — roles, age, name, self-image, authenticity, belonging in your own skin.",
    commonMotifs: [
      "mirrors/reflections",
      "different name",
      "being younger/older",
      "costumes/disguises",
      "imposter situations",
      "double life",
    ],
    commonFeels: ["confused", "curious", "unreal", "exposed", "liberated", "split"],
    defaultValence: "mixed",
    defaultActivation: "medium",
    typicalAttachment: ["secure", "disorganized"],
    typicalNervousSystem: ["freeze", "ventral_safety"],
    subThemes: ["authenticity", "role conflict", "self-coherence", "masks", "self-recognition"],
    interpretationFrame:
      "May reflect growth, role tension, or a part of you asking to be recognized more honestly.",
  },

  belonging: {
    id: "belonging",
    label: "Belonging",
    coreDefinition:
      "Feeling included, claimed, welcomed, and having a place — or fearing you don't truly fit.",
    commonMotifs: [
      "being welcomed",
      "family gatherings",
      "finding your room",
      "saved seat",
      "group acceptance",
      "home imagery",
    ],
    commonFeels: ["warm", "relieved", "hopeful", "awkward", "anxious", "seen"],
    defaultValence: "positive",
    defaultActivation: "low",
    typicalAttachment: ["secure", "anxious"],
    typicalNervousSystem: ["ventral_safety", "flight"],
    subThemes: ["home", "tribe", "chosen-ness", "membership", "safety in community"],
    interpretationFrame:
      "May reflect needs for community, being chosen, or building environments where you can exhale.",
  },

  unpredictability: {
    id: "unpredictability",
    label: "Unpredictability",
    coreDefinition:
      "Chaos, sudden shifts, unstable rules, or situations that don't follow logic — the ground keeps moving.",
    commonMotifs: [
      "sudden changes",
      "getting lost",
      "rules change",
      "surreal/weird scene switches",
      "things break/glitch",
      "weather turning fast",
    ],
    commonFeels: ["uneasy", "disoriented", "restless", "anxious", "wired"],
    defaultValence: "negative",
    defaultActivation: "medium",
    typicalAttachment: ["disorganized", "anxious"],
    typicalNervousSystem: ["flight", "freeze"],
    subThemes: ["instability", "no predictability", "lack of control", "whiplash", "uncertainty intolerance"],
    interpretationFrame:
      "May reflect stress around uncertainty, inconsistent environments, or the need for steadier rhythms and support.",
  },

  punishment: {
    id: "punishment",
    label: "Punishment",
    coreDefinition:
      "Fear of consequences, being judged, shamed, arrested, or forced to 'pay' — often tied to guilt or authority.",
    commonMotifs: [
      "police/court",
      "being sentenced",
      "getting in trouble",
      "authority figures",
      "public consequences",
      "being chased by enforcement",
    ],
    commonFeels: ["afraid", "guilty", "defiant", "trapped", "ashamed"],
    defaultValence: "negative",
    defaultActivation: "high",
    typicalAttachment: ["avoidant", "disorganized"],
    typicalNervousSystem: ["flight", "freeze", "fight"],
    subThemes: ["moral injury", "inner judge", "fear of exposure", "authority threat", "old conditioning"],
    interpretationFrame:
      "May reflect internalized judgment, fear of being 'caught,' or a harsh inner rule-set that keeps you tense.",
  },

  isolation: {
    id: "isolation",
    label: "Isolation",
    coreDefinition:
      "Aloneness, being unreachable, emotionally cut off, unseen, or separated from help and connection.",
    commonMotifs: [
      "empty places",
      "no one hears you",
      "hiding",
      "alone in a big building",
      "can't reach anyone",
      "silent phone",
    ],
    commonFeels: ["lonely", "numb", "quiet panic", "sad", "invisible", "abandoned"],
    defaultValence: "negative",
    defaultActivation: "low",
    typicalAttachment: ["avoidant", "disorganized"],
    typicalNervousSystem: ["collapse", "freeze"],
    subThemes: ["disconnection", "self-protection via distance", "unseen self", "no help available", "emotional exile"],
    interpretationFrame:
      "May reflect disconnection needs, protective withdrawal, or a part of you that wants contact but doesn't expect it.",
  },

  transformation: {
    id: "transformation",
    label: "Transformation",
    coreDefinition:
      "Change, transitions, endings/beginnings, growth, moving through thresholds into a new version of life or self.",
    commonMotifs: [
      "moving/packing",
      "doorways/hallways",
      "bridges/stairs",
      "renovations",
      "shape-shifting",
      "fresh starts",
    ],
    commonFeels: ["hopeful", "nervous", "curious", "bittersweet", "energized"],
    defaultValence: "mixed",
    defaultActivation: "medium",
    typicalAttachment: ["secure", "anxious"],
    typicalNervousSystem: ["ventral_safety", "flight"],
    subThemes: ["threshold moments", "reinvention", "identity shifts", "leaving the past", "becoming"],
    interpretationFrame:
      "May reflect growth, readiness for change, or your system integrating a new chapter while releasing an old one.",
  },
};
