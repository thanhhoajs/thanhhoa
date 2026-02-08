import { expect, test, describe } from 'bun:test';
import { compress } from '../../src/middleware/compress';
import type { IRequestContext } from '@thanhhoajs/thanhhoa';

// Mock context with Accept-Encoding header
function createMockContext(acceptEncoding?: string): IRequestContext {
  const headers = new Headers();
  if (acceptEncoding) {
    headers.set('Accept-Encoding', acceptEncoding);
  }

  return {
    request: {
      headers,
      method: 'GET',
      url: 'http://localhost:3000/test',
    } as Request,
    params: {},
    query: {},
    cookies: {} as any,
    state: {},
    socketAddress: null,
    json: async () => ({}),
    text: async () => '',
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
  };
}

describe('compress middleware', () => {
  test('should not compress if client does not accept encoding', async () => {
    const middleware = compress();
    const ctx = createMockContext(); // No Accept-Encoding
    const responseBody = JSON.stringify({ data: 'test'.repeat(1000) });
    const next = () =>
      Promise.resolve(
        new Response(responseBody, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const response = await middleware(ctx, next);
    expect(response.headers.get('Content-Encoding')).toBeNull();
  });

  test('should compress JSON response when client accepts gzip', async () => {
    const middleware = compress({ threshold: 100 });
    const ctx = createMockContext('gzip, deflate');
    const responseBody = JSON.stringify({ data: 'test'.repeat(1000) });
    const next = () =>
      Promise.resolve(
        new Response(responseBody, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const response = await middleware(ctx, next);
    expect(response.headers.get('Content-Encoding')).toBe('gzip');
    expect(response.headers.get('Vary')).toBe('Accept-Encoding');
  });

  test('should not compress responses below threshold', async () => {
    const middleware = compress({ threshold: 10000 });
    const ctx = createMockContext('gzip');
    const responseBody = JSON.stringify({ data: 'small' });
    const next = () =>
      Promise.resolve(
        new Response(responseBody, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const response = await middleware(ctx, next);
    expect(response.headers.get('Content-Encoding')).toBeNull();
  });

  test('should not compress non-compressible content types', async () => {
    const middleware = compress({ threshold: 10 });
    const ctx = createMockContext('gzip');
    const next = () =>
      Promise.resolve(
        new Response(new ArrayBuffer(1000), {
          headers: { 'Content-Type': 'image/png' },
        }),
      );

    const response = await middleware(ctx, next);
    expect(response.headers.get('Content-Encoding')).toBeNull();
  });

  test('should compress text/html responses', async () => {
    const middleware = compress({ threshold: 50 });
    const ctx = createMockContext('gzip, deflate, br');
    const responseBody = '<html>' + '<p>Content</p>'.repeat(100) + '</html>';
    const next = () =>
      Promise.resolve(
        new Response(responseBody, {
          headers: { 'Content-Type': 'text/html' },
        }),
      );

    const response = await middleware(ctx, next);
    expect(response.headers.get('Content-Encoding')).toBe('gzip');
  });

  test('should use default threshold of 1024 bytes', async () => {
    const middleware = compress();
    const ctx = createMockContext('gzip');
    // Small response under 1024 bytes
    const responseBody = JSON.stringify({ message: 'hello' });
    const next = () =>
      Promise.resolve(
        new Response(responseBody, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const response = await middleware(ctx, next);
    expect(response.headers.get('Content-Encoding')).toBeNull();
  });
});
