import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue, Easing } from 'react-native-reanimated';

export const CircadianWindowDial = ({ activeDomain = 'Focus' }: { activeDomain?: string }) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dial, animatedStyle]}>
        <View style={styles.indicator} />
      </Animated.View>
      <View style={styles.centerTextContainer}>
        <Text style={styles.domainText}>{activeDomain}</Text>
        <Text style={styles.subtext}>Active window</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  dial: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: '#333',
    position: 'absolute',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    position: 'absolute',
    top: -5,
    left: 85,
    shadowColor: '#34C759',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  centerTextContainer: {
    alignItems: 'center',
  },
  domainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtext: {
    color: '#8A8A8E',
    fontSize: 10,
    marginTop: 4,
  }
});
