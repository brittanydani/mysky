jest.mock('@react-native-masked-view/masked-view', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}));

import { buildReframeText } from '../KnowledgeInsightCard';

describe('buildReframeText', () => {
  it('does not duplicate complete reframe sentences', () => {
    expect(
      buildReframeText({
        shame: 'This does not read as being needy.',
        clarity: 'It reads as a generous heart learning that its own needs are valid too.',
      }),
    ).toBe(
      'This does not read as being needy. It reads as a generous heart learning that its own needs are valid too.',
    );
  });

  it('formats fragment reframe values', () => {
    expect(
      buildReframeText({
        shame: 'being needy.',
        clarity: 'a generous heart learning that its own needs are valid too.',
      }),
    ).toBe(
      'This does not read as being needy. It reads as a generous heart learning that its own needs are valid too.',
    );
  });
});
