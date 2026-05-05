import { humanizeInsightParagraphBody } from './generated/insightSupportAlignment';

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function patternParagraphBodyKey(body: string): string {
  return normalizeToken(humanizeInsightParagraphBody(body))
    .replace(/[^a-z0-9 ]+/g, '')
    .trim();
}
