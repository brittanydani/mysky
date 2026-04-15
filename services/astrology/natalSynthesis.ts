// services/astrology/natalSynthesis.ts
// High-level life-theme synthesis: relationships, career, emotional profile,
// shadow/growth, and the core identity summary blending Sun/Moon/Rising/chart ruler.

import { NatalChart, Aspect, ZodiacSign } from './types';
import { detectChartPatterns } from './chartPatterns';

// ── Helpers ─────────────────────────────────────────────────────────

function signName(sign: ZodiacSign | string): string {
  return typeof sign === 'string' ? sign : sign.name;
}

function signElement(sign: ZodiacSign | string): string {
  return typeof sign === 'object' && sign !== null ? sign.element : '';
}

function findPlanetsByHouse(chart: NatalChart, house: number): string[] {
  const planets = [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ].filter(Boolean);
  return planets.filter(p => p.house === house).map(p => p.planet.name);
}

function findAspectsInvolving(chart: NatalChart, planetName: string): Aspect[] {
  return (chart.aspects ?? []).filter(
    a => a.planet1.name === planetName || a.planet2.name === planetName
  );
}

function hasAspectBetween(chart: NatalChart, p1: string, p2: string): Aspect | undefined {
  return (chart.aspects ?? []).find(
    a => (a.planet1.name === p1 && a.planet2.name === p2) || (a.planet1.name === p2 && a.planet2.name === p1)
  );
}

// ── Sign personality sketch helpers ─────────────────────────────────

const SIGN_IDENTITY: Record<string, string> = {
  Aries:       'bold, instinct-driven, and pioneering',
  Taurus:      'grounded, sensory, and deeply persistent',
  Gemini:      'curious, communicative, and mentally agile',
  Cancer:      'emotionally attuned, protective, and nurturing',
  Leo:         'expressive, warm-hearted, and creatively confident',
  Virgo:       'analytical, service-oriented, and quietly devoted',
  Libra:       'relational, aesthetically aware, and balance-seeking',
  Scorpio:     'intense, perceptive, and emotionally powerful',
  Sagittarius: 'expansive, philosophical, and freedom-loving',
  Capricorn:   'structured, ambitious, and strategically patient',
  Aquarius:    'unconventional, idealistic, and mentally independent',
  Pisces:      'empathic, imaginative, and spiritually open',
};

const SIGN_EMOTION: Record<string, string> = {
  Aries:       'You process emotions quickly and directly — you feel things in bursts and need action to discharge tension.',
  Taurus:      'Your emotional world is deep and slow-moving. You need physical comfort and stability to feel safe.',
  Gemini:      'You tend to intellectualize feelings. Talking things through helps you understand what you feel.',
  Cancer:      'You feel deeply and protectively. Home, memory, and belonging are central to your emotional wellbeing.',
  Leo:         'Your emotions are vivid and warm. You need to be seen, appreciated, and creatively expressed to feel whole.',
  Virgo:       'You analyze your feelings and often try to improve or manage them. Service and routine soothe you.',
  Libra:       'You seek emotional equilibrium through relationships. Harmony soothes you; conflict destabilizes.',
  Scorpio:     'Your emotional life is intense, private, and transformative. You feel everything deeply and rarely forget.',
  Sagittarius: 'You process emotions through meaning-making. You bounce back through optimism, philosophy, or new experience.',
  Capricorn:   'You tend to contain emotions and channel them into discipline. Vulnerability may feel risky.',
  Aquarius:    'You approach emotions with some detachment, preferring to understand them intellectually before feeling them fully.',
  Pisces:      'Your emotional boundaries are thin. You absorb others\' feelings easily and need creative or spiritual outlets.',
};

const SIGN_OUTER: Record<string, string> = {
  Aries:       'You come across as direct, energetic, and confident — people sense your readiness to act.',
  Taurus:      'You project calm reliability. Others feel your groundedness and are drawn to your steadiness.',
  Gemini:      'You appear quick, sociable, and intellectually curious. People notice your versatility.',
  Cancer:      'You seem warm, approachable, and emotionally perceptive — others sense your caring nature.',
  Leo:         'You radiate warmth and presence. People notice you and often feel drawn to your confidence.',
  Virgo:       'You come across as composed, helpful, and attentive to detail. Others trust your precision.',
  Libra:       'You present as charming, diplomatic, and aesthetically aware. People perceive grace.',
  Scorpio:     'You project quiet intensity. Others may sense depth and mystery beneath your surface.',
  Sagittarius: 'You appear enthusiastic, open, and ready for adventure. Your optimism is often contagious.',
  Capricorn:   'You come across as mature, composed, and purposeful. People sense your ambition and competence.',
  Aquarius:    'You project individuality and intellectual independence. Others may see you as unique or unconventional.',
  Pisces:      'You appear gentle, empathic, and somewhat otherworldly. Others sense your sensitivity.',
};

// ── Modern ruler mapping ────────────────────────────────────────────

const MODERN_RULERS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Pluto',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Uranus', Pisces: 'Neptune',
};

// ── 1. Core Identity Summary ────────────────────────────────────────

export interface CoreIdentitySummary {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  chartRuler: string;
  chartRulerSign: string;
  overview: string;            // 3–6 sentence blended narrative
  overviewParts: string[];     // Array of individual narrative paragraphs for editorial layout
  quickThemes: string[];       // 3–5 strongest chart themes
}

