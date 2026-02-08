/**
 * Astrology Settings Modal
 * 
 * Allows users to configure:
 * - House system (Placidus, Whole Sign, etc.)
 * - Orb presets (Tight, Normal, Wide)
 * 
 * Clean, native iOS feel with gold accent theme.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
// Animated entering/exiting removed — causes invisible modal inside <Modal> on some RN/Reanimated versions

import { theme } from '../constants/theme';
import {
  AstrologySettingsService,
  AstrologySettings,
  HOUSE_SYSTEM_OPTIONS,
  ORB_PRESET_OPTIONS,
  OrbPreset,
} from '../services/astrology/astrologySettingsService';
import { HouseSystem } from '../services/astrology/types';
import { localDb } from '../services/storage/localDb';
import { logger } from '../utils/logger';

interface AstrologySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSettingsChanged?: (settings: AstrologySettings) => void;
}

export default function AstrologySettingsModal({
  visible,
  onClose,
  onSettingsChanged,
}: AstrologySettingsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AstrologySettings | null>(null);
  const [selectedHouseSystem, setSelectedHouseSystem] = useState<HouseSystem>('placidus');
  const [selectedOrbPreset, setSelectedOrbPreset] = useState<OrbPreset>('normal');

  // Load settings when modal opens
  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const current = await AstrologySettingsService.getSettings();
      setSettings(current);
      setSelectedHouseSystem(current.houseSystem);
      setSelectedOrbPreset(current.orbPreset);
    } catch (error) {
      logger.error('[AstrologySettingsModal] Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updated = await AstrologySettingsService.saveSettings({
        houseSystem: selectedHouseSystem,
        orbPreset: selectedOrbPreset,
      });

      // Persist house system to all saved charts in the database
      // so every screen that reads savedChart.houseSystem picks it up
      try {
        await localDb.updateAllChartsHouseSystem(selectedHouseSystem);
      } catch (e) {
        logger.error('[AstrologySettingsModal] Failed to update charts house system:', e);
      }

      setSettings(updated);
      onSettingsChanged?.(updated);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      logger.error('[AstrologySettingsModal] Failed to save settings:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleHouseSystemSelect = async (value: HouseSystem) => {
    await Haptics.selectionAsync();
    setSelectedHouseSystem(value);
  };

  const handleOrbPresetSelect = async (value: OrbPreset) => {
    await Haptics.selectionAsync();
    setSelectedOrbPreset(value);
  };

  const hasChanges =
    settings &&
    (settings.houseSystem !== selectedHouseSystem || settings.orbPreset !== selectedOrbPreset);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlayBackground}>
        <View style={styles.overlay}>
          <Pressable style={styles.dismissArea} onPress={onClose} />

          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[theme.surface, 'rgba(18, 25, 38, 0.98)']}
              style={styles.modalContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Ionicons name="settings" size={24} color={theme.primary} />
                  <Text style={styles.title}>Chart Settings</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.textMuted} />
                </Pressable>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={theme.primary} />
                </View>
              ) : (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* House System Section */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="home" size={18} color={theme.primary} />
                      <Text style={styles.sectionTitle}>House System</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                      Choose how the 12 houses are calculated in your chart
                    </Text>

                    <View style={styles.optionsContainer}>
                      {HOUSE_SYSTEM_OPTIONS.map((option) => (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.optionCard,
                            selectedHouseSystem === option.value && styles.optionCardSelected,
                          ]}
                          onPress={() => handleHouseSystemSelect(option.value)}
                        >
                          <View style={styles.optionHeader}>
                            <View
                              style={[
                                styles.radioOuter,
                                selectedHouseSystem === option.value && styles.radioOuterSelected,
                              ]}
                            >
                              {selectedHouseSystem === option.value && (
                                <View style={styles.radioInner} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.optionLabel,
                                selectedHouseSystem === option.value && styles.optionLabelSelected,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </View>
                          <Text style={styles.optionDescription}>{option.description}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Orb Presets Section */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="resize" size={18} color={theme.primary} />
                      <Text style={styles.sectionTitle}>Aspect Orbs</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                      How wide of an angle counts as an aspect
                    </Text>

                    <View style={styles.orbOptionsRow}>
                      {ORB_PRESET_OPTIONS.map((option) => (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.orbCard,
                            selectedOrbPreset === option.value && styles.orbCardSelected,
                          ]}
                          onPress={() => handleOrbPresetSelect(option.value)}
                        >
                          <View
                            style={[
                              styles.orbIconContainer,
                              selectedOrbPreset === option.value && styles.orbIconSelected,
                            ]}
                          >
                            <Ionicons
                              name={
                                option.value === 'tight'
                                  ? 'contract'
                                  : option.value === 'wide'
                                  ? 'expand'
                                  : 'remove'
                              }
                              size={20}
                              color={
                                selectedOrbPreset === option.value ? theme.primary : theme.textMuted
                              }
                            />
                          </View>
                          <Text
                            style={[
                              styles.orbLabel,
                              selectedOrbPreset === option.value && styles.orbLabelSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text style={styles.orbDescription}>{option.description}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Info Box */}
                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={18} color={theme.textMuted} />
                    <Text style={styles.infoText}>
                      Changes will apply to new chart calculations. Existing cached interpretations
                      may need to be refreshed.
                    </Text>
                  </View>
                </ScrollView>
              )}

              {/* Footer Actions */}
              <View style={styles.footer}>
                <Pressable style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveButton,
                    (!hasChanges || saving) && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={!hasChanges || saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#0D1421" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#0D1421" />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  loadingContainer: {
    padding: theme.spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    maxHeight: 480,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  sectionDescription: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  optionsContainer: {
    gap: theme.spacing.sm,
  },
  optionCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(201, 169, 98, 0.08)',
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: theme.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.primary,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  optionLabelSelected: {
    color: theme.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: theme.textMuted,
    marginLeft: 26,
  },
  orbOptionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  orbCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  orbCardSelected: {
    backgroundColor: 'rgba(201, 169, 98, 0.08)',
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  orbIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  orbIconSelected: {
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
  },
  orbLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  orbLabelSelected: {
    color: theme.primary,
  },
  orbDescription: {
    fontSize: 10,
    color: theme.textMuted,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: theme.borderRadius.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1421',
  },
});
