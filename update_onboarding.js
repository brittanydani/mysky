const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app/onboarding/index.tsx');
let content = fs.readFileSync(file, 'utf8');

// Update PALETTE to COLORS
content = content.replace(
  /\/\/ ── Cinematic Palette ──[\s\S]*?};/,
  `// ── Cinematic Palette ──
export const COLORS = {
  bg: '#020817',
  heading: '#F8FAFC',
  body: 'rgba(226,232,240,0.78)',

  goldBright: '#FDF3D7',
  goldText: '#E8D6AE',
  goldIcon: '#E3CFA4',
  goldMuted: '#D8C39A',

  goldGradient1: '#FFF4D6',
  goldGradient2: '#E9D9B8',
  goldGradient3: '#C9AE78',
  goldGradient4: '#9B7A46',
  goldGradient5: '#6B532E',

  buttonText: '#0B1220',

  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};`
);

// Update title textMain
content = content.replace(/color: PALETTE\.textMain,/g, 'color: COLORS.heading,');

// Update feature icon colors
content = content.replace(/color=\{PALETTE\.gold\} \/>/g, 'color={COLORS.goldIcon} const fs = require('fs');
const patloconst path = require('pala
const file = path.join(__dilinlet content = fs.readFileSync(file, 'utf8');

// Update PALETow
// Update PALETTE to COLORS
content = contMutcontent = content.replace(re  /\/\/ ── Cinematic nt  `// ── CinematicLETTE\.gold,/g, 'color: COLORSexport const COLORS = {
  bg: '#0208t   bg: '#020817',
  heat.  heading: '#r: C  body: 'rgba(226,23S]
  goldBright: '#FDF3D7',
  goldRS.  goldText: '#E8D6AE',
ef  goldIcon: '#E3CFA4'ta  goldMuted: '#D8C39Aon
  goldGradient1: '#FFarG  goldGradient2: '#E9D9B8'4D  goldGradient3: '#C9AE78''#  goldGradient4: '\]\}\s+sta  goldGradient5: '#6B532E'en
  buttonText: '#0B1220',
tyl
  glassBorder: 'rgba(2\}\  glassHighlight: 'rgba(255,255,255,0.1  };`
);

// Update title textMain
content =Gr);ient2,content = ldGradient3, CO
// Update feature icon colors
content = content.replace(/color=\{PALETTE\.gold\}}}
content = content.replace(/c yconst patloconst path = require('pala
const file = path.join(__dilinlet content = fs.readFileSync(file, 'utHiconst file = path.join(__dilinlet co c
// Update PALETow
// Update PALETTE to COLORS
content = contMutcontent =20\// Update PALETT" content = contMutcontent =rr  bg: '#0208t   bg: '#020817',
  heat.  heading: '#r: C  body: 'rgba(226,23S]
  goldBright: '#FDF3D7',
  goldRS.  goldText: '#E8D6AE',
ef  goldIconT  heat.  heading: '#r: C  bod
c  goldBright: '#FDF3D7',
  goldRS.  goldText:r/  goldRS.  goldText: '#);ef  goldIcon: '#E3CFA4'ta  golLE  goldGradient1: '#FFarG  goldGradient2: '#E9D9;
  buttonText: '#0B1220',
tyl
  glassBorder: 'rgba(2\}\  glassHighlight: 'rgba(255,255,255,0.1  };`
);

// Update title textMain
contents
tyl
  glassBorder: 'rgbce    );

// Update title textMain
content =Gr);ient2,content = ldGradientbordercontent =Gr);ient2,contha// Update feature icon colors
conteinBottom: content = content.replace(/c55content = content.replace(/c yconst patloconst path/ const file = path.join(__dilinlet content = fs.readFileSyctaGradient// Update PALETow
// Update PALETTE to COLORS
content = contMutcontent =20\// Update PALETT" contight: '40%',
// Update PALETTlocontent = contMutcontent =',  heat.  heading: '#r: C  bodfs.writeFileSync(file, content, 'utf8');
