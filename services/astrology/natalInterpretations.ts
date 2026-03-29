// File: services/astrology/natalInterpretations.ts
// Generates themed interpretation sections and aspect-level interpretations
// for the natal chart detail page.

import { NatalChart, PlanetPlacement, Aspect } from './types';

// ── Themed Section Types ──

export interface ThemedSection {
  id: string;
  title: string;
  icon: string;
  placements: string[];
  summary: string;
  details: string[];
}

// ── Aspect Interpretation ──

export function getAspectInterpretation(aspect: Aspect): string {
  const p1 = aspect.planet1.name;
  const p2 = aspect.planet2.name;
  const type = aspect.type.name.toLowerCase();

  // Look up specific interpretation, fall back to generic
  const key = [p1, p2].sort().join('-') + ':' + type;
  return ASPECT_INTERPRETATIONS[key] ?? getGenericAspectInterpretation(p1, p2, type);
}

function getGenericAspectInterpretation(p1: string, p2: string, type: string): string {
  const planetThemes: Record<string, string> = {
    Sun: 'identity and purpose',
    Moon: 'emotions and instincts',
    Mercury: 'thinking and communication',
    Venus: 'love and values',
    Mars: 'drive and assertion',
    Jupiter: 'growth and meaning',
    Saturn: 'structure and discipline',
    Uranus: 'independence and change',
    Neptune: 'imagination and intuition',
    Pluto: 'transformation and power',
    Chiron: 'wounding and healing',
    'North Node': 'soul growth direction',
    'South Node': 'past patterns',
    Ascendant: 'outward persona',
    Midheaven: 'career and public role',
  };

  const t1 = planetThemes[p1] || p1.toLowerCase();
  const t2 = planetThemes[p2] || p2.toLowerCase();

  const typeDescriptions: Record<string, string> = {
    conjunction: `${t1} and ${t2} merge into a unified expression`,
    opposition: `tension between ${t1} and ${t2} pushes toward integration`,
    trine: `natural flow between ${t1} and ${t2}`,
    square: `friction between ${t1} and ${t2} drives growth`,
    sextile: `gentle opportunity between ${t1} and ${t2}`,
    quincunx: `ongoing adjustment between ${t1} and ${t2}`,
    semisextile: `subtle connection between ${t1} and ${t2}`,
    semisquare: `mild friction between ${t1} and ${t2}`,
    sesquiquadrate: `restless tension between ${t1} and ${t2}`,
  };

  return typeDescriptions[type] || `${p1} and ${p2} interact through ${type}`;
}

// ── Specific Aspect Interpretations ──

