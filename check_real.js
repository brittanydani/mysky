const fs = require('fs');
const path = require('path');
const file = fs.readFileSync('app/(tabs)/chart.tsx', 'utf8');
const imports = file.match(/import.*?from\s+['"]([^'"]+)['"]/g) || [];
let OK = true;
imports.forEach(imp => {
  const match = imp.match(/from\s+['"]([^'"]+)['"]/);
  if (match) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      const fullPath = path.resolve('app/(tabs)', importPath);
      let found = false;
      ['.ts', '.tsx', '/index.ts', '/index.tsx'].forEach(ext => {
        if (fs.existsSync(fullPath + ext)) found = true;
      });
      if (!found) {
        console.log('Missing import:', importPath, '->', fullPath);
        OK = false;
      }
    }
  }
});
if (OK) console.log("All relative imports found.");
