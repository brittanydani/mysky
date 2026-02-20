// File: services/astrology/chartPatterns.ts
// Detects stelliums, chart ruler, conjunction clusters, retrograde emphasis,
// dominant element/modality, and chart shape patterns.
//
// Rule transparency:
//   Stellium = 3+ planets (Sun–Pluto) in the same sign or house.
//   Excludes Angles (ASC/MC) and Nodes.

import { NatalChart, PlanetPlacement } from './types';
import { ZODIAC_SIGNS } from './constants';

// ══════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════

export interface Stellium {
  type: 'sign' | 'house' | 'combined';
  label: string;          // e.g. "Leo" or "1st House" or "Leo in House 5"
  cardTitle: string;      // e.g. "Sign Emphasis: Leo" or "Focused Concentration: Leo in House 5"
  planets: string[];      // ["Sun", "Mercury", "Venus"]
  description: string;    // universal base description for Home screen
  narrative: string;      // full rich narrative for detail views
  subtitle: string;       // e.g. "A life shaped by visibility and authenticity"
  elementCloser?: string; // optional element-flavored closing line
  planetMixNote?: string; // personal-only or outer-planet add-on
  retroNote?: string;     // retrograde-heavy stellium inner emphasis note
}

export interface ChartRuler {
  planet: string;         // e.g. "Moon"
  planetSymbol: string;
  risingSign: string;     // e.g. "Cancer"
  risingSymbol: string;
  rulerSign: string;      // sign the chart ruler is in
  rulerSignSymbol: string;
  rulerHouse: number;
  description: string;
}

export interface ConjunctionCluster {
  planets: string[];
  avgLongitude: number;
  tightestOrb: number;
  description: string;
}

export interface RetrogradeEmphasis {
  planets: string[];      // retrograde planet names
  count: number;
  description: string;
}

export interface ElementBalance {
  dominant: string;
  counts: Record<string, number>;
  description: string;
  missing?: string;       // element with 0 planets
}

export interface ModalityBalance {
  dominant: string;
  counts: Record<string, number>;
  description: string;
}

export interface ChartPatterns {
  stelliums: Stellium[];  // max 2 for display; prioritized
  stelliumOverflow: boolean; // true when additional stelliums were suppressed
  chartRuler: ChartRuler | null;
  conjunctionClusters: ConjunctionCluster[];
  retrogradeEmphasis: RetrogradeEmphasis;
  elementBalance: ElementBalance;
  modalityBalance: ModalityBalance;
}

// ══════════════════════════════════════════════════
// PLANET LIST (Sun–Pluto, no angles/nodes)
// ══════════════════════════════════════════════════

function getCorePlanets(chart: NatalChart): PlanetPlacement[] {
  return [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ].filter(Boolean);
}

// ══════════════════════════════════════════════════
// 1. STELLIUMS
// ══════════════════════════════════════════════════

