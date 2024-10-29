import {
  HttpException,
  type Middleware,
  type IRequestContext,
  type INextFunction,
  type IRequestRecord,
  type IRateLimiterOptions,
} from '@thanhhoajs/thanhhoa';

class RateLimiter {
  private store = new Map<string, IRequestRecord>();
  private readonly options: Required<IRateLimiterOptions>;

  constructor(options: IRateLimiterOptions) {
    this.options = {
      windowMs: options.windowMs || 600000, // 10 minute
      maxRequests: options.maxRequests || 100, // 100 request
      message: options.message || 'Too many requests',
      skipFailedRequests: options.skipFailedRequests || false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    };

    // Periodic cleanup with performance.now()
    const cleanup = () => {
      const now = performance.now();
      for (const [key, record] of this.store) {
        if (now >= record.resetTime) {
          this.store.delete(key);
        }
      }
    };

    setInterval(cleanup, Math.min(this.options.windowMs, 60000));
  }

  getClientKey(context: IRequestContext): string {
    const req = context.request;
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `${ip}:${req.method}:${new URL(req.url).pathname}`;
  }

  async getRateLimit(clientKey: string): Promise<IRequestRecord> {
    const now = performance.now();
    let record = this.store.get(clientKey);

    if (!record || now >= record.resetTime) {
      record = {
        count: 0,
        tokens: this.options.maxRequests,
        resetTime: now + this.options.windowMs,
      };
      this.store.set(clientKey, record);
    }

    return record;
  }
}

/**
 * Returns a middleware that limits the number of requests from the same client
 * within a specified window of time.
 *
 * @param {IRateLimiterOptions} options - Options for the rate limiter.
 * @property {number} [windowMs=60000] - The window of time for the rate limit, in milliseconds.
 * @property {number} [maxRequests=1] - The maximum number of requests allowed within the window.
 * @property {string} [message='Too many requests'] - The message to return when the rate limit is exceeded.
 * @property {boolean} [skipFailedRequests=false] - Whether to skip failed requests for rate limit calculation.
 * @property {boolean} [skipSuccessfulRequests=false] - Whether to skip successful requests for rate limit calculation.
 * @returns {Middleware} A middleware that enforces the rate limit.
 *
 * @example
 * // Basic usage
 * app.use(rateLimiter());
 *
 * // Custom configuration
 * app.use(rateLimiter({
 *   windowMs: 30000, // 30 seconds
 *   maxRequests: 5, // 5 requests
 *   message: 'Too many requests, please try again later',
 *   skipFailedRequests: false,
 *   skipSuccessfulRequests: false
 * }));
 */
export const rateLimiter = (options: IRateLimiterOptions): Middleware => {
  const limiter = new RateLimiter(options);

  return async (
    context: IRequestContext,
    next: INextFunction,
  ): Promise<Response> => {
    const clientKey = limiter.getClientKey(context);
    const record = await limiter.getRateLimit(clientKey);

    // Check rate limit
    if (record.tokens <= 0) {
      const retryAfter = Math.ceil(
        (record.resetTime - performance.now()) / 1000,
      );

      throw new HttpException(options.message || 'Too many requests', 429, {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': options.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(
          Date.now() + (record.resetTime - performance.now()),
        ).toUTCString(),
      });
    }

    try {
      // Reduce token before processing request

      record.tokens--;
      record.count++;

      const response = await next();

      // Restore token if needed
      if (options.skipSuccessfulRequests && response.ok) {
        record.tokens = Math.min(record.tokens + 1, options.maxRequests);
      }

      return response;
    } catch (error) {
      // Restore token for failed requests if needed
      if (options.skipFailedRequests) {
        record.tokens = Math.min(record.tokens + 1, options.maxRequests);
      }
      throw error;
    }
  };
};
