import React from 'react';
import { StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { SkiaGradient } from './SkiaGradient';

interface GoldIconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  style?: any;
}

export const GoldIcon: React.FC<GoldIconProps> = ({ name, size = 24, style }) => {
  return (
    <View style={style}>
      <MaskedView
        style={styles.maskedView}
        maskElement={<Ionicons name={name} size={size} color="white" style={styles.resetLayout} />}
      >
        <SkiaGradient
          colors={['#E8D6AE', '#9B7A46']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={name} size={size} color="transparent" style={styles.resetLayout} />
        </SkiaGradient>
      </MaskedView>
    </View>
  );
};

const styles = StyleSheet.create({
  maskedView: { flexDirection: 'row' },
  resetLayout: { margin: 0, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, padding: 0 }
});