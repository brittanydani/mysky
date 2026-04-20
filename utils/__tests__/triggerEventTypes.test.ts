/**
 * triggerEventTypes.test.ts
 *
 * The module only exports types, so this file validates the shape of valid
 * TriggerEvent objects at the type level and confirms the module imports
 * without error.
 */
import type { TriggerEvent, LogMode, NSState } from '../triggerEventTypes';

describe('TriggerEvent type contract', () => {
  it('accepts a valid minimal TriggerEvent object', () => {
    const event: TriggerEvent = {
      id: 'evt-1',
      timestamp: Date.now(),
      mode: 'drain',
      event: 'Had a difficult conversation',
      nsState: 'sympathetic',
      sensations: ['chest tightness'],
    };
    expect(event.id).toBe('evt-1');
    expect(event.mode).toBe('drain');
    expect(event.nsState).toBe('sympathetic');
  });

  it('accepts a nourish-mode event', () => {
    const event: TriggerEvent = {
      id: 'evt-2',
      timestamp: Date.now(),
      mode: 'nourish',
      event: 'Morning walk',
      nsState: 'ventral',
      sensations: ['warmth', 'ease'],
      intensity: 4,
      resolution: 'Felt grounded afterwards',
      contextArea: 'body',
      beforeState: 'dorsal',
    };
    expect(event.mode).toBe('nourish');
    expect(event.intensity).toBe(4);
  });

  it('LogMode values are "drain" or "nourish"', () => {
    const modes: LogMode[] = ['drain', 'nourish'];
    expect(modes).toContain('drain');
    expect(modes).toContain('nourish');
  });

  it('NSState values include all four states', () => {
    const states: NSState[] = ['sympathetic', 'dorsal', 'ventral', 'still'];
    expect(states).toHaveLength(4);
  });
});