export function generateCoreIdentitySummary(chart: NatalChart): CoreIdentitySummary {
  const sunSign = signName(chart.sun.sign);
  const moonSign = signName(chart.moon.sign);
  const risingSign = chart.ascendant ? signName(chart.ascendant.sign) : '';
  const chartRulerName = risingSign ? (MODERN_RULERS[risingSign] ?? '') : '';
  const chartRulerPlacement = chartRulerName
    ? [chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars, chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto]
        .filter(Boolean).find(p => p.planet.name === chartRulerName)
    : undefined;
  const chartRulerSign = chartRulerPlacement ? signName(chartRulerPlacement.sign) : '';

  // Blended overview
  const identity = SIGN_IDENTITY[sunSign] ?? sunSign;
  const emotion = SIGN_EMOTION[moonSign] ?? '';
  const outer = risingSign ? (SIGN_OUTER[risingSign] ?? '') : '';

  const parts: string[] = [];
  parts.push(`At your core, you are ${identity} — your ${sunSign} Sun defines your fundamental sense of self and purpose.`);
  if (emotion) parts.push(emotion);
  if (outer) parts.push(outer);
  if (chartRulerName && chartRulerSign) {
    parts.push(`Your chart ruler is ${chartRulerName} in ${chartRulerSign}, coloring your entire life path with ${chartRulerSign} themes and directing the energy of your Rising sign.`);
  }

  // Generate quick themes from chart patterns
  const patterns = detectChartPatterns(chart);
  const quickThemes: string[] = [];

  if (patterns.elementBalance) {
    quickThemes.push(`${patterns.elementBalance.dominant} dominant — ${patterns.elementBalance.dominant === 'Fire' ? 'action-oriented and initiating' : patterns.elementBalance.dominant === 'Earth' ? 'practical and grounded' : patterns.elementBalance.dominant === 'Air' ? 'intellectual and communicative' : 'emotional and intuitive'}`);
  }
  if (patterns.modalityBalance) {
    quickThemes.push(`${patterns.modalityBalance.dominant} emphasis — ${patterns.modalityBalance.dominant === 'Cardinal' ? 'naturally initiating' : patterns.modalityBalance.dominant === 'Fixed' ? 'deeply persistent' : 'highly adaptable'}`);
  }
  if (patterns.stelliums.length > 0) {
    const s = patterns.stelliums[0];
    quickThemes.push(`${s.label} stellium — concentrated energy`);
  }
  if (chartRulerName) {
    quickThemes.push(`Chart ruler ${chartRulerName} in ${chartRulerSign} — life path direction`);
  }
  // Add a theme about Sun-Moon relationship
  const sunMoonAspect = hasAspectBetween(chart, 'Sun', 'Moon');
  if (sunMoonAspect) {
    const rel = sunMoonAspect.type.nature === 'Harmonious' ? 'inner harmony between identity and emotions' : sunMoonAspect.type.nature === 'Challenging' ? 'creative tension between identity and emotions' : 'merged identity and emotional nature';
    quickThemes.push(`Sun-Moon ${sunMoonAspect.type.name.toLowerCase()} — ${rel}`);
  }

  return { sunSign, moonSign, risingSign, chartRuler: chartRulerName, chartRulerSign, overview: parts.join(' '), overviewParts: parts, quickThemes: quickThemes.slice(0, 5) };
}

// ── 2. Relationship Profile ─────────────────────────────────────────

export interface RelationshipProfile {
  loveStyle: string;
  attractionPattern: string;
  intimacyStyle: string;
  partnershipLessons: string;
  keyPlanets: string[];          // planet names most relevant
  synthesis: string;
}

export function generateRelationshipProfile(chart: NatalChart): RelationshipProfile {
  const venus = chart.venus;
  const mars = chart.mars;
  const venusSign = signName(venus.sign);
  const marsSign = signName(mars.sign);
  const venusEl = signElement(venus.sign);
  const marsEl = signElement(mars.sign);

  // 7th house / Descendant
  const desc = (chart.angles ?? []).find(a => a.name === 'Descendant');
  const descSign = desc ? (typeof desc.sign === 'string' ? desc.sign : (desc.sign as any)?.name ?? '') : '';
  const house7Planets = findPlanetsByHouse(chart, 7);
  const house8Planets = findPlanetsByHouse(chart, 8);

  // Venus-Mars aspect
  const venusMarsAspect = hasAspectBetween(chart, 'Venus', 'Mars');

  // Love style (Venus sign)
  const loveStyle = `Your Venus in ${venusSign} shapes how you give and receive love. You value ${venusEl === 'Fire' ? 'passion, excitement, and bold gestures' : venusEl === 'Earth' ? 'stability, loyalty, and tangible expressions of care' : venusEl === 'Air' ? 'intellectual connection, communication, and social harmony' : 'emotional depth, intimacy, and intuitive understanding'} in relationships.`;

  // Attraction pattern (Mars sign)
  const attractionPattern = `Your Mars in ${marsSign} drives your desire nature. You are attracted to ${marsEl === 'Fire' ? 'confidence, spontaneity, and direct energy' : marsEl === 'Earth' ? 'reliability, sensuality, and quiet strength' : marsEl === 'Air' ? 'wit, communication, and mental stimulation' : 'emotional intensity, mystery, and deep connection'}.`;

  // Intimacy style (8th house)
  let intimacyStyle = '';
  if (house8Planets.length > 0) {
    intimacyStyle = `With ${house8Planets.join(' and ')} in your 8th house, intimacy is a significant theme — you experience closeness as transformative and may seek emotional or psychological depth in your bonds.`;
  } else {
    intimacyStyle = 'Your approach to intimacy is shaped primarily by your Venus and Mars placements rather than 8th-house emphasis.';
  }

  // Partnership lessons (Saturn aspects to Venus/Mars, 7th house)
  const saturnVenus = hasAspectBetween(chart, 'Saturn', 'Venus');
  const saturnMars = hasAspectBetween(chart, 'Saturn', 'Mars');
  let partnershipLessons = '';
  if (saturnVenus) {
    partnershipLessons = `Saturn ${saturnVenus.type.name.toLowerCase()} Venus suggests caution in love — you may set high standards, fear vulnerability, or take time to open up. Commitment deepens with maturity.`;
  } else if (saturnMars) {
    partnershipLessons = `Saturn ${saturnMars.type.name.toLowerCase()} Mars suggests lessons around asserting your needs in relationships. Patience with desire and learning to act from groundedness rather than frustration is part of your growth.`;
  } else if (descSign) {
    partnershipLessons = `With ${descSign} on your Descendant, you seek partners who embody ${SIGN_IDENTITY[descSign] ?? descSign} qualities — qualities you may be developing within yourself through relationships.`;
  } else {
    partnershipLessons = 'Your partnership lessons are woven through your Venus and Mars placements rather than a single strong indicator.';
  }

  const keyPlanets = ['Venus', 'Mars'];
  if (house7Planets.length > 0) keyPlanets.push(...house7Planets);

  // Synthesis
  const synthParts: string[] = [loveStyle];
  if (venusMarsAspect) {
    const rel = venusMarsAspect.type.nature === 'Harmonious' ? 'naturally integrated' : 'dynamically tense';
    synthParts.push(`Venus and Mars are in ${venusMarsAspect.type.name.toLowerCase()} — your love nature and desire nature are ${rel}, shaping how you balance romance with passion.`);
  }
  if (descSign) {
    synthParts.push(`Your 7th house cusp in ${descSign} draws you toward ${SIGN_IDENTITY[descSign] ?? descSign} partnership dynamics.`);
  }
  if (house7Planets.length > 0) {
    synthParts.push(`${house7Planets.join(' and ')} in your 7th house add${house7Planets.length === 1 ? 's' : ''} additional themes to your partnership experience.`);
  }

  return {
    loveStyle,
    attractionPattern,
    intimacyStyle,
    partnershipLessons,
    keyPlanets,
    synthesis: synthParts.join(' '),
  };
}

