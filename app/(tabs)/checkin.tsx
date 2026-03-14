// When expo-router resolves /checkin from within the tabs context, it renders
// this file rather than the root-level app/checkin.tsx. Re-exporting the same
// component means the correct CheckInHub is shown regardless of how the route
// is resolved — no redirect, no blank screen, no navigation loop.
export { default } from '../checkin';

