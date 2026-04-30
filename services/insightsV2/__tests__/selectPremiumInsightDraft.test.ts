import {
  getPremiumInsightDraftByKey,
  selectPremiumInsightDraft,
} from '../selectPremiumInsightDraft';

describe('selectPremiumInsightDraft', () => {
  it('can reload a selected draft by key', () => {
    const selected = selectPremiumInsightDraft({
      date: '2026-04-30',
      category: 'restCapacity',
      seed: 'chart-a:2026-04-30',
    });

    expect(getPremiumInsightDraftByKey(selected.id)).toMatchObject({
      id: selected.id,
      title: selected.title,
      patternKey: selected.patternKey,
      angleKey: selected.angleKey,
      category: selected.category,
    });
  });

  it('does not return an avoided draft key when another category draft is available', () => {
    const first = selectPremiumInsightDraft({
      date: '2026-04-30',
      category: 'glimmersRegulation',
      seed: 'chart-a:2026-04-30:8',
    });

    const next = selectPremiumInsightDraft({
      date: '2026-05-01',
      category: 'glimmersRegulation',
      avoidDraftKeys: [first.id],
      seed: 'chart-a:2026-05-01:8',
    });

    expect(next.id).not.toBe(first.id);
  });

  it('can avoid recently used pattern and angle keys', () => {
    const first = selectPremiumInsightDraft({
      date: '2026-04-30',
      category: 'glimmersRegulation',
      seed: 'chart-a:2026-04-30:8',
    });

    const next = selectPremiumInsightDraft({
      date: '2026-05-01',
      category: 'glimmersRegulation',
      avoidPatternKeys: [first.patternKey],
      avoidAngleKeys: [first.angleKey],
      seed: 'chart-a:2026-05-01:8',
    });

    expect(next.patternKey).not.toBe(first.patternKey);
    expect(next.angleKey).not.toBe(first.angleKey);
  });
});
