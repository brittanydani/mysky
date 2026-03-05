// NatalChartWheel.tsx — re-exports the Skia implementation as the primary wheel.
// SVG fallback lives in NatalChartWheelSvg.tsx and is used by the dispatcher
// (NatalChartWheel/index.tsx) only when Skia is unavailable.
export { default } from './NatalChartWheelSkia';