const ASPECT_INTERPRETATIONS: Record<string, string> = {
  // Sun aspects
  'Moon-Sun:conjunction': 'emotional needs and core identity are fused — inner and outer selves align naturally',
  'Moon-Sun:opposition': 'tension between public identity and emotional needs creates a push toward self-awareness',
  'Moon-Sun:trine': 'emotional instincts support self-expression with ease and natural confidence',
  'Moon-Sun:square': 'inner conflict between what you need and who you feel you should be drives personal growth',
  'Moon-Sun:sextile': 'gentle harmony between feelings and identity — emotional awareness supports purpose',
  'Mercury-Sun:conjunction': 'thinking and identity merge — you express yourself primarily through ideas and words',
  'Mercury-Sun:opposition': 'your mind can sometimes work at odds with your sense of self — objectivity is a strength',
  'Mercury-Sun:trine': 'natural ease in communicating who you are — articulate self-expression',
  'Mercury-Sun:square': 'mental restlessness pushes you to refine how you think and speak about yourself',
  'Mercury-Sun:sextile': 'curiosity supports your sense of purpose — learning fuels personal growth',
  'Sun-Venus:conjunction': 'charm and personal magnetism — identity is woven into what you love and value',
  'Sun-Venus:opposition': 'balancing self-expression with accommodation — relationships mirror your growth',
  'Sun-Venus:trine': 'natural grace and warmth — creativity and connection come easily',
  'Sun-Venus:square': 'tension between desire for approval and authentic self-expression',
  'Sun-Venus:sextile': 'gentle harmony between values and identity — creative confidence',
  'Mars-Sun:conjunction': 'powerful drive and self-assertion — identity fused with action and courage',
  'Mars-Sun:opposition': 'balancing assertiveness with awareness of others — competitive energy',
  'Mars-Sun:trine': 'confidence in action — natural ability to pursue goals with energy',
  'Mars-Sun:square': 'friction between willpower and ego creates determination and resilience',
  'Mars-Sun:sextile': 'healthy drive supports self-expression — initiative comes naturally',
  'Jupiter-Sun:conjunction': 'expansive self-expression — optimism and generosity amplify your presence',
  'Jupiter-Sun:opposition': 'balancing confidence with humility — growth through perspective-taking',
  'Jupiter-Sun:trine': 'natural luck and optimism — doors tend to open when you move toward purpose',
  'Jupiter-Sun:square': 'overextension or excessive confidence pushes toward realistic growth',
  'Jupiter-Sun:sextile': 'gentle expansion supports identity — wisdom grows through experience',
  'Saturn-Sun:conjunction': 'serious, structured identity — maturity and discipline define your path',
  'Saturn-Sun:opposition': 'tension between freedom and responsibility shapes your sense of authority',
  'Saturn-Sun:trine': 'natural discipline supports ambition — steady, earned success',
  'Saturn-Sun:square': 'early challenges or restrictions build deep resilience and self-reliance',
  'Saturn-Sun:sextile': 'practical self-awareness — structure supports your goals',
  'Pluto-Sun:conjunction': 'intense personal power — transformation and reinvention are core themes',
  'Pluto-Sun:opposition': 'power dynamics with others mirror inner transformation work',
  'Pluto-Sun:trine': 'natural depth and psychological insight — quiet but potent influence',
  'Pluto-Sun:square': 'power struggles and crises catalyze profound personal evolution',
  'Pluto-Sun:sextile': 'subtle but steady transformative capacity — resilience comes naturally',

  // Moon aspects
  'Mercury-Moon:conjunction': 'thinking and feeling are intertwined — you process emotions through words',
  'Mercury-Moon:opposition': 'head and heart sometimes disagree — learning to honor both',
  'Mercury-Moon:trine': 'emotional intelligence flows naturally into articulate expression',
  'Mercury-Moon:square': 'emotional reactions can color thinking — growth through separating feeling from fact',
  'Mercury-Moon:sextile': 'gentle connection between intuition and intellect',
  'Moon-Venus:conjunction': 'deep emotional warmth — nurturing and affection are closely linked',
  'Moon-Venus:opposition': 'what you need emotionally may differ from what you find attractive — integration is key',
  'Moon-Venus:trine': 'emotional ease in love and connection — naturally comforting presence',
  'Moon-Venus:square': 'inner tension between comfort needs and relationship desires',
  'Moon-Venus:sextile': 'gentle harmony between emotional needs and values — relationship awareness',
  'Mars-Moon:conjunction': 'emotional intensity and quick reactions — passion runs deep',
  'Mars-Moon:opposition': 'strong feelings drive action but may need conscious direction',
  'Mars-Moon:trine': 'emotional courage — instincts and action work together naturally',
  'Mars-Moon:square': 'emotional volatility becomes fuel for growth and honest self-expression',
  'Mars-Moon:sextile': 'healthy emotional assertiveness — standing up for what you feel',
  'Jupiter-Moon:conjunction': 'emotional generosity and expansive inner world — amplified feelings',
  'Jupiter-Moon:opposition': 'emotional excess or overgiving — learning to balance generosity with boundaries',
  'Jupiter-Moon:trine': 'natural emotional optimism and resilience — faith in the feeling process',
  'Jupiter-Moon:square': 'tendency to overreact emotionally pushes toward temperance',
  'Jupiter-Moon:sextile': 'gentle emotional growth — expanding through feeling and reflection',
  'Saturn-Moon:conjunction': 'emotional caution and self-reliance — feelings are taken seriously',
  'Saturn-Moon:opposition': 'balancing emotional needs with responsibilities — maturity through feeling',
  'Saturn-Moon:trine': 'emotional stability and resilience — feelings become a steady foundation',
  'Saturn-Moon:square': 'early emotional challenges build depth and self-reliance',
  'Saturn-Moon:sextile': 'practical emotional intelligence — grounded approach to feelings',
  'Neptune-Moon:conjunction': 'deeply intuitive and empathic — emotional boundaries may need attention',
  'Neptune-Moon:opposition': 'others emotions can feel like your own — discernment grows over time',
  'Neptune-Moon:trine': 'natural empathy and creative imagination — emotional attunement is a gift',
  'Neptune-Moon:square': 'emotional confusion or escapism catalyzes spiritual and creative growth',
  'Neptune-Moon:sextile': 'gentle imaginative and empathic sensitivity',
  'Moon-Pluto:conjunction': 'emotional intensity and transformative depth — nothing is felt lightly',
  'Moon-Pluto:opposition': 'power dynamics in close relationships mirror inner emotional evolution',
  'Moon-Pluto:trine': 'natural emotional depth and resilience — capacity for profound healing',
  'Moon-Pluto:square': 'emotional upheavals catalyze deep transformation and self-knowledge',
  'Moon-Pluto:sextile': 'subtle emotional power and insight — regenerative capacity',

  // Venus-Mars (love and desire)
  'Mars-Venus:conjunction': 'love and desire merge — passion and affection are inseparable',
  'Mars-Venus:opposition': 'tension between what you want and what you love creates magnetic attraction',
  'Mars-Venus:trine': 'natural romantic and creative magnetism — desire and beauty flow together',
  'Mars-Venus:square': 'friction between desire and values creates dynamic relationship energy',
  'Mars-Venus:sextile': 'gentle harmony between action and attraction — confident in love',

  // Saturn aspects (important for career and challenges)
  'Saturn-Venus:conjunction': 'serious about love and values — loyalty is deep but expression may be reserved',
  'Saturn-Venus:opposition': 'balancing duty with pleasure — relationships test commitment',
  'Saturn-Venus:trine': 'enduring love and stable values — what you build in relationships lasts',
  'Saturn-Venus:square': 'love challenges build emotional maturity and clearer boundaries',
  'Saturn-Venus:sextile': 'practical approach to love — realistic and steady in relationships',
  'Mars-Saturn:conjunction': 'disciplined drive — action is deliberate and focused',
  'Mars-Saturn:opposition': 'tension between impulse and restraint builds strategic capability',
  'Mars-Saturn:trine': 'sustained effort and patient determination — stamina is a strength',
  'Mars-Saturn:square': 'frustration and blockage become fuel for overcoming obstacles',
  'Mars-Saturn:sextile': 'efficient and focused energy — practical ambition',
  'Jupiter-Saturn:conjunction': 'expansion meets structure — building something meaningful takes patient vision',
  'Jupiter-Saturn:opposition': 'tension between growth and caution creates measured ambition',
  'Jupiter-Saturn:trine': 'wisdom and discipline work together naturally — sustained growth',
  'Jupiter-Saturn:square': 'conflict between optimism and realism drives purposeful development',
  'Jupiter-Saturn:sextile': 'balanced approach to growth — expanding within practical boundaries',

  // Outer planet interactions
  'Neptune-Uranus:conjunction': 'generational marker of idealism and innovation blending',
  'Neptune-Uranus:sextile': 'generational ability to integrate intuition with progressive thinking',
  'Pluto-Uranus:conjunction': 'generational marker of radical transformation and social upheaval',
  'Pluto-Uranus:square': 'generational tension between revolutionary change and power structures',
  'Pluto-Uranus:sextile': 'generational capacity for transformative social innovation',
  'Neptune-Pluto:sextile': 'generational undercurrent of spiritual and psychological evolution',
};

