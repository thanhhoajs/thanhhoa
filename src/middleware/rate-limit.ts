import { LRUCache } from 'lru-cache';
import type { Middleware } from '../shared/types';

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Max number of connections per windowMs
  message?: string | object;
  statusCode?: number;
  headers?: boolean; // Send X-RateLimit headers
  keyGenerator?: (req: Request) => string;
}

interface RateLimitInfo {
  total: number;
  resetTime: number;
}

/**
 * Rate limiting middleware using LRU Cache
 */
export const rateLimit = (options: RateLimitOptions = {}): Middleware => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const max = options.max || 100; // 100 requests per minute default
  const message =
    options.message || 'Too many requests, please try again later.';
  const statusCode = options.statusCode || 429;
  const headers = options.headers !== false;

  const keyGenerator =
    options.keyGenerator ||
    ((req: Request) => {
      // Default to IP address if available, or fall back to 'global'
      // In Bun, we need to access the socket address from server context if possible
      // But middleware runs in context where we might not have direct access to server.requestIP(req)
      // unless it was passed down.
      // The framework passes socketAddress in context!
      return 'ip_placeholder';
    });

  const cache = new LRUCache<string, RateLimitInfo>({
    max: 5000,
    ttl: windowMs,
  });

  return async (ctx, next) => {
    // Use context.socketAddress for IP-based limiting
    const ip = ctx.socketAddress?.address || 'unknown';
    const key = options.keyGenerator ? options.keyGenerator(ctx.request) : ip;

    const now = Date.now();
    let info = cache.get(key);

    if (!info) {
      info = {
        total: 0,
        resetTime: now + windowMs,
      };
    }

    // Reset if window has passed (LRU ttl handles expiration but we need precise window for headers)
    if (now > info.resetTime) {
      info.total = 0;
      info.resetTime = now + windowMs;
    }

    info.total++;
    cache.set(key, info);

    const remaining = Math.max(0, max - info.total);
    const reset = Math.ceil((info.resetTime - now) / 1000);

    if (headers) {
      // We need to set headers on the response.
      // Since middleware wraps the next(), we need to act on the response returned by next()
      // BUT if we block, we return immediately.
    }

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
