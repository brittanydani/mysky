export interface ArchiveDepthCounts {
  checkIns?: number;
  journalEntries?: number;
  sleepEntries?: number;
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
  return safeCount(counts.checkIns)
    + safeCount(counts.journalEntries)
    + safeCount(counts.sleepEntries)
    + safeCount(counts.dreamEntries);
}

function describeSignals(counts: ArchiveDepthCounts): string {
  const parts = [
    [safeCount(counts.checkIns), 'check-in', 'check-ins'],
    [safeCount(counts.journalEntries), 'journal entry', 'journal entries'],
    [safeCount(counts.sleepEntries), 'sleep entry', 'sleep entries'],
    [safeCount(counts.dreamEntries), 'dream entry', 'dream entries'],
  ]
    .filter(([count]) => Number(count) > 0)
    .map(([count, singular, plural]) => `${count} ${count === 1 ? singular : plural}`);

  if (parts.length === 0) return 'No signals logged yet';
  if (parts.length === 1) return parts[0] as string;
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function signalMixLine(counts: ArchiveDepthCounts): string {
  const hasCheckIns = safeCount(counts.checkIns) > 0;
  const hasJournals = safeCount(counts.journalEntries) > 0;
  const hasSleep = safeCount(counts.sleepEntries) > 0;
  const hasDreams = safeCount(counts.dreamEntries) > 0;

  if (hasCheckIns && hasJournals && (hasSleep || hasDreams)) {
    return 'That mix gives MySky enough contrast to compare how your body, mood, and inner language move together.';
  }
  if (hasCheckIns && hasJournals) {
    return 'That overlap is what lets MySky compare the number of the week with the meaning underneath it.';
  }
  if (hasCheckIns && (hasSleep || hasDreams)) {
    return 'That overlap is where the archive stops sounding generic and starts seeing how your days and nights affect each other.';
  }
  if (hasJournals && hasDreams) {
    return 'That combination gives MySky access to both your waking language and what keeps returning after dark.';
  }
  if (hasDreams) {
    return 'Dream material adds depth because it shows what your inner world keeps processing after the day ends.';
  }
  if (hasJournals) {
    return 'Journal entries add depth because they give your mood history texture, language, and emotional context.';
  }
  return 'Check-ins start the pattern read, but the archive gets sharper as more kinds of signals overlap.';
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
      label: 'Archive depth is now usable',
      headline: 'Your archive has enough history to say something personal',
      body: `${describeSignals(counts)} now give MySky enough history to separate a hard day from the patterns that actually repeat. ${signalMixLine(counts)}`,
      nextMilestone,
      remaining: 0,
      progress,
    };
  }

  if (totalSignals >= 7) {
    return {
      totalSignals,
      label: 'Weekly read unlocked',
      headline: 'Your archive can now connect the week into a real story',
      body: `${describeSignals(counts)} are enough for MySky to move beyond recap and start interpreting what the week was actually like. ${signalMixLine(counts)}`,
      nextMilestone,
      remaining: Math.max(0, (nextMilestone ?? 15) - totalSignals),
      progress,
    };
  }

  if (totalSignals >= 3) {
    return {
      totalSignals,
      label: 'Patterns forming',
      headline: `${7 - totalSignals} more signals until the archive can read the week with confidence`,
      body: `${describeSignals(counts)} are enough to start sketching a baseline, but not enough yet for MySky to trust its first interpretation. ${signalMixLine(counts)}`,
      nextMilestone,
      remaining: Math.max(0, (nextMilestone ?? 7) - totalSignals),
      progress,
    };
  }

  return {
    totalSignals,
    label: 'Starting signal',
    headline: totalSignals === 0 ? 'Start building the archive MySky will read from' : 'Your first signals are saved',
    body: totalSignals === 0
      ? 'Log a check-in, journal entry, sleep entry, or dream to begin building the history MySky uses to notice what repeats in your emotional life.'
      : `${describeSignals(counts)} saved. A few more signals will let MySky stop describing isolated moments and start noticing your actual patterns.`,
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
      body: `Your ${signalSummary} are repeating strongly enough for Deeper Sky to name what steadies you, what drains you, and what keeps returning in the background of your life.`,
      cta: 'Reveal your patterns',
    };
  }

  if (totalSignals >= 7) {
    return {
      eyebrow: 'Pattern read ready',
      title: `${totalSignals} personal signals are ready for a deeper read`,
      body: `Deeper Sky can turn your ${signalSummary} into actual pattern language: what the week keeps meaning, where your baseline shifts, and which conditions your system responds to most.`,
      cta: surface === 'archive' ? 'Read the deeper archive' : 'See your patterns',
    };
  }

  if (totalSignals >= 3) {
    return {
      eyebrow: 'Patterns forming',
      title: `${totalSignals} personal signals are starting to connect`,
      body: `Keep logging to strengthen the read. Deeper Sky becomes premium when it can say more than “this week was hard” and start explaining the pattern underneath.`,
      cta: 'Explore Deeper Sky',
    };
  }

  return {
    eyebrow: 'Deeper Insight',
    title: 'Build the archive that makes MySky specific',
    body: 'Deeper Sky gets better as mood, sleep, dreams, and reflections begin overlapping enough for MySky to stop guessing and start recognizing you.',
    cta: 'Explore Deeper Sky',
  };
}
