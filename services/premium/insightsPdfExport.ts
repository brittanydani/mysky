// File: services/premium/insightsPdfExport.ts
// Generates a premium insights report PDF with dark sky background
// and all pipeline data — mood, stress, energy, patterns, correlations,
// circadian rhythm, keyword lift, emotion tone, and blended insights.

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { DailyAggregate, ChartProfile } from '../insights/types';
import { EnhancedInsightBundle } from '../../utils/journalInsights';
import { CircadianGrid } from '../../store/circadianStore';
import { CorrelationPair } from '../../store/correlationStore';
import { CrossRefInsight } from '../../utils/selfKnowledgeCrossRef';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InsightsPdfInput {
  /** User display name or chart name */
  userName?: string;
  /** 30-day snapshot */
  snapshot: {
    avgMood: number | null;
    avgStress: number | null;
    stressTrend: 'improving' | 'worsening' | 'stable' | null;
    checkInCount: number;
  };
  /** Full daily aggregates from the pipeline */
  dailyAggregates: DailyAggregate[];
  /** Chart profile (natal baseline) */
  chartProfile: ChartProfile | null;
  /** Enhanced insight bundle */
  enhanced: EnhancedInsightBundle | null;
  /** Circadian 7×24 grid */
  circadianGrid: CircadianGrid | null;
  /** Correlation pairs */
  correlations: CorrelationPair[];
  /** Self-knowledge cross-reference insights */
  crossRefs: CrossRefInsight[];
  /** Pipeline metadata */
  windowDays: number;
  totalCheckIns: number;
  totalJournalEntries: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function moodLabel(avg: number | null): string {
  if (avg === null) return '—';
  if (avg < 2) return 'Struggling';
  if (avg < 3) return 'Heavy';
  if (avg < 4) return 'Low';
  if (avg < 4.8) return 'Difficult';
  if (avg < 5.5) return 'Mixed';
  if (avg < 6.5) return 'Neutral';
  if (avg < 7.5) return 'Good';
  if (avg < 8.5) return 'Lifted';
  if (avg < 9.3) return 'Vibrant';
  return 'Radiant';
}

function stressLabel(avg: number | null, trend: string | null): string {
  if (avg === null) return '—';
  if (avg < 3.5) return trend === 'worsening' ? 'Rising' : 'Calm';
  if (avg < 6.5) {
    if (trend === 'improving') return 'Easing';
    if (trend === 'worsening') return 'Building';
    return 'Moderate';
  }
  if (trend === 'improving') return 'Easing';
  if (trend === 'worsening') return 'Escalating';
  return 'High';
}

function trendArrow(direction: string): string {
  if (direction === 'up') return '↑';
  if (direction === 'down') return '↓';
  return '→';
}

function confidenceDot(level: string): string {
  if (level === 'high') return '●●●';
  if (level === 'medium') return '●●○';
  return '●○○';
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Starfield CSS background ────────────────────────────────────────────────

function starfieldCss(): string {
  const stars: string[] = [];
  // Generate 80 stars with subtle gold tints
  for (let i = 0; i < 80; i++) {
    const x = (Math.sin(i * 7.3 + 2.1) * 0.5 + 0.5) * 100;
    const y = (Math.cos(i * 5.7 + 1.3) * 0.5 + 0.5) * 100;
    const size = 0.8 + (i % 5) * 0.2;
    const isGold = i % 12 === 0;
    const alpha = 0.3 + (i % 7) * 0.1;
    const color = isGold
      ? `rgba(212, 175, 55, ${alpha})`
      : `rgba(255, 255, 255, ${alpha + 0.1})`;
    stars.push(`radial-gradient(${size}px ${size}px at ${x.toFixed(1)}% ${y.toFixed(1)}%, ${color}, transparent)`);
  }
  return stars.join(',\n    ');
}

// ─── SVG Sparkline ───────────────────────────────────────────────────────────

function sparklineSvg(
  values: number[],
  color: string,
  width = 280,
  height = 48,
): string {
  if (values.length < 2) return '';
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const gradientId = `sparkGrad_${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  const areaPoints = `0,${height} ${points.join(' ')} ${width},${height}`;

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:${height}px;margin:8px 0;">
    <defs>
      <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <polygon points="${areaPoints}" fill="url(#${gradientId})"/>
    <polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

// ─── Circadian Heatmap SVG ──────────────────────────────────────────────────

function circadianHeatmapSvg(grid: CircadianGrid): string {
  const cellW = 18;
  const cellH = 22;
  const labelW = 36;
  const labelH = 16;
  const W = labelW + 24 * cellW + 8;
  const H = labelH + 7 * cellH + 8;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;max-width:${W}px;margin:12px auto;">`;

  // Hour labels
  for (let h = 0; h < 24; h += 3) {
    const x = labelW + h * cellW + cellW / 2;
    svg += `<text x="${x}" y="${labelH - 3}" text-anchor="middle" font-size="7" fill="rgba(212,175,55,0.5)" font-family="sans-serif">${h}h</text>`;
  }

  // Day rows
  for (let d = 0; d < 7; d++) {
    const y = labelH + d * cellH;
    svg += `<text x="${labelW - 6}" y="${y + cellH / 2 + 3}" text-anchor="end" font-size="8" fill="rgba(255,255,255,0.5)" font-family="sans-serif">${DAY_NAMES[d]}</text>`;

    for (let h = 0; h < 24; h++) {
      const val = grid[d]?.[h] ?? 5;
      const t = Math.max(0, Math.min(1, (val - 1) / 9));
      // Color: deep blue (low mood) → gold (high mood)
      const r = Math.round(20 + t * 192);
      const g = Math.round(30 + t * 145);
      const b = Math.round(60 + t * (t > 0.5 ? -5 : 80));
      const alpha = 0.3 + t * 0.55;
      const x = labelW + h * cellW;
      svg += `<rect x="${x + 1}" y="${y + 1}" width="${cellW - 2}" height="${cellH - 2}" rx="3" fill="rgba(${r},${g},${b},${alpha})"/>`;
    }
  }

  svg += `</svg>`;
  return svg;
}

// ─── Correlation Gauge SVG ──────────────────────────────────────────────────

function correlationGaugeSvg(pairs: CorrelationPair[]): string {
  if (pairs.length === 0) return '';
  const barH = 24;
  const gap = 8;
  const labelW = 120;
  const barW = 160;
  const W = labelW + barW + 40;
  const H = pairs.length * (barH + gap) + 8;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;max-width:${W}px;margin:12px auto;">`;

  pairs.forEach((p, i) => {
    const y = i * (barH + gap) + 4;
    const label = `${capitalize(p.metric_a)} × ${capitalize(p.metric_b)}`;
    const val = p.correlation;
    const absVal = Math.abs(val);
    const positive = val >= 0;
    const color = positive ? 'rgba(110,191,139,0.75)' : 'rgba(210,130,130,0.75)';
    const midX = labelW + barW / 2;
    const barLen = absVal * (barW / 2);

    svg += `<text x="${labelW - 8}" y="${y + barH / 2 + 3}" text-anchor="end" font-size="9" fill="rgba(255,255,255,0.6)" font-family="sans-serif">${esc(label)}</text>`;
    svg += `<rect x="${labelW}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="rgba(255,255,255,0.04)"/>`;
    svg += `<line x1="${midX}" y1="${y}" x2="${midX}" y2="${y + barH}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;

    if (positive) {
      svg += `<rect x="${midX}" y="${y + 3}" width="${barLen}" height="${barH - 6}" rx="3" fill="${color}"/>`;
    } else {
      svg += `<rect x="${midX - barLen}" y="${y + 3}" width="${barLen}" height="${barH - 6}" rx="3" fill="${color}"/>`;
    }

    svg += `<text x="${labelW + barW + 6}" y="${y + barH / 2 + 3}" font-size="9" fill="rgba(255,255,255,0.5)" font-family="sans-serif">${val > 0 ? '+' : ''}${val.toFixed(2)}</text>`;
  });

  svg += `</svg>`;
  return svg;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── HTML Build ─────────────────────────────────────────────────────────────

function buildInsightsPdfHtml(input: InsightsPdfInput): string {
  const {
    userName,
    snapshot,
    dailyAggregates,
    chartProfile,
    enhanced,
    circadianGrid,
    correlations,
    crossRefs,
    windowDays,
    totalCheckIns,
    totalJournalEntries,
  } = input;

  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const displayName = userName || 'Your';

  // ── Trend sparklines ──
  const recent = dailyAggregates.slice(-30);
  const moodValues = recent.map(d => d.moodAvg);
  const stressValues = recent.map(d => d.stressAvg);
  const energyValues = recent.map(d => d.energyAvg);

  const moodSparkline = sparklineSvg(moodValues, '#C9AE78');
  const stressSparkline = sparklineSvg(stressValues, '#CD7F5D');
  const energySparkline = sparklineSvg(energyValues, '#8BC4E8');

  // ── Trends section ──
  let trendsHtml = '';
  if (enhanced?.trends.length) {
    const trendRows = enhanced.trends.map(t =>
      `<div class="trend-row">
        <span class="trend-metric">${esc(capitalize(t.metric.replace('Avg', '').replace('Count', ' Count')))}</span>
        <span class="trend-arrow ${t.direction}">${trendArrow(t.direction)}</span>
        <span class="trend-change">${esc(t.displayChange)}</span>
      </div>`
    ).join('');
    trendsHtml = `
      <div class="section">
        <h2 class="section-title">Metric Trends</h2>
        <div class="trends-grid">${trendRows}</div>
      </div>`;
  }

  // ── Volatility ──
  let volatilityHtml = '';
  if (enhanced?.volatility.length) {
    const volRows = enhanced.volatility.map(v =>
      `<div class="vol-row">
        <span class="vol-metric">${esc(capitalize(v.metric))}</span>
        <span class="vol-badge vol-${v.level}">${esc(v.level)}</span>
        <span class="vol-val">σ ${v.stddev.toFixed(2)}</span>
      </div>`
    ).join('');
    volatilityHtml = `
      <div class="section">
        <h2 class="section-title">Emotional Volatility</h2>
        ${volRows}
      </div>`;
  }

  // ── Keyword Lift ──
  let keywordLiftHtml = '';
  if (enhanced?.keywordLift.hasData) {
    const restores = enhanced.keywordLift.restores.slice(0, 6).map(r =>
      `<span class="kw-pill restore">↑ ${esc(r.label)} <em>+${r.lift.toFixed(1)}</em></span>`
    ).join('');
    const drains = enhanced.keywordLift.drains.slice(0, 6).map(d =>
      `<span class="kw-pill drain">↓ ${esc(d.label)} <em>${d.lift.toFixed(1)}</em></span>`
    ).join('');
    keywordLiftHtml = `
      <div class="section">
        <h2 class="section-title">What Restores &amp; Drains You</h2>
        ${restores ? `<div class="kw-group"><span class="kw-label">Restores</span><div class="kw-pills">${restores}</div></div>` : ''}
        ${drains ? `<div class="kw-group"><span class="kw-label">Drains</span><div class="kw-pills">${drains}</div></div>` : ''}
      </div>`;
  }

  // ── Emotion Tone Shift ──
  let emotionToneHtml = '';
  if (enhanced?.emotionToneShift) {
    const ets = enhanced.emotionToneShift;
    const rising = ets.rising.map(e =>
      `<span class="emo-pill rising">↑ ${esc(e.category)}</span>`
    ).join('');
    const falling = ets.falling.map(e =>
      `<span class="emo-pill falling">↓ ${esc(e.category)}</span>`
    ).join('');
    emotionToneHtml = `
      <div class="section">
        <h2 class="section-title">Emotion Tone Shift</h2>
        <p class="insight-text">${esc(ets.insight)}</p>
        <div class="emo-pills">${rising}${falling}</div>
        <p class="stat-label">${esc(ets.stat)}</p>
      </div>`;
  }

  // ── Time Patterns ──
  let timePatternHtml = '';
  if (enhanced?.timePatterns.length) {
    const cards = enhanced.timePatterns.map(tp => {
      let detail = '';
      if (tp.type === 'time_of_day' && tp.buckets?.length) {
        const rows = tp.buckets.map(b =>
          `<tr>
            <td>${esc(b.label)}</td>
            <td>${b.avgMood.toFixed(1)}</td>
            <td>${b.avgStress.toFixed(1)}</td>
            <td>${b.avgEnergy.toFixed(1)}</td>
            <td>${b.count}</td>
          </tr>`
        ).join('');
        detail = `<table class="mini-table">
          <thead><tr><th>Time</th><th>Mood</th><th>Stress</th><th>Energy</th><th>Logs</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
      }
      if (tp.type === 'day_of_week' && tp.dayData?.length) {
        const rows = tp.dayData.map(d =>
          `<tr><td>${esc(d.day)}</td><td>${d.avgMood.toFixed(1)}</td><td>${d.avgStress.toFixed(1)}</td></tr>`
        ).join('');
        detail = `<table class="mini-table">
          <thead><tr><th>Day</th><th>Mood</th><th>Stress</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
      }
      return `<div class="time-card">
        <p class="insight-text">${esc(tp.insight)}</p>
        <p class="stat-label">${esc(tp.stat)}</p>
        ${detail}
      </div>`;
    }).join('');
    timePatternHtml = `
      <div class="section">
        <h2 class="section-title">Time &amp; Rhythm Patterns</h2>
        ${cards}
      </div>`;
  }

  // ── Circadian Heatmap ──
  let circadianHtml = '';
  if (circadianGrid) {
    circadianHtml = `
      <div class="section">
        <h2 class="section-title">Circadian Rhythm</h2>
        <p class="section-desc">Average mood by day of week and hour — warmer tones indicate higher mood.</p>
        ${circadianHeatmapSvg(circadianGrid)}
      </div>`;
  }

  // ── Correlations ──
  let correlationHtml = '';
  if (correlations.length > 0) {
    correlationHtml = `
      <div class="section">
        <h2 class="section-title">Emotional Correlations</h2>
        <p class="section-desc">How your emotional metrics relate to each other.</p>
        ${correlationGaugeSvg(correlations)}
      </div>`;
  }

  // ── Personal Patterns (Cross-Refs) ──
  let crossRefHtml = '';
  if (crossRefs.length > 0) {
    const cards = crossRefs.map(cr =>
      `<div class="crossref-card">
        <div class="crossref-header">
          <span class="crossref-source">${esc(cr.source.toUpperCase())}</span>
          ${cr.isConfirmed ? '<span class="crossref-badge">DATA CONFIRMED</span>' : ''}
        </div>
        <h3 class="crossref-title">${esc(cr.title)}</h3>
        <p class="crossref-body">${esc(cr.body)}</p>
      </div>`
    ).join('');
    crossRefHtml = `
      <div class="section">
        <h2 class="section-title">Personal Patterns</h2>
        ${cards}
      </div>`;
  }

  // ── Blended Insights ──
  let blendedHtml = '';
  if (enhanced?.blended.length) {
    const cards = enhanced.blended.map(b =>
      `<div class="blended-card">
        <h3 class="blended-title">${esc(b.title)}</h3>
        <p class="blended-body">${esc(b.body)}</p>
        <div class="blended-meta">
          <span class="blended-stat">${esc(b.stat)}</span>
          <span class="blended-conf">${confidenceDot(b.confidence)}</span>
        </div>
        ${b.journalPrompt ? `<p class="blended-prompt">✦ ${esc(b.journalPrompt)}</p>` : ''}
      </div>`
    ).join('');
    blendedHtml = `
      <div class="section">
        <h2 class="section-title">Where It Connects</h2>
        ${cards}
      </div>`;
  }

  // ── Chart Baselines ──
  let baselineHtml = '';
  if (enhanced?.chartBaselines.length) {
    const cards = enhanced.chartBaselines.map(cb =>
      `<div class="baseline-card">
        <span class="baseline-type">${esc(cb.label)}</span>
        <p class="baseline-body">${esc(cb.body)}</p>
      </div>`
    ).join('');
    baselineHtml = `
      <div class="section">
        <h2 class="section-title">Chart Baselines</h2>
        ${cards}
      </div>`;
  }

  // ── Journal Impact ──
  let journalImpactHtml = '';
  if (enhanced?.journalImpact.length) {
    const cards = enhanced.journalImpact.map(ji =>
      `<div class="journal-impact-card">
        <p class="insight-text">${esc(ji.insight)}</p>
        <p class="stat-label">${esc(ji.stat)}</p>
      </div>`
    ).join('');
    journalImpactHtml = `
      <div class="section">
        <h2 class="section-title">Journal Impact</h2>
        ${cards}
      </div>`;
  }

  // ── Chart Profile Summary ──
  let profileHtml = '';
  if (chartProfile) {
    const cp = chartProfile;
    const stelliumText = cp.stelliums.length
      ? cp.stelliums.map(s => `${s.sign} (${s.count})`).join(', ')
      : 'None';
    profileHtml = `
      <div class="section">
        <h2 class="section-title">Natal Profile Summary</h2>
        <div class="profile-grid">
          <div class="profile-item"><span class="profile-label">Dominant Element</span><span class="profile-value">${esc(cp.dominantElement)}</span></div>
          <div class="profile-item"><span class="profile-label">Dominant Modality</span><span class="profile-value">${esc(cp.dominantModality)}</span></div>
          <div class="profile-item"><span class="profile-label">Moon</span><span class="profile-value">${esc(cp.moonSign)}${cp.moonHouse ? ` · House ${cp.moonHouse}` : ''}</span></div>
          <div class="profile-item"><span class="profile-label">Saturn</span><span class="profile-value">${esc(cp.saturnSign)}${cp.saturnHouse ? ` · House ${cp.saturnHouse}` : ''}</span></div>
          ${cp.chironSign ? `<div class="profile-item"><span class="profile-label">Chiron</span><span class="profile-value">${esc(cp.chironSign)}${cp.chironHouse ? ` · House ${cp.chironHouse}` : ''}</span></div>` : ''}
          <div class="profile-item"><span class="profile-label">Stelliums</span><span class="profile-value">${esc(stelliumText)}</span></div>
        </div>
        <div class="element-bar">
          ${Object.entries(cp.elementCounts).map(([el, count]) =>
            `<div class="el-segment el-${el.toLowerCase()}" style="flex:${count};">
              <span class="el-label">${esc(el)} ${count}</span>
            </div>`
          ).join('')}
        </div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(displayName)} Insights — MySky</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

body {
  font-family: Georgia, 'Times New Roman', serif;
  background: #0B1120;
  color: #FFFFFF;
  font-size: 13px;
  line-height: 1.6;
  min-height: 100vh;
}

/* ── Dark Sky Starfield ── */
.star-layer {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 0;
  background: ${starfieldCss()};
}
.nebula-layer {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse 600px 400px at 15% 20%, rgba(90, 60, 140, 0.08), transparent),
    radial-gradient(ellipse 500px 350px at 80% 70%, rgba(40, 80, 130, 0.06), transparent),
    radial-gradient(ellipse 400px 300px at 50% 45%, rgba(180, 140, 60, 0.04), transparent);
}
.content-wrap {
  position: relative;
  z-index: 1;
  padding: 40px 44px;
  max-width: 680px;
  margin: 0 auto;
}

/* ── Cover ── */
.cover {
  text-align: center;
  padding: 48px 0 40px;
  border-bottom: 1px solid rgba(212,175,55,0.18);
  margin-bottom: 40px;
}
.app-name {
  font-size: 10px;
  letter-spacing: 6px;
  text-transform: uppercase;
  color: rgba(212,175,55,0.55);
  margin-bottom: 24px;
}
.cover-title {
  font-size: 30px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}
.cover-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  font-style: italic;
  margin-bottom: 24px;
}
.cover-meta {
  display: flex;
  justify-content: center;
  gap: 28px;
  font-size: 11px;
  color: rgba(255,255,255,0.35);
}
.cover-meta span { display: flex; align-items: center; gap: 6px; }
.meta-num { color: rgba(212,175,55,0.7); font-weight: 600; font-size: 13px; }

/* ── Snapshot Cards ── */
.snapshot-row {
  display: flex;
  gap: 12px;
  margin-bottom: 36px;
}
.snapshot-card {
  flex: 1;
  text-align: center;
  padding: 20px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(20,30,50,0.6);
}
.snap-label {
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(212,175,55,0.55);
  margin-bottom: 8px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
.snap-value {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
}
.snap-value.text { font-size: 15px; }

/* ── Sparklines ── */
.sparkline-section { margin-bottom: 36px; }
.sparkline-card {
  padding: 16px 20px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.05);
  background: rgba(20,30,50,0.4);
  margin-bottom: 8px;
}
.sparkline-label {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  margin-bottom: 4px;
}
.sparkline-label.mood { color: rgba(201,174,120,0.7); }
.sparkline-label.stress { color: rgba(205,127,93,0.7); }
.sparkline-label.energy { color: rgba(139,196,232,0.7); }

/* ── Sections ── */
.section {
  margin-bottom: 36px;
  page-break-inside: avoid;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #D8C39A;
  letter-spacing: 0.3px;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(212,175,55,0.12);
}
.section-desc {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  margin-bottom: 12px;
  font-style: italic;
}

/* ── Trends ── */
.trends-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.trend-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(20,30,50,0.5);
  border: 1px solid rgba(255,255,255,0.05);
}
.trend-metric { font-size: 12px; color: rgba(255,255,255,0.6); font-family: -apple-system, sans-serif; }
.trend-arrow { font-size: 16px; font-weight: 700; }
.trend-arrow.up { color: #6EBF8B; }
.trend-arrow.down { color: #E07A7A; }
.trend-arrow.stable { color: rgba(255,255,255,0.3); }
.trend-change { font-size: 11px; color: rgba(255,255,255,0.45); font-family: -apple-system, sans-serif; }

/* ── Volatility ── */
.vol-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.vol-metric { font-size: 12px; color: rgba(255,255,255,0.6); width: 80px; font-family: -apple-system, sans-serif; }
.vol-badge {
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 8px;
  font-family: -apple-system, sans-serif;
  font-weight: 600;
}
.vol-low { background: rgba(110,191,139,0.15); color: #6EBF8B; }
.vol-moderate { background: rgba(212,175,55,0.15); color: #D4AF37; }
.vol-high { background: rgba(210,130,130,0.15); color: #E07A7A; }
.vol-val { font-size: 11px; color: rgba(255,255,255,0.35); font-family: -apple-system, sans-serif; }

/* ── Keyword Pills ── */
.kw-group { margin-bottom: 14px; }
.kw-label {
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(212,175,55,0.5);
  margin-bottom: 8px;
  display: block;
  font-family: -apple-system, sans-serif;
}
.kw-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.kw-pill {
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 10px;
  font-family: -apple-system, sans-serif;
}
.kw-pill em { font-style: normal; font-weight: 600; margin-left: 4px; }
.kw-pill.restore { background: rgba(110,191,139,0.12); color: #6EBF8B; border: 1px solid rgba(110,191,139,0.2); }
.kw-pill.drain { background: rgba(210,130,130,0.12); color: #E07A7A; border: 1px solid rgba(210,130,130,0.2); }

/* ── Emotion Tone ── */
.emo-pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
.emo-pill {
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 10px;
  font-family: -apple-system, sans-serif;
}
.emo-pill.rising { background: rgba(110,191,139,0.12); color: #6EBF8B; }
.emo-pill.falling { background: rgba(210,130,130,0.12); color: #E07A7A; }

/* ── Text blocks ── */
.insight-text { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.8; margin-bottom: 8px; }
.stat-label { font-size: 11px; color: rgba(255,255,255,0.3); font-style: italic; font-family: -apple-system, sans-serif; }

/* ── Mini tables ── */
.mini-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
.mini-table thead tr { background: rgba(26,39,64,0.6); }
.mini-table th {
  text-align: left; padding: 6px 10px; font-size: 9px; letter-spacing: 1.5px;
  text-transform: uppercase; color: rgba(212,175,55,0.5); font-weight: 400;
  font-family: -apple-system, sans-serif;
}
.mini-table td { padding: 5px 10px; color: rgba(255,255,255,0.6); border-bottom: 1px solid rgba(255,255,255,0.04); font-family: -apple-system, sans-serif; }

/* ── Time pattern card ── */
.time-card {
  padding: 16px 20px;
  border-radius: 14px;
  background: rgba(20,30,50,0.4);
  border: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 8px;
}

/* ── Cross-Reference Cards ── */
.crossref-card {
  padding: 18px 20px;
  border-radius: 14px;
  background: rgba(20,30,50,0.5);
  border: 1px solid rgba(212,175,55,0.1);
  margin-bottom: 8px;
}
.crossref-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.crossref-source {
  font-size: 9px; letter-spacing: 2px; color: rgba(212,175,55,0.6);
  font-family: -apple-system, sans-serif; font-weight: 700;
}
.crossref-badge {
  font-size: 8px; letter-spacing: 1px; color: rgba(212,175,55,0.5);
  padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(212,175,55,0.2);
  font-family: -apple-system, sans-serif;
}
.crossref-title { font-size: 15px; color: #FFFFFF; margin-bottom: 6px; }
.crossref-body { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.7; }

/* ── Blended Insights ── */
.blended-card {
  padding: 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(139,196,232,0.08), rgba(20,30,50,0.6));
  border: 1px solid rgba(139,196,232,0.1);
  margin-bottom: 10px;
}
.blended-title { font-size: 16px; color: #FFFFFF; margin-bottom: 8px; }
.blended-body { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.8; margin-bottom: 10px; }
.blended-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.blended-stat { font-size: 11px; color: rgba(255,255,255,0.35); font-family: -apple-system, sans-serif; }
.blended-conf { font-size: 10px; color: rgba(212,175,55,0.5); letter-spacing: 2px; }
.blended-prompt {
  font-size: 12px; color: rgba(212,175,55,0.6); font-style: italic;
  padding: 10px 14px; border-radius: 10px; background: rgba(212,175,55,0.06);
  border-left: 2px solid rgba(212,175,55,0.25);
}

/* ── Baselines ── */
.baseline-card {
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(20,30,50,0.4);
  border: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 8px;
}
.baseline-type {
  font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
  color: rgba(212,175,55,0.5); font-family: -apple-system, sans-serif;
  display: block; margin-bottom: 6px;
}
.baseline-body { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.7; }

/* ── Journal Impact ── */
.journal-impact-card {
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(20,30,50,0.4);
  border: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 8px;
}

/* ── Profile Grid ── */
.profile-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.profile-item {
  padding: 10px 16px; border-radius: 10px;
  background: rgba(20,30,50,0.5); border: 1px solid rgba(255,255,255,0.05);
}
.profile-label {
  font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase;
  color: rgba(212,175,55,0.5); display: block; margin-bottom: 4px;
  font-family: -apple-system, sans-serif;
}
.profile-value { font-size: 13px; color: rgba(255,255,255,0.7); }

/* ── Element Bar ── */
.element-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; gap: 2px; }
.el-segment { display: flex; align-items: center; justify-content: center; position: relative; min-width: 20px; border-radius: 3px; }
.el-segment .el-label {
  position: absolute; top: -18px; font-size: 8px; white-space: nowrap;
  color: rgba(255,255,255,0.4); font-family: -apple-system, sans-serif;
}
.el-fire { background: rgba(200,80,60,0.5); }
.el-earth { background: rgba(90,160,90,0.5); }
.el-air { background: rgba(70,150,210,0.5); }
.el-water { background: rgba(70,120,200,0.5); }

/* ── Footer ── */
.footer {
  text-align: center;
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 10px;
  color: rgba(255,255,255,0.2);
  letter-spacing: 1.5px;
}

@media print {
  .star-layer, .nebula-layer { position: fixed; }
  .section { page-break-inside: avoid; }
}
</style>
</head>
<body>

<div class="star-layer"></div>
<div class="nebula-layer"></div>
<div class="content-wrap">

<!-- Cover -->
<div class="cover">
  <p class="app-name">MySky</p>
  <h1 class="cover-title">${esc(displayName)} Insights Report</h1>
  <p class="cover-subtitle">Personalized Patterns &amp; Rhythmic Guidance</p>
  <div class="cover-meta">
    <span><span class="meta-num">${windowDays}</span> day window</span>
    <span><span class="meta-num">${totalCheckIns}</span> check-ins</span>
    <span><span class="meta-num">${totalJournalEntries}</span> journal entries</span>
  </div>
</div>

<!-- Snapshot -->
<div class="snapshot-row">
  <div class="snapshot-card">
    <p class="snap-label">Avg Mood</p>
    <p class="snap-value text">${esc(moodLabel(snapshot.avgMood))}</p>
  </div>
  <div class="snapshot-card">
    <p class="snap-label">Stress</p>
    <p class="snap-value text">${esc(stressLabel(snapshot.avgStress, snapshot.stressTrend))}</p>
  </div>
  <div class="snapshot-card">
    <p class="snap-label">Logs</p>
    <p class="snap-value">${snapshot.checkInCount}</p>
  </div>
</div>

<!-- Sparklines -->
${moodValues.length >= 2 ? `
<div class="sparkline-section">
  <div class="sparkline-card">
    <p class="sparkline-label mood">Mood — Last 30 Days</p>
    ${moodSparkline}
  </div>
  <div class="sparkline-card">
    <p class="sparkline-label stress">Stress — Last 30 Days</p>
    ${stressSparkline}
  </div>
  <div class="sparkline-card">
    <p class="sparkline-label energy">Energy — Last 30 Days</p>
    ${energySparkline}
  </div>
</div>` : ''}

${trendsHtml}
${volatilityHtml}
${profileHtml}
${crossRefHtml}
${keywordLiftHtml}
${emotionToneHtml}
${timePatternHtml}
${circadianHtml}
${correlationHtml}
${blendedHtml}
${baselineHtml}
${journalImpactHtml}

<!-- Footer -->
<div class="footer">
  <p>Generated by MySky &middot; ${generatedDate}</p>
</div>

</div><!-- /content-wrap -->
</body>
</html>`;
}

// ─── Public Entry Point ─────────────────────────────────────────────────────

/**
 * Builds a comprehensive insights PDF with dark sky background
 * and shares it via the native share sheet.
 */
export async function exportInsightsToPdf(input: InsightsPdfInput): Promise<void> {
  const html = buildInsightsPdfHtml(input);

  const { uri: tmpUri } = await Print.printToFileAsync({ html, base64: false });

  const safeName = (input.userName ?? 'MySky').replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'MySky';
  const destUri = `${FileSystem.cacheDirectory}${safeName}_Insights_Report.pdf`;

  await FileSystem.copyAsync({ from: tmpUri, to: destUri });
  await FileSystem.deleteAsync(tmpUri, { idempotent: true });

  await Sharing.shareAsync(destUri, {
    mimeType: 'application/pdf',
    dialogTitle: `${safeName} — Insights Report`,
    UTI: 'com.adobe.pdf',
  });

  await FileSystem.deleteAsync(destUri, { idempotent: true });
}