// ── 3. Career & Purpose Profile ─────────────────────────────────────

export interface CareerProfile {
  vocationThemes: string;
  workStyle: string;
  publicImage: string;
  growthPath: string;
  keyPlanets: string[];
  synthesis: string;
}

export function generateCareerProfile(chart: NatalChart): CareerProfile {
  const mc = chart.midheaven;
  const mcSign = mc ? signName(mc.sign) : '';
  const saturn = chart.saturn;
  const saturnSign = signName(saturn.sign);
  const sun = chart.sun;
  const sunSign = signName(sun.sign);
  const jupiter = chart.jupiter;
  const jupiterSign = signName(jupiter.sign);

  const house10Planets = findPlanetsByHouse(chart, 10);
  const house6Planets = findPlanetsByHouse(chart, 6);

  // North Node
  const northNode = Array.isArray(chart.planets)
    ? (chart.planets as any[]).find(p => {
        const name = String(p.planet ?? '').toLowerCase();
        return name === 'north node' || name === 'northnode' || name === 'true node';
      })
    : null;
  const nnSign = northNode ? String(northNode.sign ?? '') : '';

  // Vocation themes (MC sign)
  const vocationThemes = mcSign
    ? `Your Midheaven in ${mcSign} points toward a career direction that involves ${SIGN_IDENTITY[mcSign] ?? mcSign} qualities. You are drawn to professional expressions that feel ${mcSign === 'Aries' ? 'pioneering and independent' : mcSign === 'Taurus' ? 'stable, aesthetic, or resource-building' : mcSign === 'Gemini' ? 'communicative and versatile' : mcSign === 'Cancer' ? 'nurturing and protective' : mcSign === 'Leo' ? 'creative and leadership-oriented' : mcSign === 'Virgo' ? 'analytical and service-focused' : mcSign === 'Libra' ? 'collaborative and aesthetically driven' : mcSign === 'Scorpio' ? 'transformative and deeply focused' : mcSign === 'Sagittarius' ? 'expansive and meaning-driven' : mcSign === 'Capricorn' ? 'structured, ambitious, and authoritative' : mcSign === 'Aquarius' ? 'innovative and humanitarian' : 'imaginative and compassionate'}.`
    : `Your Sun in ${sunSign} shapes your sense of purpose — you seek work that allows you to express your ${SIGN_IDENTITY[sunSign] ?? sunSign} nature.`;

  // Work style (6th house, Saturn)
  let workStyle: string;
  if (house6Planets.length > 0) {
    workStyle = `With ${house6Planets.join(' and ')} in your 6th house, your daily work habits carry extra weight. Saturn in ${saturnSign} adds a layer of ${saturnSign === 'Capricorn' || saturnSign === 'Virgo' ? 'natural discipline' : 'structured learning'} to your work ethic.`;
  } else {
    workStyle = `Saturn in ${saturnSign} defines your relationship with discipline and responsibility. You build mastery through ${SIGN_IDENTITY[saturnSign] ?? saturnSign} persistence.`;
  }

  // Public image
  const publicImage = mcSign
    ? `Publicly, you aim to be seen as ${SIGN_IDENTITY[mcSign] ?? mcSign}. ${house10Planets.length > 0 ? `${house10Planets.join(' and ')} in your 10th house amplif${house10Planets.length === 1 ? 'ies' : 'y'} your public presence.` : 'Your public presence is shaped mainly by your MC sign and its ruler.'}`
    : 'Your public image evolves through your Sun sign expression and Saturn\'s lessons.';

  // Growth path
  const growthPath = nnSign
    ? `Your North Node in ${nnSign} suggests your long-term growth involves developing ${SIGN_IDENTITY[nnSign] ?? nnSign} qualities — this is the direction your soul is moving toward, even if it feels unfamiliar.`
    : `Jupiter in ${jupiterSign} expands your horizons through ${SIGN_IDENTITY[jupiterSign] ?? jupiterSign} experiences — this is where growth feels most natural.`;

  const keyPlanets = ['Saturn', 'Sun'];
  if (mcSign) keyPlanets.push('Midheaven');
  if (house10Planets.length > 0) keyPlanets.push(...house10Planets);

  const synthesis = [vocationThemes, workStyle, publicImage, growthPath].join(' ');

  return { vocationThemes, workStyle, publicImage, growthPath, keyPlanets, synthesis };
}

// ── 4. Emotional & Psychological Profile ────────────────────────────

export interface EmotionalProfile {
  emotionalStyle: string;
  coreFears: string;
  defenseMechanisms: string;
  healingThemes: string;
  attachmentStyle: string;
  synthesis: string;
}

