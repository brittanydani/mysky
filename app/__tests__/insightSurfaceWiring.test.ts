import { readFileSync } from 'fs';
import path from 'path';

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('insight surface wiring', () => {
  it('keeps Home wired to the expanded V2 daily insight stack', () => {
    const homeSource = readRepoFile('app/(tabs)/home.tsx');
    const todayInsightInputsSource = readRepoFile('services/insights/todayInsightInputs.ts');

    expect(homeSource).toContain("import { buildInsightSurface } from '../../services/insights/buildInsightSurface'");
    expect(homeSource).toContain("import { countTodayInsightInputs } from '../../services/insights/todayInsightInputs'");
    expect(homeSource).toContain('includeKnowledgeInsight: moodInsightsEnabled && includeDailyReflections');
    expect(homeSource).toContain('includePremiumPatterns: isPremium');
    expect(homeSource).toContain('InteractionManager.runAfterInteractions');
    expect(homeSource).toContain('surface.knowledgeInsights');
    expect(homeSource).toContain('countTodayInsightInputs(surface, todayKey)');
    expect(todayInsightInputsSource).toContain('surface.recentJournalEntries');
    expect(todayInsightInputsSource).toContain('selfKnowledge.dailyReflections?.recentAnswers');
    expect(homeSource).toContain('const shouldUseSameDayHistory = hasUnconsumedRefresh && includeDailyReflections');
    expect(homeSource).toContain('setIfActive(setMoodInsightsEnabled, moodInsightsEnabled)');
    expect(homeSource).toContain('Mood pattern insights are turned off');
    expect(homeSource).toContain('visibleKnowledgeInsights.map');
    expect(homeSource).toContain('<KnowledgeInsightCard');
    expect(homeSource).toContain('availableKnowledgeInsights.slice(0, isPremium ? 2 : 1)');
    expect(homeSource).toContain('hasInsightDataToday && visibleKnowledgeInsights.length > 0');
    expect(homeSource).not.toContain('knowledgeEngineV2');
    expect(homeSource).not.toContain('runActiveKnowledgeInsight(');
    expect(homeSource).not.toContain('runActiveKnowledgeInsights(');
    expect(homeSource).not.toContain('buildTodayInsights(');
  });

  it('refreshes Today insights after all same-day insight input types', () => {
    const refreshSource = readRepoFile('services/today/todayInsightRefresh.ts');
    const journalSource = readRepoFile('app/(tabs)/journal/index.tsx');
    const sleepSource = readRepoFile('app/(tabs)/sleep.tsx');
    const reflectionSource = readRepoFile('components/DailyReflectionSection.tsx');
    const checkInSource = readRepoFile('app/(tabs)/internal-weather.tsx');

    expect(refreshSource).toContain("| 'dailyCheckIn'");
    expect(refreshSource).toContain("| 'dailyReflection'");
    expect(refreshSource).toContain("| 'journal'");
    expect(refreshSource).toContain("| 'sleep'");
    expect(journalSource).toContain("markTodayInsightsStale('journal')");
    expect(sleepSource).toContain("markTodayInsightsStale('sleep')");
    expect(reflectionSource).toContain("markTodayInsightsStale('dailyReflection')");
    expect(checkInSource).toContain("markTodayInsightsStale('dailyCheckIn')");
  });

  it('keeps premium pattern surfaces wired to V2-derived pattern data', () => {
    const patternsSource = readRepoFile('app/(tabs)/patterns.tsx');

    expect(patternsSource).toContain("import { buildInsightSurface } from '../../services/insights/buildInsightSurface'");
    expect(patternsSource).toContain('includeKnowledgeInsight: insightsEnabled');
    expect(patternsSource).toContain('includePremiumPatterns: isPremium');
    expect(patternsSource).toContain('InteractionManager.runAfterInteractions');
    expect(patternsSource).toContain('setPremiumPatterns(surface.premiumPatterns)');
    expect(patternsSource).toContain('setPremiumPatternProfile(surface.premiumPatternProfile)');
    expect(patternsSource).toContain('setPremiumWeeklyDeepDive(surface.premiumWeeklyDeepDive)');
    expect(patternsSource).toContain('setThisWeeksV2Pattern(surface.thisWeeksV2Pattern)');
    expect(patternsSource).toContain('item.narrativeQuestion');
    expect(patternsSource).toContain('premiumPatternProfile.sections.map');
    expect(patternsSource).toContain('buildPatternLibraryState(premiumPatterns)');
    expect(patternsSource).toContain('fullLibrarySections.map');
    expect(patternsSource).toContain('data={visiblePatternRows}');
    expect(patternsSource).toContain('visible={isPremium && showDeepDiveModal}');
    expect(patternsSource).toContain('visible={isPremium && showLibraryModal}');
    expect(patternsSource).toContain("router.push('/(tabs)/premium' as Href);");
    expect(patternsSource).toContain("'Unlock Pattern Profile'");
    expect(patternsSource).toContain("recordPatternMemory(");
    expect(patternsSource).toContain('recordedPatternMemoryFingerprintsRef');
    expect(patternsSource).toContain('pendingPatternMemoryFingerprintsRef');
    expect(patternsSource).not.toContain('...surface.premiumPatterns.map((item, index)');
    expect(patternsSource).not.toContain('...surface.premiumWeeklyDeepDive.map((item, index)');
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
