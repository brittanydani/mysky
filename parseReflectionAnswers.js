const fs = require('fs');

const servicePath = 'services/storage/demoAccountBSeedService.ts';
let code = fs.readFileSync(servicePath, 'utf8');

// Replace the demo seed import with the expanded import block
const oldImport = `import { ACCOUNT_B_DEMO_SEED } from './demoAccountBSeed';`;
const newImport = `import { ACCOUNT_B_DEMO_SEED, ACCOUNT_B_REFLECTIONS } from './demoAccountBSeed';
import {
  VALUES_QUESTIONS,
  ARCHETYPE_QUESTIONS,
  COGNITIVE_QUESTIONS,
  INTELLIGENCE_QUESTIONS,
} from '../../constants/dailyReflectionQuestions';`;

if (code.includes(oldImport) && !code.includes('ACCOUNT_B_REFLECTIONS')) {
  code = code.replace(oldImport, newImport);
}

// Reflection persistence logic to inject
const reflectionLogic = `

    const SCALES: Record<string, number> = {
      'Not True': 0,
      'Somewhat': 1,
      'True': 2,
      'Very True': 3,
    };

    const validAnswers = ACCOUNT_B_REFLECTIONS.filter((r) => r.answer !== '');

    if (validAnswers.length > 0) {
      const dayNumber = (date: Date) => Math.floor(date.getTime() / 86400000);

      const answersToSave = validAnswers.map((r) => {
        let bank: string[];

        if (r.category === 'values') bank = VALUES_QUESTIONS;
        else if (r.category === 'archetypes') bank = ARCHETYPE_QUESTIONS;
        else if (r.category === 'cognitive') bank = COGNITIVE_QUESTIONS;
        else bank = INTELLIGENCE_QUESTIONS;

        return {
          questionId: bank.indexOf(r.questionText),
          category: r.category,
          questionText: r.questionText,
          answer: r.answer,
          scaleValue: SCALES[r.answer] ?? 1,
          date: r.date,
          sealedAt: new Date(r.date + 'T21:00:00.000Z').toISOString(),
        };
      });

      await EncryptedAsyncStorage.setItem(
        '@mysky:daily_reflections',
        JSON.stringify({
          answers: answersToSave,
          totalDaysCompleted:
            Math.max(
              ...validAnswers.map((r) =>
                dayNumber(new Date(r.date + 'T12:00:00.000Z'))
              )
            ) -
              dayNumber(new Date(validAnswers[0].date + 'T12:00:00.000Z')) +
            1,
          startedAt: new Date(
            validAnswers[0].date + 'T12:00:00.000Z'
          ).toISOString(),
        })
      );
    }
`;

// Inject the logic after the block you were targeting
const targetBlock = `          dynamicNote: entry.dynamicNote,
        })),
      ),
    );`;

if (code.includes(targetBlock) && !code.includes("@mysky:daily_reflections")) {
  code = code.replace(targetBlock, `${targetBlock}${reflectionLogic}`);
}

fs.writeFileSync(servicePath, code);
console.log('Updated demoAccountBSeedService.ts');
