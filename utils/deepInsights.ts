/**
 * Deep Insights Engine — The Five Layers of Self-Understanding
 *
 * Transforms a PersonalProfile into progressively deeper insights:
 *
 *   Level 1 — Pattern:   "What keeps happening?"
 *   Level 2 — Meaning:   "What might this say about me?"
 *   Level 3 — Need:      "What do I seem to need?"
 *   Level 4 — Growth:    "How am I changing?"
 *   Level 5 — Identity:  "Who am I, underneath all this?"
 *
 * Time-aware: which levels are available depends on data maturity.
 *   early (< 14d):       Pattern only
 *   developing (14–29d): Pattern + Meaning
 *   established (30–89d): Pattern + Meaning + Need + Growth
 *   deep (90d+):          All five levels
 *
 * Tone: observant, emotionally intelligent, grounded, warm, specific.
 * Never clinical, never fortune-cookie. Like a wise, gentle reflection.
 *
 * Pure function — no I/O, no side effects.
 */

import {
  PersonalProfile,
  DataMaturity,
  RecoveryStyle,
  InnerTheme,
} from './personalProfile';
import { mean } from './stats';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type InsightLevel = 'pattern' | 'meaning' | 'need' | 'growth' | 'identity';

export type InsightCategory =
  | 'what-keeps-happening'
  | 'how-your-mind-works'
  | 'who-you-are-underneath'
  | 'what-activates-you'
  | 'how-you-protect-yourself'
  | 'attachment-and-closeness'
  | 'what-restores-you'
  | 'nervous-system'
  | 'growth-and-change'
  | 'inner-contradictions';

export type TemporalScope = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'truth';

export type InsightJob = 'name' | 'clarify' | 'guide' | 'integrate';

export interface DeepInsight {
  id: string;
  level: InsightLevel;
  category: InsightCategory;
  scope: TemporalScope;
  /** What job this insight serves: name it, clarify it, guide action, or integrate understanding */
  job: InsightJob;
  title: string;
  body: string;
  /** Optional supporting detail */
  detail?: string;
  /** A gentle reflection prompt that opens a door for the user */
  reflectionPrompt?: string;
  /** Richer self-language the user might adopt */
  selfLanguage?: string;
  confidence: 'emerging' | 'growing' | 'strong';
  accent: 'gold' | 'silverBlue' | 'copper' | 'emerald' | 'rose' | 'lavender';
}

/** A detected life chapter / season. */
export interface Season {
  label: string;
  body: string;
  tone: 'recovery' | 'intensity' | 'growth' | 'steadiness' | 'transition';
  daySpan: number;
  confidence: 'emerging' | 'growing' | 'strong';
}

/** What the app remembers about the user's trajectory. */
export interface NarrativeMemory {
  /** Patterns that used to be stronger but have faded */
  fadingPatterns: string[];
  /** Patterns that are getting stronger */
  emergingPatterns: string[];
  /** What the user used to struggle with more */
  previousStruggles: string[];
  /** What has remained consistently true */
  persistentTruths: string[];
}

