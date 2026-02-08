import { expect, test, describe } from 'bun:test';
import { bodyLimit } from '../../src/middleware/body-limit';
import type { IRequestContext, INextFunction } from '@thanhhoajs/thanhhoa';

// Mock context creator
function createMockContext(contentLength?: string): IRequestContext {
  const headers = new Headers();
  if (contentLength) {
    headers.set('Content-Length', contentLength);
  }

  return {
    request: {
      headers,
      method: 'POST',
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

describe('bodyLimit middleware', () => {
  test('should allow requests under limit', async () => {
    const middleware = bodyLimit({ maxSize: 1024 });
    const ctx = createMockContext('500');
    const next = () => Promise.resolve(new Response('OK'));

    const response = await middleware(ctx, next);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');
  });

  test('should reject requests over limit', async () => {
    const middleware = bodyLimit({ maxSize: 1024 });
    const ctx = createMockContext('2048');
    const next = () => Promise.resolve(new Response('OK'));

    const response = await middleware(ctx, next);
    expect(response.status).toBe(413);
    const body = await response.json();
    expect(body.error).toBe('Payload Too Large');
  });

  test('should use default maxSize of 1MB', async () => {
    const middleware = bodyLimit();
    const ctx = createMockContext((2 * 1024 * 1024).toString()); // 2MB
    const next = () => Promise.resolve(new Response('OK'));

    const response = await middleware(ctx, next);
    expect(response.status).toBe(413);
  });

  test('should allow requests without Content-Length header', async () => {
    const middleware = bodyLimit({ maxSize: 1024 });
    const ctx = createMockContext(); // No Content-Length
    const next = () => Promise.resolve(new Response('OK'));

    const response = await middleware(ctx, next);
    expect(response.status).toBe(200);
  });

  test('should use custom error message', async () => {
    const middleware = bodyLimit({
      maxSize: 100,
      message: 'File too big!',
    });
    const ctx = createMockContext('500');
    const next = () => Promise.resolve(new Response('OK'));

    const response = await middleware(ctx, next);
    const body = await response.json();
    expect(body.message).toBe('File too big!');
  });

  test('should use custom status code', async () => {
    const middleware = bodyLimit({
      maxSize: 100,
      statusCode: 400,
    });
    const ctx = createMockContext('500');
    const next = () => Promise.resolve(new Response('OK'));

    const response = await middleware(ctx, next);
    expect(response.status).toBe(400);
  });
});
