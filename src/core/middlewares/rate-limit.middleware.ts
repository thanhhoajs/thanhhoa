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
  private requestCounts = new Map<string, number[]>();
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

    setInterval(
      cleanup,
      Math.max(Math.min(this.options.windowMs, 60000), 10000),
    );
  }

  getClientKey(context: IRequestContext): string {
    const req = context.request;
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : context.socketAddress?.address;
    return `${ip}:${req.method}:${new URL(req.url).pathname}`;
  }

  async getRateLimit(clientKey: string): Promise<boolean> {
    const now = Date.now();
    const timestamps = this.requestCounts.get(clientKey) || [];
    const windowStart = now - this.options.windowMs;

    // Remove outdated timestamps
    while (timestamps.length && timestamps[0] < windowStart) {
      timestamps.shift();
    }

    if (timestamps.length >= this.options.maxRequests) {
      return false;
    }

    timestamps.push(now);
    this.requestCounts.set(clientKey, timestamps);
    return true;
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
    const allowed = await limiter.getRateLimit(clientKey);

    if (!allowed) {
      throw new HttpException(options.message || 'Too many requests', 429, {
        'Retry-After': Math.ceil(
          (Date.now() - performance.now()) / 1000,
        ).toString(),
        'X-RateLimit-Limit': options.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(
          Date.now() + (Date.now() - performance.now()),
        ).toUTCString(),
      });
    }

    return next();
  };
};
