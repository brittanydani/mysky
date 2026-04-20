jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn().mockResolvedValue({ uri: '/tmp/chart.pdf' }),
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

import { exportChartToPdf } from '../pdfExport';
import * as Print from 'expo-print';
import type { NatalChart } from '../../astrology/types';

function makeChart(overrides: Partial<NatalChart> = {}): NatalChart {
  return {
    name: 'Test User',
    sunSign: { name: 'Aries', symbol: '♈', element: 'fire', modality: 'cardinal', rulingPlanet: 'Mars' },
    moonSign: { name: 'Taurus', symbol: '♉', element: 'earth', modality: 'fixed', rulingPlanet: 'Venus' },
    risingSign: { name: 'Gemini', symbol: '♊', element: 'air', modality: 'mutable', rulingPlanet: 'Mercury' },
    birthData: {
      date: '1990-06-15',
      time: '08:30',
      hasUnknownTime: false,
      location: 'Detroit, MI',
      place: 'Detroit, MI',
      latitude: 42.33,
      longitude: -83.05,
      timezone: 'America/Detroit',
    },
    placements: [],
    houseCusps: [],
    aspects: [],
    planets: [],
    houses: [],
    ...overrides,
  } as unknown as NatalChart;
}

describe('exportChartToPdf', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls expo-print and does not throw', async () => {
    await expect(exportChartToPdf(makeChart(), [])).resolves.toBeUndefined();
    expect(Print.printToFileAsync).toHaveBeenCalledTimes(1);
  });

  it('generates HTML that contains the chart subject name', async () => {
    await exportChartToPdf(makeChart({ name: 'Alex' }), []);
    const [{ html }] = (Print.printToFileAsync as jest.Mock).mock.calls[0];
    expect(html).toContain('Alex');
  });

  it('handles empty planets and aspects arrays without throwing', async () => {
    await expect(exportChartToPdf(makeChart(), [])).resolves.toBeUndefined();
  });
});
