import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';

import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { type AppTheme } from '../constants/theme';
import { logger } from '../utils/logger';

const CHECK_THROTTLE_MS = 5 * 60 * 1000;

function updateKey(update?: { type?: string; updateId?: string }) {
  if (!update) return 'downloaded-update';
  return update.updateId ?? update.type ?? 'downloaded-update';
}

export default function OtaUpdatePrompt() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {
    downloadedUpdate,
    isUpdatePending,
    isDownloading,
    isRestarting,
  } = Updates.useUpdates();

  const [visible, setVisible] = useState(false);
  const [restartFailed, setRestartFailed] = useState(false);
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const dismissedKeyRef = useRef<string | null>(null);
  const checkingRef = useRef(false);
  const lastCheckAtRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);

  const checkAndFetchUpdate = useCallback(async (force = false) => {
    if (__DEV__ || !Updates.isEnabled || checkingRef.current || isRestarting) {
      return;
    }

    const now = Date.now();
    if (!force && now - lastCheckAtRef.current < CHECK_THROTTLE_MS) {
      return;
    }

    checkingRef.current = true;
    lastCheckAtRef.current = now;

    try {
      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable && !check.isRollBackToEmbedded) {
        return;
      }

      const result = await Updates.fetchUpdateAsync();
      if (result.isNew || result.isRollBackToEmbedded) {
        const key = updateKey(result.isRollBackToEmbedded ? { type: 'rollback' } : undefined);
        setReadyKey(key);
        if (dismissedKeyRef.current !== key) {
          setVisible(true);
        }
      }
    } catch (error) {
      logger.warn('[updates] Failed to check for OTA update', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      checkingRef.current = false;
    }
  }, [isRestarting]);

  useEffect(() => {
    if (!isUpdatePending) {
      return;
    }

    const key = updateKey(downloadedUpdate);
    setReadyKey(key);
    if (dismissedKeyRef.current !== key) {
      setVisible(true);
    }
  }, [downloadedUpdate, isUpdatePending]);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) {
      return undefined;
    }

    const timer = setTimeout(() => {
      void checkAndFetchUpdate(true);
    }, 2500);

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasInactive = appStateRef.current === 'inactive' || appStateRef.current === 'background';
      appStateRef.current = nextState;

      if (wasInactive && nextState === 'active') {
        void checkAndFetchUpdate();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [checkAndFetchUpdate]);

  const handleLater = () => {
    dismissedKeyRef.current = readyKey;
    setVisible(false);
  };

  const handleRestart = async () => {
    setRestartFailed(false);
    try {
      await Updates.reloadAsync({
        reloadScreenOptions: {
          backgroundColor: theme.background,
          spinner: {
            color: theme.primary,
          },
        },
      });
    } catch (error) {
      logger.warn('[updates] Failed to restart into OTA update', {
        error: error instanceof Error ? error.message : String(error),
      });
      setRestartFailed(true);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={handleLater}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss update prompt"
          onPress={handleLater}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.dialog} accessibilityRole="alert">
          <Text style={styles.title}>Update ready</Text>
          <Text style={styles.body}>
            A fresh app update is ready. Restart now to use the latest version.
          </Text>
          {restartFailed && (
            <Text style={styles.errorText}>
              Restart failed. Please close and reopen the app to apply the update.
            </Text>
          )}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Later"
              disabled={isRestarting}
              onPress={handleLater}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>Later</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Restart"
              disabled={isRestarting || isDownloading}
              onPress={handleRestart}
              style={({ pressed }) => [
                styles.button,
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {isRestarting ? (
                <ActivityIndicator color={theme.textPrimary} />
              ) : (
                <Text style={styles.buttonText}>Restart</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1000,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
      backgroundColor: 'rgba(0, 0, 0, 0.62)',
    },
    dialog: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 28,
      padding: 28,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: theme.backgroundSecondary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.35,
      shadowRadius: 32,
      elevation: 12,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 25,
      fontWeight: '800',
      marginBottom: 18,
    },
    body: {
      color: theme.textSecondary,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 26,
      marginBottom: 26,
    },
    errorText: {
      color: theme.error,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 18,
      marginBottom: 18,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      minHeight: 54,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    primaryButton: {
      backgroundColor: theme.cardSurfaceStrong,
    },
    secondaryButton: {
      backgroundColor: theme.surfaceLight,
    },
    buttonPressed: {
      opacity: 0.82,
    },
    buttonText: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: '800',
    },
  });
