import { LRUCache } from 'lru-cache';
import {
  type Middleware,
  type IRequestContext,
  type INextFunction,
} from '@thanhhoajs/thanhhoa';
import { RedisClientType, createClient } from 'redis';
import { Logger } from '@thanhhoajs/logger';

const logger = Logger.get('THANHHOA');

export interface IRateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  redis?: {
    enabled: boolean;
    url?: string; // Redis connection URL
  };
}

declare global {
  var redisClient: RedisClientType | null;
}

const memoryStore = new LRUCache<string, { count: number; resetTime: number }>({
  max: 1000, // Limit the number of IPs stored
  ttl: 60000, // TTL per IP (1 minute)
});

export const rateLimiter = async (
  options: IRateLimiterOptions,
): Promise<Middleware> => {
  if (global.redisClient === undefined) {
    if (process.env.REDIS_ENABLED === 'true' || options.redis?.enabled) {
      try {
        const redisUrl = options.redis?.url || process.env.REDIS_URL;
        if (!redisUrl) throw new Error('Redis URL is not provided.');

        global.redisClient = createClient({ url: redisUrl });
        await global.redisClient.connect();
        logger.info('Connected to Redis.');
      } catch (error) {
        logger.warn(
          'Failed to connect to Redis. Falling back to in-memory rate limiting.',
        );
        global.redisClient = null;
      }
    } else {
      logger.info('Redis is disabled. Using in-memory rate limiting.');
      global.redisClient = null;
    }
  }

  const redisClient = global.redisClient;

  return async (context: IRequestContext, next: INextFunction) => {
    const ip = context.socketAddress?.address || 'unknown';
    const key = `rate-limit:${ip}`;

    if (redisClient) {
      // Redis-based rate limiting
      try {
        const currentCount = await redisClient.incr(key);
        if (currentCount === 1) {
          await redisClient.expire(key, options.windowMs / 1000);
        }

        if (currentCount > options.maxRequests) {
          const response = new Response(
            JSON.stringify({
              message: options.message || 'Too many requests',
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods':
                  'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers':
                  'Content-Type, Authorization, Accept, Origin',
                'Access-Control-Expose-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
                'Retry-After': (options.windowMs / 1000).toString(),
                'X-RateLimit-Limit': options.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(
                  Date.now() + options.windowMs,
                ).toUTCString(),
                Date: new Date().toUTCString(),
              },
            },
          );
          return response;
        }
      } catch (error) {
        logger.error('Redis error:', error);
        global.redisClient = null;
      }
    }

    // In-memory rate limiting (fallback if Redis is unavailable)
    const now = Date.now();
    const record = memoryStore.get(key);

    if (record && now < record.resetTime) {
      if (record.count >= options.maxRequests) {
        const response = new Response(
          JSON.stringify({
            message: options.message || 'Too many requests',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods':
                'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
              'Access-Control-Allow-Headers':
                'Content-Type, Authorization, Accept, Origin',
              'Access-Control-Expose-Headers': 'Content-Type',
              'Access-Control-Max-Age': '86400',
              'Retry-After': ((record.resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': options.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(record.resetTime).toUTCString(),
              Date: new Date().toUTCString(),
            },
          },
        );
        return response;
      }
      record.count += 1;
    } else {
      memoryStore.set(key, { count: 1, resetTime: now + options.windowMs });
    }

    return next();
  };
};
