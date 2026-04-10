import React, { useCallback } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { VelvetGlassSurface } from './VelvetGlassSurface';

const PRESS_SCALE = 0.97;
const SPRING_CONFIG = { damping: 18, stiffness: 280, mass: 0.8 };

interface VelvetGlassCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Skip the press-down scale for purely decorative containers */
  interactive?: boolean;
  intensity?: number;
  backgroundColor?: string;
  topEdgeColor?: string;
  borderColor?: string;
}

export function VelvetGlassCard({
  children,
  onPress,
  style,
  interactive = true,
  intensity,
  backgroundColor,
  topEdgeColor,
  borderColor,
}: VelvetGlassCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onBegin(() => {
      if (!interactive) return;
      scale.value = withSpring(PRESS_SCALE, SPRING_CONFIG);
    })
    .onFinalize((_, success) => {
      if (!interactive) return;
      scale.value = withSpring(1.0, SPRING_CONFIG);
      if (success && onPress) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }
    });

  if (!interactive || !onPress) {
    return (
      <VelvetGlassSurface
        style={style}
        intensity={intensity}
        backgroundColor={backgroundColor}
        topEdgeColor={topEdgeColor}
        borderColor={borderColor}
      >
        {children}
      </VelvetGlassSurface>
    );
  }

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={animatedStyle}>
        <VelvetGlassSurface
          style={style}
          intensity={intensity}
          backgroundColor={backgroundColor}
          topEdgeColor={topEdgeColor}
          borderColor={borderColor}
        >
          {children}
        </VelvetGlassSurface>
      </Animated.View>
    </GestureDetector>
  );
}
