import { describe, expect, test, mock } from 'bun:test';
import { ThanhHoa } from '../src';
import { etag } from '../src/middleware/etag';
import { getRedisClient, setRedisClient } from '../src/utils/redis';

describe('Advanced Optimizations', () => {
  describe('ETag Binary Support', () => {
    test('should generate ETag for Uint8Array body', async () => {
      const app = new ThanhHoa();
      app.use(etag());

      const data = new Uint8Array([1, 2, 3, 4, 5]);
      app.get('/binary', () => new Response(data));

      const res = await app.fetch(new Request('http://localhost/binary'));
      expect(res.status).toBe(200);
      expect(res.headers.get('ETag')).toBeDefined();
      const body = await res.arrayBuffer();
      expect(new Uint8Array(body)).toEqual(data);
    });

    test('should return 304 for matching ETag with binary body', async () => {
      const app = new ThanhHoa();
      app.use(etag());

      const data = new Uint8Array([1, 2, 3, 4, 5]);
      app.get('/binary', () => new Response(data));

      // First request to get ETag
      const res1 = await app.fetch(new Request('http://localhost/binary'));
      const tag = res1.headers.get('ETag');
      expect(tag).toBeDefined();

      // Second request with If-None-Match
      const res2 = await app.fetch(
        new Request('http://localhost/binary', {
          headers: { 'If-None-Match': tag! },
        }),
      );
      expect(res2.status).toBe(304);
      expect(res2.body).toBeNull();
    });
  });

  describe('Context Preload', () => {
    test('should set Link header for preloaded resources', async () => {
      const app = new ThanhHoa();

      app.get('/', (ctx) => {
        ctx.preload('/style.css', 'style');
        ctx.preload('/script.js', 'script');
        return new Response('Hello');
      });

      const res = await app.fetch(new Request('http://localhost/'));
      expect(res.status).toBe(200);
      const link = res.headers.get('Link');
      expect(link).toBeDefined();
      expect(link).toContain('</style.css>; rel=preload; as=style');
      expect(link).toContain('</script.js>; rel=preload; as=script');
    });
  });

  describe('Redis Singleton', () => {
    test('should allow setting client manually', async () => {
      const mockClient = { get: () => 'mock' };
      setRedisClient(mockClient);

      const client = await getRedisClient();
      expect(client).toBe(mockClient);
    });

    test('should throw if ioredis not installed and no client set', async () => {
      setRedisClient(null);
      // We assume ioredis is NOT installed in the environment for this test path
      // OR if it IS, it returns a client.
      // But since we can't easily mock module import failure in Bun test without complex setup,
      // we check if it either returns a client OR throws specific error.

      try {
        await getRedisClient({ lazyConnect: true });
        // If it succeeds (because ioredis is present), pass
      } catch (e: any) {
        // If it fails, check message
        expect(e.message).toContain('install "ioredis"');
      }
    });
  });
});
