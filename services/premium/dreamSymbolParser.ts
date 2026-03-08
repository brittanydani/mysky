import { DREAM_SINGLE_WORD_SYMBOLS } from '../../constants/dreamSingularSymbols';
import { HALL_VAN_DE_CASTLE_FRAMEWORK } from '../../constants/dreamCodingFramework';

export interface ExtractedSymbol {
  word: string;
  category: string;
  description: string;
}

// Pre-compute maps for O(1) lookups
const symbolMap = new Map<string, string>();
let isInitialized = false;

function initializeDictionary() {
  if (isInitialized) return;
  for (const item of DREAM_SINGLE_WORD_SYMBOLS) {
    if (item.symbol) {
      // Store lowercase version
      symbolMap.set(item.symbol.toLowerCase(), item.category);
    }
  }
  isInitialized = true;
}

export function parseDreamSymbols(text: string): ExtractedSymbol[] {
  if (!text || text.trim().length === 0) return [];

  initializeDictionary();

  const lowerText = text.toLowerCase();
  
  // Extract all contiguous alphabetic words
  const words = lowerText.match(/[a-z]+/g) || [];
  const extracted = new Map<string, ExtractedSymbol>();

  // Helper to fetch description
  const getDescription = (categoryUrl: string) => {
    return (HALL_VAN_DE_CASTLE_FRAMEWORK.categories as any)[categoryUrl]?.description || 'A symbolic element in your dream.';
  };

  // 1. Check single words
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check exact word
    if (symbolMap.has(word)) {
      if (!extracted.has(word)) {
        extracted.set(word, {
          word,
          category: symbolMap.get(word)!,
          description: getDescription(symbolMap.get(word)!)
        });
      }
    } else {
      // Check singular (naive strip 's' or 'es')
      if (word.endsWith('s')) {
        let singular = word.slice(0, -1);
        if (word.endsWith('es') && !symbolMap.has(singular)) {
          singular = word.slice(0, -2);
        }
        if (symbolMap.has(singular)) {
          if (!extracted.has(singular)) {
            extracted.set(singular, {
              word: singular,
              category: symbolMap.get(singular)!,
              description: getDescription(symbolMap.get(singular)!)
            });
          }
        }
      }
    }
  }

  // 2. Check bigrams (two-word phrases) since some symbols might actually be two words
  // like "high school" or "sexual assault".
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + ' ' + words[i+1];
    if (symbolMap.has(bigram)) {
      if (!extracted.has(bigram)) {
        extracted.set(bigram, {
          word: bigram,
          category: symbolMap.get(bigram)!,
          description: getDescription(symbolMap.get(bigram)!)
        });
      }
    }
  }

  // 3. Trigrams
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = words[i] + ' ' + words[i+1] + ' ' + words[i+2];
    if (symbolMap.has(trigram)) {
      if (!extracted.has(trigram)) {
        extracted.set(trigram, {
          word: trigram,
          category: symbolMap.get(trigram)!,
          description: getDescription(symbolMap.get(trigram)!)
        });
      }
    }
  }

  return Array.from(extracted.values());
}
