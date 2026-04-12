// components/ui/PremiumSegmentedControl.tsx
//
// Fluid spring-animated segmented control with haptic feedback.
// Uses react-native-reanimated for native-thread animation and
// expo-haptics for tactile response on each tab switch.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemedStyles } from '../../context/ThemeContext';
import { type AppTheme } from '../../constants/theme';

export interface TabOption {
  id: string;
  label: string;
  count?: number;
}

interface PremiumSegmentedControlProps {
  options: TabOption[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function PremiumSegmentedControl({
  options,
  selectedIndex,
  onChange,
}: PremiumSegmentedControlProps) {
  const styles = useThemedStyles(createStyles);
  const [containerWidth, setContainerWidth] = useState(0);
  const tabWidth = containerWidth > 0 ? containerWidth / options.length : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0) {
      translateX.value = withSpring(selectedIndex * tabWidth, {
        mass: 1,
        damping: 20,
        stiffness: 250,
        overshootClamping: false,
      });
    }
  }, [selectedIndex, tabWidth, translateX]);

  const handlePress = (index: number) => {
    if (index !== selectedIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(index);
    }
  };

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width - 8); // subtract 2*padding
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabWidth,
  }));

  return (
    <View style={styles.container} onLayout={onLayout}>
      {tabWidth > 0 && (
        <Animated.View style={[styles.indicator, indicatorStyle]} />
      )}
      {options.map((option, index) => {
        const isActive = selectedIndex === index;
        return (
          <TouchableOpacity
            key={option.id}
            style={styles.tabButton}
            activeOpacity={1}
            onPress={() => handlePress(index)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option.label}
            </Text>
            {option.count !== undefined && (
              <Text style={[styles.count, isActive && styles.countActive]}>
                {option.count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(50, 30, 10, 0.03)',
    borderRadius: 14,
    padding: 4,
    height: 56,
    position: 'relative',
    marginBottom: 16,
    width: '100%',
    borderWidth: theme.isDark ? 1 : 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.06)',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : theme.cardSurfaceStrong,
    borderRadius: 10,
    shadowColor: theme.isDark ? '#000' : 'rgba(111, 85, 46, 0.16)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.isDark ? 0.25 : 1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.isDark ? 'rgba(255,255,255,0.4)' : theme.textMuted,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  count: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.isDark ? 'rgba(226,232,240,0.30)' : theme.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  countActive: {
    color: '#D4B872',
  },
});
