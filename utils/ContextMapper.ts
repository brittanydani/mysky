/**
 * Maps the Triad puck position to a specific life context.
 * This ensures data in the Archive is tagged for longitudinal analysis.
 */

export type LifeContext = 'Development' | 'Parenting' | 'Recovery' | 'Social';

export const getContextualWeight = (
  puck: { x: number, y: number }, 
  currentWindow: 'Gold' | 'Silver' | 'Indigo'
): LifeContext => {
  // Logic: If you are in a "Gold" window but your Triad is pulled 
  // heavily toward "Stress," the app tags it as "Work-Related Pressure."
  
  if (currentWindow === 'Gold') return 'Development';
  if (currentWindow === 'Silver') return 'Parenting';
  return 'Recovery';
};
