import { type DailyAggregate } from '../services/insights/types';
import type { CrossRefInsight } from './selfKnowledgeCrossRef';
import {
  dedupeExactInsights,
} from './insightDedupe';

export type PatternLibraryItem = {
  title: string;
  body: string;
  lens?: PatternLens;
  conceptFingerprint?: PatternConceptFingerprint;
  concept?: PatternConcept;
  fingerprint?: string;
  score?: number;
};

export type PatternLibrarySection = {
  title: string;
  items: PatternLibraryItem[];
};

export type PatternConcept =
  | 'core_synthesis'
  | 'body_awareness'
  | 'protective_behavior'
  | 'relational_dynamic'
  | 'processing_style'
  | 'emotional_theme'
  | 'recovery_pattern'
  | 'dream_archive_contrast'
  | 'values_pattern'
  | 'statistical_trend';

export type PatternLens =
  | 'core_pattern'
  | 'body_signals'
  | 'protective_patterns'
  | 'relational_patterns'
  | 'processing_style'
  | 'reflection_themes'
  | 'checkin_trends'
  | 'recovery_patterns'
  | 'dream_archive_contrast';

export type PatternConceptFingerprint = {
  coreMeaning: string;
  lens: PatternLens;
  emotionalFunction: string;
  oppositeNeed: string;
  relatedTerms: string[];
};

const CONCEPT_LABELS: Record<PatternConcept, string> = {
  core_synthesis: 'Core pattern',
  body_awareness: 'Body awareness',
  protective_behavior: 'Protective behavior',
  relational_dynamic: 'Relational dynamic',
  processing_style: 'Processing style',
  emotional_theme: 'Emotional theme',
  recovery_pattern: 'Recovery pattern',
  dream_archive_contrast: 'Dream/archive contrast',
  values_pattern: 'Values pattern',
  statistical_trend: 'Statistical trend',
};

const SECTION_ORDER: Record<string, number> = {
  'Core Pattern': 0,
  'Body Signals': 1,
  'Protective Pattern': 2,
  'Relational Pattern': 3,
  'How You Process': 4,
  'Recurring Theme': 5,
  'Check-in Trends': 6,
  'Recovery Pattern': 7,
  'Dream/Archive Contrast': 8,
  'Pattern Analysis': 9,
};

