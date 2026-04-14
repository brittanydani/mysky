// File: services/astrology/chartPatterns.ts
// Detects stelliums, chart ruler, conjunction clusters, retrograde emphasis,
// dominant element/modality, and chart shape patterns.
//
// Rule transparency:
//   Stellium = 3+ planets (Sun–Pluto) in the same sign or house.
//   Excludes Angles (ASC/MC) and Nodes.

import { NatalChart, PlanetPlacement } from './types';

// ══════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════

export interface Stellium {
  type: 'sign' | 'house' | 'combined';
  label: string;          // e.g. "Leo" or "1st House" or "Leo in House 5"
  cardTitle: string;      // e.g. "Stellium: Leo" or "Stellium: Leo in House 5"
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

export interface PolarityBalance {
  masculine: number;   // Fire + Air planet count
  feminine: number;    // Earth + Water planet count
  dominant: 'Masculine' | 'Feminine' | 'Balanced';
  description: string;
}

export interface DominantFactors {
  planet: string;        // most emphasized planet by aspect count + angularity
  sign: string;          // sign with most planets (weighted)
  house: number | null;  // house with most planets
  descriptions: {
    planet: string;
    sign: string;
    house: string;
  };
}

export interface ChartPatterns {
  stelliums: Stellium[];  // max 2 for display; prioritized
  stelliumOverflow: boolean; // true when additional stelliums were suppressed
  chartRuler: ChartRuler | null;
  conjunctionClusters: ConjunctionCluster[];
  retrogradeEmphasis: RetrogradeEmphasis;
  elementBalance: ElementBalance;
  modalityBalance: ModalityBalance;
  polarityBalance: PolarityBalance;
  dominantFactors: DominantFactors;
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
          cardTitle: `Stellium: ${sign} in House ${house}`,
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
      cardTitle: `Stellium: ${sign}`,
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
      cardTitle: `Stellium: ${ordinal(house)} House`,
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
  return `Your chart ruler is the planet that sets the tone for your entire birth chart — it shapes how you naturally move through the world, what draws your attention, and where your life tends to find its rhythm. ` +
    `Placed in ${sign}, House ${house}, it carries a specific flavor that influences how you approach new experiences and express your core energy. ` +
    `${getChartRulerFlavor(planet)}`;
}

function getChartRulerFlavor(planet: string): string {
  const flavors: Record<string, string> = {
    Sun: 'With the Sun as your chart ruler, self-expression and authenticity aren\'t optional — they\'re how you orient your entire life. You may feel most grounded when you\'re visible, creative, and living in alignment with who you truly are.',
    Moon: 'With the Moon as your chart ruler, emotional intelligence and care are woven into everything you do. Your instincts are powerful navigational tools, and your ability to attune to the emotional undercurrents around you shapes how you move through the world.',
    Mercury: 'With Mercury as your chart ruler, your mind is the engine that drives your life forward. Communication, curiosity, and the desire to understand are central to your identity — you make sense of the world by naming it, questioning it, and connecting its pieces.',
    Venus: 'With Venus as your chart ruler, connection, beauty, and values are not just preferences — they\'re how you find meaning. Your life naturally gravitates toward harmony, relationships, and creating something that reflects what you love.',
    Mars: 'With Mars as your chart ruler, action is your language. You find your way by moving, choosing, and pursuing what matters with directness and courage. Waiting for life to happen isn\'t your style — you\'re built to initiate.',
    Jupiter: 'With Jupiter as your chart ruler, growth and meaning-making aren\'t side projects — they\'re the throughline of your entire life. You\'re naturally drawn to expansion, whether through learning, travel, philosophy, or simply seeing more of what\'s possible.',
    Saturn: 'With Saturn as your chart ruler, structure and responsibility aren\'t burdens — they\'re how you build a life that lasts. You have a natural ability to commit deeply, develop mastery over time, and create something of enduring value through patience and discipline.',
    Uranus: 'With Uranus as your chart ruler, independence and originality aren\'t rebellion for its own sake — they\'re your authentic mode of being. You may feel most alive when you\'re breaking new ground, questioning conventions, and living on your own terms.',
    Neptune: 'With Neptune as your chart ruler, imagination and spiritual sensitivity color your entire life experience. You may sense things others miss, feel drawn to creative or healing work, and navigate by an inner compass that doesn\'t always follow logic but rarely leads you wrong.',
    Pluto: 'With Pluto as your chart ruler, depth and transformation are recurring themes in your life — not because you seek intensity, but because you\'re built for it. You have a quiet inner strength that allows you to navigate change, shed what no longer serves you, and emerge renewed.',
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
      `These planets don't operate independently — they form a concentrated channel of energy that colors a significant part of your personality. ` +
      `You may notice their themes blending together in ways that feel natural to you but distinctive to others.`;
  }

  const [a, b] = planets;
  const pairDescriptions: Record<string, string> = {
    'Sun-Moon': 'Your conscious identity and emotional instincts are fused — what you want and what you need tend to speak in the same voice. This can feel like a deep sense of inner alignment, as though your heart and your purpose are pulling in the same direction. Others may experience you as emotionally transparent and authentically present.',
    'Sun-Mercury': 'Your sense of self and how you communicate are closely linked — you may express who you are primarily through ideas, conversation, and how you frame your experience. Your mind and identity don\'t operate separately; thinking is how you become yourself. You may find that articulating something is what makes it real for you.',
    'Sun-Venus': 'Your identity is woven into what you love, what you find beautiful, and what you value most deeply. You may feel most like yourself when you\'re creating harmony, nurturing a relationship, or surrounded by aesthetics that resonate. This isn\'t superficial — your sense of worth and your sense of self are genuinely intertwined.',
    'Sun-Mars': 'Your identity and your drive are one and the same — you may define yourself through action, courage, and the willingness to go after what matters. Sitting still for too long can feel like losing yourself. You come alive through movement, challenge, and the freedom to assert who you are without apology.',
    'Moon-Mercury': 'Your thinking and feeling processes are deeply merged — emotions arrive as thoughts and thoughts carry emotional weight. You may process feelings by talking or writing them out, and your inner dialogue is likely more emotionally textured than most people realize. This gives you a rare ability to name what others can only feel.',
    'Moon-Venus': 'Emotional comfort and love are deeply intertwined for you — you may feel most secure when surrounded by beauty, affection, and genuine connection. Your emotional world has a natural warmth and softness that draws others in. What you need to feel safe and what you need to feel loved are often the same thing.',
    'Moon-Mars': 'Your emotions and your drive are wired together — when you feel something, it moves you to act. This can make you deeply passionate and protective, especially of the people and things that matter most. You don\'t sit with feelings passively; they become fuel, and that intensity is both your strength and your edge.',
    'Mercury-Venus': 'Your mind and your sense of beauty work in harmony — communication comes with a natural grace and social intelligence. You may have a gift for saying the right thing, finding the elegant solution, or making complex ideas feel approachable. Words are a form of connection for you, not just information.',
    'Mercury-Mars': 'Your thinking is sharp, fast, and direct — your mind runs with an intensity that can cut through confusion quickly. You may be drawn to debate, problem-solving, or any space where mental agility matters. This gives you intellectual courage, but you may also need to watch for mental restlessness or a tendency to argue before listening.',
    'Venus-Mars': 'Desire and attraction are closely woven into how you experience life — you tend to pursue what you love with energy and directness. There\'s a magnetic quality to how you engage with relationships, creativity, and pleasure. Passion isn\'t something you turn on; it\'s a current that runs through everything you care about.',
  };

  const key1 = `${a}-${b}`;
  const key2 = `${b}-${a}`;
  const specific = pairDescriptions[key1] || pairDescriptions[key2];

  if (specific) return specific;

  return `${a} and ${b} sit closely together (${tightestOrb.toFixed(1)}° apart), suggesting their energies blend into a single, unified expression. ` +
    `Rather than experiencing these as separate parts of yourself, their themes are likely woven together in a way that feels instinctive and natural to you.`;
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
    description = 'No natal retrogrades — your planetary energies tend to express outwardly and directly. You may find it natural to externalize your thoughts, desires, and experiences without needing extended periods of private processing first.';
  } else if (names.length === 1) {
    description = `You were born with ${names[0]} retrograde — this planet's energy turns inward, asking you to develop a more personal, reflective relationship with its themes before expressing them outwardly. ` +
      getRetrogradeFlavor(names[0]);
  } else if (names.length <= 3) {
    description = `${names.join(' and ')} were retrograde at birth. ` +
      `These areas of your life may develop on a more reflective, internal timeline — you process their themes privately before sharing them with the world. This isn't a limitation; it's depth. You develop genuine understanding rather than surface-level familiarity.`;
  } else {
    description = `${names.length} planets were retrograde at birth (${names.join(', ')}). ` +
      `You carry a rich and complex inner world — much of your most important work happens beneath the surface, through reflection, private processing, and developing your own relationship with experience before expressing it outwardly. Others may underestimate the depth of what's happening inside you.`;
  }

