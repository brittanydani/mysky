/**
 * Shared types for the Trigger Log feature.
 * Kept separate from the React Native screen file so they can be
 * imported by utility modules and tests without triggering JSX transforms.
 */

export type LogMode = 'drain' | 'nourish';
export type NSState = 'sympathetic' | 'dorsal' | 'ventral' | 'still';

export interface TriggerEvent {
  id: string;
  timestamp: number;
  mode: LogMode;
  event: string;
  nsState: NSState;
  sensations: string[];
  // v2 fields — optional for backward compat
  intensity?: 1 | 2 | 3 | 4 | 5;
  resolution?: string;
  contextArea?: string;
  beforeState?: NSState;
}
