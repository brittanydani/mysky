import {
  GENERATED_INSIGHT_DOMAINS,
  GENERATED_INSIGHT_PARAGRAPHS,
  GENERATED_INSIGHT_TAXONOMY,
  type GeneratedInsightDomain,
} from '../generated/generatedInsightParagraphs';
import type {
  InsightCandidateSurface,
  InsightCategory,
  PatternType,
} from '../types';

export interface InsightTaxonomyCategory {
  category: InsightCategory;
  majorDomain: string;
  domainName: string;
  subcategory: string;
  theoryLens: string[];
  anchors: string[];
  signalTypes: string[];
  patternTypes: PatternType[];
  patternTypeRules: Record<PatternType, string>;
  allowedSurfaces: InsightCandidateSurface[];
  blockedSurfaces: InsightCandidateSurface[];
  microMoments: Record<PatternType, string[]>;
  actions: Record<PatternType, string[]>;
  validationStyle: Record<PatternType, string[]>;
  landings: Record<PatternType, string[]>;
}

const DREAM_CATEGORY: InsightCategory = 'dreamsSymbols';
const PATTERN_TYPES: PatternType[] = [
  'highTracking',
  'lowAccess',
  'pushPull',
  'delayedActivation',
];
const NORMAL_INSIGHT_SURFACES: InsightCandidateSurface[] = [
  'today',
  'patterns',
  'weeklyDeepDive',
  'thisWeek',
];
const ALL_CANDIDATE_SURFACES: InsightCandidateSurface[] = [
  ...NORMAL_INSIGHT_SURFACES,
  'dreamInterpretation',
];

const DOMAIN_BY_KEY = new Map<string, GeneratedInsightDomain>(
  GENERATED_INSIGHT_DOMAINS.map(domain => [domain.key, domain]),
);

function patternTypeRulesForDomain(
  domain: GeneratedInsightDomain,
  subcategory: string,
): Record<PatternType, string> {
  const guidance = domain.subcategoryGuidance[subcategory]?.patternTypes;
  return {
    highTracking: guidance?.highTracking ?? '',
    lowAccess: guidance?.lowAccess ?? '',
    pushPull: guidance?.pushPull ?? '',
    delayedActivation: guidance?.delayedActivation ?? '',
  };
}

function copyPatternTypeBank(
  values: Readonly<Record<PatternType, readonly string[]>>,
): Record<PatternType, string[]> {
  return {
    highTracking: [...values.highTracking],
    lowAccess: [...values.lowAccess],
    pushPull: [...values.pushPull],
    delayedActivation: [...values.delayedActivation],
  };
}

function blockedSurfacesFor(
  allowedSurfaces: readonly InsightCandidateSurface[],
): InsightCandidateSurface[] {
  const allowed = new Set(allowedSurfaces);
  return ALL_CANDIDATE_SURFACES.filter(surface => !allowed.has(surface));
}

const DREAM_TAXONOMY_CATEGORY: InsightTaxonomyCategory = {
  category: DREAM_CATEGORY,
  majorDomain: 'dreamInterpretation',
  domainName: 'Dream Interpretation',
  subcategory: 'dreamOnly',
  theoryLens: ['dreamEngine'],
  anchors: ['dream', 'dream-symbol', 'dream-image', 'dream-atmosphere'],
  signalTypes: ['dream'],
  patternTypes: PATTERN_TYPES,
  patternTypeRules: {
    highTracking: 'Dream interpretation is handled by the separate dream engine.',
    lowAccess: 'Dream interpretation is handled by the separate dream engine.',
    pushPull: 'Dream interpretation is handled by the separate dream engine.',
    delayedActivation: 'Dream interpretation is handled by the separate dream engine.',
  },
  allowedSurfaces: ['dreamInterpretation'],
  blockedSurfaces: NORMAL_INSIGHT_SURFACES,
  microMoments: {
    highTracking: [],
    lowAccess: [],
    pushPull: [],
    delayedActivation: [],
  },
  actions: {
    highTracking: [],
    lowAccess: [],
    pushPull: [],
    delayedActivation: [],
  },
  validationStyle: {
    highTracking: [],
    lowAccess: [],
    pushPull: [],
    delayedActivation: [],
  },
  landings: {
    highTracking: [],
    lowAccess: [],
    pushPull: [],
    delayedActivation: [],
  },
};

const CATEGORY_TAXONOMY = new Map<InsightCategory, InsightTaxonomyCategory>();
const SUBCATEGORY_TAXONOMY = new Map<string, InsightTaxonomyCategory>();

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

for (const entry of GENERATED_INSIGHT_TAXONOMY) {
  const domain = DOMAIN_BY_KEY.get(entry.majorDomain);
  if (!domain) continue;

  const taxonomyEntry: InsightTaxonomyCategory = {
    category: entry.category,
    majorDomain: domain.key,
    domainName: domain.domainName,
    subcategory: entry.subcategory,
    theoryLens: [...domain.theoryLens],
    anchors: [...entry.anchors],
    signalTypes: [...entry.signalTypes],
    patternTypes: [...domain.patternTypes],
    patternTypeRules: patternTypeRulesForDomain(domain, entry.subcategory),
    allowedSurfaces: [...entry.allowedSurfaces],
    blockedSurfaces: blockedSurfacesFor(entry.allowedSurfaces),
    microMoments: copyPatternTypeBank(domain.microMoments),
    actions: copyPatternTypeBank(domain.actions),
    validationStyle: copyPatternTypeBank(domain.validationStyle),
    landings: copyPatternTypeBank(domain.landings),
  };

  const subcategoryKey = `${entry.majorDomain}:${entry.subcategory}`;
  if (!SUBCATEGORY_TAXONOMY.has(subcategoryKey)) {
    SUBCATEGORY_TAXONOMY.set(subcategoryKey, taxonomyEntry);
  }
  if (entry.isLegacyDefault || !CATEGORY_TAXONOMY.has(entry.category)) {
    CATEGORY_TAXONOMY.set(entry.category, taxonomyEntry);
  }
}