// ── Themed Interpretation Sections ──

export function generateThemedSections(chart: NatalChart): ThemedSection[] {
  const sections: ThemedSection[] = [];

  // 1. Core Self
  sections.push(generateCoreSelf(chart));

  // 2. Emotional World
  sections.push(generateEmotionalWorld(chart));

  // 3. Love & Relationships
  sections.push(generateLoveSection(chart));

  // 4. Communication
  sections.push(generateCommunicationSection(chart));

  // 5. Career & Purpose
  sections.push(generateCareerSection(chart));

  // 6. Wounds & Healing
  const wounds = generateWoundsSection(chart);
  if (wounds) sections.push(wounds);

  // 7. Growth Path
  const growth = generateGrowthSection(chart);
  if (growth) sections.push(growth);

  // 8. Shadow & Intensity
  sections.push(generateShadowSection(chart));

  return sections;
}

function placementLine(p: PlanetPlacement): string {
  const retro = p.isRetrograde ? ' (retrograde)' : '';
  return `${p.planet.name} in ${p.sign.name}, House ${p.house || '—'}, ${p.degree}°${String(p.minute).padStart(2, '0')}'${retro}`;
}

// ── Individual Section Generators ──

function generateCoreSelf(chart: NatalChart): ThemedSection {
  const placements = [placementLine(chart.sun)];
  if (chart.ascendant) placements.push(placementLine(chart.ascendant));

  const sunEl = chart.sun.sign.element;
  const sunMod = chart.sun.sign.modality;

  const details: string[] = [];

  // Sun sign core
  details.push(getSunSignSummary(chart.sun.sign.name));

  // Rising influence
  if (chart.ascendant) {
    details.push(`Your ${chart.ascendant.sign.name} rising shapes how others first experience you — the filter your inner self passes through before it meets the world.`);
  }

  // Sun house
  if (chart.sun.house) {
    details.push(`With the Sun in House ${chart.sun.house}, your sense of identity tends to develop through ${getHouseLifeArea(chart.sun.house)}.`);
  }

  return {
    id: 'core-self',
    title: 'Core Self',
    icon: '☉',
    placements,
    summary: `Your identity is rooted in ${sunEl.toLowerCase()} energy with a ${sunMod.toLowerCase()} approach — ${getSunElementBrief(sunEl)}.`,
    details,
  };
}

function generateEmotionalWorld(chart: NatalChart): ThemedSection {
  const placements = [placementLine(chart.moon)];

  const moonEl = chart.moon.sign.element;
  const details: string[] = [];

  details.push(getMoonSignSummary(chart.moon.sign.name));

  if (chart.moon.house) {
    details.push(`Moon in House ${chart.moon.house} suggests your emotional life is most active around ${getHouseLifeArea(chart.moon.house)}.`);
  }

  // Water placements emphasis
  const waterCount = [chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars]
    .filter(p => p.sign.element === 'Water').length;
  if (waterCount >= 3) {
    details.push('With strong water emphasis among your personal planets, emotional sensitivity and intuition are dominant forces in how you experience life.');
  }

  return {
    id: 'emotional-world',
    title: 'Emotional World',
    icon: '☽',
    placements,
    summary: `Your emotional nature processes through ${moonEl.toLowerCase()} — ${getMoonElementBrief(moonEl)}.`,
    details,
  };
}

function generateLoveSection(chart: NatalChart): ThemedSection {
  const placements = [
    placementLine(chart.venus),
    placementLine(chart.mars),
  ];

  const desc7 = chart.houseCusps?.find(h => h.house === 7);
  if (desc7) {
    placements.push(`7th House cusp in ${desc7.sign.name}`);
  }

  const details: string[] = [];
  details.push(getVenusSignSummary(chart.venus.sign.name));
  details.push(getMarsInLoveSummary(chart.mars.sign.name));

  if (chart.venus.house) {
    details.push(`Venus in House ${chart.venus.house} suggests you attract and express love through ${getHouseLifeArea(chart.venus.house)}.`);
  }

  return {
    id: 'love-relationships',
    title: 'Love & Relationships',
    icon: '♀',
    placements,
    summary: `You love like a ${chart.venus.sign.name} and desire like a ${chart.mars.sign.name} — ${getVenusMarsInterplay(chart.venus.sign.element, chart.mars.sign.element)}.`,
    details,
  };
}

