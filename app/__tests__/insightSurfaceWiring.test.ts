import { readFileSync } from 'fs';
import path from 'path';

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('insight surface wiring', () => {
  it('keeps Home wired to the expanded V2 daily insight stack', () => {
    const homeSource = readRepoFile('app/(tabs)/home.tsx');

    expect(homeSource).toContain('surface.knowledgeInsights');
    expect(homeSource).toContain('visibleKnowledgeInsights.map');
    expect(homeSource).toContain('<KnowledgeInsightCard');
    expect(homeSource).toContain('availableKnowledgeInsights.slice(0, isPremium ? 2 : 1)');
  });

  it('keeps premium pattern surfaces wired to V2-derived pattern data', () => {
    const patternsSource = readRepoFile('app/(tabs)/patterns.tsx');

    expect(patternsSource).toContain('setPremiumPatterns(surface.premiumPatterns)');
    expect(patternsSource).toContain('setPremiumPatternProfile(surface.premiumPatternProfile)');
    expect(patternsSource).toContain('setPremiumWeeklyDeepDive(surface.premiumWeeklyDeepDive)');
    expect(patternsSource).toContain('setThisWeeksV2Pattern(surface.thisWeeksV2Pattern)');
    expect(patternsSource).toContain('premiumPatternProfile.sections.map');
    expect(patternsSource).toContain('buildPatternLibraryState(premiumPatterns)');
    expect(patternsSource).toContain('fullLibrarySections.map');
  });
});