function stableVariantSeed(...parts: Array<string | undefined>): number {
  return parts
    .filter(Boolean)
    .join('|')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function chooseVariant(options: string[], seedSource: string): string {
  if (options.length === 0) return '';
  return options[stableVariantSeed(seedSource) % options.length];
}

function sectionTitleForSource(source: CrossRefInsight['source']) {
  switch (source) {
    case 'relationship':
      return 'Relational Pattern';
    case 'values':
      return 'Recurring Theme';
    case 'somatic':
      return 'Body Signals';
    case 'triggers':
      return 'Recovery Pattern';
    case 'reflection':
      return 'Recurring Theme';
    case 'archetype':
      return 'Protective Pattern';
    case 'cognitive':
      return 'How You Process';
    default:
      return 'Pattern Analysis';
  }
}

function sectionTitleForLens(lens: PatternLens | undefined): string {
  switch (lens) {
    case 'body_signals':
      return 'Body Signals';
    case 'protective_patterns':
      return 'Protective Pattern';
    case 'relational_patterns':
      return 'Relational Pattern';
    case 'processing_style':
      return 'How You Process';
    case 'reflection_themes':
      return 'Recurring Theme';
    case 'checkin_trends':
      return 'Check-in Trends';
    case 'recovery_patterns':
      return 'Recovery Pattern';
    case 'dream_archive_contrast':
      return 'Dream/Archive Contrast';
    default:
      return 'Pattern Analysis';
  }
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function sentenceCase(text: string): string {
  const cleaned = cleanText(text);
  if (!cleaned) return cleaned;
  return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
}

function normalizeConceptKey(value: string): string {
  return cleanText(value.toLowerCase())
    .replace(/["'`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function lensForConcept(concept: PatternConcept, fingerprint?: string): PatternLens {
  if (concept === 'core_synthesis') return 'core_pattern';
  if (concept === 'body_awareness') {
    return fingerprint === 'trend:dream-contrast' ? 'dream_archive_contrast' : 'body_signals';
  }
  if (concept === 'protective_behavior') return 'protective_patterns';
  if (concept === 'relational_dynamic') return 'relational_patterns';
  if (concept === 'processing_style') return 'processing_style';
  if (concept === 'emotional_theme' || concept === 'values_pattern') return 'reflection_themes';
  if (concept === 'recovery_pattern') return 'recovery_patterns';
  if (concept === 'dream_archive_contrast') return 'dream_archive_contrast';
  if (concept === 'statistical_trend') {
    return fingerprint === 'trend:dream-contrast' ? 'dream_archive_contrast' : 'checkin_trends';
  }
  return 'reflection_themes';
}

function defaultFingerprintForConcept(
  concept: PatternConcept,
  fingerprint: string,
  title: string,
): PatternConceptFingerprint {
  const lens = lensForConcept(concept, fingerprint);
  const normalizedTitle = cleanText(title.toLowerCase());
  const byLens: Record<PatternLens, Omit<PatternConceptFingerprint, 'lens'>> = {
    core_pattern: {
      coreMeaning: normalizedTitle || 'one pattern is organizing the screen',
      emotionalFunction: 'shows the main pattern and its opposing need',
      oppositeNeed: 'the need that gets quieter under pressure',
      relatedTerms: ['core', 'pattern', 'contrast'],
    },
    body_signals: {
      coreMeaning: normalizedTitle || 'the body registers pressure first',
      emotionalFunction: 'turns physical cues into early information',
      oppositeNeed: 'slowing down enough to listen',
      relatedTerms: ['body', 'physical', 'signal', 'pressure'],
    },
    protective_patterns: {
      coreMeaning: normalizedTitle || 'stress creates a familiar protective move',
      emotionalFunction: 'keeps the user functional under strain',
      oppositeNeed: 'rest, support, or less responsibility',
      relatedTerms: ['stress', 'pressure', 'effort', 'carry', 'protect'],
    },
    relational_patterns: {
      coreMeaning: normalizedTitle || 'connection changes when safety is uncertain',
      emotionalFunction: 'checks whether closeness is safe enough to relax into',
      oppositeNeed: 'trust, steadiness, or reliable support',
      relatedTerms: ['connection', 'closeness', 'trust', 'support'],
    },
    processing_style: {
      coreMeaning: normalizedTitle || 'sense-making comes before movement',
      emotionalFunction: 'uses understanding to regulate experience',
      oppositeNeed: 'permission to move before everything is fully clear',
      relatedTerms: ['clarity', 'language', 'meaning', 'understanding'],
    },
    reflection_themes: {
      coreMeaning: normalizedTitle || 'the same theme keeps returning in writing',
      emotionalFunction: 'orients attention toward unresolved material',
      oppositeNeed: 'closure, alignment, or integration',
      relatedTerms: ['reflection', 'writing', 'theme', 'values'],
    },
    checkin_trends: {
      coreMeaning: normalizedTitle || 'a state repeats enough to be baseline data',
      emotionalFunction: 'turns repeated logs into a stable read',
      oppositeNeed: 'using the pattern before it becomes obvious',
      relatedTerms: ['mood', 'stress', 'energy', 'baseline'],
    },
    recovery_patterns: {
      coreMeaning: normalizedTitle || 'recovery follows repeatable conditions',
      emotionalFunction: 'shows what helps the user return after hard days',
      oppositeNeed: 'protecting those conditions sooner',
      relatedTerms: ['recovery', 'return', 'restore', 'steady'],
    },
    dream_archive_contrast: {
      coreMeaning: normalizedTitle || 'the same material shows up across dreams and waking entries',
      emotionalFunction: 'shows a theme active across states of consciousness',
      oppositeNeed: 'space to process beyond conscious problem-solving',
      relatedTerms: ['dream', 'waking', 'sleep', 'contrast'],
    },
  };

  return {
    lens,
    ...byLens[lens],
  };
}

function sanitizeInsightLanguage(text: string): string {
  let sanitized = cleanText(text)
    .replace(/This does not read as [^.]+\. It reads as /gi, '')
    .replace(/That does not read as [^.]+\. It reads as /gi, '')
    .replace(/This is not [^.]+\. It is /gi, '')
    .replace(/This isn't [^.]+\. It's /gi, '')
    .replace(/That is not [^.]+\. It is /gi, '')
    .replace(/That isn't [^.]+\. It's /gi, '')
    .replace(/\bYour archive indicates that\b/gi, 'Your entries show that')
    .replace(/\bYour archive reveals that\b/gi, 'Your entries show that')
    .replace(/\bYour archive shows that\b/gi, 'Your entries show that')
    .replace(/\bYour archive keeps naming\b/gi, 'You keep naming')
    .replace(/\bYour archive keeps pointing to\b/gi, 'You keep returning to')
    .replace(/\bYour archive is beginning to show\b/gi, 'Your entries show')
    .replace(/\bYour archive is starting to show\b/gi, 'Your entries show')
    .replace(/\bYour archive is no longer showing\b/gi, 'Your entries no longer show')
    .replace(/\bThe archive is learning\b/gi, 'Your entries show')
    .replace(/\bThe archive is beginning to notice\b/gi, 'Your entries show')
    .replace(/\bThe archive is beginning to recognize\b/gi, 'Your entries show')
    .replace(/\bThe archive is beginning to show\b/gi, 'Your entries show')
    .replace(/\bThe archive is starting to sort\b/gi, 'You are starting to separate')
    .replace(/\bThe archive keeps finding\b/gi, 'You keep returning to')
    .replace(/\bThe archive keeps seeing\b/gi, 'You keep showing')
    .replace(/\bThe archive keeps catching\b/gi, 'You keep naming')
    .replace(/\bThe archive is picking up\b/gi, 'Your entries show')
    .replace(/\bThe archive is seeing\b/gi, 'Your entries show')
    .replace(/\bThe archive is reading\b/gi, 'This reads as')
    .replace(/\bThe archive can begin naming\b/gi, 'You can begin naming')
    .replace(/\bThe archive can start saying\b/gi, 'You can start seeing')
    .replace(/\bThe archive catches\b/gi, 'Your entries catch')
    .replace(/\bThe archive\b/gi, 'your entries')
    .replace(/\bMySky treats\b/gi, 'Treat')
    .replace(/\bMySky reads\b/gi, 'Read')
    .replace(/\bMySky can begin telling\b/gi, 'You can begin telling')
    .replace(/\bMySky can start mapping\b/gi, 'You can start mapping')
    .replace(/\bMySky can now compare\b/gi, 'You can now compare')
    .replace(/\bMySky should not guess\b/gi, 'Do not force a read')
    .replace(/\bMySky\b/gi, 'this read')
    .replace(/\bappears to be\b/gi, 'is')
    .replace(/\bappears as\b/gi, 'shows up as')
    .replace(/\bappears\b/gi, 'shows up')
    .replace(/\bappear\b/gi, 'show up')
    .replace(/\bappearing\b/gi, 'showing up')
    .replace(/\bseems to be\b/gi, 'is')
    .replace(/\bseems to\b/gi, 'tends to')
    .replace(/\bseems\b/gi, 'is')
    .replace(/\bsuggests that\b/gi, 'shows that')
    .replace(/\bsuggests\b/gi, 'shows')
    .replace(/\bmay be\b/gi, 'is')
    .replace(/\bmay not\b/gi, 'does not')
    .replace(/\bcould\b/gi, 'can')
    .replace(/\bdeep reverence for the architecture of the truth\b/gi, 'need for things to make sense before you move forward')
    .replace(/\barchitecture of the truth\b/gi, 'structure of what is true')
    .replace(/\binternal weather\b/gi, 'state')
    .replace(/\binner world is still asking for attention\b/gi, 'attention keeps returning')
    .replace(/\binner world is still working through\b/gi, 'you have not fully resolved')
    .replace(/\byour system has\b/gi, 'you have')
    .replace(/\byour system is\b/gi, 'you are')
    .replace(/\byour system feels\b/gi, 'you feel')
    .replace(/\byour system needs\b/gi, 'you need')
    .replace(/\byour system uses\b/gi, 'you use')
    .replace(/\byour system relies\b/gi, 'you rely')
    .replace(/\byour system responds\b/gi, 'you respond')
    .replace(/\byour system stores\b/gi, 'your body stores')
    .replace(/\byour system actually\b/gi, 'you actually');

  sanitized = sanitized
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  return sentenceCase(sanitized);
}

function addTemporalCue(body: string, concept: PatternConcept): string {
  const cleaned = sanitizeInsightLanguage(body);
  const lower = cleaned.toLowerCase();
  if (/\b(next time|tends to happen|shows up when|after|before)\b/.test(lower)) return cleaned;

  const cueByConcept: Partial<Record<PatternConcept, string>> = {
    body_awareness: 'You may notice it earlier next time: the body cue arrives before the story is fully clear.',
    protective_behavior: 'This tends to happen after pressure rises and rest starts to feel negotiable.',
    relational_dynamic: 'This shows up when closeness needs to feel safe before you can relax.',
    processing_style: 'This shows up when you need the situation to make sense before you can move forward.',
    emotional_theme: 'This returns when something has not fully resolved.',
    recovery_pattern: 'This becomes predictive when the same drain or support keeps changing your baseline.',
    values_pattern: 'This shows up when a choice asks you to trade comfort for integrity.',
  };

  const cue = cueByConcept[concept];
  return cue ? `${cleaned} ${cue}` : cleaned;
}

function isDeepInsight(insight: CrossRefInsight): boolean {
  return insight.id.startsWith('deep-');
}

function conceptForInsight(insight: CrossRefInsight): PatternConcept {
  const combined = `${insight.id} ${insight.title} ${insight.body} ${insight.premiumType ?? ''}`.toLowerCase();

  if (/\bdream\b/.test(combined) && /\b(waking|day|body|reflection|entry|entries|material)\b/.test(combined)) {
    return 'dream_archive_contrast';
  }
  if (/\b(relationship|relational|connection|closeness|attachment|intimacy|belonging)\b/.test(combined)) {
    return 'relational_dynamic';
  }
  if (/\b(archetype|protect|pressure|push-through|survival|coping|defense|boundary|trigger-impact|hard-day-map)\b/.test(combined)) {
    return 'protective_behavior';
  }
  if (/\b(cognitive|intelligence|processing|clarity|understanding|sense-making|journal-depth|language|logic)\b/.test(combined)) {
    return 'processing_style';
  }
  if (/\b(recovery|restore|restoration|glimmer|best-day|sleep|rest|baseline|resilience)\b/.test(combined)) {
    return 'recovery_pattern';
  }
  if (/\b(body|somatic|physical|stomach|gut|chest|throat|jaw)\b/.test(combined)) {
    return 'body_awareness';
  }
  if (/\b(value|integrity|alignment)\b/.test(combined)) {
    return 'values_pattern';
  }
  return 'emotional_theme';
}

function fingerprintForInsight(insight: CrossRefInsight, concept = conceptForInsight(insight)): string {
  if (concept === 'statistical_trend') return `trend:${normalizeConceptKey(insight.id)}`;
  return concept;
}

function scoreInsight(insight: CrossRefInsight): number {
  const concept = conceptForInsight(insight);
  const conceptWeight: Record<PatternConcept, number> = {
    core_synthesis: 90,
    protective_behavior: 80,
    relational_dynamic: 76,
    body_awareness: 72,
    processing_style: 66,
    recovery_pattern: 64,
    dream_archive_contrast: 62,
    emotional_theme: 58,
    values_pattern: 54,
    statistical_trend: 48,
  };

  return (
    conceptWeight[concept]
    + (insight.isConfirmed ? 24 : 0)
    + Math.min(20, (insight.valueRank ?? 0) / 5)
    + Math.min(10, (insight.heroMetrics?.length ?? 0) * 2)
    + (isDeepInsight(insight) ? 6 : 0)
  );
}

function scoreLibraryItem(item: PatternLibraryItem): number {
  const concept = item.concept ?? 'emotional_theme';
  const conceptWeight: Record<PatternConcept, number> = {
    core_synthesis: 90,
    protective_behavior: 80,
    relational_dynamic: 76,
    body_awareness: 72,
    processing_style: 66,
    recovery_pattern: 64,
    dream_archive_contrast: 62,
    emotional_theme: 58,
    values_pattern: 54,
    statistical_trend: 50,
  };

  return item.score ?? conceptWeight[concept];
}

export function selectDistinctPatternInsights(insights: CrossRefInsight[], limit = 8): CrossRefInsight[] {
  const exactInsights = dedupeExactInsights(insights, 'selectDistinctPatternInsights:input');
  const bestByFingerprint = new Map<string, { insight: CrossRefInsight; index: number; score: number }>();

  exactInsights.forEach((insight, index) => {
    const concept = conceptForInsight(insight);
    const fingerprint = fingerprintForInsight(insight, concept);
    const score = scoreInsight(insight);
    const existing = bestByFingerprint.get(fingerprint);
    if (!existing || score > existing.score) {
      bestByFingerprint.set(fingerprint, { insight, index, score });
    }
  });

  return [...bestByFingerprint.values()]
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ insight }) => refineCrossRefCopy(insight))
    .slice(0, limit);
}

function reflectionThemeTitle(insight: CrossRefInsight, fallbackTitle: string): string {
  const themeMatch = cleanText(insight.body).match(/\btheme of ([^.]+)\./i);
  if (!themeMatch) return fallbackTitle;

  return `You keep returning to questions of ${readableLabel(themeMatch[1].trim()).toLowerCase()}`;
}

function composeVariant(groups: string[][], seedSource: string): string {
  const seed = stableVariantSeed(seedSource);
  return cleanText(
    groups
      .map((options, index) => options[(seed + index * 17) % options.length] ?? '')
      .join(' ')
  );
}

function soundsBroken(text: string): boolean {
  const normalized = cleanText(text).toLowerCase();

  return (
    normalized.length < 20 ||
    /[a-z]+(?:-[a-z]+){3,}/.test(normalized) ||
    normalized.includes('-on-an-o') ||
    normalized.includes('-asks-me-to-tru') ||
    normalized.split(/\s+/).filter((token) => token.length < 3).length >
      Math.max(4, Math.floor(normalized.split(/\s+/).length * 0.35))
  );
}

function soundsTooGeneric(title: string, body: string): boolean {
  const combined = `${title} ${body}`.toLowerCase();

  const genericPhrases = [
    'your intelligence profile',
    'your cognitive style',
    'your dominant pattern',
    'you are healing',
    'you adapt to frameworks quickly',
    'linguistic and logical-mathematical',
    'reflection practice',
  ];

  return genericPhrases.some((phrase) => combined.includes(phrase));
}

function rewriteSourceTitle(insight: CrossRefInsight): string {
  switch (insight.source) {
    case 'values':
      return 'You keep returning to what matters';
    case 'somatic':
      return 'Your body registers before your mind catches up';
    case 'triggers':
      return insight.id.endsWith('-r')
        ? 'The same supports keep bringing you back'
        : 'The same conditions keep draining your baseline';
    case 'relationship':
      return 'You are highly sensitive to whether connection feels safe';
    case 'reflection':
      return reflectionThemeTitle(insight, 'You keep returning to the same theme');
    case 'archetype':
      return 'You have a reliable stress move';
    case 'cognitive':
      return 'You need things to make sense before you can move forward';
    default:
      return insight.title;
  }
}

function softenIdentityLanguage(text: string): string {
  return sanitizeInsightLanguage(
    text
      .replace(/\bYour intelligence profile is\b/gi, 'Your strongest sense-making route is')
      .replace(/\bYour cognitive style is\b/gi, 'You tend to')
      .replace(/\bYour dominant pattern is\b/gi, 'A recurring pattern is')
      .replace(/\bThe Caregiver Under Pressure\b/gi, 'Caregiving under pressure')
      .replace(/\bYou adapt to frameworks quickly and move decisively\b/gi, 'You move more quickly once something starts to make internal sense')
      .replace(/\bLinguistic and Logical-Mathematical\b/gi, 'language and structured sense-making')
      .replace(/\bshadow\b/gi, 'risk')
  );
}

function rewriteBodyForSource(insight: CrossRefInsight): string {
  const cleaned = cleanText(insight.body);
  const concept = conceptForInsight(insight);
  const withCue = (body: string) => addTemporalCue(body, concept);

  switch (insight.source) {
    case 'values':
      return withCue(softenIdentityLanguage(
        cleaned.replace(
          /^Your top values are/i,
          'Across your recent reflections, the same values keep shaping what feels livable'
        )
      ));

    case 'somatic':
      return withCue(softenIdentityLanguage(
        cleaned
          .replace(/^Back and spine tension keeps surfacing/i, 'Your back and spine keep carrying the signal')
          .replace(/\bThis usually means\b/gi, 'This points to')
      ));

    case 'triggers':
      return withCue(softenIdentityLanguage(
        cleaned
          .replace(/\bkeep helping\b/gi, 'keep showing up beside steadier days')
          .replace(/\bhelping you recover\b/gi, 'showing up around recovery')
          .replace(/\bThese are your recovery ingredients\b/gi, 'These are part of what helps you come back')
      ));

    case 'relationship':
      return withCue(softenIdentityLanguage(
        cleaned
          .replace(/\bYour relational mirror\b/gi, 'Your relationship history shows a repeatable pattern')
          .replace(/\bThis reveals\b/gi, 'This shows')
      ));

    case 'reflection':
      return withCue(softenIdentityLanguage(
        cleaned
          .replace(/\bReflection practice\b/gi, 'Your reflections are specific enough to read')
          .replace(/\bThis shows\b/gi, 'This shows')
      ));

    case 'archetype':
      return withCue(softenIdentityLanguage(
        cleaned
          .replace(/\bYour archetype\b/gi, 'Your protective pattern')
      ));

    case 'cognitive':
      return withCue(softenIdentityLanguage(
        cleaned
          .replace(/\bThis means\b/gi, 'This means')
      ));

    default:
      return withCue(softenIdentityLanguage(cleaned));
  }
}

function fallbackBodyForSource(insight: CrossRefInsight): string {
  const seed = `${insight.id}:${insight.title}:${insight.body}`;
  const concept = conceptForInsight(insight);
  const body = (() => {
    switch (insight.source) {
      case 'values':
        return composeVariant([
          [
            'Your reflections keep returning to the same standards for what feels honest, livable, and clean.',
            'The repeated value signal is not decorative; it is shaping your choices before you fully explain them.',
          ],
          [
            'That matters because values show up first as friction: the place where comfort starts costing too much.',
            'The contrast is clear: part of you wants ease, and another part will not trade away integrity to get it.',
          ],
        ], seed);
      case 'somatic':
        return composeVariant([
          [
            'The body signal is no longer occasional.',
            'The same physical area keeps carrying pressure before the feeling has clean language.',
          ],
          [
            'That gives you an earlier intervention point than waiting until overwhelm becomes obvious.',
            'The contrast is useful: your mind may still be explaining, while your body is already reporting.',
          ],
        ], seed);
      case 'triggers':
        return composeVariant([
          [
            'Your harder moments are gathering around repeatable conditions, and your steadier moments are doing the same.',
            'That split is the useful data: you can tell the difference between what drains you and what helps you come back.',
          ],
          [
            'This becomes predictive when the same input keeps changing your baseline.',
            'The contrast is practical: one condition costs you capacity, while another gives it back.',
          ],
        ], seed);
      case 'relationship':
        return composeVariant([
          [
            'Your relationship entries are pointing to the conditions that make closeness feel safe enough to relax into.',
            'The repeated issue is not contact itself; it is whether contact settles you or makes you manage the room.',
          ],
          [
            'That distinction matters because some connection regulates you and some connection becomes labor.',
            'The contrast is the insight: you can want closeness and still need clearer safety before your body believes it.',
          ],
        ], seed);
      case 'reflection':
        return composeVariant([
          [
            'The same theme keeps returning with different wording and similar weight.',
            'That means the topic is not finished for you yet; it is asking for a clearer form.',
          ],
          [
            'The repetition matters when it starts predicting where your attention goes after the day ends.',
            'The contrast is subtle: you may be done with the event, while the theme underneath it is still active.',
          ],
        ], seed);
      case 'archetype':
        return composeVariant([
          [
            'Under strain, you have a recognizable move: brace, manage, withdraw, push, or over-function.',
            'That move is protection, not personality branding.',
          ],
          [
            'The useful question is when it helps and when it starts costing you.',
            'The contrast is where the insight lives: the strategy that kept you safe can also keep you overextended.',
          ],
        ], seed);
      case 'cognitive':
        return composeVariant([
          [
            'Clarity has a sequence for you.',
            'You need the situation to make sense before your body fully lets you move forward.',
          ],
          [
            'That is why generic advice about deciding faster misses the point.',
            'The contrast is real: urgency may ask for action while your mind is still building the shape of what happened.',
          ],
        ], seed);
      default:
        return composeVariant([
          [
            'A repeatable pattern is showing up across recent entries.',
            'The important part is not the label; it is the fact that the same shape returns under different conditions.',
          ],
          [
            'That is enough to make the read useful without pretending the whole story is finished.',
            'The contrast is the signal: one part of the pattern repeats, while the surface details keep changing.',
          ],
        ], seed);
    }
  })();

  return addTemporalCue(body, concept);
}

function refineCrossRefTitleAndBody(insight: CrossRefInsight): PatternLibraryItem | null {
  const concept = conceptForInsight(insight);
  const fingerprint = fingerprintForInsight(insight, concept);
  const score = scoreInsight(insight);
  const lens = lensForConcept(concept, fingerprint);
  const conceptFingerprint = defaultFingerprintForConcept(concept, fingerprint, rewriteSourceTitle(insight));

  if (soundsBroken(insight.title) || soundsBroken(insight.body)) {
    return {
      title: rewriteSourceTitle(insight),
      body: fallbackBodyForSource(insight),
      lens,
      conceptFingerprint,
      concept,
      fingerprint,
      score,
    };
  }

  const rewrittenTitle = rewriteSourceTitle(insight);
  const rewrittenBody = rewriteBodyForSource(insight);

  if (soundsTooGeneric(rewrittenTitle, rewrittenBody)) {
    return {
      title: rewriteSourceTitle(insight),
      body: fallbackBodyForSource(insight),
      lens,
      conceptFingerprint,
      concept,
      fingerprint,
      score,
    };
  }

  return {
    title: rewrittenTitle,
    body: rewrittenBody,
    lens,
    conceptFingerprint,
    concept,
    fingerprint,
    score,
  };
}

function buildCheckInTrendItems(dailyAggregates: DailyAggregate[]): PatternLibraryItem[] {
  const tagCounts = new Map<string, number>();
  const keywordCounts = new Map<string, number>();
  let dreamDays = 0;
  let highStressDays = 0;

  for (const day of dailyAggregates) {
    if (day.hasDream) dreamDays += 1;
    if (day.stressAvg >= 6) highStressDays += 1;

    for (const tag of day.tagsUnion) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }

    for (const keyword of day.keywordsUnion) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) ?? 0) + 1);
    }
  }

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const topKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count >= 2)
    .slice(0, 2);

  const aggregateItems: PatternLibraryItem[] = [];

  if (topTags.length > 0) {
    const [firstTag, secondTag] = topTags;
    const labels = topTags.map(([tag]) => readableLabel(tag));
    aggregateItems.push({
      title: 'These states are part of your baseline now',
      body: secondTag
        ? `${labels[0]} showed up ${firstTag[1]} times and ${labels[1]} showed up ${secondTag[1]} times across recent check-ins. That makes them part of the same emotional climate, not one-off moods.`
        : `${labels[0]} showed up ${firstTag[1]} times in recent check-ins. That is no longer occasional; it belongs in your baseline read.`,
      lens: 'checkin_trends',
      conceptFingerprint: {
        lens: 'checkin_trends',
        coreMeaning: `${labels.join(' and ').toLowerCase()} are part of the baseline`,
        emotionalFunction: 'turns repeated check-ins into usable baseline information',
        oppositeNeed: 'responding before the state becomes loud',
        relatedTerms: labels.map(label => label.toLowerCase()),
      },
      concept: 'statistical_trend',
      fingerprint: 'trend:state-baseline',
      score: 58 + firstTag[1] + (secondTag?.[1] ?? 0),
    });
  }

  if (topKeywords.length > 0) {
    const [firstKeyword, secondKeyword] = topKeywords;
    const labels = topKeywords.map(([keyword]) => readableLabel(keyword));
    aggregateItems.push({
      title: 'Your writing keeps returning to the same pressure points',
      body: secondKeyword
        ? `${labels[0]} and ${labels[1]} keep surfacing in your reflections. This is the theme layer: different entries, same unresolved territory.`
        : `${labels[0]} keeps surfacing in your reflections. The return pattern means this is still active, not fully settled.`,
      lens: 'reflection_themes',
      conceptFingerprint: {
        lens: 'reflection_themes',
        coreMeaning: `${labels.join(' and ').toLowerCase()} keep returning in writing`,
        emotionalFunction: 'keeps attention on material that has not fully resolved',
        oppositeNeed: 'clearer integration or closure',
        relatedTerms: labels.map(label => label.toLowerCase()),
      },
      concept: 'emotional_theme',
      fingerprint: `theme:${labels.map(label => normalizeConceptKey(label)).join('-')}`,
      score: 56 + firstKeyword[1] + (secondKeyword?.[1] ?? 0),
    });
  }

  if (dreamDays >= 3 || highStressDays >= 3) {
    aggregateItems.push({
      title: dreamDays >= 3 ? 'Your nights are part of the pattern' : 'High-stress days are frequent enough to predict from',
      body:
        dreamDays >= 3
          ? `${dreamDays} recent days included dream material. That is enough to compare what sleep is processing with how the next day lands.`
          : `${highStressDays} recent days landed in a higher-stress range. This is no longer a single hard day; it is a pressure pattern worth planning around.`,
      lens: dreamDays >= 3 ? 'dream_archive_contrast' : 'checkin_trends',
      conceptFingerprint: {
        lens: dreamDays >= 3 ? 'dream_archive_contrast' : 'checkin_trends',
        coreMeaning: dreamDays >= 3
          ? 'dream material and waking signals can be compared'
          : 'high-stress days are frequent enough to plan around',
        emotionalFunction: dreamDays >= 3
          ? 'shows the same material active across sleep and waking life'
          : 'turns repeated stress into an early planning signal',
        oppositeNeed: dreamDays >= 3
          ? 'space for deeper processing'
          : 'earlier pressure reduction',
        relatedTerms: dreamDays >= 3 ? ['dreams', 'sleep', 'waking', 'contrast'] : ['stress', 'pressure', 'baseline'],
      },
      concept: dreamDays >= 3 ? 'dream_archive_contrast' : 'statistical_trend',
      fingerprint: dreamDays >= 3 ? 'trend:dream-contrast' : 'trend:stress-contrast',
      score: 54 + Math.max(dreamDays, highStressDays),
    });
  }

  return aggregateItems;
}