export function generateEmotionalProfile(chart: NatalChart): EmotionalProfile {
  const moon = chart.moon;
  const moonSign = signName(moon.sign);
  const moonEl = signElement(moon.sign);

  const house4Planets = findPlanetsByHouse(chart, 4);
  const house12Planets = findPlanetsByHouse(chart, 12);

  // Water planet count
  const waterCount = [chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars]
    .filter(p => signElement(p.sign) === 'Water').length;

  // Emotional style
  const emotionalStyle = SIGN_EMOTION[moonSign] ?? `Your Moon in ${moonSign} shapes your emotional instincts.`;

  // Core fears (Saturn + Pluto aspects to Moon/Sun)
  const saturnMoon = hasAspectBetween(chart, 'Saturn', 'Moon');
  const plutoMoon = hasAspectBetween(chart, 'Pluto', 'Moon');
  let coreFears: string;
  if (saturnMoon && plutoMoon) {
    coreFears = 'Both Saturn and Pluto aspect your Moon — there may be deep themes around emotional control, fear of abandonment, and the tension between vulnerability and self-protection. These aspects often correlate with emotional resilience that develops over time.';
  } else if (saturnMoon) {
    coreFears = `Saturn ${saturnMoon.type.name.toLowerCase()} your Moon suggests a pattern of emotional caution — early experiences may have taught you to contain or manage feelings. Over time, this becomes a source of emotional maturity.`;
  } else if (plutoMoon) {
    coreFears = `Pluto ${plutoMoon.type.name.toLowerCase()} your Moon points to intense emotional experiences — transformation through feeling, possible power dynamics in close bonds, and an eventual capacity for profound emotional depth.`;
  } else {
    coreFears = `Your emotional patterns are primarily shaped by your Moon in ${moonSign}. Without strong Saturn or Pluto aspects to the Moon, your fears tend to be more situational than structural.`;
  }

  // Defense mechanisms
  let defenseMechanisms: string;
  if (moonEl === 'Fire') {
    defenseMechanisms = 'When stressed, you may default to action, anger, or distraction — fire moons defend through forward motion.';
  } else if (moonEl === 'Earth') {
    defenseMechanisms = 'Under stress, you may withdraw into routine, material comfort, or stoicism — earth moons defend through grounding.';
  } else if (moonEl === 'Air') {
    defenseMechanisms = 'When overwhelmed, you may intellectualize, detach, or over-communicate — air moons defend through mental processing.';
  } else {
    defenseMechanisms = 'Under pressure, you may absorb others\' emotions, retreat into isolation, or seek escape — water moons defend through emotional absorption or withdrawal.';
  }

  // Healing themes (Chiron, 12th house)
  let healingThemes: string;
  if (house12Planets.length > 0) {
    healingThemes = `With ${house12Planets.join(' and ')} in your 12th house, growth often involves meeting what lies beneath conscious awareness with honesty. Solitude, dreams, and creative expression may be powerful reflective tools.`;
  } else if (waterCount >= 3) {
    healingThemes = 'With strong water emphasis, growth often runs through emotional honesty, creative expression, and learning to set gentle boundaries around your sensitivity.';
  } else {
    healingThemes = `Your reflective growth is shaped by your Moon in ${moonSign} and the house it occupies — attending to your emotional needs in that life area is where growth happens.`;
  }

  // Attachment style (Moon + Venus + 4th house)
  const moonVenus = hasAspectBetween(chart, 'Moon', 'Venus');
  let attachmentStyle: string;
  if (moonVenus && moonVenus.type.nature === 'Harmonious') {
    attachmentStyle = 'Moon and Venus in harmony suggests a generally secure attachment pattern — you can both receive and give emotional warmth naturally.';
  } else if (moonVenus && moonVenus.type.nature === 'Challenging') {
    attachmentStyle = 'Moon and Venus in tension may create a push-pull between emotional needs and relationship desires — you may sometimes struggle to reconcile what you need with what you want.';
  } else if (house4Planets.length > 0) {
    attachmentStyle = `${house4Planets.join(' and ')} in your 4th house color your attachment patterns, shaping how you experienced safety and belonging in early life.`;
  } else {
    attachmentStyle = `Your attachment tendencies are rooted in your Moon in ${moonSign} — ${moonEl === 'Water' ? 'deep emotional bonding' : moonEl === 'Fire' ? 'independence with bursts of closeness' : moonEl === 'Earth' ? 'steady, loyal connection' : 'intellectual companionship'} forms the basis of how you attach.`;
  }

  const synthesis = [emotionalStyle, coreFears, defenseMechanisms, attachmentStyle].join(' ');

  return { emotionalStyle, coreFears, defenseMechanisms, healingThemes, attachmentStyle, synthesis };
}

// ── 5. Shadow & Growth Path ─────────────────────────────────────────

export interface ShadowGrowthProfile {
  saturnLessons: string;
  chironWound: string;
  plutoTransformation: string;
  nodeAxis: string;             // North Node growth, South Node comfort
  growthEdges: string[];
  synthesis: string;
}

