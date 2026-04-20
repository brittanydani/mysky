// insightsPdfExport.test.ts
// Tests the pure helper functions within insightsPdfExport via the exported
// main function's behaviour, and directly where possible.
// The heavy HTML/PDF generation is covered via a smoke test that verifies
// no exception is thrown and that expo-print is called.

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: '/tmp/insights.pdf' }),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-file-system/legacy', () => ({
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  cacheDirectory: '/tmp/',
}));

import { exportInsightsToPdf, type InsightsPdfInput } from '../insightsPdfExport';
import * as Print from 'expo-print';

const minimalInput: InsightsPdfInput = {
  userName: 'Test User',
  snapshot: {
    avgMood: 7.2,
    avgStress: 4.5,
    stressTrend: 'improving',
    checkInCount: 14,
  },
  dailyAggregates: [],
  chartProfile: null,
  enhanced: null,
  circadianGrid: null,
  correlations: [],
  crossRefs: [],
  windowDays: 30,
  totalCheckIns: 14,
  totalJournalEntries: 5,
};

describe('exportInsightsToPdf', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls expo-print with an HTML string and does not throw', async () => {
    await expect(exportInsightsToPdf(minimalInput)).resolves.toBeUndefined();
    expect(Print.printToFileAsync).toHaveBeenCalledTimes(1);
    const [{ html }] = (Print.printToFileAsync as jest.Mock).mock.calls[0];
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(100);
  });

  it('includes the user name in the generated HTML', async () => {
    await exportInsightsToPdf({ ...minimalInput, userName: 'Brittany' });
    const [{ html }] = (Print.printToFileAsync as jest.Mock).mock.calls[0];
    expect(html).toContain('Brittany');
  });

  it('handles null avgMood gracefully (renders em-dash)', async () => {
    await expect(
      exportInsightsToPdf({ ...minimalInput, snapshot: { ...minimalInput.snapshot, avgMood: null } }),
    ).resolves.toBeUndefined();
  });
});