function generateCommunicationSection(chart: NatalChart): ThemedSection {
  const placements = [placementLine(chart.mercury)];

  const h3 = chart.houseCusps?.find(h => h.house === 3);
  if (h3) placements.push(`3rd House cusp in ${h3.sign.name}`);

  const details: string[] = [];
  details.push(getMercurySignSummary(chart.mercury.sign.name));

  if (chart.mercury.isRetrograde) {
    details.push('Mercury retrograde at birth suggests a more contemplative communication style — you may prefer to process thoughts internally before sharing, and revisiting or rethinking ideas is a natural part of your mental process.');
  }

  if (chart.mercury.house) {
    details.push(`Mercury in House ${chart.mercury.house} channels your thinking toward ${getHouseLifeArea(chart.mercury.house)}.`);
  }

  return {
    id: 'communication',
    title: 'Communication',
    icon: '☿',
    placements,
    summary: `Your mind works through ${chart.mercury.sign.element.toLowerCase()} — ${getMercuryElementBrief(chart.mercury.sign.element)}.`,
    details,
  };
}

function generateCareerSection(chart: NatalChart): ThemedSection {
  const placements = [placementLine(chart.saturn)];
  if (chart.midheaven) placements.push(placementLine(chart.midheaven));

  const mc = chart.angles?.find(a => a.name === 'Midheaven');
  const details: string[] = [];

  if (mc) {
    const mcSign = typeof mc.sign === 'string' ? mc.sign : mc.sign.name;
    details.push(`Midheaven in ${mcSign} shapes your public image and career path — ${getMCSignSummary(mcSign)}.`);
  }

  details.push(getSaturnSignSummary(chart.saturn.sign.name));

  if (chart.saturn.house) {
    details.push(`Saturn in House ${chart.saturn.house} suggests your most important lessons and achievements involve ${getHouseLifeArea(chart.saturn.house)}.`);
  }

  // North Node if available
  const northNode = (chart.planets ?? []).find((p: any) =>
    ['North Node', 'northnode', 'true node'].includes(String(p.planet ?? '').toLowerCase())
  );
  if (northNode) {
    details.push(`Your North Node points toward growth through ${String((northNode as any).sign ?? '')} themes — this is the direction your soul is evolving toward.`);
  }

  return {
    id: 'career-purpose',
    title: 'Career & Purpose',
    icon: 'MC',
    placements,
    summary: `Saturn in ${chart.saturn.sign.name} defines your discipline, and ${chart.midheaven ? `a ${chart.midheaven.sign.name} Midheaven` : 'your 10th house'} shapes your public path.`,
    details,
  };
}

function generateWoundsSection(chart: NatalChart): ThemedSection | null {
  const chiron = (chart.planets ?? []).find((p: any) =>
    String(p.planet ?? '').toLowerCase() === 'chiron'
  );
  if (!chiron) return null;

  const chironSign = String((chiron as any).sign ?? '');
  const chironHouse = (chiron as any).house;

  const placements: string[] = [
    `Chiron in ${chironSign}${chironHouse ? `, House ${chironHouse}` : ''}`,
    placementLine(chart.saturn),
    placementLine(chart.pluto),
  ];

  const details: string[] = [];
  details.push(getChironSignSummary(chironSign));

  details.push(`Saturn in ${chart.saturn.sign.name} adds a layer of discipline to your healing — the wounds you work through here ultimately become your greatest source of authority and wisdom.`);

  details.push(`Pluto in ${chart.pluto.sign.name} suggests generational transformation themes that intersect with your personal evolution — deep change is part of your story.`);

  return {
    id: 'wounds-healing',
    title: 'Wounds & Healing',
    icon: '⚷',
    placements,
    summary: `Chiron in ${chironSign} marks where you carry a core wound — and where you have the deepest capacity to heal others.`,
    details,
  };
}

function generateGrowthSection(chart: NatalChart): ThemedSection | null {
  const northNode = (chart.planets ?? []).find((p: any) => {
    const name = String(p.planet ?? '').toLowerCase();
    return name === 'north node' || name === 'northnode' || name === 'true node';
  });
  if (!northNode) return null;

  const nnSign = String((northNode as any).sign ?? '');
  const nnHouse = (northNode as any).house;

  const placements: string[] = [
    `North Node in ${nnSign}${nnHouse ? `, House ${nnHouse}` : ''}`,
    placementLine(chart.jupiter),
  ];

  const details: string[] = [];
  details.push(getNorthNodeSummary(nnSign));
  details.push(`Jupiter in ${chart.jupiter.sign.name} expands your worldview through ${chart.jupiter.sign.element.toLowerCase()} themes — this is where growth feels most natural and abundant.`);

  if (chart.jupiter.house) {
    details.push(`Jupiter in House ${chart.jupiter.house} suggests your greatest opportunities for expansion arise through ${getHouseLifeArea(chart.jupiter.house)}.`);
  }

  return {
    id: 'growth-path',
    title: 'Growth Path',
    icon: '☊',
    placements,
    summary: `Your North Node in ${nnSign} points toward your soul's growth direction, supported by Jupiter in ${chart.jupiter.sign.name}.`,
    details,
  };
}

