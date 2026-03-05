/**
 * Screenshot Preview Route
 *
 * Dev-only route to preview all 6 App Store screenshots on-device.
 * Navigate to /screenshots in development to access.
 * Gated behind __DEV__ so it is never reachable in production builds.
 */

import React from 'react';
import { Redirect } from 'expo-router';
import ScreenshotGallery from '../screenshots/ScreenshotGallery';

export default function ScreenshotsPage() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ScreenshotGallery />;
}
