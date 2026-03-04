// File: app/onboarding/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="consent" />
      <Stack.Screen name="birth" />
      <Stack.Screen name="restore" />
    </Stack>
  );
}