type LibraryCandidate = {
  sectionTitle: string;
  item: PatternLibraryItem;
  score: number;
  originalIndex: number;
};

function dedupeLibraryCandidates(candidates: LibraryCandidate[]): LibraryCandidate[] {
  const bestByFingerprint = new Map<string, LibraryCandidate>();

  for (const candidate of candidates) {
    const fingerprint = candidate.item.fingerprint ?? normalizeConceptKey(candidate.item.title);
    const existing = bestByFingerprint.get(fingerprint);
    if (!existing || candidate.score > existing.score) {
      bestByFingerprint.set(fingerprint, candidate);
    }
  }

  return [...bestByFingerprint.values()]
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);
}

function dedupeExactLibraryCandidates(candidates: LibraryCandidate[], where: string): LibraryCandidate[] {
  return dedupeExactInsights(
    candidates.map(candidate => ({
      ...candidate.item,
      candidate,
    })),
    where,
  ).map(item => item.candidate);
}

function groupCandidates(candidates: LibraryCandidate[]): PatternLibrarySection[] {
  return candidates
    .reduce<PatternLibrarySection[]>((sections, candidate) => {
      const existing = sections.find((section) => section.title === candidate.sectionTitle);
      if (existing) {
        existing.items.push(candidate.item);
      } else {
        sections.push({ title: candidate.sectionTitle, items: [candidate.item] });
      }
      return sections;
    }, [])
    .sort((a, b) => (SECTION_ORDER[a.title] ?? 99) - (SECTION_ORDER[b.title] ?? 99));
}

