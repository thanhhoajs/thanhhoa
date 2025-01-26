import { describe, expect, it } from 'bun:test';
import { rateLimiter } from '@thanhhoajs/thanhhoa';
import type { IRequestContext } from '@thanhhoajs/thanhhoa';

describe('Rate Limit Middleware', () => {
  it('should limit requests when threshold is exceeded', async () => {
    const middleware = await rateLimiter({
      windowMs: 1000,
      maxRequests: 2,
    });

    const context: IRequestContext = {
      request: new Request('http://localhost'),
      params: {},
      query: {},
      socketAddress: {
        address: '127.0.0.1',
        port: 0,
        family: 'IPv4',
      },
    };

    // First request - should pass
    const response1 = await middleware(context, () =>
      Promise.resolve(new Response('OK')),
    );
    expect(response1.status).toBe(200);

    // Second request - should pass
    const response2 = await middleware(context, () =>
      Promise.resolve(new Response('OK')),
    );
    expect(response2.status).toBe(200);

    // Third request - should be blocked
    const response3 = await middleware(context, () =>
      Promise.resolve(new Response('OK')),
    );
    expect(response3.status).toBe(429);
  });

  it('should include rate limit headers', async () => {
    const middleware = await rateLimiter({
      windowMs: 1000,
      maxRequests: 2,
    });

    const context: IRequestContext = {
      request: new Request('http://localhost'),
      params: {},
      query: {},
      socketAddress: {
        address: '127.0.0.1',
        port: 0,
        family: 'IPv4',
      },
    };

    const response = await middleware(context, () =>
      Promise.resolve(new Response('OK')),
    );

    expect(response.headers.get('X-RateLimit-Limit')).toBe('2');
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
  });
});
