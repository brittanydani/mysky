import { HALL_VAN_DE_CASTLE_FRAMEWORK } from '../../constants/dreamCodingFramework';

export function mapDreamToFramework(text: string) {
  const normalizedText = text.toLowerCase();
  const words = normalizedText.match(/\b\w+\b/g) || [];
  
  const mappedContent: Record<string, string[]> = {};

  Object.keys(HALL_VAN_DE_CASTLE_FRAMEWORK.categories).forEach(cat => {
    mappedContent[cat] = [];
  });

  Object.entries(HALL_VAN_DE_CASTLE_FRAMEWORK.categories).forEach(([categoryKey, categoryData]) => {
    const foundWords = categoryData.subcategories.filter(kw => words.includes(kw.toLowerCase()));
    
    if (foundWords.length > 0) {
      mappedContent[categoryKey] = [...new Set([...mappedContent[categoryKey], ...foundWords])];
    }
  });

  return {
    text,
    coded_content: mappedContent
  };
}
