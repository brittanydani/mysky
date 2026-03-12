import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, RoundedRect, LinearGradient, BlurMask, vec, Circle } from '@shopify/react-native-skia';

interface Props {
  width?: number;
  showLegend?: boolean;
  showInsightMarkers?: boolean;
}

// Placeholder data — 14 bars with varied reflection depths
const PLACEHOLDER_BARS = Array.from({ length: 14 }, (_, i) => ({
  label: `D${i + 1}`,
  depth: 0.2 + (Math.sin(i * 0.9 + 1) * 0.5 + 0.5) * 0.8,
  hasInsight: i % 4 === 2,
}));

const BAR_COLOR_LOW = 'rgba(99,179,237,0.5)';
const BAR_COLOR_HIGH = 'rgba(255,218,3,0.75)';
const INSIGHT_COLOR = '#C86BFF';

function JournalReflectionBars({ width = 320, showLegend = false, showInsightMarkers = false }: Props) {
  const bars = PLACEHOLDER_BARS;
  const PAD = 16;
  const graphW = width - PAD * 2;
  const graphH = 120;
  const totalH = graphH + (showLegend ? 32 : 16);
  const barW = Math.max(4, graphW / bars.length - 3);
  const gap = (graphW - barW * bars.length) / Math.max(bars.length - 1, 1);

  return (
    <View style={[styles.container, { width }]}>
      <Canvas style={{ width, height: totalH }}>
        {bars.map((bar, i) => {
          const x = PAD + i * (barW + gap);
          const barH = Math.max(4, bar.depth * graphH);
          const y = PAD + graphH - barH;
          const t = bar.depth;
          // Interpolate color low→high
          const r = Math.round(99 + (255 - 99) * t);
          const g = Math.round(179 + (218 - 179) * t);
          const b = Math.round(237 + (3 - 237) * t);
          const fillColor = `rgba(${r},${g},${b},${0.5 + t * 0.3})`;

          return (
            <React.Fragment key={i}>
              {/* Track */}
              <RoundedRect x={x} y={PAD} width={barW} height={graphH} r={barW / 2} color="rgba(255,255,255,0.04)" />
              {/* Fill */}
              <RoundedRect x={x} y={y} width={barW} height={barH} r={barW / 2} color={fillColor}>
                <LinearGradient
                  start={vec(x, y)}
                  end={vec(x, y + barH)}
                  colors={[`rgba(${r},${g},${b},0.9)`, `rgba(${r},${g},${b},0.4)`]}
                />
              </RoundedRect>
              {/* Insight marker dot */}
              {showInsightMarkers && bar.hasInsight && (
                <Circle cx={x + barW / 2} cy={y - 6} r={3} color={INSIGHT_COLOR}>
                  <BlurMask blur={2} style="normal" />
                </Circle>
              )}
            </React.Fragment>
          );
        })}
      </Canvas>

      {showLegend && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: BAR_COLOR_LOW }]} />
            <Text style={styles.legendText}>Light reflection</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: BAR_COLOR_HIGH }]} />
            <Text style={styles.legendText}>Deep reflection</Text>
          </View>
          {showInsightMarkers && (
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: INSIGHT_COLOR }]} />
              <Text style={styles.legendText}>Pattern insight</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
});

export default memo(JournalReflectionBars);
