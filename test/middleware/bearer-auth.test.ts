import { describe, expect, it } from 'bun:test';
import { bearerAuth } from '../../src/middleware/bearer-auth';
import { ThanhHoa, json } from '../../src/index';
import { testClient } from '../../src/utils/test-client';

const API_KEY = 'test-api-key-12345';

describe('bearerAuth middleware', () => {
  it('should reject requests without Authorization header', async () => {
    const app = new ThanhHoa();
    app.use(bearerAuth({ token: API_KEY }));
    app.get('/api', () => json({ data: 'secret' }));

    const client = testClient(app);
    const res = await client.get('/api');

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Missing or invalid authorization header');
  });

  it('should allow valid token', async () => {
    const app = new ThanhHoa();
    app.use(bearerAuth({ token: API_KEY }));
    app.get('/api', (ctx) => json({ token: (ctx as any).bearerToken }));

    const client = testClient(app);
    const res = await client.get('/api', {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe(API_KEY);
  });

  it('should reject invalid token', async () => {
    const app = new ThanhHoa();
    app.use(bearerAuth({ token: API_KEY }));
    app.get('/api', () => json({ data: 'secret' }));

    const client = testClient(app);
    const res = await client.get('/api', {
      headers: { Authorization: 'Bearer wrong-token' },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid token');
  });

  it('should skip paths in skip array', async () => {
    const app = new ThanhHoa();
    app.use(bearerAuth({ token: API_KEY, skip: ['/health'] }));
    app.get('/health', () => json({ status: 'ok' }));
    app.get('/api', () => json({ data: 'secret' }));

    const client = testClient(app);

    const healthRes = await client.get('/health');
    expect(healthRes.status).toBe(200);

    const apiRes = await client.get('/api');
    expect(apiRes.status).toBe(401);
  });

  it('should use custom validate function', async () => {
    const validTokens = ['token1', 'token2', 'token3'];

    const app = new ThanhHoa();
    app.use(
      bearerAuth({
        validate: (token) => validTokens.includes(token),
      }),
    );
    app.get('/api', () => json({ data: 'secret' }));

    const client = testClient(app);

    const validRes = await client.get('/api', {
      headers: { Authorization: 'Bearer token2' },
    });
    expect(validRes.status).toBe(200);

    const invalidRes = await client.get('/api', {
      headers: { Authorization: 'Bearer token4' },
    });
    expect(invalidRes.status).toBe(401);
  });

  it('should use custom prefix', async () => {
    const app = new ThanhHoa();
    app.use(bearerAuth({ token: API_KEY, prefix: 'ApiKey' }));
    app.get('/api', () => json({ data: 'secret' }));

    const client = testClient(app);
    const res = await client.get('/api', {
      headers: { Authorization: `ApiKey ${API_KEY}` },
    });

    expect(res.status).toBe(200);
  });
});
