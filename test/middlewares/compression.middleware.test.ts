import { describe, expect, it } from 'bun:test';
import { compression } from '@thanhhoajs/thanhhoa';
import type { IRequestContext } from '@thanhhoajs/thanhhoa';

describe('Compression Middleware', () => {
  it('should compress text responses when gzip is supported', async () => {
    const middleware = compression({ level: 6 });
    const context: IRequestContext = {
      request: new Request('http://localhost', {
        headers: { 'Accept-Encoding': 'gzip' },
      }),
      params: {},
      query: {},
      socketAddress: null,
    };

    const response = await middleware(context, () =>
      Promise.resolve(
        new Response('Test content', {
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    );

    expect(response.headers.get('Content-Encoding')).toBe('gzip');
    expect(response.headers.get('Vary')).toBe('Accept-Encoding');
  });

  it('should not compress when gzip is not accepted', async () => {
    const middleware = compression({ level: 6 });
    const context: IRequestContext = {
      request: new Request('http://localhost'),
      params: {},
      query: {},
      socketAddress: null,
    };

    const response = await middleware(context, () =>
      Promise.resolve(
        new Response('Test content', {
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    );

    expect(response.headers.get('Content-Encoding')).toBeNull();
  });
});
