// File: context/InsightToastContext.tsx
// MySky — Insight Toast Context
//
// A global toast system for elegant top-of-screen insight banners.
// Triggered from any screen in the app.
//
// Usage:
//   const { showToast } = useInsightToast();
//   showToast({ text: 'You mention "Boundaries" 40% more on Tuesdays.', onTap: () => ... });

import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InsightToastPayload {
  /** Primary text content shown in the banner */
  text: string;
  /** Optional action label shown on the right (e.g., "Tap to see why") */
  actionLabel?: string;
  /** Optional callback when user taps the banner or the action */
  onTap?: () => void;
  /** Duration in ms before auto-dismiss. Default: 4500 */
  duration?: number;
  /** Icon name from Ionicons. Default: 'bulb-outline' */
  icon?: string;
  /** Accent color for icon and action. Default: gold */
  accentColor?: string;
}

interface InsightToastContextValue {
  /** Show an insight toast banner */
  showToast: (payload: InsightToastPayload) => void;
  /** Dismiss the current toast immediately */
  dismissToast: () => void;
  /** Currently visible toast, or null */
  current: InsightToastPayload | null;
  /** Whether a toast is currently visible */
  visible: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const InsightToastContext = createContext<InsightToastContextValue>({
  showToast: () => {},
  dismissToast: () => {},
  current: null,
  visible: false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function InsightToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<InsightToastPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setVisible(false);
    // Clear content after exit animation completes
    setTimeout(() => setCurrent(null), 400);
  }, []);

  const showToast = useCallback((payload: InsightToastPayload) => {
    // Cancel any pending dismiss
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    setCurrent(payload);
    setVisible(true);

    const duration = payload.duration ?? 4500;
    dismissTimerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setCurrent(null), 400);
    }, duration);
  }, []);

  return (
    <InsightToastContext.Provider value={{ showToast, dismissToast, current, visible }}>
      {children}
    </InsightToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInsightToast(): InsightToastContextValue {
  return useContext(InsightToastContext);
}
