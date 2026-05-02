import {
  GENERATED_INSIGHT_DOMAINS,
  GENERATED_INSIGHT_TAXONOMY,
  type GeneratedInsightDomain,
} from '../../insights/generatedInsightParagraphs';
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
}

const DREAM_CATEGORY: InsightCategory = 'dreamsSymbols';

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

const CATEGORY_TAXONOMY = new Map<InsightCategory, InsightTaxonomyCategory>();
const SUBCATEGORY_TAXONOMY = new Map<string, InsightTaxonomyCategory>();

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
  };

  SUBCATEGORY_TAXONOMY.set(`${entry.majorDomain}:${entry.subcategory}`, taxonomyEntry);
  if (entry.isLegacyDefault || !CATEGORY_TAXONOMY.has(entry.category)) {
    CATEGORY_TAXONOMY.set(entry.category, taxonomyEntry);
  }
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
