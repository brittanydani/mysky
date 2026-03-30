jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

import { useCorrelationStore } from '../correlationStore';

describe('correlationStore', () => {
  beforeEach(() => {
    useCorrelationStore.setState({ correlations: [], isFetching: false, error: null });
  });

  it('starts with empty correlations', () => {
    expect(useCorrelationStore.getState().correlations).toEqual([]);
  });

  it('can store correlation pairs', () => {
    useCorrelationStore.setState({
      correlations: [
        { metric_a: 'mood', metric_b: 'sleep', correlation: 0.7 },
        { metric_a: 'stress', metric_b: 'energy', correlation: -0.4 },
      ],
    });
    const pairs = useCorrelationStore.getState().correlations;
    expect(pairs).toHaveLength(2);
    expect(pairs[0].correlation).toBe(0.7);
    expect(pairs[1].correlation).toBe(-0.4);
  });
});
