export function keepLastWordsTogether(text: string, wordCount = 2): string {
  const normalized = text.trim();
  if (!normalized) return text;

  const words = normalized.split(/\s+/);
  if (words.length < wordCount) return text;

  const splitIndex = words.length - wordCount;
  return `${words.slice(0, splitIndex).join(' ')} ${words.slice(splitIndex).join('\u00A0')}`;
}