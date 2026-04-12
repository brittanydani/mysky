const fs = require('fs');
const path = require('path');
const file = fs.readFileSync('app/(tabs)/chart.tsx', 'utf8');
const imports = file.match(/import.*?from\s+['"]([^'"]+)['"]/g) || [];
imports.forEach(imp => {
  const match = imp.match(/from\s+['"]([^'"]+)['"]/);
  if (match) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      const fullPath = path.resolve('app/(tabs)', importPath);
      if (!fs.existsSync(fullPath + '.ts') && !fs.existsSync(fullPath + '.tsx') && !fs.existsSync(fullPath + '/index.ts') && !fs.existsSync(fullPath + '/index.tsx')) {
        console.log('Missing import:', importPath, '->', fullPath);
      }
    }
  }
});
