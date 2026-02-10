import { LRUCache } from 'lru-cache';
import type { Middleware } from '../shared/types';

interface RateLimitInfo {
  total: number;
  resetTime: number;
}

/**
 * Rate limit store interface
 * Implement this to use Redis, Memcached, or other stores
 */
export interface RateLimitStore {
  /** Get rate limit info for a key */
  get(key: string): Promise<RateLimitInfo | null>;
  /** Set rate limit info for a key with TTL */
  set(key: string, info: RateLimitInfo, ttlMs: number): Promise<void>;
  /** Increment total for a key, returns new info */
  increment(key: string, windowMs: number): Promise<RateLimitInfo>;
}

/**
 * In-memory LRU store (default, non-distributed)
 */
export class MemoryStore implements RateLimitStore {
  private cache: LRUCache<string, RateLimitInfo>;

  constructor(options: { max?: number; ttl?: number } = {}) {
    this.cache = new LRUCache<string, RateLimitInfo>({
      max: options.max || 5000,
      ttl: options.ttl || 60 * 1000,
    });
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, info: RateLimitInfo, ttlMs: number): Promise<void> {
    this.cache.set(key, info, { ttl: ttlMs });
  }

  async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
    const now = Date.now();
    let info = this.cache.get(key);

    if (!info || now > info.resetTime) {
      info = {
        total: 1,
        resetTime: now + windowMs,
      };
    } else {
      info.total++;
    }

    this.cache.set(key, info);
    return info;
  }
}

/**
 * Redis store for distributed rate limiting
 * Uses Bun's native Redis client
 *
 * @example
 * import { RedisClient } from 'bun';
 * import { rateLimit, RedisStore } from '@thanhhoajs/thanhhoa/middleware';
 *
 * const redis = new RedisClient('redis://localhost:6379');
 * app.use(rateLimit({
 *   store: new RedisStore(redis),
 *   max: 100,
 *   windowMs: 60000
 * }));
 */
export class RedisStore implements RateLimitStore {
  private redis: any;
  private prefix: string;

  constructor(redisClient: any, options: { prefix?: string } = {}) {
    this.redis = redisClient;
    this.prefix = options.prefix || 'rl:';
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const data = await this.redis.hmget(`${this.prefix}${key}`, [
      'total',
      'resetTime',
    ]);

    if (!data[0]) return null;

    return {
      total: parseInt(data[0], 10),
      resetTime: parseInt(data[1], 10),
    };
  }

  async set(key: string, info: RateLimitInfo, ttlMs: number): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    await this.redis.hmset(redisKey, [
      'total',
      info.total.toString(),
      'resetTime',
      info.resetTime.toString(),
    ]);
    await this.redis.expire(redisKey, Math.ceil(ttlMs / 1000));
  }

  async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
    const now = Date.now();
    const redisKey = `${this.prefix}${key}`;

    // Get current info
    let info = await this.get(key);

    if (!info || now > info.resetTime) {
      // New window
      info = {
        total: 1,
        resetTime: now + windowMs,
      };
      await this.set(key, info, windowMs);
    } else {
      // Increment using Redis atomic operation
      const newTotal = await this.redis.hincrby(redisKey, 'total', 1);
      info.total = newTotal;
    }

    return info;
  }
}

interface RateLimitOptions {
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number;
  /** Max requests per window (default: 100) */
  max?: number;
  /** Error message when rate limited */
  message?: string | object;
  /** HTTP status code (default: 429) */
  statusCode?: number;
  /** Send X-RateLimit headers (default: true) */
  headers?: boolean;
  /** Custom key generator function */
  keyGenerator?: (req: Request) => string;
  /** Store implementation (default: MemoryStore) */
  store?: RateLimitStore;
  /** Skip rate limiting for certain paths */
  skip?: string[] | ((path: string) => boolean);
}

/**
 * Rate limiting middleware with pluggable stores
 *
 * @example
 * // In-memory (default)
 * app.use(rateLimit({
 *   windowMs: 60 * 1000,
 *   max: 100
 * }));
 *
 * // With Redis (distributed)
 * import { RedisClient } from 'bun';
 * const redis = new RedisClient();
 *
 * app.use(rateLimit({
 *   store: new RedisStore(redis),
 *   windowMs: 60 * 1000,
 *   max: 100
 * }));
 *
 * // Custom key generator (e.g., by user ID)
 * app.use(rateLimit({
 *   keyGenerator: (req) => req.headers.get('X-User-ID') || 'anonymous',
 *   max: 1000
 * }));
 */
