jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

import { useResonanceStore } from '../resonanceStore';

describe('resonanceStore', () => {
  beforeEach(() => {
    useResonanceStore.setState({ data: null, isFetching: false, error: null });
  });

  it('starts with null data', () => {
    expect(useResonanceStore.getState().data).toBeNull();
  });

  it('clearCache resets data to null', () => {
    useResonanceStore.setState({
      data: { userData: [1, 2, 3], partnerData: [4, 5, 6], lastSynced: '2025-01-01' },
    });
    useResonanceStore.getState().clearCache();
    expect(useResonanceStore.getState().data).toBeNull();
  });
});
