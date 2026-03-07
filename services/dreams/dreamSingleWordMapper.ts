import { DREAM_SINGLE_WORD_SYMBOLS } from '../../constants/dreamSingularSymbols';

export function mapDreamToSingleWordFramework(text: string) {
  // Normalize text to lowercase and extract words, removing punctuation
  const normalizedText = text.toLowerCase();
  const words = normalizedText.match(/\b\w+\b/g) || [];
  
  // Create a fast lookup map grouping symbols strictly by category
  const mappedContent: Record<string, string[]> = {};

  // Find overlapping tokens
  words.forEach(word => {
    const symbolMatch = DREAM_SINGLE_WORD_SYMBOLS.find(s => s.symbol === word);
    if (symbolMatch) {
      if (!mappedContent[symbolMatch.category]) {
        mappedContent[symbolMatch.category] = [];
      }
      if (!mappedContent[symbolMatch.category].includes(word)) {
        mappedContent[symbolMatch.category].push(word);
      }
    }
  });

  return {
    text,
    tokens: words,
    coded_content: mappedContent
  };
}
