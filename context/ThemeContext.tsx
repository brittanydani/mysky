import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme, type StyleSheet } from 'react-native';
import { darkTheme, lightTheme, type AppTheme } from '../constants/theme';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedThemeMode = 'light' | 'dark';

const THEME_PREFERENCE_KEY = 'pref_theme_mode';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedMode: ResolvedThemeMode;
  theme: AppTheme;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveThemeMode(preference: ThemePreference, systemScheme: ReturnType<typeof useColorScheme>): ResolvedThemeMode {
  if (preference === 'system') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }

  return preference;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('dark');

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedMode = resolveThemeMode(preference, systemScheme);

    return {
      preference,
      resolvedMode,
      theme: resolvedMode === 'light' ? lightTheme : darkTheme,
      setPreference: async (nextPreference: ThemePreference) => {
        setPreferenceState(nextPreference);
        await AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextPreference);
      },
    };
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContextValue() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('ThemeContext is not available. Wrap the app in ThemeProvider.');
  }

  return value;
}

export function useAppTheme() {
  return useThemeContextValue().theme;
}

export function useThemePreference() {
  const { preference, resolvedMode, setPreference } = useThemeContextValue();
  return { preference, resolvedMode, setPreference };
}

type NamedStyles<T> = { [P in keyof T]: import('react-native').ViewStyle | import('react-native').TextStyle | import('react-native').ImageStyle };

export function useThemedStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  createStyles: (theme: AppTheme) => T,
): T {
  const activeTheme = useAppTheme();
  return useMemo(() => createStyles(activeTheme), [activeTheme, createStyles]);
}