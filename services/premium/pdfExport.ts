// File: services/premium/pdfExport.ts
// Generates and shares a PDF natal chart report via expo-print + expo-sharing.

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { NatalChart, Aspect } from '../astrology/types';
import { GeneratedChapter } from './fullNatalStory';
import { applyStoryLabels } from '../../constants/storyLabels';

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

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildPdfHtml(chart: NatalChart, chapters: GeneratedChapter[]): string {
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
  const sensitivePoints: Array<{ label: string; sign: string; degree: number; minute: number; house?: number; retrograde: boolean }> = [];
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
    const title = esc(applyStoryLabels(ch.title));
    const subtitle = ch.subtitle ? `<p class="chapter-subtitle">${esc(applyStoryLabels(ch.subtitle))}</p>` : '';
    const content = esc(applyStoryLabels(ch.content)).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
    const reflection = esc(applyStoryLabels(ch.reflection)).replace(/\n/g, '<br>');
    const affirmation = esc(applyStoryLabels(ch.affirmation));

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

<h2 class="chapters-header">Your Themes</h2>
${chapterHtml}

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
  chapters: GeneratedChapter[],
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
