import React, { useMemo } from 'react';
import {
  Canvas,
  LinearGradient,
  matchFont,
  Text as SkiaText,
  vec,
} from '@shopify/react-native-skia';
import { Colors, Typography } from './theme';

interface SkiaGradientTextProps {
  text: string;
  /**
   * The variant from our Typography theme (e.g., 'hero', 'h1', 'h2')
   */
  variant?: keyof typeof Typography;
  /**
   * Array of hex colors for the gradient. Defaults to the gold from our theme.
   */
  colors?: string[];
  /**
   * Direction of the gradient. Defaults to top-to-bottom.
   */
  direction?: 'vertical' | 'horizontal';
}

export const SkiaGradientText = ({
  text,
  variant = 'h1',
  colors = Colors.goldGradient,
  direction = 'vertical',
}: SkiaGradientTextProps) => {
  const textStyle = Typography[variant];
  const lineHeight = 'lineHeight' in textStyle ? textStyle.lineHeight : textStyle.fontSize;

  const font = useMemo(
    () =>
      matchFont({
        fontFamily: textStyle.fontFamily,
        fontSize: textStyle.fontSize,
        fontWeight: textStyle.fontWeight,
      }),
    [textStyle.fontFamily, textStyle.fontSize, textStyle.fontWeight]
  );

  const textMeasurements = useMemo(() => {
    const width = Math.max(font.getTextWidth(text), 1);
    const metrics = font.getMetrics();

    return {
      width,
      height: Math.max((metrics.descent || 0) - (metrics.ascent || 0), lineHeight),
      baseline: Math.abs(metrics.ascent || 0),
    };
  }, [font, lineHeight, text]);

  const coords = useMemo(() => {
    if (direction === 'horizontal') {
      return {
        start: vec(0, 0),
        end: vec(textMeasurements.width, 0),
      };
    }

    return {
      start: vec(0, 0),
      end: vec(0, textMeasurements.height),
    };
  }, [direction, textMeasurements.height, textMeasurements.width]);

  if (!text.trim()) {
    return null;
  }

  return (
    <Canvas
      style={{
        width: textMeasurements.width,
        height: textMeasurements.height,
      }}
    >
      <SkiaText
        x={0}
        y={textMeasurements.baseline}
        text={text}
        font={font}
      >
        <LinearGradient start={coords.start} end={coords.end} colors={colors} />
      </SkiaText>
    </Canvas>
  );
};