  return { planets: names, count: names.length, description };
}

function getRetrogradeFlavor(planet: string): string {
  const flavors: Record<string, string> = {
    Mercury: 'Your mind works in a more internal, contemplative way — you may process thoughts deeply before speaking, rethink past conversations, and develop insights through private reflection rather than real-time discussion. Your inner dialogue is rich, and your best ideas often emerge after careful consideration.',
    Venus: 'Your relationship with love, beauty, and self-worth develops privately — you may take longer to open up emotionally, but when you do, the connection runs deep. Past relationships and unresolved feelings may resurface periodically as part of your ongoing process of understanding what you truly value.',
    Mars: 'Your drive and assertiveness work in less obvious ways — rather than charging forward, you build momentum internally and act with deliberate intention. You may feel frustrated when pushed to act before you\'re ready, but when you do move, it comes from a grounded, purposeful place.',
    Jupiter: 'Your relationship with growth and meaning is deeply personal — you may develop your own philosophy of life through quiet reflection rather than external seeking. Spiritual or intellectual expansion happens on an inward journey, and your sense of faith or optimism is earned through lived experience.',
    Saturn: 'You may have developed your own internal standards and sense of discipline independently of external authority. Structure and responsibility are things you define on your own terms, and you may have felt the weight of maturity early in life — building resilience that others develop much later.',
    Uranus: 'Your sense of individuality and need for freedom process quietly — you may rethink societal norms, question inherited beliefs, and develop your own unconventional perspective privately before expressing it. Your independence is deeply considered, not reactive.',
    Neptune: 'Your creative and spiritual life may be profoundly interior — rich with imagination, dreams, and intuitive knowing that doesn\'t always translate easily into words. You may feel things on a level that\'s hard to share with others, and your inner world may be more vivid and meaningful than your outer circumstances suggest.',
    Pluto: 'Transformation happens at a deep, private level for you — you process power dynamics, emotional intensity, and personal evolution internally. You may have a quiet resilience that others don\'t see, and your ability to regenerate from difficult experiences is a significant but often invisible strength.',
  };
  return flavors[planet] || '';
}

