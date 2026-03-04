// File: context/StarNotificationContext.tsx
/**
 * StarNotificationContext
 * Provides a global `showStarNotification(message)` function
 * that triggers the Skia Falling Star effect from anywhere in the app.
 *
 * Usage:
 *   const { showStarNotification } = useStarNotification();
 *   showStarNotification('A pattern of clarity is emerging');
 */

import React, { createContext, useContext, useRef, useCallback, type ReactNode } from 'react';
import SkiaFallingStarNotification, {
  type StarNotificationRef,
} from '../components/ui/SkiaFallingStarNotification';

// ── Context shape ──────────────────────────────────────────────────────────────
interface StarNotificationContextValue {
  /** Fire a falling-star notification with the given text. */
  showStarNotification: (message: string) => void;
}

const StarNotificationContext = createContext<StarNotificationContextValue>({
  showStarNotification: () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────────
export function StarNotificationProvider({ children }: { children: ReactNode }) {
  const starRef = useRef<StarNotificationRef>(null);

  const showStarNotification = useCallback((message: string) => {
    starRef.current?.show(message);
  }, []);

  return (
    <StarNotificationContext.Provider value={{ showStarNotification }}>
      {children}
      {/* Rendered above everything via absoluteFill + pointerEvents="none" */}
      <SkiaFallingStarNotification ref={starRef} />
    </StarNotificationContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useStarNotification() {
  return useContext(StarNotificationContext);
}