function detectStelliums(chart: NatalChart): { stelliums: Stellium[]; overflow: boolean } {
  const planets = getCorePlanets(chart);
  const allStelliums: Stellium[] = [];

  const PERSONAL = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars']);
  const OUTER = new Set(['Uranus', 'Neptune', 'Pluto']);

  // ── By sign ──
  const bySign = new Map<string, string[]>();
  for (const p of planets) {
    const signName = p.sign.name;
    if (!bySign.has(signName)) bySign.set(signName, []);
    bySign.get(signName)!.push(p.planet.name);
  }

  // ── By house ──
  const byHouse = new Map<number, string[]>();
  for (const p of planets) {
    if (!p.house) continue;
    if (!byHouse.has(p.house)) byHouse.set(p.house, []);
    byHouse.get(p.house)!.push(p.planet.name);
  }

  // ── Sign → house mapping for combined detection ──
  const signToHouse = new Map<string, number>();
  for (const p of planets) {
    if (p.house) signToHouse.set(p.sign.name, p.house);
  }

  // ── Detect combined stelliums (same sign AND same house) ──
  const combinedKeys = new Set<string>(); // "sign|house" keys already handled
  for (const [sign, signNames] of bySign.entries()) {
    if (signNames.length < 3) continue;
    // Check if all those planets also share the same house
    const housesForSign = new Map<number, string[]>();
    for (const pName of signNames) {
      const pl = planets.find(p => p.planet.name === pName);
      if (pl?.house) {
        if (!housesForSign.has(pl.house)) housesForSign.set(pl.house, []);
        housesForSign.get(pl.house)!.push(pName);
      }
    }
    for (const [house, names] of housesForSign.entries()) {
      if (names.length >= 3) {
        // Combined stellium!
        const signFlavor = getSignStelliumFlavor(sign);
        const combined: Stellium = {
          type: 'combined',
          label: `${sign} in House ${house}`,
          cardTitle: `Focused Concentration: ${sign} in House ${house}`,
          planets: names,
          description: 'Several planets gather in both the same sign and life area, creating a focused channel of experience.\n\nThis kind of concentration often brings depth rather than intensity — inviting you to develop familiarity, nuance, and self-awareness around these themes over time.',
          subtitle: signFlavor.subtitle,
          narrative: signFlavor.narrative,
          elementCloser: 'Growth here tends to come through understanding rather than force.',
        };
        annotatePlanetMix(combined, PERSONAL, OUTER);
        annotateRetrograde(combined, planets);
        allStelliums.push(combined);
        combinedKeys.add(`${sign}|${house}`);
      }
    }
  }

  // ── Sign stelliums (skip those already covered by combined) ──
  for (const [sign, names] of bySign.entries()) {
    if (names.length < 3) continue;
    // Check if all planets already in a combined
    const house = signToHouse.get(sign);
    if (house && combinedKeys.has(`${sign}|${house}`)) continue;

    const flavor = getSignStelliumFlavor(sign);
    const element = getSignElement(sign);
    const s: Stellium = {
      type: 'sign',
      label: sign,
      cardTitle: `Sign Emphasis: ${sign}`,
      planets: names,
      description: 'Several planets gather in this sign, suggesting that its themes tend to be emphasized in how you experience and interpret life.\n\nThis doesn\'t mean this energy is louder than everything else — it means it often becomes a reference point, especially during moments of growth, stress, or decision-making.',
      subtitle: flavor.subtitle,
      narrative: flavor.narrative,
      elementCloser: getElementCloser(element),
    };
    annotatePlanetMix(s, PERSONAL, OUTER);
    annotateRetrograde(s, planets);
    allStelliums.push(s);
  }

  // ── House stelliums (skip those already covered by combined) ──
  for (const [house, names] of byHouse.entries()) {
    if (names.length < 3) continue;
    // Check if already in a combined
    const alreadyCombined = Array.from(combinedKeys).some(k => k.endsWith(`|${house}`));
    if (alreadyCombined) continue;

    const flavor = getHouseStelliumFlavor(house);
    const s: Stellium = {
      type: 'house',
      label: `${ordinal(house)} House`,
      cardTitle: `House Emphasis: ${ordinal(house)} House`,
      planets: names,
      description: 'Multiple planets concentrate in this area of your chart, suggesting that the themes of this life area often carry extra attention or learning.\n\nThis doesn\'t mean other areas are less important — it means this space may become especially active during transitions or periods of reflection.',
      subtitle: flavor.subtitle,
      narrative: flavor.narrative,
    };
    annotatePlanetMix(s, PERSONAL, OUTER);
    annotateRetrograde(s, planets);
    allStelliums.push(s);
  }

  // ── Prioritize and limit to max 2 ──
  const prioritized = prioritizeStelliums(allStelliums);
  const overflow = allStelliums.length > 2;
  return { stelliums: prioritized.slice(0, 2), overflow };
}

// ── Helpers for stellium annotations ──

function annotatePlanetMix(s: Stellium, personal: Set<string>, outer: Set<string>): void {
  const allPersonal = s.planets.every(p => personal.has(p));
  const hasOuter = s.planets.some(p => outer.has(p)) && !s.planets.some(p => personal.has(p));

  if (allPersonal) {
    s.planetMixNote = 'Because this emphasis involves personal planets, these themes may feel especially familiar or close to your sense of self.';
  } else if (hasOuter) {
    s.planetMixNote = 'With outer planets involved, this emphasis may unfold gradually and become clearer over time.';
  }
}

function annotateRetrograde(s: Stellium, allPlanets: PlanetPlacement[]): void {
  const retroCount = s.planets.filter(name => {
    const pl = allPlanets.find(p => p.planet.name === name);
    return pl?.isRetrograde;
  }).length;
  // Retrograde-heavy = majority of stellium planets are Rx
  if (retroCount >= 2 && retroCount >= Math.ceil(s.planets.length / 2)) {
    s.retroNote = 'This concentration includes retrograde planets, suggesting that much of this processing happens internally. Reflection, revisiting, or reworking these themes may be just as important as outward action.';
  }
}

function getSignElement(sign: string): string {
  const elements: Record<string, string> = {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
  };
  return elements[sign] || '';
}

function getElementCloser(element: string): string {
  const closers: Record<string, string> = {
    Fire: 'Expression, movement, or meaning may feel especially tied to your sense of vitality.',
    Earth: 'Stability, usefulness, or tangible progress may feel grounding for your nervous system.',
    Air: 'Thinking, communicating, or understanding patterns may help you orient yourself.',
    Water: 'Emotional awareness and internal processing may quietly guide many of your choices.',
  };
  return closers[element] || '';
}

function prioritizeStelliums(stelliums: Stellium[]): Stellium[] {
  const PERSONAL = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars']);
  const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);

  return [...stelliums].sort((a, b) => {
    // Combined first (rarest, most meaningful)
    if (a.type === 'combined' && b.type !== 'combined') return -1;
    if (b.type === 'combined' && a.type !== 'combined') return 1;

    // Personal planets score higher
    const aPersonal = a.planets.filter(p => PERSONAL.has(p)).length;
    const bPersonal = b.planets.filter(p => PERSONAL.has(p)).length;
    if (aPersonal !== bPersonal) return bPersonal - aPersonal;

    // Angular houses score higher
    const aAngular = a.type === 'house' && ANGULAR_HOUSES.has(parseHouseNumber(a.label)) ? 1 : 0;
    const bAngular = b.type === 'house' && ANGULAR_HOUSES.has(parseHouseNumber(b.label)) ? 1 : 0;
    if (aAngular !== bAngular) return bAngular - aAngular;

    // More planets = more interesting
    return b.planets.length - a.planets.length;
  });
}

