import { PersonalityProfile } from '../../constants/personalityProfiles';
import { DreamSymbol } from '../../constants/dreamSymbols';

export interface InterpretationRequest {
  extractedSymbols: Array<{
    id: string;
    symbol: DreamSymbol;
    variant: string;
  }>;
  profile: PersonalityProfile;
}

export interface ReflectionResponse {
  /** The atmospheric opening thought */
  opening: string;
  /** The core synthesis of the symbols */
  synthesis: string;
  /** The precise psychological mirror application */
  mirror: string;
  /** The closing thought to sit with */
  closing: string;
  /** The full compiled prose for easy rendering */
  fullProse: string;
  /** The jewel-tone accent color for the interpretation card */
  primaryAuraColor: string;
  /** The standalone "Inner Architecture" insight statement */
  innerArchitectureInsight: string;
}

export class DreamInterpreterService {
  /**
   * Generates a cinematic, highly customized dream reflection using
   * the user's astrological/psychological profile and the picked variants.
   */
  public generateReflection(request: InterpretationRequest): ReflectionResponse {
    const { extractedSymbols, profile } = request;

    if (!extractedSymbols || extractedSymbols.length === 0) {
      return this.generateFallbackReflection(profile);
    }

    const opening = this.generateOpening(extractedSymbols[0].symbol, profile);
    const synthesis = this.generateSynthesis(extractedSymbols);
    const mirror = this.generateMirror(extractedSymbols, profile);
    const closing = this.generateClosing(profile);

    const fullProse = `${opening}\n\n${synthesis}\n\n${mirror}\n\n${closing}`;

    const innerArchitectureInsight = `Your inner landscape is built for ${profile.coreMotivation}. When life feels heavy, you tend to ${profile.tensionResponse}. Remember that your recurring work is to ${profile.wrestlingTheme}.`;
    const primaryAuraColor = this.determineAuraColor(extractedSymbols, profile);

    return {
      opening,
      synthesis,
      mirror,
      closing,
      fullProse,
      innerArchitectureInsight,
      primaryAuraColor
    };
  }

  private determineAuraColor(extractedSymbols: Array<{id: string, symbol: DreamSymbol, variant: string}>, profile: PersonalityProfile): string {
    // Default to Moon/Emotional Style (Silver-Blue)
    let color = '#8BC4E8'; // Silver-Blue aura

    // For a more advanced implementation, the dominant trait of the dream
    // could shift this color. For now, we apply basic logic.
    if (extractedSymbols.some(s => s.id === 'chase' || s.id === 'confrontation')) {
        color = '#CD7F5D'; // Mars Copper
    } else if (extractedSymbols.some(s => s.id === 'shadow' || s.id === 'threshold')) {
        color = '#9D76C1'; // Saturn Amethyst
    } else if (profile.coreMotivation) { // Sun element as secondary fallback if needed
        color = '#D8C39A'; // Champagne Gold aura
    }

    return color;
  }

  private generateOpening(primarySymbol: DreamSymbol, profile: PersonalityProfile): string {
    return `You mentioned ${primarySymbol.label.toLowerCase()}. Given your tendency to ${profile.givenPhrase}, this inner architecture often emerges when you are processing the deeper layers of your waking life.`;
  }

  private generateSynthesis(extractedSymbols: Array<{id: string, symbol: DreamSymbol, variant: string}>): string {
    // Weave the meanings together without sounding mechanical
    const variants = extractedSymbols.map(s => s.variant.toLowerCase());
    
    if (variants.length === 1) {
      return `There is a clear theme of ${variants[0]} playing out in this space.`;
    }
    
    if (variants.length === 2) {
      return `Notice the quiet dialogue between ${variants[0]} and ${variants[1]}. These elements rarely appear together by accident.`;
    }

    // 3 or more
    const primary = variants[0];
    const secondary = variants.slice(1).join(', and ');
    return `At the center, there is an exploration of ${primary}, surrounded by the shifting weight of ${secondary}. It is a complex ecosystem of meaning.`;
  }

  private generateMirror(extractedSymbols: Array<{id: string, symbol: DreamSymbol, variant: string}>, profile: PersonalityProfile): string {
    const primaryVariant = extractedSymbols[0].variant.toLowerCase();
    
    return `In waking life, you ${profile.coreMotivation}, yet when under pressure, you ${profile.tensionResponse}. This landscape is likely a safe space your mind has built to reconcile your need to approach this ${primaryVariant} with your natural instinct to ${profile.emotionalStyle}.`;
  }

  private generateClosing(profile: PersonalityProfile): string {
    return `Take a moment with this. Your recurring work is to ${profile.wrestlingTheme}—and this reflection is simply a mirror for that ongoing journey.`;
  }

  private generateFallbackReflection(profile: PersonalityProfile): ReflectionResponse {
    const text = `Given your tendency to ${profile.givenPhrase}, it's natural for your inner world to occasionally rest rather than reveal. Your recurring work is to ${profile.wrestlingTheme}, and sometimes the mind simply needs space to process without forcing a profound answer.`;
    
    const innerArchitectureInsight = `Your inner landscape is built for ${profile.coreMotivation}. When life feels heavy, you tend to ${profile.tensionResponse}. Remember that your recurring work is to ${profile.wrestlingTheme}.`;
    
    return {
      opening: "Your reflection was entirely ambient.",
      synthesis: "No distinct forms emerged this time.",
      mirror: `In life, you ${profile.coreMotivation}.`,
      closing: text,
      fullProse: text,
      innerArchitectureInsight,
      primaryAuraColor: '#8BC4E8' // Default Moon/Emotional style color
    };
  }
}

export const dreamInterpreterService = new DreamInterpreterService();
