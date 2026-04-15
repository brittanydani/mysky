/* global jest */

// Define React Native globals
global.__DEV__ = true;

// Silence Animated / Reanimated warnings in test output
const chainable = () => {
  const obj = {};
  const handler = { get: () => (..._args) => new Proxy(obj, handler) };
  return new Proxy(obj, handler);
};

jest.mock('react-native-reanimated', () => {
  const { View, Text, ScrollView, Image, FlatList } = require('react-native');
  return {
    __esModule: true,
    default: {
      call: jest.fn(),
      createAnimatedComponent: (c) => c,
      View,
      Text,
      ScrollView,
      Image,
      FlatList,
    },
    useSharedValue: (v) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn) => ({ value: fn() }),
    useAnimatedScrollHandler: () => jest.fn(),
    withTiming: (v) => v,
    withSpring: (v) => v,
    withDelay: (_, v) => v,
    withSequence: (...args) => args[args.length - 1],
    withRepeat: (v) => v,
    Easing: { bezier: () => jest.fn(), linear: jest.fn(), ease: jest.fn(), inOut: (value) => value },
    FadeIn: chainable(),
    FadeOut: chainable(),
    FadeInDown: chainable(),
    FadeInUp: chainable(),
    SlideInRight: chainable(),
    SlideOutLeft: chainable(),
    Layout: chainable(),
    cancelAnimation: jest.fn(),
    createAnimatedComponent: (c) => c,
    interpolate: jest.fn(),
    Extrapolation: { CLAMP: 'clamp' },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }) => children,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children }) => children,
}));

jest.mock('expo-constants', () => ({
  expoConfig: { ios: { bundleIdentifier: 'com.test.mysky' }, extra: {} },
}));

jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }) => children,
  Group: ({ children }) => children,
  Circle: () => null,
  Path: () => null,
  Line: () => null,
  LinearGradient: () => null,
  Shadow: () => null,
  Text: () => null,
  useFont: () => null,
  Skia: { Path: { Make: () => ({}) } },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => children,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  Href: {},
}));

jest.mock('react-native-purchases', () => ({
  default: {
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
    setLogLevel: jest.fn(),
    configure: jest.fn(),
  },
  LOG_LEVEL: { VERBOSE: 0, WARN: 3 },
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
      setItem: jest.fn(async (key, value) => {
        store.set(key, value);
      }),
      removeItem: jest.fn(async (key) => {
        store.delete(key);
      }),
      clear: jest.fn(async () => {
        store.clear();
      }),
      getAllKeys: jest.fn(async () => [...store.keys()]),
      multiGet: jest.fn(async (keys) => keys.map((key) => [key, store.has(key) ? store.get(key) : null])),
      multiSet: jest.fn(async (entries) => {
        for (const [key, value] of entries) {
          store.set(key, value);
        }
      }),
      multiRemove: jest.fn(async (keys) => {
        for (const key of keys) {
          store.delete(key);
        }
      }),
    },
  };
});

jest.mock('./context/ThemeContext', () => {
  const actualTheme = jest.requireActual('./constants/theme');
  return {
    ThemeProvider: ({ children }) => children,
    useAppTheme: () => actualTheme.darkTheme,
    useThemedStyles: (createStyles) => createStyles(actualTheme.darkTheme),
    useThemePreference: () => ({
      preference: 'dark',
      resolvedMode: 'dark',
      setPreference: jest.fn().mockResolvedValue(undefined),
    }),
  };
});