function generateShadowSection(chart: NatalChart): ThemedSection {
  const placements = [placementLine(chart.pluto)];

  const lilith = (chart.planets ?? []).find((p: any) => {
    const name = String(p.planet ?? '').toLowerCase();
    return name === 'lilith' || name === 'black moon lilith';
  });
  if (lilith) {
    const lilSign = String((lilith as any).sign ?? '');
    const lilHouse = (lilith as any).house;
    placements.push(`Lilith in ${lilSign}${lilHouse ? `, House ${lilHouse}` : ''}`);
  }

  // 8th house planets
  const h8Planets = [chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto]
    .filter(p => p.house === 8);
  if (h8Planets.length > 0) {
    placements.push(`${h8Planets.map(p => p.planet.name).join(', ')} in the 8th House`);
  }

  const details: string[] = [];
  details.push(getPlutoSignSummary(chart.pluto.sign.name));

  if (lilith) {
    const lilSign = String((lilith as any).sign ?? '');
    details.push(`Lilith in ${lilSign} reveals the wild, unedited part of yourself that resists domestication — the instincts you were taught to suppress but that carry authentic power.`);
  }

  // Scorpio emphasis
  const scorpioCount = [chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars]
    .filter(p => p.sign.name === 'Scorpio').length;
  if (scorpioCount >= 2) {
    details.push('Strong Scorpio influence among your personal planets deepens your relationship with intensity, truth-seeking, and emotional undercurrents.');
  }

  return {
    id: 'shadow-intensity',
    title: 'Shadow & Intensity',
    icon: '♇',
    placements,
    summary: `Pluto in ${chart.pluto.sign.name} shapes your generational relationship with power and transformation.`,
    details,
  };
}

// ── Sign Summaries ──

function getSunSignSummary(sign: string): string {
  const summaries: Record<string, string> = {
    Aries: 'Your Aries Sun burns with the need to initiate, lead, and define yourself through action. You come alive when beginning something new and feel most like yourself when courage is required.',
    Taurus: 'Your Taurus Sun is grounded in persistence, sensory awareness, and the desire to build something lasting. You know your worth and move at the pace that honors it.',
    Gemini: 'Your Gemini Sun thrives on information, conversation, and making connections between ideas. Your identity is woven through curiosity and the ability to see things from multiple angles.',
    Cancer: 'Your Cancer Sun is rooted in emotional intelligence, care, and creating safety. Your sense of self is deeply connected to who and what you nurture.',
    Leo: 'Your Leo Sun radiates warmth, creative expression, and the courage to be seen. You are most alive when living authentically and inspiring others through your presence.',
    Virgo: 'Your Virgo Sun expresses through analysis, service, and the desire to improve. You find identity in being useful, discerning, and attentive to what others overlook.',
    Libra: 'Your Libra Sun seeks harmony, beauty, and meaningful connection. Your identity develops through relationship and the pursuit of balance between self and other.',
    Scorpio: 'Your Scorpio Sun is driven by depth, truth, and the willingness to transform. You identify with what is real, and surface-level engagement feels like a waste of your intensity.',
    Sagittarius: 'Your Sagittarius Sun seeks meaning, adventure, and the expansion of perspective. You define yourself through what you believe, what you explore, and what makes life feel larger.',
    Capricorn: 'Your Capricorn Sun is built on ambition, responsibility, and the long game. Your identity is tied to what you achieve through sustained effort and self-discipline.',
    Aquarius: 'Your Aquarius Sun values originality, independence, and contributing to something larger than yourself. You define yourself through your ideals and your refusal to be defined by convention.',
    Pisces: 'Your Pisces Sun moves through the world with empathy, imagination, and a permeable sensitivity to everything around you. Your identity is fluid, compassionate, and deeply connected to the invisible currents of life.',
  };
  return summaries[sign] || `Your ${sign} Sun shapes your core identity and sense of purpose.`;
}

function getMoonSignSummary(sign: string): string {
  const summaries: Record<string, string> = {
    Aries: 'Your Aries Moon needs independence, directness, and the freedom to feel things immediately. Emotions move fast and burn hot — you process by acting, not waiting.',
    Taurus: 'Your Taurus Moon craves stability, comfort, and sensory grounding. You feel safest when life is predictable, and you process emotions through the body — texture, food, nature, touch.',
    Gemini: 'Your Gemini Moon processes emotions through thinking and talking. You need mental stimulation even when processing feelings, and naming an experience is often what makes it manageable.',
    Cancer: 'Your Cancer Moon feels everything deeply and holds emotional memory longer than most. Home, belonging, and the people you love are the center of your emotional gravity.',
    Leo: 'Your Leo Moon needs to be seen, appreciated, and emotionally honored. When your heart is engaged, you radiate warmth — when it is not acknowledged, the withdrawal can be dramatic.',
    Virgo: 'Your Virgo Moon processes feelings through analysis and practical action. You calm down by organizing, fixing, or making yourself useful — but self-criticism can be the shadow side.',
    Libra: 'Your Libra Moon seeks emotional equilibrium through harmony and connection. You feel most settled in beautiful, balanced environments and can become unsettled by conflict or discord.',
    Scorpio: 'Your Scorpio Moon feels with staggering intensity and holds nothing lightly. Emotional honesty is non-negotiable, and you may carry feelings long after others have moved on.',
    Sagittarius: 'Your Sagittarius Moon needs meaning, movement, and optimism to feel emotionally secure. You process by seeking perspective and reframing — staying stuck feels suffocating.',
    Capricorn: 'Your Capricorn Moon feels safest when in control and prepared. Emotional vulnerability does not come easily — you tend to process privately and may carry emotional weight stoically.',
    Aquarius: 'Your Aquarius Moon processes emotions through intellectual distance and abstract thought. You need space to feel things on your own terms, and emotional flooding can feel disorienting.',
    Pisces: 'Your Pisces Moon absorbs emotion from everywhere — your own feelings and everyone else\'s. Boundaries are essential, because your compassion is genuine but limitless. You heal through solitude, creativity, and surrender.',
  };
  return summaries[sign] || `Your ${sign} Moon shapes your emotional landscape and instinctive responses.`;
}