function parseHouseNumber(label: string): number {
  const match = label.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function getHouseStelliumFlavor(house: number): { short: string; subtitle: string; narrative: string } {
  const flavors: Record<number, { short: string; subtitle: string; narrative: string }> = {
    1: {
      short: 'Questions of identity and presence tend to repeat across your life — growth keeps reshaping who you are.',
      subtitle: 'A life shaped by self-definition',
      narrative: 'With multiple planets here, questions of identity and presence tend to repeat across your life. You may find yourself revisiting who you are — not because you\'re unsure, but because growth keeps reshaping you.\n\nBeing seen, misunderstood, or mirrored by others can feel especially impactful. You may notice that transitions often coincide with changes in how you present yourself or inhabit your body.\n\nEarlier in life, this emphasis can feel like pressure to "be someone." Over time, it matures into embodied self-trust — the ability to exist without constantly explaining or proving yourself.\n\nThe deeper invitation is learning that identity isn\'t something you finalize — it\'s something you live into.',
    },
    2: {
      short: 'Life often brings you back to questions of value — what you rely on, what sustains you, and what feels stable enough to rest in.',
      subtitle: 'A life shaped by safety and self-worth',
      narrative: 'This stellium concentrates attention around security — emotional, material, or energetic. Life often brings you back to questions of value: what you rely on, what sustains you, and what feels stable enough to rest in.\n\nYou may feel most regulated when life feels predictable or resourced, and unsettled when support feels uncertain. This can show up around money, energy, time, or self-esteem.\n\nEarlier experiences may have taught you to equate worth with productivity or accumulation. Over time, this emphasis becomes an internal sense of steadiness that doesn\'t disappear when circumstances shift.\n\nThe deeper invitation is discovering that security can be internalized — not earned moment by moment.',
    },
    3: {
      short: 'Learning, communication, and interpretation become recurring life themes — you process experience through thinking, naming, or sharing.',
      subtitle: 'A life shaped by perception and meaning-making',
      narrative: 'With a stellium here, learning, communication, and interpretation become recurring life themes. You may process experience through thinking, naming, or sharing — using language to orient yourself.\n\nYour environment, siblings, early schooling, or daily exchanges may leave lasting impressions. You may notice your mind rarely feels idle, even when you\'re at rest.\n\nEarlier in life, this can feel overstimulating or scattered. Over time, it matures into discernment — knowing which thoughts deserve attention and which can pass through.\n\nThe deeper invitation is learning that understanding doesn\'t always require constant mental activity.',
    },
    4: {
      short: 'Life often returns you to questions of home — whether that\'s family, place, or an internal sense of grounding.',
      subtitle: 'A life shaped by inner foundations',
      narrative: 'This stellium places emphasis on emotional roots, belonging, and inner safety. Life often returns you to questions of home — whether that\'s family, place, or an internal sense of grounding.\n\nYou may carry strong emotional memory, sensing how the past echoes into the present. Changes in environment or family dynamics can feel especially impactful.\n\nEarlier in life, this emphasis may feel heavy or consuming. Over time, it becomes a capacity to create emotional continuity — a sense of home that travels with you.\n\nThe deeper invitation is learning that belonging doesn\'t have to be recreated every time life changes.',
    },
    5: {
      short: 'Creativity, play, and self-expression recur as central themes — life often invites you to reconnect with joy as vitality.',
      subtitle: 'A life shaped by expression and joy',
      narrative: 'With multiple planets here, creativity, play, and self-expression recur as central themes. Life often invites you to reconnect with joy — not as indulgence, but as vitality.\n\nYou may feel most yourself when expressing something uniquely yours, whether through creativity, romance, or passion projects. Suppression can feel like disconnection.\n\nEarlier experiences may have complicated joy — making it feel earned or unsafe. Over time, this stellium matures into authentic expression without performance.\n\nThe deeper invitation is allowing joy to be a stabilizing force, not a reward.',
    },
    6: {
      short: 'Growth often comes through repetition, refinement, and tending to details others overlook.',
      subtitle: 'A life shaped by care and responsibility',
      narrative: 'This stellium emphasizes daily life — routines, health, work, and service. Growth often comes through repetition, refinement, and tending to details others overlook.\n\nYou may feel safest when life feels organized or purposeful, and dysregulated when systems break down. Responsibility can feel personal here.\n\nEarlier in life, this emphasis may feel like pressure or self-criticism. Over time, it becomes sustainable care — knowing when effort supports you and when it drains you.\n\nThe deeper invitation is learning that rest and care are part of responsibility, not separate from it.',
    },
    7: {
      short: 'Relationships become mirrors for self-understanding — life often teaches you through connection, conflict, and collaboration.',
      subtitle: 'A life shaped by relationship',
      narrative: 'With a stellium here, relationships become mirrors for self-understanding. Life often teaches you through connection, conflict, and collaboration.\n\nYou may notice that major growth periods coincide with shifts in partnership — romantic or otherwise. Being witnessed matters deeply.\n\nEarlier experiences may have encouraged self-adjustment for harmony. Over time, this emphasis matures into conscious reciprocity — choosing relationships that reflect mutual respect.\n\nThe deeper invitation is learning that connection doesn\'t require self-erasure.',
    },
    8: {
      short: 'Life may initiate you into depth earlier than expected — repeated encounters with emotional intensity, vulnerability, and change.',
      subtitle: 'A life shaped by depth and transformation',
      narrative: 'This stellium brings repeated encounters with emotional intensity, vulnerability, and change. Life may initiate you into depth earlier than expected.\n\nYou may sense undercurrents others avoid — feeling drawn toward truth, healing, or intimacy. Surface-level engagement can feel unsatisfying.\n\nEarlier in life, this emphasis can feel overwhelming or isolating. Over time, it becomes resilience — the ability to sit with discomfort without losing yourself.\n\nThe deeper invitation is realizing that transformation doesn\'t require constant crisis.',
    },
    9: {
      short: 'Growth often comes through exploration — intellectual, spiritual, or literal. Life invites you to expand your worldview repeatedly.',
      subtitle: 'A life shaped by perspective and meaning',
      narrative: 'With multiple planets here, growth often comes through exploration — intellectual, spiritual, or literal. Life invites you to expand your worldview repeatedly.\n\nYou may feel restless when confined to familiar perspectives, and energized when learning or teaching. Meaning helps regulate you.\n\nEarlier experiences may have leaned toward idealism or escape. Over time, this emphasis matures into grounded wisdom.\n\nThe deeper invitation is learning that meaning doesn\'t require distance from the present moment.',
    },
    10: {
      short: 'Life may place expectations on you early — or ask you to define success on your own terms.',
      subtitle: 'A life shaped by direction and contribution',
      narrative: 'This stellium concentrates attention on purpose, responsibility, and visibility. Life may place expectations on you early — or ask you to define success on your own terms.\n\nYou may associate safety with competence or recognition. Public roles can feel especially charged.\n\nEarlier in life, this emphasis can feel heavy. Over time, it becomes quiet authority — contributing without losing yourself.\n\nThe deeper invitation is learning that purpose can be self-defined, not imposed.',
    },
    11: {
      short: 'Community, friendship, and collective identity play central roles — life often invites you to find yourself through shared ideals.',
      subtitle: 'A life shaped by belonging and vision',
      narrative: 'With a stellium here, community, friendship, and collective identity play central roles. Life often invites you to find yourself through shared ideals or causes.\n\nYou may feel most alive when connected to something larger than yourself. Isolation can feel disorienting.\n\nEarlier experiences may have involved feeling different or peripheral. Over time, this emphasis matures into chosen belonging.\n\nThe deeper invitation is learning that community doesn\'t require self-abandonment.',
    },
    12: {
      short: 'Life often unfolds quietly here — beneath the surface. You may process experience inwardly, needing solitude to make sense of life.',
      subtitle: 'A life shaped by the inner world',
      narrative: 'This stellium emphasizes introspection, integration, and unconscious patterns. Life often unfolds quietly here — beneath the surface.\n\nYou may process experience inwardly, needing solitude to make sense of life. Emotional permeability can be high.\n\nEarlier in life, this emphasis may feel confusing or isolating. Over time, it becomes profound self-awareness and compassion.\n\nThe deeper invitation is learning that withdrawal can be restorative — when chosen consciously.',
    },
  };
  return flavors[house] || {
    short: `Energy tends to gather around ${getHouseTheme(house)}. There's a strong focus here — this part of life may feel especially active or meaningful.`,
    subtitle: `Strong focus in ${getHouseTheme(house)}`,
    narrative: '',
  };
}

function getSignStelliumFlavor(sign: string): { short: string; subtitle: string; narrative: string } {
  const flavors: Record<string, { short: string; subtitle: string; narrative: string }> = {
    Aries: {
      short: 'You carry a concentrated drive toward beginnings — life often meets you at moments of decision, action, or emergence.',
      subtitle: 'A life shaped by initiation',
      narrative: 'You carry a concentrated drive toward beginnings. Life often meets you at moments of decision, action, or emergence — asking you to move before everything feels certain.\n\nThis emphasis can create a deep familiarity with courage, urgency, and momentum. You may feel most alive when something is just starting, when instinct matters more than strategy.\n\nEarlier in life, this stellium can feel restless or pressurized, as though slowing down risks losing yourself. Over time, it becomes a source of embodied confidence — the ability to trust your first response without needing constant reinforcement.\n\nWhen supported, this stellium expresses as healthy assertiveness and self-trust. Under strain, it may show up as impatience or burnout.\n\nThe deeper invitation here is learning that initiative doesn\'t require urgency — and that your presence is just as powerful as your motion.',
    },
    Taurus: {
      short: 'Life repeatedly invites you to slow down, root in the body, and clarify what truly matters.',
      subtitle: 'A life shaped by stability and value',
      narrative: 'This stellium concentrates attention around safety, worth, and what endures. Life repeatedly invites you to slow down, root in the body, and clarify what truly matters.\n\nYou may experience this area as deeply comforting at times — and stubbornly challenging at others. Change can feel personal here, even when it\'s necessary.\n\nEarly on, this emphasis may feel like resistance or fear of loss. With time, it becomes a profound capacity for grounded presence, loyalty, and self-respect.\n\nWhen supported, this stellium offers patience and steadiness. Under strain, it can manifest as rigidity or over-attachment.\n\nThe deeper invitation is learning that stability isn\'t something you lose — it\'s something you carry.',
    },
    Gemini: {
      short: 'Life tends to meet you through conversation, information, and mental movement.',
      subtitle: 'A life shaped by meaning-making',
      narrative: 'This stellium gathers energy around thought, language, and connection. Life tends to meet you through conversation, information, and mental movement.\n\nYou may feel especially alive when learning, exchanging ideas, or naming experiences. Silence or stagnation can feel unsettling — as though understanding keeps you safe.\n\nEarlier in life, this emphasis can feel scattered or overstimulated. Over time, it becomes an ability to hold complexity without needing immediate answers.\n\nWhen supported, this stellium expresses curiosity and adaptability. Under strain, it may show up as overthinking or emotional detachment.\n\nThe deeper invitation here is learning that understanding doesn\'t always require explanation — and that presence can exist beyond words.',
    },
    Cancer: {
      short: 'Life often returns you to themes of care, belonging, and protection.',
      subtitle: 'A life shaped by emotional memory',
      narrative: 'This stellium places emotional awareness at the center of your experience. Life often returns you to themes of care, belonging, and protection.\n\nYou may feel deeply attuned to atmosphere — sensing what\'s needed before it\'s spoken. This sensitivity is not fragility; it\'s a form of intelligence.\n\nEarlier in life, this emphasis can feel overwhelming, as though emotions arrive faster than they can be processed. Over time, it becomes a deep capacity for emotional containment and compassion.\n\nWhen supported, this stellium nurtures connection. Under strain, it may lead to withdrawal or emotional guarding.\n\nThe deeper invitation is learning that feeling deeply doesn\'t mean carrying everything alone.',
    },
    Leo: {
      short: 'Life often invites you to step forward — not for approval, but for alignment.',
      subtitle: 'A life shaped by visibility and authenticity',
      narrative: 'This stellium concentrates energy around self-expression and being seen. Life often invites you to step forward — not for approval, but for alignment.\n\nYou may revisit questions of identity, confidence, and creative expression throughout life. Being unseen can feel destabilizing; being authentic feels regulating.\n\nEarly experiences may have taught you to perform or prove yourself. Over time, this stellium becomes a quiet, embodied sense of self-worth.\n\nWhen supported, it expresses as warmth and creative leadership. Under strain, it may show up as self-doubt or over-identification with validation.\n\nThe deeper invitation is realizing you don\'t need to shine harder — only more honestly.',
    },
    Virgo: {
      short: 'Life often meets you through responsibility, problem-solving, and noticing what others overlook.',
      subtitle: 'A life shaped by discernment and service',
      narrative: 'This stellium brings focus to analysis, care, and refinement. Life often meets you through responsibility, problem-solving, and noticing what others overlook.\n\nYou may feel safest when things make sense or serve a purpose. Disorder can feel personal, even when it isn\'t.\n\nEarlier in life, this emphasis may feel like pressure to be useful or perfect. Over time, it becomes a gift for clarity, humility, and meaningful contribution.\n\nWhen supported, this stellium offers precision and care. Under strain, it may express as self-criticism or anxiety.\n\nThe deeper invitation is learning that worth doesn\'t depend on usefulness — and that rest is also a form of service.',
    },
    Libra: {
      short: 'You often learn who you are through interaction with others.',
      subtitle: 'A life shaped by relationship and balance',
      narrative: 'This stellium centers life around connection, fairness, and reflection. You often learn who you are through interaction with others.\n\nYou may feel most regulated when harmony exists — and unsettled when conflict goes unresolved.\n\nEarly on, this emphasis can feel like self-abandonment or indecision. Over time, it becomes relational wisdom and emotional diplomacy.\n\nWhen supported, it expresses as grace and attunement. Under strain, it may show up as people-pleasing or avoidance.\n\nThe deeper invitation is learning that balance includes your own needs, not just others\'.',
    },
    Scorpio: {
      short: 'Life often meets you through endings, truth-telling, and deep emotional exchanges.',
      subtitle: 'A life shaped by depth and transformation',
      narrative: 'This stellium intensifies emotional and psychological awareness. Life often meets you through endings, truth-telling, and deep emotional exchanges.\n\nYou may sense undercurrents others avoid. Superficiality can feel disorienting.\n\nEarlier experiences may have taught you vigilance or control. Over time, this emphasis becomes emotional resilience and profound insight.\n\nWhen supported, it expresses as courage and authenticity. Under strain, it may show up as defensiveness or emotional withdrawal.\n\nThe deeper invitation is learning that vulnerability is not exposure — it\'s power.',
    },
    Sagittarius: {
      short: 'Life often pushes you to grow beyond what you know.',
      subtitle: 'A life shaped by meaning and expansion',
      narrative: 'This stellium focuses attention on truth, exploration, and perspective. Life often pushes you to grow beyond what you know.\n\nYou may feel confined by routines that lack meaning. Curiosity and movement feel regulating.\n\nEarly on, this emphasis may feel restless or idealistic. Over time, it becomes grounded wisdom and faith in the unfolding path.\n\nWhen supported, it expresses as optimism and insight. Under strain, it may show up as avoidance or excess.\n\nThe deeper invitation is learning that freedom includes staying present, not just moving on.',
    },
    Capricorn: {
      short: 'Life often asks you to grow up early or carry weight.',
      subtitle: 'A life shaped by responsibility and endurance',
      narrative: 'This stellium concentrates energy around structure, mastery, and long-term effort. Life often asks you to grow up early or carry weight.\n\nYou may associate safety with competence and reliability. Rest can feel earned rather than inherent.\n\nEarlier in life, this emphasis can feel heavy or isolating. Over time, it becomes quiet authority and self-respect.\n\nWhen supported, it expresses as resilience and leadership. Under strain, it may manifest as rigidity or emotional suppression.\n\nThe deeper invitation is learning that strength doesn\'t require self-denial.',
    },
    Aquarius: {
      short: 'Life often places you slightly outside the norm — as an observer or innovator.',
      subtitle: 'A life shaped by perspective and difference',
      narrative: 'This stellium brings focus to individuality, systems, and collective awareness. Life often places you slightly outside the norm — as an observer or innovator.\n\nYou may feel most yourself when thinking broadly or contributing to change. Emotional intensity may feel unfamiliar or distant.\n\nEarly experiences may have emphasized detachment. Over time, this stellium becomes authentic belonging without conformity.\n\nWhen supported, it expresses as originality and vision. Under strain, it may show up as emotional distancing.\n\nThe deeper invitation is learning that connection doesn\'t require sameness.',
    },
    Pisces: {
      short: 'Life often meets you through empathy, imagination, or surrender.',
      subtitle: 'A life shaped by sensitivity and permeability',
      narrative: 'This stellium heightens emotional, intuitive, and energetic awareness. Life often meets you through empathy, imagination, or surrender.\n\nYou may absorb more than you intend. Boundaries can feel porous.\n\nEarlier in life, this emphasis may feel confusing or overwhelming. Over time, it becomes deep compassion and spiritual resilience.\n\nWhen supported, it expresses as creativity and grace. Under strain, it may show up as escapism or exhaustion.\n\nThe deeper invitation is learning that sensitivity is a strength — when protected.',
    },
  };
  return flavors[sign] || { short: `Several planets gather in ${sign}, suggesting extra emphasis here.`, subtitle: `A concentration in ${sign}`, narrative: '' };
}

function getHouseTheme(house: number): string {
  const themes: Record<number, string> = {
    1: 'identity and self-presentation',
    2: 'values, resources, and self-worth',
    3: 'communication, learning, and daily connections',
    4: 'home, family, and emotional roots',
    5: 'creativity, romance, and self-expression',
    6: 'daily routines, health, and service',
    7: 'partnerships and committed relationships',
    8: 'transformation, intimacy, and shared resources',
    9: 'philosophy, travel, and higher learning',
    10: 'career, public image, and legacy',
    11: 'community, friendships, and future vision',
    12: 'spirituality, the subconscious, and surrender',
  };
  return themes[house] || 'this life area';
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ══════════════════════════════════════════════════
// 2. CHART RULER
// ══════════════════════════════════════════════════

// Modern rulerships (consistent with contemporary astrological practice)
// Note: constants.ts uses traditional rulers for sign definitions;
// chart ruler detection intentionally uses modern rulers.
const SIGN_RULERS: Record<string, string> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Pluto',      // modern; traditional = Mars
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Uranus',    // modern; traditional = Saturn
  Pisces: 'Neptune',     // modern; traditional = Jupiter
};

function detectChartRuler(chart: NatalChart): ChartRuler | null {
  if (!chart.ascendant) return null;

  const risingSign = chart.ascendant.sign.name;
  const rulerName = SIGN_RULERS[risingSign];
  if (!rulerName) return null;

  // Find the ruler planet placement
  const planets = getCorePlanets(chart);
  const ruler = planets.find(p => p.planet.name === rulerName);
  if (!ruler) return null;

  return {
    planet: rulerName,
    planetSymbol: ruler.planet.symbol,
    risingSign,
    risingSymbol: chart.ascendant.sign.symbol,
    rulerSign: ruler.sign.name,
    rulerSignSymbol: ruler.sign.symbol,
    rulerHouse: ruler.house,
    description: getChartRulerDescription(rulerName, ruler.sign.name, ruler.house),
  };
}

function getChartRulerDescription(planet: string, sign: string, house: number): string {
  return `The planet guiding how you move through the world and initiate experience. ` +
    `Placed in ${sign}, House ${house}, ` +
    `this suggests where your life's overall direction tends to express itself. ` +
    `${getChartRulerFlavor(planet)}`;
}

function getChartRulerFlavor(planet: string): string {
  const flavors: Record<string, string> = {
    Sun: 'Expression and authenticity tend to be central to how you find stability.',
    Moon: 'Emotional attunement and care may be guiding forces in how you navigate life.',
    Mercury: 'Communication and curiosity tend to shape how you make sense of your experience.',
    Venus: 'Connection, beauty, and what you value may be threads that give your life meaning.',
    Mars: 'Taking action and pursuing what matters tends to be how you find your way.',
    Jupiter: 'Growth, meaning-making, and expanding your perspective may feel especially natural.',
    Saturn: 'Structure, responsibility, and building something enduring tend to shape your path.',
    Uranus: 'Independence and doing things your own way may be part of how you move through the world.',
    Neptune: 'Imagination, sensitivity, and spiritual openness may guide your experience.',
    Pluto: 'Depth, transformation, and inner strength tend to be recurring themes in your journey.',
  };
  return flavors[planet] || '';
}

// ══════════════════════════════════════════════════
// 3. CONJUNCTION CLUSTERS
// ══════════════════════════════════════════════════

function detectConjunctionClusters(chart: NatalChart): ConjunctionCluster[] {
  const planets = getCorePlanets(chart);
  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  const clusters: ConjunctionCluster[] = [];
  const used = new Set<number>();
  const CLUSTER_ORB = 10; // degrees

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(i)) continue;

    const group: number[] = [i];
    for (let j = i + 1; j < sorted.length; j++) {
      if (used.has(j)) continue;

      // Check distance from any planet already in the group
      const inRange = group.some(gi => {
        let diff = Math.abs(sorted[j].longitude - sorted[gi].longitude);
        if (diff > 180) diff = 360 - diff;
        return diff <= CLUSTER_ORB;
      });

      if (inRange) group.push(j);
    }

    if (group.length >= 2) {
      const names = group.map(gi => sorted[gi].planet.name);

      // Don't report 2-planet clusters that are already in a stellium
      // (stelliums are more interesting)
      if (group.length === 2) {
        // Calculate tightest orb
        let diff = Math.abs(sorted[group[0]].longitude - sorted[group[1]].longitude);
        if (diff > 180) diff = 360 - diff;
        if (diff > 8) continue; // only show tight pairs
      }

      // Calculate average longitude and tightest orb
      const lons = group.map(gi => sorted[gi].longitude);
      const avg = lons.reduce((a, b) => a + b, 0) / lons.length;
      let tightest = 999;
      for (let a = 0; a < group.length; a++) {
        for (let b = a + 1; b < group.length; b++) {
          let d = Math.abs(sorted[group[a]].longitude - sorted[group[b]].longitude);
          if (d > 180) d = 360 - d;
          if (d < tightest) tightest = d;
        }
      }

      group.forEach(gi => used.add(gi));

      clusters.push({
        planets: names,
        avgLongitude: avg,
        tightestOrb: Math.round(tightest * 10) / 10,
        description: getClusterDescription(names, tightest),
      });
    }
  }

  return clusters.filter(c => c.planets.length >= 2);
}

