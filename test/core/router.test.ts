import { describe, expect, it } from 'bun:test';
import { Router } from '@thanhhoajs/thanhhoa';

describe('Router', () => {
  it('should register and handle functional routes', async () => {
    const router = new Router();

    router.get('/api/test', async () => {
      return new Response('Test Response');
    });

    const request = new Request('http://localhost/api/test');
    const context = {
      request,
      socketAddress: null,
      params: {},
      query: {},
    };

    const response = await router.handle(context);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe('Test Response');
  });

  it('should handle middleware', async () => {
    const router = new Router();
    let middlewareCalled = false;

    const middleware = async (ctx: any, next: () => Promise<Response>) => {
      middlewareCalled = true;
      return next();
    };

    router.use(middleware);
    router.get('/api/test', async () => new Response('Test'));

    const request = new Request('http://localhost/api/test');
    const context = {
      request,
      socketAddress: null,
      params: {},
      query: {},
    };

    await router.handle(context);
    expect(middlewareCalled).toBe(true);
  });

  it('should parse route parameters', async () => {
    const router = new Router();

    router.get('/users/:id', async (ctx) => {
      return new Response(`User: ${ctx.params.id}`);
    });

    const request = new Request('http://localhost/users/123');
    const context = {
      request,
      socketAddress: null,
      params: {},
      query: {},
    };

    const response = await router.handle(context);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe('User: 123');
  });

  it('should return 404 for unregistered routes', async () => {
    const router = new Router();

    const request = new Request('http://localhost/not-found');
    const context = {
      request,
      socketAddress: null,
      params: {},
      query: {},
    };

    const response = await router.handle(context);
    expect(response.status).toBe(404);
  });
});
