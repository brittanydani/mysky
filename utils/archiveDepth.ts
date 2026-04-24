export interface ArchiveDepthCounts {
  checkIns?: number;
  journalEntries?: number;
  dreamEntries?: number;
}

export interface ArchiveDepth {
  totalSignals: number;
  label: string;
  headline: string;
  body: string;
  nextMilestone: number | null;
  remaining: number;
  progress: number;
}

export interface PremiumTeaserCopy {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
}

const MILESTONES = [3, 7, 15];

function safeCount(value: number | undefined): number {
  return Math.max(0, Math.floor(value ?? 0));
}

export function getArchiveSignalCount(counts: ArchiveDepthCounts): number {
  return safeCount(counts.checkIns) + safeCount(counts.journalEntries) + safeCount(counts.dreamEntries);
}

function describeSignals(counts: ArchiveDepthCounts): string {
  const parts = [
    [safeCount(counts.checkIns), 'check-in', 'check-ins'],
    [safeCount(counts.journalEntries), 'journal entry', 'journal entries'],
    [safeCount(counts.dreamEntries), 'dream entry', 'dream entries'],
  ]
    .filter(([count]) => Number(count) > 0)
    .map(([count, singular, plural]) => `${count} ${count === 1 ? singular : plural}`);

  if (parts.length === 0) return 'No signals logged yet';
  if (parts.length === 1) return parts[0] as string;
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

export function getArchiveDepth(counts: ArchiveDepthCounts): ArchiveDepth {
  const totalSignals = getArchiveSignalCount(counts);
  const nextMilestone = MILESTONES.find((milestone) => totalSignals < milestone) ?? null;
  const previousMilestone = totalSignals >= 15 ? 15 : totalSignals >= 7 ? 7 : totalSignals >= 3 ? 3 : 0;
  const progressTarget = nextMilestone ?? 15;
  const progressSpan = Math.max(1, progressTarget - previousMilestone);
  const progress = nextMilestone
    ? Math.min(1, Math.max(0, (totalSignals - previousMilestone) / progressSpan))
    : 1;

  if (totalSignals >= 15) {
    return {
      totalSignals,
      label: 'Archive depth increasing',
      headline: 'Your archive has enough history for deeper pattern reads',
      body: `${describeSignals(counts)} are giving MySky more context to compare what repeats, shifts, restores, and drains you.`,
      nextMilestone,
      remaining: 0,
      progress,
    };
  }

  if (totalSignals >= 7) {
    return {
      totalSignals,
      label: 'Weekly read unlocked',
      headline: 'Your first weekly pattern read is ready',
      body: `${describeSignals(counts)} are enough to start connecting your week into a clearer story.`,
      nextMilestone,
      remaining: Math.max(0, (nextMilestone ?? 15) - totalSignals),
      progress,
    };
  }

  if (totalSignals >= 3) {
    return {
      totalSignals,
      label: 'Patterns forming',
      headline: `${7 - totalSignals} more signals until a stronger weekly read`,
      body: `${describeSignals(counts)} are beginning to form a baseline. A few more logs will make the pattern read more useful.`,
      nextMilestone,
      remaining: Math.max(0, (nextMilestone ?? 7) - totalSignals),
      progress,
    };
  }

  return {
    totalSignals,
    label: 'Starting signal',
    headline: totalSignals === 0 ? 'Start building your pattern archive' : 'Your first signals are saved',
    body: totalSignals === 0
      ? 'Log a check-in, journal entry, or dream to begin building the history MySky uses for personal patterns.'
      : `${describeSignals(counts)} saved. A few more logs will help MySky start naming what repeats.`,
    nextMilestone,
    remaining: Math.max(0, (nextMilestone ?? 3) - totalSignals),
    progress,
  };
}

export function getPersonalizedPremiumTeaser(
  counts: ArchiveDepthCounts,
  options?: { detectedPatterns?: number; surface?: 'today' | 'patterns' | 'archive' },
): PremiumTeaserCopy {
  const totalSignals = getArchiveSignalCount(counts);
  const signalSummary = describeSignals(counts).toLowerCase();
  const detectedPatterns = safeCount(options?.detectedPatterns);
  const surface = options?.surface ?? 'today';

  if (detectedPatterns > 0) {
    return {
      eyebrow: 'Patterns detected',
      title: `MySky has ${detectedPatterns} deeper ${detectedPatterns === 1 ? 'pattern' : 'patterns'} ready from your archive`,
      body: `Your ${signalSummary} are showing enough repetition for Deeper Sky to name what is restoring you, draining you, and showing up across your inner life.`,
      cta: 'Reveal your patterns',
    };
  }

  if (totalSignals >= 7) {
    return {
      eyebrow: 'Pattern read ready',
      title: `${totalSignals} personal signals are ready for a deeper read`,
      body: `Deeper Sky can connect your ${signalSummary} into trend lines, repeated themes, and prompts grounded in your own history.`,
      cta: surface === 'archive' ? 'Read the deeper archive' : 'See your patterns',
    };
  }

  if (totalSignals >= 3) {
    return {
      eyebrow: 'Patterns forming',
      title: `${totalSignals} personal signals are starting to connect`,
      body: `Keep logging to strengthen the read. Deeper Sky opens the longer view once your check-ins, reflections, and dreams have enough history.`,
      cta: 'Explore Deeper Sky',
    };
  }

  return {
    eyebrow: 'Deeper Insight',
    title: 'Build the archive that makes MySky personal',
    body: 'Deeper Sky becomes more useful as you log mood, sleep, dreams, and reflections over time.',
    cta: 'Explore Deeper Sky',
  };
}
