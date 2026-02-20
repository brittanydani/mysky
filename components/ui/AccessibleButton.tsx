/**
 * Accessible wrapper components that REQUIRE accessibility labels.
 * 
 * Use these instead of raw Pressable/TouchableOpacity to prevent
 * shipping interactive elements without VoiceOver support.
 * 
 * AppButton    — general pressable area (button role)
 * IconButton   — icon-only pressable (requires label since icon is not text)
 * PressableRow — settings-style row (button role)
 * LinkButton   — opens a URL or navigates (link role)
 */

import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

// ─── AppButton ───────────────────────────────────────────────────────────────

export interface AppButtonProps extends Omit<PressableProps, 'accessibilityRole'> {
  /** Required: a clear, concise description for VoiceOver (e.g. "Save entry") */
  accessibilityLabel: string;
  /** Optional hint for extra context (e.g. "Opens the journal editor") */
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function AppButton({ accessibilityLabel, accessibilityHint, children, ...rest }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

// ─── IconButton ──────────────────────────────────────────────────────────────

export interface IconButtonProps extends Omit<PressableProps, 'accessibilityRole'> {
  /** Required: describes the action (e.g. "Close", "Delete entry") */
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function IconButton({ accessibilityLabel, accessibilityHint, children, ...rest }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

// ─── PressableRow ────────────────────────────────────────────────────────────

export interface PressableRowProps extends Omit<PressableProps, 'accessibilityRole'> {
  /** Required: describes the row action (e.g. "Edit birth data") */
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function PressableRow({ accessibilityLabel, accessibilityHint, children, ...rest }: PressableRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

// ─── LinkButton ──────────────────────────────────────────────────────────────

export interface LinkButtonProps extends Omit<PressableProps, 'accessibilityRole'> {
  /** Required: describes the link destination (e.g. "Privacy Policy") */
  accessibilityLabel: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function LinkButton({ accessibilityLabel, accessibilityHint, children, ...rest }: LinkButtonProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
