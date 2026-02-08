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

  it('should handle route groups with prefix', async () => {
    const router = new Router();

    router.group('/users', (r) => {
      r.get('/', async () => new Response('All Users'));
      r.get('/:id', async (ctx) => new Response(`User: ${ctx.params.id}`));
      r.post('/', async () => new Response('Create User'));
    });

    // Test GET /users
    const request1 = new Request('http://localhost/users');
    const ctx1 = {
      request: request1,
      socketAddress: null,
      params: {},
      query: {},
    };
    const response1 = await router.handle(ctx1);
    expect(await response1.text()).toBe('All Users');

    // Test GET /users/:id
    const request2 = new Request('http://localhost/users/42');
    const ctx2 = {
      request: request2,
      socketAddress: null,
      params: {},
      query: {},
    };
    const response2 = await router.handle(ctx2);
    expect(await response2.text()).toBe('User: 42');

    // Test POST /users
    const request3 = new Request('http://localhost/users', { method: 'POST' });
    const ctx3 = {
      request: request3,
      socketAddress: null,
      params: {},
      query: {},
    };
    const response3 = await router.handle(ctx3);
    expect(await response3.text()).toBe('Create User');
  });

  it('should mount sub-routers', async () => {
    const mainRouter = new Router();
    const userRouter = new Router();

    userRouter.get('/', async () => new Response('All Users'));
    userRouter.get(
      '/:id',
      async (ctx) => new Response(`User: ${ctx.params.id}`),
    );

    mainRouter.mount('/api/users', userRouter);

    // Test GET /api/users
    const request1 = new Request('http://localhost/api/users');
    const ctx1 = {
      request: request1,
      socketAddress: null,
      params: {},
      query: {},
    };
    const response1 = await mainRouter.handle(ctx1);
    expect(await response1.text()).toBe('All Users');

    // Test GET /api/users/:id
    const request2 = new Request('http://localhost/api/users/99');
    const ctx2 = {
      request: request2,
      socketAddress: null,
      params: {},
      query: {},
    };
    const response2 = await mainRouter.handle(ctx2);
    expect(await response2.text()).toBe('User: 99');
  });

  it('should handle nested groups', async () => {
    const router = new Router();

    router.group('/api', (api) => {
      api.group('/v1', (v1) => {
        v1.get('/hello', async () => new Response('Hello v1'));
      });
    });

    const request = new Request('http://localhost/api/v1/hello');
    const ctx = { request, socketAddress: null, params: {}, query: {} };
    const response = await router.handle(ctx);
    expect(await response.text()).toBe('Hello v1');
  });
});
