import { dedupeExactInsights } from './insightDedupe';

export type PatternLibraryItem = {
  title: string;
  body: string;
  lens?: PatternLens;
  conceptFingerprint?: PatternConceptFingerprint;
  concept?: PatternConcept;
  fingerprint?: string;
  score?: number;
  patternKey?: string;
  category?: string;
  confidence?: string;
  movement?: string;
  evidenceSummary?: string;
  sourceCoverage?: string[];
  lastSeenAt?: string;
  observedAcrossDays?: number;
  relatedSignals?: string[];
  shameLabel?: string;
  clarityReframe?: string;
  librarySectionTitle?: string;
  archiveSectionTitle?: string;
  isV2Derived?: boolean;
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
  'Emotional Weather': 9,
  'Rest & Capacity': 10,
  Relationships: 11,
  'Responsibility & Care': 12,
  'Boundaries & Self-Trust': 13,
  'Self-Worth & Receiving': 14,
  'Dreams & Symbols': 15,
  'Safety & Regulation': 16,
  'Growth Edges': 17,
  'What Helps': 18,
  'Pattern Analysis': 19,
};

const LIBRARY_SECTION_ORDER: Record<string, number> = {
  'Emotional Weather': 0,
  'Rest & Capacity': 1,
  'Body Signals': 2,
  Relationships: 3,
  'Responsibility & Care': 4,
  'Boundaries & Self-Trust': 5,
  'Self-Worth & Receiving': 6,
  'Dreams & Symbols': 7,
  'Safety & Regulation': 8,
  'Growth Edges': 9,
  'What Helps': 10,
};

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeConceptKey(value: string): string {
  return cleanText(value.toLowerCase())
    .replace(/["'`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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

type LibraryCandidate = {
  sectionTitle: string;
  item: PatternLibraryItem;
  score: number;
  originalIndex: number;
};

function dedupeLibraryCandidates(candidates: LibraryCandidate[]): LibraryCandidate[] {
  const bestByKey = new Map<string, LibraryCandidate>();

  for (const candidate of candidates) {
    const fingerprint = candidate.item.fingerprint ?? normalizeConceptKey(candidate.item.title);
    const normalizedTitle = normalizeConceptKey(candidate.item.title);
    const lens = candidate.item.lens ?? sectionTitleForLens(candidate.item.lens);
    const patternKey = candidate.item.patternKey;
    const category = candidate.item.category;
    const keys = [
      patternKey ? `pattern:${patternKey}` : '',
      `fingerprint:${fingerprint}`,
      `title:${normalizedTitle}`,
      `section-title:${candidate.sectionTitle}:${normalizedTitle}`,
      category
        ? `lens-category:${lens}:${category}`
        : `lens-concept:${lens}:${candidate.item.concept ?? 'unknown'}`,
      category ? `category-title:${category}:${normalizedTitle}` : '',
    ].filter(Boolean);
    const existing = keys.map(key => bestByKey.get(key)).find(Boolean);
    if (!existing || candidate.score > existing.score) {
      keys.forEach(key => bestByKey.set(key, candidate));
    }
  }

  return [...new Set(bestByKey.values())]
    .sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);
}

function dedupeExactLibraryCandidates(candidates: LibraryCandidate[], where: string): LibraryCandidate[] {
  type WrappedCandidate = PatternLibraryItem & { candidate: LibraryCandidate };

  return dedupeExactInsights<WrappedCandidate>(
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

function librarySectionTitleForItem(item: PatternLibraryItem): string {
  if (item.librarySectionTitle) return item.librarySectionTitle;
  if (item.lens === 'body_signals') return 'Body Signals';
  if (item.lens === 'relational_patterns') return 'Relationships';
  if (item.lens === 'dream_archive_contrast') return 'Dreams & Symbols';
  if (item.lens === 'recovery_patterns') return 'What Helps';
  if (item.lens === 'protective_patterns') return 'Safety & Regulation';
  if (item.lens === 'processing_style') return 'Growth Edges';
  if (item.lens === 'checkin_trends') return 'Rest & Capacity';
  if (item.concept === 'values_pattern') return 'Boundaries & Self-Trust';
  if (item.concept === 'emotional_theme') return 'Emotional Weather';
  return 'Growth Edges';
}

function buildFullLibrarySections(candidates: LibraryCandidate[]): PatternLibrarySection[] {
  const sections = candidates.reduce<PatternLibrarySection[]>((result, candidate) => {
    const title = librarySectionTitleForItem(candidate.item);
    const existing = result.find(section => section.title === title);
    if (existing) {
      existing.items.push(candidate.item);
    } else {
      result.push({ title, items: [candidate.item] });
    }
    return result;
  }, []);

  return sections
    .map(section => ({
      ...section,
      items: section.items
        .sort((a, b) => scoreLibraryItem(b) - scoreLibraryItem(a))
        .slice(0, 8),
    }))
    .filter(section => section.items.length > 0)
    .sort((a, b) => (LIBRARY_SECTION_ORDER[a.title] ?? 99) - (LIBRARY_SECTION_ORDER[b.title] ?? 99));
}

function selectSupportingArchiveCandidates(
  candidates: LibraryCandidate[],
  coreItem: PatternLibraryItem | null,
): LibraryCandidate[] {
  const selected: LibraryCandidate[] = [];
  const seenSections = new Set<string>();
  const seenTitles = new Set<string>(coreItem ? [normalizeConceptKey(coreItem.title)] : []);
  const seenLenses = new Set<PatternLens>(coreItem?.lens ? [coreItem.lens] : []);
  const seenCategories = new Set<string>(coreItem?.category ? [coreItem.category] : []);

  for (const candidate of candidates) {
    const titleKey = normalizeConceptKey(candidate.item.title);
    const lens = candidate.item.lens;
    const sectionTitle = candidate.item.archiveSectionTitle ?? sectionTitleForLens(lens);
    const category = candidate.item.category;
    if (!titleKey || seenTitles.has(titleKey)) continue;
    if (seenSections.has(sectionTitle)) continue;
    if (lens && seenLenses.has(lens)) continue;
    if (category && seenCategories.has(category)) continue;

    selected.push({ ...candidate, sectionTitle });
    seenTitles.add(titleKey);
    seenSections.add(sectionTitle);
    if (lens) seenLenses.add(lens);
    if (category) seenCategories.add(category);
    if (selected.length >= 2) break;
  }

  return selected;
}

export function buildPatternLibraryState(
  v2PatternItems: PatternLibraryItem[] = [],
) {
  const v2Candidates: LibraryCandidate[] = v2PatternItems.map((item, index) => ({
    sectionTitle: item.archiveSectionTitle ?? sectionTitleForLens(item.lens),
    item,
    score: scoreLibraryItem(item),
    originalIndex: index,
  }));

  if (v2Candidates.length === 0) {
    return {
      statusLine: 'Not enough signal for a real pattern read',
      helperText:
        'Do not force a read yet. A few more check-ins, reflections, body signals, dreams, or relationship notes will help MySky build a pattern map from V2 evidence.',
      items: [] as PatternLibraryItem[],
      sections: [] as PatternLibrarySection[],
      librarySections: [] as PatternLibrarySection[],
    };
  }

  const exactDedupedCandidates = dedupeExactLibraryCandidates(
    v2Candidates,
    'PatternArchive:v2Candidates',
  );
  const dedupedCandidates = dedupeLibraryCandidates(exactDedupedCandidates);
  const coreCandidate = dedupedCandidates[0] ?? null;
  const coreItem = coreCandidate?.item ?? null;
  const selectedSupportingCandidates = selectSupportingArchiveCandidates(
    dedupedCandidates.slice(1),
    coreItem,
  );
  const coreSection: PatternLibrarySection[] = coreItem
    ? [{ title: 'Core Pattern', items: [coreItem] }]
    : [];
  const supportSections = groupCandidates(selectedSupportingCandidates);
  const librarySections = buildFullLibrarySections(dedupedCandidates);
  const items = dedupeExactInsights([
    ...(coreItem ? [coreItem] : []),
    ...selectedSupportingCandidates.map(candidate => candidate.item),
  ], 'PatternArchive:v2Items');

  return {
    statusLine: 'Pattern read refreshed today',
    helperText:
      'One core pattern sits first. Supporting sections only appear when they answer a different question.',
    items,
    sections: [...coreSection, ...supportSections],
    librarySections,
  };
}
