const fs = require('fs');
const path = require('path');

const dir = './constants/dream_symbols';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

let counts = [];

for (const file of files) {
  const filepath = path.join(dir, file);
  const content = fs.readFileSync(filepath, 'utf8');
  // Simple word count check
  const lines = content.split('\n');
  let count = 0;
  for(let line of lines) {
    if(line.includes(': [') || line.includes(':[')) {
      count++;
    }
  }
  counts.push({ cat: file.replace('.ts', ''), count });
}

counts.sort((a, b) => a.count - b.count);
let total = 0;
counts.forEach(c => {
  console.log(c.cat.padEnd(25) + c.count);
  total += c.count;
});
console.log('Total'.padEnd(25) + total);
