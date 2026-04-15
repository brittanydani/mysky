import { personalizeLifeThemeSummary } from '../(tabs)/chartHelpers';

describe('chartHelpers', () => {
  it('personalizes relationship summaries', () => {
    expect(personalizeLifeThemeSummary('relationship', 'You need warmth and honesty.'))
      .toContain('connection is not casual for you');
  });

  it('personalizes career summaries', () => {
    expect(personalizeLifeThemeSummary('career', 'You work best with autonomy.'))
      .toContain('feels personally meaningful');
  });

  it('personalizes emotional summaries', () => {
    expect(personalizeLifeThemeSummary('emotional', 'You process slowly.'))
      .toContain('Your inner world has its own rhythm');
  });

  it('uses the shadow fallback for growth summaries', () => {
    expect(personalizeLifeThemeSummary('shadow', 'Growth asks for honesty.'))
      .toContain('how growth usually arrives');
  });
});