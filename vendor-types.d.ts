// Type declarations for packages without bundled types

declare module 'ephemeris';
declare module 'react-test-renderer';
declare module 'tz-lookup' {
  export default function tzLookup(latitude: number, longitude: number): string;
}