function getClusterDescription(planets: string[], tightestOrb: number): string {
  if (planets.length >= 3) {
    return `${planets.join(', ')} are tightly clustered (${tightestOrb.toFixed(1)}° orb). ` +
      `These planets often work as a unit — influencing one another and shaping how this part of your experience unfolds.`;
  }

  const [a, b] = planets;
  const pairDescriptions: Record<string, string> = {
    'Sun-Moon': 'Your identity and emotions tend to be closely linked — what you want and what you need may naturally align.',
    'Sun-Mercury': 'Your mind and identity tend to be fused — you may think your way through who you are.',
    'Sun-Venus': 'Your sense of self may be intertwined with love, beauty, and what you value.',
    'Sun-Mars': 'Your identity tends to be action-oriented — you may define yourself through what you do.',
    'Moon-Mercury': 'Thinking and feeling may merge — your mind processes emotions in real-time.',
    'Moon-Venus': 'Emotional comfort and love tend to be deeply connected for you.',
    'Moon-Mars': 'Your emotions and drive may be linked — feelings can quickly become action.',
    'Mercury-Venus': 'Communication and charm tend to blend naturally — words may come with grace.',
    'Mercury-Mars': 'Your thinking tends to be sharp and direct — mental energy may run hot.',
    'Venus-Mars': 'Desire and attraction are closely woven — passion may be a recurring theme.',
  };

  const key1 = `${a}-${b}`;
  const key2 = `${b}-${a}`;
  const specific = pairDescriptions[key1] || pairDescriptions[key2];

  if (specific) return specific;

  return `${a} and ${b} sit closely together (${tightestOrb.toFixed(1)}° apart), suggesting a shared channel of focus or expression. ` +
    `These planets often work as a unit — influencing one another and shaping how this part of your experience unfolds.`;
}

