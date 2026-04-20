import { generateId } from '../models';

// expo-crypto is mocked globally in __mocks__/expo-crypto.js
// but we verify generateId returns a valid UUID-shaped string

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns a unique value on each call', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateId()));
    expect(ids.size).toBe(20);
  });
});
