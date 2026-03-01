/**
 * Dream Interpretation Types — Psychological Engine
 *
 * Core types, constants, and feeling definitions for the evidence-based
 * dream interpretation engine. All interpretation is grounded in:
 *   - Emotional tone (primary signal)
 *   - Nervous system activation patterns
 *   - Attachment dynamics
 *   - Shadow trigger themes
 *   - Recurring emotional patterns over time
 *
 * TONE: Warm but not poetic. Grounded. Never predictive. Never absolute.
 * LANGUAGE: "may", "could", "often reflects" — always non-deterministic.
 */

// ─── Nervous System ───────────────────────────────────────────────────────────

export type NervousSystemBranch =
  | 'ventral_safety'  // integration, connection, healing
  | 'fight'           // boundary activation, power struggle, anger
  | 'flight'          // anxiety, avoidance, fear of loss
  | 'freeze'          // voice suppression, overwhelm, shame
  | 'collapse'        // hopelessness, depletion, grief
  | 'mixed';          // inner conflict or dual states

// ─── Attachment ───────────────────────────────────────────────────────────────

export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

// ─── Shadow Triggers ──────────────────────────────────────────────────────────

export type ShadowTrigger =
  | 'abandonment'
  | 'rejection'
  | 'betrayal'
  | 'shame'
  | 'exposure'
  | 'control'
  | 'power'
  | 'helplessness'
  | 'danger'
  | 'intimacy'
  | 'sexuality'
  | 'consent_violation'
  | 'worthiness'
  | 'responsibility'
  | 'failure'
  | 'grief'
  | 'identity'
  | 'belonging'
  | 'unpredictability'
  | 'punishment'
  | 'isolation'
  | 'transformation';

// ─── Dream Feelings ───────────────────────────────────────────────────────────

export interface DreamFeelingDef {
  id: string;
  label: string;
  /** Primary nervous system branch this feeling activates */
  primaryBranch: NervousSystemBranch;
  /** Shadow triggers this feeling is most associated with */
  shadowTriggers: ShadowTrigger[];
  /** Attachment style this feeling most strongly signals */
  attachmentSignal: AttachmentStyle;
  /** Positive (+1), negative (−1), or ambivalent (0) valence */
  valence: -1 | 0 | 1;
  /** Activation level: high (1), medium (0.5), low (0) */
  activation: 0 | 0.5 | 1;
  /** UI tier for the tiered feeling selector */
  tier: FeelingTier;
}

/** Tier groupings shown in the feeling selector dropdown */
export type FeelingTier =
  | 'negative'   // "Mostly Negative"
  | 'positive'   // "Mostly Positive"
  | 'mixed'      // "Mixed"
  | 'hard'       // "Hard to name"
  | 'all';       // "All" — show every feeling alphabetically

/**
 * Production-ready 60-feeling set for dream work.
 *
 * Grouped by activation × valence × nervous system state.
 * Covers all 22 shadow triggers, all attachment styles, and all NS branches.
 * Designed for a tiered selector: Mostly Negative → Mostly Positive → Mixed → Hard to name.
 */
