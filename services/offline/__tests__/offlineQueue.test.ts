const store = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    store.set(key, value);
    return Promise.resolve();
  }),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineQueue, type QueuedOperation } from '../offlineQueue';
import { logger } from '../../../utils/logger';

describe('OfflineQueue', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  it('loads persisted operations on initialize', async () => {
    store.set(
      'offline_queue_v1',
      JSON.stringify([
        {
          id: 'op_1',
          type: 'journal_entry',
          payload: { id: 'entry_1' },
          createdAt: 1,
          retriesAttempted: 0,
        },
      ]),
    );

    const queue = new OfflineQueue();
    await queue.initialize();

    expect(queue.getQueueLength()).toBe(1);
    expect(queue.getAllOperations()[0].id).toBe('op_1');
  });

  it('falls back to an empty queue when persisted storage is invalid', async () => {
    store.set('offline_queue_v1', '{bad json');

    const queue = new OfflineQueue();
    await queue.initialize();

    expect(queue.getQueueLength()).toBe(0);
    expect(logger.error).toHaveBeenCalledWith('[OfflineQueue] Failed to load queue', {
      error: expect.any(String),
    });
  });

  it('enqueues and persists operations', async () => {
    const queue = new OfflineQueue();

    const id = await queue.enqueue({
      type: 'checkin',
      payload: { checkIn: { id: 'checkin_1' } },
    });

    expect(id).toMatch(/^op_/);
    expect(queue.getQueueLength()).toBe(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'offline_queue_v1',
      expect.stringContaining('"type":"checkin"'),
    );
  });

  it('processes successful operations and removes them from the queue', async () => {
    const queue = new OfflineQueue();
    await queue.enqueue({ type: 'journal_entry', payload: { id: 'entry_1' } });
    await queue.enqueue({ type: 'preference', payload: { id: 'pref_1' } });

    const execute = jest.fn(async (_op: QueuedOperation) => {});
    await queue.processQueue(execute);

    expect(execute).toHaveBeenCalledTimes(2);
    expect(queue.getQueueLength()).toBe(0);
  });

  it('keeps failed operations until max retries, then drops them', async () => {
    const queue = new OfflineQueue();
    await queue.enqueue({ type: 'journal_entry', payload: { id: 'entry_1' } });

    const execute = jest.fn(() => Promise.reject(new Error('offline')));

    for (let i = 0; i < 4; i += 1) {
      await queue.processQueue(execute);
      expect(queue.getQueueLength()).toBe(1);
    }

    await queue.processQueue(execute);

    expect(queue.getQueueLength()).toBe(0);
    expect(logger.error).toHaveBeenCalledWith('[OfflineQueue] Operation exceeded max retries', {
      id: expect.any(String),
      type: 'journal_entry',
      error: 'offline',
    });
  });
});
