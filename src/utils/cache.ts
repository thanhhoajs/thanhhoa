/**
 * Cache utility for ThanhHoaJS
 * Exposes LRU cache for user applications
 */

import { LRUCache } from 'lru-cache';

export interface CacheOptions<K = string, V = any> {
  /** Maximum number of items (default: 1000) */
  max?: number;

  /** TTL in milliseconds (default: 5 minutes) */
  ttl?: number;

  /** Update age on get (default: false) */
  updateAgeOnGet?: boolean;

  /** Update age on has (default: false) */
  updateAgeOnHas?: boolean;

  /** Allow stale items (default: false) */
  allowStale?: boolean;

  /** Size calculation function */
  sizeCalculation?: (value: V, key: K) => number;

  /** Max size in bytes */
  maxSize?: number;
}

/**
 * Create a new LRU cache instance
 *
 * @example
 * const cache = createCache<string, User>({ max: 1000, ttl: 60000 });
 * cache.set('user:1', userData);
 * const user = cache.get('user:1');
 */
export const createCache = <
  K extends string | number = string,
  V extends {} = object,
>(
  options: CacheOptions<K, V> = {},
): LRUCache<K, V> => {
  return new LRUCache<K, V>({
    max: options.max ?? 1000,
    ttl: options.ttl ?? 5 * 60 * 1000, // 5 minutes default
    updateAgeOnGet: options.updateAgeOnGet ?? false,
    updateAgeOnHas: options.updateAgeOnHas ?? false,
    allowStale: options.allowStale ?? false,
  });
};

/**
 * Simple in-memory cache (no LRU, Map-based)
 * For simple use cases without size limits
 */
export class SimpleCache<K = string, V = any> {
  private cache = new Map<K, { value: V; expires: number }>();
  private defaultTtl: number;

  constructor(defaultTtlMs: number = 5 * 60 * 1000) {
    this.defaultTtl = defaultTtlMs;
  }

  set(key: K, value: V, ttlMs?: number): this {
    const expires = Date.now() + (ttlMs ?? this.defaultTtl);
    this.cache.set(key, { value, expires });
    return this;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this.cache) {
      if (now > entry.expires) {
        this.cache.delete(key);
        pruned++;
      }
    }
    return pruned;
  }
}
