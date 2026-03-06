import React, { createContext, useContext } from 'react';
import { useSharedValue, SharedValue } from 'react-native-reanimated';

type ScrollContextType = {
  navBarTranslateY: SharedValue<number>;
};

const ScrollContext = createContext<ScrollContextType | null>(null);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const navBarTranslateY = useSharedValue(0);
  return (
    <ScrollContext.Provider value={{ navBarTranslateY }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollStore() {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error("Missing ScrollProvider");
  return ctx;
}
