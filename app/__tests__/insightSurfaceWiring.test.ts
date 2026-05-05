import { readFileSync } from 'fs';
import path from 'path';

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('insight surface wiring', () => {
  it('keeps Home wired to the expanded V2 daily insight stack', () => {
    const homeSource = readRepoFile('app/(tabs)/home.tsx');

    expect(homeSource).toContain("import { buildInsightSurface } from '../../services/insights/buildInsightSurface'");
    expect(homeSource).toContain('includeKnowledgeInsight: moodInsightsEnabled');
    expect(homeSource).toContain('surface.knowledgeInsights');
    expect(homeSource).toContain('visibleKnowledgeInsights.map');
    expect(homeSource).toContain('<KnowledgeInsightCard');
    expect(homeSource).toContain('availableKnowledgeInsights.slice(0, isPremium ? 2 : 1)');
    expect(homeSource).not.toContain('knowledgeEngineV2');
    expect(homeSource).not.toContain('runActiveKnowledgeInsight(');
    expect(homeSource).not.toContain('runActiveKnowledgeInsights(');
    expect(homeSource).not.toContain('buildTodayInsights(');
  });

  it('keeps premium pattern surfaces wired to V2-derived pattern data', () => {
    const patternsSource = readRepoFile('app/(tabs)/patterns.tsx');

    expect(patternsSource).toContain("import { buildInsightSurface } from '../../services/insights/buildInsightSurface'");
    expect(patternsSource).toContain('includeKnowledgeInsight: insightsEnabled');
    expect(patternsSource).toContain('setPremiumPatterns(surface.premiumPatterns)');
    expect(patternsSource).toContain('setPremiumPatternProfile(surface.premiumPatternProfile)');
    expect(patternsSource).toContain('setPremiumWeeklyDeepDive(surface.premiumWeeklyDeepDive)');
    expect(patternsSource).toContain('setThisWeeksV2Pattern(surface.thisWeeksV2Pattern)');
    expect(patternsSource).toContain('item.narrativeQuestion');
    expect(patternsSource).toContain('premiumPatternProfile.sections.map');
    expect(patternsSource).toContain('buildPatternLibraryState(premiumPatterns)');
    expect(patternsSource).toContain('fullLibrarySections.map');
    expect(patternsSource).not.toContain('knowledgeEngineV2');
    expect(patternsSource).not.toContain('runActiveKnowledgeInsight(');
    expect(patternsSource).not.toContain('runActiveKnowledgeInsights(');
    expect(patternsSource).not.toContain('buildTodayInsights(');
  });

  it('keeps the active insight router pointed at the current V2 builder', () => {
    const surfaceSource = readRepoFile('services/insights/buildInsightSurface.ts');
    const routerSource = readRepoFile('services/insights/knowledgeInsightRouter.ts');

    expect(surfaceSource).toContain("await import('./knowledgeInsightRouter')");
    expect(surfaceSource).toContain('runActiveKnowledgeInsights({');
    expect(routerSource).toContain("import { buildTodayInsights } from '../insightsV2/buildTodayInsights'");
    expect(routerSource).toContain('return await runV2KnowledgeInsights(input)');
    expect(routerSource).not.toContain("from '../insightsV2/knowledgeEngineV2'");
    expect(routerSource).not.toContain('dailyAngles');
    expect(routerSource).not.toContain('copyFrame');
  });
});
