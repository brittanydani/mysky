/**
 * Astrology Settings Modal
 * * Allows users to configure:
 * - Zodiac system (Tropical, Sidereal)
 * - Ayanamsa (Lahiri, Fagan-Bradley, etc.) — only when sidereal
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
} from 'react-native';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MetallicText } from './ui/MetallicText';
import { MetallicIcon } from './ui/MetallicIcon';

import { type AppTheme } from '../constants/theme';
import {
  AstrologySettingsService,
  AstrologySettings,
  HOUSE_SYSTEM_OPTIONS,
  ZODIAC_SYSTEM_OPTIONS,
  AYANAMSA_OPTIONS,
  ORB_PRESET_OPTIONS,
  CHART_ORIENTATION_OPTIONS,
  OrbPreset,
  ChartOrientation,
} from '../services/astrology/astrologySettingsService';
import { HouseSystem, ZodiacSystem, Ayanamsa } from '../services/astrology/types';
import { localDb } from '../services/storage/localDb';
import { logger } from '../utils/logger';
import SkiaMetallicPill from './ui/SkiaMetallicPill';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.06)',
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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const modalBackgroundGradient = theme.isDark
    ? ['rgba(30, 35, 50, 0.98)', '#020817']
    : ['rgba(255, 252, 247, 0.98)', 'rgba(241, 233, 221, 0.98)'];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AstrologySettings | null>(null);
  const [selectedZodiacSystem, setSelectedZodiacSystem] = useState<ZodiacSystem>('tropical');
  const [selectedAyanamsa, setSelectedAyanamsa] = useState<Ayanamsa>('lahiri');
  const [selectedHouseSystem, setSelectedHouseSystem] = useState<HouseSystem>('placidus');
  const [selectedOrbPreset, setSelectedOrbPreset] = useState<OrbPreset>('normal');
  const [selectedOrientation, setSelectedOrientation] = useState<ChartOrientation>('standard-natal');

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
      setSelectedZodiacSystem(current.zodiacSystem);
      setSelectedAyanamsa(current.ayanamsa);
      setSelectedHouseSystem(current.houseSystem);
      setSelectedOrbPreset(current.orbPreset);
      setSelectedOrientation(current.chartOrientation ?? 'standard-natal');
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
        zodiacSystem: selectedZodiacSystem,
        ayanamsa: selectedAyanamsa,
        houseSystem: selectedHouseSystem,
        orbPreset: selectedOrbPreset,
        chartOrientation: selectedOrientation,
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

  const handleSelect = (type: 'zodiac' | 'ayanamsa' | 'house' | 'orb' | 'orientation', value: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (type === 'zodiac') {
      setSelectedZodiacSystem(value as ZodiacSystem);
    } else if (type === 'ayanamsa') {
      setSelectedAyanamsa(value as Ayanamsa);
    } else if (type === 'house') {
      setSelectedHouseSystem(value as HouseSystem);
    } else if (type === 'orientation') {
      setSelectedOrientation(value as ChartOrientation);
    } else {
      setSelectedOrbPreset(value as OrbPreset);
    }
  };

  const hasChanges =
    settings &&
    (settings.zodiacSystem !== selectedZodiacSystem ||
      settings.ayanamsa !== selectedAyanamsa ||
      settings.houseSystem !== selectedHouseSystem ||
      settings.orbPreset !== selectedOrbPreset ||
      (settings.chartOrientation ?? 'standard-natal') !== selectedOrientation);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient colors={modalBackgroundGradient} style={StyleSheet.absoluteFillObject} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIndicator} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Calculation Settings</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-outline" size={22} color={theme.textMuted} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}><ActivityIndicator color={PALETTE.gold} /></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Zodiac System */}
            <View style={styles.section}>
              <MetallicText style={styles.sectionLabel} color={PALETTE.gold}>Zodiac System</MetallicText>
              <Text style={styles.sectionSub}>Determines where the zodiac signs are measured.</Text>
              
              <View style={styles.optionsList}>
                {ZODIAC_SYSTEM_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[styles.houseCard, selectedZodiacSystem === option.value && styles.cardSelected]}
                    onPress={() => handleSelect('zodiac', option.value)}
                  >
                    <View style={styles.cardHeader}>
                      {selectedZodiacSystem === option.value ? (
                        <MetallicText style={styles.optionTitle} color={PALETTE.gold}>{option.label}</MetallicText>
                      ) : (
                        <Text style={styles.optionTitle}>{option.label}</Text>
                      )}
                      <View style={[styles.radio, selectedZodiacSystem === option.value && styles.radioActive]}>
                        {selectedZodiacSystem === option.value && <View style={styles.radioInner} />}
                      </View>
                    </View>
                    <Text style={styles.optionSub}>{option.description}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Ayanamsa — only visible in sidereal mode */}
            {selectedZodiacSystem === 'sidereal' && (
              <View style={styles.section}>
                <MetallicText style={styles.sectionLabel} color={PALETTE.gold}>Ayanamsa</MetallicText>
                <Text style={styles.sectionSub}>The sidereal reference point used to align the zodiac with fixed stars.</Text>
                
                <View style={styles.optionsList}>
                  {AYANAMSA_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[styles.houseCard, selectedAyanamsa === option.value && styles.cardSelected]}
                      onPress={() => handleSelect('ayanamsa', option.value)}
                    >
                      <View style={styles.cardHeader}>
                        {selectedAyanamsa === option.value ? (
                          <MetallicText style={styles.optionTitle} color={PALETTE.gold}>{option.label}</MetallicText>
                        ) : (
                          <Text style={styles.optionTitle}>{option.label}</Text>
                        )}
                        <View style={[styles.radio, selectedAyanamsa === option.value && styles.radioActive]}>
                          {selectedAyanamsa === option.value && <View style={styles.radioInner} />}
                        </View>
                      </View>
                      <Text style={styles.optionSub}>{option.description}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* House Systems */}
            <View style={styles.section}>
              <MetallicText style={styles.sectionLabel} color={PALETTE.gold}>House System</MetallicText>
              <Text style={styles.sectionSub}>Changing the house system recalculates house placements — planet signs are not affected.</Text>
              
              <View style={styles.optionsList}>
                {HOUSE_SYSTEM_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[styles.houseCard, selectedHouseSystem === option.value && styles.cardSelected]}
                    onPress={() => handleSelect('house', option.value)}
                  >
                    <View style={styles.cardHeader}>
                      {selectedHouseSystem === option.value ? (
                        <MetallicText style={styles.optionTitle} color={PALETTE.gold}>{option.label}</MetallicText>
                      ) : (
                        <Text style={styles.optionTitle}>{option.label}</Text>
                      )}
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
              <MetallicText style={styles.sectionLabel} color={PALETTE.gold}>Aspect Precision</MetallicText>
              <Text style={styles.sectionSub}>Adjust the mathematical tolerance for planetary angles.</Text>
              
              <View style={styles.orbGrid}>
                {ORB_PRESET_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[styles.orbCard, selectedOrbPreset === option.value && styles.cardSelected]}
                    onPress={() => handleSelect('orb', option.value)}
                  >
                    {selectedOrbPreset === option.value ? (
                      <MetallicIcon 
                        name={option.value === 'tight' ? 'contract' : option.value === 'wide' ? 'expand' : 'remove'} 
                        size={20} 
                        color={PALETTE.gold} 
                      />
                    ) : (
                      <Ionicons 
                        name={option.value === 'tight' ? 'contract' : option.value === 'wide' ? 'expand' : 'remove'} 
                        size={20} 
                        color={theme.textMuted} 
                      />
                    )}
                    {selectedOrbPreset === option.value ? (
                      <MetallicText style={styles.orbLabel} color={PALETTE.gold}>{option.label}</MetallicText>
                    ) : (
                      <Text style={styles.orbLabel}>{option.label}</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
              <Text style={styles.infoNoteText}>Changes will recalculate your chart and relationship profiles.</Text>
            </View>

            {/* Orientation vs House System note */}
            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
              <Text style={styles.infoNoteText}>
                {'Changing chart orientation affects display only. Changing the house system can change house placements.'}
              </Text>
            </View>

            {/* Chart Orientation */}
            <View style={styles.section}>
              <MetallicText style={styles.sectionLabel} color={PALETTE.gold}>Chart Orientation</MetallicText>
              <Text style={styles.sectionSub}>Display only — no planet or house data changes.</Text>

              <View style={styles.optionsList}>
                {CHART_ORIENTATION_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[styles.houseCard, selectedOrientation === option.value && styles.cardSelected]}
                    onPress={() => handleSelect('orientation', option.value)}
                  >
                    <View style={styles.cardHeader}>
                      {selectedOrientation === option.value ? (
                        <MetallicText style={styles.optionTitle} color={PALETTE.gold}>{option.label}</MetallicText>
                      ) : (
                        <Text style={styles.optionTitle}>{option.label}</Text>
                      )}
                      <View style={[styles.radio, selectedOrientation === option.value && styles.radioActive]}>
                        {selectedOrientation === option.value && <View style={styles.radioInner} />}
                      </View>
                    </View>
                    <Text style={styles.optionSub}>{option.description}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

          </ScrollView>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <SkiaMetallicPill
            label={saving ? 'Applying…' : 'Apply Changes'}
            onPress={handleSave}
            disabled={!hasChanges || saving}
            icon={saving ? <ActivityIndicator color="#1A1815" size="small" /> : undefined}
          />
        </View>

      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  headerIndicator: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'transparent', marginBottom: 20 },
  headerRow: { flexDirection: 'row', width: '100%', paddingHorizontal: 24, justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, color: theme.textPrimary, fontWeight: '700' },
  closeBtn: { padding: 4 },

  loadingContainer: { padding: 60, alignItems: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 },

  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: PALETTE.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  sectionSub: { fontSize: 14, color: theme.textSecondary, lineHeight: 20, marginBottom: 16 },

  optionsList: { gap: 10 },
  houseCard: {
    padding: 28,
    borderRadius: 24,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : theme.cardSurfaceStrong,
    borderWidth: 1,
    borderColor: theme.isDark ? theme.cardBorder : theme.cardBorder,
  },
  cardSelected: { backgroundColor: theme.isDark ? 'transparent' : theme.surfaceLight, borderColor: theme.isDark ? 'rgba(232,214,174,0.25)' : 'rgba(201,174,120,0.28)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  optionSub: { fontSize: 12, color: theme.textSecondary, lineHeight: 18 },

  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(111, 85, 46, 0.26)', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: PALETTE.gold },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.gold },

  orbGrid: { flexDirection: 'row', gap: 10 },
  orbCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : theme.cardSurfaceStrong,
    borderWidth: 1,
    borderColor: theme.isDark ? theme.cardBorder : theme.cardBorder,
    alignItems: 'center',
    gap: 8,
  },
  orbLabel: { fontSize: 13, fontWeight: '700', color: theme.textSecondary },

  infoNote: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : theme.cardSurface, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: theme.isDark ? theme.cardBorder : theme.cardBorder },
  infoNoteText: { flex: 1, fontSize: 12, color: theme.textSecondary },

  footer: { padding: 24, borderTopWidth: 1, borderTopColor: theme.isDark ? 'rgba(255,255,255,0.08)' : theme.cardBorder },
});
