import { describe, expect, it } from 'bun:test';
import { csrf, generateCSRFToken } from '../../src/middleware/csrf';
import { ThanhHoa, json, html } from '../../src/index';
import { testClient } from '../../src/utils/test-client';

describe('csrf middleware', () => {
  describe('generateCSRFToken', () => {
    it('should generate token with default length', () => {
      const token = generateCSRFToken();
      // 32 bytes = 64 hex characters
      expect(token.length).toBe(64);
    });

    it('should generate token with custom length', () => {
      const token = generateCSRFToken(16);
      // 16 bytes = 32 hex characters
      expect(token.length).toBe(32);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('csrf middleware', () => {
    it('should set CSRF token on GET requests', async () => {
      const app = new ThanhHoa();
      app.use(csrf());
      app.get('/form', (ctx) => json({ token: (ctx as any).csrfToken }));

      const client = testClient(app);
      const res = await client.get('/form');

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.token).toBeDefined();
      expect(body.token.length).toBe(64);
    });

    it('should allow GET requests without validation', async () => {
      const app = new ThanhHoa();
      app.use(csrf());
      app.get('/data', () => json({ data: 'test' }));

      const client = testClient(app);
      const res = await client.get('/data');

      expect(res.status).toBe(200);
    });

    it('should reject POST without CSRF token', async () => {
      const app = new ThanhHoa();
      app.use(csrf());
      app.post('/submit', () => json({ success: true }));

      const client = testClient(app);
      const res = await client.post('/submit', {
        body: { data: 'test' },
      });

      expect(res.status).toBe(403);
    });

    it('should skip paths in skip array', async () => {
      const app = new ThanhHoa();
      app.use(csrf({ skip: ['/api'] }));
      app.post('/api/webhook', () => json({ received: true }));
      app.post('/form', () => json({ success: true }));

      const client = testClient(app);

      // API should skip CSRF
      const apiRes = await client.post('/api/webhook', {
        body: { data: 'test' },
      });
      expect(apiRes.status).toBe(200);

      // Form should require CSRF
      const formRes = await client.post('/form', {
        body: { data: 'test' },
      });
      expect(formRes.status).toBe(403);
    });
  });
});
