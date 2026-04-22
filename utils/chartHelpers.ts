export function personalizeLifeThemeSummary(
  type: 'relationship' | 'career' | 'emotional' | 'shadow',
  summary: string,
) {
  if (type === 'relationship') {
    return `Your chart suggests that connection is not casual for you. ${summary}`;
  }
  if (type === 'career') {
    return `The shape of your work life looks most alive when it feels personally meaningful, not just productive. ${summary}`;
  }
  if (type === 'emotional') {
    return `Your inner world has its own rhythm, and this part of the chart helps explain how it asks to be understood. ${summary}`;
  }
  return `This is the part of your chart that describes how growth usually arrives: not all at once, but through the places that keep asking for honesty. ${summary}`;
}