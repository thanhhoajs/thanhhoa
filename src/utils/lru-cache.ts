/**
 * Lightweight LRU Cache — zero external dependencies
 * Uses a doubly-linked list + Map for O(1) get/set/delete
 */

interface LRUNode<K, V> {
  key: K;
  value: V;
  expiresAt: number; // 0 = no expiry
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
}

export interface LRUCacheOptions {
  max: number;
  /** Time-to-live in milliseconds */
  ttl?: number;
  updateAgeOnGet?: boolean;
}

export class LRUCache<K, V> {
  private readonly max: number;
  private readonly ttl: number;
  private readonly updateAgeOnGet: boolean;
  private readonly map = new Map<K, LRUNode<K, V>>();

  // Sentinel head/tail nodes — never contain real data
  private readonly head: LRUNode<K, V>;
  private readonly tail: LRUNode<K, V>;

  constructor(options: LRUCacheOptions) {
    this.max = options.max;
    this.ttl = options.ttl ?? 0;
    this.updateAgeOnGet = options.updateAgeOnGet ?? false;

    // Use any-cast for sentinel nodes (no real key/value)
    this.head = {
      key: null as any,
      value: null as any,
      expiresAt: 0,
      prev: null,
      next: null,
    };
    this.tail = {
      key: null as any,
      value: null as any,
      expiresAt: 0,
      prev: null,
      next: null,
    };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get size(): number {
    return this.map.size;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;

    // Check TTL
    if (node.expiresAt !== 0 && Date.now() > node.expiresAt) {
      this.delete(key);
      return undefined;
    }

    // Move to front (most recently used)
    if (this.updateAgeOnGet) {
      this.moveToFront(node);
      if (this.ttl > 0) {
        node.expiresAt = Date.now() + this.ttl;
      }
    }

    return node.value;
  }

  set(key: K, value: V): void {
    let node = this.map.get(key);

    if (node) {
      // Update existing
      node.value = value;
      if (this.ttl > 0) node.expiresAt = Date.now() + this.ttl;
      this.moveToFront(node);
      return;
    }

    // Evict LRU if at capacity
    if (this.map.size >= this.max) {
      const lru = this.tail.prev!;
      if (lru !== this.head) {
        this.removeNode(lru);
        this.map.delete(lru.key);
      }
    }

    node = {
      key,
      value,
      expiresAt: this.ttl > 0 ? Date.now() + this.ttl : 0,
      prev: null,
      next: null,
    };
    this.map.set(key, node);
    this.insertFront(node);
  }

  has(key: K): boolean {
    const node = this.map.get(key);
    if (!node) return false;
    if (node.expiresAt !== 0 && Date.now() > node.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  delete(key: K): boolean {
    const node = this.map.get(key);
    if (!node) return false;
    this.removeNode(node);
    this.map.delete(key);
    return true;
  }

  clear(): void {
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private insertFront(node: LRUNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: LRUNode<K, V>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private moveToFront(node: LRUNode<K, V>): void {
    this.removeNode(node);
    this.insertFront(node);
  }
}