export interface DeepInsightBundle {
  insights: DeepInsight[];
  personalTruths: string[];
  season: Season | null;
  memory: NarrativeMemory;
  /** Distilled self-knowledge for hard days */
  whatToRemember: string[];
  maturity: DataMaturity;
  totalDays: number;
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Level availability by maturity
// ─────────────────────────────────────────────────────────────────────────────

const LEVELS_BY_MATURITY: Record<DataMaturity, InsightLevel[]> = {
  early: ['pattern'],
  developing: ['pattern', 'meaning'],
  established: ['pattern', 'meaning', 'need', 'growth'],
  deep: ['pattern', 'meaning', 'need', 'growth', 'identity'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Pattern-level insights (Level 1): "What keeps happening?"
// ─────────────────────────────────────────────────────────────────────────────

function buildPatternInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  const { patternProfile: pp } = p;

  // Sleep–stability pattern
  if (p.sleepSensitivity > 55) {
    const sleepCorr = pp.correlations.find(c => c.metricA === 'sleep' && c.metricB === 'stability');
    insights.push({
      job: 'name',
      id: 'pattern-sleep',
      level: 'pattern',
      category: 'nervous-system',
      scope: 'weekly',
      title: 'Sleep & Steadiness',
      body: 'A pattern in your entries suggests that low sleep changes more than your energy. On harder-rest nights, your nervous system seems quicker to lose steadiness and more likely to tip into strain the next day.',
      detail: sleepCorr ? `Correlation strength: ${sleepCorr.strength > 0.5 ? 'strong' : sleepCorr.strength > 0.3 ? 'moderate' : 'mild'}` : undefined,
      reflectionPrompt: 'How does a bad night of sleep tend to show up for you the next day?',
      selfLanguage: 'sleep-sensitive',
      confidence: p.sleepSensitivity > 70 ? 'strong' : 'growing',
      accent: 'silverBlue',
    });
  }

  // Strain accumulation pattern
  if (p.stressPattern.buildupStyle === 'gradual') {
    insights.push({
      job: 'name',
      id: 'pattern-strain-buildup',
      level: 'pattern',
      category: 'how-you-protect-yourself',
      scope: 'weekly',
      title: 'Gradual Strain Buildup',
      body: `Stress seems to build quietly for you, often over about ${Math.round(p.stressPattern.avgBuildupDays)} days before it becomes obvious. The pattern is less "sudden collapse" and more "I was carrying more than I realized."`,
      reflectionPrompt: 'When you think back to recent hard stretches, did you notice strain building before it peaked?',
      selfLanguage: 'quietly depleted',
      confidence: p.stressPattern.confidence >= 60 ? 'strong' : 'growing',
      accent: 'copper',
    });
  } else if (p.stressPattern.buildupStyle === 'sudden') {
    insights.push({
      job: 'name',
      id: 'pattern-strain-sudden',
      level: 'pattern',
      category: 'what-activates-you',
      scope: 'weekly',
      title: 'Sudden Stress Spikes',
      body: 'Your system appears to react strongly to specific moments rather than only to long buildup. Sudden shifts in environment, tone, or demand may land hard and change your state faster than practical stress alone would suggest.',
      reflectionPrompt: 'What was happening around you the last time stress seemed to appear out of nowhere?',
      selfLanguage: 'environmentally reactive',
      confidence: p.stressPattern.confidence >= 60 ? 'strong' : 'growing',
      accent: 'copper',
    });
  }

  // Connection pattern
  if (p.connectionSensitivity > 55) {
    insights.push({
      job: 'name',
      id: 'pattern-connection',
      level: 'pattern',
      category: 'attachment-and-closeness',
      scope: 'weekly',
      title: 'Connection & Mood',
      body: 'Connection appears to change your state in a real way. When you feel more understood, responded to, or emotionally met, your entries tend to show more steadiness and less strain.',
      reflectionPrompt: 'When do you feel most connected? Is it about being around people, or something more specific?',
      selfLanguage: 'connection-regulated',
      confidence: p.connectionSensitivity > 70 ? 'strong' : 'growing',
      accent: 'rose',
    });
  }

  // Best day formula
  if (p.bestDayIngredients.length >= 2) {
    insights.push({
      job: 'name',
      id: 'pattern-best-day',
      level: 'pattern',
      category: 'what-restores-you',
      scope: 'monthly',
      title: 'Your Best Days',
      body: `Your steadier days tend to share a few ingredients: ${p.bestDayIngredients.slice(0, 4).join(', ')}. That repetition looks less like luck and more like a map of what helps you come back to yourself.`,
      reflectionPrompt: 'When was the last time a day just felt right? What made it work?',
      confidence: p.patternProfile.bestDayProfile && p.patternProfile.bestDayProfile.dayCount >= 5 ? 'strong' : 'growing',
      accent: 'gold',
    });
  }

  // Emotional intensity pattern
  if (p.emotionalRange > 20) {
    insights.push({
      job: 'name',
      id: 'pattern-emotional-range',
      level: 'pattern',
      category: 'who-you-are-underneath',
      scope: 'weekly',
      title: 'Wide Emotional Range',
      body: 'Your entries suggest a wider emotional range than simple good-day or bad-day swings. This may not be instability so much as depth: a system that registers life strongly and responds to shifts in its environment with real intensity.',
      reflectionPrompt: 'What kind of tired or drained is it when your emotions run high? Is it the same each time?',
      selfLanguage: 'emotionally wide-ranging',
      confidence: p.totalDays >= 21 ? 'strong' : 'growing',
      accent: 'lavender',
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Meaning-level insights (Level 2): "What might this say about me?"
// ─────────────────────────────────────────────────────────────────────────────

function buildMeaningInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  const { traits, recoveryStyle, innerThemes } = p;

  // From top traits
  const topTraits = traits.filter(t => t.strength >= 50).slice(0, 3);
  for (const trait of topTraits) {
    if (trait.id === 'sleep-sensitive') {
      insights.push({
        job: 'clarify',
        id: 'meaning-sleep-sensitive',
        level: 'meaning',
        category: 'nervous-system',
        scope: 'monthly',
        title: 'Sleep Sensitivity',
        body: 'Sleep seems to affect you on an emotional level, not just a physical one. When rest is disrupted, your ability to regulate appears to get shakier more quickly. Your nervous system may need sleep as a form of calibration, not just recovery.',
        reflectionPrompt: 'When your sleep is off, do you notice it more in your mood, your patience, or your body?',
        selfLanguage: 'physiologically sensitive to sleep disruption',
        confidence: trait.strength >= 70 ? 'strong' : 'growing',
        accent: 'silverBlue',
      });
    } else if (trait.id === 'connection-sensitive') {
      insights.push({
        job: 'clarify',
        id: 'meaning-connection-sensitive',
        level: 'meaning',
        category: 'attachment-and-closeness',
        scope: 'monthly',
        title: 'Relational Sensitivity',
        body: 'Connection looks like more than a preference for you. Feeling understood appears to help your system settle in ways that solitude alone does not fully replace. This may mean closeness functions as real regulation, not just comfort.',
        reflectionPrompt: 'When you feel most settled, is there usually someone who helped you get there?',
        selfLanguage: 'relationally regulated',
        confidence: trait.strength >= 70 ? 'strong' : 'growing',
        accent: 'rose',
      });
    } else if (trait.id === 'deep-feeler') {
      insights.push({
        job: 'clarify',
        id: 'meaning-deep-feeler',
        level: 'meaning',
        category: 'who-you-are-underneath',
        scope: 'monthly',
        title: 'Emotional Depth',
        body: 'You seem to be someone who feels life deeply rather than lightly. That depth may be part of what gives you richness, sincerity, and meaning, even if it also makes certain seasons heavier to carry.',
        reflectionPrompt: 'Does feeling deeply ever feel like a strength to you, or does it mostly feel like a cost?',
        selfLanguage: 'someone who feels deeply',
        confidence: trait.strength >= 70 ? 'strong' : 'growing',
        accent: 'lavender',
      });
    } else if (trait.id === 'gradual-accumulator') {
      insights.push({
        job: 'clarify',
        id: 'meaning-gradual-accumulator',
        level: 'meaning',
        category: 'how-you-protect-yourself',
        scope: 'monthly',
        title: 'Slow-Building Strain',
        body: `You seem to absorb stress quietly while staying functional on the surface. That can make you look fine longer than you actually feel fine. Early signals matter here, because your strain often becomes visible only after it has already been building for days.`,
        reflectionPrompt: 'Do you often realize you were carrying more than you thought, only after it becomes too much?',
        selfLanguage: 'carrying more than I realized',
        confidence: trait.strength >= 70 ? 'strong' : 'growing',
        accent: 'copper',
      });
    } else if (trait.id === 'steadiness-seeker') {
      insights.push({
        job: 'clarify',
        id: 'meaning-steadiness',
        level: 'meaning',
        category: 'how-your-mind-works',
        scope: 'monthly',
        title: 'Gravitating Toward Steadiness',
        body: 'Your system seems especially affected by unpredictability. It may not be the hard thing itself that drains you most, but the uncertainty around it. Steadiness looks less like a preference here and more like a condition that helps you feel safe enough to stay open.',
        reflectionPrompt: 'Is it the hard thing itself that drains you, or the not knowing when it will end?',
        selfLanguage: 'in need of steadiness, not stimulation',
        confidence: trait.strength >= 70 ? 'strong' : 'growing',
        accent: 'gold',
      });
    }
  }

  // Recovery meaning
  if (recoveryStyle.confidence >= 50) {
    const meanings: Record<RecoveryStyle['mode'], string> = {
      softness: 'Your recovery pattern suggests your system needs gentleness after difficulty — not productivity, not distraction, but quiet permission to rest. This may say something about how you carry effort.',
      structure: 'When things feel chaotic, your system seems to restabilize through routine and predictability. Structure may not feel exciting, but it appears to be genuinely restorative for you.',
      connection: 'You seem to recover not through solitude or rest alone, but through feeling seen and supported. Emotional intimacy may function as medicine for your nervous system.',
      solitude: 'Your recovery draws heavily on solitude and quiet. This doesn\'t mean you don\'t value connection — it suggests your system processes and resets best when external demands are low.',
      movement: 'Physical movement appears to be one of your most reliable reset mechanisms. Your body may be a more important part of your emotional processing than you might assume.',
      mixed: 'Your recovery draws from many sources — quiet, connection, movement, and structure all play a role at different times. You may be someone whose needs shift depending on what depleted you.',
    };
    insights.push({
      job: 'clarify',
      id: 'meaning-recovery',
      level: 'meaning',
      category: recoveryStyle.mode === 'connection' ? 'what-restores-you' : recoveryStyle.mode === 'solitude' ? 'what-restores-you' : 'nervous-system',
      scope: 'monthly',
      title: 'How You Recover',
      body: meanings[recoveryStyle.mode],
      reflectionPrompt: 'What tends to restore you most when life feels crowded?',
      selfLanguage: recoveryStyle.mode === 'softness' ? 'in need of gentleness, not productivity' : recoveryStyle.mode === 'solitude' ? 'in need of spaciousness, not company' : recoveryStyle.mode === 'connection' ? 'healed through being understood' : undefined,
      confidence: recoveryStyle.confidence >= 70 ? 'strong' : 'growing',
      accent: 'emerald',
    });
  }

  // Theme meaning
  if (innerThemes.length >= 2) {
    const dominant = innerThemes[0];
    const domainLabels: Record<InnerTheme['domain'], string> = {
      emotional: 'emotional processing',
      relational: 'how you relate to others',
      existential: 'questions of meaning and purpose',
      somatic: 'your body\'s experience',
    };
    insights.push({
      job: 'clarify',
      id: 'meaning-theme',
      level: 'meaning',
      category: dominant.domain === 'relational' ? 'attachment-and-closeness' : dominant.domain === 'somatic' ? 'nervous-system' : 'how-your-mind-works',
      scope: 'monthly',
      title: 'Recurring Theme',
      body: `The theme of "${dominant.theme}" appears repeatedly in your reflections. It seems connected to ${domainLabels[dominant.domain]}. That repetition usually means your inner world is still trying to understand or work through something important.`,
      reflectionPrompt: `When "${dominant.theme}" comes up for you, what does it usually feel like underneath?`,
      confidence: dominant.strength >= 60 ? 'strong' : dominant.strength >= 35 ? 'growing' : 'emerging',
      accent: 'lavender',
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Need-level insights (Level 3): "What do I seem to need?"
// ─────────────────────────────────────────────────────────────────────────────

function buildNeedInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];

  // Sleep need
  if (p.sleepSensitivity > 60) {
    insights.push({
      job: 'guide',
      id: 'need-sleep',
      level: 'need',
      category: 'nervous-system',
      scope: 'monthly',
      title: 'Rest as Foundation',
      body: 'Many of your harder patterns seem to intensify when rest is thin. Protecting sleep may not be a basic wellness suggestion for you so much as one of the clearest forms of care your system responds to.',
      reflectionPrompt: 'What gets in the way of protecting your rest? Is it circumstance, or something harder to name?',
      confidence: p.sleepSensitivity > 75 ? 'strong' : 'growing',
      accent: 'silverBlue',
    });
  }

  // Connection need
  if (p.connectionSensitivity > 60) {
    insights.push({
      job: 'guide',
      id: 'need-connection',
      level: 'need',
      category: 'attachment-and-closeness',
      scope: 'monthly',
      title: 'Need for Connection',
      body: 'Your entries suggest that emotionally accurate connection is not a small bonus for you. When closeness or reassurance drops, your system often feels it. You may need to protect the kinds of connection that actually help you settle, not just the fact of being around people.',
      reflectionPrompt: 'What kind of connection helps you most — being listened to, being around people, or something else?',
      selfLanguage: 'connection as a need, not a luxury',
      confidence: p.connectionSensitivity > 75 ? 'strong' : 'growing',
      accent: 'rose',
    });
  }

  // Recovery need
  if (p.recoveryStyle.confidence >= 50) {
    const avgDays = p.recoveryStyle.avgRecoveryDays;
    if (avgDays > 3) {
      insights.push({
        job: 'guide',
        id: 'need-recovery-time',
        level: 'need',
        category: 'what-restores-you',
        scope: 'monthly',
        title: 'Extended Recovery Time',
        body: `After difficult stretches, your system seems to need about ${Math.round(avgDays)} days to come back to itself. If you expect yourself to bounce back instantly, you may end up being harsh with yourself during a process that is actually normal for you.`,
        reflectionPrompt: 'When you try to recover faster than your system needs, what tends to happen?',
        confidence: 'growing',
        accent: 'emerald',
      });
    }

    if (p.recoveryStyle.recoveryIngredients.length >= 2) {
      insights.push({
        job: 'guide',
        id: 'need-recovery-ingredients',
        level: 'need',
        category: 'what-restores-you',
        scope: 'monthly',
        title: 'Your Recovery Ingredients',
        body: `When you recover, certain conditions keep helping: ${p.recoveryStyle.recoveryIngredients.slice(0, 4).join(', ')}. This looks like a return path worth remembering on purpose, especially when you are too tired to improvise your way back.`,
        confidence: p.recoveryStyle.confidence >= 70 ? 'strong' : 'growing',
        accent: 'emerald',
      });
    }
  }

  // Stress management need
  if (p.stressPattern.confidence >= 50 && p.stressPattern.buildupStyle === 'gradual') {
    insights.push({
      job: 'guide',
      id: 'need-early-intervention',
      level: 'need',
      category: 'how-you-protect-yourself',
      scope: 'monthly',
      title: 'Earlier Self-Awareness',
      body: 'Because your stress tends to build quietly, it may help to check in before you feel obviously overwhelmed. By the time the signal is loud, your system may already have been carrying too much for a while.',
      reflectionPrompt: 'What are the earliest signs that you\'re beginning to carry too much?',
      selfLanguage: 'tender but functional',
      confidence: p.stressPattern.confidence >= 70 ? 'strong' : 'growing',
      accent: 'copper',
    });
  }

  // Emotional spaciousness need
  const crowdingTrait = p.traits.find(t => t.id === 'crowding-sensitive');
  if (crowdingTrait && crowdingTrait.strength >= 50) {
    insights.push({
      job: 'guide',
      id: 'need-spaciousness',
      level: 'need',
      category: 'what-restores-you',
      scope: 'monthly',
      title: 'Emotional Spaciousness',
      body: 'Too many simultaneous demands or feelings seem to crowd your system quickly. You may need more emotional spaciousness than the average person: room to feel one thing at a time, room to slow down, room to hear yourself clearly again.',
      reflectionPrompt: 'When do you feel most like yourself — in stillness, in motion, or somewhere in between?',
      selfLanguage: 'emotionally crowded rather than simply stressed',
      confidence: crowdingTrait.strength >= 70 ? 'strong' : 'growing',
      accent: 'lavender',
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Growth-level insights (Level 4): "How am I changing?"
// ─────────────────────────────────────────────────────────────────────────────

function buildGrowthInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  const { patternProfile: pp } = p;

  // Stability trend
  const stabTrends = pp.trends.stability;
  const stabTrend = stabTrends[stabTrends.length - 1];
  if (stabTrend?.direction === 'rising') {
    insights.push({
      job: 'integrate',
      id: 'growth-stability-improving',
      level: 'growth',
      category: 'growth-and-change',
      scope: 'monthly',
      title: 'Growing Steadiness',
      body: 'Your entries suggest a quieter kind of growth: not perfection, but more solid ground. Day to day it may be easy to miss, but over time your system looks less easily knocked off center than it did before.',
      reflectionPrompt: 'Can you sense this steadiness growing, or does it only become visible looking back?',
      confidence: stabTrend.volatility < 10 ? 'strong' : 'growing',
      accent: 'gold',
    });
  } else if (stabTrend?.direction === 'falling') {
    insights.push({
      job: 'integrate',
      id: 'growth-stability-declining',
      level: 'growth',
      category: 'growth-and-change',
      scope: 'monthly',
      title: 'A Period of Difficulty',
      body: 'Lately your entries look less steady than your usual baseline. That does not read like failure. It reads more like a genuinely harder season, one that may ask for patience and gentleness more than self-improvement pressure.',
      reflectionPrompt: 'What kind of season does this feel like? And what would patience look like right here?',
      confidence: stabTrend.volatility < 10 ? 'strong' : 'growing',
      accent: 'copper',
    });
  }

  // Strain trend
  const strainTrends = pp.trends.strain;
  const strainTrend = strainTrends[strainTrends.length - 1];
  if (strainTrend?.direction === 'falling') {
    insights.push({
      job: 'integrate',
      id: 'growth-strain-improving',
      level: 'growth',
      category: 'growth-and-change',
      scope: 'monthly',
      title: 'Strain Is Easing',
      body: 'Something appears to be easing. Your recent entries carry less overall strain than before, even if it does not feel dramatic from the inside. Sometimes healing looks more like less pressure than more joy.',
      reflectionPrompt: 'What shifted recently? Was it something you did, or something that changed around you?',
      confidence: strainTrend.volatility < 10 ? 'strong' : 'growing',
      accent: 'emerald',
    });
  }

  // Restoration trend
  const restTrends = pp.trends.restoration;
  const restTrend = restTrends[restTrends.length - 1];
  if (restTrend?.direction === 'rising') {
    insights.push({
      job: 'integrate',
      id: 'growth-restoration-growing',
      level: 'growth',
      category: 'what-restores-you',
      scope: 'monthly',
      title: 'More Restoration',
      body: 'You have been reaching for restoration more often lately. Whether that has been intentional or instinctive, it suggests part of you is learning how to return to yourself instead of only pushing through.',
      reflectionPrompt: 'Is this something you\'re doing deliberately, or is your body finding its own way back?',
      confidence: restTrend.volatility < 10 ? 'strong' : 'growing',
      accent: 'emerald',
    });
  }

  // Resilience growth
  const resilientTrait = p.traits.find(t => t.id === 'resilient-recoverer');
  if (resilientTrait && resilientTrait.strength >= 50) {
    insights.push({
      job: 'integrate',
      id: 'growth-resilience',
      level: 'growth',
      category: 'growth-and-change',
      scope: 'seasonal',
      title: 'Resilience Pattern',
      body: 'Even after your harder days, you tend to find your way back. That does not mean those days are easy. It means your system appears to know something about repair, even when you do not feel strong while you are inside it.',
      reflectionPrompt: 'Do you notice your own resilience, or does it only become visible from the outside?',
      confidence: resilientTrait.strength >= 70 ? 'strong' : 'growing',
      accent: 'gold',
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Identity-level insights (Level 5): "Who am I, underneath all this?"
// ─────────────────────────────────────────────────────────────────────────────

function buildIdentityInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];

  // Only generate with deep maturity
  if (p.maturity !== 'deep') return insights;

  // Core identity from strongest traits
  const identityTraits = p.traits.filter(t => t.domain === 'identity' && t.strength >= 55);
  for (const trait of identityTraits.slice(0, 2)) {
    if (trait.id === 'steadiness-seeker') {
      insights.push({
        job: 'integrate',
        id: 'identity-steadiness',
        level: 'identity',
        category: 'who-you-are-underneath',
        scope: 'truth',
        title: 'A Person Who Values Steadiness',
        body: 'Across months of data, one theme surfaces again and again: you gravitate toward emotional consistency. It\'s not that you avoid feeling — it\'s that you seem to need a stable inner ground from which to feel safely. Steadiness may be less a preference and more a part of how you\'re built.',
        reflectionPrompt: 'When do you feel most like yourself?',
        selfLanguage: 'someone who needs stable ground to feel safely from',
        confidence: 'strong',
        accent: 'gold',
      });
    } else if (trait.id === 'deep-feeler') {
      insights.push({
        job: 'integrate',
        id: 'identity-depth',
        level: 'identity',
        category: 'how-your-mind-works',
        scope: 'truth',
        title: 'Someone Who Feels Deeply',
        body: 'You seem to be someone who feels life intensely and then has to make meaning from that intensity. This shapes how you connect, what wounds you, what restores you, and what feels true enough to trust.',
        reflectionPrompt: 'If you could describe your inner world to someone who had never been inside it, what would you say?',
        selfLanguage: 'someone whose feelings are primary, not secondary',
        confidence: 'strong',
        accent: 'lavender',
      });
    }
  }

  // Composite identity insight from recovery + stress + themes
  if (p.recoveryStyle.confidence >= 60 && p.stressPattern.confidence >= 60) {
    const recovery = p.recoveryStyle.mode;
    const stress = p.stressPattern.responseStyle;

    if (recovery === 'connection' && stress === 'push-through') {
      insights.push({
        job: 'integrate',
        id: 'identity-composite-connector',
        level: 'identity',
        category: 'inner-contradictions',
        scope: 'truth',
        title: 'A Quiet Carrier',
        body: 'You appear to carry difficulty quietly while healing most through being met in it. There is a real tension here: part of you keeps going alone, while another part deeply needs to feel seen, helped, and accurately held.',
        confidence: 'strong',
        accent: 'rose',
      });
    } else if (recovery === 'solitude' && stress === 'withdraw') {
      insights.push({
        job: 'integrate',
        id: 'identity-composite-solitary',
        level: 'identity',
        category: 'how-you-protect-yourself',
        scope: 'truth',
        title: 'Someone Who Processes Alone',
        body: 'Your entries suggest that you process difficulty inwardly. Pulling back may be one of the ways you protect yourself and make sense of what you feel. Solitude seems restorative for you, but it may also hide how much is happening underneath.',
        confidence: 'strong',
        accent: 'silverBlue',
      });
    }
  }

  // Personal truths as identity insights
  if (p.personalTruths.length >= 3) {
    insights.push({
      job: 'integrate',
      id: 'identity-truths-summary',
      level: 'identity',
      category: 'who-you-are-underneath',
      scope: 'truth',
      title: 'What Your Data Knows About You',
      body: `Across ${p.totalDays} days of reflection, certain truths keep holding. ${p.personalTruths.slice(0, 2).join(' ')} They may not explain everything about you, but they do sound like real parts of your emotional logic.`,
      confidence: 'strong',
      accent: 'gold',
    });
  }

  // Inner theme identity
  const deepThemes = p.innerThemes.filter(t => t.strength >= 50);
  if (deepThemes.length >= 2) {
    const themes = deepThemes.slice(0, 3);
    const dominantDomain = themes[0].domain;
    const domainReflection: Record<InnerTheme['domain'], string> = {
      emotional: 'Your inner world keeps returning to emotional themes. You appear to be someone for whom feelings are primary — not secondary to logic, not decoration, but the actual fabric of how you navigate life.',
      relational: 'The themes your reflections keep returning to are relational. How you connect, who understands you, where belonging lives — these appear to be central concerns of your inner life, not peripheral ones.',
      existential: 'Questions of meaning and purpose weave through your reflections consistently. You seem to be someone who doesn\'t just live but wonders about the living. This depth of questioning may be both a gift and a weight.',
      somatic: 'Your body appears consistently in your reflections — tension, exhaustion, restlessness. You seem to be someone whose body speaks loudly, carrying emotional truths that may not always make it into words.',
    };
    insights.push({
      job: 'integrate',
      id: 'identity-themes',
      level: 'identity',
      category: dominantDomain === 'relational' ? 'attachment-and-closeness' : dominantDomain === 'somatic' ? 'nervous-system' : 'who-you-are-underneath',
      scope: 'truth',
      title: 'Your Inner Landscape',
      body: domainReflection[dominantDomain],
      confidence: 'strong',
      accent: 'lavender',
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Season / chapter detection
// ─────────────────────────────────────────────────────────────────────────────

function detectSeason(p: PersonalProfile): Season | null {
  if (p.maturity === 'early') return null;

  const pp = p.patternProfile;
  const recent = pp.scoredDays.slice(-14);
  if (recent.length < 7) return null;

  const avgStab = mean(recent.map(d => d.scores.stability));
  const avgStrain = mean(recent.map(d => d.scores.strain));
  const avgRest = mean(recent.map(d => d.scores.restoration));
  const avgIntensity = mean(recent.map(d => d.scores.emotionalIntensity));

  const overall = pp.overallAvg;
  const daySpan = recent.length;

  // Recovery season: stability rising from below average, strain easing
  if (avgStab > overall.stability - 5 && avgStrain < overall.strain - 5 && avgRest > overall.restoration + 3) {
    return {
      label: 'A Season of Recovery',
      body: 'Recent weeks suggest a period of healing. Your strain has eased, restoration is up, and your system appears to be settling into something quieter and more stable.',
      tone: 'recovery',
      daySpan,
      confidence: p.maturity === 'deep' ? 'strong' : 'growing',
    };
  }

  // Intensity season: high strain and emotional intensity
  if (avgStrain > overall.strain + 8 && avgIntensity > overall.emotionalIntensity + 5) {
    return {
      label: 'A Chapter of Intensity',
      body: 'This period has carried more strain and emotional weight than your baseline. This isn\'t a judgment — some seasons ask more of us. What matters is how you meet yourself in it.',
      tone: 'intensity',
      daySpan,
      confidence: p.maturity === 'deep' ? 'strong' : 'growing',
    };
  }

  // Growth season: stability improving, strain stable or decreasing
  const stabTrends = pp.trends.stability;
  const latestStab = stabTrends[stabTrends.length - 1];
  if (latestStab?.direction === 'rising' && avgStrain <= overall.strain + 3) {
    return {
      label: 'A Season of Growth',
      body: 'Your stability has been quietly rising. Compared with earlier entries, this period feels steadier and more grounded. Something is shifting — even if slowly.',
      tone: 'growth',
      daySpan,
      confidence: p.maturity === 'deep' ? 'strong' : 'growing',
    };
  }

  // Steadiness season: low volatility, near-baseline everything
  const stabVol = mean(recent.map(d => Math.abs(d.scores.stability - avgStab)));
  if (stabVol < 8 && Math.abs(avgStab - overall.stability) < 5) {
    return {
      label: 'A Steady Chapter',
      body: 'Things have been relatively even. Not dramatic, not turbulent — just consistent. For someone whose system values steadiness, this may be closer to your natural rhythm.',
      tone: 'steadiness',
      daySpan,
      confidence: 'growing',
    };
  }

  // Transition: mixed signals
  if (Math.abs(avgStab - overall.stability) > 5 || Math.abs(avgStrain - overall.strain) > 5) {
    return {
      label: 'A Time of Transition',
      body: 'Your recent patterns are shifting from your usual baseline. Whether this feels like upheaval or movement, your system appears to be in transition.',
      tone: 'transition',
      daySpan,
      confidence: 'emerging',
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Narrative memory — what the app remembers about trajectory
// ─────────────────────────────────────────────────────────────────────────────

function buildNarrativeMemory(p: PersonalProfile): NarrativeMemory {
  const fadingPatterns: string[] = [];
  const emergingPatterns: string[] = [];
  const previousStruggles: string[] = [];
  const persistentTruths: string[] = [];

  if (p.maturity === 'early') {
    return { fadingPatterns, emergingPatterns, previousStruggles, persistentTruths };
  }

  const pp = p.patternProfile;
  const days = pp.scoredDays;
  if (days.length < 14) {
    return { fadingPatterns, emergingPatterns, previousStruggles, persistentTruths };
  }

  const half = Math.floor(days.length / 2);
  const earlier = days.slice(0, half);
  const later = days.slice(half);

  const earlyAvg = {
    stability: mean(earlier.map(d => d.scores.stability)),
    strain: mean(earlier.map(d => d.scores.strain)),
    restoration: mean(earlier.map(d => d.scores.restoration)),
    emotionalIntensity: mean(earlier.map(d => d.scores.emotionalIntensity)),
    connection: mean(earlier.map(d => d.scores.connection)),
  };
  const lateAvg = {
    stability: mean(later.map(d => d.scores.stability)),
    strain: mean(later.map(d => d.scores.strain)),
    restoration: mean(later.map(d => d.scores.restoration)),
    emotionalIntensity: mean(later.map(d => d.scores.emotionalIntensity)),
    connection: mean(later.map(d => d.scores.connection)),
  };

  // Detect trajectory shifts
  if (earlyAvg.strain > lateAvg.strain + 8) {
    fadingPatterns.push('Higher overall strain');
    previousStruggles.push('You used to carry more strain than you do now. Something has eased.');
  }
  if (earlyAvg.stability < lateAvg.stability - 8) {
    emergingPatterns.push('Growing emotional stability');
  }
  if (earlyAvg.restoration < lateAvg.restoration - 5) {
    emergingPatterns.push('More restorative activity');
  }
  if (earlyAvg.emotionalIntensity > lateAvg.emotionalIntensity + 8) {
    fadingPatterns.push('Higher emotional intensity');
    previousStruggles.push('Earlier entries showed more emotional turbulence. That appears to have settled.');
  }
  if (earlyAvg.connection < lateAvg.connection - 8) {
    emergingPatterns.push('Increasing connection');
  }
  if (earlyAvg.stability > lateAvg.stability + 8) {
    emergingPatterns.push('Declining stability — a harder season');
  }

  // Persistent truths: things true in both halves
  if (earlyAvg.strain > 55 && lateAvg.strain > 55) {
    persistentTruths.push('Strain has been a consistent presence across your data.');
  }
  if (p.sleepSensitivity > 60) {
    persistentTruths.push('Sleep sensitivity has been a constant — it has affected your steadiness throughout.');
  }
  if (p.connectionSensitivity > 60) {
    persistentTruths.push('Connection has remained important to your stability across all your data.');
  }

  // What used to be harder
  const earlyHighStrain = earlier.filter(d => d.scores.strain > 65).length / earlier.length;
  const lateHighStrain = later.filter(d => d.scores.strain > 65).length / later.length;
  if (earlyHighStrain > lateHighStrain + 0.15) {
    previousStruggles.push('High-strain days were more frequent in your earlier entries.');
  }

  return { fadingPatterns, emergingPatterns, previousStruggles, persistentTruths };
}

// ─────────────────────────────────────────────────────────────────────────────
// Strength insights — real strengths derived from data, not flattery
// ─────────────────────────────────────────────────────────────────────────────

const STRENGTH_TITLES: Record<string, string> = {
  'consistent-presence': 'You Keep Showing Up',
  'emotional-honesty': 'Emotional Honesty',
  'resilience': 'You Find Your Way Back',
  'inner-perceptiveness': 'Inner Perceptiveness',
  'connection-maintenance': 'You Stay Reachable',
};

const STRENGTH_PROMPTS: Record<string, string> = {
  'consistent-presence': 'What keeps you showing up even when it would be easier not to?',
  'emotional-honesty': 'Is it easy for you to track what you really feel, or does it take effort?',
  'resilience': 'Do you notice your own resilience, or does it only become visible looking back?',
  'inner-perceptiveness': 'When do you find your inner perceptiveness most useful?',
  'connection-maintenance': 'How do you stay connected even when you are overwhelmed?',
};

function buildStrengthInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  for (const s of p.strengths) {
    const title = STRENGTH_TITLES[s.id] ?? s.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const reflectionPrompt = STRENGTH_PROMPTS[s.id] ?? 'When do you notice this strength showing up most?';
    insights.push({
      job: 'integrate',
      id: `strength-${s.id}`,
      level: 'identity',
      category: 'who-you-are-underneath',
      scope: 'truth',
      title,
      body: s.description,
      confidence: s.strength > 70 ? 'strong' : s.strength > 45 ? 'growing' : 'emerging',
      accent: 'gold',
      reflectionPrompt,
    });
  }
  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Anticipation insights — forward-looking signals
// ─────────────────────────────────────────────────────────────────────────────

const ANTICIPATION_TITLES: Record<string, string> = {
  'strain-building': 'Strain Is Building',
  'sleep-risk': 'Sleep May Be Catching Up',
  'restoration-deficit': 'Restoration Running Low',
  'emotional-intensity-rising': 'Emotional Intensity Rising',
};

function buildAnticipationInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  for (const a of p.anticipations) {
    const title = ANTICIPATION_TITLES[a.id] ?? a.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    insights.push({
      job: 'guide',
      id: `anticipation-${a.id}`,
      level: 'need',
      category: 'what-activates-you',
      scope: 'daily',
      title,
      body: a.body,
      confidence: a.confidence > 70 ? 'strong' : a.confidence > 50 ? 'growing' : 'emerging',
      accent: a.urgency === 'important' ? 'rose' : a.urgency === 'notable' ? 'copper' : 'lavender',
      reflectionPrompt: 'What would help you protect your energy right now?',
    });
  }
  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Discomfort differentiation — help parse "I'm off" into specific types
// ─────────────────────────────────────────────────────────────────────────────

function buildDiscomfortInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  const days = p.patternProfile.scoredDays;
  if (days.length < 7) return insights;

  const recent = days.slice(-5);
  const recentAvg = {
    strain: mean(recent.map(d => d.scores.strain)),
    stability: mean(recent.map(d => d.scores.stability)),
    emotionalIntensity: mean(recent.map(d => d.scores.emotionalIntensity)),
    restoration: mean(recent.map(d => d.scores.restoration)),
    connection: mean(recent.map(d => d.scores.connection)),
  };
  const avg = p.patternProfile.overallAvg;

  // Only produce discomfort insights when someone is actually off
  if (recentAvg.stability >= avg.stability - 5) return insights;

  // Emotionally crowded: high intensity + low stability
  if (recentAvg.emotionalIntensity > avg.emotionalIntensity + 8 && recentAvg.stability < avg.stability - 8) {
    insights.push({
      job: 'name',
      id: 'discomfort-emotionally-crowded',
      level: 'pattern',
      category: 'nervous-system',
      scope: 'daily',
      title: 'Emotionally Crowded',
      body: 'You seem to be carrying a lot of emotional intensity right now. This isn\'t something to fix — it may just need space to settle.',
      selfLanguage: 'I feel emotionally crowded today',
      confidence: 'growing',
      accent: 'lavender',
      reflectionPrompt: 'Is there a feeling trying to get your attention beneath the noise?',
    });
  }

  // Physically drained: high strain + low restoration
  if (recentAvg.strain > avg.strain + 10 && recentAvg.restoration < avg.restoration - 8) {
    insights.push({
      job: 'name',
      id: 'discomfort-physically-drained',
      level: 'pattern',
      category: 'nervous-system',
      scope: 'daily',
      title: 'Quietly Depleted',
      body: 'Your body may be running a deficit right now — high strain without enough restoration. This kind of depletion can feel like emotional flatness or disengagement.',
      selfLanguage: 'I\'m quietly depleted — not sad, just running on empty',
      confidence: 'growing',
      accent: 'copper',
      reflectionPrompt: 'What would genuine rest look like today — not entertainment, but actual restoration?',
    });
  }

  // Socially disconnected
  if (recentAvg.connection < avg.connection - 10 && recentAvg.stability < avg.stability - 5) {
    insights.push({
      job: 'clarify',
      id: 'discomfort-disconnected',
      level: 'meaning',
      category: 'attachment-and-closeness',
      scope: 'daily',
      title: 'Emotionally Lonely',
      body: 'Connection has been low alongside reduced stability. You may not need more people — you may need more presence, more being-seen.',
      selfLanguage: 'I feel emotionally lonely today — not alone, but unseen',
      confidence: 'emerging',
      accent: 'rose',
      reflectionPrompt: 'What kind of connection would actually help right now?',
    });
  }

  // Overstimulated: high intensity + high strain + low restoration
  if (recentAvg.emotionalIntensity > avg.emotionalIntensity + 5 && recentAvg.strain > avg.strain + 5 && recentAvg.restoration < avg.restoration) {
    insights.push({
      job: 'name',
      id: 'discomfort-overstimulated',
      level: 'pattern',
      category: 'nervous-system',
      scope: 'daily',
      title: 'Overstimulated',
      body: 'Everything seems elevated — intensity, strain, without corresponding recovery. This pattern often means your nervous system needs less input, not more solutions.',
      selfLanguage: 'I\'m overstimulated — I don\'t need more, I need less',
      confidence: 'growing',
      accent: 'silverBlue',
      reflectionPrompt: 'What can you subtract from today, rather than add?',
    });
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress insights — humane markers of growth
// ─────────────────────────────────────────────────────────────────────────────

const PROGRESS_TITLES: Record<string, string> = {
  'strain-easing': 'Strain Is Easing',
  'stability-building': 'Building Steadiness',
  'restoration-increasing': 'More Restoration',
  'recovery-shortening': 'Recovering Faster',
  'connection-growing': 'More Connection',
  'sleep-improving': 'Rest Is Improving',
};

function buildProgressInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  for (const m of p.progressMarkers) {
    const title = PROGRESS_TITLES[m.id] ?? m.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    insights.push({
      job: 'integrate',
      id: `progress-${m.id}`,
      level: 'growth',
      category: 'growth-and-change',
      scope: 'seasonal',
      title,
      body: m.description,
      confidence: m.strength > 60 ? 'strong' : m.strength > 35 ? 'growing' : 'emerging',
      accent: 'emerald',
      reflectionPrompt: 'Does this match your own sense of how things have been changing?',
    });
  }
  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// "What to remember" — distilled self-knowledge for hard days
// ─────────────────────────────────────────────────────────────────────────────

function buildWhatToRemember(p: PersonalProfile): string[] {
  const reminders: string[] = [];

  // Recovery reminder
  if (p.recoveryStyle.avgRecoveryDays > 0) {
    reminders.push(
      `You usually recover within about ${Math.round(p.recoveryStyle.avgRecoveryDays)} day${p.recoveryStyle.avgRecoveryDays > 1.5 ? 's' : ''}. Hard days don't last as long as they feel like they will.`
    );
  }

  // Best day ingredients
  if (p.bestDayIngredients.length > 0) {
    reminders.push(
      `Your best days tend to include: ${p.bestDayIngredients.slice(0, 4).join(', ')}.`
    );
  }

  // Strongest personal truth
  if (p.personalTruths.length > 0) {
    reminders.push(p.personalTruths[0]);
  }

  // Strengths reminder
  if (p.strengths.length > 0) {
    reminders.push(p.strengths[0].description);
  }

  // Recovery ingredients
  if (p.recoveryStyle.recoveryIngredients.length > 0) {
    reminders.push(
      `What has helped before: ${p.recoveryStyle.recoveryIngredients.slice(0, 3).join(', ')}.`
    );
  }

  return reminders.slice(0, 5);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate deep insights from a PersonalProfile.
 *
 * Returns only the insight levels appropriate for the user's data maturity.
 * More data → deeper, more personal insights.
 *
 * Pure function — no I/O, no side effects.
 */
export function computeDeepInsights(profile: PersonalProfile): DeepInsightBundle {
  const availableLevels = LEVELS_BY_MATURITY[profile.maturity];
  const insights: DeepInsight[] = [];

  if (availableLevels.includes('pattern')) {
    insights.push(...buildPatternInsights(profile));
  }
  if (availableLevels.includes('meaning')) {
    insights.push(...buildMeaningInsights(profile));
  }
  if (availableLevels.includes('need')) {
    insights.push(...buildNeedInsights(profile));
  }
  if (availableLevels.includes('growth')) {
    insights.push(...buildGrowthInsights(profile));
    insights.push(...buildProgressInsights(profile));
  }
  if (availableLevels.includes('identity')) {
    insights.push(...buildIdentityInsights(profile));
    insights.push(...buildStrengthInsights(profile));
  }

  // Always available: discomfort differentiation and anticipation
  insights.push(...buildDiscomfortInsights(profile));
  insights.push(...buildAnticipationInsights(profile));

  const season = detectSeason(profile);
  const memory = buildNarrativeMemory(profile);
  const whatToRemember = buildWhatToRemember(profile);

  // Restraint mode: when user is low-capacity, limit insight count
  // Show fewer, simpler insights — prefer 'name' and 'guide' jobs over 'clarify' and 'integrate'
  let finalInsights = insights;
  if (profile.isLowCapacity) {
    const priorityOrder: InsightJob[] = ['name', 'guide', 'clarify', 'integrate'];
    finalInsights = insights
      .sort((a, b) => priorityOrder.indexOf(a.job) - priorityOrder.indexOf(b.job))
      .slice(0, 5);
  }

  return {
    insights: finalInsights,
    personalTruths: profile.personalTruths,
    season,
    memory,
    whatToRemember,
    maturity: profile.maturity,
    totalDays: profile.totalDays,
    generatedAt: new Date().toISOString(),
  };
}
