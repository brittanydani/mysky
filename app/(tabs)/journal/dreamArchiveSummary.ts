import type { SleepEntry } from '../../../services/storage/models';

export function buildDreamArchiveSummary(entries: SleepEntry[]) {
  const dreamEntries = entries.filter((entry) => !!entry.dreamText?.trim());
  if (dreamEntries.length < 3) return null;

  const feelingCounts = new Map<string, number>();
  const themeCounts = new Map<string, number>();

  for (const entry of dreamEntries) {
    if (entry.dreamFeelings) {
      try {
        const parsed = JSON.parse(entry.dreamFeelings) as Array<{ id?: string; label?: string }>;
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
    return {
      summary: `You already have ${dreamEntries.length} dream entries in your archive. That is enough history for something meaningful to start taking shape, even if the pattern still feels quiet or just out of reach.`,
      chips: ['Needs more repeated signals'],
      grounding: 'Keep saving one feeling or one clear symbol after each dream. A gentle thread is already forming, and a little more consistency will make it easier to recognize.',
    };
  }

  return {
    summary: `${chips.slice(0, 2).join(' and ')} keep returning across your recent dreams. That repetition can be worth trusting. Your inner world may be drawing your attention back to an emotional theme that wants a little more care, curiosity, or understanding.`,
    chips,
    grounding: 'Notice where this same theme brushes up against your waking life this week. The insight is usually not in a single symbol, but in the overlap between the dream and what you are already living.',
  };
}

export function toReadableDreamLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}