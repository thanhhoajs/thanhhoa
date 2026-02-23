import { expect, test, describe } from 'bun:test';
import { LRUCache } from '../../src/utils/lru-cache';

describe('LRU Cache', () => {
  test('should set and get values', () => {
    const cache = new LRUCache<string, string>({ max: 3 });
    cache.set('a', '1');
    cache.set('b', '2');
    expect(cache.get('a')).toBe('1');
    expect(cache.has('b')).toBe(true);
    expect(cache.has('c')).toBe(false);
  });

  test('should evict least recently used items when full', () => {
    const cache = new LRUCache<string, number>({ max: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.has('a')).toBe(false); // First one evicted
    expect(cache.has('b')).toBe(true);
    expect(cache.has('c')).toBe(true);
    expect(cache.size).toBe(2);
  });

  test('should expire items based on ttl', async () => {
    const cache = new LRUCache<string, string>({ max: 5, ttl: 50 });
    cache.set('a', '1');
    expect(cache.get('a')).toBe('1');
    await Bun.sleep(60);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.has('a')).toBe(false);
  });

  test('should clear the cache', () => {
    const cache = new LRUCache<string, number>({ max: 5 });
    cache.set('x', 1);
    cache.set('y', 2);
    expect(cache.size).toBe(2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('x')).toBeUndefined();
  });
});