function buildCorePatternItem(candidates: LibraryCandidate[]): PatternLibraryItem | null {
  if (!candidates.length) return null;
  const concepts = new Set(candidates.map(candidate => candidate.item.concept));
  const has = (concept: PatternConcept) => concepts.has(concept);

  if (has('protective_behavior')) {
    return {
      title: 'You push forward under strain, even when part of you needs rest',
      body: [
        'When things get difficult, your instinct is to move toward effort. You try to stabilize, solve, or carry what is in front of you.',
        'This response has helped you stay functional when things feel uncertain.',
        'But it also means your need for rest can stay quiet until it becomes impossible to ignore.',
        'Next time pressure rises, notice whether effort is protecting you or covering a need for support.',
      ].join('\n\n'),
      lens: 'core_pattern',
      concept: 'core_synthesis',
      fingerprint: 'core:effort-under-strain',
      conceptFingerprint: {
        lens: 'core_pattern',
        coreMeaning: 'pushes through stress instead of resting',
        emotionalFunction: 'survival through effort',
        oppositeNeed: 'rest/support',
        relatedTerms: ['effort', 'pressure', 'responsibility', 'prove', 'carry'],
      },
      score: 100,
    };
  }

  if (has('relational_dynamic')) {
    return {
      title: 'You relax when connection feels safe enough to trust',
      body: [
        'Closeness changes your state quickly. When trust, repair, or support feels clear, you have more room to settle.',
        'When the signal is unclear, part of you starts tracking the relationship instead of resting inside it.',
        'That sensitivity protects you from ignoring important relational information, but it can also keep your body on watch.',
        'Next time your state shifts around someone, ask what changed: safety, clarity, tone, repair, or distance.',
      ].join('\n\n'),
      lens: 'core_pattern',
      concept: 'core_synthesis',
      fingerprint: 'core:relational-safety',
      conceptFingerprint: {
        lens: 'core_pattern',
        coreMeaning: 'checks whether connection is safe enough to relax into',
        emotionalFunction: 'protection through relational scanning',
        oppositeNeed: 'steady trust/support',
        relatedTerms: ['connection', 'trust', 'closeness', 'support', 'safety'],
      },
      score: 100,
    };
  }

  if (has('body_awareness') || has('dream_archive_contrast')) {
    return {
      title: 'Your body registers the pattern before your thoughts organize it',
      body: [
        'Physical signals are showing up early enough to matter. They give shape to pressure before the story is fully clear.',
        'That can make the experience confusing: one part of you is still thinking, while the body is already reporting.',
        'The useful move is not to explain the signal immediately. It is to notice where it lands and what tends to happen next.',
        'Next time the sensation starts, treat it as early information instead of waiting for the emotion to become obvious.',
      ].join('\n\n'),
      lens: 'core_pattern',
      concept: 'core_synthesis',
      fingerprint: 'core:body-first',
      conceptFingerprint: {
        lens: 'core_pattern',
        coreMeaning: 'the body signals before the mind has language',
        emotionalFunction: 'early warning through physical sensation',
        oppositeNeed: 'slower attention',
        relatedTerms: ['body', 'signal', 'sensation', 'pressure', 'early'],
      },
      score: 100,
    };
  }

  if (has('processing_style')) {
    return {
      title: 'You need things to make sense before you can move forward',
      body: [
        'Understanding is part of how you regulate. You return to language, reflection, and careful thinking to organize what you feel.',
        'This helps you move with accuracy instead of reacting from noise.',
        'The cost is that urgency can ask for action while your mind is still building the truth of what happened.',
        'Next time you feel stuck, ask whether you need more information or permission to move with partial clarity.',
      ].join('\n\n'),
      lens: 'core_pattern',
      concept: 'core_synthesis',
      fingerprint: 'core:sense-before-action',
      conceptFingerprint: {
        lens: 'core_pattern',
        coreMeaning: 'needs meaning before movement',
        emotionalFunction: 'regulation through understanding',
        oppositeNeed: 'permission to act before everything is resolved',
        relatedTerms: ['clarity', 'language', 'meaning', 'truth', 'movement'],
      },
      score: 100,
    };
  }

  if (has('emotional_theme') || has('values_pattern')) {
    return {
      title: 'You keep returning to what matters when things feel uncertain',
      body: [
        'The same questions keep coming back in your writing: what feels aligned, what feels off, and what you want to stand for.',
        'That return pattern helps you orient when the outside situation is unclear.',
        'The tension is that reflection can guide you, but it can also keep circling when a value wants to become a choice.',
        'Next time the theme returns, ask what it is trying to help you protect.',
      ].join('\n\n'),
      lens: 'core_pattern',
      concept: 'core_synthesis',
      fingerprint: 'core:returning-values',
      conceptFingerprint: {
        lens: 'core_pattern',
        coreMeaning: 'returns to values and unresolved themes under uncertainty',
        emotionalFunction: 'orientation through reflection',
        oppositeNeed: 'turning reflection into a clear choice',
        relatedTerms: ['values', 'reflection', 'alignment', 'theme', 'choice'],
      },
      score: 100,
    };
  }

  if (has('recovery_pattern')) {
    return {
      title: 'You come back through repeatable conditions, not force',
      body: [
        'Your steadier moments are not random. They gather around conditions that help your body and attention return.',
        'That matters because recovery is easier to protect when you know what actually brings you back.',
        'The contrast is clear: pushing harder can keep you moving, while the right conditions help you settle.',
        'Next time a hard day starts easing, notice what changed before you felt better.',
      ].join('\n\n'),
      lens: 'core_pattern',
      concept: 'core_synthesis',
      fingerprint: 'core:repeatable-recovery',
      conceptFingerprint: {
        lens: 'core_pattern',
        coreMeaning: 'returns through repeatable recovery conditions',
        emotionalFunction: 'stability through known supports',
        oppositeNeed: 'protecting recovery sooner',
        relatedTerms: ['recovery', 'restore', 'baseline', 'return', 'support'],
      },
      score: 100,
    };
  }

  const top = candidates[0].item;
  const label = top.concept ? CONCEPT_LABELS[top.concept].toLowerCase() : 'pattern';
  return {
    title: top.title,
    body: `${top.body}\n\nThis is the strongest ${label} in the current read. Notice where it shows up next; repetition is most useful when it becomes recognizable earlier.`,
    lens: 'core_pattern',
    concept: 'core_synthesis',
    fingerprint: `core:${top.fingerprint ?? normalizeConceptKey(top.title)}`,
    conceptFingerprint: {
      lens: 'core_pattern',
      coreMeaning: top.conceptFingerprint?.coreMeaning ?? top.title.toLowerCase(),
      emotionalFunction: top.conceptFingerprint?.emotionalFunction ?? 'names the strongest current pattern',
      oppositeNeed: top.conceptFingerprint?.oppositeNeed ?? 'noticing it sooner',
      relatedTerms: top.conceptFingerprint?.relatedTerms ?? [label],
    },
    score: 100,
  };
}

