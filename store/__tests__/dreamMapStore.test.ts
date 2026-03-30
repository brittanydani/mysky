jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

import { useDreamMapStore } from '../dreamMapStore';

describe('dreamMapStore', () => {
  beforeEach(() => {
    useDreamMapStore.setState({ data: null, activeNode: null, isFetching: false, error: null });
  });

  it('starts with null data', () => {
    expect(useDreamMapStore.getState().data).toBeNull();
  });

  it('starts with null activeNode', () => {
    expect(useDreamMapStore.getState().activeNode).toBeNull();
  });

  it('setActiveNode sets the node', () => {
    const node = { id: 'n1', label: 'Water', color: '#00f', size: 10, recurrenceCount: 3, detail: 'test' };
    useDreamMapStore.getState().setActiveNode(node);
    expect(useDreamMapStore.getState().activeNode).toEqual(node);
  });

  it('clearActiveNode resets to null', () => {
    const node = { id: 'n1', label: 'Water', color: '#00f', size: 10, recurrenceCount: 3, detail: 'test' };
    useDreamMapStore.getState().setActiveNode(node);
    useDreamMapStore.getState().clearActiveNode();
    expect(useDreamMapStore.getState().activeNode).toBeNull();
  });

  it('clearCache resets data to null', () => {
    useDreamMapStore.setState({
      data: { nodes: [], links: [], lastSynced: '2025-01-01' },
    });
    useDreamMapStore.getState().clearCache();
    expect(useDreamMapStore.getState().data).toBeNull();
  });
});
