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

  return { sunSign, moonSign, risingSign, chartRuler: chartRulerName, chartRulerSign, overview: parts.join(' '), quickThemes: quickThemes.slice(0, 5) };
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
    healingThemes = `With ${house12Planets.join(' and ')} in your 12th house, healing involves confronting what lies beneath conscious awareness. Solitude, dreams, and creative expression may be powerful healing tools.`;
  } else if (waterCount >= 3) {
    healingThemes = 'With strong water emphasis, your healing path runs through emotional honesty, creative expression, and learning to set gentle boundaries around your sensitivity.';
  } else {
    healingThemes = `Your healing journey is shaped by your Moon in ${moonSign} and the house it occupies — attending to your emotional needs in that life area is where growth happens.`;
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
