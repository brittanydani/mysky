import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

function loadKeyboardCompat(options?: { native?: boolean }) {
  jest.resetModules();

  jest.doMock('react-native', () => {
    const React = jest.requireActual('react');
    const makeComponent = (name: string) => {
      const MockComponent = ({ children, ...props }: any) => React.createElement(name, props, children);
      MockComponent.displayName = `${name}Mock`;
      return MockComponent;
    };
    return {
      KeyboardAvoidingView: makeComponent('KeyboardAvoidingView'),
      ScrollView: makeComponent('ScrollView'),
      View: makeComponent('View'),
      NativeModules: options?.native
        ? { KeyboardController: {} }
        : {},
      Platform: { OS: 'ios' },
      TurboModuleRegistry: { get: jest.fn(() => (options?.native ? {} : null)) },
    };
  });

  if (options?.native) {
    jest.doMock('react-native-keyboard-controller', () => {
      const React = jest.requireActual('react');
      const KeyboardProvider = ({ children, preload }: any) => (
        React.createElement('native-provider', { testID: 'native-provider', accessibilityLabel: String(preload) }, children)
      );
      KeyboardProvider.displayName = 'KeyboardProviderMock';

      const KeyboardAwareScrollView = ({ children, bottomOffset, extraKeyboardSpace }: any) => (
        React.createElement('native-scroll', { testID: 'native-scroll', accessibilityLabel: `${bottomOffset}:${extraKeyboardSpace}` }, children)
      );
      KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollViewMock';

      const KeyboardStickyView = ({ children }: any) => (
        React.createElement('native-sticky', { testID: 'native-sticky' }, children)
      );
      KeyboardStickyView.displayName = 'KeyboardStickyViewMock';

      return {
        KeyboardProvider,
        KeyboardAwareScrollView,
        KeyboardStickyView,
      };
    });
  }

  let mod: typeof import('../KeyboardControllerCompat');
  jest.isolateModules(() => {
    mod = jest.requireActual('../KeyboardControllerCompat') as typeof import('../KeyboardControllerCompat');
  });

  return mod!;
}

describe('KeyboardControllerCompat', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('react-native');
    jest.dontMock('react-native-keyboard-controller');
  });

  it('falls back to rendering children directly when no native provider exists', () => {
    const { KeyboardProvider } = loadKeyboardCompat();
    let tree!: { root: any };
    act(() => {
      tree = TestRenderer.create(
        <KeyboardProvider preload={false}>
          {React.createElement('child-text', null, 'fallback child')}
        </KeyboardProvider>,
      );
    });

    expect(tree.root.findByType('child-text').children).toContain('fallback child');
  });

  it('falls back to keyboard avoiding + scroll behavior when the native scroll view is unavailable', () => {
    const { KeyboardAwareScrollView } = loadKeyboardCompat();
    let tree!: { root: any };
    act(() => {
      tree = TestRenderer.create(
        <KeyboardAwareScrollView bottomOffset={12} extraKeyboardSpace={20} contentContainerStyle={{ paddingTop: 10 }}>
          {React.createElement('child-text', null, 'scroll child')}
        </KeyboardAwareScrollView>,
      );
    });

    const scrollView = tree.root.findByType('ScrollView');
    expect(scrollView.props.contentContainerStyle).toEqual([
      { paddingTop: 10 },
      { paddingBottom: 32 },
    ]);
  });

  it('uses native keyboard controller components when the native module is available', () => {
    const { KeyboardAwareScrollView, KeyboardProvider, KeyboardStickyView } = loadKeyboardCompat({ native: true });
    let tree!: { root: any };
    act(() => {
      tree = TestRenderer.create(
        <KeyboardProvider preload={false}>
          <KeyboardAwareScrollView bottomOffset={8} extraKeyboardSpace={14}>
            <KeyboardStickyView>
              {React.createElement('child-text', null, 'native child')}
            </KeyboardStickyView>
          </KeyboardAwareScrollView>
        </KeyboardProvider>,
      );
    });

    expect(tree.root.findByProps({ testID: 'native-provider' })).toBeTruthy();
    expect(tree.root.findByProps({ testID: 'native-scroll' }).props.accessibilityLabel).toBe('8:14');
    expect(tree.root.findByProps({ testID: 'native-sticky' })).toBeTruthy();
    expect(tree.root.findByType('child-text').children).toContain('native child');
  });
});