// ══════════════════════════════════════════════════
// 4. RETROGRADE EMPHASIS
// ══════════════════════════════════════════════════

function detectRetrogradeEmphasis(chart: NatalChart): RetrogradeEmphasis {
  const planets = getCorePlanets(chart);
  // Exclude Sun and Moon (they never go retrograde)
  const canRetrograde = planets.filter(p =>
    p.planet.name !== 'Sun' && p.planet.name !== 'Moon'
  );
  const retros = canRetrograde.filter(p => p.isRetrograde);
  const names = retros.map(p => p.planet.name);

  let description = '';
  if (names.length === 0) {
    description = 'No natal retrogrades — your planetary energies tend to express outwardly and directly.';
  } else if (names.length === 1) {
    description = `You were born with ${names[0]} retrograde — reflection and private processing play a key role in how you work with its themes. ` +
      getRetrogradeFlavor(names[0]);
  } else if (names.length <= 3) {
    description = `${names.join(' and ')} were retrograde at birth. ` +
      `Internalization and inner dialogue may play a key role in how you understand these parts of yourself.`;
  } else {
    description = `${names.length} planets were retrograde at birth (${names.join(', ')}). ` +
      `You may notice a rich inner life — processing, reflecting, and developing your own understanding before sharing it outwardly.`;
  }

  return { planets: names, count: names.length, description };
}

