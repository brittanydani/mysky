import React, { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { selection as hapticSelection } from '../../utils/haptics';
import { type AppTheme } from '../../constants/theme';
import { useThemedStyles } from '../../context/ThemeContext';

const TRACK_WIDTH = 56;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 24;
const THUMB_PADDING = 4;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_PADDING * 2;

interface GlassToggleProps {
  value: boolean;
  onToggle: (nextValue: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const GlassToggle = memo(function GlassToggle({
  value,
  onToggle,
  label,
  description,
  disabled = false,
}: GlassToggleProps) {
  const styles = useThemedStyles(createStyles);
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 220 });
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.05)', 'rgba(212,175,55,0.16)'],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.12)', 'rgba(212,175,55,0.28)'],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(255,255,255,0.9)', 'rgba(212,175,55,0.98)'],
    ),
    shadowOpacity: 0.18 + progress.value * 0.18,
  }));

  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        hapticSelection();
        onToggle(!value);
      }}
      style={[styles.row, disabled && styles.disabled]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      hitSlop={10}
    >
      {(label || description) && (
        <View style={styles.textColumn}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      )}

      <AnimatedView style={[styles.track, trackStyle]}>
        <View pointerEvents="none" style={styles.trackHighlight} />
        <AnimatedView style={[styles.thumb, thumbStyle]}>
          <View style={styles.thumbSpecular} />
        </AnimatedView>
      </AnimatedView>
    </Pressable>
  );
});

export default GlassToggle;

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    disabled: {
      opacity: 0.55,
    },
    textColumn: {
      flex: 1,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 3,
    },
    description: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.textSecondary,
    },
    track: {
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      borderWidth: 1,
      padding: THUMB_PADDING,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    trackHighlight: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: TRACK_HEIGHT / 2,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.18)',
      opacity: 0.9,
    },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 10,
      elevation: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbSpecular: {
      width: THUMB_SIZE * 0.48,
      height: THUMB_SIZE * 0.48,
      borderRadius: THUMB_SIZE * 0.24,
      backgroundColor: 'rgba(255,255,255,0.34)',
    },
  });