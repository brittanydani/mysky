const fs = require('fs');

const servicePath = 'services/storage/demoAccountBSeedService.ts';
let code = fs.readFileSync(servicePath, 'utf8');

// Insert imports at top
const imports = `import { VALUES_QUESTIONS, ARCHETYPE_QUESTIONS, COGNITIVE_QUESTIONS, INTELLIGENCE_QUESTIONS } from '../../constants/dailyReflectionQuestions';
import { ACCOUNT_B_REFLECTIONS } from './demoAccountBSeed';
`;
code = code.replace(/import \{ ACCOUNT_B_DEMO_SEED \} from '\.\/demoAccountBSeed';/, `import { ACCOUNT_B_DEMO_SEED } from './demoAccountBSeed';\n${imports}`);

// Build the logic
const reflectionLogic = `

    const SCALES: Record<string, number> = { 'Not True': 0, 'Somewhat': 1, 'True': 2, 'Very True': 3 };
    const validAnswers = ACCOUNT_B_REFLECTIONS.filter(r => r.answer !== '');
    
    if (validAnswers.length > 0) {
      const answersToSave = validAnswers.map((r, i) => {
        let bank;
        if (r.category === 'values') bank = VALUES_QUESTIONS;
        else if (r.category === 'archetypes') bank = ARCHETYPE_QUESTIONS;
        else if (r.category === 'cognitive') bank = COGNITIVE_QUESTIONS;
        else bank = INTELLIGENCE_QUESTIONS;
        
        return {
          questionId: bank.indexOf(r.questionText),
          category: r.category,
          questionText: r.questionText,
          answer: r.answer,
          scaleValue: SCALES[r.answer as string] ?? 1,
          date: r.date,
          sealedAt: new Date(r.date + 'T21:00:00.000Z').toISOString(),
        };
      });

      await EncryptedAsyncStorage.setItem('@mysky:daily_reflections', JSON.stringify({
        answers: answersToSave,
        totalDaysCompleted: Math.max(...validAnswers.map(r => dayNumber(new Date(r.date + 'T12:00:00.000Z')))) - dayNumber(new Date(validAnswers[0].date + 'T12:00:00.000Z')) + 1,
        startedAt: new Date(validAnswers[0].date + 'T12:00:00.000Z').toISOString(),
      }));
    }
`;

code = code.replace(/          dynamicNote: entry\.dynamicNote,\n        \}\)\),\n      \),\n    \);/, \`          dynamicNote: entry.dynamicNote,\\n        })),\\n      ),\\n    );\\n\$"{reflectionLogic}"\`);

fs.writeFileSync(servicePath, code);
