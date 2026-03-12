import React, { memo } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, Path, Skia, BlurMask } from '@shopify/react-native-skia';
import { Dimensions } from 'react-native';

const W = Dimensions.get('window').width - 32;
const H = 180;

// Static decorative connection energy map — orbits of relational energy
const NODES = [
  { cx: W * 0.50, cy: H * 0.50, r: 18, color: 'rgba(255,218,3,0.75)',  label: 'You' },
  { cx: W * 0.22, cy: H * 0.28, r: 10, color: 'rgba(196,103,255,0.65)', label: '' },
  { cx: W * 0.78, cy: H * 0.28, r: 10, color: 'rgba(73,223,255,0.65)',  label: '' },
  { cx: W * 0.18, cy: H * 0.70, r: 8,  color: 'rgba(255,90,95,0.55)',   label: '' },
  { cx: W * 0.82, cy: H * 0.70, r: 8,  color: 'rgba(154,205,50,0.55)',  label: '' },
  { cx: W * 0.50, cy: H * 0.14, r: 7,  color: 'rgba(255,154,60,0.55)',  label: '' },
];

function ConnectionEnergyMap() {
  const center = NODES[0];

  const edges = NODES.slice(1).map(node => {
    const p = Skia.Path.Make();
    p.moveTo(center.cx, center.cy);
    p.lineTo(node.cx, node.cy);
    return p;
  });

  return (
    <View style={{ width: W, height: H }}>
      <Canvas style={{ width: W, height: H }}>
        {/* Edge lines */}
        {edges.map((path, i) => (
          <Path
            key={i}
            path={path}
            color={`${NODES[i + 1].color.replace(/[\d.]+\)$/, '0.20)')}`}
            style="stroke"
            strokeWidth={1.5}
          />
        ))}

        {/* Node glows + dots */}
        {NODES.map((node, i) => (
          <React.Fragment key={i}>
            <Circle cx={node.cx} cy={node.cy} r={node.r + 6} color={node.color.replace(/[\d.]+\)$/, '0.15)')}>
              <BlurMask blur={8} style="normal" />
            </Circle>
            <Circle cx={node.cx} cy={node.cy} r={node.r} color={node.color} />
          </React.Fragment>
        ))}
      </Canvas>
    </View>
  );
}

export default memo(ConnectionEnergyMap);