// ══════════════════════════════════════════════════
// 5. ELEMENT BALANCE
// ══════════════════════════════════════════════════

function analyzeElementBalance(chart: NatalChart): ElementBalance {
  const planets = getCorePlanets(chart);
  const counts: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const scores: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };

  for (const p of planets) {
    if (p.sign?.element) {
      counts[p.sign.element]++;
      const name = p.planet.name;
      const weight = ['Sun', 'Moon'].includes(name) ? 3 : 
                     ['Mercury', 'Venus', 'Mars'].includes(name) ? 2 : 1;
      scores[p.sign.element] += weight;
    }
  }

  if (chart.ascendant?.sign?.element) scores[chart.ascendant.sign.element] += 3;
  if (chart.midheaven?.sign?.element) scores[chart.midheaven.sign.element] += 2;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const dominant = sorted[0][0];
  const missing = Object.keys(counts).find(el => counts[el] === 0);

  let description = getElementDescription(dominant, counts[dominant]);
  if (missing) {
    description += ` Notably, ${missing} is absent from your chart — ${getMissingElementNote(missing)}`;
  }

  return { dominant, counts, description, missing };
}

function getElementDescription(element: string, count: number): string {
  const descriptions: Record<string, string> = {
    Fire: `Fire is your chart's dominant element — action, self-expression, and forward momentum are central to how you experience life. You naturally lead with enthusiasm, inspiration, and a willingness to take risks. There's an instinctive confidence in you that draws others in and sets things in motion. You come alive through creative expression, spontaneous action, and the freedom to follow what excites you.`,
    Earth: `Earth is your chart's dominant element — practicality, reliability, and tangible results are deeply important to you. You have a natural ability to build things that endure, whether that's a career, a relationship, or a sense of inner stability. Your presence is grounding, and others may rely on your steadiness more than you realize. You find meaning in what you can see, touch, and sustain over time.`,
    Air: `Air is your chart's dominant element — ideas, communication, and social connection are the currents that energize your life. Your mind is one of your most powerful tools, and you may process experience primarily through thinking, talking, and making intellectual connections. You have a natural gift for seeing things from multiple perspectives and translating complex ideas into something others can understand.`,
    Water: `Water is your chart's dominant element — emotional depth, intuition, and empathy run through everything you do. You feel your way through experience with a sensitivity that most people don't fully see. Your inner world is rich and nuanced, and your ability to read emotional undercurrents — in yourself and others — is a form of intelligence that shapes your relationships, creativity, and sense of meaning.`,
  };
  return descriptions[element] || '';
}