export function generateShadowGrowth(chart: NatalChart): ShadowGrowthProfile {
  const saturn = chart.saturn;
  const saturnSign = signName(saturn.sign);
  const pluto = chart.pluto;
  const plutoSign = signName(pluto.sign);

  // Chiron from planets array
  const chiron = Array.isArray(chart.planets)
    ? (chart.planets as any[]).find(p => String(p.planet ?? '').toLowerCase() === 'chiron')
    : null;
  const chironSign = chiron ? String(chiron.sign ?? '') : '';
  const chironHouse = chiron && typeof chiron.house === 'number' ? chiron.house : undefined;

  // Nodes
  const northNode = Array.isArray(chart.planets)
    ? (chart.planets as any[]).find(p => {
        const name = String(p.planet ?? '').toLowerCase();
        return name === 'north node' || name === 'northnode' || name === 'true node';
      })
    : null;
  const southNode = Array.isArray(chart.planets)
    ? (chart.planets as any[]).find(p => {
        const name = String(p.planet ?? '').toLowerCase();
        return name === 'south node' || name === 'southnode';
      })
    : null;
  const nnSign = northNode ? String(northNode.sign ?? '') : '';
  const snSign = southNode ? String(southNode.sign ?? '') : '';

  // Saturn lessons
  const saturnLessons = `Saturn in ${saturnSign} (House ${saturn.house}) defines your primary area of discipline and long-term mastery. You are learning to develop ${SIGN_IDENTITY[saturnSign] ?? saturnSign} qualities with patience and persistence. This may feel like a burden early in life but becomes your greatest strength with maturity.`;

  // Chiron wound
  const chironWound = chironSign
    ? `Chiron in ${chironSign}${chironHouse ? ` (House ${chironHouse})` : ''} points to a core wound around ${chironSign === 'Aries' ? 'identity and self-worth' : chironSign === 'Taurus' ? 'security and material stability' : chironSign === 'Gemini' ? 'communication and being heard' : chironSign === 'Cancer' ? 'belonging and emotional safety' : chironSign === 'Leo' ? 'self-expression and recognition' : chironSign === 'Virgo' ? 'adequacy and perfectionism' : chironSign === 'Libra' ? 'relationships and fairness' : chironSign === 'Scorpio' ? 'trust and vulnerability' : chironSign === 'Sagittarius' ? 'meaning and belief' : chironSign === 'Capricorn' ? 'authority and competence' : chironSign === 'Aquarius' ? 'belonging in groups and individuality' : 'boundaries and spiritual overwhelm'}. This wound becomes your source of deepest wisdom — through it, you develop the capacity to guide others who face similar struggles.`
    : 'Chiron\'s placement was not calculated — its themes may still be present through Saturn and Pluto patterns.';

  // Pluto transformation
  const plutoTransformation = `Pluto in ${plutoSign} (House ${pluto.house}) marks where you experience the deepest transformation. The ${plutoSign} area of life undergoes periodic upheaval and regeneration — this is where you confront power, control, and rebirth.`;

  // Node axis
  let nodeAxis: string;
  if (nnSign && snSign) {
    nodeAxis = `Your North Node in ${nnSign} and South Node in ${snSign} form a growth axis. The South Node in ${snSign} represents mastered territory — ${SIGN_IDENTITY[snSign] ?? snSign} patterns that feel comfortable but may limit you. Your growth direction is toward ${SIGN_IDENTITY[nnSign] ?? nnSign} qualities, even when they feel unfamiliar.`;
  } else if (nnSign) {
    nodeAxis = `Your North Node in ${nnSign} points toward developing ${SIGN_IDENTITY[nnSign] ?? nnSign} qualities as your growth direction.`;
  } else {
    nodeAxis = 'Node positions were not calculated — growth themes are reflected through Saturn and Chiron placements.';
  }

  // Growth edges — specific friction points
  const growthEdges: string[] = [];
  const saturnAspects = findAspectsInvolving(chart, 'Saturn');
  const challengingSaturn = saturnAspects.filter(a => a.type.nature === 'Challenging');
  if (challengingSaturn.length > 0) {
    const others = challengingSaturn.map(a => a.planet1.name === 'Saturn' ? a.planet2.name : a.planet1.name);
    growthEdges.push(`Saturn tension with ${others.join(', ')} — learning to balance structure with ${others.includes('Venus') ? 'love' : others.includes('Mars') ? 'desire' : others.includes('Moon') ? 'emotions' : 'expression'}.`);
  }

  const plutoAspects = findAspectsInvolving(chart, 'Pluto');
  const challengingPluto = plutoAspects.filter(a => a.type.nature === 'Challenging');
  if (challengingPluto.length > 0) {
    const others = challengingPluto.map(a => a.planet1.name === 'Pluto' ? a.planet2.name : a.planet1.name);
    growthEdges.push(`Pluto tension with ${others.join(', ')} — transformation through confronting power dynamics.`);
  }

  if (saturn.isRetrograde) {
    growthEdges.push('Saturn retrograde — internalized authority; learning to trust your own standards rather than external validation.');
  }
  if (pluto.isRetrograde) {
    growthEdges.push('Pluto retrograde — inner transformation; deep psychological work happens privately before showing outwardly.');
  }

  const synthesis = [saturnLessons, chironWound, nodeAxis].join(' ');

  return { saturnLessons, chironWound, plutoTransformation, nodeAxis, growthEdges, synthesis };
}

// ── 6. Communication Style ──────────────────────────────────────────

export interface CommunicationProfile {
  mercurySign: string;
  mercuryHouse: number;
  mercuryRetrograde: boolean;
  learningStyle: string;
  expressionStyle: string;
  listeningStyle: string;
  thirdHouseInfluence: string;
  synthesis: string;
}

const MERCURY_EXPRESSION: Record<string, string> = {
  Aries:       'direct, spontaneous, and sometimes blunt — you lead with bold ideas and think on your feet',
  Taurus:      'deliberate and grounded — you prefer to think things through slowly before speaking',
  Gemini:      'quick, curious, and verbally agile — words are your element and you can talk about anything',
  Cancer:      'intuitive and emotionally attuned — you communicate through feeling and read between the lines',
  Leo:         'dramatic, warm, and expressive — your words carry warmth and you enjoy storytelling',
  Virgo:       'precise, analytical, and detail-oriented — you choose your words carefully and notice everything',
  Libra:       'diplomatic, balanced, and socially graceful — you naturally consider multiple perspectives',
  Scorpio:     'probing, strategic, and perceptive — you go deep and can read hidden motives easily',
  Sagittarius: 'expansive, philosophical, and enthusiastic — you communicate big ideas with infectious energy',
  Capricorn:   'structured, pragmatic, and authoritative — you communicate with purpose and gravitas',
  Aquarius:    'original, unconventional, and intellectually stimulating — your ideas often surprise people',
  Pisces:      'poetic, imaginative, and impressionistic — you communicate through metaphor and feeling',
};

