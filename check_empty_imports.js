const fs = require('fs');
const path = require('path');

// All empty component files
const emptyFiles = [
  'components/ui/StarField.tsx',
  'components/ui/SkiaTagChip.tsx',
  'components/ui/InsightCard.tsx',
  'components/ui/NatalChartWheelSvg.tsx',
  'components/ui/SkiaResonanceSlider.tsx',
  'components/ui/AstrologyIcons.tsx',
  'components/ui/PricingCard.tsx',
  'components/ui/SkiaCelestialToggle.tsx',
  'components/ui/ObsidianJournalEntry.tsx',
  'components/ui/CheckInTrendGraph.tsx',
  'components/ui/SkiaOrbitalButton.tsx',
  'components/ui/SkiaMoonDragger.tsx',
  'components/ui/SkiaRestorationInsight.tsx',
  'components/ui/ChapterCard.tsx',
  'components/ui/NebulaBackground.tsx',
  'components/ui/ObsidianSettingsGroup.tsx',
  'components/ui/NatalChartWheelSkia.tsx',
  'components/ui/NatalChartWheel/index.tsx',
  'components/ui/MySkyLogo.tsx',
  'components/ui/PremiumCard.tsx',
  'components/ui/SkiaPulseMonitor.tsx',
  'components/ui/SkiaStabilityDashboard.tsx',
  'components/ui/SkiaUnifiedAura.tsx',
  'components/ui/NeedsComparison.tsx',
  'components/ui/PremiumStarfieldBackground.tsx',
  'components/ui/SkiaBiometricScatter.tsx',
  'components/ui/SkiaMoonPhase.tsx',
  'components/ui/ChakraWheel.tsx',
  'components/ui/SkiaBreathPortal.tsx',
  'components/ui/SkiaReflectionMirror.tsx',
  'components/ui/SkiaStoryGate.tsx',
  'components/ui/SkiaTabIcon.tsx',
  'components/ui/NatalChartWheel.tsx',
  'components/ui/SkiaWarpTransition.tsx',
  'components/ui/SkiaDreamEngine.tsx',
  'components/ui/CosmicBackground.tsx',
  'components/ui/SkiaChakraNode.tsx',
  'components/ui/SkiaTimeIcon.tsx',
  'components/ui/DreamReflectionViewer.tsx',
  'components/ui/SkiaSleepGraph.tsx',
  'components/ui/PsychologicalForcesRadar.tsx',
  'components/ui/AspectRow.tsx',
  'components/ui/SkiaRestorationField.tsx',
  'components/ui/ShadowQuoteCard.tsx',
  'components/ui/SkiaObsidianInk.tsx',
  'components/PremiumScreen.tsx',
  'components/PremiumRequiredScreen.tsx',
  'components/BirthDataModal.tsx',
  'components/BackupPassphraseModal.tsx',
  'components/OnboardingModal.tsx',
  'components/AstrologySettingsModal.tsx',
  'components/PrivacySettingsModal.tsx',
  'components/JournalEntryModal.tsx',
  'components/PremiumModal.tsx',
  'components/PrivacyConsentModal.tsx',
  'components/TermsConsentModal.tsx',
  'components/premium/SkiaAuraReader.tsx',
  'app/index.tsx',
  'app/terms.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/settings/index.tsx',
  'app/(tabs)/settings/_layout.tsx',
  'app/(tabs)/settings/calibration.tsx',
  'app/(tabs)/sleep.tsx',
  'app/(tabs)/healing.tsx',
  'app/(tabs)/relationships.tsx',
  'app/(tabs)/today.tsx',
  'app/(tabs)/chart.tsx',
  'app/(tabs)/home.tsx',
  'app/(tabs)/energy.tsx',
  'app/(tabs)/mood.tsx',
  'app/(tabs)/growth.tsx',
  'app/(tabs)/journal.tsx',
  'app/(tabs)/insights.tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/story.tsx',
  'app/(tabs)/premium.tsx',
  'app/+not-found.tsx',
  'app/privacy.tsx',
  'app/astrology-context.tsx',
  'app/error.tsx',
  'app/_layout.tsx',
  'app/(auth)/sign-in.tsx',
  'app/(auth)/_layout.tsx',
  'app/faq.tsx',
  'app/onboarding/consent.tsx',
  'app/onboarding/restore.tsx',
  'app/onboarding/birth.tsx',
  'app/onboarding/_layout.tsx',
  'app/screenshots.tsx',
];

// Directories to search for imports
const searchDirs = ['app', 'components', 'context', 'services', 'utils', 'lib'];

function getAllTsFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        results.push(...getAllTsFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

const allFiles = [];
for (const dir of searchDirs) {
  allFiles.push(...getAllTsFiles(dir));
}

const imported = [];
for (const emptyFile of emptyFiles) {
  const basename = path.basename(emptyFile, path.extname(emptyFile));
  // Also get with directory for more specific matching
  for (const srcFile of allFiles) {
    if (srcFile === emptyFile) continue;
    const content = fs.readFileSync(srcFile, 'utf8');
    // Check if this file imports the empty file's basename
    if (content.includes(`from '`) || content.includes(`from "`)) {
      // Look for import of this specific component
      const importRegex = new RegExp(`import.*['"].*${basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
      if (importRegex.test(content)) {
        imported.push({ emptyFile, importedBy: srcFile });
      }
    }
  }
}

if (imported.length === 0) {
  console.log('No empty files are imported by other source files.');
} else {
  console.log(`Found ${imported.length} imports of empty files:`);
  for (const { emptyFile, importedBy } of imported) {
    console.log(`  EMPTY "${emptyFile}" imported by "${importedBy}"`);
  }
}
