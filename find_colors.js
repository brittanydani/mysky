const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('assets') && !file.includes('ios') && !file.includes('android')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');
// Regex to find arrays containing hex colors.
const hexRegex = /\[([^\]]*#[a-fA-F0-9]{3,6}[^\]]*)\]/g;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  let matches = [];
  while ((match = hexRegex.exec(content)) !== null) {
      const lower = match[1].toLowerCase();
      if (lower.includes('c5b493') || lower.includes('b89b6a') || lower.includes('e8d5a8') || lower.includes('fff4d6')) {
        matches.push(match[0].trim());
      }
  }
  if (matches.length > 0) {
    console.log(`\n--- ${f} ---`);
    matches.forEach(m => console.log(m));
  }
});
