export class AsyncPool implements Iterable<Promise<any>> {
  private pool = new Set<Promise<any>>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get size(): number {
    return this.pool.size;
  }

  add(promise: Promise<any>): void {
    this.pool.add(promise);
    promise.finally(() => this.pool.delete(promise));
  }

  delete(promise: Promise<any>): boolean {
    return this.pool.delete(promise);
  }

  [Symbol.iterator](): Iterator<Promise<any>> {
    return this.pool[Symbol.iterator]();
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    while (this.pool.size >= this.maxSize) {
      await Promise.race(Array.from(this.pool));
    }

    const promise = fn();
    this.add(promise);
    return promise;
  }
}
