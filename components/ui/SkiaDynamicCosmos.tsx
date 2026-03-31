import React from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, Fill } from "@shopify/react-native-skia";

export const SkiaDynamicCosmos = ({ fill }: { fill?: string }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {fill ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <Fill color={fill} />
        </Canvas>
      ) : null}
    </View>
  );
};
