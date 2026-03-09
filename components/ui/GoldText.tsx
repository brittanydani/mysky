import React from 'react';
import { Text, TextProps, StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { SkiaGradient } from './SkiaGradient';

export const GoldText: React.FC<TextProps> = ({ style, ...rest }) => {
  return (
    <View style={style}>
      <MaskedView
        style={styles.maskedView}
        maskElement={<Text {...rest} style={[style, styles.resetLayout]} />}
      >
        <SkiaGradient
          colors={['#E8D6AE', '#9B7A46']}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
        >
          <Text {...rest} style={[style, styles.resetLayout, { opacity: 0 }]} />
        </SkiaGradient>
      </MaskedView>
    </View>
  );
};

const styles = StyleSheet.create({
  maskedView: { flexDirection: 'row' },
  resetLayout: { margin: 0, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, padding: 0 }
});
