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
  PersonalTrait,
  DataMaturity,
  RecoveryStyle,
  StressPattern,
  InnerTheme,
  PersonalStrength,
  Anticipation,
  ProgressMarker,
  TodayContext,
} from './personalProfile';
import { mean } from './stats';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type InsightLevel = 'pattern' | 'meaning' | 'need' | 'growth' | 'identity';

export type TemporalScope = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'truth';

export type InsightJob = 'name' | 'clarify' | 'guide' | 'integrate';

export interface DeepInsight {
  id: string;
  level: InsightLevel;
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
      scope: 'weekly',
      title: 'Sleep & Steadiness',
      body: `Your emotional steadiness appears closely tied to sleep quality. On nights with better rest, your stability tends to run ${Math.round(p.sleepSensitivity * 0.3)}+ points higher.`,
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
      scope: 'weekly',
      title: 'Gradual Strain Buildup',
      body: `Stress tends to build gradually for you — often over ${Math.round(p.stressPattern.avgBuildupDays)} days before it peaks. The warning signs may be quieter than you'd expect.`,
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
      scope: 'weekly',
      title: 'Sudden Stress Spikes',
      body: 'Your strain tends to arrive suddenly rather than building slowly. This suggests that specific triggers or environmental shifts have outsized impact on your system.',
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
      scope: 'weekly',
      title: 'Connection & Mood',
      body: 'Feeling connected to others appears to noticeably affect your emotional state. Days with higher connection scores tend to show more stability and less strain.',
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
      scope: 'monthly',
      title: 'Your Best Days',
      body: `Your most stable days tend to share a few common ingredients: ${p.bestDayIngredients.slice(0, 4).join(', ')}. This isn't a coincidence — it's a signal about what your system needs.`,
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
      scope: 'weekly',
      title: 'Wide Emotional Range',
      body: 'Your emotional intensity varies quite a bit from day to day. This isn\'t instability — it may reflect a system that feels things deeply and responds to its environment with sensitivity.',
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
  const { traits, recoveryStyle, stressPattern, innerThemes } = p;

