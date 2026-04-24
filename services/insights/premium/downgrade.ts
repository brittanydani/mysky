import type { InsightCandidate } from './types';
import { IDENTITY_CLAIM_PATTERNS } from './types';

function downgradeIdentityLanguage(text: string): string {
  let modified = text;

  // Replace identity-level phrases with observational language
  const replacements: Array<[RegExp, string]> = [
    [/\byou are\b/gi, 'you may be experiencing'],
    [/\byour dominant pattern is\b/gi, 'a recurring theme is'],
    [/\byour intelligence profile (is|shows)\b/gi, 'your responses suggest'],
    [/\byour cognitive style (is|shows)\b/gi, 'your reflection style leans toward'],
    [/\bthe shadow to watch is\b/gi, 'an underlying dynamic may be'],
    [/\byour archetype is\b/gi, 'your current focus aligns with'],
    [/\bdominant archetype\b/gi, 'recurring theme'],
  ];

  for (const [pattern, replacement] of replacements) {
    modified = modified.replace(pattern, replacement);
  }

  return modified;
}

function downgradeCausalLanguage(text: string): string {
  let modified = text;

  // Soften causal relationships
  const replacements: Array<[RegExp, string]> = [
    [/\bhelps you recover\b/gi, 'often appears near recovery'],
    [/\bcauses you to\b/gi, 'is often followed by'],
    [/\bmakes you feel\b/gi, 'often precedes feeling'],
    [/\bleads to\b/gi, 'often comes before'],
  ];

  for (const [pattern, replacement] of replacements) {
    modified = modified.replace(pattern, replacement);
  }

  return modified;
}

function sanitizePhraseAnchors(candidate: InsightCandidate): InsightCandidate {
  if (candidate.evidence.phraseHealth !== 'broken') {
    return candidate;
  }

  // If the phrase is broken, remove the direct quote logic and replace it with summarized anchoring if present
  let body = candidate.body;

  // Try to remove broken quotes like "you said '...'"
  body = body.replace(/you (said|wrote) ["'][^"']+["']/gi, 'your recent reflections suggest');
  body = body.replace(/in your own words, ["'][^"']+["']/gi, 'a recent theme in your entries is');

  return {
    ...candidate,
    body,
  };
}

export function downgradeInsight(candidate: InsightCandidate): InsightCandidate {
  let downgradedClass = candidate.class;
  let title = candidate.title;
  let body = candidate.body;

  // 1. Downgrade class if necessary (profile_inference -> emerging_pattern)
  if (candidate.class === 'profile_inference' || candidate.class === 'deep_pattern') {
    // If confidence is lower or evidence isn't strong enough, downgrade to emerging
    if (candidate.evidence.confidence < 0.88 || candidate.evidence.repeatCount < 5) {
      downgradedClass = 'emerging_pattern';
    }
  }

  // 2. Rewrite risky outputs into safer forms
  title = downgradeIdentityLanguage(title);
  body = downgradeIdentityLanguage(body);

  title = downgradeCausalLanguage(title);
  body = downgradeCausalLanguage(body);

  // 3. Handle malformed phrase anchors
  let sanitized = sanitizePhraseAnchors({
    ...candidate,
    title,
    body,
    class: downgradedClass,
  });

  return sanitized;
}
