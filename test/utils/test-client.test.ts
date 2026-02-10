import { describe, expect, it } from 'bun:test';
import { testClient } from '../../src/utils/test-client';
import { ThanhHoa, json, text, html } from '../../src/index';

describe('testClient utility', () => {
  it('should make GET requests', async () => {
    const app = new ThanhHoa();
    app.get('/hello', () => json({ message: 'hello' }));

    const client = testClient(app);
    const res = await client.get('/hello');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('hello');
  });

  it('should make POST requests with body', async () => {
    const app = new ThanhHoa();
    app.post('/create', async (ctx) => {
      const body = await ctx.json();
      return json({ received: body });
    });

    const client = testClient(app);
    const res = await client.post('/create', {
      body: { name: 'test', value: 123 },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received.name).toBe('test');
    expect(body.received.value).toBe(123);
  });

  it('should send custom headers', async () => {
    const app = new ThanhHoa();
    app.get('/headers', (ctx) =>
      json({ apiKey: ctx.request.headers.get('X-API-Key') }),
    );

    const client = testClient(app);
    const res = await client.get('/headers', {
      headers: { 'X-API-Key': 'secret-key' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apiKey).toBe('secret-key');
  });

  it('should handle query parameters', async () => {
    const app = new ThanhHoa();
    app.get('/search', (ctx) => json({ q: ctx.query.q, page: ctx.query.page }));

    const client = testClient(app);
    const res = await client.get('/search', {
      query: { q: 'hello', page: '2' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.q).toBe('hello');
    expect(body.page).toBe('2');
  });

  it('should handle route parameters', async () => {
    const app = new ThanhHoa();
    app.get('/users/:id', (ctx) => json({ id: ctx.params.id }));

    const client = testClient(app);
    const res = await client.get('/users/123');

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('123');
  });

  it('should support PUT, PATCH, DELETE methods', async () => {
    const app = new ThanhHoa();
    app.put('/resource', () => json({ method: 'PUT' }));
    app.patch('/resource', () => json({ method: 'PATCH' }));
    app.delete('/resource', () => json({ method: 'DELETE' }));

    const client = testClient(app);

    const putRes = await client.put('/resource');
    expect((await putRes.json()).method).toBe('PUT');

    const patchRes = await client.patch('/resource');
    expect((await patchRes.json()).method).toBe('PATCH');

    const deleteRes = await client.delete('/resource');
    expect((await deleteRes.json()).method).toBe('DELETE');
  });

  it('should access raw response', async () => {
    const app = new ThanhHoa();
    app.get('/text', () => text('Hello World'));

    const client = testClient(app);
    const res = await client.get('/text');

    expect(res.raw).toBeInstanceOf(Response);
    expect(await res.text()).toBe('Hello World');
  });

  it('should handle 404 routes', async () => {
    const app = new ThanhHoa();
    app.get('/exists', () => json({ ok: true }));

    const client = testClient(app);
    const res = await client.get('/not-exists');

    expect(res.status).toBe(404);
  });

  it('should work with middleware', async () => {
    const app = new ThanhHoa();
    app.use(async (ctx, next) => {
      const res = await next();
      res.headers.set('X-Custom', 'middleware-applied');
      return res;
    });
    app.get('/test', () => json({ ok: true }));

    const client = testClient(app);
    const res = await client.get('/test');

    expect(res.headers.get('X-Custom')).toBe('middleware-applied');
  });
});
