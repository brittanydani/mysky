const fs = require('fs');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('assets') && !file.includes('ios') && !file.includes('android')) {
        results = results.concat(walk(file));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('./app').concat(walk('./components'));
let gradients = new Set();
let fileMapping = {};

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // Find color arrays containing #[hex] elements. This is an approximation.
  const hexArrayRegex = /\[(\s*'#[A-Fa-f0-9]{3,8}'\s*,?\s*)+\]/g;
  let matches = content.match(hexArrayRegex);
  
  if (matches) {
    matches.forEach(m => {
      const normalized = m.replace(/\s+/g, '');
      gradients.add(normalized);
      if (!fileMapping[normalized]) fileMapping[normalized] = [];
      if (!fileMapping[normalized].includes(f)) fileMapping[normalized].push(f);
    });
  }
});

let foundAnything = false;
for (let g of gradients) {
  // Try to find yellow/gold/orange-ish hexes or older gradients that look gold-y
  // Looking for ones that might be pill buttons, etc that got missed.
  const goldHexes = /#(F+D*|E+D*|C+B*|D+A*|E+A*)[A-F0-9]{2,4}/i;
  // If it has yellow/gold in it, print
  if (goldHexes.test(g) && !g.includes('FFF4D6') && !g.includes('C5B493')) {
    console.log(g);
    fileMapping[g].forEach(f => console.log('  ' + f));
    foundAnything = true;
  }
}

if (!foundAnything) console.log("No extra gold-ish gradients found based on hex heuristic.");
