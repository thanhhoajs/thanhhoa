import { describe, expect, it } from 'bun:test';
import { corsMiddleware } from '@thanhhoajs/thanhhoa';
import type { IRequestContext } from '@thanhhoajs/thanhhoa';

describe('CORS Middleware', () => {
  it('should handle preflight requests', async () => {
    const middleware = corsMiddleware();
    const context: IRequestContext = {
      request: new Request('http://localhost', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://example.com',
          'Access-Control-Request-Method': 'POST',
        },
      }),
      params: {},
      query: {},
      socketAddress: null,
    };

    const response = await middleware(context, () =>
      Promise.resolve(new Response()),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain(
      'POST',
    );
  });

  it('should handle custom origin configuration', async () => {
    const middleware = corsMiddleware({
      origin: ['http://allowed.com'],
      credentials: true,
    });

    const context: IRequestContext = {
      request: new Request('http://localhost', {
        headers: { Origin: 'http://allowed.com' },
      }),
      params: {},
      query: {},
      socketAddress: null,
    };

    const response = await middleware(context, () =>
      Promise.resolve(new Response('OK')),
    );

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'http://allowed.com',
    );
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe(
      'true',
    );
  });
});
