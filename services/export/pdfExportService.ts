/**
 * PDF Export Service
 *
 * Generates a beautifully styled PDF of the user's natal chart data
 * and cosmic story, matching MySky's celestial theme.
 */

import { NatalChart, Aspect } from '../astrology/types';
import { FullNatalStory, GeneratedChapter } from '../premium/fullNatalStory';

// ── HTML helpers ──────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}

function formatDegree(degree: number, minute?: number): string {
  const deg = Math.floor(degree);
  const min = minute ?? Math.round((degree - deg) * 60);
  return `${deg}°${min.toString().padStart(2, '0')}'`;
}

// ── Section builders ──────────────────────────────────────────

function buildCoverPage(chart: NatalChart, chartName?: string): string {
  const name = chartName || chart.name || 'My Natal Chart';
  const birthDate = chart.birthData.date;
  const birthTime = chart.birthData.hasUnknownTime
    ? 'Unknown'
    : chart.birthData.time || 'Unknown';
  const birthPlace = chart.birthData.place;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <div class="cover">
      <div class="cover-symbol">☽</div>
      <h1 class="cover-title">${escapeHtml(name)}</h1>
      <p class="cover-subtitle">Natal Chart & Cosmic Story</p>
      <div class="cover-details">
        <p><span class="label">Born:</span> ${escapeHtml(birthDate)}</p>
        <p><span class="label">Time:</span> ${escapeHtml(birthTime)}</p>
        <p><span class="label">Place:</span> ${escapeHtml(birthPlace)}</p>
      </div>
      <p class="cover-generated">Generated ${generatedDate} by MySky</p>
    </div>
  `;
}

function buildBigThree(chart: NatalChart): string {
  const sun = chart.sunSign?.name || chart.sun?.sign?.name || '—';
  const moon = chart.moonSign?.name || chart.moon?.sign?.name || '—';
  const rising = chart.risingSign?.name || chart.ascendant?.sign?.name || null;

  return `
    <div class="section">
      <h2 class="section-title">Your Big Three</h2>
      <div class="big-three-grid">
        <div class="big-three-card">
          <div class="bt-icon">☉</div>
          <div class="bt-label">Sun</div>
          <div class="bt-sign">${escapeHtml(sun)}</div>
        </div>
        <div class="big-three-card">
          <div class="bt-icon">☽</div>
          <div class="bt-label">Moon</div>
          <div class="bt-sign">${escapeHtml(moon)}</div>
        </div>
        ${rising ? `
        <div class="big-three-card">
          <div class="bt-icon">↑</div>
          <div class="bt-label">Rising</div>
          <div class="bt-sign">${escapeHtml(rising)}</div>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

function buildPlanetTable(chart: NatalChart): string {
  const planets = [
    { label: 'Sun', symbol: '☉', placement: chart.sun },
    { label: 'Moon', symbol: '☽', placement: chart.moon },
    { label: 'Mercury', symbol: '☿', placement: chart.mercury },
    { label: 'Venus', symbol: '♀', placement: chart.venus },
    { label: 'Mars', symbol: '♂', placement: chart.mars },
    { label: 'Jupiter', symbol: '♃', placement: chart.jupiter },
    { label: 'Saturn', symbol: '♄', placement: chart.saturn },
    { label: 'Uranus', symbol: '♅', placement: chart.uranus },
    { label: 'Neptune', symbol: '♆', placement: chart.neptune },
    { label: 'Pluto', symbol: '♇', placement: chart.pluto },
  ];

  const rows = planets
    .filter(p => p.placement)
    .map(p => {
      const pl = p.placement;
      const signName = typeof pl.sign === 'string' ? pl.sign : pl.sign?.name || '—';
      return `
        <tr>
          <td>${p.symbol} ${p.label}</td>
          <td>${signName}</td>
          <td>${formatDegree(pl.degree, pl.minute)}</td>
          <td>${pl.house || '—'}</td>
          <td>${pl.isRetrograde ? '℞' : ''}</td>
        </tr>
      `;
    })
    .join('');

  // Add Ascendant and Midheaven if available
  const extras: string[] = [];
  if (chart.ascendant) {
    const ascSign = typeof chart.ascendant.sign === 'string' ? chart.ascendant.sign : chart.ascendant.sign?.name || '—';
    extras.push(`
      <tr>
        <td>↑ Ascendant</td>
        <td>${ascSign}</td>
        <td>${formatDegree(chart.ascendant.degree, chart.ascendant.minute)}</td>
        <td>1</td>
        <td></td>
      </tr>
    `);
  }
  if (chart.midheaven) {
    const mcSign = typeof chart.midheaven.sign === 'string' ? chart.midheaven.sign : chart.midheaven.sign?.name || '—';
    extras.push(`
      <tr>
        <td>MC Midheaven</td>
        <td>${mcSign}</td>
        <td>${formatDegree(chart.midheaven.degree, chart.midheaven.minute)}</td>
        <td>10</td>
        <td></td>
      </tr>
    `);
  }

  return `
    <div class="section">
      <h2 class="section-title">Planet Placements</h2>
      <table>
        <thead>
          <tr>
            <th>Planet</th>
            <th>Sign</th>
            <th>Degree</th>
            <th>House</th>
            <th>Rx</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          ${extras.join('')}
        </tbody>
      </table>
    </div>
  `;
}

function buildHouseTable(chart: NatalChart): string {
  const cusps = chart.houseCusps;
  if (!cusps || cusps.length === 0) return '';

  const rows = cusps
    .map(c => {
      const signName = typeof c.sign === 'string' ? c.sign : c.sign?.name || '—';
      const deg = typeof c.longitude === 'number' ? formatDegree(c.longitude % 30) : '—';
      return `
      <tr>
        <td>House ${c.house}</td>
        <td>${signName}</td>
        <td>${deg}</td>
      </tr>
    `;
    })
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">House Cusps</h2>
      <table>
        <thead>
          <tr>
            <th>House</th>
            <th>Sign</th>
            <th>Degree</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildAspects(chart: NatalChart): string {
  const aspects = chart.aspects;
  if (!aspects || aspects.length === 0) return '';

  // Group by aspect type
  const grouped: Record<string, Aspect[]> = {};
  for (const asp of aspects) {
    const key = asp.type?.name || 'Other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(asp);
  }

  const order = ['Conjunction', 'Trine', 'Sextile', 'Square', 'Opposition'];
  const sortedKeys = Object.keys(grouped).sort(
    (a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
  );

  const sections = sortedKeys.map(key => {
    const items = grouped[key]
      .sort((a, b) => a.orb - b.orb)
      .map(
        asp =>
          `<div class="aspect-row">
            <span class="aspect-planets">${asp.planet1?.name || '?'} ${asp.type?.symbol || '—'} ${asp.planet2?.name || '?'}</span>
            <span class="aspect-orb">${asp.orb.toFixed(1)}° orb</span>
          </div>`
      )
      .join('');
    return `
      <div class="aspect-group">
        <h3 class="aspect-type">${escapeHtml(key)}</h3>
        ${items}
      </div>
    `;
  });

  return `
    <div class="section">
      <h2 class="section-title">Aspects</h2>
      ${sections.join('')}
    </div>
  `;
}

function buildStoryChapters(story: FullNatalStory, isPremium: boolean): string {
  const chapters = story.chapters
    .filter((ch: GeneratedChapter) => !ch.isPremium || isPremium)
    .map((ch: GeneratedChapter) => `
      <div class="chapter">
        <h2 class="chapter-title">${escapeHtml(ch.title)}</h2>
        <p class="chapter-subtitle">${escapeHtml(ch.subtitle)}</p>
        <div class="chapter-body">${escapeHtml(ch.content)}</div>
        ${ch.reflection ? `<div class="chapter-reflection"><span class="reflection-label">Reflection:</span> ${escapeHtml(ch.reflection)}</div>` : ''}
        ${ch.affirmation ? `<div class="chapter-affirmation">"${escapeHtml(ch.affirmation)}"</div>` : ''}
      </div>
    `)
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">Your Cosmic Story</h2>
      ${chapters}
    </div>
  `;
}

// ── Main HTML builder ─────────────────────────────────────────

function generatePdfHtml(
  chart: NatalChart,
  story: FullNatalStory,
  isPremium: boolean,
  chartName?: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 40px 36px; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      background-color: #0D1421;
      color: #FFFFFF;
      font-size: 13px;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Cover */
    .cover {
      text-align: center;
      padding: 80px 20px 60px;
      page-break-after: always;
    }
    .cover-symbol { font-size: 64px; margin-bottom: 24px; color: #C9A962; }
    .cover-title { font-size: 36px; font-weight: 700; color: #FFFFFF; margin-bottom: 8px; }
    .cover-subtitle { font-size: 18px; color: #C9A962; font-style: italic; margin-bottom: 40px; }
    .cover-details { margin-bottom: 40px; }
    .cover-details p { font-size: 15px; color: rgba(255,255,255,0.8); margin: 6px 0; }
    .cover-details .label { color: #C9A962; font-weight: 600; }
    .cover-generated { font-size: 12px; color: rgba(255,255,255,0.4); }

    /* Section */
    .section { margin-bottom: 32px; }
    .section-title {
      font-size: 22px;
      font-weight: 700;
      color: #C9A962;
      border-bottom: 1px solid rgba(201,169,98,0.3);
      padding-bottom: 8px;
      margin-bottom: 16px;
    }

    /* Big Three */
    .big-three-grid { display: flex; gap: 16px; justify-content: center; }
    .big-three-card {
      background: rgba(30,45,71,0.6);
      border: 1px solid rgba(201,169,98,0.2);
      border-radius: 12px;
      padding: 20px 28px;
      text-align: center;
      flex: 1;
      max-width: 180px;
    }
    .bt-icon { font-size: 28px; color: #C9A962; margin-bottom: 6px; }
    .bt-label { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .bt-sign { font-size: 18px; font-weight: 600; color: #FFFFFF; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead th {
      text-align: left;
      font-size: 11px;
      color: #C9A962;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 8px 10px;
      border-bottom: 1px solid rgba(201,169,98,0.3);
    }
    tbody td {
      padding: 8px 10px;
      font-size: 13px;
      color: rgba(255,255,255,0.85);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    tbody tr:last-child td { border-bottom: none; }

    /* Aspects */
    .aspect-group { margin-bottom: 14px; }
    .aspect-type { font-size: 15px; font-weight: 600; color: #E0C88A; margin-bottom: 6px; }
    .aspect-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .aspect-planets { color: rgba(255,255,255,0.85); }
    .aspect-orb { color: rgba(255,255,255,0.5); font-size: 12px; }

    /* Chapters */
    .chapter {
      margin-bottom: 28px;
      padding: 20px;
      background: rgba(26,39,64,0.5);
      border: 1px solid rgba(201,169,98,0.15);
      border-radius: 12px;
      page-break-inside: avoid;
    }
    .chapter-title { font-size: 18px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px; }
    .chapter-subtitle { font-size: 13px; color: #C9A962; font-style: italic; margin-bottom: 12px; }
    .chapter-body { font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.7; margin-bottom: 12px; }
    .chapter-reflection {
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      border-left: 2px solid rgba(201,169,98,0.4);
      padding-left: 12px;
      margin-bottom: 8px;
    }
    .reflection-label { color: #C9A962; font-weight: 600; }
    .chapter-affirmation {
      font-size: 13px;
      color: #C9A962;
      font-style: italic;
      text-align: center;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  ${buildCoverPage(chart, chartName)}
  ${buildBigThree(chart)}
  ${buildPlanetTable(chart)}
  ${buildHouseTable(chart)}
  ${buildAspects(chart)}
  ${buildStoryChapters(story, isPremium)}
</body>
</html>`;
}

// ── Public API ─────────────────────────────────────────────────

export async function exportChartAsPdf(
  chart: NatalChart,
  story: FullNatalStory,
  isPremium: boolean,
  chartName?: string
): Promise<void> {
  // Lazy-import native modules so this file can be loaded in Expo Go without crashing
  const Print = await import('expo-print');
  const Sharing = await import('expo-sharing');

  const html = generatePdfHtml(chart, story, isPremium, chartName);

  // Generate a safe filename
  const safeName = (chartName || chart.name || 'MySky-Chart')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `${safeName}_${dateStr}`;

  const { uri } = await Print.printToFileAsync({
    html,
    width: 612,   // US Letter width in points (8.5 inches)
    height: 792,  // US Letter height in points (11 inches)
  });

  // Rename the file to have a meaningful name (expo-print generates a random UUID)
  const FileSystem = await import('expo-file-system');
  const dir = uri.substring(0, uri.lastIndexOf('/'));
  const newUri = `${dir}/${fileName}.pdf`;
  try {
    await FileSystem.moveAsync({ from: uri, to: newUri });
  } catch {
    // If rename fails, use original URI
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save Your Natal Chart PDF',
      UTI: 'com.adobe.pdf',
    });
    return;
  }

  await Sharing.shareAsync(newUri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Save Your Natal Chart PDF',
    UTI: 'com.adobe.pdf',
  });
}
