// File: services/premium/pdfExport.ts
// Generates and shares a PDF natal chart report via expo-print + expo-sharing.

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { NatalChart, Aspect } from '../astrology/types';
import { GeneratedChapter } from './fullNatalStory';

// ─── Symbol maps ──────────────────────────────────────────────────────────────

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
};

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

// Traditional planet ordering for the table
const PLANET_ORDER = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function withSign(name: string): string {
  const sym = SIGN_SYMBOLS[name];
  return sym ? `${sym} ${name}` : name;
}

function withPlanet(name: string): string {
  const sym = PLANET_SYMBOLS[name];
  return sym ? `${sym} ${name}` : name;
}

function degMin(deg: number, min: number): string {
  return `${deg}° ${String(min).padStart(2, '0')}'`;
}

// ─── SVG Natal Chart ──────────────────────────────────────────────────────────

const SIGN_OFFSETS_SVG: Record<string, number> = {
  Aries: 0, Taurus: 30, Gemini: 60, Cancer: 90, Leo: 120, Virgo: 150,
  Libra: 180, Scorpio: 210, Sagittarius: 240, Capricorn: 270, Aquarius: 300, Pisces: 330,
};
const SIGN_SYMS_SVG = ['♈\uFE0E','♉\uFE0E','♊\uFE0E','♋\uFE0E','♌\uFE0E','♍\uFE0E','♎\uFE0E','♏\uFE0E','♐\uFE0E','♑\uFE0E','♒\uFE0E','♓\uFE0E'];
const ELEMENT_FILLS_SVG = [
  'rgba(200,80,60,0.22)',   // Aries   — Fire
  'rgba(90,160,90,0.20)',   // Taurus  — Earth
  'rgba(70,150,210,0.20)',  // Gemini  — Air
  'rgba(70,120,200,0.22)',  // Cancer  — Water
  'rgba(210,100,50,0.22)',  // Leo     — Fire
  'rgba(110,170,90,0.20)',  // Virgo   — Earth
  'rgba(90,170,210,0.20)',  // Libra   — Air
  'rgba(100,60,180,0.22)',  // Scorpio — Water
  'rgba(200,110,50,0.22)',  // Sagittarius — Fire
  'rgba(130,160,110,0.20)', // Capricorn   — Earth
  'rgba(70,180,210,0.20)',  // Aquarius    — Air
  'rgba(80,110,200,0.22)',  // Pisces      — Water
];
// Planet symbols for HTML/WebKit context — append \uFE0E to prevent emoji rendering
const PLANET_SVG_SYMS: Record<string, string> = {
  Sun: '☉\uFE0E', Moon: '☽\uFE0E', Mercury: '☿\uFE0E', Venus: '♀\uFE0E', Mars: '♂\uFE0E',
  Jupiter: '♃\uFE0E', Saturn: '♄\uFE0E', Uranus: '♅\uFE0E', Neptune: '♆\uFE0E', Pluto: '♇\uFE0E',
  'North Node': '☊\uFE0E', 'South Node': '☋\uFE0E',
  Chiron: 'Ch', Lilith: 'Li', 'Part of Fortune': '⊗\uFE0E', Pholus: 'Ph',
};
const ASPECT_SVG_COLORS: Record<string, { line: string; glow: string }> = {
  Harmonious: { line: 'rgba(170,210,185,0.55)', glow: 'rgba(170,210,185,0.18)' },
  Challenging: { line: 'rgba(210,170,160,0.55)', glow: 'rgba(210,170,160,0.18)' },
  Neutral: { line: 'rgba(203,184,146,0.55)', glow: 'rgba(203,184,146,0.18)' },
};

// ── Planet collision avoidance for SVG chart ──
function spreadPlanetsSvg(
  items: { name: string; lon: number }[],
  minSepDeg: number = 8,
): { name: string; lon: number; displayDeg: number; lane: number }[] {
  const sorted = [...items].sort((a, b) => a.lon - b.lon);
  const result = sorted.map(p => ({ ...p, displayDeg: p.lon, lane: 0 }));

  // Group nearby planets into clusters
  const clusters: number[][] = [];
  let current: number[] = [];
  for (let i = 0; i < result.length; i++) {
    if (current.length === 0) { current.push(i); continue; }
    const prev = result[current[current.length - 1]];
    let gap = result[i].lon - prev.lon;
    if (gap < 0) gap += 360;
    if (gap <= minSepDeg) { current.push(i); }
    else { clusters.push(current); current = [i]; }
  }
  if (current.length > 0) clusters.push(current);

  // Merge first+last cluster if they wrap around 360
  if (clusters.length > 1) {
    const first = result[clusters[0][0]];
    const last = result[clusters[clusters.length - 1][clusters[clusters.length - 1].length - 1]];
    let wrapGap = (first.lon + 360) - last.lon;
    if (wrapGap <= minSepDeg) {
      clusters[0] = [...clusters[clusters.length - 1], ...clusters[0]];
      clusters.pop();
    }
  }

  const lanePattern = [0, -1, 1, -2, 2];
  for (const cluster of clusters) {
    if (cluster.length <= 1) continue;
    for (let i = 0; i < cluster.length; i++) {
      result[cluster[i]].lane = lanePattern[i % lanePattern.length] ?? 0;
    }
  }
  return result;
}

