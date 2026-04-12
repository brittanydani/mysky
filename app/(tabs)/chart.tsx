// app/(tabs)/chart.tsx
// MySky — Chart (Blueprint) Screen
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" tints and opaque grey backgrounds.
// 2. Implemented "Midnight Slate" for heavy anchor elements (Tables, Glossary, Sections).
// 3. Implemented "Atmosphere" and "Stratosphere" washes for navigation and active states.
// 4. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 5. Reserved Metallic Gold strictly for hardware icons, glyphs, and key headers.

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import * as Haptics from 'expo-haptics';

import { type AppTheme } from '../../constants/theme';
import { metallicFillColors, metallicFillPositions } from '../../constants/mySkyMetallic';
import { METALLIC_RED } from '../../constants/metallicPalettes';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import SkiaBreathingRing from '../../components/ui/SkiaBreathingRing';
import NatalChartWheel from '../../components/ui/NatalChartWheel';
import MoonPhaseView from '../../components/ui/MoonPhaseView';
import AstrologySettingsModal from '../../components/AstrologySettingsModal';
import { localDb } from '../../services/storage/localDb';
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { NatalChart, PlanetPlacement, Aspect, BirthData } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { generateId } from '../../services/storage/models';
import { usePremium } from '../../context/PremiumContext';
import { MetallicText } from '../../components/ui/MetallicText';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { VelvetGlassSurface } from '../../components/ui/VelvetGlassSurface';
import { logger } from '../../utils/logger';
import { generateCoreIdentitySummary } from '../../services/astrology/natalSynthesis';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';
import { generatePlanetDeepDive, generateHouseDeepDives } from '../../services/astrology/natalDeepInterpretations';
import { detectChartShape, detectSingletons } from '../../services/astrology/dignityService';

// ── Cinematic Palette (Bioluminescent Lunar Sky) ──
const PALETTE = {
  gold: "#D4AF37",       // Metallic Hardware
  atmosphere: "#A2C2E1", // Navigation / Active (Icy Blue)
  stratosphere: "#5C7CAA", // Interpretation Shells
  slateMid: "#2C3645",   // Anchor Slate Top
  slateDeep: "#1A1E29",  // Anchor Slate Bottom
  ember: "#DC5050",      // Challenging Aspects
  sage: "#6B9080",       // Harmonious Aspects
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: "#FF7A5C", Earth: "#9ACD32", Air: "#49DFFF", Water: "#7B68EE",
};

const ZODIAC_FAMILY = Platform.select({ ios: "Apple Symbols", default: "sans-serif" });

const GRAD_PROPS = {
  colors: [...metallicFillColors] as string[],
  locations: [...metallicFillPositions] as number[],
  start: { x: 0, y: 0 }, end: { x: 1, y: 1 },
};

function GradientSymbol({ symbol, fontSize = 18, w = 28, h = 24, style, gradient }: any) {
  return (
    <MaskedView style={[{ width: w, height: h }, style]} maskElement={
      <Text style={{ fontFamily: ZODIAC_FAMILY, fontSize, color: "#000", lineHeight: h, width: w, textAlign: "center", backgroundColor: "transparent" }}>{symbol}</Text>
    }>
      <LinearGradient {...(gradient ?? GRAD_PROPS)} style={{ width: w, height: h }} />
    </MaskedView>
  );
}

function SectionAccordion({ title, subtitle, sectionKey, openSections, setOpenSections, children }: any) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isOpen = openSections.has(sectionKey);
  return (
    <>
      <Pressable
        onPress={() => setOpenSections((prev: Set<string>) => {
            const next = new Set(prev);
            if (next.has(sectionKey)) next.delete(sectionKey); else next.add(sectionKey);
            return next;
          })}
        style={styles.themedSectionHeader}
      >
        <View style={{ flex: 1 }}>
          <MetallicText style={styles.themedSectionHeaderText} variant="gold">{title}</MetallicText>
          {subtitle && <Text style={styles.patternDesc}>{subtitle}</Text>}
        </View>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={PALETTE.gold} />
      </Pressable>
      {isOpen ? children : null}
    </>
  );
}

type TabKey = "planets" | "houses" | "aspects" | "patterns";

