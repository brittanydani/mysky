import type {
  ArchivePatternScore,
  DailyAngle,
  EvidenceAnchor,
  GeneratedInsight,
  InsightHistoryItem,
  InsightSlot,
  InsightSurface,
  PatternMovement,
} from './types';

export type InsightFreshnessRules = {
  sameAngleCooldownDays: number;
  samePatternSameSlotCooldownDays: number;
  samePatternAnySlotCooldownDays: number;
  sameTitleCooldownDays: number;
  sameEvidenceCooldownDays: number;
  sameCopyCooldownDays: number;
  allowRepeatIfMovement: PatternMovement[];
};

export type FreshnessDecision = {
  allowed: boolean;
  penalty: number;
  reasons: string[];
};

export const DEFAULT_INSIGHT_FRESHNESS_RULES: InsightFreshnessRules = {
  sameAngleCooldownDays: 30,
  samePatternSameSlotCooldownDays: 7,
  samePatternAnySlotCooldownDays: 3,
  sameTitleCooldownDays: 30,
  sameEvidenceCooldownDays: 30,
  sameCopyCooldownDays: 60,
  allowRepeatIfMovement: ['intensifying', 'shifting', 'returning'],
};

type CheckFreshnessArgs = {
  patternScore: ArchivePatternScore;
  angle: DailyAngle;
  slot: InsightSlot;
  surface: InsightSurface;
  history: InsightHistoryItem[];
  now: string;
  evidence?: EvidenceAnchor[];
  copyPreview?: string;
  rules?: InsightFreshnessRules;
};

export function checkInsightFreshness({
  patternScore,
  angle,
  slot,
  surface,
  history,
  now,
  evidence = [],
  copyPreview,
  rules = DEFAULT_INSIGHT_FRESHNESS_RULES,
}: CheckFreshnessArgs): FreshnessDecision {
  const reasons: string[] = [];
  let penalty = 0;

  const movementAllowsRepeat = rules.allowRepeatIfMovement.includes(patternScore.movement);

  const recentSameAngle = findRecentHistory(history, now, rules.sameAngleCooldownDays, item => {
    return item.angleKey === angle.key;
  });

  if (recentSameAngle) {
    if (!movementAllowsRepeat) {
      reasons.push(`same angle shown within ${rules.sameAngleCooldownDays} days`);
      return {
        allowed: false,
        penalty: 1,
        reasons,
      };
    }
    penalty += 0.35;
    reasons.push('same angle was recent, but movement allows a repeat with penalty');
  }

  const recentSamePatternSameSlot = findRecentHistory(
    history,
    now,
    rules.samePatternSameSlotCooldownDays,
    item => {
      return (
        item.patternKey === patternScore.patternKey &&
        item.slot === slot &&
        item.surface === surface
      );
    },
  );

  if (recentSamePatternSameSlot) {
    if (!movementAllowsRepeat) {
      reasons.push(
        `same pattern shown in same slot within ${rules.samePatternSameSlotCooldownDays} days`,
      );
      return {
        allowed: false,
        penalty: 1,
        reasons,
      };
    }
    penalty += 0.3;
    reasons.push('same pattern was recent in this slot, but movement allows a repeat with penalty');
  }

  const recentSamePatternAnySlot = findRecentHistory(
    history,
    now,
    rules.samePatternAnySlotCooldownDays,
    item => item.patternKey === patternScore.patternKey,
  );

  if (recentSamePatternAnySlot) {
    penalty += movementAllowsRepeat ? 0.15 : 0.35;
    reasons.push(`same pattern shown within ${rules.samePatternAnySlotCooldownDays} days`);
  }

  const recentSameTitle = findRecentHistory(history, now, rules.sameTitleCooldownDays, item => {
    return normalizeText(item.title) === normalizeText(angle.title);
  });

  if (recentSameTitle) {
    penalty += 0.25;
    reasons.push(`same title shown within ${rules.sameTitleCooldownDays} days`);
  }

  const evidenceHash = createEvidenceHash(evidence);
  if (evidenceHash) {
    const recentSameEvidence = findRecentHistory(
      history,
      now,
      rules.sameEvidenceCooldownDays,
      item => item.evidenceHash === evidenceHash,
    );
    if (recentSameEvidence) {
      penalty += 0.25;
      reasons.push(`same evidence used within ${rules.sameEvidenceCooldownDays} days`);
    }
  }

  const copyHash = copyPreview ? createCopyHash(copyPreview) : null;
  if (copyHash) {
    const recentSameCopy = findRecentHistory(
      history,
      now,
      rules.sameCopyCooldownDays,
      item => item.copyHash === copyHash,
    );
    if (recentSameCopy) {
      reasons.push(`same copy shown within ${rules.sameCopyCooldownDays} days`);
      return {
        allowed: false,
        penalty: 1,
        reasons,
      };
    }
  }

  return {
    allowed: penalty < 0.85,
    penalty: Math.min(1, penalty),
    reasons,
  };
}

export function createInsightHistoryItem(insight: GeneratedInsight): InsightHistoryItem {
  return {
    id: insight.id,
    patternKey: insight.patternKey,
    angleKey: insight.angleKey,
    slot: insight.slot,
    surface: insight.surface,
    title: insight.title,
    shownAt: insight.createdAt,
    copyHash: createCopyHash(`${insight.title}\n${insight.body}\n${insight.reflectionPrompt ?? ''}`),
    evidenceHash: createEvidenceHash(insight.evidence),
  };
}

export function createCopyHash(text: string): string {
  const normalized = normalizeText(text);
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `copy_${Math.abs(hash)}`;
}

export function createEvidenceHash(evidence: EvidenceAnchor[]): string | undefined {
  if (evidence.length === 0) return undefined;
  const normalizedEvidence = evidence
    .map(item =>
      [
        item.source,
        item.date.slice(0, 10),
        item.label ?? '',
        item.phrase ?? '',
        item.signal ?? '',
        item.value ?? '',
      ]
        .join('|')
        .toLowerCase(),
    )
    .sort()
    .join('::');

  let hash = 0;
  for (let i = 0; i < normalizedEvidence.length; i += 1) {
    hash = (hash << 5) - hash + normalizedEvidence.charCodeAt(i);
    hash |= 0;
  }
  return `evidence_${Math.abs(hash)}`;
}

function findRecentHistory(
  history: InsightHistoryItem[],
  now: string,
  cooldownDays: number,
  predicate: (item: InsightHistoryItem) => boolean,
): InsightHistoryItem | undefined {
  const nowTime = new Date(now).getTime();
  const cutoff = nowTime - cooldownDays * 24 * 60 * 60 * 1000;
  return history.find(item => {
    const shownAt = new Date(item.shownAt).getTime();
    return shownAt >= cutoff && predicate(item);
  });
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
