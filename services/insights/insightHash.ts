export function createKnowledgeInsightCopyHash(input: { observation: string; pattern: string }): string {
  return `${input.observation}:${input.pattern}`;
}