function getVenusSignSummary(sign: string): string {
  const summaries: Record<string, string> = {
    Aries: 'Venus in Aries loves with directness and urgency. You are attracted to confidence, independence, and the thrill of pursuit.',
    Taurus: 'Venus in Taurus loves with loyalty, sensuality, and devotion. You value stability in love and express affection through physical presence and consistency.',
    Gemini: 'Venus in Gemini loves through conversation, laughter, and intellectual connection. Variety and mental engagement keep your heart interested.',
    Cancer: 'Venus in Cancer loves with deep nurturing, emotional security, and a desire for lasting intimacy. You show love by caring for people in practical, tender ways.',
    Leo: 'Venus in Leo loves with warmth, generosity, and dramatic devotion. You need to feel special and you make your partner feel like the center of the universe.',
    Virgo: 'Venus in Virgo loves through acts of service, attention to detail, and quiet devotion. Love is practical, thoughtful, and expressed in the small things.',
    Libra: 'Venus in Libra loves harmony, beauty, and partnership. You are a natural partner, drawn to elegance and the art of relating to another person.',
    Scorpio: 'Venus in Scorpio loves with intensity, loyalty, and emotional depth. Surface connections leave you cold — you seek merging, truth, and transformation through love.',
    Sagittarius: 'Venus in Sagittarius loves through adventure, honesty, and freedom. You are attracted to people who expand your world and share your appetite for life.',
    Capricorn: 'Venus in Capricorn loves with commitment, ambition, and quiet steadiness. You take love seriously and show it through reliability and long-term investment.',
    Aquarius: 'Venus in Aquarius loves with originality, friendship, and intellectual connection. Convention bores you — your ideal love is also your closest ally and fellow free thinker.',
    Pisces: 'Venus in Pisces loves with extraordinary empathy, romance, and spiritual sensitivity. You idealize love but are also capable of the most selfless, unconditional devotion.',
  };
  return summaries[sign] || `Venus in ${sign} shapes how you give and receive love.`;
}

function getMarsInLoveSummary(sign: string): string {
  const summaries: Record<string, string> = {
    Aries: 'Mars in Aries pursues with directness and confidence. You know what you want and go after it without hesitation.',
    Taurus: 'Mars in Taurus acts with patient determination. Your desire nature is steady, sensual, and deeply persistent.',
    Gemini: 'Mars in Gemini channels desire through words and mental stimulation. Flirtation and intellectual sparring fuel your attraction.',
    Cancer: 'Mars in Cancer asserts through emotional intelligence and protective instincts. You fight for the people you love.',
    Leo: 'Mars in Leo expresses desire with confidence, warmth, and dramatic flair. You pursue boldly and give generously.',
    Virgo: 'Mars in Virgo channels drive into precision and useful action. Your desire is expressed through attentive care and practical effort.',
    Libra: 'Mars in Libra asserts through diplomacy and charm. You prefer to win through persuasion rather than force.',
    Scorpio: 'Mars in Scorpio channels desire into laser-focused intensity. When you want something, your determination is absolute and transformative.',
    Sagittarius: 'Mars in Sagittarius pursues with enthusiasm, honesty, and restless energy. You need freedom in how you act on desire.',
    Capricorn: 'Mars in Capricorn expresses drive through discipline, ambition, and strategic action. You play the long game and you play to win.',
    Aquarius: 'Mars in Aquarius asserts through independence and unconventional approaches. You act on principle and resist being told what to do.',
    Pisces: 'Mars in Pisces channels desire through intuition, imagination, and empathic action. Your assertiveness is gentle but can be surprisingly potent.',
  };
  return summaries[sign] || `Mars in ${sign} shapes how you pursue desire and assert yourself.`;
}

function getMercurySignSummary(sign: string): string {
  const summaries: Record<string, string> = {
    Aries: 'Mercury in Aries thinks fast, speaks directly, and decides quickly. Your communication style is bold and instinctive.',
    Taurus: 'Mercury in Taurus thinks deliberately and speaks with calm authority. You take your time to form opinions and your conclusions tend to stick.',
    Gemini: 'Mercury in Gemini is in its home sign — your mind is quick, curious, and comfortable with complexity. Communication is natural and versatile.',
    Cancer: 'Mercury in Cancer thinks through feeling and emotional memory. Your communication carries emotional nuance that others may not immediately hear.',
    Leo: 'Mercury in Leo communicates with warmth, creativity, and natural authority. Your words carry weight because they carry conviction.',
    Virgo: 'Mercury in Virgo (its other home) processes with precision, discernment, and analytical depth. You notice details others miss.',
    Libra: 'Mercury in Libra thinks in terms of relationship, fairness, and balance. You naturally consider multiple perspectives before speaking.',
    Scorpio: 'Mercury in Scorpio thinks deeply, probes beneath surfaces, and communicates with penetrating insight. Superficial conversation bores you.',
    Sagittarius: 'Mercury in Sagittarius thinks broadly, communicates enthusiastically, and is drawn to big ideas and philosophical questions.',
    Capricorn: 'Mercury in Capricorn communicates with authority, structure, and practical precision. Your thinking is strategic and goal-oriented.',
    Aquarius: 'Mercury in Aquarius thinks independently, loves unconventional ideas, and communicates with originality and intellectual detachment.',
    Pisces: 'Mercury in Pisces thinks in images, feelings, and impressions rather than linear logic. Your communication carries poetic depth and intuitive knowing.',
  };
  return summaries[sign] || `Mercury in ${sign} shapes your thinking and communication style.`;
}