export const DREAM_FEELINGS: DreamFeelingDef[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔴 HIGH ACTIVATION – NEGATIVE  (Fight / Flight)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'anxious',
    label: 'Anxious',
    primaryBranch: 'flight',
    shadowTriggers: ['unpredictability', 'danger'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'panicked',
    label: 'Panicked',
    primaryBranch: 'flight',
    shadowTriggers: ['danger', 'helplessness', 'unpredictability'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'terrified',
    label: 'Terrified',
    primaryBranch: 'flight',
    shadowTriggers: ['danger', 'helplessness'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'alarmed',
    label: 'Alarmed',
    primaryBranch: 'flight',
    shadowTriggers: ['danger', 'unpredictability'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    primaryBranch: 'freeze',
    shadowTriggers: ['helplessness', 'responsibility', 'unpredictability'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'urgent',
    label: 'Urgent',
    primaryBranch: 'flight',
    shadowTriggers: ['responsibility', 'failure', 'unpredictability'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'stressed',
    label: 'Stressed',
    primaryBranch: 'flight',
    shadowTriggers: ['responsibility', 'control', 'failure'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'agitated',
    label: 'Agitated',
    primaryBranch: 'fight',
    shadowTriggers: ['control', 'power', 'unpredictability'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'frustrated',
    label: 'Frustrated',
    primaryBranch: 'fight',
    shadowTriggers: ['control', 'power', 'failure'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'angry',
    label: 'Angry',
    primaryBranch: 'fight',
    shadowTriggers: ['control', 'power', 'betrayal'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'enraged',
    label: 'Enraged',
    primaryBranch: 'fight',
    shadowTriggers: ['power', 'betrayal', 'consent_violation'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'defensive',
    label: 'Defensive',
    primaryBranch: 'fight',
    shadowTriggers: ['exposure', 'shame', 'control'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'betrayed',
    label: 'Betrayed',
    primaryBranch: 'fight',
    shadowTriggers: ['betrayal', 'abandonment', 'intimacy'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'exposed',
    label: 'Exposed',
    primaryBranch: 'freeze',
    shadowTriggers: ['exposure', 'shame', 'worthiness'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'pressured',
    label: 'Pressured',
    primaryBranch: 'flight',
    shadowTriggers: ['responsibility', 'control', 'power'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🟠 HIGH ACTIVATION – MIXED / AMBIVALENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'yearning',
    label: 'Yearning',
    primaryBranch: 'mixed',
    shadowTriggers: ['abandonment', 'belonging', 'intimacy'],
    attachmentSignal: 'anxious',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'desperate',
    label: 'Desperate',
    primaryBranch: 'mixed',
    shadowTriggers: ['helplessness', 'abandonment', 'isolation'],
    attachmentSignal: 'disorganized',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'jealous',
    label: 'Jealous',
    primaryBranch: 'mixed',
    shadowTriggers: ['worthiness', 'rejection', 'belonging'],
    attachmentSignal: 'anxious',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'obsessed',
    label: 'Obsessed',
    primaryBranch: 'mixed',
    shadowTriggers: ['control', 'intimacy', 'identity'],
    attachmentSignal: 'anxious',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'tempted',
    label: 'Tempted',
    primaryBranch: 'mixed',
    shadowTriggers: ['sexuality', 'consent_violation', 'intimacy'],
    attachmentSignal: 'avoidant',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'electrified',
    label: 'Electrified',
    primaryBranch: 'mixed',
    shadowTriggers: ['sexuality', 'power', 'transformation'],
    attachmentSignal: 'disorganized',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'drawn',
    label: 'Drawn',
    primaryBranch: 'mixed',
    shadowTriggers: ['intimacy', 'belonging', 'sexuality'],
    attachmentSignal: 'anxious',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'compelled',
    label: 'Compelled',
    primaryBranch: 'mixed',
    shadowTriggers: ['control', 'identity', 'transformation'],
    attachmentSignal: 'disorganized',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'restless',
    label: 'Restless',
    primaryBranch: 'mixed',
    shadowTriggers: ['identity', 'unpredictability', 'transformation'],
    attachmentSignal: 'avoidant',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'conflicted',
    label: 'Conflicted',
    primaryBranch: 'mixed',
    shadowTriggers: ['identity', 'belonging', 'responsibility'],
    attachmentSignal: 'disorganized',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🟡 HIGH ACTIVATION – POSITIVE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'excited',
    label: 'Excited',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['transformation'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 1,
    tier: 'positive',
  },
  {
    id: 'empowered',
    label: 'Empowered',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['power'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 1,
    tier: 'positive',
  },
  {
    id: 'brave',
    label: 'Brave',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['danger', 'power'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 1,
    tier: 'positive',
  },
  {
    id: 'determined',
    label: 'Determined',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['identity', 'failure'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 1,
    tier: 'positive',
  },
  {
    id: 'passionate',
    label: 'Passionate',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['sexuality', 'intimacy', 'transformation'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 1,
    tier: 'positive',
  },
  {
    id: 'alive',
    label: 'Alive',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['transformation', 'identity'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 1,
    tier: 'positive',
  },
  {
    id: 'inspired',
    label: 'Inspired',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['identity', 'transformation'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 1,
    tier: 'positive',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔵 MEDIUM ACTIVATION – NEGATIVE  (Freeze Emerging)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'uncertain',
    label: 'Uncertain',
    primaryBranch: 'freeze',
    shadowTriggers: ['unpredictability', 'identity'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'confused',
    label: 'Confused',
    primaryBranch: 'freeze',
    shadowTriggers: ['identity', 'unpredictability'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'insecure',
    label: 'Insecure',
    primaryBranch: 'freeze',
    shadowTriggers: ['worthiness', 'rejection', 'exposure'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'embarrassed',
    label: 'Embarrassed',
    primaryBranch: 'freeze',
    shadowTriggers: ['exposure', 'shame'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'ashamed',
    label: 'Ashamed',
    primaryBranch: 'freeze',
    shadowTriggers: ['shame', 'exposure', 'rejection'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'guilty',
    label: 'Guilty',
    primaryBranch: 'freeze',
    shadowTriggers: ['shame', 'punishment', 'responsibility'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'rejected',
    label: 'Rejected',
    primaryBranch: 'freeze',
    shadowTriggers: ['rejection', 'worthiness', 'belonging'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'lonely',
    label: 'Lonely',
    primaryBranch: 'freeze',
    shadowTriggers: ['isolation', 'belonging', 'abandonment'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'small',
    label: 'Small',
    primaryBranch: 'freeze',
    shadowTriggers: ['worthiness', 'power', 'helplessness'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'watched',
    label: 'Watched',
    primaryBranch: 'freeze',
    shadowTriggers: ['exposure', 'danger', 'control'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🟣 MEDIUM ACTIVATION – POSITIVE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'hopeful',
    label: 'Hopeful',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['transformation', 'identity'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0.5,
    tier: 'positive',
  },
  {
    id: 'curious',
    label: 'Curious',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['identity', 'transformation'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0.5,
    tier: 'positive',
  },
  {
    id: 'connected',
    label: 'Connected',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['belonging', 'intimacy'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0.5,
    tier: 'positive',
  },
  {
    id: 'seen',
    label: 'Seen',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['belonging', 'worthiness', 'exposure'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0.5,
    tier: 'positive',
  },
  {
    id: 'chosen',
    label: 'Chosen',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['belonging', 'worthiness', 'rejection'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0.5,
    tier: 'positive',
  },
  {
    id: 'understood',
    label: 'Understood',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['belonging', 'identity', 'isolation'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0.5,
    tier: 'positive',
  },
  {
    id: 'supported',
    label: 'Supported',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['belonging', 'helplessness'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0.5,
    tier: 'positive',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🟢 LOW ACTIVATION – NEGATIVE  (Freeze / Collapse)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'numb',
    label: 'Numb',
    primaryBranch: 'collapse',
    shadowTriggers: ['grief', 'identity', 'isolation'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0,
    tier: 'hard',
  },
  {
    id: 'heavy',
    label: 'Heavy',
    primaryBranch: 'collapse',
    shadowTriggers: ['grief', 'responsibility', 'helplessness'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 0,
    tier: 'hard',
  },
  {
    id: 'powerless',
    label: 'Powerless',
    primaryBranch: 'collapse',
    shadowTriggers: ['helplessness', 'power', 'control'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 0,
    tier: 'negative',
  },
  {
    id: 'trapped',
    label: 'Trapped',
    primaryBranch: 'collapse',
    shadowTriggers: ['control', 'helplessness', 'consent_violation'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0,
    tier: 'negative',
  },
  {
    id: 'hopeless',
    label: 'Hopeless',
    primaryBranch: 'collapse',
    shadowTriggers: ['helplessness', 'grief', 'failure'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 0,
    tier: 'hard',
  },
  {
    id: 'sad',
    label: 'Sad',
    primaryBranch: 'collapse',
    shadowTriggers: ['grief', 'abandonment'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 0,
    tier: 'negative',
  },
  {
    id: 'disappointed',
    label: 'Disappointed',
    primaryBranch: 'collapse',
    shadowTriggers: ['failure', 'rejection', 'worthiness'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 0,
    tier: 'negative',
  },
  {
    id: 'isolated',
    label: 'Isolated',
    primaryBranch: 'collapse',
    shadowTriggers: ['isolation', 'belonging', 'abandonment'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0,
    tier: 'negative',
  },
  {
    id: 'invisible',
    label: 'Invisible',
    primaryBranch: 'collapse',
    shadowTriggers: ['worthiness', 'belonging', 'identity'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0,
    tier: 'hard',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🟢 LOW ACTIVATION – POSITIVE  (Ventral Safety)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'calm',
    label: 'Calm',
    primaryBranch: 'ventral_safety',
    shadowTriggers: [],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0,
    tier: 'positive',
  },
  {
    id: 'safe',
    label: 'Safe',
    primaryBranch: 'ventral_safety',
    shadowTriggers: [],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0,
    tier: 'positive',
  },
  {
    id: 'relieved',
    label: 'Relieved',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['danger', 'transformation'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0,
    tier: 'positive',
  },
  {
    id: 'grounded',
    label: 'Grounded',
    primaryBranch: 'ventral_safety',
    shadowTriggers: [],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0,
    tier: 'positive',
  },
  {
    id: 'peaceful',
    label: 'Peaceful',
    primaryBranch: 'ventral_safety',
    shadowTriggers: [],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0,
    tier: 'positive',
  },
  {
    id: 'accepted',
    label: 'Accepted',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['belonging', 'worthiness', 'rejection'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0,
    tier: 'positive',
  },
  {
    id: 'warm',
    label: 'Warm',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['intimacy', 'belonging'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0,
    tier: 'positive',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔥 SEXUAL / SOMATIC CHARGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'aroused',
    label: 'Aroused',
    primaryBranch: 'mixed',
    shadowTriggers: ['sexuality', 'intimacy'],
    attachmentSignal: 'disorganized',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'desired',
    label: 'Desired',
    primaryBranch: 'mixed',
    shadowTriggers: ['worthiness', 'sexuality', 'belonging'],
    attachmentSignal: 'anxious',
    valence: 0,
    activation: 0.5,
    tier: 'mixed',
  },
  {
    id: 'seduced',
    label: 'Seduced',
    primaryBranch: 'mixed',
    shadowTriggers: ['consent_violation', 'power', 'sexuality'],
    attachmentSignal: 'disorganized',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'lustful',
    label: 'Lustful',
    primaryBranch: 'mixed',
    shadowTriggers: ['sexuality', 'control', 'intimacy'],
    attachmentSignal: 'avoidant',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'tender',
    label: 'Tender',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['intimacy', 'belonging', 'grief'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0,
    tier: 'positive',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 RESTORED FROM PREVIOUS SET
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'abandoned',
    label: 'Abandoned',
    primaryBranch: 'flight',
    shadowTriggers: ['abandonment', 'rejection', 'isolation'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'grieving',
    label: 'Grieving',
    primaryBranch: 'collapse',
    shadowTriggers: ['grief', 'abandonment', 'isolation'],
    attachmentSignal: 'anxious',
    valence: -1,
    activation: 0,
    tier: 'hard',
  },
  {
    id: 'nostalgic',
    label: 'Nostalgic',
    primaryBranch: 'mixed',
    shadowTriggers: ['grief', 'belonging', 'transformation'],
    attachmentSignal: 'anxious',
    valence: 0,
    activation: 0,
    tier: 'mixed',
  },
  {
    id: 'disgusted',
    label: 'Disgusted',
    primaryBranch: 'fight',
    shadowTriggers: ['consent_violation', 'shame', 'exposure'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 1,
    tier: 'negative',
  },
  {
    id: 'longing',
    label: 'Longing',
    primaryBranch: 'mixed',
    shadowTriggers: ['abandonment', 'belonging', 'intimacy'],
    attachmentSignal: 'anxious',
    valence: 0,
    activation: 0,
    tier: 'mixed',
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✨ NEW GAP FILLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'suspicious',
    label: 'Suspicious',
    primaryBranch: 'flight',
    shadowTriggers: ['betrayal', 'danger', 'control'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'protective',
    label: 'Protective',
    primaryBranch: 'fight',
    shadowTriggers: ['responsibility', 'power', 'danger'],
    attachmentSignal: 'secure',
    valence: 0,
    activation: 1,
    tier: 'mixed',
  },
  {
    id: 'resentful',
    label: 'Resentful',
    primaryBranch: 'fight',
    shadowTriggers: ['betrayal', 'punishment', 'control'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'dissociated',
    label: 'Dissociated',
    primaryBranch: 'collapse',
    shadowTriggers: ['identity', 'isolation', 'consent_violation'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 0,
    tier: 'hard',
  },
  {
    id: 'suffocated',
    label: 'Suffocated',
    primaryBranch: 'freeze',
    shadowTriggers: ['control', 'consent_violation', 'helplessness'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
  {
    id: 'hollow',
    label: 'Hollow',
    primaryBranch: 'collapse',
    shadowTriggers: ['grief', 'identity', 'isolation'],
    attachmentSignal: 'avoidant',
    valence: -1,
    activation: 0,
    tier: 'hard',
  },
  {
    id: 'grateful',
    label: 'Grateful',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['belonging', 'worthiness'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 0,
    tier: 'positive',
  },
  {
    id: 'free',
    label: 'Free',
    primaryBranch: 'ventral_safety',
    shadowTriggers: ['transformation', 'control'],
    attachmentSignal: 'secure',
    valence: 1,
    activation: 1,
    tier: 'positive',
  },
  {
    id: 'helpless',
    label: 'Helpless',
    primaryBranch: 'freeze',
    shadowTriggers: ['helplessness', 'danger', 'power'],
    attachmentSignal: 'disorganized',
    valence: -1,
    activation: 0.5,
    tier: 'negative',
  },
];

/** Quick lookup map: feeling id → DreamFeelingDef */
export const FEELING_MAP: Record<string, DreamFeelingDef> = {};
for (const f of DREAM_FEELINGS) {
  FEELING_MAP[f.id] = f;
}

// ─── Dream Metadata ───────────────────────────────────────────────────────────

export type AwakenState =
  | 'calm'       // woke up peaceful
  | 'startled'   // jolted awake
  | 'confused'   // disoriented upon waking
  | 'unsettled'  // anxious, uneasy
  | 'relieved'   // glad to be awake
  | 'heavy';     // weighted, tired

export interface DreamMetadata {
  vividness: number;     // 1–5
  lucidity: number;      // 1–5
  awakenState: AwakenState;
  recurring: boolean;
}

// ─── User-Selected Feelings ───────────────────────────────────────────────────

export interface SelectedFeeling {
  id: string;          // matches DreamFeelingDef.id
  intensity: number;   // 0–5
}

// ─── Precomputed Aggregates ───────────────────────────────────────────────────

export interface DreamAggregates {
  /** Overall emotional tone: −1 (negative) to +1 (positive) */
  valenceScore: number;
  /** Overall arousal: 'low' | 'moderate' | 'high' */
  activationScore: 'low' | 'moderate' | 'high';
  /** Distribution across attachment styles (sums to ~1.0) */
  attachmentProfile: Record<AttachmentStyle, number>;
  /** Distribution across nervous system branches (sums to ~1.0) */
  nervousSystemProfile: Record<NervousSystemBranch, number>;
  /** Ranked shadow triggers by weight, descending */
  shadowTriggerHeatmap: { trigger: ShadowTrigger; weight: number }[];
  /** Top 2–3 dominant feelings from this dream */
  dominantFeelings: SelectedFeeling[];
  /** Dominant nervous system branch */
  dominantBranch: NervousSystemBranch;
  /** Dominant attachment style */
  dominantAttachment: AttachmentStyle;
}

// ─── Pattern Data ─────────────────────────────────────────────────────────────

export interface DreamPatternData {
  /** Feelings that recur across recent dreams */
  recurringFeelings: string[];
  /** Whether the current dream's dominant feelings are shifting vs prior */
  emotionalTrendDirection: 'increasing' | 'decreasing' | 'stable';
  /** Feeling pairs that frequently co-occur */
  coOccurringPairs: [string, string][];
  /** Number of recent dreams to compare against */
  comparisonCount: number;
}

// ─── Output: Full Interpretation ──────────────────────────────────────────────

export interface DreamInterpretation {
  /** One cohesive paragraph weaving feelings, dream text, triggers, personality, and patterns */
  paragraph: string;
  /** One gentle, open-ended reflection question */
  question: string;
  /** ISO timestamp */
  generatedAt: string;
}

// ─── Engine Input ─────────────────────────────────────────────────────────────

export interface DreamInterpretationInput {
  entry: import('../storage/models').SleepEntry;
  dreamText: string;
  feelings: SelectedFeeling[];
  metadata: DreamMetadata;
  aggregates: DreamAggregates;
  patterns: DreamPatternData;
}
