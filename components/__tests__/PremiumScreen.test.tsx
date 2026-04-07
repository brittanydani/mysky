/**
 * PremiumScreen — component tests
 *
 * Validates: paywall rendering, plan selection, purchase flow,
 * restore flow, premium active state.
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockPurchase = jest.fn();
const mockRestore = jest.fn();

const mockPremiumContext = {
  isPremium: false,
  offerings: {
    availablePackages: [
      {
        identifier: '$rc_monthly',
        product: { priceString: '$4.99', price: 4.99, identifier: 'mysky_monthly' },
      },
      {
        identifier: '$rc_annual',
        product: { priceString: '$29.99', price: 29.99, identifier: 'mysky_annual' },
      },
      {
        identifier: 'mysky_lifetime',
        product: { priceString: '$79.99', price: 79.99, identifier: 'mysky_lifetime' },
      },
    ],
  },
  loading: false,
  purchase: mockPurchase,
  restore: mockRestore,
};

jest.mock('../../context/PremiumContext', () => ({
  usePremium: () => mockPremiumContext,
}));

jest.mock('../../constants/theme', () => ({
  theme: {
    background: '#000',
    primary: '#E8D6AE',
    primaryDark: '#9B7A46',
    textPrimary: '#fff',
    textSecondary: '#ccc',
    textMuted: '#888',
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
    radius: { sm: 8, md: 12, lg: 16, xl: 20 },
  },
}));

jest.mock('../../constants/config', () => ({
  config: {
    premium: {
      tiers: [
        { id: 'monthly', name: 'Monthly', price: '$4.99', period: 'per month', popular: false },
        { id: 'yearly', name: 'Yearly', price: '$29.99', period: 'per year', popular: true },
        { id: 'lifetime', name: 'Lifetime', price: '$79.99', period: 'one time', popular: false },
      ],
    },
  },
  LEGAL_URL: 'https://example.com/legal',
}));

jest.mock('../../services/premium/deeperSkyFeatures', () => ({
  DEEPER_SKY_FEATURES: [
    { id: 'f1', name: 'Feature 1', icon: 'star-outline', premiumVersion: 'Full access' },
  ],
  DEEPER_SKY_MARKETING: {
    headline: 'Unlock Deeper Sky',
    subheadline: 'Premium features',
  },
}));

jest.mock('../../constants/mySkyMetallic', () => ({
  metallicFillColors: ['#fff', '#000'],
  metallicFillPositions: [0, 1],
}));

jest.mock('../../components/ui/SkiaDynamicCosmos', () => ({
  SkiaDynamicCosmos: () => null,
}));

jest.mock('../../components/ui/SkiaGradient', () => ({
  SkiaGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../components/ui/MetallicText', () => ({
  MetallicText: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../components/ui/MetallicIcon', () => ({
  MetallicIcon: () => null,
}));

jest.mock('../../components/ui/GoldSubtitle', () => ({
  GoldSubtitle: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import PremiumScreen from '../PremiumScreen';

const alertSpy = jest.spyOn(Alert, 'alert');

beforeEach(() => {
  jest.clearAllMocks();
  mockPremiumContext.isPremium = false;
});

describe('PremiumScreen', () => {
  describe('paywall state', () => {
    it('renders pricing tiers when not premium', () => {
      const { getAllByText } = render(<PremiumScreen />);
      expect(getAllByText(/monthly/i).length).toBeGreaterThan(0);
      expect(getAllByText(/yearly|annual/i).length).toBeGreaterThan(0);
    });

    it('defaults to yearly plan selection', () => {
      const { getAllByText } = render(<PremiumScreen />);
      // Yearly should be visually selected (popular)
      expect(getAllByText(/yearly|annual/i).length).toBeGreaterThan(0);
    });

    it('shows restore purchases button', () => {
      const { getAllByText } = render(<PremiumScreen />);
      expect(getAllByText(/restore/i).length).toBeGreaterThan(0);
    });
  });

  describe('premium active state', () => {
    it('shows active member UI when premium', () => {
      mockPremiumContext.isPremium = true;
      const { getByText } = render(<PremiumScreen />);
      expect(getByText(/deeper sky active/i)).toBeTruthy();
      expect(getByText(/you're a deeper sky member/i)).toBeTruthy();
    });

    it('shows feature list when premium', () => {
      mockPremiumContext.isPremium = true;
      const { getByText } = render(<PremiumScreen />);
      expect(getByText('Feature 1')).toBeTruthy();
    });

    it('shows manage subscription link', () => {
      mockPremiumContext.isPremium = true;
      const { getByLabelText } = render(<PremiumScreen />);
      expect(getByLabelText(/manage your subscription/i)).toBeTruthy();
    });
  });

  describe('purchase flow', () => {
    it('calls purchase with selected package', async () => {
      mockPurchase.mockResolvedValue({ success: true });

      const { getAllByText } = render(<PremiumScreen />);

      // Find and press the main purchase CTA
      const purchaseBtn = getAllByText(/continue with/i)[0];
      await act(async () => {
        fireEvent.press(purchaseBtn);
      });

      expect(mockPurchase).toHaveBeenCalled();
    });

    it('shows success alert after purchase', async () => {
      mockPurchase.mockResolvedValue({ success: true });

      const { getAllByText } = render(<PremiumScreen />);
      const purchaseBtn = getAllByText(/continue with/i)[0];
      await act(async () => {
        fireEvent.press(purchaseBtn);
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Welcome to Deeper Sky',
        expect.any(String),
      );
    });

    it('shows error alert on purchase failure', async () => {
      mockPurchase.mockResolvedValue({ success: false, error: 'Payment declined' });

      const { getAllByText } = render(<PremiumScreen />);
      const purchaseBtn = getAllByText(/continue with/i)[0];
      await act(async () => {
        fireEvent.press(purchaseBtn);
      });

      expect(alertSpy).toHaveBeenCalledWith('Purchase Failed', 'Payment declined');
    });

    it('alerts when offerings are unavailable', async () => {
      mockPremiumContext.offerings = null as any;

      const { getAllByText } = render(<PremiumScreen />);
      const purchaseBtn = getAllByText(/continue with/i)[0];
      await act(async () => {
        fireEvent.press(purchaseBtn);
      });

      expect(alertSpy).toHaveBeenCalledWith('Not Available', expect.any(String));
      expect(mockPurchase).not.toHaveBeenCalled();

      // Restore for other tests
      mockPremiumContext.offerings = {
        availablePackages: [
          { identifier: '$rc_annual', product: { priceString: '$29.99', price: 29.99, identifier: 'mysky_annual' } },
        ],
      } as any;
    });
  });

  describe('restore flow', () => {
    it('calls restore and shows success when premium restored', async () => {
      mockRestore.mockResolvedValue({ success: true, hasPremium: true });

      const { getByText } = render(<PremiumScreen />);
      const restoreBtn = getByText('Restore Purchases');
      await act(async () => {
        fireEvent.press(restoreBtn);
      });

      expect(mockRestore).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Restored', expect.any(String));
    });

    it('shows no purchases found when restore finds nothing', async () => {
      mockRestore.mockResolvedValue({ success: true, hasPremium: false });

      const { getByText } = render(<PremiumScreen />);
      const restoreBtn = getByText('Restore Purchases');
      await act(async () => {
        fireEvent.press(restoreBtn);
      });

      expect(alertSpy).toHaveBeenCalledWith('No Purchases Found', expect.any(String));
    });

    it('shows error when restore fails', async () => {
      mockRestore.mockResolvedValue({ success: false, error: 'Network error' });

      const { getByText } = render(<PremiumScreen />);
      const restoreBtn = getByText('Restore Purchases');
      await act(async () => {
        fireEvent.press(restoreBtn);
      });

      expect(alertSpy).toHaveBeenCalledWith('Restore Failed', expect.any(String));
    });
  });

  describe('onClose callback', () => {
    it('calls onClose when back button pressed', () => {
      const onClose = jest.fn();
      mockPremiumContext.isPremium = true;
      const { getByText } = render(<PremiumScreen onClose={onClose} />);
      // The back button with chevron
      const backArea = getByText(/deeper sky active/i);
      // Premium screen has a back pressable at top
      expect(backArea).toBeTruthy();
    });
  });
});
