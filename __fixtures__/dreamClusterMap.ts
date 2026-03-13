/**
 * Demo / fixture data for DreamClusterMap.
 * Used by screenshot generation and visual regression tests only.
 * Must NOT be imported by production component code.
 */
import type { DreamNode } from '../components/ui/DreamClusterMap';

export const DEFAULT_DREAM_NODES: DreamNode[] = [
  { id: 'water',     label: 'Water',     frequency: 8, tone: 'mystery',    coOccursWith: ['house', 'light'] },
  { id: 'house',     label: 'House',     frequency: 7, tone: 'connection', coOccursWith: ['water', 'people'] },
  { id: 'pursuit',   label: 'Pursuit',   frequency: 6, tone: 'fear',       coOccursWith: ['falling'] },
  { id: 'animals',   label: 'Animals',   frequency: 5, tone: 'adventure',  coOccursWith: ['light'] },
  { id: 'childhood', label: 'Childhood', frequency: 7, tone: 'longing',    coOccursWith: ['house', 'people'] },
  { id: 'people',    label: 'People',    frequency: 9, tone: 'connection', coOccursWith: ['house', 'childhood'] },
  { id: 'path',      label: 'Path',      frequency: 4, tone: 'adventure',  coOccursWith: ['pursuit'] },
  { id: 'light',     label: 'Light',     frequency: 5, tone: 'joy',        coOccursWith: ['water', 'animals'] },
  { id: 'falling',   label: 'Falling',   frequency: 4, tone: 'fear',       coOccursWith: ['pursuit'] },
  { id: 'memory',    label: 'Memory',    frequency: 6, tone: 'longing',    coOccursWith: ['childhood'] },
];
