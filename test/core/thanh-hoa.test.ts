import { describe, expect, it, afterEach } from 'bun:test';
import { ThanhHoa } from '@thanhhoajs/thanhhoa';

describe('ThanhHoa', () => {
  let server: ReturnType<typeof Bun.serve> | null = null;

  afterEach(() => {
    if (server) {
      server.stop();
      server = null;
    }
  });

  it('should handle simple GET routes', async () => {
    const app = new ThanhHoa();

    app.get('/api/hello', async () => {
      return new Response('Hello World');
    });

    server = app.listen({ port: 3100 });

    const response = await fetch('http://localhost:3100/api/hello');
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe('Hello World');
  });

  it('should handle static files', async () => {
    const app = new ThanhHoa('', {
      staticDirectories: [
        {
          path: '/static',
          directory: 'test/fixtures',
        },
      ],
    });

    server = app.listen({ port: 3101 });

    const response = await fetch('http://localhost:3101/static/test.txt');
    const text = (await response.text()).trim();

    expect(response.status).toBe(200);
    expect(text).toBe('Hello ThanhHoa!');
  });

  it('should handle POST requests with body', async () => {
    const app = new ThanhHoa();

    app.post('/api/data', async (ctx) => {
      const body = await ctx.request.json();
      return new Response(JSON.stringify({ received: body }), {
        headers: { 'Content-Type': 'application/json' },
      });
    });

    server = app.listen({ port: 3102 });

    const response = await fetch('http://localhost:3102/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received.name).toBe('test');
  });

  it('should handle route parameters', async () => {
    const app = new ThanhHoa();

    app.get('/users/:id', async (ctx) => {
      return new Response(`User: ${ctx.params.id}`);
    });

    server = app.listen({ port: 3103 });

    const response = await fetch('http://localhost:3103/users/456');
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe('User: 456');
  });

  it('should handle global middleware', async () => {
    const app = new ThanhHoa();
    const logs: string[] = [];

    app.use(async (ctx, next) => {
      logs.push('before');
      const response = await next();
      logs.push('after');
      return response;
    });

    app.get('/test', async () => new Response('OK'));

    server = app.listen({ port: 3104 });

    await fetch('http://localhost:3104/test');

    expect(logs).toEqual(['before', 'after']);
  });
});