const MERCURY_LEARNING: Record<string, string> = {
  Aries: 'hands-on experimentation', Taurus: 'repeated practice and sensory engagement',
  Gemini: 'reading, conversation, and variety', Cancer: 'emotional connection to the material',
  Leo: 'creative projects and performance', Virgo: 'systematic study and analysis',
  Libra: 'discussion and debate', Scorpio: 'deep research and investigation',
  Sagittarius: 'exploration and big-picture frameworks', Capricorn: 'structured curriculum and mastery',
  Aquarius: 'independent study and innovation', Pisces: 'intuitive absorption and visualization',
};

export function generateCommunicationProfile(chart: NatalChart): CommunicationProfile {
  const mercury = chart.mercury;
  const mercSign = signName(mercury.sign);
  const mercHouse = mercury.house;

  const expressionStyle = `Mercury in ${mercSign}: ${MERCURY_EXPRESSION[mercSign] ?? `you communicate with ${mercSign} qualities`}.`;

  const learningStyle = `Your mind learns best through ${MERCURY_LEARNING[mercSign] ?? 'varied approaches'}.`;

  const el = signElement(mercury.sign);
  const listeningStyle = el === 'Water'
    ? 'You listen with empathy and emotional attunement — you absorb not just words but the feeling behind them.'
    : el === 'Fire'
      ? 'You listen actively and energetically — impatient with slow explanations, you prefer the headline first.'
      : el === 'Earth'
        ? 'You listen for practical relevance and concrete details — abstract theory without application loses you.'
        : 'You listen for ideas and connections — you naturally cross-reference what you hear with what you already know.';

  const h3Planets = findPlanetsByHouse(chart, 3);
  const thirdHouseInfluence = h3Planets.length > 0
    ? `${h3Planets.join(' and ')} in the 3rd house ${h3Planets.length === 1 ? 'adds' : 'add'} ${h3Planets.includes('Mars') ? 'assertiveness' : h3Planets.includes('Venus') ? 'charm and diplomacy' : h3Planets.includes('Saturn') ? 'seriousness and caution' : h3Planets.includes('Jupiter') ? 'enthusiasm and breadth' : 'additional texture'} to your communication style.`
    : 'No planets in the 3rd house — your communication style is primarily colored by Mercury\'s sign and aspects.';

  const retroNote = mercury.isRetrograde
    ? ' Mercury retrograde natally gives you a reflective, inward-processing mind — you may revise your thoughts before speaking and often come up with insights after conversations.'
    : '';

  const synthesis = `${expressionStyle} ${learningStyle} ${listeningStyle} ${thirdHouseInfluence}${retroNote}`;

  return { mercurySign: mercSign, mercuryHouse: mercHouse, mercuryRetrograde: mercury.isRetrograde, learningStyle, expressionStyle, listeningStyle, thirdHouseInfluence, synthesis };
}

// ── 7. Spiritual Profile ────────────────────────────────────────────

export interface SpiritualProfile {
  neptunePlacement: string;
  twelfthHouseThemes: string;
  ninthHouseThemes: string;
  nodeSpiritual: string;
  spiritualGifts: string[];
  synthesis: string;
}

export function generateSpiritualProfile(chart: NatalChart): SpiritualProfile {
  const neptune = chart.neptune;
  const neptSign = signName(neptune.sign);

  const neptunePlacement = `Neptune in ${neptSign} (House ${neptune.house}) shapes your spiritual imagination and connection to the transcendent. ${neptune.house === 12 ? 'In its natural home, Neptune dissolves ego boundaries — meditation, dreams, and solitude are portals.' : neptune.house === 9 ? 'In the 9th house, your spirituality is expansive and seeking — you are drawn to philosophies, pilgrimages, and higher learning.' : neptune.house === 4 ? 'In the 4th house, your spiritual life is deeply private and rooted in family or ancestral patterns.' : neptune.house === 1 ? 'In the 1st house, you radiate a dreamy, compassionate, or otherworldly presence.' : `In house ${neptune.house}, spirituality intersects with ${['partnerships', 'values', 'communication', 'home', 'creativity', 'work', 'relationships', 'transformation', 'beliefs', 'career', 'community', 'transcendence'][neptune.house - 1] ?? 'life'} themes.`}`;

  const h12Planets = findPlanetsByHouse(chart, 12);
  const twelfthHouseThemes = h12Planets.length > 0
    ? `${h12Planets.join(', ')} in the 12th house ${h12Planets.length === 1 ? 'indicates' : 'indicate'} significant energy operating beneath the surface of consciousness — dreams, solitude, and spiritual practice may reveal profound insights.`
    : 'No planets in the 12th house — your spiritual development comes through other channels rather than a strong pull toward solitude or transcendence.';

  const h9Planets = findPlanetsByHouse(chart, 9);
  const ninthHouseThemes = h9Planets.length > 0
    ? `${h9Planets.join(', ')} in the 9th house ${h9Planets.length === 1 ? 'brings' : 'bring'} a quest for meaning through philosophy, travel, or higher education.`
    : 'No planets in the 9th house — your belief system develops gradually through lived experience rather than formal seeking.';

  // Nodes for spiritual growth direction
  const northNode = Array.isArray(chart.planets)
    ? (chart.planets as any[]).find(p => { const n = String(p.planet ?? '').toLowerCase(); return n === 'north node' || n === 'northnode' || n === 'true node'; })
    : null;
  const nnSign = northNode ? String(northNode.sign ?? '') : '';
  const nnHouse = northNode && typeof northNode.house === 'number' ? northNode.house : 0;
  const nodeSpiritual = nnSign
    ? `The North Node in ${nnSign}${nnHouse ? ` (House ${nnHouse})` : ''} suggests your spiritual evolution moves toward ${SIGN_IDENTITY[nnSign] ?? nnSign} qualities.`
    : 'Node positions were not calculated — spiritual direction is reflected through Neptune and 12th house themes.';

  // Spiritual gifts
  const gifts: string[] = [];
  if (h12Planets.includes('Moon')) gifts.push('Psychic sensitivity and dream recall');
  if (h12Planets.includes('Neptune')) gifts.push('Deep meditative and transcendent capacity');
  if (h12Planets.includes('Sun')) gifts.push('Spiritual vocation — your identity is deeply connected to something larger');
  if (h12Planets.includes('Jupiter')) gifts.push('Grace and faith — an innate sense of being guided or protected');
  const nepAspects = findAspectsInvolving(chart, 'Neptune');
  const nepMoonAsp = nepAspects.find(a => a.planet1.name === 'Moon' || a.planet2.name === 'Moon');
  if (nepMoonAsp && nepMoonAsp.type.nature === 'Harmonious') gifts.push('Moon-Neptune harmony — natural empathic and intuitive abilities');
  const nepSunAsp = nepAspects.find(a => a.planet1.name === 'Sun' || a.planet2.name === 'Sun');
  if (nepSunAsp && nepSunAsp.type.nature === 'Harmonious') gifts.push('Sun-Neptune harmony — creative inspiration and spiritual vision');
  if (gifts.length === 0) gifts.push('Your spirituality develops through life experience rather than innate psychic gifts');

  const synthesis = `${neptunePlacement} ${twelfthHouseThemes} ${nodeSpiritual}`;

  return { neptunePlacement, twelfthHouseThemes, ninthHouseThemes, nodeSpiritual, spiritualGifts: gifts, synthesis };
}

