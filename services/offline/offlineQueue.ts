import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../../utils/logger';

export type QueuedOperationType = 'journal_entry' | 'checkin' | 'preference';

export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
  payload: unknown;
  createdAt: number;
  retriesAttempted: number;
  lastError?: string;
}

export class OfflineQueue {
  private static readonly QUEUE_KEY = 'offline_queue_v1';
  private static readonly MAX_RETRIES = 5;
  private queue: QueuedOperation[] = [];
  private initialized = false;
  private isProcessing = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(OfflineQueue.QUEUE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      this.queue = Array.isArray(parsed) ? parsed : [];
      logger.info('[OfflineQueue] Loaded queued operations', { count: this.queue.length });
    } catch (error) {
      logger.error('[OfflineQueue] Failed to load queue', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.queue = [];
    } finally {
      this.initialized = true;
    }
  }

  async enqueue(
    operation: Omit<QueuedOperation, 'id' | 'createdAt' | 'retriesAttempted'>,
  ): Promise<string> {
    await this.initialize();

    const id = `op_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const queued: QueuedOperation = {
      ...operation,
      id,
      createdAt: Date.now(),
      retriesAttempted: 0,
    };

    this.queue.push(queued);
    await this.persist();

    logger.info('[OfflineQueue] Enqueued operation', { id, type: operation.type });
    return id;
  }

  async processQueue(executeOperation: (op: QueuedOperation) => Promise<void>): Promise<void> {
    await this.initialize();

    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      for (let index = 0; index < this.queue.length; index += 1) {
        const operation = this.queue[index];

        try {
          await executeOperation(operation);
          this.queue.splice(index, 1);
          index -= 1;
          await this.persist();
          logger.info('[OfflineQueue] Operation completed', { id: operation.id });
        } catch (error) {
          operation.retriesAttempted += 1;
          operation.lastError = error instanceof Error ? error.message : String(error);

          if (operation.retriesAttempted >= OfflineQueue.MAX_RETRIES) {
            logger.error('[OfflineQueue] Operation exceeded max retries', {
              id: operation.id,
              type: operation.type,
              error: operation.lastError,
            });
            this.queue.splice(index, 1);
            index -= 1;
          } else {
            logger.warn('[OfflineQueue] Operation failed, will retry later', {
              id: operation.id,
              type: operation.type,
              attempt: operation.retriesAttempted,
            });
          }

          await this.persist();
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getAllOperations(): QueuedOperation[] {
    return [...this.queue];
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(OfflineQueue.QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      logger.error('[OfflineQueue] Failed to persist queue', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const offlineQueue = new OfflineQueue();