function getSaturnSignSummary(sign: string): string {
  const summaries: Record<string, string> = {
    Aries: 'Saturn in Aries learns discipline through developing patience with impulse. Your life lessons involve learning to act with both courage and restraint.',
    Taurus: 'Saturn in Taurus builds mastery through relationship with material security and self-worth. Lessons around value and stability shape your character.',
    Gemini: 'Saturn in Gemini develops through disciplined thinking and careful communication. Your authority grows through intellectual rigor.',
    Cancer: 'Saturn in Cancer faces lessons around emotional vulnerability, family, and creating safety. Emotional maturity is your deepest achievement.',
    Leo: 'Saturn in Leo learns through developing authentic self-expression under pressure. Your authority comes from being genuinely, vulnerably yourself.',
    Virgo: 'Saturn in Virgo builds mastery through service, health, and attention to what matters. Perfectionism mellows into quiet competence.',
    Libra: 'Saturn in Libra (exalted) develops through commitment to fairness, partnership, and justice. Your maturity shines in relationship.',
    Scorpio: 'Saturn in Scorpio faces lessons around power, trust, and emotional depth. Your resilience is earned through navigating life\'s most demanding passages.',
    Sagittarius: 'Saturn in Sagittarius builds mastery through developing a grounded philosophy. Your authority comes from earned wisdom, not borrowed beliefs.',
    Capricorn: 'Saturn in Capricorn (domicile) builds authority through sustained effort, responsibility, and long-term vision. You take the long view naturally.',
    Aquarius: 'Saturn in Aquarius (co-ruler) develops through structured innovation and principled independence. Your maturity serves collective progress.',
    Pisces: 'Saturn in Pisces learns discipline through integrating faith with structure. Your deepest lessons involve balancing surrender with responsibility.',
  };
  return summaries[sign] || `Saturn in ${sign} shapes your relationship with discipline and life lessons.`;
}

function getMCSignSummary(sign: string): string {
  const summaries: Record<string, string> = {
    Aries: 'a career path that rewards initiative, leadership, and the courage to go first',
    Taurus: 'a career path that rewards patience, reliability, and building things of lasting value',
    Gemini: 'a career path that rewards communication, versatility, and intellectual agility',
    Cancer: 'a career path that rewards nurturing, emotional intelligence, and creating safe spaces',
    Leo: 'a career path that rewards creativity, visibility, and authentic self-expression',
    Virgo: 'a career path that rewards precision, service, and attention to quality',
    Libra: 'a career path that rewards diplomacy, aesthetics, and the ability to create harmony',
    Scorpio: 'a career path that rewards depth, investigation, and the ability to navigate complexity',
    Sagittarius: 'a career path that rewards vision, teaching, and expanding horizons for others',
    Capricorn: 'a career path that rewards ambition, structure, and long-term strategic thinking',
    Aquarius: 'a career path that rewards innovation, independence, and serving the collective good',
    Pisces: 'a career path that rewards compassion, creativity, and connection to something beyond the material',
  };
  return summaries[sign] || `a career path shaped by ${sign} themes`;
}

function getChironSignSummary(sign: string): string {
  const summaries: Record<string, string> = {
    Aries: 'Chiron in Aries carries a wound around identity and the right to exist fully as yourself. Healing comes through developing self-trust without needing external validation.',
    Taurus: 'Chiron in Taurus carries a wound around self-worth and material security. Healing comes through discovering that your value is inherent, not earned.',
    Gemini: 'Chiron in Gemini carries a wound around communication and being understood. Healing comes through trusting your unique way of thinking and expressing.',
    Cancer: 'Chiron in Cancer carries a wound around belonging, nurturing, and feeling safe emotionally. Healing comes through learning to mother yourself.',
    Leo: 'Chiron in Leo carries a wound around self-expression, visibility, and creative confidence. Healing comes through showing up authentically without performing.',
    Virgo: 'Chiron in Virgo carries a wound around perfectionism, usefulness, and being enough. Healing comes through accepting imperfection as inherently human.',
    Libra: 'Chiron in Libra carries a wound around relationships, fairness, and maintaining your identity in partnership. Healing comes through balanced reciprocity.',
    Scorpio: 'Chiron in Scorpio carries a wound around trust, control, and emotional vulnerability. Healing comes through allowing yourself to be transformed without being destroyed.',
    Sagittarius: 'Chiron in Sagittarius carries a wound around meaning, belief, and the search for truth. Healing comes through developing faith that emerges from experience, not dogma.',
    Capricorn: 'Chiron in Capricorn carries a wound around authority, achievement, and the fear of failure. Healing comes through redefining success on your own terms.',
    Aquarius: 'Chiron in Aquarius carries a wound around belonging, being different, and fitting into groups. Healing comes through accepting your uniqueness as a gift, not a deficiency.',
    Pisces: 'Chiron in Pisces carries a wound around existential sensitivity, spiritual disconnection, or boundary dissolution. Healing comes through grounded compassion — caring without losing yourself.',
  };
  return summaries[sign] || `Chiron in ${sign} marks a deep wound that becomes your greatest source of healing wisdom.`;
}

