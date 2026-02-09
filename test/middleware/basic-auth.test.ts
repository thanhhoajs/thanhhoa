import { describe, expect, it } from 'bun:test';
import { basicAuth } from '../../src/middleware/basic-auth';
import { ThanhHoa, json } from '../../src/index';
import { testClient } from '../../src/utils/test-client';

const encodeCredentials = (username: string, password: string): string => {
  return btoa(`${username}:${password}`);
};

describe('basicAuth middleware', () => {
  it('should reject requests without Authorization header', async () => {
    const app = new ThanhHoa();
    app.use(basicAuth({ username: 'admin', password: 'secret' }));
    app.get('/protected', () => json({ message: 'secret' }));

    const client = testClient(app);
    const res = await client.get('/protected');

    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toContain('Basic');
  });

  it('should allow valid credentials', async () => {
    const app = new ThanhHoa();
    app.use(basicAuth({ username: 'admin', password: 'secret' }));
    app.get('/protected', (ctx) => json({ user: (ctx as any).basicAuthUser }));

    const client = testClient(app);
    const res = await client.get('/protected', {
      headers: {
        Authorization: `Basic ${encodeCredentials('admin', 'secret')}`,
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBe('admin');
  });

  it('should reject invalid credentials', async () => {
    const app = new ThanhHoa();
    app.use(basicAuth({ username: 'admin', password: 'secret' }));
    app.get('/protected', () => json({ message: 'secret' }));

    const client = testClient(app);
    const res = await client.get('/protected', {
      headers: {
        Authorization: `Basic ${encodeCredentials('admin', 'wrong')}`,
      },
    });

    expect(res.status).toBe(401);
  });

  it('should use custom realm', async () => {
    const app = new ThanhHoa();
    app.use(
      basicAuth({ username: 'admin', password: 'secret', realm: 'Admin Area' }),
    );
    app.get('/protected', () => json({ message: 'secret' }));

    const client = testClient(app);
    const res = await client.get('/protected');

    expect(res.headers.get('WWW-Authenticate')).toContain('Admin Area');
  });

  it('should skip paths in skip array', async () => {
    const app = new ThanhHoa();
    app.use(
      basicAuth({ username: 'admin', password: 'secret', skip: ['/public'] }),
    );
    app.get('/public', () => json({ message: 'public' }));
    app.get('/protected', () => json({ message: 'secret' }));

    const client = testClient(app);

    const publicRes = await client.get('/public');
    expect(publicRes.status).toBe(200);

    const protectedRes = await client.get('/protected');
    expect(protectedRes.status).toBe(401);
  });

  it('should use custom validate function', async () => {
    const app = new ThanhHoa();
    app.use(
      basicAuth({
        username: '',
        password: '',
        validate: async (user, pass) => {
          return user === 'custom' && pass === 'password';
        },
      }),
    );
    app.get('/protected', () => json({ message: 'secret' }));

    const client = testClient(app);
    const res = await client.get('/protected', {
      headers: {
        Authorization: `Basic ${encodeCredentials('custom', 'password')}`,
      },
    });

    expect(res.status).toBe(200);
  });
});
