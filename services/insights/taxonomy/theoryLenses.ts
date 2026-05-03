import { INSIGHT_DOMAINS } from './insightDomains';

export type TheoryLens = string;

export const THEORY_LENSES: readonly TheoryLens[] = Array.from(
  new Set(INSIGHT_DOMAINS.flatMap(domain => domain.theoryLens)),
).sort();
