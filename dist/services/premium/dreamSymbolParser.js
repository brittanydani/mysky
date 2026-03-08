"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDreamSymbols = parseDreamSymbols;
var dreamSingularSymbols_1 = require("../../constants/dreamSingularSymbols");
var dreamCodingFramework_1 = require("../../constants/dreamCodingFramework");
// Pre-compute maps for O(1) lookups
var symbolMap = new Map();
var isInitialized = false;
function initializeDictionary() {
    if (isInitialized)
        return;
    for (var _i = 0, DREAM_SINGLE_WORD_SYMBOLS_1 = dreamSingularSymbols_1.DREAM_SINGLE_WORD_SYMBOLS; _i < DREAM_SINGLE_WORD_SYMBOLS_1.length; _i++) {
        var item = DREAM_SINGLE_WORD_SYMBOLS_1[_i];
        if (item.symbol) {
            // Store lowercase version
            symbolMap.set(item.symbol.toLowerCase(), item.category);
        }
    }
    isInitialized = true;
}
function parseDreamSymbols(text) {
    if (!text || text.trim().length === 0)
        return [];
    initializeDictionary();
    var lowerText = text.toLowerCase();
    // Extract all contiguous alphabetic words
    var words = lowerText.match(/[a-z]+/g) || [];
    var extracted = new Map();
    // Helper to fetch description
    var getDescription = function (categoryUrl) {
        var _a;
        return ((_a = dreamCodingFramework_1.HALL_VAN_DE_CASTLE_FRAMEWORK.categories[categoryUrl]) === null || _a === void 0 ? void 0 : _a.description) || 'A symbolic element in your dream.';
    };
    // 1. Check single words
    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        // Check exact word
        if (symbolMap.has(word)) {
            if (!extracted.has(word)) {
                extracted.set(word, {
                    word: word,
                    category: symbolMap.get(word),
                    description: getDescription(symbolMap.get(word))
                });
            }
        }
        else {
            // Check singular (naive strip 's' or 'es')
            if (word.endsWith('s')) {
                var singular = word.slice(0, -1);
                if (word.endsWith('es') && !symbolMap.has(singular)) {
                    singular = word.slice(0, -2);
                }
                if (symbolMap.has(singular)) {
                    if (!extracted.has(singular)) {
                        extracted.set(singular, {
                            word: singular,
                            category: symbolMap.get(singular),
                            description: getDescription(symbolMap.get(singular))
                        });
                    }
                }
            }
        }
    }
    // 2. Check bigrams (two-word phrases) since some symbols might actually be two words
    // like "high school" or "sexual assault".
    for (var i = 0; i < words.length - 1; i++) {
        var bigram = words[i] + ' ' + words[i + 1];
        if (symbolMap.has(bigram)) {
            if (!extracted.has(bigram)) {
                extracted.set(bigram, {
                    word: bigram,
                    category: symbolMap.get(bigram),
                    description: getDescription(symbolMap.get(bigram))
                });
            }
        }
    }
    // 3. Trigrams
    for (var i = 0; i < words.length - 2; i++) {
        var trigram = words[i] + ' ' + words[i + 1] + ' ' + words[i + 2];
        if (symbolMap.has(trigram)) {
            if (!extracted.has(trigram)) {
                extracted.set(trigram, {
                    word: trigram,
                    category: symbolMap.get(trigram),
                    description: getDescription(symbolMap.get(trigram))
                });
            }
        }
    }
    return Array.from(extracted.values());
}
