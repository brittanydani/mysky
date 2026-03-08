import { DREAM_SINGLE_WORD_SYMBOLS } from '../../constants/dreamSingularSymbols';
import { HALL_VAN_DE_CASTLE_FRAMEWORK } from '../../constants/dreamCodingFramework';

export interface ExtractedSymbol {
  word: string;
  category: string;
  description: string;
}

export function parseDreamSymbols(text: string): ExtractedSymbol[] {
  if (!text || text.trim().length === 0) return [];

  const lowerText = text.toLowerCase();
  const extracted: Map<string, ExtractedSymbol> = new Map();

  for (const item of DREAM_SINGLE_WORD_SYMBOLS) {
    if (!item.symbol) continue;
    const symbolText = item.symbol.toLowerCase();
    
    // Very basic word boundary check
    // We replace regex to strictly match the word (including plural if simple)
    const regex = new RegExp(`(?:\\b|^)${symbolText}(?:s|es)?(?:\\b|$)`, 'i');
    
    if (regex.test(lowerText)) {
      let description = '';
      for (const catKey of Object.keys(HALL_VAN_DE_CASTLE_FRAMEWORK.categories)) {
         if (catKey === item.category) {
            description = (HALL_VAN_DE_CASTLE_FRAMEWORK.categories as any)[catKey].description;
            break;
         }
      }

      if (!extracted.has(item.symbol)) {
        extracted.set(item.symbol, {
          word: item.symbol,
          category: item.category,
          description: description || 'A symbolic element in your dream.',
        });
      }
    }
  }

  return Array.from(extracted.values());
}
