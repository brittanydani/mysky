import { createCopyHash } from '../insightsV2/insightFreshness';

export function createKnowledgeInsightCopyHash(input: {
  title?: string;
  observation: string;
  pattern: string;
  prompt?: string;
}): string {
  const body = [input.observation, input.pattern]
    .map(part => part.trim())
    .filter(Boolean)
    .join(' ');

  return createCopyHash(`${input.title ?? ''}\n${body}\n${input.prompt ?? ''}`);
}
