import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  vec,
} from '@shopify/react-native-skia';
import { metallicFillColors, metallicFillPositions } from '../../constants/mySkyMetallic';

const BADGE_HEIGHT = 28;
const BADGE_RADIUS = 999;

interface Props {
  label: string;
  icon?: string;
}

function SkiaPremiumBadge({ label, icon }: Props) {
  const [w, setW] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setW(e.nativeEvent.layout.width);
  }, []);

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      {w > 0 && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Canvas style={{ flex: 1 }}>
            <RoundedRect x={0} y={0} width={w} height={BADGE_HEIGHT} r={BADGE_RADIUS}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(w, BADGE_HEIGHT)}
                positions={[...metallicFillPositions]}
                colors={[...metallicFillColors]}
              />
            </RoundedRect>
          </Canvas>
        </View>
      )}
      <View style={styles.row}>
        {icon ? (
          <Ionicons name={icon as any} size={12} color="#1A1432" style={styles.icon} />
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    height: BADGE_HEIGHT,
    borderRadius: BADGE_RADIUS,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1432',
    letterSpacing: 0.5,
  },
});

export default memo(SkiaPremiumBadge);