function getNorthNodeSummary(sign: string): string {
  const summaries: Record<string, string> = {
    Aries: 'North Node in Aries calls you toward independence, self-assertion, and the courage to put yourself first after lifetimes of accommodating others.',
    Taurus: 'North Node in Taurus calls you toward simplicity, stability, and trusting in what already is — moving away from crisis-driven intensity.',
    Gemini: 'North Node in Gemini calls you toward curiosity, everyday connection, and learning to ask questions instead of providing answers.',
    Cancer: 'North Node in Cancer calls you toward emotional vulnerability, nurturing, and allowing yourself to need and be needed.',
    Leo: 'North Node in Leo calls you toward creative self-expression, personal joy, and learning to take center stage in your own life.',
    Virgo: 'North Node in Virgo calls you toward practical service, discernment, and grounding your ideals in daily, useful action.',
    Libra: 'North Node in Libra calls you toward partnership, diplomacy, and learning to grow through relationship rather than solitary heroism.',
    Scorpio: 'North Node in Scorpio calls you toward emotional depth, transformation, and trusting in the power of surrender and shared resources.',
    Sagittarius: 'North Node in Sagittarius calls you toward faith, big-picture thinking, and trusting a philosophical or spiritual compass.',
    Capricorn: 'North Node in Capricorn calls you toward authority, long-term goals, and building something that contributes to the wider world.',
    Aquarius: 'North Node in Aquarius calls you toward community, innovation, and serving something larger than personal recognition.',
    Pisces: 'North Node in Pisces calls you toward compassion, spiritual trust, and releasing the need to control every detail.',
  };
  return summaries[sign] || `North Node in ${sign} points toward your soul's growth direction.`;
}

function getPlutoSignSummary(sign: string): string {
  const summaries: Record<string, string> = {
    Leo: 'Pluto in Leo (1939–1957) carries themes of transforming creative self-expression, authority, and the relationship between individual will and collective power.',
    Virgo: 'Pluto in Virgo (1957–1972) carries themes of transforming work, health systems, and the relationship between service and personal power.',
    Libra: 'Pluto in Libra (1972–1984) carries themes of transforming relationships, justice, and the balance of power in partnerships.',
    Scorpio: 'Pluto in Scorpio (1984–1995) carries themes of transforming emotional authenticity, sexuality, and confronting hidden truths.',
    Sagittarius: 'Pluto in Sagittarius (1995–2008) carries themes of transforming belief systems, global perspectives, and the search for meaning.',
    Capricorn: 'Pluto in Capricorn (2008–2024) carries themes of transforming institutions, authority structures, and redefining success.',
    Aquarius: 'Pluto in Aquarius (2024–2044) carries themes of transforming technology, collective consciousness, and the relationship between individual freedom and community.',
  };
  return summaries[sign] || `Pluto in ${sign} shapes your generation's relationship with power and transformation.`;
}

// ── Element Brief Helpers ──

function getSunElementBrief(element: string): string {
  const briefs: Record<string, string> = {
    Fire: 'self-expression through action, creativity, and forward momentum',
    Earth: 'self-definition through tangible achievement and grounded presence',
    Air: 'identity woven through ideas, communication, and social connection',
    Water: 'selfhood rooted in emotional depth, empathy, and intuitive knowing',
  };
  return briefs[element] || '';
}

function getMoonElementBrief(element: string): string {
  const briefs: Record<string, string> = {
    Fire: 'you process feelings through action and expression, needing movement to regulate',
    Earth: 'you process feelings through the body and practical grounding, needing stability to feel safe',
    Air: 'you process feelings through thinking and conversation, needing understanding to settle',
    Water: 'you process feelings through immersion and empathy, needing depth and emotional honesty',
  };
  return briefs[element] || '';
}

function getMercuryElementBrief(element: string): string {
  const briefs: Record<string, string> = {
    Fire: 'quick, instinctive, and bold in expression',
    Earth: 'practical, methodical, and grounded in facts',
    Air: 'curious, social, and comfortable with complexity',
    Water: 'intuitive, emotionally nuanced, and impressionistic',
  };
  return briefs[element] || '';
}

function getVenusMarsInterplay(venusEl: string, marsEl: string): string {
  if (venusEl === marsEl) return `both operating from ${venusEl.toLowerCase()} energy, you love and desire with unified intensity`;
  const combos: Record<string, string> = {
    'Fire-Water': 'passion and emotional depth create a rich but sometimes volatile romantic nature',
    'Water-Fire': 'emotional sensitivity and bold desire create a complex, deeply feeling attraction style',
    'Fire-Earth': 'spontaneous attraction meets grounded desire — exciting but sustainably passionate',
    'Earth-Fire': 'steady love energized by bold pursuit — dependable with a spark',
    'Fire-Air': 'creativity and intellect merge in how you attract and pursue — lively and expressive',
    'Air-Fire': 'ideas and enthusiasm drive your romantic connections — stimulating and warm',
    'Earth-Water': 'security and depth combine for a quietly powerful romantic nature',
    'Water-Earth': 'emotional intuition and practical desire create steady, meaningful connections',
    'Earth-Air': 'practical values and intellectual desire create a thoughtful approach to love',
    'Air-Earth': 'social grace and grounded pursuit — elegant and reliable in love',
    'Air-Water': 'mental connection and emotional desire create a nuanced, perceptive love style',
    'Water-Air': 'empathic love and intellectualized desire — you feel deeply but process through thinking',
  };
  return combos[`${venusEl}-${marsEl}`] || 'your love and desire nature bring different elements together';
}

function getHouseLifeArea(house: number): string {
  const areas: Record<number, string> = {
    1: 'identity, self-presentation, and personal initiative',
    2: 'values, resources, and self-worth',
    3: 'communication, learning, and everyday connections',
    4: 'home, family, and emotional foundations',
    5: 'creativity, romance, and joyful self-expression',
    6: 'daily routines, health, and purposeful service',
    7: 'partnerships, committed relationships, and collaboration',
    8: 'transformation, intimacy, and shared resources',
    9: 'philosophy, higher learning, and expanding horizons',
    10: 'career, public image, and long-term contribution',
    11: 'community, friendship, and future vision',
    12: 'solitude, spirituality, and the subconscious',
  };
  return areas[house] || 'this area of life';
}
