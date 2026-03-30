jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

import { useCircadianStore } from '../circadianStore';

describe('circadianStore', () => {
  beforeEach(() => {
    useCircadianStore.setState({ isFetching: false, error: null });
  });

  it('has a grid property', () => {
    const state = useCircadianStore.getState();
    expect(state.grid).toBeDefined();
  });

  it('grid is a 2D array', () => {
    const { grid } = useCircadianStore.getState();
    expect(Array.isArray(grid)).toBe(true);
    if (grid.length > 0) {
      expect(Array.isArray(grid[0])).toBe(true);
    }
  });

  it('starts with isFetching false', () => {
    expect(useCircadianStore.getState().isFetching).toBe(false);
  });

  it('starts with null error', () => {
    expect(useCircadianStore.getState().error).toBeNull();
  });
});
