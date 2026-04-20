import {
  checkLowMoodPattern,
  hasSensitiveDreamContent,
  getDailyGlimmerPrompt,
  shouldSuggestRestDay,
  recordRestDayPrompt,
  updateConsecutiveLogDays,
  DREAM_SENSITIVITY_NOTICE,
  GENTLE_SUPPORT_MESSAGE,
} from '../emotionalSafety';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('../../services/storage/encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
  },
}));

jest.mock('../logger', () => ({ logger: { error: jest.fn() } }));

// ── Pure function tests ───────────────────────────────────────────────────────

describe('checkLowMoodPattern', () => {
  it('returns showSupportCard=true when 10+ of last 14 days are low (≤3)', () => {
    const moods = Array.from({ length: 10 }, (_, i) => ({ date: `2025-04-${i + 1}`, mood: 2 }));
    const extra = Array.from({ length: 4 }, (_, i) => ({ date: `2025-04-${i + 11}`, mood: 7 }));
    const result = checkLowMoodPattern([...moods, ...extra]);
    expect(result.showSupportCard).toBe(true);
    expect(result.lowDayCount).toBe(10);
  });

  it('returns showSupportCard=false when fewer than 10 days are low', () => {
    const moods = Array.from({ length: 5 }, (_, i) => ({ date: `2025-04-${i + 1}`, mood: 2 }));
    const rest = Array.from({ length: 9 }, (_, i) => ({ date: `2025-04-${i + 6}`, mood: 7 }));
    const result = checkLowMoodPattern([...moods, ...rest]);
    expect(result.showSupportCard).toBe(false);
  });

  it('only considers the last 14 entries', () => {
    // 15 low moods, but only last 14 matter — 14 ≥ 10 so should show
    const moods = Array.from({ length: 15 }, (_, i) => ({ date: `2025-04-${i + 1}`, mood: 1 }));
    const result = checkLowMoodPattern(moods);
    expect(result.showSupportCard).toBe(true);
    expect(result.lowDayCount).toBe(14);
  });
});

describe('hasSensitiveDreamContent', () => {
  it('returns true for text containing sensitive keywords', () => {
    expect(hasSensitiveDreamContent('I dreamt about death')).toBe(true);
    expect(hasSensitiveDreamContent('There was violence everywhere')).toBe(true);
    expect(hasSensitiveDreamContent('Trauma surfaced in the dream')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(hasSensitiveDreamContent('DEATH was in my dream')).toBe(true);
    expect(hasSensitiveDreamContent('Blood and rain')).toBe(true);
  });

  it('returns false for benign dream content', () => {
    expect(hasSensitiveDreamContent('I flew over a forest')).toBe(false);
    expect(hasSensitiveDreamContent('Had a calm ocean dream')).toBe(false);
  });
});

describe('getDailyGlimmerPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = getDailyGlimmerPrompt();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('returns the same prompt on same day', () => {
    expect(getDailyGlimmerPrompt()).toBe(getDailyGlimmerPrompt());
  });
});

describe('DREAM_SENSITIVITY_NOTICE', () => {
  it('is a non-empty string', () => {
    expect(typeof DREAM_SENSITIVITY_NOTICE).toBe('string');
    expect(DREAM_SENSITIVITY_NOTICE.length).toBeGreaterThan(0);
  });
});

describe('GENTLE_SUPPORT_MESSAGE', () => {
  it('has title, body, and cta fields', () => {
    expect(GENTLE_SUPPORT_MESSAGE.title).toBeTruthy();
    expect(GENTLE_SUPPORT_MESSAGE.body).toBeTruthy();
    expect(GENTLE_SUPPORT_MESSAGE.cta).toBeTruthy();
  });
});

// ── Async function tests ──────────────────────────────────────────────────────

describe('shouldSuggestRestDay', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns false when consecutive days < 7', async () => {
    mockGetItem.mockResolvedValueOnce('5'); // consecutiveDays
    expect(await shouldSuggestRestDay()).toBe(false);
  });

  it('returns true when consecutive days >= 7 and no recent prompt', async () => {
    mockGetItem
      .mockResolvedValueOnce('8')   // consecutiveDays
      .mockResolvedValueOnce(null); // lastRestPrompt
    expect(await shouldSuggestRestDay()).toBe(true);
  });

  it('returns false when prompted within the last 3 days', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    mockGetItem
      .mockResolvedValueOnce('10')       // consecutiveDays
      .mockResolvedValueOnce(twoDaysAgo); // lastRestPrompt
    expect(await shouldSuggestRestDay()).toBe(false);
  });

  it('returns false and does not throw when storage fails', async () => {
    mockGetItem.mockRejectedValue(new Error('Storage error'));
    expect(await shouldSuggestRestDay()).toBe(false);
  });
});

describe('recordRestDayPrompt', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets both the prompt date and resets consecutive days to 0', async () => {
    mockSetItem.mockResolvedValue(undefined);
    await recordRestDayPrompt();
    expect(mockSetItem).toHaveBeenCalledWith(
      '@mysky:last_rest_prompt',
      expect.any(String),
    );
    expect(mockSetItem).toHaveBeenCalledWith('@mysky:consecutive_log_days', '0');
  });
});

describe('updateConsecutiveLogDays', () => {
  beforeEach(() => jest.clearAllMocks());

  it('increments the counter when didLogToday=true', async () => {
    mockGetItem.mockResolvedValue('4');
    mockSetItem.mockResolvedValue(undefined);
    await updateConsecutiveLogDays(true);
    expect(mockSetItem).toHaveBeenCalledWith('@mysky:consecutive_log_days', '5');
  });

  it('resets the counter to 0 when didLogToday=false', async () => {
    mockSetItem.mockResolvedValue(undefined);
    await updateConsecutiveLogDays(false);
    expect(mockSetItem).toHaveBeenCalledWith('@mysky:consecutive_log_days', '0');
  });
});
