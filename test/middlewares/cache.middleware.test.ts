import { describe, expect, it, beforeEach } from 'bun:test';
import { cacheMiddleware } from '@thanhhoajs/thanhhoa';
import type { IRequestContext } from '@thanhhoajs/thanhhoa';

describe('Cache Middleware', () => {
  let middleware: ReturnType<typeof cacheMiddleware>;
  const testUrl = 'http://localhost/test';

  beforeEach(() => {
    middleware = cacheMiddleware();
  });

  it('should cache GET requests', async () => {
    const context: IRequestContext = {
      request: new Request(testUrl),
      params: {},
      query: {},
      socketAddress: null,
    };

    // First request
    const firstResponse = await middleware(context, () =>
      Promise.resolve(
        new Response('Cached content', {
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    );

    const firstEtag = firstResponse.headers.get('ETag');
    expect(firstEtag).toBeDefined();

    // Second request with same URL
    const secondContext: IRequestContext = {
      request: new Request(testUrl),
      params: {},
      query: {},
      socketAddress: null,
    };

    const secondResponse = await middleware(secondContext, () =>
      Promise.resolve(new Response('Different content')),
    );

    const [firstContent, secondContent] = await Promise.all([
      firstResponse.clone().text(),
      secondResponse.clone().text(),
    ]);

    expect(secondContent).toBe(firstContent);
    expect(secondResponse.headers.get('ETag')).toBe(firstEtag);
  });

  it('should return 304 for matching ETags', async () => {
    // First request to cache the response
    const firstContext: IRequestContext = {
      request: new Request(testUrl),
      params: {},
      query: {},
      socketAddress: null,
    };

    const firstResponse = await middleware(firstContext, () =>
      Promise.resolve(new Response('Test content')),
    );

    const etag = firstResponse.headers.get('ETag');
    expect(etag).toBeDefined();

    // Second request with matching ETag
    const secondContext: IRequestContext = {
      request: new Request(testUrl, {
        headers: { 'If-None-Match': etag! },
      }),
      params: {},
      query: {},
      socketAddress: null,
    };

    const secondResponse = await middleware(secondContext, () =>
      Promise.resolve(new Response('Different content')),
    );

    expect(secondResponse.status).toBe(304);
    expect(secondResponse.headers.get('ETag')).toBe(etag);
  });
});
