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

const NEW_GRADIENT = "['#FFF4D6', '#E9D9B8', '#C5B493', '#9A8661', '#6E5E40']";

walk('.').forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  newContent = newContent.replace(/\[\s*'#FFF4D4',\s*'#C5B493',\s*'#8B6508'\s*\]/g, NEW_GRADIENT);
  newContent = newContent.replace(/\[\s*'#E8D5A8',\s*'#C5B493',\s*'#B8994F'\s*\]/g, NEW_GRADIENT);
  newContent = newContent.replace(/\[\s*'#FFF4D4',\s*'#C5B493'\s*\]/g, NEW_GRADIENT);
  newContent = newContent.replace(/\[\s*'#C5B493',\s*'#E9D9B8',\s*'#C5B493'\s*\]/g, NEW_GRADIENT);
  newContent = newContent.replace(/\[\s*'#C5B493',\s*'#C5B493',\s*'#8B7A3E'\s*\]/g, NEW_GRADIENT);

  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Audited + Fixed Secondary: ${file}`);
  }
});
