import { describe, expect, it } from 'bun:test';
import { jwt, signToken, decodeToken } from '../../src/middleware/jwt';
import { ThanhHoa, json } from '../../src/index';
import { testClient } from '../../src/utils/test-client';

const SECRET = 'test-secret-key-for-jwt-testing';

describe('jwt middleware', () => {
  describe('signToken', () => {
    it('should sign a token with HS256', async () => {
      const token = await signToken({ userId: 1 }, SECRET);

      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3);
    });

    it('should include iat in payload', async () => {
      const token = await signToken({ userId: 1 }, SECRET);
      const decoded = decodeToken(token);

      expect(decoded?.iat).toBeDefined();
      expect(typeof decoded?.iat).toBe('number');
    });

    it('should include exp when expiresIn is provided', async () => {
      const token = await signToken({ userId: 1 }, SECRET, { expiresIn: 3600 });
      const decoded = decodeToken(token);

      expect(decoded?.exp).toBeDefined();
      expect(decoded?.exp).toBeGreaterThan(decoded?.iat!);
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token', async () => {
      const token = await signToken({ userId: 123, name: 'test' }, SECRET);
      const decoded = decodeToken(token);

      expect(decoded?.userId).toBe(123);
      expect(decoded?.name).toBe('test');
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid.token');
      expect(decoded).toBeNull();
    });
  });

  describe('jwt middleware', () => {
    it('should reject requests without token', async () => {
      const app = new ThanhHoa();
      app.use(jwt({ secret: SECRET }));
      app.get('/protected', () => json({ message: 'secret' }));

      const client = testClient(app);
      const res = await client.get('/protected');

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Missing authentication token');
    });

    it('should allow requests with valid token', async () => {
      const app = new ThanhHoa();
      app.use(jwt({ secret: SECRET }));
      app.get('/protected', (ctx) => json({ user: (ctx as any).jwtPayload }));

      const token = await signToken({ userId: 1 }, SECRET);
      const client = testClient(app);
      const res = await client.get('/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.userId).toBe(1);
    });

    it('should reject expired tokens', async () => {
      const app = new ThanhHoa();
      app.use(jwt({ secret: SECRET }));
      app.get('/protected', () => json({ message: 'secret' }));

      // Create token that expired 1 second ago
      const token = await signToken({ userId: 1 }, SECRET, { expiresIn: -1 });
      const client = testClient(app);
      const res = await client.get('/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(401);
    });

    it('should skip paths in skip array', async () => {
      const app = new ThanhHoa();
      app.use(jwt({ secret: SECRET, skip: ['/public'] }));
      app.get('/public', () => json({ message: 'public' }));
      app.get('/protected', () => json({ message: 'secret' }));

      const client = testClient(app);

      // Public path should work without token
      const publicRes = await client.get('/public');
      expect(publicRes.status).toBe(200);

      // Protected path should require token
      const protectedRes = await client.get('/protected');
      expect(protectedRes.status).toBe(401);
    });

    it('should reject token with wrong secret', async () => {
      const app = new ThanhHoa();
      app.use(jwt({ secret: SECRET }));
      app.get('/protected', () => json({ message: 'secret' }));

      const token = await signToken({ userId: 1 }, 'wrong-secret');
      const client = testClient(app);
      const res = await client.get('/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status).toBe(401);
    });
  });
});
