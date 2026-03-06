const fs = require('fs');
const content = fs.readFileSync('app/(tabs)/growth.tsx', 'utf8');

const regex = /export default function ReflectScreen\(\) \{[\s\S]*? \(\[checkIns, session\?\.access_token, isPremium\]\);/g;

// Instead of string replaces, I will generate a complete file using a generator.
