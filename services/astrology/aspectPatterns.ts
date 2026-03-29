// File: services/astrology/aspectPatterns.ts
// Detects notable aspect patterns: Grand Trine, T-Square, Grand Cross,
// Kite, Yod, Mystic Rectangle, and hemisphere emphasis.

import { NatalChart, PlanetPlacement } from './types';

// ── Types ──

export interface AspectPattern {
  name: string;
  planets: string[];
  description: string;
}

export interface HemisphereEmphasis {
  eastern: number;   // Houses 10, 11, 12, 1, 2, 3
  western: number;   // Houses 4, 5, 6, 7, 8, 9
  northern: number;  // Houses 1, 2, 3, 4, 5, 6 (below horizon)
  southern: number;  // Houses 7, 8, 9, 10, 11, 12 (above horizon)
  dominant: string;
  description: string;
}

export interface HouseEmphasis {
  angularCount: number;   // Houses 1, 4, 7, 10
  succedentCount: number; // Houses 2, 5, 8, 11
  cadentCount: number;    // Houses 3, 6, 9, 12
  dominant: string;
  description: string;
}

export interface ExtendedPatterns {
  aspectPatterns: AspectPattern[];
  hemisphereEmphasis: HemisphereEmphasis | null;
  houseEmphasis: HouseEmphasis | null;
}

// ── Helpers ──

function getCorePlanets(chart: NatalChart): PlanetPlacement[] {
  return [
    chart.sun, chart.moon, chart.mercury, chart.venus, chart.mars,
    chart.jupiter, chart.saturn, chart.uranus, chart.neptune, chart.pluto,
  ].filter(Boolean);
}

function angularDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function isAspect(lon1: number, lon2: number, targetAngle: number, orb: number): boolean {
  return angularDiff(lon1, lon2) <= targetAngle + orb &&
         angularDiff(lon1, lon2) >= targetAngle - orb;
}

// ── Aspect Pattern Detection ──

