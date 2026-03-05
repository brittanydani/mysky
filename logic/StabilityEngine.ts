/**
 * Stability Engine
 * Calculates the 'Delta' (change) in the Stability Index.
 * Weights the Triad input against the active Circadian Window.
 */

export interface TriadMetrics {
  mood: number;   // 0.0 - 1.0
  energy: number; // 0.0 - 1.0
  stress: number; // 0.0 - 1.0
}

export const calculateStabilityDelta = (
  input: TriadMetrics, 
  activeWindow: 'Gold' | 'Silver' | 'Indigo'
) => {
  // Define 'Ideal' states for each window
  const targets = {
    Gold:   { mood: 0.8, energy: 0.9, stress: 0.2 }, // High focus
    Silver: { mood: 0.9, energy: 0.6, stress: 0.3 }, // Social presence
    Indigo: { mood: 0.7, energy: 0.2, stress: 0.1 }, // Deep rest
  };

  const target = targets[activeWindow];

  // Calculate the Euclidean distance (the 'Stress' on the system)
  const variance = Math.sqrt(
    Math.pow(input.mood - target.mood, 2) +
    Math.pow(input.energy - target.energy, 2) +
    Math.pow(input.stress - target.stress, 2)
  );

  // A variance of 0 means perfect alignment (+1.0 Delta)
  // High variance means a drift toward imbalance (-Delta)
  const rawDelta = 1.0 - (variance * 2); 
  
  return parseFloat(rawDelta.toFixed(2));
};