  // From top traits
  const topTraits = traits.filter(t => t.strength >= 50).slice(0, 3);
  for (const trait of topTraits) {
    if (trait.id === 'sleep-sensitive') {
      insights.push({
      job: 'clarify',
        id: 'meaning-sleep-sensitive',
        level: 'meaning',
        scope: 'monthly',
        title: 'Sleep Sensitivity',
        body: 'Sleep seems to affect you more than just physically. When your rest is disrupted, your emotional regulation shifts noticeably. This suggests your nervous system may rely heavily on sleep to calibrate.',
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
        scope: 'monthly',
        title: 'Relational Sensitivity',
        body: 'Connection appears to be more than a preference for you — it seems to function as a form of emotional regulation. Feeling understood helps you stay steady in ways that solitude alone doesn\'t replicate.',
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
        scope: 'monthly',
        title: 'Emotional Depth',
        body: 'Your data suggests you feel things more intensely than neutral, even during stable periods. This isn\'t something to fix — it may be central to how you experience richness and meaning.',
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
        scope: 'monthly',
        title: 'Slow-Building Strain',
        body: 'You appear to be someone who absorbs stress quietly. You keep functioning while strain builds beneath the surface. By the time it surfaces, it\'s often been building for days. This means early signals matter more for you.',
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
        scope: 'monthly',
        title: 'Gravitating Toward Steadiness',
        body: 'Your system seems to value and maintain emotional consistency. You may find instability more draining than the stressor itself — it\'s the unpredictability that costs you, not just the difficulty.',
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
      scope: 'monthly',
      title: 'Recurring Theme',
      body: `The theme of "${dominant.theme}" appears repeatedly in your reflections. It seems connected to ${domainLabels[dominant.domain]}. This isn't random — it may be something your inner world keeps bringing your attention back to.`,
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
      scope: 'monthly',
      title: 'Rest as Foundation',
      body: 'Many of your other patterns — mood, strain, stability — seem downstream of sleep. Protecting your sleep may be one of the most effective single things you can do for your overall wellbeing.',
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
      scope: 'monthly',
      title: 'Need for Connection',
      body: 'Your data suggests that feeling connected isn\'t a luxury for you — it\'s closer to a need. When connection drops, so does your stability. This might be worth protecting as deliberately as sleep.',
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
        scope: 'monthly',
        title: 'Extended Recovery Time',
        body: `After difficult periods, your system seems to take about ${Math.round(avgDays)} days to return to baseline. You may need to plan for this — rushing recovery could extend it.`,
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
        scope: 'monthly',
        title: 'Your Recovery Ingredients',
        body: `When you recover, certain conditions seem to help: ${p.recoveryStyle.recoveryIngredients.slice(0, 4).join(', ')}. These may be worth reaching for intentionally after hard stretches, not just when they happen to appear.`,
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
      scope: 'monthly',
      title: 'Earlier Self-Awareness',
      body: 'Because your stress tends to build silently, you may benefit from checking in with yourself before you feel like you need to. By the time the signal is loud, it\'s often been building for several days.',
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
      scope: 'monthly',
      title: 'Emotional Spaciousness',
      body: 'Too many simultaneous demands or feelings seem to overwhelm your system more than single stressors. You may need emotional spaciousness — room to feel one thing at a time — more than most.',
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
      scope: 'monthly',
      title: 'Growing Steadiness',
      body: 'Your emotional stability has been gradually increasing. This may not feel dramatic day to day, but over time it suggests your system is finding more solid ground.',
      reflectionPrompt: 'Can you sense this steadiness growing, or does it only become visible looking back?',
      confidence: stabTrend.volatility < 10 ? 'strong' : 'growing',
      accent: 'gold',
    });
  } else if (stabTrend?.direction === 'falling') {
    insights.push({
      job: 'integrate',
      id: 'growth-stability-declining',
      level: 'growth',
      scope: 'monthly',
      title: 'A Period of Difficulty',
      body: 'Your stability has been trending lower recently. This isn\'t a failure — it may reflect a genuinely harder season. What matters most now might be meeting yourself with patience rather than expectation.',
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
      scope: 'monthly',
      title: 'Strain Is Easing',
      body: 'Your overall strain level has been gradually decreasing. Something in your life or your approach may be working — even if it doesn\'t feel like a breakthrough.',
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
      scope: 'monthly',
      title: 'More Restoration',
      body: 'You\'ve been engaging in more restorative activities over time. Whether intentional or instinctive, this is a sign that you\'re learning to give your system what it needs.',
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
      scope: 'seasonal',
      title: 'Resilience Pattern',
      body: 'Even after your hardest days, you tend to bounce back. This pattern is consistent enough to be called a strength — your system has learned how to recover, even if it doesn\'t always feel that way in the moment.',
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
        scope: 'truth',
        title: 'Someone Who Feels Deeply',
        body: 'Your inner world runs at a consistently higher emotional intensity than neutral. This shapes everything — how you connect, what drains you, what moves you. It\'s not something to manage away. It may be one of the truest things about you.',
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
        scope: 'truth',
        title: 'A Quiet Carrier',
        body: 'You appear to be someone who carries difficulty silently while finding healing through connection. You push through strain on your own, but recover best when someone meets you in it. There\'s a tension there — between self-reliance and the need to be seen — that may be worth honoring.',
        confidence: 'strong',
        accent: 'rose',
      });
    } else if (recovery === 'solitude' && stress === 'withdraw') {
      insights.push({
      job: 'integrate',
        id: 'identity-composite-solitary',
        level: 'identity',
        scope: 'truth',
        title: 'Someone Who Processes Alone',
        body: 'Your data paints a picture of someone who processes difficulty internally. You withdraw to recover, and solitude tends to be restorative rather than isolating. Your inner world may be richer and more active than what you share outwardly.',
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
      scope: 'truth',
      title: 'What Your Data Knows About You',
      body: `After ${p.totalDays} days of self-reflection, certain truths have become clear: ${p.personalTruths.slice(0, 2).join(' ')} These aren't temporary patterns — they appear to be part of who you are.`,
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

function buildStrengthInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  for (const s of p.strengths) {
    insights.push({
      job: 'integrate',
      id: `strength-${s.id}`,
      level: 'identity',
      scope: 'truth',
      title: s.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      body: s.description,
      confidence: s.strength > 70 ? 'strong' : s.strength > 45 ? 'growing' : 'emerging',
      accent: 'gold',
      reflectionPrompt: 'When do you notice this strength showing up most?',
    });
  }
  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Anticipation insights — forward-looking signals
// ─────────────────────────────────────────────────────────────────────────────

function buildAnticipationInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  for (const a of p.anticipations) {
    insights.push({
      job: 'guide',
      id: `anticipation-${a.id}`,
      level: 'need',
      scope: 'daily',
      title: a.id === 'strain-building' ? 'Strain Building'
        : a.id === 'sleep-risk' ? 'Sleep May Be Catching Up'
        : a.id === 'restoration-deficit' ? 'Restoration Running Low'
        : 'Emotional Intensity Rising',
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

function buildProgressInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  for (const m of p.progressMarkers) {
    insights.push({
      job: 'integrate',
      id: `progress-${m.id}`,
      level: 'growth',
      scope: 'seasonal',
      title: m.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
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
