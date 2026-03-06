const fs = require('fs');

let text = fs.readFileSync('components/ui/NatalChartWheelSkia.tsx', 'utf8');

const inserts = {
    'PLANET_COLORS': `  Chiron: '#A0B090',
  'North Node': '#C5B493',
  'South Node': '#C5B493',
  'Part of Fortune': '#E8D7A6',
  Lilith: '#8068C0',
  Vertex: '#C5B493',`,
    'PLANET_GRADIENT_INNER': `  Chiron: '#C8D8B8',
  'North Node': '#E8D7A6',
  'South Node': '#E8D7A6',
  'Part of Fortune': '#F0E8C8',
  Lilith: '#A894E4',
  Vertex: '#E8D7A6',`,
    'PLANET_GRADIENT_OUTER': `  Chiron: '#687858',
  'North Node': '#7E6330',
  'South Node': '#7E6330',
  'Part of Fortune': '#907C50',
  Lilith: '#504090',
  Vertex: '#7E6330',`,
    'OVERLAY_PLANET_COLORS': `  Chiron: '#90B0A0',
  'North Node': '#8C7CCF',
  'South Node': '#8C7CCF',
  'Part of Fortune': '#A89CE0',
  Lilith: '#7058B0',
  Vertex: '#8C7CCF',`,
    'OVERLAY_GRADIENT_INNER': `  Chiron: '#B8D8C8',
  'North Node': '#C4B8F0',
  'South Node': '#C4B8F0',
  'Part of Fortune': '#D0C8F8',
  Lilith: '#9080E0',
  Vertex: '#C4B8F0',`,
    'OVERLAY_GRADIENT_OUTER': `  Chiron: '#587868',
  'North Node': '#5E4B94',
  'South Node': '#5E4B94',
  'Part of Fortune': '#7060A0',
  Lilith: '#403070',
  Vertex: '#5E4B94',`
};

for (const [name, colorStr] of Object.entries(inserts)) {
    const regex = new RegExp(`(const ${name}: Record<string, string> = \\{(?:[\\s\\S]*?)Pluto: [^,]+,)`, 'g');
    text = text.replace(regex, `$1\n${colorStr}`);
}

fs.writeFileSync('components/ui/NatalChartWheelSkia.tsx', text);
console.log('done');
