import React, { memo } from "react";
import { ViewStyle } from "react-native";
import { Canvas, Path, RoundedRect, LinearGradient, Group, vec, Shadow } from "@shopify/react-native-skia";
import { mySkyGold, metallicStopsSoft, metallicPositionsSoft } from "@/constants/mySkyMetallic";

type Props = { size?: number; style?: ViewStyle; };

const MySkyClipboardSkia = memo(function MySkyClipboardSkia({ size = 512, style }: Props) {
  const center = size / 2;

  const boardW = size * 0.55;
  const boardH = size * 0.7;
  const boardX = center - boardW / 2;
  const boardY = center - boardH / 2 + size * 0.05;
  const boardR = size * 0.06;

  const paperW = boardW * 0.85;
  const paperH = boardH * 0.85;
  const paperX = center - paperW / 2;
  const paperY = boardY + boardH * 0.1;

  const clipW = boardW * 0.35;
  const clipH = size * 0.1;
  const clipX = center - clipW / 2;
  const clipY = boardY - clipH * 0.4;
  const clipR = size * 0.03;

  const clipHoleR = size * 0.02;

  const lines = Array.from({ length: 5 }).map((_, i) => (
    <Path
      key={i}
      path={`M ${paperX + size * 0.06} ${paperY + size * 0.14 + i * size * 0.07} L ${paperX + paperW - size * 0.06} ${paperY + size * 0.14 + i * size * 0.07}`}
      color="rgba(20,20,30,0.15)"
      style="stroke"
      strokeWidth={size * 0.012}
      strokeCap="round"
    />
  ));

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      <Group>
        <Shadow dx={0} dy={size * 0.02} blur={size * 0.04} color="rgba(0,0,0,0.5)" />
        
        <RoundedRect x={boardX} y={boardY} width={boardW} height={boardH} r={boardR} color={mySkyGold.shadowDeep}>
          <LinearGradient start={vec(boardX, boardY)} end={vec(boardX + boardW, boardY + boardH)} colors={[mySkyGold.base, mySkyGold.shadow, mySkyGold.shadowDeep]} positions={[0, 0.5, 1]} />
        </RoundedRect>

        <RoundedRect x={paperX} y={paperY} width={paperW} height={paperH} r={size * 0.02} color="#F7F5F0">
          <LinearGradient start={vec(paperX, paperY)} end={vec(paperX + paperW, paperY + paperH)} colors={["#FFFFFF", "#F0EBE0", "#E5DCC4"]} positions={[0, 0.5, 1]} />
        </RoundedRect>

        {lines}
        <Path
          path={`M ${paperX + size * 0.06} ${paperY + size * 0.14 + 5 * size * 0.07} L ${paperX + paperW * 0.5} ${paperY + size * 0.14 + 5 * size * 0.07}`}
          color="rgba(20,20,30,0.15)"
          style="stroke"
          strokeWidth={size * 0.012}
          strokeCap="round"
        />

        <RoundedRect x={clipX} y={clipY} width={clipW} height={clipH} r={clipR}>
          <LinearGradient start={vec(clipX, clipY)} end={vec(clipX, clipY + clipH)} colors={metallicStopsSoft} positions={metallicPositionsSoft} />
          <Shadow dx={0} dy={size * 0.01} blur={size * 0.02} color="rgba(0,0,0,0.4)" />
        </RoundedRect>

        <Path
          path={`M ${center - clipW * 0.25} ${clipY} L ${center - clipW * 0.15} ${clipY - size * 0.06} A ${clipHoleR * 2} ${clipHoleR * 2} 0 0 1 ${center + clipW * 0.15} ${clipY - size * 0.06} L ${center + clipW * 0.25} ${clipY}`}
          color={mySkyGold.base}
          style="stroke"
          strokeWidth={size * 0.03}
          strokeCap="round"
          strokeJoin="round"
        >
          <LinearGradient start={vec(center, clipY - size * 0.06)} end={vec(center, clipY)} colors={[mySkyGold.glossBright, mySkyGold.shadowDeep, mySkyGold.base]} positions={[0, 0.5, 1]} />
        </Path>

        <RoundedRect x={clipX} y={clipY} width={clipW} height={clipH} r={clipR} color={mySkyGold.shadow} style="stroke" strokeWidth={size * 0.008} />
      </Group>
    </Canvas>
  );
});
export default MySkyClipboardSkia;
