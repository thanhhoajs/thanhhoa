import { describe, expect, it } from 'bun:test';
import { Controller, Get, Router } from '@thanhhoajs/thanhhoa';

describe('Router', () => {
  it('should register controller routes', async () => {
    const router = new Router();

    @Controller('/api')
    class TestController {
      @Get('/test')
      async handler() {
        return new Response('Test Response');
      }
    }

    router.registerController(TestController);

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

    @Controller('/api')
    class TestController {
      @Get('/test')
      async handler() {
        return new Response('Test');
      }
    }

    router.registerController(TestController);

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
});
