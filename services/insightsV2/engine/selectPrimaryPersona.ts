import { PERSONA_PROFILES } from '../personaProfiles';
import type {
  ArchivePatternScore,
  EvidenceAnchor,
  PatternConfidence,
  PersonaProfileCopy,
  SelectedPersonaProfile,
  SignalKey,
  UserSignal,
} from '../types';

interface SelectPrimaryPersonaArgs {
  archivePatterns: ArchivePatternScore[];
  recentSignals: UserSignal[];
}

const MIN_PERSONA_SCORE = 0.45;

function uniqueSignals(signals: UserSignal[]): SignalKey[] {
  return Array.from(new Set(signals.map(signal => signal.key)));
}

function getConfidence(score: number): PatternConfidence {
  if (score > 0.82) return 'veryStrong';
  if (score > 0.68) return 'strong';
  if (score > 0.5) return 'moderate';
  return 'emerging';
}

function scoreCategory(
  profile: PersonaProfileCopy,
  archivePatterns: ArchivePatternScore[],
): { primary: number; secondary: number; matchedPatternKeys: string[]; patternEvidence: EvidenceAnchor[] } {
  const relatedCategories = new Set([profile.category, ...profile.secondaryCategories]);
  const relatedPatterns = archivePatterns
    .filter(pattern => relatedCategories.has(pattern.category) && pattern.score >= 0.35)
    .sort((a, b) => b.score - a.score);

  const primary = relatedPatterns.find(pattern => pattern.category === profile.category)?.score ?? 0;
  const secondary = relatedPatterns.find(pattern => pattern.category !== profile.category)?.score ?? 0;

  return {
    primary,
    secondary,
    matchedPatternKeys: relatedPatterns.slice(0, 4).map(pattern => pattern.patternKey),
    patternEvidence: relatedPatterns.flatMap(pattern => pattern.evidence).slice(0, 6),
  };
}

function getProfileScore(
  profile: PersonaProfileCopy,
  archivePatterns: ArchivePatternScore[],
  recentSignals: UserSignal[],
): SelectedPersonaProfile | null {
  const triggerSet = new Set(profile.triggerSignals);
  const supportingSet = new Set(profile.supportingSignals);
  const matchedTriggerSignals = uniqueSignals(recentSignals.filter(signal => triggerSet.has(signal.key)));
  const matchedSupportingSignals = uniqueSignals(recentSignals.filter(signal => supportingSet.has(signal.key)));
  const matchedSignals = Array.from(new Set([...matchedTriggerSignals, ...matchedSupportingSignals]));

  const matchedSignalRows = recentSignals.filter(signal => matchedSignals.includes(signal.key));
  const averageStrength = matchedSignalRows.length
    ? matchedSignalRows.reduce((sum, signal) => sum + signal.strength, 0) / matchedSignalRows.length
    : 0;

  const { primary, secondary, matchedPatternKeys, patternEvidence } = scoreCategory(profile, archivePatterns);
  const triggerScore = Math.min(matchedTriggerSignals.length / Math.max(profile.triggerSignals.length, 1), 1);
  const supportingScore = Math.min(matchedSupportingSignals.length / Math.max(profile.supportingSignals.length, 1), 1);
  const evidenceBreadthScore = Math.min(new Set(matchedSignalRows.map(signal => signal.source)).size / 3, 1);
  const score = Math.min(
    1,
    triggerScore * 0.34 +
      supportingScore * 0.16 +
      averageStrength * 0.18 +
      Math.min(primary, 1) * 0.22 +
      Math.min(secondary, 1) * 0.06 +
      evidenceBreadthScore * 0.04,
  );

  const hasEnoughSignals = matchedTriggerSignals.length >= 1 && matchedSignals.length >= 2;
  const hasEnoughPatternEvidence = primary >= 0.5 && matchedSignals.length >= 1;
  if (score < MIN_PERSONA_SCORE || (!hasEnoughSignals && !hasEnoughPatternEvidence)) return null;

  const signalEvidence = matchedSignalRows
    .map(signal => signal.evidence)
    .filter((evidence): evidence is EvidenceAnchor => !!evidence);

  return {
    key: profile.key,
    personNumber: profile.personNumber,
    title: profile.title,
    focus: profile.focus,
    category: profile.category,
    secondaryCategories: profile.secondaryCategories,
    intro: profile.intro,
    sentences: profile.sentences,
    selectedSentence: profile.sentences[0],
    score,
    confidence: getConfidence(score),
    matchedSignals,
    matchedPatternKeys,
    evidence: [...signalEvidence, ...patternEvidence].slice(0, 6),
  };
}

export function selectPrimaryPersona({
  archivePatterns,
  recentSignals,
}: SelectPrimaryPersonaArgs): SelectedPersonaProfile | null {
  const ranked = PERSONA_PROFILES
    .map(profile => getProfileScore(profile, archivePatterns, recentSignals))
    .filter((profile): profile is SelectedPersonaProfile => !!profile)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.personNumber - b.personNumber;
    });

  return ranked[0] ?? null;
}