function detectAspectPatterns(chart: NatalChart): AspectPattern[] {
  const planets = getCorePlanets(chart);
  const patterns: AspectPattern[] = [];
  const ORB_TRINE = 8;
  const ORB_OPPOSITION = 8;
  const ORB_SQUARE = 7;
  const ORB_SEXTILE = 5;
  const ORB_QUINCUNX = 3;

  // Grand Trine: three planets each ~120° apart
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (!isAspect(planets[i].longitude, planets[j].longitude, 120, ORB_TRINE)) continue;
      for (let k = j + 1; k < planets.length; k++) {
        if (isAspect(planets[j].longitude, planets[k].longitude, 120, ORB_TRINE) &&
            isAspect(planets[i].longitude, planets[k].longitude, 120, ORB_TRINE)) {
          const names = [planets[i].planet.name, planets[j].planet.name, planets[k].planet.name];
          const element = planets[i].sign.element;
          patterns.push({
            name: 'Grand Trine',
            planets: names,
            description: `${names.join(', ')} form a Grand Trine in ${element} signs — a flowing circuit of natural talent and ease. This pattern suggests an area where things come together almost effortlessly, though the ease itself can become a comfort zone. The invitation is to actively channel this gift rather than passively rely on it.`,
          });
        }
      }
    }
  }

  // T-Square: two planets in opposition with a third squaring both
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (!isAspect(planets[i].longitude, planets[j].longitude, 180, ORB_OPPOSITION)) continue;
      for (let k = 0; k < planets.length; k++) {
        if (k === i || k === j) continue;
        if (isAspect(planets[k].longitude, planets[i].longitude, 90, ORB_SQUARE) &&
            isAspect(planets[k].longitude, planets[j].longitude, 90, ORB_SQUARE)) {
          const names = [planets[i].planet.name, planets[j].planet.name, planets[k].planet.name];
          const apex = planets[k].planet.name;
          patterns.push({
            name: 'T-Square',
            planets: names,
            description: `${names.join(', ')} form a T-Square with ${apex} at the apex — a dynamic tension pattern that drives action and growth. The opposition creates ongoing tension, and the apex planet becomes the pressure point where that energy must be expressed. This pattern produces determination and the ability to accomplish a great deal through sustained effort.`,
          });
        }
      }
    }
  }

  // Grand Cross: four planets forming two oppositions and four squares
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (!isAspect(planets[i].longitude, planets[j].longitude, 180, ORB_OPPOSITION)) continue;
      for (let k = j + 1; k < planets.length; k++) {
        if (!isAspect(planets[i].longitude, planets[k].longitude, 90, ORB_SQUARE)) continue;
        for (let l = k + 1; l < planets.length; l++) {
          if (isAspect(planets[k].longitude, planets[l].longitude, 180, ORB_OPPOSITION) &&
              isAspect(planets[i].longitude, planets[l].longitude, 90, ORB_SQUARE) &&
              isAspect(planets[j].longitude, planets[k].longitude, 90, ORB_SQUARE) &&
              isAspect(planets[j].longitude, planets[l].longitude, 90, ORB_SQUARE)) {
            const names = [planets[i].planet.name, planets[j].planet.name, planets[k].planet.name, planets[l].planet.name];
            patterns.push({
              name: 'Grand Cross',
              planets: names,
              description: `${names.join(', ')} form a Grand Cross — the most intense aspect pattern, creating pressure from all four cardinal points. This produces tremendous drive and the capacity to handle complexity, but can also feel like being pulled in multiple directions at once. The key is learning to integrate all four energies rather than choosing between them.`,
            });
          }
        }
      }
    }
  }

  // Yod (Finger of God): two planets sextile each other, both quincunx a third
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (!isAspect(planets[i].longitude, planets[j].longitude, 60, ORB_SEXTILE)) continue;
      for (let k = 0; k < planets.length; k++) {
        if (k === i || k === j) continue;
        if (isAspect(planets[k].longitude, planets[i].longitude, 150, ORB_QUINCUNX) &&
            isAspect(planets[k].longitude, planets[j].longitude, 150, ORB_QUINCUNX)) {
          const names = [planets[i].planet.name, planets[j].planet.name, planets[k].planet.name];
          const apex = planets[k].planet.name;
          patterns.push({
            name: 'Yod',
            planets: names,
            description: `${names.join(', ')} form a Yod (Finger of God) pointing at ${apex} — a rare configuration suggesting a fated quality or sense of mission connected to the apex planet. The two sextile planets channel their combined energy toward the apex in a way that can feel like a compulsion or calling. This pattern often unfolds over time, with its significance becoming clearer through life experience.`,
          });
        }
      }
    }
  }

  // Kite: Grand Trine + one planet opposite a trine planet and sextile the other two
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (!isAspect(planets[i].longitude, planets[j].longitude, 120, ORB_TRINE)) continue;
      for (let k = j + 1; k < planets.length; k++) {
        if (!isAspect(planets[j].longitude, planets[k].longitude, 120, ORB_TRINE) ||
            !isAspect(planets[i].longitude, planets[k].longitude, 120, ORB_TRINE)) continue;
        // Found a Grand Trine (i,j,k) — look for kite apex
        for (let l = 0; l < planets.length; l++) {
          if (l === i || l === j || l === k) continue;
          // Apex opposes one trine planet and sextiles the other two
          const trineGroup = [planets[i], planets[j], planets[k]];
          for (const opposed of trineGroup) {
            if (!isAspect(planets[l].longitude, opposed.longitude, 180, ORB_OPPOSITION)) continue;
            const others = trineGroup.filter(p => p !== opposed);
            if (isAspect(planets[l].longitude, others[0].longitude, 60, ORB_SEXTILE) &&
                isAspect(planets[l].longitude, others[1].longitude, 60, ORB_SEXTILE)) {
              const names = [planets[i].planet.name, planets[j].planet.name, planets[k].planet.name, planets[l].planet.name];
              patterns.push({
                name: 'Kite',
                planets: names,
                description: `${names.join(', ')} form a Kite — a Grand Trine activated by an opposition that adds direction and purpose. Where a Grand Trine can be passive, the Kite gives it a focal point. ${planets[l].planet.name} acts as the driving force, channeling the natural flow of the trine into productive expression.`,
              });
            }
          }
        }
      }
    }
  }

  // Mystic Rectangle: two oppositions connected by sextiles and trines
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      if (!isAspect(planets[i].longitude, planets[j].longitude, 180, ORB_OPPOSITION)) continue;
      for (let k = j + 1; k < planets.length; k++) {
        if (!isAspect(planets[i].longitude, planets[k].longitude, 60, ORB_SEXTILE) &&
            !isAspect(planets[i].longitude, planets[k].longitude, 120, ORB_TRINE)) continue;
        for (let l = k + 1; l < planets.length; l++) {
          if (!isAspect(planets[k].longitude, planets[l].longitude, 180, ORB_OPPOSITION)) continue;
          // Check that the rectangle closes with sextile/trine connections
          const hasCross1 = isAspect(planets[i].longitude, planets[k].longitude, 60, ORB_SEXTILE) ||
                            isAspect(planets[i].longitude, planets[k].longitude, 120, ORB_TRINE);
          const hasCross2 = isAspect(planets[j].longitude, planets[l].longitude, 60, ORB_SEXTILE) ||
                            isAspect(planets[j].longitude, planets[l].longitude, 120, ORB_TRINE);
          const hasCross3 = isAspect(planets[i].longitude, planets[l].longitude, 60, ORB_SEXTILE) ||
                            isAspect(planets[i].longitude, planets[l].longitude, 120, ORB_TRINE);
          const hasCross4 = isAspect(planets[j].longitude, planets[k].longitude, 60, ORB_SEXTILE) ||
                            isAspect(planets[j].longitude, planets[k].longitude, 120, ORB_TRINE);
          if ((hasCross1 && hasCross2) || (hasCross3 && hasCross4)) {
            const names = [planets[i].planet.name, planets[j].planet.name, planets[k].planet.name, planets[l].planet.name];
            patterns.push({
              name: 'Mystic Rectangle',
              planets: names,
              description: `${names.join(', ')} form a Mystic Rectangle — a balanced configuration that combines the tension of two oppositions with the flow of trines and sextiles. This pattern suggests an ability to work with opposing forces productively, finding creative solutions that honor both sides. It often correlates with practical wisdom and emotional equilibrium.`,
            });
          }
        }
      }
    }
  }

  // Deduplicate by pattern name + sorted planet set
  const seen = new Set<string>();
  return patterns.filter(p => {
    const key = p.name + ':' + [...p.planets].sort().join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Hemisphere Emphasis ──

function analyzeHemisphereEmphasis(chart: NatalChart): HemisphereEmphasis | null {
  const planets = getCorePlanets(chart);
  if (planets.some(p => !p.house)) return null;

  const EASTERN = new Set([10, 11, 12, 1, 2, 3]);
  const NORTHERN = new Set([1, 2, 3, 4, 5, 6]);

  let eastern = 0, western = 0, northern = 0, southern = 0;
  for (const p of planets) {
    if (EASTERN.has(p.house)) eastern++; else western++;
    if (NORTHERN.has(p.house)) northern++; else southern++;
  }

  const total = planets.length;
  const threshold = Math.ceil(total * 0.6);

  let dominant = '';
  let description = '';

  if (eastern >= threshold && northern >= threshold) {
    dominant = 'Eastern–Northern';
    description = 'Most of your planets fall in the eastern and northern hemispheres — self-motivated action and private development are central themes. You tend to initiate from within and process experience personally before sharing.';
  } else if (eastern >= threshold && southern >= threshold) {
    dominant = 'Eastern–Southern';
    description = 'Most of your planets fall in the eastern and southern hemispheres — you combine self-direction with public engagement. You may naturally take the lead in visible, outward-facing roles.';
  } else if (western >= threshold && northern >= threshold) {
    dominant = 'Western–Northern';
    description = 'Most of your planets fall in the western and northern hemispheres — you develop through relationships and private reflection. Others play a significant role in your growth, and much of your processing happens internally.';
  } else if (western >= threshold && southern >= threshold) {
    dominant = 'Western–Southern';
    description = 'Most of your planets fall in the western and southern hemispheres — partnership and public life are central themes. You grow through connection with others and may find your purpose through collaborative or community-facing work.';
  } else if (eastern >= threshold) {
    dominant = 'Eastern';
    description = 'Most of your planets fall in the eastern hemisphere — you are naturally self-directed and tend to initiate your own path. Personal agency, independence, and self-determination are recurring themes.';
  } else if (western >= threshold) {
    dominant = 'Western';
    description = 'Most of your planets fall in the western hemisphere — growth comes through relationships and responding to others. Partnership, collaboration, and interpersonal dynamics are central to your development.';
  } else if (northern >= threshold) {
    dominant = 'Northern';
    description = 'Most of your planets fall in the northern hemisphere (below the horizon) — your inner world, private life, and personal foundations carry the most weight. Development happens inwardly before it shows externally.';
  } else if (southern >= threshold) {
    dominant = 'Southern';
    description = 'Most of your planets fall in the southern hemisphere (above the horizon) — public life, career, and social contribution are prominent themes. Your development becomes visible to the world.';
  } else {
    dominant = 'Balanced';
    description = 'Your planets are relatively evenly distributed across the hemispheres — you draw from both inner and outer resources, both self-direction and relationship. No single hemisphere dominates.';
  }

  return { eastern, western, northern, southern, dominant, description };
}

// ── House Type Emphasis ──

function analyzeHouseEmphasis(chart: NatalChart): HouseEmphasis | null {
  const planets = getCorePlanets(chart);
  if (planets.some(p => !p.house)) return null;

  const ANGULAR = new Set([1, 4, 7, 10]);
  const SUCCEDENT = new Set([2, 5, 8, 11]);

  let angularCount = 0, succedentCount = 0, cadentCount = 0;
  for (const p of planets) {
    if (ANGULAR.has(p.house)) angularCount++;
    else if (SUCCEDENT.has(p.house)) succedentCount++;
    else cadentCount++;
  }

  const max = Math.max(angularCount, succedentCount, cadentCount);
  let dominant: string;
  let description: string;

  if (angularCount === max) {
    dominant = 'Angular';
    description = `Angular houses (1st, 4th, 7th, 10th) carry the most weight in your chart — you express planetary energy through direct action, visible initiative, and engagement with the world's turning points. Identity, home, relationships, and career are active arenas.`;
  } else if (succedentCount === max) {
    dominant = 'Succedent';
    description = `Succedent houses (2nd, 5th, 8th, 11th) carry the most weight in your chart — you build and sustain what the angular houses initiate. Resources, creativity, shared depth, and community are where your energy concentrates.`;
  } else {
    dominant = 'Cadent';
    description = `Cadent houses (3rd, 6th, 9th, 12th) carry the most weight in your chart — learning, service, meaning-making, and inner work are central themes. You may process experience through reflection, analysis, and adaptation.`;
  }

  return { angularCount, succedentCount, cadentCount, dominant, description };
}

// ── Main Export ──

export function detectExtendedPatterns(chart: NatalChart): ExtendedPatterns {
  return {
    aspectPatterns: detectAspectPatterns(chart),
    hemisphereEmphasis: analyzeHemisphereEmphasis(chart),
    houseEmphasis: analyzeHouseEmphasis(chart),
  };
}
