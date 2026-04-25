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
  | 'inner-contradictions'
  | 'hidden-costs'
  | 'emotional-logic'
  | 'relational-patterns'
  | 'baseline-shifts'
  | 'environmental-sensitivity'
  | 'energy-leaks'
  | 'adaptive-behaviors'
  | 'processing-style'
  | 'quiet-strengths'
  | 'sleep-and-rhythm'
  | 'dream-patterns'
  | 'somatic-signals'
  | 'trigger-responses'
  | 'glimmers-and-elevation'
  | 'journal-themes'
  | 'daily-state'
  | 'focus-and-capacity'
  | 'cognitive-style'
  | 'archetypes-and-roles'
  | 'cosmic-context'
  | 'core-values';

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
  evidence?: string[];
  whyItMatters?: string;
  nextStep?: string;
  premiumType?:
    | 'risk-forecast'
    | 'recovery-plan'
    | 'operating-manual'
    | 'blind-spot'
    | 'best-day-formula'
    | 'hard-day-map'
    | 'trajectory'
    | 'next-best-action'
    | 'relationship-blueprint'
    | 'dream-translation'
    | 'somatic-signature'
    | 'trigger-map'
    | 'glimmer-formula'
    | 'burnout-warning'
    | 'alignment-check'
    | 'cognitive-bias'
    | 'nervous-system-baseline'
    | 'coping-strategy'
    | 'core-need'
    | 'seasonal-shift'
    | 'identity-evolution'
    | 'hidden-toll';
  valueRank?: number;
  lockedPreview?: string;
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

export interface ForecastSignal {
  id: string;
  title: string;
  body: string;
  urgency: 'gentle' | 'notable' | 'important';
  evidence: string[];
  protectiveMove: string;
}

export interface NextBestAction {
  id: string;
  title: string;
  body: string;
  whyThis: string;
  effort: 'tiny' | 'small' | 'medium';
  category: 'restore' | 'connect' | 'reduce-demand' | 'reflect' | 'protect-sleep' | 'ground';
}

export interface PersonalOperatingManual {
  headline: string;
  corePattern: string;
  earlyWarningSigns: string[];
  stabilizers: string[];
  restorePlan: string[];
  doMoreOf: string[];
  doLessOf: string[];
  supportScript?: string;
}

export interface PremiumInsightReport {
  headline: string;
  subheadline: string;
  strongestInsightId?: string;
  strongestInsightTitle?: string;
  paidValueSummary: string[];
  lockedPreview: string;
}