function getRetrogradeFlavor(planet: string): string {
  const flavors: Record<string, string> = {
    Mercury: 'Inner dialogue and reflective thinking may play a key role in how you understand yourself.',
    Venus: 'You may notice that love and values develop privately first, before being expressed.',
    Mars: 'Your drive may work quietly — building momentum internally before moving outward.',
    Jupiter: 'Growth and meaning may come through inner exploration and personal reflection.',
    Saturn: 'You may notice you develop your own standards through internal rather than external authority.',
    Uranus: 'Your sense of independence may process privately — rethinking norms on your own terms.',
    Neptune: 'Your creative and spiritual life may be deeply personal and not easily put into words.',
    Pluto: 'Transformation tends to happen at a deep, private level — inner strength is a quiet resource.',
  };
  return flavors[planet] || '';
}

// ══════════════════════════════════════════════════
// 5. ELEMENT BALANCE
// ══════════════════════════════════════════════════

function analyzeElementBalance(chart: NatalChart): ElementBalance {
  const planets = getCorePlanets(chart);
  const counts: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };

  for (const p of planets) {
    if (p.sign?.element) counts[p.sign.element]++;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const missing = sorted.find(([_, c]) => c === 0)?.[0];

  let description = getElementDescription(dominant, counts[dominant]);
  if (missing) {
    description += ` Notably, ${missing} is absent from your chart — ${getMissingElementNote(missing)}`;
  }

  return { dominant, counts, description, missing };
}