export const rateLimit = (options: RateLimitOptions = {}): Middleware => {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const message =
    options.message || 'Too many requests, please try again later.';
  const statusCode = options.statusCode || 429;
  const headers = options.headers !== false;
  const skip = options.skip;

  const store = options.store || new MemoryStore({ ttl: windowMs });

  return async (ctx, next) => {
    // Check skip paths
    if (skip) {
      const url = new URL(ctx.request.url);
      const shouldSkip =
        typeof skip === 'function'
          ? skip(url.pathname)
          : skip.some((p) => url.pathname.startsWith(p));
      if (shouldSkip) {
        return next();
      }
    }

    // Generate key (default: IP address)
    const ip = ctx.socketAddress?.address || 'unknown';
    const key = options.keyGenerator ? options.keyGenerator(ctx.request) : ip;

    const now = Date.now();

    // Increment counter in store
    const info = await store.increment(key, windowMs);

    const remaining = Math.max(0, max - info.total);
    const reset = Math.ceil((info.resetTime - now) / 1000);

    // Rate limit exceeded
    if (info.total > max) {
      const response = new Response(
        typeof message === 'string' ? message : JSON.stringify(message),
        {
          status: statusCode,
          headers: {
            'Content-Type':
              typeof message === 'string' ? 'text/plain' : 'application/json',
          },
        },
      );

      if (headers) {
        response.headers.set('X-RateLimit-Limit', max.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', reset.toString());
        response.headers.set('Retry-After', reset.toString());
      }

      return response;
    }

    const response = await next();

    if (headers) {
      response.headers.set('X-RateLimit-Limit', max.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', reset.toString());
    }

    return response;
  };
};

/**
 * Sliding window rate limiter with Redis
 * More accurate than fixed window, but requires Redis
 *
 * @example
 * const redis = new RedisClient();
 * app.use(slidingWindowRateLimit({
 *   redis,
 *   max: 100,
 *   windowMs: 60000
 * }));
 */
export const slidingWindowRateLimit = (options: {
  redis: any;
  windowMs?: number;
  max?: number;
  message?: string | object;
  statusCode?: number;
  headers?: boolean;
  keyGenerator?: (req: Request) => string;
  prefix?: string;
}): Middleware => {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 100;
  const message =
    options.message || 'Too many requests, please try again later.';
  const statusCode = options.statusCode || 429;
  const headers = options.headers !== false;
  const prefix = options.prefix || 'rl:sw:';
  const redis = options.redis;

  return async (ctx, next) => {
    const ip = ctx.socketAddress?.address || 'unknown';
    const key = options.keyGenerator ? options.keyGenerator(ctx.request) : ip;

    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = `${prefix}${key}`;

    // Use sorted set for sliding window
    // Remove old entries
    await redis.send('ZREMRANGEBYSCORE', [
      redisKey,
      '0',
      windowStart.toString(),
    ]);

    // Count requests in current window
    const count = await redis.send('ZCARD', [redisKey]);

    if (count >= max) {
      // Get oldest entry to calculate reset time
      const oldest = await redis.send('ZRANGE', [
        redisKey,
        '0',
        '0',
        'WITHSCORES',
      ]);
      const resetTime = oldest[1]
        ? parseInt(oldest[1], 10) + windowMs
        : now + windowMs;
      const reset = Math.ceil((resetTime - now) / 1000);

      const response = new Response(
        typeof message === 'string' ? message : JSON.stringify(message),
        {
          status: statusCode,
          headers: {
            'Content-Type':
              typeof message === 'string' ? 'text/plain' : 'application/json',
          },
        },
      );

      if (headers) {
        response.headers.set('X-RateLimit-Limit', max.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', reset.toString());
        response.headers.set('Retry-After', reset.toString());
      }

      return response;
    }

    // Add current request
    await redis.send('ZADD', [
      redisKey,
      now.toString(),
      `${now}:${Math.random()}`,
    ]);
    await redis.expire(redisKey, Math.ceil(windowMs / 1000));

    const remaining = max - count - 1;
    const reset = Math.ceil(windowMs / 1000);

    const response = await next();

    if (headers) {
      response.headers.set('X-RateLimit-Limit', max.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', reset.toString());
    }

    return response;
  };
};
