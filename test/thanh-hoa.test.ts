import { expect, test, mock, spyOn } from 'bun:test';
import {
  ThanhHoa,
  HttpException,
  type IRequestContext,
  type INextFunction,
} from '@thanhhoajs/thanhhoa';
import type { Server } from 'bun';

// Mock for Bun.serve
const mockServe = mock(() => ({
  url: 'http://localhost:3000',
}));

// Spy on console.log to check logging
const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});

// Helper function to create mock Request
function createMockRequest(method: string, url: string, body?: any): Request {
  return new Request(url, { method, body: JSON.stringify(body) });
}

function createMockServer(): Server {
  return {
    requestIP: () => '127.0.0.1',
  } as any;
}

// Function to set up a new instance of ThanhHoa for each test
function setup() {
  const app = new ThanhHoa();
  consoleSpy.mockClear();
  return app;
}

test('GET request', async () => {
  const app = setup();
  app.get('/test', (ctx: IRequestContext) => new Response('GET Test'));
  const response = await app.handleRequest(
    createMockRequest('GET', 'http://localhost:3000/test'),
    createMockServer(),
  );
  expect(await response.text()).toBe('GET Test');
});

test('POST request', async () => {
  const app = setup();
  app.post('/test', async (ctx: IRequestContext) => {
    const body = await ctx.request.json();
    return new Response(JSON.stringify(body));
  });
  const response = await app.handleRequest(
    createMockRequest('POST', 'http://localhost:3000/test', { key: 'value' }),
    createMockServer(),
  );
  expect(await response.json()).toEqual({ key: 'value' });
});

test('PUT request', async () => {
  const app = setup();
  app.put(
    '/test/:id',
    (ctx: IRequestContext) => new Response(`PUT Test ${ctx.params.id}`),
  );
  const response = await app.handleRequest(
    createMockRequest('PUT', 'http://localhost:3000/test/123'),
    createMockServer(),
  );
  expect(await response.text()).toBe('PUT Test 123');
});

test('PATCH request', async () => {
  const app = setup();
  app.patch(
    '/test/:id',
    (ctx: IRequestContext) => new Response(`PATCH Test ${ctx.params.id}`),
  );
  const response = await app.handleRequest(
    createMockRequest('PATCH', 'http://localhost:3000/test/456'),
    createMockServer(),
  );
  expect(await response.text()).toBe('PATCH Test 456');
});

test('DELETE request', async () => {
  const app = setup();
  app.delete(
    '/test/:id',
    (ctx: IRequestContext) => new Response(`DELETE Test ${ctx.params.id}`),
  );
  const response = await app.handleRequest(
    createMockRequest('DELETE', 'http://localhost:3000/test/789'),
    createMockServer(),
  );
  expect(await response.text()).toBe('DELETE Test 789');
});

test('Middleware', async () => {
  const app = setup();
  const middleware = async (ctx: any, next: INextFunction) => {
    ctx.custom = 'Middleware';
    return next();
  };

  app.use(middleware);
  app.get('/test', (ctx: IRequestContext) => new Response(ctx.custom));

  const response = await app.handleRequest(
    createMockRequest('GET', 'http://localhost:3000/test'),
    createMockServer(),
  );
  expect(await response.text()).toBe('Middleware');
});

test('Route not found', async () => {
  const app = setup();
  const response = await app.handleRequest(
    createMockRequest('GET', 'http://localhost:3000/notfound'),
    createMockServer(),
  );
  expect(response.status).toBe(404);
});

test('HttpException handling', async () => {
  const app = setup();
  app.get('/error', () => {
    throw new HttpException('Test Error', 400, { reason: 'Bad Request' });
  });

  const response = await app.handleRequest(
    createMockRequest('GET', 'http://localhost:3000/error'),
    createMockServer(),
  );
  expect(response.status).toBe(400);
  const body = await response.json();
  expect(body.meta.message).toBe('Test Error');
  expect(body.data.reason).toBe('Bad Request');
});

test('Query parameters', async () => {
  const app = setup();
  app.get(
    '/query',
    (ctx: IRequestContext) => new Response(JSON.stringify(ctx.query)),
  );
  const response = await app.handleRequest(
    createMockRequest(
      'GET',
      'http://localhost:3000/query?key1=value1&key2=value2',
    ),
    createMockServer(),
  );
  expect(await response.json()).toEqual({ key1: 'value1', key2: 'value2' });
});

test('Route grouping', async () => {
  const app = setup();
  app.group('/api', (router) => {
    router.get('/test', () => new Response('API Test'));
  });

  const response = await app.handleRequest(
    createMockRequest('GET', 'http://localhost:3000/api/test'),
    createMockServer(),
  );
  expect(await response.text()).toBe('API Test');
});

test('Server listen', () => {
  const app = setup();
  const originalServe = Bun.serve;
  (Bun as any).serve = mockServe;

  app.listen({ port: 3000 });
  expect(mockServe).toHaveBeenCalled();

  expect(mockServe).toHaveBeenCalledWith(
    expect.objectContaining({
      port: 3000,
    }),
  );

  const server = app.listen({ port: 3000 });
  expect(server).toBeDefined();
  expect(server.url.toString()).toBe('http://localhost:3000');

  (Bun as any).serve = originalServe;
});
