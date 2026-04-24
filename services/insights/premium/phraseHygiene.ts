import type { PhraseCheckResult, PhraseHealth } from './types';

function countShortTokens(tokens: string[]): number {
  return tokens.filter((t) => t.length < 3).length;
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function looksSluggy(input: string): boolean {
  const hyphenRuns = input.match(/[a-zA-Z]+(?:-[a-zA-Z]+){2,}/g) ?? [];
  return hyphenRuns.length > 0;
}

function hasTooManyHyphens(input: string): boolean {
  const hyphenCount = (input.match(/-/g) ?? []).length;
  return hyphenCount >= 5;
}

function hasBrokenEdges(input: string): boolean {
  return /^[^\w"]|[^\w.)"!?]$/.test(input);
}

function hasAbruptFragment(input: string): boolean {
  const lowered = input.toLowerCase();
  return (
    lowered.includes('-on-an-o') ||
    lowered.includes('-asks-me-to-tru') ||
    /\b[a-z]-[a-z]\b/.test(lowered)
  );
}

export function cleanExtractedPhrase(input: string): string {
  return normalizeWhitespace(input)
    .replace(/\s*-\s*/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

export function evaluatePhraseHealth(input: string): PhraseCheckResult {
  const cleaned = cleanExtractedPhrase(input);
  const reasons: string[] = [];
  let health: PhraseHealth = 'clean';

  if (!cleaned) {
    return {
      health: 'broken',
      reasons: ['empty phrase'],
      cleaned,
    };
  }

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const shortTokenRatio = tokens.length > 0 ? countShortTokens(tokens) / tokens.length : 1;

  if (looksSluggy(cleaned)) reasons.push('looks slugified');
  if (hasTooManyHyphens(cleaned)) reasons.push('too many hyphens');
  if (hasBrokenEdges(cleaned)) reasons.push('malformed edges');
  if (hasAbruptFragment(cleaned)) reasons.push('abrupt fragment');
  if (shortTokenRatio > 0.35) reasons.push('too many short tokens');

  if (reasons.length >= 2 || reasons.includes('abrupt fragment')) {
    health = 'broken';
  } else if (reasons.length === 1) {
    health = 'borderline';
  }

  return { health, reasons, cleaned };
}

export function chooseSafePhraseAnchor(phrases: string[]): string | null {
  for (const phrase of phrases) {
    const result = evaluatePhraseHealth(phrase);
    if (result.health === 'clean') {
      return result.cleaned ?? phrase;
    }
  }
  return null;
}
