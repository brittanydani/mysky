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

const INDICATOR_BG = 'rgba(255,255,255,0.10)';
const CONTAINER_BG = 'rgba(10, 18, 36, 0.5)';
const TEXT_ACTIVE = '#FFFFFF';
const TEXT_INACTIVE = 'rgba(226,232,240,0.45)';
const COUNT_ACTIVE = '#D4B872';
const COUNT_INACTIVE = 'rgba(226,232,240,0.30)';

export function PremiumSegmentedControl({
  options,
  selectedIndex,
  onChange,
}: PremiumSegmentedControlProps) {
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: CONTAINER_BG,
    borderRadius: 14,
    padding: 4,
    height: 56,
    position: 'relative',
    marginBottom: 16,
    width: '100%',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: INDICATOR_BG,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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
    color: TEXT_INACTIVE,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  labelActive: {
    color: TEXT_ACTIVE,
  },
  count: {
    fontSize: 11,
    fontWeight: '500',
    color: COUNT_INACTIVE,
    marginTop: 2,
    textAlign: 'center',
  },
  countActive: {
    color: COUNT_ACTIVE,
  },
});
