import type { SleepEntry } from '../services/storage/models';

export function hasDreamContent(entry: Pick<SleepEntry, 'dreamText' | 'dreamFeelings' | 'dreamMetadata'>) {
  return Boolean(
    entry.dreamText?.trim()
      || entry.dreamFeelings?.trim()
      || entry.dreamMetadata?.trim(),
  );
}

export function buildDreamArchiveSummary(entries: SleepEntry[]) {
  const dreamEntries = entries.filter(hasDreamContent);
  if (dreamEntries.length < 3) return null;

  const feelingCounts = new Map<string, number>();
  const themeCounts = new Map<string, number>();

  for (const entry of dreamEntries) {
    if (entry.dreamFeelings) {
      try {
        const parsed = JSON.parse(entry.dreamFeelings) as { id?: string; label?: string }[];
        for (const feeling of parsed) {
          const label = (feeling.label ?? feeling.id ?? '').trim();
          if (!label) continue;
          feelingCounts.set(label, (feelingCounts.get(label) ?? 0) + 1);
        }
      } catch {
        for (const label of entry.dreamFeelings.split(',')) {
          const normalized = label.trim();
          if (!normalized) continue;
          feelingCounts.set(normalized, (feelingCounts.get(normalized) ?? 0) + 1);
        }
      }
    }

    if (entry.dreamMetadata) {
      try {
        const parsed = JSON.parse(entry.dreamMetadata) as { overallTheme?: string };
        if (parsed.overallTheme) {
          themeCounts.set(parsed.overallTheme, (themeCounts.get(parsed.overallTheme) ?? 0) + 1);
        }
      } catch {
        // Ignore malformed metadata.
      }
    }
  }

  const topFeelings = [...feelingCounts.entries()].sort((a, b) => b[1] - a[1]).filter(([, count]) => count >= 2).slice(0, 2);
  const topThemes = [...themeCounts.entries()].sort((a, b) => b[1] - a[1]).filter(([, count]) => count >= 2).slice(0, 2);
  const chips = [
    ...topThemes.map(([theme]) => toReadableDreamLabel(theme)),
    ...topFeelings.map(([feeling]) => toReadableDreamLabel(feeling)),
  ].slice(0, 4);

  if (chips.length === 0) {
    const themeHint = [...themeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([theme]) => toReadableDreamLabel(theme));
    const feelingHint = [...feelingCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([feeling]) => toReadableDreamLabel(feeling));
    const hints = [...themeHint, ...feelingHint].slice(0, 2);
    return {
      summary: hints.length > 0
        ? `You have ${dreamEntries.length} dream entries, but the signal is still wide rather than repetitive. ${hints.join(' and ')} have appeared, though not often enough yet to call the dream pattern settled.`
        : `You already have ${dreamEntries.length} dream entries in your archive. That is enough to know your dream life is active, but not enough repetition yet to trust the first interpretation.`,
      chips: ['Needs more repeated signals'],
      grounding: 'Keep saving one feeling, one place, or one symbol after each dream. The next few mornings are what usually reveal whether the thread is emotional, relational, or environmental.',
    };
  }

  const topThemeCount = topThemes[0]?.[1] ?? 0;
  const topFeelingCount = topFeelings[0]?.[1] ?? 0;
  const leadPieces: string[] = [];
  if (topThemes[0]) {
    leadPieces.push(`${toReadableDreamLabel(topThemes[0][0])} appeared ${topThemeCount} time${topThemeCount === 1 ? '' : 's'}`);
  }
  if (topFeelings[0]) {
    leadPieces.push(`${toReadableDreamLabel(topFeelings[0][0])} showed up ${topFeelingCount} time${topFeelingCount === 1 ? '' : 's'}`);
  }

  return {
    summary: `${leadPieces.join(', ')} across your recent dreams. When the same setting, theme, or feeling keeps returning, MySky treats that as emotional pattern rather than dream noise. ${chips.slice(0, 2).join(' and ')} look like part of what your inner world is still trying to work through.`,
    chips,
    grounding: 'Notice where this same theme brushes against waking life this week. The useful part is usually not a single symbol by itself, but the overlap between the dream pattern and what already feels unresolved during the day.',
  };
}

export function toReadableDreamLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
