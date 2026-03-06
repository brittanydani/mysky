// color_sweep.js — Normalizes all old gold/beige/muddy hex values and background colors
// to the MYSTIC unified visual system across the codebase.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// ── Color replacements ─────────────────────────────
// Map old scattered gold/beige hex values → new MYSTIC system values
const HEX_REPLACEMENTS = [
  // OLD gold gradients → NEW goldGradient
  ["'#C5B493'", "'#C9AE78'"],
  ["'#9A8661'", "'#9B7A46'"],
  ["'#6E5E40'", "'#6B532E'"],
  ['"#C5B493"', '"#C9AE78"'],
  ['"#9A8661"', '"#9B7A46"'],
  ['"#6E5E40"', '"#6B532E"'],

  // OLD muddy gold CTA gradients
  ["'#8B6508'", "'#6B532E'"],
  ["'#FFF4D4'", "'#FFF4D6'"],
  ['"#8B6508"', '"#6B532E"'],
  ['"#FFF4D4"', '"#FFF4D6"'],

  // OLD gold text/accent → approved champagne
  ["'#e1b072'", "'#E8D6AE'"],
  ['"#e1b072"', '"#E8D6AE"'],
  ["'#E1B072'", "'#E8D6AE'"],
  ['"#E1B072"', '"#E8D6AE"'],

  // OLD background deep values → MYSTIC.bgTop
  ["'#07090F'", "'#020817'"],
  ['"#07090F"', '"#020817"'],
  ["'#05070A'", "'#020817'"],
  ['"#05070A"', '"#020817"'],
  ["'#0D1421'", "'#020817'"],
  ['"#0D1421"', '"#020817"'],
  ["'#0a0a0a'", "'#020817'"],
  ['"#0a0a0a"', '"#020817"'],
  ["'#0A0A0A'", "'#020817'"],

  // OLD surface colors that are too bright
  ["'#1A2740'", "'#0E1830'"],
  ['"#1A2740"', '"#0E1830"'],
  ["'#1E2D47'", "'#0E1830'"],
  ['"#1E2D47"', '"#0E1830"'],
  ["'#243651'", "'#122040'"],
  ['"#243651"', '"#122040"'],
  ["'#141E2E'", "'#0A1224'"],
  ['"#141E2E"', '"#0A1224"'],

  // OLD CTA dark text
  ["'#1A1A1A'", "'#0B1220'"],
  ['"#1A1A1A"', '"#0B1220"'],

  // OLD beige/parchment text → heading white
  ["'#FDFBF7'", "'#F8FAFC'"],
  ['"#FDFBF7"', '"#F8FAFC"'],

  // OLD E6D5B8 variants → subtitleGold
  ["'#E6D5B8'", "'#E8D6AE'"],
  ['"#E6D5B8"', '"#E8D6AE"'],
];

// ── rgba replacements ──────────────────────────────
const RGBA_REPLACEMENTS = [
  // OLD card border values → MYSTIC.cardBorder
  ["rgba(216, 195, 154, 0.2)", "rgba(232,214,174,0.18)"],
  ["rgba(216, 195, 154, 0.25)", "rgba(232,214,174,0.18)"],
  ["rgba(216, 195, 154, 0.3)", "rgba(232,214,174,0.25)"],
  ["rgba(197, 180, 147, 0.2)", "rgba(232,214,174,0.18)"],
  ["rgba(197, 180, 147, 0.25)", "rgba(232,214,174,0.18)"],
  ["rgba(197, 180, 147, 0.3)", "rgba(232,214,174,0.25)"],
  ["rgba(197, 180, 147,0.2)", "rgba(232,214,174,0.18)"],
  ["rgba(197, 180, 147,0.25)", "rgba(232,214,174,0.18)"],
  ["rgba(197, 180, 147,0.3)", "rgba(232,214,174,0.25)"],

  // OLD card gradient colors → new transparent
  ["rgba(35, 40, 55, 0.4)", "rgba(14,24,48,0.40)"],
  ["rgba(35, 40, 55, 0.5)", "rgba(14,24,48,0.40)"],
  ["rgba(20, 24, 34, 0.7)", "rgba(2,8,23,0.60)"],
  ["rgba(20, 24, 34, 0.8)", "rgba(2,8,23,0.60)"],
  ["rgba(20, 24, 34, 0.6)", "rgba(2,8,23,0.50)"],

  // OLD glass border → MYSTIC cardHighlight
  ["rgba(255, 255, 255, 0.06)", "rgba(255,255,255,0.06)"],
  ["rgba(255, 255, 255, 0.12)", "rgba(255,255,255,0.08)"],

  // OLD muddy gold glow opacities
  ["rgba(197, 180, 147,0.10)", "rgba(232,214,174,0.08)"],
  ["rgba(197, 180, 147,0.03)", "rgba(232,214,174,0.03)"],
  ["rgba(197, 180, 147, 0.10)", "rgba(232,214,174,0.08)"],
  ["rgba(197, 180, 147, 0.08)", "rgba(232,214,174,0.08)"],
  ["rgba(197, 180, 147, 0.05)", "rgba(232,214,174,0.05)"],

  // OLD glass base → transparent card
  ["rgba(15, 18, 25, 0.85)", "rgba(255,255,255,0.03)"],

  // OLD heavy card fills
  ["rgba(30,45,71,0.65)", "rgba(14,24,48,0.40)"],
  ["rgba(30,45,71,0.60)", "rgba(14,24,48,0.40)"],
  ["rgba(26,39,64,0.45)", "rgba(2,8,23,0.50)"],
  ["rgba(26,39,64,0.40)", "rgba(2,8,23,0.50)"],

  // OLD gold button glow
  ["rgba(225, 176, 114, 0.1)", "rgba(232,214,174,0.08)"],
  ["rgba(225, 176, 114, 0.2)", "rgba(232,214,174,0.15)"],
  ["rgba(225, 176, 114, 0.3)", "rgba(232,214,174,0.25)"],
];

// ── Files to process ───────────────────────────────
function getAllTsxFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'ios' || entry.name === 'android' || entry.name === 'supabase') continue;
      results = results.concat(getAllTsxFiles(full));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      // Skip the theme file itself and this script
      if (full.includes('constants/theme.ts')) continue;
      results.push(full);
    }
  }
  return results;
}

let totalChanges = 0;
const changedFiles = [];

const files = getAllTsxFiles(ROOT);
for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Apply hex replacements
  for (const [from, to] of HEX_REPLACEMENTS) {
    content = content.split(from).join(to);
  }

  // Apply rgba replacements
  for (const [from, to] of RGBA_REPLACEMENTS) {
    content = content.split(from).join(to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const relPath = path.relative(ROOT, filePath);
    changedFiles.push(relPath);
    totalChanges++;
  }
}

console.log(`Color sweep complete: ${totalChanges} files updated`);
changedFiles.forEach(f => console.log(`  ${f}`));
