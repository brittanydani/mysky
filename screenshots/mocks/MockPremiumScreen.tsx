/**
 * MockPremiumScreen
 *
 * Simplified visual mock of the Deeper Sky paywall for App Store screenshots.
 * Shows: hero eclipse, headline copy, value propositions, pricing cards, CTA button.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Circle, BlurMask, RadialGradient, vec } from '@shopify/react-native-skia';

const PALETTE = {
  gold: '#D8C39A',
  goldLight: '#F3E5AB',
  goldDim: '#A8905A',
  indigo: '#243B6B',
  text: '#F8FAFC',
  textMuted: 'rgba(255,255,255,0.55)',
  textDim: 'rgba(255,255,255,0.35)',
  surface: 'rgba(255,255,255,0.05)',
  surfaceSelected: 'rgba(216,195,154,0.12)',
  border: 'rgba(255,255,255,0.07)',
  borderSelected: 'rgba(216,195,154,0.35)',
  badge: 'rgba(216,195,154,0.15)',
};

const VALUE_PROPS = [
  { icon: '📅', title: 'Track change over time', desc: 'Weekly shifts and recurring themes' },
  { icon: '📊', title: 'Understand what helps or hurts', desc: 'See what restores and drains you' },
  { icon: '✦', title: 'Get more personal guidance', desc: 'Shaped by your history, not just today' },
  { icon: '🔒', title: 'Private by design', desc: 'Core reflections stay encrypted on-device' },
];

interface Props {
  width: number;
  height: number;
}

export default function MockPremiumScreen({ width, height }: Props) {
  const cx = width / 2;
  const heroSize = width * 0.44;
  const heroR = heroSize / 2;
  const heroCx = cx;
  const heroCy = heroSize * 0.55;

  const cardWidth = (width - 48) / 2;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Ambient background glow */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Gold glow top-center */}
        <Circle cx={cx} cy={heroCy + heroR * 0.2} r={heroR * 1.6}>
          <RadialGradient
            c={vec(cx, heroCy + heroR * 0.2)}
            r={heroR * 1.6}
            colors={['rgba(216,195,154,0.18)', 'rgba(216,195,154,0)']}
          />
          <BlurMask blur={30} style="normal" />
        </Circle>
        {/* Indigo glow bottom */}
        <Circle cx={cx} cy={height * 0.78} r={width * 0.55}>
          <RadialGradient
            c={vec(cx, height * 0.78)}
            r={width * 0.55}
            colors={['rgba(36,59,107,0.30)', 'rgba(36,59,107,0)']}
          />
          <BlurMask blur={40} style="normal" />
        </Circle>
      </Canvas>

      {/* ── Hero Eclipse ── */}
      <View style={[styles.heroSection, { marginTop: height * 0.05 }]}>
        <View style={[styles.eclipse, { width: heroSize * 1.4, height: heroSize * 1.4, borderRadius: heroSize * 0.7 }]}>
          <View style={[styles.ringOuter, { width: heroSize * 1.1, height: heroSize * 1.1, borderRadius: heroSize * 0.55 }]} />
          <View style={[styles.ringInner, { width: heroSize * 0.82, height: heroSize * 0.82, borderRadius: heroSize * 0.41 }]} />
          <View style={[styles.core, { width: heroSize * 0.55, height: heroSize * 0.55, borderRadius: heroSize * 0.28 }]}>
            <Text style={[styles.diamondGlyph, { fontSize: heroSize * 0.28 }]}>◆</Text>
          </View>
        </View>
      </View>

      {/* ── Badge + Headline ── */}
      <View style={styles.header}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>✦  DEEPER SKY</Text>
        </View>
        <Text style={[styles.heroTitle, { fontSize: width * 0.068 }]}>
          See what your patterns{'\n'}are teaching you
        </Text>
        <Text style={[styles.heroSubtitle, { fontSize: width * 0.038 }]}>
          Weekly shifts, recurring themes, and personal{'\n'}guidance shaped by your history.
        </Text>
      </View>

      {/* ── Value Props ── */}
      <View style={[styles.valueSection, { marginHorizontal: 20 }]}>
        {VALUE_PROPS.map((item) => (
          <View key={item.title} style={styles.valueRow}>
            <Text style={styles.valueIcon}>{item.icon}</Text>
            <View style={styles.valueText}>
              <Text style={[styles.valueTitle, { fontSize: width * 0.034 }]}>{item.title}</Text>
              <Text style={[styles.valueDesc, { fontSize: width * 0.029 }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Pricing Cards ── */}
      <View style={[styles.pricingRow, { marginHorizontal: 16, marginTop: height * 0.025 }]}>
        {/* Annual (selected) */}
        <View style={[styles.pricingCard, styles.pricingCardSelected, { width: cardWidth }]}>
          <View style={styles.bestValueBadge}>
            <Text style={[styles.bestValueText, { fontSize: width * 0.026 }]}>BEST FOR GROWTH</Text>
          </View>
          <Text style={[styles.pricingPeriod, { fontSize: width * 0.03 }]}>12 Months</Text>
          <Text style={[styles.pricingPrice, styles.pricingPriceSelected, { fontSize: width * 0.07 }]}>$29.99</Text>
          <Text style={[styles.pricingMeta, styles.pricingMetaSelected, { fontSize: width * 0.026 }]}>
            Build your pattern archive all year
          </Text>
        </View>

        {/* Monthly */}
        <View style={[styles.pricingCard, { width: cardWidth }]}>
          <View style={styles.pricingBadgePlaceholder} />
          <Text style={[styles.pricingPeriod, { fontSize: width * 0.03 }]}>1 Month</Text>
          <Text style={[styles.pricingPrice, { fontSize: width * 0.07 }]}>$4.99</Text>
          <Text style={[styles.pricingMeta, { fontSize: width * 0.026 }]}>
            Flexible monthly access
          </Text>
        </View>
      </View>

      {/* ── CTA Button ── */}
      <View style={[styles.ctaWrap, { marginHorizontal: 16, marginTop: height * 0.02 }]}>
        <View style={styles.ctaButton}>
          <Text style={[styles.ctaText, { fontSize: width * 0.042 }]}>Start 7-Day Free Trial</Text>
        </View>
        <Text style={[styles.ctaSubtext, { fontSize: width * 0.028 }]}>
          Cancel anytime · Then $29.99/yr
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#05060A',
    overflow: 'hidden',
  },
  heroSection: {
    alignItems: 'center',
  },
  eclipse: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ringOuter: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(216,195,154,0.15)',
    backgroundColor: 'transparent',
  },
  ringInner: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(216,195,154,0.28)',
    backgroundColor: 'transparent',
  },
  core: {
    backgroundColor: 'rgba(216,195,154,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(216,195,154,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondGlyph: {
    color: '#D8C39A',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 12,
  },
  badgePill: {
    backgroundColor: 'rgba(216,195,154,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(216,195,154,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 10,
  },
  badgeText: {
    color: '#D8C39A',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  heroTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: undefined,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: undefined,
  },
  valueSection: {
    marginTop: 14,
    gap: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  valueIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  valueText: {
    flex: 1,
  },
  valueTitle: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  valueDesc: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pricingCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 12,
    alignItems: 'flex-start',
    gap: 4,
  },
  pricingCardSelected: {
    backgroundColor: 'rgba(216,195,154,0.10)',
    borderColor: 'rgba(216,195,154,0.35)',
  },
  bestValueBadge: {
    backgroundColor: 'rgba(216,195,154,0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  bestValueText: {
    color: '#D8C39A',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pricingBadgePlaceholder: {
    height: 22,
    marginBottom: 2,
  },
  pricingPeriod: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  pricingPrice: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  pricingPriceSelected: {
    color: '#D8C39A',
  },
  pricingMeta: {
    color: 'rgba(255,255,255,0.4)',
  },
  pricingMetaSelected: {
    color: 'rgba(216,195,154,0.75)',
  },
  ctaWrap: {
    alignItems: 'center',
    gap: 8,
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#D8C39A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0B0F1A',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ctaSubtext: {
    color: 'rgba(255,255,255,0.35)',
  },
});
