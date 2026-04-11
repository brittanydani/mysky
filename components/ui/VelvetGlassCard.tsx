import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from '../../utils/haptics';
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

  const handlePressIn = () => {
    if (!interactive) return;
    scale.value = withSpring(PRESS_SCALE, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    if (!interactive) return;
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  const handlePress = () => {
    if (!interactive || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessibilityRole="button"
    >
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
    </Pressable>
  );
}
