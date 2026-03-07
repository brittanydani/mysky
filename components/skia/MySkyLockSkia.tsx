import React, { memo } from "react";
import { ViewStyle } from "react-native";
import { Canvas, Path, RoundedRect, Circle, LinearGradient, Group, vec, Shadow } from "@shopify/react-native-skia";
import { mySkyGold, metallicStopsSoft, metallicPositionsSoft } from "@/constants/mySkyMetallic";

type Props = { size?: number; style?: ViewStyle; };

const MySkyLockSkia = memo(function MySkyLockSkia({ size = 512, style }: Props) {
  const center = size / 2;
  const boxW = size * 0.55;
  const boxH = size * 0.44;
  const boxX = center - boxW / 2;
  const boxY = size * 0.44;
  const boxR = size * 0.08;
  const shackleR = size * 0.16;
  const shackleStroke = size * 0.06;
  const shackleCX = center;
  const shackleCY = boxY;

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      <Group>
        <Shadow dx={0} dy={size * 0.02} blur={size * 0.04} color="rgba(0,0,0,0.5)" />
        <Path
          path={`M ${shackleCX - shackleR} ${shackleCY + size * 0.05} L ${shackleCX - shackleR} ${shackleCY} A ${shackleR} ${shackleR} 0 0 1 ${shackleCX + shackleR} ${shackleCY} L ${shackleCX + shackleR} ${shackleCY + size * 0.05}`}
          color={mySkyGold.base} style="stroke" strokeWidth={shackleStroke} strokeCap="round"
        >
          <LinearGradient start={vec(center - shackleR, shackleCY - shackleR)} end={vec(center + shackleR, shackleCY + shackleR)} colors={[mySkyGold.glossBright, mySkyGold.shadowDeep, mySkyGold.base]} positions={[0, 0.5, 1]} />
        </Path>
        <RoundedRect x={boxX} y={boxY} width={boxW} height={boxH} r={boxR}>
          <LinearGradient start={vec(boxX, boxY)} end={vec(boxX + boxW, boxY + boxH)} colors={metallicStopsSoft} positions={metallicPositionsSoft} />
          <Shadow dx={0} dy={size * 0.01} blur={size * 0.03} color="rgba(0,0,0,0.3)" inner />
        </RoundedRect>
        <RoundedRect x={boxX} y={boxY} width={boxW} height={boxH} r={boxR} color={mySkyGold.shadow} style="stroke" strokeWidth={size * 0.008} />
        <Group>
          <Circle cx={center} cy={boxY + boxH * 0.4} r={size * 0.05} color="#0D111C" />
          <Path path={`M ${center - size * 0.03} ${boxY + boxH * 0.4} L ${center + size * 0.03} ${boxY + boxH * 0.4} L ${center + size * 0.04} ${boxY + boxH * 0.75} L ${center - size * 0.04} ${boxY + boxH * 0.75} Z`} color="#0D111C" />
        </Group>
        <RoundedRect x={boxX + size * 0.02} y={boxY + size * 0.02} width={boxW - size * 0.04} height={boxH * 0.15} r={size * 0.04}>
           <LinearGradient start={vec(boxX, boxY)} end={vec(boxX, boxY + boxH * 0.15)} colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0)"]} />
        </RoundedRect>
      </Group>
    </Canvas>
  );
});
export default MySkyLockSkia;