export function buildPatternLibraryState(
  dailyAggregates: DailyAggregate[],
  crossRefs: CrossRefInsight[] = [],
) {
  const entryCount = dailyAggregates.reduce((sum, day) => sum + day.checkInCount, 0);

  const refinedCrossRefs = selectDistinctPatternInsights(crossRefs);
  const realCandidates: LibraryCandidate[] = refinedCrossRefs
    .map((insight, index) => {
      const item = refineCrossRefTitleAndBody(insight);
      if (!item) return null;
      return {
        sectionTitle: sectionTitleForSource(insight.source),
        item,
        score: scoreLibraryItem(item),
        originalIndex: index,
      };
    })
    .filter((candidate): candidate is LibraryCandidate => !!candidate);

  const hasThreshold = entryCount >= 5 || realCandidates.length > 0;

  if (!hasThreshold) {
    return {
      statusLine: 'Not enough signal for a real pattern read',
      helperText:
        'Do not force a read yet. Add a few more check-ins, then layer in relationship reflections, trigger logs, somatic entries, or daily reflections so the pattern has enough evidence to be specific.',
      items: [] as PatternLibraryItem[],
      sections: [] as PatternLibrarySection[],
    };
  }

  const aggregateItems = buildCheckInTrendItems(dailyAggregates);
  const aggregateCandidates: LibraryCandidate[] = aggregateItems.map((item, index) => ({
    sectionTitle: sectionTitleForLens(item.lens),
    item,
    score: scoreLibraryItem(item),
    originalIndex: realCandidates.length + index,
  }));
  const exactDedupedCandidates = dedupeExactLibraryCandidates(
    [...realCandidates, ...aggregateCandidates],
    'PatternArchive:candidates',
  );
  const dedupedCandidates = dedupeLibraryCandidates(exactDedupedCandidates);
  const supportingPatternCandidates = dedupedCandidates
    .filter(candidate => candidate.item.lens !== 'checkin_trends' && candidate.item.lens !== 'dream_archive_contrast')
    .slice(0, 4);
  const trendCandidate = dedupedCandidates.find(candidate => candidate.item.lens === 'checkin_trends');
  const dreamContrastCandidate = dedupedCandidates.find(candidate => candidate.item.lens === 'dream_archive_contrast');
  const coreItem = supportingPatternCandidates.length > 0
    ? buildCorePatternItem(supportingPatternCandidates)
    : null;

  const coreSection: PatternLibrarySection[] = coreItem
    ? [{ title: 'Core Pattern', items: [coreItem] }]
    : [];
  const supportSections = groupCandidates(supportingPatternCandidates);
  const trendSection: PatternLibrarySection[] = trendCandidate
    ? [{ title: 'Check-in Trends', items: [trendCandidate.item] }]
    : [];
  const dreamSection: PatternLibrarySection[] = dreamContrastCandidate
    ? [{ title: 'Dream/Archive Contrast', items: [dreamContrastCandidate.item] }]
    : [];
  const items = dedupeExactInsights([
    ...(coreItem ? [coreItem] : []),
    ...supportingPatternCandidates.map(candidate => candidate.item),
    ...(trendCandidate ? [trendCandidate.item] : []),
    ...(dreamContrastCandidate ? [dreamContrastCandidate.item] : []),
  ], 'PatternArchive:items');
  const sections = [...coreSection, ...supportSections, ...trendSection, ...dreamSection];
  const hasAnalysisWithoutCrossRefs = entryCount >= 5 && realCandidates.length === 0;

  return {
    statusLine: hasAnalysisWithoutCrossRefs ? 'Check-in read is live' : 'Pattern read refreshed today',
    helperText:
      realCandidates.length > 0
        ? 'One core pattern sits first. Supporting sections only appear when they answer a different question.'
        : 'Your check-in trends are strong enough to read. Source-specific sections need more relational, somatic, trigger, or reflection evidence before the read should get more personal.',
    items,
    sections,
  };
}