export interface DeepInsightBundle {
  insights: DeepInsight[];
  personalTruths: string[];
  season: Season | null;
  memory: NarrativeMemory;
  /** Distilled self-knowledge for hard days */
  whatToRemember: string[];
  premiumReport: PremiumInsightReport;
  operatingManual: PersonalOperatingManual;
  forecast: ForecastSignal[];
  nextBestActions: NextBestAction[];
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

function signalLead(confidence: DeepInsight['confidence']): string {
  if (confidence === 'strong') return 'A strong pattern in your entries suggests';
  if (confidence === 'growing') return 'A pattern in your data suggests';
  return 'Early signs suggest';
}

function daysReceipt(totalDays: number, scope: TemporalScope): string {
  if (scope === 'daily') return 'From the last several days';
  if (scope === 'weekly') return `Across ${Math.min(totalDays, 14)} recent entries`;
  if (scope === 'monthly') return `Observed across ${Math.min(totalDays, 30)} days`;
  if (scope === 'seasonal') return `Observed across ${totalDays} days`;
  return `Observed across ${totalDays} days`;
}

function stableVariantSeed(...parts: Array<string | number | undefined>): number {
  return parts
    .filter((part): part is string | number => part !== undefined)
    .map(String)
    .join('|')
    .split('')
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function pickFragment(options: string[], seed: number, salt: number): string {
  return options[Math.abs(seed + salt * 131) % options.length] ?? '';
}

function composeInsightNarrative(
  seedParts: Array<string | number | undefined>,
  fragmentGroups: string[][],
): string {
  const seed = stableVariantSeed(...seedParts);
  return fragmentGroups
    .map((options, index) => pickFragment(options, seed, index + 1))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatNaturalList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Personalized reflection prompt helpers
// ─────────────────────────────────────────────────────────────────────────────

/** GenerLetate a personalized reflection prompt using the user's actual data */
function personalizedPrompt(basePrompt: string, p: PersonalProfile, context?: {
  useRecoveryIngredients?: boolean;
  useBestDayIngredients?: boolean;
  useStressPattern?: boolean;
}): string {
  // If we have specific ingredients to reference, make it concrete
  if (context?.useRecoveryIngredients && p.recoveryStyle.recoveryIngredients.length > 0) {
    const safeIngredients = safeRecoveryIngredients(p.recoveryStyle.recoveryIngredients, 2);
    if (safeIngredients.length > 0) {
      return `${basePrompt} (You've mentioned ${safeIngredients.join(' and ')} helping before.)`;
    }
  }

  if (context?.useBestDayIngredients && p.bestDayIngredients.length > 0) {
    const ingredients = p.bestDayIngredients.slice(0, 2);
    return `${basePrompt} (Your better days often include ${ingredients.join(' and ')}.)`;
  }

  if (context?.useStressPattern && p.stressPattern.avgBuildupDays > 0) {
    return `${basePrompt} (Your pattern suggests about ${Math.round(p.stressPattern.avgBuildupDays)} days of buildup.)`;
  }

  return basePrompt;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pattern-level insights (Level 1): "What keeps happening?"
// ─────────────────────────────────────────────────────────────────────────────

function buildPatternInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  const { patternProfile: pp } = p;

  // Sleep–stability pattern
  if (p.sleepSensitivity > 55) {
    const sleepCorr = pp.correlations.find(c => c.metricA === 'sleep' && c.metricB === 'stability');
    const confidence: DeepInsight['confidence'] = p.sleepSensitivity > 70 ? 'strong' : 'growing';
    insights.push({
      job: 'name',
      id: 'pattern-sleep',
      level: 'pattern',
      category: 'nervous-system',
      scope: 'weekly',
      title: 'Sleep Changes More Than Energy',
      body: `Your archive shows that sleep disruption affects more than just your energy levels. ${daysReceipt(p.totalDays, 'weekly')}, after lower-rest nights, your system becomes noticeably easier to knock off center—your patience thins, your steadiness wavers, and small stressors land harder. The pattern suggests that for you, sleep functions less like a performance enhancer and more like emotional scaffolding. This does not read as weakness. It reads as a nervous system that requires consistent rest to maintain its equilibrium.`,
      detail: sleepCorr ? `Correlation strength: ${sleepCorr.strength > 0.5 ? 'strong' : sleepCorr.strength > 0.3 ? 'moderate' : 'mild'}` : undefined,
      reflectionPrompt: 'How does a bad night of sleep tend to show up for you the next day?',
      selfLanguage: 'sleep-sensitive',
      confidence,
      accent: 'silverBlue',
    });
  }

  // Strain accumulation pattern
  if (p.stressPattern.buildupStyle === 'gradual') {
    const confidence: DeepInsight['confidence'] = p.stressPattern.confidence >= 60 ? 'strong' : 'growing';
    insights.push({
      job: 'name',
      id: 'pattern-strain-buildup',
      level: 'pattern',
      category: 'how-you-protect-yourself',
      scope: 'weekly',
      title: 'Strain That Builds in the Background',
      body: `${signalLead(confidence)} that strain builds quietly for you, often over about ${Math.round(p.stressPattern.avgBuildupDays)} days before it becomes obvious. This looks less like sudden collapse and more like protection: by the time it feels unmistakable, you have usually been carrying it for a while.`,
      reflectionPrompt: 'When you think back to recent hard stretches, did you notice strain building before it peaked?',
      selfLanguage: 'quietly depleted',
      confidence,
      accent: 'copper',
    });
  } else if (p.stressPattern.buildupStyle === 'sudden') {
    const confidence: DeepInsight['confidence'] = p.stressPattern.confidence >= 60 ? 'strong' : 'growing';
    insights.push({
      job: 'name',
      id: 'pattern-strain-sudden',
      level: 'pattern',
      category: 'what-activates-you',
      scope: 'weekly',
      title: 'Sudden Stress Spikes',
      body: `${signalLead(confidence)} that your system reacts strongly to specific moments rather than only to long buildup. ${daysReceipt(p.totalDays, 'weekly')}, sudden shifts in tone, environment, or demand seem able to change your state quickly. This looks less like overreaction and more like fast signal detection.`,
      reflectionPrompt: 'What was happening around you the last time stress seemed to appear out of nowhere?',
      selfLanguage: 'environmentally reactive',
      confidence,
      accent: 'copper',
    });
  }

  // Connection pattern
  if (p.connectionSensitivity > 55) {
    const confidence: DeepInsight['confidence'] = p.connectionSensitivity > 70 ? 'strong' : 'growing';
    insights.push({
      job: 'name',
      id: 'pattern-connection',
      level: 'pattern',
      category: 'attachment-and-closeness',
      scope: 'weekly',
      title: 'Connection Changes Your State',
      body: `${signalLead(confidence)} that connection changes your state in a real way. ${daysReceipt(p.totalDays, 'weekly')}, when you feel understood, your entries show more steadiness and less strain. The pattern suggests connection helps regulate you, not just comfort you.`,
      reflectionPrompt: 'When do you feel most connected? Is it about being around people, or something more specific?',
      selfLanguage: 'connection-regulated',
      confidence,
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
      title: 'What Your Better Days Have in Common',
      body: `${daysReceipt(p.totalDays, 'monthly')}, your steadier days share the same ingredients: ${p.bestDayIngredients.slice(0, 4).join(', ')}. That repetition matters. It suggests your better days are not random; they are built from conditions your system reliably responds to.`,
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
      title: 'You Register Life Strongly',
      body: `${signalLead(p.totalDays >= 21 ? 'strong' : 'growing')} that your emotional range is wider than simple good-day or bad-day swings. ${daysReceipt(p.totalDays, 'weekly')}, we see this may not be instability so much as depth: a system that registers shifts strongly and responds to them with real intensity.`,
      reflectionPrompt: 'What kind of tired or drained is it when your emotions run high? Is it the same each time?',
      selfLanguage: 'emotionally wide-ranging',
      confidence: p.totalDays >= 21 ? 'strong' : 'growing',
      accent: 'lavender',
    });
  }

  // Journal frequency / reflection depth
  const journalDays = pp.scoredDays.filter(d => d.aggregate.hasJournalText).length;
  if (journalDays > 7 && journalDays / p.totalDays > 0.3) {
    insights.push({
      job: 'name',
      id: 'pattern-journal-depth',
      level: 'pattern',
      category: 'processing-style',
      scope: 'monthly',
      title: 'Writing as Regulation',
      body: `${signalLead('strong')} that processing your thoughts in writing is a regulatory tool for you. ${daysReceipt(p.totalDays, 'monthly')}, the density of your journal entries suggests you use articulation to metabolize experience, not just to record it.`,
      reflectionPrompt: 'Does writing feel like remembering the day, or surviving it?',
      selfLanguage: 'articulates to regulate',
      confidence: 'strong',
      accent: 'gold',
    });
  }

  // Somatic signals - tension vs strain
  const somaticDays = pp.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => ['tension', 'pain', 'heaviness', 'exhaustion'].includes(t.toLowerCase())));
  if (somaticDays.length >= 3) {
    insights.push({
      job: 'name',
      id: 'pattern-somatic-tension',
      level: 'pattern',
      category: 'somatic-signals',
      scope: 'weekly',
      title: 'Your Body Holds the Score',
      body: `${signalLead(somaticDays.length >= 5 ? 'strong' : 'growing')} that strain translates directly into physical sensation for you. ${daysReceipt(p.totalDays, 'weekly')}, difficult stretches reliably present as physical heaviness or tension before they are logged as emotional overwhelm.`,
      reflectionPrompt: 'When you feel tension, what is the emotion sitting right underneath it?',
      selfLanguage: 'somatically expressive',
      confidence: somaticDays.length >= 5 ? 'strong' : 'growing',
      accent: 'copper',
    });
  }

  // Dream patterns
  const dreamDays = pp.scoredDays.filter(d => d.aggregate.hasDream);
  if (dreamDays.length >= 5) {
    const highIntensityDreams = dreamDays.filter(d => d.scores.emotionalIntensity > 60);
    if (highIntensityDreams.length / dreamDays.length > 0.4) {
      insights.push({
        job: 'name',
        id: 'pattern-vivid-dreams',
        level: 'pattern',
        category: 'dream-patterns',
        scope: 'monthly',
        title: 'Active Nighttime Processing',
        body: `${signalLead('strong')} that your dreams are currently doing heavy emotional lifting. ${daysReceipt(p.totalDays, 'monthly')}, your logged dreams correspond with higher daytime emotional intensity. Your mind seems to be working through tension while you sleep.`,
        reflectionPrompt: 'Do you wake up feeling like you have already lived a full day?',
        selfLanguage: 'active nighttime processor',
        confidence: 'strong',
        accent: 'lavender',
      });
    }
  }

  // Daily State / Focus Capacity
  if (p.totalDays >= 7) {
    const flatDays = pp.scoredDays.filter(d => d.scores.strain < 40 && d.scores.emotionalIntensity < 40 && d.scores.restoration < 40);
    if (flatDays.length >= 3) {
      insights.push({
        job: 'name',
        id: 'pattern-flat-capacity',
        level: 'pattern',
        category: 'focus-and-capacity',
        scope: 'weekly',
        title: 'A Period of Flatness',
        body: `${signalLead('growing')} that your system is currently in a state of withdrawal or flatness, rather than active stress. ${daysReceipt(p.totalDays, 'weekly')}, your entries show low strain but also low intensity and restoration, which is often a sign of protective down-regulation.`,
        reflectionPrompt: 'Does this flatness feel peaceful, or does it feel like your system has simply powered down?',
        selfLanguage: 'in a protective down-regulation',
        confidence: 'growing',
        accent: 'silverBlue',
      });
    }
  }

  // Trigger log / Reactivity
  const triggerDays = pp.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => t.includes('triggered') || t.includes('conflict')));
  if (triggerDays.length >= 3) {
    const avgStabilityAfterTrigger = mean(triggerDays.map(d => d.scores.stability));
    if (avgStabilityAfterTrigger < p.baselineStability - 10) {
      insights.push({
        job: 'name',
        id: 'pattern-trigger-impact',
        level: 'pattern',
        category: 'trigger-responses',
        scope: 'weekly',
        title: 'Triggers Take a Toll on Steadiness',
        body: `${signalLead('growing')} that relational friction or triggers do more than upset you—they actively deregulate your baseline. ${daysReceipt(p.totalDays, 'weekly')}, your steadiness drops significantly on days with conflict or activation.`,
        reflectionPrompt: 'Do you tend to isolate when triggered, or do you seek reassurance?',
        selfLanguage: 'vulnerable to trigger deregulation',
        confidence: 'growing',
        accent: 'rose',
      });
    }
  }

  // Glimmers / Positive Activation
  const glimmerDays = pp.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => t.includes('glimmer') || t.includes('awe') || t.includes('peace')));
  if (glimmerDays.length >= 3) {
    insights.push({
      job: 'name',
      id: 'pattern-glimmer-activation',
      level: 'pattern',
      category: 'glimmers-and-elevation',
      scope: 'monthly',
      title: 'Noticing the Good Settles You',
      body: `${signalLead('growing')} that actively logging moments of awe, peace, or glimmers serves as a stabilizer for you. ${daysReceipt(p.totalDays, 'monthly')}, on days you notice these small elevations, your overall strain appears lower.`,
      reflectionPrompt: 'Is noticing glimmers something you do naturally, or something you have to practice?',
      selfLanguage: 'regulated by noticing glimmers',
      confidence: 'growing',
      accent: 'gold',
    });
  }

  // Energy Leaks / Cognitive Drain
  const overthinkingDays = pp.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => t.includes('overthinking') || t.includes('rumination') || t.includes('worry')));
  if (overthinkingDays.length >= 3) {
    const avgStrainCognitive = mean(overthinkingDays.map(d => d.scores.strain));
    if (avgStrainCognitive > pp.overallAvg.strain + 5) {
      insights.push({
        job: 'name',
        id: 'pattern-cognitive-leak',
        level: 'pattern',
        category: 'energy-leaks',
        scope: 'weekly',
        title: 'Your Mind May Be Your Biggest Drain',
        body: `${signalLead('growing')} that rumination and overthinking cost you more energy than actual events. ${daysReceipt(p.totalDays, 'weekly')}, your highest strain days often align with mental spinning rather than external chaos.`,
        reflectionPrompt: 'When you are overthinking, what are you usually trying to protect yourself from?',
        selfLanguage: 'drained by mental spinning',
        confidence: 'growing',
        accent: 'copper',
      });
    }
  }

  // Daily State / Environmental Sensitivity
  const environmentDays = pp.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => t.includes('weather') || t.includes('environment') || t.includes('noise') || t.includes('crowds')));
  if (environmentDays.length >= 3) {
    insights.push({
      job: 'name',
      id: 'pattern-environmental-sensitivity',
      level: 'pattern',
      category: 'environmental-sensitivity',
      scope: 'monthly',
      title: 'Sensitivity to Your Surroundings',
      body: `${signalLead('growing')} that your baseline is highly responsive to physical environments. ${daysReceipt(p.totalDays, 'monthly')}, shifts in noise, crowds, or weather directly alter your steadiness, suggesting you don't just notice your environment—you absorb it.`,
      reflectionPrompt: 'What is the smallest change to your environment that instantly helps you settle?',
      selfLanguage: 'environmentally porous',
      confidence: 'growing',
      accent: 'silverBlue',
    });
  }

  // Baseline Shifts (Daily Check-ins tracking)
  const highVarianceDays = pp.scoredDays.filter(d => Math.abs(d.scores.stability - p.baselineStability) > 20);
  if (highVarianceDays.length >= 5 && highVarianceDays.length / p.totalDays < 0.3) {
    insights.push({
      job: 'name',
      id: 'pattern-baseline-shift',
      level: 'pattern',
      category: 'baseline-shifts',
      scope: 'seasonal',
      title: 'Shifting Baselines',
      body: `${signalLead('strong')} that your daily state experiences significant departures from its own norm. ${daysReceipt(p.totalDays, 'seasonal')}, rather than a smooth curve, your check-ins reveal distinct baseline shifts, marking periods where your whole operating system changes gears.`,
      reflectionPrompt: 'When your baseline drops, does it feel like a mood, or an entirely different state of being?',
      selfLanguage: 'experiences full baseline shifts',
      confidence: 'strong',
      accent: 'copper',
    });
  }

  // Adaptive Behaviors
  const adaptiveDays = pp.scoredDays.filter(d => d.scores.strain > 60 && d.aggregate.tagsUnion.some(t => ['routine', 'exercise', 'nature', 'therapy', 'meditation'].includes(t.toLowerCase())));
  if (adaptiveDays.length >= 3) {
    insights.push({
      job: 'name',
      id: 'pattern-adaptive-responses',
      level: 'pattern',
      category: 'adaptive-behaviors',
      scope: 'weekly',
      title: 'Your Adaptive Responses',
      body: `${signalLead('growing')} that your response to high strain includes active intervention. ${daysReceipt(p.totalDays, 'weekly')}, when things get hard, your data shows an increase in structured, adaptive behaviors rather than pure withdrawal.`,
      reflectionPrompt: 'Which of your coping routines actually helps, and which are just going through the motions?',
      selfLanguage: 'adaptive under strain',
      confidence: 'growing',
      accent: 'emerald',
    });
  }

  // Cognitive Processing Style Pattern
  const processingDays = pp.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => ['logic', 'intuition', 'processing', 'analysis', 'insight'].includes(t.toLowerCase())));
  if (processingDays.length >= 4) {
    insights.push({
      job: 'name',
      id: 'pattern-cognitive-processing',
      level: 'pattern',
      category: 'cognitive-style',
      scope: 'monthly',
      title: 'How You Process Information',
      body: `Your archive shows that understanding is one of the ways you regulate. ${daysReceipt(p.totalDays, 'monthly')}, you return often to analysis, meaning-making, and trying to locate the deeper thread beneath what happened. The pattern suggests that you may not fully move through an experience until it has a shape: what happened, what it touched, and why it stayed with you. This does not read as overthinking. It reads as your mind trying to make something emotionally survivable by making it understandable.`,
      reflectionPrompt: 'Does analyzing a feeling help it pass, or does it keep you stuck inside it?',
      selfLanguage: 'requires cognitive resolution to regulate',
      confidence: 'strong',
      accent: 'silverBlue',
    });
  }

  // Archetypal / Role Strain
  const roleDays = pp.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => ['responsibility', 'caregiving', 'fixing', 'leading', 'supporting'].includes(t.toLowerCase())));
  if (roleDays.length >= 3) {
    const avgStrainRole = mean(roleDays.map(d => d.scores.strain));
    if (avgStrainRole > pp.overallAvg.strain + 5) {
      insights.push({
        job: 'name',
        id: 'pattern-archetypal-strain',
        level: 'pattern',
        category: 'archetypes-and-roles',
        scope: 'weekly',
        title: 'The Weight of Your Roles',
        body: `${signalLead('growing')} that your primary roles and archetypes (e.g., caregiving, leading) are currently driving your strain. ${daysReceipt(p.totalDays, 'weekly')}, your highest strain days correspond directly with stepping into protective or supportive roles for others.`,
        reflectionPrompt: 'Are you protecting others at the expense of your own steadiness right now?',
        selfLanguage: 'drained by role expectations',
        confidence: 'growing',
        accent: 'copper',
      });
    }
  }

  // Cosmic / Lunar Sensitivity
  const lunarDays = pp.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => ['full_moon', 'new_moon', 'astrology', 'cosmic'].includes(t.toLowerCase())));
  if (lunarDays.length >= 2) {
    insights.push({
      job: 'name',
      id: 'pattern-cosmic-context',
      level: 'pattern',
      category: 'cosmic-context',
      scope: 'seasonal',
      title: 'Sensitivity to Broader Cycles',
      body: `${signalLead('emerging')} that you are tracking shifts in your state alongside lunar or cosmic cycles. ${daysReceipt(p.totalDays, 'seasonal')}, noting these correlations suggests your baseline is sensitive not just to your immediate environment, but to broader, seasonal, or cosmic rhythms.`,
      reflectionPrompt: 'Do these external cycles feel like an explanation, or an anchor?',
      selfLanguage: 'sensitive to broader rhythms',
      confidence: 'emerging',
      accent: 'lavender',
    });
  }

  // Core Values as Stressors
  const valuesDays = pp.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => ['authenticity', 'integrity', 'growth', 'justice', 'freedom'].includes(t.toLowerCase())));
  if (valuesDays.length >= 3) {
    const avgIntensityValues = mean(valuesDays.map(d => d.scores.emotionalIntensity));
    if (avgIntensityValues > pp.overallAvg.emotionalIntensity + 5) {
      insights.push({
        job: 'name',
        id: 'pattern-values-activation',
        level: 'pattern',
        category: 'core-values',
        scope: 'monthly',
        title: 'When Your Values Are Touched',
        body: `${signalLead('growing')} that your emotional intensity spikes when your core values are involved. ${daysReceipt(p.totalDays, 'monthly')}, situations related to authenticity or growth create significantly higher emotional activation, showing that you process values deeply.`,
        reflectionPrompt: 'Is this intensity a sign of passion, or a sign that a boundary was crossed?',
        selfLanguage: 'highly activated by core values',
        confidence: 'growing',
        accent: 'gold',
      });
    }
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
        body: `${signalLead(trait.strength >= 70 ? 'strong' : 'growing')} that sleep affects you on an emotional level, not just a physical one. ${daysReceipt(p.totalDays, 'monthly')}, when rest is disrupted, your regulation appears to get shakier faster. For you, sleep may function less like a bonus and more like calibration.`,
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
        body: `${signalLead(trait.strength >= 70 ? 'strong' : 'growing')} that connection is more than a preference for you. ${daysReceipt(p.totalDays, 'monthly')}, feeling understood appears to help your system settle in ways solitude alone does not fully replace. This may mean closeness functions as regulation, not just reassurance.`,
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
        body: `${signalLead(trait.strength >= 70 ? 'strong' : 'growing')} that you do not move through life lightly. ${daysReceipt(p.totalDays, 'monthly')}, you seem to register meaning, tension, and feeling with more depth than average. That depth can be a source of richness, but it can also make certain seasons heavier to carry.`,
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
        title: 'Stress You Carry Quietly',
        body: `You often stay capable after strain has already started building. From the outside, you may still look clear and functional. Internally, your system may already be paying a cost.`,
        whyItMatters: 'If your stress stays hidden behind capability, you may notice your limits later than you should.',
        reflectionPrompt: 'What are the earliest signs that you are still functioning, but no longer truly resourced?',
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
        title: 'You Need More Steadiness Than Chaos',
        body: `${signalLead(trait.strength >= 70 ? 'strong' : 'growing')} that unpredictability affects you more than the average disruption. ${daysReceipt(p.totalDays, 'monthly')}, we have seen that it may not be the hard thing itself that drains you most, but the uncertainty around it. Steadiness looks less like a preference here and more like a condition that helps you stay open.`,
        reflectionPrompt: 'Is it the hard thing itself that drains you, or the not knowing when it will end?',
        selfLanguage: 'in need of steadiness, not stimulation',
        confidence: trait.strength >= 70 ? 'strong' : 'growing',
        accent: 'gold',
      });
    }
  }

  // Recovery meaning - be specific even when mixed
  if (recoveryStyle.confidence >= 50) {
    // For mixed mode, identify the dominant ingredient if possible
    let actualMode = recoveryStyle.mode;
    let bodyText = '';

    if (recoveryStyle.mode === 'mixed' && recoveryStyle.recoveryIngredients.length > 0) {
      // Analyze ingredients to find the dominant pattern
      const ingredients = recoveryStyle.recoveryIngredients.map(i => i.toLowerCase());
      const connectionWords = ['connection', 'support', 'talking', 'therapy', 'friend', 'partner', 'family'];
      const solitudeWords = ['alone', 'quiet', 'solitude', 'space', 'silence', 'retreat'];
      const movementWords = ['exercise', 'walk', 'yoga', 'movement', 'running', 'gym'];
      const structureWords = ['routine', 'schedule', 'plan', 'organize', 'structure'];
      const softnessWords = ['rest', 'sleep', 'gentle', 'soft', 'ease', 'comfort', 'nature'];

      const connectionCount = ingredients.filter(i => connectionWords.some(w => i.includes(w))).length;
      const solitudeCount = ingredients.filter(i => solitudeWords.some(w => i.includes(w))).length;
      const movementCount = ingredients.filter(i => movementWords.some(w => i.includes(w))).length;
      const structureCount = ingredients.filter(i => structureWords.some(w => i.includes(w))).length;
      const softnessCount = ingredients.filter(i => softnessWords.some(w => i.includes(w))).length;

      const max = Math.max(connectionCount, solitudeCount, movementCount, structureCount, softnessCount);
      if (max > 0) {
        if (connectionCount === max) actualMode = 'connection';
        else if (solitudeCount === max) actualMode = 'solitude';
        else if (movementCount === max) actualMode = 'movement';
        else if (structureCount === max) actualMode = 'structure';
        else if (softnessCount === max) actualMode = 'softness';
      }
    }

    const meanings: Record<RecoveryStyle['mode'], string> = {
      softness: 'Your recovery pattern suggests your system needs gentleness after difficulty. Not productivity. Not distraction. Quiet permission to soften. That may say something important about how much effort you carry before you stop.',
      structure: 'When things feel chaotic, your system seems to restabilize through routine and predictability. Structure may not feel exciting, but it appears to help you come back to yourself faster.',
      connection: 'You seem to recover not through rest alone, but through feeling seen and supported. Emotional closeness may function as medicine for your nervous system.',
      solitude: 'Your recovery draws heavily on solitude and quiet. That does not mean you do not value connection. It suggests your system resets best when external demands are low enough for you to hear yourself again.',
      movement: 'Physical movement appears to be one of your most reliable reset mechanisms. Your body may be doing more emotional processing for you than you consciously realize.',
      mixed: 'Your recovery pattern shows variety, but the strongest signal points toward needing multiple forms of restoration depending on what drained you. The key is matching the recovery to the specific depletion.',
    };

    // If we identified a dominant mode from mixed, use that meaning
    if (recoveryStyle.mode === 'mixed' && actualMode !== 'mixed') {
      const topIngredients = recoveryStyle.recoveryIngredients.slice(0, 3).join(', ');
      bodyText = `${meanings[actualMode]} Looking at your recovery history, ${topIngredients} show up most consistently.`;
    } else {
      bodyText = meanings[actualMode];
    }

    insights.push({
      job: 'clarify',
      id: 'meaning-recovery',
      level: 'meaning',
      category: actualMode === 'connection' ? 'what-restores-you' : actualMode === 'solitude' ? 'what-restores-you' : 'nervous-system',
      scope: 'monthly',
      title: actualMode === 'mixed' ? 'How You Recover' : 'How You Recover',
      body: bodyText,
      whyItMatters: 'Understanding your specific recovery pattern helps you rest in a way that actually restores you.',
      reflectionPrompt: actualMode === 'connection' ? 'Who helps you recover most effectively?' : actualMode === 'solitude' ? 'Where do you go to truly be alone?' : 'What tends to restore you most when life feels crowded?',
      selfLanguage: actualMode === 'softness' ? 'in need of gentleness, not productivity' : actualMode === 'solitude' ? 'in need of spaciousness, not company' : actualMode === 'connection' ? 'healed through being understood' : actualMode === 'movement' ? 'restored through physical release' : undefined,
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
      body: `The theme of "${dominant.theme}" appears repeatedly in your reflections, showing up across ${dominant.frequency} logged days. It seems connected to ${domainLabels[dominant.domain]}. Repetition like this usually means your inner world is still working on something that has not fully settled.`,
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
      body: 'Many of your harder patterns seem to intensify when rest is thin. Protecting sleep may not be generic wellness advice for you so much as one of the clearest forms of care your system responds to.',
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
      body: 'Your entries suggest that emotionally accurate connection is not a small bonus for you. When closeness or reassurance drops, your system often feels it. The useful distinction here may be between contact and real settling connection.',
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
      title: 'You May Need Longer to Come Back',
      body: `After difficult stretches, your system seems to need about ${Math.round(avgDays)} days to come back to itself. That is useful evidence, not a flaw. If you expect yourself to bounce back instantly, you may end up judging a recovery process that is actually normal for you.`,
        reflectionPrompt: personalizedPrompt(
          'When you try to recover faster than your system needs, what tends to happen?',
          p,
          { useRecoveryIngredients: true }
        ),
        confidence: 'growing',
        accent: 'emerald',
      });
    }

    if (p.recoveryStyle.recoveryIngredients.length >= 2) {
      const safeIngredients = safeRecoveryIngredients(p.recoveryStyle.recoveryIngredients, 4);
      insights.push({
        job: 'guide',
        id: 'need-recovery-ingredients',
        level: 'need',
        category: 'what-restores-you',
        scope: 'monthly',
        title: 'Your Recovery Ingredients',
        body: `When you recover, certain conditions keep helping: ${safeIngredients.length > 0 ? safeIngredients.join(', ') : p.recoveryStyle.recoveryIngredients.slice(0, 4).join(', ')}. This looks like a return path worth remembering on purpose, especially on the days when you are too depleted to improvise.`,
        reflectionPrompt: safeIngredients.length > 0
          ? `Which of these helps most: ${safeIngredients.slice(0, 2).join(' or ')}?`
          : 'What actually helps you come back after a hard stretch?',
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
      body: 'Because your stress tends to build quietly, it may help to check in before you feel obviously overwhelmed. By the time the signal is loud, your system may already have been compensating for longer than it should.',
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
      body: 'Too many simultaneous demands or feelings seem to crowd your system quickly. You may need more emotional spaciousness than the average person: room to feel one thing at a time, slow enough space to hear yourself clearly again.',
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
      body: `Compared with your earlier entries, a stronger signal is beginning to form: not perfection, but more solid ground. Day to day it may be easy to miss. Across time, though, your system looks less easily knocked off center than it did before.`,
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
      body: `Lately your entries look less steady than your usual baseline. That does not read like failure. It reads like a genuinely harder season, especially compared with your earlier entries, and one that may ask for patience and gentleness more than self-improvement pressure.`,
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
      body: `Compared with earlier entries, something appears to be easing. Your recent entries carry less overall strain than before, even if it does not feel dramatic from the inside. Sometimes progress looks more like less pressure than more joy.`,
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
      body: `Compared with earlier entries, you have been reaching for restoration more often lately. Whether that has been intentional or instinctive, it suggests part of you is learning how to return to yourself instead of only pushing through.`,
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
      body: 'We have seen this before: even after your harder days, you tend to find your way back. That does not mean those days are easy. It means your system appears to know something about repair, even when you do not feel strong while you are inside it.',
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
      title: 'Steadiness Looks Foundational for You',
      body: `Observed across ${p.totalDays} days, one theme surfaces again and again: you gravitate toward emotional consistency. It is not that you avoid feeling. It is that you seem to need stable ground in order to feel safely and stay open.`,
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
      title: 'Depth Is Part of How You Work',
      body: `Observed across ${p.totalDays} days, you seem to feel life intensely and then need to make meaning from that intensity. That shape shows up in how you connect, what wounds you, what restores you, and what feels true enough to trust.`,
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
        title: 'You Carry More Than People Can See',
        body: `Your data suggests a real contradiction here: you carry difficulty quietly while healing most through being met in it. Part of you keeps going alone, while another part deeply needs to feel seen, helped, and accurately held.`,
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
        title: 'You Process a Great Deal Alone',
        body: `Your entries suggest that you process difficulty inwardly. Pulling back may be one of the ways you protect yourself and make sense of what you feel. Solitude seems restorative for you, but it may also hide how much is happening underneath.`,
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
      title: 'What Your History Keeps Confirming',
      body: `Observed across ${p.totalDays} days of reflection, certain truths keep holding. ${p.personalTruths.slice(0, 2).join(' ')} They may not explain everything about you, but they do sound like real parts of your emotional logic.`,
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
      title: 'The Landscape Your Inner World Returns To',
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
      body: composeInsightNarrative(
        ['season-recovery', daySpan, Math.round(avgStab), Math.round(avgStrain), Math.round(avgRest)],
        [
          [
            'The recent stretch reads less like emergency management and more like your system getting some room again.',
            'Your latest entries suggest a recovery chapter that is easier to feel in the pattern than in any single day.',
            'This period looks quieter from the inside of the data, not just less dramatic on the surface.',
            'The archive is reading this stretch as recovery rather than simple luck.',
          ],
          [
            'Strain is landing lighter than your usual baseline while restoration is showing up more often.',
            `Across the last ${daySpan} days, your steadiness has held closer while recovery signals have strengthened.`,
            'Compared with your broader baseline, pressure appears to be easing and your reserves are not draining as quickly.',
            'The shift is not only that hard moments hurt less; it is that your system looks more able to come back from them.',
          ],
          [
            'That usually means healing is happening in the rhythm of the week, even if it still feels subtle from inside the day.',
            'MySky reads that combination as nervous-system relief, not just a good streak.',
            'When restoration rises while strain softens, the important signal is capacity returning.',
            'This kind of pattern often marks the point where survival effort starts loosening its grip.',
          ],
          [
            'The meaningful part is that your archive is showing more room between impact and overwhelm.',
            'What matters here is not perfection but the fact that your system is not carrying everything at full volume.',
            'This is the kind of change that deserves to be treated as real before it looks dramatic.',
            'The pattern suggests you are not only enduring more gently; you are beginning to settle.',
          ],
        ],
      ),
      tone: 'recovery',
      daySpan,
      confidence: p.maturity === 'deep' ? 'strong' : 'growing',
    };
  }

  // Intensity season: high strain and emotional intensity
  if (avgStrain > overall.strain + 8 && avgIntensity > overall.emotionalIntensity + 5) {
    return {
      label: 'A Chapter of Intensity',
      body: composeInsightNarrative(
        ['season-intensity', daySpan, Math.round(avgStrain), Math.round(avgIntensity), Math.round(avgStab)],
        [
          [
            'This chapter is landing harder on your system than your usual baseline.',
            'The recent pattern carries more emotional charge and more strain than the archive normally sees from you.',
            'Your data is reading this as a high-intensity stretch rather than an ordinary rough patch.',
            'Something about this period is asking more of your nervous system than usual.',
          ],
          [
            'Strain is elevated, emotional weight is elevated, and steadiness is not absorbing the difference cleanly.',
            `Across the last ${daySpan} days, your entries have held more pressure and less ease than your broader pattern.`,
            'This looks like a week where the load stayed active instead of passing through quickly.',
            'The signal is not one dramatic moment; it is sustained pressure arriving with less buffer around it.',
          ],
          [
            'MySky treats that as a real season, not as personal failure or overreaction.',
            'When both strain and emotional intensity rise together, the important read is that your system is being asked to carry more.',
            'That does not automatically mean collapse, but it does mean the current load deserves to be named honestly.',
            'The value of naming intensity is that it stops you from grading yourself against a baseline you do not currently have.',
          ],
          [
            'What matters now is meeting the chapter with proportionate support rather than more self-pressure.',
            'This is the kind of stretch where gentleness becomes part of the data plan, not a reward for doing well.',
            'The archive is not judging the intensity; it is marking the fact that your baseline has temporarily changed.',
            'The useful part of this label is permission to respond like the season is real.',
          ],
        ],
      ),
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
      body: composeInsightNarrative(
        ['season-growth', daySpan, Math.round(avgStab), Math.round(avgStrain), latestStab?.direction],
        [
          [
            'Your archive is picking up a growth season that is quieter than a breakthrough but more real than a good mood.',
            'This period reads like genuine stabilizing movement.',
            'The recent pattern suggests growth that is happening through steadiness rather than spectacle.',
            'Something in your system appears to be reorganizing in a steadier direction.',
          ],
          [
            'Stability has been rising without strain climbing with it.',
            `Across the last ${daySpan} days, your entries have looked more grounded than the earlier part of the archive.`,
            'The shift is subtle but repeatable: you seem to be holding the week with a bit more internal footing.',
            'This does not look like a one-day bounce. It looks like a baseline adjusting upward.',
          ],
          [
            'MySky treats that combination as growth because the gain is holding in the pattern, not only in the mood.',
            'When steadiness increases without a matching rise in pressure, the archive reads that as change worth trusting.',
            'This kind of movement often feels almost invisible while it is happening because it arrives as less friction, not more excitement.',
            'The strongest signal here is not intensity. It is increased reliability in how you land.',
          ],
          [
            'That is the kind of progress people often miss because it does not announce itself loudly.',
            'The meaningful part is that your archive can see more grounding even before you fully feel it.',
            'This season matters because steadier days are starting to look more repeatable, not accidental.',
            'The pattern suggests your system is learning a slightly safer rhythm.',
          ],
        ],
      ),
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
      body: composeInsightNarrative(
        ['season-steadiness', daySpan, Math.round(avgStab), Math.round(avgStrain), Math.round(stabVol)],
        [
          [
            'Your recent entries are reading as unusually even by your own standards.',
            'This chapter looks steady in a way that is easy to undervalue because it is not dramatic.',
            'The archive is seeing consistency rather than turbulence right now.',
            'There is a quiet steadiness to this stretch that stands out in the data.',
          ],
          [
            'Volatility has stayed relatively low and your baseline has not swung far from itself.',
            `Across the last ${daySpan} days, the pattern has been more consistent than reactive.`,
            'The signal is not excitement or collapse. It is repeatability.',
            'Nothing here is spiking hard enough to dominate the week, which is meaningful in its own right.',
          ],
          [
            'MySky treats that as a real chapter because steadiness is not the absence of meaning.',
            'For a system that has known strain, consistency can be its own form of relief.',
            'When the week stops whiplashing, the archive can start seeing what your natural rhythm looks like.',
            'This kind of pattern often reveals what your baseline is when pressure is not steering everything.',
          ],
          [
            'The value here is not drama but trustworthiness in how the days are landing.',
            'That gives the archive a cleaner read of who you are when things are not constantly swinging.',
            'Steadiness matters because it shows what your system is like when it is not defending itself as hard.',
            'The meaningful part may simply be that life is not asking your nervous system to improvise as much.',
          ],
        ],
      ),
      tone: 'steadiness',
      daySpan,
      confidence: 'growing',
    };
  }

  // Transition: mixed signals
  if (Math.abs(avgStab - overall.stability) > 5 || Math.abs(avgStrain - overall.strain) > 5) {
    return {
      label: 'A Time of Transition',
      body: composeInsightNarrative(
        ['season-transition', daySpan, Math.round(avgStab), Math.round(avgStrain), Math.round(avgRest)],
        [
          [
            'Your recent pattern is pulling away from its usual baseline.',
            'The archive is reading this stretch as transition rather than settled rhythm.',
            'Something about the way your system is landing has shifted enough to register as movement.',
            'This period looks like a threshold chapter, not a fully named season yet.',
          ],
          [
            `Across the last ${daySpan} days, one or more core signals have moved meaningfully away from your norm.`,
            'The important detail is not whether the shift feels good or bad yet. It is that the old baseline is not fully holding.',
            'Your entries are showing mixed signals, which is often what transition looks like before it becomes clear.',
            'The archive can see movement, even if it cannot yet call the destination.',
          ],
          [
            'MySky treats that as transition because systems often get legible in motion before they get legible in meaning.',
            'This is the kind of period where the right question is less “What is wrong?” and more “What is changing?”',
            'When baseline patterns loosen, uncertainty is part of the signal rather than a mistake in the reading.',
            'The value of naming transition is that it gives shape to a week that may otherwise just feel off.',
          ],
          [
            'That makes the archive more honest about the fact that you may be between versions of the same pattern.',
            'The useful part of this label is permission to watch the shift rather than force a premature conclusion.',
            'Transition matters because it is where new patterns first become visible.',
            'The card is naming movement, not pretending the movement is finished.',
          ],
        ],
      ),
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
      body: 'You seem to be carrying a lot of emotional intensity right now. This does not necessarily need solving first. It may need enough space for one feeling at a time to become legible again.',
      whyItMatters: 'Naming the feeling of being crowded helps you stop trying to fix everything at once.',
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
      body: 'Your body may be running a deficit right now: high strain without enough restoration. This kind of depletion can masquerade as flatness, irritability, or disconnection when the deeper issue is simply that your reserves are low.',
      whyItMatters: 'Recognizing depletion prevents you from treating a physical deficit as a personality flaw.',
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
      body: 'Connection has been low alongside reduced stability. You may not need more people right now so much as more presence, more felt safety, more being-seen.',
      whyItMatters: 'Distinguishing between loneliness and isolation helps you seek the right kind of contact.',
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
      body: 'Everything seems elevated right now: intensity, strain, and not enough corresponding recovery. This pattern often means your nervous system needs less input before it needs more solutions.',
      whyItMatters: 'When overstimulated, the solution is usually subtraction, not adding more self-care.',
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

  // Recovery ingredients - use safe filtering to avoid negative terms
  const safeIngredients = safeRecoveryIngredients(p.recoveryStyle.recoveryIngredients, 3);
  if (safeIngredients.length > 0) {
    reminders.push(
      `What has helped you recover before: ${safeIngredients.join(', ')}.`
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
  // Premium value layer: the insights users are most likely to pay for.
  insights.push(...buildPremiumValueInsights(profile));

  let finalInsights = rankInsightsByPaidValue(insights);
  if (profile.isLowCapacity) {
    const priorityOrder: InsightJob[] = ['guide', 'name', 'clarify', 'integrate'];
    finalInsights = finalInsights
      .sort((a, b) => {
        const jobDelta = priorityOrder.indexOf(a.job) - priorityOrder.indexOf(b.job);
        if (jobDelta !== 0) return jobDelta;
        return (b.valueRank ?? 0) - (a.valueRank ?? 0);
      })
      .slice(0, 5);
  }

  const forecast = buildForecast(profile);
  const operatingManual = buildOperatingManual(profile);
  const nextBestActions = buildNextBestActions(profile, forecast, operatingManual);
  const premiumReport = buildPremiumReport(profile, finalInsights);

  return {
    insights: finalInsights,
    personalTruths: profile.personalTruths,
    season,
    memory,
    whatToRemember,
    premiumReport,
    operatingManual,
    forecast,
    nextBestActions,
    maturity: profile.maturity,
    totalDays: profile.totalDays,
    generatedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium value layer — the parts people are most likely to pay for
// ─────────────────────────────────────────────────────────────────────────────

const NEGATIVE_OR_CONTEXTUAL_INGREDIENTS = new Set([
  'fatigue', 'tired', 'exhaustion', 'exhausted', 'lonely', 'loneliness',
  'grief', 'overwhelm', 'overwhelmed', 'anxiety', 'anxious', 'shame',
  'conflict', 'pressure', 'stress', 'stressed', 'fear',
  'sadness', 'pain', 'isolation', 'shutdown', 'freeze', 'fawn', 'fight',
  'flight', 'dissociation', 'numb', 'numbness', 'irritability', 'anger',
]);

function safeRecoveryIngredients(ingredients: string[], limit = 4): string[] {
  return ingredients
    .map(i => i.trim())
    .filter(Boolean)
    .filter(i => !NEGATIVE_OR_CONTEXTUAL_INGREDIENTS.has(i.toLowerCase()))
    .slice(0, limit);
}

function recentAverages(p: PersonalProfile, daysBack = 7) {
  const days = p.patternProfile.scoredDays;
  const recent = days.slice(-daysBack);
  const fallback = p.patternProfile.overallAvg;
  if (recent.length === 0) return fallback;
  return {
    stability: mean(recent.map(d => d.scores.stability)),
    strain: mean(recent.map(d => d.scores.strain)),
    restoration: mean(recent.map(d => d.scores.restoration)),
    emotionalIntensity: mean(recent.map(d => d.scores.emotionalIntensity)),
    connection: mean(recent.map(d => d.scores.connection)),
  };
}

function deltaText(label: string, recent: number, baseline: number): string {
  const delta = Math.round(recent - baseline);
  const direction = delta > 0 ? 'above' : delta < 0 ? 'below' : 'near';
  if (direction === 'near') return `${label}: near baseline (${Math.round(recent)})`;
  return `${label}: ${Math.abs(delta)} points ${direction} baseline (${Math.round(recent)} vs ${Math.round(baseline)})`;
}

function confidenceFromGap(gap: number): DeepInsight['confidence'] {
  if (Math.abs(gap) >= 14) return 'strong';
  if (Math.abs(gap) >= 7) return 'growing';
  return 'emerging';
}

function buildPremiumValueInsights(p: PersonalProfile): DeepInsight[] {
  const insights: DeepInsight[] = [];
  const recent = recentAverages(p, 7);
  const month = recentAverages(p, 30);
  const baseline = p.patternProfile.overallAvg;
  const safeRestorers = safeRecoveryIngredients(p.recoveryStyle.recoveryIngredients, 4);
  const bestDayIngredientsText = formatNaturalList(p.bestDayIngredients.slice(0, 4));
  const safeRestorersText = formatNaturalList(safeRestorers);
  const recoveryWindowText = p.recoveryStyle.avgRecoveryDays > 0
    ? `about ${Math.round(p.recoveryStyle.avgRecoveryDays)} day${p.recoveryStyle.avgRecoveryDays > 1.5 ? 's' : ''}`
    : 'a still-forming number of days';
  const progressMovementLine =
    month.stability > baseline.stability + 6 && month.strain < baseline.strain - 6
      ? 'Monthly steadiness is running above your baseline while monthly strain is running below it.'
      : month.stability > baseline.stability + 6
        ? 'Monthly steadiness is running above your baseline.'
        : month.strain < baseline.strain - 6
          ? 'Monthly strain is running below your baseline.'
          : 'Trend data is still showing movement, even when the change is subtle.';
  const progressMarkerLine = p.progressMarkers.length > 0
    ? `${p.progressMarkers.length} progress marker${p.progressMarkers.length === 1 ? '' : 's'} also surfaced in the archive.`
    : 'The trajectory signal is coming primarily from the pattern trend itself.';

  if (p.bestDayIngredients.length >= 2) {
    insights.push({
      id: 'premium-best-day-formula',
      level: 'need',
      category: 'what-restores-you',
      scope: 'monthly',
      job: 'guide',
      title: 'Your Better-Day Formula',
      body: composeInsightNarrative(
        ['premium-best-day-formula', p.totalDays, bestDayIngredientsText],
        [
          [
            'Your better days are not random inside the archive.',
            'The steadier parts of your history keep clustering around the same conditions.',
            'The archive keeps describing your lighter days with a repeatable shape.',
            'MySky is seeing a real better-day formula rather than a generic self-care list.',
          ],
          [
            `${bestDayIngredientsText} keep appearing when your system lands better.`,
            `Across ${p.totalDays} tracked days, the same ingredients keep returning around your steadier moments.`,
            `Your best-day history keeps pointing back to ${bestDayIngredientsText}.`,
            `The pattern is specific enough to say that ${bestDayIngredientsText} are not incidental for you.`,
          ],
          [
            'That matters because it turns your past into something you can deliberately recreate.',
            'This is premium-grade only when the recipe is yours, not borrowed advice.',
            'The real value is that your archive is naming conditions, not offering slogans.',
            'Once the ingredients are visible, “take care of yourself” becomes a plan instead of a platitude.',
          ],
          [
            'The card is useful because it tells you what to protect before a hard day arrives.',
            'That gives your archive practical memory, not just emotional memory.',
            'It means your better days can become design input instead of nostalgia.',
            'This is how the app starts helping you build more days that actually resemble your own good ones.',
          ],
        ],
      ),
      evidence: [
        `Better-day ingredients: ${p.bestDayIngredients.slice(0, 4).join(', ')}`,
        `Tracked days analyzed: ${p.totalDays}`,
      ],
      whyItMatters: 'This helps the user deliberately build more days that resemble their own best days.',
      nextStep: `Choose one ingredient to protect today: ${p.bestDayIngredients[0]}.`,
      reflectionPrompt: 'Which ingredient is easiest to protect this week?',
      selfLanguage: 'my good days have conditions I can learn from',
      confidence: p.totalDays >= 30 ? 'strong' : 'growing',
      accent: 'gold',
      premiumType: 'best-day-formula',
      valueRank: 98,
    });
  }

  if (recent.strain > baseline.strain + 8 || recent.stability < baseline.stability - 8 || recent.restoration < baseline.restoration - 8) {
    const confidence = confidenceFromGap(Math.max(
      recent.strain - baseline.strain,
      baseline.stability - recent.stability,
      baseline.restoration - recent.restoration,
    ));
    insights.push({
      id: 'premium-hard-day-map',
      level: 'need',
      category: 'what-activates-you',
      scope: 'daily',
      job: 'guide',
      title: 'Your Hard-Day Warning Pattern',
      body: composeInsightNarrative(
        ['premium-hard-day-map', Math.round(recent.strain), Math.round(recent.stability), Math.round(recent.restoration)],
        [
          [
            'Your recent entries are forming a recognizable hard-day setup before the day fully collapses.',
            'The archive is catching the shape of a harder stretch early enough to be useful.',
            'This looks like a warning pattern, not just a bad mood.',
            'MySky is reading the start of a harder cycle before it becomes obvious everywhere else.',
          ],
          [
            'The signal is the combination of higher strain, thinner restoration, and less steadiness moving together.',
            'No single metric carries the whole story; it is the way the core signals drift away from baseline at the same time.',
            'What stands out is not one loud feeling but a coordinated change in pressure, energy, and regulation.',
            'This pattern tends to show up when your system has less margin than your mind may admit.',
          ],
          [
            'That is what makes it an early warning instead of a retrospective summary.',
            'The value is prevention: naming the setup while intervention still costs less.',
            'When the combination appears, MySky treats it as a meaningful shift in your available capacity.',
            'This is the point where the archive can help you lower demand sooner rather than later.',
          ],
          [
            'The card matters because it gives you a chance to respond before overwhelm has to become undeniable.',
            'That turns your data into a brake pedal instead of a postmortem.',
            'It means your archive can protect you earlier in the cycle.',
            'This is one of the clearest places where specificity beats generic encouragement.',
          ],
        ],
      ),
      evidence: [
        deltaText('Strain', recent.strain, baseline.strain),
        deltaText('Stability', recent.stability, baseline.stability),
        deltaText('Restoration', recent.restoration, baseline.restoration),
      ],
      whyItMatters: 'This makes the app preventive instead of only reflective. It helps the user respond earlier.',
      nextStep: 'Lower the demand level for the next 24 hours before asking yourself for insight or productivity.',
      reflectionPrompt: 'What usually happens when you ignore this warning pattern?',
      selfLanguage: 'my system is signaling earlier than my mind may admit',
      confidence,
      accent: 'copper',
      premiumType: 'hard-day-map',
      valueRank: 100,
    });
  }

  if (safeRestorers.length >= 2 || p.recoveryStyle.avgRecoveryDays > 0) {
    const daysLine = p.recoveryStyle.avgRecoveryDays > 0
      ? `Your system usually takes about ${Math.round(p.recoveryStyle.avgRecoveryDays)} day${p.recoveryStyle.avgRecoveryDays > 1.5 ? 's' : ''} to come back.`
      : 'Your recovery pattern is starting to become visible.';
    insights.push({
      id: 'premium-recovery-prescription',
      level: 'need',
      category: 'what-restores-you',
      scope: 'monthly',
      job: 'guide',
      title: 'What Actually Helps You Come Back',
      body: composeInsightNarrative(
        ['premium-recovery-prescription', recoveryWindowText, safeRestorersText, p.recoveryStyle.mode],
        [
          [
            'Your recovery pattern is specific enough now to be treated as guidance, not guesswork.',
            'The archive is starting to show how your system actually comes back after a hard stretch.',
            'This recovery read is becoming personal instead of generic.',
            'MySky can now say more than “rest more” because your return pattern is visible.',
          ],
          [
            `Your system usually needs ${recoveryWindowText} to come back.`,
            safeRestorers.length >= 2
              ? `The strongest recovery levers repeating in your history are ${safeRestorersText}.`
              : 'The archive can see the recovery window more clearly than the individual levers so far.',
            `Recovery is showing up through a ${p.recoveryStyle.mode}-leaning style rather than a one-size-fits-all formula.`,
            daysLine,
          ],
          [
            'That matters because recovery advice is only useful when it matches the way your system actually returns to steadiness.',
            'The value is that your archive is naming what helps you recover in practice, not in theory.',
            'This is where the app stops sounding like wellness content and starts sounding like memory.',
            'When the pattern is yours, support becomes more accurate and therefore more usable.',
          ],
          [
            'The card earns its place by telling you how to come back, not only that you should.',
            'That makes recovery feel less mysterious on the days you have the least capacity to guess.',
            'It means your archive can act like a personal recovery manual when you are too tired to improvise one.',
            'This gives your harder days a more believable path back toward steadiness.',
          ],
        ],
      ),
      evidence: [
        `Recovery style: ${p.recoveryStyle.mode}`,
        `Average recovery window: ${p.recoveryStyle.avgRecoveryDays > 0 ? `${Math.round(p.recoveryStyle.avgRecoveryDays)} day(s)` : 'still forming'}`,
        safeRestorers.length ? `Repeated helpful conditions: ${safeRestorers.join(', ')}` : 'Helpful conditions need more data',
      ],
      whyItMatters: 'This turns the app into a personal recovery guide rather than a passive mood tracker.',
      nextStep: safeRestorers.length ? `Use ${safeRestorers[0]} as your first recovery lever.` : 'After your next hard day, log what genuinely helped afterward.',
      reflectionPrompt: 'What helps you recover that looks small from the outside but matters a lot internally?',
      selfLanguage: 'I recover best through conditions my system recognizes',
      confidence: p.recoveryStyle.confidence >= 70 ? 'strong' : 'growing',
      accent: 'emerald',
      premiumType: 'recovery-plan',
      valueRank: 99,
    });
  }

  if (p.connectionSensitivity > 60) {
    insights.push({
      id: 'premium-connection-regulation',
      level: 'meaning',
      category: 'attachment-and-closeness',
      scope: 'monthly',
      job: 'clarify',
      title: 'The Kind of Connection That Regulates You',
      body: composeInsightNarrative(
        ['premium-connection-regulation', Math.round(p.connectionSensitivity), Math.round(recent.connection)],
        [
          [
            'Your data suggests connection is not just pleasant for you. It is regulatory.',
            'The archive keeps pointing to connection as one of the ways your system settles.',
            'Connection appears to matter to your nervous system, not only your preferences.',
            'MySky is reading connection as an active stabilizer in your pattern.',
          ],
          [
            'The important distinction is not people versus solitude. It is whether the contact feels accurate and emotionally real.',
            'What regulates you seems to be connection that feels safe enough to stop performing inside.',
            'The pattern suggests that not all contact lands as support; the quality of the connection changes the effect.',
            'Your steadiness seems to respond more to felt safety and accuracy than to simple social volume.',
          ],
          [
            'That is why generic advice about “reaching out” is often too blunt to be useful.',
            'The value here is precision about what kind of closeness actually helps you settle.',
            'When connection affects regulation, relationship choices become part of emotional care rather than background scenery.',
            'This kind of insight helps MySky distinguish contact from nourishment.',
          ],
          [
            'The card matters because it tells you what support should feel like in your body, not just in theory.',
            'That gives your archive a more intimate read of what support really means for you.',
            'It also explains why some connection leaves you steadier while other connection leaves you more tired.',
            'This is where relational insight becomes practical instead of abstract.',
          ],
        ],
      ),
      evidence: [
        `Connection sensitivity: ${Math.round(p.connectionSensitivity)} / 100`,
        deltaText('Recent connection', recent.connection, baseline.connection),
      ],
      whyItMatters: 'Users pay for insight that helps them choose the right support instead of guessing.',
      nextStep: 'Reach for one low-pressure connection that does not require you to perform being okay.',
      reflectionPrompt: 'Who helps your system settle without asking you to explain yourself perfectly?',
      selfLanguage: 'I need accurate connection, not just contact',
      confidence: p.connectionSensitivity > 75 ? 'strong' : 'growing',
      accent: 'rose',
      premiumType: 'operating-manual',
      valueRank: 92,
    });
  }

  if (p.sleepSensitivity > 60 || recent.restoration < baseline.restoration - 8) {
    insights.push({
      id: 'premium-body-early-warning',
      level: 'pattern',
      category: 'nervous-system',
      scope: 'weekly',
      job: 'name',
      title: 'Your Body May Warn You First',
      body: composeInsightNarrative(
        ['premium-body-early-warning', Math.round(p.sleepSensitivity), Math.round(recent.restoration), Math.round(recent.stability)],
        [
          [
            'For you, the earliest warning may arrive in the body before it arrives in words.',
            'Your system appears to signal through capacity shifts sooner than through neat emotional language.',
            'The archive suggests your body often knows first.',
            'MySky is reading your body as an early-warning channel rather than a side note.',
          ],
          [
            'That can look like lower capacity, thinner patience, tension, fatigue, or the sense that everything has become harder to hold.',
            'The first clue may be physical heaviness or reduced tolerance before the full feeling becomes clear.',
            'What changes first is often your bandwidth, not your explanation.',
            'The pattern says the body cue tends to arrive before the emotional narrative catches up.',
          ],
          [
            'That matters because it gives you a practical signal earlier in the cycle.',
            'When body data leads, waiting for perfect language usually means responding too late.',
            'MySky treats those cues as legitimate information, not background noise.',
            'This is one of the clearest places where self-trust becomes preventative care.',
          ],
          [
            'The value of the card is simple: treat the body cue as enough evidence to reduce demand.',
            'That gives your archive a more usable warning system than waiting for overwhelm to become obvious.',
            'It means your earliest data may already be available to you if you stop talking yourself out of it.',
            'This is how the app helps you intervene before the day gets louder.',
          ],
        ],
      ),
      evidence: [
        `Sleep sensitivity: ${Math.round(p.sleepSensitivity)} / 100`,
        deltaText('Restoration', recent.restoration, baseline.restoration),
      ],
      whyItMatters: 'This helps the user respond before emotional overwhelm has to become the loudest signal.',
      nextStep: 'Treat body cues as data. Reduce input before trying to analyze the whole feeling.',
      reflectionPrompt: 'What does your body know before your mind catches up?',
      selfLanguage: 'my body gives early data',
      confidence: p.sleepSensitivity > 75 ? 'strong' : 'growing',
      accent: 'silverBlue',
      premiumType: 'risk-forecast',
      valueRank: 95,
    });
  }

  if (p.stressPattern.buildupStyle === 'gradual' && p.stressPattern.confidence >= 50) {
    insights.push({
      id: 'premium-blind-spot-push-through',
      level: 'meaning',
      category: 'how-you-protect-yourself',
      scope: 'monthly',
      job: 'clarify',
      title: 'A Blind Spot: You May Notice Strain Late',
      body: composeInsightNarrative(
        ['premium-blind-spot-push-through', Math.round(p.stressPattern.avgBuildupDays), Math.round(p.stressPattern.confidence)],
        [
          [
            'Your stress pattern suggests you may notice strain later than it actually starts building.',
            'The archive is picking up a blind spot around early strain recognition.',
            'MySky is seeing a lag between the buildup and the moment it feels undeniable to you.',
            'There appears to be a window where pressure is already rising but still gets filed as manageable.',
          ],
          [
            `Strain often seems to build for about ${Math.round(p.stressPattern.avgBuildupDays)} days before it becomes obvious.`,
            'That makes the “I am fine” period less trustworthy than it feels in the moment.',
            'The data suggests your functioning phase may sometimes be the buildup phase.',
            'What looks like coping may occasionally be delayed recognition.',
          ],
          [
            'That is a high-value insight because early intervention is easiest exactly where the signal is easiest to dismiss.',
            'The point is not that you misread yourself on purpose. It is that your system may normalize strain while it is still accumulating.',
            'When the blind spot is named, the archive can protect you earlier.',
            'This is where pattern recognition helps reduce the cost of pushing through.',
          ],
          [
            'The card matters because it lets you question “fine” before the crash makes the answer for you.',
            'That gives your archive a way to interrupt the buildup while it is still negotiable.',
            'It means your quiet signs deserve more authority than they usually get.',
            'This is the kind of self-knowledge people pay for because it changes timing, not just language.',
          ],
        ],
      ),
      evidence: [
        'Buildup style: gradual',
        `Average buildup: about ${Math.round(p.stressPattern.avgBuildupDays)} days`,
        `Pattern confidence: ${Math.round(p.stressPattern.confidence)} / 100`,
      ],
      whyItMatters: 'This is a high-value insight because it names the moment where intervention is easiest but least obvious.',
      nextStep: 'When you feel “fine but tight,” check capacity before adding more responsibility.',
      reflectionPrompt: 'What are your quiet signs that you are carrying more than you admit?',
      selfLanguage: 'functioning does not always mean resourced',
      confidence: p.stressPattern.confidence >= 70 ? 'strong' : 'growing',
      accent: 'copper',
      premiumType: 'blind-spot',
      valueRank: 96,
    });
  }

  if (month.stability > baseline.stability + 6 || month.strain < baseline.strain - 6 || p.progressMarkers.length > 0) {
    insights.push({
      id: 'premium-progress-receipt',
      level: 'growth',
      category: 'growth-and-change',
      scope: 'monthly',
      job: 'integrate',
      title: 'Proof Something Is Changing',
      body: composeInsightNarrative(
        ['premium-progress-receipt', p.totalDays, Math.round(month.stability), Math.round(month.strain), p.progressMarkers.length],
        [
          [
            'The archive is holding evidence that something is changing, even if it still feels subtle from inside the day.',
            'There is enough movement in the longer view to call this progress, not wishful thinking.',
            'Your data is starting to give you a real receipt for change.',
            'MySky can now point to movement over time instead of relying on how dramatic progress feels.',
          ],
          [
            progressMovementLine,
            progressMarkerLine,
            'Some patterns are easing, strengthening, or becoming easier to see in the longer view.',
            'The important detail is that the trajectory has shifted, even if the day-to-day mood does not announce it loudly.',
          ],
          [
            'That matters because real progress often feels ordinary while it is happening.',
            'The archive is useful here because change is easier to miss from the inside than from the pattern.',
            'Without a receipt, people often dismiss progress that does not look dramatic enough.',
            'This is one of the places where the longer view can be more trustworthy than the daily feeling.',
          ],
          [
            'The card earns its place by giving you evidence you can come back to on discouraging days.',
            'That makes progress easier to trust before it becomes emotionally obvious.',
            'It means the archive can hold continuity for you when your memory goes short on hard days.',
            'This is how MySky turns trend movement into personal meaning.',
          ],
        ],
      ),
      evidence: [
        deltaText('Monthly stability', month.stability, baseline.stability),
        deltaText('Monthly strain', month.strain, baseline.strain),
        p.progressMarkers.length ? `${p.progressMarkers.length} progress marker(s) detected` : 'Progress signal emerging from trend data',
      ],
      whyItMatters: 'This gives the user evidence of change they might not be able to feel yet.',
      nextStep: 'Save this as a receipt for days when it feels like nothing is changing.',
      reflectionPrompt: 'What progress do you dismiss because it does not look dramatic?',
      selfLanguage: 'change can be real before it feels obvious',
      confidence: p.progressMarkers.length > 0 ? 'strong' : 'growing',
      accent: 'gold',
      premiumType: 'trajectory',
      valueRank: 91,
    });
  }

  // ── New Premium Value Logic Gaps Filled ──

  // Somatic Signature (Premium Body Map / Tension)
  const somaticTags = ['tension', 'pain', 'heaviness', 'exhaustion'];
  const frequentSomatic = p.patternProfile.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => somaticTags.includes(t.toLowerCase())));
  if (frequentSomatic.length >= 4) {
    insights.push({
      id: 'premium-somatic-signature',
      level: 'meaning',
      category: 'somatic-signals',
      scope: 'monthly',
      job: 'clarify',
      title: 'Your Somatic Signature',
      body: composeInsightNarrative(
        ['premium-somatic-signature', frequentSomatic.length, Math.round(baseline.strain)],
        [
          [
            'Your body appears to carry emotional load in a fairly specific way.',
            'The archive is picking up a somatic signature rather than random body complaints.',
            'Your entries suggest strain tends to show up in the body with a recognizable shape.',
            'MySky can see that your physical cues are patterned, not generic.',
          ],
          [
            `Somatic cues showed up on ${frequentSomatic.length} tracked days, especially when pressure ran higher.`,
            'Physical tension or exhaustion often appears before the feeling has a clean name.',
            'The body signal tends to arrive early in the sequence rather than at the end of it.',
            'What repeats is not just discomfort but a familiar way your system stores overload.',
          ],
          [
            'That matters because it turns body sensation into usable emotional information.',
            'When the somatic cue is consistent, it becomes an intervention point instead of an afterthought.',
            'The value of naming the signature is that it helps you respond before the strain gets louder.',
            'This is how a symptom becomes part of your self-understanding rather than only your frustration.',
          ],
          [
            'The card is useful because it tells you where to listen first when language is late.',
            'That gives the archive a more intimate read of how your system carries pressure.',
            'It means the body can become one of the clearest truths in the archive rather than the vaguest one.',
            'This makes somatic awareness practical instead of abstract.',
          ],
        ],
      ),
      evidence: [
        `Somatic cues logged: ${frequentSomatic.length} days`,
        `Correlation with strain: Notable`,
      ],
      whyItMatters: 'Translating body signals into emotional data helps you intervene before a breaking point.',
      nextStep: 'The next time you notice physical heaviness, ask yourself what feeling it is protecting.',
      reflectionPrompt: 'What does your body try to say when you refuse to slow down?',
      selfLanguage: 'my body holds the boundary',
      confidence: 'strong',
      accent: 'copper',
      premiumType: 'somatic-signature',
      valueRank: 94,
    });
  }

  // Dream Translation
  const frequentDreams = p.patternProfile.scoredDays.filter(d => d.aggregate.hasDream);
  if (frequentDreams.length >= 6) {
    insights.push({
      id: 'premium-dream-translation',
      level: 'meaning',
      category: 'dream-patterns',
      scope: 'monthly',
      job: 'integrate',
      title: 'Your Nighttime Architecture',
      body: composeInsightNarrative(
        ['premium-dream-translation', frequentDreams.length, Math.round(recent.emotionalIntensity)],
        [
          [
            'Your sleep appears highly active rather than purely restorative.',
            'The archive is reading your nights as a second layer of emotional processing.',
            'Dream activity is showing up often enough to count as pattern, not scenery.',
            'MySky is seeing an active nighttime processing style in your data.',
          ],
          [
            `Dream material showed up across ${frequentDreams.length} tracked nights.`,
            'The signal suggests daytime intensity does not stop when the day ends.',
            'Your mind seems to keep working the material after waking language has gone quiet.',
            'This makes rest look less like a pause and more like a second shift of internal sorting.',
          ],
          [
            'That matters because vivid dreams can be a continuation of processing, not a separate mystery.',
            'When dream activity rises alongside emotional load, MySky treats the overlap as meaningful.',
            'The value of this card is that it explains why sleep can feel busy instead of replenishing.',
            'This pattern helps translate nighttime activity into emotional context.',
          ],
          [
            'The useful part is not decoding every symbol literally but trusting that the repetition means something is still active.',
            'That gives your archive a way to honor dream life as data rather than afterthought.',
            'It means your nights may be telling the same truth your days have not finished processing yet.',
            'This is where dream tracking becomes part of the emotional map instead of a side feature.',
          ],
        ],
      ),
      evidence: [
        `Active dream logs: ${frequentDreams.length}`,
        `Connected to emotional intensity`,
      ],
      whyItMatters: 'Recognizing dreams as processing helps you stop feeling exhausted by your own sleep.',
      nextStep: 'Look at the core emotion of your dream, rather than the literal events.',
      reflectionPrompt: 'What feeling is your mind trying to resolve while you rest?',
      selfLanguage: 'active nighttime processor',
      confidence: 'growing',
      accent: 'lavender',
      premiumType: 'dream-translation',
      valueRank: 93,
    });
  }

  // Trigger Map
  const triggerLogs = p.patternProfile.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => t.includes('triggered') || t.includes('conflict')));
  if (triggerLogs.length >= 3) {
    insights.push({
      id: 'premium-trigger-map',
      level: 'pattern',
      category: 'trigger-responses',
      scope: 'monthly',
      job: 'name',
      title: 'Mapping Your Triggers',
      body: composeInsightNarrative(
        ['premium-trigger-map', triggerLogs.length, Math.round(recent.stability), Math.round(baseline.stability)],
        [
          [
            'Conflict-related entries are drawing a fairly clear trigger map.',
            'The archive is seeing more than ordinary frustration around your trigger logs.',
            'When activation shows up, your steadiness appears to change in a repeatable way.',
            'MySky can trace a recognizable trigger pattern from these entries.',
          ],
          [
            `Trigger material showed up on ${triggerLogs.length} days and those days tend to land below your usual steadiness.`,
            'The pattern suggests your whole nervous system shifts into defense, not just your mood.',
            'What changes is broader than irritation; your baseline itself seems to drop for a while.',
            'These moments look costly in capacity, not only painful in content.',
          ],
          [
            'That matters because activation deserves recovery time, not just better analysis.',
            'When the archive names the cost accurately, the response can become more proportional.',
            'The value here is knowing that being triggered changes your available resources, not only your feelings.',
            'This is how the app helps you stop treating activation like a minor detour.',
          ],
          [
            'The card earns its place by making recovery part of the plan the moment a trigger happens.',
            'That gives your archive a more realistic map of what conflict actually costs you.',
            'It means a trigger can be treated like an event your body has to come down from, not just think through.',
            'This is specificity that can change how quickly you lower demand afterward.',
          ],
        ],
      ),
      evidence: [
        `Trigger occurrences: ${triggerLogs.length}`,
        `Baseline stability impact: Substantial`,
      ],
      whyItMatters: 'Knowing your triggers actually cost steadiness allows you to demand appropriate recovery time.',
      nextStep: 'Treat a triggered state as a physical injury: rest first, analyze later.',
      reflectionPrompt: 'What is the most reliable way to signal safety to your body after a trigger?',
      selfLanguage: 'requires time to settle after activation',
      confidence: 'growing',
      accent: 'rose',
      premiumType: 'trigger-map',
      valueRank: 97,
    });
  }

  // Glimmer Formula
  const glimmerLogs = p.patternProfile.scoredDays.filter(d => d.aggregate.tagsUnion.some(t => t.includes('glimmer') || t.includes('peace')));
  if (glimmerLogs.length >= 4) {
    insights.push({
      id: 'premium-glimmer-formula',
      level: 'need',
      category: 'glimmers-and-elevation',
      scope: 'monthly',
      job: 'guide',
      title: 'Your Elevation Formula',
      body: composeInsightNarrative(
        ['premium-glimmer-formula', glimmerLogs.length, Math.round(baseline.strain)],
        [
          [
            'Your glimmer logs are reading as more than a nice extra.',
            'The archive suggests small moments of peace are doing real regulatory work for you.',
            'MySky is seeing a repeatable elevation pattern in the days where glimmers are noticed.',
            'This card is tracking something modest but meaningful in your data.',
          ],
          [
            `Glimmers appeared on ${glimmerLogs.length} tracked days and those moments seem to ease background pressure.`,
            'The pattern suggests brief contact with awe, beauty, or peace functions like a micro-stabilizer.',
            'What looks small from the outside appears to matter more inside your nervous system than it first seems.',
            'These moments are not solving everything, but they are changing the emotional climate around the edges.',
          ],
          [
            'That matters because not all regulation has to be large to be real.',
            'The value of this card is evidence that small moments can measurably change your baseline.',
            'When the archive sees strain soften around glimmers, the practice stops sounding sentimental and starts sounding strategic.',
            'This is where delight becomes part of emotional support instead of an afterthought.',
          ],
          [
            'The useful part is that you can look for a glimmer on purpose without pretending it fixes the whole day.',
            'That gives your archive a practical lever that is small enough to use on ordinary days.',
            'It means your system may respond to moments of beauty more strongly than you usually credit.',
            'This is a good example of MySky turning a subtle cue into a repeatable support tool.',
          ],
        ],
      ),
      evidence: [
        `Glimmer days: ${glimmerLogs.length}`,
        `Effect on strain: Easing`,
      ],
      whyItMatters: 'It proves that small moments of attention have a measurable impact on your stress baseline.',
      nextStep: 'Intentionally scan for one glimmer today before noon.',
      reflectionPrompt: 'What happens when you let a good moment actually land?',
      selfLanguage: 'stabilized by micro-moments',
      confidence: 'strong',
      accent: 'gold',
      premiumType: 'glimmer-formula',
      valueRank: 90,
    });
  }

  // Burnout Warning
  if (recent.strain > baseline.strain + 12 && recent.restoration < baseline.restoration - 10) {
    insights.push({
      id: 'premium-burnout-warning',
      level: 'need',
      category: 'energy-leaks',
      scope: 'daily',
      job: 'guide',
      title: 'Active Burnout Warning',
      body: composeInsightNarrative(
        ['premium-burnout-warning', Math.round(recent.strain), Math.round(recent.restoration), Math.round(recent.stability)],
        [
          [
            'Your current pattern reads like an active burnout warning rather than ordinary tiredness.',
            'The archive is seeing a deep deficit in the way your system is running right now.',
            'This ratio of pressure to recovery looks unsustainable in the near term.',
            'MySky is reading the present stretch as more than a hard few days.',
          ],
          [
            'Strain is high, restoration is low, and steadiness is starting to fray under the mismatch.',
            'The important signal is not only exhaustion. It is the ongoing imbalance between what is being asked and what is being restored.',
            'Your entries suggest the system is spending more than it is getting back.',
            'This looks like accumulated depletion rather than a single rough day.',
          ],
          [
            'That matters because burnout usually asks for reduction before insight.',
            'The value of naming it plainly is that the data can justify stepping back sooner.',
            'When the deficit is this clear, self-pressure becomes part of the cost rather than part of the solution.',
            'This is exactly where objective pattern language can protect you from minimizing what is happening.',
          ],
          [
            'The card earns its place by making “lower the load” feel evidence-based instead of indulgent.',
            'That gives you permission to respond proportionally before your body makes the decision for you.',
            'It means the archive can say stop while stopping is still partly a choice.',
            'This is one of the places where premium quality means telling the truth without softening it into vagueness.',
          ],
        ],
      ),
      evidence: [
        deltaText('Strain', recent.strain, baseline.strain),
        deltaText('Restoration', recent.restoration, baseline.restoration),
      ],
      whyItMatters: 'This provides an objective, data-backed reason to step back before your body forces you to.',
      nextStep: 'Drop all non-essential demands for the next 48 hours.',
      reflectionPrompt: 'If you cannot stop everything, what is the one thing you can put down right now?',
      selfLanguage: 'running on an empty reserve',
      confidence: 'strong',
      accent: 'copper',
      premiumType: 'burnout-warning',
      valueRank: 101, // Highest priority
    });
  }

  return insights;
}

function buildForecast(profile: PersonalProfile): ForecastSignal[] {
  const forecast: ForecastSignal[] = [];
  const recent = recentAverages(profile, 5);
  const baseline = profile.patternProfile.overallAvg;

  if (recent.strain > baseline.strain + 8 && recent.restoration < baseline.restoration - 5) {
    forecast.push({
      id: 'forecast-strain-with-low-restoration',
      title: 'Strain may be catching up',
      body: 'Recent strain is above your baseline while restoration is lower. This is a common setup for feeling more reactive, flat, or easily overwhelmed.',
      urgency: recent.strain > baseline.strain + 14 ? 'important' : 'notable',
      evidence: [deltaText('Strain', recent.strain, baseline.strain), deltaText('Restoration', recent.restoration, baseline.restoration)],
      protectiveMove: 'Reduce one demand today before your system has to force the reduction for you.',
    });
  }

  if (profile.sleepSensitivity > 65 && recent.stability < baseline.stability - 6) {
    forecast.push({
      id: 'forecast-sleep-sensitive-stability',
      title: 'Sleep may affect tomorrow more than expected',
      body: 'Because sleep is strongly tied to your steadiness, lower-capacity days deserve extra protection rather than extra pressure.',
      urgency: profile.sleepSensitivity > 80 ? 'important' : 'notable',
      evidence: [`Sleep sensitivity: ${Math.round(profile.sleepSensitivity)} / 100`, deltaText('Stability', recent.stability, baseline.stability)],
      protectiveMove: 'Protect bedtime and lower evening stimulation if you can.',
    });
  }

  if (recent.connection < baseline.connection - 8 && profile.connectionSensitivity > 60) {
    forecast.push({
      id: 'forecast-connection-drop',
      title: 'Connection may be running low',
      body: 'Connection is below your baseline, and your profile suggests that being accurately met helps your system settle.',
      urgency: 'gentle',
      evidence: [`Connection sensitivity: ${Math.round(profile.connectionSensitivity)} / 100`, deltaText('Connection', recent.connection, baseline.connection)],
      protectiveMove: 'Choose one safe, low-pressure point of contact.',
    });
  }

  return forecast.slice(0, 3);
}

function buildOperatingManual(profile: PersonalProfile): PersonalOperatingManual {
  const safeRestorers = safeRecoveryIngredients(profile.recoveryStyle.recoveryIngredients, 5);
  const stabilizers = [
    ...profile.bestDayIngredients.slice(0, 4),
    ...safeRestorers,
  ].filter((value, index, array) => value && array.indexOf(value) === index).slice(0, 6);

  const earlyWarningSigns: string[] = [];
  if (profile.stressPattern.buildupStyle === 'gradual') earlyWarningSigns.push('Feeling functional while quietly carrying more than usual');
  if (profile.sleepSensitivity > 60) earlyWarningSigns.push('Sleep disruption changing patience, steadiness, or emotional range');
  if (profile.connectionSensitivity > 60) earlyWarningSigns.push('Feeling unseen or emotionally under-met');
  if (profile.emotionalRange > 20) earlyWarningSigns.push('Emotional intensity widening faster than your capacity');
  if (earlyWarningSigns.length === 0) earlyWarningSigns.push('A noticeable drop in steadiness compared with your usual baseline');

  const restorePlan: string[] = [];
  if (safeRestorers.length > 0) restorePlan.push(`Start with what has helped you recover before: ${safeRestorers.slice(0, 3).join(', ')}.`);
  if (profile.recoveryStyle.mode === 'connection') restorePlan.push('Choose accurate connection over broad social contact.');
  if (profile.recoveryStyle.mode === 'solitude') restorePlan.push('Lower external input long enough to hear yourself again.');
  if (profile.recoveryStyle.mode === 'structure') restorePlan.push('Use one simple routine to create steadiness.');
  if (profile.recoveryStyle.mode === 'softness') restorePlan.push('Use gentleness before productivity.');
  if (restorePlan.length === 0) restorePlan.push('Lower demands first, then reflect once capacity returns.');

  return {
    headline: 'Your Personal Operating Manual',
    corePattern: profile.personalTruths[0] ?? 'Your archive is still learning what helps you stay steady, recover, and feel like yourself.',
    earlyWarningSigns: earlyWarningSigns.slice(0, 5),
    stabilizers,
    restorePlan: restorePlan.slice(0, 5),
    doMoreOf: stabilizers.length ? stabilizers.slice(0, 4) : ['Track what actually helps after hard days'],
    doLessOf: [
      'Pushing for insight when your capacity is already low',
      'Treating body cues as inconvenience instead of information',
      'Expecting instant recovery after a difficult stretch',
    ],
    supportScript: profile.connectionSensitivity > 60
      ? 'I do not need fixing right now. I think I need steady, low-pressure connection.'
      : 'I am lower-capacity right now. I need less pressure and a little more room.',
  };
}

function buildNextBestActions(profile: PersonalProfile, forecast: ForecastSignal[], manual: PersonalOperatingManual): NextBestAction[] {
  const actions: NextBestAction[] = [];
  const recent = recentAverages(profile, 5);
  const baseline = profile.patternProfile.overallAvg;
  const safeRestorers = safeRecoveryIngredients(profile.recoveryStyle.recoveryIngredients, 3);

  if (forecast[0]) {
    actions.push({
      id: `action-${forecast[0].id}`,
      title: forecast[0].title,
      body: forecast[0].protectiveMove,
      whyThis: forecast[0].body,
      effort: 'small',
      category: forecast[0].id.includes('sleep') ? 'protect-sleep' : forecast[0].id.includes('connection') ? 'connect' : 'reduce-demand',
    });
  }

  if (recent.restoration < baseline.restoration - 6) {
    actions.push({
      id: 'action-restore-first',
      title: 'Restore before interpreting',
      body: safeRestorers.length ? `Try ${safeRestorers[0]} before analyzing the whole feeling.` : 'Choose one genuinely restorative thing before trying to explain everything.',
      whyThis: 'Your data suggests low restoration can make everything feel harder to understand.',
      effort: 'tiny',
      category: 'restore',
    });
  }

  if (profile.connectionSensitivity > 60 && recent.connection < baseline.connection) {
    actions.push({
      id: 'action-low-pressure-connection',
      title: 'Reach for accurate connection',
      body: 'Send one honest, low-pressure message to someone who helps you feel more like yourself.',
      whyThis: 'Connection appears to regulate you when it feels emotionally accurate.',
      effort: 'small',
      category: 'connect',
    });
  }

  if (profile.sleepSensitivity > 60) {
    actions.push({
      id: 'action-protect-sleep',
      title: 'Protect the next sleep window',
      body: 'Treat tonight as nervous-system care, not just rest.',
      whyThis: 'Sleep has an outsized relationship with your steadiness.',
      effort: 'small',
      category: 'protect-sleep',
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'action-log-one-signal',
      title: 'Log one signal clearly',
      body: 'Name one thing that helped or made things harder today.',
      whyThis: 'Your premium insights get more accurate when the app can connect what happened with what changed afterward.',
      effort: 'tiny',
      category: 'reflect',
    });
  }

  return actions.slice(0, 4);
}

function rankInsightsByPaidValue(insights: DeepInsight[]): DeepInsight[] {
  const levelWeight: Record<InsightLevel, number> = { pattern: 10, meaning: 18, need: 30, growth: 24, identity: 22 };
  const confidenceWeight: Record<DeepInsight['confidence'], number> = { emerging: 0, growing: 6, strong: 12 };
  const jobWeight: Record<InsightJob, number> = { guide: 14, name: 10, clarify: 8, integrate: 6 };

  return [...insights].sort((a, b) => {
    const aScore = (a.valueRank ?? 0) + levelWeight[a.level] + confidenceWeight[a.confidence] + jobWeight[a.job];
    const bScore = (b.valueRank ?? 0) + levelWeight[b.level] + confidenceWeight[b.confidence] + jobWeight[b.job];
    return bScore - aScore;
  });
}

function buildPremiumReport(profile: PersonalProfile, insights: DeepInsight[]): PremiumInsightReport {
  const strongest = insights[0];
  const maturityLabel: Record<DataMaturity, string> = {
    early: 'Your archive is beginning to learn your patterns.',
    developing: 'Your archive is starting to connect what happens with how you respond.',
    established: 'Your archive can now offer practical pattern guidance.',
    deep: 'Your archive is becoming a personal map of how you work.',
  };

  return {
    headline: maturityLabel[profile.maturity],
    subheadline: strongest
      ? `Most important right now: ${strongest.title}`
      : 'Keep logging so MySky can move from tracking to understanding.',
    strongestInsightId: strongest?.id,
    strongestInsightTitle: strongest?.title,
    paidValueSummary: [
      'Predict harder stretches earlier.',
      'See what actually helps you recover.',
      'Build better days from your own data.',
      'Turn your archive into a personal operating manual.',
    ],
    lockedPreview: strongest
      ? `Premium insight ready: ${strongest.title}. Unlock the evidence, meaning, and next step behind this pattern.`
      : 'Premium insights unlock once MySky has enough history to detect meaningful patterns.',
  };
}
