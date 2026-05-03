import type { UserSignal } from '../../insightsV2/types';

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function extractAnchors(signals: readonly UserSignal[]): string[] {
  return unique(
    signals.flatMap(signal => [
      slug(signal.key),
      ...(signal.roles ?? []).map(slug),
      ...(signal.evidence?.label ? [slug(signal.evidence.label)] : []),
      ...(signal.evidence?.phrase ? [slug(signal.evidence.phrase)] : []),
      ...(signal.evidence?.signal ? [slug(signal.evidence.signal)] : []),
    ]),
  ).slice(0, 32);
}
