import React, { memo, useMemo } from 'react';
import { ViewStyle } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient,
  Group,
  vec,
} from '@shopify/react-native-skia';
import { mySkyGold, metallicStopsSoft, metallicPositionsSoft } from '@/constants/mySkyMetallic';

type Props = {
  size?: number;
  style?: ViewStyle;
};

const MySkyShieldSkia = memo(function MySkyShieldSkia({ size = 512, style }: Props) {
  const cx = size / 2;

  // ── Shield Body geometry ───────────────────────────────────────────────────
  const bodyW  = size * 0.6;
  const bodyH  = size * 0.7;
  const bodyY  = size * 0.15;

  const shieldPath = useMemo(() => {
    const p = Skia.Path.Make();
    // Top-left
    p.moveTo(cx - bodyW / 2, bodyY);
    // Top edge (slight dip in middle)
    p.quadraticTo(cx, bodyY + size * 0.05, cx + bodyW / 2, bodyY);
    // Right curve down to point
    p.cubicTo(
      cx + bodyW / 2, bodyY + bodyH * 0.5,
      cx + bodyW * 0.4, bodyY + bodyH * 0.85,
      cx, bodyY + bodyH
    );
    // Left curve up to top-left
    p.cubicTo(
      cx - bodyW * 0.4, bodyY + bodyH * 0.85,
      cx - bodyW / 2, bodyY + bodyH * 0.5,
      cx - bodyW / 2, bodyY
    );
    p.close();
    return p;
  }, [cx, bodyW, bodyH, bodyY, size]);

  // ── Checkmark geometry ──────────────────────────────────────────────────
  const checkStroke = size * 0.05;
  const checkmarkPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx - bodyW * 0.22, bodyY + bodyH * 0.45);
    p.lineTo(cx - bodyW * 0.05, bodyY + bodyH * 0.62);
    p.lineTo(cx + bodyW * 0.28, bodyY + bodyH * 0.28);
    return p;
  }, [cx, bodyW, bodyH, bodyY]);

  // ── Gradient definitions ───────────────────────────────────────────────────
  const bodyGradStart = vec(cx - bodyW / 2, bodyY);
  const bodyGradEnd   = vec(cx - bodyW / 2, bodyY + bodyH);

  return (
    <Canvas style={[{ width: size, height: size }, style]}>
      {/* ── Shield Body fill ── */}
      <Path path={shieldPath}>
        <LinearGradient
          start={bodyGradStart}
          end={bodyGradEnd}
          colors={[...metallicStopsSoft]}
          positions={[...metallicPositionsSoft]}
        />
      </Path>

      {/* ── Shield Body border ── */}
      <Path
        path={shieldPath}
        style="stroke"
        strokeWidth={size * 0.015}
        color={mySkyGold.shadow}
      />

      {/* ── Inner glow/highlight ── */}
      <Path
        path={shieldPath}
        style="stroke"
        strokeWidth={size * 0.005}
        color={mySkyGold.glossBright}
        opacity={0.4}
      />

      {/* ── Checkmark ── */}
      <Group>
        <Path
          path={checkmarkPath}
          style="stroke"
          strokeWidth={checkStroke + size * 0.01}
          strokeCap="round"
          strokeJoin="round"
          color={mySkyGold.shadowDeep}
          opacity={0.6}
        />
        <Path
          path={checkmarkPath}
          style="stroke"
          strokeWidth={checkStroke}
          strokeCap="round"
          strokeJoin="round"
          color="#020817"
        />
      </Group>
    </Canvas>
  );
});

export default MySkyShieldSkia;