// ── 8. Intimacy & Sexuality Profile ─────────────────────────────────

export interface IntimacyProfile {
  marsExpression: string;
  plutoInfluence: string;
  eighthHouseThemes: string;
  venusMarsDynamic: string;
  intimacyStyle: string;
  synthesis: string;
}

export function generateIntimacyProfile(chart: NatalChart): IntimacyProfile {
  const mars = chart.mars;
  const marsSign = signName(mars.sign);
  const pluto = chart.pluto;
  const plutoSign = signName(pluto.sign);
  const venus = chart.venus;

  const marsExpression = `Mars in ${marsSign} (House ${mars.house}) shapes your desire nature and how you pursue what you want. ${marsSign === 'Scorpio' || marsSign === 'Aries' ? 'This is a powerful Mars — intense, magnetic, and unapologetically passionate.' : marsSign === 'Taurus' || marsSign === 'Cancer' ? 'You approach physical intimacy slowly, with sensuality and emotional depth.' : marsSign === 'Leo' || marsSign === 'Sagittarius' ? 'Your desire nature is warm, generous, and playful — you approach intimacy with enthusiasm.' : marsSign === 'Capricorn' || marsSign === 'Virgo' ? 'You approach desire with self-control and discernment — quality over quantity.' : marsSign === 'Gemini' || marsSign === 'Aquarius' ? 'Mental stimulation is foreplay — you need intellectual connection alongside physical.' : marsSign === 'Pisces' || marsSign === 'Libra' ? 'Your desires are interwoven with romance, beauty, and emotional surrender.' : 'You express desire uniquely.'}`;

  const plutoInfluence = `Pluto in ${plutoSign} (House ${pluto.house}) adds depth and intensity to your intimacy patterns. ${pluto.house === 8 ? 'Pluto in the 8th house deepens intimacy profoundly — you desire soul-level merging and may experience powerful transformations through partnership.' : pluto.house === 1 ? 'Pluto in the 1st house gives you a magnetic, penetrating presence that others find hard to ignore.' : pluto.house === 7 ? 'Pluto in the 7th house creates intense partnerships where power dynamics are a central theme to navigate.' : `In house ${pluto.house}, Pluto's transformative intensity colors your experience of ${['identity', 'values', 'communication', 'home', 'creativity', 'health', 'relationships', 'intimacy', 'beliefs', 'career', 'community', 'the subconscious'][pluto.house - 1] ?? 'life'}.`}`;

  const h8Planets = findPlanetsByHouse(chart, 8);
  const eighthHouseThemes = h8Planets.length > 0
    ? `${h8Planets.join(', ')} in the 8th house ${h8Planets.length === 1 ? 'intensifies' : 'intensify'} your experience of intimacy, shared resources, and psychological depth. You are drawn to experiences that transform you at a deep level.`
    : 'No planets in the 8th house — intimacy themes are primarily shaped by Mars, Pluto, and Venus rather than concentrated 8th house energy.';

  // Venus-Mars dynamic
  const venusSign = signName(venus.sign);
  const venusMarsAspect = hasAspectBetween(chart, 'Venus', 'Mars');
  let venusMarsDynamic: string;
  if (venusMarsAspect) {
    const nature = venusMarsAspect.type.nature;
    venusMarsDynamic = nature === 'Harmonious'
      ? `Venus (${venusSign}) and Mars (${marsSign}) in ${venusMarsAspect.type.name.toLowerCase()} create a harmonious flow between your romantic and physical desires — what you want to receive and what you want to express align naturally.`
      : `Venus (${venusSign}) and Mars (${marsSign}) in ${venusMarsAspect.type.name.toLowerCase()} create dynamic tension between your romantic ideals and your desire nature — this friction can generate magnetic chemistry but also internal conflict.`;
  } else {
    venusMarsDynamic = `Venus in ${venusSign} and Mars in ${marsSign} operate somewhat independently — your romantic style and desire nature may feel like two different dialects of the same language.`;
  }

  // Intimacy style
  const scorpioEmphasis = [chart.sun, chart.moon, chart.venus, chart.mars, chart.pluto].filter(p => signName(p.sign) === 'Scorpio').length;
  const intimacyStyle = scorpioEmphasis >= 2
    ? 'With strong Scorpio energy, you approach intimacy with depth, intensity, and a desire for complete emotional and physical honesty. Surface-level connections feel unsatisfying.'
    : h8Planets.length >= 2
      ? 'Significant 8th house activity suggests you are drawn to deep, transformative intimate connections. Trust and vulnerability are central themes.'
      : signElement(mars.sign) === 'Water'
        ? 'Your intimacy style prioritizes emotional connection — physical closeness follows emotional safety.'
        : signElement(mars.sign) === 'Fire'
          ? 'Your intimacy style is passionate and spontaneous — you bring energy, warmth, and directness to physical connection.'
          : signElement(mars.sign) === 'Earth'
            ? 'Your intimacy style is sensual and grounded — you value physical comfort, touch, and presence.'
            : 'Your intimacy style emphasizes mental connection and variety — curiosity keeps things alive.';

  const synthesis = `${marsExpression} ${venusMarsDynamic} ${intimacyStyle}`;

  return { marsExpression, plutoInfluence, eighthHouseThemes, venusMarsDynamic, intimacyStyle, synthesis };
}

