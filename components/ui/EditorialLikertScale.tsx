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
import * as Haptics from '../../utils/haptics';

export interface EditorialLikertScaleProps {
  value: number | null;
  onChange: (value: number | null) => void;
  values?: readonly number[];
  clearable?: boolean;
  stretch?: boolean;
  style?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  selectedButtonStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  selectedLabelStyle?: StyleProp<TextStyle>;
}

export const EditorialLikertScale = memo(function EditorialLikertScale({
  value,
  onChange,
  values = [1, 2, 3, 4, 5],
  clearable = false,
  stretch = true,
  style,
  buttonStyle,
  selectedButtonStyle,
  labelStyle,
  selectedLabelStyle,
}: EditorialLikertScaleProps) {
  const handlePress = (nextValue: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (clearable && value === nextValue) {
      onChange(null);
      return;
    }
    onChange(nextValue);
  };

  return (
    <View style={[styles.row, style]}>
      {values.map((itemValue) => {
        const isSelected = value === itemValue;
        return (
          <Pressable
            key={itemValue}
            style={[
              styles.button,
              stretch && styles.buttonStretch,
              isSelected && styles.buttonSelected,
              buttonStyle,
              isSelected && selectedButtonStyle,
            ]}
            onPress={() => handlePress(itemValue)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${itemValue}`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.label,
                labelStyle,
                isSelected && styles.labelSelected,
                isSelected && selectedLabelStyle,
              ]}
            >
              {itemValue}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    minWidth: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,24,21,0.08)',
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonStretch: {
    flex: 1,
  },
  buttonSelected: {
    backgroundColor: '#B8935A',
    borderColor: '#B8935A',
    shadowColor: '#4A3F35',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(26,24,21,0.5)',
  },
  labelSelected: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
});