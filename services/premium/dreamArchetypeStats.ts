import { extractSymbols, DREAM_SYMBOLS, DreamArchetype } from '../../constants/dreamSymbols';
import { SleepEntry } from '../storage/models'; // Adjust path if needed

export interface ArchetypeBalance {
  imbalanceType: 'shadow_dominant' | 'threshold_stuck' | 'anima_dominant' | 'balanced' | 'insufficient_data';
  insightTitle: string;
  insightContent: string;
}

/**
 * Analyzes recent dream texts to determine if the user has an archetypal imbalance.
 */
export function calculateArchetypalBalance(recentDreams: SleepEntry[]): ArchetypeBalance {
  // We need at least 3 recent dreams with text to form a reliable pattern
  const dreamsWithText = recentDreams.filter(d => Boolean(d.dreamText && d.dreamText.trim()));
  
  if (dreamsWithText.length < 3) {
    return {
      imbalanceType: 'insufficient_data',
      insightTitle: '',
      insightContent: ''
    };
  }

  // Count the occurrences of each archetype across recent dreams
  const counts: Record<DreamArchetype, number> = {
    Shadow: 0,
    Self: 0,
    Anima: 0,
    Persona: 0,
    Threshold: 0,
    Transformation: 0,
    Integration: 0
  };

  let totalSymbols = 0;

  for (const entry of dreamsWithText) {
    if (!entry.dreamText) continue;
    
    const symbols = extractSymbols(entry.dreamText);
    for (const symbolKey of symbols) {
      const def = DREAM_SYMBOLS[symbolKey];
      if (def) {
        counts[def.archetype]++;
        totalSymbols++;
      }
    }
  }

  if (totalSymbols === 0) {
    return {
      imbalanceType: 'insufficient_data',
      insightTitle: '',
      insightContent: ''
    };
  }

  // Calculate percentages
  const shadowPct = counts.Shadow / totalSymbols;
  const integrationPct = counts.Integration / totalSymbols;
  const thresholdPct = counts.Threshold / totalSymbols;
  const animaPct = counts.Anima / totalSymbols;

  // Rule 1: High Shadow, Low Integration -> Avoidance / Unmet needs
  if (shadowPct > 0.4 && integrationPct < 0.1) {
    return {
      imbalanceType: 'shadow_dominant',
      insightTitle: 'Healing: The Unseen Shadow',
      insightContent: 'Your recent dreams feature many \'Shadow\' symbols but lack \'Integration\'. Is there a feeling, truth, or part of yourself you are currently avoiding in your waking life that is asking to be acknowledged?'
    };
  }

  // Rule 2: High Threshold -> Stuck in Liminality / Transition
  if (thresholdPct > 0.5) {
    return {
      imbalanceType: 'threshold_stuck',
      insightTitle: 'Guidance: Navigating the Threshold',
      insightContent: 'Your inner world is heavily focused on themes of transition, being lost, or falling. You are in a liminal space. What are you releasing before you feel fully ready, and what hasn\'t yet found its landing place?'
    };
  }

  // Rule 3: High Anima (Intuition/Wildness) -> Tuning into instinct
  if (animaPct > 0.4) {
    return {
      imbalanceType: 'anima_dominant',
      insightTitle: 'Insight: Trusting the Wild',
      insightContent: 'Your dreams are currently rich with symbols of intuition, independence, and instinct. You are navigating something that requires trusting your own inner compass over external expectations.'
    };
  }

  // Default: Relatively balanced or moving through healthy transformation
  return {
    imbalanceType: 'balanced',
    insightTitle: 'Dreamscape: Balanced Integration',
    insightContent: 'Your recent dream symbols show a healthy balance of confronting the unknown and integrating deep emotional processing. Your inner architecture is steadily expanding.'
  };
}
