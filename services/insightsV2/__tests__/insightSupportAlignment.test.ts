import {
  anchorToNaturalPhrase,
  humanizeInsightParagraphBody,
  humanizeSubcategoryPhrase,
  isSupportTextAligned,
  scoreSupportAlignment,
} from '../generated/insightSupportAlignment';

describe('insightSupportAlignment', () => {
  it('humanizes raw taxonomy phrases before user-facing display', () => {
    expect(
      humanizeInsightParagraphBody('You adjust around tension pattern, even if the adjustment stays private.'),
    ).toContain('tension in your body');
    expect(
      humanizeInsightParagraphBody('When usefulness worth asks for more access than you have, the moment can look ordinary.'),
    ).toContain('your worth starts feeling tied to being useful');
    expect(
      humanizeInsightParagraphBody('When does belief about worth start pulling in two directions?'),
    ).toContain('the question of being enough');
    expect(humanizeSubcategoryPhrase('effortDoubt')).toBe('the doubt that trying will change anything');
    expect(anchorToNaturalPhrase('body-before-words')).toBe('your body noticing before words arrive');
  });

  it('scores support copy by overlap with the selected insight', () => {
    const insight = {
      category: 'lifeDirection',
      majorDomain: 'learnedAgency',
      insightSubcategory: 'actionRecovery',
      patternType: 'pushPull',
      anchors: ['future-pressure', 'clarity-before-movement'],
      tags: ['direction', 'future', 'choice'],
      signalTypes: ['journal', 'reflectionBank', 'next_step'],
      body: 'Movement begins returning after a stuck place.',
    };

    const aligned = 'One small effort is allowed to count, even before you know whether it will change everything.';
    const unrelated = 'Wanting closeness and needing space can exist at the same time.';

    expect(isSupportTextAligned(aligned, insight)).toBe(true);
    expect(scoreSupportAlignment(aligned, insight)).toBeGreaterThan(scoreSupportAlignment(unrelated, insight));
    expect(isSupportTextAligned(unrelated, insight)).toBe(false);
  });
});
