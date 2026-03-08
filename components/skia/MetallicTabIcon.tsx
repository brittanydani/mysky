import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, RoundedRect, LinearGradient, vec } from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import { metallicStopsTiny, metallicPositionsTiny, inactiveGoldColor } from '../../constants/mySkyMetallic';
import { mySkyText } from '../../constants/mySkyText';

// Active icon sits on gold metallic pill — use deep navy for contrast
const ACTIVE_ICON_COLOR = '#020817';

const PILL_W = 52;
const PILL_H = 32;
const PILL_R = 16;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IoniconsName;
  focused: boolean;
  size?: number;
};

const MetallicTabIcon = memo(function MetallicTabIcon({ name, focused, size = 22 }: Props) {
  if (!focused) {
    return <Ionicons name={name} size={size} color={inactiveGoldColor} />;
  }

  return (
    <View style={styles.pill}>
      <View style={StyleSheet.absoluteFill}>
        <Canvas style={{ flex: 1 }}>
          <RoundedRect x={0} y={0} width={PILL_W} height={PILL_H} r={PILL_R}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, PILL_H)}
              colors={metallicStopsTiny as unknown as string[]}
              positions={metallicPositionsTiny as unknown as number[]}
            />
          </RoundedRect>
        </Canvas>
      </View>
      <Ionicons name={name} size={size} color={ACTIVE_ICON_COLOR} />
    </View>
  );
});

export default MetallicTabIcon;

const styles = StyleSheet.create({
  pill: {
    width: PILL_W,
    height: PILL_H,
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle gold glow on active
  },
});
