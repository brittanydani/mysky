import React, { memo } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

export interface EditorialPillItem {
  key: string;
  label: string;
  selected?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'custom' | 'utility';
  accentColor?: string;
  selectedBackgroundColor?: string;
  selectedTextColor?: string;
  style?: StyleProp<ViewStyle>;
  selectedStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  selectedLabelStyle?: StyleProp<TextStyle>;
}

interface EditorialPillGridProps {
  items: EditorialPillItem[];
  style?: StyleProp<ViewStyle>;
}

export const EditorialPillGrid = memo(function EditorialPillGrid({
  items,
  style,
}: EditorialPillGridProps) {
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  return (
    <View style={[styles.grid, style]}>
      {items.map((item) => {
        const isSelected = !!item.selected;
        const accentColor = item.accentColor ?? 'rgba(255,255,255,0.16)';
        const selectedBackgroundColor = item.selectedBackgroundColor ?? 'rgba(255,255,255,0.92)';
        const selectedTextColor = item.selectedTextColor ?? '#0A0A0F';
        const isUtility = item.variant === 'utility';
        const isCustom = item.variant === 'custom';

        return (
          <AnimatedPressable
            key={item.key}
            style={({ pressed }) => [
              styles.pill,
              isUtility && styles.utilityPill,
              isCustom && styles.customPill,
              item.style,
              isSelected && {
                backgroundColor: selectedBackgroundColor,
                borderColor: accentColor,
              },
              isSelected && item.selectedStyle,
              item.disabled && styles.disabled,
              pressed && !item.disabled && styles.pillPressed,
            ]}
            onPress={item.onPress}
            onLongPress={item.onLongPress}
            disabled={item.disabled}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isSelected, disabled: item.disabled }}
          >
            <Text
              style={[
                styles.label,
                item.labelStyle,
                isSelected && { color: selectedTextColor },
                isSelected && item.selectedLabelStyle,
              ]}
            >
              {item.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 36,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pillPressed: {
    transform: [{ scale: 0.975 }],
  },
  utilityPill: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  customPill: {
    borderColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: 'rgba(226,232,240,0.76)',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});