export function readableLabel(value: string) {
  return value
    .replace(/^eq_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function refineCrossRefCopy(insight: CrossRefInsight): CrossRefInsight {
  const concept = conceptForInsight(insight);

  if (isDeepInsight(insight)) {
    return {
      ...insight,
      title: sanitizeInsightLanguage(insight.title),
      body: addTemporalCue(insight.body, concept),
      takeaway: insight.takeaway
        ? {
            ...insight.takeaway,
            body: sanitizeInsightLanguage(insight.takeaway.body),
          }
        : undefined,
    };
  }

  if (insight.source === 'values') {
    return {
      ...insight,
      title: rewriteSourceTitle(insight),
      body: rewriteBodyForSource(insight),
    };
  }

  if (insight.source === 'cognitive') {
    return {
      ...insight,
      title: rewriteSourceTitle(insight),
      body: rewriteBodyForSource(insight),
    };
  }

  if (insight.source === 'archetype') {
    return {
      ...insight,
      title: rewriteSourceTitle(insight),
      body: rewriteBodyForSource(insight),
    };
  }

  if (insight.source === 'reflection') {
    return {
      ...insight,
      title: sanitizeInsightLanguage(reflectionThemeTitle(insight, cleanText(insight.title))),
      body: rewriteBodyForSource(insight),
    };
  }

  return {
    ...insight,
    title: rewriteSourceTitle(insight),
    body: rewriteBodyForSource(insight),
  };
}