// ── 9. Life Path Summary ────────────────────────────────────────────

export interface LifePathSummary {
  corePurpose: string;
  keyStrengths: string[];
  keyChallenges: string[];
  growthArc: string;
  synthesis: string;
}

export function generateLifePathSummary(chart: NatalChart): LifePathSummary {
  const sunSign = signName(chart.sun.sign);
  const moonSign = signName(chart.moon.sign);
  const ascSign = chart.ascendant ? signName(chart.ascendant.sign) : '';

  // Chart ruler
  const patterns = detectChartPatterns(chart);
  const chartRuler = patterns.chartRuler;

  // Nodes
  const northNode = Array.isArray(chart.planets)
    ? (chart.planets as any[]).find(p => { const n = String(p.planet ?? '').toLowerCase(); return n === 'north node' || n === 'northnode' || n === 'true node'; })
    : null;
  const nnSign = northNode ? String(northNode.sign ?? '') : '';

  // Core purpose from Sun + North Node
  const corePurpose = nnSign
    ? `Your Sun in ${sunSign} provides your vital energy and creative identity, while the North Node in ${nnSign} points the direction of growth. Together, they suggest a life path that integrates ${SIGN_IDENTITY[sunSign] ?? sunSign} self-expression with a growing capacity for ${SIGN_IDENTITY[nnSign] ?? nnSign} qualities. ${chartRuler ? `${chartRuler} as chart ruler guides how you navigate this path in the world.` : ''}`
    : `Your Sun in ${sunSign} is the central engine of your life path — you are here to develop and express ${SIGN_IDENTITY[sunSign] ?? sunSign} qualities with increasing authenticity. ${chartRuler ? `${chartRuler} as chart ruler shapes the specific way you move through the world.` : ''}`;

  // Key strengths
  const strengths: string[] = [];
  const sunEl = signElement(chart.sun.sign);
  const moonEl = signElement(chart.moon.sign);
  if (sunEl === moonEl) strengths.push(`Aligned Sun-Moon element (${sunEl}) — internal coherence between your will and your emotional needs`);
  const jupAspects = findAspectsInvolving(chart, 'Jupiter').filter(a => a.type.nature === 'Harmonious');
  if (jupAspects.length >= 2) strengths.push('Strong Jupiter support — natural optimism, luck, and expansion');
  if (ascSign) strengths.push(`${ascSign} rising — your outward presence carries ${SIGN_IDENTITY[ascSign] ?? ascSign} energy`);

  const sunAspects = findAspectsInvolving(chart, 'Sun');
  const sunTrines = sunAspects.filter(a => a.type.name.toLowerCase() === 'trine');
  if (sunTrines.length > 0) strengths.push(`Sun trines to ${sunTrines.map(a => a.planet1.name === 'Sun' ? a.planet2.name : a.planet1.name).join(', ')} — natural talents you can lean into`);

  const saturnTrines = findAspectsInvolving(chart, 'Saturn').filter(a => a.type.name.toLowerCase() === 'trine' || a.type.name.toLowerCase() === 'sextile');
  if (saturnTrines.length >= 2) strengths.push('Well-aspected Saturn — natural discipline and ability to build lasting structures');

  if (strengths.length === 0) strengths.push(`${sunSign} Sun in House ${chart.sun.house} — your core identity and creative drive`);

  // Key challenges
  const challenges: string[] = [];
  const squares = (chart.aspects ?? []).filter(a => a.type.name.toLowerCase() === 'square');
  if (squares.length >= 4) challenges.push(`Multiple squares (${squares.length}) — dynamic tension drives action but requires conscious integration`);
  const saturnSquares = findAspectsInvolving(chart, 'Saturn').filter(a => a.type.name.toLowerCase() === 'square' || a.type.name.toLowerCase() === 'opposition');
  if (saturnSquares.length > 0) challenges.push('Saturn hard aspects — areas where discipline must be earned through effort and patience');
  const plutoSquares = findAspectsInvolving(chart, 'Pluto').filter(a => a.type.nature === 'Challenging');
  if (plutoSquares.length > 0) challenges.push('Pluto challenges — power dynamics and transformation themes that demand surrender and rebirth');
  const retroPlanets = [chart.mercury, chart.venus, chart.mars, chart.jupiter, chart.saturn].filter(p => p.isRetrograde);
  if (retroPlanets.length >= 3) challenges.push(`${retroPlanets.length} retrograde planets — significant internal processing before outward expression`);
  if (challenges.length === 0) challenges.push('Your chart has relatively few hard aspects — growth comes through intentionally seeking challenge rather than being pushed by it');

  // Growth arc: synthesize the big 3 + nodes + Saturn
  const saturnSign = signName(chart.saturn.sign);
  const growthArc = `Your growth arc moves from the instinctive patterns of Moon in ${moonSign} through the conscious development of Sun in ${sunSign}, all while learning Saturn's lessons in ${saturnSign}.${nnSign ? ` The North Node in ${nnSign} adds a soul-level direction, pulling you beyond comfort toward a fuller expression of your potential.` : ''} This is not a linear journey — it spirals, revisiting themes at deeper levels as you mature.`;

  const synthesis = `${corePurpose} ${growthArc}`;

  return { corePurpose, keyStrengths: strengths, keyChallenges: challenges, growthArc, synthesis };
}