export default function ChartScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { isPremium } = usePremium();

  const chartGradients = {
    anchor: ["rgba(44, 54, 69, 0.85)", "rgba(26, 30, 41, 0.40)"],
    atmosphere: ["rgba(162, 194, 225, 0.15)", "rgba(162, 194, 225, 0.05)"],
    stratosphere: ["rgba(92, 124, 170, 0.18)", "rgba(92, 124, 170, 0.05)"],
  };

  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("planets");
  const [people, setPeople] = useState<any[]>([]);
  const [activeOverlays, setActiveOverlays] = useState<any[]>([]);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["bigThree", "coreIdentity"]));
  const [viewMode, setViewMode] = useState<"essentials" | "complete">("essentials");
  const [showAstrologyModal, setShowAstrologyModal] = useState(false);
  const [chartOrientation, setChartOrientation] = useState<any>("standard-natal");

  const loadChart = async () => {
    try {
      const astroSettings = await AstrologySettingsService.getSettings();
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const saved = charts[0];
        const chart = AstrologyCalculator.generateNatalChart({
          date: saved.birthDate,
          time: saved.birthTime,
          hasUnknownTime: saved.hasUnknownTime,
          place: saved.birthPlace,
          latitude: saved.latitude,
          longitude: saved.longitude,
          timezone: saved.timezone,
          houseSystem: astroSettings.houseSystem,
          zodiacSystem: astroSettings.zodiacSystem,
          orbPreset: astroSettings.orbPreset
        });
        setUserChart(chart);
        if (isPremium) setPeople(await localDb.getRelationshipCharts(saved.id));
      }
    } catch (e) { logger.error(e); } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { loadChart(); }, [isPremium]));

  const activeChart = activeOverlays.length > 0 ? activeOverlays[0].chart : userChart;
  const coreIdentity = activeChart ? generateCoreIdentitySummary(activeChart) : null;

  if (loading) return <View style={[styles.container, styles.center]}><SkiaBreathingRing size={80} color="gold" /></View>;
  if (!userChart) return <View style={[styles.container, styles.center]}><Text style={styles.loadingText}>No chart found.</Text></View>;

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <View style={styles.headerTopRow}>
              <Pressable onPress={() => router.replace("/(tabs)/identity")} style={styles.backBtn}>
                <MetallicIcon name="arrow-back-outline" size={20} variant="gold" />
                <MetallicText style={styles.backText} variant="gold">Identity</MetallicText>
              </Pressable>
              <MoonPhaseView size={34} />
            </View>
            <Text style={styles.title}>{activeOverlays.length > 0 ? "Synastry View" : "Natal Blueprint"}</Text>
            <GoldSubtitle style={styles.subtitle}>{userChart.sun.sign.name} Sun · {userChart.moon.sign.name} Moon</GoldSubtitle>
          </Animated.View>

          {isPremium && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleBar}>
              <Pressable onPress={() => setActiveOverlays([])} style={[styles.personChip, activeOverlays.length === 0 && styles.personChipActive]}>
                <MetallicText color={activeOverlays.length === 0 ? PALETTE.gold : PALETTE.atmosphere}>You</MetallicText>
              </Pressable>
              {people.map(p => (
                <Pressable key={p.id} onPress={() => {
                  setActiveOverlays([{ person: p, chart: AstrologyCalculator.generateNatalChart({
                    date: p.birthDate, time: p.birthTime, hasUnknownTime: p.hasUnknownTime,
                    place: p.birthPlace, latitude: p.latitude, longitude: p.longitude,
                    timezone: p.timezone, houseSystem: userChart?.houseSystem,
                  }) }])
                }} style={[styles.personChip, activeOverlays[0]?.person?.id === p.id && styles.personChipActive]}>
                  <Text style={[styles.personChipText, activeOverlays[0]?.person?.id === p.id && { color: PALETTE.gold }]}>{p.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Animated.View entering={FadeInDown.delay(150)} style={styles.wheelSection}>
            <NatalChartWheel chart={userChart} overlayChart={activeOverlays[0]?.chart} orientation={chartOrientation} />
            <Text style={styles.wheelHint}>The outer ring maps the zodiac. The inner houses flow counterclockwise from the Ascendant.</Text>
          </Animated.View>

          <View style={styles.viewToggle}>
            {["essentials", "complete"].map((m: any) => (
              <Pressable key={m} onPress={() => setViewMode(m)} style={[styles.toggleBtn, viewMode === m && styles.toggleBtnActive]}>
                <Text style={[styles.toggleText, viewMode === m && { color: "#FFF" }]}>{m.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>

          <SectionAccordion title="The Big Three" sectionKey="bigThree" openSections={openSections} setOpenSections={setOpenSections}>
            <View style={styles.bigThreeGrid}>
              {[activeChart!.sun, activeChart!.moon, activeChart!.ascendant].filter(Boolean).map((p: any, i) => (
                <VelvetGlassSurface key={i} style={styles.bigThreeCard} intensity={25}>
                  <LinearGradient colors={chartGradients.atmosphere as any} style={StyleSheet.absoluteFill} />
                  <GradientSymbol symbol={p.planet?.symbol || "☉"} fontSize={22} />
                  <Text style={styles.bigThreeSign}>{p.sign.name}</Text>
                  <Text style={styles.bigThreeLabel}>{i === 0 ? "SUN" : i === 1 ? "MOON" : "RISING"}</Text>
                </VelvetGlassSurface>
              ))}
            </View>
          </SectionAccordion>

          {coreIdentity && (
            <SectionAccordion title="Narrative Synthesis" sectionKey="coreIdentity" openSections={openSections} setOpenSections={setOpenSections}>
              <VelvetGlassSurface style={styles.interpCard} intensity={20}>
                <LinearGradient colors={chartGradients.stratosphere as any} style={StyleSheet.absoluteFill} />
                <Text style={styles.interpText}>{coreIdentity.overview}</Text>
              </VelvetGlassSurface>
            </SectionAccordion>
          )}

          <View style={styles.tabSwitcher}>
            {["planets", "houses", "aspects", "patterns"].map((t: any) => (
              <Pressable key={t} onPress={() => setActiveTab(t)} style={[styles.tabBtnSmall, activeTab === t && styles.tabBtnSmallActive]}>
                <Text style={[styles.tabBtnSmallText, activeTab === t && { color: PALETTE.gold }]}>{t.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>

          <VelvetGlassSurface style={[styles.tableAnchor, styles.velvetBorder]} intensity={18}>
            <LinearGradient colors={chartGradients.anchor as any} style={StyleSheet.absoluteFill} />
            <Text style={styles.tableHint}>Tap any row for deep interpretations</Text>
            
            {activeTab === 'planets' && userChart && [userChart.sun, userChart.moon, userChart.mercury, userChart.venus, userChart.mars, userChart.jupiter, userChart.saturn].filter(Boolean).map((p: any) => (
              <Pressable key={p.planet.name} onPress={() => {
                const insight = generatePlanetDeepDive(p, userChart.aspects);
                let parts = [];
                if (insight.dignity?.label) parts.push(`Essential Dignity: ${insight.dignity.label}\n${insight.dignity.description}`);
                if (insight.synthesis) parts.push(insight.synthesis);
                if (insight.aspects && insight.aspects.length > 0) parts.push(`Key Aspects:\n• ${insight.aspects.join('\n• ')}`);
                
                Alert.alert(
                  `${p.planet.name} in ${p.sign.name} (${Math.floor(p.degree)}°) House ${insight.house}`,
                  parts.join('\n\n')
                );
              }} style={styles.tableRow}>
                <View style={styles.tdLeft}>
                  <GradientSymbol symbol={p.planet.symbol || '•'} fontSize={16} w={20} h={20} style={{ marginRight: 8 }} />
                  <Text style={styles.tdTextName}>{p.planet.name}</Text>
                </View>
                <View style={styles.tdRight}>
                  <Text style={styles.tdTextValue}>{p.sign.name} • {Math.floor(p.degree)}°</Text>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" style={{ marginLeft: 8 }} />
                </View>
              </Pressable>
            ))}

            {activeTab === 'houses' && userChart?.houses && userChart.houses.slice(0,12).map((h: any, i: number) => {
              return (
              <Pressable key={i} onPress={() => {
                const insight = generateHouseDeepDives(userChart).find((d: any) => d.house === h.number);
                if (insight) {
                  Alert.alert(
                    `House ${h.number} (${h.sign.name})`,
                    `${insight.theme}\n\nRuler: ${insight.ruler} in ${insight.rulerSign}\n\nPlanets Occupying: ${insight.occupants.join(', ') || 'None'}\n\nSynthesis: ${insight.synthesis}`
                  );
                }
              }} style={styles.tableRow}>
                <View style={styles.tdLeft}>
                  <Text style={styles.tdTextName}>House {h.number}</Text>
                </View>
                <View style={styles.tdRight}>
                  <Text style={styles.tdTextValue}>{h.sign.name} • {Math.floor(h.degree)}°</Text>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" style={{ marginLeft: 8 }} />
                </View>
              </Pressable>
            )})}

            {activeTab === 'aspects' && userChart && userChart.aspects.slice(0,15).map((a: any, i: number) => (
              <Pressable key={i} onPress={() => {
                Alert.alert(
                  `${a.point1} ${a.type} ${a.point2}`,
                  `Orb: ${a.orb.toFixed(2)}°\nNature: ${a.nature}\n\nTap into the interplay between these two energies.`
                );
              }} style={styles.tableRow}>
                <View style={styles.tdLeft}>
                  <Text style={styles.tdTextName}>{a.point1}</Text>
                  <Text style={{color: PALETTE.gold, marginHorizontal: 8, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase'}}>{a.type}</Text>
                  <Text style={styles.tdTextName}>{a.point2}</Text>
                </View>
                <View style={styles.tdRight}>
                  <Text style={[styles.tdTextValue, { color: a.nature === 'Harmonious' ? PALETTE.sage : a.nature === 'Challenging' ? PALETTE.ember : PALETTE.gold }]}>
                    {a.nature}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" style={{ marginLeft: 8 }} />
                </View>
              </Pressable>
            ))}

            {activeTab === 'patterns' && userChart && (
              <View style={{ padding: 12, alignItems: 'center' }}>
                 <Ionicons name="planet-outline" size={32} color={PALETTE.gold} style={{ marginBottom: 12 }} />
                 <Text style={[styles.interpText, { textAlign: 'center' }]}>Your chart forms a {detectChartShape(userChart).shape} shape.</Text>
                 {detectSingletons(userChart).map((s: any, idx: number) => (
                    <Text key={idx} style={[styles.tableHint, { marginTop: 12 }]}>Singleton: {s.planet}</Text>
                 ))}
                 <Text style={[styles.tableHint, { marginTop: 24, textAlign: 'center', lineHeight: 18 }]}>Patterns feature is active. We are analyzing the deeper geometry of your celestial sphere.</Text>
              </View>
            )}
          </VelvetGlassSurface>

          <Pressable onPress={() => setShowAstrologyModal(true)} style={[styles.settingsBtn, styles.velvetBorder]}>
            <LinearGradient colors={chartGradients.anchor as any} style={StyleSheet.absoluteFill} />
            <MetallicIcon name="settings-outline" size={20} variant="gold" />
            <MetallicText style={styles.settingsBtnText} variant="gold">CHART CALIBRATION</MetallicText>
          </Pressable>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
      <AstrologySettingsModal visible={showAstrologyModal} onClose={() => setShowAstrologyModal(false)} onSettingsChanged={() => loadChart()} />
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F" },
  center: { justifyContent: "center", alignItems: "center" },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.20)",
    borderLeftColor: "rgba(255,255,255,0.10)",
    borderRightColor: "rgba(255,255,255,0.10)",
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  header: { marginBottom: 30 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontSize: 14, fontWeight: "700" },
  title: { fontSize: 34, fontWeight: "800", color: "#FFF", letterSpacing: -1 },
  subtitle: { fontSize: 16, marginTop: 4 },

  peopleBar: { paddingVertical: 10, gap: 12, marginBottom: 20 },
  personChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  personChipActive: { borderColor: PALETTE.gold, backgroundColor: "rgba(212,175,55,0.1)" },
  personChipText: { color: PALETTE.atmosphere, fontWeight: "600" },
  addPersonBtn: { width: 40, height: 40, borderRadius: 20, borderStyle: "dashed", borderWidth: 1, borderColor: PALETTE.gold, justifyContent: "center", alignItems: "center" },

  wheelSection: { alignItems: "center", marginBottom: 30 },
  wheelHint: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 12, textAlign: "center", lineHeight: 17 },

  viewToggle: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 25, padding: 4, marginBottom: 25 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 21 },
  toggleBtnActive: { backgroundColor: PALETTE.slateMid },
  toggleText: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.4)", letterSpacing: 1 },

  themedSectionHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  themedSectionHeaderText: { fontSize: 18, fontWeight: "800", flex: 1 },
  patternDesc: { fontSize: 12, color: theme.textMuted, marginTop: 3, lineHeight: 17 },

  bigThreeGrid: { flexDirection: "row", gap: 12, marginTop: 15 },
  bigThreeCard: { flex: 1, padding: 20, borderRadius: 20, alignItems: "center", overflow: "hidden" },
  bigThreeSign: { color: "#FFF", fontWeight: "700", marginTop: 10, fontSize: 15 },
  bigThreeLabel: { color: PALETTE.gold, fontSize: 10, fontWeight: "800", marginTop: 4, letterSpacing: 1 },

  interpCard: { padding: 24, borderRadius: 24, marginTop: 12, overflow: "hidden" },
  interpText: { color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 24 },

  tabSwitcher: { flexDirection: "row", gap: 8, marginVertical: 24 },
  tabBtnSmall: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)" },
  tabBtnSmallActive: { backgroundColor: "rgba(212,175,55,0.08)", borderWidth: 1, borderColor: PALETTE.gold },
  tabBtnSmallText: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.3)", letterSpacing: 1 },

  tableAnchor: { borderRadius: 28, padding: 24, overflow: "hidden", minHeight: 200, marginBottom: 20 },
  tableHint: { color: PALETTE.gold, fontSize: 10, fontWeight: "800", textAlign: "center", marginBottom: 20, letterSpacing: 1, textTransform: "uppercase" },

  tableRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  tdLeft: { flexDirection: "row", alignItems: "center" },
  tdRight: { flexDirection: "row", alignItems: "center" },
  tdTextName: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  tdTextValue: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "500", marginRight: 2 },

  settingsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, padding: 20, borderRadius: 20, marginTop: 40, overflow: "hidden" },
  settingsBtnText: { fontSize: 13, fontWeight: "800", letterSpacing: 1 },

  loadingText: { color: "#FFF", textAlign: "center" },
});
