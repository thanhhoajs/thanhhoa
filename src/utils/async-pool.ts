import { LRUCache } from 'lru-cache';
import { Logger } from '@thanhhoajs/logger';

interface PoolMetrics {
  totalExecuted: number;
  totalErrors: number;
  avgExecutionTime: number;
  currentSize: number;
  peakSize: number;
}

export class AsyncPool {
  private pool: Set<Promise<any>> = new Set();
  private metrics: PoolMetrics = {
    totalExecuted: 0,
    totalErrors: 0,
    avgExecutionTime: 0,
    currentSize: 0,
    peakSize: 0,
  };
  private logger = Logger.get('AsyncPool');
  private readonly errorWindow = 60000; // 1 minute
  private errors: number[] = [];

  constructor(private maxSize: number) {}

  get size(): number {
    return this.pool.size;
  }

  get stats(): PoolMetrics {
    return { ...this.metrics };
  }

  get errorRate(): number {
    const now = Date.now();
    this.errors = this.errors.filter((time) => now - time < this.errorWindow);
    return this.errors.length / this.maxSize;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    while (this.pool.size >= this.maxSize) {
      const completed = await Promise.race([
        Promise.race(Array.from(this.pool)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Pool timeout')), 5000),
        ),
      ]).catch(() => null);

      if (completed) {
        break;
      }
    }

    const start = performance.now();
    const promise = fn().finally(() => {
      this.pool.delete(promise);
      this.metrics.currentSize = this.pool.size;
    });

    this.pool.add(promise);
    this.metrics.currentSize = this.pool.size;
    this.metrics.peakSize = Math.max(
      this.metrics.peakSize,
      this.metrics.currentSize,
    );

    try {
      const result = await promise;
      this.updateMetrics(start);
      return result;
    } catch (error) {
      this.errors.push(Date.now());
      this.metrics.totalErrors++;
      this.logger.error('Task execution failed:', error);
      throw error;
    }
  }

  private updateMetrics(start: number) {
    this.metrics.totalExecuted++;
    const executionTime = performance.now() - start;
    this.metrics.avgExecutionTime =
      (this.metrics.avgExecutionTime * (this.metrics.totalExecuted - 1) +
        executionTime) /
      this.metrics.totalExecuted;
  }

  async cleanup(): Promise<void> {
    try {
      await Promise.all(Array.from(this.pool));
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    } finally {
      this.pool.clear();
    }
  }

  [Symbol.iterator](): Iterator<Promise<any>> {
    return this.pool[Symbol.iterator]();
  }

  printStats(): void {
    this.logger.trace('AsyncPool Stats:', {
      currentSize: this.metrics.currentSize,
      peakSize: this.metrics.peakSize,
      totalExecuted: this.metrics.totalExecuted,
      totalErrors: this.metrics.totalErrors,
      avgExecutionTime: `${this.metrics.avgExecutionTime.toFixed(2)}ms`,
    });
  }
}
