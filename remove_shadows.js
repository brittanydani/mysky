const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

const allFiles = [...getFiles('app'), ...getFiles('components')];
const tsxFiles = allFiles.filter(f => f.endsWith('.tsx'));
let modifiedCount = 0;

for (const file of tsxFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Remove individual shadow properties
  content = content.replace(/shadowColor:\s*['"]?[^'",\s\}]+['"]?,/g, "");
  content = content.replace(/shadowOffset:\s*\{[^}]+\},/g, "");
  content = content.replace(/shadowOpacity:\s*[0-9.]+,/g, "");
  content = content.replace(/shadowRadius:\s*[0-9.]+,/g, "");
  content = content.replace(/elevation:\s*[0-9.]+,/g, "");

  // Fallback for when they are at the end of the object without comma
  content = content.replace(/shadowColor:\s*['"]?[^'",\s\}]+['"]?/g, "");
  content = content.replace(/shadowOffset:\s*\{[^}]+\}/g, "");
  content = content.replace(/shadowOpacity:\s*[0-9.]+/g, "");
  content = content.replace(/shadowRadius:\s*[0-9.]+/g, "");
  content = content.replace(/elevation:\s*[0-9.]+/g, "");

  content = content.replace(/boxShadow:\s*['"]?[^'",\s\}]+['"]?,?/g, "");

  // Replace usage of glows and soft shadows spreads
  content = content.replace(/\.\.\.theme\.shadows\.soft,?\s*/g, "");
  content = content.replace(/\.\.\.theme\.shadows\.glow,?\s*/g, "");

  // Any remaining stray empty styles that caused commas might be invalid json, 
  // but React Native style objects usually survive a trailing comma or missing properties.

  if (content !== original) {
    fs.writeFileSync(file, content);
    modifiedCount++;
  }
}
console.log('Modified ' + modifiedCount + ' files to remove shadow properties.');