function getElementDescription(element: string, count: number): string {
  const descriptions: Record<string, string> = {
    Fire: `There's an emphasis on Fire in your chart — action, expression, and momentum tend to stand out. You may notice you lead with enthusiasm and initiative.`,
    Earth: `There's an emphasis on Earth in your chart — practicality, stability, and tangible results tend to matter. You may notice a drive to build things that last.`,
    Air: `There's an emphasis on Air in your chart — ideas, communication, and social connection tend to stand out. Your mind may be one of your most active channels.`,
    Water: `There's an emphasis on Water in your chart — emotional depth, intuition, and empathy tend to run strong. You may notice you feel your way through experience.`,
  };
  return descriptions[element] || '';
}

function getMissingElementNote(element: string): string {
  const notes: Record<string, string> = {
    Fire: 'spontaneity and self-assertion may be quieter — not absent, just something that develops in its own way.',
    Earth: 'grounding and practical routines may take more conscious effort — this is a growth edge, not a flaw.',
    Air: 'intellectual detachment may be less automatic — you may process through other channels first.',
    Water: 'emotional processing may be quieter or more private — not absent, just internal.',
  };
  return notes[element] || '';
}

// ══════════════════════════════════════════════════
// 6. MODALITY BALANCE
// ══════════════════════════════════════════════════

