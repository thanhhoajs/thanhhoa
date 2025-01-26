import { describe, expect, it } from 'bun:test';
import { helmetMiddleware } from '@thanhhoajs/thanhhoa';
import type { IRequestContext } from '@thanhhoajs/thanhhoa';

describe('Helmet Middleware', () => {
  it('should set default security headers', async () => {
    const middleware = helmetMiddleware();
    const context: IRequestContext = {
      request: new Request('http://localhost'),
      params: {},
      query: {},
      socketAddress: null,
    };

    const response = await middleware(context, () =>
      Promise.resolve(new Response('OK')),
    );

    expect(response.headers.get('Content-Security-Policy')).toBeDefined();
    expect(response.headers.get('Strict-Transport-Security')).toBeDefined();
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });

  it('should allow custom CSP directives', async () => {
    const middleware = helmetMiddleware({
      contentSecurityPolicy: {
        'default-src': ["'self'", '*.trusted.com'],
        'script-src': ["'self'", "'unsafe-inline'", '*.googleapis.com'],
      },
    });

    const context: IRequestContext = {
      request: new Request('http://localhost'),
      params: {},
      query: {},
      socketAddress: null,
    };

    const response = await middleware(context, () =>
      Promise.resolve(new Response('OK')),
    );

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toContain('*.trusted.com');
    expect(csp).toContain('*.googleapis.com');
  });
});
