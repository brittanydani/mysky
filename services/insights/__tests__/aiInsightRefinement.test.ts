const mockInvoke = jest.fn();
const mockGetSession = jest.fn();
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: mockLogger,
}));

import { enhanceKnowledgeInsightsWithAi } from '../aiInsightRefinement';
import type { GeneratedInsight } from '../types/knowledgeEngine';

const baseInsight: GeneratedInsight = {
  id: 'insight-1',
  slot: 'whatMySkyNoticed',
  slotLabel: 'What Stands Out',
  title: 'Rest Without Earning It',
  observation: 'Rest guilt is visible today.',
  pattern: 'Your system is treating rest like something that has to be justified.',
  reframe: {
    shame: 'This does not read as laziness.',
    clarity: 'It reads as a capacity signal.',
  },
  prompt: 'Where could rest be allowed before everything is finished?',
  patternKey: 'rest_capacity_001_rest_resistance',
  angleKey: 'rest_resistance_001_rest_without_earning',
  confidence: 'moderate',
  movement: 'new',
  evidence: [
    {
      source: 'journal',
      date: '2026-04-24',
      label: 'rest guilt',
      phrase: 'I feel guilty for resting and keep thinking I should do more.',
      signal: 'rest_guilt',
      intensity: 0.8,
    },
  ],
  createdAt: '2026-04-24T12:00:00Z',
};

describe('aiInsightRefinement', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoke.mockReset();
    mockGetSession.mockReset();
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.EXPO_PUBLIC_AI_KNOWLEDGE_INSIGHTS;
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
  });

  it('returns local insights without invoking the edge function when disabled', async () => {
    const result = await enhanceKnowledgeInsightsWithAi([baseInsight], { enabled: false });

    expect(result).toEqual([baseInsight]);
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('returns local insights when there is no authenticated session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    const result = await enhanceKnowledgeInsightsWithAi([baseInsight], { enabled: true });

    expect(result).toEqual([baseInsight]);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('merges valid AI refinement fields while preserving detection metadata', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: {
        generatedAt: '2026-04-24T12:01:00Z',
        insights: [
          {
            id: 'insight-1',
            title: 'Rest Before Proof',
            observation: 'Rest guilt is asking for attention today.',
            pattern: 'A part of you still wants rest to be justified first.',
            reframe: {
              shame: 'This is not laziness.',
              clarity: 'This is a capacity signal asking to be respected.',
            },
            prompt: 'What would change if rest did not need proof first?',
          },
        ],
      },
      error: null,
    });

    const result = await enhanceKnowledgeInsightsWithAi([baseInsight], {
      enabled: true,
      modelTier: 'premium',
      surface: 'today',
      date: '2026-04-24T12:00:00Z',
    });

    expect(result[0]).toMatchObject({
      id: baseInsight.id,
      patternKey: baseInsight.patternKey,
      evidence: baseInsight.evidence,
      title: 'Rest Before Proof',
      observation: 'Rest guilt is asking for attention today.',
      aiEnhanced: true,
      aiGeneratedAt: '2026-04-24T12:01:00Z',
      insightSource: 'aiRefined',
    });
    expect(mockInvoke).toHaveBeenCalledWith('knowledge-insights', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      body: expect.objectContaining({
        modelTier: 'premium',
        surface: 'today',
        insights: [
          expect.objectContaining({
            id: 'insight-1',
            patternKey: 'rest_capacity_001_rest_resistance',
          }),
        ],
      }),
    }));
  });

  it('falls back to local insights when the edge function fails', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    mockInvoke.mockResolvedValue({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: { status: 400 },
      },
    });

    const result = await enhanceKnowledgeInsightsWithAi([baseInsight], { enabled: true });

    expect(result).toEqual([baseInsight]);
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
