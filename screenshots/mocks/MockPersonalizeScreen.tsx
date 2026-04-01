/**
 * MockPersonalizeScreen
 *
 * Simplified visual mock of the Settings/Personalization screen for Screenshot #6.
 * Shows: atmosphere color selector, visual theme options, shader preview, toggle settings.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  BlurMask,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';

const PALETTE = {
  gold: '#D8C39A',
  goldLight: '#F3E5AB',
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  amethyst: '#9D76C1',
  rose: '#D4A3B3',
  text: '#F8FAFC',
  textMuted: 'rgba(255,255,255,0.5)',
  glassBorder: 'rgba(255,255,255,0.06)',
  surface: 'rgba(30, 45, 71, 0.5)',
};

const ATMOSPHERE_COLORS = [
  { name: 'Golden Dusk', colors: ['#FFF4D6', '#E9D9B8', '#C9AE78', '#9B7A46', '#6B532E'] },
  { name: 'Ocean Calm', colors: ['#C9AE78', '#243B6B', '#1B2A4A'] },
  { name: 'Forest Deep', colors: ['#6EBF8B', '#2E7A68', '#1A4A3A'] },
  { name: 'Amethyst', colors: ['#9D76C1', '#4A3B6B', '#3D2952'] },
  { name: 'Rose Quartz', colors: ['#D4A3B3', '#3D2940', '#2D1F30'] },
  { name: 'Copper Flame', colors: ['#CD7F5D', '#A46B4C', '#5C3A2A'] },
];

interface Props {
  width: number;
  height: number;
}

function SettingToggle({
  label,
  description,
  active,
}: {
  label: string;
  description: string;
  active: boolean;
}) {
  return (
    <View style={toggleStyles.row}>
      <View style={toggleStyles.textCol}>
        <Text style={toggleStyles.label}>{label}</Text>
        <Text style={toggleStyles.description}>{description}</Text>
      </View>
      <View style={[toggleStyles.toggle, active && toggleStyles.toggleActive]}>
        <View style={[toggleStyles.thumb, active && toggleStyles.thumbActive]} />
      </View>
    </View>
  );
}

export default function MockPersonalizeScreen({ width, height }: Props) {
  const cardWidth = width - 32;
  const swatchSize = (cardWidth - 56) / 6; // 6 swatches with gaps
  const previewSize = width * 0.4;
  const previewCenter = previewSize / 2;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Space</Text>
        <Text style={styles.subtitle}>Personalize your reflection environment</Text>
      </View>

      {/* Atmosphere Preview */}
      <View style={[styles.previewContainer, { width: previewSize, height: previewSize }]}>
        <Canvas style={{ width: previewSize, height: previewSize }}>
          {/* Multi-color spectrum glow */}
          <Circle cx={previewCenter} cy={previewCenter} r={previewSize * 0.42} color={PALETTE.gold} opacity={0.12}>
            <BlurMask blur={30} style="normal" />
          </Circle>
          <Circle cx={previewCenter - 20} cy={previewCenter + 10} r={previewSize * 0.3} color={PALETTE.emerald} opacity={0.1}>
            <BlurMask blur={25} style="normal" />
          </Circle>
          <Circle cx={previewCenter + 15} cy={previewCenter - 10} r={previewSize * 0.28} color={PALETTE.amethyst} opacity={0.1}>
            <BlurMask blur={25} style="normal" />
          </Circle>
          {/* Core orb */}
          <Circle cx={previewCenter} cy={previewCenter} r={previewSize * 0.2}>
            <SweepGradient
              c={vec(previewCenter, previewCenter)}
              colors={[PALETTE.gold, PALETTE.emerald, PALETTE.amethyst, PALETTE.rose, PALETTE.gold]}
            />
            <BlurMask blur={4} style="solid" />
          </Circle>
        </Canvas>
      </View>

      {/* Atmosphere Color Selector */}
      <View style={[styles.card, { width: cardWidth }]}>
        <Text style={styles.cardLabel}>ATMOSPHERE</Text>
        <View style={styles.swatchRow}>
          {ATMOSPHERE_COLORS.map((atm, i) => (
            <View key={atm.name} style={styles.swatchContainer}>
              <Canvas style={{ width: swatchSize, height: swatchSize }}>
                <Circle cx={swatchSize / 2} cy={swatchSize / 2} r={swatchSize / 2 - 2}>
                  <SweepGradient
                    c={vec(swatchSize / 2, swatchSize / 2)}
                    colors={atm.colors}
                  />
                </Circle>
                {i === 0 && (
                  <Circle
                    cx={swatchSize / 2}
                    cy={swatchSize / 2}
                    r={swatchSize / 2 + 1}
                    style="stroke"
                    strokeWidth={2}
                    color={PALETTE.gold}
                  />
                )}
              </Canvas>
              <Text style={[styles.swatchName, i === 0 && { color: PALETTE.gold }]}>{atm.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Visual Theme Options */}
      <View style={[styles.card, { width: cardWidth }]}>
        <Text style={styles.cardLabel}>VISUAL THEME</Text>
        <View style={styles.themeRow}>
          {['Nebula', 'Minimal', 'Aurora'].map((theme, i) => (
            <View key={theme} style={[styles.themeOption, i === 0 && styles.themeActive]}>
              <View style={[styles.themePreview, { backgroundColor: i === 0 ? '#0E1830' : '#020817' }]}>
                <Canvas style={{ width: 48, height: 48 }}>
                  <Circle cx={24} cy={24} r={12} color={ATMOSPHERE_COLORS[i].colors[0]} opacity={0.4}>
                    <BlurMask blur={8} style="normal" />
                  </Circle>
                </Canvas>
              </View>
              <Text style={[styles.themeLabel, i === 0 && { color: PALETTE.gold }]}>{theme}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Toggle Settings */}
      <View style={[styles.card, { width: cardWidth }]}>
        <Text style={styles.cardLabel}>EXPERIENCE</Text>
        <SettingToggle label="Haptic Feedback" description="Gentle vibrations during check-ins" active={true} />
        <SettingToggle label="Starfield Animation" description="Ambient star particles" active={true} />
        <SettingToggle label="Breathing Guide" description="Show portal before journaling" active={true} />
        <SettingToggle label="Sound Effects" description="Subtle atmospheric sounds" active={false} />
      </View>
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  textCol: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    color: PALETTE.text,
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    color: PALETTE.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: 'rgba(212, 175, 55,0.3)',
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  thumbActive: {
    backgroundColor: PALETTE.gold,
    alignSelf: 'flex-end',
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020817',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    color: PALETTE.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  subtitle: {
    color: PALETTE.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  previewContainer: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    padding: 14,
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: PALETTE.gold,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  swatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  swatchContainer: {
    alignItems: 'center',
  },
  swatchName: {
    color: PALETTE.textMuted,
    fontSize: 7,
    marginTop: 4,
    textAlign: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeActive: {
    borderColor: 'rgba(212, 175, 55,0.3)',
    backgroundColor: 'rgba(212, 175, 55,0.05)',
  },
  themePreview: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginBottom: 6,
    overflow: 'hidden',
  },
  themeLabel: {
    color: PALETTE.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
});