for (const paragraph of GENERATED_INSIGHT_PARAGRAPHS) {
  if (paragraph.category === DREAM_CATEGORY) {
    continue;
  }

  const domain = DOMAIN_BY_KEY.get(paragraph.majorDomain);
  if (!domain) continue;

  const subcategoryKey = `${paragraph.majorDomain}:${paragraph.insightSubcategory}`;
  const existingTaxonomy = SUBCATEGORY_TAXONOMY.get(subcategoryKey);
  if (existingTaxonomy) {
    existingTaxonomy.anchors = unique([...existingTaxonomy.anchors, ...paragraph.anchors]);
    existingTaxonomy.signalTypes = unique([...existingTaxonomy.signalTypes, ...paragraph.signalTypes]);

    if (!CATEGORY_TAXONOMY.has(paragraph.category)) {
      CATEGORY_TAXONOMY.set(paragraph.category, {
        ...existingTaxonomy,
        category: paragraph.category,
        allowedSurfaces: unique([...existingTaxonomy.allowedSurfaces, ...paragraph.allowedSurfaces]) as InsightCandidateSurface[],
        blockedSurfaces: blockedSurfacesFor(unique([...existingTaxonomy.allowedSurfaces, ...paragraph.allowedSurfaces]) as InsightCandidateSurface[]),
      });
    }
    continue;
  }

  const taxonomyEntry: InsightTaxonomyCategory = {
    category: paragraph.category,
    majorDomain: domain.key,
    domainName: domain.domainName,
    subcategory: paragraph.insightSubcategory,
    theoryLens: [...domain.theoryLens],
    anchors: [...paragraph.anchors],
    signalTypes: [...paragraph.signalTypes],
    patternTypes: [...domain.patternTypes],
    patternTypeRules: patternTypeRulesForDomain(domain, paragraph.insightSubcategory),
    allowedSurfaces: [...paragraph.allowedSurfaces],
    blockedSurfaces: blockedSurfacesFor(paragraph.allowedSurfaces),
    microMoments: copyPatternTypeBank(domain.microMoments),
    actions: copyPatternTypeBank(domain.actions),
    validationStyle: copyPatternTypeBank(domain.validationStyle),
    landings: copyPatternTypeBank(domain.landings),
  };

  CATEGORY_TAXONOMY.set(paragraph.category, taxonomyEntry);
  SUBCATEGORY_TAXONOMY.set(subcategoryKey, taxonomyEntry);
}

export const INSIGHT_TAXONOMY_DOMAINS = GENERATED_INSIGHT_DOMAINS;

export const INSIGHT_TAXONOMY_CATEGORIES = Array.from(SUBCATEGORY_TAXONOMY.values());

export function insightTaxonomyDomainForKey(
  majorDomain: string,
): GeneratedInsightDomain | undefined {
  return DOMAIN_BY_KEY.get(majorDomain);
}

export function insightTaxonomyForCategory(
  category: InsightCategory,
): InsightTaxonomyCategory | undefined {
  if (category === DREAM_CATEGORY) return DREAM_TAXONOMY_CATEGORY;
  return CATEGORY_TAXONOMY.get(category);
}

export function insightTaxonomyForSubcategory(
  majorDomain: string,
  subcategory: string,
): InsightTaxonomyCategory | undefined {
  return SUBCATEGORY_TAXONOMY.get(`${majorDomain}:${subcategory}`);
}

export function insightTaxonomyEntriesForDomain(
  majorDomain: string,
): InsightTaxonomyCategory[] {
  return INSIGHT_TAXONOMY_CATEGORIES.filter(entry => entry.majorDomain === majorDomain);
}

export function isInsightCategoryAllowedOnCandidateSurface(
  category: InsightCategory,
  surface: InsightCandidateSurface,
): boolean {
  const taxonomy = insightTaxonomyForCategory(category);
  if (!taxonomy) return false;
  if (category === DREAM_CATEGORY) return surface === 'dreamInterpretation';
  if (surface === 'weeklyDeepDive' || surface === 'thisWeek') {
    return taxonomy.allowedSurfaces.some(allowedSurface =>
      allowedSurface === 'today' ||
      allowedSurface === 'patterns' ||
      allowedSurface === surface,
    );
  }
  if (taxonomy.blockedSurfaces.includes(surface)) return false;
  return taxonomy.allowedSurfaces.includes(surface);
}

export function allowedCandidateSurfacesForCategory(
  category: InsightCategory,
): InsightCandidateSurface[] {
  return insightTaxonomyForCategory(category)?.allowedSurfaces ?? [];
}

export function isDreamInsightCategory(category: InsightCategory): boolean {
  return category === DREAM_CATEGORY;
}