function getMissingElementNote(element: string): string {
  const notes: Record<string, string> = {
    Fire: 'spontaneity, bold self-assertion, and raw enthusiasm may not come as naturally — but this doesn\'t mean they\'re absent. You develop these qualities in your own way and on your own timeline, often with more intention and depth than those who rely on them instinctively.',
    Earth: 'grounding routines, long-term planning, and practical follow-through may require more conscious effort — but this is a growth edge, not a flaw. You may find alternative ways to create stability that are uniquely your own.',
    Air: 'intellectual distance and objective analysis may not be your default mode — you tend to process through other channels first, like emotion, intuition, or direct experience. This gives your understanding a different kind of depth.',
    Water: 'emotional vulnerability and intuitive processing may operate more quietly or privately. This doesn\'t mean you lack depth — rather, your emotional life may express through action, thought, or practical care rather than overt feeling.',
  };
  return notes[element] || '';
}

// ══════════════════════════════════════════════════
// 6. MODALITY BALANCE
// ══════════════════════════════════════════════════

function analyzeModalityBalance(chart: NatalChart): ModalityBalance {
  const planets = getCorePlanets(chart);
  const counts: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  const scores: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };

  for (const p of planets) {
    if (p.sign?.modality) {
      counts[p.sign.modality]++;
      const name = p.planet.name;
      const weight = ['Sun', 'Moon'].includes(name) ? 3 : 
                     ['Mercury', 'Venus', 'Mars'].includes(name) ? 2 : 1;
      scores[p.sign.modality] += weight;
    }
  }

  if (chart.ascendant?.sign?.modality) scores[chart.ascendant.sign.modality] += 3;
  if (chart.midheaven?.sign?.modality) scores[chart.midheaven.sign.modality] += 2;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const dominant = sorted[0][0];

  const descriptions: Record<string, string> = {
    Cardinal: `Cardinal energy dominates your chart (${counts.Cardinal} planets) — you are a natural initiator. You feel most alive at the beginning of new chapters, when there's a vision to set in motion and a direction to claim. Starting things, setting the tone, and leading by example come instinctively to you. Others may look to you to make the first move, and you're often the one who turns an idea into something real.`,
    Fixed: `Fixed energy dominates your chart (${counts.Fixed} planets) — you are a natural sustainer. Once you commit to something, you hold steady with a quiet determination that few can match. Loyalty, persistence, and depth of focus are your strengths. While others may shift directions with changing winds, you have the rare ability to stay the course and see things through to completion — building something of lasting value.`,
    Mutable: `Mutable energy dominates your chart (${counts.Mutable} planets) — you are a natural adapter. Flexibility, versatility, and the ability to read a room and adjust come naturally to you. You thrive in changing environments and can hold multiple perspectives at once without losing your footing. Where others may resist change, you flow with it — finding creative solutions and new possibilities in every shift.`,
  };

  return { dominant, counts, description: descriptions[dominant] || '' };
}

// ══════════════════════════════════════════════════
// 7. POLARITY BALANCE
// ══════════════════════════════════════════════════

function analyzePolarityBalance(chart: NatalChart): PolarityBalance {
  const planets = getCorePlanets(chart);
  let masculine = 0;
  let feminine = 0;

  for (const p of planets) {
    const el = p.sign?.element;
    if (el === 'Fire' || el === 'Air') masculine++;
    else if (el === 'Earth' || el === 'Water') feminine++;
  }

  const diff = masculine - feminine;
  const dominant: PolarityBalance['dominant'] =
    Math.abs(diff) <= 1 ? 'Balanced' : diff > 0 ? 'Masculine' : 'Feminine';

  const descriptions: Record<PolarityBalance['dominant'], string> = {
    Masculine: `Your chart leans toward masculine (Fire + Air) energy — you tend to express yourself outwardly through action, ideas, and direct engagement with the world. Initiative and social connection come naturally; stillness and inward processing may require more intention.`,
    Feminine: `Your chart leans toward feminine (Earth + Water) energy — you process experience deeply before acting, and you tend to build meaning from the inside out. Receptivity, depth, and attunement to subtle currents are natural strengths.`,
    Balanced: `Your chart has a relatively balanced mix of masculine (Fire + Air) and feminine (Earth + Water) energy — you can move between outward expression and inward reflection, between action and receptivity, depending on what the moment calls for.`,
  };

  return { masculine, feminine, dominant, description: descriptions[dominant] };
}

