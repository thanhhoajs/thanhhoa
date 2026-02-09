import { describe, expect, it } from 'bun:test';
import {
  rateLimit,
  MemoryStore,
  RedisStore,
} from '../../src/middleware/rate-limit';
import { ThanhHoa, json } from '../../src/index';
import { testClient } from '../../src/utils/test-client';

describe('rateLimit middleware', () => {
  describe('MemoryStore', () => {
    it('should create MemoryStore instance', () => {
      const store = new MemoryStore();
      expect(store).toBeDefined();
    });

    it('should increment and return info', async () => {
      const store = new MemoryStore();
      const info = await store.increment('test-key', 60000);

      expect(info.total).toBe(1);
      expect(info.resetTime).toBeGreaterThan(Date.now());
    });

    it('should track multiple increments', async () => {
      const store = new MemoryStore();

      await store.increment('key1', 60000);
      await store.increment('key1', 60000);
      const info = await store.increment('key1', 60000);

      expect(info.total).toBe(3);
    });
  });

  describe('rateLimit middleware', () => {
    it('should allow requests under limit', async () => {
      const app = new ThanhHoa();
      app.use(rateLimit({ max: 5, windowMs: 60000 }));
      app.get('/test', () => json({ ok: true }));

      const client = testClient(app);

      for (let i = 0; i < 5; i++) {
        const res = await client.get('/test');
        expect(res.status).toBe(200);
      }
    });

    it('should block requests over limit', async () => {
      const app = new ThanhHoa();
      app.use(rateLimit({ max: 3, windowMs: 60000, store: new MemoryStore() }));
      app.get('/test', () => json({ ok: true }));

      const client = testClient(app);

      // First 3 should pass
      for (let i = 0; i < 3; i++) {
        const res = await client.get('/test');
        expect(res.status).toBe(200);
      }

      // 4th should be blocked
      const res = await client.get('/test');
      expect(res.status).toBe(429);
    });

    it('should include rate limit headers', async () => {
      const app = new ThanhHoa();
      app.use(rateLimit({ max: 10, windowMs: 60000 }));
      app.get('/test', () => json({ ok: true }));

      const client = testClient(app);
      const res = await client.get('/test');

      expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should skip paths in skip array', async () => {
      const app = new ThanhHoa();
      app.use(
        rateLimit({
          max: 1,
          windowMs: 60000,
          skip: ['/health'],
          store: new MemoryStore(),
        }),
      );
      app.get('/health', () => json({ status: 'ok' }));
      app.get('/api', () => json({ data: 'test' }));

      const client = testClient(app);

      // Health should always work (skipped)
      for (let i = 0; i < 5; i++) {
        const res = await client.get('/health');
        expect(res.status).toBe(200);
      }

      // API should be limited after 1 request
      const res1 = await client.get('/api');
      expect(res1.status).toBe(200);

      const res2 = await client.get('/api');
      expect(res2.status).toBe(429);
    });

    it('should use custom key generator', async () => {
      const app = new ThanhHoa();
      app.use(
        rateLimit({
          max: 2,
          windowMs: 60000,
          keyGenerator: (req) => req.headers.get('X-User-ID') || 'anonymous',
          store: new MemoryStore(),
        }),
      );
      app.get('/test', () => json({ ok: true }));

      const client = testClient(app);

      // User 1 - 2 requests should pass
      for (let i = 0; i < 2; i++) {
        const res = await client.get('/test', {
          headers: { 'X-User-ID': 'user1' },
        });
        expect(res.status).toBe(200);
      }

      // User 1 - 3rd should fail
      const blockedRes = await client.get('/test', {
        headers: { 'X-User-ID': 'user1' },
      });
      expect(blockedRes.status).toBe(429);

      // User 2 - should still work
      const user2Res = await client.get('/test', {
        headers: { 'X-User-ID': 'user2' },
      });
      expect(user2Res.status).toBe(200);
    });

    it('should use custom message', async () => {
      const app = new ThanhHoa();
      app.use(
        rateLimit({
          max: 1,
          windowMs: 60000,
          message: { error: 'Rate limited!' },
          store: new MemoryStore(),
        }),
      );
      app.get('/test', () => json({ ok: true }));

      const client = testClient(app);

      await client.get('/test'); // Use up limit
      const res = await client.get('/test');

      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error).toBe('Rate limited!');
    });
  });
});