function buildChartSvg(chart: NatalChart): string {
  const S = 480;
  const CX = S / 2, CY = S / 2;
  const R_RIM = 218;   // outer metallic rim
  const R_OUT = 208;    // outer edge of zodiac band
  const R_ZOD = 182;    // inner edge of zodiac band
  const R_PLN = 146;    // planet glyph ring
  const R_ASP = 110;    // aspect lines bound to this radius
  const R_INN = 70;     // inner circle
  const R_DOT1 = R_PLN - 16;  // dotted reference ring 1
  const R_DOT2 = R_ASP + 8;   // dotted reference ring 2
  const LANE_STEP = 14; // radial offset per collision lane

  // ASC longitude: prefer chart.ascendant (same source as Skia), fall back to house 1 cusp
  const ascLon =
    (chart.ascendant as any)?.longitude ??
    chart.houseCusps?.find(c => c.house === 1)?.longitude ??
    chart.houseCusps?.[0]?.longitude ?? 0;
  const hasHouses = (chart.houseCusps?.length ?? 0) >= 12;

  /** Map ecliptic longitude → SVG angle (degrees). ASC sits at 9 o'clock. */
  function toSvgDeg(lon: number): number {
    const d = ((lon - ascLon) % 360 + 360) % 360;
    return ((180 - d) % 360 + 360) % 360;
  }
  function pol(deg: number, r: number): { x: string; y: string } {
    const rad = (deg * Math.PI) / 180;
    return { x: (CX + r * Math.cos(rad)).toFixed(1), y: (CY + r * Math.sin(rad)).toFixed(1) };
  }
  /** Get precise longitude from a PlanetPlacement. Uses the direct longitude
   *  field for full floating-point accuracy instead of reconstructing from
   *  sign + degree + minute (which rounds to arcminutes). */
  function getLon(p: any): number {
    // Prefer the precise longitude field (PlanetPlacement.longitude: 0–360)
    if (typeof p.longitude === 'number' && Number.isFinite(p.longitude)) {
      return ((p.longitude % 360) + 360) % 360;
    }
    // Fallback: reconstruct from sign + degree + minute
    return (SIGN_OFFSETS_SVG[p.sign?.name] ?? 0) + (p.degree ?? 0) + (p.minute ?? 0) / 60;
  }

  let o = '';

  // ── SVG Definitions (gradients, filters) ──
  o += `<defs>`;
  // Metallic rim sweep gradient (simulated with a rotated linear gradient)
  o += `<radialGradient id="rimGlow" cx="50%" cy="50%" r="50%">
    <stop offset="92%" stop-color="transparent"/>
    <stop offset="96%" stop-color="rgba(232,214,174,0.12)"/>
    <stop offset="100%" stop-color="transparent"/>
  </radialGradient>`;
  // Glow filter for aspect lines
  o += `<filter id="aspectGlow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="1.5"/>
  </filter>`;
  // Dotted line pattern
  o += `</defs>`;

  // ── Background ──
  o += `<circle cx="${CX}" cy="${CY}" r="${R_RIM + 4}" fill="#0D1421"/>`;

  // ── Outer metallic rim ──
  // Underglow
  o += `<circle cx="${CX}" cy="${CY}" r="${R_RIM + 2}" fill="none" stroke="rgba(232,214,174,0.15)" stroke-width="6" opacity="0.5"/>`;
  // Main rim - outer edge
  o += `<circle cx="${CX}" cy="${CY}" r="${R_RIM}" fill="none" stroke="rgba(212,175,55,0.55)" stroke-width="1.5"/>`;
  // Inner edge of rim
  o += `<circle cx="${CX}" cy="${CY}" r="${R_OUT + 2}" fill="none" stroke="rgba(212,175,55,0.35)" stroke-width="0.8"/>`;
  // Rim fill band
  for (let a = 0; a < 360; a += 3) {
    const rad = (a * Math.PI) / 180;
    // Simulated sweep gradient: brightness varies around the circle
    const brightness = 0.15 + 0.2 * Math.sin(rad * 2.7 + 0.5) + 0.1 * Math.cos(rad * 1.3 - 0.8);
    const alpha = Math.max(0.05, Math.min(0.4, brightness)).toFixed(2);
    const p1 = pol(a, R_OUT + 2);
    const p2 = pol(a, R_RIM);
    o += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="rgba(212,175,55,${alpha})" stroke-width="3.5"/>`;
  }
  // Specular highlight arc (upper-left catchlight)
  const specStart = pol(200, R_RIM - 1);
  const specEnd = pol(240, R_RIM - 1);
  o += `<path d="M ${specStart.x} ${specStart.y} A ${R_RIM - 1} ${R_RIM - 1} 0 0 0 ${specEnd.x} ${specEnd.y}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-linecap="round"/>`;

  // ── Zodiac segments (12 × 30°) ──
  for (let i = 0; i < 12; i++) {
    const startDeg = toSvgDeg(i * 30);
    const endDeg   = toSvgDeg((i + 1) * 30);
    const oS = pol(startDeg, R_OUT), oE = pol(endDeg, R_OUT);
    const iE = pol(endDeg, R_ZOD), iS = pol(startDeg, R_ZOD);
    o += `<path d="M ${oS.x} ${oS.y} A ${R_OUT} ${R_OUT} 0 0 0 ${oE.x} ${oE.y} L ${iE.x} ${iE.y} A ${R_ZOD} ${R_ZOD} 0 0 1 ${iS.x} ${iS.y} Z" fill="${ELEMENT_FILLS_SVG[i]}"/>`;
    // Separator line
    o += `<line x1="${oS.x}" y1="${oS.y}" x2="${iS.x}" y2="${iS.y}" stroke="rgba(232,214,174,0.18)" stroke-width="0.6"/>`;
    // Sign glyph
    const mp = pol(toSvgDeg(i * 30 + 15), (R_OUT + R_ZOD) / 2);
    o += `<text x="${mp.x}" y="${mp.y}" text-anchor="middle" dominant-baseline="central" font-size="13" fill="rgba(240,234,214,0.82)" font-family="Apple Symbols,Segoe UI Symbol,Noto Sans Symbols2,serif">${SIGN_SYMS_SVG[i]}</text>`;
  }

  // ── Rim circles ──
  o += `<circle cx="${CX}" cy="${CY}" r="${R_OUT}" fill="none" stroke="rgba(212,175,55,0.45)" stroke-width="1.2"/>`;
  o += `<circle cx="${CX}" cy="${CY}" r="${R_ZOD}" fill="none" stroke="rgba(232,214,174,0.2)" stroke-width="0.6"/>`;

  // ── Dotted reference rings ──
  o += `<circle cx="${CX}" cy="${CY}" r="${R_DOT1}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.6" stroke-dasharray="1.5 7"/>`;
  o += `<circle cx="${CX}" cy="${CY}" r="${R_DOT2}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.6" stroke-dasharray="1.5 7"/>`;

  // ── House cusp lines + house numbers ──
  if (hasHouses) {
    chart.houseCusps!.forEach((cusp) => {
      const houseNum = cusp.house;
      const svgDeg = toSvgDeg(cusp.longitude);
      const angular = [1, 4, 7, 10].includes(houseNum);
      const outerP = pol(svgDeg, R_ZOD - 1);
      const innerP = pol(svgDeg, R_INN);
      o += `<line x1="${outerP.x}" y1="${outerP.y}" x2="${innerP.x}" y2="${innerP.y}" stroke="${angular ? 'rgba(232,214,174,0.65)' : 'rgba(232,214,174,0.2)'}" stroke-width="${angular ? 1.2 : 0.5}"/>`;
      // House number at midpoint between this cusp and next
      const nextHouseNum = (houseNum % 12) + 1;
      const nextCusp = chart.houseCusps!.find(c => c.house === nextHouseNum);
      let midLon = cusp.longitude + 15; // fallback
      if (nextCusp) {
        let span = nextCusp.longitude - cusp.longitude;
        if (span < 0) span += 360;
        midLon = cusp.longitude + span / 2;
        if (midLon >= 360) midLon -= 360;
      }
      const numR = (R_ZOD + R_PLN) / 2 + 2;
      const numP = pol(toSvgDeg(midLon), numR);
      o += `<text x="${numP.x}" y="${numP.y}" text-anchor="middle" dominant-baseline="central" font-size="8" fill="rgba(240,234,214,0.4)" font-family="sans-serif">${houseNum}</text>`;
    });
  }

  // ── Aspect lines (glow + line) ──
  chart.aspects?.slice(0, 80).forEach(a => {
    const p1 = chart.placements.find(p => p.planet.name === a.planet1.name);
    const p2 = chart.placements.find(p => p.planet.name === a.planet2.name);
    if (!p1 || !p2) return;
    const pt1 = pol(toSvgDeg(getLon(p1)), R_ASP);
    const pt2 = pol(toSvgDeg(getLon(p2)), R_ASP);
    const colors = ASPECT_SVG_COLORS[a.type.nature] ?? { line: 'rgba(150,150,150,0.4)', glow: 'rgba(150,150,150,0.12)' };
    // Glow layer
    o += `<line x1="${pt1.x}" y1="${pt1.y}" x2="${pt2.x}" y2="${pt2.y}" stroke="${colors.glow}" stroke-width="2.5" filter="url(#aspectGlow)"/>`;
    // Main line
    const orb = a.orb ?? 99;
    const sw = orb < 3 ? 0.9 : 0.55;
    o += `<line x1="${pt1.x}" y1="${pt1.y}" x2="${pt2.x}" y2="${pt2.y}" stroke="${colors.line}" stroke-width="${sw}"/>`;
  });

  // ── Inner circle ──
  o += `<circle cx="${CX}" cy="${CY}" r="${R_INN}" fill="#080F1C" stroke="rgba(232,214,174,0.12)" stroke-width="0.6"/>`;
  // Planet ring guide
  o += `<circle cx="${CX}" cy="${CY}" r="${R_PLN}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>`;

  // ── Planet glyphs with collision avoidance ──
  const planetItems = chart.placements.map(p => ({
    name: p.planet.name,
    lon: getLon(p),
    placement: p,
  }));
  const spread = spreadPlanetsSvg(
    planetItems.map(p => ({ name: p.name, lon: p.lon })),
    9,
  );
  const placementMap = new Map(planetItems.map(p => [p.name, p.placement]));

  spread.forEach(sp => {
    const p = placementMap.get(sp.name);
    if (!p) return;
    const svgDeg = toSvgDeg(sp.lon);
    const radialR = R_PLN + sp.lane * LANE_STEP;
    const pos = pol(svgDeg, radialR);
    const tick1 = pol(svgDeg, R_ZOD - 3);
    const tick2 = pol(svgDeg, R_PLN + 16);
    o += `<line x1="${tick1.x}" y1="${tick1.y}" x2="${tick2.x}" y2="${tick2.y}" stroke="rgba(232,214,174,0.2)" stroke-width="0.5"/>`;
    const sym = esc(PLANET_SVG_SYMS[p.planet.name] ?? p.planet.name.substring(0, 2));
    const isAbbrev = !PLANET_SVG_SYMS[p.planet.name] || sym.length > 2;
    const col = p.planet.type === 'Luminary' ? '#D8C39A' : 'rgba(212,175,55,0.9)';
    const fam = isAbbrev ? 'sans-serif' : 'Apple Symbols,Segoe UI Symbol,Noto Sans Symbols2,serif';
    // Small sphere background for major planets
    const isMajor = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'].includes(p.planet.name);
    if (isMajor) {
      o += `<circle cx="${pos.x}" cy="${pos.y}" r="10" fill="rgba(30,45,71,0.7)" stroke="rgba(232,214,174,0.25)" stroke-width="0.6"/>`;
    }
    o += `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" font-size="${isAbbrev ? 7.5 : 11}" fill="${col}" font-family="${fam}">${sym}</text>`;
    // Retrograde indicator
    if (p.isRetrograde) {
      const rx = (parseFloat(pos.x) + 8).toFixed(1);
      const ry = (parseFloat(pos.y) - 7).toFixed(1);
      o += `<text x="${rx}" y="${ry}" text-anchor="middle" dominant-baseline="central" font-size="5.5" fill="rgba(212,175,55,0.7)" font-style="italic" font-family="sans-serif">R</text>`;
    }
  });

  // ── ASC label ──
  const ascDeg = toSvgDeg(ascLon);
  const ascP = pol(ascDeg, R_ZOD - 12);
  o += `<text x="${ascP.x}" y="${ascP.y}" text-anchor="middle" dominant-baseline="central" font-size="7.5" fill="rgba(232,214,174,0.9)" font-weight="bold" font-family="sans-serif">AC</text>`;

  // ── MC label (house 10 cusp) ──
  const mcCusp = chart.houseCusps?.find(c => c.house === 10);
  if (mcCusp) {
    const mcP = pol(toSvgDeg(mcCusp.longitude), R_ZOD - 12);
    o += `<text x="${mcP.x}" y="${mcP.y}" text-anchor="middle" dominant-baseline="central" font-size="7.5" fill="rgba(232,214,174,0.9)" font-weight="bold" font-family="sans-serif">MC</text>`;
  }

  // ── DC label (house 7 cusp) ──
  const dcCusp = chart.houseCusps?.find(c => c.house === 7);
  if (dcCusp) {
    const dcP = pol(toSvgDeg(dcCusp.longitude), R_ZOD - 12);
    o += `<text x="${dcP.x}" y="${dcP.y}" text-anchor="middle" dominant-baseline="central" font-size="7.5" fill="rgba(232,214,174,0.65)" font-weight="bold" font-family="sans-serif">DC</text>`;
  }

  // ── IC label (house 4 cusp) ──
  const icCusp = chart.houseCusps?.find(c => c.house === 4);
  if (icCusp) {
    const icP = pol(toSvgDeg(icCusp.longitude), R_ZOD - 12);
    o += `<text x="${icP.x}" y="${icP.y}" text-anchor="middle" dominant-baseline="central" font-size="7.5" fill="rgba(232,214,174,0.65)" font-weight="bold" font-family="sans-serif">IC</text>`;
  }

  return `<svg viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;max-width:100%;height:auto;">${o}</svg>`;
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildPdfHtml(chart: NatalChart, chapters: GeneratedChapter[] = []): string {
  const { birthData, sunSign, moonSign, risingSign, placements, houseCusps, aspects } = chart;

  const birthTime = birthData.hasUnknownTime ? 'Unknown' : (birthData.time ?? 'Unknown');
  const chartName = chart.name ?? 'Your Chart';


  // Planets table — traditional order
  const sortedPlacements = [...placements].sort((a, b) => {
    const ai = PLANET_ORDER.indexOf(a.planet.name);
    const bi = PLANET_ORDER.indexOf(b.planet.name);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const planetRows = sortedPlacements.map(p => `
    <tr>
      <td>${esc(withPlanet(p.planet.name))}</td>
      <td>${esc(withSign(p.sign.name))}</td>
      <td>${degMin(p.degree, p.minute)}</td>
      <td>${p.house > 0 ? String(p.house) : '—'}</td>
      <td class="rx">${p.isRetrograde ? 'Rx' : '—'}</td>
    </tr>`).join('');

  // Sensitive Points (Lilith, Vertex, Part of Fortune, Pholus, Chiron, Nodes)
  const sensitivePoints: { label: string; sign: string; degree: number; minute: number; house?: number; retrograde: boolean }[] = [];
  // Helper to add a point
  function addPoint(label: string, sign: string, degree: number, minute: number, house: number | undefined, retrograde: boolean) {
    sensitivePoints.push({ label, sign, degree, minute, house, retrograde });
  }
  // From planets array
  if (Array.isArray(chart.planets)) {
    for (const p of chart.planets as any[]) {
      const name = String(p.planet).toLowerCase();
      const sign = String(p.sign);
      const degree = Math.floor(Number(p.degree ?? 0));
      const minute = Math.round((Number(p.degree ?? 0) - degree) * 60);
      const house = typeof p.house === 'number' ? p.house : undefined;
      const retrograde = Boolean(p.isRetrograde);
      if (name === 'chiron') {
        addPoint('Chiron', sign, degree, minute, house, retrograde);
      } else if (name === 'north node' || name === 'northnode' || name === 'true node') {
        addPoint('North Node', sign, degree, minute, house, retrograde);
      } else if (name === 'south node' || name === 'southnode') {
        addPoint('South Node', sign, degree, minute, house, retrograde);
      } else if (name === 'lilith' || name === 'black moon lilith') {
        addPoint('Lilith', sign, degree, minute, house, retrograde);
      } else if (name === 'pholus') {
        addPoint('Pholus', sign, degree, minute, house, retrograde);
      }
    }
  }
  // Vertex (from angles)
  if (Array.isArray(chart.angles)) {
    for (const angle of chart.angles) {
      if (angle.name === 'Vertex') {
        const sign = String(angle.sign);
        const degree = Math.floor(Number(angle.degree ?? 0));
        const minute = Math.round((Number(angle.degree ?? 0) - degree) * 60);
        addPoint('Vertex', sign, degree, minute, undefined, false);
      }
    }
  }
  // Part of Fortune (from partOfFortune field)
  if (chart.partOfFortune) {
    const pf = chart.partOfFortune;
    addPoint('Part of Fortune', String(pf.sign?.name ?? pf.sign), pf.degree, pf.minute, pf.house, false);
  }
  // Order: North Node, South Node, Chiron, Lilith, Vertex, Part of Fortune, Pholus
  const order: Record<string, number> = {
    'North Node': 0,
    'South Node': 1,
    'Chiron': 2,
    'Lilith': 3,
    'Vertex': 4,
    'Part of Fortune': 5,
    'Pholus': 6,
  };
  sensitivePoints.sort((a, b) => (order[a.label] ?? 99) - (order[b.label] ?? 99));

  let sensitiveSection = '';
  if (sensitivePoints.length > 0) {
    const rows = sensitivePoints.map(pt => `
      <tr>
        <td>${esc(pt.label)}</td>
        <td>${esc(withSign(pt.sign))}</td>
        <td>${degMin(pt.degree, pt.minute)}</td>
        <td>${pt.house ? pt.house : '—'}</td>
        <td class="rx">${pt.retrograde ? 'Rx' : '—'}</td>
      </tr>`).join('');
    sensitiveSection = `
      <div class="section">
        <h2 class="section-title">Sensitive Points</h2>
        <table>
          <thead><tr><th>Point</th><th>Sign</th><th>Degree</th><th>House</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // House cusps — only when birth time is known
  let houseSection = '';
  if (!birthData.hasUnknownTime && houseCusps.length > 0) {
    const houseRows = houseCusps.map(h => {
      const deg = Math.floor(h.longitude % 30);
      const min = Math.round((h.longitude % 30 - deg) * 60);
      return `
    <tr>
      <td>${h.house}</td>
      <td>${esc(withSign(h.sign.name))}</td>
      <td>${deg}° ${String(min).padStart(2, '0')}'</td>
    </tr>`;
    }).join('');

    houseSection = `
  <div class="section">
    <h2 class="section-title">House Cusps</h2>
    <table>
      <thead><tr><th>House</th><th>Sign</th><th>Degree</th></tr></thead>
      <tbody>${houseRows}
      </tbody>
    </table>
  </div>`;
  }

  // Aspects grouped by nature
  function aspectRows(list: Aspect[]): string {
    return list.map(a => `
    <tr>
      <td>${esc(withPlanet(a.planet1.name))}</td>
      <td class="aspect-sym">${esc(a.type.symbol)} <span class="aspect-name">${esc(a.type.name)}</span></td>
      <td>${esc(withPlanet(a.planet2.name))}</td>
      <td>${a.orb.toFixed(1)}°</td>
    </tr>`).join('');
  }

  const harmonious = aspects.filter(a => a.type.nature === 'Harmonious');
  const challenging = aspects.filter(a => a.type.nature === 'Challenging');
  const neutral = aspects.filter(a => a.type.nature === 'Neutral');

  let aspectsContent = '';
  if (harmonious.length > 0) {
    aspectsContent += `
    <h3 class="aspect-group harmonious">Harmonious</h3>
    <table><thead><tr><th>Planet</th><th>Aspect</th><th>Planet</th><th>Orb</th></tr></thead>
    <tbody>${aspectRows(harmonious)}</tbody></table>`;
  }
  if (challenging.length > 0) {
    aspectsContent += `
    <h3 class="aspect-group challenging">Challenging</h3>
    <table><thead><tr><th>Planet</th><th>Aspect</th><th>Planet</th><th>Orb</th></tr></thead>
    <tbody>${aspectRows(challenging)}</tbody></table>`;
  }
  if (neutral.length > 0) {
    aspectsContent += `
    <h3 class="aspect-group neutral">Neutral</h3>
    <table><thead><tr><th>Planet</th><th>Aspect</th><th>Planet</th><th>Orb</th></tr></thead>
    <tbody>${aspectRows(neutral)}</tbody></table>`;
  }
  if (!aspectsContent) {
    aspectsContent = '<p class="empty-note">No aspects calculated.</p>';
  }

  // Rising sign display
  const risingDisplay = risingSign
    ? withSign(risingSign.name)
    : (chart.ascendant ? withSign(chart.ascendant.sign.name) : 'Unknown');

  const sunHouse = chart.sun?.house;
  const moonHouse = chart.moon?.house;

  // Story chapters
  const chapterHtml = chapters.map((ch, i) => {
    const title = esc(ch.title);
    const subtitle = ch.subtitle ? `<p class="chapter-subtitle">${esc(ch.subtitle)}</p>` : '';
    const content = esc(ch.content).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    const reflection = esc(ch.reflection).replace(/\n/g, '<br>');
    const affirmation = esc(ch.affirmation);

    const astrologyLabel = ch.astrologyLabel ? `<p class="chapter-astro">${esc(ch.astrologyLabel)}</p>` : '';

    return `
  <div class="chapter">
    <p class="chapter-num">Chapter ${i + 1}</p>
    <h2 class="chapter-title">${title}</h2>
    ${astrologyLabel}
    ${subtitle}
    <div class="chapter-content"><p>${content}</p></div>
    <div class="chapter-reflection">
      <span class="block-label">Reflection</span>
      <p>${reflection}</p>
    </div>
    <div class="chapter-affirmation">
      <span class="block-label">Affirmation</span>
      <p class="affirmation-text">${affirmation}</p>
    </div>
  </div>`;
  }).join('');

  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(chartName)} — MySky</title>
<style>
* { 
  margin: 0; 
  padding: 0; 
  box-sizing: border-box; 
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Starfield background ── */
body {
  font-family: Georgia, 'Times New Roman', serif;
  background: #0D1421;
  color: #FFFFFF;
  padding: 0;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
  min-height: 100vh;
}
.star-layer {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(1.2px 1.2px at 12% 8%, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 25% 18%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1.5px 1.5px at 42% 5%, rgba(255,255,255,0.7), transparent),
    radial-gradient(1px 1px at 58% 22%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1.3px 1.3px at 73% 12%, rgba(255,255,255,0.65), transparent),
    radial-gradient(1px 1px at 88% 6%, rgba(255,255,255,0.55), transparent),
    radial-gradient(1.1px 1.1px at 95% 20%, rgba(255,255,255,0.7), transparent),
    radial-gradient(1px 1px at 8% 35%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1.4px 1.4px at 33% 42%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 50% 38%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1.2px 1.2px at 67% 45%, rgba(255,255,255,0.55), transparent),
    radial-gradient(1px 1px at 82% 32%, rgba(255,255,255,0.65), transparent),
    radial-gradient(1.3px 1.3px at 15% 55%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 28% 62%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1.5px 1.5px at 45% 58%, rgba(212, 175, 55,0.5), transparent),
    radial-gradient(1px 1px at 62% 65%, rgba(255,255,255,0.45), transparent),
    radial-gradient(1.1px 1.1px at 78% 52%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 92% 60%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1.2px 1.2px at 5% 75%, rgba(255,255,255,0.55), transparent),
    radial-gradient(1px 1px at 20% 82%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1.4px 1.4px at 38% 78%, rgba(255,255,255,0.65), transparent),
    radial-gradient(1px 1px at 55% 85%, rgba(212, 175, 55,0.45), transparent),
    radial-gradient(1.3px 1.3px at 70% 72%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 85% 80%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1.1px 1.1px at 10% 92%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 30% 95%, rgba(255,255,255,0.55), transparent),
    radial-gradient(1.5px 1.5px at 48% 90%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 65% 97%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1.2px 1.2px at 80% 88%, rgba(255,255,255,0.55), transparent),
    radial-gradient(1px 1px at 93% 94%, rgba(255,255,255,0.5), transparent);
}
.content-wrap {
  position: relative;
  z-index: 1;
  padding: 40px 48px;
}

/* ── Cover ── */
.cover {
  text-align: center;
  padding: 56px 0 48px;
  border-bottom: 1px solid rgba(212, 175, 55,0.25);
  margin-bottom: 48px;
}
.app-name {
  font-size: 11px;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: rgba(212, 175, 55,0.65);
  margin-bottom: 28px;
}
.cover-title {
  font-size: 34px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}
.cover-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  font-style: italic;
  margin-bottom: 32px;
}
.birth-card {
  display: inline-block;
  border: 1px solid rgba(212, 175, 55,0.2);
  border-radius: 12px;
  padding: 18px 32px;
  background: rgba(30,45,71,0.6);
  text-align: left;
}
.birth-row { display: flex; gap: 20px; margin-bottom: 5px; }
.birth-row:last-child { margin-bottom: 0; }
.birth-label {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(212, 175, 55,0.55);
  width: 52px;
  flex-shrink: 0;
  padding-top: 1px;
}
.birth-value { font-size: 13px; color: rgba(255,255,255,0.7); }

/* ── Big Three ── */
.big-three {
  display: flex;
  gap: 14px;
  margin-bottom: 48px;
}
.big-three-card {
  flex: 1;
  text-align: center;
  border: 1px solid rgba(212, 175, 55,0.18);
  border-radius: 10px;
  padding: 18px 10px;
  background: rgba(30,45,71,0.5);
}
.bt-label {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(212, 175, 55,0.55);
  margin-bottom: 8px;
}
.bt-sign {
  font-size: 18px;
  color: #D8C39A;
  margin-bottom: 4px;
}
.bt-house {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
}

/* ── Sections ── */
.section { margin-bottom: 40px; }
.chart-section { page-break-inside: avoid; }
.chart-wrap {
  text-align: center;
  max-width: 440px;
  margin: 0 auto;
}
.chart-wrap svg { display: block; margin: 0 auto; max-width: 100%; height: auto; }
.section-title {
  font-size: 17px;
  font-weight: 600;
  color: #D8C39A;
  letter-spacing: 0.3px;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(212, 175, 55,0.15);
}

/* ── Tables ── */
table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead tr { background: rgba(26,39,64,0.7); }
th {
  text-align: left;
  padding: 7px 11px;
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(212, 175, 55,0.6);
  font-weight: 400;
}
td {
  padding: 7px 11px;
  color: rgba(255,255,255,0.7);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
tr:last-child td { border-bottom: none; }
.rx { color: rgba(212, 175, 55,0.7); font-style: italic; }

/* ── Aspects ── */
.aspect-group {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  margin: 18px 0 8px;
}
.aspect-group.harmonious { color: #6EBF8B; }
.aspect-group.challenging { color: #E07A7A; }
.aspect-group.neutral { color: #8BC4E8; }
.aspect-sym { font-size: 15px; }
.aspect-name { font-size: 12px; color: rgba(255,255,255,0.5); }
.empty-note { color: rgba(255,255,255,0.35); font-style: italic; font-size: 13px; }

/* ── Chapters ── */
.chapters-header {
  font-size: 22px;
  font-weight: 700;
  color: #D8C39A;
  text-align: center;
  margin: 48px 0 32px;
  letter-spacing: 0.3px;
}
.chapter {
  margin-bottom: 40px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.chapter:last-child { border-bottom: none; }
.chapter-num {
  font-size: 10px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: rgba(212, 175, 55,0.5);
  margin-bottom: 6px;
}
.chapter-title {
  font-size: 21px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 4px;
  letter-spacing: 0.2px;
}
.chapter-astro {
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(212, 175, 55,0.6);
  margin-bottom: 10px;
}
.chapter-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  font-style: italic;
  margin-bottom: 14px;
}
.chapter-content {
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255,255,255,0.7);
  margin-bottom: 20px;
}
.chapter-reflection {
  background: rgba(30,45,71,0.5);
  border-left: 2px solid rgba(212, 175, 55,0.35);
  border-radius: 0 8px 8px 0;
  padding: 13px 15px;
  margin-bottom: 12px;
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  line-height: 1.7;
}
.chapter-affirmation {
  text-align: center;
  padding: 10px 12px;
}
.block-label {
  display: block;
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(212, 175, 55,0.5);
  margin-bottom: 5px;
}
.affirmation-text {
  font-style: italic;
  color: #D8C39A;
  font-size: 14px;
}

/* ── Footer ── */
.footer {
  text-align: center;
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 11px;
  color: rgba(255,255,255,0.25);
  letter-spacing: 1px;
}
</style>
</head>
<body>

<div class="star-layer"></div>
<div class="content-wrap">

<div class="cover">
  <p class="app-name">MySky</p>
  <h1 class="cover-title">${esc(chartName)}</h1>
  <p class="cover-subtitle">Personal Framework &middot; Natal Analysis</p>
  <div class="birth-card">
    <div class="birth-row">
      <span class="birth-label">Date</span>
      <span class="birth-value">${esc(birthData.date)}</span>
    </div>
    <div class="birth-row">
      <span class="birth-label">Time</span>
      <span class="birth-value">${esc(birthTime)}</span>
    </div>
    <div class="birth-row">
      <span class="birth-label">Place</span>
      <span class="birth-value">${esc(birthData.place)}</span>
    </div>
    ${birthData.timezone ? `<div class="birth-row">
      <span class="birth-label">Zone</span>
      <span class="birth-value">${esc(birthData.timezone)}</span>
    </div>` : ''}
  </div>
</div>

<div class="big-three">
  <div class="big-three-card">
    <p class="bt-label">Sun</p>
    <p class="bt-sign">${esc(withSign(sunSign.name))}</p>
    ${sunHouse ? `<p class="bt-house">House ${sunHouse}</p>` : ''}
  </div>
  <div class="big-three-card">
    <p class="bt-label">Moon</p>
    <p class="bt-sign">${esc(withSign(moonSign.name))}</p>
    ${moonHouse ? `<p class="bt-house">House ${moonHouse}</p>` : ''}
  </div>
  <div class="big-three-card">
    <p class="bt-label">Rising</p>
    <p class="bt-sign">${esc(risingDisplay)}</p>
    ${birthData.hasUnknownTime ? '<p class="bt-house">birth time needed</p>' : ''}
  </div>
</div>


<div class="section chart-section">
  <h2 class="section-title">Natal Chart</h2>
  <div class="chart-wrap">${buildChartSvg(chart)}</div>
</div>

<div class="section">
  <h2 class="section-title">Planetary Placements</h2>
  <table>
    <thead>
      <tr><th>Planet</th><th>Sign</th><th>Degree</th><th>House</th><th></th></tr>
    </thead>
    <tbody>${planetRows}
    </tbody>
  </table>
</div>

${sensitiveSection}

${houseSection}

<div class="section">
  <h2 class="section-title">Aspects</h2>
  ${aspectsContent}
</div>

${chapters.length > 0 ? `<h2 class="chapters-header">Your Themes</h2>
${chapterHtml}` : ''}

<div class="footer">
  <p>Generated by MySky &middot; ${generatedDate}</p>
</div>

</div><!-- /content-wrap -->
</body>
</html>`;
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Renders the natal chart and story chapters to a PDF and opens
 * the native share sheet so the user can save or send the file.
 */
export async function exportChartToPdf(
  chart: NatalChart,
  chapters: GeneratedChapter[] = [],
): Promise<void> {
  const html = buildPdfHtml(chart, chapters);

  // Render HTML → PDF in the system temp directory
  const { uri: tmpUri } = await Print.printToFileAsync({ html, base64: false });

  // Copy to cache before sharing (some share destinations need a stable path)
  const safeName = (chart.name ?? 'MySky').replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'MySky';
  const destUri = `${FileSystem.cacheDirectory}${safeName}_MySky.pdf`;

  await FileSystem.copyAsync({ from: tmpUri, to: destUri });
  await FileSystem.deleteAsync(tmpUri, { idempotent: true });

  await Sharing.shareAsync(destUri, {
    mimeType: 'application/pdf',
    dialogTitle: `${chart.name ?? 'MySky'} — Personal Framework`,
    UTI: 'com.adobe.pdf',
  });

  // Best-effort cleanup after share sheet dismisses
  await FileSystem.deleteAsync(destUri, { idempotent: true });
}
