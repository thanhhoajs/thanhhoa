import { describe, expect, it } from 'bun:test';
import { etag } from '../../src/middleware/etag';
import { ThanhHoa, json } from '../../src/index';
import { testClient } from '../../src/utils/test-client';

describe('etag middleware', () => {
  it('should add ETag header to response', async () => {
    const app = new ThanhHoa();
    app.use(etag());
    app.get('/test', () => json({ message: 'hello' }));

    const client = testClient(app);
    const res = await client.get('/test');

    expect(res.status).toBe(200);
    expect(res.headers.has('ETag')).toBe(true);
    expect(res.headers.get('ETag')).toMatch(/^W\/"[a-z0-9]+"/);
  });

  it('should return 304 when If-None-Match matches', async () => {
    const app = new ThanhHoa();
    app.use(etag());
    app.get('/test', () => json({ message: 'hello' }));

    const client = testClient(app);

    // First request to get ETag
    const res1 = await client.get('/test');
    const etagValue = res1.headers.get('ETag');

    // Second request with If-None-Match
    const res2 = await client.get('/test', {
      headers: { 'If-None-Match': etagValue! },
    });

    expect(res2.status).toBe(304);
  });

  it('should use strong ETag when weak is false', async () => {
    const app = new ThanhHoa();
    app.use(etag({ weak: false }));
    app.get('/test', () => json({ message: 'hello' }));

    const client = testClient(app);
    const res = await client.get('/test');

    expect(res.headers.get('ETag')).toMatch(/^"[a-z0-9]+"/);
    expect(res.headers.get('ETag')).not.toMatch(/^W\//);
  });

  it('should skip if response already has ETag', async () => {
    const app = new ThanhHoa();
    app.use(etag());
    app.get(
      '/test',
      () =>
        new Response(JSON.stringify({ data: 'test' }), {
          headers: { ETag: '"custom-etag"' },
        }),
    );

    const client = testClient(app);
    const res = await client.get('/test');

    expect(res.headers.get('ETag')).toBe('"custom-etag"');
  });

  it('should skip for non-2xx responses', async () => {
    const app = new ThanhHoa();
    app.use(etag());
    app.get('/error', () => json({ error: 'not found' }, 404));

    const client = testClient(app);
    const res = await client.get('/error');

    expect(res.status).toBe(404);
    expect(res.headers.has('ETag')).toBe(false);
  });
});
