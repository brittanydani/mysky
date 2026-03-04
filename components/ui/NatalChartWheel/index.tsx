import React from 'react';
let SkiaWheel: any = null;
let SvgWheel: any = null;
let skiaError = false;

try {
  SkiaWheel = require('./../NatalChartWheelSkia').default;
} catch (e) {
  skiaError = true;
}
try {
  SvgWheel = require('./../NatalChartWheel').default;
} catch (e) {
  // If SVG also fails, we'll throw below.
}

// Fallback wrapper: prefer Skia, fallback to SVG
export default function NatalChartWheel(props: any) {
  if (SkiaWheel && !skiaError) {
    return <SkiaWheel {...props} />;
  } else if (SvgWheel) {
    return <SvgWheel {...props} />;
  }
  throw new Error('No chart wheel implementation available');
}