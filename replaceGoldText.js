const fs = require('fs');
const path = require('path');

const directory = './app';
const directory2 = './components';
const GOLD_COLORS = ["#E8D6AE", "#D8C39A", "#E3CFA4", "#F3E6C5", "#FDF3D7", "#E9D9B8", "#C9AE78", "#B8A27A", "#CFAE73", "#9B7A46", "#6F552E", "#FFF4D6", "#CBB07A", "#9B7B47", "#6F562F", "#FFF8E3", "#F7E7C2", "#EED9A7", "#6B532E", "#F0EAD6"];

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Let's do simple Regex replacements for Ionicons first
  content = content.replace(/<Ionicons([^>]*?)color=['"](#[0-9A-Fa-f]{6})['"]([^>]*?)\/?>/g, (match, before, color, after) => {
    if (GOLD_COLORS.map(c=>c.toLowerCase()).includes(color.toLowerCase())) {
        return `<GoldIcon${before}${after} />`;
    }
    return match;
  });

  if (content !== originalContent) {
    if (!content.includes('GoldIcon')) {
      content = `import { GoldIcon } from '@/components/ui/GoldIcon';\n` + content;
    }
    fs.writeFileSync(filePath, content);
    console.log(`Updated icons in ${filePath}`);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else {
      processFile(fullPath);
    }
  });
}

walkDir(directory);
walkDir(directory2);
console.log('Replaced Gold Icons!');
