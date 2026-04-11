import React from 'react';
import {
  KeyboardAvoidingView,
  NativeModules,
  Platform,
  ScrollView,
  TurboModuleRegistry,
  type ScrollViewProps,
  View,
  type ViewProps,
} from 'react-native';

type KeyboardProviderProps = React.PropsWithChildren<{
  preload?: boolean;
}>;

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  bottomOffset?: number;
  extraKeyboardSpace?: number;
  disableScrollOnKeyboardHide?: boolean;
};

type KeyboardStickyViewProps = React.PropsWithChildren<
  ViewProps & {
    offset?: {
      closed?: number;
      opened?: number;
    };
  }
>;

type KeyboardControllerModule = {
  KeyboardAwareScrollView?: React.ComponentType<KeyboardAwareScrollViewProps>;
  KeyboardProvider?: React.ComponentType<KeyboardProviderProps>;
  KeyboardStickyView?: React.ComponentType<KeyboardStickyViewProps>;
};

let keyboardControllerModule: KeyboardControllerModule | null | undefined;

function hasNativeKeyboardControllerModule() {
  const turboModule = TurboModuleRegistry.get?.('KeyboardController');
  const legacyModule = (NativeModules as Record<string, unknown>).KeyboardController;

  return Boolean(turboModule ?? legacyModule);
}

function getKeyboardControllerModule(): KeyboardControllerModule | null {
  if (keyboardControllerModule !== undefined) {
    return keyboardControllerModule;
  }

  if (!hasNativeKeyboardControllerModule()) {
    keyboardControllerModule = null;
    return keyboardControllerModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    keyboardControllerModule = require('react-native-keyboard-controller') as KeyboardControllerModule;
  } catch {
    keyboardControllerModule = null;
  }

  return keyboardControllerModule;
}

function getNativeKeyboardProvider() {
  try {
    return getKeyboardControllerModule()?.KeyboardProvider ?? null;
  } catch {
    return null;
  }
}

function getNativeKeyboardAwareScrollView() {
  try {
    return getKeyboardControllerModule()?.KeyboardAwareScrollView ?? null;
  } catch {
    return null;
  }
}

function getNativeKeyboardStickyView() {
  try {
    return getKeyboardControllerModule()?.KeyboardStickyView ?? null;
  } catch {
    return null;
  }
}

export function KeyboardProvider({ children, ...props }: KeyboardProviderProps) {
  const NativeKeyboardProvider = getNativeKeyboardProvider();

  if (NativeKeyboardProvider) {
    return <NativeKeyboardProvider {...props}>{children}</NativeKeyboardProvider>;
  }

  return <>{children}</>;
}

export function KeyboardAwareScrollView({
  bottomOffset = 0,
  contentContainerStyle,
  extraKeyboardSpace = 0,
  ...props
}: KeyboardAwareScrollViewProps) {
  const NativeKeyboardAwareScrollView = getNativeKeyboardAwareScrollView();

  if (NativeKeyboardAwareScrollView) {
    return (
      <NativeKeyboardAwareScrollView
        bottomOffset={bottomOffset}
        contentContainerStyle={contentContainerStyle}
        extraKeyboardSpace={extraKeyboardSpace}
        {...props}
      />
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView
        {...props}
        contentContainerStyle={[
          contentContainerStyle,
          extraKeyboardSpace || bottomOffset
            ? { paddingBottom: extraKeyboardSpace + bottomOffset }
            : null,
        ]}
      />
    </KeyboardAvoidingView>
  );
}

export function KeyboardStickyView({ children, ...props }: KeyboardStickyViewProps) {
  const NativeKeyboardStickyView = getNativeKeyboardStickyView();

  if (NativeKeyboardStickyView) {
    return <NativeKeyboardStickyView {...props}>{children}</NativeKeyboardStickyView>;
  }

  return <View {...props}>{children}</View>;
}