function analyzeModalityBalance(chart: NatalChart): ModalityBalance {
  const planets = getCorePlanets(chart);
  const counts: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };

  for (const p of planets) {
    if (p.sign?.modality) counts[p.sign.modality]++;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];

  const descriptions: Record<string, string> = {
    Cardinal: `Cardinal energy dominates (${counts.Cardinal} planets) — you are an initiator. You start things, set direction, and feel most alive at the beginning of new chapters.`,
    Fixed: `Fixed energy dominates (${counts.Fixed} planets) — you are a sustainer. Once committed, you hold steady with deep determination and follow-through.`,
    Mutable: `Mutable energy dominates (${counts.Mutable} planets) — you are an adapter. Flexibility, versatility, and responsiveness to change come naturally.`,
  };

  return { dominant, counts, description: descriptions[dominant] || '' };
}

// ══════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════

export function detectChartPatterns(chart: NatalChart): ChartPatterns {
  const { stelliums, overflow } = detectStelliums(chart);
  return {
    stelliums,
    stelliumOverflow: overflow,
    chartRuler: detectChartRuler(chart),
    conjunctionClusters: detectConjunctionClusters(chart),
    retrogradeEmphasis: detectRetrogradeEmphasis(chart),
    elementBalance: analyzeElementBalance(chart),
    modalityBalance: analyzeModalityBalance(chart),
  };
}