// ══════════════════════════════════════════════════
// 8. DOMINANT FACTORS
// ══════════════════════════════════════════════════

function detectDominantFactors(chart: NatalChart): DominantFactors {
  const planets = getCorePlanets(chart);

  // ── Dominant planet: most aspected, with angular bonus ──
  const aspectCounts = new Map<string, number>();
  for (const p of planets) aspectCounts.set(p.planet.name, 0);

  for (const aspect of chart.aspects ?? []) {
    const n1 = aspect.planet1?.name;
    const n2 = aspect.planet2?.name;
    if (n1 && aspectCounts.has(n1)) aspectCounts.set(n1, (aspectCounts.get(n1) ?? 0) + 1);
    if (n2 && aspectCounts.has(n2)) aspectCounts.set(n2, (aspectCounts.get(n2) ?? 0) + 1);
  }

  // Angular houses (1, 4, 7, 10) get a +2 bonus
  const ANGULAR = new Set([1, 4, 7, 10]);
  const scores = new Map<string, number>();
  for (const p of planets) {
    const base = aspectCounts.get(p.planet.name) ?? 0;
    const bonus = p.house && ANGULAR.has(p.house) ? 2 : 0;
    scores.set(p.planet.name, base + bonus);
  }
  const dominantPlanet = [...scores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Sun';

  // ── Dominant sign: personal planets (Sun–Mars) = 2pts, outer = 1pt ──
  const PERSONAL_WEIGHT: Record<string, number> = {
    Sun: 2, Moon: 2, Mercury: 2, Venus: 2, Mars: 2,
  };
  const signScores = new Map<string, number>();
  for (const p of planets) {
    const signName = typeof p.sign === 'string' ? p.sign : p.sign?.name ?? '';
    if (!signName) continue;
    const weight = PERSONAL_WEIGHT[p.planet.name] ?? 1;
    signScores.set(signName, (signScores.get(signName) ?? 0) + weight);
  }
  const dominantSign = [...signScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  // ── Dominant house: most planets ──
  const houseCounts = new Map<number, number>();
  for (const p of planets) {
    if (!p.house) continue;
    houseCounts.set(p.house, (houseCounts.get(p.house) ?? 0) + 1);
  }
  const dominantHouseEntry = [...houseCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const dominantHouse = dominantHouseEntry?.[1] >= 2 ? dominantHouseEntry[0] : null;

  const PLANET_DESC: Record<string, string> = {
    Sun: 'The Sun\'s dominance suggests identity, self-expression, and creative purpose are central themes in your chart.',
    Moon: 'A dominant Moon points to emotional life, instinct, and nurturing as recurring undercurrents in your story.',
    Mercury: 'Mercury\'s prominence indicates that communication, learning, and mental agility shape much of your experience.',
    Venus: 'Venus dominance suggests that relationships, aesthetics, and what you value are recurring focal points.',
    Mars: 'A dominant Mars points to drive, assertion, and direct action as primary engines in your life.',
    Jupiter: 'Jupiter\'s emphasis points to growth, meaning-making, and expansive vision as guiding forces.',
    Saturn: 'A dominant Saturn suggests structure, responsibility, and earned mastery are significant themes.',
    Uranus: 'Uranus dominance points to independence, disruption of norms, and original thinking as underlying currents.',
    Neptune: 'Neptune\'s prominence suggests idealism, imagination, and spiritual sensitivity run through the chart.',
    Pluto: 'A dominant Pluto indicates themes of transformation, depth, and power dynamics woven through your story.',
  };

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  };

  return {
    planet: dominantPlanet,
    sign: dominantSign,
    house: dominantHouse,
    descriptions: {
      planet: PLANET_DESC[dominantPlanet] ?? `${dominantPlanet} is the most emphasized planet in your chart.`,
      sign: dominantSign
        ? `${dominantSign} carries the most weight in your chart — its themes and qualities color many of your core planets.`
        : '',
      house: dominantHouse
        ? `The ${ordinal(dominantHouse)} house is your most populated life area, concentrating planetary energy around its themes.`
        : '',
    },
  };
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
    polarityBalance: analyzePolarityBalance(chart),
    dominantFactors: detectDominantFactors(chart),
  };
}
