import { expect, test, describe } from 'bun:test';
import { timeout } from '../../src/middleware/timeout';
import type { IRequestContext } from '@thanhhoajs/thanhhoa';

// Mock context
function createMockContext(): IRequestContext {
  return {
    request: {
      headers: new Headers(),
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

describe('timeout middleware', () => {
  test('should allow fast requests to complete', async () => {
    const middleware = timeout({ ms: 1000 });
    const ctx = createMockContext();
    const next = () =>
      new Promise<Response>((resolve) =>
        setTimeout(() => resolve(new Response('OK')), 50),
      );

    const response = await middleware(ctx, next);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');
  });

  test('should timeout slow requests', async () => {
    const middleware = timeout({ ms: 100 });
    const ctx = createMockContext();
    const next = () =>
      new Promise<Response>((resolve) =>
        setTimeout(() => resolve(new Response('OK')), 500),
      );

    const response = await middleware(ctx, next);
    expect(response.status).toBe(408);
    const body = await response.json();
    expect(body.error).toBe('Request Timeout');
  });

  test('should use custom message', async () => {
    const middleware = timeout({
      ms: 50,
      message: 'Too slow!',
    });
    const ctx = createMockContext();
    const next = () =>
      new Promise<Response>((resolve) =>
        setTimeout(() => resolve(new Response('OK')), 200),
      );

    const response = await middleware(ctx, next);
    const body = await response.json();
    expect(body.message).toBe('Too slow!');
  });

  test('should use custom status code', async () => {
    const middleware = timeout({
      ms: 50,
      statusCode: 503,
    });
    const ctx = createMockContext();
    const next = () =>
      new Promise<Response>((resolve) =>
        setTimeout(() => resolve(new Response('OK')), 200),
      );

    const response = await middleware(ctx, next);
    expect(response.status).toBe(503);
  });

  test('should default to 30 seconds timeout', async () => {
    const middleware = timeout();
    const ctx = createMockContext();
    const next = () => Promise.resolve(new Response('OK'));

    const response = await middleware(ctx, next);
    expect(response.status).toBe(200);
  });
});
