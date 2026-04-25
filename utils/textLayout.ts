export function keepLastWordsTogether(text: string, wordCount = 2): string {
  const normalized = text.trim();
  if (!normalized) return text;

  const words = normalized.split(/\s+/);
  if (words.length < wordCount) return text;

  const splitIndex = words.length - wordCount;
  return `${words.slice(0, splitIndex).join(' ')} ${words.slice(splitIndex).join('\u00A0')}`;
}

/**
 * Normalizes display copy so line-wrapped/generated text doesn't surface
 * broken fragments (soft hyphens, zero-width chars, accidental hard wraps).
 */
export function normalizeDisplayText(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, '') // soft hyphen + zero-width chars
    .replace(/([a-z])\s*-\s*\n\s*([a-z])/gi, '$1-$2') // preserve intended hyphenated words
    .replace(/\r?\n+/g, ' ') // prevent random hard-wrap fragments in cards
    .replace(/\s{2,}/g, ' ')
    .trim();
}