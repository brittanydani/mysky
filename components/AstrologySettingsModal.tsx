/**
 * Astrology Settings Modal
 * * Allows users to configure:
 * - House system (Placidus, Whole Sign, etc.)
 * - Orb presets (Tight, Normal, Wide)
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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const updated = await AstrologySettingsService.saveSettings({
        houseSystem: selectedHouseSystem,
        orbPreset: selectedOrbPreset,
      });

      try {
        await localDb.updateAllChartsHouseSystem(selectedHouseSystem);
      } catch (e) {
        logger.error('[AstrologySettingsModal] Failed to update charts house system:', e);
      }

      setSettings(updated);
      onSettingsChanged?.(updated);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onClose();
    } catch (error) {
      logger.error('[AstrologySettingsModal] Failed to save settings:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (type: 'house' | 'orb', value: any) => {
    Haptics.selectionAsync().catch(() => {});
    if (type === 'house') setSelectedHouseSystem(value);
    else setSelectedOrbPreset(value);
  };

  const hasChanges =
    settings &&
    (settings.houseSystem !== selectedHouseSystem || settings.orbPreset !== selectedOrbPreset);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View style={styles.modalContainer}>
          <LinearGradient colors={['rgba(30, 35, 50, 0.98)', '#020817']} style={styles.modalContent}>
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIndicator} />
              <View style={styles.headerRow}>
                <Text style={styles.title}>Calculation Settings</Text>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={theme.textMuted} />
                </Pressable>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}><ActivityIndicator color={PALETTE.gold} /></View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* House Systems */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>House System</Text>
                  <Text style={styles.sectionSub}>Determines how the 12 houses are mapped to your location.</Text>
                  
                  <View style={styles.optionsList}>
                    {HOUSE_SYSTEM_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[styles.houseCard, selectedHouseSystem === option.value && styles.cardSelected]}
                        onPress={() => handleSelect('house', option.value)}
                      >
                        <View style={styles.cardHeader}>
                          <Text style={[styles.optionTitle, selectedHouseSystem === option.value && { color: PALETTE.gold }]}>
                            {option.label}
                          </Text>
                          <View style={[styles.radio, selectedHouseSystem === option.value && styles.radioActive]}>
                            {selectedHouseSystem === option.value && <View style={styles.radioInner} />}
                          </View>
                        </View>
                        <Text style={styles.optionSub}>{option.description}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Aspect Orbs */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Aspect Precision</Text>
                  <Text style={styles.sectionSub}>Adjust the mathematical tolerance for planetary angles.</Text>
                  
                  <View style={styles.orbGrid}>
                    {ORB_PRESET_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[styles.orbCard, selectedOrbPreset === option.value && styles.cardSelected]}
                        onPress={() => handleSelect('orb', option.value)}
                      >
                        <Ionicons 
                          name={option.value === 'tight' ? 'contract' : option.value === 'wide' ? 'expand' : 'remove'} 
                          size={20} 
                          color={selectedOrbPreset === option.value ? PALETTE.gold : theme.textMuted} 
                        />
                        <Text style={[styles.orbLabel, selectedOrbPreset === option.value && { color: PALETTE.gold }]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.infoNote}>
                  <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
                  <Text style={styles.infoNoteText}>Changes will recalculate your chart and relationship profiles.</Text>
                </View>

              </ScrollView>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Pressable 
                style={[styles.saveBtn, (!hasChanges || saving) && styles.saveBtnDisabled]} 
                onPress={handleSave} 
                disabled={!hasChanges || saving}
              >
                <LinearGradient 
                  colors={!hasChanges ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['#FFF4D6', '#C9AE78', '#6B532E']} 
                  style={styles.saveBtnGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="#0B1220" size="small" />
                  ) : (
                    <Text style={[styles.saveBtnText, !hasChanges && { color: theme.textMuted }]}>Apply Changes</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  modalContent: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  headerIndicator: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 20 },
  headerRow: { flexDirection: 'row', width: '100%', paddingHorizontal: 24, justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  closeBtn: { padding: 4 },

  loadingContainer: { padding: 60, alignItems: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },

  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: PALETTE.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  sectionSub: { fontSize: 14, color: theme.textMuted, lineHeight: 20, marginBottom: 16 },

  optionsList: { gap: 10 },
  houseCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  cardSelected: { backgroundColor: 'rgba(232,214,174,0.08)', borderColor: 'rgba(232,214,174,0.25)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: PALETTE.textMain },
  optionSub: { fontSize: 12, color: theme.textMuted, lineHeight: 18 },

  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: PALETTE.gold },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.gold },

  orbGrid: { flexDirection: 'row', gap: 10 },
  orbCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    alignItems: 'center',
    gap: 8,
  },
  orbLabel: { fontSize: 13, fontWeight: '700', color: theme.textSecondary },

  infoNote: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 },
  infoNoteText: { flex: 1, fontSize: 12, color: theme.textMuted, fontStyle: 'italic' },

  footer: { padding: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#020817', fontSize: 16, fontWeight: '700' },
});
