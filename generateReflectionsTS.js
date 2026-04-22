const fs = require('fs');
const content = fs.readFileSync('account-b-daily-reflection-schedule.md', 'utf-8');

const lines = content.split('\n');
let tsContent = `\n// ── Real Account B Reflections ──────────────────────────────────────────\n`;
tsContent += `// To use, fill in the 'answer' fields with one of:\n`;
tsContent += `// 'Not True', 'Somewhat', 'True', 'Very True'\n`;
tsContent += `export const ACCOUNT_B_REFLECTIONS = [\n`;

let currentDate = '';
let currentCategory = '';

for (const line of lines) {
  const dayMatch = line.match(/### Day \d+ \((.*?)\)/);
  if (dayMatch) {
    currentDate = dayMatch[1];
    tsContent += `\n  // Day: ${currentDate}\n`;
    continue;
  }
  
  const catMatch = line.match(/^- (values|archetypes|cognitive|intelligence):/);
  if (catMatch) {
    currentCategory = catMatch[1];
    continue;
  }
  
  const questionMatch = line.match(/^  - (.*?)$/);
  if (questionMatch && currentDate && currentCategory) {
    const text = questionMatch[1].replace(/'/g, "\\'");
    tsContent += `  { date: '${currentDate}', category: '${currentCategory}', answer: '', questionText: '${text}' },\n`;
  }
}

tsContent += `];\n`;

fs.appendFileSync('services/storage/demoAccountBSeed.ts', tsContent);
console.log('Appended ACCOUNT_B_REFLECTIONS to demoAccountBSeed.ts');
