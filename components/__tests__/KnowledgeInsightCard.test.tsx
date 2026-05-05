jest.mock('@react-native-masked-view/masked-view', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../context/ThemeContext';
import { KnowledgeInsightCard, buildReframeText } from '../KnowledgeInsightCard';
import type { GeneratedInsight } from '../../services/insights/types/knowledgeEngine';

describe('buildReframeText', () => {
  it('does not preserve old complete reframe scaffolding', () => {
    expect(
      buildReframeText({
        shame: 'This does not read as being needy.',
        clarity: 'It reads as a generous heart learning that its own needs are valid too.',
      }),
    ).toBe('A generous heart is learning that its own needs are valid too.');
  });

  it('formats fragment reframe values without it-reads-as framing', () => {
    expect(
      buildReframeText({
        shame: 'being needy.',
        clarity: 'a generous heart learning that its own needs are valid too.',
      }),
    ).toBe('A generous heart is learning that its own needs are valid too.');
  });

  it('does not force full V2 clarity sentences into an it-reads-as frame', () => {
    expect(
      buildReframeText({
        shame: '',
        clarity: 'This may need rhythm-aware planning, not more self-criticism.',
      }),
    ).toBe('This may need rhythm-aware planning, not more self-criticism.');
  });

  it('uses clearer read wording when the compact reframe variant is selected', () => {
    expect(
      buildReframeText({
        shame: 'being lazy.',
        clarity: 'rest needs a route back into the day.',
      }),
    ).toBe('The clearer read: rest needs a route back into the day.');
  });
});

describe('KnowledgeInsightCard', () => {
  it('renders the adapted insight fields used by the app surface', () => {
    const insight: GeneratedInsight = {
      id: 'insight-1',
      slot: 'whatMySkyNoticed',
      slotLabel: 'What Stands Out',
      title: 'Low-Capacity Windows',
      observation: 'Low capacity is showing up today.',
      pattern: 'Sleep and energy may be shaping what feels possible.',
      reframe: {
        shame: '',
        clarity: 'Low capacity may be a timing signal, not a character flaw.',
      },
      prompt: 'What keeps landing in your lowest-capacity window?',
      patternKey: 'timeRhythms_lowCapacityPatterns',
      confidence: 'moderate',
      movement: 'new',
      evidence: [],
      createdAt: '2026-04-24T12:00:00Z',
    };

    const { getByText } = render(
      <ThemeProvider>
        <KnowledgeInsightCard insight={insight} />
      </ThemeProvider>,
    );

    expect(getByText('Low-Capacity Windows')).toBeTruthy();
    expect(getByText('What Stands Out')).toBeTruthy();
    expect(getByText('Low capacity is showing up today. Sleep and energy may be shaping what feels possible.')).toBeTruthy();
    expect(getByText('CLEARER READ')).toBeTruthy();
    expect(getByText('Low capacity may be a timing signal, not a character flaw.')).toBeTruthy();
    expect(getByText('QUESTION TO KEEP')).toBeTruthy();
    expect(getByText('What keeps landing in your lowest-capacity window?')).toBeTruthy();
  });

  it('can suppress a repeated weekly theme when the feed has already shown it', () => {
    const insight: GeneratedInsight = {
      id: 'insight-1',
      slot: 'relationshipMirror',
      slotLabel: 'Relationship Thread',
      title: 'Safety in Connection',
      observation: 'Consistency mattered in connection today.',
      pattern: 'The moment asked for clarity before you decided what it meant.',
      activeWeeklyTheme: 'Connection feels safest when the shift is understandable.',
      reframe: {
        shame: '',
        clarity: 'Connection carries meaningful information for you.',
      },
      prompt: 'What would make this moment easier to hold?',
      patternKey: 'relationships_001_safety_testing',
      confidence: 'moderate',
      movement: 'new',
      evidence: [],
      createdAt: '2026-04-24T12:00:00Z',
    };

    const { queryByText } = render(
      <ThemeProvider>
        <KnowledgeInsightCard insight={insight} showActiveWeeklyTheme={false} />
      </ThemeProvider>,
    );

    expect(queryByText('ACTIVE WEEKLY THEME')).toBeNull();
    expect(queryByText('Connection feels safest when the shift is understandable.')).toBeNull();
  });
});
